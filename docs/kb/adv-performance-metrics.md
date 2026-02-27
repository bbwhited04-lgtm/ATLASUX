# Agent Performance Metrics & KPIs

> Atlas UX Knowledge Base — Advanced Operations
> Classification: Internal / Agent Training
> Version: 1.0 | Last Updated: 2026-02-27

---

## 1. Purpose

You cannot improve what you do not measure. Atlas UX tracks quantitative performance
metrics for every agent in the roster, from executive to publisher to support. This
document defines each metric, explains how it is calculated, sets targets per role,
and describes how metrics feed into composite health scores and performance dashboards.

---

## 2. Core Metrics

### 2.1 Task Completion Rate (TCR)

**Definition:** Percentage of assigned tasks completed successfully within the
allotted time window.

```
TCR = (tasks_completed_successfully / tasks_assigned) * 100
```

- A task is "completed successfully" if its quality score >= minimum threshold
  for the agent's role (see adv-self-evaluation.md).
- Tasks re-queued due to failure count against TCR.
- Tasks cancelled by the requester (not the agent) are excluded.

**Measurement period:** Rolling 7-day window.

### 2.2 Quality Score (QS)

**Definition:** Weighted composite of accuracy, completeness, relevance, and
timeliness as defined in the Self-Evaluation Framework.

```
QS = (Accuracy * 0.35) + (Completeness * 0.25) + (Relevance * 0.25) + (Timeliness * 0.15)
```

**Measurement:** Per-task, aggregated as a 7-day rolling average.

### 2.3 Response Time (RT)

**Definition:** Elapsed time from task assignment to output delivery.

```
RT = task.completedAt - task.assignedAt
```

- Measured in minutes.
- Excludes time spent waiting for external APIs or human approval.
- Tracked as both mean and P95 (95th percentile) per agent.

### 2.4 Cost Efficiency (CE)

**Definition:** Token consumption per task, normalized by task complexity.

```
CE = total_tokens_consumed / task_complexity_weight
```

Task complexity weights:
| Complexity | Weight | Example |
|-----------|--------|---------|
| Trivial | 1.0 | Status check, simple lookup |
| Low | 2.0 | Single-source research, template response |
| Medium | 4.0 | Multi-source analysis, content generation |
| High | 8.0 | Cross-domain synthesis, financial modeling |
| Critical | 16.0 | Legal review, strategic planning |

Lower CE is better. An agent that uses fewer tokens for equivalent output quality
is more cost-efficient.

### 2.5 Error Rate (ER)

**Definition:** Percentage of tasks containing material errors detected during
self-evaluation, peer review, or post-delivery feedback.

```
ER = (tasks_with_material_errors / tasks_completed) * 100
```

Error severity classification:
- **Critical:** Output is factually wrong and could cause harm if acted upon.
- **Major:** Output contains significant errors that affect conclusions.
- **Minor:** Output has cosmetic issues or minor inaccuracies.

Only critical and major errors count toward ER. Minor errors are tracked separately.

### 2.6 Creativity Score (CS)

**Definition:** Measures the novelty and originality of agent outputs, applicable
primarily to content-generating agents.

Assessed on three dimensions (1-5 each):
- **Novelty:** Does the output contain original ideas or perspectives?
- **Synthesis:** Does it combine information in unexpected but valid ways?
- **Engagement:** Would the target audience find this compelling?

```
CS = (Novelty + Synthesis + Engagement) / 3
```

**Applicable to:** Sunday, Reynolds, Kelly, Fran, Dwight, Timmy, Terry, Cornwell,
Link, Emma, Donna, Penny, Venny, Victor.

### 2.7 Collaboration Score (COLL)

**Definition:** Measures how effectively an agent works with other agents in
multi-step workflows.

Assessed on:
- **Handoff Quality:** Does the agent provide clean, complete inputs to downstream agents?
- **Responsiveness:** Does the agent respond to collaboration requests promptly?
- **Information Sharing:** Does the agent proactively share relevant discoveries?

```
COLL = (Handoff_Quality * 0.4) + (Responsiveness * 0.3) + (Info_Sharing * 0.3)
```

Scored 1-5 per dimension, aggregated weekly.

---

## 3. Role-Specific Metrics

### 3.1 Customer Satisfaction — Cheryl (Support)

| Metric | Definition | Target |
|--------|-----------|--------|
| CSAT | Customer Satisfaction Score (post-interaction survey, 1-5) | >= 4.2 |
| NPS | Net Promoter Score (-100 to +100) | >= 40 |
| First Contact Resolution | % of issues resolved without escalation | >= 80% |
| Avg Handle Time | Mean time to resolve a support ticket | < 15 min |
| Escalation Rate | % of tickets escalated to human or senior agent | < 15% |

### 3.2 Revenue Impact — Binky (CRO) & Mercer (Acquisition)

| Metric | Definition | Target |
|--------|-----------|--------|
| Leads Generated | New qualified leads per week | Binky: 50+, Mercer: 30+ |
| Lead Conversion Rate | % of leads progressing to next stage | >= 15% |
| Deal Value | Average value of closed deals | Tracked, no fixed target |
| Pipeline Velocity | Average days from lead to close | < 30 days |
| Revenue Attributed | Revenue directly attributable to agent actions | Tracked monthly |
| CAC Efficiency | Customer Acquisition Cost vs. industry benchmark | < 0.8x benchmark |

### 3.3 Compliance Score — Larry (Governor)

| Metric | Definition | Target |
|--------|-----------|--------|
| Policy Violations Detected | Number of SGL violations caught per week | Lower is better |
| False Positive Rate | % of flagged items that were actually compliant | < 10% |
| Audit Completeness | % of required audit entries present and correct | >= 99.5% |
| Regulatory Alignment | % of actions compliant with applicable regulations | 100% |
| Response to Violations | Mean time from detection to remediation | < 2 hours |

### 3.4 Financial Accuracy — Tina (CFO)

| Metric | Definition | Target |
|--------|-----------|--------|
| Calculation Accuracy | % of financial calculations verified as correct | >= 99.9% |
| Budget Variance | Deviation between projected and actual spend | < 5% |
| Cost Savings Identified | Opportunities flagged for cost reduction | Tracked weekly |
| Report Timeliness | % of financial reports delivered on schedule | 100% |
| Reconciliation Rate | % of transactions that reconcile without manual intervention | >= 98% |

### 3.5 Content Performance — Social Publishers

| Metric | Definition | Target |
|--------|-----------|--------|
| Post Frequency | Posts published per platform per week | Per-platform target |
| Engagement Rate | (likes + comments + shares) / impressions | >= 3% |
| Click-Through Rate | Link clicks / impressions | >= 1.5% |
| Audience Growth | Net new followers per week | >= 2% weekly growth |
| Content Mix Score | Balance across content types (educational, promotional, engagement) | Within 10% of target ratio |
| Brand Safety Score | % of posts passing brand safety review | 100% |

---

## 4. Composite Health Score

The Composite Health Score (CHS) provides a single number representing an agent's
overall operational health.

### 4.1 Formula

```
CHS = (TCR * W_tcr) + (QS_norm * W_qs) + (RT_norm * W_rt) + (CE_norm * W_ce)
      + (ER_inv * W_er) + (Role_Specific * W_role)
```

Where:
- `QS_norm` = QS / 5.0 (normalize to 0-1)
- `RT_norm` = 1 - (RT / RT_max) (inverted — faster is better)
- `CE_norm` = 1 - (CE / CE_max) (inverted — cheaper is better)
- `ER_inv` = 1 - (ER / 100) (inverted — fewer errors is better)
- `Role_Specific` = normalized role-specific KPI composite

### 4.2 Weight Distribution by Role

| Role | W_tcr | W_qs | W_rt | W_ce | W_er | W_role |
|------|-------|------|------|------|------|--------|
| Executive | 0.20 | 0.25 | 0.10 | 0.10 | 0.15 | 0.20 |
| Governor | 0.15 | 0.20 | 0.10 | 0.05 | 0.30 | 0.20 |
| Specialist | 0.20 | 0.30 | 0.10 | 0.10 | 0.15 | 0.15 |
| Publisher | 0.25 | 0.20 | 0.15 | 0.15 | 0.10 | 0.15 |
| Support | 0.20 | 0.20 | 0.20 | 0.05 | 0.10 | 0.25 |
| Research | 0.15 | 0.35 | 0.10 | 0.10 | 0.15 | 0.15 |

### 4.3 Health Score Interpretation

| CHS Range | Status | Action |
|-----------|--------|--------|
| 0.90-1.00 | Excellent | No action needed. Agent operating at peak. |
| 0.80-0.89 | Good | Minor optimization opportunities. |
| 0.70-0.79 | Adequate | Monitor closely. Identify improvement areas. |
| 0.60-0.69 | Concerning | Mandatory improvement plan within 48 hours. |
| < 0.60 | Critical | Suspend autonomous operation. Full review required. |

---

## 5. Benchmarking

### 5.1 Internal Benchmarks

Each agent is benchmarked against:
- **Own historical performance** (7-day, 30-day, 90-day trends)
- **Role peers** (e.g., Kelly vs. Fran vs. Dwight among publishers)
- **Cross-role norms** (all-agent averages for universal metrics)

### 5.2 Baseline Targets by Role

| Role | TCR | QS | RT (P95) | CE | ER | CHS |
|------|-----|-----|----------|-----|-----|------|
| Atlas (CEO) | 95% | 4.5 | 10 min | 3000 tok/wt | 2% | 0.90 |
| Binky (CRO) | 92% | 4.2 | 8 min | 2500 tok/wt | 3% | 0.85 |
| Tina (CFO) | 98% | 4.7 | 15 min | 2000 tok/wt | 0.5% | 0.92 |
| Larry (Compliance) | 97% | 4.6 | 12 min | 1800 tok/wt | 1% | 0.91 |
| Jenny (CLO) | 95% | 4.5 | 20 min | 3500 tok/wt | 1% | 0.88 |
| Sunday (Comms) | 93% | 4.3 | 10 min | 2800 tok/wt | 3% | 0.86 |
| Cheryl (Support) | 94% | 4.2 | 5 min | 1500 tok/wt | 3% | 0.87 |
| Archy (Research) | 90% | 4.5 | 30 min | 4000 tok/wt | 2% | 0.85 |
| Publishers (avg) | 95% | 4.0 | 8 min | 2000 tok/wt | 5% | 0.83 |
| Petra (PM) | 96% | 4.3 | 10 min | 2200 tok/wt | 2% | 0.88 |
| Mercer (Acquisition) | 88% | 4.1 | 15 min | 3000 tok/wt | 4% | 0.82 |

---

## 6. Performance Dashboards

### 6.1 Agent Health Dashboard (Real-Time)

Displayed in Agent Watcher (`/app/watcher`):
- Per-agent CHS with color-coded status indicator
- Sparkline of QS over the last 7 days
- Current task status (idle, working, waiting for approval)
- Last action timestamp and description
- Alert indicators for any metric below threshold

### 6.2 Executive Summary Dashboard (Daily)

Generated by WF-106 Atlas Daily Aggregation:
- Fleet-wide CHS average and distribution
- Top 3 performing agents and bottom 3 (with reasons)
- Total tasks completed, failed, and pending
- Total token consumption and cost
- Revenue impact summary (Binky + Mercer combined)
- Compliance incident count (Larry)

### 6.3 Trend Dashboard (Weekly)

- 7-day moving average of all core metrics per agent
- Week-over-week delta with directional indicators
- Correlation analysis (e.g., does RT increase correlate with QS decrease?)
- Forecasted metrics for next week based on trend extrapolation

---

## 7. Target Setting

### 7.1 SMART Targets

All performance targets follow the SMART framework:
- **Specific:** Tied to a named metric with clear definition.
- **Measurable:** Quantified with a numeric threshold.
- **Achievable:** Based on historical performance and realistic improvement curves.
- **Relevant:** Aligned with the agent's role and the platform's business objectives.
- **Time-bound:** Evaluated over defined periods (7-day, 30-day).

### 7.2 Target Progression

Targets escalate through maturity stages:

| Stage | Duration | Target Level | Rationale |
|-------|----------|-------------|-----------|
| Onboarding | Days 1-7 | Baseline - 10% | Agent is calibrating |
| Stabilization | Days 8-30 | Baseline | Agent should meet standard |
| Optimization | Days 31-90 | Baseline + 5% | Continuous improvement expected |
| Mastery | Day 91+ | Baseline + 10% | Agent should exceed standard |

### 7.3 Target Review

Targets are reviewed monthly by Atlas (CEO agent) in consultation with the
relevant domain governor. Adjustments require documented justification and
are logged to the audit trail.

---

## 8. Metric Collection & Storage

### 8.1 Collection Points

Metrics are collected at these system touchpoints:
- **Engine loop tick:** Task status transitions, timing data
- **Self-evaluation hook:** Quality scores, confidence values
- **Audit log write:** Action counts, error flags
- **External API callbacks:** Engagement data, customer feedback
- **Job queue status changes:** Completion/failure timestamps

### 8.2 Storage

All metrics are stored in the `audit_log` table with structured `meta` fields:

```json
{
  "action": "METRIC_SNAPSHOT",
  "entityType": "agent",
  "entityId": "agent_name",
  "meta": {
    "period": "2026-02-27",
    "tcr": 0.94,
    "qs_avg": 4.3,
    "rt_p95_min": 8.2,
    "ce_avg": 2450,
    "er": 0.02,
    "chs": 0.87,
    "role_metrics": { ... }
  }
}
```

### 8.3 Retention

- Raw per-task metrics: 90 days
- Daily aggregated snapshots: 1 year
- Weekly trend data: Indefinite

---

## 9. Alerting & Escalation

### 9.1 Threshold Alerts

| Condition | Severity | Notification |
|-----------|----------|-------------|
| CHS drops below 0.70 | Warning | Alert to Atlas via audit log |
| CHS drops below 0.60 | Critical | Suspend agent, alert to Atlas + Larry |
| ER exceeds 10% in any 24h period | Critical | Immediate task queue freeze |
| TCR drops below 80% for 3+ days | Warning | Performance review initiated |
| Any single task QS below 2.0 | Warning | Mandatory AAR triggered |

### 9.2 Escalation Path

```
Agent self-detection → Atlas (CEO) review → Larry (Compliance) audit
→ Human admin notification (if CHS < 0.50 or safety violation)
```

No agent can self-clear a critical alert. Clearance requires Atlas or human approval.
