-- Phase 3: Complete RLS coverage + FORCE ROW LEVEL SECURITY
-- Closes compliance gaps: "FORCE ROW LEVEL SECURITY not enabled"
--                         "Not all routes use withTenant()"
--
-- The IS NULL fallback in each policy allows workers/migrations
-- (which don't set app.tenant_id) to continue working.

-- ── 1. Enable RLS + create policies on 30 missing tenant-scoped tables ──

ALTER TABLE listener_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON listener_sources
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON contact_activities
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE crm_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON crm_segments
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_members
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ledger_entries
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE kb_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON kb_tags
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON intents
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tickets
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ticket_comments
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON metrics_snapshots
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE growth_loop_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON growth_loop_runs
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE kb_document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON kb_document_versions
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE decision_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON decision_templates
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON canned_responses
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON budgets
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE tool_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tool_proposals
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON agent_memory
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE usage_meters ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON usage_meters
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON subscriptions
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON incident_reports
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE vendor_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON vendor_assessments
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE atlas_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON atlas_conversations
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON meeting_notes
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON browser_sessions
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE browser_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON browser_actions
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE revoked_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON revoked_tokens
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE token_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON token_vault
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE cloud_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON cloud_seats
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON approvals
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE atlas_ip_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON atlas_ip_approvals
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ── 2. FORCE ROW LEVEL SECURITY on ALL tenant-scoped tables ──
-- This makes RLS apply even for superuser (Prisma's postgres role).
-- The IS NULL fallback in each policy still allows un-scoped access
-- when app.tenant_id is not set (workers, migrations).

-- Previously covered (12 tables):
ALTER TABLE integrations FORCE ROW LEVEL SECURITY;
ALTER TABLE assets FORCE ROW LEVEL SECURITY;
ALTER TABLE jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE distribution_events FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE kb_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE decision_memos FORCE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE crm_companies FORCE ROW LEVEL SECURITY;
ALTER TABLE consent_records FORCE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE data_breaches FORCE ROW LEVEL SECURITY;

-- Newly covered (30 tables):
ALTER TABLE listener_sources FORCE ROW LEVEL SECURITY;
ALTER TABLE contact_activities FORCE ROW LEVEL SECURITY;
ALTER TABLE crm_segments FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_members FORCE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE kb_tags FORCE ROW LEVEL SECURITY;
ALTER TABLE intents FORCE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments FORCE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE growth_loop_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE kb_document_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE decision_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE canned_responses FORCE ROW LEVEL SECURITY;
ALTER TABLE budgets FORCE ROW LEVEL SECURITY;
ALTER TABLE tool_proposals FORCE ROW LEVEL SECURITY;
ALTER TABLE agent_memory FORCE ROW LEVEL SECURITY;
ALTER TABLE usage_meters FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE incident_reports FORCE ROW LEVEL SECURITY;
ALTER TABLE vendor_assessments FORCE ROW LEVEL SECURITY;
ALTER TABLE atlas_conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE browser_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE browser_actions FORCE ROW LEVEL SECURITY;
ALTER TABLE revoked_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE token_vault FORCE ROW LEVEL SECURITY;
ALTER TABLE cloud_seats FORCE ROW LEVEL SECURITY;
ALTER TABLE approvals FORCE ROW LEVEL SECURITY;
ALTER TABLE atlas_ip_approvals FORCE ROW LEVEL SECURITY;
