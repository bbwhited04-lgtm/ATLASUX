-- Phase 2: Row-Level Security policies for tenant isolation.
--
-- Policies use `current_setting('app.tenant_id', true)` so they only
-- filter when the session variable is set (via SET LOCAL in a transaction).
--
-- Phase 2 enables RLS WITHOUT `FORCE ROW LEVEL SECURITY`.
-- Since Prisma connects as the superuser (postgres), queries work unchanged.
-- The withTenant() helper sets the session variable for routes that opt in.
-- Phase 3 can add FORCE once all critical routes use withTenant().

-- ── Enable RLS on tenant-scoped tables ──────────────────────────────────────

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;

-- ── Tenant isolation policies ───────────────────────────────────────────────
-- Each policy allows SELECT/INSERT/UPDATE/DELETE only when:
--   current_setting('app.tenant_id', true) IS NULL   (no filter set — superuser/migration)
--   OR tenant_id = current_setting(...)::uuid         (tenant matches)
--
-- All tables use the column name `tenant_id` (Prisma @map("tenant_id")).

CREATE POLICY tenant_isolation ON integrations
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON assets
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON jobs
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON distribution_events
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON audit_log
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON kb_documents
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON decision_memos
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON crm_contacts
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON crm_companies
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );
