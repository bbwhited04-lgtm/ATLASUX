# API Conventions

All Atlas UX backend routes follow consistent conventions for URL structure, request/response format, rate limiting, and error handling.

## URL Structure

All routes are mounted under the `/v1` prefix:

```
GET    /v1/agents
POST   /v1/jobs
GET    /v1/audit?tenantId=...
PUT    /v1/business/:id
DELETE /v1/assets/:id
```

Route files are registered in `backend/src/server.ts` with their prefix:

```typescript
await app.register(agentsRoutes, { prefix: "/v1/agents" });
await app.register(jobsRoutes,   { prefix: "/v1/jobs" });
await app.register(auditRoutes,  { prefix: "/v1/audit" });
```

## Route Registration Pattern

Routes are defined as Fastify plugins:

```typescript
import { FastifyPluginAsync } from "fastify";

export const exampleRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/example
  app.get("/", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

    const items = await prisma.example.findMany({ where: { tenantId } });
    return reply.send({ ok: true, data: items });
  });

  // POST /v1/example
  app.post("/", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    const body = req.body as any;

    const item = await prisma.example.create({
      data: { tenantId, name: body.name },
    });

    return reply.code(201).send({ ok: true, data: item });
  });
};
```

## Request Headers

| Header            | Required | Description                                     |
|-------------------|----------|-------------------------------------------------|
| `Authorization`   | Yes*     | `Bearer {jwt}` -- Supabase auth token           |
| `x-tenant-id`     | Yes*     | UUID of the active tenant                       |
| `Content-Type`    | Yes**    | `application/json` for POST/PUT/PATCH bodies    |
| `x-request-id`    | No       | Client-generated request ID for tracing         |
| `x-client-source` | No       | Client identifier (e.g., `web`, `electron`)     |

*Required for authenticated/tenant-scoped routes. **Required for requests with a body.

## Response Format

All responses follow a consistent envelope:

### Success

```json
{
  "ok": true,
  "data": { ... }
}
```

Or for lists:

```json
{
  "ok": true,
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

### Error

```json
{
  "ok": false,
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

## Rate Limiting

A global rate limit of **100 requests per minute** is applied to all routes:

```typescript
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
```

Individual routes can override this with stricter limits using the `config` option:

```typescript
app.post("/heavy-endpoint", {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "1 minute",
    },
  },
}, async (req, reply) => {
  // Handler
});
```

When rate-limited, the response is:

```json
// HTTP 429 Too Many Requests
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded, retry in 42 seconds"
}
```

## Pagination

List endpoints support cursor-based or offset-based pagination:

```
GET /v1/audit?page=2&pageSize=50
GET /v1/jobs?cursor=abc123&limit=20
```

Standard pagination parameters:

| Parameter  | Default | Description                    |
|------------|---------|--------------------------------|
| `page`     | `1`     | Page number (1-indexed)        |
| `pageSize` | `20`    | Items per page                 |
| `limit`    | `20`    | Alias for pageSize             |
| `cursor`   | --      | Cursor for cursor-based paging |

## Sorting and Filtering

Most list endpoints support:

```
GET /v1/jobs?status=queued&sort=createdAt&order=desc
GET /v1/audit?level=error&action=EMAIL_SENT
```

## HTTP Methods

| Method | Usage                                      | Typical Status |
|--------|--------------------------------------------|----------------|
| GET    | Read resources                             | 200            |
| POST   | Create resources, trigger actions           | 201 or 200     |
| PUT    | Full resource replacement                  | 200            |
| PATCH  | Partial resource update                    | 200            |
| DELETE | Remove resources                           | 200 or 204     |

## Route Catalog

The server registers 35+ route groups. Here are the primary ones:

| Prefix                | Route File                | Description                    |
|-----------------------|---------------------------|--------------------------------|
| `/v1/agents`          | `agentsRoutes.ts`        | Agent registry CRUD            |
| `/v1/audit`           | `auditRoutes.ts`         | Audit log queries              |
| `/v1/blog`            | `blogRoutes.ts`          | Blog content management        |
| `/v1/budgets`         | `budgetRoutes.ts`        | Budget tracking                |
| `/v1/business`        | `businessManagerRoutes.ts`| Business entity management    |
| `/v1/chat`            | `chatRoutes.ts`          | AI chat interface              |
| `/v1/crm`             | `crmRoutes.ts`           | CRM contacts, companies        |
| `/v1/decisions`       | `decisionRoutes.ts`      | Approval workflow              |
| `/v1/engine`          | `engineRoutes.ts`        | Engine control                 |
| `/v1/files`           | `filesRoutes.ts`         | File upload/download           |
| `/v1/integrations`    | `integrationsRoutes.ts`  | OAuth integration hub          |
| `/v1/jobs`            | `jobsRoutes.ts`          | Job queue management           |
| `/v1/kb`              | `kbRoutes.ts`            | Knowledge base CRUD            |
| `/v1/ledger`          | `ledger.ts`              | Financial ledger               |
| `/v1/metrics`         | `metricsRoutes.ts`       | Platform metrics               |
| `/v1/oauth`           | `oauthRoutes.ts`         | OAuth callback handlers        |
| `/v1/runtime`         | `runtimeRoutes.ts`       | Engine status                  |
| `/v1/tasks`           | `tasksRoutes.ts`         | Task management                |
| `/v1/teams`           | `teamsRoutes.ts`         | Microsoft Teams integration    |
| `/v1/telegram`        | `telegramRoutes.ts`      | Telegram bot bridge            |
| `/v1/tenants`         | `tenants.ts`             | Tenant management              |
| `/v1/user`            | `userRoutes.ts`          | User identity & metering       |
| `/v1/workflows`       | `workflowsRoutes.ts`     | Workflow definitions           |

## BigInt Serialization

PostgreSQL BigInt values (e.g., `amountCents` in the ledger) are automatically converted to JavaScript numbers in the response via a global `onSend` hook:

```typescript
app.addHook("onSend", async (_req, reply, payload) => {
  return JSON.stringify(payload, (_k, v) =>
    typeof v === "bigint" ? Number(v) : v
  );
});
```

## Security Headers

Helmet is registered globally with CSP disabled (managed by the frontend/CDN):

```typescript
await app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});
```
