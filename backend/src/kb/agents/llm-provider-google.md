# Google (Gemini) — LLM Provider Profile

## Company Background

Google's AI efforts are centralized under Google DeepMind, formed in April 2023 by merging Google Brain and DeepMind. Google Brain was founded in 2011 by Andrew Ng and Jeff Dean as a deep learning research project within Google. DeepMind was founded in 2010 in London by Demis Hassabis, Shane Legg, and Mustafa Suleyman, and acquired by Google in 2014 for approximately $500 million. Demis Hassabis serves as CEO of Google DeepMind.

Google has been a foundational contributor to modern AI. The Transformer architecture — the basis for virtually all modern LLMs — was invented at Google Brain and published in the landmark 2017 paper "Attention Is All You Need." Google also pioneered BERT, T5, PaLM, and numerous other foundational models before launching the Gemini family.

The Gemini model family was announced in December 2023 as Google's answer to GPT-4. Gemini was designed from the ground up as a natively multimodal model, trained on text, images, audio, video, and code simultaneously (rather than combining separate text and vision models). The family includes Ultra, Pro, Flash, and Nano tiers.

Google offers Gemini models through multiple channels: the Gemini API (via Google AI Studio), Google Cloud Vertex AI (for enterprise), the Gemini consumer app (formerly Bard), and integrated into Google Workspace, Android, and Chrome. Google's AI infrastructure advantage is significant — the company designs custom TPU (Tensor Processing Unit) chips specifically for AI training and inference.

## Model Lineup

### Gemini 2.5 Pro
- **Parameters:** Undisclosed
- **Context Window:** 1,000,000 tokens
- **Max Output:** 65,536 tokens
- **Release:** March 2025
- **Description:** Google's most capable model with native thinking capabilities. Features a hybrid reasoning approach where the model can automatically decide when to use extended thinking. Excels at complex coding, mathematics, scientific reasoning, and multimodal analysis. Supports text, image, audio, and video inputs natively.

### Gemini 2.5 Flash
- **Parameters:** Undisclosed
- **Context Window:** 1,000,000 tokens
- **Max Output:** 65,536 tokens
- **Release:** 2025
- **Description:** Fast, cost-efficient model with thinking capabilities. Designed for high-throughput production workloads that benefit from reasoning but need lower latency and cost than Pro. Features a configurable thinking budget allowing users to control the cost-performance tradeoff.

### Gemini 2.0 Flash
- **Parameters:** Undisclosed
- **Context Window:** 1,000,000 tokens
- **Max Output:** 8,192 tokens
- **Release:** February 2025
- **Description:** Previous generation Flash model optimized for speed and cost. Supports multimodal inputs and native tool use. Includes experimental variants for image generation and live streaming (multimodal live API).

### Gemini 2.0 Flash-Lite
- **Parameters:** Undisclosed
- **Context Window:** 1,000,000 tokens
- **Max Output:** 8,192 tokens
- **Release:** February 2025
- **Description:** The most cost-effective Gemini model. Designed as a drop-in replacement for Gemini 1.5 Flash-8B with improved quality. Ideal for high-volume, cost-sensitive tasks.

### Gemini 1.5 Pro / Flash (Legacy)
- **Description:** Previous generation models still available but being superseded by the 2.x family. Gemini 1.5 Pro was notable for introducing the 1M token context window.

## Pricing (per 1M tokens)

### Gemini 2.5 Pro

| Tier | Input | Output (non-thinking) | Thinking Output |
|------|-------|----------------------|-----------------|
| Up to 200K context | $1.25 | $10.00 | $10.00 |
| Over 200K context | $2.50 | $15.00 | $15.00 |

### Gemini 2.5 Flash

| Tier | Input | Output (non-thinking) | Thinking Output |
|------|-------|----------------------|-----------------|
| Up to 200K context | $0.15 | $0.60 | $3.50 |
| Over 200K context | $0.30 | $1.20 | $7.00 |

### Gemini 2.0 Flash

| Tier | Input | Output |
|------|-------|--------|
| All contexts | $0.10 | $0.40 |

### Gemini 2.0 Flash-Lite

| Tier | Input | Output |
|------|-------|--------|
| All contexts | $0.075 | $0.30 |

*Note: Google AI Studio offers a generous free tier for development and prototyping.*

## Context Windows

Google Gemini holds the industry record for context window size:

- **All current Gemini models:** 1,000,000 tokens (1M)
- **Max output:** 8K-65K tokens depending on model
- **Effective context:** Google reports strong needle-in-haystack performance across the full 1M window

The 1M token context window is equivalent to approximately 750,000 words, 1,500 pages of text, 30,000 lines of code, or 1 hour of video. Gemini 1.5 Pro previously demonstrated a 10M token context in research settings.

## Key Capabilities

### Native Multimodality
Gemini is natively multimodal — trained from the start on text, images, audio, video, and code as a single model. This contrasts with approaches that bolt vision onto a text model. Benefits include:
- Process interleaved text and images naturally
- Understand video content with temporal reasoning
- Transcribe and analyze audio (including music)
- Cross-modal reasoning (e.g., answering questions about a video using audio cues)

### Thinking / Reasoning
Gemini 2.5 Pro and Flash include built-in thinking capabilities. Unlike some competitors that offer separate reasoning models, Gemini's thinking is integrated into the same model. The thinking budget is configurable, and the model can dynamically decide when to engage deeper reasoning.

### Code Execution
Gemini can execute Python code in a sandboxed environment as part of its response. This enables verified mathematical calculations, data analysis, chart generation, and algorithmic problem-solving with actual execution rather than simulated reasoning.

### Grounding with Google Search
Gemini can ground its responses in real-time Google Search results. This reduces hallucination for factual queries and provides up-to-date information beyond the training cutoff. Search grounding includes inline citations.

### Function Calling
Supports structured function calling with JSON schemas. Models can chain multiple tool calls and handle parallel function execution. Compatible with OpenAI-style function calling patterns.

### Google Search as a Tool
Beyond grounding, Gemini can use Google Search as an explicit tool — querying, processing results, and synthesizing information across multiple searches within a single conversation turn.

### Live API (Streaming)
Gemini 2.0 introduced a multimodal live API supporting real-time streaming of audio and video inputs with real-time text or audio responses. Enables conversational AI with camera and microphone input.

### Image Generation
Gemini 2.0 Flash includes experimental native image generation capabilities, allowing the model to create and edit images as part of its response without calling a separate image generation API.

## Strengths

1. **Massive context window:** The 1M token context window is the largest in the industry for production models. This enables processing entire codebases, long documents, books, or hours of video in a single prompt without chunking or RAG.

2. **Native multimodality:** Gemini's from-scratch multimodal training produces better cross-modal reasoning than models with bolted-on vision. Video understanding, in particular, is a differentiator — Gemini can reason about temporal sequences, audio-visual relationships, and spatial information in video.

3. **Google ecosystem integration:** Deep integration with Google Cloud (Vertex AI), Google Workspace (Docs, Sheets, Gmail), Android, Chrome, and Google Search. For organizations already on Google Cloud, Gemini is the path of least resistance.

4. **Cost efficiency at the Flash tier:** Gemini 2.0 Flash at $0.10/$0.40 and Flash-Lite at $0.075/$0.30 per million tokens offer strong performance at extremely low prices. The free tier in Google AI Studio further reduces the barrier to entry.

5. **Infrastructure advantage:** Google's custom TPU hardware and global infrastructure provide low-latency inference at scale. The company's experience running search, YouTube, and Gmail at planetary scale translates to reliable AI infrastructure.

## Weaknesses

1. **Availability and rate limits:** Gemini models, especially newer ones, have historically launched with limited availability, waitlists, and restrictive rate limits. Enterprise customers on Vertex AI get better limits, but the public API can be constrained.

2. **API stability and breaking changes:** Google has a history of rapid API iteration, with frequent deprecations and breaking changes. The migration from PaLM to Gemini, and from Gemini 1.0 to 1.5 to 2.0, required developer effort.

3. **Inconsistent safety filtering:** Gemini's content filtering can be aggressive, blocking legitimate use cases. The model may refuse requests that competitors handle without issue, particularly around creative writing, medical information, and security topics.

4. **Smaller third-party ecosystem:** While Google AI Studio and Vertex AI are well-documented, the third-party tooling ecosystem (LangChain adapters, framework integrations, tutorials) is less mature than OpenAI's.

5. **Regional availability:** Some Gemini features and models have limited regional availability, particularly for data residency-sensitive European customers. Vertex AI availability varies by Google Cloud region.

## Best Use Cases

- **Long document analysis:** Processing entire books, legal contracts, research papers, or codebases in a single context (all models, leveraging 1M context)
- **Video and audio understanding:** Analyzing recorded meetings, lectures, YouTube videos, or surveillance footage (Gemini 2.5 Pro)
- **Cost-sensitive high-volume:** Classification, extraction, summarization, and routing at very low cost (Flash, Flash-Lite)
- **Google Workspace automation:** Summarizing emails, generating documents, analyzing spreadsheets within the Google ecosystem
- **Real-time multimodal:** Live camera/microphone applications, accessibility tools (Gemini 2.0 Live API)
- **Grounded factual queries:** Applications requiring up-to-date information with citations (Search grounding)

## Benchmark Performance

### Gemini 2.5 Pro
- MMLU: ~90%+
- GPQA Diamond: ~82%
- MATH (MATH-500): ~95%+
- SWE-bench Verified: ~63.8% (with thinking)
- AIME 2025: ~86%
- HumanEval: ~95%+
- Holds #1 on Chatbot Arena leaderboard (as of early 2025)

### Gemini 2.5 Flash
- MMLU: ~87%
- MATH: ~91%
- SWE-bench Verified: ~55%+ (with thinking)
- Competitive with larger models at a fraction of the cost

### Gemini 2.0 Flash
- MMLU: ~85%
- HumanEval: ~90%
- Strong multimodal performance
- Sub-second latency for most requests

## API Features Summary

| Feature | Supported |
|---------|-----------|
| Streaming | Yes |
| Function/Tool Calling | Yes |
| Vision (Image Input) | Yes |
| Audio Input | Yes (native) |
| Video Input | Yes (native) |
| Image Generation | Yes (experimental, 2.0 Flash) |
| Structured Outputs (JSON) | Yes |
| Thinking/Reasoning | Yes (2.5 Pro, 2.5 Flash) |
| Code Execution | Yes (sandboxed Python) |
| Search Grounding | Yes |
| Fine-tuning | Yes (Vertex AI) |
| Batch Processing | Yes |
| Embeddings | Yes (text-embedding-004) |
| Context Caching | Yes |
| Live Streaming API | Yes (2.0) |

## Integration Notes for Atlas UX

Google Gemini is configured via `GEMINI_API_KEY` in `backend/.env`. The AI provider setup lives in `backend/src/ai.ts`. Gemini is used as an alternative provider for specific tasks, particularly those benefiting from long context windows (KB document analysis) and multimodal capabilities. The `gemini-code-reviewer` agent in `backend/.claude/agents/` uses Gemini for cross-model architecture review.

---

## Citations

1. Google DeepMind — Gemini API Documentation and Model Reference.
   https://ai.google.dev/gemini-api/docs/models/gemini

2. Google DeepMind — Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context (2024).
   https://arxiv.org/abs/2403.05530

3. Google — Gemini API Pricing Page.
   https://ai.google.dev/gemini-api/docs/pricing

4. Vaswani et al. — Attention Is All You Need (2017). The foundational Transformer paper from Google Brain.
   https://arxiv.org/abs/1706.03762

5. Google DeepMind Blog — Introducing Gemini 2.5: Our most intelligent AI model.
   https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/

## Images

![Google DeepMind Logo](https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Google_DeepMind_Logo.svg/1280px-Google_DeepMind_Logo.svg.png)

![Gemini Multimodal Architecture](https://storage.googleapis.com/deepmind-media/gemini/gemini-multimodal-architecture.png)

![Gemini Model Family Comparison](https://ai.google.dev/static/gemini-api/images/model-comparison.png)

![Google AI Studio Interface](https://ai.google.dev/static/images/ai-studio-overview.png)

![Gemini Context Window Comparison](https://storage.googleapis.com/deepmind-media/gemini/context-window-comparison.png)

## Videos

1. Google — Gemini 2.0: Our most capable AI model for the agentic era.
   https://www.youtube.com/watch?v=sClAIFqv1e0

2. Google DeepMind — Gemini 2.5 Pro deep dive: Thinking, coding, and multimodal capabilities.
   https://www.youtube.com/watch?v=5SZUApNpG0Q
