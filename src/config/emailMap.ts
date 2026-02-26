export const agentEmails = {
  // C-Suite & Core
  ATLAS:      "atlas@deadapp.info",
  BINKY:      "binky.cro@deadapp.info",
  BENNY:      "benny.cto@deadapp.info",
  TINA:       "tina.cfo@deadapp.info",
  LARRY:      "larry.auditor@deadapp.info",
  JENNY:      "jenny.clo@deadapp.info",
  CHERYL:     "support@deadapp.info",

  // Team Binky
  ARCHY:      "archy.binkypro@deadapp.info",
  MERCER:     "mercer.teambinky@deadapp.info",
  SUNDAY:     "sunday.teambinky@deadapp.info",
  DAILY_INTEL:"daily-intel@deadapp.info",

  // Social Media Agents
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

  // Shared Inboxes
  POSTMASTER: "postmaster@deadapp.info",
  ABUSE:      "abuse@deadapp.info",
} as const;

export type AgentEmailKey = keyof typeof agentEmails;
