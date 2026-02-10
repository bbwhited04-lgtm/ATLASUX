import React from "react";

const YOUTUBE_ID = "QtTn_o6zXDY";

export default function Landing() {
  return (
    <div className="min-h-screen text-white relative">
      {/* Background (NON-INTERACTIVE) */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a3a] via-[#041127] to-black" />

        {/* Glow blobs */}
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-cyan-400/12 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-140px] h-[440px] w-[440px] rounded-full bg-indigo-500/12 blur-[130px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12 relative z-10">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              The AI Worker that{" "}
              <span className="text-cyan-300">works where</span>,{" "}
              <span className="text-blue-300">you</span>{" "}
              <span className="text-indigo-300">work</span>
            </h1>

            <p className="mt-4 max-w-xl text-lg text-white/75">
              ATLAS UX is a standalone, cross-platform desktop automation platform
              that connects accounts, orchestrates agents, and executes real workflows —
              locally.
            </p>

            {/* Primary CTAs */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#/app"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold !text-black !opacity-100 shadow hover:opacity-90"
              >
                Open ATLAS UX (Preview)
              </a>

              <a
                href="#builders"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Builders / Co-founders
              </a>

              <a
                href={`https://www.youtube.com/watch?v=${YOUTUBE_ID}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Watch on YouTube
              </a>
            </div>

            {/* Value props */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ["Local-first", "Run core workflows on your machine."],
                ["Privacy-first", "Keep control of your data."],
                ["Modular integrations", "Connect apps/accounts as needed."],
                ["Execution-focused", "Agents that do tasks, not just chat."],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-1 text-sm text-white/65">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Video */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1`}
                  title="ATLAS UX Pitch"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            <p className="mt-3 text-sm text-white/60">
              60-second overview • atlasux.cloud
            </p>
          </div>
        </section>

        {/* Dev updates */}
        <section id="updates" className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-baseline justify-between gap-4">
    `       <h2 className="text-xl font-semibold">Dev updates</h2>
            <span className="text-sm text-white/60">Last updated: Feb 10, 2026</span>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/75">
              <li>Started construction of an idea with Figma, for clean user friendly standalone ai employee</li>
              <li>Stated initial seating pricing and stored UI on supabase for demo mode only</li>
              <li>Published Initial UI(user interface) wireframe to web from Figma.</li>
              <li>Removed Demo Mode only and went live with frontend at Vercel</li>
              <li>Set up backend wiring to run through onrender</li>
              <li>Started work with ChatGPT 5.2 to integrate my wireframe into a real program</li>
              <li>Created first backend files, frontend files index.html</li>
              <li>Published 60s pitch video + cross-platform posts.</li>
              <li>Integration UX wiring in progress (connect → verify → import).</li>
              <li>Stabilizing desktop builds and routing across pages.</li>
              <li>Fighting Demons and Gremlins buried in the code, all about them routes.</li>
              <li>Added AppGate functionality for security.</li>
              <li>Added Task/Workflows Functionality.</li>
              <li>Rebuilding Mobile Companion App/link. Rebuilding Atlas Avatar with Blender, New look coming soon. </li>
              
            </ul>

          <div className="mt-5 flex gap-3">
            <a
              href="#/app/integrations"
              className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore integrations
            </a>
            <a
              href="#/app"
              className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Open app home
            </a>
          </div>
        </section>

        {/* Builders */}
        <section id="builders" className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Builders / co-founders</h2>
          <p className="mt-3 text-sm text-white/70">
            Looking for a technical co-founder to build a desktop-first,
            local-first automation platform long-term — equity, ownership,
            real execution.
          </p>

          <div className="mt-5">
            <a
              href="mailto:billy@deadapp.info?subject=ATLAS%20UX%20-%20Builder%20Intro"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold !text-black hover:opacity-90"
            >
              Email Billy
            </a>
          </div>
        </section>

        <footer className="mt-12 pb-6 text-center text-xs text-white/40">
          © 2026 ATLAS UX — a DEAD APP CORP company
        </footer>
      </main>
    </div>
  );
}
