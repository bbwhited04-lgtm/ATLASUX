# Generate Videos with Veo 3.1 in Gemini API

**Source:** https://ai.google.dev/gemini-api/docs/video
**Author:** Google AI for Developers
**Date:** 2025 (updated through 2026)

## Key Takeaways

- Veo 3.1 generates 8-second videos at 720p, 1080p, or 4K resolution with native audio
- Available via Gemini API using model name `veo-3.1-generate-preview`
- Supports text-to-video and image-to-video generation
- Videos are generated asynchronously -- you poll for completion
- Pricing: $0.15/second (Fast) and $0.40/second (Standard)

## Content

### Model Names

- `veo-3.1-generate-preview` -- flagship model, highest quality
- `veo-3-generate-preview` -- previous generation
- `veo-3-fast-generate-preview` -- speed-optimized, lower cost

### API Parameters

| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| `resolution` | string | `"720p"` | `"720p"`, `"1080p"`, `"4k"` |
| `aspectRatio` | string | `"16:9"` | `"16:9"`, `"9:16"` |
| `duration` | string | `"8s"` | `"4s"`, `"6s"`, `"8s"` |
| `negativePrompt` | string | none | Describe what to exclude |
| `personGeneration` | string | varies | `"allow_adult"` |
| `sampleCount` | integer | 1 | 1-4 |
| `seed` | uint32 | random | For deterministic output |

### Python SDK Example

```python
import google.generativeai as genai
import time

client = genai.Client(api_key="YOUR_API_KEY")

# Start video generation
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="A cinematic drone shot over a misty mountain valley at sunrise",
    config=genai.types.GenerateVideoConfig(
        resolution="1080p",
        aspect_ratio="16:9",
        duration="8s",
        negative_prompt="blur, distortion, text overlay",
        person_generation="allow_adult",
        number_of_videos=1,
    ),
)

# Poll for completion
while not operation.done:
    time.sleep(20)
    operation = client.operations.get(operation)

# Download generated video
for video in operation.result.generated_videos:
    client.files.download(file=video.video)
    video.video.save("output.mp4")
```

### JavaScript/REST Example

```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("YOUR_API_KEY");

const response = await genAI.models.generateVideos({
  model: "veo-3.1-generate-preview",
  prompt: "A slow dolly shot through a neon-lit Tokyo alley at night",
  config: {
    resolution: "1080p",
    aspectRatio: "16:9",
    duration: "8s",
    negativePrompt: "blur, text, watermark",
    numberOfVideos: 1,
  },
});
```

### Image-to-Video

Provide an image alongside your text prompt to use it as the first frame:

```python
image = genai.types.Image.from_file("first_frame.png")

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="The camera slowly pushes forward as the scene comes to life",
    image=image,
    config=genai.types.GenerateVideoConfig(
        resolution="1080p",
        aspect_ratio="16:9",
    ),
)
```

### Polling Pattern

Video generation is asynchronous. After starting generation, poll the operation:

1. Call `generate_videos()` to get an operation object
2. Poll with `operations.get(operation)` every 10-20 seconds
3. Check `operation.done` for completion
4. Access results via `operation.result.generated_videos`
5. Each video has a `.video` object you can save to disk

### Pricing (Gemini API)

| Model | Cost per second |
|-------|----------------|
| Veo 3.1 Standard | $0.40/sec |
| Veo 3 Standard | $0.40/sec |
| Veo 3 Fast | $0.15/sec |

An 8-second video costs $3.20 (Standard) or $1.20 (Fast).

### Access Requirements

- Requires a paid-tier Gemini API key
- Available in paid preview
- Also accessible via Vertex AI for enterprise use
- Google AI Studio provides an interactive playground


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
