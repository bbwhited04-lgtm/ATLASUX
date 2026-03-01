# Compliance Hardening Design — Framework-Mapped Code Hardening

**Date:** 2026-03-03
**Goal:** Harden Atlas UX codebase to certification-ready state across SOC 2, ISO 27001, HIPAA, PCI DSS, NIST 800-53, GDPR, and HITRUST CSF.
**Approach:** Every code change maps directly to specific framework control IDs. Policy docs rewritten last to reflect hardened state.

---

## Current State (Audit Findings)

| Gap | Risk | Frameworks Affected |
|-----|------|-------------------|
| No hash-chained audit logs | Tamper detection impossible | SOC 2, ISO, NIST, HITRUST, PCI |
| CSRF protection disabled | State-changing request forgery | PCI, NIST, HITRUST, SOC 2, ISO |
| No database-level RLS | Single point of failure for tenant isolation | SOC 2, HIPAA, ISO, NIST, PCI, HITRUST, GDPR |
| IP-only rate limiting | Tenant DoS, quota exhaustion | PCI, NIST, SOC 2, ISO, HITRUST |
| Inconsistent input validation | Injection, XSS on unvalidated routes | PCI, NIST, SOC 2, ISO, HITRUST, GDPR |
| No session termination | Can't revoke compromised sessions | HIPAA, NIST, SOC 2, ISO, PCI, HITRUST |
| No explicit HSTS | Transport security not provable | PCI, NIST, SOC 2, ISO, HITRUST, GDPR |

---

## Section 1: Hash-Chained Audit Logs

**Controls:** SOC 2 CC7.2, ISO 27001 A.12.4.1, NIST AU-10, HITRUST 09.aa, PCI DSS 10.5.5, GDPR Art. 5(1)(f)

### Changes
- Migration: add `prev_hash TEXT` and `record_hash TEXT` columns to `audit_log`
- On insert: `record_hash = SHA-256(prev_hash + tenantId + action + entityId + timestamp + actorUserId)`
- `prev_hash` = most recent `record_hash` for that tenant
- Per-tenant chains (no cross-tenant serialization)
- Cache latest hash per tenant in memory, DB fallback
- New endpoint: `GET /v1/compliance/audit/verify` — walks chain, reports broken links

### Files Modified
- `backend/prisma/schema.prisma` — add columns
- `backend/prisma/migrations/` — new migration
- `backend/src/plugins/auditPlugin.ts` — hash computation on insert
- `backend/src/lib/auditChain.ts` — new: chain verification logic
- `backend/src/routes/complianceRoutes.ts` — add verify endpoint

---

## Section 2: CSRF Protection

**Controls:** PCI DSS 6.5.9, NIST SC-23, HITRUST 09.m, SOC 2 CC6.6, ISO 27001 A.14.1.2

### Changes
- Synchronizer token pattern using existing `oauth_state` Postgres table
- On auth, backend generates CSRF token → stores in `oauth_state` (1-hour TTL) → returns via `x-csrf-token` response header
- Frontend reads header, sends on all POST/PUT/PATCH/DELETE via `x-csrf-token` request header
- Backend `preHandler` validates token exists in DB for state-changing requests
- No cookies — works cross-origin (Vercel → Render)

### Files Modified
- `backend/src/plugins/csrfPlugin.ts` — rewrite with DB-backed synchronizer pattern
- `backend/src/server.ts` — re-enable CSRF plugin registration
- `src/lib/api.ts` — capture and send CSRF token header

---

## Section 3: Database-Level RLS Enforcement

**Controls:** SOC 2 CC6.3, HIPAA §164.312(a)(1), ISO 27001 A.9.4.1, NIST AC-3, PCI DSS 7.1, HITRUST 01.c, GDPR Art. 25

### Changes
- Migration: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on 12 tables:
  - integrations, assets, jobs, distribution_events, audit_log, kb_documents,
    decision_memos, crm_contacts, crm_companies, consent_records, data_subject_requests, data_breaches
- Policy: `tenant_isolation USING (tenant_id = current_setting('app.tenant_id')::text)`
- Bypass role for migrations/seed scripts
- Widen `withTenant()` adoption to all tenant-scoped queries
- Integration test: direct SQL without session var returns zero rows

### Files Modified
- `backend/prisma/migrations/` — RLS migration
- `backend/src/db/prisma.ts` — ensure `withTenant()` is the standard path
- Route files — wrap queries in `withTenant()` where missing

---

## Section 4: Per-Tenant Rate Limiting

**Controls:** PCI DSS 6.5.10, NIST SC-5, SOC 2 CC6.6, ISO 27001 A.13.1.1, HITRUST 09.m

### Changes
- New `rate_limit_buckets` table: `(id, tenant_id, endpoint_group, window_start, count)`
- Fastify `preHandler` hook checks tenant bucket
- Three tiers: `auth` (10/min), `mutation` (30/min), `read` (120/min)
- Falls back to IP-based for unauthenticated routes
- Prune expired buckets every 5 minutes

### Files Modified
- `backend/prisma/schema.prisma` — add RateLimitBucket model
- `backend/prisma/migrations/` — new migration
- `backend/src/plugins/tenantRateLimit.ts` — new: tenant-aware rate limit plugin
- `backend/src/server.ts` — register tenant rate limit plugin

---

## Section 5: Consistent Input Validation

**Controls:** PCI DSS 6.5.1, NIST SI-10, SOC 2 CC6.1, ISO 27001 A.14.2.5, HITRUST 09.o, GDPR Art. 32

### Changes
- Add Zod schemas to every route currently using `req.body as any`
- Standardize error format: `{ ok: false, error: string, details?: ZodError }`
- Add `sanitizeHtml()` for user-generated text (blog, KB, incidents)
- No new dependencies (Zod already present)

### Files Modified
- `backend/src/routes/complianceRoutes.ts` — add Zod schemas
- `backend/src/routes/auditRoutes.ts` — add Zod schemas
- `backend/src/routes/telegramRoutes.ts` — add Zod schemas
- Other routes with `as any` body casts
- `backend/src/lib/sanitize.ts` — new: HTML sanitization utility

---

## Section 6: Session Termination & Token Blacklist

**Controls:** HIPAA §164.312(d), NIST IA-11, SOC 2 CC6.1, ISO 27001 A.9.4.2, PCI DSS 8.1.8, HITRUST 01.b

### Changes
- New `revoked_tokens` table: `(id, token_hash, revoked_at, expires_at)`
- `POST /v1/auth/logout`: calls `supabase.auth.signOut()`, adds token hash to revoked_tokens
- `authPlugin` checks `revoked_tokens` before accepting bearer tokens
- Daily prune of expired revocations
- Frontend calls logout endpoint on sign-out

### Files Modified
- `backend/prisma/schema.prisma` — add RevokedToken model
- `backend/prisma/migrations/` — new migration
- `backend/src/routes/authRoutes.ts` — add logout endpoint
- `backend/src/plugins/authPlugin.ts` — add blacklist check
- `src/lib/api.ts` or auth context — call logout endpoint

---

## Section 7: HSTS & Transport Security

**Controls:** PCI DSS 4.1, NIST SC-8, SOC 2 CC6.7, ISO 27001 A.13.1.1, HITRUST 09.m, GDPR Art. 32

### Changes
- Helmet HSTS: `maxAge: 31536000, includeSubDomains: true`
- Add `Referrer-Policy: strict-origin-when-cross-origin`
- Tighten CSP: remove `unsafe-inline` from `script-src` where possible
- Document Render TLS termination

### Files Modified
- `backend/src/server.ts` — update Helmet config
- `policies/` docs — document transport security

---

## Section 8: Policy Document Rewrite

After all code hardening is complete, rewrite all 7 framework policy docs to map each claim to actual code/commits:

| Document | Framework | Key Changes |
|----------|-----------|-------------|
| `policies/SOC2_COMPLIANCE.md` | SOC 2 Type II | Map Trust Services Criteria to real controls, remove false "93 controls" claim |
| `policies/ISO27001_COMPLIANCE.md` | ISO 27001:2022 | Map Annex A controls to actual implementations with file paths |
| `policies/HIPAA_COMPLIANCE.md` | HIPAA | Map safeguards to real code (encryption, access control, audit, session mgmt) |
| `policies/PCI_DSS_COMPLIANCE.md` | PCI DSS v4.0 | Map SAQ-A requirements to Stripe integration + hardened controls |
| `policies/NIST_800_53_COMPLIANCE.md` | NIST 800-53 Rev 5 | New file — map control families (AC, AU, IA, SC, SI) to code |
| `policies/GDPR_COMPLIANCE.md` | GDPR | Map Articles to real DSAR/consent/erasure endpoints with code refs |
| `policies/HITRUST_CSF_COMPLIANCE.md` | HITRUST CSF v11 | New file — map control categories to implementations |
| `policies/COMPLIANCE_INDEX.md` | All | Rewrite with honest status, remove placeholder contacts/hotlines |

Each policy doc will follow this structure:
1. Framework overview and scope
2. Control-to-code mapping table (control ID → file path → description)
3. Current status (Implemented / Partial / Planned)
4. Evidence references (commit hashes, endpoint URLs)
5. Gap analysis and remediation timeline

---

## Implementation Order

1. Hash-chained audit logs (migration + auditPlugin)
2. Database-level RLS (migration + withTenant adoption)
3. CSRF protection (plugin rewrite + frontend)
4. Session termination (migration + auth changes)
5. Per-tenant rate limiting (migration + plugin)
6. Input validation sweep (Zod schemas across routes)
7. HSTS & transport security (Helmet config)
8. Policy document rewrite (all 7 frameworks + index)

---

## Verification

- `cd backend && npm run build` — must compile clean after each section
- `cd .. && npm run build` — frontend must build clean
- Manual test: each `/v1/oauth/{provider}/start` redirects correctly
- Manual test: `/v1/compliance/audit/verify` returns chain status
- Manual test: CSRF rejection on missing token
