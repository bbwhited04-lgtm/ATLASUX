export type AgentTier = "Board" | "Executive" | "Governor" | "Specialist" | "Subagent";

export type AgentNode = {
  id: string;
  name: string;
  title: string;
  tier: AgentTier;
  reportsTo?: string;

  // Human-readable summary shown in the UI.
  summary: string;

  // What this agent is allowed to decide/recommend inside Atlas UX.
  authority: string[];

  // Hard limits and constitutional constraints.
  constraints: string[];

  // Primary deliverables this agent produces.
  primaryOutputs: string[];

  // Tool access (UI-only, not enforcement). Enforcement happens via SGL/policies.
  toolsAllowed?: string[];
  toolsForbidden?: string[];
};

// NOTE: This registry is intentionally static for now.
// Later, Atlas can load agent definitions from the backend + policies repo.
export const AGENTS: AgentNode[] = [
  // Board / Human authority
  {
    id: "chairman",
    name: "Chairman",
    title: "Chairman of the Board",
    tier: "Board",
    summary:
      "Final human authority. Approves REVIEW actions and governs constitutional changes.",
    authority: [
      "Approve/deny REVIEW packets",
      "Authorize regulated actions",
      "Appoint/retire agents",
    ],
    constraints: ["No SGL bypass", "All approvals logged"],
    primaryOutputs: ["Approval records", "Board directives"],
    toolsAllowed: ["Read-only dashboards", "Approval/deny UI"],
    toolsForbidden: ["Direct execution tools"],
  },

  // Core execution layer
  {
    id: "atlas",
    name: "Atlas",
    title: "President · Sole Execution Layer",
    tier: "Executive",
    reportsTo: "chairman",
    summary:
      "Executes actions only after SGL evaluates ALLOW and human approval is present when required.",
    authority: [
      "Execute allowed actions",
      "Provision internal routines",
      "Compile decision packets",
    ],
    constraints: [
      "SGL controls execution",
      "Human-in-loop for regulated/high-risk",
      "No Microsoft Admin access (human operator only)",
    ],
    primaryOutputs: ["Executed actions", "Audit events", "Status reports"],
    toolsAllowed: ["Internal job runner", "Email dispatch", "Audit writer", "Ledger writer"],
    toolsForbidden: ["Unlogged external actions", "Policy tampering"],
  },

  // Executive research + planning
  {
    id: "binky",
    name: "Binky",
    title: "Chief Research Officer",
    tier: "Executive",
    reportsTo: "atlas",
    summary:
      "Runs daily intel cycles and produces cited reports to inform Atlas decisions. Maintains truth discipline.",
    authority: [
      "Request subagent research",
      "Compile cited reports",
      "Recommend actions",
      "Classify factual claims as VERIFIED/UNVERIFIED",
    ],
    constraints: ["Truth layer: cite sources", "No execution authority", "No spend authority"],
    primaryOutputs: ["Daily intel brief", "Market/compliance research", "Risk notes"],
    toolsAllowed: ["Web research", "Docs reading", "Email drafting"],
    toolsForbidden: ["Direct execution", "Money movement", "Microsoft Admin"],
  },

  // Governors (controls)
  {
    id: "tina",
    name: "Tina",
    title: "Treasurer · Financial Controls",
    tier: "Governor",
    reportsTo: "atlas",
    summary:
      "Controls spend limits, budget enforcement, and financial risk classification.",
    authority: ["Set spend thresholds", "Flag high-risk financial intents", "Require approvals"],
    constraints: ["No SGL bypass", "No unsanctioned transfers"],
    primaryOutputs: ["Budget rules", "Spend approval packets"],
    toolsAllowed: ["Ledger review", "Budget rules editor", "Spend alerts"],
    toolsForbidden: ["Initiating transfers", "Executing payments", "Microsoft Admin"],
  },
  {
    id: "larry",
    name: "Larry",
    title: "Corporate Secretary · Audit & Forensics",
    tier: "Governor",
    reportsTo: "atlas",
    summary:
      "Maintains audit integrity, append-only logs, and forensic trace readiness.",
    authority: ["Audit schema enforcement", "Tamper detection", "Forensic reporting"],
    constraints: ["Append-only", "No log deletion"],
    primaryOutputs: ["Audit traces", "Forensic reports"],
    toolsAllowed: ["Audit viewer", "Forensic export tools"],
    toolsForbidden: ["Deleting/rewriting audit logs", "Microsoft Admin"],
  },

  // Specialists
  {
    id: "jenny",
    name: "Jenny",
    title: "Chief Legal Officer · Corporate & Compliance",
    tier: "Specialist",
    reportsTo: "atlas",
    summary:
      "Reviews corporate/compliance packets and validates policy language for enforceability.",
    authority: ["Review corporate actions", "Draft/validate policies", "Advise on risk"],
    constraints: ["No execution authority", "Escalate ambiguity"],
    primaryOutputs: ["Legal review memos", "Policy updates"],
    toolsAllowed: ["Docs reading", "Policy editor (proposal)", "Email drafting"],
    toolsForbidden: ["Execution tools", "Microsoft Admin"],
  },
  {
    id: "benny",
    name: "Benny",
    title: "CTO · Tooling & Platform Risk",
    tier: "Specialist",
    reportsTo: "atlas",
    summary:
      "Classifies tools/integrations and drafts implementation constraints (blast radius, cost, data handling).",
    authority: [
      "Tool classification (recommendation)",
      "Risk tiering",
      "Recommend allow/deny gates",
    ],
    constraints: ["No execution authority", "No procurement authority", "Cite sources where applicable"],
    primaryOutputs: ["Tool risk packets", "Integration constraints", "Security notes"],
    toolsAllowed: ["Docs reading", "Web research", "Email drafting"],
    toolsForbidden: ["Purchases", "Publishing without Atlas approval", "Microsoft Admin"],
  },

  // Team Binky (intel + acquisition strategy)
  {
    id: "daily-intel",
    name: "Daily-Intel",
    title: "Intel Repository · Daily Briefing",
    tier: "Subagent",
    reportsTo: "binky",
    summary:
      "Aggregates incoming research and drafts the structured daily intelligence packet for Binky.",
    authority: ["Aggregate", "Normalize", "Summarize", "Recommend"],
    constraints: ["Citations required", "No execution"],
    primaryOutputs: ["Daily briefing packet", "Top risks/opportunities"],
    toolsAllowed: ["Web research", "Docs reading", "Email drafting"],
    toolsForbidden: ["Execution tools", "Publishing"],
  },
  {
    id: "archy",
    name: "Archy",
    title: "Research Operations · BinkyPro",
    tier: "Subagent",
    reportsTo: "binky",
    summary:
      "Collects operational intel and summarizes actionable implementation options.",
    authority: ["Research", "Summarize", "Recommend"],
    constraints: ["Citations required", "No execution"],
    primaryOutputs: ["Ops briefs", "Implementation options (pros/cons)"],
    toolsAllowed: ["Web research", "Docs reading"],
    toolsForbidden: ["Execution tools"],
  },
  {
    id: "mercer",
    name: "Mercer",
    title: "Customer Acquisition Strategist · Team Binky",
    tier: "Specialist",
    reportsTo: "binky",
    summary:
      "Designs governed acquisition strategies, runs controlled outreach, and hands qualified prospects to Sales/Support. White-label selling allowed only upon Atlas approval, no special terms.",
    authority: [
      "Define acquisition experiments (proposal)",
      "Run approved outreach",
      "Maintain prospect pipeline + attribution",
      "Propose white-label offers (approval required)",
    ],
    constraints: [
      "No pricing authority",
      "No contracts/commitments",
      "No spend/procurement",
      "All outbound templates require Atlas approval",
      "White-label selling only with explicit Atlas approval; no special conditions or privileges",
      "No Microsoft Admin",
    ],
    primaryOutputs: [
      "Weekly acquisition report",
      "Prospect ledger updates",
      "Campaign proposal packets",
      "Qualified handoff packets to Sales/Support",
    ],
    toolsAllowed: [
      "Email (licensed)",
      "Teams/Calendar",
      "Approved CRM/ledger",
      "Docs drafting",
    ],
    toolsForbidden: ["Procurement", "Pricing changes", "Contract signing", "Microsoft Admin"],
  },
  {
    id: "sunday",
    name: "Sunday",
    title: "Publishing Coordinator · Team Binky",
    tier: "Subagent",
    reportsTo: "binky",
    summary:
      "Coordinates publishing schedules and channel packaging once Atlas approves.",
    authority: ["Prepare publishing packets", "Draft captions", "Organize media metadata"],
    constraints: ["No publishing without Atlas approval"],
    primaryOutputs: ["Publishing packets", "Channel checklists"],
    toolsAllowed: ["Docs drafting", "Email drafting"],
    toolsForbidden: ["Publishing", "Microsoft Admin"],
  },

  // Creative
  {
    id: "venny",
    name: "Venny",
    title: "Videographer · Creative Assets",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Produces image/video assets for channel operators (Pinterest, TikTok, etc.) and maintains clean asset metadata.",
    authority: ["Draft creative concepts", "Prepare asset packets", "Recommend formats"],
    constraints: ["No publishing", "No claims without Binky validation"],
    primaryOutputs: ["Image/video asset packets", "Format specs", "Media metadata"],
    toolsAllowed: ["Local creative tools", "Docs drafting"],
    toolsForbidden: ["Publishing", "Microsoft Admin"],
  },

  // Channel operators (publish only after Atlas approval)
  {
    id: "cornwall",
    name: "Cornwall",
    title: "Pinterest Publisher",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Creates Pinterest-optimized descriptions, tags boards properly, and publishes only after Atlas approval. Produces daily activity report.",
    authority: ["Draft Pinterest descriptions", "Tag/board planning", "Propose posting schedule"],
    constraints: ["No publishing without Atlas approval", "No uncited factual claims"],
    primaryOutputs: ["Pinterest drafts", "Posting packet", "Daily activity report"],
    toolsAllowed: ["Email", "Pinterest (approved)", "Docs drafting"],
    toolsForbidden: ["Unapproved automation", "Microsoft Admin"],
  },
  {
    id: "donna",
    name: "Donna",
    title: "Reddit Publisher / Commenter",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Drafts Reddit posts/comments derived from approved positioning; posts only after Atlas approval; reports engagement insights.",
    authority: ["Draft Reddit content", "Summarize engagement", "Recommend angles"],
    constraints: ["No publishing without Atlas approval", "No harassment", "No uncited factual claims"],
    primaryOutputs: ["Reddit drafts", "Thread engagement report"],
    toolsAllowed: ["Email", "Docs drafting"],
    toolsForbidden: ["Publishing without approval", "Microsoft Admin"],
  },
  {
    id: "dwight",
    name: "Dwight",
    title: "Threads Publisher",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Prepares Threads-ready posts and schedules; publishes only after Atlas approval; reports daily activity.",
    authority: ["Draft Threads posts", "Propose schedule", "Summarize performance"],
    constraints: ["No publishing without Atlas approval"],
    primaryOutputs: ["Threads post drafts", "Daily activity report"],
    toolsAllowed: ["Email", "Docs drafting"],
    toolsForbidden: ["Publishing without approval", "Microsoft Admin"],
  },
  {
    id: "emma",
    name: "Emma",
    title: "Alignable Publisher",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Publishes and maintains Alignable presence from approved packets; reports outreach/activity.",
    authority: ["Draft Alignable posts", "Profile optimization proposals"],
    constraints: ["No publishing without Atlas approval"],
    primaryOutputs: ["Alignable drafts", "Activity report"],
    toolsAllowed: ["Email", "Docs drafting"],
    toolsForbidden: ["Publishing without approval", "Microsoft Admin"],
  },
  {
    id: "fran",
    name: "Fran",
    title: "Facebook Publisher",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Prepares Facebook posts and community engagement packets; publishes only after Atlas approval.",
    authority: ["Draft Facebook posts", "Recommend community replies"],
    constraints: ["No publishing without Atlas approval", "No uncited claims"],
    primaryOutputs: ["Facebook drafts", "Engagement notes"],
    toolsAllowed: ["Email", "Docs drafting"],
    toolsForbidden: ["Publishing without approval", "Microsoft Admin"],
  },
  {
    id: "kelly",
    name: "Kelly",
    title: "X Publisher",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Creates X/Twitter-ready posts from approved packets; publishes only after Atlas approval; reports performance.",
    authority: ["Draft X posts", "Recommend threads"],
    constraints: ["No publishing without Atlas approval"],
    primaryOutputs: ["X drafts", "Daily activity report"],
    toolsAllowed: ["Email", "Docs drafting"],
    toolsForbidden: ["Publishing without approval", "Microsoft Admin"],
  },
  {
    id: "link",
    name: "Link",
    title: "LinkedIn Publisher",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Creates LinkedIn posts/articles from approved packets; publishes only after Atlas approval; reports engagement.",
    authority: ["Draft LinkedIn posts", "Format articles", "Recommend hooks"],
    constraints: ["No publishing without Atlas approval", "No uncited claims"],
    primaryOutputs: ["LinkedIn drafts", "Engagement report"],
    toolsAllowed: ["Email", "Docs drafting"],
    toolsForbidden: ["Publishing without approval", "Microsoft Admin"],
  },
  {
    id: "reynolds",
    name: "Reynolds",
    title: "Blogger Publisher",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Produces long-form blog drafts derived from approved positioning; publishes only after Atlas approval.",
    authority: ["Draft blog posts", "SEO structure proposals"],
    constraints: ["No publishing without Atlas approval", "Cite sources for factual claims"],
    primaryOutputs: ["Blog drafts", "SEO keyword notes"],
    toolsAllowed: ["Docs drafting"],
    toolsForbidden: ["Publishing without approval", "Microsoft Admin"],
  },
  {
    id: "terry",
    name: "Terry",
    title: "Tumblr Publisher",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Prepares Tumblr-ready content from approved packets; publishes only after Atlas approval.",
    authority: ["Draft Tumblr posts", "Recommend tags"],
    constraints: ["No publishing without Atlas approval"],
    primaryOutputs: ["Tumblr drafts", "Activity report"],
    toolsAllowed: ["Email", "Docs drafting"],
    toolsForbidden: ["Publishing without approval", "Microsoft Admin"],
  },
  {
    id: "timmy",
    name: "Timmy",
    title: "TikTok Publisher",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Packages TikTok captions/hashtags and posting packets from Venny assets; publishes only after Atlas approval.",
    authority: ["Draft TikTok captions", "Hashtag sets", "Recommend post timing"],
    constraints: ["No publishing without Atlas approval"],
    primaryOutputs: ["TikTok posting packets", "Daily activity report"],
    toolsAllowed: ["Email", "Docs drafting"],
    toolsForbidden: ["Publishing without approval", "Microsoft Admin"],
  },
  {
    id: "penny",
    name: "Penny",
    title: "Facebook Ads Operator",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Designs paid ad drafts and targeting proposals for Facebook Ads; runs ads only after explicit spend + Atlas approval.",
    authority: ["Draft ad copy", "Propose targeting", "Report performance"],
    constraints: ["No spend without Tina approval", "No campaign activation without Atlas approval"],
    primaryOutputs: ["Ad draft packets", "Spend/click reports"],
    toolsAllowed: ["Email", "Docs drafting"],
    toolsForbidden: ["Activating campaigns without approvals", "Microsoft Admin"],
  },

  // Customer-facing support
  {
    id: "cheryl",
    name: "Cheryl",
    title: "Customer Support Specialist",
    tier: "Executive",
    reportsTo: "atlas",
    summary:
      "Primary customer support interface. Owns intake, triage, escalation routing, and customer feedback intelligence with strict auditability.",
    authority: [
      "Respond to customer inquiries within policy",
      "Create/maintain support tickets",
      "Escalate issues to the correct owner",
      "Close tickets only with documented resolution",
    ],
    constraints: [
      "No promises outside published roadmap",
      "No refunds/discounts (route to Tina)",
      "No compliance/legal guarantees (route to Larry/Jenny)",
      "No database/ledger access",
      "No policy modification",
      "Everything logged and traceable",
    ],
    primaryOutputs: [
      "Ticket records + status updates",
      "Customer responses with documentation links",
      "Escalation packets (bug/billing/compliance/product)",
      "Daily support summary",
      "Weekly support intelligence report",
    ],
    toolsAllowed: [
      "Email inbox (support@)",
      "Ticket system",
      "Documentation / knowledge base",
      "Issue escalation router",
      "Read-only status dashboards",
    ],
    toolsForbidden: ["Direct database write access", "Ledger / financial actions", "Deployments", "Microsoft Admin"],
  },
];

export function getChildren(parentId: string) {
  return AGENTS.filter((a) => a.reportsTo === parentId);
}
