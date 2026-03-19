# DeepSeek — LLM Provider Profile

## Company Background

DeepSeek (formally DeepSeek Artificial Intelligence Co., Ltd.) is a Chinese artificial intelligence research company founded in 2023 by Liang Wenfeng. The company is a subsidiary of High-Flyer Capital Management, a Chinese quantitative hedge fund that Liang also founded. DeepSeek is headquartered in Hangzhou, China.

DeepSeek burst onto the global AI scene in early 2025 when the release of DeepSeek-R1 caused a significant market reaction, with NVIDIA's stock price dropping approximately 17% (nearly $600 billion in market capitalization) on January 27, 2025. The market shock was driven by DeepSeek's demonstration that frontier-level AI performance could be achieved at a fraction of the training cost of American competitors — reportedly around $5.6 million for DeepSeek-V3, compared to estimates of $100 million or more for comparable American models.

The company's approach is notable for its radical cost efficiency. Despite U.S. export controls limiting Chinese companies' access to the most advanced NVIDIA GPUs (H100, A100), DeepSeek achieved competitive results using older-generation hardware (reportedly NVIDIA H800 GPUs, a China-specific variant with reduced interconnect bandwidth). This achievement forced a reassessment of the relationship between compute expenditure and AI capability across the industry.

DeepSeek releases its models as open source under permissive licenses (MIT License), making the full model weights available for download, self-hosting, fine-tuning, and commercial use. The company operates a free web interface (chat.deepseek.com) and a paid API (platform.deepseek.com).

DeepSeek has a relatively small team compared to American AI labs — estimated at around 200 researchers — but has published several influential research papers on model architecture, training efficiency, and reasoning.

## Model Lineup

### DeepSeek-V3
- **Parameters:** 671 billion total / 37 billion active per token
- **Architecture:** Mixture of Experts (MoE) — 256 experts, 8 active per token
- **Context Window:** 128,000 tokens
- **Max Output:** 8,192 tokens
- **Release:** December 2024 (V3), updated March 2025 (V3-0324)
- **License:** MIT License (fully open source)
- **Training Cost:** Approximately $5.6 million (2,788,000 H800 GPU hours)
- **Description:** DeepSeek's flagship general-purpose model. Uses a MoE architecture with 671B total parameters but only activates 37B per token, achieving the knowledge capacity of a massive model at efficient inference cost. Features Multi-Head Latent Attention (MLA) for efficient KV-cache compression and DeepSeekMoE with auxiliary-loss-free load balancing. Competitive with GPT-4o and Claude 3.5 Sonnet on most benchmarks.

### DeepSeek-R1
- **Parameters:** 671 billion total / 37 billion active per token
- **Architecture:** MoE (same base as V3, with reasoning fine-tuning)
- **Context Window:** 128,000 tokens
- **Max Output:** 8,192 tokens
- **Release:** January 2025
- **License:** MIT License
- **Description:** DeepSeek's reasoning model, comparable to OpenAI's o1. Built on the V3 architecture with additional training for chain-of-thought reasoning. Shows its reasoning process transparently (visible thinking tokens). Excels at mathematics, coding, scientific reasoning, and complex multi-step problems. Trained using a novel approach: Group Relative Policy Optimization (GRPO) for reinforcement learning, applied directly without supervised fine-tuning on reasoning data.

### DeepSeek-R1 Distilled Models
- **Variants:** R1-Distill-Qwen-32B, R1-Distill-Qwen-14B, R1-Distill-Qwen-7B, R1-Distill-Llama-70B, R1-Distill-Qwen-1.5B, R1-Distill-Llama-8B
- **Description:** Smaller models distilled from the full R1 model. They capture much of R1's reasoning capability in a compact form factor that can be self-hosted on consumer hardware. The 32B distilled model, in particular, shows remarkably strong reasoning for its size.

### DeepSeek-V2.5
- **Parameters:** 236 billion total / ~21 billion active
- **Context Window:** 128,000 tokens
- **Release:** September 2024
- **Description:** Previous generation model combining V2 Chat and Coder capabilities. Still available but superseded by V3.

### DeepSeek-Coder-V2
- **Parameters:** 236 billion total / 21 billion active
- **Context Window:** 128,000 tokens
- **Release:** June 2024
- **Description:** Specialized code generation model. Supports 338 programming languages. Strong on code completion, generation, and debugging tasks.

### Janus-Pro (Multimodal)
- **Parameters:** 7 billion
- **Release:** January 2025
- **Description:** Multimodal model supporting both image understanding and image generation. Uses a decoupled visual encoding architecture for separate understanding and generation pathways.

## Pricing (per 1M tokens — DeepSeek Platform API)

| Model | Input | Output | Input (Cache Hit) |
|-------|-------|--------|-------------------|
| DeepSeek-V3 | $0.27 | $1.10 | $0.07 |
| DeepSeek-R1 | $0.55 | $2.19 | $0.14 |

*Note: These are the official DeepSeek Platform prices. DeepSeek models are also available through third-party providers (Together AI, Fireworks, OpenRouter) at varying prices. Self-hosting is free (MIT license) but requires significant GPU resources.*

### Cost Comparison Context
At $0.27/$1.10 per million tokens, DeepSeek-V3 is approximately:
- 9x cheaper than GPT-4o ($2.50/$10)
- 11x cheaper than Claude Sonnet 4.6 ($3/$15)
- 5x cheaper than Gemini 2.5 Pro ($1.25/$10)
- Comparable to Gemini 2.0 Flash ($0.10/$0.40) and Mistral Small ($0.10/$0.30)

## Context Windows

- **All current DeepSeek models:** 128K tokens
- **Max output:** 8K tokens (standard)
- **Effective context:** Strong needle-in-haystack performance across the full 128K window

## Key Capabilities

### Multi-Head Latent Attention (MLA)
DeepSeek's architectural innovation for efficient attention computation. MLA compresses the key-value cache into a low-rank latent space, significantly reducing memory requirements during inference. This enables longer context processing and higher throughput on the same hardware.

### DeepSeekMoE with Auxiliary-Loss-Free Load Balancing
Traditional MoE models use auxiliary loss terms to encourage balanced expert utilization, which can degrade model quality. DeepSeek developed a novel load-balancing approach that maintains balanced expert usage without these auxiliary losses, improving both training stability and model quality.

### Group Relative Policy Optimization (GRPO)
The RL algorithm used to train R1's reasoning capabilities. GRPO eliminates the need for a separate critic model (used in standard PPO/RLHF), reducing training compute requirements. The algorithm compares groups of model outputs against each other rather than against an absolute reward signal.

### Transparent Reasoning (R1)
DeepSeek-R1 shows its chain-of-thought reasoning in full. Unlike some competitors who hide reasoning tokens, R1's thinking is visible and inspectable. The model naturally develops strategies like backtracking, verification, and trying alternative approaches — behaviors that emerged from RL training without explicit programming.

### FIM (Fill-in-the-Middle)
DeepSeek-V3 and Coder models support fill-in-the-middle generation for code completion tasks, compatible with IDE integration.

### Function Calling
DeepSeek-V3 supports structured function calling with JSON schema definitions. Compatible with OpenAI-style function calling patterns.

### Multi-Token Prediction (MTP)
DeepSeek-V3 was trained with a multi-token prediction objective, where the model predicts multiple future tokens simultaneously during training. This improves data efficiency and can be leveraged for speculative decoding during inference to increase throughput.

## Strengths

1. **Price-to-performance ratio:** DeepSeek offers the best price-to-performance ratio in the industry. V3 competes with GPT-4o at roughly 1/10th the price. R1 competes with o1 at roughly 1/27th the price. For cost-sensitive, high-volume applications, DeepSeek is unmatched.

2. **Reasoning capability (R1):** DeepSeek-R1 demonstrated that frontier-level reasoning can be achieved through reinforcement learning alone, without expensive supervised reasoning data. R1's transparent reasoning process is valuable for applications requiring explainability.

3. **Open source with MIT license:** Fully open model weights under the most permissive open-source license. No commercial restrictions, no user count thresholds, no attribution requirements (though appreciated). Organizations can self-host, fine-tune, distill, and modify freely.

4. **Training efficiency:** DeepSeek proved that frontier AI doesn't require hundreds of millions of dollars in compute. The V3 training cost of ~$5.6 million challenged industry assumptions and demonstrated that algorithmic innovation can substitute for raw compute.

5. **Distilled reasoning models:** The R1-Distill series provides reasoning capabilities in models small enough to run on consumer hardware (the 7B model runs on a laptop). This democratizes access to reasoning AI in a way that proprietary reasoning models cannot match.

## Weaknesses

1. **China-based operations (compliance concerns):** DeepSeek is a Chinese company subject to Chinese law, including data localization and government access requirements. This raises compliance concerns for organizations in regulated industries, government, defense, and sectors with data sovereignty requirements. Some organizations have banned use of DeepSeek's hosted API.

2. **Rate limits and availability:** The DeepSeek API has experienced significant demand spikes and outages, particularly after the January 2025 media attention. Rate limits can be restrictive. Self-hosting avoids this but requires infrastructure investment.

3. **Content filtering (Chinese regulations):** The hosted API applies content filtering aligned with Chinese regulatory requirements. Some topics may be filtered or refused. Self-hosted deployments can bypass this, but the base model may still show biases from training data.

4. **Narrower multimodal capabilities:** DeepSeek's multimodal offerings (Janus-Pro) are limited compared to Google Gemini or OpenAI. No production-ready audio input, video understanding, or speech capabilities.

5. **Smaller ecosystem and support:** Documentation is primarily in Chinese with English translations. Community support, tutorials, and third-party tooling are less developed than for American providers. Enterprise support and SLAs are limited outside China.

## Best Use Cases

- **High-volume cost-optimized inference:** Applications processing millions of tokens daily where cost is the primary constraint (classification, extraction, summarization at scale)
- **Mathematical and scientific reasoning:** Research, tutoring, and analysis tasks requiring step-by-step reasoning with transparency (R1)
- **Self-hosted enterprise AI:** Organizations wanting frontier-level performance with full data privacy and no external API dependency (V3 or R1 with MIT license)
- **Competitive coding and problem solving:** R1 excels on competitive programming benchmarks and complex algorithmic challenges
- **Budget-conscious startups:** Early-stage companies needing GPT-4-class capability without GPT-4-class costs
- **Distilled reasoning on edge:** Running R1-Distill models on modest hardware for reasoning-augmented applications

## Benchmark Performance

### DeepSeek-V3
- MMLU: 88.5%
- MMLU-Pro: 75.9%
- HumanEval: 82.6%
- MATH-500: 90.2%
- GPQA Diamond: 59.1%
- LiveCodeBench: 40.5%
- Codeforces: 51.6 percentile
- Competitive with GPT-4o and Claude 3.5 Sonnet across most benchmarks

### DeepSeek-R1
- AIME 2024 (math competition): 79.8% (pass@1)
- MATH-500: 97.3%
- GPQA Diamond: 71.5%
- Codeforces: 96.3 percentile (2029 Elo)
- SWE-bench Verified: 49.2%
- LiveCodeBench: 65.9%
- Competitive with OpenAI o1 on reasoning benchmarks

### DeepSeek-R1-Distill-Qwen-32B
- AIME 2024: 72.6%
- MATH-500: 94.3%
- GPQA Diamond: 62.1%
- LiveCodeBench: 57.2%
- Outperforms many full-size non-reasoning models

## API Features Summary

| Feature | Supported |
|---------|-----------|
| Streaming | Yes |
| Function/Tool Calling | Yes (V3) |
| Vision (Image Input) | Limited (Janus-Pro only) |
| Audio Input | No |
| Image Generation | Limited (Janus-Pro) |
| Structured Outputs (JSON) | Yes |
| Fill-in-the-Middle | Yes (V3, Coder) |
| Fine-tuning | Yes (self-hosted, full weights) |
| Batch Processing | Limited |
| Embeddings | No |
| Self-Hosting | Yes (MIT License) |
| Transparent Reasoning | Yes (R1) |
| Prompt Caching | Yes (~75% discount) |
| MoE Architecture | Yes (256 experts) |

## Integration Notes for Atlas UX

DeepSeek is configured via `DEEPSEEK_API_KEY` in `backend/.env`. The AI provider setup in `backend/src/ai.ts` includes DeepSeek as a named provider. DeepSeek-V3 can be used as a cost-efficient alternative for tasks that don't require the safety guarantees and content policies of American providers. Particularly useful for internal processing tasks, code generation, and mathematical reasoning where cost efficiency is paramount.

---

## Citations

1. DeepSeek-AI — DeepSeek-V3 Technical Report (December 2024).
   https://arxiv.org/abs/2412.19437

2. DeepSeek-AI — DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning (January 2025).
   https://arxiv.org/abs/2501.12948

3. DeepSeek Platform — API Documentation and Pricing.
   https://platform.deepseek.com/api-docs/pricing

4. DeepSeek-AI — DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models (2024).
   https://arxiv.org/abs/2401.06066

5. DeepSeek-AI — DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model (2024).
   https://arxiv.org/abs/2405.04434

## Images

![DeepSeek Logo](https://github.com/deepseek-ai/DeepSeek-V3/raw/main/figures/deepseek-logo.png)

![DeepSeek-V3 MoE Architecture](https://github.com/deepseek-ai/DeepSeek-V3/raw/main/figures/architecture.png)

![DeepSeek-R1 Reasoning Flow](https://github.com/deepseek-ai/DeepSeek-R1/raw/main/figures/reasoning-flow.png)

![DeepSeek Benchmark Comparison](https://github.com/deepseek-ai/DeepSeek-V3/raw/main/figures/benchmark-comparison.png)

![DeepSeek MLA Architecture Detail](https://github.com/deepseek-ai/DeepSeek-V3/raw/main/figures/mla-architecture.png)

## Videos

1. DeepSeek — DeepSeek-R1: Reasoning model that rivals OpenAI o1 (community analysis and benchmark review).
   https://www.youtube.com/watch?v=VwGnCBx-bPQ

2. Yannic Kilcher — DeepSeek-V3 Technical Report Review: How a Chinese lab trained a GPT-4 competitor for $5.6M.
   https://www.youtube.com/watch?v=7Mk3pVYpGWM
