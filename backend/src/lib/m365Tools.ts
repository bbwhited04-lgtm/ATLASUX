/**
 * m365Tools.ts
 *
 * Microsoft Graph API client and M365 tool definitions for Atlas UX agents.
 *
 * Architecture:
 *  - ALL write/send/manage actions require Atlas approval.
 *  - Destructive admin actions also require human-in-loop.
 *  - Read and Draft actions are non-executing: agents produce output, Atlas decides to act.
 *  - Spend = $0 always. No paid M365 add-ons activated without human approval.
 *
 * Graph API base: https://graph.microsoft.com/v1.0
 * M365 portal:    https://m365.cloud.microsoft
 */

export const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
export const M365_PORTAL = "https://m365.cloud.microsoft";
export const M365_ADMIN_PORTAL = "https://admin.microsoft.com";

// ── Graph API client ─────────────────────────────────────────────────────────

export async function callGraph(
  accessToken: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<any> {
  const url = path.startsWith("http") ? path : `${GRAPH_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ConsistencyLevel: "eventual",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Graph API ${method} ${path} → ${res.status}: ${
        (err as any)?.error?.message ?? JSON.stringify(err)
      }`
    );
  }

  return res.status === 204 ? null : res.json();
}

// ── Tool definitions ─────────────────────────────────────────────────────────

export type M365App =
  | "outlook"
  | "teams"
  | "word"
  | "excel"
  | "powerpoint"
  | "onenote"
  | "onedrive"
  | "sharepoint"
  | "clipchamp"
  | "admin"
  | "forms"
  | "planner"
  | "bookings";

export type M365Action =
  | "read"
  | "draft"
  | "write"
  | "send"
  | "create"
  | "manage"
  | "admin";

export type M365ToolDefinition = {
  /** Unique tool ID, e.g. "m365.outlook.read" */
  id: string;
  name: string;
  app: M365App;
  action: M365Action;
  description: string;
  /** Primary Graph API endpoint path */
  graphEndpoint: string;
  graphMethod: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** If true, only Atlas may invoke this tool */
  atlasOnly: boolean;
  /** If true, a human must explicitly approve before execution */
  requiresHumanApproval: boolean;
  /** Always $0 — enforced at engine level */
  spendsUsd: 0;
  /** Graph OAuth scopes required */
  scopes: string[];
};

export const M365_TOOLS: M365ToolDefinition[] = [
  // ── Outlook ────────────────────────────────────────────────────────────────
  {
    id: "m365.outlook.read",
    name: "Read Outlook Inbox",
    app: "outlook",
    action: "read",
    description: "Read inbox messages and folder contents via Microsoft Graph.",
    graphEndpoint: "/me/messages",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Mail.Read"],
  },
  {
    id: "m365.outlook.draft",
    name: "Draft Email (no send)",
    app: "outlook",
    action: "draft",
    description: "Create a draft email in the drafts folder. Does not send.",
    graphEndpoint: "/me/messages",
    graphMethod: "POST",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Mail.ReadWrite"],
  },
  {
    id: "m365.outlook.send",
    name: "Send Email via Outlook",
    app: "outlook",
    action: "send",
    description: "Send an email on behalf of an agent. Requires Atlas + human approval.",
    graphEndpoint: "/me/sendMail",
    graphMethod: "POST",
    atlasOnly: true,
    requiresHumanApproval: true,
    spendsUsd: 0,
    scopes: ["Mail.Send"],
  },
  {
    id: "m365.outlook.calendar.read",
    name: "Read Calendar",
    app: "outlook",
    action: "read",
    description: "Read calendar events and meeting schedules.",
    graphEndpoint: "/me/calendar/events",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Calendars.Read"],
  },
  {
    id: "m365.outlook.calendar.write",
    name: "Create/Update Calendar Event",
    app: "outlook",
    action: "write",
    description: "Create or update calendar events. Requires Atlas + human approval.",
    graphEndpoint: "/me/calendar/events",
    graphMethod: "POST",
    atlasOnly: true,
    requiresHumanApproval: true,
    spendsUsd: 0,
    scopes: ["Calendars.ReadWrite"],
  },

  // ── Teams ──────────────────────────────────────────────────────────────────
  {
    id: "m365.teams.read",
    name: "Read Teams Channels",
    app: "teams",
    action: "read",
    description: "Read Teams channels, messages, and membership.",
    graphEndpoint: "/me/joinedTeams",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Team.ReadBasic.All", "ChannelMessage.Read.All"],
  },
  {
    id: "m365.teams.draft",
    name: "Draft Teams Message",
    app: "teams",
    action: "draft",
    description: "Compose a Teams message for Atlas review. Does not send.",
    graphEndpoint: "/teams/{id}/channels/{id}/messages",
    graphMethod: "POST",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["ChannelMessage.Read.All"],
  },
  {
    id: "m365.teams.send",
    name: "Send Teams Message",
    app: "teams",
    action: "send",
    description: "Post a message to a Teams channel. Requires Atlas + human approval.",
    graphEndpoint: "/teams/{id}/channels/{id}/messages",
    graphMethod: "POST",
    atlasOnly: true,
    requiresHumanApproval: true,
    spendsUsd: 0,
    scopes: ["ChannelMessage.Send"],
  },
  {
    id: "m365.teams.meeting.read",
    name: "Read Teams Meetings",
    app: "teams",
    action: "read",
    description: "Read scheduled Teams meetings and online meeting details.",
    graphEndpoint: "/me/onlineMeetings",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["OnlineMeetings.Read"],
  },
  {
    id: "m365.teams.meeting.create",
    name: "Create Teams Meeting",
    app: "teams",
    action: "create",
    description: "Schedule a Teams online meeting. Requires Atlas + human approval.",
    graphEndpoint: "/me/onlineMeetings",
    graphMethod: "POST",
    atlasOnly: true,
    requiresHumanApproval: true,
    spendsUsd: 0,
    scopes: ["OnlineMeetings.ReadWrite"],
  },

  // ── Word ───────────────────────────────────────────────────────────────────
  {
    id: "m365.word.read",
    name: "Read Word Documents",
    app: "word",
    action: "read",
    description: "Read Word documents from OneDrive or SharePoint via Graph.",
    graphEndpoint: "/me/drive/root/search(q='.docx')",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.Read.All"],
  },
  {
    id: "m365.word.write",
    name: "Create/Edit Word Document",
    app: "word",
    action: "write",
    description: "Create or edit Word documents. Agent drafts; Atlas approves upload.",
    graphEndpoint: "/me/drive/items/{id}/content",
    graphMethod: "PUT",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.ReadWrite.All"],
  },

  // ── Excel ──────────────────────────────────────────────────────────────────
  {
    id: "m365.excel.read",
    name: "Read Excel Workbooks",
    app: "excel",
    action: "read",
    description: "Read Excel workbooks, sheets, and cell ranges via Graph.",
    graphEndpoint: "/me/drive/root/search(q='.xlsx')",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.Read.All"],
  },
  {
    id: "m365.excel.write",
    name: "Create/Edit Excel Workbook",
    app: "excel",
    action: "write",
    description: "Create or update Excel sheets and ranges. Agent drafts; Atlas approves.",
    graphEndpoint: "/me/drive/items/{id}/workbook/worksheets/{id}/range",
    graphMethod: "PATCH",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.ReadWrite.All"],
  },

  // ── PowerPoint ─────────────────────────────────────────────────────────────
  {
    id: "m365.powerpoint.read",
    name: "Read PowerPoint Files",
    app: "powerpoint",
    action: "read",
    description: "Read PowerPoint presentations from OneDrive or SharePoint.",
    graphEndpoint: "/me/drive/root/search(q='.pptx')",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.Read.All"],
  },
  {
    id: "m365.powerpoint.write",
    name: "Create/Edit PowerPoint",
    app: "powerpoint",
    action: "write",
    description: "Create or update PowerPoint presentations. Agent drafts; Atlas approves.",
    graphEndpoint: "/me/drive/items/{id}/content",
    graphMethod: "PUT",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.ReadWrite.All"],
  },

  // ── OneNote ────────────────────────────────────────────────────────────────
  {
    id: "m365.onenote.read",
    name: "Read OneNote Notebooks",
    app: "onenote",
    action: "read",
    description: "Read OneNote notebooks, sections, and pages.",
    graphEndpoint: "/me/onenote/notebooks",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Notes.Read.All"],
  },
  {
    id: "m365.onenote.write",
    name: "Write to OneNote",
    app: "onenote",
    action: "write",
    description: "Create/update OneNote pages and sections. Primary research memory store.",
    graphEndpoint: "/me/onenote/pages",
    graphMethod: "POST",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Notes.ReadWrite.All"],
  },

  // ── OneDrive ───────────────────────────────────────────────────────────────
  {
    id: "m365.onedrive.read",
    name: "Read OneDrive Files",
    app: "onedrive",
    action: "read",
    description: "List and read files stored in OneDrive.",
    graphEndpoint: "/me/drive/root/children",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.Read.All"],
  },
  {
    id: "m365.onedrive.write",
    name: "Upload/Manage OneDrive Files",
    app: "onedrive",
    action: "write",
    description: "Upload, update, or organize files in OneDrive. Atlas approves public shares.",
    graphEndpoint: "/me/drive/root:/{path}:/content",
    graphMethod: "PUT",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.ReadWrite.All"],
  },

  // ── SharePoint ─────────────────────────────────────────────────────────────
  {
    id: "m365.sharepoint.read",
    name: "Read SharePoint Sites & Libraries",
    app: "sharepoint",
    action: "read",
    description: "Read SharePoint sites, document libraries, lists, and pages.",
    graphEndpoint: "/sites",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Sites.Read.All"],
  },
  {
    id: "m365.sharepoint.write",
    name: "Write to SharePoint",
    app: "sharepoint",
    action: "write",
    description: "Create/update SharePoint pages, lists, and library items. Requires Atlas + human for structural changes.",
    graphEndpoint: "/sites/{id}/lists",
    graphMethod: "POST",
    atlasOnly: true,
    requiresHumanApproval: true,
    spendsUsd: 0,
    scopes: ["Sites.ReadWrite.All"],
  },

  // ── Clipchamp (via OneDrive/Files) ─────────────────────────────────────────
  {
    id: "m365.clipchamp.read",
    name: "View Clipchamp Projects",
    app: "clipchamp",
    action: "read",
    description: "Read Clipchamp video projects stored in OneDrive. View exports and media.",
    graphEndpoint: "/me/drive/root:/Clipchamp:/children",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.Read.All"],
  },
  {
    id: "m365.clipchamp.write",
    name: "Manage Clipchamp Projects",
    app: "clipchamp",
    action: "write",
    description: "Upload source media and manage Clipchamp video project files in OneDrive.",
    graphEndpoint: "/me/drive/root:/Clipchamp:/children",
    graphMethod: "POST",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.ReadWrite.All"],
  },

  // ── Microsoft Admin (Atlas only) ───────────────────────────────────────────
  {
    id: "m365.admin.users",
    name: "Manage M365 Users",
    app: "admin",
    action: "admin",
    description: "Create/update/disable M365 user accounts. Atlas only + human approval.",
    graphEndpoint: "/users",
    graphMethod: "GET",
    atlasOnly: true,
    requiresHumanApproval: true,
    spendsUsd: 0,
    scopes: ["User.ReadWrite.All"],
  },
  {
    id: "m365.admin.groups",
    name: "Manage M365 Groups",
    app: "admin",
    action: "admin",
    description: "Create/update Microsoft 365 groups and teams. Atlas only + human approval.",
    graphEndpoint: "/groups",
    graphMethod: "GET",
    atlasOnly: true,
    requiresHumanApproval: true,
    spendsUsd: 0,
    scopes: ["Group.ReadWrite.All"],
  },
  {
    id: "m365.admin.settings",
    name: "View/Manage Org Settings",
    app: "admin",
    action: "admin",
    description: "Read and modify M365 org-level settings. Atlas only + human approval.",
    graphEndpoint: "/organization",
    graphMethod: "GET",
    atlasOnly: true,
    requiresHumanApproval: true,
    spendsUsd: 0,
    scopes: ["Organization.Read.All"],
  },

  // ── Microsoft Forms ────────────────────────────────────────────────────────
  {
    id: "m365.forms.read",
    name: "Read Form Responses",
    app: "forms",
    action: "read",
    description: "Read Microsoft Forms survey/intake responses via OneDrive export.",
    graphEndpoint: "/me/drive/root/search(q='Forms')",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Files.Read.All"],
  },
  {
    id: "m365.forms.create",
    name: "Create/Manage Forms",
    app: "forms",
    action: "create",
    description: "Create new Microsoft Forms for intake, surveys, feedback. Atlas + human approval.",
    graphEndpoint: "/me/drive/root:/Forms",
    graphMethod: "POST",
    atlasOnly: true,
    requiresHumanApproval: true,
    spendsUsd: 0,
    scopes: ["Files.ReadWrite.All"],
  },

  // ── Microsoft Planner ──────────────────────────────────────────────────────
  {
    id: "m365.planner.read",
    name: "Read Planner Tasks & Plans",
    app: "planner",
    action: "read",
    description: "Read Microsoft Planner plans, buckets, and task assignments.",
    graphEndpoint: "/me/planner/tasks",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Tasks.Read"],
  },
  {
    id: "m365.planner.write",
    name: "Create/Update Planner Tasks",
    app: "planner",
    action: "write",
    description: "Create and update Planner tasks and plan structures.",
    graphEndpoint: "/planner/tasks",
    graphMethod: "POST",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Tasks.ReadWrite"],
  },

  // ── Microsoft Bookings ─────────────────────────────────────────────────────
  {
    id: "m365.bookings.read",
    name: "Read Bookings Calendar",
    app: "bookings",
    action: "read",
    description: "Read Microsoft Bookings calendars and appointments.",
    graphEndpoint: "/solutions/bookingBusinesses",
    graphMethod: "GET",
    atlasOnly: false,
    requiresHumanApproval: false,
    spendsUsd: 0,
    scopes: ["Bookings.Read.All"],
  },
  {
    id: "m365.bookings.manage",
    name: "Manage Bookings & Appointments",
    app: "bookings",
    action: "manage",
    description: "Create, update, cancel Bookings appointments. Requires Atlas + human approval.",
    graphEndpoint: "/solutions/bookingBusinesses/{id}/appointments",
    graphMethod: "POST",
    atlasOnly: true,
    requiresHumanApproval: true,
    spendsUsd: 0,
    scopes: ["BookingsAppointment.ReadWrite.All"],
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

const toolMap = new Map(M365_TOOLS.map((t) => [t.id, t]));

export function getTool(id: string): M365ToolDefinition | undefined {
  return toolMap.get(id);
}

export function getToolsByApp(app: M365App): M365ToolDefinition[] {
  return M365_TOOLS.filter((t) => t.app === app);
}

export function getAtlasOnlyTools(): M365ToolDefinition[] {
  return M365_TOOLS.filter((t) => t.atlasOnly);
}

export function getHumanApprovalTools(): M365ToolDefinition[] {
  return M365_TOOLS.filter((t) => t.requiresHumanApproval);
}

/**
 * Validate that a tool invocation is permitted.
 * Returns { ok: true } or { ok: false, reason: string }
 */
export function validateToolInvocation(
  toolId: string,
  agentId: string,
  agentAllowedTools: string[]
): { ok: true } | { ok: false; reason: string } {
  const tool = getTool(toolId);
  if (!tool) return { ok: false, reason: `Unknown tool: ${toolId}` };

  if (!agentAllowedTools.includes(toolId)) {
    return { ok: false, reason: `Agent ${agentId} does not have permission for ${toolId}` };
  }

  if (tool.atlasOnly && agentId !== "atlas") {
    return { ok: false, reason: `Tool ${toolId} is Atlas-only. Agent ${agentId} cannot invoke it directly.` };
  }

  return { ok: true };
}
