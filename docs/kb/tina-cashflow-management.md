# Tina KB: Cash Flow Management

## Purpose

This document provides Tina with practical knowledge for managing, forecasting, and optimizing business cash flow. Cash flow management is distinct from profitability analysis — a profitable business can fail due to poor cash management. This covers the statement of cash flows, forecasting techniques, working capital optimization, and liquidity planning.

---

## Statement of Cash Flows — Three Activities

### Operating Activities

Cash flows from the primary revenue-generating activities of the business.

**Indirect Method (Most Common)**
```
Net Income
+ Depreciation & Amortization
+ Stock-Based Compensation
+ Amortization of Debt Issuance Costs
+/- Deferred Income Taxes
+/- Gain/Loss on Asset Sales (remove from operating; reclassify to investing)
+/- Impairment Charges
+/- Changes in Working Capital:
    - (Increase)/Decrease in Accounts Receivable
    - (Increase)/Decrease in Inventory
    - (Increase)/Decrease in Prepaid Expenses
    - Increase/(Decrease) in Accounts Payable
    - Increase/(Decrease) in Accrued Liabilities
    - Increase/(Decrease) in Deferred Revenue
= Cash Flow from Operating Activities
```

**Direct Method (Preferred by FASB but Rarely Used)**
```
Cash Received from Customers
- Cash Paid to Suppliers
- Cash Paid to Employees
- Cash Paid for Operating Expenses
- Cash Paid for Interest
- Cash Paid for Income Taxes
= Cash Flow from Operating Activities
```

**Key Insight**: operating cash flow should be positive and growing for a mature business. Negative operating cash flow in a growth-stage company is expected but must be funded by financing activities.

### Investing Activities

Cash flows from acquiring and disposing of long-term assets and investments.

- Capital expenditures (CapEx): purchase of PP&E, capitalized software development
- Proceeds from sale of PP&E or other assets
- Business acquisitions (net of cash acquired)
- Proceeds from divestitures
- Purchases/sales of investments and marketable securities
- Loans made to third parties (non-financial companies)

**Key Insight**: investing activities are typically negative (cash outflow) for growing businesses. High CapEx relative to revenue indicates capital intensity.

### Financing Activities

Cash flows from transactions with the company's owners and creditors.

- Proceeds from issuing equity (stock issuance, capital contributions)
- Repurchases of equity (treasury stock, owner withdrawals)
- Proceeds from borrowing (loans, lines of credit, bond issuance)
- Repayments of debt (principal payments)
- Dividend payments
- Finance lease principal payments

**Key Insight**: financing activities fund the gap between operating cash flow and investing needs. Healthy mature companies should fund operations and investments from operating cash flow, not financing.

---

## Direct vs. Indirect Method

### Comparison

| Aspect | Direct | Indirect |
|--------|--------|----------|
| Starting point | Gross cash receipts/payments | Net income |
| Preparation complexity | Higher (requires cash-basis data) | Lower (starts from accrual-basis data) |
| User preference | Analysts prefer it | Accountants find it easier |
| Usage | ~5% of companies | ~95% of companies |
| FASB preference | Preferred (encouraged) | Acceptable |
| Supplemental reconciliation | Must provide indirect reconciliation | No additional reconciliation needed |

### When to Use Direct Method

- When the business has simple cash flows and the data is readily available
- When presenting to non-financial stakeholders who find cash receipts/payments more intuitive
- When the board or investors specifically request it
- Internal management reporting often benefits from a direct method view

---

## Free Cash Flow

### Definition

Free Cash Flow (FCF) represents the cash available to the business after maintaining and expanding its asset base.

### Formulas

**Basic FCF**
```
Cash Flow from Operations
- Capital Expenditures
= Free Cash Flow
```

**Unlevered Free Cash Flow (UFCF)** — for valuation purposes
```
EBIT x (1 - Tax Rate)
+ Depreciation & Amortization
- Capital Expenditures
- Changes in Net Working Capital
= Unlevered Free Cash Flow
```

**Levered Free Cash Flow (LFCF)** — cash available to equity holders
```
Net Income
+ Depreciation & Amortization
- Capital Expenditures
- Changes in Net Working Capital
- Mandatory Debt Repayments
= Levered Free Cash Flow
```

### FCF Yield

- FCF Yield = Free Cash Flow / Market Capitalization (or Enterprise Value)
- Measures how much cash the business generates relative to its value
- Higher yield = more cash-generative relative to price

---

## Cash Conversion Cycle (CCC)

### Definition

The CCC measures how long it takes for a business to convert its investments in inventory and other resources into cash from sales. Lower is better.

### Formula

```
CCC = Days Inventory Outstanding + Days Sales Outstanding - Days Payable Outstanding
CCC = DIO + DSO - DPO
```

### Components

**Days Inventory Outstanding (DIO)**
- DIO = (Average Inventory / COGS) x 365
- How many days inventory sits before being sold
- Lower is better (but too low may mean stockouts)
- Industry dependent: retail 30-60 days, manufacturing 60-120 days

**Days Sales Outstanding (DSO)**
- DSO = (Average Accounts Receivable / Revenue) x 365
- How many days it takes to collect payment after a sale
- Lower is better
- Benchmarks: 30-45 days is good for most B2B businesses; 60+ is concerning

**Days Payable Outstanding (DPO)**
- DPO = (Average Accounts Payable / COGS) x 365
- How many days the business takes to pay its suppliers
- Higher is better for cash flow (but must maintain good vendor relationships)
- Benchmarks: 30-45 days is typical; 60+ may strain supplier relationships

### Example

- DIO: 45 days (inventory sits 45 days)
- DSO: 35 days (collect payment 35 days after sale)
- DPO: 40 days (pay suppliers 40 days after purchase)
- CCC: 45 + 35 - 40 = 40 days
- The business must fund 40 days of operations from its own resources before cash returns

### Negative CCC

- Some businesses (Amazon, subscription businesses) achieve negative CCC
- This means they collect cash before paying suppliers — the business is funded by its operating cycle
- Subscription businesses with annual prepayment and low inventory achieve this naturally

---

## Working Capital Management

### Definition

Working Capital = Current Assets - Current Liabilities

### Key Components

| Current Assets | Current Liabilities |
|---------------|-------------------|
| Cash and cash equivalents | Accounts payable |
| Accounts receivable | Accrued liabilities |
| Inventory | Current portion of long-term debt |
| Prepaid expenses | Deferred revenue (current) |
| Short-term investments | Income taxes payable |

### Working Capital Ratio (Current Ratio)

- Current Ratio = Current Assets / Current Liabilities
- **Below 1.0**: potentially unable to pay short-term obligations (red flag)
- **1.0-1.5**: adequate but tight — monitor closely
- **1.5-2.0**: healthy for most industries
- **Above 2.0**: may indicate underutilized assets (cash sitting idle, excess inventory)

### Quick Ratio (Acid Test)

- Quick Ratio = (Cash + Short-Term Investments + Accounts Receivable) / Current Liabilities
- Excludes inventory and prepaid expenses (less liquid assets)
- More conservative measure of liquidity
- **Above 1.0**: can cover short-term obligations without selling inventory

### Optimization Strategies

**Reduce DSO (Collect Faster)**
- Invoice promptly upon delivery
- Offer early payment discounts (2/10 Net 30)
- Implement automated payment reminders
- Accept electronic payments (ACH, credit card, online portals)
- Credit check customers before extending terms
- See tina-invoicing-ar.md for detailed AR management

**Reduce DIO (Turn Inventory Faster)**
- Implement just-in-time (JIT) inventory management
- Analyze slow-moving inventory and discount/liquidate
- Improve demand forecasting
- Negotiate vendor-managed inventory arrangements
- Review safety stock levels regularly

**Increase DPO (Pay Slower — Within Reason)**
- Negotiate extended payment terms with suppliers
- Use the full payment term — do not pay early unless a discount justifies it
- Centralize AP to control payment timing
- Consider supply chain financing (reverse factoring)
- Maintain goodwill — do not stretch payments to the point of damaging supplier relationships

---

## Cash Flow Forecasting

### 13-Week Rolling Cash Flow Forecast

The 13-week (one quarter) rolling forecast is the standard short-term cash management tool.

**Structure**

| Category | Week 1 | Week 2 | Week 3 | ... | Week 13 |
|----------|--------|--------|--------|-----|---------|
| **Beginning Cash** | $XX | $XX | $XX | | $XX |
| **Cash Inflows** | | | | | |
| Customer collections | | | | | |
| Other income | | | | | |
| Loan proceeds | | | | | |
| **Total Inflows** | $XX | $XX | $XX | | $XX |
| **Cash Outflows** | | | | | |
| Payroll | | | | | |
| Rent | | | | | |
| Supplier payments | | | | | |
| Debt payments | | | | | |
| Taxes | | | | | |
| CapEx | | | | | |
| Other | | | | | |
| **Total Outflows** | $XX | $XX | $XX | | $XX |
| **Net Cash Flow** | $XX | $XX | $XX | | $XX |
| **Ending Cash** | $XX | $XX | $XX | | $XX |

**How to Build**

1. Start with current cash balance
2. Forecast inflows based on: AR aging (when outstanding invoices will be collected), expected new sales and their collection timing, other income sources
3. Forecast outflows based on: payroll schedule, rent and fixed obligations, AP aging (when vendor payments are due), tax payment dates, planned CapEx, debt service schedule
4. Calculate net cash flow and ending balance for each week
5. Each week, update actuals and re-forecast the remaining weeks (rolling forward)

### Longer-Term Forecasting (Monthly/Annual)

- Use monthly forecasts for 6-12 month planning horizon
- Base on: revenue budget, expense budget, CapEx plan, debt schedule, seasonal patterns
- Sensitivity analysis: model best case, base case, and worst case scenarios
- Update monthly with actual results

### Scenario Planning

- **Best case**: revenue hits plan, collections are on schedule, no unexpected expenses
- **Base case**: most likely scenario based on current trends and known factors
- **Worst case**: revenue misses by 20%+, key customer delays payment, unexpected large expense
- **Stress test**: what if your largest customer stops paying? What if you lose 30% of revenue?

---

## Burn Rate and Runway

### Burn Rate

- **Gross burn rate**: total cash outflows per month (all operating expenses, CapEx, debt service)
- **Net burn rate**: total cash outflows minus total cash inflows per month
  - If cash inflows exceed outflows, the business has positive cash flow (not "burning")
- Use a 3-6 month average for stability — single months can be misleading

### Runway

- **Runway** = Current Cash Balance / Net Monthly Burn Rate
- Measures how many months the business can operate before running out of cash
- **Critical thresholds**:
  - Less than 3 months: emergency — immediate action required (cut expenses, raise capital, arrange credit)
  - 3-6 months: warning — begin planning capital raise or cost reductions
  - 6-12 months: manageable — monitor closely and plan ahead
  - 12+ months: comfortable — focus on growth execution

### For Startups/Growth-Stage Companies

- Burn rate is a primary management metric
- VCs typically expect 18-24 months of runway post-funding
- Track burn rate weekly during rapid growth or cash-constrained periods
- Include all committed but not yet spent obligations (signed contracts, hiring plans)

---

## Cash Reserves Policy

### How Much Cash to Keep

There is no universal answer, but guidelines include:

- **Minimum operating reserve**: 3-6 months of operating expenses
  - Covers: payroll obligations, rent and fixed costs, essential vendor payments, debt service
- **Opportunity reserve**: additional cash for investments, acquisitions, or growth initiatives
- **Emergency reserve**: buffer for unexpected events (economic downturn, loss of major customer, litigation)

### Factors Affecting Reserve Size

- Revenue volatility (higher volatility = larger reserve needed)
- Customer concentration (if one customer is 20%+ of revenue, increase reserve)
- Industry cyclicality
- Access to credit facilities (available line of credit reduces the need for cash reserves)
- Growth plans (higher growth requires more cash)
- Seasonality (need to fund low-revenue periods from cash reserves)

### Where to Keep Reserves

- **Operating account**: daily cash needs (1-2 weeks of expenses)
- **Money market / high-yield savings**: short-term reserves (1-3 months of expenses); immediately accessible
- **Short-term Treasury bills or CDs**: medium-term reserves (3-6 months); slightly less liquid but higher yield
- **Investment policy**: define acceptable instruments, maximum maturities, and credit quality requirements

---

## AP/AR Optimization Strategies

### Accounts Payable Optimization

- **Payment timing**: pay on the last day of the payment term (not before) unless capturing an early payment discount
- **Early payment discount analysis**: if the discount's annualized rate exceeds your cost of capital, take it
  - Example: 2/10 Net 30 = ~36% annualized; if your cost of capital is 10%, always take this discount
- **Vendor negotiations**: request extended terms (Net 45 or Net 60) from key suppliers; offer volume commitments in exchange
- **Payment batching**: process payments in weekly or bi-weekly batches rather than daily to improve cash flow predictability
- **Supply chain financing**: use third-party financing to pay suppliers early (they get paid, you pay later at a fee); particularly useful for large organizations

### Accounts Receivable Optimization

- **Deposit/prepayment requirements**: require deposits on large projects (25-50% upfront)
- **Progress billing**: bill at milestones rather than upon completion
- **Auto-pay setup**: for recurring customers, set up automatic payment (ACH debit)
- **Credit management**: review customer creditworthiness before extending terms; set credit limits
- **Invoice accuracy**: errors cause payment delays; review invoices for accuracy before sending
- **Electronic invoicing**: reduces delivery time by 3-5 days compared to mail
- **Factoring/AR financing**: sell receivables to a factor for immediate cash (typically 80-95% of face value upfront, remainder minus fees when collected); cost: 1-5% of invoice value

---

## Payment Timing Strategies

### Payroll

- Most significant recurring cash outflow for most businesses
- Bi-weekly payroll = 26 pay periods/year; semi-monthly = 24 pay periods/year
- Two months per year have three bi-weekly paydays — plan cash for these "triple" months
- Payroll taxes: deposit per IRS schedule (semi-weekly or monthly based on lookback period)

### Quarterly Estimated Tax Payments

- Due: April 15, June 15, September 15, January 15
- For pass-through entities, owners make estimated payments personally
- C-Corps make estimated payments at the entity level
- Safe harbor: 100% of prior year tax liability (110% if AGI exceeds $150,000) avoids underpayment penalties
- Consider annualizing income to reduce earlier quarter payments when income is back-loaded

### Annual Tax Planning Cash Needs

- Coordinate with tina-tax-planning.md for timing strategies
- Extension = extension to file, not extension to pay — penalties accrue on unpaid balances
- Consider paying estimated taxes from a high-yield account to earn interest until payment dates

### Vendor Payment Strategy

- Map all recurring vendor payments by due date
- Identify which vendors offer early payment discounts
- Prioritize payments: payroll and payroll taxes first (trust fund liability), then rent, insurance, critical suppliers, then everything else
- Maintain a payment priority matrix for cash-tight periods

---

## Key Cash Flow Ratios

| Ratio | Formula | What It Measures |
|-------|---------|-----------------|
| **Operating Cash Flow Ratio** | OCF / Current Liabilities | Ability to cover short-term obligations from operations |
| **Cash Flow to Debt** | OCF / Total Debt | Ability to service total debt from operations |
| **Free Cash Flow Yield** | FCF / Enterprise Value | Cash generation efficiency relative to value |
| **Cash Flow Coverage** | OCF / Total Debt Service (P+I) | Ability to cover debt payments |
| **CapEx to OCF** | CapEx / OCF | Proportion of cash flow consumed by capital investment |

### Warning Signs

- Operating cash flow consistently below net income (earnings quality issue)
- Increasing DSO (customers paying slower)
- Negative free cash flow for a mature business
- Cash flow coverage ratio below 1.2x (tight debt service coverage)
- Working capital deteriorating quarter over quarter
- Increasing reliance on financing activities to fund operations

---

## Notes for Tina

- Cash is the ultimate reality check — a business that cannot generate cash will eventually fail regardless of its reported profitability
- The 13-week cash flow forecast is the most important short-term financial tool; update it religiously
- Working capital optimization is often the highest-impact area for improving cash flow — even small improvements in DSO, DIO, or DPO can release significant cash
- For startups and growth companies, burn rate and runway are existential metrics — monitor weekly
- Cash flow forecasting requires collaboration across departments: sales (pipeline and timing), operations (vendor payments and CapEx), HR (hiring plans and payroll), and finance
- Always maintain a line of credit as a safety net, even if you do not plan to use it — arranging credit during a cash crisis is nearly impossible
- The indirect method cash flow statement reconciles net income to operating cash flow — large recurring adjustments (especially growing AR or inventory) signal that accrual profits are not converting to cash
