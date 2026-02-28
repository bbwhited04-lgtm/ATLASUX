import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { webPageSchema } from "../lib/seo/schemas";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  Shield,
  Monitor,
  Brain,
  BarChart3,
  Users,
  Mail,
  Search,
  Megaphone,
  Video,
  Palette,
  CalendarDays,
  Globe,
} from "lucide-react";

/* ─── Competitor Data ──────────────────────────────────────────────────────── */

type Competitor = {
  name: string;
  price: string;
  category: string;
};

const competitors: Competitor[] = [
  { name: "Sintra", price: "$97/mo", category: "ai-platform" },
  { name: "Zeely", price: "$30–50/mo", category: "ai-platform" },
  { name: "Holo", price: "$5–8/mo", category: "ai-platform" },
  { name: "Hootsuite", price: "$99/mo", category: "social" },
  { name: "Sprout Social", price: "$249/mo", category: "social" },
  { name: "Sprinklr", price: "$299/mo", category: "social" },
  { name: "Agorapulse", price: "$79/mo", category: "social" },
  { name: "StatusBrew", price: "$69/mo", category: "social" },
  { name: "Sendible", price: "$29/mo", category: "social" },
  { name: "Content Studio", price: "$25/mo", category: "social" },
  { name: "Social Pilot", price: "$30/mo", category: "social" },
  { name: "HubSpot Social", price: "$20/mo", category: "social" },
  { name: "Monday", price: "$8–16/seat", category: "project" },
  { name: "Canva", price: "$13/mo", category: "design" },
  { name: "Runway", price: "$12–76/mo", category: "video" },
  { name: "Minta", price: "$25/mo", category: "video" },
  { name: "JoggAI", price: "$8–50/mo", category: "video" },
  { name: "PictoryAI", price: "$23/mo", category: "video" },
  { name: "InVideo", price: "$25/mo", category: "video" },
  { name: "TopView AI", price: "$35/mo", category: "video" },
  { name: "Tagshop AI", price: "$49/mo", category: "design" },
  { name: "Synthesia", price: "$22/mo", category: "video" },
  { name: "HeyGen", price: "$24/mo", category: "video" },
  { name: "Creatify AI", price: "$29/mo", category: "video" },
];

/* ─── Feature Matrix ───────────────────────────────────────────────────────── */

type Feature = {
  name: string;
  icon: any;
  atlas: true;
  description: string;
};

const coreFeatures: Feature[] = [
  { name: "30+ Autonomous AI Agents", icon: Brain, atlas: true, description: "CRO, CMO, CFO, HR, Legal, IT, and more — a full C-suite workforce" },
  { name: "Built-in CRM", icon: Users, atlas: true, description: "Contact management, deal tracking, pipeline analytics — no extra tool" },
  { name: "Social Media Management", icon: Megaphone, atlas: true, description: "Multi-platform scheduling, monitoring, listening, and analytics" },
  { name: "Email Marketing & Outreach", icon: Mail, atlas: true, description: "Campaign creation, template library, automated sequences" },
  { name: "Deep Research Engine", icon: Search, atlas: true, description: "Multi-source parallel research with web, Reddit, KB, and vector search" },
  { name: "AI Video & Content Creation", icon: Video, atlas: true, description: "Script writing, content generation, image prompts, blog posts" },
  { name: "Business Intelligence", icon: BarChart3, atlas: true, description: "Revenue dashboards, competitor analysis, market intelligence" },
  { name: "Knowledge Base + RAG", icon: Globe, atlas: true, description: "Document ingestion, chunking, Pinecone vector search" },
  { name: "Calendar & Scheduling", icon: CalendarDays, atlas: true, description: "Appointment booking, meeting coordination, availability management" },
  { name: "Desktop App + Cloud", icon: Monitor, atlas: true, description: "Run locally on macOS/Linux/Windows or use the cloud SaaS" },
  { name: "Approval Workflows", icon: Shield, atlas: true, description: "Decision memos for risky actions — human-in-the-loop safety" },
  { name: "Immutable Audit Trail", icon: Zap, atlas: true, description: "Every action logged — compliance-ready from day one" },
  { name: "Design & Creative Tools", icon: Palette, atlas: true, description: "Social graphics, ad creative, brand kit management" },
];

/* ─── "Cost to Replicate" Calculator ───────────────────────────────────────── */

type ToolStack = { tool: string; purpose: string; cost: number };

const replicationStack: ToolStack[] = [
  { tool: "Hootsuite", purpose: "Social media management", cost: 99 },
  { tool: "HubSpot", purpose: "CRM + email marketing", cost: 50 },
  { tool: "Monday", purpose: "Project management", cost: 36 },
  { tool: "Synthesia", purpose: "AI video creation", cost: 22 },
  { tool: "Sprout Social", purpose: "Social listening & analytics", cost: 249 },
  { tool: "Canva Pro", purpose: "Design & creative", cost: 13 },
  { tool: "Sintra", purpose: "AI agent workforce", cost: 97 },
];

const totalReplication = replicationStack.reduce((s, t) => s + t.cost, 0);

/* ─── Category Comparison Tables ───────────────────────────────────────────── */

type ComparisonRow = {
  feature: string;
  atlas: boolean;
  competitors: Record<string, boolean>;
};

type CategoryComparison = {
  title: string;
  icon: any;
  names: string[];
  rows: ComparisonRow[];
};

const categories: CategoryComparison[] = [
  {
    title: "AI Employee Platforms",
    icon: Brain,
    names: ["Sintra", "Zeely", "Holo"],
    rows: [
      { feature: "30+ specialized AI agents", atlas: true, competitors: { Sintra: false, Zeely: false, Holo: false } },
      { feature: "Built-in CRM", atlas: true, competitors: { Sintra: false, Zeely: false, Holo: false } },
      { feature: "Social media management", atlas: true, competitors: { Sintra: true, Zeely: true, Holo: false } },
      { feature: "Deep research engine", atlas: true, competitors: { Sintra: false, Zeely: false, Holo: false } },
      { feature: "Knowledge base + RAG", atlas: true, competitors: { Sintra: false, Zeely: false, Holo: false } },
      { feature: "Desktop app (offline)", atlas: true, competitors: { Sintra: false, Zeely: false, Holo: false } },
      { feature: "Approval workflows", atlas: true, competitors: { Sintra: false, Zeely: false, Holo: false } },
      { feature: "Audit trail", atlas: true, competitors: { Sintra: false, Zeely: false, Holo: false } },
      { feature: "Creative ad generation", atlas: true, competitors: { Sintra: true, Zeely: true, Holo: true } },
      { feature: "Email marketing", atlas: true, competitors: { Sintra: true, Zeely: false, Holo: false } },
    ],
  },
  {
    title: "Social Media Tools",
    icon: Megaphone,
    names: ["Hootsuite", "Sprout Social", "Agorapulse", "Social Pilot"],
    rows: [
      { feature: "Multi-platform scheduling", atlas: true, competitors: { Hootsuite: true, "Sprout Social": true, Agorapulse: true, "Social Pilot": true } },
      { feature: "Social listening & monitoring", atlas: true, competitors: { Hootsuite: true, "Sprout Social": true, Agorapulse: true, "Social Pilot": false } },
      { feature: "AI-generated content", atlas: true, competitors: { Hootsuite: false, "Sprout Social": false, Agorapulse: false, "Social Pilot": false } },
      { feature: "Built-in CRM", atlas: true, competitors: { Hootsuite: false, "Sprout Social": false, Agorapulse: false, "Social Pilot": false } },
      { feature: "AI agent workforce", atlas: true, competitors: { Hootsuite: false, "Sprout Social": false, Agorapulse: false, "Social Pilot": false } },
      { feature: "Business intelligence", atlas: true, competitors: { Hootsuite: false, "Sprout Social": true, Agorapulse: false, "Social Pilot": false } },
      { feature: "Email marketing", atlas: true, competitors: { Hootsuite: false, "Sprout Social": false, Agorapulse: false, "Social Pilot": false } },
      { feature: "Desktop app (offline)", atlas: true, competitors: { Hootsuite: false, "Sprout Social": false, Agorapulse: false, "Social Pilot": false } },
    ],
  },
  {
    title: "AI Video & Content Creation",
    icon: Video,
    names: ["Synthesia", "HeyGen", "Runway", "InVideo"],
    rows: [
      { feature: "AI video generation", atlas: true, competitors: { Synthesia: true, HeyGen: true, Runway: true, InVideo: true } },
      { feature: "Social media management", atlas: true, competitors: { Synthesia: false, HeyGen: false, Runway: false, InVideo: false } },
      { feature: "CRM & contact management", atlas: true, competitors: { Synthesia: false, HeyGen: false, Runway: false, InVideo: false } },
      { feature: "AI agent workforce (30+)", atlas: true, competitors: { Synthesia: false, HeyGen: false, Runway: false, InVideo: false } },
      { feature: "Email marketing", atlas: true, competitors: { Synthesia: false, HeyGen: false, Runway: false, InVideo: false } },
      { feature: "Business intelligence", atlas: true, competitors: { Synthesia: false, HeyGen: false, Runway: false, InVideo: false } },
      { feature: "Knowledge base", atlas: true, competitors: { Synthesia: false, HeyGen: false, Runway: false, InVideo: false } },
      { feature: "Approval workflows", atlas: true, competitors: { Synthesia: false, HeyGen: false, Runway: false, InVideo: false } },
    ],
  },
  {
    title: "Additional Competitors",
    icon: Globe,
    names: ["Canva", "Monday", "HubSpot Social", "Sprinklr"],
    rows: [
      { feature: "AI agent workforce", atlas: true, competitors: { Canva: false, Monday: false, "HubSpot Social": false, Sprinklr: false } },
      { feature: "Social media management", atlas: true, competitors: { Canva: true, Monday: false, "HubSpot Social": true, Sprinklr: true } },
      { feature: "CRM", atlas: true, competitors: { Canva: false, Monday: true, "HubSpot Social": true, Sprinklr: false } },
      { feature: "Design & creative tools", atlas: true, competitors: { Canva: true, Monday: false, "HubSpot Social": false, Sprinklr: false } },
      { feature: "Project management", atlas: true, competitors: { Canva: false, Monday: true, "HubSpot Social": false, Sprinklr: false } },
      { feature: "Deep research engine", atlas: true, competitors: { Canva: false, Monday: false, "HubSpot Social": false, Sprinklr: false } },
      { feature: "Desktop app (offline)", atlas: true, competitors: { Canva: true, Monday: true, "HubSpot Social": false, Sprinklr: false } },
      { feature: "Knowledge base + RAG", atlas: true, competitors: { Canva: false, Monday: false, "HubSpot Social": false, Sprinklr: false } },
    ],
  },
];

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function Compare() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEO
        title="Atlas UX vs The Competition — Compare AI Platforms"
        description="See how Atlas UX stacks up against Sintra, Zeely, Holo, Hootsuite, Sprout Social, Synthesia, HeyGen, Canva, Monday, and 15+ more tools. One platform, 30+ AI agents, fraction of the cost."
        path="compare"
        schema={[webPageSchema("Atlas UX Comparison", "Compare Atlas UX against 25+ competitors in AI, social media, CRM, video, and business intelligence.")]}
      />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a3a] via-[#041127] to-slate-950" />
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-12">
          <Link to="/" className="text-sm text-slate-400 hover:text-white">
            &larr; Back to Home
          </Link>

          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300">
              <Zap className="h-3.5 w-3.5" />
              50% off with code BETA50
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              One platform.{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                30+ AI agents.
              </span>
              <br />
              Fraction of the cost.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Stop paying for 6 different tools. Atlas UX replaces your social media manager,
              CRM, content creator, research team, business analyst, and project manager —
              all powered by autonomous AI agents.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/store"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-8 py-3.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Get Started at $34.95/mo <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#/app"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Try the Desktop App Free
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">

        {/* ── Cost to Replicate ─────────────────────────────────────────── */}
        <section className="mt-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">The Real Cost to Replicate Atlas UX</h2>
            <p className="mt-3 text-slate-400">
              To get everything Atlas UX does, you'd need to stitch together these tools:
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {replicationStack.map((t) => (
              <div
                key={t.tool}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{t.tool}</div>
                  <div className="text-xs text-slate-500">{t.purpose}</div>
                </div>
                <div className="text-lg font-bold text-red-400">${t.cost}/mo</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-8">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wide text-slate-500">Their stack</div>
              <div className="mt-1 text-3xl font-bold text-red-400 line-through decoration-red-500/50">
                ${totalReplication}/mo
              </div>
            </div>
            <div className="text-2xl text-slate-600">vs</div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wide text-slate-500">Atlas UX Starter</div>
              <div className="mt-1 text-3xl font-bold text-cyan-400">$34.95/mo</div>
            </div>
          </div>

          <div className="mt-3 text-center text-sm text-slate-500">
            That's <span className="font-semibold text-cyan-300">{Math.round(totalReplication / 34.95)}x cheaper</span> than cobbling it together yourself.
          </div>
        </section>

        {/* ── All Competitors Grid ─────────────────────────────────────── */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">We Compared Against {competitors.length} Tools</h2>
            <p className="mt-3 text-slate-400">
              Every major player in AI platforms, social media, video creation, and business tools.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {competitors.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/40 px-4 py-2"
              >
                <span className="text-sm text-white">{c.name}</span>
                <span className="text-xs text-slate-500">{c.price}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── What Atlas UX Includes ───────────────────────────────────── */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Everything Included in Atlas UX</h2>
            <p className="mt-3 text-slate-400">
              All of this — for $34.95/mo (Starter) or $149.95/mo (Business Pro).
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.name}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                      <Icon className="h-4.5 w-4.5 text-cyan-400" />
                    </div>
                    <div className="text-sm font-semibold text-white">{f.name}</div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Category Comparisons ─────────────────────────────────────── */}
        <section className="mt-20 space-y-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Head-to-Head Comparisons</h2>
            <p className="mt-3 text-slate-400">
              Feature-by-feature breakdown against every category of competitor.
            </p>
          </div>

          {categories.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <div key={cat.title}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                    <CatIcon className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold">{cat.title}</h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60">
                        <th className="px-4 py-3 text-left font-medium text-slate-400">Feature</th>
                        <th className="px-4 py-3 text-center font-semibold text-cyan-400">Atlas UX</th>
                        {cat.names.map((n) => (
                          <th key={n} className="px-4 py-3 text-center font-medium text-slate-400">{n}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cat.rows.map((row, i) => (
                        <tr
                          key={row.feature}
                          className={i % 2 === 0 ? "bg-slate-900/20" : "bg-slate-900/40"}
                        >
                          <td className="px-4 py-3 text-slate-300">{row.feature}</td>
                          <td className="px-4 py-3 text-center">
                            <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400" />
                          </td>
                          {cat.names.map((n) => (
                            <td key={n} className="px-4 py-3 text-center">
                              {row.competitors[n] ? (
                                <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400/60" />
                              ) : (
                                <XCircle className="mx-auto h-5 w-5 text-slate-700" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Pricing Summary ──────────────────────────────────────────── */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Simple, Honest Pricing</h2>
            <p className="mt-3 text-slate-400">
              Two plans. No per-seat surprises. No hidden fees.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Starter */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Starter</div>
                  <div className="text-xs text-slate-500">Perfect for solo operators</div>
                </div>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold">$34.95</span>
                <span className="text-slate-400">/month</span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                or $29.95/mo billed annually ($359.40/yr)
              </div>
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Full AI agent workforce</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Dashboard & analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Social media management</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> CRM & contact management</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Email integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Knowledge base</li>
              </ul>
              <Link
                to="/store"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Business Pro */}
            <div className="relative rounded-2xl border border-cyan-500/30 bg-slate-900/40 p-8">
              <div className="absolute -top-3 right-6 rounded-full bg-cyan-500 px-4 py-1 text-xs font-semibold text-slate-950">
                Best Value
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Business Pro</div>
                  <div className="text-xs text-slate-500">Unlimited workforce, all features</div>
                </div>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold">$149.95</span>
                <span className="text-slate-400">/month</span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                or $119.95/mo billed annually ($1,439.40/yr)
              </div>
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Everything in Starter</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Unlimited AI workforce</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> AI receptionist (Lucy)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Social media manager</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Calendar & scheduling</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Priority support</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> API access</li>
              </ul>
              <Link
                to="/store"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Go Business Pro <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-5 py-2 text-sm text-cyan-300">
              <Zap className="h-3.5 w-3.5" />
              Use code <span className="font-semibold">BETA50</span> for 50% off your first 6 months
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="mt-20 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent p-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to replace your entire tool stack?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Join the operators who switched to Atlas UX and cut their monthly software bill by {Math.round(((totalReplication - 34.95) / totalReplication) * 100)}%.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/store"
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-8 py-3.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              View Plans & Pricing <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#/app"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Try Atlas UX Free
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
