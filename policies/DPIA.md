# Data Protection Impact Assessment (DPIA) — Atlas UX AI Processing

**Regulation:** General Data Protection Regulation (EU) 2016/679, Article 35
**Product:** Atlas UX
**Owner:** Billy E. Whited / DEAD APP CORP
**Platform:** [atlasux.cloud](https://www.atlasux.cloud)
**Assessment Date:** March 1, 2026
**Next Review:** September 1, 2026
**DPIA Status:** Initial assessment, not yet reviewed by DPO or supervisory authority

---

## Table of Contents

1. [Introduction and Scope](#1-introduction-and-scope)
2. [Systematic Description of Processing](#2-systematic-description-of-processing)
3. [Assessment of Necessity and Proportionality](#3-assessment-of-necessity-and-proportionality)
4. [Risks to Data Subjects](#4-risks-to-data-subjects)
5. [Mitigation Measures in Place](#5-mitigation-measures-in-place)
6. [Residual Risks and Recommendations](#6-residual-risks-and-recommendations)
7. [Consultation](#7-consultation)
8. [Evidence References](#8-evidence-references)

---

## 1. Introduction and Scope

### 1.1 Why This DPIA Is Required

GDPR Article 35(1) requires a DPIA when processing is "likely to result in a high risk to the rights and freedoms of natural persons." Article 35(3) lists specific cases including:

- **(a) Automated decision-making with legal or significant effects** -- Atlas UX agents autonomously execute tasks including sending emails, publishing social media content, and making spend proposals on behalf of users.
- **(b) Large-scale processing of special categories** -- not currently applicable, but the platform's AI processing pipeline could receive PII or PHI if tenants include it in prompts or knowledge base documents.
- **(c) Systematic monitoring of a publicly accessible area** -- Atlas UX agents perform web research, social media monitoring, and competitive intelligence gathering across public platforms.

The European Data Protection Board (EDPB) guidelines further indicate a DPIA is needed when two or more of the following criteria are met: use of new technologies, automated decision-making, systematic monitoring, sensitive data, data processed on a large scale, or data transferred internationally. Atlas UX meets at least four of these criteria.

### 1.2 Scope of This Assessment

This DPIA covers the following processing activities:

1. **AI chat inference** -- user messages and context sent to third-party LLM providers for response generation
2. **Autonomous agent execution** -- the engine loop that claims intents, evaluates governance gates, and executes workflows without real-time human supervision
3. **Knowledge base retrieval-augmented generation (RAG)** -- tenant documents ingested, chunked, and injected into LLM prompts as context
4. **Outbound communications** -- agents sending emails and Telegram messages on behalf of tenants
5. **Social media publishing** -- agents posting content to X, Facebook, LinkedIn, Reddit, TikTok, Tumblr, Pinterest, Threads, and Alignable
6. **Web research** -- agents searching the internet (You.com, Tavily, SerpAPI) and scraping URLs for competitive intelligence
7. **Agent memory** -- conversation history and operational context persisted in the database and recalled across sessions

### 1.3 Processing Not Covered

This DPIA does not cover standard web application processing (authentication, billing, static page serving) which is addressed in `policies/GDPR_COMPLIANCE.md`. It also does not cover Stripe payment processing, which is handled entirely by Stripe as an independent controller.

---

## 2. Systematic Description of Processing

### 2.1 Data Flows to AI Providers

When a user or scheduled workflow triggers an AI interaction, the following data is assembled and sent to a third-party LLM provider:

#### What data is sent in each LLM request

| Data Category | Source | How It Enters the Prompt | File Reference |
|--------------|--------|-------------------------|----------------|
| User chat messages | Frontend chat input | Directly as `messages` array (up to 200 messages, max 100,000 chars each) | `backend/src/routes/chatRoutes.ts` -- `ChatBody` Zod schema |
| Agent identity and instructions | `SKILL.md` files, agent registry | Injected as system prompt prefix by `chatRoutes.ts` | `backend/src/routes/chatRoutes.ts` lines 136-164 |
| Knowledge base documents | `kb_documents` table (tenant-scoped) | RAG pipeline retrieves relevant docs and injects up to 60,000 chars | `backend/src/core/kb/getKbContext.ts`, `backend/src/core/kb/kbCache.ts` |
| Connected integrations list | `integrations` table | Provider names injected into system prompt | `backend/src/routes/chatRoutes.ts` lines 148-158 |
| Agent registry (all agent names/roles) | In-memory `agentRegistry` | Full roster injected into system prompt | `backend/src/routes/chatRoutes.ts` lines 161-164 |
| Agent tool results | Database queries, Microsoft Graph API, Telegram API | Live query results injected as context (subscription info, team members, CRM contacts, calendar events, ledger entries, planner tasks) | `backend/src/core/agent/agentTools.ts` |
| Conversation memory | `agent_memory` table | Prior conversation turns and operational context recalled and injected | `backend/src/core/agent/agentMemory.ts` |

#### Sensitive data that may be present in prompts

- **Personally Identifiable Information (PII):** User names, email addresses, and contact details from CRM records (`crm_contacts` table) can appear in agent tool results. Team member user IDs and roles from `tenant_members` table are injected when team-related tools fire.
- **Business confidential data:** Knowledge base documents uploaded by tenants may contain trade secrets, financial data, or internal strategy documents. These are chunked and injected into prompts during RAG retrieval.
- **Communication content:** Email bodies, Telegram messages, and social media drafts are composed by the LLM and may contain references to real people or business relationships.
- **Financial data:** Ledger entries and spend amounts from `ledger_entries` table can be injected via the `read_ledger` agent tool.

#### What data is NOT sent to LLMs

- OAuth access/refresh tokens (stored server-side in `integrations` table, never included in prompts)
- Raw authentication JWTs
- Stripe payment card data (handled by Stripe, not stored by Atlas UX)
- Database connection strings or API keys

### 2.2 AI Providers and Data Destinations

Atlas UX routes LLM requests through a provider router (`backend/src/ai.ts`). The following providers are configured:

| Provider | API Endpoint | Models Used | Data Location | DPA Status |
|----------|-------------|-------------|---------------|------------|
| **OpenAI** | `api.openai.com/v1/chat/completions` | `gpt-4o-mini` (default) | US | OpenAI DPA available, not yet executed |
| **DeepSeek** | `api.deepseek.com/chat/completions` | `deepseek-chat` (default) | **China** | **No DPA, no SCCs, no adequacy decision** |
| **Anthropic** (direct) | `api.anthropic.com/v1/messages` | `claude-3-5-haiku-20241022` | US | Anthropic DPA available |
| **OpenRouter** | `openrouter.ai/api/v1/chat/completions` | Various (Claude, Gemini via proxy) | US (proxy; final destination varies) | OpenRouter DPA status unknown |
| **Google Gemini** (direct) | `generativelanguage.googleapis.com/v1beta` | `gemini-2.0-flash` | US | Google DPA available |
| **Cerebras** | Via OpenRouter | Fast inference models | US | Via OpenRouter |

**The provider is selected per-request** based on the `provider` field in the chat request body or the workflow configuration. The user or workflow author chooses which provider handles their data. There is no automatic routing based on data sensitivity.

### 2.3 Autonomous Agent Processing

The engine loop (`backend/src/workers/engineLoop.ts`) runs as a separate Node.js process. It:

1. **Polls** the `intents` database table for queued intents (every 750ms when online, configurable via `ENGINE_LOOP_IDLE_MS`)
2. **Claims** the next intent using `FOR UPDATE SKIP LOCKED` (PostgreSQL advisory lock)
3. **Evaluates** the SGL governance gate (`backend/src/core/sgl.ts`) which checks:
   - Whether the action is a regulated type (government filing, bank transfer, crypto trade, browser automation)
   - Whether PHI data is present in the intent payload
   - Whether the spend exceeds $250 (`AUTO_SPEND_LIMIT_USD`)
4. **Blocks or escalates** if the SGL returns `BLOCK` or `REVIEW` (the latter sets intent status to `AWAITING_HUMAN`)
5. **Executes** the workflow handler if the SGL returns `ALLOW`
6. **Drains up to 25 intents per cycle** before pausing (`ENGINE_LOOP_MAX_TICKS_PER_CYCLE`)

The engine can only run when the `atlas_online` system state flag is set to `true` in the database. This is a manual toggle -- the system defaults to offline.

#### Agents and their capabilities

Atlas UX has 30+ named agents organized in a corporate hierarchy. The following agents perform actions that process or produce personal data:

| Agent | Role | External Actions | Data Processed |
|-------|------|-----------------|----------------|
| Atlas | CEO / sole executor | All external side-effects | All tenant data via tools |
| Sunday | Communications Director | Content drafting | KB documents, CRM data |
| Kelly | X Publisher | Posts to X (Twitter) | Social content, public profile data |
| Fran | Facebook Publisher | Posts to Facebook | Social content |
| Donna | Reddit Publisher | Posts to Reddit | Social content |
| Link | LinkedIn Publisher | Posts to LinkedIn | Professional profile data |
| Timmy | TikTok Publisher | Posts to TikTok | Video content metadata |
| Terry | Tumblr Publisher | Posts to Tumblr | Blog content |
| Cornwall | Pinterest Publisher | Posts to Pinterest | Image content metadata |
| Dwight | Threads Publisher | Posts to Threads | Social content |
| Emma | Alignable Publisher | Posts to Alignable | Business content |
| Reynolds | Blog Publisher | Blog posts | Written content |
| Penny | FB Ads | Multi-platform ad content | Marketing data |
| Archy | Research | Web search, URL scraping | Public web data |
| Cheryl | Support | KB search, customer queries | Customer interaction data |
| Mercer | Acquisition | Lead research | Business contact data |

Per the Execution Constitution (`policies/EXECUTION_CONSTITUTION.md`), only Atlas may call external APIs, move funds, provision accounts, publish content, or send outbound communications. All other agents are advisory subroutines -- they propose actions, but Atlas is the sole execution layer.

### 2.4 Outbound Communications

#### Email sending

The email sender worker (`backend/src/workers/emailSender.ts`) processes queued `EMAIL_SEND` jobs from the `jobs` table. Emails are sent via Microsoft Graph API (`/v1.0/users/{MS_SENDER_UPN}/sendMail`) using client credentials (not user-delegated OAuth). The sender UPN is `atlas@deadapp.info`.

Data in outbound emails:
- Recipient email address (`to` field from job input)
- Subject line and body text (composed by the AI agent or workflow)
- Sender identity (fixed to `atlas@deadapp.info`)

#### Telegram messaging

The `send_telegram_message` agent tool (`backend/src/core/agent/agentTools.ts`) sends messages to a tenant's configured Telegram chat via the Bot API. Message content is composed by the AI agent.

#### Social media publishing

Social publisher agents (Kelly, Fran, Donna, etc.) compose content that is published to external platforms via their respective APIs. The content is AI-generated based on workflow inputs and KB context.

### 2.5 Knowledge Base Processing

Tenants upload documents to the knowledge base (`kb_documents` table). These documents are:

1. **Stored** in Supabase storage (`kb_uploads` bucket, path: `tenants/{tenantId}/`)
2. **Chunked** into segments for retrieval (`backend/src/core/kb/`)
3. **Retrieved** during RAG when a user query matches relevant chunks
4. **Injected** into LLM prompts (up to 60,000 characters per request, individual docs capped at 12,000 characters)

KB documents may contain any data the tenant uploads. The platform does not scan document content for PII, PHI, or other sensitive categories before ingestion or before sending to LLM providers.

### 2.6 Data Retention for AI Processing

| Data Type | Retention | Location |
|-----------|-----------|----------|
| Chat messages sent to LLMs | Not stored by Atlas UX after response (stateless request/response) | Transient in memory |
| LLM responses | Not stored persistently by default | Transient in memory |
| Agent memory | Indefinite while tenant is active | `agent_memory` table (Supabase PostgreSQL) |
| KB documents | While tenant is active | `kb_documents` table + Supabase storage |
| Audit logs of AI interactions | 24 months | `audit_log` table |
| Job records (including email content) | 12 months | `jobs` table |
| Intent records | 12 months | `intents` table |
| Decision memos | Indefinite | `decision_memos` table |

**Third-party provider retention:** Each LLM provider has its own data retention policy. OpenAI retains API data for 30 days for abuse monitoring (with opt-out). DeepSeek's retention policy is governed by Chinese law and may differ significantly from GDPR expectations. Anthropic offers zero-retention API usage. OpenRouter and Cerebras retention policies should be verified.

---

## 3. Assessment of Necessity and Proportionality

### 3.1 Why AI Processing Is Necessary

Atlas UX is an AI employee productivity platform. Its core value proposition is autonomous agent execution -- agents that can research, draft, publish, email, and manage tasks on behalf of human users. AI processing is not an incidental feature; it is the fundamental purpose of the platform. Without LLM inference, the platform cannot function.

The lawful basis for AI processing is:

- **Contract (Art. 6(1)(b)):** Users sign up specifically to use AI agents. The processing is necessary to deliver the contracted service.
- **Consent (Art. 6(1)(a)):** The consent management system (`POST /v1/compliance/consent`) supports an `ai_processing` purpose. Tenants can grant or withdraw consent for this specific processing activity.

### 3.2 Data Minimization Measures

| Measure | Implementation | Effectiveness |
|---------|---------------|---------------|
| Chat message size limits | Zod validation: max 100,000 chars per message, max 200 messages per request | Prevents unbounded data transmission to LLMs |
| KB document budget | RAG injection capped at 60,000 total characters per prompt; individual docs capped at 12,000 chars | Limits volume of tenant data sent per request |
| Query classification tiers | `queryClassifier.ts` classifies queries into `DIRECT`, `SKILL_ONLY`, `HOT_CACHE`, or `FULL_RAG` tiers. Simple queries (greetings, direct tasks) skip KB retrieval entirely | Avoids sending KB data when not needed |
| Agent tool selective firing | Tools only fire when query pattern matches (keyword triggers). Most requests do not invoke any tools | CRM, calendar, and ledger data only injected when relevant |
| No media file transmission | Platform stores IDs and metadata, not full media files. Images/videos are not sent to LLMs | Reduces data exposure |
| OAuth tokens excluded | Tokens stored server-side, never injected into prompts | Credential exposure prevented |
| Tenant-scoped queries | All database queries filter by `tenant_id`. Agent tools can only access data belonging to the requesting tenant | Cross-tenant data leakage prevented at application layer |

### 3.3 Proportionality Assessment

The processing is proportionate because:

1. **User-initiated:** Chat interactions are initiated by the user. The user controls what they type and what KB documents they upload.
2. **Workflow-initiated (scheduled):** Scheduled workflows are configured by tenant administrators. They control which agents run and what inputs are provided.
3. **Bounded scope:** Each LLM request contains data from a single tenant. Cross-tenant prompts are architecturally impossible due to `tenant_id` scoping.
4. **No profiling of individuals:** Atlas UX does not build behavioral profiles of end-users. AI processing is task-oriented (draft an email, write a blog post, research a topic), not predictive of individual behavior.

**However**, the platform does not offer tenants the ability to restrict which LLM providers their data is sent to. A tenant's data could be routed to DeepSeek (China) if that provider is selected in the request or workflow. This is a proportionality gap -- see Section 4.3.

---

## 4. Risks to Data Subjects

### 4.1 Risk Register

| # | Risk | Likelihood | Severity | Overall Risk | GDPR Articles |
|---|------|-----------|----------|-------------|----------------|
| R1 | Personal data in prompts sent to third-party LLMs with insufficient contractual protections | High | High | **High** | Art. 28, 44-49 |
| R2 | Cross-border transfer to China via DeepSeek without adequacy decision or SCCs | High | High | **High** | Art. 44-49 |
| R3 | Autonomous agent takes action affecting data subjects without their knowledge | Medium | High | **High** | Art. 13-14, 22 |
| R4 | KB documents containing sensitive data sent to LLMs without content classification | Medium | Medium | **Medium** | Art. 5(1)(c), 9, 35 |
| R5 | Agent-generated emails or social posts contain inaccurate information about real people | Medium | Medium | **Medium** | Art. 5(1)(d), 16 |
| R6 | LLM provider retains prompt data beyond agreed terms or uses it for model training | Low | High | **Medium** | Art. 5(1)(e), 28 |
| R7 | Agent memory accumulates PII over time without retention limits | Medium | Medium | **Medium** | Art. 5(1)(e), 17 |
| R8 | Tenant uploads PHI to KB without platform awareness; PHI sent to LLMs | Low | Very High | **Medium** | Art. 9, 35 |
| R9 | Profiling risk from CRM + ledger + calendar data aggregation in agent context | Low | Medium | **Low** | Art. 4(4), 22 |
| R10 | Inadequate transparency about which AI provider processes a specific request | Medium | Low | **Low** | Art. 13-14 |

### 4.2 Risk R1: Personal Data Sent to Third-Party LLMs

**Description:** Every LLM request transmits the assembled prompt -- which may include user messages, KB documents, CRM contacts, team member data, calendar events, and ledger entries -- to a third-party AI provider. The data leaves Atlas UX infrastructure and is processed by the provider's servers.

**Affected data subjects:** Tenant users, individuals mentioned in CRM contacts, individuals mentioned in KB documents, email recipients.

**Contributing factors:**
- Agent tools (`agentTools.ts`) inject live database records into prompts. The `read_crm_contacts` tool includes contact names, emails, and company associations. The `get_team_members` tool includes user IDs, roles, and join dates.
- KB documents are tenant-uploaded and may contain any content. There is no automated PII scanning before RAG injection.
- The `ai.ts` provider router sends identical prompt payloads regardless of data sensitivity. There is no sensitivity-based routing.

### 4.3 Risk R2: DeepSeek Transfer to China

**Description:** DeepSeek is a Chinese AI provider. Its API endpoint is `api.deepseek.com`. There is no EU adequacy decision for China under GDPR. Standard Contractual Clauses (SCCs) have not been executed with DeepSeek. No Transfer Impact Assessment (TIA) has been conducted for this transfer.

**Regulatory exposure:** Under the Schrems II ruling (CJEU C-311/18), personal data transfers to countries without adequacy decisions require supplementary measures demonstrating that data subjects' rights are protected to a standard "essentially equivalent" to EU law. Chinese data protection law (PIPL) grants government access to data held by companies operating in China, which may not meet this standard.

**Current state:** DeepSeek is configured as a selectable provider in `backend/src/ai.ts` (lines 33-47). Any user or workflow can route requests through DeepSeek by setting `provider: "deepseek"` in the request body. There is no gateway preventing EEA personal data from being sent to DeepSeek.

### 4.4 Risk R3: Autonomous Decision-Making

**Description:** The engine loop (`backend/src/workers/engineLoop.ts`) processes intents autonomously. When the SGL gate returns `ALLOW`, the engine executes the workflow without human review. This can result in emails being sent, social media posts being published, or other external side-effects that affect data subjects who have no relationship with Atlas UX.

**GDPR Art. 22 relevance:** Article 22 restricts "automated individual decision-making, including profiling" that produces "legal effects" or "similarly significantly affects" the data subject. Atlas UX agent actions are task-execution (send this email, post this content) rather than individual assessment (approve this loan, deny this application). However, if an agent's actions affect a data subject's reputation (e.g., publishing inaccurate social media content about them) or economic interests (e.g., sending misleading business communications), Art. 22 protections may apply.

**Mitigating factor:** The SGL governance layer blocks regulated actions and escalates ambiguous ones for human review. The decision memo system requires human approval for any action with `riskTier >= 2`, `billingType === "recurring"`, or `estimatedCostUsd > AUTO_SPEND_LIMIT_USD` (default $4). See Section 5.1 for details.

### 4.5 Risk R4: Unclassified Sensitive Data in KB

**Description:** Tenants upload documents to the knowledge base without content classification. The platform does not scan for PII, PHI, financial data, or other sensitive categories. During RAG retrieval, these documents are chunked and injected into LLM prompts, potentially exposing sensitive data to third-party providers.

**Example scenario:** A tenant uploads a spreadsheet of employee health records to the KB for HR automation. The platform ingests it as a standard document. When an agent query matches relevant chunks, the health data is sent to the selected LLM provider.

**Current state:** The `kb_documents` table has no `data_classification` column. The `getKbContext` function (`backend/src/core/kb/getKbContext.ts`) retrieves documents by relevance match only, with no sensitivity filter.

---

## 5. Mitigation Measures in Place

### 5.1 Human-in-the-Loop (HIL) Approval Workflows

**Implementation:** `backend/src/services/decisionMemos.ts`, `backend/src/core/exec/atlasGate.ts`

The decision memo system requires human approval before execution when any of the following conditions are met:

| Condition | Threshold | Code Reference |
|-----------|-----------|----------------|
| Recurring billing | Any recurring charge | `decisionMemos.ts` line 23: `billingType === "recurring"` |
| Spend above limit | > $4 (configurable via `AUTO_SPEND_LIMIT_USD`) | `decisionMemos.ts` line 23: `estimatedCostUsd > AUTO_SPEND_LIMIT_USD` |
| Risk tier | >= 2 | `decisionMemos.ts` line 23: `riskTier >= 2` |
| Regulated action | Government filings, bank transfers, crypto trades | `sgl.ts` lines 17-18: `regulated` set |
| PHI present | Any PHI data class | `sgl.ts` line 22: `dataClass === "PHI"` |
| Browser automation | Any browser task | `sgl.ts` line 20: `type === "BROWSER_TASK"` |
| Spend >= $250 | SGL-level spend gate | `sgl.ts` line 24: `spendUsd >= 250` |

When the SGL returns `REVIEW`, the intent status is set to `AWAITING_HUMAN` and no execution occurs until a human explicitly approves or rejects the decision memo.

**Effectiveness:** This is the primary safety control for autonomous agent actions. It prevents high-risk, high-cost, and regulated actions from proceeding without human oversight. However, actions below the $4 spend threshold and with `riskTier < 2` can execute autonomously, including sending emails and publishing social media posts.

### 5.2 Audit Trail

**Implementation:** `backend/src/plugins/auditPlugin.ts`, `backend/src/core/engine/engine.ts`

Every action in the platform is audit-logged. The engine specifically logs:

| Audit Action | When | Data Logged |
|-------------|------|-------------|
| `SGL_EVALUATED` | Every intent governance check | SGL decision, intent type, payload hash (SHA-256) |
| `ENGINE_CLAIMED_INTENT` | Engine picks up an intent | Intent ID, intent type, requestedBy |
| `ENGINE_EXECUTED_INTENT` | After successful execution | Intent ID, execution output |
| `ENGINE_FAILED` | On execution failure | Intent ID, error message |
| `WORKFLOW_COMPLETE` | After workflow handler returns | Workflow ID, agent ID, success/failure, output |
| `EMAIL_SENT` | Email worker delivers an email | Recipient, subject, provider |

The audit log includes `tenantId`, `actorType`, `actorUserId`, `actorExternalId`, `level`, `action`, `entityType`, `entityId`, `message`, `meta`, and `timestamp`.

**Hash chain:** The audit log schema includes `prevHash` and `recordHash` columns (migration `20260304010000_audit_hash_chain`) designed for per-tenant SHA-256 tamper-evident chains. **Current gap:** The hash computation logic has not been implemented in `auditPlugin.ts`. Audit records are written without populating these fields.

### 5.3 Tenant Isolation

**Implementation:** `backend/src/plugins/tenantPlugin.ts`, `backend/src/db/prisma.ts`, `backend/prisma/migrations/20260228120000_rls_policies/`

- Every database query is scoped by `tenant_id`
- PostgreSQL Row-Level Security is enabled on 12 tables
- The `withTenant()` helper sets `SET LOCAL 'app.tenant_id'` within transactions
- UUID format validation prevents injection via the tenant ID header

**Gaps:**
- `FORCE ROW LEVEL SECURITY` is not enabled -- since Prisma connects as the database owner, RLS policies are bypassed for connections that do not use `withTenant()`
- Not all routes have been migrated to use `withTenant()`

### 5.4 SGL Governance Layer

**Implementation:** `backend/src/core/sgl.ts`, `policies/SGL.md`

The Statutory Guardrail Layer defines non-overridable execution boundaries:

- **BLOCK:** Statutory violations, PHI unsafe handling, copyright/trademark infringement, fraud, unauthorized financial execution, SGL modification attempts
- **REVIEW:** Regulated actions, PHI presence, spend >= $250, browser automation
- **ALLOW:** All other actions

The SGL is evaluated before every intent execution and before every chat call. SGL evaluation results are audit-logged with the intent type and payload hash.

**Limitation:** The SGL operates on intent metadata (type, data class, spend amount), not on prompt content. It cannot detect PII in natural language prompts or KB documents. A prompt containing an individual's medical history would not trigger the PHI gate unless the intent was explicitly classified as `dataClass: "PHI"`.

### 5.5 Spend and Rate Limits

**Implementation:** `backend/src/services/guardrails.ts`, `backend/src/lib/seatLimits.ts`, `backend/src/lib/seatEnforcement.ts`

| Limit | Value | Scope | Code Reference |
|-------|-------|-------|----------------|
| Auto-spend limit | $4 per action (env: `AUTO_SPEND_LIMIT_USD`) | Per decision memo | `guardrails.ts` line 12 |
| SGL spend gate | $250 | Per intent | `sgl.ts` line 24 |
| Max actions per day | 200 (env: `MAX_ACTIONS_PER_DAY`) | Per tenant | `guardrails.ts` line 13 |
| Max external posts per day | 20 (env: `MAX_EXTERNAL_POSTS_PER_DAY`) | Per tenant | `guardrails.ts` line 14 |
| Block recurring charges | Configurable (env: `BLOCK_RECURRING`) | Global | `guardrails.ts` line 15 |
| Token budget (free tier) | 50,000 tokens/day | Per user per tenant | `seatLimits.ts` line 30 |
| Token budget (starter) | 200,000 tokens/day | Per user per tenant | `seatLimits.ts` line 38 |
| Token budget (pro) | 1,000,000 tokens/day | Per user per tenant | `seatLimits.ts` line 48 |
| Jobs per day (free tier) | 10 | Per user per tenant | `seatLimits.ts` line 34 |
| API rate limit (global) | 60 requests/min per IP | Per IP | `server.ts` |
| Chat rate limit | 30 requests/min | Per route | `chatRoutes.ts` line 54 |

### 5.6 Consent Management

**Implementation:** `backend/src/routes/complianceRoutes.ts`

The consent system supports an `ai_processing` purpose. Tenants can:
- Grant consent: `POST /v1/compliance/consent` with `purpose: "ai_processing"` and explicit `lawfulBasis`
- Withdraw consent: `DELETE /v1/compliance/consent/:email/ai_processing`
- View consent records: `GET /v1/compliance/consent/:email`

**Gap:** The AI processing pipeline does not check consent status before sending data to LLMs. The consent API exists for record-keeping and DSAR compliance, but it is not enforced as a runtime gate. A tenant user whose consent for `ai_processing` has been withdrawn can still send chat messages that are processed by LLMs.

### 5.7 DSAR and Erasure Rights

**Implementation:** `backend/src/routes/complianceRoutes.ts`

Data subjects can exercise their GDPR rights through the DSAR API:
- Right to access: `POST /v1/compliance/dsar` with `requestType: "access"`
- Right to erasure: `DELETE /v1/compliance/dsar/:email/erase` -- deletes CRM contacts, consent records, and revokes integration tokens
- Right to portability: `GET /v1/compliance/dsar/:email/export` -- JSON export of all subject data
- Right to object: `POST /v1/compliance/dsar` with `requestType: "objection"`

**Gap:** Erasure does not extend to data that has already been transmitted to third-party LLM providers. Once prompt data is sent to OpenAI, DeepSeek, or other providers, Atlas UX has no mechanism to request deletion from those providers' systems. Audit logs are retained per Art. 17(3)(e).

### 5.8 Execution Constitution

**Implementation:** `policies/EXECUTION_CONSTITUTION.md`

The Execution Constitution establishes that:
1. Atlas is the sole execution layer -- no other agent can call external APIs
2. Every execution requires SGL ALLOW and human approval if flagged
3. All state transitions emit an audit event
4. Valid states follow a defined lifecycle: DRAFT -> VALIDATING -> APPROVED -> EXECUTING -> EXECUTED (or BLOCKED_SGL, AWAITING_HUMAN, FAILED)

### 5.9 Online/Offline Toggle

**Implementation:** `backend/src/workers/engineLoop.ts` lines 63-76

The engine loop and email worker both check the `atlas_online` system state before processing. The system defaults to offline. A human must explicitly set `engine_enabled: true` in the `system_state` table for autonomous processing to begin. This provides a kill switch for all autonomous agent activity.

---

## 6. Residual Risks and Recommendations

### 6.1 Critical -- Immediate Action Required

| # | Residual Risk | Recommendation | Priority | Effort |
|---|--------------|----------------|----------|--------|
| C1 | **DeepSeek (China) transfer** -- no legal basis for transferring EEA personal data to China | **Option A (recommended):** Disable DeepSeek as a provider for any tenant with EEA data subjects. Add a provider allowlist in `ai.ts` that excludes DeepSeek when `tenant.region === "EEA"`. **Option B:** Execute SCCs with DeepSeek and conduct a Transfer Impact Assessment (TIA). This is complex given Chinese data access laws. | P0 | Medium |
| C2 | **No DPO formally appointed** -- `dpo@atlasux.com` is designated but no formal appointment exists with documented qualifications, independence, and reporting structure per Art. 37-39 | Formally appoint a DPO. Document their qualifications, ensure they report directly to the highest management level, and publish their contact details in the privacy policy. | P0 | Low |
| C3 | **Consent not enforced at runtime** -- consent records exist but AI pipeline does not check them before sending data to LLMs | Add a consent gate in `chatRoutes.ts` that checks `ai_processing` consent status for the requesting user before executing the LLM call. Return 403 if consent is not granted or has been withdrawn. | P0 | Medium |

### 6.2 High -- Address Within 30 Days

| # | Residual Risk | Recommendation | Priority | Effort |
|---|--------------|----------------|----------|--------|
| H1 | **No data classification for KB documents** -- sensitive data (PII, PHI, financial) can be uploaded and sent to LLMs without awareness | Add a `dataClassification` column to `kb_documents`. Implement upload-time classification (at minimum: user-declared; ideally: automated PII scanning). Filter RAG retrieval based on classification and selected provider's data handling capabilities. | P1 | High |
| H2 | **LLM provider DPAs not executed** -- DPAs are available from OpenAI, Anthropic, and Google but have not been formally signed | Execute DPAs with all active LLM providers. Document executed agreements in the vendor management system (`POST /v1/compliance/vendors`). | P1 | Low |
| H3 | **Agent memory has no retention limit** -- conversation memory accumulates indefinitely in `agent_memory` table | Implement a retention policy for agent memory: auto-purge entries older than 90 days (or configurable per tenant). Add the ability for users to view and delete their agent memory. | P1 | Medium |
| H4 | **No transparency to data subjects about which provider processes their request** -- the LLM response does not indicate which provider was used | Include the provider name and model in the chat response metadata (already partially done -- `result.provider` is returned). Add a user-facing disclosure in the privacy policy listing all AI sub-processors. | P1 | Low |
| H5 | **Hash chain not implemented** -- audit log tamper-evidence columns exist but are not populated | Implement the hash computation in `auditPlugin.ts` per the existing migration schema. Deploy the `GET /v1/compliance/audit/verify` endpoint. | P1 | Medium |

### 6.3 Medium -- Address Within 90 Days

| # | Residual Risk | Recommendation | Priority | Effort |
|---|--------------|----------------|----------|--------|
| M1 | **No provider-routing policy based on data sensitivity** -- all providers receive identical payloads regardless of content sensitivity | Implement a routing policy: if intent `dataClass` is `PII` or `PHI`, restrict to providers with executed DPAs and adequate transfer mechanisms (e.g., OpenAI only, not DeepSeek). | P2 | Medium |
| M2 | **Agent-generated content may be inaccurate** -- social posts and emails composed by LLMs may contain factual errors about real people | Implement a content review queue for external-facing communications. High-risk posts (mentions of named individuals, financial claims) should require human review before publishing. | P2 | High |
| M3 | **Erasure does not extend to LLM providers** -- once data is sent, Atlas UX cannot delete it from provider systems | Document this limitation in the privacy policy. For providers offering data deletion APIs (OpenAI), implement deletion requests when a DSAR erasure is processed. | P2 | Medium |
| M4 | **FORCE ROW LEVEL SECURITY not enabled** -- RLS policies can be bypassed by database owner connections | Enable `ALTER TABLE ... FORCE ROW LEVEL SECURITY` on all RLS-protected tables. Migrate remaining routes to use `withTenant()`. | P2 | Medium |
| M5 | **No automated DPIA review trigger** -- new processing activities (new agents, new tools, new providers) can be added without triggering a DPIA review | Establish a change management process: any PR that adds a new agent, new tool, or new AI provider must include a DPIA impact note. | P2 | Low |

### 6.4 Low -- Address Within 6 Months

| # | Residual Risk | Recommendation | Priority | Effort |
|---|--------------|----------------|----------|--------|
| L1 | **No consent banner on frontend** -- backend consent API exists but there is no user-facing consent collection UI | Build a consent banner/modal that presents processing purposes (including `ai_processing`) and collects explicit consent before first use. | P3 | Medium |
| L2 | **No data subject self-service portal** -- subjects must go through admin for DSAR submission | Build a self-service DSAR submission form accessible at `/dsar` or via email link. | P3 | Medium |
| L3 | **No EU representative with physical address** -- Art. 27 requires publication of EU representative contact details including physical address | Engage an EU representative service and publish their physical address in the privacy policy. | P3 | Low |
| L4 | **OpenRouter data handling unclear** -- OpenRouter proxies requests to multiple providers; final data destination may vary | Request OpenRouter's data processing addendum. Consider direct API integrations for all providers to eliminate the proxy layer. | P3 | Low |

---

## 7. Consultation

### 7.1 DPO Consultation

This DPIA has not yet been reviewed by a formally appointed Data Protection Officer. Per GDPR Art. 35(2), the controller shall seek the advice of the DPO when carrying out a DPIA. This review is pending DPO appointment (see recommendation C2).

**Planned action:** Upon formal DPO appointment, this DPIA will be submitted for review. The DPO's opinion and any required modifications will be documented in this section.

### 7.2 Supervisory Authority Consultation

Per GDPR Art. 36, the controller must consult the supervisory authority prior to processing if the DPIA indicates that the processing would result in a high risk in the absence of mitigation measures. Given that mitigation measures (SGL, HIL approvals, tenant isolation, audit trail) are in place, prior consultation is not currently required. This assessment should be revisited after C1 (DeepSeek transfer) and C3 (consent enforcement) are addressed.

### 7.3 Data Subject Consultation

No formal consultation with data subjects has been conducted. The platform's privacy policy (`https://atlasux.cloud/#/privacy`) and terms of service (`https://atlasux.cloud/#/terms`) are published and accessible. Future consideration should be given to user surveys or focus groups regarding AI processing preferences.

---

## 8. Evidence References

### 8.1 Source Files

| File | Relevance to This DPIA |
|------|----------------------|
| `backend/src/ai.ts` | AI provider router -- all LLM API calls originate here |
| `backend/src/routes/chatRoutes.ts` | Chat endpoint -- assembles prompts from user messages, KB, agent tools |
| `backend/src/core/engine/engine.ts` | Engine tick -- claims and executes intents autonomously |
| `backend/src/workers/engineLoop.ts` | Engine loop worker -- polls for intents, checks online status |
| `backend/src/workers/emailSender.ts` | Email worker -- sends queued emails via Microsoft Graph |
| `backend/src/core/sgl.ts` | Statutory Guardrail Layer -- governance gate evaluation |
| `backend/src/core/exec/atlasGate.ts` | Execution gate -- SGL + audit logging before execution |
| `backend/src/core/agent/agentTools.ts` | Agent tools -- database queries injected into prompts |
| `backend/src/core/kb/getKbContext.ts` | KB RAG retrieval -- documents injected into prompts |
| `backend/src/core/kb/kbCache.ts` | KB caching layer -- hot cache for governance and agent docs |
| `backend/src/core/kb/queryClassifier.ts` | Query tier classification -- determines RAG depth |
| `backend/src/services/decisionMemos.ts` | Decision memo system -- HIL approval for high-risk actions |
| `backend/src/services/guardrails.ts` | Guardrails -- daily caps, spend limits, recurring block |
| `backend/src/lib/seatLimits.ts` | Seat tier limits -- token budgets, job limits |
| `backend/src/lib/seatEnforcement.ts` | Runtime enforcement of seat limits |
| `backend/src/plugins/auditPlugin.ts` | Audit logging on every request |
| `backend/src/plugins/tenantPlugin.ts` | Tenant isolation -- header extraction, UUID validation |
| `backend/src/plugins/authPlugin.ts` | JWT authentication via Supabase |
| `backend/src/db/prisma.ts` | `withTenant()` RLS helper |
| `backend/src/routes/complianceRoutes.ts` | DSAR, consent, breach, vendor endpoints |
| `backend/src/env.ts` | Environment variable definitions (safety thresholds) |
| `backend/prisma/schema.prisma` | Data models for all tables referenced in this DPIA |

### 8.2 Policy Documents

| Document | Relevance |
|----------|-----------|
| `policies/EXECUTION_CONSTITUTION.md` | Single executor rule, pre-execution requirements |
| `policies/SGL.md` | Non-overridable execution boundaries |
| `policies/GDPR_COMPLIANCE.md` | GDPR article-to-implementation mapping |
| `policies/DATA_RETENTION.md` | Retention periods by data category |
| `policies/COMPLIANCE_INDEX.md` | Honest compliance posture across 7 frameworks |

### 8.3 Database Migrations

| Migration | Relevance |
|-----------|-----------|
| `20260228120000_rls_policies` | PostgreSQL RLS on 12 tables |
| `20260304010000_audit_hash_chain` | Hash chain columns on audit_log |
| `20260226200000` | tenant_id on 7 tables, decision_memo FKs |

---

## Approval and Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Data Controller | Billy E. Whited | __________ | __________ |
| Data Protection Officer | __________ | __________ | __________ |
| Technical Lead | __________ | __________ | __________ |

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 1, 2026 | Billy E. Whited / Claude Code | Initial DPIA |

---

**DEAD APP CORP**
Atlas UX -- [atlasux.cloud](https://www.atlasux.cloud)
Privacy: [privacy@deadapp.info](mailto:privacy@deadapp.info)
DPO: [dpo@atlasux.com](mailto:dpo@atlasux.com)
