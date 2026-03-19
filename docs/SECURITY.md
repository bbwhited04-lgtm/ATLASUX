# Security

## Authentication

### JWT Flow

Self-managed JWT auth using the `jose` library (HS256 symmetric signing).

1. **Registration:** `POST /v1/auth/register` hashes password with bcrypt (cost 12), creates User, returns signed JWT.
2. **Login:** `POST /v1/auth/login` validates bcrypt hash, returns signed JWT.
3. **JWT claims:** `{ sub: userId, email, iss: "atlasux", aud: "atlasux-api", iat, exp }`. Expires in 7 days.
4. **Verification:** `authPlugin` verifies every request's Bearer token against `JWT_SECRET`.

### Token Revocation

Compliant with HIPAA 164.312(d), NIST IA-11, SOC 2 CC6.1, PCI 8.1.8.

- `POST /v1/auth/logout` computes SHA-256 of the JWT and stores it in `revoked_tokens`.
- `authPlugin` checks the blacklist on every request. If the hash is found and not expired, the request is rejected (401).
- Fail-closed: if the blacklist check fails (DB error), the request returns 503 rather than allowing access.
- Expired blacklist entries are pruned daily via `setInterval`.

### Gate Codes (Cloud Seats)

Pre-auth access gate for the SPA. Gate codes are 256-bit random hex strings stored in `cloud_seats`. Validation uses `crypto.timingSafeEqual` to prevent timing attacks. Codes can be revoked instantly via the admin API.

---

## CSRF Protection

**Mechanism:** DB-backed synchronizer token pattern (stateless cross-origin safe, no cookies).

**Controls:** PCI DSS 6.5.9, NIST SC-23, HITRUST 09.m, SOC 2 CC6.6, ISO A.14.1.2

**Flow:**

1. Backend generates 32-byte random token, stores in `oauth_state` table (1-hour TTL).
2. Token sent to frontend via `x-csrf-token` response header.
3. Frontend captures token and sends it back on all mutating requests (POST/PUT/PATCH/DELETE).
4. Backend validates token exists in DB and belongs to the authenticated user.

**Frontend implementation** (`src/lib/api.ts`):

```typescript
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  // Automatically attaches csrfToken to mutating requests
  // Automatically captures new csrfToken from responses
}
```

**Exempt routes** (webhooks, OAuth callbacks, public endpoints):

```
/v1/stripe/subscription-webhook
/v1/twilio/sms/inbound, /voice/inbound, /voice/status, /voice/recording
/v1/elevenlabs/tool/*, /webhook/*
/v1/oauth/*
/v1/gate/validate
/v1/health
```

---

## Credential Encryption

**Algorithm:** AES-256-GCM (authenticated encryption)

**Key:** `TOKEN_ENCRYPTION_KEY` env var — 64 hex characters (32 bytes)

**Format:** `iv:tag:ciphertext` (all hex-encoded). Fits existing TEXT/VARCHAR columns.

```
12-byte IV : 16-byte auth tag : variable ciphertext
(24 hex)   : (32 hex)         : (variable hex)
```

**Behavior:**
- When `TOKEN_ENCRYPTION_KEY` is set: all tenant credentials are encrypted at rest in `tenant_credentials.key`.
- When not set: passthrough mode (plaintext) for backward compatibility during migration.
- `isEncrypted()` detects format to avoid double-encryption.
- Decryption is transparent via `credentialResolver.ts` which calls `decryptToken()`.

Source: `backend/src/lib/encryption.ts`

---

## Webhook Validation

### Twilio

HMAC-SHA1 signature validation on all inbound webhooks:

```typescript
function validateTwilioSignature(authToken, signature, url, params): boolean
```

Sorts params alphabetically, concatenates with URL, computes HMAC-SHA1, compares with `crypto.timingSafeEqual`. Falls back to canonical base URL if proxy alters host/proto.

### Stripe

Stripe signature verification via `stripe.webhooks.constructEvent()` with `STRIPE_SUB_WEBHOOK_SECRET`. Raw body parsing is scoped to the webhook sub-plugin to avoid interfering with JSON routes.

### ElevenLabs

Shared secret validation via `x-webhook-secret` or `x-elevenlabs-secret` header. Uses `crypto.timingSafeEqual`.

### Discord

Ed25519 signature verification on `/v1/discord/webhook`:
- Public key from `DISCORD_PUBLIC_KEY` env var
- Verifies `x-signature-ed25519` + `x-signature-timestamp` headers
- Raw body (Buffer) parsing in scoped plugin

---

## Input Validation

- **Zod schemas** on all route bodies (strict parsing, max lengths enforced)
- **UUID regex validation** on tenant IDs before use in RLS session variables
- **File uploads:** MIME whitelist (images, PDFs, office docs, audio, video), virus scanning via VirusTotal (`VIRUS_SCAN_ENABLED`)
- **PII redaction:** `lib/piiRedact.ts` for log sanitization

---

## Audit Trail & Hash Chain

**Controls:** SOC 2 CC7.2, NIST AU-10

Every API request is logged to `audit_log` via `auditPlugin` (onSend hook). Noisy endpoints (`/health`, successful GETs) are skipped.

### Hash Chain (Tamper Detection)

Each audit entry includes:
- `prev_hash` — SHA-256 hash of the previous entry in the chain
- `record_hash` — SHA-256 of `(prev_hash | tenant_id | action | entity_id | timestamp | actor_user_id)`

The chain starts from a genesis hash (`0` * 64). Verification via `verifyAuditChain(tenantId)` walks the entire chain and reports broken links.

**Fallback:** If the DB write fails, audit entries are written to stderr as JSON to ensure events are never lost.

Source: `backend/src/lib/auditChain.ts`

---

## Rate Limiting

### Global

`@fastify/rate-limit` — 60 requests per minute per IP.

### Per-Tenant

`tenantRateLimitPlugin` — In-memory sliding window counters:

| Tier | Methods | Limit |
|------|---------|-------|
| read | GET, HEAD, OPTIONS | 120/min |
| mutation | POST, PUT, PATCH, DELETE | 30/min |

Stale buckets pruned every 5 minutes.

### Per-Route

Individual routes can override with tighter limits:
- Chat: 30/min
- Stripe product creation: 5/min
- Stripe product request: 10/min
- Decision approval: 10/min

**Controls:** PCI DSS 6.5.10, NIST SC-5, SOC 2 CC6.6, ISO A.13.1.1, HITRUST 09.m

---

## CORS

Strict origin whitelist:

```
https://www.atlasux.cloud
https://atlasux.cloud
```

Development adds `http://localhost:5173` and `http://localhost:3000`.

Exposed headers: `x-csrf-token`. Credentials mode enabled.

---

## HTTP Security Headers

Via `@fastify/helmet`:

| Header | Value | Control |
|--------|-------|---------|
| Content-Security-Policy | Strict directives (self, specific CDNs) | XSS prevention |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | PCI 4.1, NIST SC-8 |
| Referrer-Policy | strict-origin-when-cross-origin | GDPR Art. 32 |
| X-Frame-Options | Deny (via frameSrc: none) | Clickjacking |
| X-Content-Type-Options | nosniff | MIME sniffing |

---

## Log Redaction

Fastify logger redacts sensitive headers:

```
req.headers.authorization
req.headers.cookie
req.headers.x-csrf-token
req.headers.x-gate-admin-key
req.headers.x-inbound-secret
req.headers.x-webhook-secret
req.headers.x-elevenlabs-secret
```

---

## Compliance Coverage

| Framework | Key Controls |
|-----------|-------------|
| HIPAA | Token revocation (164.312d), audit trail, PHI data class in SGL |
| PCI DSS | CSRF (6.5.9), rate limiting (6.5.10), HSTS (4.1), input validation (6.5.1) |
| SOC 2 | Audit hash chain (CC7.2), access control (CC6.1), rate limiting (CC6.6) |
| NIST 800-53 | Token lifecycle (IA-11), transport security (SC-8), rate limiting (SC-5), audit integrity (AU-10), CSRF (SC-23) |
| ISO 27001 | Rate limiting (A.13.1.1), CSRF (A.14.1.2) |
| GDPR | Data deletion callbacks (Meta, Google), DSAR endpoints, consent records, breach register, referrer policy (Art. 32) |
| HITRUST CSF | CSRF (09.m), rate limiting (09.m) |

See `policies/` directory for detailed compliance documentation per framework.
