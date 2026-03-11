/**
 * Tenant-scoped agent config resolver.
 *
 * - Owner tenant: gets ALL agents from global registry (always)
 * - Other tenants: only get agents with a row in tenant_agent_config where enabled=true
 */

import { prisma } from "../db/prisma.js";
import { agentRegistry } from "../agents/registry.js";

const OWNER_TENANT_ID = process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// Cache: tenantId -> Set of enabled agent IDs (TTL 5 min)
const cache = new Map<string, { agents: Set<string>; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Get the set of enabled agent IDs for a tenant.
 */
async function getEnabledAgents(tenantId: string): Promise<Set<string>> {
  // Owner gets everything
  if (tenantId === OWNER_TENANT_ID) {
    return new Set(agentRegistry.map((a) => a.id));
  }

  const cacheKey = tenantId;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.agents;
  }

  try {
    const rows = await prisma.tenantAgentConfig.findMany({
      where: { tenantId, enabled: true },
      select: { agentId: true },
    });
    const agents = new Set(rows.map((r) => r.agentId));
    cache.set(cacheKey, { agents, expiresAt: Date.now() + CACHE_TTL_MS });
    return agents;
  } catch {
    return new Set(); // DB error = no agents
  }
}

/**
 * Check if a specific agent is enabled for a tenant.
 */
export async function isAgentEnabled(tenantId: string, agentId: string): Promise<boolean> {
  const enabled = await getEnabledAgents(tenantId);
  return enabled.has(agentId);
}

/**
 * Get the list of agent registry entries available to a tenant.
 */
export async function getAgentsForTenant(tenantId: string) {
  const enabled = await getEnabledAgents(tenantId);
  return agentRegistry.filter((a) => enabled.has(a.id));
}

/** Clear cache for a tenant. */
export function clearAgentConfigCache(tenantId?: string) {
  if (tenantId) {
    cache.delete(tenantId);
  } else {
    cache.clear();
  }
}
