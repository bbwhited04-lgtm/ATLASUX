# Context Engineering for AI Agents

> Atlas UX Knowledge Base — Advanced Architecture
> Classification: Internal / Agent Training
> Version: 1.0 | Last Updated: 2026-02-27

---

## 1. What Is Context Engineering

Context engineering is the systematic discipline of building the informational
environment that an AI model operates within. It is a superset of prompt engineering.
Where prompt engineering focuses on crafting the instruction text, context engineering
encompasses everything the model can see when it makes a decision: system prompts,
retrieved documents, tool outputs, conversation history, structured data, implicit
signals, and the ordering and prioritization of all these elements.

The quality of an AI agent's output is directly proportional to the quality of the
context it receives. A mediocre model with excellent context will outperform a
superior model with poor context. This is the single most leveraged investment in
any agent system.

**Analogy:** Prompt engineering is writing a good job description. Context engineering
is building the entire office — the reference library, the filing cabinets, the tools
on the desk, the whiteboard with yesterday's meeting notes, and the colleague sitting
next to you who can answer follow-up questions.

---

## 2. Why Context Engineering Matters for Autonomous Agents

Chatbots get context from the human in the conversation. Autonomous agents do not
have that luxury. When Atlas UX's engine loop wakes an agent to process a job, there
is no human in the loop providing clarification. The agent must have everything it
needs already assembled in its context window.

**The stakes are higher for agents:**

- A chatbot with bad context gives a wrong answer; a human notices and corrects.
- An agent with bad context takes a wrong action — sends the wrong email, posts
  incorrect content, approves an unauthorized spend. Recovery is expensive.

**The challenge is harder for agents:**

- Agents operate across multiple tasks, tools, and time horizons.
- Context must be dynamically assembled for each task (not static).
- Token budgets are finite; context must be curated, not dumped.
- Agents need both broad awareness (org state) and narrow focus (current task).

---

## 3. The Six Components of Agent Context

### 3.1 System Instructions

The foundational layer. For Atlas UX agents, this includes:

- **Role definition:** Who the agent is, what it does, who it reports to.
- **SGL policies:** Governance rules, spend limits, approval requirements.
- **SKILL.md:** The agent's specific capabilities and standard procedures.
- **POLICY.md:** Behavioral constraints and ethical guidelines.
- **Tone and communication style:** How the agent speaks and writes.

System instructions are relatively static — they change with policy updates, not
with individual tasks. They set the behavioral envelope within which the agent
operates.

**Best practice:** Keep system instructions focused on constraints and identity.
Do not embed task-specific details in system prompts. That creates confusion when
the agent handles different types of tasks.

### 3.2 Retrieved Documents (RAG Context)

Dynamic knowledge pulled from the Knowledge Base at task time:

- **Relevant KB articles** selected by embedding similarity to the current task.
- **Previous task outputs** from related workflows.
- **Company data** (product specs, pricing, customer info) needed for the task.
- **External research** previously ingested into the KB.

The retrieval step is critical. Poor retrieval means the agent either lacks needed
information (hallucination risk) or drowns in irrelevant documents (attention dilution).

**Atlas UX retrieval pipeline:**
```
Task description
  → Generate embedding
  → Query KB with cosine similarity (top-K results)
  → Re-rank results by relevance and recency
  → Truncate to fit token budget
  → Insert into agent context as "Reference Materials"
```

### 3.3 Tool Outputs

Results from tool calls made during the current task execution:

- Database query results
- API responses (Microsoft Graph, social platform APIs)
- Calculation outputs (financial projections, metrics)
- File contents (uploaded documents, images)

Tool outputs are inherently dynamic — they represent the real-time state of
external systems. They are the most grounding element of context because they
are factual, not generated.

**Best practice:** Tool outputs should be structured (JSON, tables) rather than
narrative text. Structured data is easier for the model to parse and reduces
the risk of misinterpretation.

### 3.4 Conversation History / Memory

For agents, "conversation history" means the history of the current task execution:

- Previous reasoning steps in the current job
- Tool calls already made and their results
- Self-critique outputs from reflection loops
- Inter-agent messages within the current workflow

This gives the agent continuity within a task. Without it, each reasoning step
would be amnesiac, potentially repeating work or contradicting earlier decisions.

**Memory beyond the current task:**

Atlas UX agents also have access to longer-term memory through the audit log:
- What tasks has this agent completed recently?
- What quality scores did those tasks receive?
- What patterns of errors has the agent exhibited?

This informs self-awareness without consuming excessive tokens (accessed via
targeted queries, not dumped wholesale).

### 3.5 Structured State Data

Explicit data about the current operational state:

- **Current date and time** (critical for time-sensitive decisions)
- **Agent queue depth** (how much work is pending)
- **Budget status** (how much of the daily spend limit remains)
- **Action count** (how many actions toward the daily cap have been used)
- **Workflow status** (which steps are complete, which are pending)
- **Tenant configuration** (client-specific settings and preferences)

This is the equivalent of the dashboard on an employee's desk. It provides
situational awareness that shapes every decision.

### 3.6 Implicit Signals

Information not explicitly provided but inferable from the context:

- **Task priority** inferred from the requesting agent's seniority.
- **Urgency** inferred from deadline proximity.
- **Quality expectations** inferred from the output's intended audience.
- **Risk level** inferred from the nature of the action (financial, public-facing).

Atlas UX makes many implicit signals explicit by computing them during job creation
and attaching them as job metadata. This reduces the cognitive burden on the agent.

---

## 4. Context Window Management

### 4.1 The Token Budget Problem

Every model has a finite context window. Even with 128K+ token windows, real-world
agent tasks can easily exceed the budget when you combine system instructions,
retrieved documents, tool outputs, conversation history, and structured state.

**The discipline is not just fitting things in — it is deciding what to leave out.**

### 4.2 Priority Ordering

Not all context is equally important. Atlas UX uses this priority stack:

```
Priority 1 (Always include):
  - Current task description and requirements
  - System instructions (role, SGL policies)
  - Critical state data (budget remaining, action count)

Priority 2 (Include if space permits):
  - Top-K retrieved KB documents
  - Recent tool outputs from current task
  - Self-critique from previous reflection round

Priority 3 (Include if space permits after P1 and P2):
  - Historical task performance data
  - Extended conversation history
  - Supplementary reference materials

Priority 4 (Omit unless specifically relevant):
  - Full audit trail history
  - Unrelated KB documents
  - Other agents' recent activities
```

### 4.3 Context Compression Techniques

When the budget is tight, compress rather than omit:

**Summarization:** Replace verbose documents with summaries. Atlas UX uses a
dedicated summarization call (LONG_CONTEXT_SUMMARY) to condense long documents
before inserting them into agent context.

**Selective extraction:** Instead of including an entire document, extract only
the sections relevant to the current task. Embedding-based section matching
identifies which paragraphs to include.

**Schema-only tool outputs:** For large API responses, include the schema and
key values rather than the full payload.

**Rolling window for history:** Keep the most recent N turns of conversation
history. For agent tasks that span many steps, summarize earlier steps.

### 4.4 Context Freshness

Stale context is dangerous. An agent making decisions based on yesterday's data
when today's data is available will make suboptimal choices.

**Freshness rules for Atlas UX:**
- Financial data: must be from the current reporting period.
- Social media metrics: must be < 24 hours old.
- Legal/regulatory data: must reference current statutes (check KB document dates).
- Competitive intelligence: must be < 7 days old.
- Product/pricing data: must match current published values.

The retrieval pipeline marks document timestamps and the engine loop can reject
context that fails freshness checks for the given task type.

---

## 5. Practical Context Engineering for Atlas UX Agents

### 5.1 Context Template by Agent Role

**Atlas (CEO) — Strategic Context:**
```
System: Role definition, SGL executive policies
State: Org-wide KPIs, budget status, active workflows, agent performance summaries
Retrieved: Strategic plans, previous directives, outcome tracking
Tools: delegate_task, search_knowledge_base, log_decision_memo
```

**Tina (CFO) — Financial Context:**
```
System: Role definition, SGL financial policies, AUTO_SPEND_LIMIT
State: Current budget allocation, recent transactions, pending approvals
Retrieved: Financial reports, budget history, vendor contracts
Tools: run_financial_calc, search_knowledge_base, log_decision_memo
```

**Sunday (Comms/Tech Writer) — Content Context:**
```
System: Role definition, brand voice guidelines, content policies
State: Content calendar, pending drafts, recent publications
Retrieved: Brand assets, style guides, topic research (from Archy)
Tools: search_knowledge_base, delegate_task (to Venny for images)
```

**Publisher Agents (Kelly, Fran, etc.) — Publishing Context:**
```
System: Role definition, platform-specific policies, posting rules
State: Daily posting count, remaining action cap, queue depth
Retrieved: Approved content from Sunday, platform-specific formatting rules
Tools: create_social_post, search_knowledge_base
```

### 5.2 Dynamic Context Assembly

The engine loop assembles context fresh for every job execution:

```typescript
async function buildAgentContext(job: Job, agent: AgentConfig): Context {
  // Priority 1: Always included
  const systemPrompt = loadSystemPrompt(agent);
  const taskDescription = job.payload;
  const stateData = await getAgentState(agent, job.tenantId);

  // Priority 2: Space-dependent
  const kbDocs = await retrieveRelevantDocs(taskDescription, job.tenantId);
  const recentTools = job.meta?.toolOutputs ?? [];

  // Priority 3: If budget allows
  const history = await getRecentTaskHistory(agent.id, limit: 5);

  // Assemble with token counting
  return assembleWithBudget({
    systemPrompt,     // ~2K tokens typical
    taskDescription,  // ~500 tokens typical
    stateData,        // ~300 tokens typical
    kbDocs,           // up to 8K tokens, compressed if needed
    recentTools,      // variable
    history,          // up to 2K tokens
  }, maxTokens: agent.contextBudget);
}
```

### 5.3 Per-Task Context Augmentation

Some tasks require specialized context beyond the standard template:

- **Financial approval tasks:** Include the full transaction details, comparable
  past transactions, and the current budget state.
- **Content creation tasks:** Include the research brief, brand voice examples,
  and any specific requirements from the requesting agent.
- **Legal review tasks:** Include relevant statutes, prior legal opinions, and
  the specific compliance requirements for the jurisdiction.
- **Customer support tasks:** Include the customer's history, open tickets, and
  the product documentation relevant to their issue.

The job's `meta` field carries task-type indicators that the context builder uses
to select the appropriate augmentation strategy.

---

## 6. Few-Shot Examples in Agent Context

### 6.1 Why Few-Shot Matters for Agents

Few-shot examples show the model what good output looks like for the specific
task type. For agents, this is especially important because:

- Agents produce structured outputs (JSON, specific formats) that must be precise.
- Each agent has a distinct voice and style that examples demonstrate better than
  descriptions.
- Tool calling patterns are best taught by example ("when you see X, call tool Y
  with parameters Z").

### 6.2 Example Selection Strategies

**Static examples:** Pre-written, curated examples stored in the agent's
configuration. Good for common task types with stable patterns.

**Dynamic examples:** Retrieved from the audit log based on similarity to the
current task. Shows the agent how it (or a peer) successfully handled similar
work in the past.

**Negative examples:** Show what NOT to do. "Here is a previous output that was
rejected because..." These are powerful for preventing recurring mistakes.

### 6.3 Atlas UX Example Management

Examples are stored as KB documents with a special `type: 'few_shot_example'` tag.
The retrieval pipeline can specifically query for examples matching the current
task type:

```
Query: "Find few-shot examples for social media content creation"
Results: 3 approved post examples with quality scores > 4.0
Insertion: Added to context under "## Reference Examples"
```

---

## 7. Anti-Patterns in Context Engineering

### 7.1 Context Flooding

**Problem:** Dumping everything into the context window because "more information
is better." The model drowns in irrelevant text. Attention mechanisms degrade.
The signal-to-noise ratio drops. Output quality decreases.

**Fix:** Curate aggressively. Every token in the context should earn its place.
If a document does not directly inform the current task, leave it out.

### 7.2 Irrelevant Context

**Problem:** Including context that is topically related but not actually useful
for the current task. A blog post about "AI trends" is not useful context for
writing a specific product announcement, even though both are about AI.

**Fix:** Retrieval must be task-specific, not topic-specific. Use the task
description (not just keywords) as the retrieval query.

### 7.3 Missing Grounding Data

**Problem:** Asking an agent to make decisions without providing the factual basis.
"Approve this spend" without including the current budget, the spend limit, or
the transaction details. The agent either hallucinates the data or makes an
uninformed decision.

**Fix:** For every decision task, explicitly include the data the agent needs
to decide. Checklist: What facts does the agent need? Are they all in the context?

### 7.4 Contradictory Context

**Problem:** Different context sources provide conflicting information. The KB
says the product price is $99, but a recent tool output shows $79 (sale price).
The agent does not know which to trust.

**Fix:** Timestamp all context. When conflicts exist, the agent should be
instructed to prefer the most recent source and flag the contradiction.

### 7.5 Context Without Attribution

**Problem:** Context is provided as a flat block of text with no indication of
where each piece came from. The agent cannot assess source reliability and
cannot provide citations in its output.

**Fix:** Tag every context section with its source:
```
[Source: KB Doc #247, "Q2 Revenue Projections", updated 2026-02-25]
Revenue projections show 15% YoY growth...

[Source: Tool output, run_financial_calc, executed 2026-02-27T10:15:00Z]
Current quarterly spend: $42,300 of $75,000 budget...
```

### 7.6 Static Context for Dynamic Tasks

**Problem:** Using the same system prompt and retrieved documents for every task
regardless of type. A financial analysis task gets the same context as a content
creation task.

**Fix:** Context assembly must be task-type-aware. The context builder selects
different document sets, tool configurations, and state data based on what the
current job requires.

### 7.7 Ignoring Context Window Position Effects

**Problem:** Treating context window position as irrelevant. Research shows that
models attend more strongly to information at the beginning and end of the context
("lost in the middle" effect).

**Fix:** Place the most critical information (task description, key constraints)
at the beginning. Place reference materials in the middle. Place the final
instruction ("Now complete this task:") at the end.

---

## 8. Measuring Context Quality

### 8.1 Context Relevance Score

After each task, evaluate how well the provided context served the agent:

- **Utilization rate:** What percentage of the provided context was actually
  referenced in the agent's output? Low utilization suggests irrelevant context.
- **Sufficiency rate:** Did the agent need to hallucinate or hedge because context
  was missing? This is detectable through the self-critique protocol.
- **Freshness compliance:** Was all time-sensitive context within its freshness
  window?

### 8.2 Correlation with Output Quality

Track the relationship between context quality metrics and the agent's output
quality score (QS from the Self-Evaluation framework). Over time, this reveals
which context components have the most impact on output quality for each agent role.

### 8.3 Context Budget Efficiency

For each agent role, track:

```
Context efficiency = Output quality score / Tokens of context consumed
```

If doubling the context from 4K to 8K tokens only improves QS from 4.1 to 4.15,
the extra 4K tokens are not earning their keep. Conversely, if adding a specific
KB document consistently raises QS by 0.5 points, that document should always
be included.

---

## 9. Context Engineering as Competitive Advantage

The models are commoditizing. GPT-4, Claude, Gemini, DeepSeek — capabilities
converge with each generation. What does not commoditize is the context layer.
The retrieval pipeline, the state management system, the tool output formatting,
the priority ordering logic, the freshness rules — these are proprietary to each
platform.

Atlas UX's competitive moat is not which LLM it uses (the system supports multiple
providers via `ai.ts`). The moat is the context engineering that turns a generic
LLM into Atlas the CEO, Tina the CFO, or Sunday the content strategist. The same
base model becomes 30+ distinct specialists because each one receives a carefully
engineered context tailored to its role, current task, and organizational state.

---

## 10. Checklist: Building Context for a New Agent

When onboarding a new agent to the Atlas UX roster:

1. **Define the role** — Write SKILL.md and POLICY.md documents.
2. **Identify required data** — What information does this agent need for its
   typical tasks? Map to KB, tools, and state sources.
3. **Curate the tool set** — Which tools does the agent need? Define clear
   descriptions and parameter schemas.
4. **Write few-shot examples** — Create 3-5 high-quality examples of the agent's
   expected output for common task types.
5. **Set context budget** — Based on the agent's typical task complexity, allocate
   a token budget for the context window.
6. **Define freshness rules** — For each data type the agent uses, specify the
   maximum acceptable staleness.
7. **Test with realistic tasks** — Run the agent against representative tasks and
   evaluate context quality using the metrics in Section 8.
8. **Iterate** — Adjust the context template based on output quality scores.
   Add missing context, remove unused context, re-order for attention effects.
