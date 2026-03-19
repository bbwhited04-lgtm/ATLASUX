# Security Tools — Hardening Your Agent's Tool Arsenal

## Defense in Depth for Agent Tools

A single compromised tool can cascade into a full system breach. Security hardening means applying multiple layers of defense so that even if one layer fails, the system remains protected. Every tool in an agent's arsenal needs input validation, output sanitization, access control, and monitoring.

## Input Sanitization Tools

Every tool input arrives from an LLM — which is processing user input that could contain malicious payloads. Sanitize before execution.

**String Sanitization:**
```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')           // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Strip control chars
    .trim()
    .slice(0, 1000);                // Enforce max length
}
```

**SQL Parameter Binding:**
```typescript
// NEVER: string interpolation
const results = await db.$executeRawUnsafe(`SELECT * FROM customers WHERE name = '${input}'`);

// ALWAYS: parameterized queries
const results = await db.$executeRaw`SELECT * FROM customers WHERE name = ${input}`;
```

Atlas UX fixed this pattern across the codebase — `withTenant()` uses `$executeRaw` with parameterized queries, not `$executeRawUnsafe`.

**URL Validation:**
```typescript
function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Block internal networks
    const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254'];
    if (blocked.includes(parsed.hostname)) return false;
    // Block private IP ranges
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) return false;
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') return false;
    return true;
  } catch {
    return false;
  }
}
```

## Credential Management Tools

API keys, tokens, and secrets must never be stored in plaintext or transmitted in tool parameters.

**Atlas UX Credential Vault Architecture:**
1. Tenant API keys stored in `tenant_credentials` table
2. Encrypted at rest with AES-256-GCM via `TOKEN_ENCRYPTION_KEY` (64 hex chars)
3. `credentialResolver.ts` decrypts on-demand with 5-minute in-memory cache
4. Platform owner tenant falls back to `process.env` for system-level keys
5. Keys are never logged, never included in tool responses, never transmitted outside the resolver

**Key Rotation Pattern:**
```typescript
async function rotateKey(tenantId: string, provider: string, newKey: string) {
  const encrypted = encrypt(newKey, process.env.TOKEN_ENCRYPTION_KEY);
  await prisma.tenantCredential.upsert({
    where: { tenantId_provider: { tenantId, provider } },
    update: { encryptedValue: encrypted, rotatedAt: new Date() },
    create: { tenantId, provider, encryptedValue: encrypted },
  });
  // Invalidate cache
  credentialCache.delete(`${tenantId}:${provider}`);
}
```

## Rate Limiting Tools

Prevent abuse by capping tool usage per tenant, per tool, per time window.

**Per-Tenant Rate Limiting:**
```typescript
// Atlas UX tenantRateLimit plugin
const limits = {
  'send_sms': { max: 100, window: '1h' },
  'generate_image': { max: 50, window: '1h' },
  'web_search': { max: 200, window: '1h' },
  'book_appointment': { max: 50, window: '1h' },
};
```

**Spending Caps:**
Atlas UX enforces `AUTO_SPEND_LIMIT_USD` — any tool action that would exceed this threshold requires a decision memo approval before execution.

## Content Scanning Tools

Scan tool inputs and outputs for malicious content.

**Prompt Injection Detection:**
```typescript
const INJECTION_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /you are now/i,
  /system prompt/i,
  /\bDAN\b.*mode/i,
  /pretend you/i,
  /act as if/i,
];

function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some(p => p.test(text));
}
```

**Virus Scanning:**
Atlas UX supports virus scanning via `VIRUS_SCAN_ENABLED` and `VIRUSTOTAL_API_KEY` for uploaded files.

**PII Detection:**
```typescript
const PII_PATTERNS = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  credit_card: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
  email: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i,
};
```

## Access Control Tools

Implement least privilege — every tool should only access what it needs.

**Role-Based Tool Access:**
| Role | Allowed Tools | Blocked Tools |
|------|--------------|---------------|
| Customer agent | search, book, send_sms | delete, modify_billing, admin |
| Support agent | search, read_history, escalate | delete, financial |
| Admin agent | All read tools | delete (requires confirmation) |
| System | All tools | None (but all are audited) |

**Tenant Isolation:**
Every database query in Atlas UX includes `tenant_id` filtering:
```typescript
where: { tenantId, ...conditions }
```

No tool can ever access another tenant's data. This is enforced at the plugin level, not at the individual tool level — you can't forget to add it.

## Encryption Tools

**At Rest:** AES-256-GCM for stored credentials (Atlas UX `lib/encryption.ts`)
**In Transit:** HTTPS/TLS for all external tool calls
**Field Level:** Sensitive fields encrypted individually before storage

## Monitoring and Anomaly Detection

**Suspicious Activity Patterns:**
- Rapid sequential tool calls (possible automated attack)
- Tool calls from unexpected geographic locations
- Access to resources outside normal patterns
- Bulk data export followed by external communication
- Repeated failed authentication attempts

**Atlas UX Monitoring:**
- All mutations logged to `audit_log` with hash chain integrity
- Failed tool calls logged at `error` level
- Rate limit violations trigger warnings
- JWT token blacklist checked on every request (fail-closed)

## Security Checklist for New Tools

Before deploying any new tool:

- [ ] Input validation on all parameters
- [ ] Parameterized queries (no string interpolation for SQL)
- [ ] URL validation (block SSRF targets)
- [ ] Credential handling via vault (never in parameters or responses)
- [ ] Rate limiting configured
- [ ] Audit logging implemented
- [ ] Tenant isolation enforced
- [ ] Error messages don't leak internal details
- [ ] PII redacted from logs
- [ ] Access control verified (least privilege)

## Resources

- [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) — The ten most critical API security risks with mitigation strategies
- [NIST SP 800-53 — Security Controls](https://csf.tools/reference/nist-sp-800-53/r5/) — Comprehensive federal security controls catalog

## Image References

1. Defense in depth security layers — "defense in depth layered security model application network data diagram"
2. AES-256-GCM encryption flow — "AES-256-GCM authenticated encryption diagram key nonce ciphertext tag"
3. RBAC access control matrix — "role based access control RBAC permission matrix diagram"
4. Rate limiting token bucket — "token bucket algorithm rate limiting diagram requests per second"
5. SSRF prevention architecture — "SSRF prevention URL validation allowlist architecture diagram"

## Video References

1. [OWASP API Security Top 10 — 42Crunch](https://www.youtube.com/watch?v=pLl_5Yx9hEC) — Practical walkthrough of API security vulnerabilities and defenses
2. [Securing AI Applications — AWS re:Invent](https://www.youtube.com/watch?v=f5-zQh0vqdw) — Security architecture for AI-powered applications
