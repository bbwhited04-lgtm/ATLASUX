/**
 * One-time migration: encrypt all existing plaintext tokens.
 *
 * Reads TOKEN_ENCRYPTION_KEY from env. If not set, exits with error.
 * Encrypts access_token and refresh_token in both:
 *   - Supabase `token_vault` table
 *   - Prisma `integrations` table
 *
 * Safe to run multiple times — skips already-encrypted values.
 *
 * Usage:
 *   TOKEN_ENCRYPTION_KEY=<64-hex-chars> npx tsx src/scripts/encryptExistingTokens.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { encryptToken, isEncrypted } from "../lib/encryption.js";

const KEY = process.env.TOKEN_ENCRYPTION_KEY;
if (!KEY) {
  console.error("TOKEN_ENCRYPTION_KEY is required. Set it in your environment.");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const prisma = new PrismaClient({ log: ["error"] });

async function migrateTokenVault() {
  console.log("Migrating token_vault...");
  const { data: rows, error } = await supabase
    .from("token_vault")
    .select("org_id, user_id, provider, access_token, refresh_token");

  if (error) {
    console.error("Failed to read token_vault:", error.message);
    return;
  }
  if (!rows?.length) {
    console.log("  No rows in token_vault.");
    return;
  }

  let updated = 0;
  for (const row of rows) {
    const updates: Record<string, string> = {};
    if (row.access_token && !isEncrypted(row.access_token)) {
      updates.access_token = encryptToken(row.access_token, KEY);
    }
    if (row.refresh_token && !isEncrypted(row.refresh_token)) {
      updates.refresh_token = encryptToken(row.refresh_token, KEY);
    }
    if (Object.keys(updates).length === 0) continue;

    updates.updated_at = new Date().toISOString();
    const { error: ue } = await supabase
      .from("token_vault")
      .update(updates)
      .eq("org_id", row.org_id)
      .eq("user_id", row.user_id)
      .eq("provider", row.provider);

    if (ue) {
      console.error(`  Failed to update ${row.provider} for org ${row.org_id}: ${ue.message}`);
    } else {
      updated++;
    }
  }
  console.log(`  token_vault: ${updated}/${rows.length} rows encrypted.`);
}

async function migrateIntegrations() {
  console.log("Migrating integrations table...");
  const rows = await prisma.integration.findMany({
    where: {
      OR: [
        { access_token: { not: null } },
        { refresh_token: { not: null } },
      ],
    },
    select: { id: true, access_token: true, refresh_token: true },
  });

  if (!rows.length) {
    console.log("  No integrations with tokens.");
    return;
  }

  let updated = 0;
  for (const row of rows) {
    const data: Record<string, any> = {};
    if (row.access_token && !isEncrypted(row.access_token)) {
      data.access_token = encryptToken(row.access_token, KEY);
    }
    if (row.refresh_token && !isEncrypted(row.refresh_token)) {
      data.refresh_token = encryptToken(row.refresh_token, KEY);
    }
    if (Object.keys(data).length === 0) continue;

    await prisma.integration.update({ where: { id: row.id }, data });
    updated++;
  }
  console.log(`  integrations: ${updated}/${rows.length} rows encrypted.`);
}

async function main() {
  await migrateTokenVault();
  await migrateIntegrations();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
