---
title: "Leonardo.ai Prompting Guide"
platform: "leonardo-ai"
category: "image-gen"
tags: ["leonardo-ai", "ai-image", "prompts", "prompt-engineering", "alchemy", "photoreal", "style-presets"]
---

# Leonardo.ai Prompting Guide

## Prompting Fundamentals

Leonardo.ai responds best to structured prompts that specify subject, style, medium, lighting, and composition. The Phoenix model delivers approximately 95% prompt adherence, making detailed multi-element prompts particularly effective. Key principles:

- **Be specific about medium:** "digital painting," "3D render," "oil painting," "tilt-shift photograph"
- **Reference styles:** "in the style of Studio Ghibli," "Unreal Engine 5 render," "watercolor illustration"
- **Use modifiers for quality:** "highly detailed," "4K," "cinematic lighting," "dramatic shadows"
- **Negative prompts (Alchemy V2):** Start with 3-5 exclusion terms; too many negatives can degrade output
- **Aspect ratio matters:** Match your ratio to the use case (16:9 for environments, 1:1 for avatars, 9:16 for mobile)

## Leonardo-Specific Settings

### Alchemy Toggle
Enable Alchemy for premium rendering with enhanced lighting, contrast, and material fidelity. Costs 8-16 tokens per image versus 1-2 standard. Recommended for final production assets; disable for rapid exploration.

### PhotoReal Mode
Optimized for photographic realism. Available presets:
- **Cinematic** - Film-grade color grading, shallow depth of field
- **Creative** - Balanced realism with artistic interpretation
- **Vibrant** - Saturated colors, high contrast
- **Bokeh** - Strong background blur, portrait-focused
- **Long Exposure** - Motion blur effects, light trails
- **Retro** - Vintage film grain, muted tones

### Style Presets
Leonardo offers built-in style presets that modify the generation pipeline. Apply these in addition to your text prompt to steer aesthetic output without lengthy prompt engineering.

### Model Selection
- **Phoenix 1.0** - Best all-around model, highest prompt adherence, good text rendering
- **Leonardo Diffusion XL** - Strong for photorealism and general purpose
- **Leonardo Vision XL** - Optimized for artistic and illustrative styles
- **DreamShaper** - Community favorite for fantasy and character art
- **Absolute Reality** - Community model excelling at photorealism

---

## 10 Example Prompts

### 1. Game Character

**Prompt:** "Full-body character design of a female rogue assassin, dual wielding curved daggers, dark leather armor with glowing blue rune engravings, dynamic action pose, stylized game art style, front and side view turnaround sheet, dark fantasy aesthetic, highly detailed, concept art"

**Settings:** Phoenix 1.0 | Alchemy ON | 1024x1024 | Guidance Scale 7 | No style preset
**Negative prompt:** "blurry, low quality, extra limbs, watermark, text overlay"

---

### 2. Texture / Material

**Prompt:** "Seamless tileable texture of weathered medieval stone brick wall, moss growing between cracks, wet surface with subtle reflections, PBR material, 4K resolution, game-ready asset, top-down flat lighting for texture mapping"

**Settings:** Phoenix 1.0 | Alchemy ON | 1024x1024 | Guidance Scale 8 | No style preset
**Negative prompt:** "perspective distortion, strong shadows, vignette, objects, characters"

---

### 3. Environment Concept

**Prompt:** "Wide establishing shot of a cyberpunk floating market district at sunset, neon signs in Japanese and English, flying vehicles between towering buildings connected by walkways, volumetric fog, orange and purple sky, rain-slicked platforms, cinematic composition, matte painting style, ultra detailed"

**Settings:** Phoenix 1.0 | Alchemy ON | 1536x768 (2:1) | Guidance Scale 7 | Cinematic preset
**Negative prompt:** "blurry, low resolution, cartoon, flat lighting"

---

### 4. UI Element

**Prompt:** "Game UI health bar design, horizontal bar with ornate golden dragon frame, red liquid fill effect, glowing ember particles, dark fantasy RPG style, transparent background, clean vector edges, icon design, flat game asset"

**Settings:** Phoenix 1.0 | Alchemy ON | 1024x512 | Guidance Scale 8 | No style preset
**Negative prompt:** "3D perspective, photorealistic, blurry, noisy background"

---

### 5. Avatar / Profile Picture

**Prompt:** "Professional headshot portrait of a confident businesswoman in her 30s, warm smile, navy blazer, soft studio lighting with rim light, shallow depth of field, neutral gray background, corporate professional photography style"

**Settings:** Phoenix 1.0 | PhotoReal ON | Cinematic preset | 768x768 | Guidance Scale 6
**Negative prompt:** "cartoon, illustration, deformed face, extra fingers, harsh shadows"

---

### 6. Product Visualization

**Prompt:** "Luxury wireless headphones floating at an angle on a gradient background transitioning from deep navy to midnight black, dramatic product lighting from above and left, subtle reflection on glossy surface below, commercial product photography, studio setup, 8K detail"

**Settings:** Phoenix 1.0 | PhotoReal ON | Vibrant preset | 1024x1024 | Guidance Scale 7
**Negative prompt:** "watermark, text, logos, hands, person wearing headphones"

---

### 7. Comic Panel

**Prompt:** "Single comic book panel, noir detective standing under a flickering streetlight in a rainy alley, trench coat collar turned up, cigarette smoke curling upward, heavy ink lines, cross-hatching shadows, limited color palette of black white and deep red accent, Frank Miller Sin City style"

**Settings:** Leonardo Vision XL | Alchemy ON | 768x1024 | Guidance Scale 7.5 | No style preset
**Negative prompt:** "photorealistic, 3D render, bright colors, anime, manga"

---

### 8. Architectural Interior

**Prompt:** "Modern minimalist living room interior, floor-to-ceiling windows overlooking a mountain lake at golden hour, concrete walls with warm wood accent panel, low-profile sectional sofa in cream, single large abstract painting on wall, indoor plant in ceramic pot, architectural photography, wide angle lens, natural lighting"

**Settings:** Phoenix 1.0 | PhotoReal ON | Cinematic preset | 1536x768 | Guidance Scale 6.5
**Negative prompt:** "cluttered, messy, people, cartoon, illustration, fisheye distortion"

---

### 9. Fantasy Creature

**Prompt:** "Majestic elder forest dragon coiled around an ancient oak tree, bioluminescent moss growing on its bark-like scales, antler-shaped horns with hanging vines, six eyes glowing soft amber, wingspan partially unfurled revealing leaf-patterned membrane, enchanted forest clearing, fireflies, volumetric god rays, creature concept art, highly detailed"

**Settings:** Phoenix 1.0 | Alchemy ON | 1024x1024 | Guidance Scale 7.5 | No style preset
**Negative prompt:** "cartoony, chibi, low detail, western dragon stereotype, fire breathing"

---

### 10. Marketing Asset

**Prompt:** "Clean modern social media banner for a SaaS product launch, abstract geometric shapes in gradient blue and purple, floating 3D glass morphism UI card mockup in center, subtle particle effects, professional tech company aesthetic, wide format, negative space for text overlay on left third"

**Settings:** Phoenix 1.0 | Alchemy ON | 1536x512 (3:1) | Guidance Scale 7 | Vibrant preset
**Negative prompt:** "busy background, text, words, logos, realistic photo, people"

---

## Pro Tips

1. **Iterate with standard first:** Generate exploration batches without Alchemy (1-2 tokens each), then re-run your best prompts with Alchemy enabled for production quality.

2. **Use the Realtime Canvas for composition:** Sketch rough layouts on the canvas to guide spatial placement before finalizing with a text prompt.

3. **Leverage fine-tuned models for consistency:** If you need 50+ images in the same style, train a custom model with 10-20 reference images rather than prompt-engineering consistency.

4. **Negative prompts are surgical tools:** Start with 3-5 terms. Common useful negatives: "blurry, watermark, deformed hands, extra fingers, low quality, text."

5. **PhotoReal presets stack with prompts:** The preset handles the photographic baseline; your prompt should focus on subject, composition, and scene rather than technical photography terms the preset already covers.


---
## Media

> **Tags:** `leonardo-ai` · `ai-image` · `alchemy` · `phoenix` · `realtime-canvas` · `image-generation`

### Official Resources
- [Official Documentation](https://docs.leonardo.ai)
- [Gallery / Showcase](https://app.leonardo.ai/ai-generations)
- [Leonardo AI Learn Hub](https://leonardo.ai/learn/)
- [Leonardo AI Webinars](https://leonardo.ai/webinars/)
- [Leonardo 101: Beginner's Guide](https://leonardo.ai/webinars/leonardo-101-welcome-to-leonardo-ai-webinar/)

### Video Tutorials
- [Leonardo AI Tutorial for Beginners](https://www.youtube.com/results?search_query=leonardo+ai+tutorial+beginners+2025) — *Credit: Leonardo AI on YouTube* `tutorial`
- [Leonardo AI Phoenix Model - Complete Guide](https://www.youtube.com/results?search_query=leonardo+ai+phoenix+model+guide) — *Credit: AI Art on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
