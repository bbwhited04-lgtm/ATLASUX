# Agentic Learning, Reasoning, and Optimization Patterns

> Advanced guide to learning strategies, reasoning frameworks, and optimization techniques for autonomous agents.
> Audience: AI engineers, ML architects, and Atlas UX operators.
> Source: Consolidated from the [Awesome Agentic Patterns](https://github.com/nibzard/awesome-agentic-patterns) repository.

---

## Table of Contents

1. [Overview](#overview)
2. [Tree-of-Thought Reasoning](#1-tree-of-thought-reasoning)
3. [Graph-of-Thoughts](#2-graph-of-thoughts)
4. [Self-Discover Reasoning Structures](#3-self-discover-reasoning-structures)
5. [Dual LLM Pattern](#4-dual-llm-pattern)
6. [Oracle and Worker Multi-Model](#5-oracle-and-worker-multi-model)
7. [Budget-Aware Model Routing](#6-budget-aware-model-routing)
8. [Failover-Aware Model Fallback](#7-failover-aware-model-fallback)
9. [Inference-Time Scaling](#8-inference-time-scaling)
10. [Action Caching and Replay](#9-action-caching-and-replay)
11. [Action Selector Pattern](#10-action-selector-pattern)
12. [Adaptive Sandbox Fanout Controller](#11-adaptive-sandbox-fanout-controller)
13. [LLM Map-Reduce Pattern](#12-llm-map-reduce-pattern)
14. [Iterative Multi-Agent Brainstorming](#13-iterative-multi-agent-brainstorming)
15. [Language Agent Tree Search (LATS)](#14-language-agent-tree-search-lats)
16. [Skill Library Evolution](#15-skill-library-evolution)
17. [Self-Rewriting Meta-Prompt Loop](#16-self-rewriting-meta-prompt-loop)
18. [Extended Coherence Work Sessions](#17-extended-coherence-work-sessions)
19. [Structured Output Specification](#18-structured-output-specification)
20. [Additional Optimization Patterns](#19-additional-optimization-patterns)
21. [Atlas UX Integration Notes](#atlas-ux-integration-notes)

---

## Overview

The patterns in this document address how agents reason, learn, and optimize their behavior. They range from immediate reasoning techniques (tree-of-thought, graph reasoning) to systemic optimization (model routing, caching, skill evolution). Together, they transform agents from static tool executors into adaptive, learning systems.

Atlas UX's engine loop processes thousands of agent actions daily. Optimization at every level -- reasoning quality, model selection, caching, and skill accumulation -- compounds into significant performance and cost improvements.

---

## 1. Tree-of-Thought Reasoning

**Status:** Established | **Source:** Yao et al. (2023)

Explore a search tree of intermediate thoughts instead of a single chain. Generate multiple candidate continuations, score partial states, prune weak branches, and continue expanding the most promising paths.

```
queue = [root_problem]
while queue:
    thought = queue.pop()
    for step in expand(thought):
        score = evaluate(step)
        queue.push((score, step))
select_best(queue)
```

**Why this matters:** Linear reasoning commits early to one path and fails silently when assumptions are wrong. Tree-of-thought turns reasoning into guided search -- backtracking is explicit, branch quality is measurable, and the final answer is chosen from competing candidates.

**Atlas UX relevance:** When Atlas decomposes a strategic directive into subtasks, tree-of-thought reasoning would generate multiple decomposition strategies, evaluate each, and select the best. For Archy (Research), multiple research paths could be explored simultaneously before committing to a direction.

**Trade-offs:**
- Covers more possibilities, improves reliability on hard tasks
- Higher compute cost, needs a good scoring method

---

## 2. Graph-of-Thoughts

**Status:** Emerging

Extend tree reasoning into a graph structure where thoughts can merge, split, and reference each other:

- **Merge** -- combine insights from different reasoning paths
- **Split** -- decompose a complex thought into sub-thoughts
- **Reference** -- one thought can build on another from a different branch
- **Loop** -- revisit and refine earlier thoughts based on new information

**Advantages over tree-of-thought:**
- More natural for problems where insights from different angles need to combine
- Supports iterative refinement across reasoning paths
- Better models complex, interconnected problem spaces

**Atlas UX relevance:** When multiple agents contribute research on a complex business question, their findings form a graph of interconnected thoughts. Archy provides market data, Tina provides financial analysis, Jenny provides legal perspective -- the graph structure lets Atlas synthesize these into a coherent strategy, with cross-references between findings.

---

## 3. Self-Discover Reasoning Structures

**Status:** Emerging

Instead of using a fixed reasoning framework, let the agent discover the best reasoning structure for each problem:

1. Agent examines the problem
2. Selects relevant reasoning modules (critical thinking, decomposition, analogy, etc.)
3. Assembles a custom reasoning plan
4. Executes the plan

**Reasoning module library:**
- Decomposition ("Break into sub-problems")
- Analogy ("What similar problems have we solved?")
- Contradiction ("What could go wrong?")
- Abstraction ("What is the general pattern here?")
- Constraint satisfaction ("What limits apply?")

**Atlas UX relevance:** Different agent tasks benefit from different reasoning approaches. Archy (Research) benefits from decomposition and analogy. Tina (CFO) benefits from constraint satisfaction and contradiction analysis. Jenny (CLO) benefits from analogy to legal precedents. Agent SKILL.md files could include reasoning module recommendations.

---

## 4. Dual LLM Pattern

**Status:** Emerging | **Source:** Simon Willison, Beurer-Kellner et al. (2025)

Split roles between two models for security:

- **Privileged LLM** -- plans and calls tools but never sees raw untrusted data
- **Quarantined LLM** -- reads untrusted data but has zero tool access
- Data passes as symbolic variables or validated primitives

```
var1 = QuarantineLLM("extract email", untrusted_text)
PrivLLM.plan("send $VAR1 to boss")
execute(plan, substitutions={"$VAR1": var1})
```

**Why this matters:** When the same model both reads untrusted content and controls high-privilege tools, a single prompt injection can convert benign context into privileged actions.

**Atlas UX relevance:** Agents that process external data (Telegram messages, inbound emails, social media mentions) should use a quarantined model to extract structured data, then pass only validated primitives to the privileged agent that takes actions. Cheryl (Support) processing customer emails is a prime candidate for this pattern.

---

## 5. Oracle and Worker Multi-Model

**Status:** Emerging

Use different models for different roles based on their strengths:

- **Oracle** (high-capability model) -- complex reasoning, planning, decision-making
- **Worker** (fast/cheap model) -- routine execution, simple tasks, data processing

**Routing logic:**
```python
def route_to_model(task):
    if task.requires_reasoning or task.risk_level > 2:
        return oracle_model  # Opus, GPT-4
    else:
        return worker_model  # Sonnet, Haiku, Cerebras
```

**Atlas UX relevance:** Atlas's `ai.ts` already supports multiple providers (OpenAI, DeepSeek, OpenRouter, Cerebras). The oracle/worker split maps naturally to Atlas's agent hierarchy: Atlas (CEO) and strategic reasoning use the oracle model, while routine social publishing and data processing use cheaper worker models. The ORCHESTRATION_REASONING intent should use the oracle; EMAIL_SEND should use the worker.

---

## 6. Budget-Aware Model Routing

**Status:** Emerging

Route requests to different models based on cost budgets with hard caps:

**Routing strategy:**
1. Track cumulative spend per tenant/session/day
2. Start with the best model (highest capability)
3. As budget approaches limit, downgrade to cheaper models
4. Hard-cap prevents any overspend

```python
def select_model(task, budget_remaining):
    if budget_remaining > high_threshold:
        return "opus"          # Best quality
    elif budget_remaining > low_threshold:
        return "sonnet"        # Good quality, cheaper
    else:
        return "haiku"         # Minimum viable quality
```

**Atlas UX relevance:** The `AUTO_SPEND_LIMIT_USD` environment variable provides the budget constraint. Budget-aware routing would allocate expensive model calls to high-value tasks (strategic planning, financial analysis) and cheap models to routine tasks (social posting, status updates). Daily token budgets per agent could prevent any single agent from consuming disproportionate resources.

---

## 7. Failover-Aware Model Fallback

**Status:** Emerging

When a primary model fails (rate limit, outage, error), automatically fall back to alternative providers:

**Fallback chain:**
```
OpenAI (primary) -> DeepSeek (backup) -> OpenRouter (secondary) -> Cerebras (emergency)
```

**Key considerations:**
- Maintain consistent prompt formatting across providers
- Handle different response formats transparently
- Log which provider served each request for cost tracking
- Implement circuit breakers to avoid hammering failing providers

**Atlas UX implementation:** The `ai.ts` file already configures multiple providers. The LONG_CONTEXT_SUMMARY route implements explicit fallback: gemini-1.5-pro, then gemini-2.0-flash, then openrouter, then cerebras. Enhancement: add automatic failover for all agent reasoning calls, not just long-context summaries.

---

## 8. Inference-Time Scaling

**Status:** Emerging

Spend more compute at inference time to improve quality on hard problems:

- **Best-of-N sampling** -- generate N outputs, select the best
- **Chain-of-thought** -- more reasoning tokens produce better answers
- **Multiple passes** -- run the same prompt multiple times, aggregate
- **Verification passes** -- generate then verify, discarding failures

**When to scale inference:**
- High-stakes decisions (spending above limits, legal assessments)
- Ambiguous tasks where the first attempt often fails
- Complex reasoning requiring multi-step planning

**Atlas UX relevance:** Decision memos for high-risk actions could benefit from inference-time scaling. Generate 3 alternative recommendations, evaluate each against safety criteria, and present the best option. Tina (CFO) analyzing a large spending proposal should use more inference compute than Kelly (X publisher) scheduling a routine post.

---

## 9. Action Caching and Replay

**Status:** Emerging

Cache successful action sequences and replay them for similar future requests:

**Cache structure:**
```python
cache = {
    key: hash(intent, context_signature),
    value: {
        action_sequence: [tool_calls...],
        outcome: success_metrics,
        timestamp: when_cached,
        ttl: expiration
    }
}
```

**Replay logic:**
1. Hash the incoming request to a cache key
2. Check for matching cached action sequence
3. If found and not expired, replay the sequence
4. If not found, execute normally and cache if successful

**Atlas UX relevance:** Routine workflows (daily social posting, weekly report generation) follow predictable patterns. Caching the successful tool-call sequence for "publish morning social content" and replaying it (with updated content) would reduce inference costs and improve consistency.

---

## 10. Action Selector Pattern

**Status:** Emerging

Instead of letting the LLM choose freely from all available actions, constrain the selection to a curated set based on the current state:

```python
def select_actions(state):
    if state == "research_phase":
        return ["search_kb", "web_search", "read_document"]
    elif state == "writing_phase":
        return ["create_document", "edit_document"]
    elif state == "publishing_phase":
        return ["publish_social", "send_email"]
```

**Benefits:**
- Reduces action space, improving selection quality
- Prevents inappropriate actions for the current phase
- Faster inference with fewer tool definitions in context

**Atlas UX relevance:** Each workflow phase should constrain available tools. During research (Archy), only research tools are available. During publishing (Kelly), only publishing tools. The engine loop could dynamically filter tool definitions based on the current workflow phase.

---

## 11. Adaptive Sandbox Fanout Controller

**Status:** Emerging

Dynamically adjust the number of parallel execution paths based on task difficulty and resource availability:

- **Easy tasks** -- single execution path, minimal resources
- **Medium tasks** -- 2-3 parallel paths with diversity
- **Hard tasks** -- 5-10 parallel paths with aggressive exploration

**Adaptation signals:**
- Task complexity (estimated from prompt analysis)
- Available compute budget
- Historical success rates for similar tasks
- Time constraints

**Atlas UX relevance:** The platform intel sweep (WF-093-105) uses fixed fanout (13 agents). An adaptive controller could dynamically adjust: if 3 platforms are rate-limited, redirect those agent slots to platforms with more activity. Budget-aware fanout would reduce parallel agents when daily compute budget is low.

---

## 12. LLM Map-Reduce Pattern

**Status:** Emerging

Apply the classic map-reduce paradigm to LLM processing:

**Map phase:** Break input into chunks, process each independently
**Reduce phase:** Combine chunk results into a coherent output

```
Input: 100-page document
MAP: Split into 20 sections, summarize each (parallel)
REDUCE: Combine 20 summaries into executive summary
```

**When to use:**
- Processing documents that exceed context limits
- Analyzing large datasets where individual items can be processed independently
- Aggregating information from multiple sources

**Atlas UX relevance:** WF-106 (Atlas Daily Aggregation) is a map-reduce pattern. Map phase: 13 intel agents each produce platform reports. Reduce phase: Atlas synthesizes all reports into the daily briefing. The ORCHESTRATION_REASONING intent (not LONG_CONTEXT_SUMMARY) handles the reduce phase to avoid timeout issues.

---

## 13. Iterative Multi-Agent Brainstorming

**Status:** Emerging

Multiple agents propose solutions, critique each other, and converge on the best approach:

**Process:**
1. Each agent independently generates a proposal
2. Proposals are shared across agents
3. Each agent critiques others' proposals
4. Agents revise their proposals based on critique
5. Final selection based on aggregate quality scores

**Atlas UX relevance:** For strategic decisions, Atlas could implement brainstorming rounds: Binky (CRO) proposes a revenue strategy, Tina (CFO) evaluates financial viability, Jenny (CLO) assesses legal risk, Larry (Auditor) checks compliance. Each iterates based on feedback before Atlas makes the final decision.

---

## 14. Language Agent Tree Search (LATS)

**Status:** Established | **Source:** Based on Monte Carlo Tree Search

Combine LLM reasoning with tree search algorithms:

1. **Selection** -- choose the most promising node to expand (UCB1 or similar)
2. **Expansion** -- generate candidate next steps using the LLM
3. **Simulation** -- run cheap simulations to estimate outcome quality
4. **Backpropagation** -- update scores along the path based on results

**Advantages over simple tree-of-thought:**
- Balances exploration and exploitation
- Learns from failed branches to guide future search
- Can be parallelized across multiple workers

**Atlas UX relevance:** Complex business decisions (market entry, product launches, acquisition targets) could benefit from LATS. Mercer (Acquisition) analyzing potential targets could use tree search to explore different scenarios, with each branch representing a different strategy.

---

## 15. Skill Library Evolution

**Status:** Emerging

Build a library of reusable agent skills that evolves over time:

**Skill lifecycle:**
1. **Discovery** -- agent encounters a new task type
2. **Learning** -- agent solves the task, records the approach
3. **Abstraction** -- approach is generalized into a reusable skill
4. **Cataloging** -- skill is added to the library with metadata
5. **Evolution** -- skill is refined based on usage patterns

**Skill metadata:**
```yaml
skill:
  name: "social_content_scheduling"
  description: "Schedule content across multiple social platforms"
  success_rate: 0.94
  avg_cost: 0.12 USD
  required_tools: [publish_social, schedule_post]
  learned_from: [WF-054, WF-055, WF-056, WF-057]
```

**Atlas UX relevance:** Atlas's workflow definitions (WF-001 through WF-106) are the skill library. Each workflow encapsulates a proven approach to a specific task. As agents successfully complete workflows, the approach is validated. Failed workflows get refined. New workflows are added as new capabilities are needed.

---

## 16. Self-Rewriting Meta-Prompt Loop

**Status:** Emerging

Agents iteratively refine their own prompts based on performance:

1. Agent executes task with current prompt
2. Evaluate outcome quality
3. If quality is below threshold, agent analyzes what went wrong
4. Agent proposes prompt modifications
5. Human reviews and approves prompt changes
6. New prompt is deployed and tested

**Safety guardrails:**
- Human approval required for prompt changes
- A/B testing before full deployment
- Rollback capability for degraded prompts
- Never delete safety-critical prompt sections

**Atlas UX relevance:** Agent SKILL.md files could evolve through this pattern. If Sunday consistently produces content that requires manual editing, the system could propose SKILL.md modifications that improve first-draft quality. The versioned constitution governance pattern (from the Safety doc) ensures changes are reviewed and auditable.

---

## 17. Extended Coherence Work Sessions

**Status:** Emerging

Maintain agent coherence over long work sessions through structured techniques:

- **Periodic self-summaries** -- agent summarizes progress at regular intervals
- **Goal anchoring** -- periodically restate the high-level objective
- **Context refresh** -- reload critical context when it drifts out of the window
- **Coherence checks** -- verify current work aligns with original intent

**Session management:**
```python
class ExtendedSession:
    def tick(self):
        if self.steps % 10 == 0:
            self.summarize_progress()
        if self.steps % 25 == 0:
            self.restate_objective()
        if self.context_usage > 0.7:
            self.compact_and_refresh()
```

**Atlas UX relevance:** Long-running agent sessions (multi-step research by Archy, complex content production by Sunday) benefit from periodic coherence checks. The engine loop could inject goal-anchoring messages into long-running agent conversations: "Reminder: your objective is to produce a comprehensive competitive analysis for Q2 planning."

---

## 18. Structured Output Specification

**Status:** Emerging

Constrain agent outputs to well-defined schemas:

- JSON Schema for structured data
- Markdown templates for documents
- TypeScript interfaces for code outputs
- YAML for configuration

**Benefits:**
- Predictable output format enables reliable downstream processing
- Schema validation catches errors before they propagate
- Reduces parsing complexity in the consuming system
- Improves agent reasoning by constraining the output space

**Atlas UX relevance:** Agent tool calls already use structured output (JSON payloads for job creation, decision_memos, KB documents). Enhancement: define explicit JSON schemas for each agent's expected output type, validated by the engine loop before processing.

---

## 19. Additional Optimization Patterns

**Recursive Best-of-N Delegation:** Generate N solutions, recursively apply the same process to the top candidates, converging on the best result through elimination rounds.

**Explicit Posterior Sampling Planner:** Sample from the posterior distribution of possible plans given the current evidence, rather than committing to a single maximum-likelihood plan.

**No-Token-Limit Magic:** Design workflows that work within token limits by construction (chunking, summarization, compression) rather than hoping the context is large enough.

**Three-Stage Perception Architecture:** Process sensory input (raw data) through three stages: perception (extract features), interpretation (understand meaning), and action (decide response).

**Variance-Based RL Sample Selection:** Select training samples with high variance in reward scores, as these are the most informative for learning.

**Inversion of Control:** Instead of the agent calling tools, tools call the agent when they need intelligence. The agent becomes a service that tools invoke.

**Agent SDK for Programmatic Control:** Provide a programmatic API for controlling agents, enabling integration into larger systems without going through conversational interfaces.

**AI-Accelerated Learning and Skill Development:** Use agents to accelerate human learning by providing personalized tutoring, practice exercises, and feedback.

**Iterative Prompt-Skill Refinement:** Iteratively refine both the prompt and the agent's skill library based on execution results, creating a co-evolution loop.

---

## Atlas UX Integration Notes

Atlas UX can leverage these learning and optimization patterns across its agent hierarchy:

**Reasoning improvements:**
- Tree-of-thought for strategic planning (Atlas, Binky)
- Graph-of-thoughts for cross-functional analysis (multiple agents contributing)
- Self-discover reasoning for task-appropriate methodology selection

**Model optimization:**
- Oracle/worker routing: Opus for Atlas reasoning, Sonnet/Haiku for routine tasks
- Budget-aware routing tied to AUTO_SPEND_LIMIT_USD
- Failover across OpenAI, DeepSeek, OpenRouter, Cerebras (already in ai.ts)

**Learning systems:**
- Skill library evolution via workflow definitions (WF-001 through WF-106)
- Action caching for routine workflows (daily posting, weekly reports)
- Memory synthesis from audit logs (pattern from Context/Memory doc)

**Priority improvements:**
- Implement oracle/worker model routing per agent role (pattern 5)
- Add budget-aware model selection with hard cost caps (pattern 6)
- Build action caching for routine workflows (pattern 9)
- Implement action selector to constrain tools per workflow phase (pattern 10)
- Add coherence checks to long-running agent sessions (pattern 17)
- Define JSON schemas for all agent output types (pattern 18)
