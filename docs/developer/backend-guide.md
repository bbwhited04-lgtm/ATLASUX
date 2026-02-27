# Backend Guide

The Atlas UX backend is a Fastify 5 server written in TypeScript. It runs on Node 20+, uses Prisma as the ORM, and deploys to Render.

## Entry Point

The server starts in `backend/src/server.ts`. It creates a Fastify instance, registers global plugins, then mounts all route plugins under the `/v1` prefix.

```typescript
// backend/src/server.ts
const app = Fastify({ logger: true });

// Global middleware
await app.register(cors, { ... });
await app.register(helmet, { ... });
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

// Plugins (order matters — auth before tenant)
await app.register(auditPlugin);
await app.register(authPlugin);
await app.register(tenantPlugin);

// Route registration (43 route files)
await app.register(agentsRoutes, { prefix: "/v1/agents" });
await app.register(chatRoutes, { prefix: "/v1/chat" });
// ... etc
```

The server listens on port 8787 by default (`process.env.PORT`).

## Plugins

Three global plugins run as `preHandler` hooks on every request.

### authPlugin (`backend/src/plugins/authPlugin.ts`)

- Extracts the Bearer token from the `Authorization` header
- Validates the JWT against Supabase Auth using `supabase.auth.getUser(token)`
- Decorates `req.auth` with `{ userId, email }`
- Auto-provisions a `User` record on first authentication
- Returns 401 if token is missing or invalid

### tenantPlugin (`backend/src/plugins/tenantPlugin.ts`)

- Reads tenant ID from `x-tenant-id` header (preferred) or `tenantId` query param (fallback)
- If the user is authenticated, verifies tenant membership via `TenantMember` table
- Sets `req.tenantId`, `req.tenantRole`, and `req.seatType`
- Returns 403 if authenticated user is not a member of the requested tenant
- Uses `fastify-plugin` (`fp()`) to make the hook global across all scopes

### auditPlugin (`backend/src/plugins/auditPlugin.ts`)

- Runs as an `onSend` hook (after response is built, before send)
- Logs every request to the `audit_log` table with method, URL, status code, IP, user agent
- Gracefully degrades: if the AuditLevel enum is missing, disables itself with a warning
- Never fails the request even if audit write fails

## Route Conventions

All routes are Fastify plugins registered with a `/v1/` prefix:

```typescript
// backend/src/routes/exampleRoutes.ts
import { FastifyPluginAsync } from "fastify";

export const exampleRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", {
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const tenantId = (req as any).tenantId;
    // ... handler logic
  });
};
```

Key conventions:
- Route files export a single `FastifyPluginAsync` function
- Per-route rate limits are set via `config.rateLimit`
- Tenant ID comes from `(req as any).tenantId`
- Auth user comes from `(req as any).auth.userId`
- All mutations should write to `audit_log`

## Prisma Usage

The Prisma client is a singleton exported from `backend/src/db/prisma.ts`. Import it as:

```typescript
import { prisma } from "../db/prisma.js";
```

Key patterns:
- All tables have a `tenant_id` FK for multi-tenancy isolation
- Use `.js` extension in imports (ESM)
- Audit log writes use `as any` cast to handle schema variations
- Raw SQL is used for performance-critical queries (e.g., intent claim with `FOR UPDATE SKIP LOCKED`)

## BigInt Handling

The server includes a global `onSend` hook that serializes BigInt values to Number in JSON responses, since `JSON.stringify` does not handle BigInt natively.

## CORS

Allowed origins are hardcoded in `server.ts`:
- `https://www.atlasux.cloud`
- `https://atlasux.cloud`
- `http://localhost:5173`
- `http://localhost:3000`

Custom headers allowed: `x-tenant-id`, `x-user-id`, `x-device-id`, `x-request-id`, `x-client-source`, `x-inbound-secret`.

## Route List

There are 43 route files mounted in `server.ts`. Key routes include:

| Prefix | File | Purpose |
|--------|------|---------|
| `/v1/agents` | `agentsRoutes.ts` | Agent CRUD and status |
| `/v1/chat` | `chatRoutes.ts` | AI chat interface |
| `/v1/engine` | `engineRoutes.ts` | Engine control (start/stop/status) |
| `/v1/jobs` | `jobsRoutes.ts` | Job queue management |
| `/v1/decisions` | `decisionRoutes.ts` | Decision memo CRUD |
| `/v1/audit` | `auditRoutes.ts` | Audit log queries |
| `/v1/kb` | `kbRoutes.ts` | Knowledge base documents |
| `/v1/workflows` | `workflowsRoutes.ts` | Workflow catalog and execution |
| `/v1/integrations` | `integrationsRoutes.ts` | OAuth integration status |
| `/v1/oauth` | `oauthRoutes.ts` | OAuth callback handlers |
| `/v1/telegram` | `telegramRoutes.ts` | Telegram bot bridge |
| `/v1/teams` | `teamsRoutes.ts` | Microsoft Teams messaging |
| `/v1/stripe` | `stripeRoutes.ts` | Stripe payment integration |
| `/v1/files` | `filesRoutes.ts` | File upload/download (Supabase) |
| `/v1/crm` | `crmRoutes.ts` | CRM contacts and companies |
