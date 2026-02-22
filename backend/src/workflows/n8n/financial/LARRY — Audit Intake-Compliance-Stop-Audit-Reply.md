
# LARRY — Audit Intake + Compliance Stop + Audit Reply (Audit-First)

## Summary
This workflow ingests incoming email to larry.auditor@deadapp.info, normalizes the message, enforces an "ATLAS required" sender whitelist, scans for secrets (and blocks/replies if secrets are present), logs events to the Atlas audit API, and sends audit-style replies back to the sender. It is designed for audit-first governance and includes compliance stops when sensitive data is detected.

## Files included
- LARRY-workflow.json — n8n workflow JSON (importable).
- This Markdown file — documentation and quick setup notes.

## High-level nodes / responsibilities
- Email Trigger (IMAP) — Listens for incoming messages.
- Normalize Email — Extracts/from, subject, text, messageId, threadKey, timestamps.
- Authorize Sender (ATLAS Required) — Only allows defined ATLAS senders to proceed.
- Secret Check (Never Transmit Secrets) — Scans subject+body for secret patterns (keys, API tokens, passwords).
- If Secrets Detected → Compliance Stop — Branches to compliance stop or normal audit draft.
- Build Compliance Stop Reply — Prepares a stern compliance email when secrets found; blocks execution.
- Draft Audit Response (Template Output) — Prepares an audit-style reply template for non-sensitive requests.
- Send Reply Email (Audit Chain) — Sends the reply from Larry's address, preserving In-Reply-To/References.
- Audit Log — Email Received / Audit Log — Reply Sent — POST events to Atlas audit API.
- Unauthorized — Stop — Halts silently for unauthorized senders.

## Execution flow
1. Email arrives → Normalize Email
2. Normalize Email → Audit Log — Email Received (logs receipt) + Authorize Sender
3. If sender is authorized → Secret Check
   - If secrets detected → Build Compliance Stop Reply → Send Reply → Audit Log — Reply Sent
   - If no secrets → Draft Audit Response → Send Reply → Audit Log — Reply Sent
4. If sender not authorized → Unauthorized — Stop (silent stop)

## Important setup steps (before enabling)
- Replace credential placeholders in the JSON:
  - IMAP credential: replace the id under Email Trigger (IMAP) credentials or configure a new credential named "Larry IMAP".
  - SMTP credential: replace the id under Send Reply Email (Audit Chain) credentials or configure a new credential named "Larry SMTP".
- Verify the Atlas audit API URLs:
  - Default endpoints used: https://atlas-ux.onrender.com/api/audit/log — update if you have a different endpoint.
- Secret detection:
  - The workflow includes several regex patterns to detect API keys, private keys, and other secrets. Adjust patterns if needed.
- Review outbound email options (From address, headers like inReplyTo and references) to ensure they match your mail provider and threading expectations.
- Test with a non-production mailbox first.

## Import into n8n
- In n8n, go to Workflows → Import → Paste JSON or upload the file `LARRY-workflow.json`.
- After import, edit the credentials in the workflow node settings to attach your IMAP/SMTP credentials.
- Save and activate the workflow once configured and tested.

## Notes / Recommendations
- Keep audit logs retention and access policies consistent with governance rules.
- The workflow sets `blockExecution` when secrets are detected; ensure your downstream logging/alerting meets compliance requirements.
- Consider limiting execution permissions and enabling execution timeout/safety settings in n8n for this agent.

