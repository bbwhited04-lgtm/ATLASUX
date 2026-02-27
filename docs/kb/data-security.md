# Data Security

## Overview

Atlas UX handles sensitive business data across multiple organizations, making security a foundational concern — not an afterthought. The platform implements defense-in-depth security, meaning multiple independent layers of protection ensure that a failure at any single layer does not compromise data.

## Encryption

### In Transit
All data transmitted between clients and the Atlas UX backend is encrypted using TLS 1.2+:
- API requests from the frontend to the backend are HTTPS-only
- Webhook callbacks require HTTPS endpoints
- Database connections use SSL
- External API calls (Microsoft Graph, Telegram, social platforms) use HTTPS

### At Rest
Data stored in the database and file storage is encrypted at rest:
- Supabase PostgreSQL uses AES-256 encryption for data at rest
- File storage (Supabase Storage) encrypts objects at rest
- Backup files are encrypted

## Tenant Isolation

Tenant isolation is the most critical security boundary in Atlas UX. Every data record is scoped to a tenant:

- **Database**: Every table includes a `tenant_id` foreign key. All queries filter by tenant.
- **API**: The `tenantPlugin` validates `x-tenant-id` on every request before any data access.
- **Storage**: Files are stored in tenant-prefixed paths (`tenants/{tenantId}/`).
- **Agents**: Agent configurations, actions, and data are all tenant-scoped.

Cross-tenant data access is architecturally impossible through the standard application layer. There are no "all tenants" queries, no shared data tables, and no cross-tenant agent communication.

## Authentication

### JWT Tokens

Atlas UX uses JSON Web Tokens (JWT) for authentication:
- Tokens are issued upon successful login
- Tokens include user identity and tenant associations
- Token expiration is enforced — expired tokens are rejected
- Token refresh follows secure rotation practices

**Security properties of the JWT implementation:**
- Tokens are signed with a secret key known only to the backend
- Token payloads do not contain sensitive data (no passwords, no API keys)
- The `authPlugin` validates every token before allowing request processing

### OAuth Integration

External authentication uses OAuth 2.0 flows:
- Google, Meta, X/Twitter, and other providers use standard OAuth 2.0
- OAuth tokens are stored securely in the database, scoped to the tenant
- Token refresh is handled automatically
- Provider-specific verification requirements are in progress (Google requires video demo, Meta and Apple pending approval)

## Webhook Verification

Incoming webhooks from external services are verified to prevent spoofing:
- Signature verification using provider-supplied secrets
- Timestamp validation to prevent replay attacks
- Source IP validation where supported by the provider
- Failed verification results in request rejection and audit logging

## Secret Management

### No Secrets in Client Code

A hard rule: no secrets, API keys, tokens, or credentials are ever included in frontend code. The frontend is a public artifact — anything in it is visible to anyone.

**What goes in the frontend `.env`:**
- `VITE_APP_GATE_CODE` — Access gate (not a security secret)
- `VITE_API_BASE_URL` — Backend URL (public knowledge)

**What stays in the backend `.env` only:**
- Database URLs and credentials
- AI provider API keys (OpenAI, DeepSeek, etc.)
- OAuth client secrets
- Microsoft Graph credentials
- Telegram bot token
- Supabase service role key
- Engine configuration

### Environment Variable Handling

- Backend environment variables are managed through Render's environment configuration
- Variables are injected at runtime, never committed to source control
- When pushing environment variables to Render, all 4 services (web, email-worker, engine-worker, scheduler) must be updated simultaneously with deduplicated keys

## API Security

### Rate Limiting

All API endpoints are rate-limited to prevent abuse:
- Rate limits are configured per-route using Fastify's rate limiting
- Default configuration: `{ max: N, timeWindow: "1 minute" }`
- Exceeded rate limits return 429 responses
- Rate limit state is tracked per-client

### Input Validation

- All API inputs are validated against defined schemas
- SQL injection is prevented by Prisma's parameterized queries
- XSS is mitigated by proper output encoding
- Request body size limits prevent payload-based attacks

### CORS

Cross-Origin Resource Sharing is configured to allow only authorized origins. The backend does not accept requests from arbitrary domains.

## Audit Trail Security

The audit log itself is a security feature:
- Every mutation is recorded with actor identity, action, and context
- Audit entries are append-only — they cannot be modified or deleted through the application
- The audit log enables forensic analysis if a security incident occurs
- Elevated severity entries trigger alerts

## Agent Security

AI agents operate within security boundaries:
- Agents can only access data within their tenant
- Tool usage is permission-controlled — agents cannot use tools outside their role
- Financial actions are subject to spend limits and approval workflows
- Agent actions are fully auditable

## Security Phases Completed

Atlas UX has completed three phases of security hardening:
- **Phase 1**: Core authentication and authorization
- **Phase 2**: Tenant isolation and audit trail
- **Phase 3**: Rate limiting, input validation, and webhook verification

### Deferred (Requires Database Migration)
- Decision Memo foreign key to source intent/job
- Adding `tenant_id` to remaining tables (`publish_events`, `atlas_ip_*`, `atlas_suggestions`)
- Per-user identity separation (user_id distinct from org_id)

## Key Takeaways

1. Security is enforced at every layer — transport, storage, application, and agent.
2. Tenant isolation is absolute and architecturally enforced.
3. No secrets exist in client-side code — ever.
4. Every action is auditable through the immutable audit log.
5. Three security phases are complete, with remaining items queued for database migration.
