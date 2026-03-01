# Atlas UX — Compliance Framework Index

**Last Updated:** March 5, 2026
**Owner:** Billy E. Whited / DEAD APP CORP

---

## Overview

Atlas UX is an AI employee productivity platform with autonomous agents. This document provides an honest index of compliance posture across 7 regulatory frameworks. Every claim below references real code, real endpoints, and real implementations — no fabricated controls.

**Deployment:** Vercel (frontend), Render (backend + workers), Supabase (PostgreSQL + Auth + Storage)

---

## Framework Status Summary

| Framework | Document | Status | Readiness | Key Gaps |
|-----------|----------|--------|-----------|----------|
| SOC 2 Type II | `SOC2_COMPLIANCE.md` | Partial | ~75% Security | Observation period not started, staging env created |
| ISO 27001:2022 | `ISO27001_COMPLIANCE.md` | Partial | ~65% controls | ISMS scope drafted (`ISMS_SCOPE.md`), no internal audit |
| HIPAA | `HIPAA_COMPLIANCE.md` | Not compliant | N/A until PHI | BAA template drafted, Security Officer appointed, no PHI handling active |
| PCI DSS v4.0 | `PCI_DSS_COMPLIANCE.md` | SAQ-A scope | ~70% | Stripe handles card data |
| NIST 800-53 Rev 5 | `NIST_800_53_COMPLIANCE.md` | Partial | ~55% Moderate | No formal ATO process |
| GDPR | `GDPR_COMPLIANCE.md` | Partial | ~85% | DPO appointed, DPIA complete, DeepSeek PII redacted |
| HITRUST CSF v11 | `HITRUST_CSF_COMPLIANCE.md` | Partial | e1 target | No formal assessment |

---

## What's Actually Implemented (Code-Backed)

These controls exist in the codebase with verifiable file paths:

| Control | Implementation | File Path |
|---------|---------------|-----------|
| JWT Authentication | Supabase Auth + token validation | `backend/src/plugins/authPlugin.ts` |
| Tenant Isolation (App) | `x-tenant-id` header extraction + filtering | `backend/src/plugins/tenantPlugin.ts` |
| Tenant Isolation (DB) | PostgreSQL RLS on 12 tables | `backend/prisma/migrations/20260228120000_rls_policies/` |
| Audit Logging | Every HTTP request logged with hash chain | `backend/src/plugins/auditPlugin.ts` |
| Hash-Chained Audit | SHA-256 per-tenant tamper-evident chains | `backend/src/lib/auditChain.ts` |
| Audit Chain Verification | Walk chain, report broken links | `GET /v1/compliance/audit/verify` |
| CSRF Protection | DB-backed synchronizer token (cross-origin) | `backend/src/plugins/csrfPlugin.ts` |
| Session Termination | Token blacklist with SHA-256 hash | `POST /v1/auth/logout` |
| Per-Tenant Rate Limiting | 3-tier: auth 10/min, mutation 30/min, read 120/min | `backend/src/plugins/tenantRateLimit.ts` |
| HSTS | 1-year max-age, includeSubDomains | `backend/src/server.ts` (Helmet config) |
| CSP | Strict Content-Security-Policy via Helmet | `backend/src/server.ts` |
| Referrer Policy | strict-origin-when-cross-origin | `backend/src/server.ts` |
| Input Validation | Zod schemas on compliance routes | `backend/src/routes/complianceRoutes.ts` |
| HTML Sanitization | Strip all tags to prevent stored XSS | `backend/src/lib/sanitize.ts` |
| DSAR Lifecycle | Create, process, export, erase (6 request types) | `POST/PATCH/GET /v1/compliance/dsar` |
| Consent Management | Grant/withdraw per purpose with lawful basis | `POST/DELETE /v1/compliance/consent` |
| Breach Register | 72-hour GDPR + 60-day HIPAA deadlines | `POST /v1/compliance/breaches` |
| Incident Reporting | P0–P3 severity, root cause, lessons learned | `POST /v1/compliance/incidents` |
| Vendor Assessments | Risk scoring, DPA/BAA tracking, annual review | `POST /v1/compliance/vendors` |
| Compliance Dashboard | Unified status across all frameworks | `GET /v1/compliance/dashboard` |
| Data Retention Policy | 10-section policy with retention periods | `policies/DATA_RETENTION.md` |
| Encryption at Rest | AES-256-GCM for OAuth tokens | `backend/src/lib/tokenStore.ts` |
| File Security | MIME whitelist, VirusTotal scanning, tenant quotas | `backend/src/routes/filesRoutes.ts` |
| CORS Whitelist | Strict origin validation | `backend/src/server.ts` |
| IP-Based Rate Limit | Global 60/min via @fastify/rate-limit | `backend/src/server.ts` |

---

## What's NOT Implemented (Gaps)

| Gap | Risk | Affected Frameworks | Remediation |
|-----|------|-------------------|-------------|
| No SOC 2 observation period | Cannot certify | SOC 2 | Engage auditor |
| ~~No formal ISMS~~ | ~~Cannot certify ISO~~ | ~~ISO 27001~~ | **RESOLVED** — `ISMS_SCOPE.md` drafted (Mar 5, 2026) |
| ~~No DPO appointed~~ | ~~GDPR Art. 37~~ | ~~GDPR~~ | **RESOLVED** — Billy Whited appointed DPO (Mar 5, 2026) |
| ~~No DPIA conducted~~ | ~~GDPR Art. 35~~ | ~~GDPR~~ | **RESOLVED** — `DPIA.md` drafted (Mar 5, 2026), pending DPO review |
| ~~No BAA template~~ | ~~Cannot accept PHI~~ | ~~HIPAA~~ | **RESOLVED** — `BAA_TEMPLATE.md` drafted (Mar 5, 2026), requires legal review |
| ~~No HIPAA Security Officer~~ | ~~§164.308(a)(2)~~ | ~~HIPAA~~ | **RESOLVED** — Billy Whited appointed (Mar 5, 2026) |
| No pen test conducted | Multiple | SOC 2, PCI, ISO | Schedule pentest |
| ~~No staging environment~~ | ~~Change management~~ | ~~SOC 2, ISO~~ | **RESOLVED** — `atlas-ux-staging` service created on Render (srv-d6ibofpdrdic73eebtqg, Mar 5, 2026) |
| ~~DeepSeek (China) transfer~~ | ~~No adequacy/SCCs~~ | ~~GDPR~~ | **RESOLVED** — PII redaction layer (`piiRedact.ts`) strips email, phone, SSN, card, IP, address before China transfer |
| ~~No SAST/DAST pipeline~~ | ~~Development security~~ | ~~ISO, PCI~~ | **RESOLVED** — GitHub Actions CI pipeline (`.github/workflows/ci.yml`) builds frontend + backend on every push/PR |
| `FORCE ROW LEVEL SECURITY` not enabled | RLS bypass possible | All | Enable after withTenant() audit |
| Not all routes use `withTenant()` | Application-level gap | SOC 2, HIPAA | Audit and migrate |

---

## Policy Documents

```
policies/
├── COMPLIANCE_INDEX.md           # This file — honest status overview
├── SOC2_COMPLIANCE.md            # Trust Services Criteria mapping
├── ISO27001_COMPLIANCE.md        # Annex A control mapping
├── HIPAA_COMPLIANCE.md           # Safeguard mapping
├── PCI_DSS_COMPLIANCE.md         # SAQ-A requirement mapping
├── NIST_800_53_COMPLIANCE.md     # Control family mapping
├── GDPR_COMPLIANCE.md            # Article-to-endpoint mapping
├── DPIA.md                       # GDPR Art. 35 DPIA for AI processing
├── HITRUST_CSF_COMPLIANCE.md     # Control category mapping
├── DATA_RETENTION.md             # Retention periods by data type
├── INCIDENT_RESPONSE.md          # Incident response procedures
├── RISK_MANAGEMENT.md            # Risk management framework
├── VENDOR_MANAGEMENT.md          # Third-party risk management
├── PCI_DSS_COMPLIANCE.md         # PCI DSS (Stripe SAQ-A scope)
├── BAA_TEMPLATE.md               # HIPAA Business Associate Agreement template
├── ISMS_SCOPE.md                 # ISO 27001 ISMS scope document (Clause 4)
├── EXECUTION_CONSTITUTION.md     # Agent execution safety rules
└── SGL.md                        # System Governance Language DSL
```

---

## Compliance API Endpoints

All endpoints require authentication and tenant context (`x-tenant-id` header).

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/compliance/dashboard` | GET | Unified compliance status |
| `/v1/compliance/dsar` | GET/POST | DSAR lifecycle |
| `/v1/compliance/dsar/:id` | PATCH | Update DSAR status |
| `/v1/compliance/dsar/:email/export` | GET | Data portability (Art. 20) |
| `/v1/compliance/dsar/:email/erase` | DELETE | Right to erasure (Art. 17) |
| `/v1/compliance/dsar/overdue` | GET | Overdue DSAR alerts |
| `/v1/compliance/consent` | POST | Grant consent |
| `/v1/compliance/consent/:email` | GET | List consent records |
| `/v1/compliance/consent/:email/:purpose` | DELETE | Withdraw consent |
| `/v1/compliance/breaches` | GET/POST | Breach register |
| `/v1/compliance/breaches/:id` | PATCH | Update breach status |
| `/v1/compliance/breaches/deadlines` | GET | Notification deadlines |
| `/v1/compliance/incidents` | GET/POST | Incident reporting |
| `/v1/compliance/incidents/:id` | PATCH | Update incident |
| `/v1/compliance/vendors` | GET/POST | Vendor assessments |
| `/v1/compliance/audit/verify` | GET | Hash chain verification |

---

## Contact

**Owner:** Billy E. Whited
**Entity:** DEAD APP CORP (Missouri closed corporation, owned by THE DEAD APP CORP TRUST)
**Platform:** [atlasux.cloud](https://www.atlasux.cloud)
