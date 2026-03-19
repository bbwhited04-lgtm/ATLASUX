# Language Modeling Fundamentals: From N-Grams to In-Context Learning

A language model is a probability distribution over sequences of words. Given a sequence of words, a language model assigns a probability to the next word — or to the entire sequence. This deceptively simple formulation underpins virtually every modern NLP application: machine translation, speech recognition, text generation, question answering, and conversational AI. Understanding how language models work, from classical n-gram models to modern large language models, is fundamental to understanding how Atlas UX's AI agents process and generate language.

## What Is a Language Model?

At its core, a language model estimates P(w_1, w_2, ..., w_n) — the probability of a sequence of words occurring. Using the chain rule of probability, this can be decomposed as:

P(w_1, w_2, ..., w_n) = P(w_1) * P(w_2|w_1) * P(w_3|w_1, w_2) * ... * P(w_n|w_1, ..., w_{n-1})

Each term estimates the probability of the next word given all preceding words. The history of language modeling is essentially the history of increasingly powerful ways to estimate these conditional probabilities.

Language models serve two distinct purposes. **Discriminative** use: evaluating the probability of existing text for tasks like speech recognition (which transcription is most probable?) and spelling correction (which word was intended?). **Generative** use: sampling new text by repeatedly predicting and selecting the next token, which powers chatbots, content generation, and conversational AI.

## N-Gram Models

The oldest and simplest language models are n-gram models. An n-gram model approximates the probability of a word by conditioning only on the previous n-1 words, discarding all earlier history:

P(w_t | w_1, ..., w_{t-1}) is approximated as P(w_t | w_{t-n+1}, ..., w_{t-1})

A bigram model (n=2) conditions on one previous word. A trigram (n=3) conditions on two. These probabilities are estimated by counting occurrences in a training corpus: P("mat" | "the") = count("the mat") / count("the").

N-gram models are fast, interpretable, and effective for short-range patterns. They powered speech recognition, machine translation, and text prediction systems for decades. However, they suffer from the **sparsity problem** — most n-grams never appear in training data, even for large corpora. Smoothing techniques (Laplace, Kneser-Kney, modified Kneser-Ney) redistribute probability mass from observed n-grams to unobserved ones, but the fundamental limitation remains: n-gram models cannot generalize to unseen word combinations, and extending context beyond 5-6 words becomes impractical due to exponential growth in the number of possible n-grams.

## Perplexity: Measuring Language Model Quality

Perplexity is the standard intrinsic evaluation metric for language models. It measures how "surprised" the model is by a test set. Formally, the perplexity of a model on a test sequence of N words is:

PP = exp(-1/N * sum(log P(w_i | context)))

A lower perplexity means the model assigns higher probabilities to the actual words — it is less "perplexed" by the test data. A model that perfectly predicted every word would have a perplexity of 1. A model that randomly guessed from a vocabulary of 50,000 words would have a perplexity of 50,000.

Perplexity allows comparison between models trained on the same data. However, it does not always correlate perfectly with downstream task performance — a model with lower perplexity on a news corpus might not perform better at answering medical questions. This gap between intrinsic and extrinsic evaluation motivated the development of task-specific benchmarks.

## Neural Language Models and Next-Token Prediction

Neural language models replace the count-based estimation of n-gram models with neural networks that can generalize across similar contexts. Bengio et al. (2003) proposed the first neural language model, using a feedforward network with learned word embeddings. This model could generalize — if it learned that "the dog ran" is probable, it could infer that "the cat ran" is also probable, because "dog" and "cat" have similar embeddings.

Recurrent neural language models (RNNLMs) extended this by using RNNs to condition on the entire preceding context, not just a fixed window. LSTM-based language models achieved state-of-the-art perplexity scores and powered applications from predictive text on smartphones to machine translation.

The modern paradigm is **autoregressive language modeling** (also called causal language modeling), where a model is trained to predict the next token given all preceding tokens. The GPT family (Generative Pre-trained Transformer) epitomizes this approach. During training, the model processes sequences left-to-right, with each position predicting the next token. A causal attention mask prevents each position from attending to future positions, ensuring the model can only "see" the past.

This simple objective — predict the next token — turns out to be extraordinarily powerful when scaled. A model that can accurately predict the next token in any context must implicitly understand grammar, facts, reasoning, style, and domain knowledge. This insight, championed by researchers like Ilya Sutskever, explains why scaling language model training produces increasingly capable AI systems.

## Masked Language Modeling: BERT's Approach

Not all language models are autoregressive. BERT (Bidirectional Encoder Representations from Transformers) uses **masked language modeling (MLM)**. During training, 15% of input tokens are randomly masked, and the model must predict the original token at each masked position. Unlike causal modeling, MLM allows the model to use both left and right context for each prediction.

This bidirectional approach makes BERT powerful for understanding tasks — given a sentence with context on both sides of a word, BERT can disambiguate meaning, identify entities, and classify sentiment more effectively than a left-to-right model. However, MLM is not naturally suited for text generation, since the model is trained to fill in blanks rather than extend sequences.

BERT is pre-trained on MLM and next-sentence prediction (determining whether two sentences are consecutive in the original text), then fine-tuned on specific downstream tasks. This pre-train/fine-tune paradigm demonstrated that a single model architecture, trained on generic text, could be adapted to virtually any NLP task by adding a thin task-specific layer on top.

## Zero-Shot, Few-Shot, and In-Context Learning

The most remarkable emergent property of large language models is their ability to perform tasks without explicit training on those tasks.

**Zero-shot learning** means the model performs a task it was never explicitly trained for, guided only by a natural language instruction. "Translate the following English text to French: The cat sat on the mat." A sufficiently large language model can produce a correct translation despite never being explicitly trained as a translation system. It learned to translate as a byproduct of predicting the next token across a diverse training corpus that included parallel text.

**Few-shot learning** provides the model with a small number of examples (typically 1-5) before the actual query. "Sentiment: 'Great movie!' -> Positive. 'Terrible service.' -> Negative. 'The food was amazing.' -> ?" The model infers the pattern from the examples and applies it to the new input.

**In-context learning (ICL)** is the broader phenomenon encompassing zero-shot and few-shot learning. The model learns the task specification from the prompt itself, without any weight updates. This is distinct from fine-tuning, where the model's parameters are adjusted. ICL enables a single model to serve as a general-purpose task solver, adapting its behavior based on instructions and examples provided at inference time.

The mechanism behind ICL is still debated. Some researchers argue that Transformers implicitly implement gradient descent in their forward pass — that the attention mechanism functionally performs a learning step using the in-context examples. Others suggest the model is pattern-matching against similar structures seen during pre-training. Regardless of mechanism, ICL is the capability that makes modern AI assistants practical.

## How Atlas UX Agents Use Language Models

Atlas UX's agents rely on language models at every level of operation. Lucy uses causal language models (GPT-4, Claude, DeepSeek) to understand caller intent, generate natural responses, and make decisions about appointment booking and message taking. The system leverages in-context learning extensively — Lucy's persona prompt, conversation history, and retrieved knowledge base context are all provided as part of the prompt, allowing the model to adapt its behavior without fine-tuning.

The engine loop uses language models for autonomous decision-making. When an agent needs to evaluate whether an action requires approval, compose a decision memo, or synthesize information from multiple sources, it formats the task as a prompt and uses the language model's in-context learning capability.

The multi-provider architecture (OpenAI, DeepSeek, OpenRouter, Cerebras, Anthropic) means Atlas UX can route different tasks to different models based on their strengths. Some models excel at reasoning (useful for the decision/approval workflow), others at generation speed (useful for real-time voice responses), and others at cost efficiency (useful for bulk knowledge base processing). Understanding the fundamentals of how these models work — next-token prediction, attention, and in-context learning — enables informed routing decisions.

Perplexity and related metrics also play a role in evaluating knowledge base quality. Documents that produce high perplexity under the embedding model may indicate poor-quality content, unusual formatting, or domain mismatch, flagging them for human review before ingestion.

## Resources

- https://arxiv.org/abs/2005.14165 — "Language Models are Few-Shot Learners" (Brown et al., 2020), the GPT-3 paper demonstrating in-context learning at scale
- https://arxiv.org/abs/1810.04805 — "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding" (Devlin et al., 2018)

## Image References

1. "N-gram language model probability chain diagram with bigram and trigram examples" — search: n-gram language model probability diagram
2. "BERT masked language modeling training illustration showing masked tokens" — search: BERT masked language modeling MLM diagram
3. "GPT autoregressive causal language modeling with attention mask visualization" — search: GPT causal language model autoregressive diagram
4. "Few-shot in-context learning prompt format example with demonstrations" — search: few-shot learning in-context learning GPT prompt example
5. "Perplexity comparison chart across different language model sizes and architectures" — search: language model perplexity comparison scaling chart

## Video References

1. https://www.youtube.com/watch?v=YDiSFS-yHwk — "Let's build GPT: from scratch, in code" by Andrej Karpathy — building a language model from first principles
2. https://www.youtube.com/watch?v=wjZofJX0v4M — "BERT Explained" — how masked language modeling and bidirectional pre-training work in practice
