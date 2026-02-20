import { prisma } from "../prisma.js";
import { computeMetricsSnapshot, upsertDailySnapshot } from "./metricsSnapshot.js";
import { createDecisionMemo } from "./decisionMemos.js";

function utcDateOnly(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Growth Loop v1 (alpha):
 * - ensures daily metrics snapshot exists
 * - records a GrowthLoopRun row
 * - optionally creates a DecisionMemo (one action/day)
 *
 * This intentionally does NOT auto-execute actions. Execution happens after approval.
 */
export async function runGrowthLoop(params: {
  tenantId: string;
  agent: string;
  proposedAction?: {
    title: string;
    rationale: string;
    estimatedCostUsd?: number;
    billingType?: "none" | "one_time" | "recurring";
    riskTier?: number;
    confidence?: number;
    expectedBenefit?: string;
    payload?: any;
  };
}) {
  const runDate = utcDateOnly(new Date());

  // Ensure snapshot exists (idempotent)
  const snapshot = await computeMetricsSnapshot({ tenantId: params.tenantId });
  await upsertDailySnapshot({ tenantId: params.tenantId, snapshot });

  // Create/Upsert run row
  const existing = await prisma.growthLoopRun.findFirst({ where: { tenantId: params.tenantId, runDate } });
  if (existing && existing.status === "COMPLETED") {
    return { ok: true, alreadyRan: true, run: existing, snapshot };
  }

  const run = await prisma.growthLoopRun.upsert({
    where: { tenantId_runDate: { tenantId: params.tenantId, runDate } } as any,
    update: { status: "STARTED" },
    create: { tenantId: params.tenantId, runDate, status: "STARTED" },
  });

  let memoId: string | undefined;
  if (params.proposedAction) {
    const memo = await createDecisionMemo({
      tenantId: params.tenantId,
      agent: params.agent,
      title: params.proposedAction.title,
      rationale: params.proposedAction.rationale,
      estimatedCostUsd: params.proposedAction.estimatedCostUsd,
      billingType: params.proposedAction.billingType,
      riskTier: params.proposedAction.riskTier,
      confidence: params.proposedAction.confidence,
      expectedBenefit: params.proposedAction.expectedBenefit,
      payload: params.proposedAction.payload,
    });
    memoId = memo.id;
  }

  const completed = await prisma.growthLoopRun.update({
    where: { id: run.id },
    data: {
      status: "COMPLETED",
      decisionMemoId: memoId,
      summary: {
        snapshotDate: snapshot.date,
        createdDecisionMemo: Boolean(memoId),
      },
    },
  });

  return { ok: true, alreadyRan: false, run: completed, snapshot, memoId };
}
