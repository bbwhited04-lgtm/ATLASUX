---
title: "Midjourney Prompting Guide"
platform: "midjourney"
category: "image-gen"
tags: ["midjourney", "ai-image", "prompts", "parameters", "examples", "v7", "v6"]
updated: "2026-03-19"
---

# Midjourney Prompting Guide

## Prompting Philosophy

Midjourney V7 understands natural language far better than earlier versions. You no longer need to keyword-stuff prompts with comma-separated descriptors. Instead, write clear, descriptive sentences that convey the scene, mood, and style you want. V7 rewards specificity and artistic direction over brute-force adjective stacking.

### Key Principles

1. **Be specific about what matters**: Describe the subject, lighting, mood, and composition you want.
2. **Use artistic references**: Mention photography styles, art movements, film directors, or specific visual aesthetics.
3. **Less is more**: V7 handles concise prompts better than V5/V6. Over-describing can muddy results.
4. **Parameters are powerful**: Use `--ar`, `--stylize`, `--chaos`, `--weird`, and `--style` to fine-tune output.

## Key Parameters Reference

| Parameter | Range | Default | Description |
|---|---|---|---|
| `--ar` | Any ratio (e.g., 16:9) | 1:1 | Aspect ratio of the output image |
| `--stylize` / `--s` | 0-1000 | 100 | How artistic/stylized vs literal. Low = follow prompt closely. High = more aesthetic interpretation |
| `--chaos` / `--c` | 0-100 | 0 | Variation between the 4 generated images. High = very different results |
| `--weird` / `--w` | 0-3000 | 0 | Introduces unconventional, surreal qualities |
| `--style` | raw | - | Reduces Midjourney's default aesthetic bias for more literal outputs |
| `--no` | text | - | Negative prompt. Excludes specified elements (e.g., `--no text watermark`) |
| `--sref` | URL | - | Style Reference. Applies visual style from a reference image |
| `--oref` | URL | - | Omni Reference. Maintains character/object consistency across generations |
| `--draft` | flag | - | V7 Draft Mode. 10x faster, half GPU cost, rough concepts |
| `--v` | 5, 5.2, 6, 6.1, 7 | 7 | Model version |
| `--q` | .25, .5, 1 | 1 | Quality. Lower = faster/cheaper, less detail |
| `--tile` | flag | - | Generates seamless tiling patterns |
| `--p` | flag | - | Personalization. Uses your trained aesthetic profile |

## 10 Example Prompts

### 1. Photorealistic Portrait

**Prompt:**
```
Portrait of a weathered fisherman in his 60s, deep crow's feet around kind blue eyes, wearing a cable-knit sweater, standing on a misty dock at dawn. Soft golden hour light from the left, shallow depth of field, shot on Hasselblad medium format --ar 3:4 --stylize 150 --v 7
```

**Expected Output:** A cinematic, emotionally resonant portrait with photographic qualities indistinguishable from a real medium-format photograph. The face will show realistic skin texture, pores, and natural aging. The background dock and mist will be softly blurred with beautiful bokeh. Warm golden tones will dominate the left side of the face with cooler shadow tones on the right.

---

### 2. Product Photography

**Prompt:**
```
Luxury men's watch on a polished black obsidian surface, dramatic single-source side lighting creating sharp highlights on the steel case and sapphire crystal, dark moody background with subtle smoke wisps, commercial product photography for a high-end catalog --ar 4:5 --stylize 80 --style raw --v 7
```

**Expected Output:** A clean, commercial-grade product shot with precise reflections on the watch face and bracelet. The obsidian surface will show mirror-like reflections. Lighting will be controlled and studio-quality with deep blacks and crisp specular highlights. The smoke adds atmosphere without distracting from the product.

---

### 3. Fantasy Landscape

**Prompt:**
```
A vast ancient forest where enormous bioluminescent mushrooms tower above the canopy, their caps glowing in shades of turquoise and violet. A narrow stone path winds through the roots, leading to a distant crystalline waterfall catching moonlight. Atmosphere of wonder and quiet magic, painted in the style of a Studio Ghibli background --ar 16:9 --stylize 400 --chaos 30 --v 7
```

**Expected Output:** A wide, panoramic fantasy scene with rich color saturation and painterly quality. The bioluminescent mushrooms will cast colored light onto surrounding foliage. The composition will draw the eye along the path toward the waterfall. The Studio Ghibli reference will produce soft, hand-painted textures with warm environmental storytelling rather than hyperrealism.

---

### 4. Architectural Visualization

**Prompt:**
```
Modern minimalist beach house with floor-to-ceiling glass walls, cantilevered concrete deck extending over white sand dunes, late afternoon golden light streaming through the interior, warm oak flooring, a single Eames lounge chair visible inside. Architectural photography by Julius Shulman --ar 16:9 --stylize 120 --style raw --v 7
```

**Expected Output:** A photorealistic architectural exterior with precise geometric lines and material rendering. The glass walls will show accurate reflections and transparency. Interior details will be visible through the glass. The Julius Shulman reference will produce a mid-century modern photography feel with dramatic shadows and clean composition.

---

### 5. Logo / Brand Design

**Prompt:**
```
Minimalist geometric logo mark for a mountain adventure brand, single continuous line forming both a mountain peak and a compass needle, clean vector style, black on white background, no text, no gradients, flat design suitable for embossing --ar 1:1 --stylize 20 --style raw --no text words letters watermark --v 7
```

**Expected Output:** A clean, simple geometric mark with strong visual identity. The low stylize value and raw style mode will reduce Midjourney's tendency to over-render. Negative prompts exclude text and unnecessary elements. Note: the output will be a raster image, not a true vector. It will need to be traced in Illustrator or Figma for production use. Midjourney tends to make logos more artistic than needed, so expect to iterate.

---

### 6. Food Photography

**Prompt:**
```
Overhead flat-lay of an Italian Sunday dinner table, homemade pasta with bolognese, fresh torn basil leaves, a wedge of Parmigiano-Reggiano with a knife, rustic terracotta bowl, linen napkin, warm tungsten lighting, food photography for Bon Appetit magazine --ar 4:5 --stylize 200 --v 7
```

**Expected Output:** A richly textured overhead food scene with appetizing color grading. The pasta will show realistic sauce consistency and steam. Textures of the linen, terracotta, and cheese will be highly detailed. The warm lighting will create an inviting, editorial feel consistent with premium food magazine photography.

---

### 7. Fashion Editorial

**Prompt:**
```
High fashion editorial portrait, model wearing an avant-garde sculptural dress made of folded white paper, standing in an abandoned industrial greenhouse with broken glass ceiling letting in dramatic shafts of light, shot by Tim Walker for Vogue, ethereal and otherworldly --ar 2:3 --stylize 350 --chaos 15 --v 7
```

**Expected Output:** A striking fashion image with dramatic lighting contrast. The paper dress will have intricate folds and sculptural presence. The greenhouse setting provides texture and atmosphere without competing with the fashion subject. The Tim Walker reference will produce a surreal, dreamlike quality with rich colors and theatrical composition.

---

### 8. Abstract Art

**Prompt:**
```
Abstract expressionist composition, violent splashes of cadmium red and prussian blue oil paint on a raw canvas surface, thick impasto texture with visible palette knife marks, inspired by the emotional intensity of Franz Kline meets the color field of Helen Frankenthaler --ar 3:4 --stylize 600 --chaos 60 --weird 500 --v 7
```

**Expected Output:** A highly textured abstract painting with visible paint thickness and physicality. The high chaos value will produce significant variation between the four grid images. The weird parameter will push results toward unexpected color combinations and compositions. The art historical references will ground the output in recognizable abstract expressionist aesthetics while allowing creative interpretation.

---

### 9. Interior Design

**Prompt:**
```
Scandinavian living room with vaulted ceiling and exposed timber beams, large windows overlooking a snowy pine forest, a cream boucle sectional sofa, warm sheepskin throws, a stone fireplace with a low fire, hygge atmosphere, soft overcast daylight supplemented by warm table lamps, interior photography for Kinfolk magazine --ar 16:9 --stylize 180 --v 7
```

**Expected Output:** A warm, inviting interior scene with photographic quality suitable for an interior design portfolio. Material textures (boucle fabric, sheepskin, stone, timber) will be rendered with high fidelity. The balance of cool daylight from windows and warm lamp light will create depth and atmosphere. The Kinfolk reference produces a minimal, lived-in aesthetic rather than a staged showroom feel.

---

### 10. Character Concept Art

**Prompt:**
```
Full-body character concept art of a cyberpunk street medic, female, mid-30s, augmented left arm with visible circuitry and a built-in medical scanner, wearing a weathered tactical vest with red cross patches over a hoodie, neon-lit rain-soaked alley background, character turnaround sheet style with front and three-quarter views --ar 16:9 --stylize 250 --chaos 10 --v 7
```

**Expected Output:** A detailed character design showing the subject from multiple angles. The cyberpunk aesthetic will include neon reflections on wet surfaces, visible technological augmentation details, and a lived-in quality to the clothing and gear. The concept art style will balance detail with readability, suitable for use as reference material for 3D modelers or illustrators.

## V6/V7 Syntax Differences

| Feature | V6 | V7 |
|---|---|---|
| Default behavior | Literal prompt following | Personalized + aesthetic |
| Personalization | Not available | `--p` flag, learns your style |
| Draft Mode | Not available | `--draft` for fast iteration |
| Omni Reference | Not available | `--oref` for character consistency |
| Text rendering | ~60% accuracy | ~95% accuracy |
| GPU consumption | 1x baseline | 2x baseline |
| Prompt style | Natural language | Natural language (improved) |

## Tips for Consistent Results

1. **Save working prompts**: When you find a prompt structure that works, save it as a template.
2. **Use --seed for reproducibility**: Add `--seed 12345` to get reproducible results (same seed + same prompt = same output).
3. **Iterate with Draft Mode**: Use `--draft` to explore ideas cheaply, then remove it for final quality.
4. **Leverage Style References**: Upload reference images with `--sref` to maintain consistent aesthetics across a project.
5. **Use Omni Reference for characters**: `--oref` keeps characters consistent across scenes, essential for storytelling and branding.


---
## Media

> **Tags:** `midjourney` · `ai-image` · `image-generation` · `discord` · `v6` · `text-to-image`

### Platform
![midjourney logo](https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png)
*Source: Official midjourney branding — [midjourney](https://docs.midjourney.com)*

### Official Resources
- [Official Documentation](https://docs.midjourney.com)
- [Gallery / Showcase](https://www.midjourney.com/explore)
- [Midjourney Quick Start Guide](https://docs.midjourney.com/docs/quick-start)
- [Midjourney Community Showcase](https://www.midjourney.com/explore)

### Video Tutorials
- [Midjourney Tutorial for Beginners - Full Guide 2026](https://www.youtube.com/results?search_query=midjourney+tutorial+beginners+2026) — *Credit: Skills Factory on YouTube* `tutorial`
- [The Ultimate Beginner's Guide to Midjourney](https://www.youtube.com/results?search_query=ultimate+beginners+guide+midjourney+2025) — *Credit: AI Art Community on YouTube* `tutorial`
- [Midjourney V6 Prompting Masterclass](https://www.youtube.com/results?search_query=midjourney+v6+prompting+masterclass) — *Credit: AI Tutorials on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
