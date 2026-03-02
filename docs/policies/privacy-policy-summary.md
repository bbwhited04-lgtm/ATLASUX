# Privacy Policy (Summary for Zoom Marketplace)

**Organization:** Dead App Corp (Atlas UX)
**Full Policy:** https://atlasux.cloud/#/privacy
**Effective Date:** March 2, 2026
**Owner:** Billy Whited, Founder & CEO

---

## 1. Data Collection

Atlas UX collects only the data necessary to provide its AI workforce automation service:

- **Account Data:** Name, email address, organization name, role.
- **OAuth Tokens:** Encrypted access and refresh tokens for connected services (Zoom, Microsoft 365, Google Workspace). Used solely to make authorized API calls on the user's behalf.
- **Meeting Metadata:** Meeting titles, dates, participant counts, and recording availability — used for scheduling, summaries, and task extraction. No audio/video content is stored.
- **Audit Logs:** Timestamps, actor identifiers, and action descriptions for compliance and traceability. No message content or PII is stored in audit logs.

## 2. Data Usage

- Zoom data is used exclusively to schedule meetings, retrieve recordings for transcription, and post agent updates to Team Chat.
- No Zoom data is sold, shared with third parties, or used for advertising.
- AI processing occurs in-memory and is discarded after task completion. No training on user data.

## 3. Data Storage

- All data stored in Supabase PostgreSQL (AWS infrastructure) with AES-256 encryption at rest.
- OAuth tokens stored in tenant-isolated, encrypted database columns.
- Row-level security enforces strict tenant isolation — no cross-tenant data access.

## 4. Data Retention

- OAuth tokens retained until user disconnects the integration or the token is revoked.
- Audit logs retained indefinitely for compliance.
- Meeting metadata retained for 90 days, then automatically purged.
- Users can request data deletion at any time via support@deadapp.info.

## 5. Data Sharing

- No user data is shared with third parties except as required to provide the service (e.g., API calls to Zoom on the user's behalf).
- No data is sold or used for advertising.
- Law enforcement requests are evaluated on a case-by-case basis and users are notified unless legally prohibited.

## 6. User Rights

- Access: Users can view all their data through the Atlas UX dashboard.
- Deletion: Users can request complete data deletion via email.
- Portability: Users can export their data in standard formats.
- Revocation: Users can disconnect any integration at any time, immediately revoking OAuth access.
