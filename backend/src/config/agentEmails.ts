/**
 * Backend-side agent email map.
 *
 * ATLAS is the only licensed mailbox. All other addresses are shared inboxes with Send As delegated to ATLAS.
 *
 * You can override any address via env vars:
 *   AGENT_EMAIL_ATLAS, AGENT_EMAIL_BINKY, ...
 */

const fallback = {
  // ── C-Suite & Core ────────────────────────────────────────────────────────
  ATLAS:      "atlas@deadapp.info",
  BINKY:      "binky.cro@deadapp.info",
  BENNY:      "benny.cto@deadapp.info",
  TINA:       "tina.cfo@deadapp.info",
  LARRY:      "larry.auditor@deadapp.info",
  JENNY:      "jenny.clo@deadapp.info",
  CHERYL:     "support@deadapp.info",

  // ── Team Binky ────────────────────────────────────────────────────────────
  ARCHY:      "archy.binkypro@deadapp.info",
  MERCER:     "mercer.teambinky@deadapp.info",
  SUNDAY:     "sunday.teambinky@deadapp.info",

  // ── Social Media Agents ───────────────────────────────────────────────────
  CORNWALL:   "cornwall.pinterest@deadapp.info",
  DONNA:      "donna.redditor@deadapp.info",
  DWIGHT:     "dwight.threads@deadapp.info",
  EMMA:       "emma.alignable@deadapp.info",
  FRAN:       "fran.facebook@deadapp.info",
  KELLY:      "kelly.x@deadapp.info",
  LINK:       "link.linkedin@deadapp.info",
  PENNY:      "penny.facebook@deadapp.info",
  REYNOLDS:   "reynolds.blogger@deadapp.info",
  TERRY:      "terry.tumblr@deadapp.info",
  TIMMY:      "timmy.tiktok@deadapp.info",
  VENNY:      "venny.videographer@deadapp.info",

  // ── Shared Inboxes ────────────────────────────────────────────────────────
  POSTMASTER: "postermaster@deadapp.info",
  ABUSE:      "abuse@deadapp.info",
  DAILY_INTEL:"daily-intel@deadapp.info",

  // ── New Agents (2026-02-25) ───────────────────────────────────────────────
  CLAIRE:     "claire@deadapp.info",
  PETRA:      "petra.coordinator@deadapp.info",
  PORTER:     "porter~portalmanager@deadapp.info",
  SANDY:      "sandy.bookings@deadapp.info",
  VICTOR:     "victor.videoproductionspecialist@deadapp.info",
  FRANK:      "frank.forms@deadapp.info",
} as const;

export type AgentEmailKey = keyof typeof fallback;

export const agentEmails: Record<AgentEmailKey, string> = Object.fromEntries(
  Object.entries(fallback).map(([k, v]) => {
    const envKey = `AGENT_EMAIL_${k}`;
    const envVal = process.env[envKey];
    return [k, (envVal && envVal.trim()) ? envVal.trim() : v];
  })
) as Record<AgentEmailKey, string>;
