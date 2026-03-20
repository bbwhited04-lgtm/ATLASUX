# Knowledge Base Cost Comparison & Optimization: The Definitive Guide

## Introduction

The most common question teams ask after "should we build a knowledge base?" is "what will it cost?" The answer ranges from literally $0/month to tens of thousands of dollars — and the difference is not always correlated with quality. Teams routinely overspend on managed services when self-hosted alternatives would perform identically, or underspend on embedding quality only to waste far more on debugging poor retrieval. This guide provides a comprehensive cost analysis of every component in a production KB stack: vector databases, knowledge graphs, embedding APIs, LLM inference for RAG, and the often-ignored costs of maintenance and human review. More importantly, it provides actionable strategies to reduce your KB infrastructure cost to near-zero without sacrificing retrieval quality. Every price cited is current as of Q1 2026 or clearly dated.

## Section 1: Vector Database Costs

Vector databases are the storage and retrieval layer of any RAG-based knowledge base. The market has matured rapidly, with options ranging from free open-source libraries to fully managed enterprise platforms.

### Pinecone

Pinecone is the most widely adopted managed vector database, purpose-built for similarity search at scale. It offers two deployment models:

**Serverless (recommended for most teams):**
- Free tier: 2GB storage, unlimited reads/writes on a single index in the `us-east-1` region
- Standard: $0.00 storage for first 2GB, then $0.33/GB/month. Read units at $8.25 per million read units. Write units at $2.00 per million write units
- At 1M vectors (1024 dimensions, float32 = ~4GB): approximately $8-15/month with moderate query volume

**Pod-based (legacy, still available):**
- Starter (free): 1 pod, 100K vectors, single index
- Standard: $70/month per pod (s1.x1), supports ~1M vectors per pod
- Performance: $140/month per pod (p1.x1), optimized for low-latency queries
- Enterprise: Custom pricing, SOC 2, HIPAA, dedicated infrastructure

Pinecone's serverless pricing model means you pay primarily for what you use, making it very cost-effective at low-to-moderate scale. The free tier is generous enough for prototyping and small production workloads.

### Weaviate Cloud

Weaviate is a full-featured vector database with built-in hybrid search (combining vector and keyword BM25 search):

- **Sandbox (free):** 14-day clusters for testing (auto-deleted)
- **Serverless:** Starting at $25/month for the Standard tier (100K objects, 2 million requests/month). Performance tier at $115/month (500K objects)
- **Enterprise Dedicated:** Custom pricing, dedicated infrastructure, SLAs
- **Self-hosted (free):** Open-source, run on your own infrastructure. Docker image available. Typical infrastructure cost: $50-200/month depending on instance size

Weaviate's advantage is built-in hybrid search — no need to maintain a separate BM25 index alongside your vector index. The self-hosted option is production-ready and well-documented.

### Qdrant Cloud

Qdrant positions itself as a high-performance vector database with strong filtering capabilities:

- **Free tier:** 1GB cluster, 1M API requests/month
- **Standard clusters:** Starting at ~$25/month (0.5 vCPU, 1GB RAM, 4GB disk). Pricing scales with RAM and storage
- **Enterprise:** Dedicated hardware, custom pricing
- **Self-hosted (free):** Open-source Rust implementation. Very resource-efficient — can serve millions of vectors on modest hardware. Docker image or binary

Qdrant's Rust implementation makes it notably faster per dollar of compute than Python-based alternatives. Self-hosted Qdrant on a $20/month VPS can handle several million vectors.

### Chroma

Chroma targets simplicity for small-to-medium collections:

- **Open-source (free):** In-memory or persistent SQLite-backed storage. pip install, works immediately. Best for collections under 100K vectors
- **Chroma Cloud:** Currently in early access with usage-based pricing. Estimated starting at ~$30/month for production workloads
- **Limitations:** Not designed for billion-scale datasets. No built-in replication or sharding in the open-source version

Chroma is ideal for prototyping and small production deployments. It runs in-process with your application — no separate database server needed.

### pgvector (PostgreSQL Extension)

pgvector brings vector similarity search to PostgreSQL — the database you are probably already running:

- **Cost:** Free (open-source extension). Your only cost is the PostgreSQL infrastructure you are already paying for
- **Performance:** Suitable for up to ~1M vectors with HNSW indexing. Beyond that, query latency increases unless you scale hardware
- **Advantages:** No new infrastructure to manage. Transactions, backups, monitoring — everything you already have for PostgreSQL. ACID-compliant vector operations
- **Trade-offs:** Slower than dedicated vector DBs at scale. No built-in multi-tenancy features. Limited filtering performance compared to Pinecone or Weaviate

For teams already running PostgreSQL (which includes most production applications), pgvector is the zero-cost entry point. Atlas UX runs PostgreSQL 16 on AWS Lightsail — adding pgvector would cost exactly $0/month in additional infrastructure.

### Milvus / Zilliz Cloud

Milvus is the enterprise-grade open-source option, battle-tested at billion-vector scale:

- **Milvus (self-hosted, free):** Requires Kubernetes for distributed mode, standalone Docker for single-node. Infrastructure cost depends on cluster size — typically $200-500/month for a production-grade Kubernetes cluster
- **Zilliz Cloud (managed):** Free tier with 2 collections and 1M vectors. Paid plans start at ~$65/month (Serverless). Dedicated clusters from $400/month

Milvus is overkill for most teams but essential for those operating at true enterprise scale (hundreds of millions to billions of vectors).

### Vector Database Comparison Table

| Provider | Free Tier | Paid Starting Price | Cost per 1M Vectors (est.) | Self-Host Option | Best For |
|----------|-----------|--------------------|-----------------------------|-----------------|----------|
| Pinecone | 2GB storage | ~$8-15/mo (serverless) | $8-15/mo | No | Managed simplicity, fast iteration |
| Weaviate Cloud | 14-day sandbox | $25/mo | $25-50/mo | Yes (free) | Hybrid search, self-hosted flexibility |
| Qdrant Cloud | 1GB cluster | ~$25/mo | $25-40/mo | Yes (free) | High performance, filtering |
| Chroma | Unlimited (local) | ~$30/mo (cloud) | N/A (local) | Yes (free) | Prototyping, small datasets |
| pgvector | Free (PG extension) | $0 (existing infra) | $0 | Yes (free) | Zero-cost, existing PostgreSQL |
| Zilliz Cloud | 1M vectors | ~$65/mo | $30-65/mo | Yes (Milvus, free) | Enterprise scale, billions of vectors |

## Section 2: Knowledge Graph Costs

Knowledge graphs store entities and their relationships, enabling multi-hop reasoning and structured queries that vector databases cannot handle.

### Neo4j

The dominant graph database with the largest community and ecosystem:

- **Community Edition (free):** Single-instance, open-source. No clustering, no role-based access control. Suitable for development and small production workloads
- **AuraDB Free:** Cloud-hosted, 200K nodes, 400K relationships. Limited to 1 database. Auto-pauses after inactivity
- **AuraDB Professional:** Starting at $65/month (1GB RAM, 4GB storage). Scales up based on data size and query volume
- **AuraDB Enterprise:** Starting at $1,100/month. Dedicated infrastructure, SSO, audit logs, 99.95% SLA
- **Enterprise (self-hosted):** License-based pricing, typically $30K-100K/year depending on cluster size

For most KB use cases, AuraDB Professional ($65-200/month) provides sufficient capacity. The free Community Edition works well for development and testing graph queries before committing to managed infrastructure.

### Amazon Neptune

AWS's managed graph database supports both property graph (openCypher/Gremlin) and RDF (SPARQL):

- **Instance pricing:** db.t3.medium at ~$0.072/hour (~$52/month), db.r5.large at ~$0.348/hour (~$251/month)
- **Storage:** $0.10 per GB-month
- **I/O:** $0.20 per million I/O requests
- **Neptune Serverless:** Scales automatically. ~$0.11 per Neptune Capacity Unit (NCU) hour. Minimum 1 NCU
- **Typical monthly cost:** $70-300/month for a development/small production workload

Neptune integrates natively with the AWS ecosystem (IAM, CloudWatch, VPC). If you are already on AWS, Neptune avoids the operational complexity of managing a separate graph database vendor.

### TigerGraph

Enterprise-focused graph database with built-in analytics:

- **TigerGraph Cloud Free:** 50GB data, limited compute
- **Professional:** Starting at ~$200/month
- **Enterprise:** Custom pricing, typically $50K-200K/year for on-premise

TigerGraph excels at deep-link graph analytics (10+ hop traversals) but is more expensive and complex than Neo4j for typical KB use cases.

### Self-Hosted Graph Options

For teams with Kubernetes expertise:

- **Neo4j Community (Docker):** Free software, ~$50-100/month infrastructure (2-4 vCPU, 8-16GB RAM instance)
- **JanusGraph (open-source):** Free, runs on Cassandra/HBase + Elasticsearch. Complex to operate but handles massive scale
- **Dgraph (open-source):** Free self-hosted. GraphQL-native. Cloud offering starting at ~$40/month

### Knowledge Graph Comparison Table

| Provider | Free Tier | Paid Starting Price | Self-Host | Best For |
|----------|-----------|--------------------|-----------|---------|
| Neo4j AuraDB | 200K nodes | $65/mo | Yes (Community) | General-purpose, largest ecosystem |
| Amazon Neptune | None | ~$52/mo (t3.medium) | No | AWS-native teams, RDF/SPARQL |
| TigerGraph Cloud | 50GB | ~$200/mo | Yes (free, limited) | Deep analytics, massive graphs |
| Dgraph | Unlimited (self-hosted) | ~$40/mo (cloud) | Yes (free) | GraphQL-native workloads |

## Section 3: Embedding API Costs

Embeddings convert text into vectors — this is the most frequent API call in any KB pipeline (both during indexing and at query time).

### Commercial Embedding APIs

| Provider | Model | Cost per 1M Tokens | Dimensions | MTEB Score | Notes |
|----------|-------|--------------------|-----------:|------------|-------|
| OpenAI | text-embedding-3-small | $0.02 | 1536 | ~62.3 | Cheapest quality API option |
| OpenAI | text-embedding-3-large | $0.13 | 3072 | ~64.6 | Supports Matryoshka (variable dims) |
| Cohere | embed-v3 (English) | $0.10 | 1024 | ~64.5 | Search-optimized, multilingual available |
| Google | text-embedding-004 | $0.00625 | 768 | ~62.7 | Cheapest commercial option |
| Voyage AI | voyage-3 | $0.06 | 1024 | ~67.1 | Top MTEB scores |

### Free / Open-Source Embedding Models

| Model | Dimensions | MTEB Score | Requirements | Notes |
|-------|-----------|------------|-------------|-------|
| BGE-large-en-v1.5 | 1024 | ~63.6 | 2GB VRAM or CPU | Best free English model for most teams |
| E5-mistral-7b-instruct | 4096 | ~66.6 | 14GB VRAM | Highest quality open-source |
| GTE-large-en-v1.5 | 1024 | ~65.4 | 2GB VRAM or CPU | Strong alternative to BGE |
| Nomic-embed-text-v1.5 | 768 | ~62.2 | 1GB VRAM or CPU | Lightweight, Matryoshka support |
| all-MiniLM-L6-v2 | 384 | ~56.3 | CPU only | Ultra-lightweight, fast inference |
| BAAI/bge-m3 | 1024 | ~64.2 | 4GB VRAM | Best free multilingual model |

### Cost Calculation Example

A concrete example for a mid-size knowledge base:

- **Corpus:** 10,000 documents averaging 2,000 tokens each = 20M tokens total
- **Initial indexing cost:**
  - OpenAI text-embedding-3-small: 20M tokens x $0.02/1M = **$0.40**
  - OpenAI text-embedding-3-large: 20M tokens x $0.13/1M = **$2.60**
  - Cohere embed-v3: 20M tokens x $0.10/1M = **$2.00**
  - Google text-embedding-004: 20M tokens x $0.00625/1M = **$0.125**
  - BGE-large (local): **$0.00** (runs on your hardware)

- **Daily query embedding cost (1,000 queries, avg 50 tokens each = 50K tokens/day):**
  - OpenAI text-embedding-3-small: $0.001/day = **$0.03/month**
  - OpenAI text-embedding-3-large: $0.0065/day = **$0.20/month**
  - Local model: **$0.00/month**

Embedding costs are almost always trivial for text. The exception is if you re-embed your entire corpus frequently (daily full re-index of 20M tokens = $12/month with OpenAI 3-small, still minor). The real costs come from LLM generation, not embeddings.

## Section 4: LLM API Costs for RAG

This is the hidden cost that catches teams off guard. Every RAG query involves an LLM call to generate the final answer from the retrieved chunks. At scale, this dominates your KB budget.

### Cost Per RAG Query Breakdown

A typical RAG query involves:
1. **Embed the query:** ~50 tokens at $0.02/1M = $0.000001 (negligible)
2. **Vector search:** $0.00 (included in vector DB pricing)
3. **LLM generation:** 3-5 retrieved chunks (~2000 tokens input) + query (~50 tokens) + output (~500 tokens)

The LLM call is 99%+ of the per-query cost:

| Provider | Model | Input $/1M | Output $/1M | Cost per RAG Query | Monthly at 1K/day | Monthly at 10K/day |
|----------|-------|-----------|-------------|-------------------|-------------------|--------------------|
| OpenAI | GPT-4o | $2.50 | $10.00 | $0.010 | $300 | $3,000 |
| OpenAI | GPT-4o-mini | $0.15 | $0.60 | $0.0006 | $18 | $180 |
| Anthropic | Claude 3.5 Sonnet | $3.00 | $15.00 | $0.014 | $420 | $4,200 |
| Anthropic | Claude 3.5 Haiku | $0.80 | $4.00 | $0.004 | $120 | $1,200 |
| Google | Gemini 2.0 Flash | $0.10 | $0.40 | $0.0004 | $12 | $120 |
| DeepSeek | DeepSeek V3 | $0.27 | $1.10 | $0.001 | $30 | $300 |
| Cerebras | Llama 3.3 70B | Free tier | Free tier | $0.00 | $0 | $0* |
| Self-hosted | Llama 3.1 8B (Ollama) | $0.00 | $0.00 | $0.00 | $0** | $0** |

*Cerebras free tier has rate limits (~30 RPM). Production use requires their inference tier.
**Self-hosted cost is hardware amortization — typically $50-200/month for a GPU server or cloud GPU instance.

### The Real Cost Driver

The numbers are clear: **LLM generation cost dominates KB infrastructure cost at scale.** A team running 10K RAG queries/day on GPT-4o spends $3,000/month on generation alone — far more than the vector database, embeddings, and graph database combined.

This is why model selection for the generation step is the single most impactful cost optimization. Switching from GPT-4o to GPT-4o-mini for routine queries cuts generation cost by 94% with acceptable quality degradation for most Q&A use cases.

```
Monthly cost breakdown at 10K queries/day:
┌─────────────────────────┬──────────┬──────────┬──────────┐
│ Component               │ Premium  │ Balanced │ Budget   │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ Vector DB (Pinecone)    │ $70      │ $70      │ $0 (pgv) │
│ Embedding API           │ $6       │ $0.90    │ $0 (BGE) │
│ LLM Generation          │ $3,000   │ $180     │ $0 (Oll) │
│ Graph DB (Neo4j)        │ $65      │ $0       │ $0       │
│ Infrastructure          │ $0       │ $50      │ $100     │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ TOTAL                   │ $3,141   │ $301     │ $100     │
└─────────────────────────┴──────────┴──────────┴──────────┘
Premium: GPT-4o + Pinecone + OpenAI embeddings + Neo4j
Balanced: GPT-4o-mini + Pinecone + OpenAI 3-small + pgvector
Budget: Ollama + pgvector + BGE (local) — API costs = $0
```

## Section 5: Total Cost of Ownership

TCO includes infrastructure, APIs, maintenance labor, and human review. Teams that budget only for API costs are consistently surprised by the true cost.

### Small Team (1K docs, 1K queries/day)

| Component | Vector-Only | Hybrid (Vector+Graph) | Graph-Only |
|-----------|------------|----------------------|------------|
| Vector DB | $0-70 | $0-70 | $0 |
| Graph DB | $0 | $65-200 | $65-200 |
| Embedding API | $0.03-0.20 | $0.03-0.20 | $0 |
| LLM Generation | $18-300 | $18-300 | $18-300 |
| Infrastructure | $0-50 | $50-100 | $50-100 |
| Human Review (4 hrs/mo) | $200 | $200 | $200 |
| **Monthly Total** | **$218-620** | **$333-870** | **$333-800** |

### Mid-Size Team (10K docs, 10K queries/day)

| Component | Vector-Only | Hybrid (Vector+Graph) | Graph-Only |
|-----------|------------|----------------------|------------|
| Vector DB | $15-200 | $15-200 | $0 |
| Graph DB | $0 | $65-400 | $65-400 |
| Embedding API | $0.30-6 | $0.30-6 | $0 |
| LLM Generation | $120-3,000 | $120-3,000 | $120-3,000 |
| Infrastructure | $50-100 | $100-300 | $100-200 |
| Monitoring/Maintenance | $500 | $800 | $700 |
| Human Review (10 hrs/mo) | $500 | $500 | $500 |
| **Monthly Total** | **$1,185-3,806** | **$1,600-4,706** | **$1,485-4,800** |

### Enterprise (100K+ docs, 100K+ queries/day)

| Component | Vector-Only | Hybrid (Vector+Graph) | Graph-Only |
|-----------|------------|----------------------|------------|
| Vector DB | $200-2,000 | $200-2,000 | $0 |
| Graph DB | $0 | $400-5,000 | $400-5,000 |
| Embedding API | $3-60 | $3-60 | $0 |
| LLM Generation | $1,200-30,000 | $1,200-30,000 | $1,200-30,000 |
| Infrastructure | $500-2,000 | $1,000-5,000 | $500-3,000 |
| SRE/DevOps (dedicated) | $5,000 | $8,000 | $6,000 |
| Human Review/QA | $2,000 | $2,000 | $2,000 |
| **Monthly Total** | **$8,903-36,060** | **$12,803-44,060** | **$10,100-40,000** |

### Total Cost of Ownership Comparison

| Scale | Vector-Only (min) | Hybrid (min) | Key Cost Driver |
|-------|-------------------|--------------|-----------------|
| Small (1K/1K) | $218/mo | $333/mo | LLM generation |
| Mid (10K/10K) | $1,185/mo | $1,600/mo | LLM generation |
| Enterprise (100K/100K) | $8,903/mo | $12,803/mo | LLM generation + personnel |

The pattern is consistent: **LLM generation is 40-80% of TCO at every scale**. Optimizing the generation model has more impact than any other single decision.

## Section 6: Strategies to Reduce KB Costs to Near-Zero

This is the actionable section. Ten proven strategies to dramatically reduce your KB infrastructure cost, ordered by impact.

### Strategy 1: Use Free/Open-Source Embedding Models

The quality gap between commercial and open-source embedding models has narrowed to near-irrelevance for most use cases.

```python
# BGE-large-en-v1.5: free, runs on CPU, MTEB ~63.6 vs OpenAI's ~64.6
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-large-en-v1.5")

# Embed 10,000 documents — $0.00 API cost
embeddings = model.encode(documents, batch_size=32, show_progress_bar=True)
```

MTEB benchmark reality check:
- OpenAI text-embedding-3-large: ~64.6 average
- BGE-large-en-v1.5: ~63.6 average (1.5% lower)
- GTE-large: ~65.4 average (actually higher than OpenAI on several tasks)

The 1-3% MTEB score difference translates to maybe 1-2% lower hit rate in production — often undetectable without a golden dataset. Meanwhile, you save $0.13 per million tokens, which at 100M tokens/year is $13/year in savings. Not life-changing, but the real value is eliminating API dependency entirely — no rate limits, no outages, no vendor lock-in.

**Recommendation:** Use BGE-large-en-v1.5 as your default. It runs on CPU (slower but functional) or a single consumer GPU (fast). Switch to a commercial API only if your golden dataset evaluation shows a meaningful quality gap.

### Strategy 2: Self-Host Your Vector Database

pgvector on your existing PostgreSQL database is literally free:

```sql
-- Enable pgvector on existing PostgreSQL 16
CREATE EXTENSION vector;

-- Create a table with vector column
CREATE TABLE kb_embeddings (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1024),  -- matches BGE-large dimensions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index for fast similarity search
CREATE INDEX ON kb_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Query: find top 5 most similar
SELECT id, content, metadata,
       1 - (embedding <=> $1::vector) AS similarity
FROM kb_embeddings
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

**Performance reality:** pgvector with HNSW indexing handles sub-50ms queries on collections up to ~1M vectors on a 4-core, 16GB RAM instance. That covers the vast majority of production KB workloads. You only need Pinecone or Weaviate if you are operating at multi-million vector scale or need advanced features like namespace isolation.

### Strategy 3: Cache Aggressively

Three layers of caching can eliminate 60-80% of LLM API calls:

```typescript
// Layer 1: Embedding cache — don't re-embed the same query
const embeddingCache = new Map<string, number[]>();

async function cachedEmbed(text: string): Promise<number[]> {
  const key = crypto.createHash("md5").update(text).digest("hex");
  if (embeddingCache.has(key)) return embeddingCache.get(key)!;
  const embedding = await embedModel.encode(text);
  embeddingCache.set(key, embedding);
  return embedding;
}

// Layer 2: Retrieval cache — same query hits same chunks
const retrievalCache = new LRUCache<string, ChunkResult[]>({ max: 10000, ttl: 3600000 });

// Layer 3: Response cache — identical queries get cached LLM responses
const responseCache = new LRUCache<string, string>({ max: 5000, ttl: 1800000 });

async function ragQuery(query: string): Promise<string> {
  const cacheKey = crypto.createHash("sha256").update(query).digest("hex");

  // Check response cache first
  const cached = responseCache.get(cacheKey);
  if (cached) return cached;  // $0.00 — no API calls

  // Proceed with normal RAG pipeline
  const embedding = await cachedEmbed(query);
  const chunks = await retrieveChunks(embedding);
  const response = await llm.generate(query, chunks);

  responseCache.set(cacheKey, response);
  return response;
}
```

In production, 20-40% of KB queries are repeats or near-duplicates ("cancellation policy" vs "what is the cancellation policy?" vs "how do I cancel?"). Semantic caching (where similar but not identical queries hit the same cache) can push cache hit rates to 50-70%.

### Strategy 4: Use Cheaper LLMs for Generation

Not every query needs GPT-4o or Claude Sonnet. Implement a tiered model strategy:

```typescript
async function selectModel(query: string, chunks: ChunkResult[]): Promise<string> {
  // Simple factual queries → cheapest model
  if (chunks[0].similarity > 0.92) {
    return "gpt-4o-mini";  // $0.0006/query
  }

  // Complex synthesis queries → more capable model
  if (chunks.length > 3 || query.includes("compare") || query.includes("analyze")) {
    return "gpt-4o";  // $0.010/query
  }

  // Default: balanced model
  return "deepseek-v3";  // $0.001/query
}
```

At 10K queries/day with a 70/20/10 split (simple/moderate/complex), monthly LLM cost drops from $3,000 (all GPT-4o) to approximately $250 (mixed):
- 7,000 queries x $0.0006 (4o-mini) = $4.20/day
- 2,000 queries x $0.001 (DeepSeek) = $2.00/day
- 1,000 queries x $0.010 (GPT-4o) = $10.00/day
- Total: $16.20/day = **$486/month** (84% savings)

### Strategy 5: Tiered Retrieval

Check multiple layers before making an API call:

```
Query arrives
  → Check response cache (cost: $0.00, latency: <1ms)
  → Check local embedding index (cost: $0.00, latency: <10ms)
  → Check Pinecone/pgvector (cost: ~$0.00, latency: <50ms)
  → Only if all above fail: hit external API (cost: $0.001-0.01, latency: 200-500ms)
```

This tiered approach means your most expensive resource (LLM API) is only invoked when cheaper alternatives cannot answer the query. Combined with caching, 60-80% of queries never reach the LLM.

### Strategy 6: Batch Embedding

Both OpenAI and Anthropic offer 50% discounts on batch API calls:

- **OpenAI Batch API:** Submit embedding jobs that complete within 24 hours at 50% discount. text-embedding-3-small drops to $0.01/1M tokens
- **Anthropic Batch API:** 50% discount on batch message generation for non-real-time use cases

```python
# OpenAI Batch API for bulk embedding
import json

# Create batch file
with open("batch_input.jsonl", "w") as f:
    for i, doc in enumerate(documents):
        request = {
            "custom_id": f"doc_{i}",
            "method": "POST",
            "url": "/v1/embeddings",
            "body": {
                "model": "text-embedding-3-small",
                "input": doc
            }
        }
        f.write(json.dumps(request) + "\n")

# Submit batch — results in 24 hours at 50% off
batch = client.batches.create(
    input_file=open("batch_input.jsonl", "rb"),
    endpoint="/v1/embeddings",
    completion_window="24h"
)
```

For initial indexing and periodic re-indexing, batch embedding should always be used. There is no reason to pay full price for non-urgent embedding jobs.

### Strategy 7: Reduce Re-Indexing

Only re-embed changed documents, not the entire corpus:

```typescript
async function incrementalReindex(corpus: Document[]): Promise<void> {
  const changed = corpus.filter(doc => {
    const currentHash = contentHash(doc.content);
    const storedHash = getStoredHash(doc.id);
    return currentHash !== storedHash;
  });

  console.log(`${changed.length} of ${corpus.length} documents changed`);

  // Only embed the delta
  for (const doc of changed) {
    const chunks = chunkDocument(doc);
    const embeddings = await embedBatch(chunks);
    await vectorDB.upsert(doc.id, embeddings);
    await updateStoredHash(doc.id, contentHash(doc.content));
  }
}
```

If 2% of your corpus changes daily, incremental re-indexing costs 2% of a full re-index. Over a month, this compounds to massive savings.

### Strategy 8: Semantic Deduplication

Near-duplicate chunks waste storage and degrade retrieval (the same content appears multiple times, pushing genuinely different results out of top-k):

```python
from sentence_transformers import SentenceTransformer, util
import torch

model = SentenceTransformer("BAAI/bge-large-en-v1.5")

def deduplicate_chunks(chunks: list[str], threshold: float = 0.95) -> list[str]:
    """Remove near-duplicate chunks using cosine similarity."""
    embeddings = model.encode(chunks, convert_to_tensor=True)
    unique_chunks = []
    unique_embeddings = []

    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        if len(unique_embeddings) == 0:
            unique_chunks.append(chunk)
            unique_embeddings.append(emb)
            continue

        # Compare against all unique chunks
        sims = util.cos_sim(emb, torch.stack(unique_embeddings))
        if sims.max() < threshold:
            unique_chunks.append(chunk)
            unique_embeddings.append(emb)

    print(f"Deduplicated: {len(chunks)} → {len(unique_chunks)} chunks")
    return unique_chunks
```

Teams typically find 10-30% of their chunks are near-duplicates. Removing them improves retrieval quality AND reduces storage costs.

### Strategy 9: Quantization

Reduce vector storage by 4-32x with minimal quality loss:

- **float32 (default):** 4 bytes per dimension. 1024-dim vector = 4KB
- **float16 (half precision):** 2 bytes per dimension. 50% storage reduction. Quality loss: <0.5%
- **int8 (scalar quantization):** 1 byte per dimension. 75% storage reduction. Quality loss: 1-2%
- **binary quantization:** 1 bit per dimension. 97% storage reduction. Quality loss: 5-10% (use with re-ranking)

Pinecone, Qdrant, and Weaviate all support quantization natively. pgvector supports halfvec (float16) as of PostgreSQL 16.

```sql
-- pgvector with half-precision vectors (50% storage savings)
CREATE TABLE kb_embeddings_quantized (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding halfvec(1024)  -- 2KB per vector instead of 4KB
);
```

At 1M vectors with 1024 dimensions:
- float32: 4GB storage
- float16: 2GB storage
- int8: 1GB storage
- binary: 128MB storage (with re-ranking from float32 originals for top candidates)

### Strategy 10: The "Zero-Cost" Stack

Combine all the above strategies into a stack with $0/month in API costs:

```
┌─────────────────────────────────────────────────────┐
│                  Zero-Cost KB Stack                  │
├─────────────────────────────────────────────────────┤
│  Embedding:  BGE-large-en-v1.5 (local, free)       │
│  Vector DB:  pgvector on PostgreSQL (free extension)│
│  LLM:        Ollama + Llama 3.1 8B (local, free)   │
│              OR Cerebras free tier (cloud, rate-     │
│              limited)                                │
│  Cache:      In-memory LRU cache (free)             │
│  Monitoring: Golden dataset eval script (free)      │
├─────────────────────────────────────────────────────┤
│  Total API cost:     $0.00/month                    │
│  Infrastructure:     $50-100/month (server cost)    │
│  Quality trade-off:  2-5% lower MTEB vs commercial  │
│  Best for:           Budget teams, data sovereignty, │
│                      offline/air-gapped deployments  │
└─────────────────────────────────────────────────────┘
```

This stack runs entirely on a single server (4 vCPU, 16GB RAM, ~$50-100/month on any cloud provider). No API keys needed. No rate limits. No vendor dependencies. The quality trade-off is measurable but small — within 2-5% of the fully commercial stack on standard benchmarks.

For teams that want the best of both worlds, the **hybrid approach** is recommended: use the zero-cost stack for 80% of queries (simple, high-confidence retrievals) and route the remaining 20% (complex, low-confidence queries) to a commercial LLM API. This typically reduces total LLM costs by 80% while maintaining quality where it matters.

## Section 7: Atlas UX's Approach

Atlas UX manages KB costs through a combination of managed services and intelligent cost optimization:

**Infrastructure choices:**
- **Pinecone (managed, serverless tier):** Chosen over self-hosted alternatives because the team is small (2 people). The serverless pricing keeps costs under $15/month for the current corpus. The ops burden of self-hosting would cost more in engineering hours than the managed service fee
- **Three-tier retrieval:** Agent-specific namespace checked first, shared KB second, web search via provider rotation as last resort. This minimizes expensive vector DB queries and avoids unnecessary LLM calls
- **Credential rotation across 5 search providers:** You.com, Brave, Exa, Tavily, and SerpAPI are rotated randomly, distributing query load across free tiers and preventing rate limit hits on any single provider
- **Context-enriched embeddings:** Metadata (tier, category, tags) is embedded alongside content, improving retrieval precision and reducing the number of chunks needed per query (fewer chunks = fewer input tokens to the LLM)

**Why managed over self-hosted:**
The math is simple. A $15/month Pinecone serverless bill versus 4-8 hours/month maintaining pgvector infrastructure, monitoring, backups, and index tuning. At any reasonable engineering hourly rate, the managed service pays for itself 10x over. The team's time is better spent on product features than database operations.

**Actual monthly KB infrastructure cost:**
- Pinecone (serverless): ~$15/month
- Embedding API (OpenAI text-embedding-3-small): ~$0.50/month (small corpus, incremental updates)
- LLM generation (mixed models via credential rotation): ~$30-80/month depending on query volume
- Web search providers (free tiers + minimal paid): ~$5/month
- **Total: ~$50-100/month** for a production KB serving multiple AI agents across the platform

This is deliberately over-invested in managed services relative to what self-hosting would cost, because the team values reliability and iteration speed over cost minimization at this stage. As the platform scales and the corpus grows beyond 100K documents, migrating the vector database to pgvector (already running on the same PostgreSQL instance) is a straightforward optimization that would cut the Pinecone cost to $0.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Vector_space_model.png/400px-Vector_space_model.png — Vector space model illustrating how documents and queries map to geometric points for similarity comparison
2. https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Voronoi_diagram.svg/400px-Voronoi_diagram.svg.png — Voronoi diagram showing how vector space is partitioned for efficient approximate nearest neighbor search in vector databases
3. https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Cosine_similarity.svg/400px-Cosine_similarity.svg.png — Cosine similarity between two vectors — the core distance metric used by most embedding-based retrieval systems
4. https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/KNN_decision_boundary.svg/400px-KNN_decision_boundary.svg.png — K-nearest neighbors decision boundary illustrating how similarity search partitions vector space into retrieval regions
5. https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Semantic_Net.svg/1200px-Semantic_Net.svg.png — Semantic network showing entity-relationship structure used in knowledge graphs and GraphRAG architectures

## Videos

1. https://www.youtube.com/watch?v=klTvEwg3oJ4 — "Vector Databases Simply Explained" by Fireship — covers core concepts, use cases, and cost considerations for vector database selection
2. https://www.youtube.com/watch?v=dN0lsF2cvm4 — "How do Vector Databases Work?" by IBM Technology — explains indexing strategies, similarity search algorithms, and performance trade-offs that directly impact infrastructure costs

## References

1. Pinecone Documentation. "Pricing." https://www.pinecone.io/pricing/

2. OpenAI. "Embeddings API Pricing." https://openai.com/api/pricing/

3. Muennighoff, N., et al. (2022). "MTEB: Massive Text Embedding Benchmark." *arXiv preprint*. https://arxiv.org/abs/2210.07316

4. Johnson, J., Douze, M., & Jegou, H. (2019). "Billion-Scale Similarity Search with GPUs." *IEEE Transactions on Big Data*. https://arxiv.org/abs/1702.08734

5. pgvector Documentation. "PostgreSQL Extension for Vector Similarity Search." https://github.com/pgvector/pgvector