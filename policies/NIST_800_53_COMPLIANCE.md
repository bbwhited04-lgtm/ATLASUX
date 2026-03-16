# NIST 800-53 Rev 5 Compliance Framework

## 1. Framework Overview and Scope

### About NIST SP 800-53 Revision 5
NIST Special Publication 800-53 Revision 5 ("Security and Privacy Controls for Information Systems and Organizations") is the authoritative catalog of security and privacy controls published by the National Institute of Standards and Technology. It defines over 1,000 controls organized into 20 families, covering access control, audit and accountability, identification and authentication, system and communications protection, system and information integrity, configuration management, and more.

Atlas UX targets **Moderate baseline** controls as defined by NIST SP 800-53B. This document maps specific control requirements to the actual Atlas UX codebase, identifying which controls are implemented, partially implemented, or planned.

### Scope
This policy covers the Atlas UX platform as deployed:
- **Frontend:** React 18 SPA deployed on Vercel (HTTPS-only)
- **Backend:** Fastify 5 API server deployed on Render (HTTPS-only)
- **Database:** Supabase PostgreSQL 16 with Row-Level Security
- **File storage:** Supabase Storage (S3-compatible, encryption at rest)
- **Authentication provider:** Supabase Auth (JWT-based)
- **AI orchestration engine:** Autonomous agent loop with approval workflows

### Security Categorization
Per FIPS 199, Atlas UX is categorized as:
- **Confidentiality:** Moderate (multi-tenant business data, API keys, OAuth tokens)
- **Integrity:** Moderate (financial ledger, audit trail, agent decision records)
- **Availability:** Low (SaaS application, no life-safety dependency)
- **Overall:** Moderate impact

---

## 2. Control Family Mapping — Master Table

| Control ID | Control Name | Status | Implementation Summary | Primary File(s) |
|---|---|---|---|---|
| **AC-3** | Access Enforcement | Implemented | PostgreSQL RLS policies enforce tenant isolation at the database layer | `backend/prisma/migrations/20260228120000_rls_policies/migration.sql`, `backend/src/db/prisma.ts` |
| **AC-7** | Unsuccessful Logon Attempts | Partial | Global rate limiting (60 req/min) via `@fastify/rate-limit`; Supabase handles auth-level lockout | `backend/src/server.ts` (line 191) |
| **AC-12** | Session Termination | Planned | No explicit session revocation or token blacklist. Supabase JWT expiry is the only control | `backend/src/plugins/authPlugin.ts` |
| **AU-2** | Event Logging | Implemented | `auditPlugin` logs every HTTP request (method, URL, status, actor, IP, user agent) to `audit_log` table | `backend/src/plugins/auditPlugin.ts` |
| **AU-3** | Content of Audit Records | Implemented | Audit records include: actor ID, action, entity type/ID, status code, IP address, user agent, timestamp, request ID | `backend/src/plugins/auditPlugin.ts` |
| **AU-10** | Non-Repudiation | Planned | Hash-chained audit logs (SHA-256, per-tenant chain) designed but not yet implemented | Design: `docs/plans/2026-03-03-compliance-hardening-design.md` (Section 1) |
| **CM-6** | Configuration Settings | Implemented | `@fastify/helmet` enforces security headers: CSP, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection | `backend/src/server.ts` (lines 169-189) |
| **IA-2** | Identification and Authentication | Implemented | Supabase Auth with JWT bearer tokens; `authPlugin` validates every request via `supabase.auth.getUser()` | `backend/src/plugins/authPlugin.ts` |
| **IA-5** | Authenticator Management | Partial | Token validation via Supabase; auto-provisioning of User records on first auth; no explicit token rotation or revocation | `backend/src/plugins/authPlugin.ts` |
| **IA-11** | Re-Authentication | Planned | No re-authentication or session termination mechanism. Token blacklist designed but not implemented | Design: `docs/plans/2026-03-03-compliance-hardening-design.md` (Section 6) |
| **MP-5** | Media Protection (Transport) | Implemented | Supabase Storage provides encryption at rest (AES-256); HTTPS enforced for all data in transit | Supabase infrastructure; `backend/src/routes/filesRoutes.ts` |
| **SC-5** | Denial of Service Protection | Implemented | `@fastify/rate-limit` at 60 requests/minute globally; per-tenant rate limiting designed but not yet implemented | `backend/src/server.ts` (line 191) |
| **SC-8** | Transmission Confidentiality and Integrity | Partial | All traffic is HTTPS (TLS termination at Render/Vercel); explicit HSTS header not yet configured in Helmet | `backend/src/server.ts` (lines 169-189) |
| **SC-23** | Session Authenticity (CSRF) | Planned | `csrfPlugin.ts` exists with double-submit cookie pattern but is currently **disabled** in `server.ts` due to cross-origin limitations (Vercel to Render). DB-backed synchronizer token pattern designed | `backend/src/plugins/csrfPlugin.ts`, `backend/src/server.ts` (line 199) |
| **SI-10** | Information Input Validation | Partial | Zod schema validation used on approximately 10 route files; several routes still use `req.body as any` without validation | Multiple route files (see Section 3.6) |
| **SI-11** | Error Handling | Implemented | Audit plugin catches and logs all errors without exposing stack traces to clients; structured JSON error responses (`{ ok: false, error: string }`) | `backend/src/plugins/auditPlugin.ts`, route files |

---

## 3. Key Control Families — Detailed Implementation

### 3.1 AC — Access Control

#### AC-3: Access Enforcement
**Status:** Implemented
**NIST Requirement:** The system enforces approved authorizations for logical access to information and system resources.

**Implementation:**

1. **Database-Level Row-Level Security (RLS)**
   - PostgreSQL RLS enabled on 9 tenant-scoped tables via migration `20260228120000_rls_policies`
   - Tables protected: `integrations`, `assets`, `jobs`, `distribution_events`, `audit_log`, `kb_documents`, `decision_memos`, `crm_contacts`, `crm_companies`
   - Policy: `tenant_isolation USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid)`
   - When `app.tenant_id` is not set (superuser/migration context), all rows are visible; when set, only matching tenant rows are returned

2. **Application-Level Tenant Isolation**
   - `tenantPlugin.ts` extracts `tenant_id` from the `x-tenant-id` header or `tenantId` query parameter
   - UUID format validation prevents SQL injection via the RLS session variable: `UUID_RE = /^[0-9a-f]{8}-...$/i`
   - Authenticated users must be a member of the requested tenant (`tenantMember` lookup); non-members receive HTTP 403

3. **Transaction-Scoped RLS Helper**
   - `withTenant(tenantId, callback)` in `backend/src/db/prisma.ts` executes `SET LOCAL app.tenant_id = '...'` inside a Prisma `$transaction`, ensuring the RLS variable is scoped to that transaction and automatically cleared on commit/rollback

**Evidence files:**
- `backend/prisma/migrations/20260228120000_rls_policies/migration.sql` — RLS DDL
- `backend/src/db/prisma.ts` — `withTenant()` helper (lines 30-41)
- `backend/src/plugins/tenantPlugin.ts` — tenant resolution and membership check

**Gaps:**
- RLS is enabled but `FORCE ROW LEVEL SECURITY` is not yet applied, meaning superuser connections bypass policies. Phase 3 will add `FORCE` once all critical routes use `withTenant()`.
- Not all route handlers use `withTenant()` yet; some still rely only on application-level `WHERE tenant_id = ...` filtering.

---

#### AC-7: Unsuccessful Logon Attempts
**Status:** Partial
**NIST Requirement:** The system enforces a limit on consecutive invalid logon attempts and takes defined actions when the limit is exceeded.

**Implementation:**
- `@fastify/rate-limit` registered globally in `server.ts` with `{ max: 60, timeWindow: "1 minute" }` (line 191)
- This limits total requests (not just auth attempts) per IP address
- Supabase Auth handles authentication-level lockout natively (configurable in Supabase dashboard)

**Evidence files:**
- `backend/src/server.ts` — line 191: `await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });`

**Gaps:**
- Rate limiting is IP-based only, not per-tenant or per-user. A per-tenant rate limiter is designed (see compliance hardening design, Section 4) but not yet implemented.
- No explicit "account lockout after N failed attempts" logic at the application layer (delegated to Supabase).

---

#### AC-12: Session Termination
**Status:** Planned
**NIST Requirement:** The system automatically terminates a user session after defined conditions.

**Implementation:**
- Supabase JWT tokens have a configurable expiry (default: 1 hour) set in the Supabase dashboard
- No application-level session termination, logout endpoint, or token revocation mechanism exists today

**Designed remediation (from compliance hardening design, Section 6):**
- New `revoked_tokens` table (`id`, `token_hash`, `revoked_at`, `expires_at`)
- `POST /v1/auth/logout` endpoint: calls `supabase.auth.signOut()` and adds the token hash to `revoked_tokens`
- `authPlugin` will check `revoked_tokens` before accepting bearer tokens
- Daily prune of expired revocations

**Evidence files:**
- `backend/src/plugins/authPlugin.ts` — current auth flow (no revocation check)
- `docs/plans/2026-03-03-compliance-hardening-design.md` — Section 6

---

### 3.2 AU — Audit and Accountability

#### AU-2: Event Logging
**Status:** Implemented
**NIST Requirement:** The system generates audit records for defined events.

**Implementation:**
- `auditPlugin.ts` is registered as a global Fastify plugin via `fastify-plugin` (fp wrapper)
- Uses the `onSend` hook to log every HTTP request/response cycle to the `audit_log` table
- Logs include: HTTP method, URL, status code, actor user ID, IP address, user agent, request ID
- Never fails the request if audit logging fails (non-fatal catch) — but also never permanently disables logging. A schema error (e.g., missing `AuditLevel` enum) triggers a 10-second pause, then auto-retries
- Additionally, compliance-sensitive routes (DSAR, consent, breach, incidents, vendor assessments) write explicit audit log entries with structured metadata

**Evidence files:**
- `backend/src/plugins/auditPlugin.ts` — full plugin (89 lines)
- `backend/src/routes/complianceRoutes.ts` — explicit audit logging on every mutation (consent grant/withdraw, DSAR create/update, breach report/update, incident create/update, vendor assessment)

**Audit record schema (from Prisma):**
```
model AuditLog {
  id              UUID (auto-generated)
  tenantId        UUID (nullable, FK to Tenant)
  actorUserId     UUID (nullable, FK to app_users)
  actorExternalId String (nullable)
  actorType       String (default: "user")
  level           AuditLevel (info | warn | error)
  action          String
  entityType      String (nullable)
  entityId        UUID (nullable)
  message         String (nullable)
  meta            JSON (default: {})
  createdAt       DateTime (auto, with timezone)
  timestamp       DateTime (nullable, with timezone)
}
```

**Database indexes:**
- `audit_log_tenant_time_idx` — `(tenant_id, created_at DESC)` for efficient per-tenant queries
- `audit_log_entity_idx` — `(entity_type, entity_id)` for entity-level lookups
- Index on `action` — for filtering by action type
- Index on `created_at DESC` — for chronological ordering

---

#### AU-3: Content of Audit Records
**Status:** Implemented
**NIST Requirement:** Audit records contain sufficient information to establish what type of event occurred, when, where, the source, and the outcome.

**Implementation:**
Each audit record captures:
- **What:** `action` field (e.g., `POST /v1/compliance/dsar`, `CONSENT_GRANTED`, `BREACH_REPORTED`)
- **When:** `createdAt` (auto-generated server timestamp, UTC with timezone) and optional `timestamp` field
- **Who:** `actorUserId` (Supabase user UUID), `actorType` (user/system/agent), `actorExternalId`
- **Where:** `meta.ipAddress`, `meta.userAgent`, `meta.requestId`
- **Outcome:** `meta.statusCode` (HTTP status), `level` (info/warn/error)
- **Context:** `entityType`, `entityId`, `message`, `meta` (arbitrary JSON)

**Evidence files:**
- `backend/src/plugins/auditPlugin.ts` — lines 29-56 (record construction)

---

#### AU-10: Non-Repudiation
**Status:** Planned
**NIST Requirement:** The system protects against an individual falsely denying having performed a particular action.

**Designed implementation (from compliance hardening design, Section 1):**
- Migration: add `prev_hash TEXT` and `record_hash TEXT` columns to `audit_log`
- On each insert: `record_hash = SHA-256(prev_hash + tenantId + action + entityId + timestamp + actorUserId)`
- `prev_hash` = most recent `record_hash` for that tenant (per-tenant chains, no cross-tenant serialization)
- Cache latest hash per tenant in memory with DB fallback
- New verification endpoint: `GET /v1/compliance/audit/verify` — walks the chain, reports broken links
- New file: `backend/src/lib/auditChain.ts` for chain verification logic

**Current state:** No hash-chaining exists. Audit records are written but tamper detection is not possible without the hash chain.

**Evidence files:**
- `docs/plans/2026-03-03-compliance-hardening-design.md` — Section 1

---

### 3.3 IA — Identification and Authentication

#### IA-2: Identification and Authentication (Organizational Users)
**Status:** Implemented
**NIST Requirement:** The system uniquely identifies and authenticates organizational users.

**Implementation:**
- Authentication delegated to Supabase Auth, which supports email/password and OAuth providers (Google, Meta, X/Twitter)
- `authPlugin.ts` extracts the JWT bearer token from the `Authorization` header
- Token is validated via `supabase.auth.getUser(token)` — which verifies the JWT signature, expiry, and returns the user object
- On first successful auth, a `User` record is auto-provisioned via upsert (idempotent)
- The authenticated user's `userId` and `email` are attached to `req.auth` for downstream use
- Every unique user gets a Supabase-assigned UUID — no shared accounts

**Evidence files:**
- `backend/src/plugins/authPlugin.ts` — full plugin (52 lines)

---

#### IA-5: Authenticator Management
**Status:** Partial
**NIST Requirement:** The system manages information system authenticators.

**Implementation:**
- Password management (complexity, rotation, recovery) is handled entirely by Supabase Auth
- JWT tokens are short-lived (configurable expiry, default 1 hour)
- OAuth tokens for integrated services (Google, Microsoft, etc.) are stored encrypted in the `integrations` table
- Service-to-service authentication uses environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, etc.) — not stored in code

**Gaps:**
- No explicit token rotation mechanism at the application layer
- No token revocation list (see AC-12)
- OAuth refresh tokens are stored in the database but rotation is not enforced

**Evidence files:**
- `backend/src/plugins/authPlugin.ts`
- `backend/src/env.ts` — environment variable definitions (Zod-validated)

---

#### IA-11: Re-Authentication
**Status:** Planned
**NIST Requirement:** The system requires re-authentication when defined circumstances or situations require it.

**Implementation:**
- Currently, once a JWT is issued, it is valid until Supabase expiry. There is no mechanism to force re-authentication or revoke a session
- The compliance hardening design (Section 6) specifies a `revoked_tokens` table and `POST /v1/auth/logout` endpoint with `authPlugin` blacklist checking, but this is not yet implemented

**Evidence files:**
- `docs/plans/2026-03-03-compliance-hardening-design.md` — Section 6

---

### 3.4 SC — System and Communications Protection

#### SC-5: Denial of Service Protection
**Status:** Implemented (basic)
**NIST Requirement:** The system protects against or limits the effects of denial of service attacks.

**Implementation:**
- `@fastify/rate-limit` registered globally: 60 requests per minute per IP address
- CORS origin whitelist restricts which domains can make requests: `https://www.atlasux.cloud`, `https://atlasux.cloud` (plus `localhost:5173` and `localhost:3000` in development)
- Render's infrastructure provides network-level DDoS protection

**Evidence files:**
- `backend/src/server.ts` — line 191 (rate limit registration), lines 140-167 (CORS configuration)

**Gaps:**
- Rate limiting is IP-only, not per-tenant or per-user
- No tenant-level quota enforcement (designed in compliance hardening Section 4 with three tiers: `auth` at 10/min, `mutation` at 30/min, `read` at 120/min)
- No explicit request body size limits beyond Fastify defaults

---

#### SC-8: Transmission Confidentiality and Integrity
**Status:** Partial
**NIST Requirement:** The system protects the confidentiality and integrity of transmitted information.

**Implementation:**
- All traffic between client and server is HTTPS — TLS termination is handled by Render (backend) and Vercel (frontend)
- Supabase connections use TLS (connection pooling via pgBouncer over TLS)
- `@fastify/helmet` is registered and sets various security headers including `X-Content-Type-Options: nosniff`

**Gaps:**
- No explicit `Strict-Transport-Security` (HSTS) header is configured in Helmet. The compliance hardening design (Section 7) specifies: `hsts: { maxAge: 31536000, includeSubDomains: true }`
- `Referrer-Policy` is not explicitly set (Helmet default is `no-referrer`)
- CSP `script-src` includes `'unsafe-inline'` which weakens the policy

**Evidence files:**
- `backend/src/server.ts` — lines 169-189 (Helmet configuration)
- `docs/plans/2026-03-03-compliance-hardening-design.md` — Section 7

---

#### SC-23: Session Authenticity
**Status:** Planned
**NIST Requirement:** The system protects the authenticity of communications sessions.

**Implementation:**
- A `csrfPlugin.ts` exists implementing a double-submit cookie pattern with:
  - `csrf_token` cookie set on non-mutating requests
  - `x-csrf-token` header required on `POST`, `PUT`, `PATCH`, `DELETE` requests
  - Skip list for webhook endpoints (Discord, Meta, Google, X, TikTok, Telegram, LinkedIn, etc.)
- However, **the plugin is currently disabled** in `server.ts` (line 199: `// await app.register(csrfPlugin);`) because double-submit cookies do not work cross-origin (previously Vercel frontend to Render backend; now consolidated on AWS Lightsail at `atlasux.cloud`)
- CORS origin whitelist provides partial CSRF mitigation by rejecting requests from unlisted origins

**Designed remediation (from compliance hardening design, Section 2):**
- Replace double-submit cookies with a DB-backed synchronizer token pattern using the existing `oauth_state` table
- On auth: backend generates CSRF token, stores in `oauth_state` (1-hour TTL), returns via `x-csrf-token` response header
- Frontend reads header, sends on all state-changing requests via `x-csrf-token` request header
- Backend `preHandler` validates token exists in DB

**Evidence files:**
- `backend/src/plugins/csrfPlugin.ts` — existing (disabled) implementation
- `backend/src/server.ts` — line 199 (disabled registration)
- `docs/plans/2026-03-03-compliance-hardening-design.md` — Section 2

---

### 3.5 SI — System and Information Integrity

#### SI-10: Information Input Validation
**Status:** Partial
**NIST Requirement:** The system checks the validity of information inputs.

**Implementation:**
- Zod (`z` from `"zod"`) is used for schema validation in approximately 10 route files:
  - `backend/src/routes/filesRoutes.ts`
  - `backend/src/routes/stripeRoutes.ts`
  - `backend/src/routes/redditRoutes.ts`
  - `backend/src/routes/growthRoutes.ts`
  - `backend/src/routes/blogRoutes.ts`
  - `backend/src/routes/browserRoutes.ts`
  - `backend/src/routes/businessManagerRoutes.ts`
  - `backend/src/routes/listeningRoutes.ts`
  - `backend/src/routes/decisionRoutes.ts`
  - `backend/src/routes/meetingRoutes.ts`
- `backend/src/env.ts` uses Zod to validate all environment variables at startup
- `tenantPlugin.ts` validates tenant IDs against a UUID regex before use in RLS session variables
- `withTenant()` in `prisma.ts` validates tenantId format before executing `SET LOCAL`

**Gaps:**
- Several route files still use `req.body as any` without Zod validation (e.g., `complianceRoutes.ts`, `telegramRoutes.ts`, `auditRoutes.ts`)
- No HTML sanitization utility exists yet (`backend/src/lib/sanitize.ts` is designed but not created)
- Standardized error format (`{ ok: false, error: string, details?: ZodError }`) is not enforced consistently

**Evidence files:**
- `backend/src/env.ts` — Zod environment validation
- `backend/src/db/prisma.ts` — UUID regex validation (line 16)
- `backend/src/plugins/tenantPlugin.ts` — UUID validation (line 22)
- Various route files listed above

---

#### SI-11: Error Handling
**Status:** Implemented
**NIST Requirement:** The system generates error messages that provide information necessary for corrective actions without revealing information that could be exploited.

**Implementation:**
- All API responses use structured JSON: `{ ok: true, ... }` or `{ ok: false, error: "descriptive_code" }`
- `auditPlugin.ts` catches all errors in the `onSend` hook and logs them server-side without exposing details to the client (line 70: `app.log.error({ err }, "AUDIT DB WRITE FAILED (non-fatal)")`)
- Fastify's built-in error serializer strips stack traces in production
- `authPlugin.ts` returns generic error codes (`"missing_bearer_token"`, `"invalid_token"`) without leaking internal state
- `tenantPlugin.ts` returns `"INVALID_TENANT_ID"` or `"TENANT_ACCESS_DENIED"` without revealing whether the tenant exists

**Evidence files:**
- `backend/src/plugins/auditPlugin.ts` — lines 68-83 (error handling)
- `backend/src/plugins/authPlugin.ts` — lines 19-26 (auth error responses)
- `backend/src/plugins/tenantPlugin.ts` — lines 36-57 (tenant error responses)

---

### 3.6 CM — Configuration Management

#### CM-6: Configuration Settings
**Status:** Implemented
**NIST Requirement:** The organization establishes and documents configuration settings for system components and implements those settings.

**Implementation:**
- `@fastify/helmet` registered in `server.ts` (lines 169-189) with explicit Content Security Policy:
  - `defaultSrc: ["'self'"]`
  - `scriptSrc: ["'self'", "'unsafe-inline'", "https://widget.trustpilot.com"]`
  - `styleSrc: ["'self'", "'unsafe-inline'"]`
  - `imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co", "https://atlasux.cloud"]`
  - `fontSrc: ["'self'"]`
  - `connectSrc: ["'self'", "https://atlasux.cloud", "https://*.supabase.co", "wss://*.supabase.co"]`
  - `frameSrc: ["'none'"]` — prevents clickjacking via iframe embedding
  - `objectSrc: ["'none'"]` — blocks Flash/Java plugin embedding
  - `baseUri: ["'self'"]` — prevents base tag hijacking
- Helmet also sets standard security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-DNS-Prefetch-Control`, `X-Permitted-Cross-Domain-Policies`
- `crossOriginEmbedderPolicy: false` to allow Supabase asset loading

**Gaps:**
- `'unsafe-inline'` in `scriptSrc` and `styleSrc` weakens CSP protection
- No explicit HSTS configuration (see SC-8)

**Evidence files:**
- `backend/src/server.ts` — lines 169-189

---

### 3.7 MP — Media Protection

#### MP-5: Media Transport / Storage Encryption
**Status:** Implemented (infrastructure-level)
**NIST Requirement:** The organization protects and controls digital media during transport and at rest.

**Implementation:**
- **At rest:** Supabase Storage uses AES-256 encryption for all stored files. The storage bucket `kb_uploads` holds tenant-scoped files under paths `tenants/{tenantId}/`
- **In transit:** All file uploads and downloads go through HTTPS endpoints (`/v1/files`). Download links are time-limited signed URLs generated by Supabase
- **Per-tenant quotas:** `MAX_FILES_PER_TENANT` (500 files), `MAX_STORAGE_MB_PER_TENANT` (500 MB) enforced at the application layer in `filesRoutes.ts`
- **Access control:** File operations require authenticated user with valid tenant membership

**Evidence files:**
- `backend/src/routes/filesRoutes.ts` — file upload, download (signed URL), delete, list operations with quota enforcement

---

## 4. Evidence References

### 4.1 Endpoint URLs (Production)

| Endpoint | Method | Control | Description |
|---|---|---|---|
| `https://atlasux.cloud/v1/compliance/dashboard` | GET | AU-2, Multiple | Unified compliance status across all frameworks |
| `https://atlasux.cloud/v1/compliance/dsar` | GET/POST | SI-10 | GDPR data subject request management |
| `https://atlasux.cloud/v1/compliance/dsar/:id` | PATCH | AU-2 | Update DSAR status (audit-logged) |
| `https://atlasux.cloud/v1/compliance/dsar/:email/export` | GET | MP-5 | Data portability export (GDPR Art. 20) |
| `https://atlasux.cloud/v1/compliance/dsar/:email/erase` | DELETE | AU-2 | Data erasure (GDPR Art. 17), audit-logged |
| `https://atlasux.cloud/v1/compliance/consent` | POST | AU-2 | Consent grant with audit trail |
| `https://atlasux.cloud/v1/compliance/consent/:email/:purpose` | DELETE | AU-2 | Consent withdrawal with audit trail |
| `https://atlasux.cloud/v1/compliance/breaches` | GET/POST | AU-2, SI-11 | Data breach register |
| `https://atlasux.cloud/v1/compliance/incidents` | GET/POST | AU-2 | Incident report management |
| `https://atlasux.cloud/v1/compliance/vendors` | GET/POST | CM-6 | Vendor risk assessment registry |
| `https://atlasux.cloud/v1/audit` | GET | AU-2, AU-3 | Audit log query interface |
| `https://atlasux.cloud/health` | GET | SC-5 | Health check (unauthenticated) |

### 4.2 File Path References

| File | Controls Supported | Purpose |
|---|---|---|
| `backend/src/plugins/auditPlugin.ts` | AU-2, AU-3, SI-11 | Global audit logging hook |
| `backend/src/plugins/authPlugin.ts` | IA-2, IA-5, AC-12 | JWT authentication and user provisioning |
| `backend/src/plugins/tenantPlugin.ts` | AC-3, SI-10 | Tenant resolution, membership verification, UUID validation |
| `backend/src/plugins/csrfPlugin.ts` | SC-23 | CSRF protection (currently disabled) |
| `backend/src/db/prisma.ts` | AC-3, SI-10 | Prisma singleton with `withTenant()` RLS helper |
| `backend/src/server.ts` | CM-6, SC-5, SC-8 | Helmet, CORS, rate limiting configuration |
| `backend/src/routes/complianceRoutes.ts` | AU-2, SI-10, SI-11 | Compliance CRUD (DSAR, consent, breaches, incidents, vendors) |
| `backend/src/routes/filesRoutes.ts` | MP-5, SI-10 | File storage with Zod validation and tenant quotas |
| `backend/src/env.ts` | SI-10, CM-6 | Zod-validated environment variable definitions |
| `backend/prisma/migrations/20260228120000_rls_policies/migration.sql` | AC-3 | RLS policy DDL for 9 tables |
| `backend/prisma/schema.prisma` | AU-3, AC-3 | Database schema (audit_log model, tenant FKs) |

---

## 5. Gap Analysis and Remediation Timeline

### 5.1 Summary of Gaps

| Control | Gap Description | Severity | Remediation |
|---|---|---|---|
| **AU-10** (Non-Repudiation) | No hash-chained audit logs. Records can be tampered with without detection | High | Add `prev_hash` and `record_hash` columns, implement SHA-256 chain in `auditPlugin.ts`, add verification endpoint |
| **SC-23** (CSRF) | CSRF plugin is disabled. State-changing requests are not protected against cross-site forgery beyond CORS | High | Rewrite `csrfPlugin.ts` with DB-backed synchronizer token pattern; re-enable in `server.ts` |
| **AC-12 / IA-11** (Session Termination) | No logout endpoint or token blacklist. Compromised tokens cannot be revoked before expiry | High | Add `revoked_tokens` table, `POST /v1/auth/logout` endpoint, blacklist check in `authPlugin` |
| **SC-8** (HSTS) | No explicit HSTS header. Browsers may not enforce HTTPS on subsequent visits | Medium | Add `hsts: { maxAge: 31536000, includeSubDomains: true }` to Helmet config |
| **SI-10** (Input Validation) | Many routes lack Zod validation; `req.body as any` is common | Medium | Add Zod schemas to all remaining routes; create `sanitize.ts` for HTML sanitization |
| **SC-5** (Per-Tenant Rate Limiting) | Rate limiting is IP-only, not tenant-aware | Medium | Implement `tenantRateLimit.ts` with `rate_limit_buckets` table and three-tier limits |
| **AC-3** (Forced RLS) | RLS policies exist but `FORCE ROW LEVEL SECURITY` is not applied; superuser connections bypass policies | Medium | Add `FORCE ROW LEVEL SECURITY` after all routes adopt `withTenant()` |
| **CM-6** (CSP Hardening) | `'unsafe-inline'` in CSP `scriptSrc` and `styleSrc` | Low | Remove `'unsafe-inline'` where possible; use nonces or hashes for inline scripts |

### 5.2 Remediation Timeline

The following remediation plan aligns with the compliance hardening design document (`docs/plans/2026-03-03-compliance-hardening-design.md`):

| Phase | Target Date | Controls Addressed | Work Items |
|---|---|---|---|
| **Phase 1** | Week of 2026-03-03 | AU-10 | Hash-chained audit logs (migration + `auditPlugin.ts` modification + verification endpoint) |
| **Phase 2** | Week of 2026-03-10 | AC-3 | Expand `withTenant()` adoption to all routes; add `FORCE ROW LEVEL SECURITY` |
| **Phase 3** | Week of 2026-03-10 | SC-23 | DB-backed CSRF synchronizer token (rewrite `csrfPlugin.ts` + re-enable + frontend integration) |
| **Phase 4** | Week of 2026-03-17 | AC-12, IA-11 | Session termination (`revoked_tokens` table + logout endpoint + `authPlugin` blacklist) |
| **Phase 5** | Week of 2026-03-17 | SC-5 | Per-tenant rate limiting (`rate_limit_buckets` table + `tenantRateLimit.ts`) |
| **Phase 6** | Week of 2026-03-24 | SI-10 | Input validation sweep (Zod schemas on all remaining routes + `sanitize.ts`) |
| **Phase 7** | Week of 2026-03-24 | SC-8, CM-6 | HSTS header + CSP hardening (remove `'unsafe-inline'` where possible) |
| **Phase 8** | Week of 2026-03-31 | All | Policy document rewrite, evidence collection, final verification |

### 5.3 Continuous Monitoring Plan

Once remediation is complete:
- `GET /v1/compliance/audit/verify` will be called daily by a scheduled workflow to validate audit chain integrity
- `GET /v1/compliance/dashboard` provides real-time compliance posture across all frameworks
- Vendor assessments are tracked with annual reassessment reminders (`nextAssessmentDue`)
- DSAR overdue check (`GET /v1/compliance/dsar/overdue`) monitors GDPR response deadlines
- Breach deadline tracking (`GET /v1/compliance/breaches/deadlines`) monitors 72-hour authority notification windows

---

## 6. Additional NIST 800-53 Control Families — Applicability Notes

The following control families from NIST 800-53 Rev 5 are acknowledged but either handled at the infrastructure layer or not directly applicable to Atlas UX as a SaaS application:

| Family | Applicability | Notes |
|---|---|---|
| **AT (Awareness & Training)** | Organizational | Training requirements are outside the scope of the application. Documented in `policies/RISK_MANAGEMENT.md` |
| **CA (Assessment & Authorization)** | Organizational | Security assessment procedures are documented but not enforced by code |
| **CP (Contingency Planning)** | Infrastructure | Handled by Render (auto-restart, health checks), Supabase (managed PostgreSQL with backups), and Vercel (CDN with global edge) |
| **IR (Incident Response)** | Partial (code) | Incident reporting is implemented via `complianceRoutes.ts` (`/v1/compliance/incidents`). Documented in `policies/INCIDENT_RESPONSE.md` |
| **MA (Maintenance)** | Infrastructure | System maintenance is handled by managed infrastructure providers |
| **PE (Physical & Environmental)** | Not applicable | Atlas UX is a cloud-native SaaS with no on-premises infrastructure. Physical security is delegated to AWS (Supabase), Render, and Vercel data centers |
| **PL (Planning)** | Organizational | Security planning is documented in `docs/plans/` and `policies/` directories |
| **PM (Program Management)** | Organizational | Security program management is outside the scope of the application |
| **PS (Personnel Security)** | Organizational | Personnel security requirements are outside the scope of the application |
| **PT (PII Processing)** | Partial (code) | PII processing is governed by GDPR compliance controls (see `policies/GDPR_COMPLIANCE.md` and `complianceRoutes.ts`) |
| **RA (Risk Assessment)** | Organizational | Risk assessment procedures documented in `policies/RISK_MANAGEMENT.md` |
| **SA (System & Services Acquisition)** | Organizational | Vendor management implemented via `complianceRoutes.ts` (`/v1/compliance/vendors`). Documented in `policies/VENDOR_MANAGEMENT.md` |

---

Last updated: March 1, 2026
Next review: June 1, 2026
NIST 800-53 Baseline: Moderate
Overall Status: Partial — 9 of 16 mapped controls implemented, 2 partial, 5 planned
