---
title: "Self-Hosted vs API Economics — Image Generation Cost Analysis (2026)"
category: "image-gen"
tags: ["comparison", "pricing", "ai-image", "self-hosted", "gpu", "runpod", "vast-ai", "lambda", "rtx-5090", "stable-diffusion", "flux"]
updated: "2026-03-19"
---

# Self-Hosted vs API Economics — Image Generation Cost Analysis (2026)

Compare the true cost of running Stable Diffusion and FLUX on your own GPU (cloud or local) versus using hosted APIs. Includes break-even analysis at different volumes and RTX 5090 local inference economics.

---

## Cloud GPU Rental Pricing (March 2026)

### RunPod

| GPU | VRAM | On-Demand $/hr | Spot/Community $/hr | Images/hr (SDXL) | Images/hr (FLUX.2 Dev) |
|-----|------|----------------|--------------------|--------------------|------------------------|
| RTX 4090 | 24 GB | $0.34 | ~$0.25 | ~120 | ~40 |
| RTX 5090 | 32 GB | $0.69 | ~$0.50 | ~180 | ~70 |
| A100 (40GB) | 40 GB | $1.14 | ~$0.85 | ~150 | ~55 |
| A100 (80GB) | 80 GB | $1.64 | ~$1.20 | ~160 | ~60 |
| H100 | 80 GB | $2.49 | ~$1.80 | ~250 | ~100 |

### Vast.ai (Marketplace — Prices Fluctuate)

| GPU | Typical $/hr (On-Demand) | Typical $/hr (Interruptible) |
|-----|--------------------------|------------------------------|
| RTX 4090 | $0.25-0.40 | $0.15-0.25 |
| RTX 5090 | $0.40-0.70 | $0.25-0.45 |
| A100 (40GB) | $0.80-1.20 | $0.50-0.80 |
| A100 (80GB) | $1.20-1.80 | $0.80-1.20 |
| H100 | $2.00-3.00 | $1.50-2.20 |

### Salad Cloud (Budget Option)

| GPU | $/hr | Notes |
|-----|------|-------|
| RTX 5090 | $0.25 | Cheapest RTX 5090 option |
| RTX 4090 | $0.14 | Distributed GPU network |
| A6000 | $0.20 | Good VRAM/cost ratio |

### Lambda Labs

| GPU | $/hr | Notes |
|-----|------|-------|
| A100 (80GB) | $1.25 | Reserved instances available |
| H100 | $2.49 | Multi-GPU clusters available |
| GH200 | $3.29 | Latest NVIDIA Grace Hopper |

---

## Local GPU Economics (RTX 5090)

### Hardware Costs

| Component | Cost | Lifespan |
|-----------|------|----------|
| RTX 5090 (32GB VRAM) | $1,999 | 3-4 years |
| Power supply (1000W) | $200 | 5+ years |
| CPU + Motherboard + RAM | $800 | 3-4 years |
| NVMe SSD (2TB) | $150 | 5+ years |
| Case + Cooling | $200 | 5+ years |
| **Total System** | **~$3,350** | **3-4 years** |

### Operating Costs

| Item | Cost |
|------|------|
| Electricity (450W under load) | ~$0.07/hr (US avg $0.16/kWh) |
| Electricity (idle, 50W) | ~$0.008/hr |
| Internet | Already paid (assume $0) |
| Maintenance/replacement | ~$50/year |

### RTX 5090 Performance Benchmarks

| Model | Resolution | Steps | Time/Image | Images/hr |
|-------|-----------|-------|-----------|-----------|
| SDXL (fp16) | 1024x1024 | 30 | ~3.5s | ~1,000 |
| SDXL (fp16) | 1024x1024 | 50 | ~5.5s | ~650 |
| SD3.5 Large | 1024x1024 | 28 | ~6s | ~600 |
| FLUX.1 Dev (fp16) | 1024x1024 | 28 | ~12s | ~300 |
| FLUX.1 Schnell (fp16) | 1024x1024 | 4 | ~2.5s | ~1,440 |
| FLUX.2 Dev | 1024x1024 | 28 | ~10s | ~360 |

### RTX 5090 Cost Per Image (Electricity Only)

| Model | Time/Image | Electricity Cost/Image |
|-------|-----------|----------------------|
| SDXL (30 steps) | 3.5s | $0.000068 |
| SDXL (50 steps) | 5.5s | $0.000107 |
| SD3.5 Large | 6s | $0.000117 |
| FLUX.1 Schnell | 2.5s | $0.000049 |
| FLUX.2 Dev | 10s | $0.000194 |

**Effective cost:** Essentially free per image once hardware is paid off. Even including hardware amortization, the cost is extremely low at volume.

---

## Break-Even Analysis: Self-Hosted vs API

### Scenario 1: SDXL Generation

**API Cost (Stability AI):** $0.004/image (SDXL via API)

**Self-Hosted Cost Components:**

| Volume/Month | API Cost | RunPod 4090 Cost | Vast.ai 4090 Cost | Local RTX 5090 Cost* |
|-------------|----------|-------------------|--------------------|-----------------------|
| 100 | $0.40 | $0.34 (1 hr) | $0.25 (1 hr) | $93.19** |
| 500 | $2.00 | $0.34 (1 hr) | $0.25 (1 hr) | $93.19** |
| 1,000 | $4.00 | $0.34 (1 hr) | $0.25 (1 hr) | $93.19** |
| 5,000 | $20.00 | $1.70 (5 hrs) | $1.25 (5 hrs) | $93.19** |
| 10,000 | $40.00 | $3.40 (10 hrs) | $2.50 (10 hrs) | $93.19** |
| 50,000 | $200.00 | $17.00 (50 hrs) | $12.50 (50 hrs) | $93.19** |
| 100,000 | $400.00 | $34.00 (100 hrs) | $25.00 (100 hrs) | $93.19** |

*Local RTX 5090 costs assume 3-year amortization ($93.06/mo hardware + $0.13/mo electricity at 100 imgs).
**Hardware amortization dominates at low volumes.

**Break-even points for SDXL:**
- **RunPod 4090 vs API:** API is cheaper below ~85 images/month. Above that, RunPod wins.
- **Vast.ai 4090 vs API:** API is cheaper below ~63 images/month.
- **Local RTX 5090 vs API:** API is cheaper below ~23,300 images/month (due to $3,350 hardware cost amortized over 36 months).

### Scenario 2: FLUX.2 Dev Generation

**API Cost:** $0.025/image (fal.ai) or $0.05/image (BFL direct)

**Self-Hosted Cost Components:**

| Volume/Month | fal.ai API | BFL API | RunPod 5090 | Vast.ai 5090 | Local RTX 5090* |
|-------------|-----------|---------|-------------|--------------|-----------------|
| 100 | $2.50 | $5.00 | $0.69 (1 hr) | $0.50 | $93.19 |
| 500 | $12.50 | $25.00 | $3.45 (5 hrs) | $2.50 | $93.20 |
| 1,000 | $25.00 | $50.00 | $4.83 (7 hrs) | $3.50 | $93.20 |
| 5,000 | $125.00 | $250.00 | $24.15 (35 hrs) | $17.50 | $93.22 |
| 10,000 | $250.00 | $500.00 | $48.30 (70 hrs) | $35.00 | $93.25 |
| 50,000 | $1,250.00 | $2,500.00 | $241.50 (350 hrs) | $175.00 | $93.44 |

*Local includes $93.06/mo hardware amortization + electricity.

**Break-even points for FLUX.2 Dev:**
- **RunPod 5090 vs fal.ai:** RunPod always cheaper (even 1 image costs less than 1 hr rental).
- **RunPod 5090 vs BFL:** RunPod always cheaper.
- **Local RTX 5090 vs fal.ai:** fal.ai cheaper below ~3,730 images/month.
- **Local RTX 5090 vs BFL:** BFL cheaper below ~1,865 images/month.

### Scenario 3: FLUX.1 Schnell (Speed-Optimized)

**API Cost:** $0.003/image (fal.ai)

| Volume/Month | fal.ai API | RunPod 4090 | Local RTX 5090* |
|-------------|-----------|-------------|-----------------|
| 1,000 | $3.00 | $0.34 (1 hr) | $93.19 |
| 10,000 | $30.00 | $3.40 (10 hrs) | $93.19 |
| 50,000 | $150.00 | $17.00 (50 hrs) | $93.20 |
| 100,000 | $300.00 | $34.00 (100 hrs) | $93.20 |

**Break-even:** Local RTX 5090 vs fal.ai breaks even at ~31,063 images/month.

---

## Total Cost of Ownership (TCO) Comparison — 12 Months

### Low Volume: 1,000 images/month

| Option | Monthly Cost | Annual Cost | Notes |
|--------|------------|-------------|-------|
| Google Imagen 4 Fast (Batch) | $10.00 | $120.00 | Best quality/cost, no setup |
| FLUX.2 Pro via fal.ai | $30.00 | $360.00 | High quality, no setup |
| Stability Core API | $30.00 | $360.00 | Simple API |
| RunPod 4090 (SDXL, ~1hr/mo) | $0.34 | $4.08 | Cheapest, needs setup |
| Local RTX 5090 | $93.19 | $1,118.28 | Overkill for this volume |

**Winner at 1,000/mo:** RunPod on-demand (if you can tolerate setup/teardown).
**Winner for simplicity:** Google Imagen 4 Fast Batch at $120/year.

### Medium Volume: 10,000 images/month

| Option | Monthly Cost | Annual Cost |
|--------|------------|-------------|
| Google Imagen 4 Fast (Batch) | $100.00 | $1,200.00 |
| FLUX.2 Pro via fal.ai | $300.00 | $3,600.00 |
| Stability Core API | $300.00 | $3,600.00 |
| RunPod 4090 (SDXL, ~10hrs) | $3.40 | $40.80 |
| RunPod 5090 (FLUX.2, ~28hrs) | $19.32 | $231.84 |
| Local RTX 5090 (SDXL) | $93.19 | $1,118.28 |
| Local RTX 5090 (FLUX.2) | $93.25 | $1,119.00 |

**Winner at 10,000/mo:** RunPod 4090 for SDXL ($40.80/year) or RunPod 5090 for FLUX ($231.84/year).

### High Volume: 100,000 images/month

| Option | Monthly Cost | Annual Cost |
|--------|------------|-------------|
| Google Imagen 4 Fast (Batch) | $1,000.00 | $12,000.00 |
| FLUX.2 Pro via fal.ai | $3,000.00 | $36,000.00 |
| Stability Core API | $3,000.00 | $36,000.00 |
| RunPod 4090 (SDXL, ~100hrs) | $34.00 | $408.00 |
| RunPod 5090 (FLUX.2, ~280hrs) | $193.20 | $2,318.40 |
| Local RTX 5090 (SDXL) | $93.20 | $1,118.40 |
| Local RTX 5090 (FLUX.2) | $93.44 | $1,121.28 |
| 2x Local RTX 5090 (FLUX.2) | $186.25 | $2,235.00 |

**Winner at 100,000/mo:** Local RTX 5090 for SDXL ($1,118/year). For FLUX, RunPod reserved instances or local hardware are both strong options.

---

## Hidden Costs of Self-Hosting

### Cloud GPU (RunPod/Vast.ai)

| Cost Category | Impact |
|---------------|--------|
| **Cold start time** | 30-120s to spin up a serverless container; wasted GPU time |
| **Idle time** | Paying for GPU while waiting between batches (if not serverless) |
| **Storage** | Model weights ~5-15GB per model; persistent storage $0.10-0.20/GB/mo |
| **Egress** | Image download bandwidth (usually minimal) |
| **Setup/DevOps** | Docker containers, model loading, API wrapper development |
| **Reliability** | Spot instances can be preempted; need failover logic |
| **Scaling** | Must manage multiple instances for high throughput |

### Local GPU

| Cost Category | Impact |
|---------------|--------|
| **Electricity (idle)** | ~$6/month if system stays on 24/7 at idle |
| **Cooling/HVAC** | GPU under load adds heat; may increase AC costs in summer |
| **Noise** | Fan noise under load (relevant for home office) |
| **Maintenance** | Driver updates, OS patches, occasional hardware issues |
| **Downtime** | No redundancy; hardware failure = total outage |
| **Network** | Need to expose API endpoint if serving remotely (security risk) |
| **Depreciation** | GPU value drops ~30-40% per year |
| **Opportunity cost** | Capital tied up in hardware |

### API Services

| Cost Category | Impact |
|---------------|--------|
| **No hidden costs** | What you see is what you pay |
| **No setup time** | Start generating in minutes |
| **Automatic scaling** | Handles burst traffic automatically |
| **Model updates** | New models available immediately |
| **No maintenance** | Provider handles all infrastructure |

---

## Decision Framework

### Choose API when:
- Volume is below 5,000 images/month
- You need multiple different models (variety)
- You need highest quality (Imagen 4, GPT Image 1.5, FLUX.2 Max)
- You don't have DevOps resources for infrastructure
- You need commercial-use guarantees (Adobe Firefly)
- Latency is not critical and you can use batch APIs

### Choose Cloud GPU (RunPod/Vast.ai) when:
- Volume is 5,000-100,000 images/month
- You need to run fine-tuned/custom models
- You want SDXL or FLUX at the lowest possible cost
- You have DevOps capability to manage containers
- You need consistent throughput for batch processing
- You want to run models not available via API

### Choose Local GPU when:
- Volume exceeds 30,000+ images/month consistently
- You need zero-latency generation (real-time applications)
- You run custom fine-tuned models frequently
- Privacy/data sovereignty is critical (images never leave your network)
- You already have the hardware for other purposes (ML training, gaming)
- You can accept the single-point-of-failure risk

---

## Atlas UX Recommendation

For Atlas UX agent integration (Lucy generating images for trade businesses):

**Expected volume:** 50-500 images/month per tenant, starting with low total volume.

**Recommended approach:**
1. **Start with APIs** — Use fal.ai for FLUX.2 Pro ($0.03/image) or Google Imagen 4 Fast ($0.02/image) via the credential resolver pattern already in the codebase.
2. **Multi-provider fallback** — Mirror the web search rotation pattern (webSearch.ts) with image providers for resilience.
3. **Batch when possible** — Use Google Batch API for non-real-time image generation (social media posts, marketing materials) at 50% discount.
4. **Re-evaluate at scale** — If total platform volume exceeds 50,000 images/month, consider a dedicated RunPod serverless endpoint running FLUX.2 Dev.

**Estimated cost at launch (100 tenants, 200 images/mo each = 20,000 images/mo):**
- fal.ai FLUX.2 Pro: $600/month
- Google Imagen 4 Fast: $400/month ($200 with Batch API)
- RunPod 5090 serverless: ~$55/month (most cost-effective at this volume)


---
## Media

### Platform References
- **flux**: [Docs](https://docs.bfl.ml) · [Gallery](https://blackforestlabs.ai)
- **stability-ai**: [Docs](https://platform.stability.ai/docs) · [Gallery](https://stability.ai)
- **adobe-firefly**: [Docs](https://helpx.adobe.com/firefly/using/what-is-firefly.html) · [Gallery](https://firefly.adobe.com/gallery)
- **google-imagen**: [Docs](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview) · [Gallery](https://deepmind.google/technologies/imagen-3/)

### Related Videos
- [Flux AI Image Generation - Complete Tutorial](https://www.youtube.com/results?search_query=flux+ai+image+generation+tutorial+2025) — *Credit: AI Art on YouTube* `flux`
- [Flux vs Stable Diffusion vs DALL-E - Which AI Model Wins?](https://www.youtube.com/results?search_query=flux+vs+stable+diffusion+vs+dall-e+comparison) — *Credit: AI Reviews on YouTube* `flux`
- [Stable Diffusion 3.5 Tutorial - Complete Beginner's Guide](https://www.youtube.com/results?search_query=stable+diffusion+3.5+tutorial+beginners) — *Credit: SD Tutorials on YouTube* `stability-ai`
- [Stable Diffusion Installation Guide 2025](https://www.youtube.com/results?search_query=stable+diffusion+installation+guide+2025) — *Credit: AI Art on YouTube* `stability-ai`
- [Adobe Firefly Tutorial - AI Image Generation in Photoshop](https://www.youtube.com/results?search_query=adobe+firefly+tutorial+photoshop+2025) — *Credit: Adobe on YouTube* `adobe-firefly`
- [Adobe Firefly Complete Guide for Beginners](https://www.youtube.com/results?search_query=adobe+firefly+complete+guide+beginners) — *Credit: Adobe Creative Cloud on YouTube* `adobe-firefly`

> *All video content is credited to original creators. Links direct to source platforms.*
