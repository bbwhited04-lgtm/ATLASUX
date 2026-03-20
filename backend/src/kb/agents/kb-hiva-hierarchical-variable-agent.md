# HiVA: Self-organized Hierarchical Variable Agent via Goal-driven Semantic-Topological Evolution

## Introduction

Autonomous agent frameworks face a fundamental tension between structure and flexibility. Fixed workflows — where agent roles, routing rules, and execution sequences are predefined — deliver reliable performance on known tasks but require manual reconfiguration when the environment changes. Reactive loops — where agents dynamically decide their next action based on current observations — handle novel situations but fail to distill reasoning progress into reusable structures. Every production agent system navigates this tension daily: too much structure and the system cannot adapt; too little and it cannot learn.

Jinzhou Tang, Jusheng Zhang, Qinhan Lv, Sidi Liu, Jing Yang, Chengpei Tang, and Keze Wang tackle this problem head-on in "HiVA: Self-organized Hierarchical Variable Agent via Goal-driven Semantic-Topological Evolution" (arXiv:2509.00189, September 2025). HiVA models agentic workflows as self-organizing graphs where both the semantics of individual agents and the topology connecting them co-evolve through environmental feedback. The "Variable" in HiVA means that agents change their capabilities based on task needs — they are not fixed-role specialists but adaptive units whose behavior, prompts, and routing priorities evolve through a novel Semantic-Topological Evolution (STEV) algorithm.

The result is a framework that combines the reliability of structured workflows with the adaptability of reactive systems. Agents self-organize into hierarchies, routing decisions are optimized through Multi-Armed Bandit algorithms, and diagnostic feedback from the environment drives gradient-like updates to both individual agent behavior and collective topology.

## The Problem: Rigid Workflows vs. Chaotic Reactivity

### The Fixed Workflow Trap

Most production agent systems (AutoGen, CrewAI, LangGraph) define workflows as static DAGs (Directed Acyclic Graphs). Agent A routes to Agent B, which routes to Agent C, with predefined conditions determining which path to take. This works well for tasks the designer anticipated but fails when:

- **Task distribution shifts.** The workflow was designed for customer support but starts receiving technical debugging requests. The fixed routing sends debugging queries through a "sentiment analysis" agent that adds no value.
- **Agent capability drift.** The underlying LLM is updated, changing the relative strengths of different agents. A routing rule that sent "complex" queries to GPT-4 and "simple" queries to a smaller model becomes suboptimal when the smaller model improves.
- **New task types emerge.** A task that requires a capability not represented by any existing agent in the DAG simply cannot be handled. Adding the capability requires human redesign of the workflow.

### The Reactive Loop Trap

At the other extreme, systems like ReAct and Reflexion give agents maximum flexibility — each step, the agent observes the current state and decides what to do next. This handles novel situations gracefully but has its own failure modes:

- **No structural learning.** Each task starts from scratch. Even if the agent solved a nearly identical task yesterday, it has no workflow structure to reuse.
- **Reasoning depth limits.** Long reactive chains degrade in quality as the context window fills with historical observations. Without hierarchical decomposition, complex tasks overwhelm the agent's reasoning capacity.
- **No transferability.** Solutions discovered for one task cannot be easily transferred to similar tasks because there is no explicit workflow representation to transfer.

HiVA resolves this tension by making workflow structure itself a learnable, evolvable quantity.

## STEV: Semantic-Topological Evolution Algorithm

The core of HiVA is the Semantic-Topological Evolution (STEV) algorithm, which optimizes a hybrid semantic-topological space where:

- **Semantic space** describes what each agent does — its role, capabilities, prompt instructions, and behavioral parameters.
- **Topological space** describes how agents connect — routing priorities, handoff conditions, fallback chains, and hierarchical relationships.

STEV co-evolves both spaces simultaneously, using a mechanism the authors call "textual gradients" — discrete-domain surrogates for the continuous gradients used in neural network backpropagation.

### How Textual Gradients Work

In standard deep learning, backpropagation computes how each parameter should change to reduce the loss function. In a discrete text domain, there are no continuous parameters to differentiate. STEV addresses this by:

1. **Executing the workflow** on a task and observing the outcome (success, failure, partial success).
2. **Generating diagnostic feedback** — an LLM analyzes the execution trace to identify which agent actions contributed to success or failure and why. This diagnostic is the "gradient" — it specifies the direction of improvement in natural language rather than in numeric parameter space.
3. **Applying semantic updates** — agents whose behavior was diagnosed as suboptimal receive prompt modifications. An agent diagnosed as "too verbose in its analysis, causing downstream agents to exceed context limits" gets its prompt updated to emphasize conciseness. These are the semantic "parameter updates."
4. **Applying topological updates** — routing weights between agents are adjusted based on diagnostic feedback. If the analysis shows that Agent A consistently produces better inputs for Agent C than Agent B does, the routing weight from A to C increases. These are the topological "parameter updates."

The textual gradient concept is powerful because it enables optimization of discrete, language-based systems using the same iterative improvement logic that drives neural network training — without requiring differentiable parameters.

## Multi-Armed Bandit Routing

HiVA's forward execution uses a Multi-Armed Bandit (MAB) formulation for routing decisions. When an agent completes its work and must decide which downstream agent to route to, the decision is modeled as a bandit problem:

**Arms** = available downstream agents.
**Reward** = the quality of the eventual task outcome, attributed back to the routing decision.
**Exploration vs. exploitation** = balancing the known-best route against trying alternative routes that might prove superior.

The MAB formulation is superior to deterministic routing rules because it:

- **Adapts to non-stationary environments.** If Agent B's performance improves (due to an LLM update or semantic evolution), the MAB naturally shifts routing toward B without requiring manual rule changes.
- **Handles uncertainty gracefully.** For task types with limited execution history, the MAB explores different routing options. For well-understood task types, it exploits the known-best route.
- **Provides principled exploration.** Unlike random routing, MAB algorithms (UCB1, Thompson Sampling) explore strategically — trying under-explored routes that have high uncertainty and therefore high potential.

### Routing in Practice

Consider a three-agent hierarchy: a Coordinator agent that receives tasks, a Research agent that gathers information, and a Synthesis agent that produces outputs. In a fixed workflow, every task follows Coordinator → Research → Synthesis. In HiVA's MAB routing:

- Tasks that historically benefited from research are routed Coordinator → Research → Synthesis (exploitation).
- Tasks of a new type might be routed Coordinator → Synthesis directly to test whether research adds value for this task type (exploration).
- If the Research agent is updated and becomes significantly faster, the MAB increases its routing weight even for tasks that previously went directly to Synthesis.

This creates a system where routing topology evolves based on empirical performance rather than designer assumptions.

## Diagnostic Gradient Generation

The STEV algorithm's diagnostic component transforms environmental feedback into actionable improvement signals. After each task execution, a diagnostic LLM analyzes the complete execution trace:

**Success Attribution.** Which agent actions were critical to successful outcomes? What routing decisions led to efficient execution? Which agent capabilities were essential?

**Failure Diagnosis.** Where did the workflow break down? Was the failure due to an individual agent's inadequate capability (semantic issue) or due to poor routing between agents (topological issue)? Could a different agent ordering have avoided the failure?

**Efficiency Analysis.** Even for successful tasks, were there unnecessary steps? Did any agent produce output that was not used by downstream agents? Could the workflow have been shorter?

These diagnostics are not stored passively — they drive active updates to both the semantic space (agent prompts and capabilities) and the topological space (routing weights and hierarchy). The key insight is that the same natural language that describes the diagnosis also describes the remedy. "Agent B's analysis was too shallow for this task type" directly implies the semantic update "increase analysis depth in Agent B's prompt for this task category."

## Variable Agents: Capabilities That Adapt

The "Variable" in HiVA refers to agents whose capabilities change based on task demands. Unlike fixed-role agents (an "analyst" is always an analyst), variable agents can:

**Expand capabilities.** When the diagnostic gradient consistently identifies a missing capability, the agent's prompt is extended to include it. An agent that was initially a "summarizer" might evolve to include "critical analysis" if diagnostics repeatedly show that downstream agents needed evaluation, not just summary.

**Specialize capabilities.** When the diagnostic gradient shows that certain capabilities are rarely used, they can be pruned from the agent's prompt to reduce context consumption and improve focus. An agent with 10 capabilities but only 3 that are regularly useful can be streamlined.

**Transfer capabilities.** When a capability proves useful in one agent but would be more valuable in a different position in the topology, STEV can replicate it to the better-positioned agent. This is semantic migration — capabilities moving through the topology to where they have the most impact.

The result is that the agent system's collective capabilities evolve to match the task distribution it encounters, without any human intervention in agent design.

## Self-Organized Hierarchy

HiVA's hierarchy is not imposed top-down — it emerges from the STEV optimization process. The mechanism is straightforward:

- Agents that consistently serve as entry points for diverse task types naturally become **coordinators** — high-level nodes in the hierarchy.
- Agents that consistently produce outputs consumed by many other agents become **hubs** — shared resources in the hierarchy.
- Agents that handle specific narrow task types become **specialists** — leaf nodes accessed only for particular needs.

This emergent hierarchy mirrors how human organizations self-organize: generalists rise to coordination roles, experts are consulted for specific needs, and the structure adapts as the organization's task portfolio evolves.

## Experimental Results

HiVA was evaluated across multiple benchmarks spanning diverse task types:

**Dialogue Systems.** Task-oriented dialogue requiring multi-turn reasoning and information gathering. HiVA's variable agents adapted their conversational strategies based on diagnostic feedback, improving task completion rates by 5-8% over fixed-agent baselines.

**Coding Tasks.** Software development requiring planning, implementation, testing, and debugging. The self-organizing hierarchy naturally produced a planner → coder → tester decomposition without this structure being predefined.

**Long-Context QA.** Question answering over documents exceeding 100K tokens. HiVA's routing learned to decompose long-context questions into sub-questions handled by specialized agents operating on document sections.

**Mathematical Problem Solving.** Multi-step proofs and calculations. The diagnostic gradient was particularly effective here, identifying specific reasoning failures and updating agent prompts to address them.

**Agentic Evaluation Suites.** Complex multi-step tasks requiring tool use, planning, and adaptation. HiVA achieved 5-10% accuracy improvements and enhanced resource efficiency across these benchmarks, demonstrating that the framework's benefits compound as task complexity increases.

---

## Production Validation: Atlas UX as a Variable Agent Hierarchy

Atlas UX's 33-agent hierarchy implements HiVA's core concepts in a production environment that has been operational since before the paper's September 2025 publication. The convergence is not coincidental — both systems face the same fundamental problem of balancing structural reliability with adaptive flexibility.

### Mapping HiVA to Production

| HiVA Concept | Academic Description | Production Implementation |
|-------------|---------------------|--------------------------|
| Self-organized hierarchy | Agents organize into coordinator/hub/specialist roles through optimization | Atlas (CEO), Binky (CRO), Petra (PM) hierarchy — fixed roles but flexible routing through the 33-agent registry |
| Variable agents | Agents change capabilities based on task needs | Agent policies and SKILL.md files are updated through KB injection pipeline — agent behavior evolves as the KB evolves |
| STEV algorithm | Co-evolve semantics and topology through textual gradients | kbEval health scoring generates diagnostic signals that drive KB updates, which change agent context, which changes agent behavior |
| Multi-Armed Bandit routing | Bandit-based forward routing decisions | Staggered scheduling: different agents for different platforms, time-based routing, platform-specific agent assignment — empirically tuned routing |
| Diagnostic gradient generation | LLM analyzes execution traces to identify improvements | kbEval scoring across 6 dimensions (completeness, accuracy, freshness, consistency, coverage, retrievability) provides structured diagnostic signals |
| Capability expansion | Agent prompts extended when diagnostics identify gaps | KB gap detection across 15 domains triggers article generation that enriches agent context, effectively expanding agent capabilities |
| Capability specialization | Unused capabilities pruned from agent prompts | Tiered namespace structure ensures agents receive only relevant KB context (Tier 1 = core product, Tier 2 = industry, Tier 3 = reference) |
| Semantic migration | Capabilities move to where they have most impact | Cross-domain KB articles serve agents across image-gen, video-gen, support, legal, accounting — knowledge routes to where it is needed |

### The Scheduler as a Bandit

Atlas UX's agent scheduler already implements MAB-like routing, though it was built from operational intuition rather than bandit theory:

**Platform-specific routing.** Different agents handle different social platforms based on historical performance. The assignment of Binky (CRO) to revenue-focused platforms and Petra (PM) to project management channels is an exploitation decision — these agents have demonstrated highest reward for these platform types.

**Time-based staggering.** Agents operate at different times to avoid flooding channels. This is an exploration mechanism — spreading agent actions across time windows tests whether timing affects engagement (reward) and prevents the system from converging on a single posting schedule that might be locally optimal but globally suboptimal.

**Fallback chains.** When a primary agent fails (LLM error, rate limit, content validation failure), the system routes to a fallback agent. This is the MAB exploration arm — fallback routing occasionally discovers that the fallback agent outperforms the primary for certain task types.

### Diagnostic Feedback Loop

The production system's diagnostic gradient generation maps precisely to HiVA's mechanism:

1. **Execution.** An agent performs a task (generates content, answers a query, processes a webhook).
2. **Evaluation.** The self-mending validation layer runs 5-check pre-delivery validation (source attribution, factual grounding, format compliance, media validation, zero image leakage).
3. **Diagnostic.** Failed validations produce specific diagnostic signals — "image URL returned 404" identifies a media sourcing failure, "no source attribution" identifies a provenance gap.
4. **Semantic update.** The KB healer processes these diagnostics, updating articles, re-embedding content, and relinking entities. These KB changes flow downstream to all agents that consume KB context, effectively updating agent "semantics" without touching agent code.
5. **Topological update.** KDRs (Key Decision Records) capture routing decisions and their outcomes, informing future routing choices. Decision memos for high-risk actions incorporate historical diagnostic data.

### Fixed Roles, Variable Capabilities

Atlas UX's agents have fixed role identities (Atlas is always the CEO, Binky is always the CRO) but variable capabilities that evolve as the KB grows. When 29 new LLM knowledge articles were added to the KB, every agent that retrieves LLM-related context gained new capabilities — better cost analysis, provider comparison, and prompt engineering knowledge — without any change to agent configuration. The KB is the capability surface, and it is continuously evolving.

This is precisely HiVA's "Variable" concept: the agent identity is stable, but the capability set adapts to the knowledge environment.

### HIL Constitution as Topology Constraint

HiVA's STEV algorithm optimizes topology without constraint — any routing change that improves reward is accepted. In production, this is dangerous. The HIL constitution constrains topology evolution by requiring human approval for structural changes above certain risk thresholds:

- **Auto-approved:** KB content updates, re-embedding, relinking (zero-cost, non-destructive)
- **Decision memo required:** Spending above AUTO_SPEND_LIMIT_USD, risk tier 2+ operations, recurring charges
- **Blocked by default:** Recurring purchases, schema migrations without human review

This constrained optimization prevents the self-organizing hierarchy from evolving into configurations that are locally optimal (high reward on metrics) but globally problematic (unsafe, expensive, or irreversible).

---

## Implications for Agent System Design

### 1. Workflow Topology Should Be Learned, Not Designed

HiVA demonstrates that agent routing structures can be discovered through optimization rather than prescribed by engineers. Production experience confirms this — the most effective routing decisions in Atlas UX were discovered through operational experience (empirical bandit-like exploration) rather than designed upfront.

### 2. Textual Gradients Enable Optimization Without Differentiability

The insight that natural language diagnostics can serve as gradient surrogates for discrete systems is broadly applicable. Any agent system that logs execution traces and failure diagnostics already has the raw material for textual gradient-based optimization. The missing piece is closing the loop — feeding diagnostics back into prompt updates and routing weight adjustments automatically.

### 3. Agent Identity and Agent Capability Are Separable

The "Variable" concept — that agents can have stable identities but evolving capabilities — resolves a design tension that plagues most agent frameworks. Engineers want stable, debuggable agent configurations. Task performance demands adaptive behavior. By locating adaptability in the knowledge layer (KB articles, skill files) rather than the agent configuration layer, both objectives are satisfied.

### 4. Hierarchy Emerges When You Optimize for Performance

You do not need to design a hierarchy — you need to optimize for task performance and let hierarchy emerge. Agents that handle diverse tasks become coordinators. Agents that excel at specific tasks become specialists. The organizational chart writes itself, and it is more effective than any human-designed hierarchy because it is shaped by actual task performance rather than organizational assumptions.

---

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Hierarchical_clustering_simple_diagram.svg/400px-Hierarchical_clustering_simple_diagram.svg.png — Hierarchical clustering dendrogram showing how agents self-organize into multi-level hierarchies through performance optimization
2. https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Social_Network_Analysis_Visualization.png/400px-Social_Network_Analysis_Visualization.png — Network topology visualization demonstrating community structure and hub-spoke patterns in agent routing graphs
3. https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Reinforcement_learning_diagram.svg/400px-Reinforcement_learning_diagram.svg.png — Reinforcement learning agent-environment interaction loop illustrating the Multi-Armed Bandit routing mechanism
4. https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Directed_acyclic_graph.svg/400px-Directed_acyclic_graph.svg.png — Directed acyclic graph structure representing the workflow topology that STEV evolves through semantic-topological co-optimization
5. https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Semantic_Net.svg/400px-Semantic_Net.svg.png — Semantic network showing typed relationships between agent capabilities and task requirements

## Videos

- [Multi-Agent Systems: The Future of AI — Two Minute Papers](https://www.youtube.com/watch?v=2xxziIWmaSA)
- [Building Production RAG Applications — LlamaIndex](https://www.youtube.com/watch?v=TRjq7t2Ms5I)

## References

1. Tang, J., Zhang, J., Lv, Q., Liu, S., Yang, J., Tang, C., & Wang, K. (2025). "HiVA: Self-organized Hierarchical Variable Agent via Goal-driven Semantic-Topological Evolution." arXiv:2509.00189. https://arxiv.org/abs/2509.00189

2. Auer, P., Cesa-Bianchi, N., & Fischer, P. (2002). "Finite-time Analysis of the Multiarmed Bandit Problem." Machine Learning, 47(2-3), 235-256. https://doi.org/10.1023/A:1013689704352

3. Yao, S., Zhao, J., Yu, D., et al. (2023). "ReAct: Synergizing Reasoning and Acting in Language Models." ICLR 2023. https://arxiv.org/abs/2210.03629

4. Hong, S., Zhuge, M., Chen, J., et al. (2024). "MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework." ICLR 2024. https://arxiv.org/abs/2308.00352

5. Wu, Q., Bansal, G., Zhang, J., et al. (2023). "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation." arXiv:2308.08155. https://arxiv.org/abs/2308.08155
