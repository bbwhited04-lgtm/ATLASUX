# yt-dlp: Video Extraction & Download

**Sources:**
- https://ostechnix.com/yt-dlp-tutorial/
- https://www.rapidseedbox.com/blog/yt-dlp-complete-guide
- https://www.devkantkumar.com/blog/yt-dlp-ultimate-guide-2026
- https://www.ditig.com/yt-dlp-cheat-sheet
- https://github.com/yt-dlp/yt-dlp
- https://pypi.org/project/yt-dlp
- https://typevar.dev/articles/yt-dlp/yt-dlp
- https://yt-dlp.eknerd.com/docs/embedding%20yt-dlp/using-yt-dlp-in-python-scripts/

**Date:** 2026-03-18

## Key Takeaways

- yt-dlp is the actively maintained fork of youtube-dl, supporting 1000+ sites
- Default format selector is `bv*+ba/b` — best video + best audio, merged via ffmpeg
- Supports subtitle download/embed, chapter splitting, playlist handling, and cookie-based auth
- Can be used as a CLI tool or embedded directly as a Python library
- Actively maintained with frequent updates to handle site changes (2025-2026)

## Installation / Setup

```bash
# pip install (recommended for Python integration)
pip install yt-dlp

# Or via package managers
brew install yt-dlp          # macOS
winget install yt-dlp        # Windows
sudo apt install yt-dlp      # Debian/Ubuntu (may be outdated)

# Requires ffmpeg for merging/post-processing
# Verify: ffmpeg -version
```

## Core Capabilities

### Format Selection

```bash
# Best quality (default) — merges best video + best audio
yt-dlp URL

# Specific format selection
yt-dlp -f "bestvideo[height<=1080]+bestaudio" URL

# List available formats first
yt-dlp -F URL

# Best MP4 video + best M4A audio (avoid webm)
yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]" URL

# Worst quality (smallest file, for testing)
yt-dlp -f worst URL
```

### Quality Options

| Flag | Purpose |
|------|---------|
| `-f bestvideo+bestaudio` | Highest quality, separate streams merged |
| `-f "bestvideo[height<=720]"` | Cap resolution at 720p |
| `-f "bestvideo[fps<=30]"` | Cap framerate at 30fps |
| `--merge-output-format mp4` | Force MP4 container output |
| `-S "res:1080,ext:mp4"` | Sort formats: prefer 1080p MP4 |

### Subtitle / Caption Extraction

```bash
# Download subtitles alongside video
yt-dlp --write-subs URL

# Download auto-generated subtitles
yt-dlp --write-auto-subs URL

# Embed subtitles into the video file
yt-dlp --embed-subs URL

# Download subtitles only (no video)
yt-dlp --skip-download --write-subs --sub-langs en URL

# All available subtitle languages
yt-dlp --list-subs URL

# Specific language
yt-dlp --write-subs --sub-langs "en,es" URL

# Convert subtitle format
yt-dlp --write-subs --convert-subs srt URL
```

### Chapter Extraction / Splitting

```bash
# Split video by chapters into separate files
yt-dlp --split-chapters -o "chapter:%(title)s - %(section_title)s.%(ext)s" URL

# Download chapter info as JSON
yt-dlp --write-info-json URL
# chapters are in the .info.json file under "chapters" key

# Filter specific chapters
yt-dlp --split-chapters --chapter-filter "Chapter 3" URL
```

### Playlist Handling

```bash
# Download entire playlist
yt-dlp -o "%(playlist_index)s - %(title)s.%(ext)s" PLAYLIST_URL

# Download specific range from playlist
yt-dlp --playlist-items 1-5 PLAYLIST_URL
yt-dlp --playlist-items 1,3,5,7 PLAYLIST_URL

# Download playlist in reverse order
yt-dlp --playlist-reverse PLAYLIST_URL

# Skip already downloaded
yt-dlp --download-archive archive.txt PLAYLIST_URL
```

### Authentication

```bash
# Cookie file (Netscape format)
yt-dlp --cookies cookies.txt URL

# Extract cookies from browser automatically
yt-dlp --cookies-from-browser firefox URL
yt-dlp --cookies-from-browser chrome URL
yt-dlp --cookies-from-browser edge URL

# Username/password (some sites)
yt-dlp -u USERNAME -p PASSWORD URL
```

### Metadata Extraction (No Download)

```bash
# Dump all metadata as JSON
yt-dlp --dump-json URL

# Print specific fields
yt-dlp --print title --print duration --print upload_date URL

# Get thumbnail
yt-dlp --write-thumbnail --skip-download URL
```

## Code Examples

### Python API — Direct Library Usage (Recommended)

```python
import yt_dlp

def download_video(url: str, output_dir: str = "./downloads") -> dict:
    """Download video with best quality and return metadata."""
    info = {}

    def progress_hook(d):
        if d['status'] == 'finished':
            info['filename'] = d['filename']
            print(f"Done downloading: {d['filename']}")

    opts = {
        'format': 'bestvideo[height<=1080]+bestaudio/best',
        'merge_output_format': 'mp4',
        'outtmpl': f'{output_dir}/%(title)s.%(ext)s',
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en'],
        'writeinfojson': True,
        'progress_hooks': [progress_hook],
        'postprocessors': [{
            'key': 'FFmpegEmbedSubtitle',
        }],
    }

    with yt_dlp.YoutubeDL(opts) as ydl:
        meta = ydl.extract_info(url, download=True)
        info['title'] = meta.get('title')
        info['duration'] = meta.get('duration')
        info['chapters'] = meta.get('chapters', [])
        info['description'] = meta.get('description')

    return info


def extract_metadata_only(url: str) -> dict:
    """Extract video metadata without downloading."""
    opts = {'quiet': True, 'no_warnings': True}

    with yt_dlp.YoutubeDL(opts) as ydl:
        meta = ydl.extract_info(url, download=False)
        return {
            'id': meta['id'],
            'title': meta['title'],
            'duration': meta['duration'],
            'chapters': meta.get('chapters', []),
            'subtitles': list(meta.get('subtitles', {}).keys()),
            'auto_captions': list(meta.get('automatic_captions', {}).keys()),
            'upload_date': meta.get('upload_date'),
            'view_count': meta.get('view_count'),
            'like_count': meta.get('like_count'),
            'channel': meta.get('channel'),
            'formats': [
                {'format_id': f['format_id'], 'ext': f['ext'],
                 'height': f.get('height'), 'fps': f.get('fps'),
                 'filesize': f.get('filesize')}
                for f in meta.get('formats', [])
                if f.get('height')
            ]
        }


def download_audio_only(url: str, output_dir: str = "./audio") -> str:
    """Extract audio as MP3."""
    opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{output_dir}/%(title)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }

    with yt_dlp.YoutubeDL(opts) as ydl:
        meta = ydl.extract_info(url, download=True)
        return f"{output_dir}/{meta['title']}.mp3"
```

### Node.js / TypeScript — Subprocess Wrapper

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface VideoMeta {
  id: string;
  title: string;
  duration: number;
  chapters: { start_time: number; end_time: number; title: string }[];
}

async function extractMetadata(url: string): Promise<VideoMeta> {
  const { stdout } = await execFileAsync('yt-dlp', [
    '--dump-json',
    '--no-download',
    url,
  ]);
  return JSON.parse(stdout);
}

async function downloadVideo(
  url: string,
  outputDir: string,
  maxHeight = 1080
): Promise<string> {
  const { stdout } = await execFileAsync('yt-dlp', [
    '-f', `bestvideo[height<=${maxHeight}]+bestaudio/best`,
    '--merge-output-format', 'mp4',
    '--write-subs',
    '--write-auto-subs',
    '--sub-langs', 'en',
    '--convert-subs', 'srt',
    '--write-info-json',
    '-o', `${outputDir}/%(id)s.%(ext)s`,
    '--print', 'after_move:filepath',
    url,
  ]);
  return stdout.trim();
}
```

## Integration Notes for Atlas UX

**How Venny/Victor would use yt-dlp:**

1. **Input Stage**: User provides a YouTube URL. Venny calls `extract_metadata_only()` to get title, duration, chapters, and available subtitle languages. This is displayed for user review before downloading.

2. **Download Stage**: Full video downloaded at 1080p with auto-captions. The `.info.json` sidecar file preserves all metadata for downstream pipeline steps.

3. **Chapter-Aware Splitting**: If the source video has chapters (common for podcasts, tutorials), Venny can use `--split-chapters` to pre-segment the video before scene detection, reducing computation.

4. **Subtitle Pipeline**: Auto-generated subtitles from YouTube are downloaded as SRT, providing an initial transcript that Whisper can refine. This saves Whisper processing time on long videos.

5. **Batch Processing**: For channel-level content repurposing, playlist download with `--download-archive` prevents re-downloading already processed videos.

6. **Storage Consideration**: For a Shorts pipeline, download at 1080p max (not 4K) to balance quality vs. storage. Shorts are displayed on mobile where 1080p is more than sufficient.


---
## Media

### Category Resources
- [Atlas UX AI Video Generation Wiki](https://atlasux.cloud/#/wiki/video-gen)
