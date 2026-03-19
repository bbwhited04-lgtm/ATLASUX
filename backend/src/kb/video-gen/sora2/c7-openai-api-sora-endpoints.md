# OpenAI Sora Video Generation API — Context7 Library Reference
**Source:** Context7 `/websites/developers_openai_api`
**Date Retrieved:** 2026-03-18

## Key Takeaways
- Video generation is **asynchronous**: create job, poll status, download MP4
- Three endpoints: `POST /videos`, `GET /videos/{video_id}`, `GET /videos/{video_id}/content`
- Model: `sora-2-pro`
- Supports text-to-video and image-to-video (input reference image becomes first frame)
- Input image must match the requested `size` parameter
- Accepted image formats: `image/jpeg`, `image/png`, `image/webp`
- Job statuses: `queued` -> `in_progress` -> `completed` | `failed`
- Download URLs valid for max 1 hour after generation
- Content variants: `video` (MP4, default), `thumbnail`, `spritesheet`
- Authentication: Bearer token via `Authorization` header

## Content

### Workflow Overview

Generating a video is an **asynchronous** process:

1. Call `POST /videos` -- the API returns a job object with a job `id` and an initial `status`.
2. Poll `GET /videos/{video_id}` until the status transitions to `completed`, or use webhooks for automatic notification.
3. Once the job reaches `completed`, fetch the final MP4 file with `GET /videos/{video_id}/content`.

---

### POST /videos

Create a new video generation job. You can optionally provide an input image to guide the generation process, which will serve as the first frame of the video.

**Method:** POST
**Endpoint:** `/v1/videos`

#### Parameters (Request Body - multipart/form-data)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | A text description of the desired video |
| `model` | string | Yes | The video generation model to use (e.g., `sora-2-pro`) |
| `size` | string | Yes | The resolution of the video (e.g., `1280x720`). Must match input reference image resolution if provided |
| `seconds` | string | Yes | The duration of the video in seconds |
| `input_reference` | file | No | An image file (`image/jpeg`, `image/png`, `image/webp`) used as the first frame. Must match the `size` parameter |

#### Request Example (with input reference)

```shell
curl -X POST "https://api.openai.com/v1/videos" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F prompt="She turns around and smiles, then slowly walks out of the frame." \
  -F model="sora-2-pro" \
  -F size="1280x720" \
  -F seconds="8" \
  -F input_reference="@sample_720p.jpeg;type=image/jpeg"
```

---

### GET /videos/{video_id}

Poll the status endpoint to check the progress and state of a video generation job.

**Method:** GET
**Endpoint:** `/v1/videos/{video_id}`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `video_id` | string (path) | Yes | The unique identifier of the video job |

#### Response (200)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | The unique identifier of the video job |
| `object` | string | The type of object (`video`) |
| `created_at` | integer | Timestamp of when the job was created |
| `status` | string | Current status: `queued`, `in_progress`, `completed`, `failed` |
| `model` | string | The model used for generation |
| `progress` | integer | Progress percentage of the job (if available) |
| `seconds` | string | Duration of the generated video in seconds |
| `size` | string | Resolution of the generated video (e.g., `1280x720`) |

#### Response Example

```json
{
  "id": "video_68d7512d07848190b3e45da0ecbebcde004da08e1e0678d5",
  "object": "video",
  "created_at": 1758941485,
  "status": "in_progress",
  "model": "sora-2-pro",
  "progress": 33,
  "seconds": "8",
  "size": "1280x720"
}
```

---

### GET /videos/{video_id}/content

Download the generated video file (MP4), thumbnail, or spritesheet once the job status is `completed`.

**Method:** GET
**Endpoint:** `/v1/videos/{video_id}/content`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `video_id` | string (path) | Yes | The unique identifier of the completed video job |
| `variant` | string (query) | No | Asset to download: `video` (default, MP4), `thumbnail`, `spritesheet` |

**Important:** Download URLs are valid for a maximum of **1 hour** after generation.

#### Request Examples

```shell
# Download MP4 video
curl -L "https://api.openai.com/v1/videos/video_abc123/content" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  --output video.mp4

# Download thumbnail
curl -L "https://api.openai.com/v1/videos/video_abc123/content?variant=thumbnail" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  --output thumbnail.webp

# Download spritesheet
curl -L "https://api.openai.com/v1/videos/video_abc123/content?variant=spritesheet" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  --output spritesheet.jpg
```

#### Response (200)

Streams binary video data or image data for the requested variant.


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
- [Sora 2 vs Kling vs Veo 3 - AI Video Comparison](https://www.youtube.com/results?search_query=sora+2+vs+kling+vs+veo+3+comparison) — *Credit: AI Reviews on YouTube* `review`

> *All video content is credited to original creators. Links direct to source platforms.*
