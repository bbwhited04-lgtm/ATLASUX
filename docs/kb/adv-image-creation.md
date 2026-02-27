# AI Image Creation & Generation

## Overview

AI image generation has transformed visual content production from a bottleneck into a scalable, on-demand capability. For businesses running autonomous agent platforms like Atlas UX, visual assets can be produced at the speed of content strategy rather than the speed of creative staffing.

Within Atlas UX, **Venny** (Image Production Specialist) owns the visual asset pipeline, reporting to Sunday and coordinating with all publisher agents. **Victor** (Video Production Specialist) reports to Venny and handles video content, often requesting stills and thumbnails from Venny.

---

## Image Generation Models

### DALL-E 3 (OpenAI)

Primary model for Venny. Strong prompt adherence, good compositional understanding, built-in content policy filtering.

```typescript
const response = await openai.images.generate({
  model: "dall-e-3",
  prompt: "A futuristic command center with holographic displays, dark navy background (#0f172a), cyan and blue accent lighting, minimalist modern design, no text, no watermarks, professional",
  n: 1,
  size: "1792x1024",
  quality: "hd",        // or "standard"
  style: "vivid",        // or "natural"
  response_format: "url",
});
```

| Quality  | Resolution  | Cost/Image |
|----------|-------------|------------|
| Standard | 1024x1024   | $0.040     |
| Standard | 1024x1792   | $0.080     |
| HD       | 1024x1024   | $0.080     |
| HD       | 1024x1792   | $0.120     |

**Limitations:** No native inpainting, unreliable text rendering (Atlas UX policy: never rely on DALL-E 3 for text), 1 image per request, org-level rate limits.

### Midjourney

Exceptional aesthetic quality for artistic and photorealistic styles. Operates via Discord and web interface.

```
/imagine A data scientist at a holographic dashboard, cyberpunk aesthetic,
dark navy tones, cyan neon accents --ar 16:9 --v 6.1 --style raw --q 2
```

Key params: `--ar` (aspect ratio), `--v` (version), `--style raw` (literal interpretation), `--no` (negative elements), `--s` (stylize 0-1000). Commercial use requires paid plan ($30+/mo).

### Stable Diffusion (Stability AI)

Leading open-source model. Full pipeline control (samplers, LoRAs, embeddings), ControlNet for guided generation, native inpainting/outpainting/img2img, fine-tuning on custom datasets.

| Deployment     | Latency | Cost        | Control  |
|----------------|---------|-------------|----------|
| Local (GPU)    | 5-15s   | Hardware    | Full     |
| Replicate      | 10-30s  | ~$0.01/img  | High     |
| RunPod         | 5-20s   | GPU rental  | Full     |
| Stability API  | 5-15s   | $0.01-0.05  | Moderate |

**Best for:** High-volume generation, custom fine-tuned brand models, inpainting/ControlNet workflows.

### Adobe Firefly

Trained exclusively on licensed data (Adobe Stock, public domain). Carries IP indemnity under enterprise plans -- the safest choice for client-facing materials where copyright exposure matters. API requires Adobe enterprise subscription; less stylistic range than competitors.

### Flux (Black Forest Labs)

Latest-generation open-weight model from former Stability AI researchers. State-of-the-art prompt adherence, strong photorealism, excellent text rendering.

| Tier    | Speed | Quality   | Use Case                    |
|---------|-------|-----------|-----------------------------|
| Schnell | ~1s   | Good      | Drafts, previews, iteration |
| Dev     | ~10s  | Very Good | Production assets           |
| Pro     | ~15s  | Excellent | Hero images, premium assets |

### Ideogram

Best-in-class text rendering in images. Use when text in the image is unavoidable (event posters, infographics with labels). Atlas UX brand guidelines generally prohibit AI-generated text, but Ideogram is the fallback.

### Leonardo AI

Specialized for game assets, character design, and concept art. Pre-trained style models, real-time canvas, texture/pattern generation. Best for creative exploration and interactive workflows.

### Model Selection Guide

| Use Case              | Primary     | Fallback     | Reason                       |
|-----------------------|-------------|--------------|------------------------------|
| Blog hero images      | DALL-E 3    | Flux Pro     | API integration, brand ctrl  |
| Social media posts    | DALL-E 3    | Flux Dev     | Speed, consistency           |
| Images with text      | Ideogram    | Firefly      | Text rendering reliability   |
| Client-facing ads     | Firefly     | DALL-E 3     | Commercial licensing safety  |
| High-volume batch     | Stable Diff | Flux Schnell | Cost per image               |
| Artistic/editorial    | Midjourney  | Flux Pro     | Aesthetic quality            |
| Custom brand style    | Stable Diff | Leonardo     | Fine-tuning capability       |

---

## Prompt Engineering for Images

### Anatomy of a Good Prompt

Five components: `[Subject] + [Style] + [Composition] + [Lighting/Mood] + [Constraints]`

**Venny's standard template:**
```
A network of interconnected AI agents as luminous nodes on a circuit board,
digital art style, centered composition with depth of field,
dark navy background (#0f172a), cyan and blue accent lighting with soft glow,
minimalist modern design, no text, no watermarks, high quality, professional
```

### Negative Prompts

Supported natively in Stable Diffusion/Flux; implicitly in DALL-E 3 ("no text, no watermarks").

```
text, watermark, signature, blurry, low quality, deformed, distorted,
extra limbs, extra fingers, cropped, out of frame, ugly, duplicate
```

Categories: quality defects, composition errors, anatomy issues, unwanted elements, style conflicts.

### Style Modifiers

| Modifier               | Effect                                | Best For                    |
|------------------------|---------------------------------------|-----------------------------|
| `photorealistic`       | Camera-like realism                   | Product shots, testimonials |
| `digital illustration` | Clean vector-like art                 | Blog headers, explainers   |
| `3D render`            | Volumetric, material-based            | Product mockups, tech       |
| `cinematic`            | Dramatic lighting, film grain         | Hero images, landing pages  |
| `flat design`          | Geometric, solid colors, no shadows   | Icons, UI elements          |
| `cyberpunk`            | Neon accents, dark atmosphere         | Atlas UX brand-aligned      |
| `isometric`            | Top-down 3D perspective               | Infographics, diagrams      |

### Aspect Ratios and Resolution

DALL-E 3 sizes: `1024x1024` (1:1), `1024x1792` (9:16), `1792x1024` (16:9). For other ratios, generate at the closest supported size and crop/resize in post-production.

### Seed Values and Reproducibility

```typescript
// Stable Diffusion / Flux -- fixed seed for reproducibility
const params = { prompt: "...", seed: 42, num_inference_steps: 30, guidance_scale: 7.5 };
```

Use fixed seeds to iterate on compositions, create series with visual consistency, and reproduce approved results. DALL-E 3 does not expose seed control -- save the revised prompt from the API response instead.

### Iterative Refinement

1. **Start broad, narrow down** -- add modifiers one at a time
2. **img2img** -- feed a promising result back as a starting point (SD, Flux)
3. **Reference images** -- Midjourney and IP-Adapter accept style references
4. **Prompt weighting** -- `(element:1.5)` to emphasize, `(element:0.5)` to de-emphasize (SD)
5. **Batch and compare** -- generate 4-8 variations, select the best

---

## Image Editing & Enhancement

### Inpainting and Outpainting

Inpainting replaces selected regions; outpainting extends beyond original boundaries. Venny uses inpainting to fix DALL-E 3 artifacts before delivery.

```typescript
// DALL-E 2 inpainting (DALL-E 3 does not support edits directly)
const response = await openai.images.edit({
  image: fs.createReadStream("original.png"),
  mask: fs.createReadStream("mask.png"),
  prompt: "A clean navy background with subtle grid pattern",
  n: 1, size: "1024x1024",
});
```

### Background Removal, Upscaling, Style Transfer, Face Restoration

| Task              | Tools                                      | Notes                              |
|-------------------|--------------------------------------------|------------------------------------|
| Background removal| remove.bg API, rembg (open source), SAM    | Essential for avatars, compositing |
| Upscaling         | Real-ESRGAN (free), Topaz ($99), Stability | 2x-6x scale; use when 1024px insufficient |
| Style transfer    | Neural style transfer, IP-Adapter          | Align cross-model output to brand  |
| Face restoration  | GFPGAN, CodeFormer, RestoreFormer          | Fix AI face artifacts              |

---

## Brand Consistency

### Brand Style Guide for AI

Atlas UX brand prompt components (always included by Venny):
```
dark navy background (#0f172a), cyan and blue accent lighting,
minimalist modern design, clean composition, no text, no watermarks,
high quality, professional
```

| Color      | Hex       | Prompt Usage                         |
|------------|-----------|--------------------------------------|
| Navy       | `#0f172a` | "dark navy background (#0f172a)"     |
| Slate Dark | `#1e293b` | "slate dark secondary surface"       |
| Cyan       | `#22d3ee` | "cyan accent lighting", "cyan glow"  |
| Blue       | `#3b82f6` | "blue accent elements"               |

Enforce palette by including hex codes in prompts and adding off-brand colors to negative prompts.

### Typography, Logo, Templates

- **Text:** Never AI-generated. Added in post-production or by the UI layer. Ideogram fallback only when unavoidable.
- **Logo:** Composited onto images programmatically (bottom-right, 10% width, with padding). Never generated.
- **Templates:** Venny uses prompt templates with variable slots for recurring asset types:

```typescript
const blogHeader = (topic: string, mood: string) =>
  `A ${mood} representation of ${topic}, digital art, wide landscape, ` +
  `dark navy background (#0f172a), cyan and blue accent lighting, ` +
  `minimalist, no text, no watermarks, professional`;
```

---

## Business Use Cases

| Use Case          | Dimensions   | Agent       | Notes                              |
|-------------------|-------------|-------------|------------------------------------|
| X / Twitter post  | 1200 x 675  | Kelly       | Bold focal point, high contrast    |
| Facebook post     | 1200 x 630  | Fran        | Community-oriented, approachable   |
| Instagram feed    | 1080 x 1080 | Dwight      | Eye-catching, detail-rich          |
| Instagram story   | 1080 x 1920 | Dwight      | Vertical, immersive                |
| LinkedIn post     | 1200 x 628  | Link        | Professional, data-driven          |
| Pinterest pin     | 1000 x 1500 | Cornwall    | Vertical, aspirational             |
| TikTok cover      | 1080 x 1920 | Timmy       | Via Victor for video               |
| Tumblr post       | 1280 x 1920 | Terry       | Creative, expressive               |
| Blog hero         | 1200 x 630  | Reynolds    | Landscape, editorial               |
| Email header      | 600 x 200   | Sunday      | Simple, <500KB, fast loading       |
| Ad creative       | Variable    | Penny       | 4-6 A/B variants per concept       |
| Presentation      | 1920 x 1080 | Any         | Minimal composition for text room  |

---

## Atlas UX Integration

### Venny's Automated Pipeline

```
Brief (Sunday/publisher) --> Parse brief --> Construct prompt (brand template + specifics)
  --> API call (DALL-E 3 primary, fallback models) --> Quality check (dimensions, artifacts, brand)
    --> Upload to Supabase (kb_uploads bucket) --> Audit log --> Deliver signed URL
```

Failed quality checks trigger regeneration (up to 3 attempts) before escalating to Sunday.

### Cost Control

Tina (CFO) sets daily/monthly budgets. Venny checks before every generation:

```typescript
const dailySpend = await getDailyImageSpend(tenantId);
const dailyLimit = await getTenantConfig(tenantId, "DAILY_IMAGE_BUDGET_USD");
if (dailySpend + estimatedCost > dailyLimit) {
  await createDecisionMemo({
    type: "BUDGET_OVERRIDE", amount: estimatedCost,
    reason: "Daily image budget exceeded", requester: "venny", approver: "tina",
  });
  return;
}
```

### Asset Storage

```
tenants/{tenantId}/images/
  blog/    social/    ui/    agents/    ads/    email/
```

Naming: `[date]-[type]-[description]-[dimensions].[ext]`
Metadata: timestamp, model, prompt, dimensions, file size, publisher agent.

---

## Quality Control

### Artifact Detection

| Artifact              | Fix                                |
|-----------------------|------------------------------------|
| Extra/missing fingers | Inpaint or regenerate              |
| Text gibberish        | Inpaint to remove or overlay       |
| Asymmetric faces      | GFPGAN face restoration            |
| Object blending       | Adjust prompt spacing              |
| Color bleed           | Add off-brand color to neg prompt  |

### Brand Compliance Checklist

1. Background: dark navy/slate (never white/light)
2. Accents: cyan/blue spectrum only
3. No AI-generated text
4. Clean, minimalist composition
5. Correct platform dimensions and file size limits
6. No real people's likenesses

### Legal and Provenance

- **Copyright:** DALL-E 3 and Firefly carry lowest legal risk (licensed training data). Prefer Firefly for IP-indemnified commercial assets.
- **Attribution:** DALL-E 3 requires none; Midjourney owned by subscriber; SD depends on model license.
- **Provenance:** DALL-E 3 embeds C2PA metadata automatically. For other models, Venny adds provenance during upload.
- **Disclosure:** Emerging regulations may require AI-generation disclosure. Atlas UX logs model and prompt in all asset metadata.

---

## Cost Optimization

| Stakes | Examples                  | Model             | Cost/Image  |
|--------|---------------------------|--------------------|-------------|
| High   | Ads, landing pages        | DALL-E 3 HD / Flux Pro | $0.08-0.12 |
| Medium | Blog headers, social      | DALL-E 3 Standard  | $0.04-0.08  |
| Low    | Internal docs, placeholders| Flux Schnell / SD | $0.01-0.02  |
| Draft  | Iteration, concept review | Flux Schnell       | ~$0.005     |

**Strategies:** Use `standard` quality for social (reserve `hd` for hero/ads); search existing library before generating; cache reusable backgrounds; generate at 1024px and upscale with Real-ESRGAN when cost-justified; batch related requests (hero first, then derive platform variants).

**Monthly projection (typical tenant):**

| Category         | Volume | Model         | Monthly Cost |
|------------------|--------|---------------|-------------|
| Blog heroes      | 20     | DALL-E 3 HD   | $2.40       |
| Social posts     | 60     | DALL-E 3 Std  | $2.40       |
| Ad variations    | 30     | DALL-E 3 Std  | $1.20       |
| Email headers    | 8      | DALL-E 3 Std  | $0.32       |
| Drafts/iteration | 40     | Flux Schnell  | $0.20       |
| **Total**        | **158**|               | **~$6.52**  |

Monthly image generation costs stay under $10 per tenant, well within Tina's default budget allocation.
