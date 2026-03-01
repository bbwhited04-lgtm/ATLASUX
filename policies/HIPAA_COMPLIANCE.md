# HIPAA Compliance Framework — Atlas UX

**Last updated:** 2026-03-05
**Next review:** 2026-06-05
**Document owner:** Atlas UX Engineering
**HIPAA Security Officer:** Billy Whited, DEAD APP CORP / THE DEAD APP CORP TRUST
**Contact:** 510 E Washington Street, Vandalia, MO 63382 | (816) 747-6150

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
| 164.308(a)(2) | Assigned Security Responsibility | Billy Whited designated as HIPAA Security Officer and Privacy Officer. Contact: 510 E Washington Street, Vandalia, MO 63382, (816) 747-6150. Entity: DEAD APP CORP / THE DEAD APP CORP TRUST | `policies/HIPAA_COMPLIANCE.md` (document header) | **Implemented** |
| 164.308(a)(3) | Workforce Security — Authorization & Supervision | Tenant membership enforced via `tenantPlugin.ts`: authenticated users must be a `tenantMember` to access any tenant's data. Role field (`owner`, etc.) exists on `tenant_members` table. Non-members receive HTTP 403 | `backend/src/plugins/tenantPlugin.ts` (lines 42-51) | **Implemented** (technical control); **Not Implemented** (workforce policy) |
| 164.308(a)(3)(ii)(C) | Workforce Security — Termination Procedures | `POST /v1/auth/logout` revokes JWT by SHA-256 hashing and inserting into `revoked_tokens` table. `authPlugin.ts` checks blacklist on every request. Daily prune job clears expired entries. No automated HR-triggered revocation yet | `backend/src/routes/authRoutes.ts`, `backend/src/plugins/authPlugin.ts` | **Partial** — token revocation implemented, no HR integration |
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
| 164.312(a)(1) | Access Control — Row-Level Security | RLS enabled on 12 tables via 2 migrations: `integrations`, `assets`, `jobs`, `distribution_events`, `audit_log`, `kb_documents`, `decision_memos`, `crm_contacts`, `crm_companies`, `consent_records`, `data_subject_requests`, `data_breaches`. Policy: `tenant_id = current_setting('app.tenant_id')::uuid`. Session variable set by `withTenant()` helper in Prisma transactions | `backend/prisma/migrations/20260228120000_rls_policies/`, `backend/prisma/migrations/20260304020000_rls_compliance_tables/`, `backend/src/db/prisma.ts` | **Partial** — RLS enabled on all 12 tables but not forced (superuser bypass still active). `FORCE ROW LEVEL SECURITY` pending |
| 164.312(a)(1) | Access Control — Tenant Isolation (Application Layer) | `tenantPlugin.ts` resolves `tenantId` from `x-tenant-id` header or query param. Validates UUID format (regex). Verifies user membership via `tenantMember.findUnique()`. Rejects non-members with 403 | `backend/src/plugins/tenantPlugin.ts` (lines 25-63) | **Implemented** |
| 164.312(a)(1) | Access Control — Emergency Access | Not implemented. No break-glass procedure | N/A | **Not Implemented** |
| 164.312(a)(2)(iii) | Access Control — Automatic Logoff | `POST /v1/auth/logout` endpoint revokes active JWT. `revoked_tokens` table with SHA-256 hashed tokens, `authPlugin.ts` checks blacklist on every request. Supabase JWT natural expiry as fallback. No idle timeout detection yet | `backend/src/routes/authRoutes.ts`, `backend/src/plugins/authPlugin.ts`, `backend/prisma/migrations/20260304030000_revoked_tokens/` | **Partial** — manual logout implemented, no automatic idle timeout |
| **164.312(b)** | **Audit Controls** | `auditPlugin.ts` logs every HTTP request/response to `audit_log` table: method, URL, status code, actor user ID, IP address, user agent, request ID. Uses `onSend` hook (fires after response). Two-attempt strategy for schema compatibility. Auto-pauses for 10s on schema errors, never permanently disables | `backend/src/plugins/auditPlugin.ts` (lines 18-87) | **Implemented** (basic logging) |
| 164.312(b) | Audit Controls — Hash-Chained Integrity | SHA-256 hash chain per tenant. `prev_hash` and `record_hash` columns on `audit_log`. `auditChain.ts` computes chain on every insert with in-memory cache and DB fallback. GENESIS_HASH anchor. Verification endpoint at `GET /v1/compliance/audit/verify` walks chain and reports total/verified/broken links | `backend/src/lib/auditChain.ts`, `backend/src/plugins/auditPlugin.ts`, `backend/prisma/migrations/20260304010000_audit_hash_chain/` | **Implemented** |
| 164.312(b) | Audit Controls — Per-Mutation Logging | Compliance routes log every DSAR, consent, breach, incident, and vendor mutation to `audit_log` with specific action codes (`DSAR_CREATED`, `BREACH_REPORTED`, `CONSENT_GRANTED`, `DATA_ERASURE`, etc.) | `backend/src/routes/complianceRoutes.ts` — audit log calls throughout | **Implemented** |
| **164.312(c)(1)** | **Integrity** — Input Validation | Compliance routes use Zod schemas (DsarCreateSchema, DsarUpdateSchema, ConsentSchema, BreachSchema, IncidentSchema, VendorSchema) with `.parse()` and 400 error on validation failure. HTML sanitization via `sanitize.ts` strips tags to prevent stored XSS. Other routes still use `req.body as any` in some cases | `backend/src/routes/complianceRoutes.ts`, `backend/src/lib/sanitize.ts` | **Partial** — compliance routes fully validated with Zod + sanitization, other routes still need migration |
| 164.312(c)(1) | Integrity — Data Integrity Verification | Hash-chained audit logs provide cryptographic integrity verification. `GET /v1/compliance/audit/verify` walks the per-tenant chain and detects any tampered or missing entries. No write-once storage for audit logs | `backend/src/lib/auditChain.ts`, `backend/src/routes/complianceRoutes.ts` | **Partial** — hash chain verification implemented, no write-once storage |
| **164.312(d)** | **Person or Entity Authentication** | JWT-based authentication via Supabase Auth. `authPlugin.ts` validates every request's bearer token by calling `supabase.auth.getUser()`. Invalid/missing tokens return 401 | `backend/src/plugins/authPlugin.ts` (lines 19-26) | **Implemented** (authentication) |
| 164.312(d) | Person Authentication — Session Termination / Token Blacklist | `revoked_tokens` table stores SHA-256 hashed JWTs with expiry. `POST /v1/auth/logout` adds token to blacklist. `authPlugin.ts` checks blacklist on every authenticated request and rejects revoked tokens with 401. Daily prune interval clears expired entries | `backend/src/routes/authRoutes.ts`, `backend/src/plugins/authPlugin.ts`, `backend/prisma/migrations/20260304030000_revoked_tokens/` | **Implemented** |
| **164.312(e)(1)** | **Transmission Security** — Encryption in Transit | Render terminates TLS for all inbound HTTPS connections. CORS restricts origins to `atlasux.cloud` + localhost (dev). HSTS configured with `maxAge: 31536000` (1 year) and `includeSubDomains: true`. Strict referrer policy (`strict-origin-when-cross-origin`) | `backend/src/server.ts` | **Implemented** |
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

A BAA template has been drafted at `policies/BAA_TEMPLATE.md` (version 1.0, 2026-03-01). The template covers all eight HIPAA-required sections: definitions, permitted uses and disclosures, safeguards, breach notification, subcontractor requirements, individual rights, return/destruction of PHI, and term and termination. The template references the actual technical controls implemented in the Atlas UX codebase and identifies the Platform's current subcontractors (Supabase, Render, Vercel, OpenAI, Stripe).

**The template has not been reviewed by healthcare privacy counsel and has not been executed with any tenant.** Atlas UX does not currently accept PHI. The vendor assessment system tracks whether upstream vendors (Supabase, Render, OpenAI, etc.) have BAAs available via the `has_baa` field on `vendor_assessments`.

### Vendor BAA Tracking

The `VendorAssessment` model (`backend/prisma/schema.prisma`, line 1188) includes:
- `has_baa` (Boolean) — whether the vendor offers a BAA
- `has_dpa` (Boolean) — whether a Data Processing Agreement is in place
- `compliance_certs` (String[]) — vendor's certifications (soc2, hipaa, gdpr, pci_dss, iso27001)
- `data_access` (String[]) — what data types the vendor can access (pii, phi, payment, credentials, usage_data, none)

Vendor assessment CRUD is available at `POST/GET /v1/compliance/vendors` with reassessment due tracking at `GET /v1/compliance/vendors/due`.

### What Would Be Needed for BAA Readiness

1. ~~A BAA template document for execution with Covered Entity tenants~~ — **DONE** (`policies/BAA_TEMPLATE.md`)
2. **Legal review of BAA template** by qualified healthcare privacy counsel before execution
3. Confirmed BAAs with all upstream vendors that may process PHI (Supabase, Render, OpenAI at minimum)
4. Encryption of PHI at rest (Supabase provides this via PostgreSQL encryption; needs explicit documentation)
5. Breach notification chain: Atlas UX must notify the Covered Entity within a contractually agreed timeframe if a breach occurs — **addressed in BAA template Article IV**
6. PHI return/destruction procedures upon BAA termination — **addressed in BAA template Article VII**

---

## 5. Gap Analysis and Remediation Plan

### Critical Gaps (Must Address Before Handling PHI)

| Gap | HIPAA Section | Risk | Planned Remediation | Status |
|---|---|---|---|---|
| ~~No session termination~~ | ~~164.312(d)~~ | ~~Compromised JWT tokens cannot be revoked~~ | ~~Add revoked_tokens table, logout endpoint, blacklist check~~ | **RESOLVED** (Mar 4, 2026) |
| ~~No hash-chained audit logs~~ | ~~164.312(b)~~ | ~~Tamper detection impossible~~ | ~~Add prev_hash/record_hash, SHA-256 chain, verification endpoint~~ | **RESOLVED** (Mar 4, 2026) |
| RLS not forced (superuser bypass) | 164.312(a)(1) | Prisma connects as superuser, so RLS policies are advisory only | Add `FORCE ROW LEVEL SECURITY` on all 12 RLS tables; migrate routes to use `withTenant()` | **In Progress** |
| ~~3 compliance tables missing RLS~~ | ~~164.312(a)(1)~~ | ~~consent_records, data_subject_requests, data_breaches had no RLS~~ | ~~Add RLS policies in migration~~ | **RESOLVED** (Mar 4, 2026) |
| ~~No CSRF protection active~~ | ~~164.312(a)(1)~~ | ~~CSRF defense was disabled~~ | ~~Rewrite to DB-backed synchronizer token~~ | **RESOLVED** (Mar 4, 2026) |
| ~~No BAA template or execution process~~ | ~~164.308(b)(1)~~ | ~~Cannot legally handle PHI without executed BAAs~~ | ~~Draft BAA template~~ | **PARTIALLY RESOLVED** — template drafted (`BAA_TEMPLATE.md`, Mar 1, 2026). Requires legal review and execution workflow |

### Moderate Gaps (Should Address for Compliance Posture)

| Gap | HIPAA Section | Risk | Planned Remediation | Status |
|---|---|---|---|---|
| ~~HSTS not configured~~ | ~~164.312(e)(1)~~ | ~~Relied on Helmet defaults~~ | ~~Update Helmet config~~ | **RESOLVED** (Mar 4, 2026) |
| ~~No per-tenant rate limiting~~ | ~~164.312(a)(1)~~ | ~~One tenant could exhaust global rate limits~~ | ~~Add tenantRateLimit.ts plugin~~ | **RESOLVED** (Mar 4, 2026) |
| Zod validation incomplete | 164.312(c)(1) | Routes outside `complianceRoutes.ts` still use `req.body as any` | Add Zod schemas to remaining route handlers | **Partial** — compliance routes done |
| No automated breach notifications | 164.404 | Deadlines are tracked but notifications must be sent manually | Build notification delivery (email to affected individuals, HHS submission form) | **Open** |
| No encryption at rest documentation | 164.312(a)(2)(iv) | Supabase PostgreSQL uses disk-level encryption, but this is not documented | Document Supabase encryption configuration | **Open** |

### Policy/Process Gaps (Organizational)

| Gap | HIPAA Section | Impact | Status |
|---|---|---|---|
| ~~No designated Security Officer~~ | ~~164.308(a)(2)~~ | ~~Required before handling PHI~~ | **RESOLVED** — Billy Whited appointed (Mar 5, 2026) |
| No workforce security training | 164.308(a)(5) | All staff with potential PHI access must complete HIPAA training | **Open** |
| No sanction policy | 164.308(a)(1)(ii)(C) | Must document consequences for policy violations | **Open** |
| No contingency/disaster recovery plan | 164.308(a)(7) | Must document backup, recovery, and emergency mode procedures | **Open** |
| No formal risk analysis | 164.308(a)(1)(i) | Must conduct and document comprehensive risk assessment annually | **Open** |

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

**Atlas UX is not yet HIPAA-compliant, but the technical foundation is now strong.** Since the compliance hardening sprint (Mar 4, 2026), the following critical gaps have been closed:

- Session termination with token blacklist (164.312(d)) — **RESOLVED**
- Hash-chained tamper-evident audit logs (164.312(b)) — **RESOLVED**
- CSRF protection via DB-backed synchronizer (164.312(a)(1)) — **RESOLVED**
- RLS on all 12 tenant-scoped tables (164.312(a)(1)) — **RESOLVED**
- HSTS with 1-year max-age (164.312(e)(1)) — **RESOLVED**
- Per-tenant rate limiting (164.312(a)(1)) — **RESOLVED**
- HIPAA Security Officer appointed (164.308(a)(2)) — **RESOLVED**

### Remaining gaps before PHI acceptance:

- **FORCE ROW LEVEL SECURITY** not enabled (Prisma superuser can bypass RLS) — in progress
- **No BAA template** for Covered Entity tenants — drafting in progress
- **No formal risk analysis** conducted (164.308(a)(1)(i))
- **No workforce security training** program (164.308(a)(5))
- **No sanction policy** documented (164.308(a)(1)(ii)(C))
- **No contingency/disaster recovery plan** (164.308(a)(7))
- **No automated breach notification delivery** (164.404)

**Recommendation:** Do not accept tenants with PHI until FORCE RLS is enabled, BAA template is executed, and organizational controls (training, sanctions, DR plan) are established.

---

*This document reflects the actual state of the Atlas UX codebase as of 2026-03-05. All file paths and endpoint references have been verified against the source code. Status assessments are intentionally conservative — a control is marked "Implemented" only when the code demonstrably enforces it.*
