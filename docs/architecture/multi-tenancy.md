# Multi-Tenancy Architecture

Atlas UX is a multi-tenant platform. Every piece of data is scoped to a tenant, ensuring complete isolation between organizations.

## Tenant Model

The root entity is the `tenants` table:

```prisma
model Tenant {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug      String   @unique
  name      String
  createdAt DateTime @default(now())
}
```

Every other table in the schema has a `tenant_id` FK referencing `tenants.id`. This is enforced at the Prisma schema level with `onDelete: Cascade` -- deleting a tenant cascades to all related data.

## Tenant Resolution

The `tenantPlugin` (`backend/src/plugins/tenantPlugin.ts`) resolves the tenant on every request:

1. **Primary:** Reads `x-tenant-id` from request headers
2. **Fallback:** Reads `tenantId` from query parameters

```typescript
const headerTenantId = String(req.headers["x-tenant-id"] ?? "").trim();
const queryTenantId  = String((req.query as any)?.tenantId ?? "").trim();
const tenantId = headerTenantId || queryTenantId;
```

The resolved tenant ID is set on `(req as any).tenantId` for route handlers to use.

## Membership Verification

When the user is authenticated (`req.auth.userId` is present), the plugin verifies the user is a member of the requested tenant:

```typescript
const member = await prisma.tenantMember.findUnique({
  where: { tenantId_userId: { tenantId, userId } },
});
```

If the user is not a member, the request is rejected with 403 `TENANT_ACCESS_DENIED`.

If the membership check succeeds, the plugin sets:
- `req.tenantRole` — The user's role in the tenant (e.g., `owner`, `admin`, `member`)
- `req.seatType` — The user's seat type (e.g., `free_beta`, `pro`)

## Frontend Tenant Context

The frontend manages the active tenant via React context in `src/lib/activeTenant.tsx`:

```typescript
const STORAGE_KEY = "atlas_active_tenant_id";

export function useActiveTenant() {
  // Returns { tenantId, setTenantId }
  // Persisted in localStorage under "atlas_active_tenant_id"
}
```

Every API call from the frontend includes the `x-tenant-id` header:

```typescript
fetch(`${API_BASE}/v1/agents`, {
  headers: {
    "x-tenant-id": tenantId,
    "Authorization": `Bearer ${token}`,
  },
});
```

## Database Constraints

All queries MUST include a `tenant_id` filter. The Prisma schema enforces this structurally:

```prisma
model Job {
  tenantId String @map("tenant_id") @db.Uuid
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@index([tenantId, status])
}
```

Key indexes are composite on `(tenant_id, ...)` for efficient tenant-scoped queries.

## Tenant Member Table

```prisma
model TenantMember {
  tenantId  String   @map("tenant_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  role      String   @default("member")
  seatType  SeatType @default(free_beta)
  @@id([tenantId, userId])
}
```

The composite primary key `(tenantId, userId)` ensures a user can only have one membership record per tenant.

## Usage Metering

The tenant plugin also meters API calls for authenticated users:

```typescript
meterApiCall(userId, tenantId);
```

This is fire-and-forget and does not block the request.

## Global vs Tenant-Scoped Plugins

The tenant plugin uses `fastify-plugin` (`fp()`) to register globally. Without `fp()`, Fastify would scope the hook to a child context and routes would not see `req.tenantId`.

```typescript
export const tenantPlugin = fp(plugin);
```

The audit plugin similarly uses `fp()` for global registration.

## Security Considerations

- Routes enforce their own tenant requirements -- the plugin sets but does not require `tenantId`
- Some system endpoints (health checks, public pages) do not need a tenant
- Authenticated users can only access tenants they belong to
- Agent workers use a configured `TENANT_ID` env var for their default tenant
