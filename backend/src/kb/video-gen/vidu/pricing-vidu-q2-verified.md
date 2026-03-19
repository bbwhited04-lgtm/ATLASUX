# Vidu Q2 Pricing — Verified from Official Dashboard
**Source:** Vidu official pricing page (screenshot verified 2026-03-18)
**Date Verified:** 2026-03-18
**Notes:** Off-peak price is HALF of normal. Audio function adds 15 credits on top of base task.

## Key Takeaways
- Q2-pro-fast at 720P is the cheapest viable video API in existence: $0.04 + $0.01/sec
- A 15-second 720P video costs $0.18 standard, $0.09 off-peak
- Q2-turbo 540P is even cheaper: $0.03 + $0.01/sec ($0.17 for 15s, $0.085 off-peak)
- Q2 uses progressive pricing (base cost + per-second), unlike Q3's flat per-second rate
- All tiers support Image-to-Video AND Start-End-to-Video (the treatment killer feature)

## Q2-turbo Pricing

| Resolution | Base Cost | Per-Second | Credits Structure | Off-Peak (50%) |
|-----------|-----------|------------|-------------------|----------------|
| 540P | $0.03 | +$0.01/sec | 6 base, +2/sec | $0.015 + $0.005/sec |
| 720P | $0.04 | +$0.05/sec (after 2s) | 8 base, 10 at 2s, +10/sec | Half |
| 1080P | $0.175 | +$0.05/sec | 35 base, +10/sec | Half |

## Q2-pro Pricing

| Resolution | Base Cost | Per-Second | Credits Structure | Off-Peak (50%) |
|-----------|-----------|------------|-------------------|----------------|
| 540P | $0.04 | +$0.025/sec (after 2s) | 8 base, 10 at 2s, +5/sec | Half |
| 720P | $0.075 | +$0.05/sec | 15 base, +10/sec | Half |
| 1080P | $0.275 | +$0.075/sec | 55 base, +15/sec | Half |

## Q2-pro-fast Pricing (CHEAPEST VIABLE OPTION)

| Resolution | Base Cost | Per-Second | Credits Structure | Off-Peak (50%) |
|-----------|-----------|------------|-------------------|----------------|
| 720P | $0.04 | +$0.01/sec | 8 base, +2/sec | $0.02 + $0.005/sec |
| 1080P | $0.08 | +$0.02/sec | 16 base, +4/sec | $0.04 + $0.01/sec |

## Cost Per Video Examples

### 8-second video (typical short)
| Model | Resolution | Standard | Off-Peak |
|-------|-----------|----------|----------|
| Q2-turbo | 540P | $0.10 | $0.05 |
| Q2-pro-fast | 720P | $0.11 | $0.055 |
| Q2-pro-fast | 1080P | $0.22 | $0.11 |
| Q2-pro | 720P | $0.43 | $0.215 |

### 15-second video
| Model | Resolution | Standard | Off-Peak |
|-------|-----------|----------|----------|
| Q2-turbo | 540P | $0.17 | $0.085 |
| Q2-pro-fast | 720P | $0.18 | $0.09 |
| Q2-pro-fast | 1080P | $0.36 | $0.18 |
| Q2-pro | 720P | $0.78 | $0.39 |

## Volume Estimates (100 shorts/month, 8s avg)

| Model | Resolution | Standard | Off-Peak |
|-------|-----------|----------|----------|
| **Q2-turbo** | **540P** | **$10.00** | **$5.00** |
| **Q2-pro-fast** | **720P** | **$11.00** | **$5.50** |
| Q2-pro-fast | 1080P | $22.00 | $11.00 |
| Q2-pro | 720P | $43.00 | $21.50 |

## vs Competitors (8s @ 720P)

| Provider | Cost |
|----------|------|
| **Vidu Q2-pro-fast off-peak** | **$0.055** |
| **Vidu Q2-turbo 540P off-peak** | **$0.05** |
| Vidu Q3-turbo off-peak | $0.24 |
| Kling 3.0 via fal.ai | $0.23 |
| Veo 3 Fast | $1.20 |
| Sora 2 Standard | $0.80 |
| Sora 2 Pro | $2.40 |

## Audio Add-on
- Adding audio to img2video or reference2video costs **+15 credits** on top of base task
- At $0.005/credit, that's +$0.075 per video
- Only add audio when needed — most treatments add audio in post anyway

## Atlas UX Optimal Strategy
1. **Bulk drafts/treatments:** Q2-turbo 540P off-peak → $0.05 per 8s clip
2. **Good quality shorts:** Q2-pro-fast 720P off-peak → $0.055 per 8s clip
3. **HD finals:** Q2-pro-fast 1080P off-peak → $0.11 per 8s clip
4. **Premium finals:** Use Q3-pro or switch to Sora 2 Pro / Veo 3.1
5. **Schedule all generation off-peak** for automatic 50% savings
6. **Skip audio add-on** — use ElevenLabs in post-production instead (+$0.075 saved)

## Capabilities (all Q2 tiers)
- Image-to-Video
- Start-End-to-Video (provide start + end frame, AI generates transition)
- Text-to-Video (via Q3 only — Q2 is I2V/S2V focused)


---
## Media

> **Tags:** `vidu` · `ai-video` · `text-to-video` · `fast-generation` · `4-second` · `8-second`

### Official Resources
- [Official Documentation](https://www.vidu.studio)
- [Gallery / Showcase](https://www.vidu.studio/explore)
- [Vidu Studio](https://www.vidu.studio)
- [Vidu Explore Gallery](https://www.vidu.studio/explore)

### Video Tutorials
- [Vidu - Fast AI Video Generation Review](https://www.youtube.com/results?search_query=vidu+ai+fast+video+generation+review) — *Credit: AI Reviews on YouTube* `review`
- [Vidu AI Video Generator Tutorial](https://www.youtube.com/results?search_query=vidu+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
