# Vidu Advanced Prompt Engineering Guide (Q1 / Q2 / Q3)

> Last updated: 2026-03-18
> Audience: Production engineers, content pipeline operators, prompt designers
> Prerequisite: Familiarity with Vidu model tiers, pricing, and API parameters
> Atlas UX default workhorse: Q2-pro-fast 720P off-peak at $0.055/video (8s)

---

## 1. Vidu Prompt Architecture

### 1.1 How Vidu Processes Prompts Across Model Tiers

Vidu does not use a single prompt decoder. Each model generation (Q1, Q2, Q3) was trained with different objectives and therefore interprets prompts through different lenses:

| Model | Prompt Processing Characteristics |
|-------|----------------------------------|
| **Q1** | Optimized for anime/stylized content. Strongest character consistency from reference images. Interprets style keywords (cel shading, line art, watercolor) with high fidelity. Multi-reference (up to 7 images) drives visual vocabulary more than text alone. Text prompt acts as a *director's note* on top of the visual references. |
| **Q2** | Focused on camera movement and cinematic control. Best prompt adherence for lens work (push-in, orbit, tracking shot). Treats the prompt as a *cinematographer's brief* -- subject, action, and camera are the three pillars. 2000-character prompt capacity. Reference images define *identity*; text defines *motion and framing*. |
| **Q3** | Full-stack prompt understanding: subject + action + environment + camera + style + audio. Processes audio cues natively (dialogue lines, SFX descriptions, BGM mood). Treats the prompt as a *scene description* from a shooting script. Smart shot switching interprets multi-beat prompts as implicit cut points. |

### 1.2 The Vidu Prompt Formula

Every Vidu prompt should follow a six-element structure, weighted differently by model:

```
[SHOT TYPE] + [SUBJECT] + [ACTION] + [ENVIRONMENT] + [STYLE/MOOD] + [CAMERA MOVEMENT]
```

**For Q3, add a seventh element:**
```
+ [AUDIO DIRECTION]
```

Element priority by model:

| Element | Q1 Weight | Q2 Weight | Q3 Weight |
|---------|-----------|-----------|-----------|
| Shot type | Medium | **High** | High |
| Subject | High (via refs) | Medium | High |
| Action | Medium | **High** | High |
| Environment | Low-Medium | Medium | High |
| Style/Mood | **High** | Medium | Medium |
| Camera movement | Low | **Highest** | High |
| Audio direction | N/A | N/A | **High** |

### 1.3 Optimal Prompt Length by Model

| Model | Sweet Spot | Max Capacity | Guidance |
|-------|-----------|-------------|----------|
| Q1 | 30-60 words | ~500 chars | Let reference images carry the visual load. Text directs motion and emotion, not appearance. |
| Q2 | 60-100 words | 2000 chars | Detailed camera and motion direction pays off. Describe the shot like a DP's brief. |
| Q2-turbo | 40-70 words | 2000 chars | Simpler prompts run faster. Over-specifying camera for turbo can waste inference. |
| Q3-turbo | 50-80 words | 2000 chars | Focus on one strong beat per clip. Turbo handles simple shots best. |
| Q3-pro | 80-150 words | 2000 chars | Full scene descriptions with audio cues. Multi-beat prompts trigger smart shot switching. |

### 1.4 How Start-End-to-Video Changes the Prompting Paradigm

Start-end2video (S2V) is Vidu's most unique mode. You provide a start frame, an end frame, and a text prompt. The model generates the transition between them.

**The paradigm shift:** In S2V mode, the prompt describes *the journey between two states*, not a standalone scene. The model already knows where to start and where to end -- your job is to describe *how* it gets there.

Key principles:
- **Describe the transition, not the endpoints.** The model can see both frames. Don't restate what's visible.
- **Focus on motion quality.** "Smooth dolly forward" tells the model how to interpolate between frames.
- **Under-describe, don't over-describe.** The model interpolates between two known states. Excessive motion description creates conflict with the visual anchors.
- **Duration matters.** A 4s S2V clip needs minimal motion description. A 16s S2V clip needs intermediate beats or the interpolation will feel like slow-motion.

Bad S2V prompt: "A woman in a red dress stands in a park, then she walks to a bench and sits down."
Good S2V prompt: "Smooth tracking shot following the subject as she walks naturally toward the bench, gentle swaying motion, afternoon light shifting across her dress."

### 1.5 Reference-to-Video: Combining References with Text

R2V mode (Q2 Pro, Q1) uses reference images to lock identity while text directs everything else.

**The division of labor:**
- Reference images own: face, body proportions, hair, clothing, color palette, art style
- Text prompt owns: action, camera, environment, lighting, mood, duration pacing

**Critical rule:** Never contradict your reference images with text. If the reference shows a woman with black hair, don't prompt "blonde woman." The model will attempt both and produce artifacts.

**Multi-reference stacking (Q1, up to 7 images):**

| Ref Slot | Best Use |
|----------|----------|
| Ref 1 | Primary character face/body (3/4 view preferred) |
| Ref 2 | Same character, different angle or expression |
| Ref 3 | Secondary character or prop |
| Ref 4 | Environment/background reference |
| Refs 5-7 | Additional characters, style references, or pose guides |

**Q2 Pro multi-reference (2 video + 4 image):**
- Video refs establish motion style and pacing
- Image refs lock visual identity
- Text prompt bridges the gap between the two

### 1.6 Anime Style Mode (Q1) -- Specific Prompting Considerations

Q1's anime mode is not just a style filter -- it was trained on anime-specific datasets. Prompts should use anime production terminology:

**Keywords the anime model responds to strongly:**
- Cel shading, colored line art, flat color, gradient shading
- Sakuga (high-quality animation), limited animation, full animation
- Character sheet, orthographic reference
- Shonen, shojo, seinen, isekai (genre tags influence composition)
- Chibi, super deformed (proportion modifiers)
- Speed lines, impact frames, screentone
- Cherry blossom / sakura, school uniform, mecha (common scene/subject tags)

**What to avoid in anime mode:**
- Photorealistic lighting terms (HDRI, ray tracing, subsurface scattering) -- these fight the anime aesthetic
- "8K" or "hyperrealistic" -- counterproductive in anime mode
- Excessive environment detail -- anime typically uses simplified backgrounds with detailed characters

---

## 2. Advanced Techniques

### 2.1 Start-End-to-Video Mastery

S2V is the treatment pipeline killer feature. It turns two frames from existing footage into a new AI-generated transition clip.

**Frame Selection Strategy:**

| Transition Type | Start Frame | End Frame | Prompt Focus |
|----------------|-------------|-----------|-------------|
| Scene transition | End of scene A | Start of scene B | Describe the visual bridge (fade, morph, pan) |
| Character motion | Pose A | Pose B | Describe the biomechanics of the movement |
| Product morph | Product state A | Product state B | Describe the transformation (unfold, rotate, reveal) |
| Time-lapse | Time T0 | Time T1 | Describe the environmental change (light shift, weather) |
| Before/after | Before state | After state | Describe the transformation process |

**Duration-to-complexity mapping:**

| Duration | Best For | Prompt Complexity |
|----------|----------|-------------------|
| 4s | Simple state change (door opens, head turns) | 1 beat, minimal description |
| 8s | Moderate transition (walk across room, product reveal) | 1-2 beats |
| 12s | Complex motion (dance move, multi-step action) | 2-3 beats |
| 16s | Full scene transition (day to night, location change) | 3-4 beats, needs intermediate direction |

**The 16-second trap:** For 16s S2V, you MUST provide intermediate direction or the model will produce a slow, drifting interpolation. Break your prompt into temporal beats:

```
"[0-4s] Camera slowly pushes in as the subject turns toward the window.
[4-10s] Gentle tracking shot follows as she crosses the room, light shifting from warm to cool.
[10-16s] Camera settles into a wide shot as she reaches the door."
```

Note: Vidu doesn't parse timestamps literally, but temporal structuring in the prompt creates implicit keyframes that guide the interpolation.

### 2.2 Reference-to-Video: Advanced Techniques

**Identity Lock Strength:**
- Single front-facing reference: ~70% identity preservation
- Front + 3/4 view: ~85% identity preservation
- Front + 3/4 + profile: ~92% identity preservation
- 4+ refs with varied expressions: ~95% identity preservation

**Reference Image Quality Requirements:**

| Factor | Minimum | Optimal |
|--------|---------|---------|
| Resolution | 512x512 | 1024x1024+ |
| Face visibility | Partial | Full, unobstructed |
| Lighting | Any | Even, well-lit, neutral |
| Background | Any | Clean, uncluttered |
| Expression | Any | Neutral (for maximum flexibility) |

**Pro technique -- Style Transfer via Reference:**
Upload a single reference image in the target art style (not of the subject). Combine with a text prompt describing the subject and action. The model will generate in the reference's visual style while following the text direction.

### 2.3 Multi-Reference Prompting

When using multiple references, the prompt must orchestrate which reference controls what:

```
"The character [from ref 1] walks through the garden [from ref 4],
wearing the outfit [from ref 3], in the art style [from ref 2]."
```

Vidu doesn't support explicit ref-slot assignment in text, but it resolves references by visual similarity. Best practice:
- Make references visually distinct (a character ref won't be confused with a landscape ref)
- Place the most important reference in slot 1
- Use text to reinforce which visual elements should dominate

### 2.4 Motion Description: Vidu vs Competitors

Vidu interprets motion differently from Sora and Veo:

| Motion Aspect | Vidu Behavior | Sora Behavior | Implication |
|---------------|---------------|---------------|-------------|
| Camera movement | **Strongest suit.** Push-in, orbit, tracking, dolly, crane -- all interpreted precisely. | Understands complex text but limited direct camera controls. | Use explicit camera terms with Vidu; use narrative description with Sora. |
| Subject motion | Good for simple/moderate. Struggles with complex physics. | Excellent physics simulation. | Keep Vidu subject motion simple and believable. |
| Motion intensity | Controllable via `motion_intensity` API parameter (auto/small/medium/large). | No equivalent parameter. | Use the parameter, don't try to describe intensity in text alone. |
| Multi-subject motion | Struggles with 3+ subjects moving independently. | Handles better. | For crowd scenes, use Vidu with "small" motion and let the model choose safe movements. |

**Motion vocabulary that Vidu handles well:**
- Camera: push-in, pull-out, pan left/right, tilt up/down, orbit, dolly, crane up/down, whip pan, rack focus, Dutch angle, tracking shot, Steadicam
- Subject: walking, running, turning, reaching, sitting, standing, dancing (simple), gesturing, nodding, blinking, breathing
- Environment: wind blowing, water flowing, clouds drifting, leaves falling, light shifting, shadows moving

**Motion vocabulary that causes artifacts:**
- "Exploding," "shattering," "morphing into" (physics-heavy)
- "Multiple people running in different directions" (multi-agent collision)
- "Fingers playing piano keys" (fine motor detail)
- "Pouring liquid from bottle into glass" (fluid dynamics)

### 2.5 Style Control

**General Style (all models):**

| Style Keyword | Effect | Best Model |
|---------------|--------|-----------|
| Cinematic | Film-grade lighting, shallow DOF, color grading | Q3-pro |
| Documentary | Handheld feel, natural light, observational framing | Q2-pro |
| Commercial | Clean, bright, product-focused | Q2-pro-fast |
| Film noir | High contrast, shadows, dramatic angles | Q3-pro |
| Golden hour | Warm backlight, lens flare, soft shadows | Any |
| Overcast softbox | Even, diffused lighting | Any |
| Neon-lit | Saturated colors, reflective surfaces, urban | Q3-pro |
| Vintage / retro | Film grain, desaturated, warm tones | Q3-pro |
| Minimalist | Clean backgrounds, simple composition | Q2-turbo |

**Anime Style (Q1 only):**

| Anime Sub-Style | Keywords | Example Use |
|----------------|----------|-------------|
| Modern shonen | Dynamic poses, speed lines, impact frames, saturated colors | Action scenes, fight sequences |
| Slice of life | Soft lighting, pastel palette, gentle motion, school setting | Character moments, dialogue |
| Cyberpunk anime | Neon, holographic UI, dark city, tech overlays | Sci-fi content |
| Studio Ghibli-esque | Watercolor backgrounds, detailed nature, gentle wind | Landscapes, calm scenes |
| Chibi / super deformed | Exaggerated proportions, simplified features, comedic | Comedy, mascot content |

**Pushing within a style:**
- Add specificity: "cinematic" < "cinematic, anamorphic lens, 2.39:1 aspect feel, Arri Alexa color science"
- Add era: "1970s cinematic" vs "2020s cinematic" produces different color grading
- Add reference director/DP: "in the style of Roger Deakins lighting" (use with care -- inconsistent)

### 2.6 Duration Optimization

The same prompt performs differently at different durations. Adapt your prompt to the clip length:

**4-second clips:**
- One action, one camera move, zero transitions
- Prompt should describe a single moment, not a sequence
- Best for: reaction shots, product hero shots, transitions, social media loops
- Example: "Close-up of a woman's eyes widening in surprise, soft rim light, shallow depth of field"

**8-second clips:**
- One to two actions, one camera move with a settle
- Prompt can include a beginning and end state
- Best for: product reveals, character introductions, scene-setting shots
- Example: "Medium shot of a barista preparing a latte, camera slowly pushes in from medium to close-up as she pours the milk art, warm cafe lighting, steam rising"

**16-second clips (Q3 only):**
- Two to four beats, camera can shift movement style, scene can evolve
- Prompt should have temporal structure (beginning / middle / end)
- Best for: mini-narratives, before/after, scene transitions
- Example: "Wide establishing shot of a quiet mountain village at dawn, camera slowly cranes down to street level as a woman opens a shop door, cuts to medium shot of her arranging flowers in the window, morning light gradually warming the scene, birds chirping softly"

### 2.7 Resolution-Aware Prompting

Higher resolutions reveal more detail. Your prompt detail level should match:

**540P (928x520) -- Draft/preview tier:**
- Skip fine detail descriptions (eyelash detail, fabric texture, wood grain)
- Focus on composition, motion, and broad style
- Fine text in-frame will be illegible -- don't prompt for it
- Best for: rapid iteration, storyboarding, motion tests

**720P (1280x720) -- Production workhorse:**
- Include moderate detail (facial expressions, clothing type, general textures)
- In-frame text is readable at large sizes only
- Camera movements are smooth enough for final delivery at social media scale
- Best for: social media content, web video, drafts for client approval

**1080P (1920x1080) -- Final delivery:**
- Include full detail descriptions (material textures, lighting nuance, atmospheric effects)
- In-frame text rendering works for headlines/titles
- Artifacts in hands/fingers become more visible -- prompt around them
- Best for: YouTube, presentations, ad creatives, portfolio pieces

### 2.8 Off-Peak Generation Strategy

Vidu off-peak pricing is 50% of standard. Same model, same quality, same parameters -- just cheaper.

**Strategy:**
- Queue all non-urgent generation for off-peak windows
- Use off-peak for iteration (draft → refine → draft → refine) and standard for final renders only if time-critical
- Off-peak + Q2-pro-fast 720P = $0.055/video -- the Atlas UX default
- Off-peak + Q3-turbo 540P = $0.02/sec -- cheapest viable draft with audio capability

**When NOT to use off-peak:**
- Client is waiting for a deliverable
- Time-sensitive social media posting window
- Live demo or presentation preparation

---

## 3. Proven Prompt Patterns

### Pattern 1: Start-End Treatment (YouTube Clip to Short)
**Mode:** Start-End-to-Video
**Model:** Q2-pro-fast 720P (off-peak: $0.055)
**Use case:** Create a treatment/transition clip between two moments in existing footage

```
Smooth cinematic transition, camera tracks laterally following the subject's gaze
shift from left to right, natural body weight transfer, subtle ambient light change,
film grain, 24fps cadence. Let the motion breathe -- no abrupt changes.
```

**motion_intensity:** auto
**Duration:** 8s

---

### Pattern 2: img2video Character Animation
**Mode:** Image-to-Video
**Model:** Q2-pro 720P
**Use case:** Animate a still character portrait into a living moment

```
Medium close-up, the subject slowly turns their head 15 degrees to the right and
offers a gentle, knowing smile. Subtle eye movement -- gaze shifts from camera to
slightly off-camera left. Natural blink. Hair responds to a soft breeze from the
right. Warm golden hour sidelight creates a rim light along the jawline. Shallow
depth of field with bokeh in the background.
```

**motion_intensity:** small
**Duration:** 4s

---

### Pattern 3: Reference-to-Video Product Showcase
**Mode:** Reference-to-Video
**Model:** Q2-pro 1080P
**Use case:** Product video maintaining exact brand identity from reference photos

```
Product hero shot. The [product] rotates slowly on a reflective black surface,
360-degree orbit over 8 seconds. Clean studio lighting -- three-point setup with
soft key light from upper left, fill from right, and subtle backlight creating edge
separation. Background is a smooth gradient from dark grey to black. Camera
maintains eye-level perspective with a gentle 5-degree tilt down. No text overlays.
```

**motion_intensity:** medium
**Duration:** 8s
**Reference images:** 3 product photos (front, 3/4, side) on clean backgrounds

---

### Pattern 4: Text-to-Video Social Media Clip
**Mode:** Text-to-Video
**Model:** Q3-turbo 720P (off-peak: $0.03/sec)
**Use case:** Quick social media content, no source imagery needed

```
Aerial drone shot pulling back from a modern rooftop pool at sunset, revealing a
coastal city skyline. Warm orange and pink sky reflects in the still pool water.
Two lounge chairs with white towels, no people. Camera movement is smooth and
steady, gradually widening the frame. Luxury resort aesthetic, clean and
aspirational. Sound of gentle waves and distant seagulls.
```

**motion_intensity:** medium
**Duration:** 8s
**audio:** true (Q3)

---

### Pattern 5: Anime-Style Content (Q1 Exclusive)
**Mode:** Text-to-Video or Reference-to-Video
**Model:** Q1
**Style:** anime
**Use case:** Anime character moment for social content or series production

```
A determined young swordsman with spiky silver hair and a flowing dark cloak stands
at the edge of a cliff overlooking a vast fantasy kingdom at dawn. Wind catches his
cloak and hair. He grips the hilt of his sword at his side. Camera slowly pushes in
from wide to medium shot. Cel shading, colored thin line art, dramatic backlighting
from the rising sun. Shonen anime style, sakuga-quality animation on the cloak and
hair movement.
```

**motion_intensity:** medium
**Duration:** 8s

---

### Pattern 6: Anime Multi-Character Scene (Q1 Multi-Reference)
**Mode:** Reference-to-Video
**Model:** Q1
**Style:** anime
**Use case:** Consistent multi-character anime scene

```
Two characters face each other across a traditional Japanese tea room. Character A
[ref 1-2] kneels formally, holding a tea cup. Character B [ref 3-4] sits casually,
leaning back with one arm resting on their knee. Soft afternoon light through shoji
screens. Camera holds a wide two-shot with minimal movement -- just subtle breathing
animation. Slice of life anime style, pastel color palette, gentle ambient glow.
```

**Reference images:** Refs 1-2 = Character A (front, 3/4). Refs 3-4 = Character B (front, 3/4). Ref 5 = Tea room reference.
**motion_intensity:** small
**Duration:** 8s

---

### Pattern 7: Talking Head / Interview
**Mode:** Image-to-Video
**Model:** Q3-pro 1080P
**Use case:** Animate a headshot into a speaking clip with native audio

```
Medium close-up interview framing. The subject speaks directly to camera with
confident, measured delivery. Natural micro-expressions -- slight eyebrow raises for
emphasis, occasional gentle nods. Hands gesture subtly below frame. Professional
studio lighting with soft key light from 45 degrees left. Blurred office background
with warm tones. The subject says: "We built this platform because small business
owners deserve better tools." Clear American English, professional tone.
```

**motion_intensity:** small
**Duration:** 8s
**audio:** true

---

### Pattern 8: Product Rotation / Turntable
**Mode:** Start-End-to-Video
**Model:** Q2-pro-fast 720P
**Use case:** 360-degree product rotation from two angle photos

```
Smooth continuous rotation of the product on a clean white surface. Consistent
studio lighting maintained throughout the rotation -- no shadow shifts. Camera
remains stationary at eye level. The rotation is steady and mechanical, not organic.
Product stays centered in frame throughout.
```

**Start frame:** Product at 0 degrees
**End frame:** Product at 180 degrees (or back to 0 for full loop)
**motion_intensity:** medium
**Duration:** 8s

---

### Pattern 9: Nature / Landscape Establishing Shot
**Mode:** Text-to-Video
**Model:** Q3-pro 1080P
**Use case:** Cinematic nature b-roll

```
Epic wide shot of a misty mountain valley at sunrise. Fog rolls slowly through pine
forests in the valley below. First rays of golden sunlight break over the eastern
ridge, casting long shadows across the landscape. A single eagle soars in the
distance. Camera executes a slow crane up from valley level to ridge height,
revealing the full panorama. Atmospheric haze creates depth layers. Sound of wind
through pines and distant bird calls.
```

**motion_intensity:** medium
**Duration:** 16s
**audio:** true

---

### Pattern 10: Urban / Street Scene
**Mode:** Text-to-Video
**Model:** Q3-turbo 720P
**Use case:** City b-roll for social media or commercial

```
Tracking shot through a rain-soaked Tokyo street at night. Neon signs reflect in
puddles on the asphalt. Camera follows at waist height, Steadicam-style, moving
forward through the scene. Pedestrians with umbrellas pass on both sides, slightly
blurred. Focus pulls between foreground rain drops and background neon. Cyberpunk
atmosphere without being fantastical -- this is real Tokyo. Sound of rain, distant
traffic, muffled music from a bar.
```

**motion_intensity:** medium
**Duration:** 8s
**audio:** true

---

### Pattern 11: Action / Sports Moment
**Mode:** Image-to-Video
**Model:** Q3-turbo 720P
**Use case:** Animate a sports photo into a dynamic moment

```
The athlete explodes from their starting position, powerful forward lean, arms
driving. Camera captures from a low angle, emphasizing power and speed. Slow-motion
feel at 24fps -- each frame shows controlled power. Dust or turf particles kicked up
from the ground. Dramatic side lighting creates strong shadows and muscle definition.
Stadium atmosphere, blurred crowd in background.
```

**motion_intensity:** large
**Duration:** 4s

---

### Pattern 12: E-Commerce Product with Lifestyle Context
**Mode:** Reference-to-Video
**Model:** Q2-pro-fast 720P
**Use case:** Product in context for e-commerce or social ads

```
The product sits on a marble kitchen counter, morning sunlight streaming through a
nearby window. A hand enters frame from the right and picks up the product, turning
it slightly to reveal the label, then sets it back down. Camera starts on a close-up
of the product and subtly pulls back to reveal the lifestyle setting. Clean,
aspirational, Instagram-worthy aesthetic. Warm color temperature.
```

**Reference images:** 2 product photos on white background
**motion_intensity:** small
**Duration:** 8s

---

### Pattern 13: Before/After Transformation
**Mode:** Start-End-to-Video
**Model:** Q2-pro-fast 720P
**Use case:** Renovation, makeover, or product transformation content

```
Smooth transformation reveal. Camera holds steady on a locked-off wide shot as the
space evolves from the starting state to the finished state. Changes happen
progressively -- not all at once. Light shifts from flat construction lighting to
warm, designed ambient lighting as the transformation completes. Satisfying,
ASMR-like reveal pace.
```

**Start frame:** Before state
**End frame:** After state
**motion_intensity:** medium
**Duration:** 8s

---

### Pattern 14: Logo / Brand Reveal
**Mode:** Text-to-Video
**Model:** Q3-turbo 720P
**Use case:** Animated logo sting for video intros/outros

```
Minimal dark background. Subtle particles of light drift slowly across the frame.
The brand logo materializes from these light particles, assembling piece by piece
over 3 seconds, then holds for 1 second in full clarity. Camera is stationary,
centered. The logo glows softly with a warm gold edge light. Clean, premium,
understated. Brief crystalline chime sound as the logo completes.
```

**motion_intensity:** small
**Duration:** 4s
**audio:** true

---

### Pattern 15: Testimonial / UGC-Style
**Mode:** Image-to-Video
**Model:** Q2-pro-fast 720P
**Use case:** Animate a customer photo into a casual testimonial feel

```
The subject looks directly at camera with a relaxed, genuine smile. Subtle natural
movement -- a slight head tilt, natural breathing, a small nod. The background is
their own environment, slightly out of focus. Natural, unposed lighting -- not
studio-perfect. The feel is authentic UGC, not polished commercial. Handheld camera
micro-movement for realism.
```

**motion_intensity:** small
**Duration:** 4s

---

### Pattern 16: Cinematic Food / Beverage
**Mode:** Text-to-Video
**Model:** Q3-pro 1080P
**Use case:** Food content for restaurants, delivery apps, social

```
Extreme close-up of espresso being poured into a white ceramic cup. Rich crema
forms on the surface. Camera is at cup-rim level, macro lens perspective. Steam
rises in slow, curling patterns backlit by warm morning light from a window. Shallow
depth of field -- only the cup and pour are sharp. Background is a blurred cafe
interior with warm wood tones. Sound of espresso machine, quiet cafe ambiance.
```

**motion_intensity:** small
**Duration:** 8s
**audio:** true

---

## 4. Prompt Optimization System

### 4.1 Model Tier Selection Based on Prompt Complexity

| Prompt Complexity | Characteristics | Recommended Tier | Cost (8s, 720P, off-peak) |
|-------------------|----------------|------------------|---------------------------|
| **Simple** | Single subject, one action, no camera move | Q2-turbo 540P | $0.05 |
| **Moderate** | Subject + action + camera move + style | Q2-pro-fast 720P | $0.055 |
| **Complex** | Multi-beat, environment detail, lighting | Q2-pro 720P | $0.215 |
| **Advanced** | Full scene + camera + audio + dialogue | Q3-turbo 720P | $0.24 |
| **Premium** | Cinematic + audio + 16s + multi-beat | Q3-pro 1080P | $0.64 |

**Decision tree:**

```
Does the clip need audio?
  YES → Q3 (turbo for speed, pro for quality)
  NO ↓
Does it need reference/brand consistency?
  YES → Q2-pro (or Q1 for anime)
  NO ↓
Is it a start-end treatment?
  YES → Q2-pro-fast (cheapest S2V)
  NO ↓
Is it text-to-video?
  Simple → Q2-turbo 540P
  Complex → Q3-turbo 720P
```

### 4.2 Iteration Strategy: Draft-to-Final Pipeline

**Phase 1: Concept validation (cheapest possible)**
- Model: Q2-turbo 540P off-peak ($0.05)
- Duration: 4s
- Purpose: Validate composition, motion direction, style
- Iterate 3-5 times at this tier before committing to higher quality

**Phase 2: Motion and timing refinement**
- Model: Q2-pro-fast 720P off-peak ($0.055)
- Duration: Target duration (4s/8s)
- Purpose: Confirm motion works at production resolution and timing
- Iterate 1-3 times

**Phase 3: Final render**
- Model: Q3-pro 1080P off-peak ($0.08/sec) or Q2-pro 1080P
- Duration: Final duration
- Purpose: Production-quality output
- Render 1-2 versions for selection

**Total iteration cost (typical):**
- 4 concept drafts: 4 x $0.05 = $0.20
- 2 motion refinements: 2 x $0.055 = $0.11
- 1 final render (8s, 1080P): $0.64
- **Total: $0.95** for a polished 8s video with proper iteration

### 4.3 Evaluating Output Quality

| Quality Dimension | What to Look For | Fix Strategy |
|-------------------|-----------------|--------------|
| **Motion coherence** | Smooth, physically plausible movement throughout | Reduce `motion_intensity`; simplify action description |
| **Subject consistency** | Face/body doesn't morph between frames | Add reference images; reduce duration; simplify motion |
| **Camera stability** | Smooth camera path, no jitter (unless intended) | Use explicit camera terms; avoid conflicting camera directions |
| **Lighting consistency** | No abrupt brightness/color shifts | Specify a single lighting setup; avoid "changing light" prompts |
| **Edge artifacts** | Clean subject boundaries, no "mushy" regions | Increase resolution; simplify background; use reference images |
| **Hand/finger quality** | Recognizable finger poses without fusion | Frame hands out of shot; use "small" motion; avoid hand-centric actions |
| **Audio sync (Q3)** | Dialogue roughly matches mouth movement | Keep dialogue short and simple; one speaker at a time |

### 4.4 Cost-Aware Prompting: Maximum Quality from Cheapest Tier

Q2-pro-fast 720P off-peak ($0.055/video) delivers 80% of Q3-pro quality for 8.5% of the cost. To maximize what you get from this tier:

1. **Lean into camera movement** -- Q2's strongest interpretation area
2. **Use img2video** -- providing a starting frame dramatically improves output vs pure text
3. **Keep duration at 4-8s** -- quality degrades faster on cheaper tiers at longer durations
4. **Use "small" motion** for character close-ups -- prevents the artifacts that cheap tiers produce with large motion
5. **Add style keywords** -- "cinematic, shallow depth of field, film grain" costs nothing extra but improves perceived quality
6. **Avoid text-in-frame** -- cheaper tiers can't render readable text; don't waste prompt tokens on it

### 4.5 A/B Testing with Seed Control

The `seed` API parameter enables reproducible generation. Use it for controlled comparison:

**Testing prompt variations:**
```
Prompt A: "Close-up portrait, woman smiles gently, golden hour light"
Prompt B: "Close-up portrait, woman smiles gently, soft overcast light"
Seed: 42 (same for both)
```
Same seed + different prompt = isolated variable testing. The model's random initialization is locked, so differences in output are attributable to the prompt change.

**Testing model tier impact:**
```
Same prompt, same seed, different model:
- Q2-turbo: see baseline quality
- Q2-pro-fast: see quality improvement
- Q3-turbo: see if the upgrade matters for this specific prompt
```

**Seed limitations:**
- Same seed does NOT guarantee identical output across different models
- Same seed does NOT guarantee identical output at different resolutions
- Same seed + same everything = very similar but not pixel-identical output (non-deterministic inference)

---

## 5. Vidu-Specific Features

### 5.1 API Parameters and Their Effect on Prompt Interpretation

| Parameter | Values | Effect on Prompt |
|-----------|--------|-----------------|
| `prompt` | String (up to 2000 chars) | Core generation directive |
| `model` | q1, q2-turbo, q2-pro, q2-pro-fast, q3-turbo, q3-pro | Changes how the prompt is interpreted (see Section 1.1) |
| `resolution` | 540p, 720p, 1080p | Higher res = more detail rendered from prompt descriptions |
| `duration` | 1-8 (Q1/Q2), 1-16 (Q3) | Longer duration requires more temporal structure in prompt |
| `motion_intensity` | auto, small, medium, large | Overrides prompt-implied motion level. "auto" lets the model decide from prompt context. |
| `audio` | true/false | When true (Q3 only), model processes audio cues from prompt. When false, audio-related prompt text is ignored. |
| `seed` | Integer (-1 = random) | Controls random initialization. Same seed = similar output for same prompt+params. |
| `image_url` | URL | For I2V: this is the starting frame. Model balances image content against prompt text. |
| `style` | general, anime | Q1: switches between anime and general model weights. Other tiers: general only. |

**Parameter interaction effects:**

- `motion_intensity: large` + prompt saying "subtle gentle movement" = CONFLICT. The parameter wins over text.
- `audio: true` + no audio cues in prompt = model auto-generates contextual audio (often good, sometimes mismatched)
- `duration: 16` + simple one-beat prompt = slow-motion stretching of a single moment (usually undesirable)
- `resolution: 540p` + prompt describing "fine fabric texture detail" = wasted prompt tokens (detail won't render)

### 5.2 Q2-pro-fast vs Q2-pro in Prompt Handling

| Aspect | Q2-pro-fast | Q2-pro |
|--------|-------------|--------|
| **Price (8s, 720P, off-peak)** | $0.055 | $0.215 |
| **Camera interpretation** | Good -- handles standard moves | Excellent -- handles complex moves like orbit + tilt combo |
| **Subject detail** | Good at 720P, acceptable at 1080P | Excellent at both |
| **Prompt adherence** | ~80% of prompt elements rendered | ~92% of prompt elements rendered |
| **Multi-reference** | Not supported | 2 video + 4 image references |
| **Best for** | Volume production, drafts, simple shots | Brand consistency, hero shots, complex camera |
| **Prompt strategy** | Keep prompts focused on 3-4 elements max | Can handle 6+ element prompts reliably |

**When to upgrade from pro-fast to pro:**
- You need reference-to-video (brand consistency)
- Your prompt has complex camera choreography (orbit while pushing in while tilting)
- Fine facial expressions matter (subtle smile vs. knowing smirk vs. shy grin)
- You're doing final delivery at 1080P and need maximum detail

**When pro-fast is sufficient:**
- Social media content (720P is already over-spec for Instagram/TikTok)
- Start-end treatments (the frames carry the visual load, not the prompt)
- Batch production (100+ clips where cost matters more than per-clip perfection)
- Draft iteration (testing compositions before committing to pro)

### 5.3 Start-End Frame Selection Strategy

**Frame selection checklist:**

1. **Visual similarity:** Start and end frames should share enough visual DNA for the model to interpolate. A close-up face and a wide landscape will confuse the model.

2. **Temporal plausibility:** The transition should be physically possible within the duration. A person standing then sitting works in 8s. A person on a mountain then at the beach does not.

3. **Consistent lighting:** Mismatched lighting between start and end frames creates flickering artifacts during interpolation.

4. **Resolution matching:** Both frames should be the same resolution and aspect ratio as your output setting. Mismatches cause the model to crop/letterbox unexpectedly.

5. **Subject positioning:** Keep the subject in a similar region of the frame between start and end. Large position shifts (left edge to right edge) work at 8s+ but not 4s.

**Golden rule:** If you can imagine a cinematographer shooting the transition in real life with one continuous take, the S2V model can generate it.

### 5.4 Reference Image Quality and Impact

Reference image quality has a non-linear impact on output:

| Reference Quality | Output Impact |
|-------------------|---------------|
| Phone selfie (noisy, bad lighting) | 40-50% identity match; artifacts in generated video |
| Decent photo (good lighting, sharp) | 75-85% identity match; clean generation |
| Professional headshot (studio, 1024px+) | 90-95% identity match; highest quality |
| AI-generated portrait (perfectly clean) | 85-92% identity match; can feel "uncanny" |

**Key finding:** A well-lit 720P photo outperforms a poorly-lit 4K photo as a reference. Lighting quality matters more than pixel count.

### 5.5 Audio Add-on: When It's Worth It

The audio add-on costs +15 credits (+$0.075) per video on Q3 models.

**Worth the +$0.075:**
- Social media content that will be consumed with sound on (Instagram Reels, TikTok)
- Quick turnaround where post-production audio would add hours
- Ambient/environmental audio (wind, rain, cafe noise) that Vidu generates well
- Short dialogue clips (one speaker, one or two sentences, English/Chinese/Japanese)

**Not worth it -- use post-production audio instead:**
- Content going into a longer edit (you'll replace the audio anyway)
- Precise lip-sync required (Vidu's sync is scene-level, not frame-level)
- Multi-speaker dialogue (hard to control who says what)
- Specific music track needed (Vidu's BGM is auto-generated and non-controllable)
- Content in languages other than English, Chinese, or Japanese

**Cost comparison:**
- Vidu native audio: +$0.075/video
- ElevenLabs post-production voiceover: ~$0.03-0.10/clip (depending on length)
- Stock music + manual edit: ~$0.00 (if you have a library subscription) + labor time

For Atlas UX's pipeline: skip Vidu audio, use ElevenLabs in post. The quality control is better and the cost is comparable.

---

## 6. Anti-Patterns

### 6.1 Sora/Veo Prompts That Fail on Vidu

Sora and Veo use OpenAI/Google's language models as prompt interpreters, which understand narrative and poetic prompts. Vidu's prompt processing is more literal.

**Fails on Vidu:**
```
"A nostalgic memory of childhood summers, the kind where time moved slowly and
the world felt infinite, rendered in the amber tones of a Super 8 film."
```
**Why:** Too abstract. Vidu needs concrete visual direction, not emotional narrative.

**Works on Vidu:**
```
"Wide shot of a child running through a wheat field in golden afternoon light.
Camera follows at knee height, handheld Super 8 aesthetic. Amber color grading,
film grain, slight vignette. Slow motion feel."
```

**Fails on Vidu:**
```
"Show me what it feels like to fall in love for the first time."
```
**Why:** Vidu cannot interpret emotional abstractions into visual scenes.

**Works on Vidu:**
```
"Close-up of two hands slowly reaching toward each other across a cafe table.
Soft focus background. Warm lamplight. Shallow depth of field. Their fingers
gently touch. Camera pushes in slowly."
```

### 6.2 Start-End Frame Pairs That Confuse the Model

| Problem Pair | Why It Fails | Fix |
|-------------|-------------|-----|
| Close-up face → Wide landscape | No visual continuity for interpolation | Use a zoom-out as intermediate, or match framing |
| Day scene → Night scene | Lighting interpolation creates strobing | Limit to golden-hour transitions or use 16s duration |
| Subject facing left → Subject facing right | 180-degree rotation in 4s is too fast | Extend to 8s+ or use only a 45-degree change |
| Indoor → Outdoor (different location) | Location jump has no plausible transition | Use a door/window as a visual bridge element |
| Different subjects in start vs end | Model tries to morph between subjects | Same subject in both frames, always |
| Different aspect ratios | Cropping artifacts | Match aspect ratios exactly |

### 6.3 Over-Describing Motion in Start-End Mode

**The #1 S2V mistake:** Telling the model every moment of the transition when it can already see the start and end states.

**Over-described (bad):**
```
"The woman raises her right hand from her side, extends her arm upward at a
45-degree angle, opens her fingers, reaches toward the shelf, grasps the book
with her thumb and index finger, pulls the book toward her, brings it down to
chest level, and looks at the cover."
```

**Correctly described (good):**
```
"She reaches up and takes the book from the shelf, natural and unhurried.
Camera holds steady on a medium shot."
```

The model interpolates biomechanics from the start/end frames. Your job is to describe the *quality* of the motion (smooth, quick, hesitant, natural), not the *mechanics*.

### 6.4 Resolution Mismatches

| Mismatch | Symptom | Prevention |
|----------|---------|------------|
| 4K reference image → 540P output | Model downscales reference, loses fine detail that informed the generation | Resize reference to ~1024px before submission |
| 360P reference → 1080P output | Upscaling artifacts, soft/blurry subject | Use references at 720P minimum |
| 16:9 reference → model default aspect | Cropping or letterboxing in output | Match reference aspect ratio to output setting |
| Portrait reference → landscape output | Subject gets cropped or padded awkwardly | Rotate/crop reference to match output orientation |

### 6.5 Paying for Q3 When Q2 Would Produce Identical Results

**You don't need Q3 when:**
- The clip has no audio requirement (Q2 is silent-video-only and much cheaper)
- The clip is under 8 seconds (Q2 supports 8s max, which covers most use cases)
- The clip is a simple camera move on a static or near-static subject
- You're doing start-end treatments (both Q2 and Q3 support S2V)
- You're doing reference-to-video with brand consistency (Q2-pro is purpose-built for this)

**You need Q3 when:**
- Native audio is required (dialogue, SFX, BGM)
- Duration exceeds 8 seconds (Q3 goes to 16s)
- You need smart shot switching (multi-beat scene with implicit cuts)
- Text-in-frame rendering is needed
- The prompt has audio direction that should influence the visual generation

**Cost impact of wrong tier selection:**

| Scenario (8s, 720P, off-peak) | Q2-pro-fast | Q3-turbo | Overpay |
|-------------------------------|-------------|----------|---------|
| Silent product rotation | $0.055 | $0.24 | 4.4x overpay |
| Start-end treatment | $0.055 | $0.24 | 4.4x overpay |
| Simple character animation | $0.055 | $0.24 | 4.4x overpay |
| Talking head with dialogue | N/A (no audio) | $0.24 | Q3 required |

At 100 videos/month, choosing Q3-turbo instead of Q2-pro-fast for silent clips wastes $18.50/month. Not catastrophic, but it adds up.

### 6.6 Common Prompt Mistakes by Category

**Over-prompting:**
- Adding "8K, ultra HD, masterpiece, best quality" -- these are image-gen modifiers that video models largely ignore
- Describing 10+ actions in a single clip -- the model picks 2-3 and drops the rest
- Specifying exact timing ("at 3.5 seconds the camera pans left") -- Vidu doesn't parse timestamps

**Under-prompting:**
- "A person walking" -- no style, no camera, no environment, no mood
- Relying entirely on reference images with an empty/minimal prompt -- the model needs motion and camera direction even with refs

**Conflicting prompts:**
- "Static locked-off shot" + "dynamic camera movement" -- pick one
- "Minimalist clean aesthetic" + "busy crowded market" -- style and subject conflict
- "Slow, contemplative pace" + `motion_intensity: large` -- text and parameter conflict
- "Photorealistic" in anime mode -- fights the model's training

---

## Appendix A: Quick Reference — Camera Movement Keywords

| Keyword | Vidu Interpretation |
|---------|-------------------|
| Push-in / dolly in | Camera moves toward subject |
| Pull-out / dolly out | Camera moves away from subject |
| Pan left / pan right | Camera rotates horizontally on axis |
| Tilt up / tilt down | Camera rotates vertically on axis |
| Crane up / crane down | Camera physically rises or lowers |
| Orbit / arc | Camera circles around subject |
| Tracking shot | Camera follows subject laterally |
| Steadicam | Smooth following shot, slight organic float |
| Handheld | Subtle shake, documentary feel |
| Whip pan | Fast horizontal pan (use with caution -- can blur) |
| Rack focus | Focus shifts between foreground and background |
| Dutch angle | Camera tilted on roll axis |
| Locked-off / static | No camera movement |
| Zoom in / zoom out | Lens zoom (different from dolly -- perspective stays flat) |

## Appendix B: Quick Reference — Style Keywords

| Keyword | Effect |
|---------|--------|
| Cinematic | Film-grade color, shallow DOF, dramatic lighting |
| Documentary | Natural light, handheld, observational |
| Commercial | Clean, bright, product-focused |
| Film noir | High contrast, shadows, monochrome tendency |
| Golden hour | Warm backlight, lens flare |
| Overcast | Even diffused light, soft shadows |
| Neon-lit | Saturated urban lighting, reflections |
| Film grain | Analog texture overlay |
| Anamorphic | Horizontal lens flare, oval bokeh, wide aspect feel |
| Vintage | Desaturated, warm shift, soft focus |
| High key | Bright, minimal shadows, clean |
| Low key | Dark, dramatic shadows, moody |
| Macro | Extreme close-up, shallow DOF |

## Appendix C: Quick Reference — Motion Intensity Guide

| Setting | Use When |
|---------|----------|
| `auto` | Default. Let the model read your prompt and decide. Good for most cases. |
| `small` | Portraits, talking heads, subtle animations, product close-ups. Prevents artifacts from excessive movement. |
| `medium` | Walking, gesturing, moderate camera moves, product rotations. Standard for most content. |
| `large` | Action scenes, fast camera moves, dynamic reveals. Risk of artifacts increases significantly. |

## Appendix D: Cost Decision Matrix

| Monthly Volume | Priority | Recommended Default | Monthly Cost |
|---------------|----------|-------------------|-------------|
| 10 videos | Quality | Q3-pro 1080P off-peak | $6.40 |
| 50 videos | Balance | Q2-pro-fast 720P off-peak | $2.75 |
| 100 videos | Volume | Q2-pro-fast 720P off-peak | $5.50 |
| 500 videos | Budget | Q2-turbo 540P off-peak | $25.00 |
| 1000 videos | Scale | Q2-turbo 540P off-peak | $50.00 |

---

## Sources

- [Vidu Official Platform](https://www.vidu.com/)
- [Vidu API Documentation](https://platform.vidu.com/)
- [Vidu Prompt Recommendation API](https://docs.platform.vidu.com/334419014e0)
- [Vidu Q1 Anime Guide](https://www.vidu.com/blog/vidu-q1-ai-2d-anime-guide)
- [Vidu Multi-Reference Character Animation](https://www.vidu.com/blog/create-ai-animation-3-characters-1-scene-vidu-multi-reference)
- [Vidu Q3 Cinematic Guide (Flux AI)](https://flux-ai.io/blog/detail/Vidu-Q3-on-Flux-AI-A-Practical-Guide-to-Better-AI-Videos-Fast-Cinematic-552c2c3d0e6f/)
- [Vidu Q2 Tips & Tricks (Civitai)](https://civitai.com/articles/19971/high-effort-video-creation-tips-and-tricks-vidu-q2)
- [Vidu Q2 Pro + Q3 Tips (Civitai)](https://civitai.com/articles/25432/updates-tips-vidu-q2pro-and-q3)
- [Vidu AI Prompt Engineering Guide](https://vidu-ai.net/prompt-engineering/)
- [Vidu Models: The Essentials (Scenario)](https://help.scenario.com/en/articles/vidu-models-the-essentials/)
- [Vidu Q3 vs Sora 2 vs Competitors (WaveSpeedAI)](https://wavespeed.ai/blog/posts/vidu-q3-review-comparison-sora-2-veo-3-seedance-wan-grok-2026/)
- [Vidu vs Sora Comparison (SelectHub)](https://www.selecthub.com/ai-video-generator-software/sora-vs-vidu-ai/)
- [Vidu Q2 Overview (DeeVid)](https://deevid.ai/blog/vidu-q2-overview)
- [Civitai Video Gen Prompting Guide](https://education.civitai.com/civitais-guide-to-video-gen-prompting/)
- [AI Video Models Comparison 2026 (OpenCreator)](https://opencreator.io/blog/ai-video-models-comparison-2026)
- [WaveSpeedAI Vidu API Docs](https://wavespeed.ai/docs/docs-api/vidu/)
- [Runware Vidu Docs](https://runware.ai/docs/en/providers/vidu)


---
## Media

### Platform References
- **vidu**: [Docs](https://www.vidu.studio) · [Gallery](https://www.vidu.studio/explore)
- **wan**: [Docs](https://github.com/Wan-Video/Wan2.1) · [Gallery](https://wan-video.github.io)

### Related Videos
- [Vidu AI Video Generator Tutorial](https://www.youtube.com/results?search_query=vidu+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `vidu`
- [Vidu - Fast AI Video Generation Review](https://www.youtube.com/results?search_query=vidu+ai+fast+video+generation+review) — *Credit: AI Reviews on YouTube* `vidu`
- [Wan 2.1 Video Generation - Self-Hosted Tutorial](https://www.youtube.com/results?search_query=wan+2.1+video+generation+self+hosted+tutorial) — *Credit: AI Self-Hosted on YouTube* `wan`
- [Wan VACE - Video Editing with AI](https://www.youtube.com/results?search_query=wan+vace+video+editing+ai+tutorial) — *Credit: AI Video on YouTube* `wan`

> *All video content is credited to original creators. Links direct to source platforms.*
