# Authentication API

Atlas UX uses JWT-based authentication backed by Supabase Auth. All protected endpoints require a valid token in the `Authorization` header.

## Base URL

```
POST /v1/me
```

All auth-related endpoints are mounted under `/v1`.

---

## Headers

Every authenticated request must include:

```
Authorization: Bearer <jwt_token>
x-tenant-id: <tenant_uuid>
```

The JWT is issued by Supabase Auth and verified by the backend `authPlugin`. The `x-tenant-id` header identifies which tenant context the request operates in.

---

## GET /v1/me

Returns the current user profile and tenant memberships. Auto-provisions a `User` record on first call if one does not exist.

**Request:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     https://api.atlasux.cloud/v1/me
```

**Response (200):**

```json
{
  "ok": true,
  "user": {
    "id": "usr_abc123",
    "email": "you@example.com",
    "displayName": "you",
    "avatarUrl": null,
    "createdAt": "2026-02-01T00:00:00.000Z"
  },
  "tenants": [
    {
      "tenantId": "9a8a332c-c47d-4792-a0d4-56ad4e4a3391",
      "name": "My Org",
      "slug": "my-org",
      "role": "owner",
      "seatType": "pro"
    }
  ],
  "currentSeat": "pro"
}
```

**Error (401):**

```json
{ "ok": false, "error": "not_authenticated" }
```

---

## PATCH /v1/me

Update the current user's display name or avatar URL.

**Request:**

```bash
curl -X PATCH \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"displayName": "Billy W", "avatarUrl": "https://..."}' \
     https://api.atlasux.cloud/v1/me
```

**Response (200):**

```json
{
  "ok": true,
  "user": {
    "id": "usr_abc123",
    "email": "you@example.com",
    "displayName": "Billy W",
    "avatarUrl": "https://..."
  }
}
```

---

## GET /v1/me/tenants

List all tenants the authenticated user belongs to.

**Response (200):**

```json
{
  "ok": true,
  "tenants": [
    {
      "tenantId": "9a8a332c-...",
      "name": "My Org",
      "slug": "my-org",
      "role": "owner",
      "seatType": "pro"
    }
  ]
}
```

---

## GET /v1/me/usage

Returns current-month usage metrics and limits for the active tenant.

**Response (200):**

```json
{
  "ok": true,
  "usage": { "tokensUsed": 12400, "storageBytes": 5242880, "jobsRun": 15 },
  "limits": {
    "tokenBudgetPerDay": 500000,
    "storageLimitBytes": 1073741824,
    "agentLimit": 25,
    "jobsPerDay": 100
  },
  "seatType": "pro"
}
```

---

## GET /v1/me/subscription

Returns the current subscription and seat information.

**Response (200) -- active subscription:**

```json
{
  "ok": true,
  "subscription": {
    "id": "sub_xyz",
    "seatType": "pro",
    "status": "active",
    "stripeCustomerId": "cus_abc",
    "currentPeriodStart": "2026-02-01T00:00:00.000Z",
    "currentPeriodEnd": "2026-03-01T00:00:00.000Z",
    "canceledAt": null
  },
  "limits": { "tokenBudgetPerDay": 500000, "storageLimitBytes": 1073741824 }
}
```

**Response (200) -- no subscription (free tier):**

```json
{
  "ok": true,
  "subscription": null,
  "seatType": "free_beta",
  "limits": { "tokenBudgetPerDay": 10000, "storageLimitBytes": 52428800 }
}
```

---

## Authentication Flow

1. The frontend authenticates via Supabase Auth (email/password or OAuth).
2. Supabase returns a JWT access token.
3. The frontend stores the token and sends it on every API request.
4. The backend `authPlugin` decodes and verifies the JWT.
5. If valid, `req.auth.userId` and `req.auth.email` are populated.
6. If the user has never called `/v1/me`, the first call auto-provisions a `User` row.

---

## Error Codes

| Code | Error                | Meaning                              |
|------|----------------------|--------------------------------------|
| 401  | `not_authenticated`  | Missing or invalid JWT token         |
| 400  | `tenant_required`    | `x-tenant-id` header is missing      |
| 400  | `nothing_to_update`  | PATCH body has no recognized fields  |

---

## Notes

- Tokens expire according to Supabase Auth settings (default: 1 hour).
- The frontend handles token refresh automatically via the Supabase client SDK.
- Seat types: `free_beta`, `starter`, `pro`, `enterprise`.
