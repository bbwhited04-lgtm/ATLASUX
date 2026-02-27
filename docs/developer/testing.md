# Testing

This document covers testing strategies and patterns for the Atlas UX codebase. The platform uses a combination of manual testing, API endpoint testing, and worker observation, with patterns established for adding automated tests.

## Testing Stack

- **Runtime:** Node.js with TypeScript
- **Backend framework:** Fastify 5 (has built-in `inject()` for HTTP testing without a running server)
- **Database:** PostgreSQL via Prisma (use a test database or transactions for isolation)
- **Frontend:** React 18 + Vite (compatible with Vitest or Jest)

## Running the Dev Environment

Start both servers for end-to-end testing:

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev
```

Visit `http://localhost:5173` for the frontend. The backend is at `http://localhost:8787`.

## API Testing with curl

### Health Check

```bash
curl http://localhost:8787/v1/health
```

### Authenticated Requests

```bash
# List agents
curl -H "x-tenant-id: YOUR_TENANT_ID" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8787/v1/agents

# Query audit log
curl -H "x-tenant-id: YOUR_TENANT_ID" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8787/v1/audit?limit=20
```

### Create a Job

```bash
curl -X POST http://localhost:8787/v1/jobs \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"jobType": "EMAIL_SEND", "input": {"to": "test@example.com", "subject": "Test", "text": "Hello"}}'
```

### Trigger a Workflow

```bash
curl -X POST http://localhost:8787/v1/engine/run \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"workflowId": "WF-020", "agentId": "atlas"}'
```

## Automated API Testing with Fastify inject()

Fastify provides `app.inject()` for testing routes without starting an HTTP server. This is the recommended approach for backend integration tests:

```typescript
import Fastify from "fastify";
import { tenantPlugin } from "../src/plugins/tenantPlugin.js";
import { authPlugin } from "../src/plugins/authPlugin.js";
import { jobsRoutes } from "../src/routes/jobsRoutes.js";

const app = Fastify();
await app.register(authPlugin);
await app.register(tenantPlugin);
await app.register(jobsRoutes, { prefix: "/v1/jobs" });

const response = await app.inject({
  method: "GET",
  url: "/v1/jobs",
  headers: {
    authorization: "Bearer <valid-test-token>",
    "x-tenant-id": "<test-tenant-uuid>",
  },
});

expect(response.statusCode).toBe(200);
expect(JSON.parse(response.payload).ok).toBe(true);
```

## Testing Tenant-Scoped Routes

All data routes require a tenant context. Always include the `x-tenant-id` header and verify tenant isolation:

```typescript
// Verify tenant A's data is invisible to tenant B
const assetsA = await prisma.asset.findMany({ where: { tenantId: tenantA } });
expect(assetsA).toHaveLength(1);

const assetsB = await prisma.asset.findMany({ where: { tenantId: tenantB } });
expect(assetsB).toHaveLength(0);
```

## Testing Auth-Protected Endpoints

To test authenticated routes without real Supabase tokens, mock the auth plugin:

```typescript
const mockAuthPlugin = async (app) => {
  app.addHook("preHandler", async (req) => {
    (req as any).auth = {
      userId: "test-user-uuid",
      email: "test@example.com",
    };
  });
};

const app = Fastify();
await app.register(mockAuthPlugin);  // Use mock instead of real auth
await app.register(tenantPlugin);
await app.register(jobsRoutes, { prefix: "/v1/jobs" });
```

## Testing Workers

Workers are standalone processes that poll the database. Start them individually:

```bash
cd backend

npm run worker:engine     # Engine loop — processes intents
npm run worker:email      # Email sender — drains EMAIL_SEND jobs
npm run worker:scheduler  # Scheduler — fires workflows on schedule
```

**To test the email worker:**
1. Insert a job with `jobType: "EMAIL_SEND"` and status `queued`.
2. Start the email worker.
3. Watch logs for `EMAIL_SENT` audit entries.

**To test the engine:**
1. Set `atlas_online` system state to `{ engine_enabled: true }`.
2. Insert an intent with status `DRAFT`.
3. Start the engine worker.
4. Check the audit log for `ENGINE_CLAIMED_INTENT` and `ENGINE_EXECUTED_INTENT`.

For unit testing worker logic, extract and test individual functions:

```typescript
// Test retry logic without the polling loop
test("handleJobFailure retries with exponential backoff", async () => {
  await handleJobFailure(jobId, tenantId, 0, 3, "timeout", "emailSender");
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  expect(job.status).toBe("queued");
  expect(job.retryCount).toBe(1);
});
```

## Database Test Isolation

### Strategy 1: Per-Test Tenant

Create a unique tenant for each test and clean up after:

```typescript
let testTenantId: string;

beforeEach(async () => {
  const tenant = await prisma.tenant.create({
    data: { slug: `test-${Date.now()}`, name: "Test Tenant" },
  });
  testTenantId = tenant.id;
});

afterEach(async () => {
  // Cascade delete cleans up all child records
  await prisma.tenant.delete({ where: { id: testTenantId } });
});
```

### Strategy 2: Test Database

Use a separate test database with `backend/.env.test`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atlasux_test
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
ENGINE_ENABLED=false
SCHEDULER_ENABLED=false
```

## Database Inspection

Use Prisma Studio for a GUI view of all tables:

```bash
cd backend
npx prisma studio
```

This opens a browser-based interface at `http://localhost:5555`.

## Frontend Testing

1. Open the app at `http://localhost:5173`.
2. Enter the gate code to access `/app`.
3. Use the Agent Watcher (`/app/watcher`) to monitor real-time audit events.
4. Use the Job Runner (`/app/jobs`) to view job queue status.
5. Use the Business Manager (`/app/business-manager`) to test decisions, blog, budgets, and tickets.

For automated React component testing:

```typescript
import { render, screen } from "@testing-library/react";
import { ActiveTenantProvider } from "@/lib/activeTenant";
import { MyComponent } from "@/components/MyComponent";

test("renders with tenant context", () => {
  localStorage.setItem("atlas_active_tenant_id", "test-tenant-uuid");
  render(
    <ActiveTenantProvider>
      <MyComponent />
    </ActiveTenantProvider>
  );
  expect(screen.getByText("Expected content")).toBeInTheDocument();
});
```

## Environment Considerations

- Set `ENGINE_ENABLED=false` when not testing engine features to avoid unintended intent processing.
- Use `OUTBOUND_EMAIL_PROVIDER=none` to disable actual email delivery during testing.
- The scheduler worker should be off unless testing cron-triggered workflows.

## Production Smoke Test

After deploying, verify:

1. `GET /v1/health` returns 200.
2. Auth works (valid Bearer token gets 200, invalid gets 401).
3. Tenant resolution works (`x-tenant-id` header is accepted).
4. Audit log is being written (check `audit_log` table).
5. Runtime status endpoint returns engine state (`GET /v1/runtime/status`).

## Key Principles

1. **Always test tenant isolation** -- verify that tenant A cannot access tenant B's data.
2. **Always verify audit trail** -- mutations must produce audit log entries.
3. **Test error paths** -- verify 401, 403, 404, and 429 responses.
4. **Keep workers testable** -- extract business logic into pure functions separate from the polling loop.
5. **Use realistic data** -- test with UUID primary keys and proper JSON payloads, not string placeholders.
