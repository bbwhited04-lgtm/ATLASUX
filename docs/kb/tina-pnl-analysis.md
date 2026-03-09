# Tina KB: Profit & Loss Statement Analysis

## Purpose

This document provides Tina with comprehensive knowledge for analyzing, interpreting, and advising on Profit & Loss (Income) statements. It covers the structure of the P&L, key metrics, analytical techniques, and SaaS-specific financial metrics.

---

## P&L Statement Structure

### Standard Format

```
Revenue (Net Sales)
  - Cost of Goods Sold (COGS) / Cost of Revenue
= Gross Profit
  - Operating Expenses
    - Selling Expenses
    - General & Administrative Expenses (G&A)
    - Research & Development (R&D)
    - Depreciation & Amortization (if not in COGS)
= Operating Income (EBIT)
  + Other Income
  - Other Expenses
  +/- Interest Income/Expense
= Income Before Taxes (EBT)
  - Income Tax Expense
= Net Income
```

### Key Line Items Explained

**Revenue / Net Sales**
- Total income from primary business activities
- Net of returns, allowances, and discounts
- Must follow ASC 606 / IFRS 15 recognition principles
- Distinguish between: product revenue, service revenue, subscription revenue, licensing revenue
- Report gross vs. net based on principal vs. agent analysis

**Cost of Goods Sold (COGS) / Cost of Revenue**
- Direct costs attributable to producing goods or delivering services
- Product businesses: raw materials, direct labor, manufacturing overhead, freight-in, production supplies
- Service businesses: direct labor, subcontractor costs, direct project expenses
- SaaS businesses: hosting/infrastructure costs, customer support (direct), third-party software licenses embedded in the product, payment processing fees
- Does NOT include: sales commissions, marketing, general overhead, R&D

**Gross Profit**
- Revenue minus COGS
- Represents the margin available to cover operating expenses and generate profit
- Gross Margin = Gross Profit / Revenue x 100%

**Operating Expenses (OpEx)**
- **Selling expenses**: sales salaries and commissions, advertising, marketing, trade shows, travel (sales-related), CRM software
- **General & Administrative (G&A)**: executive compensation, office rent, utilities, insurance, legal, accounting, HR, office supplies, IT infrastructure (non-production)
- **Research & Development (R&D)**: engineering salaries, prototyping, testing, software development costs (if expensed)
- **Depreciation & Amortization (D&A)**: allocated to OpEx if not already included in COGS

**Operating Income (EBIT)**
- Gross Profit minus Operating Expenses
- Measures profitability from core business operations before interest and taxes
- Operating Margin = Operating Income / Revenue x 100%

**Other Income/Expenses**
- Interest income and expense
- Gains and losses on asset sales
- Foreign exchange gains/losses
- Investment income
- Impairment charges (if material, may be shown separately)

**Net Income**
- Bottom line after all expenses, interest, and taxes
- Net Margin = Net Income / Revenue x 100%
- This is what flows to retained earnings on the balance sheet

---

## COGS Calculation Methods

### Inventory-Based Businesses

**Cost Flow Assumptions**
- **FIFO (First In, First Out)**: oldest inventory costs are assigned to COGS first; ending inventory at most recent costs; in periods of rising prices, FIFO produces lower COGS and higher net income
- **LIFO (Last In, First Out)**: most recent inventory costs assigned to COGS first; in periods of rising prices, LIFO produces higher COGS and lower net income (tax advantage); not permitted under IFRS
- **Weighted Average**: average cost per unit applied to both COGS and ending inventory; smooths out price fluctuations
- **Specific Identification**: actual cost of each specific item sold; used for unique, high-value items (jewelry, real estate, custom manufacturing)

**COGS Formula**
```
Beginning Inventory
+ Purchases (or Cost of Goods Manufactured)
+ Freight-In
- Purchase Returns and Allowances
- Purchase Discounts
= Cost of Goods Available for Sale
- Ending Inventory
= Cost of Goods Sold
```

### Service-Based Businesses

- Direct labor (billable hours x loaded cost rate)
- Subcontractor costs
- Direct project expenses (travel, materials specific to the engagement)
- Allocated overhead directly attributable to service delivery

---

## Key Profitability Metrics

### Margin Analysis

| Metric | Formula | What It Tells You |
|--------|---------|------------------|
| **Gross Margin** | Gross Profit / Revenue | Pricing power and production efficiency |
| **Operating Margin** | Operating Income / Revenue | Core business profitability after all operating costs |
| **Net Margin** | Net Income / Revenue | Overall profitability including financing and taxes |
| **EBITDA Margin** | EBITDA / Revenue | Cash-generating ability of operations |
| **Contribution Margin** | (Revenue - Variable Costs) / Revenue | Per-unit or per-segment profitability |

### Industry Benchmarks (Approximate)

| Industry | Gross Margin | Operating Margin | Net Margin |
|----------|-------------|-----------------|------------|
| SaaS | 70-85% | 15-30% | 10-25% |
| Professional Services | 30-50% | 10-20% | 8-15% |
| Manufacturing | 25-40% | 8-15% | 5-10% |
| Retail | 25-50% | 3-10% | 2-5% |
| Construction | 15-25% | 3-8% | 2-5% |
| Healthcare | 40-60% | 10-20% | 5-15% |
| Restaurants | 55-70% | 5-15% | 3-9% |

### EBITDA

**Earnings Before Interest, Taxes, Depreciation, and Amortization**

```
Net Income
+ Interest Expense
+ Income Tax Expense
+ Depreciation
+ Amortization
= EBITDA
```

- Proxy for operating cash flow (but not actual cash flow — does not account for working capital changes, CapEx, or debt service)
- Most commonly used valuation metric for private companies (EV/EBITDA multiples)
- **Adjusted EBITDA**: adds back one-time or non-recurring items (restructuring, litigation, M&A costs, stock-based compensation)
  - Be skeptical of excessive adjustments — "adjusted" can mask real ongoing costs
  - Common and legitimate adjustments: one-time legal settlements, severance from a restructuring, M&A transaction costs
  - Questionable adjustments: stock-based compensation (it is a real ongoing cost), recurring "one-time" items that happen every year

---

## Contribution Margin Analysis

### Concept

Contribution margin separates costs into variable and fixed components to analyze how each unit of revenue contributes to covering fixed costs and generating profit.

### Formulas

- **Per-unit contribution margin** = Selling Price per Unit - Variable Cost per Unit
- **Contribution margin ratio** = Contribution Margin / Revenue
- **Total contribution margin** = Total Revenue - Total Variable Costs

### Variable vs. Fixed Costs

**Variable Costs** (change with volume)
- Raw materials, direct labor (hourly), sales commissions (% of revenue), shipping/freight, payment processing fees, cloud hosting (usage-based), packaging

**Fixed Costs** (do not change with volume in the short term)
- Rent, salaried employees, insurance, depreciation, software subscriptions (fixed-rate), loan payments, executive compensation

**Semi-Variable / Mixed Costs**
- Utilities (base charge + usage), phone/internet, some labor (base salary + overtime), equipment maintenance (scheduled + usage-based)

### Application

- Pricing decisions: ensure selling price covers variable costs and contributes to fixed cost coverage
- Product mix optimization: prioritize products/services with highest contribution margin ratios
- Make-or-buy decisions: compare variable cost of internal production vs. outsourced cost
- Capacity utilization: contribution margin analysis reveals the incremental profit from additional volume

---

## Break-Even Analysis

### Basic Formula

**Break-Even Point (in units)** = Fixed Costs / Contribution Margin per Unit

**Break-Even Point (in revenue)** = Fixed Costs / Contribution Margin Ratio

### Example

- Selling price: $100/unit
- Variable cost: $60/unit
- Fixed costs: $200,000/year
- Contribution margin: $40/unit (40%)
- Break-even: $200,000 / $40 = 5,000 units (or $200,000 / 0.40 = $500,000 in revenue)

### Multi-Product Break-Even

- Calculate weighted-average contribution margin based on sales mix
- Break-even = Fixed Costs / Weighted-Average Contribution Margin
- Changes in sales mix affect the break-even point — a shift toward lower-margin products increases the break-even point

### Margin of Safety

- Revenue above the break-even point
- Margin of Safety = (Actual Revenue - Break-Even Revenue) / Actual Revenue x 100%
- Higher margin of safety = lower risk of losses if revenue declines

### Target Profit Analysis

- Units needed = (Fixed Costs + Target Profit) / Contribution Margin per Unit
- Accounts for income taxes: Units = (Fixed Costs + Target Profit / (1 - Tax Rate)) / Contribution Margin per Unit

---

## Variance Analysis (Budget vs. Actual)

### Types of Variances

**Revenue Variances**
- **Price variance**: (Actual Price - Budgeted Price) x Actual Quantity
  - Favorable: actual price > budget; Unfavorable: actual price < budget
- **Volume variance**: (Actual Quantity - Budgeted Quantity) x Budgeted Price
  - Favorable: actual volume > budget; Unfavorable: actual volume < budget
- **Mix variance**: impact of selling a different proportion of products than budgeted

**Cost Variances**
- **Spending/rate variance**: (Actual Rate - Standard Rate) x Actual Quantity
  - Favorable: actual cost < budget; Unfavorable: actual cost > budget
- **Efficiency/usage variance**: (Actual Quantity - Standard Quantity) x Standard Rate
  - Favorable: used less than expected; Unfavorable: used more than expected

### Variance Analysis Process

1. Compare actual results to budget (or prior year, or forecast) for each line item
2. Calculate dollar and percentage variance for each
3. Flag material variances (define threshold — e.g., >$5,000 AND >5% of budget)
4. Investigate root causes of material variances
5. Determine if the variance is one-time or recurring
6. Adjust forecasts and budgets accordingly
7. Present findings to management with recommended actions

### Best Practices

- Perform variance analysis monthly (minimum) for management reporting
- Use a rolling forecast that updates with each month of actuals
- Track variances cumulatively (year-to-date) not just monthly — monthly swings may offset over time
- Separate controllable variances (pricing decisions, spending) from uncontrollable variances (raw material market prices, exchange rates)

---

## Common-Size Analysis

### What It Is

Express each line item on the P&L as a percentage of revenue. This allows comparison across time periods and across companies of different sizes.

### How to Prepare

| Line Item | Amount | % of Revenue |
|-----------|--------|-------------|
| Revenue | $1,000,000 | 100.0% |
| COGS | $400,000 | 40.0% |
| Gross Profit | $600,000 | 60.0% |
| Selling Expenses | $150,000 | 15.0% |
| G&A | $200,000 | 20.0% |
| R&D | $100,000 | 10.0% |
| Operating Income | $150,000 | 15.0% |
| Interest Expense | $20,000 | 2.0% |
| Net Income | $104,000 | 10.4% |

### Application

- Compare to industry benchmarks to identify areas of over/under-spending
- Track trends over time — is gross margin improving or deteriorating?
- Compare across business units or product lines (if segment data is available)
- Identify cost categories that are growing faster than revenue — these are efficiency red flags

---

## Trend Analysis

### What It Is

Analyze P&L data over multiple periods (monthly, quarterly, annually) to identify patterns, trends, and anomalies.

### Key Trends to Monitor

- Revenue growth rate (month-over-month, year-over-year)
- Gross margin trend (expanding or contracting?)
- Operating expense growth vs. revenue growth (is the business scaling efficiently?)
- Net income trend (is profitability improving?)
- Seasonality patterns (which months/quarters are strongest?)

### Growth Rate Calculations

- **Year-over-Year (YoY)**: (Current Year - Prior Year) / Prior Year x 100%
- **Quarter-over-Quarter (QoQ)**: (Current Quarter - Prior Quarter) / Prior Quarter x 100%
- **Compound Annual Growth Rate (CAGR)**: (Ending Value / Beginning Value)^(1/Number of Years) - 1
  - Use CAGR for multi-year growth assessments — smooths out annual volatility

---

## SaaS-Specific Metrics

### Monthly Recurring Revenue (MRR)

- Total predictable revenue normalized to a monthly amount
- MRR = Sum of all monthly subscription values
- **New MRR**: revenue from new customers added in the period
- **Expansion MRR**: additional revenue from existing customers (upgrades, add-ons)
- **Churned MRR**: revenue lost from customers who cancelled
- **Contraction MRR**: revenue lost from downgrades
- **Net New MRR** = New MRR + Expansion MRR - Churned MRR - Contraction MRR

### Annual Recurring Revenue (ARR)

- ARR = MRR x 12
- Primary top-line metric for SaaS companies
- Used for valuation (ARR multiples: typically 5-20x for growth-stage SaaS)
- Only include recurring subscription revenue — exclude one-time setup fees, professional services, usage-based overages

### Churn Metrics

- **Customer churn rate** = Customers lost in period / Customers at start of period x 100%
- **Revenue churn rate (Gross)** = MRR lost in period / MRR at start of period x 100%
- **Net revenue churn** = (Churned MRR + Contraction MRR - Expansion MRR) / MRR at start of period x 100%
  - Negative net revenue churn means expansion exceeds losses — this is the goal
- Benchmarks: best-in-class SaaS = <5% annual gross revenue churn; <2% monthly customer churn

### Lifetime Value (LTV)

- LTV = ARPU / Monthly Churn Rate (simple formula)
- LTV = ARPU x Gross Margin% / Monthly Churn Rate (margin-adjusted, preferred)
- ARPU = Average Revenue Per User (per month)
- Represents the total gross profit expected from a customer over the relationship

### Customer Acquisition Cost (CAC)

- CAC = Total Sales & Marketing Expense / Number of New Customers Acquired (in the same period)
- Include: sales salaries and commissions, marketing spend, marketing salaries, sales tools, content creation costs
- Exclude: customer success costs (those are retention, not acquisition)

### LTV/CAC Ratio

- **Target**: LTV/CAC > 3x (for every $1 spent acquiring a customer, expect $3+ in gross profit)
- **Below 1x**: losing money on every customer acquired — unsustainable
- **1x-3x**: viable but not yet efficient; focus on reducing CAC or improving retention
- **Above 5x**: potentially underinvesting in growth (could acquire customers faster)

### CAC Payback Period

- Months to recover the acquisition cost
- CAC Payback = CAC / (ARPU x Gross Margin%)
- **Target**: <12 months for most SaaS; <18 months acceptable for enterprise
- Longer payback = more capital required to fund growth

### Rule of 40

- Revenue Growth Rate (%) + EBITDA Margin (%) ≥ 40%
- A combined measure of growth and profitability
- Companies exceeding the Rule of 40 are generally considered high-performing
- Example: 30% revenue growth + 15% EBITDA margin = 45% (exceeds Rule of 40)

---

## P&L Analysis Checklist

### Monthly Review

- [ ] Compare actual to budget for all major categories
- [ ] Calculate and review all margins (gross, operating, net, EBITDA)
- [ ] Investigate variances exceeding materiality threshold
- [ ] Review revenue recognition (any unusual items or timing differences?)
- [ ] Review expense categorization (anything misclassified?)
- [ ] Check for non-recurring items that should be flagged
- [ ] Update rolling forecast with actual data

### Quarterly Review

- [ ] All monthly items plus:
- [ ] Common-size analysis and comparison to prior quarters
- [ ] Trend analysis across multiple quarters
- [ ] SaaS metrics update (MRR, churn, LTV, CAC)
- [ ] Break-even analysis update
- [ ] Contribution margin by product/service/segment
- [ ] Board-level financial summary preparation

### Annual Review

- [ ] All quarterly items plus:
- [ ] Year-over-year comparison with detailed variance analysis
- [ ] Benchmarking against industry peers
- [ ] CAGR calculations for multi-year trends
- [ ] Annual budget preparation and presentation
- [ ] Tax planning coordination (see tina-tax-planning.md)
- [ ] Audit preparation support

---

## Notes for Tina

- The P&L is only one financial statement — always analyze in conjunction with the balance sheet and cash flow statement (a profitable company can still run out of cash)
- Revenue quality matters as much as revenue quantity — recurring revenue is more valuable than one-time revenue; contracted revenue is more reliable than at-risk revenue
- Watch for earnings management: aggressive revenue recognition, understated reserves, capitalization of expenses, timing manipulation
- EBITDA is useful but has limitations — it ignores working capital needs, CapEx, and debt service; free cash flow is a more complete measure of cash generation
- For SaaS companies, MRR/ARR and unit economics (LTV, CAC) are more important than GAAP net income in the growth phase
- Always present financial results with context: prior period comparison, budget comparison, and narrative explaining key drivers
