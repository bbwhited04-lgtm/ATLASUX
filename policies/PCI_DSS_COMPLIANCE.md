# Atlas UX -- PCI DSS v4.0 Compliance Policy

**Effective Date:** February 27, 2026
**Last Revised:** March 1, 2026
**Owner:** DEAD APP CORP
**SAQ Type:** SAQ-A (Card-Not-Present, All Cardholder Data Functions Fully Outsourced)

---

## 1. Framework Overview

### 1.1 PCI DSS v4.0

The Payment Card Industry Data Security Standard (PCI DSS) version 4.0, published by the PCI Security Standards Council, defines security requirements for entities that store, process, or transmit cardholder data. Version 4.0 took effect on March 31, 2024, with a transition period for certain requirements extending to March 31, 2025.

PCI DSS v4.0 introduces a customized approach alongside the traditional defined approach, strengthens authentication requirements, expands encryption and monitoring expectations, and emphasizes continuous security as opposed to point-in-time compliance.

### 1.2 SAQ-A Applicability

Atlas UX qualifies for **Self-Assessment Questionnaire A (SAQ-A)** -- the simplest PCI DSS compliance category. SAQ-A applies to card-not-present merchants that have **fully outsourced all cardholder data functions** to a PCI DSS-validated third-party service provider.

**Why SAQ-A applies:**

- Atlas UX does not collect, transmit, process, or store cardholder data (card numbers, CVVs, expiration dates, or track data) on any system under its control.
- All payment processing is delegated to **Stripe**, a PCI DSS Level 1 certified service provider.
- Users enter card details exclusively into Stripe Checkout (a Stripe-hosted page) or Stripe Elements (Stripe-hosted iframes). Atlas UX JavaScript never touches card data.
- The Atlas UX backend receives only post-authorization metadata from Stripe webhooks: payment intent IDs, customer IDs, amounts, statuses, and non-sensitive card metadata (`card.brand`, `card.last4`).

**What SAQ-A does NOT cover:**

SAQ-A is a reduced questionnaire. It does not require Atlas UX to meet every PCI DSS requirement -- only the subset applicable to merchants that have fully outsourced cardholder data handling. The mapping in Section 2 reflects this reduced scope. Controls that Atlas UX implements beyond SAQ-A obligations are noted as defense-in-depth measures.

### 1.3 Cardholder Data -- What Atlas UX Never Receives

| Data Element | Received by Atlas UX? | Notes |
|---|---|---|
| Primary Account Number (PAN) | **No** | Never enters Atlas UX systems at any layer |
| Cardholder Name | **No** | Collected by Stripe only |
| Expiration Date | **No** | Collected by Stripe only |
| CVV / CVC / CID | **No** | Collected by Stripe only; Stripe does not persist this either |
| Card Brand (e.g., Visa) | Yes (metadata) | Received in webhook `card.brand` -- not cardholder data under PCI DSS |
| Last 4 Digits | Yes (metadata) | Received in webhook `card.last4` -- not cardholder data when isolated |
| Stripe Customer ID | Yes | Reference token, not cardholder data |
| Payment Intent ID | Yes | Reference token, not cardholder data |

---

## 2. Requirement Mapping

The following table maps PCI DSS v4.0 requirements to Atlas UX implementations. Status values:

- **Implemented** -- Control is in production code and operational.
- **Partial** -- Control exists but has known gaps documented in the Gap Analysis (Section 5).
- **Planned** -- Control is designed but not yet implemented. See `docs/plans/2026-03-03-compliance-hardening-design.md`.
- **N/A** -- Requirement is not applicable under SAQ-A scope because the responsibility lies entirely with Stripe or the cloud infrastructure provider.

### Req 1: Install and Maintain Network Security Controls

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 1.2.1 | Restrict inbound/outbound traffic to CDE | Atlas UX has no CDE. Stripe manages its own CDE network controls. Atlas UX infrastructure runs on Render (PaaS) which manages network-level firewalling. | N/A | **N/A** |

### Req 2: Apply Secure Configurations to All System Components

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 2.2.7 | Encrypt all non-console administrative access | All administrative access (Render dashboard, Supabase dashboard, Stripe dashboard) is over HTTPS. No SSH access is used -- Render is a PaaS with no shell access to production hosts. | N/A (platform-level) | **Implemented** |

### Req 3: Protect Stored Account Data

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 3.1.1 | Keep stored account data to minimum | Atlas UX stores zero cardholder data. Only Stripe reference IDs (`stripe_customer_id`, `payment_intent.id`) and payment metadata (amount, currency, status) are stored. | `backend/src/routes/stripeRoutes.ts` | **Implemented** |
| 3.2.1 | Do not store sensitive auth data after authorization | Atlas UX never receives sensitive authentication data (full PAN, CVV, track data, PINs) at any point in the payment flow. | N/A | **Implemented** |

### Req 4: Protect Cardholder Data with Strong Cryptography During Transmission

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 4.1 | HSTS and TLS enforcement | Render terminates TLS for all inbound HTTPS traffic to the Atlas UX backend. Vercel enforces HTTPS on all frontend deployments. Fastify registers `@fastify/helmet` which sets security headers including `X-Content-Type-Options: nosniff`, `X-Frame-Options`, and CSP directives. **Gap:** Explicit HSTS header (`Strict-Transport-Security: max-age=31536000; includeSubDomains`) is not currently configured in the Helmet options -- Helmet's default HSTS is enabled but the configuration does not set explicit `maxAge` or `includeSubDomains` values. The compliance hardening plan includes adding explicit HSTS configuration. | `backend/src/server.ts` (lines 169-189) | **Partial** |
| 4.2.1 | Strong cryptography for cardholder data in transit | Card data travels directly from the user's browser to Stripe over TLS 1.2+. Atlas UX never transmits cardholder data. All Atlas UX API endpoints are HTTPS-only (enforced by Render and Vercel). Stripe webhook payloads are delivered over HTTPS and verified via HMAC-SHA256 signature with timing-safe comparison. | `backend/src/integrations/stripe.client.ts` (lines 124-153) | **Implemented** |

### Req 5: Protect All Systems and Networks from Malicious Software

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 5.2.1 | Anti-malware deployed on systems | Render manages OS-level security for hosted services. Application dependencies are auditable via `npm audit`. No user-uploaded executables are processed. | N/A (platform-managed) | **Implemented** (platform) |

### Req 6: Develop and Maintain Secure Systems and Software

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 6.5.1 | Input validation to prevent injection | Zod schema validation is applied on Stripe-related routes (`CreateProductSchema`, `RequestCreateProductSchema`, `CheckoutSchema`, `PortalSchema`) and across 12 route files (92 Zod schema usages total). Prisma ORM uses parameterized queries, preventing SQL injection. **Gap:** Approximately 30 route files still contain `as any` body casts (255 occurrences) where Zod validation is not yet applied. An input validation sweep is planned. | `backend/src/routes/stripeRoutes.ts` (lines 14-21, 167-170, 207-209), route files with Zod | **Partial** |
| 6.5.9 | CSRF protection | A CSRF plugin exists using the double-submit cookie pattern with `@fastify/cookie`. It validates `x-csrf-token` header against cookie value on all mutating methods (POST, PUT, PATCH, DELETE), with exemptions for webhook endpoints. **However, CSRF protection is currently disabled** in `server.ts` (line 199: `// await app.register(csrfPlugin)`). The comment states that CORS origin whitelisting is relied upon instead. The compliance hardening plan calls for rewriting this as a DB-backed synchronizer token pattern and re-enabling it, since the current double-submit cookie approach does not work cross-origin (Vercel frontend to Render backend). | `backend/src/plugins/csrfPlugin.ts`, `backend/src/server.ts` (line 199) | **Planned** |
| 6.5.10 | Rate limiting | Global rate limiting is configured at 60 requests per minute via `@fastify/rate-limit`. Stripe product creation routes have tighter per-route limits: `/products/request` at 10/min, `/products` at 5/min. **Gap:** Rate limiting is currently IP-based only. Per-tenant rate limiting (with DB-backed buckets and tiered limits for auth/mutation/read operations) is designed but not yet implemented. | `backend/src/server.ts` (line 191), `backend/src/routes/stripeRoutes.ts` (lines 52, 96) | **Partial** |

### Req 7: Restrict Access to System Components and Cardholder Data by Business Need to Know

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 7.1 | Access control and RLS | `STRIPE_SECRET_KEY` is stored exclusively in Render environment variables and never exposed to the frontend. Route-level RBAC via `requireRole()` restricts Stripe product operations to `owner`, `admin`, `exec`, and `atlas` roles. Database-level Row-Level Security (RLS) is enabled on 9 tables (`integrations`, `assets`, `jobs`, `distribution_events`, `audit_log`, `kb_documents`, `decision_memos`, `crm_contacts`, `crm_companies`) with tenant isolation policies using `current_setting('app.tenant_id')`. A `withTenant()` helper wraps queries in a transaction that sets the session variable. **Gap:** RLS is enabled without `FORCE ROW LEVEL SECURITY`, meaning the superuser (Prisma connection) bypasses policies unless `withTenant()` is explicitly called. Not all routes use `withTenant()` yet. Three additional tables planned for RLS (`consent_records`, `data_subject_requests`, `data_breaches`) are not yet covered. | `backend/src/routes/stripeRoutes.ts` (lines 28-36), `backend/src/db/prisma.ts` (lines 30-41), `backend/prisma/migrations/20260228120000_rls_policies/migration.sql` | **Partial** |
| 7.2.2 | Access assigned based on job function | Stripe dashboard access is limited to organization owners. Render environment variable access is limited to deployment administrators. Agent roles are defined per the agent roster with explicit `reportsTo` hierarchies. | N/A (operational) | **Implemented** |

### Req 8: Identify Users and Authenticate Access to System Components

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 8.1.8 | Session management and token revocation | JWT-based authentication via `authPlugin.ts`. Each user has a unique `userId` and all Stripe operations are logged with actor identity to `audit_log`. **Gap:** No token blacklist or session termination capability exists yet. The compliance hardening plan calls for a `revoked_tokens` table, a `POST /v1/auth/logout` endpoint, and a blacklist check in `authPlugin`. This means that if a JWT is compromised, it cannot be revoked before its natural expiration. | `backend/src/plugins/authPlugin.ts` | **Planned** |
| 8.2.1 | Unique IDs for all users | Every authenticated request carries a unique `userId` extracted from the JWT. All Stripe operations are logged with `actorExternalId` in the audit log. | `backend/src/plugins/authPlugin.ts`, `backend/src/routes/stripeRoutes.ts` | **Implemented** |
| 8.3.1 | Authentication factors for all access | JWT bearer token required for all authenticated API routes. Render dashboard requires account authentication. Stripe dashboard requires two-factor authentication. | `backend/src/plugins/authPlugin.ts` | **Implemented** |
| 8.6.1 | System account credentials managed | `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are stored as Render environment variables, never in source code. They are rotatable via the Stripe dashboard. `STRIPE_SUB_WEBHOOK_SECRET` is loaded via `loadEnv()` from process environment. | `backend/src/env.ts`, Render dashboard | **Implemented** |

### Req 9: Restrict Physical Access to Cardholder Data

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 9.x | Physical access controls | N/A. Atlas UX is fully cloud-hosted on Render (compute), Vercel (frontend CDN), and Supabase (database). No physical servers are operated. Physical security is the responsibility of the underlying cloud providers (AWS for Render, Vercel's edge network, AWS for Supabase). | N/A | **N/A** |

### Req 10: Log and Monitor All Access to System Components and Cardholder Data

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 10.2.1 | Audit logs capture relevant access | All Stripe-related operations are logged to the `audit_log` table with structured metadata: product requests (`STRIPE_PRODUCT_REQUESTED`), product creation (`STRIPE_PRODUCT_CREATED`), webhook events processed, and payment status changes. Logs include `tenantId`, `actorUserId`, `actorExternalId`, `action`, `entityType`, `entityId`, and `meta` (JSON). No cardholder data is ever included in log entries. | `backend/src/routes/stripeRoutes.ts`, `backend/src/plugins/auditPlugin.ts` | **Implemented** |
| 10.4.1 | Audit logs reviewed | Audit logs are queryable via `/v1/audit` routes with filtering by tenant, action, entity, and date range. The Agent Watcher UI (`/app/watcher`) provides real-time 4-second polling of audit events. 24-month retention is specified per `DATA_RETENTION.md`. | `backend/src/routes/auditRoutes.ts`, `src/components/AgentWatcher.tsx` | **Implemented** |
| 10.5.5 | Audit log integrity (tamper detection) | **Not yet implemented.** The compliance hardening plan specifies hash-chained audit logs: each `audit_log` row will include `prev_hash` and `record_hash` columns, where `record_hash = SHA-256(prev_hash + tenantId + action + entityId + timestamp + actorUserId)`. Chains will be per-tenant. A verification endpoint (`GET /v1/compliance/audit/verify`) will walk the chain and report broken links. | Planned: `backend/src/plugins/auditPlugin.ts`, `backend/src/lib/auditChain.ts`, `backend/src/routes/complianceRoutes.ts` | **Planned** |

### Req 11: Test Security of Systems and Networks Regularly

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 11.3.1 | External vulnerability scans | Not yet performed. Quarterly external scans are planned. Render provides infrastructure-level scanning for its platform. | N/A | **Planned** |
| 11.3.2 | Internal vulnerability scans | `npm audit` is run periodically. Dependency updates are tracked. Application-level security review is performed on code changes. | N/A (operational) | **Implemented** |

### Req 12: Support Information Security with Organizational Policies and Programs

| Sub-Req | Description | Implementation | File Path | Status |
|---|---|---|---|---|
| 12.1.1 | Information security policy established | This document, plus: `SOC2_COMPLIANCE.md`, `ISO27001_COMPLIANCE.md`, `HIPAA_COMPLIANCE.md`, `RISK_MANAGEMENT.md`, `INCIDENT_RESPONSE.md`, `VENDOR_MANAGEMENT.md`, `DATA_RETENTION.md`, `GDPR_COMPLIANCE.md`. | `policies/` directory | **Implemented** |
| 12.3.1 | Risk assessment performed | Risk register maintained in `RISK_MANAGEMENT.md` with Stripe classified as RISK-004. | `policies/RISK_MANAGEMENT.md` | **Implemented** |
| 12.8.1 | Service provider management | `VENDOR_MANAGEMENT.md` classifies Stripe as a High-risk vendor with semi-annual review. Stripe's PCI DSS Level 1 AOC is verified during the review cycle. | `policies/VENDOR_MANAGEMENT.md` | **Implemented** |
| 12.10.1 | Incident response plan | `INCIDENT_RESPONSE.md` includes a runbook for API key compromise relevant to `STRIPE_SECRET_KEY` rotation. | `policies/INCIDENT_RESPONSE.md` | **Implemented** |

---

## 3. Data Flow

```
                    ATLAS UX PAYMENT DATA FLOW

    +----------------------------------------------------+
    |                    USER BROWSER                     |
    |                                                     |
    |  1. User clicks "Subscribe" on /store page          |
    |  2. Frontend calls POST /v1/stripe/checkout-session  |
    |  3. Backend creates Stripe Checkout Session          |
    |  4. User is redirected to Stripe-hosted checkout     |
    |  5. Card data entered on Stripe's PCI L1 page --    |
    |     NEVER touches Atlas UX JavaScript or servers     |
    +------------------------+----------------------------+
                             |
                             | Card data goes directly to Stripe
                             | (Stripe Checkout hosted page)
                             v
    +----------------------------------------------------+
    |                   STRIPE (PCI L1)                   |
    |                                                     |
    |  6. Stripe processes the payment                    |
    |  7. Stripe tokenizes and stores card data           |
    |  8. Stripe communicates with card networks          |
    |  9. Stripe sends webhook event to Atlas UX          |
    |     backend with payment result metadata:           |
    |     - payment_intent.id, customer.id                |
    |     - amount, currency, status                      |
    |     - card.brand, card.last4 (metadata only)        |
    +------------------------+----------------------------+
                             |
                             | Webhook POST with Stripe-Signature
                             | header (metadata only, NEVER card
                             | numbers)
                             v
    +----------------------------------------------------+
    |              ATLAS UX BACKEND (Render)              |
    |                                                     |
    | 10. stripeRoutes.ts /subscription-webhook receives  |
    |     the raw body via custom content type parser     |
    | 11. stripeConstructWebhookEvent() in                |
    |     stripe.client.ts verifies:                      |
    |     - HMAC-SHA256 signature (timing-safe compare)   |
    |     - Timestamp within 300-second tolerance         |
    | 12. Processes event: creates/revokes cloud_seat,    |
    |     logs to audit_log, emails gate key              |
    | 13. Stores only: stripe_customer_id, subscription   |
    |     metadata, payment status                        |
    |                                                     |
    |  NEVER STORES: card numbers, CVVs, PANs             |
    +------------------------+----------------------------+
                             |
                             | Prisma ORM writes to Supabase
                             v
    +----------------------------------------------------+
    |            SUPABASE (PostgreSQL)                    |
    |                                                     |
    | 14. Stores: cloud_seat records, stripe_customer_id, |
    |     subscription status, audit_log entries,         |
    |     ledger_entry records                            |
    |                                                     |
    | NEVER STORES: card numbers, CVVs, PANs              |
    +----------------------------------------------------+
```

**Key point:** The cardholder data environment (CDE) exists entirely within Stripe's infrastructure. Atlas UX operates outside the CDE boundary at every layer.

---

## 4. Stripe Responsibility Matrix

| Responsibility | Stripe | Atlas UX |
|---|---|---|
| Collect card numbers from users | Stripe (Checkout / Elements) | -- |
| Store card numbers and tokens | Stripe | -- |
| Transmit card data to card networks | Stripe | -- |
| Tokenize card data | Stripe | -- |
| Maintain PCI DSS Level 1 certification | Stripe | -- |
| Provide hosted payment page (Checkout) | Stripe | -- |
| Fraud detection (Stripe Radar) | Stripe | -- |
| Secure `STRIPE_SECRET_KEY` | -- | Atlas UX (Render env vars) |
| Secure `STRIPE_WEBHOOK_SECRET` / `STRIPE_SUB_WEBHOOK_SECRET` | -- | Atlas UX (Render env vars) |
| Verify webhook signatures (HMAC-SHA256, timing-safe) | -- | Atlas UX (`stripe.client.ts`) |
| Not log or store cardholder data | -- | Atlas UX (verified: no PAN/CVV in code or DB) |
| Maintain SAQ-A self-assessment | -- | Atlas UX |
| Verify Stripe's AOC annually | -- | Atlas UX (Q2 vendor review) |
| Secure API transport (HTTPS) | Stripe (their endpoints) | Atlas UX (Render TLS termination) |
| Rate limit payment-related endpoints | -- | Atlas UX (`@fastify/rate-limit`) |
| RBAC on payment operations | -- | Atlas UX (`requireRole()` in stripeRoutes) |
| Audit log all payment events | -- | Atlas UX (`audit_log` table) |
| Dispute management tools | Stripe | -- |
| Dispute response process | -- | Atlas UX (business decision) |
| Refund API execution | Stripe | -- |
| Refund business decision | -- | Atlas UX |
| Customer PII for receipts | Stripe (stores for receipts) | Atlas UX (stores email for account management) |

---

## 5. Gap Analysis and Remediation

The following gaps were identified by comparing Atlas UX's current implementation against PCI DSS v4.0 requirements applicable under SAQ-A scope, plus defense-in-depth controls identified in the compliance hardening design.

| # | Gap | PCI DSS Req | Current State | Planned Remediation | Design Reference |
|---|---|---|---|---|---|
| 1 | **CSRF protection disabled** | 6.5.9 | `csrfPlugin.ts` exists but is commented out in `server.ts`. The double-submit cookie pattern does not work cross-origin (Vercel to Render). CORS origin whitelist is the only current mitigation. | Rewrite as DB-backed synchronizer token pattern using `oauth_state` table. Re-enable in `server.ts`. Frontend `api.ts` to capture and send `x-csrf-token`. | Hardening Design, Section 2 |
| 2 | **No explicit HSTS configuration** | 4.1 | `@fastify/helmet` is registered but does not include explicit HSTS `maxAge` or `includeSubDomains` settings. Render enforces HTTPS at the platform level, but the header is not set by the application. | Add `hsts: { maxAge: 31536000, includeSubDomains: true }` to Helmet config. Add `Referrer-Policy: strict-origin-when-cross-origin`. | Hardening Design, Section 7 |
| 3 | **No session termination / token blacklist** | 8.1.8 | JWTs cannot be revoked before natural expiration. No logout endpoint exists that invalidates the server-side session. | Add `revoked_tokens` table. `POST /v1/auth/logout` adds token hash to blacklist. `authPlugin` checks blacklist on every request. Daily prune of expired entries. | Hardening Design, Section 6 |
| 4 | **Audit log integrity not verifiable** | 10.5.5 | Audit logs exist and are comprehensive, but there is no tamper-detection mechanism. A database administrator could modify or delete entries without detection. | Add `prev_hash` and `record_hash` columns to `audit_log`. Compute SHA-256 chain per tenant on insert. Add `GET /v1/compliance/audit/verify` endpoint. | Hardening Design, Section 1 |
| 5 | **Rate limiting is IP-only** | 6.5.10 | `@fastify/rate-limit` at 60 req/min globally, with per-route overrides on Stripe endpoints. But limits are per-IP, not per-tenant. A single tenant could exhaust shared limits. | Add `rate_limit_buckets` DB table. Implement per-tenant rate limiting with tiered limits (auth: 10/min, mutation: 30/min, read: 120/min). Fall back to IP for unauthenticated routes. | Hardening Design, Section 4 |
| 6 | **Incomplete input validation** | 6.5.1 | 12 route files use Zod schemas (92 usages). However, approximately 30 route files still contain `as any` body casts (255 occurrences) with no schema validation. | Sweep all routes to add Zod schemas. Standardize error format. Add `sanitizeHtml()` for user-generated content. | Hardening Design, Section 5 |
| 7 | **RLS not fully enforced** | 7.1 | RLS enabled on 9 tables but without `FORCE ROW LEVEL SECURITY`. Superuser connection bypasses policies unless `withTenant()` is explicitly called. Not all routes use `withTenant()`. | Phase 3: add `FORCE ROW LEVEL SECURITY`. Widen `withTenant()` adoption to all tenant-scoped queries. Add RLS to 3 more tables (`consent_records`, `data_subject_requests`, `data_breaches`). | Hardening Design, Section 3 |
| 8 | **No external vulnerability scans** | 11.3.1 | Not yet performed. No scan vendor selected. | Establish quarterly external scan cadence. Evaluate ASV-approved scanning vendors. | N/A |

---

## 6. Evidence References

### 6.1 Code Artifacts

| Artifact | File Path | Description |
|---|---|---|
| Stripe routes (RBAC, Zod, rate limits) | `backend/src/routes/stripeRoutes.ts` | Product creation, checkout session, portal, subscription webhook |
| Webhook signature verification | `backend/src/integrations/stripe.client.ts` (lines 124-153) | HMAC-SHA256 with timing-safe comparison and 300s replay window |
| Helmet + CORS + global rate limit | `backend/src/server.ts` (lines 149-191) | Security headers, origin whitelist, 60 req/min default |
| CSRF plugin (disabled) | `backend/src/plugins/csrfPlugin.ts` | Double-submit cookie pattern; not registered |
| Auth plugin (JWT) | `backend/src/plugins/authPlugin.ts` | Bearer token extraction and validation |
| Tenant plugin | `backend/src/plugins/tenantPlugin.ts` | `x-tenant-id` header extraction |
| Audit plugin | `backend/src/plugins/auditPlugin.ts` | Mutation logging to `audit_log` table |
| RLS migration | `backend/prisma/migrations/20260228120000_rls_policies/migration.sql` | Row-Level Security on 9 tables |
| RLS helper | `backend/src/db/prisma.ts` (lines 30-41) | `withTenant()` transaction wrapper |
| Env configuration | `backend/src/env.ts` | All Stripe env var definitions |

### 6.2 Stripe Attestation

Stripe maintains **PCI DSS Level 1** certification -- the highest level of PCI compliance, independently audited annually by a Qualified Security Assessor (QSA).

- **Stripe PCI documentation:** https://stripe.com/docs/security
- **Scope of Stripe's AOC:** All cardholder data collection, processing, storage, and transmission; tokenization infrastructure; Stripe Checkout and Stripe Elements; Stripe API endpoints; Stripe internal network and data center security.
- **Atlas UX obligation:** Verify Stripe's AOC currency during the Q2 vendor review cycle (see `policies/VENDOR_MANAGEMENT.md`).

### 6.3 Infrastructure

| Component | Provider | Security Posture |
|---|---|---|
| Backend compute | Render | PaaS with managed TLS termination, no shell access, platform-level network isolation |
| Frontend CDN | Vercel | HTTPS enforced on all deployments, edge caching, DDoS protection |
| Database | Supabase (PostgreSQL 16) | Encrypted at rest, TLS in transit, RLS policies applied |
| Payment processor | Stripe | PCI DSS Level 1 certified |

---

## 7. SAQ Type Escalation Triggers

Atlas UX currently qualifies for SAQ-A. The following changes would require reassessment of the applicable SAQ type:

| Change | New SAQ Type | Action Required |
|---|---|---|
| Embedding Stripe Elements iframes on Atlas UX pages (instead of redirect to Stripe Checkout) | **SAQ A-EP** | Additional XSS protections become PCI-relevant; CSP must explicitly allow Stripe frame/script sources; page hosting the iframe must be secured |
| Building a custom payment form that touches raw card numbers | **SAQ D** | Full PCI DSS assessment required -- **do not implement this** |
| Storing card data for recurring billing (instead of Stripe's stored payment methods) | **SAQ D** | Full PCI DSS assessment -- **do not implement this** |
| Adding a second payment processor alongside Stripe | **SAQ-A** (if also fully outsourced) | Update this document; verify new processor's AOC |
| Processing payments server-side with raw card data (e.g., direct API calls with PAN) | **SAQ D** | Full PCI DSS assessment -- **do not implement this** |

**Policy:** Atlas UX will not implement any payment flow that requires handling raw cardholder data. All card data collection, storage, and transmission must remain fully outsourced to Stripe. Any proposed change to the payment architecture must be reviewed against this policy before implementation.

---

## 8. Webhook Security Detail

The Stripe subscription webhook endpoint (`POST /v1/stripe/subscription-webhook`) implements the following security measures:

1. **Raw body preservation:** The webhook route uses a scoped Fastify plugin with a custom content type parser (`parseAs: "string"`) that preserves the raw body string for signature verification. Stripe's signature is computed over the exact bytes received, not parsed JSON.

2. **Signature verification:** `stripeConstructWebhookEvent()` in `stripe.client.ts` performs:
   - Parsing of the `Stripe-Signature` header to extract timestamp (`t`) and signature (`v1`)
   - HMAC-SHA256 computation: `HMAC(STRIPE_SUB_WEBHOOK_SECRET, "${timestamp}.${rawBody}")`
   - **Timing-safe comparison** via `crypto.timingSafeEqual()` to prevent timing side-channel attacks
   - **Replay protection:** Rejects payloads where the timestamp deviates more than 300 seconds from server time

3. **Secret management:** `STRIPE_SUB_WEBHOOK_SECRET` is loaded from process environment via `loadEnv()`, stored in Render environment variables, and never committed to source code.

4. **No cardholder data in webhooks:** Stripe webhooks contain event metadata (customer IDs, subscription IDs, amounts, statuses) but never contain full card numbers or CVVs.

---

## 9. Incident Response for Payment Events

If a payment-related security incident is suspected:

1. **`STRIPE_SECRET_KEY` compromised:** Follow `INCIDENT_RESPONSE.md` Section 8.4. Immediately rotate in Stripe dashboard. Update the key on all four Render services (web, email-worker, engine-worker, scheduler). Also rotate `STRIPE_WEBHOOK_SECRET` and `STRIPE_SUB_WEBHOOK_SECRET`, then re-register webhook endpoints in Stripe.

2. **Unauthorized Stripe API calls detected:** Check Stripe dashboard API logs. Rotate all Stripe keys. Review `audit_log` for `STRIPE_PRODUCT_REQUESTED` and `STRIPE_PRODUCT_CREATED` actions to identify unauthorized operations.

3. **Webhook tampering suspected:** Verify that `stripeConstructWebhookEvent()` in `stripe.client.ts` is functioning correctly. Check Fastify logs for requests that fail signature verification. Rotate `STRIPE_SUB_WEBHOOK_SECRET` and update in Stripe dashboard.

4. **Customer reports unauthorized charge:** Investigate via Stripe dashboard. Cross-reference with Atlas UX `audit_log` and `ledger_entry` records for the payment intent. Follow Stripe's dispute resolution process.

---

## 10. Annual Assessment Schedule

| Month | Activity | Owner |
|---|---|---|
| January | Begin SAQ-A self-assessment for prior year | Compliance Officer |
| February | Complete SAQ-A; file with acquiring bank if required | Compliance Officer |
| March | Verify Stripe's current AOC/ROC is valid | Compliance Officer |
| June | Mid-year review: verify webhook signature implementation intact; review Stripe-related audit logs; confirm no cardholder data in any log or DB table | Engineering Lead |
| September | Quarterly external vulnerability scan (if required by acquirer) | Engineering Lead |
| December | Pre-assessment preparation; review all Stripe-related code changes from the year; verify no cardholder data has been inadvertently stored or logged | Engineering Lead + Compliance |

---

## 11. Document History

| Date | Change | Author |
|---|---|---|
| 2026-02-27 | Initial PCI DSS compliance documentation | DEAD APP CORP |
| 2026-03-01 | Rewritten to v4.0 requirement mapping format with honest status assessments, gap analysis, code-level evidence references, and alignment with compliance hardening design | DEAD APP CORP |

---

**Contact:**
- **Compliance:** compliance@atlasux.com
- **Security:** security@deadapp.info
- **Billing issues:** support@deadapp.info
