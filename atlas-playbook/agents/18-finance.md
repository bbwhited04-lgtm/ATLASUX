# Agent 18: Finance

## Role
Model Atlas UX's unit economics, validate pricing, project revenue, and determine
when/if to raise funding. Every number grounded in reality, not fantasy.

## Atlas UX Financial Context
- Solo founder, bootstrapped
- Revenue: $0 (pre-revenue as of March 2026)
- Recent spend: $520 (Scooter licensing $320 + Windows key $200)
- Infrastructure: Vercel (frontend), Render (backend), Supabase (DB)
- Telephony: cost per minute varies by provider
- AI: per-token costs for LLM inference (Claude/OpenAI)

## 1. Unit Economics

```
REVENUE PER CUSTOMER (monthly):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Tier | Price | % of customers (est.) | Weighted Rev |
|------|-------|----------------------|-------------|
| Limited ($39) | $39 | 15% | $5.85 |
| Standalone ($99) | $99 | 50% | $49.50 |
| Business ($149) | $149 | 20% | $29.80 |
| Standalone Business ($249) | $249 | 10% | $24.90 |
| Enterprise ($40/seat) | ~$200 | 5% | $10.00 |
| **Blended ARPU** | | | **~$120/mo** |

COST PER CUSTOMER (monthly):
━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Cost Item | Estimate | Notes |
|-----------|----------|-------|
| Telephony (minutes) | $15-40 | ~200 calls/mo × $0.08-0.20/min |
| AI/LLM (tokens) | $10-25 | Per-call inference cost |
| TTS (text-to-speech) | $5-10 | Depends on provider |
| STT (speech-to-text) | $5-10 | Depends on provider |
| Infrastructure share | $2-5 | Render + Supabase + Vercel ÷ customers |
| Stripe fees | $3.60 | 2.9% + $0.30 on $120 |
| **Total COGS** | **$40-93** | **Varies by call volume** |

GROSS MARGIN:
- Best case: $120 - $40 = $80 (67%)
- Worst case: $120 - $93 = $27 (23%)
- Target: > 60% gross margin
- CRITICAL: Track actual cost per call from Day 1

⚠️ WARNING: HIGH-CALL-VOLUME CUSTOMERS
A plumber getting 400 calls/month could cost $80-160 in telephony + AI alone.
At $99/mo, that's a money-losing customer.

OPTIONS:
a) Usage caps per tier (e.g., 200 calls/mo on Standalone, overage at $0.25/call)
b) All tiers are truly unlimited but price accounts for heavy users
c) Identify heavy users early and upsell to Business/Enterprise tier
d) Optimize AI costs: cache common responses, shorter prompts, cheaper models for simple calls
```

## 2. Monthly Burn Rate

```
CURRENT FIXED COSTS (estimate):
| Item | Monthly | Notes |
|------|---------|-------|
| Render (backend) | $25 | Starter plan |
| Supabase | $25 | Pro plan |
| Vercel | $20 | Pro plan |
| Telephony (base) | $20 | Phone numbers + base fees |
| Domain/DNS | $5 | atlasux.cloud |
| Stripe | $0 | Only charges on revenue |
| AI API keys | $10 | Development/testing usage |
| Tools/subscriptions | $30 | Various dev tools |
| **Total fixed** | **~$135/mo** | **Before any customers** |

VARIABLE COSTS: Scale with customers (see COGS above)

BREAK-EVEN:
At ~$120 ARPU and ~60% gross margin = ~$72 gross profit per customer
$135 fixed costs ÷ $72 = 2 customers to cover fixed costs
10 customers = $720 gross profit/mo — covers costs + some income
50 customers = $3,600 gross profit/mo — sustainable solo founder income
200 customers = $14,400 gross profit/mo — hire first person
```

## 3. Revenue Projections

```
CONSERVATIVE SCENARIO (10% monthly growth after initial 10):
| Month | Customers | MRR | Gross Profit | Cumulative |
|-------|-----------|-----|-------------|------------|
| 1 | 10 | $1,200 | $720 | $720 |
| 3 | 15 | $1,800 | $1,080 | $3,600 |
| 6 | 30 | $3,600 | $2,160 | $12,000 |
| 9 | 50 | $6,000 | $3,600 | $24,000 |
| 12 | 80 | $9,600 | $5,760 | $55,000 |

AGGRESSIVE SCENARIO (20% monthly growth):
| Month | Customers | MRR | Gross Profit | Cumulative |
|-------|-----------|-----|-------------|------------|
| 1 | 10 | $1,200 | $720 | $720 |
| 3 | 20 | $2,400 | $1,440 | $4,800 |
| 6 | 50 | $6,000 | $3,600 | $18,000 |
| 9 | 100 | $12,000 | $7,200 | $50,000 |
| 12 | 200 | $24,000 | $14,400 | $130,000 |

ARR AT MONTH 12:
Conservative: ~$115K
Aggressive: ~$288K
```

## 4. Pricing Validation

```
QUESTIONS TO ANSWER:
1. Is the $39 Limited tier worth keeping?
   - No Lucy/Mercer → what's the value? Just SlackWorker?
   - If nobody buys it, kill it — it clutters the pricing page
   - If it's a foot-in-the-door tier, make the upgrade path crystal clear

2. Should there be a free trial?
   - YES. 14 days, no credit card required.
   - Trade owners won't pay before trying
   - The product sells itself once they hear Lucy catch a real call
   - Risk: free trial abuse → mitigate with phone number verification

3. Should annual pricing be offered?
   - Yes: 2 months free on annual ($990/yr vs $1,188)
   - Benefit: cash up front, lower churn (commitment)
   - Don't push it early — monthly is fine for first 50 customers

4. Is $99 the right price for Standalone?
   - Compare: Smith.ai starts at $200, Ruby at $230
   - $99 is aggressive — good for market entry
   - Room to raise to $129 after you have testimonials + traction
   - Never compete on being cheapest — compete on value

5. What's the difference between Business ($149) and Standalone Business ($249)?
   - If customers can't explain the difference, simplify
   - Consider: Standard ($99) / Team ($149 for 5 seats) / Enterprise ($40/seat)
   - Three tiers is easier to sell than six
```

## 5. Fundraising Readiness

```
DON'T RAISE YET. HERE'S WHEN TO CONSIDER IT:

MILESTONES THAT MAKE YOU FUNDABLE:
□ 50+ paying customers
□ < 5% monthly churn
□ Clear unit economics (> 50% gross margin)
□ Repeatable acquisition channel (Mercer + content working)
□ $5K+ MRR

WHAT YOU'D RAISE:
- Pre-seed: $100K-$250K at $1M-$2M valuation
- Use of funds: First hire (support/sales), marketing budget, infra scaling
- From: Angels, trade-industry investors, micro-VCs

BOOTSTRAP UNTIL THEN:
- Your fixed costs are ~$135/mo — you can survive on minimal income
- First 50 customers = ~$3,600/mo gross profit — livable for solo founder
- Don't take money until you KNOW what you'd spend it on
```

## 6. Financial Dashboard (Track Weekly)

```
□ MRR (monthly recurring revenue)
□ Customer count by tier
□ ARPU (average revenue per user)
□ Gross margin % (revenue - COGS)
□ Cost per call (average across all customers)
□ CAC (cost to acquire a customer — mostly time-based for now)
□ LTV (revenue per customer × average lifetime — estimate after 3 months of data)
□ Churn rate (monthly)
□ Cash balance / runway
```

## Output: Financial Model
Unit economics | Monthly burn | Revenue projections (2 scenarios) |
Pricing recommendations | Break-even analysis | Fundraising timeline
