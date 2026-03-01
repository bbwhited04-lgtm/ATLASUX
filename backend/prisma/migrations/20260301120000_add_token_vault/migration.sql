-- CreateTable
CREATE TABLE IF NOT EXISTS "token_vault" (
  "id"            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "org_id"        UUID NOT NULL,
  "user_id"       UUID NOT NULL,
  "provider"      TEXT NOT NULL,
  "access_token"  TEXT NOT NULL,
  "refresh_token" TEXT,
  "expires_at"    TEXT,
  "scope"         TEXT,
  "meta"          JSONB,
  "updated_at"    TIMESTAMPTZ(6) DEFAULT now() NOT NULL,
  UNIQUE("org_id", "user_id", "provider")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "token_vault_org_id_provider_idx" ON "token_vault" ("org_id", "provider");
