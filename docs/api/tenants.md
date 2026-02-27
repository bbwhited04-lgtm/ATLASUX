# Atlas UX API -- Tenants

Tenant management endpoints. Every resource in Atlas UX is scoped to a tenant (organization). The `tenant_id` foreign key is present on all database tables.

## List Tenants

```
GET /v1/tenants
```

Returns up to 100 tenants, ordered by creation date (newest first).

**Auth:** JWT.

**Response:**

```json
{
  "ok": true,
  "tenants": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "createdAt": "2026-02-26T...",
      "updatedAt": "2026-02-26T..."
    }
  ]
}
```

**Example:**

```bash
curl -s https://atlas-ux.onrender.com/v1/tenants \
  -H "Authorization: Bearer $TOKEN"
```

## Create Tenant

```
POST /v1/tenants
```

Creates a new tenant organization. Automatically generates a slug from the name, creates an audit log entry, and records a ledger marker.

**Auth:** JWT.

**Request Body:**

```json
{
  "name": "Acme Corp",
  "slug": "acme-corp"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Organization name |
| `slug` | string | No | URL-safe slug (auto-generated from name if omitted) |

**Response:**

```json
{
  "ok": true,
  "tenant": {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "createdAt": "2026-02-26T..."
  }
}
```

**Error Responses:**

| Code | Error | Description |
|------|-------|-------------|
| 400 | `name_required` | Name field is empty |
| 409 | `tenant_already_exists` | Duplicate slug |
| 500 | `internal_error` | Unexpected server error |

**Side Effects:**

- Creates an `AUDIT_LOG` entry with action `TENANT_CREATED`
- Creates a `LEDGER_ENTRY` marker (0-cost debit) for traceability

**Example:**

```bash
curl -s -X POST https://atlas-ux.onrender.com/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp"}'
```

## Multi-Tenancy Notes

- Every API request should include `x-tenant-id` header for tenant-scoped operations
- The `tenantPlugin` extracts this header and attaches `req.tenantId` to the request
- Fallback: some endpoints accept `tenantId` as a query parameter
- All database queries filter by `tenantId` to ensure data isolation
- Slug uniqueness is enforced at the database level (unique constraint)

## Tenant Switching (Frontend)

The frontend stores the active tenant ID in `localStorage` under `atlas_active_tenant_id`. The `useActiveTenant()` hook reads this value and passes it as the `x-tenant-id` header on every API call.
