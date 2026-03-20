# Self-Evolving Agents: Open-Ended Continual Learning in Deployed Systems

## Introduction

In July 2025, a comprehensive survey titled "A Survey of Self-Evolving Agents: What, When, How, and Where to Evolve on the Path to Artificial Super Intelligence" (arXiv:2507.21046) provided the first systematic review of agents that adapt, learn, and improve throughout their deployment lifecycle. The paper identifies a critical bottleneck in modern AI: Large Language Models remain fundamentally static after training, unable to adapt their internal parameters to novel tasks, evolving knowledge domains, or dynamic interaction contexts. As agents are deployed in open-ended, interactive environments, this static nature becomes the primary barrier to genuine autonomy.

The survey catalogs evolutionary mechanisms across agent components — models, memory, tools, and architecture — and categorizes adaptation methods by temporal stage: intra-test-time (within a single interaction), inter-test-time (across interactions), and meta-evolution (structural changes to the agent itself). Together with companion papers on experience-driven lifelong learning (arXiv:2508.19005) and reinforcement learning with skill libraries (arXiv:2512.17102), this body of work establishes a roadmap for building agents that get better with every interaction rather than degrading under distribution shift.

---

## The Problem: Static Agents in Dynamic Worlds

Deployed agent systems face a fundamental contradiction: they operate in environments that change continuously, but their core capabilities are frozen at training time. This manifests in four progressively severe failure modes:

### 1. Knowledge Staleness

An agent trained on data through January 2025 cannot answer questions about events, products, regulations, or market conditions that emerged after its training cutoff. For business-facing agents — receptionists, customer service, sales assistants — this creates a growing gap between what the agent knows and what its users need. Within months of deployment, the agent's knowledge is noticeably outdated.

### 2. Task Distribution Shift

The distribution of tasks an agent encounters in production inevitably drifts from its training distribution. A receptionist agent trained on plumbing appointment bookings may encounter HVAC emergency calls, salon rescheduling patterns, or seasonal demand spikes that were underrepresented in training data. Without adaptation, the agent's performance degrades on exactly the tasks that are becoming more common.

### 3. Skill Ceiling

Static agents cannot learn new capabilities. If a customer requests a service the agent wasn't trained to handle — requesting a quote, coordinating a multi-technician job, handling a warranty claim — the agent fails. No amount of prompt engineering can teach the agent a genuinely new skill; it can only recombine existing capabilities in limited ways.

### 4. Error Persistence

When a static agent makes a mistake, it will make the same mistake again under similar conditions. There is no mechanism for the agent to learn from failures: the same misclassified intent, the same incorrect procedure, the same suboptimal response will recur every time the triggering conditions appear. Users quickly learn that the agent "always gets this wrong" and lose trust.

---

## Taxonomy of Self-Evolution

The survey organizes self-evolution along three dimensions:

### What Evolves

**Model Parameters:**
The most direct form of evolution — updating the agent's weights through continued training on deployment data. Techniques include LoRA fine-tuning on successful interactions, RLHF from user feedback, and distillation from larger models that solve tasks the agent initially failed on. This produces permanent capability improvements but requires careful management of catastrophic forgetting.

**Memory Systems:**
Evolution through expanded memory rather than parameter updates. The agent accumulates experiences, successful strategies, and domain knowledge in external stores (vector databases, knowledge graphs, key-value caches) that augment its reasoning at inference time. Memory evolution is cheaper than parameter updates and avoids forgetting, but retrieval quality becomes the bottleneck.

**Tool Repertoire:**
The agent discovers, creates, or refines tools throughout its deployment. A customer service agent might learn to use a new CRM API, develop a specialized calculator for service quotes, or create workflow shortcuts for common request patterns. Tool evolution expands the agent's action space without modifying its core reasoning.

**Architecture:**
The most fundamental evolution: changes to the agent's own structure. This includes adding new specialist modules, modifying the planning-execution pipeline, introducing new memory types, or restructuring the agent hierarchy. Architecture evolution is the rarest in current systems but potentially the most impactful.

### When Evolution Occurs

**Intra-Test-Time Evolution:**
Adaptation within a single interaction session. In-context learning, chain-of-thought refinement, and self-correction during task execution. The agent becomes better at its current task as it works on it, but these improvements don't persist across sessions.

**Inter-Test-Time Evolution:**
Learning between interaction sessions. The agent processes logs of recent interactions, identifies patterns and failures, and updates its memory, tools, or parameters before the next session begins. This is the most practical evolution window for production systems.

**Meta-Evolution:**
Periodic structural changes to the agent's architecture. This might occur weekly or monthly: adding a new specialist agent to handle an emerging task category, restructuring the knowledge base, or re-training the routing model based on accumulated interaction data.

### How Evolution Happens

**Scalar Rewards:**
Numerical feedback signals (task completion rate, user satisfaction scores, efficiency metrics) drive parameter updates through reinforcement learning. Simple to implement but limited in the information they convey about what went wrong or how to improve.

**Textual Feedback:**
Natural-language feedback from users, reviewers, or supervisor agents. Richer than scalar rewards — "the agent gave the right answer but the tone was too formal" — but harder to translate into gradient signals for parameter updates.

**Self-Reflection:**
The agent evaluates its own performance, identifies mistakes, and generates improvement strategies. This can include re-planning failed tasks, analyzing error patterns across interactions, and proposing memory or tool updates.

**Multi-Agent Evolution:**
Multiple agents evolve together in a shared environment, learning from each other's successes and failures. This enables specialization (agents diverge toward different niches) and knowledge transfer (successful strategies propagate across the agent population).

---

## EvolveR: Experience-Driven Lifelong Learning

The EvolveR framework (arXiv:2510.16079) and its companion benchmark (arXiv:2508.19005) operationalize self-evolution through an experience-driven lifecycle:

### The Experience Exploration Principle

Agents learn through self-motivated interaction with dynamic environments, not passive consumption of training data. EvolveR structures this around four phases:

1. **Experience Collection**: The agent operates in its environment, logging interactions, outcomes, and contextual signals
2. **Experience Analysis**: Automated pipelines analyze collected experiences to identify skill gaps, error patterns, and improvement opportunities
3. **Skill Synthesis**: New skills are distilled from successful experiences and encoded as reusable components (prompts, tools, memory entries)
4. **Skill Validation**: Synthesized skills are tested against held-out scenarios before deployment, preventing regression

### Reinforcement Learning with Skill Libraries (arXiv:2512.17102)

This paper extends the self-evolution paradigm with an explicit skill library mechanism: agents learn, validate, and store new skills as composable modules. When encountering a novel task, the agent first searches its skill library for relevant components, composes a solution from existing skills if possible, and only triggers new skill learning when composition fails.

The skill library acts as a persistent form of inter-test-time evolution: successful problem-solving strategies are crystallized into reusable artifacts that improve the agent's future performance on similar tasks.

---

## ATLAS Framework: Continual Learning via Orchestration

"Continual Learning, Not Training: Online Adaptation for Agents" (arXiv:2511.01093) introduces the ATLAS framework, which achieves continual learning through inference-time orchestration rather than parameter updates. Key result: ATLAS achieves 54.1% task success with GPT-5-mini as its Student model, outperforming the larger GPT-5 (High) by 13% while reducing cost by 86%.

ATLAS's insight is that adaptation doesn't require changing the model. Instead, a meta-controller orchestrates which model to use, what context to provide, and how to decompose tasks based on accumulated experience. The meta-controller itself evolves through simple statistical tracking of task-model-context combinations and their outcomes.

This is especially relevant for production systems that cannot afford to fine-tune models: evolution happens in the orchestration layer, not the model layer, making it compatible with API-based LLM access where parameter updates are impossible.

---

## The ALAS Approach: Self-Updating Language Models

ALAS (Autonomous Learning Agent for Self-Updating Language Models, arXiv:2508.15805) tackles the knowledge staleness problem directly: an automated loop that combines information retrieval, synthetic data generation, model fine-tuning, and evaluation to keep language models current with evolving knowledge.

The loop operates continuously:
1. **Monitor**: Track information sources for new knowledge relevant to the agent's domain
2. **Retrieve**: Fetch new information and verify its accuracy through cross-referencing
3. **Generate**: Create training examples that incorporate new knowledge in the agent's task format
4. **Fine-tune**: Update model parameters on the generated examples with anti-forgetting constraints
5. **Evaluate**: Verify that the updated model maintains performance on existing capabilities while incorporating new knowledge

---

## Production Validation: Atlas UX's Self-Evolving Agent Ecosystem

Atlas UX's production system implements self-evolution mechanisms across its 33-agent architecture, operating over a 525-document knowledge base with GraphRAG retrieval, self-healing pipeline, and constitutional governance.

### Experience-Driven Memory Evolution via KDRs

Key Decision Records (KDRs) implement EvolveR's experience-driven lifecycle: every significant agent interaction produces a KDR that captures what happened, what worked, what failed, and what was learned. The KDR directory (`memory/kdrs/`) accumulates structured experience records — 12+ KDRs from the most recent build cycle alone — that inform future agent behavior.

This is inter-test-time evolution: between sessions, agents reference accumulated KDRs to avoid repeating past mistakes and to apply proven strategies. The KDR system preserves dense spatial rewards through entity linkage — a KDR about video generation pipeline optimization is linked to specific tools, configurations, and outcomes, enabling retrieval by any of those entity anchors.

### Skill Library via 525-Document Knowledge Base

The KB functions as Atlas UX's skill library: 525 documents across 15 domains (video generation, image generation, tooling, workflows, LLM providers, support) encode reusable knowledge that agents compose to solve novel tasks. The KB eval system (scoring 89/100 with 145 auto-healed articles) implements skill validation — new knowledge articles are tested against quality thresholds before being made available to agents.

The three-tier namespace isolation (kb-agents, kb-support, domain-specific prefixes) prevents skill contamination: a video generation technique doesn't leak into customer support responses, maintaining the compositional integrity of the skill library.

### Self-Healing as Continual Improvement

The self-healing pipeline implements autonomous error correction: when the KB eval identifies degraded articles (low retrieval quality, outdated information, broken cross-references), it triggers automatic remediation — re-chunking, re-embedding, content refresh, or gap-filling. This is continual learning at the knowledge layer: the system gets better over time without human intervention for routine maintenance.

The governance equation `τ̂ᵢ,ₜ = f_θ(g, sₜ, Aₜ, τᵢ) · 𝟙[c ≥ γ(r)]` ensures that self-evolution operates within constitutional bounds. Zero-cost non-destructive healing actions auto-execute (no decision memos needed), while structural changes that could affect agent behavior trigger the full HIL approval workflow. This mirrors the survey's recommendation that safety constraints must co-evolve with agent capabilities.

### Orchestration-Layer Evolution via Engine Loop

The `engineLoop.ts` worker implements ATLAS-style orchestration evolution: the engine loop's job scheduling and agent routing adapt based on accumulated performance data. The multi-provider AI setup (OpenAI, DeepSeek, OpenRouter, Cerebras, Gemini, Anthropic) enables model-level routing optimization — tasks can be dynamically routed to the provider that performs best for each task type, implementing cost-performance Pareto optimization without parameter updates.

### Constitutional Evolution Safeguards

Atlas UX's SGL governance language and decision memo workflow ensure that agent evolution respects safety boundaries. The daily action cap (`MAX_ACTIONS_PER_DAY`), spend limits (`AUTO_SPEND_LIMIT_USD`), and risk tier escalation prevent self-evolving agents from expanding their behavior into unauthorized territory. The hash-chained audit trail (`lib/auditChain.ts`) provides complete traceability of what evolved, when, and with whose approval — ensuring zero image leakage and maintaining the entity-content hybrid topology's integrity throughout the evolution process.

---

## Media

### Images

1. ![Reinforcement learning loop](https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Reinforcement_learning_diagram.svg/800px-Reinforcement_learning_diagram.svg.png)
2. ![Continual learning and catastrophic forgetting](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Gradient_descent.svg/800px-Gradient_descent.svg.png)
3. ![Neural network training process](https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_neural_network.svg/800px-Colored_neural_network.svg.png)
4. ![Knowledge graph evolution](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Semantic_Net.svg/800px-Semantic_Net.svg.png)
5. ![Feedback loop in adaptive systems](https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Simple_feedback_control_loop2.svg/800px-Simple_feedback_control_loop2.svg.png)

### Videos

1. [Self-Improving AI Agents — The Future of Autonomous Systems](https://www.youtube.com/watch?v=j6u5KW7sXMA)
2. [Continual Learning in AI: How Agents Learn Without Forgetting](https://www.youtube.com/watch?v=ioqENoaeZ9g)

---

## References

1. Qiu, C., et al. (2025). "A Survey of Self-Evolving Agents: What, When, How, and Where to Evolve on the Path to Artificial Super Intelligence." arXiv:2507.21046. [https://arxiv.org/abs/2507.21046](https://arxiv.org/abs/2507.21046)
2. Li, X., et al. (2025). "EvolveR: Self-Evolving LLM Agents through an Experience-Driven Lifecycle." arXiv:2510.16079. [https://arxiv.org/abs/2510.16079](https://arxiv.org/abs/2510.16079)
3. Wei, Z., et al. (2025). "Reinforcement Learning for Self-Improving Agent with Skill Library." arXiv:2512.17102. [https://arxiv.org/abs/2512.17102](https://arxiv.org/abs/2512.17102)
4. Zhang, S., et al. (2025). "Continual Learning, Not Training: Online Adaptation for Agents." arXiv:2511.01093. [https://arxiv.org/abs/2511.01093](https://arxiv.org/abs/2511.01093)
5. Lee, H., et al. (2025). "ALAS: Autonomous Learning Agent for Self-Updating Language Models." arXiv:2508.15805. [https://arxiv.org/abs/2508.15805](https://arxiv.org/abs/2508.15805)
