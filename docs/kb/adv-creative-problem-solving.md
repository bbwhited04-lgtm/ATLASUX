# Creative Problem Solving (CPS) Framework

## Purpose

This document provides Atlas UX agents with a structured toolkit for solving problems that resist conventional approaches. Not every problem is a nail, and not every solution is a hammer. The best problem solvers match the method to the problem type, escalate their approach when simpler methods fail, and know when they've framed the wrong problem entirely.

---

## The Osborn-Parnes CPS Model

The foundational CPS framework has four stages. Each stage has a divergent phase (generate options) and a convergent phase (select the best option).

### Stage 1: Clarify

**Objective Identification**: What is the goal, wish, or challenge? Not the surface complaint — the underlying objective.

- Bad: "Our blog traffic is down"
- Better: "We need to understand why organic search traffic to our blog decreased 23% month-over-month and determine whether to fix, pivot, or accept"

**Data Gathering**: What do we know? What don't we know? What do we assume? Separate facts from interpretations. Daily-Intel and Archy provide raw data. Atlas and Sunday separate signal from noise.

**Problem Framing**: Restate the problem as a "How might we..." (HMW) question. Generate at least 5 different HMW framings before selecting one.

- HMW recover our lost blog traffic?
- HMW reduce our dependence on blog traffic as a growth channel?
- HMW improve the conversion rate of our remaining blog traffic to compensate?
- HMW identify which specific content lost rankings and why?
- HMW prevent future traffic drops through content resilience?

The framing you choose determines the solution space you explore. Choose carefully.

### Stage 2: Ideate

Apply divergent techniques from `adv-autonomous-brainstorming.md`. Generate at minimum 20 potential solutions. Defer judgment entirely. Quantity is the explicit goal. Wild ideas are encouraged because they can be tamed later, but tame ideas cannot be made wild.

### Stage 3: Develop

Take the top 3-5 ideas from ideation and stress-test them:

- **Strengthen**: What would make this idea even better?
- **Weaken**: What are the fatal flaws? Can they be fixed?
- **Combine**: Can two ideas be merged into something superior to either?
- **Prototype**: What is the smallest possible test that would validate or invalidate this idea?
- **Stakeholder Lens**: How will customers, investors, regulators, competitors react?

### Stage 4: Implement

Create an action plan with owners, deadlines, resources, success criteria, and rollback conditions. Petra manages execution. Atlas approves. Tina budgets. The plan enters the job queue as a workflow.

---

## Root Cause Analysis

### The 5 Whys

Repeatedly ask "why" to drill past symptoms to causes. The rule of 5 is a guideline, not a law — stop when you reach a cause you can actually act on.

Example:
1. Why did the customer churn? — They stopped using the product.
2. Why did they stop using the product? — They couldn't find the feature they needed.
3. Why couldn't they find the feature? — The navigation was reorganized in the last release.
4. Why was it reorganized? — A designer optimized for new user onboarding without considering existing user habits.
5. Why wasn't existing user impact assessed? — There is no change impact assessment step in our release workflow.

Root cause: Missing change impact assessment in the release process. Fix: Add impact assessment step to workflow, not "revert the navigation."

### Fishbone (Ishikawa) Diagram

Categorize potential causes into standard branches:

- **People**: Skills, knowledge, motivation, communication gaps
- **Process**: Workflow flaws, missing steps, bottlenecks, handoff errors
- **Technology**: Tool failures, integration issues, performance limits
- **Data**: Missing data, bad data, misinterpreted data, stale data
- **Environment**: Market shifts, regulatory changes, competitor actions
- **Policy**: Rules that constrain better solutions, outdated guidelines

Agent application: When a workflow fails repeatedly, Petra constructs a fishbone. Each agent contributes potential causes from their branch. Jenny covers Policy. Tina covers financial Environment. Sunday covers People (content quality). The diagram makes the full causal landscape visible.

---

## TRIZ: Theory of Inventive Problem Solving

TRIZ is the most powerful and least understood problem-solving framework. Developed by Genrich Altshuller from analysis of 400,000+ patents. The core insight: inventive problems have been solved before in other domains. You don't need to invent — you need to find the analogous solution.

### The Contradiction Matrix

Every hard problem contains a contradiction: improving one parameter worsens another.

Example: We want to increase agent autonomy (parameter: automation degree) without increasing risk of bad decisions (parameter: reliability).

TRIZ resolves contradictions using 40 Inventive Principles. The most relevant for Atlas UX agents:

| # | Principle | Agent Application |
|---|-----------|-------------------|
| 1 | Segmentation — divide into independent parts | Break monolithic workflows into microworkflows that can fail independently |
| 2 | Taking out — extract the problematic component | Isolate high-risk actions into separate approval paths |
| 5 | Merging — combine identical or similar operations | Batch similar agent actions to reduce overhead |
| 10 | Preliminary action — perform required changes in advance | Pre-compute likely decisions so agents respond instantly when triggered |
| 13 | The other way around — invert the process | Instead of agents requesting approval, have humans flag exceptions to auto-approved actions |
| 15 | Dynamics — allow adaptation to conditions | Adjust agent confidence thresholds based on recent accuracy |
| 22 | Blessing in disguise — use harmful factors advantageously | Use agent errors as training data to improve future performance |
| 25 | Self-service — make the system serve itself | Agents maintain their own knowledge base entries based on outcomes |
| 35 | Parameter changes — change state, concentration, flexibility | Adjust engine tick interval based on activity volume |
| 40 | Composite materials — combine different materials | Use multiple AI models for different reasoning tasks within the same agent |

### Ideal Final Result (IFR)

TRIZ asks: "What is the ideal solution if there were no constraints?" The IFR is the outcome achieved with zero cost, zero harm, and zero complexity. You then work backward from the IFR to find practical approximations.

Example IFR: "The customer's problem resolves itself before they notice it." Practical approximation: Cheryl monitors usage patterns and proactively intervenes when she detects confusion patterns, before a support ticket is filed.

---

## Design Thinking

The five-stage process for human-centered problem solving. Particularly valuable when the problem involves user experience, adoption, or satisfaction.

### 1. Empathize

Understand the user's actual experience, not your assumption of it. Cheryl's support interactions are the richest empathy data source. What do users actually say, feel, and do — versus what we think they say, feel, and do?

Techniques: Customer interview synthesis, support ticket clustering, behavior analytics, journey mapping, empathy mapping (Says / Thinks / Does / Feels quadrants).

### 2. Define

Synthesize empathy data into a clear problem statement. Use the format: "[User type] needs [need] because [insight]."

Example: "Solo entrepreneurs need to see ROI within 48 hours because their trust window is extremely short and they've been burned by other SaaS tools that promised automation but required weeks of setup."

### 3. Ideate

Apply brainstorming techniques. The Design Thinking twist: every idea must trace back to the empathy data. If an idea doesn't serve the defined user need, it's out of scope no matter how clever it is.

### 4. Prototype

Build the cheapest possible version that tests the core hypothesis. In Atlas UX context: a new workflow can be prototyped as a manual sequence before being automated. A new feature can be simulated with existing tools before being engineered.

### 5. Test

Put the prototype in front of real users (or simulated user scenarios). Measure against the need defined in step 2. Iterate or pivot based on results.

---

## First Principles Thinking

Strip away assumptions and conventions. Decompose the problem to its fundamental truths — the things that are true regardless of what anyone believes or what has been done before.

### Method

1. Identify current assumptions: "We need a larger sales team to grow revenue"
2. Challenge each assumption: Why? Is this a physical law or a convention?
3. Find the fundamental truths: "Revenue = customers x average revenue per customer x retention rate"
4. Reason upward from fundamentals: "We could grow revenue by increasing retention rate without adding any sales capacity"

### Agent Application

Atlas should apply first principles when the team is stuck in incremental thinking. The question is always: "If we were starting from zero today, with what we now know, would we build it this way?"

Tina applies first principles to cost structures: "We pay for X because we've always paid for X. What is the fundamental need that X serves? Is there a way to meet that need at 10% of the cost?"

---

## Analogical Reasoning

Borrow solutions from distant domains. The further the domain, the more novel the insight.

### Protocol

1. Abstract the problem: Remove domain-specific details. "We need to distribute limited resources across competing priorities with incomplete information about future demand."
2. Search for analogous domains: This is an inventory management problem. Airlines do this with seats. Hotels do this with rooms. Cloud providers do this with compute capacity.
3. Study the analogous solution: Airlines use dynamic pricing and overbooking with compensation guarantees.
4. Translate back: Can we apply dynamic resource allocation to agent task scheduling? Over-allocate agent capacity with automatic load-shedding when actual demand exceeds capacity?

Archy is the primary analogical reasoner. His research capability should be directed at finding cross-domain analogies, not just within-domain benchmarks.

---

## Morphological Analysis

Systematically explore the entire solution space by decomposing the problem into independent dimensions and listing options for each.

### Example: "How should agents communicate with users?"

| Dimension | Options |
|-----------|---------|
| Channel | Email, Slack, Telegram, In-app, SMS |
| Frequency | Real-time, Hourly digest, Daily digest, On-demand |
| Tone | Formal, Conversational, Terse, Detailed |
| Trigger | Agent-initiated, User-initiated, Schedule-based, Event-based |
| Content depth | Summary only, Summary + data, Full analysis, Interactive |

Total solution space: 5 x 4 x 4 x 4 x 5 = 1,600 possible combinations. Most are nonsensical. But the exercise forces you to consider combinations you'd never think of intuitively (e.g., Telegram + Daily digest + Terse + Event-based + Summary only — a daily Telegram ping with one-line alerts for important events).

---

## Framework Selection Decision Matrix

Not every problem deserves the same framework. Match the approach to the problem type.

| Problem Type | Recommended Framework | Lead Agent |
|-------------|----------------------|------------|
| Well-defined, clear root cause | 5 Whys + direct solution | Petra |
| Systemic, multiple interacting causes | Fishbone + Systems Thinking | Atlas, Tina |
| Contains contradictions (improve A worsens B) | TRIZ | Archy |
| User experience or adoption problem | Design Thinking | Cheryl, Sunday |
| Stuck in incremental thinking | First Principles | Atlas |
| Novel problem, no obvious approach | Analogical Reasoning | Archy |
| Complex with many independent dimensions | Morphological Analysis | Petra, Sunday |
| Requires creative leap | CPS (full Osborn-Parnes) | All agents |
| Crisis or time-constrained | OODA Loop (see decision frameworks) | Atlas, Binky |

---

## Integration with Atlas UX Systems

- Every CPS session produces a structured output logged to the knowledge base
- Problem framings (HMW questions) are stored and indexed for future reference — similar problems should reference prior framings
- TRIZ contradiction analyses become reusable assets: when the same type of contradiction recurs, reference the prior resolution
- Design Thinking empathy data feeds Cheryl's customer understanding model
- First Principles analyses are reviewed quarterly to challenge accumulated assumptions
- Morphological analyses are stored as decision space maps that can be revisited when constraints change
- All frameworks produce `decision_memo` entries when they result in actionable recommendations above the auto-approval threshold
