/**
 * Agent Tools — server-side tool execution wired into every chat call.
 *
 * All tools run BEFORE the LLM call, injecting live data into agent context.
 * No hallucination risk — agents read the database, not their imagination.
 *
 * Tools (approved via WF-107):
 *   get_subscription_info     — plan, billing, seats, connected integrations
 *   get_team_members          — roster with roles and join dates
 *   search_atlasux_knowledge  — KB RAG for product/how-to questions
 *   read_calendar             — upcoming events via M365 Graph API
 *   read_crm_contacts         — CRM contact records from DB
 *   read_ledger               — recent ledger/spend entries from DB
 *   read_email                — agent inbox events from DB
 *   read_user_profile         — tenant member profile from DB
 *   read_policy_docs          — policy KB search
 *   read_legal_docs           — legal KB search
 *   read_ip_register          — IP request records from DB
 *   read_planner              — Microsoft Planner tasks via Graph API
 *   send_telegram_message     — send a Telegram notification to the tenant's default chat
 *   search_my_memories        — unified recall: conversation memory, audit trail, workflow history, agent KB
 *   delegate_task             — agent-to-agent task handoff: creates a queued AGENT_TASK job for another agent
 *   post_to_x                — post a tweet via X API v2 (Kelly's primary tool)
 *   search_x                 — search recent tweets on X (app-only bearer token)
 *
 * Usage: resolveAgentTools(tenantId, query, agentId) — returns formatted context string.
 */

import { prisma }                    from "../../db/prisma.js";
import { getKbContext }              from "../kb/getKbContext.js";
import { callGraph }                 from "../../lib/m365Tools.js";
import { sendTelegramNotification }  from "../../lib/telegramNotify.js";
import { postTweet, searchRecentTweets } from "../../services/x.js";
import { getMemory }                 from "./agentMemory.js";

export type ToolResult = {
  tool:   string;
  data:   string;
  usedAt: string;
};

// ── Helper: get M365 access token from token_vault ────────────────────────────

async function getM365Token(tenantId: string): Promise<string | null> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data } = await supabase
      .from("token_vault")
      .select("access_token")
      .eq("org_id", tenantId)
      .in("provider", ["microsoft", "m365"])
      .limit(1)
      .single();
    return data?.access_token ?? null;
  } catch {
    return null;
  }
}

// ── Tool: get_subscription_info ───────────────────────────────────────────────

async function getSubscriptionInfo(tenantId: string): Promise<ToolResult> {
  try {
    const [tenant, recentSpend, integrations] = await Promise.all([
      prisma.tenant.findUnique({
        where:  { id: tenantId },
        select: { id: true, slug: true, name: true, createdAt: true, _count: { select: { members: true } } },
      }),
      prisma.ledgerEntry.findMany({
        where: { tenantId, category: "token_spend" }, orderBy: { occurredAt: "desc" }, take: 5,
        select: { amountCents: true, description: true, occurredAt: true },
      }),
      prisma.integration.findMany({ where: { tenantId, connected: true }, select: { provider: true } }),
    ]);

    const totalSpendCents = recentSpend.reduce((sum, e) => sum + Number(e.amountCents), 0);
    return {
      tool: "get_subscription_info",
      data: [
        `Account: ${tenant?.name ?? tenantId}`,
        `Account slug: ${tenant?.slug ?? "—"}`,
        `Member since: ${tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "—"}`,
        `Team seats used: ${tenant?._count?.members ?? 0}`,
        `Connected platforms: ${integrations.map(i => i.provider).join(", ") || "none"}`,
        `Recent compute spend (last 5 runs): ${(totalSpendCents / 100).toFixed(4)} USD`,
      ].join("\n"),
      usedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return { tool: "get_subscription_info", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: get_team_members ─────────────────────────────────────────────────────

async function getTeamMembers(tenantId: string): Promise<ToolResult> {
  try {
    const members = await prisma.tenantMember.findMany({
      where: { tenantId }, orderBy: { createdAt: "asc" }, take: 50,
    });
    if (!members.length) return { tool: "get_team_members", data: "No team members found.", usedAt: new Date().toISOString() };
    const lines = members.map((m, i) =>
      `${i + 1}. userId: ${m.userId} | role: ${m.role} | joined: ${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}`
    );
    return { tool: "get_team_members", data: `Team members (${members.length}):\n${lines.join("\n")}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "get_team_members", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: search_atlasux_knowledge ────────────────────────────────────────────

async function searchAtlasUXKnowledge(tenantId: string, query: string): Promise<ToolResult> {
  try {
    const kb = await getKbContext({ tenantId, agentId: "cheryl", query: query.slice(0, 200) });
    if (!kb.text) return { tool: "search_atlasux_knowledge", data: "No matching docs found.", usedAt: new Date().toISOString() };
    return { tool: "search_atlasux_knowledge", data: `Found ${kb.items.length} relevant docs:\n${kb.text}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "search_atlasux_knowledge", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: read_calendar ───────────────────────────────────────────────────────

async function readCalendar(tenantId: string): Promise<ToolResult> {
  try {
    const token = await getM365Token(tenantId);
    if (!token) {
      return { tool: "read_calendar", data: "Calendar not available — Microsoft 365 not connected for this account.", usedAt: new Date().toISOString() };
    }
    const now     = new Date().toISOString();
    const weekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const result  = await callGraph(token, "GET",
      `/me/calendarView?startDateTime=${now}&endDateTime=${weekOut}&$top=8&$select=subject,start,end,location,attendees&$orderby=start/dateTime`
    );
    const events = (result?.value ?? []) as any[];
    if (!events.length) return { tool: "read_calendar", data: "No upcoming events in the next 7 days.", usedAt: new Date().toISOString() };
    const lines = events.map((e: any, i: number) => {
      const start = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleString() : "TBD";
      const loc   = e.location?.displayName ? ` @ ${e.location.displayName}` : "";
      return `${i + 1}. ${e.subject ?? "(no title)"}${loc} — ${start}`;
    });
    return { tool: "read_calendar", data: `Upcoming events (next 7 days):\n${lines.join("\n")}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "read_calendar", data: `[error reading calendar: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: read_crm_contacts ───────────────────────────────────────────────────

async function readCrmContacts(tenantId: string, query?: string): Promise<ToolResult> {
  try {
    const contacts = await prisma.crmContact.findMany({
      where: {
        tenantId,
        ...(query ? {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName:  { contains: query, mode: "insensitive" } },
            { email:     { contains: query, mode: "insensitive" } },
            { company:   { contains: query, mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { firstName: true, lastName: true, email: true, phone: true, company: true, tags: true, updatedAt: true },
    });
    if (!contacts.length) return { tool: "read_crm_contacts", data: "No CRM contacts found.", usedAt: new Date().toISOString() };
    const lines = contacts.map((c, i) => {
      const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";
      const tags = c.tags?.length ? ` [${c.tags.join(", ")}]` : "";
      return `${i + 1}. ${name} | ${c.email ?? "—"} | ${c.company ?? "—"}${tags}`;
    });
    return { tool: "read_crm_contacts", data: `CRM contacts (${contacts.length}):\n${lines.join("\n")}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "read_crm_contacts", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: read_ledger ─────────────────────────────────────────────────────────

async function readLedger(tenantId: string): Promise<ToolResult> {
  try {
    const entries = await prisma.ledgerEntry.findMany({
      where: { tenantId }, orderBy: { occurredAt: "desc" }, take: 10,
      select: { entryType: true, category: true, amountCents: true, description: true, occurredAt: true },
    });
    if (!entries.length) return { tool: "read_ledger", data: "No ledger entries found.", usedAt: new Date().toISOString() };
    const lines = entries.map((e, i) => {
      const amt  = `$${(Number(e.amountCents) / 100).toFixed(4)}`;
      const date = new Date(e.occurredAt).toLocaleDateString();
      return `${i + 1}. [${e.entryType}] ${e.category} — ${amt} — ${e.description ?? ""} (${date})`;
    });
    return { tool: "read_ledger", data: `Recent ledger entries (${entries.length}):\n${lines.join("\n")}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "read_ledger", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: read_email ──────────────────────────────────────────────────────────

async function readEmail(tenantId: string, agentId: string): Promise<ToolResult> {
  try {
    const events = await (prisma as any).agent_inbox_events.findMany({
      where:   { tenant_id: tenantId, agent_key: agentId, status: { in: ["new", "read"] } },
      orderBy: { received_at: "desc" },
      take:    5,
      select:  { from_email: true, from_name: true, subject: true, body_text: true, received_at: true, status: true },
    });
    if (!events.length) return { tool: "read_email", data: `No recent emails in ${agentId}'s inbox.`, usedAt: new Date().toISOString() };
    const lines = events.map((e: any, i: number) => {
      const from = e.from_name ? `${e.from_name} <${e.from_email}>` : (e.from_email ?? "unknown");
      const body = (e.body_text ?? "").slice(0, 200).replace(/\n+/g, " ");
      return `${i + 1}. From: ${from}\n   Subject: ${e.subject ?? "(no subject)"}\n   Preview: ${body}`;
    });
    return { tool: "read_email", data: `Recent inbox (${events.length}):\n${lines.join("\n\n")}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "read_email", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: read_user_profile ───────────────────────────────────────────────────

async function readUserProfile(tenantId: string): Promise<ToolResult> {
  try {
    const members = await prisma.tenantMember.findMany({
      where: { tenantId }, orderBy: { createdAt: "desc" }, take: 20,
      select: { userId: true, role: true, createdAt: true },
    });
    if (!members.length) return { tool: "read_user_profile", data: "No user profiles found.", usedAt: new Date().toISOString() };
    const lines = members.map((m, i) =>
      `${i + 1}. userId: ${m.userId} | role: ${m.role} | since: ${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}`
    );
    return { tool: "read_user_profile", data: `User profiles (${members.length}):\n${lines.join("\n")}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "read_user_profile", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: read_policy_docs ────────────────────────────────────────────────────

async function readPolicyDocs(tenantId: string, query: string): Promise<ToolResult> {
  try {
    const kb = await getKbContext({ tenantId, agentId: "larry", query: `policy ${query}`.slice(0, 200) });
    if (!kb.text) return { tool: "read_policy_docs", data: "No policy documents found.", usedAt: new Date().toISOString() };
    return { tool: "read_policy_docs", data: `Policy docs (${kb.items.length}):\n${kb.text.slice(0, 3000)}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "read_policy_docs", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: read_legal_docs ─────────────────────────────────────────────────────

async function readLegalDocs(tenantId: string, query: string): Promise<ToolResult> {
  try {
    const kb = await getKbContext({ tenantId, agentId: "jenny", query: `legal ${query}`.slice(0, 200) });
    if (!kb.text) return { tool: "read_legal_docs", data: "No legal documents found.", usedAt: new Date().toISOString() };
    return { tool: "read_legal_docs", data: `Legal docs (${kb.items.length}):\n${kb.text.slice(0, 3000)}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "read_legal_docs", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: read_ip_register ────────────────────────────────────────────────────

async function readIpRegister(tenantId: string): Promise<ToolResult> {
  try {
    const requests = await (prisma as any).atlas_ip_requests.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      select: { request_id: true, company: true, asset_type: true, question: true, status: true, created_at: true },
    });
    if (!requests.length) return { tool: "read_ip_register", data: "No IP register entries found.", usedAt: new Date().toISOString() };
    const lines = requests.map((r: any, i: number) =>
      `${i + 1}. [${r.status}] ${r.company ?? "—"} | ${r.asset_type} — ${(r.question ?? "").slice(0, 100)}`
    );
    return { tool: "read_ip_register", data: `IP register (${requests.length}):\n${lines.join("\n")}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "read_ip_register", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: read_planner ────────────────────────────────────────────────────────

async function readPlanner(tenantId: string): Promise<ToolResult> {
  try {
    const token = await getM365Token(tenantId);
    if (!token) return { tool: "read_planner", data: "Planner not available — Microsoft 365 not connected.", usedAt: new Date().toISOString() };
    const result = await callGraph(token, "GET", "/me/planner/tasks?$top=10&$select=title,percentComplete,dueDateTime,assignments");
    const tasks  = (result?.value ?? []) as any[];
    if (!tasks.length) return { tool: "read_planner", data: "No Planner tasks assigned.", usedAt: new Date().toISOString() };
    const lines = tasks.map((t: any, i: number) => {
      const due  = t.dueDateTime ? ` — due ${new Date(t.dueDateTime).toLocaleDateString()}` : "";
      const pct  = t.percentComplete !== undefined ? ` (${t.percentComplete}%)` : "";
      return `${i + 1}. ${t.title ?? "(untitled)"}${pct}${due}`;
    });
    return { tool: "read_planner", data: `Planner tasks (${tasks.length}):\n${lines.join("\n")}`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "read_planner", data: `[error reading planner: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: send_telegram_message ───────────────────────────────────────────────

async function sendTelegramMessage(tenantId: string, query: string): Promise<ToolResult> {
  // Extract the message the agent wants to send, or build one from the query
  const text = query.length > 10
    ? `📬 *Atlas notification*\n\n${query}`
    : "📬 *Atlas notification*\nYour agent pinged you from Atlas UX.";
  try {
    const result = await sendTelegramNotification(tenantId, text);
    if (!result.ok) {
      return { tool: "send_telegram_message", data: `Failed to send Telegram message: ${result.error}`, usedAt: new Date().toISOString() };
    }
    return { tool: "send_telegram_message", data: `Telegram message sent to chat ${result.chat_id}.`, usedAt: new Date().toISOString() };
  } catch (err: any) {
    return { tool: "send_telegram_message", data: `[error: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: search_my_memories ─────────────────────────────────────────────────
// Unified recall across 4 sources: conversation memory, audit trail, KB docs,
// and previous workflow outputs. Gives agents instant recall of past actions.

async function searchMyMemories(
  tenantId: string,
  agentId: string,
  query: string,
): Promise<ToolResult> {
  const sections: string[] = [];
  const q = query.trim().toLowerCase();

  try {
    // 1. Conversation memory — last 10 turns from agent_memory
    const memory = await getMemory(tenantId, agentId, "default", 10).catch(() => []);
    if (memory.length) {
      const memLines = memory.map((m) => `  [${m.role}] ${m.content.slice(0, 200)}`);
      sections.push(`📝 CONVERSATION MEMORY (last ${memory.length} turns):\n${memLines.join("\n")}`);
    }

    // 2. Audit trail — this agent's recent actions (last 15)
    const auditEntries = await prisma.auditLog.findMany({
      where: {
        tenantId,
        OR: [
          { actorExternalId: agentId },
          { actorExternalId: agentId.toUpperCase() },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: 15,
      select: {
        action: true,
        level: true,
        message: true,
        entityType: true,
        entityId: true,
        timestamp: true,
      },
    }).catch(() => []);
    if (auditEntries.length) {
      const auditLines = auditEntries.map((e) => {
        const ts = e.timestamp ? new Date(e.timestamp).toISOString().slice(0, 19) : "—";
        return `  [${ts}] ${e.action}: ${(e.message ?? "").slice(0, 150)}`;
      });
      sections.push(`📋 MY RECENT ACTIONS (last ${auditEntries.length}):\n${auditLines.join("\n")}`);
    }

    // 3. Workflow outputs — recent WORKFLOW_COMPLETE entries for this agent
    const wfResults = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: { in: ["WORKFLOW_STEP", "WORKFLOW_COMPLETE"] },
        OR: [
          { actorExternalId: agentId },
          { actorExternalId: agentId.toUpperCase() },
          { message: { contains: agentId, mode: "insensitive" } },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: 8,
      select: { action: true, message: true, meta: true, timestamp: true },
    }).catch(() => []);
    if (wfResults.length) {
      const wfLines = wfResults.map((w) => {
        const ts = w.timestamp ? new Date(w.timestamp).toISOString().slice(0, 19) : "—";
        const wfId = (w.meta as any)?.workflowId ?? "";
        return `  [${ts}] ${wfId ? `${wfId}: ` : ""}${(w.message ?? "").slice(0, 150)}`;
      });
      sections.push(`🔄 MY WORKFLOW HISTORY (last ${wfResults.length}):\n${wfLines.join("\n")}`);
    }

    // 4. Agent-specific KB docs — personal knowledge base
    const kb = await getKbContext({
      tenantId,
      agentId,
      query: q.slice(0, 200),
    }).catch(() => ({ text: "", items: [], totalChars: 0, budgetChars: 0 }));
    if (kb.items.length) {
      const kbTitles = kb.items.slice(0, 8).map((d) => `  • ${d.title ?? d.slug ?? "untitled"}`);
      sections.push(`📚 MY KNOWLEDGE BASE (${kb.items.length} docs):\n${kbTitles.join("\n")}\n\n${kb.text.slice(0, 2000)}`);
    }

    if (!sections.length) {
      return {
        tool: "search_my_memories",
        data: `No memories found for agent ${agentId}. This agent has no conversation history, audit trail, workflow outputs, or KB docs yet.`,
        usedAt: new Date().toISOString(),
      };
    }

    return {
      tool: "search_my_memories",
      data: `Agent ${agentId.toUpperCase()} memory recall (query: "${q.slice(0, 60)}"):\n\n${sections.join("\n\n" + "─".repeat(40) + "\n\n")}`,
      usedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      tool: "search_my_memories",
      data: `[error searching memories: ${err?.message}]`,
      usedAt: new Date().toISOString(),
    };
  }
}

// ── Tool: delegate_task — agent-to-agent task handoff ─────────────────────────

import { agentRegistry } from "../../agents/registry.js";

async function delegateTask(
  tenantId: string,
  fromAgentId: string,
  query: string,
): Promise<ToolResult> {
  try {
    // Parse target agent and task from query
    // Patterns: "delegate to binky: research X", "hand off to tina: review budget", "ask sunday to draft memo"
    const delegateMatch = query.match(
      /(?:delegate|hand\s*off|assign|send|forward|pass|route|ask)\s+(?:to\s+)?(\w+)[\s:,]+(.+)/i
    );

    if (!delegateMatch) {
      return {
        tool: "delegate_task",
        data: `Could not parse delegation. Use format: "delegate to [agent]: [task description]". Available agents: ${agentRegistry.map(a => a.name).join(", ")}`,
        usedAt: new Date().toISOString(),
      };
    }

    const targetName = delegateMatch[1].toLowerCase();
    const taskDesc = delegateMatch[2].trim();

    const target = agentRegistry.find(
      (a) => a.id === targetName || a.name.toLowerCase() === targetName
    );

    if (!target) {
      return {
        tool: "delegate_task",
        data: `Unknown agent "${targetName}". Available: ${agentRegistry.map(a => `${a.name} (${a.title})`).join(", ")}`,
        usedAt: new Date().toISOString(),
      };
    }

    const job = await prisma.job.create({
      data: {
        tenantId,
        requested_by_user_id: fromAgentId,
        status: "queued",
        jobType: "AGENT_TASK",
        priority: 1,
        input: {
          assignedAgentId: target.id,
          title: `[From ${fromAgentId.toUpperCase()}] ${taskDesc.slice(0, 200)}`,
          description: taskDesc,
          delegatedBy: fromAgentId,
          traceId: `delegate-${fromAgentId}-${Date.now()}`,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        actorExternalId: fromAgentId,
        actorType: "agent",
        level: "info",
        action: "TASK_DELEGATED",
        entityType: "job",
        entityId: job.id,
        message: `${fromAgentId} delegated task to ${target.id}: ${taskDesc.slice(0, 120)}`,
        meta: { from: fromAgentId, to: target.id, jobId: job.id },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return {
      tool: "delegate_task",
      data: `Task delegated to ${target.name} (${target.title}).\nJob ID: ${job.id}\nStatus: queued\nTask: ${taskDesc.slice(0, 200)}\n\nThe task has been queued and ${target.name} will pick it up on the next engine tick.`,
      usedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      tool: "delegate_task",
      data: `[error delegating task: ${err?.message}]`,
      usedAt: new Date().toISOString(),
    };
  }
}

// ── Tool: post_to_x ─────────────────────────────────────────────────────────

async function getXAccessToken(tenantId: string): Promise<string | null> {
  // 1. Try per-tenant OAuth token from vault
  try {
    const integration = await prisma.integration.findFirst({
      where: { tenantId, provider: "x", connected: true },
    });
    if (integration?.access_token) return integration.access_token;
  } catch { /* fall through */ }

  // 2. Fallback to env var (owner's token)
  return process.env.X_ACCESS_TOKEN ?? null;
}

async function postToX(tenantId: string, agentId: string, query: string): Promise<ToolResult> {
  try {
    const token = await getXAccessToken(tenantId);
    if (!token) {
      return { tool: "post_to_x", data: "X not connected — no access token found. Connect X in Settings > Integrations.", usedAt: new Date().toISOString() };
    }

    // Extract tweet text: everything after "tweet:", "post:", or the full query
    const textMatch = query.match(/(?:tweet|post|publish|share|announce)\s*(?:to x|on x|on twitter|to twitter)?\s*[:\-–]\s*(.+)/is)
                   ?? query.match(/(?:tweet|post)\s+(?:this|that|about)\s*[:\-–]?\s*(.+)/is);
    const tweetText = textMatch ? textMatch[1].trim() : query.trim();

    if (tweetText.length > 280) {
      return { tool: "post_to_x", data: `Tweet too long (${tweetText.length} chars, max 280). Shorten and try again.`, usedAt: new Date().toISOString() };
    }

    const result = await postTweet(token, tweetText);

    if (!result.ok) {
      return { tool: "post_to_x", data: `Failed to post: ${result.error}`, usedAt: new Date().toISOString() };
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        actorExternalId: agentId,
        actorType: "agent",
        level: "info",
        action: "X_TWEET_POSTED",
        entityType: "tweet",
        entityId: result.tweetId ?? null,
        message: `${agentId} posted tweet: ${tweetText.slice(0, 120)}`,
        meta: { tweetId: result.tweetId, agentId, charCount: tweetText.length },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return {
      tool: "post_to_x",
      data: `Tweet posted successfully.\nTweet ID: ${result.tweetId}\nText: ${result.text ?? tweetText}\nURL: https://x.com/i/status/${result.tweetId}`,
      usedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return { tool: "post_to_x", data: `[error posting to X: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: search_x ──────────────────────────────────────────────────────────

async function searchX(tenantId: string, query: string): Promise<ToolResult> {
  try {
    // Extract search terms
    const searchMatch = query.match(/(?:search|find|look up|trending|monitor|check)\s+(?:on\s+)?(?:x|twitter)\s*(?:for)?\s*[:\-–]?\s*(.+)/is);
    const searchTerms = searchMatch ? searchMatch[1].trim() : query.replace(/\b(x|twitter|search|find|trending|hot|topics?|check|monitor)\b/gi, "").trim();

    if (!searchTerms || searchTerms.length < 2) {
      return { tool: "search_x", data: "No search terms provided. Try: 'search X for AI agents'", usedAt: new Date().toISOString() };
    }

    const tweets = await searchRecentTweets(searchTerms, 10);
    if (!tweets.length) {
      return { tool: "search_x", data: `No recent tweets found for "${searchTerms}".`, usedAt: new Date().toISOString() };
    }

    const lines = tweets.map((t, i) => {
      const metrics = t.public_metrics
        ? ` (${t.public_metrics.like_count} likes, ${t.public_metrics.retweet_count} RT, ${t.public_metrics.impression_count ?? "?"} views)`
        : "";
      return `${i + 1}. ${t.text.slice(0, 200)}${metrics}\n   ID: ${t.id} | ${t.created_at ?? ""}`;
    });

    return {
      tool: "search_x",
      data: `X search results for "${searchTerms}" (${tweets.length} tweets):\n\n${lines.join("\n\n")}`,
      usedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return { tool: "search_x", data: `[error searching X: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: search_youtube ──────────────────────────────────────────────────────

async function searchYouTube(tenantId: string, query: string): Promise<ToolResult> {
  try {
    const { searchVideos } = await import("../../services/youtube.js");

    // Get Google token
    let token: string | null = null;
    try {
      const vault = await prisma.$queryRaw<Array<{ access_token: string }>>`
        SELECT access_token FROM token_vault
        WHERE org_id = ${tenantId} AND provider = 'google'
        ORDER BY created_at DESC LIMIT 1
      `.catch(() => []);
      token = (vault.length > 0 && vault[0].access_token) ? vault[0].access_token : null;
    } catch { /* fallthrough */ }

    if (!token) {
      const integration = await prisma.integration.findUnique({
        where: { tenantId_provider: { tenantId, provider: "google" } },
        select: { access_token: true, connected: true },
      });
      if (integration?.connected && integration.access_token) token = integration.access_token;
    }

    if (!token) {
      return { tool: "search_youtube", data: "YouTube not connected — connect Google in Settings > Integrations.", usedAt: new Date().toISOString() };
    }

    // Extract search terms from the query
    const searchTerms = query
      .replace(/\b(search|find|look up|trending|check|monitor|scrape|on|youtube|for|videos?|about)\b/gi, "")
      .trim() || "AI automation";

    const results = await searchVideos(token, searchTerms, 5);
    if (!results.length) {
      return { tool: "search_youtube", data: `No YouTube videos found for "${searchTerms}".`, usedAt: new Date().toISOString() };
    }

    const lines = results.map((v, i) =>
      `${i + 1}. **${v.title}**\n   Channel: ${v.channelTitle} | Published: ${v.publishedAt}\n   URL: https://www.youtube.com/watch?v=${v.videoId}`
    );

    return {
      tool: "search_youtube",
      data: `YouTube search results for "${searchTerms}" (${results.length} videos):\n\n${lines.join("\n\n")}`,
      usedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return { tool: "search_youtube", data: `[error searching YouTube: ${err?.message}]`, usedAt: new Date().toISOString() };
  }
}

// ── Tool: youtube_upload_info ─────────────────────────────────────────────────

async function youtubeUploadInfo(tenantId: string): Promise<ToolResult> {
  return {
    tool: "youtube_upload",
    data: `To upload a video to YouTube, use workflow WF-111 (Venny YouTube Shorts Auto-Publisher).\n\nRequired input:\n- oneDriveFileId: The OneDrive file ID of the video\n- title: Video title (max 100 chars)\n- description: Video description\n- tags: Array of tags\n- privacyStatus: "public", "unlisted", or "private"\n\nTrigger via: POST /v1/engine/run with workflowId "WF-111"`,
    usedAt: new Date().toISOString(),
  };
}

// ── Video Compose (FFmpeg) ────────────────────────────────────────────────────

async function videoComposeInfo(): Promise<ToolResult> {
  return {
    tool: "video_compose",
    data: `Victor's FFmpeg video composition engine is available.\n\nCapabilities:\n- Compose YouTube Shorts (9:16, 1080×1920) from images + clips + text overlays + audio\n- Concatenate video clips\n- Add text overlays (burned into video)\n- Add audio tracks\n- Extract thumbnails\n- Resize any video to Shorts format\n\nAPI: POST /v1/video/compose\nInput: { images: string[], clips: string[], textOverlays: [{text, fontSize, fontColor, x, y}], audioPath: string }\nReturns: { jobId } — async composition via job worker.\n\nCheck status: GET /v1/video/status/:jobId\nCheck capabilities: GET /v1/video/capabilities`,
    usedAt: new Date().toISOString(),
  };
}

// ── Video Generate (ComfyUI + CogVideoX) ──────────────────────────────────────

async function videoGenerateInfo(): Promise<ToolResult> {
  const { isAvailable } = await import("../../services/comfyui.js");
  const comfyAvailable = await isAvailable();
  const statusMsg = comfyAvailable
    ? "ComfyUI is ONLINE and ready for AI video generation."
    : "ComfyUI is OFFLINE. AI video generation requires a local ComfyUI instance (desktop/Electron only).";

  return {
    tool: "video_generate",
    data: `${statusMsg}\n\nModes:\n- text-to-video: Generate video from text prompt\n- image-to-video: Animate a still image\n- video-to-video: Style transfer on existing video\n\nModel: CogVideoX-5B (13B parameters, 8fps output)\n\nAPI: POST /v1/video/generate\nInput: { mode: "text-to-video"|"image-to-video"|"video-to-video", prompt: string, durationSec?, width?, height?, steps?, cfgScale?, imagePath?, inputVideoPath? }\nReturns: { jobId, promptId } — async generation.\n\nCheck status: GET /v1/video/status/:jobId`,
    usedAt: new Date().toISOString(),
  };
}

// ── Flux1 Image Generation ────────────────────────────────────────────────────

async function flux1GenerateInfo(): Promise<ToolResult> {
  const { isAvailable } = await import("../../services/flux1.js");
  const available = await isAvailable();
  const statusMsg = available
    ? "Flux1 image generation is configured and ready."
    : "Flux1 API key not configured (FLUX1_API_KEY).";

  return {
    tool: "flux1_image_generate",
    data: `${statusMsg}\n\nFlux1 by Black Forest Labs — fast, high-quality AI image generation.\n\nModels: flux1-schnell (fast), flux1-dev (quality), flux1-pro (best)\n\nCapabilities:\n- Text → Image generation\n- Configurable resolution (default 1024×1024)\n- Adjustable steps and guidance scale\n\nAPI: Use Venny's image pipeline or call the service directly.\nThe Flux1 service returns image URLs that can be downloaded and stored in OneDrive.`,
    usedAt: new Date().toISOString(),
  };
}

// ── Pattern detection ─────────────────────────────────────────────────────────

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

const CALENDAR_PATTERNS = [
  /\b(calendar|schedule|meeting|appointment|event|when.*free|available.*time|time slot)\b/i,
  /\b(what.*today|what.*tomorrow|what.*week|upcoming|next meeting)\b/i,
  /\b(block.*time|book.*time|schedule.*call|schedule.*meeting)\b/i,
];

const CRM_PATTERNS = [
  /\b(contact|customer|client|lead|prospect|account.*company|crm)\b/i,
  /\b(who is|tell me about|find.*customer|look up.*customer|customer.*info)\b/i,
  /\b(company|organization|firm|account holder)\b/i,
];

const LEDGER_PATTERNS = [
  /\b(ledger|spend|expense|transaction|financial|cash flow|balance|budget)\b/i,
  /\b(how much.*spent|total.*cost|recent.*charge|recent.*spend)\b/i,
  /\b(revenue|income|payment.*record|debit|credit.*entry)\b/i,
];

const EMAIL_PATTERNS = [
  /\b(inbox|email|message|received|unread|mail|correspondence)\b/i,
  /\b(what.*email|check.*email|any.*message|recent.*email)\b/i,
];

const USER_PROFILE_PATTERNS = [
  /\b(my profile|my account|account info|user.*info|who am i|account details)\b/i,
  /\b(user.*profile|profile.*user|member.*info|account.*settings)\b/i,
];

const POLICY_PATTERNS = [
  /\b(policy|policies|guideline|rule|compliance|procedure|protocol|standard)\b/i,
  /\b(what.*policy|company.*rule|is it allowed|permitted|prohibited)\b/i,
];

const LEGAL_PATTERNS = [
  /\b(legal|law|contract|agreement|clause|liability|terms|counsel|attorney)\b/i,
  /\b(ip|intellectual property|copyright|trademark|patent|licensing)\b/i,
  /\b(is.*legal|legal.*question|legal.*advice|legal.*review)\b/i,
];

const IP_REGISTER_PATTERNS = [
  /\b(ip request|ip register|ip filing|intellectual property request|ip review)\b/i,
  /\b(trademark.*status|copyright.*status|patent.*status|ip.*status)\b/i,
];

const PLANNER_PATTERNS = [
  /\b(planner|task|sprint|backlog|kanban|board|assigned.*task|my task)\b/i,
  /\b(what.*assigned|pending task|open task|task.*due|due.*task)\b/i,
];

const TELEGRAM_PATTERNS = [
  /\b(telegram|send.*notification|notify.*me|ping me|alert me|message me)\b/i,
  /\b(send.*telegram|telegram.*message|telegram.*notify|notify.*telegram)\b/i,
  /\b(let me know.*telegram|telegram.*let me know)\b/i,
];

const MEMORY_PATTERNS = [
  /\b(remember|recall|memor|what did (i|we|you)|previous|last time|before|earlier)\b/i,
  /\b(history|past|my (actions|tasks|work|output|report)|what.*done|what.*happened)\b/i,
  /\b(search.*memory|search.*memories|check.*memory|look.*back|look.*up.*past)\b/i,
  /\b(my.*log|my.*audit|my.*record|my.*activity|what.*completed|what.*finished)\b/i,
  /\b(context|recap|summary of (my|our|past)|catch me up|bring me up to speed)\b/i,
  /\b(review.*work|review.*output|previous.*result|past.*workflow)\b/i,
];

const DELEGATE_PATTERNS = [
  /\b(delegate|hand\s*off|hand off)\s+(to\s+)?\w+/i,
  /\b(assign|send|forward|pass|route)\s+(to|this to)\s+\w+/i,
  /\b(ask|tell|have)\s+\w+\s+(to\s+)/i,
  /\b(task\s+for|job\s+for|work\s+for)\s+\w+/i,
];

const X_POST_PATTERNS = [
  /\b(post|tweet|publish|send)\s+(to|on)\s+(x|twitter)\b/i,
  /\b(tweet|post)\s*(this|that|it|about|:)/i,
  /\b(share|announce|publish)\s+(on|to)\s+(x|twitter)\b/i,
  /\b(draft|compose|write)\s+(a\s+)?(tweet|x post|post for x)\b/i,
];

const X_SEARCH_PATTERNS = [
  /\b(search|find|look up|trending|what.*(hot|trending))\s+(on\s+)?(x|twitter)\b/i,
  /\b(x|twitter)\s+(trends?|search|mentions?|hot topics?)\b/i,
  /\b(check|monitor)\s+(x|twitter)\b/i,
];

const VIDEO_COMPOSE_PATTERNS = [
  /\b(compose|create|make|build|assemble)\s+(a\s+)?(video|short|clip|reel)\b/i,
  /\b(video|short)\s+(composition|assembly|creation)\b/i,
  /\b(ffmpeg|concatenate|overlay|slideshow)\b/i,
  /\b(add\s+text|burn\s+text|text\s+overlay)\s+(to|on)\s+(video|clip)\b/i,
];

const VIDEO_GENERATE_PATTERNS = [
  /\b(generate|ai\s+generate|create\s+ai)\s+(video|clip|animation)\b/i,
  /\b(text.to.video|image.to.video|video.to.video|t2v|i2v|v2v)\b/i,
  /\b(cogvideo|comfyui|hunyuan)\s*(video)?\b/i,
  /\b(animate)\s+(image|photo|picture)\b/i,
];

const FLUX1_PATTERNS = [
  /\b(generate|create|make)\s+(an?\s+)?(image|picture|graphic|thumbnail|visual)\b/i,
  /\b(flux|flux1|image\s+generation|ai\s+image)\b/i,
  /\b(design|produce)\s+(an?\s+)?(banner|poster|cover|artwork)\b/i,
];

const YOUTUBE_SEARCH_PATTERNS = [
  /\b(search|find|look up|trending)\s+(on\s+)?youtube\b/i,
  /\b(youtube)\s+(trends?|search|videos?|topics?|channels?)\b/i,
  /\b(check|monitor|scrape)\s+youtube\b/i,
  /\b(youtube)\s+(shorts?|content|creators?)\b/i,
];

const YOUTUBE_UPLOAD_PATTERNS = [
  /\b(upload|publish|post)\s+(to|on)\s+youtube\b/i,
  /\b(youtube)\s+(upload|publish|short)\b/i,
  /\b(create|make|compose)\s+(a\s+)?(youtube\s+)?short\b/i,
];

// ── Agent → allowed tools map (from WF-107 approved proposals) ───────────────
// Controls which tools can fire for which agent — prevents unnecessary DB hits.

const AGENT_TOOL_PERMISSIONS: Record<string, string[]> = {
  // ── Executives ───────────────────────────────────────────────────────
  atlas:       ["subscription", "calendar", "ledger", "team", "telegram", "memory", "delegate"],
  binky:       ["calendar", "knowledge", "telegram", "memory", "delegate"],
  cheryl:      ["subscription", "team", "knowledge", "crm", "calendar", "email", "userProfile", "telegram", "memory", "delegate"],
  tina:        ["calendar", "ledger", "crm", "subscription", "policy", "telegram", "memory", "delegate"],
  larry:       ["calendar", "ledger", "legal", "ipRegister", "policy", "telegram", "memory", "delegate"],
  jenny:       ["calendar", "legal", "policy", "knowledge", "telegram", "memory", "delegate"],
  benny:       ["calendar", "legal", "ipRegister", "knowledge", "telegram", "memory", "delegate"],

  // ── Ops & Support ────────────────────────────────────────────────────
  petra:       ["calendar", "planner", "telegram", "memory", "delegate"],
  mercer:      ["crm", "email", "knowledge", "telegram", "memory", "delegate"],
  frank:       ["userProfile", "telegram", "memory", "delegate"],
  sandy:       ["calendar", "email", "userProfile", "telegram", "memory", "delegate"],
  claire:      ["calendar", "email", "telegram", "memory", "delegate"],
  "daily-intel": ["calendar", "email", "knowledge", "telegram", "memory", "delegate"],

  // ── Content & Comms ──────────────────────────────────────────────────
  sunday:      ["calendar", "knowledge", "email", "telegram", "memory", "delegate", "xSearch"],
  archy:       ["calendar", "knowledge", "email", "telegram", "memory", "delegate"],
  venny:       ["calendar", "knowledge", "telegram", "memory", "delegate", "youtubeSearch", "youtubeUpload", "flux1"],
  victor:      ["calendar", "knowledge", "telegram", "memory", "delegate", "youtubeSearch", "videoCompose", "videoGenerate"],
  reynolds:    ["calendar", "knowledge", "telegram", "memory", "delegate"],

  // ── Social Publishers ────────────────────────────────────────────────
  kelly:       ["calendar", "knowledge", "telegram", "memory", "delegate", "xPost", "xSearch"],
  fran:        ["calendar", "knowledge", "telegram", "memory", "delegate"],
  dwight:      ["calendar", "knowledge", "telegram", "memory", "delegate"],
  timmy:       ["calendar", "knowledge", "telegram", "memory", "delegate"],
  terry:       ["calendar", "knowledge", "telegram", "memory", "delegate"],
  cornwall:    ["calendar", "knowledge", "telegram", "memory", "delegate"],
  link:        ["calendar", "knowledge", "crm", "telegram", "memory", "delegate"],
  emma:        ["calendar", "knowledge", "crm", "telegram", "memory", "delegate"],
  donna:       ["calendar", "knowledge", "telegram", "memory", "delegate"],
  penny:       ["calendar", "knowledge", "crm", "telegram", "memory", "delegate"],
};

export type ToolNeeds = {
  subscription: boolean;
  team:         boolean;
  knowledge:    boolean;
  calendar:     boolean;
  crm:          boolean;
  ledger:       boolean;
  email:        boolean;
  userProfile:  boolean;
  policy:       boolean;
  legal:        boolean;
  ipRegister:   boolean;
  planner:      boolean;
  telegram:     boolean;
  memory:       boolean;
  delegate:     boolean;
  xPost:          boolean;
  xSearch:        boolean;
  youtubeSearch:  boolean;
  youtubeUpload:  boolean;
  videoCompose:   boolean;
  videoGenerate:  boolean;
  flux1:          boolean;
  query:          string;
};

export function detectToolNeeds(query: string, agentId?: string): ToolNeeds {
  const q       = query.trim();
  const allowed = agentId ? (AGENT_TOOL_PERMISSIONS[agentId] ?? []) : Object.values(AGENT_TOOL_PERMISSIONS).flat();

  const can = (key: string) => allowed.includes(key);

  return {
    subscription: can("subscription") && SUBSCRIPTION_PATTERNS.some(p => p.test(q)),
    team:         can("team")         && TEAM_PATTERNS.some(p => p.test(q)),
    knowledge:    can("knowledge")    && PRODUCT_PATTERNS.some(p => p.test(q)),
    calendar:     can("calendar")     && CALENDAR_PATTERNS.some(p => p.test(q)),
    crm:          can("crm")          && CRM_PATTERNS.some(p => p.test(q)),
    ledger:       can("ledger")       && LEDGER_PATTERNS.some(p => p.test(q)),
    email:        can("email")        && EMAIL_PATTERNS.some(p => p.test(q)),
    userProfile:  can("userProfile")  && USER_PROFILE_PATTERNS.some(p => p.test(q)),
    policy:       can("policy")       && POLICY_PATTERNS.some(p => p.test(q)),
    legal:        can("legal")        && LEGAL_PATTERNS.some(p => p.test(q)),
    ipRegister:   can("ipRegister")   && IP_REGISTER_PATTERNS.some(p => p.test(q)),
    planner:      can("planner")      && PLANNER_PATTERNS.some(p => p.test(q)),
    telegram:     can("telegram")     && TELEGRAM_PATTERNS.some(p => p.test(q)),
    memory:       can("memory")       && MEMORY_PATTERNS.some(p => p.test(q)),
    delegate:     can("delegate")     && DELEGATE_PATTERNS.some(p => p.test(q)),
    xPost:          can("xPost")          && X_POST_PATTERNS.some(p => p.test(q)),
    xSearch:        can("xSearch")        && X_SEARCH_PATTERNS.some(p => p.test(q)),
    youtubeSearch:  can("youtubeSearch")  && YOUTUBE_SEARCH_PATTERNS.some(p => p.test(q)),
    youtubeUpload:  can("youtubeUpload")  && YOUTUBE_UPLOAD_PATTERNS.some(p => p.test(q)),
    videoCompose:   can("videoCompose")   && VIDEO_COMPOSE_PATTERNS.some(p => p.test(q)),
    videoGenerate:  can("videoGenerate")  && VIDEO_GENERATE_PATTERNS.some(p => p.test(q)),
    flux1:          can("flux1")          && FLUX1_PATTERNS.some(p => p.test(q)),
    query:          q,
  };
}

// ── resolveAgentTools ─────────────────────────────────────────────────────────

/**
 * Run all tools whose patterns match the query (filtered by agent permissions).
 * Returns a formatted [AGENT TOOL RESULTS] block, or "" if nothing matched.
 */
export async function resolveAgentTools(
  tenantId: string,
  query:    string,
  agentId?: string,
): Promise<string> {
  const needs = detectToolNeeds(query, agentId);
  const aid   = agentId ?? "unknown";

  const anyNeeded = Object.entries(needs).some(([k, v]) => k !== "query" && v === true);
  if (!anyNeeded) return "";

  const jobs: Promise<ToolResult | null>[] = [
    needs.subscription ? getSubscriptionInfo(tenantId)                         : Promise.resolve(null),
    needs.team         ? getTeamMembers(tenantId)                              : Promise.resolve(null),
    needs.knowledge    ? searchAtlasUXKnowledge(tenantId, needs.query)         : Promise.resolve(null),
    needs.calendar     ? readCalendar(tenantId)                                : Promise.resolve(null),
    needs.crm          ? readCrmContacts(tenantId, needs.query.slice(0, 60))   : Promise.resolve(null),
    needs.ledger       ? readLedger(tenantId)                                  : Promise.resolve(null),
    needs.email        ? readEmail(tenantId, aid)                              : Promise.resolve(null),
    needs.userProfile  ? readUserProfile(tenantId)                             : Promise.resolve(null),
    needs.policy       ? readPolicyDocs(tenantId, needs.query)                 : Promise.resolve(null),
    needs.legal        ? readLegalDocs(tenantId, needs.query)                  : Promise.resolve(null),
    needs.ipRegister   ? readIpRegister(tenantId)                              : Promise.resolve(null),
    needs.planner      ? readPlanner(tenantId)                                 : Promise.resolve(null),
    needs.telegram     ? sendTelegramMessage(tenantId, needs.query)            : Promise.resolve(null),
    needs.memory       ? searchMyMemories(tenantId, aid, needs.query)          : Promise.resolve(null),
    needs.delegate     ? delegateTask(tenantId, aid, needs.query)              : Promise.resolve(null),
    needs.xPost          ? postToX(tenantId, aid, needs.query)                   : Promise.resolve(null),
    needs.xSearch        ? searchX(tenantId, needs.query)                        : Promise.resolve(null),
    needs.youtubeSearch  ? searchYouTube(tenantId, needs.query)                  : Promise.resolve(null),
    needs.youtubeUpload  ? youtubeUploadInfo(tenantId)                           : Promise.resolve(null),
    needs.videoCompose   ? videoComposeInfo()                                     : Promise.resolve(null),
    needs.videoGenerate  ? videoGenerateInfo()                                    : Promise.resolve(null),
    needs.flux1          ? flux1GenerateInfo()                                    : Promise.resolve(null),
  ];

  const results = (await Promise.all(jobs)).filter(Boolean) as ToolResult[];
  if (!results.length) return "";

  const blocks = results.map(r =>
    `### Tool: ${r.tool}\n_Retrieved: ${r.usedAt}_\n\n${r.data}`
  );

  return `[AGENT TOOL RESULTS]\nThe following live data was retrieved to answer this question accurately:\n\n${blocks.join("\n\n---\n\n")}`;
}
