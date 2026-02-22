
# WORKFLOW — SUNDAY — Docs Intake + Draft Reply + Approval Gate (Audit-First)

## Agent Key
SUNDAY

## Purpose
Receive documentation requests by email, validate sender and content for secrets, produce a draft reply (template) and require explicit ATLAS approval before publishing.

## Trigger
email inbox (IMAP)

## Inputs
- Incoming email (from, subject, body/text, headers)
- Attachments (not downloaded by default)
- Metadata: messageId, inReplyTo, references, date

## Outputs
- Draft reply email (in-thread)
- Compliance stop reply (if secrets detected)
- Audit log events (EMAIL_RECEIVED, EMAIL_REPLY_SENT, etc.)

## Hard Rules
- Work starts with ATLAS email (if email-based)
- Reply in-thread for audit
- Never transmit secrets
- Requires explicit approval before posting (if social)
- Sender must be authorized (ATLAS list) to trigger normal processing

## Audit Events
- EMAIL_RECEIVED
- EMAIL_REPLY_SENT
- (or POST_ATTEMPT / POST_SUCCESS / POST_FAIL)

## Notes
- Required credentials / env vars:
  - IMAP credential for sunday.teambinky@deadapp.info (placeholder id in workflow)
  - SMTP credential for sending replies (placeholder id in workflow)
  - ATLAS audit endpoint: https://atlas-ux.onrender.com/api/audit/log
  - From email address: sunday.teambinky@deadapp.info
  - Allowed senders list is embedded in the workflow (atlas@deadappcorp.org, atlas@deadapp.info, billy@deadapp.info, bbwhited@icloud.com, bbwhited@live.com)
- Secrets detection uses regex heuristics; any match triggers a compliance stop and non-transmission of sensitive content.
- Tracking ID heuristic searches the subject for ID tokens.
- Execution settings: executionTimeout = 3600s; saveExecutionProgress and saveManualExecutions enabled.
- This workflow is audit-first: every receive and reply is logged to ATLAS.

## Workflow summary (nodes)
- Email Trigger (IMAP) — sunday.teambinky@deadapp.info
  - Reads INBOX via IMAP.
  - Credentials required: IMAP (replace credential id).
- Normalize Email (Code)
  - Extracts from/fromEmail, subject, text, messageId, inReplyTo, references, receivedAt, trackingId, threadKey.
  - threadKey heuristics: inReplyTo || references || messageId || `${fromEmail}|${subject}`
- Authorize Sender (ATLAS Required) (If)
  - Checks that fromEmail is in the allowed senders list; if not, halts to Unauthorized — Stop.
- Secret Check (Never Email Secrets) (Code)
  - Scans subject + text for secret-like patterns (API keys, private keys, passwords, client secrets, sk- keys).
  - Adds containsSecrets boolean.
- If Secrets Detected → Compliance Stop (If)
  - Branches to either Build Compliance Stop Reply or Draft Docs Response (Template Output).
- Build Compliance Stop Reply (Code)
  - Constructs compliance-stop reply body (explains why processing stopped, instructs to remove secrets and resubmit).
  - Sets blocked = true.
- Draft Docs Response (Template Output) (Code)
  - Builds a draft response template (Bulleted summary, Draft Content, Sources, Approval Status, Audit block).
  - Sets blocked = false.
- Audit Log — Email Received (HTTP Request)
  - POST to ATLAS audit endpoint recording receipt, containsSecrets, trackingId, etc.
- Send Reply Email (Audit Chain) (Email Send)
  - Sends reply in-thread from sunday.teambinky@deadapp.info to original sender using inReplyTo/references.
  - Credentials required: SMTP (replace credential id).
- Audit Log — Reply Sent (HTTP Request)
  - POST to ATLAS audit endpoint recording reply event, blocked flag, and sentAt ($now).
- Unauthorized — Stop (Code)
  - Marks unauthorized requests (from non-ATLAS senders) and stops processing.

## Connections / Flow (high-level)
1. IMAP trigger -> Normalize Email
2. Normalize -> (Authorize Sender) + (Audit Log — Email Received)
3. If authorized -> Secret check
   - If contains secrets -> Build Compliance Stop Reply -> Send Reply -> Audit Log — Reply Sent
   - If no secrets -> Draft Docs Response -> Send Reply -> Audit Log — Reply Sent
4. If not authorized -> Unauthorized — Stop

## Important configuration values to replace
- IMAP credentials: "REPLACE_WITH_CREDENTIAL_ID"
- SMTP credentials: "REPLACE_WITH_CREDENTIAL_ID"
- Ensure ATLAS audit endpoint is reachable (https://atlas-ux.onrender.com/api/audit/log) and allowed from your runtime.
- Update allowed senders list as organizational policy changes.

## Version / metadata
- versionId: 1
- active: false (workflow is not active by default)
- executionTimeout: 3600s

