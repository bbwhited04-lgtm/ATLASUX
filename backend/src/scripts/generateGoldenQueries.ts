/**
 * Generate golden evaluation queries from existing KB documents.
 * Run: cd backend && npx tsx src/scripts/generateGoldenQueries.ts [--auto-approve]
 */
import { generateCandidateQueries, approveAllCandidates, checkCoverage } from "../core/kb/kbGoldenDataset.js";
import { prisma } from "../db/prisma.js";

const AUTO_APPROVE = process.argv.includes("--auto-approve");

async function main() {
  console.log("Generating golden evaluation queries from KB...\n");

  const generated = await generateCandidateQueries();
  console.log(`Generated ${generated} candidate queries.\n`);

  if (AUTO_APPROVE && generated > 0) {
    const approved = await approveAllCandidates();
    console.log(`Auto-approved ${approved} queries.\n`);
  }

  const coverage = await checkCoverage();
  console.log(`Total golden queries: ${coverage.total}`);

  if (coverage.gaps.length > 0) {
    console.log(`\nCoverage gaps (below minimum):`);
    for (const gap of coverage.gaps) {
      console.log(`  ${gap.dimension}/${gap.name}: ${gap.count}/${gap.min}`);
    }
  } else {
    console.log("Coverage: all categories, tiers, and sources meet minimum thresholds.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
