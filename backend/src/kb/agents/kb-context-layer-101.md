# Context Layer 101

## Introduction

When an AI agent needs to answer a question, it faces a deceptively simple problem: what information does it need? The answer is not "everything" — that would overwhelm the context window and degrade response quality. The answer is not "nothing" — that would leave the agent guessing, prone to hallucination. The answer is a carefully curated selection of relevant facts, structured for the agent's consumption. The context layer is the architectural component responsible for this curation. It sits between raw data stores (databases, vector stores, knowledge graphs, APIs) and the AI consumer (the LLM), transforming raw information into contextually relevant, properly formatted, appropriately scoped input. A well-designed context layer is the difference between an AI assistant that gives confident wrong answers and one that gives grounded, accurate, helpful responses.

## What is a Context Layer?

### Definition

A context layer is an abstraction layer between raw data sources and AI consumers that performs retrieval, ranking, filtering, augmentation, and formatting of information to produce optimal context for a given query or task.

Think of it as a concierge: the hotel has thousands of rooms, restaurants, activities, and services (raw data). A guest asks "What should I do tonight?" (query). The concierge does not hand them the hotel's entire service directory. Instead, the concierge considers the guest's preferences, budget, group size, and what is actually available tonight, then presents three tailored recommendations (context). The context layer is the concierge for AI systems.

### Position in the Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User / Application                                     │
└───────────────────────┬─────────────────────────────────┘
                        │ Query
                        ▼
┌─────────────────────────────────────────────────────────┐
│  AI Consumer (LLM)                                       │
│  - Generates response using provided context             │
└───────────────────────┬─────────────────────────────────┘
                        │ Needs context
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Context Layer                                           │
│  ┌───────────┬──────────┬──────────┬──────────────────┐ │
│  │ Retrieve  │  Rank    │  Filter  │  Format          │ │
│  │ (search   │  (score, │  (access,│  (serialize,     │ │
│  │  multiple │  rerank, │  scope,  │  structure,      │ │
│  │  sources) │  merge)  │  dedupe) │  attribute)      │ │
│  └───────────┴──────────┴──────────┴──────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ Queries
                        ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Vector   │  │ Knowledge│  │ Relational│  │ APIs     │
│ Store    │  │ Graph    │  │ Database  │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

## Why AI Agents Need a Context Layer

### Beyond Raw Retrieval

Without a context layer, AI agents retrieve raw data and stuff it into their prompt. This works for simple cases but fails at scale:

**Without context layer:**
1. User asks: "What plumbing services do you offer?"
2. Vector search returns 12 document chunks mentioning "plumbing"
3. Chunks include outdated pricing, irrelevant sections, and duplicate information
4. LLM receives 4,000 tokens of noisy context
5. Response includes outdated prices and irrelevant details

**With context layer:**
1. User asks: "What plumbing services do you offer?"
2. Context layer retrieves from multiple sources (KB articles, service database, pricing table)
3. Results are ranked by relevance, filtered for currency, deduplicated
4. Context is formatted with clear structure and source attribution
5. LLM receives 800 tokens of clean, current, relevant context
6. Response is accurate, concise, and cites sources

### The Problems a Context Layer Solves

| Problem | Without Context Layer | With Context Layer |
|---------|----------------------|-------------------|
| **Noise** | Irrelevant chunks dilute signal | Relevance filtering removes noise |
| **Staleness** | Outdated information served | Freshness filtering ensures currency |
| **Duplicates** | Same fact appears multiple times | Deduplication consolidates |
| **Missing context** | Important related facts omitted | Multi-source retrieval fills gaps |
| **Token waste** | Raw text consumes many tokens | Structured format is token-efficient |
| **No attribution** | Cannot trace claims to sources | Source metadata preserved |
| **Access violations** | Sensitive data may leak | Access control enforced at context layer |

## Components of a Context Layer

### Component 1: Retrieval

Retrieval is the first stage — gathering candidate information from multiple data sources:

```python
class ContextRetriever:
    def __init__(self, sources: list):
        self.sources = sources  # Vector store, KB, database, etc.

    async def retrieve(self, query: str, config: RetrievalConfig) -> list:
        """Retrieve candidates from all configured sources."""
        tasks = []
        for source in self.sources:
            if source.is_relevant_for(query):
                tasks.append(source.search(
                    query=query,
                    limit=config.per_source_limit,
                    filters=config.source_filters.get(source.name)
                ))

        results = await asyncio.gather(*tasks)
        return self.merge_results(results)
```

**Multi-source retrieval** is critical. A single source rarely has all the information needed:
- **Vector store**: Semantically similar content
- **Knowledge graph**: Structured entity relationships
- **Database**: Current transactional data (prices, availability, schedules)
- **API**: Real-time external data (weather, traffic, news)

### Component 2: Ranking

Raw retrieval results must be ranked by relevance, quality, and appropriateness:

```python
class ContextRanker:
    def rank(self, candidates: list, query: str, user_context: dict) -> list:
        """Rank candidates by composite relevance score."""
        for candidate in candidates:
            scores = {
                "semantic": candidate.similarity_score,
                "freshness": self.compute_freshness_score(candidate),
                "authority": self.compute_authority_score(candidate),
                "popularity": self.compute_popularity_score(candidate),
                "user_relevance": self.compute_user_relevance(candidate, user_context)
            }

            # Weighted composite score
            candidate.rank_score = (
                scores["semantic"] * 0.35 +
                scores["freshness"] * 0.25 +
                scores["authority"] * 0.20 +
                scores["popularity"] * 0.10 +
                scores["user_relevance"] * 0.10
            )

        return sorted(candidates, key=lambda c: c.rank_score, reverse=True)
```

**Reranking** with cross-encoder models can significantly improve result quality:
- First-stage retrieval uses bi-encoders (fast, approximate)
- Reranking uses cross-encoders (slow, accurate) on the top N candidates
- This two-stage approach balances speed and accuracy

### Component 3: Filtering

Filtering removes candidates that should not be included in the context:

```python
class ContextFilter:
    def filter(self, candidates: list, context_config: dict) -> list:
        """Apply filters to remove inappropriate candidates."""
        filtered = candidates

        # Access control: remove content the user cannot see
        if context_config.get("user"):
            filtered = [c for c in filtered
                       if self.access_control.can_access(context_config["user"], c)]

        # Freshness: remove stale content
        max_age = context_config.get("max_age_days")
        if max_age:
            cutoff = datetime.utcnow() - timedelta(days=max_age)
            filtered = [c for c in filtered if c.updated_at >= cutoff]

        # Quality: remove low-quality content
        min_quality = context_config.get("min_quality_score", 0.5)
        filtered = [c for c in filtered if c.quality_score >= min_quality]

        # Deduplication: remove near-duplicate content
        filtered = self.deduplicate(filtered, similarity_threshold=0.9)

        # Token budget: truncate to fit context window
        token_budget = context_config.get("max_tokens", 2000)
        filtered = self.fit_to_budget(filtered, token_budget)

        return filtered
```

### Component 4: Augmentation

Augmentation enriches the retrieved content with additional context:

- **Entity resolution**: Link mentioned entities to their canonical records
- **Relationship injection**: Add relationships between entities that the retrieval missed
- **Temporal context**: Add "as of" timestamps so the LLM knows how current the information is
- **Confidence signals**: Add quality and reliability indicators
- **Source attribution**: Tag each piece of information with its source

### Component 5: Formatting

Formatting serializes the context into a format optimized for LLM consumption:

```python
class ContextFormatter:
    def format(self, context_items: list, format_config: dict) -> str:
        """Format context for LLM consumption."""
        sections = []

        for item in context_items:
            section = f"[Source: {item.source} | Updated: {item.updated_at.strftime('%Y-%m-%d')}]\n"

            if format_config.get("structured"):
                # Structured format (key-value pairs)
                for key, value in item.structured_data.items():
                    section += f"  {key}: {value}\n"
            else:
                # Prose format
                section += item.content

            sections.append(section)

        header = "CONTEXT (use only this information to answer):\n"
        footer = "\nEND CONTEXT"

        return header + "\n---\n".join(sections) + footer
```

## Context Layer vs RAG Pipeline

A RAG (Retrieval-Augmented Generation) pipeline is a specific implementation pattern. A context layer is a broader architectural concept that subsumes RAG:

| Aspect | RAG Pipeline | Context Layer |
|--------|-------------|---------------|
| **Scope** | Retrieve chunks → inject → generate | Full context lifecycle management |
| **Sources** | Usually single (vector store) | Multiple (vector, graph, DB, API) |
| **Intelligence** | Similarity-based retrieval | Multi-signal ranking and filtering |
| **State** | Stateless per query | Can maintain session context |
| **Governance** | Minimal | Access control, audit, attribution |
| **Quality** | Depends on chunk quality | Active quality filtering |
| **Format** | Raw chunks concatenated | Structured, optimized serialization |

A RAG pipeline is a context layer with a single retrieval source, no filtering beyond top-K similarity, and minimal formatting. A mature context layer adds multi-source retrieval, intelligent ranking, access-controlled filtering, quality-aware curation, and structured formatting.

## Design Patterns

### Tiered Retrieval

Not all information is equally important. A tiered retrieval pattern prioritizes authoritative sources:

```
Tier 1 (highest priority): Business-specific data
  - Real-time: prices, schedules, availability (from database)
  - Configured: business rules, policies (from settings)

Tier 2: Domain knowledge
  - KB articles, documentation, guides

Tier 3: General knowledge
  - Training data, public information
```

```python
class TieredContextLayer:
    def build_context(self, query: str, tenant_id: str) -> str:
        context_parts = []
        token_budget = 3000

        # Tier 1: Business-specific (highest priority, allocated most tokens)
        tier1 = self.get_business_context(query, tenant_id)
        context_parts.append(("BUSINESS DATA", tier1))
        token_budget -= self.count_tokens(tier1)

        # Tier 2: Domain knowledge (medium priority)
        if token_budget > 500:
            tier2 = self.get_kb_context(query, max_tokens=min(token_budget - 200, 1500))
            context_parts.append(("KNOWLEDGE BASE", tier2))
            token_budget -= self.count_tokens(tier2)

        # Tier 3: General knowledge (lowest priority, fills remaining budget)
        if token_budget > 200:
            tier3 = self.get_general_context(query, max_tokens=token_budget)
            context_parts.append(("REFERENCE", tier3))

        return self.format_tiered_context(context_parts)
```

### Context Window Management

Managing the LLM's finite context window is a core responsibility:

```python
class ContextWindowManager:
    def __init__(self, model_max_tokens: int):
        self.max_tokens = model_max_tokens
        self.reserved_for_system = 500    # System prompt
        self.reserved_for_response = 1000  # Generation budget
        self.reserved_for_history = 1000   # Conversation history

    @property
    def context_budget(self) -> int:
        return (self.max_tokens
                - self.reserved_for_system
                - self.reserved_for_response
                - self.reserved_for_history)

    def allocate(self, context_items: list) -> list:
        """Allocate token budget across context items by priority."""
        budget = self.context_budget
        allocated = []

        for item in sorted(context_items, key=lambda x: x.priority, reverse=True):
            item_tokens = self.count_tokens(item.content)
            if item_tokens <= budget:
                allocated.append(item)
                budget -= item_tokens
            elif budget > 100:
                # Truncate to fit remaining budget
                truncated = self.truncate_to_tokens(item, budget)
                allocated.append(truncated)
                budget = 0
                break

        return allocated
```

### Source Attribution

Every fact in the context should be traceable to its source:

```python
class AttributedContext:
    def build(self, query: str) -> dict:
        results = self.retrieve(query)
        context_text = ""
        sources = []

        for i, result in enumerate(results):
            source_id = f"[{i+1}]"
            context_text += f"{source_id} {result.content}\n"
            sources.append({
                "id": source_id,
                "source": result.source_name,
                "article": result.article_id,
                "updated": result.updated_at.isoformat(),
                "confidence": result.quality_score
            })

        return {
            "context": context_text,
            "sources": sources,
            "instruction": "Cite sources using [N] notation when using information from the context."
        }
```

### MCP-Based Context Layer

The Model Context Protocol (MCP) provides a standardized way to build context layers:

```typescript
// MCP server providing context for an AI agent
import { Server } from "@modelcontextprotocol/sdk/server";

const server = new Server({
  name: "atlas-context-layer",
  version: "1.0.0"
});

// Register context tool
server.tool("get_context", {
  description: "Get relevant context for answering a customer query",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      tenant_id: { type: "string" },
      max_tokens: { type: "number", default: 2000 }
    },
    required: ["query", "tenant_id"]
  }
}, async (params) => {
  const context = await buildContext(params.query, params.tenant_id, params.max_tokens);
  return {
    content: [{
      type: "text",
      text: context.formatted
    }],
    metadata: {
      sources: context.sources,
      token_count: context.tokens
    }
  };
});
```

## Atlas UX: Three-Tier KB with Namespace Isolation

Atlas UX implements a context layer through its three-tier KB architecture:

### Tier Architecture

```
┌───────────────────────────────────────────────┐
│  Tier 1: Tenant-Specific                       │
│  - Business hours, services, pricing           │
│  - Technician roster and certifications        │
│  - Custom policies and rules                   │
│  Namespace: tenant:{tenant_id}                 │
├───────────────────────────────────────────────┤
│  Tier 2: Domain Knowledge                      │
│  - Industry best practices                     │
│  - Service descriptions and standards          │
│  - Regulatory requirements                     │
│  Namespace: domain:{industry}                  │
├───────────────────────────────────────────────┤
│  Tier 3: Platform Knowledge                    │
│  - Agent capabilities and tools                │
│  - Platform features and documentation         │
│  - General reference                           │
│  Namespace: platform                           │
└───────────────────────────────────────────────┘
```

### Weighted Scoring

Results from different tiers are weighted to prioritize business-specific information:

```python
TIER_WEIGHTS = {
    "tenant": 1.5,    # Highest priority: tenant-specific data
    "domain": 1.0,    # Medium priority: domain knowledge
    "platform": 0.7   # Lower priority: general platform knowledge
}

def weighted_retrieval(query, tenant_id, domain):
    results = []
    for tier, weight in TIER_WEIGHTS.items():
        namespace = f"{tier}:{tenant_id}" if tier == "tenant" else f"{tier}:{domain}" if tier == "domain" else tier
        tier_results = vector_store.search(query, namespace=namespace, top_k=5)
        for result in tier_results:
            result.score *= weight
        results.extend(tier_results)

    return sorted(results, key=lambda r: r.score, reverse=True)[:10]
```

This ensures that when a customer asks about pricing, the tenant's actual prices appear before generic industry pricing guidance.

## Conclusion

A context layer is the architectural component that transforms raw data retrieval into intelligent context delivery. It is broader than RAG, more structured than ad-hoc retrieval, and essential for any AI system that must be accurate, efficient, and governable. The five components — retrieval, ranking, filtering, augmentation, and formatting — work together to ensure that AI consumers receive exactly the information they need: no more, no less, from the right sources, in the right format, with proper attribution. For platforms serving real customers, the context layer is the difference between an AI that sounds smart and one that actually is.

## Media

1. ![Client-server architecture diagram](https://upload.wikimedia.org/wikipedia/commons/f/fb/Server-based-network.svg) — Server architecture showing abstraction layers between data and clients
2. ![Information retrieval pipeline](https://upload.wikimedia.org/wikipedia/commons/c/c3/ETL_process_in_data_warehousing.png) — Data processing pipeline analogous to context layer stages
3. ![Semantic Web stack](https://upload.wikimedia.org/wikipedia/commons/f/f7/Semantic_web_stack.svg) — Technology layer stack showing how abstraction layers build on each other
4. ![Graph database query pattern](https://upload.wikimedia.org/wikipedia/commons/3/3a/GraphDatabase_PropertyGraph.png) — Property graph showing structured context relationships
5. ![Feedback control system](https://upload.wikimedia.org/wikipedia/commons/2/24/Feedback_loop_with_descriptions.svg) — Feedback loop illustrating context quality optimization

## Videos

1. https://www.youtube.com/watch?v=knDDGYHnnSY — "GraphRAG: Unlocking LLM discovery on narrative private data" by Microsoft Research on advanced context delivery
2. https://www.youtube.com/watch?v=T-D1OfcDW1M — "Building RAG Applications" by LangChain covering context assembly patterns for LLMs

## References

1. Edge, D., et al. (2024). "From Local to Global: A Graph RAG Approach to Query-Focused Summarization." Microsoft Research. https://arxiv.org/abs/2404.16130
2. Liu, N. F., et al. (2023). "Lost in the Middle: How Language Models Use Long Contexts." https://arxiv.org/abs/2307.03172
3. Model Context Protocol Documentation — https://modelcontextprotocol.io/docs
4. Lewis, P., et al. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." https://arxiv.org/abs/2005.11401
