# Atlas UX API -- Stripe

Endpoints for Stripe product catalog management and billing webhooks. Product creation is gated by RBAC and safety guardrails.

## Health Check

```
GET /v1/stripe/health
```

Checks whether the `STRIPE_SECRET_KEY` is configured.

**Response:**

```json
{ "ok": true, "stripe_key_configured": true }
```

## Create Product Directly

```
POST /v1/stripe/products
```

Creates a Stripe product and price using the server-owned `STRIPE_SECRET_KEY`. High-impact operation with strict rate limits.

**Auth:** JWT + `x-tenant-id` header. Requires role: `owner`, `admin`, `exec`, or `atlas`.

**Rate Limit:** 5 req/min.

**Request Body:**

```json
{
  "fromAgent": "atlas",
  "name": "Premium Widget",
  "description": "A premium widget for enterprise customers",
  "priceUSD": 49.99,
  "currency": "usd",
  "metadata": { "sku": "WIDGET-001" }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromAgent` | string | Yes | Agent initiating the request |
| `name` | string | Yes | Product name |
| `description` | string | No | Product description |
| `priceUSD` | number | Yes | Price in USD (non-negative) |
| `currency` | string | No | Currency code (default: `usd`) |
| `metadata` | object | No | Arbitrary key-value metadata |

**Response:**

```json
{ "ok": true, "productId": "prod_xxx", "priceId": "price_xxx" }
```

**Example:**

```bash
curl -s -X POST https://atlas-ux.onrender.com/v1/stripe/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"fromAgent":"atlas","name":"Widget","priceUSD":9.99}'
```

## Request Product Creation (Approval Flow)

```
POST /v1/stripe/products/request
```

Creates an Intent record requiring human approval before the product is created in Stripe.

**Auth:** JWT + `x-tenant-id` header. Requires role: `owner`, `admin`, `exec`, or `atlas`.

**Rate Limit:** 10 req/min.

**Request Body:** Same as `POST /v1/stripe/products` plus:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rationale` | string | No | Reason for creating this product |

**Response:**

```json
{ "ok": true, "intentId": "uuid", "status": "AWAITING_HUMAN" }
```

## Billing Webhook

```
POST /v1/billing/stripe/webhook
```

Receives Stripe webhook events. Verifies the `Stripe-Signature` header using `STRIPE_WEBHOOK_SECRET`.

**Auth:** Stripe signature verification (no JWT).

**Handled Events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Logs to audit trail with payment details |
| `payment_intent.succeeded` | Logged (informational) |
| `charge.refunded` | Logs refund to audit trail |

**Response:** Always returns `200` to prevent Stripe retries:

```json
{ "ok": true, "received": "checkout.session.completed" }
```

**Error Responses:**

| Code | Reason |
|------|--------|
| 400 | Missing `stripe-signature` header |
| 401 | Invalid signature |
| 503 | `STRIPE_WEBHOOK_SECRET` not configured |
