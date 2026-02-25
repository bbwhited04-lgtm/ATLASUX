import { prisma } from "../prisma.js";
import { computeMetricsSnapshot, upsertDailySnapshot } from "./metricsSnapshot.js";
import { createDecisionMemo } from "./decisionMemos.js";

function utcDateOnly(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

type ProposedAction = {
  title: string;
  rationale: string;
  estimatedCostUsd?: number;
  billingType?: "none" | "one_time" | "recurring";
  riskTier?: number;
  confidence?: number;
  expectedBenefit?: string;
  payload?: any;
};

/**
 * Growth Loop v2:
 * - ensures daily metrics snapshot exists
 * - records a GrowthLoopRun row (multiple runs per day allowed)
 * - creates DecisionMemos for each proposed action (array supported)
 * - does NOT auto-execute; execution happens after human approval
 */
export async function runGrowthLoop(params: {
  tenantId: string;
  agent: string;
  /** Single action (backwards compat) */
  proposedAction?: ProposedAction;
  /** Multiple actions in one run */
  proposedActions?: ProposedAction[];
}) {
  const runDate = utcDateOnly(new Date());

  // Ensure snapshot exists (idempotent)
  const snapshot = await computeMetricsSnapshot({ tenantId: params.tenantId });
  await upsertDailySnapshot({ tenantId: params.tenantId, snapshot });

  // Upsert run row — allows re-runs on the same day (status resets to STARTED each time)
  const run = await prisma.growthLoopRun.upsert({
    where: { tenantId_runDate: { tenantId: params.tenantId, runDate } } as any,
    update: { status: "STARTED" },
    create: { tenantId: params.tenantId, runDate, status: "STARTED" },
  });

  // Merge single + array into one list
  const actions: ProposedAction[] = [
    ...(params.proposedActions ?? []),
    ...(params.proposedAction ? [params.proposedAction] : []),
  ];

  const memoIds: string[] = [];
  for (const action of actions) {
    const memo = await createDecisionMemo({
      tenantId: params.tenantId,
      agent: params.agent,
      title: action.title,
      rationale: action.rationale,
      estimatedCostUsd: action.estimatedCostUsd,
      billingType: action.billingType,
      riskTier: action.riskTier,
      confidence: action.confidence,
      expectedBenefit: action.expectedBenefit,
      payload: action.payload,
    });
    memoIds.push(memo.id);
  }

  const completed = await prisma.growthLoopRun.update({
    where: { id: run.id },
    data: {
      status: "COMPLETED",
      // store first memo id for backwards compat
      decisionMemoId: memoIds[0] ?? null,
      summary: {
        snapshotDate: snapshot.date,
        actionsProposed: actions.length,
        memoIds,
      },
    },
  });

  return {
    ok: true,
    alreadyRan: false,
    run: completed,
    snapshot,
    memoIds,
    actionsProposed: actions.length,
  };
}
