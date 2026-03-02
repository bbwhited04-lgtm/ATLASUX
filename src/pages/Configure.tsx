import { Link } from "react-router-dom";
import {
  Settings, Key, Mail, Globe, Shield, Cpu,
  Calendar, Video, CreditCard, MessageSquare,
  FileText, ExternalLink, BookOpen,
} from "lucide-react";
import SEO from "../components/SEO";
import { webPageSchema } from "../lib/seo/schemas";

const INTEGRATIONS = [
  {
    icon: Mail,
    title: "Microsoft 365",
    desc: "Outlook, Teams, OneDrive, SharePoint, Calendar",
    status: "OAuth 2.0",
    configLink: "/#/app/settings",
  },
  {
    icon: Globe,
    title: "Google Workspace",
    desc: "Gmail, Drive, Calendar, YouTube, GA4, Blogger",
    status: "OAuth 2.0",
    configLink: "/#/app/settings",
  },
  {
    icon: Video,
    title: "Zoom",
    desc: "Meetings, recordings, webhooks, Team Chat",
    status: "OAuth 2.0",
    configLink: "/#/app/settings",
  },
  {
    icon: CreditCard,
    title: "Stripe",
    desc: "Billing, subscriptions, checkout, webhooks",
    status: "API Key + Webhook",
    configLink: "/#/app/settings",
  },
  {
    icon: MessageSquare,
    title: "Social Platforms",
    desc: "X, Reddit, LinkedIn, Facebook, Pinterest, TikTok, Tumblr",
    status: "OAuth / API Key",
    configLink: "/#/app/settings",
  },
  {
    icon: Cpu,
    title: "AI Providers",
    desc: "OpenAI, Gemini, Cerebras, OpenRouter, DeepSeek, Cloudflare",
    status: "API Keys",
    configLink: "/#/app/settings",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Sign in to Atlas UX",
    desc: "Log in at atlasux.cloud and navigate to your dashboard.",
  },
  {
    num: "2",
    title: "Open Settings",
    desc: "Click Settings in the sidebar to access integration configuration.",
  },
  {
    num: "3",
    title: "Connect Integrations",
    desc: "Click Connect next to each service. You'll be guided through the OAuth flow or API key entry.",
  },
  {
    num: "4",
    title: "Configure Agents",
    desc: "Assign email accounts, roles, and workflows to each agent in the Agents Hub.",
  },
];

export default function Configure() {
  return (
    <div className="min-h-screen text-white relative">
      <SEO
        title="Configure — Atlas UX"
        description="Set up and configure Atlas UX — connect integrations, configure agents, and manage your AI workforce platform."
        path="configure"
        schema={[webPageSchema("Configure — Atlas UX", "Set up integrations, agents, and workflows for Atlas UX.")]}
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
            Configure Atlas UX
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Connect your services, configure your agents, and get your AI workforce running.
          </p>
          <a
            href="/#/app/settings"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4" />
            Open Settings Dashboard
          </a>
        </div>

        {/* Setup Steps */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">Setup in 4 Steps</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm font-bold mb-3">
                  {step.num}
                </div>
                <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Available Integrations */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">Available Integrations</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 hover:border-blue-400/30 transition-colors"
              >
                <item.icon className="w-7 h-7 text-blue-400 mb-3" />
                <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400 mb-2">{item.desc}</p>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center text-sm text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/docs" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Documentation
            </Link>
            <Link to="/support" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Support
            </Link>
            <Link to="/privacy" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Privacy
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
