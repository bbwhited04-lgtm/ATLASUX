-- Compliance tables: GDPR DSAR, Consent, Breach Register, Incident Reports, Vendor Assessments

-- GDPR Data Subject Access Requests
CREATE TABLE IF NOT EXISTS "data_subject_requests" (
    "id"               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id"        UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "request_type"     TEXT NOT NULL, -- access, erasure, portability, restriction, rectification, objection
    "status"           TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, denied
    "subject_email"    TEXT NOT NULL,
    "subject_name"     TEXT,
    "requested_by"     UUID,
    "reason"           TEXT,
    "response"         TEXT,
    "data_export_url"  TEXT,
    "completed_at"     TIMESTAMPTZ(6),
    "due_by"           TIMESTAMPTZ(6) NOT NULL,
    "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "data_subject_requests_tenant_id_idx" ON "data_subject_requests"("tenant_id");
CREATE INDEX IF NOT EXISTS "data_subject_requests_status_idx" ON "data_subject_requests"("status");
CREATE INDEX IF NOT EXISTS "data_subject_requests_subject_email_idx" ON "data_subject_requests"("subject_email");
CREATE INDEX IF NOT EXISTS "data_subject_requests_due_by_idx" ON "data_subject_requests"("due_by");

-- GDPR Consent Records
CREATE TABLE IF NOT EXISTS "consent_records" (
    "id"               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id"        UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "subject_email"    TEXT NOT NULL,
    "purpose"          TEXT NOT NULL, -- marketing, analytics, ai_processing, data_sharing, communications
    "lawful_basis"     TEXT NOT NULL, -- consent, contract, legal_obligation, vital_interest, public_task, legitimate_interest
    "granted"          BOOLEAN NOT NULL DEFAULT false,
    "granted_at"       TIMESTAMPTZ(6),
    "withdrawn_at"     TIMESTAMPTZ(6),
    "ip_address"       TEXT,
    "user_agent"       TEXT,
    "version"          TEXT NOT NULL DEFAULT '1.0',
    "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "consent_records_tenant_email_purpose_idx" ON "consent_records"("tenant_id", "subject_email", "purpose");
CREATE INDEX IF NOT EXISTS "consent_records_tenant_id_idx" ON "consent_records"("tenant_id");
CREATE INDEX IF NOT EXISTS "consent_records_subject_email_idx" ON "consent_records"("subject_email");

-- Data Breach Register (GDPR 72-hour / HIPAA 60-day)
CREATE TABLE IF NOT EXISTS "data_breaches" (
    "id"                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id"               UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "severity"                TEXT NOT NULL, -- p0_critical, p1_high, p2_medium, p3_low
    "status"                  TEXT NOT NULL DEFAULT 'detected', -- detected, contained, eradicated, recovered, closed
    "title"                   TEXT NOT NULL,
    "description"             TEXT NOT NULL,
    "data_types_affected"     TEXT[] NOT NULL DEFAULT '{}',
    "individuals_affected"    INTEGER,
    "detected_at"             TIMESTAMPTZ(6) NOT NULL,
    "contained_at"            TIMESTAMPTZ(6),
    "notify_authority_by"     TIMESTAMPTZ(6) NOT NULL, -- 72 hours from detection
    "authority_notified_at"   TIMESTAMPTZ(6),
    "notify_individuals_by"   TIMESTAMPTZ(6),           -- 60 days (HIPAA)
    "individuals_notified_at" TIMESTAMPTZ(6),
    "root_cause"              TEXT,
    "remediation_steps"       TEXT,
    "post_mortem_url"         TEXT,
    "reported_by"             UUID,
    "incident_commander"      TEXT,
    "created_at"              TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"              TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "data_breaches_tenant_id_idx" ON "data_breaches"("tenant_id");
CREATE INDEX IF NOT EXISTS "data_breaches_status_idx" ON "data_breaches"("status");
CREATE INDEX IF NOT EXISTS "data_breaches_severity_idx" ON "data_breaches"("severity");
CREATE INDEX IF NOT EXISTS "data_breaches_notify_authority_by_idx" ON "data_breaches"("notify_authority_by");

-- Incident Reports (SOC 2 / ISO 27001)
CREATE TABLE IF NOT EXISTS "incident_reports" (
    "id"                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id"         UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "severity"          TEXT NOT NULL, -- p0, p1, p2, p3
    "status"            TEXT NOT NULL DEFAULT 'open', -- open, investigating, mitigated, resolved, closed
    "category"          TEXT NOT NULL, -- security, availability, data_integrity, access_control, compliance, operational
    "title"             TEXT NOT NULL,
    "description"       TEXT NOT NULL,
    "impact_summary"    TEXT,
    "affected_systems"  TEXT[] NOT NULL DEFAULT '{}',
    "reported_by"       UUID,
    "assigned_to"       TEXT,
    "resolved_at"       TIMESTAMPTZ(6),
    "root_cause"        TEXT,
    "resolution"        TEXT,
    "lessons_learned"   TEXT,
    "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "incident_reports_tenant_id_idx" ON "incident_reports"("tenant_id");
CREATE INDEX IF NOT EXISTS "incident_reports_status_idx" ON "incident_reports"("status");
CREATE INDEX IF NOT EXISTS "incident_reports_severity_idx" ON "incident_reports"("severity");
CREATE INDEX IF NOT EXISTS "incident_reports_category_idx" ON "incident_reports"("category");

-- Vendor Risk Assessments (ISO 27001 A.15 / SOC 2)
CREATE TABLE IF NOT EXISTS "vendor_assessments" (
    "id"                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id"             UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "vendor_name"           TEXT NOT NULL,
    "category"              TEXT NOT NULL, -- infrastructure, payment, ai_provider, communication, storage, analytics
    "risk_level"            TEXT NOT NULL, -- critical, high, medium, low
    "data_access"           TEXT[] NOT NULL DEFAULT '{}',
    "compliance_certs"      TEXT[] NOT NULL DEFAULT '{}',
    "has_dpa"               BOOLEAN NOT NULL DEFAULT false,
    "has_baa"               BOOLEAN NOT NULL DEFAULT false,
    "last_assessed_at"      TIMESTAMPTZ(6),
    "next_assessment_due"   TIMESTAMPTZ(6),
    "status"                TEXT NOT NULL DEFAULT 'active', -- active, under_review, suspended, terminated
    "notes"                 TEXT,
    "assessed_by"           UUID,
    "created_at"            TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"            TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "vendor_assessments_tenant_vendor_idx" ON "vendor_assessments"("tenant_id", "vendor_name");
CREATE INDEX IF NOT EXISTS "vendor_assessments_tenant_id_idx" ON "vendor_assessments"("tenant_id");
CREATE INDEX IF NOT EXISTS "vendor_assessments_risk_level_idx" ON "vendor_assessments"("risk_level");
CREATE INDEX IF NOT EXISTS "vendor_assessments_next_assessment_due_idx" ON "vendor_assessments"("next_assessment_due");
