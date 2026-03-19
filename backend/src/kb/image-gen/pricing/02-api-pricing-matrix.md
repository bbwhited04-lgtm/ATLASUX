---
title: "API Pricing Matrix — AI Image Generation APIs (2026)"
category: "image-gen"
tags: ["comparison", "pricing", "ai-image", "api", "dall-e", "stability-ai", "flux", "ideogram", "leonardo", "google-imagen", "recraft", "openai"]
updated: "2026-03-19"
---

# API Pricing Matrix — AI Image Generation APIs (2026)

Detailed API-specific pricing for every platform offering programmatic image generation. Covers per-call costs, rate limits, authentication, and bulk discount structures.

---

## Provider Comparison Matrix

| Provider | Model | Cost/Image (1MP) | Auth Method | Rate Limit | Bulk Discount | Min Spend |
|----------|-------|-----------------|-------------|------------|---------------|-----------|
| **OpenAI** | DALL-E 3 (std) | $0.040 | API key | 7 img/min (free), 7/min (paid) | None | None |
| **OpenAI** | DALL-E 3 (HD) | $0.080 | API key | 7 img/min | None | None |
| **OpenAI** | GPT Image 1 (low) | $0.020 | API key | Per-model limits | None | None |
| **OpenAI** | GPT Image 1 (med) | $0.070 | API key | Per-model limits | None | None |
| **OpenAI** | GPT Image 1 (high) | $0.190 | API key | Per-model limits | None | None |
| **OpenAI** | GPT Image 1 Mini (low) | $0.005 | API key | Per-model limits | None | None |
| **OpenAI** | GPT Image 1.5 (std) | $0.040 | API key | Per-model limits | None | None |
| **Stability AI** | Stable Image Ultra | $0.080 | API key | 150 req/10s | Credit packs | $10 min top-up |
| **Stability AI** | Stable Image Core | $0.030 | API key | 150 req/10s | Credit packs | $10 min top-up |
| **Stability AI** | SD3.5 Large | $0.035 | API key | 150 req/10s | Credit packs | $10 min top-up |
| **Stability AI** | SDXL 1.0 | $0.002-0.006 | API key | 150 req/10s | Credit packs | $10 min top-up |
| **BFL (FLUX)** | FLUX.2 Max | ~$0.060 | API key | Not published | None | Pay-per-use |
| **BFL (FLUX)** | FLUX.2 Pro | ~$0.050 | API key | Not published | None | Pay-per-use |
| **BFL (FLUX)** | FLUX.2 Klein | $0.014 | API key | Not published | None | Pay-per-use |
| **fal.ai** | FLUX.2 Pro | $0.030 | API key | Generous | None | Pay-per-use |
| **fal.ai** | FLUX.2 Dev | ~$0.025 | API key | Generous | None | Pay-per-use |
| **fal.ai** | FLUX.1 Schnell | ~$0.003 | API key | Generous | None | Pay-per-use |
| **Replicate** | FLUX.2 Pro | ~$0.045 | API key | Per-model | None | Pay-per-use |
| **Replicate** | FLUX.1 Schnell | ~$0.005 | API key | Per-model | None | Pay-per-use |
| **Google** | Imagen 4 Fast | $0.020 | GCP service account | Per-project quotas | 50% batch discount | GCP account |
| **Google** | Imagen 4 Standard | $0.040 | GCP service account | Per-project quotas | 50% batch discount | GCP account |
| **Google** | Imagen 4 Ultra | $0.060 | GCP service account | Per-project quotas | 50% batch discount | GCP account |
| **Ideogram** | Ideogram 2.0 | ~$0.050 | Via Replicate/fal | Provider limits | Enterprise volume | Via provider |
| **Leonardo** | Phoenix/Creative Engine | ~$0.006-0.015 | API key | Plan-dependent | Top-up packs | $15 min top-up |
| **Recraft** | Recraft V3 (raster) | $0.040 | API key | Not published | None | Pay-per-use |
| **Recraft** | Recraft V3 (vector) | $0.080 | API key | Not published | None | Pay-per-use |
| **Recraft** | Recraft 20B (raster) | $0.022 | API key | Not published | None | Pay-per-use |
| **Adobe** | Firefly Services | $0.020-0.100 | OAuth/API key | Enterprise tiers | Committed use | $1,000/mo min |

---

## Detailed Provider Breakdowns

### OpenAI (DALL-E 3 + GPT Image Family)

**Endpoint:** `POST https://api.openai.com/v1/images/generations`

**DALL-E 3 Pricing by Resolution:**

| Resolution | Standard | HD |
|-----------|----------|-----|
| 1024x1024 | $0.040 | $0.080 |
| 1024x1792 | $0.080 | $0.120 |
| 1792x1024 | $0.080 | $0.120 |

**GPT Image 1 Pricing by Quality:**

| Quality | Square | Portrait/Landscape |
|---------|--------|-------------------|
| Low | $0.020 | $0.020 |
| Medium | $0.070 | $0.070 |
| High | $0.190 | $0.190 |

**GPT Image 1 Mini:** $0.005 (low), ~$0.015 (medium), ~$0.040 (high).

**GPT Image 1.5:** ~$0.040 (standard quality). Highest quality model in OpenAI's lineup.

**Rate Limits:**
- Free tier: 7 images/minute
- Tier 1 ($5+ spend): 7 images/minute
- Tier 2-5: Increases with spend history
- No batch discount or committed use pricing

**Key Notes:**
- Token-based billing for GPT Image models (text input tokens + image output tokens)
- DALL-E 3 is flat per-image pricing
- All models support `n=1` only (no batch generation in single call for DALL-E 3)
- GPT Image models support `n=1-4` images per request

---

### Stability AI

**Endpoint:** `POST https://api.stability.ai/v2beta/stable-image/generate/{model}`

**Credit System (1 credit = $0.01):**

| Model | Credits/Image | USD/Image |
|-------|--------------|-----------|
| Stable Image Ultra (SD3.5 Large) | 8 | $0.080 |
| Stable Image Core | 3 | $0.030 |
| SD3.5 Large (direct) | 3.5 | $0.035 |
| SDXL 1.0 (512x512, 30 steps) | 0.2 | $0.002 |
| SDXL 1.0 (1024x1024, 50 steps) | 0.6 | $0.006 |

**Credit Packs:**
- $10 for 1,000 credits
- New accounts: 25-200 free credits
- Credits do not expire

**Rate Limits:** 150 requests per 10 seconds.

**Additional Operations:**
- Image-to-image: Same credit cost as generation
- Inpainting: Same credit cost
- Upscaling: 0.2-1 credit depending on model

**Key Notes:**
- Open-weight models (SDXL, SD3.5) can be self-hosted to eliminate API costs entirely
- Legacy models (SD 1.6, Stable Video Diffusion) deprecated as of July 2025
- SD3.0 APIs auto-upgraded to SD3.5 at no extra cost

---

### Black Forest Labs (FLUX) — Direct API

**Endpoint:** `POST https://api.bfl.ml/v1/flux-{model}`

**Megapixel-Based Pricing (1 credit = $0.01):**

| Model | Base Cost (1MP) | Per Extra MP | Notes |
|-------|----------------|-------------|-------|
| FLUX.2 Max | ~$0.060 | ~$0.015 | Highest quality |
| FLUX.2 Pro | ~$0.050 | ~$0.015 | Production standard |
| FLUX.2 Klein | $0.014 | ~$0.007 | Fast, lightweight |

**Key Notes:**
- Same price for API and Playground usage
- Cost scales linearly with output resolution (megapixel-based)
- Async generation — poll for results via task ID
- No monthly minimums, pure pay-per-use

---

### fal.ai (Multi-Model Host)

**Endpoint:** `POST https://fal.run/{model-id}`

**FLUX Models on fal.ai:**

| Model | Cost/Image (1MP) | Per Extra MP |
|-------|-----------------|-------------|
| FLUX.2 Pro | $0.030 | $0.015 |
| FLUX.2 Dev | ~$0.025 | ~$0.012 |
| FLUX.1 Pro | ~$0.025 | ~$0.012 |
| FLUX.1 Schnell | ~$0.003 | ~$0.002 |

**Other Models on fal.ai:**

| Model | Cost/Image |
|-------|-----------|
| Stable Diffusion XL | ~$0.005 |
| Ideogram 2.0 | ~$0.050 |
| Recraft V3 | ~$0.040 |

**Key Notes:**
- 600+ models available
- Typically 30-50% cheaper than Replicate for the same models
- Fast cold-start times
- WebSocket support for real-time generation
- No minimum spend

---

### Replicate

**Endpoint:** `POST https://api.replicate.com/v1/predictions`

**Pricing Model:** Per-second of GPU compute time, varies by hardware.

| Model | Typical Cost/Image | GPU Used |
|-------|-------------------|----------|
| FLUX.2 Pro | ~$0.045 | A100 |
| FLUX.1 Schnell | ~$0.005 | T4/A40 |
| SDXL | ~$0.008 | A40 |
| Ideogram 2.0 | ~$0.050 | A100 |

**Key Notes:**
- 200+ image models available
- Billed per-second of actual compute (cold starts may add cost)
- Hardware-dependent pricing
- Custom model hosting available (fine-tuned models)
- Generally more expensive than fal.ai for equivalent models

---

### Google Vertex AI (Imagen)

**Endpoint:** Vertex AI `predict` endpoint via GCP SDK

**Imagen 4 Pricing:**

| Variant | Cost/Image | Batch API (50% off) |
|---------|-----------|---------------------|
| Imagen 4 Fast | $0.020 | $0.010 |
| Imagen 4 Standard | $0.040 | $0.020 |
| Imagen 4 Ultra | $0.060 | $0.030 |

**Additional Operations:**

| Operation | Cost |
|-----------|------|
| Upscale (1K to 4K) | $0.003 |
| Edit/Inpaint | Same as generation |

**Batch API Strategy:** Generate at 1K ($0.02) + Upscale to 4K ($0.003) = $0.023 per 4K image. With Batch API: $0.0115 per 4K image.

**Key Notes:**
- Requires Google Cloud Platform account
- Per-project quotas (request increases via GCP console)
- Batch API provides 50% discount for non-real-time workloads
- Safety filters are strict and non-configurable
- Supports image editing and inpainting

---

### Leonardo.ai

**Endpoint:** `POST https://cloud.leonardo.ai/api/rest/v1/generations`

**Token-Based Pricing:**
- Standard generation: 5-8 tokens per image
- Complex operations: Up to 20+ tokens

**API Credit Top-ups:**

| Pack | Credits | Price | Cost/Credit |
|------|---------|-------|-------------|
| Small | 5,000 | $15.00 | $0.003 |
| Medium | 10,000 | $30.00 | $0.003 |
| Large | 25,000 | $75.00 | $0.003 |

**Effective cost per image:** ~$0.006-0.015 depending on model and settings.

**Key Notes:**
- API access requires paid plan (Apprentice+)
- Opaque credit-based pricing model
- Specialized models for game assets, character design
- Supports ControlNet, img2img, inpainting

---

### Recraft

**Endpoint:** `POST https://external.api.recraft.ai/v1/images/generations`

**Per-Image API Pricing:**

| Model | Raster | Vector (SVG) |
|-------|--------|-------------|
| Recraft V3 | $0.040 | $0.080 |
| Recraft 20B | $0.022 | $0.044 |

**Additional API Operations:**

| Operation | Cost |
|-----------|------|
| Creative Upscale | $0.250 |
| Crisp Upscale | $0.004 |
| Erase Region | $0.002 |
| Vectorization | $0.010 |
| Remove Background | $0.010 |

**Key Notes:**
- Only platform offering true vector/SVG output via API
- OpenAI-compatible API format
- No minimum spend, pure pay-per-use
- Style presets available via API parameters

---

### Adobe Firefly Services

**Access:** Enterprise-only API, requires Adobe Developer Console.

**Pricing:**
- Pay-as-you-go: ~$0.02-0.10 per image generation
- Enterprise committed use: Tiered pricing from $1,000/mo
- Premium features (video, translation) cost additional credits

**Key Notes:**
- Requires enterprise agreement for API access
- Commercially safe (trained on licensed content only)
- Integrates with Adobe Creative Cloud workflows
- Not suitable for small-scale or indie developer use due to $1,000/mo minimum

---

## Rate Limit Comparison

| Provider | Free Tier Limit | Paid Tier Limit | Burst Capacity |
|----------|----------------|-----------------|----------------|
| OpenAI | 7 img/min | 7-50 img/min (tier-dependent) | Limited |
| Stability AI | N/A | 150 req/10s | High |
| BFL (FLUX) | N/A | Not published | Moderate |
| fal.ai | N/A | Generous (undisclosed) | High |
| Replicate | N/A | Per-model | Moderate |
| Google Vertex | Per-project quota | Request increase via GCP | High (with quota) |
| Leonardo | Plan-dependent | Plan-dependent | Low-Moderate |
| Recraft | N/A | Not published | Moderate |

---

## Best API for Each Scenario

| Scenario | Best Provider | Cost | Why |
|----------|--------------|------|-----|
| **Cheapest possible** | GPT Image 1 Mini (low) | $0.005/img | Lowest per-image cost of any API |
| **Cheapest quality image** | Google Imagen 4 Fast (batch) | $0.01/img | 50% batch discount, great quality |
| **Best quality/cost ratio** | FLUX.2 Pro via fal.ai | $0.03/img | Near-top quality at low price |
| **Highest quality** | GPT Image 1.5 | $0.04/img | LM Arena leader |
| **Best for text in images** | Ideogram via fal.ai | $0.05/img | Best text rendering |
| **Vector/SVG output** | Recraft V3 | $0.08/img | Only true vector API |
| **Self-hostable** | Stability AI SDXL | $0.00/img* | Open weights, run on own GPU |
| **Commercially safest** | Adobe Firefly Services | $0.02-0.10/img | Licensed training data only |
| **Highest throughput** | Stability AI | 150 req/10s | Best published rate limits |

*Hardware costs not included for self-hosted.


---
## Media

### Platform References
- **flux**: [Docs](https://docs.bfl.ml) · [Gallery](https://blackforestlabs.ai)
- **stability-ai**: [Docs](https://platform.stability.ai/docs) · [Gallery](https://stability.ai)
- **ideogram**: [Docs](https://developer.ideogram.ai/docs) · [Gallery](https://ideogram.ai/explore)
- **adobe-firefly**: [Docs](https://helpx.adobe.com/firefly/using/what-is-firefly.html) · [Gallery](https://firefly.adobe.com/gallery)
- **google-imagen**: [Docs](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview) · [Gallery](https://deepmind.google/technologies/imagen-3/)

### Related Videos
- [Flux AI Image Generation - Complete Tutorial](https://www.youtube.com/results?search_query=flux+ai+image+generation+tutorial+2025) — *Credit: AI Art on YouTube* `flux`
- [Flux vs Stable Diffusion vs DALL-E - Which AI Model Wins?](https://www.youtube.com/results?search_query=flux+vs+stable+diffusion+vs+dall-e+comparison) — *Credit: AI Reviews on YouTube* `flux`
- [Stable Diffusion 3.5 Tutorial - Complete Beginner's Guide](https://www.youtube.com/results?search_query=stable+diffusion+3.5+tutorial+beginners) — *Credit: SD Tutorials on YouTube* `stability-ai`
- [Stable Diffusion Installation Guide 2025](https://www.youtube.com/results?search_query=stable+diffusion+installation+guide+2025) — *Credit: AI Art on YouTube* `stability-ai`
- [Ideogram AI Tutorial - Text in Images Perfected](https://www.youtube.com/results?search_query=ideogram+ai+tutorial+text+images+2025) — *Credit: AI Reviews on YouTube* `ideogram`
- [Ideogram 2.0 - Best AI for Typography](https://www.youtube.com/results?search_query=ideogram+2.0+typography+ai+review) — *Credit: AI Art on YouTube* `ideogram`

> *All video content is credited to original creators. Links direct to source platforms.*
