# Wan 2.5 Preview: Next-Level AI Video with Native Audio
**Source:** https://www.vadoo.tv/wan-2-5-ai-video-generator
**Additional Sources:** https://docs.aimlapi.com/api-references/video-models/alibaba-cloud/wan-2.5-preview-text-to-video, https://wan25-ai.com/, https://kie.ai/wan-2-5
**Author:** Various (Vadoo.tv, AI/ML API, Kie.ai)
**Date:** 2025-2026

## Key Takeaways
- Wan 2.5 is a major leap: native audio-visual synchronization (dialogue, SFX, music)
- Generates up to 1080P video at 24fps with lip-synced speech from text prompts
- Supports text-to-video (wan2.5-t2v-preview) and image-to-video (wan2.5-i2v-preview)
- Multiple aspect ratios: 16:9, 9:16, 1:1 for T2V
- Available through API platforms: Fal.ai, Wavespeed, AI/ML API, Kie.ai
- Represents the evolution from pure visual generation to full audiovisual production

## Content

### What's New in Wan 2.5 vs Previous Versions

| Feature | Wan 2.1 | Wan 2.2 | Wan 2.5 |
|---------|---------|---------|---------|
| Max Resolution | 720P | 720P | 1080P |
| Frame Rate | 16fps | 24fps | 24fps |
| Audio | None | None | Native (speech, SFX, music) |
| Lip Sync | No | No | Yes |
| Aspect Ratios | Fixed | Fixed | 16:9, 9:16, 1:1 |
| Architecture | DiT | MoE DiT | Enhanced |

### Native Audio Capabilities

Wan 2.5's biggest innovation is seamless audio-visual integration:

**Dialogue Generation:**
- Provide dialogue text directly in the prompt parameter
- Model generates matching lip-synced speech for characters
- Natural voice synthesis aligned with character appearance

**Sound Effects:**
- Automatically generates ambient sound matching the scene
- Footsteps, wind, water, machinery, etc. contextually appropriate
- Spatial audio awareness (near/far sounds)

**Background Music:**
- AI-composed music matching the mood and pace of the video
- Genre-appropriate scoring
- Smooth transitions and appropriate dynamics

### API Integration

**Text-to-Video:**
```
Model ID: wan2.5-t2v-preview
Resolutions: 720p, 1080p
Aspect Ratios: 16:9, 9:16, 1:1
```

**Image-to-Video:**
```
Model ID: wan2.5-i2v-preview
Resolutions: 720p, 1080p
Input: Reference image + text prompt
```

### Available Platforms
- **Fal.ai**: Direct API access
- **Wavespeed**: Optimized inference
- **AI/ML API**: Standard REST API
- **Kie.ai**: Affordable API access
- **VideoMaker.me**: Free tier available

### Use Cases
- **Marketing Videos**: Product demos with voiceover, no separate audio production needed
- **Social Media Content**: Vertical (9:16) videos with music for TikTok/Reels/Shorts
- **E-Learning**: Animated explainers with synchronized narration
- **Prototyping**: Quick concept videos with full audio for client presentations
- **Character Animation**: Talking-head videos with lip sync

### Wan 2.6 (Latest)
As of early 2026, Wan 2.6 is also emerging with further improvements in video quality and generation speed. The rapid iteration pace (2.1 -> 2.2 -> 2.5 -> 2.6) demonstrates Alibaba's aggressive development cadence.

### Production Considerations
- Wan 2.5 is currently "preview" status -- expect API changes
- Audio quality is good but not studio-grade; may need post-processing
- 1080P generation is significantly slower than 720P
- Cost varies by platform; compare pricing across Fal.ai, Wavespeed, and Kie.ai
- For highest quality, use detailed prompts describing both visuals AND desired audio


---
## Media

> **Tags:** `wan` · `wan-2.1` · `alibaba` · `ai-video` · `open-source` · `vace` · `self-hosted` · `14b`

### Official Resources
- [Official Documentation](https://github.com/Wan-Video/Wan2.1)
- [Gallery / Showcase](https://wan-video.github.io)
- [Wan 2.1 GitHub Repository](https://github.com/Wan-Video/Wan2.1)
- [Wan Video Project Page](https://wan-video.github.io)
- [Wan on Hugging Face](https://huggingface.co/Wan-AI)

### Video Tutorials
- [Wan 2.1 Video Generation - Self-Hosted Tutorial](https://www.youtube.com/results?search_query=wan+2.1+video+generation+self+hosted+tutorial) — *Credit: AI Self-Hosted on YouTube* `tutorial`
- [Wan VACE - Video Editing with AI](https://www.youtube.com/results?search_query=wan+vace+video+editing+ai+tutorial) — *Credit: AI Video on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
