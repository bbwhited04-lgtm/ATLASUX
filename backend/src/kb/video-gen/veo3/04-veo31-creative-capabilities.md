# Introducing Veo 3.1 and New Creative Capabilities in the Gemini API

**Source:** https://developers.googleblog.com/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/
**Author:** Google Developers Blog
**Date:** October 2025 (with January 2026 4K update)

## Key Takeaways

- Veo 3.1 is Google's most advanced video generation model
- Supports 4K resolution (3840x2160) -- first mainstream AI video model to do so
- Three new creative features: Ingredients to Video, Frames to Video, Scene Extension
- Native audio generation with dialogue synced under 120ms accuracy
- Available via Gemini API, Vertex AI, Gemini App, and Google Flow

## Content

### What's New in Veo 3.1

Veo 3.1 builds on Veo 3 with several major improvements:

1. **4K Resolution Output** -- 3840x2160 pixels for professional-grade video
2. **Native Vertical Video** -- 9:16 aspect ratio for YouTube Shorts, TikTok, Reels
3. **Enhanced Consistency** -- Better character and scene consistency across clips
4. **Richer Native Audio** -- Improved dialogue, ambient sound, and music generation
5. **Better Prompt Adherence** -- More accurate interpretation of detailed prompts

### Ingredients to Video

Guide video generation using reference images:

- Upload up to 3 reference images of a character, object, or scene
- Veo preserves the subject's appearance throughout the video
- Use cases: product demos, character consistency in narratives, style guides
- Images should clearly show the subject you want preserved

### Frames to Video (First + Last Frame)

Control the start and end points of your video:

- Provide a starting image and an ending image
- Veo generates the smooth transition between them
- Gives precise control over shot composition
- Great for before/after reveals, product transforms, scene transitions

### Scene Extension (Extend Video)

Create longer content by chaining clips:

- Each new clip is generated based on the final second of the previous clip
- Maintains visual continuity across extensions
- Enables multi-shot sequences and longer narratives
- Each extension generates another 8-second clip

### Native Audio Generation

Veo 3.1's joint diffusion process generates audio and video together:

- **Dialogue** -- Lip-synced speech with under 120ms accuracy
- **Sound Effects** -- Footsteps, doors, impacts match visual actions
- **Ambient Sound** -- Environmental audio (wind, rain, crowd noise)
- **Background Music** -- Mood-appropriate musical scores
- Audio and video are processed together, not layered after the fact

### Availability and Platforms

| Platform | Use Case |
|----------|----------|
| Gemini App | Consumer use, quick generation |
| Google Flow | Advanced filmmaking with multi-shot editing |
| Gemini API | Developer integration, programmatic access |
| Vertex AI | Enterprise deployment with SLAs |
| Third-party (Freepik, Leonardo, etc.) | Integrated into existing creative tools |

### Pricing Tiers

| Model | Speed | Cost/Second | 8s Video Cost |
|-------|-------|-------------|---------------|
| Veo 3.1 Standard | ~2-3 min | $0.40 | $3.20 |
| Veo 3 Standard | ~2-3 min | $0.40 | $3.20 |
| Veo 3 Fast | ~30-60 sec | $0.15 | $1.20 |

### Technical Specifications

- **Max Resolution:** 4K (3840x2160)
- **Aspect Ratios:** 16:9 (landscape), 9:16 (portrait/vertical)
- **Duration Options:** 4s, 6s, 8s
- **Audio:** Native generation via joint diffusion
- **Output Format:** MP4
- **Concurrent Generations:** Up to 4 per request (sampleCount)


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
