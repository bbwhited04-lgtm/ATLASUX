# Advancing the AI/ML Research Timeline: A Practitioner's Methodology

## Introduction

Most AI/ML research follows a linear path: paper → prototype → product → iterate. This methodology inverts that model. Instead of starting with theory and working toward production, we start with production systems and extract research insights from operational data. The result is a faster feedback loop, higher-quality training data, and architectures that are validated by real-world use before they're published.

This document describes the methodology used at Dead App Corp / Atlas UX to advance the AI/ML timeline while maintaining a sustainable research operation funded by production revenue. The core thesis: **the fastest way to advance AI/ML is to build production systems that generate research artifacts as a byproduct of their normal operation.**

---

## Core Principles

### 1. Iterative Development Over Waterfall Research

Traditional AI/ML research operates in long cycles: months of data collection, weeks of training, days of evaluation, then a paper. By the time the paper is published, the landscape has shifted.

Our approach uses a structured weekly cadence:

| Day | Focus | Purpose |
|-----|-------|---------|
| Sunday & Wednesday | Learning | Absorb new research, tools, techniques from 10+ daily sources |
| Monday & Thursday | Building | Ship implementations based on what was learned |
| Tuesday & Friday | Flex | Follow energy — could be research, admin, or building |

This creates a 3-4 day cycle from "read a paper" to "ship the implementation." GraphRAG went from a Google search ("how to reduce hallucinations in RAG") to a production hybrid topology with Neo4j in under 24 hours. The traditional research cycle for that same progression would be 6-12 months.

### 2. Decouple Research From Product Deadlines

Research breakthroughs don't follow sprint schedules. The organizational structure must allow exploration without the pressure of shipping customer features on a cadence.

**How we achieve this:**
- No venture capital = no board mandating quarterly targets
- Revenue from production products (Lucy AI Receptionist, $99/mo) funds research independently
- The research platform (Atlas UX) is the founder's personal tool — no customer-driven feature requests
- Build in public timestamps the work without requiring publication deadlines

**The funding model:**
```
Production Revenue (Lucy) → Research Budget → Open Publication
       ↓                         ↓                    ↓
  Pays the bills          Buys compute time    Advances the timeline
```

This is closer to Bell Labs than a startup: the production side funds the research side, and the research side occasionally produces breakthroughs that feed back into production.

### 3. High-Quality Data Over Complex Models

The industry obsession with model size (7B → 70B → 405B → 1T parameters) obscures a simpler truth: **a well-curated knowledge base with a small model outperforms a large model with no grounding.**

Evidence from our production system:
- 508 articles with source attribution, citations, and metadata enrichment
- Three-tier retrieval with weighted scoring (tenant → internal → public)
- Entity-content hybrid GraphRAG reducing hallucinations through structural grounding
- Self-healing pipeline that auto-corrects data quality issues before they affect retrieval

A DeepSeek call ($0.27/M tokens) with our graph-grounded context produces more accurate responses than a naked GPT-4 call ($30/M tokens) operating purely from training data. The data quality differential is worth more than a 100x increase in model size.

### 4. Knowledge Base as Research Corpus

Most research teams maintain separate systems for their research corpus and their production data. We unify them:

```
KB Articles (508+) → Entity Extraction → Knowledge Graph (Neo4j)
       ↓                    ↓                      ↓
   Wiki (public)     Research Artifacts      Graph Analytics
       ↓                    ↓                      ↓
   SEO/Discovery    Ontology Discovery    Architecture Insights
```

Every article written for the production KB simultaneously:
- Serves customers through the wiki and API
- Feeds the knowledge graph with entities and relationships
- Creates training data for retrieval evaluation (golden dataset)
- Documents architectural decisions for reproducibility

---

## Key Strategies

### Strategy 1: Utilize Expert Knowledge

Domain expertise is the most undervalued input in AI/ML research. A domain expert who understands both the problem space and the technical implementation can make architectural decisions that pure ML engineers cannot.

**In practice:**
- The founder (trades industry + full-stack + AI/ML) makes architecture decisions informed by operational reality
- Agent configurations encode domain knowledge (33 agents with specific roles, permissions, and behavioral policies)
- Knowledge base articles are written from practitioner experience, not just literature review
- Evaluation criteria reflect real-world usage patterns, not just benchmark scores

**Anti-pattern to avoid:** Hiring ML engineers who optimize for BLEU scores without understanding whether the output is actually useful in the target domain.

### Strategy 2: Implement AutoML and Automated Pipelines

Manual ML operations create bottlenecks and introduce human error. Every repeatable process should be automated:

| Process | Manual Approach | Our Automation |
|---------|----------------|----------------|
| KB quality assessment | Human review of each article | `kbEval.ts` — 6-dimension automated health scoring with golden dataset (409 queries) |
| Data freshness | Periodic manual review | `kbInjectionWorker.ts` — cron-driven staleness detection, web search, LLM patching |
| Entity extraction | Manual annotation | `entityExtractor.ts` — LLM-powered NER with 9 entity types, automated across 508 articles |
| Knowledge graph maintenance | Manual graph editing | `graphBuilder.ts` — idempotent MERGE-based construction from extraction results |
| Retrieval quality monitoring | Ad-hoc testing | Golden dataset with MRR, NDCG, hit rate metrics running nightly |
| Content gap detection | Human audit | `kbGapAnalyzer.mjs` — 15-domain coverage analysis with expected thresholds |
| Self-healing | Manual fixes | `kbHealer.ts` — safe auto-heal (re-embed, relink, reclassify) with human escalation for risky changes |

**Cost of automation:** ~$15-30/month in API calls for continuous quality maintenance across 508+ articles. The alternative (human review) would require 20+ hours/month of expert time.

### Strategy 3: Automated Data Labeling

Manual data labeling is the largest bottleneck in ML pipelines. Our approach eliminates it for knowledge base operations:

**Entity extraction as labeling:**
- LLM-powered NER extracts entities (CONCEPT, TOOL, COMPANY, PERSON, PROTOCOL, FRAMEWORK, PLATFORM, METRIC, ALGORITHM) from every article
- Entity resolution deduplicates across the corpus using Levenshtein similarity
- Relationship extraction identifies connections (USES, COMPETES_WITH, PART_OF, IMPLEMENTS, etc.)
- All labeling runs on free-tier models (Gemini Flash, Cerebras Llama) — zero marginal cost

**Metadata enrichment as labeling:**
- Source attribution (creator + platform) on every media reference
- Citation extraction and validation
- Category and topic classification via file naming conventions
- Freshness scoring based on file modification dates vs domain-specific thresholds

**Quality validation:**
- Golden dataset serves as ground truth for retrieval evaluation
- Health scoring provides continuous signal on labeling quality
- Auto-heal pipeline corrects drift before it compounds

### Strategy 4: Run Parallel Experiments

Sequential experimentation is the enemy of research velocity. Our architecture enables parallel experimentation by default:

**Multi-provider LLM routing:**
- 6 LLM providers (OpenAI, DeepSeek, Anthropic, Cerebras, Gemini, OpenRouter) available simultaneously
- `brainllm.ts` routes calls based on task criticality: free tiers for bulk operations, premium models for quality-critical tasks
- Automatic fallback on rate limits or failures — experiments never block on a single provider

**Multi-agent parallel execution:**
- 33 agents operate independently on different tasks
- Scheduler fires agents in parallel with 3-minute staggering
- Each agent can use different models, tools, and retrieval strategies
- Results are aggregated by orchestrator agents (Atlas, Binky, Petra)

**A/B retrieval testing:**
- Vector-only (Pinecone) vs hybrid (Pinecone + Neo4j) can run simultaneously
- `GRAPHRAG_ENABLED` flag allows instant switching between retrieval strategies
- Golden dataset provides consistent evaluation across both approaches
- Cost comparison is built into the pipeline (per-query cost tracking)

**Web search provider rotation:**
- 5 search providers (You.com, Brave, Exa, Tavily, SerpAPI) rotate randomly
- Each provider's results are tagged with source for quality comparison
- Provider failures trigger automatic fallback — no single point of failure

---

## Research Infrastructure Architecture

### The Stack

```
┌──────────────────────────────────────────┐
│           Research Output Layer           │
│  Wiki (public) │ Papers │ Open Source     │
├──────────────────────────────────────────┤
│          Knowledge Graph Layer            │
│  Neo4j (entity-content hybrid topology)  │
│  Entities ↔ Chunks ↔ Relationships       │
├──────────────────────────────────────────┤
│          Retrieval Layer                  │
│  Pinecone (vector) + Neo4j (graph)       │
│  Three-tier: tenant → internal → public  │
├──────────────────────────────────────────┤
│          Quality Layer                    │
│  Health scoring │ Auto-heal │ Gap detect  │
│  Golden dataset │ Injection pipeline      │
├──────────────────────────────────────────┤
│          Knowledge Layer                  │
│  508+ articles │ Metadata enrichment      │
│  Source attribution │ Citation tracking    │
├──────────────────────────────────────────┤
│          Agent Orchestration Layer         │
│  33 agents │ DAG orchestration            │
│  CEO → CRO → PM delegation chain         │
├──────────────────────────────────────────┤
│          Revenue Layer                    │
│  Lucy AI Receptionist ($99/mo)            │
│  Funds research operations               │
└──────────────────────────────────────────┘
```

### Cost Structure

| Component | Monthly Cost | Purpose |
|-----------|-------------|---------|
| Neo4j Aura Free | $0 | Knowledge graph (up to 200K nodes) |
| Pinecone Free | $0 | Vector search |
| Gemini Flash / Cerebras | $0 | Bulk entity extraction, channel summaries |
| DeepSeek | ~$10 | Spontaneous agent thoughts, thread replies, KB patching |
| Anthropic Sonnet (API) | ~$10 | Quality-critical responses, direct human interaction |
| AWS Lightsail | ~$30 | Hosting (backend, frontend, DB) |
| Claude Max | $100 | Development tooling (Claude Code) |
| **Total** | **~$150/mo** | Full research infrastructure |

Revenue target from Lucy: $500-1,000/mo covers infrastructure + research compute with margin.

---

## Ontology Discovery: The Next Frontier

The entity-content hybrid knowledge graph is not the end state — it's the foundation for **ontology discovery**: the automated identification of conceptual structures, taxonomies, and relationship patterns that emerge from large-scale knowledge bases.

### What Ontology Discovery Means

Traditional ontologies (OWL, RDF, SUMO) are hand-crafted by domain experts. Ontology discovery inverts this: let the data reveal its own structure.

With 508+ articles, 200+ entity types, and thousands of relationships in the graph, patterns emerge:
- Which concepts always co-occur? (potential taxonomy)
- Which relationships are transitive? (potential inference rules)
- Which entity clusters form natural categories? (potential ontology classes)
- Which chunks contain contradictory claims about the same entity? (potential knowledge conflicts)

### Research Questions

1. Can community detection algorithms (Leiden, Louvain) on an entity-content graph automatically discover domain taxonomies?
2. Does the hybrid topology (entity → chunk → entity) produce more accurate ontologies than entity-only graphs?
3. Can ontology discovery be made incremental — updating the ontology as new articles are added without full recomputation?
4. What is the minimum corpus size for reliable ontology emergence?

These questions are answerable with the infrastructure we've already built. The knowledge graph is populated. The evaluation framework exists. The research just needs to be run.

---

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Agile_Software_Development_methodology.svg/400px-Agile_Software_Development_methodology.svg.png — Iterative development methodology cycle showing the continuous build-learn-measure feedback loop
2. https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Social_Network_Analysis_Visualization.png/400px-Social_Network_Analysis_Visualization.png — Knowledge graph visualization showing entity clusters and relationship patterns that emerge from large-scale knowledge bases
3. https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Semantic_Net.svg/400px-Semantic_Net.svg.png — Semantic network showing ontological relationships between concepts — the target structure for ontology discovery
4. https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Pipeline_overview.png/400px-Pipeline_overview.png — Automated pipeline architecture showing the flow from data ingestion through processing to output
5. https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Community_structure2.jpg/400px-Community_structure2.jpg — Community detection result showing clustered entity groups — the basis for automated taxonomy discovery

## Videos

- [GraphRAG: Unlocking LLM Discovery on Narrative Private Data — Microsoft Research](https://www.youtube.com/watch?v=r09tJfON6kE)
- [Building Production RAG Applications — LlamaIndex](https://www.youtube.com/watch?v=TRjq7t2Ms5I)

## References

1. Edge, D., Trinh, H., Cheng, N., et al. (2024). "From Local to Global: A Graph RAG Approach to Query-Focused Summarization." arXiv:2404.16130. https://arxiv.org/abs/2404.16130

2. Pan, S., Luo, L., Wang, Y., et al. (2024). "Unifying Large Language Models and Knowledge Graphs: A Roadmap." IEEE TKDE. https://arxiv.org/abs/2306.08302

3. Lewis, P., et al. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." NeurIPS 2020. https://arxiv.org/abs/2005.11401

4. Hogan, A., et al. (2021). "Knowledge Graphs." ACM Computing Surveys. https://arxiv.org/abs/2003.02320

5. Traag, V. A., Waltman, L., & van Eck, N. J. (2019). "From Louvain to Leiden: Guaranteeing Well-Connected Communities." Scientific Reports. https://www.nature.com/articles/s41598-019-41695-z
