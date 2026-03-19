# Avoid Returning All Results — Pagination, Filtering, and Result Budgets

## The All-Results Trap

The single most common tool mistake: returning every result from a query. An agent asks "find customers named Smith" and the tool returns all 2,847 Smiths in the database. The LLM's context window fills up, token costs spike, the model loses focus, and the response quality plummets. Worse, the user gets a hallucinated summary of data the model couldn't actually process.

## Why Dumping All Results Kills Agent Performance

**Context window waste** — GPT-4o has 128K tokens. Claude has 200K. That sounds like a lot until a single tool dumps 50K tokens of raw customer records. Now the agent has exhausted 25-40% of its context on one tool call, leaving less room for reasoning, other tool results, and the actual response.

**Token costs** — At $3/million input tokens (Claude Sonnet), dumping 50K tokens costs $0.15 per tool call. Do that 10 times in a conversation and you've spent $1.50 on garbage data the model didn't need.

**LLM confusion** — Models degrade when overwhelmed with data. Given 500 results, the model might correctly reference the first 10 and the last 3, but everything in the middle becomes a blur. The agent will summarize inaccurately or miss the most relevant result entirely.

**Latency** — More tokens = slower response. Users notice when a response takes 15 seconds instead of 3.

## The 5-Result Rule

For most agent interactions, **5 results is enough**. When a user asks "find me a plumber near downtown," they don't need 200 plumbers — they need the best 3-5 options. When an agent searches the knowledge base, 5 relevant articles is more useful than 50 tangentially related ones.

Atlas UX's KB pipeline enforces this: `relevantLimit` defaults to 5 in `getKbContext.ts`, and vector search uses `topK: relevantLimit + 5` to fetch slightly more and then filter down.

## Pattern 1: Server-Side Filtering Before Return

Always filter on the server, not in the LLM:

**Bad:**
```javascript
async function searchCustomers(query) {
  const all = await db.customers.findMany(); // Returns ALL customers
  return all; // Let the LLM figure it out
}
```

**Good:**
```javascript
async function searchCustomers(query, limit = 5) {
  return await db.customers.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ],
    },
    select: { name: true, phone: true, email: true, status: true },
    orderBy: { lastVisit: 'desc' },
    take: limit,
  });
}
```

## Pattern 2: Cursor-Based Pagination

For tools that might need to page through results:

```json
{
  "results": [...],
  "pagination": {
    "cursor": "eyJpZCI6MTAwfQ==",
    "has_more": true,
    "total": 2847
  }
}
```

The agent can decide whether to fetch more. Most of the time, it won't need to.

## Pattern 3: Relevance Scoring and Top-K

For search tools, return the most relevant results — not all matches:

```javascript
const hits = await queryTiered({
  tenantId,
  query,
  tiers: searchTiers,
  topK: 10,      // Only get top 10
  minScore: 0.3, // Ignore low-relevance matches
});
```

Atlas UX's vector search uses both `topK` (result cap) and `minScore` (quality floor) to ensure only useful results make it to the agent.

## Pattern 4: Result Count Hints

Always tell the agent how many total results exist, even when returning a subset:

```json
{
  "summary": "Showing 5 of 2,847 customers matching 'Smith'",
  "results": [...],
  "total": 2847,
  "returned": 5,
  "has_more": true
}
```

This lets the agent tell the user: "I found 2,847 matches. Here are the top 5. Would you like me to narrow the search?"

## Pattern 5: Progressive Disclosure

Return a summary first. Let the agent request details if needed:

**Level 1 — Summary (automatic):**
```json
{
  "appointments_today": 8,
  "next_appointment": { "time": "2 PM", "customer": "Jane Doe", "service": "HVAC repair" },
  "total_revenue_today": "$1,240"
}
```

**Level 2 — Details (only if agent asks):**
```json
{
  "appointments": [
    { "time": "9 AM", "customer": "Bob Wilson", "service": "Plumbing", "status": "completed", "revenue": "$150" },
    ...
  ]
}
```

## Pattern 6: Hard Caps

Always set absolute maximums, even if the LLM requests more:

```javascript
async function handler(params) {
  const limit = Math.min(params.limit ?? 5, 50); // Hard cap at 50
  const results = await search(params.query, limit);
  return results;
}
```

Never let `limit: 999999` reach your database.

## Pattern 7: Streaming for Large Results

If a tool genuinely needs to return large data (e.g., exporting a report), stream it to a file and return the file path:

```json
{
  "status": "export_complete",
  "file": "/tmp/exports/customer-report-2025-03-19.csv",
  "rows": 2847,
  "size_bytes": 145320,
  "message": "Full export saved. Showing preview of first 5 rows.",
  "preview": [...]
}
```

## What Atlas UX Does Right

Atlas UX's `getKbContext` pipeline is a textbook example of result budgeting:

1. **Character budget** — `budgetChars` (default 60,000) caps total context size
2. **Per-doc limit** — `maxDocChars` (default 12,000) prevents one document from dominating
3. **Priority ordering** — Governance → Agent → Relevant → Wiki. If budget runs out, lower-priority docs are dropped.
4. **Relevance filtering** — Vector search uses `minScore: 0.3` to exclude weak matches
5. **Top-K cap** — `relevantLimit` (default 5) limits relevant search results
6. **Truncation** — Documents exceeding budget are truncated, not dropped entirely

## Resources

- [Anthropic: Controlling Output Length](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview) — Best practices for managing tool response sizes
- [Slack API: Pagination](https://api.slack.com/docs/pagination) — Reference implementation of cursor-based pagination for API tools

## Image References

1. Context window utilization diagram — "LLM context window token allocation tool results system prompt diagram"
2. Pagination cursor-based flow — "cursor based pagination API flow diagram next page token"
3. Relevance score distribution — "search relevance score distribution top-K cutoff threshold diagram"
4. Progressive disclosure pattern — "progressive disclosure UI pattern summary detail expand diagram"
5. Token cost scaling graph — "API token cost scaling graph results count vs price linear"

## Video References

1. [Efficient RAG: Reducing Token Costs — AI Engineer Summit](https://www.youtube.com/watch?v=gTCMBZKN3Qk) — Strategies for reducing token usage in retrieval-augmented systems
2. [API Pagination Best Practices — Postman](https://www.youtube.com/watch?v=WUICbOOtAic) — Complete guide to implementing pagination in APIs
