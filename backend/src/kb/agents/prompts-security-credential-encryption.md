# Credential Encryption & Secret Management Prompts

Prompt templates for auditing how credentials are stored, encrypted, and resolved at runtime. Covers plaintext detection, AES-256-GCM validation, key rotation readiness, environment variable hygiene, and git history scanning. Atlas UX uses a `TOKEN_ENCRYPTION_KEY` (64 hex chars) with `encryptToken()`/`decryptToken()` for all stored API keys, resolved through a caching `credentialResolver` with 5-minute TTL.

---

## How to Use

Replace placeholders:
- `{{CODEBASE_PATH}}` — root directory of the project
- `{{ORM}}` — ORM in use (Prisma, Sequelize, etc.)
- `{{ENCRYPTION_MODULE_PATH}}` — path to encryption utility file
- `{{CREDENTIAL_TABLE}}` — database table storing encrypted credentials (e.g., `tenant_credentials`)

---

## Plaintext Secret Detection

### Prompt: Find Plaintext Secrets in Codebase
**Use when:** Initial security audit, onboarding a new repo, or pre-launch review
**Severity if found:** Critical

```
Scan {{CODEBASE_PATH}} for plaintext secrets stored in source code, configuration files, or database schemas.

Search for:
1. Hardcoded API keys — strings matching patterns: sk-*, pk_*, api_key_*, AKIA* (AWS), ghp_* (GitHub), xoxb-* (Slack)
2. Hardcoded passwords — variables named password, passwd, secret, apiKey, api_secret with string literal assignments
3. Connection strings with embedded credentials — postgres://, mysql://, mongodb:// URLs containing passwords
4. .env files committed to version control — check if .env, .env.local, .env.production are in .gitignore
5. Config files with secrets — check JSON/YAML/TOML config files for key/secret/token fields with non-placeholder values
6. Database columns storing plaintext — check {{ORM}} schema for columns named *_key, *_token, *_secret, *_password that lack encryption at rest
7. Test fixtures/seeds with real credentials — check test files and seed scripts for production values
8. Docker/CI files — check Dockerfile, docker-compose.yml, .github/workflows for embedded secrets

For each finding:
- File path and line number
- The secret pattern found (redacted to first/last 4 chars)
- Classification (API key, password, connection string, etc.)
- Remediation: move to environment variable, encrypt at rest, or remove entirely
```

**Expected output:** Categorized list of plaintext secrets with locations and remediation steps.

---

## Encryption Implementation Audit

### Prompt: AES-256-GCM Implementation Review
**Use when:** Verifying credential encryption is correctly implemented
**Severity if found:** Critical

```
Audit the encryption implementation at {{ENCRYPTION_MODULE_PATH}} and all code that calls it.

Verify AES-256-GCM correctness:
1. Key length — is the encryption key exactly 256 bits (32 bytes / 64 hex characters)?
2. IV/Nonce generation — is a unique random IV generated for EVERY encryption operation? (crypto.randomBytes(12) or equivalent)
3. IV storage — is the IV stored alongside the ciphertext? (Required for decryption — typically prepended or stored in a separate column)
4. Authentication tag — is the GCM auth tag stored and verified during decryption? (Without it, GCM degrades to CTR mode)
5. Key derivation — if the key is derived from a passphrase, is PBKDF2/scrypt/argon2 used with sufficient iterations?
6. Error handling — does decryption failure throw a clear error, or does it silently return garbage?
7. No ECB mode — confirm AES-ECB is not used anywhere (ECB leaks patterns)
8. No key reuse with same IV — verify the same (key, IV) pair is never used twice

Also check all callers of the encrypt/decrypt functions:
- Are all sensitive fields encrypted before database storage?
- Are decrypted values ever logged or included in error messages?
- Is the decrypted value held in memory longer than necessary?
```

**Expected output:** Encryption implementation scorecard with pass/fail for each criterion.

---

## Key Management

### Prompt: Encryption Key Management Audit
**Use when:** Reviewing key storage, rotation capability, and access control
**Severity if found:** High

```
Audit encryption key management practices in {{CODEBASE_PATH}}.

Check:
1. Key storage — where is the encryption key stored?
   - Environment variable (acceptable for single-instance)
   - AWS KMS / GCP KMS / Azure Key Vault (preferred for production)
   - Hardcoded in source code (CRITICAL vulnerability)
   - Config file on disk (HIGH — must be permission-restricted)

2. Key rotation readiness:
   - Can the encryption key be rotated without downtime?
   - Is there a key version identifier stored with each encrypted value?
   - Is there a migration script to re-encrypt existing data with a new key?
   - What happens if the old key is lost? (Is there a recovery mechanism?)

3. Key access control:
   - Which processes/services have access to the key?
   - Is access logged? (Who accessed the key and when)
   - Is the key available in development/staging environments? (It should NOT be the production key)

4. Key entropy:
   - Was the key generated with a cryptographically secure random number generator?
   - Is it at least 256 bits for AES-256?

Provide a key rotation implementation plan if one doesn't exist.
```

**Expected output:** Key management assessment with rotation readiness score and implementation plan.

---

## Environment Variable Hygiene

### Prompt: Environment Variable Security Audit
**Use when:** Reviewing .env files, deployment configs, and secret injection
**Severity if found:** High

```
Audit environment variable handling in {{CODEBASE_PATH}}.

Check:
1. .env files:
   - Is .env in .gitignore? (check ALL .gitignore files in the repo)
   - Is there a .env.example with placeholder values (not real secrets)?
   - Are there multiple .env files (.env.local, .env.production, .env.test)?
   - Do any .env files contain production secrets?

2. Git history:
   - Search git log for commits that added/modified .env files: `git log --all --full-history -- "*.env*"`
   - If secrets were ever committed, they are compromised and must be rotated — git history is permanent

3. Runtime access:
   - Are env vars validated at startup? (Fail fast if required vars are missing)
   - Are env vars typed/parsed, or used as raw strings?
   - Are env vars accessible to client-side code? (VITE_* / NEXT_PUBLIC_* / REACT_APP_* are exposed to browsers)

4. CI/CD:
   - Are secrets injected via CI/CD secret management (GitHub Secrets, AWS Parameter Store)?
   - Are secrets printed in CI logs? (Check for echo $SECRET or debug output)
   - Can PR builds from forks access secrets?

5. Docker:
   - Are secrets passed via --build-arg? (Visible in image layers — use --secret instead)
   - Are .env files copied into Docker images?
```

**Expected output:** Environment variable security report with categorized findings and rotation requirements.

---

## Credential Resolver Pattern

### Prompt: Credential Resolution Logic Audit
**Use when:** Multi-tenant systems where each tenant may have their own API keys
**Severity if found:** High

```
Audit the credential resolution logic in {{CODEBASE_PATH}}.

Check the resolution chain:
1. What is the lookup order? (Database first, then env vars, then defaults?)
2. Is there tenant isolation? Can Tenant A's credentials resolve for Tenant B?
3. Cache behavior:
   - Are resolved credentials cached? For how long?
   - Is the cache invalidated when credentials are updated?
   - Is the cache per-tenant or shared? (Shared cache can leak across tenants)
4. Fallback behavior:
   - If tenant credentials don't exist, does it fall back to platform-level keys?
   - Is the fallback restricted to only the platform owner tenant?
   - Could an attacker create a tenant and get platform-level API access through the fallback?
5. Encryption in transit:
   - Are credentials encrypted in the database and decrypted only at resolution time?
   - Are decrypted credentials ever stored back or cached in plaintext?
6. Audit trail:
   - Are credential access events logged?
   - Are credential updates logged with before/after (encrypted) values?

Database table: {{CREDENTIAL_TABLE}}
ORM: {{ORM}}
```

**Expected output:** Credential resolver security assessment with tenant isolation verification.

---

## Atlas UX Reference

Atlas UX's credential encryption stack:
- **Encryption:** AES-256-GCM via `lib/encryption.ts` with `encryptToken()` / `decryptToken()`
- **Key:** `TOKEN_ENCRYPTION_KEY` environment variable (64 hex chars = 256 bits)
- **Storage:** `tenant_credentials` table stores encrypted ciphertext with IV prepended
- **Resolution:** `credentialResolver.ts` checks tenant DB first, falls back to `process.env` for platform owner tenant only
- **Cache:** In-memory cache with 5-minute TTL, per-tenant isolation
- **Audit:** All credential mutations logged to `audit_log` table

---

## Resources

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST SP 800-57: Key Management Recommendations](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [GitGuardian State of Secrets Sprawl Report](https://www.gitguardian.com/state-of-secrets-sprawl-report)

## Image References

1. "AES-256-GCM encryption flow diagram with IV nonce and auth tag" — search: `aes gcm encryption flow diagram`
2. "Secret management hierarchy from env vars to KMS vault" — search: `secret management hierarchy cloud kms`
3. "Git secrets scanning workflow detecting leaked credentials" — search: `git secrets scanning detection workflow`
4. "Credential resolver multi-tenant lookup chain diagram" — search: `multi tenant credential resolution pattern`
5. "Encryption key rotation zero-downtime migration diagram" — search: `encryption key rotation migration diagram`

## Video References

1. [Secrets Management Best Practices for Developers](https://www.youtube.com/watch?v=jJJnFj-4bIY) — HashiCorp talk on managing secrets across environments
2. [How AES-GCM Works — Authenticated Encryption Explained](https://www.youtube.com/watch?v=g_eY7JXOc8U) — Visual explanation of AES-GCM internals and common implementation mistakes
