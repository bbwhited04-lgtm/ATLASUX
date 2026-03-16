import React from "react";
import SEO from "../components/SEO";
import { organizationSchema } from "../lib/seo/schemas";
import {
  Phone, Calendar, MessageSquare, Globe, DollarSign,
  Users, TrendingUp, Shield, Clock, ChevronDown,
} from "lucide-react";

/* ── Slide data ──────────────────────────────────────────── */

const PROBLEM_STATS = [
  { stat: "6.1M", label: "Trade businesses in the US" },
  { stat: "62%", label: "Calls go unanswered during work hours" },
  { stat: "85%", label: "Callers who hit voicemail call a competitor" },
  { stat: "$78B", label: "Annual revenue lost to missed calls" },
];

const LUCY_FEATURES = [
  { icon: Phone, title: "Answers Every Call", desc: "24/7, no voicemail, no hold music. Lucy picks up in 2 rings." },
  { icon: Calendar, title: "Books Appointments", desc: "Checks your calendar, negotiates a time, confirms the booking." },
  { icon: MessageSquare, title: "SMS Confirmations", desc: "Sends the customer a text with date, time, and address." },
  { icon: Globe, title: "8 Languages", desc: "Detects the caller's language in 3 seconds and switches automatically." },
];

const COMPETITORS = [
  { name: "Human Receptionist", price: "$2,400–$4,000/mo", limitation: "Business hours only, one language" },
  { name: "Smith.ai", price: "$285+/mo", limitation: "Per-call overage, limited hours" },
  { name: "Ruby", price: "$400+/mo", limitation: "Human-dependent, expensive" },
  { name: "Voicemail", price: "Free", limitation: "85% of callers hang up" },
  { name: "Lucy (Atlas UX)", price: "$99/mo", limitation: "24/7, 8 languages, books + confirms + notifies", highlight: true },
];

const MARKET = [
  { label: "TAM", value: "$7.2B", desc: "6.1M trade businesses × $1,188/yr" },
  { label: "SAM", value: "$2.5B", desc: "2.1M businesses with 5+ calls/day" },
  { label: "SOM (Year 5)", value: "$12M ARR", desc: "10,000 businesses at $99/mo" },
];

/* ── Components ──────────────────────────────────────────── */

function Slide({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <section id={id} className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative">
      {children}
    </section>
  );
}

function SlideTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 text-center">{children}</h2>;
}

function SlideSubtitle({ children }: { children: React.ReactNode }) {
  return <p className="text-lg sm:text-xl text-slate-400 mb-12 text-center max-w-2xl">{children}</p>;
}

function ScrollHint() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-slate-500">
      <ChevronDown size={28} />
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function Pitch() {
  return (
    <div className="min-h-screen text-white relative">
      <SEO
        title="Atlas UX — Investor Pitch | AI Receptionist for Trade Businesses"
        description="Lucy answers the phone for 6.1 million trade businesses that can't. 24/7, 8 languages, $99/month. See the pitch."
        keywords="atlas ux pitch deck, ai receptionist startup, lucy ai, trade business ai, sbir"
        path="pitch"
        schema={[organizationSchema()]}
      />

      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0f1e]" />
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-cyan-400/12 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-140px] h-[440px] w-[440px] rounded-full bg-indigo-500/12 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <main className="relative z-10">

        {/* ── SLIDE 1: Title ──────────────────────────────── */}
        <Slide id="title">
          <img src="/images/atlas_hero.png" alt="Atlas UX" className="w-20 h-20 mb-6 rounded-2xl" />
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white text-center leading-tight mb-4">
            Your plumber can't answer the phone.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Lucy can.
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-400 text-center max-w-2xl mt-4">
            AI Receptionist for Trade Businesses — 24/7, 8 Languages, $99/mo
          </p>
          <p className="text-sm text-slate-600 mt-8">Dead App Corp (DBA Atlas UX)</p>
          <ScrollHint />
        </Slide>

        {/* ── SLIDE 2: Problem ────────────────────────────── */}
        <Slide id="problem">
          <SlideTitle>The Problem</SlideTitle>
          <SlideSubtitle>
            Trade businesses make money with their hands — they can't answer the phone while they're under a sink, behind a chair, or on a roof.
          </SlideSubtitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl w-full">
            {PROBLEM_STATS.map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  {s.stat}
                </div>
                <div className="text-sm text-slate-400 mt-2">{s.label}</div>
              </div>
            ))}
          </div>
          <ScrollHint />
        </Slide>

        {/* ── SLIDE 3: Solution — Lucy ────────────────────── */}
        <Slide id="solution">
          <SlideTitle>Meet Lucy</SlideTitle>
          <SlideSubtitle>
            She answers every call, books every appointment, and never takes a day off.
          </SlideSubtitle>
          <div className="flex flex-col md:flex-row items-center gap-10 max-w-5xl w-full">
            <img
              src="/images/lucyanswering.png"
              alt="Lucy answering a call"
              className="w-full md:w-1/2 rounded-2xl border border-white/10 shadow-2xl shadow-cyan-500/10"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {LUCY_FEATURES.map((f) => (
                <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <f.icon className="text-cyan-400 mb-2" size={24} />
                  <div className="font-semibold text-white text-sm">{f.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <ScrollHint />
        </Slide>

        {/* ── SLIDE 4: How It Works ──────────────────────── */}
        <Slide id="how">
          <SlideTitle>How It Works</SlideTitle>
          <SlideSubtitle>Three steps. Five minutes. Done.</SlideSubtitle>
          <div className="flex flex-col sm:flex-row gap-8 max-w-3xl w-full">
            {[
              { step: "1", title: "Forward Your Phone", desc: "Point your business line to Lucy. Takes 2 minutes with any carrier." },
              { step: "2", title: "Lucy Answers", desc: "She greets callers by your business name, handles their request, and books appointments into your calendar." },
              { step: "3", title: "You Get Notified", desc: "SMS summary + Slack notification after every call. Full transcript in your dashboard." },
            ].map((s) => (
              <div key={s.step} className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-bold text-lg mx-auto mb-4">
                  {s.step}
                </div>
                <div className="font-semibold text-white mb-2">{s.title}</div>
                <div className="text-sm text-slate-400">{s.desc}</div>
              </div>
            ))}
          </div>
          <ScrollHint />
        </Slide>

        {/* ── SLIDE 5: Demo Image — Salon ─────────────────── */}
        <Slide id="demo">
          <SlideTitle>Built for Every Trade</SlideTitle>
          <SlideSubtitle>Plumbers, salons, HVAC techs, electricians, dentists — anyone who works with their hands.</SlideSubtitle>
          <img
            src="/images/lucysalon.png"
            alt="Lucy helping a salon"
            className="w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl shadow-emerald-500/10"
          />
          <ScrollHint />
        </Slide>

        {/* ── SLIDE 6: Competition ────────────────────────── */}
        <Slide id="competition">
          <SlideTitle>The Competition</SlideTitle>
          <SlideSubtitle>We're not competing with Salesforce. We're competing with the missed call.</SlideSubtitle>
          <div className="max-w-3xl w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-slate-400 font-medium">Solution</th>
                  <th className="py-3 px-4 text-slate-400 font-medium">Price</th>
                  <th className="py-3 px-4 text-slate-400 font-medium">Limitation</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c) => (
                  <tr
                    key={c.name}
                    className={`border-b border-white/5 ${c.highlight ? "bg-cyan-400/10" : ""}`}
                  >
                    <td className={`py-3 px-4 ${c.highlight ? "text-cyan-400 font-bold" : "text-white"}`}>
                      {c.name}
                    </td>
                    <td className={`py-3 px-4 ${c.highlight ? "text-cyan-400 font-bold" : "text-slate-300"}`}>
                      {c.price}
                    </td>
                    <td className={`py-3 px-4 ${c.highlight ? "text-emerald-400" : "text-slate-400"}`}>
                      {c.limitation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ScrollHint />
        </Slide>

        {/* ── SLIDE 7: Market ─────────────────────────────── */}
        <Slide id="market">
          <SlideTitle>Market Opportunity</SlideTitle>
          <SlideSubtitle>Every trade business with a phone is a potential customer.</SlideSubtitle>
          <div className="flex flex-col sm:flex-row gap-6 max-w-3xl w-full">
            {MARKET.map((m) => (
              <div key={m.label} className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">{m.label}</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  {m.value}
                </div>
                <div className="text-sm text-slate-400 mt-2">{m.desc}</div>
              </div>
            ))}
          </div>
          <ScrollHint />
        </Slide>

        {/* ── SLIDE 8: Business Model ─────────────────────── */}
        <Slide id="model">
          <SlideTitle>Business Model</SlideTitle>
          <SlideSubtitle>SaaS subscription with usage-based overage.</SlideSubtitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl w-full">
            {[
              { icon: DollarSign, label: "Standard", value: "$99/mo" },
              { icon: Users, label: "Team", value: "$149/mo" },
              { icon: TrendingUp, label: "LTV:CAC", value: "11.9x" },
              { icon: Shield, label: "Gross Margin", value: "60–70%" },
            ].map((m) => (
              <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <m.icon className="text-cyan-400 mx-auto mb-2" size={20} />
                <div className="text-xs text-slate-500 uppercase tracking-wider">{m.label}</div>
                <div className="text-xl font-bold text-white mt-1">{m.value}</div>
              </div>
            ))}
          </div>
          <ScrollHint />
        </Slide>

        {/* ── SLIDE 9: Traction & Tech ────────────────────── */}
        <Slide id="traction">
          <SlideTitle>Built & Running</SlideTitle>
          <SlideSubtitle>This isn't a pitch deck for a concept. Lucy is live.</SlideSubtitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl w-full">
            {[
              { stat: "33", label: "AI agents in production" },
              { stat: "30+", label: "Days zero critical incidents" },
              { stat: "500ms", label: "Voice response latency" },
              { stat: "8", label: "Languages supported" },
              { stat: "24/7", label: "Availability" },
              { stat: "1", label: "Founder. Everything." },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-2xl font-bold text-cyan-400">{s.stat}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <ScrollHint />
        </Slide>

        {/* ── SLIDE 10: Founder ───────────────────────────── */}
        <Slide id="founder">
          <SlideTitle>The Founder</SlideTitle>
          <div className="max-w-2xl text-center">
            <img
              src="/images/atlas-team.png"
              alt="Billy Whited — Founder"
              className="w-32 h-32 rounded-full mx-auto mb-6 border-2 border-cyan-400/30 object-cover"
            />
            <h3 className="text-2xl font-bold text-white">Billy Whited</h3>
            <p className="text-cyan-400 text-sm mb-4">Founder & CEO — Dead App Corp (DBA Atlas UX)</p>
            <p className="text-slate-400 leading-relaxed">
              61 years old. 35 years as a truck driver. 5 years as a small business owner.
              Built every line of Atlas UX — frontend, backend, AI agents, voice pipeline, governance framework —
              because he lived the problem. He knows what it's like to miss a call
              because your hands are full. Lucy exists so no trade business has to miss one again.
            </p>
          </div>
          <ScrollHint />
        </Slide>

        {/* ── SLIDE 11: The Ask ───────────────────────────── */}
        <Slide id="ask">
          <SlideTitle>The Ask</SlideTitle>
          <SlideSubtitle>Non-dilutive funding to scale Lucy to 10,000 trade businesses.</SlideSubtitle>
          <div className="max-w-2xl w-full space-y-4">
            {[
              { label: "NSF SBIR Phase I", amount: "$305,000", status: "Proposal ready" },
              { label: "Army SBIR AI/ML", amount: "$250,000", status: "Proposal ready" },
              { label: "AFWERX Open Topic", amount: "$75,000–$750,000", status: "Proposal ready" },
            ].map((a) => (
              <div key={a.label} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-5">
                <div>
                  <div className="font-semibold text-white">{a.label}</div>
                  <div className="text-xs text-slate-500">{a.status}</div>
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  {a.amount}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <a
              href="tel:+15737422028"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold px-8 py-4 rounded-full text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              <Phone size={20} />
              Call Lucy Now: (573) 742-2028
            </a>
            <p className="text-slate-500 text-sm mt-4">Hear her answer. That's the product.</p>
          </div>
        </Slide>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="text-center py-12 text-slate-600 text-xs">
          <p>Atlas UX &middot; Dead App Corp &middot; billy@deadapp.info</p>
          <p className="mt-1">atlasux.cloud</p>
        </div>
      </main>
    </div>
  );
}
