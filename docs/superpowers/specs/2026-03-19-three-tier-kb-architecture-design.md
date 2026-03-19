# Three-Tier KB Architecture — Design Spec

**Date:** 2026-03-19
**Status:** Draft
**Author:** Claude (brainstorming with Billy)
**Sub-project:** 1 of 4 (Enterprise KB Infrastructure)

---

## 1. Problem Statement

Atlas UX's knowledge base is a flat, disconnected collection of vectors. The Pinecone visualization shows mostly isolated dots with a few small clusters — documents exist as islands with no relational context. All KB documents share a single namespace regardless of their purpose (product docs, internal policies, customer configs), making it impossible to control access boundaries or optimize retrieval by context type.

**Symptoms:**
- RAG queries return irrelevant results because internal governance docs compete with product guides for the same score slots
- No access isolation — a tenant query could theoretically surface another tenant's org memories if metadata filtering fails
- Embedding quality is poor because chunks are embedded without relational context, producing scattered rather than clustered vectors
- Query classifier routes to tiers (SKILL_ONLY, HOT_CACHE, FULL_RAG) but has no concept of *which content* to search within FULL_RAG

## 2. Goals

1. **Tier isolation:** Separate KB content into three logical tiers with clean access boundaries
2. **Interconnection:** Re-embed all chunks with context-enriched headers so semantically related documents cluster together in vector space
3. **Weighted retrieval:** Cross-tier queries return results with tier-appropriate scoring (specificity wins)
4. **Zero downtime:** Migration runs as a background script; existing RAG pipeline continues working throughout
5. **Foundation:** Provide the namespace structure that eval loops, self-healing KB, and continuous ingestion will build on

## 3. Non-Goals

- Continuous ingestion pipelines (Airbyte/Kafka/Spark) — separate sub-project
- Eval loops with golden query/answer sets — separate sub-project
- Self-healing KB agent — separate sub-project
- Frontend KB management UI updates — follow-up polish
- Multi-index Pinecone setup — single index with namespaces is sufficient

## 4. Architecture

### 4.1 Three-Tier Model

| Tier | Pinecone Namespace | Access | Content Examples |
|------|--------------------|--------|------------------|
| **Public** | `public` | All tenants (read-only) | Video-gen guides, image-gen guides, support articles, workflow definitions, pricing comparisons, product docs |
| **Internal** | `internal` | Platform owner tenant only | Governance policies, agent comms protocols, soul-lock docs, audit policies, social/intel strategy, agent playbooks |
| **Tenant** | `tenant-{tenantId}` | That tenant only | Customer-specific configs, agent-scoped docs (`agent/{name}/`), org memories, customer preferences |

### 4.2 Schema Changes

**New enum:**
```prisma
enum KbTier {
  public
  internal
  tenant
}
```

**KbDocument changes:**
```prisma
model KbDocument {
  // ... existing fields ...
  tier      KbTier    @default(tenant)
  category  String?   // promoted from tags for Pinecone metadata enrichment
}
```

**Backfill rules (applied via migration script):**

| Condition | Tier |
|-----------|------|
| Slug starts with: `atlas-policy`, `soul-lock`, `audit-`, `agent-comms`, `social-`, `intel-` | `internal` |
| Slug starts with: `atlas-wf-` | `public` |
| Tagged with (via KbTagOnDocument join): `video-gen`, `image-gen`, `support`, `hle-*`, `atlas-workflow` | `public` |
| Slug starts with: `agent/` | `tenant` |
| Everything else | `tenant` |

**Note on SYSTEM_ACTOR:** The backfill does NOT rely on `createdBy` matching a specific UUID. Slug-prefix and tag-based rules are sufficient and more reliable. The `SYSTEM_ACTOR` UUID (`00000000-0000-0000-0000-000000000001`) is used by seed scripts but is not the primary tier-assignment signal.

**Category promotion logic:** The new `category` column is populated from the first matching KbTag on the document (via `KbTagOnDocument`). If a doc has multiple tags, the tag matching a known category list takes priority (e.g., `video-gen` > `general`). If no tags exist, `category` is derived from the slug path (e.g., slug `agent/binky/social-strategy` → category `agent-playbook`).

### 4.3 Pinecone Namespace Strategy

**Current state:** Single flat index `atlas-kb`, all vectors in the default namespace, filtered by `tenantId` metadata.

**Target state:** Same `atlas-kb` index, three namespace partitions:

- **`public`** — All public-tier vectors. No `tenantId` filter needed (accessible to all). Metadata includes: `documentId`, `slug`, `title`, `category`, `tags`, `tier`.
- **`internal`** — Platform owner's internal docs. Metadata includes: `documentId`, `slug`, `title`, `category`, `tags`, `tier`, `tenantId` (platform owner ID).
- **`tenant-{tenantId}`** — Per-tenant vectors including org memories. Metadata includes: `documentId`, `slug`, `title`, `category`, `tags`, `tier`, `tenantId`.

Org memories (currently prefixed `org-mem-` in the flat namespace) move to `tenant-{tenantId}` namespace with the same ID scheme.

**Pinecone SDK v7 namespace API:**
```typescript
// Namespace-scoped operations via index.namespace()
const index = pinecone.index("atlas-kb");
const ns = index.namespace("public");           // returns namespace handle
await ns.query({ vector, topK, includeMetadata: true });  // query within namespace
await ns.upsert(records);                        // upsert to namespace
await ns.deleteMany({ ids: [...] });             // delete from namespace

// Default namespace (current behavior) = index.namespace("")
```

All existing `upsertChunks()` and `queryPinecone()` calls gain an optional `namespace` parameter. When omitted, they use the default namespace (backward compatible). The new `queryTiered()` calls `index.namespace(name)` for each requested tier.

**Migration order for org memories:**
1. Update `orgMemory.ts` to write to `tenant-{tenantId}` namespace FIRST
2. Then run re-index script to migrate existing org memory vectors
3. Old flat-namespace org memory vectors are cleaned up last

This prevents duplicate creation during the migration window.

### 4.4 Context-Enriched Embedding

**Problem:** Chunks embedded in isolation produce scattered vectors with no relational context.

**Solution:** Before embedding each chunk, prepend a context header that gives the embedding model relational signals:

```
[Tier: public] [Category: video-gen/kling] [Tags: api, prompting, pricing]
[Doc: Kling 3 API Integration Guide]
[Related: kling-prompting-guide, pricing-comparison-matrix, kling-3-comprehensive-guide]
---
{original chunk content}
```

**Related docs are auto-derived from:**
1. **Category siblings** — Other docs in the same category directory (e.g., all `video-gen/kling/` docs)
2. **Cross-references** — Regex scan of the doc body for mentions of other doc slugs or titles
3. **Tag overlap** — Docs sharing 2+ tags with the current doc

**Embedding model:** `text-embedding-3-small` (unchanged — already in use)

**Context header is prepended only for embedding, not stored in the chunk content.** The `content` field in Pinecone metadata remains the raw chunk text for display purposes.

### 4.5 Tier-Weighted Scoring

**Modify `queryPinecone` to support multi-namespace queries with weighted scoring.**

New function signature:
```typescript
export async function queryTiered(opts: {
  tenantId: string;
  query: string;
  tiers: Array<"public" | "internal" | "tenant">;
  topK?: number;
  minScore?: number;
}): Promise<TieredHit[]>
```

**Score multipliers (initial estimates, subject to tuning):**
| Tier | Multiplier | Rationale |
|------|------------|-----------|
| Tenant | 1.5x | Most specific — customer's own data always wins |
| Internal | 1.2x | Org-specific context outranks generic product docs |
| Public | 1.0x | Baseline — product knowledge |

Multipliers are configurable via env vars: `KB_TIER_WEIGHT_TENANT` (default 1.5), `KB_TIER_WEIGHT_INTERNAL` (default 1.2), `KB_TIER_WEIGHT_PUBLIC` (default 1.0). This allows tuning without code changes. Validation: manual spot-checks of 10 representative queries before and after tiering to confirm no retrieval quality regression.

**Implementation:**
1. Query each requested namespace in parallel (Promise.all)
2. Apply score multiplier to each hit based on its namespace
3. Merge all hits into a single array
4. Sort by weighted score descending
5. Deduplicate by `documentId` (keep highest-scoring hit)
6. Return top `topK` results

### 4.6 Updated Query Flow

```
User query
    |
    v
queryClassifier.ts
    |-- Determines context tier (SKILL_ONLY, HOT_CACHE, FULL_RAG, DIRECT)
    |-- NEW: Determines which namespaces to search
    |
    v
Namespace resolution:
    |-- Customer-facing query (Lucy call, chat) --> [public, tenant-{id}]
    |-- Agent internal task                     --> [public, internal, tenant-{id}]
    |-- Platform admin query                    --> [public, internal]
    |
    v
queryTiered() --> parallel namespace queries
    |
    v
Apply tier weight multipliers (1.5x / 1.2x / 1.0x)
    |
    v
Merge + sort + dedup by documentId
    |
    v
getKbContext() assembles text block
    (existing char budget system unchanged: 60,000 char budget, 12,000 per doc)
```

### 4.7 Query Source Plumbing + Classifier Updates

**New `QuerySource` enum** — defines where a query originates:

```typescript
export type QuerySource = "voice" | "chat" | "engine" | "admin";
```

**Where it originates:**
- `"voice"` — set in `essieBrain.ts` / ElevenLabs webhook handler
- `"chat"` — set in `chatRoutes.ts` chat endpoint
- `"engine"` — set in `engineLoop.ts` / agent task execution
- `"admin"` — set in `kbRoutes.ts` admin endpoints

**How it flows:**
```
Route handler / worker sets querySource
    ↓
getKbContext({ tenantId, agentId, query, querySource })  // NEW param
    ↓
classifyQuery(query, querySource)  // NEW param
    ↓
Returns { tier, reason, searchTiers }
    ↓
queryTiered({ tenantId, query, tiers: searchTiers })
```

**`classifyQuery` updated signature:**
```typescript
export function classifyQuery(query: string, source?: QuerySource): ClassifyResult;

type ClassifyResult = {
  tier: QueryTier;
  reason: string;
  searchTiers: Array<"public" | "internal" | "tenant">; // NEW
};
```

**Default `searchTiers` by source:**
| Source | Search Tiers | Rationale |
|--------|-------------|-----------|
| `voice` | `["public", "tenant"]` | Customer-facing, no internal docs |
| `chat` | `["public", "tenant"]` | Customer-facing, no internal docs |
| `engine` | `["public", "internal", "tenant"]` | Agent tasks need full access |
| `admin` | `["public", "internal"]` | Platform admin, no tenant-specific |
| (omitted) | `["public", "tenant"]` | Safe default — no internal exposure |

The classifier may still override based on query patterns (e.g., governance-pattern queries from engine source always include `internal`).

**`getKbContext` updated signature:**
```typescript
type GetKbContextArgs = {
  tenantId: string;
  agentId: string;
  query?: string;
  querySource?: QuerySource;  // NEW — defaults to "engine"
  requestedBy?: string;
  intentId?: string;
};
```

**Governance docs in tiered world:**
After tiering, `getKbContext` still fetches governance docs via Prisma SQL query (the HOT_CACHE tier), but adds a `tier` filter: `tier: "internal"` for governance pack, `tier: "tenant"` for agent pack. This prevents a customer tenant from accidentally matching governance slug prefixes. The FULL_RAG vector search path uses `queryTiered()` with namespace isolation.

## 5. Re-embedding Pipeline

One-time migration script (`scripts/reindexKb.ts`) that:

1. **Reads** all KbDocuments with their chunks, tags, and tier assignments
2. **Builds** context headers for each chunk:
   - Tier, category, tags from the document
   - Related docs derived from category siblings + cross-references + tag overlap
3. **Embeds** each chunk with the context header prepended
4. **Upserts** to the correct Pinecone namespace based on tier
5. **Verifies** vector counts per namespace match expected counts
6. **Cleans up** old vectors from the default (flat) namespace

**Characteristics:**
- **Idempotent** — safe to re-run (upsert, not insert)
- **Batched** — processes 50 chunks at a time to respect rate limits
- **Progress reporting** — logs progress every 100 chunks
- **Dry-run mode** — `--dry-run` flag to preview without writing to Pinecone
- **Cost estimate** — ~$0.01 per 1000 chunks with `text-embedding-3-small`

**CLI:** `cd backend && npx tsx src/scripts/reindexKb.ts [--dry-run]`

**npm script:** `"kb:reindex": "tsx src/scripts/reindexKb.ts"`

## 6. Impact on Existing Code

| File | Change | Risk |
|------|--------|------|
| `prisma/schema.prisma` | Add `KbTier` enum, `tier` + `category` columns on KbDocument | Low — additive, default value |
| `lib/pinecone.ts` | Add `queryTiered()`, update `upsertChunks()` to accept namespace | Medium — core search path |
| `core/kb/getKbContext.ts` | Use `queryTiered()` instead of `queryPinecone()`, apply weights. Note: this file imports from `../../prisma.js` (not `../../db/prisma.js`) — fix import to match CLAUDE.md convention during this change | Medium — core context builder |
| `core/kb/queryClassifier.ts` | Add `searchTiers` to return type | Low — additive |
| `core/kb/kbCache.ts` | No changes needed — caching is pre-vector-search | None |
| `routes/kbRoutes.ts` | Accept `tier` on create/update, filter by tier on list, embed to correct namespace | Low — additive |
| `core/agent/orgMemory.ts` | Upsert to `tenant-{tenantId}` namespace; update dedup query to use namespace | Medium — org memory path |
| `lib/deepResearch.ts` | Update `queryPinecone` calls to use `queryTiered` with appropriate tiers | Medium — research path |
| `voice/essieBrain.ts` | Pass `querySource: "voice"` to `getKbContext` | Low — one-line addition |
| `routes/chatRoutes.ts` | Pass `querySource: "chat"` to `getKbContext` | Low — one-line addition |
| `workers/engineLoop.ts` | Pass `querySource: "engine"` to `getKbContext` | Low — one-line addition |
| `scripts/seedKbFromDocs.ts` | Set tier based on category mapping | Low — seed script |
| `scripts/seedAiKb.ts` | Set tier based on content type | Low — seed script |

## 7. Rollback Plan

If issues arise after deployment:

1. **Pinecone:** The old flat namespace vectors remain until explicitly deleted. The re-index script's cleanup step is the last step and can be skipped.
2. **Code:** `queryTiered()` falls back to `queryPinecone()` (flat namespace) if namespace queries return empty. This is a graceful degradation path.
3. **Schema:** The `tier` column has a default value of `tenant`, so removing the column is a simple migration rollback.
4. **Feature flag:** `KB_TIERED_SEARCH_ENABLED` env var (default `true`). Checked in `queryTiered()` — when `false`, it delegates to the original `queryPinecone()` (flat default namespace, no tier weights). Also checked in `getKbContext()` to skip tier-filtered governance queries and use the original slug-prefix queries instead. Set to `false` to revert to flat search without code changes.

## 8. Success Criteria

1. Pinecone visualization shows distinct clusters instead of scattered dots
2. Cross-tier queries return more relevant results (tenant-specific docs rank higher than generic product docs for tenant queries)
3. Internal governance docs are invisible to customer-facing queries
4. Re-embedding completes without errors for all existing KB documents
5. No regression in RAG response quality (measured by manual spot-checks before eval loops are built)
6. `getKbContext` latency stays within 2x of current (parallel namespace queries may add slight overhead)

## 9. Dependencies

- Pinecone SDK supports namespace parameter (confirmed — `@pinecone-database/pinecone` v7.1.0)
- OpenAI embeddings API (`text-embedding-3-small`) — already in use
- Prisma migration tooling — `prisma db push` (avoiding `migrate dev` shadow DB issues on AWS RDS)

## 10. Future Sub-Projects (Built on This Foundation)

1. **Eval Loops** — Golden query/answer sets evaluated against tiered search results
2. **Self-Healing KB Agent** — Identifies gaps in tier coverage, triggers doc creation/updates
3. **Continuous Ingestion** — Airbyte/Kafka/Spark pipelines write to the correct tier + namespace
4. **Cross-Tier Link Table** — Explicit document relationships for "see also" navigation (complements embedding-based clustering)
