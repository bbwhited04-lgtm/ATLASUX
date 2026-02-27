# Budget Management

## Overview

Atlas UX provides comprehensive budget management through automated spend tracking, configurable auto-spend limits, and approval workflows for high-value expenditures. Financial oversight is handled by Tina (CFO) with full audit trail coverage and Statutory Guardrail Layer (SGL) enforcement.

## Key Concepts

### Auto-Spend Limit
The `AUTO_SPEND_LIMIT_USD` environment variable defines the maximum amount any agent can spend without human approval. Actions exceeding this threshold automatically trigger a decision memo requiring explicit authorization.

### Daily Action Cap
`MAX_ACTIONS_PER_DAY` limits the total number of actions agents can execute in a 24-hour period. This prevents runaway automation and ensures controllable costs.

### Decision Memos
High-risk financial actions generate a decision memo that includes:
- Action summary and justification
- Cost estimate
- Risk tier assessment
- Requesting agent and workflow context
- Approval/rejection status with timestamps

### Recurring Purchase Block
By default, Atlas UX blocks all recurring purchases. This safety guardrail prevents agents from committing to ongoing expenses without explicit human authorization.

## Budget Tracking

### Ledger System
The financial ledger tracks all monetary activity:

- **Income entries**: Revenue, payments received, refunds issued
- **Expense entries**: Tool costs, ad spend, service subscriptions
- **Transfer entries**: Internal fund movements between budget categories

Each ledger entry includes:
- Amount and currency
- Category and subcategory
- Description
- Agent or user who initiated the transaction
- Associated job or workflow ID
- Tenant ID for multi-tenant isolation
- Timestamp

### Business Manager Integration
The Budgets tab in Business Manager (`/app/business-manager?tab=budgets`) provides:

- **Accounting Summary**: Real totals computed from ledger entries (not hardcoded values)
- **Spend by Category**: Visual breakdown of expenses across operations, marketing, tools, and support
- **Period Comparison**: Select 24h, 7d, 30d, or 90d ranges to compare spend over time
- **Budget Alerts**: Notifications when spend approaches or exceeds thresholds

### Intelligence Tab Financials
The Intelligence tab in Business Manager shows:
- Financial overview from real ledger data
- Cost per decision analysis
- Decision analytics by agent and department
- Channel ROI table for marketing spend

## Approval Workflows

### Risk Tier System

Atlas UX categorizes financial actions by risk tier:

| Risk Tier | Criteria | Approval Required |
|-----------|----------|-------------------|
| Tier 0 | Below auto-spend limit, routine operation | Auto-approved |
| Tier 1 | Below auto-spend limit, non-routine | Auto-approved with logging |
| Tier 2 | Above auto-spend limit | Decision memo required |
| Tier 3 | Recurring commitment or high-value | Decision memo + human approval |
| Tier 4 | Regulatory, legal, or bank transfer | SGL BLOCK -- human must execute directly |

### Decision Memo Flow

```
Agent proposes action
  -> SGL evaluates risk tier
  -> Tier 0-1: Auto-approved, logged
  -> Tier 2-3: Decision memo created
    -> Atlas reviews
    -> Human reviews (if required)
    -> Approved: Action proceeds
    -> Rejected: Action blocked, reason logged
  -> Tier 4: BLOCKED by SGL
```

### Reviewing Decisions
Navigate to `/app/business-manager?tab=decisions` to:
- View all pending decision memos
- See approval/rejection history
- Filter by agent, risk tier, or status
- Track cost per decision and approval rates

## Tina (CFO) -- Financial Oversight

Tina is the designated financial oversight agent:

- **Budget Monitoring**: Tracks all spend against allocated budgets
- **Anomaly Detection**: Flags unusual spending patterns or unexpected charges
- **Compliance Verification**: Ensures all financial actions have proper authorization
- **Reporting**: Generates financial summaries and forecasts
- **Escalation**: Raises concerns to Atlas when spend patterns deviate from plan

Tina works within these constraints:
- Cannot authorize spend above the auto-spend limit
- Cannot modify SGL financial rules
- All findings are logged to the audit trail
- Financial reports are emailed to Atlas per chain-of-command

## Configuring Budget Controls

### Environment Variables
```
AUTO_SPEND_LIMIT_USD=500          # Maximum auto-approved spend per action
MAX_ACTIONS_PER_DAY=100           # Daily cap on total agent actions
ENGINE_ENABLED=true               # Must be true for budget automation to run
```

### Per-Tenant Configuration
Each tenant can have customized:
- Auto-spend limits appropriate to their operation size
- Action caps based on their subscription tier
- Custom budget categories and subcategories
- Alert thresholds for spend notifications

### Subscription Tier Defaults

| Tier | Auto-Spend Limit | Daily Action Cap | Budget Categories |
|------|-------------------|------------------|-------------------|
| Starter | $100 | 50 | Basic (5 categories) |
| Professional | $500 | 200 | Standard (15 categories) |
| Business | $2,000 | 500 | Advanced (25 categories) |
| Enterprise | Custom | Custom | Unlimited |

## SGL Financial Guardrails

The Statutory Guardrail Layer enforces these non-overridable financial rules:

- **BLOCKED**: Unauthorized bank transfers
- **BLOCKED**: Regulated financial execution without human authorization
- **BLOCKED**: Government filings without signature
- **REVIEW**: Ambiguous or regulated financial actions
- **REVIEW**: Actions requiring legal packet and chairman approval

No agent, tenant, administrator, or founder may bypass these constraints.

## Best Practices

### Budget Planning
1. Set auto-spend limits conservatively and increase as trust builds
2. Review daily action caps monthly and adjust based on actual usage
3. Create budget categories that map to your business operations
4. Schedule monthly budget reviews using Atlas's reporting capabilities

### Spend Monitoring
1. Check the Budgets tab daily during the first month of deployment
2. Use the Intelligence tab for trend analysis over longer periods
3. Set up Telegram notifications for spend alerts
4. Review decision memo approval rates to calibrate risk thresholds

### Cost Optimization
1. Analyze channel ROI to redirect spend toward high-performing channels
2. Review agent action logs for redundant or low-value operations
3. Adjust workflow frequencies based on cost-benefit analysis
4. Use the multi-provider AI setup to route tasks to cost-effective models

## Troubleshooting

### Unexpected Charges
- Check the audit log for the transaction details
- Review the associated job and workflow for context
- Verify the auto-spend limit setting
- Contact support if a charge appears unauthorized

### Decision Memos Not Generating
- Verify that `ENGINE_ENABLED=true`
- Check that the auto-spend limit is set correctly
- Review SGL evaluation logs for the action
- Ensure the risk tier classification is functioning

### Budget Data Discrepancies
- Compare ledger entries against external financial records
- Check for duplicate entries in the ledger
- Verify that all tenant data is scoped correctly
- Review the accounting summary computation logic
