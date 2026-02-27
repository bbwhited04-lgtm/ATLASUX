# Fastify Plugin System

Atlas UX uses Fastify's plugin architecture to organize cross-cutting concerns. Three core plugins handle authentication, tenant resolution, and audit logging. They are registered globally in `server.ts` and execute on every request in a defined order.

## Plugin Registration Order

The order of plugin registration in `server.ts` matters. Plugins execute their hooks in registration order:

```typescript
// backend/src/server.ts
await app.register(auditPlugin);   // 1. Audit logging (onSend hook)
await app.register(authPlugin);    // 2. Auth verification (preHandler hook)
await app.register(tenantPlugin);  // 3. Tenant resolution (preHandler hook)
```

This order ensures:
1. **auditPlugin** registers its `onSend` hook first, so it captures all responses (including auth failures).
2. **authPlugin** runs before tenantPlugin, so `req.auth.userId` is available for membership checks.
3. **tenantPlugin** runs last, using the authenticated user ID to verify tenant membership.

## Core Plugins

### auditPlugin

**File:** `backend/src/plugins/auditPlugin.ts`
**Hook:** `onSend` (fires after the response is prepared but before it is sent)
**Scope:** Global (wrapped with `fastify-plugin`)

Logs every API response to the `audit_log` table. The audit level is derived from the HTTP status code.

```typescript
import fp from "fastify-plugin";

const auditPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onSend", async (req, reply, payload) => {
    const level =
      reply.statusCode >= 500 ? "error" :
      reply.statusCode >= 400 ? "warn" :
      "info";

    await prisma.auditLog.create({
      data: {
        actorType: "system",
        actorUserId: (req as any).auth?.userId ?? null,
        level: level as any,
        action: `${req.method} ${req.url}`,
        // ... metadata
      },
    });

    return payload;  // Must return payload to continue the response
  });
};

export default fp(auditPlugin);
```

Key behaviors:
- **Never fails requests.** If the audit write fails, the error is logged and the response proceeds.
- **Self-disabling.** If the `AuditLevel` PostgreSQL enum is missing (common during migration windows), the plugin disables itself with a one-time warning.
- **Dual-schema support.** Attempts two write formats to handle schema variations (top-level columns vs JSON meta field).

### authPlugin

**File:** `backend/src/plugins/authPlugin.ts`
**Hook:** `preHandler` (fires before the route handler)
**Scope:** Scoped (not wrapped with `fastify-plugin`)

Validates the JWT token from the `Authorization` header using Supabase Auth.

```typescript
export const authPlugin: FastifyPluginAsync = async (app) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  app.decorateRequest("auth", null);

  app.addHook("preHandler", async (req, reply) => {
    const token = req.headers.authorization?.slice(7);  // Remove "Bearer "
    if (!token) return reply.code(401).send({ ok: false, error: "missing_bearer_token" });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return reply.code(401).send({ ok: false, error: "invalid_token" });

    // Auto-provision User record
    await prisma.user.upsert({ where: { id: data.user.id }, create: { ... }, update: {} });

    (req as any).auth = { userId: data.user.id, email: data.user.email };
  });
};
```

Key behaviors:
- **Rejects unauthenticated requests** with 401.
- **Auto-provisions users** on first auth (non-fatal if upsert fails).
- **Sets `req.auth`** for downstream plugins and route handlers.

### tenantPlugin

**File:** `backend/src/plugins/tenantPlugin.ts`
**Hook:** `preHandler` (fires after authPlugin)
**Scope:** Global (wrapped with `fastify-plugin`)

Resolves the active tenant from request headers or query parameters, then verifies membership.

```typescript
const plugin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (req, reply) => {
    if (req.method === "OPTIONS") return;  // Skip CORS preflight

    const headerTenantId = String(req.headers["x-tenant-id"] ?? "").trim();
    const queryTenantId  = String((req.query as any)?.tenantId ?? "").trim();
    const tenantId = headerTenantId || queryTenantId;

    if (!tenantId) return;  // Routes check req.tenantId themselves

    if (userId) {
      const member = await prisma.tenantMember.findUnique({
        where: { tenantId_userId: { tenantId, userId } },
      });
      if (!member) return reply.code(403).send({ ok: false, error: "TENANT_ACCESS_DENIED" });

      (req as any).tenantRole = member.role;
      (req as any).seatType = member.seatType;
    }

    (req as any).tenantId = tenantId;
  });
};

export const tenantPlugin = fp(plugin);
```

Key behaviors:
- **Header-first resolution:** Prefers `x-tenant-id` header, falls back to `tenantId` query param.
- **Membership verification:** When authenticated, checks `TenantMember` table.
- **API metering:** Fires a non-blocking `meterApiCall()` for usage tracking.
- **Non-blocking for unauthenticated requests:** In alpha mode (no auth), the membership check is skipped.

## The `fastify-plugin` Wrapper

Fastify scopes plugins by default. A plugin's hooks and decorators only apply within the plugin's child context. To make a hook global (visible to all routes), wrap the plugin with `fp()`:

```typescript
import fp from "fastify-plugin";

// Without fp(): hook only applies to routes registered INSIDE this plugin
// With fp(): hook applies to ALL routes in the application
export const tenantPlugin = fp(plugin);
export default fp(auditPlugin);
```

The `authPlugin` is NOT wrapped with `fp()`, which means it is scoped. However, because it is registered at the top level of `server.ts` (before routes), it effectively applies to all subsequently registered routes.

## Creating a New Plugin

Follow this pattern to create a new Fastify plugin:

```typescript
// backend/src/plugins/myPlugin.ts
import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";

const myPlugin: FastifyPluginAsync = async (app) => {
  // Decorate the request (optional)
  app.decorateRequest("myData", null);

  // Add a hook
  app.addHook("preHandler", async (req, reply) => {
    // Your logic here
    (req as any).myData = { someValue: true };
  });
};

// Use fp() if the plugin should be global
// Omit fp() if the plugin should be scoped
export default fp(myPlugin);
```

Then register it in `server.ts`:

```typescript
import myPlugin from "./plugins/myPlugin.js";

// Register in the correct order relative to other plugins
await app.register(auditPlugin);
await app.register(authPlugin);
await app.register(tenantPlugin);
await app.register(myPlugin);        // After auth/tenant if it depends on them
```

## Hook Lifecycle

Fastify hooks execute in this order for each request:

```
onRequest        -> (early request processing)
preParsing       -> (before body parsing)
preValidation    -> (before schema validation)
preHandler       -> authPlugin, tenantPlugin run here
handler          -> (route handler)
preSerialization -> (before JSON serialization)
onSend           -> auditPlugin runs here
onResponse       -> (after response sent)
```

## Request Decorations

After all plugins run, the request object has these additional properties:

| Property        | Set By        | Type                        | Description                  |
|-----------------|---------------|-----------------------------|------------------------------|
| `req.auth`      | authPlugin    | `{ userId, email }`        | Authenticated user info      |
| `req.tenantId`  | tenantPlugin  | `string`                    | Active tenant UUID           |
| `req.tenantRole`| tenantPlugin  | `string`                    | User's role in the tenant    |
| `req.seatType`  | tenantPlugin  | `SeatType`                  | User's seat type             |

Access these in route handlers via type assertion:

```typescript
app.get("/example", async (req, reply) => {
  const { userId } = (req as any).auth;
  const tenantId = (req as any).tenantId;
  const role = (req as any).tenantRole;
  // ...
});
```

## Best Practices

1. **Always use `fp()` for plugins that add global hooks.** Without it, routes registered outside the plugin's scope will not see the hook.
2. **Keep plugin registration order stable.** Changing the order of auth and tenant plugins will break the membership check.
3. **Never fail requests from utility plugins.** Audit logging and metering should be fire-and-forget.
4. **Use `preHandler` for request-scoping logic** (auth, tenant, permissions).
5. **Use `onSend` for response-scoping logic** (audit logging, response transformation).
6. **Test plugins in isolation** using `app.inject()` with a minimal Fastify instance.
