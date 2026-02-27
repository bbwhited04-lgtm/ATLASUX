# Alpha Compliance

## What is the Alpha Phase?

Atlas UX is currently in its Alpha release phase, which centers on a structured 7-day stability test. The Alpha phase exists to validate that the platform's autonomous agents can operate safely, reliably, and predictably under real-world conditions before the system is opened to broader use.

Alpha is not just a label — it comes with specific constraints, monitoring requirements, and success criteria that must be met continuously.

## The 7-Day Stability Test

The stability test is a continuous 7-day period during which the platform must meet all defined criteria without interruption. If a criterion is violated, the 7-day clock resets.

### Success Criteria

**Uptime**
- API server must maintain 99%+ uptime
- Engine loop must tick consistently without gaps exceeding 2x the configured interval
- All worker processes (email, scheduler, engine) must remain running

**Safety**
- Zero unreviewed high-risk actions (risk tier 3+)
- All Decision Memos generated and resolved appropriately
- No safety guardrail bypasses
- No unintended financial transactions

**Data Integrity**
- Zero data leaks across tenants
- Audit log completeness — every mutation has a corresponding audit entry
- No orphaned jobs (jobs that enter "running" but never reach a terminal state)

**Agent Behavior**
- Agents stay within their defined role boundaries
- Confidence thresholds are respected consistently
- No runaway loops (agents generating unbounded work)
- Action caps are never exceeded

**Error Handling**
- Errors are caught and logged, not silently swallowed
- Failed jobs are properly marked and escalated
- No cascading failures (one agent's failure should not bring down others)

## Monitoring Requirements

### Continuous Monitoring

The following must be monitored throughout the Alpha period:

**Agent Watcher**
The real-time activity monitor at `/app/watcher` polls the audit log every 4 seconds, providing visibility into:
- Active agent actions
- Job status changes
- Error occurrences
- Decision Memo generation and resolution

**Audit Log Review**
Regular review of the audit log for:
- Unusual patterns (spikes in activity, repeated failures)
- Elevated severity entries (warn, error, critical)
- Compliance with expected workflows

**System Health**
- Engine tick regularity
- API response times
- Database connection stability
- Worker process health
- Memory and CPU utilization

### Alerting

Alerts must be configured for:
- Engine loop stalls (no tick for more than 30 seconds)
- Agent action cap reached
- Decision Memo pending for more than 1 hour
- Error rate exceeding baseline
- Safety guardrail triggered

## Alpha-Specific Constraints

During Alpha, the platform operates under stricter constraints than will be in place for general availability:

### Financial Constraints
- `AUTO_SPEND_LIMIT_USD` is set to a conservative value
- **All recurring charges are blocked** — no exceptions, regardless of amount
- Transaction approval thresholds are lower than production defaults

### Action Constraints
- `MAX_ACTIONS_PER_DAY` is set lower than production targets
- Daily posting caps are conservative
- External communication requires human review

### Confidence Constraints
- `CONFIDENCE_AUTO_THRESHOLD` is elevated — agents need higher confidence to act autonomously
- Actions below the threshold always generate Decision Memos
- Novel actions (first-time for an agent) default to supervised mode

### Logging Constraints
- Enhanced logging verbosity is active
- All agent reasoning steps are recorded (not just final actions)
- Tool invocations include full parameter logging

## Compliance Checklist

Organizations running the Alpha stability test should verify:

- [ ] Engine is running and ticking consistently
- [ ] All worker processes are active (email, scheduler, engine)
- [ ] Agent Watcher is accessible and showing current data
- [ ] Audit log is recording all mutations
- [ ] Safety guardrails are configured and enforced
- [ ] Decision Memo workflow is functioning (test with a deliberate trigger)
- [ ] Telegram or email alerts are configured for operators
- [ ] Daily action caps are set and enforced
- [ ] Spend limits are configured appropriately
- [ ] Recurring charge blocks are active
- [ ] Tenant isolation is verified (test with multiple tenants)
- [ ] Backup and recovery procedures are documented

## What Happens After Alpha

Upon successful completion of the 7-day stability test:

1. **Constraints are relaxed** — Spend limits, action caps, and confidence thresholds move to production values
2. **Recurring charges may be enabled** — With appropriate approval workflows
3. **Public beta begins** — Broader access with continued monitoring
4. **Feedback integration** — Alpha findings are incorporated into platform improvements

## Failure and Reset

If any success criterion is violated during the 7-day test:
1. The violation is documented with full context
2. Root cause analysis is performed
3. A fix is implemented and verified
4. The 7-day clock resets
5. Monitoring continues from day 1

There is no shortcut through the stability test. The platform must demonstrate consistent, safe behavior for the full duration.

## Key Takeaways

1. Alpha is a structured validation phase with specific, measurable success criteria.
2. The 7-day stability test must be passed without interruption.
3. Alpha constraints are intentionally conservative — they protect against unknown risks.
4. Continuous monitoring is required, not optional.
5. Failure resets the clock — there are no partial passes.
