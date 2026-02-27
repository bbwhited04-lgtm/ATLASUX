# Budget Review Workflow

## Overview

Tina (CFO agent) manages continuous financial oversight for each tenant through a combination of daily spend monitoring, weekly trend analysis, and monthly reconciliation. This workflow ensures that all agent-initiated spending stays within approved limits, anomalies are caught early, and Atlas receives actionable financial intelligence for strategic decisions.

## Daily Spend Monitoring

Tina monitors spending continuously throughout each day via the engine loop.

### Threshold Alerts

The platform enforces the `AUTO_SPEND_LIMIT_USD` environment variable as a hard cap on autonomous spending. Tina's daily monitoring adds softer guardrails:

| Threshold       | Action                                                      |
|-----------------|-------------------------------------------------------------|
| 50% of daily cap | Advisory log entry — no action required                    |
| 75% of daily cap | Warning alert sent to Atlas via internal notification      |
| 90% of daily cap | Urgent alert — all pending spend jobs paused for review    |
| 100% of daily cap | Hard stop — no further autonomous spending allowed today  |

### Real-Time Tracking

Tina queries the `jobs` table and `ledger` entries to track:
- Completed spend actions (status: `completed`, type includes financial operations)
- Pending spend actions (status: `queued` or `running`)
- Projected end-of-day spend based on scheduled workflows

### Decision Memo Requirements

Any single expenditure above `AUTO_SPEND_LIMIT_USD` automatically generates a `decision_memo` requiring approval before execution. Tina reviews these memos and provides a financial assessment:
- Is the spend within the monthly budget?
- Does it align with approved categories?
- Is this a recurring or one-time cost?
- What is the expected ROI?

## Weekly Trend Analysis

Every Friday at 16:00 UTC, Tina produces a weekly financial summary.

### Spending Trends

- **Week-over-Week Comparison**: Total spend this week vs last week, broken down by category
- **Category Breakdown**: How spending distributes across operations (API calls, ads, content production, tools, integrations)
- **Agent Spend Attribution**: Which agents initiated the most spending and for what purpose
- **Cost-Per-Action**: Average cost of each type of agent action

### Trend Indicators

Tina flags the following patterns:
- Spend increasing more than 20% week-over-week without corresponding revenue growth
- Any single category consuming more than 40% of total spend
- New spending categories appearing without prior authorization
- Agent actions with declining ROI over 3+ consecutive weeks

### Output

The weekly summary is stored in `kb_documents` with tag `financial-weekly-summary` and provided to Atlas for inclusion in the Monday Weekly Executive Summary.

## Monthly Reconciliation

On the 1st of each month, Tina performs a comprehensive financial reconciliation.

### Step 1: Ledger Audit

Tina verifies that every entry in the `ledger` table matches a corresponding job or action:

1. **Completeness Check**: Every completed job with a financial component has a ledger entry
2. **Accuracy Check**: Ledger amounts match the actual costs recorded in job results
3. **Timestamp Verification**: Ledger entries are dated correctly relative to job completion
4. **Tenant Isolation**: No cross-tenant financial entries exist (multi-tenancy integrity check)

Discrepancies are flagged with severity ratings:
- **Critical**: Missing ledger entries for completed financial jobs
- **High**: Amount mismatches exceeding $1.00
- **Medium**: Timestamp discrepancies exceeding 1 hour
- **Low**: Metadata inconsistencies (non-financial)

### Step 2: Budget vs Actual Comparison

Tina compares actual spending against the approved monthly budget by category (API Costs, Ad Spend, Content Production, Tool Subscriptions). Each category shows budget, actual, variance, and status (Under/Over/On Track).

### Step 3: Recurring Charge Detection

Tina scans for recurring charges, which are blocked by default in Alpha:

1. Identify any charge that appears 2+ times with the same vendor/category/amount
2. Verify each has explicit approval via decision memo
3. Flag any unauthorized recurring patterns
4. Generate a recurring charge inventory with next expected charge dates

### Step 4: Anomaly Detection

Statistical analysis of spending patterns:

- Charges significantly above the historical mean for their category
- Spending at unusual times (outside business hours)
- Rapid sequences of small charges (potential fragmentation to avoid limits)
- Charges to new vendors or services not previously authorized

### Step 5: Report Generation

The monthly reconciliation report includes:

1. **Executive Summary**: One-paragraph financial health assessment
2. **Ledger Audit Results**: Discrepancies found and their resolution status
3. **Budget Performance**: Category-by-category comparison
4. **Recurring Charge Inventory**: All identified recurring costs
5. **Anomaly Report**: Flagged items requiring investigation
6. **Recommendations**: Cost optimization suggestions for Atlas

### Step 6: Recommendations to Atlas

Tina provides actionable recommendations:

- Budget reallocation suggestions based on actual vs planned spending
- Cost-cutting opportunities (underperforming ad campaigns, unused integrations)
- Investment recommendations (categories showing strong ROI)
- Policy change proposals (adjusting spend limits, adding new approved categories)

## Audit Trail

All financial monitoring creates audit entries with `actorExternalId: "tina"`, `entityType: "financial_monitoring"`, and actions like `budget.daily_check`, `budget.weekly_summary`, `budget.monthly_reconciliation`. Meta includes `currentSpend`, `dailyLimit`, `percentUsed`, `topCategory`, and `alertLevel`.

## Integration with Safety Guardrails

Tina's budget workflow enforces several Alpha safety constraints:
- `AUTO_SPEND_LIMIT_USD`: Hard cap on individual autonomous transactions
- `MAX_ACTIONS_PER_DAY`: Limits total agent actions (many of which have cost implications)
- Recurring purchase block: Default deny on recurring charges without explicit approval
- All mutations logged to audit trail: Every financial action is traceable

## Storage

All financial reports are stored in `kb_documents`:
- Daily alerts: tag `financial-daily-alert`
- Weekly summaries: tag `financial-weekly-summary`
- Monthly reconciliation: tag `financial-monthly-reconciliation`
- All with `createdBy: "tina"` and `status: "published"`
