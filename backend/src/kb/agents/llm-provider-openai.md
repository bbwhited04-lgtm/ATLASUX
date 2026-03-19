# OpenAI — LLM Provider Profile

## Company Background

OpenAI was founded in December 2015 as a non-profit AI research laboratory by Sam Altman, Elon Musk, Greg Brockman, Ilya Sutskever, Wojciech Zaremba, and John Schulman, among others. The organization's stated mission is to ensure that artificial general intelligence (AGI) benefits all of humanity. In 2019, OpenAI transitioned to a "capped-profit" structure, creating OpenAI LP under the governance of the original non-profit board, allowing it to raise the capital necessary for large-scale AI research.

Sam Altman serves as CEO, with Mira Murati formerly serving as CTO before departing in late 2024. The company is headquartered in San Francisco, California. OpenAI has raised over $13 billion from Microsoft alone, making Microsoft its largest investor and strategic partner. Azure serves as OpenAI's exclusive cloud computing provider.

OpenAI's trajectory has been defined by a series of landmark releases: GPT-2 (2019), GPT-3 (2020), ChatGPT (November 2022), GPT-4 (March 2023), GPT-4o (May 2024), the o-series reasoning models (late 2024), and GPT-4.1 (April 2025). ChatGPT reached 100 million users within two months of launch, making it the fastest-growing consumer application in history at that time.

The company has expanded beyond text generation into image generation (DALL-E), speech recognition (Whisper), text-to-speech (TTS), and code generation (Codex). OpenAI operates both consumer products (ChatGPT, ChatGPT Plus, ChatGPT Enterprise) and developer APIs.

## Model Lineup

### GPT-4o (Omni)
- **Parameters:** Undisclosed (estimated ~200B)
- **Context Window:** 128,000 tokens
- **Training Data Cutoff:** October 2023
- **Release:** May 2024
- **Description:** OpenAI's flagship multimodal model. Accepts text, image, and audio inputs and produces text and audio outputs. Designed to be faster and cheaper than GPT-4 Turbo while matching its capabilities. Supports function calling, JSON mode, and vision.

### GPT-4.1
- **Parameters:** Undisclosed
- **Context Window:** 1,047,576 tokens (1M)
- **Release:** April 2025
- **Description:** Successor to GPT-4o optimized for coding, instruction following, and long-context tasks. Major improvements in agentic tool use, structured output reliability, and code generation. Available in three sizes: GPT-4.1, GPT-4.1 mini, and GPT-4.1 nano.

### GPT-4o-mini
- **Parameters:** Undisclosed (estimated ~8B)
- **Context Window:** 128,000 tokens
- **Release:** July 2024
- **Description:** Small, fast, and affordable model replacing GPT-3.5 Turbo. Outperforms GPT-3.5 Turbo on most benchmarks at a fraction of the cost. Supports vision and function calling.

### o1
- **Parameters:** Undisclosed
- **Context Window:** 200,000 tokens
- **Release:** December 2024 (full), September 2024 (preview)
- **Description:** OpenAI's first reasoning model. Uses chain-of-thought reasoning internally before producing responses. Excels at math, science, and complex multi-step problems. Reasoning tokens are consumed but not visible to the user.

### o3
- **Parameters:** Undisclosed
- **Context Window:** 200,000 tokens
- **Release:** April 2025
- **Description:** Third-generation reasoning model with significant improvements over o1. Features improved tool use, support for image inputs during reasoning, and configurable reasoning effort (low/medium/high). Achieves state-of-the-art on numerous benchmarks including ARC-AGI.

### o4-mini
- **Parameters:** Undisclosed
- **Context Window:** 200,000 tokens
- **Release:** April 2025
- **Description:** Compact reasoning model optimized for speed and cost while retaining strong reasoning capabilities. Best suited for math, coding, and science tasks where reasoning is required but budget is constrained.

### GPT-4.5
- **Parameters:** Undisclosed (reported to be very large)
- **Context Window:** 128,000 tokens
- **Release:** February 2025 (research preview)
- **Description:** Large-scale model focused on improved world knowledge, reduced hallucination, and better "EQ" (emotional intelligence). Research preview only. Very expensive to run. Designed as a testbed for scaling unsupervised learning.

## Pricing (per 1M tokens)

| Model | Input | Output | Cached Input |
|-------|-------|--------|--------------|
| GPT-4o | $2.50 | $10.00 | $1.25 |
| GPT-4.1 | $2.00 | $8.00 | $0.50 |
| GPT-4.1 mini | $0.40 | $1.60 | $0.10 |
| GPT-4.1 nano | $0.10 | $0.40 | $0.025 |
| GPT-4o-mini | $0.15 | $0.60 | $0.075 |
| o1 | $15.00 | $60.00 | $7.50 |
| o3 | $10.00 | $40.00 | $2.50 |
| o4-mini | $1.10 | $4.40 | $0.275 |
| GPT-4.5 | $75.00 | $150.00 | N/A |

*Note: Reasoning models (o1, o3, o4-mini) also consume internal reasoning tokens billed at the output rate.*

## Context Windows

- **GPT-4o / GPT-4o-mini:** 128K tokens input, 16K tokens max output
- **GPT-4.1 (all sizes):** ~1M tokens input, 32K tokens max output
- **o1 / o3 / o4-mini:** 200K tokens input, 100K tokens max output
- **GPT-4.5:** 128K tokens input, 16K tokens max output

## Key Capabilities

### Function Calling & Tool Use
OpenAI pioneered structured function calling in LLMs. Models can be given function definitions and will return structured JSON arguments to invoke them. This is the foundation for agentic workflows, plugins, and integrations. GPT-4.1 and o3 show significant improvements in multi-step tool use chains.

### Vision
GPT-4o, GPT-4.1, o3, and o4-mini accept image inputs. They can analyze charts, read handwriting, describe photographs, parse UI screenshots, and reason about visual content. Vision is included at no additional cost beyond token pricing.

### DALL-E 3 (Image Generation)
Available via API, DALL-E 3 generates images from text prompts with improved prompt following and text rendering. GPT-4o also has native image generation capabilities released in early 2025.

### Whisper (Speech Recognition)
Open-source speech-to-text model available via API. Supports 57 languages with automatic language detection. Pricing: $0.006 per minute.

### Text-to-Speech (TTS)
Six built-in voices with two quality levels (tts-1 for speed, tts-1-hd for quality). Pricing: $15.00 per 1M characters (standard), $30.00 per 1M characters (HD).

### Codex / Code Capabilities
All GPT-4-class models excel at code generation, debugging, and explanation. GPT-4.1 was specifically optimized for coding tasks with improved diff editing, test generation, and multi-file editing. The Codex agent product (released 2025) provides sandboxed code execution.

### Structured Outputs
Guaranteed JSON schema conformance. Models can be constrained to output valid JSON matching a provided schema with 100% reliability using the `response_format` parameter.

### Batch API
50% discount on API calls that can tolerate up to 24-hour latency. Useful for bulk processing, evaluation, and non-real-time workloads.

### Responses API
Released April 2025, the Responses API is the successor to the Chat Completions API. It adds built-in tool primitives (web search, file search, code execution), multi-turn conversation state management, and streaming improvements.

## Strengths

1. **Ecosystem maturity:** The largest LLM developer ecosystem. Extensive documentation, SDKs in every major language, thousands of tutorials, and a massive community. First-mover advantage means most AI tooling is built for OpenAI first.

2. **Reliability and uptime:** Enterprise-grade infrastructure backed by Azure. Consistent API performance with published status pages and SLAs for enterprise customers.

3. **Tool use and function calling:** Best-in-class structured tool use. Models reliably produce valid JSON for function calls, handle multi-step tool chains, and recover from tool errors. GPT-4.1 and o3 set benchmarks for agentic reliability.

4. **Breadth of modalities:** Text, vision, audio input, speech synthesis, image generation — all available through a unified API. No other provider matches this breadth.

5. **Enterprise features:** Content filtering, fine-tuning, distillation, stored completions, usage tracking, organization management, and SOC 2 Type 2 compliance.

## Weaknesses

1. **Cost at scale:** While pricing has decreased significantly, OpenAI remains more expensive than competitors like DeepSeek, Gemini Flash, or Mistral Small for high-volume workloads. Reasoning models (o1, o3) are especially expensive due to hidden reasoning token consumption.

2. **Closed source:** Model weights are not available. No self-hosting option. Customers are fully dependent on OpenAI's API availability, pricing decisions, and model deprecation schedule.

3. **Model deprecation:** OpenAI regularly deprecates older models with limited notice, forcing migrations. GPT-3.5 Turbo, GPT-4 Turbo, and earlier models have all been sunset or scheduled for sunset.

4. **Inconsistency across versions:** Model behavior can change between versions and even within the same version over time, making reproducibility challenging for production applications.

5. **Privacy concerns for some use cases:** Data may be used for model improvement unless opted out via API data usage policies. Enterprise API has stronger data protections, but this remains a concern for regulated industries.

## Best Use Cases

- **Agentic workflows:** Multi-step tool use, code generation, and autonomous task completion (GPT-4.1, o3)
- **Customer-facing chatbots:** Reliable, well-behaved conversational AI with content filtering (GPT-4o, GPT-4o-mini)
- **Complex reasoning:** Mathematical proofs, scientific analysis, legal reasoning (o1, o3)
- **Multimodal applications:** Vision + text analysis, document processing, image understanding (GPT-4o)
- **Cost-sensitive high-volume:** Classification, extraction, summarization (GPT-4o-mini, GPT-4.1 nano)
- **Enterprise integration:** Microsoft 365, Azure, Power Platform integration via Microsoft partnership

## Benchmark Performance

### GPT-4o
- MMLU: 88.7%
- HumanEval (coding): 90.2%
- GPQA (science): 53.6%
- MATH: 76.6%

### o3
- AIME 2025 (math competition): 96.7%
- GPQA Diamond (PhD-level science): 87.7%
- SWE-bench Verified (real-world coding): 69.1%
- ARC-AGI Semi-Private: 91.5%
- Codeforces (competitive programming): 2727 Elo

### GPT-4.1
- SWE-bench Verified: 54.6%
- Multi-step tool use (internal benchmark): 59.6% (vs GPT-4o's 45.8%)
- Long context recall (1M tokens): near-perfect on needle-in-haystack

### o4-mini
- AIME 2025: 93.4% (at medium compute)
- GPQA Diamond: 81.4%
- Codeforces: 2532 Elo

## API Features Summary

| Feature | Supported |
|---------|-----------|
| Streaming | Yes |
| Function/Tool Calling | Yes |
| Vision (Image Input) | Yes |
| Audio Input | Yes (GPT-4o) |
| Structured Outputs (JSON) | Yes |
| Fine-tuning | Yes (GPT-4o, GPT-4o-mini) |
| Batch Processing | Yes (50% discount) |
| Embeddings | Yes (text-embedding-3) |
| Content Moderation | Yes (built-in) |
| Rate Limits | Tier-based (1-5) |
| Prompt Caching | Automatic |
| Stored Completions | Yes |

## Integration Notes for Atlas UX

OpenAI is the primary AI provider for the Atlas UX platform. Configuration is managed via `OPENAI_API_KEY` in `backend/.env`. The AI provider setup lives in `backend/src/ai.ts`. GPT-4o-mini is used for cost-sensitive operations (classification, extraction), while GPT-4o handles complex conversational tasks. Reasoning models can be routed through the same API for decision-support workflows.

---

## Citations

1. OpenAI Platform Documentation — Models overview, pricing, and API reference.
   https://platform.openai.com/docs/models

2. OpenAI Pricing Page — Current per-token pricing for all models.
   https://openai.com/api/pricing/

3. OpenAI Research — GPT-4 Technical Report (March 2023).
   https://arxiv.org/abs/2303.08774

4. OpenAI Blog — Introducing GPT-4.1 and new developer tools (April 2025).
   https://openai.com/index/gpt-4-1/

5. OpenAI Blog — Introducing o3 and o4-mini reasoning models (April 2025).
   https://openai.com/index/introducing-o3-and-o4-mini/

## Images

![OpenAI Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1280px-OpenAI_Logo.svg.png)

![GPT-4 Architecture Overview](https://images.openai.com/blob/75d2b238-8f42-4e41-87f3-0a9d2e9a34e3/gpt-4-architecture.png)

![OpenAI API Dashboard](https://cdn.openai.com/API/docs/images/api-dashboard-overview.png)

![OpenAI Model Comparison](https://cdn.openai.com/research-covers/gpt-4/gpt-4-model-comparison.png)

![OpenAI Reasoning Model Flow](https://cdn.openai.com/API/images/reasoning-model-diagram.png)

## Videos

1. OpenAI DevDay 2024 — Full keynote covering API updates, model releases, and developer tools.
   https://www.youtube.com/watch?v=U9mJuUkhUzk

2. OpenAI — Introducing o3 and o4-mini: next-generation reasoning models.
   https://www.youtube.com/watch?v=0jBHgVjTJqo
