# Wan2GP: AI Video Generator for the GPU Poor
**Source:** https://github.com/deepbeepmeep/Wan2GP
**Author:** deepbeepmeep (community)
**Date:** 2025 (actively updated, v10.9875+)

## Key Takeaways
- Wan2GP is a community-built tool that makes Wan 2.1/2.2 accessible on low-VRAM GPUs (as low as 6GB)
- Supports Wan 2.1, Wan 2.2, Hunyuan Video, LTX Video, Flux, and other models in one app
- Web-based UI with batch queue system, headless CLI mode, mask editor, and LoRA support
- Multiple quantization formats: int8, fp8, GGUF, NV FP4
- Works on older NVIDIA GPUs (RTX 10xx, 20xx) and AMD GPUs (RDNA)
- Reduces VRAM use by ~2x without precision loss via smart offloading
- Includes audio generation, TTS, and music creation tools

## Content

### Installation

```bash
git clone https://github.com/deepbeepmeep/Wan2GP.git
cd Wan2GP
conda create -n wangp python=3.11.14
conda activate wangp
pip install torch==2.10.0 torchvision torchaudio
pip install -r requirements.txt
python wgp.py
```

### VRAM Requirements by Model

| Model | Resolution | Duration | VRAM |
|-------|-----------|----------|------|
| LTX-2 | 720p HD | 10 sec | 8 GB |
| LTX-2 | 1080p | 10 sec | 12 GB |
| LTX-2 | 1080p | 20 sec | 16 GB |
| Wan 2.1 T2V-1.3B | 480p | 5 sec | ~6-8 GB |
| Wan 2.1 T2V-14B | 480p | 5 sec | ~12-16 GB (with optimizations) |

### Memory Profiles

| Profile | Description |
|---------|-------------|
| Profile 1 | Balanced VRAM/RAM usage |
| Profile 3 | VRAM-optimized (more CPU offloading) |
| Profile 4 | Extreme low-VRAM (heavy RAM usage) |

### Key Features

**Video Generation:**
- Text-to-Video and Image-to-Video with all Wan model variants
- Temporal and spatial generation capabilities
- Motion designer for camera/subject movement control
- Video upscaler for post-processing

**Advanced Tools:**
- Mask editor for inpainting/outpainting
- Prompt enhancer (Qwen3.5 VL with uncensored processing)
- Pose, depth, and optical flow extraction
- LoRA support with custom folder configuration
- Video browser for reviewing generations

**Audio Integration:**
- Index TTS 2 with emotion support
- Heart Mula for multi-minute song generation
- Ace Step 1.5 Turbo for music creation

### Headless/CLI Mode

```bash
# Process a saved queue file without launching UI
python wgp.py --process my_queue.zip
```

Create generation jobs in the web UI, save as queue file, then process via CLI for batch/automated workflows.

### Performance Optimizations (v10.9875+)
- GGUF CUDA kernels: 15% speed improvement
- vLLM acceleration: up to 10x faster for language models
- CUDA Graph optimization for TTS models
- INT8 kernel optimizations: 10% speed gains

### Configuration Options
- Attention modes: Flash, Sage, standard
- Quantization: int8, fp8, GGUF, NV FP4
- Per-model memory profile defaults
- Custom LoRA root folders
- VAE customization via finetune definitions

### Why Use Wan2GP
- **Low barrier to entry**: Run 14B models on 12GB GPUs
- **All-in-one**: Multiple video models + audio in one interface
- **Batch processing**: Queue system for overnight/unattended generation
- **Active community**: Discord support, frequent updates
- **AMD support**: RDNA GPU compatibility


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
