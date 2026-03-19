# JWT Authentication Hardening Prompts

Prompt templates for auditing and hardening JWT-based authentication. Covers algorithm confusion, claim validation, token revocation, and middleware patterns for Fastify and Express. Atlas UX's `authPlugin.ts` implements the gold standard: HS256 with issuer+audience enforcement, SHA-256 blacklist lookups, and fail-closed behavior on database errors.

---

## How to Use

Replace placeholders:
- `{{CODEBASE_PATH}}` — root directory of the project
- `{{FRAMEWORK}}` — Fastify or Express
- `{{JWT_LIBRARY}}` — jsonwebtoken, jose, fast-jwt, etc.
- `{{AUTH_MIDDLEWARE_PATH}}` — path to auth middleware file

---

## Algorithm Confusion & Signature Validation

### Prompt: JWT Algorithm Confusion Audit
**Use when:** Reviewing JWT verification logic for the first time or after library upgrades
**Severity if found:** Critical

```
Audit the JWT verification implementation in {{CODEBASE_PATH}} for algorithm confusion attacks.

Check:
1. Is the `algorithms` parameter explicitly set in jwt.verify() calls? (Must whitelist exactly one algorithm, e.g., ['HS256'])
2. Can an attacker send a token with `"alg": "none"` and bypass verification?
3. If using RS256, can an attacker switch to HS256 and sign with the public key as the HMAC secret?
4. Is the JWT library ({{JWT_LIBRARY}}) up to date? Check for known CVEs related to algorithm confusion.
5. Is the secret/key type appropriate for the algorithm? (Symmetric key for HS*, asymmetric keypair for RS*/ES*)

Search for all calls to jwt.verify(), jwt.decode(), and any manual JWT parsing.

For each finding:
- File path and line number
- Current (vulnerable) code
- Fixed code with explicit algorithm whitelist

Library: {{JWT_LIBRARY}}
```

**Expected output:** List of jwt.verify() calls with their algorithm configuration and any missing restrictions.

---

## Claim Validation

### Prompt: JWT Claims Enforcement Review
**Use when:** Checking that tokens are properly scoped and validated
**Severity if found:** High

```
Review JWT claim validation in {{CODEBASE_PATH}}.

Check that jwt.verify() or equivalent enforces:
1. `iss` (issuer) — is it validated against an expected value? Can an attacker forge tokens from a different issuer?
2. `aud` (audience) — is it validated? Does it match the intended service?
3. `exp` (expiration) — is it present on all tokens? Is clock skew tolerance reasonable (< 60 seconds)?
4. `iat` (issued at) — is it present? Are tokens rejected if iat is in the future?
5. `sub` (subject) — is the subject claim used for user identification? Is it validated against the database?
6. `nbf` (not before) — is it checked if present?
7. Custom claims — are role/permission claims in the token validated against the database (not just trusted from the token)?

Also check token generation (jwt.sign()):
- Are all required claims included?
- Is the expiry reasonable (< 24 hours for access tokens)?
- Are refresh tokens handled separately with longer expiry?

Framework: {{FRAMEWORK}}
```

**Expected output:** Claims validation matrix showing which claims are checked and which are missing.

---

## Token Revocation & Blacklisting

### Prompt: Token Revocation Mechanism Audit
**Use when:** Reviewing logout, password change, or session invalidation flows
**Severity if found:** High

```
Audit the token revocation mechanism in {{CODEBASE_PATH}}.

Check:
1. Does a revocation mechanism exist at all? (JWTs are stateless — without a blacklist, tokens remain valid until expiry)
2. Blacklist implementation:
   - Is it database-backed, Redis-backed, or in-memory? (In-memory fails on multi-instance deployments)
   - What is stored — full token, token ID (jti), or token hash? (Hash is preferred to avoid storing sensitive tokens)
   - Is the lookup indexed for performance?
3. Fail-closed behavior: If the blacklist database is unreachable, are tokens REJECTED (fail-closed) or ACCEPTED (fail-open)?
   - Fail-open is a critical vulnerability — an attacker can DoS the blacklist DB to bypass revocation
4. Revocation triggers — are tokens revoked on:
   - Logout?
   - Password change?
   - Permission/role change?
   - Account deactivation?
   - Suspicious activity detection?
5. Blacklist cleanup — are expired revoked tokens pruned to prevent table bloat?
6. Token family tracking — can a compromised refresh token invalidate all tokens in its family?

For each gap, provide the implementation code for {{FRAMEWORK}}.
```

**Expected output:** Revocation coverage matrix and fail-closed verification results.

---

## Auth Middleware Patterns

### Prompt: Fastify Auth Plugin Review
**Use when:** Auditing Fastify-based authentication middleware
**Severity if found:** Critical

```
Review the Fastify authentication plugin at {{AUTH_MIDDLEWARE_PATH}} for security weaknesses.

Check:
1. Is the plugin registered as a preHandler hook or onRequest hook? (onRequest is preferred — runs before body parsing)
2. Does it extract the token from the Authorization header correctly? (Bearer scheme, case-insensitive)
3. Are unauthenticated routes explicitly listed (allowlist) rather than having auth disabled by default?
4. Error responses — do 401/403 responses leak information about why authentication failed? (Should be generic)
5. Token refresh — is there a separate endpoint for refresh? Does it issue new tokens with fresh claims from the DB?
6. Request decoration — is the decoded user attached to the request object securely? Can downstream handlers trust req.user?
7. Route-level overrides — can individual routes disable auth? Is this auditable?
8. Multi-tenant context — after auth, is the tenant context validated against the user's permissions?

Framework: Fastify 5
JWT Library: {{JWT_LIBRARY}}
```

**Expected output:** Plugin security assessment with specific code fixes for each finding.

### Prompt: Express Auth Middleware Review
**Use when:** Auditing Express-based authentication middleware
**Severity if found:** Critical

```
Review the Express authentication middleware at {{AUTH_MIDDLEWARE_PATH}} for security weaknesses.

Check:
1. Middleware ordering — is auth middleware applied before body parsers and route handlers?
2. Is the middleware applied globally or per-route? Are unprotected routes explicitly marked?
3. Does the middleware call next() only on successful authentication? (Calling next() on failure is a bypass)
4. Error handling — does the error middleware expose JWT details in error responses?
5. passport.js integration — if used, are strategies configured securely? Is session serialization safe?
6. Token extraction — is it from Authorization header only, or also cookies? If cookies, are CSRF protections in place?
7. req.user population — is the user object from the token, or does it re-query the database? (DB re-query prevents stale permissions)
8. Async error handling — are async middleware errors caught? (Uncaught promise rejections can bypass auth)

Framework: Express
JWT Library: {{JWT_LIBRARY}}
```

**Expected output:** Middleware security audit with fix implementations.

---

## Token Lifecycle

### Prompt: JWT Token Lifecycle Security Review
**Use when:** Full lifecycle audit from issuance through expiration
**Severity if found:** High

```
Audit the complete JWT token lifecycle in {{CODEBASE_PATH}}.

Phase 1 — Issuance:
- What triggers token creation? (Login, OAuth callback, API key exchange)
- Are credentials verified before token issuance?
- Is the token payload minimal? (No passwords, no PII beyond what's needed)
- Is the signing key loaded securely? (Not hardcoded, not in version control)

Phase 2 — Transport:
- Is the token sent over HTTPS only?
- If stored in cookies: HttpOnly, Secure, SameSite flags set?
- If stored in localStorage: is XSS risk mitigated?
- Is the token included in request logs? (It should NOT be)

Phase 3 — Validation:
- Is every protected endpoint validating the token? (No gaps)
- Are expired tokens rejected immediately?
- Is the signing key the same one used for issuance? (Key mismatch = bypass)

Phase 4 — Refresh:
- Is there a refresh token flow? Is it separate from access tokens?
- Are refresh tokens single-use (rotated on each use)?
- Is refresh token theft detectable? (Token family invalidation)

Phase 5 — Revocation:
- See token revocation prompt above
- Are tokens revoked on security-relevant events?

Map the entire flow and flag gaps at each phase.
```

**Expected output:** Token lifecycle diagram with security controls at each phase and identified gaps.

---

## Atlas UX Reference Implementation

Atlas UX's `authPlugin.ts` demonstrates a hardened JWT pattern:
- **Algorithm:** HS256 explicitly whitelisted (no algorithm confusion)
- **Claims:** Issuer and audience validated on every request
- **Blacklist:** Revoked token hashes stored in `revokedToken` DB table, checked fail-closed (DB error = request denied)
- **Cleanup:** Expired revoked tokens pruned daily via scheduled job
- **Header redaction:** Authorization headers stripped from Fastify request logs
- **Multi-tenant:** After auth, tenant context is validated via `tenantPlugin`

This layered approach (algorithm lock + claim validation + fail-closed blacklist + log redaction) addresses the most common JWT attack vectors.

---

## Resources

- [JWT Security Best Practices (RFC 8725)](https://datatracker.ietf.org/doc/html/rfc8725)
- [Auth0 JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)
- [PortSwigger JWT Attack Guide](https://portswigger.net/web-security/jwt)

## Image References

1. "JWT token structure header payload signature diagram" — search: `jwt token structure diagram`
2. "Algorithm confusion attack flow showing RS256 to HS256 downgrade" — search: `jwt algorithm confusion attack diagram`
3. "Token lifecycle diagram showing issuance validation refresh revocation" — search: `jwt token lifecycle security flow`
4. "Fail-closed vs fail-open authentication decision tree" — search: `fail closed fail open security pattern`
5. "Auth middleware pipeline showing request flow through validation" — search: `authentication middleware pipeline diagram`

## Video References

1. [JWT Authentication — Common Pitfalls and How to Avoid Them](https://www.youtube.com/watch?v=GIq3naOLrTg) — OWASP talk on JWT security mistakes with live exploit demos
2. [Hacking JWTs — Practical JWT Attacks](https://www.youtube.com/watch?v=g0AZpSNT4iE) — Hands-on walkthrough of algorithm confusion, none attack, and key injection
