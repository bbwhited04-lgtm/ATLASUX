# Workers

Atlas UX runs several background worker processes alongside the main API server. Each worker is a standalone Node.js process that polls the database for work, processes it, and writes results back. On Render, each worker runs as a separate service.

## Worker Architecture

```
┌─────────────────────────────┐
│     Render Services          │
│                              │
│  ┌────────────────────────┐  │
│  │  atlasux-backend (web) │  │
│  │  Fastify API server    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  atlasux-engine-worker │  │     ┌──────────────────┐
│  │  engineLoop.ts         │──┼────>│  intents table    │
│  └────────────────────────┘  │     │  system_state     │
│                              │     └──────────────────┘
│  ┌────────────────────────┐  │
│  │  atlasux-email-worker  │  │     ┌──────────────────┐
│  │  emailSender.ts        │──┼────>│  jobs table       │
│  └────────────────────────┘  │     │  (EMAIL_SEND)     │
│                              │     └──────────────────┘
│  ┌────────────────────────┐  │
│  │  atlasux-scheduler     │  │     ┌──────────────────┐
│  │  schedulerWorker.ts    │──┼────>│  intents table    │
│  └────────────────────────┘  │     │  system_state     │
│                              │     └──────────────────┘
└─────────────────────────────┘
```

## Email Sender Worker

**File:** `backend/src/workers/emailSender.ts`
**Render service:** `atlasux-email-worker`
**Start command:** `npm run worker:email`

Polls the `jobs` table for `EMAIL_SEND` jobs and delivers them via the configured email provider.

### How It Works

1. Checks if Atlas is online (via `system_state` table).
2. Queries for queued email jobs: `WHERE status = 'queued' AND jobType IN ('EMAIL_SEND', 'EMAILSEND', 'email_send')`.
3. Claims a job with an optimistic lock (`UPDATE ... WHERE status = 'queued'`).
4. Sends via the configured provider (Microsoft Graph API or Resend).
5. On success: marks job as `succeeded`, writes an audit log entry.
6. On failure: retries with exponential backoff (10s, 20s, 40s, ...) up to `maxRetries`.

### Providers

**Microsoft Graph API** (when `OUTBOUND_EMAIL_PROVIDER=microsoft`):
```typescript
// Authenticates via client_credentials flow
const token = await getMsAccessToken();  // MS_TENANT_ID + MS_CLIENT_ID + MS_CLIENT_SECRET
await fetch(`https://graph.microsoft.com/v1.0/users/${MS_SENDER_UPN}/sendMail`, { ... });
```

**Resend** (when `OUTBOUND_EMAIL_PROVIDER=resend`):
```typescript
await fetch("https://api.resend.com/emails", {
  headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  body: JSON.stringify({ from, to, subject, text, html }),
});
```

### Environment Variables

| Variable                  | Default    | Description                          |
|---------------------------|------------|--------------------------------------|
| `OUTBOUND_EMAIL_PROVIDER` | `resend`   | `microsoft`, `resend`, or `none`     |
| `EMAIL_WORKER_POLL_MS`    | `2000`     | Polling interval in ms               |
| `EMAIL_WORKER_BATCH`      | `10`       | Max jobs per poll cycle              |
| `MS_SENDER_UPN`           | --         | Microsoft sender (e.g., `atlas@deadapp.info`) |

## Engine Loop Worker

**File:** `backend/src/workers/engineLoop.ts`
**Render service:** `atlasux-engine-worker`
**Start command:** `npm run worker:engine`

The autonomous AI orchestration engine. Processes intents from the `intents` table.

### How It Works

1. Reads `atlas_online` from `system_state` to check if the engine is enabled.
2. If online, calls `engineTick()` in a batch loop (up to `ENGINE_LOOP_MAX_TICKS_PER_CYCLE` per cycle).
3. Each tick picks up one intent, runs SGL evaluation, executes tools, and writes results.
4. Updates `last_tick_at` in `system_state` for health monitoring.
5. If no work, sleeps for `ENGINE_LOOP_IDLE_MS`.

### Environment Variables

| Variable                           | Default | Description                           |
|------------------------------------|---------|---------------------------------------|
| `ENGINE_LOOP_IDLE_MS`              | `750`   | Sleep when idle                       |
| `ENGINE_LOOP_OFFLINE_MS`           | `2500`  | Sleep when offline or after errors    |
| `ENGINE_LOOP_MAX_TICKS_PER_CYCLE`  | `25`    | Max intents per cycle                 |

See [Engine Loop](./engine-loop.md) for full details.

## Scheduler Worker

**File:** `backend/src/workers/schedulerWorker.ts`
**Render service:** `atlasux-scheduler`
**Start command:** `npm run worker:scheduler`

A cron-like system that fires agent workflows on a daily and weekly schedule.

### How It Works

1. Polls every `SCHEDULER_POLL_MS` (default 60s).
2. Checks the current UTC time against a hardcoded schedule of 40+ jobs.
3. For each job whose time window matches (within +/-1 minute), checks de-duplication.
4. Creates an `Intent` record with `status: "DRAFT"` for the engine to process.
5. Writes an audit log entry for each fired job.

### Schedule Phases

| Phase | Time (UTC)   | Description                          | Jobs     |
|-------|-------------|--------------------------------------|----------|
| 1     | 05:00-05:36 | Platform Intel Sweep (13 agents)     | WF-093 to WF-105 |
| 2     | 05:45       | Atlas Aggregation & Task Assignment  | WF-106   |
| 3     | 06:00-19:00 | Research, publishing, operations     | WF-010 to WF-089 |
| Weekly| Mon/Wed/Fri | Strategy, compliance, finance        | WF-063 to WF-108 |

### De-duplication

Each job is tracked in `system_state` to prevent double-firing:

- **Daily jobs:** Key is `scheduler:{jobId}`, token is today's date (`YYYY-MM-DD`).
- **Weekly jobs:** Key is `scheduler:{jobId}:{YYYY-Www}`, token is the ISO week string.

### Environment Variables

| Variable             | Default | Description                              |
|----------------------|---------|------------------------------------------|
| `SCHEDULER_ENABLED`  | --      | Set to `"false"` to pause all jobs       |
| `SCHEDULER_POLL_MS`  | `60000` | Polling interval (ms)                    |
| `TENANT_ID`          | --      | Tenant ID for scheduler-created intents  |

## Running Workers Locally

```bash
cd backend

# Run each in a separate terminal
npm run worker:engine     # Engine loop
npm run worker:email      # Email sender
npm run worker:scheduler  # Scheduler
```

All workers require `DATABASE_URL` and `SUPABASE_URL` to connect to the database.

## Graceful Shutdown

All workers handle `SIGINT` and `SIGTERM` for clean shutdown:

```typescript
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

while (true) {
  if (stopping) {
    process.stdout.write("[worker] stopping\n");
    process.exit(0);
  }
  // ... work loop
}
```

## Error Recovery

| Worker     | Error Behavior                                                |
|------------|---------------------------------------------------------------|
| Engine     | Logs error, sleeps `offlineMs`, retries next cycle            |
| Email      | Retries job with exponential backoff; marks failed after `maxRetries` |
| Scheduler  | Logs error per job, continues to next job in the schedule     |

If a worker process crashes (unhandled exception), it exits with code 1 and Render automatically restarts it.

## Monitoring

- **Engine health:** Check `system_state.atlas_online.last_tick_at` for staleness.
- **Email delivery:** Query `jobs` table for `EMAIL_SEND` jobs with `status = 'failed'`.
- **Scheduler:** Check audit logs for `SCHEDULER_JOB_FIRED` actions.
- **Agent Watcher UI:** `src/components/AgentWatcher.tsx` polls the audit log every 4 seconds to display real-time agent activity.
