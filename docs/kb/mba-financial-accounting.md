# Financial Accounting & Analysis

## Purpose

This document equips Atlas UX agents — especially Tina (CFO) — with the ability to read, interpret, and analyze financial statements. Agents must understand how the three core statements connect, compute key ratios, identify red flags, and translate financial data into actionable business intelligence.

---

## 1. The Three Financial Statements

### Income Statement (Profit & Loss)

Measures profitability over a period (quarter, year). Structure:

```
Revenue (Net Sales)
- Cost of Goods Sold (COGS)
= Gross Profit
- Operating Expenses (SGA, R&D, D&A)
= Operating Income (EBIT)
- Interest Expense
+/- Other Income/Expenses
= Pre-Tax Income (EBT)
- Income Tax Expense
= Net Income
```

**Key insight**: Revenue is vanity, profit is sanity, cash is reality. A company can show net income while running out of cash.

### Balance Sheet

Snapshot of financial position at a point in time. The fundamental equation:

```
Assets = Liabilities + Shareholders' Equity
```

**Assets** (what the company owns):
- Current assets: Cash, accounts receivable, inventory, prepaid expenses (convertible to cash within 1 year)
- Non-current assets: Property/plant/equipment (PP&E), intangible assets, goodwill, long-term investments

**Liabilities** (what the company owes):
- Current liabilities: Accounts payable, short-term debt, accrued expenses, deferred revenue (due within 1 year)
- Non-current liabilities: Long-term debt, lease obligations, pension liabilities

**Shareholders' Equity** (residual claim):
- Common stock, additional paid-in capital, retained earnings, treasury stock, accumulated other comprehensive income

### Cash Flow Statement

Tracks actual cash movement over a period. Three sections:

**Operating Activities** (core business cash generation):
- Start with net income, add back non-cash charges (depreciation, amortization), adjust for working capital changes
- This is the most important section — it shows whether the business generates real cash

**Investing Activities** (long-term asset transactions):
- Capital expenditures (CapEx), acquisitions, asset sales, investment purchases/sales

**Financing Activities** (capital structure changes):
- Debt issuance/repayment, equity issuance/buybacks, dividend payments

```
Net Change in Cash = Operating CF + Investing CF + Financing CF
```

---

## 2. How the Statements Connect

The three statements are a closed system:

1. **Net Income** from the Income Statement flows into **Retained Earnings** on the Balance Sheet
2. **Net Income** is the starting point of the **Cash Flow Statement** (operating section)
3. **CapEx** on the Cash Flow Statement increases **PP&E** on the Balance Sheet
4. **Depreciation** on the Income Statement reduces **PP&E** on the Balance Sheet and is added back on the Cash Flow Statement
5. **Debt issuance** on the Cash Flow Statement increases **Liabilities** on the Balance Sheet
6. **Ending Cash** on the Cash Flow Statement equals **Cash** on the Balance Sheet

### Agent Application

When Tina analyzes financial data, she must cross-reference all three statements. A company reporting strong net income but negative operating cash flow is a red flag. Revenue growth without corresponding receivables collection signals potential issues.

---

## 3. Profitability Ratios

| Ratio | Formula | What It Measures | Healthy Range (varies by industry) |
|-------|---------|------------------|-----------------------------------|
| **Gross Margin** | Gross Profit / Revenue | Pricing power and production efficiency | 40-80% (SaaS), 20-40% (manufacturing) |
| **Operating Margin** | Operating Income / Revenue | Core business profitability | 15-30% (SaaS), 5-15% (retail) |
| **Net Margin** | Net Income / Revenue | Bottom-line profitability after all costs | 10-25% (healthy), varies widely |
| **Return on Equity (ROE)** | Net Income / Avg Shareholders' Equity | How efficiently equity capital generates profit | 15-25% (good), >25% (excellent) |
| **Return on Assets (ROA)** | Net Income / Avg Total Assets | How efficiently total assets generate profit | 5-15% (good), varies by asset intensity |
| **Return on Invested Capital (ROIC)** | NOPAT / Invested Capital | True return on all invested capital | Must exceed WACC to create value |

### DuPont Analysis

Decomposes ROE into three drivers to identify where returns come from:

```
ROE = Net Margin × Asset Turnover × Equity Multiplier
    = (Net Income/Revenue) × (Revenue/Assets) × (Assets/Equity)
```

- **High margin** path: Premium products, strong pricing (luxury, SaaS)
- **High turnover** path: Volume and efficiency (retail, grocery)
- **High leverage** path: Debt amplification (financial services) — increases risk

### Extended (5-Factor) DuPont

```
ROE = Tax Burden × Interest Burden × Operating Margin × Asset Turnover × Equity Multiplier
    = (NI/EBT) × (EBT/EBIT) × (EBIT/Revenue) × (Revenue/Assets) × (Assets/Equity)
```

This separates the effects of tax efficiency, interest expense, operating performance, asset utilization, and leverage.

---

## 4. Liquidity Ratios

| Ratio | Formula | Interpretation |
|-------|---------|----------------|
| **Current Ratio** | Current Assets / Current Liabilities | >1.5 comfortable, <1.0 danger zone |
| **Quick Ratio** | (Current Assets - Inventory) / Current Liabilities | More conservative; >1.0 preferred |
| **Cash Ratio** | Cash & Equivalents / Current Liabilities | Most conservative; ability to pay with cash on hand |
| **Operating Cash Flow Ratio** | Operating CF / Current Liabilities | Can operations cover short-term obligations? |

### Agent Application

Tina must monitor liquidity ratios weekly. If the current ratio drops below 1.2, trigger a cash management review. If the quick ratio drops below 0.8, escalate to Atlas with recommendations.

---

## 5. Leverage Ratios

| Ratio | Formula | Interpretation |
|-------|---------|----------------|
| **Debt-to-Equity** | Total Debt / Shareholders' Equity | <1.0 conservative, >2.0 aggressive |
| **Debt-to-Assets** | Total Debt / Total Assets | % of assets financed by debt |
| **Interest Coverage** | EBIT / Interest Expense | >3x comfortable, <1.5x distress risk |
| **Debt-to-EBITDA** | Total Debt / EBITDA | <3x healthy, >5x highly leveraged |

**Key insight**: Leverage amplifies both gains and losses. In good times, debt boosts ROE. In downturns, debt creates existential risk. The interest coverage ratio is the most critical early warning signal.

---

## 6. Efficiency Ratios

| Ratio | Formula | Interpretation |
|-------|---------|----------------|
| **Inventory Turnover** | COGS / Average Inventory | How fast inventory sells; higher = better |
| **Days Sales in Inventory (DSI)** | 365 / Inventory Turnover | Days to sell average inventory |
| **Receivables Turnover** | Revenue / Average Accounts Receivable | How fast customers pay |
| **Days Sales Outstanding (DSO)** | 365 / Receivables Turnover | Average collection period in days |
| **Payables Turnover** | COGS / Average Accounts Payable | How fast company pays suppliers |
| **Days Payable Outstanding (DPO)** | 365 / Payables Turnover | Days to pay suppliers |
| **Asset Turnover** | Revenue / Average Total Assets | Revenue generated per dollar of assets |

### Cash Conversion Cycle (CCC)

```
CCC = DSO + DSI - DPO
```

Measures the number of days between paying for inventory and collecting cash from sales. Lower is better. Negative CCC (like Amazon) means the company gets paid before it pays suppliers.

---

## 7. Common-Size Analysis

Convert financial statements to percentages for comparison across time periods and companies of different sizes.

- **Common-size Income Statement**: Every line as a percentage of Revenue
- **Common-size Balance Sheet**: Every line as a percentage of Total Assets

### Trend Analysis

Compare common-size statements across 3-5 periods. Flag: COGS rising as % of revenue (margin erosion), SGA rising faster than revenue (scaling inefficiency), receivables growing faster than revenue (collection problems).

---

## 8. Red Flags in Financial Statements

Agents must watch for these warning signs:

**Revenue Quality Issues**:
- Revenue growing while cash from operations declines
- Accounts receivable growing faster than revenue
- Unusual revenue spikes at quarter-end (channel stuffing)
- Frequent changes in revenue recognition policies

**Expense Manipulation**:
- Capitalizing costs that should be expensed (inflating assets, deflating expenses)
- Unusually low depreciation relative to asset base
- Declining R&D or maintenance CapEx (mortgaging the future)

**Balance Sheet Concerns**:
- Goodwill > 50% of total assets (acquisition-driven growth, impairment risk)
- Off-balance-sheet liabilities (operating leases pre-ASC 842, SPEs)
- Related-party transactions
- Frequent changes in accounting methods or estimates

**Cash Flow Warnings**:
- Persistent gap between net income and operating cash flow
- Operating CF dependent on working capital timing rather than profitability
- Heavy reliance on financing activities to fund operations

---

## 9. Financial Statement Analysis Workflow for Agents

When Tina or any agent receives financial data, follow this sequence:

1. **Read the Cash Flow Statement first** — it is the hardest to manipulate
2. **Compute the core ratios** — profitability, liquidity, leverage, efficiency
3. **Run DuPont analysis** — understand the drivers of returns
4. **Perform common-size analysis** — compare across periods and peers
5. **Check for red flags** — cross-reference statements for inconsistencies
6. **Calculate the Cash Conversion Cycle** — understand working capital efficiency
7. **Synthesize findings** — what is the story the numbers tell?
8. **Generate recommendations** — specific, actionable, with risk assessment

### Ratio Quick Reference: Warning Thresholds

| Metric | Yellow Flag | Red Flag |
|--------|-------------|----------|
| Operating Cash Flow | Declining 2 consecutive quarters | Negative while net income positive |
| Current Ratio | < 1.2 | < 0.8 |
| Interest Coverage | < 3.0x | < 1.5x |
| DSO | Increasing > 15% YoY | > 2x industry average |
| Gross Margin | Declining > 2pp YoY | Below industry median |
| Debt-to-EBITDA | > 4.0x | > 6.0x |

---

## 10. Industry-Specific Metrics

Not all businesses measure the same way:

- **SaaS**: ARR, MRR, NDR, logo churn, gross margin (>70% expected), Rule of 40 (growth rate + profit margin > 40%)
- **E-commerce**: GMV, take rate, AOV, repeat purchase rate, return rate
- **Marketplace**: GMV, take rate, liquidity, buyer-to-seller ratio
- **Manufacturing**: Capacity utilization, yield, scrap rate, throughput
- **Subscription**: ARPU, churn rate, expansion revenue, cohort retention

---

## References

- Palepu, K. & Healy, P. *Business Analysis and Valuation*
- Fridson, M. & Alvarez, F. *Financial Statement Analysis: A Practitioner's Guide*
- Penman, S. *Financial Statement Analysis and Security Valuation*
- Buffett, W. "Owner's Manual" — Berkshire Hathaway
