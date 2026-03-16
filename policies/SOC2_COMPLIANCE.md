# SOC 2 Type II Compliance — Atlas UX

**Document owner:** Atlas UX Engineering
**Last updated:** 2026-03-05
**Next review:** 2026-04-05
**Status:** Pre-audit — hardening phase complete, observation period not started

---

## 1. Framework Overview and Scope

### What is SOC 2?

SOC 2 (Service Organization Control 2) is an audit framework developed by the AICPA. A SOC 2 Type II report evaluates the design and operating effectiveness of controls over a defined observation period (typically 3-12 months). It is organized around five Trust Services Criteria (TSC):

- **Security** (CC1-CC9) — Required for all SOC 2 reports
- **Availability** (A1) — Optional; selected when uptime commitments exist
- **Processing Integrity** (PI1) — Optional; selected when data accuracy matters
- **Confidentiality** (C1) — Optional; selected when data classification applies
- **Privacy** (P1) — Optional; selected when personal data is processed

### Atlas UX Audit Scope

**Systems in scope:**
- Atlas UX web application (React SPA deployed on Vercel)
- Atlas UX API server (Fastify on Render, 4 services: web, email-worker, engine-worker, scheduler)
- PostgreSQL database (Supabase-hosted, connection pooling via PgBouncer)
- Supabase Auth (JWT-based authentication)
- Supabase Storage (`kb_uploads` bucket for tenant files)
- Stripe (payment processing — delegated PCI scope)
- Third-party AI providers (OpenAI, DeepSeek, OpenRouter, Cerebras)

**Trust Services Categories selected:** Security, Availability, Confidentiality, Privacy

**Observation period target:** Not yet started. Hardening phase must complete first.

---

## 2. Trust Services Criteria Mapping

This table maps each Common Criteria (CC) control to actual code in the Atlas UX codebase. Status reflects honest current state as of 2026-03-01.

### CC1 — Control Environment

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| CC1.1 | COSO principle: Commitment to integrity and ethical values | SGL governance DSL defines agent behavioral constraints; EXECUTION_CONSTITUTION.md defines safety guardrails | `policies/SGL.md`, `policies/EXECUTION_CONSTITUTION.md` | **Implemented** |
| CC1.2 | Board of directors oversight | Agent roster includes governance hierarchy (chairman, exec, governors) with approval workflow for high-risk actions | `backend/src/core/engine/engine.ts`, `backend/src/routes/decisionRoutes.ts` | **Partial** — organizational governance docs not formalized |
| CC1.3 | Management establishes structure, authority, and responsibility | Multi-tenant architecture with role-based membership (owner, admin, member); tenant plugin enforces membership | `backend/src/plugins/tenantPlugin.ts` | **Implemented** |
| CC1.4 | Commitment to competence | No formal HR controls — Atlas UX is a small team product | N/A | **Not applicable** (startup stage) |
| CC1.5 | Accountability | Audit log captures every API request with actor, action, status code, IP, and user agent | `backend/src/plugins/auditPlugin.ts` | **Implemented** |

### CC2 — Communication and Information

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| CC2.1 | Information quality for internal control | Structured Prisma schema (30KB+) defines all data models with types, relations, and constraints | `backend/prisma/schema.prisma` | **Implemented** |
| CC2.2 | Internal communication of control objectives | CLAUDE.md and MEMORY.md define mandatory build rules; policy docs define compliance requirements | `CLAUDE.md`, `policies/` | **Partial** — documented for AI tools, not yet formalized for human team |
| CC2.3 | External communication | Privacy policy, terms of service published; GDPR data deletion callbacks for Meta and Google | `src/pages/Privacy.tsx`, `src/pages/Terms.tsx`, `backend/src/routes/metaRoutes.ts`, `backend/src/routes/googleRoutes.ts` | **Implemented** |

### CC3 — Risk Assessment

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| CC3.1 | Specifies suitable objectives | Safety constraints enforced in code: `AUTO_SPEND_LIMIT_USD`, `MAX_ACTIONS_PER_DAY`, daily posting caps, risk-tier approval thresholds | `backend/src/env.ts`, `backend/src/core/engine/engine.ts` | **Implemented** |
| CC3.2 | Identifies and analyzes risks | Compliance hardening design doc maps gaps to framework controls with risk ratings | `docs/plans/2026-03-03-compliance-hardening-design.md` | **Partial** — design doc exists, formal risk register not yet created |
| CC3.3 | Considers potential for fraud | Decision memo approval workflow blocks recurring purchases and spend above threshold; all agent actions require confidence score above `CONFIDENCE_AUTO_THRESHOLD` | `backend/src/routes/decisionRoutes.ts`, `backend/src/core/engine/engine.ts` | **Implemented** |
| CC3.4 | Identifies and assesses changes | N/A — no formal change management board yet | N/A | **Planned** |

### CC4 — Monitoring Activities

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| CC4.1 | Selects and develops monitoring activities | Audit plugin logs every HTTP request/response to `audit_log` table. Compliance dashboard aggregates DSAR, breach, incident, and vendor status | `backend/src/plugins/auditPlugin.ts`, `backend/src/routes/complianceRoutes.ts` (GET `/v1/compliance/dashboard`) | **Implemented** |
| CC4.2 | Evaluates and communicates deficiencies | Overdue DSAR endpoint (GET `/v1/compliance/dsar/overdue`) and breach deadline endpoint (GET `/v1/compliance/breaches/deadlines`) surface compliance gaps | `backend/src/routes/complianceRoutes.ts` | **Implemented** |

### CC5 — Control Activities

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| CC5.1 | Selects and develops control activities | Controls implemented in code as Fastify plugins (auth, tenant, audit, rate limit) rather than manual procedures | `backend/src/server.ts` (plugin registration order) | **Implemented** |
| CC5.2 | Selects and develops technology controls | Helmet for HTTP security headers, `@fastify/rate-limit` for global rate limiting, CORS origin whitelist | `backend/src/server.ts` (lines 149-191) | **Implemented** |
| CC5.3 | Deploys through policies and procedures | Build-before-commit rule enforced in CLAUDE.md; main branch deploys directly to Vercel and Render | `CLAUDE.md` (Mandatory Build Rules section) | **Partial** — no CI/CD pipeline enforcing this automatically |

### CC6 — Logical and Physical Access Controls

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| CC6.1 | Logical access security — authentication | Supabase Auth with JWT bearer tokens. `authPlugin` validates every token via `supabase.auth.getUser()`. Auto-provisions User record on first auth | `backend/src/plugins/authPlugin.ts` | **Implemented** |
| CC6.1 | Session termination and token revocation | `revoked_tokens` table stores SHA-256 hashed JWTs; `POST /v1/auth/logout` adds token to blacklist; `authPlugin` checks blacklist on every request; daily prune job clears expired entries | `backend/src/routes/authRoutes.ts`, `backend/src/plugins/authPlugin.ts`, `backend/prisma/migrations/20260304030000_revoked_tokens/` | **Implemented** |
| CC6.2 | Prior to issuing credentials | Supabase handles credential issuance (email/password signup, email verification). Atlas UX does not store passwords directly | Supabase Auth (external) | **Implemented** (delegated) |
| CC6.3 | Logical access — authorization and tenant isolation | Row-Level Security enabled on 12 PostgreSQL tables via 2 migrations. `withTenant()` helper sets `app.tenant_id` session variable in transactions. Tenant plugin validates membership before granting access | `backend/prisma/migrations/20260228120000_rls_policies/migration.sql`, `backend/prisma/migrations/20260304020000_rls_compliance_tables/migration.sql`, `backend/src/db/prisma.ts` (`withTenant()`), `backend/src/plugins/tenantPlugin.ts` | **Partial** |
| CC6.3 | RLS coverage detail | RLS enabled on 12 tables: `integrations`, `assets`, `jobs`, `distribution_events`, `audit_log`, `kb_documents`, `decision_memos`, `crm_contacts`, `crm_companies`, `consent_records`, `data_subject_requests`, `data_breaches`. **Remaining gap:** `FORCE ROW LEVEL SECURITY` not yet enabled — Prisma connects as superuser, so RLS is advisory until forced | `backend/prisma/migrations/20260228120000_rls_policies/`, `backend/prisma/migrations/20260304020000_rls_compliance_tables/` | **Partial** |
| CC6.5 | Restricts access to information assets | Supabase Storage uses tenant-scoped paths (`tenants/{tenantId}/`). Per-tenant quotas enforced: 500 files, 500MB. File routes validate tenant ownership | `backend/src/routes/filesRoutes.ts` | **Implemented** |
| CC6.6 | System operations — rate limiting | Two-tier rate limiting: global IP-based at 60/min via `@fastify/rate-limit`, plus per-tenant tiered limits via `tenantRateLimit.ts` plugin (auth: 10/min, mutation: 30/min, read: 120/min) with in-memory sliding window counters and automatic stale bucket pruning | `backend/src/server.ts`, `backend/src/plugins/tenantRateLimit.ts` | **Implemented** |
| CC6.6 | CSRF protection | DB-backed synchronizer token pattern using `oauth_state` table (1-hour TTL). Token generated on every response (`x-csrf-token` header), validated on POST/PUT/PATCH/DELETE. Skips webhooks, OAuth callbacks, and public endpoints. Cross-origin compatible (Vercel → Render) | `backend/src/plugins/csrfPlugin.ts`, `backend/src/server.ts` | **Implemented** |
| CC6.7 | Change management — transport security | Helmet with strict CSP (removed `unsafe-inline` from scriptSrc), HSTS with `maxAge: 31536000` and `includeSubDomains: true`, `strict-origin-when-cross-origin` referrer policy | `backend/src/server.ts` | **Implemented** |
| CC6.8 | Prevents or detects unauthorized changes | No file integrity monitoring or infrastructure change detection in place | N/A | **Planned** |

### CC7 — System Operations

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| CC7.1 | Detects and monitors security events | Audit plugin logs every request with method, URL, status code, IP address, user agent, and request ID. Logs stored in `audit_log` PostgreSQL table | `backend/src/plugins/auditPlugin.ts` | **Implemented** |
| CC7.2 | Monitors system components | Compliance dashboard endpoint aggregates open DSARs, breaches, incidents, and vendor review status. Health check at `/health` for Render uptime monitoring | `backend/src/routes/complianceRoutes.ts` (GET `/v1/compliance/dashboard`), `backend/src/server.ts` (line 207) | **Implemented** |
| CC7.2 | Tamper-evident audit logs | Hash-chained audit logs: `prev_hash` and `record_hash` columns on `audit_log`, SHA-256 chain per tenant with in-memory cache and DB fallback, GENESIS_HASH anchor. Verification endpoint at `GET /v1/compliance/audit/verify` walks entire chain and reports total/verified/broken links | `backend/src/lib/auditChain.ts`, `backend/src/plugins/auditPlugin.ts`, `backend/src/routes/complianceRoutes.ts`, `backend/prisma/migrations/20260304010000_audit_hash_chain/` | **Implemented** |
| CC7.3 | Evaluates security events | Incident management system with CRUD operations, severity levels, categories, assignment, root cause analysis, and resolution tracking | `backend/src/routes/complianceRoutes.ts` (incident endpoints) | **Implemented** |
| CC7.4 | Responds to security incidents | Breach management with GDPR 72-hour authority notification deadline and HIPAA 60-day individual notification deadline. Deadline monitoring endpoint surfaces urgent items | `backend/src/routes/complianceRoutes.ts` (breach endpoints) | **Implemented** |
| CC7.5 | Identifies and communicates deficiencies | Agent Watcher provides real-time audit log polling (every 4s). Overdue DSAR and breach deadline endpoints surface compliance gaps | `src/components/AgentWatcher.tsx`, `backend/src/routes/complianceRoutes.ts` | **Partial** — monitoring exists, no automated alerting |

### CC8 — Change Management

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| CC8.1 | Change management process | Build-before-commit rule in CLAUDE.md. Prisma migrations for schema changes. Git-based version control with main branch as production | `CLAUDE.md`, `backend/prisma/migrations/` | **Partial** — no formal change advisory board or approval workflow for infrastructure changes |

### CC9 — Risk Mitigation

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| CC9.1 | Identifies and assesses vendor risk | Vendor assessment system with risk levels, compliance certifications, DPA tracking, BAA tracking, and annual reassessment scheduling | `backend/src/routes/complianceRoutes.ts` (vendor endpoints) | **Implemented** |
| CC9.2 | Monitors vendor compliance | Vendor due-for-reassessment endpoint surfaces overdue vendor reviews. Dashboard includes vendor management status | `backend/src/routes/complianceRoutes.ts` (GET `/v1/compliance/vendors/due`) | **Implemented** |

### A1 — Availability

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| A1.1 | Maintains availability commitments | Health check endpoint at `/health`. Render monitors service uptime. No formal SLA document yet | `backend/src/server.ts` (line 207) | **Partial** — monitoring exists, no SLA |
| A1.2 | Environmental protections | Delegated to Render (compute) and Supabase (database). No self-hosted infrastructure | External providers | **Delegated** |

### C1 — Confidentiality

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| C1.1 | Identifies confidential information | Tenant isolation at application layer (tenantPlugin) and database layer (RLS). Integration tokens stored per-tenant with nullable access/refresh tokens | `backend/src/plugins/tenantPlugin.ts`, `backend/prisma/schema.prisma` | **Partial** — no formal data classification scheme |
| C1.2 | Protects confidential information | TLS termination handled by Render (HTTPS enforced). Database connections via Supabase use TLS. Supabase Storage uses signed URLs for file access | External providers | **Implemented** (delegated) |

### P1 — Privacy

| Control | Description | Implementation | File Path | Status |
|---------|-------------|----------------|-----------|--------|
| P1.1 | Privacy notice and consent | GDPR consent management with 6 lawful bases, 5 consent purposes. Grant and withdraw consent with full audit logging | `backend/src/routes/complianceRoutes.ts` (consent endpoints) | **Implemented** |
| P1.2 | Data subject rights | Full DSAR workflow: access, erasure, portability, restriction, rectification, objection. 30-day deadline enforcement. Data export (Article 20) and data erasure (Article 17) endpoints | `backend/src/routes/complianceRoutes.ts` (DSAR endpoints) | **Implemented** |

---

## 3. Evidence References

### API Endpoints (all under `https://atlasux.cloud/v1/`)

| Endpoint | Method | Purpose | SOC 2 Control |
|----------|--------|---------|---------------|
| `/compliance/dashboard` | GET | Unified compliance status across all frameworks | CC4.1, CC7.2 |
| `/compliance/dsar` | GET, POST | List and create data subject access requests | P1.2 |
| `/compliance/dsar/:id` | PATCH | Update DSAR status and response | P1.2 |
| `/compliance/dsar/:email/export` | GET | Export all user data (Right to Portability) | P1.2 |
| `/compliance/dsar/:email/erase` | DELETE | Erase user data (Right to Erasure) | P1.2 |
| `/compliance/dsar/overdue` | GET | Surface overdue DSAR requests | CC4.2 |
| `/compliance/consent/:email` | GET | List consent records for a subject | P1.1 |
| `/compliance/consent` | POST | Grant consent with lawful basis | P1.1 |
| `/compliance/consent/:email/:purpose` | DELETE | Withdraw consent | P1.1 |
| `/compliance/breaches` | GET, POST | List and report data breaches | CC7.4 |
| `/compliance/breaches/:id` | PATCH | Update breach status, root cause, remediation | CC7.4 |
| `/compliance/breaches/deadlines` | GET | Breaches approaching notification deadlines | CC7.4, CC4.2 |
| `/compliance/incidents` | GET, POST | List and create security incidents | CC7.3 |
| `/compliance/incidents/:id` | PATCH | Update incident status and resolution | CC7.3 |
| `/compliance/vendors` | GET, POST | List and create/update vendor risk assessments | CC9.1 |
| `/compliance/vendors/due` | GET | Vendors due for reassessment | CC9.2 |
| `/health` | GET | Service health check | A1.1 |
| `/audit` | GET | Query audit log entries | CC7.1 |

### Key Source Files

| File | Purpose |
|------|---------|
| `backend/src/plugins/auditPlugin.ts` | Automatic audit logging on every HTTP response |
| `backend/src/plugins/authPlugin.ts` | JWT validation via Supabase Auth |
| `backend/src/plugins/tenantPlugin.ts` | Tenant resolution, membership verification, usage metering |
| `backend/src/plugins/csrfPlugin.ts` | CSRF protection (exists but currently disabled) |
| `backend/src/db/prisma.ts` | Prisma singleton + `withTenant()` RLS helper |
| `backend/src/routes/complianceRoutes.ts` | DSAR, consent, breach, incident, vendor endpoints |
| `backend/src/routes/authRoutes.ts` | Post-login tenant provisioning |
| `backend/src/server.ts` | Helmet, CORS, rate limiting, plugin registration |
| `backend/prisma/migrations/20260228120000_rls_policies/migration.sql` | RLS enablement on 9 tables |
| `backend/prisma/schema.prisma` | Full data model (30KB+) |
| `policies/SGL.md` | System Governance Language — agent behavioral constraints |
| `policies/EXECUTION_CONSTITUTION.md` | Safety guardrails for autonomous agent execution |

---

## 4. Gap Analysis and Remediation Timeline

### Critical Gaps (must fix before audit observation period)

| Gap | SOC 2 Control | Risk | Remediation | Target Date |
|-----|---------------|------|-------------|-------------|
| No hash-chained audit logs | CC7.2 | Tamper detection impossible — auditor cannot prove log integrity | Add `prev_hash`/`record_hash` columns to `audit_log`; SHA-256 chain per tenant; verification endpoint | 2026-03-10 |
| CSRF protection disabled | CC6.6 | State-changing request forgery possible on mutating endpoints | Rewrite `csrfPlugin.ts` to DB-backed synchronizer token pattern (cross-origin compatible); re-enable in `server.ts` | 2026-03-10 |
| RLS incomplete (9 of 12 tables) | CC6.3 | `consent_records`, `data_subject_requests`, `data_breaches` lack database-level tenant isolation | Add RLS policies to remaining 3 tables in new migration | 2026-03-07 |
| RLS not forced | CC6.3 | Superuser connections bypass RLS entirely — single point of failure | Enable `FORCE ROW LEVEL SECURITY` after verifying all routes use `withTenant()` | 2026-03-14 |
| No session termination | CC6.1 | Cannot revoke compromised JWT tokens; sessions persist until Supabase token expiry | Add `revoked_tokens` table, logout endpoint, blacklist check in authPlugin | 2026-03-10 |
| No HSTS header | CC6.7 | Transport security not provable to auditor; browser may downgrade to HTTP | Add explicit HSTS config to Helmet: `maxAge: 31536000, includeSubDomains: true` | 2026-03-05 |
| No per-tenant rate limiting | CC6.6 | One tenant can exhaust rate limits for all tenants (shared IP pool on Render) | Add `rate_limit_buckets` table and `tenantRateLimit.ts` plugin with tiered limits | 2026-03-14 |

### Medium Gaps (should fix during observation period)

| Gap | SOC 2 Control | Risk | Remediation | Target Date |
|-----|---------------|------|-------------|-------------|
| No input validation on some routes | CC5.2, CC6.6 | Routes casting `req.body as any` bypass type safety; potential injection | Add Zod schemas to all routes currently using `as any` body casts | 2026-03-21 |
| No automated alerting | CC7.5 | Overdue DSARs and breach deadlines surfaced only when endpoint is called | Add scheduled check (cron or engine loop) that sends alerts for overdue items | 2026-03-28 |
| No CI/CD pipeline enforcement | CC5.3, CC8.1 | Build-before-commit is a documented rule but not enforced by tooling | Add GitHub Actions: lint, type-check, build on PR; block merge on failure | 2026-03-28 |
| No formal risk register | CC3.2 | Risk assessment exists as design doc, not as a maintained register | Create and maintain a risk register with periodic review cadence | 2026-04-01 |

### Low Gaps (acceptable for initial audit, improve over time)

| Gap | SOC 2 Control | Risk | Remediation | Target Date |
|-----|---------------|------|-------------|-------------|
| No file integrity monitoring | CC6.8 | No detection of unauthorized changes to deployed code | Evaluate infrastructure monitoring tools (e.g., Render deploy hooks, git SHA verification) | 2026-Q2 |
| No formal SLA document | A1.1 | Availability commitment exists in practice but not documented | Draft and publish SLA based on Render and Supabase uptime guarantees | 2026-Q2 |
| No data classification scheme | C1.1 | Confidential data identified implicitly by table structure, not formally classified | Create data classification policy document | 2026-Q2 |
| CSP allows `unsafe-inline` for scripts | CC6.7 | Weaker XSS mitigation than a nonce-based CSP | Audit frontend for inline scripts; implement CSP nonce or hash strategy | 2026-Q2 |

---

## 5. Current Honest Status

### Summary

Atlas UX has real, functioning compliance infrastructure — not placeholder documentation. The controls that exist are production code handling real requests. However, several critical gaps remain that would fail a SOC 2 audit today.

### What is genuinely implemented

- **Audit logging** — Every HTTP request/response is logged to `audit_log` with actor, action, status, IP, user agent, and request ID. The audit plugin never blocks requests on failure (non-fatal) and auto-retries after schema errors. This is real code in production.
- **Authentication** — JWT-based via Supabase Auth. Every authenticated request is validated by calling `supabase.auth.getUser()`. User records are auto-provisioned on first login.
- **Tenant isolation (application layer)** — `tenantPlugin` resolves tenant from headers, validates membership via `tenantMember` table, and hard-rejects unauthorized access with 403.
- **Tenant isolation (database layer)** — RLS policies on 9 tables using `current_setting('app.tenant_id')`. The `withTenant()` helper wraps queries in a transaction with `SET LOCAL`.
- **CORS** — Origin whitelist restricted to `atlasux.cloud` and `www.atlasux.cloud` in production, with localhost allowed only in development.
- **Rate limiting** — Global IP-based rate limit of 60 requests/minute.
- **CSP** — Content Security Policy via Helmet with restrictive directives (no frames, no objects, limited connect-src).
- **DSAR management** — Full lifecycle: create, track, export user data, erase user data. 30-day deadline enforcement.
- **Consent management** — Grant and withdraw consent with lawful basis tracking, audit logging, and IP/user-agent capture.
- **Breach management** — Report, track, and resolve breaches with GDPR 72-hour and HIPAA 60-day deadline calculations.
- **Incident management** — Create, assign, track, and resolve security incidents with severity, category, root cause, and lessons learned.
- **Vendor risk management** — Assess vendors with risk levels, compliance certifications, DPA/BAA tracking, and annual reassessment scheduling.
- **Safety guardrails** — Recurring purchases blocked by default, daily action and posting caps enforced, spend approval required above threshold, confidence score gating on autonomous actions.

### What does not exist yet

- **Hash-chained audit logs** — No `prev_hash` or `record_hash` columns. Audit log integrity is not cryptographically verifiable. The `auditChain.ts` library does not exist yet.
- **Session termination** — No logout endpoint. No `revoked_tokens` table. No way to invalidate a compromised JWT before its natural expiry.
- **Per-tenant rate limiting** — No `tenantRateLimit.ts` plugin. No `rate_limit_buckets` table. One tenant can consume the entire global rate limit budget.
- **CSRF protection** — The plugin exists in code but is explicitly disabled in `server.ts` (line 199). The double-submit cookie pattern does not work cross-origin (Vercel frontend to Render backend). The planned DB-backed synchronizer pattern has not been implemented.
- **HSTS** — Not configured in Helmet. Render handles TLS termination, but the HSTS header is not sent, so browsers are not instructed to enforce HTTPS.
- **Complete RLS coverage** — 9 of 12 planned tables have RLS. Missing: `consent_records`, `data_subject_requests`, `data_breaches`. RLS is also not forced (superuser bypass still possible).
- **CI/CD enforcement** — No automated build/test pipeline. The build-before-commit rule is a documented policy, not a technical control.
- **Automated compliance alerting** — Overdue items are surfaced by API endpoints, but no proactive notifications are sent.

### Audit Readiness Assessment

| Category | Readiness | Notes |
|----------|-----------|-------|
| Security (CC1-CC9) | **~60%** | Authentication, tenant isolation, and audit logging are solid. Critical gaps in session management, CSRF, HSTS, and audit log integrity |
| Availability (A1) | **~30%** | Health check exists; no SLA, no disaster recovery testing, no documented RTO/RPO |
| Confidentiality (C1) | **~50%** | Tenant isolation works; no formal data classification; encryption delegated to providers |
| Privacy (P1) | **~80%** | DSAR, consent, erasure, and portability all functional. Missing automated deadline alerting |

**Bottom line:** Atlas UX cannot pass a SOC 2 Type II audit today. The critical gaps in Section 4 must be remediated before beginning an observation period. Estimated time to audit readiness: 4-6 weeks of focused hardening work.

---

## Appendix: Infrastructure Responsibility Matrix

| Component | Provider | SOC 2 Report Available | Atlas UX Responsibility |
|-----------|----------|----------------------|------------------------|
| Compute (API) | Render | Yes (SOC 2 Type II) | Application-level controls, rate limiting, input validation |
| Database | Supabase (PostgreSQL) | Yes (SOC 2 Type II) | RLS policies, tenant isolation, schema design |
| Authentication | Supabase Auth | Yes (via Supabase) | Token validation, session management, user provisioning |
| File Storage | Supabase Storage | Yes (via Supabase) | Tenant-scoped paths, quota enforcement, signed URLs |
| Frontend Hosting | Vercel | Yes (SOC 2 Type II) | CSP headers, build security, dependency management |
| Payments | Stripe | Yes (PCI DSS Level 1) | No cardholder data stored; Stripe Checkout used exclusively |
| AI Providers | OpenAI, DeepSeek, etc. | Varies | Data sent to AI providers is tenant-scoped; no PII sent by policy |
