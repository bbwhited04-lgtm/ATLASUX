# Incident Management & Response Policy

**Organization:** Dead App Corp (Atlas UX)
**Effective Date:** March 2, 2026
**Owner:** Billy Whited, Founder & CEO
**Review Cycle:** Quarterly

---

## 1. Purpose

This policy establishes procedures for detecting, responding to, and recovering from security incidents affecting Atlas UX and its integrations.

## 2. Incident Classification

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|---------|
| P1 — Critical | Data breach, service compromise, unauthorized access | 1 hour | Database exposure, token theft, auth bypass |
| P2 — High | Service degradation, failed security controls | 4 hours | API outage, webhook verification failure, rate limit bypass |
| P3 — Medium | Anomalous behavior, potential vulnerability | 24 hours | Unusual API patterns, failed login spikes, dependency CVE |
| P4 — Low | Minor configuration issue, non-urgent improvement | 7 days | Missing security header, log format issue |

## 3. Detection

- **Audit Trail Monitoring:** All system actions are logged. Anomalous patterns (mass data access, repeated auth failures, unexpected agent behavior) trigger alerts.
- **Agent Guardrails:** Autonomous agents that exceed spending limits, daily action caps, or risk thresholds are automatically halted and flagged for human review.
- **Webhook Verification:** Failed HMAC-SHA256 signature checks on incoming webhooks are logged as security events.
- **Dependency Monitoring:** npm audit alerts on known vulnerabilities in third-party packages.

## 4. Response Procedures

### P1 — Critical Incident
1. Immediately revoke all potentially compromised OAuth tokens and API keys.
2. Disable affected integrations (Zoom, Microsoft 365, etc.) at the application level.
3. Assess scope — identify affected tenants, data types, and time window.
4. Notify affected users within 72 hours with: what happened, what data was affected, what actions they should take.
5. Engage Supabase support for database-level investigation if needed.
6. Document root cause and remediation in incident report.

### P2 — High Incident
1. Identify failing component and isolate if possible.
2. Deploy hotfix or roll back to last known good deployment.
3. Monitor for recurrence.
4. Log incident in audit trail with full details.

### P3/P4 — Medium/Low Incident
1. Create tracking issue.
2. Remediate within response time SLA.
3. Deploy fix through normal CI/CD pipeline.

## 5. Communication

- **Internal:** All incidents logged in audit trail and git commit history.
- **External (P1/P2):** Affected users notified via email from support@deadapp.info.
- **Zoom:** Zoom Security team notified per Marketplace requirements if incident affects Zoom user data.

## 6. Post-Incident Review

- Root cause analysis completed within 5 business days of incident resolution.
- Remediation actions documented and tracked to completion.
- Policy and procedures updated based on lessons learned.

## 7. Contact

- **Security Contact:** billy@deadapp.info
- **Support:** support@deadapp.info
