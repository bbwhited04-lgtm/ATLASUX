import React from "react";

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
    { emoji: "🗄️", name: "PostgreSQL", sub: "Database" },
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

const SectionBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-[#3d5474]/40 bg-[#0e1626]/80 px-4 py-1.5 text-xs font-medium tracking-wider text-[#69b2cd] uppercase">
    <span className="h-1.5 w-1.5 rounded-full bg-[#69b2cd] pulse-dot" />
    {children}
  </span>
);

export default function IntegrationsSection() {
  return (
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
          {["📞 Twilio","🟦 Microsoft","✈️ Telegram","💬 SMS","🤖 OpenAI","🗄️ PostgreSQL","🔍 Google","📘 Facebook"].map((item) => {
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
      </div>
    </section>
  );
}
