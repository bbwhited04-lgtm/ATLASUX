# How LLMs Predict the Next Word

## Introduction

At its core, every Large Language Model does one thing: given a sequence of tokens, predict the probability distribution over what comes next. This simple mechanism — next-word prediction — is the engine that powers everything from casual chatbot conversations to complex code generation and multi-step mathematical reasoning.

This article provides a deep, technical exploration of how LLMs generate text: from the raw logit scores produced by the final layer, through the sampling strategies that convert probabilities into actual token choices, to the advanced decoding techniques that make generation fast and coherent.

---

## Autoregressive Generation Explained

### The Autoregressive Principle

LLMs generate text **autoregressively** — one token at a time, left to right. Each new token is generated based on the full sequence of all previous tokens (both the original prompt and any previously generated tokens):

```
P(x_1, x_2, ..., x_T) = P(x_1) × P(x_2|x_1) × P(x_3|x_1,x_2) × ... × P(x_T|x_1,...,x_{T-1})
```

This is the chain rule of probability applied to sequences. The model factorizes the joint probability of the entire sequence into a product of conditional probabilities, each conditioned on everything that came before.

### The Generation Loop

The actual generation process follows a simple loop:

```
1. Encode the prompt through all Transformer layers → get logits for next position
2. Convert logits to probabilities (softmax)
3. Select a token from the probability distribution (sampling strategy)
4. Append the selected token to the sequence
5. If stop condition met → return; else → go to step 1
```

In practice, steps 1-4 are optimized with KV caching (the model only processes the new token through each layer, not the entire sequence from scratch). This makes each generation step O(1) in the token's processing, though the attention computation still scales with the total sequence length.

### Stop Conditions

Generation continues until one of:
- A special end-of-sequence (EOS) token is generated
- A maximum token limit is reached
- A stop sequence is detected (e.g., "User:" in a chat context)
- External intervention (the calling application stops generation)

![Autoregressive text generation process diagram](https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/The-Transformer-model-architecture.png/440px-The-Transformer-model-architecture.png)

---

## From Hidden States to Logits

### The Final Layer

After the input passes through all Transformer layers, the final hidden state for the last position is a vector of dimension d_model (e.g., 4096 or 8192). This vector contains the model's accumulated representation of the entire sequence.

To convert this into a prediction, the model applies a **linear projection** (the "LM head" or "unembedding layer"):

```
logits = h_final × W_unembed + b
```

Where:
- h_final ∈ ℝ^{d_model}: The final hidden state
- W_unembed ∈ ℝ^{d_model × vocab_size}: The unembedding matrix
- logits ∈ ℝ^{vocab_size}: Raw scores for each token in the vocabulary

The logits vector has one entry per token in the vocabulary (e.g., 32,000 values for LLaMA, 100,000+ for GPT-4). Each value represents how "compatible" the corresponding token is with the current context.

### Weight Tying

Many LLMs **tie** the embedding matrix and the unembedding matrix — they are the same matrix, transposed. This means the same representation space is used for both input and output:

```
W_unembed = W_embed^T
```

This reduces the number of parameters and often improves performance by encouraging consistent token representations. GPT-2, LLaMA, and many other models use weight tying.

### What Logits Represent

Logits are **unnormalized log-probabilities**. They can be any real number (positive or negative). Higher logits indicate the model considers that token more likely given the context.

For example, given the prompt "The capital of France is":

```
Token: "Paris"     logit: 15.2   (very likely)
Token: "Lyon"      logit: 8.1    (plausible but less likely)
Token: "London"    logit: 3.4    (wrong but geographically adjacent)
Token: "pizza"     logit: -5.7   (very unlikely)
Token: "∂"         logit: -12.3  (extremely unlikely)
```

---

## Softmax Probability Distribution

### The Softmax Function

The softmax function converts the raw logit vector into a valid probability distribution (non-negative values that sum to 1):

```
P(token_i) = exp(logit_i) / Σ_j exp(logit_j)
```

Properties:
- Higher logits map to higher probabilities
- The exponential amplifies differences (a logit difference of 1 translates to a ~2.7× probability ratio)
- All probabilities are strictly positive (even very unlikely tokens have non-zero probability)
- Probabilities sum to 1 across the entire vocabulary

### Numerical Stability

In practice, logits can be very large, causing numerical overflow in exp(). The standard trick is to subtract the maximum logit before applying softmax:

```
P(token_i) = exp(logit_i - max(logits)) / Σ_j exp(logit_j - max(logits))
```

This is mathematically equivalent but numerically stable.

### Log-Probabilities (Logprobs)

Many APIs return **log-probabilities** (logprobs) rather than raw probabilities:

```
logprob(token_i) = log(P(token_i)) = logit_i - log(Σ_j exp(logit_j))
```

Logprobs are preferred because:
- They are numerically more stable (probabilities can be extremely small)
- They are additive (the logprob of a sequence is the sum of token logprobs)
- They are directly interpretable as information content (in nats or bits)

A logprob of -0.01 means the model assigned ~99% probability. A logprob of -5 means ~0.7% probability.

---

## Temperature

### Definition

Temperature is a scaling factor applied to the logits before softmax:

```
P(token_i) = exp(logit_i / T) / Σ_j exp(logit_j / T)
```

Where T is the temperature parameter.

### Effect on Distribution

**T = 1.0 (default)**: The standard probability distribution. The model's trained distribution is used as-is.

**T < 1.0 (low temperature, e.g., 0.1-0.5)**: Makes the distribution **sharper**. High-probability tokens become even more likely, low-probability tokens become even less likely. In the extreme (T → 0), this approaches greedy decoding (always pick the most likely token).

```
T=1.0: P("Paris")=0.7, P("Lyon")=0.15, P("London")=0.05, ...
T=0.3: P("Paris")=0.98, P("Lyon")=0.019, P("London")=0.001, ...
```

**T > 1.0 (high temperature, e.g., 1.5-2.0)**: Makes the distribution **flatter**. The gap between likely and unlikely tokens shrinks, making the model more "random" and creative. In the extreme (T → ∞), every token becomes equally likely.

```
T=1.0: P("Paris")=0.7, P("Lyon")=0.15, P("London")=0.05, ...
T=2.0: P("Paris")=0.45, P("Lyon")=0.2, P("London")=0.1, ...
```

### Practical Guidelines

| Temperature | Use Case |
|-------------|----------|
| 0.0-0.3 | Factual Q&A, data extraction, deterministic tasks |
| 0.5-0.7 | Code generation, technical writing, structured output |
| 0.7-1.0 | General conversation, creative assistance |
| 1.0-1.5 | Creative writing, brainstorming, poetry |
| > 1.5 | Rarely useful; outputs become incoherent |

![Probability distribution with different temperature values](https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Gaussian_distribution_with_different_sigma.svg/640px-Gaussian_distribution_with_different_sigma.svg.png)

---

## Top-k Sampling

### Definition

Top-k sampling restricts the sampling pool to the k most probable tokens, redistributing their probabilities to sum to 1:

```
1. Sort tokens by probability (descending)
2. Keep only the top k tokens
3. Set all other probabilities to 0
4. Renormalize the remaining probabilities
5. Sample from the truncated distribution
```

### Effect

- **k = 1**: Equivalent to greedy decoding (always pick the most likely token)
- **k = 10**: Choose among the top 10 tokens
- **k = 50**: A common default, offering a good balance
- **k = vocab_size**: No filtering (equivalent to pure sampling)

### Limitations

The fixed value of k is a weakness. For highly confident predictions (the model is 99% sure of the next word), even k=10 includes many irrelevant tokens. For uncertain predictions (many plausible continuations), k=50 might exclude valid options.

This limitation motivated the development of nucleus sampling (top-p).

---

## Top-p (Nucleus) Sampling

### Definition

Top-p sampling (Holtzman et al., 2020) dynamically selects the smallest set of tokens whose cumulative probability exceeds p:

```
1. Sort tokens by probability (descending)
2. Compute cumulative probabilities
3. Include tokens until the cumulative probability ≥ p
4. Set all other probabilities to 0
5. Renormalize and sample
```

### Example

Given probabilities: P("Paris")=0.7, P("Lyon")=0.12, P("Marseille")=0.06, P("London")=0.04, ...

- With p=0.9: Include {"Paris", "Lyon", "Marseille"} (cumulative: 0.88 < 0.9, so also include "London" → cumulative 0.92 ≥ 0.9)
- With p=0.95: Include more tokens
- With p=0.5: Only "Paris" (0.7 ≥ 0.5)

### Why Top-p Is Usually Preferred Over Top-k

Top-p adapts to the model's confidence:
- When the model is confident (one dominant token), the nucleus is small → few tokens considered
- When the model is uncertain (many plausible tokens), the nucleus is large → more diversity

This adaptive behavior makes top-p more robust across different contexts than a fixed top-k.

### Common Settings

| p value | Behavior |
|---------|----------|
| 0.1 | Very focused, near-greedy |
| 0.5 | Moderately focused |
| 0.9 | Standard for most applications |
| 0.95 | Balanced diversity |
| 1.0 | No filtering |

### Combining Temperature and Top-p

Temperature and top-p can be used together:
1. Apply temperature to logits → get modified probabilities
2. Apply top-p filtering to the modified probabilities
3. Sample from the filtered distribution

This combination is common in practice. For example, Claude uses both temperature and top-p/top-k as configurable parameters.

---

## Beam Search vs Greedy Decoding

### Greedy Decoding

The simplest strategy: always pick the most probable token at each step.

```
token_t = argmax P(token | context)
```

Advantages:
- Deterministic (same prompt → same output)
- Fast (no need to track multiple hypotheses)
- Good for short, factual outputs

Disadvantages:
- Often produces repetitive, dull text
- Can get stuck in loops
- May miss globally better sequences (a locally suboptimal choice can lead to a globally better sequence)

### Beam Search

Beam search maintains the top-B most promising partial sequences (beams) at each step:

```
1. Start with B copies of the prompt
2. For each beam, compute probabilities for the next token
3. Keep the top B sequences (by total log-probability)
4. Repeat until all beams produce EOS
5. Return the highest-scoring complete sequence
```

Where B is the beam width (typically 2-10).

Advantages:
- Finds higher-probability sequences than greedy decoding
- Good for tasks where correctness matters (translation, summarization)

Disadvantages:
- Produces bland, generic text (optimizes for high probability, not interestingness)
- Computationally expensive (B× the cost of greedy decoding)
- Not suitable for creative or conversational generation

### Why Sampling Won Over Beam Search

Modern LLM applications overwhelmingly use sampling (with temperature, top-p, top-k) rather than beam search. The reason: beam search produces text that is **too probable** — it gravitates toward safe, repetitive, and boring outputs.

Human language is not the maximum-probability sequence. Natural text contains surprises, variety, and low-probability choices that make it interesting. Sampling with appropriate temperature and filtering produces text that is more natural and engaging.

Beam search is still used in specific applications like machine translation and speech recognition, where there is a single "correct" output and diversity is undesirable.

![Diagram of beam search expanding multiple hypotheses](https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Beam_search_%28Example%29.svg/640px-Beam_search_%28Example%29.svg.png)

---

## Logits, Logprobs, and Confidence

### Using Logprobs for Confidence Estimation

The probability assigned to the generated token indicates the model's "confidence":

```
High confidence:  logprob = -0.005  →  P ≈ 99.5%
Medium confidence: logprob = -1.0   →  P ≈ 36.8%
Low confidence:   logprob = -3.0    →  P ≈ 5.0%
Very low:         logprob = -7.0    →  P ≈ 0.09%
```

This can be used to:
- Flag uncertain generations for human review
- Detect potential hallucinations (low-confidence factual claims)
- Implement fallback strategies (route low-confidence queries to different models or humans)

### Perplexity as a Quality Metric

Perplexity measures how "surprised" the model is by a given text:

```
PPL = exp(-1/N × Σ logprob(token_i))
```

Lower perplexity means the model finds the text more predictable. Uses:
- **Model evaluation**: Compare models on the same test set
- **Data quality**: High perplexity can indicate unusual or low-quality text
- **Language detection**: Text in the model's strongest language will have lower perplexity
- **Anomaly detection**: Unusually high perplexity can flag adversarial inputs

### Token-Level Analysis

Many APIs allow you to inspect the logprobs of the top-k alternative tokens at each position. This reveals the model's "thought process":

```
Position: "The capital of France is ___"
  Token: "Paris"     logprob: -0.02  (P = 98%)
  Token: " Paris"    logprob: -4.1   (P = 1.7%)
  Token: "paris"     logprob: -5.8   (P = 0.3%)
  Token: "Lyon"      logprob: -7.2   (P = 0.07%)
```

This information is valuable for debugging prompts, understanding model behavior, and building more robust applications.

---

## Repetition Penalties and Frequency Penalties

### The Repetition Problem

Without intervention, LLMs tend to repeat themselves — especially during long generations. This happens because:
- Recently generated tokens have strong representation in the context
- Common phrases have high baseline probability
- The autoregressive process can create positive feedback loops (generating a word increases the context features that make it likely to be generated again)

### Repetition Penalty

A multiplicative penalty applied to the logits of tokens that have already appeared in the sequence:

```
logit_penalized = logit / penalty    (if token has appeared before)
```

Where penalty > 1 reduces the probability of repeated tokens. A typical value is 1.1-1.3.

### Presence Penalty

An additive penalty applied once to any token that has appeared in the sequence, regardless of how many times:

```
logit_penalized = logit - presence_penalty    (if token appeared at least once)
```

This discourages the model from returning to topics or words it has already used, promoting topical diversity.

### Frequency Penalty

An additive penalty that scales with the number of times a token has appeared:

```
logit_penalized = logit - frequency_penalty × count(token)
```

This more aggressively penalizes tokens that appear many times. A token that has appeared 5 times receives 5× the penalty of a token that appeared once.

### Practical Impact

| Setting | Effect |
|---------|--------|
| No penalties | Model may loop or repeat phrases |
| Low presence penalty (0.1-0.5) | Mild diversity encouragement |
| Medium frequency penalty (0.3-0.7) | Reduces common-word repetition |
| High penalties (>1.0) | Can make text incoherent (too much avoidance) |

The right penalty values depend on the use case. Chat requires less penalty (natural conversation has repetition); creative writing benefits from moderate penalties.

---

## Why Next-Word Prediction Leads to Coherent Long-Form Text

### The Coherence Paradox

A natural question: if the model only predicts one token at a time, why doesn't the output devolve into random, incoherent text? Why does a sequence of locally optimal (or sampled) token choices produce globally coherent paragraphs, arguments, and narratives?

### Explanation 1: Rich Contextual Representations

By the final layer of a large Transformer, the hidden state at each position encodes a rich representation of the entire context. This representation captures:

- The topic and subtopic being discussed
- The logical structure of the argument so far
- The style, tone, and register
- Any narrative or procedural structure
- Unresolved questions or incomplete thoughts

When the model predicts the next token, it is not just continuing a local pattern — it is continuing a globally coherent representation that has been refined through 80+ layers of processing.

### Explanation 2: Implicit Planning

Research suggests that LLMs develop implicit planning capabilities. When the model generates the first sentence of a paragraph, the hidden states already encode information about where the paragraph is going — even though the model never explicitly "plans" the paragraph.

This has been demonstrated by probing experiments that can predict the future topic of generated text from the current hidden states, even before the relevant tokens are generated.

### Explanation 3: The Training Distribution

The model was trained on coherent text. Short-range patterns (word order, grammar) and long-range patterns (paragraph structure, argument flow, narrative arc) are both present in the training data and both contribute to the loss. The model that best predicts the next token is one that has internalized all of these patterns.

### Explanation 4: Self-Reinforcing Coherence

Each generated token becomes part of the context for subsequent generation. If the model generates a coherent opening sentence, that sentence constrains and guides subsequent generation. Coherence is self-reinforcing — a good start makes a good continuation more likely.

This also explains why a bad start (a hallucinated fact, an incoherent opening) can cascade into longer incoherent sequences — errors are also self-reinforcing.

---

## Speculative Decoding for Speed

### The Inference Bottleneck

Autoregressive generation is **memory-bandwidth bound**, not compute-bound. Each generation step requires loading the model's weights from GPU memory, but only performs a small amount of computation (processing a single token). The GPU's compute capacity is vastly underutilized.

For a 70B parameter model in FP16, each step loads ~140GB of weights but performs only ~140 GFLOPs of computation. Modern GPUs can do 1000+ TFLOPs but are limited to 2-3 TB/s of memory bandwidth — making each step take ~50ms regardless of the available compute.

### How Speculative Decoding Works

Speculative decoding (Leviathan et al., 2023; Chen et al., 2023) uses a small, fast **draft model** to speculatively generate multiple tokens, then uses the large **target model** to verify them in parallel:

```
1. Draft model generates K tokens quickly (e.g., K=5)
2. Target model processes all K tokens in a single forward pass
3. Verify each token: does the target model agree with the draft?
4. Accept all tokens up to the first disagreement
5. Resample the disagreeing position from the target model's distribution
6. Repeat
```

### Why It Works

The key insight: the target model can **verify** K tokens in roughly the same time it takes to **generate** 1 token (because the forward pass processes all positions in parallel). If the draft model agrees with the target model on most tokens, speculative decoding achieves near-K× speedup.

In practice, a good draft model agrees with the target ~70-90% of the time on typical text, giving 2-3× speedups.

### Draft Model Options

- **Separate small model**: A 1-3B model as draft for a 70B+ target
- **Early exit**: Use an early layer of the target model as the draft
- **Medusa heads**: Add multiple prediction heads to the target model that predict multiple future tokens simultaneously
- **Eagle**: Predict multiple tokens using an auxiliary model that conditions on the target model's hidden states

### Correctness Guarantee

A remarkable property of speculative decoding: the output distribution is **exactly** the same as standard autoregressive decoding from the target model. The speedup comes without any quality loss. This is achieved through a careful rejection sampling scheme that ensures the accepted tokens follow the target model's distribution.

![Parallel processing in neural network computation](https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Neural_network_example.svg/640px-Neural_network_example.svg.png)

---

## Advanced Decoding Strategies

### Min-p Sampling

A newer alternative to top-p that sets a minimum probability threshold relative to the most likely token:

```
threshold = min_p × max(P(token_i))
Keep all tokens with P(token_i) ≥ threshold
```

If the most likely token has probability 0.5 and min_p = 0.1, the threshold is 0.05 — any token with probability ≥ 5% is kept.

Advantage over top-p: more intuitive threshold that adapts to the model's overall confidence level.

### Typical Sampling

Typical sampling (Meister et al., 2023) selects tokens whose information content (negative logprob) is close to the expected information content (entropy) of the distribution:

```
Keep tokens where |(-logprob(token)) - H(distribution)| < ε
```

The intuition: humans don't always pick the most likely word (boring) or unlikely words (incoherent). They pick words that are "typically surprising" — carrying about the expected amount of information.

### Contrastive Decoding

Compare logits from a large "expert" model and a small "amateur" model, and favor tokens where the expert model's advantage is greatest:

```
score(token) = logprob_expert(token) - logprob_amateur(token)
```

This amplifies the capabilities that the larger model has over the smaller one, often improving factual accuracy and reasoning.

### Guided Generation (Constrained Decoding)

Force the model to generate text that conforms to a specific format by masking out invalid tokens at each step:

- **JSON mode**: Only allow tokens that could continue valid JSON
- **Grammar-guided**: Only allow tokens consistent with a formal grammar
- **Regex-constrained**: Only allow tokens matching a regular expression

Libraries like Outlines and guidance implement this by building token masks from formal grammars.

---

## The Complete Picture

To summarize the full pipeline from prompt to generated text:

```
1. TOKENIZATION
   "Hello world" → [15496, 995]

2. EMBEDDING
   [15496, 995] → [[0.12, -0.34, ...], [0.56, 0.78, ...]]

3. TRANSFORMER LAYERS (×N)
   For each layer:
     a. RMSNorm
     b. Multi-head causal self-attention (with KV cache)
     c. Residual connection
     d. RMSNorm
     e. SwiGLU FFN
     f. Residual connection

4. FINAL PROJECTION
   h_final × W_unembed → logits ∈ ℝ^{vocab_size}

5. SAMPLING
   a. Apply temperature: logits / T
   b. Apply repetition/frequency penalties
   c. Softmax → probabilities
   d. Apply top-k and/or top-p filtering
   e. Sample token from filtered distribution

6. APPEND & REPEAT
   Add sampled token to sequence
   Update KV cache
   If not done → go to step 3 (only for new token)
```

This loop runs once per generated token. A response of 500 tokens requires 500 iterations of steps 3-6. At ~50ms per token for a large model, that is ~25 seconds of wall-clock time — which is why inference optimization (speculative decoding, quantization, batching) is critical for production deployment.

---

## Videos

- [Visualizing Attention, a Transformer's Heart — 3Blue1Brown](https://www.youtube.com/watch?v=eMlx5fFNoYc)
- [The Spelled-Out Intro to Language Modeling — Andrej Karpathy](https://www.youtube.com/watch?v=kCc8FmEb1nY)

---

## References

1. Holtzman, A., et al. (2020). "The Curious Case of Neural Text Degeneration." *ICLR 2020*. https://arxiv.org/abs/1904.09751

2. Leviathan, Y., et al. (2023). "Fast Inference from Transformers via Speculative Decoding." *ICML 2023*. https://arxiv.org/abs/2211.17192

3. Meister, C., et al. (2023). "Locally Typical Sampling." *TACL*. https://arxiv.org/abs/2202.00666

4. Li, J., et al. (2022). "Contrastive Decoding: Open-ended Text Generation as Optimization." *ACL 2023*. https://arxiv.org/abs/2210.15097

5. Cai, T., et al. (2024). "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads." *ICML 2024*. https://arxiv.org/abs/2401.10774
