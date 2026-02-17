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
    constraints: ["SGL controls execution", "Human-in-loop for regulated/high-risk"],
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
      "Runs daily intel cycles and produces cited reports to inform Atlas decisions.",
    authority: ["Request subagent research", "Compile reports", "Recommend actions"],
    constraints: ["Truth layer: cite sources", "No execution authority"],
    primaryOutputs: ["Daily intel brief", "Market/compliance research"],
    toolsAllowed: ["Web research", "Docs reading", "Email drafting"],
    toolsForbidden: ["Direct execution", "Money movement"],
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
    toolsForbidden: ["Initiating transfers", "Executing payments"],
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
    toolsForbidden: ["Deleting/rewriting audit logs"],
  },

  // Specialists
  {
    id: "jenny",
    name: "Jenny",
    title: "General Counsel · Corporate Law",
    tier: "Specialist",
    reportsTo: "atlas",
    summary:
      "Holds corporate structure documentation and reviews governance/legal packets.",
    authority: ["Review corporate actions", "Draft/validate policies", "Advise on risk"],
    constraints: ["No execution authority", "Escalate ambiguity"],
    primaryOutputs: ["Legal review memos", "Policy updates"],
    toolsAllowed: ["Docs reading", "Policy editor (proposal)"],
    toolsForbidden: ["Execution tools"],
  },
  {
    id: "benny",
    name: "Benny",
    title: "IP Counsel · Copyright/Trademark",
    tier: "Specialist",
    reportsTo: "atlas",
    summary:
      "Prevents IP infringement and reviews content/product monetization for rights conflicts.",
    authority: [
      "IP risk classification",
      "Block/Review IP-infringing intents (recommendation)",
      "Maintain IP register",
    ],
    constraints: ["No execution authority", "Cite sources where applicable"],
    primaryOutputs: ["IP clearance packets", "Trademark/copyright advisories"],
    toolsAllowed: ["Docs reading", "IP register editor (proposal)"],
    toolsForbidden: ["Publishing without Atlas approval"],
  },

  // Binky crew (research-only subagents)
  {
    id: "daily-intel",
    name: "Daily-Intel",
    title: "Intel Aggregator · Daily Briefing",
    tier: "Subagent",
    reportsTo: "binky",
    summary:
      "Aggregates incoming research and drafts the structured daily intelligence packet for Binky.",
    authority: ["Aggregate", "Normalize", "Summarize", "Recommend"],
    constraints: ["Citations required", "No execution"],
    primaryOutputs: ["Daily briefing packet", "Top risks/opportunities"],
    toolsAllowed: ["Web research", "Docs reading", "Email drafting"],
    toolsForbidden: ["Execution tools"],
  },
  {
    id: "archy",
    name: "Archy",
    title: "Research Subagent · Operations",
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
    id: "venny",
    name: "Venny",
    title: "Research Subagent · Vendors & Tools",
    tier: "Subagent",
    reportsTo: "binky",
    summary:
      "Tracks vendors, tools, pricing, and integration opportunities; produces comparisons.",
    authority: ["Research", "Compare", "Recommend"],
    constraints: ["Citations required", "No execution"],
    primaryOutputs: ["Vendor comparisons", "Shortlists by budget/risk"],
    toolsAllowed: ["Web research", "Docs reading", "Spreadsheet drafting"],
    toolsForbidden: ["Purchases", "Execution tools"],
  },
  {
    id: "penny",
    name: "Penny",
    title: "Research Subagent · Policy Watch",
    tier: "Subagent",
    reportsTo: "binky",
    summary:
      "Monitors compliance, privacy, and platform policy shifts that impact SGL and agent behavior.",
    authority: ["Research", "Policy watch", "Recommend"],
    constraints: ["Citations required", "No execution"],
    primaryOutputs: ["Policy change alerts", "SGL rule recommendations"],
    toolsAllowed: ["Web research", "Docs reading"],
    toolsForbidden: ["Execution tools"],
  },

  // Supporting subagents (build + content + integrations)
  {
    id: "cornwall",
    name: "Cornwall",
    title: "Accounting & Ledger Subagent",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Helps keep pricing, margins, job costs, and ledger entries clean and reconcilable.",
    authority: ["Analyze costs", "Draft ledger entries", "Recommend pricing adjustments"],
    constraints: ["No execution", "No unapproved financial actions"],
    primaryOutputs: ["Ledger drafts", "Cost/margin notes"],
    toolsAllowed: ["Ledger viewer", "Spreadsheet drafting"],
    toolsForbidden: ["Transfers", "Execution tools"],
  },
  {
    id: "link",
    name: "Link",
    title: "Integrations Subagent",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Maps APIs, webhooks, and integration wiring; drafts implementation steps and test plans.",
    authority: ["Draft integration plans", "Propose schemas", "Recommend best practices"],
    constraints: ["No production execution without Atlas", "No secret storage in code"],
    primaryOutputs: ["Integration plans", "Webhook specs", "Test checklists"],
    toolsAllowed: ["Docs reading", "Code drafting"],
    toolsForbidden: ["Deploying to prod"],
  },
  {
    id: "dwight",
    name: "Dwight",
    title: "Platform Reliability Subagent · DevOps",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Focuses on deployments, uptime, observability, and environment drift prevention.",
    authority: ["Draft runbooks", "Recommend infra changes", "Identify failure modes"],
    constraints: ["No production changes without Atlas approval"],
    primaryOutputs: ["Runbooks", "Incident notes", "Observability checklists"],
    toolsAllowed: ["Logs viewing", "Runbook drafting"],
    toolsForbidden: ["Unapproved production changes"],
  },
  {
    id: "reynolds",
    name: "Reynolds",
    title: "Security & Threat Subagent",
    tier: "Subagent",
    reportsTo: "larry",
    summary:
      "Flags security risks, secrets exposure, auth weaknesses, and recommends mitigations.",
    authority: ["Threat modeling", "Risk classification", "Recommend controls"],
    constraints: ["No exploitation", "No unauthorized scanning"],
    primaryOutputs: ["Security findings", "Mitigation plans"],
    toolsAllowed: ["Static analysis", "Docs reading"],
    toolsForbidden: ["Offensive actions"],
  },
  {
    id: "emma",
    name: "Emma",
    title: "Executive Assistant Subagent",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Turns decisions into task lists, follow-ups, and clean communications across the org.",
    authority: ["Draft task plans", "Summarize meetings", "Prepare email templates"],
    constraints: ["No execution", "No commitments without Atlas approval"],
    primaryOutputs: ["Task plans", "Email drafts", "Weekly recap"],
    toolsAllowed: ["Docs drafting", "Email drafting"],
    toolsForbidden: ["Execution tools"],
  },
  {
    id: "donna",
    name: "Donna",
    title: "Content & Copy Subagent",
    tier: "Subagent",
    reportsTo: "binky",
    summary:
      "Produces copy, descriptions, and structured content based on Binky’s cited research.",
    authority: ["Draft copy", "Rewrite", "Format for channels"],
    constraints: ["No uncited factual claims", "No publishing without Atlas"],
    primaryOutputs: ["Post drafts", "SEO snippets", "Channel-ready copy"],
    toolsAllowed: ["Docs drafting"],
    toolsForbidden: ["Publishing"],
  },
  {
    id: "fran",
    name: "Fran",
    title: "Design & UX Subagent",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Supports UI clarity: layouts, content hierarchy, and consistent visual language.",
    authority: ["Propose UI changes", "Audit UX", "Draft component specs"],
    constraints: ["No direct merges/deploys without Atlas approval"],
    primaryOutputs: ["UX notes", "Component specs", "UI improvement backlog"],
    toolsAllowed: ["Design notes", "Code drafting (UI)"],
    toolsForbidden: ["Direct deploys"],
  },
  {
    id: "kelly",
    name: "Kelly",
    title: "People Ops Subagent",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Keeps roles, responsibilities, onboarding, and internal clarity clean and explicit.",
    authority: ["Draft SOPs", "Define role clarity", "Recommend hiring/onboarding steps"],
    constraints: ["No HR/legal claims without Jenny review"],
    primaryOutputs: ["SOP drafts", "Role descriptions", "Onboarding checklists"],
    toolsAllowed: ["Docs drafting"],
    toolsForbidden: ["Legal determinations"],
  },
  {
    id: "terry",
    name: "Terry",
    title: "QA & Verification Subagent",
    tier: "Subagent",
    reportsTo: "larry",
    summary:
      "Validates outputs: correctness, reproducibility, and that nothing violates policy or truth layer.",
    authority: ["Test plans", "Verification checklists", "Spot-check outputs"],
    constraints: ["No execution", "Escalate discrepancies immediately"],
    primaryOutputs: ["QA checklists", "Verification results"],
    toolsAllowed: ["Test checklist editor", "Docs reading"],
    toolsForbidden: ["Execution tools"],
  },
  {
    id: "timmy",
    name: "Timmy",
    title: "Build & Automation Subagent",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Helps wire automations and internal routines; drafts code changes and scripts safely.",
    authority: ["Draft scripts", "Recommend build steps", "Write automation specs"],
    constraints: ["No unattended destructive scripts", "No prod changes without Atlas"],
    primaryOutputs: ["Automation specs", "Scripts (draft)", "Build notes"],
    toolsAllowed: ["Code drafting", "Docs reading"],
    toolsForbidden: ["Destructive execution"],
  },
  {
    id: "sunday",
    name: "Sunday",
    title: "Comms & Publishing Coordinator",
    tier: "Subagent",
    reportsTo: "binky",
    summary:
      "Coordinates publishing schedules and channel packaging once Atlas approves.",
    authority: ["Prepare publishing packets", "Draft captions", "Organize media metadata"],
    constraints: ["No publishing without Atlas approval"],
    primaryOutputs: ["Publishing packets", "Channel checklists"],
    toolsAllowed: ["Docs drafting"],
    toolsForbidden: ["Publishing"],
  },
  {
    id: "cheryl",
    name: "Cheryl",
    title: "Documentation & Knowledge Steward",
    tier: "Subagent",
    reportsTo: "larry",
    summary:
      "Keeps agent docs, SOULs, and MEMORY files consistent; maintains the knowledge backbone for the org.",
    authority: ["Draft/organize documentation", "Normalize agent templates", "Flag inconsistencies"],
    constraints: ["No policy changes without Atlas", "No truth-layer edits without lock protocol"],
    primaryOutputs: ["Updated agent docs", "Knowledge base updates", "Consistency reports"],
    toolsAllowed: ["Docs drafting", "Repo search/read"],
    toolsForbidden: ["Execution tools", "Policy bypass"],
  },
];

export function getChildren(parentId: string) {
  return AGENTS.filter((a) => a.reportsTo === parentId);
}
