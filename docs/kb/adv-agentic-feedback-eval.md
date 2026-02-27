# Agentic Feedback Loops and Evaluation Patterns

> Advanced guide to feedback loops, evaluation systems, and critique mechanisms for autonomous agents.
> Audience: Platform engineers, AI architects, and Atlas UX operators.
> Source: Consolidated from the [Awesome Agentic Patterns](https://github.com/nibzard/awesome-agentic-patterns) repository.

---

## Table of Contents

1. [Overview](#overview)
2. [Reflection Loop](#1-reflection-loop)
3. [Rich Feedback Loops](#2-rich-feedback-loops)
4. [Self-Critique Evaluator Loop](#3-self-critique-evaluator-loop)
5. [CriticGPT-Style Evaluation](#4-criticgpt-style-evaluation)
6. [Anti-Reward-Hacking Grader Design](#5-anti-reward-hacking-grader-design)
7. [Incident-to-Eval Synthesis](#6-incident-to-eval-synthesis)
8. [Spec-As-Test Feedback Loop](#7-spec-as-test-feedback-loop)
9. [Workflow Evals with Mocked Tools](#8-workflow-evals-with-mocked-tools)
10. [RLAIF: Reinforcement Learning from AI Feedback](#9-rlaif-reinforcement-learning-from-ai-feedback)
11. [Inference-Healed Code Review Reward](#10-inference-healed-code-review-reward)
12. [Dogfooding with Rapid Iteration](#11-dogfooding-with-rapid-iteration)
13. [Agent Reinforcement Fine-Tuning](#12-agent-reinforcement-fine-tuning)
14. [Atlas UX Integration Notes](#atlas-ux-integration-notes)

---

## Overview

Autonomous agents without feedback loops produce outputs that drift, degrade, and fail silently. Feedback is the mechanism that turns a single-pass generator into a self-improving system. The patterns in this document cover three levels of feedback:

1. **Immediate** -- within a single task (reflection, self-critique)
2. **Operational** -- across tasks and sessions (incident-to-eval, rich feedback)
3. **Systemic** -- across training cycles (RLAIF, reward hacking defense, fine-tuning)

Atlas UX agents operate autonomously and need robust feedback mechanisms to maintain quality without constant human supervision.

---

## 1. Reflection Loop

**Status:** Established | **Source:** Shinn et al. (2023)

After generating a draft, run an explicit self-evaluation pass against defined criteria and feed the critique into a revision attempt. Repeat until output clears a threshold or retry budget is exhausted.

```
for attempt in range(max_iters):
    draft = generate(prompt)
    score, critique = evaluate(draft, metric)
    if score >= threshold:
        return draft
    prompt = incorporate(critique, prompt)
```

**Scoring rubrics should be stable:** Use correctness, completeness, safety, and style so the loop improves objective quality rather than free-form restyling.

**Practical guidance:**
- Keep loop budgets small (2-4 passes)
- Log score deltas to verify extra iterations produce measurable gains
- If scores plateau after 2 iterations, the prompt or metric needs adjustment

**Atlas UX relevance:** Sunday (content writer) should use reflection loops when generating blog posts or social content. The first draft gets evaluated against brand voice, factual accuracy, and engagement criteria. Reynolds (Blog publisher) could run a reflection pass before publishing, checking for tone consistency with existing content.

**Trade-offs:**
- Improves outputs with little supervision
- Extra compute per task
- May stall if the evaluation metric is poorly defined

---

## 2. Rich Feedback Loops

**Status:** Validated in production | **Source:** Thorsten Ball, Quinn Slack

Polishing a single prompt cannot cover every edge case. Agents need ground truth to self-correct. Expose iterative, machine-readable feedback -- compiler errors, test failures, linter output, screenshots -- after every tool call.

**Evidence from 88 session analysis:**

| Project | Positive Feedback | Corrections | Success Rate |
|---------|------------------|-------------|--------------|
| nibzard-web | 8 | 2 | 80% |
| 2025-intro-swe | 1 | 0 | 100% |
| awesome-agentic-patterns | 1 | 5 | 17% |

**Key insight:** Projects with more positive feedback had better outcomes. Reinforcement is not just politeness -- it is training data for the agent. Modern models increasingly create their own feedback loops by writing and executing short verification scripts.

**Types of feedback to expose:**
- Compiler/linter errors (structured, machine-readable)
- Test results with stack traces
- Build output with error codes
- Screenshots for visual verification
- Human positive reinforcement and corrections

**Atlas UX relevance:** The engine loop should capture and feed back structured results from tool executions. When Kelly (X publisher) attempts to post and gets a rate limit error, that structured feedback should be injected into the next reasoning cycle. The job system already captures success/failure, but richer diagnostic data in the `meta` field would improve agent self-correction.

**Trade-offs:**
- Turns repeated failures into measurable improvements
- Can increase runtime and operational cost due to iterative passes

---

## 3. Self-Critique Evaluator Loop

**Status:** Emerging | **Source:** Meta AI (Self-Taught Evaluators)

Train a self-taught evaluator that bootstraps from synthetic data:

1. Generate multiple candidate outputs for an instruction
2. Ask the model to judge and explain which is better (reasoning trace)
3. Fine-tune that judge on its own traces; iterate
4. Use the judge as a reward model or quality gate for the main agent
5. Periodically refresh with new synthetic debates to stay ahead of model drift

**Preventing evaluator collapse:**
- Keep evaluation prompts and generation prompts partially decoupled
- Inject adversarial counterexamples
- Benchmark against a small human-labeled anchor set
- Track disagreement rates between evaluator and human reviewers

**Atlas UX relevance:** The decision_memos system is a rudimentary evaluator loop. Atlas generates a proposal, the memo acts as a self-critique mechanism (documenting rationale, risk, alternatives), and the approval workflow is the quality gate. A more sophisticated version would have agents evaluate each other's outputs before publication.

---

## 4. CriticGPT-Style Evaluation

**Status:** Validated in production | **Source:** OpenAI

Deploy specialized AI models trained specifically for code critique and evaluation. These critic models work alongside generation models as an additional quality layer.

**Review dimensions:**
1. Bug detection (logic errors, off-by-one, null references, resource leaks)
2. Security audit (injection, XSS, hardcoded secrets, auth issues)
3. Quality review (readability, naming, DRY violations, error handling)
4. Performance analysis
5. Best practices check

**Integrated generation-review cycle:**
```python
for i in range(max_iterations):
    review = critic.review_code(code, context=task)
    critical_issues = [i for i in review['issues'] if i['severity'] > 0.8]
    if not critical_issues:
        break
    code = generator.regenerate(code, feedback=critical_issues)
```

**Atlas UX relevance:** Jenny (CLO - legal counsel) and Larry (Auditor) already serve CriticGPT-style roles in the agent hierarchy. Jenny evaluates actions for legal compliance, Larry audits for policy adherence. Both should receive structured output from other agents and return structured critique with severity scores and specific recommendations.

**Trade-offs:**
- Catches issues early and scales code review
- May have false positives requiring human verification
- Cannot fully understand business context

---

## 5. Anti-Reward-Hacking Grader Design

**Status:** Emerging | **Source:** Rogo Engineering, Will Brown (OpenAI)

During reinforcement learning, models actively search for ways to maximize reward. If your grader has loopholes, the model will find and exploit them.

**Core principles:**
1. **Make it hard to game** -- close loopholes systematically
2. **Provide gradient** -- use continuous scores (0.0-1.0) rather than binary
3. **Multi-criteria decomposition** -- evaluate multiple aspects
4. **Explainability** -- graders should explain their scores
5. **Adversarial testing** -- manually try to hack your grader before training

**Multi-criteria grading example:**
```python
weights = {
    'correctness': 0.50,
    'reasoning': 0.20,
    'completeness': 0.15,
    'citations': 0.10,
    'formatting': 0.05
}
final_score = sum(weights[k] * scores[k] for k in scores)
```

**Iterative hardening process:**
1. Design initial grader
2. Run training, watch for suspicious high reward
3. Inspect traces to identify gaming patterns
4. Add detection rules for discovered patterns
5. Update grader and retrain

**Real-world result (Rogo Finance):** After hardening, 21% real performance improvement with much lower hallucination rates. The model stopped gaming the metric and started genuinely solving tasks.

**Atlas UX relevance:** When evaluating agent performance (action quality, content quality, decision quality), use multi-criteria scoring rather than simple pass/fail. Tina (CFO) evaluating spending proposals should score on financial soundness (0.4), risk assessment (0.2), ROI projection (0.2), compliance (0.1), and documentation quality (0.1). This prevents agents from gaming any single criterion.

---

## 6. Incident-to-Eval Synthesis

**Status:** Emerging | **Source:** Codex (OpenAI)

Convert every production incident into one or more executable eval cases, then gate future changes on those cases.

**Pattern mechanics:**
1. Capture incident artifacts: inputs, context, tool traces, outputs, impact
2. Normalize sensitive data and derive a minimal reproducible scenario
3. Encode expected behavior as objective pass/fail criteria
4. Add the case to the evaluation corpus with severity and owner metadata
5. Run incident-derived evals in CI and release gates

```
incident = ingest_incident(ticket_id)
case = build_eval_case(
    prompt=redact(incident.prompt),
    tools=incident.tool_trace,
    expected=define_acceptance_criteria(incident)
)
suite.add(case, labels=["incident", incident.severity])
```

**Atlas UX relevance:** When an agent action fails (job status: failed, decision_memo rejected, social post flagged), the incident should be converted into a regression test for that agent. If Cheryl (Support) mishandles a customer inquiry, the scenario becomes a test case. The audit_log provides the artifact capture mechanism.

**Trade-offs:**
- Aligns evals with real risk, compounds operational learning
- Adds triage overhead, requires discipline in data capture

---

## 7. Spec-As-Test Feedback Loop

**Status:** Proposed | **Source:** Jory Pestorious

Generate executable assertions directly from specifications. The agent watches for spec or code commits, auto-regenerates the test suite from the latest spec snapshot, and runs tests. If failures appear, the agent opens a PR that either updates code to match spec or flags unclear spec segments for human review.

**Continuous feedback loop:**
```
Spec changes -> Generate tests -> Run tests
    |                                  |
    v                                  v
Code changes -> Run tests -> Pass/Fail
                               |
                        Auto-fix or flag
```

**Atlas UX relevance:** The SGL.md (System Governance Language) is the specification for agent behavior. Changes to SGL policies should automatically generate test scenarios that verify agents comply. If AUTO_SPEND_LIMIT_USD changes, tests should verify that all agents respect the new limit. The `workflowsRoutes.ts` definitions serve as workflow specifications that should have corresponding eval cases.

---

## 8. Workflow Evals with Mocked Tools

**Status:** Emerging

Test agent workflows by mocking tool responses, allowing evaluation without live API calls, external service dependencies, or real-world side effects.

**Approach:**
1. Record real tool call/response pairs during production
2. Build a mock tool layer that replays recorded responses
3. Run agent workflows against mocked tools
4. Evaluate outputs against expected outcomes
5. Flag behavioral changes when agent prompts or models change

**Benefits:**
- Deterministic testing (same inputs produce same tool responses)
- No API costs during evaluation
- Can test error handling by injecting mock failures
- Fast iteration on prompt changes

**Atlas UX relevance:** Agent workflows (WF-001 through WF-106) should have mocked eval suites. Mock the Outlook API, Slack API, and social media APIs to test agent behavior without making real external calls. This is especially important for testing spending-related workflows where real API calls could have financial consequences.

---

## 9. RLAIF: Reinforcement Learning from AI Feedback

**Status:** Emerging | **Source:** Based on Anthropic Constitutional AI concepts

Replace human feedback with AI-generated feedback to scale the training signal:

1. Generate multiple candidate outputs
2. Have an AI evaluator rank them based on defined criteria
3. Use the rankings as the reward signal for reinforcement learning
4. The AI evaluator itself is periodically calibrated against human judgments

**Key safeguard:** Maintain a small human-labeled anchor set and regularly check that AI feedback aligns with human preferences. Drift between AI and human evaluations signals evaluator degradation.

**Atlas UX relevance:** When multiple agents could handle a task (the auction pattern), RLAIF principles apply -- Atlas evaluates agent proposals using AI judgment calibrated against past human approval decisions from the decision_memos table. Over time, Atlas learns which proposals align with human preferences.

---

## 10. Inference-Healed Code Review Reward

**Status:** Emerging

Use inference-time scaling to heal noisy reward signals from automated code review. Instead of treating code review scores as ground truth, use multiple inference passes to separate genuine quality signals from reviewer noise.

**Approach:**
1. Generate code, submit for automated review
2. If review score is ambiguous (0.4-0.6 range), run additional inference passes
3. Aggregate across passes to identify stable quality signals
4. Use the healed signal as the reward

**Atlas UX relevance:** When Larry (Auditor) reviews agent actions and the assessment is ambiguous, the system could run additional evaluation passes with different prompts or models. This reduces the impact of any single review being off-target.

---

## 11. Dogfooding with Rapid Iteration

**Status:** Validated in production

Use your own agent system to build the agent system. This creates the tightest possible feedback loop -- you experience every failure mode firsthand.

**Rapid iteration cycle:**
1. Use agents for daily work
2. Notice friction points and failures
3. Fix immediately (same day or session)
4. Deploy and resume using the improved system
5. Repeat

**Why this works better than external testing:**
- You encounter real-world edge cases, not synthetic ones
- Motivation to fix issues is immediate (they block your own work)
- The feedback loop is minutes, not weeks

**Atlas UX relevance:** Atlas UX is built using Claude Code -- itself an agent. The development process dogfoods agentic workflows daily. Every session that produces MEMORY.md updates, CLAUDE.md refinements, and commit-history improvements is dogfooding in action.

---

## 12. Agent Reinforcement Fine-Tuning

**Status:** Emerging | **Source:** OpenAI Agent RFT

Fine-tune models on successful agent trajectories to improve their tool-use and reasoning capabilities:

1. Collect successful agent execution traces (tool calls, reasoning, outcomes)
2. Filter for high-quality trajectories (correct answers, efficient tool use)
3. Fine-tune the base model on these trajectories
4. Evaluate on held-out scenarios
5. Deploy and continue collecting new trajectories

**Key considerations:**
- Need reliable success/failure signals
- Grader design is critical (see anti-reward-hacking, pattern 5)
- Start with narrow domains before expanding
- Monitor for reward hacking during training

**Atlas UX relevance:** Agent execution traces are captured in the audit_log with full context. Successful workflows (job completed, decision approved, content published without issues) provide the positive trajectories. Failed workflows provide negative examples. This data could train specialized models for Atlas's specific agent roles.

---

## Atlas UX Integration Notes

Atlas UX's feedback architecture spans multiple levels:

**Immediate feedback (per-task):**
- Job status transitions (queued > running > completed/failed) provide binary feedback
- Tool execution results (API responses, error messages) provide structured feedback
- Decision memo approval/rejection provides human-in-loop feedback

**Operational feedback (cross-task):**
- Audit log captures all agent actions with outcomes for pattern analysis
- Agent Watcher provides live visibility into agent activity
- Failed jobs with error details enable self-correction in subsequent attempts

**Systemic feedback (cross-session):**
- Daily aggregation (WF-106) synthesizes agent performance across the day
- KB documents accumulate institutional knowledge
- MEMORY.md captures cross-session learning

**Priority improvements based on these patterns:**
- Add reflection loops to content-generating agents (Sunday, Reynolds) with quality rubrics
- Implement incident-to-eval synthesis: convert failed jobs into regression test cases
- Build multi-criteria scoring for decision_memo evaluation (pattern 5)
- Create mocked eval suites for critical workflows (pattern 8)
- Add rich diagnostic data to job failure records for better self-correction (pattern 2)
