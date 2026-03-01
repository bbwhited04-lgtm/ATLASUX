# ISO 27001:2022 Compliance Framework -- Atlas UX

**Effective Date:** March 1, 2026
**Last Updated:** March 1, 2026
**Owner:** DEAD APP CORP
**Scope:** Atlas UX platform -- Fastify API (Render), React SPA (Vercel), Supabase PostgreSQL, all third-party integrations
**Standard:** ISO/IEC 27001:2022 Information Security Management Systems

---

## 1. Framework Overview

ISO 27001:2022 specifies requirements for establishing, implementing, maintaining, and continually improving an Information Security Management System (ISMS). The 2022 revision reorganizes Annex A into four control themes (Organizational, People, Physical, Technological) containing 93 controls.

Atlas UX is a multi-tenant AI employee productivity platform. This document maps each applicable Annex A control to its concrete implementation in our codebase, identifies gaps honestly, and provides a remediation timeline where controls are partial or planned.

### ISMS Scope

- **Systems in scope:** Fastify 5 backend (Render), React 18 SPA (Vercel), Supabase PostgreSQL 16, Supabase Auth, Stripe billing, 15+ OAuth provider integrations, AI inference (OpenAI, DeepSeek, OpenRouter, Cerebras), Supabase Storage (`kb_uploads` bucket)
- **Processes in scope:** User authentication, tenant provisioning, AI agent orchestration, job execution, audit logging, DSAR processing, consent management, breach response, vendor assessment, payment processing
- **Exclusions:** Physical data center security (delegated to Render, Vercel, and Supabase/AWS infrastructure providers -- see vendor assessments). Atlas UX is a cloud-native SaaS with no owned physical infrastructure.

---

## 2. Annex A Control Mapping

### A.5 -- Organizational Controls

| Control ID | Control Name | Implementation | File Path | Status |
|------------|-------------|---------------|-----------|--------|
| A.5.1 | Policies for information security | 12 policy documents covering security, compliance, data retention, incident response, risk management, vendor management, SGL governance | `policies/*.md` | Implemented |
| A.5.2 | Information security roles and responsibilities | Agent roster defines roles (CEO, CFO, CLO, etc.) with SGL-enforced boundaries; `tenantPlugin` enforces role-based membership | `backend/src/plugins/tenantPlugin.ts`, `policies/SGL.md` | Implemented |
| A.5.3 | Segregation of duties | SGL policy requires human approval for high-risk actions (spend above `AUTO_SPEND_LIMIT_USD`, risk tier >= 2); decision memos separate proposer from approver | `policies/SGL.md`, `policies/EXECUTION_CONSTITUTION.md`, `backend/src/routes/decisionRoutes.ts` | Implemented |
| A.5.4 | Management responsibilities | Execution Constitution defines management accountability; SGL non-overridable prohibitions cannot be bypassed by any actor including founders | `policies/EXECUTION_CONSTITUTION.md`, `policies/SGL.md` | Implemented |
| A.5.5 | Contact with authorities | Breach register auto-calculates GDPR 72-hour authority notification deadline and HIPAA 60-day individual notification deadline | `backend/src/routes/complianceRoutes.ts` (POST `/v1/compliance/breaches`) | Implemented |
| A.5.6 | Contact with special interest groups | Not applicable -- no formal special interest group memberships | -- | N/A |
| A.5.7 | Threat intelligence | Platform intel sweep workflows (WF-093 through WF-105) scan external sources daily at 05:00 UTC; Atlas Daily Aggregation (WF-106) processes at 05:45 UTC | `backend/src/routes/workflowsRoutes.ts` | Implemented |
| A.5.8 | Information security in project management | CLAUDE.md enforces mandatory build rules for all code changes; SGL evaluates every agent intent before execution | `CLAUDE.md`, `policies/SGL.md` | Partial |
| A.5.9 | Inventory of information and other associated assets | Prisma schema defines 50+ models with explicit tenant ownership; `assets` table tracks tenant assets | `backend/prisma/schema.prisma`, `backend/src/routes/assets.ts` | Implemented |
| A.5.10 | Acceptable use of information and other associated assets | SGL non-overridable prohibitions define unacceptable uses; daily action cap (`MAX_ACTIONS_PER_DAY`) enforced | `policies/SGL.md`, `backend/src/core/engine/engine.ts` | Implemented |
| A.5.11 | Return of assets | OAuth token revocation lifecycle handles provider-side token cleanup on disconnect; integration tokens cleared from both `token_vault` and `integration` table | `backend/src/lib/tokenLifecycle.ts` | Implemented |
| A.5.12 | Classification of information | Not formalized -- no classification labels applied to data at rest | -- | Planned |
| A.5.13 | Labelling of information | Not implemented -- no labeling scheme | -- | Planned |
| A.5.14 | Information transfer | All API communication over HTTPS (TLS terminated at Render/Vercel); CORS whitelist restricts origins to `atlasux.cloud` + localhost in dev | `backend/src/server.ts` (lines 140-167) | Implemented |
| A.5.15 | Access control | JWT authentication via Supabase Auth; tenant membership verified per request; UUID format validation on tenant IDs | `backend/src/plugins/authPlugin.ts`, `backend/src/plugins/tenantPlugin.ts` | Implemented |
| A.5.16 | Identity management | Supabase Auth handles identity lifecycle; auto-provisioned `User` record on first auth; `TenantMember` links users to tenants with roles | `backend/src/plugins/authPlugin.ts` (lines 31-44), `backend/src/routes/authRoutes.ts` | Implemented |
| A.5.17 | Authentication information | Bearer tokens issued by Supabase Auth (JWT); no plaintext credential storage in application layer | `backend/src/plugins/authPlugin.ts` | Implemented |
| A.5.18 | Access rights | Role-based: `tenantPlugin` checks `TenantMember` for role and seat type; unauthenticated users rejected with 403 | `backend/src/plugins/tenantPlugin.ts` (lines 42-57) | Implemented |
| A.5.19 | Information security in supplier relationships | Vendor risk assessment register with risk levels, compliance certifications, DPA tracking, BAA tracking, annual reassessment schedule | `backend/src/routes/complianceRoutes.ts` (vendor endpoints), `policies/VENDOR_MANAGEMENT.md` | Implemented |
| A.5.20 | Addressing information security within supplier agreements | Vendor assessment tracks `hasDataProcessingAgreement` and `hasBaa` per vendor; annual reassessment enforced via `nextAssessmentDue` | `backend/src/routes/complianceRoutes.ts` (lines 611-671) | Implemented |
| A.5.21 | Managing information security in the ICT supply chain | Vendor categories cover infrastructure, AI, payment, and integration providers; all assessed with risk levels | `policies/VENDOR_MANAGEMENT.md` | Implemented |
| A.5.22 | Monitoring, review and change management of supplier services | `GET /v1/compliance/vendors/due` returns vendors past reassessment deadline; compliance dashboard aggregates vendor status | `backend/src/routes/complianceRoutes.ts` (lines 674-688) | Implemented |
| A.5.23 | Information security for use of cloud services | Infrastructure runs on Render (backend), Vercel (frontend), Supabase (database/auth/storage) -- all SOC 2 certified providers documented in vendor register | `policies/VENDOR_MANAGEMENT.md` | Implemented |
| A.5.24 | Information security incident management planning and preparation | Incident Response Plan defines P0-P3 severity levels, response procedures, containment steps; `IncidentReport` model in database | `policies/INCIDENT_RESPONSE.md`, `backend/src/routes/complianceRoutes.ts` (incident endpoints) | Implemented |
| A.5.25 | Assessment and decision on information security events | Incidents classified by severity (p0-p3) and category; audit log captures all API requests with status codes | `backend/src/plugins/auditPlugin.ts`, `backend/src/routes/complianceRoutes.ts` (lines 496-555) | Implemented |
| A.5.26 | Response to information security incidents | Incident lifecycle: open -> investigating -> contained -> resolved -> closed; root cause and resolution tracked | `backend/src/routes/complianceRoutes.ts` (PATCH `/v1/compliance/incidents/:id`) | Implemented |
| A.5.27 | Learning from information security incidents | `lessonsLearned` field on incident reports; post-mortem URL tracked on breach records | `backend/src/routes/complianceRoutes.ts` (lines 558-592, 430-465) | Implemented |
| A.5.28 | Collection of evidence | Audit log captures every API request with method, URL, status code, request ID, IP address, user agent, actor ID | `backend/src/plugins/auditPlugin.ts` | Partial |
| A.5.29 | Information security during disruption | Health check endpoint at `/health` monitored by Render; engine loop has independent tick with error isolation | `backend/src/server.ts` (line 207), `backend/src/workers/engineLoop.ts` | Partial |
| A.5.30 | ICT readiness for business continuity | Supabase provides automated PostgreSQL backups; Render provides zero-downtime deploys; no formal BC plan documented | -- | Planned |
| A.5.31 | Legal, statutory, regulatory and contractual requirements | GDPR (DSAR, consent, breach), HIPAA (BAA tracking), PCI DSS (Stripe delegation) endpoints implemented; SGL blocks statutory violations | `backend/src/routes/complianceRoutes.ts`, `policies/SGL.md` | Implemented |
| A.5.32 | Intellectual property rights | SGL blocks copyright and trademark infringement as non-overridable prohibitions | `policies/SGL.md` (line 23-24) | Implemented |
| A.5.33 | Protection of records | Audit logs retained per GDPR Article 17(3)(e) legal obligation; erasure endpoint explicitly preserves audit trail | `backend/src/routes/complianceRoutes.ts` (line 220) | Implemented |
| A.5.34 | Privacy and protection of PII | DSAR endpoints (access, erasure, portability, restriction, rectification, objection); consent management with lawful basis tracking; 30-day GDPR deadline enforcement | `backend/src/routes/complianceRoutes.ts` (lines 15-238) | Implemented |
| A.5.35 | Independent review of information security | No formal independent security review program | -- | Planned |
| A.5.36 | Compliance with policies, rules and standards for information security | Compliance dashboard (`GET /v1/compliance/dashboard`) provides unified status across GDPR, breach management, incident response, and vendor management | `backend/src/routes/complianceRoutes.ts` (lines 694-745) | Implemented |
| A.5.37 | Documented operating procedures | CLAUDE.md documents all build, deploy, and operational commands; SGL documents execution rules | `CLAUDE.md`, `policies/SGL.md` | Partial |

### A.6 -- People Controls

| Control ID | Control Name | Implementation | File Path | Status |
|------------|-------------|---------------|-----------|--------|
| A.6.1 | Screening | Not applicable -- Atlas UX is a startup with no formal HR screening process for AI agents; human team screening is an organizational process outside the codebase | -- | N/A (organizational) |
| A.6.2 | Terms and conditions of employment | Not applicable -- organizational HR process | -- | N/A (organizational) |
| A.6.3 | Information security awareness, education and training | SGL policy and Execution Constitution serve as mandatory awareness documents for all agents and operators; no formal training program | `policies/SGL.md`, `policies/EXECUTION_CONSTITUTION.md` | Partial |
| A.6.4 | Disciplinary process | SGL BLOCK decisions prevent policy violations at execution time rather than relying on after-the-fact discipline | `policies/SGL.md` | Partial |
| A.6.5 | Responsibilities after termination or change of employment | Token revocation lifecycle clears all provider tokens on disconnect; no formal offboarding procedure for human staff | `backend/src/lib/tokenLifecycle.ts` | Partial |
| A.6.6 | Confidentiality or non-disclosure agreements | Not implemented in codebase -- organizational process | -- | Planned |
| A.6.7 | Remote working | All infrastructure is cloud-native; CORS restrictions and JWT auth protect against unauthorized remote access | `backend/src/server.ts`, `backend/src/plugins/authPlugin.ts` | Partial |
| A.6.8 | Information security event reporting | Incident creation endpoint allows any authenticated user to report security events; audit logging captures all API activity | `backend/src/routes/complianceRoutes.ts` (POST `/v1/compliance/incidents`) | Implemented |

### A.7 -- Physical Controls

| Control ID | Control Name | Implementation | File Path | Status |
|------------|-------------|---------------|-----------|--------|
| A.7.1 - A.7.14 | Physical security controls | Delegated to infrastructure providers: Render (SOC 2 Type II), Vercel (SOC 2 Type II), Supabase/AWS (SOC 2, ISO 27001). Atlas UX owns no physical infrastructure. | `policies/VENDOR_MANAGEMENT.md` | N/A (delegated) |

### A.8 -- Technological Controls

| Control ID | Control Name | Implementation | File Path | Status |
|------------|-------------|---------------|-----------|--------|
| A.8.1 | User endpoint devices | Electron desktop app available but no MDM enforcement; web SPA runs in user's browser | `electron/` | Partial |
| A.8.2 | Privileged access rights | Supabase service role key used only server-side; Prisma connects as DB superuser; no separate admin role in application layer beyond `owner` seat type | `backend/src/plugins/authPlugin.ts`, `backend/src/db/prisma.ts` | Partial |
| A.8.3 | Information access restriction | Row-Level Security enabled on 9 tables (`integrations`, `assets`, `jobs`, `distribution_events`, `audit_log`, `kb_documents`, `decision_memos`, `crm_contacts`, `crm_companies`); `withTenant()` helper sets PostgreSQL session variable for RLS policy enforcement | `backend/prisma/migrations/20260228120000_rls_policies/migration.sql`, `backend/src/db/prisma.ts` (lines 30-41) | Partial |
| A.8.4 | Access to source code | GitHub repository with branch protection (main branch); CLAUDE.md enforces build-before-commit rule | `CLAUDE.md` | Partial |
| A.8.5 | Secure authentication | JWT-based via Supabase Auth; bearer token required on all authenticated routes; `authPlugin` validates token via `supabase.auth.getUser()` on every request | `backend/src/plugins/authPlugin.ts` (lines 15-51) | Implemented |
| A.8.6 | Capacity management | Per-tenant quotas: `MAX_FILES_PER_TENANT` (500), `MAX_STORAGE_MB_PER_TENANT` (500), `MAX_ACTIONS_PER_DAY`, daily posting cap; global rate limit 60 req/min | `backend/src/routes/filesRoutes.ts`, `backend/src/server.ts` (line 191) | Implemented |
| A.8.7 | Protection against malware | Not directly applicable -- server-side Node.js; no file execution from uploads; Supabase Storage serves files with signed URLs only | `backend/src/routes/filesRoutes.ts` | Partial |
| A.8.8 | Management of technical vulnerabilities | No formal vulnerability management program; `npm audit` not automated in CI | -- | Planned |
| A.8.9 | Configuration management | Environment variables defined in `env.ts` (185 vars); Helmet security headers configured in `server.ts`; Render `render.yaml` for deployment config | `backend/src/env.ts`, `backend/src/server.ts` (lines 169-189) | Implemented |
| A.8.10 | Information deletion | GDPR Right to Erasure endpoint: `DELETE /v1/compliance/dsar/:email/erase` deletes CRM contacts, consent records, clears integration tokens; audit logs retained per legal obligation | `backend/src/routes/complianceRoutes.ts` (lines 182-221) | Implemented |
| A.8.11 | Data masking | Not implemented -- no data masking or pseudonymization in application layer | -- | Planned |
| A.8.12 | Data leakage prevention | CORS whitelist restricts API access to known origins; CSP headers restrict script/connect/frame sources; SGL blocks unauthorized data sharing | `backend/src/server.ts` (lines 140-189) | Partial |
| A.8.13 | Information backup | Delegated to Supabase (automated PostgreSQL backups); no application-level backup strategy documented | -- | Partial |
| A.8.14 | Redundancy of information processing facilities | Render provides container orchestration; Supabase provides database HA; no multi-region deployment | -- | Partial |
| A.8.15 | Logging | Audit plugin logs every API request: method, URL, status code, actor ID, IP address, user agent, request ID; stored in `audit_log` table | `backend/src/plugins/auditPlugin.ts` | Implemented |
| A.8.16 | Monitoring activities | Engine loop ticks every 5 seconds; compliance dashboard aggregates DSAR, breach, incident, and vendor status; Agent Watcher polls audit log every 4 seconds | `backend/src/workers/engineLoop.ts`, `backend/src/routes/complianceRoutes.ts` (GET `/v1/compliance/dashboard`), `src/components/AgentWatcher.tsx` | Implemented |
| A.8.17 | Clock synchronization | All timestamps use JavaScript `new Date()` (system clock); database timestamps use PostgreSQL `now()` | -- | Implemented |
| A.8.18 | Use of privileged utility programs | Supabase service role key restricted to backend; `SUPABASE_SERVICE_ROLE_KEY` never exposed to frontend; Prisma client uses connection pooling via Pgbouncer | `backend/src/plugins/authPlugin.ts` (lines 6-11), `backend/src/db/prisma.ts` | Implemented |
| A.8.19 | Installation of software on operational systems | Render builds from `package.json` lockfile; no arbitrary software installation; dependencies pinned in `package-lock.json` | `backend/package.json`, `backend/package-lock.json` | Implemented |
| A.8.20 | Networks security | Render provides network isolation; Supabase Pgbouncer for connection pooling; no direct database exposure to internet | `backend/src/db/prisma.ts` | Partial |
| A.8.21 | Security of network services | HTTPS enforced on all endpoints (Render TLS termination, Vercel TLS termination); HSTS not explicitly configured in application (relies on infrastructure providers) | `backend/src/server.ts` | Partial |
| A.8.22 | Segregation of networks | Separate services: web API, email worker, engine worker, scheduler -- each runs as independent Render service with its own process | `backend/src/server.ts`, `backend/src/workers/emailSender.ts`, `backend/src/workers/engineLoop.ts` | Implemented |
| A.8.23 | Web filtering | CSP directives restrict `script-src`, `connect-src`, `frame-src`, `object-src`; `frame-src: 'none'`, `object-src: 'none'` | `backend/src/server.ts` (lines 170-189) | Implemented |
| A.8.24 | Use of cryptography | Supabase Auth handles JWT signing; OAuth tokens stored in `TokenVault`; Discord webhook uses Ed25519 signature verification; no application-level encryption at rest | `backend/src/server.ts` (lines 92-139), `backend/src/lib/tokenLifecycle.ts` | Partial |
| A.8.25 | Secure development life cycle | CLAUDE.md mandates: build before commit, no phantom imports, no stub code, real Prisma models only, correct import paths, proper Fastify logger signatures | `CLAUDE.md` | Partial |
| A.8.26 | Application security requirements | Input validation with Zod on 15 route files; tenant ID UUID format validation; CORS origin whitelist; rate limiting at 60 req/min global | See Zod usage list below | Partial |
| A.8.27 | Secure system architecture and engineering principles | Multi-tenancy via `tenant_id` FK on all tables; plugin architecture (audit, auth, tenant, CSRF); RLS policies for defense-in-depth | `backend/src/server.ts`, `backend/src/db/prisma.ts`, `backend/prisma/migrations/20260228120000_rls_policies/migration.sql` | Implemented |
| A.8.28 | Secure coding | Prisma ORM prevents SQL injection for standard queries; `withTenant()` validates UUID format before `SET LOCAL`; parameterized queries throughout; `as any` casts documented as technical debt | `backend/src/db/prisma.ts` (lines 33-36) | Partial |
| A.8.29 | Security testing in development and acceptance | No automated security testing (SAST, DAST, dependency scanning); manual testing only | -- | Planned |
| A.8.30 | Outsourced development | All AI-assisted development governed by CLAUDE.md mandatory build rules; no third-party development contractors | `CLAUDE.md` | Partial |
| A.8.31 | Separation of development, test and production environments | Separate environment variables for dev vs production; `NODE_ENV` check gates dev-only CORS origins and cookie settings; no formal staging environment | `backend/src/server.ts` (lines 144-147) | Partial |
| A.8.32 | Change management | Git-based: all changes committed to main branch; Render and Vercel deploy from main; build must pass before commit (CLAUDE.md rule) | `CLAUDE.md` | Partial |
| A.8.33 | Test information | No formal test data management policy | -- | Planned |
| A.8.34 | Protection of information systems during audit testing | Audit log cannot be deleted via API; GDPR erasure explicitly preserves audit trail per Article 17(3)(e) | `backend/src/routes/complianceRoutes.ts` (line 220) | Implemented |

---

## 3. Key Control Deep Dives

### 3.1 Access Control (A.5.15, A.5.16, A.5.18, A.8.3, A.8.5)

**Authentication chain:**
1. Frontend sends Supabase JWT in `Authorization: Bearer <token>` header
2. `authPlugin` validates token via `supabase.auth.getUser(token)` -- rejects with 401 if invalid
3. `authPlugin` auto-provisions a `User` record on first successful auth
4. `tenantPlugin` reads `x-tenant-id` header, validates UUID format against regex, checks `TenantMember` table for membership
5. Non-members rejected with 403 `TENANT_ACCESS_DENIED`

**Row-Level Security:**
- RLS enabled on 9 tenant-scoped tables via migration `20260228120000`
- Policy: `tenant_id = current_setting('app.tenant_id', true)::uuid`
- `withTenant()` helper in `backend/src/db/prisma.ts` wraps queries in a transaction with `SET LOCAL app.tenant_id`
- Phase 2 (current): RLS enabled without `FORCE` -- superuser bypass for migrations
- Phase 3 (planned): `FORCE ROW LEVEL SECURITY` once all routes use `withTenant()`

**Evidence files:**
- `backend/src/plugins/authPlugin.ts`
- `backend/src/plugins/tenantPlugin.ts`
- `backend/src/db/prisma.ts`
- `backend/prisma/migrations/20260228120000_rls_policies/migration.sql`

### 3.2 Audit Logging (A.5.28, A.8.15, A.8.16)

**What is logged:**
- Every HTTP request/response via `auditPlugin` `onSend` hook
- Actor type, actor user ID, log level (info/warn/error based on status code)
- HTTP method and URL as `action`
- IP address, user agent, request ID, status code in metadata
- All compliance mutations (DSAR, consent, breach, incident, vendor) explicitly logged with domain-specific actions

**Resilience:**
- Audit failures never block the request (wrapped in try/catch)
- Schema errors (missing enum) trigger a 10-second pause, then auto-retry -- never permanently disabled
- Comment in code: "SOC2 requires continuous audit logging"

**Gap -- Hash-chained audit logs:**
- `prev_hash` and `record_hash` columns not yet added
- Chain verification endpoint (`GET /v1/compliance/audit/verify`) not yet implemented
- Tamper detection not possible without hash chains
- Planned per compliance hardening design document

**Evidence files:**
- `backend/src/plugins/auditPlugin.ts`
- `backend/src/routes/complianceRoutes.ts`
- `backend/src/routes/auditRoutes.ts`

### 3.3 Communications Security (A.5.14, A.8.20, A.8.21, A.8.23)

**Transport security:**
- TLS termination handled by Render (backend) and Vercel (frontend)
- No explicit HSTS header in application code -- relies on infrastructure providers
- Planned: Helmet HSTS with `maxAge: 31536000, includeSubDomains: true`

**CORS configuration (server.ts lines 140-167):**
- Whitelist: `https://www.atlasux.cloud`, `https://atlasux.cloud`
- Dev additions: `http://localhost:5173`, `http://localhost:3000`
- Credentials: enabled
- Allowed headers: `Content-Type`, `Authorization`, `x-tenant-id`, `x-user-id`, `x-device-id`, `x-request-id`, `x-client-source`, `x-inbound-secret`, `x-csrf-token`

**Content Security Policy (server.ts lines 170-189):**
- `default-src: 'self'`
- `script-src: 'self' 'unsafe-inline' https://widget.trustpilot.com`
- `frame-src: 'none'`
- `object-src: 'none'`
- `base-uri: 'self'`
- Gap: `'unsafe-inline'` in `script-src` weakens CSP

**Rate limiting:**
- Global: 60 requests per minute (`@fastify/rate-limit`)
- Per-route overrides on sensitive endpoints (auth, chat)
- Gap: IP-based only -- no per-tenant rate limiting yet

**Evidence files:**
- `backend/src/server.ts`

### 3.4 System Development Security (A.8.25, A.8.26, A.8.27, A.8.28)

**Input validation:**
Zod schemas are used in the following route files:
- `backend/src/routes/decisionRoutes.ts`
- `backend/src/routes/browserRoutes.ts`
- `backend/src/routes/meetingRoutes.ts`
- `backend/src/routes/chatRoutes.ts`
- `backend/src/routes/stripeRoutes.ts`
- `backend/src/routes/filesRoutes.ts`
- `backend/src/routes/listeningRoutes.ts`
- `backend/src/routes/businessManagerRoutes.ts`
- `backend/src/routes/blogRoutes.ts`
- `backend/src/routes/redditRoutes.ts`
- `backend/src/routes/distributionRoutes.ts`
- `backend/src/routes/growthRoutes.ts`

Gap: Many routes still use `req.body as any` without Zod validation, including `complianceRoutes.ts` itself.

**CSRF protection:**
- `csrfPlugin.ts` exists with double-submit cookie pattern
- Currently **disabled** in `server.ts` (commented out) because double-submit cookies do not work cross-origin (Vercel frontend -> Render backend)
- CORS origin whitelist provides partial mitigation
- Planned: DB-backed synchronizer token pattern per compliance hardening design

**Secure coding rules (CLAUDE.md):**
1. Build before commit -- always
2. Never import files that do not exist
3. Use only real Prisma models (verified against schema)
4. No stub/simulated code in production
5. Correct Prisma import path (`../db/prisma.js`)
6. Correct Fastify logger signature (`{ err }` object pattern)
7. Route registration pattern (export as `FastifyPluginAsync`, register under `/v1`)
8. No duplicate functionality

**Evidence files:**
- `CLAUDE.md`
- `backend/src/plugins/csrfPlugin.ts`
- `backend/src/server.ts` (lines 11-13, 199)

---

## 4. CSRF Protection -- Detailed Status

The CSRF plugin (`backend/src/plugins/csrfPlugin.ts`) implements the double-submit cookie pattern:
- Sets `csrf_token` cookie on non-mutating requests
- Validates `x-csrf-token` header matches cookie on POST/PUT/PATCH/DELETE
- Exempts webhook endpoints from third-party services

**Current state:** Disabled. The plugin is imported but commented out in `server.ts` (line 199) because double-submit cookies require `SameSite` cookie sharing between frontend and backend, which does not work when the frontend (Vercel) and backend (Render) are on different origins.

**Planned remediation:** Replace with DB-backed synchronizer token pattern using the existing `OAuthState` table (1-hour TTL), returned via `x-csrf-token` response header. Frontend captures header and sends on all state-changing requests. This works cross-origin.

---

## 5. Session Termination -- Detailed Status

**Current state:** No session termination mechanism exists. There is no logout endpoint, no token blacklist table, and no way to revoke a compromised Supabase JWT.

The `authPlugin` validates tokens by calling `supabase.auth.getUser(token)` on every request, which provides implicit revocation if Supabase itself revokes the token. However, there is no application-level mechanism to force session termination.

**Planned remediation:**
- `revoked_tokens` table with `token_hash`, `revoked_at`, `expires_at`
- `POST /v1/auth/logout` endpoint: calls `supabase.auth.signOut()` + adds token hash to revoked table
- `authPlugin` checks `revoked_tokens` before accepting bearer tokens
- Daily prune of expired revocations

---

## 6. Gap Analysis

### Critical Gaps (Must Address for Certification)

| Gap | Controls Affected | Risk | Remediation |
|-----|------------------|------|-------------|
| No hash-chained audit logs | A.5.28, A.8.15 | Tamper detection impossible; audit integrity unverifiable | Add `prev_hash`/`record_hash` columns; SHA-256 chain per tenant; verification endpoint |
| CSRF protection disabled | A.8.26, A.8.28 | State-changing request forgery possible despite CORS | Implement DB-backed synchronizer token pattern |
| No session termination | A.5.18, A.8.5 | Cannot revoke compromised sessions | Add `revoked_tokens` table and logout endpoint |
| No HSTS header | A.8.21 | Transport downgrade attacks possible if infra HSTS fails | Configure Helmet HSTS: `maxAge: 31536000, includeSubDomains: true` |
| RLS not forced | A.8.3 | Superuser queries bypass RLS; single point of failure for tenant isolation | Add `FORCE ROW LEVEL SECURITY` once all routes use `withTenant()` |

### Moderate Gaps

| Gap | Controls Affected | Risk | Remediation |
|-----|------------------|------|-------------|
| IP-only rate limiting | A.8.6 | Per-tenant resource exhaustion possible | Add `rate_limit_buckets` table with per-tenant, per-endpoint-group limits |
| Inconsistent input validation | A.8.26 | Injection/XSS on unvalidated routes | Add Zod schemas to all routes using `req.body as any` |
| `unsafe-inline` in CSP | A.8.23 | XSS mitigation weakened | Remove `unsafe-inline` from `script-src`; use nonces or hashes |
| No automated security testing | A.8.29 | Vulnerabilities may go undetected | Integrate SAST/DAST in CI pipeline |
| No formal staging environment | A.8.31 | Changes go directly to production | Add staging deployment target |

### Accepted / Low Priority Gaps

| Gap | Controls Affected | Risk Level | Rationale |
|-----|------------------|------------|-----------|
| No data classification scheme | A.5.12, A.5.13 | Low | All tenant data treated as confidential by default; classification adds value at scale |
| No formal BC plan | A.5.30 | Medium | Supabase backups + Render container orchestration provide base resilience |
| No vulnerability management program | A.8.8 | Medium | Manual `npm audit` runs; no automated scanning |
| Physical security | A.7.1-A.7.14 | N/A | Fully delegated to SOC 2 certified infrastructure providers |

---

## 7. Statement of Applicability Summary

| Control Theme | Total Controls | Implemented | Partial | Planned | N/A |
|--------------|---------------|-------------|---------|---------|-----|
| A.5 Organizational | 37 | 25 | 5 | 4 | 3 |
| A.6 People | 8 | 1 | 4 | 1 | 2 |
| A.7 Physical | 14 | 0 | 0 | 0 | 14 |
| A.8 Technological | 34 | 16 | 13 | 5 | 0 |
| **Totals** | **93** | **42** | **22** | **10** | **19** |

**Applicable controls:** 74 (93 minus 19 N/A)
**Implemented or partial:** 64 of 74 applicable (86%)
**Fully implemented:** 42 of 74 applicable (57%)

---

## 8. Evidence Reference Index

| Evidence Type | Location | Description |
|--------------|----------|-------------|
| Authentication plugin | `backend/src/plugins/authPlugin.ts` | JWT validation via Supabase Auth |
| Tenant isolation plugin | `backend/src/plugins/tenantPlugin.ts` | Multi-tenant access control with membership verification |
| Audit logging plugin | `backend/src/plugins/auditPlugin.ts` | Per-request audit trail with resilience |
| Database RLS migration | `backend/prisma/migrations/20260228120000_rls_policies/migration.sql` | Row-Level Security on 9 tables |
| RLS helper | `backend/src/db/prisma.ts` | `withTenant()` function for RLS session variable |
| CSRF plugin (disabled) | `backend/src/plugins/csrfPlugin.ts` | Double-submit cookie pattern (not active) |
| Server security config | `backend/src/server.ts` | CORS, Helmet CSP, rate limiting, plugin registration |
| Compliance routes | `backend/src/routes/complianceRoutes.ts` | DSAR, consent, breach, incident, vendor endpoints |
| Auth routes | `backend/src/routes/authRoutes.ts` | Tenant provisioning |
| Token lifecycle | `backend/src/lib/tokenLifecycle.ts` | OAuth token refresh and revocation |
| SGL policy | `policies/SGL.md` | Non-overridable execution boundaries |
| Execution Constitution | `policies/EXECUTION_CONSTITUTION.md` | Agent execution rules and accountability |
| Incident Response Plan | `policies/INCIDENT_RESPONSE.md` | P0-P3 severity definitions and procedures |
| Risk Management Framework | `policies/RISK_MANAGEMENT.md` | Risk assessment methodology |
| Data Retention Policy | `policies/DATA_RETENTION.md` | Data lifecycle and deletion rules |
| Vendor Management Policy | `policies/VENDOR_MANAGEMENT.md` | Third-party vendor assessment process |
| Prisma schema | `backend/prisma/schema.prisma` | 50+ models defining data architecture |
| Build rules | `CLAUDE.md` | Mandatory development practices |
| Compliance hardening plan | `docs/plans/2026-03-03-compliance-hardening-design.md` | Remediation design for all identified gaps |

---

## 9. Remediation Timeline

| Phase | Work Item | Target Date | Controls Addressed |
|-------|-----------|-------------|-------------------|
| 1 | Hash-chained audit logs | 2026-03-10 | A.5.28, A.8.15 |
| 2 | Database-level RLS (FORCE) | 2026-03-10 | A.8.3 |
| 3 | CSRF protection (DB-backed) | 2026-03-14 | A.8.26, A.8.28 |
| 4 | Session termination + token blacklist | 2026-03-14 | A.5.18, A.8.5 |
| 5 | Per-tenant rate limiting | 2026-03-17 | A.8.6 |
| 6 | Input validation sweep (Zod on all routes) | 2026-03-17 | A.8.26 |
| 7 | HSTS + transport security hardening | 2026-03-21 | A.8.21 |
| 8 | Automated security testing (CI) | 2026-03-28 | A.8.29 |

---

Last updated: March 1, 2026
Next review: June 1, 2026
