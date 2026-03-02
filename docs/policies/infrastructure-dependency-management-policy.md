# Infrastructure & Dependency Management Policy

**Organization:** Dead App Corp (Atlas UX)
**Effective Date:** March 2, 2026
**Owner:** Billy Whited, Founder & CEO
**Review Cycle:** Quarterly

---

## 1. Purpose

This policy defines how Atlas UX manages its infrastructure, third-party dependencies, and deployment pipeline to maintain security, reliability, and compliance.

## 2. Infrastructure Overview

| Component | Provider | Purpose |
|-----------|----------|---------|
| Frontend Hosting | Vercel | Static SPA deployment, edge CDN, automatic SSL |
| Backend Hosting | Render | Node.js API server, managed containers, auto-scaling |
| Database | Supabase (PostgreSQL 16) | Primary data store with RLS, automated backups |
| DNS & Domain | Vercel / Cloudflare | Domain management, HTTPS enforcement |
| Secret Management | Render Environment Variables | Encrypted env var storage for API keys and secrets |

## 3. Deployment Pipeline

- **Source Control:** GitHub (private repository). All changes committed to main branch.
- **Frontend Deployment:** Vercel auto-deploys on git push to main. Build command: `npm run build`. Output: `./dist`.
- **Backend Deployment:** Render auto-deploys on git push to main. Build command: `npm install && npm run build`. Start: `npm run start`.
- **Database Migrations:** Prisma migrations applied during deployment. Failed migrations block deployment.
- **No Manual Deployments:** All production changes go through git → CI/CD pipeline. No SSH access to production servers.

## 4. Dependency Management

- **Package Manager:** npm with package-lock.json for deterministic installs.
- **Vulnerability Scanning:** `npm audit` runs on every build. Critical vulnerabilities block deployment.
- **Update Cadence:** Dependencies reviewed monthly. Security patches applied within 72 hours of disclosure.
- **Lockfile Integrity:** package-lock.json committed to source control. No floating version ranges for production dependencies.

## 5. Third-Party Integrations

All third-party API integrations follow these requirements:

- OAuth 2.0 or API key authentication only.
- Tokens stored encrypted with tenant isolation.
- All API calls over HTTPS/TLS 1.3.
- Webhook payloads verified via HMAC-SHA256 before processing.
- Integration can be disconnected by the user at any time, immediately revoking access.

### Current Integrations

| Service | Auth Method | Data Access |
|---------|------------|-------------|
| Zoom | OAuth 2.0 | Meetings, recordings, chat |
| Microsoft 365 | OAuth 2.0 (client_credentials) | Mail, calendar, Teams |
| Google Workspace | OAuth 2.0 | Gmail, Drive, Calendar, YouTube |
| Stripe | API Key + Webhooks | Billing, subscriptions |
| Social Platforms | OAuth 2.0 / API Key | Content publishing, monitoring |
| AI Providers | API Key | LLM inference (no user data stored) |

## 6. Monitoring & Availability

- **Uptime Monitoring:** Render provides health check monitoring on the backend API.
- **Error Logging:** Application errors logged via Fastify's built-in logger.
- **Audit Trail:** All system events logged to the audit_log table with timestamps.
- **Alerting:** Critical failures (exhausted job retries, auth failures) trigger email notifications to the admin.

## 7. Backup & Disaster Recovery

- **Database:** Supabase automated daily backups with point-in-time recovery (7-day retention).
- **Source Code:** GitHub with full git history. No single point of failure.
- **Infrastructure:** Vercel and Render provide redundancy and automatic failover.
- **RTO (Recovery Time Objective):** 1 hour for backend, immediate for frontend (static CDN).
- **RPO (Recovery Point Objective):** 24 hours (daily database backups).
