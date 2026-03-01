-- Session termination: revoked token blacklist
-- Controls: HIPAA §164.312(d), NIST IA-11, SOC 2 CC6.1, ISO A.9.4.2, PCI 8.1.8, HITRUST 01.b

CREATE TABLE "revoked_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "token_hash" TEXT NOT NULL,
  "revoked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "revoked_tokens_token_hash_key" ON "revoked_tokens" ("token_hash");
CREATE INDEX "revoked_tokens_expires_at_idx" ON "revoked_tokens" ("expires_at");
