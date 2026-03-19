# Wan 2.1 I2V-14B: Image-to-Video Generation Guide
**Source:** https://huggingface.co/Wan-AI/Wan2.1-I2V-14B-720P
**Author:** Wan-AI Team
**Date:** February 2025

## Key Takeaways
- I2V (Image-to-Video) takes a static image and animates it based on a text prompt
- Available in 480P and 720P variants, both using the 14B parameter model
- Supports prompt extension using Qwen2.5-VL (vision-language model) for image-aware prompt enhancement
- Outperforms comparable competitors in manual evaluation across 14 major dimensions
- Requires significantly more VRAM than T2V due to image conditioning (24+ GB recommended)
- Multi-GPU support via FSDP + xDiT for faster inference

## Content

### Download

```bash
# 720P variant
huggingface-cli download Wan-AI/Wan2.1-I2V-14B-720P --local-dir ./Wan2.1-I2V-14B-720P

# 480P variant
huggingface-cli download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./Wan2.1-I2V-14B-480P
```

### Basic Image-to-Video Generation

```bash
python generate.py \
  --task i2v-14B \
  --size 1280*720 \
  --ckpt_dir ./Wan2.1-I2V-14B-720P \
  --image examples/i2v_input.JPG \
  --prompt "Summer beach vacation style, a white cat wearing sunglasses sits on a surfboard..."
```

### With Memory Optimization

```bash
python generate.py \
  --task i2v-14B \
  --size 1280*720 \
  --ckpt_dir ./Wan2.1-I2V-14B-720P \
  --image your_image.jpg \
  --offload_model True \
  --prompt "Your detailed scene description"
```

### Multi-GPU Inference

```bash
pip install "xfuser>=0.4.1"
torchrun --nproc_per_node=8 generate.py \
  --task i2v-14B \
  --size 1280*720 \
  --ckpt_dir ./Wan2.1-I2V-14B-720P \
  --image your_image.jpg \
  --dit_fsdp --t5_fsdp --ulysses_size 8 \
  --prompt "Your prompt here"
```

### I2V with Vision-Language Prompt Extension

The I2V pipeline can use a vision-language model (Qwen2.5-VL) to analyze the input image and generate a richer prompt:

```bash
# Local VL model
python generate.py \
  --task i2v-14B \
  --size 1280*720 \
  --ckpt_dir ./Wan2.1-I2V-14B-720P \
  --image your_image.jpg \
  --use_prompt_extend \
  --prompt_extend_model Qwen/Qwen2.5-VL-7B-Instruct \
  --prompt "A cat on a surfboard"

# DashScope API
DASH_API_KEY=your_key python generate.py \
  --task i2v-14B \
  --size 1280*720 \
  --ckpt_dir ./Wan2.1-I2V-14B-720P \
  --image your_image.jpg \
  --use_prompt_extend \
  --prompt_extend_method 'dashscope' \
  --prompt "A cat on a surfboard"
```

### Gradio Web Interface for I2V

```bash
cd gradio

# 720P only
DASH_API_KEY=your_key python i2v_14B_singleGPU.py \
  --prompt_extend_method 'dashscope' \
  --ckpt_dir_720p ./Wan2.1-I2V-14B-720P

# Both 480P and 720P
DASH_API_KEY=your_key python i2v_14B_singleGPU.py \
  --prompt_extend_method 'dashscope' \
  --ckpt_dir_480p ./Wan2.1-I2V-14B-480P \
  --ckpt_dir_720p ./Wan2.1-I2V-14B-720P
```

### Using Diffusers for I2V

```python
import torch
from diffusers import AutoencoderKLWan, WanImageToVideoPipeline
from diffusers.utils import export_to_video, load_image
from transformers import CLIPVisionModel

model_id = "Wan-AI/Wan2.1-I2V-14B-720P-Diffusers"
image_encoder = CLIPVisionModel.from_pretrained(model_id, subfolder="image_encoder", torch_dtype=torch.float32)
vae = AutoencoderKLWan.from_pretrained(model_id, subfolder="vae", torch_dtype=torch.float32)
pipe = WanImageToVideoPipeline.from_pretrained(model_id, vae=vae, image_encoder=image_encoder, torch_dtype=torch.bfloat16)
pipe.to("cuda")

image = load_image("path/to/your/image.jpg")
prompt = "The cat stretches and yawns lazily in warm afternoon sunlight"

output = pipe(image=image, prompt=prompt, height=720, width=1280, guidance_scale=5.5).frames[0]
export_to_video(output, "i2v_output.mp4", fps=16)
```

### I2V Prompting Tips
- Describe the **motion** you want, not just the scene (the image already provides the scene)
- Include camera movement descriptions: "camera slowly pans left", "zoom in on face"
- Specify the mood and lighting changes: "lighting shifts from warm to cool"
- Keep prompts focused on what should **change** from the static image
- Use prompt extension for best results -- the VL model understands the image context

### Performance Notes
- I2V requires more VRAM than T2V due to CLIP image encoder + image conditioning
- RTX 4090 (24GB) can run with offloading, but expect longer generation times
- For production use, recommend 2x or more GPUs with FSDP
- 720P produces significantly higher quality but takes longer than 480P


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
