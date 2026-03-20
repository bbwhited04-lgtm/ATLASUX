# Knowledge Graphs for AI Agents: Neo4j, Amazon Neptune, and Graph-Native Intelligence

## Introduction

Knowledge graphs provide what vector databases cannot: explicit, traversable relationships between concepts. While embeddings capture semantic similarity — "plumber" is near "pipe fitter" in vector space — knowledge graphs capture structural truth: "a plumber installs pipes," "pipes connect to water heaters," "water heaters require permits in Zone 3." For AI agents operating in complex domains, this distinction determines whether the system retrieves approximately relevant text or navigates precise chains of reasoning. This article covers the graph data model, compares Neo4j and Amazon Neptune as production platforms, examines entity extraction from unstructured text, and provides schema design patterns specifically for agent knowledge bases.

## The Graph Data Model

### Nodes, Edges, and Properties

A knowledge graph consists of three primitives. Nodes (vertices) represent entities: people, concepts, documents, services, locations. Edges (relationships) connect nodes with typed, directed links: WORKS_FOR, REQUIRES, MENTIONS, DEPENDS_ON. Properties are key-value pairs attached to both nodes and edges: a node might carry `{name: "Lucy", role: "receptionist", version: "2.1"}` while an edge might carry `{confidence: 0.92, extracted_from: "doc-047"}`.

This triple structure — subject-predicate-object — can represent virtually any factual knowledge. "Lucy (node) ANSWERS (edge) phone calls (node)" is a triple. "Phone calls (node) GENERATE (edge) appointments (node)" is another. Chain enough triples together and you have a graph that an agent can traverse to answer multi-hop questions: "What happens after Lucy answers a phone call?" becomes a graph traversal starting at the "phone call" node and following outgoing edges.

### Property Graphs vs RDF Graphs

Two competing models exist. Property graphs (used by Neo4j) treat nodes and edges as first-class objects that carry arbitrary properties. RDF graphs (used by Amazon Neptune in SPARQL mode) represent everything as subject-predicate-object triples using URIs. Property graphs are more intuitive for developers; RDF graphs are more interoperable across systems.

For AI agent knowledge bases, property graphs dominate because they map naturally to how agents think: entities have attributes, relationships have context, and queries follow paths. The formal semantic rigor of RDF matters more in academic and government linked-data applications than in production agent systems.

## Neo4j: The Property Graph Standard

### Architecture and Deployment

Neo4j is the most widely adopted graph database, with native graph storage (not a relational database with a graph API bolted on). Data is stored as linked lists of nodes and relationships on disk, making graph traversals constant-time operations regardless of total graph size — a property called "index-free adjacency."

Deployment options include Neo4j Community Edition (free, single instance), Neo4j Enterprise (clustering, advanced security), Neo4j AuraDB (fully managed cloud), and Neo4j Desktop (local development). AuraDB Free tier includes 200K nodes and 400K relationships — sufficient for prototyping an agent KB.

### Cypher Query Language

Cypher is Neo4j's declarative query language, designed to visually represent graph patterns using ASCII art:

```cypher
// Create nodes and relationships
CREATE (lucy:Agent {name: "Lucy", role: "receptionist"})
CREATE (booking:Capability {name: "appointment_booking"})
CREATE (sms:Capability {name: "sms_confirmation"})
CREATE (lucy)-[:HAS_CAPABILITY {priority: 1}]->(booking)
CREATE (lucy)-[:HAS_CAPABILITY {priority: 2}]->(sms)

// Multi-hop query: find all capabilities of agents that handle phone calls
MATCH (a:Agent)-[:HANDLES]->(t:TaskType {name: "phone_call"}),
      (a)-[:HAS_CAPABILITY]->(c:Capability)
RETURN a.name, collect(c.name) AS capabilities

// Path finding: shortest path between two concepts
MATCH path = shortestPath(
  (start:Concept {name: "leaking_pipe"})-[*..5]-(end:Concept {name: "permit_required"})
)
RETURN path

// Aggregation: most connected entities
MATCH (n)-[r]-()
RETURN labels(n)[0] AS type, n.name, count(r) AS connections
ORDER BY connections DESC
LIMIT 20
```

Cypher's pattern-matching syntax makes complex graph queries readable. Finding "all documents that mention entities related to entities mentioned in the user's question" is a two-hop traversal that would require multiple self-joins in SQL but reads naturally in Cypher.

### Neo4j for Agent Knowledge

Neo4j's strengths for agent KB use cases include full-text search indexes (combining keyword search with graph traversal), APOC procedures library (450+ utility functions for data import, graph algorithms, and text processing), Graph Data Science library (community detection, centrality, similarity, pathfinding algorithms), and vector search support (added in Neo4j 5.11, enabling hybrid vector+graph queries in a single database).

```cypher
// Create a vector index for hybrid search
CREATE VECTOR INDEX kb_embeddings
FOR (d:Document)
ON (d.embedding)
OPTIONS {indexConfig: {
  `vector.dimensions`: 3072,
  `vector.similarity_function`: 'cosine'
}}

// Hybrid query: vector similarity + graph traversal
CALL db.index.vector.queryNodes('kb_embeddings', 10, $queryEmbedding)
YIELD node AS doc, score
MATCH (doc)-[:MENTIONS]->(entity:Entity)-[:RELATED_TO]->(related:Entity)
RETURN doc.title, score, collect(DISTINCT related.name) AS relatedConcepts
ORDER BY score DESC
```

**Pricing:** Community Edition is free. AuraDB Professional starts at $65/month. Enterprise self-hosted licensing is negotiated.

## Amazon Neptune: AWS-Native Graph Database

### Architecture and Deployment

Amazon Neptune is a fully managed graph database service in AWS. It supports both property graph queries (via openCypher and Apache TinkerPop Gremlin) and RDF queries (via SPARQL). Neptune runs on AWS infrastructure with automated backups, Multi-AZ replication, encryption at rest, and integration with IAM, CloudWatch, and VPC.

Neptune stores data in a purpose-built, SSD-backed distributed storage layer that automatically grows up to 128 TB. It replicates data six ways across three availability zones. For teams already operating in AWS, Neptune eliminates operational overhead entirely.

### Gremlin Query Language

Gremlin is an imperative graph traversal language from the Apache TinkerPop project. Unlike Cypher's declarative pattern matching, Gremlin chains traversal steps explicitly:

```groovy
// Create vertices and edges
g.addV('Agent').property('name', 'Lucy').property('role', 'receptionist').as('lucy')
 .addV('Capability').property('name', 'appointment_booking').as('booking')
 .addE('HAS_CAPABILITY').from('lucy').to('booking').property('priority', 1)

// Multi-hop query: find capabilities of agents handling phone calls
g.V().hasLabel('Agent')
  .where(out('HANDLES').has('name', 'phone_call'))
  .project('agent', 'capabilities')
    .by('name')
    .by(out('HAS_CAPABILITY').values('name').fold())

// Path finding
g.V().has('Concept', 'name', 'leaking_pipe')
  .repeat(both().simplePath())
  .until(has('name', 'permit_required').or().loops().is(5))
  .has('name', 'permit_required')
  .path()
  .limit(1)
```

Gremlin's imperative style gives fine-grained control over traversal order and optimization, which can be important for performance on large graphs. However, most developers find Cypher more readable for common query patterns.

### SPARQL for RDF Data

Neptune also supports SPARQL for RDF-based knowledge graphs:

```sparql
PREFIX kb: <http://atlasux.cloud/kb/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?agent ?capability
WHERE {
  ?agent rdf:type kb:Agent .
  ?agent kb:handles kb:PhoneCall .
  ?agent kb:hasCapability ?capability .
}
```

SPARQL is most useful when integrating with external linked data sources (Wikidata, DBpedia) or when formal ontology reasoning is required.

### Neptune vs Neo4j: Feature Comparison

| Feature | Neo4j | Amazon Neptune |
|---------|-------|----------------|
| Query languages | Cypher | openCypher, Gremlin, SPARQL |
| Deployment | Self-hosted, AuraDB cloud | AWS managed only |
| Max graph size | Billions of nodes (Enterprise) | 128 TB storage |
| Vector search | Native (v5.11+) | Via OpenSearch integration |
| Graph algorithms | GDS library (35+ algorithms) | Neptune Analytics |
| Full-text search | Native Lucene indexes | Via OpenSearch |
| Multi-model | Graph only | Property graph + RDF |
| ACID transactions | Full ACID | Full ACID |
| Open source | Community Edition (GPLv3) | Proprietary |
| Best for | Developer experience, algorithms | AWS-native, RDF workloads |

## Entity Extraction from Unstructured Text

Building a knowledge graph from documents requires extracting entities and relationships from natural language text. This process has been transformed by LLMs, which can perform extraction with minimal configuration compared to traditional NER pipelines.

### LLM-Based Extraction Pipeline

```python
from openai import OpenAI
import json

client = OpenAI()

EXTRACTION_PROMPT = """Extract entities and relationships from the following text.
Return JSON with:
- entities: [{name, type, description}]
- relationships: [{source, target, relationship, description}]

Entity types: Person, Organization, Concept, Tool, Service, Location, Process
Relationship types: USES, REQUIRES, PRODUCES, DEPENDS_ON, PART_OF, LOCATED_IN

Text: {text}"""

def extract_entities_and_relations(text: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": EXTRACTION_PROMPT.format(text=text)}],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)

# Process a KB document
result = extract_entities_and_relations("""
Lucy is an AI receptionist that answers phone calls for plumbing businesses.
When a customer calls about a leaking pipe, Lucy books an appointment
using the business's calendar system and sends an SMS confirmation via Twilio.
""")

# Result:
# entities: [
#   {name: "Lucy", type: "Service", description: "AI receptionist for phone calls"},
#   {name: "Twilio", type: "Tool", description: "SMS sending platform"},
#   ...
# ]
# relationships: [
#   {source: "Lucy", target: "phone calls", relationship: "HANDLES", ...},
#   {source: "Lucy", target: "Twilio", relationship: "USES", ...},
#   ...
# ]
```

### Entity Resolution

Multiple text passages may refer to the same entity differently: "Lucy," "the AI receptionist," "our virtual assistant," and "the Atlas UX agent" might all be the same entity. Entity resolution merges these references by comparing names, descriptions, and co-occurrence patterns. Embedding similarity between entity descriptions provides a robust signal for automated merging.

### Continuous Extraction

For agent knowledge bases, entity extraction should run on every document ingestion — not as a one-time batch job. New documents introduce new entities and relationships that extend the graph incrementally. A webhook-triggered extraction pipeline ensures the knowledge graph stays current with the vector store.

## Schema Design for Agent Knowledge

### Recommended Node Types

```
(:Agent {name, role, version, status})
(:Document {id, title, tier, category, source})
(:Concept {name, description, domain})
(:Entity {name, type, description})
(:Capability {name, description, parameters})
(:Tool {name, provider, version})
(:Tenant {id, name, industry})
(:Policy {name, scope, enforcement})
```

### Recommended Relationship Types

```
(Agent)-[:HAS_CAPABILITY]->(Capability)
(Agent)-[:USES_TOOL]->(Tool)
(Agent)-[:GOVERNED_BY]->(Policy)
(Document)-[:MENTIONS]->(Entity)
(Document)-[:COVERS]->(Concept)
(Concept)-[:REQUIRES]->(Concept)
(Concept)-[:RELATED_TO]->(Concept)
(Entity)-[:INSTANCE_OF]->(Concept)
(Tenant)-[:SUBSCRIBES_TO]->(Capability)
```

### Relationship Mapping: Agent to Document to Concept to Entity

The four-layer hierarchy enables powerful traversal queries:

```cypher
// Given a user question about "booking appointments,"
// find the agent, its documentation, related concepts, and specific entities
MATCH (a:Agent)-[:HAS_CAPABILITY]->(c:Capability {name: "appointment_booking"}),
      (d:Document)-[:COVERS]->(concept:Concept)-[:RELATED_TO*1..2]->(related:Concept),
      (d)-[:MENTIONS]->(e:Entity)
WHERE concept.name CONTAINS "booking"
RETURN a.name AS agent, d.title AS doc,
       collect(DISTINCT related.name) AS relatedConcepts,
       collect(DISTINCT e.name) AS entities
```

This single query traverses from agent capabilities through documentation to concepts and entities — a retrieval pattern impossible with vector search alone.

## Cost Comparison: Neo4j vs Neptune

| Factor | Neo4j AuraDB | Amazon Neptune |
|--------|-------------|----------------|
| Minimum monthly cost | $65 (Professional) | ~$180 (db.t3.medium) |
| Storage (per GB/month) | Included in tier | $0.10 |
| I/O requests | Included | $0.20 per million |
| Backup storage | Included | $0.023 per GB |
| Free tier | 200K nodes, 400K rels | None (but free trial) |
| Data transfer | Standard cloud egress | Standard AWS egress |
| Estimated cost (1M nodes) | $200-400/month | $300-600/month |
| Estimated cost (10M nodes) | $500-1500/month | $600-1800/month |

For teams operating on AWS with existing infrastructure, Neptune's operational simplicity may justify the higher base cost. For teams prioritizing developer experience, graph algorithms, and cost efficiency, Neo4j AuraDB is typically the better choice. For development and prototyping, Neo4j's free Community Edition and AuraDB Free tier are unbeatable.

## Conclusion

Knowledge graphs provide the structural intelligence that vector databases lack. They encode relationships explicitly, enable multi-hop reasoning, and make agent knowledge traversable rather than merely searchable. Neo4j offers the best developer experience with Cypher, rich graph algorithms, and now native vector search for hybrid queries. Amazon Neptune provides AWS-native operation with multi-model support for teams committed to the AWS ecosystem. For AI agent knowledge bases, the combination of vector search (for semantic retrieval) and knowledge graphs (for relationship-aware reasoning) produces retrieval quality that neither approach achieves alone. The investment in building and maintaining a knowledge graph pays dividends every time an agent needs to answer a question that requires understanding how concepts connect rather than simply finding similar text.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/GraphDatabase_PropertyGraph.png/400px-GraphDatabase_PropertyGraph.png — Property graph model showing nodes with properties connected by typed relationships
2. https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/6n-graf.svg/400px-6n-graf.svg.png — Simple graph structure illustrating nodes and edges in graph theory
3. https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/RDF_example.svg/400px-RDF_example.svg.png — RDF triple structure showing subject-predicate-object pattern
4. https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Knowledge_graph_example.png/400px-Knowledge_graph_example.png — Knowledge graph example with entity types and relationship labels
5. https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Neo4j-Logo.svg/400px-Neo4j-Logo.svg.png — Neo4j logo representing the leading property graph database

## Videos

1. https://www.youtube.com/watch?v=REVkXVxvMQE — "What is a Knowledge Graph?" by Neo4j explaining graph data models and use cases
2. https://www.youtube.com/watch?v=GBQMVQJaIUM — "Graph Databases Will Change Your Freakin' Life" by Ed Huang at TigerGraph covering why graph databases matter for AI

## References

1. Robinson, I., Webber, J., & Eifrem, E. (2015). "Graph Databases: New Opportunities for Connected Data." O'Reilly Media. https://neo4j.com/graph-databases-book/
2. Angles, R. & Gutierrez, C. (2008). "Survey of Graph Database Models." ACM Computing Surveys. https://dl.acm.org/doi/10.1145/1322432.1322433
3. Amazon Web Services. "Amazon Neptune Documentation." https://docs.aws.amazon.com/neptune/
4. Neo4j Documentation. "The Neo4j Cypher Manual." https://neo4j.com/docs/cypher-manual/current/
