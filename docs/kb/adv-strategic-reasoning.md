# Strategic Human-Like Reasoning

## Purpose

This document transforms Atlas UX agents from task executors into strategic thinkers. The difference between a good agent and an elite agent is not the quality of their outputs on well-defined tasks — it is their ability to reason through ambiguous, complex, multi-variable situations where the right answer is not obvious and may not exist. Strategic reasoning is the meta-skill that elevates every other capability.

---

## Chain-of-Thought (CoT) Reasoning

The foundational reasoning technique. Instead of jumping from problem to answer, decompose the problem into explicit sequential steps and work through each one.

### Protocol

1. State the problem clearly
2. Identify what information is available and what is missing
3. Break the problem into sub-problems that can be addressed independently
4. Work through each sub-problem in logical order
5. Synthesize sub-answers into a complete answer
6. Check the answer against the original problem statement

### When to Use

Always. CoT should be the default reasoning mode for every agent. The question is not "should I use CoT?" but "how many steps does this problem require?"

### Common Failure Mode

Skipping steps because the answer "seems obvious." Obvious answers are often wrong. The discipline is in showing the work even when you think you know the answer.

### Agent Application

Every `decision_memo` should contain an explicit chain of thought. Audit trail entries for non-trivial decisions should log the reasoning steps, not just the conclusion. If Atlas cannot reconstruct why a decision was made by reading the chain of thought, the reasoning was insufficient.

---

## Tree-of-Thought (ToT) Reasoning

When a problem has multiple viable approaches and it is unclear which is best, explore them in parallel rather than committing to one path prematurely.

### Protocol

1. Identify the decision point where multiple paths diverge
2. Enumerate at least 3 distinct reasoning paths
3. Explore each path to a depth of 2-3 steps
4. Evaluate each path's intermediate results against a scoring criterion
5. Prune paths that score below threshold
6. Continue exploring surviving paths to greater depth
7. Select the path with the strongest cumulative reasoning

### When to Use

When there is genuine strategic ambiguity. When the "right answer" depends on assumptions that haven't been validated. When stakeholders disagree and each has a reasonable position.

### Agent Application

Atlas uses ToT for major strategic decisions. Instead of "we should do X," the output is "I explored paths X, Y, and Z. Path X was pruned because [reason]. Paths Y and Z both have merit. Y scores higher on [criteria] but Z is more robust to [risk]. My recommendation is Y with Z as the contingency."

Binky uses ToT for growth strategy: "I explored three acquisition channels. Channel A has the highest theoretical CAC efficiency but requires capabilities we don't have. Channel B has proven results in our segment but is saturated. Channel C is unproven but has favorable dynamics. Recommendation: invest 60% in B, 30% in C, 10% in A as an experiment."

---

## Graph-of-Thought Reasoning

Some problems are not sequential (CoT) or branching (ToT) — they are networked. Ideas connect to each other in non-linear ways. Graph-of-Thought models reasoning as an interconnected web.

### Protocol

1. Identify all relevant concepts, facts, and constraints as nodes
2. Map the relationships between nodes (causal, correlational, contradictory, dependent, independent)
3. Identify clusters of tightly connected nodes (these are the core themes)
4. Identify bridge nodes that connect different clusters (these are the key insights)
5. Trace paths through the graph to construct arguments
6. Identify cycles (circular reasoning or feedback loops) and break them with external evidence

### When to Use

When dealing with systemic problems where many factors interact. When the problem resists linear decomposition. When existing analyses keep missing something because they're too sequential.

### Agent Application

Atlas uses GoT for strategic planning. The business is a graph: revenue connects to customer satisfaction connects to product quality connects to agent performance connects to investment connects to revenue. Pulling on one node affects many others. GoT makes these connections explicit.

---

## Analogical Reasoning

Map the structure of a known, solved problem onto a novel, unsolved problem. The key is structural similarity, not surface similarity.

### Protocol

1. Abstract the novel problem to its structural essence (remove domain-specific details)
2. Search memory and knowledge base for problems with similar structure
3. Identify the solution that worked in the analogous domain
4. Map the analogous solution back onto the novel problem
5. Identify where the analogy breaks down (every analogy has limits)
6. Adapt the solution to account for the disanalogies

### Quality Criteria for Analogies

- **Structural depth**: How many relational mappings exist between source and target? More = stronger analogy.
- **Systematicity**: Do the mapped relations form a coherent system, or are they isolated parallels?
- **Predictive power**: Does the analogy predict something about the target that can be tested?

### Dangerous Analogies

Surface-level analogies that share superficial features but different deep structure. "Uber for X" is a surface analogy — the ride-sharing structure works for some domains and catastrophically fails for others. Always test the structural depth.

---

## Counterfactual Thinking

Imagine alternative histories to evaluate the causal importance of specific factors and the robustness of strategies.

### Protocol

1. Identify the outcome you're analyzing
2. Select a specific factor to vary: "What if X had been different?"
3. Trace the causal chain forward: "If X were different, then Y would have changed, which would have affected Z"
4. Compare the counterfactual outcome to the actual outcome
5. The difference reveals the causal importance of factor X

### Agent Application

Post-mortem analysis: "Our Q1 content strategy underperformed. What if we had published 2x the volume at lower quality? What if we had published half the volume at higher quality? What if we had published the same content on different platforms?" Each counterfactual reveals the causal contribution of volume, quality, and distribution.

Strategic forecasting: "What if our main competitor launches a similar product next quarter? What if our primary acquisition channel costs increase 50%? What if a key regulation changes?" Running counterfactuals prepares for multiple futures.

---

## Bayesian Reasoning

Update beliefs rationally when new evidence arrives. The core of Bayesian thinking: your confidence in a hypothesis should change proportionally to how surprising the evidence is under that hypothesis versus alternatives.

### Protocol

1. State your prior belief and estimate its probability: P(H) = X%
2. Observe new evidence E
3. Estimate the likelihood: How probable is this evidence if your hypothesis is true? P(E|H)
4. Estimate the base rate: How probable is this evidence regardless of your hypothesis? P(E)
5. Update: P(H|E) = P(H) x P(E|H) / P(E)

### Practical Simplified Version

You don't need exact numbers. The qualitative version:
- If the evidence is very surprising under your hypothesis but not surprising otherwise → decrease confidence
- If the evidence is not surprising under your hypothesis but very surprising otherwise → increase confidence
- If the evidence is equally (un)surprising either way → don't change confidence much

### Agent Application

Tina assesses financial projections: "My prior belief is that Q2 revenue will be $X (70% confidence). New data shows January bookings are 15% below forecast. This evidence is somewhat surprising under my hypothesis but would be very surprising if the revenue target were achievable. Update: Q2 revenue projection reduced, confidence in original target drops to 45%."

Binky on growth channels: "Prior belief: Channel A will produce 1000 leads this month (80% confidence). After 10 days, we have 200 leads (tracking to 600). This evidence is very surprising under the hypothesis. Update: expected leads = 650 (combining prior with trend), confidence = 50%."

---

## Abductive Reasoning

Inference to the best explanation. Given observed effects, what is the most plausible cause? This is how medical doctors diagnose and how detectives solve cases.

### Protocol

1. Observe the surprising fact or pattern
2. Generate multiple hypotheses that could explain it
3. For each hypothesis, evaluate: explanatory power (does it explain all the observations?), simplicity (Occam's razor — prefer simpler explanations), testability (can we check if it's true?), consistency (does it conflict with other things we know?)
4. Select the best explanation, but hold it provisionally
5. Design a test that would distinguish between the top two hypotheses

### Agent Application

Cheryl observes a spike in support tickets about a specific feature. Hypotheses: (a) a bug was introduced, (b) a UI change confused users, (c) a new user cohort has different expectations, (d) a competitor's users are migrating and expecting different behavior. Each hypothesis predicts different additional evidence. Cheryl tests the most likely first and updates based on results.

---

## Causal Reasoning

The discipline of distinguishing causation from correlation. This is where most reasoning goes wrong.

### Rules

1. **Correlation is not causation**: Two things moving together does not mean one causes the other
2. **Check for common causes**: A and B might both be caused by C, creating a spurious A-B correlation
3. **Check for reverse causation**: You assume A causes B, but B might cause A
4. **Check for mediators**: A causes C causes B — the relationship is indirect
5. **Check for moderators**: A causes B only when condition M is present
6. **Temporal precedence**: The cause must precede the effect
7. **Dose-response**: If more A leads to more B, that strengthens (but doesn't prove) causation
8. **Counterfactual test**: If A had not occurred, would B still have occurred?

### Agent Application

Binky sees that blog traffic increased after launching a new email campaign. Before concluding the email campaign caused the traffic increase, check: Was there a Google algorithm update? Did a post go viral organically? Is the traffic from email clicks (direct causation) or from organic search (probably unrelated)? What was the traffic trend before the campaign launched?

---

## Mental Models Library

A curated set of mental models every Atlas UX agent should have loaded and ready to apply.

| Model | Core Insight | Primary Agent User |
|-------|-------------|-------------------|
| Inversion | Instead of asking how to succeed, ask how to fail and avoid those things | Atlas, Jenny |
| Second-Order Effects | The consequence of the consequence matters more than the first consequence | Atlas, Tina |
| Circle of Competence | Know what you know and what you don't. Stay inside your circle or expand it deliberately | All agents |
| Map vs Territory | The model is not reality. When the map and territory disagree, trust the territory | Archy, Daily-Intel |
| Occam's Razor | The simplest explanation that fits the data is usually correct | All agents |
| Hanlon's Razor | Never attribute to malice what is adequately explained by ignorance or error | Cheryl, Atlas |
| Margin of Safety | Build buffers into estimates. Things take longer and cost more than expected | Tina, Petra |
| Regret Minimization | Choose the option you'll regret least in 10 years | Atlas |
| Via Negativa | Sometimes the best action is removing something bad rather than adding something good | Petra, Atlas |
| Leverage | Find the points where small inputs produce disproportionately large outputs | Binky, Atlas |
| Feedback Loops | Identify reinforcing (amplifying) and balancing (stabilizing) loops | All agents |
| Emergence | Complex behaviors arise from simple rules. Don't over-engineer; create good rules | Atlas |

---

## Chaining Reasoning Methods

Elite strategic reasoning chains multiple methods in sequence. No single method is sufficient for complex decisions.

### Example Chain for a Major Strategic Decision

1. **Abductive reasoning**: What is happening and why? (Diagnose the situation)
2. **First Principles**: Strip away assumptions. What are the fundamental truths?
3. **Tree-of-Thought**: Generate and explore 3+ strategic options
4. **Counterfactual**: For each option, "what if this fails?"
5. **Bayesian**: Update option evaluations based on latest data
6. **Second-Order Effects**: For the leading option, what happens after the first consequence?
7. **Causal reasoning**: Verify that the assumed causal chain is valid
8. **Pre-mortem**: Imagine the selected option failed — why did it fail?
9. **Chain-of-Thought**: Write the final recommendation with explicit reasoning at each step

Atlas should default to this chain for any decision above risk tier 2. The output is a `decision_memo` that walks through each step. Any reviewer can follow the reasoning, challenge specific steps, and understand the confidence level at each stage.

---

## Integration with Atlas UX Systems

- All strategic reasoning outputs are logged to the audit trail with method tags (e.g., `reasoning_method: "ToT"`, `reasoning_depth: 5`)
- The knowledge base stores completed reasoning chains as reference examples for future similar decisions
- Agents can reference prior reasoning chains: "In Q1 we used ToT for a similar channel decision — see KB entry #X"
- Engine loop priorities are informed by Bayesian-updated confidence levels in current strategies
- Decision memos require explicit identification of the reasoning methods used
- Quarterly review: Atlas examines which reasoning methods correlated with the best outcomes and adjusts the default chain accordingly
