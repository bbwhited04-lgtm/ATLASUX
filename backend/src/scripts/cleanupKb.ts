/**
 * KB Cleanup Script — removes academic/PhD junk documents from the live database.
 *
 * These docs were seeded by seedPhD.ts, seedPhD2.ts, and seedKnowledge.ts
 * (now deleted). They are irrelevant academic content (robotics, quantum ML,
 * Porter's Five Forces, ADDIE instructional design, etc.) that pollutes the
 * KB RAG context and wastes tokens.
 *
 * Safe to run multiple times (idempotent — ignores slugs that don't exist).
 *
 * Run: npx tsx src/scripts/cleanupKb.ts
 */

import { prisma } from "../prisma.js";

const TENANT_ID = process.env.TENANT_ID?.trim() || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// ── Slugs to delete ────────────────────────────────────────────────────────────

const JUNK_SLUGS = [
  // ── seedPhD.ts — AI/ML/CS academic theory (irrelevant for social media agents) ──
  "ai-phd-search-reasoning",
  "ai-phd-multiagent-systems",
  "ai-phd-safety-alignment",
  "ml-phd-statistical-learning-theory",
  "ml-phd-deep-learning-architectures",
  "ml-phd-reinforcement-learning",
  "ml-phd-unsupervised-learning",
  "cs-phd-algorithms-complexity",
  "cs-phd-distributed-systems",
  "robotics-phd-slam-perception",
  "robotics-phd-control-theory",
  "eecs-phd-digital-signal-processing",
  "eecs-phd-vlsi-embedded",
  "genai-phd-diffusion-models",
  "genai-phd-gans-vaes",
  "xai-phd-explainability",
  "qml-phd-quantum-computing",
  "qml-phd-quantum-ml-algorithms",
  "nlp-phd-transformers-llms",
  "nlp-phd-rag-and-retrieval",
  "nlp-phd-nlp-fundamentals",

  // ── seedPhD2.ts junk section — autonomous systems, cognitive modeling, math ──
  "autonomous-systems-phd",
  "cognitive-modeling-phd",
  "math-linear-algebra-ml",
  "math-calculus-statistics",
  "philosophy-ai-mind",
  "biz-strategic-management",
  "biz-organizational-behavior",
  "biz-entrepreneurship-innovation",
  "biz-marketing-framework",
  "analytics-advanced-phd",

  // ── seedKnowledge.ts junk section — business school theory ──
  "biz-porters-five-forces",
  "biz-bcg-matrix",
  "biz-business-model-canvas",
  "biz-okr-framework",
  "biz-unit-economics",
  "biz-go-to-market",
  "biz-financial-basics",
  "biz-competitive-analysis",

  // ── seedKnowledge.ts junk section — HR academic frameworks ──
  "hr-hiring-framework",
  "hr-performance-management",
  "hr-compensation-benefits",
  "hr-employment-law-basics",
  "hr-onboarding",
  "hr-dei-framework",

  // ── seedKnowledge.ts junk section — education theory ──
  "edu-addie-instructional-design",
  "edu-blooms-taxonomy",
  "edu-kirkpatrick-evaluation",
  "edu-adult-learning-theory",
  "edu-curriculum-design",

  // ── seedKnowledge.ts junk section — generic infra (LLMs already know this) ──
  "infra-networking-fundamentals",
  "infra-cloud-architecture",
  "infra-security-fundamentals",
  "infra-devops-cicd",
  "infra-incident-response",
  "infra-api-design",
];

async function main() {
  console.log(`\n🧹 KB Cleanup — removing ${JUNK_SLUGS.length} junk documents from tenant ${TENANT_ID}\n`);

  let deleted  = 0;
  let notFound = 0;

  for (const slug of JUNK_SLUGS) {
    try {
      const doc = await prisma.kbDocument.findFirst({
        where: { tenantId: TENANT_ID, slug },
        select: { id: true, title: true },
      });

      if (!doc) {
        console.log(`  ⬜ not found:  ${slug}`);
        notFound++;
        continue;
      }

      // Delete tag links first, then the document
      await prisma.kbTagOnDocument.deleteMany({ where: { documentId: doc.id } });
      await prisma.kbDocumentVersion.deleteMany({ where: { documentId: doc.id } });
      await prisma.kbDocument.delete({ where: { id: doc.id } });

      console.log(`  ✅ deleted:    ${slug} — "${doc.title.slice(0, 60)}"`);
      deleted++;
    } catch (err: any) {
      console.error(`  ❌ error on ${slug}: ${err?.message}`);
    }
  }

  console.log(`\nDone. Deleted: ${deleted} | Not found: ${notFound} | Total processed: ${JUNK_SLUGS.length}\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
