# Atlas UX API -- Health and Runtime

Endpoints for monitoring system health, database readiness, and engine runtime status.

## Liveness Check

```
GET /v1/health
```

Lightweight no-dependency liveness probe. Returns immediately if the server is running.

**Auth:** None required.

**Response:**

```json
{ "ok": true, "status": "alive" }
```

**Example:**

```bash
curl -s https://atlas-ux.onrender.com/v1/health
```

## Readiness Check

```
GET /v1/ready
```

Dependency readiness probe. Verifies the database connection by executing `SELECT 1`.

**Auth:** None required.

**Response:**

```json
{ "ok": true, "status": "ready" }
```

**Error:** Returns `500` if the database is unreachable.

**Example:**

```bash
curl -s https://atlas-ux.onrender.com/v1/ready
```

## Runtime Status

```
GET /v1/runtime/status
```

Returns the current state of the AI engine, including whether it is enabled, whether any approvals are pending, and the timestamp of the last engine tick.

**Auth:** JWT recommended (uses database queries).

**Response:**

```json
{
  "ok": true,
  "engineEnabled": true,
  "needsHuman": false,
  "lastTickAt": "2026-02-26T10:00:05.123Z",
  "updatedAt": "2026-02-26T10:00:05.123Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `engineEnabled` | boolean | Whether the engine loop is active |
| `needsHuman` | boolean | Whether there are pending approvals requiring human action |
| `lastTickAt` | string/null | ISO timestamp of the last engine tick |
| `updatedAt` | string/null | When the `atlas_online` system state was last updated |

**Implementation Notes:**

- Engine status is read from the `system_state` table (key: `atlas_online`)
- Pending approvals are counted from the `approvals` table (non-expired rows)
- The engine loop ticks every 5 seconds (configurable via `ENGINE_TICK_INTERVAL_MS`)

**Example:**

```bash
curl -s https://atlas-ux.onrender.com/v1/runtime/status \
  -H "Authorization: Bearer $TOKEN"
```

## Usage in Deployment

These endpoints are used by Render health checks and the frontend status bar:

| Endpoint | Purpose |
|----------|---------|
| `/v1/health` | Render liveness probe |
| `/v1/ready` | Render readiness probe |
| `/v1/runtime/status` | Frontend engine status indicator |

## Engine Configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| `ENGINE_ENABLED` | `false` | Set to `true` to enable the engine loop |
| `ENGINE_TICK_INTERVAL_MS` | `5000` | Engine tick interval in milliseconds |
| `MAX_ACTIONS_PER_DAY` | -- | Daily action cap (safety guardrail) |
| `AUTO_SPEND_LIMIT_USD` | -- | Auto-approve spend threshold |
| `CONFIDENCE_AUTO_THRESHOLD` | -- | Confidence level for auto-execution |
