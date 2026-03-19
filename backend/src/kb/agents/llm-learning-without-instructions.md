# How LLMs Learn Without Explicit Instructions

## Introduction

One of the most remarkable properties of Large Language Models is that they are never explicitly told how to perform any specific task. No one teaches GPT-4 the rules of grammar, the facts of history, or how to write Python code. Instead, LLMs learn from raw text through a process called self-supervised learning — predicting the next token over trillions of examples — and from this seemingly simple objective, complex capabilities emerge.

This article explores the mechanisms by which LLMs acquire knowledge and skills without explicit instruction, the techniques used to align their behavior with human intentions, and the ongoing debate about whether what LLMs do constitutes genuine understanding or sophisticated pattern matching.

---

## The Self-Supervised Learning Paradigm

### What Is Self-Supervised Learning?

Self-supervised learning is a training paradigm where the learning signal comes from the data itself, rather than from human-provided labels. In the context of LLMs, the "supervision" is the next token in the sequence — information that is freely available in any text corpus.

This stands in contrast to:

- **Supervised learning**: Requires human-labeled data (e.g., sentiment labels, category tags)
- **Unsupervised learning**: Finds structure in data without any learning signal (e.g., clustering)
- **Self-supervised learning**: Creates its own supervision from the structure of the data

The beauty of self-supervised learning for language is that **every token in every document is a training example**. A single book provides hundreds of thousands of next-token prediction tasks. The entire internet provides trillions.

### Why Next-Token Prediction Is So Powerful

At first glance, predicting the next token seems like a trivial task — just memorize common word sequences. But to predict the next token well across diverse text, the model must learn an enormous range of knowledge and skills:

**To predict tokens in factual text**, the model must learn facts:
```
"The capital of France is ___" → "Paris"
```

**To predict tokens in logical arguments**, the model must learn reasoning:
```
"If all mammals are warm-blooded, and whales are mammals, then whales are ___" → "warm-blooded"
```

**To predict tokens in code**, the model must learn programming:
```
"def fibonacci(n):\n    if n <= 1:\n        return ___" → "n"
```

**To predict tokens in dialogue**, the model must learn pragmatics:
```
"Customer: I'd like to return this item.\nAgent: I'd be happy to help. Could you ___" → "provide"
```

**To predict tokens in mathematical proofs**, the model must learn mathematics:
```
"By the triangle inequality, |a + b| ≤ ___" → "|a|"
```

The key insight: **next-token prediction is a universal task that subsumes essentially every language task**. A model that could perfectly predict the next token would, by necessity, understand language, reason about the world, and possess encyclopedic knowledge.

Of course, no model achieves perfect prediction — the best models achieve perplexities of 5-15, meaning substantial uncertainty remains. But the pursuit of better prediction drives the acquisition of increasingly sophisticated capabilities.

![Self-supervised learning on unlabeled text data](https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Overfitting.svg/640px-Overfitting.svg.png)

---

## Pre-Training on Internet-Scale Text Corpora

### The Training Data

Modern LLMs are pre-trained on datasets that attempt to capture a representative sample of human written communication:

| Dataset | Size | Source |
|---------|------|--------|
| Common Crawl | ~100TB raw | Web pages |
| RefinedWeb | ~5T tokens | Filtered web crawl |
| The Pile | ~825GB | Curated mix of 22 sources |
| RedPajama | ~1.2T tokens | Open reproduction of LLaMA data |
| FineWeb | ~15T tokens | High-quality web extraction |

The composition matters enormously. Models trained with more code develop stronger reasoning abilities. Models trained with more scientific text are better at technical tasks. Models trained with more conversational data are more natural in dialogue.

### What Gets Learned During Pre-Training

Through billions of gradient updates on next-token prediction, the model learns:

1. **Syntax and grammar**: The rules of sentence structure in each language
2. **Semantics**: Word meanings, including polysemy (multiple meanings) and context-dependent interpretation
3. **World knowledge**: Facts about entities, events, relationships, science, history
4. **Reasoning patterns**: Logical inference, mathematical thinking, causal reasoning
5. **Pragmatics**: How language is used in context — tone, register, intent, implication
6. **Format and style**: How different types of text are structured (emails, code, papers, recipes)
7. **Multilingual correspondences**: Relationships between languages (translation)
8. **Common sense**: Everyday knowledge about how the physical and social world works

This knowledge is not stored in a structured database — it is distributed across billions of parameters in the model's weights, encoded as patterns in high-dimensional vector spaces.

### The Compression Hypothesis

One way to understand pre-training is through the lens of compression. The model is essentially learning to compress the training data by finding patterns and regularities. A model that has learned the rules of English grammar can represent English text more efficiently (lower loss) than a model that treats every sentence as novel.

Taken to its extreme, this perspective suggests that **intelligence is compression** — the ability to find concise representations of complex data. The better a model compresses language, the more it must understand about language and the world described by language.

---

## In-Context Learning

### The Discovery

In-context learning (ICL) is the ability of LLMs to learn new tasks at inference time, simply from examples provided in the prompt. This was first documented at scale with GPT-3 (Brown et al., 2020).

### Few-Shot Learning

Provide a few examples of a task, and the model performs it:

```
Translate English to French:
English: Hello → French: Bonjour
English: Thank you → French: Merci
English: Good morning → French:
```

The model outputs "Bonjour" (or "Bon matin") without any gradient updates — it has "learned" the translation task purely from the examples in its context window.

### Zero-Shot Learning

Even more remarkably, LLMs can perform tasks with no examples at all, just a natural language description:

```
Classify the following review as positive or negative:
"The food was excellent and the service was outstanding."
Classification:
```

The model can output "Positive" despite never being explicitly trained on sentiment classification.

### How In-Context Learning Works

The mechanism of in-context learning is an active area of research. Leading theories include:

**Induction heads** (Olsson et al., 2022): Specific attention heads that implement a "copy" operation — find a previous pattern match and copy what came next. This provides a simple mechanism for few-shot learning.

**Implicit Bayesian inference** (Xie et al., 2022): The model implicitly performs Bayesian inference over a latent "task" variable, using the examples to identify which task is being demonstrated and then applying the inferred task to the query.

**Gradient descent in forward pass** (Akyürek et al., 2023): Some evidence suggests that Transformers implement something analogous to gradient descent within their forward pass, effectively "training" on the examples in the context.

**Task location in weight space** (Hendel et al., 2023): The examples help the model locate the relevant "task vector" in its weight space — a direction in parameter space that corresponds to the desired behavior.

### Limitations of In-Context Learning

- Limited by context window size (number of examples that fit)
- Sensitive to example selection, ordering, and formatting
- Does not persistently learn — knowledge is lost when the context changes
- Performance varies significantly across tasks and models

![Visualization of few-shot learning with examples in context](https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/The-Transformer-model-architecture.png/440px-The-Transformer-model-architecture.png)

---

## Emergent Abilities

### Chain-of-Thought Reasoning

One of the most impactful emergent abilities is chain-of-thought (CoT) reasoning — the model's ability to break complex problems into sequential steps when prompted to do so.

Without CoT:
```
Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls.
   Each can has 3 tennis balls. How many does he have now?
A: 11
```

With CoT:
```
Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls.
   Each can has 3 tennis balls. How many does he have now?
A: Roger started with 5 balls. He bought 2 cans × 3 balls = 6 balls.
   5 + 6 = 11. The answer is 11.
```

The explicit reasoning chain allows the model to allocate more computation to the problem and reduces errors. This capability emerges at scale — small models show no benefit from CoT prompting, while large models show dramatic improvements.

### Reasoning Models

The latest frontier is "reasoning models" like OpenAI's o1/o3 and DeepSeek-R1 that are explicitly trained to produce long chains of thought. These models generate extensive internal reasoning (sometimes hundreds of tokens of "thinking") before producing their final answer.

The training process for reasoning models typically involves:
1. Pre-training (standard next-token prediction)
2. Supervised fine-tuning on reasoning traces
3. Reinforcement learning to optimize for correct final answers (the model learns which reasoning strategies lead to correct conclusions)

### Other Emergent Capabilities

- **Analogical reasoning**: Drawing parallels between different domains
- **Theory of mind**: Modeling what other agents know or believe (at least superficially)
- **Self-explanation**: Explaining its own reasoning process
- **Creative composition**: Generating novel ideas, metaphors, and connections
- **Tool use**: Learning to call external tools (APIs, calculators, search engines) from demonstrations

---

## RLHF and Alignment Without Explicit Rules

### The Alignment Problem

A pre-trained LLM is a text completion engine — it generates text that is statistically likely to follow the prompt. But users don't want likely text; they want helpful, accurate, and safe text. A raw pre-trained model will happily generate toxic content, follow harmful instructions, or produce confident-sounding misinformation because such text exists in its training data.

The challenge of **alignment** is making the model's behavior match human values and intentions — without being able to write down an exhaustive set of rules covering every possible situation.

### Reinforcement Learning from Human Feedback (RLHF)

RLHF (Christiano et al., 2017; Ouyang et al., 2022) is the technique that transformed LLMs from text completers into useful assistants. The process has three stages:

**Stage 1: Supervised Fine-Tuning (SFT)**

Train the model on high-quality instruction-response pairs written by human annotators:

```
Instruction: "Explain photosynthesis in simple terms."
Response: "Photosynthesis is how plants make food using sunlight..."
```

This teaches the model the format of helpful responses but doesn't teach it which responses are better than others.

**Stage 2: Reward Model Training**

Present the model's responses to human raters who rank them by quality. Train a separate neural network (the reward model) to predict human preferences:

```
Prompt: "Explain quantum computing"
Response A: [detailed, accurate, clear] → Human ranks higher
Response B: [vague, has errors] → Human ranks lower

Reward model learns: R(A) > R(B)
```

The reward model learns to score responses on a continuous scale, generalizing from the specific examples to new prompts and responses.

**Stage 3: Policy Optimization (PPO)**

Use the reward model to optimize the LLM's generation behavior via Proximal Policy Optimization:

1. The LLM generates a response to a prompt
2. The reward model scores the response
3. The LLM's parameters are updated to increase the probability of high-scoring responses
4. A KL divergence penalty prevents the LLM from deviating too far from the SFT model (preventing "reward hacking")

### Direct Preference Optimization (DPO)

DPO (Rafailov et al., 2023) simplifies RLHF by eliminating the separate reward model. Instead of training a reward model and then doing RL, DPO directly optimizes the LLM to prefer winning responses over losing ones:

```
L_DPO = -log σ(β (log π(y_w|x)/π_ref(y_w|x) - log π(y_l|x)/π_ref(y_l|x)))
```

Where y_w is the preferred response, y_l is the dispreferred response, π is the model being trained, and π_ref is the reference (SFT) model.

DPO is simpler to implement, more stable, and requires less compute than RLHF while achieving comparable results. It has become the dominant alignment technique in open-source LLM development.

### Constitutional AI (CAI)

Anthropic's Constitutional AI (Bai et al., 2022) reduces the need for human feedback by using a set of principles (a "constitution") to guide the model's self-critique:

1. Generate a response to a prompt
2. Ask the model to critique its own response according to the constitution (e.g., "Is this response harmful? Is it honest?")
3. Ask the model to revise the response based on its critique
4. Use the original and revised responses as preference pairs for DPO/RLHF

This creates a scalable alignment process where human oversight focuses on writing principles rather than rating individual responses.

![Reinforcement learning feedback loop diagram](https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Reinforcement_learning_diagram.svg/500px-Reinforcement_learning_diagram.svg.png)

---

## Transfer Learning: Why Pre-Training Works

### The Transfer Learning Hypothesis

Transfer learning is the idea that knowledge learned on one task can be transferred to improve performance on another. In the context of LLMs, the hypothesis is that the representations learned during pre-training (general language understanding, world knowledge, reasoning patterns) are broadly useful across downstream tasks.

This hypothesis has been overwhelmingly validated. A model pre-trained on web text can be fine-tuned to excel at:
- Medical diagnosis support
- Legal document analysis
- Code generation
- Customer service
- Creative writing

The pre-trained representations provide a strong starting point that dramatically reduces the amount of task-specific data and compute needed.

### Why It Works: Feature Hierarchy

Deep neural networks learn hierarchical features:

- **Early layers**: Basic features (syntax, word relationships, surface patterns)
- **Middle layers**: Intermediate features (semantic meaning, topic, entity types)
- **Later layers**: Task-relevant features (reasoning, specific knowledge, output formatting)

Pre-training teaches the model rich early and middle-layer features that are broadly useful. Fine-tuning primarily adjusts the later layers to specialize for the target task.

### Parameter-Efficient Fine-Tuning

Because pre-trained representations are so generally useful, it is often sufficient to fine-tune only a small fraction of the model's parameters:

**LoRA (Low-Rank Adaptation)**: Adds small trainable matrices to the attention layers while freezing the original weights:
```
W_new = W_frozen + B × A    (where B, A are low-rank matrices)
```

Typically uses <1% of the original parameters. For a 70B model, a LoRA adapter might have only 100-500M trainable parameters.

**QLoRA**: Combines LoRA with 4-bit quantization of the base model, enabling fine-tuning of 70B models on a single consumer GPU (48GB).

**Prefix tuning / prompt tuning**: Prepend learned "virtual tokens" to the input. Only these virtual token embeddings are trained.

### Representation Universality

One of the most striking findings is that pre-trained representations transfer not just across tasks within the same language, but across languages and even across modalities. A model pre-trained on English text develops representations that are useful for French, even with minimal French training data. Models pre-trained on text and images develop shared representations that connect visual and linguistic concepts.

---

## The "Stochastic Parrot" Debate

### The Critique

Bender et al. (2021) introduced the term "stochastic parrot" to describe LLMs — arguing that they are sophisticated pattern-matching systems that produce text without understanding its meaning. Key arguments:

1. **No grounding**: LLMs have no sensory experience of the world they describe. Their knowledge of "red" comes from the statistical distribution of the word in text, not from seeing the color.

2. **No intention**: LLMs do not have goals, beliefs, or desires. They do not "intend" to be helpful or truthful — they produce outputs that pattern-match with helpful or truthful text in their training data.

3. **Form without meaning**: LLMs can produce grammatically perfect, semantically coherent text that is factually wrong. This suggests they have learned the form of language without truly understanding its content.

4. **Memorization concerns**: Some outputs may be regurgitation of memorized training data rather than genuine generation.

### The Counter-Arguments

**Behavioral evidence for understanding**:

Researchers have found evidence of internal representations that correspond to real-world concepts:

- Li et al. (2023) found that LLMs develop internal representations of spatial relationships, temporal sequences, and color — not just word associations but structured models of the phenomena described by language.
- Nanda et al. (2023) showed that a small Transformer trained on modular arithmetic develops a genuine algorithm (using Fourier representations) rather than memorizing input-output pairs.

**The capability gap**: If LLMs were "merely" pattern-matching, we would expect them to fail on novel tasks they have never seen. Instead, they demonstrate significant generalization:
- Solving novel math problems that are extremely unlikely to appear in training data
- Writing code for unique specifications
- Combining concepts in creative ways

**Functional understanding**: Even if LLMs lack subjective experience, their internal representations may constitute a functional form of understanding — they model the causal structure of the world in their weights, even if they don't "experience" that world.

### The Practical View

For developers building on LLMs, the philosophical question of whether they "truly understand" is less important than the practical question of what they can reliably do:

- They can follow instructions with high fidelity
- They can reason about novel problems (especially with chain-of-thought)
- They can fail in systematic, predictable ways (hallucination, arithmetic, adversarial inputs)
- They benefit from structured prompting, retrieval augmentation, and tool use

Understanding both the capabilities and the failure modes — regardless of whether you call the underlying mechanism "understanding" or "pattern matching" — is what matters for building robust applications.

![Language model processing and generating text](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Transformer_architecture_-_General_%28no_details%29.svg/480px-Transformer_architecture_-_General_%28no_details%29.svg.png)

---

## The Learning Without Instructions Continuum

To summarize how LLMs learn without explicit instructions, consider it as a continuum:

### Level 1: Statistical Patterns (Pre-training)
The model learns the statistical structure of language — which tokens tend to follow which other tokens. This alone produces surprisingly capable text generation.

### Level 2: Structural Understanding (Emergent from Scale)
With sufficient scale and data, the model develops internal representations of grammar, semantics, and world knowledge. This is not explicitly taught — it emerges because these structures help predict the next token.

### Level 3: In-Context Adaptation (Emergent Capability)
The model can adapt its behavior based on examples or instructions provided in the prompt. This happens without any parameter updates — the model "learns" within its forward pass.

### Level 4: Behavioral Alignment (RLHF/DPO)
Human preferences shape the model's behavior without explicit rules. The model learns to be helpful, harmless, and honest by optimizing for human judgments, not by following a rulebook.

### Level 5: Self-Improvement (Reasoning Models)
The latest models can improve their own reasoning by generating and evaluating their own chains of thought, using reinforcement learning to discover effective reasoning strategies.

Each level builds on the previous ones, and each represents learning without explicit instruction — the model is never told rules, facts, or procedures directly. Instead, it discovers them through prediction, feedback, and scale.

---

## Videos

- [How ChatGPT is Trained — StatQuest with Josh Starmer](https://www.youtube.com/watch?v=VPRSBzXzavo)
- [State of GPT — Andrej Karpathy (Microsoft Build 2023)](https://www.youtube.com/watch?v=bZQun8Y4L2A)

---

## References

1. Brown, T., et al. (2020). "Language Models are Few-Shot Learners." *NeurIPS 2020*. https://arxiv.org/abs/2005.14165

2. Ouyang, L., et al. (2022). "Training language models to follow instructions with human feedback." *NeurIPS 2022*. https://arxiv.org/abs/2203.02155

3. Bai, Y., et al. (2022). "Constitutional AI: Harmlessness from AI Feedback." Anthropic. https://arxiv.org/abs/2212.08073

4. Rafailov, R., et al. (2023). "Direct Preference Optimization: Your Language Model is Secretly a Reward Model." *NeurIPS 2023*. https://arxiv.org/abs/2305.18290

5. Bender, E.M., et al. (2021). "On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?" *FAccT 2021*. https://doi.org/10.1145/3442188.3445922
