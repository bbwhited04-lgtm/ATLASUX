# Authentication

Atlas UX uses JWT-based authentication powered by Supabase Auth. The backend validates tokens through the `authPlugin` Fastify plugin, which runs as a `preHandler` hook on every protected route.

## How It Works

1. The frontend authenticates users via Supabase Auth (email/password, OAuth providers, etc.).
2. Supabase issues a JWT access token to the client.
3. The frontend attaches this token as a `Bearer` token in the `Authorization` header on every API request.
4. The backend's `authPlugin` intercepts the request, validates the token against Supabase, and attaches user info to the request object.

## Token Flow

```
Browser                      Supabase Auth                 Atlas Backend
  |                              |                              |
  |-- sign in (email/pw/OAuth) ->|                              |
  |<--- JWT access_token --------|                              |
  |                              |                              |
  |-- GET /v1/agents ----------->|                              |
  |   Authorization: Bearer {jwt}|                              |
  |                              |<-- supabase.auth.getUser() --|
  |                              |--- { user } ---------------->|
  |                              |                              |
  |<-------------- 200 JSON ----|-------------------------------|
```

## Backend: authPlugin.ts

Located at `backend/src/plugins/authPlugin.ts`, this plugin:

- Extracts the `Bearer` token from the `Authorization` header.
- Calls `supabase.auth.getUser(token)` to validate the JWT and retrieve the user.
- Auto-provisions a `User` record in the database on first authentication (upsert by Supabase user ID).
- Attaches `req.auth` with `{ userId, email }` for downstream route handlers.

```typescript
// backend/src/plugins/authPlugin.ts (simplified)
app.addHook("preHandler", async (req, reply) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return reply.code(401).send({ ok: false, error: "missing_bearer_token" });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return reply.code(401).send({ ok: false, error: "invalid_token" });
  }

  // Auto-provision user record
  await prisma.user.upsert({
    where: { id: data.user.id },
    create: { id: data.user.id, email: data.user.email ?? `${data.user.id}@unknown` },
    update: {},
  });

  (req as any).auth = { userId: data.user.id, email: data.user.email };
});
```

## Frontend: Sending Tokens

The frontend API client (in `src/lib/api.ts`) attaches the Supabase session token to every request:

```typescript
const token = supabase.auth.session()?.access_token;

fetch(`${VITE_API_BASE_URL}/v1/agents`, {
  headers: {
    Authorization: `Bearer ${token}`,
    "x-tenant-id": activeTenantId,
    "Content-Type": "application/json",
  },
});
```

## Error Responses

| Status | Error Code            | Meaning                        |
|--------|-----------------------|--------------------------------|
| 401    | `missing_bearer_token`| No `Authorization` header sent |
| 401    | `invalid_token`       | Token expired, revoked, or malformed |

## Protecting Routes

The `authPlugin` is registered globally in `server.ts`, so all routes under the Fastify instance receive auth enforcement. Routes that must be public (health checks, webhooks) are registered in their own scoped plugin *before* the auth plugin, or handle auth absence gracefully.

```typescript
// server.ts — plugin registration order matters
await app.register(auditPlugin);   // 1. Audit logging (global)
await app.register(authPlugin);    // 2. Auth verification (global)
await app.register(tenantPlugin);  // 3. Tenant resolution (global)
```

## Accessing Auth in Route Handlers

After the auth plugin runs, `req.auth` is available in every route handler:

```typescript
app.get("/v1/me", async (req, reply) => {
  const { userId, email } = (req as any).auth;
  return reply.send({ ok: true, userId, email });
});
```

## Environment Variables

| Variable                     | Required | Description                              |
|------------------------------|----------|------------------------------------------|
| `SUPABASE_URL`               | Yes      | Your Supabase project URL                |
| `SUPABASE_SERVICE_ROLE_KEY`  | Yes      | Service role key (server-side only)      |

The service role key is used server-side to validate tokens. It must never be exposed to the frontend.

## User Auto-Provisioning

On first successful authentication, the plugin upserts a `User` record in the database using the Supabase user ID as the primary key. This means:

- No separate registration step is needed.
- The `User` table always stays in sync with Supabase Auth.
- If the upsert fails (e.g., during a migration window), the request still proceeds -- it is non-fatal.

## Tenant Membership Verification

After authentication, the `tenantPlugin` (which runs next) checks that the authenticated user is a member of the requested tenant. If the user is not a member, the request is rejected with a `403 TENANT_ACCESS_DENIED` error. See the [Multi-Tenancy](./multi-tenancy.md) documentation for details.
