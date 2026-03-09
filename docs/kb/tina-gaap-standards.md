# Tina KB: US GAAP Comprehensive Reference

## Purpose

This document provides Tina with practical knowledge of the most impactful US GAAP (Generally Accepted Accounting Principles) standards under the FASB Accounting Standards Codification (ASC). Each standard includes its core principle, key requirements, and common pitfalls to avoid.

---

## ASC 606 — Revenue from Contracts with Customers

### Core Principle

Recognize revenue to depict the transfer of promised goods or services to customers in an amount that reflects the consideration the entity expects to be entitled to in exchange for those goods or services.

### The Five-Step Model

1. **Identify the contract** — agreement between parties creating enforceable rights/obligations; must have commercial substance, approval, identifiable rights, payment terms, and probable collectibility
2. **Identify performance obligations** — distinct goods or services promised; a good or service is distinct if the customer can benefit from it on its own (or with readily available resources) and it is separately identifiable from other promises
3. **Determine the transaction price** — the amount of consideration expected; includes variable consideration (estimated using expected value or most likely amount), significant financing components, noncash consideration, and consideration payable to the customer
4. **Allocate the transaction price** — to each performance obligation based on relative standalone selling prices; methods: adjusted market approach, expected cost plus margin, residual approach (limited circumstances)
5. **Recognize revenue** — when (or as) performance obligations are satisfied; either at a point in time or over time

### Over-Time Recognition Criteria (any one suffices)

- Customer simultaneously receives and consumes benefits
- Entity's performance creates or enhances an asset the customer controls
- Entity's performance does not create an asset with alternative use AND entity has an enforceable right to payment for performance completed to date

### Key Requirements

- **Variable consideration**: include in transaction price only to the extent it is probable (GAAP term) that a significant reversal will not occur; apply a constraint
- **Contract modifications**: treated as a separate contract (if additional distinct goods at standalone price), prospective adjustment, or cumulative catch-up
- **Contract costs**: incremental costs of obtaining a contract (e.g., sales commissions) are capitalized if expected benefit period exceeds one year; amortized over the period of benefit; practical expedient allows expensing if amortization period is 1 year or less
- **Licensing**: right to access (over time) vs. right to use (point in time) — depends on whether licensor's activities significantly affect the IP
- **Principal vs. agent**: principal controls the good/service before transfer (gross revenue); agent arranges for another party to provide (net revenue)

### Common Pitfalls

- Failing to identify all performance obligations in bundled arrangements (e.g., software + implementation + support)
- Misapplying variable consideration constraint — being too aggressive or too conservative
- Incorrect principal vs. agent conclusions in marketplace/platform businesses
- Not reassessing contract modifications properly
- Inadequate disclosure of disaggregated revenue, remaining performance obligations, and significant judgments

---

## ASC 842 — Leases

### Core Principle

Lessees recognize most leases on the balance sheet as a right-of-use (ROU) asset and a lease liability, reflecting the right to use the underlying asset and the obligation to make lease payments.

### Key Requirements

**Lessee Accounting**
- **Operating leases**: ROU asset and lease liability on balance sheet; single lease cost (straight-line) recognized in the income statement
- **Finance leases**: ROU asset and lease liability on balance sheet; amortization of ROU asset (typically straight-line) and interest on lease liability recognized separately — front-loaded expense pattern
- **Classification test**: a lease is a finance lease if any one of the following is met: transfer of ownership, purchase option reasonably certain to be exercised, lease term is major part (typically 75%+) of useful life, PV of payments is substantially all (typically 90%+) of fair value, or the asset is specialized with no alternative use to the lessor

**Measurement**
- Lease liability: PV of remaining lease payments discounted at the rate implicit in the lease (or incremental borrowing rate if implicit rate not determinable)
- Lease payments include: fixed payments, variable payments based on an index or rate, purchase option payments (if reasonably certain), termination penalties (if reasonably certain to be incurred), residual value guarantees
- Variable payments not based on an index or rate are expensed as incurred (not included in liability)

**Practical Expedients**
- Short-term lease exemption: leases with terms of 12 months or less (no purchase option reasonably certain) — may elect to not recognize on balance sheet; expense straight-line
- Non-lease components: lessees may elect (by asset class) to not separate lease and non-lease components; account for entire contract as a single lease component

**Lessor Accounting**
- Largely unchanged from ASC 840
- Classification: operating, sales-type, or direct financing
- Lessor practical expedient: may not separate lease and non-lease components if certain conditions are met

### Common Pitfalls

- Missing embedded leases in service agreements (e.g., dedicated equipment in outsourcing contracts, co-location arrangements)
- Incorrect discount rate selection — IBR should reflect the lessee's credit quality, collateralized borrowing, and the lease term
- Failing to reassess lease term when options become reasonably certain to be exercised
- Improper treatment of lease modifications (remeasurement vs. separate contract)
- Not tracking all variable lease payments for disclosure purposes

---

## ASC 350 — Intangibles: Goodwill and Other

### Core Principle

Goodwill and indefinite-lived intangible assets are not amortized but are tested for impairment at least annually. Finite-lived intangible assets are amortized over their useful lives and tested for impairment when triggering events occur.

### Key Requirements

**Goodwill**
- Recognized in a business combination as the excess of purchase price over the fair value of identifiable net assets acquired
- Tested for impairment annually (or more frequently if triggering events occur)
- Impairment test (simplified, post-ASU 2017-04): compare the fair value of the reporting unit to its carrying amount (including goodwill); if carrying amount exceeds fair value, recognize impairment loss equal to the excess (limited to the amount of goodwill)
- Qualitative assessment option: assess whether it is more likely than not (>50%) that fair value of reporting unit is less than carrying amount; if not, skip quantitative test
- Goodwill impairment losses cannot be reversed

**Indefinite-Lived Intangible Assets**
- Examples: certain trademarks, broadcast licenses, airline routes
- Not amortized; tested for impairment annually
- Compare fair value to carrying amount; recognize impairment if carrying amount exceeds fair value

**Finite-Lived Intangible Assets**
- Examples: patents, customer relationships, non-compete agreements, developed technology, trade names (if finite)
- Amortize over useful life using method that reflects pattern of economic benefit consumption (straight-line if pattern cannot be reliably determined)
- Test for impairment under ASC 360 (long-lived assets) when triggering events occur

### Common Pitfalls

- Incorrect identification of reporting units for goodwill allocation
- Using inappropriate valuation methods for fair value (income approach, market approach, cost approach — each has appropriate use cases)
- Failing to perform interim impairment tests when triggering events occur (significant decline in stock price, loss of key customer, adverse regulatory changes)
- Not properly identifying and valuing intangible assets separately from goodwill in a business combination

---

## ASC 740 — Income Taxes

### Core Principle

Recognize the current and deferred tax consequences of all events that have been recognized in the financial statements or tax returns, using enacted tax rates.

### Key Requirements

**Current Tax**
- Provision for income taxes based on taxable income for the period
- Calculated using enacted tax rates and laws

**Deferred Tax**
- Recognize deferred tax assets (DTAs) and deferred tax liabilities (DTLs) for temporary differences between book and tax basis of assets and liabilities
- Use enacted rates expected to apply when temporary differences reverse
- **Valuation allowance**: reduce DTA by a valuation allowance if it is more likely than not (>50%) that some or all of the DTA will not be realized
  - Consider all available evidence: positive (existing contracts, taxable income history, tax planning strategies) and negative (cumulative losses, history of NOL expiration, adverse trends)
  - Objective negative evidence (3-year cumulative loss) is particularly difficult to overcome

**Uncertain Tax Positions (ASC 740-10-25)**
- Two-step process: (1) Recognition — is it more likely than not that the position will be sustained on examination? (2) Measurement — if yes, measure at the largest amount that is >50% likely to be realized upon settlement
- Requires assessment of all open tax years and positions
- Interest and penalties: policy election to classify as income tax expense or other expense

**Intraperiod Tax Allocation**
- Allocate total tax provision among: continuing operations, discontinued operations, other comprehensive income, equity
- Tax effects of items in OCI or equity are allocated directly to those components

### Common Pitfalls

- Improper valuation allowance assessment — especially in loss years; must weigh all evidence objectively
- Failure to adjust deferred taxes when tax rates change (recognized in the period of enactment)
- Not identifying all temporary differences (e.g., goodwill for tax but not book, or vice versa)
- Inadequate documentation of uncertain tax positions
- Incorrect intraperiod allocation, particularly with OCI items
- Missing state and foreign deferred tax calculations

---

## ASC 718 — Stock Compensation

### Core Principle

Recognize the cost of employee services received in exchange for equity instruments based on the grant-date fair value of the award over the requisite service period.

### Key Requirements

**Classification**
- Equity-classified awards: settled in the entity's own equity instruments; measured at grant-date fair value (not subsequently remeasured)
- Liability-classified awards: settled in cash or can be settled in cash at the employee's option; remeasured at fair value each reporting period until settlement

**Measurement**
- Stock options: typically use Black-Scholes or lattice (binomial) model; inputs include exercise price, expected term, expected volatility, risk-free rate, expected dividends
- Restricted stock/RSUs: fair value equals stock price on grant date (minus PV of dividends not received during vesting if applicable)
- Performance conditions: recognized when probable of achievement; reassess each period
- Market conditions: factored into fair value at grant date; do not adjust for probability — recognized over service period regardless of whether market condition is met (unless service is terminated)

**Forfeitures**
- Policy election: estimate forfeitures at grant date and adjust over time, OR recognize forfeitures as they occur
- Must be consistently applied

**Modifications**
- Compare fair value of modified award to fair value of original award immediately before modification
- Recognize incremental compensation cost (if any) over remaining/new service period
- Cannot reduce compensation cost below original grant-date fair value (even if modified award is worth less)

### Common Pitfalls

- Incorrect volatility assumptions for private companies (must use comparable public companies or calculated value method)
- Not reassessing performance condition probability each period
- Misclassifying awards between equity and liability
- Inadequate disclosure of assumptions and methods
- Missing modification accounting when terms change (acceleration of vesting, repricing, etc.)

---

## ASC 820 — Fair Value Measurement

### Core Principle

Fair value is the price that would be received to sell an asset or paid to transfer a liability in an orderly transaction between market participants at the measurement date (exit price).

### Fair Value Hierarchy

- **Level 1**: Quoted prices in active markets for identical assets or liabilities (e.g., publicly traded stock)
- **Level 2**: Observable inputs other than Level 1 prices (e.g., quoted prices for similar assets, interest rates, yield curves, credit spreads)
- **Level 3**: Unobservable inputs reflecting the entity's own assumptions (e.g., discounted cash flow models with management projections)

### Key Requirements

- Maximize use of observable inputs; minimize use of unobservable inputs
- Fair value of a liability: price to transfer (not settle) the liability; includes entity's own credit risk
- Highest and best use: for nonfinancial assets, fair value reflects the highest and best use by market participants
- Valuation techniques: market approach, income approach (DCF), cost approach — use one or more as appropriate; must be consistent
- Disclosure: level within hierarchy, valuation techniques, significant inputs, reconciliation of Level 3 measurements

### Common Pitfalls

- Using entity-specific assumptions when market participant assumptions are available
- Incorrect classification within the hierarchy (e.g., placing a Level 3 measurement in Level 2)
- Not considering the unit of account (individual asset vs. group)
- Failure to update fair value measurements when facts change (especially Level 3)

---

## ASC 230 — Statement of Cash Flows

### Core Principle

The statement of cash flows reports cash receipts and cash payments during a period, classified as operating, investing, or financing activities.

### Key Requirements

**Operating Activities**
- Cash effects of transactions that enter into the determination of net income
- Direct method (preferred but rare): report major classes of gross cash receipts and payments
- Indirect method (most common): start with net income; adjust for non-cash items and changes in working capital
- Non-cash adjustments: depreciation/amortization, stock-based compensation, deferred taxes, impairment charges, gain/loss on asset sales
- Working capital changes: increases in current assets = cash outflow; increases in current liabilities = cash inflow

**Investing Activities**
- Purchase/sale of property, plant, and equipment
- Purchase/sale of investments and securities
- Loans made and collected (non-financial entities)
- Business acquisitions and divestitures (net of cash acquired)

**Financing Activities**
- Proceeds from/repayments of debt
- Proceeds from issuance of equity
- Dividends paid
- Treasury stock purchases
- Payments on finance lease obligations (principal portion)

**Special Items**
- Interest paid: operating activity (GAAP; IFRS allows operating or financing)
- Income taxes paid: operating activity (GAAP; IFRS allows allocation)
- Restricted cash: include in beginning/ending cash balances; provide reconciliation
- Non-cash investing/financing activities: disclose separately (e.g., acquiring equipment through finance lease, converting debt to equity)

### Common Pitfalls

- Incorrect classification of cash flows (especially for transactions that span categories)
- Not reconciling restricted cash properly
- Missing non-cash disclosures
- Errors in working capital adjustments (especially for acquisitions — opening balance sheet vs. ongoing changes)

---

## ASC 280 — Segment Reporting

### Core Principle

Disclose information about operating segments in a manner consistent with how the chief operating decision maker (CODM) reviews financial information for decision-making.

### Key Requirements

- **Operating segment**: component of an entity that engages in business activities, has discrete financial information, and whose results are regularly reviewed by the CODM
- **Reportable segment**: operating segment that meets any one quantitative threshold — 10% of combined revenue, 10% of combined reported profit or loss (absolute value), or 10% of combined assets
- **75% test**: reportable segments must represent at least 75% of consolidated external revenue; if not, identify additional segments until the threshold is met
- **Aggregation criteria**: operating segments may be aggregated if they have similar economic characteristics and are similar in: nature of products/services, production processes, type of customer, distribution methods, and regulatory environment
- **Disclosures**: segment revenue (external and intersegment), segment profit or loss measure used by CODM, segment assets, reconciliations to consolidated totals

### ASU 2023-07 Updates (Effective 2024 for public entities)

- Requires disclosure of significant segment expenses regularly provided to the CODM
- Requires disclosure of the CODM's title and position
- Requires disclosure of how the CODM uses segment profit or loss
- Applies even to entities with a single reportable segment

### Common Pitfalls

- Incorrectly identifying the CODM or the information package reviewed
- Aggregating dissimilar segments to avoid disclosure
- Not updating segment identification when business structure changes
- Missing the enhanced disclosure requirements under ASU 2023-07

---

## Quick Reference Table

| Standard | Topic | Key Issue |
|----------|-------|-----------|
| ASC 606 | Revenue | 5-step model; variable consideration constraint |
| ASC 842 | Leases | ROU asset + lease liability on balance sheet |
| ASC 350 | Goodwill/Intangibles | Annual impairment testing; no amortization for goodwill |
| ASC 740 | Income Taxes | Deferred taxes; valuation allowance; uncertain positions |
| ASC 718 | Stock Compensation | Grant-date fair value; equity vs. liability classification |
| ASC 820 | Fair Value | 3-level hierarchy; exit price concept |
| ASC 230 | Cash Flows | Operating/investing/financing classification |
| ASC 280 | Segments | CODM-based approach; quantitative thresholds |

---

## Notes for Tina

- GAAP is principles-based but highly detailed — always check the specific ASC subsections for nuanced guidance
- FASB issues Accounting Standards Updates (ASUs) regularly; monitor for effective dates and transition requirements
- Private companies often have delayed effective dates and additional practical expedients
- When advising, distinguish between required accounting treatment and disclosure requirements — both matter for compliance
- For non-public entities, consider the applicability of the Private Company Council (PCC) alternatives (e.g., amortization of goodwill, simplified hedge accounting)
