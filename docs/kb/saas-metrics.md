# SaaS Metrics That Matter

Reference guide for Atlas UX agents responsible for tracking, reporting, and optimizing key SaaS performance indicators. Every metric here has a clear owner, a formula, and actionable thresholds.

---

## Core Financial Metrics

### Monthly Recurring Revenue (MRR)

**Formula:** Sum of all active subscription revenue normalized to a monthly basis.

- **Good:** Consistent month-over-month growth of 10-20% for early-stage, 5-10% for growth-stage.
- **Bad:** Flat or declining MRR for two consecutive months signals churn or pricing problems.
- **Owner:** Tina (CFO) — tracks via ledger entries and subscription events.

### Annual Recurring Revenue (ARR)

**Formula:** MRR x 12.

ARR is the headline number for investor conversations and annual planning. Tina should flag any month where annualized run rate drops below the prior quarter's ARR.

### Churn Rate

**Formula:** (Customers lost in period / Customers at start of period) x 100.

- **Good:** Monthly churn below 3% for SMB, below 1% for enterprise.
- **Bad:** Anything above 5% monthly requires immediate investigation.
- **Owner:** Tina tracks revenue churn. Cheryl tracks logo churn (customer count). Binky investigates root causes.

### Net Revenue Retention (NRR)

**Formula:** ((Starting MRR + Expansion - Contraction - Churn) / Starting MRR) x 100.

- **Good:** Above 100% means existing customers are growing faster than they leave. Best-in-class SaaS hits 120-140%.
- **Bad:** Below 90% means the product is leaking value.
- **Owner:** Binky (CRO) — responsible for expansion revenue strategy.

---

## Growth Metrics

### Customer Acquisition Cost (CAC)

**Formula:** Total sales and marketing spend / Number of new customers acquired.

- **Good:** CAC payback within 12 months.
- **Bad:** CAC payback exceeding 18 months without clear enterprise deal justification.
- **Owner:** Mercer (Acquisition) tracks spend-per-channel. Tina validates total cost.

### Lifetime Value (LTV)

**Formula:** Average Revenue Per Account (ARPA) x Gross Margin % / Monthly Churn Rate.

- **Good:** LTV:CAC ratio of 3:1 or higher.
- **Bad:** LTV:CAC below 1:1 means you are paying more to acquire customers than they will ever return.
- **Owner:** Tina calculates LTV. Binky uses it to set growth targets.

### Payback Period

**Formula:** CAC / (ARPA x Gross Margin %).

Measures how many months it takes to recover the cost of acquiring a customer. Under 12 months is healthy. Under 6 months is exceptional and signals room to invest more aggressively in acquisition.

### Expansion Revenue

**Formula:** Additional MRR from upsells, cross-sells, and seat additions within existing accounts.

- **Owner:** Binky designs expansion plays. Mercer executes upsell outreach. Tina records the revenue.

---

## Operational Metrics

### Daily Active Users (DAU) / Monthly Active Users (MAU)

Ratio of DAU/MAU above 20% indicates strong engagement. Below 10% signals a tool people signed up for but do not use daily.

### Activation Rate

Percentage of new signups who complete a key action (e.g., create first agent, run first workflow) within 7 days. Target: above 40%.

### Support Ticket Volume

Cheryl tracks ticket count, resolution time, and CSAT. Rising ticket volume without proportional user growth indicates product issues.

---

## Agent Responsibility Matrix

| Metric | Primary Owner | Supporting Agent | Cadence |
|--------|--------------|-----------------|---------|
| MRR / ARR | Tina | Binky | Daily snapshot, weekly report |
| Churn Rate | Tina (revenue), Cheryl (logo) | Binky | Weekly |
| NRR | Binky | Tina | Monthly |
| CAC | Mercer | Tina | Monthly |
| LTV | Tina | Binky | Monthly |
| Payback Period | Tina | Mercer | Quarterly |
| Expansion Revenue | Binky | Mercer | Weekly |
| Activation Rate | Petra | Cheryl | Weekly |
| Support Volume | Cheryl | Larry (audit) | Daily |

---

## Reporting Cadence

- **Daily:** MRR snapshot, support ticket count, active user count.
- **Weekly:** Churn analysis, expansion pipeline, activation funnel.
- **Monthly:** Full P&L metrics review, LTV/CAC update, board-ready ARR summary.
- **Quarterly:** Payback period recalculation, cohort retention analysis.

---

## Red Flag Triggers

Agents should escalate to Atlas (CEO) when any of these conditions are met:

1. MRR declines two consecutive weeks.
2. Monthly churn exceeds 5%.
3. LTV:CAC ratio drops below 2:1.
4. NRR falls below 95%.
5. CAC payback period exceeds 18 months.
6. Activation rate drops below 25%.

These thresholds are enforced through decision memos — any corrective action involving spend above the auto-limit requires approval.

---

## How Agents Use These Metrics

Tina generates financial snapshots from ledger data and flags anomalies. Binky uses growth metrics to prioritize campaigns and expansion plays. Mercer evaluates acquisition channel efficiency by comparing per-channel CAC against LTV. Cheryl correlates support volume with churn to identify at-risk accounts. Daily-Intel aggregates all metrics into the morning briefing for Atlas.

Every metric should be traceable back to a data source in the system. If a metric cannot be computed from existing data, the responsible agent should file a data request through Petra's project management queue.
