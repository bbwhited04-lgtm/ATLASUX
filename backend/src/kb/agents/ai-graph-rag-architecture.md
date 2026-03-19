# GraphRAG: Knowledge Graphs Meet Retrieval-Augmented Generation

## Introduction

Vanilla RAG has a dirty secret: it works brilliantly for questions that can be answered by a single document chunk but falls apart when questions require synthesizing information across multiple sources, understanding relationships between entities, or producing global summaries over large corpora. Microsoft Research's GraphRAG architecture, published in 2024, addresses these limitations by combining knowledge graph construction with hierarchical summarization, producing a retrieval system that handles both local factual queries and global analytical questions with dramatically better quality than traditional vector-based RAG.

## The Limitations of Vanilla RAG

Standard RAG follows a straightforward pipeline: ingest documents, split them into chunks, embed each chunk as a vector, store in a vector database, and at query time retrieve the top-k most similar chunks and pass them to an LLM as context. This approach revolutionized how LLMs access external knowledge but has well-documented failure modes.

**Multi-hop reasoning failures.** "Who founded the company that acquired the startup that built the technology used in Product X?" requires traversing a chain of relationships across multiple chunks. Vector similarity retrieval returns chunks individually, with no awareness of how they connect.

**Global queries.** "What are the main themes in this 10,000-page regulatory corpus?" cannot be answered by any single chunk or small set of chunks. The answer requires aggregating information across the entire corpus.

**Entity disambiguation.** When multiple chunks mention "Smith" — is that the customer Smith, the competitor Smith.ai, or the internal tool? Without entity resolution, retrieved chunks may confuse the LLM.

**Relationship blindness.** "How does Policy A interact with Policy B?" requires understanding the relationship between two specific entities. Vector retrieval optimizes for semantic similarity to the query, not for capturing relationships between entities mentioned in different chunks.

## How GraphRAG Works

Microsoft's GraphRAG pipeline operates in two phases: an indexing phase that builds a knowledge graph from the source documents, and a query phase that leverages the graph structure for more intelligent retrieval.

### Indexing Phase

**Entity and Relationship Extraction.** An LLM processes each text chunk and extracts entities (people, organizations, concepts, locations) and the relationships between them. Each entity gets a type, a description, and references back to the source text. Each relationship gets a description and a weight indicating its importance.

**Graph Construction.** Extracted entities and relationships are assembled into a knowledge graph. Entity resolution merges duplicate references (e.g., "Microsoft," "MSFT," and "the Redmond company" resolve to the same node). The result is a connected graph where nodes are entities and edges are typed relationships.

**Community Detection.** The Leiden algorithm (a refined version of the Louvain method) partitions the graph into communities — clusters of densely connected entities. These communities correspond to natural topic areas in the source documents. The algorithm operates hierarchically, producing communities at multiple levels of granularity: fine-grained clusters of closely related entities and coarse-grained clusters of broader themes.

**Community Summarization.** An LLM generates summaries for each community at each hierarchy level. A low-level community might summarize "ElevenLabs voice synthesis integration with webhook-based appointment booking." A higher-level community might summarize "Voice AI technology stack and telephony integrations." These summaries serve as pre-computed answers to global queries about the corpus.

### Query Phase

GraphRAG supports two query modes:

**Local Search.** For specific factual questions, the system identifies relevant entities in the query, retrieves their neighborhoods from the graph (connected entities, relationships, associated text chunks, and community summaries), and passes this structured context to the LLM. The graph structure ensures that related information is retrieved together, even if it appears in distant document chunks.

**Global Search.** For broad analytical questions, the system retrieves community summaries at the appropriate hierarchy level, synthesizes them through map-reduce LLM calls (each summary generates partial answers, which are then combined), and produces a comprehensive response that spans the entire corpus. This is impossible with vanilla RAG, which has no mechanism for corpus-wide summarization.

## Advantages Over Vanilla RAG

The performance differences are substantial. Microsoft's evaluation on the Podcast Transcripts dataset showed that GraphRAG's global search mode produced answers that were rated 70-80% better than vanilla RAG on comprehensiveness and diversity for global sensemaking queries. Local search performance matched or exceeded vanilla RAG on factual queries while providing better relationship awareness.

**Multi-hop reasoning.** Graph traversal naturally follows relationship chains. Finding "the supplier of the company that partnered with our client" is a two-hop graph query, not a vector similarity search.

**Holistic understanding.** Community summaries provide pre-computed global perspectives at multiple granularity levels. The system does not need to retrieve and process all documents to answer "what are the main themes" — it already has hierarchical summaries available.

**Provenance and explainability.** Every answer traces back through specific graph paths to source documents. The reasoning chain is explicit: "Entity A is related to Entity B through Relationship R, as described in Source S."

**Deduplication and consistency.** Entity resolution during indexing ensures that the same concept is not retrieved multiple times under different names, reducing context window waste and improving answer consistency.

## Implementation Considerations

GraphRAG's power comes at a cost. The indexing phase requires significantly more LLM calls than vanilla RAG (entity extraction, relationship extraction, entity resolution, and community summarization all involve LLM inference). Microsoft's reference implementation uses GPT-4 or equivalent models for extraction, making indexing expensive for large corpora.

Storage requirements are also higher: the system maintains the original text chunks, the extracted knowledge graph, community structures at multiple levels, and pre-computed summaries. However, query-time costs are often lower than naive RAG because the pre-computed summaries reduce the need for runtime processing.

The open-source reference implementation (github.com/microsoft/graphrag) uses a local file-based approach but can be adapted to use Neo4j, Azure Cognitive Search, or other backends for production deployments. Several community forks have added support for open-source LLMs, reducing the dependency on GPT-4 for indexing.

## Atlas UX's Knowledge Architecture

Atlas UX's KB system uses a tiered namespace structure that approximates some GraphRAG principles without formal graph construction. Documents are organized with [Tier][Category][Tags] headers that create an implicit hierarchy. The tiered structure (Tier 1 = core product knowledge, Tier 2 = industry context, Tier 3 = general reference) mirrors GraphRAG's community hierarchy — queries about product specifics route to Tier 1, while broader industry questions can draw from Tier 2-3.

The platform's Pinecone-based vector retrieval handles local search effectively. Where GraphRAG principles could add the most value is in global queries (e.g., "summarize all known issues with HVAC scheduling across all tenants") and multi-hop reasoning (e.g., "which tenants use the same CRM as the tenant that reported the booking conflict?"). Implementing entity extraction over KB documents and building explicit relationship graphs would unlock these capabilities.

A pragmatic path forward: rather than full GraphRAG indexing, Atlas UX could implement lightweight entity extraction during KB ingestion, storing entity-relationship triples alongside existing vector embeddings. Query-time graph traversal would complement vector retrieval for relationship-aware questions, while pre-computed category summaries would enable global queries without processing the entire corpus at runtime.

## The Future of Graph-Augmented RAG

The field is evolving rapidly. LlamaIndex and LangChain both offer GraphRAG integrations. Knowledge graph construction is becoming cheaper as smaller, faster models prove capable of entity extraction. And the convergence of property graph databases (Neo4j) with vector search capabilities means a single database can serve both graph traversal and similarity search.

The trend is clear: the next generation of RAG systems will not choose between structured and unstructured retrieval. They will combine both, using knowledge graphs for relationship-aware reasoning and vector search for semantic flexibility — a hybrid approach that captures the best of both worlds.

## Resources

- https://microsoft.github.io/graphrag/ — Microsoft GraphRAG official documentation and reference implementation
- https://arxiv.org/abs/2404.16130 — "From Local to Global: A Graph RAG Approach to Query-Focused Summarization" (Microsoft Research paper)
- https://neo4j.com/developer-blog/global-graphrag-neo4j-langchain/ — Neo4j + LangChain GraphRAG integration guide

## Image References

1. "GraphRAG architecture pipeline entity extraction community detection summarization" — End-to-end GraphRAG indexing pipeline diagram
2. "knowledge graph community detection Leiden algorithm clustering visualization" — Graph community detection and hierarchical clustering
3. "GraphRAG local search vs global search query modes comparison" — Local vs global search mode comparison
4. "vanilla RAG vs GraphRAG retrieval quality comparison chart" — Performance comparison between standard RAG and GraphRAG
5. "Microsoft GraphRAG entity relationship extraction knowledge graph construction" — Entity-relationship extraction from documents to graph

## Video References

1. https://www.youtube.com/watch?v=r09tJfON6kE — "GraphRAG: Unlocking LLM discovery on narrative private data" by Microsoft Research
2. https://www.youtube.com/watch?v=knDDGYHnnSY — "GraphRAG with Neo4j and LangChain" by Neo4j