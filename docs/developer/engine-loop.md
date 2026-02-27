# Engine Loop

The engine loop is the autonomous heart of Atlas UX. It runs as a separate Node.js process (`backend/src/workers/engineLoop.ts`) that continuously polls the database for pending work and orchestrates AI agent actions.

## Overview

The engine loop:

1. Checks if Atlas is "online" via the `system_state` table (key: `atlas_online`).
2. If online, calls `engineTick()` in a tight batch loop to drain the intent queue.
3. Writes `last_tick_at` back to `system_state` so the UI can show real-time engine health.
4. Sleeps briefly, then repeats.

If Atlas is offline, the loop sleeps longer and retries.

## Architecture

```
                     system_state
                   ┌──────────────┐
                   │ atlas_online │
                   │ engine_enabled│
                   │ last_tick_at  │
                   └──────┬───────┘
                          │ read
                          v
┌─────────────────────────────────────────┐
│            engineLoop.ts                │
│                                         │
│   while (true) {                        │
│     if (!online) sleep(offlineMs)       │
│     for (i < maxTicksPerCycle)          │
│       engineTick()                      │
│       update last_tick_at               │
│     sleep(idleMs)                       │
│   }                                     │
└────────────────┬────────────────────────┘
                 │ calls
                 v
┌─────────────────────────────────────────┐
│         core/engine/engine.ts           │
│   engineTick() — picks up intents,     │
│   runs SGL evaluation, executes tools, │
│   writes results back to DB            │
└─────────────────────────────────────────┘
```

## The Intent Queue

Intents are rows in the `intents` table with status `DRAFT`. They represent actions that an agent, user, or the scheduler has requested. The engine claims intents using an atomic SQL UPDATE with `FOR UPDATE SKIP LOCKED` to safely handle concurrency:

```sql
UPDATE intents
SET status = 'VALIDATING'
WHERE id = (
  SELECT id FROM intents
  WHERE status = 'DRAFT'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
RETURNING id, tenant_id, agent_id, intent_type, status, payload, sgl_result, created_at
```

This ensures only one worker claims each intent, even with multiple workers running.

## Engine Tick Cycle

Each call to `engineTick()` in `backend/src/core/engine/engine.ts` performs:

1. **Claim** -- `claimNextIntent()` atomically claims the oldest DRAFT intent.
2. **Audit** -- Logs `ENGINE_CLAIMED_INTENT` to the audit trail.
3. **Build Packets** -- `buildPackets()` runs subroutines to gather context.
4. **SGL Gate** -- `atlasExecuteGate()` evaluates the intent against SGL rules:
   - `ALLOW` -> proceed to execution
   - `REVIEW` -> set status to `AWAITING_HUMAN`, return
   - `BLOCK` -> set status to `BLOCKED_SGL`, return
5. **Execute** -- For `ENGINE_RUN` intents, looks up the workflow handler and executes it.
6. **Finalize** -- Sets intent status to `EXECUTED` or `FAILED`, writes audit log.

## Intent State Machine

```
DRAFT -> VALIDATING -> EXECUTED
                    -> FAILED
                    -> BLOCKED_SGL
                    -> AWAITING_HUMAN
```

All state transitions are recorded in the audit log.

## Worker Process

The standalone worker (`backend/src/workers/engineLoop.ts`) wraps `engineTick()` in an infinite loop:

```typescript
async function main() {
  const idleMs = Math.max(50, Number(process.env.ENGINE_LOOP_IDLE_MS ?? 750));
  const offlineMs = Math.max(250, Number(process.env.ENGINE_LOOP_OFFLINE_MS ?? 2500));
  const maxTicksPerCycle = Math.max(1, Math.min(200,
    Number(process.env.ENGINE_LOOP_MAX_TICKS_PER_CYCLE ?? 25)));

  while (true) {
    if (stopping) process.exit(0);

    const row = await getSystemState("atlas_online");
    if (!isAtlasOnline(row?.value)) {
      await sleep(offlineMs);
      continue;
    }

    let didWork = false;
    for (let i = 0; i < maxTicksPerCycle; i++) {
      const out = await engineTick();
      if (!out?.ran) break;
      didWork = true;
      await setLastTickAt(new Date().toISOString());
    }

    await sleep(didWork ? 0 : idleMs);
  }
}
```

## Environment Variables

| Variable                           | Default | Description                                      |
|------------------------------------|---------|--------------------------------------------------|
| `ENGINE_LOOP_IDLE_MS`              | `750`   | Sleep between cycles when no work was found       |
| `ENGINE_LOOP_OFFLINE_MS`           | `2500`  | Sleep when Atlas is offline or after errors       |
| `ENGINE_LOOP_MAX_TICKS_PER_CYCLE`  | `25`    | Max intents drained per cycle before pausing      |

The in-process engine (in `server.ts`) uses different variables:

| Variable                    | Default | Description                                |
|-----------------------------|---------|---------------------------------------------|
| `ENGINE_ENABLED`            | `false` | Enables the in-process setInterval engine   |
| `ENGINE_TICK_INTERVAL_MS`   | `5000`  | Tick interval for in-process engine         |

## Online/Offline Toggle

The engine respects a DB-backed kill switch. The `system_state` row with key `atlas_online` stores a JSON value:

```json
{
  "engine_enabled": true,
  "online": true,
  "last_tick_at": "2026-02-26T08:30:00.000Z"
}
```

The engine checks `engine_enabled` first, then falls back to `online`. Either flag being `true` enables the engine.

```typescript
function isAtlasOnline(value: unknown): boolean {
  const o = asObj(value);
  return Boolean(o.engine_enabled ?? o.online ?? false);
}
```

This allows operators to shut down all autonomous agent activity from the UI or database without redeploying.

## Embedded Engine

When `ENGINE_ENABLED=true` in the main server process, `server.ts` runs `engineTick()` on a `setInterval`:

```typescript
if (engineEnabled) {
  setInterval(async () => {
    await engineTick();
  }, tickMs);
}
```

This is simpler but co-locates engine work with API handling. The standalone worker is preferred for production.

## Workflow Execution

When an intent has `intentType === "ENGINE_RUN"`, the engine:

1. Extracts `workflowId` from the intent payload.
2. Checks if the workflow exists in the DB or the canonical workflow registry (`CANONICAL_WORKFLOW_KEYS`).
3. Looks up the handler via `getWorkflowHandler(workflowId)`.
4. Calls the handler with `{ tenantId, requestedBy, agentId, workflowId, input, traceId, intentId }`.
5. Logs `WORKFLOW_COMPLETE` to the audit trail.

## Safety Guardrails

The engine never executes without SGL evaluation. The `atlasExecuteGate()` function checks:

- **Actor must be ATLAS** (single executor rule).
- **Regulated actions** (gov filing, bank transfer, crypto) require human review.
- **PHI data class** requires human review.
- **Spend above `AUTO_SPEND_LIMIT_USD`** requires a DecisionMemo approval.
- **Daily action cap** (`MAX_ACTIONS_PER_DAY`) is enforced.
- **Confidence below `CONFIDENCE_AUTO_THRESHOLD`** routes to human review.

## Graceful Shutdown

The loop handles `SIGINT` and `SIGTERM` signals for clean shutdown:

```typescript
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });
```

On the next iteration, the loop detects the `stopping` flag and exits cleanly.

## Running Locally

```bash
cd backend
npm run worker:engine
```

Make sure the database is accessible and `atlas_online` is set to `{ "engine_enabled": true }` in the `system_state` table.

## Deployment

On Render, the engine loop runs as a dedicated worker service (`atlasux-engine-worker`), separate from the web server. See `render.yaml` for the service definition.

## Monitoring

The `last_tick_at` field in `system_state` is used by the frontend's Agent Watcher component (`src/components/AgentWatcher.tsx`) to display real-time engine health. If `last_tick_at` is stale (more than a few seconds old while the engine is supposed to be online), something is wrong.

The runtime status endpoint (`GET /v1/runtime/status`) exposes engine state and last tick time for external monitoring.
