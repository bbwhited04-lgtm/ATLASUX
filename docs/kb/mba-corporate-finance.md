# Corporate Finance

## Purpose

This document equips Atlas UX agents — especially Tina (CFO) and Atlas (CEO) — with the tools to evaluate investments, price capital, structure financing, and make value-maximizing financial decisions. Every spending decision above the AUTO_SPEND_LIMIT must be supported by these frameworks.

---

## 1. Time Value of Money (TVM)

The foundational principle: a dollar today is worth more than a dollar tomorrow because of earning potential.

### Core Formulas

**Future Value**:
```
FV = PV × (1 + r)^n
```

**Present Value**:
```
PV = FV / (1 + r)^n
```

**Present Value of Annuity** (equal payments):
```
PV = PMT × [(1 - (1 + r)^-n) / r]
```

**Present Value of Perpetuity** (infinite equal payments):
```
PV = PMT / r
```

**Growing Perpetuity** (payments growing at rate g):
```
PV = PMT / (r - g)    where r > g
```

### Agent Application

All multi-period financial comparisons must use present value. Never compare raw dollar amounts across different time periods without discounting.

---

## 2. Investment Decision Tools

### Net Present Value (NPV)

The gold standard for investment evaluation.

```
NPV = -Initial Investment + Σ [CFt / (1 + r)^t]  for t = 1 to n
```

**Decision rule**: Accept if NPV > 0. Among mutually exclusive projects, choose the highest NPV.

**Why NPV is superior**: It accounts for TVM, measures absolute value creation in dollars, and is additive (NPV of A + NPV of B = NPV of combined).

### Internal Rate of Return (IRR)

The discount rate that makes NPV = 0.

```
0 = -Initial Investment + Σ [CFt / (1 + IRR)^t]
```

**Decision rule**: Accept if IRR > required rate of return (WACC).

**IRR limitations**: Assumes reinvestment at IRR (often unrealistic), can produce multiple IRRs with non-conventional cash flows, can rank mutually exclusive projects incorrectly. Always cross-check with NPV.

### Payback Period

Time required to recover the initial investment from cash flows.

```
Payback = Years until cumulative CF ≥ Initial Investment
```

**Discounted Payback**: Same concept but uses discounted cash flows. More rigorous but still ignores cash flows after payback.

**Use case**: Quick screening tool, useful for liquidity-constrained businesses. Not sufficient as sole decision criterion.

### Profitability Index (PI)

```
PI = PV of Future Cash Flows / Initial Investment
```

**Decision rule**: Accept if PI > 1. Useful for capital rationing — rank projects by PI when budget is constrained.

---

## 3. Cost of Capital

### Weighted Average Cost of Capital (WACC)

The blended cost of all financing sources, weighted by their proportion in the capital structure.

```
WACC = (E/V) × Re + (D/V) × Rd × (1 - T)
```

Where:
- E = Market value of equity
- D = Market value of debt
- V = E + D (total firm value)
- Re = Cost of equity
- Rd = Cost of debt (pre-tax)
- T = Marginal tax rate

### Cost of Equity — Capital Asset Pricing Model (CAPM)

```
Re = Rf + β × (Rm - Rf)
```

Where:
- Rf = Risk-free rate (10-year Treasury yield)
- β = Beta (systematic risk relative to market)
- Rm - Rf = Equity risk premium (historical average 5-7%)

**Beta interpretation**: β = 1 (moves with market), β > 1 (more volatile), β < 1 (less volatile), β < 0 (inverse relationship, very rare).

### Cost of Debt

```
Rd = Interest Expense / Average Total Debt
```

Or use the yield-to-maturity on outstanding bonds. After-tax cost of debt = Rd × (1 - T) because interest is tax-deductible.

### Build-Up Method (for private companies)

When CAPM data is unavailable:
```
Re = Rf + Equity Risk Premium + Size Premium + Company-Specific Premium
```

Size premium: 1-5% for small companies. Company-specific premium: 1-10% based on risk factors.

---

## 4. Capital Structure

### Modigliani-Miller Propositions

**Proposition I (no taxes)**: In a perfect market, firm value is independent of capital structure. The pie size doesn't change when you cut it differently.

**Proposition I (with taxes)**: Firm value increases with debt due to the tax shield on interest.
```
VL = VU + (T × D)
```

**Proposition II**: Cost of equity increases linearly with leverage, but WACC decreases (up to a point) due to the tax shield.

### Trade-Off Theory

Optimal capital structure balances the tax benefits of debt against the costs of financial distress.

**Benefits of debt**: Tax shield, discipline on management, lower agency costs.
**Costs of debt**: Bankruptcy risk, loss of flexibility, covenant restrictions, agency costs of debt.

The optimal leverage ratio is where the marginal tax benefit equals the marginal distress cost.

### Pecking Order Theory

Myers & Majluf: Companies prefer financing in this order:
1. Internal funds (retained earnings) — no transaction costs, no information asymmetry
2. Debt — lower adverse selection cost than equity
3. Equity — last resort (signals overvaluation to the market)

### Agent Application

When evaluating financing options, Tina should first assess internal cash availability, then consider debt capacity (interest coverage > 3x), and recommend equity only when internal funds and debt are insufficient or too costly.

---

## 5. Discounted Cash Flow (DCF) Valuation

Step-by-step process to value a business or project:

### Step 1: Project Free Cash Flow (FCF)

```
FCF = EBIT × (1 - Tax Rate) + Depreciation & Amortization - CapEx - Change in Working Capital
```

Project FCF for 5-10 years based on revenue growth, margin assumptions, and capital intensity.

### Step 2: Estimate Terminal Value

**Gordon Growth Model**:
```
TV = FCFn × (1 + g) / (WACC - g)
```
Where g = long-term sustainable growth rate (typically 2-3%, should not exceed GDP growth).

**Exit Multiple Method**:
```
TV = EBITDAn × Exit Multiple
```
Use industry comparable multiples. Cross-check with perpetuity growth method.

### Step 3: Discount to Present

```
Enterprise Value = Σ [FCFt / (1 + WACC)^t] + TV / (1 + WACC)^n
```

### Step 4: Bridge to Equity Value

```
Equity Value = Enterprise Value - Net Debt + Cash - Minority Interest + Associates
Equity Value per Share = Equity Value / Diluted Shares Outstanding
```

### Step 5: Sensitivity Analysis

Always test key assumptions. Build a sensitivity table varying WACC (rows) and terminal growth rate (columns). Show the range of implied values.

---

## 6. Comparable Company Analysis (Comps)

Relative valuation using market multiples of similar companies.

### Common Multiples

| Multiple | Formula | When to Use |
|----------|---------|-------------|
| **EV/Revenue** | Enterprise Value / Revenue | Early-stage, unprofitable companies |
| **EV/EBITDA** | Enterprise Value / EBITDA | Most common; removes capital structure and tax effects |
| **P/E** | Price / Earnings Per Share | Profitable companies with stable earnings |
| **P/S** | Price / Sales | High-growth companies |
| **EV/FCF** | Enterprise Value / Free Cash Flow | Mature, cash-generative businesses |

### Process

1. Select 5-10 comparable companies (same industry, similar size, growth, margins)
2. Calculate multiples for each
3. Determine median and mean
4. Apply median multiple to the target's financials
5. Adjust for growth differential, margin differential, risk profile

---

## 7. Working Capital Management

### Components

```
Net Working Capital = Current Assets - Current Liabilities
Operating Working Capital = Accounts Receivable + Inventory - Accounts Payable
```

### Cash Conversion Cycle

```
CCC = DSO + DSI - DPO
```

**Optimization strategies**:
- Reduce DSO: Faster invoicing, early payment discounts, credit policy tightening
- Reduce DSI: Better demand forecasting, JIT inventory, SKU rationalization
- Increase DPO: Negotiate longer payment terms (without damaging supplier relationships)

### Agent Application

Tina should monitor the CCC monthly. A lengthening CCC consumes cash; a shortening CCC frees cash. Target: CCC reduction of 5-10% annually through operational improvements.

---

## 8. Capital Budgeting Decision Framework

When evaluating any investment or spending decision:

1. **Estimate incremental cash flows** — only cash flows that change as a result of the decision (ignore sunk costs)
2. **Include opportunity costs** — what could this capital earn in its next best use?
3. **Calculate NPV at WACC** — the primary decision metric
4. **Compute IRR** — cross-check, ensure single IRR exists
5. **Run sensitivity analysis** — vary revenue growth, margins, discount rate
6. **Assess strategic value** — are there options, learning, or platform benefits not captured in cash flows?
7. **Consider risk** — adjust discount rate for project-specific risk, or use scenario analysis

### Decision Thresholds for Agents

| NPV | IRR vs WACC | Recommendation |
|-----|-------------|----------------|
| Positive, large | IRR >> WACC | Strong accept — proceed with urgency |
| Positive, small | IRR > WACC | Accept — monitor assumptions closely |
| Near zero | IRR ≈ WACC | Marginal — decide on strategic factors |
| Negative | IRR < WACC | Reject — unless compelling strategic rationale documented |

---

## 9. Dividend and Capital Return Policy

**Residual dividend policy**: Pay dividends only from earnings remaining after all positive-NPV projects are funded. Growth companies should retain and reinvest.

**Signal theory**: Dividend increases signal management confidence; cuts signal trouble.

**Share buybacks vs dividends**: Buybacks offer more flexibility, tax efficiency, and signal undervaluation. Dividends provide commitment and income certainty.

### Agent Application

For early-stage and growth companies, agents should recommend retaining all earnings for reinvestment. Capital return should only be considered when ROIC consistently exceeds WACC and growth opportunities are insufficient to deploy available capital.

---

## References

- Brealey, R., Myers, S. & Allen, F. *Principles of Corporate Finance*
- Damodaran, A. *Investment Valuation*
- Koller, T., Goedhart, M. & Wessels, D. *Valuation: Measuring and Managing the Value of Companies* (McKinsey)
- Modigliani, F. & Miller, M. (1958). "The Cost of Capital, Corporation Finance and the Theory of Investment"
