# Vidu AI -- Pricing Reference

> Last verified: 2026-03-18
> Provider: Shengshu Technology (Beijing)
> Platform: vidu.com | API: platform.vidu.com

---

## Key Takeaways

- Vidu is the cheapest production-grade AI video generator on the market at ~$0.0375/sec (55% below industry average of $0.084/sec).
- The Standard plan at ~$8/mo with 800 credits (~200 videos) is the lowest-cost entry point among serious competitors.
- Off-Peak Mode gives all paid users unlimited free generations during off-peak hours -- no credits consumed.
- Credit system is simple: 1 credit = 1 second of video at base resolution. A 4-sec clip = 4 credits, 8-sec = 8 credits, 16-sec = 16 credits.
- The user-reported $0.006/video figure for a 15-second clip is plausible only in Off-Peak Mode (effectively $0.00/video) or when amortizing the Standard plan across maximum volume. At standard rates, a 15-sec clip costs ~$0.56 via API or ~15 credits on the web app.
- Annual billing saves 20% across all tiers.

---

## Web App Subscription Plans

| Plan | Monthly | Annual (per mo) | Credits/mo | Videos/mo | Off-Peak Unlimited | Watermark-Free | Commercial Use |
|------|---------|-----------------|------------|-----------|---------------------|----------------|----------------|
| **Free** | $0 | -- | 80 | ~20 | Yes (4-sec only) | No | No |
| **Standard** | $10 | ~$8 | 800 | ~200 | Yes | Yes | Yes |
| **Premium** | $35 | ~$28 | 4,000 | ~1,000 | Yes | Yes | Yes |
| **Ultimate** | $99 | ~$79 | 8,000 | ~2,000 | Yes | Yes | Yes |

> Note: Monthly prices vary slightly across sources ($8-$10 for Standard, $28-$35 for Premium). Prices above reflect the most commonly cited figures as of March 2026. Check vidu.com/pricing for current rates.

### Credit Conversion

| Video Duration | Credits Used | Cost at Standard ($10/800cr) | Cost at Premium ($35/4000cr) | Cost at Ultimate ($99/8000cr) |
|----------------|-------------|------------------------------|------------------------------|-------------------------------|
| 4 seconds | 4 | $0.050 | $0.035 | $0.050 |
| 8 seconds | 8 | $0.100 | $0.070 | $0.099 |
| 16 seconds | 16 | $0.200 | $0.140 | $0.198 |

> Resolution multipliers may apply: 720p = 1.0x, 1080p = ~1.8-2.0x credits. Audio generation adds additional credits on Q3 models.

### Off-Peak Mode Details

- Available to ALL users (including free tier, though free tier is limited to 4-sec clips).
- No credits consumed during off-peak hours.
- Off-peak hours not officially published; typically overnight/early morning in peak usage timezones.
- Quality and model access are the same as standard generation.
- This is Vidu's key differentiator for budget-conscious users.

---

## API Pricing (platform.vidu.com)

| Factor | Detail |
|--------|--------|
| **Base rate** | ~$0.0375/second (Vidu 2.0 baseline) |
| **Billing model** | Per-second, metered usage (no subscription required) |
| **Resolution multiplier** | 720p: 1.0x, 1080p: 1.8-2.0x, 4K: 3.5-4.0x |
| **Audio addon** | Additional cost for Q3 native audio generation |
| **Authentication** | API Key via Bearer token (Settings > API > API Keys) |
| **Workflow** | Async: submit job, receive task_id, poll for result |

### API Cost Formula

```
Total cost = (seconds x resolution_factor x base_rate) + audio_addon + extras
```

### API Cost Examples (estimated)

| Clip | Resolution | Audio | Estimated Cost |
|------|-----------|-------|----------------|
| 4-sec T2V | 720p | No | ~$0.15 |
| 8-sec T2V | 720p | No | ~$0.30 |
| 8-sec I2V | 1080p | No | ~$0.54 |
| 16-sec T2V | 720p | Yes (Q3) | ~$0.75-1.00 |
| 16-sec T2V | 1080p | Yes (Q3) | ~$1.20-1.50 |

### Third-Party API Providers

Vidu models are also available through aggregator APIs with their own pricing:

| Provider | Model | Approx. Cost |
|----------|-------|--------------|
| **fal.ai** | Vidu Q3 | Pay-per-use, competitive |
| **Atlas Cloud** | Vidu Q3-Pro, Q3-Turbo | Unified API access |
| **Novita AI** | Vidu Q3 Pro, Q2, Q1 | Per-task billing |
| **WaveSpeed AI** | Vidu Q3-Turbo I2V | Per-second billing |
| **Runware** | Vidu Q3, Q3-Turbo | Per-generation |
| **Segmind** | Vidu Q1, Template | Per-run |

---

## Competitor Pricing Comparison

| Provider | Model | Cost/Second | Max Duration | Native Audio | Notes |
|----------|-------|-------------|-------------|-------------|-------|
| **Vidu** | Q3 (web) | ~$0.01-0.04 | 16 sec | Yes | Off-Peak = free; cheapest paid plans |
| **Vidu** | 2.0 (API) | ~$0.0375 | 8 sec | No | 55% below industry avg |
| **Kling** | 3.0 | ~$0.029 | 120 sec | No (post-prod) | Cheapest per-sec API; 2-min max |
| **Veo** | 3.1 | ~$0.15 | 8 sec | Yes | Google; highest quality tier |
| **Sora** | 2 | Bundled (ChatGPT) | 20 sec | Yes | No standalone API; $20-200/mo via ChatGPT |
| **Runway** | Gen-4.5 | ~$0.05-0.10 | 10 sec | No | Credit-based; $76/mo unlimited |
| **Seedance** | 2.0 | ~$0.04-0.08 | 10 sec | No | ByteDance; competitive pricing |

### Cost for 1-Minute Video (stitched from clips)

| Provider | Estimated Cost (720p) | Estimated Cost (1080p) |
|----------|----------------------|------------------------|
| **Vidu (Standard plan)** | ~$0.75 (60 credits) | ~$1.35-1.50 |
| **Vidu (Off-Peak)** | $0.00 | $0.00 |
| **Vidu (API)** | ~$2.25 | ~$4.05-4.50 |
| **Kling 3.0 (API)** | ~$1.74 | ~$3.00+ |
| **Veo 3.1 (API)** | ~$9.00 | ~$16.00+ |
| **Sora (ChatGPT Pro)** | Included in $200/mo | Included in $200/mo |

---

## Rate Limits and Quotas

| Limit | Detail |
|-------|--------|
| Free tier | 80 credits/mo, 4-sec max clips, watermarked |
| Standard | 800 credits/mo, full duration access |
| Premium | 4,000 credits/mo |
| Ultimate | 8,000 credits/mo |
| API | Metered; no published hard cap; likely subject to fair-use throttling |
| Off-Peak | Unlimited generations for paid users; 4-sec cap for free users |
| Concurrent jobs | Not officially published; async queue-based |

---

## Integration Notes for Atlas UX

### Why Vidu Matters for Atlas

1. **Cost efficiency**: At $0.0375/sec or free via Off-Peak, Vidu is viable for automated video generation in marketing workflows without blowing through budgets.
2. **API availability**: Async task-based API with Bearer auth fits standard integration patterns. Multiple third-party aggregators also offer Vidu models.
3. **Off-Peak arbitrage**: If Atlas batches video generation during off-peak hours, the effective cost drops to $0.00 on any paid plan. This is ideal for non-time-sensitive content like blog cover videos, social posts, or email campaign assets.
4. **Credit predictability**: 1 credit = 1 second makes budgeting trivial compared to token-based or resolution-variable pricing.

### Recommended Tier for Atlas

- **Standard ($10/mo)**: Sufficient for light usage (~200 videos/mo). Best for testing and low-volume campaigns.
- **Premium ($35/mo)**: Sweet spot for regular content generation (~1,000 videos/mo). Covers most marketing automation needs.
- **API direct**: Better for programmatic, high-volume pipelines where per-second billing is more predictable than credits.

### Cost Caveats

- The user-reported "$0.006 per 15-second video" is achievable only by amortizing the Standard plan cost across maximum Off-Peak usage. Standard-rate cost for a 15-sec video is ~15 credits or ~$0.19-0.56 depending on resolution and plan tier.
- Resolution multipliers (1080p = ~2x cost) can catch you off guard if not accounted for.
- Q3 audio generation adds cost; budget separately if using native audio features.

---

## Sources

- [Vidu Official Pricing](https://www.vidu.com/pricing)
- [Vidu API Pricing](https://platform.vidu.com/docs/pricing)
- [Vidu Q3 Pricing: Plans vs API Cost (Cutout.pro)](https://www.cutout.pro/learn/blog-vidu-q3-pricing-and-api-cost/)
- [AI Video Generator Pricing 2026 (Magic Hour)](https://magichour.ai/blog/ai-video-generators-pricing)
- [AI Video API Pricing 2026: Seedance vs Sora vs Kling vs Veo (DevTk)](https://devtk.ai/en/blog/ai-video-generation-pricing-2026/)
- [Veo 3.1 vs Kling 3.0 vs Sora 2 API Pricing (ModelsLab)](https://modelslab.com/blog/api/veo-3-1-vs-kling-3-sora-2-ai-video-api-cost-2026)
- [17 Best AI Video Generation Models (AI Free Forever)](https://aifreeforever.com/blog/best-ai-video-generation-models-pricing-benchmarks-api-access)
- [Vidu AI Review 2026 (ColdIQ)](https://coldiq.com/tools/vidu-ai)
- [Vidu AI Review 2026 (Dupple)](https://dupple.com/tools/vidu-ai)
- [Vidu AI Review 2026 (AI Chief)](https://aichief.com/ai-video-tools/vidu-ai/)
- [ViduAI Official X Post on 2.0 Pricing](https://x.com/ViduAI_official/status/1879718558168666361)


---
## Media

### Platform References
- **kling**: [Docs](https://klingai.com) · [Gallery](https://klingai.com/explore)
- **vidu**: [Docs](https://www.vidu.studio) · [Gallery](https://www.vidu.studio/explore)

### Related Videos
- [Kling AI Video Generator Tutorial - Complete Guide](https://www.youtube.com/results?search_query=kling+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `kling`
- [Kling 3.0 - Motion Brush & Advanced Features](https://www.youtube.com/results?search_query=kling+3.0+motion+brush+advanced+tutorial) — *Credit: AI Tutorials on YouTube* `kling`
- [Vidu AI Video Generator Tutorial](https://www.youtube.com/results?search_query=vidu+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `vidu`
- [Vidu - Fast AI Video Generation Review](https://www.youtube.com/results?search_query=vidu+ai+fast+video+generation+review) — *Credit: AI Reviews on YouTube* `vidu`

> *All video content is credited to original creators. Links direct to source platforms.*
