# Veo 3 and Veo 3 Fast: Pricing, Configurations, and Resolution

**Source:** https://developers.googleblog.com/veo-3-and-veo-3-fast-new-pricing-new-configurations-and-better-resolution/
**Author:** Google Developers Blog
**Date:** 2025-2026

## Key Takeaways

- Veo 3 Fast is the speed-optimized model at 60% lower cost
- 1080p HD output now available for both Veo 3 and Veo 3 Fast
- Veo 3.1 added 4K support (3840x2160)
- Vertical video (9:16) natively supported for mobile content
- Duration options: 4s, 6s, 8s with 8s as default
- Seed parameter enables deterministic/reproducible generation

## Content

### Model Comparison

| Feature | Veo 3 Standard | Veo 3 Fast | Veo 3.1 |
|---------|---------------|------------|---------|
| Model ID | `veo-3-generate-preview` | `veo-3-fast-generate-preview` | `veo-3.1-generate-preview` |
| Cost/Second | $0.40 | $0.15 | $0.40 |
| 8s Video Cost | $3.20 | $1.20 | $3.20 |
| Max Resolution | 1080p | 1080p | 4K |
| Generation Time | ~2-3 min | ~30-60 sec | ~2-3 min |
| Audio Quality | High | Good | Highest |
| Best For | Production quality | Rapid iteration, drafts | Final deliverables |

### Resolution Options

```json
{
  "resolution": "720p"   // Default, fastest generation
  "resolution": "1080p"  // HD, good for most uses
  "resolution": "4k"     // Veo 3.1 only, professional grade
}
```

### Aspect Ratio Configuration

```json
{
  "aspectRatio": "16:9"  // Landscape (default)
  "aspectRatio": "9:16"  // Portrait/Vertical (Shorts, Reels, TikTok)
}
```

**Tip:** Upload a vertical image to automatically generate vertical video.

### Duration Settings

```json
{
  "duration": "4s"   // Quick clips, social media hooks
  "duration": "6s"   // Medium length, balanced
  "duration": "8s"   // Maximum length, most content (default)
}
```

### Full API Configuration Example

```json
{
  "model": "veo-3.1-generate-preview",
  "prompt": "Your detailed prompt here",
  "config": {
    "resolution": "1080p",
    "aspectRatio": "16:9",
    "duration": "8s",
    "negativePrompt": "blur, distortion, text, watermark",
    "personGeneration": "allow_adult",
    "numberOfVideos": 2,
    "seed": 42
  }
}
```

### Seed Parameter for Reproducibility

The `seed` parameter (uint32) enables deterministic generation:

- Same seed + same prompt + same config = same (or very similar) video
- Useful for A/B testing prompt variations while keeping other factors constant
- Change the seed to get different variations of the same prompt
- Omit seed for random generation each time

### Cost Optimization Strategies

1. **Draft with Fast, finalize with Standard/3.1** -- Use Veo 3 Fast ($1.20/clip) for prompt iteration, then generate final version with Veo 3.1 ($3.20/clip) at 4K
2. **Shorter duration for iteration** -- Use 4s clips while experimenting ($0.60 Fast vs $1.20 for 8s)
3. **720p for drafts** -- Lower resolution generates faster and is fine for reviewing composition
4. **Batch generation** -- Use sampleCount up to 4 to generate multiple variations in one request
5. **Seed pinning** -- Use seeds to compare prompt changes without wasting budget on random variation

### Vertex AI vs Gemini API

| Feature | Gemini API | Vertex AI |
|---------|-----------|-----------|
| Access | API key | Service account |
| Pricing | Per-second | Per-second (may differ) |
| SLA | Best effort | Enterprise SLA |
| Region | Global | Region-specific |
| Governance | Basic | Full IAM, audit logging |
| Best For | Startups, indie devs | Enterprise, compliance |


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
- [Veo 3 vs Sora 2 - Which AI Video Generator is Better?](https://www.youtube.com/results?search_query=veo+3+vs+sora+2+comparison+review) — *Credit: AI Reviews on YouTube* `review`
- [Google Veo 3 - AI Video Generation Tutorial](https://www.youtube.com/results?search_query=google+veo+3+ai+video+generation+tutorial) — *Credit: Google on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
