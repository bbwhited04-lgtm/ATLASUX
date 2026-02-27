# Runtime API

The Runtime API provides status information about the Atlas UX engine, including whether the engine is enabled, whether any actions are awaiting human approval, and when the engine last ticked.

## Base URL

```
/v1/runtime
```

---

## GET /v1/runtime/status

Returns the current runtime state of the AI engine.

**Request:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
     https://api.atlasux.cloud/v1/runtime/status
```

**Response (200):**

```json
{
  "ok": true,
  "engineEnabled": true,
  "needsHuman": false,
  "lastTickAt": "2026-02-26T12:05:00.000Z",
  "updatedAt": "2026-02-26T12:05:00.000Z"
}
```

**Response Fields:**

| Field           | Type    | Description                                              |
|-----------------|---------|----------------------------------------------------------|
| `engineEnabled` | boolean | Whether the AI orchestration engine is currently running  |
| `needsHuman`    | boolean | Whether any approvals are pending (decisions/approvals)   |
| `lastTickAt`    | string  | ISO timestamp of the last engine tick (or null)           |
| `updatedAt`     | string  | When the system state row was last updated                |

**Error (500):**

```json
{ "ok": false, "error": "RUNTIME_STATUS_FAILED" }
```

---

## How It Works

The runtime status is read from the `system_state` database table (key: `atlas_online`). This row contains a JSON value with:

```json
{
  "online": true,
  "engine_enabled": true,
  "last_tick_at": "2026-02-26T12:05:00.000Z"
}
```

The `needsHuman` flag is derived from the `approvals` table by counting rows that have not yet expired.

---

## Engine Architecture

The engine loop is a separate Node.js process (`workers/engineLoop.ts`) that:

1. Ticks every `ENGINE_TICK_INTERVAL_MS` (default: 5000ms).
2. Picks up pending jobs from the `jobs` table.
3. Processes intents, runs agent workflows, and dispatches actions.
4. Writes the `last_tick_at` timestamp back to `system_state`.

The engine can be enabled or disabled via the `ENGINE_ENABLED` environment variable.

---

## Environment Variables

| Variable                   | Default | Description                          |
|----------------------------|---------|--------------------------------------|
| `ENGINE_ENABLED`           | `false` | Set to `true` to enable the engine   |
| `ENGINE_TICK_INTERVAL_MS`  | `5000`  | Milliseconds between engine ticks    |

---

## Frontend Usage

The frontend uses this endpoint to show the runtime status indicator in the dashboard header. When `needsHuman` is true, a badge appears prompting the user to review pending approvals.

```typescript
const res = await api.get("/v1/runtime/status");
if (res.data.needsHuman) {
  showApprovalBadge();
}
```

---

## Related Endpoints

- [Decisions API](./decisions.md) -- manage the decision memos that trigger `needsHuman`
- [Jobs API](./jobs.md) -- view queued and running jobs the engine processes
- [Audit API](./audit.md) -- inspect engine actions in the audit trail
