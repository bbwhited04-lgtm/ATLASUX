# Safety Guardrails

## Overview

Atlas UX enforces hard safety guardrails at every level of the platform. These are not suggestions or best practices — they are enforced constraints that cannot be bypassed by agents, workflows, or configuration changes. Safety is the non-negotiable foundation of the platform.

## Core Safety Mechanisms

### MAX_ACTIONS_PER_DAY

Every agent has a daily action cap defined by the `MAX_ACTIONS_PER_DAY` environment variable. This prevents runaway automation scenarios where an agent enters a loop or receives malformed instructions.

**How it works:**
- Each agent action increments a daily counter
- When the counter reaches the cap, the agent is suspended for the remainder of the day
- The counter resets at midnight UTC
- Suspended agents generate an alert to human operators
- The cap applies per-agent, not globally — one agent hitting its limit does not affect others

**Why it matters:** Without action caps, a misconfigured agent could generate thousands of emails, API calls, or database mutations before anyone notices. The cap ensures there is always a finite blast radius.

### AUTO_SPEND_LIMIT_USD

The `AUTO_SPEND_LIMIT_USD` environment variable sets the maximum dollar amount an agent can spend without human approval.

**How it works:**
- Every financial action is evaluated against this threshold
- Amounts below the limit proceed if all other conditions are met (confidence, risk tier)
- Amounts at or above the limit trigger a mandatory Decision Memo
- The limit applies per-transaction, and separate daily aggregate tracking is also enforced

**Typical Alpha values:** $25-50 per transaction, depending on organization risk tolerance.

### Daily Posting Cap

Social media agents have a per-platform daily posting limit that prevents content flooding:

**How it works:**
- Each publishing agent tracks posts per platform per day
- When the cap is reached, additional posting attempts are queued for the next day
- The cap is separate from `MAX_ACTIONS_PER_DAY` — an agent might take many actions (drafting, editing, scheduling) but only a limited number result in published posts

**Why it matters:** Over-posting damages brand reputation and can trigger platform-level penalties (rate limits, shadowbans, account suspensions).

### Recurring Purchase Blocks

During the Alpha period, all recurring financial commitments are blocked by default:

- Subscription sign-ups require explicit approval
- Recurring payment authorizations are always escalated
- Monthly/annual billing commitments generate Decision Memos regardless of amount
- This constraint cannot be overridden by agent confidence or role permissions

**Why it matters:** Recurring charges represent unbounded financial exposure. A $10/month subscription seems harmless, but 50 such subscriptions across multiple agents adds up quickly.

## Audit Trail Requirements

Every mutation in Atlas UX is logged to the `audit_log` table. This is a hard requirement — not optional, not configurable.

### What Gets Logged
- **All agent actions**: Every tool call, decision, and state change
- **All API mutations**: Creates, updates, deletes across all endpoints
- **All approval workflow events**: Memo creation, review, approval, denial
- **All authentication events**: Login, logout, token refresh, failed attempts
- **All financial events**: Transactions, refunds, billing changes

### Audit Log Structure
Each entry records:
- `tenantId` — Which organization
- `actorType` — Agent, user, or system
- `actorUserId` / `actorExternalId` — Who performed the action
- `level` — Severity (info, warn, error, critical)
- `action` — What was done
- `entityType` / `entityId` — What was affected
- `message` — Human-readable description
- `meta` — Structured JSON with additional context
- `timestamp` — When it happened

### Audit Immutability
Audit log entries cannot be modified or deleted through the application. They are append-only by design.

## Confidence Threshold Enforcement

The `CONFIDENCE_AUTO_THRESHOLD` determines the minimum confidence score required for autonomous execution:

| Score | Outcome |
|---|---|
| Above threshold | Autonomous execution permitted (if other guardrails pass) |
| Below threshold | Decision Memo required |
| Below 0.5 | Action blocked — escalated to human operator |

## Multi-Layer Enforcement

Safety is enforced at three layers:

1. **Engine Layer** — The orchestration engine checks all constraints before dispatching a job
2. **Agent Layer** — Each agent re-evaluates constraints in its own context
3. **Database Layer** — Database triggers and constraints provide a final safety net

This defense-in-depth approach means a failure at any single layer does not compromise overall safety.

## Alpha-Specific Constraints

During the Alpha period, additional conservative constraints are active:
- Lower default spend limits
- Stricter confidence thresholds
- All recurring charges blocked
- Enhanced logging verbosity
- Human-in-the-loop required for all external communications
- 7-day stability test criteria must be continuously met

## Monitoring and Alerts

When guardrails are triggered, the system generates alerts through:
- Dashboard notifications
- Telegram messages to configured operators
- Audit log entries with elevated severity
- Agent Watcher real-time activity feed

## Key Takeaways

1. Safety guardrails are enforced, not advisory — agents cannot bypass them.
2. Multiple independent limits (actions, spend, posting, confidence) create overlapping protection.
3. The audit trail is comprehensive, immutable, and always-on.
4. Alpha constraints are intentionally conservative and will be relaxed as the platform matures.
5. Defense-in-depth means no single point of failure in safety enforcement.
