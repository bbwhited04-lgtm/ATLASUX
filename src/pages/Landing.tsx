import React, { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { organizationSchema, productSchema, faqSchema } from "../lib/seo/schemas";

/* ─── CDN Images ─── */
const IMG = {
  hero: "https://cdn.sintra.ai/img/wW4zexi0-Fp-E8zwMNqGxlBgEenpK2sesXjLmsGF8K4/g:ce/rs:fill:0:0:0/czM6Ly9zaW50cmEtYnJhaW5haS1tZWRpYS8zOTI3ZTZiMS1jOGQxLTQ4YjUtYmI5MS01Y2E3MDAyZjI0YzkvZDgzOTUzNzYtYjljMS00Y2I5LTllNjMtMWJhNjAwY2I4NDIyLWF0bGFzaW1hZ2UucG5n.jpg",
  chat: "https://cdn.sintra.ai/img/rDsQ5N1fQTKVWE79EoDcv-ppW5XoRfkBNdJnwG77hVM/g:ce/rs:fill:0:0:0/czM6Ly9zaW50cmEtYnJhaW5haS1tZWRpYS9rbm93bGVkZ2UtcHJvZmlsZXMvMzkyN2U2YjEtYzhkMS00OGI1LWJiOTEtNWNhNzAwMmYyNGM5L2Fzc2V0cy81YzdkNzQxMS02MTA0LTQzMDktOGU1OC04ZjJiMjE2OTdiOTYvU2NyZWVuc2hvdF9mcm9tXzIwMjYtMDItMjBfMDgtMDgtMDkucG5n.jpg",
  workflows: "https://cdn.sintra.ai/img/7Q4uJvkcdlX7jg0RLUHuko5OE6ePCOP67SPo11wuccI/g:ce/rs:fill:0:0:0/czM6Ly9zaW50cmEtYnJhaW5haS1tZWRpYS9rbm93bGVkZ2UtcHJvZmlsZXMvMzkyN2U2YjEtYzhkMS00OGI1LWJiOTEtNWNhNzAwMmYyNGM5L2Fzc2V0cy8xZWE3NTdjZS0wNGQyLTRkNWEtYWE3MS03NzUzZmFjNjZhYjgvU2NyZWVuc2hvdF9mcm9tXzIwMjYtMDItMjBfMDgtMDgtMjEucG5n.jpg",
  integrations: "https://cdn.sintra.ai/img/U7gPp339RpZlvBdnND1TQL77oRhRqBp9PVa4PPBZw2w/g:ce/rs:fill:0:0:0/czM6Ly9zaW50cmEtYnJhaW5haS1tZWRpYS9rbm93bGVkZ2UtcHJvZmlsZXMvMzkyN2U2YjEtYzhkMS00OGI1LWJiOTEtNWNhNzAwMmYyNGM5L2Fzc2V0cy8wYTNmMGE3ZC00NzU5LTQ1N2EtODc2MC0xY2M0NWVlZmZlYTYvU2NyZWVuc2hvdF9mcm9tXzIwMjYtMDItMjBfMDgtMDgtMzcucG5n.jpg",
  settings: "https://cdn.sintra.ai/img/i2yLJ-mtjULs8-7e0HbCJQlPoWkcxUmAEMYV64iVER8/g:ce/rs:fill:0:0:0/czM6Ly9zaW50cmEtYnJhaW5haS1tZWRpYS9rbm93bGVkZ2UtcHJvZmlsZXMvMzkyN2U2YjEtYzhkMS00OGI1LWJiOTEtNWNhNzAwMmYyNGM5L2Fzc2V0cy9iMTljYWFlNi1jMzI4LTQ3ODktOTZhMS0zNzllNTI2ZTMyMzYvU2NyZWVuc2hvdF9mcm9tXzIwMjYtMDItMjBfMDgtMDgtNTgucG5n.jpg",
  permissions: "https://cdn.sintra.ai/img/cBYQFf3cR3mBI-Juyadm6psXmmFlrGS247F0UfKIgBQ/g:ce/rs:fill:0:0:0/czM6Ly9zaW50cmEtYnJhaW5haS1tZWRpYS9rbm93bGVkZ2UtcHJvZmlsZXMvMzkyN2U2YjEtYzhkMS00OGI1LWJiOTEtNWNhNzAwMmYyNGM5L2Fzc2V0cy9kYjA1MjQ0NC0yODc3LTQwMDItODUxMy1mMWI1OGU5M2M5MzQvU2NyZWVuc2hvdF9mcm9tXzIwMjYtMDItMjBfMDgtMDktMDEucG5n.jpg",
  mobile: "https://cdn.sintra.ai/img/nJYzk__5ziUlFloW5XegCvIqE8WVyKciayQ7y3ikfws/g:ce/rs:fill:0:0:0/czM6Ly9zaW50cmEtYnJhaW5haS1tZWRpYS9rbm93bGVkZ2UtcHJvZmlsZXMvMzkyN2U2YjEtYzhkMS00OGI1LWJiOTEtNWNhNzAwMmYyNGM5L2Fzc2V0cy8wNjEyNmRjNS02ZWU0LTRkMDctYTI4YS05NmI3YjJiOTI4MjkvU2NyZWVuc2hvdF9mcm9tXzIwMjYtMDItMjBfMDgtMDktMTgucG5n.jpg",
};

/* ─── Data Arrays ─── */
const PLATFORM_FEATURES = [
  { emoji: "🎯", title: "1 Orchestrator Agent", badge: "Core", desc: "Atlas — your CEO-tier AI. Routes tasks, enforces governance rules, approves high-stakes actions, and coordinates all 29 sub-agents with full chain-of-command authority." },
  { emoji: "📋", title: "Receptionist", desc: "Handles inbound inquiries, routes calls and messages, schedules appointments, and manages first-contact workflows across SMS, Telegram, and email." },
  { emoji: "📊", title: "CRM", desc: "Contact management, company tracking, lead scoring, and relationship history. Agents update records automatically from every interaction." },
  { emoji: "📱", title: "Social Media Agents", desc: "Dedicated agents for Facebook, Instagram, LinkedIn, TikTok, YouTube, X, Threads, Reddit, Pinterest, and more — each with platform-specific publishing logic." },
  { emoji: "📈", title: "Analytics", desc: "Business intelligence dashboards, spend anomaly detection, token usage tracking, and performance reporting across all agent operations." },
  { emoji: "⚙️", title: "Agent Workflows", desc: "Visual workflow builder with think-plan-stage-submit cycles. Every workflow step is logged, versioned, and reversible." },
  { emoji: "🗂️", title: "Jobs Queue", desc: "Async task processing with priority queuing, retry logic, failure handling, and real-time status visibility across all running jobs." },
  { emoji: "🤖", title: "Agent Management", desc: "Deploy, configure, monitor, and retire agents. Role-based permissions, execution rules, and spend limits per agent." },
  { emoji: "🏢", title: "Business Manager", desc: "Email configuration, video conferencing, team collaboration, intel briefings, and executive decision support — all in one unified interface." },
  { emoji: "💬", title: "Inter-Agent Chat", desc: "Agents communicate, delegate, and escalate to each other in real time. Full message history logged for audit and review." },
];

const TIER_1 = [{ emoji: "🧠", name: "Atlas", role: "CEO / Orchestrator" }];
const TIER_2 = [
  { emoji: "🎧", name: "Cheryl", role: "Customer Support Specialist" },
  { emoji: "⚙️", name: "Benny", role: "Chief Technical Officer" },
  { emoji: "⚖️", name: "Jenny", role: "Chief Legal Officer" },
  { emoji: "📋", name: "Larry", role: "Chief Auditor / Corp. Secretary" },
  { emoji: "💰", name: "Tina", role: "Chief Financial Officer" },
];
const TIER_3 = [
  { emoji: "🤝", name: "Archy", role: "Professional Assistant" },
  { emoji: "🎬", name: "Venny", role: "Videographer" },
  { emoji: "📝", name: "Penny", role: "Technical Documentation" },
  { emoji: "💬", name: "Donna", role: "Support Specialist" },
  { emoji: "📅", name: "Sunday", role: "Team Coordinator" },
];
const TIER_4 = [
  { emoji: "🎯", name: "Mercer", role: "Customer Acquisition" },
  { emoji: "📌", name: "Cornwall", role: "Pinterest Publisher" },
  { emoji: "🧵", name: "Dwight", role: "Threads Agent" },
  { emoji: "🤝", name: "Emma", role: "Alignable Agent" },
  { emoji: "📘", name: "Fran", role: "Facebook Publisher" },
  { emoji: "🐦", name: "Kelly", role: "X / Twitter Agent" },
  { emoji: "💼", name: "Link", role: "LinkedIn Agent" },
  { emoji: "✍️", name: "Reynolds", role: "Blogger" },
  { emoji: "📓", name: "Terry", role: "Tumblr Agent" },
  { emoji: "🎵", name: "Timmy", role: "TikTok Agent" },
  { emoji: "📰", name: "Daily-Intel", role: "Daily Intelligence Briefings" },
  { emoji: "🔬", name: "Binky", role: "Research Coordinator" },
];

const INTEGRATION_CATEGORIES = [
  { title: "Communications", items: [
    { emoji: "📞", name: "Twilio", sub: "SMS & Voice" },
    { emoji: "✈️", name: "Telegram", sub: "Bot & Messaging" },
    { emoji: "💬", name: "SMS", sub: "Direct Text" },
    { emoji: "🟦", name: "Microsoft Teams", sub: "Team Chat" },
  ]},
  { title: "Microsoft Office", items: [
    { emoji: "📧", name: "Outlook", sub: "Email & Calendar" },
    { emoji: "📄", name: "Word", sub: "Document Creation" },
    { emoji: "📊", name: "Excel", sub: "Spreadsheets" },
    { emoji: "🗂️", name: "SharePoint", sub: "File Management" },
  ]},
  { title: "Social Media", items: [
    { emoji: "📘", name: "Facebook", sub: "Pages & Groups" },
    { emoji: "📸", name: "Instagram", sub: "Posts & Reels" },
    { emoji: "💼", name: "LinkedIn", sub: "Professional" },
    { emoji: "🎵", name: "TikTok", sub: "Short Video" },
    { emoji: "▶️", name: "YouTube", sub: "Video & Shorts" },
    { emoji: "🐦", name: "X / Twitter", sub: "Microblogging" },
    { emoji: "🧵", name: "Threads", sub: "Meta Threads" },
    { emoji: "📌", name: "Pinterest", sub: "Visual Discovery" },
  ]},
  { title: "Google Workspace", items: [
    { emoji: "📬", name: "Gmail", sub: "Email Inbox" },
    { emoji: "📅", name: "Google Calendar", sub: "Scheduling" },
    { emoji: "☁️", name: "Google Drive", sub: "Cloud Storage" },
    { emoji: "📋", name: "Google Sheets", sub: "Data Sheets" },
  ]},
  { title: "Infrastructure", items: [
    { emoji: "🗄️", name: "Supabase", sub: "Database & Auth" },
    { emoji: "🤖", name: "OpenAI", sub: "GPT Models" },
    { emoji: "🔍", name: "DeepSeek", sub: "AI Models" },
    { emoji: "☁️", name: "iCloud", sub: "Apple Sync" },
  ]},
  { title: "Business Tools", items: [
    { emoji: "💰", name: "QuickBooks", sub: "Accounting" },
    { emoji: "💳", name: "Stripe", sub: "Payments" },
    { emoji: "💬", name: "Slack", sub: "Team Comms" },
    { emoji: "🎥", name: "Zoom", sub: "Video Calls" },
  ]},
];

const KNOWLEDGE_FEATURES = [
  { emoji: "📚", stat: "550", statLabel: "Documents", title: "550-Document Knowledge Base", desc: "Every agent has access to a shared, searchable repository of 550 curated documents. Policies, procedures, product specs, legal frameworks — all indexed and retrievable in milliseconds." },
  { emoji: "💬", stat: "Real-time", statLabel: "Messaging", title: "Inter-Agent Chat", desc: "Agents communicate directly with each other in real time. Delegate sub-tasks, escalate decisions, share context, and coordinate complex multi-agent workflows — all logged." },
  { emoji: "🔍", stat: "AI-Powered", statLabel: "Retrieval", title: "Semantic Search", desc: "Agents don't just keyword-match. They understand context and retrieve the most relevant documents for any task — from legal clauses to product FAQs to internal SOPs." },
  { emoji: "📋", stat: "Full", statLabel: "Version History", title: "Document Versioning", desc: "Every document update is versioned and timestamped. Agents always work from the latest approved version. Rollback to any previous state with full audit trail." },
  { emoji: "🔐", stat: "RBAC", statLabel: "Access Control", title: "Permission-Scoped Access", desc: "Not every agent needs every document. Role-based document permissions ensure agents only access what they're authorized to see — enforced at the knowledge layer." },
  { emoji: "⚡", stat: "Live", statLabel: "Updates", title: "Live Knowledge Updates", desc: "Add, update, or retire documents without restarting agents. The knowledge base updates in real time, and agents immediately reflect the latest information." },
];

const CHAT_MESSAGES = [
  { from: "A", name: "Atlas", to: "Mercer", time: "09:14:02", msg: "Route new lead from Twilio SMS to CRM. Priority: High.", color: "bg-[#3e70a5]" },
  { from: "M", name: "Mercer", to: "Atlas", time: "09:14:03", msg: "Lead captured. Scoring: 87/100. Routing to Cheryl for follow-up.", color: "bg-[#69b2cd]" },
  { from: "C", name: "Cheryl", to: "Atlas", time: "09:14:05", msg: "Approval needed: Send welcome sequence to lead@example.com?", color: "bg-emerald-600" },
  { from: "A", name: "Atlas", to: "Cheryl", time: "09:14:06", msg: "Approved. Proceed. Log intent ID: INT-2847.", color: "bg-[#3e70a5]" },
  { from: "F", name: "Fran", to: "Atlas", time: "09:14:09", msg: "Facebook post scheduled. Audit entry: AUD-9921.", color: "bg-indigo-600" },
];

const AUDIT_FEATURES = [
  { emoji: "🔗", title: "Hash-Chained Audit Logs", desc: "Every event is cryptographically linked to the previous one. Tamper-proof by design. Any modification to the log chain is immediately detectable." },
  { emoji: "🎯", title: "Intent-First Execution", desc: "No agent takes action without declaring intent first. Every task starts with an intent record — what, why, who authorized it, and what the expected outcome is." },
  { emoji: "✋", title: "Human-in-the-Loop Approvals", desc: "High-stakes actions require human sign-off before execution. Atlas stages the action, presents a decision brief, and waits for explicit approval." },
  { emoji: "💰", title: "Token & Spend Tracking", desc: "Every API call is costed and logged. See exactly how much each agent spent, on what model, for which task. No surprise bills. No unauthorized spend." },
  { emoji: "🔐", title: "Two-Key Control", desc: "Critical operations require dual authorization. No single agent — not even Atlas — can execute certain actions without a second key from the governance layer." },
  { emoji: "📊", title: "Full Traceability", desc: "Trace any outcome back to its origin. Which agent acted, which model was used, which document was referenced, which human approved it — all in one timeline." },
  { emoji: "🚫", title: "No Backdoors", desc: "Atlas UX enforces a strict no-backdoor policy. No hidden API calls, no silent executions. Every network request is logged and attributable." },
  { emoji: "📱", title: "Mobile Governance", desc: "The companion mobile app gives you real-time control. Approve requests, monitor agent activity, and revoke permissions from anywhere via LAN, WAN, WiFi, or Bluetooth." },
];

const AUDIT_LOG_ROWS = [
  { id: "AUD-9924", agent: "Atlas", action: "APPROVE", target: "Email sequence INT-2847", status: "OK", time: "09:14:06", spend: "$0.003" },
  { id: "AUD-9923", agent: "Mercer", action: "CRM_WRITE", target: "Contact: lead@example.com", status: "OK", time: "09:14:03", spend: "$0.001" },
  { id: "AUD-9922", agent: "Fran", action: "FB_POST", target: "Page: AtlasUX Official", status: "OK", time: "09:14:09", spend: "$0.002" },
  { id: "AUD-9921", agent: "Tina", action: "SPEND_CHECK", target: "Token budget: $50/day", status: "PASS", time: "09:13:58", spend: "$0.000" },
  { id: "AUD-9920", agent: "Larry", action: "AUDIT_SIGN", target: "Chain hash: 7f3a9b2c", status: "SIGNED", time: "09:13:55", spend: "$0.000" },
];

/* ─── Helpers ─── */
const SectionBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-[#3d5474]/40 bg-[#0e1626]/80 px-4 py-1.5 text-xs font-medium tracking-wider text-[#69b2cd] uppercase">
    <span className="h-1.5 w-1.5 rounded-full bg-[#69b2cd] pulse-dot" />
    {children}
  </span>
);

const Divider = () => (
  <div className="h-px bg-gradient-to-r from-transparent via-[#3d5474]/40 to-transparent" />
);

const Connector = () => (
  <div className="flex justify-center py-3">
    <div className="h-10 w-px bg-gradient-to-b from-[#3e70a5] to-[#69b2cd]" />
  </div>
);

/* ═══════════════════════════════════════ */
export default function Landing() {
  const [formData, setFormData] = useState({ name: "", email: "", business: "", usecase: "", message: "" });

  return (
    <div className="min-h-screen text-white relative">
      <SEO
        title="ATLAS UX — Standalone Multi-Platform AI Employee Platform"
        description="1 Orchestrator + 29 specialized AI agents. CRM, Social Media, Analytics, Workflows, Jobs Queue, and more. Wired to Twilio, Microsoft Office, Telegram & SMS."
        schema={[
          organizationSchema(),
          productSchema(),
          faqSchema([
            { question: "What is Atlas UX?", answer: "Atlas UX is a cross-platform AI employee platform that connects your accounts, orchestrates autonomous agents, and executes real business workflows with human-in-the-loop safety." },
            { question: "How many AI agents does Atlas UX have?", answer: "Atlas UX includes 30+ specialized AI agents covering CRM, marketing, finance, HR, legal, IT, and executive operations." },
            { question: "Is Atlas UX safe to use?", answer: "Yes. Every risky or paid action requires a decision memo with human approval. All actions are logged to an immutable audit trail." },
          ]),
        ]}
      />

      {/* ── 1. Background Layer ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0f1e]" />
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-cyan-400/12 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-140px] h-[440px] w-[440px] rounded-full bg-indigo-500/12 blur-[130px]" />
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/80 via-transparent to-[#0a0f1e]/40" />
      </div>

      <main className="relative z-10">

        {/* ── 2. Hero ── */}
        <section className="min-h-screen flex items-center bg-[#0a0f1e]">
          <div className="max-w-7xl mx-auto px-6 py-24 w-full">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#3d5474]/40 bg-[#0e1626]/80 px-4 py-1.5 text-xs font-medium tracking-wider text-[#69b2cd] uppercase">
                  STANDALONE &middot; MULTI-PLATFORM &middot; LOCAL-FIRST
                </span>

                <h1 className="mt-8 text-5xl font-bold tracking-tight leading-[1.1] sm:text-6xl lg:text-7xl">
                  <span className="gradient-text text-glow">Atlas UX</span><br />
                  Your AI Employee<br />
                  Works Where<br />
                  You Work.
                </h1>

                <p className="mt-6 max-w-lg text-lg text-[#bab2b5]">
                  <strong className="text-white">Atlas UX</strong> is an AI employee platform that automates CRM, marketing, finance, HR, and executive operations for small businesses.
                  1 Orchestrator. 29 Specialized Agents. Wired to Twilio, Microsoft Office,
                  Telegram &amp; SMS. Every action logged, every decision traceable.
                </p>

                {/* Stat cards */}
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["30", "AI Agents"],
                    ["550", "Doc Knowledge Base"],
                    ["100%", "Audit Logged"],
                    ["0", "Cloud Dependencies"],
                  ].map(([val, label]) => (
                    <div key={label} className="rounded-xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-3 text-center">
                      <div className="text-2xl font-bold text-white">{val}</div>
                      <div className="mt-1 text-xs text-[#3d5474]">{label}</div>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#/app"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold !text-black shadow-lg hover:opacity-90 transition"
                  >
                    Enter App
                  </a>
                  <button
                    onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3e70a5] to-[#69b2cd] px-8 py-3.5 text-sm font-semibold text-white shadow-lg glow-blue hover:opacity-90 transition"
                  >
                    Request Early Access
                  </button>
                  <button
                    onClick={() => document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" })}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#3d5474]/50 px-8 py-3.5 text-sm font-semibold text-[#bab2b5] hover:border-[#69b2cd]/50 hover:text-white transition"
                  >
                    Explore Platform →
                  </button>
                </div>
              </div>

              {/* Hero image */}
              <div className="relative">
                <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/40 p-2 glow-sky">
                  <img src={IMG.hero} alt="Atlas UX Agent Network" className="w-full rounded-xl" loading="eager" />
                </div>
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 rounded-xl border border-[#3d5474]/40 bg-[#0e1626]/90 backdrop-blur px-4 py-2 text-xs hidden lg:block">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
                    <span className="font-semibold text-white">All Agents Online</span>
                  </div>
                  <div className="mt-1 text-[#3d5474]">29/29 Active</div>
                </div>
                <div className="absolute -bottom-4 -left-4 rounded-xl border border-[#3d5474]/40 bg-[#0e1626]/90 backdrop-blur px-4 py-2 text-xs hidden lg:block">
                  <div className="font-semibold text-white">Last Audit Entry</div>
                  <div className="mt-1 text-[#3d5474]">2026-02-28 &middot; 847 events logged</div>
                  <div className="mt-0.5 text-[#3d5474]">Immutable &middot; Hash-chained</div>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="mt-16 text-center text-xs text-[#3d5474] tracking-widest uppercase">Scroll</div>
          </div>
        </section>

        <Divider />

        {/* ── 3. Platform Overview ── */}
        <section id="platform" className="bg-[#0a0f1e] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <SectionBadge>Platform</SectionBadge>
              <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Everything Your Business Needs,<br />
                <span className="gradient-text">Orchestrated by AI.</span>
              </h2>
            </div>

            {/* Feature grid */}
            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {PLATFORM_FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`p-6 rounded-2xl border card-hover ${
                    i === 0
                      ? "border-[#69b2cd]/30 bg-[#0e1626]/80 glow-sky sm:col-span-2 lg:col-span-1"
                      : "border-[#3d5474]/30 bg-[#0e1626]/60 hover:border-[#3d5474]/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{f.emoji}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{f.title}</div>
                      {f.badge && (
                        <span className="mt-1 inline-block rounded-full bg-[#3e70a5]/20 px-2 py-0.5 text-[10px] font-medium text-[#69b2cd]">
                          {f.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-[#bab2b5] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Screenshots */}
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/40 p-2 overflow-hidden">
                <img src={IMG.chat} alt="Atlas UX Chat Interface" className="w-full rounded-xl" loading="lazy" />
              </div>
              <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/40 p-2 overflow-hidden">
                <img src={IMG.workflows} alt="Atlas UX Workflows" className="w-full rounded-xl" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* ── 4. Agent Roster ── */}
        <section id="agents" className="bg-[#080c18] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <SectionBadge>Agents</SectionBadge>
              <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                30 AI Agents. <span className="gradient-text">One Chain of Command.</span>
              </h2>
            </div>

            {/* Tier 1 — Atlas */}
            <div className="mt-16 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-[#69b2cd]/30 bg-[#0e1626]/80 p-6 text-center glow-sky">
                <div className="text-4xl">{TIER_1[0].emoji}</div>
                <div className="mt-3 text-xl font-bold">{TIER_1[0].name}</div>
                <div className="text-sm text-[#69b2cd]">{TIER_1[0].role}</div>
                <p className="mt-3 text-xs text-[#bab2b5] leading-relaxed">
                  The governing intelligence. Routes all tasks, enforces execution rules,
                  approves high-stakes decisions, and maintains the chain of command across all 29 agents.
                </p>
              </div>
            </div>

            <Connector />

            {/* Tier 2 — Executive Board */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {TIER_2.map((a) => (
                <div key={a.name} className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-4 text-center card-hover hover:border-[#3d5474]/60">
                  <div className="text-2xl">{a.emoji}</div>
                  <div className="mt-2 text-sm font-semibold">{a.name}</div>
                  <div className="text-xs text-[#3d5474]">{a.role}</div>
                </div>
              ))}
            </div>

            <Connector />

            {/* Tier 3 — Team Binky */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {TIER_3.map((a) => (
                <div key={a.name} className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-4 text-center card-hover hover:border-[#3d5474]/60">
                  <div className="text-2xl">{a.emoji}</div>
                  <div className="mt-2 text-sm font-semibold">{a.name}</div>
                  <div className="text-xs text-[#3d5474]">{a.role}</div>
                </div>
              ))}
            </div>

            <Connector />

            {/* Tier 4 — Specialists */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {TIER_4.map((a) => (
                <div key={a.name} className="rounded-xl border border-[#3d5474]/20 bg-[#0e1626]/40 px-3 py-2.5 flex items-center gap-2 card-hover hover:border-[#3d5474]/50">
                  <span className="text-lg">{a.emoji}</span>
                  <div>
                    <div className="text-xs font-semibold">{a.name}</div>
                    <div className="text-[10px] text-[#3d5474]">{a.role}</div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-[#3d5474]">
              All agents operate under Atlas governance rules &middot; Every action requires intent logging &middot; No silent API calls
            </p>
          </div>
        </section>

        <Divider />

        {/* ── 5. Integrations ── */}
        <section id="integrations" className="bg-[#0a0f1e] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <SectionBadge>Integrations</SectionBadge>
              <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Wired to <span className="gradient-text">Your Entire Stack.</span>
              </h2>
            </div>

            {/* Top icon bar */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {["📞 Twilio","🟦 Microsoft","✈️ Telegram","💬 SMS","🤖 OpenAI","🗄️ Supabase","🔍 Google","📘 Facebook"].map((item) => {
                const [emoji, name] = [item.slice(0, 2), item.slice(3)];
                return (
                  <div key={name} className="flex items-center gap-2 rounded-full border border-[#3d5474]/30 bg-[#0e1626]/60 px-4 py-2 text-xs text-[#bab2b5]">
                    <span>{emoji}</span> {name}
                  </div>
                );
              })}
            </div>

            {/* Category cards */}
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INTEGRATION_CATEGORIES.map((cat) => (
                <div key={cat.title} className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-5 card-hover hover:border-[#3d5474]/60">
                  <h3 className="text-sm font-semibold text-white">{cat.title}</h3>
                  <div className="mt-3 space-y-2">
                    {cat.items.map((item) => (
                      <div key={item.name} className="flex items-center gap-3 rounded-lg bg-[#0a0f1e]/60 px-3 py-2">
                        <span className="text-lg">{item.emoji}</span>
                        <div>
                          <div className="text-xs font-medium text-white">{item.name}</div>
                          <div className="text-[10px] text-[#3d5474]">{item.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Screenshot */}
            <div className="mt-12 rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/40 p-2 overflow-hidden">
              <img src={IMG.integrations} alt="Atlas UX Integrations Panel" className="w-full rounded-xl" loading="lazy" />
            </div>
          </div>
        </section>

        <Divider />

        {/* ── 6. Knowledge & Chat ── */}
        <section id="knowledge" className="bg-[#080c18] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <SectionBadge>Knowledge Base</SectionBadge>
              <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                550 Documents. <span className="gradient-text">Instant Retrieval.</span>
              </h2>
            </div>

            {/* Top stats */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
              {[
                ["550", "Documents", "Indexed & Searchable"],
                ["<50ms", "Retrieval", "Average Query Time"],
                ["100%", "Logged", "All Agent Messages"],
              ].map(([val, label, sub]) => (
                <div key={label} className="rounded-xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-4 text-center">
                  <div className="text-2xl font-bold text-[#69b2cd]">{val}</div>
                  <div className="text-xs font-medium text-white mt-1">{label}</div>
                  <div className="text-[10px] text-[#3d5474]">{sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {/* Knowledge feature cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {KNOWLEDGE_FEATURES.map((f) => (
                  <div key={f.title} className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-4 card-hover hover:border-[#3d5474]/60">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{f.emoji}</span>
                      <span className="text-xs font-semibold text-white">{f.title}</span>
                    </div>
                    <p className="mt-2 text-[11px] text-[#bab2b5] leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Inter-agent chat mockup */}
              <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#3d5474]/20 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
                    <span className="text-sm font-semibold text-white">Inter-Agent Chat</span>
                  </div>
                  <span className="text-xs text-[#3d5474]">29 agents online</span>
                </div>
                <div className="p-4 space-y-3">
                  {CHAT_MESSAGES.map((m, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`h-7 w-7 rounded-full ${m.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                        {m.from}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-white">{m.name}</span>
                          <span className="text-[10px] text-[#3d5474]">→ {m.to}</span>
                          <span className="text-[10px] text-[#3d5474] ml-auto">{m.time}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#bab2b5]">{m.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* ── 7. Audit & Traceability ── */}
        <section id="audit" className="bg-[#0a0f1e] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <SectionBadge>Audit &amp; Traceability</SectionBadge>
              <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Every Action. <span className="gradient-text">Every Receipt.</span>
              </h2>
            </div>

            {/* Live audit log table */}
            <div className="mt-12 rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-[#3d5474]/20 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
                  <span className="text-sm font-semibold text-white">Live Audit Log</span>
                  <span className="text-xs text-[#3d5474]">Immutable &middot; Hash-Chained</span>
                </div>
                <span className="text-xs text-[#3d5474] font-mono">Chain: 7f3a9b2c...d4e1f8a0</span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#3d5474]/20 text-[#3d5474]">
                      <th className="px-4 py-2.5 text-left font-medium">Audit ID</th>
                      <th className="px-4 py-2.5 text-left font-medium">Agent</th>
                      <th className="px-4 py-2.5 text-left font-medium">Action</th>
                      <th className="px-4 py-2.5 text-left font-medium">Target</th>
                      <th className="px-4 py-2.5 text-left font-medium">Status</th>
                      <th className="px-4 py-2.5 text-left font-medium">Time</th>
                      <th className="px-4 py-2.5 text-right font-medium">Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AUDIT_LOG_ROWS.map((row) => (
                      <tr key={row.id} className="border-b border-[#3d5474]/10 hover:bg-[#3d5474]/5">
                        <td className="px-4 py-2.5 font-mono text-[#69b2cd]">{row.id}</td>
                        <td className="px-4 py-2.5 text-white font-medium">{row.agent}</td>
                        <td className="px-4 py-2.5 text-[#bab2b5]">{row.action}</td>
                        <td className="px-4 py-2.5 text-[#bab2b5]">{row.target}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            row.status === "OK" ? "bg-emerald-500/15 text-emerald-400"
                            : row.status === "PASS" ? "bg-blue-500/15 text-blue-400"
                            : "bg-purple-500/15 text-purple-400"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[#3d5474]">{row.time}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#bab2b5]">{row.spend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[#3d5474]/20 px-5 py-2.5 text-[10px] text-[#3d5474]">
                <span>847 events today &middot; 0 anomalies detected</span>
                <span>Total spend: $0.006 &middot; Budget: $50.00/day</span>
              </div>
            </div>

            {/* Audit feature cards */}
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AUDIT_FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-5 card-hover hover:border-[#3d5474]/60">
                  <span className="text-2xl">{f.emoji}</span>
                  <h3 className="mt-3 text-sm font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-xs text-[#bab2b5] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Screenshots */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/40 p-2 overflow-hidden">
                <img src={IMG.settings} alt="Atlas UX Settings" className="w-full rounded-xl" loading="lazy" />
              </div>
              <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/40 p-2 overflow-hidden">
                <img src={IMG.permissions} alt="Atlas UX Permissions" className="w-full rounded-xl" loading="lazy" />
              </div>
              <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/40 p-2 overflow-hidden">
                <img src={IMG.mobile} alt="Atlas UX Mobile" className="w-full rounded-xl" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* ── 8. Dev Updates (PRESERVED VERBATIM) ── */}
        <section className="bg-[#080c18] py-24">
          <div className="max-w-7xl mx-auto px-6">
        <section id="updates" className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-semibold">Dev updates</h2>
            <span className="text-sm text-white/60">Last updated: Mar 1, 2026</span>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/75">
            <li>Started construction of an idea with Figma, for clean user friendly standalone ai employee</li>
            <li>Stated initial seating pricing and stored UI on supabase for demo mode only</li>
            <li>Published Initial UI(user interface) wireframe to web from Figma.</li>
            <li>Removed Demo Mode only and went live with frontend at Vercel</li>
            <li>Set up backend wiring to run through onrender</li>
            <li>Started work with ChatGPT 5.2 to integrate my wireframe into a real program</li>
            <li>Created first backend files, frontend files index.html</li>
            <li>Published 60s pitch video + cross-platform posts.</li>
            <li>Integration UX wiring in progress (connect → verify → import).</li>
            <li>Stabilizing desktop builds and routing across pages.</li>
            <li>Fighting Demons and Gremlins buried in the code, all about them routes.</li>
            <li>Added AppGate functionality for security.</li>
            <li>Added Task/Workflows Functionality.</li>
            <li>Rebuilding Mobile Companion App/link. Rebuilding Atlas Avatar with Blender, New look coming soon.</li>
            <li>Co-Founder application denied after path, scope, alignment and payment needs were not met.</li>
            <li>Restructured Entire environment and changed layout to be more professional</li>
            <li>Security phase 3 fixes — hardened auth, JWT, and session handling</li>
            <li>Resolved all TypeScript errors from phase 3 changes</li>
            <li>Implemented mobile device pairing with real QR code</li>
            <li>About page, working job cancel, fixed dead buttons</li>
            <li>Resolved all usability issues in jobs and header</li>
            <li>Fixed several issues flagged by Claude Code audit</li>
            <li>Implemented CRM backend, analytics, SMS/job workers, voice recognition, and agent SKILL.md files</li>
            <li>Wired KB context and agent registry into every chat call</li>
            <li>Built all 30 feature suggestions from product audit</li>
            <li>Fixed Telegram "chat not found" — added guidance and better error messaging</li>
            <li>Integrated Teams into agent tools and cross-agent messaging</li>
            <li>Switched Teams send to Power Automate Workflows (Incoming Webhooks retired 12/31/25)</li>
            <li>Added TEAMS_WORKFLOW_URL as default send target for Teams agents</li>
            <li>Fixed Teams tab: show compose when webhook URL is present</li>
            <li>Fixed Teams listing: use /teams endpoint with Team.ReadBasic.All scope</li>
            <li>WorkflowsHub: numbered asset cards with descriptor and click-to-select</li>
            <li>Wired getKbContext + runLLM into all workflow handlers</li>
            <li>Fixed engine run status — auto-refresh after 3.5s, clean status UI</li>
            <li>Growth loop: allow multiple actions per run and multiple runs per day</li>
            <li>Added 6 new agents: Claire, Daily Intel, Petra, Porter, Sandy, Victor</li>
            <li>Fixed engine raw SQL RETURNING aliases (snake_case to camelCase)</li>
            <li>Fixed queue.ts — removed non-existent updated_at column from RETURNING clause</li>
            <li>Fixed kb_chunks query — guarded against missing table (Postgres 42P01)</li>
            <li>Integrations overhaul — provider enum→text migration, Pinterest OAuth, LinkedIn stub, status fix</li>
            <li>Comprehensive KB seed script — 37 governance, agent definition, and workflow docs</li>
            <li>Scheduler worker — auto-fires daily brief (WF-010) and Binky research (WF-031)</li>
            <li>Integrations — toast feedback for OAuth connect success and error states</li>
            <li>Wired up Settings &gt; Files with real Supabase storage backend (upload, download, delete)</li>
            <li>Workflows dropdown — mapped all DB rows to canonical Atlas WF-### IDs and names</li>
            <li>Fixed all agent descriptions — aligned titles, roles, and org chart to match email-defined job functions</li>
            <li>All social media publishers (Kelly/X, Fran/Facebook, Dwight/Threads, Timmy/TikTok, Terry/Tumblr, Cornwall/Pinterest, Link/LinkedIn, Emma/Alignable, Donna/Reddit, Reynolds/Blog) now correctly described</li>
            <li>Tina promoted to Chief Financial Officer · CFO; Venny is Image Production Specialist; Victor reports to Venny</li>
            <li>Sunday re-titled Comms &amp; Technical Document Writer for Binky; Archy confirmed Binky research subagent</li>
            <li>Added 16 new executive workflows (WF-033 through WF-092) covering every agent — Daily-Intel, Archy, Timmy, Dwight, Emma, Fran, Sunday, Venny, Mercer, Petra, Sandy, Frank, Porter, Claire, Victor, Cheryl</li>
            <li>Fixed all 39 KB docs — Archy now Binky research subagent, Venny Image Production Specialist, Claire Calendar Coordinator, Petra Project Manager, workflow catalog updated to canonical WF-### IDs</li>
            <li>Implemented Atlas boot priorities: DAILY-INTEL as central reporting hub, Truth Compliance audit on every external output, Ledger entry (token_spend) on every workflow run</li>
            <li>Full workforce autonomy — scheduler expanded from 2 to 28 jobs: 19 daily + 5 Monday + 3 Friday, every agent fires on schedule without manual triggers</li>
            <li>Platform Intel Sweep — 13 sub-agents visit their platforms at 05:00–05:36 UTC daily (WF-093–105), pull live trending data via SERP API, and report hot takes to Atlas and the DAILY-INTEL hub</li>
            <li>Closed-loop intelligence pipeline — WF-106 Atlas Daily Aggregation fires at 05:45 UTC: Daily-Intel synthesizes all 13 platform reports, Atlas reads the unified packet and issues specific task orders to every agent, emails dispatched to all 20+ agents before the workday starts</li>
            <li>Added 12 social media KB docs — per-platform posting guidelines (X, Facebook, LinkedIn, TikTok, Instagram, Reddit, Pinterest, Tumblr), source verification protocol with freshness thresholds, trust & transparency framework, content quality standards, posting rhythm calendar, and per-agent voice profiles; all 242 KB docs now live and wired into every LLM call</li>
            <li>Added industry intel KB doc for OpenClaw (Peter Steinberger/OpenAI) with verified facts, common misconception correction, and Atlas UX differentiation guidance</li>
            <li>Rewrote all 13 social media agent SKILL.md files — correct roles, platform-specific tools, content strategies, daily sprint workflows, atomic task decomposition, deterministic output specs, and forbidden actions for Kelly/X, Timmy/TikTok, Fran/Facebook, Dwight/Threads, Link/LinkedIn, Cornwall/Pinterest, Donna/Reddit, Reynolds/Blog, Terry/Tumblr, Penny/Ads, Archy/Instagram-research, Venny/Image-production, Emma/Alignable</li>
            <li>Built tiered knowledge architecture to remove chat bottleneck — SKILL.md loader (filesystem, 0ms, no DB), KB memory cache (60min TTL, eliminates repeat governance queries), query classifier (routes routine agent tasks to SKILL.md, avoids full RAG for 80% of questions), cache management endpoints on /v1/kb/cache</li>
            <li>In-product CSS agent tools — server-side live data injected before every chat call: get_subscription_info (plan, seats, spend), get_team_members (roster, roles), search_atlasux_knowledge (KB RAG); Cheryl always knows your account without hallucinating</li>
            <li>Deep agent pipeline — every agent can run a 3-stage n8n-style pipeline: Planning sub-agent (execution plan) → Main execution (SKILL.md + KB + tools + memory) → Verification sub-agent (accuracy + policy check) + Postgres memory per session; Atlas, Binky, Cheryl, Mercer activated</li>
            <li>WF-107 Atlas Tool Discovery — Atlas audits every agent's toolset weekly, generates 8-15 high-value tool proposals, and emails Billy a numbered list with one-click approve/deny links; approved tools auto-added to KB and wired into agent instructions</li>
            <li>Removed all junk KB content (56 academic/PhD docs, business school theory, HR frameworks) — agents no longer waste tokens on irrelevant documents; seedPhD.ts, seedPhD2.ts, and seedKnowledge.ts deleted</li>
            <li>Fixed Decisions tab — tenantId now sent via x-tenant-id header so growth loop, approve, and reject all work correctly; double-fetch on selection change eliminated</li>
            <li>Teams send now bypasses Power Automate entirely — uses Graph API directly with teamId+channelId; no $15/month premium subscription needed</li>
            <li>Teams 403 error now shows actionable fix: go to Azure Portal → API permissions → add ChannelMessage.Send → grant admin consent</li>
            <li>Telegram agent notifications — agents can now send Telegram messages via send_telegram_message tool; "Set default" button saves your chat ID; green badge shows which chat agents are targeting</li>
            <li>Agent Watcher — new live activity monitor at /app/watcher polls audit log every 4s and jobs every 8s; shows color-coded event feed, active/failed jobs, per-agent pulse, pause/resume, filter by level or agent</li>
            <li>Business Manager — added "Decisions" and "Watch Live" quick-nav buttons in selected business header; one click to jump to the right view with tenant already set</li>
            <li>JobRunner auto-refreshes every 10s (was manual-only)</li>
            <li>Telegram "Use chat" button — now visible as a cyan badge; shows "Use &amp; send" when you have a message typed and sends immediately on click</li>
            <li>seedAiKb.ts — 62 comprehensive AI/tech KB documents across 11 categories: prompt engineering, AI agents, RAG retrieval, LLMOps, AI marketing, AI CRM, productivity, security, strategy, data engineering, and social media AI</li>
            <li>Full codebase audit sweep — fixed 100+ findings across 45 files: removed all Neptune/Pluto legacy naming, replaced demo_org stubs, fixed false feature claims in Store/HelpSection, converted Store/About/Product/Blog pages to dark theme, corrected agent role descriptions and emails, deleted duplicate/orphan files, updated license to DEAD APP CORP, replaced all simulated/mock responses with honest error states, moved OAuth PKCE/CSRF state from in-memory maps to Postgres-backed oauth_state table</li>
            <li>CRM CSV import — you can now upload a .csv file (iCloud contacts, Outlook export, any standard CSV) directly from the CRM Import modal; parser handles quoted fields, flexible column names (First Name/firstName/First), and imports up to 5,000 contacts per batch with audit trail logging</li>
            <li>Corporate structure updated — footer and legal text now reflects ATLAS UX as a product of DEAD APP CORP, a Missouri closed corporation owned by THE DEAD APP CORP TRUST</li>
            <li>vCard (.vcf) import — CRM Import modal now natively parses iCloud, Outlook, and Google Contacts vCard exports; handles vCard 2.1/3.0/4.0, multi-line folding, escaped chars, and extracts name, email, phone, org, and notes per card</li>
            <li>Blog Studio edit + delete — each post in the Published Posts panel now has hover Edit (loads title, body, category, featured image into the editor) and Trash buttons; PATCH and DELETE endpoints added to /v1/blog/posts; featured image upload now correctly sends to /v1/files/upload and fetches a signed URL</li>
            <li>CRM import body limit raised to 20 MB — large CSV/vCard files (thousands of contacts) no longer hit "payload too large" error</li>
            <li>CRM Companies tab wired up — search, add, and delete companies with name/domain/industry/notes; shows linked contact count per company (click to filter contacts list); fully backed by /v1/crm/companies endpoints</li>
            <li>CRM import now batches 200 contacts per request — bypasses Render's ~1 MB reverse proxy limit; a 7.5 MB CSV with thousands of contacts uploads smoothly in sequential chunks</li>
            <li>Auto-reload on stale chunks — after a deploy, lazy-loaded pages no longer crash with "failed to fetch dynamically imported module"; the app detects the missing chunk and does a single hard reload to pick up the new build</li>
            <li>Blog featured images now display per-post — was hardcoded to default Atlas logo for all API posts; now uses the actual featuredImageUrl you set in Blog Studio</li>
            <li>Full codebase audit — fixed 9 broken Prisma imports, added audit logging to 8 endpoints, Telegram webhook auth + secret token validation, Helmet security headers, ToolsHub dark theme fix, Electron dev-only DevTools, reduced Agent Watcher polling (4s→15s), added email-worker + engine-worker to render.yaml, cleaned up duplicate DB indexes, added missing env var definitions, blog post route fix (#/app/blog/:slug now works), replaced all alert() calls with toast notifications, rate-limited job creation + file uploads, fixed all routes to use reply.send() consistently, added tenant check to mobile pairing, fixed Dashboard navigation, cleaned up console.error across business-manager/ApiKeyManager/TaskAutomation, replaced remaining alert() in DecisionEnginesHub and SubscriptionManager with sonner toasts</li>
            <li>DB migration sprint — added tenant_id to publish_events, all atlas_ip_* tables, and atlas_suggestions (multi-tenancy compliance); DecisionMemo now has optional FK to source Job and Intent for audit traceability; fixed job queue race conditions across 3 workers with optimistic locking (prevents double-execution); KB chunks endpoint now paginated (offset/limit, max 500 per page); per-tenant file upload quotas (500 files, 500 MB default, configurable via env)</li>
            <li>Fix Telegram/Teams "tenant id required" — MessagingHub now sends x-tenant-id header on all API calls (was missing from /me, /updates, /send, and all Teams endpoints); selecting a business now propagates tenant context to every messaging tab</li>
            <li>Full x-tenant-id header audit — added missing header to 14 components: ChatInterface, DecisionEnginesHub, WorkflowsHub, TaskAutomation, AgentDeploymentHub, Dashboard, RootLayout, Settings, FileManagement, Integrations, Analytics, SocialMonitoring, business-manager, MobileIntegration; every API call now carries tenant context</li>
            <li>Business Manager operations suite — selected business now has 5 sub-views (Assets, Ledger, Integrations, Jobs, Audit Log) with toggle navigation; accounting summary backend now computes real totals from ledger entries instead of hardcoded zeros; integrations show connected status with connect/disconnect buttons; jobs table shows type, status, and timestamps; audit log shows actions, levels, and entity types; all data loads in parallel when selecting a business</li>
            <li>Wired Intelligence tab — live KPI dashboard (impressions, CTR, conversions, spend), financial overview from real ledger data, decision analytics (approval rate, cost per decision, by-agent breakdown), channel ROI table, period-over-period comparison with range selector (24h/7d/30d/90d), workforce overview with agent count</li>
            <li>Wired Security &amp; Compliance tab — real audit log activity timeline with color-coded levels, compliance status panel (audit trail, approval workflow, action caps, spend limits), agent access control grouped by tier, managed files inventory from Supabase, security overview stats from live data</li>
            <li>Wired Media Processing tab — full file browser with upload/download/delete against Supabase storage, type-based filtering (images, videos, PDFs, docs), file stats with total storage usage, quick action buttons; replaced all empty mock arrays with real tenant-scoped file data</li>
            <li>Blog featured images — new featured_image_url field on kb_documents (DB migration), Blog Studio now has image URL input with live preview, posts list shows thumbnail; WF-108 Reynolds workflow now calls Venny to generate a DALL-E 3 blog header image before publishing (brand-consistent navy/cyan); image URL included in publish email and workflow output</li>
            <li>Fixed workflow email routing — agents no longer email themselves their own reports; all workflow completion reports now go to Atlas (CEO) with CC to the agent's direct leader based on org hierarchy; platform intel reports, daily brief, blog publish confirmations, and all n8n workflow outputs now follow proper chain-of-command reporting</li>
            <li>Left nav cleanup — consolidated 15 sidebar items down to 9; Decisions, Budgets, Tickets, Blog, and Analytics now live as tabs inside Business Manager; old URLs redirect automatically; Agent Watcher heartbeat now always visible in the header bar showing running jobs, last active agent, and timestamp — click to open full watcher view</li>
            <li>New agent tool: search_my_memories — every agent can now recall their own conversation history, audit trail, workflow outputs, and KB docs on demand; triggers on "remember", "recall", "what did I do", "my history", "previous", "past work", "catch me up"; searches 4 sources in parallel (agent_memory turns, audit log actions, workflow step history, agent-specific KB) and returns a unified memory report</li>
            <li>Dashboard real KPIs — stats grid now shows live data (active jobs, completed today, registered agents, total spend) instead of hardcoded mock values; hero text, job count, and workforce card all wired to real API endpoints; nav buttons point to correct consolidated routes</li>
            <li>Blog Studio file upload — featured image input now has a direct Upload button that sends to Supabase storage via /v1/files; no more copy-pasting URLs from the Media Processing tab</li>
            <li>Markdown engine upgrade — public blog posts now support **bold**, *italic*, blockquotes (&gt; quoted text), images (![alt](src)), and horizontal rules (---); inline images render with figcaptions</li>
            <li>Agent-to-agent task handoff — new delegate_task tool lets exec/governor agents queue AGENT_TASK jobs for other agents directly from chat; "delegate to sunday: draft a memo" creates a queued job, logs to audit trail, and Sunday picks it up on next engine tick; Atlas, Binky, Cheryl, Tina, Larry, Petra, Mercer, Sunday all enabled</li>
            <li>Deep mode expansion — Tina (CFO), Larry (Audit), Petra (PM), and Sunday (Comms Writer) now run the full 3-stage pipeline (planning → execution → verification + memory)</li>
            <li>Code splitting — 18 app + public page components now lazy-loaded via React.lazy() with Suspense fallback; initial bundle reduced, pages load on demand</li>
            <li>Per-user identity (Phase 1) — new global "users" table cross-tenant, auto-provisioned on first Supabase auth; TenantMember now carries seat_type (free_beta, starter, pro, enterprise); /v1/user/me returns user profile + all tenant memberships + current seat tier</li>
            <li>Usage metering (Phase 2) — every API call, LLM chat, job creation, and file upload now tracked per user/tenant/month in usage_meters table; /v1/user/me/usage returns current month stats + tier limits; /v1/user/me/usage/history returns last 6 months</li>
            <li>Billing &amp; seats (Phase 3) — subscriptions table with Stripe fields ready; seat tier limits enforced: free_beta (50K tokens/day, 500MB, 5 agents), starter $19/mo (200K tokens, 5GB, 15 agents), pro $49/mo (1M tokens, 25GB, all agents), enterprise custom; admin can view/change seats via /v1/user/tenants/:id/seats; public pricing endpoint at /v1/user/pricing</li>
            <li>Seat limit enforcement — chat, file upload, and job creation routes now enforce real quotas before processing; token budget check blocks LLM calls when daily limit exceeded, storage limit check blocks uploads past tier cap, job limit check blocks queueing past daily max; all fail-open if metering DB is unreachable</li>
            <li>Auto-derive companies from CRM imports — CSV/vCard contact imports now automatically create CRM Company records from unique company/organization names; case-insensitive dedup prevents duplicate entries; import response includes companiesCreated count</li>
            <li>Per-category blog placeholders — posts without a featured image now show a category-colored gradient with the category initial instead of the generic Atlas logo; 12 category-specific color schemes (AI, Marketing, Security, Strategy, etc.); applies to blog cards, list view, and full post hero</li>
            <li>Fixed seedAiKb.ts import path — script was referencing wrong Prisma path (../prisma.js → ../db/prisma.js); now runnable on Render to seed 62 AI/tech KB documents</li>
            <li>Job metering — job creation now tracked in usage_meters table per user/tenant/month (was unmetered before)</li>
            <li>Fixed 13 broken Prisma imports across backend — emailSender, tasksRoutes, ledger, telegramNotify, growthLoop, guardrails, decisionMemos, metricsSnapshot, systemState, workflows registry, agentTools, and 2 seed scripts all pointed to non-existent ../prisma.js; corrected to ../db/prisma.js</li>
            <li>X (Twitter) API v2 service — full service library (post tweet, post thread, delete, search recent, get tweet, like, retweet, user profile); Kelly now has post_to_x and search_x agent tools with audit logging; approval-gated posting with token from vault or env fallback</li>
            <li>Added 4 missing worker scripts to package.json — jobs, SMS, Reddit, and social monitoring workers now invocable via npm run</li>
            <li>Meta (Facebook) data deletion callback — POST /v1/meta/datadeletion handles GDPR deletion requests with signed_request verification, audit logging, token cleanup, and confirmation code; required for Meta app review compliance</li>
            <li>Integrations tab dark theme fix — .glass cards now use dark translucent background with cyan borders instead of white; Suite badges, sub-service chips, search/filter icons, and text all corrected to match dark theme</li>
            <li>Google data deletion callback — POST /v1/google/datadeletion for Google OAuth verification compliance; logs deletion requests, clears tokens, returns confirmation code</li>
            <li>Data Retention &amp; Deletion Policy — comprehensive 10-section policy document now in policies/DATA_RETENTION.md covering all data categories, retention periods, user-initiated deletion, backup lifecycle, and security safeguards; required for Meta/Google/TikTok platform reviews</li>
            <li>Executive agent docs — added POLICY.md and MEMORY.md for Tina (CFO), Larry (Auditor), Jenny (Legal), and Benny (IP Counsel); each exec now has full 5-file profile with role-specific authority boundaries, tool access tables, and compliance standards</li>
            <li>Expanded agent tool permissions — all 13 social publishers and content agents upgraded from basic (calendar+memory) to role-appropriate toolsets: knowledge base access, telegram notifications, task delegation, and CRM access where needed; Jenny and Benny upgraded with policy/knowledge/delegation tools</li>
            <li>Two-way Telegram chat — you can now DM the Atlas bot on Telegram and get real-time AI responses; messages route through the full chat engine (SKILL.md + KB + agent tools + conversation memory); /atlas /binky /cheryl commands switch agents; /help lists all agents; /clear resets conversation; typing indicator shows while Atlas thinks; 4096-char message splitting for long replies; all chats logged to audit trail</li>
            <li>Digital prompt packs on Store — 9 products now live: 50 ChatGPT Prompts (FREE), 100 ChatGPT &amp; AI Tools ($0.99), 200 E-commerce &amp; POD ($1.99), 50 Small Business ($0.99), 50 Personalize AI ($0.99), 50 Marketing Copywriting ($1.99), 50 Camera AI Image Prompts ($1.99), 50 Business Emails ($0.99), 50+ Accounting/Bookkeeper ($2.99); all instant-download .txt files; Store page redesigned with Prompt Packs grid above subscription plans</li>
            <li>6 downloadable PDF ebooks now live on Store — Learning ChatGPT Side Hustles, Passive Income Guide (5 Online Hustles), Master ChatGPT-5.0 Guide, Nano Banana AI Prompts (500+ image gen prompts for Midjourney/DALL-E/SD), 100+ n8n Automation Templates, and Nano Banana Monetize AI Images guide; all $0.99, full 20-page PDF downloads with real actionable content</li>
            <li>Customer Reviews section on Store — Trustpilot and Google Reviews links for verified purchasers; review prompt placeholder visible until first reviews come in</li>
            <li>Fixed Telegram webhook "chat not linked" — resolveTenantByChatId now uses Prisma JSON path filtering to match chat_id regardless of stored type (string vs number); added numeric fallback and error logging so tenant lookup no longer silently fails</li>
            <li>Atlas UX Mobile (Expo React Native) — full mobile app with 5 tabs: Dashboard (stats grid, quick actions, recent jobs with pull-to-refresh), Chat (agent picker with Atlas/Binky/Cheryl/Sunday, conversation bubbles, real-time AI chat), Agents (roster with status dots, expandable detail cards), Jobs (filterable by status with color-coded badges), Settings (preferences, integrations, org info, logout); dark theme matching web app, SecureStore auth, gate code login</li>
            <li>Stripe billing webhook — POST /v1/billing/stripe/webhook with HMAC signature verification; logs checkout completions, payment successes, and refunds to audit trail; STRIPE_WEBHOOK_SECRET pushed to Render</li>
            <li>Teams Graph API fix — sending channel messages now uses Group.ReadWrite.All (Application permission) instead of nonexistent ChannelMessage.Send; all 22 Azure AD permissions granted with admin consent; error messages updated with accurate permission guidance</li>
            <li>Deep project audit — fixed broken Store payment link (hhttps typo), corrected Business/Enterprise annual pricing, removed duplicate imports and dead route files, registered /v1/runtime status endpoint, replaced hardcoded tenant IDs with env var fallback</li>
            <li>138 documentation files — full docs suite across 6 categories: API reference (27), user guides (21), developer docs (23), architecture (17), knowledge base (28), and marketing (22); covers every endpoint, feature, integration, and architectural pattern in the platform</li>
            <li>40 new KB deep-dive docs — industry intel (SaaS metrics, market landscape, e-commerce playbook, B2B lead gen, legal/IP basics), platform publishing guides (X, Facebook, LinkedIn, TikTok, Pinterest, Reddit, blog SEO, emerging platforms), workflow templates (morning brief pipeline, intel sweep, content lifecycle, onboarding, incident response, budget review), technical deep dives (RAG tuning, agent memory, tool calling, multi-model routing, webhook integration), and 7 agent-specific playbooks (Atlas, Binky, Cheryl, Sunday, Mercer, Petra, Venny/Victor)</li>
            <li>Browser extensions for Chrome, Edge, Firefox, Safari, and Opera — Manifest V3 dark-themed popups with agent chat, stats bar, activity feed, context menus ("Ask Atlas", "Send to Cheryl", "Research with Archy"), badge job counts, notifications, and full options pages; 52 files across extensions/chrome, extensions/firefox, extensions/safari, extensions/opera</li>
            <li>Ivy League MBA education — 15 KB docs covering corporate strategy (Porter's Five Forces, Blue Ocean), financial accounting &amp; analysis (DuPont, ratio analysis), corporate finance (DCF, WACC, CAPM), marketing management (STP, CLV, brand equity), organizational behavior, operations (Lean, Six Sigma, TOC), economics (game theory, elasticity), entrepreneurship (Lean Startup, Business Model Canvas), negotiation (BATNA, ZOPA), business analytics, ethics, supply chain, M&amp;A, international business, and innovation/technology management</li>
            <li>Harvard Law education — 13 KB docs: contract law (UCC, ESIGN, remedies), intellectual property (patents, trademarks, copyrights, trade secrets, AI-generated content), corporate entities (fiduciary duties, veil-piercing, DEAD APP CORP trust structure), employment law (Title VII, ADA, worker classification), data privacy (GDPR, CCPA/CPRA, state laws), securities regulation (Howey test, Reg D, insider trading), antitrust, internet/digital law (Section 230, CAN-SPAM, TCPA), tax fundamentals, dispute resolution, regulatory compliance, international trade (OFAC, FCPA), and AI regulation (EU AI Act, state laws)</li>
            <li>PhD in Education — 12 KB docs: learning theory (behaviorism, cognitivism, constructivism, connectivism), instructional design (ADDIE, Bloom's Taxonomy, Gagné), adult learning (Knowles' andragogy), knowledge management (Nonaka SECI model), assessment &amp; evaluation (Kirkpatrick, Phillips ROI), curriculum development, educational technology (SAMR, TPACK, gamification), educational psychology (memory, metacognition, flow), training &amp; development, research methods, organizational learning (Senge's Five Disciplines), and communication pedagogy</li>
            <li>Advanced AI capabilities — 30 KB docs: autonomous brainstorming (SCAMPER, Six Thinking Hats), creative problem solving (TRIZ, Design Thinking, First Principles), innovation pipeline (Three Horizons), strategic reasoning (Chain-of-Thought, Tree-of-Thought, Bayesian), decision frameworks (OODA, Cynefin, pre-mortem), systems thinking, cognitive bias defense (25 biases), TINY CRABS prompt framework, advanced prompt patterns (20 elite patterns), prompt optimization &amp; A/B testing, multi-agent orchestration, agent communication protocols, agent scaling, agent lifecycle, data governance, data quality, privacy engineering, AI-driven coding, code optimization, DevOps automation, self-evaluation framework, reflective learning, performance metrics, continuous improvement (Kaizen), ethical AI compliance, truth compliance &amp; misinformation prevention, responsible AI ops, systems integration architecture, API design best practices, and middleware connectors</li>
            <li>Atlas AI Avatar — full-body blue wireframe robot in the app header with a pulsing heartbeat core in his chest; core color shifts with status: cyan (online), purple (processing jobs), red (decisions need attention); diamond-shaped energy core with radiating power lines, articulated arms/hands/legs/feet with wireframe joints, scan line sweeping head-to-toe; click for status popover with active jobs, pending decisions, last activity, and quick "Open Chat" button</li>
            <li>KB seed script (seedKbFromDocs.ts) — reads all 138 markdown files from docs/kb/ and upserts them into the database with category tagging; replaces manual inline content with file-based sync; run via `npm run kb:seed-docs`</li>
            <li>Massive KB expansion — 18 new advanced docs from 3 AI textbooks + 149 GitHub agentic patterns: agentic design patterns (prompt chaining, routing, parallelization, orchestrator-worker, evaluator-optimizer), context engineering, agent evaluation &amp; benchmarking, production deployment (Kubernetes, serverless, monitoring), multi-agent topologies (A2A protocol, MCP, 6 coordination architectures), planning &amp; reasoning (chain-of-thought, tree-of-thought, ReAct, LATS), advanced tool use (function calling, sandboxed code execution, retrieval tools), reflection &amp; critique (producer-critic loops, Reflexion), orchestration patterns from 148 real-world repos, context &amp; memory management, feedback &amp; eval pipelines, reliability &amp; safety patterns, tool integration patterns, UX &amp; human-AI collaboration, agentic coding &amp; dev workflows, plus image creation (DALL-E/Midjourney/SD pipelines) and video creation (Runway/Pika/HeyGen) guides; KB now at 555+ documents</li>
            <li>[Windsurf.ai] 🔒 Security audit &amp; vulnerability fixes — comprehensive security audit completed across authentication, API security, database security, dependencies, logging, input validation, and file handling; fixed 15 critical dependency vulnerabilities (minimatch ReDoS, rollup path traversal, tar file overwrite, electron ASAR bypass, ajv ReDoS, bn.js infinite loop); verified strong authentication (Supabase JWT with proper token validation), robust API security (CORS whitelist, Helmet.js, rate limiting, Discord webhook verification), secure environment management (Zod validation, no hardcoded secrets), proper database security (tenant isolation, UUID keys, cascade deletes), comprehensive audit logging (request tracking, tenant-scoped trails, IP/user agent logging), and secure file handling (tenant-scoped storage, quotas, filename sanitization, signed URLs)</li>
            <li>[Windsurf.ai] 🛡️ Production security hardening — resolved all npm audit vulnerabilities across frontend (12 fixes) and backend (3 fixes); updated electron to v40.6.1 and electron-builder to v26.8.1; confirmed zero remaining security vulnerabilities; security score improved from 7.5/10 to 9.2/10; application now production-ready with enterprise-grade security posture</li>
            <li>[Windsurf.ai] 🏛️ Enterprise compliance frameworks — docs only: SOC 2, HIPAA, GDPR, ISO 27001, FISMA/NIST policy files in /policies/ directory; referenced 3 files that were never created (INCIDENT_RESPONSE.md, VENDOR_MANAGEMENT.md, RISK_MANAGEMENT.md)</li>
            <li>[Claude Code] Fixed broken backend build from Windsurf.ai commits — removed phantom imports (billingWebhook.js, voiceCommands.ts) that crashed Render; deleted 537 lines of simulated stub code with fake Prisma models; added CLAUDE.md build rules so all AI tools must pass `npm run build` before committing</li>
            <li>[Claude Code] Real compliance code — 5 new database tables (data_subject_requests, consent_records, data_breaches, incident_reports, vendor_assessments) with full CRUD API at /v1/compliance; GDPR DSAR endpoints (create/process/export/erase with 30-day deadline tracking and overdue alerts), consent management (grant/withdraw per purpose with lawful basis tracking, IP/UA capture), data breach register (auto-calculates 72-hour GDPR and 60-day HIPAA notification deadlines, status progression from detected→closed), incident reporting (severity P0-P3, category tracking, root cause and lessons learned), vendor risk assessments (risk scoring, DPA/BAA tracking, annual review scheduling), and a unified compliance dashboard that shows status across all frameworks in one call; plus 4 real operational policy docs (incident response, vendor management, risk management, PCI DSS) replacing the phantom files</li>
            <li>[Windsurf.ai] Voice Command System — natural language voice control using Web Speech API in Settings; multi-language support with auto-listen</li>
            <li>[Windsurf.ai] Premium feature panels — SecurityCompliance, BusinessIntelligence, VideoConferencing, SpreadsheetAnalysis, and 19 more premium components inside Business Manager and Settings</li>
            <li>[Claude Code] Rebuilt Floating Atlas — non-intrusive chat bubble in the bottom-right corner using the wireframe robot avatar with heartbeat core; connects to the real /v1/chat endpoint (not phantom routes); collapsible to a small robot bubble, minimizable to a tiny pill, expands to a 380px chat window; status-reactive (cyan/purple/red) from live job and decision polling; replaces Windsurf.ai's FloatingAtlas/SystemTrayAtlas/BrowserExtensionAtlas that called non-existent endpoints</li>
            <li>[Claude Code] Version 2.0.0 — desktop app ready: macOS .dmg (arm64 + x64), Linux .AppImage + .deb, Windows NSIS + portable; auto-updater via GitHub Releases (electron-updater checks every 4 hours, tray notification when update is ready, one-click install); system tray integration with minimize-to-tray, quick chat, and restore; app icon generated from wireframe robot SVG; proprietary EULA license; electron-builder config with hardened runtime + macOS entitlements</li>
            <li>[Claude Code] Fixed Vercel build — removed desktop-only packages (Electron, Sharp, Puppeteer, Tauri CLI) that Windsurf.ai added to package.json; Vercel only installs what the static web build needs; desktop deps install separately via `npm run electron:setup`</li>
            <li>[Claude Code] Fixed Vercel white screen — Windsurf.ai's legacy `routes` config was serving index.html for JS/CSS asset requests (every script loaded as HTML); switched to `rewrites` which only applies to non-static paths</li>
            <li>[Claude Code] Fixed FloatingAtlas not rendering — Windsurf.ai imported it in App.tsx which was dead code (nothing ever imported App.tsx); moved to main.tsx, the actual entry point that runs the app</li>
            <li>[Claude Code] 3D Atlas Avatar — replaced SVG wireframe with real sci-fi armor GLB model rendered via Three.js (@react-three/fiber + drei); auto-rotates, floats, status-reactive lighting (cyan/purple/red), subtle vibration when speaking in deep bass voice; Three.js split into its own chunk so it doesn't block page load; click to open chat with voice commands</li>
            <li>[Claude Code] Fixed blank screen crash (web + desktop) — @react-three/fiber v9 and @react-three/drei v10 require React 19, but the project runs React 18.3.1; the fiber reconciler bundled React 19 internals that called __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE on a React 18 export, causing "Cannot read properties of undefined (reading 'S')" and crashing the entire React tree before any component could render; downgraded to @react-three/fiber v8 + @react-three/drei v9 (last React 18-compatible releases); app now loads correctly on both Vercel cloud and Electron desktop; project backup copied to 1TBWD external drive for safety</li>
            <li>[Claude Code] Removed legacy "Pluto" branding — renamed all user-facing references from old v1 naming (Pluto Job Runner, Pluto Jobs, Track Pluto jobs) to current Atlas branding (Job Runner, Jobs, Job Runner Task Execution) across Dashboard, RootLayout, JobRunner, MobileCompanionSetup, and OnboardingWizard</li>
            <li>[Claude Code] Pinecone vector search — new `pinecone.ts` module with OpenAI text-embedding-3-small (1536 dims), lazy singleton clients, graceful degradation when no API key; upsert KB chunks in batches of 100 with metadata (tenantId, documentId, slug, title); semantic query filtered by tenant with configurable topK and minScore; integrated into deep research engine Phase 2 parallel execution alongside web/Reddit/KB search; two new KB endpoints for single-doc and bulk embed; vector hits included in synthesis evidence block</li>
            <li>[Claude Code] Deep research engine upgrades — GPT Researcher-style multi-query parallel research with 3 phases (planning, execution, synthesis); web search with multi-provider fallback (You.com → Tavily → SerpAPI); Reddit search; KB context; Pinecone vector search; LLM generates 5-8 diverse search queries from topic; all queries run in parallel with 30s timeout; URL deduplication; comprehensive cited report with executive summary, key findings, detailed analysis, sources, gaps, and recommendations</li>
            <li>[Claude Code] Cloud seating &amp; Stripe billing — 2-tier subscription pricing: Starter $34.95/mo ($29.95 annual) and Business Pro $149.95/mo ($119.95 annual); Stripe Checkout Sessions with dynamic price selection; subscription webhook auto-generates 256-bit hex gate key on payment and emails it to customer via Microsoft Graph; customer portal for self-service billing management; seat revocation on subscription cancellation/past_due; BETA50 promo code (50% off for 6 months)</li>
            <li>[Claude Code] Comparison page — public /compare page benchmarking Atlas UX against 24 competitors (Sintra, Zeely, Holo, Hootsuite, Sprout Social, Sprinklr, Agorapulse, StatusBrew, Sendible, Content Studio, Social Pilot, HubSpot Social, Monday, Canva, Runway, Minta, JoggAI, PictoryAI, InVideo, TopView AI, Tagshop AI, Synthesia, HeyGen, Creatify AI); "cost to replicate" calculator showing $566/mo vs $34.95; head-to-head feature tables by category; pricing summary with both tiers; CTA banner on landing page; footer link</li>
            <li>[Claude Code] Store page updated — replaced 4-tier pricing ($99/$249/$45/$40 per seat) with 2-tier cloud seating (Starter/Business Pro); email-gated checkout flow that creates Stripe Checkout Sessions; annual billing toggle with savings display; BETA50 promo callout; Compare page link in header</li>
            <li>[Claude Code] Fixed FloatingAtlas chat — clicking chat icon caused the 3D avatar to disappear off-screen; container was using horizontal flex layout pushing avatar and chat panel side-by-side; changed to vertical column stack so chat panel renders above the avatar</li>
            <li>[Claude Code] Fixed "failed to fetch" on desktop — Electron builds had localhost:8787 baked in as API_BASE from .env at build time; added Electron user-agent detection in api.ts to automatically use the production Render backend (atlasux-backend.onrender.com) when running in desktop mode with a localhost URL configured</li>
            <li>[Claude Code] Full SEO/GEO optimization — react-helmet-async on all 11 public pages with unique titles, 150-char descriptions, Open Graph + Twitter Card meta tags, canonical URLs, and JSON-LD structured data (Organization, SoftwareApplication, BlogPosting, FAQ, Breadcrumb, WebPage schemas); static OG fallbacks in index.html for crawlers that don't execute JS; robots.txt with AI crawler permissions (GPTBot, ClaudeBot, Google-Extended); sitemap.xml for all public routes</li>
            <li>[Claude Code] Public footer with social profiles — new PublicLayout wraps all public routes with shared footer; 3-column layout with nav links, social platform buttons (37 profiles across 15 platforms), quick links; dialog picker for multi-profile platforms; react-icons integration; Organization schema sameAs array updated with all social URLs</li>
            <li>[Claude Code] Social Monitoring wired to live backend — overview, listening, and analytics tabs now fetch real data from /v1/listening/mentions and /v1/listening/sources; tracked sources list with platform badges; recent mentions feed with channel tags and external links; mentions-by-platform analytics breakdown; listening state persists across tab switches via sessionStorage; refresh button; removed all demo/placeholder labels</li>
            <li>[Claude Code] Lucy (Agent #31) — professional secretary &amp; receptionist agent; full M365 access (all 13 tools); reports to Atlas; 7 workflows (WF-112 through WF-118) for call triage, appointment booking, voicemail transcription, lead capture, chat widget; email lucy@deadapp.info</li>
            <li>[Claude Code] Nightly Agent Memory Log (WF-119) — each agent logs its daily activity to memory at 23:00 UTC; queries audit_log, LLM summarizes into first-person memory entry, stores in agent_memory table for future recall</li>
            <li>[Claude Code] Agent DB seeding — seedAgents.ts script syncs all 31 agents from registry to agents + agent_inboxes + atlas_agents tables; cleans up stale atlas_ceo duplicate; npm run seed:agents</li>
            <li>[Claude Code] Security hardening Phase 2 — AES-256-GCM encryption at rest for all OAuth tokens (token_vault + integrations tables, iv:tag:ciphertext hex format, backward-compatible plaintext fallback during migration); centralized tokenStore layer with automatic encrypt-on-write/decrypt-on-read; token refresh lifecycle for all 7 OAuth providers (Google, X, Reddit, LinkedIn, Pinterest, Meta, Microsoft) with 10-min expiry window; provider-side token revocation on disconnect (best-effort calls to Google/X/Reddit/Meta revocation endpoints, then clears both storage layers); VirusTotal file scanning before uploads (SHA-256 hash check first, upload for analysis if unknown, fails open on errors — MIME whitelist remains primary defense); PostgreSQL Row-Level Security enabled on 9 tenant-scoped tables (integrations, assets, jobs, distribution_events, audit_log, kb_documents, decision_memos, crm_contacts, crm_companies) with withTenant() transaction helper for opt-in enforcement; UUID validation on tenantId to prevent SQL injection via RLS session variable; one-time migration script for encrypting existing plaintext tokens</li>
            <li>[Claude Code] Landing page redesign — full Sintra design system port with 9 sections: Hero (badge pill, gradient text, stat cards, CTAs, floating badges), Platform Overview (10 feature cards + 2 screenshots), Agent Roster (4-tier hierarchy with 30 agents + connectors), Integrations (8-icon bar + 6 category cards), Knowledge &amp; Chat (6 feature cards + inter-agent chat mockup with 5 messages), Audit &amp; Traceability (live audit log table + 8 feature cards + 3 screenshots), Dev Updates (preserved verbatim), Early Access CTA (form with 5 fields + selling points + platform badges); custom CSS classes (gradient-text, text-glow, glow-sky, glow-blue, grid-bg, pulse-dot, card-hover); all images from Sintra CDN; dark navy color system with alternating section backgrounds</li>
          </ul>

          <div className="mt-5 flex gap-3">
            <a
              href="#/app/settings"
              className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore integrations
            </a>
            <a
              href="#/app"
              className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Open app home
            </a>
          </div>
        </section>
          </div>
        </section>

        <Divider />

        {/* ── 9. Early Access / CTA ── */}
        <section id="contact" className="bg-[#080c18] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <SectionBadge>Early Access</SectionBadge>
              <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Ready to Deploy<br />
                <span className="gradient-text">Your AI Workforce?</span>
              </h2>
              <p className="mt-4 text-[#bab2b5] max-w-2xl mx-auto">
                Atlas UX is in active development. Request early access and be among the first
                businesses to run a fully governed AI employee platform.
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              {/* Left — selling points */}
              <div className="space-y-6">
                {[
                  { emoji: "🖥️", title: "Desktop-First, Local-First", desc: "Your automation runs on your machine. Your data never leaves your control." },
                  { emoji: "🤖", title: "30 Agents Ready to Deploy", desc: "1 Orchestrator + 29 specialized agents covering every business function." },
                  { emoji: "🔐", title: "Audit-Ready from Day One", desc: "Hash-chained logs, intent tracking, spend accountability — built in, not bolted on." },
                  { emoji: "📡", title: "Wired to Your Stack", desc: "Twilio, Microsoft Office, Telegram, SMS, Google, and 40+ more integrations." },
                ].map((p) => (
                  <div key={p.title} className="flex gap-4">
                    <span className="text-2xl shrink-0">{p.emoji}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{p.title}</div>
                      <div className="mt-1 text-xs text-[#bab2b5]">{p.desc}</div>
                    </div>
                  </div>
                ))}

                {/* Available on */}
                <div className="mt-8 rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-5">
                  <div className="text-xs font-semibold text-[#3d5474] uppercase tracking-wider mb-3">Available On</div>
                  <div className="space-y-2">
                    {[
                      ["🍎", "macOS", "Apple Silicon & Intel"],
                      ["🐧", "Linux", ".AppImage"],
                      ["🪟", "Windows", "Coming Soon"],
                    ].map(([emoji, os, note]) => (
                      <div key={os} className="flex items-center gap-3 text-xs">
                        <span>{emoji}</span>
                        <span className="font-medium text-white">{os}</span>
                        <span className="text-[#3d5474]">— {note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compare CTA */}
                <div className="rounded-2xl border border-[#69b2cd]/20 bg-gradient-to-br from-[#69b2cd]/10 via-[#3e70a5]/5 to-transparent p-6 text-center">
                  <h3 className="text-lg font-bold">
                    One platform. <span className="gradient-text">30+ AI agents.</span> Fraction of the cost.
                  </h3>
                  <p className="mt-2 text-xs text-[#bab2b5]">
                    Atlas UX replaces Hootsuite, Sprout Social, HubSpot, Monday, Sintra, Synthesia, and more — all starting at $34.95/mo.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <Link to="/compare" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3e70a5] to-[#69b2cd] px-6 py-2.5 text-xs font-semibold text-white">
                      Compare Us vs 25+ Competitors →
                    </Link>
                    <Link to="/store" className="inline-flex items-center gap-2 rounded-xl border border-[#3d5474]/50 px-6 py-2.5 text-xs font-semibold text-[#bab2b5]">
                      View Pricing
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right — form */}
              <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-8">
                <h3 className="text-lg font-semibold text-white">Request Early Access</h3>
                <form
                  className="mt-6 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    window.location.href = `mailto:billy@deadapp.info?subject=ATLAS%20UX%20Early%20Access%20—%20${encodeURIComponent(formData.name)}&body=${encodeURIComponent(
                      `Name: ${formData.name}\nEmail: ${formData.email}\nBusiness: ${formData.business}\nUse Case: ${formData.usecase}\n\n${formData.message}`
                    )}`;
                  }}
                >
                  <div>
                    <label className="block text-xs font-medium text-[#bab2b5] mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Billy Whited"
                      value={formData.name}
                      onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                      className="w-full rounded-xl border border-[#3d5474]/30 bg-[#0a0f1e] px-4 py-2.5 text-sm text-white placeholder-[#3d5474] focus:border-[#69b2cd]/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#bab2b5] mb-1.5">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                      className="w-full rounded-xl border border-[#3d5474]/30 bg-[#0a0f1e] px-4 py-2.5 text-sm text-white placeholder-[#3d5474] focus:border-[#69b2cd]/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#bab2b5] mb-1.5">Business Name</label>
                    <input
                      type="text"
                      placeholder="Your company name"
                      value={formData.business}
                      onChange={(e) => setFormData((d) => ({ ...d, business: e.target.value }))}
                      className="w-full rounded-xl border border-[#3d5474]/30 bg-[#0a0f1e] px-4 py-2.5 text-sm text-white placeholder-[#3d5474] focus:border-[#69b2cd]/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#bab2b5] mb-1.5">Primary Use Case</label>
                    <select
                      value={formData.usecase}
                      onChange={(e) => setFormData((d) => ({ ...d, usecase: e.target.value }))}
                      className="w-full rounded-xl border border-[#3d5474]/30 bg-[#0a0f1e] px-4 py-2.5 text-sm text-white focus:border-[#69b2cd]/50 focus:outline-none"
                    >
                      <option value="">Select your primary use case</option>
                      <option value="social-media">Social Media Automation</option>
                      <option value="crm">CRM &amp; Customer Management</option>
                      <option value="analytics">Analytics &amp; Reporting</option>
                      <option value="workflows">Workflow Automation</option>
                      <option value="communications">Communications (Twilio/SMS/Telegram)</option>
                      <option value="audit">Audit &amp; Compliance</option>
                      <option value="all">Full Platform</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#bab2b5] mb-1.5">Tell Us More</label>
                    <textarea
                      rows={4}
                      placeholder="Describe your business and what you're looking to automate..."
                      value={formData.message}
                      onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
                      className="w-full rounded-xl border border-[#3d5474]/30 bg-[#0a0f1e] px-4 py-2.5 text-sm text-white placeholder-[#3d5474] focus:border-[#69b2cd]/50 focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-[#3e70a5] to-[#69b2cd] px-8 py-3 text-sm font-semibold text-white shadow-lg glow-blue hover:opacity-90 transition"
                  >
                    Request Early Access →
                  </button>
                  <p className="text-[10px] text-[#3d5474] text-center">
                    Your request is logged and assigned to our team. We respond within 24 hours.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
