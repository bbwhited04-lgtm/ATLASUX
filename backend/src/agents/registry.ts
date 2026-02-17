export type AgentSummary = {
  id: string;
  name: string;
  title: string;
  tier: "Board" | "Executive" | "Governor" | "Specialist" | "Subagent";
  reportsTo?: string;
  summary: string;
  toolsAllowed?: string[];
  toolsForbidden?: string[];
};

export const agentRegistry: AgentSummary[] = [
  {
    id: "chairman",
    name: "Chairman",
    title: "Chairman of the Board",
    tier: "Board",
    summary: "Final human authority for approvals and constitutional changes.",
    toolsAllowed: ["Read-only dashboards", "Approval/deny UI"],
    toolsForbidden: ["Direct execution tools"],
  },
  {
    id: "atlas",
    name: "Atlas",
    title: "President · Sole Execution Layer",
    tier: "Executive",
    reportsTo: "chairman",
    summary: "Executes actions only after gates approve; writes audit trail for everything.",
    toolsAllowed: ["Internal job runner", "Email dispatch", "Audit writer", "Ledger writer"],
    toolsForbidden: ["Unlogged external actions", "Policy tampering"],
  },
  {
    id: "binky",
    name: "Binky",
    title: "Chief Research Officer",
    tier: "Executive",
    reportsTo: "atlas",
    summary: "Runs daily intel cycles and produces cited briefs for executive decisions.",
    toolsAllowed: ["Docs drafting", "Email", "Read-only dashboards", "Web research"],
    toolsForbidden: ["DB writes", "Ledger writes", "Deployments"],
  },
  {
    id: "cheryl",
    name: "Cheryl",
    title: "Customer Support Specialist",
    tier: "Executive",
    reportsTo: "binky",
    summary: "Support intake, triage, escalation routing, and customer feedback intelligence with strict traceability.",
    toolsAllowed: ["Email inbox (support@)", "Ticket system", "Documentation/KB", "Escalation router"],
    toolsForbidden: ["Database/ledger access", "Deployments", "Policy edits"],
  },
  {
    id: "tina",
    name: "Tina",
    title: "Treasurer",
    tier: "Executive",
    reportsTo: "atlas",
    summary: "Financial oversight, ledger discipline, and spend reporting.",
    toolsAllowed: ["Ledger writer", "Accounting reports", "Email"],
    toolsForbidden: ["Deployments", "Policy edits"],
  },
  {
    id: "larry",
    name: "Larry",
    title: "Secretary",
    tier: "Executive",
    reportsTo: "atlas",
    summary: "Compliance + policy governance; ensures audit integrity and constitutional adherence.",
    toolsAllowed: ["Policy reader", "Docs", "Email"],
    toolsForbidden: ["DB writes", "Ledger writes", "Deployments", "Policy edits"],
  }
];
