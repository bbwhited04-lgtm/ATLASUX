---
title: "How We Protect Your Data"
category: "Security & Privacy"
tags: ["security", "encryption", "AES-256", "JWT", "CSRF", "HTTPS", "HSTS"]
related:
  - security-privacy/audit-trail
  - security-privacy/data-privacy
  - security-privacy/caller-data-handling
  - integrations/api-keys
  - integrations/stripe-payments
---

# How We Protect Your Data

Security is built into every layer of Atlas UX. Your business data, customer information, and integration credentials are protected by the same encryption standards used by banks and government agencies. Here is a plain-language overview of what we do and why it matters.

## Encryption at Rest: AES-256-GCM

Every API key and credential you store in Atlas UX (Twilio tokens, ElevenLabs keys, Postiz keys, etc.) is encrypted before it is written to the database using **AES-256-GCM** encryption.

What this means for you:
- Even if someone gained access to the raw database, they would see only encrypted data -- a string of seemingly random characters, not your actual API keys.
- AES-256 is a military-grade encryption standard. "GCM" adds authentication, which means the system can detect if encrypted data has been tampered with.
- The encryption key (TOKEN_ENCRYPTION_KEY) is stored separately from the database, so compromising one does not compromise the other.

For more on credential management, see [API Keys](../integrations/api-keys.md).

## Encryption in Transit: HTTPS Everywhere

All communication between your browser and Atlas UX servers is encrypted using HTTPS (TLS). This prevents anyone from intercepting your data as it travels over the internet.

- **HSTS (HTTP Strict Transport Security)** is enabled with a 1-year max-age, which means browsers are instructed to always use HTTPS -- even if someone types `http://` by mistake.
- **Helmet** security headers are applied to all responses, including strict referrer policies that limit what information is shared with external sites.

## Authentication: JWT Tokens

When you log in to Atlas UX, you receive a **JSON Web Token (JWT)** that proves your identity for subsequent requests.

How it works:
- Tokens are signed using **HS256** (HMAC-SHA256) with a secret key. This means tokens cannot be forged.
- Every token is validated for **issuer** and **audience** claims, ensuring it was created by Atlas UX for Atlas UX.
- **Token revocation** is supported: if you log out or if a token needs to be invalidated, it is added to a revocation list. The system checks this list on every request using a **fail-closed** approach -- if the revocation check fails for any reason, the request is denied. This is safer than the alternative of allowing access when in doubt.
- Expired revoked tokens are automatically cleaned up daily to keep the system fast.

## CSRF Protection

**Cross-Site Request Forgery (CSRF)** is an attack where a malicious website tricks your browser into making unauthorized requests to Atlas UX. We prevent this with a database-backed synchronizer token pattern:

- Every response to a state-changing request includes a unique CSRF token.
- That token is stored in the database with a 1-hour time-to-live (TTL).
- On the next state-changing request, the token must be included and validated. If it is missing or invalid, the request is rejected.
- Webhook endpoints (used by Stripe, ElevenLabs, etc.) are exempt because they use their own authentication methods.

## Webhook Validation

When third-party services like ElevenLabs or Stripe send data to Atlas UX (for example, after a phone call ends or a payment is processed), those requests are validated to ensure they are genuine:

- **ElevenLabs webhooks** are validated using a shared secret with **timing-safe comparison**, which prevents timing attacks that could be used to guess the secret.
- **Stripe webhooks** are validated using Stripe's cryptographic signature verification.

If validation fails, the request is rejected and logged. See [Audit Trail](audit-trail.md) for how these events are tracked.

## Log Redaction

Sensitive information is automatically removed from server logs:

- Authorization headers
- Cookie values
- CSRF tokens
- Gate keys
- Webhook secrets

This means even if server logs were accessed, they would not contain credentials or tokens.

## No Plain-Text Passwords

Atlas UX never stores passwords in plain text. Authentication credentials are hashed before storage, and API keys are encrypted as described above.

## What You Can Do

Security is a partnership. Here is what you can do on your end:

- **Use a strong, unique password** for your Atlas UX account.
- **Do not share API keys** via email or chat. Always enter them through the dashboard.
- **Review the audit trail** periodically for unexpected activity. See [Audit Trail](audit-trail.md).
- **Rotate API keys** if you suspect one has been compromised. See [API Keys](../integrations/api-keys.md).
- **Report security concerns** immediately. See [Getting Help](../troubleshooting/getting-help.md) and include "SECURITY" in the subject.

## Standards and Compliance

Atlas UX's security practices are aligned with:
- **OWASP Top 10** -- Industry-standard web application security guidelines.
- **SOC 2 readiness** -- Our audit trail includes hash chain integrity (see [Audit Trail](audit-trail.md)) for tamper-evident logging.

For details on what data we collect and how it is used, see [Data Privacy](data-privacy.md).


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
