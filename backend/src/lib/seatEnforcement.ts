/**
 * Seat limit enforcement — pre-request checks against usage meters.
 *
 * Unlike usageMeter.ts (fire-and-forget counters), these functions
 * are blocking: they return { allowed, reason } so routes can 429.
 */

import { prisma } from "../db/prisma.js";
import { getLimits, hasPremiumAccess, PRO_ONLY_AGENTS, type SeatTier } from "./seatLimits.js";

function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

type EnforceResult = { allowed: true } | { allowed: false; reason: string };

async function getUsageSafe(userId: string, tenantId: string) {
  const period = currentPeriod();
  try {
    const meter = await prisma.usageMeter.findUnique({
      where: { userId_tenantId_period: { userId, tenantId, period } },
    });
    return {
      tokensUsed: Number(meter?.tokensUsed ?? 0),
      apiCalls: meter?.apiCalls ?? 0,
      jobsCreated: meter?.jobsCreated ?? 0,
      storageBytes: Number(meter?.storageBytes ?? 0),
    };
  } catch {
    // If metering table is unreachable, allow the request (fail-open)
    return null;
  }
}

/**
 * Resolve the seat tier for a user. Falls back to "free_beta".
 */
async function resolveTier(userId: string, tenantId: string): Promise<SeatTier> {
  try {
    const member = await prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      select: { seatType: true },
    });
    return (member?.seatType as unknown as SeatTier) ?? "free_beta";
  } catch {
    return "free_beta";
  }
}

/** Check token budget before an LLM call */
export async function enforceTokenBudget(
  userId: string,
  tenantId: string,
  estimatedTokens = 500,
): Promise<EnforceResult> {
  const tier = await resolveTier(userId, tenantId);
  const limits = getLimits(tier);
  const usage = await getUsageSafe(userId, tenantId);
  if (!usage) return { allowed: true };

  if (usage.tokensUsed + estimatedTokens > limits.tokenBudgetPerDay) {
    return {
      allowed: false,
      reason: `Daily token budget exceeded (${usage.tokensUsed.toLocaleString()} / ${limits.tokenBudgetPerDay.toLocaleString()}). Upgrade your plan for higher limits.`,
    };
  }
  return { allowed: true };
}

/** Check storage limit before a file upload */
export async function enforceStorageLimit(
  userId: string,
  tenantId: string,
  fileSizeBytes: number,
): Promise<EnforceResult> {
  const tier = await resolveTier(userId, tenantId);
  const limits = getLimits(tier);
  const usage = await getUsageSafe(userId, tenantId);
  if (!usage) return { allowed: true };

  if (usage.storageBytes + fileSizeBytes > limits.storageLimitBytes) {
    const usedMB = Math.round(usage.storageBytes / 1024 / 1024);
    const limitMB = Math.round(limits.storageLimitBytes / 1024 / 1024);
    return {
      allowed: false,
      reason: `Storage limit reached (${usedMB} MB / ${limitMB} MB). Upgrade your plan for more storage.`,
    };
  }
  return { allowed: true };
}

/** Check if user's tier allows access to a pro-only agent (lucy, claire, sandy) */
export async function enforceAgentAccess(
  userId: string,
  tenantId: string,
  agentId: string,
): Promise<EnforceResult> {
  if (!PRO_ONLY_AGENTS.has(agentId.toLowerCase())) return { allowed: true };

  const tier = await resolveTier(userId, tenantId);
  if (hasPremiumAccess(tier)) return { allowed: true };

  return {
    allowed: false,
    reason: `Agent "${agentId}" requires a Pro or Enterprise plan. Upgrade to unlock Lucy, Claire, Sandy, and all premium features.`,
  };
}

/** Check if user's tier allows access to a pro-only feature (calendar, premium screens) */
export async function enforceFeatureAccess(
  userId: string,
  tenantId: string,
  feature: string,
): Promise<EnforceResult> {
  const tier = await resolveTier(userId, tenantId);
  if (hasPremiumAccess(tier)) return { allowed: true };

  return {
    allowed: false,
    reason: `The ${feature} feature requires a Pro or Enterprise plan. Upgrade to unlock all premium features.`,
  };
}

/** Check daily job limit before creating a job */
export async function enforceJobLimit(
  userId: string,
  tenantId: string,
): Promise<EnforceResult> {
  const tier = await resolveTier(userId, tenantId);
  const limits = getLimits(tier);
  const usage = await getUsageSafe(userId, tenantId);
  if (!usage) return { allowed: true };

  if (usage.jobsCreated >= limits.jobsPerDay) {
    return {
      allowed: false,
      reason: `Daily job limit reached (${usage.jobsCreated} / ${limits.jobsPerDay}). Upgrade your plan for more jobs.`,
    };
  }
  return { allowed: true };
}
