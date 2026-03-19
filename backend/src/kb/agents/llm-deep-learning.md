# Deep Learning Foundations for Large Language Models

## Introduction

Large Language Models are built on the foundation of deep learning — the branch of machine learning that uses neural networks with many layers to learn hierarchical representations of data. Before an LLM can generate a single word, a vast body of mathematical machinery must be in place: gradient-based optimization, loss functions, regularization techniques, and distributed training infrastructure.

This article covers the deep learning foundations that underpin every modern LLM, from the basic mechanics of neural network training to the massive-scale infrastructure required to train models with hundreds of billions of parameters.

---

## Neural Network Basics

### Neurons and Layers

A neural network is composed of interconnected computational units called neurons, organized into layers:

- **Input layer**: Receives the raw input data (e.g., token embeddings)
- **Hidden layers**: Intermediate layers that transform the input through a series of learned operations
- **Output layer**: Produces the final prediction (e.g., probability distribution over vocabulary)

Each neuron computes a weighted sum of its inputs, adds a bias, and passes the result through a nonlinear activation function:

```
output = activation(Σ(w_i × x_i) + b)
```

Where:
- **x_i**: Input values
- **w_i**: Learned weights (how important each input is)
- **b**: Learned bias (a constant offset)
- **activation**: A nonlinear function that gives the network its expressive power

### Weights and Biases

Weights and biases are the **learnable parameters** of the network. When we say a model has 70 billion parameters, we primarily mean 70 billion weight and bias values that were adjusted during training.

Initially, weights are set to random values (using careful initialization schemes like Kaiming or Xavier initialization). During training, they are iteratively adjusted to minimize the loss function.

The weight matrices in a Transformer are enormous. For a model with d_model = 8192:
- Each attention head's Q, K, V projections: 8192 × 128 = ~1M parameters each
- The FFN up-projection: 8192 × 28672 = ~235M parameters
- Multiply by 80 layers, and the numbers add up fast

### Activation Functions

Activation functions introduce nonlinearity. Without them, a multi-layer network would be equivalent to a single linear transformation, regardless of depth.

**ReLU (Rectified Linear Unit)**:
```
ReLU(x) = max(0, x)
```
Simple and computationally efficient. Solved the vanishing gradient problem that plagued earlier activation functions like sigmoid and tanh. However, "dead neurons" (permanently stuck at 0) can be an issue.

**GELU (Gaussian Error Linear Unit)**:
```
GELU(x) = x × Φ(x)
```
Where Φ is the standard Gaussian CDF. Used in BERT, GPT-2, and GPT-3. Smoother than ReLU, which can help optimization.

**SiLU/Swish**:
```
SiLU(x) = x × σ(x)
```
Where σ is the sigmoid function. Used in many modern architectures.

**SwiGLU** (used in LLaMA, Mistral, and most modern LLMs):
```
SwiGLU(x, W_1, W_2, W_3) = (Swish(x W_1) ⊙ x W_3) W_2
```
A gated variant that uses an element-wise product of two linear transformations, one gated by a Swish activation. Empirically outperforms standard ReLU and GELU in Transformers.

![Diagram of a multi-layer neural network with labeled layers](https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_neural_network.svg/560px-Colored_neural_network.svg.png)

---

## Backpropagation and Gradient Descent

### The Training Loop

Training a neural network is an iterative optimization process:

1. **Forward pass**: Input data flows through the network to produce a prediction
2. **Loss computation**: The prediction is compared to the target using a loss function
3. **Backward pass (backpropagation)**: Gradients of the loss with respect to each parameter are computed by applying the chain rule of calculus, layer by layer, from output to input
4. **Parameter update**: Each parameter is adjusted in the direction that reduces the loss

This loop repeats for millions or billions of steps.

### Backpropagation

Backpropagation is the algorithm for efficiently computing gradients through the network. It leverages the chain rule of calculus:

```
∂L/∂w = ∂L/∂y × ∂y/∂z × ∂z/∂w
```

For a network with L layers, backpropagation computes all gradients in O(L) time by reusing intermediate computations. Without it, computing gradients would be intractable for deep networks.

Key challenges in backpropagation for deep networks:

- **Vanishing gradients**: Gradients shrink exponentially as they propagate through many layers, making early layers learn very slowly. Solved by residual connections, careful initialization, and normalization layers.
- **Exploding gradients**: Gradients grow exponentially, causing unstable training. Solved by gradient clipping (capping gradient norms at a maximum value).

### Gradient Descent Variants

**Stochastic Gradient Descent (SGD)**: Updates parameters using gradients computed on a small random subset (mini-batch) of the training data. Much faster than computing gradients over the entire dataset.

**Adam (Adaptive Moment Estimation)**: The most widely used optimizer for training LLMs. It maintains per-parameter learning rates based on first and second moments of the gradients:

```
m_t = β_1 m_{t-1} + (1 - β_1) g_t          # First moment (mean)
v_t = β_2 v_{t-1} + (1 - β_2) g_t²          # Second moment (variance)
θ_t = θ_{t-1} - lr × m̂_t / (√v̂_t + ε)     # Update
```

Typical hyperparameters for LLM training:
- Learning rate: 1e-4 to 3e-4 (with warmup and cosine decay)
- β_1 = 0.9, β_2 = 0.95
- Weight decay: 0.1
- Gradient clipping: 1.0

**AdamW**: A variant of Adam that decouples weight decay from the gradient update, providing more consistent regularization. This is what most LLM training runs actually use.

### Learning Rate Scheduling

The learning rate is not constant during training. A typical schedule for LLM training:

1. **Warmup**: Linearly increase the learning rate from 0 to the target value over the first ~2000 steps. This stabilizes early training.
2. **Cosine decay**: Gradually decrease the learning rate following a cosine curve until it reaches ~10% of the peak value.

```
lr(step) = lr_min + 0.5 × (lr_max - lr_min) × (1 + cos(π × step / total_steps))
```

This schedule has been shown empirically to produce better final model quality than constant learning rates.

![Gradient descent optimization on a loss surface](https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Gradient_descent.svg/512px-Gradient_descent.svg.png)

---

## Loss Functions

### Cross-Entropy Loss for Language Modeling

The standard loss function for training LLMs is **cross-entropy loss** (also called negative log-likelihood):

```
L = -Σ log P(x_t | x_1, ..., x_{t-1})
```

For each position in the sequence, the model outputs a probability distribution over the vocabulary (via softmax), and the loss is the negative log probability of the actual next token.

Intuitively, the loss is low when the model assigns high probability to the correct next token, and high when it assigns low probability.

### Perplexity

Perplexity is the exponentiated average cross-entropy loss:

```
PPL = exp(L)
```

It represents the "effective vocabulary size" the model is choosing from at each step. A perplexity of 10 means the model is as uncertain as if it were randomly choosing among 10 equally likely options.

Lower perplexity = better model. State-of-the-art LLMs achieve perplexities in the range of 5-15 on standard benchmarks.

### Masked Language Modeling Loss

Used by encoder models like BERT, where ~15% of tokens are randomly masked and the model must predict them:

```
L_MLM = -Σ_{i ∈ masked} log P(x_i | x_{not masked})
```

This allows bidirectional context (the model can look both forward and backward), which is advantageous for understanding tasks but incompatible with autoregressive generation.

### Auxiliary Losses

Some training setups use additional loss terms:

- **Load balancing loss** (MoE models): Encourages even distribution of tokens across experts
- **Z-loss**: Penalizes large logits before softmax, improving training stability
- **Auxiliary prediction losses**: Some architectures add prediction heads at intermediate layers

---

## Regularization

Regularization techniques prevent the model from overfitting — memorizing the training data rather than learning generalizable patterns.

### Dropout

During training, randomly set a fraction of neuron activations to zero:

```
h_dropped = h × mask    (where mask is Bernoulli with probability 1-p)
```

This forces the network to learn redundant representations and prevents co-adaptation of neurons. Typical dropout rates for LLMs: 0.0-0.1 (many modern LLMs use no dropout at all, relying on the massive dataset size for regularization).

### Weight Decay

Add a penalty proportional to the squared magnitude of the weights:

```
L_total = L_task + λ × Σ w_i²
```

This encourages smaller weights, which tend to produce smoother and more generalizable models. In AdamW, weight decay is applied directly to the weights rather than through the gradient:

```
w_t = (1 - lr × λ) × w_{t-1} - lr × gradient
```

Typical weight decay for LLMs: 0.1

### Layer Normalization

Layer normalization normalizes activations across the feature dimension for each example independently:

```
LayerNorm(x) = (x - μ) / (σ + ε) × γ + β
```

Where μ and σ are the mean and standard deviation across features, and γ and β are learnable scale and shift parameters.

**RMSNorm** (Root Mean Square Normalization) is a simplified variant used in LLaMA and Mistral:

```
RMSNorm(x) = x / √(mean(x²) + ε) × γ
```

It omits the mean centering, which reduces computation without hurting performance.

### Data Augmentation and Deduplication

For LLMs, the training data itself serves as a form of regularization:

- **Deduplication**: Removing duplicate documents prevents the model from memorizing repeated text
- **Data mixing**: Combining diverse data sources (web, books, code, scientific papers) encourages generalization
- **Quality filtering**: Removing low-quality text improves the signal-to-noise ratio

---

## Training Infrastructure

### GPUs (Graphics Processing Units)

GPUs are the workhorses of deep learning training. Their massively parallel architecture (thousands of cores) makes them ideal for the matrix multiplications at the heart of neural networks.

Key GPU families for LLM training:

| GPU | VRAM | FP16 TFLOPs | Year |
|-----|------|-------------|------|
| NVIDIA A100 | 40/80 GB | 312 | 2020 |
| NVIDIA H100 | 80 GB | 990 | 2022 |
| NVIDIA H200 | 141 GB | 990 | 2024 |
| NVIDIA B200 | 192 GB | 2250 | 2024 |
| AMD MI300X | 192 GB | 1300 | 2023 |

Training LLaMA 2 70B required ~1,720,320 A100 GPU-hours. GPT-4's training is estimated at ~$100M in compute costs.

### TPUs (Tensor Processing Units)

Google's custom AI accelerators, designed specifically for neural network workloads. TPU v4 pods can contain up to 4096 chips interconnected with high-bandwidth links. Google uses TPUs to train Gemini, PaLM, and other models.

### Distributed Training

Training a modern LLM requires distributing the workload across hundreds or thousands of GPUs. Key parallelism strategies:

**Data Parallelism**: Each GPU processes a different mini-batch, and gradients are averaged across GPUs. Simple but requires each GPU to hold a full copy of the model (doesn't work when the model doesn't fit in one GPU's memory).

**Tensor Parallelism**: Individual layers are split across GPUs. For example, a large matrix multiplication `Y = XW` can be split by partitioning W column-wise across GPUs. Requires high-bandwidth interconnects (NVLink, InfiniBand) due to frequent communication.

**Pipeline Parallelism**: Different layers are assigned to different GPUs. GPU 1 processes layers 1-10, GPU 2 processes layers 11-20, etc. The model is processed in "micro-batches" to keep all GPUs busy (otherwise, most GPUs would be idle while waiting for their input).

**FSDP (Fully Sharded Data Parallelism)**: Shards model parameters, gradients, and optimizer states across GPUs. Each GPU holds only a fraction of the model but gathers the full parameters when needed for computation. Used by PyTorch/Meta for training LLaMA.

**ZeRO (Zero Redundancy Optimizer)**: Similar to FSDP, developed by DeepSpeed (Microsoft). Eliminates memory redundancy by partitioning optimizer states (ZeRO-1), gradients (ZeRO-2), and parameters (ZeRO-3) across GPUs.

![Server rack with GPU computing hardware for deep learning](https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Nvidia_DGX-1_at_Explore_Science_Expo_2018.jpg/640px-Nvidia_DGX-1_at_Explore_Science_Expo_2018.jpg)

### Mixed Precision Training

Modern LLMs are trained using mixed precision — using lower precision number formats (FP16 or BF16) for most computations while keeping a FP32 master copy of the weights for accumulation:

- **FP32**: 32-bit floating point (full precision, used for weight updates)
- **FP16**: 16-bit floating point (half precision, used for forward/backward passes)
- **BF16**: Brain floating point 16 (same exponent range as FP32 but less mantissa precision, better numerical stability than FP16)

Mixed precision roughly doubles training throughput and halves memory usage compared to pure FP32.

### Gradient Checkpointing

To save GPU memory during training, gradient checkpointing discards intermediate activations during the forward pass and recomputes them during the backward pass. This trades compute for memory — typically a ~30% increase in training time for ~60% reduction in activation memory.

---

## Pre-Training Objectives

### Next-Token Prediction (Causal Language Modeling)

The dominant pre-training objective for modern LLMs. Given a sequence of tokens, predict the next token at each position:

```
L = -Σ_{t=1}^{T} log P(x_t | x_1, ..., x_{t-1})
```

This is self-supervised — no human labels are needed. The "labels" are just the next token in the sequence, which comes for free from the training data.

Why it works so well:
- Forces the model to understand grammar, semantics, facts, and reasoning patterns
- Every token in the training data provides a learning signal (no data is wasted)
- Naturally produces a model capable of text generation

### Masked Language Modeling (MLM)

Used by BERT and its variants. Randomly mask ~15% of tokens and predict them:

```
L = -Σ_{i ∈ masked} log P(x_i | x_{\masked})
```

Advantages: Bidirectional context. Disadvantages: Only ~15% of tokens provide a learning signal (less efficient), and the model cannot naturally generate text.

### Span Corruption (T5)

Replace random spans of text with sentinel tokens and train the model to reconstruct the original spans. This is a generalization of MLM that works well for encoder-decoder models.

### Prefix Language Modeling

A hybrid approach where part of the input is processed bidirectionally (the "prefix") and the rest is generated autoregressively. Used by some encoder-decoder models and in the UL2 framework.

### Denoising Objectives

BART and similar models are trained by corrupting text in various ways (deletion, masking, shuffling, rotation) and learning to reconstruct the original. This produces robust representations that are good for both understanding and generation.

---

## Training Data

### Scale and Composition

Modern LLMs are trained on datasets of unprecedented scale:

- **Common Crawl**: Petabytes of web text, filtered and deduplicated
- **Books**: Project Gutenberg, Books3, and other book corpora
- **Wikipedia**: High-quality encyclopedic text in many languages
- **Code**: GitHub, StackOverflow, and other programming resources
- **Scientific papers**: arXiv, PubMed, Semantic Scholar
- **Specialized corpora**: Legal documents, patents, math datasets

The data mixture (proportions of each source) significantly affects model capabilities. Models trained with more code are better at reasoning; models with more scientific text are better at technical tasks.

### Data Quality vs Quantity

The "garbage in, garbage out" principle applies strongly to LLM training. Key data quality considerations:

- **Deduplication**: Removing exact and near-duplicate documents (reduces memorization)
- **Quality filtering**: Removing low-quality web pages (using classifier-based or heuristic filtering)
- **Toxic content filtering**: Removing harmful, biased, or offensive content
- **PII scrubbing**: Removing personally identifiable information
- **Domain balancing**: Ensuring representation across topics and languages

### Tokenization and Preprocessing

Before training, raw text must be tokenized and organized into training sequences:

1. Apply the tokenizer to convert text to token IDs
2. Concatenate documents with special separator tokens
3. Split into fixed-length sequences (the context window size)
4. Shuffle sequences to prevent the model from learning document order
5. Organize into batches for parallel processing

![Data processing pipeline illustration](https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Pipeline_overview.png/640px-Pipeline_overview.png)

---

## Training Stability

Training large models is notoriously unstable. Common issues and solutions:

### Loss Spikes

Sudden increases in loss during training, often caused by:
- Bad data batches (corrupted or extremely unusual text)
- Numerical instability (overflow/underflow in attention scores)
- Learning rate too high

Solutions: gradient clipping, QK-norm (normalizing query and key vectors before attention), careful data filtering, and checkpoint rollback (returning to a checkpoint before the spike and skipping the problematic data).

### Gradient Clipping

Cap the global norm of the gradient vector at a maximum value (typically 1.0):

```
if ||g|| > max_norm:
    g = g × (max_norm / ||g||)
```

This prevents exploding gradients from destabilizing training.

### Warmup

Gradually increase the learning rate from 0 to the target value over the first few thousand steps. This allows the model's parameters and optimizer statistics to stabilize before full-speed training begins.

### Weight Initialization

Proper weight initialization is crucial for training stability. Common schemes:

- **Xavier/Glorot**: Scale weights by 1/√(fan_in) or 1/√((fan_in + fan_out)/2)
- **Kaiming/He**: Scale weights by √(2/fan_in), designed for ReLU activations
- **Small initialization**: Some modern LLMs scale initialization by 1/√(2 × num_layers) to account for the accumulation through residual connections

---

## From Pre-Training to Useful Models

Pre-training produces a base model that can complete text but is not yet a useful assistant. The path from base model to deployed LLM typically involves:

1. **Pre-training**: Learn language and knowledge from massive corpora (weeks to months)
2. **Supervised Fine-Tuning (SFT)**: Train on instruction-response pairs to teach the model to follow instructions (days)
3. **Alignment (RLHF/DPO)**: Optimize for human preferences — helpfulness, harmlessness, honesty (days)
4. **Evaluation**: Benchmark testing, human evaluation, red teaming
5. **Deployment**: Quantization, serving optimization, safety filters

Each stage builds on the previous one, and the quality of the final model depends on getting every stage right.

---

## Videos

- [Neural Networks: Zero to Hero — Andrej Karpathy](https://www.youtube.com/watch?v=VMj-3S1tku0)
- [Backpropagation calculus — 3Blue1Brown](https://www.youtube.com/watch?v=tIeHLnjs5U8)

---

## References

1. Rumelhart, D.E., Hinton, G.E., & Williams, R.J. (1986). "Learning representations by back-propagating errors." *Nature*, 323(6088), 533-536. https://doi.org/10.1038/323533a0

2. Kingma, D.P. & Ba, J. (2015). "Adam: A Method for Stochastic Optimization." *ICLR 2015*. https://arxiv.org/abs/1412.6980

3. Kaplan, J., et al. (2020). "Scaling Laws for Neural Language Models." OpenAI. https://arxiv.org/abs/2001.08361

4. Loshchilov, I. & Hutter, F. (2019). "Decoupled Weight Decay Regularization." *ICLR 2019*. https://arxiv.org/abs/1711.05101

5. Rajbhandari, S., et al. (2020). "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models." *SC 2020*. https://arxiv.org/abs/1910.02054
