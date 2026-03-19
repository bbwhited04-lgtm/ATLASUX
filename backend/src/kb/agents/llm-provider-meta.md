# Meta (Llama) — LLM Provider Profile

## Company Background

Meta Platforms, Inc. (formerly Facebook) is the world's largest social media company, headquartered in Menlo Park, California. Founded by Mark Zuckerberg in 2004, Meta operates Facebook, Instagram, WhatsApp, and Messenger, serving over 3 billion daily active users across its family of apps. Meta's AI research division, FAIR (Fundamental AI Research), was established in 2013 under Yann LeCun, a Turing Award winner and one of the "godfathers of deep learning."

Meta has positioned itself as the leader in open-source AI. While competitors like OpenAI, Anthropic, and Google keep their model weights proprietary, Meta releases its Llama models under permissive licenses that allow commercial use, modification, and redistribution. This strategy serves Meta's interests by commoditizing the model layer (reducing dependence on external AI providers), building an ecosystem of developers around Meta's architecture, and accelerating AI adoption broadly.

The Llama (Large Language Model Meta AI) family began with Llama 1 (February 2023, research-only release), followed by Llama 2 (July 2023, first commercial open release), Llama 3 (April 2024), Llama 3.1 (July 2024, including the 405B model), Llama 3.2 (September 2024, adding vision and lightweight models), Llama 3.3 (December 2024), and Llama 4 (April 2025). Each generation has significantly improved capability while maintaining open access.

Meta AI is led by Yann LeCun (Chief AI Scientist) and Chris Manuelli (VP of Generative AI). The company has invested heavily in AI infrastructure, building massive GPU clusters and designing custom AI chips (MTIA — Meta Training and Inference Accelerator).

## Model Lineup

### Llama 4 Scout
- **Parameters:** 17 billion active / 109 billion total (16 expert MoE)
- **Context Window:** 10,000,000 tokens (10M)
- **Architecture:** Mixture of Experts (MoE) — 16 experts, router activates 1 per token
- **Release:** April 2025
- **License:** Llama 4 Community License (permissive, commercial use allowed)
- **Description:** Llama 4 Scout is an efficient MoE model with an extraordinary 10M token context window — the largest of any production model. Despite only activating 17B parameters per token, it competes with much larger dense models. Designed for long-context applications: entire codebases, book-length analysis, and massive document processing. Supports text and image inputs natively.

### Llama 4 Maverick
- **Parameters:** 17 billion active / 400 billion total (128 expert MoE)
- **Context Window:** 1,000,000 tokens (1M)
- **Architecture:** Mixture of Experts (MoE) — 128 experts, router activates 1 per token
- **Release:** April 2025
- **License:** Llama 4 Community License
- **Description:** Llama 4 Maverick is Meta's most capable open model. With 128 experts and 400B total parameters (but only 17B active per token), it achieves performance competitive with GPT-4o and Gemini 2.0 Flash while being dramatically more efficient to run. Supports text and image inputs. Optimized for conversational AI, coding, reasoning, and multilingual tasks.

### Llama 3.3 70B
- **Parameters:** 70 billion (dense)
- **Context Window:** 128,000 tokens
- **Architecture:** Dense Transformer
- **Release:** December 2024
- **License:** Llama 3.3 Community License
- **Description:** A refined 70B dense model that approaches the performance of the much larger Llama 3.1 405B. The most popular Llama model for self-hosting due to its balance of capability and hardware requirements. Supports text-only input. Excellent for coding, analysis, and general-purpose tasks.

### Llama 3.1 405B
- **Parameters:** 405 billion (dense)
- **Context Window:** 128,000 tokens
- **Architecture:** Dense Transformer
- **Release:** July 2024
- **License:** Llama 3.1 Community License
- **Description:** The largest openly available dense language model ever released. Competitive with GPT-4 and Claude 3 Opus at the time of release. Requires significant hardware for self-hosting (multiple high-end GPUs). Available hosted through various providers.

### Llama 3.2 Vision (11B / 90B)
- **Parameters:** 11B or 90B
- **Context Window:** 128,000 tokens
- **Release:** September 2024
- **Description:** Multimodal variants of Llama 3 that accept image inputs. Available in 11B (lightweight, edge-deployable) and 90B (high-capability) sizes.

### Llama 3.2 Lightweight (1B / 3B)
- **Parameters:** 1B or 3B
- **Context Window:** 128,000 tokens
- **Release:** September 2024
- **Description:** Ultra-lightweight models designed for on-device and edge deployment. Run on mobile phones, IoT devices, and embedded systems. Suitable for classification, summarization, and simple generation tasks.

## Pricing

Llama models are free to download and use under Meta's community license. There are no per-token charges from Meta. However, hosting and inference costs vary by deployment method:

### Self-Hosting Costs
| Model | Minimum Hardware | Approximate Monthly Cost (Cloud) |
|-------|-----------------|----------------------------------|
| Llama 4 Scout (109B MoE) | 1x H100 80GB | ~$2,000-3,000/month |
| Llama 4 Maverick (400B MoE) | 2-4x H100 80GB | ~$6,000-12,000/month |
| Llama 3.3 70B | 1x A100 80GB | ~$1,500-2,000/month |
| Llama 3.1 405B | 8x A100 80GB | ~$12,000-15,000/month |
| Llama 3.2 11B | 1x A10G | ~$500-800/month |
| Llama 3.2 1B/3B | CPU or edge device | Minimal |

### Hosted Provider Pricing (per 1M tokens, approximate)
| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| Together AI | Llama 4 Maverick | $0.27 | $0.85 |
| Together AI | Llama 3.3 70B | $0.54 | $0.54 |
| Fireworks | Llama 4 Scout | $0.15 | $0.60 |
| Groq | Llama 3.3 70B | $0.59 | $0.79 |
| Amazon Bedrock | Llama 3.1 405B | $5.32 | $16.00 |
| OpenRouter | Various | Varies | Varies |

*Prices vary significantly by provider, quantization level, and volume commitments.*

## Context Windows

Llama 4 introduced dramatically expanded context windows using architectural innovations:

- **Llama 4 Scout:** 10M tokens — the largest context window of any model, enabled by a novel interleaved attention pattern
- **Llama 4 Maverick:** 1M tokens
- **Llama 3.3 / 3.1:** 128K tokens
- **Llama 3.2 (all sizes):** 128K tokens

Meta achieved these context lengths through training innovations including iRoPE (interleaved Rotary Position Embedding) — a new positional encoding scheme that alternates between RoPE layers and no-RoPE layers.

## Key Capabilities

### Open Weights
The defining feature of Llama is that model weights are openly available. Organizations can:
- Self-host on their own infrastructure (full data privacy)
- Fine-tune on proprietary data
- Quantize for edge deployment
- Modify the architecture
- Distill into smaller models
- Run air-gapped (no internet required)

### Mixture of Experts (MoE)
Llama 4 models use MoE architecture, where only a fraction of total parameters activate per token. This provides the knowledge capacity of a much larger model at the inference cost of a smaller one. Scout has 16 experts (1 active), Maverick has 128 experts (1 active).

### Native Multimodality (Llama 4)
Llama 4 Scout and Maverick support image inputs natively, trained with an early fusion approach where visual tokens are integrated into the model from the start rather than through a separate vision encoder bolted on after training.

### Multilingual Support
Llama models support numerous languages. Llama 3.1 was trained on data in 8 languages. Llama 4 expanded multilingual support significantly, particularly for European and Asian languages.

### Fine-Tuning Ecosystem
A rich ecosystem of fine-tuning tools exists for Llama:
- Hugging Face Transformers + PEFT (LoRA, QLoRA)
- Meta's own Llama Recipes repository
- Axolotl, LitGPT, and other fine-tuning frameworks
- Thousands of community fine-tunes available on Hugging Face

### Quantization
Llama models can be quantized (reduced precision) for deployment on consumer hardware:
- GGUF format for llama.cpp (CPU + GPU inference)
- GPTQ and AWQ for GPU inference
- 4-bit quantization of Llama 3.3 70B runs on a single consumer GPU with 24GB VRAM

## Strengths

1. **Open source / open weights:** Full model weights available for download. No vendor lock-in, complete control over deployment, data privacy, and customization. The only major frontier-class model family that is truly open.

2. **Customizability and fine-tuning:** Organizations can fine-tune Llama on proprietary data to create domain-specific models. Thousands of fine-tuned variants exist on Hugging Face for every conceivable domain: medical, legal, coding, creative writing, etc.

3. **No per-token cost from Meta:** The models themselves are free. Organizations only pay for compute (self-hosted or through inference providers), creating dramatic cost savings at scale compared to proprietary APIs.

4. **Massive context windows (Llama 4):** Scout's 10M token context window is unprecedented. Maverick's 1M matches Google Gemini. This enables processing entire repositories, databases, or document collections.

5. **Edge and on-device deployment:** Llama 3.2 1B and 3B models run on mobile phones and edge devices. This enables AI applications in offline, low-connectivity, or privacy-sensitive environments where cloud APIs are not feasible.

## Weaknesses

1. **Self-hosting complexity:** Running large Llama models requires significant infrastructure expertise. Managing GPU clusters, optimizing inference, handling scaling, and maintaining uptime is a full operational burden.

2. **No official hosted API from Meta:** Meta does not offer a first-party inference API. Users must either self-host or use third-party providers (Together AI, Fireworks, Groq, etc.), each with different pricing, performance, and reliability characteristics.

3. **No built-in safety infrastructure:** Unlike OpenAI or Anthropic, there is no built-in content moderation API, no managed safety filtering, and no enterprise compliance certifications. Organizations must implement their own safety layers.

4. **Lag behind proprietary frontier:** While Llama 4 Maverick is competitive with GPT-4o and Gemini Flash, it generally trails the absolute frontier models (o3, Claude Opus 4.6, Gemini 2.5 Pro) on complex reasoning tasks. The gap has been narrowing with each release.

5. **License restrictions for very large deployments:** While permissive, the Llama license requires a separate agreement for organizations with over 700 million monthly active users (essentially only other tech giants). Some organizations may find the license terms complex to evaluate.

## Best Use Cases

- **Data-sensitive applications:** Healthcare, government, finance, and legal where data cannot leave the organization's infrastructure (self-hosted deployment)
- **Custom domain models:** Fine-tuning on proprietary data for specialized tasks (medical diagnosis, legal analysis, customer support for specific products)
- **High-volume cost optimization:** At very high token volumes, self-hosting Llama is dramatically cheaper than API-based models
- **Edge and mobile AI:** On-device AI for mobile apps, IoT, and offline-capable applications (Llama 3.2 1B/3B)
- **Long-context processing:** Analyzing entire codebases, book-length documents, or massive datasets (Llama 4 Scout with 10M context)
- **Research and experimentation:** Academic research, model behavior studies, alignment research where access to weights is essential

## Benchmark Performance

### Llama 4 Maverick (400B MoE, 17B active)
- MMLU: 88.4%
- GPQA Diamond: 69.8%
- MATH-500: 85.8%
- HumanEval: 90.2% (estimated)
- LiveCodeBench: 43.4%
- Competitive with GPT-4o on most benchmarks while using fewer active parameters

### Llama 4 Scout (109B MoE, 17B active)
- MMLU: 83.8%
- GPQA Diamond: 58.2%
- MATH-500: 78.4%
- HumanEval: 84.0% (estimated)
- Outperforms Gemma 2 27B and Mistral Small on most benchmarks

### Llama 3.3 70B
- MMLU: 86.0%
- HumanEval: 88.4%
- MATH: 77.0%
- GPQA Diamond: 50.7%
- Approaches Llama 3.1 405B performance at 1/6th the parameters

### Llama 3.1 405B
- MMLU: 88.6%
- HumanEval: 89.0%
- MATH: 73.8%
- GPQA Diamond: 51.1%
- Was the most capable open model until Llama 4

## API Features Summary (via Hosted Providers)

| Feature | Supported |
|---------|-----------|
| Streaming | Yes (provider-dependent) |
| Function/Tool Calling | Yes (Llama 3.1+) |
| Vision (Image Input) | Yes (Llama 3.2 Vision, Llama 4) |
| Audio Input | No |
| Structured Outputs (JSON) | Yes (with prompting or constrained decoding) |
| Fine-tuning | Yes (self-hosted, full access to weights) |
| Quantization | Yes (GGUF, GPTQ, AWQ) |
| Edge Deployment | Yes (1B, 3B models) |
| Embeddings | No (use separate embedding models) |
| Self-Hosting | Yes (primary use case) |
| MoE Architecture | Yes (Llama 4) |

## Integration Notes for Atlas UX

Meta Llama models are accessed through OpenRouter (`OPENROUTER_API_KEY`) in the Atlas UX platform. The AI provider setup in `backend/src/ai.ts` routes to Llama models via OpenRouter for specific cost-sensitive tasks. Llama models are particularly useful for high-volume extraction and classification tasks where self-hosted or low-cost inference is preferred over premium proprietary APIs.

---

## Citations

1. Meta AI — Llama 4 Model Card and Research Overview.
   https://ai.meta.com/blog/llama-4-multimodal-intelligence/

2. Meta AI — Llama Model Repository and Documentation.
   https://llama.meta.com/

3. Touvron et al. — Llama 2: Open Foundation and Fine-Tuned Chat Models (2023).
   https://arxiv.org/abs/2307.09288

4. Grattafiori et al. — The Llama 3 Herd of Models (2024).
   https://arxiv.org/abs/2407.21783

5. Meta AI — Llama Community License Agreement.
   https://llama.meta.com/llama3/license/

## Images

![Meta AI Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Meta_Platforms_Inc._logo.svg/1280px-Meta_Platforms_Inc._logo.svg.png)

![Llama 4 MoE Architecture Diagram](https://scontent.xx.fbcdn.net/v/llama4-moe-architecture-diagram.png)

![Llama Model Family Timeline](https://ai.meta.com/static-resource/llama-model-timeline.png)

![Llama Benchmark Comparison](https://ai.meta.com/static-resource/llama4-benchmark-comparison.png)

![Llama Open Source Ecosystem](https://ai.meta.com/static-resource/llama-ecosystem-overview.png)

## Videos

1. Meta AI — Introducing Llama 4: Open-source multimodal intelligence.
   https://www.youtube.com/watch?v=8kU29VhPCgg

2. Meta AI — Llama 3.1 405B: The largest open-source model ever released.
   https://www.youtube.com/watch?v=7VIiCHeyONQ
