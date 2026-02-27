# Atlas UX API -- Audit Log

The audit log records every mutation in the system. All agent actions, user operations, and system events are immutably logged for compliance and observability.

## Health Check

```
GET /v1/audit/health
```

Verifies the audit log Prisma model is available.

**Response:**

```json
{ "ok": true, "prisma": true, "modelName": "AuditLog", "ts": "2026-02-26T..." }
```

## List Audit Entries

```
GET /v1/audit/list
```

Returns paginated audit log entries, newest first.

**Auth:** JWT + `x-tenant-id` header.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 50 | Max entries to return (1-200) |
| `cursor` | string | -- | Cursor for pagination (entry ID) |
| `tenantId` / `org_id` | string | -- | Filter by tenant (overridden by header) |
| `actorId` / `user_id` | string | -- | Filter by actor (UUID or external ID) |
| `action` | string | -- | Filter by action (e.g., `TEAMS_MESSAGE_SENT`) |
| `level` | string | -- | Filter by level: `info`, `warn`, `security` |

**Response:**

```json
{
  "ok": true,
  "items": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "actorType": "system",
      "actorExternalId": "atlas",
      "level": "info",
      "action": "SGL_EVALUATED",
      "entityType": "intent",
      "entityId": null,
      "message": "SGL ALLOW for CHAT_CALL",
      "meta": { "sgl": {}, "intentType": "CHAT_CALL" },
      "timestamp": "2026-02-26T..."
    }
  ],
  "page": { "limit": 50, "nextCursor": "uuid-or-null" }
}
```

**Pagination:** When `nextCursor` is not null, pass it as `?cursor=...` to fetch the next page.

**Example:**

```bash
curl -s "https://atlas-ux.onrender.com/v1/audit/list?limit=20&level=warn" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

## Get Single Entry

```
GET /v1/audit/:id
```

Returns a single audit log entry by ID.

**Response:**

```json
{ "ok": true, "item": { "id": "uuid", "action": "...", "..." } }
```

## Create Manual Entry

```
POST /v1/audit
```

Inserts a manual audit event. Useful for testing and wiring.

**Request Body:**

```json
{
  "tenantId": "uuid",
  "actorId": "user-or-agent-id",
  "actorType": "system",
  "action": "manual_event",
  "level": "info",
  "entityType": "test",
  "message": "Manual test entry",
  "meta": {}
}
```

**Response:** `201` on success, `202` if audit storage is not ready (graceful degradation).

**Example:**

```bash
curl -s -X POST https://atlas-ux.onrender.com/v1/audit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"uuid","action":"test","level":"info","message":"Test"}'
```

## Action Reference

| Action | Source | Description |
|--------|--------|-------------|
| `SGL_EVALUATED` | Chat | Governance gate result |
| `STRIPE_PRODUCT_CREATED` | Stripe | Product created in Stripe |
| `EMAIL_INBOUND_DISPATCHED` | Email | Inbound email classified and dispatched |
| `TEAMS_MESSAGE_SENT` | Teams | Message sent to Teams channel |
| `TELEGRAM_CHAT` | Telegram | User chatted via Telegram |
| `DECISION_MEMO_APPROVED` | Decisions | Decision memo approved |
| `CRM_CONTACT_CREATED` | CRM | New contact added |
| `FILE_DELETED` | Files | File removed from storage |
| `SEAT_CHANGED` | User | Seat type changed for a member |
