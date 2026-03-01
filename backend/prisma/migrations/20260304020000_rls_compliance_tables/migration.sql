-- Enable RLS on 3 remaining compliance tables
-- Controls: SOC 2 CC6.3, HIPAA §164.312(a)(1), NIST AC-3, PCI 7.1, HITRUST 01.c, GDPR Art. 25

ALTER TABLE "consent_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "data_subject_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "data_breaches" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "consent_records"
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON "data_subject_requests"
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

CREATE POLICY tenant_isolation ON "data_breaches"
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );
