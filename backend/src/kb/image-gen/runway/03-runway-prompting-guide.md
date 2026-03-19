---
title: "Runway ML Prompting Guide — 10 Image Generation Examples"
platform: "runway"
category: "image-gen"
tags: ["runway", "ai-image", "prompting", "cinematic", "storyboard", "vfx", "film", "editorial"]
---

# Runway ML Image Prompting Guide

## Prompting Principles

Runway's Gen-4 Image model is designed to thrive on visual detail. Conversational language adds no value and can negatively impact results. Instead, write prompts as dense visual descriptions using full, natural-language sentences.

**Key rules for Runway prompting:**

1. **No negative prompts.** Describing what should not appear often causes it to appear. Only describe what you want.
2. **Use visual and cinematic vocabulary.** Camera angles, lens types, lighting setups, film stocks, and color grading terms all meaningfully influence output.
3. **Full sentences over keyword lists.** Runway responds better to natural descriptive sentences than comma-separated tag lists.
4. **Reference images amplify prompts.** Attach up to three reference images for style, subject, or location guidance alongside your text prompt.
5. **Specify aspect ratio.** Choose the ratio that matches your intended use (16:9 for widescreen, 9:16 for vertical, 1:1 for square).

---

## 10 Example Prompts

### 1. Cinematic Still Frame

```
A lone figure in a dark trench coat stands at the edge of a rain-soaked rooftop at night, city lights blurred in the background through shallow depth of field. Shot on anamorphic lens with warm amber streetlight flares bleeding into the frame. The mood is tense and contemplative, reminiscent of a neo-noir thriller. 35mm film grain visible.
```

**Why it works:** Specifies lens type (anamorphic), lighting source (amber streetlight), depth of field, film stock feel, and emotional tone — all parameters Runway interprets well.

### 2. Storyboard Panel

```
A storyboard-style illustration in clean black ink on white paper, showing a wide establishing shot of a spacecraft approaching a massive space station orbiting Jupiter. Dynamic perspective lines converge toward the station. Annotations and frame number visible in the margin. Professional pre-production art style.
```

**Why it works:** Runway handles stylistic mimicry well. Specifying "storyboard-style" with material details (ink on paper) and production context (annotations, frame numbers) produces authentic pre-vis art.

### 3. VFX Concept Art

```
A photorealistic VFX concept painting of an ancient temple partially submerged in glowing turquoise bioluminescent water inside a vast underground cavern. Volumetric light shafts pierce through cracks in the cavern ceiling. The stone surfaces are covered in moss and alien crystalline growths. Matte painting style used in blockbuster film pre-production.
```

**Why it works:** "Matte painting style" and "VFX concept" signal the intended production context. Volumetric lighting and specific material descriptions (moss, crystalline growths) give the model clear rendering targets.

### 4. Motion Design Keyframe

```
A clean motion graphics keyframe showing the word ATLAS in bold sans-serif typography, floating in three-dimensional space against a deep navy gradient background. Subtle geometric shapes orbit the text — translucent hexagons and thin golden lines. The lighting is soft and studio-like with a gentle rim light on the letterforms. Designed for a title sequence.
```

**Why it works:** Motion design keyframes need clean composition and clear spatial relationships. Specifying typography style, background treatment, and orbiting elements gives Runway enough structure to produce a usable design frame.

### 5. Product Shot with Dramatic Lighting

```
A premium wireless earbud case sitting on a polished black obsidian surface, lit by a single harsh spotlight from above creating sharp shadows and specular highlights on the matte white case. The background fades to pure black. Shot in the style of an Apple product photograph with precise, minimal composition. 85mm macro lens, f/2.8.
```

**Why it works:** Product photography prompts benefit from specific lighting setups (single harsh spotlight), surface materials (polished obsidian), and camera specifications. Referencing "Apple product photograph" anchors the aesthetic.

### 6. Film Poster

```
A dramatic movie poster composition featuring a woman in a red dress standing in the center of a flooded city street at golden hour. Her reflection in the water is distorted and fragmented. The skyline behind her is silhouetted against an intense orange and purple sunset. Typography space reserved at the top third of the frame. Painted in the style of classic 1970s thriller movie posters with visible brushwork.
```

**Why it works:** Specifying composition rules (typography space at top third), era-specific style (1970s thriller posters), and painterly technique (visible brushwork) guides Runway toward a result that functions as an actual poster layout.

### 7. Music Video Aesthetic

```
A close-up portrait of a singer with iridescent face paint and chrome accessories, eyes closed, mouth slightly open mid-lyric. The lighting is split — cool blue from the left, hot magenta from the right — creating dramatic color contrast across the face. Lens flares and prismatic light leaks scatter across the frame. Shot on a vintage Helios 44-2 lens with characteristic swirly bokeh in the background.
```

**Why it works:** Music video aesthetics rely on bold color contrast and lens character. Naming a specific vintage lens (Helios 44-2) with its known optical qualities (swirly bokeh) gives Runway a precise rendering target.

### 8. Documentary Style

```
A candid photograph of an elderly fisherman mending a net on a weathered wooden dock at dawn. Overcast natural light, muted earth tones, slight overexposure in the highlights. Shot on a Leica M rangefinder with a 50mm Summicron lens. The image has the quiet, observational quality of a National Geographic feature story. No posing, no eye contact with camera.
```

**Why it works:** Documentary style requires naturalism. Specifying camera brand (Leica), lens (Summicron), lighting conditions (overcast, dawn), and behavioral cues (no posing, no eye contact) produces images with authentic photojournalistic quality.

### 9. Commercial Frame

```
A family of four laughing together at a brightly lit breakfast table in a modern Scandinavian kitchen. Morning sunlight streams through large windows, creating soft warm highlights on their faces. The table is set with fresh fruit, orange juice, and pastries. The color palette is warm whites, light wood, and soft greens. Shot at 35mm, f/4, with natural depth of field. The mood is genuine warmth and connection, styled for a premium grocery brand campaign.
```

**Why it works:** Commercial photography prompts need brand context (premium grocery), emotional direction (genuine warmth), and production details (Scandinavian kitchen, specific color palette). Runway produces lifestyle imagery well when given these anchors.

### 10. Editorial Fashion

```
A high-fashion editorial photograph of a model in an oversized sculptural black coat standing against a stark white cyclorama wall. The lighting is flat and even with no visible shadows, creating a graphic, almost two-dimensional quality. The model's pose is angular and geometric, one arm extended. Shot from a slightly low angle on medium format digital with extreme sharpness. Vogue Italia aesthetic, minimal and severe.
```

**Why it works:** Fashion editorial prompts benefit from specific publication references (Vogue Italia), lighting descriptions (flat, no shadows), and pose direction (angular, geometric). Medium format and low angle specifications influence the spatial quality of the output.

---

## Runway-Specific Controls

### Aspect Ratios
- **16:9** — Widescreen cinematic, landscape, commercial frames
- **9:16** — Vertical/mobile, social media stories, portrait editorial
- **1:1** — Square, product shots, social media posts
- **4:3** — Classic film ratio, documentary style
- **3:2** — Standard photography ratio

### Reference Images
Attach up to 3 reference images to guide style, subject identity, or location. The model preserves referenced elements while applying prompt-directed transformations.

### Custom Styles
Save successful generations as Custom Styles for reuse across projects. This ensures brand consistency when producing large asset sets.

### Turbo vs Standard
Use Gen-4 Image Turbo (2 credits) for rapid iteration and exploration. Switch to standard Gen-4 Image (5-8 credits) for final, highest-quality outputs.


---
## Media

> **Tags:** `runway` · `gen-3` · `ai-image` · `ai-video` · `multi-modal` · `inpainting` · `video-editing`

### Official Resources
- [Official Documentation](https://docs.runwayml.com)
- [Gallery / Showcase](https://runwayml.com/research)
- [Runway Documentation](https://docs.runwayml.com)
- [Runway Research](https://runwayml.com/research)
- [Runway Academy](https://academy.runwayml.com)

### Video Tutorials
- [Runway Gen-3 Alpha Tutorial - AI Video & Image](https://www.youtube.com/results?search_query=runway+gen-3+alpha+tutorial+2025) — *Credit: Runway on YouTube* `tutorial`
- [Runway ML Complete Guide for Creators](https://www.youtube.com/results?search_query=runway+ml+complete+guide+creators) — *Credit: AI Video on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
