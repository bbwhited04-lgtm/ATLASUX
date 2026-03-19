# Video Treatment Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 10-stage pipeline that converts YouTube videos into platform-ready Shorts — download, transcribe, detect scenes, score highlights, extract clips, AI-treat (Vidu), format (9:16), and deliver via existing broadcast system. Every dollar of API spend goes through a DecisionMemo approval gate.

**Architecture:** Dedicated `treatmentWorker.ts` polls the `treatments` table (not the `jobs` table). Pipeline state is tracked via `status` + `stage` columns. Two approval gates pause processing via DecisionMemo records. Stage functions live in `backend/src/services/treatment/` and are called sequentially by an orchestrator.

**Tech Stack:** yt-dlp (download), OpenAI Whisper API (transcribe), PySceneDetect/FFmpeg fallback (scenes), DeepSeek/Cerebras LLM (scoring), FFmpeg (clip extract), Vidu Q2-pro-fast API (AI treatment), fluent-ffmpeg via existing videoComposer.ts (format), existing broadcastDelivery.ts (deliver).

**Spec:** `backend/docs/superpowers/specs/2026-03-18-video-treatment-pipeline-design.md`

---

## Chunk 1: Database + Types + Stage Functions

### Task 1: Prisma Migration — Treatment + TreatmentClip Models

**Files:**
- Modify: `backend/prisma/schema.prisma` (add enum + 2 models + Tenant back-relation)

- [ ] **Step 1: Add treatment_status enum to schema.prisma**

After the existing `LedgerCategory` enum block (~line 996), add:

```prisma
enum treatment_status {
  queued
  downloading
  transcribing
  detecting
  scoring
  awaiting_approval
  extracting
  treating
  formatting
  awaiting_publish
  delivering
  completed
  failed
  cancelled

  @@map("treatment_status")
}
```

- [ ] **Step 2: Add Treatment model to schema.prisma**

After the new enum, add:

```prisma
model Treatment {
  id            String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId      String            @map("tenant_id") @db.Uuid
  tenant        Tenant            @relation(fields: [tenantId], references: [id])
  requestedBy   String?           @map("requested_by") @db.Uuid
  sourceUrl     String            @map("source_url")
  sourceTitle   String?           @map("source_title")
  duration      Int?
  status        treatment_status  @default(queued)
  stage         String            @default("download")
  costEstimate  Float?            @map("cost_estimate")
  costActual    Float?            @map("cost_actual")
  clipCount     Int?              @map("clip_count")
  error         String?
  metadata      Json?
  createdAt     DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)
  clips         TreatmentClip[]

  @@index([tenantId])
  @@index([status])
  @@map("treatments")
}
```

- [ ] **Step 3: Add TreatmentClip model to schema.prisma**

```prisma
model TreatmentClip {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  treatmentId  String    @map("treatment_id") @db.Uuid
  treatment    Treatment @relation(fields: [treatmentId], references: [id])
  startTime    Float     @map("start_time")
  endTime      Float     @map("end_time")
  score        Float?
  transcript   String?
  status       String    @default("pending")
  viduModel    String?   @map("vidu_model")
  viduCost     Float?    @map("vidu_cost")
  outputPath   String?   @map("output_path")
  error        String?
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([treatmentId])
  @@index([status])
  @@map("treatment_clips")
}
```

- [ ] **Step 4: Add back-relation to Tenant model**

In the `Tenant` model (around line 25-73 in schema.prisma), add after `calendarBookings`:

```prisma
  treatments                               Treatment[]
```

- [ ] **Step 5: Run migration**

```bash
cd backend && npx prisma migrate dev --name add_treatment_pipeline
```

Expected: Migration created and applied. Prisma Client regenerated.

- [ ] **Step 6: Verify build compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(treatment): add Treatment + TreatmentClip models and treatment_status enum"
```

---

### Task 2: Shared Types (`types.ts`)

**Files:**
- Create: `backend/src/services/treatment/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
/**
 * Shared types for the video treatment pipeline.
 */

/** Stage names matching the treatment_status enum */
export type TreatmentStage =
  | "download"
  | "transcribe"
  | "scene_detect"
  | "highlight_score"
  | "approval_gate_1"
  | "clip_extract"
  | "ai_treat"
  | "format"
  | "approval_gate_2"
  | "deliver";

/** Result returned by each stage function */
export type StageResult = {
  ok: boolean;
  /** Next stage to advance to (undefined if pipeline should pause/stop) */
  nextStage?: TreatmentStage;
  /** Error message on failure */
  error?: string;
};

/** Metadata extracted during download */
export type VideoMeta = {
  title: string;
  duration: number;
  channel: string;
  description: string;
};

/** A single word/segment from the transcript */
export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

/** Scene boundary from PySceneDetect or FFmpeg */
export type SceneBoundary = {
  startTime: number;
  endTime: number;
  sceneNumber: number;
};

/** Scored clip candidate from highlight scoring */
export type ScoredClip = {
  startTime: number;
  endTime: number;
  score: number;
  transcript: string;
  hookStrength: number;
  emotionalIntensity: number;
  informationDensity: number;
  standaloneCoherence: number;
  visualAction: number;
};

/** Treatment data directory path helper */
export function treatmentDir(treatmentId: string): string {
  return `data/treatments/${treatmentId}`;
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/treatment/types.ts
git commit -m "feat(treatment): add shared pipeline types"
```

---

### Task 3: Download Stage (`download.ts`)

**Files:**
- Create: `backend/src/services/treatment/download.ts`

- [ ] **Step 1: Create the download stage**

```typescript
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
    // Use os.freemem as rough proxy on Windows; on Linux use df
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
    // Already exists — extract metadata and move on
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
    // Download video
    await execFileAsync("yt-dlp", [
      "-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
      "--merge-output-format", "mp4",
      "-o", outputPath,
      "--no-playlist",
      "--no-overwrites",
      treatment.sourceUrl,
    ], { timeout: 10 * 60 * 1000 }); // 10-minute timeout

    // Extract metadata
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
```

- [ ] **Step 2: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/treatment/download.ts
git commit -m "feat(treatment): add download stage (yt-dlp)"
```

---

### Task 4: Transcribe Stage (`transcribe.ts`)

**Files:**
- Create: `backend/src/services/treatment/transcribe.ts`

- [ ] **Step 1: Create the transcribe stage**

```typescript
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
      // Single-file transcription
      segments = await transcribeFile(audioPath, apiKey);
    } else {
      // Chunk into segments
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
  // Get audio duration
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
      // Remove segments from current chunk that overlap with previous
      const filtered = chunkSegments.filter((s) => s.start >= overlapStart + CHUNK_OVERLAP_SEC / 2);
      allSegments.push(...filtered);
    } else {
      allSegments.push(...chunkSegments);
    }

    await fs.unlink(chunkPath).catch(() => {});
    offset += CHUNK_DURATION_SEC; // Advance by chunk duration (not including overlap)
    chunkIdx++;
  }

  return allSegments;
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/treatment/transcribe.ts
git commit -m "feat(treatment): add transcribe stage (Whisper API)"
```

---

### Task 5: Scene Detect Stage (`sceneDetect.ts`)

**Files:**
- Create: `backend/src/services/treatment/sceneDetect.ts`

- [ ] **Step 1: Create the scene detect stage**

```typescript
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
    // PySceneDetect CSV: Scene Number, Start Frame, Start Timecode, Start Time (seconds), End Frame, End Timecode, End Time (seconds), Length (seconds)
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
  // FFmpeg scene filter outputs timestamps of scene changes
  const { stderr } = await execFileAsync("ffmpeg", [
    "-i", sourcePath,
    "-vf", "select='gt(scene,0.3)',showinfo",
    "-f", "null",
    "-",
  ], { timeout: 10 * 60 * 1000 });

  // Parse timestamps from showinfo output
  const timestamps: number[] = [0]; // Always start at 0
  const regex = /pts_time:(\d+\.?\d*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(stderr)) !== null) {
    timestamps.push(parseFloat(match[1]));
  }

  // Add end timestamp
  if (totalDuration > 0) timestamps.push(totalDuration);

  // Convert timestamps to scene boundaries
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
```

- [ ] **Step 2: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/treatment/sceneDetect.ts
git commit -m "feat(treatment): add scene detect stage (PySceneDetect + FFmpeg fallback)"
```

---

### Task 6: Highlight Score Stage (`highlightScore.ts`)

**Files:**
- Create: `backend/src/services/treatment/highlightScore.ts`

- [ ] **Step 1: Create the highlight scoring stage**

```typescript
/**
 * Highlight Score stage — LLM-based scoring of scene segments for "viral short potential".
 *
 * Uses DeepSeek or Cerebras for cost efficiency (~$0.002 per call).
 * Scores each segment on 5 dimensions, outputs ranked clips ≤ 60 seconds.
 */

import fs from "fs/promises";
import path from "path";
import { prisma } from "../../db/prisma.js";
import { treatmentDir, type TranscriptSegment, type SceneBoundary, type ScoredClip, type StageResult } from "./types.js";

const MAX_CLIPS = 10;
const MAX_CLIP_DURATION = 60; // YouTube Shorts limit

export async function runHighlightScore(treatmentId: string): Promise<StageResult> {
  const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId } });
  if (!treatment) return { ok: false, error: "Treatment not found" };

  const dir = treatmentDir(treatmentId);
  const transcriptPath = path.join(dir, "transcript.json");
  const scenesPath = path.join(dir, "scenes.json");

  // Load transcript + scenes
  let transcript: TranscriptSegment[];
  let scenes: SceneBoundary[];
  try {
    transcript = JSON.parse(await fs.readFile(transcriptPath, "utf-8"));
    scenes = JSON.parse(await fs.readFile(scenesPath, "utf-8"));
  } catch (err: any) {
    return { ok: false, error: `Failed to read input files: ${err?.message ?? err}` };
  }

  // Build scene-transcript map
  const sceneTranscripts = scenes.map((scene) => {
    const segs = transcript.filter(
      (t) => t.start >= scene.startTime && t.end <= scene.endTime,
    );
    return {
      ...scene,
      text: segs.map((s) => s.text).join(" ").trim(),
    };
  });

  // Build prompt
  const prompt = buildScoringPrompt(sceneTranscripts, treatment.sourceTitle ?? "Unknown");

  // Call LLM
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.CEREBRAS_API_KEY;
  const baseUrl = process.env.DEEPSEEK_API_KEY
    ? "https://api.deepseek.com/v1"
    : "https://api.cerebras.ai/v1";
  const model = process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "llama-4-scout-17b-16e-instruct";

  if (!apiKey) return { ok: false, error: "No LLM API key available (DEEPSEEK or CEREBRAS)" };

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `LLM API ${res.status}: ${text}` };
    }

    const json = await res.json() as any;
    const content = json.choices?.[0]?.message?.content ?? "";
    const scored = parseScoredClips(content, scenes);

    // Enforce max clip duration — split long clips
    const enforced: ScoredClip[] = [];
    for (const clip of scored) {
      const duration = clip.endTime - clip.startTime;
      if (duration <= MAX_CLIP_DURATION) {
        enforced.push(clip);
      } else {
        // Split into MAX_CLIP_DURATION chunks
        let start = clip.startTime;
        while (start < clip.endTime && enforced.length < MAX_CLIPS) {
          const end = Math.min(start + MAX_CLIP_DURATION, clip.endTime);
          enforced.push({ ...clip, startTime: start, endTime: end });
          start = end;
        }
      }
    }

    // Take top MAX_CLIPS
    const topClips = enforced
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CLIPS);

    // Create TreatmentClip records
    for (const clip of topClips) {
      await prisma.treatmentClip.create({
        data: {
          treatmentId,
          startTime: clip.startTime,
          endTime: clip.endTime,
          score: clip.score,
          transcript: clip.transcript.slice(0, 1000),
          status: "pending",
        },
      });
    }

    // Calculate cost estimate for Vidu
    const viduCostPerClip = 0.055;
    const costEstimate = (treatment.costActual ?? 0) + topClips.length * viduCostPerClip;

    await prisma.treatment.update({
      where: { id: treatmentId },
      data: {
        clipCount: topClips.length,
        costEstimate,
      },
    });

    return { ok: true, nextStage: "approval_gate_1" };
  } catch (err: any) {
    return { ok: false, error: `Highlight scoring failed: ${err?.message ?? err}` };
  }
}

function buildScoringPrompt(
  scenes: Array<SceneBoundary & { text: string }>,
  title: string,
): string {
  const sceneList = scenes
    .map(
      (s) =>
        `Scene ${s.sceneNumber} [${s.startTime.toFixed(1)}s - ${s.endTime.toFixed(1)}s]:\n${s.text || "(no speech)"}`,
    )
    .join("\n\n");

  return `You are a viral video editor. Analyze these scenes from "${title}" and score each for YouTube Shorts potential.

For each scene, rate 1-10 on:
- hookStrength: How compelling are the first 3 seconds?
- emotionalIntensity: How much emotion does it convey?
- informationDensity: How much value is packed in?
- standaloneCoherence: Does it make sense without context?
- visualAction: How dynamic is the visual content?

Return JSON array (no markdown, just raw JSON):
[{"sceneNumber": 1, "score": 8.5, "hookStrength": 9, "emotionalIntensity": 7, "informationDensity": 8, "standaloneCoherence": 9, "visualAction": 8}]

Only include scenes scoring >= 6 overall. Max ${MAX_CLIPS} scenes.

SCENES:
${sceneList}`;
}

function parseScoredClips(
  llmOutput: string,
  scenes: SceneBoundary[],
): ScoredClip[] {
  try {
    // Extract JSON array from LLM output
    const jsonMatch = llmOutput.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      sceneNumber: number;
      score: number;
      hookStrength: number;
      emotionalIntensity: number;
      informationDensity: number;
      standaloneCoherence: number;
      visualAction: number;
    }>;

    return parsed
      .map((p) => {
        const scene = scenes.find((s) => s.sceneNumber === p.sceneNumber);
        if (!scene) return null;
        return {
          startTime: scene.startTime,
          endTime: scene.endTime,
          score: p.score,
          transcript: "", // Will be filled from scene text
          hookStrength: p.hookStrength,
          emotionalIntensity: p.emotionalIntensity,
          informationDensity: p.informationDensity,
          standaloneCoherence: p.standaloneCoherence,
          visualAction: p.visualAction,
        } as ScoredClip;
      })
      .filter((c): c is ScoredClip => c !== null);
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/treatment/highlightScore.ts
git commit -m "feat(treatment): add highlight scoring stage (LLM)"
```

---

### Task 7: Clip Extract Stage (`clipExtract.ts`)

**Files:**
- Create: `backend/src/services/treatment/clipExtract.ts`

- [ ] **Step 1: Create the clip extract stage**

```typescript
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

  // Check if any clips were extracted successfully
  const successClips = await prisma.treatmentClip.count({
    where: { treatmentId, status: "approved", outputPath: { not: null } },
  });
  if (successClips === 0) return { ok: false, error: "No clips were extracted successfully" };

  // Cleanup source video (no longer needed)
  await fs.unlink(sourcePath).catch(() => {});

  return { ok: true, nextStage: "ai_treat" };
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/treatment/clipExtract.ts
git commit -m "feat(treatment): add clip extract stage (FFmpeg)"
```

---

## Chunk 2: AI Treatment + Format + Orchestrator + Worker + Routes + Wiring

### Task 8: AI Treat Stage (`aiTreat.ts`)

**Files:**
- Create: `backend/src/services/treatment/aiTreat.ts`

- [ ] **Step 1: Create the AI treatment stage**

```typescript
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

    let success = false;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await sleep(RATE_LIMIT_MS);

        // Upload clip and create treatment task
        const clipBuffer = await fs.readFile(clip.outputPath);
        const taskId = await createViduTask(apiKey, clipBuffer, path.basename(clip.outputPath));

        // Poll for completion
        const resultUrl = await pollViduTask(apiKey, taskId);
        if (!resultUrl) {
          throw new Error("Vidu task timed out or failed");
        }

        // Download result
        const resultRes = await fetch(resultUrl);
        if (!resultRes.ok) throw new Error(`Failed to download treated clip: ${resultRes.status}`);
        const resultBuffer = Buffer.from(await resultRes.arrayBuffer());
        await fs.writeFile(treatedPath, resultBuffer);

        // Update clip record
        await prisma.treatmentClip.update({
          where: { id: clip.id },
          data: {
            outputPath: treatedPath,
            viduModel: "Q2-pro-fast",
            viduCost: VIDU_COST_PER_CLIP,
          },
        });

        // Record spend in ledger
        await prisma.ledgerEntry.create({
          data: {
            tenantId: treatment.tenantId,
            entryType: "debit",
            category: "api_spend",
            amountCents: BigInt(Math.round(VIDU_COST_PER_CLIP * 100)),
            currency: "USD",
            description: `Vidu Q2-pro-fast treatment clip`,
            externalRef: treatmentId,
            reference_type: "treatment_clip",
            reference_id: clip.id,
          },
        });

        totalCost += VIDU_COST_PER_CLIP;
        successCount++;
        success = true;
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

  // Update treatment cost
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
  const blob = new Blob([videoBuffer], { type: "video/mp4" });
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
    // Still processing — continue polling
  }

  return null; // Timed out
}
```

- [ ] **Step 2: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/treatment/aiTreat.ts
git commit -m "feat(treatment): add AI treat stage (Vidu Q2-pro-fast)"
```

---

### Task 9: Format Stage (`format.ts`)

**Files:**
- Create: `backend/src/services/treatment/format.ts`

- [ ] **Step 1: Create the format stage**

```typescript
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
      // Resize to 9:16 (1080x1920)
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
            // Non-fatal — continue without overlay
          }
        }
      }

      // Generate thumbnail
      await generateThumbnail(shortPath, 1, thumbPath);

      // Update clip with final path
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
```

- [ ] **Step 2: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/treatment/format.ts
git commit -m "feat(treatment): add format stage (videoComposer 9:16)"
```

---

### Task 10: Orchestrator (`orchestrator.ts`)

**Files:**
- Create: `backend/src/services/treatment/orchestrator.ts`

- [ ] **Step 1: Create the orchestrator**

The orchestrator coordinates stage execution, approval gate creation, and resume-after-crash logic.

```typescript
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
import { treatmentDir, type StageResult } from "./types.js";
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

  // Check if already waiting for approval
  if (treatment.status === "awaiting_approval") {
    // Check if a DecisionMemo was approved
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

    if (memo.status === "APPROVED" || memo.status === "PROPOSED") {
      // PROPOSED = auto-approved (cost below AUTO_SPEND_LIMIT_USD)
      // Approve all clips (or selected ones from payload)
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
        // Approve all
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
      return { ok: true }; // Terminal
    }

    // Still pending (AWAITING_HUMAN) — keep waiting
    return { ok: true };
  }

  // First time hitting this gate — mark as awaiting
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

  // Deliver each short via broadcast system
  for (const clip of treatment.clips) {
    if (!clip.outputPath) continue;
    try {
      // BroadcastContext: { tenantId, content, channels, imageUrl?, videoUrl? }
      // Channels must be provided — load from tenant integrations
      const integrations = await prisma.integration.findMany({
        where: { tenantId: treatment.tenantId, connected: true },
      });
      const channels: Array<{ id: string; name: string; platform: string }> = integrations.map((i) => ({
        id: i.id,
        name: i.provider,
        platform: i.provider,
      }));

      if (channels.length === 0) {
        process.stderr.write(`[treatment] no connected channels for delivery\n`);
        continue;
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
```

- [ ] **Step 2: Verify build**

```bash
cd backend && npx tsc --noEmit
```

Expected: May fail on `deliverBroadcast` call signature — check the actual `BroadcastContext` type and adjust. The `deliverBroadcast` function expects a `BroadcastContext` object. Verify the exact fields by reading `broadcastDelivery.ts`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/treatment/orchestrator.ts
git commit -m "feat(treatment): add orchestrator with approval gates and delivery"
```

---

### Task 11: Treatment Worker (`treatmentWorker.ts`)

**Files:**
- Create: `backend/src/workers/treatmentWorker.ts`

- [ ] **Step 1: Create the treatment worker**

Follows the same PM2-managed pattern as `engineLoop.ts`.

```typescript
/**
 * Background worker: Treatment Pipeline
 *
 * Polls the treatments table every TREATMENT_POLL_MS (default 5000)
 * for treatments in active states and advances them through the pipeline.
 *
 * PM2-managed alongside the engine loop.
 */

import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { processTreatmentTick } from "../services/treatment/orchestrator.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const ACTIVE_STATUSES = [
  "queued",
  "downloading",
  "transcribing",
  "detecting",
  "scoring",
  "awaiting_approval",
  "extracting",
  "treating",
  "formatting",
  "awaiting_publish",
  "delivering",
];

async function main() {
  const pollMs = Math.max(1000, Number(process.env.TREATMENT_POLL_MS ?? 5000));

  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  process.stdout.write(`[treatmentWorker] started (poll every ${pollMs}ms)\n`);

  while (true) {
    if (stopping) {
      process.stdout.write("[treatmentWorker] stopping\n");
      process.exit(0);
    }

    try {
      // Find active treatments (not in terminal states)
      const treatments = await prisma.treatment.findMany({
        where: { status: { in: ACTIVE_STATUSES as any } },
        orderBy: { createdAt: "asc" },
        take: 3, // Max 3 concurrent globally
      });

      for (const t of treatments) {
        try {
          await processTreatmentTick(t.id);
        } catch (err: any) {
          process.stderr.write(`[treatmentWorker] tick error for ${t.id}: ${err?.message ?? err}\n`);
          // Mark as failed to prevent infinite retry
          await prisma.treatment.update({
            where: { id: t.id },
            data: { status: "failed" as any, error: err?.message ?? String(err) },
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      process.stderr.write(`[treatmentWorker] poll error: ${err?.message ?? err}\n`);
    }

    await sleep(pollMs);
  }
}

main().catch((e) => {
  process.stderr.write(`[treatmentWorker] fatal: ${e?.message ?? e}\n`);
  process.exit(1);
});
```

- [ ] **Step 2: Add worker script to backend/package.json**

Add to `scripts`:
```json
"worker:treatment": "tsx src/workers/treatmentWorker.ts"
```

- [ ] **Step 3: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/workers/treatmentWorker.ts backend/package.json
git commit -m "feat(treatment): add treatment worker process"
```

---

### Task 12: Treatment Routes (`treatmentRoutes.ts`)

**Files:**
- Create: `backend/src/routes/treatmentRoutes.ts`

- [ ] **Step 1: Create the REST routes**

```typescript
/**
 * Treatment Routes — REST API for the video treatment pipeline.
 *
 * POST /v1/treatments        — Create a new treatment
 * GET  /v1/treatments        — List treatments for tenant
 * GET  /v1/treatments/:id    — Get treatment status + clips
 * POST /v1/treatments/:id/approve — Approve Gate 1 or Gate 2
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { createTreatment, canStartTreatment } from "../services/treatment/orchestrator.js";

const YOUTUBE_URL_RE = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//;

const CreateTreatmentSchema = z.object({
  sourceUrl: z.string().url().refine((url) => YOUTUBE_URL_RE.test(url), {
    message: "Only YouTube URLs are supported",
  }),
});

export const treatmentRoutes: FastifyPluginAsync = async (app) => {
  // POST /treatments — Create new treatment
  app.post("/treatments", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string | undefined;

    const parsed = CreateTreatmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    // Check concurrency
    const check = await canStartTreatment(tenantId);
    if (!check.ok) {
      return reply.status(429).send({ error: check.reason });
    }

    const id = await createTreatment(tenantId, parsed.data.sourceUrl, userId);
    return reply.status(201).send({ id, status: "queued" });
  });

  // GET /treatments — List treatments for tenant
  app.get("/treatments", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const treatments = await prisma.treatment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        sourceUrl: true,
        sourceTitle: true,
        status: true,
        stage: true,
        clipCount: true,
        costEstimate: true,
        costActual: true,
        error: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return reply.send({ treatments });
  });

  // GET /treatments/:id — Get treatment details + clips
  app.get("/treatments/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const { id } = req.params as { id: string };

    const treatment = await prisma.treatment.findFirst({
      where: { id, tenantId },
      include: {
        clips: {
          orderBy: { score: "desc" },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            score: true,
            transcript: true,
            status: true,
            viduModel: true,
            viduCost: true,
            outputPath: true,
            error: true,
            createdAt: true,
          },
        },
      },
    });

    if (!treatment) return reply.status(404).send({ error: "Treatment not found" });
    return reply.send({ treatment });
  });

  // POST /treatments/:id/approve — Approve or reject at gate
  app.post("/treatments/:id/approve", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const { id } = req.params as { id: string };
    const body = req.body as { action: "approve" | "reject"; clipIds?: string[] };

    const treatment = await prisma.treatment.findFirst({
      where: { id, tenantId, status: { in: ["awaiting_approval", "awaiting_publish"] } },
    });

    if (!treatment) {
      return reply.status(404).send({ error: "Treatment not found or not awaiting approval" });
    }

    // Find the corresponding DecisionMemo
    const titlePrefix = treatment.status === "awaiting_approval"
      ? "[TREATMENT_APPROVAL]"
      : "[TREATMENT_PUBLISH]";

    const memo = await prisma.decisionMemo.findFirst({
      where: {
        tenantId,
        title: { startsWith: titlePrefix },
        payload: { path: ["treatmentId"], equals: id },
        status: { in: ["PROPOSED", "AWAITING_HUMAN"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!memo) {
      return reply.status(404).send({ error: "No pending approval memo found" });
    }

    if (body.action === "approve") {
      const payload = body.clipIds
        ? { ...(memo.payload as any), approvedClipIds: body.clipIds }
        : memo.payload;

      await prisma.decisionMemo.update({
        where: { id: memo.id },
        data: { status: "APPROVED", payload },
      });
    } else {
      await prisma.decisionMemo.update({
        where: { id: memo.id },
        data: { status: "REJECTED" },
      });
    }

    return reply.send({ ok: true, action: body.action });
  });
};
```

- [ ] **Step 2: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/treatmentRoutes.ts
git commit -m "feat(treatment): add REST routes (CRUD + approve)"
```

---

### Task 13: Treatment Agent Tool (`treatmentTool.ts`)

**Files:**
- Create: `backend/src/core/agent/tools/treatmentTool.ts`
- Modify: `backend/src/core/agent/tools/toolRegistry.ts`

- [ ] **Step 1: Create the treatment tool**

```typescript
/**
 * Treatment Tool — Agent tool for triggering the video treatment pipeline.
 *
 * Registered in toolRegistry.ts. Triggered by natural language patterns
 * like "treat this YouTube video" or "convert video to shorts".
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";
import { createTreatment, canStartTreatment } from "../../../services/treatment/orchestrator.js";

const YOUTUBE_URL_RE = /https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/;

export const treatmentTool: ToolDefinition = {
  key: "treatment",
  name: "Video Treatment Pipeline",
  patterns: [
    /\btreat(?:ment)?\s+(?:this|a|the)?\s*(?:youtube|video|yt)/i,
    /\b(?:youtube|yt)\s+(?:to|into)\s+shorts/i,
    /\bconvert\s+(?:this|a|the)?\s*video\s+(?:to|into)\s+shorts/i,
    /\bextract\s+(?:highlights|clips)\s+from/i,
    /\brepurpose\s+(?:this|a|the)?\s*video/i,
  ],
  async execute(ctx) {
    try {
      // Extract YouTube URL from query
      const urlMatch = ctx.query.match(YOUTUBE_URL_RE);
      if (!urlMatch) {
        return makeResult("treatment", "No YouTube URL found in the request. Please provide a YouTube video URL.");
      }

      const url = urlMatch[0];

      // Check concurrency
      const check = await canStartTreatment(ctx.tenantId);
      if (!check.ok) {
        return makeResult("treatment", `Cannot start treatment: ${check.reason}`);
      }

      const id = await createTreatment(ctx.tenantId, url);
      return makeResult(
        "treatment",
        `Treatment pipeline started (ID: ${id}). The video will be downloaded, transcribed, scored for highlights, and you'll be asked to approve before AI treatment begins. Track progress via GET /v1/treatments/${id}.`,
      );
    } catch (err) {
      return makeError("treatment", err);
    }
  },
};
```

- [ ] **Step 2: Register in toolRegistry.ts**

Add import:
```typescript
import { treatmentTool }       from "./treatmentTool.js";
```

Add to `ALL_TOOLS` array:
```typescript
  treatmentTool,
```

- [ ] **Step 3: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/core/agent/tools/treatmentTool.ts backend/src/core/agent/tools/toolRegistry.ts
git commit -m "feat(treatment): add agent tool + register in toolRegistry"
```

---

### Task 14: Wire Routes into Server

**Files:**
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Add import in server.ts**

Add with the other route imports:
```typescript
import { treatmentRoutes } from "./routes/treatmentRoutes.js";
```

- [ ] **Step 2: Register routes**

Add with the other `app.register` calls:
```typescript
  await app.register(treatmentRoutes, { prefix: "/v1" });
```

- [ ] **Step 3: Verify build**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/server.ts
git commit -m "feat(treatment): wire treatment routes into server"
```

---

### Task 15: Build Verification + Data Directory

- [ ] **Step 1: Create data/treatments directory**

```bash
cd backend && mkdir -p data/treatments
```

- [ ] **Step 2: Add .gitkeep**

```bash
touch backend/data/treatments/.gitkeep
```

- [ ] **Step 3: Full build verification**

```bash
cd backend && npm run build
```

Expected: Clean build with no errors.

- [ ] **Step 4: Verify worker starts**

```bash
cd backend && timeout 5 npx tsx src/workers/treatmentWorker.ts 2>&1 || true
```

Expected: `[treatmentWorker] started (poll every 5000ms)` then timeout.

- [ ] **Step 5: Commit**

```bash
git add backend/data/treatments/.gitkeep
git commit -m "feat(treatment): add data directory + final build verification"
```

---

## Integration Notes

### broadcastDelivery.ts Call Signature

The `deliverBroadcast` function in `core/agent/tools/broadcastDelivery.ts` accepts a `BroadcastContext` type. The implementer MUST read the full type definition from that file and match the call in `orchestrator.ts` to the actual signature. Key fields likely include `tenantId`, `agentId`, `channels`, `content`, and optional media fields. Adjust the deliver handler accordingly.

### Vidu API

The Vidu API endpoints in `aiTreat.ts` are based on the spec's documented patterns. The implementer should check the Vidu API docs at `backend/src/kb/video-gen/` for the actual endpoint paths, authentication method, and response format. Reference `backend/src/kb/video-gen/vidu-api-reference.md` if it exists.

### Environment Variables

New env vars needed:
- `DAILY_VIDU_SPEND_CAP` — Daily spend cap for Vidu (default: $10)
- `TREATMENT_POLL_MS` — Treatment worker poll interval (default: 5000)
- `VIDU_API_KEY` — Vidu API key (via credentialResolver)

### .gitignore

Add to `backend/.gitignore`:
```
data/treatments/*
!data/treatments/.gitkeep
```

### Vidu Polling Warning

The `runAiTreat` function contains a blocking polling loop (up to 10 min per clip). With 6 clips, this could block the treatment worker for an hour. For v1 this is acceptable since treatments are infrequent, but a future improvement should save Vidu task IDs to the DB and poll on subsequent worker ticks instead of blocking.

### Dependencies Check

Before running, verify these are installed on the host:
- `yt-dlp` — `which yt-dlp`
- `ffmpeg` — `which ffmpeg`
- `scenedetect` — `which scenedetect` (optional, FFmpeg fallback available)
