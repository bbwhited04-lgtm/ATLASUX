# Embedding & Vector DB Pricing Comparison

## The Hidden Cost Layer

Embeddings and vector databases are foundational to RAG (retrieval-augmented generation), semantic search, recommendation systems, and knowledge management. Unlike LLM API calls that dominate cost discussions, embedding and storage costs are often overlooked — but at scale, they can become significant. A million-document knowledge base requires millions of embedding computations upfront and ongoing vector storage and query costs.

This guide covers embedding model pricing, vector database hosting costs, and how these components combine in production systems like Atlas UX.

## Embedding Model Pricing

### OpenAI Embeddings

| Model | Dimensions | Cost per 1M Tokens | Max Input |
|-------|-----------|--------------------|-----------|
| text-embedding-3-small | 1536 | $0.02 | 8,191 tokens |
| text-embedding-3-large | 3072 | $0.13 | 8,191 tokens |
| text-embedding-ada-002 (legacy) | 1536 | $0.10 | 8,191 tokens |

OpenAI's embedding-3-small is the default choice for most applications. At $0.02 per million tokens, embedding an entire 100,000-word book costs approximately $0.003. The large model offers higher quality retrieval (especially for multilingual content) at 6.5x the price — worthwhile for applications where retrieval precision directly impacts revenue.

**Matryoshka support**: text-embedding-3-small and large support dimension reduction (e.g., using only 256 of 1536 dimensions) with minimal quality loss. This directly reduces vector storage costs.

### Cohere Embed v3

| Model | Dimensions | Cost per 1M Tokens |
|-------|-----------|-------------------|
| embed-english-v3.0 | 1024 | $0.10 |
| embed-multilingual-v3.0 | 1024 | $0.10 |
| embed-english-light-v3.0 | 384 | $0.10 |
| embed-multilingual-light-v3.0 | 384 | $0.10 |

Cohere's pricing is uniform across models. Their embeddings excel at retrieval tasks and include built-in search-optimized modes (search_document, search_query). The light models use fewer dimensions (384 vs 1024), reducing storage costs with modest quality trade-offs.

### Google Gecko / Text Embedding

| Model | Dimensions | Cost per 1M Tokens |
|-------|-----------|-------------------|
| text-embedding-005 | 768 | Free (with limits) |
| textembedding-gecko@003 | 768 | $0.025 |

Google's embedding model is competitively priced and freely available with rate limits through the Gemini API. For applications already on Google Cloud, this is the path of least resistance.

### BGE (BAAI General Embedding)

| Model | Dimensions | Cost |
|-------|-----------|------|
| bge-large-en-v1.5 | 1024 | Free (self-hosted) |
| bge-small-en-v1.5 | 384 | Free (self-hosted) |
| bge-m3 (multilingual) | 1024 | Free (self-hosted) |

BGE models are open-source and free to run. Self-hosting costs are purely infrastructure: a CPU instance can embed ~100 documents per second for bge-small, or use a GPU for 10-50x throughput. At scale, self-hosted BGE is significantly cheaper than any API-based option.

### Jina Embeddings

| Model | Dimensions | Cost per 1M Tokens |
|-------|-----------|-------------------|
| jina-embeddings-v3 | 1024 (configurable) | $0.02 |
| jina-clip-v2 (multimodal) | 768 | $0.02 |
| jina-colbert-v2 (late interaction) | 128 per token | $0.02 |

Jina matches OpenAI's small model pricing while offering multimodal (text + image) embedding via CLIP and ColBERT-style late interaction retrieval for higher accuracy.

### Voyage AI

| Model | Dimensions | Cost per 1M Tokens |
|-------|-----------|-------------------|
| voyage-3 | 1024 | $0.06 |
| voyage-3-lite | 512 | $0.02 |
| voyage-code-3 | 1024 | $0.06 |
| voyage-finance-2 | 1024 | $0.12 |

Voyage offers domain-specific models (code, finance, law) that outperform general-purpose embeddings in their respective domains. For specialized applications, the premium is justified by measurably better retrieval.

## Embedding Cost at Scale

To contextualize these prices, here is what it costs to embed common corpus sizes:

| Corpus | Approximate Tokens | OpenAI Small | Cohere | Self-hosted BGE |
|--------|-------------------|-------------|--------|-----------------|
| 1,000 blog posts | ~2M | $0.04 | $0.20 | ~$0.01 (compute) |
| 10,000 support articles | ~20M | $0.40 | $2.00 | ~$0.05 |
| 100,000 documents | ~200M | $4.00 | $20.00 | ~$0.50 |
| 1M documents | ~2B | $40.00 | $200.00 | ~$5.00 |

Key insight: embedding is a one-time cost per document. Re-embedding is only needed when the document changes or you switch models. This makes even expensive embedding models viable for most applications.

## Vector Database Pricing

### Pinecone

**Serverless (recommended for most use cases):**

| Component | Cost |
|-----------|------|
| Storage | $0.33 per GB/month |
| Read units | $8.25 per 1M read units |
| Write units | $2.00 per 1M write units |

A read unit corresponds roughly to one query against one namespace. Actual costs depend on vector dimensions, metadata filtering, and top-k settings.

**Pods (dedicated infrastructure):**

| Pod Type | Monthly Cost | Vectors (1536d) |
|----------|-------------|-----------------|
| s1.x1 | ~$70 | ~1M |
| p1.x1 | ~$70 | ~1M |
| p2.x1 | ~$160 | ~1M |

Pods offer predictable pricing for high-throughput applications. Serverless is cheaper for bursty, lower-volume workloads.

**Atlas UX usage**: The platform uses Pinecone with 3,386 vectors across 3 namespaces. At this scale, serverless costs are minimal — likely under $1/month for storage and a few dollars per month for queries depending on traffic.

### Weaviate

| Deployment | Cost |
|-----------|------|
| Self-hosted (Docker/K8s) | Infrastructure only |
| Weaviate Cloud Sandbox | Free (14-day trial) |
| Weaviate Cloud Standard | From $25/mo (1M objects) |
| Weaviate Cloud Professional | From $135/mo |
| Weaviate Cloud Business | Custom pricing |

Weaviate offers hybrid search (vector + keyword) out of the box, which can improve retrieval quality without additional infrastructure. Self-hosting on a small VM ($5-20/month) handles millions of vectors.

### Qdrant

| Deployment | Cost |
|-----------|------|
| Self-hosted | Infrastructure only |
| Qdrant Cloud Free | 1GB storage, 1M vectors |
| Qdrant Cloud Standard | From $9/mo |
| Qdrant Cloud Premium | Custom pricing |

Qdrant is written in Rust and optimized for performance. Their free cloud tier is generous enough for development and small production workloads. Self-hosted Qdrant on a $5/month VM can handle millions of vectors with sub-millisecond query latency.

### ChromaDB

| Deployment | Cost |
|-----------|------|
| Self-hosted (embedded) | Free |
| Chroma Cloud | Coming (currently free beta) |

ChromaDB is the simplest option — it can run embedded in your application process with zero infrastructure. For small to medium collections (under 1M vectors), it is hard to beat the simplicity. Not recommended for production workloads requiring high availability or horizontal scaling.

### Milvus / Zilliz

| Deployment | Cost |
|-----------|------|
| Milvus (self-hosted) | Infrastructure only |
| Zilliz Cloud Free | 1 collection, 500K vectors |
| Zilliz Cloud Standard | From $65/mo |
| Zilliz Cloud Enterprise | Custom pricing |

Milvus is designed for large-scale production (billions of vectors). Overkill for most startups but the right choice if you need horizontal scaling across multiple nodes.

### pgvector (PostgreSQL Extension)

| Deployment | Cost |
|-----------|------|
| Existing PostgreSQL instance | $0 additional |
| Supabase (built-in) | Included in plan |
| AWS RDS PostgreSQL | Included in instance cost |

pgvector adds vector operations directly to PostgreSQL. If your application already uses PostgreSQL (as Atlas UX does with Prisma), pgvector eliminates the need for a separate vector database entirely. Performance is competitive for collections under 1M vectors with proper indexing (IVFFlat or HNSW indexes).

**Trade-offs**: pgvector is simpler (no additional infrastructure) but does not scale as well as purpose-built vector databases for very large collections or high query throughput.

## Combined Costs: Embedding + Storage + Querying

For a typical RAG application with 50,000 documents and 1,000 queries per day:

**Embedding (one-time):**
| Provider | Cost |
|----------|------|
| OpenAI small | $0.20 |
| Cohere | $1.00 |
| Self-hosted BGE | ~$0.03 |

**Monthly storage + queries:**
| Vector DB | Monthly Cost |
|-----------|-------------|
| Pinecone Serverless | ~$5-15 |
| Qdrant Cloud | ~$9 |
| pgvector (existing PG) | ~$0 |
| ChromaDB (self-hosted) | ~$0-5 |
| Weaviate Cloud | ~$25 |

**Total annual cost** for a 50K-document RAG system ranges from effectively $0 (self-hosted everything on existing infrastructure) to ~$300/year (managed services). This is negligible compared to LLM inference costs.

## How Atlas UX Uses Embeddings

Atlas UX maintains a knowledge base with Pinecone as the vector store. The current setup:

- **3,386 vectors** across **3 namespaces** (agent docs, KB documents, support articles)
- **Ingestion pipeline**: `kb:ingest-agents` and `kb:chunk-docs` scripts process documents into chunks and generate embeddings
- **Retrieval**: When Lucy or another agent needs context, relevant chunks are retrieved from Pinecone and injected into the LLM prompt
- **Cost**: At this scale, total embedding + vector DB costs are under $5/month

As the knowledge base grows (more tenants, more documents per tenant), the architecture supports scaling through Pinecone's serverless tier, which charges only for actual usage rather than provisioned capacity.

## Key Takeaways

1. **Embedding is cheap**: Even at OpenAI pricing, embedding 100K documents costs $4. This is a rounding error compared to LLM inference.
2. **Vector DB costs vary 100x**: From $0 (pgvector on existing PostgreSQL) to $70+/month (Pinecone pods). Choose based on scale needs.
3. **pgvector is underrated**: For applications already on PostgreSQL with under 1M vectors, pgvector eliminates an entire infrastructure component.
4. **Smaller dimensions save money everywhere**: Fewer dimensions = less storage = faster queries = lower costs. Use Matryoshka reduction or light models when possible.
5. **Self-hosted open-source is viable**: BGE + Qdrant/ChromaDB on a $10/month VM handles millions of vectors with full control.

## Resources

- https://openai.com/api/pricing/ — OpenAI embedding model pricing
- https://docs.pinecone.io/guides/costs/understanding-cost — Pinecone cost documentation
- https://github.com/pgvector/pgvector — pgvector PostgreSQL extension for vector operations

## Image References

1. "Vector embedding dimensions visualization high dimensional space" — search: `vector embedding dimensions visualization high dimensional`
2. "RAG pipeline architecture diagram embedding retrieval generation" — search: `rag pipeline architecture embedding retrieval generation diagram`
3. "Vector database comparison chart Pinecone Weaviate Qdrant" — search: `vector database comparison chart pinecone weaviate qdrant`
4. "Cosine similarity vector search nearest neighbor diagram" — search: `cosine similarity vector search nearest neighbor diagram`
5. "Embedding model cost comparison bar chart per million tokens" — search: `embedding model cost comparison chart per million tokens`

## Video References

1. https://www.youtube.com/watch?v=ySus5ZS0b94 — "Vector Databases Explained: Pinecone vs Weaviate vs Qdrant vs ChromaDB" by Fireship
2. https://www.youtube.com/watch?v=jkrNMKz9pWU — "Embeddings: What They Are and Why They Matter" by 3Blue1Brown
