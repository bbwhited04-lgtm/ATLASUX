# WF-010 — Daily Executive Brief (BINKY)

**Owner Agent:** BINKY (Chief Research Officer)  
**Goal:** Produce a cited daily brief from internal signals: support, operations, jobs, audit events.

## Trigger
- Scheduled daily run
- Manual run by Chairman/Atlas

## Inputs
```json
{
  "date": "YYYY-MM-DD",
  "tenantId": "uuid",
  "include": ["support","jobs","audit","ledger"]
}
```

## Steps
1. Pull internal signals (read-only)
2. Summarize: wins, blockers, risks
3. Cite sources (internal references + external links if used)
4. Email digest to Atlas + Chairman
5. Write audit trail

## Tool Calls
- Allowed: Read-only dashboards, docs, email, internal query endpoints
- Forbidden: unlogged external actions

## Outputs
- Daily digest email + audit entry
