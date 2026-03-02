# Security Policy

**Organization:** Dead App Corp (Atlas UX)
**Effective Date:** March 2, 2026
**Owner:** Billy Whited, Founder & CEO
**Review Cycle:** Quarterly

---

## 1. Purpose

This policy defines the security controls, practices, and requirements for the Atlas UX platform to protect user data, system integrity, and service availability.

## 2. Authentication & Authorization

- **JWT Authentication:** All API requests require a valid JWT token in the Authorization header.
- **Multi-Tenant Isolation:** Every database table enforces tenant_id scoping via Prisma middleware and PostgreSQL row-level security (RLS) policies.
- **Role-Based Access Control:** Three roles — owner, admin, member — with escalating permissions. Only owners and admins can approve Decision Memos.
- **OAuth 2.0:** Third-party integrations (Zoom, Microsoft 365, Google Workspace) use standard OAuth 2.0 authorization code flow. Tokens are stored encrypted with tenant isolation.

## 3. Data Protection

- **Encryption in Transit:** All communications use HTTPS/TLS 1.3. No plaintext HTTP endpoints are exposed.
- **Encryption at Rest:** Database hosted on Supabase with AES-256 encryption at rest. OAuth tokens stored in encrypted columns.
- **Secret Detection:** Automated scanning prevents secrets (API keys, passwords, private keys) from being transmitted in email or logged in audit trails. Detection triggers a compliance stop.
- **No Secrets in Logs:** Audit trail records metadata only — never credentials, tokens, or sensitive content.

## 4. Infrastructure Security

- **Frontend:** Hosted on Vercel with automatic SSL, DDoS protection, and edge caching.
- **Backend:** Hosted on Render with managed TLS, automatic scaling, and isolated container runtime.
- **Database:** Supabase PostgreSQL with connection pooling (PgBouncer), automated backups, and point-in-time recovery.
- **No Direct Database Access:** All database operations go through the Prisma ORM with parameterized queries — no raw SQL injection vectors.

## 5. Input Validation

- All API inputs validated with Zod schemas at the request boundary.
- Email addresses, URLs, and structured data are validated before processing.
- File uploads are restricted by type and size where applicable.

## 6. Rate Limiting

- API endpoints enforce per-IP and per-tenant rate limits.
- Decision memo approval/rejection endpoints have stricter rate limits (10 approvals/minute, 20 rejections/minute).
- Authentication endpoints are rate-limited to prevent brute force attacks.

## 7. Audit Trail

- Every mutation (create, update, delete) across all system entities is logged to the audit_log table.
- Audit entries include: timestamp, actor (human/system/agent), action, entity type, entity ID, tenant ID, and metadata.
- Audit logs are append-only and retained indefinitely.
- Agent actions that exceed risk thresholds require human approval before execution.

## 8. Webhook Security

- All incoming webhooks (Zoom, Stripe) are verified using HMAC-SHA256 signature validation.
- Webhook endpoints reject requests that fail signature verification.
- Webhook events are logged to the audit trail for traceability.

## 9. Access Control

- Production environment variables (API keys, secrets) are managed via Render's encrypted environment variable store.
- No secrets are committed to source control.
- Git repository access is restricted to authorized personnel.

## 10. Incident Response

- Security incidents are escalated immediately to the founder/CEO.
- Affected OAuth tokens are revoked and re-issued.
- Incident details are logged to the audit trail.
- See Incident Management and Response Policy for full procedures.
