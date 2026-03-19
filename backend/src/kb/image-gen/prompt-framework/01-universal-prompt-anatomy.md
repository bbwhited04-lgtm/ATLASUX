---
title: "Universal Prompt Anatomy for AI Image Generation"
category: "image-gen"
tags: ["prompt-framework", "ai-image", "prompt-engineering", "composition", "lighting"]
---

# Universal Prompt Anatomy

Every effective image generation prompt, regardless of platform, is built from the same structural components. Mastering this anatomy lets you write prompts that work on DALL-E, Midjourney, FLUX, Stable Diffusion, Ideogram, and any future model — with only minor platform-specific adjustments.

## The Seven Components

A complete image prompt addresses up to seven components. Not every image needs all seven, but understanding each one gives you full control over the output.

```
[Subject] + [Style] + [Lighting] + [Composition] + [Mood/Atmosphere] + [Color Palette] + [Technical Specs]
```

### 1. Subject

The subject is the core of your prompt — what the image is about. Be specific. Vague subjects produce generic images.

**Weak:** "A plumber"
**Better:** "A licensed plumber in a navy blue uniform installing a tankless water heater"
**Best:** "A licensed plumber in a navy blue polo with embroidered company logo, carefully soldering a copper fitting on a Rinnai tankless water heater mounted on a utility room wall"

**Subject specificity checklist:**
- Who or what is the main subject?
- What are they doing (action/pose)?
- What are they wearing or made of (materials/textures)?
- What details distinguish this from a generic version?
- What is the setting/environment?

**Environment matters.** "A plumber" could be anywhere. "A plumber in a modern kitchen with white quartz countertops and a farmhouse sink" grounds the image in a believable context and produces more coherent results.

### 2. Style

Style tells the model what kind of image to produce. This is arguably the most impactful component after the subject.

**Photography styles:**
- "editorial photography" — magazine-quality, polished, intentional
- "product photography" — clean, focused, typically white or neutral background
- "documentary photography" — candid, authentic, slightly raw
- "real estate photography" — wide angle, well-lit interiors, vertical lines corrected
- "portrait photography" — subject-focused, shallow depth of field
- "street photography" — urban, candid, high contrast
- "macro photography" — extreme close-up, fine detail

**Illustration styles:**
- "digital illustration" — clean, modern, scalable
- "watercolor painting" — soft edges, organic feel
- "oil painting" — rich textures, traditional feel
- "vector illustration" — flat, geometric, logo-appropriate
- "technical drawing" — precise, blueprint-style
- "isometric illustration" — 3D-like diagrams from fixed angle

**Design styles:**
- "flat design" — minimal, geometric, modern UI style
- "retro/vintage" — aged textures, period-appropriate typography
- "minimalist" — maximum negative space, essential elements only
- "brutalist" — raw, bold, high contrast

**For trade businesses:** "Editorial photography" and "real estate photography" are the two most useful style descriptors. They produce professional, trustworthy-looking images that work for websites, social media, and marketing materials.

### 3. Lighting

Lighting transforms the mood and quality of an image more than almost any other factor. Models understand lighting terminology well.

**Natural lighting:**
- "golden hour lighting" — warm, soft, low-angle sun (early morning or late afternoon)
- "overcast/diffused natural light" — even, soft, no harsh shadows
- "bright midday sun" — high contrast, strong shadows
- "window light" — directional, natural, interior scenes
- "backlit/rim lighting" — subject outlined by light from behind

**Studio lighting:**
- "soft box lighting" — even, professional, minimal shadows
- "dramatic side lighting" — strong directional light, deep shadows
- "ring light" — even face illumination, circular catchlights in eyes
- "three-point lighting" — standard professional setup
- "high key lighting" — bright, minimal shadows, clean

**Atmospheric lighting:**
- "neon lighting" — colorful, urban, nighttime
- "candlelight" — warm, intimate, low light
- "fluorescent lighting" — cool, industrial, office-like
- "warm LED recessed lighting" — modern residential interior

**For trade businesses:** "Warm natural lighting" and "soft professional lighting" are the safest defaults. They make spaces look inviting and work look professional. Avoid "dramatic" or "moody" lighting for standard marketing images — it looks great in art but odd in a plumbing ad.

### 4. Composition

Composition describes how elements are arranged within the frame — where the camera is, what is in focus, and how the image is structured.

**Camera angle:**
- "eye level" — natural, relatable perspective
- "low angle" — makes subject look powerful/imposing
- "high angle / overhead" — shows layout, good for workspaces
- "bird's eye view" — directly above, top-down
- "three-quarter view" — slight angle, most versatile for products and vehicles
- "close-up" — detail-focused, fills the frame with the subject
- "wide shot / establishing shot" — shows full environment with subject in context

**Depth of field:**
- "shallow depth of field" — subject sharp, background blurred (bokeh)
- "deep depth of field / everything in focus" — sharp throughout, good for interiors
- "tilt-shift" — selective focus that makes scenes look miniature

**Framing:**
- "rule of thirds" — subject off-center for dynamic composition
- "centered composition" — subject in the middle, formal/symmetrical
- "leading lines" — architectural or environmental lines draw eye to subject
- "negative space" — lots of empty area, good for adding text later
- "framed by [element]" — subject seen through a doorway, window, or arch

**For trade businesses:** "Eye level, shallow depth of field" is the most versatile composition for marketing images. "Wide shot with deep depth of field" works best for interior/real estate style images showing completed work.

### 5. Mood and Atmosphere

Mood is the emotional tone of the image. It is subjective but models respond to mood descriptors reliably.

**Positive moods for trade businesses:**
- "warm and inviting" — residential interiors, client-facing content
- "clean and professional" — commercial work, proposals
- "bright and optimistic" — social media, seasonal promotions
- "trustworthy and reliable" — brand photography, team shots
- "calm and serene" — spa/salon, bathroom renovations

**Moods to use sparingly:**
- "dramatic" — works for portfolio highlight images, not everyday marketing
- "gritty" — can work for "before" images in before/after pairs
- "luxurious" — high-end remodel showcases only
- "urgent" — emergency service marketing only

### 6. Color Palette

Specifying colors keeps your generated images on-brand and visually consistent across a campaign.

**Methods:**
- Name specific colors: "navy blue, white, and brass accents"
- Reference color systems: "warm earth tones" or "cool blues and grays"
- Match your brand: "primary color #1A3C5E, accent color #E8A838"
- Reference seasons: "autumn palette — burnt orange, deep red, gold"
- Reference materials: "natural wood tones with white and matte black"

**For trade businesses:** Choose 2-3 colors that match your brand and include them consistently in your prompts. This creates a cohesive visual identity across all generated images without needing a designer.

### 7. Technical Specifications

Technical specs handle the practical parameters of the output.

**Resolution/quality:**
- "8K, ultra-detailed" — maximum detail (useful for print)
- "high resolution, sharp detail" — general high-quality output
- "4K" — good balance of quality and generation speed

**Camera simulation:**
- "shot on Canon EOS R5, 35mm lens" — triggers photorealistic rendering
- "shot on iPhone 15 Pro" — more casual, authentic feel
- "Hasselblad medium format" — luxury, ultra-high-detail look
- "85mm portrait lens" — natural perspective for people, slight compression

**Post-processing simulation:**
- "VSCO filter" — trendy, slightly faded film look
- "HDR" — high dynamic range, vivid but can look artificial
- "film grain" — vintage, textured feel
- "unedited, straight out of camera" — natural, documentary feel

**For trade businesses:** "Shot on a professional camera, 35mm lens, high resolution" is a solid default technical spec that produces clean, professional-looking images without over-specifying.

## Putting It All Together

### Template Structure

```
[Subject with specific details and action], [environment/setting],
[style], [lighting], [composition], [mood], [color notes], [technical specs]
```

### Example: HVAC Company Social Post

```
A certified HVAC technician in a clean navy blue uniform performing a
routine maintenance check on a modern central air conditioning unit
in the backyard of a well-maintained suburban home, editorial photography,
warm golden hour lighting, eye level three-quarter view with shallow
depth of field, professional and trustworthy mood, blue and white color
scheme, shot on Canon EOS R5 35mm lens
```

### Example: Salon Before/After (After Image)

```
A freshly styled woman with a modern balayage hair coloring sitting in
a contemporary salon chair, bright modern salon interior with large
mirrors and warm wood accents in the background, portrait photography,
soft diffused natural window light from the left, centered composition
with shallow depth of field on the subject, warm inviting and confident
mood, neutral warm tones with rose gold accents, high resolution
```

### Example: Plumber Website Hero Image

```
A smiling licensed plumber crouched under a modern farmhouse kitchen
sink, installing new chrome fixtures, homeowner standing nearby looking
pleased, bright clean kitchen with white cabinets and butcher block
countertops, editorial real estate photography, bright natural window
lighting, wide shot showing the full kitchen with subjects in the left
third, welcoming and professional atmosphere, warm whites and natural
wood tones, ultra-detailed high resolution
```

## Platform-Specific Adaptations

The anatomy above works across all platforms, but each has quirks:

- **Midjourney:** Responds well to terse, evocative prompts. You can be less verbose than with other models. Parameters like `--ar 16:9 --v 6 --style raw` go at the end.
- **DALL-E 3:** Understands natural language well. You can write prompts conversationally. The model rewrites your prompt internally, so extremely precise technical language may be paraphrased.
- **Stable Diffusion / FLUX:** Responds best to comma-separated descriptors. Weight syntax like `(important detail:1.3)` increases emphasis. Technical terms from photography and art are well-understood.
- **Ideogram:** Handles text placement well when you put the desired text in quotation marks within the prompt. Structure otherwise similar to DALL-E 3.

See the Cross-Platform Prompt Translation Guide (05) for detailed conversion patterns.

## Common Mistakes

1. **Being too vague.** "A nice bathroom" gives the model nothing to work with. Specify materials, fixtures, lighting, and style.
2. **Over-stuffing the prompt.** Cramming 15 different concepts into one prompt creates incoherent images. Focus on 1-2 primary subjects and use the other components to support them.
3. **Ignoring lighting.** Lighting is the difference between an amateur snapshot and a professional photo. Always include a lighting descriptor.
4. **Forgetting aspect ratio.** A beautiful image in the wrong aspect ratio requires cropping that ruins the composition. Specify aspect ratio at generation time.
5. **Not iterating.** Your first prompt will rarely produce the perfect image. Plan to generate 3-5 variations and refine the prompt between rounds.


---
## Media

### Platform References
- **midjourney**: [Docs](https://docs.midjourney.com) · [Gallery](https://www.midjourney.com/explore)
- **flux**: [Docs](https://docs.bfl.ml) · [Gallery](https://blackforestlabs.ai)
- **ideogram**: [Docs](https://developer.ideogram.ai/docs) · [Gallery](https://ideogram.ai/explore)

### Related Videos
- [Midjourney Tutorial for Beginners - Full Guide 2026](https://www.youtube.com/results?search_query=midjourney+tutorial+beginners+2026) — *Credit: Skills Factory on YouTube* `midjourney`
- [The Ultimate Beginner's Guide to Midjourney](https://www.youtube.com/results?search_query=ultimate+beginners+guide+midjourney+2025) — *Credit: AI Art Community on YouTube* `midjourney`
- [Flux AI Image Generation - Complete Tutorial](https://www.youtube.com/results?search_query=flux+ai+image+generation+tutorial+2025) — *Credit: AI Art on YouTube* `flux`
- [Flux vs Stable Diffusion vs DALL-E - Which AI Model Wins?](https://www.youtube.com/results?search_query=flux+vs+stable+diffusion+vs+dall-e+comparison) — *Credit: AI Reviews on YouTube* `flux`
- [Ideogram AI Tutorial - Text in Images Perfected](https://www.youtube.com/results?search_query=ideogram+ai+tutorial+text+images+2025) — *Credit: AI Reviews on YouTube* `ideogram`
- [Ideogram 2.0 - Best AI for Typography](https://www.youtube.com/results?search_query=ideogram+2.0+typography+ai+review) — *Credit: AI Art on YouTube* `ideogram`

> *All video content is credited to original creators. Links direct to source platforms.*
