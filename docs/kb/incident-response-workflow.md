# Incident Response Workflow

## Overview

When an agent encounters an error, a structured incident response workflow activates. This system ensures that failures are detected, classified, escalated appropriately, and resolved with full audit trail documentation. The workflow balances automated recovery with human-in-the-loop oversight for serious incidents.

## Severity Levels

All incidents are classified into one of four severity levels:

| Severity | Name           | Definition                                         | Response   | Resolution  |
|----------|----------------|---------------------------------------------------|------------|-------------|
| P0       | System Down    | Platform unavailable or critical subsystem failed  | < 5 min    | < 1 hour    |
| P1       | Data Integrity | Incorrect data, corrupted records, safety violation| < 15 min   | < 4 hours   |
| P2       | Feature Broken | Specific capability broken, platform operational   | < 1 hour   | < 24 hours  |
| P3       | Cosmetic/Minor | Minor issue, no impact on core functionality       | < 24 hours | Next window |

P0 examples: database down, engine loop stopped, auth failure. P1 examples: unapproved action executed, wrong financial amount, missing audit entries. P2 examples: single agent workflow failure, stuck email job, expired OAuth token. P3 examples: stale dashboard data, UI glitch, slow responses.

## Escalation Chain

```
Agent (detects error)
    |
    v
Cheryl (Support) — Triage and initial response
    |
    v
Petra (PM) — Coordination and resource allocation
    |
    v
Atlas (CEO) — Executive decision and external communication
```

### Step 1: Agent Detection

When an agent encounters an error during task execution:

1. The error is caught by the engine loop's error handler
2. An `audit_log` entry is created with `level: "error"` and full stack trace in `meta`
3. The job status is updated to `failed` in the `jobs` table
4. The agent assesses whether the error is retryable

### Step 2: Auto-Retry Logic

Before escalating, the system attempts automatic recovery:

- **Attempt 1**: Immediate retry (0 second delay)
- **Attempt 2**: Retry after 5 seconds (exponential backoff)
- **Attempt 3**: Retry after 25 seconds (exponential backoff)

Each retry attempt is logged to the audit trail. If the third attempt succeeds, the incident is marked as "auto-resolved" and no escalation occurs. The incident is still recorded for pattern analysis.

If all three attempts fail, the incident escalates to Cheryl.

### Step 3: Cheryl — Triage

Cheryl receives the incident via internal notification and performs:

1. **Classification**: Assigns severity level (P0-P3) based on impact assessment
2. **Initial Diagnosis**: Reviews error logs, recent audit entries, and job history
3. **Immediate Mitigation**: For P0/P1, Cheryl may pause the affected agent or workflow to prevent further damage
4. **Communication**: Notifies affected parties (tenant admin for customer-facing issues)
5. **Documentation**: Creates an incident record with timeline, affected systems, and initial findings

Cheryl escalates to Petra if:
- Severity is P0 or P1
- The issue requires cross-agent coordination
- Resolution requires code or configuration changes
- The issue has persisted for more than 2 hours (any severity)

### Step 4: Petra — Coordination

Petra takes ownership of incident coordination:

1. **Resource Allocation**: Assigns the right agents or flags for human developer intervention
2. **Impact Assessment**: Determines which workflows, customers, and agents are affected
3. **Workaround Development**: Implements temporary fixes to restore service while root cause is addressed
4. **Timeline Management**: Sets and communicates expected resolution time
5. **Status Updates**: Provides regular updates to Atlas and affected stakeholders

Petra escalates to Atlas if:
- Severity is P0
- Financial impact exceeds `AUTO_SPEND_LIMIT_USD`
- Customer data may have been compromised
- Resolution requires executive decision (e.g., rolling back a deployment)

### Step 5: Atlas — Executive Response

Atlas handles the highest-severity incidents:

1. **Decision Authority**: Makes go/no-go decisions on major recovery actions
2. **External Communication**: Drafts customer-facing incident communications if needed
3. **Board Notification**: For P0 incidents, notifies the board (Chairman agent) via the weekly summary or immediate memo
4. **Post-Incident Authority**: Commissions the post-incident review

## Audit Trail Logging

Every step of the incident response creates audit entries with `entityType: "incident"`, the appropriate `level` ("warn" or "error"), and `meta` containing severity, affected workflow, affected agent, retry attempts, auto-resolve status, and escalation target. Actions follow the pattern `incident.detected`, `incident.triage`, `incident.escalated`, `incident.resolved`.

## Post-Incident Review

After every P0 or P1 incident (and optionally for P2), a post-incident review is conducted:

1. **Timeline Reconstruction**: Minute-by-minute account from detection to resolution
2. **Root Cause Analysis**: What failed and why, using the "5 Whys" method
3. **Impact Assessment**: Quantified impact on customers, revenue, and operations
4. **Corrective Actions**: Specific changes to prevent recurrence
5. **Process Improvements**: Updates to runbooks, monitoring, or escalation procedures

The review document is stored in `kb_documents` with tag `post-incident-review` and linked to the original incident in the audit log.

## Monitoring Integration

The Agent Watcher (`/app/watcher`) provides real-time visibility into incidents:
- Error-level audit entries are highlighted in red
- Active incidents show a banner with severity, status, and assigned responder
- Historical incidents can be filtered and reviewed through the audit log viewer

## Metrics Tracked

- Mean Time to Detect (MTTD)
- Mean Time to Respond (MTTR)
- Mean Time to Resolve
- Incidents by severity per week
- Auto-resolve rate (percentage resolved without escalation)
- Repeat incident rate (same root cause recurring)
