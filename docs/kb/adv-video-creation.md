# AI Video Creation & Generation

## Overview

AI video generation has evolved from novelty demos to production-ready tooling
capable of creating polished content at scale. Within Atlas UX, **Victor**
(Video Production Specialist) owns the end-to-end video pipeline and reports
to **Venny** (Image Production Specialist), who supplies static visual assets,
storyboard frames, and thumbnails. Together they feed finished video to social
publisher agents through Sunday's content coordination layer.

---

## Video Generation Models

### Sora (OpenAI)

Text-to-video, up to 60s at 1080p. Photorealistic scenes with complex camera
motion. Limited public API availability and long render times. Atlas UX uses
Sora for hero product demos and cinematic brand films.

### Runway Gen-3 / Gen-4

The most feature-complete creative video platform. Motion Brush paints motion
vectors onto frames. Camera Controls accept explicit pan/tilt/zoom/dolly/orbit.
Multi-Motion assigns independent paths to separate regions. Gen-4 produces
coherent clips up to 16s with REST API billing. Primary tool for social clips.

### Pika Labs

Fast, accessible generation with strong image-to-video capabilities. Animate
static images with motion prompts or re-generate selected regions of existing
video. Fastest iteration cycle of the major generators.

### Kling AI (Kuaishou)

Excels at longer-form generation — up to 2 minutes in a single pass. Realistic
human motion. Primarily Chinese-language interface with limited API docs.

### Stable Video Diffusion (SVD)

Open-source, runs locally. No per-generation API costs after hardware
investment. Lower baseline quality but useful for bulk background animation
and motion textures where per-clip costs would be prohibitive.

### Luma Dream Machine

3D-aware generation with physically plausible camera movement and depth.
Strong for product visualization, orbit shots, and consistent 3D geometry.

### HeyGen / Synthesia / D-ID

Avatar and talking-head platforms. HeyGen offers the best lip sync across 40+
languages. Synthesia is enterprise-grade (SOC 2, GDPR). D-ID converts a single
photo into a speaking video at lower cost but limited to head and shoulders.

### Veo 2 (Google DeepMind)

Up to 2 minutes at 4K via Vertex AI. Strong prompt faithfulness, cinematic
camera movements, realistic lighting. Atlas UX uses Veo 2 for high-end brand
content and product launches.

### Model Selection Matrix

| Use Case                 | Primary         | Fallback        |
|--------------------------|-----------------|-----------------|
| Social media shorts      | Runway Gen-4    | Pika            |
| Product demos (< 60s)    | Sora            | Veo 2           |
| Long-form tutorials      | Kling AI        | Runway (chained)|
| Talking head / presenter | HeyGen          | Synthesia       |
| Bulk background loops    | SVD (local)     | Pika            |
| 3D product visualization | Luma            | Veo 2           |
| Cinematic brand films    | Veo 2           | Sora            |

---

## Video Creation Techniques

**Text-to-video** — natural language prompt translated into a clip. Best for
concept visualization and abstract brand content.

**Image-to-video** — start from a Venny-generated static image and add motion.
Guarantees the first frame matches brand guidelines exactly.

**Video-to-video style transfer** — apply new visual styles to existing footage
while preserving motion. Useful for converting screen recordings into stylized
demos or creating multiple visual variants from one source.

**Video inpainting** — modify specific regions (remove objects, replace
backgrounds) without regenerating the full clip.

**Lip sync / talking head** — combine a face with audio via HeyGen or D-ID.
Pipeline: generate voiceover (ElevenLabs) then feed audio + face to the model.

**Camera motion control:**

| Move     | Prompt Keyword              | Description                    |
|----------|-----------------------------|--------------------------------|
| Pan      | `camera pans left/right`    | Horizontal sweep               |
| Tilt     | `camera tilts up/down`      | Vertical sweep                 |
| Zoom     | `camera zooms in/out`       | Focal length change            |
| Dolly    | `camera dollies forward`    | Physical camera movement       |
| Orbit    | `camera orbits around`      | Circle around subject          |
| Crane    | `camera cranes up`          | Vertical lift                  |
| Tracking | `camera tracks subject`     | Follow a moving subject        |

**Transitions** — cuts (default, cleanest), dissolves, wipes, zoom transitions.
Social shorts use cuts almost exclusively; brand films may use dissolves.

---

## Prompt Engineering for Video

### Temporal Prompting

Video prompts must describe change over time, not just a static scene.

```
Weak:  "A city skyline at night with neon lights."
Strong: "A city skyline at night, neon signs flickering to life one by one
         left to right, camera slowly rising, rain beginning halfway
         through, 6 seconds."
```

Include: starting state, ending state, transition description, timing cues.

### Scene Description Best Practices

1. Lead with the subject.
2. Specify lighting: "Cyan accent lighting from the left, dark ambient."
3. Describe the environment.
4. State the mood: "Professional, futuristic, calm."
5. Negative prompts: "No text, no watermarks, no people."
6. Technical specs: "16:9, 1080p, 4 seconds."

### Motion Dynamics

| Term            | Effect                                    |
|-----------------|-------------------------------------------|
| `slowly`        | Leisurely, contemplative                  |
| `quickly`       | Energetic, attention-grabbing             |
| `accelerating`  | Starts slow, builds momentum              |
| `smooth`        | Continuous, no jerks                      |
| `ease in-out`   | Gradual acceleration and deceleration     |

### Multi-Shot Storytelling

```
Shot 1 (0-4s):  Wide shot, dark office, monitor glowing cyan. Push in.
Shot 2 (4-8s):  Close-up dashboard, data flowing, subtle cursor.
Shot 3 (8-12s): Agent roster, avatars appearing with glow animations.
Shot 4 (12-18s): Split screen, agents working in parallel.
Shot 5 (18-24s): Results dashboard, metrics ticking upward.
Shot 6 (24-30s): Pull back to wide, logo resolves, CTA overlay.
```

### Frame Consistency

- Use image-to-video with a Venny-generated first frame to lock style.
- Include specific color hex values in prompts when supported.
- Use the last frame of clip N as first-frame input for clip N+1.
- Generate at native model resolution; upscale in post only.

---

## Audio & Music

| Provider    | Type         | Atlas UX Use Case              |
|-------------|--------------|--------------------------------|
| ElevenLabs  | Voice / SFX  | Primary narration, sound FX    |
| PlayHT      | Voice        | Fallback / bulk voiceover      |
| Suno        | Music        | Brand anthems, social audio    |
| Udio        | Music        | Background scores              |

**Music rules:** keep 10-15 dB below narration, modern electronic/ambient
genres, never copyrighted tracks, generate after video edit is locked.

**Sync approaches:** narration-first (most natural pacing), music-first
(best for beat-driven social content), or timestamped sync markers.

---

## Business Video Types

- **Social shorts** (15-60s, 9:16) — hook in first 2s, text overlays for
  silent viewing, 3-5 variants per concept for A/B testing.
- **Product demos** (30s-5min) — screen recordings with AI transitions,
  ElevenLabs narration, clear CTA.
- **Testimonials** — HeyGen/Synthesia avatars with data visualizations.
- **Ad creative** — multiple variations from a single script; standard batch:
  3 hooks x 2 CTAs x 2 lengths = 12 variants for Penny to split-test.
- **Tutorials** (2-10min) — screen capture base with AI callouts and
  step-by-step narration.
- **Brand films** — cinematic Sora/Veo 2 content for landing page and LinkedIn.
- **Email embeds** — animated GIF preview (3-5s, < 1 MB) linking to full video.

---

## Atlas UX Integration

### Agent Hierarchy

```
Sunday (Comms / Tech Doc Writer)
  +-- Venny (Image Production Specialist)
        +-- Victor (Video Production Specialist)
```

### Automated Video Pipeline

```
1. SCRIPT_DRAFT      Sunday writes script, posts to job queue.
2. STORYBOARD        Victor breaks script into shots, requests assets.
3. ASSET_GENERATION  Venny generates images (DALL-E 3), uploads to Supabase.
4. VIDEO_GENERATION  Victor selects model, crafts prompts, generates clips.
5. AUDIO_GENERATION  Victor generates narration and background music.
6. POST_PRODUCTION   Assembly, transitions, text overlays, captions.
7. QUALITY_REVIEW    Brand compliance checks, spec verification.
8. THUMBNAIL_REQUEST Victor requests thumbnail from Venny.
9. PUBLISH_READY     Victor notifies the appropriate publisher agent.
10. PUBLISH          Publisher agent posts to the target platform.
```

### Publisher Agent Integration

| Agent     | Platform  | Video Specs                          |
|-----------|-----------|--------------------------------------|
| Timmy     | TikTok    | 9:16, 1080x1920, 15-60s, MP4        |
| Kelly     | X/Twitter | 16:9 or 1:1, 1920x1080, up to 140s  |
| Fran      | Facebook  | 16:9 or 1:1, 1920x1080, up to 240m  |
| Dwight    | Threads   | 9:16, 1080x1920, up to 60s           |
| Link      | LinkedIn  | 16:9, 1920x1080, up to 10min        |
| Cornwell  | Pinterest | 9:16 or 1:1, 1080x1920, up to 60s   |
| Reynolds  | Blog      | 16:9, 1280x720 or 1920x1080         |

### Asset Storage

```
tenants/{tenantId}/videos/
  short-form/   -- TikTok, Reels, Shorts
  long-form/    -- YouTube, blog embeds
  thumbnails/   -- Video thumbnail images
  raw/          -- Unedited generated clips
  audio/        -- Narration and music tracks
```

Naming: `[date]-[type]-[description]-[resolution].[ext]`

### Thumbnail Requests (Venny Collaboration)

```json
{
  "type": "ASSET_REQUEST",
  "requestedBy": "victor",
  "assignedTo": "venny",
  "params": {
    "asset_type": "video_thumbnail",
    "dimensions": "1280x720",
    "subject": "Atlas UX agent dashboard overview",
    "style": "bold focal point, eye-catching contrast",
    "platform": "youtube"
  }
}
```

---

## Production Workflow

**Pre-production:** Script from Sunday, storyboard with numbered shots
(duration, camera, visual, audio cue), shot list identifying AI-generated vs.
screen capture vs. composited shots, asset requests to Venny.

**Generation:** Model selection per shot, detailed temporal prompts, batch
rendering (3 takes per shot), frame extraction for clip-to-clip continuity.

**Post-production:** Assembly, transitions, white sans-serif text overlays
(max 8 words), color grading (dark/navy bias with cyan highlights), audio
layering (narration 10+ dB above music), captions in lower third, branded
intro (2-3s) and CTA outro (5s).

**Review:** Technical QA (resolution, aspect ratio, codec, file size), brand
compliance, content accuracy, accessibility (captions, audio balance, no
seizure-triggering flashes), artifact check.

**Publishing:** Platform-specific format conversion, bitrate optimization,
metadata handoff to publisher agent.

---

## Quality Control

### Common AI Video Artifacts

| Artifact               | Mitigation                               |
|------------------------|------------------------------------------|
| Flickering             | Regenerate; use image-to-video           |
| Morphing               | Lock first frame; shorter clips          |
| Temporal inconsistency | Use models with longer context windows   |
| Physics violations     | Simplify scene; reduce subject count     |
| Hand/finger errors     | Avoid close-ups of hands                 |
| Text rendering         | Add text in post-production only         |
| Motion blur smearing   | Reduce motion speed in prompt            |

### Brand Compliance

Before PUBLISH_READY: dark backgrounds only, cyan-to-blue accents only,
correct logo in intro/outro, no third-party branding or watermarks, tone
matched to target platform.

### Legal & Moderation

- No deepfakes without explicit consent and CLO (Jenny) review.
- AI-generated content disclosure per platform ToS.
- All generated content original — no copyrighted music/footage/imagery.
- Audit log records model, prompt, and cost for every generated asset.
- Tina (CFO) approves any video referencing pricing or financial data.

---

## Platform Specifications

| Platform        | Ratio   | Resolution | Duration     | Max Size | Format |
|-----------------|---------|------------|--------------|----------|--------|
| TikTok          | 9:16    | 1080x1920  | 15s - 10min  | 287 MB   | MP4    |
| Instagram Reels | 9:16    | 1080x1920  | 15s - 90s    | 250 MB   | MP4    |
| YouTube Shorts  | 9:16    | 1080x1920  | 15s - 60s    | 256 MB   | MP4    |
| YouTube         | 16:9    | 1920x1080  | Any          | 256 GB   | MP4    |
| Facebook        | 1:1/16:9| 1920x1080  | Up to 240min | 10 GB    | MP4    |
| LinkedIn        | 16:9    | 1920x1080  | Up to 10min  | 5 GB     | MP4    |
| X / Twitter     | 16:9/1:1| 1920x1080  | Up to 2:20   | 512 MB   | MP4    |

**Encoding:** H.264 MP4, AAC 128-256 kbps, 30 fps (60 fps for high motion).
Bitrate: 8-12 Mbps short-form, 12-20 Mbps long-form 1080p, 35-50 Mbps 4K.

---

## Cost Optimization

| Budget Tier    | Strategy                                              |
|----------------|-------------------------------------------------------|
| Low (< $50/mo) | SVD for backgrounds, Pika for shorts, D-ID for heads  |
| Mid ($50-200)  | Runway Gen-4 primary, ElevenLabs standard voices      |
| High ($200+)   | Sora/Veo 2 for hero content, HeyGen for avatars       |

**Optimization tactics:** generate at native resolution (upscale in post),
use 4s clips chained together, cache intros/outros/logo animations, queue
non-urgent renders off-peak, maintain reusable templates (product demo shell,
social short scaffold, explainer framework, ad creative base).

**API credit management:** Victor reports daily usage to Tina (CFO). All API
calls are logged in the audit trail with cost metadata. Spend above
`AUTO_SPEND_LIMIT_USD` triggers a `decision_memo` for approval. Recurring
subscription upgrades are blocked by default and require board-level approval.
Video generation jobs count toward `MAX_ACTIONS_PER_DAY`.
