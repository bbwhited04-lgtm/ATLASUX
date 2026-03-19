/**
 * Download stage — uses yt-dlp to download YouTube videos.
 *
 * Security: Uses execFile (not exec) to prevent command injection.
 * URL validation: Only YouTube URLs allowed.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { prisma } from "../../db/prisma.js";
import { treatmentDir, type VideoMeta, type StageResult } from "./types.js";

const execFileAsync = promisify(execFile);

const YOUTUBE_URL_RE = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//;

/** Check available disk space (bytes) on the partition containing dir */
async function checkDiskSpace(dir: string): Promise<number> {
  try {
    if (process.platform === "win32") return os.freemem();
    const { stdout } = await execFileAsync("df", ["--output=avail", "-B1", dir]);
    const lines = stdout.trim().split("\n");
    return parseInt(lines[lines.length - 1], 10) || 0;
  } catch {
    return Infinity; // If check fails, don't block
  }
}

export async function runDownload(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId } });
  if (!treatment) return { ok: false, error: "Treatment not found" };

  // Validate URL
  if (!YOUTUBE_URL_RE.test(treatment.sourceUrl)) {
    return { ok: false, error: "Invalid URL: only YouTube URLs are supported" };
  }

  const dir = treatmentDir(treatmentId);
  await fs.mkdir(dir, { recursive: true });

  // Check disk space (2GB minimum)
  const freeBytes = await checkDiskSpace(dir);
  if (freeBytes < 2 * 1024 * 1024 * 1024) {
    return { ok: false, error: "Insufficient disk space (need 2GB minimum)" };
  }

  const outputPath = path.join(dir, "source.mp4");

  // Skip if already downloaded (idempotent)
  try {
    await fs.access(outputPath);
    const meta = await extractMeta(treatment.sourceUrl);
    if (meta) {
      await prisma.treatment.update({
        where: { id: treatmentId },
        data: { sourceTitle: meta.title, duration: meta.duration },
      });
    }
    return { ok: true, nextStage: "transcribe" };
  } catch {
    // File doesn't exist, proceed with download
  }

  try {
    await execFileAsync("yt-dlp", [
      "-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
      "--merge-output-format", "mp4",
      "-o", outputPath,
      "--no-playlist",
      "--no-overwrites",
      treatment.sourceUrl,
    ], { timeout: 10 * 60 * 1000 });

    const meta = await extractMeta(treatment.sourceUrl);
    if (meta) {
      await prisma.treatment.update({
        where: { id: treatmentId },
        data: { sourceTitle: meta.title, duration: meta.duration },
      });
    }

    return { ok: true, nextStage: "transcribe" };
  } catch (err: any) {
    return { ok: false, error: `Download failed: ${err?.message ?? err}` };
  }
}

async function extractMeta(url: string): Promise<VideoMeta | null> {
  try {
    const { stdout } = await execFileAsync("yt-dlp", [
      "--dump-json", "--no-download", "--no-playlist", url,
    ], { timeout: 30_000 });
    const json = JSON.parse(stdout);
    return {
      title: json.title ?? "Untitled",
      duration: Math.round(json.duration ?? 0),
      channel: json.channel ?? json.uploader ?? "",
      description: (json.description ?? "").slice(0, 500),
    };
  } catch {
    return null;
  }
}
