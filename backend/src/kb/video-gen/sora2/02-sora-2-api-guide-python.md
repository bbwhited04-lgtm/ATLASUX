# Sora 2 API with Python: Complete Developer Guide

**Source:** https://www.datacamp.com/tutorial/sora-2-api-guide
**Additional Sources:** https://platform.openai.com/docs/guides/video-generation, https://developers.openai.com/api/docs/models/sora-2
**Author:** DataCamp / OpenAI
**Date:** 2025

## Key Takeaways

- Sora 2 API uses per-second billing (not tokens like GPT models)
- Two model variants available via API: `sora-2` and `sora-2-pro`
- Supports text-to-video and image-to-video generation
- Asynchronous generation -- submit a job, poll for completion, then download
- Batch API available for larger production workflows

## Content

### API Access

The Sora 2 API is accessed through OpenAI's standard API platform. API access requires an OpenAI developer account with appropriate permissions. The API operates on a straightforward per-second billing model.

### Model Selection

```python
# Standard model -- fast iteration
model = "sora-2"

# Pro model -- cinematic quality
model = "sora-2-pro"
```

### Basic Text-to-Video Generation

```python
from openai import OpenAI

client = OpenAI()

# Submit a video generation request
response = client.videos.generate(
    model="sora-2",
    prompt="A golden retriever running through a sunlit meadow, shot on 35mm film with shallow depth of field",
    duration=8,           # seconds (4, 8, or 12 for sora-2)
    resolution="720p"     # 720p or 1080p
)

# The response contains a generation ID
generation_id = response.id
```

### Polling for Completion

```python
import time

# Poll until the video is ready
while True:
    status = client.videos.retrieve(generation_id)
    if status.status == "completed":
        video_url = status.video_url
        break
    elif status.status == "failed":
        raise Exception(f"Generation failed: {status.error}")
    time.sleep(5)

# Download the video
import requests
video_data = requests.get(video_url).content
with open("output.mp4", "wb") as f:
    f.write(video_data)
```

### Image-to-Video Generation

```python
response = client.videos.generate(
    model="sora-2",
    prompt="The camera slowly pulls back as the person in the image turns and smiles",
    image_url="https://example.com/reference-image.jpg",
    duration=8,
    resolution="720p"
)
```

### Batch API for Production Workflows

Use the Batch API to run asynchronous video generation jobs for larger production workflows. This is more cost-effective for bulk video generation.

### Duration Options

| Model | Supported Durations |
|-------|-------------------|
| sora-2 | 4s, 8s, 12s |
| sora-2-pro | 10s, 15s, 25s |

### Resolution Options

| Model | Supported Resolutions |
|-------|---------------------|
| sora-2 | 720p (1280x720), 1080p (1920x1080) |
| sora-2-pro | 720p, 1080p, 1792x1024, 1024x1792 |

### Rate Limits and Quotas

API rate limits vary by account tier. Video generation is compute-intensive, so expect lower throughput compared to text APIs. Use the Batch API for high-volume workloads.

### Error Handling Best Practices

- Always implement polling with exponential backoff
- Handle `failed` status gracefully with retry logic
- Set reasonable timeouts (Pro videos can take several minutes)
- Monitor your usage to stay within budget


---
## Media

> **Tags:** `sora` · `sora-2` · `openai` · `ai-video` · `text-to-video` · `video-generation` · `1080p`

### Platform
![sora2 logo](https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg)
*Source: Official sora2 branding — [sora2](https://openai.com/sora)*

### Official Resources
- [Official Documentation](https://openai.com/sora)
- [Gallery / Showcase](https://openai.com/index/sora/)
- [OpenAI Sora](https://openai.com/sora)
- [Sora Research Paper](https://openai.com/index/sora/)
- [Sora 2 Guide - Tutorials & Prompts](https://sora2.ink/)

### Video Tutorials
- [OpenAI Sora 2 Complete Guide - Features & How to Use](https://www.youtube.com/results?search_query=openai+sora+2+complete+guide+tutorial+2026) — *Credit: OpenAI on YouTube* `tutorial`
- [Sora 2 Prompting Masterclass - Create Stunning AI Videos](https://www.youtube.com/results?search_query=sora+2+prompting+masterclass+ai+video) — *Credit: AI Video on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
