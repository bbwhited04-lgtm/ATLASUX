# Error Handling

Atlas UX uses a layered error handling strategy across the backend. Errors are caught at the route level, logged to the audit trail, and returned to clients in a consistent format.

## Error Response Format

All error responses follow this structure:

```json
{
  "ok": false,
  "error": "ERROR_CODE",
  "message": "Human-readable explanation"
}
```

The `error` field is a machine-readable code. The `message` field is optional and provides context for debugging.

## HTTP Status Codes

| Code | Usage                                                    | Example Error Code              |
|------|----------------------------------------------------------|---------------------------------|
| 400  | Malformed request, missing required fields               | `MISSING_FIELD`                 |
| 401  | Missing or invalid auth token                            | `missing_bearer_token`, `invalid_token` |
| 403  | Authenticated but not authorized                         | `TENANT_ACCESS_DENIED`          |
| 404  | Resource not found                                       | `NOT_FOUND`                     |
| 409  | Conflict (duplicate resource)                            | `DUPLICATE_SLUG`                |
| 429  | Rate limit exceeded                                      | `Too Many Requests`             |
| 500  | Unexpected server error                                  | `INTERNAL_ERROR`                |
| 503  | Service unavailable (dependency down)                    | `TENANT_CHECK_UNAVAILABLE`      |

## Route-Level Error Handling

Routes handle errors with try/catch blocks and return structured responses:

```typescript
app.post("/", async (req, reply) => {
  const tenantId = (req as any).tenantId;
  if (!tenantId) {
    return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });
  }

  try {
    const result = await prisma.job.create({
      data: { tenantId, jobType: "EMAIL_SEND", input: req.body },
    });
    return reply.code(201).send({ ok: true, data: result });
  } catch (err: any) {
    req.log.error({ err }, "Job creation failed");
    return reply.code(500).send({ ok: false, error: "JOB_CREATE_FAILED" });
  }
});
```

## Audit Plugin Error Logging

The `auditPlugin` (at `backend/src/plugins/auditPlugin.ts`) logs all responses to the audit trail, including errors. The audit level is derived from the HTTP status code:

```typescript
const level =
  reply.statusCode >= 500 ? "error" :
  reply.statusCode >= 400 ? "warn" :
  "info";
```

This means every 4xx and 5xx response automatically generates a warn/error audit log entry.

### Non-Fatal Audit Writes

The audit plugin itself never fails a request. If the audit database write fails, it logs the error and continues:

```typescript
try {
  await prisma.auditLog.create({ data: { ... } });
} catch (err) {
  // Never fail the request because audit logging failed.
  app.log.error({ err }, "AUDIT DB WRITE FAILED (non-fatal)");
}
```

If the `AuditLevel` enum is missing from the database (e.g., during migration), the plugin disables itself and logs a one-time warning:

```typescript
if (shouldDisableAudit(err)) {
  auditDisabled = true;
  app.log.warn("Audit logging disabled because AuditLevel enum/type is missing.");
}
```

## Plugin Error Responses

### authPlugin

| Scenario           | Status | Response                                         |
|--------------------|--------|--------------------------------------------------|
| No Bearer token    | 401    | `{ ok: false, error: "missing_bearer_token" }`   |
| Invalid/expired    | 401    | `{ ok: false, error: "invalid_token" }`          |

### tenantPlugin

| Scenario              | Status | Response                                              |
|-----------------------|--------|-------------------------------------------------------|
| User not in tenant    | 403    | `{ ok: false, error: "TENANT_ACCESS_DENIED" }`       |
| DB check failed       | 503    | `{ ok: false, error: "TENANT_CHECK_UNAVAILABLE" }`   |

## Worker Error Handling

Workers (emailSender, engineLoop, scheduler) handle errors differently since they run as background processes.

### Retry with Exponential Backoff

Failed jobs are retried with exponential backoff:

```typescript
async function handleJobFailure(jobId, tenantId, retryCount, maxRetries, errMsg, jobType) {
  if (retryCount < maxRetries) {
    const delayMs = 10_000 * Math.pow(2, retryCount);  // 10s, 20s, 40s, 80s
    const nextRetryAt = new Date(Date.now() + delayMs);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "queued",
        retryCount: retryCount + 1,
        nextRetryAt,
        error: { message: errMsg, attemptedAt: new Date().toISOString() },
      },
    });
  } else {
    // Exhausted all retries — mark as permanently failed
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "failed", finishedAt: new Date(), error: { message: errMsg, exhausted: true } },
    });

    // Log exhaustion to audit trail
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        level: "error",
        action: "JOB_EXHAUSTED_RETRIES",
        message: `${jobType} job ${jobId} exhausted ${maxRetries} retries`,
      },
    }).catch(() => null);
  }
}
```

### Engine Loop Error Recovery

The engine loop catches tick errors and sleeps before retrying:

```typescript
try {
  for (let i = 0; i < maxTicksPerCycle; i++) {
    const out = await engineTick();
    if (!out?.ran) break;
  }
} catch (e: any) {
  process.stderr.write(`[engineLoop] tick error: ${e?.message ?? e}\n`);
  await sleep(offlineMs);  // Back off before retrying
  continue;
}
```

### Fatal Worker Errors

If a worker's `main()` function throws an unhandled error, the process exits with code 1:

```typescript
main().catch((e) => {
  process.stderr.write(`[emailSender] fatal: ${e?.message ?? e}\n`);
  process.exit(1);
});
```

Render will automatically restart the worker process after a crash.

## Graceful Degradation

Several systems degrade gracefully rather than failing hard:

| System              | Degradation Behavior                                            |
|---------------------|-----------------------------------------------------------------|
| Audit logging       | Disables itself if DB enum is missing; requests still succeed   |
| User auto-provision | Silently catches errors; auth still works during migrations     |
| Usage metering      | Fire-and-forget; never blocks the request                       |
| Engine online check | Falls back to offline sleep if system_state read fails          |

## Logging

Fastify's built-in Pino logger is used throughout:

```typescript
const app = Fastify({ logger: true });

// In route handlers
req.log.error({ err }, "Description of what failed");
req.log.warn({ jobId }, "Job retry scheduled");
req.log.info({ result }, "Operation succeeded");

// In workers (no request context)
console.error(`[emailSender] Job ${jobId} failed: ${errMsg}`);
process.stderr.write(`[engineLoop] tick error: ${e?.message}\n`);
```

## Best Practices

1. **Always return structured errors** -- use `{ ok: false, error: "CODE" }`, never raw strings.
2. **Log before returning errors** -- use `req.log.error()` so the error appears in server logs.
3. **Never expose stack traces** -- keep error messages user-safe; log details server-side.
4. **Audit trail is mandatory** -- the plugin handles this automatically, but manual audit entries should be written for critical operations.
5. **Workers must handle their own errors** -- they run outside the Fastify request lifecycle.
6. **Use fire-and-forget for non-critical writes** -- `.catch(() => null)` for audit logs in workers.
