# AI Video Prompt Engineering Guide
**For Atlas UX Agents: Venny & Victor**
**Version:** 1.0 | **Last Updated:** 2026-03-18

> This guide teaches you how to write prompts that make AI video models produce exactly what you envision. No filmmaking degree required. Every concept is explained in plain English with examples you can copy, customize, and use immediately.

---

## Table of Contents

1. [Universal Prompt Anatomy](#1-universal-prompt-anatomy)
2. [Platform-Specific Syntax](#2-platform-specific-syntax)
3. [Camera Motion Dictionary](#3-camera-motion-dictionary)
4. [Style & Mood Keywords](#4-style--mood-keywords)
5. [Common Mistakes & Fixes](#5-common-mistakes--fixes)
6. [Prompt Templates](#6-prompt-templates)
7. [Side-by-Side Input to Output Descriptions](#7-side-by-side-input--output-descriptions)

---

## How Video Prompts Differ from Image Prompts

Before diving in, understand this: **video prompts are fundamentally different from image prompts.** An image prompt describes a single frozen moment. A video prompt describes a world that moves through time.

| Dimension | Image Prompt | Video Prompt |
|-----------|-------------|--------------|
| Time | Single frame | 4-15 seconds of motion |
| Motion | Not applicable | Critical -- must describe how things move |
| Camera | Fixed angle | Camera can move, zoom, track, orbit |
| Audio | None | Dialogue, music, sound effects, ambience |
| Sequence | One composition | Actions unfold in beats (first this, then that) |
| Thinking style | "Photographer" | "Film director" |

**The key mindset shift:** Think of yourself as briefing a cinematographer who has never seen your storyboard. If you leave out details, they will improvise -- and you may not get what you envisioned.

---

## 1. Universal Prompt Anatomy

Every effective video prompt has up to seven building blocks. You do not need all seven every time, but knowing each one gives you full control. Think of them as knobs on a mixing board -- the more knobs you turn, the more precise your output.

### 1.1 Subject -- Who or What Is in the Frame

**What it means:** The person, animal, object, or thing that the viewer's eye focuses on. You need to describe what they look like in enough detail that a stranger could pick them out of a crowd.

**What to include:** Age, build, skin tone, hair color/style, clothing, facial expression, posture, distinguishing features, emotional state.

#### Bad, Okay, and Great Examples

| Quality | Prompt Fragment | Why |
|---------|----------------|-----|
| Bad | "a man" | No details. The model will invent everything -- and probably not what you wanted. |
| Okay | "a young man in a blue jacket" | Better. But which blue? What kind of jacket? What does he look like? |
| Great | "A man in his late 20s with short-cropped dark hair and stubble, wearing a faded cobalt-blue denim jacket over a white t-shirt, looking slightly anxious, shoulders tense" | Now the model knows exactly who to render. Specific colors, specific emotions, specific posture. |

#### Common Beginner Mistakes
- **Being too vague:** "A person" forces the model to guess age, gender, clothing, everything. You get random results.
- **Forgetting expression/emotion:** A face without a described emotion looks blank or uncanny.
- **Using celebrity names:** Most models block or poorly handle celebrity likenesses. Describe the look you want instead.
- **Overloading with 30+ attributes:** Aim for 10-15 key physical details. Too many competing descriptions can conflict.

---

### 1.2 Context / Setting -- Where It Happens

**What it means:** The environment, location, time of day, weather, and lighting that surround your subject. This sets the mood before anything moves.

**What to include:** Indoor/outdoor, specific location type, time of day, weather conditions, lighting direction and quality, key props or background elements, architectural details.

#### Bad, Okay, and Great Examples

| Quality | Prompt Fragment | Why |
|---------|----------------|-----|
| Bad | "in a room" | Which room? A hospital? A castle? A closet? |
| Okay | "in a modern kitchen during the morning" | Better. We know it is a kitchen and it is daytime. |
| Great | "in a sunlit modern kitchen with white marble countertops, copper pendant lights overhead, morning light streaming through floor-to-ceiling windows, a steaming mug of coffee on the counter" | The model now sees the space: materials, light direction, props, atmosphere. |

#### Common Beginner Mistakes
- **Forgetting lighting:** Lighting is the single biggest factor in how a shot "feels." Always specify.
- **Conflicting details:** "A sunny rainy night" confuses the model. Pick one condition.
- **No sense of depth:** Mention foreground and background elements to give the scene dimension.
- **Generic locations:** "A city" is too broad. "A narrow Tokyo alley with neon signs reflecting on wet pavement" paints a picture.

---

### 1.3 Action -- What Happens

**What it means:** The movement, behavior, interaction, or sequence of events that unfold during the video. This is what makes video different from a photo.

**What to include:** Specific action verbs, sequence of movements (first... then...), speed/pacing, physical interactions between subjects, micro-expressions and gestures.

#### Bad, Okay, and Great Examples

| Quality | Prompt Fragment | Why |
|---------|----------------|-----|
| Bad | "the person moves" | "Moves" how? Walking? Dancing? Falling? Waving? |
| Okay | "the woman walks through the market" | We know the action, but not the speed, style, or what happens. |
| Great | "The woman strolls slowly through the bustling market, pausing to pick up a ripe peach, examining it closely, then placing it gently in her basket with a satisfied smile" | Sequential beats: strolls, pauses, picks up, examines, places. The model has a mini storyboard. |

**Power tip:** Use specific action verbs. These give the model much better results:

| Instead of... | Try... |
|--------------|--------|
| "moving" | sprinting, strolling, tiptoeing, lunging, gliding |
| "looking" | glaring, squinting, gazing, peeking, scanning |
| "talking" | whispering, shouting, murmuring, stammering, declaring |
| "going" | dashing, sauntering, creeping, bounding, striding |

#### Common Beginner Mistakes
- **Too many actions for the duration:** An 8-second clip can hold 2-3 actions max. Do not write a full scene.
- **Physically impossible sequences:** "She backflips onto the roof, catches a bird, and lands on a horse" will produce chaos.
- **No pacing cues:** Add words like "slowly," "suddenly," "gradually" to control timing.
- **Forgetting micro-expressions:** Small details like "raises an eyebrow" or "bites her lower lip" add realism.

---

### 1.4 Style -- How It Looks

**What it means:** The visual aesthetic, genre, and overall "feel" of the video. This is like choosing a filter, but much more powerful.

**What to include:** Visual genre (cinematic, documentary, commercial, social media), color palette, film stock or grain, aspect ratio, quality keywords, artistic references (director styles, film comparisons).

#### Bad, Okay, and Great Examples

| Quality | Prompt Fragment | Why |
|---------|----------------|-----|
| Bad | "make it look cool" | "Cool" means nothing to a model. It cannot interpret subjective taste. |
| Okay | "cinematic style, 4K" | A start. But cinematic covers everything from Marvel to Terrence Malick. |
| Great | "Shot on Kodak Vision3 500T film stock, warm amber highlights with teal shadows, shallow depth of field, cinematic color grading, 16:9, anamorphic lens flares" | The model now knows the exact look: film stock, color palette, depth, format, lens character. |

#### Common Beginner Mistakes
- **Only saying "cinematic":** This is the most overused and least specific style keyword. Add what kind of cinematic.
- **Ignoring aspect ratio:** 16:9 for widescreen, 9:16 for vertical/social, 1:1 for square. Wrong ratio wastes the frame.
- **Mixing conflicting styles:** "Documentary style with CGI explosions" pulls the model in two directions.
- **Forgetting color:** Color palette is half the mood. "Desaturated earth tones" vs. "vibrant neon colors" produce completely different videos.

---

### 1.5 Camera -- How the Camera Moves

**What it means:** The virtual camera's position, angle, movement, and lens choice. This is the single most underused element by beginners, and the one that makes the biggest difference.

**What to include:** Shot type (wide, medium, close-up), camera angle (low, high, eye-level), camera movement (dolly, pan, tracking, orbit), lens (wide-angle, telephoto, macro), depth of field (shallow/deep).

#### Bad, Okay, and Great Examples

| Quality | Prompt Fragment | Why |
|---------|----------------|-----|
| Bad | (no camera direction at all) | The model picks a random angle and keeps the camera static. Boring. |
| Okay | "close-up shot" | We know the framing but not the movement or lens. |
| Great | "A low-angle tracking shot, 35mm lens, shallow depth of field, camera slowly pushing in from medium shot to close-up as the subject turns toward camera" | Full camera direction: angle, lens, depth, movement, and how the framing changes over time. |

**Why camera matters so much:** A static wide shot of someone cooking feels like a security camera. A slow dolly-in to a close-up of their hands feels like a cooking show. Same subject, same action -- completely different result.

#### Common Beginner Mistakes
- **No camera direction at all:** This is the most common mistake. Always specify at least shot type and one movement.
- **Contradictory movements:** "Pan left while tracking right" confuses the model.
- **Too many camera moves:** Pick one primary movement per clip. One dolly-in or one orbit -- not both.
- **Ignoring depth of field:** "Shallow depth of field" (blurry background) is what makes footage look "professional."

See [Section 3: Camera Motion Dictionary](#3-camera-motion-dictionary) for the full reference table.

---

### 1.6 Audio -- What You Hear (Where Supported)

**What it means:** The sounds, music, dialogue, and ambient noise in the video. Not all models support audio generation, but Sora 2, Veo 3, and Kling 3.0 all do.

**What to include:** Dialogue lines (with speaker labels and tone), sound effects (specific and spatial), ambient/environmental sounds, music (mood, instrument, tempo), silence or quiet moments.

#### Bad, Okay, and Great Examples

| Quality | Prompt Fragment | Why |
|---------|----------------|-----|
| Bad | (no audio direction) | The model may generate random sounds or silence. |
| Okay | "with background music" | What kind? Sad piano? Upbeat electronic? Epic orchestral? |
| Great | "The sharp crack of an espresso machine, the gentle hiss of steaming milk, a soft jazz piano playing in the background. The barista says in a warm tone: 'Here you go, made with love.'" | Layered audio: foreground SFX, background music, specific dialogue with emotional delivery. |

**Audio layering structure:**
1. **Foreground sounds** -- the main action sounds (footsteps, typing, pouring)
2. **Background ambience** -- environment sounds (traffic, birds, rain, crowd murmur)
3. **Music** -- mood/score (describe genre, instrument, energy level)
4. **Dialogue** -- spoken lines (with character name, tone, delivery style)

#### Common Beginner Mistakes
- **Ignoring audio entirely:** Even adding "ambient city sounds" dramatically improves realism.
- **Too much dialogue for the duration:** An 8-second clip can hold about 15-20 spoken words max.
- **Not specifying tone of voice:** "She says 'I'm fine'" vs. "She says with barely contained frustration: 'I'm fine'" produce very different results.
- **Forgetting spatial audio cues:** "Distant thunder" vs. "thunder directly overhead" creates different spatial depth.

---

### 1.7 Negative Prompt -- What to Avoid

**What it means:** A list of things you explicitly do not want in the video. Not all platforms support a separate negative prompt field, but those that do (especially Wan 2.1 and Kling 3.0) benefit enormously from them.

**What to include:** Quality issues (blur, noise, artifacts), unwanted elements (watermarks, text, subtitles), physical errors (extra fingers, morphing, distortion), style conflicts (things that clash with your intended look).

#### Bad, Okay, and Great Examples

| Quality | Negative Prompt | Why |
|---------|----------------|-----|
| Bad | (no negative prompt) | You get whatever the model defaults to, including common artifacts. |
| Okay | "no watermarks" | Addresses one issue but misses dozens of other common problems. |
| Great | "No watermarks, no text overlays, no subtitles, no morphing, no extra fingers, no blurred details, no overexposure, no static frames, no abrupt cuts, low quality, JPEG artifacts, deformed faces, misshapen limbs" | Comprehensive suppression of all common AI video artifacts. |

**Starter negative prompt template (copy and customize):**
```
Watermarks, text overlays, subtitles, captions, blurred details, overexposed,
static, low quality, JPEG artifacts, ugly, deformed, extra fingers, poorly drawn
hands, poorly drawn faces, disfigured, misshapen limbs, fused fingers, morphing,
distortion, abrupt scene changes, messy background
```

#### Common Beginner Mistakes
- **Putting negative instructions in the main prompt:** Saying "don't add watermarks" in the main prompt can sometimes cause the model to add them. Use the dedicated negative prompt field instead.
- **Being too aggressive:** An extremely long negative prompt can overconstrain the model and produce flat, lifeless output.
- **Platform confusion:** Sora 2 and Veo 3 handle negatives differently than Wan 2.1. See Section 2 for platform-specific guidance.

---

## 2. Platform-Specific Syntax

The same creative idea needs different prompting styles for each AI video model. Below, we show how to write the **same concept** optimized for each platform.

### Key Platform Differences at a Glance

| Feature | Sora 2 Pro | Veo 3 | Kling 3.0 | Wan 2.1 |
|---------|-----------|-------|-----------|---------|
| **Prompt style** | Storyboard narrative | 7-component structure | Scene-first cinematic | Structured sections |
| **Ideal length** | 80-150 words | 100-200 words | 60-120 words | 80-120 words |
| **Dialogue format** | [Dialogue] block | Colon syntax inline | Natural inline | Not natively supported |
| **Audio support** | Yes (synchronized) | Yes (native lip-sync) | Yes (beat markers) | Limited |
| **Negative prompts** | In main prompt or API | negativePrompt parameter | Separate field | Separate field (critical) |
| **Unique strength** | World simulation, physics | Lip-sync dialogue, 4K | Motion consistency, multi-shot | Text rendering, open-source |
| **Sweet spot duration** | 4s clips, stitch together | 8 seconds | 5-10 seconds | ~5 seconds (81 frames) |
| **Camera understanding** | Professional film terms | Professional film terms | Cinematic intent | Standard terms |

---

### Example A: "A barista making latte art"

#### Sora 2 Pro Version
Think of Sora as a "world simulator." Describe the physical world, materials, and cause-and-effect.
```
[Camera Setup] Close-up tracking shot, 85mm lens, f/2.0, shallow depth of field,
camera slowly pushes in from medium close-up to extreme close-up.

[Subject & Action] A barista in her 30s with tattooed forearms and a black apron
tilts a stainless steel pitcher, pouring steamed milk into a ceramic latte cup.
The milk flows in a thin stream, then she flicks her wrist to create a fern-leaf
pattern. Micro-foam spreads symmetrically across the dark espresso surface.

[Lighting & Style] Warm overhead pendant lights cast golden pools on the wooden
counter. Shot on Kodak Vision3 250D. Warm tones, coffee-shop intimacy.

[Audio] The gentle hiss of the steam wand fading, milk pouring into the cup,
soft indie acoustic guitar in the background.
```

#### Veo 3 Version
Veo uses a 7-component structure. Dialogue uses colon syntax with natural lip-sync.
```
A woman barista in her early 30s with dark hair pulled back, sleeve tattoos on both
forearms, wearing a black canvas apron over a gray henley, stands behind a polished
wood espresso bar. She carefully tilts a steel milk pitcher, pouring a steady stream
of steamed milk into a wide ceramic cup, wrist rotating to draw a fern-leaf pattern
in the foam. Warm pendant lights cast amber pools across the counter. Modern coffee
shop with exposed brick walls, potted succulents on shelves.

Camera: Close-up, slow push-in, 85mm, shallow depth of field. 16:9.

She glances up and says with a quiet smile: "This one's my favorite -- the rosetta."

Audio: Gentle milk pouring, espresso machine humming softly in background, mellow
lo-fi beat.

No watermarks, no text overlays, no subtitles.
```

#### Kling 3.0 Version
Kling follows Scene, Characters, Action, Camera, Audio. Write with cinematic intent -- focus on the "why" of the camera move.
```
A cozy modern coffee shop with warm overhead lighting and an exposed brick wall.
A female barista in her 30s with tattooed arms and a black apron stands behind a
wooden counter. She slowly tilts a steel milk pitcher, pouring steamed milk into
a ceramic cup, flicking her wrist to create a fern-leaf latte art pattern.
Camera slowly dollies in from a medium shot to an extreme close-up of the cup,
revealing the pattern forming in real-time. Warm ambient lighting, shallow depth
of field. Sound of milk pouring, gentle coffee shop ambience.
```

**Negative prompt:**
```
No text overlays, no watermarks, no morphing, no distortion, no rapid camera shaking
```

#### Wan 2.1 Version
Wan uses structured sections and relies heavily on negative prompts to suppress artifacts.
```
A female barista with dark hair and tattooed forearms wearing a black apron pours
steamed milk from a steel pitcher into a ceramic latte cup on a wooden counter.
She tilts the pitcher with practiced precision, creating a fern-leaf pattern in
the foam. The camera slowly dollies in from a medium close-up to an extreme
close-up of the cup. Warm pendant lighting casts golden highlights on the counter.
Modern coffee shop interior with exposed brick. Cinematic quality, shallow depth
of field, warm color grading, 4K resolution.
```

**Negative prompt (critical for Wan):**
```
Blurred details, overexposed, static, low quality, JPEG artifacts, ugly, deformed,
extra fingers, poorly drawn hands, disfigured, morphing, watermarks, text overlays,
subtitles, messy background
```

---

### Example B: "Product showcase on rotating pedestal"

#### Sora 2 Pro Version
```
[Camera Setup] Slow 360-degree orbit shot at eye level, 50mm lens, f/4.0,
8-second duration.

[Subject & Action] A matte-black wireless headphone sits on a white cylindrical
pedestal rotating counter-clockwise. As the pedestal turns, studio lighting
reveals different angles -- the cushioned ear cups, the brushed metal headband,
the discreet logo. Subtle light reflections glide across the surface.

[Lighting & Style] Three-point studio lighting: key light from camera-left
(soft box), rim light from behind (cool white), fill from camera-right (subtle).
Black void background. Clean, premium product photography aesthetic.

[Audio] A deep cinematic bass hit on the first frame, followed by a minimal
ambient synth pad. Crisp, modern, luxurious.
```

#### Veo 3 Version
```
A pair of matte-black wireless headphones rests on a slowly rotating white
cylindrical pedestal against a pure black studio background. Three-point lighting:
soft key light from the left revealing surface texture, cool rim light from behind
creating edge definition, subtle fill from the right. As the pedestal rotates
counter-clockwise over 8 seconds, different design details catch the light --
cushioned ear cups, brushed aluminum headband, embossed logo.

Camera: Static eye-level, 50mm, the pedestal rotation provides the movement. 16:9.

Voice-over in a confident, measured tone: "Engineered for silence. Designed for you."

Audio: Deep bass hit transitioning to minimal ambient synth. Clean studio silence
between notes.

No text, no watermarks, no captions, no subtitles.
```

#### Kling 3.0 Version
```
A dark studio with a pure black background. A pair of matte-black wireless
headphones sits centered on a white rotating pedestal. Soft-box key light from
the left, cool rim light from behind, subtle fill from the right. The pedestal
rotates slowly counter-clockwise, revealing the headphones from every angle --
ear cups, headband, logo details. Light reflections glide smoothly across the
matte surface. Camera holds static at eye level. Premium product photography
aesthetic, clean and minimal. Deep cinematic bass hit with ambient synth pad.
```

**Negative prompt:**
```
No text, no watermarks, no rapid movement, no morphing, no distortion, no
color banding
```

#### Wan 2.1 Version
```
A pair of matte-black wireless headphones on a white cylindrical pedestal rotating
slowly counter-clockwise against a pure black studio background. Three-point
studio lighting reveals surface details as the pedestal turns -- cushioned ear cups,
brushed metal headband, embossed logo. Light reflections glide across the matte
surface. Static camera at eye level, 50mm lens. Premium product photography,
clean minimal aesthetic, shallow depth of field, 4K resolution, professional
color grading.
```

**Negative prompt:**
```
Bright tones, overexposed, static, blurred details, low quality, JPEG artifacts,
morphing, distortion, watermarks, text overlays, messy background, color banding,
flickering
```

---

### Example C: "Person speaking to camera (talking head)"

This is the example where platform differences matter most, because dialogue handling varies dramatically.

#### Sora 2 Pro Version
Sora uses a labeled [Dialogue] block separated from the visual description.
```
[Camera Setup] Medium shot, eye-level, 50mm lens, f/2.8, shallow depth of field,
static camera with subtle handheld micro-movements.

[Subject & Action] A confident woman in her 40s with shoulder-length auburn hair
and glasses, wearing a navy blazer over a white top, sits at a modern desk. She
looks directly into the camera, gestures naturally with her right hand while
speaking, and occasionally glances down at notes before looking back up.

[Lighting & Style] Soft key light from camera-left, warm-toned. Blurred home
office background with bookshelves and a plant. Clean, professional, YouTube-style
talking head. Natural color grading.

[Dialogue]
Speaker: "Here's the thing nobody tells you about starting a business --
the hardest part isn't the product. It's showing up every single day."

[Audio] Subtle room tone, no music.
```

#### Veo 3 Version
Veo 3 has the best dialogue handling. Use colon syntax inline for natural lip-sync.
```
A confident woman in her early 40s with shoulder-length auburn hair and tortoiseshell
glasses, wearing a navy blazer over a white blouse, sits at a clean modern desk.
She faces the camera directly, gesturing naturally with her right hand. Soft key
light from the left creates warm highlights on her face. Blurred home office
background with bookshelves and a potted monstera plant.

Camera: Medium shot, 50mm, eye-level, static with subtle handheld sway. 16:9.

She speaks directly to camera with warm confidence: "Here's the thing nobody tells
you about starting a business -- the hardest part isn't the product. It's showing
up every single day."

Audio: Quiet room tone, no background music.

No subtitles, no text overlays, no watermarks, no captions.
```

**Why Veo wins for talking heads:** Veo 3's native lip-sync technology produces the most natural-looking speech synchronization. The colon syntax ("She says: ...") triggers their lip-sync engine directly.

#### Kling 3.0 Version
```
A bright, modern home office with bookshelves and a potted plant in the soft-focus
background. A woman in her 40s with auburn shoulder-length hair and glasses, wearing
a navy blazer, sits at a desk facing the camera. She speaks directly to camera,
gesturing naturally with her right hand, occasionally glancing at notes. Soft key
light from the left, warm tones. Camera holds a static medium shot at eye level
with subtle handheld micro-movements. Professional talking-head format, natural
color grading. Quiet room ambience.
```

**Negative prompt:**
```
No text overlays, no watermarks, no morphing faces, no distortion, no rapid
camera movement, no uncanny valley expressions
```

#### Wan 2.1 Version
Wan has limited dialogue support, so this prompt focuses on the visual performance.
```
A woman in her early 40s with shoulder-length auburn hair and tortoiseshell glasses,
wearing a navy blazer over a white top, sits at a modern desk facing the camera.
She speaks animatedly, gesturing with her right hand, nodding slightly, expressing
confidence and warmth. Soft key light from the left illuminates her face. Blurred
home office background with bookshelves and a green plant. Static medium shot at
eye level, 50mm lens, shallow depth of field. Professional, natural color grading,
clean talking-head format, 4K resolution.
```

**Negative prompt:**
```
Blurred face, static expression, deformed, disfigured, extra fingers, low quality,
JPEG artifacts, morphing, watermarks, subtitles, text overlays, uncanny valley,
poorly drawn face, overexposed
```

**Note:** For talking heads with actual speech, use Veo 3 or Sora 2. Wan 2.1 will animate the mouth but cannot sync to specific dialogue.

---

## 3. Camera Motion Dictionary

This is your reference sheet. Bookmark it. Every time you write a prompt, pick at least one camera movement from this table.

### Shot Types (How Close the Camera Is)

| Shot Type | Abbreviation | What You See | When to Use | Example Prompt Fragment |
|-----------|-------------|-------------|-------------|------------------------|
| Extreme Wide Shot | EWS | Vast landscape, subject is tiny | Establishing location, showing scale | "Extreme wide shot of a lone figure walking across a snow-covered mountain ridge" |
| Wide Shot | WS | Full environment with subject visible | Setting the scene, showing context | "Wide shot of a bustling farmers market on a sunny morning" |
| Medium Shot | MS | Subject from waist up | Conversations, presentations, general action | "Medium shot of a chef preparing ingredients at a kitchen counter" |
| Medium Close-Up | MCU | Subject from chest up | Interviews, emotional moments | "Medium close-up of a woman reading a letter, her expression shifting from curiosity to surprise" |
| Close-Up | CU | Face or single object fills the frame | Emotion, detail, emphasis | "Close-up of weathered hands carefully threading a needle" |
| Extreme Close-Up | ECU | One feature fills the entire frame | Dramatic emphasis, tiny details | "Extreme close-up of an eye reflecting a flickering candle flame" |
| Over-the-Shoulder | OTS | From behind one person looking at another | Dialogue scenes, interviews | "Over-the-shoulder shot of two colleagues in conversation at a conference table" |
| Point of View | POV | Camera shows what the character sees | Immersion, subjective experience | "POV shot of hands opening a mysterious wooden box, revealing golden light inside" |

### Camera Angles (Where the Camera Is Positioned)

| Angle | What It Looks Like | Emotional Effect | Example Prompt Fragment |
|-------|-------------------|-----------------|------------------------|
| Eye Level | Camera at subject's eye height | Neutral, natural, relatable | "Eye-level shot of a teacher addressing the classroom" |
| Low Angle | Camera looks up at subject | Power, dominance, heroism | "Low-angle shot of a skyscraper towering against storm clouds" |
| High Angle | Camera looks down at subject | Vulnerability, smallness, overview | "High-angle shot looking down at a child playing alone in a vast playground" |
| Bird's Eye | Camera directly overhead | God-like perspective, patterns | "Bird's-eye view of cars flowing through a highway interchange at night, headlights forming rivers of light" |
| Worm's Eye | Camera at ground level looking up | Dramatic, imposing, unusual | "Worm's-eye view of a massive tree canopy, sunlight filtering through the leaves" |
| Dutch Angle | Camera tilted to one side | Tension, unease, disorientation | "Dutch angle of a detective walking down a dimly lit corridor, shadows stretching across the walls" |

### Camera Movements (How the Camera Moves)

| Movement | What Happens | Emotional Effect | When to Use | Example Prompt Fragment |
|----------|-------------|-----------------|-------------|------------------------|
| Static | Camera does not move at all | Stability, observation, documentary feel | Talking heads, product shots, when the subject provides the motion | "Static wide shot of rain falling on an empty parking lot" |
| Dolly In | Camera physically moves toward subject | Building intimacy, focus, tension | Revealing emotion, drawing viewer in | "Camera slowly dollies in from a wide shot to a close-up of her face as she reads the letter" |
| Dolly Out | Camera physically moves away from subject | Revealing context, isolation, ending | Showing environment, pulling back from a moment | "Camera dollies out from a close-up of a candle to reveal an entire cathedral lit by hundreds of candles" |
| Pan Left/Right | Camera rotates horizontally on its axis | Surveying, following action, revealing | Showing a landscape, following a walking subject | "Camera pans right to follow a cyclist riding along a coastal road" |
| Tilt Up/Down | Camera rotates vertically on its axis | Revealing height, showing scale | Looking up at a building, looking down from a cliff | "Camera tilts up from the base of a waterfall to its peak, mist catching the sunlight" |
| Tracking Shot | Camera moves alongside the subject | Energy, accompaniment, journey | Following someone walking, running, driving | "Tracking shot following a woman as she walks through a crowded Tokyo subway station" |
| Crane Shot | Camera moves vertically up or down | Grandeur, reveal, drama | Establishing shots, dramatic reveals | "Crane shot rising from street level up above the rooftops to reveal the city skyline at sunset" |
| Steadicam | Smooth, floating handheld movement | Immersion, following action, exploration | Following through spaces, dreamlike sequences | "Steadicam follows a waiter weaving through a busy restaurant, plates balanced on both arms" |
| Orbit / 360 | Camera circles around the subject | Emphasis, showcase, drama | Product shots, hero moments, revealing all sides | "Camera orbits slowly around the sculpture, revealing intricate details from every angle" |
| Zoom In | Lens zooms closer (no physical movement) | Sudden focus, surprise, emphasis | Quick emphasis, dramatic moment | "Slow zoom in on the detective's face as realization dawns" |
| Zoom Out | Lens zooms wider | Context reveal, surprise scale | Revealing something unexpected in the wider frame | "Zoom out to reveal the tiny house is actually a model on a table" |
| Rack Focus | Focus shifts from foreground to background (or vice versa) | Directing attention, connecting elements | Shifting viewer attention between two subjects | "Rack focus from a wedding ring on the table in the foreground to the couple embracing in the background" |
| Push In | Slow, subtle move toward subject | Gentle emphasis, building tension | Emotional moments, subtle emphasis | "Slow push-in on the musician's face as he plays the final note" |
| Pull Out / Reveal | Moving backward to show more of the scene | Surprise, context, scale | Reveals and surprises | "Camera pulls out from a close-up of an ant carrying a leaf to reveal the entire ant colony" |
| Whip Pan | Extremely fast horizontal pan | Energy, transition, surprise | Transitions between subjects, action scenes | "Whip pan from the pitcher's face to the batter at home plate" |
| Dolly Zoom (Vertigo) | Zoom in while dollying out (or vice versa) | Disorientation, realization, dread | Horror, thriller, moments of sudden understanding | "Dolly zoom on the character's face as the background stretches behind them" |
| Handheld | Camera shakes slightly, like held by a person | Immediacy, documentary, raw energy | News footage, action, found footage, intimate moments | "Handheld close-up following a street musician performing on a busy corner" |

**Pro tip:** Combine shot type + angle + movement for maximum control:
> "Low-angle medium shot, camera slowly tracking left alongside the boxer as he shadowboxes, shallow depth of field, 35mm lens"

---

## 4. Style & Mood Keywords

Use these keyword combinations to dial in the exact visual feel you want. Mix and match from different columns.

### Visual Genre Keywords

| Genre | Keywords to Include | Best For | Example |
|-------|-------------------|----------|---------|
| Cinematic | cinematic, widescreen, film grain, anamorphic, shallow DOF, color graded | Narrative films, trailers, dramatic content | "Cinematic wide shot, anamorphic lens flares, rich color grading, shallow depth of field" |
| Documentary | documentary style, natural lighting, handheld, observational, raw | Interviews, real-world footage, educational | "Documentary style, natural available light, handheld camera, observational framing" |
| Commercial | commercial quality, clean, polished, product-focused, studio lighting | Ads, product videos, brand content | "High-end commercial aesthetic, studio three-point lighting, clean background, polished" |
| Social Media | vertical video, UGC style, phone camera, casual, energetic | Reels, TikTok, Stories, short-form | "Vertical 9:16, phone-camera aesthetic, natural selfie lighting, casual and authentic" |
| Music Video | stylized, high contrast, slow motion, dramatic lighting, artistic | Performance, artistic expression | "Music video aesthetic, dramatic rim lighting, slow motion, high contrast, artistic color grading" |
| Corporate | professional, clean, well-lit, neutral tones, structured | Training, presentations, internal comms | "Corporate video style, even professional lighting, clean background, neutral color palette" |

### Mood & Atmosphere Keywords

| Mood | Keywords to Include | Color Palette | Example |
|------|-------------------|--------------|---------|
| Warm & Inviting | warm tones, golden light, cozy, amber highlights | Golds, ambers, soft oranges, cream | "Warm golden-hour lighting, amber highlights, cozy atmosphere, soft shadows" |
| Cold & Isolated | cool tones, blue shadows, stark, desaturated | Steel blues, grays, pale whites | "Cool desaturated tones, blue shadows, stark winter light, isolated atmosphere" |
| Moody & Dramatic | dramatic lighting, deep shadows, high contrast, chiaroscuro | Deep blacks, selective warm highlights | "Moody chiaroscuro lighting, deep shadows, high contrast, dramatic atmosphere" |
| High-Energy | vibrant, saturated, dynamic, punchy colors, fast-paced | Bold primaries, neons, high saturation | "Vibrant saturated colors, punchy contrast, high-energy visual style, dynamic" |
| Ethereal & Dreamy | soft focus, diffused light, pastel, hazy, gauzy | Pastels, soft lavenders, pale pinks, creams | "Soft diffused lighting, dreamy haze, pastel color palette, ethereal atmosphere" |
| Gritty & Raw | grain, high ISO, desaturated, handheld, unpolished | Muted browns, grays, washed-out tones | "Film grain, desaturated, handheld shake, gritty raw aesthetic, available light only" |
| Futuristic | neon, holographic, lens flares, clean surfaces, tech | Cyan, magenta, electric blue, chrome | "Futuristic neon lighting, holographic reflections, clean chrome surfaces, sci-fi aesthetic" |
| Nostalgic / Vintage | film stock, VHS, Super 8, faded colors, warm grain | Faded oranges, yellows, soft greens | "Shot on Super 8 film, warm grain, faded vintage colors, nostalgic soft focus" |

### Lighting Condition Keywords

| Lighting | Description | Visual Effect | Example |
|----------|------------|--------------|---------|
| Golden Hour | Sun within 30 min of sunset/sunrise | Warm, long shadows, flattering skin tones | "Golden hour lighting, sun low on the horizon, long warm shadows across the field" |
| Blue Hour | Twilight just after sunset or before sunrise | Cool, even, serene blue tones | "Blue hour, soft even twilight, cool blue tones across the cityscape" |
| Harsh Midday | Direct overhead sun | Strong shadows, high contrast, unflattering | "Harsh midday sun, deep shadows under the eyes, bleached highlights" |
| Neon Night | Artificial neon and LED city lights | Colorful reflections, urban energy | "Neon signs reflecting on wet pavement, colorful urban night lighting, rain-slicked streets" |
| Overcast / Diffused | Cloud cover acting as a giant softbox | Even, soft, no harsh shadows | "Overcast sky providing soft diffused light, even exposure, gentle shadows" |
| Backlit | Light source behind the subject | Silhouettes, rim light, halos | "Backlit by the setting sun, golden rim light outlining the subject, lens flare" |
| Rim / Edge Light | Light catching just the edges of the subject | Separation from background, drama | "Strong rim light from behind creating a glowing edge around the subject's silhouette" |
| Volumetric / God Rays | Visible beams of light through atmosphere | Atmosphere, depth, spirituality | "Volumetric light rays streaming through dusty warehouse windows" |

### Director / Film Style References

| Style Reference | What It Looks Like | Use When You Want |
|----------------|-------------------|-------------------|
| "Wes Anderson style" | Symmetrical framing, pastel palette, whimsical, centered composition | Quirky, charming, meticulously composed shots |
| "Christopher Nolan style" | IMAX-scale, practical effects, blue-gray palette, sweeping camera | Epic, grounded, large-scale dramatic scenes |
| "Wong Kar-wai style" | Saturated neons, step-printed motion, smeared light, romantic melancholy | Moody urban romance, nostalgic night scenes |
| "Film noir" | High contrast B&W, venetian blind shadows, fog, fedoras | Mystery, tension, classic detective aesthetic |
| "Terrence Malick style" | Magic hour, natural light, whispered VO, drifting camera | Poetic, contemplative, nature-heavy scenes |
| "David Fincher style" | Desaturated, precise framing, cold tones, controlled camera | Thriller, procedural, controlled tension |
| "Spike Jonze style" | Naturalistic, intimate, slightly off-beat, warm | Authentic human moments, gentle comedy |
| "Roger Deakins cinematography" | Motivated lighting, precise composition, painterly frames | Any scene where lighting is the star |

---

## 5. Common Mistakes & Fixes

These are the errors that waste the most generation credits. Learn them once, avoid them forever.

| # | Mistake | Why It Fails | Fix | Example |
|---|---------|-------------|-----|---------|
| 1 | **Too vague** ("a cool video of something interesting") | The model has no direction. It fills in every blank with random choices. | Be specific about subject, setting, action, and camera. Minimum 50 words. | Change "a cool video" to "A close-up of a golden retriever catching a frisbee in a sunny park, camera tracking from below, slow motion" |
| 2 | **Too long** (300+ words trying to describe a feature film) | The model loses focus. Later details get ignored or conflict with earlier ones. | Keep prompts between 80-200 words. One shot per prompt, 2-3 actions max. | Break a long scene into three 4-8 second clips and stitch them together. |
| 3 | **No camera direction** | The model defaults to a static wide shot -- the "security camera" look. | Always include at least shot type and one camera movement. | Add "medium close-up, camera slowly pushing in" to any prompt. |
| 4 | **Missing negative prompts** | Common artifacts appear: watermarks, extra fingers, morphing, blur. | Add a baseline negative prompt (see Section 1.7 for template). | Append negative prompt: "no watermarks, no morphing, no blurred faces, no text overlays" |
| 5 | **Wrong aspect ratio** | Vertical content rendered in 16:9 wastes frame space. Horizontal content in 9:16 cuts off the sides. | Match aspect ratio to platform: 16:9 for YouTube/desktop, 9:16 for Reels/TikTok/Stories, 1:1 for Instagram feed. | Specify "9:16 vertical format" for a social media short. |
| 6 | **Describing impossible physics** | "A cat flies through a brick wall and reassembles on the other side" produces visual chaos. | Keep physics plausible unless you are intentionally going surreal (and even then, describe the surreal mechanics). | Change to "A cat leaps through an open window" or explicitly say "surreal, dreamlike physics" if you want the impossible. |
| 7 | **Too many subjects** | Three or more people with individual descriptions overwhelm the model. Faces merge, bodies swap. | Focus on 1-2 subjects max. Describe others as "background crowd" or "blurred figures." | Change "John, Sarah, Mike, and Lisa each do different things" to "A woman in a red dress dances while blurred party guests move in the background." |
| 8 | **Using "don't" in the main prompt** | Some models interpret "don't show a dog" as "show a dog." Negation in natural language is unreliable. | Use the dedicated negative prompt field. Keep the main prompt purely about what you DO want. | Move "don't add text" from the main prompt to the negative prompt as "text overlays, captions, subtitles." |
| 9 | **No lighting description** | Output looks flat, overlit, or randomly lit. | Add time of day + light direction + light quality. Three words minimum: "golden hour backlight" or "soft overhead diffused." | Add "warm side-lighting from a window at golden hour" to any indoor scene. |
| 10 | **Copying someone else's prompt without understanding it** | What works for Sora may fail on Kling. Context, formatting, and emphasis differ per model. | Learn the platform syntax (Section 2) and adapt the prompt's structure, not just its words. | Translate a Veo 3 dialogue prompt to Sora 2's [Dialogue] block format before using it. |
| 11 | **Front-loading style, back-loading subject** | AI models weigh the first 20-30 words most heavily. If those words are all style keywords, the subject gets deprioritized. | Put the subject and action in the first sentence. Style and camera come after. | Instead of "Cinematic, 4K, film grain, shallow DOF -- a man walks through rain," write "A man in a trench coat walks through heavy rain on a city street. Cinematic, shallow depth of field, film grain." |
| 12 | **Expecting multiple scenes in one clip** | These are single-shot generators. "First she's at home, then at the office, then at the beach" will not work. | One location, one continuous action, per generation. Edit multiple clips together in post. | Generate three separate clips: home, office, beach. Edit together afterward. |

---

## 6. Prompt Templates

Copy these templates, replace the bracketed text with your details, and generate. Each one is battle-tested for the noted use case.

### Template 1: Social Media Short (15s, 9:16 vertical)

**Best for:** Instagram Reels, TikTok, YouTube Shorts

```
[SHOT TYPE] of [SUBJECT with 5+ physical details] [ACTION with specific verbs].
[SETTING with time of day and 3 key environmental details]. [LIGHTING description].
Camera [MOVEMENT] from [START FRAMING] to [END FRAMING]. Vertical 9:16 format.

[STYLE keywords: energetic/casual/polished + 2-3 modifiers].

Audio: [MUSIC mood and genre], [1-2 ambient sounds].

Negative: watermarks, text overlays, low quality, blurred, static.
```

**Filled example:**
```
Medium shot of a young woman with curly brown hair and paint-stained overalls
revealing a finished canvas painting by turning it toward the camera with a proud
grin. Art studio with natural light from a skylight, shelves of paint tubes and
brushes in the background, afternoon sun. Warm, diffused overhead lighting.
Camera holds static then slowly pushes in as she reveals the painting. Vertical
9:16 format.

Vibrant, casual, authentic UGC style, natural color grading.

Audio: Upbeat lo-fi hip-hop, soft brush tapping on canvas.

Negative: watermarks, text overlays, low quality, blurred, static, morphing.
```

---

### Template 2: Product Showcase (8s, 16:9 widescreen)

**Best for:** E-commerce, ads, product launches

```
A [PRODUCT with material, color, and finish details] sits on [SURFACE/PEDESTAL
description] inside [ENVIRONMENT with lighting setup]. [LIGHTING: key light
direction, rim light, fill]. Camera [MOVEMENT: orbit/dolly/push-in] over
[DURATION] seconds. [ASPECT RATIO].

Style: [premium/clean/luxurious/minimal + 2-3 modifiers]. [COLOR PALETTE].

Audio: [MUSIC: cinematic/ambient/minimal + instrument]. [SOUND EFFECT on first
beat if desired].

Voice-over (optional): "[TAGLINE -- keep under 10 words]"

Negative: text, watermarks, fingerprints on product, dust, reflections of
crew/equipment, color banding.
```

**Filled example:**
```
A brushed-titanium smartwatch with a sapphire crystal face sits on a matte black
stone pedestal inside a dark studio. Key light from upper-left (soft box),
cool-white rim light from behind, no fill (dramatic shadows). Camera orbits
slowly 180 degrees at eye level over 8 seconds. 16:9.

Style: premium, clean, luxurious, minimal. Dark tones with selective metallic
highlights.

Audio: A single deep bass note followed by minimal ambient synth pad. Subtle
ticking at half speed.

Voice-over: "Time, reimagined."

Negative: text overlays, watermarks, fingerprints, dust, reflections of equipment,
color banding, lens flare.
```

---

### Template 3: Talking Head / Testimonial

**Best for:** YouTube, course content, testimonials, podcasts

```
A [PERSON: age, appearance, clothing] sits [POSITION relative to camera] at
[DESK/TABLE/SETTING]. They [SPEAK/GESTURE description]. [BACKGROUND: 3-4
blurred background elements]. [LIGHTING: key + fill + practical lights].

Camera: [SHOT TYPE], [LENS], [ANGLE], [MOVEMENT or static with micro-sway].
[ASPECT RATIO].

Dialogue: [SPEAKER NAME] says [TONE/DELIVERY]: "[EXACT WORDS -- max 20 words
for 8s clip]"

Audio: [ROOM TONE], [BACKGROUND if any: music/ambient].

Negative: subtitles, captions, text overlays, watermarks, uncanny valley,
morphing face, deformed hands.
```

**Filled example:**
```
A man in his mid-30s with a neatly trimmed beard, wearing a charcoal crewneck
sweater, sits facing the camera at a clean wooden desk. He speaks directly to
camera with natural hand gestures, nodding occasionally. Blurred background:
white bookshelf, potted fiddle-leaf fig, soft desk lamp glow, exposed brick wall.
Soft key light from camera-left, subtle warm fill from the desk lamp.

Camera: Medium close-up, 50mm, eye-level, static with subtle handheld sway. 16:9.

He says with genuine enthusiasm: "We tried everything else first. This was the
only tool that actually worked."

Audio: Quiet room tone, no background music.

Negative: subtitles, captions, text overlays, watermarks, uncanny valley,
morphing face, deformed hands.
```

---

### Template 4: B-Roll / Atmosphere Shot

**Best for:** Background footage, transitions, mood-setting sequences

```
[CAMERA MOVEMENT] of [SCENE/ENVIRONMENT with 5+ sensory details].
[TIME OF DAY] lighting. [WEATHER/ATMOSPHERE]. [MOVEMENT within the scene:
what objects or elements are in motion]. No people in frame (or distant/silhouetted
figures only).

Camera: [SHOT TYPE], [LENS], [MOVEMENT speed and direction]. [ASPECT RATIO].

Style: [CINEMATIC/DOCUMENTARY/EDITORIAL + color palette + film reference if
applicable].

Audio: [3-4 layered ambient sounds, spatially described].

Negative: people in foreground, text, watermarks, static frame, low quality.
```

**Filled example:**
```
Slow crane shot rising over a misty lake at dawn. Pine trees line the far shore,
their reflections perfectly mirrored in the still water. A thin layer of fog
hovers just above the surface. A single bird takes flight from the water's edge.
Dew glistens on a wooden dock in the foreground.

Camera: Wide shot, 24mm, crane rising from dock-level to 20 feet over 8 seconds.
16:9.

Style: Cinematic, desaturated earth tones with cool blue shadows, Terrence Malick
inspired, shallow morning light.

Audio: Gentle water lapping against the dock, distant bird calls, soft wind
through pine needles, the single bird's wings flapping as it takes off.

Negative: people in foreground, text, watermarks, static, overexposed sky,
lens flare, low quality.
```

---

### Template 5: Before / After Transformation

**Best for:** Renovation reveals, makeovers, progress showcases, cleaning videos

```
[BEFORE STATE: detailed description of the "before" condition with specific
flaws/issues]. Camera holds for [X] seconds. Then [TRANSITION: whip pan / match
cut / time-lapse / smooth morph] to reveal [AFTER STATE: detailed description
of the transformed result with specific improvements].

Camera: [SHOT TYPE], [MOVEMENT matching the transition]. [ASPECT RATIO].

Style: [SATISFYING/CLEAN/DRAMATIC + color shift from muted-before to
vibrant-after].

Audio: [BEFORE sounds] transitioning to [AFTER sounds]. [Optional: satisfying
sound effect on the reveal moment].

Negative: watermarks, text, jump cuts, morphing faces (if people present),
blurred details.
```

**Filled example:**
```
A cluttered, dusty garage workshop with tools scattered across a stained concrete
floor, cobwebs in corners, a flickering overhead fluorescent light. Camera holds
a wide shot for 3 seconds. Then a smooth time-lapse transition reveals the same
garage transformed: tools organized on a new pegboard wall, epoxy-coated floor
gleaming, warm LED panel lighting, a restored vintage motorcycle centered as the
focal point.

Camera: Wide shot, 24mm, static hold for the before, then slow push-in during
the reveal. 16:9.

Style: Satisfying transformation aesthetic. Before: desaturated, flat lighting.
After: warm, vibrant, polished color grading.

Audio: Before: buzzing fluorescent light, dusty silence. Transition: a satisfying
whoosh. After: clean ambient hum, subtle upbeat music begins.

Negative: watermarks, text overlays, jump cuts, blurred details, morphing,
flickering.
```

---

### Template 6: Tutorial / How-To Clip

**Best for:** Instructional content, step-by-step demonstrations, educational

```
[OVERHEAD or CLOSE-UP] of [PERSON'S HANDS / WORKSPACE] performing [SPECIFIC
STEP-BY-STEP ACTION with 2-3 sequential beats]. [SURFACE and TOOLS visible in
frame]. [LIGHTING: bright, even, no harsh shadows].

Camera: [TOP-DOWN or CLOSE-UP angled], [LENS], [SUBTLE MOVEMENT to follow the
action]. [ASPECT RATIO].

Style: Clean, well-lit, tutorial aesthetic. [COLOR PALETTE: bright and neutral].

Audio: [ACTION SOUNDS: cutting, pouring, clicking, etc.].
[Optional voice-over: "First, [STEP 1]. Then, [STEP 2]."]

Negative: cluttered background, harsh shadows on workspace, blurred hands,
watermarks, text overlays, shaky camera.
```

**Filled example:**
```
Top-down close-up of a pair of hands on a wooden cutting board. The hands pick up
a sharp chef's knife, slice a ripe avocado in half lengthwise, twist to separate
the halves, then tap the knife into the pit and twist to remove it cleanly.

Camera: Overhead bird's-eye view, 35mm, subtle drift to follow the action as
the hands move. 16:9.

Style: Clean, bright, tutorial aesthetic. Warm neutral tones, white marble
countertop visible at edges. Well-lit with soft overhead diffused light, no
harsh shadows.

Audio: Knife cutting through avocado flesh, the soft pop of the halves separating,
the tap of the knife into the pit. No music.

Voice-over in a calm, instructional tone: "Cut lengthwise around the pit.
Twist to separate. Tap the knife into the pit and twist to remove."

Negative: cluttered background, harsh shadows, blurred hands, extra fingers,
watermarks, text overlays, shaky camera.
```

---

## 7. Side-by-Side Input / Output Descriptions

For each prompt below, we describe what each model would likely produce and which model "wins" for that specific type of content.

---

### Prompt 1: Cinematic Nature Shot

**Prompt used:**
> "A lone wolf stands on a snow-covered ridge at blue hour, wind ruffling its thick gray fur. It lifts its head and howls. Camera slowly pushes in from a wide shot to a medium close-up. Volumetric mist drifts through the valley below. Cinematic, shallow depth of field, desaturated cool tones."

| Model | Expected Output | Strengths | Weaknesses |
|-------|----------------|-----------|------------|
| **Sora 2** | Photorealistic wolf with accurate fur physics, snow particles reacting to wind, breath visible in cold air. The world simulation engine excels at material interaction -- fur, snow, mist all behave physically. Camera push-in is smooth and cinematic. | Best physics simulation. Fur, snow, and breath vapor look real. Material interactions are top-tier. | Audio may be generic ambient wind rather than a convincing howl. |
| **Veo 3** | Cinematic 4K output with gorgeous color grading and atmospheric depth. The blue hour palette would be accurately rendered. Mist volumetrics are strong. Wolf design is realistic but may have slightly less micro-detail in fur physics than Sora. | Best color grading and 4K clarity. Atmospheric depth and lighting are beautiful. | Slightly less physically accurate fur simulation. Animal motion can occasionally feel stiff. |
| **Kling 3.0** | Strong cinematic framing with good camera movement. The wolf's pose and howl animation would be convincing. Color palette execution is reliable. May handle the wide-to-MCU push-in smoothly. | Consistent camera motion. Reliable subject framing and pose. Good at multi-shot consistency if generating a sequence. | Fur micro-detail and volumetric mist may lack the depth of Sora or Veo. |
| **Wan 2.1** | Good overall composition with the cool desaturated palette applied well. The wolf's basic form and pose would be solid. May struggle with the fur-wind interaction and volumetric mist depth. | Strong prompt adherence for color palette and framing. Open-source flexibility. | Weaker physics for fur and particle effects. Volumetric mist may look flat. Resolution capped lower than Veo. |

**Winner: Sora 2 Pro.** Nature shots with complex material physics (fur, snow, mist, breath) play directly to Sora's world simulation engine. The physical realism of particle interactions gives it the edge.

---

### Prompt 2: Talking Head with Dialogue

**Prompt used:**
> "A woman in her mid-30s with dark curly hair and warm brown eyes, wearing a rust-colored linen blazer, sits at a clean desk. She looks into the camera and says with confident warmth: 'The best marketing strategy is the one you actually follow through on.' Soft key light from camera-left, blurred bookshelf background. Medium close-up, 50mm, static."

| Model | Expected Output | Strengths | Weaknesses |
|-------|----------------|-----------|------------|
| **Sora 2** | Good facial rendering with natural skin tones. Lip movements will approximate the dialogue. Expression and gesture feel natural. Audio sync is functional but not perfect for longer phrases. | Natural facial expressions and gestures. Good skin rendering. Solid overall quality. | Lip sync accuracy is behind Veo 3. Occasional desync on longer phrases. |
| **Veo 3** | Excellent lip synchronization -- mouth movements match the exact words spoken. Facial micro-expressions (the slight smile, the confident eye contact) render naturally. Voice quality sounds realistic. 4K clarity on the face is impressive. | Industry-leading lip-sync accuracy. Best dialogue handling overall. Natural voice generation. 4K face detail. | Occasionally, very fast speech can still desync slightly. |
| **Kling 3.0** | Good character rendering with consistent face structure. Lip movements are decent but not as precisely synced as Veo. The overall composition and lighting follow the prompt well. | Consistent character rendering across takes. Good at maintaining the "same person" if you need multiple clips. | Lip sync is a step behind Veo 3 and Sora 2. Expressions can occasionally feel slightly mechanical. |
| **Wan 2.1** | The face and clothing will render well. Mouth will move in a speaking pattern, but without actual dialogue sync. Good composition and lighting adherence. | Solid visual quality for the character and scene. Works well if you plan to add a voice-over in post-production. | Cannot generate synced dialogue audio. Mouth movements are generic "talking" rather than matching specific words. |

**Winner: Veo 3.** For talking heads with specific dialogue, Veo 3's native lip-sync engine is the clear leader. The colon syntax triggers precise mouth-to-word synchronization that no other model currently matches.

---

### Prompt 3: Fast-Action Sports Sequence

**Prompt used:**
> "A skateboarder in a black hoodie and worn jeans launches off a concrete half-pipe, grabbing the board mid-air with his right hand, body fully extended against a pink sunset sky. Camera tracks from below in a low-angle shot, following the arc of the jump. Slow motion, 120fps feel. Urban skatepark with graffiti walls."

| Model | Expected Output | Strengths | Weaknesses |
|-------|----------------|-----------|------------|
| **Sora 2** | Impressive slow-motion physics. The arc of the jump, the board grab, and the landing trajectory look physically plausible. The "world simulator" engine handles momentum, gravity, and body mechanics well. Sunset lighting is cinematic. | Best physics for athletic motion. Slow-motion rendering is convincing. Body mechanics feel real. | May occasionally produce a hand with wrong finger count during the board grab. |
| **Veo 3** | Cinematic output with gorgeous sunset color grading. The overall shot composition is strong. Body motion is good but may lack the micro-physics accuracy of Sora (the exact way a body rotates in the air). 4K clarity on the background graffiti is excellent. | Beautiful color grading and 4K detail. Graffiti and environment textures are sharp. Strong overall composition. | Body physics during the aerial portion may feel slightly floaty or imprecise compared to Sora. |
| **Kling 3.0** | Good camera tracking with consistent framing. The skateboarder maintains identity throughout the shot. Motion is energetic and the low-angle perspective is well-executed. May handle the multi-shot sequence better if you want approach, jump, and landing. | Excellent subject consistency across the motion arc. Strong camera tracking. Good for generating the full sequence. | Slow-motion quality not as refined as Sora. Fine details (fingers on board) may struggle. |
| **Wan 2.1** | Decent overall composition with the sunset palette applied well. The basic motion arc is captured, but fine details of the body position mid-air may be less precise. The graffiti walls may lack text accuracy. | Decent motion rendering for the price (open-source). Good color palette adherence. | Weakest at fast complex motion. Body positioning mid-air may look unnatural. Slow-motion is less convincing. |

**Winner: Sora 2 Pro.** Fast action with complex body physics is Sora's domain. The world simulation engine understands momentum, gravity, and body mechanics in a way that produces the most physically convincing athletic motion.

---

### Prompt 4: Product Commercial with Voice-Over

**Prompt used:**
> "A sleek electric car in midnight blue drives along a winding coastal road at golden hour. Waves crash against cliffs in the background. Camera tracks alongside in a smooth dolly shot. The car's surface reflects the warm sunset light. Voice-over in a deep, authoritative tone: 'The road ahead has never looked this good.' Cinematic, 16:9, premium automotive commercial aesthetic."

| Model | Expected Output | Strengths | Weaknesses |
|-------|----------------|-----------|------------|
| **Sora 2** | Stunning reflections on the car's surface -- Sora excels at material rendering (metallic paint, glass, chrome). The coastal environment with crashing waves and cliff faces is physically convincing. Camera tracking is smooth. Voice-over audio is functional. | Best material reflections (paint, glass, chrome). Physically convincing environment (waves, cliffs). Smooth tracking shot. | Voice-over may sound slightly synthetic compared to Veo. |
| **Veo 3** | Premium 4K output with cinematic color grading that matches real automotive commercials. Voice-over quality is natural and well-synced. The golden hour lighting and coastal palette are beautifully rendered. Car surface reflections are good but slightly behind Sora. | Best voice-over quality. Premium 4K color grading. The overall "commercial" aesthetic is closest to real production. | Car surface reflections may be slightly less physically accurate than Sora. |
| **Kling 3.0** | Solid automotive tracking shot with consistent car rendering throughout the motion. Camera movement is reliable. Color palette follows the prompt well. The car maintains its visual identity as it moves through the scene. | Consistent vehicle rendering in motion. Reliable camera tracking. Good for generating multiple angles of the same car. | Reflections and material rendering are a step behind Sora and Veo. Voice audio is less polished. |
| **Wan 2.1** | The basic composition is good -- car on road, sunset, ocean. The golden hour palette is applied well. However, car reflections may look painted rather than physically accurate. No voice-over capability (would need to be added in post). | Good basic composition. Decent color palette. Cost-effective (open-source). | No voice-over generation. Weak material reflections. Lower resolution limits commercial use. |

**Winner: Veo 3** (for the complete package with voice-over) or **Sora 2** (for visual quality only). If the voice-over is critical to the deliverable, Veo 3 produces the most complete, polished commercial. If you plan to record voice-over separately, Sora 2's material rendering edges ahead on pure visual quality.

---

### Prompt 5: Surreal / Creative Abstract

**Prompt used:**
> "A massive blue whale swims through the clouds above a small coastal village. The whale's body is semi-transparent, revealing constellations inside it. Villagers below look up in wonder, their faces lit by the whale's starlight glow. Camera slowly cranes up from the village rooftops to frame the whale against the twilight sky. Dreamlike, magical realism, Hayao Miyazaki inspired."

| Model | Expected Output | Strengths | Weaknesses |
|-------|----------------|-----------|------------|
| **Sora 2** | The semi-transparent whale with internal constellations is rendered with impressive material physics -- the transparency, light refraction, and star-glow all interact convincingly. The cloud-swimming motion has fluid, realistic dynamics even in a surreal context. The crane-up camera move is smooth. | Best at making surreal physics feel "real." Material transparency and light interaction are convincing. Fluid motion through clouds is natural. | The villagers' faces may be less detailed at the distance required by the crane-up framing. |
| **Veo 3** | Beautiful cinematic rendering with strong Miyazaki-inspired color palette. The overall composition and color grading are gorgeous. The whale's form is majestic. The upward camera move reveals the scene effectively. Facial expressions on villagers are clear even at distance thanks to 4K. | Best overall composition and color palette. 4K clarity captures both whale and villagers well. Strong artistic style adherence. | The whale's transparency and internal constellation effect may be less physically convincing than Sora. |
| **Kling 3.0** | Good overall execution of the surreal concept. The whale's form and cloud interaction are handled well. Camera crane-up is reliable. Village scene is composed effectively. May struggle slightly with the transparency/constellation internal detail. | Reliable camera movement. Good whale form and scale. Consistent framing through the crane-up. | Transparency and internal constellation detail are weakest among the four. Less Miyazaki-specific style adherence. |
| **Wan 2.1** | Decent interpretation of the concept with good color palette. The basic composition (whale in sky, village below) is clear. The dreamlike quality is present. May render the whale's internal constellations as a texture overlay rather than true transparency. | Good dreamlike atmosphere. The Miyazaki-inspired color palette is often well-executed. Budget-friendly option. | Constellation transparency looks painted-on rather than volumetric. Cloud interaction physics are weakest. Village detail is limited at lower resolution. |

**Winner: Sora 2 Pro.** Surreal scenes that require physically convincing impossible phenomena are Sora's specialty. The world simulation engine makes a transparent, constellation-filled whale swimming through clouds actually look like it belongs in that world, rather than looking like a visual effect pasted on top.

---

## Quick Reference: Which Model for Which Job

| Content Type | Best Model | Runner-Up | Why |
|-------------|-----------|-----------|-----|
| Talking head / dialogue | Veo 3 | Sora 2 | Veo's lip-sync is unmatched |
| Nature / landscape | Sora 2 | Veo 3 | Sora's physics simulation for natural elements |
| Product showcase | Veo 3 | Sora 2 | Veo's 4K polish + voice-over, Sora's material rendering |
| Fast action / sports | Sora 2 | Kling 3.0 | Sora's body physics, Kling's consistency |
| Surreal / creative | Sora 2 | Veo 3 | Sora makes impossible physics look real |
| Multi-shot sequence | Kling 3.0 | Sora 2 | Kling's subject consistency across clips |
| Social media vertical | Kling 3.0 | Veo 3 | Kling's speed and volume, Veo's quality |
| Tutorial / how-to | Veo 3 | Sora 2 | Veo's voice-over + 4K hand detail |
| Budget / high-volume | Wan 2.1 | Kling 3.0 | Wan is open-source, Kling is cost-effective |
| Text in video | Wan 2.1 | Veo 3 | Wan uniquely renders readable text |

---

## Final Tips: The 10 Commandments of Video Prompting

1. **Start with subject and action, not style.** The first 20-30 words carry the most weight. Front-load who and what.
2. **One shot per prompt.** Think of each generation as a single camera take. Stitch multiple clips in editing.
3. **Always specify camera.** Shot type + one movement = minimum. This single habit will double your output quality.
4. **Use specific verbs.** "Sprinting" not "moving." "Whispering" not "talking." "Glaring" not "looking."
5. **Include lighting.** Three words minimum: "golden hour backlight" or "soft overhead diffused."
6. **Match your aspect ratio to your platform.** 16:9 for YouTube, 9:16 for Reels/TikTok, 1:1 for Instagram feed.
7. **Keep it to 80-200 words.** Under 50 is too vague. Over 300 loses focus.
8. **Use negative prompts.** Copy the template from Section 1.7 and customize per generation.
9. **Iterate, don't rewrite.** Small adjustments to a good prompt beat a complete rewrite of a bad one.
10. **Choose the right model for the job.** Dialogue goes to Veo. Physics goes to Sora. Consistency goes to Kling. Budget goes to Wan.

---

## Sources & References

### Source Knowledge Base Documents
- Sora 2 Prompt Engineering (Context7 Library Reference)
- Sora 2 Prompting Guide (Official OpenAI Cookbook)
- Veo 3 Master Prompting Guide (Context7 Library Reference)
- How to Create Effective Prompts with Veo 3 (Google DeepMind)
- Kling 3.0 Prompting Guide (fal.ai / Leonardo.ai / ageofllms)
- Guide to Prompting Wan 2.1 (Ambience AI / MimicPC / InstaSD)

### Web References
- [AI Video Prompt Engineering (GenAIntel)](https://www.genaintel.com/guides/ai-prompt-engineering-video-generation-guide)
- [AI Video Generation 2026 (Cliprise)](https://www.cliprise.app/learn/guides/getting-started/ai-video-generation-complete-guide-2026)
- [60 AI Text-to-Video Prompts (Simplified)](https://simplified.com/blog/ai-video/50-ai-text-to-video-prompts-you-can-steal)
- [120+ Video Prompts (Filmora)](https://filmora.wondershare.com/video-prompts.html)
- [Sora 2 Prompting Guide (OpenAI Cookbook)](https://cookbook.openai.com/examples/sora/sora2_prompting_guide)
- [Sora 2 Prompt Guide (Higgsfield)](https://higgsfield.ai/sora-2-prompt-guide)
- [Ultimate Prompting Guide for Veo 3.1 (Google Cloud)](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)
- [How to Prompt Veo 3 (Replicate)](https://replicate.com/blog/using-and-prompting-veo-3)
- [Veo 3 Prompt Guide (Leonardo.ai)](https://leonardo.ai/news/mastering-prompts-for-veo-3/)
- [Kling 3.0 Prompting Guide (fal.ai)](https://blog.fal.ai/kling-3-0-prompting-guide/)
- [Kling 3.0 Prompt Guide (klingaio)](https://klingaio.com/blogs/kling-3-prompt-guide)
- [AI Video Prompt Guide (LTX Studio)](https://ltx.studio/blog/ai-video-prompt-guide)
- [Comparing AI Video Prompt Formats (DEV Community)](https://dev.to/chisha_d5ceeffee4e27/comparing-ai-video-generator-prompt-formats-what-actually-matters-in-2026-2g28)
- [12 Essential Camera Movements (LetsEnhance)](https://letsenhance.io/blog/all/ai-video-camera-movements/)
- [38 Camera Move Prompts (Atlabs AI)](https://www.atlabs.ai/blog/ultimate-guide-ai-camera-moves-prompts)
- [Camera Movements for AI Prompts (ageofllms)](https://ageofllms.com/ai-howto-prompts/ai-fun/camera-movements-prompts-ai-video)
- [AI Video Models Comparison 2026 (OpenCreator)](https://opencreator.io/blog/ai-video-models-comparison-2026)
- [Veo 3 vs Top Generators (Imagine.art)](https://www.imagine.art/blogs/veo-3-vs-top-ai-video-generators)
- [15 AI Video Models Tested (TeamDay)](https://www.teamday.ai/blog/best-ai-video-models-2026)


---
## Media

### Platform References
- **sora2**: [Docs](https://openai.com/sora) · [Gallery](https://openai.com/index/sora/)
- **kling**: [Docs](https://klingai.com) · [Gallery](https://klingai.com/explore)
- **vidu**: [Docs](https://www.vidu.studio) · [Gallery](https://www.vidu.studio/explore)
- **wan**: [Docs](https://github.com/Wan-Video/Wan2.1) · [Gallery](https://wan-video.github.io)

### Related Videos
- [OpenAI Sora 2 Complete Guide - Features & How to Use](https://www.youtube.com/results?search_query=openai+sora+2+complete+guide+tutorial+2026) — *Credit: OpenAI on YouTube* `sora2`
- [Sora 2 Prompting Masterclass - Create Stunning AI Videos](https://www.youtube.com/results?search_query=sora+2+prompting+masterclass+ai+video) — *Credit: AI Video on YouTube* `sora2`
- [Kling AI Video Generator Tutorial - Complete Guide](https://www.youtube.com/results?search_query=kling+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `kling`
- [Kling 3.0 - Motion Brush & Advanced Features](https://www.youtube.com/results?search_query=kling+3.0+motion+brush+advanced+tutorial) — *Credit: AI Tutorials on YouTube* `kling`
- [Vidu AI Video Generator Tutorial](https://www.youtube.com/results?search_query=vidu+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `vidu`
- [Vidu - Fast AI Video Generation Review](https://www.youtube.com/results?search_query=vidu+ai+fast+video+generation+review) — *Credit: AI Reviews on YouTube* `vidu`

> *All video content is credited to original creators. Links direct to source platforms.*
