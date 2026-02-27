# The TINY CRABS Prompt Engineering Framework

## Purpose

TINY CRABS is the definitive prompt engineering methodology for Atlas UX agents. It transforms vague instructions into surgically precise prompts that consistently produce elite-quality AI output. Every agent in the roster should internalize this framework and apply it when constructing prompts for their AI tasks — whether generating content, performing analysis, making recommendations, or communicating with users.

The difference between a mediocre prompt and a TINY CRABS prompt is the difference between a junior employee who needs constant supervision and a senior executive who delivers exactly what's needed on the first attempt.

---

## T — Task Definition

Be surgically specific about what you want. Define the deliverable, not the process.

### Principles

- State the WHAT, not the HOW. Let the AI determine the best approach.
- Include explicit success criteria: what does a successful output look like?
- Specify the scope: what's IN and what's OUT
- Define the deliverable format: report, email, analysis, recommendation, code, conversation

### Bad Task Definition

"Write something about our product."

### Good Task Definition

"Write a 1,200-word competitive analysis comparing Atlas UX's agent-based automation against three named competitors (Zapier, Make.com, and n8n). The deliverable is a structured report with an executive summary, per-competitor analysis, and a strategic recommendation. Success criteria: a reader with no prior context should understand Atlas UX's differentiated positioning after reading the executive summary alone."

### Agent Application

Atlas defines tasks for the entire organization. Task definitions that reach other agents should be TINY CRABS-compliant. If Petra assigns a task to Sunday, the task definition should include the deliverable, scope, success criteria, and format. Ambiguous task definitions produce ambiguous outputs, and the fault lies with the definer, not the executor.

---

## I — Identity/Role Assignment

Assign the AI a specific expert persona. This activates domain-appropriate vocabulary, reasoning patterns, and quality standards.

### Principles

- Specificity matters: "senior data scientist with 15 years of experience in B2B SaaS" activates more precise reasoning than "data analyst"
- Match the identity to the task domain
- Include experience level, specialty area, and relevant context
- The identity shapes the output's depth, vocabulary, and reasoning style

### Identity Library for Atlas UX Agents

| Agent | Default Identity |
|-------|-----------------|
| Atlas | Chief Executive Officer with deep expertise in AI-driven business strategy, organizational design, and autonomous operations |
| Binky | Chief Revenue Officer specializing in growth engineering, PLG (product-led growth), and B2B SaaS metrics optimization with expertise in multi-channel acquisition |
| Tina | Chief Financial Officer with expertise in SaaS financial modeling, unit economics, and risk-adjusted capital allocation for early-stage technology companies |
| Jenny | Chief Legal Officer specializing in technology law, data privacy (GDPR, CCPA), intellectual property, and SaaS contract negotiation |
| Cheryl | Head of Customer Success with 12 years of experience in SaaS support, specializing in proactive customer health monitoring and retention strategy |
| Sunday | Senior Communications Director and technical writer with expertise in B2B content strategy, SEO, and translating complex technical concepts for business audiences |
| Archy | Senior Research Analyst specializing in competitive intelligence, market analysis, and cross-domain analogical reasoning |
| Daily-Intel | Intelligence briefing officer providing concise, actionable daily summaries from multi-source signal monitoring |
| Petra | Senior Program Manager with PMP and Agile certifications, specializing in AI-augmented project orchestration and resource optimization |
| Mercer | Senior Business Development Executive specializing in strategic outreach, partnership formation, and channel development |

### When to Override the Default

If the task requires cross-domain expertise, composite identities work: "You are a financial analyst with deep understanding of content marketing ROI" for Tina analyzing Sunday's content investment returns. The composite identity bridges domains.

---

## N — Nuance & Constraints

Specify what to include AND what to exclude. Constraints are not limitations — they are quality controls.

### Constraint Categories

**Inclusion constraints**: Topics to cover, data to reference, perspectives to include, examples to provide

**Exclusion constraints**: Topics to avoid, jargon to skip, opinions to withhold, assumptions to not make

**Format constraints**: Word count range (not exact count — allow a 10% buffer), section structure, bullet vs. prose, technical depth level

**Tone constraints**: Formal/casual, optimistic/neutral/cautious, authoritative/collaborative, concise/comprehensive

**Audience constraints**: Technical level (engineer / business leader / general public), assumed knowledge, reading context (mobile / desktop / presentation)

**Edge case constraints**: "If data is insufficient, say so rather than speculating." "If multiple interpretations exist, present all of them." "If the question is ambiguous, state your interpretation before answering."

### Example

"Write a customer onboarding email. Tone: warm but professional, not overly casual. Include: value proposition recap, 3 quick-start steps, link to support. Exclude: pricing details, upsell language, technical jargon. Length: 150-200 words. Edge case: if the customer signed up for a free trial, adjust the value proposition to emphasize the trial period rather than the subscription."

---

## Y — Yield Format

Define the exact output structure. Structured output produces structured thinking.

### Format Options

- **JSON**: For machine-consumable output. Provide the schema.
- **Markdown**: For human-readable documents. Specify header hierarchy.
- **Table**: For comparisons. Specify columns and row structure.
- **Bullet list**: For actionable items. Specify depth (flat vs. nested).
- **Narrative prose**: For reports and communications. Specify section breaks.
- **Code**: For implementation. Specify language, commenting standards, and testing requirements.
- **Hybrid**: Combine formats. "Executive summary in prose, followed by a comparison table, followed by a bulleted action plan."

### Example

"Output format: Markdown with H2 headers for each competitor, H3 sub-headers for Strengths/Weaknesses/Opportunity, a summary comparison table at the end with columns [Feature | Atlas UX | Competitor A | Competitor B | Competitor C], and a final section titled 'Strategic Recommendation' in narrative prose, 2-3 paragraphs."

### Why This Matters

When the output format is undefined, the AI makes assumptions. Those assumptions may not match what the consumer of the output needs. Define the format explicitly and the AI organizes its thinking to match the structure, which improves reasoning quality as well as output quality.

---

## C — Context Provision

Give relevant background. The AI doesn't know what you know unless you tell it.

### Context Categories

**Business context**: Company stage, market position, competitive landscape, recent strategic decisions, current priorities

**Data context**: What data is available, what data is missing, data quality and recency, data source credibility

**Historical context**: What has been tried before, what worked, what failed, what changed since the last attempt

**Stakeholder context**: Who cares about this output, what are their concerns, what are their biases, what do they already believe

**Constraint context**: Budget, timeline, resource availability, regulatory constraints, technical limitations

**Meta-context**: Why this task matters now. What triggered it. What happens next based on the output.

### The Context Paradox

More context generally produces better output. But irrelevant context can distract and dilute. The discipline is providing the RIGHT context, not ALL context. Ask: "Would removing this context change the output? If no, remove it."

### Agent Application

When agents construct prompts that include context from the knowledge base, they should pull the most relevant KB entries and include them as context. The KB's existence is the context provision system at organizational scale.

---

## R — Reasoning Chain

Instruct step-by-step thinking. Chain-of-thought prompting improves output quality on complex tasks.

### Protocol

Define the reasoning sequence explicitly: "First analyze X, then evaluate Y, then compare Z, then recommend."

### Reasoning Chain Templates

**Analysis chain**: "1. Summarize the current state. 2. Identify the key factors driving the current state. 3. For each factor, assess whether it's improving, stable, or deteriorating. 4. Identify the factor with the highest leverage for improvement. 5. Recommend a specific action to address that factor."

**Decision chain**: "1. Define the decision to be made. 2. List all options. 3. For each option, identify pros, cons, risks, and expected outcomes. 4. Apply [specific decision framework]. 5. Recommend an option with explicit reasoning. 6. Identify what would change your recommendation."

**Creative chain**: "1. Understand the audience and their current mindset. 2. Define what shift in thinking or feeling the content should produce. 3. Identify the most compelling angle. 4. Generate 3 different approaches. 5. Select the strongest and develop it fully. 6. Self-critique and refine."

### Why Explicit Chains Matter

Without an explicit chain, the AI may skip steps, reason in an unhelpful order, or jump to conclusions. The chain is guardrails for reasoning. It doesn't constrain creativity — it ensures all necessary thinking happens before the conclusion is reached.

---

## A — Audience Awareness

Who will consume this output? The same information presented to a CEO, an engineer, and a customer should look dramatically different.

### Audience Dimensions

**Technical depth**: How much domain knowledge does the audience have? Adjust jargon, explanation depth, and assumed knowledge.

**Decision authority**: Is the audience the decision maker or an advisor? Decision makers need recommendations. Advisors need analysis.

**Time availability**: An executive scanning 50 emails needs a 3-sentence summary. A researcher doing deep analysis needs comprehensive detail. Match length to attention budget.

**Emotional state**: Is the audience optimistic, anxious, skeptical, angry? Tone should acknowledge the emotional context without being manipulative.

**Cultural context**: Communication norms vary across cultures, industries, and organizational levels. Formal vs. informal, direct vs. indirect, data-driven vs. narrative-driven.

### Agent-Audience Mapping

| Agent | Primary Audience | Calibration |
|-------|-----------------|-------------|
| Atlas | Board, executives | Strategic, concise, recommendation-oriented |
| Binky | Atlas, marketing team | Data-driven, growth-focused, metrics-heavy |
| Tina | Atlas, board, regulators | Precise, conservative, risk-aware |
| Cheryl | Customers | Empathetic, clear, jargon-free, action-oriented |
| Sunday | Public, prospects, users | Engaging, informative, SEO-aware, accessible |
| Archy | Atlas, domain agents | Comprehensive, evidence-based, nuanced |
| Petra | All agents | Clear, structured, actionable, deadline-aware |

---

## B — Benchmarking Criteria

Define quality standards so the output can be evaluated, not just generated.

### Benchmarking Techniques

**Confidence scoring**: "Rate your confidence in this analysis from 1-10 and explain what would increase your confidence."

**Source citation**: "Cite specific data points, KB entries, or external references for every factual claim."

**Assumption flagging**: "Explicitly list all assumptions made during this analysis."

**Comparison benchmarking**: "Compare this recommendation against industry benchmarks or best practices."

**Completeness check**: "After completing the analysis, list any important factors you did NOT address and explain why."

**Alternative consideration**: "Present the strongest counterargument to your recommendation."

### Why Benchmark

Without benchmarking criteria, there is no way to evaluate output quality objectively. "Is this good?" is unanswerable without a standard. "Does this meet criteria X, Y, and Z?" is answerable and actionable.

---

## S — Self-Correction Loop

Build in reflection. The first draft is never the best draft.

### Self-Correction Prompts

- "Review your output for logical errors, unsupported claims, and internal contradictions."
- "Identify the three weakest points in your analysis."
- "If you had access to one additional piece of information, what would it be and how would it change your output?"
- "Rewrite the executive summary assuming the reader disagrees with your conclusion. Is the evidence still compelling?"
- "What would a knowledgeable critic say about this output?"

### Implementation

Self-correction can be embedded in the prompt ("After your analysis, review it for errors and revise") or applied as a second pass (first prompt generates, second prompt critiques and revises). The two-pass approach generally produces higher quality because the critic operates from a different cognitive stance than the generator.

---

## Complete TINY CRABS Examples

### Example 1: Atlas Strategy Memo

**T**: Write a 1,500-word strategic memo evaluating whether Atlas UX should expand into the European market in Q3 2026. Deliverable: a board-ready memo with recommendation.
**I**: You are the CEO of a venture-backed AI SaaS company with experience in international expansion and regulatory compliance.
**N**: Include market sizing, regulatory considerations (GDPR), competitive landscape in EU, resource requirements. Exclude product roadmap details (separate doc). Tone: analytical and decisive, not speculative. Maximum 3 scenarios considered.
**Y**: Markdown. Sections: Executive Summary (200 words max), Market Opportunity, Regulatory Landscape, Competitive Analysis, Resource Requirements, Risk Assessment, Recommendation, Next Steps.
**C**: Atlas UX is a US-based AI employee platform. Current ARR: $X. Team size: Y. No EU entity exists. Primary competitors Z1, Z2 have EU presence. GDPR compliance is partially implemented.
**R**: 1. Size the EU market for AI employee platforms. 2. Assess regulatory barriers and compliance cost. 3. Analyze competitive positioning relative to EU incumbents. 4. Estimate resource requirements (legal, technical, operational). 5. Calculate expected ROI under 3 scenarios. 6. Recommend Go/No-Go with conditions.
**A**: Board of directors. They want strategic clarity, not technical detail. They'll read the executive summary first and only dive deeper if the summary warrants it.
**B**: Confidence level 1-10 for each scenario. Flag all assumptions. Compare to at least one case study of a similar company's EU expansion.
**S**: After drafting, identify the strongest argument AGAINST your recommendation and address it explicitly.

### Example 2: Binky Growth Analysis

**T**: Analyze last month's acquisition funnel performance and identify the single highest-leverage optimization opportunity. Deliverable: a 1-page analysis with one specific, actionable recommendation.
**I**: You are a growth engineering lead who has scaled three B2B SaaS companies from $1M to $10M ARR.
**N**: Include: conversion rates at each funnel stage, comparison to prior month and 3-month average, cohort analysis if relevant. Exclude: vanity metrics (page views without conversion context), unactionable observations. Tone: direct, quantitative, no hedging.
**Y**: Sections: Funnel Summary Table | Key Finding | Root Cause Analysis | Recommendation | Expected Impact | Risk.
**C**: [Insert last month's funnel data]. Primary channels: organic search, paid social, referral. Current MRR: $X. Target: $Y by end of quarter.
**R**: 1. Map the funnel with conversion rates at each stage. 2. Identify the stage with the largest absolute drop-off. 3. Analyze why that stage is underperforming. 4. Propose a specific fix. 5. Estimate the impact if the fix works. 6. Identify what could go wrong.
**A**: Atlas (CEO) and Tina (CFO). They want the "so what" not the data tour. Lead with the insight, support with data.
**B**: Calculate expected revenue impact of the recommendation in dollars. State confidence interval. Compare the underperforming stage to industry benchmarks.
**S**: Before finalizing, ask: "Am I recommending the highest-leverage fix, or the easiest fix? Are these the same?"

### Example 3: Cheryl Support Response

**T**: Draft a response to a customer who is frustrated that the automated workflow failed and caused duplicate emails to be sent to their client list. Deliverable: a single email response that acknowledges the issue, explains what happened, describes the fix, and restores confidence.
**I**: You are a senior customer success manager who specializes in turning support escalations into loyalty-building moments.
**N**: Include: empathy acknowledgment, technical explanation in plain language, specific remediation steps taken, assurance about prevention. Exclude: blame, jargon, defensive language, generic apology templates. Tone: sincere, competent, human. Length: 200-300 words.
**Y**: Email format. Opening: empathy. Middle: explanation and fix. Close: forward-looking assurance and direct contact offer.
**C**: The customer is a marketing agency managing email campaigns for their clients. The duplicate send went to approximately 2,500 contacts. The root cause was a race condition in the workflow queue. The fix has been deployed. No data was compromised.
**R**: 1. Acknowledge the customer's frustration specifically (not generically). 2. Explain what happened in terms they can relay to THEIR clients. 3. Describe what was fixed and how it prevents recurrence. 4. Offer a concrete goodwill gesture. 5. Provide direct escalation contact.
**A**: A stressed business owner who needs to explain this to their own clients. They need ammunition to maintain THEIR credibility, not just reassurance for themselves.
**B**: Would this response make YOU feel better if you received it? Would it give you enough information to explain the situation to someone else? Is the tone appropriate for someone who just had a professional embarrassment?
**S**: Read the draft as if you are the frustrated customer. Does it address your actual concern, or just the surface complaint?

### Example 4: Sunday Blog Post

**T**: Write a 2,000-word blog post titled "Why Your Business Needs an AI Employee, Not Another SaaS Tool." Deliverable: SEO-optimized, publication-ready article.
**I**: You are a senior B2B technology journalist who has covered the AI industry for a decade, known for making complex topics accessible without dumbing them down.
**N**: Include: the paradigm shift from tools to employees, 3 concrete use cases, comparison to traditional automation, a counterargument section (steelmanned). Exclude: sales language, unsubstantiated claims, competitor bashing. Tone: authoritative, thought-provoking, slightly provocative. Target keyword: "AI employee platform." Secondary keywords: "business automation," "AI agents for business."
**Y**: Markdown. H1 title. H2 for major sections. Short paragraphs (3-4 sentences max). At least one pull-quote-worthy sentence per section. Meta description (155 characters). CTA at end.
**C**: Atlas UX is an AI employee platform where AI agents have defined roles, responsibilities, and accountability — unlike traditional automation tools that just execute workflows. Target audience: SMB owners and operations leaders who are frustrated with the complexity of existing automation tools.
**R**: 1. Hook with a provocative opening that challenges the reader's current approach. 2. Define the distinction between tools and employees. 3. Present use cases that make the distinction tangible. 4. Address the obvious objection ("isn't this just marketing spin?"). 5. Present the counterargument honestly and respond to it. 6. Close with a forward-looking vision.
**A**: SMB owners who have used Zapier/Make/n8n but found them insufficient. Technical enough to understand automation concepts but not engineers. Reading on desktop during work hours. Skeptical of hype.
**B**: Flesch-Kincaid readability grade 8-10. SEO: target keyword in H1, first 100 words, and at least 2 H2s. Every claim should be supportable even if we don't include the citation.
**S**: After drafting, read only the H2 headers. Do they tell a complete story on their own? If someone only reads the headers, do they get the key message?

### Example 5: Mercer Outreach Email

**T**: Write a cold outreach email to the VP of Operations at a mid-market ecommerce company. Goal: secure a 20-minute discovery call. Deliverable: a single email, ready to send.
**I**: You are a senior business development executive who has a 22% cold email response rate because you lead with insight, not pitches.
**N**: Include: one specific, researched insight about their company that demonstrates you've done homework. Exclude: product features list, attachments, "hope you're doing well," anything that sounds like a template. Tone: peer-to-peer (not salesperson-to-prospect), respectful of their time, intellectually curious. Length: 100-150 words.
**Y**: Plain text email. Subject line (6-10 words, no clickbait). 3 short paragraphs max. Clear single CTA. Signature with name and title only (no phone number, no LinkedIn, no logo — keep it clean).
**C**: Target: VP Ops at [Company]. Company does $15-30M annual revenue. They recently posted a job for "automation specialist" which suggests they're investing in operational efficiency. They use Shopify Plus. Their Glassdoor reviews mention "manual processes" as a frustration.
**R**: 1. Open with the researched insight (the job posting + Glassdoor signal). 2. Bridge to the value proposition in one sentence without naming the product. 3. Ask for the meeting with a low-commitment CTA. No persuasion, no pressure. Just relevance and respect.
**A**: A busy VP who gets 50+ cold emails per week and deletes 48 of them. They're not looking for you, but they ARE looking for solutions to the problem you're referencing. You have 4 seconds to earn the next 30 seconds of attention.
**B**: Would a VP read past the first sentence? Is there ANYTHING in this email that sounds like every other sales email they've received today? If yes, cut it.
**S**: Read the email out loud. Does it sound like a human wrote it to another human? Or does it sound like a template with variables filled in?

---

## Integration with Atlas UX Systems

- Every agent prompt stored in the system should be auditable against TINY CRABS criteria
- Prompt templates in the knowledge base include TINY CRABS annotations showing which element each section fulfills
- When agents self-generate prompts for sub-tasks, the engine loop can validate TINY CRABS completeness
- Prompt performance data from the audit trail feeds back into refining the identity definitions, context libraries, and reasoning chains
- New agents onboarded to the roster receive TINY CRABS training as part of their initialization
