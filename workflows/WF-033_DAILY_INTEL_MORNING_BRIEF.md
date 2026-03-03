# WF-033 — Daily-Intel Morning Brief (DAILY-INTEL)

**Owner Agent:** DAILY-INTEL (Intel Aggregator)
**Goal:** Produce a comprehensive morning brief aggregating overnight intel, tripwire alerts, and fresh news for Binky (CRO) and Atlas (CEO).

## Trigger
- Scheduled daily at 07:00 UTC
- Manual run by Atlas/Chairman

## Inputs
```json
{
  "tenantId": "uuid",
  "triggeredBy": "scheduler"
}
```

## Steps
1. **Pull recent intel** — audit logs from last 24h intel sweeps
2. **Check tripwire escalations** — any WF-035 ESCALATE events in last 24h
3. **KB context** — load Daily-Intel knowledge base docs
4. **Fresh news scan** — web search for AI/automation/security news today
5. **LLM synthesis** — produce structured morning brief:
   - OVERNIGHT SIGNALS — what happened while team slept
   - TODAY'S LANDSCAPE — key themes across platforms
   - PRIORITY FLAGS — immediate action items
   - OPPORTUNITIES — time-sensitive content/positioning plays
   - PLATFORM STATUS — outages, bans, disruptions
6. **Distribute** — email to Binky, Atlas, Billy
7. **Audit + Ledger**

## Tool Calls
- Allowed: Read audit logs, KB context, web search (SERP), LLM synthesis, email queue
- Forbidden: DB writes (except audit/ledger), execution tools, publishing

## Audit Events
- WORKFLOW_STEP: WF-033.start
- WORKFLOW_STEP: WF-033.brief
- WORKFLOW_STEP: WF-033.complete

## Outputs
- Morning brief email to Binky + Atlas + Billy
- `{ date, briefChars, tripwireAlerts: boolean, recipients: string[] }`
