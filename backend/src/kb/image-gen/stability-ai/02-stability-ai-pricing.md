---
title: "Stability AI Pricing — API Credits, Per-Image Costs & Self-Hosted Economics"
platform: "stability-ai"
category: "image-gen"
tags: ["stability-ai", "stable-diffusion", "pricing", "api-credits", "dreamstudio", "self-hosted", "gpu-costs"]
updated: "2026-03-19"
---

# Stability AI Pricing — API Credits, Per-Image Costs & Self-Hosted Economics

## API Credit System

The Stability AI API uses a credit-based pricing model. Credits are purchased in bundles and consumed per generation based on the model tier, resolution, and step count.

**Credit Purchase Rate:** $10 per 1,000 credits

### Per-Generation Credit Costs by Model

| Model | Credits per Image | Approx. Cost per Image |
|-------|------------------|----------------------|
| Stable Image Ultra | 8.0 credits | $0.080 |
| SD 3.5 Large | 6.5 credits | $0.065 |
| SD 3.5 Large Turbo | 4.0 credits | $0.040 |
| SD 3.5 Medium | 3.5 credits | $0.035 |
| SDXL 1.0 | 0.2-6.0 credits | $0.002-$0.060 |
| SD 3 (legacy) | 3.5 credits | $0.035 |

**Note:** SDXL costs vary significantly based on resolution and step count. A basic 512x512 image at 10 steps costs approximately 0.2 credits ($0.002), while a high-quality 1024x1024 image at 50+ steps can cost 6+ credits ($0.06).

### Additional API Operations

| Operation | Credits per Request | Approx. Cost |
|-----------|-------------------|--------------|
| Image-to-Image (SDXL) | 0.2-6.0 credits | $0.002-$0.060 |
| Inpainting (SDXL) | 0.2-6.0 credits | $0.002-$0.060 |
| Upscaling (4x) | 8.0 credits | $0.080 |
| Background Removal | 2.0 credits | $0.020 |
| Search & Replace | 4.0 credits | $0.040 |

## DreamStudio Pricing

DreamStudio is Stability AI's hosted web interface with the same credit system as the API.

- **Free tier:** 25-200 complimentary credits for new accounts (enough for 100-200 basic SDXL images)
- **Credit purchase:** $10 per 1,000 credits (same rate as API)
- **No subscription required** — pure pay-as-you-go

### DreamStudio Credit Consumption Examples

| Configuration | Credits Used | Cost |
|--------------|-------------|------|
| SDXL, 512x512, 10 steps | 0.2 credits | $0.002 |
| SDXL, 1024x1024, 30 steps | 2.8 credits | $0.028 |
| SDXL, 1024x1024, 50 steps | 6.0 credits | $0.060 |
| SDXL, 1024x1024, 150 steps | 28.2 credits | $0.282 |
| Stable Image Ultra, default | 8.0 credits | $0.080 |

## Self-Hosted Costs (Running Locally)

One of Stable Diffusion's primary advantages is that models are open-source/open-weight and can be run locally at zero marginal cost per image after initial hardware investment.

### GPU Hardware Requirements

| Model | Minimum VRAM | Recommended VRAM | Example GPUs |
|-------|-------------|-----------------|-------------|
| SD 1.5 | 4 GB | 6-8 GB | RTX 3060, RTX 4060 |
| SD 2.1 | 4 GB | 6-8 GB | RTX 3060, RTX 4060 |
| SDXL | 8 GB | 12 GB | RTX 3060 12GB, RTX 4070 |
| SDXL Turbo | 8 GB | 12 GB | RTX 3060 12GB, RTX 4070 |
| SD 3.5 Medium | 8 GB | 10-12 GB | RTX 4060 Ti, RTX 4070 |
| SD 3.5 Large | 12 GB (FP8) | 18-24 GB | RTX 4090, A5000, A6000 |
| SD 3.5 Large (full) | 18 GB | 24 GB | RTX 4090, A5000, A6000 |

### Consumer GPU Price Points (New, Early 2026)

| GPU | VRAM | Approx. Price | Best For |
|-----|------|--------------|---------|
| RTX 4060 | 8 GB | $280-320 | SD 1.5, SDXL (tight) |
| RTX 4060 Ti 16GB | 16 GB | $400-450 | SDXL, SD 3.5 Medium |
| RTX 4070 Ti Super | 16 GB | $750-800 | SDXL, SD 3.5 Medium, fast |
| RTX 4090 | 24 GB | $1,600-2,000 | All models including SD 3.5 Large |
| RTX 5090 | 32 GB | $2,000-2,500 | All models, maximum headroom |

### Cloud GPU Costs (Self-Hosted on Cloud)

| Provider | GPU | Hourly Cost | Images/Hour (SDXL) | Cost per Image |
|----------|-----|------------|--------------------|--------------|
| RunPod | RTX 4090 | $0.44/hr | ~200-400 | $0.001-$0.002 |
| Vast.ai | RTX 4090 | $0.30-0.50/hr | ~200-400 | $0.001-$0.002 |
| Lambda | A10G | $0.60/hr | ~150-300 | $0.002-$0.004 |
| AWS (g5) | A10G | $1.01/hr | ~150-300 | $0.003-$0.007 |

## API vs. Self-Hosted Economics

### Break-Even Analysis

At SDXL quality level:
- **API cost:** ~$0.02-$0.06 per image (depending on settings)
- **Cloud self-hosted cost:** ~$0.001-$0.004 per image
- **Local hardware:** $0.00 marginal cost after GPU purchase

**Break-even for local RTX 4090 ($1,800) vs. API at $0.03/image:**
- 60,000 images to break even
- At 100 images/day: ~20 months to recoup hardware cost
- At 500 images/day: ~4 months to recoup

**Break-even for cloud GPU vs. API:**
- Cloud GPU becomes cheaper at as few as 50-100 images per hour
- For batch generation workflows producing 1,000+ images/day, cloud self-hosted can be 10-30x cheaper than the API

### When to Use Each Option

| Scenario | Best Option | Why |
|----------|------------|-----|
| Prototyping, < 100 images/month | DreamStudio/API | No setup, instant access |
| Production, 100-1,000 images/month | API | Predictable costs, no maintenance |
| High volume, 1,000+ images/day | Self-hosted (cloud or local) | 10-30x cost savings |
| Privacy-sensitive (medical, legal) | Self-hosted (local) | Data never leaves your machine |
| Custom model training/fine-tuning | Self-hosted (local) | Required for LoRA/checkpoint training |
| One-off projects, variable demand | API | No idle cost, scale to zero |

## Comparison with Competitors (API Pricing)

| Provider | Cost per Image | Notes |
|----------|---------------|-------|
| Stability AI (SDXL) | $0.002-$0.06 | Cheapest tier, variable by settings |
| Stability AI (Ultra) | $0.08 | Premium tier |
| Midjourney | ~$0.04-$0.12 | Subscription-based ($30-60/mo) |
| DALL-E 3 (OpenAI) | $0.04-$0.12 | Per-image, no subscription option |
| Google Imagen 3 | $0.03-$0.06 | Via Vertex AI |
| Flux Pro (Black Forest Labs) | $0.05-$0.06 | Via API partners |

## Deprecated Models

As of July 2025, Stable Diffusion 1.6 API endpoints have been deprecated. Users should migrate to SDXL or newer models for API access. SD 1.5 remains available for self-hosted use through community checkpoints.


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
