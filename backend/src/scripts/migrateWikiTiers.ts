/**
 * Add tier, tosAcceptedAt columns to wiki_api_keys + create wiki_key_credentials table.
 * Run on prod: npx tsx src/scripts/migrateWikiTiers.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Add tier column (default 'free')
  await prisma.$executeRawUnsafe(`
    ALTER TABLE wiki_api_keys
    ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
  `);

  // Add tos_accepted_at column
  await prisma.$executeRawUnsafe(`
    ALTER TABLE wiki_api_keys
    ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ
  `);

  // Update existing keys: set rate_limit to 10 for free tier (were 60)
  await prisma.$executeRawUnsafe(`
    UPDATE wiki_api_keys SET rate_limit = 10 WHERE tier = 'free' AND rate_limit > 10
  `);

  // Create wiki_key_credentials table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS wiki_key_credentials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wiki_key_id UUID NOT NULL REFERENCES wiki_api_keys(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      label TEXT,
      encrypted_key TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(wiki_key_id, platform)
    )
  `);

  // Index
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_wiki_key_credentials_wiki_key_id ON wiki_key_credentials(wiki_key_id)
  `);

  console.log("Migration complete: wiki tiers + credentials table created.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
