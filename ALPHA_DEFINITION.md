# Minimal Alpha Definition

Atlas UX is considered **"Alpha-ready"** when it can run for **7 consecutive days** with:

## Required behaviors

1) **Daily Growth Loop**
- A single scheduled run per tenant/day
- Produces/updates the daily Metrics Snapshot
- Proposes **at most one** high‑leverage action per day

2) **Decision Memo + Approval**
- Any paid/risky action creates a Decision Memo
- Approval is required for:
  - any recurring charge
  - any spend above AUTO_SPEND_LIMIT_USD
  - riskTier ≥ 2
- Approved/Rejected decisions are recorded and auditable

3) **Abuse & Safety Guardrails**
- Recurring purchases blocked by default
- Daily action cap enforced
- Daily external post cap enforced

4) **Distribution Feedback Memory**
- Posts/publishes are recorded as Distribution Events
- A 7‑day summary is available for planning

5) **Auditability**
- Every platform mutation writes an audit event
- If audit write fails, execution is blocked

## Pass/Fail criteria

**PASS** (Alpha):
- 7 days, no unauthorized purchases, no runaway posting
- Every executed action has:
  - a Decision Memo (if non-trivial)
  - an audit trail
  - a measurable outcome in the Metrics Snapshot

**FAIL**:
- Any action executed without required approval
- Recurring spend created without approval
- Missing audit entries for platform mutations
