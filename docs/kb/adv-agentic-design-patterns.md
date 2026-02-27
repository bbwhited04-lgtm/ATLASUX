# Agentic Design Patterns — Master Reference

> Atlas UX Knowledge Base — Advanced Architecture
> Classification: Internal / Agent Training
> Version: 1.0 | Last Updated: 2026-02-27

---

## 1. Introduction

An agentic design pattern is a reusable architectural template for building AI systems
that go beyond single-turn prompt-response interactions. Where a basic LLM call is
stateless and reactive, an agentic pattern introduces loops, branching, delegation,
self-correction, and multi-step reasoning. The difference between a chatbot and an
autonomous employee is the design patterns wired into its execution path.

This document catalogs the seven foundational agentic design patterns, explains when
to reach for each one, and maps every pattern to concrete Atlas UX implementations.
The patterns are drawn from the current body of applied AI agent research and
production experience across the industry.

**Core principle:** Patterns are composable. A real agent workflow typically layers
multiple patterns — a planning step feeds into parallelized tool calls, whose outputs
pass through a reflection loop before final delivery. Mastery means knowing which
patterns to combine and when to keep things simple.

---

## 2. Pattern 1 — Prompt Chaining

### Definition

Prompt chaining decomposes a complex task into a sequence of discrete steps, where
each step's output becomes the next step's input. The chain is defined at design time
— the topology is fixed, even though the content flowing through it is dynamic.

### How It Works

```
Step 1: Extract key entities from raw text
  → structured JSON
Step 2: Classify entities by category
  → categorized JSON
Step 3: Generate summary from categorized entities
  → human-readable report
```

Each step is a separate LLM call (or tool call) with its own prompt, optimized for
a narrow subtask. The structured output contract between steps is critical — if
Step 1 produces malformed JSON, the entire chain breaks.

### Structured Output Between Steps

The glue holding a chain together is the intermediate data format. Best practices:

- **Use JSON schemas** for inter-step communication. Define the shape explicitly.
- **Validate outputs** before passing to the next step. Catch malformed data early.
- **Include metadata** (confidence scores, source references) so downstream steps can
  make informed decisions about the data they receive.
- **Keep payloads minimal.** Only pass what the next step needs. Carrying the entire
  upstream context through every step wastes tokens and introduces noise.

### Divide-and-Conquer Principle

Prompt chaining is fundamentally divide-and-conquer applied to LLM reasoning. A single
monolithic prompt asking the model to "research, analyze, plan, and write" produces
mediocre results because the model's attention is split across too many objectives.
Breaking this into four chained steps — each with a focused instruction — produces
measurably better output at every stage.

**When to use prompt chaining:**
- The task has clear sequential dependencies (step N requires step N-1's output).
- Each subtask benefits from a specialized prompt or system instruction.
- You need checkpoints where you can validate intermediate outputs.
- The overall task is too complex for a single prompt to handle reliably.

**When NOT to use it:**
- Steps are independent and could run in parallel (use Parallelization instead).
- The task is simple enough that a single well-crafted prompt suffices.
- Latency is critical and the sequential overhead is unacceptable.

### Atlas UX Implementation

The content production pipeline is a textbook prompt chain:

```
Archy (Research) → Sunday (Draft) → Venny (Image) → Publisher (Post)
```

Each stage produces structured output consumed by the next. In the engine loop, this
is implemented as a series of jobs with `depends_on` relationships. The engine only
dequeues a job when all its dependencies have `completed` status.

Atlas (CEO) uses prompt chaining for strategic planning: decompose objective into
sub-goals, evaluate each sub-goal for feasibility, rank by priority, then generate
the delegation plan. Each step is a separate ORCHESTRATION_REASONING call.

---

## 3. Pattern 2 — Routing

### Definition

Routing dynamically selects which processing path to follow based on the characteristics
of the input. Instead of sending every request through the same pipeline, a router
examines the input and dispatches it to the most appropriate handler.

### Four Routing Strategies

| Strategy | Mechanism | Strengths | Weaknesses |
|----------|-----------|-----------|------------|
| **LLM-Based** | LLM classifies input and outputs route | Flexible, handles ambiguity | Adds latency, non-deterministic |
| **Embedding-Based** | Cosine similarity against reference embeddings | Fast, deterministic, cheap | Less nuanced, needs good references |
| **Rule-Based** | Hard-coded conditionals on type/metadata | Predictable, auditable, zero latency | Brittle, cannot handle novel inputs |
| **ML Model-Based** | Trained classifier (not general LLM) | Fast inference, learned from history | Requires training data, can drift |

### When to Use Routing

- Multiple agents or pipelines exist, each specialized for different task types.
- Inputs vary widely in nature and the wrong pipeline would produce poor results.
- You want to optimize cost by sending simple tasks to cheaper models and complex
  tasks to more capable (expensive) models.

### Atlas UX Implementation

Atlas UX uses a layered routing strategy:

1. **Rule-based first pass:** Job type (`EMAIL_SEND`, `SOCIAL_POST`, `RESEARCH_TASK`)
   determines the worker. This is hardcoded in the engine loop.
2. **LLM-based second pass:** When Atlas receives an ambiguous directive, it uses
   ORCHESTRATION_REASONING to classify the task and select the target agent.
3. **Embedding-based KB routing:** When an agent needs reference material, the KB
   query uses embedding similarity to find the most relevant documents.

The auction pattern (documented in the Multi-Agent Orchestration KB) is a specialized
form of LLM-based routing where multiple agents bid for the task.

---

## 4. Pattern 3 — Parallelization

### Definition

Parallelization executes multiple independent subtasks concurrently, then aggregates
the results. This is the "fan-out / fan-in" pattern.

### Fan-Out Phase

Break the work into N independent chunks and dispatch them simultaneously:

```
Task: "Prepare competitive analysis for 5 competitors"
Fan-out:
  Agent 1 → Analyze Competitor A
  Agent 2 → Analyze Competitor B
  Agent 3 → Analyze Competitor C
  Agent 4 → Analyze Competitor D
  Agent 5 → Analyze Competitor E
```

Independence is the key constraint. If subtask 3 depends on subtask 2's output,
you cannot parallelize them — use prompt chaining instead.

### Fan-In Phase

Collect all results and synthesize:

```
Fan-in:
  Atlas → Read all 5 analyses, produce unified competitive landscape report
```

The fan-in step often requires a capable model because it must reconcile potentially
conflicting findings, identify patterns across the individual analyses, and produce
a coherent synthesis.

### Handling Partial Failures

Three policies: **wait-for-all** (safest, slowest), **wait-for-quorum** (proceed
when N-of-M complete), or **first-past-the-post** (use first result). Atlas UX
uses wait-for-all with a timeout; partial synthesis notes missing data on failure.

### When to Use Parallelization

- Multiple subtasks are genuinely independent (no data dependencies).
- Total latency matters more than per-task efficiency.
- The aggregation step can tolerate partial results.
- You have sufficient compute/API budget for concurrent calls.

### Atlas UX Implementation

The platform intel sweep (WF-093 through WF-105) is the canonical parallelization
example: 13 agents simultaneously scan their respective platforms. The engine loop
creates 13 jobs in a single tick; each agent processes its scan independently. WF-106
(Atlas Daily Aggregation) is the fan-in step that synthesizes all scan results.

```typescript
// Engine creates parallel jobs
const scanAgents = ['kelly', 'fran', 'dwight', 'timmy', ...];
await Promise.all(scanAgents.map(agent =>
  createJob({ type: 'PLATFORM_SCAN', agent, payload: scanConfig })
));
// WF-106 triggers after all scans complete (depends_on all scan jobs)
```

---

## 5. Pattern 4 — Reflection

### Definition

Reflection adds a self-correction loop to agent output. Instead of accepting the first
result, the system generates an output, critiques it, and refines based on the critique.
This is the Producer-Critic model.

### The Generate-Critique-Refine Cycle

```
Round 1:
  Producer → Generate initial draft
  Critic   → Evaluate: "The financial projections lack source citations.
              Section 3 contradicts the data in Section 1."
  Producer → Revise draft addressing critic's feedback

Round 2:
  Critic   → Evaluate revised draft: "Citations added. Contradiction resolved.
              Minor: tone is inconsistent in paragraph 4."
  Producer → Final revision

Round 3:
  Critic   → "Approved. No remaining issues."
  → Output delivered
```

### Single-Agent vs Multi-Agent Reflection

**Single-agent:** The same model generates and critiques. Works because the critique
prompt activates different reasoning patterns than generation. **Multi-agent:** A
separate agent or model serves as critic, providing genuine diversity of perspective.

### Termination Conditions

Reflection loops need stopping conditions: **max iterations** (typically 2-3 rounds),
**quality threshold** (exit when critic score exceeds target), **no-change detection**
(stop if revision is identical), or **critic approval** (explicit "approved" signal).

### When to Use Reflection

- Output quality is more important than speed.
- The task involves complex reasoning where first-draft errors are common.
- You have a clear evaluation criteria the critic can apply.
- The cost of iteration (extra LLM calls) is justified by the quality improvement.

**When NOT to use it:**
- Simple factual lookups or format conversions.
- Time-critical tasks where latency matters more than perfection.
- Tasks where the evaluation criteria are subjective or ill-defined.

### Atlas UX Implementation

Every Atlas UX agent runs a self-critique protocol (documented in the Self-Evaluation
KB) as a lightweight single-round reflection. For high-stakes tasks (risk tier >= 2),
a full multi-round reflection loop activates:

- The producing agent generates output.
- A verification sub-agent (see Deep Mode in Self-Evaluation KB) critiques across
  fact-check, logic-check, and compliance-check dimensions.
- The producing agent revises if any check fails.
- DecisionMemo approval serves as the final critic gate for the highest-risk actions.

Tina (CFO) uses reflection for all financial analyses: generate projections, then
run a separate "auditor pass" that checks calculations and reconciles totals.

---

## 6. Pattern 5 — Tool Use / Function Calling

### Definition

Tool use extends an LLM's capabilities beyond text generation by allowing it to invoke
external functions — APIs, databases, file systems, calculators, or other services.
This bridges the gap between "knowing about" something and "doing" something.

### The Six-Step Process

Every tool-use interaction follows this sequence:

```
1. DEFINITION    — Tools are described to the model (name, parameters, purpose)
2. DECISION      — The model decides whether a tool is needed for the current task
3. GENERATION    — The model generates the tool call with specific parameters
4. EXECUTION     — The runtime executes the tool call against the real service
5. OBSERVATION   — The tool's response is fed back to the model
6. PROCESSING    — The model incorporates the tool output into its reasoning/response
```

Steps 2-6 may repeat multiple times within a single task as the agent chains tool
calls to accomplish complex objectives.

### Tool Definition Best Practices

Tool definition quality directly determines call accuracy. Use clear, specific
names (`search_knowledge_base` not `search`). Type every parameter with descriptions.
Include examples of valid calls. State constraints explicitly ("max 5 results").
Document error responses so the model handles failures gracefully.

### Agents-as-Tools

One agent can invoke another agent as a tool with defined inputs and outputs.
Atlas calls Binky-as-tool, Binky calls Sunday-as-tool, Sunday calls Venny-as-tool.
Each level treats the layer below as a function call with a well-defined contract,
enabling hierarchical composition.

### When to Use Tool Use

- The task requires information the model does not have (real-time data, private DBs).
- The task requires side effects (sending emails, creating records, posting content).
- Computation is involved (calculations, data transformations).
- The task requires interaction with external systems (APIs, file storage).

### Atlas UX Implementation

Every agent in the roster has access to a curated tool set defined in `agentTools.ts`:

| Tool | Used By | Purpose |
|------|---------|---------|
| `delegate_task` | Atlas, Binky, department heads | Assign work to subordinates |
| `search_knowledge_base` | All agents | Query KB documents |
| `send_email` | Atlas, Sunday, Cheryl | Send via Microsoft Graph |
| `send_telegram_message` | All agents | Notify via Telegram bot |
| `create_social_post` | Publisher agents | Queue content for platforms |
| `run_financial_calc` | Tina | Budget math, projections |
| `log_decision_memo` | All agents | Request approval for risky actions |

The engine loop handles steps 4-5 (execution and observation). The agent handles
steps 1-3 and 6 within its LLM reasoning call. Tool call results are appended to
the agent's context window before the next reasoning step.

---

## 7. Pattern 6 — Planning

### Definition

Planning is the upfront decomposition of a high-level goal into an ordered sequence
of actionable steps before any execution begins. Unlike prompt chaining (where the
chain is designed at build time), planning generates the chain dynamically at runtime
based on the specific goal.

### Planning vs Prompt Chaining

| | Prompt Chaining | Planning |
|-|----------------|----------|
| Topology | Fixed at design time | Generated at runtime |
| Flexibility | Same steps every time | Steps vary by goal |
| Overhead | None (pre-defined) | One planning step |
| Error recovery | Retry individual step | Re-plan from current state |

### Goal Decomposition

Effective planning requires: **goal clarity** (specific enough to decompose — "increase
X engagement by 20% in 30 days," not "improve marketing"), **state awareness** (current
state determines needed steps), **resource awareness** (available tools, agents, budget),
and **dependency mapping** (which steps are parallel vs sequential).

### Advanced Planning: Google DeepResearch as Exemplar

Google DeepResearch demonstrates a "plan-execute-replan" loop: decompose the research
question into sub-questions, plan which sources to consult, let initial results inform
follow-up searches, then plan the report structure based on what was actually found.
This adaptive approach is more robust than static planning.

### When to Use Planning

- The goal is complex and requires multiple steps to achieve.
- The steps cannot be known in advance because they depend on intermediate results.
- Multiple agents or tools will be involved and coordination is needed.
- The task has resource constraints that the plan must respect.

### Atlas UX Implementation

Atlas (CEO) uses explicit planning for every strategic directive:

```
ORCHESTRATION_REASONING call:
  Input: Strategic goal + current org state + available agents + constraints
  Output: {
    plan: [
      { step: 1, agent: 'archy', task: '...', depends_on: [] },
      { step: 2, agent: 'tina', task: '...', depends_on: [] },
      { step: 3, agent: 'sunday', task: '...', depends_on: [1, 2] },
      { step: 4, agent: 'venny', task: '...', depends_on: [3] },
    ],
    parallel_groups: [[1, 2], [3], [4]],
    estimated_completion: '2h',
    total_estimated_cost: '$2.40 in API calls'
  }
```

Each step in the plan becomes a job in the queue. The `depends_on` array maps to
the job dependency system, and `parallel_groups` tells the engine which jobs to
dispatch simultaneously.

---

## 8. Pattern 7 — Multi-Agent Collaboration

### Definition

Multi-agent collaboration involves multiple specialized agents working together on
a shared objective. This is the pattern that transforms a collection of individual
agents into a functioning team. (See also the Multi-Agent Orchestration KB for
detailed treatment of 10 orchestration patterns.)

### Six Collaboration Topologies

| Topology | How It Works | Atlas UX Example |
|----------|-------------|------------------|
| **Sequential Handoffs** | Fixed-order chain: each agent completes before handoff | Content pipeline: Archy, Sunday, Venny, Publisher |
| **Parallel Processing** | Independent agents work simultaneously, results merged | Daily intel sweep (WF-093-105), fan-in via WF-106 |
| **Debate / Consensus** | Agents argue positions, judge synthesizes | Strategic decisions: Binky, Tina, Jenny, Larry advise Atlas |
| **Hierarchical** | Org chart defines delegation paths | Default: Atlas, dept heads, specialists |
| **Expert Teams** | Ad-hoc groups assembled for a task, disbanded after | Cross-functional initiatives coordinated by Binky |
| **Critic-Reviewer** | One agent produces, another reviews and approves | Sunday writes, Reynolds reviews for accuracy and SEO |

### When to Use Each

- **Sequential** when output quality depends on a strict processing order.
- **Parallel** when subtasks are independent and latency matters.
- **Debate** for high-stakes decisions where diverse perspectives reduce risk.
- **Hierarchical** as the default for organizational-scale work.
- **Expert teams** for time-bound, cross-functional objectives.
- **Critic-reviewer** for any externally-published content.

The engine loop does not enforce topology — it simply processes jobs. Topology is
encoded in how jobs are created (dependencies, grouping, assignment) and how agents
interpret their instructions.

---

## 9. Composing Patterns

Real agent workflows layer multiple patterns. Here is how Atlas UX composes them
for a typical strategic initiative:

```
1. PLANNING      — Atlas decomposes "Launch Q2 campaign" into steps
2. ROUTING       — Each step is routed to the appropriate agent
3. PARALLELIZATION — Independent research tasks fan out to Archy, Tina, Jenny
4. TOOL USE      — Each agent uses search_knowledge_base, run_financial_calc, etc.
5. PROMPT CHAINING — Content flows Archy → Sunday → Venny → Publishers
6. REFLECTION    — Sunday self-critiques draft, Reynolds reviews
7. MULTI-AGENT   — Expert team assembles for final campaign review
```

The key insight: patterns are not mutually exclusive. They are layers in a
composition stack. The engine loop's job-based architecture naturally supports
this because each pattern just creates jobs with different dependency structures.

---

## 10. Anti-Patterns

### 10.1 Over-Engineering Simple Tasks

Using planning + parallelization + reflection for a task that a single well-crafted
prompt could handle. Added complexity without added value.

### 10.2 Reflection Without Criteria

Running a critique loop without specifying what to critique. The critic produces
vague feedback, the producer makes random changes, quality does not improve.

### 10.3 Parallelizing Dependent Tasks

Fanning out tasks that actually depend on each other. Results in agents working
with incomplete information and producing conflicting outputs.

### 10.4 Tool Overload

Defining 50+ tools for an agent. Models degrade at tool selection when the option
set is too large. Keep tool sets curated per agent role (Atlas UX limits each
agent to 8-12 tools maximum).

### 10.5 Planning Without Re-Planning

Creating a plan and executing it rigidly regardless of what happens. Plans must
adapt when intermediate results reveal new information or when steps fail.

### 10.6 Routing Without Fallback

Building a router that fails silently when no route matches. Every router needs
a default path, even if that path is "escalate to human."

---

## 11. Quick Reference

| Pattern | Core Idea | Atlas UX Example |
|---------|-----------|------------------|
| Prompt Chaining | Sequential steps, structured handoff | Content pipeline |
| Routing | Dynamic path selection | Job type dispatch in engine loop |
| Parallelization | Fan-out / fan-in | Daily intel sweep (WF-093-105) |
| Reflection | Generate → Critique → Refine | Self-evaluation protocol |
| Tool Use | LLM invokes external functions | agentTools.ts tool set |
| Planning | Dynamic step generation | Atlas ORCHESTRATION_REASONING |
| Multi-Agent | Specialized agents collaborate | All strategic initiatives |
