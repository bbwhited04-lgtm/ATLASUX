# Audit Tools — Logging, Tracing, and Accountability for Tool Usage

## Why Audit Everything

Every tool call an AI agent makes is a potential compliance event. A tool that sends an SMS, creates an appointment, or charges a credit card has real-world consequences. Without audit logging, you can't answer: Who authorized this action? What data was accessed? When did the failure occur? Why did the agent make this decision?

Audit trails aren't just for compliance — they're essential for debugging, cost tracking, performance optimization, and customer trust.

## Audit Log Schema

Every tool call audit record should capture:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Unique audit entry identifier |
| `tenant_id` | UUID | Which tenant's data was involved |
| `actor_type` | enum | "user", "agent", "system", "webhook" |
| `actor_id` | string | Who triggered the action (user ID, agent name, system process) |
| `action` | string | What happened ("APPOINTMENT_CREATED", "SMS_SENT", "KB_SEARCHED") |
| `entity_type` | string | What type of entity was affected ("appointment", "customer", "message") |
| `entity_id` | string | Which specific entity was affected |
| `input` | JSON | Tool input parameters (redacted of secrets) |
| `output` | JSON | Tool response summary (not full response — just status and key fields) |
| `duration_ms` | integer | How long the tool call took |
| `success` | boolean | Whether the call succeeded |
| `error_code` | string | Error code if failed |
| `level` | enum | "info", "warn", "error" |
| `message` | string | Human-readable description |
| `meta` | JSON | Additional context (query, budget, scores) |
| `timestamp` | datetime | When the action occurred |

## Atlas UX Implementation

Atlas UX implements audit logging through the `auditPlugin` Fastify plugin:

```typescript
await prisma.auditLog.create({
  data: {
    tenantId,
    actorUserId: null,
    actorExternalId: String(args.requestedBy ?? ""),
    actorType: "system",
    level: "info",
    action: "KB_CONTEXT_BUILT",
    entityType: "intent",
    entityId: args.intentId,
    message: `KB context built for agent ${agentId} (${items.length} items, ${used}/${budgetChars} chars)`,
    meta: { agentId, query: query ?? null, budgetChars, usedChars: used, items },
    timestamp: new Date(),
  },
});
```

**Key design decisions:**
- Every mutation is logged. Successful GETs and health/polling endpoints are skipped to reduce noise.
- On database write failure, audit events fall back to **stderr** — never lost.
- Hash chain integrity via `lib/auditChain.ts` ensures audit records can't be tampered with (SOC 2 CC7.2).

## Structured vs Unstructured Logging

**Unstructured (bad for tools):**
```
2025-03-19 14:23:45 INFO: User called search tool with query "plumber near me" and got 5 results
```

**Structured (good for tools):**
```json
{
  "timestamp": "2025-03-19T14:23:45Z",
  "level": "info",
  "action": "TOOL_CALL",
  "tool": "search_customers",
  "tenant_id": "t-123",
  "agent": "lucy",
  "input": { "query": "plumber near me", "limit": 5 },
  "output": { "results_count": 5, "top_score": 0.92 },
  "duration_ms": 234,
  "success": true
}
```

Structured logs can be queried, aggregated, alerted on, and analyzed. Unstructured logs are just strings.

## Correlation IDs for Tool Chains

When an agent chains multiple tools, each call should share a correlation ID:

```json
// Call 1: Search customer
{ "correlation_id": "conv-abc-123", "step": 1, "tool": "search_customers", "input": { "query": "Jane Doe" } }

// Call 2: Get appointments
{ "correlation_id": "conv-abc-123", "step": 2, "tool": "get_appointments", "input": { "customer_id": "c-456" } }

// Call 3: Book appointment
{ "correlation_id": "conv-abc-123", "step": 3, "tool": "book_appointment", "input": { "customer_id": "c-456", "date": "2025-03-20" } }

// Call 4: Send confirmation
{ "correlation_id": "conv-abc-123", "step": 4, "tool": "send_sms", "input": { "to": "+15551234567" } }
```

With correlation IDs, you can reconstruct the entire tool chain for debugging or compliance review.

## PII Redaction

Audit logs must be inspectable without exposing personal information:

```javascript
function redactForAudit(input) {
  const redacted = { ...input };
  if (redacted.phone) redacted.phone = redacted.phone.slice(0, -4).replace(/./g, '*') + redacted.phone.slice(-4);
  if (redacted.email) redacted.email = redacted.email.replace(/(.{2}).*@/, '$1***@');
  if (redacted.ssn) redacted.ssn = '***-**-' + redacted.ssn.slice(-4);
  delete redacted.api_key;
  delete redacted.password;
  delete redacted.token;
  return redacted;
}
```

Result: `{ "phone": "******4567", "email": "jo***@example.com" }`

## Immutability — Append-Only Logs

Audit logs must be append-only. No updates, no deletes.

Atlas UX enforces this with hash chain integrity via `auditChain.ts`:
1. Each audit record includes a hash of the previous record
2. To tamper with record #50, you'd have to recalculate hashes for records #51 through #N
3. Integrity can be verified by walking the chain
4. This satisfies SOC 2 CC7.2 (system monitoring) requirements

## Real-Time Alerting

Monitor audit logs for suspicious patterns:

| Pattern | Alert |
|---------|-------|
| 50+ tool calls in 1 minute | Possible automated abuse |
| Failed auth attempts > 5 | Brute force or credential stuffing |
| Tool calls outside business hours | Unauthorized access |
| Bulk data export | Potential data exfiltration |
| Same tool called with identical params repeatedly | Bot or loop |
| Tool chain: read sensitive data → send email | Possible data leak |

## Cost Attribution

Track cost per tool, per tenant, per time period:

```json
{
  "tool": "generate_image",
  "tenant_id": "t-123",
  "cost_usd": 0.04,
  "period": "2025-03",
  "calls_count": 47,
  "total_cost_usd": 1.88
}
```

This enables:
- Usage-based billing
- Cost anomaly detection
- Budget enforcement (Atlas UX's `AUTO_SPEND_LIMIT_USD`)
- ROI analysis per tool

## Retention Policies

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Security audit logs | 7 years | SOC 2, GDPR, legal compliance |
| Tool call logs | 90 days | Debugging, performance analysis |
| Cost attribution logs | 1 year | Financial reporting |
| Error logs | 30 days | Incident investigation |
| Aggregated metrics | Indefinite | Trend analysis |

## Resources

- [NIST SP 800-53 AU Controls](https://csf.tools/reference/nist-sp-800-53/r5/au/) — Federal audit and accountability controls framework
- [SOC 2 CC7.2 — System Monitoring](https://us.aicpa.org/interestareas/frc/assuranceadvisoryservices/trustservicescriteria) — SOC 2 criteria for system monitoring and audit trails

## Image References

1. Audit log pipeline architecture — "audit log pipeline architecture ingestion storage query alert diagram"
2. Hash chain integrity diagram — "hash chain blockchain audit log integrity tamper proof diagram"
3. Correlation ID tracing flow — "distributed tracing correlation ID request flow diagram microservices"
4. PII redaction pipeline — "PII redaction data masking pipeline personal data protection diagram"
5. Audit dashboard metrics — "security audit dashboard metrics anomaly detection alert visualization"

## Video References

1. [Building Audit Trails for Compliance — AWS re:Invent](https://www.youtube.com/watch?v=YEkVrnGIr80) — How to build compliant audit trails at scale
2. [Structured Logging Best Practices — DevOps Toolkit](https://www.youtube.com/watch?v=MuPhf6uL-kE) — Practical guide to structured logging for observable systems
