# Weekly Executive Summary

## Overview

Every Monday at 09:00 UTC, Atlas (CEO agent) compiles and distributes a board-level executive summary covering the previous week's operations. This report aggregates outputs from multiple agents into a single document that provides leadership with a comprehensive view of business performance, risks, and recommended actions.

## Data Sources

Atlas pulls from five primary data streams to build the weekly summary:

### 1. Daily-Intel Daily Briefs

Source: Daily-Intel agent (output of WF-106, stored daily)

- 7 daily intelligence packets from the morning brief pipeline
- Cross-platform trend summaries
- Content performance highlights
- Emerging opportunities identified during the week
- Coverage gaps or degraded intelligence days

### 2. Tina's Financial Summaries

Source: Tina (CFO agent), daily spend monitoring + weekly roll-up

- Total spend for the week (broken down by category)
- Budget vs actual comparison
- Burn rate and runway projections
- Recurring charge inventory
- Anomalies flagged during the week
- Cost-per-action metrics across agent operations

### 3. Binky's Growth Metrics

Source: Binky (CRO agent), growth dashboard data

- New customer acquisitions
- Customer activation rate (first workflow completed)
- Churn and retention metrics
- Revenue metrics (MRR, ARR projections)
- Funnel conversion rates at each stage
- Top-performing acquisition channels
- Onboarding completion rates

### 4. Larry's Audit Findings

Source: Larry (Auditor agent), continuous audit monitoring

- Total audit log entries for the week
- Policy violations detected
- Decision memos reviewed and their outcomes
- Compliance score (percentage of actions fully audited)
- Security events or anomalies
- Recommendations for governance improvements

### 5. Mercer's Pipeline Updates

Source: Mercer (Acquisition agent), pipeline tracking

- Active deals and their stages
- Pipeline value (total and weighted)
- Deals closed this week
- Deals lost and reasons
- New leads generated
- Outreach activity metrics
- Partnership or integration opportunities identified

## Report Structure

The Weekly Executive Summary follows a standardized format:

### Section 1: Key Performance Indicators (KPIs)

A dashboard-style overview with week-over-week comparisons covering: Total Revenue, New Customers, Active Workflows, Agent Actions Executed, Total Spend, Compliance Score, and Customer Satisfaction. Each KPI shows this week, last week, and percentage change.

### Section 2: Highlights

Top 5 achievements or positive developments from the week:
- Notable content wins (viral posts, high-engagement campaigns)
- Successful customer onboardings
- New integrations or features deployed
- Cost savings or efficiency improvements
- Positive audit findings

### Section 3: Risks and Concerns

Issues requiring attention, ranked by severity:
- Budget overruns or unusual spending patterns
- Compliance gaps identified by Larry
- Agent performance degradation
- Customer complaints or churn signals
- Platform API changes affecting operations
- Security incidents

### Section 4: Action Items

Specific, assigned tasks for the coming week:

```
1. [Action] — Assigned To: [Agent] — Deadline: [Date]
2. [Action] — Assigned To: [Agent] — Deadline: [Date]
3. [Action] — Assigned To: [Agent] — Deadline: [Date]
```

Each action item includes context from the relevant data source and a clear success criteria.

### Section 5: Forecast

Forward-looking projections for the coming week:
- Expected revenue based on pipeline
- Planned content calendar highlights
- Scheduled workflow deployments
- Anticipated risks or challenges
- Resource allocation recommendations

## Distribution

The completed report is distributed through multiple channels:

1. **Email**: Sent from `atlas@deadapp.info` to all executive-tier agents (Binky, Tina, Larry) and the tenant admin
2. **Knowledge Base**: Stored in `kb_documents` with tag `weekly-executive-summary` and status `published`
3. **Telegram**: Summary version (KPIs + top 3 highlights + top 3 risks) sent to the tenant's configured Telegram chat
4. **Dashboard**: Key metrics surfaced in the Business Manager component

## Generation Process

1. Atlas queries `kb_documents` for all daily briefs from the past 7 days
2. Atlas queries agent-specific reports (financial, growth, audit, pipeline)
3. Atlas uses ORCHESTRATION_REASONING to synthesize data into the report format
4. The draft report is stored with status `draft`
5. If the report contains any risk items rated "high" or above, a `decision_memo` is created for board review
6. The report is finalized and distributed

## Historical Tracking

All weekly summaries are retained indefinitely in the knowledge base. This enables:
- Month-over-month trend analysis
- Quarterly board presentations (aggregated from weekly reports)
- Year-end performance reviews
- Audit trail for strategic decisions

## Failure Handling

If Atlas cannot generate the report by 09:00 UTC Monday:
- A fallback "data-only" report is generated with raw metrics and no synthesis
- Petra (PM) is notified to review and supplement manually
- The full report is generated as soon as the issue is resolved
- The delay and root cause are documented in the next week's report
