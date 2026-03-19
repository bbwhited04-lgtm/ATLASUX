---
title: "Midjourney Pricing Plans"
platform: "midjourney"
category: "image-gen"
tags: ["midjourney", "ai-image", "pricing", "plans", "gpu-hours", "cost-analysis"]
updated: "2026-03-19"
---

# Midjourney Pricing Plans

## Plan Overview

Midjourney offers four subscription tiers. There is no free tier. All plans include commercial usage rights for generated images.

| Feature | Basic | Standard | Pro | Mega |
|---|---|---|---|---|
| Monthly Price | $10/mo | $30/mo | $60/mo | $120/mo |
| Annual Price | $8/mo ($96/yr) | $24/mo ($288/yr) | $48/mo ($576/yr) | $96/mo ($1,152/yr) |
| Fast GPU Hours | ~3.3 hrs | 15 hrs | 30 hrs | 60 hrs |
| Relaxed Mode | Limited | Unlimited | Unlimited | Unlimited |
| Turbo Mode | Yes (2x cost) | Yes (2x cost) | Yes (2x cost) | Yes (2x cost) |
| Concurrent Jobs | 3 | 3 | 12 | 12 |
| Stealth Mode | No | No | Yes | Yes |
| Commercial Use | Yes | Yes | Yes | Yes |

## How GPU Hours Work

### Fast Mode

Fast mode uses priority GPU processing. Your generation starts immediately (or near-immediately) and is deducted from your monthly fast hour allocation. A standard V7 generation (4-image grid) takes approximately 30-60 seconds and consumes roughly 1 minute of fast time. V7 uses 2x the GPU time of V6, so the same prompt costs twice as much in fast hours compared to the previous model version.

### Relaxed Mode

Available on Standard ($30) and above, Relaxed mode queues your generation behind Fast users. Wait times vary from 1-10 minutes depending on system load. Relaxed mode does not consume fast hours and is unlimited on Standard, Pro, and Mega plans. This is the most cost-effective way to generate large volumes of images. Basic plan users have limited Relaxed access.

### Turbo Mode

Turbo mode provides the highest GPU priority and fastest generation times. It costs 2x your fast hours per generation. Use it when speed is critical and you have hours to spare.

### Draft Mode (V7)

V7 introduced Draft Mode, which generates rough concept images 10x faster at half the GPU cost. This is ideal for iterating on prompt concepts before committing to full-quality renders. Add `--draft` to your prompt to use it.

## Cost Per Image Analysis

The cost per image depends on plan tier, GPU mode, and model version. Below are estimates based on V7 standard generations (approximately 1 minute of GPU time per 4-image grid, so ~0.25 minutes per individual image).

### Monthly Billing

| Plan | Monthly Cost | Fast Hours | Est. Images (Fast) | Cost/Image (Fast) | Cost/Image (Relaxed) |
|---|---|---|---|---|---|
| Basic | $10 | 3.3 hrs (198 min) | ~792 images | ~$0.013 | Limited availability |
| Standard | $30 | 15 hrs (900 min) | ~3,600 images | ~$0.008 | ~$0 (unlimited) |
| Pro | $60 | 30 hrs (1,800 min) | ~7,200 images | ~$0.008 | ~$0 (unlimited) |
| Mega | $120 | 60 hrs (3,600 min) | ~14,400 images | ~$0.008 | ~$0 (unlimited) |

### Annual Billing (20% Discount)

| Plan | Monthly Cost | Est. Images (Fast) | Cost/Image (Fast) |
|---|---|---|---|
| Basic | $8 | ~792 images | ~$0.010 |
| Standard | $24 | ~3,600 images | ~$0.007 |
| Pro | $48 | ~7,200 images | ~$0.007 |
| Mega | $96 | ~14,400 images | ~$0.007 |

### Important Notes on Cost Calculations

- V7 uses 2x GPU time vs V6, effectively halving your image output per fast hour compared to V6.
- Upscaling, variations, and re-rolls consume additional GPU time.
- Turbo mode doubles GPU consumption again (4x vs V6 baseline).
- Draft Mode halves GPU consumption, making it the most economical option for exploration.
- Relaxed mode is effectively free per image (unlimited on Standard+), making it the best value for non-time-sensitive work.

## Stealth Mode

Available on Pro ($60) and Mega ($120) plans only. Stealth mode prevents your generated images from appearing in Midjourney's public gallery and community feeds. Without stealth mode, all generations are visible to other users on the Midjourney website. This is critical for:

- Commercial projects under NDA
- Brand work before public launch
- Competitive creative work
- Any project requiring confidentiality

## Commercial Usage Rights

All four plans include commercial usage rights. You can use Midjourney-generated images for:

- Marketing materials, advertisements, social media
- Products (merchandise, prints, book covers, packaging)
- Client work and freelance projects
- Website and app assets

The key restriction: if your company has more than $1 million in annual gross revenue, you must be on a Pro or Mega plan to use images commercially.

## Extra Fast Hours

If you exhaust your monthly fast hours, you can purchase additional fast GPU time. Extra hours are billed at approximately $4/hr. This is significantly more expensive per image than the base subscription rate, so plan your tier accordingly.

## Plan Selection Guide

| Use Case | Recommended Plan | Reasoning |
|---|---|---|
| Hobbyist / exploration | Basic ($10) | Enough for casual use, ~800 images/month |
| Content creator / blogger | Standard ($30) | Unlimited Relaxed mode for volume |
| Professional designer | Pro ($60) | Stealth mode, 30 fast hrs, 12 concurrent |
| Agency / team production | Mega ($120) | Maximum fast hours, highest throughput |
| Automated pipeline | Not recommended | No public API; consider DALL-E or Flux instead |

## Comparison to Competitors

| Platform | Entry Price | Cost/Image (Approx.) | API Available |
|---|---|---|---|
| Midjourney Basic | $10/mo | $0.01-0.013 (fast) | No (enterprise only) |
| Midjourney Standard | $30/mo | $0.008 (fast), ~$0 (relaxed) | No (enterprise only) |
| DALL-E 3 (via OpenAI) | Pay-per-use | $0.04-0.08 | Yes |
| Flux Pro (via API) | Pay-per-use | $0.03-0.05 | Yes |
| Stable Diffusion | Free (self-host) | Hardware cost only | Yes (self-host or API) |

Midjourney offers the lowest per-image cost of any major commercial generator when using Relaxed mode on Standard or above. However, the lack of a public API makes it unsuitable for programmatic workflows that competitors handle natively.


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
