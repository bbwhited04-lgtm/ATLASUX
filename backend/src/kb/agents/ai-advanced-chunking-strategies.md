# Advanced Chunking Strategies for RAG Systems

## Introduction

Chunking — the process of splitting documents into segments for embedding and retrieval — is arguably the most underappreciated component of a RAG pipeline. Get chunking right and your retrieval quality soars. Get it wrong and your LLM receives fragmented, context-free snippets that produce hallucinated or incomplete answers. The difference between a naive 500-token fixed split and a well-designed semantic chunking strategy can be the difference between a system that feels magical and one that feels broken. This article covers the major chunking approaches, their trade-offs, and how Atlas UX's KB architecture handles document segmentation.

## Fixed-Size Chunking

The simplest approach: split text into chunks of N tokens (or characters) with optional overlap. A typical configuration might use 512 tokens per chunk with 50 tokens of overlap between consecutive chunks.

**Advantages.** Dead simple to implement. Predictable chunk sizes make embedding cost estimation easy. Works well enough for homogeneous documents (e.g., FAQ lists, product descriptions) where each chunk is roughly self-contained.

**Disadvantages.** Fixed-size chunking is indifferent to document structure. It will happily split a sentence in half, separate a heading from its body text, or combine the end of one section with the beginning of another. The resulting chunks lack semantic coherence, leading to retrieval of fragments that answer half a question or contain irrelevant preamble from the previous section.

Overlap mitigates some boundary issues but introduces redundancy — the same text appears in multiple chunks, wasting embedding storage and potentially causing the same information to be retrieved multiple times.

## Recursive Character Splitting

LangChain popularized recursive character splitting, which applies a hierarchy of separators in order: first try to split on double newlines (paragraph boundaries), then single newlines, then sentences (periods followed by spaces), then words, and finally characters. The algorithm recursively splits on each separator level until chunks fall within the target size.

This approach preserves more document structure than fixed-size splitting because it preferentially breaks at natural boundaries. Paragraphs stay intact when possible; sentences stay intact when paragraphs are too large. It is the default chunking strategy in many RAG frameworks for good reason: it is simple, robust, and significantly better than naive fixed-size splitting.

**Limitations.** Recursive splitting still operates on syntactic boundaries (newlines, periods) rather than semantic boundaries (topic shifts). A single paragraph that discusses two unrelated topics will not be split, while two consecutive paragraphs about the same topic may be split apart if together they exceed the size limit.

## Semantic Chunking

Semantic chunking uses embeddings to identify natural topic boundaries within a document. The process typically works as follows: split the document into sentences, embed each sentence, compute cosine similarity between consecutive sentence embeddings, and identify points where similarity drops significantly — indicating a topic shift. These drop points become chunk boundaries.

Greg Kamradt's "semantic chunking" technique (widely referenced in the RAG community) uses this percentile-based breakpoint detection. Sentences with inter-sentence similarity below the Nth percentile (e.g., 25th percentile) mark chunk boundaries. The resulting chunks are semantically coherent — each chunk discusses a single topic or closely related topics.

**Advantages.** Chunks are more meaningful units of information. Retrieval quality improves because each chunk is topically focused, reducing the chance of retrieving partially relevant fragments. Chunk sizes vary naturally with content structure rather than being artificially constrained.

**Disadvantages.** Requires embedding every sentence during ingestion (additional compute cost). Sensitive to the similarity threshold — too high and you get tiny chunks, too low and you get chunks as large as original documents. Quality depends on the embedding model's ability to capture topic shifts. Does not work well for documents with highly uniform content (e.g., legal text where every paragraph uses similar vocabulary).

## Agentic Chunking

The most sophisticated approach uses an LLM to determine chunk boundaries. The LLM reads each proposition (sentence or paragraph) and decides whether it belongs with the current chunk or starts a new one, based on semantic understanding rather than statistical similarity.

In its full form, agentic chunking works iteratively: the LLM maintains a set of evolving chunks, each with a summary. For each new proposition, it evaluates whether the proposition fits an existing chunk (if so, append it and update the summary) or warrants a new chunk. This produces chunks that an expert human would recognize as natural document segments.

**Advantages.** Highest quality chunk boundaries. Each chunk is a coherent, self-contained unit of information. The LLM can handle complex cases like documents that interleave multiple topics, tables that span pages, or code examples that should stay with their explanatory text.

**Disadvantages.** Dramatically more expensive than other approaches — every proposition requires an LLM call. Slow for large document collections. Non-deterministic (different runs may produce slightly different chunks). Overkill for well-structured documents where recursive splitting suffices.

## Overlap Strategies

Regardless of the chunking method, overlap strategies significantly affect retrieval quality.

**Sliding window overlap.** The simplest approach: each chunk includes N tokens from the end of the previous chunk. Ensures that information near chunk boundaries is not lost. Typical overlap is 10-20% of chunk size.

**Sentence-level overlap.** Instead of token-based overlap, include the last 1-2 sentences of the previous chunk. Produces cleaner overlaps that do not split mid-sentence.

**Context windows.** Rather than overlapping adjacent chunks, prepend each chunk with a brief context string derived from the document structure: the document title, section heading, and summary. This preserves hierarchical context without redundant text.

## Metadata Enrichment

Raw text chunks lose the context that made them meaningful in the original document. Metadata enrichment restores that context by attaching structured information to each chunk.

**Essential metadata:** document title, section heading hierarchy, page number, creation date, source URL, document type.

**Derived metadata:** chunk summary (LLM-generated), key entities mentioned, topic classification, reading level, language.

**Structural metadata:** parent chunk ID (for hierarchical retrieval), next/previous chunk IDs (for sequential context), document-level summary.

Rich metadata enables filtered retrieval (e.g., "only search policy documents from the last year"), improves re-ranking (boosting chunks from authoritative sources), and provides the LLM with context about where the chunk fits in the broader document.

## Parent-Child Document Relationships

The parent-child (or small-to-big) retrieval strategy addresses a fundamental tension: small chunks are better for precise retrieval (less noise per chunk), but large chunks provide better context for the LLM to generate comprehensive answers.

The solution: embed small chunks (e.g., individual paragraphs) for retrieval but, when a small chunk is retrieved, return its parent chunk (e.g., the full section) to the LLM. This gives the LLM enough context to generate a complete answer while maintaining retrieval precision.

LlamaIndex implements this as the "Auto-Merging Retriever" — if enough child chunks from the same parent are retrieved, they are automatically merged into the parent chunk for the LLM context. This elegantly balances retrieval granularity with response quality.

## How Chunk Size Affects Retrieval Quality

Empirical studies consistently show that chunk size has a non-linear relationship with retrieval quality, and the optimal size depends on the use case.

**Small chunks (100-200 tokens):** Best for precise factual lookup. "What is Lucy's phone number?" only needs one sentence. But small chunks lose context, leading to ambiguous or incomplete answers for complex questions.

**Medium chunks (300-600 tokens):** The sweet spot for most RAG applications. Enough context for the LLM to understand the chunk's meaning, small enough for precise retrieval. Most frameworks default to this range.

**Large chunks (800-1500 tokens):** Better for analytical questions that require understanding broader context. But retrieval precision drops as more irrelevant text is included in each chunk, and fewer chunks fit in the LLM's context window.

The optimal strategy often combines multiple chunk sizes: small chunks for retrieval, medium or large chunks for LLM context, linked through parent-child relationships.

## Atlas UX's Chunking Architecture

Atlas UX's KB system uses context-enriched headers with [Tier][Category][Tags] metadata prefixed to each document. This approach functions as a built-in metadata enrichment strategy — every chunk carries its hierarchical classification (Tier 1 = core product knowledge, Tier 2 = industry context, Tier 3 = general reference), its category (billing, voice, scheduling, etc.), and semantic tags that enable filtered retrieval.

The KB ingestion pipeline (`kb:chunk-docs`) processes documents into Pinecone-ready vectors with these metadata fields preserved. This means retrieval can filter by tier (prioritize authoritative product knowledge over general reference), by category (only search voice-related documents for telephony questions), and by tags (narrow to specific subtopics).

This architecture could be further enhanced by implementing parent-child relationships between document chunks and their source articles, semantic chunking for long-form documents where recursive splitting may fragment topics, and document-level summaries that enable global queries without retrieving individual chunks.

## Conclusion

Chunking is not a preprocessing step to rush through — it is a core architectural decision that determines the ceiling of RAG quality. Fixed-size splitting is a baseline, not a solution. Recursive and semantic chunking handle most cases well. Agentic chunking produces the highest quality at the highest cost. And metadata enrichment, overlap strategies, and parent-child relationships transform isolated text fragments into a structured, navigable knowledge base that an LLM can reason over effectively.

## Resources

- https://www.pinecone.io/learn/chunking-strategies/ — Pinecone's comprehensive guide to chunking strategies for vector databases
- https://python.langchain.com/docs/how_to/#text-splitters — LangChain text splitting documentation covering recursive, semantic, and specialized splitters
- https://docs.llamaindex.ai/en/stable/module_guides/loading/node_parsers/ — LlamaIndex node parser documentation including semantic and hierarchical chunking

## Image References

1. "document chunking strategies comparison fixed recursive semantic agentic" — Side-by-side comparison of chunking approaches
2. "semantic chunking embedding similarity breakpoint detection visualization" — Sentence similarity graph with breakpoint detection
3. "parent child document retrieval small-to-big RAG strategy diagram" — Parent-child chunk relationship for hierarchical retrieval
4. "chunk size vs retrieval quality performance curve graph" — Performance curve showing optimal chunk size ranges
5. "metadata enrichment RAG chunk context document structure diagram" — Metadata-enriched chunk with structural context

## Video References

1. https://www.youtube.com/watch?v=8OJC21T2SL4 — "5 Levels of Text Splitting" by Greg Kamradt covering chunking from basic to advanced
2. https://www.youtube.com/watch?v=eRDBno1mNas — "Advanced RAG: Chunking Strategies" by James Briggs