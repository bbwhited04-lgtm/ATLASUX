-- Add hash chain columns for tamper-evident audit logs
-- Controls: SOC 2 CC7.2, ISO A.12.4.1, NIST AU-10, HITRUST 09.aa, PCI 10.5.5, GDPR Art. 5(1)(f)

ALTER TABLE "audit_log" ADD COLUMN "prev_hash" TEXT;
ALTER TABLE "audit_log" ADD COLUMN "record_hash" TEXT;
CREATE INDEX "audit_log_record_hash_idx" ON "audit_log" ("record_hash");
