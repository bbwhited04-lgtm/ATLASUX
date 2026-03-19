# Bad Tool Definitions — Anti-Patterns That Break Agents

## Why Bad Definitions Matter

A tool definition is the only thing an LLM reads before deciding whether and how to use a tool. If the definition is vague, misleading, or incomplete, the agent will misuse the tool, call it at the wrong time, pass garbage inputs, or ignore it entirely. Bad tool definitions are the #1 cause of unreliable agent behavior — not model limitations.

## Anti-Pattern 1: Vague Descriptions

**Bad:**
```json
{
  "name": "process_data",
  "description": "Processes data",
  "parameters": { "type": "object", "properties": { "data": { "type": "string" } } }
}
```

**Why it fails:** The LLM has no idea what "processes" means, what kind of "data" to pass, or what the tool returns. It will either never call it or call it randomly.

**Good:**
```json
{
  "name": "parse_csv_to_json",
  "description": "Parses a CSV string into a JSON array of objects. The first row is treated as column headers. Returns up to 100 rows. Use this when the user provides CSV data that needs to be structured.",
  "parameters": {
    "type": "object",
    "properties": {
      "csv_content": {
        "type": "string",
        "description": "Raw CSV text with comma-separated values. First row must be headers."
      }
    },
    "required": ["csv_content"]
  }
}
```

## Anti-Pattern 2: Missing Parameter Descriptions

**Bad:**
```json
{
  "properties": {
    "q": { "type": "string" },
    "n": { "type": "integer" },
    "fmt": { "type": "string" }
  }
}
```

**Why it fails:** Cryptic parameter names with no descriptions force the LLM to guess. `q` could be "query", "quantity", or "queue". `n` could be "number of results", "name", or "iteration count". The LLM will guess wrong.

**Good:**
```json
{
  "properties": {
    "query": { "type": "string", "description": "Search query text, 3-200 characters" },
    "max_results": { "type": "integer", "description": "Maximum results to return (1-20, default 5)" },
    "format": { "type": "string", "enum": ["json", "markdown", "plain"], "description": "Output format" }
  }
}
```

## Anti-Pattern 3: God Tools That Do Everything

**Bad:**
```json
{
  "name": "database",
  "description": "Interacts with the database. Can read, write, update, delete, migrate, backup, or query any table.",
  "parameters": {
    "operation": { "type": "string" },
    "table": { "type": "string" },
    "data": { "type": "object" }
  }
}
```

**Why it fails:** The tool has unlimited scope. The LLM can't reason about when to use it vs other tools because it overlaps with everything. Worse, a single tool that can DELETE any table is a security nightmare.

**Fix:** Split into focused tools: `query_customers`, `create_appointment`, `update_appointment_status`. Each tool has a clear scope and limited blast radius.

## Anti-Pattern 4: No Error Handling

**Bad:**
```javascript
async function searchProducts(query) {
  const results = await db.query(`SELECT * FROM products WHERE name LIKE '%${query}%'`);
  return results;
}
```

**Why it fails:** Three disasters in one: SQL injection via string interpolation, no error handling (crashes on DB timeout), and returns ALL columns including internal fields. The agent will see raw stack traces on failure.

## Anti-Pattern 5: Returning Raw Database Dumps

**Bad tool response:**
```json
{
  "rows": [
    { "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "tenant_id": "t9i8u7y6-5432-1098-7654-321fedcba098", "created_at": "2025-03-19T14:23:45.123456789Z", "updated_at": "2025-03-19T14:23:45.123456789Z", "deleted_at": null, "version": 3, "lock_token": "xyz", "internal_flags": 42, "name": "John", "phone": "555-0123" }
  ]
}
```

**Why it fails:** The agent needed `name` and `phone`. It got 10 internal fields it doesn't understand, consuming tokens for nothing. Worse, `tenant_id` and `lock_token` are leaking internal state.

**Good response:**
```json
{
  "customers": [
    { "name": "John", "phone": "555-0123" }
  ],
  "total": 1
}
```

## Anti-Pattern 6: Misleading Tool Names

**Bad:**
```json
{ "name": "send_email", "description": "Drafts an email and saves it. Does NOT actually send." }
```

**Why it fails:** The name says "send" but the tool only drafts. The LLM will tell the user "I've sent the email" when it hasn't. Name and behavior must match exactly.

## Anti-Pattern 7: Silent Failures

**Bad:**
```javascript
async function bookAppointment(data) {
  try {
    await calendar.create(data);
    return { success: true };
  } catch (e) {
    return { success: true }; // Swallow error to avoid "breaking" the agent
  }
}
```

**Why it fails:** The tool reports success when it failed. The agent tells the user their appointment is booked. It isn't. The user shows up to an empty calendar. Trust is destroyed.

## Anti-Pattern 8: Undocumented Side Effects

**Bad:**
```json
{
  "name": "get_user_profile",
  "description": "Returns the user's profile information"
}
```
*But internally, this tool also sends a "profile viewed" analytics event, increments a view counter, and logs the viewer's IP address.*

**Why it fails:** The agent thinks it's performing a read-only operation. It has no idea it's triggering side effects. If the agent calls this in a loop to compare profiles, it'll fire hundreds of analytics events and skew metrics.

## Anti-Pattern 9: Credential Leakage

**Bad tool response:**
```json
{
  "status": "connected",
  "api_key": "sk-proj-abc123...",
  "webhook_url": "https://hooks.slack.com/T0123/B456/xyzSecret",
  "database_url": "postgresql://admin:p@ssw0rd@db.internal:5432/prod"
}
```

**Why it fails:** The tool just leaked three secrets into the conversation. The LLM might include these in its response to the user. Even if it doesn't, the credentials are now in API logs, conversation history, and potentially fine-tuning data.

## Anti-Pattern 10: No Input Validation

**Bad:**
```javascript
async function deleteUser(userId) {
  await db.users.delete({ where: { id: userId } });
  return { deleted: true };
}
```

**Why it fails:** No validation that `userId` is a valid UUID, no check that the caller has permission to delete this user, no confirmation step, no soft-delete option. The LLM could pass any string — including another tenant's user ID.

## The Cost of Bad Definitions

Each anti-pattern has a real cost:
- **Vague descriptions** → wasted API calls, wrong tool selections
- **Missing descriptions** → garbage inputs, failed executions
- **God tools** → security vulnerabilities, unpredictable behavior
- **No error handling** → agent confusion, user trust loss
- **Raw dumps** → token waste ($$$), context window pollution
- **Silent failures** → data integrity issues, false confirmations
- **Credential leaks** → security incidents, compliance violations

## Resources

- [Anthropic Tool Use Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview#best-practices-for-tool-definitions) — Official guidance on writing effective tool definitions
- [OpenAI Function Calling — Best Practices](https://platform.openai.com/docs/guides/function-calling#best-practices) — OpenAI's recommendations for function definitions

## Image References

1. Bad vs good tool definition comparison — "bad vs good API function definition comparison diagram"
2. God tool anti-pattern diagram — "monolithic vs microservice API design anti-pattern diagram"
3. SQL injection attack flow — "SQL injection attack vector diagram web application security"
4. Silent failure cascade — "silent failure error swallowing cascade diagram software"
5. Credential leakage flow — "API key leakage data flow diagram security vulnerability"

## Video References

1. [Common API Design Mistakes — CodeOpinion](https://www.youtube.com/watch?v=k_GkJOGPEVk) — Practical examples of API design anti-patterns and how to fix them
2. [OWASP API Security Top 10 — OWASP Foundation](https://www.youtube.com/watch?v=fN1gMKpnbQA) — The most critical API security risks that apply directly to tool definitions
