# Group-Evolving Agents: Open-Ended Self-Improvement via Experience Sharing

## Introduction

In February 2026, a team of researchers at UC Santa Cruz published a paper that reframed how we think about AI agent improvement. The conventional wisdom in agent evolution research had followed a tree-structured paradigm: create an agent, let it try different approaches, branch the successful ones, prune the failures, repeat. Each branch improves in isolation. This is how genetic algorithms work, how neural architecture search works, and how most evolutionary approaches to AI have operated since the field began.

Zhaotian Weng, Antonis Antoniades, Deepak Nathani, Zhen Zhang, Xiao Pu, and Xin Eric Wang proposed something different. Their paper, "Group-Evolving Agents: Open-Ended Self-Improvement via Experience Sharing" (arXiv:2602.04837), treats a group of agents as the evolutionary unit rather than any single agent. Agents share experience and reuse knowledge across the group. The result: a 71.0% solve rate on SWE-bench Verified compared to 56.7% for tree-structured baselines, an 88.3% solve rate on Polyglot benchmarks compared to 68.3%, and framework bug fixes converging in 1.4 iterations instead of 5.

The core insight is deceptively simple but profoundly important: exploratory diversity is only valuable if it feeds back into the group. An agent that discovers a novel debugging technique in isolation has improved itself. An agent that shares that technique with every other agent in the group has improved the system. The difference between these two outcomes is the difference between tree-structured evolution and group evolution.

## The Problem with Tree-Structured Agent Evolution

To understand why group evolution matters, you need to understand what it replaced.

Tree-structured evolution treats each agent as an independent lineage. Starting from a base agent, you create variants — perhaps one tries a different prompting strategy, another uses different tools, a third structures its reasoning differently. You evaluate each variant, keep the ones that perform well, and branch again from the survivors. Over time, the tree grows, with the best-performing branches surviving and the worst being pruned.

This approach has an obvious appeal: it maps directly onto biological evolution and genetic algorithms, both of which have extensive theoretical and empirical backing. But it suffers from three structural problems when applied to language model agents:

**Knowledge is trapped in branches.** When Agent A on Branch 3 discovers that a particular debugging strategy works well for Python type errors, that knowledge stays in Branch 3. Agent B on Branch 7, facing an identical type error, has to rediscover the same strategy from scratch — or never find it at all. Every branch is an island.

**Diversity collapses over time.** Because only high-performing branches survive pruning, the population converges toward a narrow set of strategies. This is the classic exploitation-exploration tradeoff from reinforcement learning, and tree-structured evolution tilts heavily toward exploitation. Early exploration produces diverse approaches, but the pruning mechanism systematically destroys that diversity.

**Iteration cost scales linearly with the number of branches.** Each branch must independently encounter, diagnose, and solve problems. If ten branches each need to learn how to handle a specific edge case, that edge case must be encountered and solved ten separate times. There is no mechanism to amortize learning across the population.

The UC Santa Cruz team's insight was that these problems share a common root: tree-structured evolution has no mechanism for lateral knowledge transfer. Branches can only improve vertically (parent to child) but never horizontally (sibling to sibling).

## The Group Evolution Architecture

Group-Evolving Agents replace the tree structure with a shared experience layer. The architecture has four components:

### Shared Experience Pool

Every agent in the group writes to and reads from a shared experience pool. When an agent solves a problem, it does not merely update its own parameters or prompt — it extracts the generalizable lessons from that experience and deposits them in the pool. When an agent encounters a new problem, it queries the pool for relevant prior experience before attempting a solution.

The experience pool is not a simple log of past actions. Experiences are structured with metadata: the type of problem encountered, the strategy that worked (or failed), the context that made the strategy applicable, and the confidence level of the outcome. This structure enables semantic retrieval — an agent facing a Python import error can find experiences about dependency resolution even if the specific packages differ.

### Experience Extraction

Raw agent trajectories are noisy. An agent that debugs a failing test might take twenty steps, of which only three contain genuine insight. The experience extraction mechanism distills trajectories into reusable knowledge units. The paper describes this as converting "episodic memory" (what happened) into "semantic memory" (what it means).

This extraction process is itself performed by a language model, which analyzes the full trajectory and produces a structured summary: what the problem was, what approaches were tried, which approach succeeded and why, and what generalizable principle can be derived. The extracted experience is then indexed in the shared pool.

### Group-Level Selection

Instead of pruning individual agents, group evolution applies selection pressure at the group level. The question is not "which agent is best?" but "which group configuration produces the best collective performance?" This subtle shift changes what gets optimized: instead of converging on a single best strategy, the system optimizes for complementary diversity.

A group where one agent excels at debugging, another at architecture, and a third at testing may outperform a group of three agents that are all good at debugging. Tree-structured evolution would likely converge on the debugging specialist because it performs best on individual benchmarks. Group evolution preserves the specialist diversity because it evaluates collective outcomes.

### Cross-Pollination Mechanism

The final component is the mechanism by which shared experience actually modifies agent behavior. When an agent retrieves relevant experience from the pool, it integrates that experience into its reasoning context. This is not parameter fine-tuning — it is in-context learning, where the agent's prompt is dynamically enriched with relevant prior experience from the entire group.

The cross-pollination is bidirectional: agents contribute experience when they succeed (and when they fail instructively), and they consume experience when they face new challenges. The pool grows richer over time, and each agent benefits from the accumulated wisdom of every other agent in the group.

## Benchmark Results and Analysis

The paper's results are striking not just in their magnitude but in what they reveal about the dynamics of group learning.

### SWE-bench Verified

SWE-bench is a benchmark for software engineering agents, consisting of real GitHub issues that must be resolved by modifying real codebases. It is among the most challenging agent benchmarks because it requires understanding large codebases, diagnosing subtle bugs, and producing correct patches.

Group-Evolving Agents achieved a 71.0% solve rate, compared to 56.7% for the tree-structured baseline. This 14.3 percentage point improvement is substantial in absolute terms and represents a 25% relative improvement. More telling than the final number is the trajectory: tree-structured agents plateau early as diversity collapses, while group-evolving agents continue improving as the shared experience pool grows richer.

### Polyglot Benchmark

The Polyglot benchmark tests agents across multiple programming languages and problem types. Group-Evolving Agents scored 88.3% versus 68.3% for the baseline — a 20 percentage point gap that is even wider than SWE-bench.

This result is particularly interesting because it suggests that cross-domain experience transfer is a major source of the improvement. An agent that solves a memory management problem in C++ deposits experience that is useful when another agent encounters a resource leak in Rust. The shared experience pool enables this kind of cross-language insight transfer that would never occur in isolated branches.

### Framework Bug Convergence

Perhaps the most practically significant result is the framework bug fix convergence rate: 1.4 iterations versus 5 for the baseline. This means group-evolving agents fix framework-level bugs in roughly one-quarter of the time required by tree-structured agents.

Framework bugs are notoriously difficult because they often require understanding interactions between components, tracing execution paths across module boundaries, and recognizing patterns that span multiple files. The shared experience pool gives agents access to prior debugging trajectories that cover these cross-cutting concerns, dramatically reducing the search space for each new bug.

## Why Group Evolution Beats Individual Evolution

The paper draws an explicit analogy to cultural evolution in human societies. Individual biological evolution is slow — it requires generations of selection and cannot transfer acquired traits from parent to offspring. Cultural evolution, by contrast, is fast — knowledge is shared horizontally through language, writing, and institutions, allowing innovations to spread across the entire population within a single generation.

Tree-structured agent evolution is analogous to biological evolution: knowledge is transmitted vertically (from parent branch to child branch) but never horizontally. Group evolution is analogous to cultural evolution: knowledge is shared laterally through the experience pool, allowing any agent's discovery to benefit every other agent immediately.

The key mathematical insight from the paper is about how diversity contributes to progress. In tree-structured evolution, diversity is transient — it exists early in the process but is systematically eliminated by pruning. The exploration that produces diversity and the selection that produces progress are in tension. In group evolution, diversity is preserved and converted into progress through experience sharing. Agents can explore different strategies without fear of being pruned, because even failed explorations produce experience that benefits the group.

This reframes the exploration-exploitation tradeoff entirely. In group evolution, exploration is not a cost to be minimized — it is an investment that compounds. Every agent that tries an unusual approach and fails is contributing to the group's understanding of what does not work, which narrows the search space for every other agent. Every agent that discovers a novel technique is contributing a tool that every other agent can use. The shared experience pool converts exploration from a gamble into a portfolio strategy.

## Production Validation: Atlas UX as a Living Implementation

The Atlas UX platform, built months before the UC Santa Cruz paper was published, independently converged on the same architectural principles — and has been running them in production since late 2025.

### Shared Experience Is the Knowledge Base

Atlas UX operates 33 agents that share a single knowledge base containing over 520 documents. This is not a metaphorical parallel to the paper's shared experience pool — it is a literal implementation of the same concept. When any agent contributes to the KB, every other agent can retrieve and use that knowledge. The KB is the shared experience layer.

The paper describes agents depositing structured experience into a pool after each task. Atlas UX does the same: when Reynolds writes a blog article about video generation pricing, that article enters the KB. When Donna researches Reddit trends in the HVAC market, her findings enter the KB. When Kelly analyzes X engagement patterns for trade businesses, those patterns enter the KB. Every deposit benefits all 33 agents simultaneously.

### Exploratory Diversity Is Structural

The paper argues that group evolution preserves and rewards exploratory diversity rather than eliminating it through pruning. Atlas UX encodes this principle directly into its agent architecture:

- **Kelly** explores X/Twitter for engagement patterns and audience behavior
- **Donna** explores Reddit for community sentiment and market signals
- **Reynolds** explores long-form blog content and SEO strategy
- **Victor** handles video generation and visual content
- **Petra** manages project coordination and resource allocation

Each agent explores a different domain. In a tree-structured system, you would evaluate each agent independently and prune the underperformers. In Atlas UX's group architecture, every agent's exploration feeds the shared KB, making every other agent more capable. Donna's Reddit research helps Reynolds write better blog posts. Kelly's Twitter analysis helps Donna understand which Reddit topics resonate with trade business owners. The exploration compounds.

### Self-Healing as Sustained Progress

The paper's core claim is that group evolution converts exploratory diversity into sustained long-term progress rather than the plateauing observed in tree-structured systems. Atlas UX's self-healing KB mechanism is a direct implementation of this principle.

The KB runs automated health evaluations, scores document quality, and triggers heal operations on degraded content. When a heal operation improves an article — fixing outdated statistics, adding missing context, resolving broken references — that improvement is immediately available to all 33 agents. The shared experience layer does not just accumulate knowledge; it actively improves its own quality over time.

In the paper's framework, this is the group-level selection mechanism: instead of pruning agents, the system prunes and heals knowledge. Low-quality experience is refined rather than discarded. The evolutionary pressure operates on the experience pool itself, not on the agents that consume it.

### Hierarchical Group Coordination

The paper describes group-level selection that evaluates collective performance rather than individual agent performance. Atlas UX implements this through its agent hierarchy:

- **Atlas** (CEO) coordinates high-level strategy and resource allocation
- **Binky** (CRO) drives revenue-focused initiatives and prioritization
- **Petra** manages project execution and cross-agent coordination

This hierarchy ensures that agents are not operating as isolated branches optimizing for their individual metrics. The group is coordinated toward collective outcomes — exactly the group-level selection that the paper advocates.

### Timeline Matters

The UC Santa Cruz paper was published on February 4, 2026. Atlas UX's shared KB architecture, multi-agent group coordination, and self-healing knowledge pipeline were in production before that date. This is not a case of implementing a paper's recommendations — it is independent convergence on the same principles from different starting points.

The research team arrived at group evolution through rigorous ablation studies on benchmarks. Atlas UX arrived at the same architecture through the pragmatic demands of running 33 agents in production: agents that learn in isolation waste work, shared knowledge compounds, and self-improving experience layers outperform static ones. Theory and practice converged.

## Implications for Multi-Agent System Design

The Group-Evolving Agents paper has several implications for anyone building multi-agent systems:

**Stop evaluating agents individually.** The paper's results show that a group of individually mediocre agents with good experience sharing can outperform a group of individually strong agents without it. System-level evaluation — measuring collective outcomes rather than individual performance — is the correct frame.

**Build the experience layer first.** The shared experience pool is not an optimization to add later. It is the architectural foundation that makes group evolution possible. Without it, you are building tree-structured evolution no matter how many agents you deploy.

**Preserve diversity deliberately.** The instinct to converge on the best-performing strategy and replicate it across all agents is wrong. Diversity of exploration is a resource, not a cost. Design your agent assignments to maximize the breadth of experience being deposited into the shared pool.

**Make experience extraction automatic.** The paper's results depend on converting raw trajectories into structured, reusable knowledge. If experience sharing requires manual curation, it will not scale. Automated extraction — whether through LLM-based summarization, entity extraction, or structured logging — is essential.

**Iterate on the experience layer, not just the agents.** The quality of the shared experience pool determines the ceiling of group performance. Self-healing, quality scoring, and automated refinement of the experience layer are as important as improving the agents themselves.

## Media

![Multi-agent collaboration diagram showing shared experience pool architecture](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800)

![Network graph visualization representing knowledge sharing between nodes](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800)

![Abstract visualization of evolutionary branching and convergence patterns](https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800)

![Team of robotic agents working together in coordinated formation](https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800)

![Data center infrastructure supporting distributed AI agent workloads](https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800)

## Videos

- [Multi-Agent AI Systems: How Agents Learn Together](https://www.youtube.com/watch?v=sal78ACtGTc) — Primer on group learning dynamics in multi-agent architectures and why shared experience outperforms isolated optimization
- [The Future of AI Agent Evolution and Self-Improvement](https://www.youtube.com/watch?v=zjkBMFhNj_g) — Deep dive into how agent systems improve themselves over time through evolutionary and experience-sharing mechanisms

## References

- Weng, Z., Antoniades, A., Nathani, D., Zhang, Z., Pu, X., & Wang, X.E. (2026). Group-Evolving Agents: Open-Ended Self-Improvement via Experience Sharing. arXiv:2602.04837. https://arxiv.org/abs/2602.04837
- SWE-bench: Resolving Real-World GitHub Issues. Princeton NLP. https://www.swebench.com/
- Wang, X.E. Research Group — UC Santa Cruz Natural Language Processing. https://xwang.dev/
- OpenAI. (2025). Practices for Governing Agentic AI Systems. https://cdn.openai.com/papers/practices-for-governing-agentic-ai-systems.pdf
- Significant Gravitas. AutoGPT — The Open-Source AI Agent Framework. https://github.com/Significant-Gravitas/AutoGPT
