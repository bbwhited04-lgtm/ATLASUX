import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { faqSchema, webPageSchema } from "../lib/seo/schemas";

/* ─── FAQ Data ─── */

type FAQItem = { q: string; a: string };
type FAQCategory = { title: string; items: FAQItem[] };

const FAQ_DATA: FAQCategory[] = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is Atlas UX?",
        a: "Atlas UX is an AI agent orchestrator platform that deploys 30+ autonomous AI agents to run your business operations. It combines CRM, marketing automation, financial management, workflow automation, and agent coordination in a single governed platform — with human-in-the-loop safety on every high-risk action.",
      },
      {
        q: "Who is Atlas UX built for?",
        a: "Atlas UX is built for small business owners, solopreneurs, and lean teams who need enterprise-grade operations without enterprise-grade headcount. If you're running marketing, support, finance, and operations mostly solo, Atlas UX gives you a full AI workforce managed by a single orchestrator agent.",
      },
      {
        q: "How do I get started with Atlas UX?",
        a: "Visit atlasux.cloud and create an account. The platform walks you through connecting your accounts (email, social media, calendar), configuring your AI agents, and setting governance policies like spend limits and approval rules. Most users are operational within 30 minutes.",
      },
      {
        q: "What platforms does Atlas UX run on?",
        a: "Atlas UX runs as a web app at atlasux.cloud (works in any modern browser) and as a cross-platform desktop app via Electron for Windows, macOS, and Linux. Both versions connect to the same backend and share your agent configurations.",
      },
      {
        q: "Is there a free tier?",
        a: "Yes. Atlas UX offers a free tier that includes access to the platform dashboard, basic agent capabilities, and limited workflow executions. Paid tiers unlock the full 30-agent workforce, advanced integrations, higher action limits, and priority support.",
      },
      {
        q: "How much does Atlas UX cost?",
        a: "Atlas UX starts at $0/month for the free tier. Paid plans range from $29/month for Starter (core agents + basic integrations) to $99/month for Enterprise (full agent workforce, unlimited workflows, priority support, and all integrations). See the Store page for current pricing.",
      },
    ],
  },
  {
    title: "AI Agents & Orchestration",
    items: [
      {
        q: "What is an AI agent orchestrator?",
        a: "An AI agent orchestrator is a central coordinator that manages multiple autonomous AI agents working together. In Atlas UX, the orchestrator agent (named Atlas) acts as a CEO-tier AI — it routes incoming tasks to specialized agents, enforces governance rules, approves or escalates high-risk actions, and ensures all 29 sub-agents work within defined boundaries. Think of it as the brain that coordinates an entire AI workforce.",
      },
      {
        q: "How many AI agents does Atlas UX have?",
        a: "Atlas UX includes 30+ specialized AI agents organized in a 5-tier hierarchy: 1 Orchestrator (Atlas), 5 Executive agents (CTO, CFO, CLO, Auditor, Support Lead), 5 Governor agents (assistants, coordinators), and 19+ Specialist agents handling social media publishing, content creation, research, analytics, and customer engagement across 13+ platforms.",
      },
      {
        q: "What does each AI agent specialize in?",
        a: "Each agent has a defined role: Kelly manages X/Twitter, Fran handles Facebook, Timmy runs TikTok, Venny produces video content for YouTube, Link manages LinkedIn, Donna handles Reddit, Cornwall manages Pinterest, Reynolds writes blog posts, Archy handles Instagram, Terry manages Tumblr, Dwight handles Threads, Emma manages Alignable, Mercer runs customer acquisition, Sunday coordinates cross-platform publishing, Binky leads research, Cheryl handles customer support, Tina manages finances, Larry handles auditing, and Jenny oversees legal compliance.",
      },
      {
        q: "What is the agent hierarchy?",
        a: "Atlas UX uses a 5-tier corporate hierarchy: Tier 1 is the Orchestrator (Atlas — CEO), Tier 2 is the Board (Cheryl, Benny, Jenny, Larry, Tina — C-suite executives), Tier 3 is Governors (Archy, Venny, Penny, Donna, Sunday — team leads), Tier 4 is Specialists (13+ platform-specific agents), and Tier 5 is Subagents (task-specific workers spawned on demand). Each tier has defined authority limits and escalation paths.",
      },
      {
        q: "How does the orchestrator coordinate agents?",
        a: "The Atlas orchestrator runs a daily pipeline: at 05:00 UTC, all 13 intel agents sweep their platforms for trends and opportunities. At 05:45 UTC, Atlas aggregates all 13 reports into a Daily Intelligence Briefing and issues per-agent task orders via email. Agents then execute their publishing workflows, followed by analytics collection. Atlas monitors all activity, enforces spend limits, and escalates anything requiring human approval via decision memos.",
      },
      {
        q: "Can I customize which agents are active?",
        a: "Yes. From the Agent Management panel, you can enable or disable individual agents, adjust their permissions, set per-agent spend limits, configure execution schedules, and define which platforms they can access. You can also create custom workflows that combine multiple agents for complex tasks.",
      },
      {
        q: "What AI models power the agents?",
        a: "Atlas UX agents are powered by frontier AI models including Claude (Anthropic), GPT-4 (OpenAI), DeepSeek, and models via OpenRouter and Cerebras. The orchestrator selects the best model for each task based on cost, capability, and latency. You can configure model preferences per agent.",
      },
      {
        q: "How do agents communicate with each other?",
        a: "Agents communicate through an inter-agent messaging system with full message history logged for audit and review. The orchestrator can delegate tasks, agents can escalate issues, and specialist agents can request resources from executive agents. All communication is visible in the Messaging Hub and logged to the audit trail.",
      },
    ],
  },
  {
    title: "Business Features",
    items: [
      {
        q: "Does Atlas UX include CRM?",
        a: "Yes. Atlas UX includes a built-in CRM with contact management, company tracking, lead scoring, deal pipeline, and relationship history. AI agents automatically update CRM records from every customer interaction — emails, social media messages, support tickets, and phone calls are all logged and linked to the right contact.",
      },
      {
        q: "How does marketing automation work in Atlas UX?",
        a: "Atlas UX provides AI-powered marketing automation across 13+ social media platforms. Dedicated agents (Kelly for X, Fran for Facebook, Timmy for TikTok, etc.) generate platform-specific content, schedule posts via Postiz integration, and track engagement metrics. The Daily Intelligence pipeline ensures content strategy is data-driven — agents analyze trending topics, competitor activity, and audience behavior before creating content.",
      },
      {
        q: "What social media platforms do agents publish to?",
        a: "Atlas UX agents publish to X (Twitter), Facebook, Instagram, LinkedIn, TikTok, YouTube, Reddit, Pinterest, Threads, Tumblr, Alignable, Mastodon, and Medium. Each platform has a dedicated agent trained on platform-specific best practices, content formats, and audience engagement patterns.",
      },
      {
        q: "Does Atlas UX handle financial management?",
        a: "Yes. Atlas UX includes financial management features with AI-powered spend tracking, budget controls, and cost analytics. Agent Tina (CFO) monitors all operational spending, flags anomalies, and enforces spend limits. Every agent action that involves money requires a decision memo approved by a human before execution. Token usage, API costs, and operational expenses are tracked in real-time dashboards.",
      },
      {
        q: "Does Atlas UX support video conferencing?",
        a: "Atlas UX integrates with video conferencing platforms for scheduling and managing meetings. AI agents can schedule meetings, send invitations, prepare agendas, and capture action items. The Business Manager module provides a unified interface for video conferencing alongside email, team chat, and intel briefings.",
      },
      {
        q: "What workflow automation features are included?",
        a: "Atlas UX includes a visual workflow engine with think-plan-stage-submit execution cycles. Workflows range from simple automations (schedule a post, send an email) to complex multi-agent pipelines (daily intel sweep across 13 platforms, aggregate reports, generate content, publish, and track analytics). Every workflow step is logged, versioned, and reversible. The platform runs 56+ predefined workflows across intel, publishing, analytics, reception, and operational categories.",
      },
      {
        q: "Can agents handle email and calendar?",
        a: "Yes. Atlas UX integrates with Microsoft Outlook for email and calendar management, plus Google Calendar via OAuth. Agents can read, compose, and send emails; schedule meetings; manage calendar events; and handle appointment booking. The receptionist agent (Lucy) manages inbound communications including call triage, voicemail processing, and lead capture.",
      },
      {
        q: "Does Atlas UX integrate with Microsoft 365?",
        a: "Yes. Atlas UX integrates with Microsoft 365 including Outlook (email and calendar), Word (document creation), Excel (spreadsheets), SharePoint (file management), and Teams (team chat). OAuth2 authentication ensures secure access, and all integrations are logged to the audit trail.",
      },
    ],
  },
  {
    title: "Safety & Governance",
    items: [
      {
        q: "How does Atlas UX keep AI agents safe?",
        a: "Atlas UX enforces multiple safety layers: daily action caps limit how many actions agents can take, spend limits prevent unauthorized purchases, decision memos require human approval for high-risk actions (risk tier 2+), all mutations are logged to an immutable audit trail, and a System Governance Language (SGL) DSL defines execution rules. Recurring purchases are blocked by default. The platform is designed so AI agents can never take irreversible actions without human consent.",
      },
      {
        q: "What is a decision memo?",
        a: "A decision memo is Atlas UX's approval workflow for high-risk agent actions. When an AI agent wants to perform an action that exceeds its authority — spending above the auto-approve limit, accessing sensitive data, or performing a risk tier 2+ operation — it creates a decision memo explaining the proposed action, its reasoning, cost, and risk assessment. The memo goes to the Decisions inbox where a human reviews and approves or rejects it before execution.",
      },
      {
        q: "Is there an audit trail?",
        a: "Yes. Atlas UX logs every agent action to an immutable audit trail. Every API call, workflow execution, message sent, post published, email delivered, and decision made is recorded with timestamps, agent identity, input/output data, and cost. The audit log is accessible from the Business Manager and is a hard requirement — no mutation can bypass audit logging.",
      },
      {
        q: "What are agent spend limits?",
        a: "Every AI agent in Atlas UX operates under configurable spend limits. The AUTO_SPEND_LIMIT_USD setting defines the maximum amount an agent can spend without human approval. Any action exceeding this limit automatically triggers a decision memo. Additionally, daily spending caps, per-agent budgets, and organization-wide limits provide layered financial controls.",
      },
      {
        q: "Can agents make purchases without approval?",
        a: "Only for small, pre-approved amounts below the auto-spend limit (configurable, defaults to a conservative threshold). Any purchase above the limit, any recurring charge, or any transaction flagged as risk tier 2 or higher requires explicit human approval via a decision memo. Recurring purchases are blocked entirely by default during the Alpha phase.",
      },
      {
        q: "What is human-in-the-loop AI?",
        a: "Human-in-the-loop AI means that AI agents operate autonomously for routine tasks but require human oversight and approval for consequential decisions. In Atlas UX, this manifests as the decision memo system — agents handle day-to-day operations automatically (posting content, responding to messages, updating CRM records) but escalate to humans for spending, risky actions, and edge cases. This gives you the efficiency of AI automation with the safety of human judgment.",
      },
    ],
  },
  {
    title: "Technical & Integration",
    items: [
      {
        q: "What integrations does Atlas UX support?",
        a: "Atlas UX integrates with: Microsoft 365 (Outlook, Word, Excel, SharePoint, Teams), Google (Gmail, Calendar, Sheets), social platforms (Facebook, Instagram, LinkedIn, X, TikTok, YouTube, Reddit, Pinterest, Threads, Tumblr, Alignable, Mastodon, Medium), communication tools (Twilio SMS/Voice, Telegram, Slack, Discord), publishing (Postiz), payments (Stripe), and video conferencing platforms. OAuth2 is used for secure authentication with all third-party services.",
      },
      {
        q: "Is Atlas UX available as a desktop app?",
        a: "Yes. Atlas UX is built with Electron and available as a native desktop app for Windows (.exe), macOS (.dmg/.zip), and Linux (.AppImage, .deb). The desktop app provides the same full experience as the web version at atlasux.cloud, with added benefits like system tray integration and native notifications.",
      },
      {
        q: "What is the tech stack behind Atlas UX?",
        a: "Atlas UX is built on React 18 + Vite + TypeScript for the frontend, Fastify 5 + TypeScript for the backend, PostgreSQL via Prisma ORM for the database, and Electron for the desktop app. The AI engine runs as a separate worker process that ticks every 5 seconds, processing the job queue and coordinating agent actions. The full stack is deployed on AWS Lightsail.",
      },
      {
        q: "How does multi-tenancy work?",
        a: "Every database table in Atlas UX includes a tenant_id foreign key. The backend's tenant plugin extracts the tenant identifier from request headers, ensuring complete data isolation between organizations. Each tenant gets their own set of agents, workflows, CRM data, audit logs, and configurations. This architecture supports multiple businesses on a single platform instance.",
      },
    ],
  },
  {
    title: "What Makes Atlas UX Different",
    items: [
      {
        q: "How is Atlas UX different from workflow automation tools?",
        a: "Traditional workflow automation tools (like drag-and-drop builders) execute predefined sequences: if X happens, do Y. Atlas UX goes further — it deploys autonomous AI agents that reason, plan, and adapt. The orchestrator agent coordinates 29 specialists who understand context, make decisions within safety bounds, and handle tasks that workflow builders can't: writing platform-specific content, analyzing competitor strategy, managing customer relationships, and escalating edge cases to humans.",
      },
      {
        q: "What makes a multi-agent AI platform different from a chatbot?",
        a: "A chatbot is a single AI that responds to prompts one conversation at a time. A multi-agent AI platform like Atlas UX deploys dozens of specialized agents that work proactively — they don't wait for you to ask. Agents monitor platforms, generate content, analyze data, manage CRM records, and coordinate with each other through the orchestrator. It's the difference between having a virtual assistant you talk to and having an AI workforce that runs your operations.",
      },
      {
        q: "Why governed AI agents instead of ungoverned automation?",
        a: "Ungoverned AI agents are dangerous for business — they can spend money you didn't authorize, send messages you didn't approve, or make decisions with no paper trail. Atlas UX governs every agent with spend limits, action caps, decision memos, role-based permissions, and a full audit trail. Governance doesn't slow things down — routine tasks run automatically. It ensures the high-stakes decisions always have a human in the loop.",
      },
      {
        q: "What is an autonomous AI employee?",
        a: "An autonomous AI employee is an AI agent that performs a defined business role without constant human supervision. In Atlas UX, each AI employee has a name, title, email address, and set of responsibilities — just like a human employee. Kelly is your social media manager for X, Tina is your CFO tracking finances, Cheryl is your customer support specialist. They work 24/7 within governed boundaries, escalating to you only when human judgment is needed.",
      },
    ],
  },
];

/* flatten all Q&A for the JSON-LD schema */
const ALL_FAQS = FAQ_DATA.flatMap((c) =>
  c.items.map((i) => ({ question: i.q, answer: i.a })),
);

/* ─── Component ─── */

export default function FAQ() {
  return (
    <div className="min-h-screen text-white relative">
      <SEO
        title="FAQ — AI Agent Orchestrator Platform"
        description="Frequently asked questions about Atlas UX — the multi-agent AI platform with 30+ governed autonomous agents for CRM, marketing automation, financial management, workflow automation, and business operations."
        keywords="ai agent orchestrator, multi-agent ai platform, autonomous ai employee, ai agent CRM, ai agent marketing, ai workforce platform, governed ai agents, human in the loop ai, ai decision memo, ai workflow engine, autonomous business agents, ai operations platform"
        path="faq"
        schema={[
          faqSchema(ALL_FAQS),
          webPageSchema(
            "FAQ — Atlas UX AI Agent Platform",
            "Frequently asked questions about Atlas UX autonomous AI agents, orchestration, CRM, marketing automation, financial management, safety governance, and integrations.",
          ),
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
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about Atlas UX — the AI agent
            orchestrator platform with 30+ governed autonomous agents for
            business operations.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {FAQ_DATA.map((cat) => (
            <section key={cat.title}>
              <h2 className="text-2xl font-bold mb-4 text-cyan-400">
                {cat.title}
              </h2>
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-blue-400/30"
                  >
                    <summary className="cursor-pointer select-none px-6 py-4 text-base font-medium text-white/90 flex items-center justify-between gap-4">
                      <span>{item.q}</span>
                      <span className="shrink-0 text-white/40 group-open:rotate-45 transition-transform text-xl leading-none">
                        +
                      </span>
                    </summary>
                    <div className="px-6 pb-5 text-sm leading-relaxed text-slate-400">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-slate-400 mb-6">
            Still have questions? Check out the product page or get in touch.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/product"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
            >
              Explore the Product
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
