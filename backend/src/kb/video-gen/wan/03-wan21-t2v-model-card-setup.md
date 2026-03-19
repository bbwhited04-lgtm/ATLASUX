# Wan 2.1 T2V-1.3B: Complete Model Card and Setup Guide
**Source:** https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B-Diffusers
**Author:** Wan-AI Team
**Date:** February 2025

## Key Takeaways
- The 1.3B model is the most accessible entry point: only 8.19 GB VRAM required
- Generates 5-second 480P videos in ~4 minutes on an RTX 4090
- Supports both HuggingFace CLI and ModelScope downloads
- Recommended resolution for 1.3B: 832x480 (480P); 720P is possible but less stable
- Includes prompt extension via Qwen models or DashScope API
- Licensed under Apache 2.0

## Content

### Download Methods

```bash
# HuggingFace CLI
pip install "huggingface_hub[cli]"
huggingface-cli download Wan-AI/Wan2.1-T2V-1.3B-Diffusers --local-dir ./Wan2.1-T2V-1.3B-Diffusers

# ModelScope CLI
pip install modelscope
modelscope download Wan-AI/Wan2.1-T2V-1.3B-Diffusers --local_dir ./Wan2.1-T2V-1.3B-Diffusers
```

### All Available Models

| Model | Best For | VRAM |
|-------|---------|------|
| T2V-1.3B | Quick prototyping, consumer GPU | 8.19 GB |
| T2V-14B | High-quality production | 24+ GB |
| I2V-14B-720P | Image-to-video HD | 24+ GB |
| I2V-14B-480P | Image-to-video standard | 24+ GB |

### Basic Usage with Diffusers

```python
import torch
from diffusers import AutoencoderKLWan, WanPipeline
from diffusers.utils import export_to_video

model_id = "Wan-AI/Wan2.1-T2V-1.3B-Diffusers"
vae = AutoencoderKLWan.from_pretrained(model_id, subfolder="vae", torch_dtype=torch.float32)
pipe = WanPipeline.from_pretrained(model_id, vae=vae, torch_dtype=torch.bfloat16)
pipe.to("cuda")

prompt = "A cat walks on the grass, realistic"
negative_prompt = "Bright tones, overexposed, static, blurred details, subtitles, style, works, paintings, images, static, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers, still picture, messy background, three legs, many people in the background, walking backwards"

output = pipe(
    prompt=prompt,
    negative_prompt=negative_prompt,
    height=480,
    width=832,
    num_frames=81,
    guidance_scale=5.0
).frames[0]

export_to_video(output, "output.mp4", fps=15)
```

### CLI Generation

```bash
# Basic generation
python generate.py --task t2v-1.3B --size 832*480 \
  --ckpt_dir ./Wan2.1-T2V-1.3B \
  --sample_shift 8 --sample_guide_scale 6 \
  --prompt "Two cats boxing on a spotlighted stage"

# With memory optimization (for 8GB GPUs)
python generate.py --task t2v-1.3B --size 832*480 \
  --ckpt_dir ./Wan2.1-T2V-1.3B \
  --offload_model True --t5_cpu \
  --sample_shift 8 --sample_guide_scale 6 \
  --prompt "Your prompt here"

# Multi-GPU (8x)
pip install "xfuser>=0.4.1"
torchrun --nproc_per_node=8 generate.py --task t2v-1.3B \
  --size 832*480 --ckpt_dir ./Wan2.1-T2V-1.3B \
  --dit_fsdp --t5_fsdp --ulysses_size 8
```

### Recommended Generation Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| `sample_shift` | 8 | For 1.3B model |
| `sample_guide_scale` | 6 | CLI; use 5.0 for Diffusers `guidance_scale` |
| `height` | 480 | Recommended for 1.3B |
| `width` | 832 | Standard 480P width |
| `num_frames` | 81 | ~5 seconds at 16fps |
| `offload_model` | True | For low-VRAM GPUs |
| `t5_cpu` | True | Run text encoder on CPU to save VRAM |

### 1.3B Model Architecture

| Parameter | Value |
|-----------|-------|
| Model Dimension | 1536 |
| Input/Output Dimension | 16 |
| Feedforward Dimension | 8960 |
| Frequency Dimension | 256 |
| Attention Heads | 12 |
| Transformer Layers | 30 |

### Prompt Extension

Enhance short prompts into detailed scene descriptions:

```bash
# Using DashScope API
DASH_API_KEY=your_key python generate.py --task t2v-1.3B \
  --use_prompt_extend --prompt_extend_method 'dashscope' \
  --prompt "cats boxing"

# Using local Qwen model
python generate.py --task t2v-1.3B \
  --use_prompt_extend --prompt_extend_method 'local_qwen' \
  --prompt_extend_model 'Qwen/Qwen2.5-7B-Instruct' \
  --prompt "cats boxing"
```

### Gradio Web Interface

```bash
cd gradio
python t2v_1.3B_singleGPU.py \
  --prompt_extend_method 'local_qwen' \
  --ckpt_dir ./Wan2.1-T2V-1.3B
```


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
