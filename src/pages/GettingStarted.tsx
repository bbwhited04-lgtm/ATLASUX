import { Link } from "react-router-dom";
import {
  Download, Monitor, Globe, Settings, Users, Zap, Shield,
  Terminal, Database, Key, CheckCircle2, ArrowRight, Cpu,
  Mail, Calendar, MessageSquare, BarChart3,
} from "lucide-react";
import SEO from "../components/SEO";
import { webPageSchema, faqSchema } from "../lib/seo/schemas";

/* ─── Section Data ─── */

type Step = { icon: typeof Download; title: string; body: string };

const REQUIREMENTS: Step[] = [
  {
    icon: Globe,
    title: "Modern Web Browser",
    body: "Atlas UX runs as a web app at atlasux.cloud — no installation needed for the browser version. Any modern browser (Chrome, Firefox, Edge, Safari) works. This is the fastest way to start using the AI agent orchestrator platform.",
  },
  {
    icon: Monitor,
    title: "Desktop App (Optional)",
    body: "For a native experience, download the Atlas UX Electron desktop app. Available for Windows (.exe installer), macOS (.zip), and Linux (.AppImage, .deb). The desktop app connects to the same multi-agent AI platform backend and provides system tray integration with native notifications.",
  },
  {
    icon: Cpu,
    title: "Hardware Requirements",
    body: "The Atlas UX web app runs entirely in the cloud — any device with a browser works. The Electron desktop app requires 4 GB RAM minimum and 500 MB disk space. All AI agent orchestration, workflow automation, and agent coordination happens server-side, so your local machine doesn't need a GPU.",
  },
];

const INSTALLATION_STEPS: { num: string; title: string; body: string }[] = [
  {
    num: "01",
    title: "Create Your Account",
    body: "Visit atlasux.cloud and sign up. Your account provisions a dedicated tenant with isolated data, its own set of autonomous AI agents, CRM records, audit logs, and workflow configurations. Multi-tenancy ensures your business operations data is completely separated from other organizations on the platform.",
  },
  {
    num: "02",
    title: "Connect Your Accounts",
    body: "Navigate to Settings → Integrations to connect your existing tools. Atlas UX integrates with Microsoft 365 (Outlook, Teams, Excel, SharePoint), Google Workspace (Gmail, Calendar, Sheets), Twilio (SMS & Voice), Telegram, Slack, Discord, Stripe (billing), and 13+ social media platforms. Each connection uses secure OAuth2 authentication — the AI agent orchestrator never stores your raw passwords.",
  },
  {
    num: "03",
    title: "Configure Your AI Agents",
    body: "Open the Agents Hub to review and customize your AI workforce. Atlas UX deploys 30+ governed AI agents organized in a corporate hierarchy — from the Atlas orchestrator agent (CEO tier) down to specialist agents for marketing automation, CRM management, financial tracking, and customer support. Enable or disable agents, set per-agent spend limits, and configure execution schedules.",
  },
  {
    num: "04",
    title: "Set Governance Policies",
    body: "Before your autonomous AI employees start working, configure your safety guardrails. Set the auto-spend limit (maximum dollar amount agents can spend without human approval), daily action caps, and risk tier thresholds. The human-in-the-loop decision memo system ensures high-stakes actions always require your sign-off. These governed AI agent policies are what make Atlas UX safe for real business operations.",
  },
  {
    num: "05",
    title: "Launch Your AI Workforce",
    body: "Enable the engine from the dashboard. Your AI agent orchestrator begins coordinating all active agents — running daily intelligence sweeps, publishing content across social platforms, managing CRM records, tracking finances, and handling customer inquiries. The multi-agent AI platform operates 24/7 within the boundaries you defined, escalating to you via decision memos when human judgment is needed.",
  },
];

const TOOLS_NEEDED: { icon: typeof Key; label: string; desc: string }[] = [
  {
    icon: Mail,
    label: "Email Accounts",
    desc: "Each AI agent has its own email address for inter-agent communication and external notifications. Configure these in Settings or use the defaults provided by the autonomous AI employee platform.",
  },
  {
    icon: Key,
    label: "API Keys & OAuth Tokens",
    desc: "Connect third-party services via OAuth2 (Microsoft, Google, social platforms) or API keys (Twilio, Stripe, Telegram). The AI agent orchestrator uses these tokens to execute workflow automation tasks on your behalf.",
  },
  {
    icon: Calendar,
    label: "Calendar Access",
    desc: "Grant calendar access so agents can schedule meetings, manage appointments, and coordinate video conferencing. Supports both Microsoft Outlook Calendar and Google Calendar via the governed AI agent integration layer.",
  },
  {
    icon: MessageSquare,
    label: "Social Media Accounts",
    desc: "Connect your business profiles on X, Facebook, Instagram, LinkedIn, TikTok, YouTube, Reddit, Pinterest, Threads, Tumblr, Alignable, Mastodon, and Medium. Dedicated marketing automation agents publish platform-specific content through Postiz integration.",
  },
  {
    icon: Database,
    label: "Stripe Account (Optional)",
    desc: "Connect Stripe for payment processing, subscription management, and financial tracking. The AI agent financial management system monitors billing, flags anomalies, and provides cost analytics through the operations platform dashboard.",
  },
  {
    icon: BarChart3,
    label: "Analytics Tokens (Optional)",
    desc: "Connect Google Analytics, social platform analytics APIs, or custom tracking endpoints. The multi-agent AI platform aggregates performance data across all channels for unified business intelligence reporting.",
  },
];

const OPERATION_GUIDE: { title: string; body: string }[] = [
  {
    title: "Daily Operations Pipeline",
    body: "Once launched, the AI agent orchestrator runs an automated daily pipeline. At 05:00 UTC, 13 intelligence agents sweep their assigned platforms (X, Facebook, Instagram, LinkedIn, TikTok, YouTube, Reddit, Pinterest, Threads, Tumblr, Alignable, Blog SEO, and Facebook Ads) for trending topics, competitor activity, and audience insights. At 05:45 UTC, Atlas aggregates all reports into a Daily Intelligence Briefing and issues per-agent task orders. Agents then generate and publish content, followed by analytics collection. This entire workflow automation cycle runs without manual intervention.",
  },
  {
    title: "Monitoring Your AI Workforce",
    body: "Track all autonomous AI agent activity from the Agent Watcher panel. See real-time status of every agent — what they're working on, which workflows are executing, token usage, API costs, and error rates. The multi-agent AI platform dashboard provides at-a-glance visibility into your entire AI operations platform. Click any agent to drill into their execution history, messaging logs, and performance metrics.",
  },
  {
    title: "Managing the Decisions Inbox",
    body: "The Decisions Inbox is where human-in-the-loop governance happens. When any governed AI agent wants to perform a high-risk action — spending above your auto-approve threshold, sending a sensitive communication, or executing a risk tier 2+ operation — it creates a decision memo explaining the proposed action, cost estimate, and risk assessment. Review each memo and approve or reject. This is the core of what makes Atlas UX a safe autonomous AI employee platform.",
  },
  {
    title: "CRM & Customer Management",
    body: "The built-in AI agent CRM automatically captures and enriches contact records from every customer interaction. Emails, social media messages, support tickets, form submissions, and phone calls are all logged and linked to the right contact. Lead scoring, deal pipeline management, and relationship history tracking are handled by the CRM agents. The AI agent orchestrator coordinates CRM updates across all touchpoints so no customer interaction falls through the cracks.",
  },
  {
    title: "Marketing Automation Across Platforms",
    body: "Atlas UX's marketing automation engine uses dedicated agents for each social platform — Kelly for X, Fran for Facebook, Timmy for TikTok, Venny for YouTube, Link for LinkedIn, and more. Each agent generates platform-specific content informed by the daily intelligence briefing, schedules posts via the Postiz integration, and tracks engagement metrics. The AI agent orchestrator ensures consistent brand messaging while adapting tone and format for each platform's audience.",
  },
  {
    title: "Financial Tracking & Spend Controls",
    body: "The AI agent financial management module (led by agent Tina, CFO) monitors all operational spending in real time. Track API costs, token usage, subscription fees, and advertising spend from a unified dashboard. Per-agent budgets, organization-wide daily caps, and the decision memo approval system provide layered financial controls. The governed AI agents cannot exceed configured spend limits — every dollar is accounted for in the immutable audit trail.",
  },
];

const SETUP_FAQS = [
  { question: "How long does it take to set up Atlas UX?", answer: "Most users are fully operational within 30 minutes. Creating an account takes 2 minutes, connecting integrations takes 10-15 minutes (depending on how many services you connect), and configuring agent permissions takes another 10 minutes. The AI agent orchestrator handles the rest — agents self-configure based on your connected accounts." },
  { question: "Do I need technical skills to use Atlas UX?", answer: "No. Atlas UX is designed for business operators, not developers. The multi-agent AI platform provides a visual dashboard for all configuration — agent management, workflow setup, CRM, analytics, and governance policies. No coding, no command line, no API knowledge needed." },
  { question: "Can I run Atlas UX on my phone?", answer: "The web app at atlasux.cloud works on mobile browsers, though the full desktop or laptop experience is recommended for agent configuration and workflow management. A dedicated iOS companion app is in development for on-the-go monitoring of your autonomous AI employee workforce." },
  { question: "What happens if I disconnect an integration?", answer: "Agents that depend on the disconnected service will pause their related workflows and create a notification. No data is lost — the governed AI agents gracefully degrade when a service is unavailable. Reconnect the integration and operations resume automatically." },
];

/* ─── Component ─── */

export default function GettingStarted() {
  return (
    <div className="min-h-screen text-white relative">
      <SEO
        title="Getting Started — Installation, Setup & Operations Guide"
        description="Complete guide to installing, setting up, and operating Atlas UX — the AI agent orchestrator platform with 30+ governed autonomous agents for CRM, marketing automation, financial management, and workflow automation."
        keywords="ai agent orchestrator setup, multi-agent ai platform installation, autonomous ai employee guide, governed ai agents setup, ai workflow automation guide, ai agent CRM setup, marketing automation platform, ai operations platform, human in the loop ai setup, ai workforce platform guide"
        path="getting-started"
        schema={[
          webPageSchema(
            "Getting Started — Atlas UX Setup Guide",
            "Installation, setup, and operations guide for Atlas UX — the AI agent orchestrator platform with 30+ governed autonomous agents.",
          ),
          faqSchema(SETUP_FAQS),
        ]}
      />

      {/* ── Background ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a3a] via-[#041127] to-black" />
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-cyan-400/10 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-140px] h-[440px] w-[440px] rounded-full bg-indigo-500/10 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Getting Started with Atlas UX
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Everything you need to install, set up, and launch your AI agent
            orchestrator — from system requirements to daily operations.
          </p>
        </div>

        {/* ── Section 1: Requirements ── */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Terminal className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold">System Requirements</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            The Atlas UX multi-agent AI platform is cloud-hosted — most of the heavy lifting
            happens on our servers. Here's what you need on your end to get started with the
            autonomous AI employee platform.
          </p>
          <div className="grid gap-4">
            {REQUIREMENTS.map((req) => (
              <div
                key={req.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:border-blue-400/30 transition-colors flex gap-5"
              >
                <req.icon className="w-7 h-7 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold mb-1">{req.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{req.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 2: Installation & Setup ── */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Download className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold">Installation & Setup</h2>
          </div>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Follow these five steps to go from zero to a fully operational AI agent
            orchestrator managing your business workflows, CRM, marketing automation,
            and financial tracking — all governed by human-in-the-loop safety policies.
          </p>
          <div className="space-y-6">
            {INSTALLATION_STEPS.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:border-blue-400/30 transition-colors"
              >
                <div className="flex items-start gap-5">
                  <span className="text-3xl font-black text-cyan-400/30 leading-none shrink-0">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Tools & Integrations Needed ── */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold">Tools & Integrations You'll Need</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            The AI agent orchestrator connects to your existing tools to execute real
            business operations. Here's what to have ready. All integrations are optional —
            the multi-agent AI platform works with whatever you connect and gracefully skips
            unconfigured services.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {TOOLS_NEEDED.map((tool) => (
              <div
                key={tool.label}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-blue-400/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <tool.icon className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-semibold">{tool.label}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Daily Operations ── */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold">Operating Atlas UX</h2>
          </div>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Once your autonomous AI employee workforce is running, here's how to
            monitor, manage, and get the most out of the AI agent orchestrator platform.
            The governed AI agents handle routine operations automatically — your role
            shifts from doing the work to reviewing decisions and steering strategy.
          </p>
          <div className="space-y-6">
            {OPERATION_GUIDE.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:border-blue-400/30 transition-colors"
              >
                <h3 className="text-base font-semibold mb-2 text-cyan-400">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 5: Startup Checklist ── */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle2 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold">Launch Checklist</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Before enabling the AI agent orchestrator engine, verify these items.
            This checklist ensures your multi-agent AI platform is properly configured
            with all governance policies, integrations, and agent permissions in place.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <ul className="space-y-3">
              {[
                "Account created and email verified on atlasux.cloud",
                "At least one integration connected (email, calendar, or social media)",
                "Auto-spend limit configured in Settings → Governance",
                "Daily action cap set for autonomous AI agents",
                "Decision memo recipients configured (who approves high-risk actions)",
                "AI agent permissions reviewed — disable agents you don't need yet",
                "CRM contact import completed (or ready for agents to build from scratch)",
                "Social media accounts connected for marketing automation agents",
                "Audit trail confirmed working — check Settings → Audit Log",
                "Engine enabled from Dashboard → toggle the orchestrator on",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Section 6: Setup FAQ ── */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold">Setup Questions</h2>
          </div>
          <div className="space-y-2">
            {SETUP_FAQS.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-blue-400/30"
              >
                <summary className="cursor-pointer select-none px-6 py-4 text-base font-medium text-white/90 flex items-center justify-between gap-4">
                  <span>{item.question}</span>
                  <span className="shrink-0 text-white/40 group-open:rotate-45 transition-transform text-xl leading-none">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm leading-relaxed text-slate-400">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="text-center">
          <p className="text-slate-400 mb-6">
            Ready to launch your autonomous AI employee workforce?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/product"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
            >
              Explore the Product
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 hover:border-white/40 transition-colors"
            >
              Read the FAQ
            </Link>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 hover:border-white/40 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
