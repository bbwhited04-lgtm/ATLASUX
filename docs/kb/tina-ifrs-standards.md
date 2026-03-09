# Tina KB: IFRS Standards Reference

## Purpose

This document provides Tina with practical knowledge of the most impactful International Financial Reporting Standards (IFRS) issued by the International Accounting Standards Board (IASB). Each standard includes its core principle, key requirements, and critical differences from US GAAP to support cross-border financial guidance.

---

## IFRS 15 — Revenue from Contracts with Customers

### Core Principle

Recognize revenue to depict the transfer of promised goods or services to customers in an amount that reflects the consideration to which the entity expects to be entitled. IFRS 15 and ASC 606 were developed jointly and are substantially converged.

### Key Requirements

- Same five-step model as ASC 606: identify contract, identify performance obligations, determine transaction price, allocate, and recognize
- Variable consideration: include only to the extent that it is **highly probable** that a significant reversal will not occur
- Over-time recognition uses the same three criteria as ASC 606
- Principal vs. agent analysis follows similar control-based framework

### Key Differences from US GAAP (ASC 606)

| Area | IFRS 15 | ASC 606 |
|------|---------|---------|
| **Variable consideration constraint** | "Highly probable" no significant reversal | "Probable" no significant reversal (lower threshold) |
| **Interim disclosure** | IAS 34 requires selected disclosures | ASC 270 has fewer interim requirements |
| **Licensing** | Largely converged but some differences in application guidance for renewals | More detailed application guidance |
| **Non-cash consideration** | Measured at fair value at contract inception | Measured at fair value at contract inception (converged) |
| **Contract costs** | Largely converged | Practical expedient for amortization period ≤1 year (converged) |
| **Presentation** | "Contract asset" and "contract liability" terminology required | Can use other descriptions if disclosed |

### Practical Considerations

- The difference in the variable consideration constraint threshold ("highly probable" vs. "probable") can result in different revenue amounts under IFRS vs. GAAP, particularly for performance bonuses, penalties, and returns
- Companies reporting under both frameworks should maintain dual calculations where the constraint differs
- Transition approaches were the same: full retrospective or modified retrospective with cumulative catch-up

---

## IFRS 16 — Leases

### Core Principle

A lessee recognizes a right-of-use asset and a lease liability for all leases (with limited exceptions), applying a single on-balance-sheet model. This differs significantly from US GAAP's dual model.

### Key Requirements

**Lessee Accounting**
- **Single model**: all leases are treated similarly to finance leases under GAAP — the lessee recognizes depreciation of the ROU asset and interest on the lease liability
- Income statement impact: front-loaded expense pattern (higher total expense in early years)
- No distinction between operating and finance leases for lessees (unlike ASC 842)

**Exceptions**
- Short-term leases (≤12 months with no purchase option): election to expense straight-line
- Low-value leases (underlying asset value of approximately $5,000 or less when new): election to expense — applied on a lease-by-lease basis (no portfolio approach required)

**Lessor Accounting**
- Substantially unchanged from IAS 17
- Classify as operating or finance lease using risks-and-rewards approach (similar to but not identical to ASC 842)

### Key Differences from US GAAP (ASC 842)

| Area | IFRS 16 | ASC 842 |
|------|---------|---------|
| **Lessee model** | Single model (all leases treated like finance) | Dual model (operating vs. finance) |
| **Operating lease expense** | Depreciation + interest (front-loaded) | Single straight-line lease cost |
| **Low-value exemption** | Yes (~$5,000 threshold) | No equivalent |
| **EBITDA impact** | All leases increase EBITDA (depreciation + interest below EBITDA line) | Only finance leases increase EBITDA; operating leases have single expense in operating costs |
| **Discount rate** | Incremental borrowing rate (if implicit rate not determinable) | Same, but public entities cannot use risk-free rate |
| **Sale-leaseback** | Follows IFRS 15 transfer criteria | Follows ASC 606 transfer criteria |
| **Lease modifications** | Remeasure using revised discount rate | Remeasure; may use original rate for certain modifications |

### Practical Considerations

- The single-model approach under IFRS 16 generally results in higher EBITDA compared to GAAP for companies with significant operating leases — this affects covenant calculations and valuation metrics
- Companies transitioning between GAAP and IFRS need to carefully restate lease expense patterns
- The low-value exemption under IFRS 16 (approximately $5,000) reduces compliance burden for items like laptops, office furniture, and small equipment

---

## IFRS 9 — Financial Instruments

### Core Principle

Classification and measurement of financial assets is based on the entity's business model for managing the assets and the contractual cash flow characteristics. Impairment follows an expected credit loss (ECL) model.

### Key Requirements

**Classification of Financial Assets**
- **Amortized cost**: business model is to hold to collect contractual cash flows; cash flows are solely payments of principal and interest (SPPI test)
- **Fair value through other comprehensive income (FVOCI)**: business model is both to collect cash flows and to sell; SPPI test met
- **Fair value through profit or loss (FVTPL)**: all other financial assets, or elected at initial recognition to eliminate measurement mismatch

**Impairment (Expected Credit Loss Model)**
- Three-stage model:
  - **Stage 1**: 12-month ECL for assets not significantly deteriorated since initial recognition
  - **Stage 2**: Lifetime ECL when credit risk has increased significantly since initial recognition
  - **Stage 3**: Lifetime ECL for credit-impaired assets (interest revenue calculated on net carrying amount)
- Forward-looking: must incorporate macroeconomic forecasts and scenarios
- Applies to: debt instruments at amortized cost or FVOCI, loan commitments, financial guarantee contracts, lease receivables, contract assets

**Hedge Accounting**
- More principles-based than IAS 39
- Hedge effectiveness: no longer requires 80-125% quantitative threshold; must be expected to achieve offsetting on a prospective basis
- Allows hedging of risk components in non-financial items
- Broader range of hedging instruments permitted
- Cost of hedging approach: time value of options and forward points can be deferred in OCI

### Key Differences from US GAAP (ASC 326 — CECL / ASC 815 — Derivatives and Hedging)

| Area | IFRS 9 | US GAAP |
|------|--------|---------|
| **Financial asset classification** | 3 categories based on business model + SPPI | Multiple categories (trading, AFS, HTM, etc.) |
| **Impairment model** | 3-stage ECL (12-month then lifetime) | CECL — lifetime expected losses from Day 1 |
| **Impairment timing** | Staged approach reduces Day 1 impact | Front-loads all expected losses at inception |
| **Hedge effectiveness** | Qualitative, principles-based | More rules-based; quantitative testing still common |
| **Equity investments** | FVTPL (default) or FVOCI with no recycling | FVTPL for equity securities with readily determinable FV |
| **Debt modifications** | 10% test for derecognition | Similar 10% test but different scope |

### Practical Considerations

- The ECL model under IFRS 9 (staged approach) generally results in lower Day 1 provisioning compared to CECL under US GAAP, but ongoing monitoring of stage transfers is more complex
- SPPI test failures (e.g., instruments with leverage features, non-standard interest rate benchmarks) force FVTPL classification, which can create P&L volatility
- Hedge accounting under IFRS 9 is generally considered more flexible and easier to apply than US GAAP

---

## IFRS 3 — Business Combinations

### Core Principle

Apply the acquisition method: identify the acquirer, determine the acquisition date, recognize and measure identifiable assets acquired and liabilities assumed at fair value, and recognize goodwill.

### Key Requirements

- **Goodwill**: excess of consideration transferred over the net identifiable assets acquired at fair value
- **Bargain purchase**: if net assets exceed consideration, recognize gain in profit or loss (after reassessing all amounts)
- **Non-controlling interests (NCI)**: measure at either fair value (full goodwill method) or proportionate share of identifiable net assets (partial goodwill method) — election made on a transaction-by-transaction basis
- **Contingent consideration**: classified as equity or liability at acquisition date; if liability, remeasured at fair value each period with changes in profit or loss
- **Measurement period**: up to 12 months from acquisition date to finalize fair values; adjustments are retrospective to acquisition date

### Key Differences from US GAAP (ASC 805)

| Area | IFRS 3 | ASC 805 |
|------|--------|---------|
| **NCI measurement** | Choice: FV or proportionate share | Fair value only (full goodwill) |
| **Goodwill amount** | May differ due to NCI choice | Always includes goodwill on NCI |
| **Contingent consideration** | Remeasured at FV; changes in P&L | Same for liabilities; equity-classified not remeasured |
| **Step acquisitions** | Remeasure previously held interest to FV; gain/loss in P&L | Same |
| **Acquisition-related costs** | Expensed (same as GAAP) | Expensed (converged) |
| **Bargain purchases** | Recognize gain after reassessment | Same (converged) |

### Practical Considerations

- The NCI measurement election under IFRS 3 can significantly affect the amount of goodwill recognized — partial goodwill results in lower goodwill and lower potential impairment
- When advising on cross-border M&A, be aware that goodwill amounts may differ between IFRS and GAAP reporting simply due to the NCI measurement choice
- Contingent consideration classification and remeasurement can create significant P&L volatility

---

## IAS 36 — Impairment of Assets

### Core Principle

An asset is impaired when its carrying amount exceeds its recoverable amount. The recoverable amount is the higher of fair value less costs of disposal and value in use.

### Key Requirements

- **Triggering events**: test for impairment whenever there are indicators (external: market decline, adverse economic changes; internal: obsolescence, physical damage, worse-than-expected performance)
- **Annual testing**: required for goodwill, indefinite-lived intangibles, and intangibles not yet available for use — regardless of indicators
- **Cash-generating units (CGUs)**: the smallest identifiable group of assets that generates cash inflows largely independent of other assets; goodwill is allocated to CGUs for testing
- **Value in use**: PV of future cash flows expected from the asset, using a pre-tax discount rate
- **Impairment loss allocation**: for a CGU, allocate first to goodwill, then to other assets pro rata (not below individual asset's FV less costs of disposal, value in use, or zero)
- **Reversal of impairment**: permitted for assets other than goodwill if circumstances change; reverse up to the carrying amount that would have existed without impairment (net of depreciation)

### Key Differences from US GAAP (ASC 350 / ASC 360)

| Area | IAS 36 | US GAAP |
|------|--------|---------|
| **Impairment test** | One-step: compare carrying amount to recoverable amount | Goodwill: one-step (FV vs. carrying amount); Long-lived assets: two-step (recoverability then FV) |
| **Recoverable amount** | Higher of FV less costs of disposal and value in use | Fair value (for goodwill); undiscounted cash flows test, then FV (for long-lived assets) |
| **Reversal** | Allowed (except for goodwill) | Not allowed |
| **CGU vs. reporting unit** | CGU: smallest group generating independent cash flows | Reporting unit: operating segment or one level below |
| **Goodwill impairment** | Allocated to CGU; may result in partial impairment of other assets | Limited to goodwill amount in reporting unit |

### Practical Considerations

- The reversal of impairment under IAS 36 (not available under GAAP) means that IFRS balance sheets can show higher asset values after recovery
- Value in use calculations require careful estimation of future cash flows and selection of appropriate discount rates — these are significant judgment areas and audit focus points
- CGU identification can differ from GAAP reporting units, leading to different impairment results for the same economic events

---

## IAS 12 — Income Taxes

### Core Principle

Account for current and deferred tax consequences of transactions and events recognized in the financial statements, using the balance sheet approach (temporary differences between carrying amounts and tax bases).

### Key Requirements

- **Deferred tax assets**: recognized for deductible temporary differences, unused tax losses, and unused tax credits to the extent it is **probable** that taxable profit will be available
- **Deferred tax liabilities**: recognized for all taxable temporary differences (with limited exceptions)
- **Measurement**: enacted or substantively enacted tax rates expected to apply when the temporary difference reverses
- **No discounting**: deferred tax assets and liabilities are not discounted
- **Uncertain tax treatments**: IFRIC 23 provides guidance — determine whether to treat each position separately or as a group; if probable of acceptance by tax authority, measure at the amount expected to be accepted; if not probable, use expected value or most likely amount

### Key Differences from US GAAP (ASC 740)

| Area | IAS 12 | ASC 740 |
|------|--------|---------|
| **Recognition threshold for DTA** | "Probable" (>50%) that taxable profit will be available | "More likely than not" — but uses valuation allowance approach (recognize DTA in full, then apply VA) |
| **Tax rate** | Enacted or **substantively enacted** | Must be **enacted** |
| **Outside basis differences** | Recognize DTL for all taxable temporary differences (exceptions for subsidiaries if control over timing and not expected to reverse in foreseeable future) | More exceptions (indefinite reversal criterion for foreign subsidiaries) |
| **Uncertain tax positions** | IFRIC 23: expected value or most likely amount | ASC 740-10: two-step (recognition then measurement at largest amount >50% likely) |
| **Presentation** | All deferred taxes are noncurrent | All deferred taxes are noncurrent (converged since ASU 2015-17) |
| **Intraperiod allocation** | Less prescriptive | Detailed allocation rules |

### Practical Considerations

- The "substantively enacted" concept under IAS 12 means tax rate changes can be reflected earlier than under GAAP (where the rate must be formally enacted)
- The valuation allowance approach (GAAP) vs. direct recognition limitation (IFRS) can lead to different gross DTA amounts on the balance sheet
- IFRIC 23 and ASC 740's uncertain tax position approaches can produce different measured amounts for the same tax position

---

## IAS 7 — Statement of Cash Flows

### Core Principle

Provide information about the historical changes in cash and cash equivalents, classified by operating, investing, and financing activities.

### Key Requirements

- Operating activities: direct method is encouraged (but not required); indirect method is permitted
- Cash equivalents: short-term (typically 3 months or less from acquisition), highly liquid investments readily convertible to known cash amounts
- Bank overdrafts that form an integral part of cash management may be included in cash and cash equivalents (GAAP does not permit this)

### Key Differences from US GAAP (ASC 230)

| Area | IAS 7 | ASC 230 |
|------|-------|---------|
| **Interest paid** | Operating or financing (policy choice) | Operating only |
| **Interest received** | Operating or investing (policy choice) | Operating only (generally) |
| **Dividends paid** | Operating or financing (policy choice) | Financing only |
| **Dividends received** | Operating or investing (policy choice) | Operating only (generally) |
| **Income taxes** | Operating (unless specifically identified with financing/investing) | Operating only |
| **Bank overdrafts** | May be included in cash equivalents | Financing activity |
| **Direct method** | Encouraged | Encouraged (but indirect required if direct not used — both are acceptable) |

### Practical Considerations

- The classification choices under IAS 7 (interest, dividends) can materially affect operating cash flow — critical for analyst comparisons and covenant calculations
- Companies should disclose their policy choices for interest and dividend classification
- The bank overdraft difference can significantly affect reported cash positions for companies using overdraft facilities

---

## IAS 1 — Presentation of Financial Statements

### Core Principle

Provide a framework for the general presentation of financial statements to ensure comparability with prior periods and with other entities.

### Key Requirements

- **Complete set**: statement of financial position, statement of profit or loss and OCI, statement of changes in equity, statement of cash flows, notes (including accounting policies and explanatory information)
- **Current/non-current distinction**: required on the balance sheet (unless liquidity-based presentation provides more reliable and relevant information)
- **OCI presentation**: may present single statement (profit or loss and OCI combined) or two separate statements
- **No extraordinary items**: IAS 1 does not permit separate classification of extraordinary items (GAAP also eliminated this under ASU 2015-01)
- **Offsetting**: assets and liabilities, income and expenses, should not be offset unless required or permitted by another standard
- **Comparative information**: at minimum, two periods for all amounts; three statements of financial position required if retrospective restatement or reclassification

### Key Differences from US GAAP

| Area | IAS 1 | US GAAP |
|------|-------|---------|
| **Financial statement titles** | "Statement of financial position" (balance sheet) | "Balance sheet" is traditional but not required |
| **Income statement format** | By nature or by function (choice) | By function is typical |
| **OCI reclassification** | "Recycling" from OCI to P&L varies by standard | Reclassification adjustments required for most items |
| **Minimum line items** | Specified in IAS 1 | Less prescriptive (SEC rules add requirements for public entities) |
| **Going concern** | Management must assess; disclose material uncertainties | Similar under ASU 2014-15; substantial doubt threshold |

### Practical Considerations

- The choice between presenting expenses by nature vs. function affects financial statement analysis and comparability
- IFRS generally provides less prescriptive formatting guidance, allowing more flexibility but potentially reducing comparability
- Going concern assessment and disclosure requirements are similar but the specific thresholds and language differ

---

## GAAP vs. IFRS Summary Matrix

| Topic | Standard | Key Difference |
|-------|----------|---------------|
| Revenue | IFRS 15 / ASC 606 | Variable consideration threshold |
| Leases | IFRS 16 / ASC 842 | Single vs. dual lessee model |
| Financial Instruments | IFRS 9 / ASC 326 | Staged ECL vs. Day 1 CECL |
| Business Combinations | IFRS 3 / ASC 805 | NCI measurement election |
| Impairment | IAS 36 / ASC 350,360 | Reversal permitted under IFRS |
| Income Taxes | IAS 12 / ASC 740 | Substantively enacted rates; VA approach |
| Cash Flows | IAS 7 / ASC 230 | Classification flexibility (interest, dividends) |
| Presentation | IAS 1 / ASC various | Expense by nature vs. function |

---

## Notes for Tina

- Over 140 jurisdictions require or permit IFRS; the US remains on GAAP — dual reporting is common for multinationals
- Convergence efforts have aligned many standards (revenue, leases) but significant differences remain
- When advising clients with international operations, always check which framework applies to each subsidiary and consolidation level
- IFRS is generally considered more principles-based; GAAP is more rules-based — this affects how judgment is applied and documented
- Monitor IASB projects (particularly general presentation and disclosure, goodwill and impairment, and financial instruments with characteristics of equity) for upcoming changes
