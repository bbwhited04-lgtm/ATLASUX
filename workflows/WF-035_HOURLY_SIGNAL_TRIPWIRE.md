# WF-035 — Hourly Signal Tripwire (DAILY-INTEL)

**Owner Agent:** DAILY-INTEL (Intel Aggregator)
**Goal:** Lightweight hourly scan of HN, Reddit, X, and web for breaking high-relevance signals. Escalate immediately when something hits the relevance threshold; stay silent otherwise.

## Trigger
- Scheduled: every hour at :15 past
- Manual run by Atlas/Chairman

## Inputs
```json
{
  "tenantId": "uuid",
  "triggeredBy": "scheduler"
}
```

## Steps
1. **Fetch sources** (read-only, no auth required)
   - Hacker News top 15 stories (Firebase public API)
   - Reddit hot posts (AI + security subreddits)
   - Web search for breaking AI/security news
   - X/Twitter recent tweets on AI security topics
2. **LLM triage** — classify each headline as HIGH / MEDIUM / LOW relevance
   - HIGH: AI jailbreaks, platform outages/bans, competitor launches, regulatory actions, major security breaches
   - MEDIUM: General AI industry news (save for daily report)
   - LOW: Unrelated noise (ignore)
3. **Verdict: ESCALATE or SILENT**
   - SILENT: log to audit, done
   - ESCALATE: email alert to Atlas + Billy + Daily-Intel hub with signal details and Atlas UX angle
4. **Audit trail** — every scan logged regardless of verdict

## Tool Calls
- Allowed: HN Firebase API, Reddit public JSON, web search (SERP), X search, LLM classify, email queue
- Forbidden: DB writes (except audit/ledger), execution tools, publishing

## Audit Events
- WORKFLOW_STEP: WF-035.start
- WORKFLOW_STEP: WF-035.triage
- WORKFLOW_STEP: WF-035.silent OR WF-035.escalated

## Outputs
- If SILENT: `{ signalsFound: 0, hour, verdict: "SILENT" }`
- If ESCALATE: `{ signalsFound: N, hour, verdict: "ESCALATE", preview: "..." }` + email alert

## Escalation Categories
| Category | Example | Why Atlas UX Cares |
|----------|---------|-------------------|
| AI jailbreak / exploit | OpenClaw, prompt injection CVEs | Validates security-first positioning |
| Platform outage / ban | TikTok ban, X downtime | Operational impact on connected channels |
| Competitor move | New AI employee platform launch | Market positioning |
| Regulation | EU AI Act, SEC on AI trading | Compliance / opportunity |
| Major breach | OpenAI/Anthropic data leak | Trust narrative |
