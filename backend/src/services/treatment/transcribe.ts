/**
 * Transcribe stage — OpenAI Whisper API for timestamped transcription.
 *
 * Handles the 25MB upload limit by extracting audio via FFmpeg,
 * then chunking large files into 10-minute segments with 30s overlap.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../../db/prisma.js";
import { treatmentDir, type TranscriptSegment, type StageResult } from "./types.js";

const execFileAsync = promisify(execFile);

const WHISPER_COST_PER_MINUTE = 0.006;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB
const CHUNK_DURATION_SEC = 600; // 10 minutes
const CHUNK_OVERLAP_SEC = 30;

export async function runTranscribe(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId } });
  if (!treatment) return { ok: false, error: "Treatment not found" };

  const dir = treatmentDir(treatmentId);
  const transcriptPath = path.join(dir, "transcript.json");

  // Idempotent: skip if transcript already exists
  try {
    await fs.access(transcriptPath);
    return { ok: true, nextStage: "scene_detect" };
  } catch { /* proceed */ }

  const sourcePath = path.join(dir, "source.mp4");
  const audioPath = path.join(dir, "audio.mp3");

  // Extract audio via FFmpeg
  try {
    await execFileAsync("ffmpeg", [
      "-i", sourcePath,
      "-vn", "-acodec", "libmp3lame", "-q:a", "4",
      "-y", audioPath,
    ], { timeout: 5 * 60 * 1000 });
  } catch (err: any) {
    return { ok: false, error: `Audio extraction failed: ${err?.message ?? err}` };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, error: "OPENAI_API_KEY not set" };

  try {
    const stat = await fs.stat(audioPath);
    let segments: TranscriptSegment[];

    if (stat.size <= MAX_UPLOAD_BYTES) {
      segments = await transcribeFile(audioPath, apiKey);
    } else {
      segments = await transcribeChunked(audioPath, apiKey, dir);
    }

    await fs.writeFile(transcriptPath, JSON.stringify(segments, null, 2));

    // Record cost
    const durationMin = (treatment.duration ?? 0) / 60;
    const cost = durationMin * WHISPER_COST_PER_MINUTE;
    await prisma.treatment.update({
      where: { id: treatmentId },
      data: { costActual: (treatment.costActual ?? 0) + cost },
    });

    // Record ledger entry
    await prisma.ledgerEntry.create({
      data: {
        tenantId: treatment.tenantId,
        entryType: "debit",
        category: "api_spend",
        amountCents: BigInt(Math.round(cost * 100)),
        currency: "USD",
        description: "Whisper transcription",
        externalRef: treatmentId,
        reference_type: "treatment",
        reference_id: treatmentId,
      },
    });

    // Cleanup audio file
    await fs.unlink(audioPath).catch(() => {});

    return { ok: true, nextStage: "scene_detect" };
  } catch (err: any) {
    return { ok: false, error: `Transcription failed: ${err?.message ?? err}` };
  }
}

async function transcribeFile(filePath: string, apiKey: string): Promise<TranscriptSegment[]> {
  const fileBuffer = await fs.readFile(filePath);
  const blob = new Blob([fileBuffer], { type: "audio/mpeg" });

  const form = new FormData();
  form.append("file", blob, path.basename(filePath));
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whisper API ${res.status}: ${text}`);
  }

  const json = await res.json() as any;
  const segments: TranscriptSegment[] = (json.segments ?? []).map((s: any) => ({
    start: s.start,
    end: s.end,
    text: s.text?.trim() ?? "",
  }));

  return segments;
}

async function transcribeChunked(
  audioPath: string,
  apiKey: string,
  dir: string,
): Promise<TranscriptSegment[]> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-show_entries", "format=duration",
    "-of", "csv=p=0",
    audioPath,
  ]);
  const totalDuration = parseFloat(stdout.trim()) || 0;

  const allSegments: TranscriptSegment[] = [];
  let offset = 0;
  let chunkIdx = 0;

  while (offset < totalDuration) {
    const chunkPath = path.join(dir, `audio-chunk-${chunkIdx}.mp3`);
    const duration = Math.min(CHUNK_DURATION_SEC + CHUNK_OVERLAP_SEC, totalDuration - offset);

    await execFileAsync("ffmpeg", [
      "-i", audioPath,
      "-ss", String(offset),
      "-t", String(duration),
      "-acodec", "libmp3lame", "-q:a", "4",
      "-y", chunkPath,
    ], { timeout: 2 * 60 * 1000 });

    const chunkSegments = await transcribeFile(chunkPath, apiKey);

    // Adjust timestamps by chunk offset
    for (const seg of chunkSegments) {
      seg.start += offset;
      seg.end += offset;
    }

    // Remove overlapping segments from previous chunk
    if (allSegments.length > 0 && chunkIdx > 0) {
      const overlapStart = offset;
      const filtered = chunkSegments.filter((s) => s.start >= overlapStart + CHUNK_OVERLAP_SEC / 2);
      allSegments.push(...filtered);
    } else {
      allSegments.push(...chunkSegments);
    }

    await fs.unlink(chunkPath).catch(() => {});
    offset += CHUNK_DURATION_SEC;
    chunkIdx++;
  }

  return allSegments;
}
