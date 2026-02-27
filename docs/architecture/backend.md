# Backend Architecture

The Atlas UX backend is a Fastify 5 server written in TypeScript. It serves as
the API layer, handling authentication, multi-tenant isolation, business logic,
and the interface to the PostgreSQL database via Prisma ORM.

---

## Technology Stack

| Concern       | Technology                           |
|---------------|--------------------------------------|
| Framework     | Fastify 5                            |
| Language      | TypeScript (compiled with tsc)       |
| ORM           | Prisma                               |
| Database      | PostgreSQL 16 (Supabase)             |
| AI Providers  | OpenAI, DeepSeek, OpenRouter, Cerebras |
| Build         | tsc to `./dist`, tsx for dev watch   |
| Deployment    | Render web service                   |

## Directory Structure

```
backend/src/
 |-- server.ts             # Fastify instance creation, plugin registration
 |-- routes/               # 30+ route files, all mounted under /v1
 |   |-- agentRoutes.ts
 |   |-- auditRoutes.ts
 |   |-- decisionsRoutes.ts
 |   |-- filesRoutes.ts
 |   |-- jobsRoutes.ts
 |   |-- mobileRoutes.ts
 |   |-- oauthRoutes.ts
 |   |-- telegramRoutes.ts
 |   |-- workflowsRoutes.ts
 |   +-- ... (20+ more)
 |
 |-- plugins/              # Fastify plugins
 |   |-- authPlugin.ts     # JWT verification
 |   |-- tenantPlugin.ts   # Tenant extraction from headers
 |   +-- auditPlugin.ts   # Automatic mutation logging
 |
 |-- core/
 |   +-- engine/           # AI orchestration engine
 |       |-- engine.ts     # Main engine logic
 |       +-- ...
 |
 |-- domain/               # Business domain logic
 |   |-- audit/
 |   |-- content/
 |   +-- ledger/
 |
 |-- services/             # Service layer (reusable business logic)
 |
 |-- tools/                # External tool integrations
 |   |-- outlook/          # Microsoft Graph API
 |   +-- slack/            # Slack API
 |
 |-- workers/              # Background worker processes
 |   |-- engineLoop.ts     # Orchestration loop (ticks every 5s)
 |   |-- emailSender.ts    # Email delivery worker
 |   +-- scheduler.ts      # Cron-like workflow triggers
 |
 |-- jobs/                 # Database-backed job queue
 |
 |-- db/
 |   +-- prisma.ts         # Prisma client singleton
 |
 |-- lib/                  # Shared utilities
 |   +-- telegramNotify.ts # Telegram Bot API helper
 |
 |-- ai.ts                 # AI provider configuration
 +-- env.ts                # Environment variable definitions
```

## Plugin System

Fastify's plugin architecture is central to the backend design. Three core
plugins run on every request in sequence:

```
Request arrives
     |
     v
+----+-----------+
| 1. authPlugin  |  Verifies JWT from Authorization header.
|                |  Attaches decoded user to request object.
+----+-----------+
     |
     v
+----+------------+
| 2. tenantPlugin |  Extracts tenant_id from x-tenant-id header
|                 |  or tenantId query parameter.
+----+------------+
     |
     v
+----+------------+
| 3. auditPlugin  |  On response (for write methods: POST, PUT,
|                 |  PATCH, DELETE), logs the action to audit_log.
+----+------------+
     |
     v
Route Handler
```

### authPlugin

Validates the JWT token from the `Authorization: Bearer <token>` header. On
failure, returns 401 Unauthorized. On success, attaches the decoded payload
(user ID, email, roles) to the Fastify request object.

### tenantPlugin

Resolves the tenant ID for the current request. It checks two sources in order:

1. `x-tenant-id` request header (preferred)
2. `tenantId` query parameter (fallback)

All subsequent Prisma queries are scoped to this tenant ID.

### auditPlugin

Automatically logs mutations to the `audit_log` table. The log entry includes:

- `tenantId` — scoped to the current tenant
- `actorType` — `user`, `agent`, or `system`
- `actorUserId` / `actorExternalId` — who performed the action
- `level` — `info`, `warn`, `error`
- `action` — what happened (e.g., `CREATE_AGENT`, `SEND_EMAIL`)
- `entityType` / `entityId` — what was affected
- `message` — human-readable description
- `meta` — JSON blob with additional context
- `timestamp` — when it happened

The audit write uses `.catch(() => null)` to ensure audit failures never block
the primary operation.

## Route Organization

All routes are mounted under the `/v1` prefix in `server.ts`. Each route file
exports a Fastify plugin that registers its own endpoints:

```
/v1/agents          -> agentRoutes.ts
/v1/audit           -> auditRoutes.ts
/v1/decisions       -> decisionsRoutes.ts
/v1/files           -> filesRoutes.ts
/v1/jobs            -> jobsRoutes.ts
/v1/mobile          -> mobileRoutes.ts
/v1/oauth           -> oauthRoutes.ts
/v1/telegram        -> telegramRoutes.ts
/v1/workflows       -> workflowsRoutes.ts
... (20+ more route files)
```

Rate limiting is applied per-route using Fastify's built-in rate limiter:

```typescript
{
  config: {
    rateLimit: { max: 30, timeWindow: "1 minute" }
  }
}
```

## Service Layer

The `services/` directory contains reusable business logic that is shared across
routes and workers. Services encapsulate complex operations that involve multiple
database calls, external API interactions, or multi-step workflows.

Route handlers call services; services call Prisma and external APIs.

```
Route Handler  -->  Service  -->  Prisma / External API
                                      |
                                      v
                                  Database
```

## AI Provider Configuration

The `ai.ts` file configures multiple AI providers:

| Provider    | Use Case                                    |
|-------------|---------------------------------------------|
| OpenAI      | Primary agent reasoning                     |
| DeepSeek    | Alternative reasoning, cost optimization    |
| OpenRouter  | Fallback routing to multiple models         |
| Cerebras    | Fast inference for simple tasks              |

The engine selects a provider based on the task type and configured preferences.
Long-context operations (e.g., LONG_CONTEXT_SUMMARY) use Gemini models via
OpenRouter with 90-second timeouts. Orchestration reasoning uses the primary
provider.

## Database Access

Prisma is used exclusively for database access. The client singleton is at
`backend/src/db/prisma.ts`. All imports reference this path:

```typescript
import { prisma } from "../db/prisma.js";
```

The `.js` extension is required because the backend compiles TypeScript to
JavaScript with ES module resolution.

## External Integrations

| Integration       | Module                       | Protocol          |
|-------------------|------------------------------|-------------------|
| Microsoft Outlook | `tools/outlook/`             | Microsoft Graph   |
| Slack             | `tools/slack/`               | Slack Web API     |
| Telegram          | `lib/telegramNotify.ts`      | Telegram Bot API  |
| Microsoft Email   | `workers/emailSender.ts`     | MS Graph sendMail |

## Worker Processes

Three worker processes run as separate Node.js processes (separate Render
services):

1. **Engine Loop** (`workers/engineLoop.ts`) — Ticks every `ENGINE_TICK_INTERVAL_MS`
   (default 5000ms). Picks up queued jobs, runs agent orchestration, executes
   tool calls, and logs results.

2. **Email Sender** (`workers/emailSender.ts`) — Polls the jobs table for
   `EMAIL_SEND` jobs. Sends via Microsoft Graph API using client credentials
   flow (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET).

3. **Scheduler** (`workers/scheduler.ts`) — Fires workflows at scheduled times
   (e.g., WF-010 at 08:30 UTC, WF-031 at 06:00 UTC daily).

## Environment Variables

Key backend environment variables (defined in `env.ts`):

| Category    | Variables                                              |
|-------------|--------------------------------------------------------|
| Database    | `DATABASE_URL`, `DIRECT_URL`                           |
| AI          | `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`                   |
| OAuth       | `GOOGLE_CLIENT_ID/SECRET`, `META_APP_ID/SECRET`        |
| Engine      | `ENGINE_ENABLED`, `ENGINE_TICK_INTERVAL_MS`            |
| Safety      | `AUTO_SPEND_LIMIT_USD`, `MAX_ACTIONS_PER_DAY`          |
| Email       | `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`     |
| Telegram    | `BOTFATHERTOKEN`                                       |

## Error Handling

- Route handlers return typed error responses with appropriate HTTP status codes
- Audit logging uses `.catch(() => null)` — never blocks the primary operation
- Workers retry failed jobs based on the job system's retry policy
- External API calls have timeouts (90s for long-context, standard for others)

## Related Documentation

- [Architecture Overview](./README.md)
- [Frontend Architecture](./frontend.md)
- [Database Architecture](./database.md)
- [Job System Architecture](./job-system.md)
- [Audit System Architecture](./audit-system.md)
