# Atlas UX — PCI DSS Compliance Documentation

**Effective Date:** February 27, 2026
**Last Updated:** February 27, 2026
**Owner:** DEAD APP CORP
**Scope:** All payment processing activities within Atlas UX
**SAQ Type:** SAQ-A (Card-Not-Present, All Cardholder Data Functions Fully Outsourced)

---

## 1. Purpose

This document records Atlas UX's PCI DSS compliance posture. Atlas UX uses Stripe as its sole payment processor. **No cardholder data (card numbers, CVVs, expiration dates) ever touches Atlas UX servers, databases, or application code.** All cardholder data is collected, processed, stored, and transmitted exclusively by Stripe.

Atlas UX qualifies for **SAQ-A** (Self-Assessment Questionnaire A) — the simplest PCI DSS compliance category, applicable to merchants that have fully outsourced all cardholder data functions to a PCI DSS-validated third-party service provider.

---

## 2. SAQ-A Scope Definition

### 2.1 What Is In Scope

- The Atlas UX frontend (Vercel) that redirects users to Stripe Checkout or embeds Stripe Elements
- The Atlas UX backend (Render) that receives Stripe webhook events containing payment metadata
- The `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` stored as environment variables on Render
- The Stripe API calls made from `backend/src/integrations/stripe.client.ts`, `backend/src/routes/stripeRoutes.ts`, and `backend/src/routes/billingWebhookRoutes.ts`

### 2.2 What Is NOT In Scope (Handled Entirely by Stripe)

- Card number entry and validation
- Card data storage
- Card data transmission to card networks
- Tokenization of card data
- PCI DSS Level 1 compliance for cardholder data environment

### 2.3 Cardholder Data Atlas UX Never Receives

| Data Element | Received by Atlas UX? | Notes |
|-------------|----------------------|-------|
| Primary Account Number (PAN) | **No** | Never touches our systems |
| Cardholder Name | **No** | Collected by Stripe only |
| Expiration Date | **No** | Collected by Stripe only |
| CVV/CVC | **No** | Collected by Stripe only; Stripe does not store this either |
| Card Brand | Yes (metadata only) | Received in webhook events as `card.brand` — not cardholder data under PCI DSS |
| Last 4 Digits | Yes (metadata only) | Received in webhook events as `card.last4` — not considered cardholder data when isolated |

---

## 3. Data Flow Diagram

```
                    ATLAS UX PAYMENT DATA FLOW

    ┌──────────────────────────────────────────────────┐
    │                    USER BROWSER                   │
    │                                                    │
    │  1. User clicks "Subscribe" or "Purchase"         │
    │  2. Frontend redirects to Stripe Checkout         │
    │     (or renders Stripe Elements iframe)           │
    │  3. Card data entered directly into Stripe's      │
    │     PCI-compliant iframe — NEVER touches          │
    │     Atlas UX JavaScript                           │
    └──────────────┬───────────────────────────────────┘
                   │
                   │ Card data goes directly to Stripe
                   │ (Stripe.js / Stripe Checkout hosted page)
                   ▼
    ┌──────────────────────────────────────────────────┐
    │                   STRIPE (PCI L1)                 │
    │                                                    │
    │  4. Stripe processes the payment                  │
    │  5. Stripe tokenizes and stores card data         │
    │  6. Stripe communicates with card networks        │
    │  7. Stripe sends webhook event to Atlas UX        │
    │     backend with payment result metadata:         │
    │     - payment_intent.id                           │
    │     - customer.id                                 │
    │     - amount, currency, status                    │
    │     - card.brand, card.last4 (metadata only)      │
    └──────────────┬───────────────────────────────────┘
                   │
                   │ Webhook POST with Stripe-Signature header
                   │ (contains metadata, NEVER card numbers)
                   ▼
    ┌──────────────────────────────────────────────────┐
    │              ATLAS UX BACKEND (Render)             │
    │                                                    │
    │  8. billingWebhookRoutes.ts receives webhook      │
    │  9. Verifies Stripe-Signature using HMAC-SHA256   │
    │     (verifyStripeSignature function with           │
    │      timing-safe comparison)                      │
    │ 10. Processes event (updates subscription status,  │
    │     creates ledger entries, logs to audit_log)    │
    │ 11. Stores only: payment_intent.id, customer.id,  │
    │     amount, currency, status                      │
    │                                                    │
    │  NEVER STORES: card numbers, CVVs, PANs           │
    └──────────────┬───────────────────────────────────┘
                   │
                   │ Prisma ORM writes to Supabase
                   ▼
    ┌──────────────────────────────────────────────────┐
    │            SUPABASE (PostgreSQL)                   │
    │                                                    │
    │ 12. Stores: stripe_customer_id, subscription      │
    │     status, payment_intent references, ledger     │
    │     entries, audit log entries                     │
    │                                                    │
    │ NEVER STORES: card numbers, CVVs, PANs            │
    └──────────────────────────────────────────────────┘
```

**Key point:** The cardholder data environment (CDE) exists entirely within Stripe's infrastructure. Atlas UX is outside the CDE boundary.

---

## 4. PCI DSS 4.0 Requirements — Atlas UX Applicability (SAQ-A)

SAQ-A merchants are responsible for a subset of PCI DSS requirements. Below maps each applicable requirement to Atlas UX's implementation.

### Requirement 1: Install and Maintain Network Security Controls

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 1.2.1 | Restrict inbound/outbound traffic to CDE | N/A — Atlas UX has no CDE. Stripe's CDE is managed by Stripe. | N/A |

**SAQ-A note:** Network security controls for the CDE are Stripe's responsibility. Atlas UX manages its own infrastructure security through Render's platform controls and Fastify's `@fastify/helmet` middleware.

### Requirement 2: Apply Secure Configurations to All System Components

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 2.2.7 | Encrypt non-console administrative access | All Render dashboard access over HTTPS. All Supabase access over HTTPS. SSH not used (Render is PaaS). | Compliant |

### Requirement 3: Protect Stored Account Data

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 3.1.1 | Keep stored account data to minimum | Atlas UX stores zero cardholder data. Only Stripe reference IDs (customer ID, payment intent ID) are stored. | Compliant |
| 3.2.1 | Do not store sensitive authentication data after authorization | Atlas UX never receives sensitive authentication data (CVV, full track data, PINs). | Compliant |

### Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 4.2.1 | Strong cryptography for cardholder data transmission | Card data is transmitted from user browser directly to Stripe over TLS 1.2+. Atlas UX never transmits cardholder data. | Compliant |

**Additional note:** All Atlas UX API communication uses HTTPS (enforced by Render and Vercel). The Fastify server uses `@fastify/helmet` for security headers. Stripe webhook communication uses HTTPS with HMAC-SHA256 signature verification.

### Requirement 5: Protect All Systems and Networks from Malicious Software

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 5.2.1 | Anti-malware solution deployed | Render manages OS-level security for hosted services. Atlas UX application dependencies are audited via `npm audit`. | Compliant (platform-managed) |

### Requirement 6: Develop and Maintain Secure Systems and Software

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 6.2.4 | Software engineering techniques prevent common vulnerabilities | Zod schema validation on all inputs (`stripe.client.ts`, `stripeRoutes.ts`); parameterized Prisma queries (no SQL injection); `@fastify/helmet` security headers; CORS configured via `@fastify/cors`; rate limiting via `@fastify/rate-limit` | Compliant |
| 6.3.1 | Security vulnerabilities identified and addressed | `npm audit` run periodically; dependency updates tracked; security patches prioritized | Compliant |
| 6.4.1 | Public-facing web applications protected | Fastify rate limiting on payment routes (`max: 10, timeWindow: "1 minute"` on `/v1/stripe/products/request`); webhook signature verification with timing-safe comparison; input validation on all request bodies | Compliant |

### Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 7.2.1 | Access control model defined | `STRIPE_SECRET_KEY` access limited to backend services only (never exposed to frontend). Route-level role checking (`requireRole` function) restricts Stripe operations to `owner`, `admin`, `exec`, `atlas` roles. | Compliant |
| 7.2.2 | Access assigned based on job function | Stripe dashboard access limited to team leads. Render env var access limited to deployment administrators. | Compliant |

### Requirement 8: Identify Users and Authenticate Access to System Components

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 8.2.1 | Unique IDs for all users | JWT-based authentication via `authPlugin.ts`; each user has unique `userId`; all Stripe operations logged with actor identity in `audit_log` | Compliant |
| 8.3.1 | Authentication factors for all access | JWT token required for all authenticated API routes; Render dashboard requires account authentication; Stripe dashboard requires 2FA | Compliant |
| 8.6.1 | Application and system accounts managed | `STRIPE_SECRET_KEY` is a service account credential; stored in Render env vars; not embedded in source code; rotatable via Stripe dashboard | Compliant |

### Requirement 9: Restrict Physical Access to Cardholder Data

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 9.x | Physical access controls | N/A — Atlas UX is fully cloud-hosted (Render, Vercel, Supabase). No physical servers. Physical security is the responsibility of cloud providers. | N/A (cloud) |

### Requirement 10: Log and Monitor All Access to System Components and Cardholder Data

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 10.2.1 | Audit logs capture all access to cardholder data | Atlas UX logs all Stripe-related operations to `audit_log` table: product requests (`STRIPE_PRODUCT_REQUESTED`), webhook events processed, payment status changes. No cardholder data is logged. | Compliant |
| 10.4.1 | Audit logs reviewed | Audit logs accessible via `/v1/audit` routes and Agent Watcher (`/app/watcher`) with 4-second polling. 24-month retention per `DATA_RETENTION.md`. | Compliant |

### Requirement 11: Test Security of Systems and Networks Regularly

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 11.3.1 | External vulnerability scans | Scheduled quarterly. Render platform provides infrastructure-level scanning. | In Progress |
| 11.3.2 | Internal vulnerability scans | `npm audit` and dependency review. Application-level security testing. | Compliant |

### Requirement 12: Support Information Security with Organizational Policies and Programs

| Sub-Req | Requirement | Atlas UX Implementation | Status |
|---------|------------|------------------------|--------|
| 12.1.1 | Information security policy established | This document, plus `SOC2_COMPLIANCE.md`, `RISK_MANAGEMENT.md`, `INCIDENT_RESPONSE.md`, `VENDOR_MANAGEMENT.md`, `DATA_RETENTION.md` | Compliant |
| 12.3.1 | Risk assessment performed annually | Risk register maintained in `RISK_MANAGEMENT.md` with quarterly reviews; Stripe-specific risks documented as RISK-004 | Compliant |
| 12.8.1 | Policies for managing service providers | `VENDOR_MANAGEMENT.md` — Stripe classified as High risk vendor with semi-annual review | Compliant |
| 12.10.1 | Incident response plan | `INCIDENT_RESPONSE.md` — includes API key compromise runbook relevant to `STRIPE_SECRET_KEY` | Compliant |

---

## 5. Stripe Attestation of Compliance (AOC)

Stripe maintains **PCI DSS Level 1** certification — the highest level of PCI compliance. This is independently audited annually by a Qualified Security Assessor (QSA).

**Stripe's PCI AOC is available at:** https://stripe.com/docs/security

**What Stripe's AOC covers:**
- All cardholder data collection, processing, storage, and transmission
- Tokenization infrastructure
- Stripe Checkout and Stripe Elements (the card input forms)
- Stripe API endpoints that handle card data
- Stripe's internal network and data center security

**Atlas UX responsibility:** Verify Stripe's AOC is current during annual vendor review (see `VENDOR_MANAGEMENT.md` Q2 review cycle).

---

## 6. Security Headers and Frontend Requirements

Since Atlas UX may embed Stripe Elements (iframes) or redirect to Stripe Checkout, the following security configurations apply:

### 6.1 Content Security Policy (CSP)

The frontend must allow Stripe's domains in its CSP:
```
frame-src: https://js.stripe.com https://hooks.stripe.com
script-src: https://js.stripe.com
connect-src: https://api.stripe.com
```

### 6.2 Fastify Helmet Configuration

The backend uses `@fastify/helmet` which sets:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (on non-Stripe pages)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-XSS-Protection: 0` (modern browsers use CSP instead)

### 6.3 HTTPS Enforcement

- **Vercel:** HTTPS enforced by default on all deployments
- **Render:** HTTPS enforced by default on all web services
- **Stripe webhooks:** Delivered over HTTPS only; verified via `Stripe-Signature` header with HMAC-SHA256

### 6.4 Stripe.js Integrity

When loading Stripe.js (`https://js.stripe.com/v3/`):
- Always load from Stripe's CDN, never self-host
- Stripe.js is served with Subresource Integrity (SRI) support
- Never log or intercept data entered into Stripe Elements iframes

---

## 7. Webhook Security

The Stripe webhook endpoint (`POST /v1/billing/stripe/webhook`) implements the following security measures as coded in `billingWebhookRoutes.ts`:

1. **Signature verification:** Every webhook payload is verified against the `Stripe-Signature` header using `STRIPE_WEBHOOK_SECRET`. The verification uses:
   - HMAC-SHA256 for signature computation
   - Timing-safe comparison (`timingSafeEqual`) to prevent timing attacks
   - Timestamp tolerance check (default 300 seconds) to prevent replay attacks

2. **Raw body parsing:** The webhook route uses a custom content type parser that preserves the raw `Buffer` for signature verification (the Stripe signature is computed over the raw bytes, not parsed JSON).

3. **No cardholder data in webhooks:** Stripe webhooks contain event metadata (payment intent IDs, amounts, statuses) but never contain full card numbers or CVVs.

4. **Secret management:** `STRIPE_WEBHOOK_SECRET` is stored as a Render environment variable, never in source code.

---

## 8. Responsibility Matrix

| Responsibility | Stripe | Atlas UX |
|---------------|--------|----------|
| Collect card numbers | Stripe | -- |
| Store card numbers | Stripe | -- |
| Transmit card numbers to networks | Stripe | -- |
| Tokenize card data | Stripe | -- |
| PCI DSS Level 1 audit | Stripe | -- |
| Secure `STRIPE_SECRET_KEY` | -- | Atlas UX |
| Verify webhook signatures | -- | Atlas UX |
| Not log cardholder data | -- | Atlas UX |
| Maintain SAQ-A compliance | -- | Atlas UX |
| Audit Stripe's AOC annually | -- | Atlas UX |
| Secure API communication (HTTPS) | Stripe (their endpoints) | Atlas UX (our endpoints) |
| Monitor for fraudulent transactions | Stripe Radar | Atlas UX (business rules) |
| Dispute management | Stripe (tools) | Atlas UX (process) |
| Refund processing | Stripe (API) | Atlas UX (business decision) |
| Customer PII (name, email for receipts) | Stripe stores for receipts | Atlas UX stores for account management |

---

## 9. Annual Assessment Schedule

| Month | Activity | Owner |
|-------|----------|-------|
| **January** | Begin SAQ-A self-assessment for prior year | Compliance Officer |
| **February** | Complete SAQ-A; file with acquiring bank if required | Compliance Officer |
| **March** | Verify Stripe's current AOC/ROC | Compliance Officer |
| **June** | Mid-year review: verify webhook signature implementation is intact; review Stripe-related audit logs | Engineering Lead |
| **September** | Quarterly external vulnerability scan (if required by acquirer) | Engineering Lead |
| **December** | Pre-assessment preparation; review all Stripe-related code changes from the year; verify no cardholder data has been inadvertently stored | Engineering Lead + Compliance |

---

## 10. What Would Change Our SAQ Type

Atlas UX currently qualifies for SAQ-A. The following changes would require reassessment:

| Change | New SAQ Type | Action Required |
|--------|-------------|-----------------|
| Embedding Stripe Elements (iframes) on our page instead of Stripe Checkout redirect | **SAQ A-EP** | Additional requirements for securing the page that hosts the iframe; XSS protections become PCI-relevant |
| Building a custom payment form that touches card numbers | **SAQ D** | Full PCI DSS assessment required; do not do this |
| Storing card data for recurring billing (instead of using Stripe's stored payment methods) | **SAQ D** | Full PCI DSS assessment; do not do this |
| Adding a second payment processor alongside Stripe | **SAQ-A** (if also fully outsourced) | Update this document; verify new processor's AOC |

**Policy:** Atlas UX will not implement any payment flow that requires handling raw cardholder data. All card data collection, storage, and transmission must remain fully outsourced to Stripe.

---

## 11. Incident Response for Payment-Related Incidents

If a payment-related security incident is suspected:

1. **`STRIPE_SECRET_KEY` compromised:** Follow `INCIDENT_RESPONSE.md` Section 8.4. Rotate immediately in Stripe dashboard. Update all Render services. Also rotate `STRIPE_WEBHOOK_SECRET` and re-register the webhook endpoint.

2. **Unauthorized Stripe API calls detected:** Check Stripe dashboard logs. Rotate keys. Review audit logs for the `STRIPE_PRODUCT_REQUESTED` action to identify unauthorized product creation attempts.

3. **Webhook tampering suspected:** Verify that `verifyStripeSignature` in `billingWebhookRoutes.ts` is functioning correctly. Check for requests that fail signature verification (these are logged by Fastify). Rotate `STRIPE_WEBHOOK_SECRET`.

4. **Customer reports unauthorized charge:** Investigate via Stripe dashboard. Cross-reference with Atlas UX `audit_log` for the payment intent. Follow Stripe's dispute process.

---

**Contact:**
- **Compliance:** compliance@atlasux.com
- **Security:** security@deadapp.info
- **Billing issues:** support@deadapp.info

---

**End of Document**
