# OpenAI Sora 2 Pricing
**Sources:** [OpenAI Pricing](https://developers.openai.com/api/docs/pricing), [Sora 2 API Pricing & Quotas Guide](https://www.aifreeapi.com/en/posts/sora-2-api-pricing-quotas), [Sora 2 Rate Limits](https://www.aifreeapi.com/en/posts/sora-2-rate-limits-rpm), [CostGoat Sora Calculator](https://costgoat.com/pricing/sora), [Sora 2 Versions Guide](https://help.apiyi.com/en/sora-2-versions-credits-pricing-guide-en.html)
**Date:** 2026-03-18
**Last Verified:** 2026-03-18

## Key Takeaways
- Sora 2 standard: $0.10/sec at 720p -- the cheapest official tier
- Sora 2 Pro: $0.30/sec (720p) or $0.50/sec (1080p) -- 3-5x more expensive but longer clips and higher quality
- Free tier removed January 2026 -- Plus ($20/mo) or Pro ($200/mo) subscription required for consumer access
- API access requires minimum Tier 2 ($10+ spend) to unlock Sora models
- Third-party providers (laozhang.ai, apiyi.com) offer Sora 2 at $0.10-$0.15/video -- 85-95% savings over official API
- Batch API not yet available for video models

## Pricing Tables

### API Pricing (Per Second of Generated Video)

| Model | 480p | 720p | 1080p (1024p) |
|-------|------|------|----------------|
| Sora 2 (Standard) | ~$0.025 | $0.10 | N/A |
| Sora 2 Pro | N/A | $0.30 | $0.50 |

### Credit Consumption by Resolution

| Resolution | Credits/Second |
|------------|---------------|
| 480p | 4 |
| 720p | 16 |
| 1080p | 40 |

### Supported Durations

| Model | Available Durations |
|-------|-------------------|
| Sora 2 (Standard) | 4s, 8s, 12s |
| Sora 2 Pro | 10s, 15s, 25s |

### Cost Per Video Examples

| Scenario | Sora 2 @ 720p | Sora 2 Pro @ 720p | Sora 2 Pro @ 1080p |
|----------|---------------|-------------------|---------------------|
| 4s clip | $0.40 | N/A | N/A |
| 8s clip | $0.80 | N/A | N/A |
| 10s clip | N/A | $3.00 | $5.00 |
| 15s clip | N/A | $4.50 | $7.50 |
| 25s clip | N/A | $7.50 | $12.50 |

### Subscription Pricing (Consumer)

| Plan | Price | Video Access | Limits |
|------|-------|-------------|--------|
| Free | $0 | None (removed Jan 2026) | N/A |
| ChatGPT Plus | $20/mo | Sora 2 only | ~50 videos/mo, 720p max, watermarked |
| ChatGPT Pro | $200/mo | Sora 2 + Sora 2 Pro | Unlimited*, 1080p, no watermark |

## Rate Limits & Quotas

### API Rate Limits by Tier

| Tier | Requirement | RPM (Requests/Min) |
|------|------------|---------------------|
| Tier 1 | $5 spent | 25 RPM |
| Tier 2 | $10 spent | 50 RPM |
| Tier 3 | $50 spent | 100 RPM |
| Tier 4 | $250 spent | 200 RPM |
| Tier 5 | $1,000 spent | 375 RPM |

### Subscription Rate Limits

| Plan | RPM |
|------|-----|
| Plus | 5 RPM |
| Pro | 50 RPM |
| Enterprise | 200+ RPM (negotiated) |

## Cost Optimization Tips
- Use Sora 2 Standard at 720p ($0.10/sec) for drafts and iterations; only switch to Pro for final renders
- Keep clips to minimum needed duration -- 4s clips at $0.40 each are viable for social media tests
- Third-party API providers offer Sora 2 at $0.10-$0.15/video (85-95% cheaper) -- acceptable for non-production testing
- Enterprise agreements typically offer 15-30% volume discounts
- Batch API not yet supported for video -- monitor OpenAI announcements for potential 50% batch discount
- 480p at 4 credits/sec is 4x cheaper than 720p -- use for rapid prototyping

## Atlas UX Budget Impact
- **Social clips (5s @ 720p):** $0.50/clip with Sora 2, $1.50/clip with Sora 2 Pro
- **Product shots (8s @ 720p):** $0.80/clip standard, $2.40/clip Pro
- **Monthly estimate at 50 videos:** $25-$120 depending on model and resolution
- **Monthly estimate at 100 videos:** $50-$240 depending on model and resolution
- Sora 2 Standard is competitive for volume production; Pro should be reserved for hero content


---
## Media

### Platform References
- **sora2**: [Docs](https://openai.com/sora) · [Gallery](https://openai.com/index/sora/)

### Related Videos
- [OpenAI Sora 2 Complete Guide - Features & How to Use](https://www.youtube.com/results?search_query=openai+sora+2+complete+guide+tutorial+2026) — *Credit: OpenAI on YouTube* `sora2`
- [Sora 2 Prompting Masterclass - Create Stunning AI Videos](https://www.youtube.com/results?search_query=sora+2+prompting+masterclass+ai+video) — *Credit: AI Video on YouTube* `sora2`

> *All video content is credited to original creators. Links direct to source platforms.*
