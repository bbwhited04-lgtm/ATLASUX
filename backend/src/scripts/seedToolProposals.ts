/**
 * seedToolProposals.ts — Rebuild the tool_proposals table from agent registry.
 *
 * Sources:
 *   1. agentRegistry[].toolsAllowed — agent-level tool names
 *   2. agentRegistry[].m365Tools    — M365 tool IDs per agent
 *   3. M365_TOOLS catalog           — M365 tool definitions (name, purpose)
 *   4. ALL_TOOLS (modular registry)  — code-based tools (15)
 *
 * All tools are inserted as status="approved" with decidedBy="seed_restore".
 *
 * Run:  npx tsx src/scripts/seedToolProposals.ts
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { agentRegistry } from "../agents/registry.js";
import { M365_TOOLS } from "../lib/m365Tools.js";
import { getAllTools } from "../core/agent/tools/toolRegistry.js";

const prisma = new PrismaClient();
const TENANT_ID = process.env.TENANT_ID ?? "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// Build M365 tool lookup
const m365Map = new Map(M365_TOOLS.map((t) => [t.id, t]));

async function main() {
  console.log("[seedToolProposals] Rebuilding approved tools from agent registry");

  const now = new Date();
  let inserted = 0;
  let skipped = 0;
  const seen = new Set<string>(); // dedupe by agentId:toolName

  for (const agent of agentRegistry) {
    // ── 1. toolsAllowed (general capabilities) ─────────────────────────────
    const generalTools = agent.toolsAllowed ?? [];
    for (const toolName of generalTools) {
      const key = `${agent.id}:${toolName}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const purpose = inferPurpose(toolName, agent);
      await upsertProposal(agent.id, toolName, purpose, "registry:toolsAllowed");
      inserted++;
    }

    // ── 2. M365 tools from agent's m365Tools array ─────────────────────────
    const m365ids = agent.m365Tools ?? [];
    for (const toolId of m365ids) {
      const def = m365Map.get(toolId);
      const toolName = def ? `M365: ${def.name}` : `M365: ${toolId}`;
      const key = `${agent.id}:${toolName}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const purpose = def?.description ?? `Microsoft 365 tool: ${toolId}`;
      await upsertProposal(agent.id, toolName, purpose, "registry:m365");
      inserted++;
    }
  }

  // ── 3. Modular tools (code-based, agent-agnostic — assign to atlas) ──────
  const modularTools = getAllTools();
  for (const tool of modularTools) {
    const toolName = `Modular: ${tool.key}`;
    const key = `atlas:${toolName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    await upsertProposal("atlas", toolName, `Code-based tool: ${tool.key}`, "registry:modular");
    inserted++;
  }

  const total = await prisma.toolProposal.count({ where: { tenantId: TENANT_ID } });
  console.log(`\n[seedToolProposals] Done — ${inserted} inserted, ${skipped} skipped, ${total} total in DB`);
  await prisma.$disconnect();

  async function upsertProposal(agentId: string, toolName: string, purpose: string, source: string) {
    try {
      // Use upsert on tenantId + agentId + toolName composite (no unique constraint, so check first)
      const existing = await prisma.toolProposal.findFirst({
        where: { tenantId: TENANT_ID, agentId, toolName },
      });

      if (existing) {
        skipped++;
        return;
      }

      await prisma.toolProposal.create({
        data: {
          tenantId: TENANT_ID,
          agentId,
          toolName,
          toolPurpose: purpose,
          toolImpl: null,
          status: "approved",
          decidedAt: now,
          decidedBy: "seed_restore",
          approvalToken: randomBytes(24).toString("hex"),
          runId: `seed-restore-${now.toISOString().slice(0, 10)}`,
        },
      });
    } catch (e: any) {
      // Unique constraint on approvalToken — retry with new token
      if (e?.code === "P2002") {
        await prisma.toolProposal.create({
          data: {
            tenantId: TENANT_ID,
            agentId,
            toolName,
            toolPurpose: purpose,
            toolImpl: null,
            status: "approved",
            decidedAt: now,
            decidedBy: "seed_restore",
            approvalToken: randomBytes(24).toString("hex"),
            runId: `seed-restore-${now.toISOString().slice(0, 10)}`,
          },
        });
      } else {
        console.error(`  ✗ ${agentId}/${toolName}: ${e.message}`);
      }
    }
  }
}

function inferPurpose(toolName: string, agent: { id: string; title: string }): string {
  const lower = toolName.toLowerCase();
  // Common tool categories
  if (lower.includes("email"))     return `Email capabilities for ${agent.id}`;
  if (lower.includes("slack"))     return `Slack messaging and channel operations`;
  if (lower.includes("calendar"))  return `Calendar management and scheduling`;
  if (lower.includes("ledger"))    return `Financial ledger and accounting operations`;
  if (lower.includes("web search")) return `Web search and SERP research`;
  if (lower.includes("reddit"))    return `Reddit platform interaction and monitoring`;
  if (lower.includes("postiz"))    return `Social media publishing via Postiz API`;
  if (lower.includes("twitter") || lower.includes("x "))   return `X/Twitter platform operations`;
  if (lower.includes("youtube"))   return `YouTube video and channel operations`;
  if (lower.includes("facebook"))  return `Facebook Page and Groups operations`;
  if (lower.includes("linkedin"))  return `LinkedIn professional networking operations`;
  if (lower.includes("pinterest")) return `Pinterest pin and board operations`;
  if (lower.includes("tiktok"))    return `TikTok content creation and publishing`;
  if (lower.includes("instagram")) return `Instagram content and Reels operations`;
  if (lower.includes("browser"))   return `Headless browser automation via Playwright`;
  if (lower.includes("kb") || lower.includes("knowledge")) return `Knowledge Base read/write operations`;
  if (lower.includes("crm"))       return `CRM and lead management`;
  if (lower.includes("seo"))       return `SEO analysis and keyword tracking`;
  if (lower.includes("analytics")) return `Analytics and performance reporting`;
  if (lower.includes("blog"))      return `Blog content creation and publishing`;
  if (lower.includes("m365"))      return `Microsoft 365 suite tools (${toolName})`;
  if (lower.includes("audit"))     return `Audit trail and compliance operations`;
  if (lower.includes("decision"))  return `Decision memo creation and approval workflow`;
  if (lower.includes("image"))     return `Image generation and processing`;
  if (lower.includes("voice"))     return `Voice/telephony operations`;
  if (lower.includes("booking"))   return `Booking and appointment management`;
  if (lower.includes("onedrive"))  return `OneDrive file storage and retrieval`;
  if (lower.includes("sharepoint")) return `SharePoint portal management`;
  if (lower.includes("teams"))     return `Microsoft Teams messaging and channels`;
  if (lower.includes("outlook"))   return `Outlook email and calendar via Graph API`;
  if (lower.includes("excel"))     return `Excel spreadsheet operations`;
  if (lower.includes("word"))      return `Word document creation and editing`;
  if (lower.includes("onenote"))   return `OneNote notebook operations`;
  if (lower.includes("planner"))   return `Microsoft Planner task management`;
  if (lower.includes("forms"))     return `Forms creation and response management`;
  return `${toolName} — capability for ${agent.id} (${agent.title})`;
}

main().catch((err) => {
  console.error("[seedToolProposals] Fatal:", err);
  process.exit(1);
});
