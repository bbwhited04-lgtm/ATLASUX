# Security Architecture

Atlas UX implements defense-in-depth security across every layer of the stack.
Multi-tenant isolation, JWT authentication, mandatory audit trails, approval
workflows, and rate limiting work together to protect data and constrain
autonomous agent behavior.

---

## Security Layers

```
+----------------------------------------------------------+
|                    Internet / Client                      |
+----------------------------------------------------------+
         |                                    |
    +----v---------+                   +------v------+
    | Access Gate   |                   | CSP Headers |
    | (GATE_CODE)   |                   | CORS Policy |
    +----+---------+                   +------+------+
         |                                    |
    +----v---------+                          |
    | JWT Auth     |<-------------------------+
    | (authPlugin) |
    +----+---------+
         |
    +----v-----------+
    | Tenant Isolation|
    | (tenantPlugin)  |
    +----+------------+
         |
    +----v-----------+
    | Rate Limiting  |
    | (per-route)    |
    +----+------------+
         |
    +----v-----------+
    | Business Logic |
    | + Validation   |
    +----+------------+
         |
    +----v-----------+
    | Audit Trail    |
    | (auditPlugin)  |
    +----+------------+
         |
    +----v-----------+
    | Database       |
    | (tenant_id FK) |
    +----------------+
```

## Authentication

### JWT-Based Auth

The `authPlugin` validates JSON Web Tokens on every authenticated request:

1. Client sends `Authorization: Bearer <jwt>` header
2. Plugin verifies token signature and expiration
3. Decoded payload (user ID, email, roles) is attached to the request
4. If verification fails, the request is rejected with 401 Unauthorized

### OAuth2 Integrations

For third-party service connections, the platform supports OAuth2 flows:

| Provider | Status                                     |
|----------|--------------------------------------------|
| Google   | Pending OAuth verification (needs video demo) |
| Meta     | Pending permission approval                |
| X        | Configured, client ID and secret set       |
| Apple    | Dev app submitted, waiting for permission  |
| TikTok   | Pending verification                      |

OAuth tokens are stored per-integration in the database, scoped to the tenant.

### Access Gate

The frontend enforces a pre-auth gate using `VITE_APP_GATE_CODE`. This is a
simple Alpha-phase access control mechanism — users must enter the correct code
before the application loads. It is not a substitute for JWT authentication.

## Multi-Tenant Isolation

Multi-tenancy is the most critical security boundary in the system.

### Database Level

Every table in the Prisma schema includes a `tenant_id` foreign key. This is
enforced at the schema level — there are no tables without tenant scoping
(except system-level tables like migrations).

```
+------------------+     +------------------+     +------------------+
|   agents         |     |   jobs           |     |   audit_log      |
|------------------|     |------------------|     |------------------|
| id               |     | id               |     | id               |
| tenant_id (FK)   |     | tenant_id (FK)   |     | tenant_id (FK)   |
| name             |     | type             |     | action           |
| role             |     | status           |     | message          |
| ...              |     | ...              |     | ...              |
+------------------+     +------------------+     +------------------+
```

### Request Level

The `tenantPlugin` extracts the tenant ID from every request:

1. Check `x-tenant-id` request header (primary source)
2. Fall back to `tenantId` query parameter
3. All subsequent Prisma queries use this tenant ID as a WHERE clause

A request without a valid tenant ID is rejected before reaching any route handler.

### File Storage Level

Supabase storage paths are tenant-scoped:

```
kb_uploads/
  tenants/
    {tenantId-A}/
      document1.pdf
      document2.txt
    {tenantId-B}/
      document3.pdf
```

## Audit Trail

All mutations are logged to the `audit_log` table via the `auditPlugin`. This is
a hard requirement — no write operation should bypass the audit trail.

Audit log fields:

| Field              | Description                                      |
|--------------------|--------------------------------------------------|
| `tenantId`         | Tenant scope                                     |
| `actorType`        | `user`, `agent`, or `system`                     |
| `actorUserId`      | User who performed the action                    |
| `actorExternalId`  | External system identifier (for agents/webhooks) |
| `level`            | `info`, `warn`, `error`                          |
| `action`           | Action identifier (e.g., `CREATE_AGENT`)         |
| `entityType`       | Type of entity affected                          |
| `entityId`         | ID of entity affected                            |
| `message`          | Human-readable description                       |
| `meta`             | JSON blob with additional context                |
| `timestamp`        | When the action occurred                         |

The audit write uses `.catch(() => null)` to ensure failures never block the
primary operation.

## Approval Workflows

High-risk actions require explicit approval before execution:

### Triggers for Approval

| Condition                                    | Threshold                        |
|----------------------------------------------|----------------------------------|
| Spend amount exceeds limit                   | `AUTO_SPEND_LIMIT_USD`           |
| Risk tier >= 2                               | Assessed per action              |
| Recurring purchase                           | Always blocked by default        |
| Confidence below threshold                   | `CONFIDENCE_AUTO_THRESHOLD`      |

### Approval Flow

```
Agent proposes action
        |
        v
Risk assessment engine
        |
   +----+----+
   |         |
  Low       High
  Risk      Risk
   |         |
   v         v
Auto-     Create decision_memo
execute   (status: PENDING)
   |         |
   v         v
Done     Human review
            |
      +-----+-----+
      |           |
   Approve     Reject
      |           |
      v           v
   Execute    Block + log
```

## Rate Limiting

Rate limits are applied per-route using Fastify's built-in rate limiter:

```typescript
{
  config: {
    rateLimit: {
      max: 30,
      timeWindow: "1 minute"
    }
  }
}
```

Different routes have different limits based on their sensitivity and expected
usage patterns. Write operations typically have stricter limits than reads.

## Agent Safety Guardrails

Autonomous agents are constrained by multiple safety mechanisms:

| Guardrail                | Implementation                                 |
|--------------------------|-------------------------------------------------|
| Daily action cap         | `MAX_ACTIONS_PER_DAY` per agent                 |
| Daily posting cap        | Limits social media posts per day               |
| Spend limit              | `AUTO_SPEND_LIMIT_USD` triggers approval        |
| Recurring charge block   | Recurring purchases blocked by default          |
| Confidence threshold     | `CONFIDENCE_AUTO_THRESHOLD` for auto-execution  |
| SGL policies             | Declarative governance rules in `policies/SGL.md` |
| Audit logging            | Every agent action is logged                    |
| Escalation chain         | Agents escalate to supervisors when uncertain   |

## HMAC Webhook Verification

Incoming webhooks from external services are verified using HMAC signatures:

1. Webhook arrives with a signature header
2. Backend computes HMAC using the shared secret and request body
3. Computed signature is compared against the provided signature
4. Mismatches result in 403 Forbidden

This prevents webhook spoofing and ensures data integrity.

## Pending Security Work

Three items were deferred from the security phases and require database
migrations:

| Item | Description                                               |
|------|-----------------------------------------------------------|
| N    | Add FK from DecisionMemo to source intent/job             |
| P    | Add `tenant_id` to publish_events, atlas_ip_*, atlas_suggestions |
| T    | Implement per-user identity (user_id distinct from org_id) |

## Security Checklist for New Features

When adding new features, verify:

1. All new database tables include `tenant_id` FK
2. All new routes use authPlugin and tenantPlugin
3. All mutations log to audit_log
4. Rate limiting is applied to new routes
5. High-risk operations create decision memos
6. No sensitive data in client-side code or logs
7. External webhooks are HMAC-verified

## Related Documentation

- [Architecture Overview](./README.md)
- [Audit System Architecture](./audit-system.md)
- [Database Architecture](./database.md)
- [Agent Architecture](./agents.md)
