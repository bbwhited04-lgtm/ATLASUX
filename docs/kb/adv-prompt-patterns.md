# Advanced Prompt Engineering Patterns

## Overview

This document catalogs 20 elite prompt engineering patterns used by Atlas UX agents to maximize output quality, reasoning depth, and task completion accuracy. Each pattern includes a definition, optimal use cases, a concrete example, and guidance on how agents in the Atlas roster apply it operationally.

---

## 1. Few-Shot with Diverse Examples

**Definition:** Provide 3-5 input/output examples that span the distribution of expected cases, including edge cases and format variations, before the actual query.

**When to use:** Classification, formatting, entity extraction, or any task where output structure must be precise.

**Example:**
```
Classify the customer message. Examples:
- "Where's my order?" → inquiry/shipping
- "Your product broke my sink" → complaint/product-defect
- "Can I get a bulk discount?" → sales/pricing
- "Te quiero dar las gracias" → positive/gratitude
Message: "I was charged twice for the same item"
```

**Agent application:** Cheryl (Support) uses diverse few-shot examples across languages and sentiment polarities when triaging inbound tickets to avoid anchoring bias toward English-only or negative-only patterns.

---

## 2. Chain-of-Density (CoD)

**Definition:** Ask the model to produce an initial summary, then iteratively compress it across N rounds while injecting additional entities and details each round. The final output is maximally dense yet readable.

**When to use:** Summarizing long documents, research reports, or meeting transcripts where information loss is unacceptable.

**Example:**
```
Summarize this 4000-word market report in 5 rounds.
Round 1: Write a 150-word summary.
Round 2: Rewrite in 130 words, adding 2 missing key entities.
Round 3: Rewrite in 110 words, adding 2 more entities.
Round 4: Rewrite in 100 words, merging redundant clauses.
Round 5: Final 80-word summary — every sentence must carry unique information.
```

**Agent application:** Archy (Research) applies CoD when compressing competitive intelligence briefs for the WF-106 daily aggregation, ensuring Atlas receives dense summaries without losing critical market signals.

---

## 3. Self-Ask

**Definition:** The LLM explicitly generates sub-questions it needs to answer before tackling the main question, then answers each sequentially, and finally synthesizes a final response.

**When to use:** Multi-hop reasoning, questions requiring synthesis of multiple facts, or when the model tends to hallucinate shortcuts.

**Example:**
```
Question: Is Atlas UX's daily action cap more or less restrictive than Zapier's task limits on their Professional plan?
Follow-up questions needed:
1. What is Atlas UX's MAX_ACTIONS_PER_DAY?
2. What is Zapier Professional's monthly task limit, converted to daily?
3. How do they define "action" vs "task"?
Answer each, then give the final comparison.
```

**Agent application:** Daily-Intel uses Self-Ask when comparing Atlas UX metrics against competitor platforms, forcing decomposition rather than hallucinated comparisons.

---

## 4. ReAct (Reasoning + Acting)

**Definition:** Alternate between Thought (reasoning about the current state), Action (calling a tool or retrieving information), and Observation (interpreting the result) in an explicit loop until the task is complete.

**When to use:** Tool-augmented tasks, multi-step workflows, or any scenario where the agent must decide what to do next based on intermediate results.

**Example:**
```
Thought: I need to find the tenant's current spend this month.
Action: query_ledger(tenant_id="t_abc", period="2026-02")
Observation: Total spend is $847.32, limit is $1000.
Thought: They're at 84.7% of limit. I should check pending jobs.
Action: list_jobs(tenant_id="t_abc", status="queued")
Observation: 3 queued jobs totaling estimated $95.
Thought: Approving all would push to $942, still under. Safe to proceed.
Final: Approve all 3 jobs.
```

**Agent application:** The engine loop in Atlas UX is fundamentally a ReAct loop. Every agent tick follows Thought-Action-Observation when processing intents, with the audit trail capturing each step.

---

## 5. Skeleton-of-Thought (SoT)

**Definition:** First generate a skeleton (outline with bullet points), then expand each bullet independently and in parallel. This produces faster, more structured output.

**When to use:** Long-form content generation, reports, documentation, or any output where parallel expansion is possible.

**Example:**
```
Step 1 — Skeleton:
1. Executive summary
2. Market size and growth
3. Competitive landscape
4. Our positioning
5. Recommended actions

Step 2 — Expand each section independently (can be parallelized across API calls).
```

**Agent application:** Reynolds (Blog) generates article skeletons first, allowing Sunday (Writer) to review structure before expanding. This catches strategic misalignment before tokens are spent on full drafts.

---

## 6. Least-to-Most Prompting

**Definition:** Decompose a complex problem into a sequence of increasingly difficult sub-problems. Solve the simplest first, then use each solution as context for the next.

**When to use:** Complex reasoning chains, mathematical problems, multi-step planning, or onboarding explanations.

**Example:**
```
Problem: Calculate the ROI of switching from manual to AI-automated customer support.
Sub-problems (solve in order):
1. What is the current cost per ticket with human agents?
2. What is the cost per ticket with AI triage + human escalation?
3. What is the expected ticket volume change with faster response times?
4. What is the net annual savings?
5. What is the implementation cost?
6. ROI = (savings - cost) / cost
```

**Agent application:** Tina (CFO) uses Least-to-Most when building financial models, ensuring each intermediate calculation is validated before feeding into downstream projections.

---

## 7. Generated Knowledge Prompting

**Definition:** Before answering the main question, first ask the model to generate relevant background facts and domain knowledge. Then use those generated facts as context for the final answer.

**When to use:** Knowledge-intensive questions, domain-specific analysis, or when the model's parametric knowledge needs priming.

**Example:**
```
Step 1: Generate 5 key facts about GDPR Article 17 (Right to Erasure).
Step 2: Using those facts, draft a data deletion policy for a SaaS platform with multi-tenant architecture.
```

**Agent application:** Jenny (CLO) generates legal knowledge before drafting compliance documents, creating an explicit knowledge scaffold that can be audited for accuracy.

---

## 8. Maieutic Prompting

**Definition:** Build a recursive explanation tree. For each claim, ask "Is this true? Why or why not?" and branch into supporting or contradicting sub-explanations until the reasoning bottoms out in established facts.

**When to use:** Fact-checking, belief verification, detecting hallucinations, or building trusted reasoning chains.

**Example:**
```
Claim: "Our churn rate will decrease if we add AI agents."
├── Is this true? Why?
│   ├── Sub-claim: "AI agents reduce response time" — True because...
│   ├── Sub-claim: "Faster response correlates with retention" — Evidence: ...
│   └── Sub-claim: "Implementation won't cause disruption" — Uncertain because...
```

**Agent application:** Atlas (CEO) applies Maieutic prompting when evaluating strategic recommendations from other agents, building explicit belief trees before approving high-impact decisions.

---

## 9. Prompt Chaining

**Definition:** The output of Prompt A becomes the input (or part of the input) for Prompt B, forming a pipeline. Each stage has a focused, narrow task.

**When to use:** Complex workflows that benefit from separation of concerns, or when different model configurations (temperature, system prompts) are optimal for each stage.

**Example:**
```
Stage 1 (temp=0.8): Generate 10 blog title ideas for "AI automation for SMBs"
Stage 2 (temp=0.1): Rank titles by SEO potential and click-through likelihood
Stage 3 (temp=0.5): Write the article for the top-ranked title
Stage 4 (temp=0.0): Fact-check all claims in the article
```

**Agent application:** The Atlas UX content pipeline chains Sunday (ideation, temp=0.7) to Reynolds (drafting, temp=0.5) to Sunday (editing, temp=0.2) with each stage's output feeding the next via the job queue.

---

## 10. Meta-Prompting

**Definition:** Ask the LLM to write the prompt itself. Describe the task at a high level and have the model generate the optimal prompt, which you then execute.

**When to use:** Novel tasks where you are unsure of the best prompt structure, prompt optimization, or building prompt libraries.

**Example:**
```
I need a prompt that will make an LLM generate a competitive analysis comparing Atlas UX to three competitors across 8 dimensions. The output should be a markdown table. Write the optimal prompt for this task, including system message, few-shot examples if needed, and output format specification.
```

**Agent application:** Binky (CRO) uses meta-prompting to generate campaign-specific prompts for social media agents, ensuring each platform's prompt is tailored without manual prompt engineering per channel.

---

## 11. Constitutional AI Prompting

**Definition:** After generating a response, have the model critique its own output against a set of explicit principles (the "constitution"), then revise based on the critique.

**When to use:** Content moderation, brand safety, ethical compliance, or any output that must adhere to organizational policies.

**Example:**
```
Principles:
1. Never make unverifiable claims about competitors
2. All statistics must include sources
3. Tone must be professional but approachable
4. No fear-based marketing language

Draft: [initial output]
Critique against each principle: [self-assessment]
Revised output: [improved version]
```

**Agent application:** All Atlas UX social publisher agents (Kelly, Fran, Dwight, etc.) run Constitutional AI checks against the SGL governance policies before any content is published, with critiques logged to the audit trail.

---

## 12. Directional Stimulus Prompting

**Definition:** Include a small hint or nudge about the desired answer direction without giving the answer outright. This guides the model toward the correct solution space.

**When to use:** When the model consistently misses a particular angle, or when you want to bias toward a specific approach without constraining creativity.

**Example:**
```
How should we optimize our API response times?
Hint: Consider that 80% of our endpoints are read-heavy and our database has no read replicas.
```

**Agent application:** Petra (PM) uses directional stimulus when delegating technical investigation tasks to other agents, providing architectural hints that prevent agents from pursuing irrelevant optimization paths.

---

## 13. Step-Back Prompting

**Definition:** Before answering the specific question, first answer a higher-level, more abstract version of the question. Use the abstract answer as context for the specific answer.

**When to use:** Questions that require domain principles, physics of a problem, or conceptual understanding before specifics.

**Example:**
```
Specific question: Why is our Prisma query timing out on the audit_log table?
Step-back question: What are the general causes of database query timeouts in append-only tables with millions of rows?
Step-back answer: [general principles about indexing, partitioning, vacuum]
Now apply to the specific case: [targeted diagnosis]
```

**Agent application:** Sunday (Tech Writer) uses step-back prompting when explaining technical issues in documentation, ensuring the conceptual foundation is laid before diving into Atlas-specific implementation details.

---

## 14. Emotion Prompting

**Definition:** Embed emotional framing or stakes into the prompt to increase the model's attention and output quality. Research shows this can improve performance on reasoning tasks.

**When to use:** High-stakes outputs where quality must be maximized, or when default outputs feel generic and low-effort.

**Example:**
```
This response will be sent directly to our most important enterprise client who is considering cancellation. Their annual contract is worth $240,000. Take a deep breath and write the most compelling, accurate, and empathetic response possible.
```

**Agent application:** Cheryl (Support) applies emotion prompting for escalated tickets tagged risk-tier >= 2, signaling to the underlying model that the output has real business consequences.

---

## 15. Rephrase-and-Respond (RaR)

**Definition:** Ask the model to rephrase the question in its own words before answering. This forces comprehension and often surfaces ambiguities the original phrasing hid.

**When to use:** Ambiguous queries, user messages with poor grammar, or complex multi-part questions.

**Example:**
```
User question: "make the thing work with the other thing and also fix the bug from last time"
Step 1: Rephrase this question clearly and identify any ambiguities.
Step 2: Answer the rephrased question, noting assumptions made.
```

**Agent application:** All agents receiving natural-language instructions from users apply RaR as a preprocessing step, with the rephrased version logged to the audit trail for transparency.

---

## 16. Thread-of-Thought (ThoT)

**Definition:** Maintain an explicit reasoning thread across multiple turns of conversation, summarizing the current state of reasoning at each step so context is never lost.

**When to use:** Multi-turn conversations, long-running analyses, or when context window limits threaten to drop important earlier reasoning.

**Example:**
```
[Turn 3 of 7]
Reasoning thread so far:
- Turn 1: Identified the problem as a caching invalidation issue
- Turn 2: Ruled out Redis TTL (checked: TTL is correct)
- Turn 3 (current): Investigating whether Vite HMR is serving stale modules
Current hypothesis: ...
```

**Agent application:** The engine loop maintains Thread-of-Thought state in the `intent` record's metadata field, ensuring multi-tick agent tasks preserve reasoning context across engine cycles.

---

## 17. Contextual Compression

**Definition:** Compress long context documents into a dense, query-relevant summary before injecting them into the main prompt. Only information relevant to the current query survives compression.

**When to use:** RAG pipelines, knowledge base queries, or any scenario where retrieved context exceeds useful density.

**Example:**
```
Context (2000 tokens): [full document about Atlas UX architecture]
Query: "How does multi-tenancy work?"
Compressed context (200 tokens): "Every DB table has tenant_id FK. tenantPlugin extracts x-tenant-id from headers. Prisma queries auto-filter by tenant_id. Supabase RLS provides DB-level isolation."
```

**Agent application:** The KB retrieval pipeline applies contextual compression after vector search, reducing retrieved chunks to query-relevant content before injection into agent prompts, cutting token costs by 60-80%.

---

## 18. Analogical Prompting

**Definition:** Ask the model to generate relevant analogies or similar solved problems before tackling the current problem. The analogies serve as reasoning scaffolds.

**When to use:** Novel problems, creative solutions, explaining complex concepts to non-technical stakeholders.

**Example:**
```
Problem: Design an approval workflow for autonomous agent actions.
First, generate 3 analogies from other domains:
1. Air traffic control clearance system
2. Surgical team timeout protocol
3. Nuclear launch authorization chain
Now design the workflow drawing on the best elements of each analogy.
```

**Agent application:** Atlas (CEO) uses analogical prompting when designing new workflows, drawing on cross-domain patterns to avoid reinventing solutions that already exist in other industries.

---

## 19. Contrastive Prompting

**Definition:** Explicitly show the model what a bad output looks like alongside what a good output looks like, making the quality gradient clear.

**When to use:** When outputs are consistently mediocre, or when the distinction between acceptable and excellent is subtle.

**Example:**
```
Bad response: "We use AI to help your business."
Why it's bad: Vague, no specifics, could describe any AI company.
Good response: "Atlas UX deploys 30+ named AI agents that autonomously execute marketing, finance, and support tasks with built-in approval workflows and daily action caps."
Why it's good: Specific, quantified, differentiating, mentions safety.
Now write a response for: [new prompt]
```

**Agent application:** Sunday (Writer) includes contrastive examples in system prompts for all social publisher agents, calibrating quality expectations per platform.

---

## 20. Recursive Criticism and Improvement (RCI)

**Definition:** Generate an initial response, then enter a loop of: critique the response, identify specific weaknesses, rewrite to address them. Repeat for N iterations or until no substantive critiques remain.

**When to use:** High-quality content production, code generation, strategic planning, or any output where iterative refinement adds measurable value.

**Example:**
```
Draft 1: [initial response]
Critique 1: "Missing quantitative evidence in paragraph 2. Conclusion doesn't follow from premises."
Draft 2: [revised response addressing critique]
Critique 2: "Improved. Minor: transition between sections 3 and 4 is abrupt."
Draft 3: [final polished response]
```

**Agent application:** Decision memos for risk-tier >= 2 actions pass through RCI with 3 iterations before being submitted for human approval, with each draft-critique pair preserved in the audit log.

---

## Pattern Selection Guide

| Task Type | Primary Pattern | Secondary Pattern |
|---|---|---|
| Research synthesis | Chain-of-Density | Self-Ask |
| Tool-augmented work | ReAct | Prompt Chaining |
| Content creation | Skeleton-of-Thought | RCI |
| Complex reasoning | Least-to-Most | Maieutic |
| Compliance-sensitive | Constitutional AI | Contrastive |
| Ambiguous inputs | Rephrase-and-Respond | Step-Back |
| Long conversations | Thread-of-Thought | Contextual Compression |
| Novel problems | Analogical | Meta-Prompting |

---

## Integration with Atlas UX Engine

All patterns are available as composable strategies in the engine's prompt construction layer. Agents select patterns based on task type, risk tier, and historical performance data from the audit trail. Pattern selection itself is logged, enabling continuous optimization of pattern-task matching over time.
