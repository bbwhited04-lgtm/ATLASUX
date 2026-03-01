# HIPAA Compliance Framework — Atlas UX

**Last updated:** 2026-03-01
**Next review:** 2026-06-01
**Document owner:** Atlas UX Engineering

---

## 1. Framework Overview and Applicability

### What HIPAA Requires

The Health Insurance Portability and Accountability Act (1996), the HITECH Act (2009), and the Omnibus Rule (2013) impose requirements on Covered Entities and their Business Associates for the protection of Protected Health Information (PHI). The HIPAA Security Rule (45 CFR Part 164, Subparts A and C) mandates three categories of safeguards: Administrative, Technical, and Physical.

### Atlas UX Applicability

Atlas UX is an AI employee productivity platform. It is **not** a healthcare application and does **not** currently process, store, or transmit PHI as a core function. However, tenants operating in healthcare verticals may introduce PHI into the platform through:

- CRM contact records (`crm_contacts` table)
- Agent-processed communications (email, Telegram, Teams)
- Knowledge base documents (`kb_documents` table)
- Audit log entries containing user-supplied content

Atlas UX would function as a **Business Associate** if a Covered Entity tenant uses the platform to handle PHI. This document maps the HIPAA Security Rule requirements to the actual technical controls implemented in the Atlas UX codebase, with honest assessments of what exists, what is partial, and what is missing.

---

## 2. Safeguard Mapping Table

### Administrative Safeguards (45 CFR 164.308)

| HIPAA Section | Safeguard | Implementation | File Path | Status |
|---|---|---|---|---|
| 164.308(a)(1)(i) | Security Management Process — Risk Analysis | Compliance design doc identifies 7 gap areas with framework mappings | `docs/plans/2026-03-03-compliance-hardening-design.md` | **Partial** — design doc exists, formal risk analysis not yet conducted |
| 164.308(a)(1)(ii)(C) | Security Management Process — Sanction Policy | Not documented | N/A | **Not Implemented** |
| 164.308(a)(2) | Assigned Security Responsibility | No designated HIPAA Security Officer in code or org chart | N/A | **Not Implemented** |
| 164.308(a)(3) | Workforce Security — Authorization & Supervision | Tenant membership enforced via `tenantPlugin.ts`: authenticated users must be a `tenantMember` to access any tenant's data. Role field (`owner`, etc.) exists on `tenant_members` table. Non-members receive HTTP 403 | `backend/src/plugins/tenantPlugin.ts` (lines 42-51) | **Implemented** (technical control); **Not Implemented** (workforce policy) |
| 164.308(a)(3)(ii)(C) | Workforce Security — Termination Procedures | No automated access revocation on termination. No `revoked_tokens` table or logout endpoint exists | `backend/src/plugins/authPlugin.ts` | **Not Implemented** |
| 164.308(a)(4) | Information Access Management | Role-based access via `tenantMember.role` field; API usage metered per-user via `meterApiCall()` in `tenantPlugin.ts` | `backend/src/plugins/tenantPlugin.ts` (line 60), `backend/src/lib/usageMeter.ts` | **Partial** — role exists but no fine-grained permission matrix |
| 164.308(a)(5) | Security Awareness and Training | Not implemented | N/A | **Not Implemented** |
| 164.308(a)(6) | Security Incident Procedures | Incident report CRUD: `POST/GET/PATCH /v1/compliance/incidents`. Severity levels (p0-p3), categories (security, data_integrity, etc.), resolution tracking | `backend/src/routes/complianceRoutes.ts` (lines 496-592) | **Implemented** (technical tooling); **Not Implemented** (procedural response plan) |
| 164.308(a)(7) | Contingency Plan | Supabase provides automated PostgreSQL backups. No documented disaster recovery or emergency mode procedures | N/A | **Partial** — vendor backup only |
| 164.308(a)(8) | Evaluation | Compliance dashboard endpoint: `GET /v1/compliance/dashboard` aggregates DSAR, breach, incident, and vendor status | `backend/src/routes/complianceRoutes.ts` (lines 694-745) | **Partial** — dashboard exists, no formal evaluation schedule |
| 164.308(b)(1) | Business Associate Contracts | Vendor assessment system tracks BAA status per vendor (`has_baa` boolean on `vendor_assessments` table). CRUD at `POST/GET /v1/compliance/vendors` | `backend/src/routes/complianceRoutes.ts` (lines 599-688), `backend/prisma/schema.prisma` (VendorAssessment model, line 1188) | **Partial** — tracking exists, no actual BAA templates or execution |

### Technical Safeguards (45 CFR 164.312)

| HIPAA Section | Safeguard | Implementation | File Path | Status |
|---|---|---|---|---|
| **164.312(a)(1)** | **Access Control** — Unique User Identification | Supabase Auth issues per-user JWTs. `authPlugin.ts` validates bearer tokens via `supabase.auth.getUser(token)`, extracts unique `userId` and `email`. Auto-provisions `User` record on first auth | `backend/src/plugins/authPlugin.ts` (lines 15-51) | **Implemented** |
| 164.312(a)(1) | Access Control — Row-Level Security | RLS enabled on 9 tables via migration `20260228120000`: `integrations`, `assets`, `jobs`, `distribution_events`, `audit_log`, `kb_documents`, `decision_memos`, `crm_contacts`, `crm_companies`. Policy: `tenant_id = current_setting('app.tenant_id')::uuid`. Session variable set by `withTenant()` helper in Prisma transactions | `backend/prisma/migrations/20260228120000_rls_policies/migration.sql`, `backend/src/db/prisma.ts` (lines 30-41) | **Partial** — RLS enabled but not forced (superuser bypass still active, Phase 2 only). Design doc targets 12 tables; 3 missing: `consent_records`, `data_subject_requests`, `data_breaches` |
| 164.312(a)(1) | Access Control — Tenant Isolation (Application Layer) | `tenantPlugin.ts` resolves `tenantId` from `x-tenant-id` header or query param. Validates UUID format (regex). Verifies user membership via `tenantMember.findUnique()`. Rejects non-members with 403 | `backend/src/plugins/tenantPlugin.ts` (lines 25-63) | **Implemented** |
| 164.312(a)(1) | Access Control — Emergency Access | Not implemented. No break-glass procedure | N/A | **Not Implemented** |
| 164.312(a)(2)(iii) | Access Control — Automatic Logoff | Not implemented. No session timeout or idle detection. Supabase JWT expiry is the only session limit. No `revoked_tokens` table, no `POST /v1/auth/logout` endpoint | `backend/src/plugins/authPlugin.ts` — no blacklist check present | **Not Implemented** — planned in compliance hardening design (Section 6) |
| **164.312(b)** | **Audit Controls** | `auditPlugin.ts` logs every HTTP request/response to `audit_log` table: method, URL, status code, actor user ID, IP address, user agent, request ID. Uses `onSend` hook (fires after response). Two-attempt strategy for schema compatibility. Auto-pauses for 10s on schema errors, never permanently disables | `backend/src/plugins/auditPlugin.ts` (lines 18-87) | **Implemented** (basic logging) |
| 164.312(b) | Audit Controls — Hash-Chained Integrity | Not implemented. `audit_log` table has no `prev_hash` or `record_hash` columns. Records can be modified or deleted without detection | `backend/prisma/schema.prisma` (AuditLog model, line 173) | **Not Implemented** — planned in compliance hardening design (Section 1) |
| 164.312(b) | Audit Controls — Per-Mutation Logging | Compliance routes log every DSAR, consent, breach, incident, and vendor mutation to `audit_log` with specific action codes (`DSAR_CREATED`, `BREACH_REPORTED`, `CONSENT_GRANTED`, `DATA_ERASURE`, etc.) | `backend/src/routes/complianceRoutes.ts` — audit log calls throughout | **Implemented** |
| **164.312(c)(1)** | **Integrity** — Input Validation | Compliance routes validate request bodies inline (e.g., `requestType` must be one of 6 values, `lawfulBasis` must be one of 6 values). However, most routes outside compliance use `req.body as any` without Zod schemas | `backend/src/routes/complianceRoutes.ts` (lines 40-46, 270-275) | **Partial** — compliance routes validated, most other routes unvalidated |
| 164.312(c)(1) | Integrity — Data Integrity Verification | No cryptographic hash verification on stored data. No write-once storage for audit logs | N/A | **Not Implemented** |
| **164.312(d)** | **Person or Entity Authentication** | JWT-based authentication via Supabase Auth. `authPlugin.ts` validates every request's bearer token by calling `supabase.auth.getUser()`. Invalid/missing tokens return 401 | `backend/src/plugins/authPlugin.ts` (lines 19-26) | **Implemented** (authentication) |
| 164.312(d) | Person Authentication — Session Termination / Token Blacklist | Not implemented. No `revoked_tokens` table. No logout endpoint. No token blacklist check in `authPlugin`. Compromised tokens cannot be revoked server-side | `backend/src/plugins/authPlugin.ts` — no revocation logic | **Not Implemented** — planned in compliance hardening design (Section 6) |
| **164.312(e)(1)** | **Transmission Security** — Encryption in Transit | Render terminates TLS for all inbound HTTPS connections. CORS restricts origins to `atlasux.cloud` + localhost (dev). `@fastify/helmet` is registered but **HSTS is not explicitly configured** (Helmet defaults to HSTS enabled with `maxAge: 15552000` / 180 days, but `includeSubDomains` is not explicitly set) | `backend/src/server.ts` (lines 169-189) | **Partial** — TLS via Render, Helmet defaults, but no explicit HSTS `maxAge: 31536000` or `includeSubDomains: true` as required |
| 164.312(e)(1) | Transmission Security — CORS | Origin allowlist: `https://www.atlasux.cloud`, `https://atlasux.cloud`. Localhost added only in non-production. Credentials enabled. Allowed headers explicitly listed including `Authorization`, `x-tenant-id`, `x-csrf-token` | `backend/src/server.ts` (lines 140-167) | **Implemented** |

### Physical Safeguards (45 CFR 164.310)

| HIPAA Section | Safeguard | Implementation | Status |
|---|---|---|---|
| 164.310(a)(1) | Facility Access Controls | N/A — Atlas UX is fully cloud-hosted. No on-premises data centers or physical servers | **Delegated to Cloud Providers** |
| 164.310(b) | Workstation Use | N/A — No company-issued workstations with PHI access | **Not Applicable** |
| 164.310(c) | Workstation Security | N/A | **Not Applicable** |
| 164.310(d)(1) | Device and Media Controls | N/A — All data resides in Supabase (PostgreSQL) and Render (application hosting) | **Delegated to Cloud Providers** |

**Cloud provider responsibility matrix:**

| Provider | Service | Relevant Certifications | BAA Available |
|---|---|---|---|
| Supabase | PostgreSQL database, Auth, Storage | SOC 2 Type II | Yes (on Pro plan and above) |
| Render | Application hosting, TLS termination | SOC 2 Type II | Inquiry required |
| Vercel | Frontend static hosting | SOC 2 Type II | Inquiry required |
| Stripe | Payment processing | PCI DSS Level 1, SOC 2 | Yes |
| OpenAI | AI inference | SOC 2 Type II | Yes (via API DPA) |

---

## 3. Breach Notification Procedures

### Data Breach Register

Atlas UX maintains a programmatic breach register via the `data_breaches` table (Prisma model `DataBreach`, mapped to `data_breaches`).

**Schema** (`backend/prisma/schema.prisma`, line 1128):
- `severity`: p0_critical, p1_high, p2_medium, p3_low
- `status`: detected, contained, eradicated, recovered, closed
- `data_types_affected`: array — pii, phi, payment, credentials, internal
- `individuals_affected`: integer count
- Timestamps: `detected_at`, `contained_at`, `notify_authority_by`, `authority_notified_at`, `notify_individuals_by`, `individuals_notified_at`
- `root_cause`, `remediation_steps`, `post_mortem_url`

### Notification Deadlines (Computed in Code)

The breach creation endpoint (`POST /v1/compliance/breaches`) in `backend/src/routes/complianceRoutes.ts` (lines 369-427) automatically computes two deadlines:

```
GDPR:  notifyAuthorityBy    = detectedAt + 72 hours
HIPAA: notifyIndividualsBy  = detectedAt + 60 days
```

These are stored as database timestamps and returned in the API response under `deadlines`.

### Deadline Monitoring

`GET /v1/compliance/breaches/deadlines` (lines 468-489) returns breaches where:
- Authority notification is due within 24 hours and has not been sent
- Individual notification deadline exists and has not been sent

The compliance dashboard (`GET /v1/compliance/dashboard`, lines 694-745) aggregates missed deadlines into the `breachManagement.missedDeadlines` count.

### HIPAA-Specific Requirements (45 CFR 164.404-408)

| Requirement | Implementation | Status |
|---|---|---|
| Individual notification within 60 calendar days of discovery | `notify_individuals_by` computed and stored at breach creation | **Implemented** (tracking); **Not Implemented** (actual notification delivery) |
| Written notice via first-class mail or email (if consented) | No automated notification delivery mechanism | **Not Implemented** |
| HHS notification for breaches affecting 500+ individuals | `individuals_affected` field tracked; no automated HHS submission | **Partial** (data captured, manual submission required) |
| Media notification for 500+ in a single state/jurisdiction | No geographic tracking of affected individuals | **Not Implemented** |
| Breach log maintenance (for <500 individual breaches) | `data_breaches` table with full history and audit trail | **Implemented** |
| Annual HHS report for sub-500 breaches | No automated annual reporting | **Not Implemented** |

### Breach Lifecycle Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/v1/compliance/breaches` | Report a new breach, compute deadlines |
| `GET` | `/v1/compliance/breaches` | List all breaches for the tenant |
| `PATCH` | `/v1/compliance/breaches/:id` | Update status, root cause, remediation, mark notifications sent |
| `GET` | `/v1/compliance/breaches/deadlines` | List breaches approaching notification deadlines |

All mutations are audit-logged with action codes `BREACH_REPORTED` and `BREACH_UPDATED`.

---

## 4. Business Associate Agreement Considerations

### When a BAA is Required

If a Covered Entity tenant uses Atlas UX to create, receive, maintain, or transmit PHI, Atlas UX would be a Business Associate under 45 CFR 160.103. A BAA would be required before the tenant stores any PHI in the platform.

### Current State

Atlas UX does not currently execute BAAs with tenants. The vendor assessment system tracks whether upstream vendors (Supabase, Render, OpenAI, etc.) have BAAs available via the `has_baa` field on `vendor_assessments`, but no downstream BAA template exists for Atlas UX tenants.

### Vendor BAA Tracking

The `VendorAssessment` model (`backend/prisma/schema.prisma`, line 1188) includes:
- `has_baa` (Boolean) — whether the vendor offers a BAA
- `has_dpa` (Boolean) — whether a Data Processing Agreement is in place
- `compliance_certs` (String[]) — vendor's certifications (soc2, hipaa, gdpr, pci_dss, iso27001)
- `data_access` (String[]) — what data types the vendor can access (pii, phi, payment, credentials, usage_data, none)

Vendor assessment CRUD is available at `POST/GET /v1/compliance/vendors` with reassessment due tracking at `GET /v1/compliance/vendors/due`.

### What Would Be Needed for BAA Readiness

1. A BAA template document for execution with Covered Entity tenants
2. Confirmed BAAs with all upstream vendors that may process PHI (Supabase, Render, OpenAI at minimum)
3. Encryption of PHI at rest (Supabase provides this via PostgreSQL encryption; needs explicit documentation)
4. Breach notification chain: Atlas UX must notify the Covered Entity within a contractually agreed timeframe if a breach occurs
5. PHI return/destruction procedures upon BAA termination

---

## 5. Gap Analysis and Remediation Plan

### Critical Gaps (Must Address Before Handling PHI)

| Gap | HIPAA Section | Risk | Planned Remediation | Design Doc Reference |
|---|---|---|---|---|
| No session termination or token blacklist | 164.312(d) | Compromised JWT tokens cannot be revoked. An attacker with a stolen token has access until Supabase expiry | Add `revoked_tokens` table, `POST /v1/auth/logout` endpoint, blacklist check in `authPlugin.ts` | Section 6 |
| No hash-chained audit logs | 164.312(b) | Audit records can be silently modified or deleted. Tamper detection is impossible | Add `prev_hash` and `record_hash` columns to `audit_log`, SHA-256 chain computation on insert, verification endpoint | Section 1 |
| RLS not forced (superuser bypass) | 164.312(a)(1) | Prisma connects as superuser, so RLS policies are advisory only unless `FORCE ROW LEVEL SECURITY` is applied. A code bug that skips `withTenant()` leaks cross-tenant data | Phase 3: add `FORCE ROW LEVEL SECURITY` on all RLS tables, create limited-privilege Prisma connection role | Section 3 |
| 3 compliance tables missing RLS | 164.312(a)(1) | `consent_records`, `data_subject_requests`, `data_breaches` have no RLS policies. Application-layer `tenantId` filtering is the only barrier | Add RLS policies to these 3 tables in next migration | Section 3 |
| No CSRF protection active | 164.312(a)(1) | `csrfPlugin.ts` exists but is commented out in `server.ts` (line 199). CORS origin restriction is the only CSRF defense. Double-submit cookie pattern does not work cross-origin (Vercel to Render) | Rewrite to DB-backed synchronizer token pattern per design doc | Section 2 |
| No BAA template or execution process | 164.308(b)(1) | Cannot legally handle PHI without executed BAAs | Draft BAA template, establish execution workflow | N/A |

### Moderate Gaps (Should Address for Compliance Posture)

| Gap | HIPAA Section | Risk | Planned Remediation | Design Doc Reference |
|---|---|---|---|---|
| HSTS not explicitly configured | 164.312(e)(1) | Relies on Helmet defaults (180-day max-age). Should be 1 year with `includeSubDomains` | Update Helmet config in `server.ts` | Section 7 |
| Most routes lack input validation | 164.312(c)(1) | Routes outside `complianceRoutes.ts` use `req.body as any`. Injection and data integrity risks | Add Zod schemas to all route handlers | Section 5 |
| No per-tenant rate limiting | 164.312(a)(1) | Rate limiting is IP-based only (`@fastify/rate-limit`, 60 req/min global). A malicious tenant can exhaust quotas | Add tenant-aware rate limit plugin backed by `rate_limit_buckets` table | Section 4 |
| No automated breach notifications | 164.404 | Deadlines are tracked but notifications must be sent manually | Build notification delivery (email to affected individuals, HHS submission form) | N/A |
| No encryption at rest documentation | 164.312(a)(2)(iv) | Supabase PostgreSQL uses disk-level encryption, but this is not documented or verified | Document Supabase encryption configuration, verify at-rest encryption | N/A |

### Policy/Process Gaps (Organizational)

| Gap | HIPAA Section | Impact |
|---|---|---|
| No designated Security Officer | 164.308(a)(2) | Required before handling PHI |
| No workforce security training | 164.308(a)(5) | All staff with potential PHI access must complete HIPAA training |
| No sanction policy | 164.308(a)(1)(ii)(C) | Must document consequences for policy violations |
| No contingency/disaster recovery plan | 164.308(a)(7) | Must document backup, recovery, and emergency mode procedures |
| No formal risk analysis | 164.308(a)(1)(i) | Must conduct and document comprehensive risk assessment annually |

---

## 6. Summary of Implemented Controls

The following HIPAA-relevant technical controls are verifiably implemented in the Atlas UX codebase:

1. **Per-user authentication** via Supabase JWT with server-side validation (`authPlugin.ts`)
2. **Multi-tenant data isolation** via application-layer `tenantPlugin.ts` (membership verification, UUID validation) and database-layer RLS policies on 9 tables (`migration 20260228120000`)
3. **Comprehensive audit logging** of all API requests via `auditPlugin.ts` (`onSend` hook, never permanently disabled)
4. **Per-mutation audit trail** in compliance routes with specific action codes
5. **Breach register** with automatic GDPR 72-hour and HIPAA 60-day deadline computation
6. **Incident management** system with severity/category tracking and resolution workflow
7. **Vendor risk assessment** tracking with BAA and DPA status fields
8. **DSAR handling** with 30-day GDPR deadline tracking, data export, and erasure support
9. **Consent management** with purpose-specific tracking and withdrawal support
10. **CORS origin restriction** limiting API access to `atlasux.cloud` domains
11. **TLS encryption in transit** via Render's TLS termination
12. **CSP headers** via `@fastify/helmet` restricting script, image, and connection sources

---

## 7. Honest Assessment

**Atlas UX is not currently HIPAA-compliant.** The platform has strong multi-tenant isolation, comprehensive audit logging, and a mature compliance operations toolkit (breach register, DSAR, consent, vendor tracking). However, it is missing several mandatory HIPAA Security Rule requirements:

- No ability to revoke compromised sessions (164.312(d))
- No tamper-evident audit log chain (164.312(b))
- No designated Security Officer (164.308(a)(2))
- No BAA execution capability (164.308(b)(1))
- No formal risk analysis (164.308(a)(1)(i))

The compliance hardening design (`docs/plans/2026-03-03-compliance-hardening-design.md`) addresses the technical gaps in Sections 1, 3, 5, 6, and 7. Organizational/policy gaps (Security Officer, training, BAA templates, risk analysis) are not covered by the design doc and require separate action.

**Recommendation:** Do not accept tenants with PHI until the compliance hardening plan is executed and organizational controls are established.

---

*This document reflects the actual state of the Atlas UX codebase as of 2026-03-01. All file paths and endpoint references have been verified against the source code. Status assessments are intentionally conservative — a control is marked "Implemented" only when the code demonstrably enforces it.*
