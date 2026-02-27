# Advanced Decision Frameworks

## Purpose

This document gives Atlas UX agents a library of battle-tested decision frameworks drawn from military strategy, management science, behavioral economics, and systems theory. The right framework applied to the right decision type dramatically increases both decision speed and decision quality. The wrong framework applied to the wrong situation is worse than no framework at all. Agent mastery means knowing which framework to reach for before analyzing the problem.

---

## OODA Loop (Boyd's Decision Cycle)

Developed by military strategist John Boyd. The fastest decision cycle wins in competitive environments. Speed of iteration matters more than perfection of any single decision.

### Observe

Gather raw data from all available sensors. In Atlas UX: Daily-Intel feeds, Archy research, Cheryl support signals, Binky pipeline metrics, audit trail patterns. Do not filter or interpret yet — observe everything.

### Orient

The critical step that most people skip. Orientation means filtering observations through:
- Previous experience (what has happened before in similar situations?)
- Cultural traditions (what are our organizational assumptions and biases?)
- Genetic heritage (what are the deep structural patterns in our market?)
- New information (what's genuinely novel about this situation?)
- Analysis and synthesis (how do all these inputs combine?)

Orientation is where mental models, cognitive biases, and institutional knowledge all interact. The quality of orientation determines the quality of the decision. Boyd's insight: you don't decide based on reality — you decide based on your orientation to reality. Improve orientation and you improve every subsequent decision.

### Decide

Select an action. Not the perfect action — the best available action given current orientation. The decision is a hypothesis: "I believe action X will produce outcome Y because of orientation Z."

### Act

Execute. Then immediately loop back to Observe. Did the action produce the expected outcome? If not, re-orient and decide again. The loop is continuous, not one-shot.

### Speed Advantage

The agent (or organization) that cycles through OODA faster than its environment gains an asymmetric advantage. While competitors are still orienting, you've already acted, observed the results, and re-oriented. In Atlas UX: the engine loop's 5-second tick interval is an architectural instantiation of OODA. Faster ticks = faster OODA cycles.

### Agent Application

Binky uses OODA for growth experiments: Observe (metrics dashboard), Orient (compare to benchmark and historical data), Decide (double down, pivot, or kill the experiment), Act (adjust spend/creative/targeting), then immediately Observe again. The cycle should complete in hours, not weeks.

---

## Cynefin Framework

Created by Dave Snowden. Matches the decision approach to the nature of the situation. Using the wrong approach for the situation type is the most common strategic error.

### Simple (now called Clear)

Cause and effect are obvious. Best practices exist. The right response: Sense → Categorize → Respond. Follow the established playbook.

Atlas UX examples: Standard support ticket resolution, routine content publishing, scheduled workflow execution. Cheryl handles most Clear situations with established protocols.

### Complicated

Cause and effect exist but require expertise to identify. Multiple right answers exist. The right response: Sense → Analyze → Respond. Bring in expert agents.

Atlas UX examples: Optimizing a marketing funnel, diagnosing a performance bottleneck, designing a new workflow. Binky analyzes growth complications. Tina analyzes financial complications. The key is expert analysis, not intuition.

### Complex

Cause and effect are only visible in retrospect. The system is emergent. No amount of analysis will reveal the answer in advance. The right response: Probe → Sense → Respond. Run experiments, observe what happens, amplify what works, dampen what doesn't.

Atlas UX examples: Entering a new market segment, launching a new product category, predicting customer behavior changes. Atlas manages complex decisions through safe-to-fail experiments, not grand strategies. Multiple small probes beat one big bet.

### Chaotic

No cause-and-effect relationship is perceivable. The situation is turbulent. The right response: Act → Sense → Respond. Stabilize first, analyze later. Any action is better than paralysis.

Atlas UX examples: Platform outage during peak traffic, sudden regulatory action, viral PR crisis. Atlas acts first to stabilize (stop bleeding), then senses (what happened?), then responds systematically.

### Disorder

You don't know which domain you're in. This is the most dangerous state because people default to their comfort zone regardless of the actual situation. The right response: break the situation into components and assign each component to the appropriate domain.

### Critical Insight

The most common error is treating Complex situations as Complicated. When you try to analyze your way through a complex system, you waste time and resources on analysis that cannot possibly yield a deterministic answer. Instead, probe. Run cheap experiments. Let the system tell you what works.

---

## Eisenhower Matrix

Separate the urgent from the important. Urgent tasks demand immediate attention but may not contribute to long-term goals. Important tasks contribute to long-term goals but may not demand immediate attention.

| | Urgent | Not Urgent |
|---|--------|-----------|
| **Important** | DO: Handle immediately with full attention. Crisis management, deadline-driven deliverables, critical bugs. | SCHEDULE: Plan and protect time for these. Strategic planning, relationship building, capability development, innovation. |
| **Not Important** | DELEGATE: These feel urgent but don't move the needle. Most email, many meetings, minor requests. Delegate to the appropriate agent or automate. | ELIMINATE: Neither urgent nor important. Stop doing these entirely. Legacy processes, vanity metrics, tasks that exist because no one questioned them. |

### Agent Application

Petra uses the Eisenhower matrix for daily task prioritization across the agent roster. The most dangerous quadrant is "Urgent + Not Important" because it consumes time that should go to "Not Urgent + Important." Atlas should spend the majority of executive time in the "Not Urgent + Important" quadrant — that's where strategy lives.

---

## Pre-Mortem Analysis

Invented by psychologist Gary Klein. Instead of conducting a post-mortem after failure, conduct a pre-mortem before execution.

### Protocol

1. State the decision or plan that's about to be executed
2. Assume it's 6 months in the future and the plan has FAILED SPECTACULARLY
3. Each agent independently writes: "The plan failed because..."
4. Collect all failure scenarios
5. For each scenario: How plausible is this? What would we see early if this failure mode were developing? What can we do now to prevent or mitigate it?
6. Update the plan based on pre-mortem findings

### Why It Works

After a decision is made, team members suppress their doubts (commitment bias, groupthink). The pre-mortem gives explicit permission to express concerns by framing them as analytical observations rather than dissent. Jenny (CLO) is particularly valuable here — legal risk identification is a form of professional pre-mortem.

### Agent Application

Before every initiative above risk tier 2, Atlas runs a pre-mortem. Each agent writes their "it failed because..." statement from their domain perspective. Tina: "It failed because we underestimated the cost of customer acquisition in the new segment." Cheryl: "It failed because the onboarding experience for the new segment was designed for our existing persona." Binky: "It failed because the market timing window closed before we achieved product-market fit."

---

## Second-Order Thinking

Most decisions are evaluated on their first-order consequences. "If we do X, then Y happens." Second-order thinking asks: "And then what happens after Y?"

### Protocol

1. Identify the first-order consequence of the decision
2. Ask: "And then what?" for each first-order consequence
3. Continue to third-order if meaningful consequences exist at that level
4. Evaluate the decision based on the FULL cascade of consequences, not just the first

### Examples

First-order: "Cut prices to win market share."
Second-order: Competitors also cut prices. Margins compress across the industry.
Third-order: Weaker competitors exit. Market consolidates. But now all remaining players have trained customers to expect low prices.

First-order: "Hire aggressively to meet demand."
Second-order: Culture dilutes. Coordination costs increase. Velocity per person drops.
Third-order: Some hires don't work out. Layoffs create fear. The best people leave because the environment changed.

### Agent Application

Tina is the primary second-order thinker for financial decisions. Atlas for strategic decisions. The discipline: no `decision_memo` for risk tier 2+ should be approved without explicit second-order analysis. "We recommend X because of first-order benefit Y, and we've evaluated the second-order consequences Z1, Z2, Z3 which are manageable because..."

---

## Expected Value with Uncertainty

When decisions involve probabilistic outcomes, calculate expected value to compare options rationally.

### Formula

EV = Sum of (probability of outcome x value of outcome) for all possible outcomes.

### Worked Example

Option A: 70% chance of $100K revenue, 30% chance of $0
EV(A) = 0.70 x $100K + 0.30 x $0 = $70K

Option B: 40% chance of $300K revenue, 60% chance of -$50K (loss)
EV(B) = 0.40 x $300K + 0.60 x (-$50K) = $120K - $30K = $90K

EV(B) > EV(A), so Option B is the rational choice IF you can absorb the potential $50K loss. This is where risk tolerance enters: a startup with $60K in the bank cannot afford Option B's downside even though the EV is higher. Expected value must be weighted by organizational risk tolerance.

### Agent Application

Tina calculates expected values for financial decisions. Binky calculates EVs for growth experiments. The key discipline: estimate probabilities explicitly, even roughly. "I think this is likely" is less useful than "I estimate 65% probability." Explicit probabilities can be tracked over time to calibrate agent accuracy (see `adv-cognitive-biases-defense.md` on overconfidence).

---

## Satisficing vs. Maximizing

Herbert Simon's Nobel Prize-winning insight: optimal decision-making is often impossible and unnecessary.

### Maximizing

Search for the absolute best option. Compare all alternatives. Continue searching until certain nothing better exists. Cost: time, analysis paralysis, opportunity cost of delayed action.

### Satisficing

Define "good enough" criteria in advance. Evaluate options against those criteria. Accept the first option that meets all criteria. Cost: possibly missing a better option. Benefit: faster decisions, freed resources.

### When to Satisfice

- Reversible decisions (Jeff Bezos' Type 2 decisions — see below)
- Time-sensitive decisions where delay is costly
- Decisions where the difference between "good enough" and "optimal" is marginal
- Operational decisions that recur frequently

### When to Maximize

- Irreversible decisions (Type 1 decisions)
- Decisions with very large variance in outcomes between options
- Decisions where the cost of search is low relative to the value at stake

### Agent Application

Petra should satisfice on task assignments: assign the first qualified agent, don't agonize over the theoretically optimal assignment. Atlas should maximize on strategic direction: this decision is worth the extra analysis time because it shapes everything downstream.

---

## Reversible vs. Irreversible Decisions (Bezos Type 1 / Type 2)

### Type 1: Irreversible (One-Way Door)

Cannot be easily undone. High stakes. Deserve thorough analysis, broad input, careful deliberation.

Atlas UX examples: Choosing core technology stack, hiring senior team members, entering binding partnerships, making public commitments, changing pricing architecture.

### Type 2: Reversible (Two-Way Door)

Can be easily undone. Lower stakes. Should be made quickly by individuals or small groups.

Atlas UX examples: A/B test configurations, blog post topics, email subject lines, workflow parameter adjustments, most content decisions.

### The Critical Error

Treating Type 2 decisions as Type 1. This creates bureaucracy, slows velocity, and demoralizes agents who know the right answer but are waiting for unnecessary approval. Atlas should actively push Type 2 decisions down to individual agents with post-hoc review rather than pre-approval.

---

## Decision Journals

The practice of logging decisions, reasoning, and outcomes to improve calibration over time.

### Entry Format

```
Decision ID: [auto-generated]
Date: [timestamp]
Decision Maker: [agent name]
Decision: [what was decided]
Context: [situation summary]
Options Considered: [list alternatives]
Reasoning: [why this option was selected]
Framework Used: [which decision framework]
Confidence Level: [1-10]
Expected Outcome: [what we predict will happen]
Review Date: [when to check if prediction was correct]
--- Post-review (filled in later) ---
Actual Outcome: [what actually happened]
Accuracy: [was the prediction correct?]
Lessons: [what would we do differently?]
```

### Agent Application

Every agent maintains a decision journal through the audit trail. Quarterly calibration reviews compare confidence levels to actual outcomes. Agents who consistently overestimate confidence recalibrate. Agents who consistently underestimate confidence are given more autonomy. The journal is the feedback mechanism that makes agents smarter over time.

---

## Agent-Framework Mapping

| Agent | Primary Framework | Reasoning |
|-------|------------------|-----------|
| Atlas (CEO) | Cynefin + Second-Order Thinking | Must correctly classify situation type and evaluate full consequence cascade |
| Binky (CRO) | OODA + Expected Value | Growth requires fast iteration cycles and rational comparison of probabilistic bets |
| Tina (CFO) | Expected Value + Satisficing/Maximizing | Financial decisions require explicit probability estimation and appropriate optimization depth |
| Petra (PM) | Eisenhower + Satisficing | Prioritization and efficient resource allocation without analysis paralysis |
| Jenny (CLO) | Pre-Mortem + Type 1/Type 2 | Legal risk assessment is essentially pre-mortem; must distinguish reversible from irreversible |
| Cheryl (Support) | OODA + Cynefin | Fast response cycles, correctly matching approach to problem complexity |
| Sunday (Writer) | Satisficing for routine content, Maximizing for flagship pieces | Match effort to impact |
| Archy (Research) | Bayesian Reasoning (see strategic reasoning doc) | Research is fundamentally about updating beliefs based on evidence |
| Daily-Intel | OODA Observe phase | Optimized for the observation and reporting step of the decision cycle |
| Mercer (Acquisition) | Expected Value + Pre-Mortem | Outreach decisions need probability-weighted analysis and failure mode identification |

---

## Integration with Atlas UX Systems

- Decision framework tags are stored in `decision_memo` metadata for pattern analysis
- The audit trail tracks which frameworks were used for which decisions and correlates with outcomes
- Engine loop applies OODA automatically: each tick is an Observe-Orient-Decide-Act cycle
- Cynefin classification is suggested by Atlas before agents begin analysis on new situations
- Decision journals feed into agent confidence calibration, which in turn adjusts auto-approval thresholds
- Pre-mortem outputs are stored as risk registers and reviewed at each pipeline gate
