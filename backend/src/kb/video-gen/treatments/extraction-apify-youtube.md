# Apify YouTube Scrapers

**Sources:**
- https://apify.com/streamers/youtube-scraper
- https://apify.com/starvibe/youtube-video-transcript
- https://apify.com/visita/youtube-scraper
- https://apify.com/pintostudio/youtube-transcript-scraper
- https://apify.com/scrape-creators/best-youtube-transcripts-scraper
- https://apify.com/runtime/youtube-channel-scraper
- https://apify.com/transcriptdl/transcript-downloader-youtube-transcript-and-metadata-scraper
- https://apify.com/streamers/youtube-comments-scraper
- https://apify.com/apidojo/youtube-scraper

**Date:** 2026-03-18

## Key Takeaways

- Apify hosts dozens of community-built YouTube scraper "Actors" — no YouTube Data API key required
- Key data types: transcripts (with timestamps), metadata, comments, chapter markers
- Transcripts support multiple languages with automatic fallback logic
- Pay-per-result pricing is available ($0.30-$0.50 per 1000 results)
- Integrates via REST API, Node.js SDK, or Python SDK
- Residential proxies (included in paid plans) recommended for reliable scraping
- Free tier provides $5/month in credits (~10,000 results)

## Installation / Setup

```bash
# Node.js SDK
npm install apify-client

# Python SDK
pip install apify-client
```

Sign up at https://apify.com and get an API token from Settings > Integrations.

## Core Capabilities

### Available Actors by Use Case

#### Transcript Extraction

| Actor | ID | Features | Pricing |
|-------|-----|----------|---------|
| YouTube Video Transcript | `starvibe/youtube-video-transcript` | Single/batch video transcripts, timestamps, multi-language | Per compute |
| YouTube Transcript Scraper | `pintostudio/youtube-transcript-scraper` | High concurrency, fallback logic, channel-level | Per compute |
| Best YouTube Transcripts | `scrape-creators/best-youtube-transcripts-scraper` | Multi-language, auto-fallback | Per compute |
| Transcript & Metadata Extractor | `transcriptdl/transcript-downloader-youtube-transcript-and-metadata-scraper` | Combined transcript + full metadata | Per compute |
| YouTube Transcript Ninja | `topaz_sharingan/youtube-transcript-scraper-1` | Fast, simple transcript extraction | Per compute |

#### Full Video Metadata

| Actor | ID | Features | Pricing |
|-------|-----|----------|---------|
| YouTube Scraper | `streamers/youtube-scraper` | Search results, video details, related videos | Per compute |
| YouTube Scraper (Pay Per Result) | `apidojo/youtube-scraper` | $0.50/1000 results, search + video data | Per result |
| YouTube Metadata Scraper | `toludare/youtube-metadata-scraper-all` | Full metadata including transcripts | Per compute |

#### Comments

| Actor | ID | Features | Pricing |
|-------|-----|----------|---------|
| YouTube Comments Scraper | `streamers/youtube-comments-scraper` | Top + nested comments, author info | Per compute |
| YouTube Comment Scraper (Pay Per Result) | `apidojo/youtube-comments-scraper` | $0.30-0.50/1000 comments | Per result |
| YouTube Comment Scraper | `supreme_coder/youtube-comment-scraper` | Simple comment extraction | Per compute |

#### Channel-Level

| Actor | ID | Features | Pricing |
|-------|-----|----------|---------|
| Fast YouTube Channel Scraper | `streamers/youtube-channel-scraper` | All videos from a channel, transcripts, comments | Per compute |

### Combined Scraper (Transcript + Comments + Metadata)

The `visita/youtube-scraper` actor extracts all three in one run:
- Full transcripts with timestamps
- First page of comments
- Key metadata (title, channel, views, likes, description)
- Supports search queries or specific video IDs

### Data Output Formats

All actors export in multiple formats:
- JSON (recommended for pipeline integration)
- CSV
- Excel
- HTML
- Direct API access via dataset endpoint

## Code Examples

### Node.js / TypeScript — Transcript Extraction

```typescript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

interface TranscriptSegment {
  text: string;
  start: number;   // seconds
  duration: number; // seconds
}

interface VideoTranscript {
  videoId: string;
  title: string;
  transcript: TranscriptSegment[];
  language: string;
}

async function extractTranscript(videoUrl: string): Promise<VideoTranscript> {
  const run = await client.actor('starvibe/youtube-video-transcript').call({
    urls: [videoUrl],
    language: 'en',
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const item = items[0] as any;

  return {
    videoId: item.videoId,
    title: item.title,
    transcript: item.transcript.map((seg: any) => ({
      text: seg.text,
      start: seg.start,
      duration: seg.duration,
    })),
    language: item.language || 'en',
  };
}

async function extractMetadataAndComments(videoUrl: string) {
  const run = await client.actor('visita/youtube-scraper').call({
    videoUrls: [videoUrl],
    scrapeComments: true,
    maxComments: 100,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items[0];
}
```

### Node.js — Channel Scraping (Batch)

```typescript
async function scrapeChannel(channelUrl: string, maxVideos = 50) {
  const run = await client.actor('streamers/youtube-channel-scraper').call({
    channelUrls: [channelUrl],
    maxResults: maxVideos,
    includeTranscripts: true,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  return items.map((item: any) => ({
    videoId: item.id,
    title: item.title,
    duration: item.duration,
    viewCount: item.viewCount,
    publishedAt: item.publishedAt,
    chapters: item.chapters || [],
    transcript: item.transcript || [],
  }));
}
```

### Python SDK

```python
from apify_client import ApifyClient

client = ApifyClient(token="YOUR_TOKEN")

def get_transcript(video_url: str) -> dict:
    run = client.actor("starvibe/youtube-video-transcript").call(
        run_input={"urls": [video_url], "language": "en"}
    )
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    return items[0] if items else None

def get_video_with_comments(video_url: str) -> dict:
    run = client.actor("visita/youtube-scraper").call(
        run_input={
            "videoUrls": [video_url],
            "scrapeComments": True,
            "maxComments": 200,
        }
    )
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    return items[0] if items else None
```

### Webhook Integration

```typescript
// Apify supports webhooks for async processing
async function startAsyncScrape(videoUrl: string, callbackUrl: string) {
  const run = await client.actor('starvibe/youtube-video-transcript').start({
    urls: [videoUrl],
  }, {
    webhooks: [{
      eventTypes: ['ACTOR.RUN.SUCCEEDED'],
      requestUrl: callbackUrl,
    }],
  });

  return run.id; // Track the run ID
}

// In your webhook handler (Fastify route):
// POST /v1/apify/webhook
// Body contains { resource: { defaultDatasetId: "..." } }
```

## Integration Notes for Atlas UX

**How Venny/Victor would use Apify:**

1. **Transcript Pre-Fetch**: Before downloading a video, use Apify to grab the YouTube transcript. This is faster than running Whisper on the full audio and provides timestamps for initial clip identification.

2. **Metadata Enrichment**: Pull view counts, like counts, comments, and chapter data to inform the AI about which parts of a video already resonate with audiences.

3. **Comment Analysis for Viral Signals**: Scrape comments to identify which moments viewers reference most. Comments like "the part at 3:45 was hilarious" are direct signals for clip-worthy moments.

4. **Chapter-Based Pre-Segmentation**: If the source video has YouTube chapters, those chapter boundaries are natural segment candidates. Apify extracts these without needing to download the video.

5. **Cost Efficiency**: Apify transcript extraction costs fractions of a cent per video. Use it as the first pipeline step to decide IF a video is worth the full download + Whisper + scene detection treatment.

6. **Fallback Strategy**: YouTube auto-captions are available for most videos. If Apify transcript extraction fails (no captions available), fall back to yt-dlp download + Whisper transcription.

7. **Rate Limiting**: Apify handles proxy rotation internally. For high-volume scraping (100+ videos/day), use the pay-per-result actors to avoid compute surprises.


---
## Media

### Category Resources
- [Atlas UX AI Video Generation Wiki](https://atlasux.cloud/#/wiki/video-gen)
