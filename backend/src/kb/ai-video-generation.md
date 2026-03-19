# AI Video Generation Knowledge Base
## For Venny (Image/Video Production) & Victor (Video Production)

Last updated: 2026-03-18

---

## 1. OpenAI Sora 2 / Sora 2 Pro

**API Base:** `https://api.openai.com/v1`
**Auth:** `Authorization: Bearer $OPENAI_API_KEY`
**Models:** `sora-2`, `sora-2-pro`

### Capabilities
- Text-to-video with synced audio
- Image-to-video (image as first frame)
- Video remix (remix_id from previous generation)
- Portrait and landscape formats
- Up to 1280x720 resolution

### Create Video
```
POST /v1/videos
{
  "model": "sora-2-pro",
  "prompt": "Wide shot of a child flying a red kite in a grassy park, golden hour sunlight, camera slowly pans upward.",
  "size": "1280x720",
  "seconds": "8"
}
```

Response:
```json
{
  "id": "video_68d7512d...",
  "object": "video",
  "status": "queued",
  "model": "sora-2-pro",
  "progress": 0,
  "seconds": "8",
  "size": "1280x720"
}
```

### Image-to-Video (multipart)
```bash
curl -X POST "https://api.openai.com/v1/videos" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F prompt="She turns around and smiles, then slowly walks out of the frame." \
  -F model="sora-2-pro" \
  -F size="1280x720" \
  -F seconds="8" \
  -F input_reference="@sample_720p.jpeg;type=image/jpeg"
```

### Python SDK
```python
from openai import OpenAI
client = OpenAI()
video = client.videos.create(
    model="sora-2-pro",
    prompt="A futuristic cityscape at sunset with flying cars.",
)
```

### Poll Status
```
GET /v1/videos/{video_id}
```
Status values: `queued` → `in_progress` → `completed` | `failed`

### Download MP4
```
GET /v1/videos/{video_id}/content
```
Returns binary MP4 file.

### List Videos
```
GET /v1/videos?limit=25&offset=0
```

### Delete Video
```
DELETE /v1/videos/{video_id}
```

### Prompting Tips (Sora)
- Include shot type, subject, action, setting, lighting
- Be specific about camera movement: "slow dolly-in", "tracking shot", "static wide"
- Specify duration context — 5s for quick cuts, 8s for cinematic
- Sora 2 Pro produces higher quality but slower render

---

## 2. Google Veo 3

**API:** Gemini API (`generativelanguage.googleapis.com`)
**Auth:** `GEMINI_API_KEY`
**Model:** `veo-3.0-generate-001`

### Capabilities
- Text-to-video with synchronized audio
- Image-to-video (starting frame)
- Negative prompts
- Native dialogue generation (characters can speak)
- Aspect ratios: 16:9, 9:16, 1:1
- Optimal duration: 8 seconds

### Generate Video
```bash
curl -X POST /api/veo/generate \
  -F "prompt=A drone flying over a tropical beach with crystal clear water" \
  -F "model=veo-3.0-generate-001" \
  -F "aspectRatio=16:9"
```

### Image-to-Video
```bash
curl -X POST /api/veo/generate \
  -F "prompt=Animate this scene with gentle wind blowing through the trees" \
  -F "model=veo-3.0-generate-001" \
  -F "imageFile=@/path/to/starting-frame.png" \
  -F "aspectRatio=16:9" \
  -F "negativePrompt=blurry, low quality"
```

### Async Workflow
1. POST `/api/veo/generate` → returns `{ "name": "operations/generate-video-abc123" }`
2. Poll `POST /api/veo/operation` with operation name until `done: true`
3. Extract `response.generatedVideos[0].video.uri`
4. Download: `POST /api/veo/download` with `{ "uri": "..." }` → binary MP4

### TypeScript Workflow
```typescript
async function generateVideo(prompt: string, imageFile?: File) {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("model", "veo-3.0-generate-001");
  form.append("aspectRatio", "16:9");
  if (imageFile) form.append("imageFile", imageFile);

  const startResp = await fetch("/api/veo/generate", { method: "POST", body: form });
  const { name: operationName } = await startResp.json();

  let videoUri: string | null = null;
  while (!videoUri) {
    await new Promise(r => setTimeout(r, 5000));
    const poll = await fetch("/api/veo/operation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: operationName }),
    });
    const op = await poll.json();
    if (op.done) videoUri = op.response?.generatedVideos?.[0]?.video?.uri;
  }

  const dl = await fetch("/api/veo/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uri: videoUri }),
  });
  return await dl.blob();
}
```

### Veo 3 Prompt Structure (7 Components)
```
Subject: [15+ physical attributes, clothing, age, build, facial features, emotional state]
Action: [Specific actions, movements, gestures, timing, micro-expressions]
Scene: [Location, props, lighting, weather, time of day, architecture]
Style: [Camera shot, angle, movement, lighting style, color palette, depth of field]
Dialogue: (Character Name): "Exact dialogue here" (Tone: emotional descriptor)
Sounds: [Ambient sounds, effects, background audio, music]
Technical (Negative): [Avoid: subtitles, watermarks, text overlays, artifacts]
```

### Example: Corporate Video
```
Sarah Chen, a 35-year-old Asian-American CEO in a navy blazer, stands confidently
in a modern glass conference room presenting to 8 board members. She gestures
toward charts while explaining growth strategies. Professional three-point lighting.

Camera: Smooth dolly-in from wide to medium shot.
Audio: Clear, authoritative voice: "Our Q3 results exceeded expectations,
positioning us for unprecedented growth" with subtle office ambiance.
Style: Corporate documentary, polished and professional.
Negative prompt: no distracting elements, no poor lighting, no unprofessional appearance.
```

### Example: Product Shot
```
A [product] sits on a rotating pedestal inside a dark studio. High-key rim lighting
highlights its contours while a spotlight from above reveals brand details.
Camera: slow 360° dolly-around, 24 fps, 16:9, 1080p.
Audio: cinematic bass hit followed by subtle ambient synth.
Voice-over: "Meet the new [product name]. Designed for those who demand excellence."
```

### Prompt Validation Checklist
- Clear visual description
- Specific camera movements
- Audio specifications included
- Dialogue format (colon syntax)
- Lighting setup defined
- Duration optimization (8 seconds)
- Negative prompts included

---

## 3. Kling AI (Turbo / 3.0 / 3.0 Omni)

**API:** `https://app.klingai.com/global/dev/`
**Models:** Kling Video 3.0, Kling Video 3.0 Omni, Kling Turbo

### Capabilities
- Text-to-video and image-to-video
- Native audio-visual synchronization (3.0 Omni)
- Subject consistency (cameo, subject with voice control)
- Scene transitions: up to 6 shots per video
- Duration: up to 15 seconds
- Multi-speaker, multi-language (EN, CN, JP, KR, ES + dialects)
- Ultra-high-definition storyboard images (2K/4K)
- Custom seconds control
- Reference-based consistency (characters, products)

### Kling 3.0 vs 3.0 Omni
| Feature | Kling 3.0 | Kling 3.0 Omni |
|---------|-----------|----------------|
| Audio-visual sync | No | Native |
| Subject upload in I2V | Yes | Yes |
| Multi-character reference | 3-person | Enhanced |
| Scene transitions | Up to 6 shots | Up to 6 shots |
| Duration | Up to 15s | Up to 15s |
| Storyboarding | Custom | Enhanced narrative |
| Image output | Standard | 2K/4K native |

### Key Features
- **Turbo mode:** Faster generation, lower quality — good for drafts/previews
- **Subject consistency:** Upload a reference image, maintain character appearance across scenes
- **Cameo:** Insert specific faces/characters into generated videos
- **Scene cuts:** Script multi-shot sequences in a single generation
- **Audio control:** Separate control over speech, sound effects, and background music

### Languages Supported
Chinese, English, Japanese, Korean, Spanish + certain dialects and accents

---

## 4. Wan 2.1 / Wan 2.5 Preview

**Source:** Open-source (Wan-AI on HuggingFace)
**Models:** Wan2.1-T2V-1.3B, Wan2.1-T2V-14B, Wan2.1-I2V-14B
**License:** Open-source, consumer GPU compatible

### Capabilities
- Text-to-Video (T2V)
- Image-to-Video (I2V)
- Video Editing
- Text-to-Image
- Video-to-Audio
- Resolutions: 480P (832×480), 720P (1280×720)
- Consumer GPU compatible (RTX 4090 with offloading)

### Text-to-Video (CLI)
```bash
python generate.py \
  --task t2v-14B \
  --size 1280*720 \
  --ckpt_dir ./Wan2.1-T2V-14B \
  --prompt "Two anthropomorphic cats in comfy boxing gear fight intensely on a spotlighted stage."
```

### Image-to-Video (CLI)
```bash
python generate.py \
  --task i2v-14B \
  --size 1280*720 \
  --ckpt_dir ./Wan2.1-I2V-14B-720P \
  --image examples/input.JPG \
  --prompt "Summer beach vacation style, a white cat wearing sunglasses sits on a surfboard."
```

### Single GPU with OOM Mitigation
```bash
python generate.py \
  --task t2v-1.3B \
  --size 832*480 \
  --ckpt_dir ./Wan2.1-T2V-1.3B \
  --offload_model True \
  --t5_cpu \
  --sample_shift 8 \
  --sample_guide_scale 6 \
  --prompt "Your prompt here"
```

### HuggingFace Diffusers (Python)
```python
import torch
import numpy as np
from diffusers import AutoencoderKLWan, WanImageToVideoPipeline
from diffusers.utils import export_to_video, load_image
from transformers import CLIPVisionModel

model_id = "Wan-AI/Wan2.1-I2V-14B-720P-Diffusers"
image_encoder = CLIPVisionModel.from_pretrained(model_id, subfolder="image_encoder", torch_dtype=torch.float32)
vae = AutoencoderKLWan.from_pretrained(model_id, subfolder="vae", torch_dtype=torch.float32)
pipe = WanImageToVideoPipeline.from_pretrained(model_id, vae=vae, image_encoder=image_encoder, torch_dtype=torch.bfloat16)
pipe.to("cuda")

image = load_image("https://example.com/image.jpg")
max_area = 720 * 1280
aspect_ratio = image.height / image.width
mod_value = pipe.vae_scale_factor_spatial * pipe.transformer.config.patch_size[1]
height = round(np.sqrt(max_area * aspect_ratio)) // mod_value * mod_value
width = round(np.sqrt(max_area / aspect_ratio)) // mod_value * mod_value
image = image.resize((width, height))

output = pipe(
    image=image,
    prompt="An astronaut hatching from an egg on the moon surface.",
    negative_prompt="Bright tones, overexposed, static, blurred details, subtitles, low quality",
    height=height, width=width,
    num_frames=81,
    guidance_scale=5.0
).frames[0]
export_to_video(output, "output.mp4", fps=16)
```

### Wan Text-to-Video Pipeline (Diffusers)
```python
from diffusers import WanPipeline

pipe = WanPipeline.from_pretrained("Wan-AI/Wan2.1-T2V-14B-Diffusers", torch_dtype=torch.bfloat16)
pipe.to("cuda")

output = pipe(
    prompt="A cinematic shot of a castle on a cliff at sunset",
    negative_prompt="low quality, blurry",
    num_inference_steps=50,
    guidance_scale=7.5,
    height=720,
    width=1280,
).frames[0]
export_to_video(output, "output.mp4", fps=16)
```

### Model Comparison
| Model | Size | Resolution | Use Case |
|-------|------|-----------|----------|
| Wan2.1-T2V-1.3B | 1.3B params | 832×480 | Fast drafts, consumer GPUs |
| Wan2.1-T2V-14B | 14B params | 1280×720 | High quality T2V |
| Wan2.1-I2V-14B-480P | 14B params | 832×480 | I2V, lower VRAM |
| Wan2.1-I2V-14B-720P | 14B params | 1280×720 | I2V, best quality |

### Wan 2.5 Preview
- Next-generation model, currently in preview
- Expected improvements: better motion coherence, longer duration, higher resolution
- Check HuggingFace Wan-AI org for latest releases

---

## 5. Provider Selection Guide

### For Venny & Victor: When to Use What

| Scenario | Best Provider | Why |
|----------|--------------|-----|
| Quick social media clips | **Kling Turbo** | Fast, good enough for TikTok/Shorts |
| High-quality brand video | **Sora 2 Pro** | Best overall quality, synced audio |
| Video with dialogue/speech | **Veo 3** or **Kling 3.0 Omni** | Native audio-visual sync |
| Product showcase | **Veo 3** | Excellent prompt control, product shots |
| Image animation | **Wan 2.1 I2V** | Free, open-source, good I2V |
| Multi-scene storyboard | **Kling 3.0** | Up to 6 shots, scene transitions |
| Budget/free generation | **Wan 2.1** | Open-source, self-hosted |
| YouTube content | **Sora 2 Pro** | Highest resolution, best motion |
| Character consistency | **Kling 3.0 Omni** | Subject reference + consistency |
| Corporate/professional | **Veo 3** | Structured prompts, professional output |

### Pricing Tier (approximate)
- **Wan 2.1:** Free (self-hosted, GPU costs only)
- **Kling Turbo:** Low cost, fast
- **Sora 2:** Medium cost
- **Sora 2 Pro:** Higher cost, best quality
- **Veo 3:** Via Gemini API pricing
- **Kling 3.0 Omni:** Premium tier

### Common Negative Prompts (all providers)
```
Bright tones, overexposed, static, blurred details, subtitles, style, works,
paintings, images, static, overall gray, worst quality, low quality, JPEG
compression residue, ugly, incomplete, extra fingers, poorly drawn hands,
poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers,
still picture, messy background, watermarks, text overlays
```

---

## 6. Integration Notes for Atlas UX

### API Keys Required
- `OPENAI_API_KEY` — Sora 2 / Sora 2 Pro (already configured)
- `GEMINI_API_KEY` — Veo 3 (already configured)
- Kling AI — requires separate API key from klingai.com
- Wan 2.1 — self-hosted, no API key needed (requires GPU)

### Async Pattern (all providers)
1. Submit generation request → get job/operation ID
2. Poll for status until completed
3. Download binary MP4
4. Upload to destination (YouTube, social media, S3)

### File Naming Convention
```
{agent}_{platform}_{date}_{topic}.mp4
e.g., venny_tiktok_20260318_ai-receptionist-demo.mp4
```


---
## Media

### Platform References
- **kling**: [Docs](https://klingai.com) · [Gallery](https://klingai.com/explore)
- **wan**: [Docs](https://github.com/Wan-Video/Wan2.1) · [Gallery](https://wan-video.github.io)

### Related Videos
- [Kling AI Video Generator Tutorial - Complete Guide](https://www.youtube.com/results?search_query=kling+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `kling`
- [Kling 3.0 - Motion Brush & Advanced Features](https://www.youtube.com/results?search_query=kling+3.0+motion+brush+advanced+tutorial) — *Credit: AI Tutorials on YouTube* `kling`
- [Wan 2.1 Video Generation - Self-Hosted Tutorial](https://www.youtube.com/results?search_query=wan+2.1+video+generation+self+hosted+tutorial) — *Credit: AI Self-Hosted on YouTube* `wan`
- [Wan VACE - Video Editing with AI](https://www.youtube.com/results?search_query=wan+vace+video+editing+ai+tutorial) — *Credit: AI Video on YouTube* `wan`

> *All video content is credited to original creators. Links direct to source platforms.*
