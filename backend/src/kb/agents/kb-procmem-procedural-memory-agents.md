# ProcMEM: Learning Reusable Procedural Memory from Experience via Non-Parametric PPO for LLM Agents

## Introduction

In 2026, "ProcMEM: Learning Reusable Procedural Memory from Experience via Non-Parametric PPO for LLM Agents" introduced a framework that solves one of the most persistent problems in deployed agent systems: how to convert raw experience into step-by-step procedures that can be reused, shared, and composed — without updating model weights. The key innovation is non-parametric learning through Proximal Policy Optimization (PPO): the agent distills successful trajectories into structured procedural instructions that are stored externally and retrieved at inference time, achieving the benefits of experience-based learning without the catastrophic forgetting, compute costs, and opacity of fine-tuning.

ProcMEM sits at the intersection of several related 2026 research efforts: LEGOMem (modular procedural memory with compositional retrieval), MemSkill (evolving memory-based skill libraries), and Mem^p (script-like procedural abstractions from demonstrations). What distinguishes ProcMEM is its integration with PPO — a well-understood RL algorithm — to govern which trajectories are worth distilling, how to prioritize among competing procedures, and when to update or deprecate existing procedures. The result is a principled, scalable approach to procedural knowledge management that goes beyond simple trajectory caching.

This article examines ProcMEM's architecture, compares it to related procedural memory systems, and maps its concepts to production implementations where procedural memory has emerged as a critical system component.

---

## The Procedural Memory Gap

### Declarative vs. Procedural Knowledge

AI systems have traditionally focused on declarative knowledge — facts, relationships, and assertions that can be stated and queried. RAG systems retrieve declarative knowledge: "The return policy allows 30-day returns with receipt." Knowledge graphs encode declarative knowledge: "Customer X purchased Product Y on Date Z."

But agent systems require procedural knowledge — sequences of actions that achieve goals. "How to process a return" is not a fact to be retrieved but a procedure to be executed:

1. Verify the customer's identity
2. Look up the original purchase
3. Check if the return window has elapsed
4. Inspect the return reason
5. If eligible, generate a return label
6. Process the refund to the original payment method
7. Send confirmation to the customer

This procedural knowledge is fundamentally different from declarative knowledge in structure (ordered steps vs. unordered facts), in evaluation (success/failure of the complete procedure vs. truth/falsity of individual statements), and in evolution (procedures change when processes change, facts change when the world changes).

### Why Current Approaches Fail

**Fine-tuning** embeds procedural knowledge in model weights, making it impossible to inspect, update selectively, or share across models. When the return process changes, the entire model must be retrained.

**Few-shot prompting** provides procedural examples in the context window, but the examples are static — manually curated and updated, not learned from experience. The procedures an agent actually uses successfully may differ significantly from the procedures a human designer imagined.

**Trajectory caching** stores complete interaction histories for retrieval, but raw trajectories are verbose, contain irrelevant details, and do not generalize across contexts. A successful return processing trajectory includes specific customer names, order numbers, and timestamps that are irrelevant to future return processing.

ProcMEM addresses all three limitations by distilling trajectories into abstract procedures, storing them non-parametrically, and governing their lifecycle through PPO-informed selection.

---

## ProcMEM Architecture

### Trajectory Distillation

After each successful episode, ProcMEM distills the trajectory into a procedural instruction — a structured, abstract description of the steps taken, stripped of instance-specific details:

**Raw trajectory:** "Searched for customer John Smith, found order #45678 from January 15, verified 30-day return window (today is February 10), generated return label RET-2026-789, processed $45.99 refund to Visa ending 4532, sent confirmation email to john.smith@email.com."

**Distilled procedure:** "1. Search for customer by name or identifier. 2. Retrieve the relevant order record. 3. Verify the return is within the eligible window by comparing order date to current date. 4. Generate a return shipping label. 5. Process refund to the original payment method. 6. Send confirmation to the customer's contact email."

The distillation uses the agent's own LLM capabilities — the same model that executed the trajectory generates the abstract procedure, ensuring that the abstraction level matches the model's operational vocabulary.

### Non-Parametric Storage

Distilled procedures are stored externally — not in model weights but in a structured procedure library. Each procedure entry contains:

- **Procedure ID:** Unique identifier
- **Task type:** Classification of the task the procedure addresses
- **Steps:** Ordered list of abstract action descriptions
- **Preconditions:** Required state before the procedure can execute
- **Postconditions:** Expected state after successful execution
- **Success count:** Number of times this procedure has led to successful outcomes
- **Failure count:** Number of times execution following this procedure has failed
- **PPO value estimate:** Expected return when following this procedure

The non-parametric nature of this storage means procedures can be inspected by humans, updated individually without affecting other procedures, shared across agent instances, and versioned for rollback.

### PPO-Informed Selection

When the agent encounters a new task, multiple procedures may be relevant. ProcMEM uses PPO's value function to rank candidate procedures by expected return:

1. **Retrieve candidates:** Find procedures whose task type and preconditions match the current situation (embedding-based similarity + precondition matching)
2. **Estimate values:** The PPO value function estimates the expected return from following each candidate procedure in the current context
3. **Select:** Choose the procedure with the highest estimated value, with epsilon-greedy exploration to occasionally try lower-ranked procedures

The PPO value estimates are updated after each episode: if following a procedure led to success, its value estimate increases; if it led to failure, the estimate decreases. This creates an adaptive selection mechanism that responds to changing task distributions without retraining the base model.

### Procedure Evolution

Procedures are not static once distilled. ProcMEM implements four evolution operations:

**Refinement:** When a procedure is followed but the agent deviates at certain steps (and the deviation leads to success), the procedure is updated to incorporate the deviation. Procedures gradually improve through accumulated successful deviations.

**Merging:** When two procedures for similar tasks have high overlap, they are merged into a single, more general procedure. The merged procedure incorporates the best steps from both originals.

**Specialization:** When a general procedure fails in specific contexts, specialized variants are created with additional preconditions that restrict applicability. The general procedure remains available for non-specialized contexts.

**Deprecation:** Procedures whose success rates fall below a threshold, or that are consistently outperformed by newer procedures, are deprecated. Deprecated procedures are retained in an archive but are no longer retrieved for active use.

---

## Related Procedural Memory Systems

### LEGOMem: Modular Procedural Memory

LEGOMem (2026) takes a different approach to procedural knowledge: rather than distilling complete procedures, it extracts modular sub-procedures that can be composed like LEGO blocks. Each module represents a single coherent step (e.g., "authenticate with the API," "parse the response," "handle the error case"), and the system composes modules at runtime to construct task-specific procedures.

The advantage: higher reuse. A module like "authenticate with the API" appears in many procedures and needs to be learned only once. The disadvantage: composition adds latency and can produce incoherent step sequences when modules from different contexts are combined.

### MemSkill: Evolving Memory Skills

MemSkill (2026) focuses on the evolution aspect: skills in the memory library compete for "survival" based on utility, with high-utility skills being refined and low-utility skills being pruned. MemSkill's selection mechanism is more explicitly evolutionary than ProcMEM's PPO-based approach, using tournament selection and crossover operations inspired by genetic algorithms.

### Mem^p: Script-Like Abstractions

Mem^p (2026) draws on script theory from cognitive science (Schank and Abelson, 1977), treating procedural knowledge as scripts with roles, props, scenes, and entry/exit conditions. Scripts are more structured than ProcMEM's procedures but less flexible — they require adherence to a fixed schema that may not accommodate novel task structures.

ProcMEM's contribution relative to these systems is the integration of PPO for principled procedure selection and evolution, providing a theoretically grounded mechanism for balancing exploration (trying new procedures) and exploitation (using proven procedures).

---

## Production Validation: Atlas UX Implementation

Atlas UX's production system implements procedural memory through three complementary mechanisms that collectively cover ProcMEM's functionality.

### KDRs as Procedural Memory

Key Decision Records (KDRs) at `memory/kdrs/` are the most direct analog to ProcMEM's distilled procedures. Each KDR captures a completed decision or workflow:

- **Context:** What state the system was in when the decision was made
- **Decision:** What action was taken and why
- **Outcome:** What happened as a result
- **Lessons:** What to do differently next time (or what to repeat)

KDRs are written at natural breakpoints — exactly when procedural distillation should occur. The chronological sequence of KDRs forms a procedural memory that new sessions can consult when facing similar decisions.

The current KDR library includes 25+ records covering topics from key rotation to KB megabuilds to infrastructure migration. Each KDR is a distilled procedure for a specific operational scenario, complete with preconditions (what triggered the decision), steps (what was done), and postconditions (what the outcome was).

### SKILL.md Files as Agent Procedures

Each of Atlas UX's 33 named agents operates with implicit procedural knowledge encoded in their role definitions and SGL policies. The EXECUTION_CONSTITUTION.md at `policies/` defines the meta-procedures that govern all agent behavior: decision escalation procedures, approval workflows, safety constraint checking sequences.

These procedural documents function exactly like ProcMEM's non-parametric procedure library — they are inspectable by humans, updatable without model changes, and sharable across agents. When an agent's procedure needs updating (e.g., a new approval threshold for spend decisions), the document is edited and all agents immediately operate with the updated procedure.

### Obsidian Vault as Persistent Procedural Store

The Obsidian vault at `projects/atlasux/` serves as long-term procedural memory with 49,000+ wikilinks creating a densely connected knowledge graph. Procedural knowledge in the vault is linked through contextual relationships — a procedure for handling customer escalations links to procedures for refund processing, appointment rescheduling, and manager notification.

This linked structure enables the same compositional retrieval that LEGOMem achieves with modular sub-procedures. When an agent encounters a customer escalation, the vault's link structure surfaces not just the escalation procedure but all connected sub-procedures that may be needed during execution.

### The KB as Evolved Procedural Knowledge

The 509-document KB itself contains significant procedural content — articles that describe how to perform specific tasks, not just facts about the domain. KB articles about webhook configuration, API integration, voice agent setup, and appointment booking are procedural in nature, encoding step-by-step instructions that agents follow during execution.

The kbHealer system's 145 auto-heal events represent procedural refinements — instances where a procedure was found to be incomplete, incorrect, or outdated and was automatically repaired. This is ProcMEM's refinement operation implemented at scale.

### PPO Selection and Tier-Weighted Retrieval

ProcMEM uses PPO value estimates to select among competing procedures. Atlas UX's tier-weighted retrieval achieves a similar selection mechanism through different means:

- **Tier 1 (highest weight):** Core procedures with proven production value — analogous to high PPO value estimates
- **Tier 2 (medium weight):** Supporting context that aids procedural execution — analogous to moderate value estimates
- **Tier 3 (lowest weight):** General reference that may or may not be relevant — analogous to exploratory retrieval

The tier system is a coarser-grained selection mechanism than PPO but achieves the same goal: prioritizing procedures with demonstrated value while maintaining access to less-proven alternatives.

---

## Implications for Agent Memory Design

### Non-Parametric is Not Non-Intelligent

ProcMEM demonstrates that sophisticated learning can happen entirely outside model weights. The procedure library evolves, adapts, and improves without any gradient computation. This has profound implications for production systems: the intelligence of the system is not solely in the model but distributed across the model, its procedures, its memory, and its retrieval mechanisms.

### Procedures Must Be First-Class Citizens

Most agent frameworks treat procedures as implementation details — hardcoded logic, static prompts, or implicit patterns in training data. ProcMEM argues for procedures as first-class data objects with explicit structure, metadata, versioning, and lifecycle management. Atlas UX's KDR system and EXECUTION_CONSTITUTION follow this principle.

### The Inspection Advantage

Non-parametric procedures are inspectable — a human can read them, understand them, and verify them. This is not just a debugging convenience; it is a compliance and safety requirement. When an agent's procedure leads to an incorrect outcome, the procedure can be examined, the error identified, and the correction applied — a transparency that weight-based learning fundamentally cannot provide.

---

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Reinforcement_learning_basic_schema.svg/400px-Reinforcement_learning_basic_schema.svg.png — Reinforcement learning loop showing the agent-environment interaction that ProcMEM augments with procedural memory extraction
2. https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Directed_acyclic_graph.svg/400px-Directed_acyclic_graph.svg.png — DAG structure representing procedural step ordering and dependency relationships in distilled procedures
3. https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Semantic_Net.svg/400px-Semantic_Net.svg.png — Semantic network illustrating how procedural knowledge connects through shared sub-procedures and task relationships
4. https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Social_Network_Analysis_Visualization.png/400px-Social_Network_Analysis_Visualization.png — Knowledge graph visualization representing the interconnected procedural memory store with 49K+ linked entries
5. https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Feedback_loop_with_descriptions.svg/400px-Feedback_loop_with_descriptions.svg.png — Feedback loop showing how PPO value estimates govern procedure selection and evolution

## Videos

- [Proximal Policy Optimization (PPO) Explained — Arxiv Insights](https://www.youtube.com/watch?v=5P7I-xPq8u8)
- [Memory in AI Agents — LangChain](https://www.youtube.com/watch?v=6cKIHDBWnJY)

## References

1. ProcMEM authors (2026). "ProcMEM: Learning Reusable Procedural Memory from Experience via Non-Parametric PPO for LLM Agents." 2026.

2. Schulman, J., Wolski, F., Dhariwal, P., et al. (2017). "Proximal Policy Optimization Algorithms." arXiv:1707.06347. https://arxiv.org/abs/1707.06347

3. Schank, R. C. & Abelson, R. P. (1977). "Scripts, Plans, Goals, and Understanding: An Inquiry into Human Knowledge Structures." Lawrence Erlbaum Associates. https://doi.org/10.4324/9780203781036

4. Wang, G., Xie, Y., Jiang, Y., et al. (2023). "Voyager: An Open-Ended Embodied Agent with Large Language Models." arXiv:2305.16291. https://arxiv.org/abs/2305.16291

5. Zhao, A., Huang, D., Xu, Q., et al. (2024). "ExpeL: LLM Agents Are Experiential Learners." AAAI 2024. https://arxiv.org/abs/2308.10144
