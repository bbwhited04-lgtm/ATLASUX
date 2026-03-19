/**
 * KB Eval Engine — detect problems across 6 dimensions.
 */
import { prisma } from "../../db/prisma.js";
import { queryTiered, queryPinecone, embedText } from "../../lib/pinecone.js";
import { loadEnv } from "../../env.js";

export type KbIssue = {
  type: "orphan" | "stale" | "retrieval_regression" | "misleading" | "coverage_gap" | "duplicate";
  severity: "low" | "medium" | "high";
  riskTier: number;       // 0-3
  confidence: number;     // 0-1
  estimatedCostUsd: number;
  documentId?: string;
  chunkId?: string;
  description: string;
  suggestedAction: string;
};

type GoldenQuery = {
  id: string;
  query: string;
  querySource: string;
  expectedDocumentIds: string[];
  expectedAnswer: string | null;
  category: string | null;
  tier: string | null;
};

const TENANT_ID = "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";
const EMBED_COST_PER_1K = 0.00002; // text-embedding-3-small

/** Slug prefixes to exclude from eval — these are system-generated, not real KB content */
const EXCLUDED_SLUG_PREFIXES = ["tripwire-"];

// --- Detect Orphans ---
export async function detectOrphans(tenantId: string = TENANT_ID): Promise<KbIssue[]> {
  const issues: KbIssue[] = [];

  const docs = await prisma.kbDocument.findMany({
    where: { tenantId, status: "published" },
    select: { id: true, slug: true, title: true, tier: true },
  });

  // Filter out system-generated docs (tripwire clips, etc.)
  const realDocs = docs.filter(d => !EXCLUDED_SLUG_PREFIXES.some(p => d.slug.startsWith(p)));

  // Sample 50 docs and check if they have any similarity matches
  const sample = realDocs.sort(() => Math.random() - 0.5).slice(0, 50);

  for (const doc of sample) {
    try {
      const tier = doc.tier ?? "tenant";
      const ns =
        tier === "public" ? "public" : tier === "internal" ? "internal" : `tenant-${tenantId}`;

      // Query using the doc title as a proxy for "can this doc be found?"
      const hits = await queryPinecone({
        tenantId: tier === "public" ? "" : tenantId,
        query: doc.title,
        topK: 3,
        minScore: 0.3,
        namespace: ns,
      });

      // If the doc itself isn't in results (no self-match), it may be orphaned
      const selfHit = hits.find(h => h.documentId === doc.id);
      if (!selfHit && hits.length === 0) {
        issues.push({
          type: "orphan",
          severity: "medium",
          riskTier: 0,
          confidence: 0.8,
          estimatedCostUsd: EMBED_COST_PER_1K * 2, // re-embed cost
          documentId: doc.id,
          description: `Doc "${doc.title}" (${doc.slug}) not found in vector space`,
          suggestedAction: "relink",
        });
      }
    } catch {
      // Skip individual doc failures
    }
  }

  return issues;
}

// --- Detect Stale Docs ---
export async function detectStaleDocs(tenantId: string = TENANT_ID): Promise<KbIssue[]> {
  const issues: KbIssue[] = [];

  // Require at least 3 eval runs before flagging stale docs (avoids noise on early runs)
  const runCount = await prisma.kbEvalRun.count({ where: { tenantId } });
  if (runCount < 3) return issues;

  // Find docs that were never retrieved in any eval result in the last 14 days
  const recentResults = await prisma.kbEvalResult.findMany({
    where: {
      run: { tenantId },
      createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
    select: { retrievedDocumentIds: true },
  });

  const retrievedIds = new Set<string>();
  for (const r of recentResults) {
    for (const id of r.retrievedDocumentIds) retrievedIds.add(id);
  }

  if (recentResults.length === 0) return issues;

  const allDocs = await prisma.kbDocument.findMany({
    where: { tenantId, status: "published" },
    select: { id: true, slug: true, title: true },
  });

  // Filter out system-generated docs (tripwire clips, etc.)
  const realDocs = allDocs.filter(d => !EXCLUDED_SLUG_PREFIXES.some(p => d.slug.startsWith(p)));

  // Cap stale issues at 50 per run to prevent decision memo flooding
  const MAX_STALE = 50;
  for (const doc of realDocs) {
    if (issues.length >= MAX_STALE) break;
    if (!retrievedIds.has(doc.id)) {
      issues.push({
        type: "stale",
        severity: "low",
        riskTier: 1,
        confidence: 0.6,
        estimatedCostUsd: EMBED_COST_PER_1K * 2,
        documentId: doc.id,
        description: `Doc "${doc.title}" (${doc.slug}) not retrieved by any golden query in 14 days`,
        suggestedAction: "re-embed",
      });
    }
  }

  return issues;
}

// --- Detect Retrieval Regressions ---
export type RetrievalMetrics = {
  queryId: string;
  recall: number;
  precision: number;
  mrr: number;
  retrievedIds: string[];
  latencyMs: number;
};

export async function detectRetrievalRegressions(
  tenantId: string,
  goldenQueries: GoldenQuery[],
): Promise<{ metrics: RetrievalMetrics[]; issues: KbIssue[] }> {
  const metrics: RetrievalMetrics[] = [];
  const issues: KbIssue[] = [];
  const K = 5;

  // Build slug → UUID map for resolving expectedDocumentIds (which are slugs)
  const slugToId = new Map<string, string>();
  const allDocs = await prisma.kbDocument.findMany({
    where: { tenantId, status: "published" },
    select: { id: true, slug: true },
  });
  for (const d of allDocs) slugToId.set(d.slug, d.id);

  for (const gq of goldenQueries) {
    const start = Date.now();
    try {
      const tiers: Array<"public" | "internal" | "tenant"> =
        gq.querySource === "admin"
          ? ["public", "internal"]
          : gq.querySource === "engine"
            ? ["public", "internal", "tenant"]
            : ["public", "tenant"];

      const hits = await queryTiered({ tenantId, query: gq.query, tiers, topK: K, minScore: 0.2 });
      const latencyMs = Date.now() - start;
      const retrievedIds = hits.map(h => h.documentId);

      // Compute recall@K — resolve slug-based expectedDocumentIds to UUIDs
      const expectedUuids = gq.expectedDocumentIds
        .map(slug => slugToId.get(slug) ?? slug) // fall back to raw value if already a UUID
        .filter(Boolean);
      const relevant = new Set(expectedUuids);
      const found = retrievedIds.filter(id => relevant.has(id));
      const recall = relevant.size > 0 ? found.length / relevant.size : 1;

      // Compute precision@K
      const precision = retrievedIds.length > 0 ? found.length / retrievedIds.length : 0;

      // Compute MRR
      let mrr = 0;
      for (let i = 0; i < retrievedIds.length; i++) {
        if (relevant.has(retrievedIds[i])) {
          mrr = 1 / (i + 1);
          break;
        }
      }

      metrics.push({ queryId: gq.id, recall, precision, mrr, retrievedIds, latencyMs });

      if (recall < 0.5) {
        issues.push({
          type: "retrieval_regression",
          severity: recall === 0 ? "high" : "medium",
          riskTier: 1,
          confidence: 0.9,
          estimatedCostUsd: EMBED_COST_PER_1K * gq.expectedDocumentIds.length * 2,
          description: `Query "${gq.query.slice(0, 80)}" — recall@${K}: ${(recall * 100).toFixed(0)}% (expected docs: ${gq.expectedDocumentIds.join(", ")})`,
          suggestedAction: "re-embed",
        });
      }
    } catch {
      metrics.push({
        queryId: gq.id,
        recall: 0,
        precision: 0,
        mrr: 0,
        retrievedIds: [],
        latencyMs: Date.now() - start,
      });
    }
  }

  return { metrics, issues };
}

// --- Detect Duplicates ---
export async function detectDuplicates(tenantId: string = TENANT_ID): Promise<KbIssue[]> {
  const issues: KbIssue[] = [];

  const chunks = await prisma.kbChunk.findMany({
    where: { tenantId },
    select: { id: true, documentId: true, content: true },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  if (chunks.length < 2) return issues;

  const sampleSize = Math.min(30, chunks.length);
  const sample = chunks.slice(0, sampleSize);

  const embeddings = await Promise.all(
    sample.map(c => embedText(c.content.slice(0, 500)).catch(() => null)),
  );

  for (let i = 0; i < sample.length; i++) {
    if (!embeddings[i]) continue;
    for (let j = i + 1; j < sample.length; j++) {
      if (!embeddings[j]) continue;
      if (sample[i].documentId === sample[j].documentId) continue; // same doc is fine

      const sim = cosineSim(embeddings[i]!, embeddings[j]!);
      if (sim > 0.95) {
        issues.push({
          type: "duplicate",
          severity: "low",
          riskTier: 2,
          confidence: sim,
          estimatedCostUsd: 0,
          chunkId: sample[i].id,
          description: `Chunk ${sample[i].id} ↔ ${sample[j].id} similarity: ${sim.toFixed(3)} (different docs: ${sample[i].documentId} vs ${sample[j].documentId})`,
          suggestedAction: "merge",
        });
      }
    }
  }

  return issues;
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- Run Full Eval ---
export type EvalResult = {
  issues: KbIssue[];
  retrievalMetrics: RetrievalMetrics[];
  avgRecall: number;
  avgPrecision: number;
  avgMrr: number;
  orphanCount: number;
  staleCount: number;
  duplicateCount: number;
  totalDocs: number;
  totalChunks: number;
};

export async function runFullEval(
  tenantId: string = TENANT_ID,
  goldenQueries: GoldenQuery[],
): Promise<EvalResult> {
  const allIssues: KbIssue[] = [];

  // 1. Retrieval regressions
  const { metrics, issues: retrievalIssues } = await detectRetrievalRegressions(
    tenantId,
    goldenQueries,
  );
  allIssues.push(...retrievalIssues);

  // 2. Orphans
  const orphanIssues = await detectOrphans(tenantId);
  allIssues.push(...orphanIssues);

  // 3. Stale docs
  const staleIssues = await detectStaleDocs(tenantId);
  allIssues.push(...staleIssues);

  // 4. Duplicates
  const dupIssues = await detectDuplicates(tenantId);
  allIssues.push(...dupIssues);

  // Compute averages
  const avgRecall =
    metrics.length > 0 ? metrics.reduce((s, m) => s + m.recall, 0) / metrics.length : 0;
  const avgPrecision =
    metrics.length > 0 ? metrics.reduce((s, m) => s + m.precision, 0) / metrics.length : 0;
  const avgMrr =
    metrics.length > 0 ? metrics.reduce((s, m) => s + m.mrr, 0) / metrics.length : 0;

  const totalDocs = await prisma.kbDocument.count({ where: { tenantId, status: "published" } });
  const totalChunks = await prisma.kbChunk.count({ where: { tenantId } });

  return {
    issues: allIssues,
    retrievalMetrics: metrics,
    avgRecall,
    avgPrecision,
    avgMrr,
    orphanCount: orphanIssues.length,
    staleCount: staleIssues.length,
    duplicateCount: dupIssues.length,
    totalDocs,
    totalChunks,
  };
}
