import React, { useState, useRef } from "react";

const VIDEOS = [
  {
    id: "lucy-animated",
    src: "/videos/Lucyanimated.mp4",
    title: "Meet Lucy",
    subtitle: "Watch Lucy answer a call, book an emergency appointment, send SMS, post to Slack, and email the plumber",
    color: "#06b6d4",
    icon: "🤖",
  },
  {
    id: "lucy",
    src: "/videos/lucy-inbound-demo.mp4",
    title: "Lucy — Inbound Calls",
    subtitle: "AI receptionist answers, books appointments, confirms via SMS",
    color: "#10b981",
    icon: "📞",
  },
  {
    id: "mercer",
    src: "/videos/mercer-outbound-demo.mp4",
    title: "Mercer — Outbound Sales",
    subtitle: "AI sales rep cold-calls, qualifies leads, books demos",
    color: "#f97316",
    icon: "🎯",
  },
  {
    id: "slack",
    src: "/videos/slack-integration-demo.mp4",
    title: "Slack Integration",
    subtitle: "Real-time reports, approvals, and activity — in your Slack",
    color: "#7c3aed",
    icon: "💬",
  },
  {
    id: "zoom",
    src: "/videos/zoom-integration-demo.mp4",
    title: "Zoom Integration",
    subtitle: "AI note-taker with live transcription and action items",
    color: "#2d8cff",
    icon: "🎥",
  },
  {
    id: "language",
    src: "/videos/multi-language-demo.mp4",
    title: "Multi-Language",
    subtitle: "Auto-detects and responds in 8 languages",
    color: "#8b5cf6",
    icon: "🌍",
  },
];

export default function VideoShowcase() {
  const [active, setActive] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSelect = (idx: number) => {
    setActive(idx);
    // Reset and play new video
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const current = VIDEOS[active];

  return (
    <section id="demos" className="py-24 sm:py-32 bg-[#0a0f1e] relative overflow-hidden">
      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px] opacity-20 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: current.color }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            See Atlas UX in Action
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Watch how your AI team handles calls, closes deals, and keeps you in the loop — all on autopilot.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {VIDEOS.map((v, i) => (
            <button
              key={v.id}
              onClick={() => handleSelect(i)}
              className="group flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: active === i ? `${v.color}22` : "transparent",
                border: `1.5px solid ${active === i ? v.color : "rgba(148,163,184,0.2)"}`,
                color: active === i ? v.color : "#94a3b8",
                boxShadow: active === i ? `0 0 20px ${v.color}22` : "none",
              }}
            >
              <span className="text-lg">{v.icon}</span>
              <span className="hidden sm:inline">{v.title}</span>
            </button>
          ))}
        </div>

        {/* Video player */}
        <div className="relative max-w-4xl mx-auto">
          <div
            className="rounded-2xl overflow-hidden border transition-colors duration-500"
            style={{ borderColor: `${current.color}44` }}
          >
            <video
              ref={videoRef}
              key={current.src}
              className="w-full aspect-video bg-black"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source src={current.src} type="video/mp4" />
            </video>
          </div>

          {/* Caption */}
          <div className="mt-6 text-center">
            <h3 className="text-xl font-bold text-white mb-1">{current.title}</h3>
            <p className="text-slate-400">{current.subtitle}</p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <a
            href="tel:+15737422028"
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-10 py-5 text-lg font-extrabold text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.55)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <span className="animate-pulse">📞</span>
            Call Lucy Now — (573) 742-2028
          </a>
          <p className="mt-3 text-sm text-emerald-300/70 font-medium">
            Try free for 14 days — No card required
          </p>
        </div>
      </div>
    </section>
  );
}
