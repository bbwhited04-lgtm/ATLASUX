# SQL Injection & XSS Prevention Prompts

Prompt templates for finding and fixing injection and cross-site scripting vulnerabilities. Covers raw SQL detection, ORM-specific unsafe methods, parameterized query enforcement, DOM-based XSS, CSP header auditing, and template injection. Atlas UX fixed its critical injection vector: `withTenant()` was using Prisma's `$executeRawUnsafe` with string interpolation — migrated to parameterized `$executeRaw` with positional parameters.

---

## How to Use

Replace placeholders:
- `{{CODEBASE_PATH}}` — root directory of the project
- `{{ORM}}` — Prisma, Sequelize, TypeORM, Knex, etc.
- `{{FRONTEND}}` — React, Vue, Angular, Svelte
- `{{BACKEND_FRAMEWORK}}` — Fastify, Express, Django, Flask

---

## SQL Injection Detection

### Prompt: Raw SQL and Unsafe Query Finder
**Use when:** Initial security audit or after database layer changes
**Severity if found:** Critical

```
Scan {{CODEBASE_PATH}} for SQL injection vulnerabilities.

Search for these patterns by ORM:

**Prisma:**
- $executeRawUnsafe() — CRITICAL: accepts string interpolation, fully vulnerable
- $queryRawUnsafe() — CRITICAL: same as above for SELECT queries
- $executeRaw with template literals that use ${variable} — check if Prisma tagged template (safe) or string concat (unsafe)
- Prisma.sql`` template tag — verify it's used correctly (parameterized)

**Sequelize:**
- sequelize.query() with string concatenation instead of replacements/bind
- Sequelize.literal() with user input — bypasses parameterization
- where clauses built with string interpolation

**TypeORM:**
- createQueryBuilder() with .where() using string templates with user input
- Raw() function with unparameterized SQL
- query() with string concatenation

**Knex:**
- knex.raw() with string interpolation instead of ? placeholders
- whereRaw() with user-controlled input

**Generic (any ORM or raw driver):**
- String concatenation in SQL: "SELECT * FROM " + table
- Template literals in SQL: `SELECT * FROM ${table}`
- eval() or Function() with SQL-related strings
- User input flowing into ORDER BY, LIMIT, table names, column names (parameterization doesn't help here — use allowlists)

For each finding:
- File path and line number
- The vulnerable code
- SQL injection payload that would exploit it
- Fixed code using the ORM's parameterization

ORM: {{ORM}}
```

**Expected output:** List of injection-vulnerable queries with exploit payloads and parameterized replacements.

### Prompt: Dynamic Query Builder Audit
**Use when:** Application builds queries dynamically based on user filters/sorts
**Severity if found:** High

```
Audit dynamic query construction in {{CODEBASE_PATH}}.

Many applications build queries dynamically for search, filtering, and sorting. These are injection hotspots.

Check:
1. Dynamic WHERE clauses — is user input validated against an allowlist of column names?
2. Dynamic ORDER BY — is the sort column validated? (ORDER BY cannot be parameterized in most ORMs)
3. Dynamic table/schema names — are these from user input? (Must be allowlisted, never parameterized)
4. Pagination — are LIMIT and OFFSET values validated as integers?
5. Search queries — is full-text search using parameterized queries or string concatenation?
6. Filter operators — if users can specify operators (=, >, LIKE), are they validated against an allowlist?

For each dynamic query found:
- Show the input path from request to query
- Identify which parts are parameterized and which are not
- Provide an allowlist-based fix for non-parameterizable parts (column names, sort directions, operators)
```

**Expected output:** Dynamic query inventory with parameterization status and allowlist recommendations.

---

## XSS Detection

### Prompt: Cross-Site Scripting Vector Scan
**Use when:** Reviewing frontend rendering and server-side template output
**Severity if found:** High

```
Scan {{CODEBASE_PATH}} for Cross-Site Scripting (XSS) vulnerabilities.

**DOM-based XSS ({{FRONTEND}} frontend):**
1. React: dangerouslySetInnerHTML — every instance is a potential XSS vector. Is the HTML sanitized with DOMPurify or similar?
2. React: ref.current.innerHTML = ... — bypasses React's escaping
3. Vue: v-html directive — equivalent to dangerouslySetInnerHTML
4. Angular: [innerHTML] binding — Angular sanitizes by default, but bypassSecurityTrustHtml() disables it
5. Svelte: {@html expression} — no automatic sanitization
6. Generic: document.write(), element.innerHTML, element.outerHTML, element.insertAdjacentHTML()
7. URL-based: javascript: protocol in href/src attributes, window.location assignment from user input
8. eval(), setTimeout(string), setInterval(string), new Function(string) with user input

**Reflected XSS (server-side):**
1. User input reflected in HTML responses without encoding
2. Error messages that include the original input
3. Redirect URLs built from user input without validation
4. JSON responses with HTML content-type (allows script execution)

**Stored XSS:**
1. User-generated content (comments, profiles, messages) rendered without sanitization
2. File names displayed without encoding
3. Rich text editors that allow arbitrary HTML

For each finding:
- File path and line number
- XSS type (DOM/Reflected/Stored)
- Attack payload example: <script>alert('xss')</script> or <img src=x onerror=alert(1)>
- Fix: sanitization library, encoding function, or CSP header

Frontend: {{FRONTEND}}
Backend: {{BACKEND_FRAMEWORK}}
```

**Expected output:** XSS vulnerability inventory categorized by type with payloads and fixes.

---

## Content Security Policy

### Prompt: CSP Header Audit
**Use when:** Reviewing defense-in-depth against XSS and data exfiltration
**Severity if found:** Medium

```
Audit Content Security Policy (CSP) configuration in {{CODEBASE_PATH}}.

Check:
1. Is a CSP header set at all? (Content-Security-Policy response header)
2. Current directives — parse and evaluate each:
   - default-src: should be 'self' at minimum
   - script-src: should NOT include 'unsafe-inline' or 'unsafe-eval' (defeats XSS protection)
   - style-src: 'unsafe-inline' is common but should use nonces if possible
   - img-src: appropriate allowlist for image CDNs
   - connect-src: API endpoints and WebSocket URLs
   - frame-src/frame-ancestors: clickjacking protection
   - object-src: should be 'none' (blocks Flash/Java)
   - base-uri: should be 'self' (prevents base tag injection)
   - form-action: should restrict form submission targets
3. Report-only mode — is CSP in report-only mode? (Good for testing, must move to enforce)
4. Reporting — is report-uri or report-to configured? Are violations being collected?
5. Nonce or hash-based policies — if inline scripts are needed, are they nonce-protected?
6. Multiple CSP headers — the most restrictive policy wins; check for conflicts

Also check related headers:
- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- X-Frame-Options: DENY or SAMEORIGIN (clickjacking)
- X-XSS-Protection: 0 (disable browser's built-in XSS filter — it causes more problems than it solves)

Framework: {{BACKEND_FRAMEWORK}}
```

**Expected output:** CSP directive analysis with recommendations for tightening each directive.

---

## Input Sanitization Pipeline

### Prompt: Input Validation and Sanitization Audit
**Use when:** Reviewing how user input flows through the application
**Severity if found:** High

```
Trace user input through the application in {{CODEBASE_PATH}} to find sanitization gaps.

For each API endpoint that accepts user input:
1. Input entry point — request body, query params, headers, path params, file uploads
2. Validation layer — is input validated for type, length, format, and allowed values?
   - Is validation happening at the route level (schema validation) or in business logic?
   - Is there a validation library? (Zod, Joi, Yup, class-validator, Ajv)
   - Are validation errors returned without echoing back the invalid input?
3. Sanitization — is input sanitized before use?
   - HTML encoding for output in HTML context
   - SQL parameterization for database queries
   - URL encoding for output in URL context
   - Shell escaping for system commands (better: avoid shell commands entirely)
4. Output encoding — is the correct encoding applied based on the output context?
   - HTML body: HTML entity encoding
   - HTML attribute: attribute encoding
   - JavaScript: JavaScript encoding
   - URL: percent encoding
   - CSS: CSS encoding

Map the input flow: Entry -> Validation -> Business Logic -> Database -> Output
Flag every point where unvalidated input crosses a trust boundary.

Framework: {{BACKEND_FRAMEWORK}}
Frontend: {{FRONTEND}}
```

**Expected output:** Input flow diagram per endpoint with sanitization coverage at each trust boundary.

---

## ORM-Specific Deep Dive

### Prompt: Prisma-Specific Injection Audit
**Use when:** Codebase uses Prisma ORM
**Severity if found:** Critical

```
Perform a Prisma-specific SQL injection audit on {{CODEBASE_PATH}}.

Prisma's safety model:
- Standard query methods (findMany, create, update, delete) are safe — they generate parameterized queries
- $executeRaw and $queryRaw with tagged template literals are safe — Prisma parameterizes the template
- $executeRawUnsafe and $queryRawUnsafe are DANGEROUS — they accept raw strings

Scan for:
1. Every call to $executeRawUnsafe or $queryRawUnsafe — these must be replaced with $executeRaw/$queryRaw using tagged templates
2. $executeRaw or $queryRaw called with a pre-built string variable (not a tagged template) — this bypasses parameterization
3. Prisma.sql tagged template with external string interpolation — e.g., Prisma.sql`... ${someString} ...` where someString was built unsafely
4. Dynamic column/table names in raw queries — these cannot be parameterized; use Prisma.sql with Prisma.raw() for identifiers
5. JSON filter injection — where clauses accepting unvalidated JSON objects that could manipulate query logic (e.g., { OR: [...] })
6. Nested relation filters — deeply nested includes/selects that could be manipulated to extract unauthorized data

For each finding:
- File, line number, and the unsafe code
- The safe replacement using Prisma tagged templates with positional $1, $2 parameters
- Example: Replace $executeRawUnsafe(\`UPDATE x SET y WHERE tenant_id = '\${tenantId}'\`) with $executeRaw\`UPDATE x SET y WHERE tenant_id = \${tenantId}\`
```

**Expected output:** Prisma injection audit with unsafe-to-safe migration code for each finding.

---

## Atlas UX Case Study

Atlas UX's critical injection fix:
- **Before:** `withTenant()` helper used `prisma.$executeRawUnsafe()` with template string interpolation for tenant-scoped queries
- **After:** Migrated to `prisma.$executeRaw` with Prisma's tagged template literal, which automatically parameterizes `${tenantId}` as a SQL parameter
- **Impact:** Eliminated the primary SQL injection vector in the entire application with a single-line change per query

---

## Resources

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Prisma Raw Query Documentation](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries)

## Image References

1. "SQL injection attack flow diagram showing malicious input to database" — search: `sql injection attack flow diagram`
2. "XSS attack types comparison DOM reflected stored" — search: `xss attack types comparison diagram`
3. "Content Security Policy directive hierarchy diagram" — search: `content security policy csp directives diagram`
4. "Input validation sanitization pipeline architecture" — search: `input validation sanitization pipeline diagram`
5. "Parameterized query vs string concatenation comparison" — search: `parameterized query vs string concatenation sql`

## Video References

1. [SQL Injection Explained — Finding and Exploiting SQLi](https://www.youtube.com/watch?v=ciNHn38EyRc) — Practical SQL injection walkthrough from discovery to exploitation to remediation
2. [XSS in Modern Web Apps — Beyond alert(1)](https://www.youtube.com/watch?v=KHwVjzQ25uk) — Advanced XSS techniques in React/Vue/Angular SPAs with CSP bypass examples
