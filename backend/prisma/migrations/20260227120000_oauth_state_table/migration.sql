-- CreateTable
CREATE TABLE IF NOT EXISTS "oauth_state" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "oauth_state_pkey" PRIMARY KEY ("key")
);

-- CreateIndex (for cleanup queries)
CREATE INDEX IF NOT EXISTS "oauth_state_expires_at_idx" ON "oauth_state"("expires_at");
