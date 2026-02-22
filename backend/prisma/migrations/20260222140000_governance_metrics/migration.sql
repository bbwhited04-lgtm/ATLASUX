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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'decision_memos_tenant_time_idx'
      AND n.nspname = 'public'
  ) THEN
    CREATE INDEX "decision_memos_tenant_time_idx" ON "decision_memos" ("tenant_id", "created_at" DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'decision_memos_tenant_id_fkey'
  ) THEN
    ALTER TABLE "decision_memos"
      ADD CONSTRAINT "decision_memos_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
  END IF;
END $$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'distribution_events_tenant_time_idx'
      AND n.nspname = 'public'
  ) THEN
    CREATE INDEX "distribution_events_tenant_time_idx" ON "distribution_events" ("tenant_id", "occurred_at" DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'distribution_events_tenant_id_fkey'
  ) THEN
    ALTER TABLE "distribution_events"
      ADD CONSTRAINT "distribution_events_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
  END IF;
END $$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'metrics_snapshot_tenant_date_key'
      AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX "metrics_snapshot_tenant_date_key" ON "metrics_snapshots" ("tenant_id", "date");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'metrics_snapshot_tenant_date_idx'
      AND n.nspname = 'public'
  ) THEN
    CREATE INDEX "metrics_snapshot_tenant_date_idx" ON "metrics_snapshots" ("tenant_id", "date" DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'metrics_snapshots_tenant_id_fkey'
  ) THEN
    ALTER TABLE "metrics_snapshots"
      ADD CONSTRAINT "metrics_snapshots_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
  END IF;
END $$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'growth_loop_runs_tenant_run_date_key'
      AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX "growth_loop_runs_tenant_run_date_key" ON "growth_loop_runs" ("tenant_id", "run_date");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'growth_loop_runs_tenant_id_fkey'
  ) THEN
    ALTER TABLE "growth_loop_runs"
      ADD CONSTRAINT "growth_loop_runs_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'growth_loop_runs_decision_memo_id_fkey'
  ) THEN
    ALTER TABLE "growth_loop_runs"
      ADD CONSTRAINT "growth_loop_runs_decision_memo_id_fkey"
      FOREIGN KEY ("decision_memo_id") REFERENCES "decision_memos"("id") ON DELETE SET NULL;
  END IF;
END $$;
