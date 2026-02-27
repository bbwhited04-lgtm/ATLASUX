# Atlas UX API -- Jobs

The jobs system provides a database-backed async task queue. Jobs progress through statuses: `queued` -> `running` -> `completed`/`failed`/`canceled`.

## List Jobs

```
GET /v1/jobs/list
```

Returns up to 200 jobs for the current tenant, ordered by priority (desc) then creation date (desc).

**Auth:** JWT + `x-tenant-id` header.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `org_id` / `orgId` | string | Fallback tenant ID if header missing |
| `user_id` / `userId` | string | Included in response metadata |

**Response:**

```json
{
  "ok": true,
  "org_id": "uuid",
  "user_id": null,
  "items": [
    {
      "id": "uuid",
      "jobType": "EMAIL_SEND",
      "status": "queued",
      "priority": 0,
      "input": {},
      "output": null,
      "error": null,
      "startedAt": null,
      "finishedAt": null,
      "createdAt": "2026-02-26T...",
      "updatedAt": "2026-02-26T..."
    }
  ],
  "ts": "2026-02-26T..."
}
```

**Example:**

```bash
curl -s https://atlas-ux.onrender.com/v1/jobs/list \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

## Create Job

```
POST /v1/jobs
```

Enqueues a new job for processing by the engine loop or email worker.

**Auth:** JWT + `x-tenant-id` header.

**Rate Limit:** 30 req/min.

**Request Body:**

```json
{
  "jobType": "EMAIL_SEND",
  "priority": 0,
  "input": {
    "to": "user@example.com",
    "subject": "Hello",
    "body": "Test message"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobType` | string | Yes | Job type identifier (e.g., `EMAIL_SEND`, `ENGINE_RUN`) |
| `priority` | number | No | Higher = processed first (default: 0) |
| `input` | object | No | Arbitrary JSON payload for the job |

**Response:**

```json
{ "ok": true, "id": "uuid", "status": "queued" }
```

**Seat Enforcement:** Returns `429` if user has exceeded their daily job limit.

**Example:**

```bash
curl -s -X POST https://atlas-ux.onrender.com/v1/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"jobType": "EMAIL_SEND", "input": {"to": "test@example.com"}}'
```

## Delete Job

```
DELETE /v1/jobs/:id
```

Removes a job that is not currently running. Only jobs with status `queued`, `canceled`, `failed`, or `succeeded` can be deleted.

**Auth:** JWT + `x-tenant-id` header.

**Response:**

```json
{ "ok": true }
```

**Example:**

```bash
curl -s -X DELETE https://atlas-ux.onrender.com/v1/jobs/JOB_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```
