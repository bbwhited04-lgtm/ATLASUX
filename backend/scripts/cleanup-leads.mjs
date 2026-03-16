import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BAD_PATTERNS = /church|union|apprentice|baptist|pediatr|dentist|doctor|clinic|hospital|school|medical|veterinar|funeral|cemetery|government|library|museum|fire.?department|police/i;

const leads = await prisma.lead.findMany({ where: { source: "google_places" } });
const bad = leads.filter((l) => BAD_PATTERNS.test(`${l.name} ${l.message} ${l.businessName}`));

console.log(`Found ${bad.length} bad leads to remove:\n`);
for (const l of bad) {
  console.log(`  x ${l.businessType} | ${l.name} | ${l.phone}`);
  await prisma.lead.delete({ where: { id: l.id } });
}

console.log(`\nDeleted ${bad.length} leads. ${leads.length - bad.length} remain.`);
await prisma.$disconnect();
