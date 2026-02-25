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
 *
 * Usage: resolveAgentTools(tenantId, query, agentId) — returns formatted context string.
 */

import { prisma }       from "../../prisma.js";
import { getKbContext } from "../kb/getKbContext.js";
import { callGraph }    from "../../lib/m365Tools.js";

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

// ── Agent → allowed tools map (from WF-107 approved proposals) ───────────────
// Controls which tools can fire for which agent — prevents unnecessary DB hits.

const AGENT_TOOL_PERMISSIONS: Record<string, string[]> = {
  atlas:       ["subscription", "calendar", "ledger", "team"],
  binky:       ["calendar", "knowledge"],
  cheryl:      ["subscription", "team", "knowledge", "crm", "calendar", "email", "userProfile"],
  tina:        ["calendar", "ledger", "crm", "subscription", "policy"],
  larry:       ["calendar", "ledger", "legal", "ipRegister"],
  jenny:       ["calendar", "legal"],
  benny:       ["calendar", "legal"],
  petra:       ["calendar", "planner"],
  mercer:      ["crm", "email"],
  frank:       ["userProfile"],
  sandy:       ["calendar", "email", "userProfile"],
  "daily-intel": ["calendar", "email"],
  emma:        ["crm"],
  claire:      ["calendar"],
  link:        ["calendar"],
  cornwall:    ["calendar"],
  donna:       ["calendar"],
  kelly:       ["calendar"],
  timmy:       ["calendar"],
  fran:        ["calendar"],
  dwight:      ["calendar"],
  reynolds:    ["calendar"],
  terry:       ["calendar"],
  penny:       ["calendar"],
  archy:       ["calendar"],
  venny:       ["calendar"],
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
  query:        string;
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
    query:        q,
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
  ];

  const results = (await Promise.all(jobs)).filter(Boolean) as ToolResult[];
  if (!results.length) return "";

  const blocks = results.map(r =>
    `### Tool: ${r.tool}\n_Retrieved: ${r.usedAt}_\n\n${r.data}`
  );

  return `[AGENT TOOL RESULTS]\nThe following live data was retrieved to answer this question accurately:\n\n${blocks.join("\n\n---\n\n")}`;
}
