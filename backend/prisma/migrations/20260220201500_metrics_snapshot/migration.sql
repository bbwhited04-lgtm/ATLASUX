-- CreateTable
CREATE TABLE "metrics_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "metrics_snapshots_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "metrics_snapshots_tenant_id_date_idx" ON "metrics_snapshots"("tenant_id", "date");

-- Unique
CREATE UNIQUE INDEX "metrics_snapshots_tenant_id_date_key" ON "metrics_snapshots"("tenant_id", "date");

-- FK
ALTER TABLE "metrics_snapshots" ADD CONSTRAINT "metrics_snapshots_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant_id"("id") ON DELETE CASCADE ON UPDATE CASCADE;
