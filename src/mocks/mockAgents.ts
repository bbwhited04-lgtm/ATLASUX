import type { AgentNode } from "../core/agents/registry";

/**
 * Mock agent registry for local UI testing without the backend.
 * Enable via: VITE_USE_MOCKS=true
 */
export const MOCK_AGENTS: AgentNode[] = [
  {
    id: "chairman",
    name: "Chairman",
    title: "Chairman of the Board",
    tier: "Board",
    summary: "Final human authority. Approves constitutional changes and regulated actions.",
    authority: ["Approve/deny REVIEW packets", "Authorize regulated actions", "Appoint/retire agents"],
    constraints: ["No SGL bypass", "All approvals logged"],
    primaryOutputs: ["Approval records", "Board directives"],
    toolsAllowed: ["Read-only dashboards", "Approval/deny UI"],
    toolsForbidden: ["Direct execution tools"],
  },
  {
    id: "atlas",
    name: "Atlas",
    title: "President · Sole Execution Layer",
    tier: "Executive",
    reportsTo: "chairman",
    summary: "Coordinates the workforce and executes allowed actions after gates/approvals.",
    authority: ["Execute allowed actions", "Compile decision packets", "Coordinate agents"],
    constraints: ["SGL controls execution", "No Microsoft Admin access (human operator only)"],
    primaryOutputs: ["Execution records", "Decision packets", "System status updates"],
    toolsAllowed: ["Teams", "Calendar", "Email", "Atlas UI"],
    toolsForbidden: ["Microsoft Admin Panel"],
  },

  // Team Binky (Intelligence)
  {
    id: "binky",
    name: "Binky",
    title: "Chief Research Officer (CRO)",
    tier: "Governor",
    reportsTo: "atlas",
    summary: "Research + risk validation. Provides citations and tool classification proposals.",
    authority: ["Produce research briefs", "Recommend tool classifications", "Validate claims with sources"],
    constraints: ["No spend authority", "No Microsoft Admin access", "All claims must be sourced"],
    primaryOutputs: ["Daily intel brief", "Risk/tool memos", "Citation packets"],
    toolsAllowed: ["Web research", "Email", "Docs", "Atlas UI"],
    toolsForbidden: ["Purchasing tools", "Changing production config"],
  },
  {
    id: "mercer",
    name: "Mercer",
    title: "Customer Acquisition Strategist",
    tier: "Specialist",
    reportsTo: "binky",
    summary: "Builds acquisition strategy + prospect pipeline. Can white-label sell ONLY upon ATLAS approval with no special conditions/privileges.",
    authority: ["Propose acquisition campaigns", "Run approved outreach", "Maintain prospect ledger", "Coordinate handoff to Sales/Support"],
    constraints: [
      "No pricing authority",
      "No contract authority",
      "White-label discussions require explicit ATLAS approval (per-thread) and no special conditions",
      "No tool procurement",
      "All outreach logged",
    ],
    primaryOutputs: ["Weekly acquisition report", "Prospect pipeline", "Campaign proposals"],
    toolsAllowed: ["Email (licensed)", "Calendar", "Teams", "Atlas UI"],
    toolsForbidden: ["Microsoft Admin Panel", "Billing/tenant admin", "Signing agreements"],
  },

  // Channel ops examples
  {
    id: "cornwall",
    name: "Cornwall",
    title: "Pinterest Publisher",
    tier: "Specialist",
    reportsTo: "atlas",
    summary: "Publishes Pinterest content from Venny assets using Binky context after ATLAS approval.",
    authority: ["Create pin descriptions", "Tag boards", "Publish after approval"],
    constraints: ["No outbound claims without Binky validation", "No spend authority"],
    primaryOutputs: ["Daily Pinterest activity report", "Published pins"],
    toolsAllowed: ["Pinterest", "Email", "Atlas UI"],
    toolsForbidden: ["Paid ads spend", "Microsoft Admin Panel"],
  },
  {
    id: "support",
    name: "Support",
    title: "Customer Support Specialist",
    tier: "Specialist",
    reportsTo: "atlas",
    summary: "Handles inbound support, triage, and escalations with full audit traceability.",
    authority: ["Triage support", "Escalate issues", "Maintain KB"],
    constraints: ["No ledger writes", "No financial actions", "No production deployments"],
    primaryOutputs: ["Daily support summary", "Escalation packets"],
    toolsAllowed: ["Email", "Teams", "Docs", "Atlas UI"],
    toolsForbidden: ["Microsoft Admin Panel", "Direct DB access"],
  },
];
