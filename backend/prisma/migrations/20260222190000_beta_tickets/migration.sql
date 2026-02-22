-- Beta Tickets (lightweight, traceable feedback)

-- Enums
CREATE TYPE "ticket_status" AS ENUM ('OPEN', 'TRIAGED', 'IN_PROGRESS', 'CLOSED');
CREATE TYPE "ticket_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'BLOCKER');
CREATE TYPE "ticket_category" AS ENUM ('BUG', 'UX', 'GUARDRAIL', 'PERFORMANCE', 'OTHER');

-- Tickets
CREATE TABLE "tickets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "reporter_user_id" uuid,
  "run_id" text,
  "agent" text,
  "status" "ticket_status" NOT NULL DEFAULT 'OPEN',
  "severity" "ticket_severity" NOT NULL DEFAULT 'MEDIUM',
  "category" "ticket_category" NOT NULL DEFAULT 'BUG',
  "title" text NOT NULL,
  "description" text,
  "meta" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT "tickets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "tickets_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL
);

-- Comments
CREATE TABLE "ticket_comments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "ticket_id" uuid NOT NULL,
  "author_user_id" uuid,
  "body" text NOT NULL,
  "meta" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ticket_comments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE,
  CONSTRAINT "ticket_comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL
);

-- Indexes
CREATE INDEX "tickets_tenant_time_idx" ON "tickets" ("tenant_id", "created_at" DESC);
CREATE INDEX "tickets_tenant_status_idx" ON "tickets" ("tenant_id", "status", "created_at" DESC);
CREATE INDEX "tickets_tenant_severity_idx" ON "tickets" ("tenant_id", "severity", "created_at" DESC);
CREATE INDEX "ticket_comments_ticket_time_idx" ON "ticket_comments" ("ticket_id", "created_at" ASC);
