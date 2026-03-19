# OpenAI Whisper: Transcription & Viral Moment Identification

**Sources:**
- https://github.com/m-bain/whisperX
- https://github.com/MahmoudAshraf97/whisper-diarization
- https://github.com/openai/whisper/discussions/264
- https://github.com/openai/whisper/discussions/684
- https://brasstranscripts.com/blog/whisper-speaker-diarization-guide
- https://valor-software.com/articles/interview-transcription-using-whisperx-model-part-1
- https://gotranscript.com/public/whisperx-fast-whisper-transcription-with-word-timestamps
- https://replicate.com/thomasmol/whisper-diarization
- https://clickyapps.com/creator/video/guides/find-quotable-moments-long-videos
- https://datacurious.hashnode.dev/unlocking-audio-insights-speaker-diarization-with-whisperx-for-who-said-what

**Date:** 2026-03-18

## Key Takeaways

- WhisperX is the go-to tool: Whisper transcription + word-level timestamps + speaker diarization in one package
- Word-level timestamps enable precise clip cutting aligned to speech boundaries
- Speaker diarization (via pyannote.audio) identifies WHO is speaking WHEN — critical for multi-speaker content
- WhisperX uses forced alignment (wav2vec 2.0) for timestamp accuracy far beyond base Whisper
- Viral moment detection combines transcript analysis with LLM scoring for hooks, claims, and quotable lines
- Processing: ~10x real-time on GPU (1-hour video in ~6 minutes)

## Installation / Setup

### WhisperX (Recommended — All-in-One)

```bash
# Create conda environment (recommended)
conda create -n whisperx python=3.10
conda activate whisperx

# Install PyTorch with CUDA
conda install pytorch torchvision torchaudio pytorch-cuda=12.1 -c pytorch -c nvidia

# Install WhisperX
pip install whisperx

# For speaker diarization, you need a Hugging Face token:
# 1. Create account at huggingface.co
# 2. Accept pyannote model terms: https://huggingface.co/pyannote/speaker-diarization-3.1
# 3. Accept segmentation model terms: https://huggingface.co/pyannote/segmentation-3.0
# 4. Create access token: huggingface.co/settings/tokens
```

### Base Whisper (Simpler, No Diarization)

```bash
pip install openai-whisper
# or faster alternative:
pip install faster-whisper
```

### FFmpeg Required

```bash
# WhisperX/Whisper need ffmpeg for audio decoding
ffmpeg -version  # verify installed
```

## Core Capabilities

### 1. Transcription with Word-Level Timestamps

#### WhisperX Python API

```python
import whisperx
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
compute_type = "float16" if device == "cuda" else "int8"

def transcribe_with_timestamps(audio_path: str, language: str = "en") -> dict:
    """Full transcription with word-level timestamps."""

    # Step 1: Transcribe with Whisper
    model = whisperx.load_model(
        "large-v3",         # Options: tiny, base, small, medium, large-v2, large-v3
        device,
        compute_type=compute_type,
        language=language,
    )
    audio = whisperx.load_audio(audio_path)
    result = model.transcribe(audio, batch_size=16)

    # Step 2: Align for word-level timestamps (forced alignment with wav2vec2)
    align_model, metadata = whisperx.load_align_model(
        language_code=language,
        device=device,
    )
    result = whisperx.align(
        result["segments"],
        align_model,
        metadata,
        audio,
        device,
        return_char_alignments=False,
    )

    return result
    # result["segments"] contains:
    # [{ "start": 0.5, "end": 3.2, "text": "Hello world",
    #    "words": [{"word": "Hello", "start": 0.5, "end": 0.9},
    #              {"word": "world", "start": 1.0, "end": 1.3}] }]
```

#### Output Structure

```json
{
  "segments": [
    {
      "start": 0.52,
      "end": 3.18,
      "text": "The biggest mistake plumbers make is not answering the phone.",
      "words": [
        {"word": "The", "start": 0.52, "end": 0.68, "score": 0.95},
        {"word": "biggest", "start": 0.70, "end": 1.02, "score": 0.92},
        {"word": "mistake", "start": 1.04, "end": 1.38, "score": 0.98},
        {"word": "plumbers", "start": 1.40, "end": 1.82, "score": 0.88},
        {"word": "make", "start": 1.84, "end": 2.10, "score": 0.96},
        {"word": "is", "start": 2.12, "end": 2.24, "score": 0.99},
        {"word": "not", "start": 2.26, "end": 2.48, "score": 0.97},
        {"word": "answering", "start": 2.50, "end": 2.90, "score": 0.91},
        {"word": "the", "start": 2.92, "end": 3.00, "score": 0.99},
        {"word": "phone", "start": 3.02, "end": 3.18, "score": 0.94}
      ]
    }
  ]
}
```

### 2. Speaker Diarization (Who Said What)

```python
def transcribe_with_speakers(
    audio_path: str,
    hf_token: str,
    min_speakers: int = 2,
    max_speakers: int = 5,
    language: str = "en",
) -> dict:
    """Full pipeline: transcription + alignment + speaker diarization."""

    # Step 1: Transcribe
    model = whisperx.load_model("large-v3", device, compute_type=compute_type)
    audio = whisperx.load_audio(audio_path)
    result = model.transcribe(audio, batch_size=16)

    # Step 2: Align for word-level timestamps
    align_model, metadata = whisperx.load_align_model(language_code=language, device=device)
    result = whisperx.align(result["segments"], align_model, metadata, audio, device)

    # Step 3: Speaker diarization
    diarize_model = whisperx.DiarizationPipeline(
        use_auth_token=hf_token,
        device=device,
    )
    diarize_segments = diarize_model(
        audio,
        min_speakers=min_speakers,
        max_speakers=max_speakers,
    )

    # Step 4: Assign speakers to transcript segments
    result = whisperx.assign_word_speakers(diarize_segments, result)

    return result
    # Each segment now has "speaker": "SPEAKER_00", "SPEAKER_01", etc.
```

#### Diarized Output Example

```json
{
  "segments": [
    {
      "start": 0.52,
      "end": 3.18,
      "text": "The biggest mistake plumbers make is not answering the phone.",
      "speaker": "SPEAKER_00",
      "words": [...]
    },
    {
      "start": 3.50,
      "end": 6.20,
      "text": "Yeah, I used to lose three or four jobs a week because of that.",
      "speaker": "SPEAKER_01",
      "words": [...]
    }
  ]
}
```

### 3. Identifying Viral / Quotable Moments

#### Pattern-Based Detection

```python
import re

# Patterns that signal viral-worthy content
VIRAL_PATTERNS = {
    'strong_claim': [
        r'\b(never|always|biggest|worst|best|most important|number one|#1)\b',
        r'\b(\d+%|\$\d+[kKmM]?|\d+ (times|x|percent))\b',
    ],
    'hook_opener': [
        r'^(here\'s (the thing|what|why)|the (truth|secret|problem) (is|about))',
        r'^(nobody|everyone|most people) (talks?|knows?|realizes?|understands?)',
        r'^(stop|don\'t|never) ',
        r'^(what if|imagine|picture this)',
    ],
    'emotional_trigger': [
        r'\b(insane|crazy|mind-blowing|shocking|unbelievable|game.?changer)\b',
        r'\b(changed my life|blew my mind|wish I knew|cost me)\b',
    ],
    'quotable': [
        r'\b(if you\'re not .+, you\'re .+)\b',
        r'\b(the .+ is .+, not .+)\b',
    ],
    'question_hook': [
        r'^(do you know|did you know|want to know|ever wonder)',
        r'\?\s*$',  # Ends with question mark
    ],
}

def score_segment_patterns(text: str) -> dict:
    """Score a transcript segment for viral patterns."""
    scores = {}
    total = 0
    text_lower = text.lower().strip()

    for category, patterns in VIRAL_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                scores[category] = scores.get(category, 0) + 20
                total += 20
                break

    return {'score': min(total, 100), 'signals': scores}
```

#### LLM-Based Scoring

```python
async def score_viral_potential_llm(
    segments: list[dict],
    batch_size: int = 20,
) -> list[dict]:
    """Use an LLM to score transcript segments for viral potential."""

    scored = []
    for i in range(0, len(segments), batch_size):
        batch = segments[i:i + batch_size]
        segment_text = "\n".join(
            f"[{j}] ({seg['start']:.1f}s-{seg['end']:.1f}s) {seg['text']}"
            for j, seg in enumerate(batch)
        )

        prompt = f"""You are analyzing a video transcript to find the best moments for YouTube Shorts clips.

Rate each segment 0-100 for "viral clip potential." Consider:
- Hook strength: Does it grab attention in the first 2 seconds?
- Standalone clarity: Does it make sense without context?
- Emotional impact: Does it provoke a reaction?
- Quotability: Would someone share or screenshot this?
- Surprise factor: Does it reveal something unexpected?

Segments:
{segment_text}

Return a JSON array with exactly {len(batch)} entries:
[{{"index": 0, "score": 85, "hook": "strong claim about revenue loss", "clip_type": "hot_take"}}]

clip_type options: hot_take, tutorial_tip, story_moment, data_point, emotional_peak, question_hook, funny_moment"""

        # Call your AI provider here (OpenAI, Anthropic, etc.)
        # response = await openai_client.chat.completions.create(...)
        # Parse response and merge scores into segments

    return scored
```

#### Combined Scoring Pipeline

```python
def identify_viral_moments(
    transcript: dict,
    min_duration: float = 10.0,
    max_duration: float = 55.0,
    top_n: int = 10,
) -> list[dict]:
    """
    Identify the most clip-worthy moments from a transcript.
    Combines pattern matching + duration filtering.
    """
    segments = transcript['segments']
    candidates = []

    for seg in segments:
        duration = seg['end'] - seg['start']
        if duration < min_duration or duration > max_duration:
            continue

        pattern_score = score_segment_patterns(seg['text'])

        candidates.append({
            'start': seg['start'],
            'end': seg['end'],
            'duration': duration,
            'text': seg['text'],
            'speaker': seg.get('speaker', 'unknown'),
            'pattern_score': pattern_score['score'],
            'signals': pattern_score['signals'],
        })

    # Sort by pattern score, return top N
    candidates.sort(key=lambda c: c['pattern_score'], reverse=True)
    return candidates[:top_n]
```

### 4. Model Size vs. Quality Trade-offs

| Model | Parameters | English WER | Speed (GPU) | VRAM | Best For |
|-------|-----------|-------------|-------------|------|----------|
| tiny | 39M | ~10% | 32x real-time | 1GB | Testing, prototyping |
| base | 74M | ~7% | 16x real-time | 1GB | Quick drafts |
| small | 244M | ~5% | 8x real-time | 2GB | Good enough for most |
| medium | 769M | ~4% | 4x real-time | 5GB | High accuracy |
| large-v3 | 1.5B | ~3% | 2x real-time | 10GB | Production quality |

For Shorts pipeline, `large-v3` is recommended — accuracy matters for captions, and you process each video only once.

### 5. Faster-Whisper (CTranslate2 Backend)

```python
from faster_whisper import WhisperModel

# 4x faster than base Whisper with same accuracy
model = WhisperModel("large-v3", device="cuda", compute_type="float16")

segments, info = model.transcribe("audio.wav", word_timestamps=True)
for segment in segments:
    print(f"[{segment.start:.2f} -> {segment.end:.2f}] {segment.text}")
    for word in segment.words:
        print(f"  {word.word} [{word.start:.2f} -> {word.end:.2f}]")
```

## Code Examples

### Node.js / TypeScript — Whisper via Subprocess

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const exec = promisify(execFile);

interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  words: TranscriptWord[];
}

/**
 * Run WhisperX transcription via Python subprocess.
 * Assumes whisperx is installed in a conda/venv environment.
 */
async function transcribeWithWhisperX(
  audioPath: string,
  outputDir: string,
  options: {
    model?: string;
    language?: string;
    diarize?: boolean;
    hfToken?: string;
  } = {}
): Promise<TranscriptSegment[]> {
  const {
    model = 'large-v3',
    language = 'en',
    diarize = true,
    hfToken,
  } = options;

  const args = [
    '-m', 'whisperx',
    audioPath,
    '--model', model,
    '--language', language,
    '--output_dir', outputDir,
    '--output_format', 'json',
    '--word_timestamps', 'True',
  ];

  if (diarize && hfToken) {
    args.push('--diarize', '--hf_token', hfToken);
  }

  await exec('python', args, { timeout: 600_000 }); // 10 min timeout

  const jsonPath = audioPath
    .replace(/\.\w+$/, '.json')
    .split('/').pop()!;
  const resultPath = `${outputDir}/${jsonPath}`;
  const result = JSON.parse(await readFile(resultPath, 'utf-8'));

  return result.segments;
}

/**
 * Find clip-worthy moments from transcript segments.
 */
function findViralMoments(
  segments: TranscriptSegment[],
  minDuration = 10,
  maxDuration = 55,
): TranscriptSegment[] {
  return segments
    .filter(seg => {
      const dur = seg.end - seg.start;
      return dur >= minDuration && dur <= maxDuration;
    })
    .filter(seg => {
      const text = seg.text.toLowerCase();
      // Quick viral signal detection
      return (
        /\b(never|always|biggest|secret|truth|mistake)\b/.test(text) ||
        /\b\d+%/.test(text) ||
        /\$\d+/.test(text) ||
        text.endsWith('?')
      );
    });
}
```

### Replicate API (Cloud-Based, No GPU Required)

```typescript
import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

async function transcribeViaReplicate(audioUrl: string) {
  const output = await replicate.run(
    'thomasmol/whisper-diarization:cbd15da9f839c5f932742f86ce7def3a03c22e2f4171d6f5a4e621c766c4c7c7',
    {
      input: {
        file_url: audioUrl,
        num_speakers: 2,
        group_segments: true,
        offset_seconds: 0,
        transcript_output_format: 'segments_only',
      },
    }
  );
  return output;
}
```

## Integration Notes for Atlas UX

**How Venny/Victor would use Whisper:**

1. **Pipeline Position**: After yt-dlp downloads the video, FFmpeg extracts audio as mono 16kHz WAV, then WhisperX transcribes with word-level timestamps + speaker diarization.

2. **Dual Transcript Strategy**: First check if YouTube auto-captions are available (via Apify, near-instant). If yes, use those for initial clip identification. Run WhisperX only on selected clips for precise word-level timestamps (needed for caption burn-in).

3. **Speaker Diarization for Interviews**: For podcast/interview content, diarization identifies host vs. guest. This enables clip selection rules like "find moments where the guest makes a strong claim" or "find question-answer exchanges under 45 seconds."

4. **Viral Moment Detection**: Combine pattern-based scoring (fast, deterministic) with LLM scoring (nuanced, catches context). Pattern scoring filters 100 segments to ~20 candidates. LLM scoring ranks those 20 with reasoning.

5. **Word Timestamps for Captions**: Precise word-level timestamps from WhisperX are essential for word-by-word caption animation (the "karaoke style" that performs well on Shorts/Reels/TikTok).

6. **GPU Considerations**: WhisperX large-v3 needs 10GB VRAM. Options:
   - Local GPU if available (fastest, cheapest at scale)
   - Replicate API ($0.0055/sec of audio, ~$20 for 1 hour)
   - RunPod/vast.ai serverless GPU (~$0.30/hour for A10G)

7. **Caching**: Transcriptions should be stored in the database (linked to video ID + model version). Never re-transcribe the same content.


---
## Media

### Platform References
- **wan**: [Docs](https://github.com/Wan-Video/Wan2.1) · [Gallery](https://wan-video.github.io)

### Related Videos
- [Wan 2.1 Video Generation - Self-Hosted Tutorial](https://www.youtube.com/results?search_query=wan+2.1+video+generation+self+hosted+tutorial) — *Credit: AI Self-Hosted on YouTube* `wan`
- [Wan VACE - Video Editing with AI](https://www.youtube.com/results?search_query=wan+vace+video+editing+ai+tutorial) — *Credit: AI Video on YouTube* `wan`

> *All video content is credited to original creators. Links direct to source platforms.*
