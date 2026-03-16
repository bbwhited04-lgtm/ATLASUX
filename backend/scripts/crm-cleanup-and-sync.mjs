import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID?.trim() || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// Businesses we do NOT want Mercer calling
const EXCLUDE = /pediatr|dentist|orthodon|doctor|physician|medical|clinic|hospital|urgent.?care|veterinar|animal|funeral|cemetery|mortuar|government|library|museum|fire.?dep|police|sheriff|school|university|college|daycare|preschool|church|temple|mosque|synagogue|ministry|baptist|methodist|lutheran|catholic|presbyter|insurance|bank|credit.?union|accounting|attorney|law.?firm|legal|realtor|real.?estate/i;

// ── Step 1: Clean junk from CrmCompany ──────────────────────────────────────

console.log("=== Step 1: Cleaning CRM companies ===\n");

const companies = await prisma.crmCompany.findMany({
  where: { tenantId: TENANT_ID },
  select: { id: true, name: true, industry: true, phone: true, notes: true },
});

const toDelete = companies.filter((c) =>
  EXCLUDE.test(`${c.name} ${c.industry || ""} ${c.notes || ""}`)
);

for (const c of toDelete) {
  console.log(`  x ${c.name} (${c.industry || "no industry"}) ${c.phone || ""}`);
  await prisma.crmCompany.delete({ where: { id: c.id } });
}
console.log(`\nDeleted ${toDelete.length} non-target companies. ${companies.length - toDelete.length} remain.\n`);

// ── Step 2: Clean junk from CrmContact ──────────────────────────────────────

console.log("=== Step 2: Cleaning CRM contacts ===\n");

const contacts = await prisma.crmContact.findMany({
  where: { tenantId: TENANT_ID },
  select: { id: true, firstName: true, lastName: true, phone: true, source: true },
});

const contactsToDelete = contacts.filter((c) =>
  EXCLUDE.test(`${c.firstName || ""} ${c.lastName || ""} ${c.source || ""}`)
);

for (const c of contactsToDelete) {
  console.log(`  x ${c.firstName} ${c.lastName} (${c.source || ""}) ${c.phone || ""}`);
  await prisma.crmContact.delete({ where: { id: c.id } });
}
console.log(`\nDeleted ${contactsToDelete.length} non-target contacts. ${contacts.length - contactsToDelete.length} remain.\n`);

// ── Step 3: Sync leads → CrmCompany ─────────────────────────────────────────

console.log("=== Step 3: Syncing Google Places leads → CRM ===\n");

const leads = await prisma.lead.findMany({
  where: { source: "google_places" },
});

// Get existing CRM phones to skip dupes
const existingPhones = new Set(
  (await prisma.crmCompany.findMany({
    where: { tenantId: TENANT_ID, phone: { not: null } },
    select: { phone: true },
  })).map((c) => c.phone?.replace(/\D/g, "").slice(-10))
);

let synced = 0;
let skipped = 0;

for (const lead of leads) {
  // Skip non-target leads
  if (EXCLUDE.test(`${lead.name} ${lead.businessType || ""} ${lead.message || ""}`)) {
    skipped++;
    continue;
  }

  const normalized = lead.phone.replace(/\D/g, "").slice(-10);
  if (existingPhones.has(normalized)) {
    skipped++;
    continue;
  }

  // Extract address and website from message field
  const parts = (lead.message || "").split(" | ");
  const address = parts[0] || null;
  const website = parts.find((p) => p.startsWith("Web: "))?.replace("Web: ", "") || null;
  const rating = parts.find((p) => p.startsWith("Rating: ")) || null;

  await prisma.crmCompany.create({
    data: {
      tenantId: TENANT_ID,
      name: lead.businessName || lead.name,
      phone: lead.phone,
      industry: lead.businessType || null,
      address,
      website,
      contactName: lead.name,
      notes: [
        `Source: Google Places prospect`,
        rating,
        `Imported: ${new Date().toISOString().split("T")[0]}`,
      ].filter(Boolean).join(" | "),
    },
  });

  existingPhones.add(normalized);
  console.log(`  + ${lead.businessName || lead.name} (${lead.businessType}) ${lead.phone}`);
  synced++;
}

console.log(`\nSynced ${synced} leads to CRM. ${skipped} skipped (dupes or excluded).\n`);

// ── Step 4: Post summary to Slack ───────────────────────────────────────────

const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_LEADS_CHANNEL_ID;
if (token && channel) {
  const msg = [
    `:broom: *CRM Cleanup Complete*`,
    ``,
    `\u2022 Removed *${toDelete.length}* junk companies (medical, churches, unions, etc.)`,
    `\u2022 Removed *${contactsToDelete.length}* junk contacts`,
    `\u2022 Synced *${synced}* Google Places prospects into CRM`,
    ``,
    `Mercer's dialer queue is clean and loaded. :fire:`,
  ].join("\n");

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ channel, text: msg, username: "Atlas", icon_emoji: ":earth_americas:", unfurl_links: false }),
  });
  const data = await res.json();
  console.log("Slack:", data.ok ? "posted cleanup summary" : data.error);
}

await prisma.$disconnect();
