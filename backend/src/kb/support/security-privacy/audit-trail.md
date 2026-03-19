---
title: "Audit Trail: Every Action Is Logged"
category: "Security & Privacy"
tags: ["audit", "audit trail", "logging", "SOC 2", "hash chain", "accountability"]
related:
  - security-privacy/how-we-protect-your-data
  - security-privacy/data-privacy
  - troubleshooting/common-errors
  - troubleshooting/getting-help
---

# Audit Trail: Every Action Is Logged

Atlas UX maintains a complete audit trail of every meaningful action taken in your account. Whether Lucy books an appointment, you update a setting, or an integration sends data, it is recorded. This gives you full visibility into what is happening in your business and creates a tamper-proof record for accountability.

## What the Audit Trail Captures

Every audit entry includes:

- **Who** -- Which user, agent, or system process performed the action. Lucy's actions are logged as "agent:lucy" so you can distinguish them from your own.
- **What** -- The specific action taken (e.g., "POST /v1/appointments" for booking, "PUT /v1/settings" for a configuration change).
- **When** -- The exact timestamp of the action.
- **Outcome** -- Whether the action succeeded or failed, and at what severity level (info, warning, or error).
- **Tenant** -- Which business account the action belongs to. Your audit entries are isolated from other customers.
- **Metadata** -- Additional context such as request IDs, related entities, and error details.

## What Is Not Logged

To keep the audit trail useful and not overwhelming, Atlas UX skips certain routine events:

- **Successful GET requests** -- Reading data (loading a page, viewing a list) does not create audit entries. Only data changes and errors are logged.
- **Health check endpoints** -- System monitoring pings are excluded.
- **Polling requests** -- Repeated status checks from the engine loop are filtered out.

This means your audit log focuses on the actions that matter: changes, errors, and security events.

## Why the Audit Trail Matters

**Accountability:** You can see exactly what Lucy did and when. If a customer says they booked an appointment at 3 PM but Lucy logged it for 4 PM, the audit trail shows the original interaction.

**Security:** If someone accesses your account without authorization, the audit trail shows what they did. This is why we recommend reviewing it periodically (see [How We Protect Your Data](how-we-protect-your-data.md)).

**Troubleshooting:** When something goes wrong, the audit trail is the first place to look. Error-level entries show what failed, when, and often why. Support will ask for audit details when diagnosing issues. See [Getting Help](../troubleshooting/getting-help.md).

**Compliance readiness:** Regulated industries (insurance, healthcare-adjacent services) may need to demonstrate that all system actions are logged. Atlas UX's audit trail provides this without extra configuration.

## Hash Chain Integrity

Atlas UX goes beyond simple logging by implementing **hash chain integrity** on the audit trail. Here is what that means in plain terms:

1. Each audit entry includes a cryptographic hash (a digital fingerprint) of the entry.
2. That hash includes the hash of the previous entry, creating a chain.
3. If anyone modifies, deletes, or inserts an audit entry out of order, the chain breaks and the tampering is detectable.

This is the same concept behind blockchain ledgers. It ensures your audit trail is **tamper-evident** -- you can mathematically prove that the log has not been altered.

This design aligns with **SOC 2 CC7.2** (system monitoring) and **NIST AU-10** (non-repudiation) standards.

## How to View Your Audit Log

1. Log in to your Atlas UX dashboard.
2. Go to **Dashboard > Audit Log**.
3. You will see a chronological list of events with severity indicators:
   - **Green (info)** -- Normal successful actions.
   - **Yellow (warn)** -- Actions that completed but with issues (e.g., a partial failure).
   - **Red (error)** -- Actions that failed. These deserve attention.
4. Use filters to narrow by date range, action type, or severity level.

## Reliability: Logs Are Never Lost

Atlas UX is designed so audit events are never silently dropped:

- If the database write fails (network issue, temporary outage), the audit event is written to **stderr** as a fallback.
- The system pauses audit writes for 10 seconds on schema errors, then automatically retries. This prevents a single glitch from permanently disabling logging.
- The approach is **fail-safe** -- the system errs on the side of logging too much rather than missing an event.

## Frequently Asked Questions

**Can I export my audit log?**
Contact support for audit log exports. We can provide your data in standard formats for compliance or review purposes.

**How long are audit entries retained?**
Audit entries are retained for the duration of your account. Contact support if you need information about our data retention policy. See [Data Privacy](data-privacy.md).

**Can I delete audit entries?**
No. The audit trail is append-only by design. This is intentional -- an audit log that can be edited is not trustworthy.


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
