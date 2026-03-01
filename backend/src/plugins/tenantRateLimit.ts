/**
 * Per-tenant rate limiting using in-memory sliding window counters.
 * Falls back to the existing IP-based @fastify/rate-limit for unauthenticated routes.
 *
 * Controls: PCI DSS 6.5.10, NIST SC-5, SOC 2 CC6.6, ISO A.13.1.1, HITRUST 09.m
 */
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000; // 1 minute
const buckets = new Map<string, Bucket>();

const TIER_LIMITS: Record<string, number> = {
  auth: 10,
  mutation: 30,
  read: 120,
};

function getTier(method: string): string {
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return "read";
  return "mutation";
}

// Prune stale buckets every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS * 2;
  for (const [key, bucket] of buckets) {
    if (bucket.windowStart < cutoff) buckets.delete(key);
  }
}, 5 * 60 * 1000);

const tenantRateLimitPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return; // No tenant context — fall through to IP-based limit

    const tier = getTier(req.method.toUpperCase());
    const key = `${tenantId}:${tier}`;
    const now = Date.now();
    const limit = TIER_LIMITS[tier] ?? 60;

    let bucket = buckets.get(key);
    if (!bucket || bucket.windowStart + WINDOW_MS < now) {
      bucket = { count: 0, windowStart: now };
      buckets.set(key, bucket);
    }

    bucket.count++;

    if (bucket.count > limit) {
      const retryAfter = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
      reply.header("Retry-After", String(retryAfter));
      return reply.code(429).send({
        ok: false,
        error: "tenant_rate_limit_exceeded",
        retryAfter,
      });
    }
  });
};

export default fp(tenantRateLimitPlugin);
