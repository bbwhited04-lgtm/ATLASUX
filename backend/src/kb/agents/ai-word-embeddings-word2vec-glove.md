# Word Embeddings: From One-Hot Encoding to Contextual Representations

Word embeddings are one of the most consequential ideas in modern natural language processing. They provide a way to represent words as dense numerical vectors in a continuous space, where semantic relationships between words are encoded as geometric relationships between vectors. This article traces the development of word embeddings from the limitations of one-hot encoding through Word2Vec, GloVe, FastText, and into the era of contextual embeddings, explaining how each advance solved real problems in language understanding.

## The Problem with One-Hot Encoding

Before embeddings, the standard way to represent words for machine learning was one-hot encoding. Each word in a vocabulary of size V gets a vector of length V with a single 1 and V-1 zeros. "Cat" might be [0, 0, 1, 0, ...., 0] and "dog" might be [0, 0, 0, 1, ..., 0].

This representation has three fatal problems. First, the vectors are enormous — a vocabulary of 100,000 words requires 100,000-dimensional vectors. Second, every word is equidistant from every other word. The cosine similarity between any two one-hot vectors is zero, meaning "cat" is exactly as similar to "dog" as it is to "bankruptcy." Third, there is no generalization — learning something about "cat" tells the model nothing about "kitten" or "feline."

These limitations made it impossible for models to capture the rich semantic structure of language. A better representation was needed — one that placed semantically similar words near each other in a compact vector space.

## The Distributional Hypothesis

The theoretical foundation for word embeddings comes from the distributional hypothesis, articulated by linguist John Rupert Firth in 1957: "You shall know a word by the company it keeps." Words that appear in similar contexts tend to have similar meanings. "Doctor" and "physician" appear near similar words (patient, hospital, diagnosis), so they should have similar representations.

Early work on distributional semantics used co-occurrence matrices — counting how often words appear together within a window — and dimensionality reduction techniques like Singular Value Decomposition (SVD) to create dense word vectors. Latent Semantic Analysis (LSA) applied this approach to document-term matrices. These methods worked but were computationally expensive for large vocabularies and corpora.

## Word2Vec: The Neural Embedding Revolution

In 2013, Tomas Mikolov and colleagues at Google published Word2Vec, a method for learning word embeddings using shallow neural networks trained on large text corpora. Word2Vec was not the first neural approach to word embeddings — Bengio et al. (2003) had proposed neural language models that learned embeddings as a byproduct — but Word2Vec was dramatically faster and more scalable, making high-quality embeddings practical for the first time.

Word2Vec comes in two architectures:

**Continuous Bag of Words (CBOW)** predicts a target word from its surrounding context words. Given the sentence "The cat sat on the ___," CBOW uses the context words (the, cat, sat, on, the) to predict "mat." The model learns embeddings that make this prediction accurate.

**Skip-gram** does the reverse: given a target word, it predicts the surrounding context words. Given "sat," the model predicts that "cat," "on," "the," and "mat" are likely nearby words. Skip-gram tends to work better for rare words and smaller datasets.

Both architectures use a simple neural network with one hidden layer. The input and output are one-hot encoded words, and the hidden layer's weight matrix becomes the embedding matrix. Training uses negative sampling or hierarchical softmax to make computation tractable — instead of updating weights for all 100,000 vocabulary words, the model updates only a small sample of negative examples.

The resulting vectors exhibit remarkable algebraic properties. The classic example: vector("king") - vector("man") + vector("woman") produces a vector closest to vector("queen"). These analogies work across many relationship types — country-capital, verb tenses, comparative-superlative — suggesting the embeddings capture genuine linguistic structure.

## GloVe: Global Vectors for Word Representation

In 2014, Jeffrey Pennington, Richard Socher, and Christopher Manning at Stanford published GloVe (Global Vectors for Word Representation). While Word2Vec learns from local context windows, GloVe combines the benefits of local context methods with global co-occurrence statistics.

GloVe constructs a word-word co-occurrence matrix from the entire corpus, then factorizes it to produce word vectors. The key insight is that the ratio of co-occurrence probabilities between words encodes meaning. If "ice" co-occurs frequently with "solid" but rarely with "fashion," and "steam" co-occurs frequently with "gas" but rarely with "fashion," the ratio of these probabilities distinguishes the semantic relationships.

The GloVe objective function trains word vectors such that their dot product equals the logarithm of the words' co-occurrence probability. This produces embeddings that perform comparably to Word2Vec on analogy tasks while being more interpretable in terms of the statistics they capture.

## FastText: Subword Embeddings

Facebook AI Research (now Meta AI) released FastText in 2016, extending Word2Vec with subword information. Instead of learning a single vector for each word, FastText represents each word as a bag of character n-grams. The word "where" with n=3 becomes the character n-grams: <wh, whe, her, ere, re>, plus the whole word <where>.

This approach solves two problems. First, it handles out-of-vocabulary words — even if "unforgettable" was never seen during training, its representation can be constructed from its n-grams, many of which appeared in other words. Second, it naturally captures morphological relationships — "teach," "teacher," and "teaching" share n-grams and therefore have related embeddings.

FastText embeddings are particularly valuable for morphologically rich languages like Turkish, Finnish, and Arabic, where a single root can generate dozens of inflected forms.

## Contextual Embeddings: ELMo and Beyond

All the methods above produce static embeddings — each word gets exactly one vector regardless of context. But words are polysemous: "bank" means something different in "river bank" versus "bank account." Static embeddings must collapse all senses into a single point, losing critical information.

**ELMo** (Embeddings from Language Models), published by Peters et al. at AI2 in 2018, addressed this by generating word representations from a deep bidirectional LSTM language model. Instead of a fixed vector, ELMo produces a different embedding for each word based on its full sentential context. The representation for "bank" in "I deposited money at the bank" differs from its representation in "We walked along the river bank."

ELMo representations are computed as a weighted combination of all layers of the bidirectional LSTM. Different layers capture different types of information — lower layers encode syntax, higher layers encode semantics. This multi-layer approach proved highly effective, improving state-of-the-art results on six NLP benchmarks simultaneously.

ELMo was a bridge to the Transformer-based contextual embeddings that followed. BERT, GPT, and their successors all produce contextual representations, but using self-attention rather than recurrence. These models generate embeddings so rich that they can be fine-tuned for virtually any language task.

## How Embeddings Power Atlas UX

Atlas UX's knowledge retrieval system relies directly on embedding technology. When a caller asks Lucy a question, the system converts the query into an embedding vector, then searches the knowledge base for documents with similar embeddings. This semantic search finds relevant information even when the caller's words do not exactly match the stored text — because embeddings capture meaning, not just surface form.

The platform's multi-provider AI setup (OpenAI, DeepSeek, Anthropic, and others) all use contextual embeddings internally. Every token processed by Lucy's language models passes through embedding layers that encode its meaning in context. The quality of these embeddings directly determines the quality of Lucy's responses — her ability to understand caller intent, resolve ambiguity, and generate natural replies.

Embedding models also enable the knowledge base ingestion pipeline. When documents are chunked and indexed, each chunk is embedded and stored for retrieval-augmented generation (RAG). The choice of embedding model, chunk size, and similarity metric all affect retrieval quality, which in turn affects the accuracy and relevance of Lucy's answers during live calls.

## Resources

- https://arxiv.org/abs/1301.3781 — "Efficient Estimation of Word Representations in Vector Space" (Mikolov et al., 2013), the original Word2Vec paper
- https://nlp.stanford.edu/projects/glove/ — GloVe project page with papers, pre-trained vectors, and code from Stanford NLP

## Image References

1. "One-hot encoding versus dense word embedding vector comparison diagram" — search: one-hot encoding vs word embedding comparison
2. "Word2Vec CBOW and Skip-gram architecture neural network diagram" — search: word2vec CBOW skip-gram architecture diagram
3. "Word embedding 2D projection showing word clusters and semantic relationships" — search: word embedding t-SNE visualization semantic clusters
4. "GloVe co-occurrence matrix factorization illustration" — search: GloVe word vectors co-occurrence matrix diagram
5. "ELMo contextual embedding showing different representations for polysemous words" — search: ELMo contextual embeddings polysemy illustration

## Video References

1. https://www.youtube.com/watch?v=viZrOnJclY0 — "Word2Vec Explained" — clear visual walkthrough of how Word2Vec learns word embeddings
2. https://www.youtube.com/watch?v=QEaBAZQCtwE — "GloVe: Global Vectors for Word Representation" — Stanford NLP lecture covering GloVe's approach to learning word vectors
