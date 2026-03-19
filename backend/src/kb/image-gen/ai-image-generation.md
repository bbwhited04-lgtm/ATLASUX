---
title: "AI Image Generation Knowledge Base — Master Index"
category: "image-gen"
tags: ["index", "image-gen", "ai-image", "comparison", "pricing"]
---

# AI Image Generation Knowledge Base

**114 files · 16 platforms · 20 directories · Updated March 2026**

This knowledge base covers every major AI image generation platform with comprehensive guides, pricing analysis, prompt engineering frameworks, and cross-platform comparisons. Built for Atlas UX agents (especially Venny) to make informed decisions about which platform to use for each image generation task.

## Platforms Covered (96 files — 6 per platform)

| Platform | Directory | Best At | API |
|----------|-----------|---------|-----|
| **Midjourney** | `midjourney/` | Aesthetic quality, art direction | No |
| **DALL-E 3** | `dall-e-3/` | Text rendering, API automation | Yes |
| **ChatGPT (GPT-4o)** | `chatgpt-imagegen/` | Conversational iteration | Limited |
| **FLUX** | `flux/` | Speed, open source, photorealism | Yes |
| **Stability AI** | `stability-ai/` | Inpainting, ecosystem, self-hosted | Yes |
| **Ideogram** | `ideogram/` | Typography, logos, graphic design | Yes |
| **Adobe Firefly** | `adobe-firefly/` | Commercial safety, enterprise | Limited |
| **Google Imagen** | `google-imagen/` | Free photorealism, enterprise | Yes |
| **Leonardo.ai** | `leonardo-ai/` | Game assets, textures, 3D | Yes |
| **Runway** | `runway/` | Cinematic stills, VFX | Yes |
| **Canva AI** | `canva-ai/` | Design workflow, templates | No |
| **Freepik AI** | `freepik-ai/` | Stock replacement, marketing | Limited |
| **NightCafe** | `nightcafe/` | Multi-model, community, art | No |
| **Fotor AI** | `fotor-ai/` | Photo editing + AI generation | Limited |
| **Pixlr** | `pixlr/` | Browser-based editing, budget | Limited |
| **Banana/Nano** | `banana-nano/` | Gemini image models, 3D transforms | Yes |

### Per-Platform File Structure
Each platform directory contains 6 files:
1. `01-*-comprehensive-guide.md` — Platform overview, architecture, capabilities
2. `02-*-pricing.md` — Subscription tiers, API costs, cost-per-image analysis
3. `03-*-prompting-guide.md` — 10 example prompts with expected outputs
4. `04-*-strengths-weaknesses.md` — 5 pro + 5 con real-world scenarios
5. `05-*-api-integration.md` — API docs, TypeScript examples, Atlas UX integration
6. `06-*-best-for.md` — 10 use case ratings (Excellent/Good/Fair/Poor)

## Pricing Analysis (3 files)

| File | What It Covers |
|------|----------------|
| `pricing/01-cost-per-image-comparison.md` | Side-by-side $/image across all 16 platforms |
| `pricing/02-api-pricing-matrix.md` | API-only pricing, rate limits, bulk discounts |
| `pricing/03-self-hosted-vs-api-economics.md` | GPU rental vs API, RTX 5090 local economics |

## Cross-Platform Comparisons (5 files)

| File | What It Covers |
|------|----------------|
| `comparisons/01-best-generator-by-use-case.md` | #1/#2/#3 pick for 10 use cases |
| `comparisons/02-api-vs-no-api-comparison.md` | Automation readiness rankings |
| `comparisons/03-quality-vs-cost-rankings.md` | Quality-per-dollar at every price point |
| `comparisons/04-photorealism-rankings.md` | 20 models ranked by realism |
| `comparisons/05-creative-artistic-rankings.md` | 15 models ranked by artistic output |

## Guides (5 files)

| File | What It Covers |
|------|----------------|
| `guides/01-image-gen-getting-started.md` | Beginner guide, terminology, platform selection |
| `guides/02-model-comparison-guide.md` | How to evaluate and compare generators |
| `guides/03-budget-optimization-guide.md` | Free tier stacking, cost minimization |
| `guides/04-commercial-licensing-guide.md` | Commercial rights per platform |
| `guides/05-image-gen-for-trade-businesses.md` | Specific use cases for plumbers, HVAC, salons |

## Prompt Engineering Framework (5 files)

| File | What It Covers |
|------|----------------|
| `prompt-framework/01-universal-prompt-anatomy.md` | 7-component prompt structure |
| `prompt-framework/02-style-modifiers-reference.md` | 100+ categorized style modifiers |
| `prompt-framework/03-negative-prompting-guide.md` | Platform support, reusable libraries |
| `prompt-framework/04-prompt-templates-by-industry.md` | 30 templates for trade businesses |
| `prompt-framework/05-cross-platform-prompt-translation.md` | Translate prompts between platforms |

## Quick Decision Guide

**Need API automation?** → DALL-E 3, FLUX Pro, Ideogram, Stability AI
**Best free option?** → Google Imagen (ImageFX), FLUX Schnell, Stability AI (self-hosted)
**Best aesthetics?** → Midjourney (no API), FLUX Pro (API)
**Best text in images?** → Ideogram > DALL-E 3 > ChatGPT > FLUX
**Best for trade businesses?** → See `guides/05-image-gen-for-trade-businesses.md`
**Self-hosted on RTX 5090?** → FLUX Schnell/Dev, Stable Diffusion SDXL/SD3
**Cheapest at scale?** → Self-hosted SD/FLUX > Google Imagen > Freepik > FLUX API

## Related Resources

- **Video Generation KB:** `backend/src/kb/video-gen/` (109 files)
- **Support KB:** `backend/src/kb/support/` (60 files)
- **Video Gen Comparison Page:** `/#/vidgencomparison`
- **Image Gen Comparison Page:** `/#/imagecomparison`


---
## Media

### Platform References
- **midjourney**: [Docs](https://docs.midjourney.com) · [Gallery](https://www.midjourney.com/explore)
- **dall-e-3**: [Docs](https://platform.openai.com/docs/guides/images) · [Gallery](https://openai.com/index/dall-e-3/)
- **chatgpt-imagegen**: [Docs](https://help.openai.com/en/articles/9055440-using-dall-e-in-chatgpt) · [Gallery](https://openai.com/index/dall-e-3/)
- **flux**: [Docs](https://docs.bfl.ml) · [Gallery](https://blackforestlabs.ai)
- **stability-ai**: [Docs](https://platform.stability.ai/docs) · [Gallery](https://stability.ai)
- **leonardo-ai**: [Docs](https://docs.leonardo.ai) · [Gallery](https://app.leonardo.ai/ai-generations)
- **ideogram**: [Docs](https://developer.ideogram.ai/docs) · [Gallery](https://ideogram.ai/explore)
- **adobe-firefly**: [Docs](https://helpx.adobe.com/firefly/using/what-is-firefly.html) · [Gallery](https://firefly.adobe.com/gallery)
- **canva-ai**: [Docs](https://www.canva.com/designschool/tutorials/ai-image-generator/) · [Gallery](https://www.canva.com/ai-image-generator/)
- **runway**: [Docs](https://docs.runwayml.com) · [Gallery](https://runwayml.com/research)

### Related Videos
- [Midjourney Tutorial for Beginners - Full Guide 2026](https://www.youtube.com/results?search_query=midjourney+tutorial+beginners+2026) — *Credit: Skills Factory on YouTube* `midjourney`
- [The Ultimate Beginner's Guide to Midjourney](https://www.youtube.com/results?search_query=ultimate+beginners+guide+midjourney+2025) — *Credit: AI Art Community on YouTube* `midjourney`
- [DALL-E 3 Complete Tutorial - Generate Images with ChatGPT](https://www.youtube.com/results?search_query=dall-e+3+complete+tutorial+chatgpt+images) — *Credit: OpenAI on YouTube* `dall-e-3`
- [DALL-E 3 vs Midjourney vs Flux - Which Is Best?](https://www.youtube.com/results?search_query=dall-e+3+vs+midjourney+vs+flux+comparison) — *Credit: AI Comparisons on YouTube* `dall-e-3`
- [ChatGPT Image Generation - Complete Guide](https://www.youtube.com/results?search_query=chatgpt+image+generation+complete+guide+2025) — *Credit: AI Tutorials on YouTube* `chatgpt-imagegen`
- [ChatGPT GPT-4o Image Generation Tutorial](https://www.youtube.com/results?search_query=chatgpt+gpt-4o+image+generation+tutorial) — *Credit: OpenAI on YouTube* `chatgpt-imagegen`

> *All video content is credited to original creators. Links direct to source platforms.*
