# LLM Provider Profile: AI21 Labs (Jamba)

## Company Background

AI21 Labs is an Israeli artificial intelligence company founded in 2017 by Yoav Shoham, Ori Goshen, and Amnon Shashua. The founders brought significant pedigree: Shoham is a Stanford professor and AI pioneer, Goshen is a serial entrepreneur, and Shashua co-founded Mobileye (acquired by Intel for $15.3 billion). AI21 Labs is headquartered in Tel Aviv with offices in New York.

The company has raised approximately $336 million in funding, including a $208 million Series D in 2023, at a valuation of $1.4 billion. Investors include Google, NVIDIA, Intel Capital, and Walden Catalyst.

AI21 Labs' journey has been marked by bold architectural bets. They initially developed the Jurassic series of transformer models (Jurassic-1, Jurassic-2), which competed respectably with GPT-3 and early GPT-4. However, in 2024, AI21 made a pivotal strategic decision: they abandoned the pure transformer architecture in favor of a novel hybrid design combining State Space Models (SSMs) with transformer attention layers. This resulted in the Jamba architecture — a fundamentally different approach to language modeling.

The Jamba architecture interleaves Mamba layers (a selective state space model) with transformer attention layers in a Mixture of Experts (MoE) configuration. This hybrid design addresses the transformer's primary weakness — quadratic attention complexity — while preserving its strength in precise information retrieval over long contexts.

AI21 positions itself as the enterprise long-context specialist, targeting document-heavy industries: legal, financial services, healthcare, and insurance.

![AI21 Labs Logo](https://www.ai21.com/hubfs/ai21-logo-dark.svg)

---

## Model Lineup

### Jamba 1.5 Large

Jamba 1.5 Large is AI21's flagship model, featuring the SSM-Transformer hybrid architecture at scale.

| Specification | Details |
|---|---|
| Total Parameters | 398B |
| Active Parameters | 94B (per token, MoE routing) |
| Context Window | 256,000 tokens |
| Architecture | Mamba-Transformer hybrid, MoE (16 experts, top-2) |
| Training Data Cutoff | March 2024 |
| Input Pricing | $2.00 per million tokens |
| Output Pricing | $8.00 per million tokens |
| License | Jamba Open (non-commercial research) |

The MoE architecture means that while the model has 398B total parameters, only 94B are activated for each token prediction. This gives Jamba 1.5 Large the quality of a ~100B dense model with the computational efficiency of a significantly smaller one.

The 256K context window is among the largest offered by any commercial model, and critically, Jamba's SSM layers handle long contexts more efficiently than pure transformers. Where transformer attention scales quadratically with sequence length (O(n^2)), Mamba layers scale linearly (O(n)), making Jamba genuinely fast on long documents rather than merely capable of accepting them.

### Jamba 1.5 Mini

Jamba 1.5 Mini is the cost-efficient variant, designed for high-volume applications where speed and cost matter more than peak quality.

| Specification | Details |
|---|---|
| Total Parameters | 52B |
| Active Parameters | 12B (per token, MoE routing) |
| Context Window | 256,000 tokens |
| Architecture | Mamba-Transformer hybrid, MoE |
| Input Pricing | $0.20 per million tokens |
| Output Pricing | $0.40 per million tokens |
| License | Jamba Open (non-commercial research) |

At 12B active parameters, Jamba Mini delivers strong performance for summarization, extraction, and Q&A tasks. Its 256K context at $0.20 per million input tokens makes it the most cost-effective option for processing very long documents.

### Jamba Architecture Deep Dive

The Jamba architecture alternates between three types of layers:

1. **Mamba layers** — Selective state space model layers that process sequences in linear time. These layers excel at capturing long-range dependencies efficiently but lack the precise "lookup" capability of attention.

2. **Transformer attention layers** — Standard multi-head attention layers interspersed every few Mamba layers. These provide precise information retrieval and copying capabilities that SSMs lack.

3. **MoE routing** — Both Mamba and attention layers use Mixture of Experts, where only a subset of parameters are activated per token.

The ratio is approximately 7:1 (Mamba to attention layers), meaning most of the model's computation is performed by the efficient SSM layers, with attention layers strategically placed to handle tasks requiring precise recall.

![Jamba Architecture Diagram](https://www.ai21.com/hubfs/jamba-architecture-diagram.png)

### Contextual Answers

AI21 offers a specialized Contextual Answers endpoint that takes a context document and a question, returning an answer grounded exclusively in the provided context. If the answer is not in the context, it returns "Answer not in document" rather than hallucinating.

| Feature | Details |
|---|---|
| Max Context | 256,000 tokens |
| Pricing | $0.02 per query (up to 10K tokens context) |
| Hallucination Rate | <2% (per AI21's benchmarks) |

### Task-Specific Models (Legacy)

AI21 maintains several task-specific endpoints from the Jurassic era:

| Model | Purpose | Pricing |
|---|---|---|
| Summarize | Document summarization | $0.005 per request |
| Paraphrase | Text rewriting | $0.005 per request |
| Text Segmentation | Topic boundary detection | $0.005 per request |
| Grammar Correction | GEC | $0.005 per request |

---

## API Features

### Standard Chat API

AI21's API follows the OpenAI-compatible format:

```python
from ai21 import AI21Client

client = AI21Client(api_key="your-key")

response = client.chat.completions.create(
    model="jamba-1.5-large",
    messages=[
        {"role": "system", "content": "You are a legal document analyst."},
        {"role": "user", "content": "Summarize this 200-page contract..."}
    ],
    max_tokens=4096
)
```

### Document Processing Pipeline

AI21 provides a higher-level document processing API:

1. **Upload** — Send a document (PDF, DOCX, TXT, up to 256K tokens)
2. **Query** — Ask questions about the document
3. **Ground** — Responses include source references to specific document sections

This pipeline is optimized for the legal and financial document review use case, where users need to ask multiple questions about the same long document.

### Streaming

Server-sent events (SSE) streaming is supported for all generation endpoints.

### RAG Engine

AI21 offers a managed RAG service:
- Document upload and automatic chunking
- Vector storage (managed)
- Retrieval with reranking
- Grounded generation with citations

![AI21 RAG Pipeline](https://www.ai21.com/hubfs/ai21-rag-engine.png)

### Function Calling

Jamba 1.5 models support structured function calling with JSON schema tool definitions, enabling integration with external systems.

---

## Benchmark Performance

### General Benchmarks

| Benchmark | Jamba 1.5 Large | Jamba 1.5 Mini | Llama 3.1-70B | GPT-4o-mini |
|---|---|---|---|---|
| MMLU | 80.0% | 69.7% | 83.6% | 82.0% |
| HumanEval | 73.2% | 61.0% | 80.5% | 87.2% |
| GSM8K | 85.1% | 74.8% | 90.3% | 93.2% |
| ARC-Challenge | 89.3% | 82.1% | 94.8% | 96.4% |

### Long Context Benchmarks

Where Jamba truly differentiates is long-context performance:

| Benchmark | Jamba 1.5 Large | Llama 3.1-70B | GPT-4o |
|---|---|---|---|
| RULER (128K) | 83.7% | 77.4% | 84.2% |
| RULER (256K) | 78.2% | N/A (128K max) | N/A |
| InfiniteBench (Avg) | 72.8% | 64.3% | 76.1% |
| Needle-in-Haystack (256K) | 99.2% | 98.1% (128K) | 99.5% |

### Throughput Benchmarks

The SSM-Transformer hybrid architecture provides significant speed advantages on long sequences:

| Sequence Length | Jamba 1.5 Large (tokens/sec) | Llama 3.1-70B (tokens/sec) |
|---|---|---|
| 4K tokens | 145 | 152 |
| 32K tokens | 138 | 108 |
| 128K tokens | 124 | 62 |
| 256K tokens | 112 | N/A |

At 128K tokens, Jamba is approximately 2x faster than comparable transformer models because Mamba layers process the context in linear time rather than quadratic.

### Efficiency Metrics

| Model | Active Params | 256K Context Memory | Tokens/Second (256K) |
|---|---|---|---|
| Jamba 1.5 Large | 94B | ~180GB | 112 |
| Llama 3.1-70B | 70B | ~280GB (128K only) | N/A at 256K |
| Mixtral 8x22B | 39B active | ~120GB (64K only) | 85 |

![Jamba Throughput Comparison](https://www.ai21.com/hubfs/jamba-throughput-benchmark.png)

---

## Key Capabilities

### Efficient Long Context Processing

Jamba's primary differentiator is genuine efficiency at long context lengths. While many models advertise 128K+ context windows, they often degrade in quality or become prohibitively slow. Jamba's SSM layers maintain consistent throughput as context length increases.

Practical implications:
- Process a full 250-page legal contract in a single call
- Analyze an entire codebase without chunking
- Review multi-hour meeting transcripts holistically
- Compare multiple lengthy documents side by side

### Grounded Generation

The Contextual Answers endpoint enforces strict grounding: the model only generates answers that can be traced to the provided context. When information is not present, it explicitly states this rather than fabricating an answer. This is critical for legal, medical, and financial applications where hallucination has real consequences.

### Document Q&A at Scale

AI21's managed RAG engine is purpose-built for enterprise document repositories. It handles:
- Multi-format ingestion (PDF, DOCX, HTML, TXT)
- Automatic chunking with semantic boundary detection
- Cross-document queries
- Citation tracking

---

## Strengths

1. **Novel architecture with real benefits** — The Mamba-Transformer hybrid is not a marketing gimmick. It delivers measurable advantages in throughput and memory efficiency at long context lengths, validated by independent benchmarks.

2. **256K context with maintained quality** — Jamba is one of the few models that genuinely performs well at its maximum context length. Many competitors degrade significantly beyond 32-64K tokens.

3. **Cost-effective long document processing** — Jamba 1.5 Mini at $0.20/$0.40 per million tokens with 256K context is the cheapest option for processing very long documents.

4. **Enterprise document focus** — AI21's RAG engine, Contextual Answers, and document processing pipeline are purpose-built for the document-heavy workflows common in legal, financial, and healthcare enterprises.

5. **Architectural innovation** — AI21 is one of few companies pushing beyond pure transformer architectures. Their work on SSM-Transformer hybrids contributes genuine innovation to the field.

---

## Weaknesses

1. **General reasoning gap** — Jamba 1.5 Large at 80% MMLU trails GPT-4o (85.7%) and Claude 3.5 Sonnet (88.7%). For general-purpose AI tasks, it is not the strongest choice.

2. **Smaller ecosystem** — Fewer integrations, tutorials, and community resources compared to OpenAI, Anthropic, or even Mistral. Third-party framework support (LangChain, LlamaIndex) exists but is less mature.

3. **Niche positioning** — AI21's focus on document processing and long context, while a strength, limits its appeal for general-purpose AI applications like chatbots, creative writing, or code generation.

4. **Limited multimodal capabilities** — As of early 2025, Jamba models are text-only. No vision, audio, or image generation support.

5. **Uncertain competitive moat** — As transformer models continue to improve their long-context efficiency (FlashAttention, Ring Attention), Jamba's architectural advantage may narrow. Pure transformers with 1M+ context windows are approaching comparable efficiency.

---

## Best Use Cases

### Legal Document Review
Law firms processing contracts, case filings, and regulatory documents benefit from Jamba's 256K context and grounded generation. A single API call can analyze an entire contract and answer specific questions with citations.

### Financial Report Analysis
Quarterly earnings reports, SEC filings, and research reports often span 50-200 pages. Jamba processes these holistically rather than in chunks, preserving cross-reference relationships.

### Healthcare Records Processing
Patient records, clinical trial reports, and medical literature synthesis benefit from Jamba's long context and strict grounding, which reduces the risk of hallucinated medical information.

### Insurance Claims Processing
Insurance documents — policies, claims, medical records, adjuster notes — can be loaded into a single context for comprehensive claim evaluation.

### Compliance and Audit
Regulatory compliance requires reviewing large volumes of documentation for specific requirements. Jamba's contextual answers endpoint can systematically check documents against compliance checklists.

---

## Pricing Summary (Early 2025)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Jamba 1.5 Large | $2.00 | $8.00 |
| Jamba 1.5 Mini | $0.20 | $0.40 |
| Contextual Answers | $0.02 per query | N/A |
| Summarize | $0.005 per request | N/A |
| Paraphrase | $0.005 per request | N/A |

Free tier: 10,000 API calls per month for evaluation.

### Cost Comparison for Long Documents

Processing a 200-page document (~100K tokens input, 2K output):

| Provider | Model | Cost per Document |
|---|---|---|
| AI21 | Jamba 1.5 Mini | $0.021 |
| AI21 | Jamba 1.5 Large | $0.216 |
| OpenAI | GPT-4o | $0.300 |
| Anthropic | Claude 3.5 Sonnet | $0.330 |
| OpenAI | GPT-4o-mini | $0.018 |

![AI21 Pricing Comparison](https://www.ai21.com/hubfs/ai21-pricing-comparison.png)

---

## Video Resources

1. [AI21 Labs — Jamba: The World's First Production-Grade SSM-Transformer Model (YouTube)](https://www.youtube.com/watch?v=7cXVfERkZ6Q)
2. [Understanding Mamba and State Space Models — Architecture Deep Dive (YouTube)](https://www.youtube.com/watch?v=8Q_tqwpTpVU)

---

## References

1. AI21 Labs Documentation — Jamba Models. [https://docs.ai21.com/docs/jamba-models](https://docs.ai21.com/docs/jamba-models)
2. AI21 Labs Pricing. [https://www.ai21.com/pricing](https://www.ai21.com/pricing)
3. Lieber, O. et al. (2024). "Jamba: A Hybrid Transformer-Mamba Language Model." arXiv:2403.19887. [https://arxiv.org/abs/2403.19887](https://arxiv.org/abs/2403.19887)
4. Gu, A. & Dao, T. (2023). "Mamba: Linear-Time Sequence Modeling with Selective State Spaces." arXiv:2312.00752. [https://arxiv.org/abs/2312.00752](https://arxiv.org/abs/2312.00752)
5. AI21 Labs Blog — Jamba 1.5: Setting New Standards for Open Models. [https://www.ai21.com/blog/jamba-1-5](https://www.ai21.com/blog/jamba-1-5)
