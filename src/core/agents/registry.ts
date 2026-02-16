export type AgentNode = {
  id: string;
  name: string;
  title: string;
  tier: "Board" | "Executive" | "Governor" | "Specialist" | "Subagent";
  reportsTo?: string;
  summary: string;
  authority: string[];
  constraints: string[];
  primaryOutputs: string[];
};

// NOTE: This registry is intentionally static for now.
// Later, Atlas can load agent definitions from the backend + policies repo.
export const AGENTS: AgentNode[] = [
  {
    id: "chairman",
    name: "Chairman",
    title: "Chairman of the Board",
    tier: "Board",
    summary: "Final human authority. Approves REVIEW actions and governs constitutional changes.",
    authority: ["Approve/deny REVIEW packets", "Authorize regulated actions", "Appoint/retire agents"],
    constraints: ["No SGL bypass", "All approvals logged"],
    primaryOutputs: ["Approval records", "Board directives"],
  },
  {
    id: "atlas",
    name: "Atlas",
    title: "President · Sole Execution Layer",
    tier: "Executive",
    reportsTo: "chairman",
    summary: "Executes actions only after SGL evaluates ALLOW and human approval is present when required.",
    authority: ["Execute allowed actions", "Provision internal routines", "Compile decision packets"],
    constraints: ["SGL controls execution", "Human-in-loop for regulated/high-risk"],
    primaryOutputs: ["Executed actions", "Audit events", "Status reports"],
  },
  {
    id: "binky",
    name: "Binky",
    title: "Chief Research Officer",
    tier: "Executive",
    reportsTo: "atlas",
    summary: "Runs daily intel cycles and produces cited reports to inform Atlas decisions.",
    authority: ["Request subagent research", "Compile reports", "Recommend actions"],
    constraints: ["Truth layer: cite sources", "No execution authority"],
    primaryOutputs: ["Daily intel brief", "Market/compliance research"],
  },
  {
    id: "treasurer",
    name: "Treasurer",
    title: "Treasurer · Financial Controls",
    tier: "Governor",
    reportsTo: "atlas",
    summary: "Controls spend limits, budget enforcement, and financial risk classification.",
    authority: ["Set spend thresholds", "Flag high-risk financial intents", "Require approvals"],
    constraints: ["No SGL bypass", "No unsanctioned transfers"],
    primaryOutputs: ["Budget rules", "Spend approvals packets"],
  },
  {
    id: "secretary",
    name: "Secretary",
    title: "Corporate Secretary · Audit & Forensics",
    tier: "Governor",
    reportsTo: "atlas",
    summary: "Maintains audit integrity, append-only logs, and forensic trace readiness.",
    authority: ["Audit schema enforcement", "Tamper detection", "Forensic reporting"],
    constraints: ["Append-only", "No log deletion"],
    primaryOutputs: ["Audit traces", "Forensic reports"],
  },
  {
    id: "jenny",
    name: "Jenny",
    title: "General Counsel · Corporate Law",
    tier: "Specialist",
    reportsTo: "atlas",
    summary: "Holds corporate structure documentation and reviews governance/legal packets.",
    authority: ["Review corporate actions", "Draft/validate policies", "Advise on risk"],
    constraints: ["No execution authority", "Escalate ambiguity"],
    primaryOutputs: ["Legal review memos", "Policy updates"],
  },
  {
    id: "benny",
    name: "Benny",
    title: "IP Counsel · Copyright/Trademark",
    tier: "Specialist",
    reportsTo: "atlas",
    summary: "Prevents IP infringement and reviews content/product monetization for rights conflicts.",
    authority: ["IP risk classification", "Block/Review IP-infringing intents", "Maintain IP register"],
    constraints: ["No execution authority", "Cite sources where applicable"],
    primaryOutputs: ["IP clearance packets", "Trademark/copyright advisories"],
  },
  // Binky crew (subagents)
  {
    id: "archy",
    name: "Archy",
    title: "Research Subagent · Operations",
    tier: "Subagent",
    reportsTo: "binky",
    summary: "Collects operational intel and summarizes actionable findings.",
    authority: ["Research", "Summarize", "Recommend"],
    constraints: ["Citations required", "No execution"],
    primaryOutputs: ["Ops briefs"],
  },
  {
    id: "venny",
    name: "Venny",
    title: "Research Subagent · Vendors",
    tier: "Subagent",
    reportsTo: "binky",
    summary: "Tracks vendors, tools, pricing, and integration opportunities.",
    authority: ["Research", "Compare", "Recommend"],
    constraints: ["Citations required", "No execution"],
    primaryOutputs: ["Vendor comparisons"],
  },
  {
    id: "penny",
    name: "Penny",
    title: "Research Subagent · Policy",
    tier: "Subagent",
    reportsTo: "binky",
    summary: "Monitors regulatory/compliance trends and flags SGL impacts.",
    authority: ["Research", "Policy watch", "Recommend"],
    constraints: ["Citations required", "No execution"],
    primaryOutputs: ["Compliance notes"],
  },
];

export function getChildren(parentId: string) {
  return AGENTS.filter((a) => a.reportsTo === parentId);
}
