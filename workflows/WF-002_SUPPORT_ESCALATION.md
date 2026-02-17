# WF-002 — Support Escalation Routing (CHERYL)

**Owner Agent:** CHERYL  
**Goal:** Package and route an issue to the correct executive/owner with the minimum necessary context and maximum traceability.

## Trigger
- Ticket classification requires escalation
- Customer follow-up increases severity
- SLA threshold reached

## Inputs
```json
{
  "ticketId": "string",
  "category": "Bug|Billing|Compliance|Feature|Incident|General",
  "severity": "Low|Medium|High|Critical",
  "summary": "string",
  "evidence": [{"type":"log|screenshot|email","ref":"string"}],
  "proposedOwner": "string",
  "customerImpact": "string"
}
```

## Steps
1. Validate ticket exists and is open
2. Construct escalation packet:
   - Summary, evidence refs, impact, urgency, requested action
3. Route to owner:
   - Engineering, Tina, Larry/Jenny, Binky, or Exec priority
4. Notify customer of escalation status (no promises)
5. Write audit trail + update ticket status to Escalated

## Tool Calls
- Allowed: Ticket system, Email, Docs/KB
- Forbidden: DB writes, ledger, deployments, policy edits

## Audit Events
- SUPPORT_ESCALATION_CREATED
- SUPPORT_ESCALATION_SENT
- SUPPORT_CUSTOMER_NOTIFIED
