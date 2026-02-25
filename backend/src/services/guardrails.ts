import { prisma } from "../prisma.js";

export type GuardrailConfig = {
  autoSpendLimitUsd: number;
  maxActionsPerDay: number;
  maxExternalPostsPerDay: number;
  blockRecurring: boolean;
};

export function getGuardrailConfig(): GuardrailConfig {
  return {
    autoSpendLimitUsd: Number(process.env.AUTO_SPEND_LIMIT_USD ?? process.env.AUTO_SPEND_LIMIT ?? 20),
    maxActionsPerDay: Number(process.env.MAX_ACTIONS_PER_DAY ?? 200),
    maxExternalPostsPerDay: Number(process.env.MAX_EXTERNAL_POSTS_PER_DAY ?? 20),
    blockRecurring: String(process.env.BLOCK_RECURRING ?? "false") === "true",
  };
}

export type GuardrailCheck = {
  ok: boolean;
  reasons: string[];
  config: GuardrailConfig;
};

/**
 * Minimal "grandma-safe" guardrails.
 *
 * We keep this intentionally simple for alpha:
 * - cap approved actions/day
 * - cap external posts/day
 * - block recurring by default
 */
export async function checkGuardrails(params: {
  tenantId: string;
  todayUtc: Date;
  actionType: "decision" | "external_post";
  billingType?: "none" | "one_time" | "recurring";
}): Promise<GuardrailCheck> {
  const config = getGuardrailConfig();
  const reasons: string[] = [];

  const start = new Date(Date.UTC(params.todayUtc.getUTCFullYear(), params.todayUtc.getUTCMonth(), params.todayUtc.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(params.todayUtc.getUTCFullYear(), params.todayUtc.getUTCMonth(), params.todayUtc.getUTCDate(), 23, 59, 59));

  if (config.blockRecurring && params.billingType === "recurring") {
    reasons.push("recurring_blocked");
  }

  if (params.actionType === "decision") {
    const approvedCount = await prisma.decisionMemo.count({
      where: { tenantId: params.tenantId, status: "APPROVED", createdAt: { gte: start, lte: end } },
    });
    if (approvedCount >= config.maxActionsPerDay) reasons.push("daily_action_cap_reached");
  }

  if (params.actionType === "external_post") {
    const postCount = await prisma.distributionEvent.count({
      where: { tenantId: params.tenantId, eventType: "post", occurredAt: { gte: start, lte: end } },
    });
    if (postCount >= config.maxExternalPostsPerDay) reasons.push("daily_external_post_cap_reached");
  }

  return { ok: reasons.length === 0, reasons, config };
}
