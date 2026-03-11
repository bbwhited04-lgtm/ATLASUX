/**
 * Tenant-scoped agent email resolver.
 *
 * Lookup order:
 *   1. tenant_agent_config.config.email for the tenant+agent
 *   2. AGENT_EMAIL_{AGENT} env var (owner tenant only)
 *   3. Fallback from agentEmails map (owner tenant only)
 *   4. null for non-owner tenants without configured email
 */

import { prisma } from "../db/prisma.js";
import { agentEmails, type AgentEmailKey } from "../config/agentEmails.js";

const OWNER_TENANT_ID = process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// Cache: tenantId:agentId → email (TTL 5 min)
const cache = new Map<string, { email: string | null; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Resolve the email address for an agent in a given tenant.
 */
export async function resolveAgentEmail(
  tenantId: string,
  agentId: string,
): Promise<string | null> {
  const cacheKey = `${tenantId}:${agentId}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.email;

  // 1. Check tenant_agent_config.config.email
  try {
    const row = await prisma.tenantAgentConfig.findUnique({
      where: { tenantId_agentId: { tenantId, agentId } },
      select: { config: true },
    });
    const config = row?.config as Record<string, unknown> | null;
    if (config?.email && typeof config.email === "string") {
      cache.set(cacheKey, { email: config.email, expiresAt: Date.now() + CACHE_TTL_MS });
      return config.email;
    }
  } catch { /* fall through */ }

  // 2. Owner tenant: env var or fallback map
  if (tenantId === OWNER_TENANT_ID) {
    const envKey = `AGENT_EMAIL_${agentId.toUpperCase()}`;
    const envVal = process.env[envKey]?.trim();
    if (envVal) {
      cache.set(cacheKey, { email: envVal, expiresAt: Date.now() + CACHE_TTL_MS });
      return envVal;
    }
    const mapKey = agentId.toUpperCase() as AgentEmailKey;
    const fallbackEmail = agentEmails[mapKey] ?? null;
    cache.set(cacheKey, { email: fallbackEmail, expiresAt: Date.now() + CACHE_TTL_MS });
    return fallbackEmail;
  }

  // 3. Non-owner tenant without configured email
  cache.set(cacheKey, { email: null, expiresAt: Date.now() + CACHE_TTL_MS });
  return null;
}

/** Clear cache — optionally scoped to a single tenant. */
export function clearAgentEmailCache(tenantId?: string) {
  if (tenantId) {
    for (const k of cache.keys()) {
      if (k.startsWith(`${tenantId}:`)) cache.delete(k);
    }
  } else {
    cache.clear();
  }
}
