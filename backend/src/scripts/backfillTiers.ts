/**
 * Backfill KbDocument tier + category for existing docs.
 * Ensures EVERY doc gets a category — no orphans allowed.
 * Run: cd backend && npx tsx src/scripts/backfillTiers.ts
 */
import { prisma } from "../db/prisma.js";

const INTERNAL_SLUGS = ["atlas-policy", "soul-lock", "audit-", "agent-comms", "social-", "intel-"];
const PUBLIC_SLUGS = ["atlas-wf-"];
const PUBLIC_TAGS = new Set(["video-gen", "image-gen", "support", "atlas-workflow"]);

// Keyword → category mapping for docs without tags or slug paths
const KEYWORD_CATEGORIES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ["saas", "metrics", "revenue", "churn", "mrr", "arpu"], category: "business" },
  { keywords: ["lead", "prospect", "funnel", "conversion", "outbound"], category: "business" },
  { keywords: ["ecommerce", "store", "product", "shopify", "cart"], category: "business" },
  { keywords: ["freelance", "solopreneur", "contractor", "gig"], category: "business" },
  { keywords: ["seo", "content", "blog", "marketing", "brand"], category: "marketing" },
  { keywords: ["twitter", "x.com", "facebook", "linkedin", "tiktok", "pinterest", "reddit", "instagram"], category: "social-media" },
  { keywords: ["support", "help", "ticket", "customer service", "faq"], category: "support" },
  { keywords: ["finance", "compliance", "accounting", "invoice", "billing"], category: "finance" },
  { keywords: ["legal", "trademark", "ip", "patent", "copyright"], category: "legal" },
  { keywords: ["workflow", "automation", "pipeline", "schedule", "cron"], category: "workflows" },
  { keywords: ["embedding", "vector", "rag", "llm", "prompt", "model"], category: "technical" },
  { keywords: ["api", "webhook", "endpoint", "route", "integration"], category: "technical" },
  { keywords: ["agent", "playbook", "persona", "role", "tool-calling"], category: "agent-playbook" },
  { keywords: ["voice", "call", "phone", "twilio", "elevenlabs", "speech"], category: "voice" },
  { keywords: ["video", "youtube", "shorts", "clip", "render"], category: "video" },
  { keywords: ["image", "photo", "generate", "dall-e", "midjourney", "flux"], category: "image" },
  { keywords: ["email", "smtp", "newsletter", "outreach"], category: "email" },
  { keywords: ["slack", "notification", "alert", "messaging"], category: "notifications" },
  { keywords: ["math", "theorem", "proof", "algebra", "calculus"], category: "hle-mathematics" },
  { keywords: ["physics", "quantum", "thermodynamic", "mechanics"], category: "hle-physics" },
  { keywords: ["biology", "medicine", "clinical", "gene", "cell"], category: "hle-biology-medicine" },
  { keywords: ["chemistry", "molecule", "reaction", "compound"], category: "hle-chemistry" },
];

function inferCategoryFromContent(slug: string, title: string, body: string | null): string {
  const searchText = `${slug} ${title} ${(body ?? "").slice(0, 2000)}`.toLowerCase();
  let bestCategory = "general";
  let bestScore = 0;

  for (const { keywords, category } of KEYWORD_CATEGORIES) {
    const score = keywords.filter(kw => searchText.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Slug prefix fallback
  if (bestScore === 0) {
    const slugBase = slug.split("-").slice(0, 2).join("-");
    if (slugBase.length > 3) bestCategory = slugBase;
  }

  return bestCategory;
}

async function main() {
  console.log("Backfilling KbDocument tier + category (zero-orphan mode)...");

  const docs = await prisma.kbDocument.findMany({
    select: { id: true, slug: true, title: true, body: true, tags: { include: { tag: true } } },
  });

  let internal = 0, pub = 0, tenant = 0, orphansRescued = 0;

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

    // Derive category — multiple strategies, never leave null
    let category: string | null = null;

    // Strategy 1: First meaningful tag
    if (tagNames.length > 0) {
      category = tagNames.find(t => t !== "general") ?? null;
    }

    // Strategy 2: Slug path prefix
    if (!category && doc.slug.includes("/")) {
      const parts = doc.slug.split("/");
      category = parts.slice(0, -1).join("/");
    }

    // Strategy 3: Keyword inference from slug + title + body
    if (!category || category === "general") {
      const inferred = inferCategoryFromContent(doc.slug, doc.title, doc.body);
      if (inferred !== "general" || !category) {
        category = inferred;
        orphansRescued++;
      }
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
  console.log(`Orphans rescued via keyword inference: ${orphansRescued}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
