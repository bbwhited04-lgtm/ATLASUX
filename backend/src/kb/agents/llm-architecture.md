# LLM Structures and Architecture

## Introduction

The architecture of Large Language Models is dominated by the Transformer — a neural network design introduced in 2017 that revolutionized natural language processing and, subsequently, nearly every domain of machine learning. Understanding the Transformer and its variants is essential for anyone working with LLMs, whether building applications on top of them, fine-tuning them, or designing new architectures.

This article provides a deep technical walkthrough of the components that make up modern LLMs, from the attention mechanism at their core to the scaling laws that govern their training, and the architectural innovations that continue to push the field forward.

---

## The Transformer Architecture

### Historical Context

Before the Transformer, sequence modeling was dominated by Recurrent Neural Networks (RNNs) and their variants (LSTMs, GRUs). These models processed input sequentially — one token at a time — maintaining a hidden state that was updated at each step. This sequential nature created two fundamental problems:

1. **Training was slow**: Operations could not be parallelized across the sequence dimension
2. **Long-range dependencies were hard to learn**: Information had to pass through many sequential steps, causing gradient vanishing/exploding

The Transformer solved both problems by replacing recurrence with **attention** — a mechanism that allows every position in the sequence to attend directly to every other position, regardless of distance.

### High-Level Structure

The original Transformer (Vaswani et al., 2017) consists of two main components:

```
Input → [Encoder] → Encoded Representations
                            ↓
Target → [Decoder] → Output Probabilities
```

Each encoder and decoder is a stack of identical layers. The original paper used 6 layers for each, but modern LLMs use anywhere from 32 to 128+ layers.

![The original Transformer architecture from Vaswani et al.](https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/The-Transformer-model-architecture.png/440px-The-Transformer-model-architecture.png)

---

## The Attention Mechanism

### Intuition

Attention answers the question: "When processing this word, how much should I focus on each other word in the sequence?" For example, in the sentence "The cat sat on the mat because it was tired," the word "it" should attend strongly to "cat" to resolve the pronoun reference.

### Scaled Dot-Product Attention

The fundamental attention operation computes a weighted sum of values, where the weights are determined by the compatibility between queries and keys:

```
Attention(Q, K, V) = softmax(QK^T / √d_k) V
```

Where:
- **Q (Queries)**: What am I looking for? (derived from the current position)
- **K (Keys)**: What do I contain? (derived from all positions being attended to)
- **V (Values)**: What information do I carry? (derived from all positions being attended to)
- **d_k**: The dimension of the key vectors (the scaling factor prevents dot products from growing too large)

The process step by step:

1. Compute dot products between each query and all keys → raw attention scores
2. Scale by √d_k to prevent softmax saturation
3. Apply softmax to get attention weights (probabilities that sum to 1)
4. Multiply weights by values to get the weighted output

### Self-Attention

In self-attention, the queries, keys, and values all come from the same sequence. Each token generates its own Q, K, and V vectors by multiplying the token's embedding with learned weight matrices W_Q, W_K, and W_V.

This means every token can directly attend to every other token in the sequence, regardless of distance. The attention pattern is learned during training — the model discovers which tokens are relevant to each other.

### Multi-Head Attention

Rather than performing a single attention operation, the Transformer uses multiple "heads" — each with its own Q, K, V projection matrices. This allows the model to attend to information from different representation subspaces at different positions simultaneously.

```
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) W_O

where head_i = Attention(Q W_Q_i, K W_K_i, V W_V_i)
```

For example, one head might learn to attend to syntactic relationships (subject-verb agreement), while another attends to semantic relationships (topic coherence), and another to positional patterns (nearby words).

Typical configurations:
- GPT-2: 12 heads, d_model = 768
- GPT-3: 96 heads, d_model = 12288
- LLaMA 2 70B: 64 heads, d_model = 8192

### Causal (Masked) Attention

In decoder-only models (which most modern LLMs are), attention is **causal** — each token can only attend to tokens at the same or earlier positions. This is enforced by applying a mask that sets future positions to -∞ before the softmax, ensuring their attention weights become 0.

This masking is what makes autoregressive generation possible: the model can generate text left-to-right, one token at a time, without "peeking" at future tokens.

### Cross-Attention

In encoder-decoder models, the decoder uses cross-attention to attend to the encoder's output. The queries come from the decoder, while the keys and values come from the encoder. This is how the decoder accesses the encoded representation of the input sequence.

---

## Encoder-Decoder vs Decoder-Only vs Encoder-Only

### Encoder-Only Models

- **Architecture**: Stack of encoder layers with bidirectional self-attention
- **Key example**: BERT (Bidirectional Encoder Representations from Transformers)
- **Training objective**: Masked Language Modeling (MLM) — predict randomly masked tokens
- **Best for**: Understanding tasks (classification, NER, sentiment analysis)
- **Why not used for generation**: Bidirectional attention means the model sees the full sequence at once, making autoregressive generation unnatural

### Decoder-Only Models

- **Architecture**: Stack of decoder layers with causal (left-to-right) self-attention
- **Key examples**: GPT series, LLaMA, Claude, Mistral, DeepSeek
- **Training objective**: Next-token prediction (autoregressive language modeling)
- **Best for**: Text generation, and surprisingly, also understanding tasks when scaled sufficiently
- **Why dominant**: Simpler architecture, scales well, and the autoregressive objective naturally supports generation

### Encoder-Decoder Models

- **Architecture**: Encoder stack (bidirectional) + decoder stack (causal + cross-attention)
- **Key examples**: Original Transformer, T5, BART, Flan-T5
- **Training objective**: Varies (span corruption for T5, denoising for BART)
- **Best for**: Sequence-to-sequence tasks (translation, summarization)
- **Why less common now**: Decoder-only models achieve comparable results with simpler architecture

The overwhelming trend in LLMs since 2020 has been toward **decoder-only** architectures. GPT-3, GPT-4, Claude, LLaMA, Mistral, Gemini, and DeepSeek are all decoder-only.

![Comparison of transformer model types showing encoder, decoder, and encoder-decoder architectures](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Transformer_architecture_-_General_%28no_details%29.svg/480px-Transformer_architecture_-_General_%28no_details%29.svg.png)

---

## Tokenization

LLMs do not operate on raw text — they operate on **tokens**, which are subword units derived from the text. Tokenization is the process of converting text into a sequence of integer IDs from a fixed vocabulary.

### Why Subword Tokenization?

- **Character-level**: Vocabulary is tiny (~256) but sequences are very long, making attention expensive
- **Word-level**: Vocabulary must be huge to cover all words, and out-of-vocabulary words cannot be handled
- **Subword-level**: A compromise — common words get their own tokens, rare words are split into subword pieces

### Byte Pair Encoding (BPE)

BPE is the most common tokenization algorithm for LLMs. It works by:

1. Start with a vocabulary of individual bytes/characters
2. Count all adjacent pairs in the training corpus
3. Merge the most frequent pair into a new token
4. Repeat until the desired vocabulary size is reached

Example: "lower" might be tokenized as ["low", "er"] because "low" and "er" are common subwords.

GPT-2/3/4 use BPE with a vocabulary of ~50,000-100,000 tokens. LLaMA uses BPE with SentencePiece and a vocabulary of 32,000 tokens.

### SentencePiece

SentencePiece (Google) is a language-independent tokenizer that operates directly on raw Unicode text without pre-tokenization. It implements both BPE and Unigram models. LLaMA and many multilingual models use SentencePiece.

Key advantage: treats the input as a raw byte stream, so it can handle any language or script without language-specific preprocessing.

### WordPiece

WordPiece (used by BERT and its variants) is similar to BPE but selects merges based on likelihood rather than frequency. It maximizes the likelihood of the training data given the vocabulary.

### Tokenization Artifacts

Tokenization has important practical implications:

- Different tokenizers produce different token counts for the same text
- Some languages are more efficiently tokenized than others (typically English is most efficient)
- Code may tokenize differently than natural language
- Tokenization can affect arithmetic: "123" might be one token while "1234" might be two
- Leading spaces, punctuation, and Unicode characters can behave unexpectedly

---

## Positional Encoding

Since the attention mechanism is permutation-invariant (it has no inherent notion of position), the model needs an explicit signal about where each token sits in the sequence.

### Sinusoidal Positional Encoding

The original Transformer used fixed sinusoidal functions of different frequencies:

```
PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

These encodings are added to the token embeddings before the first attention layer. The sinusoidal pattern was chosen because it allows the model to learn to attend to relative positions (the difference between two positions has a consistent geometric relationship in the encoding space).

### Learned Positional Embeddings

GPT-2 and GPT-3 use learned positional embeddings — a separate embedding matrix of shape [max_sequence_length, d_model] that is trained alongside the model. Simple but limited to the maximum sequence length seen during training.

### Rotary Position Embedding (RoPE)

RoPE (Su et al., 2021) encodes position by rotating the query and key vectors in the attention computation. Instead of adding position information to the embeddings, RoPE applies a rotation matrix that depends on the position:

```
f(x, pos) = R(pos) · x
```

Where R(pos) is a block-diagonal rotation matrix. The key property is that the dot product between two rotated vectors depends only on their relative position, not their absolute positions.

RoPE is used by LLaMA, Mistral, Qwen, and many modern LLMs. It offers several advantages:
- Natural handling of relative positions
- Can be extended to longer sequences than seen during training (with NTK-aware scaling or YaRN)
- Decays attention with distance (a useful inductive bias)

### ALiBi (Attention with Linear Biases)

ALiBi (Press et al., 2022) takes a completely different approach: instead of modifying the embeddings, it adds a linear bias to the attention scores that penalizes distant tokens:

```
attention_score(i, j) = q_i · k_j - m · |i - j|
```

Where m is a head-specific slope. This is simpler than RoPE and naturally generalizes to longer sequences. Used by BLOOM and some Falcon variants.

---

## Scaling Laws

### The Kaplan Scaling Laws (2020)

OpenAI researchers (Kaplan et al.) discovered that LLM performance follows predictable power laws as a function of three variables:

1. **Model size (N)**: Number of parameters
2. **Dataset size (D)**: Number of training tokens
3. **Compute budget (C)**: Total FLOPs

The key finding: performance improves smoothly and predictably with scale, following:

```
L(N) ∝ N^(-0.076)   (loss vs parameters)
L(D) ∝ D^(-0.095)   (loss vs data)
L(C) ∝ C^(-0.050)   (loss vs compute)
```

### The Chinchilla Scaling Laws (2022)

DeepMind's Hoffmann et al. refined the Kaplan laws and found that many existing LLMs were **over-parameterized and under-trained**. The Chinchilla-optimal ratio is approximately:

```
Optimal tokens ≈ 20 × parameters
```

This means a 10B parameter model should be trained on ~200B tokens for optimal compute efficiency. GPT-3 (175B parameters, 300B tokens) was significantly undertrained by this standard.

The Chinchilla result shifted the field: models like LLaMA (7B-65B parameters trained on 1-1.4T tokens) and Mistral follow Chinchilla-optimal or over-trained ratios, achieving strong performance at smaller sizes.

### Beyond Chinchilla

More recent work suggests that for inference-cost-optimal models (where you care about serving cost, not just training cost), it may be better to train smaller models on even more data than Chinchilla suggests. LLaMA 3 8B was trained on 15T tokens — nearly 2000× its parameter count.

---

## Context Windows and KV Cache

### Context Window

The context window is the maximum number of tokens the model can process at once. It determines:

- How much text can be provided as input
- How far back the model can "remember" during generation
- The maximum length of a single conversation or document

Context windows have grown dramatically:

| Model | Context Window |
|-------|---------------|
| GPT-2 (2019) | 1,024 tokens |
| GPT-3 (2020) | 2,048 tokens |
| GPT-4 (2023) | 8K / 32K / 128K tokens |
| Claude 3 (2024) | 200K tokens |
| Gemini 1.5 (2024) | 1M / 2M tokens |

### The KV Cache

During autoregressive generation, each new token requires attending to all previous tokens. Naively, this would require recomputing the key and value vectors for all previous tokens at each step. The **KV cache** stores these computed key and value vectors, so they only need to be computed once.

The KV cache grows linearly with sequence length and is often the memory bottleneck during inference:

```
KV cache memory = 2 × num_layers × num_heads × head_dim × seq_len × precision_bytes
```

For a 70B parameter model with 80 layers, 64 heads, and 128 head_dim, generating a 4K sequence with fp16:
```
2 × 80 × 64 × 128 × 4096 × 2 bytes ≈ 5.4 GB
```

This is per-request, so serving many concurrent users requires enormous GPU memory.

### KV Cache Optimization

Several techniques reduce KV cache memory:

- **Multi-Query Attention (MQA)**: All heads share the same K and V projections (used by PaLM, Falcon)
- **Grouped-Query Attention (GQA)**: K and V are shared among groups of heads (used by LLaMA 2 70B, Mistral)
- **Paged Attention (vLLM)**: Manages KV cache like virtual memory pages, reducing fragmentation
- **Sliding Window Attention**: Only cache the last N tokens (used by Mistral)

![Illustration of attention mechanism in neural networks](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Attention_mechanism_diagram.svg/500px-Attention_mechanism_diagram.svg.png)

---

## Mixture of Experts (MoE)

### Concept

Mixture of Experts is an architecture where the model has many "expert" sub-networks, but only activates a subset of them for each input token. This allows the total parameter count to be much larger than the number of parameters used for any single forward pass.

### How It Works

In a standard Transformer, each layer has a single feed-forward network (FFN). In an MoE Transformer, the FFN is replaced with multiple expert FFNs and a **router** (gating network):

```
MoE_Layer(x) = Σ G(x)_i · Expert_i(x)
```

Where G(x) is the router that selects the top-k experts for each token. Typically k=2, meaning each token is processed by 2 out of, say, 8 or 16 experts.

### Key Examples

- **Mixtral 8x7B**: 8 experts per layer, 2 active → 47B total params, ~13B active per token
- **GPT-4**: Rumored to be a large MoE model (~1.8T total, ~220B active)
- **DeepSeek-V3**: 671B total params, 37B active per token (256 experts, top-8 routing)

### Advantages

- **Training efficiency**: More parameters (capacity) for the same compute budget
- **Inference speed**: Only a fraction of parameters are active per token
- **Specialization**: Different experts can learn to handle different types of input

### Challenges

- **Load balancing**: Ensuring all experts are used roughly equally (auxiliary load-balancing losses)
- **Memory**: All expert weights must be in memory even though only a few are active
- **Communication overhead**: In distributed training, expert routing requires cross-device communication

---

## Transformer Block Details

A complete Transformer decoder block consists of:

```
Input
  → Layer Norm (Pre-Norm in modern architectures)
  → Multi-Head Causal Self-Attention
  → Residual Connection (add input back)
  → Layer Norm
  → Feed-Forward Network (FFN)
  → Residual Connection (add input back)
Output
```

### Feed-Forward Network

The FFN in each Transformer block is a simple two-layer MLP:

```
FFN(x) = activation(x W_1 + b_1) W_2 + b_2
```

Modern LLMs typically use:
- **SwiGLU activation** (LLaMA, Mistral): `SwiGLU(x) = Swish(x W_gate) ⊙ (x W_up)` — uses a gating mechanism
- **GELU activation** (GPT, BERT): A smooth approximation of ReLU
- **ReLU**: The classic activation, now less common in LLMs

The FFN is often 4× the model dimension (e.g., d_model=4096, d_ff=16384), and it accounts for roughly 2/3 of the model's parameters.

### Residual Connections

Residual (skip) connections add the input of each sub-layer directly to its output. This is critical for training deep networks — without residual connections, gradients would vanish or explode in networks with 32-128+ layers.

### Layer Normalization

Layer normalization normalizes the activations across the feature dimension (not the batch dimension like batch norm). Modern LLMs use **Pre-LayerNorm** (applying norm before each sub-layer) rather than the original **Post-LayerNorm**, as it provides more stable training.

**RMSNorm** (used by LLaMA, Mistral) is a simplified variant that only normalizes by the root mean square, omitting the mean centering:

```
RMSNorm(x) = x / RMS(x) · γ
```

---

## Emerging Architectural Innovations

### State Space Models (Mamba)

Mamba and other state space models (S4, H3) offer an alternative to attention with O(n) complexity instead of O(n²). They process sequences through a learned state transition:

```
h_t = A h_{t-1} + B x_t
y_t = C h_t
```

With selective state spaces (Mamba's key innovation), the state transition matrices can be input-dependent, giving them some of the expressiveness of attention. Mamba-based models show competitive performance with Transformers at smaller scales but have not yet matched them at the largest scales.

### Hybrid Architectures

Some models combine attention and state space layers (e.g., Jamba by AI21, which alternates Transformer and Mamba layers). This aims to get the best of both worlds: the expressiveness of attention for complex reasoning and the efficiency of state spaces for long sequences.

### Linear Attention

Various proposals replace the softmax attention kernel with linear kernels, reducing complexity from O(n²) to O(n). Examples include RWKV and RetNet. These models can be formulated as either recurrent networks (fast inference) or parallel attention (fast training).

![Deep learning neural network layers visualization](https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Neural_network_example.svg/640px-Neural_network_example.svg.png)

---

## Putting It All Together

A complete modern LLM (e.g., LLaMA 3 architecture) looks like:

```
Input Text
  → Tokenizer (BPE/SentencePiece) → Token IDs
  → Embedding Layer → Token Embeddings
  → + RoPE Positional Encoding
  → N × Transformer Decoder Blocks:
      → RMSNorm
      → Grouped-Query Causal Self-Attention (with RoPE, KV cache)
      → Residual Connection
      → RMSNorm
      → SwiGLU FFN
      → Residual Connection
  → RMSNorm
  → Linear Projection (vocab_size)
  → Softmax → Next Token Probabilities
```

The model generates text by:
1. Processing the full input prompt through all layers (prefill)
2. Sampling a next token from the output distribution
3. Appending the token to the sequence
4. Processing only the new token through all layers (using KV cache for previous tokens)
5. Repeat from step 2 until a stop condition is met

---

## Videos

- [Attention in Transformers, Visually Explained — 3Blue1Brown](https://www.youtube.com/watch?v=eMlx5fFNoYc)
- [Let's build GPT: from scratch, in code, spelled out — Andrej Karpathy](https://www.youtube.com/watch?v=kCc8FmEb1nY)

---

## References

1. Vaswani, A., et al. (2017). "Attention Is All You Need." *NeurIPS 2017*. https://arxiv.org/abs/1706.03762

2. Hoffmann, J., et al. (2022). "Training Compute-Optimal Large Language Models." (Chinchilla paper). https://arxiv.org/abs/2203.15556

3. Su, J., et al. (2021). "RoFormer: Enhanced Transformer with Rotary Position Embedding." https://arxiv.org/abs/2104.09864

4. Fedus, W., et al. (2022). "Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity." *JMLR*. https://arxiv.org/abs/2101.03961

5. Gu, A. & Dao, T. (2023). "Mamba: Linear-Time Sequence Modeling with Selective State Spaces." https://arxiv.org/abs/2312.00752
