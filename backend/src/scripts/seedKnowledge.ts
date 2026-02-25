/**
 * Knowledge Base seed script — run with:
 *   npx tsx src/scripts/seedKnowledge.ts
 *
 * Loads domain knowledge for Atlas across 4 disciplines + Binky's research PhD.
 * Idempotent: upserts by slug.
 */

import { PrismaClient, KbDocumentStatus } from "@prisma/client";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), "../.env") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();
const TENANT_ID = (process.env.TENANT_ID ?? "").trim().replace(/\s/g, "");
const CREATED_BY = (process.env.SEED_CREATED_BY ?? TENANT_ID ?? "00000000-0000-0000-0000-000000000001");

if (!TENANT_ID) { console.error("TENANT_ID not set"); process.exit(1); }

// ─── Document definitions ────────────────────────────────────────────────────

const DOCS: { slug: string; title: string; tags: string[]; body: string }[] = [

// ══════════════════════════════════════════════════════
// PhD IN BUSINESS MANAGEMENT
// ══════════════════════════════════════════════════════

{
slug: "biz-porters-five-forces",
title: "Porter's Five Forces Framework",
tags: ["business-management", "strategy", "phd-business"],
body: `# Porter's Five Forces Framework

## Overview
Developed by Michael E. Porter (Harvard, 1979), the Five Forces framework determines the competitive intensity and profitability of an industry. Every strategic decision should be evaluated against these forces.

## The Five Forces

### 1. Threat of New Entrants
High barriers to entry protect incumbents. Assess:
- Capital requirements (high = low threat)
- Economies of scale (established players have cost advantages)
- Brand loyalty and switching costs
- Access to distribution channels
- Regulatory and legal requirements
- Proprietary technology / IP

**Strategic implication:** If threat is high, incumbents must continuously lower costs and build loyalty.

### 2. Bargaining Power of Suppliers
Strong suppliers can squeeze margins. Suppliers are powerful when:
- Few substitutes exist for their product
- Switching costs are high
- They can credibly integrate forward
- Your purchase volume is a small % of their revenue

**Strategic implication:** Diversify suppliers, develop in-house alternatives, build long-term contracts.

### 3. Bargaining Power of Buyers
Buyers push for lower prices and higher quality. They're powerful when:
- Purchases are large volume
- Products are standardized (easy to switch)
- Buyers are price-sensitive
- They can credibly integrate backward

**Strategic implication:** Differentiate your product, build switching costs, segment buyers by sensitivity.

### 4. Threat of Substitute Products
Substitutes limit the price ceiling. Threat is high when:
- Substitutes offer better price/performance
- Buyer switching costs to the substitute are low
- Substitutes come from adjacent industries (e.g. Zoom substituting business travel)

**Strategic implication:** Monitor adjacent industries; invest in features that substitutes can't replicate.

### 5. Industry Rivalry
Intense rivalry erodes profits. Factors intensifying rivalry:
- Many competitors of similar size
- Slow industry growth (zero-sum competition)
- High fixed costs (must sell volume)
- Low differentiation / low switching costs
- High exit barriers

**Strategic implication:** Differentiate, find niche segments, avoid pure price wars.

## Application Template
For any market or product decision:
1. Map each of the five forces (High / Medium / Low)
2. Identify which 1-2 forces are most threatening
3. Build strategy to blunt those forces
4. Reassess every 12 months

## Common Mistakes
- Confusing industry rivalry with buyer power
- Ignoring complementors (not a force but affects value creation)
- Applying to a company rather than an industry
- Treating as static — forces shift with technology and regulation
`
},

{
slug: "biz-bcg-matrix",
title: "BCG Growth-Share Matrix",
tags: ["business-management", "strategy", "portfolio", "phd-business"],
body: `# BCG Growth-Share Matrix

## Overview
Developed by Boston Consulting Group (1970s). Classifies business units or products into four quadrants based on market growth rate and relative market share. Used for portfolio management and capital allocation.

## The Four Quadrants

### Stars (High Growth, High Share)
- Market leaders in fast-growing markets
- Generate and consume large amounts of cash
- Goal: invest to maintain market leadership
- Eventually become Cash Cows as growth slows
- Examples: A new SaaS platform gaining rapid market share

### Cash Cows (Low Growth, High Share)
- Market leaders in mature, slow-growing markets
- Generate more cash than they consume
- Goal: "milk" them to fund Stars and Question Marks
- Minimize investment; maximize cash extraction
- Examples: Microsoft Office, Coca-Cola classic

### Question Marks / Problem Children (High Growth, Low Share)
- Small share in fast-growing markets
- Consume cash; uncertain future
- Decision: invest aggressively to become a Star, or divest
- Requires rigorous analysis before investing
- Examples: A new product line in an emerging market

### Dogs (Low Growth, Low Share)
- Weak competitive position in declining market
- May generate enough cash to be self-sustaining but rarely worth investing in
- Decision: divest, harvest, or reposition
- Caution: some "dogs" have strategic value (e.g., loss leaders)

## How to Use It

1. **Map your portfolio:** Plot each product/business unit on the matrix
2. **Assess cash flows:** Identify who funds whom
3. **Allocate capital:** Route Cash Cow profits to Stars and select Question Marks
4. **Set timelines:** Question Marks need a decision within 12-18 months
5. **Review quarterly:** Market positions shift

## Limitations
- Oversimplifies complex markets
- Market share ≠ profitability
- Growth rate ignores profitability of growth
- Ignores synergies between units
- Does not account for competitive response

## Extended Framework: GE-McKinsey Matrix
For more nuanced analysis, use GE-McKinsey which plots:
- Industry Attractiveness (composite score) vs Business Strength
- Nine cells instead of four quadrants
- Incorporates more variables (market size, profitability, competitive intensity)
`
},

{
slug: "biz-business-model-canvas",
title: "Business Model Canvas",
tags: ["business-management", "strategy", "business-model", "phd-business"],
body: `# Business Model Canvas

## Overview
Created by Alexander Osterwalder. A strategic management template for developing new business models or documenting existing ones. Nine building blocks on a single page.

## The Nine Building Blocks

### 1. Customer Segments
Who are you creating value for? Who are your most important customers?
- Mass market (one large group)
- Niche market (specialized segment)
- Segmented (slightly different needs)
- Diversified (unrelated segments)
- Multi-sided platforms (two+ interdependent segments)

### 2. Value Propositions
What value do you deliver? Which customer problem are you solving?
- Newness, Performance, Customization
- "Getting the job done" (convenience)
- Design, Brand/Status, Price
- Cost/Risk reduction, Accessibility

### 3. Channels
How do you reach your customer segments?
- Awareness → Evaluation → Purchase → Delivery → After-sales
- Own channels (website, store) vs Partner channels (distributors)
- Direct vs Indirect

### 4. Customer Relationships
What relationship does each segment expect?
- Personal assistance, Dedicated personal assistance
- Self-service, Automated services
- Communities, Co-creation

### 5. Revenue Streams
For what value are customers willing to pay?
- Asset sale, Usage fee, Subscription fee
- Lending/Renting/Leasing, Licensing
- Brokerage fees, Advertising

### 6. Key Resources
What assets are required to deliver your value proposition?
- Physical (facilities, machines)
- Intellectual (IP, brands, databases)
- Human (key people, expertise)
- Financial (credit lines, cash)

### 7. Key Activities
What activities must you perform?
- Production (making/delivering the product)
- Problem solving (consulting, SaaS support)
- Platform/Network (maintaining the platform)

### 8. Key Partnerships
Who are your key partners and suppliers?
- Optimization and economies of scale
- Reduction of risk and uncertainty
- Acquisition of resources and activities

### 9. Cost Structure
What are the most important costs in your model?
- Cost-driven (minimize costs) vs Value-driven (focus on value creation)
- Fixed vs Variable costs
- Economies of scale vs Economies of scope

## Usage Template
Complete in this order: Customer Segments → Value Propositions → Channels → Customer Relationships → Revenue Streams → Key Resources → Key Activities → Key Partnerships → Cost Structure.

Revisit every 6 months. Map one canvas per major product/market combination.
`
},

{
slug: "biz-okr-framework",
title: "OKR Framework — Objectives and Key Results",
tags: ["business-management", "strategy", "execution", "phd-business"],
body: `# OKR Framework — Objectives and Key Results

## Overview
Developed at Intel by Andy Grove, popularized by Google. Connects company, team, and personal goals in a hierarchical framework. Operates on 90-day cycles.

## Structure

### Objective
- Qualitative, aspirational, memorable
- Answers "Where do we want to go?"
- Should be inspirational, not a task list
- 3-5 objectives per level per quarter
- Example: "Build a product our customers love"

### Key Results
- Quantitative, measurable, time-bound
- Answers "How do we know we're getting there?"
- 2-5 KRs per Objective
- Scored 0.0–1.0 at end of cycle
- Example: "Achieve NPS of 50 by Q4", "Reduce churn to <2%/month"

## OKR Levels

### Company OKRs
Set by CEO and leadership. 3-5 per quarter. Communicate strategic priorities.

### Team OKRs
Derived from company OKRs. Each team picks 2-4 objectives that ladder up.

### Individual OKRs
Optional. Used for senior contributors. Should align to team OKRs.

## Scoring
- 0.7 = Expected achievement (stretch goal met)
- 1.0 = Exceptional (rare; if always hitting 1.0, goals aren't stretchy enough)
- 0.3 = Needs improvement
- Scoring is for learning, not performance review (keep them separated)

## Common Mistakes
- Setting OKRs that are task lists (ship feature X) rather than outcomes (achieve X metric)
- Mixing output KRs ("publish 10 blog posts") with outcome KRs ("increase organic traffic 40%")
- Too many OKRs — dilutes focus
- Tying OKRs directly to compensation (kills ambition)
- Skipping check-ins (need weekly 15-min reviews)

## Cadence
- **Annual:** Set company OKRs for the year (directional)
- **Quarterly:** Set and commit to quarterly OKRs
- **Weekly:** OKR check-ins in team meetings (confidence score update)
- **End of quarter:** Grade, learn, celebrate, plan next quarter

## CFR (Conversations, Feedback, Recognition)
The operating system that makes OKRs work. Weekly 1:1s, continuous feedback, public recognition of wins.
`
},

{
slug: "biz-unit-economics",
title: "Unit Economics — CAC, LTV, Payback Period",
tags: ["business-management", "finance", "saas", "phd-business"],
body: `# Unit Economics

## Overview
Unit economics measure the direct revenues and costs associated with one unit of business (one customer, one transaction). Foundational for SaaS, marketplace, and subscription businesses.

## Core Metrics

### Customer Acquisition Cost (CAC)
Total sales + marketing spend divided by new customers acquired in the same period.

**Formula:** CAC = (Sales + Marketing Spend) / New Customers Acquired

**Blended vs Paid CAC:**
- Blended CAC includes organic customers (lower, more optimistic)
- Paid CAC isolates only paid channel customers (higher, more conservative)
- Investors often want to see both

**Benchmark:** SaaS CAC payback < 12 months is healthy; < 6 months is exceptional

### Customer Lifetime Value (LTV / CLV)
Total revenue expected from one customer over their entire relationship.

**Formula (simple):** LTV = ARPU × Gross Margin % × Average Customer Lifetime (months)

**Formula (from churn):** LTV = (ARPU × Gross Margin %) / Monthly Churn Rate

**Example:** ARPU = $100/mo, Gross Margin = 70%, Monthly Churn = 2%
LTV = ($100 × 0.70) / 0.02 = $3,500

### LTV:CAC Ratio
The most important unit economics metric.

| Ratio | Health |
|-------|--------|
| < 1:1 | Losing money on every customer |
| 1:1 – 3:1 | Marginal; invest carefully |
| 3:1 | Healthy SaaS benchmark |
| 5:1+ | May be under-investing in growth |

### Payback Period
How many months until you recover your CAC.

**Formula:** Payback = CAC / (ARPU × Gross Margin %)

**Benchmark:** 12-18 months for enterprise SaaS; 6-9 months for SMB SaaS

## Cohort Analysis
Track LTV by acquisition cohort (month/quarter). Tells you whether retention is improving or degrading over time. Essential for fundraising narratives.

## Contribution Margin
Revenue minus variable costs. What's left to cover fixed costs and profit.

**Formula:** CM = Revenue - COGS - Variable Sales & Marketing

## Key Relationships
- Lower churn → higher LTV → better LTV:CAC
- Higher ARPU → faster payback
- Higher gross margin → more room for CAC
- Expansion revenue (upsells) dramatically improves LTV without additional CAC
`
},

{
slug: "biz-go-to-market",
title: "Go-To-Market Strategy Framework",
tags: ["business-management", "marketing", "strategy", "phd-business"],
body: `# Go-To-Market Strategy Framework

## Definition
A GTM strategy is the plan for launching a product or entering a new market. It answers: who is the customer, what problem do you solve, how do you reach them, and how do you win.

## GTM Motions

### Product-Led Growth (PLG)
Product is the primary acquisition and expansion driver.
- Free trial or freemium entry point
- Low friction self-serve onboarding
- In-product upgrade prompts
- Examples: Slack, Dropbox, Figma
- Best for: SMB/mid-market, horizontal tools, high-volume low-ACV

### Sales-Led Growth (SLG)
Sales team drives acquisition.
- Outbound prospecting + SDR/AE model
- High-touch demos and POCs
- Contract negotiation
- Examples: Salesforce, Workday, enterprise software
- Best for: Enterprise, high ACV ($50K+/yr), complex buying committees

### Marketing-Led Growth
Content, SEO, events, and brand drive awareness and inbound demand.
- Content marketing / SEO
- Thought leadership
- Community building
- Examples: HubSpot, Drift
- Best for: Mid-market, where buyers self-educate before contacting sales

### Partner-Led Growth
Channel partners, integrations, and ecosystems drive growth.
- Resellers, VARs, system integrators
- App marketplace (Salesforce AppExchange, etc.)
- Technology partnerships / co-selling

## GTM Components

### 1. Ideal Customer Profile (ICP)
Define precisely who your best customer is:
- Industry, company size, revenue, geography
- Tech stack, buying process, decision-makers
- Pain points, budget, urgency
- Negative ICP: who NOT to sell to

### 2. Value Proposition
3-part structure:
- For [target customer] who [has this problem]
- Our [product] is a [category]
- That [key benefit], unlike [alternative]

### 3. Pricing Model
- Per seat / per user
- Usage-based / consumption
- Flat rate / tiered
- Outcome-based
Match pricing to how customers perceive value.

### 4. Sales Process
Map the buyer's journey:
Awareness → Interest → Evaluation → Decision → Purchase → Onboarding → Expansion

### 5. Launch Checklist
- [ ] ICP defined and validated
- [ ] Messaging and positioning finalized
- [ ] Sales playbook written
- [ ] Pricing approved
- [ ] CRM configured with stages
- [ ] Marketing campaigns scheduled
- [ ] Customer success onboarding ready
- [ ] Analytics tracking in place
`
},

{
slug: "biz-financial-basics",
title: "Financial Statements and Analysis for Business Leaders",
tags: ["business-management", "finance", "accounting", "phd-business"],
body: `# Financial Statements and Analysis

## The Three Core Statements

### Income Statement (P&L)
Shows profitability over a period (month, quarter, year).

**Structure:**
Revenue
– Cost of Goods Sold (COGS)
= **Gross Profit**
– Operating Expenses (R&D, S&M, G&A)
= **EBITDA** (Earnings Before Interest, Taxes, Depreciation, Amortization)
– D&A
= **EBIT (Operating Income)**
– Interest + Taxes
= **Net Income**

**Key ratios:**
- Gross Margin = Gross Profit / Revenue
- Operating Margin = EBIT / Revenue
- Net Margin = Net Income / Revenue

### Balance Sheet
Snapshot of assets, liabilities, and equity at a point in time.

**Assets = Liabilities + Equity**

- Current Assets: cash, receivables, inventory
- Fixed Assets: property, equipment
- Current Liabilities: payables, short-term debt
- Long-term Liabilities: loans, bonds
- Equity: retained earnings + paid-in capital

**Key ratios:**
- Current Ratio = Current Assets / Current Liabilities (> 1.5 = healthy)
- Debt-to-Equity = Total Debt / Equity (lower = less leveraged)

### Cash Flow Statement
Shows actual cash movement in three buckets:
1. **Operating:** cash from business operations
2. **Investing:** capex, acquisitions, asset sales
3. **Financing:** debt raised/repaid, equity raised, dividends

**Why it matters:** A company can be profitable on paper but cash-flow negative (common in fast-growing SaaS with large upfront contracts and deferred revenue).

## SaaS-Specific Metrics

### ARR / MRR
- ARR = Annual Recurring Revenue
- MRR = Monthly Recurring Revenue
- New MRR + Expansion MRR - Churned MRR = Net New MRR

### Burn Rate and Runway
- Monthly Burn = Cash Out - Cash In
- Runway (months) = Cash Balance / Monthly Burn
- Target: 18+ months runway before fundraising

### Rule of 40
Revenue growth rate + Profit margin ≥ 40%
Benchmark for healthy SaaS at scale.

## Reading a Board Package
1. Start with revenue vs plan (are you hitting targets?)
2. Check gross margin trend (is the business getting more/less efficient?)
3. Look at burn and runway (how much time do we have?)
4. Review cohort retention (is the product getting stickier?)
5. Sales pipeline coverage (is there enough to hit next quarter?)
`
},

{
slug: "biz-competitive-analysis",
title: "Competitive Analysis Framework",
tags: ["business-management", "strategy", "competitive-intelligence", "phd-business"],
body: `# Competitive Analysis Framework

## Why It Matters
Knowing your competitive landscape enables better positioning, pricing, product decisions, and sales strategy. Update every 6 months or when a major competitor moves.

## Competitor Categories

### Direct Competitors
Same product, same market. Customers consider you head-to-head.

### Indirect Competitors
Different product solving the same problem (e.g., Zoom vs. business travel).

### Potential Entrants
Large companies that could enter your space (e.g., Microsoft, Google entering a niche).

### Substitutes
"Do nothing" or spreadsheets. Always include the status quo.

## Analysis Framework

### 1. Feature Matrix
Create a table: Your Product vs. Competitors A, B, C
Rows = Key features/capabilities
Cells = Yes / Partial / No / Differentiator

### 2. Positioning Map
Plot competitors on a 2×2 grid using two axes that matter to buyers:
- Example axes: Price vs. Ease of Use; Enterprise vs. SMB; Breadth vs. Depth

### 3. Win/Loss Analysis
After every deal, record:
- Who did we compete against?
- Why did we win/lose?
- What objections did the prospect have?
- What would have changed the outcome?

Track trends quarterly. If losing to Competitor X on price, that's a pricing problem. If on features, that's a roadmap problem.

### 4. Competitor Intelligence Sources
- G2, Capterra, Trustpilot reviews (read the 3-star reviews — most honest)
- LinkedIn (hiring patterns reveal strategic priorities)
- Job postings (what they're building next)
- Their changelog/blog (feature releases)
- Their pricing page (positioning signals)
- Customer interviews ("what else did you consider?")
- Conference presentations

### 5. Battlecard Structure
One page per major competitor:
- **Their pitch:** How they describe themselves
- **Their weaknesses:** Where they fall short (with proof points)
- **Why we win:** Our differentiated strengths (with customer quotes)
- **Landmines:** Questions to ask that expose their weaknesses
- **Their best objection to us:** And your response
`
},

// ══════════════════════════════════════════════════════
// MASTERS IN HR
// ══════════════════════════════════════════════════════

{
slug: "hr-hiring-framework",
title: "Hiring Framework — From JD to Offer",
tags: ["hr", "recruiting", "hiring", "masters-hr"],
body: `# Hiring Framework — From JD to Offer

## The Full Cycle

### Step 1: Define the Role
Before writing the JD, answer:
- What problem does this hire solve?
- What does success look like in 30/60/90 days?
- What are the must-have vs. nice-to-have skills?
- What's the compensation range? (Define before sourcing)
- Who is the hiring manager? Who has final say?

### Step 2: Write the Job Description
**Structure:**
- About the company (2-3 sentences, real and honest)
- About the role (what you'll own, not just tasks)
- What you'll do (outcomes, not just duties)
- What we're looking for (3-5 must-haves, 2-3 nice-to-haves)
- Compensation range (include it — you'll get better candidates)
- Benefits summary

**Anti-patterns to avoid:**
- "Ninja, rockstar, guru" — filters out diverse candidates
- 15+ requirements — most are wishful thinking; shorten to what's truly needed
- Vague impact ("you'll make a difference") — be specific

### Step 3: Sourcing
- **Inbound:** Job boards (LinkedIn, Indeed, Wellfound for startups)
- **Outbound:** Recruiter searches LinkedIn, contacts passive candidates
- **Referrals:** Most reliable source; build a referral program with incentives
- **Community:** Slack groups, Discord, meetups, conferences

### Step 4: Interview Process
Design a structured process before starting:

| Stage | Who | Duration | Purpose |
|-------|-----|----------|---------|
| Recruiter screen | Recruiter | 30 min | Culture, logistics, expectations |
| Hiring manager screen | HM | 45 min | Skills, experience, fit |
| Technical/skills interview | Peer | 60 min | Role-specific competency |
| Panel interview | 2-3 people | 90 min | Cross-functional fit |
| Reference checks | Recruiter | 20 min each | Validate past performance |
| Offer | HM + Recruiter | — | Move fast once decided |

### Step 5: Structured Interviewing
Use the same questions for every candidate for the same role. Score on a rubric (1-5) before discussing as a group.

**STAR format questions:**
- Situation: Set up the context
- Task: What was your responsibility?
- Action: What did YOU do?
- Result: What was the outcome?

### Step 6: Offer and Close
- Move within 24-48 hours of final interview
- Call to extend verbal offer (email follows)
- Include: base, bonus, equity, benefits, start date
- Give reasonable decision deadline (5-7 business days)
- Have a counteroffer strategy ready

## Time-to-Hire Benchmarks
- Engineering: 45-60 days
- Sales: 30-45 days
- Executive: 60-90 days
If you're taking longer, audit where candidates are dropping out.
`
},

{
slug: "hr-performance-management",
title: "Performance Management System",
tags: ["hr", "performance", "management", "masters-hr"],
body: `# Performance Management System

## Philosophy
Performance management is not about once-a-year reviews. It's a continuous system of goal-setting, feedback, coaching, and recognition.

## Core Components

### 1. Goal Setting (Quarterly)
- Align individual goals to team and company OKRs
- Use SMART format: Specific, Measurable, Achievable, Relevant, Time-bound
- 3-5 goals per person; too many dilutes focus
- Co-create goals WITH the employee, not FOR them

### 2. Weekly 1:1s
30 minutes, employee-led agenda:
- Progress updates (10 min)
- Blockers and support needed (10 min)
- Development and feedback (10 min)

Manager's job: listen 70%, talk 30%. Ask, don't tell.

### 3. Mid-Year Check-In
Formal 60-90 min conversation:
- Review progress on goals
- Update goals if business has changed
- Discuss career development
- Address any performance gaps early (no surprises at year-end)

### 4. Annual Review
**Rating scales:**
- Exceeds expectations (top ~15%)
- Meets expectations (core ~70%)
- Below expectations (bottom ~15%)
- Needs improvement / PIP threshold

**Components:**
- Self-assessment (employee fills first)
- Manager assessment
- Calibration with peers (ensure consistency)
- Delivery meeting (not a surprise)

### 5. Calibration
Managers meet to compare ratings across teams:
- Prevents grade inflation in some teams
- Ensures consistent standards
- Discusses high performers and succession planning
- Identifies bottom performers for action

## Performance Improvement Plan (PIP)
Use when repeated coaching hasn't corrected performance.
- Clearly document specific behaviors / gaps
- Set measurable improvement targets with timeline (30-90 days)
- Schedule weekly check-ins during PIP period
- Document all conversations
- If not improved: move to separation

**PIPs should never be a surprise.** If you get to a PIP, the employee should have received multiple prior warnings.

## Recognition
- Immediate, specific, public (for achievements)
- Peer recognition programs (nominations, shoutouts)
- Spot bonuses for exceptional contributions
- Regular "wins" callouts in team meetings

## Common Mistakes
- Annual reviews as the only feedback touchpoint
- Recency bias (only remembering last 2 months)
- Grade inflation to avoid hard conversations
- No documentation (creates legal risk)
- Tying OKR scores directly to raises (kills ambition)
`
},

{
slug: "hr-compensation-benefits",
title: "Compensation and Benefits Framework",
tags: ["hr", "compensation", "benefits", "masters-hr"],
body: `# Compensation and Benefits Framework

## Total Compensation Components
1. **Base salary** — fixed cash
2. **Variable / bonus** — tied to performance
3. **Equity** — stock options, RSUs, phantom equity
4. **Benefits** — health, dental, vision, 401k
5. **Perks** — remote work, L&D budget, wellness

## Compensation Philosophy
Decide your positioning BEFORE setting pay:
- **50th percentile** — market rate, conservative cash management
- **65th-75th percentile** — competitive; used to win top talent
- **90th percentile** — aggressive; used at cash-rich companies to eliminate comp as a variable

Document your philosophy and share it with employees. Transparency reduces perceived inequity.

## Building Pay Bands
1. **Define job levels** (e.g., L1–L6 or IC1–IC5 for engineers)
2. **Benchmark each level** using:
   - Radford, Levels.fyi, Carta Total Comp, Glassdoor
   - Use same geography and company stage (Series A vs public)
3. **Set band width:** typically 25-40% range per band
   - Midpoint = target pay for fully proficient employee
   - Bottom of band = entry for level
   - Top of band = maximum; exceeding means promotion
4. **Review bands annually** (market moves ~5-10% per year)

## Equity
### Options (ISO/NSO)
- Strike price = FMV at grant date
- Value only if stock price increases above strike
- Common at early-stage startups
- 4-year vesting, 1-year cliff is standard

### RSUs (Restricted Stock Units)
- Grant of actual shares, vest over time
- Common at later stage / public companies
- More predictable value than options

### Equity Negotiation
- % ownership matters more than # of shares at early stage
- Ask: what is the current 409A valuation? Outstanding shares? Preference stack?

## Variable Compensation
- Sales: base + commission (OTE = On-Target Earnings)
  - Typical split: 50/50 or 60/40 base/variable for quota-carrying reps
  - Commission rates: 5-15% of ARR depending on ACV
- Non-sales: annual bonus (5-20% of base, tied to company + individual performance)

## Benefits Must-Haves (US)
- Health, dental, vision (employer should cover 70-100% of employee premium)
- 401(k) with employer match (3-6% is market)
- PTO (unlimited or 15-20 days minimum)
- Parental leave (12-16 weeks)
- L&D budget ($1,000-$2,500/year)
`
},

{
slug: "hr-employment-law-basics",
title: "Employment Law Basics (US)",
tags: ["hr", "legal", "compliance", "masters-hr"],
body: `# Employment Law Basics (US)

## Federal Laws Every Employer Must Know

### FLSA (Fair Labor Standards Act)
- Sets minimum wage and overtime rules
- Non-exempt employees: must pay 1.5x for hours > 40/week
- Exempt employees: salary basis + duties test (executive, admin, professional)
- Misclassifying non-exempt as exempt is a major legal risk

### Title VII (Civil Rights Act 1964)
- Prohibits discrimination based on race, color, religion, sex, national origin
- Applies to employers with 15+ employees
- Covers hiring, firing, pay, job assignments, promotions
- EEOC enforces; complaints must be filed within 180 days

### ADA (Americans with Disabilities Act)
- Prohibits discrimination against qualified individuals with disabilities
- Requires "reasonable accommodation" unless undue hardship
- Interactive process is mandatory when accommodation is requested

### ADEA (Age Discrimination in Employment Act)
- Protects employees 40+ from age-based discrimination
- Applies to employers with 20+ employees

### FMLA (Family and Medical Leave Act)
- 12 weeks unpaid leave for qualifying reasons
- Applies to employers with 50+ employees
- Qualifying reasons: serious health condition, childbirth/adoption, care for family member

### NLRA (National Labor Relations Act)
- Protects employees' rights to organize, unionize, and engage in collective action
- Even non-union workplaces are covered
- **Critical for startups:** prohibiting employees from discussing wages = NLRA violation

## At-Will Employment
Most US states are at-will: employer or employee can end employment at any time for any legal reason (or no reason). Exceptions:
- Implied contract (be careful with employee handbook language)
- Covenant of good faith and fair dealing (some states)
- Cannot fire for illegal reasons (discrimination, retaliation, whistleblowing)

## Documentation Best Practices
- Document all performance conversations, warnings, PIPs
- Keep records for minimum 3 years (7 for payroll records)
- Termination should never be the first documented issue
- Separation agreements: consult an attorney before presenting

## I-9 Compliance
- Every new hire must complete Form I-9 within 3 days of start
- Verify identity + work authorization documents
- Retain for 3 years from hire date or 1 year after termination (whichever is later)

## Common Compliance Mistakes
- Asking about salary history in states where it's banned (CA, NY, IL, and many others)
- Background check notices/consent not done properly (FCRA)
- Non-compete agreements — largely unenforceable in CA; scrutinized in many states
- Misclassifying employees as contractors (IRS 20-factor test)
`
},

{
slug: "hr-onboarding",
title: "Employee Onboarding Framework",
tags: ["hr", "onboarding", "employee-experience", "masters-hr"],
body: `# Employee Onboarding Framework

## Why Onboarding Matters
- 69% of employees more likely to stay 3+ years with great onboarding (SHRM)
- Time to productivity: poor onboarding = 6+ months; great onboarding = 2-3 months
- First 90 days set expectations, relationships, and culture for years

## Pre-boarding (Before Day 1)
- Send welcome email with what to expect on Day 1
- Set up all accounts and hardware BEFORE they arrive
- Assign an onboarding buddy (peer, not manager)
- Prepare first week agenda
- Notify team of start date and role

## Day 1 Agenda
- Morning: Office/system tour, meet immediate team
- HR paperwork and compliance (I-9, benefits enrollment)
- Manager 1:1: expectations, 30/60/90 day goals
- Team lunch or virtual meet-and-greet
- End of day check-in: how are you feeling?

## 30-60-90 Day Plan

### First 30 Days: Listen and Learn
- Complete all required training
- Meet every stakeholder (shadow, don't execute)
- Document what you observe (processes, gaps, culture)
- Deliverable: summary of what you've learned and initial impressions

### First 60 Days: Contribute
- Own a small, real project with impact
- Build relationships with cross-functional partners
- Identify one quick win to deliver
- Deliverable: first independent work product

### First 90 Days: Drive
- Fully productive and independent in core role
- Established cadence of 1:1s, team meetings, check-ins
- Contributing to team goals
- Deliverable: 6-month goals agreed with manager

## Onboarding Checklist (Manager's Responsibilities)
- [ ] Set up 30/60/90 day plan WITH new hire
- [ ] Introduce to key stakeholders in first week
- [ ] Schedule recurring 1:1 (weekly to start)
- [ ] Assign meaningful work in first 30 days
- [ ] Give feedback early and often
- [ ] Check in on culture fit and any concerns
- [ ] Collect feedback on onboarding experience at 90 days

## Offboarding
Exit interviews: ask honestly why they're leaving. Aggregate data quarterly to find patterns.
- Knowledge transfer plan (critical for technical roles)
- Systems access revoked on last day
- COBRA and benefits termination notices
- Final paycheck timing per state law
`
},

{
slug: "hr-dei-framework",
title: "Diversity, Equity, and Inclusion Framework",
tags: ["hr", "dei", "culture", "masters-hr"],
body: `# Diversity, Equity, and Inclusion (DEI) Framework

## Key Definitions
- **Diversity:** The presence of differences (race, gender, age, background, thought)
- **Equity:** Fair treatment and access; removing barriers; acknowledging not everyone starts from the same place
- **Inclusion:** Creating environments where everyone feels valued, respected, and able to contribute
- **Belonging:** Going beyond inclusion — people feel they can be their authentic selves

## Why DEI Matters (Business Case)
- McKinsey research: companies in top quartile for gender diversity are 15% more likely to outperform peers on profitability
- Diverse teams make better decisions 87% of the time (Cloverpop)
- Inclusive cultures see 17% higher innovation revenue (Gartner)
- Access to broader talent pools reduces talent scarcity

## DEI in Hiring

### Structured Interviews
- Same questions for all candidates
- Scoring rubrics before candidate review
- Diverse interview panels
- Blind resume review where possible (remove names, schools)

### Job Descriptions
- Use tools like Textio or Gender Decoder to remove biased language
- Focus on outcomes, not credentials (remove degree requirements unless truly necessary)
- Include explicit diversity statement
- Post to diverse job boards (Diversify Tech, HBCU Connect, Women Who Code, etc.)

### Pipeline Metrics
Track at each stage: applicants → phone screen → interview → offer → accept
Identify where underrepresented groups drop off — that's where bias lives.

## DEI in Culture

### Psychological Safety
Amy Edmondson's research: teams with psychological safety take more risks, learn faster, and perform better.
- Leaders must model vulnerability ("I was wrong," "I don't know")
- No punishment for speaking up or sharing bad news
- Encourage dissent in decision-making

### Inclusive Meetings
- Assign a facilitator to ensure all voices are heard
- Share agendas in advance (helps introverts prepare)
- Acknowledge and amplify quieter voices
- Follow up asynchronously for those who couldn't speak up in real-time

## Metrics to Track
- Representation by level (especially leadership)
- Pay equity analysis (annually, by gender and race)
- Promotion rates by demographic
- Retention rates by demographic
- Inclusion survey scores (belonging, fairness, voice)
- Time-to-promotion by demographic
`
},

// ══════════════════════════════════════════════════════
// MASTERS IN EDUCATION
// ══════════════════════════════════════════════════════

{
slug: "edu-addie-instructional-design",
title: "ADDIE Instructional Design Model",
tags: ["education", "instructional-design", "curriculum", "masters-education"],
body: `# ADDIE Instructional Design Model

## Overview
ADDIE is the most widely used instructional design framework. Systematic, iterative process for designing effective learning experiences.

## The Five Phases

### A — Analysis
Before designing anything, understand the problem.
- **Needs analysis:** What gap exists between current and desired performance?
- **Audience analysis:** Who are the learners? Prior knowledge, experience, learning preferences, context
- **Task analysis:** What specific tasks/skills must learners be able to perform?
- **Environmental analysis:** How will learning be delivered? Constraints?
- **Output:** Learning needs statement, learner profile, delivery constraints

### D — Design
Blueprint for the learning experience.
- Write **learning objectives** (see Bloom's Taxonomy)
- Select instructional strategies (lecture, case study, simulation, practice)
- Sequence content logically (simple to complex, known to unknown)
- Design assessments that measure learning objectives
- Choose delivery medium (in-person, eLearning, blended, video)
- Output: Design document / storyboard / course outline

### D — Development
Build the actual content.
- Develop all learning materials (slides, videos, exercises, job aids)
- Build assessments
- Conduct pilot test with small group of real learners
- Revise based on pilot feedback
- Output: Complete course/training materials, ready to deliver

### I — Implementation
Deliver the learning experience.
- Facilitate or deploy the course
- Ensure learners have access and support
- Track attendance/completion
- Collect real-time feedback
- Output: Delivered training, completion data

### E — Evaluation
Did it work?
- Measure against Kirkpatrick's 4 levels (see below)
- Identify gaps for revision
- Update content for next iteration
- Output: Evaluation report, recommendations for improvement

## Why ADDIE Works
Forces discipline: you cannot design solutions without first analyzing the problem. Most training failures come from skipping Analysis — building solutions before understanding needs.

## ADDIE Shortcuts
For rapid development, compress to:
- SAM (Successive Approximation Model): iterative sprints
- 70-20-10 rule: 70% experience, 20% social learning, 10% formal training
`
},

{
slug: "edu-blooms-taxonomy",
title: "Bloom's Taxonomy — Writing Learning Objectives",
tags: ["education", "learning-objectives", "assessment", "masters-education"],
body: `# Bloom's Taxonomy

## Overview
Developed by Benjamin Bloom (1956), revised 2001. Hierarchical classification of cognitive learning from simple recall to complex creation. Used to write precise learning objectives and design aligned assessments.

## The Six Levels (Revised, Lowest to Highest)

### 1. Remember
Recall facts and basic concepts.
**Verbs:** define, list, recall, recognize, name, identify, label, match
**Example objective:** "The learner will be able to list the four components of a business model canvas."

### 2. Understand
Explain ideas or concepts in own words.
**Verbs:** explain, describe, summarize, classify, compare, interpret, paraphrase
**Example objective:** "The learner will be able to explain the difference between gross margin and net margin."

### 3. Apply
Use information in new situations.
**Verbs:** use, demonstrate, execute, implement, solve, calculate, apply
**Example objective:** "The learner will be able to calculate LTV:CAC ratio given a set of financial inputs."

### 4. Analyze
Draw connections, break down information.
**Verbs:** differentiate, organize, attribute, examine, compare, contrast, distinguish
**Example objective:** "The learner will be able to analyze a competitor's positioning and identify their key vulnerabilities."

### 5. Evaluate
Justify decisions and judgments.
**Verbs:** judge, defend, critique, evaluate, justify, assess, prioritize
**Example objective:** "The learner will be able to evaluate a GTM strategy and recommend improvements with rationale."

### 6. Create
Produce new or original work.
**Verbs:** design, construct, develop, formulate, produce, plan, compose
**Example objective:** "The learner will be able to design a 30/60/90 day onboarding plan for a specific role."

## Writing Good Learning Objectives

**Formula:** [Condition] + [Learner] + [Action verb from appropriate Bloom's level] + [Observable behavior] + [Standard]

**Example:** "Given a company's financial statements [condition], the learner [learner] will be able to calculate [apply] gross margin, operating margin, and net margin [behavior] with 100% accuracy [standard]."

## Aligning Assessment to Objectives
| Bloom's Level | Assessment Method |
|--------------|-------------------|
| Remember | Multiple choice, matching, fill-in-blank |
| Understand | Short answer, paraphrase, label diagram |
| Apply | Calculations, case problems, simulations |
| Analyze | Case studies, compare/contrast essays |
| Evaluate | Critiques, recommendations, debates |
| Create | Projects, portfolios, designed artifacts |

**Golden rule:** Never test at a lower level than you taught. If you taught analysis, assess analysis — not just recall.
`
},

{
slug: "edu-kirkpatrick-evaluation",
title: "Kirkpatrick's Four Levels of Training Evaluation",
tags: ["education", "evaluation", "training", "masters-education"],
body: `# Kirkpatrick's Four Levels of Training Evaluation

## Overview
Donald Kirkpatrick (1959). The most widely used framework for evaluating training effectiveness. Four levels, each more complex and valuable than the last.

## The Four Levels

### Level 1: Reaction
Did the learners like it?
- **What it measures:** Learner satisfaction, perceived relevance, engagement
- **How to collect:** Post-training survey ("smile sheet"), Net Promoter Score
- **Typical questions:** Was the content relevant? Was the facilitator effective? Would you recommend this to a colleague?
- **Value:** Easy to collect; tells you about delivery quality but not learning
- **Limitation:** High satisfaction ≠ high learning. Entertainment ≠ education.

### Level 2: Learning
Did the learners gain knowledge, skills, or confidence?
- **What it measures:** Actual knowledge/skill acquisition
- **How to collect:** Pre/post test, skill demonstration, quiz, observation
- **Best practice:** Baseline (pre-test) before training; post-test immediately after
- **Value:** First real evidence that learning occurred
- **Limitation:** Knowledge acquired ≠ knowledge applied on the job

### Level 3: Behavior
Are learners applying what they learned back on the job?
- **What it measures:** Transfer of learning to performance
- **How to collect:** Manager observation, 360 feedback, self-assessment at 30/60/90 days
- **Timeline:** 30-90 days after training (give time to apply)
- **Key insight:** Most training fails at Level 3. Learners know the material but don't change behavior.
- **Why behavior doesn't change:**
  - No manager reinforcement
  - No opportunity to practice
  - Organizational barriers
  - Forgetting curve (Ebbinghaus: 50% forgotten within 1 hour without reinforcement)

### Level 4: Results
Did the training produce the desired business outcomes?
- **What it measures:** ROI, business impact — revenue, cost, quality, retention
- **How to collect:** Business metrics before vs after; control group comparison
- **Examples:** Reduction in customer complaints after service training; increase in close rates after sales training
- **Value:** What executives actually care about
- **Limitation:** Hardest to isolate training as the cause (correlation vs causation)

## Practical Application

Work backwards:
1. Start with Level 4: What business result do we need?
2. Define Level 3: What behavior change produces that result?
3. Design Level 2: What must learners know/do to change behavior?
4. Plan Level 1: How do we make the experience engaging?

Most organizations only measure Level 1. Move toward at least Level 2 for all programs and Level 3-4 for high-stakes training.

## ROI Formula (Phillips Level 5)
ROI (%) = [(Benefits - Costs) / Costs] × 100
- Isolate training contribution (control group, trend line, expert estimation)
- Convert benefits to monetary value
- Account for fully-loaded costs (design, development, delivery, learner time)
`
},

{
slug: "edu-adult-learning-theory",
title: "Adult Learning Theory — Andragogy",
tags: ["education", "adult-learning", "theory", "masters-education"],
body: `# Adult Learning Theory — Andragogy

## Overview
Malcolm Knowles (1970s) coined andragogy — the art and science of helping adults learn — as distinct from pedagogy (teaching children). Understanding how adults learn differently makes training dramatically more effective.

## Knowles' Six Principles of Adult Learning

### 1. Self-Concept
Adults need to be self-directing.
- Adults resist being told what to learn or how
- Involve learners in planning and evaluating their learning
- Offer choice in how they achieve learning objectives
- **Design implication:** Give options (choose your own learning path, self-paced modules)

### 2. Experience
Adults bring rich prior experience as a foundation.
- Experience is both a resource and a filter
- New learning must connect to prior experience
- Use reflection activities, discussion, and case studies
- **Design implication:** Use real-world examples; leverage peer learning; acknowledge what they already know

### 3. Readiness to Learn
Adults learn what they need to know to function effectively.
- Readiness is triggered by life/role transitions
- Learning must be timely (just-in-time, not just-in-case)
- **Design implication:** Connect training to real current challenges; offer at the moment of need

### 4. Orientation to Learning
Adults are problem-centered, not subject-centered.
- Learning is organized around solving problems, not mastering a subject
- "How will I use this?" must be answerable immediately
- **Design implication:** Structure around realistic scenarios; lead with application, not theory

### 5. Motivation to Learn
Adults are internally motivated.
- External motivators (grades, required training) can create compliance but not engagement
- Internal motivators: career advancement, solving problems, personal satisfaction
- **Design implication:** Connect learning to their goals; explain the "why"; make it relevant to their work now

### 6. Need to Know
Adults need to know WHY before they invest effort.
- Start every learning experience by explaining why it matters and what they'll be able to do
- Never open with housekeeping — open with the problem statement
- **Design implication:** Set context first; use compelling opening scenarios

## Forgetting Curve and Spaced Repetition
Ebbinghaus (1885): Without reinforcement:
- 50% forgotten in 1 hour
- 70% forgotten in 24 hours
- 90% forgotten in 1 week

**Spaced repetition:** Distribute practice over time:
- Initial training
- Quick review at 24 hours
- Practice at 1 week
- Application at 1 month
- Reinforcement at 3 months

**Retrieval practice:** Testing improves retention more than re-reading. Quizzes = learning tool, not just measurement.
`
},

{
slug: "edu-curriculum-design",
title: "Curriculum Design Framework",
tags: ["education", "curriculum", "instructional-design", "masters-education"],
body: `# Curriculum Design Framework

## What is a Curriculum?
A curriculum is the complete set of learning experiences organized to achieve specific educational goals. Goes beyond a course syllabus — encompasses scope, sequence, and alignment across all learning experiences.

## Backward Design (Wiggins & McTighe — Understanding by Design)
Start with the end in mind:
1. **Identify desired results:** What should learners know, understand, and be able to do?
2. **Determine acceptable evidence:** How will you know learners achieved results?
3. **Plan learning experiences:** What activities will get them there?

**Why backward?** Most curriculum design fails because designers build content first, then assess. Backward design ensures assessment-curriculum alignment.

## Scope and Sequence

### Scope
What will be covered — breadth and depth of content.
- Don't try to cover everything
- Prioritize: Worth being familiar with / Important to know / Enduring understanding (worth deep investment)
- Remove content that doesn't serve learning objectives

### Sequence
Order of content delivery.
- **Simple to complex:** Start with foundational concepts
- **Known to unknown:** Anchor new content to what learners already know
- **Chronological:** For process or history-based content
- **Spiral curriculum:** Revisit topics at increasing depth over time (Bruner)

## Curriculum Components

### 1. Standards / Competencies
The performance standards learners must meet. Define before anything else.

### 2. Units / Modules
Grouped clusters of related content. Each unit should have its own objectives and assessment.

### 3. Lessons / Activities
Individual learning experiences within a unit. Each lesson = one or two specific learning objectives.

### 4. Assessments
- **Formative:** During learning (quizzes, exit tickets, discussion checks)
- **Summative:** End of unit/course (projects, exams, portfolios)
- **Authentic:** Real-world application tasks

### 5. Resources and Materials
Curated for quality, appropriateness for audience, alignment to objectives.

## Curriculum Evaluation
- **Content validity:** Does it cover what it should? Nothing more, nothing less?
- **Alignment:** Do objectives, instruction, and assessment match?
- **Relevance:** Is it current? Does it reflect real-world practice?
- **Engagement:** Does it hold learner interest?
- **Outcomes:** Is it producing the desired performance?

Review curriculum annually. Significant revisions every 3-5 years.
`
},

// ══════════════════════════════════════════════════════
// BA IN INFRASTRUCTURE & INTERNET
// ══════════════════════════════════════════════════════

{
slug: "infra-networking-fundamentals",
title: "Networking Fundamentals — DNS, HTTP, TCP/IP",
tags: ["infrastructure", "networking", "internet", "ba-infrastructure"],
body: `# Networking Fundamentals

## OSI Model (7 Layers)
| Layer | Name | Example |
|-------|------|---------|
| 7 | Application | HTTP, SMTP, DNS |
| 6 | Presentation | SSL/TLS, encryption |
| 5 | Session | Authentication, sessions |
| 4 | Transport | TCP, UDP |
| 3 | Network | IP, routing |
| 2 | Data Link | Ethernet, MAC addresses |
| 1 | Physical | Cables, fiber, wireless |

## IP Addressing

### IPv4
32-bit address: 192.168.1.1
- Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
- CIDR notation: /24 = 254 hosts, /16 = 65,534 hosts
- Loopback: 127.0.0.1 (localhost)

### IPv6
128-bit address: 2001:0db8:85a3::8a2e:0370:7334
Solves IPv4 address exhaustion; adoption growing.

## DNS (Domain Name System)
Translates human-readable names to IP addresses.

**Resolution process:**
1. Browser checks local cache
2. Checks OS hosts file
3. Queries recursive resolver (usually ISP or 8.8.8.8)
4. Resolver queries root nameserver → TLD nameserver → authoritative nameserver
5. IP returned and cached with TTL

**Record types:**
- A: domain → IPv4 address
- AAAA: domain → IPv6 address
- CNAME: alias → another domain
- MX: mail exchange server
- TXT: arbitrary text (used for SPF, DKIM, domain verification)
- NS: authoritative nameserver

**TTL:** Time-to-live. Lower TTL = more DNS queries but faster propagation on change.

## HTTP/HTTPS

### HTTP Methods
- GET: retrieve resource (idempotent)
- POST: create resource
- PUT: replace resource (idempotent)
- PATCH: partial update
- DELETE: delete resource
- OPTIONS: query allowed methods

### Status Codes
- 2xx: Success (200 OK, 201 Created, 204 No Content)
- 3xx: Redirect (301 Moved Permanently, 302 Found, 304 Not Modified)
- 4xx: Client error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests)
- 5xx: Server error (500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)

### HTTPS / TLS
- TLS 1.2 / 1.3 encrypts data in transit
- Certificate issued by Certificate Authority (CA)
- HSTS header forces HTTPS
- Certificate transparency logs for security audit

## TCP vs UDP
| TCP | UDP |
|-----|-----|
| Connection-oriented (3-way handshake) | Connectionless |
| Reliable, ordered delivery | Best-effort, no guarantees |
| Slower | Faster |
| HTTP, SSH, email | DNS queries, video streaming, gaming |
`
},

{
slug: "infra-cloud-architecture",
title: "Cloud Architecture — Concepts and Patterns",
tags: ["infrastructure", "cloud", "architecture", "ba-infrastructure"],
body: `# Cloud Architecture

## Core Concepts

### IaaS / PaaS / SaaS
| Model | You manage | Provider manages | Example |
|-------|-----------|-----------------|---------|
| IaaS | OS, apps, data | Hardware, networking | AWS EC2, GCP Compute |
| PaaS | Apps, data | OS, runtime, middleware | Render, Heroku, Railway |
| SaaS | Data (sort of) | Everything | Salesforce, Slack |

### Regions and Availability Zones
- **Region:** Geographic area (us-east-1, eu-west-2)
- **Availability Zone:** Isolated data center within a region
- **Multi-AZ:** Distribute resources across AZs for high availability
- **Multi-region:** Distribute globally for disaster recovery and latency

## Key Architecture Patterns

### Monolith vs Microservices
**Monolith:** Single deployable unit. Simpler to develop and deploy. Scales as one unit.
- Best for: Early stage, small teams, unclear domain boundaries

**Microservices:** Multiple independent services. Scale independently. More operational complexity.
- Best for: Large teams, clear domain boundaries, need to scale specific components

**Recommendation:** Start monolith. Extract services when you have a clear, stable domain boundary and scaling need.

### Horizontal vs Vertical Scaling
- **Vertical (scale up):** Bigger server (more CPU/RAM). Simple but has limits and single point of failure.
- **Horizontal (scale out):** More servers behind a load balancer. No theoretical limit; requires stateless services.

### Load Balancing
Distributes traffic across multiple servers.
- **Round-robin:** Requests distributed evenly
- **Least connections:** Routes to server with fewest active connections
- **Health checks:** Automatically removes unhealthy servers
- **Sticky sessions:** Routes same user to same server (needed for stateful apps)

### CDN (Content Delivery Network)
Caches static assets at edge locations close to users.
- Reduces latency (content served from nearby PoP)
- Reduces origin server load
- Protects against DDoS
- Examples: Cloudflare, AWS CloudFront, Fastly

### Database Patterns
- **Read replicas:** Offload read traffic; primary handles writes
- **Sharding:** Partition data across multiple databases by key
- **Connection pooling:** PgBouncer, RDS Proxy — essential for serverless/high concurrency
- **Caching:** Redis/Memcached in front of DB for frequently-read data

## Infrastructure as Code
Define infrastructure in code, not through UIs.
- **Terraform:** Cloud-agnostic, declarative
- **Pulumi:** IaC using real programming languages
- **AWS CDK / Serverless Framework:** AWS-specific

Benefits: Version control, repeatability, auditability, disaster recovery.

## 12-Factor App Principles (Heroku)
1. One codebase, many deploys
2. Explicitly declare and isolate dependencies
3. Store config in the environment (never in code)
4. Treat backing services as attached resources
5. Strictly separate build and run stages
6. Execute app as stateless processes
7. Export services via port binding
8. Scale out via process model
9. Maximize robustness with fast startup and graceful shutdown
10. Keep development, staging, production as similar as possible
11. Treat logs as event streams
12. Run admin/management tasks as one-off processes
`
},

{
slug: "infra-security-fundamentals",
title: "Application Security Fundamentals",
tags: ["infrastructure", "security", "appsec", "ba-infrastructure"],
body: `# Application Security Fundamentals

## OWASP Top 10 (2021)

### 1. Broken Access Control
- Users accessing data/functions beyond their permissions
- Prevention: enforce least privilege; deny by default; log access failures

### 2. Cryptographic Failures
- Sensitive data exposed in transit or at rest
- Prevention: TLS everywhere; hash passwords with bcrypt/Argon2; never store plaintext credentials

### 3. Injection (SQL, Command, LDAP)
- Attacker sends malicious input that gets executed
- Prevention: parameterized queries; input validation; escape special characters

### 4. Insecure Design
- Security not considered during design
- Prevention: threat modeling; security requirements; secure design patterns

### 5. Security Misconfiguration
- Default credentials; open cloud storage; verbose error messages
- Prevention: harden default configs; regular audits; remove unused features

### 6. Vulnerable and Outdated Components
- Using libraries with known vulnerabilities
- Prevention: dependency scanning (npm audit, Snyk, Dependabot); keep dependencies updated

### 7. Identification and Authentication Failures
- Weak passwords; no MFA; session tokens exposed
- Prevention: enforce MFA; use secure session management; rate-limit login attempts

### 8. Software and Data Integrity Failures
- Assuming integrity of software/data without verification
- Prevention: sign code; verify CI/CD pipeline integrity; validate external data

### 9. Security Logging and Monitoring Failures
- Attacks not detected because logging is insufficient
- Prevention: log authentication events, access control failures, input validation failures; monitor and alert

### 10. Server-Side Request Forgery (SSRF)
- Server fetches attacker-controlled URLs, exposing internal services
- Prevention: validate and sanitize URLs; block requests to internal IP ranges; allowlist external services

## Authentication and Authorization

### Authentication (Who are you?)
- Passwords: require complexity; bcrypt hash; never store plaintext
- MFA: TOTP (Google Authenticator), hardware keys (FIDO2)
- OAuth 2.0 / OpenID Connect: delegate auth to trusted providers
- JWT: stateless tokens; verify signature; set short expiry; never put sensitive data in payload

### Authorization (What can you do?)
- RBAC (Role-Based Access Control): roles have permissions; users have roles
- ABAC (Attribute-Based): permissions based on attributes (user dept, resource owner, time of day)
- Always enforce on server-side — never trust client-side checks

## Secret Management
- Never hardcode secrets in code
- Use environment variables for runtime configuration
- Use secret managers for sensitive values: AWS Secrets Manager, HashiCorp Vault, Doppler
- Rotate secrets regularly
- Audit who has access to what

## Defense in Depth
Layer security controls:
1. Network: firewalls, VPC, private subnets
2. Application: input validation, auth/authz
3. Data: encryption at rest, column-level encryption for PII
4. Monitoring: SIEM, alerting, audit logs
5. People: security training, least privilege access
`
},

{
slug: "infra-devops-cicd",
title: "DevOps and CI/CD Practices",
tags: ["infrastructure", "devops", "cicd", "ba-infrastructure"],
body: `# DevOps and CI/CD

## Core Principle
DevOps bridges development and operations. Goal: ship code faster, more reliably, with less manual intervention.

## CI/CD Pipeline

### Continuous Integration (CI)
Every code push triggers automated build and test.
1. Developer pushes code to branch
2. CI server (GitHub Actions, CircleCI, Jenkins) picks it up
3. Install dependencies
4. Run linter/formatter check
5. Run unit tests
6. Run integration tests
7. Build artifact
8. Pass/fail reported before merge

**Why CI matters:** Catches bugs when they're small and cheap to fix. Makes "works on my machine" irrelevant.

### Continuous Delivery (CD)
Every passing CI build can be deployed to production (with a manual gate).

### Continuous Deployment
Every passing CI build IS automatically deployed to production (no manual gate). Requires extremely high test coverage and confidence.

## Deployment Strategies

### Blue-Green Deployment
Run two identical environments (blue = live, green = new). Switch traffic to green once validated. Instant rollback = switch back to blue.
- Zero downtime
- Full production environment for testing before cutover
- Doubles infrastructure cost during transition

### Canary Deployment
Release to small % of users first (5-10%), monitor, then gradually increase.
- Catches issues before full rollout
- Requires feature flags or traffic routing capability
- Slower than blue-green

### Rolling Deployment
Replace instances one at a time. Old and new versions run simultaneously during rollout.
- Lower cost than blue-green
- Rollback is slower (must roll forward through remaining instances)

### Feature Flags
Decouple deployment from release. Deploy code but keep feature "off" in production. Enable for specific users or % of traffic.
- Test in production safely
- Instant kill switch if issues arise
- A/B test features

## Observability

### The Three Pillars
1. **Logs:** Structured event records (use JSON; include trace ID, user ID, request ID)
2. **Metrics:** Numeric measurements over time (request rate, error rate, latency, saturation)
3. **Traces:** End-to-end request flow across services

### Key Metrics (RED Method)
- **Rate:** Requests per second
- **Errors:** Error rate (%)
- **Duration:** Latency (p50, p95, p99)

### Alerting Rules
- Alert on symptoms (high error rate, high latency) not causes
- Alert should be actionable (someone can do something about it)
- Alert fatigue is real — too many alerts = ignored alerts
- On-call rotation; runbooks for every alert

## Infrastructure
- **Environments:** dev → staging → production (must be kept in sync)
- **Configuration:** Use env vars; never hardcode; use dotenv locally, secrets manager in production
- **Database migrations:** Versioned, reversible, run before code deploy
- **Rollback plan:** Every deploy must have a documented rollback procedure
`
},

{
slug: "infra-incident-response",
title: "Incident Response Playbook",
tags: ["infrastructure", "incident-response", "sre", "ba-infrastructure"],
body: `# Incident Response Playbook

## Severity Levels

| Level | Definition | Response Time | Example |
|-------|-----------|---------------|---------|
| SEV-1 | Complete outage; all users affected; revenue at risk | Immediate | Site down, DB unreachable |
| SEV-2 | Major feature broken; many users affected | 15 minutes | Login broken, payments failing |
| SEV-3 | Minor feature degraded; subset of users | 1 hour | Slow reports, some UI errors |
| SEV-4 | Cosmetic issue; minimal impact | Next business day | Wrong text, styling bug |

## Incident Response Process

### 1. Detection
- Monitoring alert fires (PagerDuty, OpsGenie, etc.)
- User report via support ticket or social media
- Internal team member notices issue

### 2. Declare and Assign
- Incident Commander (IC) takes ownership
- Set up incident channel (#incident-date-description)
- Communicate status: "We are investigating an issue affecting X"
- Assign roles: IC, technical lead, communications lead

### 3. Investigate and Mitigate
**Investigation checklist:**
- What changed recently? (Recent deploys, config changes, external events)
- What do logs show? (Error patterns, spike timing)
- What do metrics show? (CPU, memory, DB connections, error rate)
- Is the issue contained or spreading?

**Mitigation options (in order of preference):**
1. Rollback recent deploy
2. Disable problematic feature flag
3. Increase capacity (scale up/out)
4. Route around the failure (failover, maintenance mode)
5. Fix-forward if rollback isn't possible

### 4. Resolve
- Confirm issue is resolved with monitoring (not just "looks better")
- Send all-clear communication
- Document the timeline

### 5. Post-Incident Review (PIR / Blameless Postmortem)
Within 48 hours for SEV-1/2:
- **Timeline:** Minute-by-minute what happened
- **Root cause:** Not symptoms — the underlying cause
- **Contributing factors:** What made this possible?
- **What went well**
- **What went poorly**
- **Action items:** Specific, assigned, time-bound

**Blameless culture:** Incidents are system failures, not people failures. Goal is to fix systems so the incident can't happen again — not to find someone to blame.

## SLAs, SLOs, SLIs
- **SLI (Service Level Indicator):** Actual measurement (error rate, latency)
- **SLO (Service Level Objective):** Target for SLI (99.9% availability, p99 latency < 500ms)
- **SLA (Service Level Agreement):** Contract with customers; breach triggers penalties
- **Error budget:** 1 - SLO. At 99.9% SLO, you have 8.7 hours/year of downtime budget.
`
},

{
slug: "infra-api-design",
title: "API Design Best Practices",
tags: ["infrastructure", "api", "backend", "ba-infrastructure"],
body: `# API Design Best Practices

## REST API Design

### Resource Naming
- Use nouns, not verbs: /users (not /getUsers)
- Plural for collections: /users, /posts
- Nested for relationships: /users/{id}/posts
- Lowercase with hyphens: /blog-posts (not /blogPosts)

### HTTP Methods
- GET /users — list users
- GET /users/123 — get specific user
- POST /users — create user
- PUT /users/123 — replace user
- PATCH /users/123 — partial update
- DELETE /users/123 — delete user

### Status Codes (use precisely)
- 200: Success with body
- 201: Created (include Location header)
- 204: Success, no body (DELETE, some PATCHes)
- 400: Client sent bad data (include error details)
- 401: Not authenticated
- 403: Authenticated but not authorized
- 404: Resource not found
- 409: Conflict (duplicate, version mismatch)
- 422: Unprocessable entity (validation errors)
- 429: Rate limited (include Retry-After header)
- 500: Server error (never expose stack traces)

### Request/Response Design
- Use JSON; set Content-Type: application/json
- Consistent error format:
  \`\`\`json
  { "error": "INVALID_EMAIL", "message": "Email is not valid", "field": "email" }
  \`\`\`
- Consistent success format (decide on envelope vs. no envelope and stick to it)
- Pagination: use cursor-based for large datasets; limit/offset for small
- Filtering: GET /posts?status=published&author=123
- Sorting: GET /posts?sort=created_at:desc

### Versioning
- URL versioning: /v1/users (simplest, most common)
- Header versioning: Accept: application/vnd.api+json;version=1
- Never break existing API consumers — add, don't remove

## Security
- Authenticate every request (JWT, API key, OAuth)
- Rate limiting on all endpoints (especially auth and public endpoints)
- Input validation on every field (type, length, format)
- Never return more data than needed (follow principle of least privilege)
- Use HTTPS everywhere; reject HTTP
- Log all API access with user ID and resource accessed

## Performance
- Pagination: never return unbounded collections
- Field selection: allow clients to request only needed fields
- Caching: set Cache-Control headers; use ETags for conditional requests
- Compression: gzip responses > 1KB
- Connection pooling: essential for database connections (PgBouncer for Postgres)

## Documentation
Every API must have:
- OpenAPI / Swagger spec (auto-generate where possible)
- Authentication explanation
- Rate limit information
- Error codes and meanings
- Changelog
- Examples for every endpoint
`
},

// ══════════════════════════════════════════════════════
// BINKY — PhD IN RESEARCH + ONLINE SEARCH
// ══════════════════════════════════════════════════════

{
slug: "binky-research-methodology",
title: "Binky: Research Methodology and Online Intelligence",
tags: ["binky", "research", "phd-research", "competitive-intelligence"],
body: `# Binky: Research Methodology and Online Intelligence

## Binky's Research Mandate
Binky is the Chief Research Officer. Her role is to surface insights, trends, and intelligence from public sources to inform strategy, content, campaigns, and competitive positioning.

## Primary Research Framework

### OSINT (Open Source Intelligence)
Systematically collect and analyze publicly available information.

**Tier 1 — Direct Sources:**
- Company websites, press rooms, changelogs
- LinkedIn company pages (headcount, job postings, executive changes)
- SEC filings (for public companies: 10-K, 10-Q, 8-K)
- Patent filings (signals future product direction)
- GitHub repositories (open source activity, tech stack signals)

**Tier 2 — Aggregated Sources:**
- Crunchbase, PitchBook (funding, valuations, investors)
- G2, Capterra, Trustpilot (product reviews — read 3-stars)
- SimilarWeb, SEMrush (traffic, SEO keywords, advertising)
- ProductHunt (new product launches)
- Glassdoor (culture, compensation benchmarks, leadership scores)

**Tier 3 — Social/Community:**
- Reddit (authentic user discussions, complaints, praises)
- Twitter/X, LinkedIn (thought leadership, announcements)
- Discord/Slack communities (developer and user communities)
- YouTube (product demos, conference talks)
- Hacker News (Show HN posts, developer sentiment)

## Research Question Framework

### Before Searching, Define:
1. **What decision does this research inform?**
2. **What would change our direction if we knew it?**
3. **What's the simplest way to get this answer?**
4. **How confident do we need to be? (Quick sense-check vs. strategic bet)**

### Research Types

**Exploratory Research:** Open-ended; understand a landscape
- "What are the trends in AI-powered HR tools?"
- Method: broad searches, Reddit, LinkedIn, industry reports

**Confirmatory Research:** Test a hypothesis
- "Is our assumption that SMBs prefer self-serve correct?"
- Method: customer interviews, surveys, competitor analysis

**Competitive Research:** Understand specific competitors
- "What are Competitor X's top 5 weaknesses per user reviews?"
- Method: G2 reviews, win/loss data, job postings analysis

**Trend Research:** Identify emerging patterns
- "What topics are gaining momentum in our industry?"
- Method: Google Trends, BuzzSumo, industry newsletters, conference agendas

## Search Techniques

### Boolean Search Operators
- AND: narrows results (AI AND recruiting)
- OR: broadens (startup OR scaleup)
- NOT: excludes (marketing NOT email)
- Quotes: exact phrase ("customer acquisition cost")
- Site: limits to domain (site:reddit.com Salesforce alternatives)
- Filetype: (filetype:pdf HR compensation survey 2025)
- Wildcard: (best * for small business)

### Advanced Google Techniques
- \`related:competitor.com\` — find similar websites
- \`cache:url\` — see cached version
- \`intitle:keyword\` — keyword must appear in title
- \`inurl:keyword\` — keyword in URL
- Date filter: Tools → Any time → Custom range

## Synthesizing Research

### The BLUF Method (Bottom Line Up Front)
Lead with the conclusion, then support:
1. **Finding:** One-sentence summary of what you found
2. **Evidence:** 2-3 supporting data points
3. **Implication:** What this means for the business
4. **Recommended action:** What to do about it

### Research Confidence Levels
- **High:** Multiple independent sources corroborate; primary data exists
- **Medium:** Indirect evidence; reasonable inference; 1-2 sources
- **Low:** Anecdotal; single source; unverified; speculation

Always label confidence level when sharing research findings.

## Content Ideas Research Workflow
1. Identify the audience and their top 3 pain points
2. Search Reddit, forums, Q&A sites for how they talk about the problem (use their language)
3. Find the top 10 ranking pieces of content for the core keyword (analyze gaps)
4. Check Google's "People Also Ask" for related questions
5. Review competitor blog/newsletter for coverage patterns
6. Draft angles that are differentiated from existing content
7. Validate with Google Trends (is interest growing or declining?)
`
},

{
slug: "binky-trend-analysis",
title: "Binky: Trend Analysis and Market Intelligence",
tags: ["binky", "research", "trends", "market-intelligence"],
body: `# Binky: Trend Analysis and Market Intelligence

## Trend Identification Framework

### Signal vs. Noise
Not every emerging topic is a trend. Distinguish:
- **Fads:** Short-lived spikes with no structural change (NFTs for most use cases)
- **Trends:** Multi-year directional shifts with structural drivers (AI in workflows)
- **Megatrends:** Decade-long fundamental shifts (remote work, aging population, climate)

**Test:** Does this trend have structural drivers (technology, demographics, regulation, economics) that make it self-sustaining?

### STEEP Analysis
Scan for trends across five environments:
- **S**ocial: Demographics, culture, values, behaviors
- **T**echnological: Innovation, disruption, adoption curves
- **E**conomic: GDP, inflation, employment, spending patterns
- **E**nvironmental: Climate, sustainability, resource scarcity
- **P**olitical/Legal: Regulation, policy, geopolitics

### Trend Sources

**Primary (most reliable signals):**
- Academic papers (Google Scholar, SSRN, arXiv for tech)
- Government reports (BLS, Census, FTC)
- Industry association reports (SHRM for HR, IDC for tech)
- Gartner Hype Cycle (technology maturity signals)
- McKinsey Global Institute, Deloitte Insights, PwC reports

**Secondary:**
- Trade publications (TechCrunch, Business Insider, Industry-specific)
- Newsletter aggregators (Morning Brew, TLDR, The Hustle)
- Conference agendas (what topics are featured?)
- VC investment patterns (a16z, Sequoia portfolio thesis)

**Tertiary (early signals):**
- Reddit (r/technology, r/entrepreneur, r/smallbusiness)
- Hacker News trending
- Twitter lists of industry analysts
- Product Hunt (what's being built)
- GitHub trending repositories

## Competitive Content Analysis

### Share of Voice
What % of online conversation about your topic/industry belongs to each player?
- Use tools: Brandwatch, Mention, Sprout Social
- Track: mentions, backlinks, social shares, search rankings

### Content Gap Analysis
1. List 10 topics core to your space
2. Map which competitors cover each topic
3. Identify topics where YOU have an advantage or they have gaps
4. Prioritize content that fills gaps AND aligns to your value prop

### SEO Competitive Intelligence
- SEMrush / Ahrefs: see competitors' top-ranking keywords
- Identify: keywords they rank for that you don't
- Identify: keywords you both target but they outrank you
- Identify: their highest-traffic content (what's working?)

## Market Sizing

### TAM / SAM / SOM
- **TAM (Total Addressable Market):** Everyone who could buy this type of product
- **SAM (Serviceable Addressable Market):** TAM filtered to segments you can actually serve
- **SOM (Serviceable Obtainable Market):** Realistic near-term capture (usually 1-3% of SAM initially)

### Bottom-Up Sizing (preferred)
Count actual potential buyers × average contract value
- Example: 500K US SMBs with 10-50 employees × $1,200/year ACV = $600M SAM

### Top-Down Sizing (as cross-check)
Start with industry report total market size → apply relevant filters

**Always show your math.** Investors and executives distrust market sizing that isn't derived from explicit assumptions.

## Delivering Research to Stakeholders

### Research Brief Template
**For:** [Audience]
**Question:** [Specific research question]
**Answer:** [1-2 sentence answer]
**Confidence:** High / Medium / Low
**Key findings:**
1. [Finding + source]
2. [Finding + source]
3. [Finding + source]
**Implications:**
- [What this means for X decision/strategy]
**Recommended next steps:**
- [Specific action]
**Sources:** [Numbered list]
`
},

// ══════════════════════════════════════════════════════
// APP FIXES — AUDIT KNOWLEDGE
// ══════════════════════════════════════════════════════

{
slug: "atlas-app-fixes-roadmap",
title: "Atlas UX — Known Issues and Fix Roadmap",
tags: ["internal", "engineering", "roadmap", "fixes"],
body: `# Atlas UX — Known Issues and Fix Roadmap

## Status Key
- 🔴 Broken (no functionality)
- 🟡 Partial (works but incomplete)
- 🟢 Working
- ✅ Fixed

## Feature Status

### 🔴 CRM — No Backend
- Component: CRM.tsx
- Issue: All data is local state only. No /v1/crm/* routes exist. Data lost on refresh.
- Fix needed: Create crmRoutes.ts with CRUD for contacts and companies. Add route to server.ts.
- Data model: contacts (id, tenantId, name, email, phone, company, tags, notes, createdAt)

### 🔴 Chat Interface — Platform Selection Not Wired
- Component: ChatInterface.tsx
- Issue: UI shows platform selector (GPT-4, Claude, DeepSeek) but handleSend() ignores it. Always uses default provider.
- Issue: Voice recognition is a 3-second stub with fake text injection.
- Fix needed: Pass selected provider and model to POST /v1/chat/. Wire real browser speech-to-text API (SpeechRecognition).

### 🟡 Social Monitoring — Stub Only
- Component: SocialMonitoring.tsx
- Issue: "Start Listening" just queues a job; no background worker actually polls social APIs.
- Metrics are hardcoded zeros.
- Fix needed: Background worker that polls Twitter/X, LinkedIn, Reddit APIs and stores mentions in DB. Add /v1/listening/mentions endpoint.

### 🟡 Analytics Dashboard — No Data
- Component: Analytics.tsx
- Issue: All metrics are hardcoded "0". No analytics fetch endpoint exists.
- Fix needed: Aggregation routes per platform (/v1/analytics/google, /v1/analytics/stripe, etc.) using connected OAuth tokens.

### 🟡 Task Automation / Workflows — Generic Job Queue Only
- Component: TaskAutomation.tsx
- Issue: Creates a generic job with jobType="WORKFLOW". No step orchestration, no scheduling, no conditional logic.
- Fix needed: Workflow engine with steps, conditions, and cron scheduling.

### 🟡 Messaging Hub — Partial
- Telegram: Works if BOTFATHERTOKEN set. Bot must be started by users first (can't initiate DMs).
- Email: Queues jobs; email worker must be running on Render.
- SMS: Stub only. Needs Twilio API key and implementation.

### 🟡 Decisions Inbox — Growth Loop Missing
- Component: DecisionsInbox.tsx
- Issue: "Run Growth Loop Now" calls /v1/growth/run which is a stub.
- Fix needed: Implement growth loop logic that surfaces next best action based on business data.

### 🟡 Job Runner — No Workers
- Jobs are queued in DB but nothing processes them.
- Email worker is configured and running on Render ✅
- Other job types (SOCIAL_POST, WORKFLOW, etc.) have no workers.

## Fixed Issues ✅
- OPENAI_API_KEY missing from Render → fixed (all 94 env vars uploaded)
- Blog posts not appearing on public blog → fixed (backend returns all published posts; frontend fetches from API)
- Asset saving (Add New Asset) → fixed (x-tenant-id header added to createAsset/updateAsset/deleteAsset)
- Prisma multiple instances → fixed (all routes use single db/prisma.ts singleton)
- listeningRoutes audit log crash → fixed (corrected field names: meta, entityType, entityId, timestamp)
- AgentsHub white theme → fixed (dark slate/cyan theme)
- Emails stuck in queue → fixed (OUTBOUND_EMAIL_PROVIDER=microsoft; MS credentials configured)
- Tenant ID not carried across pages → fixed (useActiveTenant() hook used throughout)

## Priority Order for Next Fixes
1. CRM backend (highest user impact — data being lost)
2. Chat platform selection (core feature, easy fix)
3. Analytics data endpoint (needed for real business value)
4. Social monitoring worker (significant feature gap)
5. SMS via Twilio (messaging completeness)
`
},

];

// ─── Seed function ────────────────────────────────────────────────────────────

async function seed() {
  console.log(`Seeding ${DOCS.length} knowledge documents into tenant ${TENANT_ID}...`);
  let created = 0, updated = 0;

  for (const doc of DOCS) {
    // Upsert tags
    const tagIds: string[] = [];
    for (const tagName of doc.tags) {
      const tag = await prisma.kbTag.upsert({
        where: { tenantId_name: { tenantId: TENANT_ID, name: tagName } },
        create: { tenantId: TENANT_ID, name: tagName },
        update: {},
      });
      tagIds.push(tag.id);
    }

    // Check if doc exists
    const existing = await prisma.kbDocument.findFirst({
      where: { tenantId: TENANT_ID, slug: doc.slug },
    });

    if (existing) {
      await prisma.kbDocument.update({
        where: { id: existing.id },
        data: {
          title: doc.title,
          body: doc.body,
          status: KbDocumentStatus.published,
          updatedBy: CREATED_BY,
          tags: {
            deleteMany: {},
            create: tagIds.map(tagId => ({ tagId })),
          },
        },
      });
      updated++;
      process.stdout.write(`  updated: ${doc.slug}\n`);
    } else {
      await prisma.kbDocument.create({
        data: {
          tenantId: TENANT_ID,
          title: doc.title,
          slug: doc.slug,
          body: doc.body,
          status: KbDocumentStatus.published,
          createdBy: CREATED_BY,
          updatedBy: CREATED_BY,
          tags: {
            create: tagIds.map(tagId => ({ tagId })),
          },
        },
      });
      created++;
      process.stdout.write(`  created: ${doc.slug}\n`);
    }
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Total: ${DOCS.length}`);
  await prisma.$disconnect();
}

seed().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
