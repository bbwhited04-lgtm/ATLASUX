# Database Schema

PostgreSQL 16 on AWS Lightsail. ORM: Prisma. Schema: `backend/prisma/schema.prisma`.

---

## Core Models

### Tenant & Identity

| Model | Table | Purpose |
|-------|-------|---------|
| `Tenant` | `tenants` | Root entity for multi-tenancy. Every resource links here via `tenant_id` |
| `User` | `users` | Global user identity (cross-tenant). Stores email, password hash, avatar |
| `TenantMember` | `tenant_members` | Many-to-many: User <-> Tenant with role and seat type. Composite PK: `(tenant_id, user_id)` |
| `app_users` | `app_users` | Legacy per-tenant user records (pre-User model). FK target for audit logs |

### Authentication & Seats

| Model | Table | Purpose |
|-------|-------|---------|
| `CloudSeat` | `cloud_seats` | Gate codes for cloud access. 256-bit hex key, revocable, role-based |
| `RevokedToken` | `revoked_tokens` | JWT blacklist. SHA-256 hash + expiry. Pruned daily |
| `OAuthState` | `oauth_state` | DB-backed OAuth state + CSRF tokens. Key-value with TTL |
| `Subscription` | `subscriptions` | Per-user Stripe subscription record. Links to Stripe customer/subscription IDs |
| `UsageMeter` | `usage_meters` | Monthly per-user usage tracking: tokens, API calls, jobs, storage |
| `TokenVault` | `token_vault` | Encrypted OAuth tokens per org/user/provider |

### CRM

| Model | Table | Purpose |
|-------|-------|---------|
| `CrmContact` | `crm_contacts` | Contact records. Searchable by name, email, phone, company |
| `CrmCompany` | `crm_companies` | Company records with industry, domain, website |
| `CrmSegment` | `crm_segments` | Dynamic contact segments with JSON filter definitions |
| `ContactActivity` | `contact_activities` | Activity timeline: email, call, note, meeting, mention, sms |

### Engine & Governance

| Model | Table | Purpose |
|-------|-------|---------|
| `Intent` | `intents` | Engine intent queue. Status: DRAFT -> RUNNING -> EXECUTED/FAILED. SGL result stored |
| `DecisionMemo` | `decision_memos` | Spend/approval governance. Contains agent, title, rationale, estimated cost, risk tier, confidence |
| `DecisionOutcome` | `decision_outcomes` | Outcome tracking: positive/negative/neutral/mixed with evidence and impact score |
| `DecisionTemplate` | `decision_templates` | Reusable templates for common decision types |
| `approvals` | `approvals` | Human approval records: payload hash, approver, expiry |

### Agent System

| Model | Table | Purpose |
|-------|-------|---------|
| `agents` | `agents` | Global agent registry: key, display name, role, tools allowed/restricted |
| `agent_inboxes` | `agent_inboxes` | Per-agent email inboxes with audit requirements |
| `agent_inbox_events` | `agent_inbox_events` | Inbound emails received by agent inboxes |
| `agent_registry` | `agent_registry` | Per-tenant agent instances (RLS-protected) |
| `AgentMemory` | `agent_memory` | Deep agent conversation memory. Indexed by tenant + agent + session |
| `TenantAgentConfig` | `tenant_agent_config` | Per-tenant agent enablement. No row = agent unavailable |
| `TenantWorkflowConfig` | `tenant_workflow_config` | Per-tenant workflow enablement |
| `TenantCredential` | `tenant_credentials` | Per-tenant API keys for external services. Encrypted at rest |

### Workflows

| Model | Table | Purpose |
|-------|-------|---------|
| `workflows` | `workflows` | Workflow definitions: key, agent, trigger, policy, outputs |
| `workflow_steps` | `workflow_steps` | Ordered steps within a workflow |
| `atlas_workflows` | `atlas_workflows` | Atlas-specific workflow documents (JSON) |

### Knowledge Base

| Model | Table | Purpose |
|-------|-------|---------|
| `KbDocument` | `kb_documents` | Documents with title, slug, body. Status: draft/published/archived |
| `KbChunk` | `kb_chunks` | Character-indexed chunks for RAG retrieval |
| `KbTag` | `kb_tags` | Tag taxonomy per tenant |
| `KbTagOnDocument` | `kb_tag_on_document` | Many-to-many: documents <-> tags |
| `KbDocumentVersion` | `kb_document_versions` | Version history with diffs and change summaries |

### Financial

| Model | Table | Purpose |
|-------|-------|---------|
| `LedgerEntry` | `ledger_entries` | Double-entry ledger: credit/debit, category, amount in cents, external ref |
| `Budget` | `budgets` | Budget caps per category with alert thresholds |

### Audit & Compliance

| Model | Table | Purpose |
|-------|-------|---------|
| `AuditLog` | `audit_log` | Central audit trail. Hash chain columns (`prev_hash`, `record_hash`) for tamper detection |
| `DataSubjectRequest` | `data_subject_requests` | GDPR DSAR tracking: access, erasure, portability, restriction, rectification |
| `ConsentRecord` | `consent_records` | Per-subject consent per processing purpose with lawful basis |
| `DataBreach` | `data_breaches` | Breach register: severity, status, affected data types, notification deadlines |
| `IncidentReport` | `incident_reports` | SOC 2/ISO 27001 incident tracking |
| `VendorAssessment` | `vendor_assessments` | Third-party vendor risk assessments |

### Content & Distribution

| Model | Table | Purpose |
|-------|-------|---------|
| `Asset` | `assets` | Content assets: type, name, URL, platform, metrics |
| `DistributionEvent` | `distribution_events` | Social publish events with impressions/clicks/conversions |
| `publish_events` | `publish_events` | Legacy publish tracking with UTM campaign data |
| `MetricsSnapshot` | `metrics_snapshots` | Daily metrics snapshots (JSON blob per tenant per date) |
| `GrowthLoopRun` | `growth_loop_runs` | Daily growth loop execution records |

### Communication

| Model | Table | Purpose |
|-------|-------|---------|
| `SlackMessage` | `slack_messages` | Cached Slack messages for agent context |
| `CannedResponse` | `canned_responses` | Message templates per channel |
| `Lead` | `leads` | Public lead capture (name, email, phone, business info) |

### Specialized

| Model | Table | Purpose |
|-------|-------|---------|
| `Job` | `jobs` | Async job queue: type, status, priority, retry config, cost tracking |
| `Ticket` | `tickets` | Beta feedback tickets: status, severity, category |
| `TicketComment` | `ticket_comments` | Comments on tickets |
| `ToolProposal` | `tool_proposals` | Agent tool proposals awaiting human approval |
| `OrgMemory` | `org_memories` | Organizational brain: preferences, insights, patterns, outcomes |
| `MeetingNote` | `meeting_notes` | Meeting transcripts + AI summaries + action items |
| `BrowserSession` | `browser_sessions` | Governed browser automation sessions |
| `BrowserAction` | `browser_actions` | Individual browser actions within sessions |
| `AtlasConversation` | `atlas_conversations` | Atlas orchestration conversation context |
| `DncPhone` | `dnc_phones` | Do-not-call phone list |
| `CallCost` | `call_costs` | Voice call cost tracking |
| `CalendarBooking` | `calendar_bookings` | Calendar appointment bookings |
| `Integration` | `integrations` | OAuth integration status per tenant per provider |
| `system_state` | `system_state` | Key-value system configuration (e.g., atlas_online) |
| `runtime_state` | `runtime_state` | Engine runtime flags |

### IP Research

| Model | Table | Purpose |
|-------|-------|---------|
| `atlas_ip_requests` | `atlas_ip_requests` | IP research requests |
| `atlas_ip_reports` | `atlas_ip_reports` | Generated IP reports |
| `atlas_ip_artifacts` | `atlas_ip_artifacts` | Retrieved research artifacts |
| `atlas_ip_messages` | `atlas_ip_messages` | Research thread messages |
| `atlas_ip_approvals` | `atlas_ip_approvals` | IP action approvals |
| `atlas_suggestions` | `atlas_suggestions` | Atlas-generated suggestions with approval tokens |

---

## Enums

| Enum | Values | Usage |
|------|--------|-------|
| `AuditLevel` | info, warn, error, security | Audit log severity |
| `LedgerEntryType` | credit, debit | Ledger double-entry |
| `LedgerCategory` | subscription, token_spend, api_spend, refund, chargeback, payout, misc | Ledger categorization |
| `SeatType` | free_beta, starter, pro, enterprise | Subscription tier |
| `KbDocumentStatus` | draft, published, archived | KB document lifecycle |
| `job_status` | queued, running, succeeded, failed, canceled | Job lifecycle |
| `TicketStatus` | OPEN, TRIAGED, IN_PROGRESS, CLOSED | Ticket lifecycle |
| `TicketSeverity` | LOW, MEDIUM, HIGH, BLOCKER | Ticket priority |
| `TicketCategory` | BUG, UX, GUARDRAIL, PERFORMANCE, OTHER | Ticket classification |

---

## Key Indexes

Indexes are designed for common query patterns:

- `audit_log_tenant_time_idx` — Tenant-scoped audit queries sorted by time
- `audit_log_record_hash_idx` — Hash chain verification lookups
- `jobs_tenant_status_idx` — Job polling per tenant
- `jobs_retry_idx` — Retry scheduling
- `decision_memos_tenant_time_idx` — Decision memo listing
- `ledger_entries_tenant_occurred_at_idx` — Ledger queries by date
- `crm_contacts(tenant_id, email)` — Contact deduplication
- `org_memories(tenant_id, category)` — Memory recall by type
- `org_memories(tenant_id, access_count DESC)` — Most-accessed memories

---

## Tenant Isolation

1. **Application layer:** `tenantPlugin` validates UUID format and membership before setting `req.tenantId`.
2. **Query layer:** `withTenant()` sets PostgreSQL session variable `app.tenant_id` for RLS.
3. **Database layer:** RLS policies on tables marked with `row level security` ensure isolation at the storage level.
4. **UUID validation:** Tenant IDs are regex-validated before use to prevent injection into RLS session variables.

Tables with explicit RLS annotation in schema: `agent_registry`, `approvals`, `intents`, `atlas_ip_requests`, `publish_events`.
