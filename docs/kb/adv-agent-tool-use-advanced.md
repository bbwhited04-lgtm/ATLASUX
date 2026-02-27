# Advanced Agent Tool Use Patterns

> Comprehensive guide to tool integration patterns for autonomous AI agents. Covers
> tool definition best practices, agents-as-tools, multi-step tool calling, MCP
> standardization, and security considerations.
> Audience: Platform engineers, AI architects, and integration developers.

---

## 1. Overview

Tools are what make an AI agent more than a text generator. Without tools, an LLM can
only produce text. With tools, it can send emails, query databases, execute code,
search the web, manage calendars, and coordinate with other systems.

However, tool use at scale introduces challenges that simple function calling tutorials
do not address: how to define tools so LLMs select them correctly, how to chain tool
calls across multiple steps, how to use entire agents as tools for other agents, how
to standardize tool exposure across frameworks, and how to maintain security when
agents invoke tools with real-world side effects.

Atlas UX agents collectively use dozens of tools — from Outlook email to Slack
messaging to Telegram notifications to Reddit posting. This document captures the
advanced patterns that make tool ecosystems reliable, secure, and maintainable.

---

## 2. Tool Definition Best Practices

### 2.1 Why Definitions Matter

The tool definition is the only information the LLM has when deciding which tool to
call and how to call it. A poorly defined tool leads to:
- Wrong tool selection (the LLM picks tool A when tool B was appropriate)
- Wrong parameter values (the LLM misinterprets what a parameter expects)
- Unnecessary tool calls (the LLM calls a tool when it could answer from context)
- Missed tool calls (the LLM answers from (stale) training data instead of calling a tool)

### 2.2 Anatomy of a Good Tool Definition

```json
{
  "name": "search_knowledge_base",
  "description": "Search the tenant's knowledge base for documents matching a query. Returns document titles, snippets, and relevance scores. Use this when the agent needs factual information about company policies, procedures, market research, or previously generated content. Do NOT use for real-time data — use web_search for that.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Natural language search query. Be specific — 'Q2 revenue targets' works better than 'revenue'."
      },
      "max_results": {
        "type": "integer",
        "description": "Maximum number of results to return. Default: 5. Range: 1-20.",
        "default": 5
      },
      "filter_status": {
        "type": "string",
        "enum": ["published", "draft", "archived"],
        "description": "Only return documents with this status. Default: published.",
        "default": "published"
      }
    },
    "required": ["query"]
  }
}
```

### 2.3 Definition Checklist

| Element | Requirement | Why |
|---------|-------------|-----|
| Name | Verb_noun format, unambiguous | LLM uses name as primary signal for selection |
| Description | 2-3 sentences: what it does, when to use, when NOT to use | Prevents wrong tool selection |
| Parameter descriptions | Include format, range, examples | Prevents wrong parameter values |
| Required vs optional | Mark clearly | Prevents missing required fields |
| Enum values | List all valid options | Prevents invalid parameter values |
| Default values | Document explicitly | LLM can omit optional params confidently |
| Error behavior | Document what errors look like | Agent can plan for error handling |

### 2.4 The "When NOT to Use" Pattern

Including negative guidance in tool descriptions dramatically reduces incorrect tool
selection:

```
"description": "Send an email via Microsoft Graph. Use for external communication
to people outside the organization. Do NOT use for internal agent-to-agent
communication (use delegate_task instead). Do NOT use for Telegram messages
(use send_telegram_message instead)."
```

This negative guidance is especially important when tools have overlapping
capabilities. Atlas UX has multiple communication channels (email, Telegram, Slack,
Teams) and the agent must select the correct one for each context.

---

## 3. Agents-as-Tools

### 3.1 Concept

An agent-as-tool is a pattern where one agent is exposed to another agent as a
callable tool. The calling agent invokes the tool with a request, and the tool agent
executes autonomously and returns a result.

```
[Calling Agent]
    |
    | calls "research_agent" tool with { topic: "AI market trends" }
    v
[Research Agent] -- autonomous execution: plan, search, synthesize
    |
    | returns { report: "...", confidence: 0.87 }
    v
[Calling Agent] -- continues with research results
```

### 3.2 Why Agents-as-Tools

**Encapsulation:** The calling agent does not need to know how the tool agent works.
It only needs to know what the tool agent can do (the tool definition).

**Reusability:** The same research agent can be used as a tool by Atlas, Binky, Tina,
or any other agent that needs research.

**Specialization:** Each tool agent can use its own specialized tools, system prompt,
and reasoning strategy. The calling agent gets the benefit of that specialization
without the complexity.

**Composability:** Complex workflows emerge from agents calling agents calling agents.
Each layer focuses on its level of abstraction.

### 3.3 Implementation Pattern

```typescript
// Expose an agent as a tool
{
  name: "delegate_to_archy",
  description: "Delegate a research task to Archy (Research Specialist). Archy will conduct multi-source research and return a structured brief. Use for market research, competitive analysis, trend identification, or fact-checking. Async — results may take 1-5 minutes.",
  parameters: {
    type: "object",
    properties: {
      objective: {
        type: "string",
        description: "Clear research objective. Include specific questions to answer."
      },
      depth: {
        type: "string",
        enum: ["quick", "standard", "deep"],
        description: "Research depth. 'quick' = 1 search iteration, 'standard' = 3, 'deep' = 5+."
      },
      deadline_minutes: {
        type: "integer",
        description: "Maximum time Archy should spend. Default: 5.",
        default: 5
      }
    },
    required: ["objective"]
  }
}
```

### 3.4 Atlas UX Agent-as-Tool Examples

| Calling Agent | Tool Agent | Use Case |
|---------------|-----------|----------|
| Atlas | Archy | Research for strategic decisions |
| Atlas | Tina | Financial analysis for budget allocation |
| Binky | Sunday | Content creation for marketing campaigns |
| Sunday | Venny | Image generation for blog/social posts |
| Venny | Victor | Video production from image assets |
| Any agent | Cheryl | Customer impact assessment |

### 3.5 Synchronous vs. Asynchronous Agent-as-Tool

**Synchronous:** The calling agent blocks until the tool agent returns. Appropriate
for fast tool agents (< 30 seconds).

**Asynchronous:** The calling agent creates a job for the tool agent and continues
with other work. The tool agent's result is picked up in a subsequent engine tick.
Appropriate for slow tool agents (research, content generation, media production).

Atlas UX uses the asynchronous pattern for most agent-as-tool calls. The job queue
manages the lifecycle: the calling agent creates a job targeting the tool agent, the
engine loop dispatches it, and the result is stored for the calling agent to consume
on its next tick.

---

## 4. Google ADK Built-in Tools

### 4.1 Google Search

Provides real-time web search capabilities directly within an agent's tool set.

```python
from google.adk.tools import google_search

agent = Agent(
    name="research_agent",
    tools=[google_search]
)
```

The agent calls `google_search` like any other tool, receiving structured results
with titles, snippets, and URLs. The search is executed server-side by Google,
eliminating the need to manage search API keys or rate limits at the agent level.

### 4.2 Code Execution (BuiltInCodeExecutor)

A sandboxed code execution environment that agents can use to run Python code.

```python
from google.adk.tools import BuiltInCodeExecutor

agent = Agent(
    name="analyst_agent",
    tools=[BuiltInCodeExecutor()]
)
```

**Use cases:**
- Data analysis: the agent writes Python to process CSV/JSON data
- Calculations: the agent offloads math to code instead of reasoning about it
- Validation: the agent writes test code to verify its own outputs
- Visualization: the agent generates charts and graphs

**Security:** Code runs in a sandboxed environment with no network access, limited
filesystem access, and execution time limits. The agent cannot use code execution to
escape its sandbox.

**Atlas UX parallel:** Atlas UX does not currently offer sandboxed code execution to
agents. Adding this capability (via ADK's BuiltInCodeExecutor or a custom sandbox)
would enable Tina to perform financial calculations, Archy to run data analysis, and
Daily-Intel to process numerical KPIs programmatically.

### 4.3 Vertex AI Search (VSearchAgent)

An enterprise search tool that queries indexed corporate data (documents, databases,
websites) using Google's retrieval infrastructure.

```python
from google.adk.tools import VSearchAgent

corporate_search = VSearchAgent(
    data_store_id="projects/my-project/locations/global/dataStores/my-store"
)

agent = Agent(
    name="support_agent",
    tools=[corporate_search]
)
```

**Atlas UX parallel:** Atlas UX's knowledge base search (`search_knowledge_base` tool)
serves a similar function — agents query the tenant's KB for policies, research, and
previously generated content. Migrating to a Vertex AI Search backend would provide
better semantic search quality and automatic re-ranking.

### 4.4 Vertex Extensions

Pre-built integrations with Google services (Gmail, Calendar, Drive, Maps) that are
exposed as agent tools.

**Atlas UX parallel:** Atlas UX's `agentTools.ts` provides equivalent integrations
for Microsoft services (Outlook, Teams, SharePoint) and social platforms. The pattern
is the same — pre-built tool functions that handle authentication, API calls, and
error wrapping.

---

## 5. Multi-Step Tool Calling

### 5.1 What It Is

Multi-step tool calling is when an agent makes multiple tool calls within a single
reasoning turn, where the output of one tool call informs the next.

```
Agent Reasoning Turn:
  1. Call search_knowledge_base("Q2 revenue targets") -> results
  2. Examine results -> identify that budget data is missing
  3. Call get_financial_summary("Q2", "budget") -> budget data
  4. Combine KB results + budget data
  5. Call create_report(combined_data) -> report created
  6. Return final response to user
```

### 5.2 Sequential Multi-Step

Each tool call depends on the previous result:
```
[Tool A] -> result_a -> [Tool B(result_a)] -> result_b -> [Tool C(result_b)]
```

This is the most common pattern. The agent gathers information progressively,
with each step narrowing the focus based on what was learned.

### 5.3 Parallel Multi-Step

Multiple tool calls are independent and can execute simultaneously:
```
[Tool A] ---------> result_a \
[Tool B] ---------> result_b  }-> [Synthesis]
[Tool C] ---------> result_c /
```

Some LLM APIs support parallel tool calling natively — the model returns multiple
tool calls in a single response, the runtime executes them concurrently, and the
results are returned together.

### 5.4 Branching Multi-Step

The agent's next tool call depends on a conditional evaluation of the current result:
```
[Tool A] -> result_a
  IF result_a.status == "found":
    [Tool B(result_a.data)]
  ELSE:
    [Tool C(alternative_query)]
```

### 5.5 Atlas UX Multi-Step Patterns

**Content creation pipeline (within a single agent tick):**
```
Sunday's execution:
  1. search_knowledge_base("latest research on [topic]") -> research
  2. IF research.results.length > 0:
       generate_content(research.results) -> draft
     ELSE:
       delegate_to_archy({ objective: "Research [topic]" }) -> async job
       RETURN (wait for next tick)
  3. quality_check(draft) -> score
  4. IF score > 0.8:
       delegate_to_venny({ content: draft, type: "header_image" })
     ELSE:
       LOOP back to step 2 with refinement notes
```

**Financial analysis (Tina within a single tick):**
```
  1. get_financial_summary("current_month") -> financials
  2. get_pending_expenses() -> pending
  3. calculate_runway(financials, pending) -> runway
  4. IF runway < 3_months:
       create_decision_memo({ type: "budget_alert", risk: 3 })
     ELSE:
       log_audit_entry({ action: "financial_health_check", status: "healthy" })
```

---

## 6. Tool Selection Strategies

### 6.1 How LLMs Choose Tools

When presented with a list of available tools, an LLM selects a tool based on:

1. **Name matching:** The tool name semantically matches the task. `send_email` is
   a strong match for "email this to the client."
2. **Description matching:** The tool description matches the intent. The "when to use"
   section is particularly influential.
3. **Parameter compatibility:** The agent has (or can derive) the required parameters.
4. **Negative signals:** The "when NOT to use" section steers the agent away from
   incorrect selections.
5. **Recency bias:** If the agent recently used a tool successfully, it may prefer
   that tool for similar tasks. This can be positive (learning) or negative (habit).

### 6.2 Strategies for Improving Selection

**Reduce tool count:** LLMs perform worse at tool selection as the number of
available tools increases. If an agent has 30 tools but typically needs 5-7 for any
given task type, consider dynamic tool loading — present only relevant tools based on
the task category.

**Group related tools:** Prefix related tools with a common namespace:
```
email_send, email_search, email_draft
slack_send, slack_search, slack_react
telegram_send, telegram_set_default_chat
```

**Add disambiguation:** When tools have similar purposes, add explicit disambiguation:
```
"email_send": "Send email via Microsoft Graph. For EXTERNAL recipients only."
"slack_send": "Send Slack message. For INTERNAL team communication only."
"telegram_send": "Send Telegram message. For real-time alerts and notifications."
```

**Atlas UX tool loading:** The engine loop builds each agent's tool set based on the
agent's configuration. Publisher agents get social platform tools; financial agents get
budget tools; communication agents get messaging tools. This per-agent tool scoping
reduces selection confusion.

---

## 7. Error Handling Patterns

### 7.1 The Error Taxonomy

| Error Type | Example | Recovery Strategy |
|------------|---------|-------------------|
| Transient | API timeout, rate limit | Retry with exponential backoff |
| Auth | Expired token, revoked access | Refresh credentials, retry |
| Input | Invalid parameter value | Fix parameter, retry |
| Not Found | Resource does not exist | Report to agent, replan |
| Permanent | API deprecated, feature removed | Use fallback tool |
| Quota | Daily limit reached | Queue for later, notify supervisor |

### 7.2 Graceful Degradation

When a primary tool fails, the agent should attempt alternatives before failing:

```
Primary:   Microsoft Graph email -> FAILED (quota exceeded)
Fallback:  Resend API email -> FAILED (API key invalid)
Fallback:  Queue as EMAIL_SEND job for worker -> SUCCESS (deferred)
Last resort: Notify supervisor that email delivery is impaired
```

Atlas UX's email system implements exactly this pattern. The primary path is Microsoft
Graph (MS_SENDER_UPN). If Graph fails, the system can fall back to Resend. If both
fail, the job remains in the queue for manual intervention.

### 7.3 Retry Strategy

```
Attempt 1: Immediate
Attempt 2: Wait 2 seconds
Attempt 3: Wait 8 seconds (exponential backoff)
Attempt 4: FAIL — escalate to error handler
```

**Jitter:** Add random jitter to retry delays to avoid thundering herd when multiple
agents retry simultaneously:
```
delay = base_delay * (2 ^ attempt) + random(0, base_delay)
```

### 7.4 Error Wrapping for LLM Consumption

Raw API errors are often cryptic. Tool implementations should wrap errors in
LLM-friendly messages:

```json
// Bad — the LLM cannot act on this
{ "error": "ECONNREFUSED 10.0.0.5:443" }

// Good — the LLM can decide what to do
{
  "error": true,
  "type": "transient",
  "message": "The email service is temporarily unavailable. This is likely a transient issue. Retry in 30 seconds or use an alternative communication channel.",
  "retry_after_seconds": 30,
  "alternatives": ["slack_send", "telegram_send"]
}
```

### 7.5 Atlas UX Error Handling in Practice

The engine loop's job processing includes standard error handling:

```
1. Execute tool call
2. IF success: update job status to completed
3. IF transient error: increment retry count, re-queue with backoff
4. IF permanent error: mark job as failed, log to audit trail
5. IF retry count > max_retries: mark as failed, escalate to supervisor
```

The `optimistic locking pattern` (see MEMORY.md) ensures that failed jobs are not
picked up by multiple workers simultaneously — only one worker claims a job at a time.

---

## 8. Model Context Protocol (MCP) — Deep Dive

### 8.1 The Standardization Problem

Every AI framework implements its own tool format:
- OpenAI uses `functions` with JSON Schema parameters
- Anthropic uses `tools` with input schemas
- Google ADK uses Python function decorators
- LangChain uses `StructuredTool` with Pydantic models

An MCP server exposes tools once, and any MCP-compatible client can use them —
regardless of the underlying LLM framework.

### 8.2 Server Architecture

```
MCP Server
├── Tools (callable functions)
│   ├── search_knowledge_base
│   ├── send_email
│   └── create_task
├── Resources (readable data)
│   ├── company_policy.md
│   ├── product_catalog.json
│   └── team_directory.json
└── Prompts (reusable templates)
    ├── research_brief
    ├── customer_response
    └── financial_analysis
```

**Tools** are functions the agent can call (write operations).
**Resources** are data the agent can read (read operations).
**Prompts** are templates that structure agent behavior for specific tasks.

### 8.3 Transport Options

| Transport | Use Case | Latency | Security |
|-----------|----------|---------|----------|
| Stdio | Local development, same-machine tools | Minimal | Process isolation |
| HTTP + SSE | Remote tools, cloud services | Network-dependent | TLS + auth tokens |
| Custom | Specialized environments | Variable | Custom |

### 8.4 Capability Negotiation

When an MCP client connects to a server, they negotiate capabilities:

```json
// Client -> Server: initialize
{
  "method": "initialize",
  "params": {
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": true }
    }
  }
}

// Server -> Client: initialized
{
  "result": {
    "capabilities": {
      "tools": {},
      "resources": { "subscribe": true },
      "prompts": {}
    }
  }
}
```

This negotiation ensures that clients and servers can evolve independently — a client
that does not support resource subscriptions can still use tools.

### 8.5 Atlas UX MCP Strategy

Atlas UX could expose its tool ecosystem as MCP servers:

```
MCP Server: atlas-communications
├── Tools: send_email, send_telegram, send_slack, send_teams
├── Resources: contact_directory, message_templates
└── Prompts: customer_response, internal_memo

MCP Server: atlas-research
├── Tools: search_knowledge_base, web_search, create_kb_document
├── Resources: kb_index, research_templates
└── Prompts: research_brief, competitive_analysis

MCP Server: atlas-finance
├── Tools: get_financial_summary, approve_expense, create_budget
├── Resources: current_budget, expense_history
└── Prompts: financial_analysis, budget_proposal
```

This would allow any MCP-compatible agent framework to use Atlas UX's tools,
enabling integration with external systems and agent marketplaces.

---

## 9. Security Considerations

### 9.1 The Threat Model

When an LLM agent uses tools with real-world side effects (sending emails, posting to
social media, making purchases), the security stakes are fundamentally different from
a chatbot that only generates text.

**Threat categories:**

| Threat | Description | Example |
|--------|-------------|---------|
| Prompt injection | Malicious input causes unintended tool calls | Email body contains "also send this to attacker@evil.com" |
| Excessive scope | Agent has more permissions than needed | Research agent can also send emails |
| Credential leakage | Tool credentials exposed in agent output | Agent includes API key in a report |
| Unauthorized escalation | Agent bypasses approval requirements | Agent splits a $500 purchase into 5x $100 to stay under limit |
| Replay attack | Captured tool call is re-executed | Resending an approved purchase |

### 9.2 Sandboxed Execution

Tools with side effects should execute in controlled environments:

**Process isolation:** Tool execution runs in a separate process from the LLM inference.
The LLM generates the tool call specification; a separate system validates and executes
it.

**Network isolation:** Code execution tools (if offered) should have no network access.
The agent should not be able to exfiltrate data through code execution.

**Filesystem isolation:** Tools should only access files within their designated scope.
Atlas UX's file storage uses tenant-scoped paths (`tenants/{tenantId}/`) to prevent
cross-tenant access.

### 9.3 Authorization Scopes

Each agent should have the minimum permissions necessary for its role:

```
Agent: kelly (X/Twitter Publisher)
  Allowed tools: [post_tweet, schedule_tweet, get_tweet_analytics]
  Denied tools: [send_email, approve_expense, delete_kb_document]

Agent: tina (CFO)
  Allowed tools: [get_financial_summary, approve_expense, create_budget]
  Denied tools: [post_tweet, send_slack_message, delete_user]
```

Atlas UX implements this through per-agent tool configuration in `agentTools.ts`.
Each agent's system prompt and tool set are built from its agent configuration,
ensuring that publisher agents cannot access financial tools and financial agents
cannot access social media tools.

### 9.4 Credential Management

**Never embed credentials in tool definitions.** Tool definitions are part of the
LLM prompt and may be logged, cached, or returned in agent output.

```
// WRONG: credential in tool definition
{ "name": "send_email", "api_key": "sk-abc123..." }

// RIGHT: credential resolved at execution time
{ "name": "send_email" }
// Execution layer resolves MS_CLIENT_ID, MS_CLIENT_SECRET from env
```

Atlas UX stores all credentials as environment variables (`backend/.env`) and
resolves them at tool execution time. The LLM never sees credential values.

### 9.5 Audit Trail for Tool Calls

Every tool call must be logged:

```json
{
  "action": "TOOL_CALL",
  "agentId": "sunday",
  "tool": "delegate_to_venny",
  "parameters": { "content": "...", "type": "header_image" },
  "result": { "status": "queued", "jobId": "job-uuid" },
  "timestamp": "2026-02-27T14:30:00Z",
  "tenantId": "tenant-uuid"
}
```

Atlas UX's `auditPlugin` ensures that all mutations — including tool calls — are
logged to the `audit_log` table. This is a hard requirement for Alpha compliance
and is non-negotiable.

### 9.6 Rate Limiting

Tools with cost implications (API calls, email sending, social posting) must be
rate-limited:

```
Rate limits per agent per day:
  send_email: 100
  post_tweet: 20
  approve_expense: 10
  web_search: 500
```

Atlas UX enforces `MAX_ACTIONS_PER_DAY` at the engine level and per-tool rate limits
via Fastify route-level rate limiting configuration.

---

## 10. The Atlas UX Tool Ecosystem

### 10.1 Communication Tools

| Tool | Service | Agent Users |
|------|---------|-------------|
| send_email | Microsoft Graph | atlas, binky, sunday, cheryl |
| send_telegram_message | Telegram Bot API | any (keyword triggered) |
| send_slack_message | Slack API | internal agents |
| send_teams_message | MS Teams Graph API | internal agents |

### 10.2 Content Tools

| Tool | Service | Agent Users |
|------|---------|-------------|
| search_knowledge_base | Supabase KB | all agents |
| create_kb_document | Supabase KB | archy, sunday, daily-intel |
| generate_image | Image generation API | venny |
| generate_video | Video generation API | victor |

### 10.3 Social Platform Tools

| Tool | Service | Agent Users |
|------|---------|-------------|
| post_tweet | X/Twitter API | kelly |
| post_facebook | Facebook Graph | fran |
| post_threads | Threads API | dwight |
| post_tiktok | TikTok API | timmy |
| post_reddit | Reddit API | donna |
| post_linkedin | LinkedIn API | link |
| post_pinterest | Pinterest API | cornwall |
| post_tumblr | Tumblr API | terry |
| post_blog | Blog CMS | reynolds |

### 10.4 Business Tools

| Tool | Service | Agent Users |
|------|---------|-------------|
| get_financial_summary | Internal DB | tina |
| approve_expense | Decision memo system | tina, atlas |
| create_task | Job queue | atlas, binky, department heads |
| delegate_task | Job queue | any supervisor agent |
| schedule_workflow | Scheduler | atlas |

---

## 11. Key Takeaways

1. **Tool definitions are prompts.** Treat them with the same care you treat system
   prompts. The quality of the definition directly determines selection accuracy.

2. **Agents-as-tools enable composability.** Complex workflows emerge from agents
   calling agents. Each layer focuses on its abstraction level.

3. **Multi-step tool calling is the norm, not the exception.** Real tasks require
   sequential, parallel, and branching tool call patterns within a single agent turn.

4. **MCP standardizes tool exposure.** Instead of building tool adapters for every
   framework, expose tools once via MCP and let any client consume them.

5. **Security is non-negotiable when tools have side effects.** Sandbox execution,
   scope permissions per agent, never embed credentials, audit every call, rate-limit
   everything with cost implications.

6. **Error handling determines reliability.** Graceful degradation with fallback tools,
   exponential backoff with jitter, and LLM-friendly error messages keep the system
   running when individual tools fail.

7. **Dynamic tool loading reduces selection confusion.** Present only the tools
   relevant to the current task category rather than the full tool catalog.
