/**
 * Video Composer — Victor's FFmpeg-based composition pipeline.
 *
 * Builds YouTube Shorts (9:16, 1080×1920) from images, clips, text overlays,
 * and audio tracks. All operations use fluent-ffmpeg, which shells out to
 * a system-installed `ffmpeg` binary.
 *
 * Requires: `ffmpeg` on PATH.
 */

import Ffmpeg from "fluent-ffmpeg";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import fs from "fs/promises";

// ── Types ────────────────────────────────────────────────────────────────────

export type TextOverlay = {
  text: string;
  x?: string;          // default "(w-text_w)/2" (centered)
  y?: string;          // default "(h-text_h)/2"
  fontSize?: number;   // default 48
  fontColor?: string;  // default "white"
  borderW?: number;    // shadow border width, default 3
  startSec?: number;   // show from (default 0)
  durationSec?: number; // show for (omit = entire clip)
};

export type ComposeShortOpts = {
  /** Image paths — each shown for `imageDurationSec` (default 3s) */
  images?: string[];
  /** Video clip paths — concatenated in order */
  clips?: string[];
  /** Text overlays burned into the final output */
  textOverlays?: TextOverlay[];
  /** Audio file to mix onto the output */
  audioPath?: string;
  /** Duration per image in seconds (default 3) */
  imageDurationSec?: number;
  /** Output file path (default: temp file) */
  outputPath?: string;
};

export type ComposeResult = {
  ok: boolean;
  outputPath?: string;
  durationSec?: number;
  error?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function tmpPath(ext = ".mp4"): string {
  return path.join(os.tmpdir(), `victor-${randomUUID()}${ext}`);
}

/** Check if ffmpeg is available on the system */
export async function isFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    Ffmpeg.getAvailableFormats((err) => {
      resolve(!err);
    });
  });
}

// ── Resize for Shorts (9:16) ─────────────────────────────────────────────────

export function resizeForShorts(inputPath: string, outputPath?: string): Promise<ComposeResult> {
  const out = outputPath ?? tmpPath();
  return new Promise((resolve) => {
    Ffmpeg(inputPath)
      .videoFilters([
        "scale=1080:1920:force_original_aspect_ratio=decrease",
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
      ])
      .outputOptions(["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac"])
      .output(out)
      .on("end", () => resolve({ ok: true, outputPath: out }))
      .on("error", (err) => resolve({ ok: false, error: err.message }))
      .run();
  });
}

// ── Concatenate clips ────────────────────────────────────────────────────────

export async function concatenateClips(clipPaths: string[], outputPath?: string): Promise<ComposeResult> {
  if (clipPaths.length === 0) return { ok: false, error: "No clips provided" };
  if (clipPaths.length === 1) {
    // Single clip — just copy
    const out = outputPath ?? tmpPath();
    await fs.copyFile(clipPaths[0], out);
    return { ok: true, outputPath: out };
  }

  const out = outputPath ?? tmpPath();
  // Write concat file list
  const listPath = tmpPath(".txt");
  const listContent = clipPaths.map((p) => `file '${p}'`).join("\n");
  await fs.writeFile(listPath, listContent);

  return new Promise((resolve) => {
    Ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy"])
      .output(out)
      .on("end", async () => {
        await fs.unlink(listPath).catch(() => {});
        resolve({ ok: true, outputPath: out });
      })
      .on("error", async (err) => {
        await fs.unlink(listPath).catch(() => {});
        resolve({ ok: false, error: err.message });
      })
      .run();
  });
}

// ── Add text overlay ─────────────────────────────────────────────────────────

export function addTextOverlay(
  inputPath: string,
  overlay: TextOverlay,
  outputPath?: string,
): Promise<ComposeResult> {
  const out = outputPath ?? tmpPath();
  const fontSize = overlay.fontSize ?? 48;
  const fontColor = overlay.fontColor ?? "white";
  const x = overlay.x ?? "(w-text_w)/2";
  const y = overlay.y ?? "(h-text_h)/2";
  const borderW = overlay.borderW ?? 3;

  // Escape single quotes for FFmpeg drawtext
  const escapedText = overlay.text.replace(/'/g, "'\\''").replace(/:/g, "\\:");

  let filter = `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:x=${x}:y=${y}:borderw=${borderW}:bordercolor=black`;

  if (overlay.startSec !== undefined) {
    const end = overlay.durationSec
      ? `lt(t\\,${overlay.startSec + overlay.durationSec})`
      : "1";
    filter += `:enable='between(t\\,${overlay.startSec}\\,${overlay.startSec + (overlay.durationSec ?? 9999)})'`;
  }

  return new Promise((resolve) => {
    Ffmpeg(inputPath)
      .videoFilters(filter)
      .outputOptions(["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac"])
      .output(out)
      .on("end", () => resolve({ ok: true, outputPath: out }))
      .on("error", (err) => resolve({ ok: false, error: err.message }))
      .run();
  });
}

// ── Add audio track ──────────────────────────────────────────────────────────

export function addAudioTrack(
  videoPath: string,
  audioPath: string,
  outputPath?: string,
): Promise<ComposeResult> {
  const out = outputPath ?? tmpPath();
  return new Promise((resolve) => {
    Ffmpeg(videoPath)
      .addInput(audioPath)
      .outputOptions([
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
      ])
      .output(out)
      .on("end", () => resolve({ ok: true, outputPath: out }))
      .on("error", (err) => resolve({ ok: false, error: err.message }))
      .run();
  });
}

// ── Generate thumbnail ───────────────────────────────────────────────────────

export function generateThumbnail(
  videoPath: string,
  timestampSec = 1,
  outputPath?: string,
): Promise<ComposeResult> {
  const out = outputPath ?? tmpPath(".jpg");
  return new Promise((resolve) => {
    Ffmpeg(videoPath)
      .seekInput(timestampSec)
      .frames(1)
      .outputOptions(["-q:v", "2"])
      .output(out)
      .on("end", () => resolve({ ok: true, outputPath: out }))
      .on("error", (err) => resolve({ ok: false, error: err.message }))
      .run();
  });
}

// ── Images → slideshow clip ──────────────────────────────────────────────────

function imagesToClip(images: string[], durationPerImage: number, outputPath: string): Promise<ComposeResult> {
  if (images.length === 0) return Promise.resolve({ ok: false, error: "No images" });

  // Build a concat filter for images
  const listPath = tmpPath(".txt");
  const listContent = images.map((p) => `file '${p}'\nduration ${durationPerImage}`).join("\n");

  return new Promise(async (resolve) => {
    await fs.writeFile(listPath, listContent + `\nfile '${images[images.length - 1]}'`);

    Ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .videoFilters([
        "scale=1080:1920:force_original_aspect_ratio=decrease",
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
      ])
      .outputOptions(["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p", "-r", "30"])
      .output(outputPath)
      .on("end", async () => {
        await fs.unlink(listPath).catch(() => {});
        resolve({ ok: true, outputPath });
      })
      .on("error", async (err) => {
        await fs.unlink(listPath).catch(() => {});
        resolve({ ok: false, error: err.message });
      })
      .run();
  });
}

// ── Compose Short (main entrypoint) ──────────────────────────────────────────

export async function composeShort(opts: ComposeShortOpts): Promise<ComposeResult> {
  const segments: string[] = [];
  const tempFiles: string[] = [];
  const imageDur = opts.imageDurationSec ?? 3;

  try {
    // 1. Convert images to a slideshow clip
    if (opts.images && opts.images.length > 0) {
      const slideshowPath = tmpPath();
      tempFiles.push(slideshowPath);
      const res = await imagesToClip(opts.images, imageDur, slideshowPath);
      if (!res.ok) return res;
      segments.push(slideshowPath);
    }

    // 2. Resize any video clips to 9:16
    if (opts.clips && opts.clips.length > 0) {
      for (const clip of opts.clips) {
        const resized = tmpPath();
        tempFiles.push(resized);
        const res = await resizeForShorts(clip, resized);
        if (!res.ok) return res;
        segments.push(resized);
      }
    }

    if (segments.length === 0) return { ok: false, error: "No images or clips provided" };

    // 3. Concatenate all segments
    let current: string;
    if (segments.length === 1) {
      current = segments[0];
    } else {
      const concatPath = tmpPath();
      tempFiles.push(concatPath);
      const concatRes = await concatenateClips(segments, concatPath);
      if (!concatRes.ok) return concatRes;
      current = concatPath;
    }

    // 4. Burn text overlays
    if (opts.textOverlays && opts.textOverlays.length > 0) {
      for (const overlay of opts.textOverlays) {
        const overlayPath = tmpPath();
        tempFiles.push(overlayPath);
        const res = await addTextOverlay(current, overlay, overlayPath);
        if (!res.ok) return res;
        current = overlayPath;
      }
    }

    // 5. Add audio track
    if (opts.audioPath) {
      const audioPath = tmpPath();
      tempFiles.push(audioPath);
      const res = await addAudioTrack(current, opts.audioPath, audioPath);
      if (!res.ok) return res;
      current = audioPath;
    }

    // 6. Copy to final output
    const finalOut = opts.outputPath ?? tmpPath();
    if (current !== finalOut) {
      await fs.copyFile(current, finalOut);
    }

    // Get duration
    const durationSec = await new Promise<number>((resolve) => {
      Ffmpeg.ffprobe(finalOut, (err, data) => {
        resolve(err ? 0 : Math.round(data.format.duration ?? 0));
      });
    });

    return { ok: true, outputPath: finalOut, durationSec };
  } finally {
    // Clean up intermediate temp files (but not the final output)
    for (const f of tempFiles) {
      if (f !== opts.outputPath) await fs.unlink(f).catch(() => {});
    }
  }
}
