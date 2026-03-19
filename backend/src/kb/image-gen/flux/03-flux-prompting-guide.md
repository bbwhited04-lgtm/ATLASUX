---
title: "FLUX Prompting Guide with Examples"
platform: "flux"
category: "image-gen"
tags: ["flux", "black-forest-labs", "ai-image", "prompting", "examples", "best-practices"]
updated: "2026-03-19"
---

# FLUX Prompting Guide

## FLUX-Specific Prompting Principles

FLUX handles prompts differently from Midjourney or DALL-E. Understanding these differences is essential for getting the best results.

### 1. Front-Load Important Elements
FLUX pays more attention to what comes first in the prompt. Place the most critical subject and style information at the beginning. Structure: **Subject + Action + Style + Context**.

### 2. Use Active, Descriptive Language
FLUX responds well to dynamic descriptions. Instead of "mountain with mist," describe "early morning fog rolling through a steep granite valley." Motion and energy in language translate to more dynamic images.

### 3. Use Positive Phrasing Only
FLUX does not support negative prompts. Do not use "--no" syntax or try to describe what should be absent. Instead, describe exactly what you want present. Negative phrasing can backfire and introduce the unwanted elements.

### 4. Layer Environmental Details
Describe how light interacts with the environment. Mention time of day, weather conditions, material surfaces, and atmospheric effects. FLUX uses these cues to build rich, physically plausible scenes.

### 5. Specify Technical Camera Details
FLUX excels when given specific camera and lens information. Mention focal length, aperture, film stock, or sensor type for photographic outputs. Use terms like "shot on Canon EOS R5, 85mm f/1.4" rather than vague "professional photo."

### 6. Use Quotation Marks for Text
When you need text rendered in the image, wrap it in quotation marks and describe its style and placement. Example: `bold white text reading "OPEN 24/7" on a neon sign above the entrance`.

### 7. Keep Prompts Focused
Break complex scenes into shorter, focused sentences rather than one massive run-on. Each sentence should describe one element: subject, then environment, then style, then technical details.

---

## 10 Example Prompts

### 1. Hyperrealistic Portrait

**Prompt:**
```
Close-up portrait of a 45-year-old master carpenter with weathered hands and kind eyes, wearing a sawdust-covered canvas apron. Natural window light from the left illuminating wood shavings in the air. Shallow depth of field, shot on Sony A7R V with 85mm f/1.2 lens. Warm golden hour tones, visible wood grain texture on the workbench behind him.
```

**Expected Output:** A photorealistic headshot with precise skin texture, individual wood shavings catching the light, realistic bokeh in the background, and natural shadow gradients. FLUX excels at skin pores, fabric texture, and environmental particle effects.

---

### 2. Product on White Background

**Prompt:**
```
Premium wireless earbuds in matte black with rose gold accents, resting on a pure white seamless background. Studio product photography with soft even lighting from above and slight shadow beneath. Ultra-sharp focus on the earbuds with visible material textures. Clean e-commerce style, 4K product shot.
```

**Expected Output:** A clean, commercial-ready product image with accurate material rendering (matte vs metallic), precise shadow placement, and the crisp white background expected for e-commerce listings. FLUX handles material differentiation well.

---

### 3. Cinematic Landscape

**Prompt:**
```
Vast Icelandic highland plateau at twilight, volcanic black sand stretching to the horizon. A single narrow river of glacial blue water winds through the dark terrain. Low dramatic clouds lit from below by the last amber sunlight. Shot on ARRI Alexa 65 with anamorphic lens, 2.39:1 aspect ratio. Cinematic color grading with deep shadows and crushed blacks.
```

**Expected Output:** A wide cinematic frame with dramatic contrast between the dark volcanic landscape and the luminous sky. FLUX handles atmospheric lighting and vast landscape compositions with excellent spatial coherence and natural color gradients.

---

### 4. UI/App Screenshot

**Prompt:**
```
Mobile app screenshot of a modern appointment booking interface on an iPhone 15 Pro. Clean white background with a calendar view showing available time slots in teal green. A floating card at the bottom shows "Book with Lucy" button in gradient blue. San Francisco font, minimal design with rounded corners and subtle shadows. Status bar showing 9:41 AM.
```

**Expected Output:** A realistic phone UI mockup with legible text, properly aligned UI elements, and recognizable iOS design patterns. FLUX.2 Flex is particularly strong here with its text rendering capabilities. Expect clean typography and proper card shadow layering.

---

### 5. Hand-Lettered Typography

**Prompt:**
```
Vintage hand-painted wooden sign reading "MIKE'S PLUMBING - EST. 1987" in bold cream-colored serif letters on a weathered dark green background. Visible brush strokes and paint texture, slight imperfections in the lettering. Mounted on a red brick wall with afternoon sunlight casting a shadow. Rustic Americana aesthetic.
```

**Expected Output:** A photorealistic sign with legible text that shows realistic imperfections. FLUX handles text-in-image rendering better than most competitors, achieving readable results on the first attempt for straightforward text like this. The paint texture and brick material rendering will be physically convincing.

---

### 6. Macro Photography

**Prompt:**
```
Extreme macro photograph of a single water droplet balanced on the tip of a green leaf, reflecting an inverted garden scene. Shot with Laowa 100mm 2x macro lens at f/5.6. Razor-thin depth of field with smooth creamy bokeh. Morning dew, backlit by soft diffused sunlight. Visible leaf cell structure and tiny surface hairs. Nature documentary quality.
```

**Expected Output:** An ultra-detailed close-up with accurate refraction in the water droplet, realistic depth-of-field falloff, and convincing organic textures. FLUX produces excellent macro-style images with proper light transmission through translucent surfaces.

---

### 7. Isometric Illustration

**Prompt:**
```
Isometric 3D illustration of a small plumbing repair shop. Cutaway view showing the interior: a front counter with a cash register, shelves of copper pipes and fittings, a workbench with tools, and a van parked outside with "24/7 Service" on the side. Soft pastel color palette with teal, coral, and warm grey. Clean vector-like rendering with subtle shadows, no outlines. White background.
```

**Expected Output:** A clean isometric scene with consistent 30-degree perspective, distinct object separation, and a cohesive color palette. FLUX handles isometric and low-poly illustration styles well, though complex multi-element scenes may require iteration. Text on the van should be largely legible.

---

### 8. Vintage Film Look

**Prompt:**
```
1970s Kodachrome photograph of a family-owned auto repair garage in small-town America. A mechanic in blue coveralls leans against a classic Chevrolet pickup truck. Analog film grain, slightly warm color cast with saturated reds and muted greens. Soft focus edges characteristic of vintage lenses. Visible film border and slight light leak on the right edge.
```

**Expected Output:** An image with authentic analog film characteristics: correct Kodachrome color science (rich reds, deep blues, warm skin tones), realistic grain structure, and period-appropriate clothing and vehicle details. FLUX understands specific film stock aesthetics when named explicitly.

---

### 9. Technical Diagram

**Prompt:**
```
Clean technical diagram of a residential water heater system. Cross-section view showing the tank interior with cold water inlet at bottom, heating element, thermostat, hot water outlet at top, and pressure relief valve. Blue arrows showing cold water flow, red arrows showing hot water flow. White background, thin black line art with color fills. Labels in clean sans-serif font: "Cold In", "Hot Out", "Thermostat", "Pressure Relief".
```

**Expected Output:** A semi-technical illustration with labeled components and directional flow arrows. FLUX can produce diagram-style outputs, though accuracy of technical details may vary. Labels should be largely readable. Best used as a starting point for technical documentation rather than a final engineering reference.

---

### 10. Brand Identity

**Prompt:**
```
Professional brand identity mockup for "Atlas Plumbing Co." displayed on premium stationery. Business card, letterhead, and envelope arranged on a dark marble desk surface. Logo features a minimalist atlas figure holding a wrench, rendered in navy blue and copper. Embossed logo on the business card with spot UV coating visible in the light. Overhead studio shot, shallow depth of field.
```

**Expected Output:** A photorealistic stationery mockup with convincing material rendering (paper texture, embossing depth, marble surface). The logo text should be readable, and the overall brand presentation will look professional. FLUX handles material interactions (reflective coatings, embossed surfaces) with good physical accuracy.

---

## Common Mistakes to Avoid

1. **Using negative prompts** — FLUX ignores or misinterprets them. Describe what you want, not what you want to avoid.
2. **Overly long prompts** — Keep prompts under 200 words. Front-load the critical details.
3. **Vague style descriptions** — "Beautiful photo" tells FLUX nothing. Specify camera, lens, lighting, and mood.
4. **Expecting perfect text on first try** — FLUX text rendering is good but not 100%. Plan for 2-3 attempts on complex typography.
5. **Ignoring aspect ratio** — Specify landscape, portrait, or square. FLUX defaults may not match your intended composition.


---
## Media

> **Tags:** `flux` · `black-forest-labs` · `ai-image` · `open-source` · `schnell` · `dev` · `pro` · `comfyui`

### Platform
![flux logo](https://blackforestlabs.ai/wp-content/uploads/2024/07/BFL_Logo.png)
*Source: Official flux branding — [flux](https://docs.bfl.ml)*

### Official Resources
- [Official Documentation](https://docs.bfl.ml)
- [Gallery / Showcase](https://blackforestlabs.ai)
- [Black Forest Labs - Flux Models](https://blackforestlabs.ai)
- [Flux API Documentation](https://docs.bfl.ml)
- [Flux on Hugging Face](https://huggingface.co/black-forest-labs)

### Video Tutorials
- [Flux AI Image Generation - Complete Tutorial](https://www.youtube.com/results?search_query=flux+ai+image+generation+tutorial+2025) — *Credit: AI Art on YouTube* `tutorial`
- [Installing Flux in ComfyUI - Step by Step](https://www.youtube.com/results?search_query=flux+comfyui+installation+tutorial) — *Credit: ComfyUI on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
