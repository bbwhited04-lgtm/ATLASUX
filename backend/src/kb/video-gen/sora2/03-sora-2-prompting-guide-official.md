# Sora 2 Prompting Guide (Official OpenAI Cookbook)

**Source:** https://cookbook.openai.com/examples/sora/sora2_prompting_guide
**Additional Source:** https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide
**Author:** OpenAI
**Date:** 2025

## Key Takeaways

- Think of prompting like briefing a cinematographer who has never seen your storyboard
- Structure prompts around three questions: what is the shot, how is it framed, what is the visual style
- Use specific action verbs ("sprinting" not "moving")
- Shorter clips (4s) stitched together often outperform one long clip
- Dialogue must be in a separate labeled block below the visual description
- Image inputs anchor the first frame; text defines what happens next

## Content

### Core Prompting Philosophy

Think of prompting like briefing a cinematographer who has never seen your storyboard. If you leave out details, they will improvise -- and you may not get what you envisioned. By being specific about what the "shot" should achieve, you give the model more control and consistency to work with.

### The Three Fundamental Questions

Every effective prompt addresses:

1. **What is the shot?** -- The subject, action, and environment
2. **How is it framed?** -- Camera angle, movement, lens, depth of field
3. **What is the visual style?** -- Lighting, color palette, film stock, mood

### Prompt Structure

A clear prompt describes a shot as if you were sketching it onto a storyboard. State the camera framing, note depth of field, describe the action in beats, and set the lighting and palette.

**Begin with camera angle and movement.** Phrases like "a low-angle tracking shot" or "an overhead drone shot descending" establish visual perspective immediately.

### Example Prompt Structure

```
[Camera Setup] A close-up tracking shot, 85mm lens, f/2.0, shallow depth of field.

[Subject & Action] A woman in a red coat walks briskly through a rain-soaked Tokyo alley at night, her reflection rippling in the wet pavement.

[Lighting & Style] Neon signs cast pink and blue light across her face. Shot on Kodak Vision3 500T film stock. Moody, atmospheric, Wong Kar-wai inspired.

[Audio] Rain pattering on metal awnings, distant city traffic, her heels clicking on wet stone.
```

### Action Verbs Matter

Use specific action verbs:
- Instead of "moving" -> "sprinting," "strolling," "tiptoeing," "lunging"
- Instead of "looking" -> "glaring," "squinting," "gazing," "peeking"
- Instead of "talking" -> "whispering," "shouting," "murmuring," "stammering"

### Duration Best Practices

For best results, aim for concise shots. If your project allows, you may see better results by stitching together two 4-second clips in editing instead of generating a single 8-second clip.

### Using Image Inputs

For fine-grained control over composition and style, use an image input as a visual reference. You can use photos, digital artwork, or AI-generated visuals. This locks in elements like character design, wardrobe, set dressing, or overall aesthetic. The model uses the image as an anchor for the first frame, while your text prompt defines what happens next.

### Dialogue and Audio

Dialogue must be described directly in your prompt. Place it in a separate block below your prose description so the model clearly distinguishes visual description from spoken lines.

```
[Visual] Medium shot of a detective leaning against a desk in a dim office.

[Dialogue]
Detective: "You know what I think? I think you're lying."
```

**Tips for dialogue:**
- Keep lines brief and natural to match the video's length
- Label speakers consistently (e.g., "Detective:", "Suspect:")
- Long speeches are unlikely to sync well within a short clip

### Advanced Cinematic Prompts

For complex, cinematic shots, specify the look, camera setup, grading, soundscape, and even shot rationale in professional production terms:

```
[Lens] Cooke S7/i 40mm, T2.0
[Filter] Pro-Mist 1/4
[Lighting] Key: tungsten Fresnel, camera-left, 45 degrees. Fill: bounce card, camera-right. Background: practicals only (desk lamp, monitor glow).
[Grading] Teal shadows, warm highlights, 35 IRE blacks. Film emulation: Kodak 5219.
[Motion] Slow dolly push-in over 8 seconds, subtle focus pull from foreground prop to subject.
[Soundscape] Low hum of fluorescent lights, distant phone ringing, paper rustling.
```

### Workflow Best Practices

1. **Write a shot list before generating.** This forces clarity and reduces iteration waste.
2. **Small adjustments to successful prompts yield better results** than complete rewrites of failed ones.
3. **Start with sora-2 for exploration**, then switch to sora-2-pro for final renders.
4. **Use consistent style anchors** across shots for visual cohesion.


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
