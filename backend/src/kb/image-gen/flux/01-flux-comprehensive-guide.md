---
title: "FLUX Comprehensive Guide"
platform: "flux"
category: "image-gen"
tags: ["flux", "black-forest-labs", "ai-image", "text-to-image", "flow-matching", "transformer", "image-generation"]
updated: "2026-03-19"
---

# FLUX Comprehensive Guide

## Black Forest Labs: Origins

Black Forest Labs (BFL) was founded in 2024 by the core team behind Stable Diffusion, including Robin Rombach and Andreas Blattmann. Based in Freiburg, Germany, the company set out to build a next-generation image synthesis platform that could surpass the diffusion-based architectures they had previously pioneered. BFL raised over $100 million in funding and launched its first model family, FLUX.1, in August 2024. By late 2025, the company had released FLUX.2 and established itself as the leading open-weight image generation platform.

## The FLUX Model Family

### FLUX.1 Series (August 2024)

The original FLUX.1 lineup introduced three tiers designed for different use cases:

- **FLUX.1 [schnell]** — The speed-optimized variant. Generates images in 1-4 steps with sub-second inference on modern GPUs. Released under Apache 2.0 license, making it fully open and free for commercial use. Ideal for real-time applications, rapid prototyping, and high-volume batch generation where speed matters more than peak fidelity.

- **FLUX.1 [dev]** — The balanced middle tier. A 12B parameter model released under a non-commercial open-weight license. Produces higher quality output than Schnell with reasonable generation times (typically 10-20 seconds on consumer hardware). The go-to choice for developers building applications, researchers experimenting with fine-tuning, and hobbyists running local generation.

- **FLUX.1 [pro]** — The flagship quality model. Available exclusively through the BFL API, this variant delivers the highest fidelity output with superior prompt adherence, photorealism, and detail rendering. Designed for professional and commercial production workflows.

### FLUX 1.1 Pro and Ultra (Late 2024)

BFL followed up with iterative improvements:

- **FLUX 1.1 [pro]** — An optimized successor to FLUX.1 Pro with faster inference and improved output quality. Available at $0.04 per image through the BFL API.

- **FLUX 1.1 [pro] Ultra** — The high-resolution variant, generating images at up to 4 megapixel resolution with support for varying aspect ratios. Priced at $0.06 per image. Particularly strong for large-format prints, detailed product photography, and any use case requiring ultra-sharp output.

### FLUX.2 Series (November 2025)

The second generation represented a major architectural leap:

- **FLUX.2 [dev]** — A 32B parameter model that unifies text-to-image generation, image editing, and multi-reference composition in a single checkpoint. Supports JSON-structured prompting for precise control. Open-weight with a non-commercial license.

- **FLUX.2 [pro]** — Production-grade variant delivering photorealistic outputs at up to 4MP resolution. Excels at complex typography, product photography, and multi-reference conditioning (up to 10 reference images for consistency).

- **FLUX.2 [flex]** — A developer-focused variant optimized for precise text rendering, typography, and layout work. Ideal for memes, posters, product mockups, and UI designs.

- **FLUX.2 [klein]** — Released January 2026. A compact 4B parameter model family designed for real-time inference on consumer hardware (8GB VRAM). Achieves sub-second generation without sacrificing core quality. Available under Apache 2.0 license.

- **FLUX.2 [max]** — The most capable variant for professional-grade generation and editing workflows.

## Architecture: Flow Matching Transformers

FLUX broke from the diffusion model paradigm that dominated prior generation (including Stable Diffusion). Instead, it uses a **flow matching** architecture built on transformers.

### How Flow Matching Works

Unlike diffusion models that iteratively predict and remove noise from a random starting point, flow matching directly predicts the direction and magnitude of change needed to move samples toward the target distribution. This provides more stable training dynamics, faster convergence, and the ability to trade quality for speed by adjusting the number of inference steps.

### Transformer Architecture

FLUX.2's 32B parameter transformer uses a dual-stream design:

- **DoubleStreamBlocks** (8 layers) — Maintain separate processing streams for image and text tokens while enabling cross-modal attention at each layer. These handle the initial alignment between what the prompt describes and what the image should contain.

- **SingleStreamBlocks** (48 layers) — Refine the joint image-text representation through deep self-attention and feedforward transformations. The significantly greater depth here (48 vs 8) reflects the complexity of spatial refinement.

The model couples a Mistral-3 24B vision language model with the rectified flow transformer. The VLM provides semantic grounding and world knowledge, while the transformer backbone learns spatial structure, materials, and composition.

### Latent Space

FLUX processes images in a 16-channel latent space, quadrupling the 4 channels used in Stable Diffusion. This expanded latent representation captures more nuanced information about textures, lighting, spatial arrangements, and fine detail.

## Key Innovations

1. **Multi-Reference Conditioning** — FLUX.2 can accept up to 10 reference images, maintaining character and object consistency across generations. This solves the character drift problem that plagued earlier models.

2. **Unified Checkpoint** — FLUX.2 handles text-to-image, image editing, and multi-reference composition from a single model checkpoint, eliminating the need for separate specialized models.

3. **JSON Structured Prompting** — FLUX.2 supports JSON-formatted prompts for programmatic control over scene composition, enabling more reliable and reproducible outputs in production pipelines.

4. **Text Rendering** — FLUX achieves approximately 60% first-attempt accuracy on complex typography, a massive leap over prior generations. Text in images is legible enough for production use with minimal correction.

5. **Open-Weight Ecosystem** — Unlike competitors (Midjourney, DALL-E), FLUX offers genuinely open models (Schnell and Klein under Apache 2.0, Dev under open non-commercial license), enabling local deployment, fine-tuning, and community tooling.

## Resolution Options

| Model | Max Resolution | Aspect Ratios |
|-------|---------------|---------------|
| FLUX.1 Schnell/Dev | 1024x1024 (1MP) | Square, landscape, portrait |
| FLUX.1 Pro | 1024x1024 (1MP) | Multiple aspect ratios |
| FLUX 1.1 Pro Ultra | 2048x2048 (4MP) | Flexible aspect ratios |
| FLUX.2 Pro/Flex | 2048x2048 (4MP) | Flexible aspect ratios |
| FLUX.2 Klein | 1024x1024 (1MP) | Standard ratios |

## Speed Benchmarks

| Model | Typical Generation Time | Steps |
|-------|------------------------|-------|
| FLUX.2 Klein | <1 second | 1-4 |
| FLUX.1 Schnell | 1-3 seconds | 1-4 |
| FLUX.1 Dev | 10-20 seconds | 20-50 |
| FLUX.1 Pro (API) | 5-10 seconds | Optimized |
| FLUX.2 Pro (API) | 5-15 seconds | Optimized |
| FLUX 1.1 Pro Ultra (API) | 10-20 seconds | Optimized |

Times are approximate and vary by resolution, hardware, and API load. Local generation times assume an NVIDIA RTX 4090 or equivalent.

## Ecosystem and Tooling

FLUX models are supported across the major AI image generation platforms:

- **ComfyUI** — Full node-based workflow support for all FLUX variants
- **Automatic1111 / Forge** — Community extensions for FLUX inference
- **Replicate** — Hosted API for all FLUX models
- **fal.ai** — Hosted API with competitive pricing
- **Together AI** — Hosted inference for FLUX Dev and Schnell
- **DeepInfra** — Budget-friendly API hosting

The open-weight models have spawned a growing ecosystem of LoRA fine-tunes, ControlNet adapters, and community tools, though this ecosystem remains smaller than Stable Diffusion's mature tooling landscape.


---
## Media

> **Tags:** `flux` · `black-forest-labs` · `ai-image` · `open-source` · `schnell` · `dev` · `pro` · `comfyui`

### Platform
![flux logo](https://blackforestlabs.ai/wp-content/uploads/2024/07/BFL_Logo.png)
*Source: Official flux branding — [flux](https://docs.bfl.ml)*

### Official Resources
- [Official Documentation](https://docs.bfl.ml)
- [Gallery / Showcase](https://blackforestlabs.ai)
- [Black Forest Labs - Flux Models](https://blackforestlabs.ai)
- [Flux API Documentation](https://docs.bfl.ml)
- [Flux on Hugging Face](https://huggingface.co/black-forest-labs)

### Video Tutorials
- [Flux AI Image Generation - Complete Tutorial](https://www.youtube.com/results?search_query=flux+ai+image+generation+tutorial+2025) — *Credit: AI Art on YouTube* `tutorial`
- [Installing Flux in ComfyUI - Step by Step](https://www.youtube.com/results?search_query=flux+comfyui+installation+tutorial) — *Credit: ComfyUI on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
