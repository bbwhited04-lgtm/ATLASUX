# Decision Memos API

Decision memos are the approval mechanism for high-risk agent actions. When an AI agent proposes an action that exceeds safety thresholds (spend above `AUTO_SPEND_LIMIT_USD`, risk tier >= 2, or recurring charges), a decision memo is created and must be approved by a human before execution.

## Base URL

```
/v1/decisions
```

---

## POST /v1/decisions

Create a new decision memo (proposal).

**Request:**

```bash
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "agent": "binky",
       "title": "Purchase Ahrefs subscription",
       "rationale": "SEO tool needed for keyword research and competitor analysis",
       "estimatedCostUsd": 99.00,
       "billingType": "recurring",
       "riskTier": 2,
       "confidence": 0.85,
       "expectedBenefit": "Improved organic search visibility"
     }' \
     https://api.atlasux.cloud/v1/decisions
```

**Request Body (Zod-validated):**

| Field              | Type    | Required | Description                                  |
|--------------------|---------|----------|----------------------------------------------|
| `agent`            | string  | Yes      | Agent key (e.g., `binky`, `tina`, `atlas`)   |
| `title`            | string  | Yes      | Short description of the proposed action      |
| `rationale`        | string  | Yes      | Detailed justification (up to 5000 chars)     |
| `estimatedCostUsd` | number  | No       | Estimated cost in USD                         |
| `billingType`      | enum    | No       | `none`, `one_time`, or `recurring`            |
| `riskTier`         | integer | No       | 0-5 risk level (0=none, 5=critical)           |
| `confidence`       | number  | No       | Agent confidence score (0.0 to 1.0)           |
| `expectedBenefit`  | string  | No       | What the agent expects to gain                |
| `payload`          | any     | No       | Arbitrary data attached to the memo           |

**Response (200):**

```json
{
  "ok": true,
  "memo": {
    "id": "memo_abc123",
    "tenantId": "9a8a332c-...",
    "agent": "binky",
    "title": "Purchase Ahrefs subscription",
    "status": "PROPOSED",
    "estimatedCostUsd": 99.00,
    "billingType": "recurring",
    "riskTier": 2,
    "createdAt": "2026-02-26T10:00:00.000Z"
  }
}
```

---

## GET /v1/decisions

List decision memos for the current tenant.

**Query Parameters:**

| Param    | Type   | Default | Description                                |
|----------|--------|---------|--------------------------------------------|
| `status` | string | (all)   | Filter by status: `PROPOSED`, `APPROVED`, `REJECTED` |
| `take`   | number | 50      | Max results (capped at 200)                |

**Request:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     "https://api.atlasux.cloud/v1/decisions?status=PROPOSED&take=20"
```

**Response (200):**

```json
{
  "ok": true,
  "memos": [
    {
      "id": "memo_abc123",
      "agent": "binky",
      "title": "Purchase Ahrefs subscription",
      "status": "PROPOSED",
      "estimatedCostUsd": 99.00,
      "riskTier": 2,
      "createdAt": "2026-02-26T10:00:00.000Z"
    }
  ]
}
```

---

## POST /v1/decisions/:id/approve

Approve a decision memo. Guardrails are enforced server-side -- if recurring purchases are blocked or the spend limit is exceeded without proper authorization, the approval will be rejected.

**Rate limit:** 10 requests per minute.

**Request:**

```bash
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     https://api.atlasux.cloud/v1/decisions/memo_abc123/approve
```

**Response (200) -- approved:**

```json
{ "ok": true, "memo": { "id": "memo_abc123", "status": "APPROVED" }, "guard": null }
```

**Response (409) -- guardrail block:**

```json
{
  "ok": false,
  "error": "guardrail_block",
  "guard": "recurring_purchases_blocked",
  "memo": { "id": "memo_abc123", "status": "PROPOSED" }
}
```

---

## POST /v1/decisions/:id/reject

Reject a decision memo with an optional reason.

**Rate limit:** 20 requests per minute.

**Request:**

```bash
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Budget exceeded for Q1"}' \
     https://api.atlasux.cloud/v1/decisions/memo_abc123/reject
```

**Response (200):**

```json
{ "ok": true, "memo": { "id": "memo_abc123", "status": "REJECTED" } }
```

---

## GET /v1/decisions/analytics

Aggregate analytics for decision memos across the tenant.

**Response (200):**

```json
{
  "ok": true,
  "total": 45,
  "approved": 30,
  "rejected": 10,
  "pending": 5,
  "approvalRate": "67%",
  "avgCostUsd": 42.50,
  "totalApprovedCostUsd": 1275.00,
  "byAgent": {
    "binky": { "total": 20, "approved": 15, "rejected": 3 },
    "tina": { "total": 10, "approved": 8, "rejected": 2 }
  }
}
```

---

## Templates

### GET /v1/decisions/templates

List reusable decision memo templates for the tenant.

### POST /v1/decisions/templates

Create a new template with `name`, `description`, `defaultTitle`, `defaultRationale`, `billingType`, and `riskTier`.

### DELETE /v1/decisions/templates/:id

Delete a template by ID.

---

## Safety Guardrails

The following guardrails are enforced during approval:

- **Recurring purchase block**: Recurring billing types are blocked by default in Alpha.
- **Daily action cap**: `MAX_ACTIONS_PER_DAY` limits total agent actions.
- **Spend limit**: Actions above `AUTO_SPEND_LIMIT_USD` require human approval.
- **Risk tier**: Actions at risk tier >= 2 always require approval.

All approval and rejection actions are logged to the `audit_log` table with the actor's user ID.
