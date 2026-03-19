# Rate Limiting & API Protection Prompts

Prompt templates for auditing rate limit configurations, identifying bypass vectors, reviewing API key validation, and designing tiered rate limiting strategies. Atlas UX implements a three-tier rate limiting system on its wiki endpoints (5/30/120 requests per minute) with hidden limits that don't reveal their thresholds in error responses — a pattern that slows automated enumeration without giving attackers a calibration target.

---

## How to Use

Replace placeholders:
- `{{CODEBASE_PATH}}` — root directory of the project
- `{{FRAMEWORK}}` — Fastify, Express, Django, etc.
- `{{RATE_LIMIT_PLUGIN}}` — rate limiting library/plugin name
- `{{API_BASE_URL}}` — base URL of the API

---

## Rate Limit Configuration Audit

### Prompt: Rate Limit Coverage Scanner
**Use when:** Initial setup review or after adding new endpoints
**Severity if found:** High

```
Audit rate limiting configuration across all endpoints in {{CODEBASE_PATH}}.

Step 1 — Inventory all endpoints and their current rate limits:
| Endpoint | Method | Rate Limit | Window | Key (IP/User/API Key) | Notes |

Step 2 — Identify unprotected endpoints:
- List every endpoint that has NO rate limiting
- Flag these by risk level:
  - CRITICAL: Authentication endpoints (login, register, password reset, token refresh) — brute force target
  - CRITICAL: Payment/billing endpoints — abuse target
  - HIGH: Data creation endpoints (POST) — spam/resource exhaustion
  - HIGH: Search/query endpoints — enumeration/DoS target
  - MEDIUM: Read endpoints (GET) — scraping target
  - LOW: Health check, static assets

Step 3 — Evaluate existing limits:
- Are limits appropriate for the endpoint's purpose? (Login should be 5-10/min, API endpoints 60-120/min)
- Is the rate limit key appropriate? (Per-IP for public, per-user for authenticated, per-API-key for API consumers)
- Is the window size reasonable? (Fixed window, sliding window, or token bucket?)
- What happens when the limit is hit? (429 response with Retry-After header?)

Framework: {{FRAMEWORK}}
Rate limit plugin: {{RATE_LIMIT_PLUGIN}}
```

**Expected output:** Endpoint coverage table with risk-rated gaps and limit appropriateness assessment.

---

## Bypass Vector Detection

### Prompt: Rate Limit Bypass Audit
**Use when:** Verifying rate limits cannot be circumvented by attackers
**Severity if found:** High

```
Test rate limiting in {{CODEBASE_PATH}} for bypass vectors.

Check each bypass technique:

1. IP-based bypass:
   - X-Forwarded-For header spoofing — does the server trust this header from any source? (Should only trust from known proxies)
   - X-Real-IP, X-Client-IP, CF-Connecting-IP header manipulation
   - IPv4 vs IPv6 — are limits applied to both? Can an attacker switch between them?
   - If behind a CDN/proxy, is the real client IP correctly extracted?

2. Key-based bypass:
   - Can creating multiple accounts bypass per-user limits?
   - Can generating multiple API keys bypass per-key limits?
   - Are rate limits shared across API versions? (v1 and v2 of the same endpoint)

3. Endpoint-based bypass:
   - Can the same action be performed via a different endpoint? (REST and GraphQL, web and mobile API)
   - Does changing URL casing bypass the limit? (/api/Login vs /api/login)
   - Does adding trailing slashes or query params create a different rate limit bucket?
   - Are batch/bulk endpoints rate-limited by item count, not just request count?

4. Timing-based bypass:
   - Fixed window vulnerability: sending all requests at the window boundary (end of current + start of next) doubles effective rate
   - Is sliding window or token bucket used instead?

5. Distributed bypass:
   - If rate limits are in-memory, are they shared across server instances? (They should be — use Redis)
   - Can an attacker rotate through a botnet to stay under per-IP limits?

For each bypass found, provide:
- The technique and how to reproduce it
- The fix (header validation, sliding window, global rate store)
```

**Expected output:** Bypass test results with reproduction steps and fixes.

---

## Tiered Rate Limiting Design

### Prompt: Design Tiered Rate Limits
**Use when:** Implementing rate limiting from scratch or redesigning existing limits
**Severity if found:** Medium (design task)

```
Design a tiered rate limiting strategy for the API at {{CODEBASE_PATH}}.

Requirements:
1. Define three tiers of rate limits:
   - Tier 1 (Strict): Authentication, password reset, OTP verification — 5-10 req/min
   - Tier 2 (Moderate): Data creation, updates, deletions — 30-60 req/min
   - Tier 3 (Relaxed): Read operations, search, listing — 120-300 req/min

2. For each endpoint, assign a tier and specify:
   - Rate limit value (requests per window)
   - Window size (1 minute recommended for most)
   - Rate limit key (IP for unauthenticated, user ID for authenticated)
   - Response when limited (429 status, Retry-After header, remaining count headers)

3. Design considerations:
   - Should the limit thresholds be hidden from clients? (Hidden limits prevent attackers from calibrating to stay just under the threshold)
   - Should rate limit headers (X-RateLimit-Remaining, X-RateLimit-Reset) be included? (Helpful for legitimate API consumers, but reveals limits to attackers)
   - Should there be a global rate limit in addition to per-endpoint limits?
   - Should authenticated users get higher limits than anonymous users?
   - How should rate limits interact with API key tiers (free/pro/enterprise)?

4. Implementation approach:
   - Plugin/middleware configuration for {{FRAMEWORK}}
   - Backing store (Redis for distributed, in-memory for single-instance)
   - Algorithm (token bucket, sliding window log, or sliding window counter)

Output: Complete rate limiting configuration with code for {{FRAMEWORK}}.
```

**Expected output:** Tiered rate limit specification with configuration code.

---

## API Key Validation

### Prompt: API Key Authentication Audit
**Use when:** Reviewing API key issuance, validation, and lifecycle
**Severity if found:** High

```
Audit API key management in {{CODEBASE_PATH}}.

Key issuance:
1. How are API keys generated? (Must be cryptographically random, minimum 256 bits)
2. Are keys hashed before storage? (Store SHA-256 hash, not plaintext — like passwords)
3. Is the full key shown to the user only once at creation? (Cannot be retrieved later)
4. Are keys scoped? (Per-tenant, per-environment, per-permission-set)

Key validation:
1. Is key lookup constant-time? (Hash the provided key, lookup the hash — prevents timing attacks)
2. Is the key validated on every request? (Not cached indefinitely — keys can be revoked)
3. Are expired/revoked keys rejected immediately?
4. Is the key transmitted securely? (Authorization header, not query parameter — query params appear in logs)

Key lifecycle:
1. Do keys have an expiry date? (Recommended: 90 days, configurable)
2. Can keys be rotated without downtime? (Overlap period for old+new key)
3. Are key usage events logged? (Last used timestamp, IP, endpoint)
4. Can keys be revoked immediately? Is revocation propagated to all instances?
5. Is there a maximum number of active keys per user/tenant?

Key security:
1. Are API keys in server logs? (Must be redacted)
2. Are API keys in error responses? (Must not be)
3. Are API keys in URL query parameters? (Avoid — they appear in browser history, server logs, referrer headers)
```

**Expected output:** API key lifecycle assessment with gaps and implementation fixes.

---

## Webhook Authentication

### Prompt: Webhook Endpoint Security Audit
**Use when:** Reviewing inbound webhook handlers from third-party services
**Severity if found:** High

```
Audit webhook endpoint security in {{CODEBASE_PATH}}.

For each webhook endpoint:
1. Authentication method:
   - Signature validation (HMAC-SHA256 of payload with shared secret) — PREFERRED
   - Shared secret in header (less secure but acceptable)
   - IP allowlist (brittle — IPs change)
   - No authentication (CRITICAL vulnerability)

2. Signature validation implementation:
   - Is timing-safe comparison used? (crypto.timingSafeEqual, not ===)
   - Is the raw request body used for signature computation? (Parsed JSON may have different whitespace)
   - Is the signature header correctly extracted and decoded?
   - What happens if the signature header is missing? (Should reject, not skip validation)

3. Replay protection:
   - Is there a timestamp check? (Reject webhooks older than 5 minutes)
   - Is there an idempotency key to prevent duplicate processing?

4. Error handling:
   - Does the endpoint return 200 quickly to prevent retries? (Process webhook async)
   - Are webhook processing errors logged without exposing internals?

5. Rate limiting:
   - Are webhook endpoints rate-limited? (Protect against webhook flooding)
   - Are they exempt from CSRF? (They should be — they use signature auth, not cookies)

List all webhook endpoints:
| Path | Provider | Auth Method | Timing-Safe | Replay Protection |
```

**Expected output:** Webhook security matrix with authentication method and implementation quality per endpoint.

---

## DDoS Resilience

### Prompt: Application-Layer DDoS Resilience Review
**Use when:** Assessing the application's ability to withstand volumetric and application-layer attacks
**Severity if found:** Medium

```
Review DDoS resilience for the application at {{CODEBASE_PATH}}.

Application-layer (L7) protections:
1. Are expensive operations (search, report generation, file processing) rate-limited more aggressively?
2. Is there request body size limiting? (Prevents large payload attacks)
3. Is there request timeout enforcement? (Prevents slowloris-style attacks)
4. Are database queries bounded? (LIMIT clauses, query timeout, connection pool limits)
5. Is there connection limiting? (Max concurrent connections per IP)
6. Are WebSocket connections limited? (Max connections, message rate, message size)

Infrastructure-layer protections:
1. Is there a CDN or WAF in front of the application? (CloudFlare, AWS WAF, etc.)
2. Is the origin server IP hidden? (Direct-to-origin bypasses CDN protection)
3. Are health check endpoints lightweight? (Don't query the database on /health)
4. Is there auto-scaling or at least alerting on traffic spikes?

Graceful degradation:
1. Under load, does the application shed non-critical work? (Queue low-priority tasks)
2. Are circuit breakers in place for downstream services? (Prevent cascade failures)
3. Are there cached responses for read-heavy endpoints? (Serve stale data under load)

Output an L7 DDoS resilience scorecard.
```

**Expected output:** DDoS resilience scorecard with protection coverage and gaps.

---

## Atlas UX Reference

Atlas UX's rate limiting implementation:
- **Three-tier wiki rate limits:** 5 req/min (strict), 30 req/min (moderate), 120 req/min (relaxed) via `tenantRateLimit` plugin
- **Hidden limits:** Rate limit thresholds are not revealed in 429 response bodies or headers — attackers cannot calibrate their request rate
- **Per-tenant scoping:** Rate limits are keyed by tenant ID for authenticated endpoints, by IP for public endpoints
- **Webhook exemptions:** Webhook endpoints from Stripe, ElevenLabs, and OAuth callbacks bypass rate limiting but are authenticated by signature validation

---

## Resources

- [OWASP API Security Top 10 — API4:2023 Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)
- [Cloudflare Rate Limiting Best Practices](https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/)
- [NIST SP 800-95: Guide to Secure Web Services](https://csrc.nist.gov/publications/detail/sp/800-95/final)

## Image References

1. "Rate limiting algorithm comparison token bucket sliding window fixed window" — search: `rate limiting algorithm comparison diagram`
2. "API rate limit bypass techniques header spoofing distributed" — search: `api rate limit bypass techniques`
3. "Three-tier rate limiting architecture diagram" — search: `tiered rate limiting api architecture`
4. "DDoS protection layers network transport application" — search: `ddos protection layers diagram`
5. "Webhook signature validation HMAC-SHA256 flow diagram" — search: `webhook signature validation hmac flow`

## Video References

1. [Rate Limiting — System Design Interview Concept](https://www.youtube.com/watch?v=FU4WlwfS3G0) — Algorithms (token bucket, sliding window), distributed rate limiting with Redis, and design tradeoffs
2. [API Security Best Practices — Rate Limiting, Authentication, and More](https://www.youtube.com/watch?v=t4-416mg6iU) — Practical API hardening with rate limiting, key management, and webhook validation
