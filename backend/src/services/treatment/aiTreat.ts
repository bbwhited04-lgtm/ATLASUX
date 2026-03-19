/**
 * AI Treat stage — Vidu Q2-pro-fast API for video AI treatment.
 *
 * Async handling: Vidu returns a task ID, we poll for completion.
 * Rate limiting: 200ms between API calls per-tenant.
 * Retry budget: Max 2 retries per clip.
 * Spend tracking: LedgerEntry for every successful treatment.
 */

import fs from "fs/promises";
import path from "path";
import { prisma } from "../../db/prisma.js";
import { resolveCredential } from "../credentialResolver.js";
import { treatmentDir, type StageResult } from "./types.js";

const VIDU_API_BASE = "https://api.vidu.com/v1";
const VIDU_COST_PER_CLIP = 0.055;
const MAX_RETRIES = 2;
const RATE_LIMIT_MS = 200;
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runAiTreat(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    include: {
      clips: {
        where: { status: "approved", outputPath: { not: null } },
        orderBy: { startTime: "asc" },
      },
    },
  });
  if (!treatment) return { ok: false, error: "Treatment not found" };
  if (treatment.clips.length === 0) return { ok: false, error: "No clips ready for treatment" };

  const apiKey = await resolveCredential(treatment.tenantId, "vidu");
  if (!apiKey) return { ok: false, error: "Vidu API key not configured" };

  // Check daily spend cap
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySpend = await prisma.ledgerEntry.aggregate({
    where: {
      tenantId: treatment.tenantId,
      category: "api_spend",
      entryType: "debit",
      occurredAt: { gte: todayStart },
    },
    _sum: { amountCents: true },
  });
  const dailySpentUsd = Number(todaySpend._sum.amountCents ?? 0n) / 100;
  const dailyCap = Number(process.env.DAILY_VIDU_SPEND_CAP ?? 10);
  if (dailySpentUsd >= dailyCap) {
    return { ok: false, error: `Daily Vidu spend cap reached ($${dailySpentUsd.toFixed(2)} / $${dailyCap})` };
  }

  const dir = treatmentDir(treatmentId);
  const treatedDir = path.join(dir, "treated");
  await fs.mkdir(treatedDir, { recursive: true });

  let successCount = 0;
  let totalCost = 0;

  for (const clip of treatment.clips) {
    if (!clip.outputPath) continue;

    // Idempotent: check if already treated
    const treatedPath = path.join(treatedDir, `${path.basename(clip.outputPath, ".mp4")}-treated.mp4`);
    try {
      await fs.access(treatedPath);
      successCount++;
      continue;
    } catch { /* proceed */ }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await sleep(RATE_LIMIT_MS);

        const clipBuffer = await fs.readFile(clip.outputPath);
        const taskId = await createViduTask(apiKey, clipBuffer, path.basename(clip.outputPath));

        const resultUrl = await pollViduTask(apiKey, taskId);
        if (!resultUrl) {
          throw new Error("Vidu task timed out or failed");
        }

        const resultRes = await fetch(resultUrl);
        if (!resultRes.ok) throw new Error(`Failed to download treated clip: ${resultRes.status}`);
        const resultBuffer = Buffer.from(await resultRes.arrayBuffer());
        await fs.writeFile(treatedPath, resultBuffer);

        await prisma.treatmentClip.update({
          where: { id: clip.id },
          data: {
            outputPath: treatedPath,
            viduModel: "Q2-pro-fast",
            viduCost: VIDU_COST_PER_CLIP,
          },
        });

        await prisma.ledgerEntry.create({
          data: {
            tenantId: treatment.tenantId,
            entryType: "debit",
            category: "api_spend",
            amountCents: BigInt(Math.round(VIDU_COST_PER_CLIP * 100)),
            currency: "USD",
            description: "Vidu Q2-pro-fast treatment clip",
            externalRef: treatmentId,
            reference_type: "treatment_clip",
            reference_id: clip.id,
          },
        });

        totalCost += VIDU_COST_PER_CLIP;
        successCount++;
        break;
      } catch (err: any) {
        if (attempt >= MAX_RETRIES) {
          await prisma.treatmentClip.update({
            where: { id: clip.id },
            data: {
              status: "failed",
              error: `Treatment failed after ${MAX_RETRIES + 1} attempts: ${err?.message ?? err}`,
            },
          });
        }
      }
    }
  }

  if (successCount === 0) return { ok: false, error: "All clips failed AI treatment" };

  await prisma.treatment.update({
    where: { id: treatmentId },
    data: { costActual: (treatment.costActual ?? 0) + totalCost },
  });

  // Cleanup raw clips directory
  const clipsDir = path.join(dir, "clips");
  await fs.rm(clipsDir, { recursive: true, force: true }).catch(() => {});

  return { ok: true, nextStage: "format" };
}

async function createViduTask(apiKey: string, videoBuffer: Buffer, filename: string): Promise<string> {
  const blob = new Blob([new Uint8Array(videoBuffer)], { type: "video/mp4" });
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("model", "Q2-pro-fast");
  form.append("resolution", "720P");

  const res = await fetch(`${VIDU_API_BASE}/tasks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vidu create task ${res.status}: ${text}`);
  }

  const json = await res.json() as any;
  return json.task_id ?? json.id;
}

async function pollViduTask(apiKey: string, taskId: string): Promise<string | null> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const res = await fetch(`${VIDU_API_BASE}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) continue;

    const json = await res.json() as any;
    const status = json.status ?? json.state;

    if (status === "completed" || status === "success") {
      return json.output_url ?? json.result?.url ?? null;
    }
    if (status === "failed" || status === "error") {
      throw new Error(`Vidu task failed: ${json.error ?? json.message ?? "unknown error"}`);
    }
  }

  return null;
}
