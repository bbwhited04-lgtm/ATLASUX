# Agentic-KGR: Co-evolutionary Knowledge Graph Construction through Multi-Agent Reinforcement Learning

## Introduction

Knowledge-enhanced large language models face a structural paradox: the knowledge bases they depend on are static snapshots of a continuously evolving world. A knowledge graph constructed from a medical corpus in January is already outdated by March. A financial KG built from regulatory filings misses every filing published after the indexing date. The standard response — periodic reindexing — treats knowledge as a batch process rather than a living system. But what if the knowledge graph and the language models that use it could evolve together, each improving the other in a continuous feedback loop?

Jing Li, Zhijie Sun, Zhicheng Zhou, Suming Qiu, Junjie Huang, Haijia Sun, and Linyuan Qiu address this question directly in "Agentic-KGR: Co-evolutionary Knowledge Graph Construction through Multi-Agent Reinforcement Learning" (arXiv:2510.09156, October 2025). The paper introduces a framework where LLMs and knowledge graphs co-evolve through multi-round reinforcement learning, with a dual reward mechanism that simultaneously optimizes knowledge extraction quality and graph structural integrity. The result is a system that does not merely build a knowledge graph — it grows one that gets better at growing itself.

## The Problem with Static Knowledge Graphs

Traditional knowledge graph construction pipelines follow a linear flow: source documents are processed by an NLP pipeline that extracts entities and relationships, which are stored in a graph database. The pipeline runs once (or periodically) and produces a static artifact. This approach has three fundamental limitations that Agentic-KGR addresses:

**Schema Rigidity.** Most extraction pipelines require a predefined schema — entity types, relationship types, and their valid combinations must be specified before extraction begins. When the pipeline encounters information that does not fit the schema, it is either discarded or force-fitted into inappropriate categories. Real-world knowledge rarely respects predefined boundaries.

**Single-Pass Extraction.** Running the extraction pipeline once means accepting whatever quality the first pass achieves. Errors in entity resolution, missed relationships, and incorrect relationship types persist permanently in the graph. There is no mechanism for the system to learn from its mistakes and improve subsequent extractions.

**Decoupled Optimization.** The extraction model and the downstream application that uses the KG (typically a RAG system) are optimized independently. The extraction model optimizes for precision and recall on labeled triples. The RAG system optimizes for answer quality on QA benchmarks. Neither system's training signal reaches the other, even though their performance is deeply interdependent.

## Multi-Agent Reinforcement Learning Architecture

Agentic-KGR reframes knowledge graph construction as a multi-agent reinforcement learning problem where specialized agents collaborate on different aspects of the extraction and construction process. The agents operate through multiple rounds, with each round's outputs feeding into subsequent rounds as improved training signals.

### Agent Specialization

The framework decomposes the KG construction task into specialized agent roles:

**Entity Extraction Agent.** Identifies entities in source text, determines their types, and resolves coreferences. Unlike single-pass extractors, this agent receives feedback from downstream agents about the utility and accuracy of its extractions, enabling it to adjust its behavior over rounds.

**Relationship Extraction Agent.** Identifies relationships between extracted entities, classifies them, and assigns confidence scores. This agent benefits from the entity agent's improved outputs in later rounds — better entity extraction produces cleaner inputs for relationship identification.

**Schema Expansion Agent.** Monitors extracted triples for patterns that suggest new entity types or relationship types not present in the current schema. When enough evidence accumulates, it proposes schema expansions that are validated against the existing graph structure. This is the key mechanism that enables dynamic schema expansion beyond predefined boundaries.

**Graph Integration Agent.** Merges newly extracted triples into the existing knowledge graph, handling conflicts (contradictory facts), redundancies (duplicate triples), and temporal updates (superseded facts). It maintains graph consistency constraints and tracks provenance for every triple.

### Multi-Round Training Protocol

The agents do not operate in isolation — they participate in multi-round reinforcement learning where each round uses the previous round's graph as context:

**Round 1:** Agents perform extraction with minimal context, producing a baseline KG.
**Round 2:** The baseline KG is provided as context to all agents, enabling them to resolve ambiguities that were unclear in Round 1 (e.g., disambiguating "Python" as programming language vs. snake based on surrounding graph structure).
**Round N:** Each subsequent round benefits from a progressively richer graph context, enabling increasingly sophisticated extraction decisions.

This multi-round approach is where the "co-evolution" occurs — the graph improves the agents' extraction quality, and the improved extractions enrich the graph, creating a positive feedback loop.

## Dual Reward Mechanism

The framework's central innovation is a dual reward signal that optimizes for two complementary objectives simultaneously:

### Extraction Quality Reward

The first reward component measures the accuracy and completeness of extracted knowledge. For entity extraction, this includes precision (are the extracted entities real?), recall (are important entities missing?), and type accuracy (is the entity correctly classified?). For relationship extraction, it additionally considers relationship type accuracy, directionality correctness, and confidence calibration.

This reward is computed by comparing agent outputs against a ground truth KG (during training) or by using a critic model that evaluates extraction plausibility (during deployment). The key innovation is that this reward is computed per-round, allowing the RL algorithm to credit-assign improvements across rounds — if Round 3's extractions are better than Round 2's, the agents receive positive reward for their Round 2 actions that led to the improved Round 3 context.

### Structural Integrity Reward

The second reward component measures the quality of the resulting knowledge graph as a structural object. This includes:

**Graph Coherence.** Are newly added triples consistent with existing graph knowledge? A triple asserting that "Paris is-capital-of Germany" contradicts existing knowledge and should receive negative structural reward.

**Connectivity.** Does the newly extracted knowledge integrate with the existing graph, or does it create isolated subgraphs? Triples that bridge existing clusters receive higher reward than triples that create disconnected islands.

**Schema Compliance.** Do extracted triples respect the current schema constraints? If the schema states that "founded-by" relationships require a Person as subject and an Organization as object, violations receive negative reward.

**Temporal Consistency.** Are temporally sensitive facts properly handled? Updating the CEO of a company should supersede the previous fact, not create a contradiction.

The dual reward is critical because optimizing for extraction quality alone can produce highly accurate but structurally fragmented graphs, while optimizing for structural integrity alone can produce well-connected but factually questionable graphs. The combined signal produces graphs that are both accurate and well-structured.

## Retrieval-Augmented Memory

Agentic-KGR introduces a retrieval-augmented memory system that enables agents to learn from their own history across rounds. Rather than treating each extraction round as stateless, the system maintains a memory of:

**Successful Extractions.** Triples that received high dual-reward scores in previous rounds are stored as exemplars. When the agent encounters similar text patterns in future rounds, it can retrieve these exemplars as in-context demonstrations.

**Error Patterns.** Extractions that received negative reward (incorrect entity types, wrong relationship directions, schema violations) are stored with annotations explaining the error. These negative exemplars help agents avoid repeating mistakes.

**Schema Evolution History.** Records of schema expansions and the evidence that triggered them help the schema expansion agent calibrate its threshold — avoiding premature expansions based on insufficient evidence while not being so conservative that it misses genuine new patterns.

This memory system enables the "synergistic co-evolution between model parameters and knowledge structures" described in the paper. The agents do not just build a better graph — they become better builders over time, with their improvement trajectory shaped by the graph they are building.

## Learnable Multi-Scale Prompt Compression

A practical challenge in multi-round KG construction is context window management. By later rounds, the existing graph may contain thousands of triples, far exceeding what can be provided as context to the LLM agents. Agentic-KGR addresses this with learnable multi-scale prompt compression:

**Local Scale.** For a specific extraction task (e.g., extracting relationships from a paragraph), only the immediately relevant subgraph is provided — entities mentioned in the paragraph and their 1-hop neighborhoods in the existing KG.

**Regional Scale.** For disambiguation tasks, a broader subgraph is provided — the relevant community/cluster in the KG that provides domain context for type and relationship decisions.

**Global Scale.** For schema expansion decisions, a compressed summary of the entire graph is provided — entity type distributions, relationship type frequencies, and structural statistics that inform whether a proposed new type is genuinely needed.

The compression is learnable — the system trains a compression model to select the most decision-relevant information at each scale, reducing computational complexity while preserving the information needed for high-quality extraction decisions.

## Results and Performance

The paper demonstrates substantial improvements over both supervised baselines and single-round RL approaches:

**Knowledge Extraction Quality.** Multi-round RL with dual reward achieves higher F1 scores on entity and relationship extraction benchmarks than single-pass supervised models or single-round RL. The improvement is most pronounced for complex extractions — multi-hop relationships, implicit entities, and temporally sensitive facts.

**GraphRAG Integration.** When the constructed KG is used as the backbone for a GraphRAG system, the co-evolved KG produces superior downstream QA performance compared to KGs built by supervised pipelines. The structural integrity reward directly optimizes for the KG properties that matter for retrieval — connectivity, coherence, and community structure.

**Schema Expansion.** The dynamic schema expansion mechanism successfully identifies new entity and relationship types that are absent from the initial schema but present in the source data. Manually validating these expansions confirmed that the vast majority represent genuine knowledge patterns rather than extraction errors.

**Knowledge Coverage.** Multi-round extraction with retrieval-augmented memory achieves significantly higher knowledge coverage than single-pass extraction, with later rounds capturing facts that were ambiguous or implicit in the first pass but become extractable once surrounding context is established in the graph.

---

## Production Validation: Atlas UX as a Co-evolutionary Knowledge System

Atlas UX implements every core Agentic-KGR concept in a production environment, running 33 autonomous agents against a 520-document self-healing knowledge base with entity-content hybrid GraphRAG retrieval.

### Mapping Agentic-KGR to Production

| Paper Concept | Academic Description | Production Implementation |
|--------------|---------------------|--------------------------|
| Co-evolution between LLMs and KGs | Multi-round RL improves both extraction quality and graph structure | KB heals itself while agents use it — improvements to KB improve agent responses which generate better KB content via injection pipeline |
| Dual reward mechanism | Extraction quality + structural integrity | Spatial reward (kbEval health scoring across 6 dimensions) + HIL reward (human approval through decision memos for high-risk changes) |
| Multi-agent specialization | Entity, relationship, schema, integration agents | 33 named agents (Atlas=CEO, Binky=CRO, Petra=PM, etc.) with specialized roles processing KB content through entity extraction, content generation, and quality validation |
| Retrieval-augmented memory | Past extractions as in-context exemplars | Pinecone vector store + Neo4j graph = retrieval-augmented memory. Golden dataset (409 queries) serves as the exemplar bank for eval and calibration |
| Dynamic schema expansion | New entity/relationship types discovered during extraction | Entity extractor derives types from article content without hardcoded schema — new KB articles introduce new entity types that expand the graph organically |
| Multi-round extraction | Later rounds use enriched graph context | KB injection pipeline runs iteratively — gap detection identifies missing coverage, generates articles, extracts entities, which enables better gap detection in the next cycle |
| Learnable prompt compression | Multi-scale context selection for LLM agents | Tiered namespace structure (Tier 1/2/3) + weighted scoring ensures agents receive the most relevant KB context without exceeding context windows |
| Real-time knowledge extraction | Continuous extraction and graph expansion | Entity extraction runs on every KB article ingestion, webhook events trigger real-time knowledge updates, staleness detection triggers content refresh |

### The Dual Reward in Practice

The production system's dual reward mechanism maps directly to Agentic-KGR's architecture:

**Spatial Reward (Extraction Quality).** The kbEval system scores KB health across 6 dimensions: completeness, accuracy, freshness, consistency, coverage, and retrievability. This automated scoring provides continuous feedback on knowledge quality — analogous to the extraction quality reward in the paper. Articles scoring below threshold trigger self-healing actions (re-embedding, relinking, reclassification, or content regeneration).

**HIL Reward (Structural Integrity).** The Human-in-the-Loop constitution gates structural changes to the knowledge system. Decision memos requiring human approval for high-risk operations (spend above limits, risk tier 2+, recurring charges) ensure that the co-evolutionary process does not drift in harmful directions. This is the structural integrity check that prevents autonomous optimization from producing a locally optimal but globally problematic knowledge graph.

### Co-evolution in Action

The production system demonstrates genuine co-evolution across three feedback loops:

1. **KB → Agents → KB.** Agents consume KB articles for context → better-informed agents generate higher-quality outputs → outputs inform gap detection → gap detection triggers new article generation → new articles enrich the KB for subsequent agent operations.

2. **Graph → Retrieval → Graph.** Neo4j entity graph enables GraphRAG traversal → better retrieval produces more relevant agent context → agents operating with better context generate outputs that, when processed by the entity extractor, produce higher-quality graph additions → the enriched graph enables even better retrieval.

3. **Eval → Heal → Eval.** kbEval scores identify quality issues → self-healer remediates (re-embed, relink, reclassify, regenerate) → next eval cycle measures improvement → persistent issues trigger escalated remediation → the system learns which healing actions are most effective for which failure modes.

### KDR-Driven Memory

The Key Decision Record (KDR) system serves the same function as Agentic-KGR's retrieval-augmented memory. KDRs capture successful patterns, error cases, and architectural decisions with full context. When an agent encounters a similar situation in a future session, KDR retrieval provides historical exemplars — "last time we did X, the result was Y" — enabling the same trajectory-informed decision-making that the paper's memory system provides.

---

## Implications for Knowledge Architecture

### 1. Knowledge Graphs Are Not Artifacts, They Are Organisms

The co-evolutionary framing fundamentally changes how we think about knowledge management. A knowledge graph is not a database to be populated and maintained — it is a living system that grows, adapts, and improves through interaction with the agents that use it. Systems that treat KGs as static resources leave enormous value on the table.

### 2. Dual Optimization Is Non-Negotiable

Optimizing for content quality without structural integrity produces knowledge silos. Optimizing for structural integrity without content quality produces well-connected nonsense. Production systems must implement both reward signals — automated quality scoring and human-gated structural oversight — to achieve robust co-evolution.

### 3. Multi-Round Processing Beats Single-Pass

The paper's evidence that later extraction rounds outperform earlier rounds — because richer graph context resolves ambiguities — applies directly to production KB pipelines. Systems that process documents once and never revisit them miss the compounding benefits of iterative enrichment.

### 4. Schema Flexibility Is a Feature, Not a Bug

Predefined schemas constrain knowledge to categories imagined at design time. Dynamic schema expansion — where new entity and relationship types emerge from data — captures knowledge that rigid schemas would discard. Production systems should monitor their entity type distributions and flag when the type system is failing to accommodate extracted information.

---

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Social_Network_Analysis_Visualization.png/400px-Social_Network_Analysis_Visualization.png — Knowledge graph visualization showing entity clusters, relationship edges, and community structure in a co-evolutionary network
2. https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Semantic_Net.svg/400px-Semantic_Net.svg.png — Semantic network with typed relationships between entities, illustrating the triple structures that knowledge graphs are built from
3. https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Reinforcement_learning_diagram.svg/400px-Reinforcement_learning_diagram.svg.png — Reinforcement learning agent-environment loop showing the dual reward signal that drives co-evolutionary optimization
4. https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Internet_map_1024.jpg/400px-Internet_map_1024.jpg — Large-scale network topology visualization demonstrating the emergent structure that co-evolutionary graph construction produces
5. https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Network_self-organization_stages.svg/400px-Network_self-organization_stages.svg.png — Progressive stages of network self-organization from sparse initial connections to dense community structure

## Videos

- [GraphRAG: Unlocking LLM Discovery on Narrative Private Data — Microsoft Research](https://www.youtube.com/watch?v=r09tJfON6kE)
- [Multi-Agent Reinforcement Learning Explained — Yannic Kilcher](https://www.youtube.com/watch?v=p_n5fF8apiE)

## References

1. Li, J., Sun, Z., Zhou, Z., Qiu, S., Huang, J., Sun, H., & Qiu, L. (2025). "Agentic-KGR: Co-evolutionary Knowledge Graph Construction through Multi-Agent Reinforcement Learning." arXiv:2510.09156. https://arxiv.org/abs/2510.09156

2. Edge, D., Trinh, H., Cheng, N., et al. (2024). "From Local to Global: A Graph RAG Approach to Query-Focused Summarization." arXiv:2404.16130. https://arxiv.org/abs/2404.16130

3. Pan, S., Luo, L., Wang, Y., et al. (2024). "Unifying Large Language Models and Knowledge Graphs: A Roadmap." IEEE TKDE. https://arxiv.org/abs/2306.08302

4. Sutton, R.S. & Barto, A.G. (2018). "Reinforcement Learning: An Introduction." 2nd Edition. MIT Press. http://incompleteideas.net/book/the-book-2nd.html

5. Hogan, A., Blomqvist, E., Cochez, M., et al. (2021). "Knowledge Graphs." ACM Computing Surveys, 54(4). https://arxiv.org/abs/2003.02320
