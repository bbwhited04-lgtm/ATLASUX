# Sora 2 / Sora 2 Pro: Advanced Prompt Engineering Reference

**Level:** Advanced (assumes familiarity with basic Sora prompting)
**Last Updated:** 2026-03-18
**Covers:** Sora 2, Sora 2 Pro (API and web interface)

---

## 1. Sora 2 Prompt Architecture

### 1.1 Optimal Prompt Length and Structure

Sora 2 accepts prompts up to approximately 2,000 characters. However, length alone is not the lever -- placement and density matter more.

**The 500-Character Rule:** Place your primary visual instructions within the first 500 characters. The model's attention to prompt content follows a decay curve -- details buried past the midpoint are increasingly likely to be deprioritized or ignored entirely. This is "semantic drift," and it is the single most common cause of prompts that partially work.

**Optimal range:** 80-150 words for a single shot. Below 60 words, you are leaving too much to the model's improvisation. Above 200 words, you risk contradictions and diluted focus.

**Structure hierarchy (in order of model attention):**

1. Camera setup and framing (processed first, establishes spatial context)
2. Subject description and action (what the model needs to render)
3. Lighting and color palette (visual style layer)
4. Audio and dialogue (processed in parallel with visuals via DiT architecture)
5. Style references and film emulation (modifier layer)

```
[Camera] Low-angle tracking shot, 85mm lens, f/2.0, shallow depth of field.

[Subject] A woman in a red wool coat walks briskly through a rain-soaked
Tokyo alley at night. Her reflection ripples across the wet pavement.
She pauses, glances over her shoulder.

[Light] Neon signs cast alternating pink and blue light across her face.
Practical lights only -- no fill. Deep shadows on the far wall.

[Style] Shot on Kodak Vision3 500T. Wong Kar-wai color palette.
Halation on neon highlights.

[Audio] Rain pattering on corrugated metal awnings. Distant city traffic.
Her heels clicking on wet stone, each step distinct.
```

### 1.2 How Sora Interprets Prompts Differently from Image Models

Image models (DALL-E, Midjourney, Stable Diffusion) treat prompts as a description of a single frozen moment. Sora treats prompts as a description of a **world that must be simulated forward through time.** This distinction changes everything:

- **Verbs matter more than adjectives.** Image models thrive on stacked modifiers ("ethereal, luminous, dreamy"). Sora thrives on precise action verbs ("lunges," "stumbles," "pivots"). Adjective-heavy prompts produce static, lifeless video.
- **Spatial relationships must be physically plausible.** You cannot place a character "floating above" a table without specifying the physics that allow it. Sora will attempt to simulate the physics you describe -- or invent physics if you leave gaps.
- **Time is a first-class dimension.** Every element in your prompt exists on a timeline. If you describe a character holding a coffee cup but never mention them putting it down, the cup persists. Sora maintains object permanence within a clip.
- **Camera is a physical object.** The camera exists inside Sora's world simulation. Camera movement descriptions are interpreted as physical constraints on a virtual rig, not abstract framing instructions.

### 1.3 The World Simulator Mental Model

Sora is not a "video generator." It is a learned world simulator that happens to output video frames. This mental model shift unlocks advanced prompting.

**What "world simulator" means in practice:**

- The model maintains an internal 3D-consistent scene representation. Objects have mass, surfaces have materials, light sources cast shadows and reflections.
- Physics are emergent from training data, not hard-coded. This means the model "knows" that silk moves differently from denim, that water refracts light, that a heavy object accelerates downward -- but only to the extent these behaviors appeared in its training corpus.
- You are not describing a video. You are describing initial conditions for a simulation. The more precisely you define those conditions, the more control you have over the simulation's output.

**Practical implication:** Instead of "a ball bouncing," write "a red rubber ball dropped from waist height onto a polished concrete floor. It rebounds to approximately 60% of drop height, with each successive bounce lower and faster. The ball's shadow sharpens as it nears the floor." You are defining the simulation parameters.

### 1.4 Temporal Description: Beginning, Middle, End

Sora processes temporal cues through sequencing language. The model maps temporal keywords to positions along the clip's duration.

**Effective temporal markers:**

- **Beginning (0-20% of clip):** "Opens with," "Starting from," "Initially," "At first"
- **Transition (20-50%):** "Then," "As soon as," "Next," "Gradually," "Shifting to"
- **Climax (50-80%):** "Suddenly," "At the peak," "The moment when"
- **Resolution (80-100%):** "Finally," "Coming to rest," "Settling into," "Ending on"

**Example with temporal beats:**

```
A paper airplane launches from a child's hand in a sunlit park. It climbs
steeply, catching a gust of wind. At its apex, it stalls for a beat,
then banks left and descends in a slow spiral. It finally skids to a stop
on a picnic blanket, knocking over a plastic cup.
```

**Duration affects temporal resolution:** In a 4-second clip, "first... then... finally" maps to roughly 1.3s per beat. In a 20-second clip, you can describe 6-8 sequential beats with smooth transitions between them. Match your temporal complexity to your clip duration.

---

## 2. Advanced Techniques

### 2.1 Physics-Aware Prompting

Sora's world simulation responds to physics descriptions -- but you must describe observable behaviors, not abstract forces. The model does not understand "apply 9.8 m/s^2 gravity." It understands "the ball falls and accelerates, hitting the ground with a thud."

**Material properties that Sora recognizes:**

| Material Keyword | What Sora Simulates |
|---|---|
| "rubber" | Elastic deformation, high rebound, matte surface |
| "glass" | Transparency, refraction, sharp shattering |
| "silk" / "chiffon" | Fluid draping, light catch, gentle billowing |
| "metal" / "steel" | Reflectivity, rigidity, resonant impact sounds |
| "water" | Surface tension, splash dynamics, refraction |
| "wood" | Grain texture, rigid but not reflective, dull impact |
| "smoke" / "fog" | Volumetric diffusion, light scattering |
| "ice" | Low friction, transparency, cracking patterns |

**Friction and surface interaction:**

- "Low friction ice surface" -- sliding, gliding, no grip
- "High friction rubber grip" -- sudden stops, squealing contact
- "Frictionless glide across polished marble" -- smooth, continuous motion

**Gravity and weight cues:**

```
A bowling ball and a tennis ball are dropped simultaneously from shoulder
height onto a wooden floor. The bowling ball hits first with a deep thud,
barely bouncing, leaving a dent. The tennis ball rebounds chest-high with
a hollow pop, bouncing three more times with diminishing height.
```

**Fluid dynamics:**

```
A slow stream of honey pours from a tilted jar onto a stack of pancakes.
It pools, folds over itself, then slowly cascades down the sides.
The viscosity is visible -- thick, reluctant, catching morning light
as it stretches into a thin golden thread.
```

**Cloth simulation:**

Specify fabric weight and wind speed together. "Silk fabric billowing in a 5 mph breeze" produces fundamentally different motion than "heavy canvas tarp in a 5 mph breeze." Without both parameters, Sora defaults to generic cloth movement that looks uncanny.

**Physics reality-check anchors (append to any physics-heavy prompt):**

```
Realistic weight -- no floating objects. Consistent gravity direction.
No instant acceleration. Momentum preserved across impacts.
```

### 2.2 Temporal Sequencing

The key to temporal sequencing is linking cause to effect. Sora excels when you describe not just "what happens next" but the causal chain that connects events.

**Weak temporal prompt:**
```
A man walks to a door. He opens it. He walks through.
```

**Strong temporal prompt:**
```
A man approaches a heavy oak door, his footsteps echoing in the stone
corridor. He reaches for the iron handle, wraps his fingers around it,
and pulls. The door resists, then swings open with a low creak,
revealing a sunlit courtyard beyond. He steps through the threshold,
squinting as his eyes adjust to the brightness.
```

The strong version gives Sora causality chains: approach -> reach -> grasp -> pull -> resistance -> swing -> reveal -> step -> reaction. Each beat flows from the previous one.

**Multi-beat action template:**

```
Beat 1 (0-3s): [Setup] -- Establish the scene and initial state
Beat 2 (3-6s): [Trigger] -- An event disrupts the equilibrium
Beat 3 (6-9s): [Reaction] -- Characters/objects respond to the trigger
Beat 4 (9-12s): [Resolution] -- New equilibrium or cliffhanger
```

**Limit:** Do not exceed 3-4 consecutive logical steps in a single clip. Beyond that, Sora loses causal coherence. For longer sequences, break into multiple clips and stitch in post-production.

### 2.3 Camera Choreography

Sora 2 Pro treats camera instructions as physical constraints on a virtual rig. Advanced camera work requires specifying both the movement type and its physical parameters.

**Camera movement precision vocabulary:**

| Movement | Description | When to Use |
|---|---|---|
| Dolly in/out | Smooth forward/backward on tracks | Intimate reveal, building tension |
| Truck left/right | Lateral movement, parallel to subject | Tracking alongside moving subject |
| Boom up/down | Vertical crane movement | Establishing scale, power dynamics |
| Pan | Horizontal rotation, fixed pivot | Surveying a scene, following action |
| Tilt | Vertical rotation, fixed pivot | Revealing height, top-to-bottom |
| Arc | Circular movement around subject | 360-degree character reveal |
| Steadicam follow | Smooth walking movement behind/beside | Following through environments |
| Handheld | Organic, imperfect micro-shake | Documentary realism, urgency |
| Crash zoom | Rapid zoom-in on subject | Shock, comedy emphasis |
| Whip pan | Extremely fast horizontal pan | Scene transition, energy |
| Rack focus | Shift focus plane, foreground to background | Drawing attention, revealing layers |

**The One-Move Rule:** Pair one camera move with one subject action per shot. "Dolly in while the subject turns to face camera" works. "Dolly in while panning left while the subject turns and another character enters from the right" fragments into visual noise. If you need complex choreography, use multiple shots.

**Advanced camera prompt example:**

```
[Camera] Steadicam follow, 24mm wide lens, f/4.0, deep focus.
The camera floats 6 inches behind and to the right of the subject's
shoulder, matching his pace exactly. As he turns a corner, the camera
swings wide to reveal the alley ahead before settling back into position.
Subtle handheld drift -- not locked-off, not shaky.
```

**Lens choice affects psychology:**

- 16-24mm: Environmental dominance, subject feels small in the world
- 35-50mm: Neutral, "human eye" perspective, balanced
- 85-135mm: Subject isolation, background compression, intimacy
- 200mm+: Extreme compression, surveillance/voyeur feel, flattened depth

### 2.4 Lighting Mastery

Lighting is the most underspecified element in most Sora prompts. Vague lighting ("well-lit," "dramatic lighting") produces generic results. Precise lighting produces cinematic results.

**Lighting recipe format:**

```
[Lighting]
Key: [Source type], [Direction], [Intensity], [Color temperature]
Fill: [Source type], [Direction], [Ratio to key]
Rim/Back: [Source type], [Direction]
Practicals: [In-scene light sources]
Ambient: [Overall environmental light]
```

**Example -- moody office interrogation:**

```
[Lighting]
Key: Single tungsten Fresnel, camera-left, 45 degrees above, hard light.
Fill: None -- let shadows go black.
Rim: Cool daylight fluorescent strip, directly above, creating a thin
edge light on shoulders and top of head.
Practicals: Desk lamp (warm, 2700K) illuminating scattered papers.
Monitor glow (cool blue) on the detective's face from below.
Ambient: Near zero -- the room beyond the desk falls to black.
```

**Time-of-day shorthand (Sora recognizes these):**

- "Golden hour" -- warm, low-angle, long shadows, orange-amber
- "Blue hour" -- cool, diffused, twilight sky, no hard shadows
- "Harsh midday sun" -- overhead, high contrast, short shadows
- "Overcast" -- soft, even, no directional shadows, flat
- "Moonlight" -- cool blue-silver, low intensity, long shadows

**Volumetric effects:**

Sora handles volumetric fog and haze well when you specify the light source interacting with it. "Fog" alone produces a flat haze. "Fog pierced by a single shaft of warm light from a high window" produces a volumetric beam you can almost touch.

**Lens flare and optical effects:**

Specify these as physical phenomena, not post-processing. "Sunlight catches the anamorphic lens, producing horizontal blue flares across the frame" works because it describes a physical interaction between light and glass.

### 2.5 Audio Integration (Sora 2 Native)

Sora 2 generates audio alongside video using the same DiT architecture. Audio is not post-applied -- it is planned simultaneously with visuals, resulting in lip-sync accuracy within 3 frames and physics-based sound design.

**Three audio layers to specify:**

1. **Foreground:** Primary sounds -- dialogue, featured sound effects
2. **Mid-ground:** Secondary activity -- other characters, nearby machines, traffic
3. **Background:** Ambient bed -- room tone, weather, distant environment

**Dialogue prompting rules:**

- Place dialogue in a dedicated `[Dialogue]` block, separated from visual description
- Label speakers consistently throughout the project
- Keep individual lines under 15 words for reliable lip-sync
- A 4-second clip accommodates 1-2 short exchanges maximum
- An 8-second clip supports 3-4 lines of natural conversation
- Long speeches will desync -- break them across multiple clips
- Specify delivery with parenthetical direction: `(whispers)`, `(shouting over wind)`, `(deadpan)`

**Physics-based sound design:**

Sora 2 generates sounds that match material interactions. A glass hitting tile sounds different from a glass hitting wood. Exploit this by specifying the materials involved in any impact, scrape, or collision.

```
[Audio]
The chef's knife hits the wooden cutting board with a rhythmic thock-thock-thock.
A pot of water simmers on the gas stove -- low rumble, occasional bubble burst.
The kitchen's tile floor produces sharp, clear footstep echoes.
Distant conversation from the dining room, muffled by the swinging door.
```

**Acoustic environment description:**

```
[Audio]
Cathedral interior acoustics -- 4-second reverb tail on every sound.
Footsteps on stone floor echo and multiply.
A whispered prayer becomes audible only because of the silence surrounding it.
Outside, rain against stained glass, filtered to a soft patter by the thick walls.
```

### 2.6 Character Persistence

Maintaining consistent character appearance across multiple prompts is one of the hardest problems in AI video generation. Two strategies work reliably with Sora 2.

**Strategy 1: The Character Passport**

Write a hyper-specific character description once. Reuse it verbatim in every prompt that features that character.

```
CHARACTER PASSPORT -- "Detective Mara"
A woman in her late 40s. Sharp jaw, deep-set hazel eyes, a thin scar
running from her left ear to her jawline. Dark brown hair pulled into
a tight, low bun with visible gray at the temples. She wears a
charcoal wool overcoat over a black turtleneck. Silver watch on her
left wrist, no other jewelry. Her posture is rigid, shoulders squared.
Her expression defaults to skeptical -- one eyebrow slightly higher
than the other.
```

**Key to passport effectiveness:** Include asymmetric, unique identifiers. "Faint chickenpox scar on left temple," "small silver hoop in right ear only," "slightly crooked nose from an old break." These unique anchors give Sora consistent reference points that generic descriptors ("attractive woman, brown hair") cannot provide.

**Strategy 2: Image Reference Anchoring**

Use your best generation as an image input for subsequent prompts. The image locks the first frame, and your text prompt defines what happens next. This is the most reliable method for multi-shot character consistency.

**Workflow:**
1. Generate a hero shot of the character with a detailed passport prompt
2. Screenshot or download the best result
3. Use that image as the input reference for all subsequent shots of that character
4. In your text prompt, reference "the woman in the image" and describe only the new action/setting

**Consistency across lighting changes:**

When moving a character between scenes with different lighting, maintain consistency by specifying which elements are intrinsic to the character versus environmental:

```
Same Detective Mara from the character passport. Now in an interrogation
room. The lighting has shifted to harsh overhead fluorescent, but her
wardrobe, scar, and hairstyle are identical to the previous scene.
Her expression has hardened.
```

### 2.7 Emotional Tone Control

Sora responds to emotional tone through environmental description, not explicit mood labels. "Make it sad" does nothing. Describing a sad world does everything.

**Tone through environment (show, don't tell):**

| Target Emotion | Environmental Cues |
|---|---|
| Melancholy | Overcast sky, muted colors, slow movements, empty spaces, autumn leaves |
| Tension | Tight framing, shallow DOF, low-angle, shadows, silence broken by single sounds |
| Joy | Warm light, wide shots, bright saturated colors, fast/dynamic movement |
| Dread | Dutch angle, underexposed, cold palette, fog, distant sounds growing closer |
| Nostalgia | Warm film grain, soft focus, golden hour, slow dolly, vintage color grade |
| Awe | Extreme wide shot, dramatic scale contrast, low angle looking up, sweeping music |

**Tone through pacing:**

- Slow dolly, long takes, minimal cuts = contemplative, serious
- Quick movements, multiple subjects, dynamic camera = energetic, urgent
- Static camera, single subject, silence = intimate, vulnerable

**Tone through color science:**

```
[Grading] Desaturated teal shadows, muted warm highlights,
crushed blacks at 15 IRE. Fuji Eterna 250D emulation.
The overall palette feels like a faded photograph found in a drawer.
```

---

## 3. Proven Prompt Patterns

Each prompt below is a complete, production-ready example. Explanations follow each prompt identifying why specific elements work.

### 3.1 Cinematic Establishing Shot

```
[Camera] Slow drone descent from 200 feet, 24mm lens, f/8, deep focus.
The camera drops through a layer of morning mist, revealing a coastal
fishing village clinging to a rocky cliff. The descent takes the full
10 seconds, ending at rooftop level where we see smoke rising from
chimneys and fishing nets draped over stone walls.

[Light] Pre-dawn blue hour transitioning to first golden light cresting
the eastern horizon. The sea reflects steel-gray sky. Warm tungsten
glows from cottage windows.

[Audio] Wind across the microphone, seagulls at a distance, the low
rumble of surf against the base of the cliffs. A church bell rings twice,
muffled by distance and fog.

[Style] Shot on ARRI Alexa 65, ARRI Signature Prime lenses.
Ungraded LOG footage feel with lifted shadows.
```

**Why it works:** Single camera move (descent) paired with a single reveal (village). The fog layer gives Sora a natural visual transition point. Pre-dawn timing provides a dramatic lighting shift within the clip. Audio layers are described at three distances (close wind, mid seagulls, far surf/bell).

### 3.2 Character Dialogue Scene

```
[Camera] Medium two-shot, 50mm lens, f/2.8. Static camera on a tripod.
Shallow enough to separate the subjects from the blurred cafe background.
Occasional subtle reframe as speakers shift weight.

[Subject] Two women in their 30s sit across from each other at a small
marble cafe table. One wears a navy blazer with her hair in a ponytail.
The other wears a cream knit sweater, hair loose. Two espresso cups
between them, half-empty. The ponytail woman leans forward. The sweater
woman sits back, arms crossed.

[Light] Warm afternoon light through a large window, camera-right.
Soft shadows. The background is a warm bokeh of amber pendant lights
and dark wood shelving.

[Dialogue]
Ponytail: "I read the whole thing. Every page."
Sweater: (looks away, then back) "And?"
Ponytail: (pause, sets down her cup) "You should have told me sooner."

[Audio] Cafe ambience -- espresso machine hissing in the background,
quiet conversation from other tables, a spoon clinking against ceramic.
```

**Why it works:** Static camera lets the model focus compute on facial expressions and lip-sync. Characters are distinguished by clear wardrobe descriptors that serve as visual anchors. Dialogue is brief (3 lines for an 8-second clip). Parenthetical stage directions guide body language. Audio describes the acoustic space without competing with dialogue.

### 3.3 Product Commercial

```
[Camera] Macro shot, 100mm lens, f/2.8. Slow 180-degree arc around the
product at table level. The rotation takes the full 8 seconds.

[Subject] A matte black ceramic coffee mug sits on a raw concrete
countertop. Steam rises from the surface of the coffee in a lazy,
twisting column. Condensation beads on the exterior of the mug.
A single coffee bean rests beside the mug on the concrete.

[Light] Single large softbox, camera-left, creating a gradient of light
across the mug surface. A subtle rim light from behind catches the steam.
The background is a smooth, dark gradient -- no distractions.
The concrete texture is emphasized by raking side light.

[Audio] Near-silence. The quiet, close-mic sound of steam rising.
A single gentle ceramic tap as the mug shifts slightly on the counter.

[Style] Commercial product photography aesthetic. Clean, minimal.
ARRI Alexa Mini, Master Prime lenses. 4K, sharp detail.
```

**Why it works:** Single subject, single camera movement (arc), single lighting setup. This constraint lets Sora deliver maximum detail and realism. Material descriptions (matte black ceramic, raw concrete, condensation) trigger the physics simulator to render surfaces convincingly. The macro focal length and slow rotation provide visual interest without asking the model to handle complex action.

### 3.4 Nature / Landscape

```
[Camera] Locked-off tripod shot, 35mm lens, f/11, maximum depth of field.
Timelapse compression: 2 hours of real time compressed into 8 seconds
of video.

[Subject] A wide valley view from a mountain ridge. In the foreground,
alpine wildflowers sway gently. The middle ground is a pine forest canopy.
The background is a snow-capped mountain range. Clouds build, thicken,
and roll across the peaks as the light shifts from afternoon gold to
evening purple.

[Light] The sun tracks from 45 degrees to the horizon over the course
of the clip. Shadows lengthen dramatically across the valley floor.
The snow peaks shift from white to pink to deep orange.

[Audio] Wind in alpine grass, building and fading. Distant thunder as
the clouds thicken. No human sounds. The scale of the landscape is
reflected in the spaciousness of the audio.

[Style] National Geographic aesthetic. Hyper-real, saturated color.
8K large-format sensor look with extraordinary depth.
```

**Why it works:** "Timelapse compression" is a temporal instruction Sora understands -- it will simulate accelerated time rather than real-time playback. Describing the sun's arc gives the model a clear lighting trajectory. Three distinct depth planes (wildflowers / forest / mountains) create layered visual interest. The "no human sounds" instruction keeps the audio pristine.

### 3.5 Action Sequence

```
[Camera] Handheld, 35mm lens, f/2.8. The camera is positioned at chest
height, running alongside the subject. Slight motion blur at 1/48 shutter.
The camera operator struggles to keep up, creating organic framing drift.

[Subject] A parkour runner in black athletic wear sprints across a
concrete rooftop at dusk. He vaults over a ventilation unit, lands in
a roll, springs up, and leaps across a 6-foot gap to the next building.
He lands on the far edge, absorbs the impact with bent knees, and
immediately transitions into a sprint.

[Light] Dusk sky -- deep blue with an orange band on the horizon.
The rooftop is lit by the sky and the warm glow of the city below.
No artificial lighting on the subject -- he's lit by ambient city light.

[Audio] Heavy breathing, sneakers slapping concrete, the thud of landing,
wind rushing past the microphone. The city hums 10 stories below.
No music.

[Style] Shot on Sony FX6, handheld rig. Urban documentary feel.
Slight cyan push in shadows, warm highlights. No color grading --
natural, gritty.
```

**Why it works:** The handheld camera with "organic framing drift" gives Sora permission to produce slightly imperfect framing, which paradoxically looks more realistic than locked-off perfection. The parkour sequence is described as a causal chain (sprint -> vault -> land -> roll -> spring -> leap -> land -> absorb -> sprint). Each action leads to the next. "No music" and "no artificial lighting" are exclusion instructions that prevent Sora from adding unwanted elements.

### 3.6 Talking Head / Interview

```
[Camera] Medium close-up, 85mm lens, f/1.8. Subject centered in frame
with 10% headroom. Static tripod. The background is a smooth bokeh
of bookshelves and warm light.

[Subject] A man in his 50s with salt-and-pepper beard, wire-frame glasses,
and a dark blue button-down shirt. He speaks directly to camera with
natural hand gestures. His expression is warm and animated -- he is
explaining something he is passionate about. He occasionally glances
down as if gathering his thoughts, then looks back to camera.

[Dialogue]
Speaker: "The thing most people get wrong about design is they think
it's about how something looks. But design is really about how
something works. The best designs are invisible."

[Light] Large softbox at 45 degrees camera-right, providing soft key
light. A hair light from behind separates him from the background.
The bookshelves behind him are lit with warm practicals.

[Audio] Clean studio recording. No room echo. His voice is warm,
mid-range, conversational. The faintest hum of an air conditioner
in the background.
```

**Why it works:** The 85mm at f/1.8 produces beautiful subject isolation that Sora renders well. "Speaks directly to camera" establishes eye line. Dialogue is kept to 3 sentences for an 8-second clip -- within the reliable sync window. The "glances down then back to camera" instruction gives the model a natural beat that prevents the uncanny "constant stare" artifact.

### 3.7 Time-Lapse / Transition

```
[Camera] Locked-off overhead shot looking straight down at a desk surface.
12 hours compressed into 10 seconds. The frame never moves.

[Subject] A blank white sheet of paper on a wooden desk. A hand enters
frame holding a pencil and begins sketching a portrait. The drawing
progresses from rough contour lines to detailed shading. Eraser shavings
appear and are brushed away. The hand switches from pencil to fine pen
for details. Coffee cups appear and disappear at the edge of frame.
Natural light shifts from morning blue to afternoon gold to evening amber
across the desk surface.

[Audio] The scratch of pencil on paper, accelerated. Eraser strokes.
The clink of a coffee cup being set down. Time-compressed ambient room
sounds -- birds transitioning to evening crickets.

[Style] Clean overhead process video aesthetic. Warm, inviting.
High detail on the paper texture and pencil marks.
```

**Why it works:** Overhead locked-off is the simplest camera setup, letting the model dedicate all compute to the time-lapse simulation. The coffee cups "appearing and disappearing" reinforces the time compression. Light shift across the desk provides visual evidence of time passage beyond just the drawing's progress. Audio is described as "accelerated" to match the visual time compression.

### 3.8 Abstract / Artistic

```
[Camera] Macro lens, f/2.0, extremely shallow depth of field.
Slow, drifting movement with no fixed subject -- the camera floats
through the scene like a particle in suspension.

[Subject] Ink drops falling into clear water in extreme close-up.
Black ink billows and unfurls into fractal tendrils, spreading through
the water column. The ink catches backlight, creating translucent
amber and deep purple gradients at the edges where it thins.
A second drop of crimson ink enters from above, colliding with the
black cloud and creating interference patterns.

[Light] Strong backlight through the water, creating a luminous glow.
The ink acts as a natural filter, shifting the light color as it
disperses. No front light -- pure silhouette and transmission.

[Audio] Deep, resonant sub-bass drone. A crystalline, high-pitched
tone that rises slowly. The sound of water, slowed down 10x, becoming
a deep, otherworldly rumble. No rhythm -- pure texture.

[Style] Abstract art film. Reminiscent of macro photography by
Roman Hill. Rich, saturated, hypnotic.
```

**Why it works:** Fluid dynamics are one of Sora's strongest physics simulations. Ink in water provides organic, unpredictable motion that plays to the model's strengths. The backlight-only setup creates dramatic contrast. The two-ink collision gives the model a compositional event. Audio is described as texture rather than music, which Sora handles well.

### 3.9 Tutorial / How-To Demonstration

```
[Camera] Three-quarter overhead angle, 35mm lens, f/4.0.
The camera is positioned above and to the right of the workspace,
showing both the hands and the work surface clearly.
Static, locked-off for the full 10 seconds.

[Subject] A pair of hands demonstrates how to fold an origami crane
from a square of red paper on a white surface. The hands are steady
and deliberate. Each fold is pressed firmly with a fingernail.
The progression goes from flat square to the first diagonal fold,
then the preliminary base, showing three distinct fold steps in
sequence.

[Light] Bright, even overhead lighting with no harsh shadows.
Clean white balance, approximately 5500K. A slight shadow under
the hands provides depth without obscuring the paper.

[Audio] The crisp sound of paper being folded -- sharp creases.
Fingernails pressing along fold lines. Clean, close-mic sound.
No background noise, no music.

[Style] Clean instructional video. High contrast between red paper
and white surface. Every fold edge must be visible and sharp.
YouTube tutorial aesthetic -- professional but approachable.
```

**Why it works:** The three-quarter overhead angle is the standard tutorial framing -- Sora has seen thousands of hours of this in training data. "Three distinct fold steps" limits temporal complexity to a manageable scope. The red-on-white color contrast helps the model distinguish paper edges. "Clean, close-mic sound" of paper folding is a specific enough audio instruction to produce ASMR-quality results.

### 3.10 Surreal / Physics-Defying

```
[Camera] Wide shot, 24mm lens, f/5.6. Slow push-in over 8 seconds.
The camera drifts forward at walking pace, maintaining eye-level height.

[Subject] A suburban living room, photographically real in every detail.
Warm afternoon light through lace curtains. A cat sleeps on the couch.
Everything is normal except: the furniture is floating 3 feet above the
floor, hovering in place as if gravity has been selectively disabled.
The cat sleeps undisturbed. A glass of water on the floating coffee
table has its surface perfectly level. Dust motes drift upward instead
of settling.

[Light] Warm golden hour light through west-facing windows.
The shadows of the floating furniture fall normally on the floor below,
maintaining the illusion of consistent lighting despite the impossible
physics.

[Audio] Complete suburban silence. A distant lawnmower. A clock ticking.
The absence of any sound that would indicate something is wrong.
The normalcy of the audio contrasts with the visual impossibility.

[Style] Photorealistic, shot on film. No VFX look -- the floating
should appear as real as if it were filmed, not composited.
Gregory Crewdson lighting aesthetic.
```

**Why it works:** The prompt establishes a normal world first, then introduces one specific impossible element. This is far more effective than describing a fully surreal world, because Sora has to simulate fewer unknowns. "Shadows fall normally" anchors the lighting physics. "Dust motes drift upward" is a small, specific detail that reinforces the anti-gravity concept. The audio contrast (normal sounds + impossible visuals) creates unease that pure visual surrealism cannot achieve.

### 3.11 Horror / Suspense

```
[Camera] Slow steadicam, 35mm lens, f/2.0. The camera moves down a
dimly lit hallway at slightly below eye level. The movement is
uncomfortably smooth -- no human imperfection in the glide.

[Subject] A long, narrow hotel corridor. Patterned carpet, identical
doors on both sides. The corridor stretches further than seems
architecturally possible. The overhead lights flicker at irregular
intervals, each flicker revealing that the far end of the corridor
is slightly closer than it was before. No people. A single door,
halfway down on the left, is open exactly 6 inches. Warm light
spills from the gap.

[Light] Overhead fluorescent tubes, cool white, with intermittent
flicker. The spill from the open door is warm tungsten -- the only
warm source in the frame. Deep shadows pool where the fluorescents
fail to reach.

[Audio] The hum of fluorescent tubes, unstable, warbling.
The carpet absorbs all footstep sound -- the silence is wrong.
A distant, unidentifiable sound, like a chair being dragged across
a floor two rooms away. It stops. Then nothing.

[Style] Kubrick-esque institutional dread. The Shining corridor energy.
Symmetrical composition. Unsettlingly clean.
```

**Why it works:** Horror in Sora works through constraint and implication, not explicit gore. The "identical doors" create visual repetition that the model renders convincingly. "Slightly closer than it was before" is a subtle spatial impossibility. The single open door creates a focal point of tension. Audio plays the crucial role -- describing what is absent (footstep sounds) is as powerful as describing what is present.

### 3.12 Comedy / Viral Format

```
[Camera] Bodycam footage perspective. Wide-angle lens distortion.
The camera is mounted on the chest of a police officer -- it bobs
with their walk. Timestamp overlay in the corner: "CAM 04 03:47 AM"

[Subject] Two officers approach a park bench where a raccoon in a
tiny business suit sits with a briefcase. The raccoon adjusts its
tie with its paws. It looks up at the officers with an expression
of mild inconvenience. The officers exchange a look. One of them
slowly reaches for their radio.

[Light] Harsh flashlight from the officers' hands, creating dramatic
shadows. Street lamps in the background provide ambient orange light.
The raccoon's eyes reflect the flashlight with typical animal eyeshine.

[Dialogue]
Officer 1: "Sir, do you have identification?"
(The raccoon opens the briefcase. It contains only acorns.)

[Audio] Police radio static and occasional dispatch chatter.
Nighttime crickets. The click of the briefcase latches.

[Style] Authentic bodycam footage. Low resolution, slight compression
artifacts, washed-out color. The framing is imperfect and awkward.
Played completely straight -- no comedic music or effects.
```

**Why it works:** The viral formula: familiar format (bodycam footage) + absurd twist (raccoon in a suit) + played completely straight. Sora excels at format mimicry. Specifying "authentic bodycam footage" with compression artifacts gives the model a very specific visual target. The comedy comes from contrast -- serious format, serious tone, absurd content. Dialogue is minimal (one line) because comedy timing in AI video is unreliable with long exchanges.

### 3.13 Music Video / Performance

```
[Camera] Dutch angle, 50mm lens, f/1.4. Handheld with aggressive,
rhythmic movement -- the camera sways in sync with the beat.
Occasional whip pans to the left, returning to find the subject.

[Subject] A singer in a sequined silver jacket performs in an empty
warehouse. Red and blue LED panels behind her strobe in alternation.
She sings with raw intensity, gripping a wired microphone.
Confetti falls from above in slow-motion bursts.

[Light] LED panels provide the only illumination, casting alternating
red and blue across the singer's face and the concrete walls.
Lens flares from the LEDs streak horizontally (anamorphic characteristic).
The sequins on her jacket scatter light into hundreds of tiny reflections.

[Audio] Powerful female vocal, soulful, reverb-heavy.
A driving kick drum and bass line. The confetti produces a soft,
papery shimmer sound. The warehouse adds natural reverb to the vocal.

[Style] Music video aesthetic. Anamorphic lens look with horizontal
flares. High contrast. Grain. Director: Hype Williams / Dave Meyers
reference.
```

**Why it works:** Music video is a format Sora understands deeply from training data. The "camera sways in sync with the beat" instruction creates dynamic energy. Sequins and confetti give the model opportunities to showcase light simulation. The anamorphic flare instruction is specific enough (horizontal streaks from LED panels) to produce the right optical effect.

### 3.14 Historical / Period Piece

```
[Camera] Wide shot, static, 50mm lens, f/5.6. Framed like a Vermeer
painting -- subject positioned at the one-third mark, window at left.
No camera movement for the full 8 seconds.

[Subject] A 17th-century Dutch interior. A woman in a blue headscarf
and ochre dress stands at a wooden table, pouring milk from a ceramic
pitcher into a bowl. The stream of milk catches window light. On the
table: a round loaf of dark bread, a wicker basket, blue Delft tiles
on the wall behind.

[Light] A single window at camera-left provides all illumination.
The light falls across the table and the woman's hands, leaving the
far wall in shadow. Warm, diffused, northern European daylight.
Dust motes visible in the light beam.

[Audio] Milk pouring into a ceramic bowl -- a soft, liquid sound.
Distant church bells. A horse and cart on cobblestones outside the
window, passing and fading. Silence otherwise.

[Style] Old Masters painting brought to life. Vermeer's "The Milkmaid"
as a living photograph. Rich, warm tones. Film emulation: Kodak 5207
with warm color shift.
```

**Why it works:** Referencing a specific painting ("Vermeer") gives Sora an extremely precise visual target. The "one-third mark" composition instruction uses rule-of-thirds language the model understands. Material-specific details (ceramic pitcher, Delft tiles, wicker basket) ground the period authenticity. The static camera is ideal for this painterly aesthetic and lets the model focus compute on material rendering.

### 3.15 Sci-Fi / Futuristic

```
[Camera] Slow crane shot rising from ground level to 30 feet,
24mm lens, f/8. Deep focus throughout. The rise takes the full
12 seconds.

[Subject] A sprawling alien marketplace on a terraformed moon.
Bioluminescent plants in violet and teal line the walkways between
stalls. Vendors of various non-human species trade crystalline
objects under translucent canopy structures. In the middle distance,
a massive curved structure -- part architecture, part living organism --
pulses gently with internal light. The sky is dominated by a ringed
gas giant hanging at 30 degrees above the horizon.

[Light] No sun visible. All illumination comes from the bioluminescent
flora, the pulsing architecture, and the reflected light of the gas
giant. Cool teal is the dominant color temperature. Warm amber accents
from vendor stalls create contrast points.

[Audio] An alien marketplace buzz -- unfamiliar language fragments,
crystalline chimes, a low harmonic drone from the pulsing structure.
The atmosphere is thinner than Earth -- sounds are slightly muted
and higher-pitched.

[Style] Concept art brought to life. Denis Villeneuve's Dune meets
James Cameron's Avatar. IMAX large-format sensor look.
Desaturated teal with amber accents.
```

**Why it works:** Sci-fi prompts work best when they combine familiar structures (marketplace, vendors, canopy stalls) with alien specifics (bioluminescent, crystalline, non-human). This gives the model recognizable compositional anchors while generating novel content. The "thinner atmosphere" audio detail is the kind of specificity that elevates output from generic to considered. Director references (Villeneuve, Cameron) are powerful style anchors for cinematic sci-fi.

### 3.16 Emotional Close-Up / Character Study

```
[Camera] Extreme close-up, 100mm macro lens, f/2.0. Only the subject's
eyes and nose bridge fill the frame. The camera is so close we can see
individual eyelashes and the texture of skin pores. Imperceptible
slow zoom-in over 6 seconds.

[Subject] An elderly man's eyes. Deep brown irises with amber flecks.
The whites are slightly bloodshot. Crow's feet radiate outward.
His eyes are wet -- not crying, but on the edge. He blinks once, slowly.
A micro-expression flickers: the corners of his eyes tighten, then
release. He is remembering something.

[Light] Single warm source, slightly above and to the left.
The catchlight in his eyes is a single soft rectangle -- a window.
The other eye has a dimmer, secondary catchlight. The skin between
his eyebrows is in shadow.

[Audio] His breathing. Slow, deliberate, slightly shaky on the exhale.
Nothing else. Complete silence around him. The intimacy is almost
uncomfortable.

[Style] Documentary portraiture. Extreme detail. No beautification
or skin smoothing. Every wrinkle, every pore is part of the story.
```

**Why it works:** Extreme close-ups are a Sora strength because the model can dedicate its full resolution to a small area, producing extraordinary detail. The emotional weight comes from micro-expressions and the "edge of tears" description. "Remembering something" gives the model an internal state to express through subtle facial animation. The breathing-only audio creates suffocating intimacy.

---

## 4. Prompt Optimization System

### 4.1 A/B Testing Methodology

Systematic prompt testing follows the scientific method: change one variable at a time, hold everything else constant.

**Testing protocol:**

1. Write your baseline prompt (version A)
2. Generate 3-5 samples at the same settings
3. Identify the weakest element in the output
4. Create version B that changes ONLY that one element
5. Generate 3-5 samples of version B at the same settings
6. Compare the best of A against the best of B
7. The winner becomes your new baseline
8. Repeat from step 3

**Variables to test (in priority order):**

1. Camera setup (framing, lens, movement)
2. Subject description (specificity level, unique anchors)
3. Action verbs (precise vs. vague)
4. Lighting (direction, quality, color temperature)
5. Style references (director, film stock, era)
6. Audio description (layering, specificity)
7. Temporal structure (beat count, sequencing language)

**Never change more than one of these per iteration.** Multi-variable changes make it impossible to determine which change caused improvement.

### 4.2 Iteration Strategy: What to Change First

When output is not matching your intent, diagnose the problem category before changing the prompt.

**Diagnosis tree:**

```
OUTPUT PROBLEM
|
+-- Wrong framing/composition?
|   -> Rewrite the [Camera] block first.
|      Add specific lens + aperture + angle.
|
+-- Subject looks wrong?
|   -> Add unique physical identifiers.
|      Use image reference input.
|
+-- Motion is unnatural?
|   -> Specify material properties.
|      Add physics anchors.
|      Reduce action complexity.
|
+-- Lighting is flat/wrong?
|   -> Add directional lighting recipe.
|      Specify color temperature in Kelvin.
|      Name the source type (Fresnel, softbox, practical).
|
+-- Audio doesn't match?
|   -> Layer audio at three distances.
|      Describe acoustic environment (room size, surfaces).
|
+-- Temporal order is wrong?
|   -> Use explicit temporal markers ("first," "then," "finally").
|      Reduce total number of beats.
|
+-- Overall style/mood is off?
|   -> Add director/cinematographer reference.
|      Specify film stock or color grade.
|      Describe the "feel" through environment, not labels.
```

**The golden rule of iteration:** Small adjustments to successful prompts yield better results than complete rewrites of failed ones. If 70% of your output is right, tweak the 30% -- do not start over.

### 4.3 Common Failure Modes and Diagnosis

| Failure | Symptom | Root Cause | Fix |
|---|---|---|---|
| Semantic drift | Early details ignored, later details dominant | Prompt too long or front-loaded with style rather than subject | Move subject + action to the first 500 characters |
| Character morphing | Face/body changes mid-clip | No unique identifiers, or too many characters | Add asymmetric anchors to character passport; reduce to 1-2 characters |
| Physics breaks | Objects float, clip through each other | Missing material properties or conflicting physics cues | Specify materials, add physics reality-check anchors |
| Static video | Scene renders but nothing moves | Action verbs missing or too vague | Replace every "is" with an active verb; add temporal beats |
| Uncanny motion | Movement looks AI-generated | Motion described abstractly, not physically | Describe the biomechanics: weight shifts, momentum, follow-through |
| Lighting artifacts | Random brightness shifts, banding | Conflicting light sources or no lighting direction specified | Write a complete lighting recipe with key/fill/rim |
| Audio desync | Dialogue does not match lip movement | Too many words for clip duration | Cut dialogue to 15 words or fewer per line; reduce total lines |
| Text rendering failure | On-screen text is garbled | Sora generates pixel approximations, not encoded text | Avoid text-heavy prompts; add text in post-production |
| Temporal confusion | Events happen simultaneously instead of sequentially | Missing temporal keywords | Add explicit "first... then... finally" structure |
| Style inconsistency | Shots in a series look like different films | No style spine maintained across prompts | Create and reuse a style block in every prompt |

### 4.4 Prompt Scoring Rubric

Rate your prompt on these five dimensions before submitting. Each scores 1-5.

| Dimension | 1 (Weak) | 3 (Adequate) | 5 (Strong) |
|---|---|---|---|
| **Specificity** | "A person walking" | "A woman in a red coat walking through rain" | "A woman in her 30s, red wool peacoat, black umbrella, walking briskly through a rain-soaked Tokyo alley at night" |
| **Camera Clarity** | No camera instructions | "Close-up shot" | "Close-up tracking shot, 85mm f/2.0, shallow DOF, camera dollies backward matching her pace" |
| **Temporal Structure** | No time progression | "She walks, then stops" | "She emerges from the station, pauses to open her umbrella, then strides into the rain, accelerating as she spots a taxi" |
| **Sensory Depth** | Visual only | Visual + basic lighting | Visual + precise lighting recipe + layered audio at 3 distances + material properties |
| **Feasibility** | 8+ actions in 4 seconds | 4-5 actions in 8 seconds | 2-3 clear beats matched to clip duration |

**Scoring guide:**
- 20-25: Production-ready. Submit with confidence.
- 15-19: Good foundation. One dimension needs strengthening.
- 10-14: Needs work. Identify the lowest-scoring dimension and rewrite that section.
- Below 10: Start over with the prompt structure template.

### 4.5 The "Zoom In, Zoom Out" Technique

This is the most effective iterative refinement strategy for Sora prompts.

**Phase 1: Zoom Out (Broad Stroke)**
Write a 2-sentence prompt that captures the core idea. Generate samples. This tests whether the concept itself works before you invest in detail.

```
A cat sitting on a windowsill watching rain. Cozy, warm interior,
late afternoon light.
```

**Phase 2: Evaluate the Broad Output**
Which elements did the model get right? Which did it improvise poorly? Lock in the good defaults; override the bad ones.

**Phase 3: Zoom In (Targeted Detail)**
Add specificity ONLY to the elements that were wrong. If the cat looked great but the lighting was flat:

```
A silver tabby cat sitting on a wooden windowsill watching rain streak
down the glass. Cozy interior. Late afternoon light enters from the
left at a low angle, casting long warm shadows across a knit blanket
draped over the sill. The rain creates constantly shifting patterns
of light on the cat's fur.
```

**Phase 4: Zoom In Further (Surgical Precision)**
If the light is now right but the rain looks fake, add physics detail only to the rain:

```
[...previous prompt unchanged...]
The rain is a steady downpour -- individual drops are visible hitting
the glass and splitting into rivulets that merge and separate as they
travel downward. The glass has a slight warp that distorts the garden
view beyond.
```

**The principle:** Never add detail to something that already works. Every word in a Sora prompt consumes "attention budget." Wasting that budget on elements the model already handles well steals focus from the elements that need help.

---

## 5. Sora-Specific Syntax and Parameters

### 5.1 Model Selection: sora-2 vs sora-2-pro

| Parameter | sora-2 (Standard) | sora-2-pro |
|---|---|---|
| **Render quality** | Good for exploration | Best for final output |
| **Prompt adherence** | Follows broad strokes, improvises details | Tighter adherence to specific instructions |
| **Physics simulation** | Adequate for most scenes | Noticeably better fluid dynamics, cloth, and hair |
| **Audio quality** | Functional dialogue and SFX | More natural pauses, better spatial audio, richer ambience |
| **Generation speed** | Faster | Slower (2-3x) |
| **Cost** | Lower | Higher |
| **Best for** | Iteration, testing, exploration | Final renders, hero shots, client delivery |

**Workflow implication:** Always draft with `sora-2`. Switch to `sora-2-pro` only when the prompt is finalized and you want maximum quality. This saves significant time and cost during the exploration phase.

**Prompt interpretation difference:** `sora-2-pro` responds to subtle prompt details that `sora-2` may ignore. If you specify "Cooke S7/i 40mm lens with Pro-Mist 1/4 filter," `sora-2-pro` will render the characteristic soft halation around highlights. `sora-2` may produce a generic soft look without the specific lens character. This means prompts optimized for `sora-2-pro` may need to be simplified when testing on `sora-2`.

### 5.2 Duration Impact on Prompt Complexity

| Duration | Max Temporal Beats | Prompt Complexity | Best For |
|---|---|---|---|
| 4 seconds | 1-2 | Single action, one camera move | Product shots, reactions, single beats |
| 8 seconds | 2-4 | Short sequence, cause-and-effect | Dialogue exchanges, simple narratives |
| 12 seconds | 3-5 | Multi-beat sequence | Short scenes, establishing shots with reveals |
| 16 seconds | 4-6 | Extended scene | Complex action, multiple character interactions |
| 20 seconds | 5-8 | Full mini-scene | Ambitious, but higher risk of consistency loss |

**The consistency cliff:** Beyond 12 seconds, the probability of visual artifacts, character morphing, and physics breaks increases sharply. If you need 20 seconds of continuous footage, your prompt must be proportionally more precise about maintaining consistency -- add explicit anchors like "maintain consistent facial structure," "same wardrobe throughout," "gravity direction does not change."

**Duration-specific strategy:**
- **4s clips:** Write tight, punchy prompts. One subject, one action, one camera move. These are your building blocks.
- **8-10s clips:** The sweet spot. Enough time for a mini-narrative without overwhelming the model.
- **12-16s clips:** Front-load the most important visual details. Add consistency anchors. Expect 1 in 3 generations to have artifacts.
- **20s clips:** Consider whether you truly need this as one continuous shot. Two stitched 10s clips will almost always produce better results.

### 5.3 Resolution and Aspect Ratio Effects

Resolution and aspect ratio are set via API parameters, not in the prompt text. However, they affect how you should compose your prompt.

**Resolution considerations:**
- Higher resolution = more detail in textures, materials, and faces
- Higher resolution = longer generation time
- Resolution does NOT affect physics simulation quality -- that is model-dependent (sora-2 vs sora-2-pro)

**Aspect ratio and composition:**

| Ratio | Use Case | Composition Notes |
|---|---|---|
| 16:9 | Standard cinematic, YouTube | Classic rule of thirds; balanced horizontal space |
| 9:16 | Vertical / mobile / TikTok / Reels | Tall framing; keep subject centered vertically; reduce horizontal elements |
| 1:1 | Instagram, social media | Symmetrical compositions work best; avoid complex lateral movement |
| 21:9 | Ultra-wide cinematic | Emphasize horizontal landscapes; use negative space at frame edges |

**Vertical video prompting adjustment:** When generating 9:16 content, explicitly describe vertical space rather than horizontal. "The camera tilts upward from her feet to her face" works better than "the camera pans across the scene" in vertical format. Reduce the number of subjects -- vertical frames have less horizontal space to separate characters.

### 5.4 Remix Mode: Prompting for Variations

When remixing an existing generation, your prompt functions as a delta -- a description of what should change from the original.

**Effective remix prompts:**

```
Same scene, but shift the color palette from warm to cool teal.
Everything else identical.
```

```
Same framing and subject, but change the time of day to night.
Add rain. Adjust lighting to practical neon sources only.
```

```
Same action and camera movement, but change the location from a city
street to a dense forest path. Maintain the same pace and energy.
```

**Remix anti-pattern:** Do not remix with a completely different prompt. If your remix prompt shares less than 50% conceptual overlap with the original, you will get incoherent results. At that point, generate fresh instead.

**Remix for consistency:** The most powerful use of remix is maintaining character consistency. Generate a hero shot, then remix with changes only to action or environment while locking the character design.

---

## 6. Anti-Patterns: What NOT to Do

### 6.1 Prompts That Consistently Fail

**The adjective avalanche:**
```
BAD: A beautiful, stunning, breathtaking, awe-inspiring, majestic,
gorgeous, spectacular sunset over a magnificent, pristine, crystal-clear
ocean with incredible, amazing, phenomenal colors.
```
Why it fails: Every adjective is a synonym for "pretty." None provide actionable visual information. Sora cannot distinguish between "stunning" and "breathtaking" -- they carry zero signal. The model receives a pile of positive sentiment with no spatial, temporal, or material information.

**FIX:** Replace with specific, observable details:
```
GOOD: Sunset over the Pacific, shot from a cliff at 200 feet elevation.
The sun sits 5 degrees above the horizon, casting a 2-mile orange
reflection across the water surface. Cirrus clouds in the upper frame
are lit from below in magenta and gold. The ocean color transitions
from deep navy at the horizon to teal in the mid-ground to white foam
at the shoreline.
```

**The kitchen-sink prompt:**
```
BAD: A samurai warrior in full armor rides a horse through a burning
village while fighting three enemies and a dragon attacks from above
and villagers run screaming and lightning strikes a temple and the camera
does a 360 orbit while transitioning from day to night with rain starting
and cherry blossoms falling and an earthquake begins.
```
Why it fails: 10+ simultaneous events exceed the model's ability to simulate coherently. Characters will morph, physics will break, the camera will jitter, and the temporal sequence will scramble.

**FIX:** One shot, one action, one camera move:
```
GOOD: A samurai in lacquered black armor gallops through a burning village
on a dark horse. Embers and ash drift through the frame. The camera
tracks alongside at horse speed, 35mm handheld. Firelight flickers across
the samurai's helmet. 4 seconds.
```

### 6.2 Over-Specification vs Under-Specification

**Over-specification** happens when you describe conflicting constraints that the model cannot satisfy simultaneously:

```
BAD: Close-up of her face AND wide shot showing the entire room AND
the camera is behind her AND looking directly at her expression.
```

The model cannot be both close-up and wide, both behind and facing. It will choose one and garble the other.

**Under-specification** happens when you leave critical elements to chance:

```
BAD: A person in a room.
```

The model will generate something, but you have zero control over what. This is only useful for random exploration, never for production work.

**The sweet spot:** Specify the 3-4 most important elements precisely. Leave secondary elements unspecified for the model to fill in naturally:

```
GOOD: Close-up of a woman's hands as she ties a complex knot in a piece
of rope. Her fingers are calloused, nails short. The rope is thick,
natural fiber. Warm workshop lighting from above.
[Camera, subject hands, material, lighting = specified]
[Background, wider environment, audio = left to model]
```

### 6.3 Conflicting Instructions

The model does not flag contradictions -- it simply produces incoherent output. Watch for these common conflicts:

| Conflict | Example | Problem |
|---|---|---|
| Spatial impossibility | "She stands in the center of the room, pressed against the far wall" | Cannot be both centered and against a wall |
| Temporal impossibility | "He walks slowly, racing across the room" | Slow walking and racing are mutually exclusive |
| Lighting conflict | "Bright midday sun, dark moody shadows everywhere" | Midday sun fills shadows; these contradict |
| Camera conflict | "Static locked-off shot with dynamic handheld energy" | Static and handheld are different physical rigs |
| Scale conflict | "Intimate close-up showing the vast landscape" | Close-up excludes landscape; choose one |
| Style conflict | "Photorealistic documentary style, fantasy color palette" | Documentary excludes fantasy grading |

**Prevention:** Read your prompt imagining you are the cinematographer receiving this brief. If any instruction contradicts another, the DP would ask for clarification. Fix it before the model has to guess.

### 6.4 Word Choices That Produce Artifacts

Certain words and phrases reliably produce poor results:

| Word/Phrase | Problem | Better Alternative |
|---|---|---|
| "Realistic" | Too vague; everything is already attempting realism | Specify the realism type: "documentary-style" or "shot on 35mm film" |
| "Beautiful" / "stunning" | Zero visual information | Describe what makes it beautiful: specific light, color, composition |
| "Perfect" | Triggers over-smoothing, uncanny valley | Describe specific imperfections: "weathered," "sun-faded," "well-worn" |
| "Smooth transition" | Vague; produces generic morphing | Specify the transition mechanism: "match cut on shape," "whip pan to" |
| "Many" / "lots of" | Uncontrolled quantity; may produce 3 or 300 | Use specific numbers: "seven birds," "a crowd of approximately 30 people" |
| "Moving" | No information about how | Use specific motion verbs: "striding," "shuffling," "lurching," "gliding" |
| "Cinematic" | So overused it is nearly meaningless | Specify which cinematic look: era, director, film stock, lens |
| "4K quality" / "8K" | Resolution is a parameter, not a prompt word | Set resolution in API settings; describe visual detail instead |
| "Make it longer" / "slow motion" | Duration/speed are parameters, not prompt words | Set duration in API; describe motion physics ("each droplet hangs in the air") |
| "Text reading: SALE 50% OFF" | Text rendering is unreliable | Avoid in-frame text; add in post-production |

### 6.5 The Overloading Threshold

Sora begins to degrade when a single prompt contains more than:

- 3-4 distinct characters (faces begin to merge or swap)
- 4-5 sequential actions (temporal order scrambles)
- 2 simultaneous camera movements (spatial incoherence)
- 3 competing light sources with specific colors (lighting artifacts)
- 8-10 stacked adjectives on a single subject (semantic saturation)

**The rule:** If your prompt would require a film crew of more than 3 people to execute in reality (camera operator, gaffer, actor), you are probably asking too much for a single clip. Break it into shots.

---

## Appendix A: Quick-Reference Prompt Template

Copy and customize this template for any shot:

```
[Camera] [Shot type], [focal length] lens, f/[aperture]. [Movement].
[Duration: Xs].

[Subject] [Character description with unique identifiers].
[Primary action using specific verbs].
[Secondary environmental details].

[Light] Key: [source, direction, quality, color temp].
Fill: [source or "none"]. Rim: [source or "none"].
Practicals: [in-scene sources].

[Audio] Foreground: [primary sounds].
Mid-ground: [secondary sounds].
Background: [ambient bed].

[Dialogue] (if applicable)
Speaker: "Line." (delivery direction)

[Style] [Film stock / director reference / era].
[Color palette description]. [Texture/grain].
```

## Appendix B: Style Spine Template

Define once, paste into every prompt in a multi-shot project:

```
STYLE SPINE -- [Project Name]
Palette: [3-5 hex codes or color names]
Film stock: [Kodak Vision3 500T / Fuji Eterna / etc.]
Lens family: [Cooke S7/i / Master Prime / Vintage anamorphic]
Camera movement: [Steadicam / handheld / locked-off tripod]
Lighting: [Natural only / mixed practical / studio]
Color grade: [Teal shadows, warm highlights / desaturated / high contrast]
Audio style: [Naturalistic / stylized / minimal]
```

## Appendix C: Character Passport Template

```
CHARACTER PASSPORT -- "[Name]"
Age: [specific]
Build: [specific]
Face: [2-3 unique asymmetric identifiers: scars, moles, specific features]
Hair: [color, style, length, any distinguishing details]
Eyes: [color, shape, any distinctive qualities]
Wardrobe: [specific garments, colors, textures, accessories]
Posture/Movement: [how they carry themselves, default expression]
Voice: [if dialogue: pitch, cadence, accent]
```

---

**Sources consulted:**
- [OpenAI Sora 2 Prompting Guide (Official Cookbook)](https://cookbook.openai.com/examples/sora/sora2_prompting_guide)
- [OpenAI Developers Cookbook - Sora 2](https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide)
- [Higgsfield - Sora 2 Prompt Guide](https://higgsfield.ai/sora-2-prompt-guide)
- [Skywork - Sora 2 Tested Settings & Prompts](https://skywork.ai/blog/sora-2-guide-tested-settings-prompts-for-pro-level-quality/)
- [Skywork - Cinematic Prompts for Sora 2](https://skywork.ai/blog/how-to-craft-top-tier-cinematic-prompts-for-sora-2/)
- [WaveSpeedAI - Sora 2 Prompting Tips 2026](https://wavespeed.ai/blog/posts/sora-2-prompting-tips-better-videos-2026/)
- [Atlabs AI - Best Practices Sora 2 Prompting 2026](https://www.atlabs.ai/blog/sora-2-prompt-guide)
- [Global GPT - How Long Can a Sora 2 Prompt Be](https://www.glbgpt.com/hub/how-long-can-a-sora-2-prompt/)
- [Global GPT - Best Sora 2 Prompts 2026](https://www.glbgpt.com/hub/best-sora-2-prompts/)
- [CreateXFlow - Sora 2 Prompt Engineering Advanced Reference](https://createxflow.com/sora-2-prompt-engineering/)
- [GodOfPrompt - 20 Sora 2 Viral Video Prompts](https://www.godofprompt.ai/blog/sora-2-viral-video-prompts)
- [VaiFlux - Cinematic Prompt Techniques](https://www.vaiflux.com/guides/cinematic-prompt-techniques)
- [Scenario - Sora 2 Essentials](https://help.scenario.com/en/articles/sora-2-the-essentials/)
- [fal.ai - How to Write Prompts for Sora 2](https://fal.ai/learn/devs/how-to-write-prompts-sora-2)
- [Evolink - Sora 2 Pro API Review](https://evolink.ai/blog/sora-2-pro-api-review-developer-guide)
- [GitHub - awesome_sora2_prompt](https://github.com/zhangchenchen/awesome_sora2_prompt)
- [Pixel Syndicate - Engineering Sora 2 Cameo Prompts](https://pixelsyndicate.com/engineering-sora-2-cameo-prompts/)
- [SoPrompts - 10 Common Sora 2 Mistakes](https://soprompts.com/blog/sora-2-common-mistakes)


---
## Media

### Platform References
- **sora2**: [Docs](https://openai.com/sora) · [Gallery](https://openai.com/index/sora/)
- **vidu**: [Docs](https://www.vidu.studio) · [Gallery](https://www.vidu.studio/explore)
- **wan**: [Docs](https://github.com/Wan-Video/Wan2.1) · [Gallery](https://wan-video.github.io)

### Related Videos
- [OpenAI Sora 2 Complete Guide - Features & How to Use](https://www.youtube.com/results?search_query=openai+sora+2+complete+guide+tutorial+2026) — *Credit: OpenAI on YouTube* `sora2`
- [Sora 2 Prompting Masterclass - Create Stunning AI Videos](https://www.youtube.com/results?search_query=sora+2+prompting+masterclass+ai+video) — *Credit: AI Video on YouTube* `sora2`
- [Vidu AI Video Generator Tutorial](https://www.youtube.com/results?search_query=vidu+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `vidu`
- [Vidu - Fast AI Video Generation Review](https://www.youtube.com/results?search_query=vidu+ai+fast+video+generation+review) — *Credit: AI Reviews on YouTube* `vidu`
- [Wan 2.1 Video Generation - Self-Hosted Tutorial](https://www.youtube.com/results?search_query=wan+2.1+video+generation+self+hosted+tutorial) — *Credit: AI Self-Hosted on YouTube* `wan`
- [Wan VACE - Video Editing with AI](https://www.youtube.com/results?search_query=wan+vace+video+editing+ai+tutorial) — *Credit: AI Video on YouTube* `wan`

> *All video content is credited to original creators. Links direct to source platforms.*
