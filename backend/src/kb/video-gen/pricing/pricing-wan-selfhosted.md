# Wan 2.1 Self-Hosted Pricing
**Sources:** [RunPod GPU Pricing](https://www.runpod.io/pricing), [Vast.ai GPU Pricing](https://vast.ai/pricing), [Lambda Labs GPU Pricing](https://computeprices.com/providers/lambda), [Wan 2.1 GPU Guide](https://blogs.novita.ai/choosing-the-right-gpu-for-your-wan-2-1/), [Wan 2.1 GPU Benchmarks](https://www.instasd.com/post/wan2-1-performance-testing-across-gpus), [SaladCloud Wan 2.1 Benchmarks](https://blog.salad.com/benchmarking-wan2-1/), [H100 Rental Prices Compared](https://intuitionlabs.ai/articles/h100-rental-prices-cloud-comparison)
**Date:** 2026-03-18
**Last Verified:** 2026-03-18

## Key Takeaways
- Wan 2.1 is fully open-source (Apache 2.0) -- no per-video API fees, only GPU compute cost
- RTX 4090 ($0.34-$0.69/hr): can only do 480p, takes ~4-5 minutes per 5s clip
- A100 80GB ($1.19-$1.39/hr): handles 720p, ~8-9 min per 5s clip -- best balance
- H100 ($1.49-$2.69/hr): fastest, handles 720p/1080p -- but diminishing returns vs A100 for video gen
- At scale (100+ videos/day), self-hosted Wan 2.1 is 5-20x cheaper than any API provider
- Requires 24GB+ VRAM minimum (14B model), 80GB ideal for full quality without quantization

## GPU Rental Pricing

### RunPod

| GPU | VRAM | On-Demand ($/hr) | Community ($/hr) | Secure Cloud ($/hr) |
|-----|------|-------------------|-------------------|---------------------|
| RTX 4090 | 24GB | $0.69 | $0.39 | $0.79-$1.09 |
| A100 PCIe 80GB | 80GB | $1.19 | N/A | $1.59 |
| A100 SXM 80GB | 80GB | $1.39 | N/A | $1.79 |
| H100 SXM | 80GB | $2.69 | N/A | $3.09 |

### Lambda Labs

| GPU | VRAM | On-Demand ($/hr) | Reserved ($/hr) |
|-----|------|-------------------|-----------------|
| A100 40GB | 40GB | $1.29 | ~$0.90 |
| H100 PCIe | 80GB | $2.49 | ~$1.74 |
| H100 SXM | 80GB | $3.29 | ~$2.30 |

### Vast.ai (Marketplace -- Prices Fluctuate)

| GPU | VRAM | Starting ($/hr) | Typical ($/hr) |
|-----|------|------------------|----------------|
| RTX 4090 | 24GB | $0.34 | $0.40-$0.55 |
| A100 40GB | 40GB | $0.80 | $1.00-$1.29 |
| A100 80GB | 80GB | $1.10 | $1.30-$1.50 |
| H100 SXM | 80GB | $1.49 | $1.80-$2.50 |

### AWS GPU Instances (For Comparison)

| Instance | GPU | VRAM | On-Demand ($/hr) |
|----------|-----|------|-------------------|
| g5.xlarge | A10G | 24GB | $1.01 |
| p4d.24xlarge | 8x A100 40GB | 320GB | $32.77 |
| p5.48xlarge | 8x H100 | 640GB | $98.32 |

Note: AWS is 2-5x more expensive than boutique providers but offers SLAs and compliance.

## Generation Time Benchmarks (Wan 2.1 T2V-14B)

### Single GPU Performance

| GPU | 480p (5s) | 720p (5s) | Notes |
|-----|-----------|-----------|-------|
| RTX 4090 (24GB) | ~281s (~4.7 min) | Not supported (OOM) | Requires quantization flags |
| A100 80GB | ~180s (~3 min) | ~523s (~8.7 min) | Best mid-tier option |
| H100 SXM | ~120s (~2 min) | ~350s (~5.8 min) | Fastest single-GPU |

### Multi-GPU Performance (T2V-14B)

| Config | Time for 5s clip | Speedup |
|--------|-----------------|---------|
| 1x A100 | ~3,343s | 1x |
| 4x A100 | ~912s | 3.7x |
| 8x A100 | ~470s | 7.1x |

### VRAM Requirements

| Model | Min VRAM | Recommended VRAM |
|-------|----------|-----------------|
| T2V-1.3B (small) | 8.2 GB | 12 GB |
| T2V-14B (full) | 24 GB (with quantization) | 80 GB |
| I2V-14B | 24 GB (with quantization) | 80 GB |

## Cost Per Video (Self-Hosted)

### RTX 4090 (480p Only)

| Provider | $/hr | Time per 5s clip | Cost per clip |
|----------|------|-------------------|---------------|
| Vast.ai | $0.34 | 4.7 min | $0.027 |
| RunPod Community | $0.39 | 4.7 min | $0.031 |
| RunPod On-Demand | $0.69 | 4.7 min | $0.054 |

### A100 80GB (720p)

| Provider | $/hr | Time per 5s clip (720p) | Cost per clip |
|----------|------|--------------------------|---------------|
| Vast.ai | $1.10 | 8.7 min | $0.160 |
| RunPod PCIe | $1.19 | 8.7 min | $0.173 |
| Lambda Labs | $1.29 | 8.7 min | $0.187 |

### H100 SXM (720p)

| Provider | $/hr | Time per 5s clip (720p) | Cost per clip |
|----------|------|--------------------------|---------------|
| Vast.ai | $1.49 | 5.8 min | $0.144 |
| RunPod | $2.69 | 5.8 min | $0.260 |
| Lambda Labs | $3.29 | 5.8 min | $0.318 |

## Rate Limits & Quotas
- No API rate limits -- you control throughput
- Limited by GPU availability on marketplace providers (Vast.ai, RunPod)
- Lambda Labs frequently has GPU stock issues -- check availability
- Reserved instances guarantee availability but require commitment (1-6 months)
- Multi-GPU setups scale near-linearly (7x speedup on 8 GPUs)

## Cost Optimization Tips
- Use RTX 4090 on Vast.ai ($0.027/clip) for 480p drafts -- cheapest possible option
- A100 on Vast.ai ($0.16/clip at 720p) is the sweet spot for production quality
- Use the 1.3B model (8GB VRAM) for rapid prototyping at 10x less cost
- Run on spot/interruptible instances for 30-50% savings (acceptable for batch jobs)
- Reserved instances (1-3 months) save 30-40% on Lambda Labs and RunPod
- Quantization (FP8/INT8) enables RTX 4090 to run 14B model but with quality trade-offs
- Batch generation overnight on cheaper spot instances for non-urgent content
- Consider SaladCloud for distributed inference at even lower rates

## Atlas UX Budget Impact
- **Cheapest possible (480p draft, RTX 4090 Vast.ai):** $0.027/clip -- 96% cheaper than Sora 2
- **Production quality (720p, A100 Vast.ai):** $0.16/clip -- 84% cheaper than Sora 2 Pro
- **Monthly at 50 videos (720p, A100):** $8.00 vs $75-$150 on API providers
- **Monthly at 100 videos (720p, A100):** $16.00 vs $150-$300 on API providers
- **Monthly at 500 videos (720p, A100):** $80.00 -- self-hosted becomes massively cheaper at scale
- Trade-off: requires DevOps setup, GPU management, model updates, and queue infrastructure
- Best for: high-volume production where cost per video matters more than convenience
- Not ideal for: low volume (<20 videos/mo) where API convenience wins


---
## Media

### Platform References
- **wan**: [Docs](https://github.com/Wan-Video/Wan2.1) · [Gallery](https://wan-video.github.io)

### Related Videos
- [Wan 2.1 Video Generation - Self-Hosted Tutorial](https://www.youtube.com/results?search_query=wan+2.1+video+generation+self+hosted+tutorial) — *Credit: AI Self-Hosted on YouTube* `wan`
- [Wan VACE - Video Editing with AI](https://www.youtube.com/results?search_query=wan+vace+video+editing+ai+tutorial) — *Credit: AI Video on YouTube* `wan`

> *All video content is credited to original creators. Links direct to source platforms.*
