# Anthropic — LLM Provider Profile

## Company Background

Anthropic was founded in 2021 by Dario Amodei (CEO) and Daniela Amodei (President), along with several other former OpenAI researchers including Tom Brown, Chris Olah, Sam McCandlish, Jack Clark, and Jared Kaplan. The founding team departed OpenAI due to differences in approach to AI safety and governance. Anthropic is headquartered in San Francisco, California.

The company positions itself as an AI safety company first, with commercial products funding its safety research. Anthropic's core research contribution is Constitutional AI (CAI), a training methodology where AI systems are guided by a set of written principles (a "constitution") rather than purely by human feedback. This approach aims to make models helpful, harmless, and honest without requiring as much human labeling of harmful content.

Anthropic has raised over $7 billion in funding, with major investments from Google ($2 billion), Amazon ($4 billion), and Salesforce. Amazon Web Services is Anthropic's primary cloud partner, and Claude models are available on Amazon Bedrock. The company is structured as a Public Benefit Corporation.

The Claude model family is Anthropic's flagship product line. Key releases include Claude 1 (March 2023), Claude 2 (July 2023), Claude 3 family (March 2024 — Haiku, Sonnet, Opus), Claude 3.5 Sonnet (June 2024, updated October 2024), Claude 4 Sonnet and Claude 4 Opus (2025), and the current Claude 4.5 and 4.6 generations. Claude is available through the Anthropic API, Amazon Bedrock, Google Cloud Vertex AI, and the consumer-facing claude.ai product.

Anthropic also developed the Model Context Protocol (MCP), an open standard for connecting AI models to external tools and data sources, released in late 2024. MCP has seen rapid adoption across the AI industry.

## Model Lineup

### Claude 4.6 Opus
- **Parameters:** Undisclosed
- **Context Window:** 200,000 tokens
- **Max Output:** 32,000 tokens (standard), up to 128K with extended output
- **Release:** 2025
- **Description:** Anthropic's most capable model. Designed for complex analysis, multi-step reasoning, advanced mathematics, coding, and research tasks. Features extended thinking capability for transparent chain-of-thought reasoning. Best suited for tasks requiring deep understanding, nuanced judgment, and high-stakes accuracy.

### Claude 4.6 Sonnet
- **Parameters:** Undisclosed
- **Context Window:** 200,000 tokens
- **Max Output:** 16,000 tokens (standard)
- **Release:** 2025
- **Description:** The balanced workhorse model combining strong performance with reasonable cost. Excellent for coding, analysis, writing, and tool use. The most popular Claude model by API volume. Offers the best price-to-performance ratio for most production workloads.

### Claude 4.5 Haiku
- **Parameters:** Undisclosed
- **Context Window:** 200,000 tokens
- **Max Output:** 8,192 tokens
- **Release:** 2025
- **Description:** The fastest and most affordable Claude model. Designed for high-throughput, latency-sensitive applications like classification, extraction, routing, and real-time chat. Despite its smaller size, Haiku 4.5 outperforms many competitors' flagship models on key benchmarks.

## Pricing (per 1M tokens)

| Model | Input | Output | Cached Input | Batch Input | Batch Output |
|-------|-------|--------|--------------|-------------|--------------|
| Claude Opus 4.6 | $15.00 | $75.00 | $3.75 | $7.50 | $37.50 |
| Claude Sonnet 4.6 | $3.00 | $15.00 | $0.75 | $1.50 | $7.50 |
| Claude Haiku 4.5 | $0.80 | $4.00 | $0.08 | $0.40 | $2.00 |

*Extended thinking tokens (for Opus and Sonnet) are billed at the output token rate.*

## Context Windows

All current Claude models share a 200,000 token context window. This is approximately 150,000 words or 500 pages of text. Claude processes the full context window with high fidelity — Anthropic's "needle in a haystack" evaluations show near-perfect retrieval across the entire 200K window.

- **Input:** 200K tokens (all models)
- **Standard Output:** 8K-32K tokens depending on model
- **Extended Output:** Up to 128K tokens (Opus)

## Key Capabilities

### Extended Thinking
Claude Opus 4.6 and Sonnet 4.6 support extended thinking, where the model explicitly shows its reasoning process in a dedicated thinking block. This is distinct from hidden chain-of-thought used by some competitors — Claude's thinking is visible and inspectable. Extended thinking can use a configurable budget of tokens, allowing users to trade cost for reasoning depth.

### Tool Use (Function Calling)
Claude supports structured tool use with JSON schema definitions. The model can chain multiple tool calls, handle errors gracefully, and reason about which tools to use. Tool use is available across all Claude models.

### Model Context Protocol (MCP)
Anthropic created and open-sourced MCP, a standardized protocol for connecting LLMs to external data sources and tools. MCP provides a universal interface so AI applications can connect to any MCP-compatible server (databases, APIs, file systems, etc.) through a single protocol. MCP has been adopted by major IDE makers and AI tool providers.

### Computer Use
Claude can interact with computer interfaces by viewing screenshots and generating mouse/keyboard actions. This enables automation of desktop and web applications. Available in beta, computer use allows Claude to navigate GUIs, fill forms, click buttons, and complete multi-step workflows.

### Vision
All Claude models accept image inputs (PNG, JPEG, GIF, WebP). Claude can analyze charts, read documents, describe images, extract data from screenshots, and reason about visual content. No additional cost beyond token pricing for image understanding.

### Prompt Caching
Anthropic offers automatic and explicit prompt caching. Cached input tokens (system prompts, large documents, tool definitions) are charged at a 75% discount on subsequent requests. Cache TTL is 5 minutes by default, extended with usage.

### Batch API
50% discount for non-real-time workloads. Batch requests are processed within 24 hours. Ideal for evaluation, data processing, and bulk analysis.

### Citations
Claude can provide precise citations back to source documents, indicating exactly which parts of the input context support its claims. This feature is critical for RAG (retrieval-augmented generation) applications.

## Constitutional AI Approach

Anthropic's Constitutional AI (CAI) is a two-phase training process:

1. **Supervised phase:** The model generates responses, then critiques and revises its own responses according to a set of written principles (the "constitution"). These self-revised responses form the training data.

2. **RL phase:** Instead of human labelers ranking outputs for harmlessness, an AI model trained on the constitution provides the preference signal for reinforcement learning from AI feedback (RLAIF).

The constitution includes principles drawn from the UN Declaration of Human Rights, Apple's terms of service (for non-harmful content), and Anthropic's own research on AI safety. This approach scales better than pure RLHF because it reduces the need for human labelers to evaluate potentially harmful content.

## Strengths

1. **Safety and alignment:** Claude is consistently rated as one of the safest and most well-aligned AI models. It follows instructions precisely, respects boundaries, and maintains helpful behavior without being easily manipulated. Constitutional AI provides a principled framework for alignment.

2. **Long context fidelity:** Claude processes its full 200K context window with high recall. Unlike some competitors where performance degrades in the middle of long contexts, Claude maintains consistent attention across the entire window. This makes it excellent for document analysis, codebase understanding, and research synthesis.

3. **Coding excellence:** Claude models, particularly Sonnet and Opus, consistently rank at or near the top of coding benchmarks (SWE-bench, HumanEval, etc.). Claude excels at understanding large codebases, generating correct implementations, debugging, and producing clean diffs.

4. **Instruction following:** Claude is known for precise adherence to complex, multi-constraint instructions. It handles system prompts with many rules reliably, making it ideal for production applications with specific behavioral requirements.

5. **Transparency via extended thinking:** The ability to inspect Claude's reasoning process (not just see the final answer) allows developers to debug, validate, and trust model outputs for high-stakes applications.

## Weaknesses

1. **No image generation:** Anthropic does not offer any image generation capabilities. Applications requiring visual content creation must integrate a separate provider (DALL-E, Midjourney, Stable Diffusion, etc.).

2. **No text-to-speech or speech recognition:** Claude is text-and-image only for input and text-only for output. Voice applications require integration with external speech services (ElevenLabs, Whisper, etc.).

3. **Smaller ecosystem than OpenAI:** While growing rapidly, Anthropic's developer ecosystem, third-party tooling, and tutorial availability are smaller than OpenAI's. Many AI libraries and frameworks support OpenAI first.

4. **Cost for Opus tier:** Claude Opus 4.6 at $15/$75 per million tokens is expensive for high-volume production use. Most cost-sensitive applications use Sonnet or Haiku, but tasks requiring Opus-level capability come with significant cost.

5. **Rate limits:** API rate limits, particularly for newer and larger models, can constrain high-throughput applications. Enterprise tier provides higher limits but requires sales engagement.

## Best Use Cases

- **Complex code generation and review:** Multi-file code changes, codebase analysis, pull request review, architectural planning (Opus, Sonnet)
- **Document analysis and research:** Processing long documents, contracts, research papers with citation support (all models)
- **AI agents and tool use:** Multi-step autonomous workflows with tool integration via MCP (Sonnet, Opus)
- **Safety-critical applications:** Healthcare, legal, financial, and educational contexts where reliable, safe behavior is paramount (all models)
- **High-volume classification and extraction:** Routing, tagging, data extraction from unstructured text (Haiku)
- **Extended reasoning tasks:** Mathematics, logic, scientific analysis with transparent thinking (Opus with extended thinking)

## Benchmark Performance

### Claude Opus 4.6
- GPQA Diamond (PhD-level science): ~75%+
- SWE-bench Verified (real-world coding): ~65%+
- MMLU: ~89%+
- MATH: ~80%+
- Extended thinking mode significantly improves performance on reasoning-heavy tasks

### Claude Sonnet 4.6
- SWE-bench Verified: ~55-60%
- HumanEval (coding): ~93%
- MMLU: ~88%
- Strong agentic tool use and instruction following

### Claude Haiku 4.5
- MMLU: ~85%
- HumanEval: ~88%
- Competitive with larger models from other providers at much lower cost and latency

## API Features Summary

| Feature | Supported |
|---------|-----------|
| Streaming | Yes |
| Tool/Function Calling | Yes |
| Vision (Image Input) | Yes |
| Audio Input | No |
| Image Generation | No |
| Text-to-Speech | No |
| Structured Outputs (JSON) | Yes |
| Extended Thinking | Yes (Opus, Sonnet) |
| Fine-tuning | Limited (enterprise) |
| Batch Processing | Yes (50% discount) |
| Embeddings | No (use Voyage AI) |
| Prompt Caching | Yes (75% discount) |
| Citations | Yes |
| Computer Use | Yes (beta) |
| MCP Support | Yes (native) |

## Integration Notes for Atlas UX

Anthropic is configured via `ANTHROPIC_API_KEY` in `backend/.env`. The AI provider setup lives in `backend/src/ai.ts`. Claude Sonnet is used for the primary AI orchestration engine and agent reasoning. Claude Haiku handles high-volume tasks like classification and extraction. The platform leverages Claude's tool use capabilities for the agentic workflow system and decision memo generation.

---

## Citations

1. Anthropic — Claude Model Documentation and API Reference.
   https://docs.anthropic.com/en/docs/about-claude/models

2. Anthropic Research — Constitutional AI: Harmlessness from AI Feedback (2022).
   https://arxiv.org/abs/2212.08073

3. Anthropic — Model Context Protocol (MCP) Specification and Documentation.
   https://modelcontextprotocol.io/introduction

4. Anthropic Pricing Page — Current per-token pricing for all Claude models.
   https://www.anthropic.com/pricing

5. Anthropic Research — The Claude Model Card and System Prompt documentation.
   https://docs.anthropic.com/en/docs/about-claude/model-card

## Images

![Anthropic Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/1280px-Anthropic_logo.svg.png)

![Claude Constitutional AI Training Process](https://www-cdn.anthropic.com/images/research/constitutional-ai-diagram.png)

![Claude Model Family Comparison](https://www-cdn.anthropic.com/images/product/claude-model-comparison-chart.png)

![MCP Architecture Diagram](https://modelcontextprotocol.io/images/mcp-architecture-diagram.png)

![Claude Extended Thinking Flow](https://docs.anthropic.com/images/extended-thinking-overview.png)

## Videos

1. Anthropic — Claude 4 Opus and Sonnet: Capabilities, benchmarks, and safety overview.
   https://www.youtube.com/watch?v=jMRpEgYJk4M

2. Anthropic — Model Context Protocol (MCP): Building connected AI applications.
   https://www.youtube.com/watch?v=kQmXtrmQ5Zg
