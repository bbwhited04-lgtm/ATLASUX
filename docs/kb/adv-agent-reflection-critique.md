# Agent Reflection & Self-Critique Patterns

> Deep dive into reflection, self-evaluation, and iterative improvement patterns for
> autonomous AI agents. Covers producer-critic architectures, stopping conditions,
> memory-enhanced reflection, and practical implementation patterns.
> Audience: Platform engineers, AI architects, and agent quality engineers.

---

## 1. Overview

An agent that generates output and immediately ships it will produce inconsistent
quality. Some outputs will be excellent; others will contain errors, miss requirements,
or lack coherence. Reflection is the mechanism that turns variable-quality first drafts
into consistently high-quality final outputs.

The core insight is simple: **use the LLM to evaluate its own output (or another LLM's
output) before committing it.** Every reflection loop is an additional LLM inference
call — which means additional latency and cost. The art of reflection is knowing when
to reflect, how deeply to reflect, and when to stop reflecting and ship.

This document covers the fundamental reflection patterns, practical implementation
strategies, and how Atlas UX agents use reflection to maintain output quality across
content generation, support responses, decision memos, and more.

---

## 2. Self-Reflection: Evaluating Your Own Output

### 2.1 What Self-Reflection Is

Self-reflection is the simplest reflection pattern: a single agent generates output,
then evaluates that output against quality criteria in a second reasoning step.

```
Step 1 — Generate:
  Agent produces initial output based on the task brief.

Step 2 — Reflect:
  Same agent reviews its output against:
    - Task requirements (did I address every point in the brief?)
    - Quality standards (is the writing clear, accurate, well-structured?)
    - Policy constraints (does this comply with SGL guardrails?)
    - Consistency (does this contradict anything in the knowledge base?)

Step 3 — Revise (if needed):
  Agent produces an improved version addressing the issues found.
```

### 2.2 The Self-Reflection Prompt

The quality of self-reflection depends entirely on the evaluation prompt. A vague
prompt ("Is this good?") produces vague evaluations. A structured prompt produces
actionable feedback.

**Effective self-reflection prompt structure:**
```
You have just produced the following output for the task "[task brief]":

---
[agent's output]
---

Evaluate this output against the following criteria. For each criterion, provide a
score (1-5) and specific feedback.

1. COMPLETENESS: Does the output address every requirement in the task brief?
   Score: ___ / 5
   Missing elements: ___

2. ACCURACY: Are all factual claims correct and verifiable?
   Score: ___ / 5
   Concerns: ___

3. CLARITY: Is the output clear, well-organized, and free of ambiguity?
   Score: ___ / 5
   Issues: ___

4. POLICY COMPLIANCE: Does the output comply with all applicable policies?
   Score: ___ / 5
   Violations: ___

5. ACTIONABILITY: Can the recipient act on this output without follow-up questions?
   Score: ___ / 5
   Gaps: ___

OVERALL ASSESSMENT:
  If all scores are 4+: OUTPUT IS READY — no revision needed.
  If any score is 3: MINOR REVISION NEEDED — list specific changes.
  If any score is 1-2: MAJOR REVISION NEEDED — rewrite the affected sections.
```

### 2.3 Limitations of Self-Reflection

**Blind spot problem:** The same reasoning that produced an error may fail to detect
that error. If the agent misunderstood the task brief, its self-evaluation will also
be based on the misunderstanding.

**Confirmation bias:** LLMs tend to rate their own output more favorably than
independent evaluators. Self-reflection catches surface-level issues (typos, missing
sections) more reliably than deep reasoning errors.

**When self-reflection is sufficient:**
- Routine tasks with clear, checkable requirements
- Content formatting and structure validation
- Policy compliance checking (checklist-based)

**When self-reflection is insufficient:**
- Novel tasks where the agent may have misunderstood the objective
- High-stakes outputs where errors have significant consequences
- Tasks requiring domain expertise the agent may not have

---

## 3. Producer-Critic Model

### 3.1 Architecture

The producer-critic model uses two separate agents (or two separate LLM calls with
different system prompts) to separate generation from evaluation.

```
[Producer Agent]
    |
    | generates output
    v
[Critic Agent]
    |
    | evaluates output, provides feedback
    v
[Decision Gate]
    |
    | IF approved: ship output
    | IF rejected: send feedback to Producer for revision
    v
[Producer Agent] (revision loop)
```

### 3.2 Why Two Agents

**Independent perspective:** The critic agent has a different system prompt, different
instructions, and potentially a different model. It approaches the output from the
evaluator's perspective rather than the generator's perspective.

**Role specialization:** The producer focuses on creativity, completeness, and
coherence. The critic focuses on accuracy, policy compliance, and audience fit. These
are different cognitive tasks that benefit from different prompting strategies.

**Accountability:** When a separate critic approves output, the audit trail records
both the generation and the approval. This is critical for compliance in Atlas UX's
Alpha safety framework.

### 3.3 Critic Agent Design

The critic should be:
- **Specific:** Point to exact issues, not vague concerns. "Paragraph 3 claims Q2
  revenue grew 15% but no source is cited" is better than "needs more evidence."
- **Constructive:** Provide actionable guidance, not just criticism. "Add a citation
  for the 15% figure from the latest financial summary" is better than "this is wrong."
- **Consistent:** Apply the same standards across all evaluations. Use a scoring
  rubric to prevent evaluation drift.
- **Bounded:** Limit evaluation to defined criteria. A critic without boundaries will
  find issues indefinitely (see section 4 on stopping conditions).

### 3.4 Implementation Pattern

```typescript
// Producer-Critic cycle
async function producerCriticCycle(
  task: TaskBrief,
  maxIterations: number = 3
): Promise<Output> {

  let output = await producer.generate(task);

  for (let i = 0; i < maxIterations; i++) {
    const critique = await critic.evaluate(output, task);

    if (critique.approved) {
      return output; // Quality threshold met
    }

    // Feed critique back to producer for revision
    output = await producer.revise(output, critique.feedback, task);
  }

  // Max iterations reached — escalate for human review
  return escalateForReview(output, task);
}
```

### 3.5 Atlas UX Producer-Critic Pairings

| Producer | Critic | Output Type |
|----------|--------|-------------|
| Sunday | Reynolds | Blog content (Reynolds checks before publishing) |
| Archy | Atlas | Research briefs (Atlas validates strategic relevance) |
| Tina | Larry | Financial analyses (Larry audits for compliance) |
| Cheryl | Jenny | Legal-adjacent support responses (Jenny reviews risk) |
| Any publisher | Sunday | Social media posts (Sunday reviews for brand voice) |
| Any agent | Larry | Decisions involving spend or risk (Larry audits) |

---

## 4. Stopping Conditions

### 4.1 The Infinite Reflection Problem

Without explicit stopping conditions, a reflection loop can run indefinitely. Each
critique finds something to improve, the revision addresses it but introduces new
issues, the next critique finds those issues, and the cycle continues. This is
expensive (tokens), slow (latency), and often counterproductive (over-editing can
degrade quality).

### 4.2 Stopping Condition Types

#### 4.2.1 Quality Threshold

The output meets a defined quality score.

```
IF all_criteria_scores >= 4 AND overall_score >= 4.0:
  STOP — output is approved
```

This is the ideal stopping condition: stop when quality is sufficient, not when
iterations are exhausted.

#### 4.2.2 Maximum Iterations

A hard cap on the number of reflection loops.

```
max_iterations = 3

IF iteration_count >= max_iterations:
  STOP — ship best version or escalate for review
```

This is a safety net. It prevents runaway loops but should not be the primary
stopping mechanism. If you consistently hit the max, your producer or critic needs
improvement.

#### 4.2.3 The "PERFECT" Flag Pattern

The critic can set a special flag indicating that the output requires no further
revision.

```
Critic evaluation template:

After your evaluation, append one of:
  STATUS: NEEDS_REVISION — [list of issues]
  STATUS: APPROVED — output meets all quality criteria
  STATUS: CODE_IS_PERFECT — output exceeds quality criteria, no improvements needed
```

The `CODE_IS_PERFECT` pattern (named for its origin in code review agents) gives the
critic an explicit way to signal that further iteration would be wasted effort. This
is more reliable than inferring approval from high scores, because the critic may give
high scores but still suggest optional improvements.

#### 4.2.4 Diminishing Returns Detection

Track the magnitude of changes between iterations. When revisions become trivial
(word substitutions, minor formatting), further iteration is unlikely to improve
quality meaningfully.

```
change_magnitude = diff_size(output_v2, output_v1) / size(output_v1)

IF change_magnitude < 0.05:  // Less than 5% change
  STOP — diminishing returns detected
```

#### 4.2.5 Time Budget

Some tasks have deadlines. Reflection loops must respect them.

```
time_remaining = deadline - now()
estimated_iteration_time = 30_seconds

IF time_remaining < estimated_iteration_time:
  STOP — ship current best version
```

### 4.3 Combining Stopping Conditions

In practice, use multiple conditions with OR logic:

```
STOP IF:
  quality_threshold_met (all scores >= 4)
  OR max_iterations_reached (iteration >= 3)
  OR perfect_flag_set (STATUS: CODE_IS_PERFECT)
  OR diminishing_returns (change < 5%)
  OR time_budget_exhausted (< 30s remaining)
```

The first condition that fires ends the loop.

---

## 5. Memory-Enhanced Reflection

### 5.1 The Stateless Problem

A single self-reflection step is stateless — the agent evaluates the current output
without memory of previous attempts. This means the agent can make the same error,
catch it, fix it, and in the next iteration, make a different error that reintroduces
the original problem.

### 5.2 Conversational History as Memory

Memory-enhanced reflection maintains the full history of generation-evaluation cycles
in the agent's context window:

```
Context for iteration 3:

[Original task brief]

[Version 1 output]
[Version 1 critique: "Missing budget section, tone too informal"]

[Version 2 output]
[Version 2 critique: "Budget section added but calculations wrong, tone improved"]

[Version 3 output]  <-- current version, informed by all previous feedback

Evaluate version 3, paying special attention to whether the issues identified in
versions 1 and 2 have been resolved without introducing regressions.
```

### 5.3 Benefits of Memory-Enhanced Reflection

**Cumulative improvement:** Each iteration builds on all previous feedback, not just
the most recent. The agent can track which issues have been resolved and which persist.

**Regression detection:** By comparing the current version against previously identified
issues, the agent can detect when a fix introduces a new problem or reintroduces a
previously fixed one.

**Pattern recognition across iterations:** If the same type of issue appears in multiple
iterations (e.g., calculation errors keep appearing in different sections), the agent
can recognize the systemic issue rather than treating each occurrence as independent.

### 5.4 Context Window Management

Memory-enhanced reflection consumes context window space rapidly. Each iteration adds
both the output and the critique to the history. For long outputs (research reports,
blog posts), this can exhaust the context window within 2-3 iterations.

**Mitigation strategies:**

- **Summarize previous iterations:** Instead of including full outputs and critiques,
  summarize each iteration: "V1: Missing budget section, informal tone. V2: Budget
  added (calculations wrong), tone fixed."
- **Include only the critique history:** Omit previous output versions; include only
  the critique feedback and the current version.
- **Rolling window:** Keep only the last 2 iterations in full, summarize earlier ones.

### 5.5 Atlas UX Implementation

Atlas UX agents maintain task-level memory through the audit log. When an agent
enters a reflection cycle, the engine loop provides:
- The original task brief
- The current output (latest version)
- Summary of previous critique feedback (from audit log meta)

This gives agents enough context for memory-enhanced reflection without consuming
excessive context window space.

---

## 6. Use Cases

### 6.1 Content Generation Refinement

**Agent:** Sunday (Communications Director)
**Pattern:** Producer-critic with memory

```
Iteration 1:
  Sunday generates blog post draft from Archy's research.
  Self-reflection: "Missing introduction hook, statistics lack citations."
  Revision: Adds hook and citations.

Iteration 2:
  Self-reflection: "Introduction is stronger, but conclusion does not match the
  headline's promise. Two statistics cite sources from 2023 — check for 2025 updates."
  Revision: Rewrites conclusion, updates stale statistics.

Iteration 3:
  Self-reflection: "All criteria score 4+. STATUS: APPROVED."
  -> Output sent to Venny for header image, then to Reynolds for publishing.
```

### 6.2 Code Review Cycles

**Pattern:** Producer-critic with CODE_IS_PERFECT stopping condition

```
Producer: Code generation agent writes a function.
Critic: Code review agent evaluates for correctness, edge cases, style.

Cycle:
  V1: "Function handles happy path but crashes on empty input."
  V2: "Empty input handled. But the error message is not user-friendly."
  V3: "All checks pass. STATUS: CODE_IS_PERFECT."
```

### 6.3 Plan Evaluation

**Agent:** Atlas (CEO)
**Pattern:** Self-reflection with Tree of Thought

```
Atlas generates 3 candidate strategic plans (ToT branching).
For each plan:
  - Self-evaluate: feasibility, resource requirements, risk, timeline
  - Score each plan on 5 criteria
  - Identify weaknesses in top-scoring plan
  - Revise top plan to address weaknesses
  - Final evaluation: "Plan B (revised) scores 4.3/5. Proceeding."
```

### 6.4 Information Synthesis Verification

**Agent:** Daily-Intel
**Pattern:** Self-reflection with source cross-referencing

```
Daily-Intel synthesizes the morning briefing from 13 platform intel reports.

Reflection:
  1. Does the briefing cover all 13 platform reports? -> Check coverage
  2. Are priority rankings consistent with source data? -> Cross-reference
  3. Are there contradictions between different platform reports? -> Flag
  4. Are all claims attributed to their source agent? -> Verify
  5. Is the briefing length appropriate (concise but complete)? -> Check word count

If contradictions found:
  -> Flag in the briefing with both claims and sources
  -> Do NOT silently resolve contradictions (let Atlas decide)
```

### 6.5 Support Response Quality Checks

**Agent:** Cheryl (Support Specialist)
**Pattern:** Producer-critic with Jenny (CLO) as risk evaluator

```
Customer asks about data deletion process.

Cheryl generates response.
Self-reflection:
  - Accurate re: platform capabilities? ✓
  - Empathetic tone? ✓
  - Contains any legal promises? ⚠️ "We will delete all your data within 24 hours"

Escalate to Jenny:
  Jenny evaluates: "The 24-hour promise creates a legal obligation. Revise to
  'We will process your deletion request in accordance with our data retention policy,
  typically within 30 days.'"

Cheryl revises and re-evaluates. Jenny approves. Response sent.
```

### 6.6 Decision Memo Validation

**Agent:** Tina (CFO) or Larry (Auditor)
**Pattern:** Multi-evaluator reflection

```
Agent generates a decision memo for a $5,000 marketing spend.

Evaluator 1 (Tina — financial lens):
  - Is the budget breakdown realistic?
  - Does the expected ROI justify the spend?
  - Are there cheaper alternatives?

Evaluator 2 (Larry — compliance lens):
  - Does this violate any spending policies?
  - Is the approval chain correct for this amount?
  - Are all required disclosures present?

Evaluator 3 (Jenny — legal lens):
  - Are there contractual implications?
  - Does this create recurring obligations?

All three evaluators must approve before the memo is submitted for final approval.
```

---

## 7. Trade-offs: Quality vs. Latency vs. Cost

### 7.1 The Fundamental Trade-off

Each reflection loop adds:
- **Latency:** One additional LLM inference call (1-10 seconds depending on model and
  output length)
- **Cost:** Token consumption for both the evaluation prompt and the response
- **Quality:** Incremental improvement (diminishing with each iteration)

### 7.2 Cost Model

```
Total cost = generation_cost + (N * reflection_cost)

Where:
  generation_cost = input_tokens * input_price + output_tokens * output_price
  reflection_cost = (input_tokens + output_tokens + critique_tokens) * prices
  N = number of reflection iterations
```

For a typical blog post (2000 tokens):
- Generation: ~3000 input + 2000 output = ~$0.01
- Each reflection: ~5000 input + 500 output = ~$0.005
- 3 reflections: total ~$0.025

For a strategic plan (5000 tokens):
- Generation: ~8000 input + 5000 output = ~$0.05
- Each reflection: ~13000 input + 1000 output = ~$0.02
- 3 reflections: total ~$0.11

### 7.3 When to Reflect More

| Signal | Action |
|--------|--------|
| High risk tier (2+) | 3+ reflection iterations |
| External-facing content | Producer-critic with domain expert |
| Financial implications | Multi-evaluator reflection |
| Legal implications | Mandatory Jenny review |
| First time doing this task type | Extra reflection + AAR |

### 7.4 When to Reflect Less

| Signal | Action |
|--------|--------|
| Risk tier 0, routine task | Self-reflection only, 1 iteration |
| Internal-only output | Self-reflection only |
| Time-critical (< 30s budget) | No reflection, ship immediately |
| Template-based output | Validation only (not creative review) |
| High-confidence agent on familiar task | Self-reflection, max 1 iteration |

### 7.5 Atlas UX Reflection Budget by Agent

| Agent | Default Reflection | Escalated Reflection |
|-------|-------------------|---------------------|
| Publisher agents | 1 self-reflection | Sunday critic review |
| Sunday | 2 self-reflections | Reynolds + Atlas review |
| Archy | 1 self-reflection | Atlas review (strategic fit) |
| Tina | 2 self-reflections (financial accuracy) | Larry audit |
| Cheryl | 1 self-reflection | Jenny review (legal risk) |
| Atlas | 1 self-reflection (strategic plans) | Board consensus (risk 3+) |

---

## 8. Implementation Patterns

### 8.1 LangChain LCEL Reflection Chain

LangChain's Expression Language (LCEL) provides a composable way to build reflection
chains:

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Producer chain
producer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a content writer. Write a blog post about {topic}."),
    ("human", "{requirements}")
])
producer_chain = producer_prompt | llm | StrOutputParser()

# Critic chain
critic_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an editor. Evaluate this draft against the requirements."),
    ("human", "Requirements: {requirements}\n\nDraft:\n{draft}\n\nProvide feedback.")
])
critic_chain = critic_prompt | llm | StrOutputParser()

# Reflection loop
async def reflect(topic, requirements, max_iter=3):
    draft = await producer_chain.ainvoke({"topic": topic, "requirements": requirements})

    for i in range(max_iter):
        feedback = await critic_chain.ainvoke({
            "requirements": requirements,
            "draft": draft
        })
        if "APPROVED" in feedback:
            return draft
        # Revise with feedback
        draft = await producer_chain.ainvoke({
            "topic": topic,
            "requirements": f"{requirements}\n\nPrevious feedback:\n{feedback}"
        })

    return draft  # Best effort after max iterations
```

### 8.2 Google ADK SequentialAgent with LoopAgent

ADK provides built-in primitives for reflection loops:

```python
from google.adk.agents import SequentialAgent, LoopAgent, LlmAgent

# Producer agent
producer = LlmAgent(
    name="writer",
    instruction="Write content based on the brief. Include all required sections."
)

# Critic agent (checks for approval signal)
critic = LlmAgent(
    name="editor",
    instruction="""Evaluate the content. If all quality criteria are met,
    respond with 'STATUS: APPROVED'. Otherwise, provide specific revision notes."""
)

# Reflection loop: runs producer then critic, repeats until APPROVED or max iterations
reflection_loop = LoopAgent(
    name="content_refinement",
    sub_agent=SequentialAgent(
        name="produce_and_critique",
        sub_agents=[producer, critic]
    ),
    max_iterations=5,
    # LoopAgent stops when critic output contains the termination signal
)
```

The ADK LoopAgent handles the iteration management automatically — the developer
defines the sub-agents, the termination condition, and the max iterations. The
framework manages the loop, context passing, and iteration counting.

### 8.3 Atlas UX Engine Loop Integration

Within Atlas UX, reflection is implemented at the engine loop level:

```
Engine tick for agent job:
  1. Build agent context (system prompt, task brief, tools, KB context)
  2. Execute agent reasoning (LLM call)
  3. Process tool calls
  4. IF agent output includes self-critique:
       a. Parse critique scores
       b. IF all scores >= threshold: mark job as completed
       c. IF any score < threshold AND retry_count < max:
            - Store critique in job meta
            - Re-queue job with critique as additional context
            - Increment retry_count
       d. IF retry_count >= max: mark as completed with quality warning
  5. Log output + critique to audit trail
```

The key design choice: reflection retries are implemented as re-queued jobs, not as
synchronous loops within a single engine tick. This means:
- Other agents can execute between reflection iterations (fairness)
- Reflection does not block the engine loop
- Each iteration is independently auditable
- Timeout management is handled by the standard job timeout mechanism

---

## 9. Reflection Metrics

### 9.1 What to Measure

| Metric | What It Tells You | Target |
|--------|-------------------|--------|
| Avg iterations to approval | How many loops before quality is met | 1.5-2.0 |
| First-pass approval rate | How often V1 output meets the bar | > 60% |
| Max iterations hit rate | How often you exhaust the budget | < 10% |
| Critic agreement rate | How often critics agree with each other | > 80% |
| Regression rate | How often fixes introduce new issues | < 15% |
| Time per reflection cycle | Latency cost of reflection | < 10s per iteration |
| Token cost per reflection | Financial cost of reflection | Track per agent |

### 9.2 Using Metrics to Tune

**High avg iterations (> 3):** Producer quality is too low. Improve the producer's
system prompt, provide better examples, or give it access to more context.

**Low first-pass approval rate (< 40%):** The gap between what the producer generates
and what the critic expects is too large. Align their quality standards or reduce
the critic's threshold.

**High max iterations hit rate (> 20%):** Either the quality bar is unrealistically
high, the producer cannot improve beyond a certain point, or the critic is
inconsistent. Investigate which.

**High regression rate (> 20%):** The producer is not using memory-enhanced reflection.
Provide the full critique history so it can avoid reintroducing previously fixed issues.

---

## 10. Atlas UX Reflection Applications in Detail

### 10.1 Sunday's Content Review Cycle

Sunday is Atlas UX's primary content producer. Every piece of content goes through:

```
1. First draft from brief + research (Archy's KB output)
2. Self-reflection: completeness, accuracy, tone, SEO
3. IF blog post: Reynolds reviews for publishing readiness
4. IF social content: Publisher agent reviews for platform fit
5. IF high-stakes (announcement, crisis): Atlas reviews for strategic alignment
```

### 10.2 Cheryl's Support Response Quality

Cheryl handles customer-facing responses where errors have reputational impact:

```
1. Generate response from ticket context + KB search
2. Self-reflection: accuracy, empathy, completeness, no false promises
3. IF legal risk detected: escalate to Jenny for review
4. IF financial claim made: escalate to Tina for verification
5. IF all clear: send response, log to audit trail
```

### 10.3 Decision Memo Validation Chain

Decision memos are the highest-stakes outputs in Atlas UX — they authorize real-world
actions with financial and legal implications:

```
1. Agent generates decision memo (spend justification, risk assessment, proposal)
2. Self-reflection: all required fields present, math checks out
3. Larry audits: compliance check, risk tier validation
4. IF spend > AUTO_SPEND_LIMIT_USD: Tina reviews financial impact
5. IF legal implications: Jenny reviews contractual/regulatory issues
6. IF risk tier >= 3: consensus vote (minimum 3 agents, 2/3 majority)
7. Final approval gate: memo status moves to "approved"
```

This is multi-evaluator reflection with role-based evaluation criteria. Each evaluator
applies their domain lens. The memo only ships when all applicable evaluators approve.

---

## 11. Key Takeaways

1. **Self-reflection catches surface issues; producer-critic catches deeper ones.** Use
   self-reflection for routine tasks and producer-critic for high-stakes outputs.

2. **Every reflection loop costs tokens and time.** Budget reflection proportional to
   the risk and impact of the output. Routine posts get 1 self-check; decision memos
   get multi-evaluator review.

3. **Stopping conditions prevent infinite loops.** Combine quality thresholds, max
   iterations, diminishing returns detection, and time budgets. The first condition
   that fires ends the loop.

4. **Memory-enhanced reflection prevents regressions.** Include the critique history
   in the agent's context so it can track which issues have been resolved and avoid
   reintroducing them.

5. **The critic must be specific and constructive.** Vague feedback ("needs improvement")
   produces vague revisions. Specific feedback ("Paragraph 3 claims 15% growth without
   citation — add source from Q2 financial summary") produces targeted fixes.

6. **Implement reflection as re-queued jobs, not synchronous loops.** This preserves
   fairness across agents, enables independent auditability, and prevents reflection
   from blocking the engine loop.

7. **Measure and tune.** Track first-pass approval rate, average iterations, regression
   rate, and cost. These metrics tell you whether your reflection system is adding value
   or just burning tokens.
