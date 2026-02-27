# Job System

The job system provides asynchronous task processing via a database-backed queue. Workers poll the `jobs` table for work, process it, and update the status.

## Job Lifecycle

```
queued  -->  running  -->  succeeded
                      -->  failed (retry or permanent)
```

### States

| Status | Description |
|--------|-------------|
| `queued` | Job is waiting to be picked up by a worker |
| `running` | A worker has claimed the job and is processing it |
| `succeeded` | Job completed successfully |
| `failed` | Job failed (may have retries remaining or permanently failed) |

## Job Table Schema

From `backend/prisma/schema.prisma`:

```prisma
model Job {
  id                   String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId             String     @map("tenant_id") @db.Uuid
  status               job_status @default(queued)
  jobType              String     @map("job_type")
  priority             Int        @default(0)
  input                Json       @default("{}")
  output               Json       @default("{}")
  error                Json       @default("{}")
  costCents            Int        @default(0)
  retryCount           Int        @default(0)
  maxRetries           Int        @default(3)
  nextRetryAt          DateTime?
  startedAt            DateTime?
  finishedAt           DateTime?
  createdAt            DateTime   @default(now())
}
```

Key fields:
- **`jobType`**: Identifies the work to perform (e.g., `EMAIL_SEND`, `ENGINE_RUN`)
- **`priority`**: Higher values are processed first
- **`input`**: JSON payload for the worker
- **`output`**: JSON result after successful completion
- **`error`**: JSON error details on failure
- **`retryCount` / `maxRetries`**: Retry tracking (default 3 retries)
- **`nextRetryAt`**: Exponential backoff schedule for retries

## Job Types

| Type | Worker | Description |
|------|--------|-------------|
| `EMAIL_SEND` | `emailSender.ts` | Send an email via Microsoft Graph or Resend |
| `ENGINE_RUN` | `engineLoop.ts` | Execute a workflow via the engine |
| Generic types | `jobWorker.ts` | Various operational tasks |

## Worker Pattern

All workers follow the same polling pattern:

```typescript
while (true) {
  // 1. Check if Atlas is online
  const online = await checkAtlasOnline();
  if (!online) { await sleep(pollMs); continue; }

  // 2. Query for queued jobs
  const jobs = await prisma.job.findMany({
    where: { status: "queued", jobType: { in: ["EXPECTED_TYPES"] } },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: batchSize,
  });

  // 3. Claim each job (optimistic lock)
  for (const job of jobs) {
    const claimed = await prisma.job.updateMany({
      where: { id: job.id, status: "queued" },
      data: { status: "running", startedAt: new Date() },
    });
    if (claimed.count !== 1) continue;  // Another worker got it

    // 4. Process the job
    // 5. Update status to succeeded or handle failure
  }

  await sleep(pollMs);
}
```

## Claiming (Optimistic Lock)

Workers claim jobs using `updateMany` with a `WHERE status = 'queued'` filter. If another worker already claimed the job, `claimed.count` will be 0 and the worker skips it. This avoids duplicate processing without requiring advisory locks.

The engine loop uses a more robust `FOR UPDATE SKIP LOCKED` SQL for intent claiming.

## Retry Logic

Failed jobs are retried with exponential backoff:

```typescript
const delayMs = 10_000 * Math.pow(2, retryCount);  // 10s, 20s, 40s, 80s...
const nextRetryAt = new Date(now.getTime() + delayMs);

await prisma.job.update({
  where: { id: jobId },
  data: {
    status: "queued",        // Back to queued for retry
    retryCount: retryCount + 1,
    nextRetryAt,
    error: { message: errMsg, attemptedAt: now.toISOString() },
  },
});
```

Workers skip jobs where `nextRetryAt` is in the future:

```typescript
where: {
  OR: [
    { nextRetryAt: null },
    { nextRetryAt: { lte: new Date() } },
  ],
}
```

After exhausting `maxRetries`, the job is permanently marked as `failed` and an audit log entry is created with `JOB_EXHAUSTED_RETRIES`.

## Atlas Online Gate

All workers check the `atlas_online` system state before processing. When Atlas is offline, workers sleep without processing any jobs. This provides a global pause mechanism.

## Audit Integration

Successful job completion and permanent failures are both logged to the `audit_log` table. Email jobs log `EMAIL_SENT` on success; exhausted retries log `JOB_EXHAUSTED_RETRIES`.

## Creating Jobs

Jobs are typically created by:
- API route handlers (e.g., sending an email)
- The scheduler worker (firing scheduled workflows)
- The engine (creating sub-tasks during workflow execution)

```typescript
await prisma.job.create({
  data: {
    tenantId,
    jobType: "EMAIL_SEND",
    input: { to, subject, text, html },
    priority: 0,
    maxRetries: 3,
  },
});
```
