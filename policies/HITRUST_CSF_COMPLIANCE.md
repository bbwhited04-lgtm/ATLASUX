# HITRUST CSF v11 Compliance Policy

**Effective Date:** March 1, 2026
**Last Updated:** March 1, 2026
**Owner:** DEAD APP CORP
**Scope:** Atlas UX platform — Fastify backend (Render), React SPA (Vercel), Supabase PostgreSQL, all third-party vendor integrations
**HITRUST CSF Version:** 11.x (2024 release, ISO/IEC 27001:2022-aligned)

---

## 1. Framework Overview

The HITRUST Common Security Framework (CSF) v11 is a certifiable security framework that harmonizes requirements from ISO 27001/27002, NIST 800-53, HIPAA, PCI DSS, GDPR, and other regulatory frameworks into a single, assessable control set. It uses a maturity-based scoring model across 14 control categories (00 through 13), each containing control objectives and implementation specifications.

Atlas UX is pursuing HITRUST CSF e1 (essentials, 1-year) certification as its initial target, with a roadmap to i1 (implemented, 1-year) upon completion of the compliance hardening work outlined in `docs/plans/2026-03-03-compliance-hardening-design.md`. This document maps HITRUST CSF v11 control categories to the actual Atlas UX codebase, infrastructure, and operational procedures.

### Assessment Scope

**In-scope systems:**
- Fastify 5 API server on Render (web service + 3 worker services)
- React 18 SPA on Vercel
- Supabase PostgreSQL 16 (database, auth, storage)
- Supabase Storage (file uploads, tenant-scoped)
- AI provider integrations (OpenAI, DeepSeek, OpenRouter, Cerebras, Gemini)
- Third-party platform integrations (Stripe, Microsoft Graph, Telegram, social media APIs)

**Out of scope:**
- End-user devices (Atlas UX does not manage client hardware)
- Physical facilities (fully cloud-hosted, no owned data centers)
- HR processes for human employees (Atlas UX uses AI agents, not human staff for operational tasks)

---

## 2. Control Category Mapping

The following table maps each HITRUST CSF v11 control category to Atlas UX implementations, referencing real code paths. Status values:

- **Implemented** — Control is enforced in production code
- **Partial** — Control exists but has known gaps requiring hardening
- **Planned** — Control is designed but not yet implemented
- **N/A** — Control does not apply to Atlas UX's operating model

---

### Category 01: Access Control

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 01.a | Access control policy | JWT-based auth via Supabase; `authPlugin.ts` verifies bearer tokens on every request. Tenant membership verified in `tenantPlugin.ts`. | `backend/src/plugins/authPlugin.ts` | Implemented |
| 01.b | Session termination / token revocation | Compliance hardening plan defines a `revoked_tokens` table and `POST /v1/auth/logout` endpoint to blacklist JWT tokens. `authPlugin` will check the blacklist before accepting tokens. | `backend/src/plugins/authPlugin.ts` (planned), `backend/src/routes/authRoutes.ts` (planned) | Planned |
| 01.c | Tenant isolation / least privilege | Every database table has a `tenant_id` FK. `tenantPlugin.ts` extracts and validates tenant ID (UUID format enforced). `withTenant()` in `db/prisma.ts` sets `SET LOCAL app.tenant_id` for PostgreSQL RLS policies. RLS migration planned in compliance hardening. | `backend/src/plugins/tenantPlugin.ts`, `backend/src/db/prisma.ts` | Partial |
| 01.d | User registration and provisioning | `authPlugin.ts` auto-provisions a `User` record on first authentication via `prisma.user.upsert()`. Tenant membership is enforced: authenticated users without membership get 403. | `backend/src/plugins/authPlugin.ts` (lines 32-44), `backend/src/plugins/tenantPlugin.ts` (lines 42-56) | Implemented |
| 01.e | Privilege management | `TenantMember` model tracks `role` (member/admin) and `seatType` (free_beta/starter/pro/enterprise). `tenantPlugin.ts` sets `req.tenantRole` and `req.seatType` per request. | `backend/prisma/schema.prisma` (TenantMember model), `backend/src/plugins/tenantPlugin.ts` | Implemented |
| 01.f | Password / credential management | Delegated to Supabase Auth. Supabase enforces password complexity, bcrypt hashing, and rate-limited login attempts. Atlas UX never stores plaintext passwords. | Supabase Auth (external), `backend/src/plugins/authPlugin.ts` | Implemented |

**Evidence:**
- `backend/src/plugins/authPlugin.ts` — JWT validation via `supabase.auth.getUser(token)`, user provisioning
- `backend/src/plugins/tenantPlugin.ts` — UUID validation (`UUID_RE`), membership verification, 403 on unauthorized access
- `backend/src/db/prisma.ts` — `withTenant()` function for RLS-scoped transactions
- `backend/prisma/schema.prisma` — TenantMember model with role/seatType

**Gaps:**
- 01.b: Token revocation (blacklist table + logout endpoint) is designed but not yet deployed. See `docs/plans/2026-03-03-compliance-hardening-design.md`, Section 6.
- 01.c: Database-level RLS policies are defined in `withTenant()` but RLS `ENABLE ROW LEVEL SECURITY` migration has not been applied to all 12 target tables. Application-level tenant filtering is in place.

---

### Category 02: Human Resources Security

| Control ID | Control Objective | Implementation | Status |
|---|---|---|---|
| 02.a | Roles and responsibilities | N/A for human employees. Atlas UX operational tasks are performed by AI agents defined in `agents` table and `Agents/` directory. Agent roles, permissions, and tool restrictions are codified in the `agents` schema (`tools_allowed`, `tools_restricted`, `advisory_only`, `can_block`). | N/A |
| 02.b | Screening | N/A. No human employees in scope. AI agent behavior is governed by SGL (Statutory Guardrail Layer) defined in `policies/SGL.md`. | N/A |
| 02.c | Terms and conditions of employment | N/A. AI agent execution is bound by `policies/EXECUTION_CONSTITUTION.md` and SGL policies. Agents cannot override their constraints. | N/A |
| 02.d | Security awareness and training | N/A for AI agents. Platform operator (DEAD APP CORP) maintains awareness of security practices. | N/A |
| 02.e | Disciplinary process | AI agents that produce BLOCK or REVIEW SGL decisions are logged to `audit_log`. Tamper attempts trigger restricted execution state per SGL Section 6. | N/A |
| 02.f | Termination / change of responsibilities | Agent deactivation is managed via `agents.status` field and workflow enable/disable. No human offboarding process required. | N/A |

**Note:** HITRUST CSF Category 02 is designed for organizations with human workforces. Atlas UX's AI agent model replaces traditional HR controls with programmatic governance (SGL, agent registry, tool restrictions). An assessor will need to evaluate whether the AI governance model satisfies the intent of Category 02 controls or whether a formal exemption is appropriate.

---

### Category 03: Risk Management

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 03.a | Risk management program | Risk management framework documented. Decision memos enforce risk-tier-based approval for agent actions. | `policies/RISK_MANAGEMENT.md`, `backend/prisma/schema.prisma` (DecisionMemo model) | Implemented |
| 03.b | Risk assessment | DecisionMemo model captures `riskTier` (0-3), `confidence`, and `estimatedCostUsd` for every agent-proposed action. Actions with `riskTier >= 2` require human approval. | `backend/prisma/schema.prisma` (DecisionMemo), `backend/src/routes/decisionRoutes.ts` | Implemented |
| 03.c | Risk treatment | SGL policy defines three outcomes: ALLOW, REVIEW, BLOCK. High-risk actions are escalated to human review. Blocked actions are logged and never executed. | `policies/SGL.md`, `backend/src/core/engine/engine.ts` | Implemented |

---

### Category 05: Asset Management

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 05.a | Inventory of assets | `Asset` model tracks tenant-owned digital assets (type, name, URL, platform, metrics). All assets are tenant-scoped via `tenant_id` FK. | `backend/prisma/schema.prisma` (Asset model), `backend/src/routes/assets.ts` | Implemented |
| 05.b | Ownership of assets | Every asset record has a `tenantId` FK enforcing ownership. Tenant members manage assets through authenticated, tenant-scoped API calls. | `backend/src/routes/assets.ts` | Implemented |
| 05.c | Acceptable use of assets | AI agent tool access is controlled via `agents.tools_allowed` and `agents.tools_restricted` JSON arrays. SGL blocks unauthorized tool usage. | `backend/prisma/schema.prisma` (agents model) | Implemented |
| 05.d | Information classification | Not formally implemented. Data is implicitly classified by table: `consent_records` (PII), `data_breaches` (security), `ledger_entries` (financial). No formal classification labels. | N/A | Planned |
| 05.e | Tenant-scoped storage | File uploads are stored in Supabase Storage under `tenants/{tenantId}/` prefix. Per-tenant quotas enforced: `MAX_FILES_PER_TENANT` (500 files), `MAX_STORAGE_MB_PER_TENANT` (500 MB). MIME type whitelist and extension validation enforced. VirusTotal scanning available for uploaded files. | `backend/src/routes/filesRoutes.ts`, `backend/src/lib/virusScan.ts` | Implemented |

**Evidence:**
- `backend/src/routes/filesRoutes.ts` — `ALLOWED_MIME` whitelist (lines 26-36), MIME-extension consistency check (lines 144-148), quota enforcement (lines 128-131, 166-168), tenant-prefix path isolation (line 171), virus scanning (line 153)
- `backend/src/lib/virusScan.ts` — VirusTotal integration: SHA-256 hash check, upload for analysis, configurable via `VIRUS_SCAN_ENABLED` env var

**Gaps:**
- 05.d: Formal data classification policy (public/internal/confidential/restricted labels) not implemented. Recommend adding a `classification` field to sensitive models.

---

### Category 06: Communications and Operations Management

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 06.a | Documented operating procedures | Workflow definitions stored in `workflows` and `atlas_workflows` tables. Each workflow has versioned steps (`workflow_steps`), trigger conditions, and policy constraints. 105+ workflows defined. | `backend/prisma/schema.prisma` (workflows, workflow_steps), `backend/src/routes/workflowsRoutes.ts` | Implemented |
| 06.b | Change management | Code changes deployed via Git push to main. Render auto-deploys on push. Vercel auto-deploys on push. No formal change advisory board, but decision memos provide approval for agent-initiated changes. | `render.yaml`, Vercel config | Partial |
| 06.c | Segregation of duties | AI agents have defined roles with restricted tool access. Agent actions are logged to `audit_log`. Decision memos require human approval for spend above `AUTO_SPEND_LIMIT_USD` or `riskTier >= 2`. | `backend/prisma/schema.prisma` (agents, DecisionMemo) | Implemented |
| 06.d | Separation of environments | Development uses `localhost:5173` (frontend) and `localhost:8787` (backend) with `docker-compose` PostgreSQL. Production uses Render + Vercel + Supabase. CORS origin whitelist separates environments. | `backend/src/server.ts` (lines 140-147) | Implemented |

---

### Category 09: Information Systems Acquisition, Development, and Maintenance

This category maps to HITRUST control references 09.aa (audit logging), 09.m (network security), and 09.o (input validation).

#### 09.aa — Audit Logging

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 09.aa.1 | Audit event generation | `auditPlugin.ts` hooks into Fastify's `onSend` lifecycle. Every HTTP request/response is logged to `audit_log` with actor, action, status code, IP address, user agent, and request ID. | `backend/src/plugins/auditPlugin.ts` | Implemented |
| 09.aa.2 | Audit log content | AuditLog model stores: `tenantId`, `actorUserId`, `actorExternalId`, `actorType`, `level` (info/warn/error/security), `action`, `entityType`, `entityId`, `message`, `meta` (JSON), `timestamp`, `prevHash`, `recordHash`. | `backend/prisma/schema.prisma` (AuditLog model, lines 173-199) | Implemented |
| 09.aa.3 | Audit log integrity | Hash-chain columns (`prevHash`, `recordHash`) exist in schema. Compliance hardening plan adds SHA-256 chain computation: `record_hash = SHA-256(prev_hash + tenantId + action + entityId + timestamp + actorUserId)`. Verification endpoint planned at `GET /v1/compliance/audit/verify`. | `backend/prisma/schema.prisma` (AuditLog, lines 190-191) | Partial |
| 09.aa.4 | Audit log protection | Audit plugin never fails the request on logging errors (`catch` block, line 69). Schema errors trigger a 10-second pause with auto-retry, not permanent disable. Audit logs are retained per GDPR Article 17(3)(e) exemption (legal obligation). | `backend/src/plugins/auditPlugin.ts` (lines 68-83) | Implemented |
| 09.aa.5 | Audit log retention | Logs stored in Supabase PostgreSQL. No automated deletion. Data retention policy documented in `policies/DATA_RETENTION.md`. | `policies/DATA_RETENTION.md` | Implemented |
| 09.aa.6 | Compliance-specific logging | Every compliance mutation is explicitly audit-logged: DSAR operations (`DSAR_CREATED`, `DSAR_UPDATED`), consent changes (`CONSENT_GRANTED`, `CONSENT_WITHDRAWN`), breach reports (`BREACH_REPORTED`, `BREACH_UPDATED`), data exports (`DATA_EXPORT`), data erasures (`DATA_ERASURE`), vendor assessments (`VENDOR_ASSESSED`), incident reports (`INCIDENT_CREATED`, `INCIDENT_UPDATED`). | `backend/src/routes/complianceRoutes.ts` | Implemented |

**Evidence:**
- `backend/src/plugins/auditPlugin.ts` — Full request lifecycle logging with two-attempt schema compatibility (lines 47-66)
- `backend/src/routes/complianceRoutes.ts` — 14 distinct audit log actions across DSAR, consent, breach, incident, and vendor operations
- `backend/prisma/schema.prisma` — AuditLog model with `prevHash`/`recordHash` columns and indexes (`audit_log_record_hash_idx`)

**Gaps:**
- 09.aa.3: Hash-chain computation logic not yet implemented in `auditPlugin.ts`. Schema columns exist but are always `null`. Chain verification endpoint (`/v1/compliance/audit/verify`) not yet created. See `docs/plans/2026-03-03-compliance-hardening-design.md`, Section 1.

---

#### 09.m — Network Security / Transport Controls

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 09.m.1 | CSRF protection | CSRF plugin exists but is disabled. CORS origin whitelist (`www.atlasux.cloud`, `atlasux.cloud`) provides cross-origin protection. Compliance hardening plan defines a DB-backed synchronizer token pattern using the `oauth_state` table. | `backend/src/server.ts` (lines 11-13, 199), `backend/src/plugins/csrfPlugin.ts` (disabled) | Partial |
| 09.m.2 | Rate limiting | Global rate limit: 60 requests/minute via `@fastify/rate-limit`. Per-route overrides on sensitive endpoints (e.g., file uploads: 20/min). IP-based limiting in production. Per-tenant rate limiting planned. | `backend/src/server.ts` (line 191) | Partial |
| 09.m.3 | HSTS / transport security | Helmet middleware registered with CSP directives. Current config does not set explicit HSTS `max-age`. Compliance hardening plan adds `maxAge: 31536000, includeSubDomains: true`. Render provides TLS termination for all services. | `backend/src/server.ts` (lines 169-189) | Partial |
| 09.m.4 | CORS policy | Strict origin whitelist: only `www.atlasux.cloud` and `atlasux.cloud` in production. `localhost:5173` and `localhost:3000` added only in non-production. Credentials enabled. Allowed headers explicitly enumerated. | `backend/src/server.ts` (lines 140-167) | Implemented |
| 09.m.5 | Content Security Policy | Helmet CSP configured: `default-src: 'self'`, `script-src` allows Trustpilot widget, `frame-src: 'none'`, `object-src: 'none'`, `base-uri: 'self'`. `connect-src` restricted to Render API and Supabase. | `backend/src/server.ts` (lines 170-189) | Implemented |
| 09.m.6 | Request signature verification | Discord webhook endpoint verifies Ed25519 signatures using the `DISCORD_PUBLIC_KEY`. Stripe webhook verifies signatures via `stripe.webhooks.constructEvent()`. | `backend/src/server.ts` (lines 95-139), `backend/src/routes/stripeRoutes.ts` | Implemented |

**Evidence:**
- `backend/src/server.ts` — CORS origin whitelist (lines 140-147), Helmet CSP (lines 169-189), rate limiting (line 191), Discord signature verification (lines 95-139)

**Gaps:**
- 09.m.1: CSRF plugin disabled. CORS whitelist provides partial protection but is not a complete CSRF mitigation for same-origin attacks. See compliance hardening Section 2.
- 09.m.2: Rate limiting is IP-based only. Per-tenant rate limiting (`rate_limit_buckets` table) is planned. See compliance hardening Section 4.
- 09.m.3: HSTS header not explicitly set with recommended `max-age`. See compliance hardening Section 7.

---

#### 09.o — Input Validation

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 09.o.1 | Input validation framework | Zod schemas used for input validation on 12+ route files. Remaining routes use `req.body as any` casts. Compliance hardening plan adds Zod schemas to all routes. | Various routes (see list below) | Partial |
| 09.o.2 | File upload validation | MIME type whitelist (19 types), extension-MIME consistency check, 50 MB file size limit, VirusTotal scanning, per-tenant file count and storage quotas. Filename sanitization via regex. | `backend/src/routes/filesRoutes.ts` (lines 26-63, 139-170) | Implemented |
| 09.o.3 | DSAR input validation | Request type validated against allowed values (`access`, `erasure`, `portability`, `restriction`, `rectification`, `objection`). Status validated against (`pending`, `in_progress`, `completed`, `denied`). Consent purpose and lawful basis validated against allowed sets. | `backend/src/routes/complianceRoutes.ts` (lines 42-46, 92-95, 267-275) | Implemented |
| 09.o.4 | Tenant ID validation | UUID format enforced via regex (`UUID_RE`) in both `tenantPlugin.ts` and `db/prisma.ts`. Invalid format returns 400 immediately, preventing SQL injection via RLS session variables. | `backend/src/plugins/tenantPlugin.ts` (line 36), `backend/src/db/prisma.ts` (lines 16, 34) | Implemented |

**Routes with Zod validation:** `decisionRoutes.ts`, `browserRoutes.ts`, `meetingRoutes.ts`, `chatRoutes.ts`, `stripeRoutes.ts`, `filesRoutes.ts`, `listeningRoutes.ts`, `businessManagerRoutes.ts`, `blogRoutes.ts`, `redditRoutes.ts`, `distributionRoutes.ts`, `growthRoutes.ts`

**Gaps:**
- 09.o.1: Not all routes use Zod schemas. Some routes still use `req.body as any` casts, which bypass input validation. See compliance hardening Section 5. Target: 100% Zod coverage on all POST/PUT/PATCH routes.

---

### Category 10: Incident Management

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 10.a | Incident management procedures | Incident response plan documented with severity levels (P0-P3), roles (IC/TL/CL), escalation chains, and platform-specific runbooks for Render, Supabase, and Vercel. | `policies/INCIDENT_RESPONSE.md` | Implemented |
| 10.b | Incident reporting | `IncidentReport` model in database with `severity` (p0-p3), `status` (open/investigating/mitigated/resolved/closed), `category` (security/availability/data_integrity/access_control/compliance/operational), `affectedSystems`, and assignment tracking. CRUD endpoints at `/v1/compliance/incidents`. | `backend/prisma/schema.prisma` (IncidentReport, lines 1164-1188), `backend/src/routes/complianceRoutes.ts` (lines 492-592) | Implemented |
| 10.c | Breach register | `DataBreach` model tracks breach lifecycle: detection, containment, eradication, recovery, closure. Automatic deadline calculation: 72-hour GDPR authority notification, 60-day HIPAA individual notification. Status tracking for authority and individual notifications. | `backend/prisma/schema.prisma` (DataBreach, lines 1132-1161), `backend/src/routes/complianceRoutes.ts` (lines 350-489) | Implemented |
| 10.d | Breach deadline monitoring | `GET /v1/compliance/breaches/deadlines` returns breaches approaching notification deadlines (within 24 hours). Compliance dashboard (`GET /v1/compliance/dashboard`) aggregates open breaches and missed deadlines. | `backend/src/routes/complianceRoutes.ts` (lines 468-489, 690-745) | Implemented |
| 10.e | Evidence collection | All incident and breach mutations are audit-logged with structured metadata. Incident reports capture `rootCause`, `resolution`, and `lessonsLearned`. Post-incident review template provided. | `backend/src/routes/complianceRoutes.ts`, `policies/INCIDENT_RESPONSE.md` (Section 9) | Implemented |
| 10.f | Regulatory notification | Breach notification timelines automated: `notifyAuthorityBy` (72h), `notifyIndividualsBy` (60 days). Communication templates for customer and regulatory notifications documented. GDPR Article 33/34 and HIPAA procedures defined. | `backend/src/routes/complianceRoutes.ts` (lines 381-383), `policies/INCIDENT_RESPONSE.md` (Section 7) | Implemented |

**Evidence:**
- `backend/src/routes/complianceRoutes.ts` — Full CRUD for incidents (`/incidents`) and breaches (`/breaches`) with audit logging
- `policies/INCIDENT_RESPONSE.md` — Detailed runbooks for Render, Supabase, Vercel, and API key compromise scenarios
- `backend/prisma/schema.prisma` — `IncidentReport` and `DataBreach` models with appropriate indexes

---

### Category 11: Business Continuity Management

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 11.a | Business continuity planning | Atlas UX runs entirely on managed cloud infrastructure: Render (compute), Vercel (CDN/frontend), Supabase (database/auth/storage). Each provider manages their own redundancy, failover, and disaster recovery. | `render.yaml` | Partial |
| 11.b | Service availability | Health check endpoint at `/health` and `/v1/health`. Render monitors service health and auto-restarts failed services. Engine loop heartbeat: if no `ENGINE_TICK` audit entries appear for >3 tick intervals (15+ seconds), the engine is considered degraded. | `backend/src/server.ts` (line 207), `backend/src/routes/healthRoutes.ts` | Implemented |
| 11.c | Data backup and recovery | Supabase provides daily automated PostgreSQL backups with point-in-time recovery (PITR). File storage backups managed by Supabase Storage infrastructure. Atlas UX does not manage its own backup processes. | Supabase (external) | Implemented |
| 11.d | Redundancy | Backend runs 4 Render services (web, email-worker, engine-worker, scheduler). Workers use optimistic locking (`updateMany` with status WHERE clause) to prevent duplicate processing. Database uses Supabase Pgbouncer for connection pooling. | `backend/src/workers/engineLoop.ts`, `backend/src/workers/emailSender.ts` | Implemented |
| 11.e | Disaster recovery testing | Incident response plan requires annual runbook validation and quarterly tabletop exercises. No formal DR test has been conducted yet. | `policies/INCIDENT_RESPONSE.md` (Section 11) | Planned |

**Gaps:**
- 11.a: No formal Business Impact Analysis (BIA) document exists. Recovery Time Objective (RTO) and Recovery Point Objective (RPO) are not formally defined for Atlas UX (they are inherited from provider SLAs).
- 11.e: Tabletop exercises and DR tests have not yet been conducted. Plan calls for quarterly exercises.

---

### Category 12: Compliance

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 12.a | Identification of applicable legislation | Compliance framework index lists all applicable frameworks (SOC 2, HIPAA, GDPR, ISO 27001, PCI DSS, NIST, HITRUST). | `policies/COMPLIANCE_INDEX.md` | Implemented |
| 12.b | Data subject rights (DSAR) | Full DSAR lifecycle: create, update, process, export (portability), erase. Types: access, erasure, portability, restriction, rectification, objection. 30-day deadline auto-calculated. Overdue monitoring endpoint. | `backend/src/routes/complianceRoutes.ts` (lines 15-238) | Implemented |
| 12.c | Consent management | Granular consent tracking per subject per purpose. Purposes: marketing, analytics, ai_processing, data_sharing, communications. Lawful bases: consent, contract, legal_obligation, vital_interest, public_task, legitimate_interest. Grant/withdraw with full audit trail including IP address and user agent. | `backend/src/routes/complianceRoutes.ts` (lines 240-348), `backend/prisma/schema.prisma` (ConsentRecord) | Implemented |
| 12.d | Data portability | `GET /v1/compliance/dsar/:email/export` aggregates all data for a subject across contacts, audit logs, jobs, ledger, integrations, consent records, and DSARs. Returns as downloadable JSON with `content-disposition` header. | `backend/src/routes/complianceRoutes.ts` (lines 128-179) | Implemented |
| 12.e | Right to erasure | `DELETE /v1/compliance/dsar/:email/erase` deletes CRM contacts, consent records, and clears integration tokens. Audit logs are retained per GDPR Article 17(3)(e) legal obligation exemption. Deletion counts returned in response. | `backend/src/routes/complianceRoutes.ts` (lines 182-221) | Implemented |
| 12.f | Vendor risk management | `VendorAssessment` model tracks vendor name, category, risk level, data access types, compliance certifications (SOC 2, HIPAA, GDPR, PCI DSS, ISO 27001), DPA status, BAA status. Annual reassessment with `nextAssessmentDue`. Due-for-reassessment endpoint. | `backend/src/routes/complianceRoutes.ts` (lines 594-688), `backend/prisma/schema.prisma` (VendorAssessment) | Implemented |
| 12.g | Compliance dashboard | `GET /v1/compliance/dashboard` aggregates GDPR status (DSAR pending/overdue, active consents), breach management (open/missed deadlines), incident response (open count), and vendor management (total/due for reassessment). | `backend/src/routes/complianceRoutes.ts` (lines 690-745) | Implemented |
| 12.h | Privacy impact assessment | Not formally implemented. AI agent processing of tenant data is governed by SGL and decision memos, but no formal DPIA template or process exists. | N/A | Planned |

**Evidence:**
- `backend/src/routes/complianceRoutes.ts` — 746 lines of compliance endpoints covering DSAR, consent, breaches, incidents, vendors, and dashboard
- `backend/prisma/schema.prisma` — `DataSubjectRequest`, `ConsentRecord`, `DataBreach`, `IncidentReport`, `VendorAssessment` models with full field definitions and indexes
- `policies/VENDOR_MANAGEMENT.md` — Vendor management policy documentation

**Gaps:**
- 12.h: No formal Data Protection Impact Assessment (DPIA) process or template. Required when processing operations are likely to result in high risk to data subjects' rights and freedoms.

---

### Category 04: Organizational Security (Information Security Governance)

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 04.a | Management commitment | SGL (Statutory Guardrail Layer) defines immutable, non-overridable execution boundaries. Board-level agent (Chairman) provides governance oversight. SGL changes require code update, version increment, audit record, and board acknowledgment. | `policies/SGL.md` | Implemented |
| 04.b | Information security coordination | Compliance routes consolidate all security-relevant operations under `/v1/compliance`. Audit plugin provides centralized logging. Agent roster defines security-relevant roles (Jenny = CLO, Benny = IP). | `backend/src/routes/complianceRoutes.ts`, `backend/src/plugins/auditPlugin.ts` | Implemented |

---

### Category 07: Physical and Environmental Security

| Control ID | Control Objective | Implementation | Status |
|---|---|---|---|
| 07.a | Physical security perimeters | N/A. Atlas UX is fully cloud-hosted on Render, Vercel, and Supabase. Physical security is the responsibility of the infrastructure providers. | N/A |
| 07.b | Equipment security | N/A. No owned or managed physical equipment. | N/A |

**Note:** Physical and environmental security controls are inherited from cloud infrastructure providers (Render, Vercel, Supabase). Vendor assessments should confirm that these providers maintain appropriate physical security certifications (SOC 2, ISO 27001).

---

### Category 08: Operations Security

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 08.a | Operational procedures and responsibilities | Engine loop runs as a separate process, ticking every `ENGINE_TICK_INTERVAL_MS` (default 5000ms). Workers (email, engine, scheduler) run as independent Render services. Job queue uses database-backed statuses (queued, running, succeeded, failed, canceled). | `backend/src/workers/engineLoop.ts`, `backend/src/server.ts` (lines 337-351) | Implemented |
| 08.b | Protection against malware | File uploads scanned via VirusTotal API (`VIRUS_SCAN_ENABLED`). MIME type whitelist as primary defense. Extension-MIME consistency validation. Virus scan fails open (defense-in-depth). | `backend/src/lib/virusScan.ts`, `backend/src/routes/filesRoutes.ts` | Implemented |
| 08.c | Backup | Supabase provides automated daily backups with point-in-time recovery. No application-level backup procedures. | Supabase (external) | Implemented |
| 08.d | Logging and monitoring | Fastify structured JSON logging (`{ logger: true }`). Audit plugin logs every request. Engine tick logs. Error-level logging for failed operations. | `backend/src/server.ts` (line 77), `backend/src/plugins/auditPlugin.ts` | Implemented |

---

### Category 13: Privacy

| Control ID | Control Objective | Implementation | File Path | Status |
|---|---|---|---|---|
| 13.a | Privacy notice | Privacy page exists at `/privacy` route in frontend. Terms page at `/terms`. | `src/pages/` (Privacy, Terms) | Implemented |
| 13.b | Consent mechanism | Granular consent management via `/v1/compliance/consent` endpoints. Consent records track purpose, lawful basis, grant/withdrawal timestamps, IP address, and user agent. Consent version tracked per record. | `backend/src/routes/complianceRoutes.ts` (lines 240-348) | Implemented |
| 13.c | Data minimization | File upload quotas limit data collection. Tenant-scoped queries prevent unnecessary data aggregation. Data export only gathers subject-specific data. | `backend/src/routes/filesRoutes.ts`, `backend/src/routes/complianceRoutes.ts` | Partial |
| 13.d | Data deletion / destruction | Right to erasure endpoint (`/dsar/:email/erase`) deletes CRM contacts, consent records, and clears integration tokens. Audit logs retained per legal obligation. Meta (Facebook) and Google data deletion callbacks implemented. | `backend/src/routes/complianceRoutes.ts`, `backend/src/routes/metaRoutes.ts`, `backend/src/routes/googleRoutes.ts` | Implemented |
| 13.e | Data breach notification | Automated deadline tracking for GDPR 72-hour authority notification and HIPAA 60-day individual notification. Breach register with full lifecycle tracking. | `backend/src/routes/complianceRoutes.ts` (lines 350-489) | Implemented |

---

## 3. Gap Analysis Summary

The following table summarizes all identified gaps between Atlas UX's current implementation and HITRUST CSF v11 requirements.

| Gap ID | Category | Control | Description | Risk | Remediation | Priority |
|---|---|---|---|---|---|---|
| GAP-01 | 01 | 01.b | No token revocation / session termination | Compromised JWT tokens cannot be invalidated until natural expiry | Deploy `revoked_tokens` table and logout endpoint per compliance hardening Section 6 | High |
| GAP-02 | 01 | 01.c | Database-level RLS not enabled | Single point of failure: a bug in application-level tenant filtering could expose cross-tenant data | Apply RLS migration per compliance hardening Section 3 | Critical |
| GAP-03 | 05 | 05.d | No formal data classification policy | Data sensitivity not labeled, making it harder to prove appropriate handling | Add classification field to sensitive models; document classification policy | Medium |
| GAP-04 | 09 | 09.aa.3 | Audit log hash chain not computed | `prevHash` and `recordHash` columns exist but are null; tamper detection not possible | Implement hash computation in `auditPlugin.ts` per compliance hardening Section 1 | High |
| GAP-05 | 09 | 09.m.1 | CSRF protection disabled | State-changing requests lack CSRF tokens; CORS whitelist provides partial but incomplete protection | Re-enable CSRF plugin with DB-backed synchronizer pattern per compliance hardening Section 2 | High |
| GAP-06 | 09 | 09.m.2 | Rate limiting is IP-based only | Tenant-level DoS and quota exhaustion possible | Deploy per-tenant rate limiting per compliance hardening Section 4 | Medium |
| GAP-07 | 09 | 09.m.3 | HSTS header not explicitly configured | Transport security cannot be provably demonstrated to assessors | Add Helmet HSTS configuration per compliance hardening Section 7 | Medium |
| GAP-08 | 09 | 09.o.1 | Incomplete Zod input validation | Some routes use `req.body as any`, bypassing validation | Add Zod schemas to all remaining routes per compliance hardening Section 5 | High |
| GAP-09 | 11 | 11.a | No formal BIA document | RTO/RPO not formally defined for Atlas UX | Document BIA based on provider SLAs | Medium |
| GAP-10 | 11 | 11.e | No DR test conducted | Recovery procedures untested | Conduct first tabletop exercise | Medium |
| GAP-11 | 12 | 12.h | No formal DPIA process | Required when AI agents process tenant data at scale | Create DPIA template and process | Medium |
| GAP-12 | 06 | 06.b | No formal change management process | Code deploys directly from main without CAB review | Document change management procedures; consider branch protection rules | Low |

---

## 4. Evidence References

### Endpoints

| Endpoint | Method | Purpose | HITRUST Control |
|---|---|---|---|
| `/v1/compliance/dsar` | GET, POST | List and create data subject requests | 12.b |
| `/v1/compliance/dsar/:id` | PATCH | Update DSAR status | 12.b |
| `/v1/compliance/dsar/:email/export` | GET | Export all data for a subject | 12.d |
| `/v1/compliance/dsar/:email/erase` | DELETE | Erase subject data | 12.e |
| `/v1/compliance/dsar/overdue` | GET | List overdue DSARs | 12.b |
| `/v1/compliance/consent/:email` | GET | List consent records | 12.c |
| `/v1/compliance/consent` | POST | Grant consent | 12.c |
| `/v1/compliance/consent/:email/:purpose` | DELETE | Withdraw consent | 12.c |
| `/v1/compliance/breaches` | GET, POST | List and report data breaches | 10.c |
| `/v1/compliance/breaches/:id` | PATCH | Update breach status | 10.c |
| `/v1/compliance/breaches/deadlines` | GET | Breaches approaching notification deadlines | 10.d |
| `/v1/compliance/incidents` | GET, POST | List and create incidents | 10.b |
| `/v1/compliance/incidents/:id` | PATCH | Update incident status | 10.b |
| `/v1/compliance/vendors` | GET, POST | List and assess vendors | 12.f |
| `/v1/compliance/vendors/due` | GET | Vendors due for reassessment | 12.f |
| `/v1/compliance/dashboard` | GET | Unified compliance status | 12.g |
| `/health` | GET | Service health check | 11.b |
| `/v1/files/upload` | POST | File upload with validation | 05.e, 09.o.2 |
| `/v1/auth/logout` | POST | Session termination (planned) | 01.b |

### Key Source Files

| File | Purpose | HITRUST Categories |
|---|---|---|
| `backend/src/plugins/authPlugin.ts` | JWT validation, user provisioning | 01 |
| `backend/src/plugins/tenantPlugin.ts` | Tenant resolution, membership verification, UUID validation | 01, 09 |
| `backend/src/plugins/auditPlugin.ts` | Request lifecycle audit logging | 09 |
| `backend/src/db/prisma.ts` | Prisma singleton, `withTenant()` for RLS | 01, 09 |
| `backend/src/routes/complianceRoutes.ts` | DSAR, consent, breaches, incidents, vendors, dashboard | 10, 12, 13 |
| `backend/src/routes/filesRoutes.ts` | File upload with MIME/extension/quota/virus validation | 05, 08, 09 |
| `backend/src/lib/virusScan.ts` | VirusTotal file scanning | 08 |
| `backend/src/server.ts` | CORS, Helmet, rate limiting, CSP, plugin registration | 09 |
| `backend/prisma/schema.prisma` | All data models including compliance tables | All |
| `policies/SGL.md` | Statutory Guardrail Layer | 03, 04 |
| `policies/INCIDENT_RESPONSE.md` | Incident response procedures | 10, 11 |
| `policies/RISK_MANAGEMENT.md` | Risk management framework | 03 |
| `policies/VENDOR_MANAGEMENT.md` | Vendor management policy | 12 |
| `policies/DATA_RETENTION.md` | Data retention policy | 09 |

### Prisma Models (Compliance-Relevant)

| Model | Table | Purpose |
|---|---|---|
| `AuditLog` | `audit_log` | Immutable audit trail for all mutations |
| `DataSubjectRequest` | `data_subject_requests` | GDPR DSAR tracking |
| `ConsentRecord` | `consent_records` | Consent management with lawful basis |
| `DataBreach` | `data_breaches` | Breach register with notification deadlines |
| `IncidentReport` | `incident_reports` | Security/operational incident tracking |
| `VendorAssessment` | `vendor_assessments` | Third-party risk assessments |
| `DecisionMemo` | `decision_memos` | Agent action governance with risk tiers |
| `TenantMember` | `tenant_members` | RBAC membership with seat types |
| `User` | `users` | Global user identity |
| `Integration` | `integrations` | OAuth token storage (per-tenant) |
| `TokenVault` | `token_vault` | Per-user credential storage |

---

## 5. Assessment Readiness Summary

### HITRUST e1 (Essentials) Readiness

The HITRUST e1 assessment covers a subset of foundational controls. Atlas UX's readiness against the e1 control set:

| Area | Readiness | Notes |
|---|---|---|
| Authentication & access control | Ready with gaps | JWT auth implemented; token revocation (01.b) and RLS (01.c) need completion |
| Audit logging | Ready with gaps | Comprehensive logging in place; hash chain integrity (09.aa.3) needs implementation |
| Incident management | Ready | Full incident and breach lifecycle tracking with automated deadlines |
| Data protection | Ready | Consent management, DSAR processing, right to erasure, data portability all implemented |
| Vendor management | Ready | Vendor assessment tracking with DPA/BAA status and reassessment scheduling |
| Network security | Needs work | CSRF disabled, HSTS not configured, rate limiting is IP-only |
| Input validation | Needs work | Zod coverage is partial; some routes use unvalidated `as any` casts |

### Recommended Remediation Order

1. **Critical:** Deploy database-level RLS (GAP-02) — single most impactful security control
2. **High:** Implement audit log hash chain (GAP-04) — required for tamper detection evidence
3. **High:** Re-enable CSRF protection (GAP-05) — required for state-changing request security
4. **High:** Deploy token revocation (GAP-01) — required for session management
5. **High:** Complete Zod input validation (GAP-08) — required for injection prevention
6. **Medium:** Configure HSTS (GAP-07) — transport security evidence
7. **Medium:** Deploy per-tenant rate limiting (GAP-06) — DoS protection
8. **Medium:** Document BIA (GAP-09) and conduct DR test (GAP-10)
9. **Medium:** Create DPIA template (GAP-11) and data classification policy (GAP-03)
10. **Low:** Formalize change management (GAP-12)

All items 1-5 are addressed in `docs/plans/2026-03-03-compliance-hardening-design.md` and represent the critical path to HITRUST e1 readiness.

### Timeline

| Milestone | Target Date | Status |
|---|---|---|
| Compliance hardening code changes (Sections 1-7) | March 2026 | In progress |
| Policy documents rewritten with code references | March 2026 | In progress |
| Internal readiness review | April 2026 | Not started |
| HITRUST e1 self-assessment | Q2 2026 | Not started |
| External HITRUST assessment (if pursued) | Q3 2026 | Not started |

---

**Contact:**
- **Incidents:** incidents@atlasux.com
- **Security:** security@deadapp.info
- **Privacy:** privacy@deadapp.info

---

Last updated: March 1, 2026
Next review: September 1, 2026
