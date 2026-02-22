
# TINA — Finance Intake + Risk Gate + Advisory Reply (Audit-First)

## Overview
This n8n workflow implements "TINA" — a CFO/Treasurer email intake and automated advisory reply system with audit-first logging and a secrets compliance gate. Incoming emails to tina.cfo@deadapp.info are normalized, authorized (ATLAS senders only), scanned for secrets, logged to an audit endpoint, and replied to with either a compliance stop message or a CFO template reply. Replies are recorded to the audit endpoint.

## Files included
- TINA-workflow.json — n8n workflow export (replace credential IDs before importing).
- TINA-workflow.md — this documentation.

## How to import
1. In n8n, go to Workflows → Import from File.
2. Upload `TINA-workflow.json`.
3. After import, set up credentials (IMAP and SMTP) and update any environment-specific URLs.

## Required credential steps (replace placeholders)
- IMAP credential: replace the credential id/name under the "Email Trigger (IMAP) — tina.cfo@deadapp.info" node. The JSON uses:
  - id: "REPLACE_WITH_CREDENTIAL_ID"
  - name: "Tina IMAP"
- SMTP credential: replace the credential id/name under "Send Reply Email (Audit Chain)":
  - id: "REPLACE_WITH_CREDENTIAL_ID"
  - name: "Tina SMTP"

Make sure the SMTP credential is authorized to send from tina.cfo@deadapp.info.

## Nodes and behavior (summary)
- Email Trigger (IMAP): watches INBOX for new messages.
- Normalize Email (code): extracts from, subject, text, messageId, inReplyTo, references, receivedAt and computes threadKey.
- Authorize Sender (IF): allows only ATLAS senders (list of approved emails). If not authorized, flows to "Unauthorized — Stop".
- Secret Check (code): scans subject + body for likely secrets (API keys, private key headers, sk- tokens, passwords).
- If Secrets Detected → Compliance Stop (IF): if secrets found, sends to "Build Compliance Stop Reply".
- Build Compliance Stop Reply (code): constructs a compliance/audit stop reply instructing sender to redact secrets; sets blockExecution=true.
- Draft CFO Response (code): builds a CFO review template reply (no sensitive analysis performed, template only); sets blockExecution=false.
- Send Reply Email (emailSend): replies to original sender with replySubject/replyBody; preserves In-Reply-To/References headers for threading.
- Audit Log — Email Received (httpRequest): posts an EMAIL_RECEIVED event to https://atlas-ux.onrender.com/api/audit/log with thread metadata.
- Audit Log — Reply Sent (httpRequest): posts an EMAIL_REPLY_SENT event to the same audit endpoint after sending a reply.
- Unauthorized — Stop (code): terminates unauthorized senders (sets unauthorized/stop flags).

## Audit & Security notes
- Audit endpoint: https://atlas-ux.onrender.com/api/audit/log. Confirm this endpoint and any auth requirements before enabling.
- Secrets detection is heuristic; review or extend the regex list if you have other patterns.
- The workflow intentionally blocks processing of any message containing secrets — it returns a compliance stop and logs the event.
- Never include secrets in email text when interacting with this system.

## Customization pointers
- Authorized senders: update the email list in "Authorize Sender (ATLAS Required)".
- Secret patterns: update the regex array inside "Secret Check (Never Transmit Secrets)" node.
- Audit payloads: open the HTTP Request nodes to add authentication headers or change field names.
- Reply content: edit the code node templates to match tone and required data.

## Troubleshooting
- If imports fail: ensure JSON is valid (the provided file is standard n8n export). Check n8n version compatibility; node typeVersion values assume an n8n version that supports those node versions.
- If emails are not being sent: verify SMTP credentials and that the "from" address is allowed by the SMTP provider.
- If audit logs are not received: check URL reachability, timeouts, and whether the endpoint requires auth or TLS options.

## Version
- Workflow versionId: 1

If you'd like, I can:
- Add authentication (API key or Bearer token) to the audit HTTP nodes.
- Replace the placeholder credential IDs with actual IDs you provide.
- Export additional formats (ZIP, README, or a checklist for deployment).
