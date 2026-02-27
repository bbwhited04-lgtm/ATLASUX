# Middleware & Connector Architecture

## Overview

A connector encapsulates all complexity of communicating with an external system — authentication, request formatting, response parsing, error handling, retry logic, rate limiting — behind a clean interface. In Atlas UX, connectors bridge autonomous AI agents and the outside world. When Kelly wants to publish a tweet or Atlas needs to send an email, they invoke tools that delegate to connectors.

---

## Connector Pattern

A well-designed connector exposes a domain-specific interface, not a protocol-specific one:

```typescript
// Bad: leaks HTTP details into business logic
const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ message: { subject, body, toRecipients } })
});

// Good: domain-specific interface
await outlookConnector.sendEmail({ to, subject, body });
```

### Atlas UX Connector Inventory

| Connector | Location | External System |
|---|---|---|
| Microsoft Graph | `backend/src/tools/outlookTools.ts` | Outlook, Teams |
| Telegram | `backend/src/lib/telegramNotify.ts` | Telegram Bot API |
| X (Twitter) | `backend/src/tools/` | X API v2 |
| Stripe | Route handlers + webhook | Stripe API |
| Supabase Storage | `backend/src/routes/` (files) | Supabase S3 |
| AI Providers | `backend/src/ai.ts` | OpenAI, DeepSeek, Cerebras, OpenRouter |

---

## Adapter Pattern

External APIs return data in their own formats. The adapter transforms responses into a canonical internal format:

```typescript
interface EmailMessage {
  id: string;
  subject: string;
  fromName: string;
  fromAddress: string;
  receivedAt: Date;
}

function adaptGraphEmail(raw: GraphMailMessage): EmailMessage { ... }
function adaptResendEmail(raw: ResendMessage): EmailMessage { ... }
```

Atlas UX's email worker (`emailSender.ts`) uses this pattern — `OUTBOUND_EMAIL_PROVIDER` selects between Microsoft Graph and Resend, but job processing works with a unified interface regardless of provider.

---

## Retry Strategies

### Exponential Backoff with Jitter

```
wait = min(base * 2^attempt + random(0, jitter), maxWait)
```

| Attempt | Base Wait | With Jitter | Capped At |
|---|---|---|---|
| 1 | 2s | 2.0-2.5s | 30s |
| 2 | 4s | 4.0-4.5s | 30s |
| 3 | 8s | 8.0-8.5s | 30s |
| 4 | 16s | 16.0-16.5s | 30s |

Jitter prevents thundering herds — without it, all clients that failed simultaneously retry simultaneously.

### Circuit Breaker

Three states: **Closed** (normal, tracking failure rate), **Open** (all requests fail immediately, timer running), **Half-Open** (one test request allowed; success closes, failure re-opens).

Atlas UX implements circuit-breaker behavior through the job queue. Failed jobs accumulate visibly in Agent Watcher, triggering investigation without blocking worker threads.

### Retry Classification

| Retry | Do Not Retry |
|---|---|
| 429, 500, 502, 503 | 400, 401, 403, 404, 422 |
| Network timeout, DNS failure | Validation errors |

---

## Connection Pooling

Node.js's `https.Agent` provides built-in connection pooling. For high-throughput connectors like OpenAI:

```typescript
const openaiAgent = new Agent({ keepAlive: true, maxSockets: 25, maxFreeSockets: 10, timeout: 60000 });
```

---

## Credential Management

### Environment Variables

All API keys and secrets are defined in `backend/src/env.ts`:

```typescript
export const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY");
export const MS_CLIENT_SECRET = requireEnv("MS_CLIENT_SECRET");
```

`requireEnv` fails fast at startup if a variable is missing.

### Token Refresh

OAuth tokens expire. Connectors refresh transparently — check expiration before each call, use refresh token if needed, store the new pair, proceed. If the refresh token is revoked, set integration status to `disconnected`.

### Render Environment Sync

Four Render services (web, email-worker, engine-worker, scheduler) must stay synchronized. `PUT /v1/services/{id}/env-vars` replaces ALL variables — pushing a partial set deletes missing ones.

---

## Caching for External APIs

**TTL-Based**: Cache responses with expiration. Reduces latency and rate limit consumption.

```typescript
const cache = new Map<string, { data: any; expiresAt: number }>();
async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data as T;
  const data = await fetcher();
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}
```

**Event-Based Invalidation**: Webhooks trigger cache clears (e.g., Stripe subscription webhooks).
**Stale-While-Revalidate**: Return stale data immediately, refresh in background. Good for agent config and KB document lists.

---

## Rate Limit Handling

### Proactive Throttling

Track remaining quota from response headers and throttle before hitting 429:

```typescript
let remaining = Infinity, resetAt = 0;
async function rateLimitedFetch(url: string, options: RequestInit) {
  if (remaining <= 1 && Date.now() < resetAt) await delay(resetAt - Date.now());
  const response = await fetch(url, options);
  remaining = parseInt(response.headers.get("x-ratelimit-remaining") ?? "Infinity");
  resetAt = parseInt(response.headers.get("x-ratelimit-reset") ?? "0") * 1000;
  return response;
}
```

Atlas UX's job queue naturally buffers excess requests. If Kelly posting to X hits a rate limit, the job fails and retries after a delay.

---

## Health Checking

A health endpoint aggregates connector status:

```json
{
  "status": "degraded",
  "connectors": {
    "microsoft_graph": { "status": "healthy", "latencyMs": 120 },
    "openai": { "status": "healthy", "latencyMs": 450 },
    "telegram": { "status": "degraded", "latencyMs": 2100 }
  }
}
```

Overall status is the worst among all connectors.

---

## Logging and Observability

Every request gets a trace ID (from `X-Request-Id` or Fastify-generated) that propagates through connector calls:

```
[req_abc123] POST /v1/agents/kelly/run → tool:publish_tweet
[req_abc123] → X API v2 POST /2/tweets (attempt 1) ← 429 (Retry-After: 60)
[req_abc123] → X API v2 POST /2/tweets (attempt 2) ← 201 Created
```

Latency data (start, end, duration, external vs. internal time) flows into the audit log's `meta` field.

---

## Error Mapping

Map external errors to Atlas UX's internal taxonomy:

```typescript
function mapGraphError(status: number, body: any): ConnectorError {
  switch (status) {
    case 401: return { code: "AUTH_TOKEN_EXPIRED", retryable: true, action: "refresh_token" };
    case 403: return { code: "AUTH_INSUFFICIENT_PERMISSIONS", retryable: false,
                       message: `Missing permission: ${body?.error?.message}` };
    case 429: return { code: "RATE_LIMIT_EXCEEDED", retryable: true,
                       retryAfterMs: parseInt(body?.error?.retryAfterMs ?? "60000") };
    default:  return { code: "PROVIDER_ERROR", retryable: status >= 500 };
  }
}
```

---

## Atlas UX Connector Deep Dives

**Microsoft Graph**: Client credentials flow (`MS_TENANT_ID` + `MS_CLIENT_ID` + `MS_CLIENT_SECRET`). Endpoints: `/v1.0/users/{upn}/sendMail`, `/v1.0/teams/{id}/channels/{id}/messages`. Gotcha: Teams `ChannelMessage.Send` permission must be granted in Azure AD.

**Telegram Bot API**: Token (`BOTFATHERTOKEN`) in URL path. Inbound via webhook at `POST /v1/telegram/webhook`. Outbound via `telegramNotify.ts`. Chat persistence via `POST /v1/telegram/save-chat`.

**AI Providers**: `backend/src/ai.ts` abstracts OpenAI, DeepSeek, Cerebras, and OpenRouter behind a common chat completion interface. `LONG_CONTEXT_SUMMARY` has 90s timeout with 4 provider fallbacks; `ORCHESTRATION_REASONING` is preferred for time-sensitive operations.

---

## Building New Connectors

Checklist: (1) Authentication method and credential refresh, (2) Base URL and versioning, (3) Typed request builders, (4) Typed response interfaces with runtime validation, (5) Error mapping to internal `ConnectorError` type, (6) Retry count, backoff params, retryable error classification, (7) Rate limit header reading and proactive throttling, (8) Response caching with TTL, (9) Lightweight health check endpoint, (10) Audit logging with trace ID and duration, (11) Credentials in `env.ts` with `requireEnv`, (12) Tool registration in `agentTools.ts`.

**File placement**: `backend/src/tools/` for agent-invoked connectors, `backend/src/lib/` for infrastructure utilities, `backend/src/routes/` for webhooks and OAuth callbacks.

---

## References

- `backend/src/ai.ts` — Multi-provider AI connector
- `backend/src/tools/` — Agent tool connectors
- `backend/src/lib/telegramNotify.ts` — Telegram outbound connector
- `backend/src/workers/emailSender.ts` — Email provider abstraction
- `backend/src/env.ts` — Credential definitions and validation
- `backend/src/routes/oauthRoutes.ts` — OAuth token management
