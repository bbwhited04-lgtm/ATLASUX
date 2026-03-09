# Tina KB: Business Entity Types and Structuring

## Purpose

This document provides Tina with comprehensive knowledge of business entity types, their tax implications, liability protection characteristics, and strategies for entity selection and conversion. This is foundational knowledge for advising on business formation, restructuring, and tax optimization.

---

## Sole Proprietorship

### Structure

- Simplest business form — no separate legal entity; the individual IS the business
- No formation documents required (though local business licenses and DBAs may be needed)
- Reported on Schedule C of Form 1040

### Tax Implications

- All net profit is subject to self-employment tax (15.3% on first $176,100, then 2.9% Medicare on all remaining; 0.9% additional Medicare over $200K/$250K threshold)
- 50% of SE tax is deductible as an above-the-line deduction
- Eligible for Section 199A QBI deduction (20% of qualified business income, subject to limits)
- Losses offset other income on the personal return (subject to at-risk and passive activity rules)
- No employment tax on draws — but all net income is SE income

### Liability Protection

- **None** — personal assets are fully exposed to business liabilities
- Creditors can reach personal bank accounts, home equity (in most states), investments, etc.

### Best For

- Very small businesses, side hustles, testing a business concept before formalizing
- Situations where liability risk is minimal and revenue is low

---

## Limited Liability Company (LLC)

### Single-Member LLC

**Structure**
- One owner (member); formed under state LLC statute
- Disregarded entity for federal tax purposes (default) — reported on Schedule C (or Schedule E for rental income)
- Can elect to be taxed as S-Corp (Form 2553) or C-Corp (Form 8832)

**Tax Implications (as Disregarded Entity)**
- Same as sole proprietorship for tax purposes: all net income subject to SE tax
- Employment taxes are the same as sole proprietorship
- State treatment: some states impose franchise taxes or fees on LLCs (California: $800 minimum franchise tax plus income-based fee)

**Liability Protection**
- Separates personal and business assets — members are generally not liable for business debts
- Protection can be pierced if: commingling funds, inadequate capitalization, fraud, not maintaining formalities
- Single-member LLCs have weaker charging order protection in some states

### Multi-Member LLC

**Structure**
- Two or more members; defaults to partnership taxation (Form 1065)
- Operating agreement governs management, profit/loss allocation, distributions, and member rights
- Can elect S-Corp or C-Corp taxation

**Tax Implications (as Partnership)**
- Pass-through: income, deductions, credits flow to members on Schedule K-1
- Special allocations permitted if they have substantial economic effect (Section 704(b))
- Self-employment tax: general partners/managing members pay SE tax on their distributive share; limited partners may avoid SE tax on their share (but IRS has proposed regulations to expand SE tax to certain LLC members)
- Guaranteed payments for services are subject to SE tax
- No entity-level federal tax (some states impose entity-level taxes)

**Liability Protection**
- All members have limited liability (unlike general partnerships)
- Stronger charging order protection with multiple members
- Operating agreement is critical — governs what creditors can access

### Series LLC

**Structure**
- Available in approximately 20 states (Delaware, Illinois, Nevada, Texas, others)
- A master LLC contains multiple "series," each with its own assets, liabilities, and members
- Each series is theoretically shielded from the liabilities of other series

**Tax Implications**
- IRS has not issued final guidance on series LLC taxation
- Proposed regulations (2010) would treat each series as a separate entity for federal tax purposes
- In practice, many practitioners file separate returns for each series
- State treatment varies significantly

**Best For**
- Real estate investors with multiple properties (each property in a separate series)
- Asset protection strategies requiring segregation of different business activities

---

## S-Corporation

### Structure

- Corporation that elects S status under Subchapter S (Form 2553)
- Must meet eligibility requirements: ≤100 shareholders, only one class of stock (voting differences permitted), shareholders must be US citizens/residents, certain trusts, or estates (no partnerships, corporations, or nonresident aliens), must be a domestic corporation

### Tax Implications

- Pass-through entity: income, deductions, credits pass to shareholders on Schedule K-1
- **No entity-level federal tax** (except built-in gains tax if converted from C-Corp, and excess net passive income tax)
- **Employment tax savings**: shareholder-employees pay employment taxes only on reasonable compensation (W-2 salary), not on distributions
  - Example: $200,000 net income; $80,000 salary = employment taxes on $80,000 only; $120,000 distribution avoids FICA
- Section 199A QBI deduction available on the pass-through income (distributions are not QBI; W-2 wages are excluded from QBI but count for the wage limitation)
- Basis: shareholders track stock basis and debt basis; distributions in excess of basis trigger capital gain
- **No special allocations** — income/loss allocated strictly by ownership percentage
- Losses limited to stock basis + direct loans from shareholder to corporation (no increase in basis for entity-level debt, unlike partnerships)

### Reasonable Compensation Rules

- IRS actively audits S-Corp owner compensation
- Salary must be reasonable for the services performed — consider industry standards, experience, duties, time devoted
- Rules of thumb: salary should generally be 40-60% of net income for active single-owner S-Corps (but this varies by industry and facts)
- Too low = IRS reclassifies distributions as wages (plus penalties); too high = unnecessary employment taxes
- Factors: comparable salaries in similar businesses, education/training, prior experience, duties and responsibilities

### Best For

- Active businesses with $50,000–$500,000+ in net income where employment tax savings are significant
- Businesses with one class of ownership and straightforward structure
- Owner-operators who want pass-through taxation with employment tax optimization

---

## C-Corporation

### Structure

- Separate legal entity; taxed under Subchapter C
- No restrictions on shareholders, classes of stock, or number of shareholders
- Formed under state law; governed by articles of incorporation and bylaws

### Tax Implications

- **Entity-level tax**: flat 21% federal corporate tax rate
- **Double taxation**: profits taxed at corporate level, then dividends taxed again at shareholder level (0%, 15%, or 20% + 3.8% NIIT)
  - Combined effective rate: 21% + (79% x 23.8%) = approximately 39.8% (vs. top individual rate of 37% + 3.8% NIIT = 40.8%, but with 199A deduction, effective pass-through rate can be lower)
- **Retained earnings**: taxed only at 21% if not distributed — advantageous for businesses reinvesting profits
- **Accumulated earnings tax** (Section 531): 20% penalty tax on earnings retained beyond reasonable business needs (generally above $250,000 for most corporations, $150,000 for personal service corporations)
- **Fringe benefits**: can deduct health insurance, group-term life insurance, disability, and other benefits for shareholder-employees (>2% S-Corp shareholders cannot receive these tax-free)
- **Net operating losses**: can offset up to 80% of taxable income; carry forward indefinitely (no carryback for most corporations post-TCJA)

### QSBS Eligibility (Section 1202)

- Must be a C-Corp to qualify
- Shareholders who hold QSBS for 5+ years can exclude up to $10 million (or 10x basis) of gain
- Critical planning point: if QSBS is a potential exit strategy, form as C-Corp from inception
- See tina-irs-code.md for complete QSBS requirements

### Best For

- Businesses planning significant reinvestment of profits (tech companies, growth-stage businesses)
- Companies seeking venture capital or planning an IPO
- QSBS-eligible startups (potential for tax-free gains)
- Businesses that need multiple classes of stock (preferred, common)

---

## Partnership (General, Limited, LLP)

### General Partnership (GP)

- Two or more partners; each has unlimited liability
- All partners are agents of the partnership — can bind the partnership
- No formation filing required in most states (but recommended)
- Rarely used due to liability exposure

### Limited Partnership (LP)

- At least one general partner (unlimited liability) and one or more limited partners (liability limited to investment)
- Limited partners cannot participate in management without risking their limited liability status
- Common in: real estate, investment funds, family wealth planning
- General partner is often an LLC or corporation to shield the individual from liability

### Limited Liability Partnership (LLP)

- All partners have limited liability (varies by state — some states limit protection to malpractice claims)
- Common for professional firms: law, accounting, consulting
- Must register with the state and often carry minimum insurance

### Partnership Tax Implications

- Form 1065; K-1s issued to partners
- Special allocations permitted under Section 704(b) — enormous flexibility
- Partners may have different profit, loss, and cash distribution ratios
- Guaranteed payments: deductible by partnership, ordinary income to recipient, subject to SE tax
- Basis: includes partner's share of partnership liabilities (recourse and nonrecourse) — more basis flexibility than S-Corps
- Section 754 election: allows step-up in basis of partnership assets upon transfer or distribution — critical for real estate partnerships
- Self-employment tax: general partners pay SE tax on distributive share; limited partners generally do not (but the definition is uncertain for LLCs)

### Best For

- Real estate ventures (LP structure with LLC general partner)
- Investment partnerships and private equity funds
- Situations requiring flexible allocation of income, loss, and cash flow
- Multi-owner businesses where owners contribute different types of capital (cash, property, services)

---

## Nonprofit — 501(c)(3)

### Structure

- Corporation (or trust/unincorporated association) organized and operated exclusively for charitable, educational, religious, scientific, or other exempt purposes
- Must apply for exemption: Form 1023 (full application) or Form 1023-EZ (for organizations with gross receipts ≤$50,000 and assets ≤$250,000)
- No private shareholders or individuals may benefit from net earnings (inurement prohibition)

### Tax Implications

- Exempt from federal income tax on activities related to exempt purpose
- **Unrelated business income tax (UBIT)**: income from regularly carried on trade or business not substantially related to exempt purpose is taxable (Form 990-T); first $1,000 is excluded
- **State exemptions**: most states grant income and property tax exemptions, but applications are separate
- **Donor deductions**: contributions are deductible by donors (subject to AGI limits); this is the primary fundraising advantage
- **Employment taxes**: nonprofits are generally subject to FICA; may elect to opt out of FUTA (Section 3309 reimbursable method instead)

### Key Compliance Requirements

- Form 990 annual filing (990-EZ for gross receipts <$200,000 and assets <$500,000; 990-N e-Postcard for gross receipts ≤$50,000)
- Automatic revocation of exemption for failure to file Form 990 for 3 consecutive years
- Public disclosure requirements: Forms 990 and 1023 must be made available to the public
- Intermediate sanctions (Section 4958): excise taxes on excess benefit transactions with insiders

### Best For

- Charitable, educational, religious, and scientific organizations
- Situations where donor-deductible contributions are essential for funding
- Social enterprises (can operate a related business without losing exemption)

---

## Entity Comparison Matrix

| Feature | Sole Prop | Single LLC | Multi LLC | S-Corp | C-Corp | Partnership |
|---------|-----------|------------|-----------|--------|--------|-------------|
| Liability protection | None | Yes | Yes | Yes | Yes | Varies |
| Pass-through taxation | Yes | Yes | Yes | Yes | No | Yes |
| SE tax on all income | Yes | Yes (default) | Varies | No (on salary only) | N/A | Varies |
| Special allocations | N/A | N/A | Yes | No | N/A | Yes |
| Basis from entity debt | N/A | N/A | Yes | No | N/A | Yes |
| 199A deduction | Yes | Yes | Yes | Yes | No | Yes |
| QSBS eligible | No | No | No | No | Yes | No |
| Fringe benefits | Limited | Limited | Limited | Limited | Full | Limited |
| Max shareholders/members | 1 | 1 | Unlimited | 100 | Unlimited | Unlimited |
| Complexity | Low | Low | Medium | Medium | High | Medium-High |

---

## Check-the-Box Elections (Form 8832)

### How It Works

- Eligible entities (not per se corporations) can elect their federal tax classification
- Single-member LLC: choose between disregarded entity (default) or corporation
- Multi-member LLC: choose between partnership (default) or corporation
- Once classified as a corporation, can separately elect S-Corp status with Form 2553
- Election effective up to 75 days before filing or 12 months after filing
- 60-month lock: cannot change classification for 60 months after an election

### Common Elections

1. **LLC electing S-Corp**: file Form 8832 to be treated as corporation, then Form 2553 for S election (or just file Form 2553, which the IRS treats as an implicit 8832 election)
2. **LLC electing C-Corp**: file Form 8832 only
3. **Foreign entity electing disregarded entity**: common for single-owner foreign subsidiaries to simplify US reporting (but consider CFC/PFIC implications)

### Tax Consequences of Changing Classification

- **Disregarded entity → Corporation**: deemed contribution of all assets/liabilities under Section 351 (generally tax-free if 80% control requirement is met)
- **Corporation → Disregarded entity/Partnership**: deemed liquidation — triggers gain/loss recognition at both corporate and shareholder level (potentially double tax)
- **Partnership → Corporation**: deemed contribution under Section 351 (generally tax-free)
- **Corporation → Partnership**: not available through check-the-box for per se corporations; for LLCs taxed as corporations, the deemed liquidation applies

---

## Conversion Strategies

### LLC to S-Corp (Most Common)

**When to Convert**
- Net income consistently exceeds $40,000–$50,000+ (employment tax savings outweigh compliance costs)
- Business is stable enough to support regular salary payments
- Single or simple ownership structure

**How to Convert**
- File Form 2553 (S-Corp election) with the IRS
- Must be filed by March 15 for calendar-year entities (or 2 months and 15 days after the beginning of the tax year)
- Late election relief available under Rev. Proc. 2013-30 if filed within 3 years and 75 days
- Begin paying reasonable compensation through payroll
- Set up payroll tax deposits and reporting (Form 941 quarterly, Form 940 annually)

**Ongoing Requirements**
- Maintain payroll; pay reasonable compensation
- File Form 1120-S annually
- Issue K-1s to shareholders
- Maintain corporate formalities (minutes, resolutions)

### S-Corp to C-Corp

**When to Convert**
- Seeking venture capital (VCs typically require C-Corp structure)
- Planning for QSBS exclusion
- Significant profits being reinvested (21% rate advantage)
- Need multiple classes of stock

**How to Convert**
- Revoke S election: requires consent of shareholders holding >50% of shares
- File revocation statement with IRS; specify effective date
- If effective on the first day of the tax year, it is a prospective revocation
- Consider S-Corp accumulated adjustments account (AAA) — distribute AAA balance before conversion to avoid future taxation as C-Corp dividends

### C-Corp to S-Corp

**Key Considerations**
- **Built-in gains (BIG) tax**: if the C-Corp has appreciated assets, gain recognized during the 5-year recognition period (after conversion) is subject to the highest corporate tax rate (21%) at the entity level, in addition to pass-through taxation
- **LIFO recapture**: if using LIFO inventory, must recapture the LIFO reserve in the last C-Corp year
- **Passive investment income**: if the S-Corp has accumulated C-Corp earnings and profits (E&P) and passive investment income exceeds 25% of gross receipts, a tax is imposed; if this occurs for 3 consecutive years, the S election terminates
- **Strategy**: distribute C-Corp E&P before or shortly after conversion; sell appreciated assets before conversion if possible; or wait for BIG tax period to expire

---

## State-Specific Considerations

### Key State Variations

- **California**: $800 minimum franchise tax for LLCs and corporations; LLC fee based on total income ($0–$6,000+); no QSBS conformity
- **Delaware**: no state income tax on out-of-state income; $300 flat franchise tax for LLCs; favorable corporate law (Court of Chancery); popular for C-Corps seeking venture capital
- **Wyoming**: no state income tax; no franchise tax; strong asset protection for LLCs; series LLC available
- **Texas**: franchise tax (margin tax) based on revenue; affects entity selection
- **New York**: entity-level taxes on partnerships and LLCs; additional NYC taxes; complex filing requirements
- **Nevada**: no state income tax; no franchise tax; good asset protection; popular for holding companies

### Multi-State Operations

- Qualify (register) in every state where the entity does business
- Maintain registered agent in each state
- File state income tax returns and pay franchise/entity-level taxes as required
- Consider holding company structures for IP and asset protection (but watch economic substance requirements)

---

## Notes for Tina

- Entity selection is one of the most impactful tax planning decisions — get it right early
- There is no universally "best" entity type; the optimal choice depends on: income level, number of owners, growth plans, exit strategy, industry, state of operations, and personal circumstances
- Model the tax impact of each entity choice over a 5-year projection, not just the current year
- Conversion from one entity type to another has tax consequences — plan transitions carefully
- Always coordinate entity structuring with liability protection goals, estate planning, and exit planning
- Review entity structure annually — what was optimal at formation may not be optimal as the business evolves
