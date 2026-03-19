# Sequence Models: RNNs, LSTMs, and the Path to Transformers

Language is inherently sequential. The meaning of a word depends on what came before it, and often what comes after. Modeling this sequential nature has been one of the central challenges in natural language processing. Recurrent Neural Networks (RNNs) were the first neural architecture to address sequence modeling directly, and their evolution through LSTMs, GRUs, and attention mechanisms laid the conceptual groundwork for the Transformer architecture that powers today's large language models.

## Recurrent Neural Networks: Processing Sequences

A standard feedforward neural network processes each input independently — it has no memory of previous inputs. This makes it unsuitable for language, where the interpretation of "it" depends on the nouns mentioned earlier in the sentence, and where the grammar of a clause depends on the structure that preceded it.

Recurrent Neural Networks solve this by introducing a hidden state that persists across time steps. At each step, the RNN takes two inputs: the current word (or token) and the hidden state from the previous step. It produces two outputs: an updated hidden state and an optional output. The hidden state acts as a compressed summary of everything the network has seen so far.

Formally, at time step t, the hidden state h_t is computed as h_t = f(W_x * x_t + W_h * h_{t-1} + b), where x_t is the current input, W_x and W_h are weight matrices, b is a bias term, and f is a nonlinear activation function (typically tanh). This recurrence allows the network to theoretically maintain information across arbitrarily long sequences.

RNNs were applied successfully to language modeling, part-of-speech tagging, named entity recognition, and sentiment analysis. Elman networks (simple RNNs) demonstrated that recurrent architectures could learn grammatical structure from raw text without explicit rules.

## The Vanishing Gradient Problem

In practice, simple RNNs struggle with long-range dependencies. During training via backpropagation through time (BPTT), gradients must flow backward through every time step. At each step, the gradient is multiplied by the recurrent weight matrix. If the largest eigenvalue of this matrix is less than 1, the gradient shrinks exponentially — it vanishes. If greater than 1, it explodes.

The vanishing gradient problem means that by the time error signals reach early time steps, they are negligibly small. The network cannot learn to connect a word at position 5 with a word at position 50. In practice, simple RNNs are limited to dependencies spanning roughly 10-20 time steps — far too short for real language understanding.

Sepp Hochreiter formally analyzed this problem in his 1991 diploma thesis, demonstrating mathematically why standard RNNs fail to learn long-range temporal dependencies. This analysis motivated the development of gated architectures that could selectively preserve information over long sequences.

## LSTM: Learning to Remember and Forget

Long Short-Term Memory (LSTM) networks, proposed by Hochreiter and Schmidhuber in 1997, solve the vanishing gradient problem through a gating mechanism. An LSTM cell maintains two state vectors: the hidden state h_t (short-term memory) and the cell state c_t (long-term memory). Three gates control information flow:

**The forget gate** decides what information to discard from the cell state. It takes the previous hidden state and current input, passes them through a sigmoid function, and produces values between 0 and 1 for each dimension of the cell state. A value near 0 means "forget this," and near 1 means "keep this."

**The input gate** decides what new information to store in the cell state. A sigmoid layer determines which values to update, while a tanh layer creates a vector of candidate values. Their element-wise product is added to the cell state.

**The output gate** determines what parts of the cell state to expose as the hidden state output. The cell state is passed through tanh (squashing values to [-1, 1]), then multiplied element-wise by the sigmoid output of the output gate.

The critical innovation is the cell state pathway. Information flows along the cell state with only linear interactions (addition and element-wise multiplication), creating a gradient highway that allows error signals to propagate across hundreds of time steps without vanishing. The gates learn when to write, read, and reset this long-term memory, providing the network with selective persistence.

LSTMs became the dominant architecture for virtually every sequence task: machine translation, speech recognition, text generation, music composition, and time series prediction. They remained the state of the art from roughly 2014 to 2017.

## GRU: A Simplified Alternative

The Gated Recurrent Unit (GRU), proposed by Cho et al. in 2014, simplifies the LSTM by merging the forget and input gates into a single update gate and combining the cell state and hidden state into one vector. This reduces the number of parameters and makes training faster.

A GRU uses two gates. The **update gate** controls how much of the previous hidden state to retain versus how much to overwrite with new candidate content. The **reset gate** determines how much of the previous hidden state to use when computing the candidate. When the reset gate is close to 0, the network behaves as if reading the first symbol of a new sequence, allowing it to drop irrelevant history.

In practice, GRUs perform comparably to LSTMs on most tasks while being faster to train. Neither architecture is consistently superior — the choice often depends on the specific dataset and task. Both share the fundamental insight that gating mechanisms enable learning over long sequences.

## Bidirectional RNNs

Standard RNNs process sequences in one direction — left to right. But in many NLP tasks, the meaning of a word depends on both its left and right context. "I need to book a flight" versus "I read a good book" — the word "book" requires right context for disambiguation.

Bidirectional RNNs (Schuster and Paliwal, 1997) address this by running two separate RNNs: one processing the sequence left-to-right and another processing it right-to-left. At each time step, the two hidden states are concatenated to form the output representation. This gives the network access to the entire sequence context for every position.

Bidirectional LSTMs (biLSTMs) combined this approach with LSTM cells and became the standard architecture for sequence labeling tasks. They powered state-of-the-art named entity recognition, POS tagging, and semantic role labeling systems throughout the mid-2010s.

## Sequence-to-Sequence with Attention

The sequence-to-sequence (seq2seq) framework, introduced by Sutskever et al. (2014), applies RNNs to tasks where both input and output are variable-length sequences — most notably machine translation. An encoder RNN reads the input sequence and compresses it into a fixed-length context vector (the final hidden state). A decoder RNN then generates the output sequence one token at a time, conditioned on this context vector.

The bottleneck is obvious: the entire input sequence must be compressed into a single vector. For long sentences, critical information is inevitably lost.

**Attention mechanisms** (Bahdanau et al., 2014) remove this bottleneck. Instead of relying on a single context vector, the decoder learns to attend to different parts of the encoder's output at each generation step. For each decoder step, an alignment score is computed between the decoder's current state and every encoder hidden state. These scores are normalized via softmax to produce attention weights, which are used to compute a weighted sum of encoder states — the context vector for that specific step.

This means the decoder can "look back" at the entire input sequence, focusing on the most relevant parts for each output word. When translating "The cat sat on the mat" to French, the decoder can attend to "cat" when generating "chat" and to "mat" when generating "tapis," regardless of their positions.

Attention was transformative. It improved translation quality dramatically, provided interpretable alignment matrices showing which input words influenced each output word, and removed the information bottleneck that limited fixed-length encoding.

## The Bridge to Transformers

The attention mechanism in seq2seq models attends from decoder states to encoder states — cross-attention. The key insight of the Transformer (Vaswani et al., 2017) was that attention could replace recurrence entirely. Self-attention allows each position in a sequence to attend to all other positions, capturing dependencies without any recurrence or convolution.

By removing recurrence, Transformers eliminated the sequential bottleneck that prevented RNNs from being parallelized during training. An LSTM must process token 50 before it can process token 51. A Transformer processes all tokens simultaneously, enabling training on vastly larger datasets with massively parallel hardware.

The progression from RNNs to LSTMs to attention to Transformers represents a continuous thread of innovation, where each advancement directly addressed the limitations of its predecessor. RNNs introduced sequence memory. LSTMs solved the vanishing gradient problem. Attention removed the information bottleneck. Transformers removed the sequential bottleneck. Together, they form the intellectual lineage of every modern language model.

## Relevance to Atlas UX

Atlas UX's AI agents are powered by Transformer-based language models, but the concepts from RNN and LSTM research remain directly relevant. The attention mechanisms that allow Lucy to understand long caller conversations descend from Bahdanau's work on seq2seq attention. The gating concepts from LSTMs influenced Transformer design decisions, including the gated linear units used in some modern architectures. Understanding this lineage helps the team evaluate model capabilities, diagnose failure modes related to long-context processing, and make informed decisions about model selection across Atlas UX's multi-provider AI stack.

## Resources

- https://arxiv.org/abs/1409.3215 — "Neural Machine Translation by Jointly Learning to Align and Translate" (Bahdanau et al., 2014), the attention mechanism paper
- https://colah.github.io/posts/2015-08-Understanding-LSTMs/ — "Understanding LSTM Networks" by Christopher Olah, the definitive visual explainer of LSTM internals

## Image References

1. "Recurrent Neural Network unrolled through time showing hidden state connections" — search: RNN unrolled through time diagram
2. "LSTM cell architecture diagram showing forget gate input gate output gate" — search: LSTM cell architecture gates diagram
3. "Vanishing gradient problem visualization showing diminishing gradients over time steps" — search: vanishing gradient problem RNN visualization
4. "Sequence-to-sequence encoder decoder architecture with attention mechanism" — search: seq2seq attention mechanism architecture diagram
5. "Comparison diagram of RNN LSTM GRU cell structures side by side" — search: RNN LSTM GRU comparison architecture diagram

## Video References

1. https://www.youtube.com/watch?v=LHXXI4-IEns — "Illustrated Guide to LSTM's and GRU's: A step by step explanation" — visual walkthrough of gated recurrent architectures
2. https://www.youtube.com/watch?v=SysgYptB198 — "Attention Mechanism in Neural Networks" — comprehensive explanation of attention from seq2seq to self-attention
