# Context Graph vs Ontology

## Introduction

In the landscape of knowledge representation for AI systems, two concepts are frequently discussed but often confused: context graphs and ontologies. Both deal with structured knowledge. Both involve nodes, edges, and relationships. But they serve fundamentally different purposes, operate at different levels of abstraction, and are used at different stages of an AI pipeline. An ontology is a static, formal definition of what kinds of things exist in a domain and how they relate — it is the schema of knowledge. A context graph is a dynamic, runtime-constructed subgraph that captures only the information relevant to a specific query or conversation — it is a focused slice of knowledge. Understanding when to use which, and how they complement each other, is essential for building AI systems that are both intelligent and efficient.

## What is a Context Graph?

### Definition and Purpose

A context graph is a dynamically constructed subgraph assembled at query time from a larger knowledge source. When a user asks a question or an AI agent needs to reason about a situation, the system extracts the relevant entities, retrieves their relationships, and assembles a small, focused graph that contains just enough information to answer the question or complete the task.

Think of it this way: if a full knowledge graph is an entire city map, a context graph is the GPS route from your current location to your destination — it contains only the streets, intersections, and landmarks that are relevant to your specific journey.

### How Context Graphs Are Built

The construction of a context graph follows a pipeline:

1. **Entity extraction**: Identify the entities mentioned or implied in the query ("What appointments does John Smith have this week?")
2. **Entity linking**: Map extracted entities to nodes in the knowledge graph (John Smith → `customer:john-smith-42`)
3. **Neighborhood retrieval**: Fetch the immediate neighbors and their relationships (appointments, service history, contact information)
4. **Relevance filtering**: Remove nodes and edges that are irrelevant to the query (old appointments, unrelated services)
5. **Subgraph assembly**: Combine the filtered results into a coherent subgraph with provenance metadata

```python
# Pseudocode for context graph construction
def build_context_graph(query, knowledge_graph):
    entities = extract_entities(query)
    linked_entities = link_to_graph(entities, knowledge_graph)

    context = ContextGraph()
    for entity in linked_entities:
        neighbors = knowledge_graph.get_neighbors(entity, max_hops=2)
        relevant = filter_by_relevance(neighbors, query)
        context.add_subgraph(relevant)

    context.add_provenance(source=knowledge_graph.id, timestamp=now())
    return context
```

### Key Characteristics

- **Dynamic**: Created fresh for each query; no two context graphs are identical
- **Ephemeral**: Exists only for the duration of the query or conversation
- **Instance-level**: Contains specific entities and their actual relationships
- **Compact**: Designed to fit within an LLM's context window
- **Query-specific**: Optimized for answering a particular question

## What is an Ontology?

### Definition and Purpose

An ontology is a formal, explicit specification of the concepts in a domain, their properties, and the relationships between them. It defines the *types* of things that can exist (classes), the *kinds* of relationships between them (properties), and the *rules* that govern them (axioms and constraints). An ontology is the schema — the blueprint — that gives structure and meaning to data.

### Key Characteristics

- **Static**: Defined once, updated infrequently through deliberate editorial processes
- **Schema-level**: Defines types and relationships, not specific instances
- **Formal**: Expressed in logic (typically OWL or RDFS) with precise semantics
- **Shared**: Agreed upon by a community of stakeholders
- **Persistent**: Exists independently of any particular query

### Example

An ontology for a trade business domain might define:

```
Class: TradesBusiness
  SubClassOf: SmallBusiness
  Properties: hasService (→ Service), hasEmployee (→ Technician)

Class: Appointment
  Properties: scheduledFor (→ DateTime), withCustomer (→ Customer)
  Constraints: must have exactly 1 Customer, must have exactly 1 Service

Class: Technician
  SubClassOf: Employee
  Properties: hasCertification (→ Certification), servicesArea (→ GeoRegion)
```

This ontology says nothing about specific appointments or specific technicians. It defines what those *categories* are and how they relate.

## Key Differences

The following table captures the fundamental distinctions:

| Dimension | Context Graph | Ontology |
|-----------|--------------|----------|
| **Nature** | Runtime subgraph | Formal schema |
| **Content** | Specific instances and facts | Classes, properties, axioms |
| **Mutability** | Created and discarded per query | Stable, versioned, rarely changed |
| **Scope** | Narrow (query-relevant only) | Broad (entire domain) |
| **Formality** | Informal or semi-formal | Formally axiomatized (OWL, RDFS) |
| **Lifespan** | Seconds to minutes | Months to years |
| **Level** | Instance level (John Smith, Apt #42) | Schema level (Customer, Appointment) |
| **Purpose** | Ground LLM responses in facts | Define domain structure and constraints |
| **Size** | Tens to hundreds of nodes | Hundreds to thousands of class definitions |
| **Reasoning** | Traversal, filtering | Classification, consistency checking, inference |
| **Tools** | Neo4j queries, NetworkX, LangGraph | Protégé, TopBraid, OWL reasoners |
| **Users** | AI agents, retrieval systems | Knowledge engineers, domain modelers |

## When to Use Which

### Use an Ontology When...

- **Defining a domain model**: Before any data exists, you need to agree on what things are and how they relate. An ontology is the domain model.
- **Enforcing data quality**: Ontological constraints (cardinality, disjointness, range restrictions) catch invalid data before it enters the system.
- **Enabling interoperability**: When multiple systems must share a common vocabulary, an ontology provides the lingua franca.
- **Supporting formal reasoning**: When you need to derive new facts from existing ones (if A is a subclass of B, and X is an instance of A, then X is also an instance of B).
- **Building a knowledge graph**: The ontology defines the schema; the knowledge graph stores instances conforming to that schema.

### Use a Context Graph When...

- **Augmenting LLM responses**: An LLM needs grounded facts, not a full domain model. A context graph provides exactly the facts relevant to the current query.
- **Optimizing token usage**: LLM context windows are finite. A context graph delivers maximum relevant information per token.
- **Supporting conversational AI**: In a multi-turn conversation, the context graph evolves with each turn, accumulating relevant entities and relationships.
- **Enabling real-time retrieval**: Context graphs are built in milliseconds from pre-indexed knowledge stores, making them suitable for real-time applications.
- **Personalizing responses**: Context graphs can incorporate user-specific data (their history, preferences, location) alongside general knowledge.

### Use Both Together When...

The most powerful AI systems use ontologies and context graphs together:

1. The **ontology** defines the domain schema: what types of entities exist, how they can relate, what constraints apply
2. A **knowledge graph** stores instance data conforming to the ontology
3. At query time, a **context graph** is extracted from the knowledge graph, guided by the ontology's structure

```
┌─────────────────────────────────────────────────┐
│                  Query arrives                   │
│           "Does John have any upcoming           │
│            plumbing appointments?"                │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│     Ontology guides the search                   │
│  Customer → hasAppointment → Appointment         │
│  Appointment → forService → Service              │
│  Service.type = "Plumbing"                       │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  Context graph assembled from knowledge graph    │
│  John Smith → [Apt #301, Apt #305]               │
│  Apt #301 → Pipe Repair → 2026-03-25            │
│  Apt #305 → Drain Cleaning → 2026-04-02         │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│  Context graph injected into LLM prompt          │
│  → Grounded, accurate response                   │
└─────────────────────────────────────────────────┘
```

## How They Complement Each Other

### Ontology Guides Context Graph Construction

Without an ontology, context graph construction is purely statistical — the system retrieves nodes and edges based on embedding similarity or keyword matching. With an ontology, the system knows *what kinds* of relationships to follow. If the ontology defines that `Appointment` has a `scheduledTime` property, the context graph builder knows to include temporal data when the query mentions "upcoming" or "next week."

### Context Graphs Validate Against Ontology

When a context graph is assembled, it can be validated against the ontology. If the ontology says every Appointment must have exactly one Customer, and the context graph contains an Appointment without a Customer, this signals a data quality issue that should be flagged rather than silently passed to the LLM.

### Ontology Enables Schema-Aware Retrieval

Traditional vector retrieval treats all text chunks equally. Ontology-aware retrieval can weight results by their semantic type: when the query is about "appointments," chunks classified as `Appointment`-related (according to the ontology's class hierarchy) get higher relevance scores than generic business information.

### Context Graphs Provide Ontology Feedback

Usage patterns from context graph construction can inform ontology evolution. If context graphs frequently include entity types or relationships not captured in the ontology, this signals that the ontology needs expansion. If certain ontology classes are never instantiated in context graphs, they may be unnecessary.

## Real-World Examples

### Medical Decision Support

An ontology like SNOMED CT defines the medical domain: diseases, symptoms, treatments, and their relationships. When a physician enters a patient query, a context graph is built from the patient's electronic health record — their specific conditions, medications, and lab results — structured according to SNOMED CT's schema. The LLM receives this context graph and can reason about the specific patient while grounded in formal medical knowledge.

### Enterprise Knowledge Management

A company's enterprise ontology defines organizational structure, product taxonomy, and business processes. When an employee asks the AI assistant "What's our policy on returns for defective widgets?", a context graph is assembled: the specific product (Widget X), the return policy applicable to that product category, and any recent policy updates. The ontology ensures the right kind of information is retrieved; the context graph ensures only the relevant instances are included.

### Conversational AI for Trade Businesses

For a platform like Atlas UX, the domain ontology defines concepts like `TradesBusiness`, `Appointment`, `Service`, `Customer`, and `Technician`. When Lucy the AI receptionist handles a call, a context graph is built from the specific business's data: their services, their technicians' schedules, their booking rules. The ontology ensures Lucy asks the right questions; the context graph ensures the answers are specific to that business.

## Implementation Considerations

### Ontology Storage and Management

Ontologies are typically stored in OWL files, managed in version control, and loaded into reasoners or triple stores. Changes go through review processes similar to database schema migrations. Tools like Protégé provide visual editing; SHACL provides runtime validation.

### Context Graph Construction Performance

Context graph construction must be fast — typically under 100ms for real-time applications. This requires pre-indexed knowledge stores (graph databases like Neo4j, or optimized triple stores), efficient entity linking, and smart pruning algorithms that limit graph expansion.

### Caching and Reuse

While context graphs are ephemeral by nature, common subgraphs can be cached. If multiple queries from the same user session reference the same entities, the context graph builder can extend an existing context graph rather than constructing from scratch.

## Conclusion

Context graphs and ontologies are complementary tools that operate at different levels of the knowledge stack. Ontologies define what *kinds* of knowledge exist and how they relate — they are the schema. Context graphs assemble *specific* knowledge relevant to a particular query or task — they are the runtime payload. The most effective AI systems use both: ontologies to structure and validate knowledge, context graphs to deliver that knowledge efficiently to AI consumers. Understanding this distinction prevents the common mistake of treating all structured knowledge as equivalent, and enables architects to make informed decisions about where to invest in formal modeling versus dynamic retrieval.

## Media

1. ![Knowledge graph visualization](https://upload.wikimedia.org/wikipedia/commons/e/e9/Conceptual_graph.svg) — Conceptual graph showing relationships between entities
2. ![Semantic Web layer cake](https://upload.wikimedia.org/wikipedia/commons/f/f7/Semantic_web_stack.svg) — The Semantic Web technology stack from URIs to OWL
3. ![RDF graph example](https://upload.wikimedia.org/wikipedia/commons/1/12/RDF_example.svg) — RDF graph with subject-predicate-object triples
4. ![Ontology class diagram](https://upload.wikimedia.org/wikipedia/commons/2/21/Semantic_Net.svg) — Semantic network showing ontological relationships between concepts
5. ![Graph database query pattern](https://upload.wikimedia.org/wikipedia/commons/3/3a/GraphDatabase_PropertyGraph.png) — Property graph model showing nodes with properties and typed relationships

## Videos

1. https://www.youtube.com/watch?v=lhkOC38Q6JA — "What is a Knowledge Graph?" by Cambridge Semantics, covering graph structures and ontologies
2. https://www.youtube.com/watch?v=bvwjG-3qAmY — "Knowledge Graphs and Ontologies" by Dr. Juan Sequeda, explaining the relationship between KGs and formal ontologies

## References

1. Hogan, A., et al. (2021). "Knowledge Graphs." *ACM Computing Surveys*, 54(4). https://dl.acm.org/doi/10.1145/3447772
2. W3C OWL 2 Web Ontology Language Overview. https://www.w3.org/TR/owl2-overview/
3. Pan, J. Z., et al. (2023). "Unifying Large Language Models and Knowledge Graphs: A Roadmap." https://arxiv.org/abs/2306.08302
