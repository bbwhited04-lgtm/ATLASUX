-- Phase 1: Per-User Identity ────────────────────────────────────────────────

-- Global users table (cross-tenant identity)
CREATE TABLE IF NOT EXISTS "users" (
    "id"           UUID PRIMARY KEY,
    "email"        TEXT NOT NULL UNIQUE,
    "display_name" TEXT,
    "avatar_url"   TEXT,
    "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

-- Seat type enum
DO $$ BEGIN
  CREATE TYPE "seat_type" AS ENUM ('free_beta', 'starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add seat_type column to tenant_members
ALTER TABLE "tenant_members"
  ADD COLUMN IF NOT EXISTS "seat_type" "seat_type" NOT NULL DEFAULT 'free_beta';

-- Add FK from tenant_members.user_id → users.id (nullable — existing rows may not have a users record yet)
-- We use IF NOT EXISTS pattern to be idempotent
DO $$ BEGIN
  ALTER TABLE "tenant_members"
    ADD CONSTRAINT "tenant_members_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Phase 2: Usage Metering ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "usage_meters" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"       UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "tenant_id"     UUID NOT NULL,
    "period"        TEXT NOT NULL,                     -- "2026-02" format
    "tokens_used"   BIGINT NOT NULL DEFAULT 0,
    "api_calls"     INT NOT NULL DEFAULT 0,
    "jobs_created"  INT NOT NULL DEFAULT 0,
    "storage_bytes" BIGINT NOT NULL DEFAULT 0,
    "updated_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    UNIQUE("user_id", "tenant_id", "period")
);

CREATE INDEX IF NOT EXISTS "usage_meters_user_tenant_idx"
  ON "usage_meters" ("user_id", "tenant_id");

-- Phase 3: Billing & Seats ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id"                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"                  UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "tenant_id"                UUID NOT NULL,
    "seat_type"                "seat_type" NOT NULL DEFAULT 'free_beta',
    "stripe_customer_id"       TEXT,
    "stripe_subscription_id"   TEXT,
    "status"                   TEXT NOT NULL DEFAULT 'active',
    "current_period_start"     TIMESTAMPTZ(6),
    "current_period_end"       TIMESTAMPTZ(6),
    "canceled_at"              TIMESTAMPTZ(6),
    "created_at"               TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"               TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    UNIQUE("user_id", "tenant_id")
);

CREATE INDEX IF NOT EXISTS "subscriptions_tenant_idx"
  ON "subscriptions" ("tenant_id");

CREATE INDEX IF NOT EXISTS "subscriptions_stripe_customer_idx"
  ON "subscriptions" ("stripe_customer_id");
