# Vector Embeddings & RAG Tuning

## Overview

Atlas UX implements Retrieval-Augmented Generation (RAG) to give AI agents access to
organizational knowledge at inference time. Rather than fine-tuning models, RAG injects
relevant document chunks into the agent's context window before each completion call.
This keeps responses grounded in real data and reduces hallucination.

## Document Ingestion Pipeline

The ingestion pipeline runs in two stages:

1. **Document creation** — KB documents are stored in the `kb_documents` table with
   fields for `title`, `content`, `status` (draft/published/archived), `category`,
   `tags`, and `createdBy`. Only documents with `status = 'published'` are eligible
   for chunking.

2. **Chunking** — The `kb:chunk-docs` script reads published documents and splits them
   into chunks stored in the `kb_chunks` table. Each chunk includes the source document
   ID, chunk index, raw text, and a vector embedding.

## Chunking Strategies

### Fixed-Size Chunking (Default)

The default strategy splits documents into chunks of **512 tokens** with a **50-token
overlap** between consecutive chunks. This overlap ensures that sentences spanning chunk
boundaries are not lost entirely.

```
Document: [==========================================================]
Chunk 1:  [==============]
Chunk 2:          [==============]
Chunk 3:                  [==============]
              overlap ^^^
```

Token counting uses `tiktoken` with the `cl100k_base` encoding (the same tokenizer
used by GPT-4 and text-embedding-3-small).

### Semantic Chunking (Experimental)

Semantic chunking splits on natural boundaries — paragraph breaks, heading transitions,
or topic shifts detected by comparing consecutive sentence embeddings. When the cosine
distance between two adjacent sentences exceeds a threshold (default 0.35), a chunk
boundary is inserted.

This produces variable-length chunks that better preserve logical units of meaning.
The tradeoff is higher ingestion cost (one embedding call per sentence during chunking)
and less predictable chunk sizes.

### When to Use Which

| Strategy | Best for | Avoid when |
|----------|----------|------------|
| Fixed-size 512 | Homogeneous docs, FAQs, policies | Highly structured docs with nested headings |
| Semantic | Technical docs, long-form guides | Short documents (<200 tokens) |

## Embedding Model

Atlas UX uses **OpenAI text-embedding-3-small** for all vector embeddings.

- **Dimensions**: 1536
- **Max input tokens**: 8191
- **Cost**: $0.02 per 1M tokens
- **Normalization**: Embeddings are L2-normalized by the API, so cosine similarity
  reduces to a dot product

The embedding call is made via the OpenAI SDK configured in `backend/src/ai.ts`.
Each chunk's embedding is stored as a `Float8` array in the `kb_chunks.embedding`
column.

## Vector Storage

Embeddings live in the `kb_chunks` table in PostgreSQL (Supabase). The schema:

```
kb_chunks
  id           UUID (PK)
  tenant_id    UUID (FK → tenants)
  document_id  UUID (FK → kb_documents)
  chunk_index  INT
  content      TEXT
  embedding    vector(1536)
  tokens       INT
  created_at   TIMESTAMPTZ
```

Supabase provides the `pgvector` extension, enabling native vector operations
directly in PostgreSQL. An IVFFlat index is created on the `embedding` column
for approximate nearest-neighbor search:

```sql
CREATE INDEX ON kb_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

The `lists` parameter controls the number of Voronoi cells. For the current document
corpus size (~5,000 chunks), 100 lists provides a good accuracy/speed tradeoff.

## Similarity Search

When an agent needs knowledge, the `search_atlasux_knowledge` tool:

1. Embeds the query string using text-embedding-3-small
2. Runs a cosine distance query against `kb_chunks`
3. Filters by `tenant_id` (multi-tenant isolation)
4. Returns the top-k results above the similarity threshold

```sql
SELECT id, content, 1 - (embedding <=> $1) AS similarity
FROM kb_chunks
WHERE tenant_id = $2
  AND 1 - (embedding <=> $1) > 0.7
ORDER BY embedding <=> $1
LIMIT 5;
```

The `<=>` operator computes cosine distance. Subtracting from 1 gives cosine
similarity (1.0 = identical, 0.0 = orthogonal).

## Tuning Parameters

### Top-K Results (default: 5)

How many chunks to inject into the agent's context. Higher values provide more
context but consume more tokens from the context window.

- **3** — Use for simple factual lookups
- **5** — Default; good balance for most queries
- **10** — Use for complex questions requiring synthesis across documents

### Similarity Threshold (default: 0.7)

Minimum cosine similarity for a chunk to be included. Below this threshold,
results are discarded even if they are in the top-k.

- **0.6** — Permissive; useful for broad exploratory queries
- **0.7** — Default; filters out marginally relevant chunks
- **0.85** — Strict; only near-exact matches returned

### Re-Ranking

After the initial vector search, chunks can be re-ranked by:

1. **Recency** — Boost chunks from recently updated documents
2. **Source priority** — SKILL.md files rank above general KB docs
3. **Keyword overlap** — BM25-style scoring on the original query terms

Re-ranking is applied as a weighted combination:
`final_score = 0.7 * similarity + 0.15 * recency_score + 0.15 * keyword_score`

## When to Re-Chunk Documents

Re-chunking is necessary when:

- A document is substantially edited (>30% content change)
- The chunking strategy changes (e.g., switching from fixed to semantic)
- The embedding model changes (dimensions or semantic space differ)
- Token limits are adjusted (e.g., moving from 512 to 256 tokens per chunk)

Re-chunking deletes existing chunks for the document and creates new ones.
The `kb:chunk-docs` script handles this idempotently — it checks the document's
`updated_at` timestamp against the most recent chunk's `created_at`.

## KB Cache Layers

Atlas UX uses a three-tier knowledge retrieval system:

1. **SKILL.md files** — In-memory, loaded at agent boot. Zero-latency access.
   These contain role-specific instructions and are never chunked.

2. **Hot cache** — Frequently accessed KB results cached in-memory with a
   **60-minute TTL**. Cache key is a hash of the query + tenant_id.

3. **Full RAG** — Vector search against kb_chunks. Used when the hot cache
   misses. Results are written back to the hot cache.

## Monitoring RAG Quality

### Relevance Scoring

Every RAG retrieval is logged to the `audit_log` with:
- The query text
- Number of chunks returned
- Average similarity score
- Whether the agent used the retrieved context in its response

A weekly report aggregates these metrics to identify:
- Queries that consistently return low-similarity results (signal: missing docs)
- Documents that are retrieved often but never used (signal: poor chunking)
- Categories with sparse coverage

### Debugging Poor Retrieval

When agents produce incorrect answers despite having relevant KB docs:

1. Check if the document is published (`status = 'published'`)
2. Verify chunks exist (`SELECT COUNT(*) FROM kb_chunks WHERE document_id = ?`)
3. Test the query embedding directly against the chunk embeddings
4. Lower the similarity threshold temporarily to see what chunks are being excluded
5. Review chunk boundaries — the answer may be split across two chunks with
   insufficient overlap

## Cost Considerations

Embedding costs scale with ingestion volume, not query volume (queries are single
embeddings). For a corpus of 1,000 documents averaging 2,000 tokens each:

- **Chunking**: ~4,000 chunks * 512 tokens = ~2M tokens = $0.04
- **Queries**: ~1,000 queries/day * 50 tokens = 50K tokens = $0.001/day

The dominant cost is the LLM completion call that consumes the retrieved chunks,
not the embedding calls themselves.
