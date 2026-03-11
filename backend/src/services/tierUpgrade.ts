/**
 * Re-seed agent and workflow configs when a tenant upgrades their seat tier.
 * Only ADDS new entitlements — never removes existing ones (so custom configs aren't lost).
 */

import { SeatType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { TIER_AGENTS, TIER_WORKFLOWS } from "../lib/tierConfig.js";
import { clearAgentConfigCache } from "./agentConfigResolver.js";

export async function upgradeTenantTier(
  tenantId: string,
  newTier: string,
): Promise<{ addedAgents: number; addedWorkflows: number }> {
  const agents = TIER_AGENTS[newTier] ?? TIER_AGENTS.free_beta;
  const workflows = TIER_WORKFLOWS[newTier] ?? TIER_WORKFLOWS.free_beta;

  let addedAgents = 0;
  let addedWorkflows = 0;

  // Add newly unlocked agents (skipDuplicates preserves existing rows)
  if (agents.length > 0) {
    const result = await prisma.tenantAgentConfig.createMany({
      data: agents.map((agentId) => ({
        tenantId,
        agentId,
        enabled: true,
      })),
      skipDuplicates: true,
    });
    addedAgents = result.count;
  }

  // Add newly unlocked workflows
  if (workflows.length > 0) {
    const result = await prisma.tenantWorkflowConfig.createMany({
      data: workflows.map((workflowId) => ({
        tenantId,
        workflowId,
        enabled: true,
      })),
      skipDuplicates: true,
    });
    addedWorkflows = result.count;
  }

  // Update seat type on tenant_member for the owner
  await prisma.tenantMember.updateMany({
    where: { tenantId, role: "owner" },
    data: { seatType: newTier as SeatType },
  });

  // Clear agent config cache so the new entitlements take effect immediately
  clearAgentConfigCache(tenantId);

  // Audit log
  await prisma.auditLog.create({
    data: {
      tenantId,
      actorType: "system",
      level: "info",
      action: "TIER_UPGRADED",
      entityType: "tenant",
      entityId: tenantId,
      message: `Tenant upgraded to ${newTier}. Added ${addedAgents} agents, ${addedWorkflows} workflows.`,
      meta: { newTier, addedAgents, addedWorkflows },
      timestamp: new Date(),
    },
  });

  return { addedAgents, addedWorkflows };
}
