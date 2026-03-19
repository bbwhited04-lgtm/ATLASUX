# Informative Error Handling — Helping Agents Recover from Tool Failures

## Errors Are Conversations

When a tool fails, the error response is a conversation with the LLM. A good error message tells the agent: *what went wrong, why, and what to do about it.* A bad error message says "Something failed" and leaves the agent — and the user — guessing.

The difference between a frustrating agent and a helpful one often comes down to error handling. An agent that says "I couldn't book the appointment because that time slot is already taken — would you like me to check availability for tomorrow?" is infinitely more useful than one that says "An error occurred."

## Error Response Structure

Every tool error should return a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The 2 PM slot on March 20 is already booked.",
    "suggestion": "Available slots: 10 AM, 11 AM, 3 PM on March 20, or any slot on March 21.",
    "retryable": false,
    "details": {
      "requested_date": "2025-03-20",
      "requested_time": "14:00",
      "next_available": "2025-03-20T10:00:00Z"
    }
  }
}
```

### Required Fields

| Field | Purpose |
|-------|---------|
| `code` | Machine-readable error type for programmatic handling |
| `message` | Human-readable description of what went wrong |
| `suggestion` | What the agent should do next |
| `retryable` | Whether retrying might succeed (boolean) |

### Optional Fields

| Field | Purpose |
|-------|---------|
| `retry_after_ms` | How long to wait before retrying |
| `details` | Structured data about the error context |
| `docs_url` | Link to documentation about this error |

## Error Categories

### Validation Errors (400-class)

The inputs were wrong. The agent should fix them and retry.

```json
{
  "code": "INVALID_PHONE",
  "message": "Phone number must be in E.164 format (e.g., +15551234567). Received: '555-1234'.",
  "suggestion": "Reformat the phone number to include country code with + prefix.",
  "retryable": true
}
```

```json
{
  "code": "MISSING_REQUIRED",
  "message": "Missing required field: customer_name. Cannot book appointment without a customer name.",
  "suggestion": "Ask the user for their name and retry.",
  "retryable": true
}
```

### Authentication Errors (401/403-class)

The caller doesn't have permission. Usually not retryable without human intervention.

```json
{
  "code": "API_KEY_EXPIRED",
  "message": "The Stripe API key for this tenant expired on March 15, 2025.",
  "suggestion": "Ask the tenant admin to rotate their Stripe API key at Settings > Integrations > Stripe.",
  "retryable": false
}
```

```json
{
  "code": "INSUFFICIENT_PERMISSIONS",
  "message": "This agent does not have permission to delete customer records.",
  "suggestion": "This action requires admin-level access. Escalate to the account owner.",
  "retryable": false
}
```

### Rate Limit Errors (429-class)

Too many requests. Retryable after a delay.

```json
{
  "code": "RATE_LIMITED",
  "message": "Rate limit exceeded: 10 requests per minute for image generation.",
  "suggestion": "Wait 30 seconds before trying again.",
  "retryable": true,
  "retry_after_ms": 30000
}
```

### Not Found Errors (404-class)

The requested resource doesn't exist.

```json
{
  "code": "CUSTOMER_NOT_FOUND",
  "message": "No customer found with phone number +15559876543.",
  "suggestion": "Verify the phone number with the user, or search by name instead.",
  "retryable": true
}
```

### Timeout Errors (408/504-class)

The operation took too long. May succeed on retry.

```json
{
  "code": "QUERY_TIMEOUT",
  "message": "Database query timed out after 30 seconds. The search query may be too broad.",
  "suggestion": "Try a more specific search term, or add filters to narrow results.",
  "retryable": true,
  "retry_after_ms": 5000
}
```

### Internal Errors (500-class)

Something broke on the server side. The agent can't fix this — but it can report it helpfully.

```json
{
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred while processing the appointment. The error has been logged for investigation.",
  "suggestion": "Try again in a few minutes. If the problem persists, contact support.",
  "retryable": true,
  "retry_after_ms": 60000
}
```

## Partial Success Handling

When a tool partially succeeds, report what worked and what didn't:

```json
{
  "success": "partial",
  "completed": [
    { "action": "appointment_created", "id": "apt-123" },
    { "action": "sms_sent", "to": "+15551234567" }
  ],
  "failed": [
    { "action": "slack_notification", "error": "Slack webhook URL not configured for this tenant" }
  ],
  "message": "Appointment booked and SMS confirmation sent. Slack notification could not be sent — webhook not configured."
}
```

## Graceful Degradation

When the primary data source fails, fall back to alternatives:

```typescript
// Atlas UX web search — rotates providers on failure
async function webSearch(query: string) {
  for (const provider of shuffledProviders) {
    try {
      return await provider.search(query);
    } catch {
      continue; // Try next provider
    }
  }
  return { results: [], message: "All search providers unavailable. Try again shortly." };
}
```

Atlas UX's `getKbContext` pipeline does the same: if Pinecone vector search fails, it falls back to SQL ILIKE search.

## Never Leak Secrets in Errors

**Bad:**
```json
{
  "error": "Connection refused: postgresql://admin:s3cretP@ss@db.internal:5432/atlas_prod"
}
```

**Good:**
```json
{
  "code": "DATABASE_UNAVAILABLE",
  "message": "Database connection failed. The error has been logged.",
  "retryable": true,
  "retry_after_ms": 10000
}
```

Log the full error (with connection string) server-side. Return a sanitized version to the agent. Atlas UX redacts Authorization, cookie, CSRF, and webhook-secret headers from all Fastify logs.

## Error Chains

When errors cascade, preserve the root cause:

```json
{
  "code": "BOOKING_FAILED",
  "message": "Could not book appointment: payment pre-authorization failed.",
  "root_cause": {
    "code": "STRIPE_CARD_DECLINED",
    "message": "The customer's card was declined (insufficient funds)."
  },
  "suggestion": "Ask the customer to use a different payment method."
}
```

## Resources

- [Google API Design Guide — Errors](https://cloud.google.com/apis/design/errors) — Google's comprehensive error response design guide
- [RFC 7807: Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc7807) — IETF standard for machine-readable error responses

## Image References

1. Error handling decision tree — "API error handling decision tree retry fallback escalate flowchart"
2. HTTP status code categories — "HTTP status codes 4xx 5xx categories error classification diagram"
3. Graceful degradation fallback pattern — "graceful degradation fallback chain pattern high availability diagram"
4. Error response structure — "structured error response JSON schema code message suggestion diagram"
5. Rate limiting backoff strategy — "exponential backoff retry strategy rate limiting diagram"

## Video References

1. [Error Handling Best Practices — Theo](https://www.youtube.com/watch?v=GIJmjCpO1Rk) — Practical error handling patterns for modern applications
2. [Designing Resilient APIs — Nordic APIs](https://www.youtube.com/watch?v=NIy_FResgVk) — Building APIs that fail gracefully with proper error responses
