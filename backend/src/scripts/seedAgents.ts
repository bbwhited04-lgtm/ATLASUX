/**
 * seedAgents.ts — Sync the `agents` + `agent_inboxes` tables from the registry.
 *
 * What it does:
 *   1. Deletes the stale `atlas_ceo` duplicate (keeps `atlas`).
 *   2. Upserts every agent from agentRegistry into the `agents` table.
 *   3. Upserts primary inbox rows in `agent_inboxes`.
 *   4. Upserts `atlas_agents` rows (agent_doc JSON).
 *
 * Run:  npx tsx src/scripts/seedAgents.ts
 */

import { PrismaClient } from "@prisma/client";
import { agentRegistry } from "../agents/registry.js";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

/** Map agent id → email from env vars (AGENT_EMAIL_ATLAS, etc.) */
function agentEmail(id: string): string | null {
  const key = `AGENT_EMAIL_${id.toUpperCase().replace(/-/g, "_")}`;
  return process.env[key]?.trim() || null;
}

async function main() {
  console.log(`[seedAgents] Syncing ${agentRegistry.length} agents to DB (tenant ${TENANT_ID})`);

  // ── 1. Delete stale atlas_ceo duplicate ─────────────────────────────────
  const deleted = await prisma.agents.deleteMany({ where: { agent_key: "atlas_ceo" } });
  if (deleted.count > 0) console.log(`[seedAgents] Deleted stale 'atlas_ceo' row`);

  // Also clean atlas_agents table
  await prisma.atlas_agents.deleteMany({ where: { agent_key: "atlas_ceo" } }).catch(() => null);

  // ── 2. Upsert agents ───────────────────────────────────────────────────
  for (const agent of agentRegistry) {
    const email = agentEmail(agent.id);

    await prisma.agents.upsert({
      where: { agent_key: agent.id },
      create: {
        agent_key: agent.id,
        display_name: agent.name,
        staff_role: agent.title,
        description: agent.summary,
        truth_required: true,
        advisory_only: agent.tier === "Board",
        can_block: agent.tier === "Governor" || agent.tier === "Board",
        tools_allowed: agent.toolsAllowed ?? [],
        tools_restricted: agent.toolsForbidden ?? [],
        metadata: {
          tier: agent.tier,
          reportsTo: agent.reportsTo ?? null,
          email: email ?? null,
          escalationTargets: agent.escalationTargets ?? [],
          m365Tools: agent.m365Tools ?? [],
          deepMode: agent.deepMode ?? false,
        },
      },
      update: {
        display_name: agent.name,
        staff_role: agent.title,
        description: agent.summary,
        tools_allowed: agent.toolsAllowed ?? [],
        tools_restricted: agent.toolsForbidden ?? [],
        metadata: {
          tier: agent.tier,
          reportsTo: agent.reportsTo ?? null,
          email: email ?? null,
          escalationTargets: agent.escalationTargets ?? [],
          m365Tools: agent.m365Tools ?? [],
          deepMode: agent.deepMode ?? false,
        },
      },
    });

    // ── 3. Upsert primary inbox ──────────────────────────────────────────
    if (email) {
      await prisma.agent_inboxes.upsert({
        where: { agent_key_inbox_email: { agent_key: agent.id, inbox_email: email } },
        create: {
          agent_key: agent.id,
          inbox_email: email,
          inbox_type: "primary",
          audit_required: true,
          operator_access: ["billy", "atlas"],
        },
        update: {
          inbox_type: "primary",
          audit_required: true,
        },
      });
    }

    // ── 4. Upsert atlas_agents (agent_doc JSON) ─────────────────────────
    await prisma.atlas_agents.upsert({
      where: { agent_key: agent.id },
      create: {
        agent_key: agent.id,
        agent_doc: {
          id: agent.id,
          name: agent.name,
          title: agent.title,
          tier: agent.tier,
          reportsTo: agent.reportsTo ?? null,
          summary: agent.summary,
          email: email ?? null,
          toolsAllowed: agent.toolsAllowed ?? [],
          toolsForbidden: agent.toolsForbidden ?? [],
          m365Tools: agent.m365Tools ?? [],
          escalationTargets: agent.escalationTargets ?? [],
          deepMode: agent.deepMode ?? false,
        },
      },
      update: {
        agent_doc: {
          id: agent.id,
          name: agent.name,
          title: agent.title,
          tier: agent.tier,
          reportsTo: agent.reportsTo ?? null,
          summary: agent.summary,
          email: email ?? null,
          toolsAllowed: agent.toolsAllowed ?? [],
          toolsForbidden: agent.toolsForbidden ?? [],
          m365Tools: agent.m365Tools ?? [],
          escalationTargets: agent.escalationTargets ?? [],
          deepMode: agent.deepMode ?? false,
        },
      },
    });

    console.log(`  ✓ ${agent.id.padEnd(14)} ${agent.name.padEnd(14)} ${agent.title.slice(0, 50)}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────
  const finalCount = await prisma.agents.count();
  const inboxCount = await prisma.agent_inboxes.count();
  console.log(`\n[seedAgents] Done — ${finalCount} agents, ${inboxCount} inboxes in DB`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[seedAgents] Fatal:", err);
  process.exit(1);
});
