# Agentic Tool Use and Integration Patterns

> Advanced guide to tool use, API design, and integration strategies for autonomous agents.
> Audience: Platform engineers, API designers, and Atlas UX operators.
> Source: Consolidated from the [Awesome Agentic Patterns](https://github.com/nibzard/awesome-agentic-patterns) repository.

---

## Table of Contents

1. [Overview](#overview)
2. [Code-First Tool Interface (Code Mode)](#1-code-first-tool-interface-code-mode)
3. [Code-Over-API Pattern](#2-code-over-api-pattern)
4. [Code-Then-Execute Pattern](#3-code-then-execute-pattern)
5. [Dual-Use Tool Design](#4-dual-use-tool-design)
6. [Dynamic Code Injection](#5-dynamic-code-injection)
7. [Intelligent Bash Tool Execution](#6-intelligent-bash-tool-execution)
8. [LLM-Friendly API Design](#7-llm-friendly-api-design)
9. [Progressive Tool Discovery](#8-progressive-tool-discovery)
10. [Tool Capability Compartmentalization](#9-tool-capability-compartmentalization)
11. [Tool Selection Guide](#10-tool-selection-guide)
12. [Parallel Tool Execution](#11-parallel-tool-execution)
13. [Multi-Platform Webhook Triggers](#12-multi-platform-webhook-triggers)
14. [Multi-Platform Communication Aggregation](#13-multi-platform-communication-aggregation)
15. [Tool Use Incentivization via Reward Shaping](#14-tool-use-incentivization-via-reward-shaping)
16. [Tool Use Steering via Prompting](#15-tool-use-steering-via-prompting)
17. [Atlas UX Integration Notes](#atlas-ux-integration-notes)

---

## Overview

Tools are how agents interact with the world. The quality of tool design determines whether agents succeed or fail at their tasks. Poorly designed tools lead to wasted tokens, incorrect actions, and frustrated users. Well-designed tools make agents reliable, efficient, and predictable.

Atlas UX agents use a diverse tool set: Outlook email, Slack, Telegram, social media APIs, KB operations, job management, and internal business tools. These patterns guide how to design, discover, authorize, and execute those tools effectively.

---

## 1. Code-First Tool Interface (Code Mode)

**Status:** Established | **Source:** Cloudflare Team

Instead of traditional MCP tool calls (LLM calls tool, gets JSON, calls next tool), let the LLM write code that orchestrates multiple tool calls in a single execution:

**Traditional MCP (token-heavy):**
```
LLM -> tool #1 -> large JSON -> LLM context
LLM -> tool #2 -> large JSON -> LLM context
LLM -> tool #3 -> large JSON -> LLM context
```

**Code Mode (token-efficient):**
```
LLM -> generates TypeScript -> V8 isolate executes all calls -> condensed result -> LLM
```

**Key insight:** LLMs are better at writing code to orchestrate tools than calling tools directly. They have far more training data on code patterns than on tool-call patterns.

**Fan-out efficiency:** Processing 100 items via traditional MCP requires 100 separate tool calls with round-trips. Code Mode uses a simple `for` loop executing entirely within the sandbox.

**When NOT to use Code Mode:**
- Open-ended research loops where next steps are unpredictable
- Intelligence needed mid-execution (LLM reasoning between each call)
- Simple single tool calls that do not need orchestration

**Atlas UX relevance:** When agents need to process multiple items (sending bulk emails, updating multiple social channels, processing batch KB documents), Code Mode-style execution would be more efficient than individual tool calls through the engine loop. The engine could compile agent intent into executable scripts for batch operations.

---

## 2. Code-Over-API Pattern

**Status:** Emerging

Prefer generating code that uses well-documented libraries over making direct API calls when the agent has access to a code execution environment.

**Why code is better than raw API calls:**
- Libraries handle authentication, pagination, error handling
- More training data on library usage than raw API patterns
- Code is testable and debuggable
- Libraries abstract away API versioning

**Example:**
```python
# Worse: raw API call
response = requests.post("https://api.stripe.com/v1/charges",
    headers={"Authorization": f"Bearer {key}"},
    data={"amount": 2000, "currency": "usd"})

# Better: library call
stripe.Charge.create(amount=2000, currency="usd")
```

**Atlas UX relevance:** The backend services layer already follows this pattern. Agents do not make raw HTTP calls to Microsoft Graph -- they use the `graphPost()` utility function that handles authentication and error handling. The `telegramNotify.ts` library abstracts Telegram API calls behind a clean interface.

---

## 3. Code-Then-Execute Pattern

**Status:** Emerging

Generate complete code first, validate it (compilation, linting, type checking), then execute. Never generate and execute simultaneously.

**Three-step process:**
1. **Generate** -- LLM writes the code
2. **Validate** -- compile, lint, type-check before execution
3. **Execute** -- run only validated code

**Benefits of validation step:**
- Catches syntax errors before runtime
- Type checking prevents class mismatches
- Linting catches common anti-patterns
- Reduces wasted execution cycles

**Atlas UX relevance:** When agents generate content (blog posts, social media copy), a validate-then-execute pattern should apply: generate the content, run it through quality checks (brand voice, compliance, length), then publish. The current workflow where agents can directly call publishing tools should be augmented with pre-execution validation.

---

## 4. Dual-Use Tool Design

**Status:** Emerging

Design tools that serve both humans and agents effectively. The same tool interface should work for interactive human use and autonomous agent use.

**Design principles:**
- Clear, descriptive function names and parameters
- Structured output that both humans and LLMs can parse
- Error messages that are actionable by both audiences
- Default parameters that make common cases simple

**Atlas UX relevance:** The `/v1/` API routes serve both the React frontend (human-interactive) and the engine loop (agent-automated). The same `POST /v1/jobs` endpoint creates jobs whether triggered by a human clicking a button or an agent delegating work. This dual-use design should be maintained and extended.

---

## 5. Dynamic Code Injection

**Status:** Emerging

Agents fetch and inject code on-demand rather than loading all capabilities upfront:

- Agent identifies a need for specific functionality
- Fetches the relevant code module or library
- Injects it into the execution context
- Uses the injected capability for the current task

**Benefits:**
- Reduces initial context bloat
- Enables agent access to evolving code libraries
- Supports plugin architectures

**Atlas UX relevance:** The `CANONICAL_WORKFLOW_KEYS` fallback in engine.ts allows the engine to execute workflows defined in code without requiring a database row. This is a form of dynamic capability injection -- the engine discovers what workflows are available at runtime.

---

## 6. Intelligent Bash Tool Execution

**Status:** Emerging

When agents execute shell commands, enhance the tool with intelligent features:

- **Command validation** -- check for dangerous patterns before execution
- **Output parsing** -- structure raw stdout/stderr into actionable data
- **Timeout management** -- kill long-running commands gracefully
- **Context-aware suggestions** -- recommend commands based on the current task

**Safety considerations:**
- Whitelist allowed commands or command patterns
- Sandbox execution to prevent system-level damage
- Log all commands for audit trail
- Restrict file system access to project directories

**Atlas UX relevance:** Worker processes (`emailSender.ts`, `engineLoop.ts`) execute in isolated Node.js processes. Shell command execution is not directly exposed to agents, which is a safety feature. Any future shell-level agent capabilities should implement strict command whitelisting.

---

## 7. LLM-Friendly API Design

**Status:** Emerging | **Source:** Lukas Moller (Cursor)

Design APIs with explicit consideration for LLM consumption:

- **Explicit versioning** -- make version information clearly visible to the LLM
- **Self-descriptive functionality** -- function names, parameter names, and documentation clearly describe behavior
- **Simplified interaction patterns** -- favor direct calls over complex nested sequences
- **Clear error messaging** -- informative, actionable error responses
- **Reduced indirection** -- minimize layers the LLM must navigate

**Practical guideline:** Structure code so agents navigate through 2 levels of indirection instead of N levels. Flat, readable code is more LLM-friendly than deeply nested abstractions.

**Atlas UX relevance:** The backend routes are organized under `/v1/` with clear naming (`/v1/jobs`, `/v1/agents`, `/v1/decisions`, `/v1/kb`). Each route has explicit parameter validation via Fastify schemas. Error responses include descriptive messages. This LLM-friendly structure means agents could eventually call these APIs directly.

---

## 8. Progressive Tool Discovery

**Status:** Established | **Source:** Anthropic Engineering Team

When agents have access to large tool catalogs, load tool definitions on-demand rather than upfront:

1. **Name only** -- minimal context for initial browsing
2. **Name + description** -- enough to understand tool purpose
3. **Full definition with schemas** -- complete details only when needed

**Filesystem-like hierarchy:**
```
servers/
  google-drive/
    getDocument.ts
    listFiles.ts
  slack/
    sendMessage.ts
  github/
    createIssue.ts
```

Agents explore the hierarchy, discovering capabilities as needed.

**Atlas UX relevance:** Agent tool definitions are loaded per-agent in the engine loop. Each agent's SKILL.md specifies which tools they can use. The enhancement would be dynamic tool discovery -- when an agent encounters an unfamiliar task, it could query available tools and load only relevant definitions into context.

---

## 9. Tool Capability Compartmentalization

**Status:** Emerging

Restrict each agent's tool access to only what their role requires. No agent should have access to all tools.

**Compartmentalization matrix:**
| Agent | Data Access | Communication | Financial | Publishing |
|-------|------------|---------------|-----------|------------|
| Archy (Research) | KB read, web search | None | None | None |
| Sunday (Writer) | KB read/write | None | None | None |
| Kelly (X Publisher) | KB read | X API | None | X publish |
| Tina (CFO) | Financial data | Email (limited) | Spending tools | None |
| Cheryl (Support) | Customer data | Email, chat | None | None |

**Enforcement:** At tool-call time, verify the calling agent has permission for the requested tool before executing.

**Atlas UX relevance:** The `agentTools.ts` file defines available tools for the engine. Currently, all agents have access to the same tool set. Implementing per-agent tool authorization (matching agent role to tool access) would enforce the principle of least privilege.

---

## 10. Tool Selection Guide

**Status:** Emerging

Provide agents with structured guidance on which tool to use for which situation:

```yaml
tool_selection_guide:
  send_message:
    use_when: "Need to notify a user or team about something"
    prefer_over: "email when message is short and time-sensitive"
    avoid_when: "Content is formal or needs record-keeping"
  send_email:
    use_when: "Formal communication or record needed"
    prefer_over: "message when content is longer than 3 paragraphs"
    avoid_when: "Recipient is online and message is urgent"
```

**Atlas UX relevance:** Agent SKILL.md files should include tool selection guidance. Sunday should know when to use `create_kb_document` vs. `delegate_task` to a publisher. Binky should know when to escalate to Atlas vs. handle independently. The tool selection guide becomes part of the agent's system prompt.

---

## 11. Parallel Tool Execution

**Status:** Established

Execute independent tool calls simultaneously rather than sequentially:

```
Sequential: A(100ms) -> B(100ms) -> C(100ms) = 300ms
Parallel:   A(100ms) | B(100ms) | C(100ms) = 100ms
```

**When to parallelize:**
- Tool calls have no data dependencies
- Order of execution does not matter
- Results are aggregated after all calls complete

**Parallel learning:** Training agents on successful parallel execution traces teaches them to identify parallelizable opportunities in future tasks.

**Atlas UX relevance:** The platform intel sweep (WF-093 through WF-105) already runs 13 agent jobs in parallel. The engine loop claims multiple jobs simultaneously via `FOR UPDATE SKIP LOCKED`. The enhancement would be within-agent parallel tool calls -- an agent calling multiple KB searches or API endpoints concurrently within a single reasoning step.

---

## 12. Multi-Platform Webhook Triggers

**Status:** Emerging

Agents respond to events from multiple platforms through a unified webhook ingestion layer:

- GitHub: PR events, issue events, CI results
- Slack: Message events, reaction events
- Stripe: Payment events, subscription changes
- Custom: Internal system events

**Unified processing:**
```
Webhook -> Normalize to common event format -> Route to appropriate agent
```

**Atlas UX relevance:** Atlas already processes events from Telegram (`/v1/telegram`), Microsoft Teams, and internal job completion events. A unified webhook ingestion layer would allow agents to respond to events from any integrated platform through a common routing mechanism.

---

## 13. Multi-Platform Communication Aggregation

**Status:** Emerging

Aggregate communications across platforms into a single agent-readable stream:

- Email (Outlook/Gmail) messages
- Slack/Teams messages
- Telegram messages
- Social media DMs and mentions

The agent sees a unified inbox rather than platform-specific queues.

**Atlas UX implementation:** The MessagingHub component (`/app/messaging`) already aggregates Telegram, Email, and SMS into tabs. The backend equivalent would be a unified message queue that agents can poll regardless of source platform. Cheryl (Support) could handle customer inquiries from any channel through a single tool.

---

## 14. Tool Use Incentivization via Reward Shaping

**Status:** Emerging

During agent training, shape rewards to encourage proper tool use:

- Reward tool calls that retrieve relevant information
- Penalize unnecessary or redundant tool calls
- Reward efficient tool sequences (fewer calls for same result)
- Penalize tool calls that ignore previous results

**Atlas UX relevance:** Agent performance metrics should track tool efficiency. An agent that makes 3 focused API calls to complete a task is better than one making 10 redundant calls. The audit_log can track tool call counts per job, enabling optimization.

---

## 15. Tool Use Steering via Prompting

**Status:** Emerging

Guide agents toward correct tool use through explicit prompting strategies:

- Include tool usage examples in system prompts
- Provide "when to use" and "when not to use" guidance per tool
- Show expected output formats
- Include common error scenarios and recovery strategies

**Example prompt addition:**
```
When searching the KB:
- Use search_kb for broad queries
- Use read_kb_document when you know the document ID
- Always check search results before creating duplicate documents
- If search returns no results, try alternative keywords before concluding the information doesn't exist
```

**Atlas UX relevance:** Agent SKILL.md files should include tool usage guidance. This is more reliable than hoping the model figures out optimal tool use from schema definitions alone.

---

## Atlas UX Integration Notes

Atlas UX's tool architecture spans several layers:

**Tool categories in production:**
- **Communication tools:** send_email, send_telegram_message, Slack/Teams messaging
- **Content tools:** create_kb_document, search_kb, blog publishing
- **Business tools:** create_job, delegate_task, create_decision_memo
- **Social tools:** Platform-specific publishing (X, Facebook, LinkedIn, etc.)
- **Analysis tools:** financial analysis, market research, compliance checking

**Current integration patterns:**
- Tools are defined in `agentTools.ts` and exposed to the engine loop
- External APIs are abstracted behind service functions (graphPost, telegramNotify)
- Tool results are captured in the audit_log for traceability
- Rate limits are enforced at the worker level

**Priority improvements based on these patterns:**
- Implement per-agent tool authorization (pattern 9)
- Add tool selection guidance to agent SKILL.md files (patterns 10, 15)
- Enable parallel tool execution within agent reasoning steps (pattern 11)
- Build a unified webhook ingestion layer for multi-platform events (pattern 12)
- Add tool usage examples to agent system prompts (pattern 15)
- Implement Code Mode-style batch operations for high-volume tasks (pattern 1)
