import React from "react";

const YOUTUBE_ID = "QtTn_o6zXDY";

export default function Landing() {
  return (
    <div className="min-h-screen text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a3a] via-[#041127] to-black" />
        {/* soft glow */}
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute top-40 right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute bottom-[-120px] left-[-120px] h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-[120px]" />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
            <span className="font-semibold tracking-wide">ATLAS UX</span>
            <span className="text-white/50">•</span>
            <span>Desktop-first • Local-first • Privacy-first</span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <a
              href="#updates"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              Dev Updates
            </a>
            <a
              href="#builders"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              Builders
            </a>
          </div>
        </div>

        {/* Hero */}
        <section className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              The AI Worker <span className="text-cyan-300">who works</span>{" "}
              <span className="text-blue-300">where you work</span>.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              ATLAS UX is a standalone, cross-platform desktop automation platform.
              Connect accounts, orchestrate agents, and execute real workflows — without
              living inside 20 SaaS tabs.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#/app"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm hover:opacity-90"
              >
                Open the app
              </a>

              <a
                href="#builders"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                Build with us
              </a>

              <a
                href={`https://www.youtube.com/watch?v=${YOUTUBE_ID}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                Watch on YouTube
              </a>
            </div>

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

          {/* Video card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm">
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

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-white/85">
                60-second overview
              </div>
              <div className="text-xs text-white/50">
                http://atlasux.cloud
              </div>
            </div>

            <p className="mt-2 text-sm text-white/60">
              If the embed ever fails (YouTube settings), use the “Watch on YouTube”
              button above.
            </p>
          </div>
        </section>

        {/* Updates */}
        <section
          id="updates"
          className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold">Dev updates</h2>
            <div className="text-xs text-white/50">
              Last updated: Feb 6, 2026
            </div>
          </div>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/70">
            <li>Landing deployed to Vercel + routing stabilized.</li>
            <li>Integrations flow moving from demo-mode → real connect/verify/import.</li>
            <li>Desktop builds and UI wiring continue to harden across pages.</li>
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="#/app/integrations"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              Explore integrations
            </a>
            <a
              href="#/app"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              Open app home
            </a>
          </div>
        </section>

        {/* Builders */}
        <section
          id="builders"
          className="mt-10 grid gap-6 lg:grid-cols-2"
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Builders / co-founders</h2>
            <p className="mt-3 text-sm text-white/70">
              I’m looking for a technical co-founder who wants to build a desktop-first,
              local-first automation platform long-term — equity, ownership, and real
              product execution.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="mailto:billy@deadapp.info?subject=ATLAS%20UX%20-%20Builder%20Intro"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                Email Billy
              </a>
              <a
                href="#/app"
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                See the app
              </a>
            </div>

            <p className="mt-4 text-xs text-white/45">
              Tip: If you’re sharing this page, send the /#/app link too so they can
              jump straight into the UI.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">What ATLAS UX is</h2>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <p>
                A unified control center for connected accounts, workflows, and AI agents —
                designed to execute tasks where your work actually happens.
              </p>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold text-white/70">One-liner</div>
                <div className="mt-1 text-sm text-white/80">
                  “ATLAS UX is a local-first desktop AI automation platform that executes
                  real work — not just conversations.”
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-12 pb-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} ATLAS UX — a DEAD APP CORP company
        </footer>
      </main>
    </div>
  );
}
