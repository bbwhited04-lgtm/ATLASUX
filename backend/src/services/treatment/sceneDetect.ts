/**
 * Scene Detect stage — PySceneDetect with FFmpeg fallback.
 *
 * Detects scene boundaries (cuts, transitions) in the source video.
 * Falls back to FFmpeg's scene filter if PySceneDetect isn't installed.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../../db/prisma.js";
import { treatmentDir, type SceneBoundary, type StageResult } from "./types.js";

const execFileAsync = promisify(execFile);

export async function runSceneDetect(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId } });
  if (!treatment) return { ok: false, error: "Treatment not found" };

  const dir = treatmentDir(treatmentId);
  const scenesPath = path.join(dir, "scenes.json");

  // Idempotent
  try {
    await fs.access(scenesPath);
    return { ok: true, nextStage: "highlight_score" };
  } catch { /* proceed */ }

  const sourcePath = path.join(dir, "source.mp4");
  let scenes: SceneBoundary[];

  // Try PySceneDetect first
  try {
    scenes = await detectWithPySceneDetect(sourcePath, dir);
  } catch {
    // Fallback to FFmpeg scene filter
    try {
      scenes = await detectWithFfmpeg(sourcePath, treatment.duration ?? 0);
    } catch (err: any) {
      return { ok: false, error: `Scene detection failed: ${err?.message ?? err}` };
    }
  }

  await fs.writeFile(scenesPath, JSON.stringify(scenes, null, 2));
  return { ok: true, nextStage: "highlight_score" };
}

async function detectWithPySceneDetect(
  sourcePath: string,
  dir: string,
): Promise<SceneBoundary[]> {
  const csvPath = path.join(dir, "scenes-raw.csv");

  await execFileAsync("scenedetect", [
    "-i", sourcePath,
    "detect-adaptive",
    "list-scenes",
    "-o", dir,
    "-f", csvPath,
  ], { timeout: 10 * 60 * 1000 });

  const csv = await fs.readFile(csvPath, "utf-8");
  const lines = csv.split("\n").filter((l) => l.trim() && !l.startsWith("Scene"));

  const scenes: SceneBoundary[] = lines.map((line, i) => {
    const cols = line.split(",");
    const startTime = parseFloat(cols[3]) || 0;
    const endTime = parseFloat(cols[6]) || 0;
    return { sceneNumber: i + 1, startTime, endTime };
  }).filter((s) => s.endTime > s.startTime);

  await fs.unlink(csvPath).catch(() => {});
  return scenes;
}

async function detectWithFfmpeg(
  sourcePath: string,
  totalDuration: number,
): Promise<SceneBoundary[]> {
  const { stderr } = await execFileAsync("ffmpeg", [
    "-i", sourcePath,
    "-vf", "select='gt(scene,0.3)',showinfo",
    "-f", "null",
    "-",
  ], { timeout: 10 * 60 * 1000 });

  const timestamps: number[] = [0];
  const regex = /pts_time:(\d+\.?\d*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(stderr)) !== null) {
    timestamps.push(parseFloat(match[1]));
  }

  if (totalDuration > 0) timestamps.push(totalDuration);

  const scenes: SceneBoundary[] = [];
  for (let i = 0; i < timestamps.length - 1; i++) {
    scenes.push({
      sceneNumber: i + 1,
      startTime: timestamps[i],
      endTime: timestamps[i + 1],
    });
  }

  return scenes;
}
