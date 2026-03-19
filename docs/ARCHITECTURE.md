# Architecture

## System Overview

```
                        +-------------------+
                        |   React 18 SPA    |
                        |  (Vite + Tailwind)|
                        |  HashRouter       |
                        +--------+----------+
                                 |
                     HTTPS / WSS | (api.atlasux.cloud)
                                 |
              +------------------+------------------+
              |        Fastify 5 Backend            |
              |  (TypeScript, port 8787)            |
              |                                     |
              |  Plugins: auth -> csrf -> tenant -> |
              |           audit -> rateLimit        |
              |                                     |
              |  70+ route files under /v1          |
              +-----+-------+-------+-------+------+
                    |       |       |       |
           +--------+  +---+---+  ++-+  +--+------+
           |Postgres |  |Engine |  |S3|  |External |
           |  (RLS)  |  | Loop  |  |  |  | APIs   |
           +---------+  +-------+  +--+  +---------+
                                          Twilio
                                          ElevenLabs
                                          Stripe
                                          OpenAI / DeepSeek
                                          MS Graph
                                          Slack
                                          ...
```

## Request Lifecycle

Every HTTP request passes through this plugin chain in order:

```
Request
  -> @fastify/cors (origin whitelist)
  -> @fastify/helmet (CSP, HSTS, referrer policy)
  -> @fastify/rate-limit (60/min global)
  -> auditPlugin (onSend: log all non-GET requests + errors)
  -> authPlugin (verify JWT, check token blacklist, attach req.auth)
  -> csrfPlugin (validate x-csrf-token on mutations)
  -> tenantPlugin (resolve x-tenant-id, verify membership, attach req.tenantId)
  -> tenantRateLimitPlugin (per-tenant sliding window: 120 read, 30 mutation / min)
  -> Route handler
```

**Plugin registration order matters.** Auth runs before tenant so membership can be verified against the authenticated user. CSRF runs after auth so it can tie tokens to user IDs.

## Multi-Tenancy

Every database table has a `tenant_id` FK column. Tenant isolation is enforced at multiple layers:

1. **tenantPlugin** — Extracts tenant ID from `x-tenant-id` header, validates UUID format, verifies the authenticated user is a member of that tenant via `TenantMember`.
2. **withTenant()** — Prisma wrapper that sets `app.current_setting('app.tenant_id')` on the DB connection for RLS policies.
3. **Row-Level Security** — PostgreSQL RLS policies on sensitive tables ensure cross-tenant data leakage is impossible even if application code has bugs.

```typescript
// Usage pattern in route handlers:
const tenantId = (req as any).tenantId;
const result = await withTenant(tenantId, async (tx) => {
  return tx.crmContact.findMany({ where: { tenantId } });
});
```

## Engine Loop

The engine is the autonomous orchestration layer that processes Intents (queued actions).

```
                    +-------------------+
                    | system_state      |
                    | key=atlas_online  |
                    +--------+----------+
                             |
                    +--------v----------+
                    |   engineLoop.ts   |  (separate Node process)
                    |   tick every      |
                    |   750ms (idle)    |
                    +--------+----------+
                             |
                    +--------v----------+
                    |   engineTick()    |
                    |                   |
                    | 1. claimNextIntent|
                    | 2. buildPackets   |
                    | 3. SGL evaluate   |
                    | 4. atlasExecGate  |
                    | 5. execute        |
                    | 6. audit log      |
                    +-------------------+
```

**Intent states:** DRAFT -> VALIDATING -> (BLOCKED_SGL | REVIEW_REQUIRED | AWAITING_HUMAN) -> APPROVED -> EXECUTING -> EXECUTED | FAILED

The engine loop also recovers stuck intents (RUNNING > 15 minutes -> FAILED). It can run as:
- A separate process: `npm run worker:engine`
- In-process with the server: `ENGINE_ENABLED=true`

Never run both simultaneously.

## Job Queue

Database-backed async work queue using the `jobs` table.

```
Creator (route handler / engine) -> prisma.job.create({ status: "queued" })
                                            |
                                    +-------v--------+
                                    |   jobWorker    |
                                    | polls queued   |
                                    | jobs, executes |
                                    +----------------+
```

Job lifecycle: `queued -> running -> succeeded | failed | canceled`

Retry support: `retryCount`, `maxRetries` (default 3), `nextRetryAt`.

Job types include: `VOICEMAIL_TRANSCRIBE`, `LOCAL_VISION_TASK`, `EMAIL_SEND`, and workflow-specific types.

## Background Workers

| Worker | File | Purpose |
|--------|------|---------|
| Engine Loop | `workers/engineLoop.ts` | Drains Intent queue, executes via SGL gates |
| Job Worker | `workers/jobWorker.ts` | Polls and executes database-backed jobs |
| Email Sender | `workers/emailSender.ts` | Processes outbound email queue |
| Scheduler | `workers/schedulerWorker.ts` | Fires scheduled workflows (cron-like) |
| Reddit | `workers/redditWorker.ts` | Donna's Reddit monitoring and posting |
| Slack | `workers/slackWorker.ts` | Slack message relay |
| SMS | `workers/smsWorker.ts` | Outbound SMS queue processing |
| Social Monitor | `workers/socialMonitoringWorker.ts` | Cross-platform social listening |
| Watchdog | `workers/watchdogWorker.ts` | Health monitoring and alerting |
| Local Vision | `workers/localVisionAgent.ts` | CDP-based visual agent for browser tasks |

## Agent Hierarchy

See [AGENTS.md](AGENTS.md) for full documentation. Summary:

```
Chairman (Billy) -- Board level
  |
  +-- Atlas (President/CEO) -- Executive
  |     +-- Lucy (Receptionist) -- Voice & front desk
  |     +-- Mercer (Customer Acquisition) -- Outbound sales
  |     +-- Petra (Project Manager)
  |     +-- Porter (SharePoint)
  |
  +-- Binky (CRO) -- Executive
        +-- Cheryl (Support)
        +-- Sunday (Comms & Docs)
        |     +-- Social Media Team (15+ agents)
        +-- Daily-Intel, Archy, Frank
```

Escalation always flows upward: Agent -> Parent -> Atlas -> Chairman.

## Knowledge Base Pipeline

```
SKILL.md files (filesystem, 0ms)
  |
  v
Query Classification -> DIRECT | SKILL_ONLY | HOT_CACHE | FULL_RAG
                            |        |            |           |
                            v        v            v           v
                        (nothing) (SKILL.md)  (memory     (Pinecone
                                               cache)      vector
                                                           search)
```

Query classification determines how much context to inject into the chat system prompt, trading latency for comprehensiveness.

## Voice Pipeline

See [VOICE.md](VOICE.md) for details. High-level flow:

```
Phone Call -> Twilio -> WebSocket Media Stream -> ElevenLabs Conversational AI
                                                         |
                                                    [Mid-call tools]
                                                    - book-appointment
                                                    - send-sms
                                                    - take-message
                                                         |
                                                    [Post-call webhook]
                                                    - transcript capture
                                                    - CRM activity logging
                                                    - Slack notification
```

## Code Organization

```
backend/src/
  server.ts          -- Fastify app setup, plugin + route registration
  env.ts             -- Zod-validated environment variables
  ai.ts              -- AI provider setup (OpenAI, DeepSeek, OpenRouter, etc.)
  routes/            -- 70+ route files, all under /v1
  plugins/           -- authPlugin, tenantPlugin, csrfPlugin, auditPlugin, tenantRateLimit
  core/
    engine/          -- Intent processing, execution gate
    agent/           -- Agent tools, deep pipeline, org memory
    kb/              -- Knowledge base context, cache, query classifier
    sgl.ts           -- Statutory Guardrail Layer evaluation
    exec/            -- Execution gate (SGL + human-in-loop)
    orgBrain/        -- Organizational brain hooks, calibration
  services/          -- Business logic (Stripe, ElevenLabs, credentials, etc.)
  workers/           -- Background processes
  jobs/              -- Job queue
  lib/               -- Utilities (encryption, audit chain, rate limiting, etc.)
  domain/            -- Business domain (audit, ledger)
  tools/             -- External tool integrations (Outlook, Slack, browser)
  db/prisma.ts       -- Prisma client + withTenant() RLS wrapper
```
