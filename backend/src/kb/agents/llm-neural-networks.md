# Neural Networks Pertaining to Large Language Models

## Introduction

The journey from the earliest neural networks to modern LLMs spans decades of research, false starts, breakthroughs, and architectural innovations. Understanding this trajectory — and the specific neural network components that make LLMs work — provides essential context for developers building on top of these systems.

This article examines the neural network architectures that are directly relevant to LLMs: from the historical sequence models that preceded Transformers, to the specific neural network operations inside every Transformer block, to the emergent capabilities that arise when these networks are scaled to billions of parameters.

---

## Feed-Forward Networks in Transformer Blocks

### Structure and Purpose

Every Transformer block contains a feed-forward network (FFN), also called a multi-layer perceptron (MLP). In modern LLMs, the FFN is responsible for roughly two-thirds of the model's total parameters and plays a critical role in storing and retrieving factual knowledge.

The standard FFN architecture:

```
FFN(x) = W_2 · activation(W_1 · x + b_1) + b_2
```

Where:
- W_1 ∈ ℝ^{d_model × d_ff}: Projects from model dimension to a larger intermediate dimension
- W_2 ∈ ℝ^{d_ff × d_model}: Projects back down to model dimension
- d_ff is typically 4× d_model (e.g., d_model=4096, d_ff=16384)

### The FFN as a Key-Value Memory

Research by Geva et al. (2021) showed that FFN layers can be understood as key-value memories. Each row of W_1 acts as a "key" pattern, and the corresponding column of W_2 acts as the "value" — the information retrieved when that key is activated.

This perspective explains how LLMs store factual knowledge: specific patterns in the input activate specific rows of the FFN, which output the associated information. When the model "knows" that the capital of France is Paris, this knowledge is stored in the FFN weights.

### SwiGLU: The Modern FFN

Most modern LLMs (LLaMA, Mistral, Qwen, DeepSeek) use the SwiGLU variant:

```
SwiGLU(x) = (Swish(x W_gate) ⊙ x W_up) W_down
```

This uses three weight matrices instead of two, with a gating mechanism that allows the network to selectively pass or suppress information. Despite having 50% more parameters per layer, SwiGLU consistently outperforms standard FFNs, so the intermediate dimension is typically reduced to compensate (e.g., d_ff = 8/3 × d_model instead of 4× d_model).

### Feed-Forward as Computation Steps

Each FFN layer can be thought of as a discrete "computation step" that transforms the residual stream. The attention mechanism moves information between token positions (inter-token processing), while the FFN processes information at each position independently (intra-token processing).

This alternation — attention for routing information, FFN for processing information — is the fundamental rhythm of the Transformer.

![Diagram showing the structure of a feed-forward neural network](https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_neural_network.svg/560px-Colored_neural_network.svg.png)

---

## Recurrent Neural Networks: Historical Context

### Basic RNN

Before Transformers, sequence modeling was the domain of Recurrent Neural Networks (RNNs). An RNN processes sequences one token at a time, maintaining a hidden state that is updated at each step:

```
h_t = tanh(W_hh · h_{t-1} + W_xh · x_t + b)
y_t = W_hy · h_t
```

The hidden state h_t serves as the model's "memory" of everything it has seen so far. Information from early tokens must be passed forward through every subsequent step to influence later processing.

### The Vanishing Gradient Problem

The fundamental flaw of vanilla RNNs: during backpropagation through time (BPTT), gradients are multiplied by the recurrent weight matrix at each time step. Over many steps, gradients either vanish (if the matrix's largest eigenvalue < 1) or explode (if > 1).

The practical consequence: RNNs struggle to learn dependencies spanning more than ~10-20 tokens. For language modeling, where dependencies can span hundreds of tokens (pronoun references, topic coherence, narrative structure), this is crippling.

### Long Short-Term Memory (LSTM)

Hochreiter and Schmidhuber (1997) introduced the LSTM to solve the vanishing gradient problem. The key innovation: a **cell state** that flows through time with minimal modification, controlled by learned gates.

An LSTM has three gates:

```
f_t = σ(W_f · [h_{t-1}, x_t] + b_f)    # Forget gate: what to erase
i_t = σ(W_i · [h_{t-1}, x_t] + b_i)    # Input gate: what to write
o_t = σ(W_o · [h_{t-1}, x_t] + b_o)    # Output gate: what to read

c̃_t = tanh(W_c · [h_{t-1}, x_t] + b_c) # Candidate cell state
c_t = f_t ⊙ c_{t-1} + i_t ⊙ c̃_t       # Updated cell state
h_t = o_t ⊙ tanh(c_t)                   # Output hidden state
```

The cell state provides a "highway" for gradients to flow through time without repeated multiplication, alleviating (though not fully solving) the vanishing gradient problem. LSTMs can learn dependencies spanning ~100-200 tokens.

### Gated Recurrent Unit (GRU)

Cho et al. (2014) introduced the GRU as a simplified alternative to the LSTM. It combines the forget and input gates into a single "update gate" and merges the cell state and hidden state:

```
z_t = σ(W_z · [h_{t-1}, x_t])           # Update gate
r_t = σ(W_r · [h_{t-1}, x_t])           # Reset gate
h̃_t = tanh(W · [r_t ⊙ h_{t-1}, x_t])   # Candidate hidden state
h_t = (1 - z_t) ⊙ h_{t-1} + z_t ⊙ h̃_t  # Updated hidden state
```

GRUs have fewer parameters than LSTMs and train faster, with roughly comparable performance on most tasks.

### Bidirectional RNNs

Standard RNNs only see past context. Bidirectional RNNs run two separate RNNs — one forward, one backward — and concatenate their hidden states. This allows each position to access both past and future context, which is beneficial for understanding tasks (like named entity recognition) but incompatible with autoregressive generation.

ELMo (2018) used a bidirectional LSTM to produce contextualized word embeddings, demonstrating the power of pre-trained language representations. It was a key stepping stone to Transformers.

![Illustration of recurrent neural network unfolded through time](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Recurrent_neural_network_unfold.svg/800px-Recurrent_neural_network_unfold.svg.png)

---

## Why Transformers Replaced RNNs

The Transformer's dominance over RNNs comes down to three fundamental advantages:

### 1. Parallelizability

RNNs process tokens sequentially — each token's computation depends on the previous token's hidden state. This means the computation cannot be parallelized across the sequence dimension during training. For a sequence of length T, the RNN requires T sequential steps.

Transformers compute attention over all positions simultaneously. The entire sequence is processed in parallel during training. This makes Transformers dramatically faster to train on modern GPU hardware, which excels at large matrix multiplications but is inefficient at sequential operations.

### 2. Direct Long-Range Dependencies

In an RNN, information from token t=1 must pass through every intermediate hidden state to reach token t=1000. At each step, the information is compressed, transformed, and potentially lost.

In a Transformer, token t=1000 can directly attend to token t=1 through the attention mechanism. The information path length is O(1) — a single attention operation — regardless of distance. This makes Transformers far better at capturing long-range dependencies.

### 3. Scalability

The attention mechanism's O(n²) complexity in sequence length is a concern, but it is offset by the massive parallelism available. In practice, Transformers scale to much larger model sizes and datasets than RNNs ever could:

- The largest LSTM-based language models had ~1-2B parameters
- Transformer-based LLMs now exceed 1 trillion parameters

The scaling laws that drive LLM improvement (more parameters + more data = better performance) were discovered on Transformers and do not appear to hold as cleanly for RNNs.

### The Full Picture

```
RNN advantages:     O(1) per-token computation, O(n) total memory
RNN disadvantages:  Sequential (slow training), poor long-range deps

Transformer advantages:  Parallel (fast training), direct long-range deps
Transformer disadvantages: O(n²) attention, O(n) KV cache per layer
```

The trade-off is clear: Transformers sacrifice per-token efficiency for massively better trainability and representation quality. For modern hardware and data scales, this is the right trade-off.

---

## Attention as a Neural Network Operation

### Attention Is Differentiable Routing

Attention can be understood as a **differentiable routing mechanism**. Unlike a fixed network topology (where information always flows through the same connections), attention dynamically routes information based on the content of the input.

At each layer, the attention mechanism decides:
- Which tokens should send information to which other tokens
- How much information to send
- What information to send

These decisions are made based on learned projections (Q, K, V matrices) applied to the current representations. The result is a content-dependent, input-specific computation graph that is different for every input.

### Attention Patterns

Different attention heads learn different patterns:

- **Positional heads**: Attend to specific relative positions (e.g., always attend to the previous token)
- **Syntactic heads**: Attend along syntactic dependency paths (subject to its verb)
- **Semantic heads**: Attend to semantically related tokens
- **Induction heads**: Detect and continue patterns (if "A B ... A" appeared, predict "B" next)
- **Rare token heads**: Attend to unusual or surprising tokens

Research by Olsson et al. (2022) identified "induction heads" as a key mechanism for in-context learning. These heads implement a simple but powerful algorithm: find a previous occurrence of the current token, look at what came next, and predict it will come next again.

### Multi-Head Attention as an Ensemble

Multi-head attention can be viewed as an ensemble of attention mechanisms. Each head operates in a lower-dimensional subspace (d_head = d_model / num_heads), attending to different aspects of the input. The outputs are concatenated and projected, combining the diverse information gathered by each head.

This is why increasing the number of heads (up to a point) improves model quality — more heads mean more diverse attention patterns and richer information routing.

![Attention mechanism with query, key, and value vectors](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Attention_mechanism_diagram.svg/500px-Attention_mechanism_diagram.svg.png)

---

## Embedding Layers and Representation Learning

### Token Embeddings

The first layer of any LLM is an embedding layer that converts discrete token IDs into dense, continuous vectors:

```
embedding = E[token_id]    # E ∈ ℝ^{vocab_size × d_model}
```

For a model with vocabulary size 32,000 and d_model 4,096, the embedding matrix has 131M parameters. For larger vocabularies (100K+), the embedding matrix alone can have billions of parameters.

The embedding matrix is learned during training. Initially random, the vectors are adjusted so that semantically similar tokens end up with similar embeddings. After training:

- "king" and "queen" will have similar embeddings
- "cat" and "dog" will be closer than "cat" and "democracy"
- Relationships will be encoded as directions (e.g., "king" - "man" + "woman" ≈ "queen")

### Contextualized Representations

A key innovation of Transformer-based LLMs over earlier approaches (word2vec, GloVe) is **contextualized representations**. In word2vec, each word has a single fixed embedding regardless of context. In a Transformer, the representation of each token changes at every layer based on its context:

- Layer 0 (embedding): "bank" has the same representation in "river bank" and "bank account"
- Layer 12: "bank" has very different representations in these two contexts

By the final layer, each token's representation encodes rich information about its role, meaning, and relationships within the specific input.

### Representation Learning

Representation learning is the process of automatically discovering useful features from raw data. In LLMs, the model learns to represent:

- **Syntactic features**: Part of speech, grammatical role, dependency structure
- **Semantic features**: Meaning, topic, sentiment
- **World knowledge**: Facts, relationships, common sense
- **Task-specific features**: How to follow instructions, how to reason step by step

These representations are not explicitly taught — they emerge from the next-token prediction objective on diverse training data.

### The Residual Stream

A crucial concept for understanding how information flows through a Transformer is the **residual stream** (Elhage et al., 2021). Due to residual connections, each layer adds its output to the running stream rather than replacing it:

```
x_1 = x_0 + Attention(x_0)
x_2 = x_1 + FFN(x_1)
x_3 = x_2 + Attention(x_2)
...
```

This means the final representation is the sum of the original embedding plus all the updates from every attention and FFN layer. Each layer reads from and writes to this shared residual stream, enabling a form of communication across layers.

---

## Parameter Counts and What They Mean

### Where Do the Parameters Live?

For a typical Transformer LLM, parameters are distributed as follows:

| Component | Formula | % of Total |
|-----------|---------|------------|
| Embedding | vocab_size × d_model | ~2-5% |
| Attention (Q, K, V, O) | 4 × d_model² × num_layers | ~33% |
| FFN (gate, up, down) | 3 × d_model × d_ff × num_layers | ~65% |
| LayerNorm | 2 × d_model × 2 × num_layers | <1% |
| LM Head | d_model × vocab_size (often tied with embedding) | 0-5% |

For LLaMA 2 70B specifically:
- 80 layers, 64 heads, d_model = 8192, d_ff = 28672
- Attention parameters: ~21.5B
- FFN parameters: ~45.1B
- Embedding + LM Head: ~1.3B
- Total: ~68.9B (rounded to 70B)

### What More Parameters Mean

More parameters generally mean:

1. **More knowledge capacity**: The model can store more facts and patterns in its FFN weights
2. **Better reasoning**: More layers and attention heads enable more complex multi-step computation
3. **Better generalization**: Larger models tend to make fewer errors on novel inputs
4. **Diminishing returns**: Each doubling of parameters gives a smaller improvement

The relationship between parameters and performance follows power laws (the scaling laws discussed in the architecture article). Roughly, loss ∝ N^(-0.076), meaning you need to 10× the parameters to halve the loss improvement.

### Parameters vs Active Parameters (MoE)

In Mixture of Experts models, the total parameter count is much larger than the number of parameters active for any single token:

- **DeepSeek-V3**: 671B total parameters, 37B active per token
- **Mixtral 8x7B**: 47B total parameters, 13B active per token

This means MoE models have the knowledge capacity of a much larger model but the inference cost of a much smaller one.

![Visualization of neural network parameters as a weight matrix](https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Neural_network_example.svg/640px-Neural_network_example.svg.png)

---

## Emergent Capabilities at Scale

### What Is Emergence?

Emergence refers to capabilities that appear in large models but are absent in smaller ones, despite both being trained with the same objective and data. The transition is often sharp — a capability goes from near-zero to near-perfect over a small range of model sizes.

This phenomenon is one of the most fascinating and debated aspects of modern LLMs.

### Examples of Emergent Capabilities

**Chain-of-thought reasoning**: Models below ~10B parameters show minimal improvement when prompted to "think step by step." Above ~100B parameters, chain-of-thought prompting dramatically improves performance on math, logic, and multi-step reasoning tasks.

**In-context learning**: The ability to learn new tasks from a few examples provided in the prompt (few-shot learning) emerges at scale. GPT-3 (175B) demonstrated that LLMs could perform tasks they were never explicitly trained on, simply by being shown a few examples.

**Instruction following**: The ability to follow complex, multi-step natural language instructions improves dramatically with scale and with instruction tuning.

**Code generation**: While small models can produce syntactically valid code, the ability to generate functionally correct code for complex tasks is an emergent capability of larger models.

**Multilingual transfer**: Training on one language improves performance in other languages. This cross-lingual transfer becomes stronger with scale.

**Self-correction**: Larger models can identify and correct their own errors when prompted to review their work. Smaller models tend to double down on mistakes.

### The Debate About Emergence

Some researchers argue that emergence is an artifact of how we measure performance (discrete metrics like exact match can show sharp transitions even when underlying capability improves smoothly). Wei et al. (2022) documented many emergent capabilities, while Schaeffer et al. (2023) argued that apparent emergence disappears with continuous metrics.

The practical reality: regardless of whether emergence is "real" in a theoretical sense, there are clear qualitative differences between small and large models that matter enormously for applications.

### Phase Transitions in Training

Emergence is not only a function of model size — it also occurs during training. Specific capabilities can appear suddenly after many training steps, often coinciding with the model learning key algorithmic subroutines (like induction heads for in-context learning).

Olsson et al. (2022) showed that in-context learning ability improves sharply when induction heads form during training, and that this transition happens at a specific phase in training that is consistent across different model sizes.

---

## From Theory to Practice

### Implications for Application Developers

Understanding neural network internals matters for practical LLM usage:

1. **Model selection**: Knowing that larger models have more knowledge capacity and better reasoning helps choose the right model for a task
2. **Prompt engineering**: Understanding attention patterns explains why putting important information at the beginning or end of the prompt works better than burying it in the middle
3. **Token limits**: Understanding tokenization explains why some text is "cheaper" than other text and why different models count tokens differently
4. **Fine-tuning decisions**: Understanding which parameters store what kind of knowledge helps decide whether to fine-tune the full model or use LoRA on specific layers
5. **Failure modes**: Understanding that LLMs are pattern matchers operating on tokens explains why they fail at arithmetic, struggle with negation, and can be "tricked" by adversarial prompts

### The Path Forward

The neural network foundations of LLMs continue to evolve:

- **Sparse architectures** (MoE) are making models more efficient
- **State space models** (Mamba) are challenging the Transformer's dominance for certain tasks
- **Hybrid architectures** combine the strengths of different approaches
- **Mechanistic interpretability** is revealing what individual neurons and circuits actually compute
- **Retrieval augmentation** (RAG) is addressing the limitations of parametric memory

---

## Videos

- [But what is a neural network? — 3Blue1Brown](https://www.youtube.com/watch?v=aircAruvnKk)
- [Illustrated Guide to Transformers — StatQuest with Josh Starmer](https://www.youtube.com/watch?v=zxQyTK8quyY)

---

## References

1. Hochreiter, S. & Schmidhuber, J. (1997). "Long Short-Term Memory." *Neural Computation*, 9(8), 1735-1780. https://doi.org/10.1162/neco.1997.9.8.1735

2. Geva, M., et al. (2021). "Transformer Feed-Forward Layers Are Key-Value Memories." *EMNLP 2021*. https://arxiv.org/abs/2012.14913

3. Olsson, C., et al. (2022). "In-context Learning and Induction Heads." *Transformer Circuits Thread*. https://arxiv.org/abs/2209.11895

4. Wei, J., et al. (2022). "Emergent Abilities of Large Language Models." *TMLR*. https://arxiv.org/abs/2206.07682

5. Elhage, N., et al. (2021). "A Mathematical Framework for Transformer Circuits." *Transformer Circuits Thread*, Anthropic. https://transformer-circuits.pub/2021/framework/index.html
