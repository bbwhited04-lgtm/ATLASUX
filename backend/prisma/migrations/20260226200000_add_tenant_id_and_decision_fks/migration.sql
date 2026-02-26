-- Add tenant_id to tables that were missing it (multi-tenancy compliance)

-- publish_events
ALTER TABLE "publish_events" ADD COLUMN "tenant_id" UUID;
CREATE INDEX "idx_publish_events_tenant" ON "publish_events"("tenant_id");

-- atlas_ip_requests
ALTER TABLE "atlas_ip_requests" ADD COLUMN "tenant_id" UUID;
CREATE INDEX "idx_ip_requests_tenant" ON "atlas_ip_requests"("tenant_id");

-- atlas_ip_approvals
ALTER TABLE "atlas_ip_approvals" ADD COLUMN "tenant_id" UUID;
CREATE INDEX "idx_ip_approvals_tenant" ON "atlas_ip_approvals"("tenant_id");

-- atlas_ip_artifacts
ALTER TABLE "atlas_ip_artifacts" ADD COLUMN "tenant_id" UUID;
CREATE INDEX "idx_ip_artifacts_tenant" ON "atlas_ip_artifacts"("tenant_id");

-- atlas_ip_messages
ALTER TABLE "atlas_ip_messages" ADD COLUMN "tenant_id" UUID;
CREATE INDEX "idx_ip_messages_tenant" ON "atlas_ip_messages"("tenant_id");

-- atlas_ip_reports
ALTER TABLE "atlas_ip_reports" ADD COLUMN "tenant_id" UUID;
CREATE INDEX "idx_ip_reports_tenant" ON "atlas_ip_reports"("tenant_id");

-- atlas_suggestions
ALTER TABLE "atlas_suggestions" ADD COLUMN "tenant_id" UUID;
CREATE INDEX "idx_suggestions_tenant" ON "atlas_suggestions"("tenant_id");

-- DecisionMemo: add FK to source job and intent
ALTER TABLE "decision_memos" ADD COLUMN "job_id" UUID;
ALTER TABLE "decision_memos" ADD COLUMN "intent_id" UUID;
CREATE INDEX "decision_memos_job_idx" ON "decision_memos"("job_id");
CREATE INDEX "decision_memos_intent_idx" ON "decision_memos"("intent_id");
ALTER TABLE "decision_memos" ADD CONSTRAINT "decision_memos_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "decision_memos" ADD CONSTRAINT "decision_memos_intent_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "intents"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
