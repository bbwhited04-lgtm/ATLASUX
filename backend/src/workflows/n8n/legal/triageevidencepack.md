Workflow: ATLAS ➜ Benny (IP Counsel CTO) — Triage & Evidence Pack
Version: 1.0
Owner: Benny (benny.cto@deadapp.info)
Effective: 2026-02-21T16:56:00-06:00

Purpose

Treat Benny's work as triage + evidence-pack generation (advisory only). Not a substitute for a final legal opinion.
Intake originates only from ATLAS email. Deliverables returned by email reply for audit chain.
Default research scope: domain-class only (domains, WHOIS, registrar records, trademark/patent registries, official records). Expanded web/social searches require explicit ATLAS authorization.
Agents never freestyle, never call other agents, and execute a single capability per assignment. Atlas Orchestrator assigns work and issues receipts.
Minimum payload (ATLAS → workflow)

Required fields (reject if any required missing): jurisdiction, asset_type, question
Example minimum JSON payload:
{ "request_id": "uuid", "company": "DEAD APP CORP", "asset_type": "software|brand|content|patent|copyright|trademark|contract", "jurisdiction": "US|state|multi", "question": "What are we trying to decide?", "facts": "What we know (dated).", "links": ["repo/docs/urls"], "constraints": ["truth-only", "cite sources", "no legal advice"], "requested_by": "atlas|billy", "timestamp": "ISO" }

High-level goal

Produce a concise, auditable evidence pack that enables product/exec teams to decide next steps. Deliverables are advisory; include risk classification, decision options, missing facts, and a non-legal disclaimer.
Workflow stages (nodes)

Normalize & validate payload (Gate)
Parse incoming JSON payload and required attachments.
Reject / return error if missing: jurisdiction, asset_type, question.
Create an initial case row in atlas_ip_requests with raw payload and intake timestamp. Store ATLAS-thread-id and Atlas receipt-id if provided by Orchestrator.
Minimal audit fields: request_id, received_at, received_by (atlas), receipt_id.
Evidence capture (Audit-first)
Store the raw request JSON in DB (atlas_ip_requests.raw_payload).
Save attachments/links metadata; optionally download attachments for archival.
Compute SHA256 hashes for each attachment/link (or downloaded content) and store them for chain-of-custody. Record retrieval timestamp and source URL.
Record who uploaded/attached (atlas identity).
Research gather (Domain-class-first)
Query internal KB (policies, prior filings, prior atlas_ip_reports) first. Log queries + timestamps.
Domain-class research (default): USPTO/EUIPO/WIPO searches, WHOIS/registrar checks, domain history, patent registries, official registrar records. Store exports (PDF/HTML/screenshots) and their hashes.
Optional web/social research: allowed only if ATLAS explicitly permits; must record authorization in case record and save full citations + retrieval timestamps.
Every query result must include source URL, query string, retrieval date/time, and export hash.
Risk classification & missing facts
Classify risk: low / medium / high. For each classification include reasoning and supporting evidence.
List "unknowns" and "what's missing" that materially affect risk (dates of creation, proof of use in commerce, registration numbers, jurisdiction-specific facts). Mark each missing item as "required" or "nice-to-have".
If evidence raises compliance/audit concerns, raise a Compliance Stop immediately (see below).
Deliverable pack generation
Produce a single deliverable package (attachments + short memo) containing:
1-page plain-English summary (what the question is; one-line answer; risk level).
Decision tree / if-then (concise steps for each decision branch).
Checklist of next steps (owner + suggested timeframe), e.g. "file trademark class X" or "collect creation evidence dated YYYY-MM-DD".
Evidence index (list of all evidence items, hashes, retrieval dates, and storage URIs).
Source list with retrieval dates and direct citations.
Non-legal disclaimer block: clearly state advisory nature, no legal advice, recommend counsel if legal action is contemplated.
Required approvals block (who must approve to proceed and why).
Approve/Deny token instructions and reply mechanics (see Approval request).
Name deliverable files per convention: ATLAS_<request_id>_Benny_EvidencePack_YYYYMMDD_HHMMZ.pdf (and supporting artifacts similarly).
Approval request (email)
Send an approval email to the requested approver(s)/Benny with Approve/Deny token links or reply tokens. Email MUST include:
request_id, ATLAS-thread-id, Atlas receipt-id, original timestamp.
1-line exec summary and risk level.
Approve token & Deny token (or structured reply pattern matching atlas_ip_messages). Tokens should map to entries in atlas_ip_messages with timestamped verdicts.
If approval is required but not provided within the configured SLA, notify requestor and record escalation attempts.
Write results & closure
Insert final rows into atlas_ip_reports (report_id, request_id, summary, risk_level, citations JSONB, artifacts URIs, artifact hashes, created_by, created_at).
Optionally reuse atlas_suggestions by adding category=ip and relevant fields (see Tables below).
Mark request as closed in atlas_ip_requests and store closure metadata (closed_by, closed_at, closure_notes).
Generate final audit receipt and attach to thread reply.
Compliance Stop

If a blocking compliance/audit issue is discovered, raise a Compliance Stop:
Email subject: ATLAS COMPLIANCE STOP - [ATLAS-thread: <msgid>] - [receipt: <receipt-id>]
Body: concise reason, ATLAS_POLICY reference, evidence attachments, required approvers to lift stop.
Pause all downstream actions until stop is explicitly lifted by approver(s) and Atlas Orchestrator confirms.
Agent & Orchestrator rules

Atlas Orchestrator assigns work and issues receipt_id. No agent may self-initiate.
Agents must execute a single capability per assignment (e.g., "run USPTO search").
Agents never call other agents.
Agents cannot freestyle or expand scope beyond domain-class unless explicit ATLAS authorization is logged in the case.
All agent actions logged with timestamps and outputs saved to DB.
Deliverables — required fields & format

email reply subject: [ATLAS receipt: <receipt-id>] [ATLAS-thread: <msgid>] IP Triage: <one-line subject>
email body must include:
ATLAS-thread: <msgid> | orig timestamp: <orig-timestamp> | Atlas receipt: <receipt-id>
Exec summary (1-2 lines)
Risk level (low/med/high) + short rationale
Decision options & recommended next step(s) (if any)
Missing facts / evidence required
Approvals needed (who & due-by)
Attached artifacts list (filenames) + storage URIs + SHA256 hashes
Non-legal disclaimer
Attach Evidence Pack (PDF) + raw exports as separate artifacts.
Data model / table suggestions (DDL-like examples)

Option A: new tables (preferred for audit separation)
atlas_ip_requests

request_id uuid PRIMARY KEY
raw_payload jsonb
company text
asset_type text
jurisdiction text
question text
received_by text
received_at timestamptz
receipt_id text
status text
created_at timestamptz
updated_at timestamptz
atlas_ip_reports

report_id uuid PRIMARY KEY
request_id uuid REFERENCES atlas_ip_requests(request_id)
summary text
risk_level text
decision_tree jsonb
checklist jsonb
citations jsonb
artifacts jsonb -- array of {uri, filename, sha256, retrieved_at}
created_by text
created_at timestamptz
atlas_ip_messages

message_id uuid PRIMARY KEY
request_id uuid
message_type text -- approval_request / approval_reply / compliance_stop
payload jsonb
actor text
received_at timestamptz
Option B: reuse atlas_suggestions with additions Add fields to atlas_suggestions (or equivalent):
category text (e.g., "ip")
jurisdiction text
asset_type text
citations jsonb
risk_level text
artifacts jsonb
Evidence & chain-of-custody rules

Compute SHA256 for every downloaded artifact and every archived HTML/PDF/screenshot. Store hash with retrieval timestamp and source URL. Do not store secrets.
For links where content isn't archived, store canonical URL, retrieval timestamp, and a short hash of the HTTP response body if allowed by policy.
SLA (suggested)

Acknowledge: within 4 business hours.
Preliminary pack (initial research & missing facts list): within 2 business days.
Full Evidence Pack: within 5 business days (unless expedited).
Non-legal disclaimer (must appear in all deliverables)

"This document is an advisory evidence pack prepared for internal triage. It is not legal advice. For binding legal opinions or litigation actions, consult licensed counsel."
Templates & naming conventions

Attachment naming: ATLAS_<request_id>Benny<doc-type>_YYYYMMDD_HHMMZ.pdf
Evidence index: CSV/JSON listing filename, uri, sha256, retrieval_date, source
Checklist (quick)

[ ] Payload validated (jurisdiction, asset_type, question)
[ ] Raw request stored (atlas_ip_requests)
[ ] Evidence captured (artifacts stored + hashes)
[ ] Research (internal KB + domain-class searches)
[ ] Risk classification done with reasons
[ ] Deliverable pack generated & attached
[ ] Approval request sent (approve/deny token logged)
[ ] Report written to atlas_ip_reports and request closed
Examples & notes

Keep all replies as email replies to the ATLAS thread to preserve message-id and audit chain. Include the ATLAS-thread-id and Atlas receipt-id in subject/body.
If a research step needs a secret or credential (e.g., private repository access), do NOT supply the secret in email. Reference secure vault entries (vault://...). Requestor must provide vault auth via secure channel.
