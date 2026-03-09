# Tina KB: Invoicing and Accounts Receivable Management

## Purpose

This document provides Tina with practical knowledge for managing invoicing, accounts receivable, collections, and related financial processes. This covers QuickBooks-style workflows, industry best practices, and the accounting treatment for AR-related transactions.

---

## Invoice Creation

### Essential Invoice Components

Every invoice must include these elements for legal enforceability and clear communication:

- **Invoice number**: unique, sequential identifier (format: INV-2026-0001 or similar)
- **Invoice date**: date the invoice is issued
- **Due date**: calculated from payment terms
- **Bill-to information**: customer name, address, contact
- **Ship-to information** (if applicable): delivery address
- **Line items**: description of goods/services, quantity, unit price, extended amount
- **Subtotal**: sum of all line items
- **Taxes**: applicable sales tax, use tax, or VAT with rates and amounts
- **Discounts**: early payment discounts, volume discounts, or promotional discounts
- **Total due**: net amount owed after taxes and discounts
- **Payment instructions**: accepted payment methods, bank details (for ACH/wire), online payment link
- **Terms and conditions**: payment terms, late fee policy, dispute resolution

### Invoice Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Standard invoice** | One-time billing for completed goods/services | Most common; project completion, product delivery |
| **Recurring invoice** | Automatically generated on a schedule | Subscriptions, retainers, monthly services |
| **Progress invoice** | Partial billing based on project milestones | Construction, consulting, long-term projects |
| **Proforma invoice** | Estimate/quote before work begins | International trade, pre-approval for budget |
| **Credit memo** | Negative invoice to adjust or reverse charges | Returns, billing errors, negotiated adjustments |
| **Debit memo** | Additional charge to an existing invoice | Supplemental charges, price adjustments |
| **Time-and-materials invoice** | Billing based on hours + materials used | Professional services, repair work |
| **Retainer invoice** | Advance payment for future services | Legal, consulting, creative agencies |

### Invoice Numbering Best Practices

- Use a consistent, sequential numbering system
- Include the year or year-month prefix for easy reference (INV-2026-0001)
- Never reuse or skip invoice numbers — gaps raise audit questions
- For multiple revenue streams or locations, use prefixes (SVC-2026-001, PRD-2026-001)

---

## Payment Terms

### Standard Terms

| Term | Meaning | Typical Use |
|------|---------|-------------|
| **Due on receipt** | Payment due immediately | Small purchases, retail |
| **Net 15** | Due within 15 days of invoice date | Fast-paying industries, small vendors |
| **Net 30** | Due within 30 days of invoice date | Most common B2B standard |
| **Net 45** | Due within 45 days | Larger companies, government |
| **Net 60** | Due within 60 days | Enterprise customers, construction |
| **Net 90** | Due within 90 days | Government contracts, international trade |
| **2/10 Net 30** | 2% discount if paid within 10 days; full amount due in 30 | Incentivize early payment |
| **1/10 Net 60** | 1% discount if paid within 10 days; full amount due in 60 | Extended terms with early pay incentive |
| **COD** | Cash on delivery | High-risk customers, first orders |
| **CIA** | Cash in advance | High-risk situations, custom orders |
| **EOM** | End of month | Payment due at end of the month of invoice |

### Early Payment Discount Analysis

The annualized cost of NOT taking a discount:

- **2/10 Net 30**: customer saves 2% by paying 20 days early = annualized rate of approximately 36.7%
  - Formula: (Discount% / (100% - Discount%)) x (365 / (Net days - Discount days))
  - (2/98) x (365/20) = 37.2%
- Offering 2/10 Net 30 is expensive for the seller but dramatically improves cash flow
- Evaluate whether the cash flow benefit justifies the discount cost based on the business's cost of capital

### Setting Payment Terms

- Consider: industry norms, customer creditworthiness, your cash flow needs, competitive pressure
- New customers: start with Net 30 or shorter; extend terms as relationship develops
- Large customers: may demand Net 60-90; negotiate based on volume and relationship value
- International customers: consider letters of credit or CIA for new relationships
- Document terms in the customer agreement/contract before issuing invoices

---

## Progress Billing

### How It Works

Progress billing (also called milestone billing or percentage-of-completion billing) invoices customers at defined project milestones rather than upon final completion.

### Common Structures

- **Milestone-based**: invoice upon completion of defined deliverables (e.g., design complete = 25%, development complete = 50%, testing complete = 25%)
- **Percentage-of-completion**: invoice based on the percentage of work completed each period
- **Cost-to-cost method**: percentage complete = costs incurred to date / total estimated costs
- **Time-based**: invoice monthly for work performed during the period

### Revenue Recognition Considerations

- Under ASC 606 / IFRS 15, revenue is recognized as performance obligations are satisfied
- Progress billing amounts that exceed revenue recognized = contract liability (deferred revenue)
- Revenue recognized that exceeds progress billing = contract asset (unbilled revenue)
- Track these carefully for balance sheet presentation

### Best Practices

- Define milestones and billing triggers clearly in the contract
- Invoice promptly upon milestone completion — delay erodes cash flow
- Include progress reports with invoices so the customer understands what they are paying for
- Maintain a separate schedule tracking: contract value, milestones, amounts billed, amounts collected, retention (if applicable)

---

## Retainers

### Structure

- Customer pays an upfront amount (retainer) to secure future services
- Retainer is recorded as a liability (unearned revenue / customer deposit) until services are performed
- As services are delivered, retainer is drawn down and revenue is recognized
- Two models:
  - **Replenishing retainer**: customer maintains a minimum balance; tops up when drawn below threshold
  - **Non-replenishing retainer**: fixed amount applied against services until exhausted

### Accounting Treatment

- Receipt of retainer: Debit Cash, Credit Unearned Revenue (liability)
- As services are performed: Debit Unearned Revenue, Credit Service Revenue
- Unused retainer: either refund to customer or recognize as revenue per contract terms (breakage revenue)
- Monitor retainer balances monthly and communicate to customers

---

## Late Fees and Interest Charges

### Legal Framework

- Late fees must be disclosed in advance (in the contract or on the invoice)
- State usury laws limit the maximum interest rate that can be charged — varies by state (typically 12-24% annually; some states lower)
- Common late fee structures:
  - Flat fee: $25–$50 per overdue invoice
  - Percentage: 1.0–1.5% per month on the outstanding balance (12–18% annually)
  - Combination: flat fee plus interest on balances over 30 days past due

### Accounting Treatment

- Late fees and interest charges are recognized as income when assessed (if collection is probable)
- Debit Accounts Receivable, Credit Interest Income or Late Fee Income
- If collection is uncertain, do not accrue — recognize only when received

### Best Practices

- Include late fee terms on every invoice and in the customer agreement
- Enforce consistently — selective enforcement undermines the policy and can create legal issues
- Send a reminder before assessing late fees (professional courtesy that also improves collections)
- Consider waiving first-time late fees for good customers — but document the exception

---

## Accounts Receivable Aging

### Aging Buckets

| Category | Description | Action Required |
|----------|-------------|-----------------|
| **Current** | Not yet due | Monitor; no action needed |
| **1–30 days** | Past due 1-30 days | Friendly reminder (email or automated statement) |
| **31–60 days** | Past due 31-60 days | Follow-up call; escalate to AR manager |
| **61–90 days** | Past due 61-90 days | Demand letter; credit hold on new orders; escalate to management |
| **91+ days** | Past due over 90 days | Final demand; consider collections agency or legal action; evaluate write-off |

### Key Metrics

- **Days Sales Outstanding (DSO)**: average number of days to collect payment
  - DSO = (Accounts Receivable / Total Credit Sales) x Number of Days
  - Industry benchmarks: professional services 45-60 days; manufacturing 40-50 days; tech/SaaS 30-45 days
- **AR Turnover Ratio**: Net Credit Sales / Average Accounts Receivable
  - Higher ratio = faster collection
- **Aging Percentage**: percentage of total AR in each aging bucket
  - Target: 85%+ in current/1-30 day buckets
  - Red flag: more than 10% in 90+ days
- **Collection Effectiveness Index (CEI)**: (Beginning AR + Monthly Sales - Ending AR) / (Beginning AR + Monthly Sales - Ending Current AR) x 100
  - Target: 80%+ is good; 90%+ is excellent

### Running an AR Aging Report

- Generate weekly (at minimum, monthly) from accounting software
- Review by customer — identify patterns (chronically late payers)
- Review by amount — prioritize large balances for collection efforts
- Compare to prior periods — is aging improving or deteriorating?
- Present aging summary to management monthly as part of cash flow reporting

---

## Bad Debt Write-Off

### Two Methods

**Direct Write-Off Method**
- Write off specific uncollectible accounts when they become definitively uncollectible
- Debit Bad Debt Expense, Credit Accounts Receivable
- Simple but does not match expense to the period revenue was recognized
- Acceptable for tax purposes; not acceptable under GAAP for material amounts (violates matching principle)

**Allowance Method (GAAP Required)**
- Estimate uncollectible accounts and maintain an allowance (contra-asset account)
- Establish the allowance: Debit Bad Debt Expense, Credit Allowance for Doubtful Accounts
- Write off specific accounts against the allowance: Debit Allowance for Doubtful Accounts, Credit Accounts Receivable
- If a written-off account is later collected: reverse the write-off (Debit AR, Credit Allowance), then record the collection (Debit Cash, Credit AR)

### Estimating Bad Debt Allowance

- **Percentage of sales method**: apply a historical percentage to credit sales for the period (e.g., 1-2% of credit sales)
- **Aging method**: apply different percentages to each aging bucket based on historical collection rates
  - Example: Current = 1%, 1-30 days = 5%, 31-60 = 10%, 61-90 = 25%, 91+ = 50%
  - This provides a more accurate estimate by accounting for aging risk

### Tax Deduction for Bad Debts

- **Accrual method**: deduct bad debts when they become wholly or partially worthless (must demonstrate worthlessness)
- **Cash method**: generally no deduction (income was never recognized, so there is nothing to deduct)
- Partially worthless debts: can deduct the portion that is worthless if charged off on the books
- Wholly worthless debts: deduct the entire amount; must prove the debt is completely worthless
- Business vs. nonbusiness bad debts: business bad debts are ordinary deductions; nonbusiness bad debts (personal loans) are short-term capital losses
- Statute of limitations: 7 years for bad debt deductions (vs. standard 3 years)

---

## Collections Workflow

### Stage 1: Preventive (Before Due Date)

1. Invoice promptly upon delivery of goods/services
2. Confirm receipt of invoice (especially for new customers or large invoices)
3. Send automated payment reminder 5-7 days before due date
4. Offer convenient payment methods (ACH, credit card, online portal)

### Stage 2: Early Follow-Up (1–30 Days Past Due)

1. Day 1 past due: automated reminder email
2. Day 7: second email with invoice attached
3. Day 14: phone call to AP contact — polite inquiry about payment status
4. Day 21: escalate to supervisor or account manager
5. Document all communication attempts

### Stage 3: Escalation (31–60 Days Past Due)

1. Formal past-due notice (written letter or email)
2. Place credit hold on the customer's account (no new orders until paid)
3. Contact senior management at customer's organization
4. Negotiate payment plan if customer is experiencing cash flow issues
5. Review contract for late fee provisions and enforce

### Stage 4: Aggressive Collection (61–90 Days Past Due)

1. Send demand letter (consider having it from legal counsel)
2. Assess late fees/interest as per contract terms
3. Offer settlement at a discount (e.g., accept 80-90% of the balance for immediate payment)
4. Evaluate whether to engage a collections agency (typical agency fees: 25-50% of collected amount)

### Stage 5: Final Resolution (90+ Days)

1. Make a final determination: collect, settle, or write off
2. If amount justifies it, pursue legal action (demand letter, small claims court for smaller amounts, litigation for larger)
3. If uncollectible, write off the bad debt (ensure proper documentation for tax deduction)
4. File Form 1099-C if debt is forgiven and the debtor is not a corporation (if amount ≥ $600)
5. Update internal records and customer credit file

---

## Credit Memos

### When to Issue

- Customer returns goods (partial or full)
- Billing error on original invoice (wrong quantity, wrong price, wrong customer)
- Negotiated price reduction after original invoice
- Damaged or defective goods
- Fulfillment of warranty claims

### Accounting Treatment

- Debit Sales Returns and Allowances (or Revenue), Credit Accounts Receivable
- If the original sale included inventory: Debit Inventory (at cost), Credit Cost of Goods Sold
- Credit memos reduce outstanding AR and reduce revenue for the period
- Number credit memos sequentially (CM-2026-0001) and reference the original invoice number

### Best Practices

- Require management approval for credit memos above a threshold (e.g., $500 or $1,000)
- Audit credit memo activity regularly — excessive credit memos may indicate billing problems, quality issues, or fraud
- Under ASC 606, estimated returns should be reflected as a reduction of revenue at the time of sale (not when the return occurs)

---

## Recurring Invoices

### Setup

- Automate in accounting software (QuickBooks, Xero, FreshBooks, etc.)
- Define: customer, line items, amount, frequency (weekly, monthly, quarterly, annually), start date, end date (or ongoing)
- Recurring invoices are ideal for: subscription services, retainer billing, lease payments, maintenance contracts

### Management

- Review recurring invoice templates quarterly — ensure pricing is current
- Set up automatic email delivery on the invoice date
- Track payment patterns — if a recurring customer starts paying late, investigate promptly
- Cancel or modify recurring invoices immediately when contracts change or end

---

## Accounting Software Workflow (QuickBooks-Style)

### Invoice-to-Cash Cycle

1. **Create invoice** → AR increases (Debit AR, Credit Revenue)
2. **Send invoice** → delivered to customer via email/mail/portal
3. **Customer pays** → AR decreases (Debit Cash/Bank, Credit AR)
4. **Deposit received** → cash appears in bank account
5. **Bank reconciliation** → match deposit to payment receipt

### Key Reports

| Report | Purpose | Frequency |
|--------|---------|-----------|
| AR Aging Summary | Overview of outstanding receivables by age | Weekly |
| AR Aging Detail | Line-item detail of each outstanding invoice | Monthly |
| Customer Balance Summary | Total owed by each customer | Monthly |
| Invoice List | All invoices issued in a period | Monthly |
| Sales by Customer | Revenue breakdown by customer | Monthly/Quarterly |
| Collections Report | Status of collection activities | Weekly |
| Bad Debt Report | Write-offs and allowance activity | Monthly |
| DSO Trend | Days sales outstanding over time | Monthly |

### Internal Controls for AR

- **Segregation of duties**: the person who creates invoices should not be the person who records payments or performs bank reconciliation
- **Approval requirements**: credit memos, write-offs, and payment plans require management approval
- **Reconciliation**: reconcile AR subledger to general ledger monthly
- **Customer statements**: send monthly statements to all customers with open balances
- **Audit trail**: maintain documentation for all adjustments, write-offs, and credit memos
- **Access controls**: limit who can create invoices, record payments, and issue credit memos in the accounting system

---

## Notes for Tina

- AR management directly impacts cash flow — DSO improvement of even 5-10 days can significantly affect working capital
- The collection process should be documented, consistent, and escalating — ad hoc collections are ineffective
- Bad debt estimation is a significant judgment area — use historical data and update assumptions regularly
- For tax purposes, maintain documentation of collection efforts to support bad debt deductions
- Consider factoring (selling receivables to a third party at a discount) for immediate cash if AR aging is problematic — but understand the cost (typically 1-5% of the invoice amount, plus fees)
- Electronic invoicing and payment methods significantly reduce DSO — push customers toward ACH and online payments
