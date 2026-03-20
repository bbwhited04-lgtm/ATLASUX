# Knowledge Base FAQ: The Definitive Guide for AI Agent Teams

## Introduction

Building a knowledge base (KB) for AI agents is one of the highest-leverage investments a team can make — and one of the easiest to get wrong. The difference between a well-architected KB and a hastily assembled one is the difference between an agent that answers accurately 95% of the time and one that hallucinates confidently at 60%. This FAQ compiles the most common questions teams ask when designing, implementing, and maintaining knowledge base systems for AI agents. Each answer draws from production experience, published benchmarks, and the hard-won lessons of teams who have shipped KB-powered products at scale. Whether you are evaluating vector databases, choosing embedding models, designing multi-agent knowledge sharing, or debugging retrieval quality, this document provides concrete, actionable answers — not theoretical hand-waving.

## Fundamentals

### What is a knowledge base in the context of AI agents?

A knowledge base is a structured or semi-structured repository of information that AI agents can query at runtime to ground their responses in verified facts. Unlike the parametric knowledge baked into a model during training (which is frozen at the training cutoff and prone to hallucination), a knowledge base provides dynamic, retrievable context that the agent can reference when generating answers.

In practice, a KB for AI agents consists of three layers:

1. **Ingestion layer** — Documents (PDFs, markdown files, web pages, database records) are processed, chunked into manageable segments, and converted into embeddings (numerical representations of meaning).
2. **Storage layer** — Embeddings and their associated metadata are stored in a vector database (Pinecone, Weaviate, pgvector) or knowledge graph (Neo4j, Amazon Neptune), or both.
3. **Retrieval layer** — When an agent receives a query, the query is embedded and compared against stored vectors using similarity search. The top-k most relevant chunks are injected into the LLM's context window alongside the original query.

This pattern is called Retrieval-Augmented Generation (RAG), and it is the dominant architecture for production AI systems that need to answer questions about proprietary data. The KB is what makes an AI agent domain-specific rather than generic.

A critical distinction: the KB is not the model. The model generates language; the KB provides the facts. When teams conflate these, they end up fine-tuning models on data that should be in a retrieval system — an expensive mistake that is hard to undo.

The practical architecture looks like this:

```
User Query → Embedding Model → Vector Search → Top-K Chunks
                                                    ↓
                                         LLM (query + chunks) → Response
```

Every component in this pipeline — the embedding model, the vector database, the chunk size, the retrieval strategy — affects the quality of the final response. The KB is the foundation that everything else builds on.

### What is the difference between a knowledge base and a database?

A traditional relational database (PostgreSQL, MySQL) stores structured data in tables with rows and columns. You query it with SQL: `SELECT * FROM customers WHERE state = 'Texas'`. The query is exact — it returns rows that match the filter criteria precisely. This works well for transactional data (orders, user accounts, inventory) but poorly for semantic queries like "what's our policy on late cancellations?" because the answer is buried in unstructured text that SQL cannot search meaningfully.

A knowledge base for AI agents stores semantic representations of information — embeddings — that capture meaning rather than exact keywords. When you query a KB, you are asking "what stored information is closest in meaning to this question?" This enables fuzzy, intent-based retrieval that handles paraphrasing, synonyms, and conceptual similarity.

The practical differences:

| Aspect | Relational Database | AI Knowledge Base |
|--------|-------------------|-------------------|
| Query type | Exact match (SQL) | Semantic similarity |
| Data format | Structured (tables) | Unstructured (text, PDFs) |
| Returns | Exact rows | Ranked results by relevance |
| Handles synonyms | No | Yes |
| Best for | Transactional data | Domain knowledge, policies, docs |
| Query language | SQL | Natural language / vector search |
| Update speed | Instant | Requires re-embedding |
| Scalability | Billions of rows | Millions of vectors |

Most production systems use both: a relational database for structured operations and a knowledge base for semantic retrieval. Atlas UX, for example, uses PostgreSQL (via Prisma) for tenant data and Pinecone for KB retrieval — each system handles what it does best.

### Do I need a knowledge base if I am already fine-tuning my model?

Yes, almost certainly. Fine-tuning and knowledge bases solve different problems, and conflating them is one of the most expensive mistakes teams make.

**Fine-tuning** teaches a model *how* to behave — tone, format, reasoning patterns, domain-specific terminology. It modifies the model's weights to adjust its style and capabilities. Fine-tuning is appropriate for:
- Teaching a model to respond in a specific voice or format
- Improving performance on a narrow task (classification, extraction)
- Embedding implicit domain knowledge that rarely changes

**A knowledge base** gives a model *what* to know — facts, policies, procedures, product details. It provides runtime context without modifying the model. A KB is appropriate for:
- Information that changes (pricing, policies, schedules)
- Large document collections that exceed context window limits
- Data that must be auditable ("where did this answer come from?")
- Multi-tenant scenarios where different users need different knowledge

The critical limitation of fine-tuning: you cannot easily update it. If your cancellation policy changes, you need to re-fine-tune the model — a process that costs money, takes hours, and risks catastrophic forgetting (the model "forgets" previously learned behavior). With a KB, you update the document and re-embed it. Done in seconds.

The cost difference is stark. Fine-tuning GPT-4o costs roughly $25 per million training tokens, and you pay again every time you retrain. A KB with pgvector costs $0 in API fees and updates instantly.

**The pragmatic answer:** Fine-tune for behavior. Use a KB for facts. Most teams should start with RAG (knowledge base) and only fine-tune if retrieval alone cannot achieve the required quality. The two approaches are complementary: a fine-tuned model that speaks your brand voice, grounded by a KB that provides current facts, is the gold standard for production AI systems.

## Architecture Decisions

### Can you use RAG and knowledge graphs together?

Yes — this is called GraphRAG, and it represents the state of the art for complex knowledge retrieval. The core insight is that vector similarity search (traditional RAG) is excellent at finding relevant passages but poor at understanding relationships between entities, while knowledge graphs excel at relationships but cannot handle free-text queries natively.

GraphRAG combines both:

1. **Documents are chunked and embedded** into a vector database (standard RAG).
2. **Entities and relationships are extracted** from the same documents and stored in a knowledge graph.
3. **At query time**, the system performs both a vector similarity search and a graph traversal, then combines the results before passing them to the LLM.

```
Query: "What vendors does Acme Corp use for HVAC maintenance?"

Vector Search → finds passages mentioning Acme Corp and HVAC
Graph Traversal → finds: Acme Corp → [contracts_with] → CoolAir Systems
                         Acme Corp → [contracts_with] → ThermalPro Inc
                         CoolAir Systems → [provides] → HVAC Maintenance

Combined context → LLM generates accurate, relationship-aware answer
```

Microsoft Research's implementation of GraphRAG (published 2024) demonstrated that graph-augmented retrieval significantly improved answer comprehensiveness on complex questions requiring synthesis across multiple documents. The approach builds a hierarchical community structure from extracted entities and uses community summaries to answer global questions that traditional RAG misses entirely.

The trade-off is complexity. GraphRAG requires an entity extraction pipeline (typically an LLM call per chunk), a graph database, and a query planner that coordinates both retrieval paths. For simple Q&A over a document corpus, traditional RAG is sufficient. GraphRAG shines when your data contains dense relationships — organizational hierarchies, supply chains, regulatory dependencies, multi-step procedures.

### How do knowledge graphs reduce hallucinations?

Knowledge graphs reduce hallucinations by constraining the space of possible answers to verified, structured relationships. When an LLM generates a response from unstructured text chunks alone, it may infer connections that do not exist or confuse entities with similar names. A knowledge graph provides explicit, validated relationships that the LLM can reference instead of guessing.

The mechanism works at three levels:

1. **Entity disambiguation** — A graph node for "Mercury" is explicitly typed as either a planet, an element, or a car manufacturer. The LLM does not need to guess from context.
2. **Relationship validation** — If the graph contains `Alice → [manages] → Bob` but no `Alice → [manages] → Charlie`, the LLM is less likely to hallucinate that Alice manages Charlie.
3. **Path-based reasoning** — For multi-hop questions ("Who manages the person who designed the billing system?"), the graph provides an explicit traversal path rather than relying on the LLM to chain information across separate text chunks.

Microsoft Research's 2024 GraphRAG paper found that combining graph-based retrieval with traditional vector search improved the comprehensiveness and groundedness of generated answers by approximately 40% for global sensemaking queries that require synthesizing information across many documents. The structured relationships in the graph act as guardrails, reducing the LLM's tendency to fill gaps with plausible-sounding but incorrect information.

The practical recommendation: if your domain has dense entity relationships (healthcare records, legal documents, organizational data, product catalogs with dependencies), a knowledge graph meaningfully reduces hallucinations. For flat document collections (blog posts, FAQs), the improvement may not justify the added complexity.

### What approach is more cost-effective for enterprises — vector DB, knowledge graph, or hybrid?

The answer depends on query volume, data complexity, and team size. Here is a realistic cost breakdown:

| Approach | Monthly Cost (10K docs, 10K queries/day) | Best For |
|----------|------------------------------------------|----------|
| Vector-only (Pinecone Standard) | $70-200/mo | Simple Q&A, document search |
| Vector-only (pgvector, self-hosted) | $0-50/mo (infra only) | Budget-conscious teams |
| Graph-only (Neo4j AuraDB) | $65-200/mo | Relationship-heavy domains |
| Hybrid (Pinecone + Neo4j) | $135-400/mo | Complex enterprises |
| Hybrid (pgvector + self-hosted Neo4j) | $50-100/mo (infra only) | Cost-optimized hybrid |

For most teams starting out, **vector-only with pgvector** is the most cost-effective. You are already running PostgreSQL for your application data, so adding the pgvector extension is essentially free. You lose some performance at very large scale (millions of vectors) compared to dedicated vector databases, but for collections under 1 million vectors, pgvector performs well.

For enterprises with complex entity relationships, the hybrid approach pays for itself through improved answer quality — fewer support tickets, fewer escalations, fewer hallucination-related incidents. The cost premium of $100-300/mo is negligible against the cost of a single incorrect AI-generated answer reaching a customer.

### When should I use Pinecone vs Neo4j vs both?

**Use Pinecone when:**
- Your primary use case is semantic search over documents
- You need managed infrastructure with zero ops burden
- Your data is mostly flat text (articles, help docs, product descriptions)
- You want fast iteration without managing infrastructure
- Query patterns are "find relevant passages" rather than "traverse relationships"

**Use Neo4j when:**
- Your data has dense, meaningful relationships (org charts, supply chains, dependency graphs)
- Queries require multi-hop reasoning ("find all suppliers of components used in products sold in Texas")
- You need to enforce relationship constraints on LLM outputs
- Your domain is inherently graph-shaped (social networks, knowledge ontologies, compliance rules)

**Use both when:**
- You need both semantic search AND relationship traversal
- Your documents contain entities with important cross-document relationships
- You are building a system that must answer both "what does this document say about X?" and "how is X related to Y and Z?"
- You can afford the operational complexity of maintaining two data stores

A practical litmus test: if a user asks a question that requires information from a single document, vector search is sufficient. If the answer requires connecting facts across multiple documents through entity relationships, you need a graph — either standalone or hybrid.

### Is GraphRAG worth the complexity for small teams?

For most small teams (under 5 engineers), no — not initially. GraphRAG adds three significant complexity layers:

1. **Entity extraction pipeline** — You need to run every document through an LLM to extract entities and relationships. This costs money (LLM API calls) and requires prompt engineering to extract entities accurately for your domain.
2. **Graph database operations** — Neo4j or Neptune requires schema design, query optimization (Cypher or SPARQL), and monitoring. This is a distinct skill set from vector database operations.
3. **Query orchestration** — You need a query planner that decides when to use vector search, graph traversal, or both. This adds latency and debugging complexity.

**Start with vector-only RAG.** Measure your retrieval quality. If you find that failures cluster around multi-hop or relationship-dependent questions, then GraphRAG is justified. Do not pre-optimize for complexity you may not need.

The exception: if your entire domain is relationship-centric (e.g., a compliance system mapping regulations to controls to evidence), start with GraphRAG from day one. Retrofitting relationships into a vector-only system is harder than building with them from the start.

### How do I choose between managed services vs self-hosted?

The decision framework is straightforward:

**Choose managed when:**
- Your team is small (under 5 engineers) and ops bandwidth is limited
- Speed to production matters more than marginal cost savings
- You do not have Kubernetes expertise in-house
- Your query volume is under 100K/day (managed pricing is reasonable at this scale)
- You value SLAs, automatic backups, and zero-downtime upgrades

**Choose self-hosted when:**
- Data sovereignty or compliance requires on-premise hosting
- Your query volume exceeds 100K/day (managed costs scale linearly; self-hosted costs are mostly fixed)
- You have dedicated DevOps/SRE capacity
- You are already running Kubernetes in production
- Budget constraints are severe (self-hosted can be 5-10x cheaper at scale)

**The hybrid path** (common and practical): Start with managed services to validate your architecture and get to production fast. Migrate to self-hosted when scale justifies the ops investment. Most managed vector databases offer compatible APIs, so migration is mostly an infrastructure change, not a code rewrite.

Atlas UX chose managed (Pinecone) because the team is small and the marginal cost of managed services ($70/mo) is trivial compared to the engineering time saved on infrastructure management.

## Implementation

### What embedding model should I use?

The embedding model landscape as of early 2026:

| Model | Dimensions | MTEB Score | Cost | Best For |
|-------|-----------|------------|------|----------|
| OpenAI text-embedding-3-large | 3072 | ~64.6 | $0.13/1M tokens | High-quality, API-based |
| OpenAI text-embedding-3-small | 1536 | ~62.3 | $0.02/1M tokens | Budget API option |
| Cohere embed-v3 | 1024 | ~64.5 | $0.10/1M tokens | Multilingual, search-optimized |
| BGE-large-en-v1.5 | 1024 | ~63.6 | Free (local) | Best free English option |
| E5-mistral-7b-instruct | 4096 | ~66.6 | Free (local, needs GPU) | Highest quality free option |
| Nomic-embed-text-v1.5 | 768 | ~62.2 | Free (local) | Lightweight, Matryoshka support |
| GTE-large-en-v1.5 | 1024 | ~65.4 | Free (local) | Strong free alternative |

**Practical guidance:**

- **If budget is not a concern:** Use OpenAI text-embedding-3-large. It is the easiest to integrate, consistently high quality, and the API is highly reliable.
- **If you want zero API costs:** Use BGE-large-en-v1.5 or GTE-large. They run on a single GPU or even CPU (slower) and score within 2-5% of OpenAI on most benchmarks.
- **If you need multilingual support:** Cohere embed-v3 is purpose-built for multilingual retrieval and outperforms OpenAI on non-English tasks.
- **If you have GPU resources and want maximum quality:** E5-mistral-7b-instruct currently leads open-source MTEB benchmarks but requires ~14GB VRAM.

One critical point: do not switch embedding models after you have built your index. Embeddings from different models are incompatible — you cannot search a Cohere-embedded index with OpenAI-embedded queries. Choose your model early and commit to it. If you must switch, you need to re-embed your entire corpus.

### How many dimensions do I need for my embeddings?

Fewer than you think. The common misconception is that more dimensions always mean better retrieval. In practice, the relationship between dimensionality and quality follows a curve of diminishing returns.

**General guidelines:**
- **768 dimensions** — Sufficient for most production use cases. Nomic-embed and many sentence-transformers models use this size.
- **1024 dimensions** — The sweet spot for quality vs. cost. BGE-large, Cohere embed-v3, and GTE-large all use 1024.
- **1536 dimensions** — OpenAI's small model. Marginal quality improvement over 1024 for most retrieval tasks.
- **3072 dimensions** — OpenAI's large model. Highest quality but 3x the storage cost of 1024.

**Matryoshka embeddings** let you have it both ways. Models trained with Matryoshka Representation Learning (like OpenAI text-embedding-3-large and nomic-embed) produce embeddings that can be truncated to fewer dimensions with graceful quality degradation. You can store 256-dimensional truncations for fast initial filtering and use full-dimension vectors only for re-ranking the top candidates.

**Storage math:** At 1024 dimensions with float32, each vector is 4KB. One million vectors = 4GB. At 3072 dimensions, that is 12GB. If you are using a managed vector database that charges by storage, this matters. If you are using pgvector on a server with 32GB RAM, it probably does not.

### What chunk size should I use?

Chunk size is the most impactful tuning parameter in a RAG system, and there is no universal answer. The right size depends on your documents and query patterns.

**Benchmarked guidelines:**

- **256-512 tokens** — Best for precise, fact-lookup queries ("What is the cancellation policy?"). Smaller chunks mean each chunk is more focused, reducing noise in retrieval results. Higher precision, lower recall.
- **512-1024 tokens** — The general-purpose sweet spot. Works well for most Q&A and conversational retrieval. Balances context and precision.
- **1024-2048 tokens** — Best for complex, multi-part questions that require broader context. Higher recall but more noise per chunk. Useful for summarization tasks.

**Practical chunking strategies:**

```python
# Strategy 1: Fixed-size with overlap (simplest, usually good enough)
chunk_size = 512  # tokens
overlap = 64      # 12.5% overlap prevents losing context at boundaries

# Strategy 2: Semantic chunking (split at paragraph/section boundaries)
# Use markdown headers, double newlines, or sentence boundaries
# Better quality but more complex to implement

# Strategy 3: Recursive chunking (LangChain's default)
# Try splitting by paragraph, then sentence, then character
# Ensures chunks respect natural document structure

# Strategy 4: Agentic chunking
# Use an LLM to determine optimal chunk boundaries
# Highest quality but most expensive — best for small, high-value corpora
```

**The evaluation-driven approach:** Create a golden dataset of 50-100 question-answer pairs from your documents. Test chunk sizes of 256, 512, and 1024 tokens. Measure hit rate (does the correct chunk appear in top-k results?) and MRR (Mean Reciprocal Rank). Use the chunk size that maximizes your retrieval metrics. This takes an afternoon and saves weeks of guessing.

### How do I handle documents that change frequently?

This is one of the most underestimated operational challenges in KB management. The naive approach (re-embed everything on every change) is wasteful and slow. Production strategies:

1. **Change detection with hashing** — Store a content hash for each document. On update, compare hashes. Only re-embed documents whose content actually changed.

```typescript
import crypto from "crypto";

function contentHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// Only re-embed if content changed
const newHash = contentHash(updatedDocument);
if (newHash !== storedHash) {
  const embedding = await embed(updatedDocument);
  await vectorDB.upsert(docId, embedding, { hash: newHash });
}
```

2. **Incremental updates** — Most vector databases support upsert operations. Update individual vectors without rebuilding the entire index.

3. **Versioned embeddings** — Store embeddings with a version timestamp. When a document changes, insert new embeddings and mark old ones as stale. Periodically prune stale embeddings. This lets you roll back if an update introduces problems.

4. **Webhook-driven re-indexing** — Wire document management systems (Notion, Confluence, Google Docs) to trigger re-embedding via webhooks. This keeps the KB current without polling.

5. **TTL-based staleness** — For documents that change on a known schedule (monthly reports, quarterly policies), set a TTL on embeddings. When TTL expires, flag the document for re-embedding in the next batch run.

### How do I evaluate if my KB is actually working?

You cannot improve what you do not measure. The standard evaluation metrics for KB retrieval:

**Retrieval Metrics (does the system find the right documents?):**
- **Hit Rate (Recall@k)** — What percentage of queries return the correct document in the top-k results? Target: >90% at k=5.
- **MRR (Mean Reciprocal Rank)** — How high does the correct document rank? MRR=1.0 means always first; MRR=0.5 means the correct doc averages second position. Target: >0.7.
- **NDCG (Normalized Discounted Cumulative Gain)** — A more nuanced ranking metric that accounts for the position of all relevant documents, not just the first one.

**End-to-End Metrics (does the system answer correctly?):**
- **Answer correctness** — Does the generated answer match the ground truth? Requires human evaluation or LLM-as-judge (GPT-4o comparing generated answer to reference answer).
- **Faithfulness** — Does the answer only contain information present in the retrieved context? Catches hallucinations where the LLM adds information not in the chunks.
- **Relevance** — Are the retrieved chunks actually relevant to the query, or is the system retrieving tangentially related content?

**Building a golden dataset:**

```python
# A golden dataset is 50-100 question-answer-source triples
golden_dataset = [
    {
        "question": "What is the cancellation policy for premium plans?",
        "expected_answer": "Premium plans can be cancelled with 30 days notice...",
        "source_document": "policies/cancellation.md",
        "source_chunk_id": "chunk_042"
    },
    # ... 49-99 more examples
]

# Automated evaluation loop
for item in golden_dataset:
    results = retrieval_pipeline.query(item["question"], top_k=5)
    hit = item["source_chunk_id"] in [r.id for r in results]
    reciprocal_rank = 1 / (results.index(item["source_chunk_id"]) + 1) if hit else 0
    log_metric("hit_rate", hit)
    log_metric("mrr", reciprocal_rank)
```

Build the golden dataset by hand — this is the one step you cannot automate. Have domain experts write questions they know your KB should answer, then record which document and chunk contain the answer. Run your retrieval pipeline against this dataset weekly. If hit rate drops below your threshold, investigate immediately.

## Multi-Agent Knowledge Sharing

### How do multiple agents share a knowledge base without conflicts?

Multi-agent KB sharing requires addressing three concerns: concurrent access, context relevance, and namespace isolation.

**Concurrent access** — Modern vector databases handle concurrent reads natively. Pinecone, Weaviate, and pgvector all support thousands of concurrent queries without locking. Writes are more nuanced — if two agents try to update the same document simultaneously, you need upsert semantics (last write wins) or optimistic locking (reject the second write and retry).

**Context relevance** — Different agents have different roles and therefore need different knowledge. A sales agent should retrieve pricing and product info; a support agent should retrieve troubleshooting guides. Two approaches:

1. **Namespace isolation** — Store each agent's knowledge in a separate namespace or collection. The sales agent queries the "sales" namespace; the support agent queries the "support" namespace. Simple but means shared knowledge must be duplicated.

2. **Metadata filtering** — Store all knowledge in a single index but tag chunks with metadata (`agent_role`, `department`, `access_level`). At query time, filter by metadata:

```typescript
const results = await pinecone.query({
  vector: queryEmbedding,
  topK: 5,
  filter: {
    agent_role: { $in: ["sales", "shared"] }
  }
});
```

3. **Tiered retrieval** — Query the agent-specific namespace first; if confidence is low, fall back to a shared global namespace. This is the pattern Atlas UX uses: agent-specific knowledge is checked first, then the shared KB, then web search as a last resort.

**Namespace isolation** is the safer default. Metadata filtering is more flexible but risks cross-contamination if filters are misconfigured.

### Can different agents have different views of the same KB?

Yes, and this is a common production pattern. The concept is analogous to database views in relational systems — same underlying data, different perspectives.

**Implementation approaches:**

1. **Weighted scoring** — All agents query the same index, but results are re-scored based on the agent's role. A technical agent might boost chunks tagged with `type: "engineering"` by 1.5x, while a customer-facing agent boosts `type: "user-guide"` chunks.

2. **Dynamic context enrichment** — Before passing retrieved chunks to the LLM, inject agent-specific instructions: "You are a sales agent. Prioritize pricing and feature comparison information. Ignore internal engineering details."

3. **Permission-based filtering** — Tag chunks with access levels (`public`, `internal`, `confidential`). Customer-facing agents can only retrieve `public` chunks. Internal agents can access all levels.

4. **Query rewriting** — Transform the raw user query based on the agent's perspective before embedding it. A sales agent's query "How does the system work?" becomes "How does the system work from a customer benefit and pricing perspective?" This naturally biases retrieval toward relevant content.

```typescript
// Query rewriting example
function rewriteQuery(rawQuery: string, agentRole: string): string {
  const perspectives: Record<string, string> = {
    sales: "from a customer benefit and pricing perspective",
    support: "for troubleshooting and resolution steps",
    engineering: "with technical implementation details",
    compliance: "regarding regulatory requirements and controls"
  };
  return `${rawQuery} ${perspectives[agentRole] || ""}`.trim();
}
```

### How does MCP fit into knowledge sharing?

The Model Context Protocol (MCP), introduced by Anthropic, standardizes how AI agents discover and consume external context — including knowledge bases. MCP is relevant to KB architecture because it provides a protocol-level answer to "how do agents from different frameworks query the same knowledge?"

Without MCP, each agent framework (LangChain, CrewAI, AutoGen) implements its own retrieval interface. A KB built for LangChain requires adapter code to work with CrewAI. MCP eliminates this by defining a standard interface for context resources.

In an MCP-enabled architecture:
- The KB exposes itself as an MCP resource (e.g., `kb://atlas/agents`)
- Any MCP-compatible agent can discover and query the KB using the standard protocol
- The KB can advertise its capabilities (semantic search, filtered search, graph traversal)
- Authentication and access control are handled at the MCP layer

```typescript
// MCP resource definition for a knowledge base
const kbResource = {
  uri: "kb://atlas/agents",
  name: "Atlas Agent Knowledge Base",
  description: "Searchable knowledge base for all Atlas agents",
  mimeType: "application/json",
  capabilities: ["semantic_search", "filtered_search", "metadata_query"]
};
```

For teams building multi-agent systems with heterogeneous frameworks, MCP reduces integration code significantly. For single-framework teams, MCP is future-proofing — it ensures your KB is queryable by any agent, not just the ones you built today.

The key insight: MCP turns your KB from a private implementation detail into a portable capability. An agent built in LangChain, a Claude-based tool, and a custom TypeScript agent can all query the same KB through MCP without any adapter code. This is especially powerful for teams that sell AI products to customers using different stacks.

## Maintenance

### How often should I re-index my knowledge base?

The answer depends on how frequently your source documents change and how tolerance for staleness varies by use case:

- **Static documents (policies, procedures, product specs):** Re-index when the document changes. Event-driven, not scheduled.
- **Semi-dynamic content (help articles, FAQ, documentation):** Re-index daily or weekly via a batch job. A nightly cron that checks content hashes and re-embeds changed documents works well.
- **Highly dynamic content (pricing, inventory, news):** Consider whether a KB is the right tool. If data changes hourly, you may want a live API lookup (tool use) rather than pre-embedded chunks. Embedding latency (seconds to minutes) makes KBs unsuitable for real-time data.
- **Full re-index (re-embed everything):** Only necessary when you change embedding models, update chunk sizes, or restructure metadata. Plan for 2-4x the embedding cost of your initial index.

**The operational pattern:** Set up change detection (content hashing, git diffs, or CMS webhooks) that flags modified documents. Run a nightly job that re-embeds only changed documents. Do a full re-index quarterly as a housekeeping measure.

### How do I detect knowledge drift or stale content?

Knowledge drift occurs when your source documents become outdated but the KB continues to serve them as current truth. This is insidious because the retrieval system works correctly — it finds the relevant chunks — but the chunks themselves contain outdated information.

**Detection strategies:**

1. **TTL metadata** — Attach an expiration date to every chunk. A dashboard shows chunks past their TTL. Simple and effective.

2. **Query-answer feedback loops** — When users mark an answer as incorrect or unhelpful, log the source chunks. Chunks that accumulate negative feedback are candidates for review.

3. **Automated freshness scoring** — Periodically run a sample of queries through the pipeline and have an LLM evaluate whether the retrieved content appears current. Flag chunks that reference outdated dates, discontinued products, or superseded policies.

4. **Source document monitoring** — Track the last-modified date of source documents. If a source document has been updated but the corresponding chunks have not been re-embedded, flag them.

5. **Embedding drift detection** — If your domain vocabulary is shifting (new product names, changed terminology), queries using new terms will have lower similarity scores against old embeddings. Monitor average similarity scores over time; a declining trend indicates the index is falling behind the domain.

Atlas UX implements automated health scoring that runs periodically, checking for stale content, broken references, and drift signals. Documents that fail health checks enter a self-healing pipeline that attempts automatic remediation (re-chunking, re-embedding) before escalating to human review.

### What is the human-in-the-loop pattern for KB quality?

Fully automated KB systems degrade over time. Human-in-the-loop (HITL) patterns keep quality high:

1. **Review queue** — Flag low-confidence retrievals (similarity score below threshold) for human review. A human verifies whether the retrieved chunks were relevant and whether the generated answer was correct.

2. **Golden dataset expansion** — Periodically (monthly), have domain experts add new question-answer pairs to the golden dataset. Run automated evaluation against the expanded dataset. This catches quality regressions that the original dataset would miss.

3. **Content curation** — Before new documents enter the KB, a human reviews them for accuracy, completeness, and appropriate chunking. Garbage in, garbage out — no amount of retrieval optimization compensates for low-quality source documents.

4. **Approval gates for high-stakes updates** — When the KB is updated with content that affects high-risk domains (medical, legal, financial), require human approval before the new embeddings go live. Stage the update, run evaluation, and promote to production only after review.

5. **Periodic audits** — Quarterly, pull a random sample of 100 queries from production logs. Have a human grade the system's retrieval and generation quality. Track the score over time. If it drops, investigate.

The key principle: automate the routine, gate the critical. Low-risk KB updates (new help articles, FAQ additions) can flow through automatically. High-risk updates (policy changes, compliance documents, pricing) require human eyes.

## Common Mistakes

### What are the most common KB anti-patterns?

Teams repeatedly make the same mistakes. Here are the top anti-patterns and how to avoid them:

1. **Chunks too large (>2000 tokens)** — Large chunks contain multiple topics, polluting retrieval with irrelevant content. The system retrieves the right document but the wrong section. Fix: chunk at 512-1024 tokens with semantic boundaries.

2. **No metadata on chunks** — Storing raw text without source, date, category, or access-level metadata makes filtering impossible. You cannot implement agent-specific views or staleness detection without metadata. Fix: always store at minimum `source_file`, `created_at`, `category`.

3. **No evaluation framework** — Teams build a KB, manually test a few queries, and declare it "working." Without a golden dataset and automated metrics, quality degrades silently. Fix: build a 50+ question golden dataset before launch.

4. **Embedding everything including garbage** — Ingesting entire document repositories without curation means your index contains meeting notes, draft documents, duplicate content, and formatting artifacts. The retrieval system drowns in noise. Fix: curate before ingesting. Quality over quantity.

5. **Ignoring retrieval quality metrics** — Teams optimize LLM prompts when the real problem is poor retrieval. If the right chunks are not in the top-5 results, no prompt engineering will save you. Fix: measure hit rate and MRR first. Optimize retrieval before generation.

6. **No chunk overlap** — Splitting documents at hard boundaries loses context at the edges. A sentence split across two chunks is findable in neither. Fix: use 10-15% overlap between consecutive chunks.

7. **Single-model lock-in without abstraction** — Hardcoding OpenAI embedding calls throughout the codebase makes it impossible to switch models or use local alternatives. Fix: abstract the embedding call behind an interface. Swap implementations without changing retrieval code.

8. **Not testing with real user queries** — Evaluating with perfectly-phrased questions that mirror your document headings gives artificially high scores. Real users ask messy, incomplete, misspelled questions. Fix: collect actual user queries from logs and add them to your evaluation set.

### Why does my RAG system hallucinate even with good documents?

Several root causes, in order of likelihood:

1. **Retrieved chunks are relevant but insufficient** — The chunks contain related information but not the specific answer. The LLM fills the gap with plausible fabrication. Fix: improve chunking to ensure complete answers are contained within single chunks or overlapping chunk pairs.

2. **The LLM ignores retrieved context** — Large models sometimes rely on parametric knowledge (training data) instead of the provided context, especially if the context contradicts what the model "knows." Fix: use explicit instructions: "Answer ONLY based on the provided context. If the context does not contain the answer, say so."

3. **Too many retrieved chunks** — Stuffing 10-20 chunks into the context window overwhelms the model. It cherry-picks fragments and synthesizes a plausible-but-wrong answer. Fix: retrieve fewer, higher-quality chunks (top-3 to top-5). Use re-ranking to ensure the best chunks surface first.

4. **Context window position bias** — LLMs pay more attention to the beginning and end of the context window ("lost in the middle" phenomenon documented by Liu et al., 2023). If the most relevant chunk is buried in position 4 of 8, the model may under-weight it. Fix: place the highest-ranked chunk first.

5. **No faithfulness guardrail** — The system does not check whether the generated answer is supported by the retrieved context. Fix: add a post-generation faithfulness check — a second LLM call that verifies every claim in the answer is grounded in the context.

```typescript
// Simple faithfulness check
const faithfulnessPrompt = `
Given the following context and generated answer, determine if
every factual claim in the answer is supported by the context.

Context: ${retrievedChunks.join("\n")}
Answer: ${generatedAnswer}

Respond with: FAITHFUL or UNFAITHFUL, followed by explanation.
`;

const check = await llm.generate(faithfulnessPrompt);
if (check.startsWith("UNFAITHFUL")) {
  // Regenerate with stricter instructions or flag for review
}
```

### Why is my retrieval quality degrading over time?

Retrieval quality degradation is almost always caused by one of these:

1. **Index bloat** — New documents are continuously added but old, outdated, or duplicate documents are never removed. The index grows, and noise increases. Fix: implement a document lifecycle — archive or remove stale content regularly.

2. **Domain vocabulary shift** — Your users start using new terminology that was not in the original corpus. The embedding model cannot find relevant matches for queries using these new terms. Fix: periodically add documents covering new terminology. Consider re-embedding with a newer model that has been exposed to current language patterns.

3. **Query distribution shift** — Your users are asking different types of questions than when you built the golden dataset. Your system is optimized for the old distribution. Fix: sample recent production queries monthly and add representative examples to your evaluation set.

4. **Embedding model staleness** — If you are using a model from 2023 and your documents reference concepts, products, or terminology from 2025, the model's token-level understanding may be misaligned. Fix: consider upgrading to a newer embedding model (and re-indexing your entire corpus).

5. **Chunk boundary drift** — If your documents are being updated in-place but you are only re-embedding the changed document without re-chunking, the chunk boundaries may no longer align with semantic boundaries. Fix: re-chunk and re-embed on every document update, not just re-embed.

Monitor your golden dataset metrics weekly. When hit rate drops by more than 5 percentage points, investigate immediately — the cause is usually one of the five above.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Vector_space_model.png/400px-Vector_space_model.png — Vector space model showing document and query vectors in a shared geometric space for semantic search
2. https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Semantic_Net.svg/1200px-Semantic_Net.svg.png — Knowledge graph structure showing entities connected by typed relationships enabling multi-hop reasoning
3. https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Cosine_similarity.svg/400px-Cosine_similarity.svg.png — Cosine similarity measurement between two vectors illustrating how embedding similarity is computed
4. https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Voronoi_diagram.svg/400px-Voronoi_diagram.svg.png — Voronoi diagram illustrating how vector space is partitioned for approximate nearest neighbor search
5. https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/KNN_decision_boundary.svg/400px-KNN_decision_boundary.svg.png — K-nearest neighbors decision boundary showing how similarity search regions work in vector databases

## Videos

1. https://www.youtube.com/watch?v=sVcwVQRHIc8 — "RAG From Scratch" by LangChain — comprehensive walkthrough of building a RAG system from first principles, covering chunking, embedding, retrieval, and generation with practical code examples
2. https://www.youtube.com/watch?v=r09tJfON6kE — "GraphRAG: Unlocking LLM Discovery on Narrative Private Data" by Microsoft Research — demonstrates how knowledge graphs combined with vector search improve answer quality for complex queries requiring multi-document synthesis

## References

1. Lewis, P., et al. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." *Advances in Neural Information Processing Systems*. https://arxiv.org/abs/2005.11401

2. Edge, D., et al. (2024). "From Local to Global: A Graph RAG Approach to Query-Focused Summarization." *Microsoft Research*. https://arxiv.org/abs/2404.16130

3. Liu, N.F., et al. (2023). "Lost in the Middle: How Language Models Use Long Contexts." *arXiv preprint*. https://arxiv.org/abs/2307.03172

4. Muennighoff, N., et al. (2022). "MTEB: Massive Text Embedding Benchmark." *arXiv preprint*. https://arxiv.org/abs/2210.07316

5. Anthropic. (2024). "Model Context Protocol (MCP) Specification." https://modelcontextprotocol.io/