-- Decision memos
CREATE TABLE IF NOT EXISTS "decision_memos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "estimated_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "billing_type" TEXT NOT NULL DEFAULT 'none',
  "risk_tier" INTEGER NOT NULL DEFAULT 0,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "expected_benefit" TEXT,
  "requires_approval" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" TEXT NOT NULL DEFAULT 'PROPOSED',
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "decision_memos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "decision_memos_tenant_time_idx" ON "decision_memos" ("tenant_id", "created_at" DESC);

ALTER TABLE "decision_memos"
  ADD CONSTRAINT IF NOT EXISTS "decision_memos_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Distribution events
CREATE TABLE IF NOT EXISTS "distribution_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent" TEXT NOT NULL DEFAULT 'unknown',
  "channel" TEXT NOT NULL DEFAULT 'other',
  "event_type" TEXT NOT NULL,
  "url" TEXT,
  "meta" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "impressions" INTEGER,
  "clicks" INTEGER,
  "conversions" INTEGER,
  "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "distribution_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "distribution_events_tenant_time_idx" ON "distribution_events" ("tenant_id", "occurred_at" DESC);

ALTER TABLE "distribution_events"
  ADD CONSTRAINT IF NOT EXISTS "distribution_events_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Metrics snapshots
CREATE TABLE IF NOT EXISTS "metrics_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "metrics_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "metrics_snapshot_tenant_date_key" ON "metrics_snapshots" ("tenant_id", "date");
CREATE INDEX IF NOT EXISTS "metrics_snapshot_tenant_date_idx" ON "metrics_snapshots" ("tenant_id", "date" DESC);

ALTER TABLE "metrics_snapshots"
  ADD CONSTRAINT IF NOT EXISTS "metrics_snapshots_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Growth loop runs
CREATE TABLE IF NOT EXISTS "growth_loop_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "run_date" DATE NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'STARTED',
  "decision_memo_id" UUID,
  "summary" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "growth_loop_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "growth_loop_runs_tenant_run_date_key" ON "growth_loop_runs" ("tenant_id", "run_date");

ALTER TABLE "growth_loop_runs"
  ADD CONSTRAINT IF NOT EXISTS "growth_loop_runs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

ALTER TABLE "growth_loop_runs"
  ADD CONSTRAINT IF NOT EXISTS "growth_loop_runs_decision_memo_id_fkey"
  FOREIGN KEY ("decision_memo_id") REFERENCES "decision_memos"("id") ON DELETE SET NULL;
