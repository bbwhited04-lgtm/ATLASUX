# AndroTMem: Anchored State Memory for Long-Horizon GUI Agents

## Introduction

On March 20, 2026, a consortium of researchers from XJTU, HKUST, CityU, UTS, and seven other institutions published "AndroTMem: From Interaction Trajectories to Anchored Memory in Long-Horizon GUI Agents." The paper addresses a critical gap in AI agent systems: as interaction sequences grow longer, performance drops are driven primarily by **memory failures**, not perception errors or action mistakes. Their solution — Anchored State Memory (ASM) — represents interaction histories as compact sets of causally linked intermediate-state anchors instead of raw trajectory replays or lossy summaries.

The paper was published on the same day that production systems implementing identical concepts were already operational — a pattern that has become increasingly common as the gap between academic formalization and practitioner implementation narrows to zero.

---

## The Problem: Memory Failures in Long-Horizon Agents

GUI agents that interact with mobile applications face a fundamental challenge when tasks span dozens of steps across multiple applications. The agent must remember intermediate results — a price extracted from one app, a confirmation code from another, a prerequisite verified three steps ago — and bring them forward when they become relevant later.

The paper identifies three failure modes in existing approaches:

### 1. Full-Sequence Replay
Feeding the entire interaction history back to the agent at every step. This is redundant, amplifies noise, and quickly exceeds context window limits. By step 30, the agent is drowning in irrelevant screenshots and actions from step 2.

### 2. Summary-Based Compression
Condensing the interaction history into a text summary. This saves tokens but **erases dependency-critical information**. A summary that says "user checked prices on Amazon" loses the specific $47.99 price point that determines the next decision.

### 3. No Memory at All
Treating each step as independent. This works for simple 3-step tasks but fails catastrophically when step 25 depends on a value obtained at step 8.

The paper's diagnostic framework (AndroTMem-Bench) quantifies this: across 12 GUI agents and 1,069 tasks with 34,473 interaction steps, **within-task memory failures dominate long-horizon performance degradation**, not perception errors or local action mistakes.

---

## Anchored State Memory (ASM)

ASM replaces both full replay and lossy summaries with a structured middle ground: **state anchors** — compact records of causally critical intermediate states, linked by their dependencies.

### State Anchor Categories

The paper defines six categories of anchor points:

| Category | Description | Example |
|----------|-------------|---------|
| **Subgoal completion** | A milestone subtask is finished | "Successfully added item to cart" |
| **State transition** | The environment mode changes | "Switched from browse to checkout flow" |
| **Causal dependency** | A value is produced that later steps need | "Extracted tracking number: XJ4829371" |
| **Exception handling** | An error or edge case is encountered and resolved | "Item out of stock — selected alternative" |
| **Global context** | Background information that constrains all future decisions | "User prefers free shipping over speed" |
| **Task completion** | The final goal is achieved | "Order confirmed, confirmation #82741" |

### How ASM Works

Instead of storing every interaction frame or summarizing them away, ASM:

1. **Monitors the trajectory** for anchor-worthy events (subgoal completions, state changes, dependency-producing steps)
2. **Extracts a compact state record** with the essential information (what happened, what value was produced, what it means for downstream steps)
3. **Links anchors causally** — anchor 5 depends on anchor 3, which depends on anchor 1
4. **Retrieves relevant anchors** at decision time based on the current subgoal, not chronological order

```
Step 1-5: [Browse Amazon] → Anchor: "Found laptop at $899"
Step 6-10: [Check Best Buy] → Anchor: "Same laptop at $849, free shipping"
Step 11-15: [Check reviews] → Anchor: "Best Buy model has newer GPU"
Step 16: Decision needed → Retrieve anchors 1-3, not steps 1-15
```

### Results

Across 12 GUI agents (including GPT-4o, Claude, Gemini, and open-source models):

| History Method | TCR Improvement | AMS Improvement |
|----------------|----------------|-----------------|
| Full replay (baseline) | — | — |
| Summary-based | -2% to +5% (inconsistent) | -1% to +3% |
| **ASM (anchored memory)** | **+5% to +30.16%** | **+4.93% to +24.66%** |

The largest gains appear in tasks with strong cross-step causal dependencies — exactly the tasks where raw replay drowns in noise and summaries lose critical details.

---

## Production Validation: KDRs as Anchored State Memory

Atlas UX's production agent system implements Anchored State Memory under a different name: **Key Decision Records (KDRs)** — a file-based state management system that preserves critical intermediate state across sessions, context compressions, and even model switches.

### Mapping ASM to Production

| ASM Concept | Academic Description | Atlas UX Implementation |
|-------------|---------------------|------------------------|
| **State anchors** | Compact records of causally critical intermediate states | KDR files at `memory/kdrs/YYYY-MM-DD-topic.md` with structured frontmatter |
| **Subgoal completion** | Milestone subtask finished | KDR sections: "## Fixes Applied", "## Still Needs" |
| **Causal dependency** | Value produced that later steps need | KDR tracking: API keys, architectural decisions, in-progress state |
| **Exception handling** | Error encountered and resolved | KDR documenting: "Root cause: X. Fix: Y. Verified: Z" |
| **Global context** | Background constraints | Memory files: user profile, feedback, project vision, reference docs |
| **Causal linking** | Anchors linked by dependency | MEMORY.md index linking all KDRs with descriptions, KDRs referencing prior KDRs |
| **Subgoal-targeted retrieval** | Retrieve relevant anchors based on current goal | Claude Code loads MEMORY.md at session start, reads relevant KDRs on demand |
| **Attribution-aware decisions** | Decisions traceable to specific anchors | Every KDR entry includes "Why" and "How to apply" context |

### The Triple-Redundant Memory Architecture

Atlas UX goes beyond ASM's single-layer anchored memory with three redundant persistence mechanisms:

**Layer 1: KDRs (Anchored State Memory)**
- Written at natural breakpoints during sessions
- Structured: frontmatter (name, description, type) + content (what happened, what's needed)
- Survives context compression, session restarts, model switches
- Example: `kdrs/2026-03-20-flex-friday-megabuild.md` captures an entire day's work

**Layer 2: Obsidian Vault (Long-Term Knowledge Graph)**
- 663 documents with 113K+ wikilinks forming a dense knowledge graph
- Every KB article, agent config, and research artifact persisted
- Queryable via Obsidian CLI, browsable via graph view
- Survives everything — it's just markdown files on disk

**Layer 3: Pinecone + Neo4j (Retrieval Infrastructure)**
- Vector embeddings for semantic search
- Entity-content hybrid graph for structural retrieval
- Three-tier retrieval with weighted scoring
- Survives model changes, agent reconfiguration, KB restructuring

### Why KDRs Outperform ASM's Design

ASM operates within a single task session on a mobile device. KDRs operate across **sessions, days, and even project phases**:

| Dimension | ASM | KDRs |
|-----------|-----|------|
| Scope | Single task session | Weeks/months of work |
| Persistence | In-memory during task | File-based, permanent |
| Cross-session | No | Yes — MEMORY.md loaded at every session start |
| Cross-model | No | Yes — works with any LLM that reads files |
| Human-readable | No (internal format) | Yes — standard markdown |
| Searchable | Embedding retrieval | Grep, glob, semantic search, graph traversal |
| Self-healing | No | Yes — stale KDRs updated when current state conflicts |
| Hierarchical | Flat anchor list | Nested: MEMORY.md → KDR → referenced files → KB articles |

The KDR system was invented out of necessity — when conversation context gets compressed or a session ends, critical state must survive. The solution was obvious in retrospect: write it to a file with enough structure that a future session can reconstruct context without the original conversation.

---

## Implications for Agent Memory Architecture

### 1. Memory Failures Are the Bottleneck, Not Perception

AndroTMem's diagnostic finding — that long-horizon degradation comes from memory failures, not perception or action errors — validates a principle that production systems discovered independently: **the hardest problem in agent systems is not intelligence, it's memory**.

A model that can perfectly perceive a UI element and select the right action will still fail if it can't remember what it learned three steps ago. This is why raw capability benchmarks (MMLU, HumanEval) don't predict real-world agent performance — they test stateless reasoning, not stateful execution.

### 2. Anchors Beat Both Replay and Summary

The paper provides clean experimental evidence for what practitioners know intuitively:
- Full replay wastes context window on noise
- Summaries lose the critical details
- Anchored memory keeps exactly what matters and discards the rest

This is the same principle behind KDRs: don't store everything (replay), don't compress everything (summary), store the **decisions that matter** with enough context to reconstruct the reasoning.

### 3. Causal Linking Is Essential

ASM's causal links between anchors — anchor 5 depends on anchor 3 — mirror the GraphRAG entity-content hybrid topology: every claim is grounded in a source chunk, and traversal follows dependency paths. The academic version links GUI interaction states. The production version links knowledge entities to content chunks to other entities.

Both solve the same problem: **attribution-aware reasoning** where the agent can trace any decision back to the evidence that supports it.

### 4. The GUI-to-CLI Translation

AndroTMem focuses on mobile GUI agents (tap, swipe, input on Android). Atlas UX operates as a CLI agent system (Bash, file operations, API calls). The memory problem is identical despite the different interaction modality:

- GUI: "Remember the price from step 8 when deciding at step 25"
- CLI: "Remember the API key from Tuesday's session when deploying on Friday"

Both require anchored memory. Both fail with raw replay or lossy summaries. Both succeed with structured, causally linked state records.

---

## Research Directions

AndroTMem opens several directions that production systems are positioned to validate:

1. **Cross-session ASM** — Can anchored state memory be extended beyond single task sessions to multi-day workflows? (KDRs already do this.)

2. **Graph-augmented anchor retrieval** — Can knowledge graphs improve anchor selection over embedding-only retrieval? (Entity-content hybrid topology is designed for this.)

3. **Self-healing memory** — Can outdated anchors be automatically detected and corrected? (kbEval + auto-heal pipeline already implements this.)

4. **Multi-agent shared memory** — Can multiple agents share anchored state without conflicts? (33 agents sharing tenant-scoped KB with audit trail already validates this.)

5. **Anchor compression** — What is the minimum anchor set that preserves task performance? (This is the chunking optimization problem — how much context is enough?)

---

## Media

1. https://arxiv.org/html/2603.18429v1/x1.png — AndroTMem framework overview showing benchmark construction, diagnostic evaluation, and Anchored State Memory architecture
2. https://arxiv.org/html/2603.18429v1/x2.png — Dataset construction pipeline showing app collection, task generation with causal dependencies, and trajectory annotation
3. https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Directed_acyclic_graph_3.svg/400px-Directed_acyclic_graph_3.svg.png — Directed acyclic graph illustrating the causal dependency structure between state anchors
4. https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Social_Network_Analysis_Visualization.png/400px-Social_Network_Analysis_Visualization.png — Knowledge graph visualization representing the entity-content hybrid topology used in production anchor retrieval
5. https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Pipeline_overview.png/400px-Pipeline_overview.png — Pipeline architecture showing the multi-stage flow from trajectory collection to anchor extraction to retrieval

## Videos

- [GraphRAG: Unlocking LLM Discovery on Narrative Private Data — Microsoft Research](https://www.youtube.com/watch?v=r09tJfON6kE)
- [Building Production RAG Applications — LlamaIndex](https://www.youtube.com/watch?v=TRjq7t2Ms5I)

## References

1. Shi, Y., Li, J., Zhang, L., et al. (2026). "AndroTMem: From Interaction Trajectories to Anchored Memory in Long-Horizon GUI Agents." arXiv:2603.18429. https://arxiv.org/abs/2603.18429

2. Chen, J., Yang, X., Tu, H., et al. (2026). "Just Talk — An Agent That Meta-Learns and Evolves in the Wild." arXiv:2603.17187. https://arxiv.org/abs/2603.17187

3. Shinn, N., Cassano, F., et al. (2023). "Reflexion: Language Agents with Verbal Reinforcement Learning." NeurIPS 2023. https://arxiv.org/abs/2303.11366

4. Park, J. S., et al. (2023). "Generative Agents: Interactive Simulacra of Human Behavior." UIST 2023. https://arxiv.org/abs/2304.03442

5. Edge, D., Trinh, H., Cheng, N., et al. (2024). "From Local to Global: A Graph RAG Approach to Query-Focused Summarization." arXiv:2404.16130. https://arxiv.org/abs/2404.16130
