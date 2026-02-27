# Agent Planning & Reasoning Patterns

> Comprehensive guide to planning architectures and reasoning strategies for autonomous
> AI agents. Covers when to plan, how to plan, and advanced reasoning techniques that
> improve agent decision quality.
> Audience: Platform engineers, AI architects, and agent system designers.

---

## 1. Overview

An AI agent without planning is a reactive system — it responds to stimuli but cannot
pursue multi-step objectives. Planning is what transforms a tool-using LLM into an
autonomous agent capable of achieving complex goals over extended time horizons.

This document covers the planning pattern in depth, examines when planning is
appropriate versus fixed workflows, surveys advanced reasoning techniques (Tree of
Thought, Chain of Thought, Graph of Thoughts), and explores two state-of-the-art
deep research implementations from Google and OpenAI.

Atlas UX agents use planning at multiple levels: workflow decomposition at the
strategic layer, content pipeline planning at the tactical layer, and step-by-step
reasoning at the execution layer.

---

## 2. The Planning Pattern

### 2.1 What Planning Is

Planning is the process of breaking a complex goal into an ordered sequence of
actionable steps, then executing those steps while adapting to new information.

**Formal structure:**
```
Input:  Goal G, Current State S, Available Tools T, Constraints C
Output: Plan P = [step_1, step_2, ..., step_n] such that executing P in S reaches G
```

**A plan is not a script.** A script is a fixed sequence of operations. A plan is a
conditional sequence that the agent revises as it gathers information during execution.
This distinction is critical — rigid execution of a plan that encounters unexpected
conditions leads to failure.

### 2.2 Planning Loop

```
1. ANALYZE the goal: What does success look like?
2. DECOMPOSE into subgoals: What intermediate states must be achieved?
3. ORDER the subgoals: What depends on what?
4. SELECT actions: For each subgoal, what tool or operation achieves it?
5. EXECUTE the first action
6. OBSERVE the result
7. REPLAN if the result diverges from expectations
8. REPEAT until the goal is achieved or determined infeasible
```

The observe-replan cycle (steps 6-8) is what separates planning from scripting. An
agent that plans can recover from unexpected API failures, missing data, or revised
requirements mid-execution.

### 2.3 Replanning Triggers

An agent should replan when:
- A tool call returns an unexpected error or empty result
- New information invalidates an assumption the plan was built on
- The user or supervisor provides revised requirements
- An intermediate result exceeds quality thresholds (the plan may be overbuilt)
- Time or budget constraints have tightened since the plan was created

**Atlas UX replanning:** When an agent's job fails in the engine loop, the failure
handler evaluates whether the failure is recoverable. If yes, it creates a replanned
job with updated context (including the failure reason). If no, it escalates to the
agent's department head. This is replanning at the infrastructure level.

### 2.4 Plan Representation

Plans can be represented in several formats:

**Linear plan (ordered list):**
```
1. Search for competitor pricing data
2. Analyze pricing against our current structure
3. Draft pricing recommendation memo
4. Submit for Tina's approval
```

**DAG plan (directed acyclic graph):**
```
[Search competitors] --> [Analyze pricing]
[Search market size] --> [Analyze pricing]
[Analyze pricing] --> [Draft memo] --> [Submit for approval]
```

DAG plans express parallelism: "Search competitors" and "Search market size" can
execute simultaneously because neither depends on the other.

**Conditional plan (with branches):**
```
1. Search for competitor data
2. IF data found: Analyze and draft memo
   ELSE: Escalate to Archy for deep research, then resume at step 2
3. Submit for approval
```

Atlas UX workflows (WF-001 through WF-106) are essentially pre-defined plans encoded
as workflow manifests. The engine loop executes them as conditional plans — each step
can succeed (proceed) or fail (retry, skip, or escalate).

---

## 3. When to Plan vs. When to Use Fixed Workflows

### 3.1 The Decision Heuristic

The key question is: **Is the "how" known in advance?**

| Scenario | "How" Known? | Approach |
|----------|-------------|----------|
| Post a tweet with specific content | Yes | Fixed workflow (WF-054) |
| Research an unfamiliar market | No | Planning pattern |
| Send a scheduled email | Yes | Fixed workflow |
| Respond to a customer complaint | Partially | Hybrid — template with planning |
| Prepare a competitive analysis | No | Planning pattern |
| Daily platform intel sweep | Yes | Fixed workflow (WF-093-105) |
| Investigate a revenue anomaly | No | Planning pattern |

### 3.2 Fixed Workflows

**When to use:**
- The task has been performed many times before
- The steps are deterministic and well-understood
- Latency matters more than flexibility
- Compliance requires a specific sequence of operations

**Implementation in Atlas UX:**
Fixed workflows are registered in `workflowsRoutes.ts` with predefined step sequences.
The scheduler fires them on schedule (e.g., WF-010 at 08:30 UTC daily). Each step
maps to a specific agent and action type.

**Advantage:** Predictable, fast, auditable. No LLM reasoning needed for step selection.
**Disadvantage:** Cannot adapt to novel situations. If the task deviates from the
template, the workflow either fails or produces suboptimal output.

### 3.3 Dynamic Planning

**When to use:**
- The task is novel or the environment is uncertain
- The agent needs to discover the approach through exploration
- Multiple valid approaches exist and the best one depends on intermediate results
- The task requires synthesizing information from multiple sources

**Implementation in Atlas UX:**
Dynamic planning is triggered by `ORCHESTRATION_REASONING` intents. Atlas or a
department head receives a high-level objective and uses LLM reasoning to decompose
it into subtasks, select agents, and define dependencies. The resulting plan is encoded
as a set of linked jobs in the queue.

**Advantage:** Flexible, adaptive, handles novelty.
**Disadvantage:** Slower (LLM inference for plan generation), less predictable, harder
to audit (plan varies per execution).

### 3.4 Hybrid Approach

Most real tasks fall between fully fixed and fully dynamic. Atlas UX uses a hybrid:

```
Fixed skeleton + Dynamic fill:
  Step 1: [Fixed] Gather data from these 3 sources
  Step 2: [Dynamic] Analyze the data — approach depends on what was found
  Step 3: [Fixed] Format output as a standard report
  Step 4: [Dynamic] Generate recommendations — depends on analysis
  Step 5: [Fixed] Submit for approval via decision memo
```

This hybrid captures the predictability of fixed workflows for well-understood steps
while preserving planning flexibility for steps that require reasoning.

---

## 4. Google DeepResearch

### 4.1 What It Is

Google DeepResearch is an agent-based research system that performs iterative
search-and-analysis loops to produce comprehensive research reports. It exemplifies
the planning pattern applied to information synthesis.

### 4.2 Architecture

```
User Query
    |
    v
[Planning Agent] -- generates multi-point research plan
    |
    v
[Search Loop] -- for each research point:
    |   1. Formulate search queries
    |   2. Execute web searches
    |   3. Extract relevant information
    |   4. Evaluate source quality
    |   5. Identify gaps -> formulate follow-up queries
    |   (repeat until point is sufficiently covered)
    v
[Synthesis Agent] -- combines findings into coherent report
    |
    v
[Citation Agent] -- verifies and formats source citations
    |
    v
Final Report with Citations
```

### 4.3 Key Design Principles

**Multi-point research plans:** Rather than a single search query, DeepResearch
generates a structured research plan with 5-15 specific questions or angles to
investigate. Each point may require multiple search iterations.

**Iterative deepening:** For each research point, the agent searches, evaluates
what it found, identifies gaps, and searches again. This continues until the agent
determines the point is sufficiently covered or a maximum iteration count is reached.

**Asynchronous execution:** Research points that are independent can be investigated
in parallel. The planning agent identifies dependencies (e.g., "understanding the
market size requires knowing the market definition first") and schedules accordingly.

**Source quality assessment:** Not all search results are equal. DeepResearch evaluates
source authority, recency, and corroboration. Claims supported by multiple independent
sources receive higher confidence scores.

### 4.4 Atlas UX Parallel: Archy's Research Workflow

Archy (Research Specialist) implements a simplified version of this pattern:

```
1. Atlas or Binky assigns a research objective
2. Archy generates a research plan with 3-5 key questions
3. For each question:
   a. Query available data sources (KB, web search tool, cached intel)
   b. Evaluate findings against the question
   c. If insufficient: refine query and search again (max 3 iterations)
4. Synthesize findings into a structured research brief
5. Write to KB for downstream agents (Sunday, Tina, etc.)
```

The platform intel sweep (WF-093 through WF-105) is a broadcast version of this
pattern — 13 agents simultaneously execute research loops against their respective
platforms, then Atlas aggregates findings in WF-106.

---

## 5. OpenAI Deep Research API

### 5.1 Architecture

OpenAI's Deep Research uses the `o3-deep-research` model — a reasoning model
specifically trained for extended research tasks.

**Key components:**
- **Model:** `o3-deep-research` — optimized for multi-step research with extended
  thinking time
- **Tool:** `web_search_preview` — built-in web search tool that the model calls
  autonomously during its reasoning chain
- **Output:** Structured markdown with inline citations and source URLs

### 5.2 How It Works

```
1. User submits a research query via the API
2. The model enters an extended reasoning phase (can take minutes)
3. During reasoning, the model autonomously:
   a. Formulates search queries
   b. Calls web_search_preview to gather information
   c. Evaluates results and formulates follow-up queries
   d. Repeats until satisfied with coverage
4. The model synthesizes findings into a cited report
5. Response includes the report and structured citation metadata
```

**Distinctive features:**
- The model decides when and what to search — no external planning agent needed
- Reasoning and search are interleaved (search results inform the next reasoning step)
- Citations are structured and verifiable, not hallucinated
- Extended thinking time is a feature, not a bug — inference-time scaling (see section 8)

### 5.3 Structured Output

```json
{
  "content": "## Market Analysis\n\nThe AI employee platform market...[1][2]",
  "citations": [
    { "index": 1, "url": "https://...", "title": "...", "snippet": "..." },
    { "index": 2, "url": "https://...", "title": "...", "snippet": "..." }
  ]
}
```

### 5.4 Atlas UX Integration Opportunity

Atlas UX's LONG_CONTEXT_SUMMARY route already supports multiple AI providers
(Gemini, OpenRouter, Cerebras). Adding `o3-deep-research` as a provider would give
Archy access to production-grade deep research capabilities without building the
full iterative search loop internally.

**Constraint:** The 90-second timeout on LONG_CONTEXT_SUMMARY may be insufficient for
deep research tasks. WF-106 already uses ORCHESTRATION_REASONING to avoid this timeout.
A dedicated deep research endpoint with a longer timeout (5-10 minutes) and
asynchronous job-based execution would be more appropriate.

---

## 6. Tree of Thought Reasoning

### 6.1 Concept

Standard LLM reasoning is linear: the model generates one token at a time, following
a single path from question to answer. Tree of Thought (ToT) reasoning explores
multiple reasoning paths simultaneously and selects the most promising one.

### 6.2 Structure

```
                    [Problem]
                   /    |    \
              [Path A] [Path B] [Path C]
              /    \      |       |
         [A.1]  [A.2]  [B.1]   [C.1]
           |              |
         [A.1.1]        [B.1.1]  <-- evaluate all leaf nodes
                          |
                       [Winner]  <-- select best path
```

### 6.3 How It Works

1. **Generate:** From the current state, generate N possible next steps (branches).
2. **Evaluate:** Score each branch for promise/likelihood of reaching the goal.
3. **Select:** Choose the best-scoring branch(es) to continue expanding.
4. **Prune:** Abandon branches that fall below a quality threshold.
5. **Repeat:** Continue from selected branches until a solution is found.

### 6.4 Evaluation Strategies

- **Value heuristic:** Use a separate LLM call to score each branch ("On a scale of
  1-10, how likely is this reasoning path to reach a correct answer?")
- **Voting:** Generate the evaluation multiple times and use majority vote
- **Backtracking:** If all branches at a level score poorly, backtrack one level
  and try different branches

### 6.5 When to Use

- Mathematical or logical problems with multiple valid approaches
- Strategic planning where the best approach is not obvious
- Decision-making under uncertainty where exploring options has value

### 6.6 Atlas UX Application

Atlas uses a simplified ToT when generating strategic plans:

```
Goal: "Increase Q2 revenue by 15%"

Path A: Focus on customer acquisition (Mercer-led)
  -> Estimated impact: 8% growth
  -> Risk: High (new customer acquisition cost)

Path B: Focus on upselling existing customers (Binky-led)
  -> Estimated impact: 10% growth
  -> Risk: Medium (depends on product readiness)

Path C: Focus on reducing churn (Cheryl-led)
  -> Estimated impact: 6% growth
  -> Risk: Low (defensive measure)

Evaluation: Paths B + C combined exceed target with acceptable risk.
Selected: Execute B and C in parallel.
```

---

## 7. Chain of Thought Reasoning

### 7.1 Concept

Chain of Thought (CoT) is the most foundational reasoning technique: the model
explicitly writes out intermediate reasoning steps before producing a final answer.

### 7.2 Why It Works

LLMs are next-token predictors. Without CoT, the model must compress all reasoning
into the implicit computation that produces the first token of the answer. With CoT,
the model uses the output tokens themselves as working memory — each intermediate
step provides context for the next.

### 7.3 Prompting for CoT

**Zero-shot CoT:** Simply append "Let's think step by step" to the prompt.
This alone improves accuracy on reasoning tasks by 10-40% across benchmarks.

**Few-shot CoT:** Provide examples of step-by-step reasoning before the actual
question. The model mimics the demonstrated reasoning structure.

**Structured CoT:** Define the reasoning format explicitly:
```
1. Identify the key question
2. List relevant facts
3. Apply relevant rules or formulas
4. Check for edge cases
5. State the conclusion with confidence level
```

### 7.4 Atlas UX Agent Prompting

All Atlas UX agents are prompted with structured reasoning requirements in their
system prompts. For example, Tina (CFO) is prompted to:

```
When evaluating a financial decision:
1. State the proposed action and its cost
2. Check against AUTO_SPEND_LIMIT_USD ($X)
3. Assess risk tier based on recurrence, amount, and reversibility
4. If risk tier >= 2: generate a decision memo for approval
5. If risk tier < 2: approve with audit log entry and reasoning
```

This structured CoT ensures that Tina's reasoning is auditable — the audit trail
captures not just the decision but the reasoning chain that produced it.

---

## 8. Graph of Thoughts

### 8.1 Beyond Linear and Tree Structures

Graph of Thoughts (GoT) generalizes CoT and ToT into a non-linear reasoning
structure where thoughts can:
- Branch (one thought leads to multiple)
- Merge (multiple thoughts combine into one)
- Loop (a thought feeds back into an earlier stage)
- Reference (a thought references a non-adjacent earlier thought)

### 8.2 Structure

```
[Thought 1] -----> [Thought 2] -----> [Thought 4]
     |                  |                  ^
     |                  v                  |
     +----------> [Thought 3] --------+
                       |
                       v
                  [Thought 5] (merges insights from 3 and 4)
```

### 8.3 Operations

| Operation | Description | Example |
|-----------|-------------|---------|
| Generate | Create new thoughts from existing ones | Brainstorm 3 approaches |
| Aggregate | Combine multiple thoughts into one | Synthesize research from 3 sources |
| Refine | Improve a thought based on new information | Revise estimate after data check |
| Score | Evaluate thought quality | Rate approach feasibility 1-10 |
| Backtrack | Abandon a thought and return to predecessor | Research dead end, try alternative |

### 8.4 Advantage Over ToT

ToT is a tree: it branches but never merges. GoT supports merging, which is critical
for synthesis tasks. When Archy researches three market segments independently (three
branches), the synthesis step merges those branches into a single report. This merge
operation cannot be represented in a pure tree structure.

### 8.5 Atlas UX Application

The daily aggregation workflow (WF-106) is a GoT in practice:

```
[Intel Agent 1] ---\
[Intel Agent 2] ----+---> [Atlas Synthesis] ---> [Task Assignment Plan]
[Intel Agent 3] ---/            |                        |
                               v                        v
                        [KB Update]              [Department Heads]
                               |                   /    |    \
                               +---- referenced by ----+
```

Intel agents produce independent thoughts (parallel branches). Atlas merges them
(aggregation). The task assignment plan references both the synthesis and individual
agent outputs. Department heads reference the plan and the underlying KB updates.
This is a graph, not a tree or a chain.

---

## 9. Inference-Time Scaling

### 9.1 Concept

Traditional LLM scaling focuses on training: bigger models, more data, more compute
during training. Inference-time scaling is the insight that you can also improve output
quality by spending more compute at inference time.

### 9.2 Mechanisms

**Extended thinking:** Models like OpenAI's o3 family spend additional compute
on internal reasoning before producing output. The model "thinks longer" on harder
problems, allocating more inference-time compute to problems that need it.

**Multiple samples:** Generate N responses and select the best one. With N=10, the
probability of at least one correct response is significantly higher than N=1, even
if each individual response has low accuracy.

**Iterative refinement:** Generate a response, critique it, generate a better response.
Each iteration improves quality at the cost of additional inference.

**Search:** Use the LLM as a node evaluator within a search algorithm (beam search,
Monte Carlo tree search). The search explores the solution space more thoroughly
than single-pass generation.

### 9.3 Cost-Quality Trade-off

```
Quality
  ^
  |          ........___________
  |        ./
  |      ./
  |    ./
  |  ./
  | /
  |/__________________________ > Inference Compute
```

Quality improves rapidly with initial compute increases (low-hanging fruit) but
shows diminishing returns at high compute levels. The optimal operating point depends
on the value of quality improvement versus the cost of additional compute.

### 9.4 Atlas UX Applications

**High-stakes decisions:** When Atlas generates a strategic plan or Tina evaluates a
major expenditure, the system can allocate additional inference-time compute:
- Generate 3 candidate plans and evaluate each
- Use extended thinking models (o3 series) for complex reasoning
- Run a self-critique loop before finalizing

**Routine tasks:** For low-risk, high-volume tasks (social media posts, routine
email responses), minimize inference-time compute. Use fast models (Cerebras, DeepSeek)
with single-pass generation.

**Budget allocation heuristic:**
```
Inference budget = base_cost * risk_tier_multiplier * novelty_multiplier

Where:
  risk_tier_multiplier = { 0: 1x, 1: 1.5x, 2: 3x, 3: 5x }
  novelty_multiplier = { routine: 1x, semi-novel: 2x, novel: 3x }
```

Atlas UX's `ai.ts` already supports multiple providers with different cost/quality
profiles (OpenAI, DeepSeek, OpenRouter, Cerebras). Inference-time scaling is about
selecting the right provider and configuration for each task's requirements.

---

## 10. How Atlas Agents Plan

### 10.1 Workflow Decomposition

At the strategic level, Atlas decomposes high-level objectives into workflow-level
plans. This is the most impactful planning layer — it determines which agents are
engaged, what resources are allocated, and what the success criteria are.

**Process:**
```
1. Atlas receives a strategic directive (from user or scheduled workflow)
2. Atlas identifies relevant departments and agents
3. Atlas generates a decomposition plan:
   - Subtasks with clear deliverables
   - Agent assignments based on capability matching
   - Dependencies between subtasks
   - Deadlines based on urgency and complexity
   - Risk assessment for each subtask
4. Plan is encoded as linked jobs in the queue
5. Engine loop executes jobs respecting dependencies
```

### 10.2 Daily Brief Generation

Daily-Intel generates the morning briefing through a structured planning process:

```
1. Query all platform intel from the past 24 hours (KB documents)
2. Identify top developments by impact score
3. Cross-reference with active strategic objectives
4. Prioritize items by relevance to current Atlas UX goals
5. Generate structured brief with:
   - Top 3 developments with impact assessment
   - Action items for department heads
   - Risk alerts if any
   - Market sentiment summary
6. Distribute to Atlas and department heads
```

### 10.3 Content Pipeline Planning

Sunday plans the content pipeline by:

```
1. Review content calendar (weekly and monthly targets)
2. Check available research from Archy (KB query)
3. Identify gaps — topics with demand signals but no content
4. Prioritize topics by:
   - Audience engagement potential (historical data)
   - Strategic alignment with current goals
   - Resource availability (Venny for images, Victor for video)
5. Generate content briefs for each planned piece
6. Assign to pipeline: Research -> Write -> Image -> Publish
7. Set deadlines working backwards from publish date
```

### 10.4 Adaptive Planning Under Uncertainty

When an agent encounters uncertainty during plan execution:

**Low uncertainty (confidence > 0.8):** Continue with current plan.

**Medium uncertainty (0.5 < confidence < 0.8):** Replan the current step with
additional information gathering before proceeding.

**High uncertainty (confidence < 0.5):** Escalate to supervisor for replanning.
The supervisor may reassign the task, provide additional context, or modify the
overall plan.

**Atlas UX implementation:** Confidence levels are tracked in the agent's reasoning
trace and logged to the audit trail. When confidence drops below
`CONFIDENCE_AUTO_THRESHOLD`, the agent generates a decision memo rather than acting
autonomously.

---

## 11. Planning Anti-Patterns

### 11.1 Over-Planning

Generating a 20-step plan for a task that needs 3 steps. Over-planning wastes tokens
on plan generation, introduces unnecessary complexity, and creates more points of
failure. Rule of thumb: if the plan has more steps than the task has meaningful
decision points, it is over-planned.

### 11.2 Plan Rigidity

Executing a plan without checking intermediate results against expectations. The
observe-replan cycle is not optional — it is what makes planning useful. Without it,
you have a script that happens to be generated at runtime.

### 11.3 Infinite Replanning

Replanning after every step regardless of whether the result was unexpected. This burns
tokens on unnecessary plan generation. Replan only when observations diverge from
expectations or when new information invalidates assumptions.

### 11.4 Planning Without Constraints

Generating a plan without considering time budgets, token budgets, or tool
availability. A plan that requires 50 API calls when the agent has a budget of 10
is not a plan — it is a wish list. Constraints should be inputs to the planning
process, not afterthoughts.

### 11.5 Single-Path Planning

Generating only one plan without considering alternatives. For high-stakes tasks,
generate 2-3 candidate plans, evaluate them (ToT style), and select the best.
The additional inference cost is justified by the reduction in execution failures.

---

## 12. Key Takeaways

1. **Planning transforms reactive agents into goal-directed agents.** Without planning,
   an agent can only respond to immediate stimuli. With planning, it can pursue
   multi-step objectives over extended time horizons.

2. **Use fixed workflows for known tasks, dynamic planning for novel tasks, and hybrids
   for everything in between.** Most real tasks fall into the hybrid category.

3. **The observe-replan cycle is non-negotiable.** A plan that cannot adapt to
   unexpected observations is just a brittle script.

4. **Chain of Thought is the foundation.** Every other reasoning technique (ToT, GoT,
   inference-time scaling) builds on the insight that explicit reasoning steps improve
   output quality.

5. **Inference-time scaling lets you trade compute for quality.** Allocate more
   inference compute to high-stakes, novel tasks and less to routine, low-risk tasks.

6. **Deep research agents (Google DeepResearch, OpenAI o3-deep-research) demonstrate
   the planning pattern at scale.** Iterative search-and-analysis loops with replanning
   are the state of the art for information synthesis.

7. **Atlas UX plans at three levels:** strategic (workflow decomposition by Atlas),
   tactical (content pipeline planning by Sunday), and operational (step-by-step
   reasoning within each agent's execution tick).
