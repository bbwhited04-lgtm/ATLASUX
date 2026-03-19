# Veo 3 / Veo 3.1 Advanced Prompt Engineering

**Audience:** Practitioners who already understand basic video generation prompting and want to extract maximum quality from Google's Veo 3 family.
**Last updated:** 2026-03-18

---

## 1. Veo 3 Prompt Architecture

### 1.1 The 7-Component Structure in Practice

Every production-grade Veo 3 prompt should address all seven components, but the order and weight you give each component matters. The model's cross-modal attention layers process these as a unified token sequence, so coherence across components outweighs exhaustiveness in any single one.

| # | Component | Purpose | Advanced Usage |
|---|-----------|---------|----------------|
| 1 | **Subject** | Who/what is in frame | 15+ physical attributes minimum. Repeat key descriptors across clips for multi-shot consistency. Differentiate characters by at least 3 unique visual markers (hair, clothing color, build) to prevent identity collapse in multi-character scenes. |
| 2 | **Action** | What happens | One dominant action per clip. Chaining 3+ simultaneous actions causes physics instability. Use temporal language ("begins by... then... finishing with") for sequenced micro-actions. |
| 3 | **Scene** | Environment and setting | Name specific light sources (not just "well-lit" but "warm tungsten desk lamp, cool blue monitor glow"). Include at least one interactive prop that connects to the action. |
| 4 | **Style** | Camera, lens, grade | Stack no more than 3 style modifiers. "Shot on 35mm, anamorphic lens, chiaroscuro lighting" works. Adding 5+ modifiers causes averaging and dilutes each one. |
| 5 | **Dialogue** | Character speech | Colon syntax triggers lip-sync: `Character says: "Line here."` Adverbs before the speech verb control delivery: "whispers nervously," "declares confidently." |
| 6 | **Sounds** | Audio landscape | Layer using foreground/background hierarchy with spatial language. "The clang of metal cuts through the ambient hum of machinery" gives the model clear priority ordering. |
| 7 | **Technical** | Negative prompt | Use the `negativePrompt` API parameter, not inline "no" statements. Keep under 30 words. List nouns/adjectives only, no instructive language. |

**Component weighting in practice:** The model allocates attention roughly proportional to token count. If your dialogue section is 40% of your prompt, audio generation will prioritize speech over ambient sound. Rebalance by giving approximately equal token weight to visual description and audio description when both matter.

### 1.2 How the Joint Diffusion Model Processes Prompts

Veo 3's defining architectural innovation is **joint audio-visual diffusion**. Unlike prior models that generate video first and audio separately, Veo 3 applies a single denoising process across a unified token sequence containing both visual spacetime patches and temporal audio tokens.

What this means for prompting:

- **Audio and visual descriptions are not processed independently.** A well-described sound that contradicts the visual will cause both to degrade. If you describe "a quiet library" visually but prompt "loud rock music," the model resolves the conflict by compromising both.
- **Cross-modal attention is bidirectional.** Describing a character slamming a door influences both the visual animation AND the generated sound. You do not need to describe both — but if you describe both, they must agree.
- **The model uses 3D latent embeddings** that encode time, space, and sound jointly. This is why temporal synchronization ("as the glass hits the floor, a sharp shatter rings out") produces tighter results than describing audio and video in separate, disconnected blocks.
- **Prompts under 30 words trigger automatic enhancement.** The API rewrites short prompts internally (the rewritten version is sometimes returned in the response). For advanced control, always exceed 30 words to prevent the model from making assumptions.

### 1.3 Prompt Length Sweet Spots and Diminishing Returns

| Word Count | Behavior |
|------------|----------|
| < 30 words | Triggers auto-enhancement. Model fills gaps with defaults. Unpredictable. |
| 30-50 words | Minimal viable prompt. One component will dominate; others default. |
| 50-100 words | Good baseline. Covers 3-4 components well. |
| **100-200 words** | **Optimal range per DeepMind.** All 7 components can be addressed with specificity. |
| 200-300 words | Still effective but requires careful structure. Diminishing returns begin. Competing details start averaging. |
| 300+ words | Active dilution. Model attention spreads thin. Core intent gets lost. Break into multiple clips instead. |

**The practical ceiling:** When adding a 20th descriptor no longer changes the output, you have hit the attention saturation point for that component. Redistribute those tokens to underspecified components instead.

### 1.4 How Veo 3.1 Differs from Veo 3 in Prompt Interpretation

| Capability | Veo 3 | Veo 3.1 |
|------------|-------|---------|
| Max resolution | 1080p | **4K (2160p)** |
| Duration | 5-8s | 5-8s |
| Audio generation | Native, joint diffusion | Native, improved sync fidelity |
| **Ingredients** (reference images) | Not available | Up to 3 reference images for character/style lock |
| **First/Last Frame** | Not available | Upload start and end frames; describe the transition |
| **Extend** | Basic continuation | Improved scene coherence on extension |
| Prompt enhancement | Auto-rewrites short prompts | Same, with better transparency on rewrites |
| `enhancePrompt` parameter | Available | Available — set `false` for full manual control |
| Film terminology response | High accuracy | Higher accuracy, better lens simulation |
| Person generation | Toggle on/off | Toggle on/off, improved anatomy consistency |

**Key prompting implication:** With Veo 3.1's Ingredients mode, you can front-load character appearance into reference images and use your prompt tokens entirely for action, scene, camera, and audio — producing significantly better results than trying to describe everything in text alone.

---

## 2. Advanced Techniques

### 2.1 Dialogue Mastery

#### Single-Character Speech (High Reliability)

The colon-plus-quotes syntax is the canonical trigger for lip-sync generation:

```
[Character description] [action verb]: "[Exact dialogue]"
```

Advanced delivery control uses adverbs before the speech verb:

```
The detective leans forward and whispers urgently: "They moved the body last night."
```

Reliable speech verbs ranked by lip-sync fidelity:
1. `says` / `asks` — highest reliability
2. `whispers` / `shouts` — good, with volume variation
3. `mutters` / `murmurs` — works but can reduce clarity
4. `sings` — inconsistent; avoid for precision dialogue

#### Multi-Character Conversation

Veo 3 handles 2-character dialogue reliably. 3+ characters in a single clip is unreliable.

**Two-character pattern (tested, reliable):**
```
A woman in a red blazer sits across from a man in a gray hoodie at a small cafe table.
The woman leans forward and says: "The funding closes Friday."
The man shakes his head and replies: "We need another week, minimum."
Close-up, shallow depth of field, warm golden hour light through the window.
Ambient: quiet cafe chatter, the clink of ceramic cups.
```

**Rules for multi-character dialogue:**
- Differentiate speakers by 3+ unique visual markers (clothing color, hair, accessories)
- Assign dialogue sequentially — never simultaneously
- Total dialogue must fit within the clip duration (roughly 2-3 words per second)
- For 8-second clips: maximum ~16 spoken words total across all characters
- Use shot/reverse-shot framing or over-the-shoulder to make speaker identity unambiguous

#### Emotional Delivery and Accents

Emotional tone is controlled by adverbs and context, not explicit accent instructions. Veo 3 does not reliably produce specific accents on command, but emotional valence is highly controllable:

```
# High control — emotional delivery
The CEO stands at the podium and declares triumphantly: "We did it."

# Moderate control — speech pace and volume
The child tugs her mother's sleeve and says excitedly, almost too fast: "Can we go now? Please?"

# Low control — specific accents (unreliable)
The man says in a Southern drawl: "Well, I'll be."  ← May or may not produce accent
```

**Overlapping speech:** Not directly supported. The model processes dialogue sequentially. For overlapping conversation effects, generate clips separately and composite in post.

#### Inner Monologue and Narrator Voice

```
# Narrator/voiceover (character not visible or not lip-syncing)
A narrator says: "In 1847, the gold rush changed everything."

# Voiceover with on-screen action
A time-lapse of a city skyline at sunset. A warm, measured voice narrates:
"Every building holds a thousand untold stories."

# Inner monologue (character visible but not speaking)
Close-up of a woman staring out a rain-streaked window.
Her inner voice says: "I should have told him the truth."
```

The model typically does NOT lip-sync narrator/voiceover lines when the described character is not performing the speaking action, which is the desired behavior for these use cases.

### 2.2 Audio Layering

Veo 3 generates all audio in a single pass. You control the mix through descriptive hierarchy and spatial language.

**The Foreground/Mid/Background framework:**

```
Foreground: [dialogue or primary sound event — "cuts through," "rings out," "cracks"]
Midground:  [secondary sounds — "underscores," "accompanies," "fills the room"]
Background: [ambient bed — "in the distance," "faintly," "beneath it all"]
```

**Full audio stack example:**
```
A bartender polishes a glass behind a mahogany bar. He looks up and says:
"What'll it be?"
The sharp clink of glass on wood cuts through the space.
A low jazz trio plays in the corner — upright bass, brushed drums, muted trumpet.
Beneath it all, the murmur of quiet conversation and the distant sound of rain
against windows.
```

**Audio priority rules:**
- Sounds described first in the prompt generally get higher volume
- Spatial language ("in the distance," "right next to the camera") controls perceived volume
- Action-linked sounds ("as he sets down the glass, a soft thud") get better sync than free-floating sound descriptions
- Music descriptions work best as mood/genre ("tense orchestral score" or "lo-fi ambient synth") rather than specific melodies

### 2.3 Colon Syntax Deep Dive

The colon is Veo 3's primary delimiter between a speaker and their speech. But it has nuanced behaviors:

```
# Standard dialogue (lip-sync on)
The man says: "Hello."

# Description-then-speech (lip-sync on, most reliable)
A tired nurse in blue scrubs sits at a desk and says: "Another double shift."

# Implied speech without colon (lip-sync OFF — model may generate ambient voice)
The woman talks to her friend about the weather.

# Narration without character action (voiceover, no lip-sync)
A narrator describes: "The ancient ruins stood for millennia."

# Action integrated with speech (best for natural delivery)
The chef tastes the soup, pauses, then says approvingly: "Perfect."
```

**Critical formatting details:**
- Always place the colon immediately after the speech verb, before the opening quote
- Do NOT use screenplay format (CHARACTER NAME in caps on its own line)
- Prose-style scene descriptions outperform script-style formatting
- If quotes appear as on-screen subtitles, add `no subtitles, no text, no captions` to your negative prompt

### 2.4 Cross-Modal Reinforcement

Cross-modal reinforcement is the technique of making visual, audio, and textual elements point at the same narrative moment simultaneously. The joint diffusion architecture rewards this with tighter synchronization.

**Weak (disconnected modalities):**
```
A scientist works in a lab. Classical music plays.
```

**Strong (reinforced across modalities):**
```
A scientist peers through a microscope. As she adjusts the focus dial,
a quiet mechanical click accompanies each turn. She gasps softly and
whispers: "There it is." The fluorescent lab lights hum faintly overhead.
A subtle, ascending string note mirrors her discovery.
```

**Why this works:** Every audio element is motivated by a visual element. The click comes from the dial turn. The gasp comes from the discovery. The hum comes from visible lights. The music mirrors the emotional arc. The model's cross-modal attention layers bind these together because they co-occur in the token sequence.

**The reinforcement checklist:**
1. Every described sound should have a visible source (or implied visible source)
2. Emotional tone of music should match the visual mood
3. Dialogue content should reference what is visually happening
4. Camera movement should follow the audio focus (push in when speech intensifies)

### 2.5 Negative Prompt Engineering

**Where to put negative prompts:** Always in the `negativePrompt` API parameter, never inline.

**Effective negative prompt template:**
```
motion blur, face distortion, warping, morphing, duplicate limbs,
inconsistent lighting, background shifting, floating objects, text overlay,
watermark, subtitles, oversaturation, plastic skin, over-sharpening,
soap opera effect, jump cuts, glitch morphs, extra limbs, object warping
```

**Negative prompt tiers (use only what you need):**

| Tier | When to Use | Items |
|------|-------------|-------|
| Always | Every generation | `face distortion, extra limbs, watermark, subtitles, text overlay` |
| Dialogue scenes | When lip-sync matters | + `mouth distortion, teeth artifacts, jaw warping` |
| Camera movement | Tracking/dolly shots | + `motion blur, background shifting, jump cuts` |
| Character close-ups | Portrait/beauty shots | + `plastic skin, over-sharpening, uncanny valley` |
| Product shots | Commercial work | + `floating objects, inconsistent lighting, brand distortion` |

**Common negative prompt mistakes:**
- **Overloading:** 50+ negative items dilutes the effect. Keep under 30 words.
- **Contradicting the positive prompt:** Negating "blur" while prompting "dreamy soft focus" causes conflict.
- **Using instructive language:** "Don't show faces" does not work. Use noun lists: "faces, people, crowds."
- **Negating what should be positively prompted:** If you keep getting shaky footage, adding "camera shake" to negatives is less effective than adding "locked-off tripod shot, perfectly stable camera" to your positive prompt. **Fix positively first, negate as a safety net.**

### 2.6 4K Composition (Veo 3.1)

Veo 3.1's 4K output (2160p) means the model renders fine detail that 1080p prompts never needed to address. Adjust your prompting accordingly:

**What changes at 4K:**
- Skin texture, fabric weave, and material surfaces become visible — describe them
- Background details that were blurry blobs at 1080p now need coherence
- Text/logos in the scene become readable — intentionally include or exclude via negative prompt
- Lens effects (bokeh shape, chromatic aberration, film grain) render with higher fidelity

**4K-specific prompt additions:**
```
# Texture callouts
...wearing a hand-knit wool sweater with visible cable-knit pattern...
...rain droplets bead on the leather jacket's surface...

# Material specificity
...brushed aluminum laptop, matte black ceramic mug, weathered oak desk...

# Controlled background detail
...behind her, a bookshelf with identifiable spines: leather-bound volumes,
a small potted succulent, and a brass desk lamp...
```

**Do NOT add resolution keywords to your prompt text.** Terms like "4K," "ultra HD," or "high resolution" in the prompt body have no measurable effect. Resolution is controlled by the API parameter, not prompt text. Including these wastes tokens.

### 2.7 Ingredients, Frames, and Extend (Veo 3.1)

#### Ingredients (Reference Images)

Upload up to 3 reference images to lock character appearance, product design, or visual style.

**Advanced Ingredients strategy:**
- Use 3 images of the SAME subject from different angles (front, 3/4, profile) for maximum consistency
- When using Ingredients, **remove physical appearance descriptions from your prompt** — they compete with the reference images and cause averaging
- Instead, use freed-up prompt tokens for action, camera, and audio
- Reference images work best when: well-lit, high resolution, subject fills 50%+ of frame, clean background

**Ingredients prompt pattern:**
```
[With 3 reference images of a woman uploaded]

Prompt: "She walks through a sunlit corridor, her heels clicking on marble floors.
Medium tracking shot following from behind, rack focus to her face as she turns.
She says: 'The board meeting starts in five.' Confident, measured tone.
Ambient: echoing footsteps, distant office chatter. Warm overhead lighting."
```

Notice: zero appearance description. The images handle that.

#### First and Last Frame

Upload a starting frame and ending frame. Your prompt describes the transition between them.

**Advanced usage:**
- Use AI-generated stills (from Imagen 4 or similar) as your frames for perfect consistency
- The prompt should describe the JOURNEY between frames, not the frames themselves
- Best for: reveals, transformations, time-lapses, emotional transitions

```
[First frame: empty conference room, morning light]
[Last frame: same room, packed with people, presentation on screen]

Prompt: "Time-lapse of a conference room filling with professionals over the course
of a morning. People arrive individually, set up laptops, pour coffee. The energy
builds. Natural light shifts from cool dawn to warm midday. Ambient: growing chatter,
laptop keyboards, paper shuffling."
```

#### Extend

Generate from the last frame of a previous clip to create longer sequences.

**Extend best practices:**
- Maintain identical character descriptions across extension prompts
- Reference the established scene: "Continuing in the same cafe..."
- Shift only ONE element per extension (camera angle, action, or dialogue) to maintain coherence
- Use the same seed across extensions when possible for visual consistency
- Plan your extensions in advance — write all prompts before generating the first clip

### 2.8 Aspect Ratio Psychology

The aspect ratio changes what the model can fit and how it composes the frame. Your prompt must adapt.

**16:9 (Landscape) — Cinematic, expansive**
```
Best for: establishing shots, two-character dialogue, product on surface, landscapes
Prompt emphasis: environment, spatial relationships, lateral camera movement
Camera bias: tracking shots, pans, dolly moves
Composition: rule of thirds horizontally, leading lines, negative space on sides
```

**9:16 (Vertical) — Mobile-first, intimate**
```
Best for: talking head, single character, social media hooks, tall subjects
Prompt emphasis: subject detail, facial expression, vertical depth (foreground/background)
Camera bias: tilt up/down, push in, static medium close-up
Composition: subject centered or slightly above center, vertical layering
Adjust: reduce environment description, increase subject detail
Add: "composed for vertical format" helps the model avoid awkward cropping
```

**Prompting shift between ratios for the SAME scene:**

16:9 version:
```
Wide shot of a chef working at a long stainless steel counter in a restaurant kitchen.
Other cooks move behind him. Steam rises from multiple pots. He plates a dish carefully.
```

9:16 version:
```
Medium close-up of a chef's hands plating a dish on a white ceramic plate.
His focused face visible above. Steam rises around him. The background kitchen
is a soft blur of stainless steel and warm light.
```

Same scene, different composition strategy for the format.

---

## 3. Proven Prompt Patterns

Each pattern below is a complete, production-ready prompt showing all 7 components.

---

### Pattern 1: Corporate Talking Head with Clear Speech

```
SUBJECT: A confident woman in her early 40s, dark hair pulled back in a low bun,
wearing a tailored navy blazer over a white silk blouse, minimal gold jewelry,
natural makeup.

ACTION: She looks directly into the camera and speaks with measured authority,
using subtle hand gestures for emphasis.

SCENE: Modern office studio with a softly blurred background — frosted glass
partition, potted monstera plant, a framed company logo visible but not dominant.
Clean, uncluttered desk surface below frame.

STYLE: Medium close-up, locked-off tripod shot, 85mm portrait lens, shallow
depth of field. High-key lighting: large soft key light at 45 degrees camera-left,
fill light camera-right, subtle hair light from behind. Corporate color grade
with muted tones.

DIALOGUE: She says clearly and warmly: "We built this platform because small
businesses deserve enterprise-grade tools without the enterprise price tag."

SOUNDS: Quiet, professional silence. No music. Faint air conditioning hum
barely perceptible.

NEGATIVE PROMPT: face distortion, mouth artifacts, text overlay, subtitles,
watermark, motion blur, background shifting
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.0-generate-preview

---

### Pattern 2: Product Commercial with Voiceover

```
SUBJECT: A matte black wireless earbud sits on a polished obsidian surface,
catching angular reflections from overhead.

ACTION: Slow 360-degree rotation on an invisible turntable. At the 180-degree
mark, the charging case slides into frame from camera-right and opens with a
satisfying magnetic click.

SCENE: Dark product studio. Single overhead spotlight creates a tight pool of
light. Beyond the light pool, pure black negative space. Subtle lens flares
from the rim lighting.

STYLE: Macro close-up transitioning to medium shot as case enters. Anamorphic
lens, cinematic 2.39:1 crop within 16:9. Slow dolly-around. 24fps. Rich blacks,
controlled highlights. Apple-commercial aesthetic.

DIALOGUE: A warm, authoritative male voice narrates: "Forty hours of listening.
Zero compromise on sound."

SOUNDS: A deep cinematic bass hit on the opening frame. Subtle ambient synth
drone underneath. The crisp magnetic snap of the case opening at the midpoint.
Silence for one beat after the snap before the narration begins.

NEGATIVE PROMPT: floating objects, inconsistent lighting, brand text,
fingerprints on surface, plastic appearance, watermark
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.1

---

### Pattern 3: Educational Explainer with Narration

```
SUBJECT: A detailed cross-section diagram of a human heart, rendered in
semi-transparent 3D with visible chambers, valves, and blood flow pathways.
Red and blue color-coded arteries and veins.

ACTION: The camera slowly orbits the heart model. As the narrator mentions
each chamber, the corresponding section illuminates with a subtle glow pulse.
Blood flow arrows animate through the vessels in real-time.

SCENE: Clean dark background with subtle grid lines suggesting a medical
visualization environment. Floating anatomical labels fade in and out as
relevant structures are discussed.

STYLE: Orbital tracking shot, medical illustration aesthetic, soft volumetric
lighting from within the model. Clean, precise camera movement. High-key
lighting on the model against low-key background. Tilt-shift for scale effect.

DIALOGUE: A calm, articulate female narrator explains: "The right atrium
receives deoxygenated blood, which then passes through the tricuspid valve
into the right ventricle."

SOUNDS: A subtle, steady heartbeat rhythm underlies the narration. Soft
electronic ambient pad, clinical and calming. Each glow pulse accompanied by
a gentle tonal chime.

NEGATIVE PROMPT: text overlay, subtitles, distortion, inconsistent anatomy,
flickering labels, motion blur
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.1

---

### Pattern 4: Cinematic Establishing Shot with Ambient Audio

```
SUBJECT: A lone lighthouse on a rocky promontory, weathered white paint
peeling, functioning beacon rotating in the early dawn light.

ACTION: The camera drifts slowly forward over dark ocean swells, approaching
the lighthouse from sea level. The beacon sweeps across the frame every few
seconds, casting a brief golden beam through the mist.

SCENE: North Atlantic coastline at pre-dawn blue hour. Heavy fog rolls across
dark water. Jagged rocks emerge from white foam at the base of the cliff.
Stars barely visible through thinning clouds above. No other structures visible.

STYLE: Drone-level forward tracking shot, just above wave height. IMAX format
sensibility. Anamorphic lens with horizontal flares when the beacon sweeps.
Cool blue-gray color grade with warm amber accent from the beacon. Deep depth
of field. 35mm film grain.

DIALOGUE: None.

SOUNDS: Deep ocean swells rolling and breaking against rocks. Wind moaning
across open water. The mechanical groan of the rotating beacon. Distant
foghorn, two long blasts. Seabirds calling intermittently.

NEGATIVE PROMPT: text, watermark, people, boats, modern structures,
oversaturation, lens distortion
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.0-generate-preview

---

### Pattern 5: Multi-Character Dialogue Scene

```
SUBJECT: Two characters at a kitchen table. CHARACTER A: a stocky man in his
50s, salt-and-pepper beard, wearing a faded flannel shirt, reading glasses
pushed up on his forehead. CHARACTER B: a young woman in her mid-20s, curly
auburn hair, wearing a green army surplus jacket, fidgeting with a car key.

ACTION: Character A sets down his coffee mug and looks across the table at
Character B. She avoids his gaze, spinning the key on the tabletop. He speaks
first. She responds without looking up.

SCENE: Small working-class kitchen, morning light from a window over the sink.
Yellow linoleum floor, wood-grain laminate countertops, a dripping faucet,
half-read newspaper next to Character A. A packed duffel bag sits by the door
in the background.

STYLE: Over-the-shoulder shots alternating. 50mm prime lens, natural depth of
field. Motivated lighting from the kitchen window — warm side light on faces.
Handheld with subtle drift, intimate documentary feel. Desaturated color grade.

DIALOGUE:
Character A sets down his mug and says quietly: "You sure about this?"
Character B keeps her eyes down and replies flatly: "I already signed the lease."

SOUNDS: The soft ceramic thud of the mug on the table. The metallic spin of
the key on formica. The persistent drip of the faucet. Morning birdsong
outside the window. No music.

NEGATIVE PROMPT: face distortion, mouth artifacts, duplicate characters,
inconsistent lighting, subtitles, text, watermark
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.0-generate-preview

---

### Pattern 6: Nature Documentary with Narrator

```
SUBJECT: A great blue heron standing motionless in shallow marsh water,
steel-gray plumage, long yellow bill, intense orange eye. Water reaches
mid-leg height.

ACTION: The heron stands perfectly still for three seconds, then strikes with
explosive speed — bill plunging underwater and emerging with a silvery fish.
Water droplets spray in an arc. The heron lifts its head and swallows.

SCENE: Coastal salt marsh at golden hour. Tall marsh grass frames the
background in warm amber. The water surface is glassy and reflective,
creating a mirror image of the heron. Distant tree line silhouetted against
a peach sky.

STYLE: Telephoto close-up (300mm equivalent), locked-off tripod. Shallow
depth of field isolating the heron from background. Golden hour rim lighting
from behind. Nature documentary aesthetic — BBC Earth quality. High frame rate
feel for the strike moment.

DIALOGUE: A deep, measured male voice narrates: "Patience is the heron's
greatest weapon. One strike. One chance."

SOUNDS: Ambient marsh chorus — crickets, frogs, rustling grass. The sudden
violent splash of the strike cuts through the calm. Water dripping from the
fish. A distant red-winged blackbird call.

NEGATIVE PROMPT: motion blur, fish distortion, duplicate herons, text,
subtitles, watermark, human presence
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.1

---

### Pattern 7: Social Media Vertical with Hook

```
SUBJECT: A young man in his late 20s, clean-cut, wearing a crisp white t-shirt,
looking directly into the camera with an expression of controlled disbelief.

ACTION: He holds up his phone showing a screen (content not readable), then
lowers it, pauses for a beat of silence, then speaks. His eyebrows rise on
the key word. He holds the final pose for a beat.

SCENE: Simple apartment background — a bookshelf with plants, warm lamp,
slightly out of focus. Nothing distracting. Ring light catch visible in his eyes.

STYLE: Medium close-up, static camera, 9:16 vertical format. Ring light as key,
warm practical lamp as fill from behind camera-right. iPhone selfie-cam
aesthetic but slightly more polished. Subject positioned in upper third of
vertical frame.

DIALOGUE: He says with emphasis: "This one prompt made my videos look ten times
better. Here's exactly how."

SOUNDS: A subtle attention-grabbing sound effect — a single clean "pop" or
"ding" on the word "exactly." No music. Natural room tone.

NEGATIVE PROMPT: subtitles, text overlay, captions, watermark, face distortion,
motion blur
```

**Duration:** 6s | **Aspect:** 9:16 | **Model:** veo-3.0-generate-preview

---

### Pattern 8: Interview / Testimonial Style

```
SUBJECT: A woman in her early 30s, warm brown skin, natural hair in a short
TWA, wearing a dusty rose blouse. Small gold hoop earrings. Relaxed posture
in a cushioned armchair.

ACTION: She speaks naturally to someone just off-camera right (not into lens).
Subtle hand gestures during her dialogue, genuine smile breaking through at
the end of her statement. Her eyes are engaged and present.

SCENE: Bright, airy co-working space behind her — large windows with natural
light, exposed brick wall, blurred greenery from indoor plants. A mug of tea
on the armrest. The depth of field renders the background as a pleasant blur
of warm tones.

STYLE: Medium shot, static tripod with very slight reframe. 50mm prime lens.
Natural window light as key from camera-left, white bounce card fill from right.
Interview documentary aesthetic — Vox or podcast studio quality. Warm, slightly
lifted color grade.

DIALOGUE: She says genuinely, with a small laugh midway: "When I switched to
this system, I got three hours of my week back. That's... that's everything
when you're running solo."

SOUNDS: Natural room ambience — faint HVAC, distant keyboard typing, the soft
creak of the armchair when she shifts. No music.

NEGATIVE PROMPT: face distortion, mouth artifacts, text, subtitles, looking at
camera, unnatural hand poses, watermark
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.0-generate-preview

---

### Pattern 9: Dramatic Scene with Music Cues

```
SUBJECT: A woman in a long dark coat stands at the end of an empty train
platform. Short black hair whips in the wind. Pale complexion. No bag. She
stares down the tracks into the distance.

ACTION: She stands motionless as headlights appear far down the tracks. The
approaching light illuminates her face gradually. As the train roars past
without stopping, her coat billows violently. She does not flinch. After
the train passes, she turns slowly and walks away.

SCENE: Empty rural train platform, late evening. A single sodium vapor lamp
casts orange light on wet concrete. Rain-slicked rails reflect the approaching
headlight. Leafless trees visible against a dark purple sky beyond the tracks.
A torn schedule poster flaps on a metal post.

STYLE: Wide shot establishing, push in to medium as train approaches.
35mm film, visible grain. Chiaroscuro lighting — the sodium lamp and train
headlight are the only sources. Dutch angle subtle, 5 degrees. Noir color
grade — desaturated with amber and teal accents.

DIALOGUE: None.

SOUNDS: Wind howling across the open platform. The distant rumble of the
approaching train, building in intensity. Rails beginning to sing. The
explosive roar and Doppler-shifted horn as the train blasts through. Then
sudden near-silence — wind and the diminishing train. A tense, minimal
piano note, single key, holds beneath the final silence.

NEGATIVE PROMPT: face distortion, extra limbs, text, watermark, bright colors,
daylight, other people on platform
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.0-generate-preview

---

### Pattern 10: Cooking / Process Close-Up

```
SUBJECT: Professional chef's hands — clean, precise movements. Holding a
Japanese Nakiri knife with visible Damascus steel pattern. A ripe heirloom
tomato on a wooden cutting board.

ACTION: The knife slices through the tomato in one smooth, unhurried motion.
The blade passes through cleanly, revealing the seed chambers and juice.
The two halves fall apart in slow motion. Juice beads on the blade surface.

SCENE: Professional kitchen prep station. Butcher-block cutting board, a
small bowl of sea salt to the left, a sprig of basil to the right. Background
is stainless steel — out of focus but recognizable. Overhead task lighting.

STYLE: Extreme close-up, macro lens. Slow motion (implied through action
description). Overhead bird's-eye angle with slight rack focus from knife to
tomato interior. Shallow depth of field. Food photography lighting — soft
overhead diffused panel, small accent light from camera-left highlighting
the juice. Warm, appetizing color grade.

DIALOGUE: None.

SOUNDS: The crisp, clean slice through the tomato — a satisfying blade-on-board
sound. The wet separation of tomato flesh. A faint kitchen ambient — exhaust
fan hum, distant sizzle from another station.

NEGATIVE PROMPT: blurry knife, distorted hands, extra fingers, floating food,
text, watermark, dirty cutting board
```

**Duration:** 6s | **Aspect:** 16:9 | **Model:** veo-3.1

---

### Pattern 11: Tech Product Demo / Screen Walkthrough

```
SUBJECT: A woman's hand holding a modern smartphone, the screen displaying
a clean UI with visible navigation elements (generic — no specific brand).

ACTION: Her thumb taps a button on the screen, a smooth transition animation
plays, then she swipes up to scroll through a list. The interaction is
natural and confident, not robotic.

SCENE: Bright modern desk — white surface, a laptop partially visible to the
left, a small potted cactus, a coffee cup. Soft afternoon window light from
the right. Minimal, aspirational workspace.

STYLE: Close-up on hands and phone, slight overhead angle (30 degrees).
50mm lens, shallow depth of field keeping the desk background soft. Natural
lighting, no harsh shadows. Clean tech-commercial color grade — slightly cool
whites, vibrant screen colors.

DIALOGUE: A friendly female voice narrates off-screen: "Booking an appointment
takes exactly three taps."

SOUNDS: Soft haptic feedback sounds with each tap. A satisfying UI swoosh on
the transition. Quiet room tone. No music.

NEGATIVE PROMPT: screen glare, unreadable text, distorted UI, extra fingers,
floating phone, motion blur, watermark
```

**Duration:** 6s | **Aspect:** 9:16 | **Model:** veo-3.1

---

### Pattern 12: Fitness / Action Sequence

```
SUBJECT: An athletic man in his early 30s, dark skin, short-cropped hair,
wearing a gray compression shirt and black shorts. Light sheen of sweat.
Focus and determination in his expression.

ACTION: He performs a series of box jumps — explosive leap onto a wooden
plyo box, landing with bent knees, standing tall at the top, then stepping
back down. Two complete reps within the clip duration.

SCENE: Industrial-style CrossFit gym. Raw concrete floor, exposed steel
beams, chalk dust in the air catching light shafts from high windows.
Other equipment (kettlebells, ropes) visible but not in use. Morning light
streaming through warehouse windows.

STYLE: Low-angle wide shot, slight slow motion. Handheld camera with
purposeful shake — athletic broadcast feel. Lens flare from the window
light. Desaturated with high contrast, gritty fitness-brand aesthetic.
24mm wide-angle lens for spatial impact.

DIALOGUE: None.

SOUNDS: The explosive exhale on each jump. Heavy feet landing on wood —
a solid, deep thump. The squeak of shoes on concrete on the step-down.
Distant gym ambient — clanking weights, muffled music from speakers.
An intense, driving electronic beat fades in subtly.

NEGATIVE PROMPT: motion blur, distorted limbs, floating, inconsistent
anatomy, face distortion, watermark, text
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.0-generate-preview

---

### Pattern 13: Real Estate / Architecture Walkthrough

```
SUBJECT: The interior of a modern luxury home — open-plan living area with
double-height ceilings, floor-to-ceiling windows, and a floating staircase.

ACTION: Camera glides smoothly through the front doorway, across the marble
foyer, and into the main living space. The movement reveals the kitchen island
to the left, the living room seating area straight ahead, and the wall of
windows with a pool and garden view beyond.

SCENE: Contemporary architecture — clean lines, white walls, warm wood
accents, polished concrete and marble surfaces. Late afternoon golden hour
light pouring through the western windows. Strategically placed furniture:
cream linen sofa, walnut coffee table, statement pendant light above the
kitchen island. Fresh flowers on the island.

STYLE: Steadicam walkthrough at eye level, 24mm wide-angle lens. Smooth,
uninterrupted forward movement. Real estate videography aesthetic — bright,
aspirational, warm. High-key lighting with golden hour accents. Deep depth
of field — everything in focus.

DIALOGUE: A warm male voice narrates: "Four bedrooms. Thirty-two hundred
square feet. And this view never gets old."

SOUNDS: Footsteps on marble — subtle, clean echoes in the open space.
Distant birdsong through the windows. The gentle splash of the pool
visible outside. No music.

NEGATIVE PROMPT: distortion, warping walls, floating furniture, fish-eye
effect, people, watermark, text, dark shadows
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.1

---

### Pattern 14: Emotional / Brand Story Montage

```
SUBJECT: An older man in his 60s with deep laugh lines, silver hair,
wearing a worn canvas work apron. Calloused hands. Kind, tired eyes.

ACTION: He stands in a small woodworking shop, running his hand slowly
along the surface of a finished wooden table. His fingers trace the grain.
He pauses, looks at the table, and allows a small, private smile — the
satisfaction of completed work.

SCENE: Small artisan woodworking shop. Wood shavings on the floor, hand
tools hanging on a pegboard wall, a bench vise, morning light streaming
through dusty windows. The finished table is the only clean surface in the
shop. Dust motes float in the light beams.

STYLE: Medium shot, slow dolly push in from waist to face over 8 seconds.
Vintage Cooke lens — warm, organic, slightly soft at the edges. Golden
motivated lighting from the window. Shallow depth of field shifting focus
from hands on wood to face. Warm, nostalgic color grade. 35mm film grain.

DIALOGUE: A gentle narrator says: "Thirty years. Every joint by hand.
Every piece, a promise kept."

SOUNDS: The soft whisper of fingertips on smooth wood. A distant bird
outside. The faint creak of the shop floor as he shifts weight. A single,
warm cello note swells slowly underneath.

NEGATIVE PROMPT: face distortion, modern equipment, plastic, bright colors,
text, watermark, other people
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.1

---

### Pattern 15: Horror / Thriller Tension Build

```
SUBJECT: A flashlight beam cutting through darkness, held by an unseen person.
The beam reveals a long, empty hospital corridor — green tile walls, a
wheelchair sitting in the middle of the hallway, one wheel slowly spinning.

ACTION: The flashlight beam sweeps left to right, briefly illuminating room
doors with numbers (302, 304, 306). It settles on the wheelchair. The wheel
slows and stops. A beat of stillness. Then the wheelchair lurches two inches
forward on its own.

SCENE: Abandoned psychiatric hospital, night. No ambient light except the
flashlight. Peeling paint, water stains on ceiling tiles, one fluorescent
fixture dangling by a wire. Grime on the floor, old footprints barely visible.
Absolute isolation.

STYLE: POV handheld shot — the camera IS the person holding the flashlight.
Wide-angle 24mm for spatial distortion. Motivated lighting ONLY from the
flashlight beam — hard shadows, sharp falloff. Found footage aesthetic.
Desaturated, greenish color grade. Subtle film grain.

DIALOGUE: None.

SOUNDS: Breathing — close, slightly elevated. Footsteps on gritty tile
echoing down the corridor. The slow squeak of the wheelchair wheel decelerating.
Silence. Then a metallic scrape as the wheelchair moves. Distant, barely
audible: a door closing somewhere deep in the building.

NEGATIVE PROMPT: bright lighting, clean surfaces, people visible, text,
subtitles, watermark, jump scare, gore, blood
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.0-generate-preview

---

### Pattern 16: Podcast / Studio Two-Shot

```
SUBJECT: Two hosts sitting across from each other at a podcast desk.
HOST A: a bearded man in his mid-30s, wearing a dark henley shirt, over-ear
headphones around his neck. HOST B: a woman in her late 20s, straight dark
hair, tortoiseshell glasses, wearing a cream cable-knit sweater, headphones on.

ACTION: Host A leans back in his chair, gesturing broadly as he makes a point.
Host B nods, then leans forward to respond, adjusting her glasses.

SCENE: Professional podcast studio — acoustic foam panels on walls, two
condenser microphones on boom arms, matching desk with laptops and mugs.
RGB accent lighting in deep purple behind them. A neon sign reading "LIVE"
(off/unlit) on the back wall.

STYLE: Wide two-shot showing both hosts, slight orbital drift camera-left.
50mm lens, moderate depth of field. Three-point lighting per host — key,
fill, and hair light. Warm overall tone with the cool purple accent.
YouTube podcast aesthetic.

DIALOGUE:
Host A gestures and says enthusiastically: "That's exactly the point nobody
is making."
Host B nods and replies thoughtfully: "And that's why it matters."

SOUNDS: Natural studio acoustic — slightly dead room. The subtle pop of the
plosive filter on the mics. A faint air conditioning hum. No music.

NEGATIVE PROMPT: face distortion, mouth artifacts, duplicate microphones,
inconsistent lighting, subtitles, text overlay, watermark
```

**Duration:** 8s | **Aspect:** 16:9 | **Model:** veo-3.0-generate-preview

---

## 4. Prompt Optimization System

### 4.1 Validation Checklist (Expanded Scoring)

Score each prompt 0-2 per criterion before generation. Minimum viable score: 14/20.

| # | Criterion | 0 (Missing) | 1 (Partial) | 2 (Complete) |
|---|-----------|-------------|-------------|--------------|
| 1 | **Subject specificity** | "A person" | "A man in a suit" | "A stocky man in his 50s, salt-and-pepper beard, faded flannel shirt, reading glasses on forehead" |
| 2 | **Action clarity** | No action described | "He talks" | "He sets down his mug, pauses, then looks across the table" |
| 3 | **Scene grounding** | No environment | "In a kitchen" | "Small working-class kitchen, yellow linoleum, morning light from window over the sink, dripping faucet" |
| 4 | **Camera specification** | None | "Close-up" | "Over-the-shoulder, 50mm prime, shallow depth of field, handheld with subtle drift" |
| 5 | **Lighting definition** | None | "Good lighting" | "Motivated lighting from kitchen window — warm side light on faces, fill from overhead fluorescent" |
| 6 | **Audio layering** | None | "Background music" | Foreground/midground/background sounds with spatial cues + emotional tone |
| 7 | **Dialogue formatting** | Wrong format | Has quotes but no colon syntax | Colon syntax + emotional delivery + fits duration |
| 8 | **Negative prompt** | None | "no blur" inline | Separate parameter, under 30 words, noun-list format |
| 9 | **Cross-modal coherence** | Audio contradicts visual | Some alignment | Every sound has a visible source; mood matches across layers |
| 10 | **Duration-action fit** | Action impossible in duration | Tight fit | Action comfortably fits with breathing room for pauses |

### 4.2 Iterative Refinement Workflow

```
CYCLE 1: Foundation
  Generate with your full prompt at default settings.
  Review: Does the subject look right? Is the scene recognizable?
  Fix: Adjust subject description and scene details only. Change nothing else.

CYCLE 2: Camera and Motion
  Lock in the subject/scene from Cycle 1 (use same seed if satisfied).
  Review: Is the camera movement correct? Is framing good?
  Fix: Adjust camera, lens, and movement descriptions only.

CYCLE 3: Audio and Dialogue
  Lock in visual from Cycle 2.
  Review: Is dialogue clear? Is lip-sync working? Does ambient sound match?
  Fix: Adjust dialogue formatting, sound descriptions, audio layering.

CYCLE 4: Polish
  Review: Negative prompt effectiveness, color grade, final details.
  Fix: Fine-tune negative prompt, add style modifiers, adjust duration.
```

**Key principle: change one layer per cycle.** Multi-variable changes make it impossible to diagnose what improved or degraded.

### 4.3 Diagnosing Audio-Visual Sync Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Lips move but wrong words | Dialogue too long for duration | Shorten to ~2 words/second |
| Character speaks but no lip movement | Missing colon syntax | Use `says: "..."` format |
| Sound effect plays at wrong time | Audio not linked to action | Bind with temporal language: "as X happens, the sound of Y" |
| Ambient sound overwhelms dialogue | Audio description weighted toward ambient | Move dialogue description earlier in prompt; reduce ambient word count |
| Music drowns out speech | Music described too prominently | Use "subtle," "underneath," "barely audible" for music; "clearly" for speech |
| Dialogue appears as on-screen text | Model interpreting quotes as subtitles | Add "no subtitles, no text, no captions" to negative prompt |

### 4.4 The Layer-by-Layer Build Technique

When a complex prompt fails, decompose it:

**Step 1 — Visual Only**
```
Generate with ONLY subject + action + scene + camera descriptions.
Set generateAudio: false.
Validate: Does the visual work on its own?
```

**Step 2 — Add Ambient Audio**
```
Re-enable audio. Add only ambient/environmental sounds.
No dialogue yet. No music yet.
Validate: Do the sounds match the visuals?
```

**Step 3 — Add Dialogue**
```
Add character speech with colon syntax.
Keep ambient from Step 2.
Validate: Is lip-sync accurate? Is dialogue audible over ambient?
```

**Step 4 — Add Music (if needed)**
```
Add music description LAST, with subordinate language.
"A subtle score underscores the scene" — not "epic orchestral music plays."
Validate: Does music enhance without competing?
```

This technique isolates which layer is causing problems when a full prompt produces unsatisfactory results.

---

## 5. Veo-Specific Parameters

### 5.1 Model Selection and Prompt Implications

| Model | Resolution | Audio | Speed | Cost | When to Use |
|-------|-----------|-------|-------|------|-------------|
| `veo-3.0-generate-preview` | Up to 1080p | Native joint | Standard | $$ | Final renders, dialogue scenes, cinematic work |
| `veo-3.0-fast-generate-preview` | Up to 1080p | Native joint | ~2x faster | $ | Iteration, testing prompts, draft renders, A/B testing |
| `veo-3.1` | Up to 4K | Native, improved | Standard | $$$ | Final delivery, product shots, 4K requirement, Ingredients/Frames/Extend |
| `veo-3.1-fast` | Up to 1080p | Native | ~2x faster | $$ | Iteration on 3.1 features (Ingredients), draft renders |

**Cost optimization workflow:** Iterate with `veo-3.0-fast` or `veo-3.1-fast`, lock your prompt, then do the final render on the full model. This reduces costs 40-60%.

**Prompt implications by model:**
- **veo-3.0-fast:** Slightly less responsive to subtle style modifiers. Use stronger, more direct language. Reduce from 5 style descriptors to 2-3.
- **veo-3.1 with Ingredients:** Remove physical appearance from prompt text entirely when reference images are provided. Use freed tokens for action and audio.
- **veo-3.1 at 4K:** Add material/texture descriptions that would be invisible at 1080p. Background details need coherence.

### 5.2 Duration Optimization

| Duration | Best For | Prompt Adjustments |
|----------|----------|-------------------|
| **4 seconds** | Single action, reaction shot, transition | One action only. 6-8 spoken words maximum. Reduce camera movement to one simple move. |
| **6 seconds** | Social media content, product reveal, short dialogue | One action + one reaction. 10-14 spoken words. One camera movement with slight adjustment. |
| **8 seconds** | Full scenes, dialogue exchanges, establishing shots | Two-part action sequence. 14-18 spoken words. Up to 2-3 chained camera movements. |

**Duration-action calibration:**
- Count the spoken words in your dialogue. At natural speech pace (~2-2.5 words/sec), 8 seconds fits about 16-20 words.
- Count distinct actions. Each action needs ~2-3 seconds minimum. An 8-second clip supports 2-3 actions.
- Count camera movements. Each movement needs ~3-4 seconds to read well. Chain maximum 2 in 8 seconds.
- If any count exceeds the duration budget, either simplify the prompt or increase duration.

### 5.3 Seed Parameter

```json
{
  "seed": 2847193650
}
```

**Seed behavior:**
- **Same seed + same prompt + same parameters = same output** (deterministic)
- **Same seed + modified prompt = different output** (seed does not override prompt)
- **Same seed + different aspect ratio = different output** (composition changes)
- **Range:** 0 to 4,294,967,295 (uint32)

**Advanced seed strategies:**
- **A/B testing:** Generate two versions of the same prompt with different seeds, compare results, keep the better seed for future iterations
- **Controlled variation:** Lock the seed, make one small prompt change, and isolate the effect of that change
- **Batch consistency:** Use sequential seeds (N, N+1, N+2) for a series of clips in the same project — they will not look identical but often share a tonal quality
- **CI/CD integration:** Pin seeds in automated pipelines for reproducible quality checks

### 5.4 Person Generation and Safety

```json
{
  "personGeneration": "allow_adult"  // or "dont_allow"
}
```

- When `personGeneration` is `"dont_allow"`, any prompt containing people/faces will be rejected
- Required for: product-only shots, nature footage, abstract visuals, architectural walkthroughs
- When enabled, the model applies internal safety filters — certain combinations of person descriptions + actions will be blocked regardless of prompt
- **Practical tip:** If a generation is rejected for safety, simplify the person description. Remove age-specific language, add professional context, and ensure the scene is clearly non-exploitative

### 5.5 enhancePrompt Parameter

```json
{
  "enhancePrompt": true   // default
}
```

- When `true`: The model rewrites prompts under ~30 words internally, adding detail it deems appropriate
- When `false`: Your prompt is used exactly as written — no additions, no reinterpretation
- **Advanced users should set this to `false`** — you want full control over what the model processes
- The enhanced version is sometimes returned in the API response for transparency
- If you are getting unexpected visual elements that are not in your prompt, `enhancePrompt: true` is likely the cause

---

## 6. Anti-Patterns

### 6.1 Dialogue Formatting Mistakes That Break Lip Sync

| Mistake | Example | Why It Breaks | Fix |
|---------|---------|---------------|-----|
| Missing colon | `She says "Hello."` | Model may not trigger lip-sync pathway | `She says: "Hello."` |
| Screenplay format | `SARAH: Hello.` | Model treats as text/label, not speech | `Sarah says: "Hello."` |
| Dialogue too long | 30+ word speech in 8s clip | Words get dropped, sync drifts | Max ~16-18 words for 8s |
| No speaker description | `Someone says: "Hello."` | Model cannot assign the voice to a face | Describe the speaker visually before their line |
| Multiple speakers, same appearance | Two men in suits both speak | Model cannot differentiate who speaks | Differentiate by 3+ unique visual markers |
| Inner quotes in dialogue | `She says: "He told me 'run' and I did."` | Nested quotes confuse the parser | Simplify: `She says: "He told me to run."` |

### 6.2 Audio Descriptions That Conflict with Visuals

| Conflict | Why It Fails | Fix |
|----------|-------------|-----|
| "Quiet library" scene + "loud rock music" audio | Joint diffusion tries to satisfy both; neither works well | Match audio mood to visual mood |
| Indoor scene + "birds chirping, wind in trees" | Unmotivated sound sources break coherence | Only describe sounds that have a plausible source in the scene |
| Nighttime exterior + no ambient sound described | Model may generate random audio to fill silence | Explicitly describe night sounds: crickets, distant traffic, wind |
| "Thunderstorm rages" + subject has dry hair/clothes | Visual and audio tell different weather stories | Align weather across all components |
| "Upbeat pop music" + somber funeral scene | Emotional mismatch causes tonal incoherence | Score should mirror visual emotion |

### 6.3 Over-Relying on Negative Prompts

**The rule:** If you find yourself adding more than 15 negative prompt items, your positive prompt is underspecified.

| Problem | Negative Prompt Approach (weak) | Positive Prompt Approach (strong) |
|---------|-------------------------------|----------------------------------|
| Shaky footage | "no camera shake" | "locked-off tripod shot, perfectly stable camera" |
| Wrong number of people | "no crowd, no extra people" | "a solitary figure, completely alone" |
| Bad hand anatomy | "no extra fingers, no distorted hands" | "natural hand pose, anatomically correct fingers" |
| Unwanted text on screen | "no subtitles, no captions, no text" | This one legitimately belongs in negatives |
| Generic lighting | "no flat lighting" | "chiaroscuro lighting, single key light from upper-left at 45 degrees" |

### 6.4 Resolution/Quality Keywords the Model Ignores vs. Responds To

**IGNORED (waste of tokens):**
- "4K," "8K," "ultra HD," "high resolution," "high quality," "best quality"
- "masterpiece," "award-winning," "professional quality"
- "photorealistic" (the model is already photorealistic by default)
- "HDR" (tonemapping is handled by the model internally)
- "60fps," "120fps" (frame rate is not user-controllable)

**EFFECTIVE (model responds to these):**
- Lens references: "anamorphic lens," "85mm portrait lens," "macro lens"
- Film stock: "shot on 35mm film," "Kodak Portra 400," "vintage Cooke lens"
- Lighting setups: "chiaroscuro," "rim lighting," "golden hour," "practical lighting"
- Camera movements: "dolly push," "steadicam follow," "crane up"
- Color grading: "desaturated," "warm color grade," "teal and orange"
- Format references: "IMAX format," "documentary style," "found footage"
- Depth of field: "shallow depth of field," "deep focus," "rack focus"
- Grain/texture: "film grain," "clean digital," "grainy 16mm"

**The distinction:** The model responds to **creative direction** (how a human cinematographer would shoot it) but ignores **technical output specifications** (resolution numbers, format specs). Direct resolution through the API parameter, not the prompt.

---

## Appendix: Quick Reference Card

```
OPTIMAL PROMPT LENGTH:    100-200 words
OPTIMAL DURATION:         8 seconds (6s for action-heavy, 4s for reactions)
DIALOGUE WORD BUDGET:     ~2 words/second of clip duration
MAX CAMERA MOVEMENTS:     2-3 per 8-second clip
MAX STYLE MODIFIERS:      3 stacked (beyond 3 causes averaging)
NEGATIVE PROMPT LENGTH:   Under 30 words, noun-list format
MAX SIMULTANEOUS ACTIONS: 1 dominant + 1 secondary
MAX SPEAKERS PER CLIP:    2 (reliable), 3+ (unreliable)
REFERENCE IMAGES (3.1):   Up to 3, clear and well-lit
ASPECT RATIOS:            16:9 (cinematic) or 9:16 (vertical/mobile)

COLON SYNTAX:             Character says: "Dialogue here."
AUDIO HIERARCHY:          Foreground > Midground > Background
SEED RANGE:               0 to 4,294,967,295

ITERATION MODEL:          veo-3.0-fast or veo-3.1-fast
FINAL RENDER MODEL:       veo-3.0 or veo-3.1
```


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
