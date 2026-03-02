# Data Retention & Protection Policy

**Organization:** Dead App Corp (Atlas UX)
**Effective Date:** March 2, 2026
**Owner:** Billy Whited, Founder & CEO
**Review Cycle:** Quarterly

---

## 1. Purpose

This policy defines how Atlas UX retains, protects, and disposes of user data and integration data, including data obtained from Zoom APIs.

## 2. Data Classification

| Classification | Examples | Retention |
|---------------|----------|-----------|
| Account Data | Name, email, org name | Until account deletion |
| OAuth Tokens | Zoom, Microsoft, Google tokens | Until integration disconnected |
| Audit Logs | Action logs, timestamps, actor IDs | Indefinite (compliance requirement) |
| Meeting Metadata | Titles, dates, participant counts | 90 days |
| Transient Processing Data | AI summaries, transcriptions | Not stored — processed in-memory |
| Credentials/Secrets | API keys, passwords | Never logged or transmitted via email |

## 3. Protection Controls

- **Encryption at Rest:** AES-256 via Supabase/AWS infrastructure.
- **Encryption in Transit:** TLS 1.3 on all connections.
- **Tenant Isolation:** PostgreSQL row-level security policies enforce strict data separation between organizations.
- **Access Control:** Role-based access (owner/admin/member). Only owners and admins can approve high-risk actions.
- **Parameterized Queries:** All database access through Prisma ORM — no raw SQL.

## 4. Zoom-Specific Data Handling

- **Tokens:** Zoom OAuth access_token and refresh_token are stored encrypted in the token_vault table with tenant isolation. Tokens are refreshed automatically before expiry.
- **Meeting Data:** Meeting metadata (title, time, participants) is retrieved via Zoom API for scheduling and summary generation. No audio or video content is stored.
- **Recordings:** Recording URLs are accessed temporarily for transcription. Transcriptions are processed in-memory and delivered to the user. No recording files are stored on Atlas UX servers.
- **Chat Messages:** Messages sent to Zoom Team Chat are composed by agents and sent via API. Sent message content is not retained beyond the audit log entry (which records only that a message was sent, not its content).

## 5. Data Disposal

- When a user disconnects a Zoom integration, all associated OAuth tokens are immediately deleted from the database.
- When a user deletes their account, all associated data (tokens, audit logs, agent configurations) is permanently deleted within 30 days.
- Transient data (AI processing results) is garbage-collected by the Node.js runtime — no manual cleanup required.

## 6. Backup & Recovery

- Database backups are managed by Supabase with automated daily backups and point-in-time recovery.
- Backups are encrypted and stored in geographically separate AWS regions.
- Backup retention follows Supabase's standard policy (7 days for daily backups).

## 7. Data Breach Response

- In the event of a data breach, affected users are notified within 72 hours.
- All compromised tokens are revoked immediately.
- See Incident Management and Response Policy for full procedures.
