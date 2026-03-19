# Advanced Prompt Engineering for Wan 2.1 / 2.2 / 2.5 Video Generation

**Scope:** Production-grade prompt engineering for Wan family diffusion models (2.1, 2.2 MoE, 2.5 audio-native). Covers T5 encoder behavior, guidance scale interaction, negative prompt architecture, LoRA prompting, VACE editing syntax, and parameter-prompt co-optimization.

**Audience:** Practitioners who already understand diffusion model fundamentals, flow matching, and have generated videos with Wan. Not a getting-started guide.

**Sources:** Wan 2.1/2.2 official repos (Wan-Video/Wan2.1, Wan-Video/Wan2.2), Replicate parameter sweep research, HuggingFace Diffusers documentation, Civitai community LoRA training guides, ComfyUI-WanVideoWrapper (Kijai), Stable Diffusion Art VACE tutorials, fal.ai and Atlabs Wan 2.5/2.6 prompt guides, DeepWiki Wan2GP text encoder analysis, AMD ROCm USP parallelism blog.

---

## 1. Wan Prompt Architecture

### 1.1 How Diffusion Models Interpret Prompts vs. Commercial APIs

Wan is a flow-matching DiT (Diffusion Transformer) -- not an autoregressive video model. This distinction fundamentally changes how prompts work:

| Aspect | Commercial API (Sora, Veo, Runway) | Wan (Open Diffusion) |
|--------|--------------------------------------|----------------------|
| Prompt processing | LLM-parsed, internally rewritten | Raw T5 encoding, direct cross-attention |
| Negative prompts | Handled internally or absent | Critical -- user-controlled classifier-free guidance |
| Guidance scale | Fixed/hidden | Exposed, must be tuned per prompt |
| Prompt extension | Always-on internal | Optional, uses Qwen LLM |
| Token handling | Abstracted | 512-token T5 limit, truncation is silent |
| Determinism | Non-reproducible | Seed-controlled, reproducible (single-GPU) |

The practical consequence: on Wan, the prompt is not "instructions to an AI assistant." It is a conditioning signal injected via cross-attention into every transformer block during denoising. The T5 encoder converts your text into a sequence of high-dimensional embeddings. These embeddings do not understand narrative structure -- they understand semantic proximity between tokens.

This means:
- **Order matters less than semantic density.** "A cat on a table, sunlight streaming through a window" and "Sunlight streaming through a window, a cat on a table" produce nearly identical results.
- **Adjectives bind to their nearest noun.** "A red car and blue sky" works. "A car that is red with a sky that is blue" wastes tokens.
- **Verbs describing motion are critical.** The model needs explicit motion cues -- "walks," "spins," "drifts," "erupts" -- because the temporal dimension is guided by these signals.
- **Style tokens propagate globally.** "Cinematic, 4K, shallow depth of field" affects the entire generation, not just one element.

### 1.2 T5 Text Encoder: UMT5-XXL Architecture

Wan uses the UMT5-XXL (Universal Multilingual T5) text encoder -- a 24-layer transformer with ~4.7B parameters. Key characteristics:

- **Token limit: 512 tokens.** Beyond this, tokens are silently truncated. At roughly 0.75 tokens per word (English), this gives ~380 words maximum. In practice, prompt quality degrades well before this limit.
- **Bilingual encoding.** UMT5 handles both English and Chinese natively. You can mix languages, though English prompts are better documented for community LoRAs.
- **Subword tokenization.** Unlike CLIP (used in SD 1.5/SDXL), T5 uses SentencePiece tokenization. It handles compound words and technical terms better, but unusual proper nouns may be split unpredictably.
- **No CLIP-style embedding space.** T5 embeddings are not trained on image-text pairs like CLIP. They are pure language model embeddings, meaning the model learned prompt-to-video associations entirely during Wan's training phase. This makes Wan less responsive to "CLIP tricks" (token weighting, prompt blending) and more responsive to natural language descriptions.

**Optimal prompt length:** 80-150 words (roughly 100-200 tokens). Below 40 words, the model fills semantic gaps with its training distribution defaults (often generic "cinematic" looks). Above 200 words, later tokens get progressively weaker attention.

### 1.3 Prompt Extension: When to Use It and When to Write Manually

Wan's prompt extension system uses a Qwen LLM (Qwen2.5-14B-Instruct by default, smaller models available) to expand a short prompt into a detailed description. It works two ways:

1. **DashScope API (cloud):** Sends your prompt to Alibaba's API for expansion.
2. **Local model:** Runs Qwen locally (Qwen2.5-3B/7B/14B-Instruct for T2V, Qwen2.5-VL-3B/7B-Instruct for I2V).

**When prompt extension helps:**
- Quick iteration on rough ideas ("a cat in space" becomes a full scene description)
- Users unfamiliar with video prompting structure
- Generating diverse outputs from minimal input
- When you want the model's trained aesthetic defaults to fill in gaps

**When prompt extension hurts:**
- Precise scene control (extension may add unwanted elements)
- LoRA-triggered styles (extension may dilute or conflict with trigger words)
- Specific camera movements (extension tends to add generic "cinematic" camera work)
- Technical/scientific visualizations (extension adds artistic embellishment)
- Reproducing a specific result (extension output varies between runs)

**Rule of thumb:** If your prompt is under 30 words and you do not need precise control, use extension. If your prompt is 80+ words and carefully structured, skip it -- the extension will rewrite your intent.

CLI flag: `--use_prompt_extend` (official repo) or `--prompt_extend_method` to choose DashScope vs. local.

### 1.4 Guidance Scale and Prompt Specificity

The `guidance_scale` (also `sample_guide_scale` in CLI) controls classifier-free guidance (CFG) strength. It modulates how much the model favors the conditioned (prompted) denoising path vs. the unconditioned path.

**The guidance-prompt interaction:**

| Guidance Scale | Prompt Adherence | Visual Quality | Best For |
|---------------|-----------------|---------------|---------|
| 0.0 | None (ignores prompt) | Pure model prior | Abstract exploration |
| 1.0-2.0 | Minimal | Soft, dreamy | Loose creative experimentation |
| 3.0-4.0 | Moderate | Natural, organic | Photorealistic with breathing room |
| **5.0** | **Good (default)** | **Balanced** | **General purpose** |
| 6.0-7.0 | Strong | Slightly processed | Specific scene requirements |
| 7.5 | Very strong | Starting to oversaturate | Maximum prompt fidelity without major artifacts |
| 8.0+ | Extreme | Overcooked, "AI shine" | Avoid for photorealism |
| 10.0+ | Over-guided | Artifacts, burned highlights | Only for stylized/abstract |

**Critical insight from Replicate's parameter sweep:** Guidance scale has a much stronger effect than shift on output quality. At `guide_scale=8+`, skin becomes unnaturally smooth and shiny, colors oversaturate, and the "AI-generated" look becomes obvious. The sweet spot for photorealism is 3.0-6.0.

**Prompt specificity determines optimal guidance:**
- Vague prompt ("a beautiful landscape") + high guidance = the model forces adherence to ambiguous semantics, producing generic but heavily processed output
- Specific prompt ("drone shot over Norwegian fjords at golden hour, mist rising from teal water, slow forward dolly") + moderate guidance (5.0) = the prompt provides enough signal that the model does not need to be forced
- Specific prompt + low guidance (2.0-3.0) = more organic, film-like quality while still following the scene description

### 1.5 Negative Prompts: Why They Matter More on Wan

Commercial APIs handle artifact suppression internally. On Wan, you are responsible for the unconditioned guidance signal. The negative prompt defines what the model should steer AWAY from during denoising.

Without a negative prompt, Wan defaults to its training distribution, which includes low-quality training samples, still images, text overlays, and other artifacts. The negative prompt is not optional -- it is a core part of the generation pipeline.

---

## 2. Advanced Techniques

### 2.1 Negative Prompt Mastery

**The Comprehensive Baseline Negative Prompt:**

```
Bright tones, overexposed, static, blurred details, subtitles, style, works, paintings, images, static, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers, still picture, messy background, three legs, many people in the background, walking backwards
```

This is the official Wan negative prompt from the repository. It targets the most common failure modes. Use it as a starting point, not as a fixed template.

**Deconstructing the negative prompt by category:**

| Category | Tokens | Purpose |
|----------|--------|---------|
| Exposure | `bright tones, overexposed, overall gray` | Prevents blown highlights and flat contrast |
| Motion | `static, still picture, walking backwards` | Forces temporal coherence and forward motion |
| Quality | `worst quality, low quality, JPEG compression residue, ugly` | Suppresses low-quality training data influence |
| Anatomy | `extra fingers, poorly drawn hands/faces, deformed, disfigured, misshapen limbs, fused fingers, three legs` | Reduces body horror artifacts |
| Composition | `messy background, many people in the background` | Keeps scenes clean |
| Media artifacts | `subtitles, style, works, paintings, images` | Prevents text overlays and non-photo styles |
| Detail | `blurred details, incomplete` | Enforces sharpness |

**When to customize:**

- **Anime/illustration style:** Remove `paintings, style, works, images` from negatives (you WANT stylized output).
- **Crowd scenes:** Remove `many people in the background` (obviously).
- **Artistic/abstract:** Remove most quality tokens, keep only `blurred details, JPEG compression residue`.
- **Text-in-video:** Remove `subtitles` from negative if you want readable text.
- **Dark/moody scenes:** Remove `overall gray, bright tones` and add `overlit, flat lighting`.

**Extended negative prompt for photorealism (advanced):**

```
Bright tones, overexposed, static, blurred details, subtitles, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers, still picture, messy background, three legs, walking backwards, morphing, warping, face deformation, flickering, sudden movements, jerky motion, camera shake, unstable camera, rapid changes, text overlay, watermark, logo, CGI look, plastic skin, uncanny valley, dead eyes, floating objects, physics violations
```

**The "negative prompt subtraction" technique:**

This is a systematic debugging method:

1. Start with the full comprehensive negative prompt.
2. Generate a video and assess quality.
3. Remove one category of negative tokens (e.g., all anatomy tokens).
4. Regenerate with the same seed and compare.
5. If quality improves or a desired element returns, that category was overcorrecting.
6. Repeat for each category.

This is particularly useful when negative prompts conflict with your intent. Example: negative `static` can fight against a prompt requesting "a still life painting comes to life" because the model receives conflicting signals about how much motion to introduce.

### 2.2 Guidance Scale Tuning

**Systematic tuning protocol:**

```python
# Parameter sweep script pattern
guidance_values = [3.0, 4.0, 5.0, 6.0, 7.0, 7.5]
seed = 42  # Fixed seed for comparison

for gs in guidance_values:
    output = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        guidance_scale=gs,
        num_frames=81,
        height=480, width=832,
        generator=torch.Generator("cuda").manual_seed(seed)
    ).frames[0]
    export_to_video(output, f"sweep_gs_{gs}.mp4", fps=16)
```

**Guidance scale interaction with content type:**

| Content Type | Optimal GS | Rationale |
|-------------|-----------|-----------|
| Photorealistic portrait | 3.0-5.0 | High GS causes plastic skin, dead eyes |
| Nature/landscape | 5.0-6.0 | Nature tolerates higher adherence |
| Product showcase | 6.0-7.0 | Need precise object rendering |
| Abstract/artistic | 1.0-3.0 | Let the model hallucinate freely |
| Text-in-video | 6.0-7.5 | Text rendering needs strong guidance |
| Character animation | 4.0-6.0 | Balance between identity and motion |
| Architectural | 5.0-7.0 | Geometric precision benefits from higher GS |

**Guidance + shift co-tuning (14B model):**

The `shift` parameter (also `sample_shift`) controls the flow matching schedule. It determines how the denoising timesteps are distributed.

- **Low shift (3-6):** More diversity in composition, varied framing, potentially more artifacts.
- **High shift (7-9):** More consistent framing, better overall quality, less diversity.
- **Default shift for 14B:** 5.0 (Diffusers pipeline default).
- **Default shift for 1.3B:** 8.0 (recommended range 8-12).

The shift has a subtler effect than guidance scale. Tune guidance first, then fine-tune shift.

### 2.3 Prompt Extension Deep Dive

**How it works internally:**

The prompt extension system uses a Qwen LLM with a system prompt that instructs it to expand the user's description into a structured video scene description. The expansion follows the pattern:

```
User input: "a cat playing piano"
Extended output: "A fluffy orange tabby cat sits at a grand piano in a warmly
lit living room. Its paws move across the black and white keys with surprising
dexterity, producing melodic notes. Soft afternoon sunlight streams through
sheer curtains, casting golden highlights on the cat's fur. The camera holds
a medium close-up shot, slightly angled to capture both the cat's focused
expression and its moving paws. Warm color palette with amber and cream tones.
Shallow depth of field blurs the background bookshelves."
```

**Extension model selection by VRAM:**

| Model | VRAM Required | Quality |
|-------|-------------|---------|
| Qwen2.5-14B-Instruct | ~28GB total with Wan | Best expansion |
| Qwen2.5-7B-Instruct | ~20GB total | Good balance |
| Qwen2.5-3B-Instruct | ~16GB total | Acceptable for drafts |
| DashScope API | 0 (cloud) | Best, but requires API key |

**When extension actively degrades results:**

1. **LoRA-triggered generation.** Extension rewrites your trigger word context, diluting the LoRA's learned associations. Always write manually when using LoRAs.
2. **Multi-subject scenes.** Extension tends to simplify complex scenes, merging or dropping subjects.
3. **Specific camera choreography.** If you wrote "slow 180-degree orbit starting from behind the subject," extension may replace it with "cinematic camera movement."
4. **Iterative refinement.** When you are refining a specific output by tweaking prompt words, extension introduces too much variance between iterations.

### 2.4 LoRA Integration Prompting

**Trigger word design principles:**

- Use a unique, nonsense token: `sks`, `ohwx`, `zxy_style`, `v2style`. Avoid real words -- the T5 encoder assigns meaning to real words, creating interference.
- Place the trigger word at the START of the prompt for maximum attention weight.
- For style LoRAs, the trigger word alone may suffice: `v2style, a mountain landscape at dawn`.
- For character LoRAs, combine trigger with character description: `ohwx person, a woman with short black hair, walking through a market`.

**LoRA strength and prompt interaction:**

```python
# ComfyUI: LoRA loader node
# strength 0.5-0.7: subtle style influence, prompt dominates
# strength 0.8-1.0: strong LoRA effect, prompt provides scene/motion
# strength 1.2+: LoRA overwhelms, prompt barely matters (usually too much)

pipeline.load_lora_weights("path/to/lora.safetensors", adapter_name="style")
pipeline.set_adapters("style", adapter_weights=[0.75])
```

**Prompting differences with LoRA active:**

| Without LoRA | With Style LoRA | With Character LoRA |
|-------------|----------------|-------------------|
| Full scene + style description | Scene + motion only (LoRA handles style) | Scene + motion + character action |
| Include quality tokens | Quality comes from LoRA training | Include character-identifying details |
| 80-150 words | 40-80 words (style tokens are redundant) | 60-120 words |
| Standard negative | May need modified negative (remove style-related negatives) | Add character-specific negatives ("wrong hair color, different face") |

**Dataset captioning impact on prompting:**

How you caption LoRA training data determines how you must prompt during inference:

- **Trigger-only captions** ("v2style"): The LoRA learns to associate the trigger with ALL visual characteristics. Prompt with trigger + scene description.
- **Structured captions** ("v2style, scene of a forest with sunlight, cinematic lighting, wide shot"): The LoRA learns trigger-style separation. Prompt with trigger + whatever scene elements you want.
- **Natural language captions** ("A beautiful forest scene in the style of v2style with dramatic lighting"): Most flexible but requires more training data.

Community recommendation from Civitai: For style LoRAs, use trigger-only captions. For character LoRAs, use structured captions with scene description but consistent character tags.

### 2.5 VACE Editing Prompts

VACE (Video All-in-One Creation and Editing) unifies multiple editing tasks under a single model. The prompt strategy changes based on the editing mode.

**Mask semantics:**
- **Black mask = preserve** (conditioning -- keep original content)
- **White mask = generate** (inpaint/outpaint -- create new content)

**Inpainting prompt strategy:**

When inpainting (replacing a masked region), the prompt should describe ONLY the content you want in the masked area, not the entire scene. The unmasked regions provide their own conditioning.

```
# Scene: A person standing in a park
# Mask: Covers the person's shirt
# BAD prompt: "A person in a park wearing a red jacket"
# GOOD prompt: "A red leather jacket with silver zipper"
```

The surrounding context is already encoded by the unmasked frames. Describing the full scene dilutes attention on the inpainted region.

**Outpainting prompt strategy:**

For outpainting (expanding the frame), describe what should appear in the expanded area while maintaining consistency with existing content.

```
# Original: Close-up of a coffee cup on a table
# Outpainting direction: Expand right
# GOOD prompt: "A cozy cafe interior extends to the right, warm wooden tables
# and chairs, soft ambient lighting, matching the warm tone of the existing scene"
```

**Reference-to-video (subject-driven generation):**

VACE supports using a reference image to drive character consistency. The prompt should describe the action and scene while the reference image provides the appearance.

```
# Reference: Photo of a specific person
# Prompt: "The person walks confidently through a modern office,
# natural stride, overhead fluorescent lighting, medium tracking shot"
```

Do NOT describe the person's appearance in the prompt -- the reference image handles that. Describe motion, scene, and camera only.

**Control-to-video modes:**

VACE supports depth, pose, sketch, flow, grayscale, scribble, and layout conditioning. When using these control modes, the prompt complements the structural signal:

- **Depth control:** Prompt focuses on texture, color, style (depth provides structure).
- **Pose control:** Prompt focuses on clothing, environment, lighting (pose provides motion).
- **Sketch control:** Prompt focuses on everything except shape (sketch provides shape).

### 2.6 ComfyUI Workflow Prompting

In node-based workflows, prompt engineering changes because:

1. **Positive and negative prompts are separate nodes** (CLIP Text Encode). You can wire different prompts to different stages.
2. **LoRA loaders inject before the text encoder.** The LoRA modifies how the T5 encoder processes your prompt, not just the denoising.
3. **Prompt scheduling is possible.** Different prompts at different denoising timesteps (early = composition, late = detail).
4. **Weighted prompting syntax** varies by node implementation. Kijai's WanVideoWrapper supports `(word:weight)` syntax, but native ComfyUI nodes may not.

**ComfyUI-specific prompt workflow:**

```
[CLIP Text Encode (Positive)]
  -> "A samurai standing on a misty mountaintop at dawn,
      wind blowing his robes, camera slowly orbits,
      cinematic lighting, 4K, film grain"

[CLIP Text Encode (Negative)]
  -> "static, blurred, deformed, low quality,
      JPEG artifacts, watermark, text"

[EmptyWanLatentVideo]
  -> num_frames: 81, height: 480, width: 832

[WanVideoSampler]
  -> guidance_scale: 5.0, steps: 30
```

**Prompt scheduling for complex scenes (advanced):**

Some ComfyUI workflows support changing the prompt at specific denoising steps. This is powerful for Wan because:

- Steps 1-10 (structure): Use a simple, compositional prompt ("wide shot of a mountain landscape").
- Steps 11-25 (detail): Switch to a detailed prompt ("misty peaks with pine forests, golden hour light, slow camera pan right").
- Steps 26-30 (refinement): Use a quality-focused prompt ("sharp details, film grain, cinematic color grading").

This requires custom nodes (not native Wan support) but produces significantly better results for complex scenes.

### 2.7 Multi-GPU Consistency

Wan supports multi-GPU inference via Unified Sequence Parallelism (USP), which distributes attention computation across GPUs using DeepSpeed-Ulysses (all-to-all) and Ring-Attention.

**Consistency challenge:** Multi-GPU inference with the same seed does NOT produce identical results to single-GPU inference. The parallelism changes floating-point operation order, introducing numerical differences that compound through 30+ denoising steps.

**Mitigation strategies:**

1. **Develop on single GPU, deploy on multi-GPU.** Accept that multi-GPU is for speed, not exact reproduction.
2. **Use seed ranges, not single seeds.** Generate 5-10 seeds on single GPU, pick best, then use that seed on multi-GPU for a "close enough" result.
3. **Fix parallelism config.** If you must compare runs, keep `--ulysses_size` and `--ring_size` identical. Changing parallelism topology changes output.

```bash
# Reproducible multi-GPU command
torchrun --nproc_per_node=4 generate.py \
  --task t2v-14B \
  --size 1280*720 \
  --seed 42 \
  --ulysses_size 4 \
  --ring_size 1 \
  --prompt "Your prompt"
```

### 2.8 Wan 2.5 Audio Prompting

Wan 2.5 introduces native audio generation alongside video. Audio is not a separate pipeline -- it is generated as part of the same diffusion process, synchronized to the visual content.

**Audio description in prompts:**

Audio cues should be embedded naturally in the prompt. The model understands three categories:

1. **Dialogue:** Use quotation marks for spoken words.
   ```
   A man at a podium says "Welcome to the conference" while
   adjusting his microphone. Audience applause fades to silence.
   ```

2. **Sound effects (SFX):** Describe sounds as part of the scene action.
   ```
   A glass bottle shatters on concrete, sharp cracking sound
   followed by tinkling of scattered glass fragments. Urban
   traffic noise in the background.
   ```

3. **Music/ambience:** Specify genre, mood, or instrumentation.
   ```
   A lone guitarist plays soft acoustic fingerpicking on a
   porch at sunset. Crickets chirp in the background. Warm,
   melancholic folk melody.
   ```

**Audio prompt constraints:**

- Keep dialogue under 10 words for a 5-second clip. Longer dialogue gets compressed or garbled.
- Specify the character speaking when multiple people are present.
- Environmental sounds (wind, rain, traffic) work more reliably than specific music.
- Do not describe audio in isolation -- always pair sound descriptions with visual actions.

**Audio-visual synchronization tips:**

- Tie sounds to visible actions: "She claps her hands, a sharp clapping sound echoes."
- Avoid describing off-screen sounds (the model struggles with invisible audio sources).
- For music, describe the mood rather than specific notes: "upbeat jazz saxophone" not "C major scale."

### 2.9 Frame Count and Prompt Interpretation

The `num_frames` parameter significantly affects how the model interprets motion and scene complexity.

| Frames | Duration (16fps) | Duration (24fps) | Motion Budget | Prompt Strategy |
|--------|-----------------|-----------------|---------------|----------------|
| 33 | ~2s | ~1.4s | Minimal | Single action, static camera |
| 49 | ~3s | ~2s | Low | One smooth motion, simple camera move |
| **81** | **~5s** | **~3.4s** | **Moderate (default)** | **1-2 actions, one camera move** |
| 121 | ~7.5s | ~5s | Good | 2-3 sequential actions, camera transitions |
| 161 | ~10s | ~6.7s | High | Complex choreography, multiple scene elements |

**The frame-prompt relationship:**

- **Fewer frames = simpler prompt.** At 33 frames, describe one thing happening. Multi-step actions will be compressed into a blur.
- **More frames = more prompt detail pays off.** At 161 frames, you have time for "she picks up the cup, takes a sip, sets it down, and looks out the window."
- **Camera movements need frames.** A "slow 360-degree orbit" at 33 frames will be a jerky partial rotation. At 121+ frames, it becomes smooth.
- **Frame count must be `4k + 1`.** Valid values: 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81, 85, 89, 93, 97, 101, 105, 109, 113, 117, 121, 125, 129... The VAE requires this alignment.

**Warning:** Higher frame counts increase VRAM usage linearly and generation time quadratically (attention scales with sequence length squared). 161 frames at 720P on the 14B model requires 40GB+ VRAM or aggressive offloading.

---

## 3. Proven Prompt Patterns

Each pattern includes the complete prompt, negative prompt, and recommended parameters. All prompts are tested against Wan 2.1 14B at the specified resolution.

### Pattern 1: Photorealistic Human Portrait in Motion

```
PROMPT:
A woman in her 30s with dark wavy hair and olive skin stands in a sun-dappled
courtyard. She slowly turns her head from profile to three-quarter view, a slight
smile forming. Wind catches loose strands of hair. The camera holds a medium
close-up with shallow depth of field. Late afternoon golden hour light creates
warm highlights on her cheekbones and rim light along her jawline. Natural skin
texture, subtle makeup. Film grain, Arri Alexa color science.

NEGATIVE PROMPT:
Overexposed, static, blurred details, worst quality, low quality, JPEG artifacts,
deformed face, asymmetrical eyes, uncanny valley, plastic skin, dead eyes,
doll-like, CGI look, morphing, flickering, extra fingers, watermark

PARAMETERS:
  guidance_scale: 4.5
  num_frames: 81
  resolution: 832x480 (480P) or 1280x720 (720P)
  shift: 7
  steps: 30
```

### Pattern 2: Nature/Landscape Cinematic

```
PROMPT:
Aerial drone shot slowly descending over a Norwegian fjord at blue hour. Still
teal water reflects snow-capped mountains on both sides. Thin wisps of fog drift
across the water surface. A small red fishing cabin sits at the shoreline, warm
light glowing from its windows. The camera glides forward and tilts down slightly.
Muted color palette with deep blues, teals, and touches of warm amber. Anamorphic
lens flare from the cabin light. Ultra-wide composition.

NEGATIVE PROMPT:
Overexposed, bright tones, static, blurred details, worst quality, low quality,
JPEG compression residue, text, watermark, logo, people, crowds, messy composition,
oversaturated, cartoon, painting

PARAMETERS:
  guidance_scale: 5.5
  num_frames: 121
  resolution: 1280x720
  shift: 7
  steps: 30
```

### Pattern 3: Product Showcase

```
PROMPT:
A matte black wireless headphone rotates slowly on a circular platform against
a dark gradient background. Studio three-point lighting highlights the textured
ear cups and brushed metal accents. Subtle reflections on the glossy platform
surface. The camera orbits 90 degrees at eye level in a smooth arc. Clean,
minimalist composition. Sharp focus on the product with soft ambient fill light.
Commercial photography style, product advertising aesthetic.

NEGATIVE PROMPT:
Blurred details, static, worst quality, low quality, JPEG artifacts, text,
watermark, fingerprints, dust, scratches, messy background, cluttered, multiple
products, hands, people, overexposed highlights

PARAMETERS:
  guidance_scale: 6.5
  num_frames: 81
  resolution: 1280x720
  shift: 6
  steps: 30
```

### Pattern 4: Abstract Art / Creative

```
PROMPT:
Liquid mercury flows and pools on a surface of dark obsidian glass, forming
organic fractal patterns. Bioluminescent blue and violet light pulses from within
the mercury streams. Slow, hypnotic undulation. Macro lens perspective, extreme
close-up. The mercury separates into spheres that reconnect in new configurations.
Dark ambient atmosphere, no visible horizon. Otherworldly, meditative quality.

NEGATIVE PROMPT:
Text, watermark, faces, people, realistic scene, everyday objects, bright tones,
overexposed, JPEG artifacts, low quality

PARAMETERS:
  guidance_scale: 2.5
  num_frames: 121
  resolution: 832x480
  shift: 5
  steps: 30
```

### Pattern 5: Character Animation (Anime/Stylized)

```
PROMPT:
Anime style. A young warrior with spiky silver hair and a tattered red cape
stands on a cliff edge. Wind whips the cape dramatically. He draws a glowing
blue katana from his back in one fluid motion, holds it forward, blade catching
the light. Dynamic angle from slightly below. Storm clouds churn behind him with
occasional lightning flashes. Cel-shaded rendering, bold outlines, vibrant colors.
Inspired by Studio Bones animation quality.

NEGATIVE PROMPT:
Realistic, photographic, static, blurred, worst quality, low quality, JPEG
artifacts, deformed hands, extra fingers, 3D CGI, uncanny valley, dull colors,
flat lighting, no motion

PARAMETERS:
  guidance_scale: 6.0
  num_frames: 81
  resolution: 832x480
  shift: 7
  steps: 30
```

### Pattern 6: Time-Lapse Effect

```
PROMPT:
Time-lapse of a rose blooming from tight bud to full bloom. The petals unfurl
in accelerated motion, each layer revealing deeper crimson tones. Water droplets
on the petals catch light and evaporate. The stem sways slightly. Shot against
a soft black background with single directional warm light from the upper left.
Macro photography, focus stacking effect, extreme detail on petal texture and
translucency. Natural color palette.

NEGATIVE PROMPT:
Static, no motion, blurred details, worst quality, low quality, JPEG artifacts,
multiple flowers, cluttered background, text, watermark, oversaturated, artificial
colors, wilting, dying

PARAMETERS:
  guidance_scale: 5.5
  num_frames: 121
  resolution: 1280x720
  shift: 7
  steps: 30
```

### Pattern 7: Underwater Scene

```
PROMPT:
Underwater footage of a sea turtle gliding through a coral reef. Schools of
small yellow fish scatter and reform around the turtle. Shafts of sunlight
penetrate from the surface, creating caustic light patterns on the sandy bottom.
The camera follows the turtle at a steady distance in a tracking shot. Turquoise
and emerald water color. Gentle particulate matter floating in the water column.
Natural underwater color temperature with slight blue-green cast.

NEGATIVE PROMPT:
Static, blurred, worst quality, low quality, JPEG artifacts, text, watermark,
air bubbles covering lens, murky water, overexposed surface, dark, people,
divers, scuba gear, deformed animal, extra limbs

PARAMETERS:
  guidance_scale: 5.0
  num_frames: 121
  resolution: 1280x720
  shift: 7
  steps: 30
```

### Pattern 8: Aerial / Drone

```
PROMPT:
Aerial drone footage ascending vertically above a winding river cutting through
dense autumn forest. The trees display peak fall colors -- burnt orange, crimson,
golden yellow against patches of evergreen. The river reflects the sky, appearing
as a silver ribbon. As the camera rises, the scale of the forest becomes apparent.
Morning mist lingers in the lower valleys. Soft overcast lighting with no harsh
shadows. The camera rotates slowly clockwise during ascent. Wide dynamic range.

NEGATIVE PROMPT:
Static, blurred, worst quality, low quality, JPEG artifacts, text, watermark,
buildings, roads, cars, people, power lines, oversaturated, flat perspective,
ground-level view

PARAMETERS:
  guidance_scale: 5.5
  num_frames: 161
  resolution: 1280x720
  shift: 7
  steps: 30
```

### Pattern 9: Urban Street Scene

```
PROMPT:
A busy Tokyo intersection at night during light rain. Neon signs reflect in wet
asphalt, creating streaks of pink, blue, and gold. Pedestrians with umbrellas
cross the street as traffic signals change. Steam rises from a ramen shop vent.
The camera is positioned at street level, slowly panning right across the scene.
Cars pass with visible headlight glare and rain-streaked windshields. Blade Runner
atmosphere, cyberpunk color palette without the fantasy elements. Shallow depth
of field isolates a foreground umbrella.

NEGATIVE PROMPT:
Overexposed, static, blurred, worst quality, low quality, JPEG artifacts,
daytime, dry pavement, empty street, text overlay, watermark, deformed faces,
extra limbs, Western architecture, suburban

PARAMETERS:
  guidance_scale: 5.0
  num_frames: 81
  resolution: 1280x720
  shift: 7
  steps: 30
```

### Pattern 10: Food / Cooking Close-Up

```
PROMPT:
Extreme close-up of chocolate ganache being poured over a layered cake. The
glossy dark chocolate flows over the edge in slow, viscous streams, coating the
sides. The camera is at table level, slightly below the cake surface. Warm
directional lighting from the right highlights the reflective surface of the
ganache. Shallow depth of field blurs the background kitchen. Wisps of steam
rise from the warm chocolate. Rich, warm color grading emphasizing browns,
ambers, and cream. Food photography style.

NEGATIVE PROMPT:
Static, blurred, worst quality, low quality, JPEG artifacts, text, watermark,
hands, fingers, utensils in frame, messy splatter, burnt food, unappetizing,
cold lighting, blue tones, overexposed

PARAMETERS:
  guidance_scale: 5.5
  num_frames: 81
  resolution: 1280x720
  shift: 6
  steps: 30
```

### Pattern 11: Sci-Fi / VFX

```
PROMPT:
A massive spacecraft emerges from hyperspace above an ice planet. The jump effect
creates a brief flash of blue-white light that dissipates into particle trails.
The ship is angular and industrial, with running lights along its hull. The planet
below is covered in glaciers with visible crevasses and aurora borealis shimmering
at the poles. Camera is positioned off the ship's starboard bow, slowly tracking
backward as the ship moves forward. Deep space blacks contrast with the planet's
pale blue-white surface. Interstellar scale, cinematic VFX quality.

NEGATIVE PROMPT:
Static, blurred, worst quality, low quality, JPEG artifacts, text, watermark,
cartoon, anime, toy-like, small scale, flat lighting, Earth-like green landscapes,
deformed geometry, wobbly surfaces

PARAMETERS:
  guidance_scale: 6.0
  num_frames: 121
  resolution: 1280x720
  shift: 7
  steps: 30
```

### Pattern 12: Athletic / Sports Motion

```
PROMPT:
A professional skateboarder performs a kickflip at a concrete skatepark during
golden hour. The board rotates cleanly beneath his feet as he rises at the peak
of the ollie. His arms balance outward. The camera captures the trick in a low-angle
tracking shot, moving laterally. Dust particles catch the warm sidelight. Long
shadows stretch across the concrete. Visible shoe grip and board graphic detail.
Sports documentary style, slightly desaturated color grade with warm highlights.

NEGATIVE PROMPT:
Static, blurred, worst quality, low quality, JPEG artifacts, text, watermark,
deformed body, extra limbs, missing legs, frozen mid-air, indoor, night, flat
lighting, crowds cheering

PARAMETERS:
  guidance_scale: 5.0
  num_frames: 81
  resolution: 1280x720
  shift: 7
  steps: 30
```

### Pattern 13: Weather / Atmospheric

```
PROMPT:
A solitary lighthouse stands against an approaching thunderstorm. Dark cumulonimbus
clouds roll in from the left, with visible lightning bolts forking across the sky.
Heavy rain begins falling in sheets. The ocean churns with white-capped waves
crashing against the rocky base. The lighthouse beam sweeps through the rain.
Camera holds a wide establishing shot from across the bay, slowly pushing in.
Dramatic chiaroscuro lighting from the lightning. Desaturated palette with
occasional warm flashes.

NEGATIVE PROMPT:
Static, blurred, worst quality, low quality, JPEG artifacts, text, watermark,
sunny, clear sky, calm water, bright tones, overexposed, people, boats,
cheerful colors

PARAMETERS:
  guidance_scale: 5.5
  num_frames: 121
  resolution: 1280x720
  shift: 7
  steps: 30
```

### Pattern 14: Interior / Architecture

```
PROMPT:
Camera slowly dollies forward through a grand abandoned library. Towering
bookshelves line both sides, reaching to an ornate coffered ceiling. Dust motes
float in shafts of light entering through tall arched windows. Leather-bound
books in various states of decay. A reading table with an open book in the center
of frame serves as the focal point. The camera moves at walking pace, steady and
smooth. Volumetric light, warm amber tones from sunlight contrasting with cool
blue shadows. Wes Anderson symmetry.

NEGATIVE PROMPT:
Static, blurred, worst quality, low quality, JPEG artifacts, text, watermark,
people, modern furniture, fluorescent lighting, messy clutter, broken windows,
horror atmosphere, dark, underexposed

PARAMETERS:
  guidance_scale: 5.0
  num_frames: 121
  resolution: 1280x720
  shift: 7
  steps: 30
```

### Pattern 15: Miniature / Tilt-Shift

```
PROMPT:
Tilt-shift photography effect of a busy harbor port from elevated perspective.
Container ships and cranes appear miniaturized. Tiny workers and vehicles move
along the docks. The selective focus band runs horizontally across the middle of
frame, with top and bottom areas in heavy bokeh blur. Exaggerated color saturation
gives a toy-like quality. Slow, steady panning movement from left to right.
Bright midday lighting with crisp shadows. The scene appears as an elaborate
model railroad set.

NEGATIVE PROMPT:
Static, worst quality, low quality, JPEG artifacts, text, watermark, normal
perspective, realistic depth of field, night, dark, indoor, close-up, portraits,
faces, deformed

PARAMETERS:
  guidance_scale: 6.0
  num_frames: 81
  resolution: 1280x720
  shift: 6
  steps: 30
```

### Pattern 16: Text-in-Video (Wan Specialty)

```
PROMPT:
A neon sign reading "OPEN 24/7" flickers to life on a rain-soaked city street
at night. The red and blue neon tubes illuminate in sequence, letter by letter.
Raindrops on the glass storefront below reflect and scatter the neon glow. A wet
sidewalk mirrors the sign. The camera holds a static medium shot. Moody noir
atmosphere with deep blacks and vivid neon accents. Slight lens rain droplets
in the foreground.

NEGATIVE PROMPT:
Overexposed, blurred text, illegible text, worst quality, low quality, JPEG
artifacts, daytime, dry, sunny, deformed letters, misspelled text, extra text,
watermark

PARAMETERS:
  guidance_scale: 7.0
  num_frames: 81
  resolution: 1280x720
  shift: 7
  steps: 30
```

---

## 4. Prompt Optimization System

### 4.1 Parameter Sweep Methodology

The only reliable way to optimize Wan output is systematic single-variable sweeps. Never change multiple parameters simultaneously.

**Phase 1: Guidance scale sweep** (most impactful parameter)
```
Fixed: seed=42, shift=7, steps=30, num_frames=81, resolution=832x480
Vary: guidance_scale = [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0]
Output: 7 videos, ranked by visual quality
Result: Select best guidance_scale
```

**Phase 2: Shift sweep** (second most impactful)
```
Fixed: seed=42, guidance_scale=<from Phase 1>, steps=30, num_frames=81
Vary: shift = [3, 5, 7, 8, 9, 10, 12]
Output: 7 videos, ranked
Result: Select best shift
```

**Phase 3: Seed exploration** (find good compositions)
```
Fixed: guidance_scale=<Phase 1>, shift=<Phase 2>, steps=30, num_frames=81
Vary: seed = [random 10 seeds]
Output: 10 videos, ranked
Result: Select best 2-3 seeds
```

**Phase 4: Prompt refinement** (iterate on language)
```
Fixed: seed=<from Phase 3>, guidance_scale, shift, steps, num_frames
Vary: prompt text (add/remove/modify descriptors)
Output: Compare variants
```

**Phase 5: Resolution upgrade**
```
Take best configuration from Phases 1-4 at 480P
Regenerate at 720P with same parameters
Compare -- sometimes guidance_scale needs +0.5 at higher resolution
```

### 4.2 Prompt vs. Guidance Scale Interaction Analysis

Create a 2D grid to understand how prompt specificity interacts with guidance:

```
                 | GS=3.0    | GS=5.0    | GS=7.0    |
-----------------|-----------|-----------|-----------|
Vague prompt     | Dreamy,   | Generic   | Overcooked|
(10 words)       | random    | cinematic | generic   |
-----------------|-----------|-----------|-----------|
Moderate prompt  | Organic,  | SWEET     | Detailed  |
(50 words)       | natural   | SPOT      | but stiff |
-----------------|-----------|-----------|-----------|
Detailed prompt  | Ignores   | Very good,| Artifacts,|
(120 words)      | details   | faithful  | oversharp |
```

The optimal operating point is a moderately detailed prompt (50-80 words) at guidance scale 4.5-5.5. More detailed prompts allow slightly higher guidance. Vague prompts require lower guidance to avoid amplifying the model's generic defaults.

### 4.3 Seed-Based Iteration

Seeds in Wan control the initial noise pattern, which determines composition, subject placement, and color distribution. Prompt changes refine content within that compositional framework.

**Workflow:**
1. Generate 10-20 videos with random seeds, fixed prompt and parameters.
2. Identify seeds that produce good composition (subject placement, camera angle, color balance).
3. Lock the best seed.
4. Iterate on prompt wording -- add detail, change descriptors, adjust emphasis.
5. Each prompt change alters content while the seed maintains structural consistency.

**Seed stability:** Small prompt changes with the same seed produce related outputs. Large prompt changes break seed stability. If you change more than 30% of your prompt, expect the seed's compositional structure to shift.

### 4.4 Quality Assessment Criteria

Evaluate Wan outputs on these axes (in order of importance):

1. **Temporal coherence:** Do objects maintain consistent shape, color, and position across frames? Any morphing, warping, or flickering?
2. **Motion quality:** Is motion smooth and physically plausible? Any jitter, teleportation, or unnatural acceleration?
3. **Prompt fidelity:** Does the output match the described scene, subject, action, and camera movement?
4. **Anatomical correctness:** For human/animal subjects -- correct limb count, natural proportions, consistent face identity?
5. **Aesthetic quality:** Lighting, color grading, composition, overall visual appeal?
6. **Detail preservation:** Are textures sharp? Any blurring, smearing, or detail loss in motion areas?
7. **Artifact absence:** No floating objects, phantom geometry, texture swimming, or edge bleeding?

### 4.5 The "Negative Prompt Subtraction" Technique

A systematic method to optimize your negative prompt for a specific generation task:

```
Step 1: Full negative prompt → Generate video A (baseline)
Step 2: Remove exposure tokens → Generate video B
  - If B is better: exposure tokens were fighting your prompt
  - If B is worse: keep exposure tokens
Step 3: Remove motion tokens → Generate video C
Step 4: Remove quality tokens → Generate video D
Step 5: Remove anatomy tokens → Generate video E
Step 6: Remove composition tokens → Generate video F
Step 7: Remove media artifact tokens → Generate video G
Step 8: Remove detail tokens → Generate video H

Final: Reconstruct negative prompt using only the categories
       that improved quality when PRESENT (i.e., made output
       worse when removed).
```

Keep the same seed throughout. This takes 8 generations but gives you a task-optimized negative prompt.

---

## 5. Wan-Specific Parameters

### 5.1 Model Selection: 1.3B vs. 14B (and 2.2's 5B)

| Aspect | 1.3B | 5B (Wan 2.2) | 14B |
|--------|------|-------------|-----|
| Prompt interpretation | Simplified, misses nuance | Good balance | Full semantic understanding |
| Multi-subject scenes | Struggles | Adequate | Handles well |
| Camera movement | Basic pans/zooms | Smooth, varied | Complex choreography |
| Text rendering | Poor | Moderate | Best (Wan specialty) |
| Anatomy | Frequent artifacts | Occasional issues | Generally correct |
| Style adherence | Approximate | Good | Precise |
| Prompt length sweet spot | 30-60 words | 50-100 words | 80-150 words |
| VRAM requirement | 6-12GB | ~16GB | 16-28GB+ |

**Prompting for 1.3B specifically:**
- Keep prompts SHORT (30-60 words max). The 1.3B model cannot resolve complex semantic relationships.
- Focus on ONE subject, ONE action, ONE camera movement.
- Use `sample_guide_scale=6` and `sample_shift=8-12` (different defaults from 14B).
- The 1.3B benefits MORE from prompt extension because its reduced capacity needs the extra semantic signal.
- Negative prompts should be shorter too -- 1.3B has less capacity to process long negative conditioning.

### 5.2 Resolution and Prompt Detail Requirements

| Resolution | Pixel Area | Prompt Detail | Notes |
|-----------|-----------|---------------|-------|
| 480P (832x480) | 400K | Moderate detail sufficient | Forgiving, good for iteration |
| 720P (1280x720) | 922K | High detail needed | Underprompted → visible quality gaps |
| Custom (e.g., 1024x576) | Variable | Match to aspect ratio | Must be divisible by `vae_scale_factor * patch_size` |

At 720P, the model has 2.3x more pixels to fill. Vague prompts at 720P produce noticeably softer, more generic output than at 480P because the model distributes its semantic understanding across more spatial area.

**Resolution-prompt co-optimization:**
- If a prompt works well at 480P but looks soft at 720P: add more texture/material descriptors ("brushed aluminum surface," "visible fabric weave," "individual hair strands").
- If a prompt produces artifacts at 720P but not 480P: reduce guidance_scale by 0.5-1.0. Higher resolution amplifies over-guidance artifacts.

### 5.3 Sample Shift and Sample Guide Scale

These are flow-matching-specific parameters that control the denoising schedule.

**sample_shift (shift):**
- Controls timestep distribution during denoising.
- Lower shift → more compute spent on early (structural) denoising steps.
- Higher shift → more compute spent on late (detail) denoising steps.
- 14B default: 5.0 (Diffusers) or 8.0 (CLI for 1.3B).
- Practical range: 3-12.

**sample_guide_scale (guidance_scale):**
- Standard CFG strength.
- 14B default: 5.0.
- 1.3B recommended: 6.0.
- I2V recommended: 5.0.

**The shift-guidance interaction:**

High shift + high guidance = maximum detail fidelity but highest artifact risk. Use for technical/product shots.

Low shift + low guidance = maximum organic quality but lowest prompt adherence. Use for artistic/abstract work.

The recommended starting point for most work: shift=7, guidance=5.0. Adjust guidance first, then shift.

### 5.4 Offloading and Quality Impact

Offloading moves model weights between GPU and CPU to fit larger models in less VRAM. This does NOT change the mathematical output -- the same computation occurs, just slower.

| Offload Setting | Impact on Quality | Impact on Speed |
|----------------|------------------|----------------|
| No offloading | None | Fastest |
| `--offload_model True` | None | 2-3x slower |
| `--t5_cpu` | None (T5 runs in float32 on CPU) | Slight slowdown |
| GGUF quantization | Quality reduction (model-dependent) | Faster per-step but more steps may be needed |
| fp8 quantization | Slight quality reduction | Faster |

**Critical distinction:** Offloading (moving full-precision weights to CPU) has ZERO quality impact. Quantization (reducing weight precision) has measurable quality impact.

### 5.5 FP16 vs. BF16 and Prompt-Quality Relationship

| Precision | Quality | GPU Support | Prompt Sensitivity |
|-----------|---------|------------|-------------------|
| fp32 | Reference | All | Baseline |
| **fp16** | Best practical | All modern | Full prompt fidelity |
| **bf16** | Very close to fp16 | Ampere+ (30xx+) | Full prompt fidelity, better training stability |
| fp8 (scaled) | Slight degradation | Ada (40xx) | May miss subtle prompt details |
| fp8 (e4m3fn) | Noticeable degradation | Ada (40xx) | Reduced sensitivity to nuanced descriptors |
| GGUF Q5 | Variable | Any CUDA | Acceptable for simple prompts |
| GGUF Q4 | Noticeable loss | Any CUDA | Only for iteration/drafts |

**Impact on prompting:**
- At fp8 and below, subtle stylistic descriptors ("Kodak Portra 400 color science," "Rembrandt lighting") become less effective. The quantized model cannot resolve fine-grained aesthetic differences.
- If using fp8, simplify your style descriptions and increase guidance_scale by 0.5-1.0 to compensate.
- At GGUF Q4, focus prompts on broad strokes: subject, action, basic lighting. Detailed texture and style tokens are largely wasted.

**Encoder precision matters separately:**
- The T5 text encoder should always run at the highest precision your system allows (fp32 for CPU, fp16 minimum for GPU).
- Using fp8 for T5 (e.g., `umt5_xxl_fp8_e4m3fn_scaled.safetensors`) reduces prompt understanding quality. This is the encoder that interprets your words -- quantizing it is quantizing your prompt.
- If you must quantize, quantize the DiT (denoising model) first, keep T5 at fp16/fp32.

---

## 6. Anti-Patterns

### 6.1 Prompts That Work on Sora/Veo but Fail on Wan

Commercial APIs internally rewrite prompts. Wan does not. These patterns fail:

**Narrative/story prompts:**
```
BAD: "Tell the story of a lonely robot who finds a flower in a post-apocalyptic
     wasteland and learns to care for it."
WHY: Wan's T5 encoder does not understand narrative arc. It will try to render
     ALL described elements simultaneously in every frame.
FIX: "A small rusty robot kneels beside a single red flower growing from cracked
     concrete. It extends one jointed arm to gently touch a petal. Wasteland
     ruins in the background, overcast sky. Camera slowly dollies in."
```

**Temporal sequence prompts:**
```
BAD: "First the sun rises, then birds fly across the sky, then a person walks
     into frame and sits down on a bench."
WHY: "First/then" temporal logic is not encoded in cross-attention. All elements
     may appear simultaneously.
FIX: Focus on ONE moment. Use num_frames to control duration. For sequences,
     generate separate clips and edit.
```

**Emotional/abstract instructions:**
```
BAD: "Create a feeling of overwhelming nostalgia and bittersweet longing."
WHY: These are instructions to an assistant, not conditioning signals for a
     diffusion model.
FIX: "An elderly woman sits alone at a kitchen table, looking at old photographs.
     Warm afternoon light, muted colors, slight dust in the air. Slow,
     contemplative. Camera holds a wide shot."
```

**Comparison/reference prompts:**
```
BAD: "Like that famous scene from Blade Runner where he gives the tears in rain
     speech."
WHY: T5 was not trained on film scene databases. It parses this as random tokens.
FIX: Describe the visual elements explicitly: "A man stands on a rooftop in
     heavy rain at night, neon city lights behind him, water streaming down
     his face. Close-up, dramatic low-angle. Cyberpunk noir lighting."
```

### 6.2 Over-Relying on Prompt Extension

Prompt extension is a crutch for underspecified prompts, not a replacement for prompt engineering.

**When it causes problems:**
- Extension adds "cinematic camera movement" when you wanted a static shot.
- Extension adds characters or objects to fill out what it perceives as an "empty" scene.
- Extension changes the mood ("warm, inviting" added to a scene you wanted cold and stark).
- Extension rewrites your specific lens description into generic "shallow depth of field."

**The extension trap:** Users who always use extension never learn what the model actually needs, producing a dependency on an intermediary LLM that introduces its own biases and inconsistencies.

### 6.3 Negative Prompt Conflicts

Negative prompts can cancel each other or fight the positive prompt:

```
CONFLICT 1: Contradictory negatives
  Negative: "dark, bright"
  Problem: The model cannot simultaneously avoid dark AND bright. It produces
           flat, mid-tone output with no contrast.
  Fix: Choose one. "overexposed, blown highlights" OR "underexposed, crushed blacks"

CONFLICT 2: Negative fights positive
  Positive: "A painting of a sunset landscape"
  Negative: "paintings, images, style, works"
  Problem: You asked for a painting but told the model to avoid paintings.
  Fix: Remove "paintings" from negative when generating artistic content.

CONFLICT 3: Over-broad negatives
  Negative: "people, faces, hands, figures, bodies, humans, crowds"
  Problem: In scenes where people ARE desired, this aggressive negative creates
           ghostly half-formed figures or empty scenes.
  Fix: Only negate humans when you truly want zero human presence.

CONFLICT 4: Motion paradox
  Positive: "A serene still life of flowers in a vase"
  Negative: "static, still picture, no motion"
  Problem: You want minimal motion but the negative demands motion.
  Fix: For low-motion scenes, remove "static" from negative and reduce num_frames.
```

### 6.4 Guidance Scale Extremes

**Too low (0-1.5):**
- The model essentially ignores your prompt.
- Output follows the training distribution mode (generic "cinematic" video).
- Useful ONLY for exploring what the model "wants" to generate from pure noise.

**Too high (8.0+):**
- Skin becomes plastic/waxy with unnatural sheen.
- Colors oversaturate, especially reds and blues.
- High-frequency detail artifacts (hatching, moire patterns).
- Motion becomes stiff and mechanical.
- The "AI look" becomes unmistakable.
- At 12.0+, output may degrade into noise or repeated patterns.

**The guidance scale plateau:** Between 5.0 and 7.0, quality differences are subtle. Spending time sweeping 5.0/5.5/6.0/6.5/7.0 is usually not worth it unless you are producing final output. For iteration, pick 5.0 and move on.

### 6.5 Token Limit Issues with T5

**Silent truncation:** T5 has a 512-token limit. Wan does not warn you when your prompt exceeds it. The excess tokens are simply dropped.

**How to detect truncation:**
- If the last 20-30% of your prompt's described elements never appear in the output, you may be hitting the token limit.
- Use a T5 tokenizer to count: `from transformers import T5Tokenizer; tokenizer = T5Tokenizer.from_pretrained("google/umt5-xxl"); len(tokenizer.encode("your prompt"))`.

**Workarounds:**
- Prioritize the most important elements at the START of the prompt.
- Use concise adjective-noun pairs instead of verbose descriptions.
- Remove redundant quality tokens ("high quality, best quality, masterpiece, ultra-detailed" can be reduced to "4K, sharp detail").
- Move less critical atmospheric details to the end (if truncated, atmospheric details are the least damaging to lose).

**Token budget allocation:**
```
Subject description:     30-40% of tokens (most important)
Action/motion:           20-25% of tokens
Camera/composition:      15-20% of tokens
Lighting/atmosphere:     10-15% of tokens
Style/quality keywords:  5-10% of tokens (least important, placed last)
```

### 6.6 Common Wan-Specific Failures

**"Walking backwards" artifact:** Wan occasionally generates reversed motion (people walking backward, water flowing upward). This is a known training data issue. The standard negative prompt includes "walking backwards" for this reason. For any motion-critical scene, explicitly state the direction: "walking forward," "water flowing downstream."

**Identity drift in long videos:** At 121+ frames, human faces may gradually change features. Mitigation: use I2V mode with a reference frame to anchor identity, or generate shorter clips (81 frames) and stitch.

**The "cinematic default" trap:** When prompts are underspecified, Wan defaults to a generic warm-toned, shallow-DoF, slow-motion "cinematic" look. This is its training distribution mode. If you want something specific (harsh lighting, deep focus, desaturated colors), you must explicitly request it AND negate the cinematic default in your negative prompt.

---

## Appendix: Quick Reference

### Prompt Template

```
[Subject: who/what, physical details, clothing/texture]
[Action: specific verb, motion direction, speed]
[Camera: shot type, movement, angle]
[Environment: setting, time of day, weather]
[Lighting: direction, quality, color temperature]
[Style: artistic reference, color grading, film stock]
```

### Default Parameters

```
Model: Wan2.1-T2V-14B (or Wan2.2-T2V-A14B for MoE)
Resolution: 1280x720 (production) or 832x480 (iteration)
Guidance Scale: 5.0
Shift: 7 (14B) or 8-12 (1.3B)
Steps: 30
Frames: 81 (5s @ 16fps)
FPS: 16 (generation) / 24 (Wan 2.2)
Precision: bf16 (transformer), fp32 (VAE, image encoder)
Negative: Full comprehensive baseline
```

### Parameter Priority for Tuning

```
1. guidance_scale (biggest impact)
2. prompt text (second biggest)
3. seed (composition control)
4. num_frames (motion budget)
5. shift (subtle refinement)
6. steps (diminishing returns past 25)
7. resolution (last -- iterate at 480P, finalize at 720P)
```


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
