/**
 * KB Cache — In-memory warm cache for governance + agent KB docs.
 *
 * Problem solved: getKbContext fired 3 DB queries on every single chat message,
 * even for routine agent tasks where the governance + agent docs never change.
 *
 * Solution: Cache governance and per-agent packs in memory with a TTL.
 * Full RAG (relevant/vector search) still fires per-query — that's the only
 * part that needs to be per-request.
 *
 * Architecture:
 *   Tier 1 — SKILL.md files (loaded from filesystem at boot, 0ms)
 *   Tier 2 — This cache (governance + agent docs, refreshed every 60 min)
 *   Tier 3 — Relevant RAG search (per-request, for novel/complex questions only)
 *
 * Env:
 *   KB_CACHE_TTL_MS   How long to keep a cached pack (default: 3 600 000 = 1 hour)
 *   KB_CACHE_ENABLED  Set to "false" to disable (always pass-through to DB)
 */

import { prisma } from "../../prisma.js";

const TTL_MS = Number(process.env.KB_CACHE_TTL_MS ?? 3_600_000); // 1 hour default
const ENABLED = process.env.KB_CACHE_ENABLED !== "false";

type CachedPack = {
  governance: CachedDoc[];
  agentDocs: CachedDoc[];
  cachedAt: number;
};

type CachedDoc = {
  id: string;
  slug: string;
  title: string;
  body: string;
  updatedAt: Date;
};

// keyed by `${tenantId}:${agentId}`
const cache = new Map<string, CachedPack>();

function isStale(pack: CachedPack): boolean {
  return Date.now() - pack.cachedAt > TTL_MS;
}

function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function getKbPack(tenantId: string, agentId: string): Promise<CachedPack> {
  if (!ENABLED) {
    return fetchFresh(tenantId, agentId);
  }

  const key = `${tenantId}:${agentId}`;
  const cached = cache.get(key);
  if (cached && !isStale(cached)) {
    return cached;
  }

  const fresh = await fetchFresh(tenantId, agentId);
  cache.set(key, fresh);
  return fresh;
}

async function fetchFresh(tenantId: string, agentId: string): Promise<CachedPack> {
  const agentPrefix = `agent/${slugify(agentId)}/`;

  const [governance, agentDocs] = await Promise.all([
    prisma.kbDocument.findMany({
      where: {
        tenantId,
        OR: [
          { slug: { startsWith: "atlas-policy" } },
          { slug: { startsWith: "soul-lock" } },
          { slug: { startsWith: "audit-" } },
          { slug: { startsWith: "agent-comms" } },
          { slug: { startsWith: "social-" } },
          { slug: { startsWith: "intel-" } },
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 60,
      select: { id: true, slug: true, title: true, body: true, updatedAt: true },
    }),
    prisma.kbDocument.findMany({
      where: { tenantId, slug: { startsWith: agentPrefix } },
      orderBy: [{ slug: "asc" }],
      take: 30,
      select: { id: true, slug: true, title: true, body: true, updatedAt: true },
    }),
  ]);

  return { governance, agentDocs, cachedAt: Date.now() };
}

/** Force-invalidate the cache for a specific agent (call after KB doc updates). */
export function invalidateKbCache(tenantId: string, agentId?: string) {
  if (agentId) {
    cache.delete(`${tenantId}:${agentId}`);
  } else {
    // Invalidate all entries for this tenant
    for (const key of cache.keys()) {
      if (key.startsWith(`${tenantId}:`)) cache.delete(key);
    }
  }
}

/** Invalidate entire cache (e.g., after bulk KB seed). */
export function flushKbCache() {
  cache.clear();
  console.log("[kbCache] Cache flushed.");
}

export function kbCacheStats() {
  return {
    entries: cache.size,
    ttlMs: TTL_MS,
    enabled: ENABLED,
    keys: [...cache.keys()],
  };
}
