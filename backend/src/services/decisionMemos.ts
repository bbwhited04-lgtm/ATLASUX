import { prisma } from "../prisma.js";
import { checkGuardrails } from "./guardrails.js";

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
  const confidence = Number(input.confidence ?? 0.5);

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

export async function rejectDecisionMemo(params: { tenantId: string; memoId: string; reason?: string }) {
  const memo = await prisma.decisionMemo.findFirst({ where: { id: params.memoId, tenantId: params.tenantId } });
  if (!memo) throw new Error("memo_not_found");

  const updated = await prisma.decisionMemo.update({
    where: { id: memo.id },
    data: { status: "REJECTED", payload: { ...(memo.payload as any), rejectionReason: params.reason ?? "" } },
  });
  return updated;
}
