/**
 * Pinecone vector search — embed KB chunks + semantic query.
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
};

export async function upsertChunks(chunks: PineconeChunk[]): Promise<number> {
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
    },
  }));

  // Upsert in batches of 100
  const BATCH = 100;
  for (let i = 0; i < vectors.length; i += BATCH) {
    await index.upsert({ records: vectors.slice(i, i + BATCH) });
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
}): Promise<VectorHit[]> {
  const index = getPineconeIndex();
  if (!index) return [];

  const { tenantId, query, topK = 8, minScore = 0.25 } = opts;

  const embedding = await embedText(query);

  const res = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: { tenantId: { $eq: tenantId } },
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
