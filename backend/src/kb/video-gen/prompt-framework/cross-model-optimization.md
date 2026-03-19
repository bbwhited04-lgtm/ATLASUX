# Cross-Model Prompt Optimization Framework
**The Capstone Guide for Venny & Victor**
**Version:** 1.0 | **Last Updated:** 2026-03-18

> **Read this first.** This document ties together the [Prompt Engineering Guide](../guides/prompt-engineering-guide.md), the [Budget Optimization Guide](../guides/budget-optimization-guide.md), and the [Model Comparison Guide](../guides/model-comparison-guide.md) into a single, systematic workflow. Every video you produce should flow through this framework. The individual guides are reference material; this is the operating manual.

---

## Table of Contents

1. [The Universal Prompt Optimization Framework](#1-the-universal-prompt-optimization-framework)
2. [The Prompt Scoring Rubric](#2-the-prompt-scoring-rubric)
3. [The Iteration Decision Tree](#3-the-iteration-decision-tree)
4. [Cross-Model Prompt Translation Matrix](#4-cross-model-prompt-translation-matrix)
5. [The Treatment Pipeline Prompt Workflow](#5-the-treatment-pipeline-prompt-workflow)
6. [Prompt Library Organization System](#6-prompt-library-organization-system)
7. [Cost-Aware Prompt Strategy](#7-cost-aware-prompt-strategy)
8. [Automation Patterns](#8-automation-patterns)

---

## 1. The Universal Prompt Optimization Framework

Every video generation task -- regardless of model, platform, or deliverable type -- follows the same five-step cycle. This is not optional. Skipping steps is how you burn budget on re-generations.

### Step 1: DEFINE -- Scope the Deliverable

Before writing a single word of prompt, answer these questions:

| Question | Why It Matters | Example Answer |
|----------|---------------|----------------|
| **Platform** | Determines aspect ratio, duration, and quality floor | TikTok (9:16, 15-60s, 1080p) |
| **Duration** | Determines cost and model selection | 5 seconds |
| **Aspect Ratio** | Must be set before generation, not after | 9:16 vertical |
| **Audience** | Determines tone, pacing, and visual style | Trade business owners, 35-55, mobile-first |
| **Deliverable Type** | Maps to budget tier (draft/social/hero) | Social feed clip |
| **Content Type** | Determines prompt structure (product, talking head, cinematic, etc.) | Product demonstration |
| **Budget Ceiling** | Total spend including all iterations | $2.00 max |

**Output of Step 1:** A filled-in scope card. This card travels with the prompt through every subsequent step.

```
SCOPE CARD
----------
Platform:       TikTok / Instagram Reels
Aspect Ratio:   9:16
Duration:       5 seconds
Quality Tier:   Social (mid)
Audience:       Trade business owners on mobile
Content Type:   Product demo -- Lucy answering a call
Budget Ceiling: $2.00 (including iterations)
```

### Step 2: DRAFT -- Write the Universal Prompt

Use the Universal Prompt Anatomy from the [Prompt Engineering Guide](../guides/prompt-engineering-guide.md). Every prompt has seven slots. Fill them all, even if some are brief.

```
UNIVERSAL PROMPT TEMPLATE
-------------------------
[SUBJECT]:     Who/what is in the frame
[CONTEXT]:     Where are they, what is the environment
[ACTION]:      What happens over the clip's duration
[STYLE]:       Visual treatment (photorealistic, cinematic, animated, etc.)
[CAMERA]:      Shot type, movement, lens
[AUDIO]:       Dialogue, music, sound effects, ambience (or "no audio")
[NEGATIVE]:    What to avoid (artifacts, styles, elements)
```

**Example -- filled in:**

```
SUBJECT:   A smartphone on a clean white desk, screen showing an incoming call
CONTEXT:   Modern home office, morning light through window, plant in background
ACTION:    Phone rings, screen lights up with "Lucy AI" caller ID, gentle pulse animation
STYLE:     Photorealistic, warm color grade, shallow depth of field
CAMERA:    Close-up, static shot, 35mm lens, f/2.8
AUDIO:     Soft phone ring tone, quiet office ambience
NEGATIVE:  No text overlays, no watermarks, no hands in frame
```

**Draft Quality Checklist:**
- [ ] Subject is specific (not "a person" but "a professional plumber in navy coveralls")
- [ ] Action describes what CHANGES over time (video, not a photo)
- [ ] Camera language uses film terminology (models are trained on film data)
- [ ] Lighting is explicit (never leave it to chance)
- [ ] Duration is realistic for the action described (do not pack 30 seconds of action into 5 seconds)
- [ ] Only ONE core action per 5-second clip (multi-action prompts confuse every model)

### Step 3: ADAPT -- Convert to Model-Specific Syntax

The universal prompt is model-agnostic. Each model has syntax preferences, token limits, and feature-specific parameters. Adaptation is where you translate intent into model-native language.

**Adaptation rules by model:**

| Model | Prompt Style | Key Adaptations |
|-------|-------------|-----------------|
| **Sora 2 / Sora 2 Pro** | Natural language paragraph, film-director tone | Specify lens type explicitly (Sora simulates lens physics). Use temporal markers ("begins with... then..."). Mention camera movement as a continuous instruction. Negative prompts not natively supported -- embed as "avoid" clauses. |
| **Veo 3 / Veo 3.1** | Structured, comma-separated descriptors | Front-load the subject and action (Veo weighs early tokens heavily). Use Google's 8-part framework: Shot Type + Subject, Action, Setting, Visual Style, Camera Movement, Lighting, Audio Cues, Technical. Supports negative prompts via "do not include" phrasing. |
| **Kling 3.0 / Omni** | Concise, keyword-dense | Kling responds best to short, punchy prompts (under 200 tokens). Camera keywords are critical ("dolly in", "tracking shot"). Use the negative prompt field (native support). For storyboard mode, write separate prompts per shot. |
| **Wan 2.1 / 2.5** | Simple, direct descriptions | Keep prompts under 100 tokens -- Wan's smaller models lose coherence with complex prompts. Focus on subject + action + style. Skip nuanced camera instructions (limited control). Use LoRA tags if fine-tuned models are loaded. |
| **Vidu 2.0** | Brief, action-focused | Cheapest API option. Keep prompts extremely simple. One subject, one action, one style. Complex prompts waste money because the model cannot execute them. |

**Adaptation example -- same concept across models:**

Universal prompt:
> Close-up of a barista pouring steamed milk into a latte, creating a rosetta pattern. Warm cafe lighting, shallow depth of field, 35mm lens, cozy morning atmosphere.

**Sora 2 Pro adaptation:**
> A cinematic close-up shot through a 35mm lens captures a barista's steady hands pouring steamed milk into a ceramic latte cup. The milk stream thins as it accelerates, microfoam separating at the surface to form a delicate rosetta pattern. Warm golden morning light spills through cafe windows, casting soft shadows across the wooden counter. Shallow depth of field renders the background espresso machine as smooth bokeh. The pour begins with the cup tilted at 45 degrees and ends with the completed rosetta as the cup levels. Handheld micro-movements add organic feel.

**Veo 3.1 adaptation:**
> Close-up shot, barista pouring steamed milk into latte cup, rosetta latte art forming on surface, warm cafe interior, morning golden hour light through windows, shallow depth of field, 35mm focal length, soft ambient cafe sounds, gentle milk pouring sound, photorealistic, cinematic color grade, do not include text overlays or watermarks

**Kling 3.0 adaptation:**
> Close-up of barista pouring milk into latte, rosetta pattern forming, warm cafe lighting, shallow depth of field, 35mm lens, steady shot, photorealistic

Negative prompt: "blurry, text, watermark, low quality, cartoon"

**Wan 2.1 adaptation:**
> Barista pours milk into latte cup, rosetta art forms, cafe, warm lighting, close-up, photorealistic

### Step 4: GENERATE -- Run on Cheapest Viable Model First

**The cardinal rule: never iterate on expensive models.**

Follow the Draft-to-Final Pipeline from the [Budget Optimization Guide](../guides/budget-optimization-guide.md):

```
GENERATION LADDER
-----------------
Attempt 1-5:   Cheapest viable model (Kling via fal.ai at $0.029/sec, or Wan 2.1 self-hosted)
               Goal: Validate composition, motion direction, pacing
               Total spend: $0.15-$0.75

Attempt 6-8:   Mid-tier model (Sora 2 Standard or Veo 3.1 Fast)
               Goal: Confirm prompt produces target result at quality
               Total spend: $0.50-$1.20

Attempt 9:     Final render on premium model (Sora 2 Pro or Veo 3.1 Standard)
               Goal: Production-ready output, one shot
               Total spend: $1.50-$5.00
```

**When to skip the ladder and go straight to premium:**
- The prompt is proven (used before with a score of 8+ on this model)
- The deliverable is a one-off hero piece with no room for iteration
- Client is watching and you need the result in the next 5 minutes

**When to stay on the cheapest model and never escalate:**
- Internal drafts and concept exploration
- Storyboard visualization (quality does not matter, composition does)
- The content will be heavily post-processed anyway (overlays, text, filters)

### Step 5: REFINE -- Score, Adjust, Escalate

After every generation, score the output using the rubric in Section 2. Then:

1. **Score >= 7 average:** Output is usable. If this is a draft stage, escalate to next tier. If this is final render, ship it.
2. **Score 5-6 average:** Prompt needs adjustment. Consult the Iteration Decision Tree (Section 3). Change ONE variable and re-generate on the SAME model.
3. **Score < 5 average:** Fundamental problem. Either the prompt is wrong or the model cannot handle this concept. Rewrite the prompt from Step 2 or escalate the model.

**The one-variable rule:** Never change more than one element between iterations. If you change the camera angle AND the lighting AND the subject description simultaneously, you cannot isolate what fixed (or broke) the output.

---

## 2. The Prompt Scoring Rubric

Rate every generated video on seven dimensions, each scored 1-10. This is not subjective -- each score level has concrete criteria.

### Dimension Definitions

#### Visual Quality (VQ) -- Sharpness, Color, Lighting
| Score | Criteria |
|-------|----------|
| 1-3 | Visible artifacts, color banding, muddy details, incorrect exposure |
| 4-5 | Acceptable but soft, minor color issues, flat lighting |
| 6-7 | Clean and sharp, good color reproduction, intentional lighting |
| 8-9 | Broadcast-ready, rich color depth, cinematic lighting |
| 10 | Indistinguishable from professional camera footage |

#### Motion Coherence (MC) -- Natural Movement, Physics
| Score | Criteria |
|-------|----------|
| 1-3 | Jittery motion, objects teleporting, limbs bending wrong, physics violations |
| 4-5 | Motion is recognizable but floaty, unnatural acceleration/deceleration |
| 6-7 | Smooth motion, minor physics quirks that most viewers would not notice |
| 8-9 | Physically grounded motion, believable weight and inertia |
| 10 | Simulation-grade physics, indistinguishable from real footage |

#### Prompt Adherence (PA) -- Did It Do What You Asked?
| Score | Criteria |
|-------|----------|
| 1-3 | Output bears little resemblance to the prompt, wrong subject or action |
| 4-5 | Core subject is correct but action, setting, or style is wrong |
| 6-7 | Subject and action match, minor deviations in style or composition |
| 8-9 | Faithful to all prompt elements, only trivial differences |
| 10 | Pixel-perfect execution of every prompt element |

#### Composition (CO) -- Framing, Balance, Visual Hierarchy
| Score | Criteria |
|-------|----------|
| 1-3 | Subject cut off, poor framing, no visual hierarchy |
| 4-5 | Subject is visible but awkwardly placed, unbalanced frame |
| 6-7 | Good framing, subject properly placed, functional composition |
| 8-9 | Rule-of-thirds or intentional composition, strong visual hierarchy |
| 10 | Magazine-cover framing, every element deliberately placed |

#### Temporal Flow (TF) -- Does the Action Unfold Naturally?
| Score | Criteria |
|-------|----------|
| 1-3 | Action is static (nothing happens), or chaotic (everything happens at once) |
| 4-5 | Action occurs but pacing is off -- too fast, too slow, or no arc |
| 6-7 | Clear beginning-middle-end within the clip, reasonable pacing |
| 8-9 | Action unfolds with natural rhythm, builds and resolves within the duration |
| 10 | Perfect pacing, dramatic timing, every frame earns its place |

#### Audio Quality (AQ) -- Sync, Clarity, Relevance
| Score | Criteria |
|-------|----------|
| N/A | No audio generated (score this dimension only when audio was requested) |
| 1-3 | Audio is out of sync, garbled, or completely wrong for the scene |
| 4-5 | Audio matches the scene loosely, noticeable sync drift, tinny quality |
| 6-7 | Audio matches the scene, minor sync issues, acceptable quality |
| 8-9 | Clean audio, tight sync, appropriate ambient sounds, natural dialogue |
| 10 | Broadcast-quality audio, perfect lip-sync, immersive soundscape |

#### Platform Fit (PF) -- Right Format for the Destination
| Score | Criteria |
|-------|----------|
| 1-3 | Wrong aspect ratio, wrong duration, wrong resolution for the platform |
| 4-5 | Correct format but content does not suit the platform (e.g., slow cinematic for TikTok) |
| 6-7 | Correct format, content is appropriate, could perform on the platform |
| 8-9 | Optimized for the platform -- hook in first 2 seconds, right pacing, right energy |
| 10 | Platform-native feel, would blend seamlessly into a user's feed |

### Scoring Sheet Template

Copy this for every generation. Fill in scores, calculate the average, and log the decision.

```
GENERATION SCORECARD
====================
Prompt ID:      _______________
Model:          _______________
Attempt #:      _______________
Cost:           $______________
Date:           _______________

SCORES (1-10):
  Visual Quality (VQ):      ___
  Motion Coherence (MC):    ___
  Prompt Adherence (PA):    ___
  Composition (CO):         ___
  Temporal Flow (TF):       ___
  Audio Quality (AQ):       ___ (or N/A)
  Platform Fit (PF):        ___

AVERAGE SCORE:              ___  (sum / number of scored dimensions)

DECISION:
  [ ] SHIP -- Score >= 7, output is production-ready
  [ ] ESCALATE -- Score >= 7 on draft model, move to next tier
  [ ] ADJUST -- Score 5-6, change one variable and re-generate
  [ ] REWRITE -- Score < 5, fundamental prompt or model problem
  [ ] ABORT -- Concept is not achievable with current models

ADJUSTMENT NOTES:
  What to change: _______________________________________________
  Why: __________________________________________________________

CUMULATIVE SPEND ON THIS DELIVERABLE: $______________
```

### Weighted Scoring for Different Deliverable Types

Not all dimensions matter equally for every deliverable. Use these weights:

| Dimension | Social Clip | Product Demo | Hero/Cinematic | Treatment/Short |
|-----------|------------|--------------|----------------|-----------------|
| Visual Quality | 1.0x | 1.5x | 2.0x | 1.5x |
| Motion Coherence | 1.0x | 1.0x | 2.0x | 1.5x |
| Prompt Adherence | 1.5x | 2.0x | 1.0x | 1.5x |
| Composition | 1.0x | 1.5x | 2.0x | 1.0x |
| Temporal Flow | 1.5x | 1.0x | 1.5x | 2.0x |
| Audio Quality | 0.5x | 1.0x | 1.5x | 1.0x |
| Platform Fit | 2.0x | 1.0x | 0.5x | 1.5x |

**How to use weights:** Multiply each score by its weight, sum the results, divide by the sum of weights. This gives a weighted average that reflects what actually matters for the deliverable type.

**Example -- Social clip:**
```
VQ=7 (x1.0=7.0) + MC=6 (x1.0=6.0) + PA=8 (x1.5=12.0) + CO=7 (x1.0=7.0)
+ TF=7 (x1.5=10.5) + AQ=N/A + PF=9 (x2.0=18.0)

Weighted sum: 60.5
Weight total: 8.5
Weighted average: 60.5 / 8.5 = 7.1 --> SHIP or ESCALATE
```

---

## 3. The Iteration Decision Tree

When output scores low on a specific dimension, this tree tells you what to change FIRST. Do not guess. Follow the tree.

```
START: Which dimension scored lowest?
|
+-- Visual Quality < 4
|     First try: Upgrade model (Wan -> Kling, Kling -> Veo/Sora)
|     If already on premium: Add explicit lighting descriptors
|     If still failing: Simplify the scene (fewer elements = better rendering)
|     Last resort: Use I2V (generate a perfect still frame, then animate)
|
+-- Motion Coherence < 4
|     First try: Add physics descriptors ("with weight", "gravitational pull",
|                "momentum", "inertia", "natural deceleration")
|     Second try: Add camera stabilization terms ("steady", "locked tripod",
|                "gimbal-stabilized", "smooth dolly")
|     Third try: Reduce motion complexity (one action, not three)
|     Last resort: Generate a static shot and add motion in post (After Effects)
|
+-- Prompt Adherence < 4
|     First try: SIMPLIFY the prompt -- remove style/camera/mood, keep only
|                subject + action. If the model cannot nail the core concept
|                with a simple prompt, it cannot handle the concept at all.
|     Second try: Break compound actions into separate clips
|                ("walks to table AND picks up glass" -> two generations)
|     Third try: Use I2V -- generate the starting frame as an image first,
|                then animate from that anchor
|     Last resort: Switch models (each model has different concept strengths)
|
+-- Composition < 4
|     First try: Specify shot type explicitly ("medium close-up", "wide
|                establishing shot", "extreme close-up", "over-the-shoulder")
|     Second try: Add spatial markers ("subject centered", "subject in left
|                third", "looking screen-right", "headroom above")
|     Third try: Specify lens/focal length ("85mm portrait lens", "24mm wide
|                angle", "50mm standard")
|     Last resort: Generate wider than needed and crop in post
|
+-- Temporal Flow < 4
|     First try: Add temporal markers to the prompt:
|                "The clip begins with [X]. At the midpoint, [Y]. It ends with [Z]."
|     Second try: Reduce duration (5s clips have better temporal coherence
|                than 10s clips on every model)
|     Third try: Specify pacing ("slow deliberate movements", "quick energetic
|                cuts", "gradual reveal")
|     Last resort: Generate 2-3 shorter clips and edit them into a sequence
|
+-- Audio Quality < 4
|     First try: Remove audio from the generation entirely -- generate
|                silent video and add audio in post-production
|     Second try: If native audio is required, use Veo 3.0/3.1 (best audio)
|                or Kling 3.0 Omni (best multilingual)
|     Third try: Simplify the audio request ("ambient cafe sounds" not
|                "jazz playing, espresso machine hissing, conversation murmur")
|     RECOMMENDATION: Almost always separate audio generation in post.
|                Use ElevenLabs for voice ($0.30/1K chars), royalty-free
|                libraries for music, Foley libraries for SFX. Cheaper
|                and higher quality than native audio generation.
|
+-- Platform Fit < 4
      First try: Regenerate with correct aspect ratio (this is the #1 issue)
      Second try: Adjust pacing for the platform:
                  TikTok/Reels: Hook in first 1-2 seconds, fast cuts
                  YouTube: Can breathe more, establish context
                  LinkedIn: Professional tone, slower pace
      Third try: Shorten duration -- social clips over 7 seconds
                 lose engagement rapidly
      Last resort: Re-edit in post (crop, speed ramp, add hook text)
```

### The Escalation Ladder

When a prompt consistently scores below threshold on the current model after 3 attempts with adjustments:

```
ESCALATION PATH (by model capability tier):

Wan 2.1 (1.3B)     -- Floor: $0.005/sec
    |  Score stuck < 5 after 3 tries
    v
Kling 3.0 (fal.ai) -- Budget: $0.029/sec
    |  Score stuck < 6 after 3 tries
    v
Veo 3.1 Fast       -- Mid: $0.15/sec
    |  Score stuck < 7 after 2 tries
    v
Sora 2 Pro (1080p) -- Premium: $0.50/sec
    |  Score stuck < 8 after 2 tries
    v
CONCEPT REVIEW: The prompt may be asking for something
no current model can deliver. Simplify or change approach.
```

### Iteration Budget Caps

Hard limits to prevent runaway spending on a single deliverable:

| Deliverable Type | Max Iterations | Max Total Spend | Action When Hit |
|------------------|---------------|-----------------|-----------------|
| Internal draft | 10 | $1.00 | Stop and accept best output |
| Social clip | 8 | $3.00 | Stop, use best output, fix in post |
| Product demo | 6 | $5.00 | Review prompt with team before continuing |
| Hero content | 10 | $15.00 | Pause, re-scope deliverable, get approval |
| Cinematic piece | 12 | $25.00 | Escalate to human review of creative brief |

---

## 4. Cross-Model Prompt Translation Matrix

Five video concepts, each translated for all five model families. Study the differences to internalize what each model responds to.

### Concept 1: Product Shot -- Smartphone on Desk

**Intent:** Clean, professional product shot of a smartphone receiving a call. For social media.

| Model | Optimized Prompt | Key Differences |
|-------|-----------------|-----------------|
| **Sora 2 Pro** | "A cinematic close-up through a 50mm lens: a modern smartphone lies on a clean white marble desk. The screen illuminates as an incoming call arrives, casting a soft blue glow upward. Shallow depth of field softens a minimalist desk plant in the background. Steady locked-off shot, no camera movement. Morning light from screen-left creates gentle shadows. The phone vibrates with subtle physical movement against the marble surface." | Lens-specific language triggers Sora's physics simulation. "Vibrates with subtle physical movement" uses Sora's strength in micro-physics. |
| **Veo 3.1** | "Close-up shot, smartphone on white marble desk, screen lighting up with incoming call notification, soft blue glow illuminating desk surface, minimalist desk plant in soft focus background, 50mm focal length, shallow depth of field, morning side light, gentle phone vibration sound, soft notification chime, photorealistic, clean modern aesthetic, do not include hands or text overlays" | Front-loaded subject/action. Audio cues included (Veo handles native audio well). "Do not include" negative phrasing. Comma-separated structure. |
| **Kling 3.0** | "Close-up of smartphone on white desk, screen lights up with incoming call, blue glow, shallow depth of field, 50mm lens, morning light, photorealistic, clean modern" | Negative prompt (separate field): "blurry, cartoon, text overlay, hands, watermark, low quality" | Short and punchy. Kling thrives on keyword density, not prose. Negative prompt uses native field. |
| **Wan 2.1** | "Smartphone on white desk, screen lights up, incoming call, close-up, blue glow, morning light, photorealistic" | Stripped to essentials. Wan cannot reliably execute complex prompts. Focus on the one thing that matters: the screen lighting up. |
| **Vidu 2.0** | "Close-up of phone on desk, screen turns on with blue light, clean background, professional look" | Absolute minimum. Vidu is the cheapest draft option -- use it to test if the concept reads at all before investing in prompt refinement. |

**Expected quality scores per model:**

| Dimension | Sora 2 Pro | Veo 3.1 | Kling 3.0 | Wan 2.1 | Vidu 2.0 |
|-----------|-----------|---------|-----------|---------|----------|
| Visual Quality | 9 | 9 | 8 | 5 | 4 |
| Motion Coherence | 9 | 8 | 7 | 5 | 4 |
| Prompt Adherence | 8 | 8 | 8 | 6 | 5 |
| Composition | 9 | 8 | 7 | 5 | 4 |
| Temporal Flow | 8 | 7 | 7 | 5 | 4 |
| **Average** | **8.6** | **8.0** | **7.4** | **5.2** | **4.2** |

---

### Concept 2: Talking Head -- Real Estate Agent

**Intent:** Agent walks through kitchen, turns to camera, delivers one line. For property listing video.

| Model | Optimized Prompt | Key Differences |
|-------|-----------------|-----------------|
| **Sora 2 Pro** | "Handheld camera follows a real estate agent in a tailored navy blazer as she walks through a modern open-concept kitchen with white quartz countertops and stainless steel appliances. Natural light streams through floor-to-ceiling windows. The agent turns toward camera with a confident smile and says 'This layout is perfect for entertaining.' Subtle handheld camera micro-movements. 35mm lens, natural skin tones, eye-level angle. The clip begins with a medium shot from behind, transitions as she turns, and ends on a medium close-up facing camera." | Full temporal choreography. "Clip begins with... transitions... ends on" gives Sora clear temporal structure. Handheld micro-movements leverage physics simulation. |
| **Veo 3.1** | "Medium shot tracking a real estate agent in navy blazer walking through modern white kitchen, natural window light, agent turns to camera and says 'This layout is perfect for entertaining', confident professional tone, natural dialogue delivery, 35mm lens, handheld camera movement, warm natural color grade, ambient kitchen echo, footstep sounds, photorealistic, do not include captions or subtitles" | Dialogue quoted directly in prompt. Audio cues for ambient sound. Veo's joint diffusion produces the tightest lip-sync. Use Ingredients to Video with a reference photo of the agent for face consistency. |
| **Kling 3.0 Omni** | Storyboard mode -- 3 shots: Shot 1: "Wide shot of modern kitchen interior, floor-to-ceiling windows, natural light, photorealistic" / Shot 2: "Medium shot of woman in navy blazer walking through kitchen, tracking camera, natural light" / Shot 3: "Medium close-up of woman facing camera, speaking, confident expression, professional, warm lighting" | Storyboard mode is Kling's killer feature here. 3 shots maintain character consistency across angles. Dialogue: "This layout is perfect for entertaining." Kling's multi-shot = no stitching needed. |
| **Wan 2.5** | "Real estate agent in blazer walks through modern kitchen, turns to camera and speaks, natural lighting, handheld camera, photorealistic" | Functional but the face will show minor inconsistencies during the turn. Lip-sync may drift. Use this for rough cut approval only. |

**Expected quality scores:**

| Dimension | Sora 2 Pro | Veo 3.1 | Kling 3.0 Omni | Wan 2.5 |
|-----------|-----------|---------|----------------|---------|
| Visual Quality | 9 | 9 | 9 | 6 |
| Motion Coherence | 9 | 8 | 8 | 5 |
| Prompt Adherence | 8 | 8 | 9 | 5 |
| Audio Quality | 8 | 9 | 8 | 6 |
| **Average** | **8.5** | **8.5** | **8.5** | **5.5** |

---

### Concept 3: Nature Cinematic -- Mountain Lake Sunrise

**Intent:** Hero content for homepage or brand video. Maximum quality.

| Model | Optimized Prompt | Key Differences |
|-------|-----------------|-----------------|
| **Sora 2 Pro** | "Drone shot ascending from lake level over a mountain lake at sunrise. Volumetric morning mist rolls slowly across the mirror-still water surface. A flock of twenty birds erupts from the shoreline, individual wings catching the first golden light. The camera rises steadily, revealing the full lake surrounded by pine-covered mountains. Light transitions from warm amber at the horizon to cool blue overhead. The mist has physical depth and layers, curling around rocks at the shoreline. 24mm wide-angle lens, smooth continuous ascent, cinematic color grade." | Physics-heavy language: "volumetric mist", "mirror-still water", "individual wings catching light". Sora excels here because the entire prompt is about physical phenomena. Drone physics will feel grounded. |
| **Veo 3.1** | "Ascending drone shot, mountain lake at sunrise, volumetric mist rolling across water surface, flock of birds taking flight from shoreline, golden sunrise light raking across mountain landscape, pine forest surrounding lake, cool to warm color temperature gradient, 24mm wide angle, smooth steady ascent, gentle water lapping sounds, bird wing flutter, building morning wind, cinematic 4K, National Geographic quality, do not include people or structures" | 4K native output shows individual pine needles. Audio track includes spatial ambient sound. "National Geographic quality" is an effective style anchor for Veo. |
| **Kling 3.0** | "Drone ascending over mountain lake at sunrise, mist on water, birds flying from shore, golden light, pine mountains, wide angle, smooth camera rise, cinematic, 4K 60fps" | Negative: "text, watermark, buildings, people, shaky camera" | 4K at 60fps makes the drone movement hyper-smooth. Less cinematic "weight" than Sora but incredibly sharp and clean. |
| **Wan 2.1 14B** | "Drone shot rising over mountain lake, sunrise, mist on water, birds flying, mountains with trees, golden light, cinematic" | Recognizable but significantly softer. Mist will be flat rather than volumetric. Birds will move as a group rather than individuals. Use only for storyboard validation. |

**Expected quality scores:**

| Dimension | Sora 2 Pro | Veo 3.1 | Kling 3.0 | Wan 2.1 14B |
|-----------|-----------|---------|-----------|-------------|
| Visual Quality | 9 | 10 | 9 | 5 |
| Motion Coherence | 10 | 8 | 8 | 5 |
| Composition | 9 | 9 | 8 | 5 |
| Temporal Flow | 9 | 8 | 7 | 5 |
| **Average** | **9.3** | **8.8** | **8.0** | **5.0** |

---

### Concept 4: E-Commerce Product -- Before/After Cleaning

**Intent:** Split-screen or transition showing a dirty surface becoming clean. For TikTok/Reels ad.

| Model | Optimized Prompt | Key Differences |
|-------|-----------------|-----------------|
| **Sora 2 Pro** | "Close-up of a grimy kitchen tile floor. A cleaning mop enters frame from the right and sweeps across the surface in a single smooth motion. Where the mop passes, the tile transforms from stained and dull to gleaming white, with a visible wet shine reflecting overhead lighting. The transformation line is crisp and satisfying. Static locked-off top-down camera, bright overhead fluorescent lighting, 9:16 vertical format." | "Transformation line is crisp and satisfying" -- Sora handles transition boundaries well. Top-down locked camera maximizes the before/after contrast. |
| **Veo 3.1** | Use **Frames to Video** feature: upload a "before" still (dirty tile) as frame 1 and an "after" still (clean tile) as final frame. Prompt: "Mop sweeping across dirty kitchen tile, transforming surface from grimy to gleaming clean, top-down camera, bright lighting, satisfying cleaning transition, swishing mop sound, 9:16 vertical" | Frames to Video gives exact start/end control -- guarantees the before/after states are correct. This is Veo's unique advantage for transition content. |
| **Kling 3.0** | "Top-down shot of mop cleaning dirty tile floor, dirty to clean transformation, bright lighting, satisfying reveal, vertical 9:16, photorealistic" | Negative: "hands, person, text, cartoon, blurry" | Short prompt works because the concept is visually simple. Kling's text rendering ensures any visible brand names on the mop stay legible. |
| **Wan 2.1** | "Mop cleaning dirty floor, top view, before and after, bright light" | The transformation boundary will be less crisp. Acceptable for testing whether the concept works visually before spending on premium models. |

**Expected quality scores:**

| Dimension | Sora 2 Pro | Veo 3.1 | Kling 3.0 | Wan 2.1 |
|-----------|-----------|---------|-----------|---------|
| Visual Quality | 9 | 9 | 8 | 5 |
| Prompt Adherence | 8 | 9 | 7 | 5 |
| Platform Fit | 8 | 8 | 9 | 5 |
| **Average** | **8.3** | **8.7** | **8.0** | **5.0** |

---

### Concept 5: Branded Text Animation -- Logo Reveal

**Intent:** Company logo materializes from particles/light. For intro bumper.

| Model | Optimized Prompt | Key Differences |
|-------|-----------------|-----------------|
| **Kling 3.0** (BEST CHOICE) | "Golden light particles converge and solidify into the text 'ATLAS UX' centered on a deep navy background. The particles swirl inward from all edges, forming each letter sequentially left to right. Subtle lens flare as the logo completes. Cinematic, premium feel, shallow depth of field on particles." | Kling is the ONLY correct choice for text rendering. Every other model will garble the text. This is not a prompt problem -- it is a model capability ceiling. |
| **Sora 2 Pro** | Not recommended. Sora's text rendering scores 6-7/10 and will likely produce misspelled or malformed text. If forced: "Particles forming text on dark background, golden light, cinematic" and plan to fix text in post-production. | Text rendering is Sora's documented weakness. Use Kling for the generation, then color-grade to match Sora's cinematic feel in post. |
| **Veo 3.1** | Marginal. Text rendering scores 7-7.5/10. May work for short text (3-5 characters) but will struggle with "ATLAS UX". Use Kling. | Same issue as Sora. The joint diffusion process optimizes for visual quality, not text fidelity. |

**Key insight:** The prompt translation matrix is not just about syntax -- it is about knowing which concepts each model CAN and CANNOT execute. No amount of prompt engineering will make Sora render text reliably. Choose the right model for the concept, then optimize the prompt.

---

## 5. The Treatment Pipeline Prompt Workflow

This section covers the specific workflow for creating YouTube Shorts treatments from existing YouTube long-form content. A "treatment" is a short-form derivative that remixes, enhances, or recontextualizes the original content.

### The 7-Step Treatment Pipeline

```
STEP 1: EXTRACT
    |
STEP 2: ANALYZE
    |
STEP 3: WRITE TREATMENT PROMPT
    |
STEP 4: SELECT MODEL
    |
STEP 5: GENERATE
    |
STEP 6: SCORE & ITERATE
    |
STEP 7: POST-PRODUCTION
```

### Step 1: Extract the Clip

**Tools:** yt-dlp + FFmpeg + PySceneDetect (or Opus Clip for automated extraction)

```bash
# Download source video
yt-dlp -f "bestvideo[height<=1080]+bestaudio" -o source.mp4 "YOUTUBE_URL"

# Scene detection -- find natural cut points
scenedetect -i source.mp4 detect-adaptive list-scenes save-images

# Extract specific clip (timestamp-based)
ffmpeg -i source.mp4 -ss 00:02:15 -t 00:00:08 -c copy clip.mp4
```

**Clip selection criteria for treatment:**
- Contains a single complete thought or action (not mid-sentence)
- Has visual variety (not a static talking head for 8 seconds)
- Contains a "hook moment" in the first 2 seconds (surprising stat, question, visual)
- Duration: 5-15 seconds for the source clip (will be expanded/remixed in treatment)

### Step 2: Analyze the Clip Content

Run two parallel analyses on the extracted clip:

**Audio analysis (Whisper):**
```bash
whisper clip.mp4 --model medium --output_format json --language en
```

This gives you:
- Verbatim transcript with timestamps
- Speaker tone and cadence
- Key phrases and hook words

**Visual analysis (describe what happens on screen):**
Write or use an LLM to produce a shot-by-shot description:

```
CLIP ANALYSIS CARD
==================
Source:          [YouTube URL]
Clip Range:     02:15 - 02:23 (8 seconds)
Transcript:     "Most plumbers lose $47,000 a year in missed calls.
                 That's nearly a thousand dollars a week just... gone."

Visual Content: Medium shot of host at desk, gestures with hands,
                laptop visible, office background, warm lighting

Hook Element:   "$47,000" -- specific dollar figure creates curiosity

Emotional Arc:  Revelation -> Impact -> Concern

Treatment Opportunities:
  - Stat visualization (animate the $47K number growing)
  - Split screen (missed call on left, money disappearing on right)
  - B-roll replacement (replace static desk shot with dynamic visuals)
  - Text overlay treatment (key phrases as animated text)
```

### Step 3: Write the Treatment Prompt

Based on the analysis, write a prompt for the AI-generated visual treatment. The treatment should ENHANCE the original content, not replace it.

**Treatment types and their prompt patterns:**

| Treatment Type | When to Use | Prompt Pattern |
|----------------|------------|----------------|
| **B-roll replacement** | Source is talking head, needs visual variety | Describe the scene the speaker is referencing |
| **Stat visualization** | Source mentions a number or data point | Animate the number/data in a visually compelling way |
| **Mood overlay** | Source has emotional content, needs atmosphere | Generate atmospheric footage to composite over/under |
| **Scene recreation** | Source describes a scenario | Recreate the scenario as cinematic footage |
| **Split-screen element** | Source presents a contrast or comparison | Generate one side of the comparison |

**Example treatment prompt (for the plumber missed calls clip):**

```
TREATMENT PROMPT
================
Treatment Type: B-roll replacement + stat visualization
Target Format:  9:16 vertical, 5 seconds
Model Target:   Kling 3.0 (social clip, budget tier)

Prompt: "Close-up of a smartphone on a workbench, screen showing
missed call notification. The notification counter rapidly increases
from 1 to 47. Workshop background with plumbing tools, warm overhead
light, shallow depth of field, 9:16 vertical, photorealistic"

Negative: "blurry, cartoon, text errors, landscape orientation"

Audio Plan: Keep original voiceover from source clip, add subtle
phone buzz SFX in post
```

### Step 4: Select Model Based on Treatment Type and Budget

| Treatment Type | Recommended Model | Why | Cost Estimate |
|----------------|-------------------|-----|---------------|
| B-roll (simple scene) | Kling 3.0 via fal.ai | Cheap, fast, good enough for background footage | $0.15-$0.30 |
| B-roll (cinematic) | Veo 3.1 Fast | Higher quality for hero treatments | $0.75-$1.50 |
| Stat visualization | Kling 3.0 | Text rendering needed for numbers | $0.15-$0.30 |
| Mood overlay | Wan 2.1 | Abstract visuals, quality less critical | $0.03-$0.08 |
| Scene recreation | Sora 2 Pro | Physics and realism matter | $2.50-$5.00 |
| Split-screen element | Kling 3.0 | Budget-friendly, text-capable | $0.15-$0.30 |

### Step 5: Generate with Start-End Frames (When Available)

**For Veo 3.1 (Frames to Video):**
- Generate or screenshot the "before" state as a still image
- Generate or screenshot the "after" state as a still image
- Upload both as first/last frame
- Write a transition prompt describing how the scene evolves

**For Kling 3.0 (Storyboard mode):**
- Define each shot in the storyboard separately
- Use the source clip's key frames as I2V references
- Maintain character/setting consistency across shots

**For Sora 2 Pro (Standard generation):**
- Use temporal markers in the prompt
- Consider using the storyboard editor for multi-beat treatments

### Step 6: Score the Output

Use the Scoring Rubric from Section 2 with Treatment-specific weights:

| Dimension | Weight for Treatments |
|-----------|----------------------|
| Visual Quality | 1.0x |
| Motion Coherence | 1.5x |
| Prompt Adherence | 1.5x |
| Composition | 1.0x |
| Temporal Flow | 2.0x (critical -- must sync with voiceover) |
| Audio Quality | N/A (audio added in post) |
| Platform Fit | 2.0x (treatments are always platform-specific) |

**Treatment-specific scoring criteria:**
- Does the visual match the voiceover content? (If the speaker says "missed calls" and the video shows a ringing phone, that is a match)
- Does the treatment enhance comprehension? (Viewer should understand the point faster with the treatment than without)
- Is the pacing compatible with the original audio? (Visual beats should land on vocal emphasis points)

### Step 7: Post-Production Assembly

```
ASSEMBLY CHECKLIST
==================
[ ] Original audio track extracted and cleaned (noise reduction)
[ ] AI-generated treatment clip trimmed to exact duration
[ ] Treatment composited with original (overlay, side-by-side, or replacement)
[ ] Captions added (auto-generated via Whisper, styled for platform)
[ ] Hook text added in first 2 seconds (if applicable)
[ ] End card / CTA added (last 2 seconds)
[ ] Aspect ratio confirmed (9:16 for Shorts/Reels/TikTok)
[ ] Audio levels balanced (-14 LUFS for social, -16 LUFS for YouTube)
[ ] Final export at platform-optimal settings:
    - TikTok: 1080x1920, H.264, 30fps, < 287MB
    - Reels: 1080x1920, H.264, 30fps, < 4GB
    - Shorts: 1080x1920, H.264, 30fps, < 256MB
```

---

## 6. Prompt Library Organization System

A well-organized prompt library is the difference between spending 20 minutes writing a prompt from scratch and spending 20 seconds adapting a proven one. Over time, this library becomes your most valuable production asset.

### 6.1 Naming Convention

Every saved prompt follows this naming pattern:

```
[MODEL]-[CONTENT_TYPE]-[SHOT_TYPE]-[VERSION]-[SCORE]

Examples:
  kling3-product-closeup-v3-8.2
  sora2pro-cinematic-drone-v1-9.1
  veo31-talkinghead-medium-v5-8.7
  wan21-broll-wide-v2-5.4
  kling3-treatment-splitscreen-v1-7.8
```

**Component definitions:**

| Component | Values | Purpose |
|-----------|--------|---------|
| MODEL | `kling3`, `sora2`, `sora2pro`, `veo3`, `veo31`, `wan21`, `wan25`, `vidu2` | Which model this prompt is optimized for |
| CONTENT_TYPE | `product`, `cinematic`, `talkinghead`, `broll`, `treatment`, `social`, `demo`, `logo`, `nature` | What kind of content |
| SHOT_TYPE | `closeup`, `medium`, `wide`, `drone`, `pov`, `tracking`, `static`, `splitscreen` | Camera framing |
| VERSION | `v1`, `v2`, `v3`... | Iteration count |
| SCORE | `7.5`, `8.2`, `9.1`... | Best achieved weighted score |

### 6.2 Tagging System

Every prompt in the library gets tagged across five axes:

```
PROMPT TAGS
===========
Model:         [kling3 | sora2pro | veo31 | wan21 | vidu2 | universal]
Content Type:  [product | service | testimonial | brand | social | treatment]
Quality Score: [draft (<6) | good (6-7.9) | excellent (8-9) | perfect (9+)]
Cost Tier:     [floor (<$0.05) | budget ($0.05-$0.30) | mid ($0.30-$2) | premium ($2+)]
Platform:      [tiktok | reels | shorts | youtube | linkedin | website | universal]
Industry:      [plumbing | hvac | salon | realestate | general]
```

**Tag-based retrieval examples:**
- "I need a social clip for a plumber, budget under $0.50" -> Filter: `content:social + cost:budget + industry:plumbing`
- "Hero content for the homepage, maximum quality" -> Filter: `quality:excellent + platform:website + cost:premium`
- "Quick draft to test a concept" -> Filter: `quality:draft + cost:floor`

### 6.3 Template Inheritance

Base templates provide the foundation. Customized versions inherit from a base and override specific fields.

```
BASE TEMPLATE: product-closeup-base
====================================
SUBJECT:   [PRODUCT] on [SURFACE]
CONTEXT:   [ENVIRONMENT], [TIME_OF_DAY] light
ACTION:    [PRODUCT_ACTION]
STYLE:     Photorealistic, shallow depth of field
CAMERA:    Close-up, [LENS]mm lens, static shot
AUDIO:     No audio (add in post)
NEGATIVE:  No text overlays, no watermarks, no hands

CUSTOMIZED: product-closeup-phone-incoming-call
================================================
Inherits:  product-closeup-base
SUBJECT:   Smartphone on clean white marble desk
CONTEXT:   Modern home office, morning light through window
ACTION:    Screen illuminates with incoming call notification, gentle glow
STYLE:     (inherited)
CAMERA:    Close-up, 50mm lens, static shot
AUDIO:     (inherited)
NEGATIVE:  (inherited) + no visible app names

CUSTOMIZED: product-closeup-plumbing-tool
==========================================
Inherits:  product-closeup-base
SUBJECT:   Professional pipe wrench on stainless steel workbench
CONTEXT:   Clean workshop, overhead fluorescent lighting
ACTION:    Camera slowly racks focus from wrench to organized tool wall behind
STYLE:     (inherited)
CAMERA:    Close-up, 85mm lens, static shot with focus pull
AUDIO:     (inherited)
NEGATIVE:  (inherited) + no rust, no mess
```

### 6.4 Version Control for Prompt Iterations

Track every iteration of a prompt to understand what changes improved or degraded output.

```
PROMPT VERSION HISTORY
======================
Prompt ID: kling3-product-closeup-phone

v1 (2026-03-18) Score: 5.8
  "Phone on desk, screen turns on, blue light, office background"
  Issue: Composition was random, phone placement inconsistent

v2 (2026-03-18) Score: 6.9
  Added: "centered in frame, white marble desk, morning window light"
  Fixed: Composition is now consistent, lighting improved

v3 (2026-03-18) Score: 8.2
  Added: "50mm lens, shallow depth of field, desk plant in soft background"
  Fixed: Professional look achieved, depth adds dimension

v4 (2026-03-19) Score: 7.4 (REGRESSION)
  Changed: Added "gentle camera push-in over 5 seconds"
  Issue: Camera movement introduced slight jitter on Kling
  Decision: Reverted to v3 (static shot). Camera movement on this
            concept needs Sora 2 Pro.

CURRENT BEST: v3 @ score 8.2
```

### 6.5 Performance Tracking

Maintain a spreadsheet or database tracking prompt performance over time:

```
PROMPT PERFORMANCE LOG
======================
| Prompt ID | Model | Uses | Avg Score | Best Score | Avg Cost | Success Rate* |
|-----------|-------|------|-----------|------------|----------|---------------|
| kling3-product-closeup-phone-v3 | Kling 3.0 | 12 | 7.9 | 8.2 | $0.15 | 83% |
| sora2pro-cinematic-drone-v1 | Sora 2 Pro | 4 | 9.0 | 9.3 | $2.50 | 100% |
| veo31-talkinghead-medium-v5 | Veo 3.1 | 8 | 8.4 | 8.7 | $0.75 | 88% |
| wan21-broll-wide-v2 | Wan 2.1 | 20 | 5.1 | 5.8 | $0.03 | 60% |

*Success Rate = % of generations scoring >= 7.0 (usable without re-generation)
```

**Insights to extract from performance data:**
- Prompts with success rate below 70% need rewriting
- Prompts with high average but low best score are inconsistent (model issue, not prompt issue)
- Prompts with cost above 2x the model's per-generation rate are iteration-heavy (prompt needs simplification)
- If a prompt works on one model but fails on another, it is model-specific -- do not force it to be universal

---

## 7. Cost-Aware Prompt Strategy

### 7.1 The "Prompt Tax" Concept

Complex prompts cost more -- not because the API charges differently, but because complex prompts require more expensive models to execute correctly and more iterations to get right.

```
THE PROMPT TAX EQUATION

Effective cost = (generation cost) x (iterations needed) x (model required)

Simple prompt on cheap model:   $0.15 x 2 iterations x 1 model  = $0.30
Complex prompt on cheap model:  $0.15 x 8 iterations x 1 model  = $1.20 (fails)
Complex prompt on mid model:    $0.75 x 4 iterations x 1 model  = $3.00
Complex prompt on premium:      $2.50 x 2 iterations x 1 model  = $5.00

The "prompt tax" is the hidden cost of complexity.
```

**The takeaway:** A simple prompt that a cheap model can execute in 2 tries beats a complex prompt that requires a premium model and 4 tries. Always ask: "Can I simplify this prompt and still get the result I need?"

### 7.2 Simple Prompts That Produce Great Results on Cheap Models

These prompt patterns consistently score 7+ on Kling 3.0 via fal.ai ($0.029/sec):

| Pattern | Example | Why It Works |
|---------|---------|--------------|
| **Single subject, single action** | "Barista pours latte art, cafe, warm light, close-up" | One thing happening, no ambiguity |
| **Static beauty shot** | "Modern bathroom vanity, morning light, 4K, photorealistic" | No motion to mess up, pure visual quality |
| **Slow camera movement** | "Slow dolly across kitchen counter with fresh ingredients, warm lighting" | Gentle motion is easy for all models |
| **Nature/atmosphere** | "Rain falling on window, city lights blurred behind, night, close-up" | Atmospheric scenes are forgiving -- imperfections add to the mood |
| **Product on surface** | "Red sneaker on concrete, studio lighting, clean background, eye level" | Simple composition, clear subject |

### 7.3 When Prompt Complexity Is the Bottleneck vs Model Capability

**It is a prompt problem when:**
- The model CAN do what you are asking (proven by other prompts) but your specific prompt does not work
- Simplifying the prompt produces better results on the same model
- The output has the right quality but the wrong content
- Different runs of the same prompt produce wildly different results

**It is a model capability problem when:**
- The simplified prompt still fails
- The output has the right content but wrong quality
- Other models handle the same prompt better
- The concept requires features the model does not support (e.g., text rendering on Sora)

**How to tell the difference:**
1. Simplify the prompt to its absolute minimum (subject + action only)
2. Generate on the current model
3. If the simplified version works: it is a prompt problem. Build complexity back gradually.
4. If the simplified version fails: it is a model problem. Escalate to the next tier.

### 7.4 The 80/20 Rule

**80% of your content works fine on Kling 3.0 via fal.ai ($0.029/sec).** This includes:
- Social feed clips (TikTok, Reels, Shorts)
- Product shots and demos
- B-roll footage
- Treatment overlays
- Concept drafts and storyboard frames
- Internal content

**20% of your content needs premium models ($0.15-$0.50/sec).** This includes:
- Homepage hero videos
- Client-facing brand content
- Cinematic pieces with complex physics (water, fabric, crowds)
- Talking head videos requiring tight lip-sync
- Content with readable text (use Kling specifically, not Sora/Veo)
- Before/after reveals with precise start/end control (Veo Frames to Video)

**Budget implication at 100 videos/month:**
- 80 videos on Kling via fal.ai: 80 x 5s x $0.029 = $11.60
- 20 videos on premium mix: 20 x 5s x $0.30 avg = $30.00
- Total: $41.60 for production renders (plus iteration budget)

Compare to: 100 videos on Sora 2 Pro = 100 x 5s x $0.50 = $250.00

**Savings from the 80/20 rule: 83%**

### 7.5 Cost Decision Quick Reference

Before every generation, ask yourself:

```
COST CHECK (30 seconds)
=======================
1. Is this a draft or a final?
   Draft -> Use floor/budget tier. STOP.
   Final -> Continue.

2. Does it need text rendering?
   Yes -> Kling 3.0. STOP.
   No  -> Continue.

3. Does it need dialogue/lip-sync?
   Yes -> Veo 3.1 or Kling Omni. STOP.
   No  -> Continue.

4. Does it need cinematic physics (water, fabric, crowds)?
   Yes -> Sora 2 Pro. STOP.
   No  -> Continue.

5. Does it need precise start/end frames?
   Yes -> Veo 3.1 (Frames to Video). STOP.
   No  -> Continue.

6. Default: Kling 3.0 via fal.ai.
```

---

## 8. Automation Patterns

As your production volume grows, manual prompt writing becomes the bottleneck. These patterns let you generate prompts programmatically while maintaining quality.

### 8.1 Programmatic Prompt Generation from Templates

Use string templates with variable slots to generate prompts at scale.

```typescript
// Prompt template with variable slots
interface PromptTemplate {
  id: string;
  model: string;
  basePrompt: string;
  negativePrompt?: string;
  variables: Record<string, string>;
}

const productCloseupTemplate: PromptTemplate = {
  id: "kling3-product-closeup-base",
  model: "kling3",
  basePrompt: `Close-up of {{PRODUCT}} on {{SURFACE}}, {{LIGHTING}},
    shallow depth of field, {{LENS}}mm lens, {{STYLE}}, photorealistic`,
  negativePrompt: "blurry, cartoon, text overlay, watermark, low quality",
  variables: {
    PRODUCT: "smartphone",
    SURFACE: "white marble desk",
    LIGHTING: "morning window light",
    LENS: "50",
    STYLE: "clean modern aesthetic"
  }
};

function renderPrompt(template: PromptTemplate, overrides?: Partial<Record<string, string>>): string {
  const vars = { ...template.variables, ...overrides };
  let prompt = template.basePrompt;
  for (const [key, value] of Object.entries(vars)) {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return prompt;
}

// Generate 10 variations of the same product shot
const products = [
  { PRODUCT: "red sneaker", SURFACE: "concrete floor", STYLE: "streetwear editorial" },
  { PRODUCT: "luxury watch", SURFACE: "black velvet", STYLE: "high-end jewelry commercial" },
  { PRODUCT: "ceramic mug", SURFACE: "rustic wood table", STYLE: "cozy lifestyle" },
  // ... etc
];

const prompts = products.map(p => renderPrompt(productCloseupTemplate, p));
```

### 8.2 Variable Substitution Patterns

**Industry-specific variable sets:**

```typescript
const industryVariables: Record<string, Record<string, string>> = {
  plumbing: {
    PROFESSIONAL: "professional plumber in clean navy coveralls",
    WORKSPACE: "modern kitchen with white cabinets",
    TOOL: "chrome pipe wrench",
    ACTION: "tightening a faucet connection",
    UNIFORM_COLOR: "navy blue"
  },
  hvac: {
    PROFESSIONAL: "HVAC technician in company polo shirt",
    WORKSPACE: "residential utility room",
    TOOL: "digital manifold gauge",
    ACTION: "inspecting an air conditioning unit",
    UNIFORM_COLOR: "grey with company logo"
  },
  salon: {
    PROFESSIONAL: "hairstylist in black apron",
    WORKSPACE: "modern salon with large mirrors",
    TOOL: "professional shears",
    ACTION: "styling a client's hair",
    UNIFORM_COLOR: "black"
  },
  realestate: {
    PROFESSIONAL: "real estate agent in tailored blazer",
    WORKSPACE: "modern open-concept kitchen",
    TOOL: "tablet with floor plan",
    ACTION: "presenting the space to clients",
    UNIFORM_COLOR: "navy blazer, white shirt"
  }
};
```

### 8.3 Batch Generation with Prompt Variations

For high-volume production, generate prompt variations systematically:

```typescript
interface BatchJob {
  promptId: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  duration: number;
  priority: "low" | "medium" | "high";
  estimatedCost: number;
}

function generateBatch(
  template: PromptTemplate,
  variationSets: Record<string, string>[],
  config: { model: string; aspectRatio: string; duration: number }
): BatchJob[] {
  return variationSets.map((vars, i) => ({
    promptId: `${template.id}-batch-${Date.now()}-${i}`,
    model: config.model,
    prompt: renderPrompt(template, vars),
    negativePrompt: template.negativePrompt,
    aspectRatio: config.aspectRatio,
    duration: config.duration,
    priority: "low",
    estimatedCost: config.duration * getCostPerSecond(config.model)
  }));
}

// Queue a week of social content
const weeklyBatch = generateBatch(
  productCloseupTemplate,
  products,
  { model: "kling3-fal", aspectRatio: "9:16", duration: 5 }
);

// Estimated cost: 10 videos x 5s x $0.029 = $1.45
console.log(`Batch: ${weeklyBatch.length} videos, est. $${
  weeklyBatch.reduce((sum, j) => sum + j.estimatedCost, 0).toFixed(2)
}`);
```

### 8.4 Auto-Scoring Pipeline

The most powerful automation pattern: generate, score, and iterate without human intervention for draft-quality content.

```
AUTO-SCORING PIPELINE
=====================

INPUT: Prompt + Model + Quality Threshold (default: 7.0)

LOOP (max 5 iterations):
  1. GENERATE video from prompt on selected model
  2. SCORE output using automated metrics:
     - Visual Quality: CLIP score against prompt (proxy for quality)
     - Motion Coherence: Optical flow consistency check
     - Prompt Adherence: CLIP similarity between prompt text and video frames
     - Composition: Rule-of-thirds alignment detection
     - Temporal Flow: Frame-to-frame similarity variance (should be smooth)
  3. IF average score >= threshold:
       APPROVE -- move to output queue
       BREAK
  4. IF iteration count >= max:
       FLAG for human review
       BREAK
  5. ADJUST prompt based on lowest-scoring dimension:
     - Apply the Iteration Decision Tree (Section 3) programmatically
     - Log the adjustment for learning
  6. CONTINUE loop

OUTPUT: Approved video + scorecard + iteration log
```

**Automated scoring is imperfect but useful for:**
- Catching obvious failures (generation errors, wrong aspect ratio, black frames)
- Filtering out the bottom 20% of generations that clearly need re-doing
- Maintaining a minimum quality bar for batch-generated content
- Reducing human review load from 100% to ~30% of generations

**Automated scoring is NOT reliable for:**
- Subtle quality differences (8.0 vs 8.5)
- Creative judgment (is this the RIGHT visual, not just a GOOD one)
- Brand alignment (does this match our visual identity)
- Emotional impact (does this make the viewer feel something)

**Recommendation:** Use auto-scoring for draft and social tiers. Always human-review hero and client-facing content.

### 8.5 Workflow Integration with n8n / Make / Custom

For teams using workflow automation:

```
AUTOMATION WORKFLOW (n8n example)
=================================

TRIGGER: New row in Google Sheet ("Video Requests" sheet)
  |
  v
NODE 1: Parse request (content type, platform, industry, budget)
  |
  v
NODE 2: Select prompt template from library (match by tags)
  |
  v
NODE 3: Fill template variables from request data
  |
  v
NODE 4: Select model based on cost decision tree (Section 7.5)
  |
  v
NODE 5: Submit to generation API (fal.ai / OpenAI / Google)
  |
  v
NODE 6: Wait for completion (webhook callback)
  |
  v
NODE 7: Download output, run auto-scoring
  |
  v
NODE 8: Branch:
  - Score >= 7.0 -> Move to "Approved" folder, notify Slack
  - Score < 7.0 -> Move to "Review" folder, notify Slack with scorecard
  |
  v
NODE 9: Log everything (prompt, model, cost, score, duration) to tracking sheet
```

### 8.6 Prompt-to-API Parameter Mapping

When sending prompts programmatically, map your universal prompt to each API's parameter structure:

```typescript
// Universal prompt object
interface UniversalPrompt {
  subject: string;
  context: string;
  action: string;
  style: string;
  camera: string;
  audio: string;
  negative: string;
  duration: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
}

// Convert to Sora 2 API format
function toSoraParams(p: UniversalPrompt) {
  return {
    model: "sora-2-pro",
    input: `${p.camera} of ${p.subject} in ${p.context}. ${p.action}. ${p.style}. Avoid: ${p.negative}`,
    duration: p.duration,
    aspect_ratio: p.aspectRatio,
    resolution: "1080p"
  };
}

// Convert to Kling API format (via fal.ai)
function toKlingParams(p: UniversalPrompt) {
  return {
    model_name: "kling-video/v2/master/text-to-video",
    prompt: `${p.subject}, ${p.action}, ${p.context}, ${p.camera}, ${p.style}`,
    negative_prompt: p.negative,
    duration: p.duration <= 5 ? "5" : "10",
    aspect_ratio: p.aspectRatio
  };
}

// Convert to Veo 3.1 API format (Vertex AI)
function toVeoParams(p: UniversalPrompt) {
  return {
    model: "veo-3.1",
    prompt: `${p.camera}, ${p.subject}, ${p.action}, ${p.context}, ${p.style}, ${p.audio}, do not include ${p.negative}`,
    aspectRatio: p.aspectRatio,
    duration: `${p.duration}s`,
    personGeneration: "allow_adult",
    sampleCount: 1
  };
}
```

---

## Quick Reference Card

Print this. Pin it to the wall. Follow it every time.

```
THE 5-STEP CYCLE
================
1. DEFINE  -> Fill scope card (platform, duration, ratio, audience, budget)
2. DRAFT   -> Fill 7 slots (subject, context, action, style, camera, audio, negative)
3. ADAPT   -> Convert to model-specific syntax (see Section 1, Step 3)
4. GENERATE -> Cheapest viable model first, escalate per budget ladder
5. REFINE  -> Score on 7 dimensions, follow decision tree, change ONE variable

COST QUICK CHECK
================
Draft?           -> Floor tier ($0.005-$0.03/sec)
Social content?  -> Kling via fal.ai ($0.029/sec)
Needs text?      -> Kling 3.0 (only reliable text renderer)
Needs dialogue?  -> Veo 3.1 or Kling Omni
Needs physics?   -> Sora 2 Pro
Needs precision? -> Veo 3.1 Frames to Video
Everything else  -> Kling 3.0 via fal.ai

SCORING THRESHOLD
=================
Ship it:     >= 7.0 weighted average
Adjust:      5.0 - 6.9 (change ONE variable, same model)
Rewrite:     < 5.0 (start from Step 2 or escalate model)
Max retries: 3 adjustments before escalating model

THE ONE RULE
============
Never change more than one variable between iterations.
```

---

## Sources

**Internal KB:**
- [Prompt Engineering Guide](../guides/prompt-engineering-guide.md)
- [Budget Optimization Guide](../guides/budget-optimization-guide.md)
- [Model Comparison Guide](../guides/model-comparison-guide.md)

**Research:**
- [VPO: Aligning Text-to-Video Generation Models with Prompt Optimization (ICCV 2025)](https://arxiv.org/abs/2503.20491)
- [Video-As-Prompt: Unified Semantic Control for Video Generation (ICLR 2026)](https://github.com/bytedance/Video-As-Prompt)

**Industry Guides:**
- [Truefan: Cinematic AI Video Prompts 2026](https://www.truefan.ai/blogs/cinematic-ai-video-prompts-2026)
- [Truefan: AI Video Prompt Engineering 2026](https://www.truefan.ai/blogs/ai-video-prompt-engineering-2026)
- [VO3 AI: Video Workflows Complete Guide 2026](https://www.vo3ai.com/blog/ai-video-workflows-from-prompting-to-editing-a-2026-deep-guide)
- [Cliprise: AI Video Generation Complete Guide 2026](https://www.cliprise.app/learn/guides/getting-started/ai-video-generation-complete-guide-2026)
- [LTX Studio: AI Video Workflow Guide 2026](https://ltx.studio/blog/ai-video-workflow)
- [Google Cloud: Veo Prompt Guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide)
- [OpenAI: Video Generation with Sora](https://developers.openai.com/api/docs/guides/video-generation)

**Evaluation & Testing:**
- [Maxim: Prompt Evaluation Frameworks](https://www.getmaxim.ai/articles/prompt-evaluation-frameworks-measuring-quality-consistency-and-cost-at-scale/)
- [Maxim: A/B Testing Prompts Guide](https://www.getmaxim.ai/articles/how-to-perform-a-b-testing-with-prompts-a-comprehensive-guide-for-ai-teams/)
- [Truefan: AI Video Experiment Automation](https://www.truefan.ai/blogs/ai-video-experiment-automation)
- [JustoBorn: The Ultimate Prompt Rubric Guide](https://justoborn.com/prompt-rubric/)

**Automation:**
- [n8n: Automated AI Video Generation Workflow](https://n8n.io/workflows/3442-fully-automated-ai-video-generation-and-multi-platform-publishing/)
- [Skywork: Veo 3.1 Batch Video Generation](https://skywork.ai/blog/ai-video/veo-3-1-batch-video-generation-and-automation/)
- [Vozo: AI Video Editing for YouTube 2026](https://www.vozo.ai/blogs/youtube/ai-video-editing-youtube-workflow)

**Template & Organization:**
- [Medium: AI Video Generation Prompt Template System](https://medium.com/@slakhyani20/ai-video-generation-prompt-template-system-you-can-use-696b4672dcc1)
- [GitHub: Awesome AI Video Prompts](https://github.com/geekjourneyx/awesome-ai-video-prompts)
- [ImagineArt: JSON Prompting for AI Video](https://www.imagine.art/blogs/json-prompting-for-ai-video-generation)


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
