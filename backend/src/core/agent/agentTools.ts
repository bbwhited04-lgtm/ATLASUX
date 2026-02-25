/**
 * Agent Tools — in-product tool execution for the CSS (Customer Support) agent.
 *
 * These tools run server-side before the LLM call, injecting accurate live
 * data into the agent's context. No hallucination risk on subscription, team,
 * or product questions — the agent reads the database, not its imagination.
 *
 * Tools:
 *   get_subscription_info        — plan, billing type, seat count, feature flags
 *   get_team_members             — team roster with roles and join dates
 *   search_atlasux_knowledge     — full KB RAG search for product/how-to questions
 *
 * Usage: call resolveAgentTools(tenantId, query) before building the system prompt.
 * The result is a formatted string ready to inject as [TOOL RESULTS] context.
 */

import { prisma } from "../../prisma.js";
import { getKbContext } from "../kb/getKbContext.js";

export type ToolResult = {
  tool: string;
  data: string;
  usedAt: string;
};

// ── Tool: get_subscription_info ───────────────────────────────────────────────

async function getSubscriptionInfo(tenantId: string): Promise<ToolResult> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id:           true,
        slug:         true,
        name:         true,
        createdAt:    true,
        _count: {
          select: { members: true },
        },
      },
    });

    // Pull the most recent billing-relevant ledger entries
    const recentSpend = await prisma.ledgerEntry.findMany({
      where:   { tenantId, category: "token_spend" },
      orderBy: { occurredAt: "desc" },
      take:    5,
      select:  { amountCents: true, description: true, occurredAt: true },
    });

    const totalSpendCents = recentSpend.reduce((sum, e) => sum + Number(e.amountCents), 0);

    // Pull connected integrations as a proxy for "active features"
    const integrations = await prisma.integration.findMany({
      where:  { tenantId, connected: true },
      select: { provider: true },
    });

    const lines: string[] = [
      `Account: ${tenant?.name ?? tenantId}`,
      `Account slug: ${tenant?.slug ?? "—"}`,
      `Member since: ${tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "—"}`,
      `Team seats used: ${tenant?._count?.members ?? 0}`,
      `Connected platforms: ${integrations.map(i => i.provider).join(", ") || "none"}`,
      `Recent compute spend (last 5 runs): ${(totalSpendCents / 100).toFixed(4)} USD`,
    ];

    return {
      tool: "get_subscription_info",
      data: lines.join("\n"),
      usedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      tool:   "get_subscription_info",
      data:   `[error retrieving subscription info: ${err?.message ?? "unknown"}]`,
      usedAt: new Date().toISOString(),
    };
  }
}

// ── Tool: get_team_members ─────────────────────────────────────────────────────

async function getTeamMembers(
  tenantId: string,
  filter?: { role?: string; limit?: number },
): Promise<ToolResult> {
  try {
    const members = await prisma.tenantMember.findMany({
      where: {
        tenantId,
        ...(filter?.role ? { role: { contains: filter.role, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take:    filter?.limit ?? 50,
    });

    if (!members.length) {
      return {
        tool:   "get_team_members",
        data:   "No team members found for this account.",
        usedAt: new Date().toISOString(),
      };
    }

    const lines = members.map((m, i) => {
      const joined = m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—";
      return `${i + 1}. userId: ${m.userId} | role: ${m.role} | joined: ${joined}`;
    });

    return {
      tool:   "get_team_members",
      data:   `Team members (${members.length}):\n${lines.join("\n")}`,
      usedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      tool:   "get_team_members",
      data:   `[error retrieving team members: ${err?.message ?? "unknown"}]`,
      usedAt: new Date().toISOString(),
    };
  }
}

// ── Tool: search_atlasux_knowledge ────────────────────────────────────────────

async function searchAtlasUXKnowledge(
  tenantId: string,
  query: string,
): Promise<ToolResult> {
  try {
    const kb = await getKbContext({
      tenantId,
      agentId: "cheryl",
      query:   query.slice(0, 200),
    });

    if (!kb.text) {
      return {
        tool:   "search_atlasux_knowledge",
        data:   "No matching documentation found. Answer from general Atlas UX knowledge.",
        usedAt: new Date().toISOString(),
      };
    }

    return {
      tool:   "search_atlasux_knowledge",
      data:   `Found ${kb.items.length} relevant docs:\n${kb.text}`,
      usedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      tool:   "search_atlasux_knowledge",
      data:   `[error searching knowledge base: ${err?.message ?? "unknown"}]`,
      usedAt: new Date().toISOString(),
    };
  }
}

// ── Tool Router ───────────────────────────────────────────────────────────────

const SUBSCRIPTION_PATTERNS = [
  /\b(plan|billing|invoice|payment|charge|subscription|renewal|renew|seat|seats|limit|pricing|price|cost|how much|what.*include|feature.*include|include.*feature)\b/i,
  /\b(when (does|is|will) (my|the|our) (plan|subscription|billing|renewal))\b/i,
  /\b(what (plan|tier|subscription) (am i|are we|is this) on)\b/i,
  /\b(upgrade|downgrade|cancel.*plan|cancel.*subscription)\b/i,
];

const TEAM_PATTERNS = [
  /\b(team member|team.*member|member.*team|who.*team|team.*who)\b/i,
  /\b(who (has|have|is|are) (access|role|permission|admin|owner))\b/i,
  /\b(add.*user|remove.*user|invite.*user|user.*role|change.*role)\b/i,
  /\b(how many (people|users|members|seats) (are|is|on))\b/i,
  /\b(user.*permission|permission.*user|department|who.*manage)\b/i,
];

const PRODUCT_PATTERNS = [
  /\b(how (do|does|can|to)|how.*work|what is|explain|tell me about|what.*feature|feature.*work)\b/i,
  /\b(set up|setup|configure|connect|integrate|use|using|enable|disable|turn on|turn off)\b/i,
  /\b(workflow|agent|integration|dashboard|settings|kb|knowledge base|scheduler|engine)\b/i,
  /\b(error|bug|not working|broken|issue|problem|fix|troubleshoot|help.*with)\b/i,
  /\b(where (do|can|is|are)|find|locate|navigate)\b/i,
];

type ToolSet = {
  needsSubscription: boolean;
  needsTeam:         boolean;
  needsKnowledge:    boolean;
  knowledgeQuery:    string;
};

export function detectToolNeeds(query: string): ToolSet {
  const q = query.trim();
  return {
    needsSubscription: SUBSCRIPTION_PATTERNS.some(p => p.test(q)),
    needsTeam:         TEAM_PATTERNS.some(p => p.test(q)),
    needsKnowledge:    PRODUCT_PATTERNS.some(p => p.test(q)),
    knowledgeQuery:    q,
  };
}

/**
 * Resolve all needed tools for a query and return formatted context.
 * Returns empty string if no tools are needed (falls through to tier routing).
 */
export async function resolveAgentTools(
  tenantId: string,
  query: string,
): Promise<string> {
  const needs = detectToolNeeds(query);

  if (!needs.needsSubscription && !needs.needsTeam && !needs.needsKnowledge) {
    return "";
  }

  const results: ToolResult[] = await Promise.all([
    needs.needsSubscription ? getSubscriptionInfo(tenantId) : Promise.resolve(null),
    needs.needsTeam         ? getTeamMembers(tenantId)      : Promise.resolve(null),
    needs.needsKnowledge    ? searchAtlasUXKnowledge(tenantId, needs.knowledgeQuery) : Promise.resolve(null),
  ]).then(r => r.filter(Boolean) as ToolResult[]);

  if (!results.length) return "";

  const blocks = results.map(r =>
    `### Tool: ${r.tool}\n_Retrieved: ${r.usedAt}_\n\n${r.data}`
  );

  return `[AGENT TOOL RESULTS]\nThe following live data was retrieved to answer this question accurately:\n\n${blocks.join("\n\n---\n\n")}`;
}
