# Agent Self-Evaluation Framework

> Atlas UX Knowledge Base — Advanced Operations
> Classification: Internal / Agent Training
> Version: 1.0 | Last Updated: 2026-02-27

---

## 1. Purpose

Every autonomous agent in the Atlas UX roster must evaluate its own output quality
before marking a task as complete. Self-evaluation is not optional — it is enforced
by SGL governance and recorded in the audit trail. An agent that cannot accurately
assess its own work is an agent that cannot be trusted to operate unsupervised.

This document defines the scoring rubrics, calibration protocols, and verification
pipelines that agents use to maintain output quality above baseline thresholds.

---

## 2. Output Quality Scoring Rubric

Each completed task is scored across four dimensions on a 1-5 scale.

### 2.1 Accuracy (Weight: 35%)

| Score | Definition |
|-------|-----------|
| 5 | All claims factually correct, all data points verified against primary sources |
| 4 | Substantively correct with minor imprecisions that do not affect conclusions |
| 3 | Core claims correct but contains errors in supporting detail |
| 2 | Contains material errors that affect the reliability of the output |
| 1 | Fundamentally incorrect or misleading output |

### 2.2 Completeness (Weight: 25%)

| Score | Definition |
|-------|-----------|
| 5 | Addresses every aspect of the task brief, anticipates follow-up questions |
| 4 | Covers all required elements with minor gaps in peripheral detail |
| 3 | Addresses the primary ask but omits secondary requirements |
| 2 | Significant gaps that require a follow-up task to fill |
| 1 | Incomplete to the point of being unusable without rework |

### 2.3 Relevance (Weight: 25%)

| Score | Definition |
|-------|-----------|
| 5 | Every element directly serves the task objective with no filler |
| 4 | Highly relevant with minimal tangential content |
| 3 | Relevant core but includes noticeable off-topic material |
| 2 | Substantial irrelevant content dilutes the useful output |
| 1 | Output does not address the actual task objective |

### 2.4 Timeliness (Weight: 15%)

| Score | Definition |
|-------|-----------|
| 5 | Completed well within deadline, data freshness requirements met |
| 4 | On-time completion, all temporal constraints satisfied |
| 3 | Slight delay or minor freshness issues |
| 2 | Missed deadline or uses stale data that affects reliability |
| 1 | Critically late or based on obsolete information |

### Composite Quality Score

```
QS = (Accuracy * 0.35) + (Completeness * 0.25) + (Relevance * 0.25) + (Timeliness * 0.15)
```

- **QS >= 4.0** — Output approved for delivery without review.
- **QS 3.0-3.9** — Output flagged for peer review by a senior agent.
- **QS < 3.0** — Output rejected. Task re-queued with failure annotation.

---

## 3. Confidence Calibration

### 3.1 The Calibration Problem

An agent that reports 90% confidence should be correct 90% of the time. In practice,
LLM-based agents exhibit systematic overconfidence. Atlas UX addresses this through
explicit calibration tracking.

### 3.2 Confidence Buckets

After each task, the agent logs a confidence value (0.0 to 1.0). These are bucketed:

| Bucket | Expected Accuracy | Alarm Threshold |
|--------|-------------------|-----------------|
| 0.90-1.00 | 90-100% | Actual < 80% triggers recalibration |
| 0.70-0.89 | 70-89% | Actual < 60% triggers recalibration |
| 0.50-0.69 | 50-69% | Actual < 40% triggers recalibration |
| < 0.50 | Below 50% | Agent should escalate, not self-resolve |

### 3.3 Calibration Exercises

Weekly, the engine loop dispatches calibration tasks (WF-internal) to each agent:

1. **Fact Verification Set** — 20 claims, half true, half false. Agent rates confidence.
2. **Estimation Tasks** — Numeric estimates with known answers. Agent provides ranges.
3. **Ambiguity Resolution** — Deliberately ambiguous prompts. Agent must identify the
   ambiguity rather than guess.

Results are stored in `audit_log` with `action: "CALIBRATION_CHECK"` and compared
against prior weeks. Degradation beyond 10% triggers an alert to Atlas (CEO agent).

---

## 4. Self-Critique Protocol

After completing any task, the agent executes the following self-critique sequence
before returning the result. This is embedded in the agent's system prompt via SGL.

### 4.1 Four-Question Protocol

```
SELF_CRITIQUE:
  1. What did I do well in this task?
     → Identify specific strengths to reinforce.
  2. What could I improve?
     → Identify weaknesses without catastrophizing.
  3. What did I miss?
     → Actively search for blind spots and omissions.
  4. What assumptions did I make?
     → Surface implicit assumptions and evaluate their validity.
```

### 4.2 Protocol Enforcement

- The self-critique block is appended to the agent's internal reasoning trace.
- If any answer to questions 2-4 identifies a material issue, the agent must
  either fix the output or downgrade its confidence score before submission.
- The full self-critique is written to the audit log as structured JSON under
  `meta.selfCritique`.

### 4.3 Assumption Classification

| Type | Risk | Action |
|------|------|--------|
| Verified assumption | Low | Proceed, cite verification source |
| Reasonable assumption | Medium | Proceed with explicit caveat |
| Unverified assumption | High | Halt, escalate for human input |
| Contradicted assumption | Critical | Reject own output, re-plan |

---

## 5. Metacognitive Monitoring

Metacognition — thinking about thinking — is the mechanism that prevents an agent
from confidently producing garbage. Atlas UX agents implement three metacognitive
checkpoints during task execution.

### 5.1 Pre-Task Check

Before beginning work:
- Do I understand the task objective?
- Do I have access to the required data sources?
- Am I the right agent for this task? (Role alignment check against agent roster)
- Is this within my authority under SGL constraints?

### 5.2 Mid-Task Check

At approximately 50% completion:
- Am I still on track with the original objective?
- Has the complexity exceeded my initial estimate?
- Should I request collaboration from another agent?
- Am I approaching any safety guardrails (spend limits, action caps)?

### 5.3 Post-Task Check

After generating output but before submission:
- Execute the four-question self-critique protocol (Section 4).
- Calculate the quality score (Section 2).
- Log confidence calibration data (Section 3).
- Determine if the output meets the minimum QS threshold for autonomous delivery.

---

## 6. The Verification Sub-Agent (Deep Mode)

For high-stakes tasks (risk tier >= 2 or spend above AUTO_SPEND_LIMIT_USD), Atlas UX
activates a three-stage verification pipeline using a dedicated verification context.

### 6.1 Stage 1: Fact Check

- Extract every factual claim from the agent's output.
- Classify each as verifiable, opinion, or projection.
- Verify each verifiable claim against the knowledge base and approved sources.
- Flag any claim that cannot be verified.

### 6.2 Stage 2: Logic Check

- Trace the reasoning chain from inputs to conclusions.
- Identify logical fallacies, non-sequiturs, or unsupported leaps.
- Verify that conclusions follow from the evidence presented.
- Check for internal contradictions.

### 6.3 Stage 3: Compliance Check

- Verify the output complies with SGL governance rules.
- Confirm audit trail entries are complete and accurate.
- Check that the agent operated within its role boundaries.
- Validate that any financial implications are within approved limits.

### Pipeline Output

The verification sub-agent produces a `VerificationReport`:

```typescript
interface VerificationReport {
  taskId: string;
  agentId: string;
  factCheckScore: number;      // 0.0 - 1.0
  logicCheckScore: number;     // 0.0 - 1.0
  complianceCheckScore: number; // 0.0 - 1.0
  overallPass: boolean;
  issues: VerificationIssue[];
  recommendation: "approve" | "revise" | "reject";
}
```

A task only proceeds if `overallPass === true` or a human approves the decision memo.

---

## 7. Audit Trail Feedback Loop

Self-evaluation data feeds back into agent improvement through the audit trail.

### 7.1 Data Flow

```
Task Completion
  → Self-Critique (logged to audit_log.meta.selfCritique)
  → Quality Score (logged to audit_log.meta.qualityScore)
  → Confidence Value (logged to audit_log.meta.confidence)
  → Verification Report (if deep mode, logged separately)
  → Weekly Aggregation (WF-106 Atlas Daily Aggregation)
  → Performance Dashboard (Agent Performance Metrics)
  → Calibration Adjustment (next week's system prompt tuning)
```

### 7.2 Trend Detection

The aggregation pipeline watches for:
- **Score degradation** — QS dropping over 3+ consecutive tasks.
- **Confidence drift** — Systematic over- or under-confidence.
- **Blind spot patterns** — Recurring misses in the same category.
- **Role creep** — Agent consistently flagging tasks outside its role.

---

## 8. Self-Evaluation Templates by Task Type

### Content Generation (Sunday, Reynolds, social publishers)
- Accuracy: Are all facts and statistics correct?
- Completeness: Does the content cover the brief? Correct length?
- Relevance: Is the tone and topic aligned with the target audience?
- Timeliness: Is the content timely and not referencing outdated events?

### Financial Analysis (Tina CFO)
- Accuracy: Are all calculations correct? Do totals reconcile?
- Completeness: Are all required financial periods covered?
- Relevance: Does the analysis answer the specific financial question?
- Timeliness: Is the data from the correct reporting period?

### Research (Archy)
- Accuracy: Are sources primary and authoritative?
- Completeness: Were at least 3 independent sources consulted?
- Relevance: Does the research directly inform the requesting task?
- Timeliness: Are all sources within the required freshness window?

### Customer Support (Cheryl)
- Accuracy: Is the resolution correct and actionable?
- Completeness: Were all customer concerns addressed?
- Relevance: Is the response appropriate for the customer's technical level?
- Timeliness: Was the response within the SLA window?

### Legal Review (Jenny CLO)
- Accuracy: Are legal citations correct and current?
- Completeness: Were all relevant jurisdictions and regulations considered?
- Relevance: Does the advice address the specific legal question?
- Timeliness: Are referenced statutes and case law current?

---

## 9. Performance Baselines

Minimum acceptable scores for autonomous operation (no human review):

| Agent Role | Min QS | Min Confidence Calibration | Max Rejection Rate |
|------------|--------|----------------------------|-------------------|
| Executive (Atlas, Binky) | 4.2 | +/- 10% | 5% |
| Governor (Tina, Larry) | 4.5 | +/- 5% | 3% |
| Specialist (Jenny, Benny) | 4.3 | +/- 8% | 5% |
| Publisher (Kelly, Fran, etc.) | 3.8 | +/- 12% | 10% |
| Support (Cheryl) | 4.0 | +/- 10% | 5% |
| Research (Archy, Daily-Intel) | 4.4 | +/- 7% | 5% |

Agents falling below baseline for 5 consecutive tasks are suspended from autonomous
operation and require human approval for all subsequent outputs until recalibrated.

---

## 10. Integration with SGL Governance

Self-evaluation is referenced in SGL policy as a mandatory post-task hook:

```
POLICY self_evaluation_required {
  TRIGGER: task.status == "completed"
  REQUIRE: selfCritique.executed == true
  REQUIRE: qualityScore.calculated == true
  REQUIRE: qualityScore.value >= agent.role.minQS
  ON_FAIL: task.status = "needs_review"
  AUDIT: always
}
```

No task can transition to `completed` status without a recorded self-evaluation.
This is enforced at the engine loop level in `workers/engineLoop.ts`.
