# Wan 2.2: Mixture-of-Experts Upgrade for Video Generation
**Source:** https://github.com/Wan-Video/Wan2.2
**Author:** Wan Team (Alibaba)
**Date:** 2025

## Key Takeaways
- Wan 2.2 introduces Mixture-of-Experts (MoE) architecture into video diffusion models
- Trained on 65.6% more images and 83.2% more videos than Wan 2.1
- New 5B model runs at 720P/24fps on consumer GPUs like RTX 4090
- Advanced VAE with 16x16x4 compression ratios for efficient HD generation
- Aesthetic enhancement with labeled data for lighting, composition, contrast, and color tone
- New capabilities: Speech-to-Video (S2V) and Character Animation (Animate)

## Content

### What Changed from Wan 2.1 to 2.2

| Feature | Wan 2.1 | Wan 2.2 |
|---------|---------|---------|
| Architecture | Standard DiT | MoE DiT |
| Training Data | Baseline | +65.6% images, +83.2% videos |
| Consumer Model | 1.3B (480P) | 5B (720P @ 24fps) |
| VAE Compression | Standard | 16x16x4 |
| Aesthetic Control | Basic | Labeled (lighting, composition, contrast, color) |
| Speech-to-Video | No | Yes (S2V-14B) |
| Character Animation | No | Yes (Animate-14B) |

### Model Variants

| Model | Task | Resolution | Notes |
|-------|------|-----------|-------|
| T2V-A14B | Text-to-Video | 480P, 720P | MoE architecture, "A" prefix |
| I2V-A14B | Image-to-Video | 480P, 720P | MoE with image conditioning |
| TI2V-5B | Text/Image-to-Video | 720P | Consumer-grade, dual-mode |
| S2V-14B | Speech-to-Video | 480P, 720P | Lip-sync from speech |
| Animate-14B | Character Animation | Variable | Pose + face driven |

### Installation

```bash
git clone https://github.com/Wan-Video/Wan2.2.git
cd Wan2.2
pip install -r requirements.txt
```

### Usage

```bash
# Text-to-Video with MoE model
python generate.py --task t2v-A14B --size 1280*720 \
  --ckpt_dir ./Wan2.2-T2V-A14B --offload_model True

# Multi-GPU with sequence parallelism
torchrun --nproc_per_node=8 generate.py --task t2v-A14B \
  --dit_fsdp --t5_fsdp --ulysses_size 8
```

### Consumer-Grade 5B Model (TI2V-5B)

The new 5B model is the sweet spot for consumer hardware:
- Supports both text-to-video AND image-to-video in one model
- 720P resolution at 24fps
- Runs on RTX 4090 with optimizations
- Better quality than Wan 2.1's 1.3B while still being consumer-accessible

### MoE Architecture Benefits

The Mixture-of-Experts approach uses specialized expert models for different denoising timesteps:
- Different experts handle early (structure) vs. late (detail) denoising steps
- Computational efficiency: only a subset of parameters active per step
- Better generalization across motion, semantic, and aesthetic dimensions
- Maintains model quality while reducing per-step computation

### Aesthetic Data Enhancement

Wan 2.2 training data includes explicit labels for:
- **Lighting**: Direction, intensity, color temperature
- **Composition**: Rule of thirds, leading lines, framing
- **Contrast**: Dynamic range, shadow depth
- **Color Tone**: Warm/cool palette, saturation levels

This enables more cinematic and visually controlled outputs compared to Wan 2.1.

### Integration
- Diffusers: Full pipeline support
- ComfyUI: Native workflow support
- DiffSynth-Studio: Community integration
- Acceleration frameworks and distillation models available


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
