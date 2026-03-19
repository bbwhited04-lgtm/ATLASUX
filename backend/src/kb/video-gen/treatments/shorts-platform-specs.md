# Shorts Platform Specs
**Sources:**
- [YouTube Shorts Size & Dimensions: Exact Specs for 2026](https://vidiq.com/blog/post/youtube-shorts-vertical-video/)
- [YouTube Shorts Size & Dimensions Guide (Updated 2026)](https://postfa.st/sizes/youtube/shorts)
- [TikTok Video Size & Dimensions 2026 - Fliki](https://fliki.ai/blog/tiktok-video-size)
- [TikTok Video Size Specs 2026](https://www.aiarty.com/knowledge-base/tiktok-video-size.htm)
- [Instagram Reels Size & Dimensions Guide (Updated 2026)](https://postfa.st/sizes/instagram/reels)
- [Instagram Reels Safe Zone Guide (2026)](https://kreatli.com/guides/instagram-reels-safe-zone)
- [Instagram safe zones explained for 2026 creators](https://zeely.ai/blog/master-instagram-safe-zones/)
- [Facebook Reel Size, Dimensions & Specs: The Complete 2026 Guide](https://www.aiarty.com/knowledge-base/facebook-reel-size.htm)
- [Facebook Reels: Dimensions & Size Guide (2026)](https://sendshort.ai/guides/facebook-reels-size/)
- [Social Media Safe Zones: Full Guide for Creators (2026)](https://postplanify.com/blog/social-media-safe-zones-2026-complete-guide)

**Date:** 2026-03-18

## Key Takeaways
- All platforms standardize on 9:16 aspect ratio at 1080x1920px resolution
- YouTube Shorts extended to 3 minutes (180s) but 15-60s remains optimal for engagement
- TikTok allows up to 10min recording / 60min upload but 15-60s is the sweet spot
- Instagram Reels allow up to 3 minutes (180s)
- Facebook merged all video into Reels format as of June 2025
- Safe zones vary by platform -- bottom 15-35% is always dangerous due to UI overlays
- MP4 with H.264 video codec + AAC audio is universally preferred
- 30fps or 60fps across all platforms

## Content

### YouTube Shorts

| Spec | Value |
|------|-------|
| Aspect Ratio | 9:16 (vertical) |
| Resolution | 1080x1920px (recommended), min 720x1280, max 2160x3840 (4K) |
| Duration | Up to 3 minutes (180s); was 60s, extended in 2024 |
| Optimal Duration | 15-60 seconds for maximum engagement |
| File Format | MP4 (H.264 + AAC) |
| File Size | No official limit (YouTube caps at 256GB); aim <100MB for a 60s clip |
| Frame Rate | 30fps or 60fps |
| Bitrate | No strict cap; YouTube re-encodes on upload |
| Safe Zone | Top ~10% (search bar), bottom ~15% (subscribe button, title, description) |

**Notes:** Videos must be vertical (9:16) and <=180s to qualify for the Shorts shelf. Square (1:1) videos may also appear but perform worse. Upload via YouTube app or web; mark as Short or let YouTube auto-detect from aspect ratio.

### TikTok

| Spec | Value |
|------|-------|
| Aspect Ratio | 9:16 (vertical) |
| Resolution | 1080x1920px (recommended), min 540x960 |
| Duration | Record in-app up to 10 min; upload up to 60 min |
| Optimal Duration | 15-60 seconds (algorithm favors completion rate) |
| File Format | MP4, MOV, MPEG, 3GP, AVI |
| File Size | Max 500MB (web); ~287MB iOS; ~72MB Android |
| Frame Rate | 30-60fps |
| Bitrate | 8-15 Mbps VBR recommended; min 516 kbps |
| Safe Zone | Top ~15% (status bar, FYP tabs), bottom ~25% (caption area), right ~10% (action buttons) |

**Notes:** TikTok heavily re-encodes uploads. Export at 1080x1920 with high bitrate to compensate for quality loss. Videos under 60s get looped automatically, boosting watch-time metrics. Enable "High quality upload" toggle when available.

### Instagram Reels

| Spec | Value |
|------|-------|
| Aspect Ratio | 9:16 (vertical); 4:5 in feed crop |
| Resolution | 1080x1920px |
| Duration | Up to 3 minutes (180s) as of Jan 2025 |
| Optimal Duration | 15-30 seconds for discovery; up to 90s for educational |
| File Format | MP4 (H.264) |
| File Size | Max 4GB (but smaller is better) |
| Frame Rate | 30fps recommended |
| Bitrate | High bitrate recommended; Instagram re-encodes aggressively |
| Safe Zone (px) | Top: 108px, Bottom: 320px, Left: 60px, Right: 120px |
| Safe Zone (text) | Keep text inside 1080x1420px center zone |

**Notes:** Instagram crops Reels to 4:5 in the feed grid and 1:1 on profile grid. Design your content so the key visual is centered vertically. Captions, audio info, and action buttons overlay the bottom ~17% of the screen. The algorithm heavily weights completion rate and shares.

### Facebook Reels

| Spec | Value |
|------|-------|
| Aspect Ratio | 9:16 (recommended); any ratio accepted since June 2025 |
| Resolution | 1080x1920px (recommended), min 720x1280 |
| Duration | Recommended up to 90s; min 3s; no strict max since June 2025 (all FB video = Reels) |
| Optimal Duration | 15-60 seconds |
| File Format | MP4, MOV, AVI |
| File Size | Max 1GB |
| Frame Rate | 24-60fps |
| Safe Zone | Top: 14%, Bottom: 35%, Left: 6%, Right: 6% |

**Notes:** As of June 2025, Facebook merged all video formats into Reels. No separate "video post" exists. The bottom safe zone is larger than other platforms because Facebook overlays more UI elements (reactions, comments, share, profile info).

## Cross-Platform Quick Reference

| Spec | YouTube Shorts | TikTok | IG Reels | FB Reels |
|------|---------------|--------|----------|----------|
| Resolution | 1080x1920 | 1080x1920 | 1080x1920 | 1080x1920 |
| Aspect Ratio | 9:16 | 9:16 | 9:16 | 9:16 |
| Max Duration | 180s | 10min (record) | 180s | 90s (rec) |
| Sweet Spot | 15-60s | 15-60s | 15-30s | 15-60s |
| Format | MP4 | MP4/MOV | MP4 | MP4/MOV |
| Max File Size | ~256GB | 500MB | 4GB | 1GB |
| Frame Rate | 30-60fps | 30-60fps | 30fps | 24-60fps |
| Codec | H.264+AAC | H.264+AAC | H.264 | H.264 |

## Universal Safe Zone Template (9:16 at 1080x1920)

```
+----------------------------------+
|  STATUS BAR / PLATFORM HEADER    |  <- Top 108-150px: AVOID
|  (search, tabs, back button)     |
+----------------------------------+
|                                  |
|                                  |
|         SAFE CONTENT ZONE        |  <- Center 1080x1420px
|    (text, faces, key visuals)    |
|                                  |
|                                  |
+----------------------------------+
|  CAPTIONS / AUDIO / HASHTAGS     |  <- Bottom 320-500px: AVOID
|  LIKE/SHARE/COMMENT BUTTONS      |
|  PROFILE PIC + USERNAME          |
+----------------------------------+
     ^                        ^
     Left 60px     Right 120px: AVOID
     AVOID         (action buttons)
```

## Tools & Services
- **Export preset tools:** Premiere Pro, DaVinci Resolve, CapCut all have 9:16 Short presets
- **Multi-platform formatters:** Repurpose.io, Kapwing, Canva (auto-resize to each platform)
- **Compliance checkers:** Socialsizes.io (free spec checker), Postfa.st (dimension guides)

## Integration Notes for Atlas UX
- Venny/Victor treatment pipeline should default to 1080x1920 MP4 H.264+AAC at 30fps
- Export presets should include per-platform safe zone overlays during editing preview
- Template system should enforce safe zones as "no-text" regions when auto-placing captions or CTAs
- Duration targets should be configurable per platform but default to 30-45s for maximum cross-platform compatibility
- Consider storing platform specs as a config JSON so they can be updated without code changes as platforms evolve
- Batch export should generate one master vertical file then crop/adjust per-platform safe zones


---
## Media

### Category Resources
- [Atlas UX AI Video Generation Wiki](https://atlasux.cloud/#/wiki/video-gen)
