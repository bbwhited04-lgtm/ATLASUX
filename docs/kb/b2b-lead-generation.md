# B2B Lead Generation with AI

Mercer's operational playbook for running autonomous B2B outreach. Covers prospecting, qualification, sequencing, pipeline management, and follow-up automation within Atlas UX's governance framework.

---

## Pipeline Stages

Every lead moves through a defined pipeline. Agents must track stage transitions and never skip stages.

### Stage 1: Prospect

**Definition:** Identified as a potential fit but no outreach has been made.

**Entry Criteria:** Matches ideal customer profile (ICP) on at least 3 of 5 dimensions: industry, company size, tech stack, pain point indicators, geography.

**Actions:**
- Archy researches the prospect's business, recent news, tech stack, and decision-makers.
- Daily-Intel checks for timing signals (funding rounds, leadership changes, product launches, hiring surges).
- Mercer adds to outreach queue.

**Exit Criteria:** First outreach sent.

### Stage 2: Contacted

**Definition:** Initial outreach has been sent. Awaiting response.

**Actions:**
- Mercer sends initial outreach (email or LinkedIn message).
- If no response after 3 business days, Mercer sends follow-up #1.
- If no response after 7 business days, Mercer sends follow-up #2 with different angle.
- If no response after 14 business days, Mercer sends breakup email and moves to nurture list.

**Exit Criteria:** Prospect responds (positive or negative) or exhausts follow-up sequence.

### Stage 3: Qualified

**Definition:** Prospect has responded positively and confirmed a relevant need.

**Qualification Criteria (BANT framework):**
- **Budget:** Can they afford the solution?
- **Authority:** Are we talking to the decision-maker?
- **Need:** Do they have a problem we solve?
- **Timeline:** Are they looking to solve it within 90 days?

Minimum 3 of 4 BANT criteria must be confirmed to advance.

**Actions:**
- Sandy schedules a discovery call.
- Archy prepares a prospect brief with company background, competitive landscape, and relevant case studies.
- Mercer sends pre-call materials.

**Exit Criteria:** Discovery call completed and need confirmed.

### Stage 4: Engaged

**Definition:** Active sales conversation in progress. Prospect has expressed interest and is evaluating the solution.

**Actions:**
- Sunday prepares custom content addressing their specific pain points.
- Binky identifies upsell and cross-sell opportunities.
- Cheryl provides responsive support if the prospect has technical questions.
- Petra tracks the deal timeline and flags if it stalls.

**Exit Criteria:** Proposal requested or prospect disengages.

### Stage 5: Proposal

**Definition:** Formal proposal has been sent. Awaiting decision.

**Actions:**
- Sunday drafts the proposal document.
- Tina reviews pricing and ensures margin targets are met.
- Jenny reviews contract terms if custom terms are requested.
- Mercer follows up at 3-day and 7-day intervals.

**Exit Criteria:** Deal won or lost.

### Stage 6: Closed Won

**Actions:**
- Tina sets up billing and revenue tracking.
- Cheryl sends onboarding sequence.
- Petra creates the client project.
- Larry logs the deal in the audit trail.
- Mercer adds to referral request queue (30 days post-close).

### Stage 6 (alt): Closed Lost

**Actions:**
- Mercer records loss reason (price, timing, competitor, no decision).
- Prospect moves to nurture list for future outreach (quarterly check-ins).
- Daily-Intel monitors for re-engagement signals.

---

## Lead Scoring Model

Mercer scores every prospect on a 0-100 scale. Leads above 60 get prioritized for outreach. Leads above 80 get immediate attention.

| Signal | Points |
|--------|--------|
| Matches ICP industry | +15 |
| Company size in target range | +10 |
| Decision-maker identified | +15 |
| Recent funding round | +10 |
| Hiring for relevant roles | +10 |
| Visited website or engaged with content | +15 |
| Responded to outreach | +20 |
| Requested demo or meeting | +25 |
| Competitor mentioned as current solution | +10 |
| Negative signals (layoffs, bankruptcy, recent purchase of competitor) | -20 |

---

## Outreach Templates

### Cold Email — Initial Contact

**Subject line:** Keep it under 6 words. Personalized to their industry or recent event. Never use "Quick question" or "Touching base."

**Body structure:**
1. One sentence about them (not about you).
2. One sentence about the problem you solve.
3. One sentence about how you solve it differently.
4. Clear CTA: "Worth a 15-minute call this week?"

**Length:** Under 120 words. Mobile-optimized.

### LinkedIn Message — Connection Request

Note: Must include a personalized connection message. Generic requests have 30% lower acceptance rates.

**Structure:**
1. Reference something specific about their profile or recent post.
2. State why connecting makes sense (shared industry, mutual connection, relevant insight).
3. No selling in the connection request. Sell after they accept.

### Follow-Up Email #1 (Day 3)

**Structure:**
1. Reference the previous email briefly.
2. Add new value (article, insight, case study relevant to their industry).
3. Softer CTA: "Happy to share more if this is relevant."

### Follow-Up Email #2 (Day 7)

**Structure:**
1. Different angle — approach the problem from a new direction.
2. Include a specific data point or result relevant to their situation.
3. Direct CTA: "Should I close the loop on this, or is the timing off?"

### Breakup Email (Day 14)

**Structure:**
1. Acknowledge they are busy.
2. Summarize the value proposition in one sentence.
3. Leave the door open: "If this becomes relevant down the road, I'm here."
4. No guilt, no pressure.

---

## Channel Strategy

### LinkedIn

Primary B2B channel. Mercer operates through the configured LinkedIn integration.

- **Connection requests:** 20-25 per day maximum (platform limits).
- **Post engagement:** Comment on prospects' posts before connecting (warms the outreach).
- **Content sharing:** Link republishes thought leadership content that attracts inbound connections.

### Cold Email

Secondary channel. Always follows CAN-SPAM and GDPR requirements.

- **Volume:** 50-75 emails per day per sender address, across sequences.
- **Warmup:** New sender addresses need 2 weeks of warmup before full volume.
- **Deliverability:** Monitor open rates. Below 20% signals deliverability issues.

### Referral Program

Highest conversion channel. Mercer requests referrals from happy customers 30 days after close.

- Referred leads convert 3-5x higher than cold outreach.
- Referred leads have 16% higher LTV.
- Mercer tracks referral source for attribution.

---

## Governance and Safety

All outreach operates within Atlas UX's governance framework:

- **Daily action cap:** Total outreach actions per day are limited by MAX_ACTIONS_PER_DAY.
- **Spend limits:** Any paid outreach (ads, sponsored InMail) above AUTO_SPEND_LIMIT_USD requires decision memo approval.
- **Audit trail:** Every outreach action is logged to the audit trail with timestamp, channel, recipient, and content.
- **Opt-out compliance:** Unsubscribe requests are processed immediately and permanently.
- **Data handling:** Prospect data is tenant-scoped and never shared across organizations.

---

## Metrics and Reporting

Mercer reports to Binky on these KPIs weekly:

| Metric | Target |
|--------|--------|
| Outreach volume | 200-300 touches/week |
| Response rate | Above 15% |
| Qualified rate | Above 5% of outreach |
| Pipeline value | Growing week-over-week |
| Close rate | Above 20% of proposals |
| Average deal cycle | Under 30 days |
| CAC by channel | Declining quarter-over-quarter |

Daily-Intel includes pipeline health in the morning briefing for Atlas.
