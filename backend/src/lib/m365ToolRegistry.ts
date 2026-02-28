/**
 * m365ToolRegistry.ts
 *
 * Per-agent M365 tool access matrix.
 *
 * Rules enforced here (mirrored in schemas/tool-permissions.json):
 *  1. Only Atlas holds write/send/manage/admin tool access directly.
 *  2. Other agents get read + draft access scoped to their role.
 *  3. Atlas-only tools can only be invoked by "atlas" agentId.
 *  4. All writes still require Atlas approval at the engine level.
 *  5. Spend = $0 always.
 *  6. No outside actions without Atlas or human-in-loop.
 *
 * Updated 2026-02-28: Expanded to match all Azure AD permissions granted.
 */

// ── Shared tool sets (DRY) ──────────────────────────────────────────────────

/** Every agent gets at least these read tools */
const BASE_READ = [
  "m365.teams.read",
  "m365.onedrive.read",
  "m365.sharepoint.read",
] as const;

/** Research-focused agents also get these */
const RESEARCH_READ = [
  ...BASE_READ,
  "m365.outlook.read",
  "m365.word.read",
  "m365.onenote.read",
  "m365.onenote.write",
  "m365.planner.read",
] as const;

/** Content-focused agents get drafting tools */
const CONTENT_TOOLS = [
  ...BASE_READ,
  "m365.word.read",
  "m365.word.write",
  "m365.onenote.read",
  "m365.onenote.write",
  "m365.onedrive.write",
] as const;

/** Communication-focused agents */
const COMMS_TOOLS = [
  ...BASE_READ,
  "m365.outlook.read",
  "m365.outlook.draft",
  "m365.teams.draft",
  "m365.onenote.read",
] as const;

// ── Per-agent permissions ───────────────────────────────────────────────────

/** All M365 tool IDs an agent is permitted to use. */
export const AGENT_M365_PERMISSIONS: Record<string, string[]> = {
  // ── Board ──────────────────────────────────────────────────────────────────
  chairman: [
    "m365.outlook.read",
    "m365.teams.read",
    "m365.sharepoint.read",
    "m365.onedrive.read",
    "m365.onenote.read",
    "m365.planner.read",
    "m365.outlook.calendar.read",
  ],

  // ── Atlas: full admin access ───────────────────────────────────────────────
  atlas: [
    // Outlook
    "m365.outlook.read",
    "m365.outlook.draft",
    "m365.outlook.send",
    "m365.outlook.calendar.read",
    "m365.outlook.calendar.write",
    // Teams
    "m365.teams.read",
    "m365.teams.draft",
    "m365.teams.send",
    "m365.teams.meeting.read",
    "m365.teams.meeting.create",
    // Documents
    "m365.word.read",
    "m365.word.write",
    "m365.excel.read",
    "m365.excel.write",
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.onenote.read",
    "m365.onenote.write",
    // Storage
    "m365.onedrive.read",
    "m365.onedrive.write",
    "m365.sharepoint.read",
    "m365.sharepoint.write",
    // Clipchamp
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    // Admin
    "m365.admin.users",
    "m365.admin.groups",
    "m365.admin.settings",
    // Apps
    "m365.forms.read",
    "m365.forms.create",
    "m365.planner.read",
    "m365.planner.write",
    "m365.bookings.read",
    "m365.bookings.manage",
  ],

  // ── Governors ─────────────────────────────────────────────────────────────
  tina: [
    ...COMMS_TOOLS,
    "m365.excel.read",
    "m365.excel.write",
    "m365.word.read",
    "m365.planner.read",
    "m365.outlook.calendar.read",
  ],
  larry: [
    ...RESEARCH_READ,
    "m365.outlook.draft",
    "m365.word.write",
    "m365.excel.read",
    "m365.teams.draft",
  ],

  // ── Executives ────────────────────────────────────────────────────────────
  binky: [
    ...RESEARCH_READ,
    "m365.word.write",
    "m365.outlook.draft",
    "m365.teams.draft",
    "m365.excel.read",
    "m365.powerpoint.read",
    "m365.outlook.calendar.read",
  ],
  jenny: [
    ...RESEARCH_READ,
    "m365.word.write",
    "m365.outlook.draft",
    "m365.teams.draft",
  ],
  benny: [
    ...RESEARCH_READ,
    "m365.word.write",
    "m365.outlook.draft",
  ],
  cheryl: [
    ...COMMS_TOOLS,
    "m365.word.read",
    "m365.planner.read",
    "m365.onenote.write",
    "m365.outlook.calendar.read",
    "m365.bookings.read",
  ],

  // ── Research subagents ─────────────────────────────────────────────────────
  "daily-intel": [
    ...RESEARCH_READ,
    "m365.word.write",
    "m365.outlook.draft",
    "m365.teams.draft",
    "m365.excel.read",
  ],
  archy: [
    ...RESEARCH_READ,
    "m365.word.write",
    "m365.outlook.draft",
    "m365.teams.draft",
    "m365.excel.read",
    "m365.powerpoint.read",
  ],

  // ── Content & Creative ─────────────────────────────────────────────────────
  venny: [
    ...CONTENT_TOOLS,
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.outlook.read",
  ],
  penny: [
    ...CONTENT_TOOLS,
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.excel.read",
    "m365.outlook.read",
  ],
  donna: [
    ...CONTENT_TOOLS,
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    "m365.outlook.read",
  ],
  fran: [
    ...CONTENT_TOOLS,
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    "m365.outlook.read",
  ],
  sunday: [
    ...COMMS_TOOLS,
    "m365.word.read",
    "m365.word.write",
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    "m365.onenote.write",
    "m365.onedrive.write",
    "m365.planner.read",
  ],

  // ── Social media subagents ────────────────────────────────────────────────
  cornwall: [
    ...BASE_READ,
    "m365.word.read",
    "m365.excel.read",
    "m365.excel.write",
    "m365.onenote.read",
    "m365.onedrive.write",
    "m365.outlook.read",
  ],
  link: [
    ...CONTENT_TOOLS,
    "m365.outlook.read",
    "m365.powerpoint.read",
  ],
  dwight: [
    ...BASE_READ,
    "m365.word.read",
    "m365.onenote.read",
    "m365.outlook.read",
    "m365.onedrive.write",
  ],
  reynolds: [
    ...CONTENT_TOOLS,
    "m365.powerpoint.read",
    "m365.outlook.read",
  ],
  emma: [
    ...COMMS_TOOLS,
    "m365.word.read",
    "m365.onenote.write",
    "m365.outlook.calendar.read",
    "m365.planner.read",
    "m365.onedrive.write",
    "m365.bookings.read",
  ],
  kelly: [
    ...COMMS_TOOLS,
    "m365.word.read",
    "m365.onenote.write",
    "m365.onedrive.write",
  ],
  terry: [
    ...CONTENT_TOOLS,
    "m365.outlook.read",
    "m365.powerpoint.read",
  ],
  timmy: [
    ...BASE_READ,
    "m365.word.read",
    "m365.onenote.read",
    "m365.clipchamp.read",
    "m365.outlook.read",
    "m365.onedrive.write",
  ],
  mercer: [
    ...COMMS_TOOLS,
    "m365.word.read",
    "m365.word.write",
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.onenote.write",
    "m365.onedrive.write",
    "m365.planner.read",
    "m365.outlook.calendar.read",
    "m365.bookings.read",
    "m365.excel.read",
  ],

  // ── New agents ─────────────────────────────────────────────────────────────
  petra: [
    ...COMMS_TOOLS,
    "m365.planner.read",
    "m365.planner.write",
    "m365.word.read",
    "m365.word.write",
    "m365.onenote.write",
    "m365.onedrive.write",
    "m365.outlook.calendar.read",
    "m365.teams.meeting.read",
  ],
  porter: [
    ...BASE_READ,
    "m365.sharepoint.write",
    "m365.word.read",
    "m365.word.write",
    "m365.powerpoint.read",
    "m365.onenote.read",
    "m365.onedrive.write",
    "m365.outlook.read",
  ],
  claire: [
    ...COMMS_TOOLS,
    "m365.outlook.calendar.read",
    "m365.outlook.calendar.write",
    "m365.teams.meeting.read",
    "m365.teams.meeting.create",
    "m365.onenote.write",
    "m365.planner.read",
    "m365.bookings.read",
    "m365.word.read",
  ],
  victor: [
    ...BASE_READ,
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    "m365.onedrive.write",
    "m365.word.read",
    "m365.onenote.read",
    "m365.outlook.read",
    "m365.powerpoint.read",
  ],
  frank: [
    ...BASE_READ,
    "m365.forms.read",
    "m365.forms.create",
    "m365.excel.read",
    "m365.excel.write",
    "m365.word.read",
    "m365.onenote.read",
    "m365.onenote.write",
    "m365.outlook.read",
    "m365.onedrive.write",
    "m365.planner.read",
  ],
  sandy: [
    ...COMMS_TOOLS,
    "m365.bookings.read",
    "m365.bookings.manage",
    "m365.outlook.calendar.read",
    "m365.outlook.calendar.write",
    "m365.teams.meeting.read",
    "m365.planner.read",
    "m365.word.read",
  ],
  // Lucy: full M365 access — receptionist needs visibility across everything
  lucy: [
    // Outlook
    "m365.outlook.read",
    "m365.outlook.draft",
    "m365.outlook.send",
    "m365.outlook.calendar.read",
    "m365.outlook.calendar.write",
    // Teams
    "m365.teams.read",
    "m365.teams.draft",
    "m365.teams.send",
    "m365.teams.meeting.read",
    "m365.teams.meeting.create",
    // Documents
    "m365.word.read",
    "m365.word.write",
    "m365.excel.read",
    "m365.excel.write",
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.onenote.read",
    "m365.onenote.write",
    // Storage
    "m365.onedrive.read",
    "m365.onedrive.write",
    "m365.sharepoint.read",
    "m365.sharepoint.write",
    // Clipchamp
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    // Apps
    "m365.forms.read",
    "m365.forms.create",
    "m365.planner.read",
    "m365.planner.write",
    "m365.bookings.read",
    "m365.bookings.manage",
  ],
};

/**
 * Check whether an agent may use a specific M365 tool.
 */
export function canAgentUseTool(agentId: string, toolId: string): boolean {
  return (AGENT_M365_PERMISSIONS[agentId] ?? []).includes(toolId);
}

/**
 * Return the list of M365 tool IDs available to an agent.
 */
export function getAgentM365Tools(agentId: string): string[] {
  return AGENT_M365_PERMISSIONS[agentId] ?? [];
}
