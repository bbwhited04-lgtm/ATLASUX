import { Link } from "react-router-dom";
import {
  BookOpen, Cpu, Shield, Zap, Globe, Database,
  Mail, Key, Users, Settings, FileText, ExternalLink,
} from "lucide-react";
import SEO from "../components/SEO";
import { webPageSchema } from "../lib/seo/schemas";

const SECTIONS = [
  {
    title: "Getting Started",
    icon: Zap,
    items: [
      { label: "Quick Start Guide", desc: "Set up your Atlas UX workspace in under 5 minutes." },
      { label: "Connecting Integrations", desc: "Link Microsoft 365, Google Workspace, Zoom, Slack, and more." },
      { label: "Understanding the Dashboard", desc: "Overview of the main dashboard, watcher, and agent panels." },
    ],
  },
  {
    title: "Agents",
    icon: Cpu,
    items: [
      { label: "Agent Hierarchy", desc: "Board → Executive → Governor → Specialist → Subagent tiers explained." },
      { label: "Agent Configuration", desc: "Email accounts, roles, workflows, and personality settings." },
      { label: "Agent Communication", desc: "How agents email, escalate, and coordinate through Atlas." },
    ],
  },
  {
    title: "Workflows",
    icon: Globe,
    items: [
      { label: "Workflow Registry", desc: "All registered workflows, triggers, and execution rules." },
      { label: "Decision Memos", desc: "How approval gates work — triggers, thresholds, and human review." },
      { label: "Scheduled Workflows", desc: "Cron-based and event-driven workflow execution." },
    ],
  },
  {
    title: "Security & Compliance",
    icon: Shield,
    items: [
      { label: "Authentication", desc: "JWT tokens, session management, and multi-tenant isolation." },
      { label: "Audit Trail", desc: "Every mutation logged — agent actions, approvals, and system events." },
      { label: "Guardrails", desc: "Spending limits, daily action caps, risk tiers, and compliance stops." },
    ],
  },
  {
    title: "API Reference",
    icon: Database,
    items: [
      { label: "Chat API", desc: "POST /v1/chat — multi-model AI routing with provider fallback." },
      { label: "Decision Memos API", desc: "Create, list, approve, and reject decision memos." },
      { label: "Audit API", desc: "Query audit logs with filtering by agent, action, and date range." },
      { label: "Webhook Endpoints", desc: "Zoom, Stripe, and external service webhook handlers." },
    ],
  },
  {
    title: "Integrations",
    icon: Key,
    items: [
      { label: "Microsoft 365", desc: "Outlook, Teams, OneDrive, SharePoint, Calendar." },
      { label: "Google Workspace", desc: "Gmail, Drive, Calendar, YouTube, GA4, Blogger." },
      { label: "Social Platforms", desc: "X, Reddit, LinkedIn, Facebook, Pinterest, TikTok, Tumblr." },
      { label: "Zoom", desc: "Meetings, recordings, webhooks, and Team Chat." },
      { label: "Stripe", desc: "Billing, subscriptions, checkout, and webhook events." },
    ],
  },
];

export default function Docs() {
  return (
    <div className="min-h-screen text-white relative">
      <SEO
        title="Documentation — Atlas UX"
        description="Atlas UX documentation — guides, API reference, agent configuration, integrations, and security compliance."
        path="docs"
        schema={[webPageSchema("Documentation — Atlas UX", "Guides, API reference, and configuration docs for Atlas UX.")]}
      />

      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a3a] via-[#041127] to-black" />
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-cyan-400/10 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Documentation
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Everything you need to configure, deploy, and operate Atlas UX.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-6">
                <section.icon className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-blue-400/30 transition-colors"
                  >
                    <h3 className="text-sm font-semibold mb-1">{item.label}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-20 text-center text-sm text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/support" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Support
            </Link>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Privacy
            </Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Terms
            </Link>
          </div>
          <p className="text-slate-600">
            Dead App Corp — Atlas UX &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
