# Providing Clean Tool Outputs — What to Return and How to Format It

## Every Token Costs Money and Attention

When a tool returns results, those results are injected into the LLM's context window. Every unnecessary field, every extra row, every verbose error message consumes tokens — which cost real money and dilute the model's attention. A tool that returns 5,000 tokens of raw database output when the agent needed 200 tokens of relevant data is wasting 96% of its budget.

## Principle 1: Return Only What the Agent Needs

**Bad — Raw database dump:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tenant_id": "t9i8u7y6-5432-1098-7654-321fedcba098",
  "created_at": "2025-03-19T14:23:45.123456789Z",
  "updated_at": "2025-03-19T14:23:45.123456789Z",
  "deleted_at": null,
  "version": 3,
  "lock_version": 7,
  "internal_flags": 42,
  "search_vector": "tsvector...",
  "name": "John Smith",
  "phone": "+15551234567",
  "email": "john@example.com",
  "status": "active"
}
```

**Good — Projected response:**
```json
{
  "name": "John Smith",
  "phone": "+15551234567",
  "email": "john@example.com",
  "status": "active"
}
```

The agent needed 4 fields. The bad response returned 12, including internal metadata (`tenant_id`, `lock_version`, `search_vector`) that leaks implementation details.

## Principle 2: Use Consistent Response Envelopes

Wrap all tool responses in a consistent structure so the agent knows what to expect:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 47,
    "returned": 5,
    "has_more": true
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again in 30 seconds.",
    "retryable": true,
    "retry_after_ms": 30000
  }
}
```

## Principle 3: Summary First, Details Second

Lead with the answer. Put details after:

**Bad:**
```json
{
  "appointments": [
    { "id": "...", "date": "2025-03-20", "time": "9:00", "service": "plumbing", "technician": "Mike", "status": "confirmed", "notes": "Kitchen sink leak", "created": "..." },
    { "id": "...", "date": "2025-03-22", "time": "14:00", "service": "hvac", "technician": "Sarah", "status": "pending", "notes": "AC not cooling", "created": "..." }
  ]
}
```

**Good:**
```json
{
  "summary": "2 upcoming appointments found",
  "appointments": [
    { "date": "Mar 20, 9 AM", "service": "Plumbing repair", "tech": "Mike", "status": "confirmed" },
    { "date": "Mar 22, 2 PM", "service": "HVAC repair", "tech": "Sarah", "status": "pending" }
  ]
}
```

## Principle 4: Token-Aware Truncation

Set hard limits on response size. Atlas UX's KB context pipeline uses a `budgetChars` limit (default 60,000) and truncates documents that exceed `maxDocChars` (default 12,000):

```typescript
const content = (doc.body ?? "").slice(0, maxDocChars);
```

For tool responses, apply similar budgets:
- **Summary tools:** 500 tokens max
- **Search tools:** 2,000 tokens max (5 results × 400 tokens each)
- **Detail tools:** 5,000 tokens max
- **Bulk tools:** Always paginate, never return everything

## Principle 5: Format for LLM Consumption

Different formats work better for different tool types:

| Use Case | Best Format | Why |
|----------|-------------|-----|
| Structured data | JSON | LLMs parse JSON reliably |
| Comparison data | Markdown table | Easy to read and reference |
| Sequential steps | Numbered list | Clear ordering |
| Status reports | Key-value pairs | Scannable |
| Large text | Markdown with headers | Navigable sections |
| Error messages | Plain text | Minimal overhead |

## Principle 6: Strip Internal Metadata

Never return:
- Database IDs (unless the agent needs them for follow-up calls)
- Tenant IDs (the agent already knows its tenant)
- Timestamps with nanosecond precision (round to seconds or use relative: "2 hours ago")
- Internal flags, lock tokens, version numbers
- Raw SQL, query plans, or execution statistics
- Full stack traces (log them server-side, return a clean error)

## Principle 7: Handle Binary Data Correctly

Never return large binary blobs in tool responses:

**Bad:**
```json
{ "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEU..." }  // 500KB base64
```

**Good:**
```json
{ "image_url": "https://cdn.example.com/img/abc123.png", "dimensions": "1024x1024" }
```

Return URLs, not data. The agent can reference the URL in its response without consuming 500KB of context.

## Principle 8: Null vs Missing vs Empty

Be consistent:
- `null` — Field exists but has no value ("customer has no email on file")
- Missing key — Field is not applicable to this response
- `""` (empty string) — AVOID. Use null instead. Empty strings are ambiguous.
- `[]` (empty array) — Zero results found. Always return with a count.

```json
{
  "results": [],
  "total": 0,
  "message": "No appointments found for this customer"
}
```

## Principle 9: Timestamps

Use human-readable formats in tool responses:

**Bad:** `"2025-03-19T14:23:45.123456789+00:00"`
**Good:** `"Mar 19, 2025 2:23 PM"` or `"2025-03-19T14:23:45Z"` (ISO 8601 without nanoseconds)

For relative times: `"2 hours ago"`, `"yesterday"`, `"in 3 days"` — these are more useful to agents composing natural language responses.

## Real-World Before/After

### Before (468 tokens):
```json
{"status":"success","code":200,"data":{"customer":{"id":"a1b2c3d4","tenant_id":"xyz","first_name":"John","last_name":"Smith","email":"john@email.com","phone":"+15551234567","phone_verified":true,"email_verified":false,"created_at":"2025-01-15T10:30:00.000Z","updated_at":"2025-03-19T14:00:00.000Z","deleted_at":null,"metadata":{"source":"web","campaign":"spring2025","utm_medium":"cpc"},"preferences":{"notifications":true,"sms":true,"email":false},"internal_score":72,"risk_tier":1,"lock_version":3,"appointments_count":7,"total_revenue":1250.00,"last_visit":"2025-03-15T09:00:00.000Z","assigned_tech_id":"tech-mike-001","notes_count":3}}}
```

### After (127 tokens):
```json
{
  "customer": {
    "name": "John Smith",
    "phone": "+15551234567",
    "email": "john@email.com",
    "appointments": 7,
    "last_visit": "Mar 15, 2025",
    "assigned_tech": "Mike",
    "status": "active"
  }
}
```

**73% fewer tokens.** The agent has everything it needs to answer "tell me about this customer" without the noise.

## Resources

- [Anthropic: Tool Use Result Format](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview#handling-tool-results) — How to format tool results for optimal Claude consumption
- [Google: API Design Guide — Standard Methods](https://cloud.google.com/apis/design/standard_methods) — Google's API response design guidelines applicable to tool outputs

## Image References

1. Token cost comparison bloated vs clean — "API response size token cost comparison before after optimization"
2. Response envelope pattern diagram — "API response envelope wrapper pattern success error data diagram"
3. Data projection filtering diagram — "database field projection selection filtering API response diagram"
4. Content truncation budget — "text truncation budget token limit context window management"
5. JSON vs markdown vs table format comparison — "data format comparison JSON markdown table API response"

## Video References

1. [API Design Best Practices — Google Cloud](https://www.youtube.com/watch?v=P0a7PwRNLVU) — Response design patterns for clean, efficient API outputs
2. [Token Optimization for LLM Apps — AI Engineer](https://www.youtube.com/watch?v=GQn7VM0YSEQ) — Practical strategies for reducing token consumption in LLM applications
