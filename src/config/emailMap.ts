export const agentEmails = {
  // Core
  ATLAS: "atlas@deadapp.info",
  ATLAS_CEO: "atlas.ceo@deadapp.info",

  // Team Binky
  BINKY: "binky.cro@deadapp.info",
  MERCER: "mercer.teambinky@deadapp.info",
  ARCHY: "archy.binkypro@deadapp.info",
  DAILY_INTEL: "daily-intel@deadapp.info",
  SUNDAY: "sunday.teambinky@deadapp.info",

  // Creative + channels
  VENNY: "venny.videographer@deadapp.info",
  CORNWALL: "cornwall.pinterest@deadapp.info",
  DONNA: "donna.redditor@deadapp.info",
  DWIGHT: "dwight.threads@deadapp.info",
  EMMA: "emma.alignable@deadapp.info",
  FRAN: "fran.facebook@deadapp.info",
  KELLY: "kelly.x@deadapp.info",
  LINK: "link.linkedin@deadapp.info",
  REYNOLDS: "reynolds.blogger@deadapp.info",
  TERRY: "terry.tumblr@deadapp.info",
  TIMMY: "timmy.tiktok@deadapp.info",
  PENNY: "penny.facebookad@deadapp.info",

  // Governance / exec
  JENNY: "jenny.clo@deadapp.info",
  BENNY: "benny.cto@deadapp.info",
  LARRY: "larry.auditor@deadapp.info",
  TINA: "tina.cfo@deadapp.info",

  // Customer-facing
  CHERYL: "support@deadapp.info",

  // System
  POSTMASTER: "postmaster@deadapp.info",
  ABUSE: "abuse@deadapp.info",
} as const;

export type AgentEmailKey = keyof typeof agentEmails;
