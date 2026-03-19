# Vidu AI -- Capabilities Overview

> Last verified: 2026-03-18
> Provider: Shengshu Technology (Beijing)
> Platform: vidu.com | API: platform.vidu.com
> Users: 40M+ creators, 10K+ developers/enterprises, 500M+ videos generated since April 2024 launch

---

## Key Takeaways

- Vidu Q3 Pro ranked #2 globally (and #1 in China) on Artificial Analysis Video Arena benchmarks as of early 2026.
- Native audio-visual generation (dialogue, SFX, BGM) in a single pass is Vidu Q3's flagship differentiator -- most competitors require post-production audio.
- Maximum duration is 16 seconds per clip (Q3), 8 seconds (Q2/2.0), with 1080p max resolution at 24 fps.
- Supported audio dialogue languages: Chinese, English, Japanese. Text rendering in-frame also supports these three languages.
- Multiple model tiers (Q3 Pro, Q3 Turbo, Q2 Pro, Q2 Turbo, Q1, 2.0) each optimized for different use cases.
- Vidu excels at stylized/anime content and fast generation but struggles with complex physics, multi-person scenes, and fine-grained audio sync.

---

## Available Models

### Vidu Q3 (Latest -- Early 2026)

The flagship model focused on storytelling, native audio, and extended duration.

| Spec | Detail |
|------|--------|
| **Max duration** | 16 seconds |
| **Max resolution** | 1920x1080 (1080p) |
| **Frame rate** | 24 fps |
| **Native audio** | Yes -- dialogue, SFX, BGM generated in one pass |
| **Audio languages** | Chinese, English, Japanese |
| **Text rendering** | In-frame text in Chinese, English, Japanese |
| **Camera control** | Smart shot switching, pans, zooms, cinematographic direction via prompt |
| **Input modes** | Text-to-Video (T2V), Image-to-Video (I2V) |
| **Benchmark rank** | #2 globally, #1 China (Artificial Analysis Video Arena) |

**Variants:**

| Variant | Focus | Key Difference |
|---------|-------|----------------|
| **Q3 Pro** | Maximum quality | Best visual fidelity, full audio, 16-sec max |
| **Q3 Turbo** | Speed | Reduced latency for high-volume pipelines; synchronized audio; shorter clips |

### Vidu Q2 (Mid 2025)

Focused on reference control, brand consistency, and visual fidelity.

| Spec | Detail |
|------|--------|
| **Max duration** | 8 seconds |
| **Max resolution** | 1080p |
| **Frame rate** | 24 fps |
| **Native audio** | No |
| **Input modes** | Image-to-Video (I2V), Reference-to-Video (R2V) |
| **Strengths** | Brand consistency, facial expression subtlety, push-pull camera, logo/color fidelity |

**Variants:**

| Variant | Focus | Key Difference |
|---------|-------|----------------|
| **Q2 Pro** | Visual consistency | 2 video refs + 4 image refs in unified workflow; best for branding |
| **Q2 Turbo** | Speed | Fast inference for simple/short creations; action-packed with stable transitions |

### Vidu Q1 (Early-Mid 2025)

Text-to-Video focused model with character consistency and multi-reference support.

| Spec | Detail |
|------|--------|
| **Max duration** | 8 seconds |
| **Max resolution** | 1080p |
| **Frame rate** | 24 fps |
| **Native audio** | Optional (limited) |
| **Input modes** | Text-to-Video (T2V), Reference-to-Video |
| **Strengths** | Anime-style content, product ads, character consistency across clips |

### Vidu 2.0 (Late 2024 - Early 2025)

The baseline production model, still widely used for cost-effective generation.

| Spec | Detail |
|------|--------|
| **Max duration** | 8 seconds |
| **Max resolution** | 1080p |
| **Frame rate** | 24 fps |
| **Native audio** | No |
| **Input modes** | Image-to-Video (I2V), Text-to-Video (T2V) |
| **Cost** | ~$0.0375/sec (55% below industry avg) |
| **Generation speed** | ~10 seconds per video |
| **Strengths** | Speed, cost, smooth transitions, first-to-last frame consistency |

---

## Supported Input Modes

| Mode | Description | Models |
|------|-------------|--------|
| **Text-to-Video (T2V)** | Generate video from text prompt | All models |
| **Image-to-Video (I2V)** | Animate a reference image with text-guided motion | Q3, Q2, 2.0 |
| **Reference-to-Video (R2V)** | Generate video maintaining subject consistency from reference images | Q2 Pro, Q1 |
| **Start-End Frame** | Generate video between a start and end frame | Q1, 2.0 |
| **First/Last Frame** | Specify first or last frame for controlled generation | Q2, 2.0 |

---

## Resolution and Aspect Ratio Support

| Resolution | Pixel Dimensions | Available On |
|-----------|-----------------|--------------|
| 360p | 640x360 | API only (some endpoints) |
| 520p | 928x520 | API only (some endpoints) |
| 720p | 1280x720 | All models |
| 1080p | 1920x1080 | All models |

**Aspect Ratios:** Standard 16:9 is the primary output. Some models support custom aspect ratios via API parameters.

---

## Audio Capabilities (Q3 Only)

| Feature | Detail |
|---------|--------|
| **Dialogue generation** | Native in Chinese, English, Japanese |
| **Sound effects (SFX)** | Auto-generated based on scene content |
| **Background music (BGM)** | Auto-generated; 4-sec clips only for some modes |
| **Audio sync** | Scene-level sync (good); micro-level sync like lip-sync or key-turning (limited) |
| **Multi-speaker** | Supported but hard to control precisely via prompts |
| **Language tags** | EN-US, EN-UK, ES-MX, FR-FR, JP documented |

### Audio Limitations

- Background music generation may be limited to 4-second clips in some configurations.
- Micro-level audio sync (lip movements matching specific words) is approximate, not frame-accurate.
- Multiple overlapping speakers are difficult to control through text prompts alone.
- BGM can sometimes clash tonally with intended mood.

---

## API Integration

### Authentication

```
Authorization: Bearer <API_KEY>
```

API keys are generated at: Settings > API > API Keys (on platform.vidu.com).

### Workflow (Async Pattern)

1. **Submit job** -- POST to generation endpoint with parameters (prompt, resolution, duration, model, etc.)
2. **Receive task_id** -- Immediate response with task identifier
3. **Poll for result** -- GET task status endpoint with task_id until status = completed
4. **Download result** -- Retrieve video URL from completed task response

### Key API Endpoints (Official)

| Endpoint | Purpose |
|----------|---------|
| `POST /generations` | Submit text-to-video or image-to-video job |
| `GET /generations/{task_id}` | Check job status and retrieve result |
| `GET /me` | Get user/workspace info associated with API key |

### API Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | string | Text description of desired video |
| `image_url` | string | Reference image URL (for I2V) |
| `resolution` | enum | 540p, 720p, 1080p |
| `duration` | int | Video length in seconds (1-16 for Q3, 1-8 for Q2/2.0) |
| `motion_intensity` | enum | auto, small, medium, large |
| `model` | string | Model identifier (q3-pro, q3-turbo, q2-pro, etc.) |
| `audio` | boolean | Enable native audio generation (Q3 only) |

### Third-Party API Access

Vidu models are available through multiple aggregator platforms:

| Provider | URL | Models Available |
|----------|-----|-----------------|
| fal.ai | fal.ai/models/fal-ai/vidu | Q3, Q2, R2V, Start-End |
| Novita AI | novita.ai | Q3 Pro, Q2, Q1, 2.0 |
| Atlas Cloud | atlascloud.ai | Q3-Pro, Q3-Turbo (T2V + I2V) |
| WaveSpeed AI | wavespeed.ai | Q3-Turbo I2V, collections |
| Runware | runware.ai | Q3, Q3-Turbo |
| Segmind | segmind.com | Q1 R2V, Template |
| RunPod | runpod.io | Q3 I2V (serverless) |

---

## Quality Comparison vs Competitors

| Dimension | Vidu Q3 | Sora 2 | Kling 3.0 | Veo 3.1 | Runway Gen-4.5 |
|-----------|---------|--------|-----------|---------|----------------|
| **Visual realism** | Good | Excellent | Very Good | Excellent | Good |
| **Motion coherence** | Good | Excellent | Very Good | Very Good | Good |
| **Native audio** | Yes (3 langs) | Yes | No | Yes | No |
| **Max duration** | 16 sec | 20 sec | 120 sec | 8 sec | 10 sec |
| **Max resolution** | 1080p | 1080p | 1080p | 4K | 1080p |
| **Generation speed** | Fast | Slow | Fast | Medium | Medium |
| **Cost/second** | ~$0.04 | Bundled | ~$0.03 | ~$0.15 | ~$0.05-0.10 |
| **Anime/stylized** | Excellent | Good | Good | Good | Good |
| **Physics accuracy** | Fair | Excellent | Good | Very Good | Fair |
| **Character consistency** | Good | Good | Good | Good | Fair |
| **Camera control** | Good (smart cuts) | Basic | Excellent (S&E frame) | Good | Good |
| **API availability** | Yes + 7 aggregators | No (ChatGPT only) | Yes | Yes | Yes |
| **Benchmark rank** | #2 global | N/A | Top 5 | Top 3 | Top 5 |

### Best Use Cases by Provider

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| Budget content at scale | **Vidu** | Off-Peak = free; $0.04/sec otherwise |
| Photorealistic narrative | **Sora 2** | Best physics and lighting |
| Long-form clips (>30s) | **Kling 3.0** | 2-minute max; cheapest per-sec |
| Cinematic quality + audio | **Veo 3.1** | Google's quality lead; 4K support |
| Anime/stylized content | **Vidu Q3** | Strongest in this category |
| Brand-consistent series | **Vidu Q2 Pro** | Reference control is unmatched |
| Audio + video in one pass | **Vidu Q3** | Only Vidu and Veo do this well at low cost |

---

## Unique Features

1. **Off-Peak Unlimited Generation** -- No other major competitor offers unlimited free generation during off-peak hours.
2. **Native Audio-Visual in One Pass** -- Q3 generates synchronized dialogue, SFX, and BGM alongside video frames. Most competitors require separate audio generation.
3. **Multi-Reference Workflow** -- Q2 Pro supports 2 video + 4 image references in a single generation for brand consistency.
4. **Smart Camera Switching** -- Q3 automatically selects shot types and transitions based on scene content when prompted with cinematographic direction.
5. **Text-in-Frame Rendering** -- Q3 can render text overlays directly within generated video frames (Chinese, English, Japanese).
6. **Animated Series Production** -- At SXSW 2026, Vidu unveiled the world's first AI solution for animated series production (multi-episode, consistent characters).
7. **Fastest Generation Speed** -- Vidu 2.0 generates videos in ~10 seconds; Q2 Turbo maintains fastest commercial-grade speeds globally.

---

## Limitations and Weaknesses

### Visual Quality Issues

- **Complex physics**: Overlapping limbs, fast motion, liquids can look unrealistic.
- **Crowd scenes**: Multiple people with distinct actions cause artifacts, flicker, and unnatural motion.
- **Finger rendering**: Hands/fingers can appear "mushy" in detailed shots.
- **Black dot artifacts**: Unexplained dark artifacts occasionally appear in early frames.
- **Scene boundaries**: Multi-shot scenes can produce bad dissolve transitions instead of clean cuts.

### Audio Issues

- **BGM tonal mismatch**: Background music sometimes clashes with intended mood.
- **Lip-sync precision**: Scene-level sync only; frame-accurate lip-sync not supported.
- **Multi-speaker control**: Difficult to precisely direct multiple overlapping speakers via text prompt.
- **BGM duration**: Background music generation limited to 4-second clips in some modes.

### Platform Constraints

- **Short clips only**: 16-sec max (Q3), 8-sec max (Q2/2.0) -- no long-form generation.
- **Credit burn rate**: Heavy experimentation consumes credits quickly; longer videos carry higher trial-and-error costs.
- **Free tier limits**: 4-sec max clips, watermarked, no commercial use.
- **Regional availability**: Developed in China (Shengshu Technology); some API features may have regional restrictions.
- **No real-time generation**: All generation is async/queued.

### Compared to Competitors

- **Less realistic than Sora** for photorealistic content and physics simulation.
- **Shorter than Kling** which supports up to 2-minute clips.
- **Lower resolution than Veo** which supports 4K output.
- **Less flexible than Runway** for experimental/artistic workflows.

---

## Integration Notes for Atlas UX

### Recommended Integration Path

1. **Use Vidu API directly** (platform.vidu.com) for programmatic access with Bearer token auth.
2. **Alternatively**, use a third-party aggregator (fal.ai, Novita AI) for unified multi-model API access if Atlas needs to switch between Vidu, Kling, and other providers.
3. **Async workflow** fits Atlas's existing job queue pattern (submit, poll, retrieve) -- maps directly to the `jobs` table (queued -> running -> completed/failed).

### Model Selection Guide for Atlas

| Atlas Use Case | Recommended Model | Why |
|----------------|-------------------|-----|
| Blog/social cover videos | Q3 Pro (with audio) | Best quality, native audio for social |
| Product demo clips | Q2 Pro (I2V) | Brand consistency from product images |
| High-volume marketing | Q3 Turbo or Q2 Turbo | Speed-optimized for pipelines |
| Budget batch generation | Any model via Off-Peak | $0.00 cost during off-peak |
| Quick prototyping | Vidu 2.0 | Fastest and cheapest baseline |

### Integration Architecture

```
Atlas Job Queue -> Vidu API Client -> POST /generations
                                          |
                                     task_id returned
                                          |
                                   Poll GET /generations/{id}
                                          |
                                   status: completed
                                          |
                                   Download video URL
                                          |
                                   Store in Atlas CDN/S3
```

### Credential Storage

- API key should be stored in `tenant_credentials` table encrypted via AES-256-GCM (existing `credentialResolver.ts` pattern).
- Credential key: `VIDU_API_KEY`
- Fallback to `process.env.VIDU_API_KEY` for platform owner tenant.

### Cost Controls

- Implement per-tenant daily generation limits in line with existing `MAX_ACTIONS_PER_DAY` pattern.
- Track credit usage via audit trail.
- Route non-urgent generations to Off-Peak Mode for zero-cost processing.
- Set resolution defaults to 720p unless 1080p is explicitly requested (saves ~50% on credits).

---

## Sources

- [Vidu Official Platform](https://www.vidu.com/)
- [Vidu Q3 Feature Page](https://www.vidu.com/vidu-q3)
- [Vidu API Documentation](https://platform.vidu.com/)
- [What Is Vidu Q3? (PromeAI)](https://www.promeai.pro/blog/what-is-vidu-q3/)
- [Vidu Q3 -- Maybe Best AI Video Model 2026 (CometAPI)](https://www.cometapi.com/what-is-vidu-q3/)
- [Vidu Models: The Essentials (Scenario)](https://help.scenario.com/en/articles/vidu-models-the-essentials/)
- [Vidu Q3 Review (Gaga Art)](https://gaga.art/blog/vidu-q3/)
- [Vidu Q3 vs Q2 Pro R2V (Cutout.pro)](https://www.cutout.pro/learn/blog-vidu-q3-vs-vidu-q2-reference-to-video-pro/)
- [Vidu Q3 Pro #2 Global Ranking (Artificial Analysis via X)](https://x.com/ArtificialAnlys/status/2017225053008719916)
- [Vidu SXSW 2026 Animated Series Announcement](https://www.manilatimes.net/2026/03/16/tmt-newswire/pr-newswire/vidu-unveils-the-worlds-first-ai-solution-for-animated-series-production-at-sxsw-2026/2300902)
- [Vidu Global Creativity Week PR](https://www.prnewswire.com/news-releases/vidu-showcases-china-speed-in-advancing-ai-video-into-production-at-global-creativity-week-302675040.html)
- [Vidu AI Limitations Review (FirmSuggest)](https://www.firmsuggest.com/blog/understanding-vidu-ai-capabilities-drawbacks-what-users-really-say/)
- [Vidu AI Review 2026 (AI Chief)](https://aichief.com/ai-video-tools/vidu-ai/)
- [AI Video Models Comparison 2026 (OpenCreator)](https://opencreator.io/blog/ai-video-models-comparison-2026)
- [fal.ai Vidu Models](https://fal.ai/models/fal-ai/vidu/reference-to-video/api)
- [Novita AI Vidu Q3 Pro](https://blogs.novita.ai/vidu-q3-pro-on-novita-ai/)
- [Runware Vidu Docs](https://runware.ai/docs/providers/vidu)


---
## Media

> **Tags:** `vidu` · `ai-video` · `text-to-video` · `fast-generation` · `4-second` · `8-second`

### Official Resources
- [Official Documentation](https://www.vidu.studio)
- [Gallery / Showcase](https://www.vidu.studio/explore)
- [Vidu Studio](https://www.vidu.studio)
- [Vidu Explore Gallery](https://www.vidu.studio/explore)

### Video Tutorials
- [Vidu AI Video Generator Tutorial](https://www.youtube.com/results?search_query=vidu+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `tutorial`
- [Vidu - Fast AI Video Generation Review](https://www.youtube.com/results?search_query=vidu+ai+fast+video+generation+review) — *Credit: AI Reviews on YouTube* `review`

> *All video content is credited to original creators. Links direct to source platforms.*
