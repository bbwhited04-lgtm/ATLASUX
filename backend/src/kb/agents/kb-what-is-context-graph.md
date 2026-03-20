# What is a Context Graph?

## Introduction

As large language models become the primary interface between humans and knowledge, a critical engineering challenge has emerged: how to deliver exactly the right information to an LLM at query time, without overwhelming its context window or missing essential facts. The context graph is the answer to this challenge. Unlike a full knowledge graph that stores every fact about every entity in a domain, a context graph is a dynamic, purpose-built subgraph constructed specifically for a given query, conversation, or task. It represents the minimal relevant knowledge needed to produce an accurate, grounded response — nothing more, nothing less. Context graphs are the bridge between large-scale knowledge stores and the finite attention window of an LLM, and understanding how to build them efficiently is one of the most important skills in modern AI engineering.

## Definition: A Dynamic Subgraph at Query Time

A context graph is a subset of a larger knowledge source — typically a knowledge graph, but potentially spanning multiple data stores — assembled dynamically in response to a specific information need. It consists of:

- **Entities** (nodes): The specific people, places, things, events, or concepts relevant to the query
- **Relationships** (edges): The connections between those entities that are pertinent to the query
- **Properties** (attributes): The specific data values on entities and relationships needed for the response
- **Provenance** (metadata): Where each piece of information came from, enabling source attribution and confidence scoring

The word "context" is critical: the graph is not a comprehensive representation of all knowledge, but a *contextually relevant* slice. When a customer calls Lucy (Atlas UX's AI receptionist) and asks "Can I book a drain cleaning for Thursday?", the context graph might include the specific business's services, the technicians certified for drain cleaning, Thursday's schedule availability, and the customer's account history — but not the business's tax records, employee HR files, or five-year-old appointment data.

## How Context Graphs Are Built

### Step 1: Entity Extraction

The first step is identifying the entities referenced or implied by the query. This involves:

- **Named entity recognition (NER)**: Identifying proper nouns ("John Smith", "Acme Plumbing")
- **Concept detection**: Identifying domain concepts ("drain cleaning", "appointment", "Thursday")
- **Implicit entity resolution**: Inferring entities not explicitly mentioned (if the user is authenticated, their customer record is implicitly relevant)

```python
from typing import List, Dict

def extract_entities(query: str, user_context: Dict) -> List[Entity]:
    """Extract explicit and implicit entities from query."""
    # NER for named entities
    named = ner_model.extract(query)

    # Concept detection for domain terms
    concepts = concept_detector.match(query, domain_taxonomy)

    # Implicit entities from session context
    implicit = [user_context.get("customer"), user_context.get("business")]

    return deduplicate(named + concepts + [e for e in implicit if e])
```

### Step 2: Entity Linking

Extracted entity mentions must be linked to canonical entities in the knowledge store. "John Smith" might match three different customers — the system must disambiguate using context clues (phone number, location, previous interactions). Entity linking typically uses:

- **Exact match**: Name or identifier lookup
- **Fuzzy match**: Levenshtein distance, phonetic matching (Soundex, Metaphone)
- **Contextual disambiguation**: Using other entities in the query to narrow candidates
- **Embedding similarity**: Comparing entity embeddings to resolve ambiguous references

### Step 3: Neighborhood Retrieval

Once seed entities are linked, the system retrieves their neighborhoods from the knowledge store. This involves graph traversal — following relationships outward from seed entities to a specified depth (typically 1-3 hops).

```cypher
// Neo4j: Retrieve 2-hop neighborhood for a customer
MATCH path = (c:Customer {id: $customerId})-[*1..2]-(related)
WHERE related:Appointment OR related:Service OR related:Technician
RETURN path
```

The key challenge is controlling expansion. A naive 2-hop traversal from a well-connected entity can return thousands of nodes. Strategies for controlling expansion include:

- **Relationship type filtering**: Only follow specific relationship types relevant to the query
- **Recency filtering**: Prioritize recent relationships over historical ones
- **Relevance scoring**: Score each candidate node by its semantic similarity to the query
- **Cardinality limits**: Cap the number of neighbors retrieved per hop

### Step 4: Relevance Filtering

The raw neighborhood may contain irrelevant nodes. Relevance filtering removes them using:

- **Query-entity similarity**: Embedding similarity between the query and each candidate node
- **Temporal relevance**: Filtering out expired, archived, or future-dated information as appropriate
- **Access control**: Removing nodes the user does not have permission to see
- **Redundancy elimination**: Removing duplicate information available through multiple paths

### Step 5: Subgraph Assembly

The filtered nodes and edges are assembled into a coherent context graph. This step includes:

- **Structural coherence**: Ensuring the graph is connected (no orphan nodes)
- **Property selection**: Including only the properties needed for the response (not every attribute of every entity)
- **Ordering and ranking**: Arranging information by relevance, recency, or importance
- **Serialization**: Converting the graph into a format suitable for LLM consumption (typically structured text or JSON)

## Context Graph vs Full Knowledge Graph

Understanding the relationship between a context graph and a full knowledge graph is essential:

| Aspect | Context Graph | Full Knowledge Graph |
|--------|--------------|---------------------|
| **Scope** | Query-specific subset | Entire domain |
| **Size** | Tens to hundreds of nodes | Millions to billions of nodes |
| **Lifespan** | Seconds (one request) | Persistent (years) |
| **Construction** | Dynamic, per-query | Incremental, continuous |
| **Storage** | In-memory, ephemeral | Database (Neo4j, Neptune, etc.) |
| **Purpose** | Ground a specific LLM response | Store all domain knowledge |
| **Schema** | Inherited from source | Formally defined (ontology) |
| **Updates** | Never updated (rebuilt per query) | Continuously updated |
| **Query** | Pre-fetched, no query language | SPARQL, Cypher, Gremlin |

The context graph is to the knowledge graph what a database query result is to the full database — a filtered, projected, purpose-built view.

## Context Window Optimization

### The Token Budget Problem

LLMs have finite context windows. GPT-4 Turbo supports 128K tokens; Claude supports up to 200K tokens. While these windows are large, they are not unlimited, and filling them with irrelevant information degrades response quality. Research has shown that LLMs perform worse when given too much context — a phenomenon sometimes called "lost in the middle" — where information in the middle of a long context is less likely to be used than information at the beginning or end.

### Context Graph as Token Optimizer

A well-constructed context graph solves the token budget problem by delivering maximum relevant information per token:

- **Structured format**: A graph serialized as key-value pairs or structured JSON is more token-efficient than raw document text
- **Deduplication**: Overlapping information from multiple sources is merged, not repeated
- **Hierarchical detail**: Critical facts are included at full detail; supporting facts are summarized
- **Progressive disclosure**: In multi-turn conversations, the context graph can expand incrementally rather than repeating all information each turn

### Serialization Strategies

How a context graph is serialized into the LLM's prompt significantly affects performance:

```
# Option 1: Structured text (token-efficient, readable)
Customer: John Smith (ID: cust-42)
- Phone: 555-0123
- Address: 123 Main St, Springfield
- Account since: 2024-01-15

Upcoming Appointments:
- APT-301: Pipe Repair | 2026-03-25 10:00 | Tech: Mike Johnson
- APT-305: Drain Cleaning | 2026-04-02 14:00 | Tech: Sarah Chen

Services Available:
- Pipe Repair: $150-300 | 1-3 hours
- Drain Cleaning: $100-200 | 1-2 hours
```

```json
// Option 2: JSON (machine-parseable, slightly more tokens)
{
  "customer": {
    "name": "John Smith",
    "id": "cust-42",
    "appointments": [
      {"id": "APT-301", "service": "Pipe Repair", "date": "2026-03-25T10:00:00Z"}
    ]
  }
}
```

Research suggests that structured text (Option 1) provides the best balance of token efficiency and LLM comprehension for most use cases.

## How LLMs Use Context Graphs for Grounded Responses

### The Grounding Pattern

Without a context graph, an LLM generates responses based solely on its training data — which may be outdated, incomplete, or wrong about specific facts. With a context graph, the LLM has verifiable facts to reference:

```
System: You are Lucy, an AI receptionist for Acme Plumbing.
Use the following context to answer the customer's question.
Do not make up information not present in the context.

[CONTEXT GRAPH]
Business: Acme Plumbing
Operating Hours: Mon-Fri 8AM-6PM, Sat 9AM-1PM
Services: Pipe Repair ($150-300), Drain Cleaning ($100-200), ...
Available Slots Thursday 03/25:
- 10:00 AM (Tech: Mike Johnson)
- 2:00 PM (Tech: Sarah Chen)

[END CONTEXT]

Customer: Can I book a drain cleaning for Thursday?

Lucy: I have two openings for drain cleaning this Thursday —
10 AM with Mike Johnson or 2 PM with Sarah Chen.
Which time works best for you?
```

The response is grounded in the context graph: the available times, technician names, and service type all come from the graph, not from hallucination.

### Multi-Turn Context Evolution

In conversational AI, the context graph evolves across turns:

1. **Turn 1**: Customer asks about Thursday availability → context graph includes schedule
2. **Turn 2**: Customer picks 2 PM → context graph expands to include booking confirmation details
3. **Turn 3**: Customer asks about price → context graph already includes pricing from Turn 1
4. **Turn 4**: Customer confirms → context graph includes booking confirmation, SMS details

Each turn may trigger additional entity lookups and graph expansion, but the previously assembled context is retained and augmented.

## Implementation Patterns

### Neo4j Subgraph Queries

Neo4j's Cypher query language is well-suited for context graph construction:

```cypher
// Build context graph for appointment booking query
MATCH (b:Business {id: $businessId})
OPTIONAL MATCH (b)-[:OFFERS]->(s:Service)
OPTIONAL MATCH (s)<-[:QUALIFIED_FOR]-(t:Technician)
OPTIONAL MATCH (t)-[:HAS_SCHEDULE]->(slot:TimeSlot)
  WHERE slot.date = date($targetDate) AND slot.available = true
RETURN b, collect(DISTINCT s) as services,
       collect(DISTINCT t) as technicians,
       collect(DISTINCT slot) as slots
```

### NetworkX for In-Memory Graphs

For smaller knowledge stores or when the knowledge is already in memory, Python's NetworkX library provides a lightweight alternative:

```python
import networkx as nx

def build_context_graph(seed_entities, knowledge_graph, max_hops=2):
    context = nx.DiGraph()
    frontier = set(seed_entities)

    for hop in range(max_hops):
        next_frontier = set()
        for entity in frontier:
            neighbors = knowledge_graph.neighbors(entity)
            for neighbor in neighbors:
                edge_data = knowledge_graph.edges[entity, neighbor]
                if is_relevant(neighbor, edge_data):
                    context.add_edge(entity, neighbor, **edge_data)
                    next_frontier.add(neighbor)
        frontier = next_frontier

    return context
```

### LangGraph for Stateful Context

LangGraph extends LangChain with graph-based state management, making it natural to maintain context graphs across conversation turns:

```python
from langgraph.graph import StateGraph

class ConversationState:
    context_graph: dict
    messages: list
    entities: list

def update_context(state: ConversationState):
    new_entities = extract_entities(state.messages[-1])
    expanded = expand_graph(state.context_graph, new_entities)
    return {"context_graph": expanded}
```

## Performance Characteristics

### Latency

Context graph construction must be fast. Target latencies:

- **Entity extraction**: 10-50ms (NER models, concept matching)
- **Entity linking**: 20-100ms (index lookup, disambiguation)
- **Graph retrieval**: 10-50ms (indexed graph database query)
- **Relevance filtering**: 5-20ms (scoring and pruning)
- **Total**: Under 200ms end-to-end for real-time applications

### Token Efficiency

A well-constructed context graph typically reduces token usage by 60-80% compared to naive document retrieval, while maintaining or improving answer accuracy. Instead of retrieving three 500-word document chunks (1,500 words, ~2,000 tokens), a context graph might deliver the same essential facts in 200 words (~270 tokens).

### Accuracy Improvements

Research and production experience show consistent accuracy improvements when using context graphs versus raw retrieval:

- **Factual accuracy**: 15-30% improvement over ungrounded generation
- **Hallucination reduction**: 40-60% fewer fabricated facts
- **Relevance**: 20-35% improvement in answer relevance scores
- **Consistency**: Multi-turn conversations maintain consistent facts across turns

## Conclusion

Context graphs are the runtime workhorse of knowledge-grounded AI. They solve the fundamental tension between the vast scale of organizational knowledge and the finite attention window of language models. By dynamically constructing query-specific subgraphs that contain exactly the relevant entities, relationships, and properties, context graphs enable AI systems that are factual, efficient, and contextually aware. The key insight is that context graphs are not a replacement for knowledge graphs or ontologies — they are the query-time complement that makes stored knowledge actionable. As conversational AI systems like Atlas UX's Lucy handle increasingly complex interactions, the quality of context graph construction directly determines the quality of the AI's responses.

## Media

1. ![Knowledge graph subgraph extraction](https://upload.wikimedia.org/wikipedia/commons/3/3a/GraphDatabase_PropertyGraph.png) — Property graph model showing the type of structure from which context graphs are extracted
2. ![Graph traversal visualization](https://upload.wikimedia.org/wikipedia/commons/5/5d/Breadth-First-Search-Algorithm.gif) — Breadth-first search traversal, the foundational algorithm for neighborhood retrieval in context graph construction
3. ![Semantic network diagram](https://upload.wikimedia.org/wikipedia/commons/2/21/Semantic_Net.svg) — Semantic network illustrating entity-relationship structure used in context graphs
4. ![Graph database query results](https://upload.wikimedia.org/wikipedia/commons/e/e9/Conceptual_graph.svg) — Conceptual graph showing how entities and relationships form a coherent subgraph
5. ![Neural network attention mechanism](https://upload.wikimedia.org/wikipedia/commons/5/5f/Attention_mechanism_diagram.png) — Attention mechanism visualization, analogous to how context graphs focus LLM attention on relevant knowledge

## Videos

1. https://www.youtube.com/watch?v=knDDGYHnnSY — "GraphRAG: Unlocking LLM discovery on narrative private data" by Microsoft Research
2. https://www.youtube.com/watch?v=lhkOC38Q6JA — "What is a Knowledge Graph?" by Cambridge Semantics, foundational to understanding context graph sources

## References

1. Edge, D., et al. (2024). "From Local to Global: A Graph RAG Approach to Query-Focused Summarization." Microsoft Research. https://arxiv.org/abs/2404.16130
2. Pan, J. Z., et al. (2023). "Unifying Large Language Models and Knowledge Graphs: A Roadmap." https://arxiv.org/abs/2306.08302
3. Liu, N. F., et al. (2023). "Lost in the Middle: How Language Models Use Long Contexts." https://arxiv.org/abs/2307.03172
