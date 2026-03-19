---
title: "FLUX Pricing Guide"
platform: "flux"
category: "image-gen"
tags: ["flux", "black-forest-labs", "ai-image", "pricing", "api-costs", "self-hosted"]
updated: "2026-03-19"
---

# FLUX Pricing Guide

## Pricing Philosophy

FLUX offers a uniquely tiered pricing structure in the AI image generation market. The open-weight models (Schnell, Klein, Dev) can be run locally at zero per-image cost, while the Pro variants are available through the BFL API and third-party hosts on a pay-per-image or pay-per-megapixel basis. This gives teams the flexibility to choose between convenience (API) and cost optimization (self-hosted).

## Open / Free Models

### FLUX.1 [schnell]
- **License:** Apache 2.0 (fully open, commercial use allowed)
- **API Cost:** Free on many platforms; ~$0.003/image on Replicate
- **Self-Hosted Cost:** $0 per image (GPU electricity + hardware amortization only)
- **Best For:** High-volume batch generation, real-time applications, prototyping

### FLUX.2 [klein]
- **License:** Apache 2.0 (fully open, commercial use allowed)
- **BFL API Cost:** Starting at $0.014/image
- **Self-Hosted Cost:** $0 per image (runs on 8GB VRAM consumer GPUs)
- **Best For:** Real-time generation, edge deployment, mobile applications

### FLUX.1 [dev] / FLUX.2 [dev]
- **License:** Open non-commercial (requires paid license for commercial use)
- **BFL Commercial License:** Available for purchase (contact BFL for pricing)
- **Third-Party API Cost:** ~$0.025/image (Replicate, fal.ai, Together AI)
- **Self-Hosted Cost:** $0 per image for non-commercial use
- **Best For:** Development, research, fine-tuning, non-commercial projects

## BFL Official API Pricing

BFL uses a credit-based system where 1 credit = $0.01 USD. Pricing is identical for API and Playground usage.

| Model | Per-Image Cost | Resolution | Notes |
|-------|---------------|------------|-------|
| FLUX.1 [pro] | $0.055 | Up to 1MP | Legacy model |
| FLUX 1.1 [pro] | $0.04 | Up to 1MP | Faster, improved quality |
| FLUX 1.1 [pro] Ultra | $0.06 | Up to 4MP | High-resolution output |
| FLUX.2 [pro] | ~$0.03-0.06 | Up to 4MP | Megapixel-based pricing |
| FLUX.2 [flex] | ~$0.03-0.06 | Up to 4MP | Megapixel-based pricing |
| FLUX.2 [klein] | $0.014+ | Up to 1MP | Budget-friendly API option |

FLUX.2 models use megapixel-based pricing where cost scales with output resolution. A 1MP image costs less than a 4MP image. The base rate for FLUX.2 Pro is approximately $0.015 + $0.015 per input/output megapixel.

## Third-Party API Hosts

### Replicate

| Model | Per-Image Cost | Notes |
|-------|---------------|-------|
| FLUX.1 [schnell] | $0.003 | Cheapest option |
| FLUX.1 [dev] | $0.025 | Good balance |
| FLUX.1 [pro] | $0.055 | High quality |
| FLUX 1.1 [pro] | $0.04 | Recommended |
| FLUX 1.1 [pro] Ultra | $0.06 | 4MP output |
| FLUX.2 [dev] | ~$0.012/MP | Megapixel pricing |
| FLUX.2 [pro] | ~$0.015 + $0.015/MP | Megapixel pricing |

Replicate charges based on GPU compute time, so actual costs can vary slightly with image complexity and resolution.

### fal.ai

| Model | Per-Image Cost | Notes |
|-------|---------------|-------|
| FLUX [dev] | $0.025 | Per image flat rate |
| FLUX 1.1 [pro] | $0.04/MP | Megapixel pricing |
| FLUX.2 [pro] | $0.03/MP | Competitive rate |

fal.ai offers fast inference with competitive pricing and serverless deployment.

### Together AI

| Model | Per-Image Cost | Notes |
|-------|---------------|-------|
| FLUX [dev] | $0.025 | Flat rate |
| FLUX [schnell] | $0.003 | Budget option |

### DeepInfra

| Model | Per-Image Cost | Notes |
|-------|---------------|-------|
| FLUX.2 [dev] | $0.025 | Standard pricing |
| FLUX.2 [schnell] | $0.015 | Budget option |

DeepInfra offers some of the lowest prices for FLUX inference.

## Self-Hosted GPU Requirements

Running FLUX locally eliminates per-image costs but requires upfront hardware investment.

### Full Precision (FP16)

| Model | Minimum VRAM | Recommended VRAM | Example GPU |
|-------|-------------|-------------------|-------------|
| FLUX.1 [schnell] | 12 GB | 16-24 GB | RTX 4070 Ti / RTX 4090 |
| FLUX.1 [dev] | 16 GB | 24 GB | RTX 4090 / A5000 |
| FLUX.2 [dev] | 24 GB | 48 GB | RTX 4090 / A6000 |
| FLUX.2 [klein] | 8 GB | 12 GB | RTX 4060 Ti / RTX 4070 |

### Quantized (GGUF-Q8)

Quantization cuts VRAM requirements nearly in half with ~99% quality retention:

| Model | VRAM Required | Example GPU |
|-------|--------------|-------------|
| FLUX.1 [schnell] | 6-8 GB | RTX 3060 12GB |
| FLUX.1 [dev] | 8-12 GB | RTX 4060 Ti |
| FLUX.2 [klein] | 4-6 GB | RTX 3060 / laptop GPUs |

System RAM: 16 GB minimum, 24-32 GB recommended for loading model checkpoints.

## API vs Local Cost Comparison

### Scenario: 10,000 images/month using FLUX.1 Dev equivalent

| Approach | Monthly Cost | Notes |
|----------|-------------|-------|
| BFL API (FLUX 1.1 Pro) | $400 | $0.04 x 10,000 |
| Replicate (FLUX Dev) | $250 | $0.025 x 10,000 |
| fal.ai (FLUX Dev) | $250 | $0.025 x 10,000 |
| Self-hosted RTX 4090 | ~$30-50 | Electricity only (amortized GPU ~$25/mo over 5 years) |
| Cloud GPU (A100 hourly) | ~$150-300 | ~$2/hr, depends on utilization |

### Break-Even Analysis

At $0.025/image via API, self-hosting on a $1,600 RTX 4090 breaks even at approximately 64,000 images (about 6 months at 10K images/month). For lower volumes (under 2,000 images/month), API access is more cost-effective when factoring in maintenance overhead.

## Cost Tracking for Production

When integrating FLUX into a production platform, track costs per tenant:

- Store the model variant and resolution used per generation
- Log API response metadata (credits consumed, processing time)
- Set per-tenant daily/monthly generation limits
- Alert on unusual usage spikes
- Consider caching frequently-requested generations


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
- [Flux vs Stable Diffusion vs DALL-E - Which AI Model Wins?](https://www.youtube.com/results?search_query=flux+vs+stable+diffusion+vs+dall-e+comparison) — *Credit: AI Reviews on YouTube* `review`
- [Flux AI Image Generation - Complete Tutorial](https://www.youtube.com/results?search_query=flux+ai+image+generation+tutorial+2025) — *Credit: AI Art on YouTube* `tutorial`
- [Installing Flux in ComfyUI - Step by Step](https://www.youtube.com/results?search_query=flux+comfyui+installation+tutorial) — *Credit: ComfyUI on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
