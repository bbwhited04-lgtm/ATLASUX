# Business Assets API

The Business Assets API manages digital assets (websites, domains, social accounts, SaaS tools) and their associated costs for a tenant. Every mutation is audit-logged and creates a ledger entry for financial tracking.

## Base URL

```
/v1/assets
```

---

## GET /v1/assets

List all assets for the current tenant. Returns up to 100 assets ordered by creation date.

**Request:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     https://api.atlasux.cloud/v1/assets
```

**Response (200):**

```json
{
  "ok": true,
  "assets": [
    {
      "id": "asset_abc123",
      "tenantId": "9a8a332c-...",
      "type": "website",
      "name": "Company Blog",
      "url": "https://blog.example.com",
      "platform": "WordPress",
      "metrics": {
        "cost": {
          "monthlyCents": 2999,
          "vendor": "WP Engine",
          "cadence": "monthly",
          "category": "hosting",
          "currency": "USD"
        }
      },
      "createdAt": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

---

## POST /v1/assets

Create a new asset.

**Request Body:**

| Field              | Type   | Required | Description                                |
|--------------------|--------|----------|--------------------------------------------|
| `type`             | string | Yes      | Asset type (e.g., `website`, `domain`, `social`, `saas`) |
| `name`             | string | Yes      | Human-readable asset name                  |
| `url`              | string | Yes      | URL or identifier for the asset            |
| `platform`         | string | No       | Platform name (e.g., WordPress, Shopify)   |
| `metrics`          | object | No       | Metrics object (can include cost)          |
| `costMonthlyCents` | number | No       | Monthly cost in cents (flat field shortcut) |
| `costVendor`       | string | No       | Vendor name                                |
| `costCadence`      | string | No       | Billing cadence (monthly, annual, etc.)    |
| `costCategory`     | string | No       | Cost category (hosting, saas, social, etc.)|

Cost fields can be provided either as flat fields (`costMonthlyCents`, `costVendor`, etc.) or as a nested `cost` object within `metrics`.

**Request:**

```bash
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "saas",
       "name": "Ahrefs",
       "url": "https://ahrefs.com",
       "platform": "Ahrefs",
       "costMonthlyCents": 9900,
       "costVendor": "Ahrefs",
       "costCadence": "monthly",
       "costCategory": "saas"
     }' \
     https://api.atlasux.cloud/v1/assets
```

**Response (200):**

```json
{
  "ok": true,
  "asset": {
    "id": "asset_xyz789",
    "tenantId": "9a8a332c-...",
    "type": "saas",
    "name": "Ahrefs",
    "url": "https://ahrefs.com",
    "platform": "Ahrefs",
    "metrics": {
      "cost": {
        "monthlyCents": 9900,
        "vendor": "Ahrefs",
        "cadence": "monthly",
        "category": "saas",
        "currency": "USD"
      }
    }
  }
}
```

---

## PATCH /v1/assets/:id

Update an existing asset. Only include fields you want to change.

**Request:**

```bash
curl -X PATCH \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     -H "Content-Type: application/json" \
     -d '{"name": "Ahrefs Pro", "costMonthlyCents": 19900}' \
     https://api.atlasux.cloud/v1/assets/asset_xyz789
```

To clear cost data, send `"cost": null` or `"clearCost": true`.

---

## DELETE /v1/assets/:id

Delete an asset. The tenant ID from the header must match the asset's tenant.

**Request:**

```bash
curl -X DELETE \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     https://api.atlasux.cloud/v1/assets/asset_xyz789
```

**Response (200):**

```json
{ "ok": true }
```

---

## Cost Tracking

When an asset includes cost information, the API automatically:

1. Writes an `ASSET_COST_ADDED` (or `ASSET_COST_UPDATED` / `ASSET_COST_REMOVED`) audit log entry.
2. Creates a ledger entry with the estimated cost amount, vendor, cadence, and category.

**Supported cost categories** (normalized to ledger categories):

| Input Category | Ledger Category |
|----------------|-----------------|
| hosting, saas, domain, email, social, infra, ads | `api_spend` |
| subscription | `subscription` |
| ai_spend, token_spend, api_spend | `token_spend` |
| other, misc | `misc` |

---

## Audit Trail

Every asset operation generates audit log entries:

- `ASSET_CREATED` -- new asset created
- `ASSET_UPDATED` -- asset fields modified
- `ASSET_DELETED` -- asset removed
- `ASSET_COST_ADDED` -- cost attached to an asset
- `ASSET_COST_UPDATED` -- cost values changed
- `ASSET_COST_REMOVED` -- cost data cleared

Each audit entry includes before/after snapshots in the `meta` field.
