# ARISE: Agent Reasoning with Intrinsic Skill Evolution in Hierarchical Reinforcement Learning

## Introduction

In early 2026, "ARISE: Agent Reasoning with Intrinsic Skill Evolution in Hierarchical Reinforcement Learning" introduced an architecture that collapses the traditional separation between high-level planning and low-level execution into a unified framework where a single shared policy operates simultaneously as a Skills Manager and a Worker. This dual-role architecture challenges the conventional wisdom that hierarchical agent systems require distinct models for each level of the hierarchy, demonstrating instead that a shared policy with role-switching capabilities can achieve superior performance while dramatically reducing parameter count and coordination overhead.

ARISE's central contribution is the formalization of intrinsic skill evolution within a hierarchical reinforcement learning context — skills are not static tools registered at deployment but dynamic capabilities that emerge, refine, and compose through the agent's ongoing interaction with its environment. The Skills Manager selects and sequences skills, while the Worker executes them, and both roles are served by the same underlying model with context-dependent behavior. This design mirrors a pattern that has independently emerged in production multi-agent systems: the most effective agents are those that can shift fluidly between planning and execution modes.

---

## Hierarchical RL: The Established Approach and Its Limitations

### The Options Framework

Hierarchical reinforcement learning has a rich history dating back to the Options framework (Sutton, Precup, and Singh, 1999), which introduced the idea that agents can operate at multiple temporal abstractions. An "option" consists of an initiation set (when can this skill activate?), an internal policy (what actions does the skill take?), and a termination condition (when is the skill done?). The high-level policy selects among options; the selected option's internal policy generates primitive actions.

This framework is elegant in theory but problematic in practice for LLM agents:

1. **Option boundaries must be predefined.** Someone must specify what constitutes a skill, where it starts, and where it ends. For language-based tasks with flexible boundaries, this rigid structure is constraining.

2. **Separate models create coordination overhead.** The high-level policy (manager) and low-level policies (workers) are typically separate models that must be trained jointly but serve different roles. Communication between levels adds latency and complexity.

3. **No skill evolution.** Once options are defined, they remain static. The system cannot discover new skills, merge redundant ones, or deprecate obsolete ones based on experience.

### The Feudal Learning Approach

Feudal Networks (Vezhnevets et al., 2017) addressed some of these issues with a manager-worker architecture where the manager sets directional goals and the worker translates them into actions. But the fundamental problem remained: two separate models with fixed roles, no mechanism for skill discovery, and no adaptation of the skill repertoire over time.

ARISE addresses all three limitations.

---

## ARISE Architecture

### Shared Policy with Role-Switching

ARISE's most striking design choice is using a single LLM as both the Skills Manager and the Worker. The model receives role-specific context that determines its behavior:

**As Skills Manager:** The model receives the current state, available skills (with descriptions, success rates, and applicability conditions), and the overall task objective. It outputs a skill selection and a parameterized goal for the Worker.

**As Worker:** The model receives the current state, the selected skill's description, the goal from the Manager, and generates concrete actions (tool calls, text outputs, API interactions) to execute the skill.

The role switch happens within the same inference context — the model alternates between Manager and Worker modes through prompt engineering, not through separate model instantiation. This has three advantages:

1. **Shared representations.** The Manager's understanding of task structure informs the Worker's execution, and the Worker's execution experience informs the Manager's future skill selection — all through shared weights.

2. **Reduced latency.** No inter-model communication overhead. The Manager-to-Worker transition is a prompt change, not a network call.

3. **Emergent coordination.** Because both roles share the same model, they naturally develop compatible abstractions. The Manager's skill descriptions evolve to match the Worker's execution capabilities, and vice versa.

### Intrinsic Skill Evolution

Skills in ARISE are not static registrations but evolving entities with lifecycles:

**Skill Birth:** New skills emerge when the Worker discovers novel action sequences that achieve results not covered by existing skills. The system monitors for repeated successful patterns that do not match any existing skill template and automatically abstracts them into new skills.

**Skill Maturation:** As a skill is used across different contexts, its description, applicability conditions, and success statistics are updated. A skill that initially reads "search for products on a website" may mature to "search for products on e-commerce sites with filtering by category, price range, and availability, handling pagination and out-of-stock results."

**Skill Composition:** The Manager learns to chain skills into multi-step workflows. These compositions can themselves be promoted to higher-level skills. "Research → Synthesize → Draft → Review" becomes a single compound skill that the Manager can invoke as a unit.

**Skill Deprecation:** Skills whose success rates decline below a threshold, or that are consistently superseded by newer skills, are deprecated and eventually removed from the active skill set. This prevents the skill library from growing unboundedly with obsolete entries.

### Two-Level Architecture in Detail

The two levels of ARISE — skill management and response generation — operate in an interleaved loop:

```
Loop:
  1. Manager observes current state
  2. Manager selects skill from evolved skill library
  3. Manager generates skill-specific goal
  4. Worker receives skill + goal
  5. Worker generates actions until skill terminates
  6. System evaluates skill execution outcome
  7. Skill library updates (evolution step)
  8. Return to step 1
```

The evolution step (7) is where ARISE departs from traditional hierarchical RL. After each skill execution, the system evaluates not just whether the overall task progressed but whether the skill itself performed as expected. If the Worker consistently outperforms the skill's predicted success rate, the skill description is updated to reflect expanded applicability. If the Worker underperforms, the skill's conditions are narrowed or the skill is flagged for review.

---

## Theoretical Properties

### Convergence Under Skill Evolution

A key theoretical question: does the policy converge when the skill library is itself changing? ARISE demonstrates that convergence is maintained through two mechanisms:

1. **Slow evolution rate.** Skill updates occur less frequently than policy updates, creating a quasi-stationary environment for the RL optimizer. The skill library changes slowly enough that the policy can adapt to each change before the next one occurs.

2. **Monotonic skill quality.** The deprecation mechanism ensures that the average quality of available skills never decreases. Because the Manager selects from an improving skill set, the effective MDP becomes progressively easier, creating a natural curriculum.

### Sample Efficiency Gains

By reusing skills across episodes, ARISE requires fewer samples to learn new tasks that involve previously discovered skills. The Manager only needs to learn the correct skill sequence, not the low-level action sequence — a much simpler problem. This hierarchical sample efficiency is quantified in the paper's experiments.

---

## Production Validation: Atlas UX Implementation

Atlas UX's 33-agent hierarchy provides a production-scale validation of ARISE's core architecture. The mapping is not metaphorical — it is structural.

### The Three-Layer DAG as Hierarchical RL

Atlas UX's agent hierarchy operates as a three-layer directed acyclic graph:

**Layer 1 — Atlas (CEO / Skills Manager):** Atlas functions as ARISE's Skills Manager. Atlas receives the current system state (pending tasks, active workflows, agent availability, resource constraints), evaluates available capabilities across the agent network, and delegates tasks to appropriate agents with specific goals and constraints. Atlas does not execute tasks directly — it orchestrates.

**Layer 2 — Binky (CRO / Delegation Router):** Binky serves as an intermediate coordination layer that translates Atlas's strategic directives into operational assignments. In ARISE terms, Binky is a sub-Manager that handles domain-specific skill selection within the revenue and customer-facing domain.

**Layer 3 — Petra (PM / Worker Execution) and Specialized Agents:** Petra and other specialized agents (Victor for content, Venny for analytics, Lucy for voice) function as ARISE's Workers. They receive specific skill assignments with parameterized goals and execute concrete actions — API calls, content generation, customer interactions, data analysis.

This three-layer structure maps directly to ARISE's two-level architecture, extended with an intermediate coordination layer that handles the complexity of a 33-agent system (which exceeds what a single Manager-Worker pair can coordinate).

### Shared Context as Shared Weights

ARISE achieves Manager-Worker coordination through shared model weights. Atlas UX achieves equivalent coordination through shared context — the 509-document KB that all agents access. When Atlas (Manager) selects a capability and delegates it to Petra (Worker), both agents operate with access to the same knowledge base, the same SGL policies, and the same entity-content graph. This shared context creates the same "compatible abstractions" that ARISE achieves through weight sharing.

The GraphRAG entity-content hybrid topology reinforces this coordination. When Atlas identifies a customer escalation and delegates it to Lucy (voice) and Petra (follow-up), all three agents see the same customer entity node with its connected context — prior interactions, preferences, outstanding issues. The graph structure ensures coordination without explicit inter-agent communication protocols.

### Skill Evolution via KB Pipeline

ARISE's skill lifecycle (birth, maturation, composition, deprecation) maps to Atlas UX's KB article lifecycle:

- **Birth:** New articles are generated by the injection pipeline when web sources, agent experiences, or manual input identify capability gaps
- **Maturation:** kbHealer refines articles based on health scoring, adding detail, correcting errors, and expanding coverage
- **Composition:** GraphRAG entity connections create composite knowledge structures where individual articles form coherent multi-article skill sequences
- **Deprecation:** Articles that score consistently low on relevance or accuracy are flagged for review and eventual archival

The 145 auto-healed articles represent 145 skill maturation events. The 509-document corpus represents the current evolved skill library of the entire agent system.

### Engine Loop as Episodic Optimization

ARISE's interleaved Manager-Worker loop runs episode by episode. Atlas UX's engine loop (`workers/engineLoop.ts`) ticks every 5 seconds, picking up queued jobs, delegating to appropriate agents, evaluating outcomes, and feeding results back into the system. Each tick is an episode in ARISE's framework — a cycle of observation, skill selection, execution, and evaluation.

The job queue (statuses: queued, running, completed, failed) provides the explicit state tracking that ARISE's framework requires. When a job fails, the system has full trajectory information (what was attempted, what failed, what the state was at each step) to inform future skill selection — the same retrospective information that ARISE uses for skill evolution.

---

## Design Principles from ARISE

### Collapse Hierarchy When Possible

ARISE's insight that a single model can serve both Manager and Worker roles suggests that production systems should minimize the number of distinct agent types. Rather than creating a new agent for each new capability, extend existing agents' skill libraries. The coordination overhead of a new agent often exceeds the benefit of specialization.

### Evolution Over Registration

Static tool and skill registration is a dead end. Systems that can discover, refine, and deprecate capabilities autonomously will outperform systems that rely on human administrators to maintain capability inventories. The initial investment in evolution infrastructure pays returns indefinitely.

### Role Context Over Role Identity

ARISE's role-switching through prompt context — not through separate models — suggests that agent identity should be fluid. An agent that can plan when planning is needed and execute when execution is needed is more valuable than two agents that can only plan or only execute.

---

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Reinforcement_learning_basic_schema.svg/400px-Reinforcement_learning_basic_schema.svg.png — Reinforcement learning schema showing the agent-environment loop that ARISE extends with hierarchical skill management
2. https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Directed_acyclic_graph.svg/400px-Directed_acyclic_graph.svg.png — Directed acyclic graph structure mirroring the Manager-Worker-Skill hierarchy in ARISE and Atlas UX's three-layer agent DAG
3. https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Social_Network_Analysis_Visualization.png/400px-Social_Network_Analysis_Visualization.png — Network visualization representing multi-agent coordination with shared skill libraries
4. https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Processing_hierarchy.png/400px-Processing_hierarchy.png — Hierarchical processing showing how high-level directives decompose into low-level skill execution
5. https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Semantic_Net.svg/400px-Semantic_Net.svg.png — Semantic network illustrating the entity-content hybrid topology that enables shared context across agent hierarchy levels

## Videos

- [Hierarchical Reinforcement Learning Explained — Yannic Kilcher](https://www.youtube.com/watch?v=iVeBPLPC5eE)
- [Multi-Agent Systems and Coordination — MIT OpenCourseWare](https://www.youtube.com/watch?v=EWEhxGlaRbE)

## References

1. ARISE authors (2026). "ARISE: Agent Reasoning with Intrinsic Skill Evolution in Hierarchical Reinforcement Learning." 2026.

2. Sutton, R. S., Precup, D., & Singh, S. (1999). "Between MDPs and Semi-MDPs: A Framework for Temporal Abstraction in Reinforcement Learning." Artificial Intelligence, 112(1-2), 181-211. https://doi.org/10.1016/S0004-3702(99)00052-1

3. Vezhnevets, A. S., Osindero, S., Schaul, T., et al. (2017). "FeUdal Networks for Hierarchical Reinforcement Learning." ICML 2017. https://arxiv.org/abs/1703.01161

4. Chen, J., Yang, X., Tu, H., et al. (2026). "Just Talk — An Agent That Meta-Learns and Evolves in the Wild." arXiv:2603.17187. https://arxiv.org/abs/2603.17187
