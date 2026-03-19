# Wan 2.1 Official Reference — Context7 Library Reference
**Source:** Context7 `/wan-video/wan2.1` (43 code snippets, High reputation)
**Library:** Wan 2.1 (Wan-AI)
**Date Retrieved:** 2026-03-18

## Key Takeaways
- Open-source suite: Text-to-Video, Image-to-Video, Video Editing, Text-to-Image, Video-to-Audio
- SOTA performance with consumer-grade GPU compatibility (RTX 4090 with offloading)
- Available via CLI (generate.py) or HuggingFace Diffusers Python pipelines
- Models: 1.3B (fast drafts) and 14B (high quality) at 480P and 720P
- Supports prompt extension for enhanced descriptions

## CLI Commands

### Text-to-Video (14B, 720P)
```sh
python generate.py --task t2v-14B --size 1280*720 --ckpt_dir ./Wan2.1-T2V-14B --prompt "Two anthropomorphic cats in comfy boxing gear and bright gloves fight intensely on a spotlighted stage."
```

### Image-to-Video (14B, 720P)
```sh
python generate.py --task i2v-14B --size 1280*720 --ckpt_dir ./Wan2.1-I2V-14B-720P --image examples/i2v_input.JPG --prompt "Summer beach vacation style, a white cat wearing sunglasses sits on a surfboard."
```

### Text-to-Image (with Prompt Extension)
```sh
python generate.py --task t2i-14B --size 1024*1024 --ckpt_dir ./Wan2.1-T2V-14B --prompt "A beautiful serene portrait" --use_prompt_extend
```

### OOM Mitigation (1.3B, 480P — for limited VRAM GPUs)
```sh
python generate.py --task t2v-1.3B --size 832*480 --ckpt_dir ./Wan2.1-T2V-1.3B --offload_model True --t5_cpu --sample_shift 8 --sample_guide_scale 6 --prompt "Your prompt here"
```

## HuggingFace Diffusers Pipeline

### Image-to-Video (Python)
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

## Model Variants
| Model | Size | Resolution | Use Case |
|-------|------|-----------|----------|
| Wan2.1-T2V-1.3B | 1.3B | 832x480 | Fast drafts, consumer GPUs (6GB+) |
| Wan2.1-T2V-14B | 14B | 1280x720 | High quality text-to-video |
| Wan2.1-I2V-14B-480P | 14B | 832x480 | Image-to-video, lower VRAM |
| Wan2.1-I2V-14B-720P | 14B | 1280x720 | Image-to-video, best quality |

## Standard Negative Prompt
```
Bright tones, overexposed, static, blurred details, subtitles, style, works, paintings, images, static, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers, still picture, messy background, three legs, many people in the background, walking backwards
```

## Key Parameters
- `num_frames`: 81 (default for ~5 second video at 16fps)
- `guidance_scale`: 5.0-7.5 recommended
- `fps`: 16 (export)
- `torch_dtype`: bfloat16 for transformer, float32 for VAE and image encoder


---
## Media

> **Tags:** `wan` · `wan-2.1` · `alibaba` · `ai-video` · `open-source` · `vace` · `self-hosted` · `14b`

### Official Resources
- [Official Documentation](https://github.com/Wan-Video/Wan2.1)
- [Gallery / Showcase](https://wan-video.github.io)
- [Wan 2.1 GitHub Repository](https://github.com/Wan-Video/Wan2.1)
- [Wan Video Project Page](https://wan-video.github.io)
- [Wan on Hugging Face](https://huggingface.co/Wan-AI)

### Video Tutorials
- [Wan 2.1 Video Generation - Self-Hosted Tutorial](https://www.youtube.com/results?search_query=wan+2.1+video+generation+self+hosted+tutorial) — *Credit: AI Self-Hosted on YouTube* `tutorial`
- [Wan VACE - Video Editing with AI](https://www.youtube.com/results?search_query=wan+vace+video+editing+ai+tutorial) — *Credit: AI Video on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
