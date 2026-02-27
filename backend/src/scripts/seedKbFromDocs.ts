/**
 * KB Seed Script — Reads all markdown files from docs/kb/ and upserts them
 * into the kb_documents table. This keeps the seed in sync with the actual
 * documentation files rather than duplicating content inline.
 *
 * Run: cd backend && npx tsx src/scripts/seedKbFromDocs.ts
 */

import { readdir, readFile } from "fs/promises";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";
import { prisma } from "../db/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TENANT_ID =
  process.env.TENANT_ID?.trim() ||
  "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";
const SEED_CREATED_BY =
  process.env.SEED_CREATED_BY?.trim() ||
  "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

const KB_DOCS_DIR = join(__dirname, "../../../docs/kb");

/** Extract the first H1 heading as the title, fallback to slug */
function extractTitle(content: string, slug: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Map filename prefix to a category tag */
function categorize(slug: string): string {
  if (slug.startsWith("mba-")) return "mba";
  if (slug.startsWith("law-")) return "law";
  if (slug.startsWith("edu-")) return "education";
  if (slug.startsWith("adv-")) return "advanced";
  // Existing categories from the file content
  const categories: Record<string, string> = {
    "saas-metrics": "business",
    "small-business-pain-points": "business",
    "ai-employee-market-landscape": "business",
    "ecommerce-automation-playbook": "business",
    "freelancer-solopreneur-workflows": "business",
    "b2b-lead-generation": "business",
    "content-marketing-roi": "marketing",
    "customer-support-automation": "support",
    "financial-compliance-ai": "finance",
    "legal-ip-basics": "legal",
    "x-twitter-best-practices": "social-media",
    "facebook-business-strategy": "social-media",
    "linkedin-thought-leadership": "social-media",
    "tiktok-for-business": "social-media",
    "pinterest-traffic-strategy": "social-media",
    "reddit-community-marketing": "social-media",
    "blog-seo-content-strategy": "social-media",
    "emerging-platforms-strategy": "social-media",
    "daily-morning-brief-workflow": "workflows",
    "platform-intel-sweep": "workflows",
    "content-pipeline-lifecycle": "workflows",
    "customer-onboarding-automation": "workflows",
    "weekly-executive-summary": "workflows",
    "incident-response-workflow": "workflows",
    "budget-review-workflow": "workflows",
    "new-client-setup-workflow": "workflows",
    "vector-embeddings-rag-tuning": "technical",
    "agent-memory-architecture": "technical",
    "tool-calling-patterns": "technical",
    "rate-limiting-api-quotas": "technical",
    "webhook-integration-guide": "technical",
    "multi-model-routing": "technical",
    "real-time-agent-coordination": "technical",
    "atlas-ceo-playbook": "agent-playbook",
    "binky-cro-playbook": "agent-playbook",
    "cheryl-support-playbook": "agent-playbook",
    "sunday-writer-playbook": "agent-playbook",
    "mercer-acquisition-playbook": "agent-playbook",
    "petra-pm-playbook": "agent-playbook",
    "venny-victor-creative-playbook": "agent-playbook",
  };
  return categories[slug] || "general";
}

async function main() {
  console.log(`Reading KB docs from: ${KB_DOCS_DIR}`);

  let files: string[];
  try {
    files = (await readdir(KB_DOCS_DIR)).filter((f) => f.endsWith(".md"));
  } catch (err) {
    console.error(`Cannot read ${KB_DOCS_DIR}:`, err);
    process.exit(1);
  }

  console.log(`Found ${files.length} markdown files.`);
  console.log(`Tenant: ${TENANT_ID}\n`);

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const file of files.sort()) {
    const slug = basename(file, ".md");
    const filePath = join(KB_DOCS_DIR, file);
    const content = await readFile(filePath, "utf-8");
    const title = extractTitle(content, slug);
    const category = categorize(slug);

    try {
      const existing = await prisma.kbDocument.findUnique({
        where: { tenantId_slug: { tenantId: TENANT_ID, slug } },
        select: { id: true },
      });

      const tagConnect = {
        connectOrCreate: {
          where: { tenantId_name: { tenantId: TENANT_ID, name: category } },
          create: { tenantId: TENANT_ID, name: category },
        },
      };

      await prisma.kbDocument.upsert({
        where: { tenantId_slug: { tenantId: TENANT_ID, slug } },
        create: {
          tenantId: TENANT_ID,
          slug,
          title,
          body: content,
          status: "published",
          createdBy: SEED_CREATED_BY,
          tags: { create: { tag: tagConnect } },
        },
        update: {
          title,
          body: content,
          status: "published",
          updatedBy: SEED_CREATED_BY,
          tags: {
            deleteMany: {},
            create: { tag: tagConnect },
          },
        },
      });

      if (existing) {
        updated++;
        process.stdout.write("u");
      } else {
        created++;
        process.stdout.write("+");
      }
    } catch (err: any) {
      errors.push(`${slug}: ${err?.message ?? String(err)}`);
      process.stdout.write("x");
    }
  }

  console.log(
    `\n\nDone. Created: ${created}, Updated: ${updated}, Errors: ${errors.length}`
  );
  if (errors.length) {
    console.log("\nErrors:");
    for (const e of errors) console.log("  -", e);
  }

  const total = await prisma.kbDocument.count({
    where: { tenantId: TENANT_ID },
  });
  console.log(`\nTotal KB docs for tenant: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
