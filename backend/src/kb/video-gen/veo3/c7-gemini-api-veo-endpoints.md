# Gemini API Veo 3.1 Video Generation — Context7 Library Reference
**Source:** Context7 `/websites/ai_google_dev_gemini-api`
**Date Retrieved:** 2026-03-18

## Key Takeaways
- Model identifier: `veo-3.1-generate-preview`
- Supports text-to-video generation with native audio/dialogue in prompts
- Resolutions: `720p` (default), `1080p`, `4k` (higher = more latency and cost)
- Aspect ratios: `16:9` (landscape, default), `9:16` (portrait/vertical)
- Video extension is limited to 720p resolution only
- Asynchronous long-running operation: poll every ~10 seconds until `done: true`
- Authentication: Google API key via `x-goog-api-key` query parameter
- Python SDK: `google-genai` package with `client.models.generate_videos()`
- REST endpoint: `POST /models/veo-3.1-generate-preview:predictLongRunning`
- Generated videos retrieved via `client.files.download()` or from `response.generatedVideos[].video.videoBytes`

## Content

### REST API Endpoint

#### POST /models/veo-3.1-generate-preview:generateVideos

Generates videos using the Veo 3.1 model based on a text prompt. This is a long-running operation that requires polling for completion.

**Method:** POST
**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning`

#### Authentication

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `x-goog-api-key` | string (query) | Yes | Your Google Generative AI API key |

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instances[].prompt` | string | Yes | Text description of the video to generate |
| `parameters.resolution` | string | No | Video resolution: `720p`, `1080p`, or `4k`. Default: `720p` |
| `parameters.aspect_ratio` | string | No | Video aspect ratio: `16:9` (default) or `9:16` |

#### Request Example (REST)

```json
{
  "instances": [{
    "prompt": "A stunning drone view of the Grand Canyon during a flamboyant sunset that highlights the canyon's colors. The drone slowly flies towards the sun then accelerates, dives and flies inside the canyon."
  }],
  "parameters": {
    "resolution": "4k"
  }
}
```

#### Response

```json
{
  "name": "operations/abc123def456",
  "done": false,
  "response": {
    "generatedVideos": [{
      "video": {
        "videoBytes": "[binary video data]"
      }
    }]
  }
}
```

**Notes:**
- Higher resolutions (1080p, 4k) result in increased latency and higher costs
- Video extension is limited to 720p resolution
- Poll the operation status every 10 seconds until `done` is `true`

---

### Aspect Ratio Control

Veo 3.1 supports two aspect ratios:

| Aspect Ratio | Orientation | Use Case |
|--------------|-------------|----------|
| `16:9` | Landscape/widescreen | Default, standard horizontal video |
| `9:16` | Portrait/vertical | Mobile-first, social media stories/reels |

#### Example with Dialogue (Portrait)

```json
{
  "instances": [{
    "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'",
    "aspect_ratio": "9:16"
  }]
}
```

---

### Python SDK Usage

#### Basic Text-to-Video with Aspect Ratio

```python
import time
from google import genai
from google.genai import types

client = genai.Client()

prompt = """A montage of pizza making: a chef tossing and flattening the floury dough,
ladling rich red tomato sauce in a spiral, sprinkling mozzarella cheese and pepperoni,
and a final shot of the bubbling golden-brown pizza, upbeat electronic music with a
rhythmical beat is playing, high energy professional video."""

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    config=types.GenerateVideosConfig(
      aspect_ratio="9:16",
    ),
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

# Download the generated video.
generated_video = operation.response.generated_videos[0]
client.files.download(file=generated_video.video)
generated_video.video.save("pizza_making.mp4")
print("Generated video saved to pizza_making.mp4")
```

#### With Custom Resolution (4K)

```python
import time
from google import genai
from google.genai import types

client = genai.Client()

prompt = """A stunning drone view of the Grand Canyon during a flamboyant sunset
that highlights the canyon's colors. The drone slowly flies towards the sun then
accelerates, dives and flies inside the canyon."""

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    config=types.GenerateVideosConfig(
      resolution="4k",
    ),
)

# Poll until done
while not operation.done:
    time.sleep(10)
    operation = client.operations.get(operation)

generated_video = operation.response.generated_videos[0]
client.files.download(file=generated_video.video)
generated_video.video.save("grand_canyon_4k.mp4")
```

#### Key SDK Classes

| Class | Description |
|-------|-------------|
| `genai.Client` | Main API client for Gemini services |
| `types.GenerateVideosConfig` | Configuration object (aspect_ratio, resolution) |
| `GenerateVideosOperation` | Represents a long-running video generation operation |

#### Dependencies

- `google-genai` Python package
- Python 3.7 or higher


---
## Media

> **Tags:** `veo` · `veo-3` · `google` · `deepmind` · `ai-video` · `vertex-ai` · `text-to-video` · `4k`

### Official Resources
- [Official Documentation](https://deepmind.google/technologies/veo/)
- [Gallery / Showcase](https://deepmind.google/technologies/veo/)
- [Google DeepMind - Veo](https://deepmind.google/technologies/veo/)
- [Veo on Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview)
- [Google AI Studio](https://aistudio.google.com)

### Video Tutorials
- [Google Veo 3 - AI Video Generation Tutorial](https://www.youtube.com/results?search_query=google+veo+3+ai+video+generation+tutorial) — *Credit: Google on YouTube* `tutorial`
- [Veo 3 vs Sora 2 - Which AI Video Generator is Better?](https://www.youtube.com/results?search_query=veo+3+vs+sora+2+comparison+review) — *Credit: AI Reviews on YouTube* `review`

> *All video content is credited to original creators. Links direct to source platforms.*
