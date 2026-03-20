# M3-Agent: Multi-Modal Memory Systems for Lifelong Learning Agents

## Introduction

In August 2025, researchers from ByteDance Seed published "Seeing, Listening, Remembering, and Reasoning: A Multimodal Agent with Long-Term Memory" (arXiv:2508.09736), introducing M3-Agent — a framework that equips AI agents with entity-centric, multimodal long-term memory spanning visual, auditory, and structured knowledge representations. Unlike text-only memory systems that flatten rich sensory experiences into lossy summaries, M3-Agent processes real-time video and audio streams to build episodic and semantic memories organized around entities, enabling persistent world knowledge that accumulates across interactions.

The paper arrives alongside a broader wave of research reconceptualizing agent memory as a first-class architectural component. A December 2025 survey, "Memory in the Age of AI Agents" (arXiv:2512.13564), argues that traditional long/short-term memory taxonomies are insufficient for modern agent systems, while a March 2026 paper frames multi-agent memory as a computer architecture problem with shared memory hierarchies (arXiv:2603.10062). Together, these works establish multimodal memory as the critical infrastructure layer separating toy demos from production-grade agent systems.

---

## The Problem: Text-Only Memory Loses the World

Current LLM agents operate primarily in text space. Even when processing images or audio, they typically convert inputs to text descriptions, reason over the text, and discard the original modality. This creates three fundamental memory limitations:

### 1. Modality Collapse

When a voice agent hears a customer say "the pipe under the kitchen sink is leaking" with audible stress and urgency in their voice, a text-only memory records: "Customer reports kitchen sink pipe leak." The emotional context — urgency, frustration, potential emergency — is lost. When the agent later needs to prioritize this ticket, the urgency signal that was clearly present in the audio is gone.

### 2. Entity Fragmentation

Across multiple interactions, the same entity (a customer, a location, a piece of equipment) appears in different modalities: a photo of a broken HVAC unit, a voice description of the symptoms, a text message with the model number, a calendar entry for the repair appointment. Text-only memory stores these as disconnected text fragments with no entity linkage. The agent cannot reason that these four memories all refer to the same unit.

### 3. Temporal Incoherence

Real-world agent tasks unfold over time. A repair job progresses through stages: initial call, diagnosis, parts ordering, scheduling, completion. Each stage produces different modality outputs. Without temporal organization of multimodal memories, the agent cannot reconstruct the narrative arc of a task or predict what comes next based on what has already happened.

---

## M3-Agent Architecture

M3-Agent addresses these limitations through a dual-process architecture with two parallel subsystems: a memorization process and a control process.

### Memorization Process

The memorization subsystem continuously processes incoming visual and auditory streams to generate two types of memory:

**Episodic Memory:**
Temporally ordered records of specific experiences, indexed by time and entity. Each episodic memory captures:
- Visual state (key frames from the video stream)
- Audio content (transcribed speech, environmental sounds)
- Temporal markers (when the episode started, ended, key moments)
- Entity associations (which entities were involved)
- Causal links (what triggered this episode, what it led to)

**Semantic Memory:**
Entity-centric knowledge extracted from episodic memories through a consolidation process. When the agent encounters the same entity across multiple episodes, it consolidates observations into a structured semantic record:

```
Entity: Kitchen Sink (Unit #47B)
  - Visual: Chrome double-basin, P-trap visible, water stain on cabinet floor
  - Audio: Dripping sound at 2-second intervals (recorded 2025-08-14)
  - Properties: Model "KohlerK-5871", installed 2019, P-trap replaced 2023
  - Status: Active leak, repair scheduled 2025-08-16
  - Related: Customer #1847, Appointment #5521, Invoice #2903
```

### Control Process

Given an instruction, the control process executes tasks by iteratively reasoning and retrieving from long-term memory:

1. **Instruction Analysis**: Parse the task into required information and actions
2. **Memory Query**: Formulate multimodal queries against episodic and semantic stores
3. **Relevance Scoring**: Rank retrieved memories by relevance to current subtask
4. **Reasoning**: Integrate retrieved memories with current context to plan next action
5. **Action Execution**: Perform the planned action and observe results
6. **Memory Update**: Write new observations back to the memory system

The control process can perform multiple reasoning-retrieval cycles per task, enabling complex multi-step problem solving that leverages the full history of the agent's multimodal experiences.

---

## M3-Bench: Evaluating Multimodal Memory

To rigorously evaluate memory-based reasoning in multimodal agents, the researchers developed M3-Bench, comprising:

**M3-Bench-robot:** 100 newly recorded first-person robot-perspective videos capturing realistic interaction sequences with objects and environments. Questions require the agent to recall specific visual details, audio events, and temporal relationships from long video histories.

**M3-Bench-web:** 920 diverse web-sourced videos spanning multiple domains. Questions test entity tracking across scenes, cross-modal reasoning (e.g., "What was the speaker describing when this object appeared?"), and temporal ordering of multimodal events.

### Results

M3-Agent, trained via reinforcement learning on memory-based reasoning tasks, outperforms the strongest baselines:

| System | M3-Bench-robot | M3-Bench-web | VideoMME-long |
|--------|---------------|--------------|---------------|
| Gemini-1.5-pro (prompting) | Baseline | Baseline | Baseline |
| GPT-4o (prompting) | +1.2% | +0.8% | +0.3% |
| **M3-Agent (RL-trained)** | **+6.7%** | **+7.7%** | **+5.3%** |

The largest gains appear on questions requiring cross-episode entity tracking — exactly the capability that text-only memory systems sacrifice by flattening multimodal inputs.

---

## The Broader Memory Architecture Landscape

M3-Agent sits within a rapidly evolving research landscape on agent memory:

### MemVerse: Multimodal Memory for Lifelong Learning (arXiv:2512.03627)

MemVerse constructs three memory tiers — core, semantic, and episodic — using pretrained multimodal LLMs to convert raw sensory data (images, video, audio) into textual representations for storage. While this introduces modality compression, it enables unified retrieval across modalities through a shared text embedding space. The three-tier architecture enables different retention policies: core memories are permanent, semantic memories are consolidated periodically, and episodic memories decay unless reinforced by retrieval.

### Multi-Agent Memory Architecture (arXiv:2603.10062)

This paper frames multi-agent memory as a computer architecture problem, proposing shared and distributed memory paradigms organized in a three-layer hierarchy. When multiple agents collaborate on a task, they need both private working memory (agent-specific context) and shared memory (coordination state, shared observations). The paper draws direct parallels to CPU cache hierarchies: L1 (agent-local working memory), L2 (team-shared coordination state), L3 (system-wide knowledge base).

### Ella: Hierarchical Scene Graph Memory

Ella integrates structured long-term memory in two forms: name-centric semantic memory with hierarchical scene graphs and knowledge graphs, and spatiotemporal episodic memory that captures multi-modal experiences. The scene graph representation enables spatial reasoning ("Where was the wrench relative to the toolbox?") that flat memory systems cannot support.

---

## Production Validation: Atlas UX's Entity-Content Hybrid Memory

Atlas UX's production agent system implements multimodal memory principles across its 33-agent architecture, operating over a 525-document knowledge base with entity-content hybrid topology that directly parallels M3-Agent's entity-centric memory organization.

### Entity-Centric Memory Organization

The Prisma schema (30KB+) implements entity-centric memory through relational structure: tenants, contacts, appointments, conversations, and audit records are all linked through foreign key relationships that form a knowledge graph. When Lucy (the voice agent) handles a call, the resulting memory is not a flat transcript but a structured record linking the caller (entity) to their appointment (entity) to their service request (entity) to the conversation history (episodic memory).

This mirrors M3-Agent's entity consolidation: multiple interactions with the same customer build an increasingly rich semantic profile, exactly as M3-Agent consolidates episodic observations into entity records.

### Multi-Modal Input Processing

Atlas UX processes inputs across three modalities:
- **Voice**: ElevenLabs Conversational AI captures phone calls with Lucy, producing both audio recordings and structured transcripts
- **Text**: SMS via Twilio, Slack messages, and web chat create text-based episodic memories
- **Structured data**: Calendar entries, payment records, and form submissions contribute structured semantic memory

The governance equation `τ̂ᵢ,ₜ = f_θ(g, sₜ, Aₜ, τᵢ) · 𝟙[c ≥ γ(r)]` operates across all modalities — a voice call that triggers a high-risk action receives the same constitutional HIL review as a text-based request, ensuring consistent governance regardless of input modality.

### GraphRAG as Memory Retrieval

The GraphRAG architecture enables M3-Agent-style memory retrieval: instead of flat vector search over document chunks, the graph structure enables entity-aware traversal. Querying "What's the status of the Johnson HVAC repair?" traverses from the customer entity through appointment entities to service records, pulling context from multiple modalities and time periods — precisely the cross-episode entity tracking where M3-Agent shows its largest gains.

### KDR Episodic Memory

Key Decision Records implement episodic memory with causal linkage: each KDR captures what happened, why, what decisions were made, and what those decisions led to. The KDR system preserves dense spatial rewards by maintaining entity references throughout — a KDR about a video generation pipeline preserves links to the specific tools, configurations, and outcomes involved, enabling future retrieval by any of those entity anchors.

### Self-Healing Memory Consolidation

The KB eval system (89/100 score, 145 auto-healed articles) implements memory consolidation analogous to MemVerse's three-tier architecture: core knowledge (permanently retained), semantic knowledge (periodically evaluated and healed), and operational state (KDRs that are retained or archived based on relevance). Zero image leakage is enforced through the constitutional validation layer — no visual artifact from memory enters the output stream without governance gate passage.

---

## Media

### Images

1. ![Neural network memory architecture](https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_LSTM_cell.png/800px-The_LSTM_cell.png)
2. ![Knowledge graph entity relationships](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Semantic_Net.svg/800px-Semantic_Net.svg.png)
3. ![Multi-modal data fusion](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Artificial_neural_network.svg/800px-Artificial_neural_network.svg.png)
4. ![Episodic memory and hippocampus](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Hippocampus_%28brain%29.jpg/800px-Hippocampus_%28brain%29.jpg)
5. ![Computer memory hierarchy](https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/ComputerMemoryHierarchy.svg/800px-ComputerMemoryHierarchy.svg.png)

### Videos

1. [How Memory Works in AI Agents — Long-Term vs Short-Term](https://www.youtube.com/watch?v=dO4TPJkeaaU)
2. [Multimodal AI: Combining Vision, Language, and Audio](https://www.youtube.com/watch?v=mkI7EPD1vp8)

---

## References

1. ByteDance Seed Research. (2025). "Seeing, Listening, Remembering, and Reasoning: A Multimodal Agent with Long-Term Memory." arXiv:2508.09736. [https://arxiv.org/abs/2508.09736](https://arxiv.org/abs/2508.09736)
2. Zhang, Z., et al. (2025). "Memory in the Age of AI Agents." arXiv:2512.13564. [https://arxiv.org/abs/2512.13564](https://arxiv.org/abs/2512.13564)
3. Li, W., et al. (2025). "MemVerse: Multimodal Memory for Lifelong Learning Agents." arXiv:2512.03627. [https://arxiv.org/abs/2512.03627](https://arxiv.org/abs/2512.03627)
4. Wang, H., et al. (2026). "Multi-Agent Memory from a Computer Architecture Perspective." arXiv:2603.10062. [https://arxiv.org/abs/2603.10062](https://arxiv.org/abs/2603.10062)
5. M3-Agent Project. ByteDance Seed. [https://github.com/ByteDance-Seed/m3-agent](https://github.com/ByteDance-Seed/m3-agent)
