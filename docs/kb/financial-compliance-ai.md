# Financial Compliance for AI

Tina's operational guide to automated financial management within Atlas UX. Covers bookkeeping, expense tracking, budget enforcement, spend controls, tax preparation support, and financial reporting cadence.

---

## Core Principles

1. **Every dollar is tracked.** No transaction enters or leaves the system without a ledger entry.
2. **Every spend is governed.** Spending above AUTO_SPEND_LIMIT_USD requires a decision memo.
3. **Every action is auditable.** Financial operations are logged to the audit trail with full metadata.
4. **Recurring charges require approval.** Recurring purchases are blocked by default in Alpha. Each must be explicitly approved through the decision memo process.

---

## Automated Bookkeeping

### Transaction Recording

Tina records every financial transaction to the ledger with the following fields:

- **Date:** When the transaction occurred.
- **Amount:** Positive for income, negative for expenses.
- **Category:** Standardized expense category (see below).
- **Description:** Plain-English description of what the transaction was for.
- **Source:** Where the transaction originated (payment processor, manual entry, agent action).
- **Tenant ID:** Multi-tenant scoping ensures financial data isolation.
- **Audit Reference:** Link to the audit log entry for traceability.

### Expense Categories

Tina uses a standardized category taxonomy. Consistent categorization is critical for accurate reporting and tax preparation.

| Category | Examples |
|----------|----------|
| Software & Tools | SaaS subscriptions, API fees, domain renewals |
| Advertising | Ad spend across all platforms (Penny's budget) |
| Content Production | AI compute for content generation, stock assets |
| Professional Services | Legal, accounting, consulting fees |
| Office & Equipment | Hardware, supplies, workspace costs |
| Travel & Meals | Business travel, client meals |
| Payroll & Contractors | Wages, contractor payments |
| Insurance | Business insurance, liability coverage |
| Taxes & Fees | Government fees, estimated tax payments |
| Miscellaneous | Anything that does not fit above (flag for review) |

**Rule:** If Miscellaneous exceeds 5% of total expenses in any month, Tina flags it for category review. High miscellaneous percentage indicates categorization drift.

---

## Budget Enforcement

### Setting Budgets

Budgets are set per category per month. Tina enforces three threshold levels:

1. **Green (0-80% of budget):** Normal operations. No alerts.
2. **Yellow (80-100% of budget):** Tina sends a warning to Atlas and the business owner. Agents with spending authority in that category are notified.
3. **Red (100%+ of budget):** Category is frozen. Any new spending in this category requires a decision memo with explicit approval.

### Spend Limit Controls

The platform enforces hard spend limits at multiple levels:

- **Per-Transaction Limit:** AUTO_SPEND_LIMIT_USD. Any single transaction above this amount requires decision memo approval.
- **Daily Limit:** MAX_ACTIONS_PER_DAY caps the total number of financial actions per day.
- **Recurring Charge Block:** All recurring charges are blocked by default. Each must be individually approved.
- **Category Budget:** Monthly ceiling per expense category.

### Decision Memo Process for Financial Actions

When a spend exceeds the auto-limit, the following happens:

1. The requesting agent (any agent, not just Tina) generates a decision memo.
2. The memo includes: amount, purpose, category, risk assessment, and recommendation.
3. Atlas reviews the memo. For amounts above a configurable threshold, the business owner is also required to approve.
4. Approved memos are logged to the audit trail with the approver's identity and timestamp.
5. Denied memos are logged with the denial reason.

---

## Recurring Charge Detection

Tina monitors for patterns that indicate recurring charges:

**Detection Criteria:**
- Same vendor + similar amount appearing 2+ months consecutively.
- Subscription confirmation emails processed through the email system.
- Calendar entries indicating billing dates (Claire cross-references).

**Actions on Detection:**
1. Flag the charge as recurring in the ledger.
2. Check if a decision memo exists approving the recurring charge.
3. If no approval exists, block the next occurrence and generate a decision memo.
4. If approval exists, continue processing but add to the recurring charges report.

**Recurring Charges Report:** Tina produces a monthly summary of all active recurring charges, including: vendor, amount, category, frequency, approval status, and cumulative annual cost.

---

## Tax Preparation Support

Tina does not file taxes (that requires a licensed professional), but she prepares everything a tax preparer needs.

### Quarterly Tax Prep Package

Produced at the end of each quarter:

1. **Income Summary:** Total revenue by source with monthly breakdown.
2. **Expense Summary:** Total expenses by category with monthly breakdown.
3. **Profit/Loss Statement:** Revenue minus expenses, month by month.
4. **Deduction Candidates:** Expenses flagged as potentially deductible (software, home office, professional development, business travel).
5. **Contractor Payments:** Any payments to contractors above $600 (1099 threshold in the US).
6. **Recurring Charges List:** All active subscriptions and recurring payments.
7. **Anomaly Notes:** Any unusual transactions that a tax preparer should review.

### Year-End Package

Everything in the quarterly package, aggregated for the full year, plus:

- Annual revenue trend analysis.
- Year-over-year expense comparison (if prior year data exists).
- Asset depreciation schedule (if business assets are tracked).
- Estimated quarterly tax payment history.

---

## Financial Reporting Cadence

### Daily

- **Cash position update:** Current balance, pending income, pending expenses.
- **Transaction log:** All transactions recorded in the past 24 hours.
- **Alert summary:** Any budget warnings or spend limit triggers.

### Weekly

- **Week-over-week comparison:** Revenue, expenses, and net income compared to prior week.
- **Budget burn rate:** How fast each category budget is being consumed.
- **Accounts receivable aging:** Outstanding invoices and days overdue.
- **Top expenses:** Largest 5 expenses for the week.

### Monthly

- **Full P&L statement:** Revenue, COGS, gross margin, operating expenses, net income.
- **Budget vs. actual:** Each category budget compared to actual spend, with variance analysis.
- **Recurring charges review:** All active recurring charges with cumulative cost.
- **MRR/ARR update:** Current recurring revenue metrics (feeds into SaaS metrics tracking).
- **Cash flow forecast:** Projected cash position for next 30/60/90 days.

### Quarterly

- **Tax prep package:** As described above.
- **Trend analysis:** Quarter-over-quarter comparison of key financial metrics.
- **Budget adjustment recommendations:** Based on actual spend patterns, Tina suggests budget modifications for the next quarter.

---

## Ledger Reconciliation

Tina reconciles the internal ledger against external sources monthly:

1. **Bank statement reconciliation:** Compare ledger entries against bank transactions. Flag unmatched entries on either side.
2. **Payment processor reconciliation:** Compare recorded income against payment processor reports (Stripe, PayPal, etc.).
3. **Subscription reconciliation:** Compare recurring charges list against actual charges from vendors.

**Discrepancy Handling:**
- Discrepancies under $10: Auto-resolve with adjustment entry and note.
- Discrepancies $10-$100: Flag for Tina to investigate and resolve.
- Discrepancies over $100: Escalate to Atlas via decision memo. Larry audits the root cause.

---

## Compliance Guardrails

### What Tina Can Do Autonomously

- Record transactions to the ledger.
- Categorize expenses.
- Generate reports and alerts.
- Flag budget overruns.
- Process approved recurring charges.
- Send payment reminders for outstanding invoices.

### What Requires Approval

- Any new expense above AUTO_SPEND_LIMIT_USD.
- Any new recurring charge.
- Budget modifications.
- Refunds or credits above the auto-approval threshold.
- Changes to payment terms for existing clients.

### What Tina Cannot Do

- File tax returns (requires licensed professional).
- Open or close bank accounts.
- Change payroll settings.
- Make investment decisions.
- Modify the governance rules that constrain her own actions.

---

## Integration Points

- **Payment Processors:** Transaction data feeds ledger entries.
- **Email System:** Invoice delivery and payment reminders.
- **Calendar (Claire):** Billing date tracking and financial meeting scheduling.
- **Audit System (Larry):** All financial actions logged for compliance review.
- **Decision Memo System:** Approval workflow for above-limit spending.
- **Daily-Intel:** Financial metrics included in daily briefings.
