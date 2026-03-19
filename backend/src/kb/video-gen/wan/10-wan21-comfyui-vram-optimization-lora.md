# Wan 2.1 ComfyUI Setup, VRAM Optimization, and LoRA Training
**Source:** https://comfyui-wiki.com/en/tutorial/advanced/video/wan2.1/wan2-1-video-model
**Additional Sources:** https://stable-diffusion-art.com/wan-2-1/, https://blogs.novita.ai/choosing-the-right-gpu-for-your-wan-2-1/, https://civitai.com/articles/14070, https://www.stablediffusiontutorials.com/2025/03/wan-lora-train.html
**Author:** Various (ComfyUI Wiki, Stable Diffusion Art, Novita, Civitai, SD Tutorials)
**Date:** 2025

## Key Takeaways
- ComfyUI natively supports Wan 2.1 (update to latest version for best support)
- Model files go in specific ComfyUI directories (diffusion_models, text_encoders, vae)
- Quality rank: fp16 > bf16 > fp8_scaled > fp8_e4m3fn (lower precision = lower VRAM but reduced quality)
- GGUF quantized models available for extreme low-VRAM setups
- LoRA training possible on 24GB VRAM for T2V, but I2V LoRA requires 48GB+
- Wan2GP provides an alternative path for GPU-poor users (6-12GB)

## Content

### ComfyUI Model File Structure

```
ComfyUI/
  models/
    diffusion_models/
      wan2.1_t2v_14B_fp16.safetensors     # or bf16/fp8 variant
      wan2.1_i2v_480p_14B_fp16.safetensors
    text_encoders/
      umt5_xxl_fp8_e4m3fn_scaled.safetensors
    vae/
      wan_2.1_vae.safetensors
```

### Model Precision Guide

| Precision | VRAM | Quality | GPU Requirement |
|-----------|------|---------|----------------|
| fp16 | Highest | Best | Any modern GPU |
| bf16 | High | Very Good | Ampere+ (RTX 30xx+) |
| fp8_scaled | Medium | Good | Ada Lovelace (RTX 40xx) |
| fp8_e4m3fn | Lowest | Acceptable | Ada Lovelace (RTX 40xx) |
| GGUF Q4/Q5 | Very Low | Variable | Any CUDA GPU |

### ComfyUI Workflow Setup

1. Update ComfyUI to latest version
2. Navigate to Workflows > Workflow Templates to find built-in Wan 2.1 templates
3. Download model files to appropriate directories
4. Drag workflow JSON files into ComfyUI to load
5. If red nodes appear: Click Manager > Install missing custom nodes
6. Click Run (or Ctrl+Enter) to generate

### VRAM Optimization Strategies

**For RTX 4090 (24GB):**
- Use T2V-1.3B model for quick iterations
- fp8 quantization for 14B model (reduced quality)
- GGUF format for extreme VRAM savings
- Enable model offloading in ComfyUI settings

**For RTX 3060/3070 (8-12GB):**
- Use Wan2GP instead of raw ComfyUI
- GGUF Q4 quantization
- Profile 4 (heavy CPU offloading)
- Stick to 480P resolution

**For RTX 2060/2070 (6-8GB):**
- Wan2GP with Profile 4 only
- 1.3B model exclusively
- 480P at reduced frame count
- Expect 10-15 minute generation times

### VRAM Usage Reference

| Setup | VRAM Usage | Gen Time (5s 480P) |
|-------|-----------|-------------------|
| 14B fp16, no offload | 28+ GB | ~3 min |
| 14B fp8, with offload | ~16 GB | ~8 min |
| 1.3B bf16, no offload | ~12 GB | ~3 min |
| 1.3B bf16, with offload | ~8 GB | ~4 min |
| 1.3B GGUF Q5, offload | ~6 GB | ~10 min |

### LoRA Training for Wan 2.1

**Requirements:**
- T2V LoRA: Minimum 24GB VRAM (image/video dataset)
- I2V LoRA: Minimum 48GB VRAM (video-only dataset)

**Training Steps:**

1. **Prepare Dataset:**
   - Collect 20-50 video clips or images of your target style/subject
   - Chop videos into individual frames
   - Caption each with an LLM (1 sentence descriptions)

2. **Training with diffusion-pipe (6 steps):**
   ```bash
   # Install diffusion-pipe
   pip install diffusion-pipe

   # Prepare config YAML with dataset path, model path, learning rate
   # Train LoRA
   python train.py --config your_config.yaml
   ```

3. **Training Parameters (from Civitai community guide):**
   - Learning rate: 1e-4 to 5e-5
   - Steps: 500-2000 depending on dataset size
   - Rank: 16-64 (higher = more capacity, more VRAM)
   - Batch size: 1 (limited by VRAM)

4. **Using LoRA in ComfyUI:**
   - Place .safetensors LoRA file in `ComfyUI/models/loras/`
   - Add LoRA loader node to workflow
   - Set strength (0.5-1.0 typical)
   - Use trigger word in prompt

### Using LoRA in Diffusers

```python
from diffusers import WanPipeline
from diffusers.schedulers.scheduling_unipc_multistep import UniPCMultistepScheduler

pipeline = WanPipeline.from_pretrained("Wan-AI/Wan2.1-T2V-1.3B-Diffusers", torch_dtype=torch.bfloat16)
pipeline.scheduler = UniPCMultistepScheduler.from_config(pipeline.scheduler.config, flow_shift=5.0)
pipeline.to("cuda")

# Load and activate LoRA
pipeline.load_lora_weights("your-lora-model", adapter_name="my-style")
pipeline.set_adapters("my-style")
pipeline.enable_model_cpu_offload()

# Use trigger word in prompt
prompt = "my-style-trigger, a cat dancing on a rooftop at sunset"
```

### VACE Video Editing in ComfyUI

For VACE (Video Creation and Editing):
- Use WanVideo VACE Encode node to prepare inputs
- Black mask = preserve original content (conditioning)
- White mask = generate new content
- Supports: inpainting, outpainting, style transfer, object removal
- Fine-tuning VACE with LoRA possible but requires 48GB+ VRAM

### Kijai's ComfyUI-WanVideoWrapper

Community custom node providing additional features:
- GitHub: https://github.com/kijai/ComfyUI-WanVideoWrapper
- Enhanced memory management
- Additional scheduling options
- Better integration with other ComfyUI workflows
- GGUF model loading support


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
