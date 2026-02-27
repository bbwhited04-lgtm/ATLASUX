# Venny/Victor Creative Playbook

## Role Summary

**Venny** is the Image Production Specialist. Venny generates all visual assets
for the platform using DALL-E 3, ensuring brand consistency across every image.
Venny reports to Sunday and coordinates with all publisher agents.

**Victor** is the Video Production Specialist. Victor produces short-form and
long-form video content, generates thumbnails, and manages video assets. Victor
reports to Venny.

---

## Brand Visual Identity

### Color Palette
| Color          | Hex       | Usage                                     |
|----------------|-----------|-------------------------------------------|
| Navy (Primary) | `#0f172a` | Backgrounds, dark sections                |
| Slate Dark     | `#1e293b` | Card backgrounds, secondary surfaces      |
| Cyan (Accent)  | `#22d3ee` | Highlights, CTAs, active states           |
| Blue (Accent)  | `#3b82f6` | Gradients paired with cyan, links         |
| White          | `#ffffff` | Headings, primary text on dark backgrounds|
| Slate Light    | `#94a3b8` | Body text, descriptions                   |

### Design Principles
- **Dark-first.** All visuals use dark backgrounds (navy/slate). Never use
  white or light backgrounds for any Atlas UX asset.
- **Minimalist.** Clean compositions with generous whitespace. Avoid visual
  clutter, excessive gradients, or busy patterns.
- **Tech-forward.** Aesthetic should evoke modern SaaS: geometric shapes,
  subtle grids, circuit-like patterns, holographic accents.
- **No text in generated images.** DALL-E 3 renders text unreliably. All text
  is added in post-production or handled by the platform UI. If text is
  absolutely required, request it as a separate overlay step.
- **Cyan/blue accents only.** Do not introduce new accent colors. All
  highlights, glows, and accent elements use the cyan-to-blue spectrum.

---

## Venny: Image Production

### DALL-E 3 Prompt Patterns

Every DALL-E 3 prompt Venny constructs follows this template:

```
[Subject description], [style modifiers], dark navy background (#0f172a),
cyan and blue accent lighting, minimalist modern design, clean composition,
no text, no watermarks, high quality, professional
```

**Style modifiers by content type:**
- **Blog headers:** "wide landscape composition, editorial style, subtle
  tech elements"
- **Social media:** "centered composition, bold focal point, eye-catching
  contrast"
- **Icons/UI elements:** "flat design, geometric, simple shapes, symbolic"
- **Agent avatars:** "portrait style, professional, futuristic lighting,
  subtle glow"
- **Abstract/conceptual:** "abstract digital art, data visualization style,
  flowing lines and nodes"

### Image Specifications by Platform

| Asset Type            | Dimensions    | Format | Max Size | Notes                |
|-----------------------|---------------|--------|----------|----------------------|
| Blog hero image       | 1200 x 630   | PNG    | 2 MB     | Landscape, edge-safe |
| Blog inline image     | 800 x 450    | PNG    | 1 MB     | Content-supporting   |
| X / Twitter post      | 1200 x 675   | PNG    | 5 MB     | 16:9 ratio           |
| Facebook post         | 1200 x 630   | PNG    | 5 MB     | Link preview size    |
| Instagram / Threads   | 1080 x 1080  | PNG    | 5 MB     | Square format        |
| Instagram / TikTok    | 1080 x 1920  | PNG    | 5 MB     | Stories/Reels 9:16   |
| LinkedIn post         | 1200 x 628   | PNG    | 5 MB     | Link preview size    |
| Pinterest pin         | 1000 x 1500  | PNG    | 5 MB     | Vertical 2:3 ratio   |
| Tumblr post           | 1280 x 1920  | PNG    | 10 MB    | Vertical preferred   |
| Email header          | 600 x 200    | PNG    | 500 KB   | Keep simple          |
| App UI placeholder    | Variable      | PNG    | 1 MB     | Match UI component   |

### Production Workflow

1. **Receive request from Sunday** (or directly from a publisher agent for
   urgent needs). Request includes: subject, mood, dimensions, and where the
   image will be used.
2. **Construct DALL-E 3 prompt** using the template above, tailored to the
   content type and dimensions.
3. **Generate image.** Review output for brand consistency: correct color
   palette, no unintended text, clean composition.
4. **Quality check.** Verify dimensions match specification. Check for
   artifacts, distortions, or off-brand elements.
5. **Upload to storage.** All images are stored in the Supabase `kb_uploads`
   bucket under the tenant path: `tenants/{tenantId}/images/`.
6. **Deliver to requester.** Provide the signed URL and image metadata
   (dimensions, file size, prompt used).

### Common Request Types

| Request               | Prompt Focus                                       |
|-----------------------|----------------------------------------------------|
| Agent concept art     | Futuristic professional portrait, holographic glow  |
| Feature illustration  | Abstract representation of the feature concept     |
| Data/analytics visual | Dashboard-style, charts and graphs aesthetic       |
| Team/collaboration    | Connected nodes, network visualization             |
| Security/compliance   | Shield iconography, lock elements, solid structure |
| AI/automation         | Neural network patterns, flowing data streams      |

---

## Victor: Video Production

### Short-Form Video Specs

| Platform       | Aspect Ratio | Duration   | Resolution  | Format |
|----------------|-------------|------------|-------------|--------|
| TikTok         | 9:16        | 15-60s     | 1080x1920   | MP4    |
| Instagram Reels| 9:16        | 15-90s     | 1080x1920   | MP4    |
| YouTube Shorts | 9:16        | 15-60s     | 1080x1920   | MP4    |
| X / Twitter    | 16:9 or 1:1| 15-140s    | 1920x1080   | MP4    |
| LinkedIn       | 16:9 or 1:1| 30-120s    | 1920x1080   | MP4    |

### Long-Form Video Specs

| Platform       | Aspect Ratio | Duration   | Resolution  | Format |
|----------------|-------------|------------|-------------|--------|
| YouTube        | 16:9        | 5-15 min   | 1920x1080   | MP4    |
| Blog embed     | 16:9        | 2-10 min   | 1280x720    | MP4    |

### Video Production Workflow

1. **Receive script from Sunday** (or brief from Binky). Script includes:
   spoken text, visual cues, desired tone, target platform.
2. **Plan visual sequence.** Break script into scenes. Identify which scenes
   need generated visuals (request from Venny) vs. screen recordings vs.
   text overlays.
3. **Request visual assets from Venny** for any scenes requiring custom
   images or backgrounds.
4. **Produce video.** Assemble scenes, add transitions, overlay text where
   needed, add background music if appropriate.
5. **Generate thumbnail.** Request a thumbnail from Venny (1280x720 for
   YouTube, 1080x1920 for TikTok). Thumbnails can include text overlays
   since they are composed, not AI-generated.
6. **Quality check.** Verify: correct aspect ratio, audio levels consistent,
   no abrupt cuts, branding present (intro/outro), captions included for
   accessibility.
7. **Upload and deliver.** Store in `tenants/{tenantId}/videos/` in the
   Supabase bucket. Provide signed URL and metadata to the publisher agent.

### Video Style Guidelines
- **Intro:** 2-3 second branded intro with Atlas UX logo (navy background,
  cyan accent animation).
- **Pacing:** Keep it moving. No shot longer than 5 seconds in short-form.
  Long-form can hold shots up to 10 seconds.
- **Text overlays:** Use white text on semi-transparent dark backgrounds.
  Font: clean sans-serif. Never use more than 8 words per overlay.
- **Music:** Subtle, modern electronic background. Never louder than voice.
  Use royalty-free tracks only.
- **Captions:** Required for all videos. White text, dark background strip,
  positioned in the lower third.
- **Outro:** CTA screen (5 seconds). "Try Atlas UX" with URL. Cyan accent
  on navy background.

---

## Asset Management

### Storage Structure
```
tenants/{tenantId}/
  images/
    blog/           -- Blog headers and inline images
    social/         -- Platform-specific social media images
    ui/             -- App interface assets
    agents/         -- Agent avatars and concept art
  videos/
    short-form/     -- TikTok, Reels, Shorts
    long-form/      -- YouTube, blog embeds
    thumbnails/     -- Video thumbnails
```

### File Naming Convention
`[date]-[type]-[description]-[dimensions].[ext]`
Example: `2026-02-26-blog-hero-ai-agents-overview-1200x630.png`

### Asset Reuse
- Maintain a library of reusable brand elements (logos, patterns, overlays).
- Before generating new assets, search the existing library for something
  that fits. This reduces API costs and ensures visual consistency.
- Tag all assets with metadata: creation date, dimensions, content type,
  platform, and associated content piece.

---

## Guardrails

- Never generate images containing real people's likenesses.
- Never generate content that could be considered offensive, misleading,
  or politically charged.
- All generated images must pass brand consistency review before delivery.
- Video content must include captions for accessibility compliance.
- Asset file sizes must stay within platform limits (see specs above).
- All assets stored in the Supabase bucket; never use external hosting.
- Track DALL-E 3 API usage against daily budget limits set by Tina.
