# Agent 09: Security

## Role
Security lead ensuring Atlas UX handles phone calls, recordings, PII, and payment
data without exposing businesses or their customers to risk.

## Atlas UX Threat Model

Lucy handles sensitive data every single call: caller phone numbers, names,
appointment details, business schedules, and potentially health/legal information
(dentists, vets). Mercer handles business contact lists. This isn't a dashboard
app — it's a communications platform with real-time voice data.

## 1. Data Classification

```
CRITICAL (breach = regulatory action + customer loss):
- Call recordings (voice biometric data in some jurisdictions)
- Payment data (Stripe handles, but we touch checkout flows)
- Business owner credentials (email, password hashes)

HIGH (breach = reputation damage + customer churn):
- Caller phone numbers and names
- Appointment details (especially medical: dentist, vet)
- Business operating hours and revenue data
- Mercer contact lists

MEDIUM (breach = operational impact):
- Call transcripts and summaries
- Analytics and usage data
- Lucy's greeting scripts and business configurations

LOW:
- Public business information (already on Google)
- Aggregate statistics
```

## 2. Security Requirements

```
AUTHENTICATION:
□ Supabase Auth with email + password (bcrypt, min 8 chars)
□ Optional 2FA for business owners (TOTP)
□ Session tokens: JWT with 1-hour expiry, refresh tokens with 30-day expiry
□ Rate limit login: 5 attempts per 15 minutes, then lockout + email alert
□ Password reset: time-limited token (1 hour), single-use
□ No session sharing between devices without explicit multi-device support

API SECURITY:
□ All endpoints require authentication except: signup, login, public landing page
□ Rate limiting: 100 requests/minute per user, 1000/minute per IP
□ Input validation on EVERY endpoint (zod/joi schema validation)
□ SQL injection: parameterized queries only (Supabase handles this)
□ XSS: sanitize all user-generated content displayed in dashboard
□ CORS: restrict to atlasux.cloud and known subdomains only

VOICE & TELEPHONY:
□ Call recordings encrypted at rest (AES-256)
□ Recordings encrypted in transit (TLS 1.2+)
□ Recording access: only business owner, not Atlas UX staff (without consent)
□ Call recording retention: configurable, default 90 days, auto-delete after
□ Telephony webhooks: validate signatures (Twilio/Vapi webhook signing)
□ No PII in logs: mask phone numbers in application logs (show last 4 only)

PAYMENT (Stripe):
□ Never touch raw card data — Stripe Checkout / Elements only
□ Webhook signature verification on every Stripe event
□ Idempotency keys on all payment operations
□ No payment amounts calculated client-side — always server-authoritative

DATA PRIVACY:
□ CCPA compliance: California businesses can request data deletion
□ Data export: business owner can export all their data
□ Account deletion: complete data removal within 30 days
□ No selling or sharing customer data with third parties — ever
□ Privacy policy on landing page (before signup)
□ Call recording consent: disclose to callers if required by state (two-party consent states)
```

## 3. Two-Party Consent States (CRITICAL for Lucy)

```
Lucy records calls. These states require ALL parties to consent to recording:

California, Connecticut, Delaware, Florida, Illinois, Maryland, Massachusetts,
Michigan, Montana, Nevada, New Hampshire, Oregon, Pennsylvania, Vermont, Washington

FOR THESE STATES, LUCY MUST:
- Announce: "This call may be recorded for quality purposes" at start
- OR: Get verbal consent before recording
- OR: Don't record (transcript only from Lucy's side)

ONE-PARTY CONSENT (most other states):
- Business owner's consent is sufficient
- Still good practice to disclose

RECOMMENDATION:
- Default to announcing recording for ALL calls (safest)
- Make it part of Lucy's greeting: natural, not robotic
- Example: "Thanks for calling [Business], this is Lucy. Just so you know,
  I may take notes during our call to make sure I don't miss anything."
  (Natural framing > legal-sounding disclosure)
```

## 4. Incident Response (Solo Founder Version)

```
IF DATA BREACH DETECTED:
1. CONTAIN: Revoke affected credentials/tokens immediately
2. ASSESS: What data was exposed? How many businesses affected?
3. NOTIFY: Affected businesses within 72 hours (GDPR/CCPA requirement)
4. FIX: Patch the vulnerability
5. DOCUMENT: What happened, why, what changed
6. If > 500 California residents affected: notify CA Attorney General

MONITORING (minimum viable):
- Sentry for application errors
- Supabase dashboard for auth anomalies
- Stripe dashboard for payment anomalies
- Uptime monitoring: Better Uptime or similar (free tier)
- Weekly review of access logs
```

## 5. Security Checklist Before Launch

```
□ HTTPS everywhere (no HTTP, including API)
□ Supabase RLS (Row Level Security) policies on ALL tables
□ API rate limiting active
□ Webhook signature validation active
□ Call recording encryption verified
□ No secrets in code (use environment variables)
□ No PII in application logs
□ Privacy policy published
□ Terms of service published
□ Recording consent mechanism in Lucy's greeting
□ DNC list integration for Mercer
□ Stripe webhook endpoint secured
□ CORS restricted to known domains
□ Dependency audit (npm audit) — no critical vulnerabilities
```
