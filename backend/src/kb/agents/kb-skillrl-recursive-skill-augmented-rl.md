# SkillRL: Evolving Agents via Recursive Skill-Augmented Reinforcement Learning

## Introduction

In February 2026, researchers from UNC Chapel Hill — the same lab behind MetaClaw (Huaxiu Yao's group) — published "SkillRL: Skill-Augmented Reinforcement Learning for LLM-Based Agents," introducing a framework that fundamentally rethinks how agents acquire capabilities. Rather than treating tool use and reasoning as static patterns learned during training, SkillRL treats them as discoverable, composable skills that evolve alongside the agent's policy through recursive reinforcement learning. A 7B parameter model trained with SkillRL outperformed GPT-4o by 41% on complex agentic benchmarks while consuming roughly 20% fewer training tokens than comparable RL approaches — a result that challenges the assumption that agentic competence requires massive scale.

The paper's core insight is deceptively simple: if you let an agent discover its own skill abstractions from experience and then train the policy to use those skills effectively, the skills and the policy co-evolve in a recursive loop where each improvement in one drives improvement in the other. This is not prompt engineering, not fine-tuning on curated datasets, and not tool registration. It is automatic skill discovery from raw experience, hierarchical skill organization, adaptive retrieval at inference time, and recursive co-evolution of the entire system.

This article examines SkillRL's architecture, evaluates its empirical results, and maps its concepts to production agent systems where similar dynamics have emerged through engineering necessity rather than formal research.

---

## The Problem with Static Agent Capabilities

LLM agents deployed in production environments face a capability ceiling that no amount of prompt engineering can break. The ceiling has three structural causes:

### Flat Tool Spaces

Most agent frameworks present tools as a flat list: search the web, read a file, call an API, send a message. The agent must select the right tool for each step from this unstructured menu. As the number of available tools grows, selection accuracy degrades. There is no hierarchy, no composition, and no mechanism for the agent to recognize that a complex task is a sequence of simpler tasks it already knows how to perform.

### Training-Deployment Mismatch

Agents are typically trained (or prompt-engineered) on a fixed set of capabilities, then deployed into environments where task distributions shift continuously. A customer support agent trained on billing questions encounters product returns. A scheduling agent trained on single-appointment booking encounters multi-step workflows requiring rescheduling, notifications, and follow-ups. The gap between what was trained and what is needed widens over time.

### No Learning from Success

When an agent successfully completes a novel task through creative tool composition, that success is lost. The next time a similar task appears, the agent must rediscover the solution from scratch. There is no mechanism to extract the successful strategy, generalize it, and store it for future reuse. Every success is an orphan.

SkillRL addresses all three problems simultaneously through a unified framework of skill discovery, organization, and recursive policy improvement.

---

## SkillRL Architecture

### Automatic Skill Discovery

SkillRL's first contribution is a mechanism for extracting reusable skills from agent experience without human annotation. After each episode (successful or failed), a skill extractor analyzes the trajectory and identifies sub-sequences that represent coherent, reusable behavioral patterns.

The extraction process operates through three filters:

1. **Coherence filtering** — Sub-sequences must represent a logically complete action unit. "Search for X, parse results, extract relevant fields" is coherent. "Search for X, unrelated tangent, resume extraction" is not.

2. **Reusability scoring** — Extracted patterns are scored by their potential for reuse across different tasks. Highly task-specific sequences (e.g., "look up this specific customer's order #12345") score low. General patterns (e.g., "validate input format, query database, format response for user") score high.

3. **Novelty detection** — Before adding a discovered skill to the SkillBank, the system checks whether an equivalent skill already exists. Semantic similarity comparison prevents the skill library from bloating with redundant entries.

### Hierarchical SkillBank

Discovered skills are organized in a hierarchical SkillBank — not a flat list but a tree structure where complex skills compose simpler ones. The hierarchy emerges automatically from the composition relationships observed in successful trajectories.

A three-level hierarchy might look like:

- **Level 0 (Primitives):** Individual tool calls — API requests, database queries, text formatting
- **Level 1 (Tactics):** Short sequences combining 2-4 primitives — "search and summarize," "validate and store," "retrieve and compare"
- **Level 2 (Strategies):** Multi-step workflows combining tactics — "research a topic, synthesize findings, draft a report, validate against sources"

The SkillBank maintains metadata for each skill: success rate, frequency of use, average reward when applied, compatible task types, and composition relationships with other skills. This metadata drives the adaptive retrieval system.

### Adaptive Skill Retrieval

At inference time, when the agent encounters a new task, the SkillBank retrieval system selects relevant skills to inject into the agent's context. Retrieval is not simple embedding similarity — it uses a multi-signal approach:

- **Semantic similarity** between the current task description and skill descriptions
- **Historical success rate** of each candidate skill on similar tasks
- **Composition compatibility** — preferring skills that form coherent sequences with already-selected skills
- **Recency weighting** — more recently discovered or updated skills receive a slight boost, reflecting the assumption that newer skills better match current task distributions

The retrieved skills are formatted as structured instructions and prepended to the agent's context, functioning as dynamic few-shot examples that evolve with the system.

### Recursive Co-Evolution

The most powerful aspect of SkillRL is the recursive feedback loop between skills and policy:

1. The policy generates trajectories
2. Trajectories yield new skills (via extraction) and rewards (via environment feedback)
3. New skills modify future trajectories (via retrieval-augmented generation)
4. Modified trajectories produce updated rewards
5. Updated rewards drive policy optimization (via RL)
6. The improved policy generates better trajectories — return to step 1

This is not a one-time pipeline but an ongoing loop. The key theoretical insight: the convergence properties of this loop are provably better than either skill learning or policy optimization alone, because each round of skill improvement changes the effective MDP that the policy operates in, creating a curriculum effect where the agent faces progressively refined action spaces.

---

## Empirical Results

SkillRL's results are striking, particularly given the small model size:

### Scale-Defying Performance

A 7B parameter model (Qwen2.5-7B) trained with SkillRL achieved:

- **+41% over GPT-4o** on the WebArena benchmark for web-based agent tasks
- **+33% improvement** over the same base model without SkillRL on ALFWorld household tasks
- **~20% fewer training tokens** compared to standard GRPO training to reach equivalent performance

The 41% improvement over GPT-4o is particularly notable because GPT-4o has roughly 200x more parameters. SkillRL demonstrates that structured experience reuse can substitute for raw model scale — a finding with significant implications for production deployments where inference cost matters.

### Skill Library Growth Dynamics

The paper tracks skill library size over training and finds a characteristic pattern: rapid initial growth as the agent discovers fundamental skills, followed by a plateau where new skills are increasingly refinements or compositions of existing ones. The library self-prunes through the novelty detection filter, maintaining a compact but expressive skill repertoire.

### Ablation Studies

Removing any component of SkillRL degrades performance:

- Without hierarchical organization: -12% (flat skill lists lose composition benefits)
- Without adaptive retrieval: -18% (random skill injection adds noise)
- Without recursive co-evolution: -23% (one-shot skill extraction cannot adapt to policy changes)

The co-evolution loop contributes the largest marginal improvement, confirming the theoretical prediction that the interaction between skill and policy improvement is more valuable than either alone.

---

## Production Validation: Atlas UX Implementation

Atlas UX's production agent system — 33 named agents, a 509-document knowledge base, and a self-healing pipeline — has independently evolved structures that map directly to SkillRL's theoretical framework. This section documents the convergence.

### KB Articles as Discoverable Skills

In SkillRL, skills are behavioral instructions extracted from experience. In Atlas UX, KB articles function identically. Each article encodes a reusable capability — how to handle a booking conflict, how to respond to a cancellation, how to escalate a billing dispute. The three-tier KB namespace (Tier 1: core product, Tier 2: industry context, Tier 3: general reference) mirrors SkillRL's hierarchical SkillBank, with Tier 1 articles serving as refined "strategies" and Tier 3 articles as broad "primitives."

The KB currently holds 509 documents across 15 domains. Like SkillRL's skill library, it grew rapidly in its initial phase (the first 200 articles covered fundamental capabilities) and has since transitioned to refinement and gap-filling. The kbHealer system prunes redundant articles and consolidates overlapping content — functionally identical to SkillRL's novelty detection filter.

### kbHealer as Skill Evolution

SkillRL's skill extractor analyzes agent trajectories to discover new skills. Atlas UX's kbHealer analyzes agent performance metrics (kbEval health scores) to identify capability gaps and either generate new articles or refine existing ones. The mechanism is different — health scoring versus trajectory analysis — but the outcome is identical: automatic expansion and refinement of the agent's reusable knowledge base without human intervention.

The auto-heal pipeline has processed 145 articles to date, with a measured health score improvement from initial ingestion scores averaging 72 to a current average of 89. This mirrors SkillRL's reported skill quality improvement over training rounds.

### Tier-Weighted Retrieval as Adaptive Retrieval

SkillRL's adaptive retrieval uses multiple signals (similarity, success rate, composition, recency) to select skills. Atlas UX's tier-weighted retrieval uses namespace weighting, semantic similarity (Pinecone vectors), and graph-based relationships (Neo4j entity connections) to select relevant KB articles for agent context injection.

The entity-content hybrid topology — where both entities (customers, services, agents) and content (articles, procedures, policies) exist as nodes in the same graph — enables the same composition-aware retrieval that SkillRL achieves through its compatibility scoring. When an agent retrieves an article about appointment booking, the graph topology also surfaces related articles about SMS confirmation and Slack notification, creating coherent multi-step skill sequences.

### KDR Memory as Trajectory-Derived Knowledge

Key Decision Records (KDRs) in Atlas UX capture the outcomes of significant decisions and multi-step workflows. Like SkillRL's trajectory-derived skills, KDRs are extracted from real operational experience and stored for future reference. The KDR system at `memory/kdrs/` functions as a slow-updating procedural memory that complements the fast-updating KB.

### The Missing Piece: Formal Co-Evolution

The one component Atlas UX lacks compared to SkillRL is formal recursive co-evolution where KB improvements directly drive policy updates through reinforcement learning. Currently, KB improvements (via kbHealer) and agent behavior (via prompt engineering and SGL policies) evolve on separate tracks. Implementing a feedback loop where measured improvements in KB quality drive automatic prompt or policy adjustments would close this gap.

---

## Implications for Agent System Design

### Small Models, Big Capabilities

SkillRL's demonstration that a 7B model can outperform GPT-4o has direct cost implications. If skill-augmented agents can achieve superior performance at a fraction of the inference cost, production systems should invest in skill infrastructure rather than larger models. The marginal return on better skill organization exceeds the marginal return on more parameters.

### Skill Libraries as Competitive Moats

SkillRL suggests that the value of an agent system lies not in its base model (which anyone can access) but in its accumulated skill library (which reflects unique operational experience). A company's skill library — its accumulated KB of validated procedures, decision patterns, and failure lessons — is proprietary intellectual property that grows more valuable over time.

### Automatic Curriculum Design

The recursive co-evolution loop in SkillRL creates an implicit curriculum: as skills improve, the agent faces an effectively simpler action space, which accelerates policy learning, which enables discovery of more sophisticated skills. This self-bootstrapping property means that the initial investment in skill infrastructure pays compound returns.

---

## Research Directions

1. **Cross-domain skill transfer** — Can skills discovered in one domain (e.g., customer support) transfer to structurally similar tasks in another domain (e.g., appointment scheduling)? Production KB systems with multiple tenant types are natural testbeds.

2. **Skill versioning and deprecation** — As task distributions shift, previously useful skills become stale. What policies govern skill lifecycle management? Atlas UX's kbHealer offers one model; SkillRL's novelty detection offers another.

3. **Multi-agent skill sharing** — In systems with multiple specialized agents, can one agent's discovered skills benefit other agents? The 33-agent Atlas UX system with shared KB is a natural experiment in this direction.

4. **Formal skill ontology emergence** — As skill libraries grow, do they converge on domain ontologies that match human-designed taxonomies? If so, skill discovery could automate knowledge engineering.

---

## Media

1. https://arxiv.org/html/2602.08234v1/x1.png — SkillRL framework overview showing the recursive loop between skill discovery, SkillBank organization, adaptive retrieval, and policy optimization
2. https://arxiv.org/html/2602.08234v1/x2.png — Hierarchical SkillBank structure with three-level skill organization from primitives to strategies
3. https://arxiv.org/html/2602.08234v1/x3.png — Performance comparison showing 7B model with SkillRL outperforming GPT-4o across agentic benchmarks
4. https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Social_Network_Analysis_Visualization.png/400px-Social_Network_Analysis_Visualization.png — Knowledge graph visualization representing hierarchical skill organization in production systems
5. https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/800px-A_small_cup_of_coffee.JPG — Recursive feedback loops: like a fractal, each layer of improvement enables the next layer

## Videos

- [Reinforcement Learning for LLM Agents — Berkeley AI Research](https://www.youtube.com/watch?v=kopoLzvh5jY)
- [Building AI Agents with Tool Use — Anthropic](https://www.youtube.com/watch?v=vUFBMpcztZc)

## References

1. SkillRL authors (2026). "SkillRL: Skill-Augmented Reinforcement Learning for LLM-Based Agents." arXiv:2602.08234. https://arxiv.org/abs/2602.08234

2. Chen, J., Yang, X., Tu, H., et al. (2026). "Just Talk — An Agent That Meta-Learns and Evolves in the Wild." arXiv:2603.17187. https://arxiv.org/abs/2603.17187

3. Wang, G., Xie, Y., Jiang, Y., et al. (2023). "Voyager: An Open-Ended Embodied Agent with Large Language Models." arXiv:2305.16291. https://arxiv.org/abs/2305.16291

4. Shao, Z., Wang, P., Zhu, Q., et al. (2024). "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models." arXiv:2402.03300. https://arxiv.org/abs/2402.03300

5. GitHub repository for SkillRL. https://github.com/aiming-lab/SkillRL
