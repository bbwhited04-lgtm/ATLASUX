# Tina KB: Financial Reconciliation Procedures

## Purpose

This document provides Tina with comprehensive knowledge of financial reconciliation processes, procedures, and best practices. Reconciliation is the process of comparing two sets of records to ensure they agree — it is a fundamental internal control that catches errors, fraud, and accounting issues before they compound.

---

## Bank Reconciliation

### Purpose

Ensure the cash balance per the company's books matches the cash balance per the bank statement, after accounting for timing differences and adjustments.

### Process

**Step 1: Obtain Records**
- Bank statement (for the reconciliation period, typically monthly)
- General ledger cash account balance
- Outstanding check register from prior month's reconciliation
- Deposit records

**Step 2: Start with the Bank Statement Balance**
```
Bank Statement Ending Balance
+ Deposits in Transit (recorded in books, not yet on bank statement)
- Outstanding Checks (recorded in books, not yet cleared at bank)
+/- Bank Errors (rare, but must be identified and reported to bank)
= Adjusted Bank Balance
```

**Step 3: Start with the Book Balance**
```
General Ledger Cash Balance
+ Interest Earned (on bank statement, not yet in books)
+ Notes Collected by Bank (on bank statement, not yet in books)
+ Electronic Deposits (ACH receipts not yet recorded)
- Bank Service Charges (on bank statement, not yet in books)
- NSF Checks (returned checks, on bank statement, not yet in books)
- Wire Transfer Fees
- Check Printing Charges
+/- Book Errors (discovered during reconciliation)
= Adjusted Book Balance
```

**Step 4: Compare**
- Adjusted Bank Balance must equal Adjusted Book Balance
- If they match, the reconciliation is complete
- If they do not match, investigate the difference

**Step 5: Record Journal Entries**
- All adjustments to the book balance require journal entries
- Bank-side adjustments (deposits in transit, outstanding checks) do not require entries — they are timing differences that will clear

### Common Reconciling Items

| Item | Side | Action |
|------|------|--------|
| Outstanding checks | Bank | Add time; will clear when check is deposited |
| Deposits in transit | Bank | Add time; will appear on next statement |
| Bank service charges | Book | Record expense (Debit Bank Fees, Credit Cash) |
| Interest earned | Book | Record income (Debit Cash, Credit Interest Income) |
| NSF checks | Book | Reverse the original receipt (Debit AR, Credit Cash) |
| Electronic payments received | Book | Record receipt (Debit Cash, Credit AR or appropriate account) |
| Auto-pay debits | Book | Record payment (Debit appropriate account, Credit Cash) |
| Bank errors | Bank | Contact bank for correction |
| Book errors | Book | Correcting journal entry |

### Stale Checks

- Checks outstanding for 6+ months are typically considered stale
- Contact the payee to determine if they received/lost the check
- If unreachable: void the check and reverse the original entry (Debit Cash, Credit the original expense/payable account)
- Some states require reporting unclaimed property (escheatment) — check your state's unclaimed property laws
- Timing: most states have a dormancy period of 1-5 years for outstanding checks before escheatment is required

### Best Practices

- Reconcile every bank account monthly, within 10 business days of receiving the statement
- The person performing the reconciliation should NOT be the person who writes checks or makes deposits (segregation of duties)
- Management should review and sign off on completed reconciliations
- Investigate ALL variances — even small ones can indicate systematic errors
- Keep prior reconciliations on file for audit purposes (minimum 7 years)
- Use accounting software auto-matching features to speed up the process, but always review manually

---

## Credit Card Reconciliation

### Purpose

Ensure all credit card transactions are properly recorded, categorized, and supported by documentation, and that the statement balance matches the books.

### Process

1. **Obtain the credit card statement** for the period
2. **Match each transaction** on the statement to a corresponding entry in the general ledger (or expense reports)
3. **Verify categorization** — ensure each charge is coded to the correct expense account
4. **Check for missing receipts** — every charge should have supporting documentation (receipts, invoices)
5. **Identify unauthorized charges** — flag any transactions not recognized by the cardholder
6. **Verify payments** — confirm that the statement was paid on time and the payment amount is correct
7. **Record any unrecorded transactions** — charges that appear on the statement but are not yet in the books
8. **Reconcile the ending balance** — credit card liability per books should match the statement

### Journal Entries

**Recording charges (if not already in the books)**
- Debit: Appropriate expense account
- Credit: Credit Card Payable

**Recording payment**
- Debit: Credit Card Payable
- Credit: Cash/Bank Account

**Disputed charges**
- Debit: Disputed Charges Receivable (or reduce Credit Card Payable)
- Credit: Appropriate expense account
- When resolved: reverse or adjust accordingly

### Best Practices

- Reconcile monthly, upon receipt of each statement
- Implement a policy requiring receipts for all charges over $25 (or lower threshold)
- Review credit card statements for personal charges (especially for employee and owner cards)
- Set spending limits by cardholder
- Cancel unused cards to reduce fraud risk
- Use accounting software integrations to import credit card transactions automatically

---

## Intercompany Reconciliation

### Purpose

Ensure that transactions between related entities (parent/subsidiary, divisions, branches) are properly recorded and eliminated in consolidation.

### Process

1. **Identify all intercompany accounts** — each entity should maintain a due-to/due-from account for each related entity
2. **Exchange intercompany account balances** — both entities share their intercompany account balances at period end
3. **Match transactions** — verify that each transaction recorded by one entity has a corresponding entry in the other entity's books
4. **Identify discrepancies** — timing differences (one entity recorded the transaction, the other has not yet) and errors (different amounts, different periods)
5. **Resolve discrepancies** — determine which entry is correct and have the other entity record or correct their entry
6. **Confirm matching balances** — due-to in one entity should equal due-from in the other (or net to zero in consolidation)

### Common Intercompany Transactions

- Management fees / shared services allocations
- Intercompany loans and interest
- Inventory transfers
- IP licensing fees
- Cost reimbursements
- Intercompany dividends

### Elimination Entries (Consolidation)

When preparing consolidated financial statements, ALL intercompany balances and transactions must be eliminated:
- Eliminate intercompany receivables and payables
- Eliminate intercompany revenue and expenses
- Eliminate intercompany profit in inventory (unrealized profit)
- Eliminate intercompany dividends

### Best Practices

- Use standardized intercompany billing templates and processes
- Set a monthly cut-off date and require all intercompany transactions to be recorded by that date
- Designate one person in each entity as the intercompany reconciliation contact
- Use a formal intercompany agreement documenting the terms of recurring transactions
- Automate matching where possible — accounting systems with intercompany modules can match transactions automatically
- Target: zero unresolved intercompany differences at each period close

---

## Accounts Receivable Reconciliation

### Purpose

Ensure the AR subledger (detail of individual customer invoices) agrees with the AR control account in the general ledger, and that all customer balances are accurate.

### Process

1. **Run the AR aging report** from the subledger as of the reconciliation date
2. **Compare the total** of the AR aging report to the AR balance in the general ledger
3. **Investigate differences**:
   - Unposted invoices or payments
   - Misapplied payments (applied to wrong customer or wrong invoice)
   - Credit memos not posted
   - Write-offs not recorded in the GL
   - Timing differences between subledger and GL posting
4. **Review individual customer balances** — look for:
   - Credit balances (customer overpaid or has an unapplied credit)
   - Stale balances (invoices outstanding beyond normal terms with no recent activity)
   - Unapplied cash (payments received but not matched to specific invoices)
5. **Reconcile to the bank** — verify that collections recorded in AR match deposits in the bank account
6. **Record adjustments** — post any necessary journal entries to correct the GL or subledger

### Best Practices

- Reconcile monthly (weekly for high-volume businesses)
- Investigate and resolve credit balances promptly (refund or apply to future invoices)
- Clear unapplied cash immediately — it obscures the true aging picture
- Send customer account statements monthly to confirm balances
- Flag any customer balance that has not changed in 90+ days for review

---

## Accounts Payable Reconciliation

### Purpose

Ensure the AP subledger (detail of individual vendor invoices) agrees with the AP control account in the general ledger, and that all vendor balances are accurate.

### Process

1. **Run the AP aging report** from the subledger as of the reconciliation date
2. **Compare the total** to the AP balance in the general ledger
3. **Investigate differences**:
   - Invoices received but not entered (often found in someone's inbox or desk)
   - Invoices entered but not yet posted to the GL
   - Duplicate invoices entered
   - Payments recorded in GL but not applied in subledger
   - Vendor credits not recorded
4. **Compare vendor statements** — request and reconcile vendor statements to your records
   - Discrepancies often arise from: missing invoices, duplicate payments, pricing disputes, returned goods credits not applied
5. **Record adjustments** — correct any identified errors

### Vendor Statement Reconciliation

- Request statements from major vendors quarterly (or monthly for high-volume vendors)
- Compare vendor statement to your AP records
- Identify and investigate any differences:
  - Invoices on vendor statement not in your records = likely unrecorded liability
  - Invoices in your records not on vendor statement = possible duplicate or vendor timing issue
  - Payment amounts that differ = investigate for partial payments, discounts, or errors

### Best Practices

- Reconcile monthly as part of the month-end close process
- Three-way match for invoice approval: purchase order + receiving report + vendor invoice must all agree before payment
- Never pay from a statement alone — always pay from approved invoices
- Watch for duplicate vendor records in the master file (same vendor with slightly different names)
- Review debit balances in AP (you overpaid or vendor owes you a credit) — request refund or apply to future invoices

---

## Inventory Reconciliation

### Purpose

Ensure that physical inventory quantities agree with the perpetual inventory records (and the general ledger), and that inventory is properly valued.

### Process

**Perpetual Inventory System**
1. **Run inventory valuation report** from the inventory management system
2. **Compare total** to the Inventory account in the general ledger
3. **Investigate differences**: unrecorded receipts, unrecorded shipments, cost adjustments, standard cost variances, scrap/spoilage not recorded
4. **Physical counts**: periodic cycle counts or annual physical inventory
5. **Adjust for shrinkage**: book-to-physical differences after physical count

**Physical Inventory Count**
1. Plan the count: date, teams, count sheets/scanners, areas to cover
2. Stop all movement (receiving and shipping) during the count, or carefully track any movement
3. Count all inventory items; record on count sheets
4. Compare physical count to book records
5. Investigate variances exceeding threshold (e.g., >5% quantity variance or >$500 value variance)
6. Record adjustments: Debit COGS or Inventory Shrinkage Expense, Credit Inventory

**Cycle Counting**
- Count a portion of inventory on a rotating schedule throughout the year
- ABC analysis: count "A" items (high value/high volume) more frequently than "B" or "C" items
  - A items: count monthly or quarterly
  - B items: count quarterly or semi-annually
  - C items: count annually
- Advantage: avoids the disruption of a full physical count; identifies issues more quickly

### Valuation Checks

- Verify inventory is valued at the lower of cost or net realizable value (ASC 330)
- Review for obsolete, slow-moving, or damaged inventory — write down if NRV is below cost
- Verify cost flow assumption (FIFO, LIFO, weighted average) is applied consistently
- For manufactured goods: verify that overhead allocation is accurate (UNICAP compliance if applicable — see tina-irs-code.md)

### Best Practices

- Implement cycle counting to reduce reliance on annual physical counts
- Segregate duties: the person who has custody of inventory should not be the person who records inventory transactions
- Use barcode or RFID scanning to reduce count errors
- Investigate and document all shrinkage — identify root causes (theft, damage, receiving errors, shipping errors)
- Maintain a reserve for inventory obsolescence based on aging analysis

---

## Month-End Close Checklist

### Timeline

Target: complete month-end close within 5-10 business days after month end.

### Checklist

**Day 1-2: Data Collection**
- [ ] Receive and process all invoices received through month-end
- [ ] Enter all vendor invoices into the system
- [ ] Record all cash receipts through month-end
- [ ] Process payroll for the period (if applicable)
- [ ] Receive bank statements

**Day 2-3: Reconciliations**
- [ ] Bank reconciliation for all accounts
- [ ] Credit card reconciliation for all cards
- [ ] AR subledger to GL reconciliation
- [ ] AP subledger to GL reconciliation
- [ ] Intercompany reconciliation (if applicable)
- [ ] Inventory reconciliation (if applicable)
- [ ] Petty cash count and reconciliation

**Day 3-4: Accruals and Adjustments**
- [ ] Record accrued expenses (wages, utilities, interest, etc.)
- [ ] Record prepaid expense amortization
- [ ] Record depreciation and amortization
- [ ] Record revenue accruals (unbilled revenue) or deferrals (unearned revenue)
- [ ] Record bad debt expense / allowance adjustment
- [ ] Record inventory adjustments (if applicable)
- [ ] Record intercompany elimination entries (if applicable)

**Day 4-5: Review**
- [ ] Run trial balance; review for unusual balances or unexpected changes
- [ ] Review all balance sheet accounts — every account should be reconciled and explainable
- [ ] Review revenue and expense accounts for reasonableness
- [ ] Compare to budget and prior periods; investigate significant variances
- [ ] Review journal entries for accuracy and proper supporting documentation
- [ ] Ensure all reconciliations are completed and documented

**Day 5-7: Finalization**
- [ ] Prepare financial statements (P&L, balance sheet, cash flow)
- [ ] Prepare management reporting package (variance analysis, KPI dashboard)
- [ ] Management review and approval
- [ ] Close the period in the accounting system (prevent further posting to the closed period)

---

## Trial Balance Review

### Purpose

The trial balance lists all general ledger accounts and their balances. Reviewing it ensures that debits equal credits and identifies accounts that require attention.

### What to Look For

- **Debits = Credits**: if they do not balance, there is a posting error
- **Unusual balances**: asset accounts with credit balances, liability accounts with debit balances, expense accounts with credit balances (unless refunds)
- **Large or unusual changes**: compare to prior month; investigate significant movements
- **Zero-balance accounts**: should they have a balance? Might indicate transactions not recorded
- **Suspense accounts**: should be cleared (zeroed out) at period end
- **Clearing accounts**: verify they are fully cleared (e.g., payroll clearing, inter-account transfer clearing)

### Analytical Procedures

- Compare each account balance to prior month and same month prior year
- Calculate month-over-month change ($ and %)
- Flag accounts with changes exceeding a threshold (e.g., >10% or >$5,000)
- Verify that known transactions are reflected (e.g., monthly rent should appear, payroll should appear at expected amounts)

---

## Journal Entry Adjustments

### Types of Adjusting Entries

**Accruals**
- Recognize revenue earned but not yet invoiced (Debit Unbilled Revenue/Contract Asset, Credit Revenue)
- Recognize expenses incurred but not yet invoiced by vendor (Debit Expense, Credit Accrued Liabilities)
- Example: December rent invoiced by landlord in January — accrue in December

**Deferrals**
- Defer revenue received but not yet earned (Debit Cash, Credit Deferred Revenue/Unearned Revenue)
- Defer expenses paid but not yet consumed (Debit Prepaid Expense, Credit Cash)
- Example: annual insurance premium paid in January — prepaid and amortized monthly

**Estimates**
- Bad debt expense (Debit Bad Debt Expense, Credit Allowance for Doubtful Accounts)
- Depreciation (Debit Depreciation Expense, Credit Accumulated Depreciation)
- Warranty reserve (Debit Warranty Expense, Credit Warranty Liability)
- Income tax provision (Debit Income Tax Expense, Credit Income Tax Payable and/or Deferred Tax Liability)

**Reclassifications**
- Move amounts between accounts to correct classification (no net impact on total assets, liabilities, or net income)
- Example: office supplies initially charged to Office Equipment; reclassify to Office Supplies Expense

**Error Corrections**
- Correct errors from prior periods
- If material and relates to a prior fiscal year: prior period adjustment (restate beginning retained earnings)
- If immaterial: correct in the current period

### Documentation Requirements

Every journal entry should include:
- Date of the entry
- Accounts and amounts (debits and credits)
- Description/explanation of the purpose
- Supporting documentation (calculation, invoice, schedule, reconciliation)
- Preparer identification
- Approval (for entries above a threshold — e.g., management approval for entries >$5,000)

---

## Reconciliation Frequency Guide

| Reconciliation | Minimum Frequency | Recommended Frequency |
|---------------|-------------------|----------------------|
| Bank accounts | Monthly | Monthly (within 5 days of statement) |
| Credit cards | Monthly | Monthly (upon statement receipt) |
| Accounts receivable | Monthly | Weekly (high-volume); Monthly (low-volume) |
| Accounts payable | Monthly | Monthly |
| Inventory | Quarterly (physical) | Monthly (cycle count); Annual (full physical) |
| Intercompany | Monthly | Monthly |
| Fixed assets | Annually | Semi-annually |
| Petty cash | Monthly | Weekly |
| Payroll clearing | Per pay period | Per pay period |
| Revenue/deferred revenue | Monthly | Monthly |

---

## Reconciliation Documentation Standards

### What to Retain

For each reconciliation, maintain a file containing:
- Date of reconciliation and period covered
- Preparer name and date completed
- Reviewer name and date reviewed
- Source documents (bank statement, subledger report, etc.)
- Reconciliation worksheet showing: beginning balance, each reconciling item with description, ending reconciled balance
- Supporting documentation for each reconciling item
- Status of unresolved items from prior reconciliations

### Retention Period

- Tax-related records: 7 years (or longer if NOLs or other carryforwards exist)
- General business records: 7 years minimum
- Some industries require longer retention (financial services, healthcare)
- Permanent retention: entity formation documents, tax returns, annual financial statements, audit reports

### Audit Trail

- Maintain a clear audit trail from the general ledger to the bank statement (or other external source)
- Every balance sheet account should be supported by a reconciliation
- Auditors will test reconciliations — ensure they are complete, accurate, and timely

---

## Notes for Tina

- Reconciliation is not optional — it is the most important internal control for financial accuracy
- Timely reconciliation catches errors and fraud before they compound; delayed reconciliation dramatically increases the difficulty and risk of financial reporting
- Segregation of duties is critical: custody of assets, recording transactions, and reconciliation should be performed by different people (where staffing allows)
- For small businesses with limited staff, implement compensating controls: owner review and approval of reconciliations, bank statement delivered directly to the owner, external accountant performing periodic reconciliations
- Suspense accounts and clearing accounts should always be zero at period end — non-zero balances indicate unresolved items
- Month-end close efficiency improves dramatically with standardized templates, checklists, and deadlines — invest in building these early
- Consider implementing a close management tool (FloQast, BlackLine, or even a well-structured spreadsheet) to track reconciliation completion and approval status
