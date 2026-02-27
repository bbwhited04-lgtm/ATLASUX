# Multi-Tenancy

Atlas UX is a multi-tenant platform. Every database table that stores user or business data includes a `tenant_id` foreign key referencing the `tenants` table. Tenant isolation is enforced at the application layer through the `tenantPlugin` Fastify plugin.

## Core Principle

Every query that reads or writes tenant-scoped data **must** include a `WHERE tenant_id = ?` clause. There are no exceptions. Forgetting this constraint leaks data across organizations.

## How Tenant Resolution Works

The `tenantPlugin` (at `backend/src/plugins/tenantPlugin.ts`) runs as a global `preHandler` hook on every request. It resolves the tenant ID from two sources, in priority order:

1. **`x-tenant-id` request header** (preferred) -- set by the frontend.
2. **`tenantId` query parameter** (fallback) -- legacy frontend behavior.

```typescript
// Resolution logic (simplified)
const headerTenantId = String(req.headers["x-tenant-id"] ?? "").trim();
const queryTenantId  = String((req.query as any)?.tenantId ?? "").trim();
const tenantId = headerTenantId || queryTenantId;
```

Once resolved, the tenant ID is attached to the request as `req.tenantId`.

## Membership Verification

When the request is authenticated (`req.auth.userId` is present), the plugin verifies that the user is a member of the requested tenant by querying `TenantMember`:

```typescript
const member = await prisma.tenantMember.findUnique({
  where: { tenantId_userId: { tenantId, userId } },
});

if (!member) {
  return reply.code(403).send({ ok: false, error: "TENANT_ACCESS_DENIED" });
}
```

If the user is a member, the plugin also sets:

- `req.tenantRole` -- the member's role (e.g., `"owner"`, `"admin"`, `"member"`).
- `req.seatType` -- the member's seat type (e.g., `free_beta`, `pro`).

## API Usage Metering

After successful tenant resolution, the plugin fires a non-blocking call to `meterApiCall(userId, tenantId)` to track API usage per user per tenant.

## Frontend: Setting the Tenant

The frontend stores the active tenant ID in `localStorage` under `atlas_active_tenant_id`. The `useActiveTenant()` hook (from `src/lib/activeTenant.tsx`) provides the value to components:

```typescript
import { useActiveTenant } from "@/lib/activeTenant";

function MyComponent() {
  const { tenantId } = useActiveTenant();
  // Use tenantId in API calls via x-tenant-id header
}
```

## Writing Tenant-Aware Queries

Every Prisma query that touches tenant-scoped data must filter by `tenantId`:

```typescript
// Correct: always filter by tenantId
const jobs = await prisma.job.findMany({
  where: { tenantId: req.tenantId, status: "queued" },
  orderBy: { createdAt: "desc" },
});

// Correct: always include tenantId on create
const asset = await prisma.asset.create({
  data: {
    tenantId: req.tenantId,
    type: "image",
    name: "logo.png",
    url: "https://...",
  },
});
```

Never omit `tenantId` from a query. Even if the route only has one tenant today, the constraint protects against future data leaks.

## Database Schema Pattern

Every tenant-scoped table follows this pattern:

```prisma
model Job {
  id       String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  // ... other fields
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, status], map: "jobs_tenant_status_idx")
  @@map("jobs")
}
```

Key conventions:
- The Prisma field is named `tenantId`, mapped to the database column `tenant_id`.
- `onDelete: Cascade` ensures data is cleaned up when a tenant is deleted.
- A composite index on `[tenantId, ...]` exists on most tables for efficient filtered queries.

## Tenant-Scoped Tables

The following tables all carry a `tenant_id` FK:

| Table               | Prisma Model         |
|---------------------|----------------------|
| `jobs`              | `Job`                |
| `audit_log`         | `AuditLog`           |
| `assets`            | `Asset`              |
| `integrations`      | `Integration`        |
| `decision_memos`    | `DecisionMemo`       |
| `ledger_entries`    | `LedgerEntry`        |
| `kb_documents`      | `KbDocument`         |
| `crm_contacts`      | `CrmContact`         |
| `crm_companies`     | `CrmCompany`         |
| `crm_segments`      | `CrmSegment`         |
| `tenant_members`    | `TenantMember`       |
| `budgets`           | `Budget`             |
| `agent_memory`      | `AgentMemory`        |
| `tool_proposals`    | `ToolProposal`       |

## Error Responses

| Status | Error Code               | Meaning                                      |
|--------|--------------------------|----------------------------------------------|
| 403    | `TENANT_ACCESS_DENIED`   | Authenticated user is not a member of tenant  |
| 503    | `TENANT_CHECK_UNAVAILABLE` | Database error during membership check      |

## Notes

- The plugin is wrapped with `fastify-plugin` (`fp()`) to make the hook global. Without `fp()`, Fastify scopes hooks to the plugin's child context and routes would never see them.
- If no tenant ID is provided in the request (no header, no query param), `req.tenantId` is simply not set. Routes are responsible for checking `req.tenantId` and returning an appropriate error if it is required.
- OPTIONS requests are skipped entirely to allow CORS preflight requests through.
