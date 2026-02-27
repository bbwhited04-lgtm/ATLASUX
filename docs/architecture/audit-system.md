# Audit System Architecture

The audit system is a mandatory component of Atlas UX that logs every mutation
across the platform. It provides a complete, immutable record of all actions
taken by users, agents, and system processes. The audit trail is a hard
requirement for Alpha compliance.

---

## Design Principles

1. **Every mutation is logged** — No write operation should bypass the audit trail
2. **Never block the primary operation** — Audit writes use `.catch(() => null)`
3. **Tenant-scoped** — Audit entries are isolated by tenant_id
4. **Structured metadata** — JSON `meta` field captures operation-specific context
5. **Real-time observable** — The Agent Watcher UI polls every 4 seconds

## Audit Flow

```
Client Request (POST/PUT/PATCH/DELETE)
         |
         v
    authPlugin (verify JWT)
         |
         v
    tenantPlugin (extract tenant_id)
         |
         v
    Route Handler (business logic)
         |
    +----+----+
    |         |
    v         v
 Success    Failure
    |         |
    v         v
 auditPlugin captures response
         |
         v
 prisma.auditLog.create({
   data: { tenantId, actorType, action, ... }
 }).catch(() => null)
         |
         v
 Response returned to client
 (audit write is fire-and-forget)
```

## AuditLog Model

```
+-----------------------------------------------------------+
|                       audit_log                            |
+-----------------------------------------------------------+
| Field            | Type      | Description                |
|------------------|-----------|----------------------------|
| id               | UUID (PK) | Unique log entry ID        |
| tenantId         | UUID (FK) | Tenant scope               |
| actorType        | TEXT      | user, agent, system        |
| actorUserId      | TEXT      | User ID (for user actions) |
| actorExternalId  | TEXT      | External ID (agents, hooks)|
| level            | TEXT      | info, warn, error          |
| action           | TEXT      | Action identifier          |
| entityType       | TEXT      | Type of entity affected    |
| entityId         | TEXT      | ID of entity affected      |
| message          | TEXT      | Human-readable description |
| meta             | JSONB     | Additional structured data |
| timestamp        | TIMESTAMP | When the action occurred   |
+-----------------------------------------------------------+
```

### Field Details

**actorType** distinguishes who performed the action:

| Value    | Meaning                                             |
|----------|-----------------------------------------------------|
| `user`   | A human user interacting through the frontend       |
| `agent`  | An AI agent executing autonomously                  |
| `system` | An automated process (scheduler, engine, webhook)   |

**level** indicates the severity of the log entry:

| Value   | Usage                                                  |
|---------|--------------------------------------------------------|
| `info`  | Normal operations (create, update, read)               |
| `warn`  | Unusual but non-critical events (rate limit hit, retry)|
| `error` | Failed operations (API errors, validation failures)    |

**action** is a structured identifier following the pattern `VERB_NOUN`:

```
CREATE_AGENT
UPDATE_WORKFLOW
DELETE_JOB
SEND_EMAIL
EXECUTE_WORKFLOW
APPROVE_DECISION
REJECT_DECISION
PUBLISH_CONTENT
LOGIN_USER
ESCALATE_TASK
```

**meta** is a JSONB field that stores operation-specific context:

```json
{
  "jobId": "abc-123",
  "workflowId": "WF-054",
  "platform": "x",
  "duration_ms": 1250,
  "aiProvider": "openai",
  "tokensUsed": 450,
  "riskTier": 1
}
```

## auditPlugin Implementation

The Fastify `auditPlugin` hooks into the response lifecycle for write methods:

```
Fastify onResponse hook
  |
  |  Only triggers for: POST, PUT, PATCH, DELETE
  |
  v
Extract context:
  - tenantId from request (tenantPlugin)
  - actorType + actorUserId from JWT (authPlugin)
  - action from route metadata or inferred from method + path
  - entityType + entityId from response body or route params
  |
  v
prisma.auditLog.create({
  data: {
    tenantId,
    actorType,
    actorUserId,
    actorExternalId,
    level,
    action,
    entityType,
    entityId,
    message,
    meta,
    timestamp: new Date()
  }
} as any).catch(() => null)
```

The `as any` cast handles Prisma's strict typing when some fields may be
undefined. The `.catch(() => null)` ensures audit failures never propagate.

## Manual Audit Logging

In addition to the automatic plugin, code can write audit entries directly:

```typescript
await prisma.auditLog.create({
  data: {
    tenantId,
    actorType: "agent",
    actorExternalId: "atlas",
    level: "info",
    action: "EXECUTE_WORKFLOW",
    entityType: "workflow",
    entityId: "WF-106",
    message: "Atlas completed daily aggregation workflow",
    meta: {
      duration_ms: 4500,
      tasksAssigned: 12
    },
    timestamp: new Date()
  }
} as any).catch(() => null);
```

This is commonly used in workers and agent tools where the Fastify request
context is not available.

## Agent Watcher (Real-Time Monitor)

The Agent Watcher (`src/components/AgentWatcher.tsx`) provides a live view of
the audit log:

```
+------------------------------------------------------------------+
|  Agent Watcher - Live Activity Monitor         [/app/watcher]    |
+------------------------------------------------------------------+
|                                                                  |
|  [4s polling interval]                                           |
|                                                                  |
|  12:05:03  AGENT  atlas    EXECUTE_WORKFLOW  WF-106    info     |
|  12:05:01  AGENT  binky    SEND_EMAIL        msg-789   info     |
|  12:04:58  SYSTEM scheduler ENQUEUE_JOB      job-456   info     |
|  12:04:55  AGENT  kelly    PUBLISH_CONTENT   post-123  info     |
|  12:04:52  USER   admin    UPDATE_AGENT      agent-42  info     |
|  12:04:48  AGENT  tina     APPROVE_DECISION  dec-789   info     |
|  ...                                                             |
|                                                                  |
+------------------------------------------------------------------+
```

Features:

- Polls the audit log API every 4 seconds
- Displays entries in reverse chronological order
- Color-coded by level (info=normal, warn=yellow, error=red)
- Filterable by actorType, action, and entityType
- Clickable entries to view full meta payload

## Querying the Audit Log

### API Endpoint

```
GET /v1/audit?tenantId={tid}&limit=50&offset=0
GET /v1/audit?tenantId={tid}&action=EXECUTE_WORKFLOW
GET /v1/audit?tenantId={tid}&actorType=agent&level=error
```

### Common Queries

**All agent actions today:**
```sql
SELECT * FROM audit_log
WHERE tenant_id = '{tid}'
  AND actor_type = 'agent'
  AND timestamp >= CURRENT_DATE
ORDER BY timestamp DESC;
```

**Failed operations:**
```sql
SELECT * FROM audit_log
WHERE tenant_id = '{tid}'
  AND level = 'error'
ORDER BY timestamp DESC
LIMIT 50;
```

**Workflow execution history:**
```sql
SELECT * FROM audit_log
WHERE tenant_id = '{tid}'
  AND action = 'EXECUTE_WORKFLOW'
ORDER BY timestamp DESC;
```

## Audit Log Retention

Currently, all audit log entries are retained indefinitely. For production
readiness, a retention policy should be implemented:

- **Hot storage** (PostgreSQL): Last 90 days
- **Cold storage** (archive): Beyond 90 days
- **Compliance hold**: Entries related to financial decisions retained for 7 years

This is not yet implemented and is a future consideration.

## Integration with Other Systems

The audit log integrates with several other subsystems:

```
+-------------------+
|    Audit Log      |
+-------------------+
        ^
        |
   +----+----+----+----+----+
   |    |    |    |    |    |
   v    v    v    v    v    v
 Auth  Jobs Agents Wkfl Decn Files
 Login Queue Exec  Fire Appr CRUD
```

- **Authentication** — Login/logout events
- **Job system** — Job creation, execution, completion, failure
- **Agent execution** — Every tool call and reasoning step
- **Workflow system** — Workflow triggers and completions
- **Decision memos** — Approval/rejection of high-risk actions
- **File operations** — Upload, download, delete events

## Security Considerations

- Audit log entries are append-only in practice (no update/delete API)
- The `meta` field should never contain sensitive data (passwords, tokens, PII)
- Audit queries are tenant-scoped — cross-tenant reads are impossible
- The `.catch(() => null)` pattern means audit failures are silent; monitoring
  should detect gaps in expected audit entries

## Related Documentation

- [Architecture Overview](./README.md)
- [Security Architecture](./security.md)
- [Backend Architecture](./backend.md)
- [Agent Architecture](./agents.md)
- [Job System Architecture](./job-system.md)
