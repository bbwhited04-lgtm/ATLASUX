import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const leads = await prisma.lead.findMany({ where: { source: "google_places" }, orderBy: { businessType: "asc" } });

for (const l of leads) {
  console.log(`${l.businessType.padEnd(15)} | ${l.name.padEnd(50)} | ${l.phone}`);
}
console.log(`\nTotal: ${leads.length}`);
await prisma.$disconnect();
