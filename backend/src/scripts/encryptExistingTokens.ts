/**
 * One-time migration: encrypt all existing plaintext tokens.
 *
 * Reads TOKEN_ENCRYPTION_KEY from env. If not set, exits with error.
 * Encrypts access_token and refresh_token in both:
 *   - `token_vault` table (via raw SQL)
 *   - `integrations` table (via Prisma)
 *
 * Safe to run multiple times — skips already-encrypted values.
 *
 * Usage:
 *   TOKEN_ENCRYPTION_KEY=<64-hex-chars> npx tsx src/scripts/encryptExistingTokens.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { encryptToken, isEncrypted } from "../lib/encryption.js";

const KEY = process.env.TOKEN_ENCRYPTION_KEY;
if (!KEY) {
  console.error("TOKEN_ENCRYPTION_KEY is required. Set it in your environment.");
  process.exit(1);
}

const prisma = new PrismaClient({ log: ["error"] });

async function migrateTokenVault() {
  console.log("Migrating token_vault...");

  const rows = await prisma.$queryRaw<
    Array<{ org_id: string; user_id: string; provider: string; access_token: string | null; refresh_token: string | null }>
  >`SELECT org_id, user_id, provider, access_token, refresh_token FROM token_vault`.catch(() => []);

  if (!rows?.length) {
    console.log("  No rows in token_vault.");
    return;
  }

  let updated = 0;
  for (const row of rows) {
    let newAccess: string | null = null;
    let newRefresh: string | null = null;

    if (row.access_token && !isEncrypted(row.access_token)) {
      newAccess = encryptToken(row.access_token, KEY!);
    }
    if (row.refresh_token && !isEncrypted(row.refresh_token)) {
      newRefresh = encryptToken(row.refresh_token, KEY!);
    }
    if (!newAccess && !newRefresh) continue;

    try {
      if (newAccess && newRefresh) {
        await prisma.$executeRaw`
          UPDATE token_vault
          SET access_token = ${newAccess}, refresh_token = ${newRefresh}, updated_at = NOW()
          WHERE org_id = ${row.org_id} AND user_id = ${row.user_id} AND provider = ${row.provider}
        `;
      } else if (newAccess) {
        await prisma.$executeRaw`
          UPDATE token_vault
          SET access_token = ${newAccess}, updated_at = NOW()
          WHERE org_id = ${row.org_id} AND user_id = ${row.user_id} AND provider = ${row.provider}
        `;
      } else if (newRefresh) {
        await prisma.$executeRaw`
          UPDATE token_vault
          SET refresh_token = ${newRefresh}, updated_at = NOW()
          WHERE org_id = ${row.org_id} AND user_id = ${row.user_id} AND provider = ${row.provider}
        `;
      }
      updated++;
    } catch (e: any) {
      console.error(`  Failed to update ${row.provider} for org ${row.org_id}: ${e.message}`);
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
      data.access_token = encryptToken(row.access_token, KEY!);
    }
    if (row.refresh_token && !isEncrypted(row.refresh_token)) {
      data.refresh_token = encryptToken(row.refresh_token, KEY!);
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
