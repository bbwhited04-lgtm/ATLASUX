/**
 * Pinecone vector search — embed KB chunks + semantic query.
 *
 * Supports namespace-scoped operations for three-tier KB architecture:
 *   - "public" namespace: product docs accessible to all tenants
 *   - "internal" namespace: platform-owner governance/policies
 *   - "tenant-{id}" namespace: per-tenant docs + org memories
 *
 * Gracefully degrades: if PINECONE_API_KEY is not set, all public
 * functions return empty / no-op so the rest of the app is unaffected.
 */

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { loadEnv } from "../env.js";

// ── Lazy singletons ──────────────────────────────────────────────────────────

let _pinecone: Pinecone | null | undefined;   // undefined = not yet initialised
let _openai: OpenAI | undefined;

function env() {
  return loadEnv(process.env);
}

function getPineconeIndex() {
  if (_pinecone === null) return null;         // already tried, no key
  if (_pinecone !== undefined) {
    const idx = env().PINECONE_INDEX ?? "atlas-kb";
    return _pinecone.index(idx);
  }

  const key = env().PINECONE_API_KEY;
  if (!key) { _pinecone = null; return null; }

  _pinecone = new Pinecone({ apiKey: key });
  const idx = env().PINECONE_INDEX ?? "atlas-kb";
  return _pinecone.index(idx);
}

function getOpenAI(): OpenAI {
  if (_openai) return _openai;
  _openai = new OpenAI({ apiKey: env().OPENAI_API_KEY });
  return _openai;
}

// ── Embeddings ───────────────────────────────────────────────────────────────

export async function embedText(text: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
    dimensions: 1024,
  });
  return res.data[0].embedding;
}

// ── Upsert ───────────────────────────────────────────────────────────────────

export type PineconeChunk = {
  id: string;           // unique chunk id (e.g. `${documentId}::${idx}`)
  content: string;
  tenantId: string;
  documentId: string;
  slug?: string;
  title?: string;
  tier?: string;
  category?: string;
};

export async function upsertChunks(chunks: PineconeChunk[], namespace?: string): Promise<number> {
  const index = getPineconeIndex();
  if (!index || chunks.length === 0) return 0;

  // Embed all chunks
  const embeddings = await Promise.all(
    chunks.map(c => embedText(c.content)),
  );

  // Build vectors
  const vectors = chunks.map((c, i) => ({
    id: c.id,
    values: embeddings[i],
    metadata: {
      tenantId: c.tenantId,
      documentId: c.documentId,
      slug: c.slug ?? "",
      title: c.title ?? "",
      text: c.content.slice(0, 3600),
      tier: c.tier ?? "tenant",
      category: c.category ?? "",
    },
  }));

  // Use namespace if provided, otherwise default
  const target = namespace ? index.namespace(namespace) : index;

  // Upsert in batches of 100
  const BATCH = 100;
  for (let i = 0; i < vectors.length; i += BATCH) {
    await (target as any).upsert({ records: vectors.slice(i, i + BATCH) });
  }

  return vectors.length;
}

// ── Query ────────────────────────────────────────────────────────────────────

export type VectorHit = {
  content: string;
  score: number;
  documentId: string;
  chunkId: string;
};

export async function queryPinecone(opts: {
  tenantId: string;
  query: string;
  topK?: number;
  minScore?: number;
  namespace?: string;
}): Promise<VectorHit[]> {
  const index = getPineconeIndex();
  if (!index) return [];

  const { tenantId, query, topK = 8, minScore = 0.25, namespace } = opts;

  const embedding = await embedText(query);

  const target = namespace ? index.namespace(namespace) : index;

  const res = await target.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    ...(tenantId ? { filter: { tenantId: { $eq: tenantId } } } : {}),
  });

  return (res.matches ?? [])
    .filter(m => (m.score ?? 0) >= minScore)
    .map(m => ({
      content: String((m.metadata as any)?.text ?? ""),
      score: m.score ?? 0,
      documentId: String((m.metadata as any)?.documentId ?? ""),
      chunkId: m.id,
    }));
}

// ── Tiered Query ─────────────────────────────────────────────────────────────

export type TieredHit = VectorHit & {
  tier: string;
  weightedScore: number;
};

export async function queryTiered(opts: {
  tenantId: string;
  query: string;
  tiers: Array<"public" | "internal" | "tenant">;
  topK?: number;
  minScore?: number;
}): Promise<TieredHit[]> {
  // Feature flag: fall back to flat search
  if (process.env.KB_TIERED_SEARCH_ENABLED === "false") {
    const flat = await queryPinecone({
      tenantId: opts.tenantId,
      query: opts.query,
      topK: opts.topK,
      minScore: opts.minScore,
    });
    return flat.map(h => ({ ...h, tier: "tenant", weightedScore: h.score }));
  }

  const weights: Record<string, number> = {
    tenant: Number(process.env.KB_TIER_WEIGHT_TENANT ?? 1.5),
    internal: Number(process.env.KB_TIER_WEIGHT_INTERNAL ?? 1.2),
    public: Number(process.env.KB_TIER_WEIGHT_PUBLIC ?? 1.0),
  };

  const { tenantId, query, tiers, topK = 8, minScore = 0.25 } = opts;

  const namespaceMap: Record<string, string> = {
    public: "public",
    internal: "internal",
    tenant: `tenant-${tenantId}`,
  };

  // Query all requested namespaces in parallel
  const results = await Promise.all(
    tiers.map(async (tier) => {
      const ns = namespaceMap[tier];
      // Public namespace: no tenantId filter (accessible to all)
      const filterTenantId = tier === "public" ? "" : tenantId;
      const hits = await queryPinecone({
        tenantId: filterTenantId,
        query,
        topK: topK + 2,
        minScore,
        namespace: ns,
      });
      return hits.map(h => ({
        ...h,
        tier,
        weightedScore: h.score * (weights[tier] ?? 1.0),
      }));
    }),
  );

  // Merge, sort by weighted score, dedup by documentId
  const all = results.flat().sort((a, b) => b.weightedScore - a.weightedScore);
  const seen = new Set<string>();
  const deduped: TieredHit[] = [];
  for (const hit of all) {
    if (seen.has(hit.documentId)) continue;
    seen.add(hit.documentId);
    deduped.push(hit);
    if (deduped.length >= topK) break;
  }

  return deduped;
}
