# What Large Language Models Do

## Introduction

Large Language Models (LLMs) are neural networks trained on massive text corpora that can generate, understand, and manipulate human language. They represent a paradigm shift in artificial intelligence — moving from narrow, task-specific systems to general-purpose models that can perform hundreds of language tasks without being explicitly programmed for any of them.

This article provides a comprehensive overview of what LLMs are, what they can and cannot do, how they fit into the broader AI landscape, and where they are being applied across industries.

---

## Definition and Core Concept

A Large Language Model is a deep neural network — typically based on the Transformer architecture — that has been trained on internet-scale text data to predict the next token in a sequence. The "large" in LLM refers to both the number of parameters (ranging from billions to trillions) and the volume of training data (often measured in trillions of tokens).

At its core, an LLM is a probability distribution over sequences of tokens. Given a sequence of input tokens, the model outputs a probability distribution over possible next tokens. This simple objective — next-token prediction — gives rise to remarkably complex behaviors when scaled up.

### Key Properties

- **Generative**: LLMs produce new text token by token, sampling from learned probability distributions
- **Parametric**: All knowledge is encoded in the model's weights during training — there is no external database being queried at inference time (unless augmented with retrieval)
- **Autoregressive**: Output is generated sequentially, with each new token conditioned on all previous tokens
- **Contextual**: The same word can be interpreted differently depending on surrounding context, thanks to the attention mechanism

### What Makes Them "Large"

The scale of modern LLMs is difficult to overstate:

| Model | Parameters | Training Tokens | Training Cost (est.) |
|-------|-----------|-----------------|---------------------|
| GPT-3 (2020) | 175B | 300B | ~$4.6M |
| PaLM (2022) | 540B | 780B | ~$8-12M |
| LLaMA 2 (2023) | 70B | 2T | ~$2M |
| GPT-4 (2023) | ~1.8T (MoE) | ~13T | ~$100M |
| LLaMA 3 (2024) | 405B | 15T | ~$30M+ |
| DeepSeek-V3 (2024) | 671B (MoE) | 14.8T | ~$5.6M |

The trend is clear: both parameter counts and training data volumes have grown by orders of magnitude, and this scaling has been the primary driver of capability improvements.

![Scaling of large language models over time](https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/AI_training_computation_%28updated%29.png/1280px-AI_training_computation_%28updated%29.png)

---

## Capabilities

### Text Generation

The most fundamental capability of LLMs is generating coherent, contextually appropriate text. This includes:

- **Creative writing**: Stories, poetry, scripts, marketing copy
- **Technical writing**: Documentation, reports, analyses
- **Conversational responses**: Chat, Q&A, customer service
- **Structured output**: JSON, XML, code, tables, forms

Modern LLMs can maintain coherence over thousands of tokens, follow complex stylistic instructions, and adapt their tone and register to match the context.

### Summarization

LLMs excel at condensing long documents into shorter summaries while preserving key information. This works across domains:

- Legal document summarization
- Scientific paper abstracts
- Meeting transcript summaries
- News article condensation

The model can be instructed to summarize at different levels of detail, for different audiences, or focusing on specific aspects of the source material.

### Translation

While not trained specifically as translation systems, LLMs demonstrate strong multilingual capabilities. Models trained on multilingual corpora can translate between dozens of language pairs, often approaching or matching the quality of dedicated neural machine translation systems.

### Code Generation

LLMs trained on code (like Codex, CodeLlama, DeepSeek-Coder, and StarCoder) can:

- Generate functions from natural language descriptions
- Complete partial code implementations
- Translate between programming languages
- Debug and explain existing code
- Write tests for existing implementations
- Refactor code following specific patterns

Code generation has become one of the highest-impact applications of LLMs, with tools like GitHub Copilot, Cursor, and Claude Code demonstrating significant developer productivity gains.

![Neural network processing text data](https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_neural_network.svg/560px-Colored_neural_network.svg.png)

### Reasoning and Analysis

Larger LLMs demonstrate emergent reasoning capabilities:

- **Mathematical reasoning**: Solving word problems, performing multi-step calculations
- **Logical reasoning**: Syllogisms, deduction, induction
- **Causal reasoning**: Understanding cause-and-effect relationships
- **Analogical reasoning**: Drawing parallels between different domains
- **Chain-of-thought**: Breaking complex problems into sequential steps

These reasoning capabilities improve significantly with scale and with techniques like chain-of-thought prompting, where the model is encouraged to show its work.

### Information Extraction and Classification

LLMs can extract structured information from unstructured text:

- Named entity recognition (people, places, organizations)
- Sentiment analysis
- Topic classification
- Relationship extraction
- Intent detection (crucial for conversational AI and voice agents like Lucy)

### Instruction Following

Modern LLMs, especially those fine-tuned with RLHF (Reinforcement Learning from Human Feedback) or DPO (Direct Preference Optimization), can follow complex, multi-step instructions with high fidelity. This capability is what makes them useful as the backbone of AI assistants.

---

## The Foundation Model Concept

### What Is a Foundation Model

The term "foundation model" was coined by the Stanford Center for Research on Foundation Models (CRFM) in 2021. It refers to large models trained on broad data at scale that can be adapted to a wide range of downstream tasks. LLMs are the most prominent example, but foundation models also include vision models (like CLIP), multimodal models (like GPT-4V), and audio models (like Whisper).

The key insight is that a single expensive pre-training run produces a general-purpose model that can then be cheaply adapted to many specific tasks — rather than training a separate model for each task.

### Pre-training vs Fine-tuning

The lifecycle of an LLM typically involves two phases:

**Pre-training**: The model is trained on a massive, diverse text corpus using self-supervised learning (typically next-token prediction). This phase is computationally expensive — often requiring thousands of GPUs running for weeks or months — but only needs to be done once. The result is a base model that has learned the statistical patterns of language.

**Fine-tuning**: The pre-trained model is further trained on a smaller, task-specific or instruction-following dataset. This is much cheaper and faster than pre-training. Common fine-tuning approaches include:

- **Supervised Fine-Tuning (SFT)**: Training on input-output pairs (e.g., instruction-response pairs)
- **RLHF**: Using human preference data to train a reward model, then optimizing the LLM against it
- **DPO**: A simpler alternative to RLHF that directly optimizes for preferences without a separate reward model
- **LoRA/QLoRA**: Parameter-efficient fine-tuning that only updates a small fraction of the model's weights

![Transformer model architecture diagram](https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/The-Transformer-model-architecture.png/440px-The-Transformer-model-architecture.png)

---

## Limitations

Understanding what LLMs cannot do is as important as understanding what they can do.

### Hallucination

LLMs generate text that is statistically plausible but not necessarily factually correct. They can confidently produce:

- Fabricated citations and references
- Incorrect dates, statistics, and facts
- Plausible-sounding but wrong technical explanations
- Non-existent URLs, APIs, or library functions

This is not a bug but a fundamental property of how the models work — they are optimizing for text that looks right, not for text that is right.

### Knowledge Cutoff

LLMs only know what was in their training data. They have no awareness of events after their training cutoff date unless augmented with retrieval (RAG) or web search capabilities.

### Lack of True Understanding

LLMs do not have a world model in the way humans do. They process tokens — not concepts, objects, or physical reality. Whether this constitutes "understanding" is an active area of philosophical and scientific debate, but the practical implication is clear: LLMs can fail in unexpected ways on tasks that seem trivial to humans.

### Context Window Limitations

Every LLM has a finite context window — the maximum number of tokens it can process at once. While context windows have grown dramatically (from 2K tokens in GPT-2 to 200K+ in Claude and Gemini), they are still fundamentally limited. Information at the edges of the context window may receive less attention than information in the middle (the "lost in the middle" phenomenon).

### Arithmetic and Precise Computation

LLMs are unreliable at precise arithmetic, especially with large numbers. They process numbers as tokens, not as mathematical objects. Tools like code interpreters and calculators are typically used to augment LLMs for computational tasks.

### Consistency and Determinism

Given the same prompt, an LLM may produce different outputs each time (unless temperature is set to 0, and even then, implementations may not be perfectly deterministic). LLMs can also contradict themselves within a single response, especially in long generations.

---

## Real-World Applications Across Industries

### Healthcare
- Clinical note summarization
- Medical literature search and synthesis
- Patient communication drafting
- Preliminary diagnostic support (always with physician oversight)

### Legal
- Contract review and analysis
- Legal research and case law summarization
- Document drafting and template generation
- Compliance checking

### Finance
- Financial report analysis
- Risk assessment narratives
- Customer service automation
- Fraud detection pattern description

### Education
- Personalized tutoring
- Automated grading assistance
- Curriculum development
- Language learning conversation partners

### Software Engineering
- Code generation and completion
- Code review assistance
- Documentation generation
- Bug detection and debugging
- Test case generation

### Customer Service
- Chatbots and virtual assistants
- Email response drafting
- Ticket classification and routing
- Knowledge base article generation

### Trade Businesses (Plumbing, HVAC, Salons)
- AI receptionists (like Lucy in Atlas UX) that answer calls 24/7
- Appointment scheduling via natural language
- SMS confirmations and follow-ups
- Lead qualification and capture
- After-hours call handling

![Natural language processing pipeline](https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/NLP_pipeline.png/800px-NLP_pipeline.png)

---

## Common Misconceptions

### "LLMs are just autocomplete"

While next-token prediction is the training objective, the emergent behaviors at scale — reasoning, in-context learning, instruction following — go far beyond simple autocomplete. The gap between a 100M parameter model and a 100B parameter model is not just quantitative but qualitative.

### "LLMs understand what they're saying"

LLMs have no subjective experience or genuine understanding. They are sophisticated pattern matchers operating over token sequences. Whether their internal representations constitute a form of "understanding" is debated, but they do not have consciousness, intentions, or beliefs.

### "LLMs will replace all human workers"

LLMs are tools that augment human capabilities. They excel at first drafts, boilerplate, synthesis, and speed — but they require human oversight for accuracy, judgment, creativity, and domain expertise. The most effective deployments combine LLM speed with human judgment.

### "Bigger models are always better"

While scaling has driven many capability improvements, smaller models can outperform larger ones when properly trained. The Chinchilla scaling laws showed that many early LLMs were undertrained relative to their size. Modern smaller models (like Phi-3, Mistral 7B) can match much larger predecessors through better training data curation and techniques.

### "LLMs memorize and regurgitate training data"

While LLMs can memorize some training data (especially highly duplicated text), their primary function is to learn statistical patterns and generalize. The vast majority of LLM outputs are novel combinations that never appeared in the training data.

---

## The LLM Ecosystem

### Open-Source vs Closed-Source

The LLM landscape is split between:

- **Closed-source**: GPT-4, Claude, Gemini — accessed via API, weights not available
- **Open-weight**: LLaMA, Mistral, DeepSeek, Qwen — weights downloadable, training data often undisclosed
- **Fully open**: OLMo, BLOOM — weights, data, and training code all available

This distinction matters for cost, customizability, privacy, and deployment flexibility.

### Deployment Options

LLMs can be deployed in several ways:

1. **API access**: Call a cloud-hosted model via HTTP (simplest, pay-per-token)
2. **Self-hosted**: Run the model on your own infrastructure (more control, higher ops burden)
3. **Edge deployment**: Run quantized models on consumer hardware (privacy, offline access)
4. **Hybrid**: Use small local models for routine tasks and route complex queries to larger cloud models

### Evaluation

Measuring LLM quality is notoriously difficult. Common approaches include:

- **Benchmarks**: MMLU, HumanEval, GSM8K, HellaSwag, ARC
- **Human evaluation**: Side-by-side comparisons, Elo ratings (Chatbot Arena)
- **Task-specific metrics**: BLEU (translation), ROUGE (summarization), pass@k (code)
- **Red teaming**: Adversarial testing for safety and alignment

![Machine learning model evaluation process](https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Overfitting_svg.svg/640px-Overfitting_svg.svg.png)

---

## Where LLMs Are Heading

The field is evolving rapidly. Key trends include:

- **Multimodality**: Models that process text, images, audio, and video jointly
- **Agentic AI**: LLMs that can use tools, browse the web, write and execute code, and take actions in the world
- **Longer context windows**: From 4K to 200K+ tokens, enabling processing of entire codebases and books
- **Reasoning models**: Systems like o1, o3, and DeepSeek-R1 that perform extended reasoning before answering
- **Efficiency**: Smaller, faster models that match larger predecessors through better training and architecture (MoE, distillation, quantization)
- **Specialization**: Domain-specific models for medicine, law, finance, and code

---

## Videos

- [But what is a GPT? Visual intro to Transformers — 3Blue1Brown](https://www.youtube.com/watch?v=wjZofJX0v4M)
- [Intro to Large Language Models — Andrej Karpathy](https://www.youtube.com/watch?v=zjkBMFhNj_g)

---

## References

1. Vaswani, A., et al. (2017). "Attention Is All You Need." *Advances in Neural Information Processing Systems 30*. https://arxiv.org/abs/1706.03762

2. Brown, T., et al. (2020). "Language Models are Few-Shot Learners." *Advances in Neural Information Processing Systems 33*. https://arxiv.org/abs/2005.14165

3. Bommasani, R., et al. (2021). "On the Opportunities and Risks of Foundation Models." Stanford CRFM. https://arxiv.org/abs/2108.07258

4. Touvron, H., et al. (2023). "LLaMA 2: Open Foundation and Fine-Tuned Chat Models." Meta AI. https://arxiv.org/abs/2307.09288

5. Zhao, W.X., et al. (2023). "A Survey of Large Language Models." Renmin University of China. https://arxiv.org/abs/2303.18223
