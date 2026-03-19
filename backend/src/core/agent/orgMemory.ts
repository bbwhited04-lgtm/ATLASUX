/**
 * Org Memory — persistent organizational learning that transcends individual sessions.
 *
 * Unlike AgentMemory (per-session, per-agent, ephemeral), OrgMemory stores
 * durable cross-agent insights that make the entire organization smarter.
 *
 * Storage: org_memories table + Pinecone atlas-kb index (slug: "org-memory")
 * Access: recall_org_memory tool (vector search), store_org_memory tool (write)
 */

import { prisma } from "../../db/prisma.js";
import { embedText, upsertChunks, queryPinecone, queryTiered } from "../../lib/pinecone.js";
import { emitHealEvent } from "../../lib/kbHealEmitter.js";
import type { VectorHit } from "../../lib/pinecone.js";

// ── Types ────────────────────────────────────────────────────────────────────

export type OrgMemoryCategory =
  | "preference"
  | "insight"
  | "pattern"
  | "outcome"
  | "glossary"
  | "relationship";

export interface OrgMemoryHit {
  id: string;
  category: string;
  content: string;
  source: string;
  confidence: number;
  score: number;
  createdAt: Date;
}

// ── Category classifier ──────────────────────────────────────────────────────

export function classifyMemoryCategory(content: string): OrgMemoryCategory {
  const c = content.toLowerCase();
  if (/\b(prefer|likes?|wants?|always|never|favorite|style|tone)\b/.test(c)) return "preference";
  if (/\b(result|outcome|led to|caused|because|worked|failed|success)\b/.test(c)) return "outcome";
  if (/\b(pattern|trend|recurring|always happens|every (time|week|month))\b/.test(c)) return "pattern";
  if (/\b(means?|definition|glossary|acronym|stands for|refers to)\b/.test(c)) return "glossary";
  if (/\b(relationship|partner|works with|reports to|knows|connected)\b/.test(c)) return "relationship";
  return "insight";
}

// ── Store ────────────────────────────────────────────────────────────────────

export async function storeOrgMemory(params: {
  tenantId: string;
  category: OrgMemoryCategory;
  content: string;
  source: string;
  sourceId?: string;
  confidence?: number;
  tags?: string[];
  validUntil?: Date;
}): Promise<{ id: string; isDuplicate: boolean }> {
  const {
    tenantId, category, content, source,
    sourceId, confidence = 0.7, tags = [], validUntil,
  } = params;

  // De-duplicate: check if a very similar memory already exists (within tenant namespace)
  const tenantNs = `tenant-${tenantId}`;
  try {
    const existing = await queryPinecone({
      tenantId,
      query: content,
      topK: 1,
      minScore: 0.92,
      namespace: tenantNs,
    });

    const dup = existing.find(
      h => (h as any).chunkId?.startsWith("org-mem-"),
    );

    if (dup) {
      // Update confidence and timestamp on the existing memory
      const existingId = dup.documentId;
      await prisma.orgMemory.update({
        where: { id: existingId },
        data: {
          confidence: Math.min(1.0, confidence + 0.05),
          accessCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      }).catch(() => {});
      return { id: existingId, isDuplicate: true };
    }
  } catch {
    // Pinecone unavailable — skip de-dup, proceed with store
  }

  // Create the memory record
  const row = await prisma.orgMemory.create({
    data: {
      tenantId,
      category,
      content: content.slice(0, 4000),
      source,
      sourceId: sourceId ?? null,
      confidence,
      tags,
      validUntil: validUntil ?? null,
    },
  });

  // Upsert embedding to Pinecone (same atlas-kb index, distinguished by slug)
  try {
    await upsertChunks([{
      id: `org-mem-${row.id}`,
      content: content.slice(0, 3600),
      tenantId,
      documentId: row.id,
      slug: "org-memory",
      title: `${category}: ${content.slice(0, 80)}`,
      tier: "tenant",
    }], `tenant-${tenantId}`);
  } catch {
    // Non-fatal — memory is in Postgres even if embedding fails
  }

  return { id: row.id, isDuplicate: false };
}

// ── Recall ───────────────────────────────────────────────────────────────────

export async function recallOrgMemory(params: {
  tenantId: string;
  query: string;
  category?: string;
  topK?: number;
  minScore?: number;
}): Promise<{ memories: OrgMemoryHit[]; text: string }> {
  const { tenantId, query, topK = 8, minScore = 0.3 } = params;

  let hits: VectorHit[] = [];

  // Try Pinecone vector search first
  try {
    hits = await queryPinecone({ tenantId, query, topK: topK + 4, minScore, namespace: `tenant-${tenantId}` });
    // Filter to only org-memory vectors
    hits = hits.filter(h => h.chunkId.startsWith("org-mem-"));

    // Reactive heal: detect duplicate memories (>0.95 similarity between top results)
    if (hits.length >= 2 && hits[0].score > 0.95 && hits[1].score > 0.95) {
      const scoreDiff = Math.abs(hits[0].score - hits[1].score);
      if (scoreDiff < 0.02 && hits[0].documentId !== hits[1].documentId) {
        emitHealEvent({
          trigger: "reactive",
          query,
          agentId: "orgMemory",
          tenantId,
          errorType: "memory_corruption",
          context: `Duplicate memories detected: ${hits[0].documentId} vs ${hits[1].documentId} (scores: ${hits[0].score.toFixed(3)}, ${hits[1].score.toFixed(3)})`,
        });
      }
    }
  } catch {
    // Pinecone unavailable — fall back to SQL
  }

  let memories: OrgMemoryHit[] = [];

  if (hits.length > 0) {
    // Map vector hits to full Prisma records
    const docIds = hits.map(h => h.documentId);
    const rows = await prisma.orgMemory.findMany({
      where: {
        tenantId,
        id: { in: docIds },
        confidence: { gte: 0.2 },
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
    });

    const rowMap = new Map(rows.map(r => [r.id, r]));
    memories = hits
      .map(h => {
        const row = rowMap.get(h.documentId);
        if (!row) return null;
        return {
          id: row.id,
          category: row.category,
          content: row.content,
          source: row.source,
          confidence: row.confidence,
          score: h.score,
          createdAt: row.createdAt,
        };
      })
      .filter((m): m is OrgMemoryHit => m !== null)
      .slice(0, topK);
  } else {
    // SQL fallback: keyword search
    const words = query.split(/\s+/).filter(w => w.length >= 3).slice(0, 5);
    if (words.length > 0) {
      const rows = await prisma.orgMemory.findMany({
        where: {
          tenantId,
          confidence: { gte: 0.2 },
          OR: [
            ...words.map(w => ({ content: { contains: w, mode: "insensitive" as const } })),
          ],
        },
        orderBy: { accessCount: "desc" },
        take: topK,
      });

      memories = rows.map(r => ({
        id: r.id,
        category: r.category,
        content: r.content,
        source: r.source,
        confidence: r.confidence,
        score: 0.5,
        createdAt: r.createdAt,
      }));
    }
  }

  // Update access counts (fire-and-forget)
  if (memories.length > 0) {
    const ids = memories.map(m => m.id);
    prisma.orgMemory.updateMany({
      where: { id: { in: ids } },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    }).catch(() => {});
  }

  // Format text block for injection
  const text = memories
    .map((m, i) => {
      const age = Math.floor((Date.now() - m.createdAt.getTime()) / 86_400_000);
      return `${i + 1}. [${m.category}] ${m.content} (source: ${m.source}, ${age}d ago, conf: ${m.confidence.toFixed(1)})`;
    })
    .join("\n");

  return { memories, text };
}

// ── Supersede ────────────────────────────────────────────────────────────────

export async function supersedeMemory(params: {
  tenantId: string;
  oldMemoryId: string;
  newContent: string;
  source: string;
}): Promise<{ newId: string }> {
  const { tenantId, oldMemoryId, newContent, source } = params;

  const old = await prisma.orgMemory.findFirst({
    where: { id: oldMemoryId, tenantId },
  });

  const category = old ? (old.category as OrgMemoryCategory) : classifyMemoryCategory(newContent);
  const tags = old?.tags ?? [];

  const result = await storeOrgMemory({
    tenantId,
    category,
    content: newContent,
    source,
    tags: tags as string[],
  });

  // Mark old as superseded
  if (old) {
    await prisma.orgMemory.update({
      where: { id: oldMemoryId },
      data: { supersededBy: result.id, confidence: 0.1 },
    }).catch(() => {});
  }

  return { newId: result.id };
}

// ── Prune ────────────────────────────────────────────────────────────────────

export async function pruneStaleMemories(tenantId: string): Promise<number> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000);

  // Expired memories
  const expired = await prisma.orgMemory.updateMany({
    where: {
      tenantId,
      validUntil: { lt: now },
      confidence: { gt: 0.1 },
    },
    data: { confidence: 0.1 },
  });

  // Never-accessed and old
  const stale = await prisma.orgMemory.updateMany({
    where: {
      tenantId,
      accessCount: 0,
      createdAt: { lt: ninetyDaysAgo },
      confidence: { gt: 0.1 },
    },
    data: { confidence: 0.1 },
  });

  return expired.count + stale.count;
}

// ── Stats ────────────────────────────────────────────────────────────────────

export async function getOrgMemoryStats(tenantId: string) {
  const [total, byCategory, topAccessed] = await Promise.all([
    prisma.orgMemory.count({ where: { tenantId, confidence: { gt: 0.1 } } }),
    prisma.orgMemory.groupBy({
      by: ["category"],
      where: { tenantId, confidence: { gt: 0.1 } },
      _count: true,
    }),
    prisma.orgMemory.findMany({
      where: { tenantId, confidence: { gt: 0.1 } },
      orderBy: { accessCount: "desc" },
      take: 5,
      select: { id: true, category: true, content: true, accessCount: true, source: true },
    }),
  ]);

  return {
    total,
    byCategory: byCategory.map(g => ({ category: g.category, count: g._count })),
    topAccessed: topAccessed.map(m => ({
      id: m.id,
      category: m.category,
      preview: m.content.slice(0, 120),
      accesses: m.accessCount,
      source: m.source,
    })),
  };
}
