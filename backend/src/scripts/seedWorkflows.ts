/**
 * seedWorkflows.ts — Sync the `workflows` table from workflowCatalog.
 *
 * Upserts every entry from workflowCatalog into the DB.
 * Requires agents to be seeded first (FK on agent_key).
 *
 * Run:  npx tsx src/scripts/seedWorkflows.ts
 */

import { PrismaClient } from "@prisma/client";
import { workflowCatalog } from "../workflows/registry.js";

const prisma = new PrismaClient();

async function main() {
  console.log(`[seedWorkflows] Syncing ${workflowCatalog.length} workflows to DB`);

  // Get existing agent keys for FK validation
  const agents = await prisma.agents.findMany({ select: { agent_key: true } });
  const agentKeys = new Set(agents.map((a) => a.agent_key));

  let upserted = 0;
  let skipped = 0;

  for (const wf of workflowCatalog) {
    const agentKey = wf.ownerAgent;

    if (!agentKeys.has(agentKey)) {
      console.log(`  ⚠ ${wf.id} — agent '${agentKey}' not in DB, skipping`);
      skipped++;
      continue;
    }

    await prisma.workflows.upsert({
      where: { workflow_key: wf.id },
      create: {
        workflow_key: wf.id,
        workflow_id: wf.id,
        agent_key: agentKey,
        name: wf.name,
        version: "1",
        status: "active",
        enabled: true,
      },
      update: {
        agent_key: agentKey,
        name: wf.name,
        status: "active",
        enabled: true,
      },
    });

    upserted++;
    console.log(`  ✓ ${wf.id.padEnd(8)} ${wf.name.slice(0, 60)}`);
  }

  const total = await prisma.workflows.count();
  console.log(`\n[seedWorkflows] Done — ${upserted} upserted, ${skipped} skipped, ${total} total in DB`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[seedWorkflows] Fatal:", err);
  process.exit(1);
});
