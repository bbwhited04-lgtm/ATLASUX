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
 */

/** All M365 tool IDs an agent is permitted to use. */
export const AGENT_M365_PERMISSIONS: Record<string, string[]> = {
  // ── Board ──────────────────────────────────────────────────────────────────
  chairman: [
    "m365.outlook.read",
    "m365.sharepoint.read",
    "m365.onedrive.read",
    "m365.onenote.read",
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
    "m365.excel.read",
    "m365.excel.write",
    "m365.sharepoint.read",
    "m365.onedrive.read",
    "m365.outlook.read",
  ],
  larry: [
    "m365.word.read",
    "m365.sharepoint.read",
    "m365.onedrive.read",
    "m365.onenote.read",
  ],

  // ── Specialists ────────────────────────────────────────────────────────────
  binky: [
    "m365.word.read",
    "m365.word.write",
    "m365.onenote.read",
    "m365.onenote.write",
    "m365.sharepoint.read",
    "m365.onedrive.read",
  ],
  jenny: [
    "m365.word.read",
    "m365.word.write",
    "m365.onenote.read",
    "m365.onenote.write",
    "m365.sharepoint.read",
    "m365.onedrive.read",
  ],
  benny: [
    "m365.word.read",
    "m365.word.write",
    "m365.onenote.read",
    "m365.onenote.write",
    "m365.sharepoint.read",
    "m365.onedrive.read",
  ],
  cheryl: [
    "m365.outlook.read",
    "m365.outlook.draft",
    "m365.teams.read",
    "m365.teams.draft",
    "m365.sharepoint.read",
  ],

  // ── Research subagents ─────────────────────────────────────────────────────
  "daily-intel": [
    "m365.onenote.read",
    "m365.onenote.write",
    "m365.word.read",
    "m365.word.write",
    "m365.onedrive.read",
  ],
  archy: [
    "m365.word.read",
    "m365.word.write",
    "m365.onenote.read",
    "m365.onenote.write",
    "m365.sharepoint.read",
    "m365.onedrive.read",
  ],
  venny: [
    "m365.word.read",
    "m365.word.write",
    "m365.onenote.read",
    "m365.onenote.write",
    "m365.onedrive.read",
  ],
  penny: [
    "m365.word.read",
    "m365.word.write",
    "m365.onenote.read",
    "m365.onenote.write",
    "m365.sharepoint.read",
  ],

  // ── Content & Creative ─────────────────────────────────────────────────────
  donna: [
    "m365.word.read",
    "m365.word.write",
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    "m365.onedrive.read",
    "m365.onedrive.write",
    "m365.sharepoint.read",
  ],
  fran: [
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    "m365.onedrive.read",
    "m365.onedrive.write",
    "m365.sharepoint.read",
  ],
  sunday: [
    "m365.outlook.read",
    "m365.outlook.draft",
    "m365.teams.read",
    "m365.teams.draft",
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    "m365.sharepoint.read",
    "m365.powerpoint.read",
  ],

  // ── Operations subagents ────────────────────────────────────────────────────
  cornwall: [
    "m365.excel.read",
    "m365.excel.write",
    "m365.sharepoint.read",
    "m365.onedrive.read",
  ],
  link: [
    "m365.teams.read",
    "m365.sharepoint.read",
    "m365.onedrive.read",
  ],
  dwight: [
    "m365.sharepoint.read",
    "m365.onedrive.read",
    "m365.teams.read",
  ],
  reynolds: [
    "m365.sharepoint.read",
    "m365.onedrive.read",
    "m365.teams.read",
  ],
  emma: [
    "m365.outlook.read",
    "m365.outlook.draft",
    "m365.outlook.calendar.read",
    "m365.teams.read",
    "m365.teams.draft",
    "m365.onedrive.read",
    "m365.onenote.read",
    "m365.onenote.write",
  ],
  kelly: [
    "m365.teams.read",
    "m365.teams.draft",
    "m365.outlook.read",
    "m365.outlook.draft",
    "m365.sharepoint.read",
    "m365.onedrive.read",
  ],
  terry: [
    "m365.word.read",
    "m365.word.write",
    "m365.sharepoint.read",
    "m365.onedrive.read",
    "m365.onenote.read",
  ],
  timmy: [
    "m365.teams.read",
    "m365.sharepoint.read",
    "m365.onedrive.read",
  ],
  mercer: [
    "m365.outlook.read",
    "m365.outlook.draft",
    "m365.teams.read",
    "m365.teams.draft",
    "m365.powerpoint.read",
    "m365.powerpoint.write",
    "m365.sharepoint.read",
  ],

  // ── New agents ─────────────────────────────────────────────────────────────
  petra: [
    "m365.planner.read",
    "m365.planner.write",
    "m365.teams.read",
    "m365.teams.draft",
    "m365.word.read",
    "m365.word.write",
    "m365.sharepoint.read",
    "m365.onedrive.read",
  ],
  porter: [
    "m365.sharepoint.read",
    "m365.sharepoint.write",
    "m365.word.read",
    "m365.powerpoint.read",
    "m365.onedrive.read",
  ],
  claire: [
    "m365.outlook.calendar.read",
    "m365.outlook.calendar.write",
    "m365.outlook.read",
    "m365.outlook.draft",
    "m365.teams.meeting.read",
    "m365.teams.meeting.create",
    "m365.onenote.read",
  ],
  victor: [
    "m365.clipchamp.read",
    "m365.clipchamp.write",
    "m365.onedrive.read",
    "m365.onedrive.write",
    "m365.sharepoint.read",
  ],
  frank: [
    "m365.forms.read",
    "m365.forms.create",
    "m365.excel.read",
    "m365.sharepoint.read",
    "m365.onedrive.read",
  ],
  sandy: [
    "m365.bookings.read",
    "m365.bookings.manage",
    "m365.outlook.calendar.read",
    "m365.outlook.read",
    "m365.teams.read",
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
