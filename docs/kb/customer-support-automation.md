# Customer Support Automation

Cheryl's operational manual for handling customer inquiries, escalating issues, tracking satisfaction, and maintaining service quality within Atlas UX's governance framework.

---

## Escalation Tiers

Customer support is structured into four tiers. Each tier has clear handling rules, response time targets, and escalation criteria. The goal is to resolve as many issues as possible at the lowest tier while ensuring complex problems reach the right handler quickly.

### Tier 0: Auto-Response

**What it handles:** Common questions with known, static answers. No human or agent judgment required.

**Examples:**
- "What are your business hours?"
- "How do I reset my password?"
- "Where is my order?"
- "What is your refund policy?"
- "How do I contact support?"

**Mechanism:** Knowledge base self-serve. FAQ matching against indexed documentation. Instant response with relevant article link and direct answer.

**Response Time Target:** Immediate (under 5 seconds).

**Escalation Trigger:** Customer indicates the auto-response did not answer their question, or the system confidence score is below 70%.

### Tier 1: Cheryl Handles

**What it handles:** Issues requiring judgment, personalization, or access to account-specific data. Cheryl can resolve these autonomously.

**Examples:**
- Account-specific billing questions ("Why was I charged $X?").
- Service configuration help ("How do I set up integration Y?").
- Order modifications (address change, add/remove items).
- Simple complaints (late delivery, minor product issues).
- Feature explanations and how-to guidance.
- Follow-up on previous interactions.

**Response Time Target:** Under 15 minutes during business hours. Under 2 hours outside business hours.

**Resolution Target:** 80% of Tier 1 issues resolved in a single interaction.

**Escalation Trigger:** Issue involves financial decisions above Cheryl's authority, legal implications, or the customer explicitly requests human assistance.

### Tier 2: Escalate to Human

**What it handles:** Complex issues that require human judgment, empathy for sensitive situations, or authority to make exceptions outside standard policy.

**Examples:**
- Refund requests above auto-approval threshold.
- Customer threatening legal action.
- Data privacy requests (deletion, export).
- Service outage affecting the customer's business.
- Repeated complaints (third+ contact about same issue).
- Account cancellation with retention opportunity.

**Response Time Target:** Under 1 hour during business hours.

**Cheryl's Role at Tier 2:**
1. Compile full interaction history.
2. Summarize the issue and previous resolution attempts.
3. Recommend a resolution approach.
4. Route to the appropriate human with the complete context package.
5. Follow up after human resolution to ensure customer satisfaction.

### Tier 3: Executive Escalation

**What it handles:** Critical issues that affect business reputation, involve significant financial exposure, or require C-level decision-making.

**Examples:**
- Public complaint on social media with viral potential.
- Security breach affecting customer data.
- Legal demand letter or regulatory inquiry.
- Customer representing significant revenue (top 10% of accounts) threatening departure.
- Press inquiry about a customer-related issue.

**Response Time Target:** Under 30 minutes. All hands on deck.

**Escalation Path:** Cheryl notifies Atlas immediately. Atlas creates a decision memo. Jenny (Legal) is looped in if legal implications exist. Tina is looped in if financial exposure exceeds thresholds.

---

## Response Templates

### Acknowledgment

```
Hi [Name],

Thank you for reaching out. I've received your message about [brief issue summary]
and I'm looking into it now.

I'll have an update for you within [timeframe based on tier].

Best,
Cheryl — Atlas UX Support
```

### Resolution

```
Hi [Name],

Good news — I've resolved the issue with [brief description].

Here's what happened: [clear explanation].
Here's what I did: [action taken].
Here's what to expect: [next steps or confirmation].

If anything else comes up, I'm here to help.

Best,
Cheryl — Atlas UX Support
```

### Escalation Notification (to customer)

```
Hi [Name],

I want to make sure this gets the attention it deserves, so I've escalated your
request to our team lead who has the authority to [resolve/approve/review] this.

You'll hear from them within [timeframe]. In the meantime, everything you've
shared with me has been passed along so you won't need to repeat yourself.

Best,
Cheryl — Atlas UX Support
```

### Escalation Handoff (internal)

```
ESCALATION — Tier [2/3]

Customer: [Name, Account ID]
Issue: [One-sentence summary]
Severity: [Low/Medium/High/Critical]
Contact Count: [Number of interactions about this issue]
Timeline: [When issue first reported, how long unresolved]

Summary: [2-3 sentences of context]

Previous Actions: [What has been tried]
Recommended Resolution: [Cheryl's suggested approach]

Full History: [Link to interaction log]
```

---

## Satisfaction Tracking

### CSAT (Customer Satisfaction Score)

**Collection Method:** Post-resolution survey. "How satisfied were you with your support experience?" (1-5 scale).

**Targets:**
- Overall CSAT: Above 4.2 / 5.0.
- Tier 0 CSAT: Above 3.8 (lower bar because auto-responses feel impersonal).
- Tier 1 CSAT: Above 4.3.
- Tier 2 CSAT: Above 4.0 (complex issues lower satisfaction even when resolved).

**Reporting:** Cheryl reports CSAT weekly to Atlas. Daily-Intel includes CSAT trend in morning briefing.

### NPS (Net Promoter Score)

**Collection Method:** Quarterly survey. "How likely are you to recommend us? (0-10)."

**Calculation:** % Promoters (9-10) minus % Detractors (0-6).

**Targets:**
- NPS above 40 is good.
- NPS above 60 is excellent.
- NPS below 20 triggers strategic review by Binky and Atlas.

### Response Time Metrics

| Metric | Target | Red Flag |
|--------|--------|----------|
| First Response Time (Tier 0) | Under 5 seconds | Over 30 seconds |
| First Response Time (Tier 1) | Under 15 minutes | Over 1 hour |
| First Response Time (Tier 2) | Under 1 hour | Over 4 hours |
| First Response Time (Tier 3) | Under 30 minutes | Over 2 hours |
| Average Resolution Time | Under 4 hours | Over 24 hours |
| First Contact Resolution Rate | Above 70% | Below 50% |

---

## Knowledge Base Self-Serve

Cheryl maintains the support knowledge base to deflect common inquiries to Tier 0.

**Maintenance Cadence:**
- **Weekly:** Review Tier 1 tickets for patterns. If the same question appears 3+ times in a week, create a KB article and add it to Tier 0 auto-responses.
- **Monthly:** Audit existing KB articles for accuracy. Update screenshots, links, and procedures.
- **Quarterly:** Review KB analytics. Archive articles with zero views in 90 days. Promote high-traffic articles to more prominent positions.

**Article Quality Standards:**
- Title matches how customers phrase the question (not internal jargon).
- Answer appears in the first paragraph (do not bury the answer).
- Step-by-step instructions include numbered steps.
- Each article has a "Still need help?" CTA that routes to Tier 1.

---

## Proactive Support

Cheryl does not only react to problems. Proactive support prevents issues before they become tickets.

**Proactive Actions:**
1. **Onboarding check-in:** 3 days after signup, Cheryl sends a "How's it going?" message with quick-start tips.
2. **Usage drop detection:** If a customer's activity drops 50%+ week over week, Cheryl reaches out.
3. **Renewal reminder:** 30 days before subscription renewal, Cheryl confirms satisfaction and addresses concerns.
4. **Feature announcement:** When new features launch, Cheryl notifies customers who requested them.
5. **Post-incident follow-up:** After any service disruption, Cheryl proactively contacts affected customers.

---

## Governance and Audit

Every support interaction is logged to the audit trail:

- Timestamp, channel, customer identifier, issue category.
- Tier classification and any tier changes.
- Actions taken and resolution outcome.
- CSAT response if provided.
- Escalation details if applicable.

Larry audits support logs weekly for compliance. Jenny reviews any interaction where legal topics are mentioned. Tina reviews any interaction involving refunds or financial adjustments.

All support actions are subject to the platform's safety guardrails. Cheryl cannot issue refunds above the auto-spend limit without a decision memo approved by Atlas or the business owner.
