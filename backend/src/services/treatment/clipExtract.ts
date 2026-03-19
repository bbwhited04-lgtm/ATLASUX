/**
 * Clip Extract stage — FFmpeg clip extraction from source video.
 *
 * Takes approved clips from TreatmentClip records and extracts them
 * as individual .mp4 files using FFmpeg.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../../db/prisma.js";
import { treatmentDir, type StageResult } from "./types.js";

const execFileAsync = promisify(execFile);

export async function runClipExtract(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    include: { clips: { where: { status: "approved" }, orderBy: { startTime: "asc" } } },
  });
  if (!treatment) return { ok: false, error: "Treatment not found" };
  if (treatment.clips.length === 0) return { ok: false, error: "No approved clips" };

  const dir = treatmentDir(treatmentId);
  const clipsDir = path.join(dir, "clips");
  await fs.mkdir(clipsDir, { recursive: true });

  const sourcePath = path.join(dir, "source.mp4");

  for (let i = 0; i < treatment.clips.length; i++) {
    const clip = treatment.clips[i];
    const outputFile = path.join(clipsDir, `clip-${String(i + 1).padStart(3, "0")}.mp4`);

    // Idempotent: skip if already extracted
    try {
      await fs.access(outputFile);
      continue;
    } catch { /* proceed */ }

    const duration = clip.endTime - clip.startTime;

    try {
      await execFileAsync("ffmpeg", [
        "-i", sourcePath,
        "-ss", String(clip.startTime),
        "-t", String(duration),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-y", outputFile,
      ], { timeout: 5 * 60 * 1000 });

      await prisma.treatmentClip.update({
        where: { id: clip.id },
        data: { outputPath: outputFile },
      });
    } catch (err: any) {
      await prisma.treatmentClip.update({
        where: { id: clip.id },
        data: { status: "failed", error: err?.message ?? String(err) },
      });
    }
  }

  const successClips = await prisma.treatmentClip.count({
    where: { treatmentId, status: "approved", outputPath: { not: null } },
  });
  if (successClips === 0) return { ok: false, error: "No clips were extracted successfully" };

  // Cleanup source video (no longer needed)
  await fs.unlink(sourcePath).catch(() => {});

  return { ok: true, nextStage: "ai_treat" };
}
