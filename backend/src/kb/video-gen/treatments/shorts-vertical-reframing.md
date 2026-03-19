# Vertical Reframing Tools & Techniques
**Sources:**
- [AI Reframe - Vizard](https://vizard.ai/tools/ai-reframe)
- [Reframe Videos with AI - Luma](https://lumalabs.ai/reframe)
- [Best AI Reframe Tool - WayinVideo](https://wayin.ai/tools/ai-reframe/)
- [AI Reframe | Auto video resizing in 1 click - OpusClip](https://www.opus.pro/ai-reframe)
- [Automated Framing - Choppity](https://www.choppity.com/features/automated-framing)
- [10 Best Auto Reframe Tools (9:16, 1:1, 16:9) - OpusClip Blog](https://www.opus.pro/blog/best-auto-reframe-tools)
- [Change Video Aspect Ratio - OpusClip](https://www.opus.pro/tools/change-video-aspect-ratio)
- [Comparing Auto Reframe in DaVinci Resolve and Premiere Pro](https://elements.tv/blog/comparing-the-auto-reframe-in-davinci-resolve-and-premiere-pro/)
- [CapCut vs Premiere Pro](https://www.miracamp.com/learn/premiere-pro/vs-capcut)
- [DaVinci Resolve Smart Reframe](https://www.capcut.com/resource/davinci-resolve-smart-reframe)

**Date:** 2026-03-18

## Key Takeaways
- AI reframing converts 16:9 horizontal video to 9:16 vertical with intelligent subject tracking
- Speaker tracking (face detection + active speaker identification) is the core technology
- Multi-speaker scenes require prioritization logic (who to follow when)
- All major tools support batch processing of multiple aspect ratios from one source
- Manual override/adjustment is always available for fine-tuning
- Cloud-based tools (OpusClip, Vizard) are fastest; NLE plugins (Premiere, DaVinci) offer most control
- Cost ranges from free (CapCut, DaVinci Resolve free) to $45/mo (OpusClip Pro)

## Content

### The Reframing Problem

Long-form content is typically shot in 16:9 (landscape). Short-form platforms require 9:16 (portrait). Simply center-cropping loses 75% of the frame. Smart reframing uses AI to dynamically track subjects and adjust the crop window throughout the video.

**Aspect ratio conversions needed:**
- 16:9 to 9:16 (landscape to portrait -- most common)
- 16:9 to 1:1 (landscape to square -- Instagram feed, LinkedIn)
- 16:9 to 4:5 (landscape to tall rectangle -- Instagram feed)
- 1:1 to 9:16 (square to portrait)

### How AI Reframing Works

1. **Face detection:** Identifies all faces in each frame
2. **Speaker identification:** Determines who is actively speaking (lip movement, audio sync)
3. **Priority assignment:** Decides which subject to follow based on rules
4. **Crop window calculation:** Positions the 9:16 crop around the priority subject
5. **Smooth tracking:** Applies easing/interpolation so the crop window doesn't jerk
6. **Key action detection:** Identifies important non-face elements (hands, objects, screen shares)
7. **Output:** Renders the reframed video with the dynamic crop applied

### Tool Deep Dives

#### Cloud-Based AI Reframing Tools

**OpusClip ReframeAnything**
- Proprietary AI model for subject detection
- Dynamically tracks faces, speakers, and moving objects
- Supports 9:16, 16:9, 1:1, 4:5 output
- Adjusts crop and position even for complex multi-person scenes
- Integrated with clipping and captioning pipeline
- Manual keyframe adjustment available
- Batch processing for multiple clips
- Pricing: Included in OpusClip plans ($15-45/mo)

**Vizard AI Reframe**
- Multi-modal model detects faces, speakers, and key actions
- Face and Speaker Prioritization for podcast/interview content
- Intelligently shifts focus between active speakers
- Maintains narrative flow
- Brand consistency across reframed clips
- Team collaboration on reframe adjustments
- Pricing: Free tier; Pro from ~$20/mo

**Luma AI Reframe**
- AI preserves subject focus, motion dynamics, and scene integrity
- Makes content look native to each platform
- Focus on visual quality preservation during reframing
- Pricing: Varies by tier

**WayinVideo AI Reframe**
- Quick online reframing tool
- Multiple aspect ratio presets
- Good for simple reframing needs
- Pricing: Free tier available

**Choppity Automated Framing**
- Automatically detects speakers, faces, and movement
- Keeps every shot perfectly framed
- Designed for podcast and interview content
- Pricing: From ~$10/mo

#### NLE (Desktop Editor) Reframing

**Adobe Premiere Pro Auto Reframe**
- Motion Tracking speed settings (Slower/Default/Faster)
- Automatic position keyframe adjustments
- Reframe Offset (X/Y position adjustment)
- Reframe Scale (scaling factor control)
- Reframe Rotation (rotation adjustment)
- Nested sequence support
- Manual keyframe override for precision
- Pricing: $22.99/mo (Creative Cloud)

**DaVinci Resolve Smart Reframe**
- Found in Transform menu
- Auto or manual reference point selection
- Object tracking integration
- Professional color/grade preservation
- NOT available in free version (Studio only)
- Pricing: $299 one-time (DaVinci Resolve Studio)

**CapCut Auto Reframe**
- Quick aspect ratio selection (16:9, 1:1, 9:16, 4:5)
- AI-powered framing adjustment
- Simple interface
- Best for fast, good-enough reframing
- Mobile + desktop
- Pricing: Free; Pro ~$7.99/mo

### Multi-Speaker Handling

The hardest reframing challenge is multi-person content (podcasts, panels, interviews). Solutions:

**Speaker Priority Rules:**
1. Follow the active speaker (lip movement + audio)
2. When speakers overlap, follow the one who started speaking first
3. During silence, hold on the last speaker or pull to a wide shot
4. During reactions, briefly cut to the reactor then return to speaker
5. During screen shares, reframe to focus on the shared content

**Split-Screen Alternative:**
Instead of tracking one speaker, some tools offer split-screen vertical layouts:
- Top half: Speaker A
- Bottom half: Speaker B
- Active speaker gets larger portion (60/40 split)

### Reframing Quality Checklist

- [ ] Subject's face is never cut off at the edge
- [ ] Text/graphics on screen remain readable after crop
- [ ] No sudden jerky crop movements (smooth easing applied)
- [ ] Active speaker is always visible during their speech
- [ ] Important visual elements (hands, objects, demos) are captured
- [ ] Consistent framing style across all clips from the same source
- [ ] Safe zones respected (no content behind platform UI overlays)

### Common Reframing Failures

| Problem | Cause | Fix |
|---------|-------|-----|
| Face cut off at edges | Crop window too tight | Increase padding / zoom out |
| Jerky tracking | No easing between positions | Apply smooth interpolation |
| Wrong person tracked | Speaker detection error | Manual keyframe correction |
| Screen share cropped | AI prioritized face over screen | Set screen share as priority region |
| Text unreadable | Text was in 16:9 margins | Re-position text after reframe |
| Motion blur on fast pans | Tracking speed too aggressive | Reduce tracking sensitivity |

### Comparison Matrix

| Tool | Speaker Track | Multi-Person | Batch | Manual Override | API | Price |
|------|--------------|-------------|-------|-----------------|-----|-------|
| OpusClip | Yes | Yes (auto) | Yes | Yes | Yes | $15-45/mo |
| Vizard | Yes | Yes (priority) | Yes | Yes | Yes | $20+/mo |
| Luma AI | Yes | Basic | No | Limited | No | Varies |
| Choppity | Yes | Yes | Yes | Yes | No | $10+/mo |
| Premiere Pro | Yes | Manual | Via batch export | Full keyframe | No | $22.99/mo |
| DaVinci Resolve | Yes | Manual | Via batch export | Full keyframe | No | $299 once |
| CapCut | Basic | No | No | Limited | No | Free-$7.99/mo |

## Tools & Services

| Tool | Best For | Cost |
|------|----------|------|
| OpusClip | All-in-one cloud reframing pipeline | $15-45/mo |
| Vizard | Multi-speaker podcast/interview content | $20+/mo |
| Choppity | Budget podcast reframing | $10+/mo |
| Premiere Pro | Maximum manual control (pros) | $22.99/mo |
| DaVinci Resolve Studio | One-time purchase, pro-grade | $299 once |
| CapCut | Quick and free basic reframing | Free-$7.99/mo |

## Integration Notes for Atlas UX
- Venny/Victor treatment pipeline should include reframing as an automatic step when source is 16:9
- Default reframe target: 9:16 at 1080x1920 for cross-platform shorts
- Consider OpusClip or Vizard API for cloud-based reframing -- avoids local GPU processing
- Treatment metadata should specify: `source_aspect_ratio`, `target_aspect_ratio`, `reframe_mode` (auto/manual/split-screen)
- For trade business content (job site walkthroughs, before/after reveals), reframing needs to prioritize the work area, not just faces
- Store reframe keyframe data so adjustments can be made without re-processing the entire video
- Multi-output pipeline: from one 16:9 source, generate 9:16 (shorts), 1:1 (feed), and 4:5 (IG feed) versions
- Quality gate: auto-flag reframed clips where face detection confidence drops below threshold for human review
- Split-screen mode should be a treatment option for podcast/interview content: `reframe_mode: "split_screen"`


---
## Media

### Category Resources
- [Atlas UX AI Video Generation Wiki](https://atlasux.cloud/#/wiki/video-gen)
