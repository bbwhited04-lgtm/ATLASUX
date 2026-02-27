# API Design Best Practices

## Overview

API design is the practice of defining contracts between software systems. A well-designed API is predictable, consistent, self-documenting, and resilient to change. Atlas UX exposes a REST API under `/v1` via Fastify 5. This document covers API design principles and shows how Atlas UX implements each one.

---

## RESTful Principles

REST is an architectural style with five constraints: client-server separation, statelessness, cacheability, uniform interface, and layered system. Atlas UX enforces statelessness via JWT Bearer tokens and multi-tenant headers — every request is self-contained.

### Resources and HTTP Methods

| Method | Semantics | Idempotent | Safe | Example |
|---|---|---|---|---|
| `GET` | Read | Yes | Yes | `GET /v1/agents` |
| `POST` | Create | No | No | `POST /v1/jobs` |
| `PUT` | Full replace | Yes | No | `PUT /v1/agents/:id` |
| `PATCH` | Partial update | Yes* | No | `PATCH /v1/agents/:id` |
| `DELETE` | Remove | Yes | No | `DELETE /v1/files/:id` |

### Status Codes

| Code | Meaning | Atlas UX Usage |
|---|---|---|
| `200` | OK | Successful GET, PATCH, DELETE |
| `201` | Created | Successful POST that creates a resource |
| `400` | Bad Request | Validation failure, malformed JSON |
| `401` | Unauthorized | Missing or invalid JWT |
| `403` | Forbidden | Valid JWT but insufficient permissions |
| `404` | Not Found | Resource does not exist for this tenant |
| `409` | Conflict | Duplicate creation, optimistic lock failure |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unhandled exception |

---

## URL Design

Structure: `/{version}/{resource}/{id}/{sub-resource}`

```
GET    /v1/agents                    → List all agents
GET    /v1/agents/:id                → Get one agent
POST   /v1/agents/:id/run            → Trigger agent execution
GET    /v1/kb/documents/:id/chunks   → List chunks for a document
POST   /v1/files                     → Upload a file
GET    /v1/files/:id/url             → Get signed download URL
```

Rules: plural nouns, lowercase with hyphens, no verbs in URLs, nest only one level deep, query parameters for filtering (`/v1/jobs?status=running&agentId=binky`).

---

## Request/Response Envelope

### Success

```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 142, "hasMore": true }
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Field 'email' is required",
    "details": [{ "field": "email", "constraint": "required" }]
  }
}
```

The `error` object always includes `code` (machine-readable) and `message` (human-readable). Atlas UX uses Fastify's `reply.code(status).send({ error: ... })` pattern.

---

## Pagination

**Offset/Limit**: `GET /v1/kb/documents?offset=40&limit=20`. Simple, supports arbitrary page jumps, but degrades at high offsets and is inconsistent during concurrent mutations. Atlas UX uses this for KB chunks (default 100, max 500).

**Cursor-Based**: `GET /v1/jobs?cursor=eyJpZCI6NDJ9&limit=20`. Consistent results, constant-time performance, but no random page access. Best for high-throughput, frequently-mutating collections.

**Keyset**: `GET /v1/audit-log?after_id=abc123&limit=50`. A simplified cursor using a known field value (ID or timestamp). Atlas UX's Agent Watcher uses timestamp-based keyset pagination to poll only new audit entries.

---

## Filtering and Sorting

Filtering via query parameters: `GET /v1/jobs?status=running,queued&createdAfter=2026-02-01`. Use field names as parameter names, commas for multiple values, `After`/`Before` suffixes for date ranges.

Sorting: `GET /v1/kb/documents?sort=-createdAt,title`. Prefix `-` for descending. Default sort should be deterministic (include ID as tiebreaker).

---

## Rate Limiting

**Token Bucket**: Holds N tokens, each request consumes one, tokens refill at a fixed rate. Allows short bursts.
**Sliding Window**: Counts requests in a rolling window. More predictable, no burst allowance.

Atlas UX uses Fastify's `@fastify/rate-limit` with per-route config:

```typescript
{ config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }
```

**Scoping**: Per-user (JWT subject), per-tenant (`x-tenant-id`), per-route (lower limits on writes). Rate-limited responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` headers.

---

## Idempotency

For non-idempotent operations (POST), use an `Idempotency-Key` header. The server caches the response for a given key and returns it on duplicate requests. Atlas UX's job queue provides natural idempotency via optimistic locking — `updateMany` with `status: 'queued'` WHERE clause means claiming an already-claimed job is a no-op.

---

## Versioning

**URL Path** (Atlas UX): `/v1/agents`. Explicit, cacheable, works with Fastify's prefix registration.
**Header**: `Accept: application/vnd.atlasux.v2+json`. Clean URLs but less discoverable.
**Query Parameter**: `/agents?version=2`. Simple but pollutes query params.

Atlas UX uses URL path versioning with additive-only changes within a version. The `integration.provider` field was changed from enum to TEXT (migration `20260225120000`) to avoid breaking changes when adding providers.

---

## Authentication Patterns

**Bearer JWT** (primary): `Authorization: Bearer eyJ...`. The `authPlugin` validates on every request. Combined with `x-tenant-id`, this provides both authentication and authorization.

**API Keys**: For server-to-server integrations. Long-lived, tenant-scoped, transmitted via `X-API-Key` header.

**OAuth 2.0**: For third-party integrations. See the Systems Integration document for flow details.

---

## Error Design

Errors should help developers fix problems without reading source code:

```json
{
  "error": {
    "code": "TENANT_QUOTA_EXCEEDED",
    "message": "File upload failed: tenant has reached the 500 MB storage limit",
    "details": { "currentUsageMb": 498.7, "limitMb": 500, "requestedMb": 12.3 },
    "requestId": "req_abc123"
  }
}
```

Error code taxonomy: `VALIDATION_*` (400), `AUTH_*` (401/403), `NOT_FOUND` (404), `CONFLICT_*` (409), `RATE_LIMIT_*` (429), `PROVIDER_*` (502/503), `INTERNAL_*` (500).

---

## OpenAPI / Swagger

An OpenAPI spec is the machine-readable API contract enabling auto-generated SDKs, interactive docs (Swagger UI), request validation, and contract testing. Atlas UX can generate specs from Fastify's route schema definitions via `@fastify/swagger`.

---

## Backward Compatibility

Rules: adding fields and optional parameters is safe. Removing fields, changing types, or making optional params required is breaking. Adding new endpoints is safe. Changing URL structure is breaking — hence path versioning. Atlas UX follows additive-only changes within `/v1`.

---

## How Atlas UX `/v1` Follows These Principles

| Principle | Implementation |
|---|---|
| Resource-oriented URLs | `/v1/agents`, `/v1/jobs`, `/v1/kb/documents`, `/v1/files` |
| Correct HTTP methods | GET for reads, POST for creates, PATCH for updates, DELETE for removes |
| Meaningful status codes | 201 on creation, 404 on missing resources, 429 on rate limit |
| JWT authentication | `authPlugin` on all routes, token in Authorization header |
| Multi-tenant scoping | `tenantPlugin` extracts `x-tenant-id`, queries filter by `tenant_id` |
| Audit trail | `auditPlugin` logs all mutations with full context |
| Rate limiting | Per-route config via `@fastify/rate-limit` |
| Pagination | Offset/limit on collections, cursor-based on high-volume endpoints |
| Error envelope | Consistent `{ error: { code, message, details } }` structure |
| Versioning | URL path (`/v1`) with additive-only changes |

---

## References

- `backend/src/routes/` — 30+ route files implementing these patterns
- `backend/src/plugins/authPlugin.ts` — JWT authentication
- `backend/src/plugins/tenantPlugin.ts` — Multi-tenant request scoping
- `backend/src/plugins/auditPlugin.ts` — Mutation audit logging
- `backend/src/env.ts` — Environment variable validation
