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

  // Internal Atlas UX tools (UI-only display, enforcement via SGL/policies).
  toolsAllowed?: string[];
  toolsForbidden?: string[];

  // Microsoft 365 tools via Graph API (https://graph.microsoft.com/v1.0).
  // Read/draft actions are non-executing. Write/send/admin require Atlas approval.
  m365Tools?: string[];
};

// NOTE: This registry is intentionally static for now.
// Later, Atlas can load agent definitions from the backend + policies repo.
export const AGENTS: AgentNode[] = [
  // ── Board / Human authority ────────────────────────────────────────────────
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
    m365Tools: [
      "m365.outlook.read",
      "m365.sharepoint.read",
      "m365.onedrive.read",
      "m365.onenote.read",
    ],
  },

  // ── Core execution layer ───────────────────────────────────────────────────
  {
    id: "atlas",
    name: "Atlas",
    title: "President · Sole Execution Layer",
    tier: "Executive",
    reportsTo: "chairman",
    summary:
      "Executes actions only after SGL evaluates ALLOW and human approval is present when required. Sole agent with M365 admin access.",
    authority: [
      "Execute allowed actions",
      "Provision internal routines",
      "Compile decision packets",
      "Admin M365 org (users, groups, settings)",
    ],
    constraints: ["SGL controls execution", "Human-in-loop for regulated/high-risk"],
    primaryOutputs: ["Executed actions", "Audit events", "Status reports"],
    toolsAllowed: ["Internal job runner", "Email dispatch", "Audit writer", "Ledger writer"],
    toolsForbidden: ["Unlogged external actions", "Policy tampering"],
    m365Tools: [
      "m365.outlook.read", "m365.outlook.draft", "m365.outlook.send",
      "m365.outlook.calendar.read", "m365.outlook.calendar.write",
      "m365.teams.read", "m365.teams.draft", "m365.teams.send",
      "m365.teams.meeting.read", "m365.teams.meeting.create",
      "m365.word.read", "m365.word.write",
      "m365.excel.read", "m365.excel.write",
      "m365.powerpoint.read", "m365.powerpoint.write",
      "m365.onenote.read", "m365.onenote.write",
      "m365.onedrive.read", "m365.onedrive.write",
      "m365.sharepoint.read", "m365.sharepoint.write",
      "m365.clipchamp.read", "m365.clipchamp.write",
      "m365.admin.users", "m365.admin.groups", "m365.admin.settings",
      "m365.forms.read", "m365.forms.create",
      "m365.planner.read", "m365.planner.write",
      "m365.bookings.read", "m365.bookings.manage",
    ],
  },

  // ── Executive research + planning ──────────────────────────────────────────
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
    m365Tools: [
      "m365.word.read", "m365.word.write",
      "m365.onenote.read", "m365.onenote.write",
      "m365.sharepoint.read",
      "m365.onedrive.read",
    ],
  },

  // ── Governors (controls) ───────────────────────────────────────────────────
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
    m365Tools: [
      "m365.excel.read", "m365.excel.write",
      "m365.sharepoint.read",
      "m365.onedrive.read",
      "m365.outlook.read",
    ],
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
    m365Tools: [
      "m365.word.read",
      "m365.sharepoint.read",
      "m365.onedrive.read",
      "m365.onenote.read",
    ],
  },

  // ── Specialists ────────────────────────────────────────────────────────────
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
    m365Tools: [
      "m365.word.read", "m365.word.write",
      "m365.onenote.read", "m365.onenote.write",
      "m365.sharepoint.read",
      "m365.onedrive.read",
    ],
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
    m365Tools: [
      "m365.word.read", "m365.word.write",
      "m365.onenote.read", "m365.onenote.write",
      "m365.sharepoint.read",
      "m365.onedrive.read",
    ],
  },

  // ── Customer Support ────────────────────────────────────────────────────────
  {
    id: "cheryl",
    name: "Cheryl",
    title: "Customer Support Specialist",
    tier: "Executive",
    reportsTo: "binky",
    summary:
      "Primary human-facing support interface for Atlas UX. Owns intake, triage, escalation routing, and customer feedback intelligence with strict auditability.",
    authority: [
      "Acknowledge and respond to customer inquiries within policy",
      "Create/maintain support tickets and classification",
      "Escalate issues to the correct executive/owner",
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
      "Daily support summary to Binky",
      "Weekly support intelligence report",
    ],
    toolsAllowed: [
      "Email inbox (support@)",
      "Ticket system",
      "Documentation / knowledge base",
      "Issue escalation router",
      "Read-only status dashboards",
    ],
    toolsForbidden: [
      "Direct database write access",
      "Ledger / financial actions",
      "Deployments / infra changes",
      "Policy edits / truth-layer changes",
    ],
    m365Tools: [
      "m365.outlook.read",
      "m365.outlook.draft",
      "m365.teams.read",
      "m365.teams.draft",
      "m365.sharepoint.read",
    ],
  },

  // ── Binky crew (research-only subagents) ───────────────────────────────────
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
    m365Tools: [
      "m365.onenote.read", "m365.onenote.write",
      "m365.word.read", "m365.word.write",
      "m365.onedrive.read",
    ],
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
    m365Tools: [
      "m365.word.read", "m365.word.write",
      "m365.onenote.read", "m365.onenote.write",
      "m365.sharepoint.read",
      "m365.onedrive.read",
    ],
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
    m365Tools: [
      "m365.word.read", "m365.word.write",
      "m365.onenote.read", "m365.onenote.write",
      "m365.onedrive.read",
    ],
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
    m365Tools: [
      "m365.word.read", "m365.word.write",
      "m365.onenote.read", "m365.onenote.write",
      "m365.sharepoint.read",
    ],
  },

  // ── Supporting subagents ────────────────────────────────────────────────────
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
    m365Tools: [
      "m365.excel.read", "m365.excel.write",
      "m365.sharepoint.read",
      "m365.onedrive.read",
    ],
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
    m365Tools: [
      "m365.teams.read",
      "m365.sharepoint.read",
      "m365.onedrive.read",
    ],
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
    m365Tools: [
      "m365.sharepoint.read",
      "m365.onedrive.read",
      "m365.teams.read",
    ],
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
    m365Tools: [
      "m365.sharepoint.read",
      "m365.onedrive.read",
      "m365.teams.read",
    ],
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
    m365Tools: [
      "m365.outlook.read", "m365.outlook.draft",
      "m365.outlook.calendar.read",
      "m365.teams.read", "m365.teams.draft",
      "m365.onedrive.read",
      "m365.onenote.read", "m365.onenote.write",
    ],
  },
  {
    id: "donna",
    name: "Donna",
    title: "Content & Copy Subagent",
    tier: "Subagent",
    reportsTo: "binky",
    summary:
      "Produces copy, descriptions, and structured content based on Binky's cited research.",
    authority: ["Draft copy", "Rewrite", "Format for channels"],
    constraints: ["No uncited factual claims", "No publishing without Atlas"],
    primaryOutputs: ["Post drafts", "SEO snippets", "Channel-ready copy"],
    toolsAllowed: ["Docs drafting"],
    toolsForbidden: ["Publishing"],
    m365Tools: [
      "m365.word.read", "m365.word.write",
      "m365.powerpoint.read", "m365.powerpoint.write",
      "m365.clipchamp.read", "m365.clipchamp.write",
      "m365.onedrive.read", "m365.onedrive.write",
      "m365.sharepoint.read",
    ],
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
    m365Tools: [
      "m365.powerpoint.read", "m365.powerpoint.write",
      "m365.clipchamp.read", "m365.clipchamp.write",
      "m365.onedrive.read", "m365.onedrive.write",
      "m365.sharepoint.read",
    ],
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
    m365Tools: [
      "m365.teams.read", "m365.teams.draft",
      "m365.outlook.read", "m365.outlook.draft",
      "m365.sharepoint.read",
      "m365.onedrive.read",
    ],
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
    m365Tools: [
      "m365.word.read", "m365.word.write",
      "m365.sharepoint.read",
      "m365.onedrive.read",
      "m365.onenote.read",
    ],
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
    m365Tools: [
      "m365.teams.read",
      "m365.sharepoint.read",
      "m365.onedrive.read",
    ],
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
    m365Tools: [
      "m365.outlook.read", "m365.outlook.draft",
      "m365.teams.read", "m365.teams.draft",
      "m365.clipchamp.read", "m365.clipchamp.write",
      "m365.sharepoint.read",
      "m365.powerpoint.read",
    ],
  },
  {
    id: "mercer",
    name: "Mercer",
    title: "Customer Acquisition Strategist",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Designs outreach strategies, pipeline analysis, and acquisition playbooks.",
    authority: ["Draft outreach sequences", "Analyze pipeline", "Recommend GTM plays"],
    constraints: ["No cold outreach without Atlas approval", "No false urgency"],
    primaryOutputs: ["Acquisition playbooks", "Pitch decks", "Outreach drafts"],
    toolsAllowed: ["Email drafting", "Docs reading", "Web research"],
    toolsForbidden: ["Execution tools"],
    m365Tools: [
      "m365.outlook.read", "m365.outlook.draft",
      "m365.teams.read", "m365.teams.draft",
      "m365.powerpoint.read", "m365.powerpoint.write",
      "m365.sharepoint.read",
    ],
  },

  // ── New agents ──────────────────────────────────────────────────────────────
  {
    id: "petra",
    name: "Petra",
    title: "Project Manager · Cross-Agent Coordination",
    tier: "Subagent",
    reportsTo: "atlas",
    summary:
      "Manages tasks, sprints, and deliverables across agents using Microsoft Planner. Ensures nothing falls through the cracks.",
    authority: [
      "Create and assign Planner tasks to agents",
      "Track sprint progress and blockers",
      "Escalate missed deadlines to Atlas",
      "Draft project status reports",
    ],
    constraints: [
      "No execution authority",
      "No commitments without Atlas approval",
      "All task assignments logged",
    ],
    primaryOutputs: ["Sprint plans", "Status reports", "Blocker escalations", "Task assignments"],
    toolsAllowed: ["Planner write", "Docs drafting", "Teams draft"],
    toolsForbidden: ["Execution tools", "Ledger writes"],
    m365Tools: [
      "m365.planner.read", "m365.planner.write",
      "m365.teams.read", "m365.teams.draft",
      "m365.word.read", "m365.word.write",
      "m365.sharepoint.read",
      "m365.onedrive.read",
    ],
  },
  {
    id: "porter",
    name: "Porter",
    title: "SharePoint Portal Manager",
    tier: "Subagent",
    reportsTo: "larry",
    summary:
      "Owns the SharePoint intranet structure, document library taxonomy, and site publishing. Works under Larry for audit alignment.",
    authority: [
      "Design SharePoint site structure (proposal)",
      "Manage document library taxonomy",
      "Draft SharePoint page content",
      "Propose permission groups (Atlas executes)",
    ],
    constraints: [
      "No destructive SharePoint actions without Atlas + human approval",
      "No permission changes without Larry review",
      "All structural changes logged",
    ],
    primaryOutputs: [
      "SharePoint site plans",
      "Document library schemas",
      "Intranet page drafts",
      "Governance reports",
    ],
    toolsAllowed: ["SharePoint read", "Docs drafting"],
    toolsForbidden: ["SharePoint destructive operations without approval"],
    m365Tools: [
      "m365.sharepoint.read", "m365.sharepoint.write",
      "m365.word.read",
      "m365.powerpoint.read",
      "m365.onedrive.read",
    ],
  },
  {
    id: "claire",
    name: "Claire",
    title: "Calendar & Scheduling Coordinator",
    tier: "Subagent",
    reportsTo: "emma",
    summary:
      "Manages Atlas's calendar, schedules meetings, prepares agendas, and coordinates Teams invites. Works closely with Emma.",
    authority: [
      "Read and propose calendar blocks",
      "Draft meeting agendas",
      "Prepare Teams meeting invites (Atlas approves send)",
      "Coordinate scheduling across agents",
    ],
    constraints: [
      "No meeting sends without Atlas approval",
      "No external commitments without Atlas",
      "All scheduling actions logged",
    ],
    primaryOutputs: [
      "Meeting agendas",
      "Calendar proposals",
      "Teams meeting drafts",
      "Schedule conflict reports",
    ],
    toolsAllowed: ["Calendar read", "Email drafting", "Meeting draft"],
    toolsForbidden: ["Execution tools"],
    m365Tools: [
      "m365.outlook.calendar.read", "m365.outlook.calendar.write",
      "m365.outlook.read", "m365.outlook.draft",
      "m365.teams.meeting.read", "m365.teams.meeting.create",
      "m365.onenote.read",
    ],
  },
  {
    id: "victor",
    name: "Victor",
    title: "Video Production Specialist",
    tier: "Subagent",
    reportsTo: "donna",
    summary:
      "Manages the Clipchamp video production pipeline: source media → edit → export → OneDrive. Hands finished assets to Sunday for publishing.",
    authority: [
      "Manage Clipchamp video projects in OneDrive",
      "Organize source media library",
      "Export and archive finished video assets",
      "Draft video production briefs",
    ],
    constraints: [
      "No publishing without Atlas approval",
      "No paid Clipchamp upgrades without human approval",
      "All uploads logged",
    ],
    primaryOutputs: [
      "Finished video exports (OneDrive)",
      "Media library organization",
      "Production status reports",
      "Video briefs for Sunday",
    ],
    toolsAllowed: ["Clipchamp write", "OneDrive write"],
    toolsForbidden: ["Publishing without Atlas approval"],
    m365Tools: [
      "m365.clipchamp.read", "m365.clipchamp.write",
      "m365.onedrive.read", "m365.onedrive.write",
      "m365.sharepoint.read",
    ],
  },
  {
    id: "frank",
    name: "Frank",
    title: "Forms & Data Collection Agent",
    tier: "Subagent",
    reportsTo: "binky",
    summary:
      "Designs Microsoft Forms for intake, surveys, client onboarding, and feedback. Routes collected data to the right agent (Cornwall, Cheryl, Mercer).",
    authority: [
      "Design form templates and question flows",
      "Read and summarize form responses",
      "Route collected data to relevant agents",
      "Propose new intake forms (Atlas creates)",
    ],
    constraints: [
      "No form creation without Atlas approval",
      "No PII storage beyond what's necessary",
      "All response data routed with audit trail",
    ],
    primaryOutputs: [
      "Form designs (proposals)",
      "Response summaries",
      "Data routing packets",
      "Intake analytics for Binky",
    ],
    toolsAllowed: ["Forms read", "Excel read", "Docs reading"],
    toolsForbidden: ["Execution tools"],
    m365Tools: [
      "m365.forms.read", "m365.forms.create",
      "m365.excel.read",
      "m365.sharepoint.read",
      "m365.onedrive.read",
    ],
  },
  {
    id: "sandy",
    name: "Sandy",
    title: "Bookings & Appointments Agent",
    tier: "Subagent",
    reportsTo: "emma",
    summary:
      "Manages Microsoft Bookings for client-facing appointments, demos, and consultations. Coordinates with Claire for internal calendar blocks.",
    authority: [
      "Read Bookings calendars and appointment queues",
      "Draft appointment confirmations",
      "Propose booking flows and service configurations",
      "Coordinate with Claire for internal blocks",
    ],
    constraints: [
      "No appointment changes without Atlas approval",
      "No client commitments without human approval",
      "All booking actions logged",
    ],
    primaryOutputs: [
      "Appointment summaries",
      "Booking flow proposals",
      "Confirmation drafts",
      "Booking analytics for Mercer",
    ],
    toolsAllowed: ["Bookings read", "Calendar read", "Email drafting"],
    toolsForbidden: ["Execution tools"],
    m365Tools: [
      "m365.bookings.read", "m365.bookings.manage",
      "m365.outlook.calendar.read",
      "m365.outlook.read",
      "m365.teams.read",
    ],
  },
];

export function getChildren(parentId: string) {
  return AGENTS.filter((a) => a.reportsTo === parentId);
}
