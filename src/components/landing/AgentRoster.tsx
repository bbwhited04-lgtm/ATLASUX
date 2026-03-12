import React from "react";

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

const SectionBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-[#3d5474]/40 bg-[#0e1626]/80 px-4 py-1.5 text-xs font-medium tracking-wider text-[#69b2cd] uppercase">
    <span className="h-1.5 w-1.5 rounded-full bg-[#69b2cd] pulse-dot" />
    {children}
  </span>
);

const Connector = () => (
  <div className="flex justify-center py-3">
    <div className="h-10 w-px bg-gradient-to-b from-[#3e70a5] to-[#69b2cd]" />
  </div>
);

export default function AgentRoster() {
  return (
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
  );
}
