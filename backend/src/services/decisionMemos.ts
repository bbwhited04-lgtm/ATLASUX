import { prisma } from "../db/prisma.js";
import { checkGuardrails } from "./guardrails.js";
import { deliverBroadcast, type BroadcastChannel } from "../core/agent/tools/broadcastDelivery.js";
import { getAgentCalibration, applyCalibration } from "../core/orgBrain/calibration.js";
import { applyEvolution } from "./evolutionService.js";

export type CreateDecisionMemoInput = {
  tenantId: string;
  agent: string;
  title: string;
  rationale: string;
  estimatedCostUsd?: number;
  billingType?: "none" | "one_time" | "recurring";
  riskTier?: number;
  confidence?: number;
  expectedBenefit?: string;
  payload?: any;
};

export async function createDecisionMemo(input: CreateDecisionMemoInput) {
  const estimatedCostUsd = Number(input.estimatedCostUsd ?? 0);
  const billingType = (input.billingType ?? "none") as any;
  const riskTier = Number(input.riskTier ?? 0);
  const rawConfidence = Number(input.confidence ?? 0.5);

  // Apply calibration from outcome history (if available)
  let confidence = rawConfidence;
  try {
    const calibration = await getAgentCalibration(input.agent);
    confidence = applyCalibration(rawConfidence, calibration);
  } catch { /* non-fatal — use raw confidence */ }

  const requiresApproval = billingType === "recurring" || estimatedCostUsd > Number(process.env.AUTO_SPEND_LIMIT_USD ?? 4) || riskTier >= 2;
  const status = requiresApproval ? "AWAITING_HUMAN" : "PROPOSED";

  const row = await prisma.decisionMemo.create({
    data: {
      tenantId: input.tenantId,
      agent: input.agent,
      title: input.title,
      rationale: input.rationale,
      estimatedCostUsd,
      billingType,
      riskTier,
      confidence,
      expectedBenefit: input.expectedBenefit,
      requiresApproval,
      status,
      payload: input.payload,
    },
  });

  return row;
}

export async function approveDecisionMemo(params: { tenantId: string; memoId: string }) {
  const memo = await prisma.decisionMemo.findFirst({ where: { id: params.memoId, tenantId: params.tenantId } });
  if (!memo) throw new Error("memo_not_found");

  const guard = await checkGuardrails({
    tenantId: params.tenantId,
    todayUtc: new Date(),
    actionType: "decision",
    billingType: (memo.billingType as any) ?? "none",
  });

  if (!guard.ok) {
    return { ok: false, memo, guard };
  }

  const updated = await prisma.decisionMemo.update({ where: { id: memo.id }, data: { status: "APPROVED" } });
  return { ok: true, memo: updated, guard };
}

/**
 * Execute an approved broadcast decision memo.
 * Called after approveDecisionMemo() succeeds for memos with payload.type === "broadcast".
 * Delivers content to all channels via the 3-tier pipeline and updates the memo with results.
 */
export async function executeApprovedBroadcast(memo: {
  id: string;
  tenantId: string;
  payload: any;
}) {
  const payload = memo.payload as {
    type: string;
    topic: string;
    content: string;
    channels: BroadcastChannel[];
  };

  if (payload?.type !== "broadcast" || !payload.content || !payload.channels?.length) {
    return;
  }

  const result = await deliverBroadcast({
    tenantId: memo.tenantId,
    content: payload.content,
    channels: payload.channels,
  });

  // Update memo payload with delivery results
  await prisma.decisionMemo.update({
    where: { id: memo.id },
    data: {
      payload: {
        ...payload,
        deliveryResults: result.results,
        deliverySummary: result.summary,
        deliveredAt: new Date().toISOString(),
      },
    },
  });

  // Audit log for broadcast delivery
  await prisma.auditLog.create({
    data: {
      tenantId: memo.tenantId,
      actorType: "system",
      actorExternalId: "broadcast_delivery",
      level: result.results.every(r => r.success) ? "info" : "warn",
      action: "BROADCAST_DELIVERED",
      entityType: "decision_memo",
      entityId: memo.id,
      message: result.summary,
      meta: {
        memoId: memo.id,
        topic: payload.topic,
        channelCount: payload.channels.length,
        successCount: result.results.filter(r => r.success).length,
        failCount: result.results.filter(r => !r.success).length,
      },
      timestamp: new Date(),
    },
  } as any).catch(() => null);

  return result;
}

export async function rejectDecisionMemo(params: { tenantId: string; memoId: string; reason?: string }) {
  const memo = await prisma.decisionMemo.findFirst({ where: { id: params.memoId, tenantId: params.tenantId } });
  if (!memo) throw new Error("memo_not_found");

  const updated = await prisma.decisionMemo.update({
    where: { id: memo.id },
    data: { status: "REJECTED", payload: { ...(memo.payload as any), rejectionReason: params.reason ?? "" } },
  });
  return updated;
}

/**
 * Execute an approved evolution decision memo.
 * Called after approveDecisionMemo() succeeds for memos with payload.type === "EVOLUTION".
 * Applies the evolution change and starts the trial period.
 */
export async function executeApprovedEvolution(memo: {
  id: string;
  tenantId: string;
  agent: string;
  payload: any;
}) {
  const payload = memo.payload as { type?: string };
  if (payload?.type !== "EVOLUTION") return;

  const result = await applyEvolution(memo.tenantId, memo);

  if (!result.ok) {
    await prisma.auditLog.create({
      data: {
        tenantId: memo.tenantId,
        actorType: "system",
        actorExternalId: "evolution_service",
        level: "error",
        action: "EVOLUTION_APPLY_FAILED",
        entityType: "decision_memo",
        entityId: memo.id,
        message: `Evolution apply failed for ${memo.agent}: ${result.error}`,
        meta: {
          memoId: memo.id,
          agent: memo.agent,
          error: result.error,
        },
        timestamp: new Date(),
      },
    } as any).catch(() => null);
  }

  return result;
}
