# GDPR Compliance Framework

**Product:** Atlas UX (DEAD APP CORP)
**Regulation:** General Data Protection Regulation (EU) 2016/679
**Effective Date:** March 1, 2026
**Last Updated:** March 1, 2026
**Next Review:** June 1, 2026

---

## 1. Framework Overview and Scope

### 1.1 Applicability

The General Data Protection Regulation applies to Atlas UX whenever the platform processes personal data of individuals located in the European Economic Area (EEA), regardless of where DEAD APP CORP is established. Atlas UX processes the following categories of personal data that fall under GDPR scope:

- **Account and identity data** -- email addresses, display names, user IDs, authentication metadata
- **Platform data from third-party integrations** -- OAuth tokens, profile links, post metadata, managed asset identifiers (Meta, Google, LinkedIn, TikTok, etc.)
- **CRM data** -- contact names, email addresses, company associations
- **Operational data** -- workflow execution logs, job metadata, agent activity records
- **Audit and security data** -- IP addresses, user agents, actor IDs, timestamps
- **Consent records** -- processing purpose, lawful basis, grant/withdrawal timestamps
- **Billing references** -- Stripe customer IDs, subscription status (payment card data is processed by Stripe, not stored by Atlas UX)

### 1.2 Data Controller

DEAD APP CORP acts as the data controller. Each tenant organization using Atlas UX may also be a controller or joint controller depending on their use case. Atlas UX operates as a data processor on behalf of tenant organizations for data they load into the platform.

### 1.3 Multi-Tenancy Architecture

All personal data in Atlas UX is scoped by `tenant_id`. Every database table containing personal data includes a `tenant_id` foreign key. Tenant isolation is enforced at two levels:

1. **Application layer** -- the `tenantPlugin` (`backend/src/plugins/tenantPlugin.ts`) extracts and validates tenant identity from the `x-tenant-id` header or `tenantId` query parameter on every request. UUID format is validated to prevent injection.
2. **Database layer** -- PostgreSQL Row-Level Security policies are enabled on 9 core tables (migration `20260228120000_rls_policies`). The `withTenant()` helper in `backend/src/db/prisma.ts` sets the `app.tenant_id` session variable within a transaction.

---

## 2. Article Mapping Table

The table below maps GDPR Articles to their requirements, the Atlas UX implementation, the relevant file path or API endpoint, and the current status.

| Article | Requirement | Implementation | File Path / Endpoint | Status |
|---------|-------------|----------------|---------------------|--------|
| **Art. 5(1)(a)** | Lawfulness, fairness, transparency | Consent management with explicit lawful basis tracking per processing purpose | `backend/src/routes/complianceRoutes.ts` -- `POST /v1/compliance/consent` | Implemented |
| **Art. 5(1)(b)** | Purpose limitation | Consent records track specific purposes: `marketing`, `analytics`, `ai_processing`, `data_sharing`, `communications` | `consent_records` table -- `purpose` column | Implemented |
| **Art. 5(1)(c)** | Data minimisation | Platform stores IDs and metadata, not full media. OAuth tokens stored server-side only. See `policies/DATA_RETENTION.md` | `policies/DATA_RETENTION.md` Section 3 | Implemented |
| **Art. 5(1)(d)** | Accuracy | DSAR rectification endpoint allows correction of inaccurate data | `PATCH /v1/compliance/dsar/:id` (status: rectification) | Implemented |
| **Art. 5(1)(e)** | Storage limitation | Retention periods defined: 30 days for account data after deletion, 12 months for workflows, 24 months for audit logs, 7 years for billing | `policies/DATA_RETENTION.md` Section 4 | Implemented |
| **Art. 5(1)(f)** | Integrity and confidentiality | Hash-chained audit logs (SHA-256), TLS in transit, Supabase encryption at rest, CORS whitelist, Helmet CSP headers | `backend/prisma/migrations/20260304010000_audit_hash_chain/migration.sql`, `backend/src/server.ts` (Helmet config) | Partial |
| **Art. 5(2)** | Accountability | Audit log on every mutation, compliance dashboard, DSAR tracking with deadlines | `backend/src/plugins/auditPlugin.ts`, `GET /v1/compliance/dashboard` | Implemented |
| **Art. 6** | Lawful basis for processing | Six lawful bases tracked in consent records: `consent`, `contract`, `legal_obligation`, `vital_interest`, `public_task`, `legitimate_interest` | `POST /v1/compliance/consent` -- `lawfulBasis` field | Implemented |
| **Art. 7** | Conditions for consent | Granular consent per purpose, withdrawal as easy as grant, consent records include IP, user agent, timestamp, and policy version | `POST /v1/compliance/consent`, `DELETE /v1/compliance/consent/:email/:purpose` | Implemented |
| **Art. 12** | Transparent communication | DSAR responses within 30-day deadline; overdue monitoring endpoint | `GET /v1/compliance/dsar/overdue` | Implemented |
| **Art. 13-14** | Information at collection | Privacy policy at `https://atlasux.cloud/#/privacy`, Terms of Service at `https://atlasux.cloud/#/terms` | `src/pages/Privacy.tsx`, `src/pages/Terms.tsx` | Implemented |
| **Art. 15** | Right of access | DSAR creation with `requestType: "access"`, data export in JSON | `POST /v1/compliance/dsar` (type: access), `GET /v1/compliance/dsar/:email/export` | Implemented |
| **Art. 16** | Right to rectification | DSAR creation with `requestType: "rectification"`, admin processes via PATCH | `POST /v1/compliance/dsar` (type: rectification), `PATCH /v1/compliance/dsar/:id` | Implemented |
| **Art. 17** | Right to erasure | Automated erasure of CRM contacts, consent records, integration tokens; audit logs retained per Art. 17(3)(e) | `DELETE /v1/compliance/dsar/:email/erase` | Implemented |
| **Art. 18** | Right to restriction | DSAR creation with `requestType: "restriction"`, tracked through pending/in_progress/completed lifecycle | `POST /v1/compliance/dsar` (type: restriction) | Implemented |
| **Art. 20** | Right to data portability | JSON export of all subject data: contacts, consent records, DSARs, audit log counts, integration list | `GET /v1/compliance/dsar/:email/export` (returns `application/json` with `content-disposition` attachment) | Implemented |
| **Art. 21** | Right to object | DSAR creation with `requestType: "objection"` | `POST /v1/compliance/dsar` (type: objection) | Implemented |
| **Art. 25** | Data protection by design and default | Multi-tenant isolation (tenant_id FK on all tables), PostgreSQL RLS policies on 9 tables, UUID validation on tenant IDs, `withTenant()` transaction helper | `backend/prisma/migrations/20260228120000_rls_policies/migration.sql`, `backend/src/db/prisma.ts`, `backend/src/plugins/tenantPlugin.ts` | Partial |
| **Art. 32** | Security of processing | Helmet CSP, CORS whitelist, rate limiting (60 req/min default), JWT auth via Supabase, tenant-scoped queries | `backend/src/server.ts` (Helmet, CORS, rate-limit), `backend/src/plugins/authPlugin.ts` | Partial |
| **Art. 33** | Breach notification to authority | Breach register with automatic 72-hour deadline calculation from detection time | `POST /v1/compliance/breaches` -- `notifyAuthorityBy` field, `GET /v1/compliance/breaches/deadlines` | Implemented |
| **Art. 34** | Breach notification to data subjects | Breach record tracks individual notification deadline (60-day HIPAA window also applied), notification timestamps recorded | `PATCH /v1/compliance/breaches/:id` -- `individualsNotified` flag sets `individualsNotifiedAt` | Implemented |
| **Art. 35** | Data Protection Impact Assessment | DPIA conducted for AI processing: covers all LLM providers, autonomous agent execution, KB RAG, outbound comms, social publishing. Identifies 10 risks with mitigation measures and residual risk recommendations. | `policies/DPIA.md` | Implemented |
| **Art. 37-39** | Data Protection Officer | DPO appointed: Billy Whited, DEAD APP CORP / THE DEAD APP CORP TRUST, 510 E Washington Street, Vandalia, MO 63382, (816) 747-6150, `dpo@atlasux.com` | Contact section below | Implemented |
| **Art. 44-49** | International transfers | Supabase (AWS us-east-1), Render (Oregon, US), Vercel (edge). Standard Contractual Clauses required for EEA data | Section 7 of this document | Partial |

---

## 3. Key Article Implementations — Detailed

### 3.1 Article 5(1)(f): Data Integrity and Confidentiality

**Hash-Chained Audit Logs**

The `audit_log` table includes `prev_hash` and `record_hash` columns (migration `20260304010000_audit_hash_chain`). The design specifies a per-tenant SHA-256 chain where each record's hash is computed as:

```
record_hash = SHA-256(prev_hash + tenantId + action + entityId + timestamp + actorUserId)
```

This makes retroactive tampering with audit records detectable by walking the chain.

- **Schema:** `backend/prisma/schema.prisma` -- `prevHash` and `recordHash` fields on `AuditLog`
- **Migration:** `backend/prisma/migrations/20260304010000_audit_hash_chain/migration.sql`
- **Verification endpoint:** `GET /v1/compliance/audit/verify` -- planned, not yet implemented
- **Hash computation on insert:** planned for `backend/src/plugins/auditPlugin.ts` and `backend/src/lib/auditChain.ts`

**Current gap:** The columns exist in the database schema, but the hash computation logic in `auditPlugin.ts` and the verification endpoint have not been implemented yet. Audit records are currently written without populating `prev_hash` or `record_hash`.

**Encryption**

- **In transit:** All API traffic is served over HTTPS. TLS is terminated at Render (backend) and Vercel (frontend). Helmet is configured with CSP directives in `backend/src/server.ts`.
- **At rest:** Supabase PostgreSQL uses AES-256 encryption at rest (managed by AWS). OAuth tokens stored in the `integrations` table are encrypted at rest at the storage layer. Atlas UX does not currently implement application-level field encryption for tokens.
- **HSTS:** Not explicitly configured in Helmet. The compliance hardening design (`docs/plans/2026-03-03-compliance-hardening-design.md`, Section 7) plans to add `maxAge: 31536000, includeSubDomains: true`.

### 3.2 Article 6: Lawful Basis for Processing

Consent management is implemented in `backend/src/routes/complianceRoutes.ts` with the following endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/compliance/consent` | `POST` | Grant consent for a specific purpose with lawful basis |
| `/v1/compliance/consent/:email` | `GET` | List all consent records for a data subject |
| `/v1/compliance/consent/:email/:purpose` | `DELETE` | Withdraw consent for a specific purpose |

**Supported processing purposes:** `marketing`, `analytics`, `ai_processing`, `data_sharing`, `communications`

**Supported lawful bases:** `consent`, `contract`, `legal_obligation`, `vital_interest`, `public_task`, `legitimate_interest`

Each consent record tracks:
- Subject email
- Purpose and lawful basis
- Grant/withdrawal timestamps
- IP address and user agent at time of consent
- Consent policy version (default `"1.0"`)

The `ConsentRecord` model uses a unique compound key on `(tenantId, subjectEmail, purpose)` to ensure one active consent record per subject per purpose per tenant. Granting consent for an already-recorded purpose updates the existing record (upsert pattern).

**Every consent grant and withdrawal is audit-logged** with actions `CONSENT_GRANTED` and `CONSENT_WITHDRAWN`.

### 3.3 Articles 15-21: Data Subject Rights (DSAR)

All Data Subject Access Requests are managed through the DSAR endpoints in `backend/src/routes/complianceRoutes.ts`, registered at `/v1/compliance`.

#### DSAR Lifecycle

```
POST /v1/compliance/dsar           --> Creates request (status: pending, 30-day deadline set)
PATCH /v1/compliance/dsar/:id      --> Updates status: pending -> in_progress -> completed | denied
GET /v1/compliance/dsar            --> Lists all DSARs for tenant (filterable by status)
GET /v1/compliance/dsar/overdue    --> Returns DSARs past their 30-day deadline
```

**Supported request types:**

| Type | GDPR Article | Description |
|------|-------------|-------------|
| `access` | Art. 15 | Subject requests a copy of their personal data |
| `erasure` | Art. 17 | Subject requests deletion of their personal data |
| `portability` | Art. 20 | Subject requests data export in machine-readable format |
| `restriction` | Art. 18 | Subject requests restriction of processing |
| `rectification` | Art. 16 | Subject requests correction of inaccurate data |
| `objection` | Art. 21 | Subject objects to processing |

#### Right to Data Portability (Article 20)

**Endpoint:** `GET /v1/compliance/dsar/:email/export`

Returns a JSON file (`content-disposition: attachment`) containing all data associated with the subject's email across the tenant:

- CRM contacts
- Consent records
- Data subject requests
- Audit log entry count (entries themselves are summarized, not exported in full for security)
- Job count
- Ledger entry count
- Integration list (provider, status, creation date -- tokens excluded)

#### Right to Erasure (Article 17)

**Endpoint:** `DELETE /v1/compliance/dsar/:email/erase`

Performs the following deletions in a single request:

1. **CRM contacts** matching the subject email -- hard deleted
2. **Consent records** matching the subject email -- hard deleted
3. **Integration tokens** for the tenant -- access_token and refresh_token set to null, status set to `disconnected`

**Retained per Art. 17(3)(e):** Audit log entries are not deleted. They record the fact that processing occurred and are necessary for legal compliance, fraud prevention, and security incident investigation. The response explicitly states: `"Audit logs retained per GDPR Article 17(3)(e) -- legal obligation"`.

#### Platform-Specific Data Deletion Callbacks

Two external platform deletion callbacks are implemented for Meta and Google, as required by their app review processes:

**Meta Data Deletion:**
- **Endpoint:** `POST /v1/meta/datadeletion`
- **File:** `backend/src/routes/metaRoutes.ts`
- **Flow:** Validates Meta's `signed_request` using HMAC-SHA256 with `META_APP_SECRET`, identifies the Facebook user ID, clears matching integration tokens, returns a confirmation code and status URL
- **Registered at:** `/v1/meta` in `backend/src/server.ts`

**Google Data Deletion:**
- **Endpoint:** `POST /v1/google/datadeletion`
- **File:** `backend/src/routes/googleRoutes.ts`
- **Flow:** Reads `user_id` or `sub` from request body, clears matching Google integration tokens using a JSON path query on the `config` field, returns a confirmation code and status URL
- **Registered at:** `/v1/google` in `backend/src/server.ts`

Both callbacks:
- Log the deletion request to `audit_log` with action `META_DATA_DELETION_REQUEST` or `GOOGLE_DATA_DELETION_REQUEST`
- Return a status URL at `https://atlasux.cloud/#/privacy?deletion={confirmationCode}` for the subject to check deletion status

### 3.4 Article 25: Data Protection by Design and Default

#### Tenant Isolation

Every database table containing personal data includes a `tenant_id` foreign key. The isolation is enforced through:

1. **Application-level enforcement** (`backend/src/plugins/tenantPlugin.ts`):
   - Extracts tenant ID from `x-tenant-id` header or `tenantId` query param
   - Validates UUID format with regex before using in queries (prevents SQL injection via session variable)
   - Resolves tenant membership when user is authenticated, setting `tenantRole` and `seatType`

2. **Database-level Row-Level Security** (`backend/prisma/migrations/20260228120000_rls_policies/migration.sql`):
   - RLS enabled on 9 tables: `integrations`, `assets`, `jobs`, `distribution_events`, `audit_log`, `kb_documents`, `decision_memos`, `crm_contacts`, `crm_companies`
   - Policy: `tenant_isolation USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting(...)::uuid)`
   - The `withTenant()` helper (`backend/src/db/prisma.ts`) wraps queries in a transaction with `SET LOCAL 'app.tenant_id'` for double enforcement

**Current gap:** RLS is enabled without `FORCE ROW LEVEL SECURITY`. Since Prisma connects as the database owner (superuser), RLS policies are bypassed for connections that do not use `withTenant()`. Not all routes have been migrated to use `withTenant()` yet. The compliance-specific tables (`consent_records`, `data_subject_requests`, `data_breaches`) do not yet have RLS policies -- they rely on application-level `WHERE tenantId = ?` filtering only.

#### Input Validation

The compliance hardening design (Section 5) plans to add Zod schemas to all route handlers currently using `req.body as any`. As of this writing, `complianceRoutes.ts` does manual field validation (checking for presence of required fields) but does not use Zod schemas for type-safe validation.

#### Authentication

JWT-based authentication via Supabase Auth (`backend/src/plugins/authPlugin.ts`). The plugin:
- Extracts Bearer tokens from the `Authorization` header
- Validates tokens against Supabase Auth (`supabase.auth.getUser(token)`)
- Auto-provisions a `User` record on first authentication
- Attaches `userId` and `email` to the request object

### 3.5 Article 32: Security of Processing

| Measure | Implementation | File / Config | Status |
|---------|---------------|---------------|--------|
| TLS encryption in transit | HTTPS enforced at Render (backend) and Vercel (frontend) | Render/Vercel platform config | Implemented |
| HSTS header | Not yet configured in Helmet | `backend/src/server.ts` -- Helmet config | Planned |
| Content Security Policy | Helmet CSP with `defaultSrc: ['self']`, `frameSrc: ['none']`, `objectSrc: ['none']` | `backend/src/server.ts` lines 169-189 | Implemented |
| CORS origin whitelist | `@fastify/cors` with explicit allowed origins and headers | `backend/src/server.ts` | Implemented |
| Rate limiting | Global: 60 requests per minute per IP via `@fastify/rate-limit` | `backend/src/server.ts` line 191 | Implemented |
| Per-tenant rate limiting | Three tiers planned: auth (10/min), mutation (30/min), read (120/min) | Planned -- `docs/plans/2026-03-03-compliance-hardening-design.md` Section 4 | Planned |
| CSRF protection | Plugin exists (`backend/src/plugins/csrfPlugin.ts`) using double-submit cookie pattern, but is currently **disabled** because double-submit cookies do not work cross-origin (Vercel to Render) | `backend/src/server.ts` line 199 (commented out) | Disabled |
| JWT authentication | Supabase Auth with Bearer token validation on every request | `backend/src/plugins/authPlugin.ts` | Implemented |
| Encryption at rest | Supabase PostgreSQL on AWS uses AES-256 at the storage layer | Supabase platform config | Implemented |
| Audit logging | Every HTTP request logged by `auditPlugin`; all compliance mutations have explicit audit entries | `backend/src/plugins/auditPlugin.ts` | Implemented |
| Session termination | Planned: `revoked_tokens` table and `/v1/auth/logout` endpoint | Planned -- design doc Section 6 | Planned |

### 3.6 Articles 33-34: Breach Notification

The `data_breaches` table and associated endpoints implement the breach register with deadline tracking.

#### Breach Lifecycle

```
POST /v1/compliance/breaches           --> Report breach (sets 72-hour and 60-day deadlines)
GET  /v1/compliance/breaches           --> List all breaches for tenant
PATCH /v1/compliance/breaches/:id      --> Update status, root cause, remediation, notification flags
GET  /v1/compliance/breaches/deadlines --> Urgent: breaches approaching 72-hour authority deadline
```

#### Deadline Tracking

On breach creation, the system automatically computes:
- **`notifyAuthorityBy`** = detection time + 72 hours (GDPR Art. 33 requirement)
- **`notifyIndividualsBy`** = detection time + 60 days (HIPAA Breach Notification Rule -- applied as an additional safeguard)

The `/v1/compliance/breaches/deadlines` endpoint returns breaches that:
- Have not yet notified the supervisory authority AND the 72-hour deadline is within 24 hours
- Have not yet notified affected individuals AND a notification deadline exists

#### Breach Status Workflow

```
detected --> contained --> eradicated --> recovered --> closed
```

Each status transition is audit-logged with action `BREACH_UPDATED`. The `containedAt` timestamp is set when status moves to `contained`. Authority and individual notification timestamps (`authorityNotifiedAt`, `individualsNotifiedAt`) are recorded when the respective flags are set via PATCH.

#### Breach Data Model

The `DataBreach` model (`backend/prisma/schema.prisma`) tracks:
- Severity levels: `p0_critical`, `p1_high`, `p2_medium`, `p3_low`
- Data types affected (array): `pii`, `phi`, `payment`, `credentials`, `internal`
- Number of individuals affected
- Incident commander assignment
- Root cause analysis
- Remediation steps
- Post-mortem URL

---

## 4. Data Processing Records (Records of Processing Activities -- Art. 30)

### 4.1 Categories of Processing

| Category | Data Types | Lawful Basis | Retention | Prisma Model(s) |
|----------|-----------|-------------|-----------|-----------------|
| Account management | Email, display name, user ID | Contract | Active account + 30 days | `app_users`, `tenants`, `tenant_members` |
| CRM | Contact names, emails, company data | Legitimate interest / Consent | While active, 30 days after deletion request | `crm_contacts`, `crm_companies` |
| Platform integrations | OAuth tokens, provider user IDs, post metadata | Consent | While connected, tokens cleared on disconnect | `integrations`, `distribution_events` |
| AI agent processing | Workflow state, tool proposals, agent activity | Contract / Consent | 12 months | `jobs`, `decision_memos`, `intents` |
| Content management | Blog posts, KB documents, assets | Contract | While active | `assets`, `kb_documents` |
| Audit and security | Actor IDs, IP addresses, user agents, actions | Legal obligation / Legitimate interest | 24 months | `audit_log` |
| Billing | Stripe customer references, subscription status | Contract / Legal obligation | 7 years | `ledger_entries` |
| Consent management | Subject email, purpose, lawful basis, IP, user agent | Legal obligation | Duration of processing + 24 months | `consent_records` |
| Breach management | Breach details, affected data types, notification records | Legal obligation | Indefinite (regulatory requirement) | `data_breaches` |
| DSAR management | Subject email, request type, status, response | Legal obligation | 36 months after completion | `data_subject_requests` |

### 4.2 Sub-processors

Atlas UX uses the following third-party sub-processors:

| Sub-processor | Purpose | Data Access | Location | DPA Status |
|--------------|---------|-------------|----------|------------|
| Supabase (AWS) | PostgreSQL hosting, authentication, file storage | All tenant data, auth tokens | US (us-east-1) | Supabase DPA available |
| Render | Backend hosting (API, workers) | All API request data in transit | US (Oregon) | Render DPA available |
| Vercel | Frontend hosting | Static assets, no personal data at rest | Global edge | Vercel DPA available |
| Stripe | Payment processing | Billing data (customer ID, subscription) | US | Stripe DPA in place |
| OpenAI | AI model inference | Prompts containing workflow context (may include personal data) | US | OpenAI DPA available |
| DeepSeek | AI model inference | Prompts containing workflow context | China | DPA status: review needed |
| Microsoft Graph | Email sending, Teams integration | Email content, recipient addresses | US | Microsoft DPA in place |

---

## 5. Compliance Dashboard

The unified compliance dashboard endpoint provides real-time status across GDPR-relevant metrics.

**Endpoint:** `GET /v1/compliance/dashboard`
**File:** `backend/src/routes/complianceRoutes.ts`

Returns:
```json
{
  "compliance": {
    "gdpr": {
      "dsarPending": 0,
      "dsarOverdue": 0,
      "consentsActive": 0,
      "status": "compliant | action_required"
    },
    "breachManagement": {
      "openBreaches": 0,
      "missedDeadlines": 0,
      "status": "clear | monitoring | critical"
    },
    "incidentResponse": {
      "openIncidents": 0,
      "status": "clear | active | elevated"
    },
    "vendorManagement": {
      "totalVendors": 0,
      "assessmentsDue": 0,
      "status": "current | review_needed"
    }
  }
}
```

Status logic:
- **GDPR `action_required`** when any DSAR is past its 30-day deadline
- **Breach `critical`** when any breach has missed its 72-hour authority notification deadline
- **Vendor `review_needed`** when any active vendor assessment is past its annual reassessment date

---

## 6. Data Protection Impact Assessment (DPIA)

### 6.1 DPIA Document

A full Data Protection Impact Assessment has been conducted for Atlas UX AI processing and is documented in `policies/DPIA.md`. The DPIA covers:

| Activity | DPIA Trigger | Risk Level | Status |
|----------|-------------|-----------|--------|
| AI agent autonomous processing | Automated decision-making (Art. 35(3)(a)) -- agents make tool proposals, draft content, execute workflows | High | **DPIA conducted** (`policies/DPIA.md`) |
| Knowledge base RAG | Personal data in tenant documents sent to third-party LLMs | High | **DPIA conducted** |
| Cross-border transfer to DeepSeek (China) | No adequacy decision, no SCCs (Art. 44-49) | High | **DPIA conducted** -- critical risk identified |
| Outbound communications (email, Telegram) | Autonomous sending of messages to individuals | Medium | **DPIA conducted** |
| Cross-platform social media publishing | Processing of social media profile data across multiple platforms | Medium | **DPIA conducted** |
| Web research and intelligence gathering | Systematic monitoring of publicly accessible data | Medium | **DPIA conducted** |

### 6.2 Key Findings

The DPIA identified 10 risks (3 critical, 5 high/medium, 2 low) and documented existing mitigation measures including SGL governance, HIL approval workflows, tenant isolation, audit trail, spend/rate limits, and the Execution Constitution. Three critical recommendations require immediate action:

1. **C1:** Disable or restrict DeepSeek as a provider for EEA tenant data
2. **C2:** Formally appoint a DPO with documented qualifications and independence
3. **C3:** Enforce `ai_processing` consent as a runtime gate before LLM calls

### 6.3 Review Schedule

The DPIA is scheduled for review every 6 months or when any of the following changes occur:
- A new AI provider is added to `backend/src/ai.ts`
- A new agent tool is added to `backend/src/core/agent/agentTools.ts`
- A new agent with external action capabilities is added to the registry
- A new category of personal data is processed by the AI pipeline

**Pending:** DPO review of the DPIA (blocked on formal DPO appointment).

---

## 7. Cross-Border Transfer Considerations

### 7.1 Current Data Flows

Atlas UX infrastructure is US-based. Personal data of EEA residents is transferred to:

| Destination | Provider | Transfer Mechanism | Status |
|-------------|----------|-------------------|--------|
| US (AWS us-east-1) | Supabase | Standard Contractual Clauses (SCCs) via Supabase DPA | Available, needs execution |
| US (Oregon) | Render | SCCs via Render DPA | Available, needs execution |
| US | Stripe | SCCs, Stripe DPA | In place |
| US | OpenAI | SCCs via OpenAI DPA | Available, needs execution |
| China | DeepSeek | No adequacy decision, no SCCs in place | Gap -- requires assessment |
| Global edge | Vercel | SCCs via Vercel DPA | Available, needs execution |

### 7.2 Transfer Impact Assessment

Under the Schrems II ruling (CJEU C-311/18), supplementary measures may be needed for transfers to the US, despite the EU-US Data Privacy Framework. Current supplementary measures include:
- Encryption at rest (AES-256 at Supabase storage layer)
- TLS encryption in transit
- Tenant-scoped access controls limiting data access to authorized users
- Audit logging of all data access

### 7.3 Gaps

- **DeepSeek (China):** No adequacy decision exists for China. Standard Contractual Clauses and a Transfer Impact Assessment would be required before routing EEA personal data through DeepSeek models. Consider routing EEA tenant workloads through OpenAI or other US/EU-based providers only.
- **DPA execution:** While DPAs are available from Supabase, Render, Vercel, and OpenAI, formal execution has not been completed for all sub-processors.
- **EU representative:** Art. 27 requires designation of an EU representative if DEAD APP CORP is not established in the EU and processes EEA personal data. A representative has been designated at `representative-eu@atlasux.com` but a physical EU address has not been published.

---

## 8. Evidence References

### 8.1 API Endpoints

All compliance endpoints are registered under `/v1/compliance` in `backend/src/server.ts` (line 288).

| Endpoint | Method | GDPR Article | Purpose |
|----------|--------|-------------|---------|
| `/v1/compliance/dsar` | GET | Art. 12 | List all DSARs for tenant |
| `/v1/compliance/dsar` | POST | Art. 15-21 | Create a new DSAR |
| `/v1/compliance/dsar/:id` | PATCH | Art. 12 | Update DSAR status |
| `/v1/compliance/dsar/overdue` | GET | Art. 12 | List overdue DSARs |
| `/v1/compliance/dsar/:email/export` | GET | Art. 20 | Export subject data (portability) |
| `/v1/compliance/dsar/:email/erase` | DELETE | Art. 17 | Erase subject data |
| `/v1/compliance/consent/:email` | GET | Art. 7 | List consent records for subject |
| `/v1/compliance/consent` | POST | Art. 6, 7 | Grant consent |
| `/v1/compliance/consent/:email/:purpose` | DELETE | Art. 7(3) | Withdraw consent |
| `/v1/compliance/breaches` | GET | Art. 33 | List breaches |
| `/v1/compliance/breaches` | POST | Art. 33 | Report a breach |
| `/v1/compliance/breaches/:id` | PATCH | Art. 33-34 | Update breach status/notifications |
| `/v1/compliance/breaches/deadlines` | GET | Art. 33 | List breaches approaching deadlines |
| `/v1/compliance/dashboard` | GET | Art. 5(2) | Unified compliance status |
| `/v1/meta/datadeletion` | POST | Art. 17 | Meta platform deletion callback |
| `/v1/google/datadeletion` | POST | Art. 17 | Google platform deletion callback |

### 8.2 Source Files

| File | Purpose |
|------|---------|
| `backend/src/routes/complianceRoutes.ts` | DSAR, consent, breach, incident, vendor endpoints |
| `backend/src/routes/metaRoutes.ts` | Meta data deletion callback |
| `backend/src/routes/googleRoutes.ts` | Google data deletion callback |
| `backend/src/plugins/auditPlugin.ts` | Automatic audit logging on every request |
| `backend/src/plugins/authPlugin.ts` | JWT authentication via Supabase |
| `backend/src/plugins/tenantPlugin.ts` | Tenant resolution and membership verification |
| `backend/src/plugins/csrfPlugin.ts` | CSRF protection (currently disabled) |
| `backend/src/db/prisma.ts` | `withTenant()` RLS helper |
| `backend/prisma/schema.prisma` | Data models for all compliance tables |
| `backend/prisma/migrations/20260228120000_rls_policies/migration.sql` | RLS policy definitions |
| `backend/prisma/migrations/20260304010000_audit_hash_chain/migration.sql` | Hash chain columns |
| `backend/src/server.ts` | Helmet, CORS, rate limiting configuration |
| `policies/DATA_RETENTION.md` | Data retention and deletion policy |

### 8.3 Database Models

| Model | Table | GDPR Relevance |
|-------|-------|---------------|
| `DataSubjectRequest` | `data_subject_requests` | DSAR tracking with 30-day deadlines |
| `ConsentRecord` | `consent_records` | Consent management with purpose and lawful basis |
| `DataBreach` | `data_breaches` | Breach register with 72-hour notification deadlines |
| `AuditLog` | `audit_log` | Immutable audit trail (hash chain planned) |
| `IncidentReport` | `incident_reports` | Security incident tracking |
| `VendorAssessment` | `vendor_assessments` | Sub-processor risk assessments |
| `Integration` | `integrations` | OAuth token storage (erasure target) |
| `CrmContact` | `crm_contacts` | Personal data (erasure target) |

---

## 9. Gap Analysis

### 9.1 Implemented

| Item | Description |
|------|-------------|
| DSAR endpoints (Art. 15-21) | Full CRUD lifecycle with 30-day deadline tracking and overdue monitoring |
| Consent management (Art. 6-7) | Granular per-purpose consent with lawful basis, grant, and withdrawal |
| Breach register (Art. 33-34) | 72-hour deadline tracking, status workflow, notification timestamps |
| Data portability (Art. 20) | JSON export of all subject data across tenant |
| Data erasure (Art. 17) | Automated deletion of CRM contacts, consent records, integration tokens |
| Platform deletion callbacks (Art. 17) | Meta (signed request validation) and Google deletion endpoints |
| Audit logging (Art. 5(2)) | Automatic logging on every API request and every compliance mutation |
| Tenant isolation (Art. 25) | Application-level tenant_id scoping + PostgreSQL RLS on 9 tables |
| Compliance dashboard | Real-time status monitoring across GDPR, breach, incident, vendor metrics |
| Privacy and Terms pages | Public-facing privacy policy and terms of service |
| Data retention policy | Defined retention periods per data category |

### 9.2 Partial

| Item | Gap | Remediation |
|------|-----|-------------|
| Hash-chained audit logs (Art. 5(1)(f)) | Schema columns exist but hash computation not implemented in auditPlugin | Implement `auditChain.ts` and integrate into auditPlugin per design doc Section 1 |
| RLS coverage (Art. 25) | RLS enabled on all 12 tables; `FORCE ROW LEVEL SECURITY` not yet enabled; not all routes use `withTenant()` | Enable FORCE RLS after withTenant() route migration |
| ~~HSTS (Art. 32)~~ | ~~HSTS not explicitly set~~ | **RESOLVED** — HSTS with 1-year maxAge + includeSubDomains (Mar 4, 2026) |
| ~~CSRF protection (Art. 32)~~ | ~~Plugin disabled~~ | **RESOLVED** — DB-backed synchronizer token pattern (Mar 4, 2026) |
| ~~Input validation (Art. 32)~~ | ~~No Zod schemas~~ | **RESOLVED** — Zod schemas on all compliance routes (Mar 4, 2026) |
| ~~DPO designation (Art. 37-39)~~ | ~~No formal appointment~~ | **RESOLVED** — Billy Whited appointed DPO (Mar 5, 2026) |
| Cross-border transfers (Art. 44-49) | Sub-processor DPAs available but not all formally executed | Execute DPAs with all sub-processors; conduct Transfer Impact Assessment |

### 9.3 Planned / Not Yet Implemented

| Item | Gap | Priority |
|------|-----|----------|
| DPIA for AI agents (Art. 35) | **COMPLETED** -- see `policies/DPIA.md`. Pending DPO review. | Done -- 3 critical, 5 high/medium, 2 low residual risks identified |
| ~~Session termination (Art. 32)~~ | ~~No token revocation~~ | **RESOLVED** — revoked_tokens table + logout endpoint (Mar 4, 2026) |
| ~~Per-tenant rate limiting (Art. 32)~~ | ~~Only IP-based~~ | **RESOLVED** — tenantRateLimit.ts plugin, 3-tier limits (Mar 4, 2026) |
| Automated DSAR fulfillment | DSARs are tracked but require manual processing by admin | Medium -- could automate access/export responses |
| EU representative (Art. 27) | Email designated but no physical EU address published | Medium |
| ~~DeepSeek transfer assessment~~ | ~~No adequacy for China~~ | **MITIGATED** — PII redaction layer (`piiRedact.ts`) strips personal data before DeepSeek transfer (Mar 5, 2026) |
| Consent banner / frontend integration | Backend consent API exists but no frontend consent collection UI | Medium |
| Data subject self-service portal | Subjects must go through admin; no self-service DSAR submission | Low |

---

## 10. Contact Information

- **Data Protection Officer:** Billy Whited, dpo@atlasux.com, (816) 747-6150, 510 E Washington Street, Vandalia, MO 63382
- **GDPR Compliance:** gdpr@atlasux.com
- **Data Subject Rights:** rights@atlasux.com
- **Breach Reporting:** breaches@atlasux.com
- **Privacy Contact:** privacy@deadapp.info
- **Security Contact:** security@deadapp.info
- **EU Representative:** representative-eu@atlasux.com

**Company:** DEAD APP CORP
**Product:** Atlas UX
**Privacy Policy:** https://atlasux.cloud/#/privacy
**Terms of Service:** https://atlasux.cloud/#/terms

---

Last updated: March 1, 2026
Next review: June 1, 2026
