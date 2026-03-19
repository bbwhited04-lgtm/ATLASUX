# Kling AI Advanced Prompt Engineering Framework

**Models Covered:** Kling 3.0, Kling 3.0 Omni, Kling Turbo
**Last Updated:** 2026-03-18
**Audience:** Advanced practitioners -- assumes familiarity with basic Kling prompting

**Sources:**
- [Kling 3.0 Prompt Guide (klingaio.com)](https://klingaio.com/blogs/kling-3-prompt-guide)
- [Kling 3.0 Prompting Guide (fal.ai)](https://blog.fal.ai/kling-3-0-prompting-guide/)
- [Kling 3.0 Omni Guide (Vidguru)](https://www.vidguru.ai/blog/kling-3.0-omni-guide.html)
- [Kling 3.0 Reference Guide (MagicHour)](https://magichour.ai/blog/kling-30-reference-guide)
- [Kling 3.0 Features & Audio-Visual Sync](https://kling3.io/features)
- [Kling 3.0 Motion Control (SuperMaker)](https://supermaker.ai/video/blog/exploring-kling-30-how-advanced-motion-control-is-transforming-ai-video-creation/)
- [Kling AI Prompt Guide (Ambience AI)](https://www.ambienceai.com/tutorials/kling-prompting-guide)
- [Kling 3.0 Master Guide (Atlabs)](https://www.atlabs.ai/blog/kling-3-0-prompting-guide-master-ai-video-generation)
- [Kling 3.0 Complete Guide (DataCamp)](https://www.datacamp.com/tutorial/kling-3-0)
- [Kling Credit & Pricing Breakdown (AI Tool Analysis)](https://aitoolanalysis.com/kling-ai-pricing/)
- [Kling Negative Prompts Guide (DreamLux)](https://dreamlux.ai/blog/kling-ai-negative-prompts)
- [Kling AI Troubleshooting (Official)](https://app.klingai.com/global/blog/ai-video-troubleshooting-guide-mistakes)
- [Kling Character Consistency (Atlas Cloud)](https://www.atlascloud.ai/blog/solving-character-inconsistency-a-guide-to-kling-3.0-image-to-video-mode)
- [Kling Motion Brush Guide (Filmart)](https://filmart.ai/kling-motion-brush/)

---

## 1. Kling Prompt Architecture

### 1.1 How Kling Processes Prompts (vs Sora / Veo)

Kling 3.0 differs fundamentally from Sora and Veo in prompt interpretation:

| Dimension | Kling 3.0 | Sora | Veo 3 |
|-----------|-----------|------|-------|
| **Prompt parsing** | Five-layer cinematic pipeline (Scene > Character > Action > Camera > Audio) | Flat narrative interpretation | Scene-graph decomposition |
| **Camera language** | Native film terminology (dolly, jib, rack focus, FPV) parsed as first-class directives | Camera inferred from scene description | Explicit camera controls via separate parameter |
| **Audio** | Omni mode: native audio generation (dialogue, SFX, music) in single pass | No native audio | Audio via separate Lyria model |
| **Multi-shot** | Native 1-6 shot storyboard with per-shot prompts | Single continuous generation | Single generation, no native multi-shot |
| **Character binding** | Elements system with persistent identity anchoring via reference images/video | Inferred from text description | Character persistence via image conditioning |
| **Motion control** | Motion Brush (draw paths) + Motion Reference (action transfer) + 20+ camera presets | Text-described motion only | Motion via text + optional trajectory |
| **Physics model** | Explicit physics engine (gravity, inertia, fabric, hair, collision, momentum) | Implicit physics from training | Implicit physics |

**Key architectural difference:** Kling treats prompts as *directorial instructions* to a virtual cinematographer, not descriptions to an image-sequence generator. Prompts that read like a DP's shot notes outperform those written as scene descriptions.

### 1.2 Optimal Prompt Length by Model

| Model | Optimal Length | Sweet Spot | Notes |
|-------|---------------|------------|-------|
| **Kling Turbo** | 30-80 words | 1-2 sentences per layer | Turbo compresses processing -- overly detailed prompts degrade rather than improve. Focus on the single most important action + one camera direction. |
| **Kling 3.0 Standard** | 60-150 words | 2-3 sentences per layer | Full five-layer structure. Each layer gets 1-3 specific details. Diminishing returns past 150 words. |
| **Kling 3.0 Professional** | 80-200 words | Full five-layer with modifiers | Professional mode can leverage richer descriptions. Add color grading terms, lighting rigs, lens specifications. |
| **Kling 3.0 Omni** | 100-250 words (total across shots) | Per-shot prompts of 30-60 words each | Omni distributes attention across audio + visual. Over-prompting audio causes visual degradation. Balance is critical. |

**Rule of thumb:** 2-4 main ideas per prompt. Every additional idea beyond 4 dilutes the model's attention across all of them.

### 1.3 Multi-Shot Mode and Prompting Strategy Shifts

Multi-shot fundamentally changes how you prompt. Single-shot prompting is monolithic -- everything lives in one block. Multi-shot prompting is *episodic* -- each shot is a self-contained micro-prompt that inherits global context.

**Single-shot prompt architecture:**
```
[Full Scene] + [Full Character Description] + [Full Action Arc] + [Camera Movement] + [Audio]
```

**Multi-shot prompt architecture:**
```
Global Context: [Character identity] + [Setting] + [Overall mood/style]
Shot 1: [Framing] + [Action] + [Camera] + [Duration]
Shot 2: [Framing] + [Action] + [Camera] + [Duration]
...
Shot N: [Framing] + [Action] + [Camera] + [Duration]
```

Critical shifts when entering multi-shot mode:
- **Character descriptions become global, not per-shot.** Repeating full character descriptions in each shot wastes token budget and can introduce drift.
- **Camera movements are per-shot, not cumulative.** Each shot resets camera state.
- **Action continuity must be explicit.** The model does not infer that Shot 2 continues Shot 1's action unless you state it.
- **Duration allocation matters.** 15 seconds across 6 shots = 2.5s average. A shot under 1.5s risks incoherence.
- **Transition type is implied by shot juxtaposition.** Cut-on-action requires the end state of Shot N to match the start state of Shot N+1.

### 1.4 Text Rendering in Video

Kling 3.0 introduced text rendering capabilities -- a notoriously difficult problem for video generation models. Current state:

**What works:**
- Short text (1-4 words) on clear surfaces: signs, screens, book covers, product labels
- Text prompted as part of the scene: `"A neon sign reading 'OPEN' flickers in the rain"`
- Title cards when prompted as a distinct scene: `"Black background with white serif text reading 'Chapter One'"`
- Brand names on products when reinforced with reference images

**What struggles:**
- Long sentences or paragraphs
- Text that needs to remain readable while the camera moves
- Small text at a distance
- Text in scripts the model wasn't heavily trained on
- Dynamic text that changes during the clip

**Prompting pattern for text:**
```
"[Surface description] displaying the text '[EXACT TEXT]' in [font style] [color] lettering.
[Text size relative to frame]. [Lighting on text surface]."
```

**Negative prompt additions for text clarity:** `"blurry text, distorted letters, misspelled words, illegible text, morphing text"`

**Pro tip:** For reliable text, generate text as a static image first (via Kling's image generator or external tool), then use Image-to-Video mode with minimal motion on the text region. Use Static Brush to lock the text area.

---

## 2. Advanced Techniques

### 2.1 Multi-Shot Storyboarding

#### Smart Storyboard vs Custom Storyboard

**Smart Storyboard** (AI-driven): Write a narrative paragraph and the AI decomposes it into shots. Best for rapid prototyping and when you trust the AI's cinematographic instincts.

**Custom Storyboard** (manual): You define each shot individually. Required for commercial work, precise timing, and specific shot-to-shot continuity.

**When to use which:**
| Scenario | Use Smart | Use Custom |
|----------|-----------|------------|
| Initial concept exploration | Yes | |
| Client deliverable | | Yes |
| Dialogue scene with specific beats | | Yes |
| Action montage | Yes | |
| Product commercial with brand guidelines | | Yes |
| Social media content (speed priority) | Yes | |

#### Scripting 6 Cuts in a Single Generation

The maximum 6-shot structure with optimal duration allocation:

```
Total: 15 seconds
Shot 1 (Establishing): 3.0s -- Wide shot, set the world
Shot 2 (Introduction): 2.5s -- Medium shot, introduce subject
Shot 3 (Development): 2.5s -- Close-up or action beat
Shot 4 (Escalation): 2.0s -- Intensity increase, faster cuts
Shot 5 (Climax): 2.5s -- Peak moment, dramatic framing
Shot 6 (Resolution): 2.5s -- Payoff shot, often returns to wide
```

**Transition types between shots:**
- **Hard cut** (default): No transition prompt needed. Juxtapose shots.
- **Match cut**: End Shot N and begin Shot N+1 with similar composition. Example: close-up of a spinning wheel in Shot 3, opening of Shot 4 on a spinning globe.
- **Shot-reverse-shot**: Prompt alternating character perspectives. The AI handles the 180-degree rule automatically in dialogue scenes.
- **Jump cut**: Same framing, different moment. Prompt the same camera angle with time-shifted action.
- **L-cut / J-cut** (Omni): Audio from Shot N+1 begins before the visual cut. Prompt dialogue or sound in the preceding shot's audio layer.

#### Duration Optimization: Filling 15 Seconds

15 seconds of coherent action requires planning for temporal density. Common failure: prompting 3 seconds of action for a 15-second clip, resulting in the model padding with slow-motion or idle frames.

**Duration-filling strategies:**
1. **Sequential micro-actions**: Break one task into 5-6 discrete steps. "Opens drawer > selects tool > examines it > places it on workbench > picks up next component > begins assembly."
2. **Environmental progression**: Time-of-day shift, weather change, crowd dynamics evolving.
3. **Emotional arc**: Facial expression journey. Curiosity > discovery > surprise > satisfaction.
4. **Camera-driven pacing**: Use camera movement to create temporal texture. Static > slow push > orbit > pull back.
5. **Multi-character interaction**: Dialogue exchanges naturally fill time with natural pauses, reactions, and turn-taking.

### 2.2 Subject Consistency via Elements System

#### Reference Image Strategy

The Elements system is Kling's character/object persistence engine. Mastering it requires understanding how the model binds references.

**Single-reference anchoring** (most reliable):
- Use ONE primary reference image for all generations with that character
- The image becomes the visual anchor -- the model returns to it when uncertain
- Best reference images: well-lit, neutral background, clear face, distinctive clothing
- Resolution: minimum 1024x1024, recommended 2048x2048

**Multi-reference binding** (stronger 3D understanding):
- Upload 3-4 images of the same character from different angles
- Include: front-facing, 3/4 profile, full body, close-up
- Keep clothing and styling IDENTICAL across all references
- The model constructs an internal 3D representation from multiple views

**Reference-prompt alignment rules:**
1. Never contradict the reference. Dark-haired reference + "blonde hair" prompt = inconsistency.
2. Describe clothing even when the reference shows it -- reinforcement improves consistency.
3. Use the same character descriptor across all shots: "the woman in the red leather jacket" not "she" or "the person."
4. When prompting actions, describe the character performing them: "The woman in the red leather jacket runs" not "someone runs."

#### Video Character References (Omni)

Omni elevates character binding by accepting 3-8 second video clips as references:
- Extracts movement patterns, mannerisms, and micro-expressions
- Captures voice characteristics simultaneously
- More accurate than static images for dynamic characters
- Use when the character needs to move in a specific way across scenes

**Optimal reference video criteria:**
- 3-8 seconds, MP4 or MOV
- Single subject, minimal background complexity
- Include at least one head turn to give the model angular reference
- Natural lighting preferred over studio lighting (generalizes better)
- Include speech if you want voice binding

#### Multi-Character Scenes

When multiple characters share a frame:
- Assign each character a distinct Element reference
- Use explicit spatial language: "the tall man on the left," "the woman behind the counter"
- Describe interactions with subject-verb-object clarity: "She hands him the manila folder"
- Differentiate characters by at least 2 visual traits (hair color + clothing is minimum)
- Avoid more than 3 Element-bound characters per frame -- identity confusion increases beyond this

### 2.3 Cameo System (Face/Character Insertion)

The cameo system inserts specific faces or characters into scenes with natural integration. It operates through the Elements pipeline but with specific prompting patterns.

**Cameo insertion workflow:**
1. Upload face/character reference as an Element
2. Prompt the scene WITHOUT the character first (establish environment)
3. Re-generate WITH the Element bound, describing the character's position and action
4. Use Image-to-Video if you need precise placement -- position the character in the source image

**Natural integration prompting:**
```
"[Character from Element @1] enters frame from the left, wearing [outfit consistent with reference].
They [natural action: adjust jacket, glance around, pick up an object].
The existing crowd [reacts / ignores / makes space].
Lighting matches the ambient [warm sunset / cool fluorescent / dramatic spotlight]."
```

**Common cameo failures and fixes:**
- Face pasted over another body: Add "natural posture, proportional body" to prompt
- Lighting mismatch: Explicitly describe the light hitting the character
- Scale mismatch: Specify character size relative to environment objects
- Uncanny interaction: Describe specific physical interactions with environment (touching, leaning, sitting)

### 2.4 Motion Brush (Advanced Area-Specific Motion)

Motion Brush operates on a principle of *selective animation* -- you paint motion onto specific regions while locking everything else.

**Motion Brush workflow (advanced):**
1. Upload source image or first frame
2. Use **Motion Brush** to draw directional paths on elements you want to move
3. Use **Static Brush** to lock non-moving elements (critical -- without this, locked areas may drift)
4. Set path direction and length (longer paths = more movement)
5. Prompt supplements the brush with action description

**Up to 6 simultaneous motion trajectories.** Each trajectory can have independent:
- Direction (any angle, drawn freehand)
- Speed (implied by path length relative to duration)
- Acceleration curve (not directly controllable -- use prompt modifiers like "gradually accelerating" or "sudden burst")

**Advanced Motion Brush patterns:**

| Pattern | Brush Application | Prompt Supplement |
|---------|------------------|-------------------|
| Flowing water | Horizontal strokes on water surface, varying lengths | "Gentle river current flowing downstream" |
| Wind-blown hair | Short diagonal strokes on hair region | "Wind catches her hair from the right" |
| Walking character | Alternating diagonal paths on legs, forward path on torso | "Walking steadily forward at a natural pace" |
| Parallax depth | Short paths on foreground (fast), tiny paths on midground, static on background | "Camera drifts laterally revealing depth" |
| Breathing | Tiny vertical oscillation on chest/shoulders | "Standing still, breathing naturally" |
| Falling objects | Downward curves with slight horizontal drift | "Autumn leaves drifting down" |

**Static Brush is equally important.** Lock:
- Backgrounds that should not shift
- Foreground objects that should remain still
- Parts of characters not involved in the action (lock feet when animating upper body gestures)
- Text or logos that must remain readable

**Brush size matters:** Up to 50px. Use large brush (40-50px) for broad movements (body, water, clouds). Use small brush (5-15px) for fine details (fingers, eyes, individual leaves).

### 2.5 Camera Director Presets (Complete Reference)

Kling 3.0 offers 20+ camera movement presets. Each preset has three customizable parameters: **Speed**, **Smoothness** (acceleration curve), and **Trajectory** (path modification).

#### Basic Camera Presets

| Preset | Description | Best For | Typical Speed |
|--------|-------------|----------|---------------|
| **Push In** (Dolly In) | Camera moves toward subject | Intensifying focus, dramatic moments | Slow-Medium |
| **Pull Out** (Dolly Out) | Camera moves away from subject | Reveals, establishing context | Medium |
| **Pan Left** | Camera rotates left on fixed axis | Following lateral movement, reveals | Medium |
| **Pan Right** | Camera rotates right on fixed axis | Following lateral movement, reveals | Medium |
| **Tilt Up** | Camera rotates upward | Revealing height, power shots | Slow-Medium |
| **Tilt Down** | Camera rotates downward | Descending reveals, examining | Slow-Medium |
| **Zoom In** | Optical zoom toward subject | Emphasizing detail without parallax | Variable |
| **Zoom Out** | Optical zoom away from subject | Contextualizing, pulling back | Variable |

#### Advanced Camera Presets

| Preset | Description | Best For | Typical Speed |
|--------|-------------|----------|---------------|
| **Tracking Shot** | Camera moves laterally alongside subject | Walking/running scenes, conversations | Matches subject speed |
| **Orbit** | Camera circles around subject | Product showcases, hero introductions | Slow-Medium |
| **Jib Shot** (Crane) | Vertical arc movement | Establishing shots, emotional lifts | Slow |
| **Dutch Angle** | Tilted horizon line | Tension, disorientation, stylized scenes | Static or Slow |
| **Rack Focus** | Focus shifts between planes | Dialogue reactions, reveals | N/A (focus, not movement) |
| **Steadicam** | Smooth floating follow | Following characters through spaces | Matches walking pace |
| **Whip Pan** | Rapid horizontal sweep | Transitions, energy, surprise | Very Fast |
| **Dolly Zoom** (Vertigo) | Dolly in + zoom out simultaneously | Psychological tension, surreal moments | Slow (effect is subtle) |
| **FPV** (First Person View) | Immersive first-person camera | Action sequences, exploration | Variable |
| **Crane Up** | Camera rises vertically | Power reveals, scale emphasis | Slow-Medium |
| **Crane Down** | Camera descends vertically | Approaching subject, grounding | Slow-Medium |
| **Truck Left/Right** | Camera body moves laterally (not rotating) | Parallax reveals, industrial feel | Medium |
| **Low-Angle Tracking** | Camera tracks at ground level | Heroic shots, imposing subjects | Medium |
| **High-Angle Tracking** | Camera tracks from above | Vulnerability, surveillance feel | Medium |
| **Arc Shot** | Partial orbit (quarter to half circle) | Transitional framing, interview style | Slow |
| **Push Through** | Camera passes through doorway/window | Scene transitions, entering spaces | Medium-Fast |
| **Pull Through** | Camera retreats through opening | Leaving scenes, memory sequences | Medium |

#### Camera Preset Combinations in Multi-Shot

In Custom Storyboard mode, each shot can have its own camera preset:
```
Shot 1: Crane Down (establishing) >
Shot 2: Push In (focus) >
Shot 3: Orbit (showcase) >
Shot 4: Whip Pan (transition) >
Shot 5: Tracking Shot (action) >
Shot 6: Pull Out (resolution)
```

**Preset conflict rules:**
- Don't combine Push In + Zoom In in the same shot (redundant, creates unnatural acceleration)
- Don't use Whip Pan on shots under 1.5 seconds (not enough time for the sweep to register)
- Don't use Dolly Zoom on wide shots (the effect is invisible without foreground/background separation)
- Don't use Dutch Angle + Orbit simultaneously (compounds disorientation past the useful threshold)

### 2.6 Audio-Visual Sync (Omni Mode)

Omni generates synchronized audio in a single pass: dialogue, sound effects, ambient audio, and background music.

#### Supported Languages for Dialogue
Chinese, English, Japanese, Korean, Spanish -- with synchronized lip movement.

#### Audio Prompting Structure

Audio prompts follow a layered model:

```
Layer 1 (Dialogue): "[Character name] says: '[Exact dialogue]' in a [tone] voice"
Layer 2 (SFX): "[Sound effect] as [visual event occurs]"
Layer 3 (Ambient): "[Environmental audio] throughout"
Layer 4 (Music): "[Music style] background score"
```

**Multi-speaker scenes (up to 3 speakers with distinct voices):**
```
"The man in the suit says 'We need to talk about the contract' in a firm,
low baritone. The woman across the table responds 'I've already reviewed
the terms' in a confident alto. Background: quiet office ambiance with
muted phone ringing."
```

**SFX synchronization:**
- Tie sound effects to specific visual events: "A glass shatters as it hits the tile floor"
- Specify timing if critical: "Footsteps echo with each step" (lets the model sync per-step)
- Layer environmental audio: "Rain on windows, distant thunder, quiet jazz from a radio"

**Voice binding with Elements:**
- Upload reference images + audio clip (minimum 3 seconds) to create voice-bound characters
- The model extracts vocal characteristics and binds them to the visual identity
- Lip sync accuracy increases significantly with voice-bound Elements
- Expressions gain emotional depth when voice and face are bound together

#### Audio Budget in Multi-Shot

Each shot in a multi-shot sequence can carry its own audio directive. Audio continuity between shots:
- **Dialogue** can span across cuts naturally (the model handles L-cuts)
- **Ambient audio** maintains consistency across shots by default
- **Music** tempo can influence cut timing -- faster BPM = shorter shot duration feels natural
- **SFX** must be prompted per-shot if they are shot-specific

**Warning:** Over-prompting audio (especially music description) steals processing budget from visual quality. Keep audio prompts to 20-30% of total prompt length.

### 2.7 Elements System (Style, Character, Product References)

The Elements system supports three reference types:

#### Character Elements
- Upload 1-4 reference images of a person/character
- Bind visual identity across all generations
- Optional: attach voice clip for Omni mode
- Use `@element_name` syntax in prompts to reference bound characters

#### Style Elements
- Upload a reference image that defines visual style
- The model matches: color grading, lighting mood, contrast, texture, aesthetic
- Combine with character Elements for brand-consistent output
- Effective for maintaining series consistency across multiple videos

#### Product/Object Elements
- Upload reference images of products, props, or specific objects
- The model preserves shape, branding, color, and proportions
- Use for product showcases, unboxing sequences, feature demonstrations
- Multiple angles improve 3D understanding of the product

**Element interaction rules:**
- Maximum 4 Elements per generation
- Character + Style Elements can combine (character maintains identity within style)
- Multiple Character Elements in one scene require spatial disambiguation in prompt
- Product Elements work best with Orbit or Push In camera presets

### 2.8 Duration Optimization

**How to fill 15 seconds of coherent action:**

| Duration | Recommended Approach | Shot Count |
|----------|---------------------|------------|
| 3s | Single action, single camera | 1 |
| 5s | One action with camera movement | 1-2 |
| 10s | Action sequence or simple narrative | 2-4 |
| 15s | Full story arc or commercial | 4-6 |

**Duration-action density mapping:**
- 1 second = 1 micro-action (a glance, a button press, a single step)
- 2-3 seconds = 1 complete action (opening a door, picking up an object, a single line of dialogue)
- 5 seconds = 1 action sequence (walking to the counter and ordering)
- 10 seconds = 1 scene (entering a room, looking around, reacting to something)
- 15 seconds = 1 narrative beat (setup > complication > reaction)

---

## 3. Proven Prompt Patterns

### 3.1 Multi-Shot Commercial (6 Cuts with Transitions)

**Scenario:** 15-second coffee brand commercial

```
Global Context:
Elements: @barista (young woman, dark apron, warm smile), @coffee_cup (branded ceramic mug)
Style: warm color grading, shallow depth of field, golden morning light

Shot 1 (3s) — Establishing:
Wide shot of a sunlit artisan coffee shop at dawn. Steam rises from espresso machines.
Warm amber tones. Camera: Slow Crane Down from ceiling to counter level.
Audio: Ambient cafe sounds, gentle acoustic guitar intro.

Shot 2 (2.5s) — Introduction:
Medium shot of @barista behind the counter, selecting beans from glass jars with
practiced precision. Camera: Push In from waist to hands.
Audio: Beans rattling in scoop, guitar continues.

Shot 3 (2s) — Process:
Extreme close-up of espresso pouring into @coffee_cup, crema forming in rich caramel swirls.
Camera: Static, macro lens feel.
Audio: Espresso machine hiss, liquid pour.

Shot 4 (2.5s) — Presentation:
Medium close-up of @barista placing @coffee_cup on a wooden tray, adding a small
biscotti beside it. Camera: Arc Shot, quarter circle around the tray.
Audio: Cup settling on wood, soft "here you go" from barista.

Shot 5 (2.5s) — Reaction:
Close-up of a customer's hands wrapping around @coffee_cup, lifting to lips.
Eyes close in appreciation. Camera: Push In to face.
Audio: First sip, satisfied exhale, guitar swells.

Shot 6 (2.5s) — Payoff:
Wide shot pulling back through the cafe window to exterior.
@coffee_cup visible through glass, warm interior contrasting cool morning exterior.
Camera: Pull Out through window frame.
Audio: Guitar resolves, street ambiance fades in.
```

### 3.2 Character Consistency Across 3 Scenes

**Scenario:** Same detective character in three environments

```
Global Context:
Elements: @detective (mid-40s woman, gray trench coat, dark pixie cut, scar on left
cheekbone, silver watch on right wrist)
Style: neo-noir, high contrast, desaturated with isolated warm highlights

Shot 1 (5s) — Office:
Medium shot. @detective sits at a cluttered desk under a single desk lamp.
She flips through a case file, pauses, taps a photo with her index finger.
Warm lamplight catches the scar on her left cheekbone.
Camera: Slow Push In from medium to medium close-up.
Audio: Paper shuffling, clock ticking, distant rain on window.

Shot 2 (5s) — Crime Scene:
Low-angle medium shot. @detective stands in a rain-soaked alley,
flashlight beam cutting through the drizzle. She crouches, examines
a piece of evidence with gloved hands. Her silver watch glints under the flashlight.
Camera: Low-Angle Tracking, circling from her left to her right.
Audio: Rain hitting pavement, distant sirens, flashlight click.

Shot 3 (5s) — Interrogation Room:
Over-the-shoulder shot from behind a suspect. @detective leans forward across
a steel table, both hands flat, staring directly at camera.
Harsh fluorescent overhead, her trench coat collar turned up.
Camera: Static, then Slow Push In over final 2 seconds.
Audio: Fluorescent hum, chair creak, her voice firm: "Tell me what you saw."
```

### 3.3 Product Showcase with 360-Degree Rotation

**Scenario:** Luxury headphone reveal

```
Elements: @headphones (matte black over-ear, brushed aluminum accents,
memory foam cushions, embossed logo on left cup)
Style: Apple-esque product photography, pure white cyclorama,
single key light with soft fill

Shot 1 (4s) — Reveal:
@headphones materialize from darkness into a pool of white light.
Camera: Static wide shot, light fades up from black to full illumination.
Audio: Low sub-bass drone building to clarity, subtle synthetic chime at full light.

Shot 2 (4s) — Hero Orbit:
@headphones suspended at eye level, rotating slowly. Camera: Full 360-degree Orbit,
smooth and continuous. Catch light reflections on aluminum accents.
Each material texture visible: matte plastic, brushed metal, stitched leather.
Audio: Soft ambient electronic pulse, material sounds (leather stretch, metal resonance).

Shot 3 (3.5s) — Detail:
Extreme close-up of @headphones ear cushion, then rack focus to the embossed
logo on the left cup. Memory foam compression visible.
Camera: Truck Right across cushion surface, Rack Focus at midpoint.
Audio: Near-silence, subtle ASMR-quality foam compression sound.

Shot 4 (3.5s) — In Use:
Medium shot, hands lift @headphones and place them on a model's head.
The model closes their eyes, subtle smile.
Camera: Push In from medium to close-up on the model's face.
Audio: Music fades in through the headphones (muffled then clear),
the model exhales contentedly.
```

### 3.4 Talking Head with Multilingual Dialogue (Omni)

**Scenario:** CEO announcement video in English with natural delivery

```
Elements: @ceo (man, 50s, navy suit, silver temples, reading glasses on desk)
Style: corporate but warm, shallow DOF, office background with city skyline

Single Shot (10s):
Medium close-up of @ceo seated at a mahogany desk. City skyline soft-focused
through floor-to-ceiling windows behind him. He looks directly at camera,
picks up his reading glasses, gestures naturally with his right hand while speaking.

Camera: Static for first 3 seconds, then imperceptible Slow Push In over remaining 7 seconds.

Dialogue: @ceo speaks in English, confident and measured tone with occasional warmth:
"We've spent the last eighteen months rebuilding from the ground up.
Today, I'm proud to announce that our platform is ready.
This isn't just an upgrade -- it's a completely new foundation."

Audio: Quiet office ambiance (air conditioning hum, distant city),
no background music. Voice is front-center, broadcast quality.

Negative prompt: Smiling excessively, cartoonish expressions,
robotic delivery, echo, reverb.
```

### 3.5 Action Sequence with Motion Brush

**Scenario:** Martial arts training sequence (Image-to-Video)

```
Source Image: Fighter in ready stance in a traditional dojo

Motion Brush Application:
- Right arm: Forward striking arc (fast, short path)
- Left arm: Guard position, small circular path (slow, defensive)
- Right leg: Sweeping arc low-to-high (medium speed)
- Torso: Slight rotation following arm movement
- Static Brush: Floor, walls, training equipment, background

Prompt:
"A martial artist in a white gi executes a rapid three-strike combination
in a wooden-floored dojo. Right fist jab, left block, right roundhouse kick.
Body rotates with each strike, weight shifting from back foot to front foot.
Fabric snaps with each movement. Dust motes visible in the shaft of
window light crossing the frame.

Camera: Low-Angle Tracking, slight upward tilt to emphasize power.
Audio: Sharp fabric snap on each strike, bare feet on wood,
exhaled kiai on the kick, ambient dojo silence between strikes."

Duration: 5 seconds
Mode: Professional
```

### 3.6 Social Media Story Format (9:16 Vertical)

**Scenario:** Fashion brand Instagram story

```
Global Context:
Aspect Ratio: 9:16
Elements: @model (woman, early 20s, braided hair, confident walk)
Style: high fashion editorial, saturated colors, urban backdrop

Shot 1 (2.5s):
Full-body shot of @model walking toward camera on a rain-wet city street at golden hour.
She wears a structured oversized blazer over a silk slip dress. Reflections on wet
pavement mirror neon signs. Camera: Static, she walks INTO the frame from medium-wide
to medium shot.
Audio: Heels on wet pavement, distant traffic, lo-fi beat drops in.

Shot 2 (2s):
Close-up of feet and shoes -- pointed-toe boots stepping through a shallow puddle.
Water splashes catch golden light. Camera: Low-angle, Static.
Audio: Splash, beat continues.

Shot 3 (2s):
Medium close-up, @model turns to profile, looks over shoulder at camera.
Wind catches braids. Confident half-smile. Camera: Whip Pan to catch the turn.
Audio: Hair movement whoosh, beat builds.

Shot 4 (2s):
Extreme close-up of blazer lapel, hand adjusts the collar.
Fabric texture visible. Camera: Rack Focus from hand to face reflected in
a shop window behind her.
Audio: Fabric rustle, beat peaks.

Shot 5 (2.5s):
Wide shot, @model continues walking away from camera down the street.
City lights reflect in puddles. She disappears into the urban glow.
Camera: Static, slight Zoom Out.
Audio: Beat fades, city ambiance takes over, heels recede.

Shot 6 (2s):
Black screen. White sans-serif text: "NEW COLLECTION" centered.
Below it: "LINK IN BIO".
Camera: Static. Text fades in.
Audio: Single bass note, then silence.
```

### 3.7 Before/After Transformation

**Scenario:** Home renovation transformation

```
Shot 1 (3.5s) — Before:
Wide shot of a dated kitchen: peeling wallpaper, yellowed countertops,
fluorescent tube lighting buzzing overhead. Camera begins at doorway and
executes Slow Push In through the space. Everything feels cramped and dim.
Camera: Push In, slow.
Audio: Fluorescent buzz, creaky floor, dripping faucet.

Shot 2 (1s) — Transition:
Quick Whip Pan to white, motion blur fills frame.
Camera: Whip Pan left.
Audio: Whoosh transition sound.

Shot 3 (3.5s) — After:
Same kitchen angle, completely transformed. White marble countertops,
pendant lights casting warm pools, open shelving with curated pottery.
Sunlight streams through a new bay window. Camera: Same Push In path
as Shot 1 but the space feels open and bright.
Camera: Push In, slow (matching Shot 1 speed exactly).
Audio: Warm silence, birdsong through open window, soft ambient tone.

Shot 4 (3s) — Detail Montage:
Three quick cuts within one shot block: brass faucet running clear water (1s),
hand running along marble edge (1s), pendant light switch turned on illuminating
the island (1s).
Camera: Static close-ups, sharp cuts.
Audio: Water running, fingertips on stone, light switch click + warm electrical hum.

Shot 5 (4s) — Hero Shot:
Wide shot from the bay window looking in. The full kitchen visible,
golden hour light flooding the space. A person sets a vase of fresh
flowers on the island and steps back to admire.
Camera: Slow Pull Out through the window to exterior.
Audio: Gentle piano note, satisfied sigh, birdsong continues.
```

### 3.8 Tutorial with Text Overlay

**Scenario:** Cooking technique tutorial

```
Elements: @chef (hands only, no face -- silver ring on right hand for continuity)
Style: overhead flat-lay cooking video, bright even lighting, clean white surface

Shot 1 (3s):
Overhead shot of a clean white marble cutting board. @chef's hands place
three tomatoes, a knife, and a small bowl of salt in frame.
Text overlay: "PERFECT DICE" appears in bold sans-serif at top of frame.
Camera: Static overhead (bird's eye).
Audio: Items placed on marble, soft kitchen ambiance.

Shot 2 (3s):
Same overhead angle. @chef's right hand picks up the knife.
Left hand steadies the tomato with a claw grip.
Makes three precise horizontal cuts without cutting through the base.
Camera: Static overhead, slight Zoom In to cutting area.
Audio: Knife through tomato (wet, crisp), ambient kitchen.

Shot 3 (3s):
Continued overhead. @chef rotates the tomato 90 degrees, makes vertical cuts.
Then slices across to release perfect small cubes onto the board.
Camera: Static overhead.
Audio: Rapid knife cuts, cubes tumbling onto marble.

Shot 4 (3s):
Side angle (camera shifts to 30-degree). @chef sweeps the diced tomato
into the bowl with the knife blade. Sprinkles salt from a pinch.
Camera: Arc Shot from overhead transitioning to 30-degree side angle.
Audio: Knife scraping board, salt granules falling.

Shot 5 (3s):
Close-up of the finished bowl of perfectly diced tomato.
@chef's hand with silver ring rests on the bowl edge.
Text overlay: "MISE EN PLACE" in matching font at bottom of frame.
Camera: Slow Push In to fill frame with the bowl.
Audio: Kitchen ambiance fades, subtle resolution tone.
```

### 3.9 Emotional Narrative with Music

**Scenario:** Father-daughter reunion at airport

```
Elements: @father (60s, gray beard, worn leather jacket, carrying a small gift bag)
         @daughter (30s, dark curly hair, winter coat)
Style: warm handheld documentary feel, naturalistic color, slight grain

Shot 1 (3s):
Wide shot of airport arrivals hall. Crowds move past.
@father stands alone near the barrier, scanning faces,
clutching the gift bag with both hands. Nervous energy.
Camera: Steadicam, gentle drift right, finding @father in the crowd.
Audio: Airport announcements muffled, crowd murmur, piano begins --
sparse, single notes, melancholic.

Shot 2 (2.5s):
Close-up of @father's face. Eyes searching, slight worry line.
He straightens his jacket collar. Swallows.
Camera: Static, shallow DOF, crowd blurred behind him.
Audio: Piano continues, crowd noise drops to near-silence
(subjective sound design -- we hear his focus).

Shot 3 (2.5s):
Medium shot from behind @father's shoulder. Through the crowd,
@daughter emerges pulling a suitcase. She hasn't seen him yet.
Camera: Push In over @father's shoulder toward @daughter.
Audio: Piano adds left-hand chords, building warmth.

Shot 4 (2s):
Close-up of @daughter's face. Recognition. Her eyes widen,
mouth opens, she drops the suitcase handle.
Camera: Static, snap focus on her face.
Audio: Suitcase handle clatter, sharp intake of breath, piano swells.

Shot 5 (2.5s):
Medium wide shot. @daughter runs. @father opens his arms.
They collide into a tight embrace. Gift bag crumples between them.
He lifts her slightly off the ground. Her hand grips the back of his jacket.
Camera: Slow-motion Tracking Shot, circling halfway around them.
Audio: Piano full crescendo, crowd ambient returns warmly,
a muffled "I missed you" from @daughter.

Shot 6 (2.5s):
Close-up of their intertwined hands. His weathered, hers smooth.
The crumpled gift bag visible. She pulls back to look at his face.
Both crying, both smiling.
Camera: Push In from hands to their faces, Rack Focus from hands to faces.
Audio: Piano resolves to a gentle final chord. Ambient airport returns fully.
Quiet laugh from @father.
```

### 3.10 Cinematic Landscape with Time Progression

```
Style: nature documentary, 4K, Alexa 65 look, 2.39:1 aspect ratio

Shot 1 (3s) — Pre-Dawn:
Wide establishing shot of a mountain valley. Stars visible,
first hint of blue on the eastern horizon. Mist sits heavy in the valley floor.
Camera: Static on tripod, completely locked off.
Audio: Deep silence, occasional owl call, distant stream.

Shot 2 (3s) — Dawn:
Same framing. Sky transitions to gold and peach. First sunlight hits the
highest peak. Mist begins to glow. Trees emerge as silhouettes.
Camera: Static, same framing as Shot 1 (time-lapse feel through cut).
Audio: Dawn chorus begins, stream more audible, wind stirs.

Shot 3 (3s) — Morning:
Same framing. Full daylight. Mist burns off in wisps. Shadows shorten.
A single eagle enters frame high, circling.
Camera: Static, then gentle Tilt Up to follow the eagle.
Audio: Full birdsong, wind through pine, eagle cry.

Shot 4 (3s) — Golden Hour:
New angle: low sun backlighting the valley. Long shadows stretch across
meadows. Wildflowers glow amber. A deer grazes at the meadow edge.
Camera: Slow Truck Right, parallax between foreground wildflowers and distant peaks.
Audio: Evening insects, gentle breeze, grass rustling.

Shot 5 (3s) — Dusk:
Return to original wide framing. Sky burns orange and purple.
First stars appear. Valley falls into blue shadow. The deer has gone.
Camera: Static, locked off (bookending Shot 1).
Audio: Silence returns, single cricket, stream in distance,
faint music: solo cello, one sustained note.
```

### 3.11 Product Unboxing Sequence

```
Elements: @product_box (matte black box, embossed gold logo, magnetic closure)
          @product (wireless earbuds in charging case, pearl white)
Style: MKBHD studio aesthetic, clean desk, single key light, dark background

Shot 1 (3s):
Close-up of @product_box on a dark wood desk. Hands enter frame,
fingertips on the lid edge. Camera: Static, shallow DOF.
Audio: Silence, then subtle fingertip-on-cardboard texture.

Shot 2 (3s):
Same framing. Hands lift the magnetic lid -- satisfying resistance,
then release. Interior tissue paper visible, @product nestled inside.
Camera: Slight Push In as lid opens.
Audio: Magnetic click release, tissue paper crinkle, reveal chime.

Shot 3 (3s):
Hands lift @product from the box. Charging case catches the key light,
pearl finish gleams. Thumb opens the case lid revealing earbuds.
Camera: Arc Shot, following the product up and around.
Audio: Case hinge click, subtle electronic power-on tone.

Shot 4 (3s):
Extreme close-up of single earbud. Rotating slowly between thumb
and forefinger. Surface detail, driver mesh, touch sensor visible.
Camera: Macro Orbit, quarter circle.
Audio: Near silence, subtle product design "hum."

Shot 5 (3s):
Medium shot, hand brings earbud to ear, inserts it. Person's expression
shifts to pleasant surprise as audio activates.
Camera: Push In to close-up on ear and expression.
Audio: Muffled room > music fades in clearly (perspective shift to listener's POV).
```

### 3.12 Dialogue Scene (Shot-Reverse-Shot, Omni)

```
Elements: @alex (man, 30s, flannel shirt, stubble)
          @maya (woman, 30s, denim jacket, short natural hair)
Style: indie film, natural window light, handheld feel

Shot 1 (2.5s):
Medium two-shot. @alex and @maya sit across from each other at a diner booth.
Coffee cups between them. Morning light from window on the left.
Camera: Static establishing, slight Steadicam drift.
Audio: Diner ambiance, plates, distant conversation.
@alex: "I got the call this morning."

Shot 2 (2.5s):
Close-up of @maya. She sets down her coffee cup. Processes what she heard.
Her expression shifts from casual to focused.
Camera: Static, shallow DOF.
Audio: Cup on saucer, ambiance continues.
@maya: "And?"

Shot 3 (2.5s):
Close-up of @alex. He looks down at his hands, then back up to meet her eyes.
Small smile breaking through despite himself.
Camera: Static, matching Shot 2 framing.
Audio: Fork clinks on a nearby table.
@alex: "We got it. The whole thing."

Shot 4 (2.5s):
Close-up of @maya. Shock, then joy. She covers her mouth with her hand,
eyes welling. She laughs.
Camera: Push In, slow.
Audio: Her laugh, bright and uncontrolled.
@maya: "Are you serious right now?"

Shot 5 (2.5s):
Medium two-shot (return to Shot 1 framing). @maya reaches across and grabs
@alex's hand on the table. Both laughing now. The diner continues around them.
Camera: Static, wider framing to include their environment.
Audio: Both laughing, diner ambiance, warm -- a perfect moment.

Shot 6 (2.5s):
Wide shot from outside the diner window. We see them through glass,
still holding hands, laughing. Morning light haloes the scene.
Camera: Slow Pull Out from window.
Audio: Their voices muffled through glass, street sounds take over,
gentle score enters -- acoustic guitar, hopeful.
```

### 3.13 Horror/Suspense Micro-Film

```
Style: elevated horror, cold blue-green palette, deep shadows, anamorphic lens

Shot 1 (3s):
Wide shot of a long hallway in an old house. Single bulb at the far end.
Wallpaper peeling. Floor creaks though nobody is visible.
Camera: Static, locked. Tension through stillness.
Audio: Deep silence, house settling sounds, distant wind, low sub-bass drone.

Shot 2 (2.5s):
Medium shot facing down the hallway. A door at the end is slightly ajar.
Faint light shifts behind it -- something moved.
Camera: Imperceptible Push In (barely noticeable but creates unease).
Audio: Drone intensifies, wood creak from behind the door.

Shot 3 (2s):
Close-up of a hand reaching for a doorknob. Fingers trembling.
Camera: Static, shallow DOF. Doorknob sharp, everything else soft.
Audio: Breathing -- shaky, close-mic'd. Heartbeat pulse in low frequencies.

Shot 4 (2.5s):
The door opens. Beyond it: complete darkness. Then two points of light
at eye height, deep in the darkness. Not reflections. They blink.
Camera: Slow Push In through the doorway into darkness.
Audio: Door hinge scream, all ambient sound cuts out. Pure silence for 1 second.
Then a single wet exhale from the darkness.

Shot 5 (2.5s):
Whip Pan to black. The hallway bulb behind us shatters.
Total darkness for a beat. Then emergency red light flickers on,
revealing the hallway is now different -- walls closer, ceiling lower.
Camera: Whip Pan 180 degrees, then Static in red light.
Audio: Glass shatter, electric pop, red light electrical buzz,
distant scraping sound approaching.

Shot 6 (2.5s):
Extreme close-up of an eye, wide with terror, red light reflected in the iris.
The pupil dilates. In the reflection of the eye: a shape moving in the hallway behind.
Camera: Macro Static, absolutely still.
Audio: Heartbeat accelerating, scraping closer, a whisper -- inaudible words.
Cut to black.
```

### 3.14 Fitness/Training Montage

```
Elements: @athlete (woman, 20s, athletic build, black compression gear, Dutch braid)
Style: Nike commercial aesthetic, high contrast, dramatic stadium/gym lighting

Shot 1 (2.5s):
Pre-dawn exterior. @athlete jogs toward camera on an empty track,
breath visible in cold air, stadium lights creating halos behind her.
Camera: Low-Angle Tracking, moving backward as she approaches.
Audio: Running shoes on track surface, heavy breathing, no music yet.

Shot 2 (2s):
Gym interior. Close-up of @athlete's hands chalking up, clapping excess.
White chalk cloud in dramatic side lighting.
Camera: Slow-motion Zoom In to hands.
Audio: Chalk clap echo, dust settling.

Shot 3 (2.5s):
Wide shot. @athlete performs a clean-and-jerk. Bar bends under weight,
she drives upward explosively. Full extension at the top. Holds.
Camera: Low-angle Static, 24fps real-time.
Audio: Bar rattle, grunt of effort, weights slam, crowd cheers (imagined/internal).

Shot 4 (2.5s):
Close-up of @athlete's face mid-effort. Sweat on brow, jaw clenched,
eyes focused on a point above camera. Vein visible at temple.
Camera: Static, shallow DOF. Background is blown-out gym lights.
Audio: Internal heartbeat, muffled gym sounds, breath through gritted teeth.

Shot 5 (2.5s):
Back to the track. @athlete sprints at full speed. Camera at ground level,
her shoes pound past frame. Slow motion captures muscle tension and power.
Camera: Ground-level Static, slow motion.
Audio: Slowed-down impact sounds, heartbeat syncs with footfalls,
orchestral score rises -- brass and percussion.

Shot 6 (2.5s):
@athlete stands at the track finish, hands on knees, then slowly stands upright.
Looks directly at camera. No smile -- just steel resolve. Stadium lights behind.
Camera: Slow Crane Up from ground level to eye level.
Audio: Score peaks and cuts. Single breath. Silence.
```

### 3.15 Real Estate Walkthrough

```
Style: luxury real estate video, warm afternoon light, wide-angle lens,
smooth Steadicam feel, HGTV production quality

Shot 1 (3s) — Exterior:
Wide shot of a modern hillside home. Clean lines, floor-to-ceiling glass,
infinity pool reflecting the sunset. Landscaped entrance with olive trees.
Camera: Slow Crane Down from aerial to eye level, approaching the front door.
Audio: Wind through trees, distant ocean, birdsong.

Shot 2 (2.5s) — Entry:
Camera pushes through the front door into a double-height foyer.
Polished concrete floors, statement pendant light, staircase with
glass balustrade. Natural light pours from above.
Camera: Push Through doorway, continuous Steadicam.
Audio: Door opens (quiet, premium hardware), footsteps on concrete echo.

Shot 3 (2.5s) — Living Area:
Open plan living room unfolds. Modular sofa facing the glass wall.
The view: Pacific coast, golden hour, waves breaking.
Camera: Truck Right, revealing the view progressively.
Audio: Muffled ocean becomes clear as camera faces the glass. Interior quiet.

Shot 4 (2.5s) — Kitchen:
Italian marble island, integrated appliances, pendant copper lights.
A hand runs along the marble edge (tactile detail). Fruit bowl, wine bottle.
Camera: Arc Shot around the island, ending facing the living room beyond.
Audio: Fingertips on stone, wine glass resonance as hand passes near it.

Shot 5 (2.5s) — Master Suite:
Camera enters the master bedroom through open double doors.
King bed with linen bedding. The far wall is entirely glass -- the view again.
A freestanding bathtub is visible through an open bathroom doorway.
Camera: Push In through doors, slow and steady.
Audio: Footsteps on carpet (sound shift from hard floor), linen rustle in breeze.

Shot 6 (2.5s) — Pool/Exterior:
Camera pushes through the bedroom glass door to the pool deck.
Infinity pool edge, the coast beyond. Sunset at peak color.
Camera: Push Through glass door to exterior, Crane Up to reveal the full view.
Audio: Glass door slides open, water lapping in pool, full ocean ambiance,
one seagull cry. Score: single piano chord, aspirational.
```

---

## 4. Prompt Optimization System

### 4.1 Shot-by-Shot Refinement Methodology

**Phase 1: Single-shot validation**
Before building a multi-shot sequence, validate each shot individually:
1. Generate Shot 1 alone as a single-shot generation
2. Evaluate: Does the scene match? Is the character right? Is the camera movement correct?
3. Refine the prompt until the single shot is perfect
4. Repeat for each shot
5. Only then combine into a multi-shot sequence

**Phase 2: Sequence assembly**
1. Combine validated single-shot prompts into multi-shot structure
2. Add global context (Elements, style reference)
3. Run the full sequence
4. Evaluate: Does continuity hold? Are transitions clean? Does the pacing work?

**Phase 3: Iterative polish**
1. Identify the weakest shot in the sequence
2. Modify ONLY that shot's prompt (change as little as possible)
3. Re-generate and compare
4. Repeat until all shots meet quality bar

**Regeneration strategy:** Generate 3-4 variations of the same prompt. Cherry-pick the best. Kling's output varies significantly between generations -- the same prompt can produce good and mediocre results.

### 4.2 Debugging Motion Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Subject drifts when should be static | No Static Brush applied; vague motion prompt | Apply Static Brush to anchored areas; add "stationary" or "still" to subject description |
| Motion too slow / subject barely moves | Prompt action too subtle for duration; speed parameter too low | Increase action specificity; extend motion path in Motion Brush; reduce duration |
| Motion too fast / action blurs | Too many actions for duration; speed parameter too high | Remove one action; extend duration; add "slowly" or "deliberately" to prompt |
| Limbs distort during movement | Complex pose transition; conflicting motion vectors | Simplify the action to fewer joint movements; use Motion Reference video instead of text |
| Camera and subject motion conflict | Camera moving in opposite direction to subject without intent | Align camera and subject directions, or explicitly prompt "camera tracks with subject" |
| Physics violations (floating, sliding) | Insufficient environmental context | Add ground plane description; specify "feet planted," "gravity," "weight" |
| Jittery / stuttering motion | Professional mode needed; prompt too complex for Standard | Switch to Professional mode; simplify to 2-3 main ideas; reduce element count |
| Unintended looping | Duration too long for the described action | Add progressive action (A then B then C) to fill duration; add camera movement to create temporal progression |

### 4.3 Character Consistency Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Face changes between shots | No Element reference; inconsistent descriptions | Bind character as Element; use identical descriptors in every shot prompt |
| Clothing changes | Reference image clothing not reinforced in prompt | Explicitly describe outfit in every shot even with Element bound |
| Body proportions shift | Different camera angles without Element binding | Use 3-4 multi-angle reference images; bind as Element |
| Hair style/color drifts | Ambiguous reference image; lighting changes | Use close-up face reference with clear hair; add "consistent [color] [style] hair" to each shot |
| Character looks different in close-up vs wide | Insufficient reference angles | Add both face close-up AND full body to Element references |
| Two characters merge/swap identity | Insufficient visual differentiation | Differentiate by 3+ traits (hair, clothing color, body type); use explicit spatial language |
| Character's age appears to shift | Lighting changes affecting perceived age | Lock lighting description across shots; specify age-related features explicitly |

**Nuclear option:** If consistency fails across text-to-video shots, switch to Image-to-Video. Generate the first frame as a Kling image with the character, then use I2V with Element binding for each subsequent shot. This provides the strongest anchor.

### 4.4 Audio Sync Quality Checklist (Omni)

Run through this checklist when Omni audio quality is off:

- [ ] **Dialogue length matches duration**: 15 words per 5 seconds is comfortable. Faster = mumbling risk.
- [ ] **Speaker identification is explicit**: "The man says" not "someone says." Ambiguity = wrong mouth moves.
- [ ] **Maximum 3 speakers per generation**: Beyond 3, voice distinction degrades.
- [ ] **Audio layers are prioritized**: Dialogue > SFX > Ambient > Music. Don't over-describe lower layers.
- [ ] **Language is specified**: Default is English. Explicitly state language for non-English dialogue.
- [ ] **Tone modifiers are present**: "Whispered," "shouted," "measured," "nervous" -- without these, delivery is flat.
- [ ] **SFX are tied to visual events**: "Glass breaks AS it hits the floor" not "glass breaking sound."
- [ ] **Music description is minimal**: "Soft piano" works. "A melancholic Debussy-inspired arpeggiated piano piece in C minor" steals processing budget from visuals.
- [ ] **Voice-bound Element is used**: For recurring characters, upload voice clip with Element for consistent voice.
- [ ] **Lip sync framing is adequate**: Lip sync works best in medium close-up or closer. Wide shots can't sync accurately.

### 4.5 Model Selection: Turbo > 3.0 > Omni Upgrade Path

| Scenario | Start With | Upgrade To | Why |
|----------|-----------|------------|-----|
| Rapid prototyping / concept testing | Turbo | -- | Turbo is 40% faster, 62% cheaper. Good enough for concept validation. |
| Social media short-form content | Turbo | 3.0 Standard if quality insufficient | Most social media doesn't need Professional quality. Turbo at 1080p is adequate. |
| Client-facing commercial work | 3.0 Standard | 3.0 Professional | Standard for drafts, Professional for delivery. Skip Turbo entirely. |
| Narrative with dialogue | 3.0 Professional | Omni | Start without audio to nail visuals. Add Omni for audio pass only when visuals are locked. |
| Character-driven story (multi-scene) | 3.0 Professional + Elements | Omni + Elements + Voice binding | Lock character visually first. Add voice binding in final Omni pass. |
| Product showcase (no dialogue) | 3.0 Standard | 3.0 Professional | Audio adds no value here. Save Omni credits. |
| Music video / audio-driven content | Omni from the start | -- | Audio is primary. Start with Omni to ensure sync from first generation. |
| Text-heavy content (tutorials, captions) | 3.0 Standard I2V | -- | Generate text as image, then I2V with Static Brush on text. Omni/Turbo unnecessary. |

**Credit cost reality check:**
- Standard mode: 10 credits / 5 seconds
- Professional mode: 35 credits / 5 seconds (3.5x Standard)
- Turbo: ~62% cheaper than Professional at comparable quality
- Multi-shot: Credits multiply by shot count (6-shot Professional = 6x cost)
- Omni audio adds ~20-30% to base generation cost
- Motion Brush/Motion Reference: Same credit cost as base mode

**Budget optimization strategy:**
1. Prototype in Turbo (burn rate: low)
2. Refine prompt in Standard (burn rate: medium)
3. Final render in Professional (burn rate: high)
4. Add audio in Omni only for final delivery (burn rate: highest)
5. Never iterate in Professional/Omni -- iterate cheap, render expensive

---

## 5. Kling-Specific Controls Reference

### 5.1 Camera Preset Quick Reference

**When to use each preset:**

| Emotional Intent | Primary Preset | Secondary Option |
|-----------------|----------------|-----------------|
| Building tension | Push In (slow) | Dolly Zoom |
| Revealing scale / context | Pull Out, Crane Up | Tilt Up |
| Following action | Tracking Shot | Steadicam |
| Showcasing an object | Orbit | Arc Shot |
| Creating energy | Whip Pan | FPV |
| Establishing authority | Low-Angle Static | Low-Angle Tracking |
| Creating vulnerability | High-Angle | Crane Down |
| Transitioning between scenes | Whip Pan, Push Through | Pull Through |
| Dialogue coverage | Static, Rack Focus | Steadicam (drift) |
| Dream/surreal quality | Dolly Zoom | Dutch Angle + Slow Orbit |
| Documentary realism | Steadicam | Handheld (slight shake via prompt) |
| Horror/unease | Static (locked) + Push In | Dutch Angle |

### 5.2 Motion Control Parameters

**Motion Brush parameters:**
- **Brush size**: 1-50px (small for details, large for body/environment)
- **Path length**: Longer = more movement. Match to duration.
- **Path direction**: Freehand. Use straight lines for linear motion, curves for arcs.
- **Trajectory count**: Up to 6 independent paths per generation.
- **Static Brush**: Binary -- locked or unlocked. No partial lock.

**Motion Reference parameters:**
- **Input video**: 3-30 seconds, MP4/MOV
- **Character image**: Paired with reference video
- **Transfer fidelity**: Full-body poses, gestures, hand movements, expressions, physics, timing
- **Best results**: When reference video subject's body type roughly matches target character

### 5.3 Scene Transition Types Between Shots

In multi-shot Custom Storyboard mode, transitions are controlled implicitly:

| Transition | How to Prompt It |
|-----------|-----------------|
| Hard cut | Default. Just write separate shot prompts. |
| Match cut | End Shot N and begin Shot N+1 with visually similar compositions (round object > round object). |
| Shot-reverse-shot | Prompt alternating character POVs in dialogue. Model handles 180-degree rule. |
| Jump cut | Same camera angle, skip forward in time. Describe same framing with time-shifted action. |
| L-cut (audio leads) | In Omni, prompt the next shot's audio to begin in the current shot. |
| J-cut (audio follows) | In Omni, let current shot's audio extend into the next shot description. |
| Whip transition | End Shot N with Whip Pan. Begin Shot N+1 from motion blur settling. |
| Fade to black | Prompt "scene fades to darkness" at end of shot. Begin next with "emerging from black." |
| Cross-dissolve | Not natively supported as a prompt directive. Use fade-out + fade-in as workaround. |

### 5.4 Subject Binding Parameters

**Element binding hierarchy (strongest to weakest):**
1. Video reference (Omni) + voice clip = strongest character lock
2. Multi-image Element (3-4 angles) + explicit prompt description
3. Single-image Element + explicit prompt description
4. Single-image Element alone
5. Text-only character description (no Element) = weakest, most prone to drift

**Binding syntax:**
- Use `@element_name` in prompt to reference bound Elements
- Position the `@` reference near the action: `"@detective examines the evidence"` not `"the person examines the evidence, reference: @detective"`
- Each Element can be referenced multiple times across shots
- Maximum 4 Elements active per generation

### 5.5 Credit Cost Optimization Matrix

| Setting | Credits (5s) | Credits (10s) | Credits (15s) | Quality Tier |
|---------|-------------|--------------|--------------|-------------|
| Standard | 10 | 20 | 30 | Acceptable for drafts |
| Professional | 35 | 70 | 105 | Client-ready |
| Turbo | ~13 | ~26 | ~40 | Fast iteration, good quality |
| Omni (with audio) | ~42 | ~84 | ~126 | Full production |
| Multi-shot 6x Professional | 210 | -- | 630 | Maximum cost |

**Cost-saving tactics:**
1. Use Turbo for all prompt iteration (save 62% vs Professional)
2. Use Standard for internal review rounds
3. Reserve Professional for final renders only
4. Use Omni only when audio is essential to the deliverable
5. Reduce shot count -- 4 well-crafted shots often outperform 6 rushed ones
6. Shorter durations iterate faster: use 5s for testing, extend to 10-15s only for finals
7. Generate 2 variations, not 4 -- beyond 2, you're usually fishing, not refining

---

## 6. Anti-Patterns

### 6.1 Prompts That Break Multi-Shot Coherence

**ANTI-PATTERN: Inconsistent character descriptions across shots**
```
BAD:
Shot 1: "A woman in a blue dress walks through a garden"
Shot 2: "She sits on a bench reading"    <-- "She" is ambiguous
Shot 3: "The girl looks up at the sky"   <-- "girl" != "woman"
```
```
GOOD:
Global: Elements @anna (woman, 30s, cobalt blue sundress, auburn hair in a loose bun)
Shot 1: "@anna walks through a sun-dappled garden, cobalt blue sundress flowing"
Shot 2: "@anna sits on a wrought-iron bench, opens a hardcover book"
Shot 3: "@anna looks up from the book at the sky, loose strands of auburn hair catching light"
```

**ANTI-PATTERN: Contradicting the previous shot's end state**
```
BAD:
Shot 2: "She sets the coffee cup on the counter"
Shot 3: "She takes a sip from the coffee cup"  <-- Cup was just put down
```
```
GOOD:
Shot 2: "She sets the coffee cup on the counter"
Shot 3: "She picks up the coffee cup from the counter and takes a sip"
```

**ANTI-PATTERN: Overloading a single shot**
```
BAD:
Shot 3 (2.5s): "She walks across the room, opens the window, leans out,
calls to someone below, waves, turns back, picks up the phone, and dials a number"
```
```
GOOD:
Shot 3 (2.5s): "She crosses to the window, pushes it open, and leans on the sill"
Shot 4 (2.5s): "She calls down to someone below and waves, then turns back to the room"
```

**ANTI-PATTERN: Changing style mid-sequence**
```
BAD:
Shot 1: Style: "warm golden hour lighting"
Shot 4: Style: "cool blue noir lighting"  <-- Unless time has passed, this breaks continuity
```

**ANTI-PATTERN: Conflicting camera directions**
```
BAD:
Shot 2: Camera: "Push In to close-up"
Shot 3: Camera: "Close-up tracking shot"  <-- If Shot 2 already ended on close-up,
                                              Shot 3 should start close-up.
                                              Don't prompt the close-up again as if establishing it.
```

### 6.2 Subject Reference Mistakes

**MISTAKE: Using different reference images for the same character across generations**
The model has no memory between generations. Each generation treats its Element references independently. Using photo A for Shots 1-3 and photo B for Shots 4-6 will produce two subtly different-looking characters.

**MISTAKE: Reference image conflicts with prompt**
If your reference shows a person wearing glasses, don't prompt "she removes her glasses" -- the model will struggle between the reference anchor (glasses on) and the prompt (glasses off). Either use a reference without glasses, or accept that this action may cause visual glitches.

**MISTAKE: Low-quality or cluttered reference images**
Reference images with busy backgrounds, multiple people, poor lighting, or low resolution confuse the Element system. The model may latch onto background elements or misidentify the subject.

**MISTAKE: Expecting Element consistency without explicit binding**
Describing a character with text alone (no Element reference) and expecting the same face across 6 shots. Text-only descriptions are interpreted freshly each shot. Always bind.

**MISTAKE: Too many Elements in one generation**
4 Elements is the maximum. Using 4 character Elements in a single shot with complex interactions will degrade all of them. Use 2 for reliable results, 3 for acceptable, 4 only when absolutely necessary.

### 6.3 Camera Presets That Conflict with Scene Action

| Conflict | Why It Fails | Fix |
|----------|-------------|-----|
| Orbit + character walking away | Camera circles while subject leaves frame -- camera loses subject | Use Tracking Shot instead, or have character stay in place |
| Whip Pan + subtle emotional beat | The speed of the whip overwhelms the quiet emotion | Use Slow Push In or Static with Rack Focus |
| Dutch Angle + product showcase | Tilted horizon makes products look unstable/cheap | Use Orbit or Push In with level horizon |
| Dolly Zoom on a flat scene | Vertigo effect requires foreground/background depth separation | Add foreground elements or choose a different preset |
| FPV + dialogue scene | First-person view during conversation is disorienting | Use over-the-shoulder or medium shot with Static |
| Crane Up + indoor low ceiling | Camera movement implies upward space that doesn't exist | Use Push In or Steadicam instead |
| Fast Zoom In + already close framing | Overshoots into extreme macro, loses subject | Start from wider framing, or reduce zoom speed |
| Tracking Shot + static subject | Camera moves laterally but subject isn't moving -- reveals nothing | Make subject move, or use Orbit/Push In |

### 6.4 Audio Prompts That Desync in Omni Mode

**DESYNC: Dialogue too long for shot duration**
Kling Omni will attempt to fit all dialogue into the shot duration. If you script 30 words for a 2-second shot, the speech will be unnaturally fast or truncated. Rule: ~3 words per second of dialogue.

**DESYNC: Sound effect timing without visual anchor**
```
BAD: "Explosion sound at the 3-second mark"   <-- Kling doesn't parse timestamps
GOOD: "An explosion erupts as the car hits the barrier"  <-- Tied to visual event
```

**DESYNC: Multiple simultaneous sound effects**
Prompting 4+ distinct SFX in the same 2-second window causes audio mudding. Prioritize 1-2 SFX per shot.

**DESYNC: Music description overriding dialogue clarity**
```
BAD: "She whispers 'I love you' while a full orchestral score with French horns,
timpani, and violin tremolo fills the scene"
GOOD: "She whispers 'I love you' over a soft, sustained string chord"
```

**DESYNC: Language mismatch**
Prompting English dialogue but not specifying language when the scene context suggests another locale. If your scene is set in Tokyo, explicitly state "speaks in English" or the model may default to Japanese.

**DESYNC: Emotion mismatch between voice and action**
Prompting "calmly says" while the character is visually running in panic. The model will attempt both and neither will look right. Align vocal tone with physical action.

---

## Appendix: Quick-Reference Prompt Template

Copy and modify this template for any Kling 3.0 / Omni generation:

```
=== KLING PROMPT TEMPLATE ===

Model: [Turbo / 3.0 Standard / 3.0 Professional / Omni]
Mode: [Text-to-Video / Image-to-Video]
Duration: [3s / 5s / 10s / 15s]
Aspect Ratio: [16:9 / 9:16 / 1:1 / 2.39:1]
Shots: [1-6]

Elements:
@character_1: [description + reference image]
@character_2: [description + reference image]
@style: [style reference image]
@product: [product reference image]

Global Context:
[Setting, time of day, overall mood, color palette, lighting style]

--- Shot 1 (Xs) ---
Framing: [Wide / Medium / Close-up / ECU]
Scene: [What is visible in this shot]
Subject: [@character doing what action]
Camera: [Preset + Speed + Notes]
Audio: [Dialogue in quotes] + [SFX] + [Ambient] + [Music]

--- Shot 2 (Xs) ---
[Same structure]

--- Shot N (Xs) ---
[Same structure]

Negative Prompt:
[Smiling (if unwanted), morphing, distortion, extra fingers, blurry text,
watermark, low resolution, cartoonish, rapid camera shake]
```

---

*This document covers Kling 3.0, 3.0 Omni, and Turbo as of March 2026. Kling's capabilities evolve rapidly -- verify specific feature availability against the current version at [klingai.com](https://klingai.com).*


---
## Media

### Platform References
- **kling**: [Docs](https://klingai.com) · [Gallery](https://klingai.com/explore)
- **vidu**: [Docs](https://www.vidu.studio) · [Gallery](https://www.vidu.studio/explore)
- **wan**: [Docs](https://github.com/Wan-Video/Wan2.1) · [Gallery](https://wan-video.github.io)

### Related Videos
- [Kling AI Video Generator Tutorial - Complete Guide](https://www.youtube.com/results?search_query=kling+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `kling`
- [Kling 3.0 - Motion Brush & Advanced Features](https://www.youtube.com/results?search_query=kling+3.0+motion+brush+advanced+tutorial) — *Credit: AI Tutorials on YouTube* `kling`
- [Vidu AI Video Generator Tutorial](https://www.youtube.com/results?search_query=vidu+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `vidu`
- [Vidu - Fast AI Video Generation Review](https://www.youtube.com/results?search_query=vidu+ai+fast+video+generation+review) — *Credit: AI Reviews on YouTube* `vidu`
- [Wan 2.1 Video Generation - Self-Hosted Tutorial](https://www.youtube.com/results?search_query=wan+2.1+video+generation+self+hosted+tutorial) — *Credit: AI Self-Hosted on YouTube* `wan`
- [Wan VACE - Video Editing with AI](https://www.youtube.com/results?search_query=wan+vace+video+editing+ai+tutorial) — *Credit: AI Video on YouTube* `wan`

> *All video content is credited to original creators. Links direct to source platforms.*
