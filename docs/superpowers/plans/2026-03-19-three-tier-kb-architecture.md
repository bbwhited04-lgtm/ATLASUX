# Three-Tier KB Architecture Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partition the KB into Public/Internal/Tenant tiers with Pinecone namespaces, context-enriched re-embedding, and tier-weighted scoring to turn isolated vector islands into interconnected clusters.

**Architecture:** New `KbTier` enum + `tier`/`category` columns on KbDocument. Pinecone `atlas-kb` index gains three namespaces (`public`, `internal`, `tenant-{id}`). `queryTiered()` searches namespaces in parallel with score multipliers. Context headers prepended to chunks before embedding for relational clustering.

**Tech Stack:** Prisma, Pinecone JS SDK v7 (namespace API), OpenAI text-embedding-3-small, Fastify, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-19-three-tier-kb-architecture-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/prisma/schema.prisma` | Modify | Add `KbTier` enum, `tier` + `category` columns |
| `backend/src/lib/pinecone.ts` | Modify | Add namespace support, `queryTiered()`, update `upsertChunks()` |
| `backend/src/core/kb/queryClassifier.ts` | Modify | Add `QuerySource`, `searchTiers` to return type |
| `backend/src/core/kb/getKbContext.ts` | Modify | Use `queryTiered()`, accept `querySource`, tier-filter governance |
| `backend/src/core/agent/orgMemory.ts` | Modify | Namespace-scoped upsert + dedup |
| `backend/src/lib/deepResearch.ts` | Modify | Use `queryTiered()` |
| `backend/src/routes/kbRoutes.ts` | Modify | Accept `tier` on CRUD, embed to correct namespace |
| `backend/src/scripts/backfillTiers.ts` | Create | One-time tier + category backfill |
| `backend/src/scripts/reindexKb.ts` | Create | Context-enriched re-embedding to namespaces |
| `backend/src/env.ts` | Modify | Add tier weight + feature flag env vars |
| `backend/src/voice/lucyBrain.ts` | Modify | Pass `querySource: "voice"` |
| `backend/src/voice/mercerBrain.ts` | Modify | Pass `querySource: "voice"` |
| `backend/src/routes/chatRoutes.ts` | Modify | Pass `querySource: "chat"` |
| `backend/src/routes/telegramRoutes.ts` | Modify | Pass `querySource: "chat"` |
| `backend/src/scripts/seedKbFromDocs.ts` | Modify | Set tier on seed |
| `backend/src/scripts/seedAiKb.ts` | Modify | Set tier on seed |

---

## Chunk 1: Schema + Pinecone Foundation

### Task 1: Prisma Schema — Add KbTier enum + columns

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add KbTier enum after existing enums**

```prisma
enum KbTier {
  public
  internal
  tenant
}
```

- [ ] **Step 2: Add tier + category columns to KbDocument model**

Add these fields to the KbDocument model:

```prisma
  tier      KbTier    @default(tenant)
  category  String?   @map("category")
```

- [ ] **Step 3: Push schema to database**

Run: `cd backend && npx prisma db push`
Expected: Schema synced, no errors.

- [ ] **Step 4: Generate Prisma client**

Run: `cd backend && npx prisma generate`
Expected: Client generated with new KbTier type.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(kb): add KbTier enum + tier/category columns to KbDocument"
```

---

### Task 2: Add env vars for tier weights + feature flag

**Files:**
- Modify: `backend/src/env.ts`

- [ ] **Step 1: Add new env vars to EnvSchema**

Add after the PINECONE vars:

```typescript
  // KB Tiered Search
  KB_TIERED_SEARCH_ENABLED: z.string().optional(),  // "false" to disable
  KB_TIER_WEIGHT_TENANT: z.string().optional(),      // default "1.5"
  KB_TIER_WEIGHT_INTERNAL: z.string().optional(),    // default "1.2"
  KB_TIER_WEIGHT_PUBLIC: z.string().optional(),      // default "1.0"
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/env.ts
git commit -m "feat(kb): add tiered search env vars"
```

---

### Task 3: Pinecone — Add namespace support + queryTiered()

**Files:**
- Modify: `backend/src/lib/pinecone.ts`

- [ ] **Step 1: Update upsertChunks to accept optional namespace**

Change the `upsertChunks` signature and body:

```typescript
export async function upsertChunks(chunks: PineconeChunk[], namespace?: string): Promise<number> {
  const index = getPineconeIndex();
  if (!index || chunks.length === 0) return 0;

  const embeddings = await Promise.all(
    chunks.map(c => embedText(c.content)),
  );

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

  const BATCH = 100;
  for (let i = 0; i < vectors.length; i += BATCH) {
    await target.upsert(vectors.slice(i, i + BATCH));
  }

  return vectors.length;
}
```

- [ ] **Step 2: Add tier and category to PineconeChunk type**

```typescript
export type PineconeChunk = {
  id: string;
  content: string;
  tenantId: string;
  documentId: string;
  slug?: string;
  title?: string;
  tier?: string;
  category?: string;
};
```

- [ ] **Step 3: Update queryPinecone to accept optional namespace**

```typescript
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
    filter: tenantId ? { tenantId: { $eq: tenantId } } : undefined,
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
```

- [ ] **Step 4: Add TieredHit type and queryTiered function**

```typescript
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
  // Feature flag check
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

  // Map tier names to Pinecone namespace names
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
      // Internal/Tenant: filter by tenantId for safety
      const filterTenantId = tier === "public" ? "" : tenantId;
      const hits = await queryPinecone({
        tenantId: filterTenantId,
        query,
        topK: topK + 2, // slight over-fetch per namespace
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
```

- [ ] **Step 5: Verify build**

Run: `cd backend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib/pinecone.ts
git commit -m "feat(kb): add namespace support + queryTiered() to Pinecone lib"
```

---

### Task 4: Query Classifier — Add QuerySource + searchTiers

**Files:**
- Modify: `backend/src/core/kb/queryClassifier.ts`

- [ ] **Step 1: Add QuerySource type and update ClassifyResult**

Add at top of file:

```typescript
export type QuerySource = "voice" | "chat" | "engine" | "admin";
```

Update ClassifyResult:

```typescript
type ClassifyResult = {
  tier: QueryTier;
  reason: string;
  searchTiers: Array<"public" | "internal" | "tenant">;
};
```

- [ ] **Step 2: Update classifyQuery signature and add searchTiers logic**

```typescript
export function classifyQuery(query: string, source?: QuerySource): ClassifyResult {
  // Determine default searchTiers by source
  const defaultTiers: Record<QuerySource, Array<"public" | "internal" | "tenant">> = {
    voice: ["public", "tenant"],
    chat: ["public", "tenant"],
    engine: ["public", "internal", "tenant"],
    admin: ["public", "internal"],
  };
  const searchTiers = defaultTiers[source ?? "engine"];

  if (!query || query.trim().length < 3) {
    return { tier: "HOT_CACHE", reason: "empty or very short query", searchTiers };
  }

  const q = query.trim();

  for (const pattern of DIRECT_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "DIRECT", reason: `matched direct pattern: ${pattern.source.slice(0, 40)}`, searchTiers };
    }
  }

  for (const pattern of ORG_MEMORY_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "FULL_RAG", reason: `matched org-memory pattern: ${pattern.source.slice(0, 40)}`, searchTiers };
    }
  }

  for (const pattern of PLAYBOOK_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "FULL_RAG", reason: `matched playbook pattern: ${pattern.source.slice(0, 40)}`, searchTiers };
    }
  }

  for (const pattern of SKILL_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "SKILL_ONLY", reason: `matched skill pattern: ${pattern.source.slice(0, 40)}`, searchTiers };
    }
  }

  for (const pattern of HOT_CACHE_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "HOT_CACHE", reason: `matched cache pattern: ${pattern.source.slice(0, 40)}`, searchTiers };
    }
  }

  return { tier: "FULL_RAG", reason: "no pattern matched — novel question", searchTiers };
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/core/kb/queryClassifier.ts
git commit -m "feat(kb): add QuerySource + searchTiers to query classifier"
```

---

### Task 5: getKbContext — Integrate queryTiered + querySource

**Files:**
- Modify: `backend/src/core/kb/getKbContext.ts`

- [ ] **Step 1: Fix import path (prisma.js → db/prisma.js)**

Change line 1:
```typescript
import { prisma } from "../../db/prisma.js";
```

- [ ] **Step 2: Import queryTiered and QuerySource**

Replace `queryPinecone` import:
```typescript
import { queryTiered } from "../../lib/pinecone.js";
import type { QuerySource } from "./queryClassifier.js";
```

- [ ] **Step 3: Add querySource to GetKbContextArgs**

```typescript
type GetKbContextArgs = {
  tenantId: string;
  agentId: string;
  query?: string;
  querySource?: QuerySource;
  requestedBy?: string;
  intentId?: string;
};
```

- [ ] **Step 4: Add tier filter to governance + agent pack queries**

In the governance query, add tier filter when tiered search is enabled:

```typescript
const tieredEnabled = process.env.KB_TIERED_SEARCH_ENABLED !== "false";

const governance = await prisma.kbDocument.findMany({
  where: {
    tenantId,
    ...(tieredEnabled ? { tier: "internal" } : {}),
    OR: [
      { slug: { startsWith: "atlas-policy" } },
      { slug: { startsWith: "soul-lock" } },
      { slug: { startsWith: "audit-" } },
      { slug: { startsWith: "agent-comms" } },
    ],
  },
  orderBy: [{ updatedAt: "desc" }],
  take: 50,
  select: { id: true, slug: true, title: true, body: true, updatedAt: true },
});
```

- [ ] **Step 5: Replace queryPinecone with queryTiered in relevant pack**

Replace the vector search section (around line 98-128) to use `queryTiered`:

```typescript
if (query && query.length >= 3) {
  // Determine search tiers from query source
  const searchTiers: Array<"public" | "internal" | "tenant"> =
    args.querySource === "voice" || args.querySource === "chat"
      ? ["public", "tenant"]
      : args.querySource === "admin"
        ? ["public", "internal"]
        : ["public", "internal", "tenant"];

  try {
    const hits = await queryTiered({
      tenantId,
      query,
      tiers: searchTiers,
      topK: relevantLimit + 5,
      minScore: 0.3,
    });

    if (hits.length > 0) {
      const kbDocIds = [...new Set(
        hits
          .filter(h => !h.chunkId.startsWith("org-mem-"))
          .map(h => h.documentId)
          .filter(Boolean),
      )].slice(0, relevantLimit);

      const orgHits = hits.filter(h => h.chunkId.startsWith("org-mem-"));
      if (orgHits.length > 0) {
        orgMemoryBlock = "[ORGANIZATIONAL MEMORY]\n" +
          orgHits.map(h => `- ${h.content}`).join("\n");
      }

      if (kbDocIds.length > 0) {
        relevant = await prisma.kbDocument.findMany({
          where: { tenantId, id: { in: kbDocIds } },
          select: { id: true, slug: true, title: true, body: true, updatedAt: true },
        });
      }
    }
  } catch {
    // Tiered search unavailable — fall back to SQL ILIKE
  }

  // SQL fallback if vector search returned nothing (unchanged)
  // ... existing SQL fallback code ...
```

- [ ] **Step 6: Verify build**

Run: `cd backend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/core/kb/getKbContext.ts
git commit -m "feat(kb): integrate queryTiered + querySource into getKbContext"
```

---

### Task 6: orgMemory — Namespace-scoped upsert + dedup

**Files:**
- Modify: `backend/src/core/agent/orgMemory.ts`

- [ ] **Step 1: Update storeOrgMemory to use tenant namespace**

In `storeOrgMemory`, change the dedup query to use namespace:

```typescript
const tenantNs = `tenant-${tenantId}`;

// De-duplicate within tenant namespace
try {
  const existing = await queryPinecone({
    tenantId,
    query: content,
    topK: 1,
    minScore: 0.92,
    namespace: tenantNs,
  });
  // ... rest of dedup logic unchanged
}
```

Change the upsert call to use namespace:

```typescript
await upsertChunks([{
  id: `org-mem-${row.id}`,
  content: content.slice(0, 3600),
  tenantId,
  documentId: row.id,
  slug: "org-memory",
  title: `${category}: ${content.slice(0, 80)}`,
  tier: "tenant",
}], tenantNs);
```

- [ ] **Step 2: Update recallOrgMemory to use tenant namespace**

```typescript
hits = await queryPinecone({
  tenantId,
  query,
  topK: topK + 4,
  minScore,
  namespace: `tenant-${tenantId}`,
});
```

- [ ] **Step 3: Update import to include queryPinecone namespace param**

Ensure import includes the updated `queryPinecone` with namespace support (already done in Task 3).

- [ ] **Step 4: Commit**

```bash
git add backend/src/core/agent/orgMemory.ts
git commit -m "feat(kb): namespace-scoped org memory upsert + dedup"
```

---

### Task 7: deepResearch — Use queryTiered

**Files:**
- Modify: `backend/src/lib/deepResearch.ts`

- [ ] **Step 1: Import queryTiered instead of queryPinecone**

```typescript
import { queryTiered } from "./pinecone.js";
import type { TieredHit } from "./pinecone.js";
```

- [ ] **Step 2: Update KB search call in execution phase**

Find where `queryPinecone` is called and replace with `queryTiered`:

```typescript
const kbHits = await queryTiered({
  tenantId,
  query: searchQuery,
  tiers: ["public", "internal", "tenant"],
  topK: 5,
  minScore: 0.3,
});
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/lib/deepResearch.ts
git commit -m "feat(kb): use queryTiered in deep research"
```

---

### Task 8: Wire querySource through all callers

**Files:**
- Modify: `backend/src/voice/lucyBrain.ts`
- Modify: `backend/src/voice/mercerBrain.ts`
- Modify: `backend/src/routes/chatRoutes.ts`
- Modify: `backend/src/routes/telegramRoutes.ts`
- Modify: `backend/src/core/agent/agentTools.ts`
- Modify: `backend/src/workflows/registry.ts`

- [ ] **Step 1: lucyBrain.ts — add querySource: "voice"**

Find the `getKbContext` call and add `querySource: "voice"`:

```typescript
return await getKbContext({
  tenantId,
  agentId: "lucy",
  query: utterance,
  querySource: "voice",
});
```

- [ ] **Step 2: mercerBrain.ts — add querySource: "voice"**

```typescript
return await getKbContext({ tenantId, agentId: "mercer", query: utterance, querySource: "voice" });
```

- [ ] **Step 3: chatRoutes.ts — add querySource: "chat"**

```typescript
const kb = await getKbContext({ tenantId, agentId, query, querySource: "chat" }).catch(() => null);
```

- [ ] **Step 4: telegramRoutes.ts — add querySource: "chat"**

```typescript
const kb = await getKbContext({ tenantId, agentId: effectiveAgentId, query: userText.slice(0, 200), querySource: "chat" }).catch(() => null);
```

- [ ] **Step 5: agentTools.ts — add querySource: "engine"**

Add `querySource: "engine"` to all `getKbContext` calls in this file (4 calls).

- [ ] **Step 6: workflows/registry.ts — add querySource: "engine"**

Add `querySource: "engine"` to all `getKbContext` calls in this file (15+ calls). Use find-and-replace: add `querySource: "engine"` to each call.

- [ ] **Step 7: Verify build**

Run: `cd backend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 8: Commit**

```bash
git add backend/src/voice/lucyBrain.ts backend/src/voice/mercerBrain.ts backend/src/routes/chatRoutes.ts backend/src/routes/telegramRoutes.ts backend/src/core/agent/agentTools.ts backend/src/workflows/registry.ts
git commit -m "feat(kb): wire querySource through all getKbContext callers"
```

---

### Task 9: kbRoutes — Accept tier on CRUD, embed to correct namespace

**Files:**
- Modify: `backend/src/routes/kbRoutes.ts`

- [ ] **Step 1: Accept tier on document creation**

In the POST `/documents` handler, read tier from request body:

```typescript
const tier = body?.tier ? String(body.tier) : "tenant";
// Validate tier
if (!["public", "internal", "tenant"].includes(tier)) {
  return reply.code(400).send({ ok: false, error: "invalid_tier" });
}
```

Add to the `create` data: `tier: tier as any,`

- [ ] **Step 2: Accept tier on document update**

In the PATCH `/documents/:id` handler:

```typescript
const tier = body?.tier != null ? String(body.tier) : null;
```

Add to the update data: `...(tier ? { tier: tier as any } : {}),`

- [ ] **Step 3: Add tier to list response**

In GET `/documents`, add `tier` to the select/response:

```typescript
documents: docs.map((d) => ({
  ...existing fields,
  tier: d.tier,
})),
```

- [ ] **Step 4: Filter by tier on list**

Accept `tier` query param:

```typescript
const tierFilter = String((req.query as any)?.tier ?? "").trim();
// In where clause:
...(tierFilter ? { tier: tierFilter as any } : {}),
```

- [ ] **Step 5: Update embed endpoint to use correct namespace**

In POST `/documents/:id/chunks/embed`, determine namespace from doc tier:

```typescript
const nsMap: Record<string, string> = {
  public: "public",
  internal: "internal",
  tenant: `tenant-${tenantId}`,
};
const namespace = nsMap[doc.tier ?? "tenant"] ?? `tenant-${tenantId}`;

const embedded = await upsertChunks(pineconeChunks, namespace);
```

- [ ] **Step 6: Update bulk embed to use correct namespace**

In POST `/embed-all`, group chunks by tier and upsert to correct namespace.

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes/kbRoutes.ts
git commit -m "feat(kb): accept tier on CRUD, embed to correct Pinecone namespace"
```

---

## Chunk 2: Migration Scripts + Seed Updates + Deploy

### Task 10: Backfill script — Assign tiers + categories to existing docs

**Files:**
- Create: `backend/src/scripts/backfillTiers.ts`

- [ ] **Step 1: Write the backfill script**

```typescript
/**
 * Backfill KbDocument tier + category for existing docs.
 * Run: cd backend && npx tsx src/scripts/backfillTiers.ts
 */
import { prisma } from "../db/prisma.js";

const INTERNAL_SLUGS = ["atlas-policy", "soul-lock", "audit-", "agent-comms", "social-", "intel-"];
const PUBLIC_SLUGS = ["atlas-wf-"];

async function main() {
  const docs = await prisma.kbDocument.findMany({
    select: { id: true, slug: true, tags: { include: { tag: true } } },
  });

  let internal = 0, pub = 0, tenant = 0;

  for (const doc of docs) {
    let tier: "public" | "internal" | "tenant" = "tenant";
    const tagNames = doc.tags.map(t => t.tag.name.toLowerCase());

    // Internal tier
    if (INTERNAL_SLUGS.some(p => doc.slug.startsWith(p))) {
      tier = "internal";
    }
    // Public tier
    else if (PUBLIC_SLUGS.some(p => doc.slug.startsWith(p))) {
      tier = "public";
    }
    else if (tagNames.some(t =>
      t.includes("video-gen") || t.includes("image-gen") ||
      t.includes("support") || t.startsWith("hle-") ||
      t === "atlas-workflow"
    )) {
      tier = "public";
    }
    // Agent-scoped = tenant
    else if (doc.slug.startsWith("agent/")) {
      tier = "tenant";
    }

    // Derive category from first meaningful tag or slug path
    let category: string | null = null;
    if (tagNames.length > 0) {
      category = tagNames.find(t => t !== "general") ?? tagNames[0];
    }
    if (!category && doc.slug.includes("/")) {
      const parts = doc.slug.split("/");
      category = parts.slice(0, -1).join("/");
    }

    await prisma.kbDocument.update({
      where: { id: doc.id },
      data: { tier: tier as any, category },
    });

    if (tier === "internal") internal++;
    else if (tier === "public") pub++;
    else tenant++;
  }

  console.log(`Backfill complete: ${pub} public, ${internal} internal, ${tenant} tenant (${docs.length} total)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run it**

Run: `cd backend && npx tsx src/scripts/backfillTiers.ts`
Expected: All docs assigned a tier.

- [ ] **Step 3: Commit**

```bash
git add backend/src/scripts/backfillTiers.ts
git commit -m "feat(kb): add tier + category backfill script"
```

---

### Task 11: Re-index script — Context-enriched re-embedding

**Files:**
- Create: `backend/src/scripts/reindexKb.ts`

- [ ] **Step 1: Write the re-index script**

```typescript
/**
 * Re-index KB — Context-enriched re-embedding to Pinecone namespaces.
 * Run: cd backend && npx tsx src/scripts/reindexKb.ts [--dry-run]
 */
import { prisma } from "../db/prisma.js";
import { embedText, upsertChunks } from "../lib/pinecone.js";
import type { PineconeChunk } from "../lib/pinecone.js";

const DRY_RUN = process.argv.includes("--dry-run");

type DocWithMeta = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  tier: string;
  category: string | null;
  tenantId: string;
  tags: string[];
};

function buildContextHeader(doc: DocWithMeta, relatedSlugs: string[]): string {
  const parts = [
    `[Tier: ${doc.tier}]`,
    doc.category ? `[Category: ${doc.category}]` : null,
    doc.tags.length > 0 ? `[Tags: ${doc.tags.slice(0, 5).join(", ")}]` : null,
    `[Doc: ${doc.title}]`,
    relatedSlugs.length > 0 ? `[Related: ${relatedSlugs.slice(0, 5).join(", ")}]` : null,
  ].filter(Boolean);
  return parts.join(" ") + "\n---\n";
}

function findRelatedByCategory(doc: DocWithMeta, allDocs: DocWithMeta[]): string[] {
  if (!doc.category) return [];
  return allDocs
    .filter(d => d.id !== doc.id && d.category === doc.category)
    .slice(0, 5)
    .map(d => d.slug);
}

function findRelatedByTagOverlap(doc: DocWithMeta, allDocs: DocWithMeta[]): string[] {
  if (doc.tags.length === 0) return [];
  const docTags = new Set(doc.tags);
  return allDocs
    .filter(d => {
      if (d.id === doc.id) return false;
      const overlap = d.tags.filter(t => docTags.has(t)).length;
      return overlap >= 2;
    })
    .slice(0, 5)
    .map(d => d.slug);
}

function namespaceForDoc(doc: DocWithMeta): string {
  if (doc.tier === "public") return "public";
  if (doc.tier === "internal") return "internal";
  return `tenant-${doc.tenantId}`;
}

async function main() {
  console.log(DRY_RUN ? "DRY RUN — no Pinecone writes" : "LIVE — writing to Pinecone");

  // Load all docs with tags
  const rawDocs = await prisma.kbDocument.findMany({
    include: { tags: { include: { tag: true } } },
  });

  const allDocs: DocWithMeta[] = rawDocs.map(d => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    body: d.body,
    tier: (d as any).tier ?? "tenant",
    category: (d as any).category ?? null,
    tenantId: d.tenantId,
    tags: d.tags.map(t => t.tag.name),
  }));

  console.log(`Found ${allDocs.length} documents`);

  // Load existing chunks from DB
  let dbChunks: any[] = [];
  try {
    dbChunks = await prisma.$queryRaw`
      select id::text as id, document_id::text as "documentId",
             tenant_id::text as "tenantId", idx, content
      from kb_chunks
      order by document_id, idx
    ` as any[];
  } catch {
    console.log("No kb_chunks table — will chunk from doc bodies");
  }

  const chunksByDoc = new Map<string, any[]>();
  for (const c of dbChunks) {
    const arr = chunksByDoc.get(c.documentId) ?? [];
    arr.push(c);
    chunksByDoc.set(c.documentId, arr);
  }

  // Process each document
  let totalVectors = 0;
  let processed = 0;
  const nsCounts: Record<string, number> = {};

  for (const doc of allDocs) {
    const related = [
      ...new Set([
        ...findRelatedByCategory(doc, allDocs),
        ...findRelatedByTagOverlap(doc, allDocs),
      ]),
    ];

    const header = buildContextHeader(doc, related);
    const ns = namespaceForDoc(doc);
    nsCounts[ns] = (nsCounts[ns] ?? 0);

    // Get chunks: prefer DB chunks, fallback to body
    const existingChunks = chunksByDoc.get(doc.id);
    let chunks: PineconeChunk[] = [];

    if (existingChunks && existingChunks.length > 0) {
      chunks = existingChunks.map(c => ({
        id: `${doc.id}::${c.idx}`,
        content: header + c.content,
        tenantId: doc.tenantId,
        documentId: doc.id,
        slug: doc.slug,
        title: doc.title,
        tier: doc.tier,
        category: doc.category ?? undefined,
      }));
    } else if (doc.body && doc.body.length > 0) {
      // Single chunk from body (up to 7500 chars to leave room for header)
      chunks = [{
        id: `${doc.id}::0`,
        content: header + doc.body.slice(0, 7500),
        tenantId: doc.tenantId,
        documentId: doc.id,
        slug: doc.slug,
        title: doc.title,
        tier: doc.tier,
        category: doc.category ?? undefined,
      }];
    }

    if (chunks.length === 0) continue;

    if (!DRY_RUN) {
      await upsertChunks(chunks, ns);
    }

    totalVectors += chunks.length;
    nsCounts[ns] = (nsCounts[ns] ?? 0) + chunks.length;
    processed++;

    if (processed % 50 === 0) {
      console.log(`  ${processed}/${allDocs.length} docs processed (${totalVectors} vectors)`);
    }
  }

  console.log(`\nDone! ${processed} docs → ${totalVectors} vectors`);
  console.log("Namespace breakdown:");
  for (const [ns, count] of Object.entries(nsCounts)) {
    console.log(`  ${ns}: ${count} vectors`);
  }

  if (DRY_RUN) {
    console.log("\nDRY RUN complete. No vectors written. Run without --dry-run to write.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add npm script**

Add to `backend/package.json` scripts:

```json
"kb:reindex": "tsx src/scripts/reindexKb.ts"
```

- [ ] **Step 3: Test dry run**

Run: `cd backend && npx tsx src/scripts/reindexKb.ts --dry-run`
Expected: Lists doc count, namespace breakdown, no Pinecone writes.

- [ ] **Step 4: Run live**

Run: `cd backend && npx tsx src/scripts/reindexKb.ts`
Expected: All vectors upserted to correct namespaces.

- [ ] **Step 5: Commit**

```bash
git add backend/src/scripts/reindexKb.ts backend/package.json
git commit -m "feat(kb): add context-enriched re-index script for Pinecone namespaces"
```

---

### Task 12: Update seed scripts — Set tier on new docs

**Files:**
- Modify: `backend/src/scripts/seedKbFromDocs.ts`
- Modify: `backend/src/scripts/seedAiKb.ts`

- [ ] **Step 1: seedKbFromDocs.ts — add tier based on category**

In the `upsert` create/update data, add tier:

```typescript
const tier = ["business", "marketing", "social-media", "workflows", "technical",
              "agent-playbook", "support", "general"].includes(category)
  ? "public" : "tenant";
```

Add `tier: tier as any` to both `create` and `update` data objects.

- [ ] **Step 2: seedAiKb.ts — add tier: "public" to all AI KB docs**

These are product knowledge docs, so all get `tier: "public"`:

```typescript
async function upsertDoc(doc: Doc) {
  await prisma.kbDocument.upsert({
    where: { tenantId_slug: { tenantId: TENANT_ID, slug: doc.slug } },
    create: {
      ...existing,
      tier: "public" as any,
    },
    update: {
      ...existing,
      tier: "public" as any,
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/scripts/seedKbFromDocs.ts backend/src/scripts/seedAiKb.ts
git commit -m "feat(kb): set tier on seed scripts (public for product docs)"
```

---

### Task 13: Build + verify

- [ ] **Step 1: Full build**

Run: `cd backend && npm run build`
Expected: Clean build, no errors.

- [ ] **Step 2: Review all changes**

Run: `cd backend && git diff --stat HEAD~12` (or however many commits)
Verify: All expected files changed, nothing unexpected.

- [ ] **Step 3: Final commit if any fixes needed**

---

### Task 14: Deploy to production

- [ ] **Step 1: SCP dist + schema to prod**

```bash
scp -i ~/.ssh/lightsail-default.pem -r backend/dist bitnami@3.94.224.34:/home/bitnami/atlasux/backend/
scp -i ~/.ssh/lightsail-default.pem backend/prisma/schema.prisma bitnami@3.94.224.34:/home/bitnami/atlasux/backend/prisma/
scp -i ~/.ssh/lightsail-default.pem backend/src/scripts/backfillTiers.ts bitnami@3.94.224.34:/home/bitnami/atlasux/backend/src/scripts/
scp -i ~/.ssh/lightsail-default.pem backend/src/scripts/reindexKb.ts bitnami@3.94.224.34:/home/bitnami/atlasux/backend/src/scripts/
```

- [ ] **Step 2: Push schema on prod**

```bash
ssh -i ~/.ssh/lightsail-default.pem bitnami@3.94.224.34
cd /home/bitnami/atlasux/backend
export PATH=/opt/bitnami/node/bin:$PATH
npx prisma db push
npx prisma generate
```

- [ ] **Step 3: Run backfill on prod**

```bash
npx tsx src/scripts/backfillTiers.ts
```

- [ ] **Step 4: Run re-index on prod**

```bash
npx tsx src/scripts/reindexKb.ts --dry-run  # verify first
npx tsx src/scripts/reindexKb.ts             # live run
```

- [ ] **Step 5: Restart PM2**

```bash
pm2 restart all
```

- [ ] **Step 6: Health check**

```bash
curl http://localhost:8787/v1/health
```

- [ ] **Step 7: Verify Pinecone namespaces populated**

Check Pinecone dashboard — should see vectors in `public`, `internal`, and `tenant-*` namespaces.

---

### Task 15: Write KDR

- [ ] **Step 1: Write KDR to memory**

Document what was built, deployed, and what's next.
