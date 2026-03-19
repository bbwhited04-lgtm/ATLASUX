# CSRF Protection Audit Prompts

Prompt templates for auditing Cross-Site Request Forgery protections. Covers synchronizer token patterns, double-submit cookies, endpoint coverage, exempt route validation, and token lifecycle management. Atlas UX uses DB-backed CSRF tokens stored in the `oauth_state` table with 1-hour TTL, validated on all mutating requests via `csrfPlugin.ts`, with webhook and callback endpoints explicitly exempt.

---

## How to Use

Replace placeholders:
- `{{CODEBASE_PATH}}` — root directory of the project
- `{{FRAMEWORK}}` — Fastify, Express, Django, etc.
- `{{CSRF_MIDDLEWARE_PATH}}` — path to CSRF middleware/plugin file
- `{{FRONTEND}}` — React, Vue, Angular, etc.

---

## CSRF Token Implementation Review

### Prompt: CSRF Token Mechanism Audit
**Use when:** Reviewing CSRF protection implementation or adding it for the first time
**Severity if found:** Critical

```
Audit the CSRF protection implementation in {{CODEBASE_PATH}}.

Determine which CSRF pattern is used:
- Synchronizer Token Pattern (server generates token, stores server-side, validates on submission)
- Double-Submit Cookie Pattern (token in cookie + request header/body, compared on server)
- SameSite Cookie Attribute (modern browsers only — not sufficient alone)
- Custom header requirement (X-Requested-With or similar — not sufficient alone)

For the identified pattern, check:

1. Token generation:
   - Is the token cryptographically random? (crypto.randomBytes or equivalent, not Math.random)
   - Is the token long enough? (Minimum 128 bits / 32 hex chars)
   - Is a unique token generated per session or per request? (Per-request is more secure but harder to implement with SPAs)

2. Token storage (server-side for synchronizer pattern):
   - Where are tokens stored? (Database, Redis, in-memory session)
   - Is there a TTL? What is it? (1 hour is reasonable; 24 hours is too long)
   - Are expired tokens cleaned up? (Prevents storage bloat)

3. Token transmission:
   - How does the client receive the token? (Response header, cookie, HTML meta tag, JSON response body)
   - How does the client send the token back? (Request header X-CSRF-Token, form field, query parameter)
   - Is the token transmitted over HTTPS only?

4. Token validation:
   - Is timing-safe comparison used? (crypto.timingSafeEqual, not === )
   - Does validation happen before any state-changing logic?
   - What happens on validation failure? (Should be 403 with no side effects)

Framework: {{FRAMEWORK}}
```

**Expected output:** CSRF pattern identification with validation of each component.

---

## Endpoint Coverage Verification

### Prompt: CSRF Coverage Gap Finder
**Use when:** Ensuring all state-changing endpoints are protected
**Severity if found:** High

```
Verify that CSRF protection covers ALL state-changing endpoints in {{CODEBASE_PATH}}.

Step 1: List every endpoint that handles POST, PUT, PATCH, or DELETE requests.
Step 2: For each endpoint, verify CSRF validation is applied (either via global middleware or per-route).
Step 3: Identify gaps — endpoints that accept state-changing methods but skip CSRF validation.

Also check:
1. GET endpoints that change state — these are design flaws AND CSRF-vulnerable (GET should be idempotent)
2. API endpoints that accept both form data and JSON — CSRF tokens may be checked for forms but not JSON
3. File upload endpoints — is CSRF validated before multipart parsing?
4. WebSocket upgrade endpoints — is CSRF checked during the HTTP upgrade handshake?
5. GraphQL endpoints — single endpoint handles both queries (GET-like) and mutations (POST-like) — are mutations protected?

Output a table:
| Endpoint | Method | CSRF Protected | Notes |
|----------|--------|----------------|-------|

Framework: {{FRAMEWORK}}
```

**Expected output:** Complete endpoint coverage table with unprotected routes highlighted.

---

## Exempt Endpoint Validation

### Prompt: CSRF Exemption Audit
**Use when:** Reviewing which endpoints are exempt from CSRF and whether exemptions are justified
**Severity if found:** High

```
Audit CSRF exemptions in {{CODEBASE_PATH}}.

Find all endpoints or route prefixes that are explicitly exempt from CSRF validation.

For each exemption, verify it is justified:

VALID exemptions:
- Webhook endpoints (authenticated by signature/shared secret, not cookies)
- OAuth callback endpoints (authenticated by state parameter, not cookies)
- Public API endpoints that use API key auth (not cookie-based)
- Health check endpoints (no state changes)

INVALID exemptions:
- Admin endpoints "because they're internal" (admins use browsers too)
- File upload endpoints "for compatibility" (must be protected)
- Any endpoint that reads cookies/session for authentication

For each exemption, check:
1. Is the exemption path specific (exact match) or overly broad (prefix match catching unintended routes)?
2. Does the exempted endpoint have an alternative authentication mechanism (webhook signature, API key)?
3. Could the exemption be exploited by an attacker crafting a request to the exempt path?
4. Are exemptions documented with justification?

CSRF middleware path: {{CSRF_MIDDLEWARE_PATH}}
```

**Expected output:** Exemption table with valid/invalid classification and justification review.

---

## SPA CSRF Integration

### Prompt: Single-Page Application CSRF Flow Audit
**Use when:** SPA frontend (React, Vue, Angular) consuming a REST API with cookie auth
**Severity if found:** High

```
Audit the CSRF token flow between the {{FRONTEND}} SPA and {{FRAMEWORK}} backend in {{CODEBASE_PATH}}.

SPA-specific challenges:
1. Token acquisition — how does the SPA get the initial CSRF token?
   - Dedicated endpoint (GET /csrf-token)?
   - Response header on initial page load?
   - Cookie that JavaScript reads? (Must NOT be HttpOnly if using double-submit)

2. Token inclusion — how does the SPA include the token in requests?
   - Axios/fetch interceptor that adds X-CSRF-Token header?
   - Is the interceptor applied globally or per-request? (Global is safer)
   - Does the interceptor handle token refresh on 403?

3. Token refresh — when the token expires:
   - Does the SPA detect 403 and fetch a new token automatically?
   - Is there a race condition where multiple requests fail simultaneously and trigger multiple token refreshes?
   - Does the refresh flow maintain the original request queue?

4. CORS interaction:
   - If API is cross-origin, is Access-Control-Allow-Credentials set?
   - Is Access-Control-Allow-Headers configured to accept the CSRF header?
   - Is the CSRF cookie SameSite=Lax or SameSite=Strict?

5. State management:
   - Where does the SPA store the token? (Memory is safest, localStorage is XSS-vulnerable)
   - Is the token cleared on logout?

Frontend: {{FRONTEND}}
Backend: {{FRAMEWORK}}
```

**Expected output:** SPA CSRF flow diagram with identified gaps in token lifecycle.

---

## Token Lifecycle & Storage

### Prompt: CSRF Token Storage and Expiry Audit
**Use when:** Reviewing server-side token storage for the synchronizer pattern
**Severity if found:** Medium

```
Audit CSRF token lifecycle and storage in {{CODEBASE_PATH}}.

Check:
1. Storage mechanism:
   - Database table (durable, but query overhead per request)
   - Redis (fast, but tokens lost on restart without persistence)
   - In-memory Map/Set (fast, but lost on restart, doesn't scale horizontally)
   - Session store (tied to session lifecycle)

2. Token TTL:
   - What is the configured TTL? (1 hour is typical; adjust based on session length)
   - Is TTL enforced at storage level (Redis EXPIRE, DB scheduled cleanup)?
   - Are tokens single-use (deleted after validation) or reusable within TTL?

3. Cleanup:
   - Are expired tokens removed automatically? How often?
   - Could token table grow unbounded under heavy traffic?
   - Is there a maximum token count per user/session?

4. Concurrency:
   - If tokens are single-use, what happens when a user has multiple tabs open?
   - Does each tab get its own token, or do they share one?
   - Can a legitimate user's token be consumed by a preflight request?

5. Token binding:
   - Is the token bound to a specific user/session? (Not just globally valid)
   - Can an attacker obtain a valid CSRF token and use it for another user?

Framework: {{FRAMEWORK}}
```

**Expected output:** Token lifecycle assessment with storage characteristics and edge case handling.

---

## Atlas UX Reference

Atlas UX's CSRF implementation in `csrfPlugin.ts`:
- **Pattern:** Synchronizer token (DB-backed)
- **Storage:** `oauth_state` table with `state` column for token, `expires_at` for TTL
- **TTL:** 1-hour expiry, expired tokens cleaned up periodically
- **Coverage:** All mutating requests (POST, PUT, PATCH, DELETE)
- **Exemptions:** Webhook endpoints and OAuth callback paths (defined in `SKIP_PREFIXES`)
- **Issuance:** Fresh token issued on mutating response headers
- **Frontend:** React SPA reads token from response header, includes in subsequent requests

---

## Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [PortSwigger CSRF Lab & Guide](https://portswigger.net/web-security/csrf)
- [SameSite Cookie Explainer (web.dev)](https://web.dev/articles/samesite-cookies-explained)

## Image References

1. "CSRF attack flow diagram showing forged request from malicious site" — search: `csrf attack flow diagram`
2. "Synchronizer token pattern request-response cycle diagram" — search: `csrf synchronizer token pattern diagram`
3. "Double-submit cookie CSRF prevention diagram" — search: `double submit cookie csrf diagram`
4. "SPA CSRF token flow with API backend" — search: `spa csrf token flow react api`
5. "CSRF protection decision tree choosing the right pattern" — search: `csrf protection decision tree`

## Video References

1. [Cross-Site Request Forgery Explained](https://www.youtube.com/watch?v=eWEgUcHPle0) — Clear walkthrough of CSRF attacks and defense patterns with live demos
2. [CSRF Protection in Modern Web Apps](https://www.youtube.com/watch?v=hW2ONyxAySY) — Coverage of SPA-specific CSRF challenges and SameSite cookie strategies
