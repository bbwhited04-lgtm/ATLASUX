# Guide to Prompting Wan 2.1 for Video Generation
**Source:** https://www.ambienceai.com/tutorials/wan-prompting-guide
**Additional Sources:** https://wan2-1.com/blogs/prompt-guide, https://www.mimicpc.com/learn/wan-ai-video-prompts-guide-for-text-to-video-generation, https://www.instasd.com/post/mastering-prompt-writing-for-wan-2-1-in-comfyui-a-comprehensive-guide
**Author:** Various (Ambience AI, MimicPC, InstaSD)
**Date:** 2025

## Key Takeaways
- The golden rule: be clear and sufficiently detailed about scene and action
- Optimal prompt length: 80-120 words with structured sections
- Prompt structure: Subject + Scene + Motion + Camera + Atmosphere + Style
- Always use negative prompts to suppress artifacts
- Recommended guidance scale: 5-7
- Start simple, iterate, and build complexity gradually
- Wan 2.1 is the only model that can generate readable text in videos

## Content

### Prompt Structure Formula

The most effective prompts follow this structure:

```
[Subject Description] + [Scene/Setting] + [Motion/Action] + [Camera Movement] + [Atmosphere/Lighting] + [Style/Quality]
```

### Example Prompts

**Portrait with Motion:**
```
A young woman with flowing auburn hair stands on a cliff overlooking the ocean.
The wind gently blows her hair and dress. She turns to face the camera with a
subtle smile. The camera slowly dollies in from a medium shot to a close-up.
Golden hour lighting creates warm highlights on her face and long shadows.
Cinematic quality, shallow depth of field, 4K resolution.
```

**Action Scene:**
```
A parkour athlete in dark clothing sprints across urban rooftops at sunset.
He leaps across a gap between buildings, tucks into a roll on landing, and
continues running. The camera follows in a dynamic tracking shot. Orange and
purple sky in the background, city lights beginning to glow. Dramatic lighting,
high contrast, cinematic color grading.
```

**Nature/Animals:**
```
A white ferret on a mossy log by a forest stream. It playfully leaps into
the water, creating a splash, then emerges shaking off water droplets.
Camera rushes from far to near in a low-angle shot, then zooms in for a
close-up. Birch trees and light blue sky frame the scene. Side lighting
casts dynamic shadows and warm highlights. Medium composition, front view,
low angle, with depth of field.
```

### Prompting Best Practices

**1. Be Specific About Motion:**
- Bad: "A person moving"
- Good: "A dancer performs a slow pirouette, arms extending gracefully outward"

**2. Specify Camera Work:**
- Tracking shot, dolly in/out, pan left/right, tilt up/down
- Handheld, steadicam, crane shot, aerial drone view
- Close-up, medium shot, wide establishing shot
- "Camera follows the subject", "camera slowly orbits around"

**3. Describe Lighting:**
- Time of day: golden hour, blue hour, noon, midnight
- Direction: backlit, side-lit, front-lit, rim lighting
- Quality: soft, harsh, diffused, dramatic, cinematic

**4. Include Atmosphere:**
- Weather: fog, rain, snow, dust particles
- Mood: serene, intense, mysterious, joyful
- Environment details: reflections, shadows, light rays

### Negative Prompt Template

Use this as a baseline negative prompt and adjust as needed:

```
Bright tones, overexposed, static, blurred details, subtitles, style, works,
paintings, images, static, overall gray, worst quality, low quality, JPEG
compression residue, ugly, incomplete, extra fingers, poorly drawn hands,
poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers,
still picture, messy background, three legs, many people in the background,
walking backwards
```

### Technical Parameters

| Parameter | Recommended | Notes |
|-----------|------------|-------|
| Guidance Scale | 5-7 | Higher = more prompt adherence, less creativity |
| Steps | 20-30 | More steps = better quality, slower |
| Resolution | 480P or 720P | 480P for speed, 720P for quality |
| Frames | 81 | ~5 seconds at 16fps |
| Prompt Length | 80-120 words | Sweet spot for detail vs. coherence |

### Tips for Specific Content Types

**Text in Videos:**
Wan 2.1 can generate readable text. Include the exact text in quotes:
```
A neon sign reading "OPEN 24/7" flickering in a rainy city street at night
```

**Camera Movements (ComfyUI-specific):**
- "smooth pan right" - horizontal camera movement
- "slow zoom in" - gradual focus on subject
- "camera orbits around the subject" - 360-degree view
- "static shot" - locked-off camera (reduces artifacts)

### Iteration Strategy

1. Start with a simple 1-2 sentence prompt
2. Generate and evaluate the result
3. Add details about what was missing or wrong
4. Use negative prompts to suppress recurring artifacts
5. Adjust guidance scale if results are too generic (increase) or too chaotic (decrease)
6. Plan longer narratives as multiple short clips (bite-sized scenes)


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
