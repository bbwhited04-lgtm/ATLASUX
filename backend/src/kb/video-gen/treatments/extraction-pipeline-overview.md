# YouTube-to-Shorts Extraction Pipeline: Full Architecture

**Sources:**
- https://github.com/RayVentura/ShortGPT
- https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator
- https://www.vitaliihonchar.com/insights/youtube-shorts-creator
- https://github.com/realwarpie/shortfactory
- https://github.com/Hritikraj8804/Autotube
- https://github.com/rushindrasinha/youtube-shorts-pipeline
- https://www.vozo.ai/blogs/youtube/ai-video-editing-youtube-workflow
- https://clippie.ai/blog/ai-video-creation-trends-2025-2026
- https://thinkpeak.ai/youtube-automations-2026-guide/
- https://www.opus.pro/tools/youtube-shorts-maker
- https://quso.ai/blog/how-to-turn-long-form-videos-into-youtube-shorts-at-scale

**Date:** 2026-03-18

## Key Takeaways

- A complete pipeline transforms one YouTube URL into 5-20 vertical Shorts clips automatically
- Six core stages: Download → Transcribe → Detect Scenes → Score Highlights → Clip → Reformat
- The transcript is the primary signal for clip selection (not visual analysis)
- AI-scored clips should be human-reviewed before publishing (brand safety)
- 90% editing time reduction vs. manual clipping (6-10 hours → 15-30 minutes with review)
- Open-source frameworks (ShortGPT, ShortFactory) provide reference architectures

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    YouTube-to-Shorts Pipeline                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [1] INPUT          [2] DOWNLOAD        [3] TRANSCRIBE           │
│  YouTube URL   ──→  yt-dlp          ──→  WhisperX               │
│  Channel URL        + metadata           + word timestamps       │
│  Playlist URL       + subtitles          + speaker diarization   │
│                     + chapters           OR: Apify (fast path)   │
│                                                                  │
│  [4] ANALYZE        [5] SELECT          [6] CLIP & FORMAT        │
│  Scene detection ──→ LLM scoring    ──→  FFmpeg cut              │
│  Audio energy        Viral ranking       16:9 → 9:16 crop       │
│  Pattern matching    Duration filter     Caption burn-in          │
│  Transcript scan     Human review        Re-encode for mobile    │
│                                                                  │
│  [7] OUTPUT                                                      │
│  Vertical MP4s (1080x1920)                                       │
│  + SRT caption files                                             │
│  + metadata JSON                                                 │
│  + thumbnail frames                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Stage-by-Stage Breakdown

### Stage 1: Input & Metadata Prefetch

**Tool:** Apify YouTube Scraper (or yt-dlp `--dump-json`)
**Purpose:** Gather video metadata before committing to a full download

```typescript
interface PipelineInput {
  url: string;               // YouTube URL
  maxClips: number;           // Target number of Shorts to produce
  targetDuration: [number, number]; // [min, max] seconds per clip
  cropMode: 'center' | 'smart';    // Center crop vs. AI subject tracking
  language: string;           // Primary language for transcription
}

interface VideoMetadata {
  id: string;
  title: string;
  duration: number;           // seconds
  chapters: { start: number; end: number; title: string }[];
  hasSubtitles: boolean;
  subtitleLanguages: string[];
  viewCount: number;
  channel: string;
}
```

**Decision point:** If video is <60 seconds, skip (already a Short). If >3 hours, warn user about processing time.

### Stage 2: Download

**Tool:** yt-dlp (Python library or CLI)
**Output:** MP4 file (1080p max) + .info.json metadata + .srt subtitles (if available)

```bash
# Optimal download command for pipeline
yt-dlp \
  -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]" \
  --merge-output-format mp4 \
  --write-auto-subs --sub-langs en --convert-subs srt \
  --write-info-json \
  -o "%(id)s.%(ext)s" \
  URL
```

**Parallel step:** While downloading, also extract YouTube transcript via Apify (if available). This gives you transcript data before the download finishes.

### Stage 3: Transcribe

**Tool:** WhisperX (with word-level timestamps + speaker diarization)
**Input:** Audio extracted from downloaded video (mono 16kHz WAV)

```
Source Video
    │
    ├── FFmpeg extract audio ──→ audio.wav (16kHz mono)
    │                               │
    │                               ├── WhisperX transcribe
    │                               │       │
    │                               │       ├── Word-level timestamps
    │                               │       └── Speaker labels
    │                               │
    │                               └── Output: transcript.json
    │
    └── (video file retained for clipping in Stage 6)
```

**Optimization:** If YouTube auto-captions were fetched in Stage 1, use those for Stage 4 (scoring). Reserve WhisperX for Stage 6 (final clips only) — saves 80% of transcription compute.

### Stage 4: Analyze & Score

**Tools:** PySceneDetect + audio analysis + LLM scoring
**Purpose:** Identify candidate clip moments ranked by viral potential

#### 4a. Scene Detection (Visual)

```python
# PySceneDetect identifies visual cut points
scenes = detect(video_path, AdaptiveDetector(min_scene_len=30))
```

#### 4b. Audio Energy Analysis

```python
# Score segments by audio energy (louder = more engaging)
# Detect laughter, applause, raised voices
energy_scores = score_audio_energy(audio_path, scenes)
```

#### 4c. Transcript Pattern Scanning

```python
# Fast pass: regex patterns for hooks, claims, emotional triggers
# Each segment gets a 0-100 pattern score
pattern_scores = [score_segment_patterns(seg['text']) for seg in transcript]
```

#### 4d. LLM Viral Scoring

```python
# Deep pass: send top candidates to LLM for nuanced scoring
# Evaluates: hook strength, standalone clarity, quotability, surprise
viral_scores = await score_viral_potential_llm(top_candidates)
```

#### Combined Ranking Formula

```python
final_score = (
    0.40 * llm_viral_score +      # LLM assessment (most important)
    0.25 * pattern_score +         # Regex pattern detection
    0.20 * audio_energy_score +    # Audio engagement signal
    0.15 * visual_motion_score     # Visual dynamism
)
```

### Stage 5: Select & Review

**Purpose:** Filter and rank candidates, present for human approval

```typescript
interface ClipCandidate {
  rank: number;
  startSec: number;
  endSec: number;
  duration: number;
  transcript: string;
  speaker: string;
  viralScore: number;         // 0-100 combined score
  hookType: string;           // hot_take, tutorial_tip, story_moment, etc.
  signals: string[];          // What made it score high
  thumbnailFrame: string;     // Path to extracted frame
}
```

**Filtering rules:**
- Duration must be 15-59 seconds (YouTube Shorts requirement)
- Must start with or contain a hook (first 3 seconds matter most)
- No dead air >2 seconds within the clip
- If diarized, prefer segments where one speaker dominates (cleaner narrative)

**Human review:** Present top 10-15 candidates with transcript preview. User selects 5-10 to produce.

### Stage 6: Clip & Reformat

**Tool:** FFmpeg
**Steps per clip:**

```
1. CUT: Extract segment (frame-accurate with re-encoding)
   ffmpeg -ss START -i source.mp4 -t DURATION -c:v libx264 ...

2. CROP: Convert 16:9 → 9:16 (center crop or smart crop)
   ffmpeg -i clip.mp4 -vf "scale=1080:-2:...,crop=1080:1920" ...

3. CAPTIONS: Generate word-level SRT from WhisperX timestamps
   (Run WhisperX on clip audio if not done on full video)

4. BURN CAPTIONS: Overlay captions onto video
   ffmpeg -i vertical.mp4 -vf "subtitles=captions.srt:force_style='...'" ...

5. THUMBNAIL: Extract best frame for thumbnail
   ffmpeg -i final.mp4 -vf "select=eq(n\,FRAME)" -vframes 1 thumb.jpg
```

#### Caption Styling for Shorts

```bash
# Burn captions with Shorts-optimized styling
ffmpeg -i vertical.mp4 \
  -vf "subtitles=captions.srt:force_style='\
    FontName=Montserrat,\
    FontSize=22,\
    PrimaryColour=&H00FFFFFF,\
    OutlineColour=&H00000000,\
    Outline=2,\
    Shadow=1,\
    Alignment=2,\
    MarginV=80'" \
  -c:v libx264 -crf 20 \
  -c:a copy \
  final_captioned.mp4
```

### Stage 7: Output Package

Each processed clip produces:

```
output/
├── {video_id}/
│   ├── manifest.json           # All clips metadata
│   ├── clip_001/
│   │   ├── clip_001.mp4        # Final vertical video (1080x1920)
│   │   ├── clip_001.srt        # Caption file
│   │   ├── clip_001_thumb.jpg  # Thumbnail
│   │   └── metadata.json       # Clip-specific data
│   ├── clip_002/
│   │   ├── ...
│   └── source/
│       ├── source.mp4          # Original download
│       ├── transcript.json     # Full WhisperX output
│       └── scenes.json         # Scene detection results
```

## Open-Source Reference Implementations

### ShortGPT

**GitHub:** https://github.com/RayVentura/ShortGPT
**Architecture:** Modular engines (ContentShortEngine, EditingEngine)
**Key insight:** Uses "Editing Markup Language" (JSON-based) to make editing steps comprehensible to LLMs

Components:
- Script generation via GPT
- Auto-sourced B-roll from Pexels
- Voice synthesis (ElevenLabs or Edge TTS)
- Automated editing pipeline
- YouTube metadata generation

### AI-Youtube-Shorts-Generator

**GitHub:** https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator
**Architecture:** GPT-4 + FFmpeg + OpenCV
**Key insight:** Uses GPT-4 to analyze transcript and identify interesting sections, then OpenCV for face detection to position the vertical crop

### ShortFactory

**GitHub:** https://github.com/realwarpie/shortfactory
**Architecture:** Built on ShortGPT foundation with enhanced style transfer and multi-platform optimization
**Key insight:** Smart asset management and content style transfer

### Autotube

**GitHub:** https://github.com/Hritikraj8804/Autotube
**Architecture:** n8n workflow automation + AI generation
**Key insight:** Docker-based, self-hosted, full pipeline from topic to published video

## Performance Budgets

| Stage | Tool | 1-Hour Video | 10-Min Video |
|-------|------|-------------|-------------|
| Download | yt-dlp | 2-5 min | 30 sec |
| Audio extraction | FFmpeg | 15 sec | 5 sec |
| Transcription | WhisperX (GPU) | 6 min | 1 min |
| Scene detection | PySceneDetect | 30 sec | 5 sec |
| Highlight scoring | LLM API | 30 sec | 10 sec |
| Clip cutting (x10) | FFmpeg | 2 min | 1 min |
| Vertical conversion (x10) | FFmpeg | 5 min | 2 min |
| Caption burn-in (x10) | FFmpeg | 5 min | 2 min |
| **Total** | | **~20 min** | **~5 min** |

Add 5-15 minutes for human review of clip candidates.

## Error Handling & Edge Cases

| Edge Case | Handling |
|-----------|----------|
| No subtitles available | Fall back to full WhisperX transcription |
| Video is music-only (no speech) | Use audio energy + scene detection only, skip transcript scoring |
| Video is already vertical | Skip 16:9 → 9:16 conversion |
| Video has hardcoded captions | Detect via OCR, skip caption burn-in |
| Multiple languages in video | WhisperX auto-detects language per segment |
| Very long video (>3 hours) | Process in 30-minute chunks, parallelize |
| Download blocked (geo/age) | Use cookies-from-browser or proxy |
| Low audio quality | Use Whisper large-v3 (most robust to noise) |

## Cost Analysis (Per Video Processed)

| Component | Self-Hosted (GPU) | Cloud API |
|-----------|-------------------|-----------|
| yt-dlp download | Free | Free |
| Apify transcript | ~$0.001 | ~$0.001 |
| WhisperX transcription | ~$0.05 (electricity) | ~$3.30 (Replicate, 1hr) |
| LLM scoring | ~$0.02 (local) | ~$0.10 (GPT-4o-mini) |
| FFmpeg processing | ~$0.02 (electricity) | ~$0.50 (cloud compute) |
| Storage (source + clips) | ~$0.05/month | ~$0.05/month |
| **Total per video** | **~$0.15** | **~$4.00** |

At scale (100 videos/month), self-hosted GPU pays for itself within 2 months.

## Integration Notes for Atlas UX

**How Venny/Victor orchestrate this pipeline:**

1. **Job Queue Integration**: Each pipeline run is a job in the Atlas UX job system (`jobs` table). Status transitions: `queued → downloading → transcribing → analyzing → clipping → review → completed`. Each stage updates the job record.

2. **Victor as Orchestrator**: Victor (the video agent) manages the pipeline end-to-end. He receives the YouTube URL, kicks off each stage, monitors progress, and presents clip candidates to the user for review.

3. **Venny as Creative Director**: Venny (the content agent) handles the creative decisions — which clips to select, what caption style to use, how to write the Short's title/description for maximum reach.

4. **Storage Strategy**: Source videos are stored temporarily (deleted after clips are produced). Final clips and transcripts are stored permanently, linked to the content item in the database.

5. **Incremental Processing**: For channels the user wants to repurpose regularly, maintain a `download_archive` to skip already-processed videos. New videos trigger the pipeline automatically.

6. **Quality Tiers**:
   - **Draft mode**: YouTube auto-captions + center crop + no caption styling. Fast, for previewing clip selection.
   - **Production mode**: WhisperX transcription + smart crop + styled captions + thumbnail selection. Full quality, for publishing.

7. **Batch Processing**: When processing a playlist or channel, parallelize downloads but serialize GPU tasks (WhisperX). FFmpeg operations can be parallelized across CPU cores.

8. **Monitoring**: Track metrics per pipeline run: processing time per stage, number of clips produced, viral scores distribution, user acceptance rate (which clips they approve vs. reject). Use this data to tune scoring weights over time.


---
## Media

### Platform References
- **wan**: [Docs](https://github.com/Wan-Video/Wan2.1) · [Gallery](https://wan-video.github.io)

### Related Videos
- [Wan 2.1 Video Generation - Self-Hosted Tutorial](https://www.youtube.com/results?search_query=wan+2.1+video+generation+self+hosted+tutorial) — *Credit: AI Self-Hosted on YouTube* `wan`
- [Wan VACE - Video Editing with AI](https://www.youtube.com/results?search_query=wan+vace+video+editing+ai+tutorial) — *Credit: AI Video on YouTube* `wan`

> *All video content is credited to original creators. Links direct to source platforms.*
