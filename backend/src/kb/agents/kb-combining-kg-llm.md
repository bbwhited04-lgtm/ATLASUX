# Combining Knowledge Graphs with LLMs

## Introduction

Large language models generate remarkably fluent text, but they carry a fundamental liability: they have no mechanism for verifying the factual accuracy of what they produce. They memorize statistical patterns from training data, not structured facts. This makes them prone to hallucination — confidently stating things that are plausible but wrong. Knowledge graphs, by contrast, store explicit, structured facts with provenance and formal relationships, but they cannot generate natural language responses or reason flexibly about novel queries. The combination of knowledge graphs with LLMs is one of the most consequential architectural patterns in modern AI, producing systems that are simultaneously fluent and factual. This article examines why this combination works, how to implement it, and what results to expect.

## Why LLMs Need Structured Knowledge

### The Hallucination Problem

When an LLM is asked "What year was the Golden Gate Bridge completed?", it might answer correctly from training data. But when asked "What is the phone number for Acme Plumbing in Springfield?", it will either refuse or fabricate a number. The problem is fundamental: LLMs encode distributional patterns, not facts. They know what sounds right, not what is right.

Studies have quantified this problem. Research from the University of Massachusetts found that GPT-4 produces factual errors in 15-25% of responses on knowledge-intensive tasks, with the rate climbing for domain-specific or time-sensitive questions. For enterprise applications — booking appointments, quoting prices, checking availability — even a 5% hallucination rate is unacceptable.

### Staleness and Currency

LLMs have a knowledge cutoff. Information that changes after training (prices, schedules, personnel, policies) becomes stale. Knowledge graphs can be updated in real time, providing current facts that the LLM can reference without retraining.

### Explainability and Auditability

When an LLM generates an answer, tracing why it said what it said is nearly impossible. When a knowledge graph provides the facts that ground the answer, every claim can be traced to a specific node, edge, or property in the graph — with provenance, timestamps, and source attribution.

## Architecture Patterns

### Pattern 1: KG-Augmented Generation

The most common pattern. At query time, relevant facts are retrieved from the knowledge graph and injected into the LLM's context. The LLM generates a natural language response grounded in those facts.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User Query  │────>│  KG Retrieval│────>│   LLM with   │
│              │     │  (subgraph)  │     │  KG context  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                           ┌──────▼───────┐
                                           │  Grounded    │
                                           │  Response    │
                                           └──────────────┘
```

**Implementation steps:**

1. Parse the user query to extract entities and intent
2. Link extracted entities to nodes in the knowledge graph
3. Retrieve a subgraph (context graph) relevant to the query
4. Serialize the subgraph into structured text
5. Inject the serialized context into the LLM prompt
6. Generate a response constrained by the provided context

```python
from neo4j import GraphDatabase
from openai import OpenAI

def kg_augmented_generation(query: str, neo4j_driver, openai_client):
    # Step 1-2: Extract and link entities
    entities = extract_entities(query)

    # Step 3: Retrieve relevant subgraph
    with neo4j_driver.session() as session:
        result = session.run("""
            MATCH (e)-[r]->(related)
            WHERE e.name IN $entities
            RETURN e.name as source, type(r) as relation,
                   related.name as target, properties(related) as props
            LIMIT 50
        """, entities=[e.name for e in entities])

        facts = [dict(record) for record in result]

    # Step 4: Serialize to structured text
    context = format_kg_context(facts)

    # Step 5-6: Generate grounded response
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": f"Answer using ONLY these facts:\n{context}"},
            {"role": "user", "content": query}
        ]
    )
    return response.choices[0].message.content
```

### Pattern 2: KG-Guided Retrieval

Instead of retrieving raw text chunks via vector similarity, the knowledge graph guides what to retrieve. The graph's structure — entity types, relationship paths, domain constraints — determines which documents, chunks, or facts are relevant.

This pattern is particularly powerful for multi-hop questions. If a user asks "Which technicians certified in gas fitting are available Thursday?", a vector search might retrieve documents mentioning "technician," "gas fitting," or "Thursday" separately. A KG-guided retrieval follows the explicit path: Technician → hasCertification → GasFitting AND Technician → hasSchedule → Thursday → isAvailable.

### Pattern 3: KG-Constrained Decoding

The most aggressive integration pattern. During generation, the LLM's output tokens are constrained by the knowledge graph's structure. If the KG says there are three available time slots (10 AM, 2 PM, 4 PM), the decoding process ensures the LLM can only output one of those three when suggesting a time.

This pattern is computationally expensive and harder to implement but eliminates hallucination for constrained fields (times, prices, names, identifiers).

### Pattern 4: LLM-Powered KG Construction

The reverse direction: using LLMs to build and maintain knowledge graphs. LLMs excel at extracting entities and relationships from unstructured text, which can then be validated and stored in the knowledge graph.

```python
def extract_triples(text: str, openai_client) -> list:
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{
            "role": "system",
            "content": """Extract entity-relationship-entity triples from the text.
            Format: (subject, predicate, object)
            Example: (John Smith, is_customer_of, Acme Plumbing)"""
        }, {
            "role": "user",
            "content": text
        }]
    )
    return parse_triples(response.choices[0].message.content)
```

## Context Graph vs Knowledge Graph for LLM Augmentation

A critical architectural decision is whether to pass a full knowledge graph section or a dynamically constructed context graph to the LLM.

| Dimension | Full KG Section | Context Graph |
|-----------|----------------|---------------|
| **Size** | Large (potentially thousands of triples) | Small (tens to hundreds of triples) |
| **Relevance** | Contains irrelevant information | Filtered to query-relevant facts only |
| **Token cost** | High (may exceed context window) | Low (optimized for token budget) |
| **Construction time** | Fast (pre-stored) | Requires runtime query and filtering |
| **Accuracy impact** | Risk of "lost in the middle" effect | Higher accuracy due to focused context |
| **Freshness** | Depends on KG update frequency | Always current (built at query time) |

For most applications, context graphs are the right choice for LLM augmentation. The full KG provides the backing store; the context graph provides the query-time payload.

## Microsoft's GraphRAG Approach

Microsoft Research published GraphRAG in 2024, introducing a two-phase approach that uses LLMs to build a knowledge graph from documents, then uses that graph for retrieval:

**Phase 1 — Indexing:**
1. Chunk documents into text segments
2. Use an LLM to extract entities and relationships from each chunk
3. Build a knowledge graph from extracted triples
4. Use community detection (Leiden algorithm) to identify topic clusters
5. Generate summaries for each community at multiple hierarchy levels

**Phase 2 — Querying:**
- **Local search**: For specific factual questions, retrieve relevant entities and their neighborhoods from the graph
- **Global search**: For broad thematic questions, use community summaries to provide comprehensive answers across the entire corpus

GraphRAG's key insight is that graph structure enables answering questions that require synthesizing information across many documents — something traditional RAG struggles with. When asked "What are the main themes across all customer complaints?", traditional RAG retrieves individual complaint documents. GraphRAG's community summaries provide a pre-computed thematic analysis.

```python
# Simplified GraphRAG local search
def graphrag_local_search(query, entity_graph, community_summaries):
    # Find seed entities from query
    seed_entities = find_entities(query, entity_graph)

    # Expand to include neighbors and community context
    context_entities = expand_neighborhood(seed_entities, entity_graph, hops=2)
    relevant_communities = get_communities(context_entities)

    # Build context from entities + community summaries
    context = serialize_entities(context_entities)
    context += serialize_communities(relevant_communities, community_summaries)

    # Generate grounded response
    return llm_generate(query, context)
```

## Google's KELM

Google's Knowledge-Enhanced Language Model (KELM) takes a different approach: instead of retrieving from a KG at query time, KELM converts knowledge graph triples into natural language sentences and uses them as additional training data for the language model.

The pipeline:
1. Extract triples from Wikidata (e.g., "Albert Einstein, born_in, Ulm")
2. Use a text generation model to convert triples to natural sentences ("Albert Einstein was born in Ulm, Germany")
3. Filter generated sentences for quality
4. Add the generated corpus to the LLM's training data

KELM's advantage is zero additional latency at inference time — the knowledge is baked into the model. Its disadvantage is that it cannot reflect real-time updates and requires retraining to incorporate new knowledge.

## Implementation: Entity Linking, Subgraph Extraction, Prompt Injection

### Entity Linking

Entity linking maps text mentions to canonical entities in the knowledge graph. This is the most error-prone step — incorrect linking produces irrelevant context.

```python
class EntityLinker:
    def __init__(self, kg_index):
        self.kg_index = kg_index  # Pre-built entity name index

    def link(self, mention: str, context: str) -> Optional[str]:
        # Exact match
        if entity_id := self.kg_index.exact_match(mention):
            return entity_id

        # Fuzzy match with context disambiguation
        candidates = self.kg_index.fuzzy_match(mention, threshold=0.8)
        if len(candidates) == 1:
            return candidates[0].id

        # Use context to disambiguate
        if len(candidates) > 1:
            return self.disambiguate(candidates, context)

        return None  # No match found
```

### Subgraph Extraction

Once entities are linked, extract their relevant neighborhoods:

```cypher
// Parameterized Cypher for subgraph extraction
MATCH (seed)
WHERE seed.id IN $entity_ids
CALL {
    WITH seed
    MATCH path = (seed)-[r*1..2]-(related)
    WHERE type(r) IN $allowed_relations
    RETURN path
    LIMIT 100
}
RETURN nodes(path) as nodes, relationships(path) as rels
```

### Prompt Injection

Serialize the subgraph and inject it into the LLM prompt:

```python
def build_augmented_prompt(query, subgraph, system_prompt):
    context_text = ""
    for node in subgraph.nodes:
        context_text += f"\n{node.type}: {node.name}"
        for prop, value in node.properties.items():
            context_text += f"\n  {prop}: {value}"

    for edge in subgraph.edges:
        context_text += f"\n{edge.source} --[{edge.type}]--> {edge.target}"

    return f"""{system_prompt}

KNOWLEDGE CONTEXT:
{context_text}

IMPORTANT: Only use facts from the knowledge context above.
If the context does not contain the answer, say so.

User question: {query}"""
```

## Benchmarks: Accuracy Improvements with KG Augmentation

Empirical results from research and production systems consistently show that KG augmentation improves LLM performance:

| Metric | LLM Only | LLM + Vector RAG | LLM + KG Augmentation |
|--------|----------|------------------|----------------------|
| Factual accuracy | 65-75% | 80-85% | 88-95% |
| Hallucination rate | 15-25% | 8-12% | 2-5% |
| Multi-hop accuracy | 30-40% | 45-55% | 70-85% |
| Source attribution | Not possible | Chunk-level | Triple-level |
| Consistency (multi-turn) | 60-70% | 70-80% | 85-95% |

These numbers are compiled from multiple sources including Microsoft Research's GraphRAG paper, academic benchmarks on knowledge-intensive QA tasks (Natural Questions, TriviaQA, HotpotQA), and production system reports.

The largest improvements come from multi-hop reasoning tasks. When a question requires connecting facts across multiple documents or entities, vector retrieval often fails because the relevant chunks may not share surface-level similarity. Knowledge graphs make these connections explicit through typed relationships.

## Practical Considerations

### Graph Freshness

A knowledge graph is only as useful as it is current. For enterprise applications, this means:
- Real-time updates for transactional data (appointments, availability, prices)
- Daily or weekly updates for reference data (service descriptions, policies)
- Versioning for auditability (what was the price when the booking was made?)

### Schema Design

The KG schema must balance expressiveness with query performance:
- Too fine-grained: Queries become complex, construction is expensive
- Too coarse: Relevant relationships are lost, retrieval degrades
- For most applications, 10-30 entity types and 20-50 relationship types is sufficient

### Fallback Strategy

Not every query will match entities in the knowledge graph. A robust system needs a fallback:
1. Try KG-augmented generation first
2. If no relevant entities are found, fall back to vector RAG
3. If no relevant documents are found, fall back to the LLM's training knowledge
4. If confidence is too low, acknowledge uncertainty

### Cost Analysis

KG augmentation adds cost at both indexing and query time:
- **Indexing**: Entity extraction, relationship extraction, graph construction
- **Query**: Entity linking, subgraph retrieval, prompt construction
- **Storage**: Graph database hosting (Neo4j, Amazon Neptune, or PostgreSQL with graph extensions)

For Atlas UX, the three-tier KB with namespace isolation and weighted scoring provides a pragmatic middle ground — structured metadata and category hierarchies provide many of the benefits of a full knowledge graph without the operational overhead of maintaining a separate graph database.

## Conclusion

Combining knowledge graphs with LLMs is not optional for production AI systems that must be factual and auditable. The architecture is straightforward: store structured knowledge in a graph, retrieve relevant subgraphs at query time, and inject them into the LLM's context. The result is an AI system that is fluent (thanks to the LLM), factual (thanks to the KG), and explainable (thanks to the provenance chain from response to source triple). As tools like Microsoft's GraphRAG mature and graph databases become more accessible, this combination will become the standard architecture for knowledge-intensive AI applications.

## Media

1. ![Knowledge graph visualization with entities and relationships](https://upload.wikimedia.org/wikipedia/commons/3/3a/GraphDatabase_PropertyGraph.png) — Property graph model showing labeled nodes and typed relationships
2. ![RDF triple structure diagram](https://upload.wikimedia.org/wikipedia/commons/1/12/RDF_example.svg) — RDF triple showing subject-predicate-object, the atomic unit of knowledge graphs
3. ![Semantic network with typed relations](https://upload.wikimedia.org/wikipedia/commons/2/21/Semantic_Net.svg) — Semantic network illustrating how concepts connect through named relationships
4. ![SPARQL query execution flow](https://upload.wikimedia.org/wikipedia/commons/f/f7/Semantic_web_stack.svg) — Semantic Web stack showing layers from RDF to OWL to SPARQL
5. ![Graph database traversal pattern](https://upload.wikimedia.org/wikipedia/commons/5/5d/Breadth-First-Search-Algorithm.gif) — BFS traversal animation showing how subgraph extraction works

## Videos

1. https://www.youtube.com/watch?v=knDDGYHnnSY — "GraphRAG: Unlocking LLM discovery on narrative private data" by Microsoft Research
2. https://www.youtube.com/watch?v=bvwjG-3qAmY — "Knowledge Graphs and Ontologies" by Dr. Juan Sequeda on combining structured knowledge with AI

## References

1. Edge, D., et al. (2024). "From Local to Global: A Graph RAG Approach to Query-Focused Summarization." Microsoft Research. https://arxiv.org/abs/2404.16130
2. Pan, J. Z., et al. (2023). "Unifying Large Language Models and Knowledge Graphs: A Roadmap." https://arxiv.org/abs/2306.08302
3. Agarwal, O., et al. (2021). "Knowledge Graph Based Synthetic Corpus Generation for Knowledge-Enhanced Language Model Pre-training (KELM)." https://arxiv.org/abs/2010.12688
4. Hogan, A., et al. (2021). "Knowledge Graphs." *ACM Computing Surveys*, 54(4). https://dl.acm.org/doi/10.1145/3447772
