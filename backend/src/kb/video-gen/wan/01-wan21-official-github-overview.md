# Wan 2.1: Open and Advanced Large-Scale Video Generative Models
**Source:** https://github.com/Wan-Video/Wan2.1
**Author:** Wan Team (Alibaba)
**Date:** February 2025

## Key Takeaways
- Wan 2.1 is an open-source (Apache 2.0) video generation suite with 1.3B and 14B parameter models
- Supports Text-to-Video (T2V), Image-to-Video (I2V), First-Last-Frame-to-Video (FLF2V), and VACE (Video Creation and Editing)
- 1.3B model requires only 8.19 GB VRAM, making it consumer-GPU friendly
- 14B model outperforms both open-source and commercial SOTA solutions across multiple benchmarks
- Only video model capable of generating readable Chinese and English text in videos
- Built on 3D VAE + DiT (Diffusion Transformer) architecture with Flow Matching

## Content

### Architecture
Wan 2.1 uses a Diffusion Transformer (DiT) architecture with:
- **Wan-VAE**: 3D causal variational autoencoder for efficient spatio-temporal compression, capable of encoding/decoding 1080P videos of unlimited length
- **Flow Matching**: Advanced noise scheduling for temporal consistency
- **T5 Text Encoder**: For multilingual semantic understanding with cross-attention in each transformer block

### Model Variants

| Model | Resolution | Parameters | Use Case |
|-------|-----------|-----------|----------|
| T2V-14B | 480P, 720P | 14B | High-quality text-to-video |
| T2V-1.3B | 480P | 1.3B | Lightweight, consumer GPU |
| I2V-14B-720P | 720P | 14B | Image-to-video (high-res) |
| I2V-14B-480P | 480P | 14B | Image-to-video (standard) |
| FLF2V-14B | 720P | 14B | First/last frame guided |
| VACE-1.3B | 480P | 1.3B | Video editing/creation |
| VACE-14B | 480P, 720P | 14B | Advanced editing |

### Installation

```bash
git clone https://github.com/Wan-Video/Wan2.1.git
cd Wan2.1
pip install -r requirements.txt  # Requires torch >= 2.4.0
```

### Single-GPU Text-to-Video

```bash
# 14B model at 720P
python generate.py --task t2v-14B --size 1280*720 \
  --ckpt_dir ./Wan2.1-T2V-14B \
  --prompt "Your text description here"

# 1.3B model at 480P (consumer GPU friendly)
python generate.py --task t2v-1.3B --size 832*480 \
  --ckpt_dir ./Wan2.1-T2V-1.3B \
  --offload_model True --t5_cpu \
  --sample_shift 8 --sample_guide_scale 6 \
  --prompt "Your prompt here"
```

### Multi-GPU Inference

```bash
pip install "xfuser>=0.4.1"
torchrun --nproc_per_node=8 generate.py --task t2v-14B \
  --size 1280*720 --ckpt_dir ./Wan2.1-T2V-14B \
  --dit_fsdp --t5_fsdp --ulysses_size 8
```

### Prompt Extension
Two methods for enhancing short prompts into detailed descriptions:

```bash
# Local Qwen model
python generate.py --task t2v-14B --use_prompt_extend \
  --prompt_extend_method 'local_qwen' \
  --prompt_extend_model 'Qwen/Qwen2.5-7B-Instruct' \
  --prompt "short description"

# DashScope API
DASH_API_KEY=your_key python generate.py --task t2v-14B \
  --use_prompt_extend --prompt_extend_method 'dashscope' \
  --prompt "short description"
```

### Hardware Requirements
- **RTX 4090**: 5-second 480P video in ~4 minutes with 1.3B model (8.19 GB VRAM with offloading)
- **Multi-GPU**: FSDP + xDiT with Ulysses/Ring strategies for 14B model
- Memory optimization flags: `--offload_model True`, `--t5_cpu`

### Model Architecture Specs

| Parameter | 1.3B | 14B |
|-----------|------|-----|
| Model Dimension | 1536 | 5120 |
| Feedforward Dimension | 8960 | 13824 |
| Number of Heads | 12 | 40 |
| Number of Layers | 30 | 40 |
| Input/Output Dimension | 16 | 16 |
| Frequency Dimension | 256 | 256 |


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
