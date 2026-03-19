# AI Scene Detection & Highlight Identification

**Sources:**
- https://github.com/Breakthrough/PySceneDetect
- https://www.scenedetect.com/
- https://www.scenedetect.com/cli/
- https://pypi.org/project/scenedetect/
- https://pypi.org/project/transnetv2-pytorch/
- https://docs.vultr.com/video-scene-transition-detection-and-split-video-using-pyscenedetect
- https://github.com/kamilstanuch/Autocrop-vertical
- https://eklipse.gg/features/ai-highlights/
- https://www.spikes.studio/
- https://www.opus.pro/tools/youtube-shorts-maker
- https://autoclip.dev/tools
- https://www.revid.ai/tools/youtube-clip-maker

**Date:** 2026-03-18

## Key Takeaways

- PySceneDetect is the standard open-source tool for shot/scene boundary detection
- TransNetV2 is a deep learning model for more accurate transition detection (catches fades, dissolves)
- Two-stage approach works best: PySceneDetect (fast, heuristic) then TransNetV2 (precise, neural)
- Scene detection alone finds CUT POINTS — highlight identification requires additional AI (transcript analysis, audio energy, engagement prediction)
- Commercial tools (Opus Clip, Spikes Studio, Eklipse) combine scene detection with virality scoring
- For a self-hosted pipeline, combine PySceneDetect + transcript analysis + LLM scoring

## Installation / Setup

```bash
# PySceneDetect
pip install scenedetect[opencv]

# TransNetV2 (PyTorch version)
pip install transnetv2-pytorch

# Additional dependencies
pip install opencv-python numpy torch
```

## Core Capabilities

### PySceneDetect

#### Detection Methods

| Detector | Best For | Speed | How It Works |
|----------|----------|-------|--------------|
| `ContentDetector` | Hard cuts | Fast | Compares HSV color histograms between frames |
| `AdaptiveDetector` | Hard cuts (varying content) | Fast | Adaptive threshold based on surrounding frames |
| `ThresholdDetector` | Fade-in/fade-out | Fast | Detects frames below a brightness threshold |
| `HashDetector` | Hard cuts | Very fast | Perceptual hashing comparison |

#### CLI Usage

```bash
# Basic scene detection + split
scenedetect -i video.mp4 detect-adaptive split-video

# Content-based detection with custom threshold
scenedetect -i video.mp4 detect-content --threshold 27 split-video

# List scenes without splitting
scenedetect -i video.mp4 detect-adaptive list-scenes

# Save scene list to CSV
scenedetect -i video.mp4 detect-adaptive list-scenes -f scenes.csv

# Detect fades
scenedetect -i video.mp4 detect-threshold --threshold 12

# Combined: detect cuts AND fades
scenedetect -i video.mp4 detect-adaptive detect-threshold list-scenes
```

#### Python API

```python
from scenedetect import detect, AdaptiveDetector, ContentDetector, split_video_ffmpeg

# Simple detection
scene_list = detect('video.mp4', AdaptiveDetector())

# Print scene boundaries
for i, scene in enumerate(scene_list):
    start_time = scene[0].get_seconds()
    end_time = scene[1].get_seconds()
    duration = end_time - start_time
    print(f"Scene {i+1}: {start_time:.2f}s - {end_time:.2f}s ({duration:.2f}s)")

# Split video by detected scenes
split_video_ffmpeg('video.mp4', scene_list)

# Custom threshold (lower = more sensitive)
scene_list = detect('video.mp4', ContentDetector(threshold=20))

# Adaptive detection (recommended for most content)
scene_list = detect('video.mp4', AdaptiveDetector(
    adaptive_threshold=3.0,   # Sensitivity multiplier
    min_scene_len=15,         # Minimum scene length in frames
    window_width=2,           # Frames to look ahead/behind
))
```

### TransNetV2

#### Overview

TransNetV2 is a deep neural network trained specifically for shot transition detection. It excels at detecting:
- Hard cuts (same as PySceneDetect, but more accurate)
- Gradual transitions (dissolves, wipes, fades) that PySceneDetect misses
- Fast motion scenes that cause false positives in heuristic detectors

#### Python Usage

```python
import torch
from transnetv2_pytorch import TransNetV2

# Load model
model = TransNetV2()
model.load_state_dict(torch.load('transnetv2-pytorch-weights.pth'))
model.eval()

# Process video frames
import cv2
import numpy as np

def detect_transitions_transnet(video_path: str, threshold: float = 0.5):
    """Detect scene transitions using TransNetV2."""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frames = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.resize(frame, (48, 27))  # TransNetV2 input size
        frames.append(frame)

    cap.release()
    frames = np.array(frames)

    # Predict transitions
    with torch.no_grad():
        frames_tensor = torch.from_numpy(frames).permute(0, 3, 1, 2).float() / 255.0
        predictions = model(frames_tensor.unsqueeze(0))

    # Extract scene boundaries
    scenes = []
    single_frame_pred = predictions[0].sigmoid().numpy()
    transitions = np.where(single_frame_pred > threshold)[0]

    prev = 0
    for t in transitions:
        scenes.append({
            'start_frame': prev,
            'end_frame': t,
            'start_sec': prev / fps,
            'end_sec': t / fps,
            'duration': (t - prev) / fps,
        })
        prev = t

    return scenes
```

### Two-Stage Detection Pipeline

```python
from scenedetect import detect, AdaptiveDetector

def two_stage_detection(video_path: str) -> list[dict]:
    """
    Stage 1: PySceneDetect (fast heuristic pass)
    Stage 2: TransNetV2 (refine boundaries, catch missed transitions)
    """
    # Stage 1: Fast detection
    psd_scenes = detect(video_path, AdaptiveDetector(
        min_scene_len=15,
        adaptive_threshold=3.0,
    ))

    psd_boundaries = set()
    for scene in psd_scenes:
        psd_boundaries.add(scene[0].get_frames())
        psd_boundaries.add(scene[1].get_frames())

    # Stage 2: Neural refinement
    transnet_scenes = detect_transitions_transnet(video_path, threshold=0.4)
    transnet_boundaries = {s['start_frame'] for s in transnet_scenes}

    # Merge: union of both detectors, deduplicate nearby boundaries
    all_boundaries = sorted(psd_boundaries | transnet_boundaries)
    merged = [all_boundaries[0]]
    for b in all_boundaries[1:]:
        if b - merged[-1] > 10:  # At least 10 frames apart
            merged.append(b)

    return merged
```

### Highlight Identification

Scene detection finds CUT POINTS. Highlight identification finds INTERESTING segments. These require different approaches:

#### Energy-Based Scoring

```python
import librosa
import numpy as np

def score_audio_energy(audio_path: str, scene_boundaries: list[dict]) -> list[dict]:
    """Score each scene segment by audio energy (louder = more exciting)."""
    y, sr = librosa.load(audio_path, sr=22050)

    for scene in scene_boundaries:
        start_sample = int(scene['start_sec'] * sr)
        end_sample = int(scene['end_sec'] * sr)
        segment = y[start_sample:end_sample]

        scene['audio_rms'] = float(np.sqrt(np.mean(segment**2)))
        scene['audio_peak'] = float(np.max(np.abs(segment)))

    # Normalize scores 0-100
    max_rms = max(s['audio_rms'] for s in scene_boundaries)
    for scene in scene_boundaries:
        scene['energy_score'] = (scene['audio_rms'] / max_rms) * 100

    return sorted(scene_boundaries, key=lambda s: s['energy_score'], reverse=True)
```

#### Visual Motion Scoring

```python
import cv2
import numpy as np

def score_visual_motion(video_path: str, scene_boundaries: list[dict]) -> list[dict]:
    """Score scenes by visual motion (more motion = more dynamic)."""
    cap = cv2.VideoCapture(video_path)

    for scene in scene_boundaries:
        start_frame = int(scene['start_sec'] * cap.get(cv2.CAP_PROP_FPS))
        end_frame = int(scene['end_sec'] * cap.get(cv2.CAP_PROP_FPS))

        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        prev_gray = None
        motion_scores = []

        for _ in range(start_frame, min(end_frame, start_frame + 300)):  # Cap at 300 frames
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            if prev_gray is not None:
                diff = cv2.absdiff(gray, prev_gray)
                motion_scores.append(np.mean(diff))
            prev_gray = gray

        scene['motion_score'] = float(np.mean(motion_scores)) if motion_scores else 0

    cap.release()
    return scene_boundaries
```

#### LLM-Based Highlight Scoring (Using Transcript)

```python
async def score_highlights_with_llm(
    transcript_segments: list[dict],
    scene_boundaries: list[dict]
) -> list[dict]:
    """Use an LLM to score transcript segments for viral potential."""
    # Map transcript segments to scenes
    for scene in scene_boundaries:
        scene_text = " ".join(
            seg['text'] for seg in transcript_segments
            if seg['start'] >= scene['start_sec'] and seg['start'] < scene['end_sec']
        )
        scene['transcript'] = scene_text

    # Score in batches
    prompt = """Rate each video segment 0-100 for viral potential as a YouTube Short.
Consider: hook strength, emotional impact, standalone clarity, quotability, surprise factor.

Segments:
{segments}

Return JSON array: [{"index": 0, "score": 85, "reason": "strong hook + surprising claim"}]"""

    # ... call OpenAI/Anthropic with the prompt
    # Return scored scenes sorted by viral potential
    pass
```

### Commercial Highlight Detection Tools (Reference)

| Tool | Approach | Best For | Pricing |
|------|----------|----------|---------|
| Opus Clip | AI analysis of transcript + visuals | YouTube → Shorts | Free tier + paid |
| Spikes Studio | Chat/engagement peak detection | Livestream clips | Subscription |
| Eklipse | Twitch chat spike detection | Gaming highlights | Free tier + paid |
| Revid.ai | Full transcript + engagement scoring | YouTube repurposing | Subscription |
| AutoClip | AI multi-signal analysis | General content | Per-video |

These are useful as benchmarks but not suitable for self-hosted pipeline integration.

## Code Examples

### Complete Scene Detection Pipeline

```python
from scenedetect import detect, AdaptiveDetector
import json

def analyze_video_scenes(video_path: str, min_clip_duration: float = 10.0, max_clip_duration: float = 59.0) -> list[dict]:
    """
    Full scene analysis pipeline:
    1. Detect scene boundaries
    2. Filter by duration (Shorts-appropriate)
    3. Return candidate clips
    """
    # Detect scenes
    raw_scenes = detect(video_path, AdaptiveDetector(
        min_scene_len=30,           # At least 1 second at 30fps
        adaptive_threshold=3.0,
    ))

    # Build candidate clips
    candidates = []
    for i, (start, end) in enumerate(raw_scenes):
        duration = end.get_seconds() - start.get_seconds()

        # Filter: too short or too long for Shorts
        if duration < min_clip_duration or duration > max_clip_duration:
            continue

        candidates.append({
            'index': i,
            'start_sec': start.get_seconds(),
            'end_sec': end.get_seconds(),
            'start_timecode': str(start),
            'end_timecode': str(end),
            'duration': duration,
        })

    return candidates

# Also: merge adjacent short scenes into Shorts-length clips
def merge_scenes_to_clips(scenes: list[dict], target_duration: float = 45.0) -> list[dict]:
    """Merge adjacent scenes into clips of target duration."""
    clips = []
    current_clip = None

    for scene in scenes:
        if current_clip is None:
            current_clip = {**scene}
            continue

        merged_duration = scene['end_sec'] - current_clip['start_sec']
        if merged_duration <= target_duration:
            current_clip['end_sec'] = scene['end_sec']
            current_clip['duration'] = merged_duration
        else:
            clips.append(current_clip)
            current_clip = {**scene}

    if current_clip:
        clips.append(current_clip)

    return clips
```

## Integration Notes for Atlas UX

**How Venny/Victor would use scene detection:**

1. **Pipeline Position**: Scene detection runs AFTER download and AFTER audio extraction/Whisper transcription. It needs the video file on disk.

2. **Two-Signal Approach**: Use PySceneDetect for fast initial segmentation (seconds per video), then score segments using transcript analysis (LLM) + audio energy. Skip TransNetV2 unless content has complex transitions (documentaries, music videos).

3. **Shorts Duration Filtering**: YouTube Shorts must be under 60 seconds. Filter detected scenes to 15-59 second range. Merge adjacent short scenes to hit the sweet spot (30-45 seconds).

4. **Highlight Ranking**: Combine three signals for viral potential scoring:
   - Audio energy score (loud moments, laughter, reactions)
   - Transcript viral scoring (hooks, claims, quotable lines — via LLM)
   - Visual motion score (dynamic scenes over static ones)

5. **Human-in-the-Loop**: Scene detection + scoring generates a ranked list of candidate clips. Victor (or the user) reviews and selects which clips to produce. Full automation is risky for brand safety.

6. **Performance Budget**: PySceneDetect processes a 1-hour video in ~30 seconds. TransNetV2 takes 2-5 minutes for the same video on GPU. For the MVP pipeline, PySceneDetect alone is sufficient.

7. **Talking-Head Optimization**: For podcast/interview content (most common Shorts source), scene detection matters less — the visual barely changes. Instead, rely primarily on transcript analysis to find clip-worthy dialogue moments.


---
## Media

### Category Resources
- [Atlas UX AI Video Generation Wiki](https://atlasux.cloud/#/wiki/video-gen)
