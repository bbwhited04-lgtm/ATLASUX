# LLM Cost Comparative Analysis

> A comprehensive cost comparison of every major LLM provider, benchmarked against a standard **1,000-word prompt** (~1,333 input tokens) with a **500-word response** (~667 output tokens). Prices as of Q1 2025.

---

## Understanding Token Economics

Before comparing costs, understand how LLMs charge:

- **Tokens ≠ words.** One token ≈ 0.75 words (English). A 1,000-word prompt is approximately **1,333 tokens**.
- **Input vs output pricing.** Most providers charge differently for input (your prompt) and output (the model's response). Output tokens are typically 2–5x more expensive.
- **Context window usage.** You pay for what you send, not the model's maximum context window.
- **Cached input discounts.** Some providers offer 50–90% discounts for repeated prompt prefixes (system prompts, few-shot examples).

### Standard Benchmark

All costs below are calculated for:
- **Input:** 1,000 words = ~1,333 tokens
- **Output:** 500 words = ~667 tokens
- **No caching or batch discounts**

This represents a typical single API call — a customer support query, a content generation request, or a code completion.

![Token economics visualization](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Comparison_of_tokenizers.png/800px-Comparison_of_tokenizers.png)

---

## Tier 1: Frontier Models (Highest Capability)

These are the most capable models, suitable for complex reasoning, multi-step analysis, and high-stakes applications.

| Model | Provider | Input $/1M | Output $/1M | **Cost per 1K-word prompt** | Context | Parameters |
|-------|----------|-----------|------------|---------------------------|---------|------------|
| Claude Opus 4.6 | Anthropic | $15.00 | $75.00 | **$0.0700** | 200K | Undisclosed |
| GPT-4.5 | OpenAI | $75.00 | $150.00 | **$0.2000** | 128K | Undisclosed |
| o1 | OpenAI | $15.00 | $60.00 | **$0.0600** | 200K | Undisclosed |
| o3 | OpenAI | $10.00 | $40.00 | **$0.0400** | 200K | Undisclosed |
| Gemini 2.5 Pro | Google | $1.25–$2.50 | $10.00–$15.00 | **$0.0117** | 1M | Undisclosed |
| Grok 3 | xAI | $3.00 | $15.00 | **$0.0140** | 131K | Undisclosed |

### Cost Breakdown (1,000-word prompt + 500-word response)

```
Claude Opus 4.6:    (1,333 × $15.00 / 1,000,000) + (667 × $75.00 / 1,000,000)  = $0.0200 + $0.0500 = $0.0700
GPT-4.5:            (1,333 × $75.00 / 1,000,000) + (667 × $150.00 / 1,000,000) = $0.1000 + $0.1000 = $0.2000
o1:                 (1,333 × $15.00 / 1,000,000) + (667 × $60.00 / 1,000,000)  = $0.0200 + $0.0400 = $0.0600
o3:                 (1,333 × $10.00 / 1,000,000) + (667 × $40.00 / 1,000,000)  = $0.0133 + $0.0267 = $0.0400
Gemini 2.5 Pro:     (1,333 × $2.50 / 1,000,000)  + (667 × $15.00 / 1,000,000) = $0.0033 + $0.0100 = $0.0133*
Grok 3:             (1,333 × $3.00 / 1,000,000)  + (667 × $15.00 / 1,000,000) = $0.0040 + $0.0100 = $0.0140
```

*Gemini pricing varies by prompt length (under/over 200K tokens). Lower tier shown for prompts under 200K.

![Frontier model cost comparison](https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/LLM_cost_comparison_chart.svg/800px-LLM_cost_comparison_chart.svg.png)

---

## Tier 2: High-Performance Models (Best Value)

The sweet spot for most production applications — strong capability at significantly lower cost.

| Model | Provider | Input $/1M | Output $/1M | **Cost per 1K-word prompt** | Context | Parameters |
|-------|----------|-----------|------------|---------------------------|---------|------------|
| Claude Sonnet 4.6 | Anthropic | $3.00 | $15.00 | **$0.0140** | 200K | Undisclosed |
| GPT-4o | OpenAI | $2.50 | $10.00 | **$0.0100** | 128K | Undisclosed |
| GPT-4.1 | OpenAI | $2.00 | $8.00 | **$0.0080** | 1M | Undisclosed |
| Gemini 2.5 Flash | Google | $0.15–$0.60 | $0.60–$3.50 | **$0.0031** | 1M | Undisclosed |
| Mistral Large | Mistral | $2.00 | $6.00 | **$0.0067** | 128K | Undisclosed |
| Command R+ | Cohere | $2.50 | $10.00 | **$0.0100** | 128K | 104B |
| DeepSeek-V3 | DeepSeek | $0.27 | $1.10 | **$0.0011** | 128K | 671B (37B active) |
| DeepSeek-R1 | DeepSeek | $0.55 | $2.19 | **$0.0022** | 128K | 671B (37B active) |
| Sonar Pro | Perplexity | $3.00 | $15.00 | **$0.0140** | 200K | Undisclosed |

### Cost Breakdown (1,000-word prompt + 500-word response)

```
Claude Sonnet 4.6:  (1,333 × $3.00 / 1M) + (667 × $15.00 / 1M)  = $0.0040 + $0.0100 = $0.0140
GPT-4o:             (1,333 × $2.50 / 1M) + (667 × $10.00 / 1M)  = $0.0033 + $0.0067 = $0.0100
GPT-4.1:            (1,333 × $2.00 / 1M) + (667 × $8.00 / 1M)   = $0.0027 + $0.0053 = $0.0080
Gemini 2.5 Flash:   (1,333 × $0.60 / 1M) + (667 × $3.50 / 1M)   = $0.0008 + $0.0023 = $0.0031
Mistral Large:      (1,333 × $2.00 / 1M) + (667 × $6.00 / 1M)   = $0.0027 + $0.0040 = $0.0067
Command R+:         (1,333 × $2.50 / 1M) + (667 × $10.00 / 1M)  = $0.0033 + $0.0067 = $0.0100
DeepSeek-V3:        (1,333 × $0.27 / 1M) + (667 × $1.10 / 1M)   = $0.0004 + $0.0007 = $0.0011
DeepSeek-R1:        (1,333 × $0.55 / 1M) + (667 × $2.19 / 1M)   = $0.0007 + $0.0015 = $0.0022
Sonar Pro:          (1,333 × $3.00 / 1M) + (667 × $15.00 / 1M)  = $0.0040 + $0.0100 = $0.0140
```

---

## Tier 3: Lightweight / Edge Models (Lowest Cost)

For high-volume, latency-sensitive, or cost-constrained applications. Quality trade-offs are real but manageable for focused tasks.

| Model | Provider | Input $/1M | Output $/1M | **Cost per 1K-word prompt** | Context | Parameters |
|-------|----------|-----------|------------|---------------------------|---------|------------|
| Claude Haiku 4.5 | Anthropic | $0.80 | $4.00 | **$0.0037** | 200K | Undisclosed |
| GPT-4o-mini | OpenAI | $0.15 | $0.60 | **$0.0006** | 128K | Undisclosed |
| o4-mini | OpenAI | $1.10 | $4.40 | **$0.0044** | 200K | Undisclosed |
| Gemini 2.0 Flash | Google | $0.10 | $0.40 | **$0.0004** | 1M | Undisclosed |
| Mistral Small | Mistral | $0.10 | $0.30 | **$0.0003** | 128K | Undisclosed |
| Nova Micro | Amazon | $0.035 | $0.14 | **$0.0001** | 128K | Undisclosed |
| Nova Lite | Amazon | $0.06 | $0.24 | **$0.0002** | 300K | Undisclosed |
| Nova Pro | Amazon | $0.80 | $3.20 | **$0.0032** | 300K | Undisclosed |
| Phi-4 | Microsoft | Free* | Free* | **$0.0000** | 16K | 14B |
| Llama 4 Scout | Meta | Free* | Free* | **$0.0000** | 10M | 17B active / 109B |
| Llama 4 Maverick | Meta | Free* | Free* | **$0.0000** | 1M | 17B active / 400B |
| Qwen 2.5 72B | Alibaba | Free* | Free* | **$0.0000** | 128K | 72B |
| Jamba 1.5 Mini | AI21 | $0.20 | $0.40 | **$0.0005** | 256K | 12B active / 52B |
| Sonar | Perplexity | $1.00 | $1.00 | **$0.0020** | 128K | Undisclosed |
| Command R | Cohere | $0.15 | $0.60 | **$0.0006** | 128K | 35B |
| Codestral | Mistral | $0.30 | $0.90 | **$0.0010** | 256K | 22B |

*Free = open-weights models. Cost is infrastructure only (GPU/CPU hosting). Zero API cost when self-hosted.

![Cost tier comparison](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/LLM_pricing_tiers.svg/800px-LLM_pricing_tiers.svg.png)

---

## Monthly Cost Projections

What does this cost at scale? Projections for different usage levels, using the 1,000-word prompt benchmark:

### Low Volume: 1,000 calls/day (small business, internal tool)

| Model | Daily Cost | Monthly Cost (30d) | Annual Cost |
|-------|-----------|-------------------|-------------|
| GPT-4.5 | $200.00 | $6,000.00 | $72,000.00 |
| Claude Opus 4.6 | $70.00 | $2,100.00 | $25,200.00 |
| o3 | $40.00 | $1,200.00 | $14,400.00 |
| Claude Sonnet 4.6 | $14.00 | $420.00 | $5,040.00 |
| GPT-4o | $10.00 | $300.00 | $3,600.00 |
| GPT-4.1 | $8.00 | $240.00 | $2,880.00 |
| Gemini 2.5 Flash | $3.10 | $93.00 | $1,116.00 |
| DeepSeek-V3 | $1.10 | $33.00 | $396.00 |
| GPT-4o-mini | $0.60 | $18.00 | $216.00 |
| Gemini 2.0 Flash | $0.40 | $12.00 | $144.00 |
| Mistral Small | $0.30 | $9.00 | $108.00 |
| Nova Micro | $0.10 | $3.00 | $36.00 |

### Medium Volume: 10,000 calls/day (SaaS product, customer-facing)

| Model | Daily Cost | Monthly Cost (30d) | Annual Cost |
|-------|-----------|-------------------|-------------|
| Claude Opus 4.6 | $700.00 | $21,000.00 | $252,000.00 |
| Claude Sonnet 4.6 | $140.00 | $4,200.00 | $50,400.00 |
| GPT-4.1 | $80.00 | $2,400.00 | $28,800.00 |
| Gemini 2.5 Flash | $31.00 | $930.00 | $11,160.00 |
| DeepSeek-V3 | $11.00 | $330.00 | $3,960.00 |
| GPT-4o-mini | $6.00 | $180.00 | $2,160.00 |
| Mistral Small | $3.00 | $90.00 | $1,080.00 |
| Nova Micro | $1.00 | $30.00 | $360.00 |

### High Volume: 100,000 calls/day (enterprise platform)

| Model | Daily Cost | Monthly Cost (30d) | Annual Cost |
|-------|-----------|-------------------|-------------|
| Claude Sonnet 4.6 | $1,400.00 | $42,000.00 | $504,000.00 |
| GPT-4.1 | $800.00 | $24,000.00 | $288,000.00 |
| Gemini 2.5 Flash | $310.00 | $9,300.00 | $111,600.00 |
| DeepSeek-V3 | $110.00 | $3,300.00 | $39,600.00 |
| GPT-4o-mini | $60.00 | $1,800.00 | $21,600.00 |
| Mistral Small | $30.00 | $900.00 | $10,800.00 |
| Nova Micro | $10.00 | $300.00 | $3,600.00 |

---

## Specialized Pricing

### Reasoning Models (Extended Thinking)

Reasoning models use extra tokens internally for chain-of-thought. The actual cost is higher than the base pricing suggests because thinking tokens are charged.

| Model | Input $/1M | Output $/1M | Thinking $/1M | Effective cost per 1K-word prompt* |
|-------|-----------|------------|--------------|-----------------------------------|
| o1 | $15.00 | $60.00 | $60.00 | **$0.12–$0.30** |
| o3 | $10.00 | $40.00 | $40.00 | **$0.08–$0.20** |
| o4-mini | $1.10 | $4.40 | $4.40 | **$0.009–$0.022** |
| DeepSeek-R1 | $0.55 | $2.19 | $2.19 | **$0.004–$0.011** |
| Claude Opus 4.6 (extended) | $15.00 | $75.00 | $75.00 | **$0.12–$0.38** |
| Gemini 2.5 Pro (thinking) | $2.50 | $15.00 | $15.00 | **$0.02–$0.08** |

*Range depends on thinking depth. Simple questions use fewer thinking tokens; complex reasoning can use 5,000–50,000+ thinking tokens.

### Embedding Models

For RAG pipelines and semantic search:

| Model | Provider | $/1M tokens | Dimensions | Max Input |
|-------|----------|------------|------------|-----------|
| text-embedding-3-small | OpenAI | $0.02 | 1,536 | 8,191 |
| text-embedding-3-large | OpenAI | $0.13 | 3,072 | 8,191 |
| Embed v3 | Cohere | $0.10 | 1,024 | 512 |
| Voyage-3 | Voyage AI | $0.06 | 1,024 | 32,000 |
| Titan Embeddings v2 | Amazon | $0.02 | 1,024 | 8,192 |

### Image Understanding (Vision)

Most modern LLMs include vision at no extra per-image cost — the image is tokenized and charged at the standard input token rate:

| Model | Approx tokens per image | Cost per image (standard res) |
|-------|------------------------|-------------------------------|
| GPT-4o | ~765 tokens | $0.0019 |
| Claude Sonnet 4.6 | ~1,600 tokens | $0.0048 |
| Gemini 2.5 Pro | ~258 tokens | $0.0003 |

![Vision pricing comparison](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Multimodal_AI_comparison.svg/800px-Multimodal_AI_comparison.svg.png)

---

## Cost Optimization Strategies

### 1. Prompt Caching

Reuse system prompts across requests to save 50–90% on input costs:

| Provider | Cache Discount | Min Cache TTL | Best For |
|----------|---------------|--------------|----------|
| Anthropic | 90% off cached input | 5 min | Long system prompts, few-shot examples |
| OpenAI | 50% off cached input | Auto | Repeated conversations, batch processing |
| Google | 75% off cached input | 1 hr (custom) | Document Q&A, large context reuse |

### 2. Batch Processing

Process requests in bulk at reduced rates:

| Provider | Batch Discount | Max Wait Time |
|----------|---------------|--------------|
| OpenAI | 50% off | 24 hours |
| Anthropic | 50% off | 24 hours |
| Google | Varies | Varies |

### 3. Model Routing

Use cheap models for simple tasks, expensive models for complex ones:

```
User query → Classifier (GPT-4o-mini: $0.0006)
  ├── Simple FAQ → Mistral Small ($0.0003)
  ├── Standard task → GPT-4.1 ($0.0080)
  └── Complex reasoning → Claude Opus 4.6 ($0.0700)

Average cost: ~$0.003 vs $0.07 for always-Opus
Savings: 95%
```

### 4. Self-Hosting Open Models

For high-volume production, self-hosting eliminates per-token costs:

| Model | GPU Required | Monthly GPU Cost | Break-even vs API |
|-------|-------------|-----------------|-------------------|
| Llama 4 Scout (17B active) | 1x A100 80GB | ~$2,000 | ~15K calls/day at GPT-4o pricing |
| Mistral Small (22B) | 1x A100 40GB | ~$1,500 | ~50K calls/day at Mistral API pricing |
| Phi-4 (14B) | 1x A10G 24GB | ~$500 | Very low volume |
| Qwen 2.5 72B | 2x A100 80GB | ~$4,000 | ~35K calls/day |

### 5. Quantization for Edge

Run models on consumer hardware with quality trade-offs:

| Quantization | Size Reduction | Quality Impact | Hardware |
|-------------|---------------|----------------|----------|
| FP16 (baseline) | 1x | None | Data center GPU |
| INT8 | 2x | <1% degradation | Mid-range GPU |
| INT4 (GPTQ/AWQ) | 4x | 2–5% degradation | Consumer GPU |
| GGUF Q4_K_M | 4x | 3–5% degradation | CPU + some GPU |
| GGUF Q2_K | 8x | 10–15% degradation | CPU only |

---

## Decision Framework

### Choose by Use Case

| Use Case | Recommended Model | Cost/call | Why |
|----------|------------------|-----------|-----|
| **Customer support chatbot** | GPT-4.1 or Claude Sonnet 4.6 | $0.008–$0.014 | Good quality, reasonable cost |
| **Code generation** | Claude Sonnet 4.6 or Codestral | $0.001–$0.014 | Best coding benchmarks |
| **Document summarization** | Gemini 2.5 Flash | $0.003 | Long context, low cost |
| **Real-time search answers** | Sonar Pro or Grok 3 | $0.014 | Built-in web search |
| **Enterprise RAG** | Command R+ | $0.010 | RAG-native, reranking included |
| **High-volume classification** | GPT-4o-mini or Nova Micro | $0.0001–$0.0006 | Cheapest capable models |
| **Complex reasoning** | o3 or Claude Opus 4.6 | $0.04–$0.07 | Best reasoning benchmarks |
| **Budget-conscious startup** | DeepSeek-V3 | $0.001 | Best price/performance ratio |
| **Offline / air-gapped** | Llama 4 Scout (self-hosted) | GPU cost only | No API dependency |
| **AI receptionist (Atlas UX)** | GPT-4o-mini + Claude Sonnet 4.6 | $0.001–$0.014 | Routing: simple→cheap, complex→capable |

### Choose by Budget

| Monthly Budget | Best Strategy | Models |
|---------------|--------------|--------|
| **< $50/mo** | Single cheap model | GPT-4o-mini, Mistral Small, DeepSeek-V3 |
| **$50–$500/mo** | Smart routing (cheap + capable) | GPT-4o-mini + GPT-4.1 |
| **$500–$5,000/mo** | Multi-model with caching | Gemini Flash + Claude Sonnet + batch |
| **$5,000+/mo** | Self-host base + API for peaks | Llama self-hosted + Claude/GPT API |

![Decision framework flowchart](https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/AI_model_selection_flowchart.svg/800px-AI_model_selection_flowchart.svg.png)

---

## Atlas UX Cost Structure

Atlas UX uses a multi-model strategy for its agent platform:

| Component | Model | Calls/day | Daily Cost | Monthly |
|-----------|-------|-----------|-----------|---------|
| Lucy voice (receptionist) | GPT-4o-mini | ~200 | $0.12 | $3.60 |
| Agent chat (Slack) | GPT-4o | ~500 | $5.00 | $150.00 |
| Engine (intent processing) | GPT-4o | ~100 | $1.00 | $30.00 |
| KB queries (RAG) | GPT-4o-mini | ~300 | $0.18 | $5.40 |
| Self-mend validation | Regex only | ∞ | $0.00 | $0.00 |
| **Total** | | **~1,100** | **$6.30** | **$189.00** |

The self-mend system uses zero LLM tokens — it's pure regex pattern matching, making hallucination prevention essentially free.

---

## References

1. OpenAI Pricing — https://openai.com/api/pricing/
2. Anthropic API Pricing — https://docs.anthropic.com/en/docs/about-claude/pricing
3. Google Gemini API Pricing — https://ai.google.dev/pricing
4. AWS Bedrock Pricing — https://aws.amazon.com/bedrock/pricing/
5. Artificial Analysis LLM Leaderboard — https://artificialanalysis.ai/leaderboards/models

---

## Video Resources

1. [Understanding LLM Pricing and Token Economics — AI Explained](https://www.youtube.com/watch?v=WaZSmBADHxM)
2. [How to Reduce LLM API Costs by 90% — Fireship](https://www.youtube.com/watch?v=cPCJEMajMcQ)
