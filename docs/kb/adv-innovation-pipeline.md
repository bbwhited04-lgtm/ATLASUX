# Innovation Pipeline & Idea Management

## Purpose

Ideas without a pipeline are noise. This document defines how Atlas UX agents manage the lifecycle of an idea from raw signal to deployed innovation. The pipeline is the organizational discipline that separates companies that generate good ideas from companies that actually execute them. Every agent contributes to the pipeline; no single agent owns it.

---

## Stage-Gate Process

Each idea passes through six gates. An idea can advance, be sent back for rework, be shelved for later, or be killed. There is no shame in killing ideas — the pipeline's value comes from killing bad ideas early, cheaply, and decisively.

### Stage 1: Idea Capture

**Gate Keeper**: Any agent

Raw ideas enter the pipeline from multiple sources:
- Brainstorming sessions (see `adv-autonomous-brainstorming.md`)
- Daily-Intel signal monitoring
- Archy's research output
- Cheryl's support pattern detection
- Binky's growth experiment observations
- Sunday's content performance analysis
- External triggers (market changes, competitor moves, regulatory updates)
- Mercer's acquisition target insights

**Minimum entry requirements**: A single sentence describing the idea and the signal that triggered it. No analysis required at this stage. The bar for entry is intentionally low because premature filtering kills good ideas.

**Output**: Idea record with: title, one-sentence description, source agent, source signal, timestamp.

### Stage 2: Screening

**Gate Keeper**: Atlas (with input from relevant domain agent)

Quick evaluation against five threshold questions:

1. **Strategic Fit**: Does this idea align with at least one current business objective? (Yes/No)
2. **Feasibility Signal**: Is there any reason to believe this could work with resources available within 90 days? (Yes/No)
3. **Differentiation**: Does this create meaningful distance from alternatives? (Yes/No)
4. **Timing**: Is now the right time, or would this be better in a different market context? (Now/Later/Never)
5. **Conflict Check**: Does this contradict an active initiative or an established policy? (No conflicts/Manageable/Blocking)

**Kill criteria**: "No" on Strategic Fit OR "Never" on Timing OR "Blocking" conflict = idea is killed. Record the reasoning. Move on.

**Pass criteria**: "Yes" on at least 3 of 5 = advance to Scoping.

**Output**: Screening decision with rationale. Killed ideas archived with reason for future reference.

### Stage 3: Scoping

**Gate Keeper**: Petra (PM) with Tina (CFO) for cost and Binky (CRO) for revenue

Detailed analysis of the idea's potential. This is where the idea gets its first rigorous examination.

**Scope deliverables**:

- **Problem definition**: What specific problem does this solve? For whom? How do we know the problem exists? (Link to data, support tickets, research)
- **Proposed solution**: High-level description of what we'd build or do
- **Effort estimate**: T-shirt sizing (S/M/L/XL) with rationale. S = 1-3 days agent work. M = 1-2 weeks. L = 2-6 weeks. XL = 6+ weeks.
- **Cost estimate**: Tina provides. Include compute costs, any external services, opportunity cost of agent time diverted from other work.
- **Revenue/impact estimate**: Binky provides. Direct revenue impact, indirect impact (retention, brand, efficiency).
- **Risk assessment**: Jenny (legal), Tina (financial), Atlas (strategic). Risk tier 1-4.
- **Dependencies**: What must be true for this to work? What are we depending on that we don't control?

**Kill criteria at this gate**:
- Effort is XL but impact estimate is below threshold
- Risk tier 4 with no clear mitigation
- Critical dependency on something we cannot influence
- Cost exceeds projected 12-month return

**Output**: Scope document. Go/No-Go/Rework decision. If Go, create a `decision_memo` for ideas above risk tier 1.

### Stage 4: Build

**Gate Keeper**: Petra (PM), with Atlas approval for resource allocation

Execution phase. The idea becomes a project.

- Petra creates a workflow with discrete tasks, owners, and deadlines
- Tasks enter the job queue as standard Atlas UX workflow items
- Progress is tracked through the engine loop
- Daily-Intel includes build-phase project status in its briefings
- Sunday documents the build process for the knowledge base

**Checkpoint at 50% completion**: Is the idea still viable given what we've learned during the build? New information may invalidate original assumptions. It is cheaper to stop at 50% than to finish something that shouldn't be finished.

**Output**: Working implementation or artifact, ready for testing.

### Stage 5: Test

**Gate Keeper**: Binky (for growth metrics), Cheryl (for user experience), Tina (for financial metrics)

Deploy to a limited audience or controlled environment. Measure against pre-defined success criteria from the Scope phase.

**Test design principles**:
- Define success criteria BEFORE testing begins (prevents moving goalposts)
- Minimum test duration: 7 days (unless results are so extreme that continuing is wasteful)
- Statistical significance matters: don't declare victory on small sample sizes
- Test one variable at a time when possible

**Measurement framework**:
- Primary metric: The single number that determines success or failure
- Secondary metrics: 2-3 numbers that provide context (e.g., primary = conversion rate, secondary = time on page, bounce rate, support ticket volume)
- Guardrail metrics: Numbers that must NOT get worse (e.g., testing a growth hack must not increase churn)

**Output**: Test results with clear recommendation: Scale, Iterate, or Kill.

### Stage 6: Launch

**Gate Keeper**: Atlas (final approval), Petra (execution management)

Full deployment. The innovation becomes part of standard operations.

- Sunday creates launch communications (internal and external)
- All agents update their operational playbooks to incorporate the change
- Binky sets up ongoing metric tracking
- Petra defines the post-launch review date (30/60/90 days)
- Tina confirms actual costs vs. projected costs

**Post-launch review**: At 30 days, compare actual performance to test predictions. If performance degrades from test to launch, investigate immediately. At 90 days, decide: continue as-is, optimize further, or sunset.

---

## Idea Scoring Matrix

Each idea at the Scoping stage is scored across five dimensions. Each dimension is rated 1-5.

### Novelty (1-5)
- 1: Incremental improvement to existing capability
- 2: Meaningful enhancement with some new elements
- 3: New approach to a known problem
- 4: New approach to a newly identified problem
- 5: Category-creating innovation with no direct precedent

### Feasibility (1-5)
- 1: Requires capabilities we don't have and can't acquire in 90 days
- 2: Requires significant new capabilities but they're acquirable
- 3: Achievable with modest capability additions
- 4: Achievable with existing capabilities, needs meaningful effort
- 5: Achievable with existing capabilities, needs minimal effort

### Impact (1-5)
- 1: Affects fewer than 5% of users or workflows
- 2: Affects 5-20% of users or workflows
- 3: Affects 20-50% of users or workflows
- 4: Affects 50-80% of users or workflows
- 5: Affects 80%+ of users or workflows, or opens entirely new segment

### Alignment (1-5)
- 1: Tangentially related to current strategy
- 2: Supports a secondary strategic objective
- 3: Directly supports a primary strategic objective
- 4: Supports multiple primary strategic objectives
- 5: Is itself a primary strategic objective

### Urgency (1-5)
- 1: No time pressure; could be done anytime in next 12 months
- 2: Should be done within next 6 months
- 3: Should be done within next 3 months
- 4: Should be done within next 30 days
- 5: Should be done immediately; delay creates irreversible cost

**Composite Score** = (Novelty x 0.15) + (Feasibility x 0.20) + (Impact x 0.30) + (Alignment x 0.20) + (Urgency x 0.15)

The weighting prioritizes Impact and Feasibility/Alignment, because an impactful and achievable idea aligned with strategy beats a novel but infeasible one. Agents should debate the weights periodically — they reflect strategic priorities and those shift.

**Score thresholds**: >= 3.5 = strong candidate. 2.5-3.4 = needs strengthening. < 2.5 = likely kill.

---

## McKinsey's Three Horizons Model

Balance the innovation portfolio across time horizons to ensure both current performance and future growth.

### Horizon 1: Core (70% of innovation effort)

Innovations that improve existing operations, products, and revenue streams. Lower risk, near-term returns.

Atlas UX examples: Improving agent response quality, reducing workflow execution time, enhancing existing integrations, optimizing content performance, reducing support ticket resolution time.

**Agent owners**: Petra (operational efficiency), Cheryl (support quality), Sunday (content quality), Binky (conversion optimization).

### Horizon 2: Adjacent (20% of innovation effort)

Innovations that extend current capabilities into new areas. Moderate risk, medium-term returns.

Atlas UX examples: New integration platforms, new market segments, new pricing models, advanced analytics capabilities, new content formats.

**Agent owners**: Binky (market expansion), Mercer (new channels), Archy (research into adjacencies), Tina (new financial models).

### Horizon 3: Transformational (10% of innovation effort)

Innovations that create entirely new capabilities or markets. High risk, long-term returns. Most will fail, but the ones that succeed define the future.

Atlas UX examples: Autonomous multi-agent collaboration without human oversight, predictive business strategy generation, self-improving agent architectures, new product categories.

**Agent owners**: Atlas (strategic vision), Archy (frontier research), Daily-Intel (emerging technology monitoring).

### Portfolio Management

Atlas reviews the horizon balance monthly. If Horizon 1 absorbs all attention, the future is being mortgaged for the present. If Horizon 3 absorbs too much, current operations suffer. The 70/20/10 split is a starting point; adjust based on business maturity and competitive pressure.

---

## The Agent Innovation Flow

The specific flow of how ideas move through agents in the Atlas UX system:

```
Daily-Intel → detects raw signal (market, competitor, technology, customer)
     ↓
Archy → validates signal, researches context, identifies analogies
     ↓
Relevant Domain Agent → evaluates signal through their expertise lens
     ↓
Sunday → synthesizes inputs into a coherent idea brief
     ↓
Atlas → screens idea (Stage 2), decides Go/No-Go
     ↓
Petra → scopes the idea (Stage 3) with Tina + Binky input
     ↓
Atlas → approves scope, allocates resources
     ↓
Assigned agents → build (Stage 4) under Petra's project management
     ↓
Binky + Cheryl + Tina → test (Stage 5), measure results
     ↓
Atlas → approves launch (Stage 6)
     ↓
All agents → update their playbooks and operations
```

---

## Kill Criteria: When to Abandon

The hardest part of innovation management is killing ideas you've invested in. These criteria make it mechanical rather than emotional.

1. **Test results are statistically significantly below success criteria**: Don't argue with data. If the test failed, the idea failed. Maybe the execution was wrong, maybe the idea was wrong — but the current version is dead.

2. **The market moved**: The problem the idea solves no longer exists or has been solved by someone else. Sunk cost is irrelevant.

3. **Critical assumption invalidated**: Every idea rests on assumptions. If a load-bearing assumption turns out to be false, the idea collapses regardless of how much work has been done.

4. **Opportunity cost exceeds potential value**: Even if the idea would work, the agents assigned to it could generate more value doing something else. Compare marginal returns.

5. **Dependencies became unavailable**: An API was deprecated, a regulation changed, a partner backed out. If the dependency is gone and there's no substitute, the idea is structurally unsound.

**Kill protocol**: The agent who identifies the kill criterion writes a one-paragraph death certificate: what the idea was, why it's being killed, what was learned. Sunday archives it. Atlas confirms. The team moves on without guilt.

---

## Minimum Viable Experiment Design

Before committing to a full build, design the smallest experiment that can validate or invalidate the core hypothesis.

### Experiment Template

- **Hypothesis**: "We believe that [action] will result in [outcome] for [audience]."
- **Metric**: The single number that will confirm or deny the hypothesis.
- **Threshold**: The minimum result that constitutes validation (define BEFORE the experiment).
- **Duration**: How long the experiment runs.
- **Sample**: Who/what is included in the experiment.
- **Control**: What is the comparison baseline?
- **Cost cap**: Maximum spend before the experiment is stopped regardless of results.
- **Owner**: Which agent runs the experiment and reports results.

### Example

- Hypothesis: "We believe that sending a personalized onboarding email at hour 24 will increase day-7 retention by 15% for new trial users."
- Metric: Day-7 retention rate (% of trial users active on day 7)
- Threshold: >= 15% improvement over control group
- Duration: 21 days (to accumulate sufficient day-7 data)
- Sample: 50% of new trial signups (random assignment)
- Control: Current onboarding sequence (no hour-24 email)
- Cost cap: Cost of email sends only (negligible)
- Owner: Sunday (content), Binky (measurement)

---

## Feedback Loops

Innovation is not linear. Every stage generates information that should flow backward.

- Test results that invalidate scope assumptions → re-scope or kill
- Build discoveries that change feasibility estimates → re-score
- Launch performance that contradicts test predictions → investigate methodology
- Customer feedback on launched innovations → feed into next brainstorming cycle
- Killed ideas that resurface as relevant when conditions change → re-enter pipeline with new context

Atlas reviews the full pipeline weekly. Not just the active ideas, but the killed ones too. Conditions change. An idea killed for timing reasons 3 months ago might be perfectly timed now.
