# Atlas UX API -- Ledger

The financial ledger tracks all debits and credits for a tenant. Every monetary action (API spend, subscriptions, Stripe product creation) is recorded as an immutable ledger entry.

## List Ledger Entries

```
GET /v1/ledger/entries?tenantId=uuid&limit=100&offset=0
```

**Auth:** JWT (tenant ID passed as query param).

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `tenantId` | string | -- | **Required.** Tenant UUID |
| `limit` | number | 100 | Max entries (capped at 200) |
| `offset` | number | 0 | Pagination offset |

**Response:**

```json
{
  "ok": true,
  "total": 250,
  "entries": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "entryType": "debit",
      "category": "api_spend",
      "amountCents": 150,
      "currency": "USD",
      "description": "OpenAI GPT-4o call",
      "externalRef": null,
      "meta": {},
      "occurredAt": "2026-02-26T...",
      "createdAt": "2026-02-26T..."
    }
  ],
  "monthDebitCents": 4500
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `total` | number | Total entries for this tenant |
| `entries` | array | Paginated ledger entries |
| `monthDebitCents` | number | Sum of all debits this calendar month |

## Create Ledger Entry

```
POST /v1/ledger/entries
```

**Auth:** JWT.

**Request Body:**

```json
{
  "tenantId": "uuid",
  "entryType": "debit",
  "category": "api_spend",
  "amountCents": 150,
  "currency": "USD",
  "description": "OpenAI GPT-4o call for daily briefing",
  "externalRef": "chatcmpl-abc123",
  "meta": { "model": "gpt-4o", "tokens": 1500 },
  "occurredAt": "2026-02-26T10:00:00Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenantId` | string | Yes | Tenant UUID |
| `entryType` | string | No | `debit` (default) or `credit` |
| `category` | string | No | See categories below (default: `misc`) |
| `amountCents` | number | No | Amount in cents (default: 0) |
| `currency` | string | No | ISO currency code (default: `USD`) |
| `description` | string | Yes | Human-readable description |
| `externalRef` | string | No | External reference ID |
| `meta` | object | No | Arbitrary metadata |
| `occurredAt` | string | No | ISO timestamp (default: now) |

**Categories:**

| Input Value | Normalized To |
|-------------|---------------|
| `hosting`, `saas`, `domain`, `email`, `social`, `infra`, `ads` | `api_spend` |
| `ai_spend`, `token_spend`, `api_spend`, `tokens`, `api` | `token_spend` |
| `subscription` | `subscription` |
| `other`, `misc`, (default) | `misc` |

**Response:**

```json
{ "ok": true, "entry": {...} }
```

**Example:**

```bash
curl -s "https://atlas-ux.onrender.com/v1/ledger/entries?tenantId=$TENANT_ID&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```
