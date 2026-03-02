import { Link } from "react-router-dom";
import { Mail, MessageSquare, FileText, Shield, Clock, ExternalLink, BookOpen } from "lucide-react";
import SEO from "../components/SEO";
import { webPageSchema } from "../lib/seo/schemas";

const SUPPORT_CHANNELS = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "Reach our support team directly.",
    detail: "support@deadapp.info",
    href: "mailto:support@deadapp.info",
    linkLabel: "Send Email",
  },
  {
    icon: MessageSquare,
    title: "In-App Chat",
    desc: "Talk to Atlas or Cheryl inside the app.",
    detail: "Available in the Atlas UX dashboard under Chat.",
    href: "/#/app/chat",
    linkLabel: "Open Chat",
  },
  {
    icon: FileText,
    title: "Documentation",
    desc: "Guides, API reference, and agent configuration.",
    detail: "Browse our knowledge base and developer docs.",
    href: "/#/docs",
    linkLabel: "View Docs",
  },
];

const FAQ = [
  {
    q: "How do I connect my email or calendar?",
    a: "Go to Settings → Integrations and follow the OAuth flow for Microsoft 365 or Google Workspace. Atlas will guide you through the connection process.",
  },
  {
    q: "What AI models does Atlas UX use?",
    a: "Atlas UX routes across multiple providers including Google Gemini, OpenRouter, Cerebras, and Cloudflare Workers AI. The system automatically selects the best model for each task.",
  },
  {
    q: "How does the approval system work?",
    a: "Any action involving recurring costs, spending above your configured limit, or risk tier 2+ requires human approval via a Decision Memo before execution.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Atlas UX uses JWT authentication, row-level security on all database tables, tenant isolation, and a full audit trail on every mutation. Secrets are never transmitted via email.",
  },
  {
    q: "How do I add or configure agents?",
    a: "Navigate to the Agents Hub in the dashboard. Each agent has a dedicated configuration panel with email, role, and workflow settings.",
  },
  {
    q: "What happens if an agent makes a mistake?",
    a: "All agent actions are logged in the audit trail. High-risk actions require human approval before execution. You can review, approve, or reject any pending action in the Decisions Inbox.",
  },
];

export default function Support() {
  return (
    <div className="min-h-screen text-white relative">
      <SEO
        title="Support — Atlas UX"
        description="Get help with Atlas UX. Contact support, browse documentation, or find answers in our FAQ."
        path="support"
        schema={[webPageSchema("Support — Atlas UX", "Get help with Atlas UX — contact support, browse docs, or check the FAQ.")]}
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
            Support
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Need help? We're here. Reach out through any channel below or browse our FAQ.
          </p>
        </div>

        {/* Support Channels */}
        <div className="grid sm:grid-cols-3 gap-6 mb-20">
          {SUPPORT_CHANNELS.map((ch) => (
            <div
              key={ch.title}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:border-blue-400/30 transition-colors"
            >
              <ch.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold mb-1">{ch.title}</h3>
              <p className="text-sm text-slate-400 mb-3">{ch.desc}</p>
              <p className="text-xs text-slate-500 mb-4">{ch.detail}</p>
              <a
                href={ch.href}
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {ch.linkLabel}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
              >
                <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-slate-200 hover:text-white transition-colors list-none flex items-center justify-between">
                  {item.q}
                  <span className="text-slate-500 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Response Times */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 mb-20">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">Response Times</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Email Support</p>
              <p className="font-semibold">Within 24 hours</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">In-App Chat</p>
              <p className="font-semibold">Immediate (AI) / 4 hours (human)</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Critical Issues</p>
              <p className="font-semibold">Within 2 hours</p>
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="text-center text-sm text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Terms of Service
            </Link>
            <Link to="/acceptable-use" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Acceptable Use
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
