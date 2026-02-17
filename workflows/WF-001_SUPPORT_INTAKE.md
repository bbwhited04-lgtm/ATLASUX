# WF-001 — Support Intake (CHERYL)

**Owner Agent:** CHERYL (Customer Support Specialist)  
**Tier:** Executive  
**Goal:** Convert inbound customer contact into a classified, traceable ticket with a timely response and correct routing.

## Trigger
- Inbound email to support inbox
- Web form submission
- Manual ticket creation from UI

## Inputs (engine payload)
```json
{
  "channel": "email|web|manual",
  "from": "string",
  "subject": "string",
  "message": "string",
  "attachments": [{"name":"string","url":"string"}],
  "customer": {"name":"string","email":"string"},
  "metadata": {"tenantId":"uuid","accountId":"uuid","orderId":"string"}
}
```

## Steps
1. **Create Ticket**
   - Generate ticketId
   - Store raw message + metadata
2. **Classify**
   - Category: Bug | Billing | Compliance | Feature | General | Incident
   - Severity: Low | Medium | High | Critical
3. **Acknowledge Receipt**
   - Send a response with ticketId, expected next steps, and initial guidance links
4. **Route / Escalate**
   - Bug → Engineering
   - Billing → TINA
   - Compliance/Legal → LARRY/JENNY
   - Product/Roadmap → BINKY
   - Incident/Security → Executive Priority
5. **Audit + Close Loop**
   - Log classification + routing + response
   - Ticket stays Open unless resolved

## Tool Calls
- Allowed: Email, Ticket system, Docs/KB, Read-only status dashboards
- Forbidden: DB writes, ledger, deployments, policy edits

## Audit Events
- SUPPORT_TICKET_CREATED
- SUPPORT_TICKET_CLASSIFIED
- SUPPORT_ACK_SENT
- SUPPORT_ESCALATED (if applicable)

## Outputs
- Ticket record with: id, category, severity, status, assigned owner, timestamps
- Customer acknowledgement email logged

## Test Cases
1. Password reset question → General/Low → KB link
2. “Charged twice” → Billing/High → Tina escalation
3. “Data leak?” → Incident/Critical → Exec priority escalation
