/**
 * Format stage — delegates to existing videoComposer.ts for 9:16 formatting.
 *
 * Resizes treated clips, adds text overlays and optional audio,
 * generates thumbnails. All local FFmpeg — no API cost.
 */

import fs from "fs/promises";
import path from "path";
import { prisma } from "../../db/prisma.js";
import { resizeForShorts, addTextOverlay, generateThumbnail } from "../videoComposer.js";
import { treatmentDir, type StageResult } from "./types.js";

export async function runFormat(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    include: {
      clips: {
        where: { status: { in: ["approved", "pending"] }, outputPath: { not: null } },
        orderBy: { startTime: "asc" },
      },
    },
  });
  if (!treatment) return { ok: false, error: "Treatment not found" };

  const dir = treatmentDir(treatmentId);
  const shortsDir = path.join(dir, "shorts");
  await fs.mkdir(shortsDir, { recursive: true });

  let successCount = 0;

  for (let i = 0; i < treatment.clips.length; i++) {
    const clip = treatment.clips[i];
    if (!clip.outputPath) continue;

    const shortPath = path.join(shortsDir, `short-${String(i + 1).padStart(3, "0")}.mp4`);
    const thumbPath = path.join(shortsDir, `thumb-${String(i + 1).padStart(3, "0")}.jpg`);

    // Idempotent: skip if already formatted
    try {
      await fs.access(shortPath);
      successCount++;
      continue;
    } catch { /* proceed */ }

    try {
      const resizeResult = await resizeForShorts(clip.outputPath, shortPath);
      if (!resizeResult.ok) {
        await prisma.treatmentClip.update({
          where: { id: clip.id },
          data: { error: `Format failed: ${resizeResult.error}` },
        });
        continue;
      }

      // Add hook text overlay if transcript exists
      if (clip.transcript) {
        const hookText = clip.transcript.split(/[.!?]/)[0]?.trim();
        if (hookText && hookText.length <= 80) {
          const overlayResult = await addTextOverlay(shortPath, {
            text: hookText,
            y: "h*0.85",
            fontSize: 36,
            fontColor: "white",
            borderW: 3,
            startSec: 0,
            durationSec: 4,
          }, shortPath);
          if (!overlayResult.ok) {
            process.stderr.write(`[format] overlay warning: ${overlayResult.error}\n`);
          }
        }
      }

      await generateThumbnail(shortPath, 1, thumbPath);

      await prisma.treatmentClip.update({
        where: { id: clip.id },
        data: { outputPath: shortPath },
      });

      successCount++;
    } catch (err: any) {
      await prisma.treatmentClip.update({
        where: { id: clip.id },
        data: { error: `Format failed: ${err?.message ?? err}` },
      });
    }
  }

  if (successCount === 0) return { ok: false, error: "All clips failed formatting" };

  // Cleanup treated clips directory
  const treatedDir = path.join(dir, "treated");
  await fs.rm(treatedDir, { recursive: true, force: true }).catch(() => {});

  return { ok: true, nextStage: "approval_gate_2" };
}
