---
title: "How We Protect Your Deposited API Keys"
category: "Security & Privacy"
tags: ["security", "encryption", "credentials", "trust", "api-keys"]
related:
  - security-privacy/data-privacy
  - security-privacy/how-we-protect-your-data
  - security-privacy/audit-trail
---

# How We Protect Your Deposited API Keys

When you deposit an API key to unlock higher wiki API tiers and MCP access, you are trusting us with a credential that controls access to a paid service. We take that seriously. This article explains exactly how your deposited keys are stored, used, and protected -- so you can make an informed decision.

## Your Keys, Your Agents

Deposited API keys belong to you and are used exclusively for your own agent requests. We never pool deposited keys across users, share them with other tenants, or use them to subsidize platform operations. When your agent makes a request that requires a specific provider (OpenAI, Anthropic, ElevenLabs, etc.), the system resolves your deposited key for that platform and uses it for that request alone. No other user's agent will ever touch your key.

## Encryption at Rest: AES-256-GCM

Every deposited key is encrypted before it is written to the database using **AES-256-GCM** -- the same encryption standard used by banks, HIPAA-regulated health systems, and government agencies.

Here is what that means in practice:

- **AES-256** refers to the Advanced Encryption Standard with a 256-bit key. It would take billions of years to brute-force with current hardware.
- **GCM (Galois/Counter Mode)** adds authenticated encryption. This means the system can detect if encrypted data has been tampered with -- not just read protection, but integrity protection.
- **Unique IV per key.** Each deposited key is encrypted with its own randomly generated initialization vector (IV). Even if two users deposit the same API key, the encrypted output is completely different.
- **Separated encryption key.** The master encryption key (`TOKEN_ENCRYPTION_KEY`) is a 64-character hex string stored as a server environment variable. It never appears in source code, configuration files, or the database itself. Compromising the database alone does not expose your keys.

## What We Store

When you deposit a key, the following is written to the database:

- Encrypted ciphertext (your key, encrypted with AES-256-GCM)
- Platform name (e.g., "openai", "anthropic", "elevenlabs")
- Optional label you provide (e.g., "Production key")
- Active/revoked status
- Creation timestamp

**What we do NOT store:**

- Plaintext keys -- at no point is your raw key written to the database
- Key prefixes or suffixes (e.g., "sk-proj-...abc")
- Partial keys or truncated versions
- Any cleartext derivative of your key

## What We Never Do

This is our commitment. We never:

- **Log your keys.** API keys are excluded from all server logs. Sensitive headers (Authorization, cookies, webhook secrets) are redacted automatically.
- **Transmit your keys to third parties.** Your key is sent only to the provider it belongs to (e.g., your OpenAI key is sent only to OpenAI's API), and only when your agent makes a request.
- **Use your keys for our own purposes.** Platform operations use platform-owned keys. Your deposited keys are never borrowed.
- **Pool keys across users.** Each user's keys are isolated by tenant ID. There is no shared key pool.
- **Store keys in plaintext at any stage.** Keys are encrypted in memory before the database write. The plaintext exists only in server memory during the encryption operation and the subsequent API call, then is discarded.

## Access Control

Your deposited credentials are accessible only through your authenticated wiki API key. The credentials management endpoint enforces strict access control:

- Only your wiki API key can list, create, or revoke your deposited credentials.
- The credentials endpoint returns **masked metadata only** -- platform name, label, active status, and creation date. The encrypted key itself is never returned through the API. You cannot retrieve a deposited key after submitting it.
- All credential operations are logged to the audit trail with tenant isolation. See [Audit Trail](audit-trail.md) for details.

## Revocation

You can revoke any deposited key instantly:

```
DELETE /credentials/:id
```

Revocation is immediate. The encrypted key is deactivated and will no longer be used for any agent requests. If revoking a key drops you below the threshold for your current wiki API tier, your tier auto-downgrades to match your remaining deposited keys. You will not be charged for a tier you no longer qualify for.

You should revoke and re-deposit a key if you believe it has been compromised. We also recommend rotating your keys periodically as a security best practice.

## Terms of Service

Before depositing any API key, you must explicitly accept our Terms of Service. This step is enforced in the deposit flow -- you cannot bypass it. The ToS covers:

- What we do with deposited keys (use them for your agent requests only)
- What we do not do (everything listed in "What We Never Do" above)
- Your responsibility to keep your wiki API key secure
- Your right to revoke deposited keys at any time

This ensures informed consent. You know exactly what you are agreeing to before any key leaves your clipboard.

## One Key Per Platform

We accept one deposited key per platform per user, across 21 supported platforms. If you deposit a new key for a platform where you already have one, the new key replaces the previous one. The old key is overwritten -- not retained alongside the new one.

This keeps the system simple and prevents key sprawl. You always know exactly which key is active for each platform.

## Infrastructure

Deposited keys are stored in a **PostgreSQL 16** database hosted on **AWS Lightsail** with the following protections:

- **Encrypted storage volumes.** The underlying disk is encrypted by AWS.
- **No public access.** The database is not publicly accessible. It accepts connections only from the application server on the same private network.
- **Network isolation.** The database and application server communicate over AWS's internal network, not the public internet.
- **Automated backups.** AWS Lightsail manages database backups. Backups inherit the same encryption-at-rest protections.

The application server itself is hardened with HSTS, Helmet security headers, and strict HTTPS enforcement. See [How We Protect Your Data](how-we-protect-your-data.md) for the full infrastructure security overview.

---

## Resources

- [OWASP Credential Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Storage_Cheat_Sheet.html) -- Industry-standard guidelines for securely storing credentials in web applications.
- [NIST SP 800-38D: Recommendation for Block Cipher Modes of Operation (GCM)](https://csrc.nist.gov/publications/detail/sp/800-38d/final) -- The formal specification for AES-GCM authenticated encryption used in our credential vault.

## Image References

1. **Credential vault architecture diagram** -- A flowchart showing the path of a deposited API key from user input through AES-256-GCM encryption to encrypted storage in PostgreSQL, with the TOKEN_ENCRYPTION_KEY shown as a separate environment variable.
2. **Tenant isolation model** -- A diagram illustrating how deposited keys are isolated per tenant, with each user's keys stored in separate logical partitions and resolved only for that user's agent requests.
3. **Encryption at rest visualization** -- A side-by-side comparison showing a plaintext API key on the left and the corresponding AES-256-GCM ciphertext on the right, emphasizing that the stored value is unreadable without the encryption key.
4. **Key lifecycle flowchart** -- A step-by-step diagram showing the full lifecycle of a deposited key: deposit with ToS acceptance, encryption, storage, resolution for agent requests, and revocation with tier auto-downgrade.
5. **Access control boundary diagram** -- A diagram showing the security boundary around the credentials endpoint, illustrating that only authenticated requests with the user's wiki API key can access masked metadata, and that encrypted keys never leave the server.

## Video References

- [AES-256 Encryption Explained Simply](https://www.youtube.com/watch?v=O4xNJsjtN6E) -- A clear, non-technical explanation of how AES-256 encryption works and why it is considered secure.
- [How API Key Security Works in Modern Applications](https://www.youtube.com/watch?v=GhrvZ5nUWNg) -- An overview of best practices for storing and managing API keys in production systems.
