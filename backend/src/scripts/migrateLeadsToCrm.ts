/**
 * migrateLeadsToCrm.ts — Copy leads into crm_contacts + crm_companies tables.
 *
 * The `leads` table is a public capture table (no tenant_id).
 * The CRM UI reads from `crm_contacts` (tenant-scoped).
 * This script bridges the gap by copying leads → crm_contacts.
 *
 * Run:  npx tsx src/scripts/migrateLeadsToCrm.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

async function main() {
  console.log("[migrateLeadsToCrm] Reading leads table...");

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  console.log(`  Found ${leads.length} leads`);

  if (!leads.length) {
    console.log("  Nothing to migrate.");
    await prisma.$disconnect();
    return;
  }

  let contactsCreated = 0;
  let contactsSkipped = 0;
  let companiesCreated = 0;
  const seenCompanies = new Set<string>();

  for (const lead of leads) {
    // Skip if already exists in crm_contacts by email or phone
    if (lead.email) {
      const existing = await prisma.crmContact.findFirst({
        where: { tenantId: TENANT_ID, email: lead.email },
      });
      if (existing) {
        contactsSkipped++;
        continue;
      }
    }

    // Parse name into first/last
    const nameParts = (lead.name ?? "").trim().split(/\s+/);
    const firstName = nameParts[0] || null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    await prisma.crmContact.create({
      data: {
        tenantId: TENANT_ID,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        company: lead.businessName || undefined,
        source: lead.source ?? "lead_import",
        notes: lead.message || undefined,
        tags: lead.businessType ? [lead.businessType] : [],
      },
    });
    contactsCreated++;

    // Auto-create company if businessName exists
    const biz = lead.businessName?.trim();
    if (biz && !seenCompanies.has(biz.toLowerCase())) {
      seenCompanies.add(biz.toLowerCase());

      const existingCompany = await prisma.crmCompany.findFirst({
        where: { tenantId: TENANT_ID, name: { equals: biz, mode: "insensitive" } },
      });

      if (!existingCompany) {
        await prisma.crmCompany.create({
          data: {
            tenantId: TENANT_ID,
            name: biz,
            phone: lead.phone || undefined,
            notes: lead.message || undefined,
          },
        });
        companiesCreated++;
      }
    }
  }

  const totalContacts = await prisma.crmContact.count({ where: { tenantId: TENANT_ID } });
  const totalCompanies = await prisma.crmCompany.count({ where: { tenantId: TENANT_ID } });

  console.log(`\n[migrateLeadsToCrm] Done`);
  console.log(`  Contacts: ${contactsCreated} created, ${contactsSkipped} skipped (duplicate)`);
  console.log(`  Companies: ${companiesCreated} created`);
  console.log(`  Total in DB: ${totalContacts} contacts, ${totalCompanies} companies`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[migrateLeadsToCrm] Fatal:", err);
  process.exit(1);
});
