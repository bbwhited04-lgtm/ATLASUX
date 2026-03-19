# Video Treatment Pipeline — Design Spec

**Date:** 2026-03-18
**Status:** Approved
**Author:** Claude Code + Billy
**Reviewed:** Spec review pass 1 — 5 critical + 14 important/suggestion items resolved

## Purpose

Take YouTube videos and produce platform-ready Shorts through an automated pipeline: download, transcribe, detect scenes, score highlights, extract clips, apply AI treatment (Vidu), format for 9:16, and deliver via existing broadcast system. Every dollar of cloud API spend goes through an approval gate so burn rates are visible and controlled.

## Pipeline Stages

```
YouTube URL
  → DOWNLOAD (yt-dlp, free)
  → TRANSCRIBE (Whisper API, ~$0.006/min)
  → SCENE_DETECT (PySceneDetect, free)
  → HIGHLIGHT_SCORE (LLM, ~$0.002)
  → [APPROVAL GATE 1: review highlights + cost estimate before Vidu spend]
  → CLIP_EXTRACT (FFmpeg, free)
  → AI_TREAT (Vidu Q2-pro-fast, $0.055/clip)
  → FORMAT (existing videoComposer.ts, free)
  → [APPROVAL GATE 2: preview finished Shorts before publish]
  → DELIVER (existing broadcastDelivery.ts, free)
```

## Approval Gates

### Gate 1 — Pre-Treatment (after highlight scoring)

Pipeline pauses and creates a `DecisionMemo` record containing:

- Source video title, URL, duration
- Number of clips detected
- Top-ranked highlights with timestamps + transcript snippets
- Per-clip Vidu cost estimate ($0.055 each at Q2-pro-fast off-peak)
- Total estimated treatment cost (includes already-spent Whisper cost)
- Comparison: "6 clips × $0.055 = $0.33 Vidu + $0.06 Whisper = $0.39 total"

Implementation:
- `DecisionMemo.title`: `"[TREATMENT_APPROVAL] {sourceTitle}"`
- `DecisionMemo.agent`: `"victor"` (video agent)
- `DecisionMemo.estimatedCostUsd`: total pipeline cost estimate
- `DecisionMemo.riskTier`: 1 (or 2 if cost > AUTO_SPEND_LIMIT_USD)
- `DecisionMemo.payload`: JSON with full clip list, scores, timestamps, transcripts
- `DecisionMemo.requiresApproval`: true if cost >= AUTO_SPEND_LIMIT_USD
- `DecisionMemo.status`: `"PROPOSED"` → awaits approval

Rules:
- If total cost < `AUTO_SPEND_LIMIT_USD`, auto-approve (status → `"APPROVED"`)
- If total cost >= `AUTO_SPEND_LIMIT_USD`, require human approval
- Human can approve all, select specific clips, or reject
- On approval: selected clips proceed, rejected clips marked `rejected` on TreatmentClip
- On rejection: entire treatment marked `cancelled`

### Gate 2 — Pre-Publish (after formatting)

Pipeline pauses with:
- `DecisionMemo.title`: `"[TREATMENT_PUBLISH] {sourceTitle}"`
- Thumbnail preview paths for each finished Short
- Metadata (title, description, hashtags)
- Target channels for broadcast
- Total cost incurred so far (Whisper + Vidu actual)

Human approves which Shorts publish and to which channels. Reuses existing broadcast approval flow.

## File Structure

```
backend/src/services/treatment/
  ├── types.ts           — Shared pipeline types (TreatmentJob, ClipMeta, StageResult)
  ├── download.ts        — yt-dlp subprocess wrapper
  ├── transcribe.ts      — Whisper API (timestamped transcript)
  ├── sceneDetect.ts     — PySceneDetect subprocess (scene boundaries)
  ├── highlightScore.ts  — LLM highlight scoring (transcript + scenes → ranked clips)
  ├── clipExtract.ts     — FFmpeg clip extraction (timestamps → individual files)
  ├── aiTreat.ts         — Vidu Q2-pro-fast API integration
  ├── format.ts          — Delegates to existing videoComposer.ts
  └── orchestrator.ts    — Job queue coordinator + approval gate creation

backend/src/workers/treatmentWorker.ts  — NEW worker process for treatment job polling
```

Plus:
- `backend/src/core/agent/tools/treatmentTool.ts` — Agent tool for triggering treatments
- `backend/src/routes/treatmentRoutes.ts` — REST API for programmatic triggering (`POST /v1/treatments`)
- Prisma migration for `treatments` and `treatment_clips` tables + `treatment_status` enum

## Orchestration Architecture

**Critical note:** The existing `engineLoop.ts` processes `Intent` queue via `engineTick()`, NOT the `Job` queue. The treatment pipeline needs its own worker.

### Treatment Worker (`workers/treatmentWorker.ts`)

A new worker process (PM2-managed, like `engineLoop.ts`) that:

1. Polls `treatments` table every 5 seconds for rows with `status` in active states
2. For each active treatment, checks current `stage` and runs the next stage function
3. On stage completion, advances `stage` and `status` to the next step
4. At approval gates: creates `DecisionMemo`, sets status to `awaiting_approval`, stops processing
5. When a `DecisionMemo` is approved (via existing approval UI), updates treatment status and resumes on next poll

```
PM2 ecosystem:
  - api (server.ts)          — existing
  - engine (engineLoop.ts)   — existing, processes Intents
  - treatment (treatmentWorker.ts) — NEW, processes Treatments
```

### Resume-After-Crash

On startup, the treatment worker finds all treatments with `status` NOT IN (`completed`, `failed`, `cancelled`) and resumes from their current `stage`. Each stage is idempotent — re-running a completed stage checks for existing output files and skips if present.

## Stage Details

### 1. Download (`download.ts`)

- Input: YouTube URL
- Tool: `yt-dlp` subprocess via `execFile` (NOT `exec` — prevents command injection)
- URL validation: Must match `^https?://(www\.)?(youtube\.com|youtu\.be)/` — reject all other URLs
- Output: `.mp4` file + metadata JSON (title, duration, channel, description)
- Storage: `data/treatments/{treatmentId}/source.mp4`
- Error handling: Invalid URL, age-restricted, private video, download failure
- No cost

### 2. Transcribe (`transcribe.ts`)

- Input: Source `.mp4` audio track
- Tool: OpenAI Whisper API (`whisper-1`)
- **Audio extraction**: First extract audio via FFmpeg to `.mp3` (compressed)
- **25MB limit handling**: If audio > 25MB, chunk into 10-minute segments with 30s overlap, transcribe each, merge timestamps
- Output: Timestamped transcript (word-level timestamps via `timestamp_granularities`)
- Storage: `data/treatments/{treatmentId}/transcript.json`
- Cost: ~$0.006/minute of audio
- Uses existing `OPENAI_API_KEY` from env

### 3. Scene Detect (`sceneDetect.ts`)

- Input: Source `.mp4`
- Tool: PySceneDetect via `execFile` subprocess (`scenedetect detect-adaptive`)
- Output: List of scene boundaries with timestamps
- Storage: `data/treatments/{treatmentId}/scenes.json`
- No cost (local processing)
- Fallback: If PySceneDetect not installed, use FFmpeg scene filter (`select='gt(scene,0.3)'`)

### 4. Highlight Score (`highlightScore.ts`)

- Input: Timestamped transcript + scene boundaries
- Tool: LLM call (DeepSeek or Cerebras for cost efficiency)
- Prompt: Score each scene segment for "viral short potential" on 1-10 scale based on:
  - Hook strength (first 3 seconds)
  - Emotional intensity
  - Information density
  - Standalone coherence (makes sense without context)
  - Visual action (based on scene change frequency)
- Output: Ranked list of clips with scores, timestamps, and transcript snippets
- **Clip duration enforcement**: Each clip must be ≤ 60 seconds (YouTube Shorts limit). Segments longer than 60s are split or trimmed.
- Cost: ~$0.002 per scoring call
- Max clips: 10 per source video (configurable, prevents runaway)

### 5. Approval Gate 1

- Creates `DecisionMemo` record (see Approval Gates section above)
- Treatment status → `awaiting_approval`
- Treatment worker stops processing this treatment until memo approved
- On approval: selected clips get status `approved`, rejected clips get `rejected`
- On rejection: treatment status → `cancelled`

### 6. Clip Extract (`clipExtract.ts`)

- Input: Approved clip list + source `.mp4`
- Tool: FFmpeg via `execFile` subprocess
- Output: Individual clip files (`clip-001.mp4`, `clip-002.mp4`, etc.)
- Storage: `data/treatments/{treatmentId}/clips/`
- No cost

### 7. AI Treat (`aiTreat.ts`)

- Input: Individual clip files
- Tool: Vidu API
- Model: Q2-pro-fast (default), configurable per-clip
- Auth: `VIDU_API_KEY` via `resolveCredential(tenantId, "vidu")`
- **Async handling**: Vidu returns a task ID → poll for completion (most video AI APIs are async)
- Output: Treated clip files
- Storage: `data/treatments/{treatmentId}/treated/`
- Cost: $0.055/clip at Q2-pro-fast 720P off-peak
- Retry budget: Max 2 retries per clip, then mark clip as `failed` (no infinite loops)
- Rate limiting: 200ms between API calls (per-tenant)
- Daily spend tracking via `LedgerEntry` (category: `api_spend`, `amountCents` as BigInt)

### 8. Format (`format.ts`)

- Input: Treated clips
- Tool: Existing `videoComposer.ts` functions (located at `services/videoComposer.ts`):
  - `resizeForShorts()` — 9:16 at 1080x1920
  - `addTextOverlay()` — Hook text + captions
  - `addAudioTrack()` — Background music if configured
  - `generateThumbnail()` — Auto-generated thumbnail
- Output: Platform-ready Short files
- Storage: `data/treatments/{treatmentId}/shorts/`
- No cost (local FFmpeg)

### 9. Approval Gate 2

- Creates `DecisionMemo` (see Approval Gates section above)
- Treatment status → `awaiting_publish`
- On approval: proceeds to deliver
- On rejection: Shorts saved but not published, treatment → `completed` (cost already spent)

### 10. Deliver

- Uses existing `deliverBroadcast()` from `core/agent/tools/broadcastDelivery.ts`
- Note: This function lives in `core/agent/tools/`, not `services/`. Import path: `../../core/agent/tools/broadcastDelivery.js`
- Each Short delivered to approved channels
- Results logged to audit trail
- Media gate already enforced (all Shorts have video)

## Database Schema

### `treatment_status` enum

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
}
```

### `treatments` table

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

### `treatment_clips` table

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

Note: `Tenant` model needs back-relation `treatments Treatment[]` added.

## Job Queue Integration

The treatment pipeline does NOT use the `jobs` table for stage orchestration. Instead, the `treatments` table itself tracks pipeline state via `status` and `stage` fields. The dedicated `treatmentWorker.ts` polls this table directly.

The `jobs` table is only used for fire-and-forget tasks that don't need multi-stage tracking (like `LOCAL_VISION_TASK`). Treatments need checkpoint/resume semantics that the stage-based `treatments` table provides natively.

## Spend Tracking

Vidu API costs are recorded in the existing `LedgerEntry` model (`ledger_entries` table):

```typescript
await prisma.ledgerEntry.create({
  data: {
    tenantId,
    entryType: "DEBIT",     // LedgerEntryType enum
    category: "api_spend",  // LedgerCategory enum
    amountCents: BigInt(Math.round(viduCost * 100)),
    currency: "USD",
    description: `Vidu Q2-pro-fast treatment clip`,
    externalRef: treatmentId,
    reference_type: "treatment_clip",
    reference_id: clipId,
  },
});
```

Daily spend cap check queries `ledger_entries` for today's `api_spend` debits for the tenant.

## File Storage & Cleanup

Storage path: `data/treatments/{treatmentId}/` (relative to backend working directory)

```
data/treatments/{treatmentId}/
  ├── source.mp4          — Downloaded video (deleted after clips extracted)
  ├── audio.mp3           — Extracted audio (deleted after transcription)
  ├── transcript.json     — Kept for reference
  ├── scenes.json         — Kept for reference
  ├── clips/              — Raw clips (deleted after AI treatment)
  │   ├── clip-001.mp4
  │   └── clip-002.mp4
  ├── treated/            — AI-treated clips (deleted after formatting)
  │   ├── clip-001-treated.mp4
  │   └── clip-002-treated.mp4
  └── shorts/             — Final output (kept until explicitly deleted)
      ├── short-001.mp4
      └── short-002.mp4
```

Cleanup strategy:
- **On stage completion**: Delete intermediate files from previous stage (source.mp4 after clip extraction, raw clips after AI treatment, etc.)
- **On failure/cancellation**: Cleanup job runs after 24 hours, deletes entire treatment directory
- **Disk space check**: Before download, verify at least 2GB free space. Reject if insufficient.

## Concurrency Control

- Max 1 concurrent treatment per tenant (prevents resource exhaustion)
- Max 3 concurrent treatments globally (single Lightsail instance)
- Vidu rate limiting: 200ms between API calls, per-tenant

## Safety Rails

| Rail | Implementation |
|------|---------------|
| **Daily Vidu spend cap** | Track in `ledger_entries` (category: `api_spend`), block if exceeded |
| **Per-treatment cost estimate** | Calculated at Gate 1, shown in DecisionMemo (includes Whisper cost) |
| **Clip count limit** | Max 10 clips per source (configurable) |
| **Clip duration limit** | Max 60 seconds per clip (YouTube Shorts constraint) |
| **Retry budget** | Max 2 retries per Vidu clip |
| **Audit trail** | Every stage transition → `audit_log` |
| **Rate limiting** | 200ms between Vidu API calls, per-tenant |
| **Daily treatment cap** | Max treatments per day (configurable) |
| **Concurrency cap** | 1 per tenant, 3 global |
| **Disk space check** | 2GB minimum before download |
| **URL validation** | YouTube URLs only, via regex + `execFile` (no shell injection) |

## Agent Tool

`treatmentTool.ts` registered in `toolRegistry.ts`:

```typescript
patterns: [
  /\btreat(?:ment)?\s+(?:this|a|the)?\s*(?:youtube|video|yt)/i,
  /\b(?:youtube|yt)\s+(?:to|into)\s+shorts/i,
  /\bconvert\s+(?:this|a|the)?\s*video\s+(?:to|into)\s+shorts/i,
  /\bextract\s+(?:highlights|clips)\s+from/i,
  /\brepurpose\s+(?:this|a|the)?\s*video/i,
]
```

Plus a REST endpoint for programmatic access:
- `POST /v1/treatments` — Create new treatment (requires auth + tenant)
- `GET /v1/treatments/:id` — Get treatment status + clips
- `POST /v1/treatments/:id/approve` — Approve Gate 1 or Gate 2

## Cost Model

| Component | Cost | Notes |
|-----------|------|-------|
| yt-dlp | Free | Local subprocess |
| Whisper | $0.006/min | 10-min video = $0.06 |
| PySceneDetect | Free | Local subprocess |
| LLM scoring | ~$0.002 | DeepSeek/Cerebras |
| FFmpeg extract | Free | Local subprocess |
| Vidu Q2-pro-fast | $0.055/clip | Off-peak 720P |
| videoComposer | Free | Local FFmpeg |
| Broadcast | Free | Existing delivery |
| **10-min video, 6 clips** | **~$0.39** | Whisper $0.06 + Vidu $0.33 |
| **60-min video, 10 clips** | **~$0.91** | Whisper $0.36 + Vidu $0.55 |
| **Hero video, 28 clips** | **~$1.90** | Approval gate catches before spend |

## Dependencies (must be installed on host)

- `yt-dlp` — YouTube download (`pip install yt-dlp`)
- `ffmpeg` — Video processing (already used by videoComposer.ts)
- `scenedetect` — Scene detection (`pip install scenedetect[opencv]`), optional (FFmpeg fallback)

## What We Reuse

- `services/videoComposer.ts` → format stage (9:16 resize, captions, hooks, audio)
- `core/agent/tools/broadcastDelivery.ts` → deliver stage (3-tier fallback via `deliverBroadcast()`)
- `DecisionMemo` model → approval gates (title prefix convention: `[TREATMENT_APPROVAL]`, `[TREATMENT_PUBLISH]`)
- `LedgerEntry` model → spend tracking (category: `api_spend`, amounts in cents)
- `audit_log` → audit trail via `auditPlugin`
- `resolveCredential()` → Vidu API key resolution
- `OPENAI_API_KEY` → Whisper transcription
