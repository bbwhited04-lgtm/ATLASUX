# Atlas UX API Reference

API documentation for the Atlas UX backend. All endpoints are served from a Fastify 5 server over HTTPS.

## Base URL

```
https://atlas-ux.onrender.com/v1
```

Local development:

```
http://localhost:8787/v1
```

## Authentication

All authenticated endpoints require a JWT token issued by Supabase Auth, sent via the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

## Tenant Context

Most endpoints require a tenant (organization) context. Send the tenant UUID in a custom header:

```
x-tenant-id: <TENANT_UUID>
```

The backend `tenantPlugin` extracts this header and attaches `tenantId` and `tenantRole` to every request.

## Rate Limits

A global rate limit of **100 requests per minute** per IP is enforced across all endpoints. Individual routes may impose stricter limits, documented per-endpoint.

| Scope | Limit |
|-------|-------|
| Global default | 100 req/min |
| Job creation (`POST /v1/jobs`) | 30 req/min |
| File upload (`POST /v1/files/upload`) | 20 req/min |
| Stripe product request | 10 req/min |
| Stripe product create | 5 req/min |
| Decision approve | 10 req/min |

## Common Response Shape

All endpoints return JSON with an `ok` boolean:

```json
{ "ok": true, "data": "..." }
```

Error responses include an `error` key:

```json
{ "ok": false, "error": "error_code" }
```

## Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes (most routes) | Bearer JWT token |
| `x-tenant-id` | Yes (most routes) | Tenant UUID |
| `x-user-id` | Optional | User ID override |
| `x-inbound-secret` | Email inbound only | Shared secret for email pipeline |
| `Content-Type` | POST/PATCH/PUT | `application/json` (default) |

## CORS

Allowed origins:

- `https://www.atlasux.cloud`
- `https://atlasux.cloud`
- `http://localhost:5173`
- `http://localhost:3000`

## Endpoint Index

| Section | Prefix | Documentation |
|---------|--------|---------------|
| Health | `/v1/health`, `/v1/ready` | [health.md](health.md) |
| Agents | `/v1/agents` | [agents.md](agents.md) |
| Chat | `/v1/chat` | [chat.md](chat.md) |
| Jobs | `/v1/jobs` | [jobs.md](jobs.md) |
| Workflows | `/v1/workflows` | [workflows.md](workflows.md) |
| Audit | `/v1/audit` | [audit.md](audit.md) |
| Stripe | `/v1/stripe` | [stripe.md](stripe.md) |
| Teams | `/v1/teams` | [teams.md](teams.md) |
| Telegram | `/v1/telegram` | [telegram.md](telegram.md) |
| Email | `/v1/email` | [email.md](email.md) |
| CRM | `/v1/crm` | [crm.md](crm.md) |
| Knowledge Base | `/v1/kb` | [kb.md](kb.md) |
| Files | `/v1/files` | [files.md](files.md) |
| Decisions | `/v1/decisions` | [decisions.md](decisions.md) |
| Ledger | `/v1/ledger` | [ledger.md](ledger.md) |
| Metrics | `/v1/metrics` | [metrics.md](metrics.md) |
| OAuth | `/v1/oauth` | [oauth.md](oauth.md) |
| Tenants | `/v1/tenants` | [tenants.md](tenants.md) |
| User | `/v1/user` | [user.md](user.md) |
| Runtime | `/v1/runtime` | [health.md](health.md) |
