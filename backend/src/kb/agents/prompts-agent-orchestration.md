# Orchestrate It — Multi-Agent Coordination Prompts

Prompt templates for designing, coordinating, and governing AI agent systems. From defining agent roles to writing SGL policies and escalation chains. Built around Atlas UX's agent hierarchy: Atlas (CEO) orchestrates Lucy (receptionist), Binky (CRO), Cheryl (COO), and specialist agents.

---

## Agent Orchestration Prompts

### Prompt: Agent Role Definition
**Use when:** Creating a new agent with clear responsibilities and boundaries
**Complexity:** Medium

```
Define a new AI agent for the {{PLATFORM_NAME}} system.

Agent name: {{AGENT_NAME}}
Role title: {{ROLE_TITLE}}
Reports to: {{SUPERVISOR_AGENT}}
Domain: {{DOMAIN}}

Generate:
1. **Identity block:**
   - Name, title, and one-line mission
   - Personality traits (3-5 adjectives)
   - Communication style (formal/casual, verbose/concise)
   - Email: {{AGENT_EMAIL}}

2. **Capabilities:**
   - What this agent CAN do (5-10 specific actions)
   - What this agent CANNOT do (explicit boundaries)
   - Tools this agent has access to (APIs, databases, external services)
   - Information this agent can access (which data, which tenants)

3. **Decision authority:**
   - Decisions this agent can make autonomously
   - Decisions requiring supervisor approval
   - Spend limit: ${{SPEND_LIMIT}} per action
   - Risk tier threshold: {{RISK_TIER}} (1=auto, 2+=approval)

4. **Interaction rules:**
   - How it communicates with other agents (message format, channels)
   - When it escalates (conditions, urgency levels)
   - How it reports results (format, frequency)

5. **Evaluation criteria:**
   - Success metrics (response time, accuracy, customer satisfaction)
   - Failure conditions (what triggers a review)
   - Learning/improvement loop (how feedback is incorporated)
```

**Expected output:** Complete agent definition document ready for system integration.

---

### Prompt: Task Delegation Chain
**Use when:** Breaking complex work into agent-assigned sub-tasks
**Complexity:** Complex

```
Design a task delegation chain for: {{TASK_DESCRIPTION}}

Available agents:
{{AGENT_LIST_WITH_CAPABILITIES}}

Constraints:
- Max chain depth: {{MAX_DEPTH}} levels
- Max parallel tasks: {{MAX_PARALLEL}}
- Time budget: {{TIME_BUDGET}}
- Each agent must complete its task before dependents can start

Generate:
1. **Task breakdown:**
   | Step | Task | Assigned Agent | Dependencies | Estimated Time |

2. **Delegation sequence** (who tells whom, what, when):
   ```
   Atlas → Binky: "Research competitors for {{TOPIC}}"
   Atlas → Cheryl: "Prepare compliance checklist for {{TOPIC}}"
   Binky (on completion) → Atlas: "Report: [findings]"
   Atlas → Lucy: "Draft customer communication based on [findings]"
   ```

3. **Dependency graph** — which tasks can run in parallel
4. **Checkpoint gates** — where a human review is required before proceeding
5. **Failure handling:**
   - If agent fails: retry once, then escalate to supervisor
   - If agent times out: reassign to backup agent
   - If output quality is low: escalate for human review
6. **Completion criteria** — how Atlas knows the overall task is done
```

**Expected output:** Task delegation plan with sequencing, parallelism, and failure handling.

---

### Prompt: Agent Communication Protocol
**Use when:** Standardizing how agents exchange information
**Complexity:** Medium

```
Define a communication protocol for agents in {{SYSTEM_NAME}}.

Agents: {{AGENT_LIST}}
Communication channels: {{CHANNELS}} (database messages, API calls, Slack, email)

Protocol specification:
1. **Message format:**
   ```json
   {
     "from": "{{AGENT_NAME}}",
     "to": "{{TARGET_AGENT}}",
     "type": "request|response|notification|escalation",
     "priority": "low|normal|high|critical",
     "subject": "one-line summary",
     "body": "detailed content",
     "context": { "tenant_id": "", "task_id": "", "parent_message_id": "" },
     "deadline": "ISO8601 timestamp or null",
     "requires_response": true
   }
   ```

2. **Routing rules:**
   - Direct messages: agent-to-agent for specific requests
   - Broadcasts: announcements that all agents should see
   - Escalations: always route up the hierarchy (agent → supervisor → Atlas)
   - External: messages to/from humans route through the designated interface agent

3. **Priority handling:**
   - Critical: interrupt current task, respond within 1 minute
   - High: respond within 5 minutes
   - Normal: respond within 1 hour
   - Low: respond within 24 hours

4. **Acknowledgment:** every request gets an ack within 30 seconds
5. **Retry policy:** 3 attempts with exponential backoff
6. **Message logging:** all messages stored in audit trail
```

**Expected output:** Communication protocol spec with message format, routing, and priority handling.

---

### Prompt: Escalation Rules
**Use when:** Defining when and how agents escalate decisions to humans or senior agents
**Complexity:** Medium

```
Define escalation rules for {{AGENT_NAME}} in the {{SYSTEM_NAME}} platform.

Agent's autonomous authority:
- Spend limit: ${{SPEND_LIMIT}}
- Risk tier: can handle tier {{MAX_RISK_TIER}} and below
- Actions per day: {{MAX_ACTIONS}}

Generate escalation rules for these scenarios:

1. **Financial escalation** — when spend exceeds limits:
   - Tier 1 ($0-{{TIER_1_LIMIT}}): auto-approve
   - Tier 2 (${{TIER_1_LIMIT}}-{{TIER_2_LIMIT}}): supervisor approval
   - Tier 3 (${{TIER_2_LIMIT}}+): human approval required

2. **Risk escalation** — when action risk is elevated:
   - Low risk (tier 1): execute immediately
   - Medium risk (tier 2): create decision_memo, await supervisor
   - High risk (tier 3): create decision_memo, require human sign-off
   - Critical (tier 4): halt, notify all supervisors and humans

3. **Confidence escalation** — when agent is uncertain:
   - Confidence > {{HIGH_CONFIDENCE}}%: proceed autonomously
   - Confidence {{LOW_CONFIDENCE}}-{{HIGH_CONFIDENCE}}%: proceed with logging
   - Confidence < {{LOW_CONFIDENCE}}%: escalate to supervisor with context

4. **Error escalation** — when things go wrong:
   - Recoverable error: retry up to 3 times, then escalate
   - Unrecoverable error: escalate immediately with full error context
   - Cascading failure: halt all related tasks, notify Atlas

5. **Escalation message template:**
   - What was attempted
   - Why escalation is needed
   - Recommended action
   - Deadline for decision
   - Impact of inaction
```

**Expected output:** Tiered escalation rules with thresholds and decision memo templates.

---

### Prompt: SGL Policy Writing
**Use when:** Writing System Governance Language policies for agent behavior
**Complexity:** Complex

```
Write an SGL (System Governance Language) policy for {{POLICY_DOMAIN}}.

Reference: The SGL specification at policies/SGL.md
Agent scope: {{AFFECTED_AGENTS}}
Business context: {{BUSINESS_CONTEXT}}

Generate an SGL policy that defines:
1. **PERMIT rules** — what the agent is explicitly allowed to do:
   ```
   PERMIT {{AGENT}} TO {{ACTION}} ON {{RESOURCE}}
     WHEN {{CONDITION}}
     LIMIT {{CONSTRAINT}}
   ```

2. **DENY rules** — what is explicitly forbidden:
   ```
   DENY {{AGENT}} FROM {{ACTION}} ON {{RESOURCE}}
     REASON "{{REASON}}"
   ```

3. **REQUIRE rules** — mandatory steps before/after actions:
   ```
   REQUIRE {{AGENT}} TO {{PREREQUISITE}}
     BEFORE {{ACTION}}
   ```

4. **ESCALATE rules** — when to hand off:
   ```
   ESCALATE TO {{SUPERVISOR}}
     WHEN {{CONDITION}}
     WITH {{CONTEXT}}
   ```

5. **AUDIT rules** — what must be logged:
   ```
   AUDIT {{ACTION}} WITH {{DETAILS}}
     RETENTION {{PERIOD}}
   ```

Ensure policies are:
- Non-contradictory (no PERMIT/DENY conflicts)
- Complete (no undefined scenarios for common actions)
- Fail-closed (if no rule matches, deny by default)
- Testable (each rule can be verified with a specific scenario)
```

**Expected output:** Complete SGL policy document with PERMIT, DENY, REQUIRE, ESCALATE, and AUDIT rules.

---

### Prompt: Decision Memo Template
**Use when:** Agents need to document and request approval for high-risk actions
**Complexity:** Simple

```
Generate a decision memo template for {{DECISION_TYPE}} decisions.

Context:
- Agent requesting: {{AGENT_NAME}}
- Approval chain: {{APPROVAL_CHAIN}}
- Decision category: {{CATEGORY}}
- Risk tier: {{RISK_TIER}}

Decision memo structure:
1. **Summary** — one paragraph describing the proposed action
2. **Background** — what led to this decision point
3. **Proposed action** — exactly what will be done
4. **Alternatives considered** — at least 2 alternatives with pros/cons
5. **Risk assessment:**
   - Financial impact: ${{ESTIMATED_COST}}
   - Reversibility: reversible / partially reversible / irreversible
   - Blast radius: {{AFFECTED_SCOPE}}
   - Confidence level: {{CONFIDENCE}}%
6. **Recommendation** — which option and why
7. **Approval needed by** — deadline and impact of delay
8. **Execution plan** — step-by-step if approved

Store in the `decision_memo` table with:
- status: pending → approved/rejected
- requested_by: agent ID
- approved_by: approver ID
- tenant_id: scoped to tenant
```

**Expected output:** Decision memo template and database storage pattern.

---

### Prompt: Knowledge Base Ingestion
**Use when:** Loading documents into an agent's knowledge base
**Complexity:** Medium

```
Design a knowledge base ingestion pipeline for {{KB_NAME}}.

Source documents:
- Format: {{DOC_FORMAT}} (markdown, PDF, HTML, text)
- Location: {{DOC_PATH}}
- Volume: {{DOC_COUNT}} documents, ~{{TOTAL_SIZE}} total
- Update frequency: {{UPDATE_FREQ}}

Pipeline steps:
1. **Document loading** — read files, extract text, preserve metadata
2. **Chunking strategy:**
   - Chunk size: {{CHUNK_SIZE}} tokens
   - Overlap: {{OVERLAP}} tokens
   - Respect boundaries: split at headings, paragraphs, never mid-sentence
   - Preserve hierarchy: attach parent heading as context to each chunk
3. **Metadata extraction:**
   - Title, author, date, category
   - Source file path and chunk index
   - Tenant ID for multi-tenant KB
4. **Embedding generation:**
   - Model: {{EMBEDDING_MODEL}}
   - Batch size: {{BATCH_SIZE}}
   - Store in: {{VECTOR_STORE}}
5. **Indexing:**
   - Full-text search index (PostgreSQL tsvector)
   - Vector similarity index (pgvector or Pinecone)
   - Metadata filters (category, date range, tenant)
6. **Retrieval query template:**
   - Hybrid search: combine vector similarity + keyword match
   - Re-ranking: score and filter top-K results
   - Context assembly: concatenate chunks with source attribution

Include the ingestion script and a test query to verify retrieval quality.
```

**Expected output:** KB ingestion pipeline with chunking, embedding, indexing, and retrieval patterns.

---

### Prompt: Agent Personality and Persona Design
**Use when:** Crafting an agent's voice, tone, and behavioral characteristics
**Complexity:** Medium

```
Design the persona for {{AGENT_NAME}}, a {{ROLE}} agent in {{PLATFORM_NAME}}.

Target audience: {{AUDIENCE}}
Interaction channel: {{CHANNEL}} (voice call, chat, email, internal)
Industry: {{INDUSTRY}}

Define:
1. **Voice characteristics:**
   - Tone: {{TONE}} (warm, professional, playful, authoritative)
   - Vocabulary level: {{VOCAB_LEVEL}} (simple for customers, technical for developers)
   - Sentence length: {{SENTENCE_STYLE}} (short and punchy / balanced / detailed)
   - Humor: {{HUMOR_LEVEL}} (none / light / frequent)

2. **Behavioral guidelines:**
   - First message pattern: how to greet and set expectations
   - Handling confusion: how to clarify without condescension
   - Handling frustration: de-escalation techniques
   - Handling requests outside scope: redirect gracefully
   - Closing pattern: how to end interactions positively

3. **Do/Don't rules:**
   - DO: {{DO_RULES}}
   - DON'T: {{DONT_RULES}}
   - NEVER: {{NEVER_RULES}} (hard boundaries, compliance, safety)

4. **Example interactions:**
   - Happy path conversation (3-4 turns)
   - Difficult customer conversation (5-6 turns)
   - Out-of-scope request (2-3 turns)

5. **System prompt** — the actual prompt text to use as the agent's system message, incorporating all of the above into a coherent instruction set.

Keep the persona consistent across channels. A voice call agent needs shorter responses than an email agent.
```

**Expected output:** Complete persona definition with system prompt and example conversations.

---

## Resources

- https://www.anthropic.com/research/building-effective-agents
- https://microsoft.github.io/autogen/docs/Getting-Started
- https://docs.smith.langchain.com/

## Image References

1. **Multi-agent hierarchy diagram** — search: "multi-agent AI system hierarchy orchestration diagram"
2. **Agent communication protocol flow** — search: "agent communication protocol message passing diagram"
3. **Decision escalation flowchart** — search: "decision escalation matrix flowchart approval workflow"
4. **Knowledge base RAG pipeline** — search: "RAG retrieval augmented generation pipeline architecture diagram"
5. **Agent persona design canvas** — search: "conversational AI persona design framework canvas"

## Video References

1. https://www.youtube.com/watch?v=sal78ACtGTc — "Building Effective AI Agents — Anthropic's Research"
2. https://www.youtube.com/watch?v=DjuXACWYkkU — "Multi-Agent AI Systems: Architecture and Design Patterns"
