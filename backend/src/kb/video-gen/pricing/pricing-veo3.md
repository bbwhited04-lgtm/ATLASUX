# Google Veo 3 Pricing
**Sources:** [Vertex AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing), [Google Developers Blog - Veo 3 in Gemini API](https://developers.googleblog.com/veo-3-now-available-gemini-api/), [Veo 3.1 Pricing Guide](https://www.veo3gen.app/blog/veo-3-1-pricing-plans), [CostGoat Veo Calculator](https://costgoat.com/pricing/google-veo), [Veo 3.1 Rate Limits](https://www.aifreeapi.com/en/posts/veo-3-1-api-rate-limit)
**Date:** 2026-03-18
**Last Verified:** 2026-03-18

## Key Takeaways
- Veo 3.0: $0.50/sec (video only), $0.75/sec (video + audio) -- most expensive tier
- Veo 3.1 reduced pricing to $0.40/sec standard, $0.15/sec fast -- significant price drop
- Veo 3 Fast at $0.15/sec is the cheapest first-party API option among premium models
- No free tier on Vertex AI as of March 2026
- Consumer plans (AI Pro $19.99/mo, AI Ultra $249.99/mo) have very low daily limits (3-5 videos/day)
- Third-party providers (fal.ai, Replicate) offer Veo 3.1 Fast from ~$0.10/sec
- Native audio generation available -- a differentiator vs Sora 2

## Pricing Tables

### Vertex AI / Gemini API Pricing (Per Second)

| Model | 720p/1080p | 4K (8s max) |
|-------|-----------|-------------|
| Veo 3.0 (video only) | $0.50 | N/A |
| Veo 3.0 (video + audio) | $0.75 | N/A |
| Veo 3.1 Standard | $0.40 | $0.60 |
| Veo 3.1 Fast | $0.15 | $0.35 |

### Cost Per Video Examples

| Duration | Veo 3.0 (video) | Veo 3.0 (+audio) | Veo 3.1 Standard | Veo 3.1 Fast |
|----------|-----------------|-------------------|-------------------|--------------|
| 5s @ 1080p | $2.50 | $3.75 | $2.00 | $0.75 |
| 8s @ 1080p | $4.00 | $6.00 | $3.20 | $1.20 |
| 8s @ 4K | N/A | N/A | $4.80 | $2.80 |

### Consumer Subscription Plans

| Plan | Price | Videos/Day | Max Resolution | Audio |
|------|-------|-----------|----------------|-------|
| AI Pro | $19.99/mo | 3 | 720p | Yes |
| AI Ultra | $249.99/mo | 5 | 1080p | Yes |

### Effective Cost via Consumer Plans

| Plan | Max Videos/Mo (30 days) | Effective $/Video (8s) |
|------|------------------------|----------------------|
| AI Pro | 90 | ~$0.22/video |
| AI Ultra | 150 | ~$1.67/video |

Note: AI Pro is cost-effective per video but severely rate-limited (3/day). Not viable for production volume.

## Rate Limits & Quotas

### API Rate Limits

| Tier | Requirement | RPM |
|------|------------|-----|
| Preview models | Default | 10 RPM, 10 concurrent |
| Production models | Default | 50 RPM |
| Tier 2 | $250+ spent, 30+ days | Higher (request increase) |
| Tier 3 | $1,000+ spent, 30+ days | Higher (request increase) |

- Quota increases are NOT automatic -- must submit request through Google Cloud Console with business justification
- Maximum video duration: 8 seconds (1080p), 8 seconds (4K)

## Cost Optimization Tips
- Use Veo 3.1 Fast ($0.15/sec) for all drafts and iterations -- 73% cheaper than Veo 3.1 Standard
- 720p and 1080p are the same price -- always generate at 1080p unless you need 4K
- Native audio is only available on Veo 3.0 at a premium ($0.75/sec) -- consider adding audio in post-production instead
- Third-party APIs (fal.ai) offer Veo 3.1 Fast from ~$0.10/sec -- 33% cheaper than direct
- AI Pro subscription ($19.99/mo) gives effective $0.22/video but only 3/day -- useful for personal testing, not production
- Request Tier 2/3 quota increases early -- approval takes days

## Atlas UX Budget Impact
- **Social clips (5s @ 1080p, Fast):** $0.75/clip -- very competitive
- **Product shots (8s @ 1080p, Fast):** $1.20/clip
- **Monthly estimate at 50 videos (8s, Fast):** $60
- **Monthly estimate at 100 videos (8s, Fast):** $120
- **With audio (Veo 3.0):** 100 videos at 8s = $600 -- expensive, consider post-production audio
- Veo 3.1 Fast is the best value among first-party premium APIs
- 4K output is a unique differentiator but at 2.3x the cost of 1080p


---
## Media

### Platform References
- **veo3**: [Docs](https://deepmind.google/technologies/veo/) · [Gallery](https://deepmind.google/technologies/veo/)

### Related Videos
- [Google Veo 3 - AI Video Generation Tutorial](https://www.youtube.com/results?search_query=google+veo+3+ai+video+generation+tutorial) — *Credit: Google on YouTube* `veo3`
- [Veo 3 vs Sora 2 - Which AI Video Generator is Better?](https://www.youtube.com/results?search_query=veo+3+vs+sora+2+comparison+review) — *Credit: AI Reviews on YouTube* `veo3`

> *All video content is credited to original creators. Links direct to source platforms.*
