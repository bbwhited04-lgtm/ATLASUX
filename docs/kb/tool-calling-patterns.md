# Tool Calling Patterns

## Overview

Atlas UX agents interact with external systems and internal data through a
structured tool-calling interface. Tools are defined in `backend/src/tools/agentTools.ts`
and registered with the AI provider as function definitions. The engine mediates
all tool calls, enforcing permissions, logging audit trails, and handling errors.

## Tool Registration

Tools are registered as an array of function definitions passed to the LLM's
`tools` parameter on each completion call. Each tool definition includes:

```typescript
{
  type: "function",
  function: {
    name: "search_atlasux_knowledge",
    description: "Search the organization's knowledge base for relevant information.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
        category: { type: "string", description: "Optional category filter" },
        max_results: { type: "number", description: "Max results (default 5)" }
      },
      required: ["query"]
    }
  }
}
```

The `agentTools.ts` file exports a function that returns the tool array filtered
by the calling agent's role. Not all agents have access to all tools.

## Available Tools

### search_atlasux_knowledge

**Purpose**: Search the KB via RAG (vector similarity on kb_chunks).
**Parameters**: `query` (required), `category` (optional), `max_results` (optional)
**Returns**: Array of matching document chunks with similarity scores.
**Access**: All agents.

### search_my_memories

**Purpose**: Search the agent's own episodic memories and organizational history.
**Parameters**: `query` (required), `sources` (optional array: "memory", "audit", "workflows", "kb")
**Returns**: Merged, ranked results from up to 4 sources.
**Access**: All agents.

### get_subscription_info

**Purpose**: Retrieve the current tenant's subscription plan and usage stats.
**Parameters**: None (tenant_id from context).
**Returns**: Plan name, token usage, storage usage, agent count, limits.
**Access**: Atlas, Binky, Tina (finance-relevant roles).

### get_team_members

**Purpose**: List all agents and users in the current tenant.
**Parameters**: `role_filter` (optional), `status_filter` (optional)
**Returns**: Array of team members with roles, status, and last active time.
**Access**: Atlas, Binky, Petra (management roles).

### send_telegram_message

**Purpose**: Send a message to a configured Telegram chat.
**Parameters**: `message` (required), `chat_id` (optional, defaults to saved default)
**Returns**: Confirmation with message ID.
**Access**: All agents. Triggered by keywords: "telegram", "notify me", "ping me", "alert me".
**Implementation**: Uses `backend/src/lib/telegramNotify.ts`.

### post_to_x

**Purpose**: Publish a post to X (Twitter) via the platform's OAuth connection.
**Parameters**: `content` (required), `media_urls` (optional array)
**Returns**: Post URL and engagement metrics placeholder.
**Access**: Kelly (X specialist), Sunday (comms lead), Atlas (CEO override).

### search_x

**Purpose**: Search X for mentions, hashtags, or topics.
**Parameters**: `query` (required), `max_results` (optional)
**Returns**: Array of matching posts with author, content, metrics.
**Access**: Kelly, Sunday, Archy (research), Daily-Intel.

### delegate_task

**Purpose**: Assign a task to another agent via the job queue.
**Parameters**: `target_agent` (required), `task_description` (required),
  `priority` (optional: "low", "normal", "high", "urgent"), `deadline` (optional)
**Returns**: Job ID and confirmation.
**Access**: Atlas, Binky, Sunday, Petra (agents with delegation authority).

## Tool Execution Flow

The complete lifecycle of a tool call:

```
1. Agent LLM generates a tool_call in its response
   └─ { name: "send_telegram_message", arguments: { message: "Deploy complete" } }

2. Engine receives the tool_call from the LLM response
   └─ Parses the function name and arguments

3. Permission check
   └─ Engine looks up the agent's role in the permission matrix
   └─ If denied: returns error message to agent context, logs to audit_log
   └─ If allowed: proceeds to execution

4. Argument validation
   └─ Required parameters present?
   └─ Types match schema?
   └─ Values within allowed ranges?
   └─ If invalid: returns validation error to agent context

5. Tool execution
   └─ The corresponding handler function is invoked
   └─ Handler has access to: tenant_id, agent_id, validated arguments
   └─ External API calls are wrapped in try/catch with timeout (30s default)

6. Audit logging
   └─ Every tool invocation is logged to audit_log:
       action: "TOOL_CALL"
       entityType: "tool"
       entityId: tool_name
       meta: { arguments, result_summary, duration_ms, success: boolean }

7. Result injection
   └─ Tool result is added to the conversation as a tool_result message
   └─ Agent continues generating its response with the new context

8. If the agent generates another tool_call, repeat from step 2
```

## Error Handling and Retry Logic

Tool execution errors are categorized into three types:

### Transient Errors (Retryable)

Network timeouts, rate limits (429), temporary service unavailability (503).
The engine retries up to **3 times** with exponential backoff:

- Retry 1: 1 second delay
- Retry 2: 3 seconds delay
- Retry 3: 9 seconds delay

After 3 failures, the error is returned to the agent with a message suggesting
it try again later or use an alternative approach.

### Permanent Errors (Non-Retryable)

Authentication failures (401), forbidden (403), not found (404), validation
errors (400). These are returned immediately to the agent without retry.

### Internal Errors (Logged and Suppressed)

Unexpected exceptions in tool handler code. These are caught, logged to
`audit_log` with `level: "error"`, and the agent receives a generic error:
"Tool execution failed. The error has been logged for investigation."

The agent is never exposed to stack traces or internal implementation details.

## Audit Trail

Every tool invocation generates an audit log entry regardless of outcome:

```typescript
await prisma.auditLog.create({
  data: {
    tenantId,
    actorType: "agent",
    actorExternalId: agentId,
    level: success ? "info" : "error",
    action: "TOOL_CALL",
    entityType: "tool",
    entityId: toolName,
    message: `Agent ${agentId} called ${toolName}: ${success ? "success" : "failed"}`,
    meta: {
      arguments: sanitizedArgs,   // sensitive fields redacted
      result: truncatedResult,     // max 1000 chars
      duration_ms: elapsed,
      error: errorMessage || null,
      retry_count: retries
    },
    timestamp: new Date()
  }
} as any).catch(() => null);
```

Arguments are sanitized before logging — fields named `password`, `secret`,
`token`, or `key` are replaced with `"[REDACTED]"`.

## Permission Matrix

Not all agents can invoke all tools. The permission matrix is enforced by the
engine before tool execution:

| Tool | Atlas | Binky | Tina | Sunday | Publishers | Archy | Daily-Intel | Others |
|------|-------|-------|------|--------|------------|-------|-------------|--------|
| search_atlasux_knowledge | Y | Y | Y | Y | Y | Y | Y | Y |
| search_my_memories | Y | Y | Y | Y | Y | Y | Y | Y |
| get_subscription_info | Y | Y | Y | N | N | N | N | N |
| get_team_members | Y | Y | N | N | N | N | N | N |
| send_telegram_message | Y | Y | Y | Y | Y | Y | Y | Y |
| post_to_x | Y | N | N | Y | Kelly only | N | N | N |
| search_x | Y | N | N | Y | Kelly only | Y | Y | N |
| delegate_task | Y | Y | N | Y | N | N | N | Petra |

"Publishers" refers to Kelly, Fran, Dwight, Timmy, Terry, Cornwall, Link,
Emma, Donna, Reynolds, and Penny. Each publisher agent has tool access specific
to their platform.

## Adding New Tools

To register a new tool:

1. Define the function schema in `agentTools.ts` following the existing pattern
2. Implement the handler function (typically in `backend/src/tools/` or inline)
3. Add the tool to the permission matrix for appropriate agent roles
4. Add audit logging inside the handler
5. Write the tool's description clearly — the agent relies on it to decide
   when and how to use the tool
6. Test with a targeted agent to verify the tool appears in the LLM's
   available functions and produces correct results

## Tool Call Limits

To prevent runaway tool usage:

- **Max tool calls per engine tick**: 10 (per agent)
- **Max total tool calls per day**: governed by `MAX_ACTIONS_PER_DAY` env var
- **Tool call timeout**: 30 seconds per invocation
- **Parallel tool calls**: Not supported; tools execute sequentially within
  a single agent turn

If an agent exceeds the per-tick limit, remaining tool calls are queued for
the next engine tick (5 seconds later).
