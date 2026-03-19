---
title: "Stability AI Prompting Guide — 10 Example Prompts with Settings"
platform: "stability-ai"
category: "image-gen"
tags: ["stability-ai", "stable-diffusion", "prompting", "negative-prompts", "cfg-scale", "samplers", "sdxl", "sd3"]
updated: "2026-03-19"
---

# Stability AI Prompting Guide — 10 Example Prompts with Settings

## Prompting Fundamentals

Stable Diffusion prompts work differently from conversational AI prompts. Key principles:

- **Front-load important terms** — the model weights earlier tokens more heavily
- **Use descriptive keywords, not sentences** — "cinematic lighting, 8K, detailed" outperforms "make it look like a movie"
- **Negative prompts matter** — explicitly exclude unwanted artifacts
- **CFG Scale** controls prompt adherence (higher = more literal, lower = more creative). Typical range: 5-12
- **Steps** control refinement iterations. More steps = more detail but diminishing returns past 30-50
- **Samplers** affect output style and speed. DPM++ 2M Karras and Euler a are reliable defaults

---

## 1. Photorealistic Product Shot

**Use case:** E-commerce product photography, marketing materials

**Prompt:**
```
professional product photography of a matte black wireless headphone, floating on white background, soft studio lighting, sharp focus, commercial photography, 8K resolution, clean minimal composition, subtle shadow beneath product
```

**Negative prompt:**
```
blurry, low quality, distorted, text, watermark, logo, noisy, grainy, oversaturated, cartoon, illustration, deformed
```

**Settings:** Model: SDXL / SD 3.5 Large | Steps: 30 | CFG: 7.5 | Sampler: DPM++ 2M Karras | Resolution: 1024x1024

**Expected output:** Clean studio-quality product image with professional lighting, sharp details on the headphone surfaces, subtle reflections, and a pure white or light gradient background. Suitable for e-commerce listings.

---

## 2. Anime Character Design

**Use case:** Character concept art, game design, illustration

**Prompt:**
```
anime girl with silver hair and blue eyes, wearing a dark military uniform with gold trim, standing on a rooftop overlooking a cyberpunk city at night, wind blowing hair, detailed face, masterpiece, best quality, high detail anime style, vibrant neon city lights in background
```

**Negative prompt:**
```
bad anatomy, bad hands, extra fingers, missing fingers, deformed face, ugly, low quality, worst quality, blurry, lowres, text, watermark, extra limbs, mutated
```

**Settings:** Model: SDXL (anime checkpoint) or SD 3.5 Medium | Steps: 28 | CFG: 8 | Sampler: Euler a | Resolution: 832x1216 (portrait)

**Expected output:** High-quality anime illustration with clean linework, vivid colors, correct anatomy, and a detailed cyberpunk cityscape background. The character should have distinct features, proper proportions, and dynamic hair movement.

---

## 3. Architectural Rendering

**Use case:** Real estate marketing, architectural visualization, concept presentation

**Prompt:**
```
modern minimalist house with large floor-to-ceiling glass windows, white concrete exterior, surrounded by a zen garden with gravel and sparse landscaping, golden hour sunlight, architectural photography, ultra detailed, professional real estate photography, warm ambient lighting, clear blue sky
```

**Negative prompt:**
```
cartoon, anime, painting, sketch, low quality, blurry, distorted architecture, warped lines, unrealistic proportions, oversaturated, people, text
```

**Settings:** Model: SD 3.5 Large / Stable Image Ultra | Steps: 35 | CFG: 7 | Sampler: DPM++ 2M Karras | Resolution: 1216x832 (landscape)

**Expected output:** Photorealistic architectural exterior with accurate perspective lines, realistic glass reflections, natural golden hour lighting, and crisp structural details. The composition should feel like a professional real estate photograph.

---

## 4. Seamless Texture / Pattern Generation

**Use case:** Game development, 3D modeling, fabric/wallpaper design

**Prompt:**
```
seamless tileable texture of weathered red brick wall, mossy grout lines, natural aging and patina, photorealistic surface detail, top-down flat lighting for texture mapping, 4K resolution, PBR-ready surface
```

**Negative prompt:**
```
visible seams, non-tileable, perspective distortion, objects, people, shadows from external light sources, vignette, blurry, low resolution
```

**Settings:** Model: SDXL | Steps: 25 | CFG: 6 | Sampler: DPM++ 2M Karras | Resolution: 1024x1024 | Tiling: Enabled (if using A1111/ComfyUI)

**Expected output:** A tileable brick texture with realistic weathering, consistent lighting across the entire surface, and fine detail in grout lines and surface imperfections. When tiled, edges should be invisible.

---

## 5. Fantasy Concept Art

**Use case:** Game design, book covers, film pre-production

**Prompt:**
```
epic fantasy landscape, massive ancient tree growing from a floating island in the sky, waterfalls cascading off the edges into clouds below, bioluminescent mushrooms glowing on the trunk, tiny medieval village built into the tree branches, dramatic volumetric lighting, concept art style, matte painting, artstation trending, highly detailed
```

**Negative prompt:**
```
photorealistic, photograph, low quality, blurry, ugly, deformed, text, watermark, modern buildings, cars, technology, simple, flat lighting
```

**Settings:** Model: SDXL / SD 3.5 Large | Steps: 40 | CFG: 9 | Sampler: DPM++ 2M Karras | Resolution: 1216x832 (landscape)

**Expected output:** A painterly concept art piece with dramatic scale, rich atmospheric effects, volumetric light rays piercing through clouds, and intricate details in both the macro landscape and micro village elements. The style should evoke professional digital matte painting.

---

## 6. Photo Restoration Style

**Use case:** Enhancing old photos, creating vintage-modern fusion images

**Prompt:**
```
restored vintage photograph of a 1940s jazz club interior, musicians on stage playing saxophone and piano, warm amber lighting, audience seated at small round tables, cigarette smoke haze, sharp focus, film grain, Kodachrome color palette, historically accurate clothing and decor, photorealistic
```

**Negative prompt:**
```
modern clothing, modern technology, smartphones, LED lights, digital look, flat lighting, cartoon, anime, blurry, low quality, deformed faces, extra limbs
```

**Settings:** Model: SD 3.5 Large / Stable Image Ultra | Steps: 35 | CFG: 7.5 | Sampler: DPM++ SDE Karras | Resolution: 1216x832 (landscape)

**Expected output:** An image that looks like a professionally restored mid-century photograph with authentic period details, warm analog color grading, subtle film grain, and atmospheric haze. Faces should be clear and well-defined, clothing period-accurate.

---

## 7. Fashion Design Illustration

**Use case:** Fashion design presentations, lookbooks, trend visualization

**Prompt:**
```
high fashion editorial photograph, model wearing an avant-garde structured coat with geometric origami folds in pearl white fabric, standing in a minimalist gallery space, dramatic side lighting creating sharp shadows, Vogue magazine quality, full body shot, sharp focus on fabric textures and construction details
```

**Negative prompt:**
```
casual clothing, wrinkled fabric, bad anatomy, extra fingers, deformed hands, blurry, low quality, cartoon, illustration style, busy background, cluttered, text, watermark
```

**Settings:** Model: SD 3.5 Large / Stable Image Ultra | Steps: 30 | CFG: 7 | Sampler: DPM++ 2M Karras | Resolution: 832x1216 (portrait)

**Expected output:** An editorial-quality fashion photograph with precise fabric rendering, accurate body proportions, dramatic lighting that emphasizes the garment's structure, and a clean gallery environment. The image should feel like it belongs in a high-fashion publication.

---

## 8. Game Asset — Isometric Item

**Use case:** Game development, UI icons, inventory systems

**Prompt:**
```
isometric game asset, enchanted crystal sword with glowing blue runes on the blade, ornate golden crossguard and leather-wrapped grip, magical energy particles floating around it, dark background, game item icon style, hand-painted digital art, clean edges, vibrant colors, RPG weapon design
```

**Negative prompt:**
```
photorealistic, photograph, blurry, low quality, 3D render, multiple items, text, watermark, busy background, modern weapon, gun, muted colors
```

**Settings:** Model: SDXL | Steps: 28 | CFG: 8.5 | Sampler: Euler a | Resolution: 1024x1024

**Expected output:** A clean, stylized game weapon rendered in an isometric or 3/4 view with vibrant fantasy coloring, glowing magical effects, clear silhouette, and painterly detail. The item should look ready for integration into a game UI with minimal post-processing.

---

## 9. Scientific / Technical Illustration

**Use case:** Educational content, textbooks, research presentations

**Prompt:**
```
detailed scientific illustration of a cross-section of a human heart, anatomically accurate chambers and valves labeled with clean typography, blood flow indicated with red and blue arrows, medical textbook illustration style, clean white background, high contrast line art with selective color, educational diagram
```

**Negative prompt:**
```
photorealistic, photograph, gore, blood, blurry, low quality, cartoon style, anime, sketchy, incomplete, inaccurate anatomy, 3D render
```

**Settings:** Model: SD 3.5 Large (best text rendering) | Steps: 35 | CFG: 8 | Sampler: DPM++ 2M Karras | Resolution: 1024x1024

**Expected output:** A clean medical illustration with accurate cardiac anatomy, clear labeling (SD3/3.5 handles text far better than older models), color-coded blood flow paths, and a professional educational aesthetic. Note: always verify anatomical accuracy manually — AI-generated medical illustrations require expert review.

---

## 10. Marketing Banner / Social Media Graphic

**Use case:** Ad creative, social media posts, promotional materials

**Prompt:**
```
modern marketing banner for a summer coffee promotion, iced coffee drink with condensation droplets on glass, fresh mint leaves and coffee beans artfully scattered, bright tropical gradient background in coral and turquoise, clean negative space on the left side for text overlay, commercial photography style, vibrant and appetizing
```

**Negative prompt:**
```
text, typography, letters, words, logos, brands, blurry, low quality, dark, moody, winter, cold tones, cluttered, busy composition, hands, people
```

**Settings:** Model: SDXL / SD 3.5 Medium | Steps: 30 | CFG: 7 | Sampler: DPM++ 2M Karras | Resolution: 1216x832 (landscape) or 1024x512 (banner ratio)

**Expected output:** A vibrant, commercially styled product image with appetizing food photography aesthetics, bright summer colors, and intentional negative space for text overlay. The composition should feel marketing-ready with minimal post-production needed. Text is excluded from the prompt intentionally — add typography in a design tool for reliable results.

---

## Quick Reference: Recommended Settings by Style

| Style | CFG Scale | Steps | Sampler | Model |
|-------|-----------|-------|---------|-------|
| Photorealistic | 6-8 | 28-35 | DPM++ 2M Karras | SD 3.5 Large / Ultra |
| Anime/Illustration | 7-9 | 25-30 | Euler a | SDXL (custom checkpoint) |
| Concept Art | 8-10 | 35-45 | DPM++ 2M Karras | SDXL / SD 3.5 Large |
| Product Photography | 7-8 | 28-35 | DPM++ 2M Karras | SD 3.5 Large / Ultra |
| Textures/Patterns | 5-7 | 20-28 | DPM++ 2M Karras | SDXL |
| Game Assets | 8-9 | 25-30 | Euler a | SDXL |
| Scientific/Technical | 7-9 | 30-40 | DPM++ 2M Karras | SD 3.5 Large |
| Marketing/Commercial | 6-8 | 28-35 | DPM++ 2M Karras | SDXL / SD 3.5 Medium |

## Tips for Better Results

1. **Iterate with seeds** — find a good composition first, then refine the prompt
2. **Use img2img for refinement** — generate a rough version, then img2img at 0.3-0.5 denoising to add detail
3. **ControlNet for composition** — use Canny or depth ControlNet to lock in spatial layout
4. **Negative prompts are critical** — always include quality-related negatives ("blurry, low quality, deformed")
5. **SD 3.5 handles text best** — if you need readable text in images, use SD 3.5 Large or Ultra
6. **Batch and cherry-pick** — generate 4-8 variations and select the best, rather than perfecting a single generation


---
## Media

> **Tags:** `stability-ai` · `stable-diffusion` · `sd3` · `sd3.5` · `sdxl` · `ai-image` · `open-source` · `comfyui`

### Platform
![stability-ai logo](https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Stability_AI_logo.svg/250px-Stability_AI_logo.svg.png)
*Source: Official stability-ai branding — [stability-ai](https://platform.stability.ai/docs)*

### Official Resources
- [Official Documentation](https://platform.stability.ai/docs)
- [Gallery / Showcase](https://stability.ai)
- [Stability AI Platform](https://platform.stability.ai)
- [Stable Diffusion Web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [Stable Diffusion Art Tutorials](https://stable-diffusion-art.com/beginners-guide/)
- [Civitai Model Hub](https://civitai.com)

### Video Tutorials
- [Stable Diffusion 3.5 Tutorial - Complete Beginner's Guide](https://www.youtube.com/results?search_query=stable+diffusion+3.5+tutorial+beginners) — *Credit: SD Tutorials on YouTube* `tutorial`
- [Stable Diffusion Installation Guide 2025](https://www.youtube.com/results?search_query=stable+diffusion+installation+guide+2025) — *Credit: AI Art on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
