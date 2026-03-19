/**
 * KB Healer — dispatches auto-heals and creates decision memos.
 * Risk/confidence matrix determines action.
 */
import { prisma } from "../../db/prisma.js";
import { upsertChunks } from "../../lib/pinecone.js";
import { createDecisionMemo } from "../../services/decisionMemos.js";
import { loadEnv } from "../../env.js";
import type { KbIssue } from "./kbEval.js";
import type { KbHealEvent } from "../../lib/kbHealEmitter.js";

const TENANT_ID = "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// Rate limiting state
let healCountThisHour = 0;
let healHourStart = Date.now();

function resetHourlyCountIfNeeded() {
  if (Date.now() - healHourStart > 60 * 60 * 1000) {
    healCountThisHour = 0;
    healHourStart = Date.now();
  }
}

export type HealResult = {
  autoHealed: number;
  decisionMemosCreated: number;
  totalCostUsd: number;
  actions: Array<{
    actionType: string;
    status: string;
    documentId?: string;
    costUsd: number;
  }>;
};

export async function dispatchHeals(
  issues: KbIssue[],
  runId: string | null,
  tenantId: string = TENANT_ID,
): Promise<HealResult> {
  const env = loadEnv(process.env);
  const confidenceThreshold = Number(env.CONFIDENCE_AUTO_THRESHOLD ?? 0.7);
  const costCeiling = Number((env as any).KB_HEAL_COST_CEILING ?? 0.5);
  const maxPerHour = Number((env as any).KB_HEAL_MAX_PER_HOUR ?? 10);

  resetHourlyCountIfNeeded();

  const result: HealResult = {
    autoHealed: 0,
    decisionMemosCreated: 0,
    totalCostUsd: 0,
    actions: [],
  };

  // Safe actions that always auto-execute (zero-cost, non-destructive)
  const SAFE_ACTIONS = new Set(["re-embed", "relink", "reclassify"]);

  for (const issue of issues) {
    // Safe actions just execute — no human needed for re-embedding a doc
    const isSafe = SAFE_ACTIONS.has(issue.suggestedAction) && issue.estimatedCostUsd <= costCeiling;

    const canAutoHeal = isSafe || (
      issue.riskTier <= 1 &&
      issue.confidence >= confidenceThreshold &&
      issue.estimatedCostUsd <= costCeiling &&
      healCountThisHour < maxPerHour
    );

    if (canAutoHeal) {
      // Execute auto-heal
      const costUsd = await executeHeal(issue, tenantId);
      healCountThisHour++;

      await prisma.kbHealAction.create({
        data: {
          runId: runId ?? undefined,
          tenantId,
          actionType: issue.suggestedAction,
          targetDocumentId: issue.documentId ?? null,
          targetChunkId: issue.chunkId ?? null,
          riskTier: issue.riskTier,
          confidenceScore: issue.confidence,
          estimatedCostUsd: issue.estimatedCostUsd,
          actualCostUsd: costUsd,
          status: "auto-executed",
          trigger: "cron",
          description: issue.description,
          executedAt: new Date(),
        },
      });

      result.autoHealed++;
      result.totalCostUsd += costUsd;
      result.actions.push({
        actionType: issue.suggestedAction,
        status: "auto-executed",
        documentId: issue.documentId,
        costUsd,
      });
    } else {
      // Only destructive actions (merge, delete) need human approval
      const memo = await createDecisionMemo({
        tenantId,
        agent: "ATLAS",
        title: `KB Heal: ${issue.type} — ${issue.description.slice(0, 100)}`,
        rationale: [
          issue.description,
          "",
          `Suggested action: ${issue.suggestedAction}`,
          `Risk tier: ${issue.riskTier}`,
          `Confidence: ${(issue.confidence * 100).toFixed(0)}%`,
          `Estimated cost: $${issue.estimatedCostUsd.toFixed(4)}`,
        ].join("\n"),
        estimatedCostUsd: issue.estimatedCostUsd,
        riskTier: Math.max(issue.riskTier, 2),
        confidence: issue.confidence,
        expectedBenefit: `Fix ${issue.type} issue to improve KB health score`,
        payload: {
          issueType: issue.type,
          suggestedAction: issue.suggestedAction,
          documentId: issue.documentId,
          chunkId: issue.chunkId,
        },
      });

      await prisma.kbHealAction.create({
        data: {
          runId: runId ?? undefined,
          tenantId,
          actionType: issue.suggestedAction,
          targetDocumentId: issue.documentId ?? null,
          targetChunkId: issue.chunkId ?? null,
          riskTier: issue.riskTier,
          confidenceScore: issue.confidence,
          estimatedCostUsd: issue.estimatedCostUsd,
          status: "pending-approval",
          decisionMemoId: memo.id,
          trigger: "cron",
          description: issue.description,
        },
      });

      result.decisionMemosCreated++;
      result.actions.push({
        actionType: issue.suggestedAction,
        status: "pending-approval",
        documentId: issue.documentId,
        costUsd: 0,
      });
    }
  }

  return result;
}

// Execute a single auto-heal action
async function executeHeal(issue: KbIssue, tenantId: string): Promise<number> {
  let costUsd = 0;

  switch (issue.suggestedAction) {
    case "relink":
    case "re-embed": {
      if (!issue.documentId) break;

      const doc = await prisma.kbDocument.findUnique({
        where: { id: issue.documentId },
        select: {
          id: true,
          slug: true,
          title: true,
          body: true,
          tier: true,
          category: true,
          tenantId: true,
        },
      });
      if (!doc || !doc.body) break;

      const tier = doc.tier ?? "tenant";
      const ns =
        tier === "public" ? "public" : tier === "internal" ? "internal" : `tenant-${tenantId}`;

      await upsertChunks(
        [
          {
            id: `${doc.id}::0`,
            content: `[Tier: ${tier}] [Category: ${doc.category ?? "general"}] [Doc: ${doc.title}]\n---\n${doc.body.slice(0, 7500)}`,
            tenantId: doc.tenantId,
            documentId: doc.id,
            slug: doc.slug,
            title: doc.title,
            tier,
            category: doc.category ?? undefined,
          },
        ],
        ns,
      );

      costUsd = 0.00002; // approximate embedding cost
      break;
    }

    case "reclassify": {
      // Low-risk: category changes require more context — just log for now
      costUsd = 0;
      break;
    }

    default:
      break;
  }

  return costUsd;
}

// Handle reactive heal events from the brain
export async function handleReactiveHeal(event: KbHealEvent): Promise<void> {
  const env = loadEnv(process.env);
  const maxPerHour = Number((env as any).KB_HEAL_MAX_PER_HOUR ?? 10);

  resetHourlyCountIfNeeded();
  if (healCountThisHour >= maxPerHour) {
    console.log(`[kb-heal] Rate limited — ${healCountThisHour}/${maxPerHour} heals this hour`);
    return;
  }

  const issue: KbIssue = {
    type:
      event.errorType === "coverage_gap"
        ? "orphan"
        : event.errorType === "embedding_drift"
          ? "stale"
          : event.errorType === "memory_corruption"
            ? "duplicate"
            : "stale",
    severity: "medium",
    riskTier: 1,
    confidence: 0.7,
    estimatedCostUsd: 0.00002,
    description: `Reactive: ${event.errorType} triggered by agent ${event.agentId} — query: "${event.query.slice(0, 100)}"`,
    suggestedAction: "re-embed",
  };

  await dispatchHeals([issue], null, event.tenantId);
  console.log(`[kb-heal] Reactive heal dispatched for ${event.errorType}`);
}
