/**
 * Treatment Orchestrator — coordinates the 10-stage pipeline.
 *
 * Called by the treatment worker for each active treatment.
 * Advances through stages, creates DecisionMemo at approval gates,
 * and handles status transitions.
 */

import { prisma } from "../../db/prisma.js";
import { createDecisionMemo } from "../decisionMemos.js";
import { runDownload } from "./download.js";
import { runTranscribe } from "./transcribe.js";
import { runSceneDetect } from "./sceneDetect.js";
import { runHighlightScore } from "./highlightScore.js";
import { runClipExtract } from "./clipExtract.js";
import { runAiTreat } from "./aiTreat.js";
import { runFormat } from "./format.js";
import type { StageResult } from "./types.js";
import { deliverBroadcast } from "../../core/agent/tools/broadcastDelivery.js";

/** Status values that map to pipeline stages */
const STAGE_TO_STATUS: Record<string, string> = {
  download: "downloading",
  transcribe: "transcribing",
  scene_detect: "detecting",
  highlight_score: "scoring",
  approval_gate_1: "awaiting_approval",
  clip_extract: "extracting",
  ai_treat: "treating",
  format: "formatting",
  approval_gate_2: "awaiting_publish",
  deliver: "delivering",
};

/** Max 1 concurrent per tenant, 3 global */
const MAX_PER_TENANT = 1;
const MAX_GLOBAL = 3;

export async function canStartTreatment(tenantId: string): Promise<{ ok: boolean; reason?: string }> {
  const activeStatuses = [
    "downloading", "transcribing", "detecting", "scoring",
    "extracting", "treating", "formatting", "delivering",
  ];

  const tenantActive = await prisma.treatment.count({
    where: { tenantId, status: { in: activeStatuses as any } },
  });
  if (tenantActive >= MAX_PER_TENANT) {
    return { ok: false, reason: "A treatment is already in progress for this tenant" };
  }

  const globalActive = await prisma.treatment.count({
    where: { status: { in: activeStatuses as any } },
  });
  if (globalActive >= MAX_GLOBAL) {
    return { ok: false, reason: "Maximum concurrent treatments reached (3)" };
  }

  return { ok: true };
}

export async function createTreatment(tenantId: string, sourceUrl: string, requestedBy?: string): Promise<string> {
  const check = await canStartTreatment(tenantId);
  if (!check.ok) throw new Error(check.reason);

  const treatment = await prisma.treatment.create({
    data: {
      tenantId,
      sourceUrl,
      requestedBy,
      status: "queued",
      stage: "download",
    },
  });

  return treatment.id;
}

/**
 * Process one tick of a treatment's pipeline.
 * Returns true if work was done, false if treatment is waiting or complete.
 */
export async function processTreatmentTick(treatmentId: string): Promise<boolean> {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
  });
  if (!treatment) return false;

  // Skip if in terminal states (approval gates are polled, not skipped)
  const skipStatuses = ["completed", "failed", "cancelled"];
  if (skipStatuses.includes(treatment.status)) return false;

  const stage = treatment.stage;
  const status = STAGE_TO_STATUS[stage] ?? "queued";

  // Update status to reflect current stage
  if (treatment.status !== status) {
    await prisma.treatment.update({
      where: { id: treatmentId },
      data: { status: status as any },
    });
  }

  let result: StageResult;

  switch (stage) {
    case "download":
      result = await runDownload(treatmentId);
      break;
    case "transcribe":
      result = await runTranscribe(treatmentId);
      break;
    case "scene_detect":
      result = await runSceneDetect(treatmentId);
      break;
    case "highlight_score":
      result = await runHighlightScore(treatmentId);
      break;
    case "approval_gate_1":
      result = await handleApprovalGate1(treatmentId);
      break;
    case "clip_extract":
      result = await runClipExtract(treatmentId);
      break;
    case "ai_treat":
      result = await runAiTreat(treatmentId);
      break;
    case "format":
      result = await runFormat(treatmentId);
      break;
    case "approval_gate_2":
      result = await handleApprovalGate2(treatmentId);
      break;
    case "deliver":
      result = await handleDeliver(treatmentId);
      break;
    default:
      result = { ok: false, error: `Unknown stage: ${stage}` };
  }

  if (!result.ok) {
    await prisma.treatment.update({
      where: { id: treatmentId },
      data: { status: "failed" as any, error: result.error },
    });
    return true;
  }

  if (result.nextStage) {
    const nextStatus = STAGE_TO_STATUS[result.nextStage] ?? "queued";
    await prisma.treatment.update({
      where: { id: treatmentId },
      data: { stage: result.nextStage, status: nextStatus as any },
    });
  }

  return true;
}

async function handleApprovalGate1(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    include: { clips: { orderBy: { score: "desc" } } },
  });
  if (!treatment) return { ok: false, error: "Treatment not found" };

  if (treatment.status === "awaiting_approval") {
    // Check if a DecisionMemo was created and approved
    const memo = await prisma.decisionMemo.findFirst({
      where: {
        tenantId: treatment.tenantId,
        title: { startsWith: "[TREATMENT_APPROVAL]" },
        payload: { path: ["treatmentId"], equals: treatmentId },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!memo) {
      // Create the DecisionMemo
      const viduCostPerClip = 0.055;
      const totalViduCost = treatment.clips.length * viduCostPerClip;
      const totalCost = (treatment.costActual ?? 0) + totalViduCost;

      await createDecisionMemo({
        tenantId: treatment.tenantId,
        agent: "victor",
        title: `[TREATMENT_APPROVAL] ${treatment.sourceTitle ?? "Video"}`,
        rationale: `Treatment pipeline for "${treatment.sourceTitle}" has ${treatment.clips.length} clips scored and ready for AI treatment.\n\nCost breakdown:\n- Already spent (Whisper): $${(treatment.costActual ?? 0).toFixed(2)}\n- Vidu treatment: ${treatment.clips.length} clips × $${viduCostPerClip} = $${totalViduCost.toFixed(2)}\n- Total: $${totalCost.toFixed(2)}`,
        estimatedCostUsd: totalCost,
        riskTier: totalCost > Number(process.env.AUTO_SPEND_LIMIT_USD ?? 4) ? 2 : 1,
        expectedBenefit: `${treatment.clips.length} YouTube Shorts from "${treatment.sourceTitle}"`,
        payload: {
          type: "TREATMENT_APPROVAL",
          treatmentId,
          clips: treatment.clips.map((c) => ({
            id: c.id,
            startTime: c.startTime,
            endTime: c.endTime,
            score: c.score,
            transcript: c.transcript?.slice(0, 200),
          })),
          costBreakdown: {
            whisper: treatment.costActual ?? 0,
            vidu: totalViduCost,
            total: totalCost,
          },
        },
      });

      return { ok: true }; // Pause — no nextStage
    }

    // PROPOSED = auto-approved (cost below AUTO_SPEND_LIMIT_USD)
    if (memo.status === "APPROVED" || memo.status === "PROPOSED") {
      const approvedClipIds = (memo.payload as any)?.approvedClipIds;
      if (approvedClipIds && Array.isArray(approvedClipIds)) {
        await prisma.treatmentClip.updateMany({
          where: { treatmentId, id: { in: approvedClipIds } },
          data: { status: "approved" },
        });
        await prisma.treatmentClip.updateMany({
          where: { treatmentId, id: { notIn: approvedClipIds } },
          data: { status: "rejected" },
        });
      } else {
        await prisma.treatmentClip.updateMany({
          where: { treatmentId },
          data: { status: "approved" },
        });
      }
      return { ok: true, nextStage: "clip_extract" };
    }

    if (memo.status === "REJECTED") {
      await prisma.treatment.update({
        where: { id: treatmentId },
        data: { status: "cancelled" as any },
      });
      return { ok: true };
    }

    // Still pending (AWAITING_HUMAN)
    return { ok: true };
  }

  // First time hitting this gate
  await prisma.treatment.update({
    where: { id: treatmentId },
    data: { status: "awaiting_approval" as any },
  });
  return { ok: true };
}

async function handleApprovalGate2(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    include: { clips: { where: { outputPath: { not: null } } } },
  });
  if (!treatment) return { ok: false, error: "Treatment not found" };

  if (treatment.status === "awaiting_publish") {
    const memo = await prisma.decisionMemo.findFirst({
      where: {
        tenantId: treatment.tenantId,
        title: { startsWith: "[TREATMENT_PUBLISH]" },
        payload: { path: ["treatmentId"], equals: treatmentId },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!memo) {
      await createDecisionMemo({
        tenantId: treatment.tenantId,
        agent: "victor",
        title: `[TREATMENT_PUBLISH] ${treatment.sourceTitle ?? "Video"}`,
        rationale: `${treatment.clips.length} Shorts ready for publish from "${treatment.sourceTitle}".\nTotal cost: $${(treatment.costActual ?? 0).toFixed(2)}`,
        estimatedCostUsd: 0,
        riskTier: 1,
        expectedBenefit: `Publish ${treatment.clips.length} Shorts`,
        payload: {
          type: "TREATMENT_PUBLISH",
          treatmentId,
          shorts: treatment.clips.map((c) => ({
            id: c.id,
            outputPath: c.outputPath,
            score: c.score,
          })),
        },
      });
      return { ok: true };
    }

    if (memo.status === "APPROVED" || memo.status === "PROPOSED") {
      return { ok: true, nextStage: "deliver" };
    }
    if (memo.status === "REJECTED") {
      // Not publishing, but treatment is complete (cost already spent)
      await prisma.treatment.update({
        where: { id: treatmentId },
        data: { status: "completed" as any },
      });
      return { ok: true };
    }
    return { ok: true }; // Still pending
  }

  await prisma.treatment.update({
    where: { id: treatmentId },
    data: { status: "awaiting_publish" as any },
  });
  return { ok: true };
}

async function handleDeliver(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    include: { clips: { where: { outputPath: { not: null }, status: { not: "failed" } } } },
  });
  if (!treatment) return { ok: false, error: "Treatment not found" };

  // Load connected integrations for broadcast channels
  const integrations = await prisma.integration.findMany({
    where: { tenantId: treatment.tenantId, connected: true },
  });
  const channels = integrations.map((i) => ({
    id: i.id,
    name: i.provider,
    platform: i.provider,
  }));

  for (const clip of treatment.clips) {
    if (!clip.outputPath) continue;
    try {
      if (channels.length === 0) {
        process.stderr.write(`[treatment] no connected channels for delivery\n`);
        break;
      }

      await deliverBroadcast({
        tenantId: treatment.tenantId,
        channels,
        content: `${treatment.sourceTitle ?? "New Short"} - Clip ${clip.startTime.toFixed(0)}s-${clip.endTime.toFixed(0)}s`,
        videoUrl: clip.outputPath,
      });
    } catch (err: any) {
      process.stderr.write(`[treatment] deliver failed for clip ${clip.id}: ${err?.message ?? err}\n`);
    }
  }

  await prisma.treatment.update({
    where: { id: treatmentId },
    data: { status: "completed" as any },
  });

  return { ok: true };
}
