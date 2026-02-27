# Billing API

Atlas UX uses Stripe for payment processing and subscription management. The billing system supports four plan tiers with per-seat pricing for team plans.

## Plan Tiers

| Tier       | Price          | Tokens/Day | Storage   | Agents | Jobs/Day |
|------------|----------------|------------|-----------|--------|----------|
| Starter    | $0/mo          | 10,000     | 50 MB     | 3      | 10       |
| Pro        | $19/mo         | 500,000    | 1 GB      | 25     | 100      |
| Business   | $45/seat/mo    | 2,000,000  | 10 GB     | 100    | 500      |
| Enterprise | $39/seat/mo    | Unlimited  | 100 GB    | Unlimited | Unlimited |

During Alpha, all users are on the `free_beta` tier with Pro-equivalent limits.

---

## GET /v1/pricing

Public endpoint (no auth required). Returns all available pricing tiers.

**Request:**

```bash
curl https://api.atlasux.cloud/v1/pricing
```

**Response (200):**

```json
{
  "ok": true,
  "tiers": [
    {
      "tier": "free_beta",
      "priceCentsMonthly": 0,
      "priceDisplay": "Free",
      "tokenBudgetPerDay": 10000,
      "storageLimitBytes": 52428800,
      "agentLimit": 3,
      "jobsPerDay": 10
    },
    {
      "tier": "pro",
      "priceCentsMonthly": 1900,
      "priceDisplay": "$19/mo",
      "tokenBudgetPerDay": 500000,
      "storageLimitBytes": 1073741824,
      "agentLimit": 25,
      "jobsPerDay": 100
    }
  ]
}
```

---

## Stripe Webhook

### POST /v1/billing/stripe/webhook

Receives and processes Stripe webhook events. Verifies the `Stripe-Signature` header using the `STRIPE_WEBHOOK_SECRET` environment variable.

**Handled Events:**

| Event Type                      | Action                                                     |
|---------------------------------|------------------------------------------------------------|
| `checkout.session.completed`    | Logs purchase to audit trail with amount and customer email |
| `payment_intent.succeeded`      | Logged for tracking                                        |
| `charge.refunded`               | Logged to audit trail with refund amount                   |

**Request (from Stripe):**

```
POST /v1/billing/stripe/webhook
Headers:
  Stripe-Signature: t=1234567890,v1=abc123...
  Content-Type: application/json
```

**Response (200):**

```json
{ "ok": true, "received": "checkout.session.completed" }
```

**Error (401) -- invalid signature:**

```json
{ "ok": false, "error": "invalid_signature" }
```

**Error (503) -- webhook not configured:**

```json
{ "ok": false, "error": "webhook_not_configured" }
```

---

## Stripe Product Management

### GET /v1/stripe/health

Check if the Stripe API key is configured.

```json
{ "ok": true, "stripe_key_configured": true }
```

### POST /v1/stripe/products/request

Request creation of a Stripe product (requires human approval). Rate limited to 10 per minute.

**Request Body:**

| Field       | Type   | Required | Description                    |
|-------------|--------|----------|--------------------------------|
| `fromAgent` | string | Yes      | Agent requesting the product   |
| `name`      | string | Yes      | Product name                   |
| `priceUSD`  | number | Yes      | Price in USD                   |
| `description` | string | No    | Product description            |
| `rationale` | string | No       | Why this product should exist  |

**Response:**

```json
{ "ok": true, "intentId": "intent_xyz", "status": "AWAITING_HUMAN" }
```

### POST /v1/stripe/products

Directly create a Stripe product and price. Rate limited to 5 per minute. Requires `owner`, `admin`, `exec`, or `atlas` role.

**Response:**

```json
{
  "ok": true,
  "productId": "prod_abc123",
  "priceId": "price_xyz789"
}
```

---

## Subscription Endpoints

### GET /v1/me/subscription

Returns the current user's subscription info (see [Auth API](./auth.md)).

### PATCH /v1/tenants/:tenantId/seats/:userId

Change a user's seat type (see [Tenants API](./tenants.md)).

---

## Environment Variables

| Variable                 | Description                              |
|--------------------------|------------------------------------------|
| `STRIPE_SECRET_KEY`      | Stripe secret API key                    |
| `STRIPE_WEBHOOK_SECRET`  | Webhook signing secret for verification  |

---

## Audit Trail

All billing events are logged:

- `STRIPE_CHECKOUT_COMPLETED` -- successful purchase
- `STRIPE_REFUND` -- refund processed
- `STRIPE_PRODUCT_REQUESTED` -- product creation requested
- `STRIPE_PRODUCT_CREATED` -- product created in Stripe
- `SEAT_CHANGED` -- seat type modified

Each event includes a corresponding ledger entry for financial tracking.
