# Authentication Flow

Atlas UX uses JWT-based authentication powered by Supabase Auth. The frontend obtains tokens from Supabase, and the backend verifies them on every request.

## Overview

```
Frontend                    Supabase Auth               Backend
   |                            |                          |
   |-- signIn (email/pwd) ---->|                           |
   |<-- JWT access_token ------|                           |
   |                            |                          |
   |-- API request + Bearer JWT ----------------------------->|
   |                            |                          |-- getUser(token) -->|
   |                            |<-- user data ------------|
   |                            |                          |-- req.auth = { userId, email }
   |<-- API response ----------------------------------------|
```

## Frontend Token Management

1. The user authenticates via Supabase Auth (email/password, OAuth, magic link)
2. Supabase returns a JWT access token
3. The token is stored by the Supabase client library (session persistence)
4. Every API call includes the token in the `Authorization` header:

```typescript
fetch(`${API_BASE}/v1/agents`, {
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "x-tenant-id": tenantId,
  },
});
```

## Backend Verification — `authPlugin.ts`

The auth plugin (`backend/src/plugins/authPlugin.ts`) runs as a `preHandler` hook on every request.

### Step 1: Extract Token

```typescript
const auth = req.headers.authorization || "";
const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
if (!token) return reply.code(401).send({ ok: false, error: "missing_bearer_token" });
```

### Step 2: Verify with Supabase

```typescript
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.auth.getUser(token);
if (error || !data?.user) {
  return reply.code(401).send({ ok: false, error: "invalid_token" });
}
```

The plugin uses the Supabase service role key to verify tokens server-side. This does not create a user session on the backend.

### Step 3: Auto-Provision User

On first authentication, the plugin auto-creates a `User` record:

```typescript
await prisma.user.upsert({
  where: { id: userId },
  create: {
    id: userId,
    email: email ?? `${userId}@unknown`,
    displayName: email?.split("@")[0] ?? null,
  },
  update: {},
});
```

This ensures the `User` table stays in sync with Supabase Auth without requiring a separate registration flow.

### Step 4: Decorate Request

```typescript
(req as any).auth = { userId, email };
```

Route handlers access the authenticated user via `(req as any).auth.userId` and `(req as any).auth.email`.

## Plugin Order

The plugin registration order in `server.ts` matters:

```typescript
await app.register(auditPlugin);    // 1. Audit (onSend hook)
await app.register(authPlugin);     // 2. Auth (preHandler)
await app.register(tenantPlugin);   // 3. Tenant (preHandler, after auth)
```

Auth runs before tenant so that `tenantPlugin` can access `req.auth.userId` for membership verification.

## Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| 401 | `missing_bearer_token` | No `Authorization` header |
| 401 | `invalid_token` | JWT expired, revoked, or malformed |
| 403 | `TENANT_ACCESS_DENIED` | User not a member of requested tenant |
| 503 | `TENANT_CHECK_UNAVAILABLE` | Database unavailable for membership check |

## Access Code Gate

In addition to JWT auth, the frontend uses an access code gate (`AppGate` component) controlled by the `VITE_APP_GATE_CODE` environment variable. This is a simple client-side gate for the Alpha stage -- it does not replace JWT authentication.

## OAuth Integrations

The backend handles OAuth flows for external platforms (Google, Meta, X, Microsoft, etc.) via `backend/src/routes/oauthRoutes.ts`. These tokens are stored in the `integrations` table per tenant and are separate from user authentication.

## Security Notes

- JWT verification is done server-side via Supabase service role key
- No session state is stored on the backend (stateless)
- Token refresh is handled by the Supabase client library on the frontend
- The backend never stores or logs raw JWT tokens
