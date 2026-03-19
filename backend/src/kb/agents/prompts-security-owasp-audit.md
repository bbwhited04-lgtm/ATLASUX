# OWASP Top 10 Audit Prompts

Actionable prompt templates for scanning any codebase against the OWASP Top 10 (2021 edition). Each prompt is copy-pasteable with placeholders for your specific stack. Atlas UX used this exact approach to surface 19 findings across its Fastify + Prisma + React stack — all fixed before production launch.

---

## How to Use

Replace placeholders before running:
- `{{CODEBASE_PATH}}` — root directory of the project
- `{{FRAMEWORK}}` — backend framework (Fastify, Express, Django, etc.)
- `{{ORM}}` — ORM in use (Prisma, Sequelize, TypeORM, SQLAlchemy)
- `{{FRONTEND}}` — frontend framework (React, Vue, Angular)
- `{{LANGUAGE}}` — primary language (TypeScript, Python, Go)

---

## A01: Broken Access Control

### Prompt: Access Control Audit
**Use when:** Starting a security review or after adding new endpoints
**Severity if found:** Critical

```
Audit the codebase at {{CODEBASE_PATH}} for broken access control vulnerabilities (OWASP A01:2021).

Check for:
1. Missing authentication middleware on route handlers — list every route that does NOT apply auth middleware
2. Missing authorization checks — routes that authenticate but don't verify the user has permission for the requested resource
3. Horizontal privilege escalation — endpoints where a user can access another user's data by changing an ID parameter
4. Vertical privilege escalation — endpoints where a non-admin can access admin functionality
5. CORS misconfigurations — overly permissive origins, credentials with wildcard
6. Directory traversal — file access endpoints that don't sanitize path inputs
7. Multi-tenant isolation gaps — queries missing tenant_id filtering ({{ORM}} context)

For each finding, output:
- File path and line number
- Vulnerability type (horizontal/vertical/missing auth/missing authz)
- Severity (Critical/High/Medium)
- Recommended fix with code example

Framework: {{FRAMEWORK}}
ORM: {{ORM}}
```

**Expected output:** Table of unprotected routes, tenant isolation gaps, and CORS issues with file locations.

---

## A02: Cryptographic Failures

### Prompt: Cryptographic Implementation Review
**Use when:** Storing credentials, handling passwords, or managing encrypted data
**Severity if found:** Critical

```
Review all cryptographic implementations in {{CODEBASE_PATH}} for OWASP A02:2021 violations.

Check for:
1. Plaintext storage of passwords, API keys, tokens, or PII
2. Weak hashing algorithms (MD5, SHA-1) used for passwords — should be bcrypt/scrypt/argon2
3. Hardcoded encryption keys or secrets in source code
4. Missing or reused IVs/nonces in AES encryption
5. Use of ECB mode (should be GCM or CBC with HMAC)
6. Insufficient key length (AES keys < 256 bits, RSA keys < 2048 bits)
7. Secrets committed to git history (search .env files, config files)
8. TLS configuration — minimum version, cipher suite strength

For each finding, provide the file path, the vulnerable code snippet, and a corrected implementation.
```

**Expected output:** List of cryptographic weaknesses with specific file locations and fix patterns.

---

## A03: Injection

### Prompt: Injection Vector Scan
**Use when:** Reviewing database queries, system calls, or template rendering
**Severity if found:** Critical

```
Scan {{CODEBASE_PATH}} for injection vulnerabilities (OWASP A03:2021).

Target injection types:
1. SQL Injection — find raw SQL queries, string concatenation in queries, {{ORM}}-specific unsafe methods (e.g., Prisma's $executeRawUnsafe, Sequelize's literal())
2. NoSQL Injection — unvalidated query objects passed to MongoDB/DynamoDB
3. Command Injection — exec(), spawn(), system() calls with user-controlled input
4. LDAP Injection — unescaped user input in LDAP queries
5. Template Injection — server-side template engines with unescaped user input
6. XSS (Cross-Site Scripting) — innerHTML, dangerouslySetInnerHTML, v-html, [innerHTML] in {{FRONTEND}}
7. Header Injection — user input reflected in HTTP response headers

For each finding:
- Exact file and line number
- The vulnerable code pattern
- Attack vector example (how an attacker would exploit it)
- Parameterized/escaped replacement code
```

**Expected output:** Categorized list of injection points with exploit scenarios and fixes.

---

## A04: Insecure Design

### Prompt: Design-Level Security Review
**Use when:** Architecture review, pre-launch audit, or after major feature additions
**Severity if found:** High

```
Review the architecture and design patterns in {{CODEBASE_PATH}} for OWASP A04:2021 insecure design flaws.

Evaluate:
1. Threat modeling gaps — are there high-value flows (auth, payments, data export) without documented threat models?
2. Missing rate limiting on sensitive operations (login, password reset, API key generation)
3. Business logic flaws — can users skip steps in multi-step flows? Can they manipulate pricing or quantities?
4. Lack of defense in depth — single points of failure in security controls
5. Missing approval workflows for high-risk actions (large transactions, bulk deletes, privilege changes)
6. Insufficient input validation at the design level (not just sanitization)
7. Error handling that reveals internal architecture

Framework: {{FRAMEWORK}}
Language: {{LANGUAGE}}

For each finding, describe the design flaw, the attack scenario, and a design-level fix (not just a code patch).
```

**Expected output:** Architecture-level findings with threat scenarios and design recommendations.

---

## A05: Security Misconfiguration

### Prompt: Configuration Security Audit
**Use when:** Deploying to production, changing infrastructure, or reviewing server config
**Severity if found:** High

```
Audit {{CODEBASE_PATH}} and its deployment configuration for OWASP A05:2021 security misconfigurations.

Check:
1. Default credentials still active (admin/admin, root/root, database defaults)
2. Debug mode enabled in production (NODE_ENV !== 'production', DEBUG=*, verbose error pages)
3. Unnecessary HTTP methods enabled (TRACE, OPTIONS returning too much info)
4. Missing security headers: HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy
5. Directory listing enabled on web servers
6. Stack traces or detailed error messages exposed to clients
7. Default or sample pages/endpoints still accessible
8. Cloud storage buckets with public access
9. Overly permissive CORS configuration
10. Missing Helmet.js or equivalent security middleware in {{FRAMEWORK}}

Output a configuration hardening checklist with current state and recommended state for each item.
```

**Expected output:** Hardening checklist with pass/fail status for each configuration point.

---

## A06: Vulnerable and Outdated Components

### Prompt: Dependency Vulnerability Scan
**Use when:** Before any release, monthly maintenance, or after dependency updates
**Severity if found:** High

```
Scan {{CODEBASE_PATH}} for vulnerable and outdated components (OWASP A06:2021).

Steps:
1. Run `npm audit` / `pip audit` / `cargo audit` (as appropriate for {{LANGUAGE}}) and report all findings above LOW severity
2. Identify dependencies with known CVEs — cross-reference with NVD and GitHub Advisory Database
3. Find abandoned packages — no updates in 2+ years, archived repos, no maintainer response to issues
4. Check for packages with fewer than 100 weekly downloads (typosquatting risk)
5. Verify lockfile integrity — does package-lock.json / yarn.lock exist and match package.json?
6. List all direct dependencies with their current version vs. latest available version
7. Identify transitive dependencies with critical vulnerabilities

For each vulnerable dependency:
- Package name and version
- CVE ID and severity score
- Whether it's a direct or transitive dependency
- Upgrade path or alternative package recommendation
```

**Expected output:** Vulnerability report sorted by severity with actionable upgrade paths.

---

## A07: Identification and Authentication Failures

### Prompt: Authentication Flow Audit
**Use when:** Reviewing login, registration, password reset, or session management
**Severity if found:** Critical

```
Audit authentication and session management in {{CODEBASE_PATH}} for OWASP A07:2021 failures.

Check:
1. Password policy enforcement — minimum length, complexity, breach database check
2. Brute force protection — account lockout, progressive delays, CAPTCHA after failures
3. Session management — secure cookie flags (HttpOnly, Secure, SameSite), session timeout, regeneration after login
4. JWT implementation — algorithm validation (no 'none'), expiry enforcement, issuer/audience claims, signature verification
5. Token revocation — can tokens be invalidated before expiry? Is there a blacklist? Does blacklist check fail-closed?
6. Multi-factor authentication availability and bypass resistance
7. Password reset flow — token expiry, single-use tokens, no user enumeration via error messages
8. OAuth/OIDC implementation — state parameter validation, redirect URI validation, token exchange security

Framework: {{FRAMEWORK}}

For each finding, include the attack scenario and remediation code.
```

**Expected output:** Authentication weakness inventory with exploit scenarios and fix implementations.

---

## A08: Software and Data Integrity Failures

### Prompt: Integrity Verification Audit
**Use when:** Reviewing CI/CD pipelines, update mechanisms, or data processing
**Severity if found:** High

```
Audit {{CODEBASE_PATH}} for software and data integrity failures (OWASP A08:2021).

Check:
1. CI/CD pipeline security — are build scripts protected? Can PRs modify CI config without review?
2. Dependency integrity — are package checksums verified? Is lockfile committed and enforced?
3. Unsigned updates — does the application auto-update without signature verification?
4. Deserialization attacks — unsafe deserialization of user-controlled data (JSON.parse with reviver, pickle.loads, Java ObjectInputStream)
5. Data pipeline integrity — are imported CSV/JSON files validated before processing?
6. Webhook payload verification — are incoming webhooks authenticated (signature validation, shared secrets)?
7. Audit trail integrity — can audit logs be tampered with? Is there hash chain verification?

For each finding, describe the integrity gap and the verification mechanism that should be in place.
```

**Expected output:** Integrity gaps mapped to specific pipeline stages or data flows.

---

## A09: Security Logging and Monitoring Failures

### Prompt: Logging and Monitoring Audit
**Use when:** Reviewing observability, incident response readiness, or compliance prep
**Severity if found:** Medium

```
Audit logging and monitoring in {{CODEBASE_PATH}} for OWASP A09:2021 failures.

Check:
1. Are authentication events logged? (login success/failure, token refresh, logout)
2. Are authorization failures logged? (403 responses, privilege escalation attempts)
3. Are input validation failures logged? (rejected requests, malformed payloads)
4. Is sensitive data redacted from logs? (passwords, tokens, API keys, PII)
5. Are logs tamper-proof? (append-only, shipped to external SIEM, hash chain integrity)
6. Are there alerts for: brute force attempts, unusual API usage patterns, privilege escalation?
7. Is there a security incident response runbook?
8. Log retention policy — do logs persist for compliance requirements (90 days minimum)?
9. Are health/polling endpoints excluded from audit logs to reduce noise?

Framework: {{FRAMEWORK}}

For each gap, provide the logging code pattern that should be implemented.
```

**Expected output:** Logging coverage matrix with gaps and implementation templates.

---

## A10: Server-Side Request Forgery (SSRF)

### Prompt: SSRF Vector Scan
**Use when:** Application makes outbound HTTP requests, processes URLs from user input, or integrates with external APIs
**Severity if found:** Critical

```
Scan {{CODEBASE_PATH}} for Server-Side Request Forgery vulnerabilities (OWASP A10:2021).

Check:
1. User-controlled URLs passed to fetch(), axios, http.request(), or equivalent — can an attacker make the server request internal resources?
2. URL validation gaps — are there allowlists for permitted domains? Is the scheme restricted to https?
3. DNS rebinding potential — is the resolved IP validated against internal ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)?
4. Redirect following — does the HTTP client follow redirects that could land on internal resources?
5. Cloud metadata endpoint access — can requests reach http://169.254.169.254 (AWS/GCP/Azure metadata)?
6. Image/file processing — do image resizers, PDF generators, or webhook handlers accept arbitrary URLs?
7. Webhook URL validation — are outbound webhook destinations validated against SSRF?

For each finding, provide:
- The vulnerable code path
- An SSRF payload that would demonstrate the vulnerability
- URL validation + IP allowlist implementation to fix it
```

**Expected output:** SSRF-vulnerable endpoints with payloads and allowlist-based fixes.

---

## Full Codebase Sweep

### Prompt: Complete OWASP Top 10 Sweep
**Use when:** Pre-launch audit, annual security review, or compliance assessment
**Severity if found:** Varies

```
Perform a complete OWASP Top 10 (2021) security audit of the codebase at {{CODEBASE_PATH}}.

Stack: {{FRAMEWORK}} backend, {{FRONTEND}} frontend, {{ORM}} database layer, {{LANGUAGE}} primary language.

For each OWASP category (A01 through A10), identify:
1. All instances of the vulnerability class in this codebase
2. Severity rating (Critical/High/Medium/Low)
3. Affected file and line number
4. Attack scenario description
5. Remediation with code example

Output format: A markdown table per category, then a summary with total findings count by severity.

Priority order for remediation:
1. Critical findings in authentication/authorization (A01, A07)
2. Critical injection vectors (A03)
3. Cryptographic failures with data exposure risk (A02)
4. Everything else by severity descending
```

**Expected output:** Structured audit report with findings table, severity breakdown, and prioritized remediation plan.

---

## Atlas UX Case Study

When Atlas UX ran these prompts against its own Fastify + Prisma + React stack, the audit surfaced 19 findings:
- `$executeRawUnsafe` in tenant queries (A03 — fixed with parameterized `$executeRaw`)
- JWT missing issuer/audience validation (A07 — fixed in `authPlugin.ts`)
- CORS wildcard with credentials (A05 — tightened to specific origins)
- Missing CSRF on mutating endpoints (A01 — added DB-backed synchronizer tokens)
- Plaintext credential storage (A02 — migrated to AES-256-GCM encryption)
- Sensitive headers in Fastify logs (A09 — added header redaction)
- Missing HSTS and Helmet (A05 — added with 1-year max-age)

All 19 findings were fixed in a single sprint.

---

## Resources

- [OWASP Top 10 (2021) Official](https://owasp.org/Top10/)
- [OWASP Testing Guide v4.2](https://owasp.org/www-project-web-security-testing-guide/v42/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

## Image References

1. "OWASP Top 10 2021 categories infographic diagram" — search: `owasp top 10 2021 infographic`
2. "Security audit findings dashboard with severity breakdown chart" — search: `security vulnerability dashboard severity`
3. "Code review security checklist workflow diagram" — search: `security code review checklist workflow`
4. "Web application attack surface mapping diagram" — search: `web application attack surface map`
5. "Security vulnerability remediation priority matrix" — search: `vulnerability remediation priority matrix`

## Video References

1. [OWASP Top 10 2021 — Full Breakdown](https://www.youtube.com/watch?v=BbcgnfwOJJ0) — Detailed walkthrough of each category with real-world examples
2. [Automated Security Testing with OWASP ZAP](https://www.youtube.com/watch?v=PnCbIAnauD8) — Hands-on guide to automating OWASP vulnerability scanning
