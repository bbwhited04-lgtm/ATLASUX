
# n8n Workflow — Atlas Binky Research (Binky)

Version: 1.0  
Purpose: Implement the 8-stage research-only workflow for "Binky" (Atlas research agent).  
Stage codes used in workflow:
INTAKE__webhook, GATE__validate_payload, AUDIT__research_started, KB__search_internal, WEB__optional_research, LLM__analyze, DB__store_research, EVENT__research_completed, RESPOND__success

---

## Summary / Flow
1. Webhook (INTAKE__webhook) receives POST at /atlas-binky-research.  
2. Validate required fields (GATE__validate_payload). Fail with error if missing.  
3. Emit audit "agent.research.started" (AUDIT__research_started). HTTP or local.  
4. Knowledge gathering:
   - Internal KB search (KB__search_internal).
   - Optional external web research only if constraints include the token `allow_external_research` (WEB__optional_research).
5. LLM analysis (LLM__analyze) using OpenAI/ChatGPT to produce a strict JSON report defined by schema.
6. Store LLM output into `atlas_research_reports` (DB__store_research).
7. Emit completed event for Daily Intel (EVENT__research_completed).
8. Respond to caller with structured success JSON (RESPOND__success).

Required input payload (JSON)
{
  "request_id": "uuid",
  "receipt_id": "string",
  "atlas_thread_id": "string",
  "research_topic": "string",
  "research_type": "market|technical|competitive|regulatory|general",
  "scope": "string",
  "constraints": ["string"],
  "requested_by": "string",
  "timestamp": "ISO-8601"
}

Constraint token for external research: `allow_external_research`  
(Only when present should the workflow perform external web research.)

---

## Node-by-node Specification (n8n-friendly)

Notes:
- Use `request_id` as the idempotency key. Consider creating a unique index on `atlas_research_reports.request_id`.
- Use temperature=0 for LLM calls (reduces hallucination risk).
- All timestamps must be ISO-8601.

### 1) Webhook — INTAKE__webhook
- n8n Node type: Webhook
- Node name: Webhook (atlas-binky-research)
- HTTP Method: POST
- Path: atlas-binky-research
- Response Mode: On Received (we will respond later after workflow completes)
- Accept: application/json
- Output: JSON payload forwarded to next node

### 2) Function — GATE__validate_payload
- Node type: Function
- Node name: GATE__validate_payload
- Stage code: GATE__validate_payload
- Purpose: enforce required fields
- JavaScript (n8n function):

const body = $json;
const { request_id, research_topic, research_type } = body;
if (!request_id || !research_topic || !research_type) {
  // Per spec: throw this exact message so other systems can detect it
  throw new Error("Missing required fields");
}
// forward full body
return [{ json: body }];

- On error: Configure a workflow error handler or "Execute Workflow" on error to return HTTP 400 with:
{
  "ok": false,
  "error": "Missing required fields",
  "code": "GATE__validate_payload"
}

### 3) HTTP Request or Function — AUDIT__research_started
- Node name: AUDIT__research_started
- Stage code: AUDIT__research_started
- Purpose: emit an audit event "agent.research.started"
- Payload to emit:

{
  "event": "agent.research.started",
  "request_id": "{{$json.request_id}}",
  "research_type": "{{$json.research_type}}",
  "requested_by": "{{$json.requested_by}}",
  "timestamp": "{{ new Date().toISOString() }}"
}

- Implementation options:
  - HTTP Request node: POST to Atlas audit endpoint (e.g., `https://atlas.example.internal/audit`) with Authorization header if required.
  - If running local / no outgoing HTTP: use a Function node to attach `audit_event` to workflow data for logging.

### 4A) KB Search — KB__search_internal
- Node name: KB__search_internal
- Stage code: KB__search_internal
- Purpose: query internal KB / internal DB for related documents
- Input: `research_topic`, `scope`
- Implementation examples:
  - Use n8n HTTP Request to internal KB API; or
  - Use n8n Postgres node to run a search query against internal_kb table.
- Expected output (map into workflow variable `kb_results`):

[
  {
    "title": "Internal note: Q3 competitor analysis",
    "source": "internal_kb",
    "url": null,
    "snippet": "...",
    "retrieved_at": "2026-02-21T17:10:40.944-06:00"
  }
]

- Ensure each item includes `retrieved_at` ISO-8601.

### 4B) WEB__optional_research (CRITICAL gating)
- Node name: WEB__optional_research
- Stage code: WEB__optional_research
- Purpose: perform external web research ONLY if `constraints` includes `allow_external_research`
- Implementation pattern: Function node that checks constraints and either:
  - Adds `external_research_skipped: true` and `web_results: []`, OR
  - Proceeds to run external queries (HTTP Request nodes, SerpAPI, scraping) and attach `web_results` array.
- Function snippet (Decision gate):

const payload = $json;
const constraints = payload.constraints || [];
const allowExternal = constraints.includes("allow_external_research");
if (!allowExternal) {
  payload.external_research_skipped = true;
  payload.web_results = [];
  return [{ json: payload }];
}
// If allowed, proceed to nodes that perform external requests and set payload.external_research_skipped = false
return [{ json: payload }];

- If external search is allowed:
  - Use a controlled set of HTTP Request nodes (limit sites, use user-specified sources if provided).
  - For each web result record: include title, source, url, snippet, retrieved_at.

IMPORTANT builder instruction (to keep blast radius small):
"Only perform external research if explicitly allowed in constraints. Otherwise set external_research_skipped = true and skip all external HTTP calls."

### 5) LLM Analysis — LLM__analyze
- Node type: OpenAI / Chat (or HTTP request to OpenAI)
- Node name: LLM__analyze
- Stage code: LLM__analyze
- Model: gpt-4o / gpt-4 / gpt-4o-mini as available; set temperature=0
- System instruction (use exactly or adapt carefully):

SYSTEM MESSAGE:
You are Binky — a read-only research assistant. Strict rules:
- Output MUST be valid JSON and nothing else. Do not add any commentary, markdown, or code fences.
- Use only the JSON schema provided below.
- Cite every factual claim where possible using the citations array. Each citation must include title, source, url (if available), and retrieved_at (ISO-8601).
- Mark uncertainty explicitly. Use the "confidence_level" field: low|medium|high. If information is insufficient, set confidence_level to "low".
- No hallucinations: if a fact is not supported by provided sources, explicitly mark it as unknown in gaps_or_unknowns.
- Research only: do NOT provide approvals, actions, or operational instructions that change system state.
- Enforce that no operational tables are modified except atlas_research_reports (this workflow will take care of DB writes).
- Output JSON schema (and only that schema):

{
  "one_line_summary": "string",
  "key_findings": ["string"],
  "risk_signals": ["string"],
  "confidence_level": "low|medium|high",
  "citations": [
    {
      "title": "string",
      "source": "string",
      "url": "string",
      "retrieved_at": "ISO-8601"
    }
  ],
  "gaps_or_unknowns": ["string"]
}

- User prompt (single user message, include these fields) — ensure all inserted data is sanitized where necessary:

USER MESSAGE (example; use expressions to populate fields dynamically):
Research task:
- request_id: {{$json.request_id}}
- research_topic: "{{$json.research_topic}}"
- research_type: "{{$json.research_type}}"
- scope: "{{$json.scope}}"
- constraints: {{$json.constraints || []}}
- kb_results: {{$json.kb_results || []}}
- web_results: {{$json.web_results || []}}
- external_research_skipped: {{$json.external_research_skipped ? true : false}}
- requested_by: "{{$json.requested_by}}"

Task:
Analyze the available material and return ONLY a single JSON object that validates against the schema in the system message. Focus on facts, cite sources with retrieval dates (ISO-8601), and mark any uncertainty or gaps. Do NOT provide recommendations that require approval or operations. If data is insufficient, set confidence_level to "low".

- Model Params: temperature: 0, top_p: 1, max_tokens: 1600 (adjust as needed), presence_penalty: 0, frequency_penalty: 0.

- After the LLM node: add a JSON schema validator node (or Function) that validates the output is strict JSON matching the schema. If validation fails, abort workflow and log the LLM raw output for debugging.

### 6) DB — DB__store_research
- Node name: DB__store_research
- Stage code: DB__store_research
- Purpose: Insert the validated LLM output into `atlas_research_reports` (Postgres recommended)
- Table DDL (Postgres):

CREATE TABLE IF NOT EXISTS atlas_research_reports (
  id bigserial primary key,
  request_id uuid not null unique,
  research_topic text not null,
  research_type text not null,
  summary text,
  findings jsonb,
  citations jsonb,
  confidence_level text,
  created_by text default 'binky',
  created_at timestamptz default now()
);

- Insert SQL (parameterized):

INSERT INTO atlas_research_reports
(request_id, research_topic, research_type, summary, findings, citations, confidence_level, created_by, created_at)
VALUES
($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, 'binky', now())
ON CONFLICT (request_id) DO NOTHING
RETURNING id;

- Bind variables:
  1: {{$json.request_id}}
  2: {{$json.research_topic}}
  3: {{$json.research_type}}
  4: {{$json.one_line_summary}}  (from LLM output)
  5: JSON.stringify({
       key_findings: {{$json.key_findings}},
       risk_signals: {{$json.risk_signals}},
       gaps_or_unknowns: {{$json.gaps_or_unknowns}}
     })
  6: JSON.stringify({{$json.citations}})
  7: {{$json.confidence_level}}

- Notes:
  - Use a transaction; log and fail safely on DB errors.
  - Binky must NOT modify other operational tables — enforce with DB permissions that the DB user only has INSERT on atlas_research_reports.

### 7) Event Hook — EVENT__research_completed
- Node name: EVENT__research_completed
- Stage code: EVENT__research_completed
- Purpose: emit `agent.research.completed` event for Daily Intel
- Payload:

{
  "event": "agent.research.completed",
  "request_id": "{{$json.request_id}}",
  "research_type": "{{$json.research_type}}",
  "confidence_level": "{{$json.confidence_level}}",
  "timestamp": "{{ new Date().toISOString() }}"
}

- Implementation: HTTP Request to internal event endpoint (e.g., `https://atlas.example.internal/daily-intel`) or publish to local event bus.

### 8) Respond to Caller — RESPOND__success
- Node type: Respond to Webhook / Set + HTTP Response
- Node name: RESPOND__success
- Stage code: RESPOND__success
- On success respond with:

{
  "ok": true,
  "request_id": "{{$json.request_id}}",
  "status": "completed",
  "confidence_level": "{{$json.confidence_level}}"
}

- On intermediate failure (LLM parse error, DB fail, etc.) respond with:

{
  "ok": false,
  "request_id": "the-same-or-null",
  "status": "failed",
  "error": "explanatory message",
  "code": "<stage code where it failed>"
}

---

## JSON Schema for LLM Output (enforced)
- The LLM must return exactly one JSON object and nothing else.
- Schema fields:

{
  "one_line_summary": "string",
  "key_findings": ["string"],
  "risk_signals": ["string"],
  "confidence_level": "low|medium|high",
  "citations": [
    {
      "title": "string",
      "source": "string",
      "url": "string",
      "retrieved_at": "ISO-8601"
    }
  ],
  "gaps_or_unknowns": ["string"]
}

- Enforce via JSON Schema validator node (example rule set) or a Function node that checks structure and allowed values.

---

## Example LLM node system + user messages (copy/paste-ready)

SYSTEM:
(Use the system message from the LLM__analyze node specification above.)

USER:
Research task:
- request_id: {{$json.request_id}}
- research_topic: "{{$json.research_topic}}"
- research_type: "{{$json.research_type}}"
- scope: "{{$json.scope}}"
- constraints: {{$json.constraints || []}}
- kb_results: {{$json.kb_results || []}}
- web_results: {{$json.web_results || []}}
- external_research_skipped: {{$json.external_research_skipped ? true : false}}
- requested_by: "{{$json.requested_by}}"

Task:
Analyze the available material and return ONLY a single JSON object that validates against the schema in the system message. Focus on facts, cite sources with retrieval dates (ISO-8601), and mark any uncertainty or gaps. Do NOT provide recommendations that require approval or operations. If data is insufficient, set confidence_level to "low".

---

## Error Handling & Observability
- Validate payload at Gate node — fail fast with code `GATE__validate_payload`.
- After LLM response: run JSON schema validator.
  - If validation fails: emit an audit event `agent.research.failed` including raw LLM output, and respond to caller with code `LLM__analyze`.
- DB errors: on failure emit audit event with code `DB__store_research` and respond to caller with `ok:false` and `code: DB__store_research`.
- Always log (internally) raw LLM output for debugging, but sanitize PII if required.
- Add idempotency: create UNIQUE constraint on `request_id` in `atlas_research_reports` to prevent duplicate INSERTs. If INSERT conflicts (already exists), treat as success (idempotent) and return the stored record's confidence_level.

---

## Security & Governance
- The DB user used by n8n should have minimal privileges (INSERT only on atlas_research_reports).
- If performing external web research, strictly limit allowed domains and rate limits.
- All outgoing audit and event HTTP requests should use mTLS or internal network policies.
- Record retrieval timestamps for each KB and web item (ISO-8601).
- Document the `allow_external_research` token for requesters and enforce it exactly.

---

## Example Successful LLM Output (illustrative)
{
  "one_line_summary": "Preliminary findings about X: internal notes exist; external research was not authorized, so market sizing remains unverified.",
  "key_findings": [
    "Internal KB contains a 2025-10-01 memo referencing competitor Y's product roadmap.",
    "No internal market sizing or pricing data discovered in KB."
  ],
  "risk_signals": [
    "High uncertainty on market size due to no external sources retrieved.",
    "Internal memo relies on assumptions that are not supported by primary data."
  ],
  "confidence_level": "low",
  "citations": [
    {
      "title": "Internal memo: Competitor Y roadmap",
      "source": "internal_kb",
      "url": null,
      "retrieved_at": "2025-10-01T12:03:00Z"
    }
  ],
  "gaps_or_unknowns": [
    "No external market reports were retrieved; external research was skipped per constraints.",
    "No primary source data on pricing or customer adoption metrics."
  ]
}

---

## Implementation Checklist (for builder)
- [ ] Create Webhook node at path `/atlas-binky-research`.
- [ ] Add Gate (Function) node with the exact error message "Missing required fields".
- [ ] Configure AUDIT node (HTTP or Function).
- [ ] Implement KB search node(s) and return `kb_results`.
- [ ] Implement WEB research gating node (use `allow_external_research` token).
- [ ] Add OpenAI node with system + user messages; set temperature=0.
- [ ] Add JSON schema validator after the LLM node.
- [ ] Add Postgres DB node for INSERT to atlas_research_reports (ensure unique request_id).
- [ ] Add event emitter node for `agent.research.completed`.
- [ ] Add final respond-to-webhook node returning the structured response.
- [ ] Add error handling and audit emission on failure for each critical stage.

---

If you'd like, I can:
- Generate an n8n workflow JSON export implementing these nodes (I can produce a best-effort export you can import into n8n).  
- Or produce a compact checklist / runbook document tailored to your infra (specific endpoints, DB connection strings redacted).  

Which would you prefer next?
