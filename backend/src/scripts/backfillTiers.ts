/**
 * Backfill KbDocument tier + category for existing docs.
 * Run: cd backend && npx tsx src/scripts/backfillTiers.ts
 */
import { prisma } from "../db/prisma.js";

const INTERNAL_SLUGS = ["atlas-policy", "soul-lock", "audit-", "agent-comms", "social-", "intel-"];
const PUBLIC_SLUGS = ["atlas-wf-"];
const PUBLIC_TAGS = new Set(["video-gen", "image-gen", "support", "atlas-workflow"]);

async function main() {
  console.log("Backfilling KbDocument tier + category...");

  const docs = await prisma.kbDocument.findMany({
    select: { id: true, slug: true, tags: { include: { tag: true } } },
  });

  let internal = 0, pub = 0, tenant = 0;

  for (const doc of docs) {
    let tier: "public" | "internal" | "tenant" = "tenant";
    const tagNames = doc.tags.map(t => t.tag.name.toLowerCase());

    // Internal tier — governance/policy docs
    if (INTERNAL_SLUGS.some(p => doc.slug.startsWith(p))) {
      tier = "internal";
    }
    // Public tier — workflow definitions
    else if (PUBLIC_SLUGS.some(p => doc.slug.startsWith(p))) {
      tier = "public";
    }
    // Public tier — tagged with known public categories
    else if (tagNames.some(t =>
      PUBLIC_TAGS.has(t) || t.startsWith("hle-")
    )) {
      tier = "public";
    }
    // Agent-scoped = tenant
    else if (doc.slug.startsWith("agent/")) {
      tier = "tenant";
    }

    // Derive category from first meaningful tag or slug path
    let category: string | null = null;
    if (tagNames.length > 0) {
      category = tagNames.find(t => t !== "general") ?? tagNames[0];
    }
    if (!category && doc.slug.includes("/")) {
      const parts = doc.slug.split("/");
      category = parts.slice(0, -1).join("/");
    }

    await prisma.kbDocument.update({
      where: { id: doc.id },
      data: { tier: tier as any, category },
    });

    if (tier === "internal") internal++;
    else if (tier === "public") pub++;
    else tenant++;
  }

  console.log(`\nBackfill complete: ${pub} public, ${internal} internal, ${tenant} tenant (${docs.length} total)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
