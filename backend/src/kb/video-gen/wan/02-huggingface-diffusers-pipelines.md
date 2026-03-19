# Wan Pipelines in HuggingFace Diffusers
**Source:** https://huggingface.co/docs/diffusers/api/pipelines/wan
**Author:** HuggingFace / Wan Team
**Date:** 2025 (Diffusers v0.37.0+)

## Key Takeaways
- Full Diffusers integration for all Wan 2.1 and 2.2 models
- T2V-14B requires ~13GB VRAM with group offloading optimizations
- Supports LoRA loading, single-file model loading, and torch.compile acceleration
- VAE should always use torch.float32 for best decoding quality
- Frame count formula: `4 * k + 1` (e.g., 81 frames = 5 seconds at 16fps)
- VACE pipeline supports depth, pose, sketch, flow, inpainting, outpainting, and more

## Content

### Supported Models in Diffusers

| Model | HuggingFace ID |
|-------|---------------|
| Wan 2.1 T2V 1.3B | `Wan-AI/Wan2.1-T2V-1.3B-Diffusers` |
| Wan 2.1 T2V 14B | `Wan-AI/Wan2.1-T2V-14B-Diffusers` |
| Wan 2.1 I2V 14B 480P | `Wan-AI/Wan2.1-I2V-14B-480P-Diffusers` |
| Wan 2.1 I2V 14B 720P | `Wan-AI/Wan2.1-I2V-14B-720P-Diffusers` |
| Wan 2.1 FLF2V 14B 720P | `Wan-AI/Wan2.1-FLF2V-14B-720P-diffusers` |
| Wan 2.1 VACE 1.3B | `Wan-AI/Wan2.1-VACE-1.3B-diffusers` |
| Wan 2.1 VACE 14B | `Wan-AI/Wan2.1-VACE-14B-diffusers` |
| Wan 2.2 T2V A14B | `Wan-AI/Wan2.2-T2V-A14B-Diffusers` |
| Wan 2.2 I2V A14B | `Wan-AI/Wan2.2-I2V-A14B-Diffusers` |
| Wan 2.2 TI2V 5B | `Wan-AI/Wan2.2-TI2V-5B-Diffusers` |
| Wan 2.2 Animate 14B | `Wan-AI/Wan2.2-Animate-14B-Diffusers` |

### Text-to-Video with Memory Optimization (~13GB VRAM)

```python
import torch
from diffusers import AutoModel, WanPipeline
from diffusers.hooks.group_offloading import apply_group_offloading
from diffusers.utils import export_to_video
from transformers import UMT5EncoderModel

text_encoder = UMT5EncoderModel.from_pretrained(
    "Wan-AI/Wan2.1-T2V-14B-Diffusers", subfolder="text_encoder", torch_dtype=torch.bfloat16
)
vae = AutoModel.from_pretrained(
    "Wan-AI/Wan2.1-T2V-14B-Diffusers", subfolder="vae", torch_dtype=torch.float32
)
transformer = AutoModel.from_pretrained(
    "Wan-AI/Wan2.1-T2V-14B-Diffusers", subfolder="transformer", torch_dtype=torch.bfloat16
)

# Group offloading for memory efficiency
onload_device = torch.device("cuda")
offload_device = torch.device("cpu")
apply_group_offloading(text_encoder,
    onload_device=onload_device,
    offload_device=offload_device,
    offload_type="block_level",
    num_blocks_per_group=4
)
transformer.enable_group_offload(
    onload_device=onload_device,
    offload_device=offload_device,
    offload_type="leaf_level",
    use_stream=True
)

pipeline = WanPipeline.from_pretrained(
    "Wan-AI/Wan2.1-T2V-14B-Diffusers",
    vae=vae, transformer=transformer, text_encoder=text_encoder,
    torch_dtype=torch.bfloat16
)
pipeline.to("cuda")

prompt = "A white ferret on a log leaps into water and emerges, with birch trees and blue sky."
negative_prompt = "Bright tones, overexposed, static, blurred details, worst quality, low quality"

output = pipeline(
    prompt=prompt, negative_prompt=negative_prompt,
    num_frames=81, guidance_scale=5.0,
).frames[0]
export_to_video(output, "output.mp4", fps=16)
```

### Speed Optimization with torch.compile

```python
pipeline.transformer.to(memory_format=torch.channels_last)
pipeline.transformer = torch.compile(
    pipeline.transformer, mode="max-autotune", fullgraph=True
)
```
Note: First run is slow for compilation; subsequent calls are faster.

### First-Last-Frame-to-Video (FLF2V)

```python
from diffusers import AutoencoderKLWan, WanImageToVideoPipeline
from transformers import CLIPVisionModel

model_id = "Wan-AI/Wan2.1-FLF2V-14B-720P-diffusers"
image_encoder = CLIPVisionModel.from_pretrained(model_id, subfolder="image_encoder", torch_dtype=torch.float32)
vae = AutoencoderKLWan.from_pretrained(model_id, subfolder="vae", torch_dtype=torch.float32)
pipe = WanImageToVideoPipeline.from_pretrained(model_id, vae=vae, image_encoder=image_encoder, torch_dtype=torch.bfloat16)
pipe.to("cuda")

output = pipe(image=first_frame, last_image=last_frame, prompt=prompt, height=height, width=width, guidance_scale=5.5).frames[0]
```

### LoRA Support

```python
from diffusers.schedulers.scheduling_unipc_multistep import UniPCMultistepScheduler

pipeline = WanPipeline.from_pretrained("Wan-AI/Wan2.1-T2V-1.3B-Diffusers", vae=vae, torch_dtype=torch.bfloat16)
pipeline.scheduler = UniPCMultistepScheduler.from_config(pipeline.scheduler.config, flow_shift=5.0)
pipeline.to("cuda")

pipeline.load_lora_weights("benjamin-paine/steamboat-willie-1.3b", adapter_name="steamboat-willie")
pipeline.set_adapters("steamboat-willie")
pipeline.enable_model_cpu_offload()

# Use trigger word in prompt
prompt = "steamboat willie style, golden era animation, a ferret on a log..."
```

### Loading from Single Files (ComfyUI Checkpoints)

```python
from diffusers import WanPipeline, WanTransformer3DModel, AutoencoderKLWan

vae = AutoencoderKLWan.from_single_file("path/to/wan_2.1_vae.safetensors")
transformer = WanTransformer3DModel.from_single_file("path/to/wan2.1_t2v_1.3B_bf16.safetensors", torch_dtype=torch.bfloat16)
pipeline = WanPipeline.from_pretrained("Wan-AI/Wan2.1-T2V-1.3B-Diffusers", vae=vae, transformer=transformer, torch_dtype=torch.bfloat16)
```

### VACE Controllable Generation Capabilities
- Control-to-Video: Depth, Pose, Sketch, Flow, Grayscale, Scribble, Layout, Boundary Box
- Image/Video-to-Video: First frame, last frame, starting/ending clip, random clips
- Inpainting and Outpainting
- Subject-to-Video: Faces, objects, characters
- Composition-to-Video: Reference anything, animate anything, swap anything

**VACE masking rule**: Black mask = preserve/condition on, White mask = generate new content.

### Wan-Animate (Wan 2.2)
Character animation and replacement pipeline supporting:
- **Animation Mode**: Animate character using pose + face reference videos
- **Replacement Mode**: Replace character in scene with new character, preserving lighting/color

### Important Notes
- Always set VAE to `torch.float32` for best quality
- Frame count: use formula `4 * k + 1`
- `guidance_scale`: 5.0-7.0 recommended for T2V; 1.0 default for Animate
- FPS: 16 for T2V, 30 for Animate


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
