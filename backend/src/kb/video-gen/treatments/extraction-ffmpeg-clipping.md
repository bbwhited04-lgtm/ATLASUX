# FFmpeg: Video Clipping, Cropping & Processing

**Sources:**
- https://shotstack.io/learn/use-ffmpeg-to-trim-video/
- https://www.mux.com/articles/clip-sections-of-a-video-with-ffmpeg
- https://ottverse.com/trim-cut-video-using-start-endtime-reencoding-ffmpeg/
- https://wavespeed.ai/blog/posts/blog-how-to-trim-cut-video-ffmpeg-timestamps-duration/
- https://vgmoose.dev/blog/how-to-crop-landscape-169-videos-to-vertical-916-using-ffmpeg-for-youtube-shorts-or-tiktok-6898118583/
- https://github.com/kamilstanuch/Autocrop-vertical
- https://trac.ffmpeg.org/wiki/Concatenate
- https://www.mux.com/articles/stitch-multiple-videos-together-with-ffmpeg
- https://www.ffmpeg.org/ffmpeg.html

**Date:** 2026-03-18

## Key Takeaways

- FFmpeg is the backbone of all video processing pipelines — clipping, cropping, re-encoding, concatenation
- Two cutting modes: fast stream-copy (keyframe-bound) vs. precise re-encoding (frame-accurate)
- 16:9 to 9:16 conversion requires center-crop math or AI-powered smart cropping (YOLOv8)
- Concatenation via demuxer (fast, same codec) or filter_complex (flexible, re-encodes)
- Encoding with libx264 CRF 20-23 provides good quality-to-size ratio for Shorts

## Installation / Setup

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (via chocolatey or winget)
choco install ffmpeg
winget install ffmpeg

# Verify installation
ffmpeg -version
```

## Core Capabilities

### 1. Cutting / Trimming Video Segments

#### Fast Cut (Stream Copy — No Re-encoding)

```bash
# Cut from 00:01:30 for 45 seconds, no quality loss
ffmpeg -ss 00:01:30 -i input.mp4 -t 00:00:45 -c copy output.mp4

# Cut using start and end time
ffmpeg -ss 00:01:30 -i input.mp4 -to 00:02:15 -c copy output.mp4
```

**Pros:** Instant, no quality loss
**Cons:** Cuts only at keyframes (may be off by a few frames), can cause A/V sync issues

#### Precise Cut (Re-encoding)

```bash
# Frame-accurate cut with re-encoding
ffmpeg -ss 00:01:30 -i input.mp4 -t 00:00:45 \
  -c:v libx264 -crf 20 -preset fast \
  -c:a aac -b:a 192k \
  output.mp4

# With accurate seeking
ffmpeg -ss 00:01:30 -accurate_seek -i input.mp4 -t 00:00:45 \
  -c:v libx264 -crf 20 -preset medium \
  -c:a aac -b:a 192k \
  -avoid_negative_ts make_zero \
  output.mp4
```

**Pros:** Frame-accurate, perfect A/V sync
**Cons:** Slower (re-encodes entire segment)

#### Seeking Placement Matters

```bash
# FAST: -ss BEFORE -i (input seeking — seeks before decoding)
ffmpeg -ss 00:05:00 -i long_video.mp4 -t 00:00:30 -c copy clip.mp4

# PRECISE: -ss AFTER -i (output seeking — decodes then seeks)
ffmpeg -i long_video.mp4 -ss 00:05:00 -t 00:00:30 -c:v libx264 clip.mp4
```

For the Shorts pipeline, always use `-ss` before `-i` with re-encoding for best balance of speed + accuracy.

### 2. Aspect Ratio Conversion (16:9 to 9:16)

#### Center Crop (Simple)

```bash
# 1920x1080 (16:9) → 608x1080 center crop → scale to 1080x1920 (9:16)
ffmpeg -i input.mp4 \
  -vf "crop=ih*9/16:ih,scale=1080:1920" \
  -c:v libx264 -crf 20 -c:a copy \
  vertical.mp4
```

The math: `crop_width = height * 9/16`. For 1080p: `1080 * 9/16 = 607.5 ≈ 608`

#### Center Crop with Explicit Dimensions

```bash
# Explicit crop position: crop=w:h:x:y
# For 1280x720 source: crop_width = 720*9/16 = 405, x_offset = (1280-405)/2 = 437
ffmpeg -i input_720p.mp4 \
  -vf "crop=405:720:437:0,scale=1080:1920" \
  -c:v libx264 -crf 20 \
  vertical.mp4
```

#### Scale-and-Crop (Handles Any Input Resolution)

```bash
# Universal: scale up to fill 9:16, then crop to exact dimensions
ffmpeg -i input.mp4 \
  -vf "scale=1080:-2:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libx264 -crf 20 -c:a aac \
  vertical.mp4
```

#### Smart Crop with Subject Detection (AI-Powered)

For content-aware cropping that follows speakers/subjects, use YOLOv8-based tools:

```bash
# Using Autocrop-vertical (Python + YOLOv8)
pip install ultralytics opencv-python

# The tool detects people via YOLOv8 and centers the 9:16 frame on them
# If subjects are too spread out, it letterboxes to show the full scene
python autocrop.py --input input.mp4 --output vertical.mp4 --aspect 9:16
```

GitHub: https://github.com/kamilstanuch/Autocrop-vertical

#### Letterbox (Show Full Frame with Bars)

```bash
# Keep full 16:9 content, add black bars above/below to fill 9:16
ffmpeg -i input.mp4 \
  -vf "scale=1080:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" \
  -c:v libx264 -crf 20 -c:a aac \
  vertical_letterboxed.mp4
```

### 3. Re-encoding Settings (Optimal for Shorts)

```bash
# Recommended Shorts encoding settings
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -crf 20 \                    # Quality: 18 (high) to 23 (smaller files)
  -preset medium \             # Speed: ultrafast → veryslow
  -profile:v high \            # H.264 profile
  -level 4.1 \                 # Compatibility level
  -pix_fmt yuv420p \           # Universal pixel format
  -movflags +faststart \       # Web-optimized (moov atom at start)
  -r 30 \                      # 30fps standard for Shorts
  -c:a aac -b:a 192k \        # AAC audio at 192kbps
  -ar 44100 \                  # 44.1kHz sample rate
  output.mp4
```

| Parameter | Recommendation | Notes |
|-----------|---------------|-------|
| CRF | 20-22 | Lower = better quality, larger file |
| Preset | medium | Good balance; use fast for batch processing |
| Resolution | 1080x1920 | Standard Shorts resolution |
| FPS | 30 | Standard for social media |
| Audio | AAC 192kbps | Good quality, universally supported |
| Container | MP4 | Required for YouTube/TikTok/Reels |

### 4. Concatenation (Joining Clips)

#### Demuxer Method (Fast, Same Codec)

```bash
# Create file list
echo "file 'clip1.mp4'" > filelist.txt
echo "file 'clip2.mp4'" >> filelist.txt
echo "file 'clip3.mp4'" >> filelist.txt

# Concatenate without re-encoding
ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4
```

#### Filter Complex (Different Formats/Codecs)

```bash
# Concatenate with re-encoding (handles different inputs)
ffmpeg -i clip1.mp4 -i clip2.mp4 -i clip3.mp4 \
  -filter_complex \
    "[0:v:0][0:a:0][1:v:0][1:a:0][2:v:0][2:a:0]concat=n=3:v=1:a=1[outv][outa]" \
  -map "[outv]" -map "[outa]" \
  -c:v libx264 -crf 20 \
  -c:a aac -b:a 192k \
  output.mp4

# With normalization (different resolutions/framerates)
ffmpeg -i clip1.mp4 -i clip2.mp4 \
  -filter_complex \
    "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v0]; \
     [1:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v1]; \
     [0:a]aresample=44100,loudnorm[a0]; \
     [1:a]aresample=44100,loudnorm[a1]; \
     [v0][a0][v1][a1]concat=n=2:v=1:a=1[outv][outa]" \
  -map "[outv]" -map "[outa]" \
  -c:v libx264 -crf 20 -c:a aac \
  output.mp4
```

### 5. Audio Extraction

```bash
# Extract audio as MP3
ffmpeg -i input.mp4 -vn -c:a libmp3lame -q:a 2 audio.mp3

# Extract audio as WAV (lossless, best for Whisper)
ffmpeg -i input.mp4 -vn -c:a pcm_s16le -ar 16000 -ac 1 audio.wav

# Extract audio as AAC
ffmpeg -i input.mp4 -vn -c:a aac -b:a 192k audio.m4a
```

For Whisper transcription, extract as mono 16kHz WAV:
```bash
ffmpeg -i input.mp4 -vn -ar 16000 -ac 1 -c:a pcm_s16le whisper_input.wav
```

## Code Examples

### Node.js / TypeScript — FFmpeg Wrapper

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';

const exec = promisify(execFile);

interface ClipSpec {
  start: number;  // seconds
  end: number;    // seconds
  label: string;
}

/**
 * Cut a clip from a video with frame-accurate seeking.
 */
async function cutClip(
  inputPath: string,
  outputPath: string,
  startSec: number,
  durationSec: number
): Promise<void> {
  const startTs = formatTimestamp(startSec);
  const durTs = formatTimestamp(durationSec);

  await exec('ffmpeg', [
    '-ss', startTs,
    '-accurate_seek',
    '-i', inputPath,
    '-t', durTs,
    '-c:v', 'libx264', '-crf', '20', '-preset', 'fast',
    '-c:a', 'aac', '-b:a', '192k',
    '-avoid_negative_ts', 'make_zero',
    '-movflags', '+faststart',
    '-y',
    outputPath,
  ]);
}

/**
 * Convert a horizontal clip to vertical (9:16) with center crop.
 */
async function convertToVertical(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await exec('ffmpeg', [
    '-i', inputPath,
    '-vf', 'scale=1080:-2:force_original_aspect_ratio=increase,crop=1080:1920',
    '-c:v', 'libx264', '-crf', '20', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    '-y',
    outputPath,
  ]);
}

/**
 * Extract audio as mono 16kHz WAV for Whisper.
 */
async function extractAudioForWhisper(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await exec('ffmpeg', [
    '-i', inputPath,
    '-vn', '-ar', '16000', '-ac', '1',
    '-c:a', 'pcm_s16le',
    '-y',
    outputPath,
  ]);
}

/**
 * Concatenate multiple clips into one video.
 */
async function concatenateClips(
  clipPaths: string[],
  outputPath: string
): Promise<void> {
  const listContent = clipPaths.map(p => `file '${p}'`).join('\n');
  const listFile = outputPath.replace(/\.\w+$/, '_filelist.txt');
  await writeFile(listFile, listContent);

  await exec('ffmpeg', [
    '-f', 'concat', '-safe', '0',
    '-i', listFile,
    '-c', 'copy',
    '-movflags', '+faststart',
    '-y',
    outputPath,
  ]);
}

/**
 * Full pipeline: cut + convert to vertical.
 */
async function createShortClip(
  sourcePath: string,
  outputPath: string,
  startSec: number,
  durationSec: number
): Promise<void> {
  const tempClip = outputPath.replace('.mp4', '_temp.mp4');
  await cutClip(sourcePath, tempClip, startSec, durationSec);
  await convertToVertical(tempClip, outputPath);
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${s.toFixed(3).padStart(6,'0')}`;
}
```

## Integration Notes for Atlas UX

**How Venny/Victor would use FFmpeg:**

1. **Clip Extraction**: After scene detection identifies highlight moments, FFmpeg cuts precise segments using re-encoding mode for frame-accurate clips. Each clip is 15-59 seconds (Shorts constraints).

2. **Vertical Conversion**: Every clip goes through the 16:9 → 9:16 center-crop pipeline. For talking-head content (podcasts, interviews), center-crop works well. For action content, consider AI smart crop with YOLOv8.

3. **Audio Pipeline**: Before Whisper transcription, FFmpeg extracts audio as mono 16kHz WAV — the optimal input format for Whisper. This happens once on the full source video, not per-clip.

4. **Assembly**: After captions and overlays are added, clips can be concatenated with intro/outro bumpers using the concat demuxer (fast, no re-encoding needed if all clips match format).

5. **Encoding Budget**: For batch processing 10-20 clips per video, use `-preset fast` (not medium/slow) to keep processing time reasonable. CRF 20 is good enough for mobile-first Shorts.

6. **Two-Pass Approach**: Cut first (stream copy for speed), then re-encode only the final vertical output. This avoids re-encoding the full source video.


---
## Media

### Category Resources
- [Atlas UX AI Video Generation Wiki](https://atlasux.cloud/#/wiki/video-gen)
