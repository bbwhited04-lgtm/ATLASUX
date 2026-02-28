import { Link } from "react-router-dom";
import {
  Zap, Shield, Globe, Users, Code2, Heart,
  Mail, ExternalLink, Cpu, Database, Layers, Rocket,
} from "lucide-react";
import SEO from "../components/SEO";
import { organizationSchema, webPageSchema } from "../lib/seo/schemas";

const FOUNDER = {
  name: "Billy Whited",
  title: "Founder & CEO — Dead App Corp",
  email: "billy@deadapp.info",
  bio: "Veteran, builder, and automation obsessive. Started Atlas UX from scratch — from Figma wireframe to live product — with the belief that AI should work for people, not the other way around. Looking for technical co-founders who want to build something real.",
};

const STACK = [
  { icon: Layers,    label: "React + Vite",     desc: "TypeScript frontend, hash-routed SPA" },
  { icon: Zap,       label: "Fastify",           desc: "High-performance Node.js backend on Render" },
  { icon: Database,  label: "PostgreSQL + Prisma", desc: "Hosted on Supabase with row-level security" },
  { icon: Cpu,       label: "AI Agents",         desc: "Atlas, Binky, Tina, Larry, Cheryl, Sunday — and 20+ specialist agents" },
  { icon: Shield,    label: "Security-first",    desc: "JWT auth, tenant isolation, Zod validation, audit trail on every action" },
  { icon: Globe,     label: "Cross-platform",    desc: "Web app + Electron desktop build + iOS companion (coming soon)" },
];

const TIMELINE = [
  { year: "2024",  event: "Concept sketched in Figma. First wireframe published." },
  { year: "Early 2025", event: "Went live — frontend deployed, backend wired to Render." },
  { year: "Mid 2025",   event: "Agent hierarchy built: Board → Executive → Governor → Specialist → Subagent tiers, 30+ autonomous agents." },
  { year: "Late 2025",  event: "Integrations hub, OAuth flows, KB, Blog, Decisions inbox." },
  { year: "2026 Q1",    event: "Mobile pairing backend, security hardening, desktop Electron build." },
  { year: "2026 →",     event: "iOS companion app, iCloud sync, co-founder search ongoing." },
];

export default function About() {
  return (
    <div className="min-h-screen text-white relative">
      <SEO
        title="About Atlas UX — Meet the Team"
        description="Atlas UX was built from scratch by Billy Whited — from Figma wireframe to live product. Learn about the mission, tech stack, and timeline behind the AI employee platform."
        path="about"
        schema={[organizationSchema(), webPageSchema("About Atlas UX", "Learn about the founder, tech stack, and mission behind Atlas UX.")]}
      />
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a3a] via-[#041127] to-black" />
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-cyan-400/10 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-140px] h-[440px] w-[440px] rounded-full bg-indigo-500/10 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <main className="mx-auto max-w-4xl px-6 py-12 relative z-10">
        {/* Back nav */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        {/* Hero */}
        <section className="mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 mb-6">
            <Rocket className="w-3.5 h-3.5" />
            Built in the open · Still building
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            About{" "}
            <span className="text-cyan-300">Atlas UX</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Atlas UX is a standalone AI employee platform — a desktop-first, local-capable system
            that connects your accounts, orchestrates AI agents, and executes real business
            workflows. Built by one person, for builders who ship.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-12 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-semibold">The mission</h2>
          </div>
          <p className="text-white/75 leading-relaxed mb-4">
            Most AI tools are chat interfaces with fancy branding. Atlas UX is different —
            it's designed to <strong className="text-white">take action</strong>: schedule posts,
            draft contracts, send emails, monitor Reddit, approve decisions, and track every move
            in an audit log. A real AI worker, not just a chatbot.
          </p>
          <p className="text-white/75 leading-relaxed">
            The platform runs locally (Electron desktop), connects via web, and will sync
            with your iPhone once the iOS companion app clears Apple review. Privacy-first,
            execution-focused, built to grow with your business.
          </p>
        </section>

        {/* Founder */}
        <section className="mb-12 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-semibold">Founder</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-3xl font-bold text-cyan-300">
              B
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{FOUNDER.name}</div>
              <div className="text-sm text-cyan-400 mb-3">{FOUNDER.title}</div>
              <p className="text-sm text-white/70 leading-relaxed mb-4">{FOUNDER.bio}</p>
              <a
                href={`mailto:${FOUNDER.email}?subject=Atlas%20UX%20-%20Hello`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {FOUNDER.email}
              </a>
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Code2 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-semibold">How it's built</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {STACK.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-0.5">{label}</div>
                  <div className="text-xs text-white/55">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-12 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-semibold mb-6">Timeline</h2>
          <div className="space-y-4">
            {TIMELINE.map(({ year, event }, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-24 text-xs font-mono text-cyan-400 pt-0.5 flex-shrink-0">{year}</div>
                <div className="flex-1 flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 flex-shrink-0" />
                    {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                  </div>
                  <p className="text-sm text-white/70 pb-4">{event}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Co-founder CTA */}
        <section className="mb-12 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-8">
          <h2 className="text-xl font-semibold mb-2">Looking for a technical co-founder</h2>
          <p className="text-sm text-white/70 mb-5">
            If you're a senior engineer or systems architect who wants equity in a real product —
            not a pitch deck — reach out. Long-term, desktop-first, local-first. Execution over everything.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:billy@deadapp.info?subject=ATLAS%20UX%20-%20Co-founder%20Intro"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              Email Billy
            </a>
            <a
              href="#/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Back to home
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-8 text-sm text-slate-400">
          <div className="flex flex-wrap gap-6 justify-center mb-4">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/store" className="hover:text-white">Store</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/acceptable-use" className="hover:text-white">Acceptable Use</Link>
          </div>
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Atlas UX — a product of DEAD APP CORP, a Missouri closed corporation owned by THE DEAD APP CORP TRUST. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
