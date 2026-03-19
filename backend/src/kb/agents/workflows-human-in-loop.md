# Human-in-the-Loop (HIL) Workflows — When and How to Insert Human Gates

## Why Machines Still Need Humans

Fully autonomous workflows are the goal, but reality demands guardrails. AI models hallucinate. Business rules have exceptions. Customers expect a human when stakes are high. Human-in-the-loop (HIL) design puts human judgment at exactly the right points — not everywhere (that defeats automation) and not nowhere (that creates disasters).

The sweet spot: **automate the 80% that's routine, gate the 20% that's risky.**

## When to Insert a Human Gate

### The Risk-Based Decision Matrix

| Signal | Auto-Execute | Human Review | Human Approval |
|--------|-------------|-------------|----------------|
| **Financial impact** | < $50 | $50-500 | > $500 |
| **AI confidence** | > 0.9 | 0.7-0.9 | < 0.7 |
| **Reversibility** | Easily reversed | Partially reversible | Irreversible |
| **Audience** | Internal only | Known customers | Public/legal |
| **Data sensitivity** | Public data | Customer data | PII/financial |
| **Precedent** | Established pattern | Similar cases exist | First time / novel |
| **Compliance** | No requirements | Industry guidelines | Legal mandate |

### Common HIL Trigger Patterns

1. **Confidence threshold** — AI classifies a request but isn't sure enough
2. **Spend threshold** — Action costs more than the auto-approve limit
3. **Exception handling** — Workflow hits a case it wasn't designed for
4. **Compliance gate** — Regulation requires human sign-off (HIPAA, SOX, GDPR)
5. **Customer escalation** — Customer explicitly requests a human
6. **Novel situation** — First occurrence of a pattern (no precedent)
7. **Quality check** — Sampling N% of automated decisions for review
8. **Batch approval** — Reviewing a batch before mass execution

## HIL Approval Patterns

### Pattern 1: Gate Before Execution

The most common pattern. Workflow pauses before a critical step.

```text
[Automated steps] --> [GATE: Human approves] --> [Execute critical action]
```

**Implementation:**

```typescript
interface ApprovalGate {
  id: string;
  workflow_id: string;
  step_name: string;
  requester: string;
  approver_role: string;
  payload: Record<string, any>;
  context: string;
  status: "pending" | "approved" | "rejected" | "expired";
  created_at: Date;
  decided_at?: Date;
  decided_by?: string;
  ttl_hours: number;
  escalation_after_hours?: number;
}
```

**Example - Atlas UX Decision Memo:**

Lucy receives a call. Customer requests recurring service. A decision memo is created (risk tier >= 2). Atlas (CEO agent) or human reviews. If approved, schedule recurring appointments. If rejected, Lucy informs customer and offers alternatives.

### Pattern 2: Review After Execution

Action happens immediately but is reviewed afterward. Used when speed matters more than perfection and actions are reversible.

```text
[Execute action] --> [Log for review] --> [Human reviews batch] --> [Correct if needed]
```

**Use cases:**
- AI-generated social media posts (publish, then review)
- Auto-replies to low-priority tickets
- Data enrichment (fill fields, human verifies)

**Risk:** Corrections happen after the fact. Only use for reversible, low-impact actions.

### Pattern 3: Escalation Chain

Multiple approval levels based on risk/value thresholds.

| Amount | Approver |
|--------|----------|
| < $100 | Auto-approve |
| $100-999 | Manager |
| $1,000-4,999 | Director |
| >= $5,000 | VP |

### Pattern 4: Sampling Review

Only review a percentage of automated decisions. Used for quality assurance at scale.

```text
[Auto-execute 100 decisions] --> [Flag 10% for review] --> [Human reviews sample]
If error rate > threshold --> [Pause automation, review all]
```

### Pattern 5: Collaborative Decision

Human and AI work together on the same decision. AI provides analysis, human makes the call.

```text
[AI analyzes data] --> [Present analysis + recommendation to human] --> [Human decides] --> [Execute]
```

**Example:** AI presents an invoice aging report with payment history, risk score, and recommended action. Human reviews and either accepts the recommendation or overrides it.

## Designing HIL Steps

### Step Anatomy

Every HIL step needs these components:

| Component | Purpose | Example |
|-----------|---------|---------|
| **Trigger** | What causes the pause | Confidence < 0.7 |
| **Context** | What the human needs to decide | Full request + AI analysis |
| **Options** | What actions are available | Approve / Reject / Modify / Escalate |
| **Deadline** | When the decision expires | 4 hours for P2, 24 hours for P3 |
| **Escalation** | What happens if no response | Auto-escalate to next level |
| **Audit** | How the decision is recorded | Decision memo with rationale |

### Context Presentation

The biggest failure mode in HIL workflows: giving humans too little context or too much noise.

**Good context includes:**
- What happened (the trigger event)
- What the AI recommends (with confidence score)
- What the AI considered (key factors)
- What the options are (with consequences of each)
- How urgent it is (deadline and escalation path)

**Bad context includes:**
- Raw data dumps (100 rows of logs)
- Technical jargon (for non-technical approvers)
- Multiple unrelated decisions bundled together
- No recommendation (just "what do you want to do?")

### Timeout and Escalation

Every HIL step MUST have a timeout. Without one, workflows stall forever.

| Urgency | Timeout | Escalation |
|---------|---------|------------|
| Critical (P1) | 15 minutes | Auto-page on-call + manager |
| High (P2) | 4 hours | Notify manager |
| Medium (P3) | 24 hours | Re-notify, CC manager |
| Low (P4) | 72 hours | Auto-approve if low risk, else auto-reject |

**Timeout strategies:**
- **Auto-approve** — If the action is low-risk and reversible (e.g., sending a reminder email)
- **Auto-reject** — If the action is high-risk (e.g., financial transactions)
- **Auto-escalate** — Send to the next level in the chain
- **Auto-defer** — Queue for next business day review

## Atlas UX HIL Implementation

Atlas UX uses several HIL patterns throughout its platform:

### Decision Memos

The primary HIL mechanism. High-risk actions create a `decision_memo` record that must be approved before execution.

**Triggers:**
- Spend above `AUTO_SPEND_LIMIT_USD`
- Risk tier >= 2
- Recurring charges (blocked by default)
- Novel action types (no precedent)

**Flow:**
1. Agent identifies action needs approval
2. Creates decision memo with context, recommendation, risk assessment
3. Routes to Atlas (CEO agent) or human owner
4. Approver reviews and decides
5. Decision logged to audit trail
6. Action executes (or not)

### Confidence-Based Routing

Lucy routes calls based on AI confidence:

| Confidence | Action |
|------------|--------|
| >= 0.9 | Auto-execute (book appointment, send SMS) |
| 0.7-0.9 | Execute with review flag |
| < 0.7 | Route to human agent |

### Daily Action Cap

Even auto-approved actions have a hard ceiling: `MAX_ACTIONS_PER_DAY`. When reached, all further actions queue for human review. This prevents runaway automation.

### Audit Trail as HIL Safety Net

Every mutation is logged to `audit_log` with hash chain integrity (SOC 2 CC7.2). Even when no explicit HIL gate exists, the audit trail enables after-the-fact review. If something goes wrong, the full chain of events is reconstructable.

## Anti-Patterns

### 1. Approve Everything

If humans rubber-stamp every request, the gate is theater. Fix: reduce the number of gates to only truly critical decisions. Auto-approve the rest.

### 2. No Context

Presenting a bare "Approve?" with no details. Fix: always include the trigger, AI recommendation, confidence score, and consequences.

### 3. No Timeout

Workflow pauses indefinitely waiting for approval. Fix: every gate has a TTL and escalation path.

### 4. Wrong Approver

Routing technical decisions to non-technical managers, or low-value decisions to senior executives. Fix: match approver expertise and authority to the decision type.

### 5. Too Many Gates

Every step requires approval, defeating the purpose of automation. Fix: use the risk matrix to identify only the steps that genuinely need human judgment. Automate everything else.

### 6. No Feedback Loop

Human decisions are never used to improve the AI. Fix: track approval rates, override reasons, and use them to retrain classifiers and adjust confidence thresholds.

## Metrics to Track

| Metric | Target | What It Tells You |
|--------|--------|-------------------|
| Approval rate | 80-95% | If > 95%, gates may be too lenient. If < 80%, AI needs tuning. |
| Decision time | < SLA | How fast humans respond |
| Override rate | < 20% | How often humans disagree with AI |
| Timeout rate | < 5% | Whether escalation paths work |
| False positive rate | < 10% | How often gates trigger unnecessarily |
| Automation rate | > 80% | Overall percentage of decisions handled without humans |

## Resources

- [Google PAIR — Human-AI Interaction Guidelines](https://pair.withgoogle.com/guidebook/) — Google's research-backed guidelines for designing human-AI collaboration, including when and how to involve humans in AI decisions
- [Microsoft HAX Toolkit — Human-AI Experience](https://www.microsoft.com/en-us/haxtoolkit/) — Microsoft's toolkit for designing responsible human-AI interaction patterns with practical design guidelines

## Image References

1. Human-in-the-loop decision flowchart — "human in the loop decision flowchart AI confidence threshold routing"
2. Approval gate workflow diagram — "approval gate workflow pause resume human review automation diagram"
3. Escalation chain hierarchy — "escalation chain hierarchy approval levels manager director VP diagram"
4. Risk matrix for HIL placement — "risk matrix human review automation decision financial impact reversibility"
5. HIL metrics dashboard — "human in loop metrics dashboard approval rate decision time automation rate"

## Video References

1. [Human-in-the-Loop AI Systems — Stanford HAI](https://www.youtube.com/watch?v=orG0t4cx7DE) — Stanford's research on designing effective human-AI collaboration workflows
2. [Building Responsible AI with Human Oversight — Microsoft Research](https://www.youtube.com/watch?v=eFxCnDZ2FN0) — Practical patterns for inserting human judgment into automated pipelines
