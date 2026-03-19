# AI Video Generation Budget Optimization Guide
**For Venny & Victor Agents -- Atlas UX Video Production**
**Sources:** Internal pricing research (pricing-sora2.md, pricing-veo3.md, pricing-kling.md, pricing-wan-selfhosted.md, pricing-comparison-matrix.md, pricing-third-party-apis.md), [Cliprise AI Video Guide 2026](https://www.cliprise.app/learn/guides/getting-started/ai-video-generation-complete-guide-2026), [Hypereal Pricing Guide](https://hypereal.tech/a/ai-video-generation-pricing-2026), [Venice AI Prompt Engineering](https://venice.ai/blog/the-complete-guide-to-ai-video-prompt-engineering), [Runware Model Comparison](https://runware.ai/blog/ai-video-model-comparison-guide-choosing-the-right-model-for-your-project), [LTX Studio Cost Guide](https://ltx.studio/blog/ai-video-generation-cost), [Kling AI Complete Guide](https://aitoolanalysis.com/kling-ai-complete-guide/), [Frameo Prompt Guide](https://frameo.ai/blog/create-prompts-ai-video-generation/)
**Date:** 2026-03-18
**Last Verified:** 2026-03-18

---

## Quick Reference: Cost-Per-Second Cheat Sheet

| Tier | Model | $/Second | Use For |
|------|-------|----------|---------|
| Floor | Wan 2.1 on RTX 4090 (Vast.ai) | $0.005 | 480p throwaway drafts |
| Budget | Kling 3.0 via fal.ai | $0.029 | Social drafts, iteration |
| Budget | Wan 2.1 on A100 (Vast.ai) | $0.032 | 720p drafts at scale |
| Budget | Vidu 2.0 via fal.ai | $0.038 | Cheapest API option |
| Mid | Kling API O1 Standard | $0.084 | Mid-quality production |
| Mid | Sora 2 Standard (720p) | $0.100 | Good quality, fast |
| Mid | Veo 3.1 Fast (1080p) | $0.150 | Best quality per dollar |
| Premium | Sora 2 Pro (720p) | $0.300 | Cinematic finals |
| Premium | Veo 3.1 Standard (1080p) | $0.400 | High-fidelity finals |
| Premium | Sora 2 Pro (1080p) | $0.500 | Maximum quality |
| Premium | Veo 3.0 + audio | $0.750 | Native audio, top tier |

---

## 1. The Draft-to-Final Pipeline

### The Core Principle

Never iterate on expensive models. Use cheap/fast models to nail the concept, then render the final version once on a premium model. This single rule can cut video production costs by 60-80%.

### The Three-Stage Pipeline

```
STAGE 1: Concept (cheapest possible)
  Model: Wan 2.1 1.3B (self-hosted) or Kling Standard (web)
  Cost:  $0.005-$0.09 per attempt
  Goal:  Validate composition, motion, pacing
  Reps:  5-15 attempts typical

STAGE 2: Refinement (mid-tier)
  Model: Kling 3.0 via fal.ai or Sora 2 Standard
  Cost:  $0.029-$0.10 per second
  Goal:  Lock prompt, verify quality at target resolution
  Reps:  2-5 attempts typical

STAGE 3: Final Render (premium, once)
  Model: Sora 2 Pro, Veo 3.1 Standard, or Kling 3.0 Professional
  Cost:  $0.30-$0.50 per second
  Goal:  Production-ready output
  Reps:  1-2 attempts (prompt is already proven)
```

### Cost Savings Example: 10-Second Social Video

**Without pipeline (brute force on premium model):**
- 10 iterations on Sora 2 Pro @ 1080p: 10 x 10s x $0.50 = **$50.00**
- Total: $50.00

**With draft-to-final pipeline:**
- 8 drafts on Kling via fal.ai: 8 x 10s x $0.029 = $2.32
- 3 refinements on Sora 2 Standard: 3 x 10s x $0.10 = $3.00
- 1 final on Sora 2 Pro @ 1080p: 1 x 10s x $0.50 = $5.00
- Total: **$10.32** (79% savings)

### Cost Savings Example: 5-Second Product Shot

**Brute force:**
- 10 iterations on Veo 3.1 Standard: 10 x 5s x $0.40 = **$20.00**

**With pipeline:**
- 10 drafts on Kling Standard (web, Pro plan): 10 x 10 credits = 100 credits ($0.90)
- 2 refinements on Veo 3.1 Fast: 2 x 5s x $0.15 = $1.50
- 1 final on Veo 3.1 Standard: 1 x 5s x $0.40 = $2.00
- Total: **$4.40** (78% savings)

### When to Graduate a Draft to Final Render

Promote from Stage 1 to Stage 2 when:
- Composition and framing match the creative brief
- Subject motion and pacing feel right (even if quality is low)
- The prompt consistently produces the desired result (2+ similar outputs)

Promote from Stage 2 to Stage 3 when:
- The prompt produces the target result on first attempt
- No further creative changes are needed
- Client/stakeholder has approved the concept draft
- The output will be used in a public-facing deliverable

**Stay in draft stage when:**
- Exploring creative directions (never explore on premium models)
- Testing prompt variations
- Building a storyboard or shot list
- Creating internal-only content (drafts may be good enough)

---

## 2. Credit System Strategies

### Kling Credit System -- How to Maximize It

**Understanding the math:**
- 1 credit is NOT 1 dollar
- Pro plan ($25.99/mo) = 3,000 credits = ~$0.009/credit
- Premier plan ($64.99/mo) = 8,000 credits = ~$0.008/credit
- Ultra plan ($180/mo) = 26,000 credits = ~$0.007/credit
- Annual billing saves 34% across all tiers

**Credit cost per video:**

| Video Type | Credits | Cost (Pro Plan) |
|------------|---------|-----------------|
| 5s Standard | 10 | $0.09 |
| 10s Standard | 20 | $0.18 |
| 5s Professional | 35 | $0.32 |
| 10s Professional | 70 | $0.63 |
| 5s + native audio | 50 | $0.45 |
| 10s + native audio | 100-200 | $0.90-$1.80 |

**Optimization tactics:**
1. **Use Standard mode for everything except finals** -- 3.5x cheaper than Professional (10 vs 35 credits for 5s)
2. **Never use native audio on Kling** -- it costs 2.5-5x more credits. Add audio in post-production instead
3. **Exhaust free tier first** -- 66 credits/day = ~6 standard 5s clips for testing, no credit card needed
4. **Track daily free credits** -- they reset daily and do NOT roll over. Use them or lose them
5. **Pro plan is the sweet spot** -- best credits-per-dollar for moderate usage (300 standard 5s clips/month)
6. **Go annual if committed** -- 34% savings ($17.16/mo vs $25.99/mo effective)

### OpenAI Tier Progression for Sora 2

OpenAI rate limits are tied to cumulative spend. Higher tiers unlock more requests per minute:

| Tier | Cumulative Spend | RPM | Strategy |
|------|-----------------|-----|----------|
| Tier 1 | $5 | 25 | Starting tier -- fine for testing |
| Tier 2 | $10 | 50 | **Minimum for Sora 2 access** |
| Tier 3 | $50 | 100 | Good for regular production |
| Tier 4 | $250 | 200 | Heavy production workloads |
| Tier 5 | $1,000 | 375 | Enterprise-scale |

**Progression tactics:**
- Reach Tier 2 ($10 spend) ASAP to unlock Sora 2 models -- this is the entry gate
- Use Sora 2 Standard ($0.10/sec) for routine work to build spend toward Tier 3
- Tier 3 (100 RPM) is sufficient for most production workflows
- Monitor for Batch API support -- when it launches, expect 50% discount (like text models)

### Google Veo API Optimization

**Free tier:** No free tier on Vertex AI as of March 2026.

**Consumer plan arbitrage:**
- AI Pro ($19.99/mo) = 90 videos/month (3/day) = ~$0.22/video effective
- However, 3 videos/day is too rate-limited for production. Only useful for personal testing
- AI Ultra ($249.99/mo) = 150 videos/month = ~$1.67/video -- worse value than API

**API tier progression:**
- Quota increases are NOT automatic -- you must submit a request through Google Cloud Console
- Apply for Tier 2 early (requires $250+ spend and 30+ days) -- approval takes days
- Always use Veo 3.1 Fast ($0.15/sec) over Veo 3.1 Standard ($0.40/sec) unless quality demands it
- 720p and 1080p are the same price on Veo -- always generate at 1080p

### Third-Party API Arbitrage

Route generation through cheaper providers when quality is identical:

| Model | Official Price | fal.ai Price | Savings |
|-------|---------------|-------------|---------|
| Kling 3.0 | $0.084/sec | $0.029/sec | **65%** |
| Veo 3.1 Fast | $0.15/sec | ~$0.10/sec | **33%** |
| Sora 2 Standard | $0.10/sec | $0.10/sec | 0% |
| Sora 2 Pro | $0.30/sec | $0.30/sec | 0% |

**Rules for third-party routing:**
- Use fal.ai for ALL Kling generation -- 65% cheaper, identical output
- Use fal.ai for Veo 3.1 Fast -- 33% cheaper
- Use OpenAI direct for Sora 2 -- no third-party discount, better rate limits
- fal.ai's Vidu 2.0 at $0.0375/sec is the absolute cheapest API video generation available
- Always maintain direct API credentials as fallback -- third-party providers can change pricing or drop models

---

## 3. Cost Comparison Framework for Agents

### Decision Tree: Choosing the Right Model

```
START: What is the deliverable?
  |
  +-- Internal draft / concept exploration?
  |     Budget: < $0.10/video
  |     -> Kling Standard (web) at $0.09/5s
  |     -> Wan 2.1 self-hosted at $0.03-$0.16/5s
  |     -> fal.ai Kling 3.0 at $0.15/5s
  |
  +-- Social media content (Instagram, TikTok, X)?
  |     Budget: $0.10-$1.00/video
  |     Quality: Good enough for feed, not hero
  |     -> fal.ai Kling 3.0 ($0.029/sec) -- best value
  |     -> Sora 2 Standard ($0.10/sec) -- if Kling quality insufficient
  |     -> Veo 3.1 Fast ($0.15/sec) -- if 1080p needed
  |
  +-- Product demonstration / client-facing?
  |     Budget: $1.00-$5.00/video
  |     Quality: Must be polished
  |     -> Veo 3.1 Fast ($0.15/sec) at 1080p -- best quality per dollar
  |     -> Sora 2 Standard ($0.10/sec) -- if 720p acceptable
  |     -> Kling Professional ($0.063/sec web) -- budget option
  |
  +-- Brand hero / cinematic / homepage?
  |     Budget: $5.00-$15.00/video
  |     Quality: Maximum -- this is the money shot
  |     -> Sora 2 Pro 1080p ($0.50/sec) -- best cinematic quality
  |     -> Veo 3.1 Standard ($0.40/sec) -- alternative top tier
  |     -> Veo 3.0 + audio ($0.75/sec) -- if native audio needed
  |
  +-- Needs audio baked in?
        -> Veo 3.0 ($0.75/sec) -- best native audio
        -> Kling 3.0 Omni (via PiAPI) -- cheaper but less quality
        -> RECOMMENDATION: Add audio in post-production to save 2-5x
```

### Cost Per Deliverable Type

| Deliverable | Duration | Resolution | Recommended Model | Cost/Video | Iterations Budget |
|-------------|----------|------------|-------------------|------------|-------------------|
| Social clip (feed) | 5s | 720p | fal.ai Kling 3.0 | $0.15 | $0.60 (4 drafts) |
| Social clip (premium) | 5s | 1080p | Veo 3.1 Fast | $0.75 | $1.50 (2 drafts) |
| Product demo | 8s | 1080p | Veo 3.1 Fast | $1.20 | $2.40 (2 drafts) |
| Client testimonial bg | 10s | 720p | Sora 2 Standard | $1.00 | $2.00 (2 drafts) |
| Brand hero video | 10s | 1080p | Sora 2 Pro | $5.00 | $7.00 (4 cheap drafts + final) |
| Homepage cinematic | 15s | 1080p | Sora 2 Pro | $7.50 | $10.50 (drafts + final) |
| Treatment / short | 30s | 1080p | Sora 2 Pro (spliced) | $15.00 | $20.00 (drafts + final) |
| Internal concept | 5s | 480p | Wan 2.1 (4090) | $0.03 | $0.30 (10 drafts) |

### Monthly Budget Templates

#### Starter Plan: $50/month
For small businesses producing basic social content.

| Allocation | Videos | Model | Cost |
|------------|--------|-------|------|
| Social clips | 40x 5s | fal.ai Kling 3.0 | $5.80 |
| Product shots | 8x 8s | Veo 3.1 Fast | $9.60 |
| Hero content | 2x 10s | Sora 2 Pro 720p | $6.00 |
| Draft iterations | ~60 | Kling Standard (web) | $5.40 |
| Kling Pro plan | 1 | Subscription | $25.99 |
| **Total** | **~110 generations** | | **$52.79** |

Output: ~50 finished videos/month

#### Growth Plan: $100/month
For active content teams needing regular output.

| Allocation | Videos | Model | Cost |
|------------|--------|-------|------|
| Social clips | 80x 5s | fal.ai Kling 3.0 | $11.60 |
| Product shots | 15x 8s | Veo 3.1 Fast | $18.00 |
| Client-facing | 5x 10s | Sora 2 Standard | $5.00 |
| Hero content | 4x 10s | Sora 2 Pro 1080p | $20.00 |
| Draft iterations | ~100 | Kling Standard (web) | $9.00 |
| Kling Pro plan | 1 | Subscription | $25.99 |
| **Total** | **~204 generations** | | **$89.59** |

Output: ~104 finished videos/month

#### Production Plan: $500/month
For agencies and heavy content production.

| Allocation | Videos | Model | Cost |
|------------|--------|-------|------|
| Social clips | 200x 5s | fal.ai Kling 3.0 | $29.00 |
| Product shots | 50x 8s | Veo 3.1 Fast | $60.00 |
| Client-facing | 20x 10s | Sora 2 Standard | $20.00 |
| Hero content | 15x 10s | Sora 2 Pro 1080p | $75.00 |
| Cinematic pieces | 5x 15s | Sora 2 Pro 1080p | $37.50 |
| Wan 2.1 self-hosted (A100) | ~200 drafts | A100 Vast.ai | $32.00 |
| Draft iterations (API) | ~150 | fal.ai Kling 3.0 | $21.75 |
| Kling Premier plan | 1 | Subscription | $64.99 |
| fal.ai buffer | -- | Various | $50.00 |
| **Total** | **~640 generations** | | **$390.24** |

Output: ~290 finished videos/month, ~350 drafts

#### Studio Plan: $1,000/month
For full-scale video production operations.

| Allocation | Videos | Model | Cost |
|------------|--------|-------|------|
| Social clips | 400x 5s | fal.ai Kling 3.0 | $58.00 |
| Product shots | 100x 8s | Veo 3.1 Fast | $120.00 |
| Client-facing | 50x 10s | Veo 3.1 Fast | $75.00 |
| Hero content | 30x 10s | Sora 2 Pro 1080p | $150.00 |
| Cinematic pieces | 15x 15s | Sora 2 Pro 1080p | $112.50 |
| Wan 2.1 self-hosted (A100 reserved) | 500+ drafts | A100 reserved | $60.00 |
| Kling Ultra plan | 1 | Subscription | $180.00 |
| API buffer & overages | -- | Various | $150.00 |
| **Total** | **~1,100+ generations** | | **$905.50** |

Output: ~595 finished videos/month, ~500+ drafts

### ROI: AI Video vs Hiring a Videographer

| Cost Factor | AI Video (Growth Plan) | Freelance Videographer | Agency |
|-------------|----------------------|----------------------|--------|
| Monthly cost | $100 | $2,000-$5,000 | $10,000-$50,000 |
| Videos/month | ~104 | 4-8 | 10-20 |
| Cost/video | ~$0.96 | $250-$1,250 | $500-$5,000 |
| Turnaround | Minutes | 1-2 weeks | 2-4 weeks |
| Revisions | Unlimited (re-generate) | 1-2 rounds included | 2-3 rounds |
| 24/7 availability | Yes | No | No |
| Human quality ceiling | 85-90% of pro video | 100% (is the standard) | 100%+ |

**Bottom line:** AI video at $100/mo replaces $2,000-$5,000/mo in videographer costs for social and product content. Reserve human videographers for testimonials requiring real people and complex narrative work.

---

## 4. Maximizing Value Tips

### 4.1 Prompt Optimization (Reduce Re-Generations)

The single biggest budget drain is re-generating because the output missed the mark. A well-crafted prompt gets it right on the first or second attempt instead of the eighth.

**The 5-element prompt structure:**
```
[Shot type] of [subject doing action] in [setting/environment],
[camera movement], [lens/focal length],
[lighting], [atmosphere/mood],
[technical style details]
```

**Example -- Bad prompt (will need 5-10 iterations):**
> A plumber fixing a sink

**Example -- Good prompt (1-2 iterations):**
> Medium close-up of a professional plumber in clean navy coveralls
> tightening a chrome faucet under a modern white kitchen sink,
> steady handheld camera, 35mm lens, bright natural window light
> with soft shadows, clean professional atmosphere,
> shallow depth of field, photorealistic style

**Cost impact of good prompts:**
- Bad prompt: 8 iterations x $0.15 = $1.20 per finished video
- Good prompt: 2 iterations x $0.15 = $0.30 per finished video
- Savings: **75% per video, compounding across hundreds of videos**

**Additional prompt tips:**
- Use negative prompts when supported (specify what you do NOT want)
- Include specific camera/lens language -- AI models are trained on film terminology
- Describe lighting explicitly -- "golden hour" and "overcast diffused" produce very different results
- For consistency across shots, repeat the same descriptors (clothing, setting, color palette)
- Change only one variable at a time when iterating -- isolates what the model misunderstood

### 4.2 Resolution Ladder Strategy

Generate at the minimum viable resolution, upscale only for final delivery.

```
Drafting:     480p (Wan 2.1 on 4090)     -- $0.005/sec
Refinement:   720p (Sora 2 Standard)     -- $0.10/sec
Production:   1080p (Veo 3.1 Fast)       -- $0.15/sec
Hero/4K:      1080p + AI upscale to 4K   -- $0.15/sec + $0.02 upscale
```

**Why this works:**
- 480p is 4x cheaper than 720p on Sora 2 ($0.025 vs $0.10/sec)
- 720p and 1080p are the same price on Veo -- always pick 1080p there
- Native 4K costs 2.3x more than 1080p on Veo 3.1 ($0.60 vs $0.35/sec)
- AI upscaling (Topaz, Real-ESRGAN) from 1080p to 4K costs ~$0.01-$0.02 per frame and produces near-native quality
- For social media delivery (Instagram, TikTok), 1080p is the maximum displayed resolution -- 4K is wasted money

### 4.3 Batch Processing for Volume Discounts

**API batching:**
- Submit multiple generation requests simultaneously to maximize GPU utilization
- Some providers offer batch endpoints with 50% discounts (monitor OpenAI for video batch API)
- Queue non-urgent work for off-peak or batch processing

**Subscription batching:**
- On Kling Pro plan (3,000 credits/mo), plan your credit spend to use all credits before renewal
- Credits do NOT roll over on most plans -- unused credits are wasted budget
- Front-load generation early in the billing cycle; avoid end-of-month rushes when servers are slower

**Self-hosted batching:**
- Run Wan 2.1 batch jobs overnight on spot instances (30-50% cheaper)
- Queue an entire week of social content for Saturday night batch processing
- Use multi-GPU setups for near-linear speedup (8x A100 = 7.1x faster)

### 4.4 Reuse and Remix

**Image-to-Video (I2V) instead of Text-to-Video (T2V):**
- Generate a perfect still frame first (DALL-E, Midjourney, Flux -- $0.01-$0.05 per image)
- Use I2V to animate it -- more controllable, fewer iterations needed
- I2V typically costs the same as T2V per second but requires fewer re-generations

**Variation and remix features:**
- Use "extend" or "outpaint" on good clips rather than generating from scratch
- Use motion transfer: apply the motion from one good generation to new subject matter
- Save good generations as reference frames for future I2V work

**Build a prompt library:**
- Catalog proven prompts by category (product shot, social hook, testimonial background, etc.)
- Re-use and adapt proven prompts rather than writing from scratch each time
- Tag prompts with the model they were optimized for (prompts that work on Kling may not work on Sora)

### 4.5 Avoid Native Audio Generation

Native audio (voice, sound effects, music baked into the video) costs 2-5x more:

| Model | Video Only | Video + Audio | Premium |
|-------|-----------|---------------|---------|
| Veo 3.0 | $0.50/sec | $0.75/sec | +50% |
| Kling 3.0 Omni | 10 credits/5s | 50 credits/5s | +400% |

**Instead:**
- Generate video without audio
- Add voiceover with ElevenLabs ($0.30/1,000 characters -- pennies per clip)
- Add music from royalty-free library (Epidemic Sound, Artlist -- flat monthly fee)
- Add sound effects in post-production (free SFX libraries)
- Total post-production audio cost: ~$0.05-$0.50 vs $2.00-$5.00 for native

### 4.6 Duration Optimization

**Keep clips short:**
- Models produce optimal quality at 5-8 seconds
- Longer clips (15-25s) show motion degradation and cost linearly more
- Generate multiple short clips and edit together rather than one long clip
- Social media sweet spot: 3-7 seconds per cut

**Duration cost comparison (Sora 2 Pro @ 1080p):**

| Duration | Cost | Use Case |
|----------|------|----------|
| 4s | $2.00 | Social hook, product flash |
| 8s | $4.00 | Product demo, B-roll |
| 10s | $5.00 | Standard social clip |
| 15s | $7.50 | Story segment |
| 25s | $12.50 | Long-form segment |

**Rule of thumb:** If a 5-second clip tells the story, do not generate a 10-second clip. You are paying double for duration that may get trimmed in editing.

---

## 5. Budget Allocation by Use Case

### Recommended Model Selection by Use Case

| Use Case | Recommended Model | Cost/Video (5-10s) | Monthly Budget (20 videos) | Quality Level |
|----------|-------------------|--------------------|-----------------------------|---------------|
| Social media shorts | fal.ai Kling 3.0 | $0.15-$0.29 | $6-$12 | Good |
| Social media (premium) | Veo 3.1 Fast | $0.75-$1.50 | $15-$30 | Very Good |
| Product demonstrations | Veo 3.1 Fast | $1.20-$1.50 | $24-$30 | Very Good |
| Client testimonial bg | Sora 2 Standard | $0.50-$1.00 | $10-$20 | Good |
| Brand hero content | Sora 2 Pro 1080p | $5.00-$7.50 | $100-$150 | Excellent |
| Homepage / landing | Veo 3.1 Standard | $3.20-$4.00 | $64-$80 | Excellent |
| Internal drafts | Kling Standard (web) | $0.09-$0.18 | $3.60 | Draft |
| Rapid prototyping | Wan 2.1 self-hosted | $0.03-$0.16 | $0.60-$3.20 | Draft |
| Content with audio | Veo 3.0 (or post-prod) | $3.75-$6.00 | $75-$120 | Excellent |

### Monthly Budget Allocation Strategy

**For a $100/month total video budget, allocate:**

| Category | % of Budget | Dollar Amount | Videos Produced |
|----------|-------------|---------------|-----------------|
| Social content (volume) | 25% | $25 | ~85 clips via Kling |
| Product/client content | 30% | $30 | ~20 clips via Veo Fast |
| Hero/premium content | 20% | $20 | ~4 clips via Sora Pro |
| Draft iterations | 15% | $15 | ~100+ drafts |
| Platform subscriptions | 10% | $10 | Kling Pro (partial) |
| **Total** | **100%** | **$100** | **~209 generations, ~109 finished** |

### Seasonal Adjustment

Increase hero content budget during:
- Product launches (double hero allocation)
- Holiday campaigns (Q4: shift 10% from social to hero)
- Client pitches (allocate per-client hero budget)

Decrease during:
- Maintenance periods (shift hero budget to social volume)
- Testing phases (shift everything to drafts)

---

## 6. Agent Decision Rules

### For Venny (Creative Director Agent)

When selecting a model for a generation request, follow this priority order:

1. **Check the deliverable type** -- match to the use case table above
2. **Check remaining monthly budget** -- if below 20%, use only budget-tier models
3. **Check iteration count** -- if this is attempt 4+ on the same concept, STOP and refine the prompt before spending more
4. **Default to draft-first** -- always start with a cheap model unless the client specifically requested premium quality
5. **Never use premium models for exploration** -- if the brief says "try some ideas," use Kling Standard or Wan 2.1 only

### For Victor (Production Manager Agent)

When managing production budgets:

1. **Track cost per finished video** (include all iterations, not just the final render)
2. **Flag when iteration costs exceed the final render cost** -- this means prompt optimization is needed
3. **Route through fal.ai by default** for Kling and Veo workloads (65% and 33% savings respectively)
4. **Use direct APIs only for** Sora 2 (no third-party discount) and when reliability is critical
5. **Pre-generate social content in batches** -- queue a week of content on Monday, not one video at a time
6. **Monitor credit expiration** -- Kling subscription credits do not roll over; use them before renewal date
7. **Maintain a prompt library** -- proven prompts reduce re-generation costs by 50-75%

### Emergency Budget Rules

If monthly budget is exhausted before month-end:

1. Switch ALL generation to Wan 2.1 self-hosted ($0.03-$0.16/clip)
2. Use Kling free tier (66 credits/day) for essential social content
3. Defer all hero/premium content to next billing cycle
4. Review iteration logs to identify prompt waste

---

## 7. Provider Quick-Reference Cards

### fal.ai (Primary API Provider)
- **Best for:** Kling 3.0 (65% savings), Veo 3.1 Fast (33% savings), Vidu 2.0 (cheapest floor)
- **Pricing:** Pay-per-use, no subscription
- **Free tier:** Yes (limited)
- **Reliability:** ~99.5% uptime
- **Quality:** Identical to official APIs (same model weights)
- **Risk:** Pricing can change; maintain direct API fallback

### Kling Web App (Subscription)
- **Best for:** High-volume short social clips at rock-bottom prices
- **Recommended plan:** Pro ($25.99/mo) = 3,000 credits
- **Free tier:** 66 credits/day (use for testing)
- **Key rule:** Standard mode = 3.5x cheaper than Professional mode
- **Key rule:** Never use native audio (2.5-5x cost multiplier)

### OpenAI Sora 2 (Direct API)
- **Best for:** Cinematic quality, longer clips (up to 25s on Pro)
- **Draft tier:** Sora 2 Standard @ 720p = $0.10/sec
- **Final tier:** Sora 2 Pro @ 1080p = $0.50/sec
- **Access gate:** Requires Tier 2 ($10 cumulative spend)
- **No third-party discount** -- use OpenAI directly

### Google Veo (Vertex AI)
- **Best for:** Quality-per-dollar (Veo 3.1 Fast at $0.15/sec @ 1080p)
- **Draft tier:** Veo 3.1 Fast = $0.15/sec
- **Final tier:** Veo 3.1 Standard = $0.40/sec
- **Key rule:** 720p and 1080p are the same price -- always pick 1080p
- **Key rule:** Request quota increases early (takes days to approve)

### Wan 2.1 Self-Hosted (GPU Rental)
- **Best for:** Maximum cost savings at scale, unlimited generation
- **Budget GPU:** RTX 4090 on Vast.ai @ $0.34/hr = $0.027/clip (480p)
- **Production GPU:** A100 on Vast.ai @ $1.10/hr = $0.16/clip (720p)
- **Break-even vs API:** ~20 videos/month (below this, API is more convenient)
- **Requires:** DevOps setup, GPU management, model updates

---

## Appendix: Cost Formulas for Agent Calculations

```
# Cost per video
cost = price_per_second * duration_seconds

# Total project cost (including iterations)
total_cost = (draft_cost * num_drafts) + (refinement_cost * num_refinements) + final_cost

# Monthly budget check
remaining = monthly_budget - sum(all_generations_this_month)
can_afford = remaining >= estimated_cost_of_next_generation

# Cost efficiency score (lower is better)
efficiency = total_spent_on_deliverable / number_of_finished_videos

# Draft-to-final savings
savings_pct = 1 - (pipeline_total / (premium_cost * total_iterations))

# Break-even: self-hosted vs API
break_even_videos = (gpu_hourly_rate * hours_per_month) / api_cost_per_video
# If monthly_videos > break_even_videos, self-host is cheaper
```


---
## Media

### Platform References
- **sora2**: [Docs](https://openai.com/sora) · [Gallery](https://openai.com/index/sora/)
- **kling**: [Docs](https://klingai.com) · [Gallery](https://klingai.com/explore)
- **veo3**: [Docs](https://deepmind.google/technologies/veo/) · [Gallery](https://deepmind.google/technologies/veo/)
- **vidu**: [Docs](https://www.vidu.studio) · [Gallery](https://www.vidu.studio/explore)
- **wan**: [Docs](https://github.com/Wan-Video/Wan2.1) · [Gallery](https://wan-video.github.io)

### Related Videos
- [OpenAI Sora 2 Complete Guide - Features & How to Use](https://www.youtube.com/results?search_query=openai+sora+2+complete+guide+tutorial+2026) — *Credit: OpenAI on YouTube* `sora2`
- [Sora 2 Prompting Masterclass - Create Stunning AI Videos](https://www.youtube.com/results?search_query=sora+2+prompting+masterclass+ai+video) — *Credit: AI Video on YouTube* `sora2`
- [Kling AI Video Generator Tutorial - Complete Guide](https://www.youtube.com/results?search_query=kling+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `kling`
- [Kling 3.0 - Motion Brush & Advanced Features](https://www.youtube.com/results?search_query=kling+3.0+motion+brush+advanced+tutorial) — *Credit: AI Tutorials on YouTube* `kling`
- [Google Veo 3 - AI Video Generation Tutorial](https://www.youtube.com/results?search_query=google+veo+3+ai+video+generation+tutorial) — *Credit: Google on YouTube* `veo3`
- [Veo 3 vs Sora 2 - Which AI Video Generator is Better?](https://www.youtube.com/results?search_query=veo+3+vs+sora+2+comparison+review) — *Credit: AI Reviews on YouTube* `veo3`

> *All video content is credited to original creators. Links direct to source platforms.*
