# LLM Deployment: From Cloud to Edge

## Overview

Deploying large language models in production is fundamentally different from prototyping with an API key. Production LLM deployment demands careful consideration of latency, cost, reliability, compliance, and scale. This article covers the full spectrum — from managed cloud services to self-hosted inference to edge deployment — with practical guidance on optimization, monitoring, and failover strategies.

Whether you are serving a single-tenant AI receptionist or a multi-tenant enterprise platform, the deployment architecture you choose will define your cost structure, latency profile, and operational burden for years to come.

---

## Cloud Deployment Platforms

### AWS Bedrock

Amazon Bedrock provides fully managed access to foundation models from Anthropic, Meta, Mistral, Cohere, and Amazon's own Titan family. Bedrock abstracts away all infrastructure — you send API requests and pay per token.

**Key capabilities:**

- **Model selection:** Claude (Anthropic), Llama 3 (Meta), Mistral Large, Command R+ (Cohere), Titan (Amazon)
- **Knowledge Bases:** Built-in RAG with S3 data sources, automatic chunking, and vector storage
- **Agents:** Multi-step task execution with tool use and guardrails
- **Fine-tuning:** Continued pre-training and instruction tuning on your data (model-dependent)
- **Provisioned Throughput:** Reserved capacity for predictable latency at scale
- **Guardrails:** Content filtering, PII redaction, and topic denial built into the API layer

**When to use Bedrock:**

- You are already on AWS and want minimal operational overhead
- You need SOC 2 / HIPAA / FedRAMP compliance with minimal paperwork
- You want to swap between model providers without changing your integration code
- You need built-in RAG without managing a vector database

**Limitations:**

- Model availability lags behind direct API access (new models may take weeks to appear)
- Provisioned Throughput requires commitment and can be expensive for bursty workloads
- Custom model hosting (bring your own weights) is limited compared to SageMaker

![AWS Bedrock Architecture showing the managed service layer between applications and foundation models](https://docs.aws.amazon.com/images/bedrock/latest/userguide/images/bedrock-architecture.png)

### Azure OpenAI Service

Azure OpenAI provides access to OpenAI models (GPT-4o, GPT-4 Turbo, o1, o3, DALL-E 3, Whisper) through Azure's enterprise infrastructure. It is the primary path for enterprises that need OpenAI models with Azure compliance certifications.

**Key capabilities:**

- **Private networking:** VNet integration, Private Link, no public internet exposure
- **Content Safety:** Built-in content filtering with configurable severity thresholds
- **Data residency:** Choose deployment region for data sovereignty requirements
- **PTU (Provisioned Throughput Units):** Reserved capacity with guaranteed latency
- **On Your Data:** Built-in RAG with Azure AI Search, Cosmos DB, or blob storage
- **Batch API:** Async processing at 50% cost reduction for non-latency-sensitive workloads

**When to use Azure OpenAI:**

- Enterprise with existing Azure EA (Enterprise Agreement)
- Need OpenAI models with HIPAA BAA, SOC 2 Type II, or government cloud (Azure Gov)
- Require private networking and data residency guarantees
- Want managed content safety and abuse monitoring

**Limitations:**

- Model availability can lag behind OpenAI's direct API by days to weeks
- PTU pricing requires capacity planning and commitment
- Quotas and rate limits are per-region and can be restrictive initially

### GCP Vertex AI

Google's Vertex AI provides access to Gemini models alongside a comprehensive MLOps platform for custom model training, deployment, and monitoring.

**Key capabilities:**

- **Gemini models:** Gemini 2.0 Flash, Gemini 2.0 Pro, Gemini Ultra with native multimodal support
- **Model Garden:** 200+ models including open-source (Llama 3, Mistral, Falcon) deployable with one click
- **Grounding:** Connect Gemini to Google Search or your own data for factual responses
- **Extensions:** Built-in integrations with Google Workspace, code execution, and custom APIs
- **Evaluation Service:** Automated model evaluation with customizable metrics
- **Tuning:** Supervised fine-tuning and RLHF for Gemini and PaLM models

**When to use Vertex AI:**

- Building on GCP with existing billing and IAM
- Need native multimodal capabilities (image, video, audio understanding)
- Want access to both proprietary (Gemini) and open-source models in one platform
- Need integrated MLOps (training, evaluation, monitoring) alongside inference

![GCP Vertex AI Model Garden showing available foundation models for deployment](https://cloud.google.com/static/vertex-ai/docs/images/model-garden-explore.png)

---

## Self-Hosted Deployment

Self-hosting gives you full control over model weights, infrastructure, and data flow. The tradeoff is operational complexity — you own the GPUs, the serving stack, and the on-call rotation.

### vLLM

vLLM is the de facto standard for high-throughput LLM inference serving. Originally developed at UC Berkeley, it introduced PagedAttention for efficient KV cache management.

**Key features:**

- **PagedAttention:** Manages KV cache memory like virtual memory pages, reducing waste by up to 4x
- **Continuous batching:** Dynamically adds/removes requests from batches without waiting for completion
- **Tensor parallelism:** Split models across multiple GPUs seamlessly
- **OpenAI-compatible API:** Drop-in replacement for OpenAI API calls
- **Quantization support:** GPTQ, AWQ, FP8, INT8 inference
- **Speculative decoding:** Use a small draft model to speed up large model inference
- **Prefix caching:** Cache common prompt prefixes across requests

```bash
# Basic vLLM server launch
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3.1-70B-Instruct \
  --tensor-parallel-size 4 \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.9
```

**Production considerations:**

- Requires NVIDIA GPUs (A100, H100, or L40S recommended for 70B+ models)
- Memory requirements: ~140GB VRAM for 70B FP16, ~70GB for 70B INT8, ~35GB for 70B INT4
- Use Ray for multi-node serving when a single machine lacks sufficient VRAM
- Monitor GPU utilization, queue depth, and time-to-first-token (TTFT) metrics

### Text Generation Inference (TGI)

Hugging Face's TGI is a production-ready inference server written in Rust with a Python model layer.

**Key features:**

- **Flash Attention 2:** Optimized attention implementation for faster inference
- **Watermarking:** Built-in text watermarking for generated content
- **Grammar-constrained generation:** Force outputs to conform to JSON schemas or regex patterns
- **Token streaming:** Server-sent events for real-time token delivery
- **Multi-LoRA:** Serve multiple LoRA adapters from a single base model

```bash
# TGI Docker deployment
docker run --gpus all \
  -p 8080:80 \
  -v /data:/data \
  ghcr.io/huggingface/text-generation-inference:latest \
  --model-id meta-llama/Llama-3.1-8B-Instruct \
  --quantize gptq \
  --max-input-length 4096 \
  --max-total-tokens 8192
```

### Ollama

Ollama is designed for simplicity — it is the "Docker for LLMs" that makes local model serving trivially easy.

**Key features:**

- **One-command install:** `curl -fsSL https://ollama.com/install.sh | sh`
- **Model library:** Pull models like Docker images: `ollama pull llama3.1`
- **Modelfile:** Dockerfile-like configuration for custom model setups
- **REST API:** Simple HTTP API compatible with many client libraries
- **GPU auto-detection:** Automatically uses available NVIDIA, AMD, or Apple Silicon GPUs

**Best for:**

- Development and testing environments
- Small-scale production (single-user or low-throughput)
- Edge deployment on machines with modest hardware
- Rapid prototyping without cloud API costs

**Not recommended for:**

- High-throughput production serving (lacks continuous batching optimizations)
- Multi-GPU serving across nodes
- Workloads requiring fine-grained performance tuning

### llama.cpp

llama.cpp is the foundational C/C++ inference engine that powers much of the local LLM ecosystem, including Ollama, LM Studio, and many mobile LLM apps.

**Key features:**

- **CPU inference:** Runs on any machine, no GPU required (AVX2, AVX-512, ARM NEON optimized)
- **GGUF format:** Universal quantized model format with metadata
- **Quantization options:** Q2_K through Q8_0, with dozens of precision/speed tradeoffs
- **Metal support:** Native Apple Silicon GPU acceleration
- **CUDA/Vulkan:** GPU acceleration on NVIDIA and AMD
- **Server mode:** Built-in HTTP server with OpenAI-compatible API

```bash
# Build and serve with llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make -j
./llama-server \
  -m models/llama-3.1-8b-instruct-q4_k_m.gguf \
  --host 0.0.0.0 --port 8080 \
  -c 4096 -ngl 99
```

![Comparison of LLM inference frameworks showing throughput and latency benchmarks](https://raw.githubusercontent.com/vllm-project/vllm/main/docs/source/assets/logos/vllm-logo-text-light.png)

---

## Edge Deployment and Quantization

### Why Edge Deployment?

Edge deployment runs models directly on user devices or local servers, eliminating network latency and keeping data entirely private. This matters for:

- **Latency-critical applications:** Real-time voice assistants, in-game AI, industrial control
- **Offline scenarios:** Field workers, aircraft, submarines, areas with poor connectivity
- **Data sovereignty:** Medical records, legal documents, classified information
- **Cost elimination:** No per-token charges once the model is deployed

### Quantization Formats

Quantization reduces model precision from FP16/BF16 (16-bit) to lower bit widths, dramatically reducing memory requirements and increasing inference speed.

**GGUF (GPT-Generated Unified Format):**

- Standard format for llama.cpp ecosystem
- Supports Q2_K through Q8_0 quantization levels
- Self-contained with tokenizer and metadata embedded
- Best for: CPU inference, single-GPU setups, edge devices

| Quant Level | Bits | ~Size (7B) | Quality Impact |
|-------------|------|------------|----------------|
| Q2_K        | 2.5  | ~2.7 GB    | Significant degradation |
| Q4_K_M      | 4.8  | ~4.1 GB    | Minimal quality loss |
| Q5_K_M      | 5.7  | ~4.8 GB    | Near-FP16 quality |
| Q6_K        | 6.6  | ~5.5 GB    | Negligible quality loss |
| Q8_0        | 8.5  | ~7.2 GB    | Virtually lossless |

**GPTQ (GPT Quantization):**

- Post-training quantization using calibration data
- Primarily 4-bit and 8-bit variants
- GPU-optimized — requires CUDA for efficient inference
- Supported by vLLM, TGI, and AutoGPTQ
- Best for: GPU-based serving with high throughput requirements

**AWQ (Activation-Aware Weight Quantization):**

- Identifies and preserves "salient" weight channels that disproportionately affect quality
- Generally better quality than GPTQ at the same bit width
- Faster inference than GPTQ on modern GPUs
- Supported by vLLM and TGI
- Best for: Production GPU serving where quality matters most

**EXL2 (ExLlamaV2):**

- Variable bit-width quantization (can mix 2-bit and 6-bit within a model)
- Extremely fast CUDA kernels
- Best for: Maximum throughput on NVIDIA GPUs with quality control

![Quantization quality comparison chart showing perplexity vs model size across different quantization methods](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Comparison_of_1-bit_2-bit_4-bit_and_8-bit_unsigned_integers.svg/800px-Comparison_of_1-bit_2-bit_4-bit_and_8-bit_unsigned_integers.svg.png)

### Mobile and Browser Deployment

- **MLC LLM:** Runs models on iOS, Android, and in browsers via WebGPU
- **MediaPipe LLM Inference API:** Google's on-device LLM framework for mobile
- **WebLLM:** Browser-based inference using WebGPU acceleration
- **ONNX Runtime:** Cross-platform inference with broad hardware support

---

## API-Based vs Self-Hosted Tradeoffs

| Factor | API-Based | Self-Hosted |
|--------|-----------|-------------|
| **Upfront cost** | Zero | $10K–$500K+ for GPUs |
| **Per-token cost** | $0.15–$60 / 1M tokens | Amortized hardware cost |
| **Latency** | 200–2000ms TTFT | 50–500ms TTFT |
| **Data privacy** | Depends on provider DPA | Full control |
| **Operational burden** | Near zero | Significant (GPUs, drivers, monitoring) |
| **Model selection** | Limited to provider catalog | Any open-weight model |
| **Scaling** | Automatic | Manual (more GPUs, more nodes) |
| **Customization** | Fine-tuning via API (limited) | Full control (LoRA, full fine-tune, RLHF) |
| **Reliability** | Provider SLA (99.9%+) | Your responsibility |
| **Compliance** | Provider certifications | Your audit scope |

**Recommendation by stage:**

- **MVP / Startup:** Use API-based. Speed to market matters more than cost optimization.
- **Growth (>$5K/mo LLM spend):** Evaluate self-hosted for high-volume, predictable workloads.
- **Enterprise (>$50K/mo):** Hybrid — API for peaks and experimentation, self-hosted for stable workloads.

---

## Latency Optimization

### Time-to-First-Token (TTFT)

TTFT is the most important latency metric for user-facing applications. Users perceive the system as "thinking" until the first token appears.

**Optimization strategies:**

1. **Prefix caching:** Cache the KV states for common system prompts. If every request starts with the same 2,000-token system prompt, caching saves the prefill computation on subsequent requests. vLLM and SGLang support this natively.

2. **Prompt compression:** Use techniques like LLMLingua to compress prompts by 2–5x without significant quality loss. Fewer input tokens = faster prefill.

3. **Speculative decoding:** Use a small "draft" model (e.g., 1B parameters) to propose tokens, then verify with the large model in parallel. Can improve throughput 2–3x for long generations.

4. **Model parallelism:** Split the model across GPUs to reduce per-GPU computation. Tensor parallelism for latency, pipeline parallelism for throughput.

### Batching Strategies

- **Static batching:** Wait for N requests, process together. Simple but adds queuing latency.
- **Continuous batching:** Add new requests to in-progress batches dynamically. Used by vLLM and TGI. Best for production.
- **Chunked prefill:** Process prefill in chunks interleaved with decode steps, preventing long prompts from blocking short requests.

### KV Cache Management

The KV cache stores attention key-value pairs for all processed tokens. For a 70B model with 80 layers and 8,192 context length, the KV cache alone requires ~40GB of VRAM per concurrent request.

**Optimization strategies:**

- **PagedAttention (vLLM):** Allocates KV cache in non-contiguous blocks, reducing memory waste from 60–80% to <4%
- **Multi-Query Attention (MQA):** Models using MQA (e.g., Falcon) have inherently smaller KV caches
- **Grouped-Query Attention (GQA):** Llama 3 uses GQA — a middle ground between MHA and MQA
- **Sliding window attention:** Mistral models use a 4,096-token sliding window, bounding KV cache size

---

## Cost Optimization Strategies

### 1. Right-Size Your Model

Do not default to the largest model. For many tasks, a well-prompted 8B model outperforms a lazy-prompted 70B model.

- **Classification, extraction, routing:** 8B models (Llama 3.1 8B, Mistral 7B)
- **Summarization, Q&A, chat:** 70B models or mid-tier APIs (GPT-4o-mini, Claude Haiku)
- **Complex reasoning, code generation:** Frontier models (GPT-4o, Claude Sonnet, Gemini Pro)

### 2. Caching

- **Semantic caching:** Hash similar queries to return cached responses. Tools: GPTCache, Redis with vector similarity.
- **Exact caching:** Cache identical prompt+parameter combinations. Simple and effective for repetitive workloads.
- **Prefix caching:** Reuse KV cache for shared prompt prefixes (system prompts, few-shot examples).

### 3. Prompt Optimization

- Remove unnecessary context, examples, and formatting instructions
- Use structured prompts that minimize token count
- Move static context to fine-tuning when possible

### 4. Batch Processing

For non-latency-sensitive workloads (analytics, content generation, data processing):

- OpenAI Batch API: 50% cost reduction, 24-hour SLA
- Self-hosted: Fill GPU utilization with background jobs during off-peak hours

### 5. Spot/Preemptible Instances

- AWS Spot Instances: Up to 90% savings on GPU compute
- GCP Preemptible VMs: Similar savings with 24-hour maximum lifetime
- Requires checkpointing and graceful preemption handling

---

## Monitoring and Observability

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| TTFT | Time to first token | <500ms for chat |
| TPS | Tokens per second (decode) | >30 TPS per request |
| Queue depth | Pending requests | <10 for interactive |
| GPU utilization | Compute usage | 70–90% (below 70% = oversized) |
| KV cache utilization | Memory usage | <95% |
| Error rate | Failed requests | <0.1% |
| P99 latency | Tail latency | <3x median |

### Observability Stack

- **LangSmith:** End-to-end LLM tracing from LangChain. Tracks prompts, completions, latency, cost, and user feedback.
- **Weights & Biases (W&B):** Experiment tracking, prompt versioning, and evaluation dashboards.
- **OpenTelemetry:** Standard tracing for distributed LLM pipelines. Instrument each step: retrieval, prompt construction, inference, post-processing.
- **Prometheus + Grafana:** Infrastructure metrics (GPU utilization, memory, queue depth). vLLM exposes Prometheus metrics natively.
- **Helicone:** API proxy that logs all LLM calls with cost tracking, caching, and rate limiting.

![Grafana dashboard showing LLM inference metrics including GPU utilization, latency percentiles, and throughput](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Grafana_logo.svg/1200px-Grafana_logo.svg.png)

---

## Model Versioning and A/B Testing

### Why Version Models?

LLM providers update models without notice. A prompt that works perfectly on GPT-4-0613 may behave differently on GPT-4-0125. Self-hosted models need version pinning too — a new quantization or merge can change behavior.

**Versioning strategies:**

1. **Pin model versions:** Always specify exact model identifiers (e.g., `gpt-4o-2024-08-06`, not `gpt-4o`)
2. **Version prompts alongside models:** A prompt is only valid for the model it was tested against
3. **Snapshot evaluations:** Run your eval suite against each new model version before promoting to production
4. **Canary deployments:** Route 5–10% of traffic to new model versions, monitor quality metrics

### A/B Testing LLMs

A/B testing LLMs is harder than testing UI changes because:

- Output quality is subjective and hard to measure automatically
- Small prompt changes can have outsized effects
- Statistical significance requires large sample sizes for open-ended generation

**Practical approach:**

1. Define measurable quality criteria (accuracy, format compliance, user satisfaction)
2. Use LLM-as-judge for automated evaluation at scale
3. Supplement with human evaluation for high-stakes decisions
4. Track both quality AND cost metrics — a cheaper model that is 95% as good may be the right choice

---

## Failover and Multi-Provider Strategies

### Why Multi-Provider?

No single LLM provider offers 100% uptime. OpenAI has had multiple major outages. Anthropic, Google, and Azure have all experienced downtime. A production system needs fallback options.

**Failover patterns:**

1. **Primary-secondary:** Route all traffic to Provider A. On failure (timeout, 5xx, rate limit), fall back to Provider B. Simple and effective.

2. **Load balancing:** Distribute traffic across providers based on cost, latency, or quality. Route easy tasks to cheaper models, hard tasks to frontier models.

3. **Hedged requests:** Send the same request to multiple providers simultaneously, return the first response. Expensive but eliminates tail latency.

4. **Circuit breaker:** Track error rates per provider. When errors exceed a threshold, "open" the circuit and stop sending requests for a cooldown period.

```typescript
// Example: Multi-provider failover with circuit breaker
const providers = [
  { name: 'openai', model: 'gpt-4o', priority: 1, circuit: 'closed' },
  { name: 'anthropic', model: 'claude-sonnet-4-20250514', priority: 2, circuit: 'closed' },
  { name: 'deepseek', model: 'deepseek-chat', priority: 3, circuit: 'closed' },
];

async function llmRequest(prompt: string) {
  const available = providers
    .filter(p => p.circuit === 'closed')
    .sort((a, b) => a.priority - b.priority);

  for (const provider of available) {
    try {
      return await callProvider(provider, prompt);
    } catch (err) {
      provider.errorCount++;
      if (provider.errorCount > 5) {
        provider.circuit = 'open';
        setTimeout(() => { provider.circuit = 'closed'; provider.errorCount = 0; }, 60000);
      }
    }
  }
  throw new Error('All LLM providers unavailable');
}
```

### Router/Gateway Solutions

- **LiteLLM:** Open-source proxy that provides a unified API across 100+ LLM providers with automatic failover, load balancing, and cost tracking
- **Portkey:** Commercial AI gateway with caching, fallbacks, load balancing, and observability
- **Martian:** Intelligent model router that selects the best model for each request based on quality and cost

![LLM gateway architecture showing request routing across multiple model providers](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Load_balancing_%28computing%29.svg/800px-Load_balancing_%28computing%29.svg.png)

---

## Deployment Checklist

Before going to production, verify:

- [ ] Model version is pinned (not using "latest" or floating aliases)
- [ ] Rate limiting is configured (per-user and global)
- [ ] Request timeouts are set (30s default, adjust per use case)
- [ ] Error handling covers: rate limits, timeouts, context overflow, malformed responses
- [ ] Monitoring dashboards are live (latency, throughput, error rate, cost)
- [ ] Alerting is configured (P99 latency spikes, error rate > threshold, cost anomalies)
- [ ] Failover provider is configured and tested
- [ ] Cost budget alerts are set (daily and monthly caps)
- [ ] PII/sensitive data handling is documented and enforced
- [ ] Load testing has been performed at 2x expected peak traffic
- [ ] Prompt injection defenses are in place
- [ ] Output validation/filtering is active for user-facing responses

---

## Video Resources

1. [LLM Inference Performance Engineering — Best Practices](https://www.youtube.com/watch?v=0doWAOf2Lz0) — Stanford MLSys Seminars. Deep dive into inference optimization covering KV cache, batching strategies, and hardware selection for production LLM serving.

2. [Deploy LLMs Like a Pro: vLLM, TGI, and Beyond](https://www.youtube.com/watch?v=qBcYKQF0eOY) — Weights & Biases walkthrough of production LLM deployment frameworks, benchmarking methodology, and real-world performance comparisons.

---

## References

[1] Kwon, W., et al. "Efficient Memory Management for Large Language Model Serving with PagedAttention." *Proceedings of the ACM SIGOPS 29th Symposium on Operating Systems Principles*, 2023. https://arxiv.org/abs/2309.06180

[2] Amazon Web Services. "Amazon Bedrock Documentation — Foundation Models as a Service." AWS, 2024. https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html

[3] Dettmers, T., et al. "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers." *ICLR 2023*. https://arxiv.org/abs/2210.17323

[4] Lin, J., et al. "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration." *MLSys 2024*. https://arxiv.org/abs/2306.00978

[5] Hugging Face. "Text Generation Inference: A Rust, Python, and gRPC Server for Text Generation Models." Hugging Face, 2024. https://huggingface.co/docs/text-generation-inference/index
