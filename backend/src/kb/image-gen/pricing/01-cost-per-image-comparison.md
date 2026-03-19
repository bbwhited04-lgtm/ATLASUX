---
title: "Cost Per Image Comparison — All Major AI Image Generators (2026)"
category: "image-gen"
tags: ["comparison", "pricing", "ai-image", "cost-per-image", "midjourney", "dall-e", "flux", "stability-ai", "firefly", "leonardo", "ideogram", "runway", "google-imagen", "freepik"]
updated: "2026-03-19"
---

# Cost Per Image Comparison — All Major AI Image Generators (2026)

Side-by-side cost comparison for generating a single standard-quality image (~1024x1024) across every major platform, covering free tiers, subscription plans, API pricing, and volume economics.

---

## Quick Reference: Cost Per Image (Standard Quality, ~1MP)

| Platform | Free Tier | Cheapest Sub | Cost/Image (Sub) | API Cost/Image | Best Bulk Rate |
|----------|-----------|-------------|-------------------|----------------|----------------|
| **Midjourney** | None | $10/mo (Basic) | ~$0.03-0.05 | No official API | ~$0.02 (Mega) |
| **DALL-E 3** | Via ChatGPT Free (limited) | ChatGPT Plus $20/mo | Included in sub | $0.040 (std 1024x1024) | $0.040 (no bulk discount) |
| **GPT Image 1** | Via ChatGPT Free (limited) | ChatGPT Plus $20/mo | Included in sub | $0.020 (low quality) | $0.005 (Mini, low) |
| **GPT Image 1.5** | None | N/A | N/A | $0.040 (standard) | $0.040 |
| **Stability AI (Ultra)** | None | $10/1000 credits | $0.08/image | $0.08 | $0.03 (Core model) |
| **Stability AI (Core)** | None | $10/1000 credits | $0.03/image | $0.03 | $0.03 |
| **Stability AI (SDXL)** | None | $10/1000 credits | ~$0.004 | ~$0.004 | ~$0.002 (low steps) |
| **FLUX.2 (Pro)** | None | Pay-per-use | N/A | $0.05 (BFL) / $0.03 (fal.ai) | $0.03 (fal.ai) |
| **FLUX.2 (Klein)** | None | Pay-per-use | N/A | $0.014 (BFL) | $0.014 |
| **Adobe Firefly** | 25 credits/mo | $9.99/mo (Standard) | ~$0.005 (std gen) | ~$0.02-0.10 | ~$0.005 (unlimited std) |
| **Leonardo.ai** | 150 tokens/day | $12/mo (Apprentice) | ~$0.008-0.02 | ~$0.006-0.015 | ~$0.003 (top-up bulk) |
| **Freepik AI** | 20 gens/day | $5.75/mo (Essential) | Varies by model | No public API | Unlimited (Premium+) |
| **Ideogram** | 10 prompts/day (40 imgs) | $8/mo (Basic) | ~$0.005 | $0.05 (via Replicate/fal) | ~$0.005 (sub) |
| **Runway** | 125 one-time credits | $12/mo (Standard) | ~$0.15-0.30 | Per-credit | ~$0.08 (Unlimited plan) |
| **Google Imagen 4 (Fast)** | None | Pay-per-use (GCP) | N/A | $0.02 | $0.01 (Batch API 50% off) |
| **Google Imagen 4 (Ultra)** | None | Pay-per-use (GCP) | N/A | $0.06 | $0.03 (Batch API) |
| **Recraft V3** | 50 credits/day | $10/mo (Basic) | ~$0.01 | $0.04 (raster) / $0.08 (vector) | $0.022 (Recraft 20B) |

---

## Detailed Platform Breakdown

### 1. Midjourney

| Plan | Monthly | Annual (per mo) | GPU Time | Est. Images/mo | Cost/Image |
|------|---------|----------------|----------|-----------------|------------|
| Basic | $10 | $8 | 3.3 hrs (fast) | ~200 | ~$0.04-0.05 |
| Standard | $30 | $24 | 15 hrs (fast) + unlimited relaxed | ~900+ | ~$0.03 |
| Pro | $60 | $48 | 30 hrs (fast) + unlimited relaxed | ~1,800+ | ~$0.03 |
| Mega | $120 | $96 | 60 hrs (fast) + unlimited relaxed | ~3,600+ | ~$0.02-0.03 |

- **Free tier:** None. Subscription required.
- **Stealth mode:** Pro and Mega only.
- **No official API** — third-party API wrappers exist but violate ToS.
- **20% discount** on annual billing.

### 2. OpenAI (DALL-E 3 / GPT Image 1 / GPT Image 1.5)

**DALL-E 3 API:**

| Quality | 1024x1024 | 1024x1792 / 1792x1024 |
|---------|-----------|------------------------|
| Standard | $0.040 | $0.080 |
| HD | $0.080 | $0.120 |

**GPT Image 1 API:**

| Quality | Square (1024x1024) | Portrait/Landscape |
|---------|-------------------|-------------------|
| Low | $0.020 | $0.020 |
| Medium | $0.070 | ~$0.070 |
| High | $0.190 | ~$0.190 |

**GPT Image 1 Mini:** $0.005/image (low quality) — cheapest OpenAI option.

**GPT Image 1.5 API:** ~$0.040/image (standard) — highest quality OpenAI model.

- **Free tier:** Limited generations via ChatGPT free plan.
- **ChatGPT Plus ($20/mo):** Includes image generation (rate-limited).
- **No bulk discounts** on API pricing.

### 3. Stability AI

**API Credit Pricing (1 credit = $0.01):**

| Model | Credits/Image | Cost/Image |
|-------|---------------|------------|
| Stable Image Ultra (SD3.5 Large) | 8 | $0.08 |
| Stable Image Core | 3 | $0.03 |
| SD3.5 Large | 3.5 | $0.035 |
| SDXL 1.0 | 0.2-0.6 | $0.002-0.006 |

- **DreamStudio:** $10 buys 1,000 credits. New accounts get 25-200 free credits.
- **Self-hosted:** SDXL and SD3.5 are open-weight; can run on own GPU for $0/image (after hardware cost).

### 4. FLUX (Black Forest Labs)

**BFL Direct API (1 credit = $0.01):**

| Model | Cost/Image (1MP) | Notes |
|-------|------------------|-------|
| FLUX.2 Max | ~$0.06 | Highest quality |
| FLUX.2 Pro | ~$0.05 | Production quality |
| FLUX.2 Klein | $0.014 | Fast, affordable |

**Via fal.ai:**

| Model | Cost/Image (1MP) |
|-------|-----------------|
| FLUX.2 Pro | $0.03 |
| FLUX.2 Dev | ~$0.025 |
| FLUX.1 Schnell | ~$0.003 |

**Via Replicate:** Billed per-second of GPU time; typically 30-50% more expensive than fal.ai.

- **Megapixel pricing:** Cost scales with output resolution. Extra MP adds ~$0.015 each.
- **FLUX.1 Schnell** is open-source and can be self-hosted.

### 5. Adobe Firefly

| Plan | Monthly | Credits/mo | Cost/Image (Std) | Cost/Image (Premium) |
|------|---------|------------|------------------|---------------------|
| Free | $0 | 25 | $0 (limited) | N/A |
| Standard | $9.99 | 2,000 | Unlimited std gens | ~$0.005 |
| Pro | $19.99 | 4,000 | Unlimited std gens | ~$0.005 |
| Premium | $199.99 | 50,000 | Unlimited std gens | ~$0.004 |

**Firefly Services API:** ~$0.02/image (pay-as-you-go), tiered enterprise pricing from $1,000/mo.

- **Commercially safe:** Trained on licensed Adobe Stock content only.
- **Unlimited standard generations** on all paid plans (credits only for premium features).

### 6. Leonardo.ai

| Plan | Monthly | Tokens/mo | Est. Images | Cost/Image |
|------|---------|-----------|-------------|------------|
| Free | $0 | 150/day (~4,500/mo) | ~560-900 | $0 |
| Apprentice | $12 | 8,500 | ~1,060-1,700 | ~$0.007-0.011 |
| Artisan | $30 ($24 annual) | 25,000 | ~3,125-5,000 | ~$0.006-0.010 |
| Maestro | $60+ | 60,000 | ~7,500-12,000 | ~$0.005-0.008 |

**API Top-ups:** $15 for 5,000 credits, $30 for 10,000, $75 for 25,000 (~$0.003/credit at bulk).

- **Token cost varies:** 5-8 tokens per standard generation, more for complex operations.
- **Free tier** is generous (150 tokens/day).

### 7. Freepik AI

| Plan | Monthly (Annual) | AI Generations |
|------|-----------------|----------------|
| Free | $0 | 20/day |
| Essential | $5.75 | Limited credits |
| Premium | $12 | Most models unlimited |
| Premium+ | $24.50 | Unlimited (most models) |

- **No public API** for image generation.
- **Credit costs vary wildly:** 1-500 credits/image depending on model and resolution.
- **Best value:** Premium+ at $24.50/mo for unlimited generations.

### 8. Ideogram

| Plan | Monthly | Prompts/mo (x4 images) | Total Images | Cost/Image |
|------|---------|------------------------|-------------|------------|
| Free | $0 | 10/day (~300/mo) | ~1,200 | $0 |
| Basic | $8 | 400 | ~1,600 | ~$0.005 |
| Plus | $15 | 1,000 | ~4,000 | ~$0.004 |
| Pro | $20 | 3,000 | ~12,000 | ~$0.002 |

**API:** ~$0.05/image via Replicate/fal.ai. No public BYO API yet.

- **Best-in-class text rendering** in generated images.
- **Free tier** is very generous.

### 9. Runway

| Plan | Monthly (Annual) | Credits/mo | Focus |
|------|-----------------|------------|-------|
| Free | $0 | 125 (one-time) | Trial |
| Standard | $12 | Refreshing | Video + Image |
| Pro | $28 | 2,250 | Video + Image |
| Unlimited | $76 | Unlimited (relaxed) | Video + Image |

- **Primarily a video platform** — image generation is secondary.
- **Cost per image** is higher than dedicated image generators (~$0.10-0.30/image on credits).
- **API pricing** is per-credit, enterprise-focused.

### 10. Google Imagen (Vertex AI)

| Model | Cost/Image | Batch API (50% off) |
|-------|-----------|---------------------|
| Imagen 4 Fast | $0.02 | $0.01 |
| Imagen 4 Standard | $0.04 | $0.02 |
| Imagen 4 Ultra | $0.06 | $0.03 |
| Upscale (1K to 4K) | $0.003 | $0.0015 |

- **No subscription** — pure pay-per-use via Google Cloud.
- **Batch API discount:** 50% off for non-real-time workloads.
- **Combined:** 4K image via Fast + Upscale = $0.023 ($0.0115 batch).
- **Requires GCP account** and Vertex AI API enablement.

### 11. Recraft

| Plan | Monthly | Credits/mo | Cost/Image (Raster) |
|------|---------|-----------|---------------------|
| Free | $0 | 50/day | $0 |
| Basic | $10 | 1,000 | ~$0.01 |
| Advanced | $27 | 4,000 | ~$0.007 |
| Pro | $48 | 8,400 | ~$0.006 |

**API:** Recraft V3 at $0.04/raster, $0.08/vector. Recraft 20B at $0.022/raster, $0.044/vector.

- **Unique vector output** — only platform generating true SVG/vector images.
- **Creative Upscale:** $0.25/image via API.

---

## Volume Cost Comparison

### 100 Images/Month

| Platform | Best Option | Monthly Cost |
|----------|------------|-------------|
| Ideogram (Free) | Free tier | $0 |
| Leonardo (Free) | Free tier | $0 |
| Freepik (Free) | Free tier | $0 |
| Recraft (Free) | Free tier | $0 |
| Google Imagen 4 Fast | Pay-per-use | $2.00 |
| FLUX.2 Klein (BFL) | Pay-per-use | $1.40 |
| FLUX.2 Pro (fal.ai) | Pay-per-use | $3.00 |
| DALL-E 3 (API) | Pay-per-use | $4.00 |
| Stability Core (API) | Pay-per-use | $3.00 |
| Midjourney | Basic plan | $10.00 |
| Adobe Firefly | Standard plan | $9.99 |

### 500 Images/Month

| Platform | Best Option | Monthly Cost |
|----------|------------|-------------|
| Ideogram | Plus ($15/mo, 4000 imgs) | $15.00 |
| Leonardo | Apprentice ($12/mo) | $12.00 |
| Freepik | Premium ($12/mo unlimited) | $12.00 |
| Recraft | Advanced ($27/mo, 4000 imgs) | $27.00 |
| Google Imagen 4 Fast | Pay-per-use | $10.00 |
| FLUX.2 Klein (BFL) | Pay-per-use | $7.00 |
| FLUX.2 Pro (fal.ai) | Pay-per-use | $15.00 |
| GPT Image 1 Mini | Pay-per-use | $2.50 |
| Stability Core (API) | Pay-per-use | $15.00 |
| Midjourney | Standard plan | $30.00 |
| Adobe Firefly | Standard plan | $9.99 |

### 1,000 Images/Month

| Platform | Best Option | Monthly Cost |
|----------|------------|-------------|
| Ideogram | Pro ($20/mo, 12000 imgs) | $20.00 |
| Leonardo | Artisan ($30/mo) | $30.00 |
| Freepik | Premium+ ($24.50/mo unlimited) | $24.50 |
| Recraft | Pro ($48/mo, 8400 imgs) | $48.00 |
| Google Imagen 4 Fast | Pay-per-use | $20.00 |
| Google Imagen 4 Fast | Batch API | $10.00 |
| FLUX.2 Klein (BFL) | Pay-per-use | $14.00 |
| FLUX.2 Pro (fal.ai) | Pay-per-use | $30.00 |
| GPT Image 1 Mini | Pay-per-use | $5.00 |
| Stability Core (API) | Pay-per-use | $30.00 |
| Midjourney | Standard plan (relaxed) | $30.00 |
| Adobe Firefly | Standard plan (unlimited std) | $9.99 |

---

## Key Takeaways

1. **Cheapest per image (API):** GPT Image 1 Mini at $0.005/image, followed by Google Imagen 4 Fast Batch at $0.01/image.
2. **Best free tier:** Ideogram (40 images/day), Leonardo (150 tokens/day), Freepik (20 gens/day).
3. **Best subscription value:** Adobe Firefly Standard at $9.99/mo for unlimited standard generations; Ideogram Pro at $20/mo for 12,000 images.
4. **Best for volume API:** Google Imagen 4 Fast Batch ($0.01/image) or FLUX.2 Klein ($0.014/image).
5. **Most expensive:** Runway (video-focused platform with high per-image costs) and GPT Image 1 High Quality ($0.19/image).
6. **No API available:** Midjourney (no official API), Freepik (no public API).


---
## Media

### Platform References
- **midjourney**: [Docs](https://docs.midjourney.com) · [Gallery](https://www.midjourney.com/explore)
- **flux**: [Docs](https://docs.bfl.ml) · [Gallery](https://blackforestlabs.ai)
- **stability-ai**: [Docs](https://platform.stability.ai/docs) · [Gallery](https://stability.ai)
- **ideogram**: [Docs](https://developer.ideogram.ai/docs) · [Gallery](https://ideogram.ai/explore)
- **adobe-firefly**: [Docs](https://helpx.adobe.com/firefly/using/what-is-firefly.html) · [Gallery](https://firefly.adobe.com/gallery)
- **runway**: [Docs](https://docs.runwayml.com) · [Gallery](https://runwayml.com/research)
- **google-imagen**: [Docs](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview) · [Gallery](https://deepmind.google/technologies/imagen-3/)
- **freepik-ai**: [Docs](https://www.freepik.com/ai/image-generator) · [Gallery](https://www.freepik.com/ai/image-generator)

### Related Videos
- [Midjourney Tutorial for Beginners - Full Guide 2026](https://www.youtube.com/results?search_query=midjourney+tutorial+beginners+2026) — *Credit: Skills Factory on YouTube* `midjourney`
- [The Ultimate Beginner's Guide to Midjourney](https://www.youtube.com/results?search_query=ultimate+beginners+guide+midjourney+2025) — *Credit: AI Art Community on YouTube* `midjourney`
- [Flux AI Image Generation - Complete Tutorial](https://www.youtube.com/results?search_query=flux+ai+image+generation+tutorial+2025) — *Credit: AI Art on YouTube* `flux`
- [Flux vs Stable Diffusion vs DALL-E - Which AI Model Wins?](https://www.youtube.com/results?search_query=flux+vs+stable+diffusion+vs+dall-e+comparison) — *Credit: AI Reviews on YouTube* `flux`
- [Stable Diffusion 3.5 Tutorial - Complete Beginner's Guide](https://www.youtube.com/results?search_query=stable+diffusion+3.5+tutorial+beginners) — *Credit: SD Tutorials on YouTube* `stability-ai`
- [Stable Diffusion Installation Guide 2025](https://www.youtube.com/results?search_query=stable+diffusion+installation+guide+2025) — *Credit: AI Art on YouTube* `stability-ai`

> *All video content is credited to original creators. Links direct to source platforms.*
