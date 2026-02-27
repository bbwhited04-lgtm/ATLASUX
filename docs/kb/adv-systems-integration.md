# Systems Integration Architecture

## Overview

Systems integration is the engineering discipline of making independently developed software systems work together. In enterprise AI platforms like Atlas UX, integration is not a feature — it is the product. An AI agent that cannot reach Outlook, Teams, Stripe, or Telegram is an AI agent that cannot do its job.

This document covers integration patterns from first principles, then maps each pattern to its concrete implementation in Atlas UX.

---

## Integration Patterns

### 1. Point-to-Point

The simplest pattern: System A calls System B directly. Every Atlas UX backend route that calls an external API is a point-to-point integration.

**Strengths**: Low latency, easy to understand, no intermediate infrastructure.
**Weaknesses**: Creates tight coupling. With N systems, you get N*(N-1)/2 connections. Becomes unmanageable past ~10 integrations.

**Atlas UX example**: `backend/src/tools/outlookTools.ts` directly calls Microsoft Graph API endpoints. The agent tool calls the function, the function calls Graph, the response flows back.

### 2. Hub-and-Spoke

A central hub mediates all communication. Systems connect only to the hub, not to each other.

**Atlas UX example**: The Fastify backend itself is the hub. Agents never call external APIs directly — they invoke tools registered in `agentTools.ts`, which route through the backend's service layer. This centralizes authentication, rate limiting, error handling, and audit logging.

### 3. Enterprise Service Bus (ESB)

A heavyweight pattern where a shared message bus handles routing, transformation, and orchestration. Largely superseded by lighter approaches in modern architectures.

**Atlas UX stance**: We do not use a traditional ESB. The job queue (`jobs` table) provides similar decoupling without the operational complexity of a dedicated bus.

### 4. Event-Driven

Systems communicate by producing and consuming events. Producers do not know who consumes their events.

**Atlas UX example**: Stripe webhooks. When a payment succeeds, Stripe POSTs an event to our webhook endpoint. The backend processes it without Stripe knowing or caring what happens next. Similarly, Telegram's Bot API sends updates to our webhook URL when users message the bot.

### 5. API-Led Connectivity

Three-tier API architecture: System APIs (raw data access), Process APIs (business logic), Experience APIs (consumer-facing). Popularized by MuleSoft.

**Atlas UX approximation**: Backend routes serve as process and experience APIs. Prisma models are the system API layer. The frontend consumes experience-level endpoints that aggregate data from multiple sources.

---

## REST Integration Principles

Atlas UX's backend is REST-first. Every integration with the outside world either exposes or consumes REST APIs.

### Exposing REST

All routes are mounted under `/v1` via Fastify's prefix system:

```
GET    /v1/agents          → List agents
POST   /v1/agents/:id/run  → Trigger agent execution
GET    /v1/jobs/:id        → Check job status
POST   /v1/webhooks/stripe → Receive Stripe events
```

Every route passes through three plugins in order:

1. **`authPlugin`** — Validates JWT Bearer token
2. **`tenantPlugin`** — Extracts `x-tenant-id` from headers or `tenantId` query param
3. **`auditPlugin`** — Logs mutations to the audit trail

### Consuming REST

External API calls follow a consistent pattern: obtain credentials from environment or database, construct the request with required headers, send with a timeout, parse the response and map errors, then log to the audit trail.

---

## Webhook Integration

Webhooks invert the client-server relationship: instead of polling for updates, the external system pushes events to your endpoint.

### Receiving Webhooks

Atlas UX receives webhooks from:

| Provider | Endpoint | Verification Method |
|---|---|---|
| **Stripe** | `POST /v1/webhooks/stripe` | Signature verification via `stripe.webhooks.constructEvent()` |
| **Telegram** | `POST /v1/telegram/webhook` | Token-based URL path verification |
| **Microsoft Teams** | `POST /v1/teams/webhook` | HMAC signature validation |

Webhook handler requirements:

1. **Respond quickly** — Return 200 within 3 seconds. Enqueue heavy processing as a job.
2. **Be idempotent** — Webhooks can be delivered more than once. Use the event ID to deduplicate.
3. **Verify signatures** — Never trust unverified webhook payloads.
4. **Log everything** — Webhook payloads go into the audit log with `entityType: 'webhook'`.

### Sending Webhooks

Atlas UX can notify external systems via the job queue. A job of type `WEBHOOK_SEND` includes the target URL, payload, and retry configuration. The engine loop processes these jobs with exponential backoff on failure.

---

## OAuth 2.0 Flows

Atlas UX implements multiple OAuth 2.0 flows depending on the integration context:

### Authorization Code Flow (with PKCE)

Used for user-facing integrations where the user grants access to their account.

```
User → Atlas UX → Provider Auth Page → User Grants → Redirect to Atlas UX → Exchange Code → Access Token
```

**Implemented for**: Google (Calendar, Drive), Meta (Facebook, Instagram), X (Twitter), LinkedIn, TikTok

**Backend routes**: `backend/src/routes/oauthRoutes.ts` handles the redirect and token exchange. Tokens are stored encrypted in the `integrations` table with `tenant_id` scoping.

### Client Credentials Flow

Used for server-to-server integrations where no user interaction is needed.

```
Atlas UX Backend → Provider Token Endpoint → Access Token → API Calls
```

**Implemented for**: Microsoft Graph (Teams, Outlook email sending). The backend uses `MS_TENANT_ID`, `MS_CLIENT_ID`, and `MS_CLIENT_SECRET` to obtain tokens via `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`.

### Token Refresh

OAuth tokens expire. Atlas UX handles refresh transparently:

1. Before each API call, check if the stored token is expired (or will expire within 5 minutes)
2. If expired, use the refresh token to obtain a new access token
3. Store the new token pair
4. Proceed with the original API call

If the refresh token itself is expired or revoked, the integration status is set to `disconnected` and the user is prompted to re-authorize.

---

## Message Queues and Async Processing

Atlas UX uses a database-backed job queue instead of a dedicated message broker (RabbitMQ, Kafka). This is a deliberate tradeoff: simplicity and transactional consistency over raw throughput.

### Job Queue Architecture

```
Producer (route handler / engine) → INSERT into jobs table → Worker polls → Process → UPDATE status
```

**Job types**: `EMAIL_SEND`, `SOCIAL_PUBLISH`, `WEBHOOK_SEND`, `KB_INGEST`, `AGENT_TASK`

**Workers** (each a separate Render service):
- `emailSender.ts` — Processes `EMAIL_SEND` jobs via Microsoft Graph or Resend
- `engineLoop.ts` — Processes intents and agent tasks on a 5-second tick
- Scheduler — Triggers time-based workflows (WF-010 at 08:30 UTC, WF-031 at 06:00 UTC, etc.)

**Concurrency safety**:
- Engine loop: `FOR UPDATE SKIP LOCKED` — PostgreSQL row-level locking prevents double-processing
- Other workers: Optimistic locking via `updateMany` with `status: 'queued'` WHERE clause; if `claimed.count !== 1`, the worker skips the job

### Guaranteed Delivery

Jobs are not deleted on failure. They transition to `failed` status with error metadata. A separate retry mechanism can re-queue failed jobs with exponential backoff. This ensures no work is silently lost.

---

## File-Based Integration

### Supabase Storage

Atlas UX uses Supabase Storage for file management:

- **Bucket**: `kb_uploads`
- **Tenant isolation**: Files stored under `tenants/{tenantId}/` paths
- **Quotas**: `MAX_FILES_PER_TENANT` (500), `MAX_STORAGE_MB_PER_TENANT` (500 MB)
- **Routes**: `GET /v1/files` (list), `POST /v1/files` (upload), `GET /v1/files/:id/url` (signed download URL), `DELETE /v1/files/:id`

Signed URLs provide time-limited access to files without exposing storage credentials to the client.

### Batch Processing

The knowledge base ingestion pipeline (`kb:ingest-agents`, `kb:chunk-docs`) is a batch file-based integration. Documents are read from the filesystem or uploaded via API, chunked for vector search, and stored in the `kb_documents` and `kb_chunks` tables.

---

## Database Integration

### Direct Access via Prisma

Atlas UX uses Prisma ORM for all database operations. The schema (`backend/prisma/schema.prisma`, 30KB+) defines 30+ models with strict `tenant_id` foreign keys.

**Connection management**: Supabase provides two connection strings:
- `DATABASE_URL` — Pgbouncer pooled connection for application queries
- `DIRECT_URL` — Direct connection for migrations and schema changes

### Change Data Capture (CDC)

Not currently implemented, but the architecture supports it. Supabase's underlying PostgreSQL supports logical replication, which could feed real-time data changes to external systems or analytics pipelines.

---

## iPaaS Integration: n8n

Atlas UX uses n8n as its workflow automation layer. The n8n manifest (WF-022 through WF-092) defines workflows that:

- Are registered in `workflowsRoutes.ts` alongside the internal workflow registry (WF-001 through WF-021)
- Can be triggered by the scheduler worker on cron schedules
- Execute via the engine loop, which accepts manifest workflows without requiring a database row (`CANONICAL_WORKFLOW_KEYS` fallback)

The n8n integration pattern is declarative: workflows are defined as JSON manifests with trigger conditions, agent assignments, and execution parameters. The engine loop interprets these manifests and dispatches work accordingly.

---

## How Atlas UX Integrates: Summary

| Integration | Pattern | Auth | Protocol |
|---|---|---|---|
| Microsoft Graph (Teams, Outlook) | Point-to-point + Hub | Client credentials OAuth | REST (Graph API) |
| Telegram Bot API | Webhook (inbound) + REST (outbound) | Bot token | HTTPS |
| Stripe | Webhook (inbound) + REST (outbound) | API key + webhook signature | HTTPS |
| Google (Calendar, Drive) | Auth code + PKCE | OAuth 2.0 | REST |
| Meta (Facebook, Instagram) | Auth code + PKCE | OAuth 2.0 | REST (Graph API) |
| X (Twitter) API v2 | Auth code + PKCE | OAuth 2.0 | REST |
| LinkedIn | Auth code + PKCE | OAuth 2.0 | REST |
| Supabase (DB) | Direct | Service role key | PostgreSQL wire protocol |
| Supabase (Storage) | REST | Service role key | HTTPS |
| OpenAI / DeepSeek / Cerebras | Point-to-point | API key | HTTPS |
| n8n | Manifest-driven | Internal | JSON workflow definitions |

---

## Design Principles

1. **The backend is the integration hub.** Agents and the frontend never call external APIs directly.
2. **Every integration is audited.** External API calls are logged with enough context to reconstruct what happened and why.
3. **Credentials never touch the client.** OAuth tokens, API keys, and service role keys live in environment variables or encrypted database fields.
4. **Failures are expected.** Every integration path has error handling, retry logic, and degraded-mode behavior.
5. **Tenant isolation is absolute.** Integration data (tokens, webhook subscriptions, files) is scoped to `tenant_id` without exception.

---

## References

- `backend/src/routes/oauthRoutes.ts` — OAuth flow implementations
- `backend/src/tools/` — External API tool integrations
- `backend/src/workers/` — Async job processing workers
- `backend/src/routes/workflowsRoutes.ts` — Workflow registry including n8n manifest
- `backend/src/routes/telegramRoutes.ts` — Telegram webhook and API integration
- `backend/src/lib/telegramNotify.ts` — Outbound Telegram notifications
