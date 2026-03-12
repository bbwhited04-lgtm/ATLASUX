import React from "react";

const HERO_IMG =
  "https://cdn.sintra.ai/img/wW4zexi0-Fp-E8zwMNqGxlBgEenpK2sesXjLmsGF8K4/g:ce/rs:fill:0:0:0/czM6Ly9zaW50cmEtYnJhaW5haS1tZWRpYS8zOTI3ZTZiMS1jOGQxLTQ4YjUtYmI5MS01Y2E3MDAyZjI0YzkvZDgzOTUzNzYtYjljMS00Y2I5LTllNjMtMWJhNjAwY2I4NDIyLWF0bGFzaW1hZ2UucG5n.jpg";

const STATS = [
  { val: "24/7", label: "Always Answering" },
  { val: "<2s", label: "Response Time" },
  { val: "$99", label: "Per Month" },
  { val: "200+", label: "Calls Included" },
];

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center bg-[#0a0f1e]">
      <div className="max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

          {/* ── Left column: copy + CTAs ── */}
          <div>
            {/* Live badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium tracking-wider text-emerald-400 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
              Live — Call Right Now: (573) 742-2028
            </span>

            {/* Headline */}
            <h1 className="mt-8 text-5xl font-bold tracking-tight leading-[1.1] sm:text-6xl lg:text-7xl">
              <span className="gradient-text text-glow">Never Miss</span>
              <br />
              Another Call
            </h1>

            {/* Subhead */}
            <p className="mt-6 max-w-lg text-xl font-semibold text-white">
              Lucy answers your business phone 24/7 — books appointments, takes
              messages, and sounds human.
            </p>
            <p className="mt-2 max-w-lg text-base text-[#bab2b5]">
              Starting at $99/mo.
            </p>

            {/* Social proof line */}
            <p className="mt-4 text-sm text-[#69b2cd] font-medium">
              Answers in under 2 rings &middot; Books appointments &middot; Costs
              less than one missed job
            </p>

            {/* Stats row */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map(({ val, label }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-3 text-center"
                >
                  <div className="text-2xl font-bold text-white">{val}</div>
                  <div className="mt-1 text-xs text-[#3d5474]">{label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {/* Primary: call Lucy */}
              <a
                href="tel:+15737422028"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#3e70a5] to-[#69b2cd] px-8 py-5 text-lg font-bold text-white shadow-lg glow-blue hover:opacity-90 transition"
              >
                <PhoneIcon className="h-6 w-6 shrink-0" />
                Call Lucy Now: (573) 742-2028
              </a>

              {/* Secondary: free trial */}
              <a
                href="#early-access"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3d5474]/50 bg-[#0e1626]/70 px-6 py-4 text-sm font-semibold text-[#69b2cd] hover:border-[#69b2cd]/50 hover:bg-[#0e1626] transition"
              >
                Start 14-Day Free Trial — No Credit Card
              </a>
            </div>
          </div>

          {/* ── Right column: hero image ── */}
          <div className="relative">
            <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/40 p-2 glow-sky">
              <img
                src={HERO_IMG}
                alt="Lucy — AI Receptionist for Trade Businesses"
                className="w-full rounded-xl"
                loading="eager"
              />
            </div>

            {/* Floating badge: live */}
            <div className="absolute -top-4 -right-4 rounded-xl border border-[#3d5474]/40 bg-[#0e1626]/90 backdrop-blur px-4 py-2 text-xs hidden lg:block">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
                <span className="font-semibold text-white">Lucy Is Live</span>
              </div>
              <div className="mt-1 text-[#3d5474]">Answering calls now</div>
            </div>

            {/* Floating badge: booking */}
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-[#3d5474]/40 bg-[#0e1626]/90 backdrop-blur px-4 py-2 text-xs hidden lg:block">
              <div className="font-semibold text-white">Latest Booking</div>
              <div className="mt-1 text-[#3d5474]">HVAC tune-up &middot; Tomorrow 10 AM</div>
              <div className="mt-0.5 text-[#3d5474]">Booked via phone &middot; No human needed</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 text-center text-xs text-[#3d5474] tracking-widest uppercase">
          Scroll
        </div>
      </div>
    </section>
  );
}
