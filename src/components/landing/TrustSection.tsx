import React from "react";

/* ── Inline SVG icons ── */
function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function MedicalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

/* ── Trust badges data ── */
const TRUST_BADGES = [
  { label: "256-bit Encrypted", icon: <LockIcon /> },
  { label: "SOC2 Ready", icon: <ShieldIcon /> },
  { label: "99.9% Uptime", icon: <ServerIcon /> },
  { label: "HIPAA Aware", icon: <MedicalIcon /> },
];

/* ── Testimonial placeholder cards ── */
const TESTIMONIALS = [
  {
    quote:
      "Your story could be here. Be one of our first 50 customers and get grandfathered pricing for life.",
    name: "Your Name, Your Business",
  },
  {
    quote:
      "I used to lose walk-ins while I was finishing a cut. Now Lucy handles every call and I haven't missed a booking in weeks.",
    name: "Your Name, Your Salon",
  },
  {
    quote:
      "Customers were calling after hours and hanging up. Lucy picks up every time and schedules the service call right then.",
    name: "Your Name, Your Plumbing Co.",
  },
];

export default function TrustSection() {
  return (
    <section className="bg-[#0a0f1e] py-24 px-4">
      <div className="mx-auto max-w-5xl space-y-20">

        {/* ── Founder story ── */}
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#69b2cd]/20 ring-2 ring-[#69b2cd]/40">
              <span className="text-2xl font-bold text-[#69b2cd]">BT</span>
            </div>
          </div>

          {/* Quote */}
          <div>
            <blockquote className="text-lg leading-relaxed text-[#bab2b5] md:text-xl">
              <span className="text-3xl leading-none text-[#69b2cd]">"</span>
              I'm Billy. I built Lucy because my barber kept missing calls and
              losing customers. Every missed call is a missed paycheck. Now Lucy
              answers for businesses like yours — 24 hours a day, 7 days a week.
              <span className="text-3xl leading-none text-[#69b2cd]">"</span>
            </blockquote>
            <p className="mt-4 text-sm font-semibold text-[#69b2cd]">
              Billy T., Founder
            </p>
          </div>
        </div>

        {/* ── Money-back guarantee ── */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#3d5474]/40 bg-[#0e1626]/60 p-8 text-center">
          <div className="flex items-center gap-3">
            <span className="text-[#69b2cd]">
              <ShieldIcon className="h-8 w-8" />
            </span>
            <h3 className="text-xl font-bold text-white">
              30-Day Money-Back Guarantee
            </h3>
          </div>
          <p className="max-w-xl text-[#bab2b5]">
            If Lucy doesn't catch calls worth more than her monthly cost, we'll
            refund every penny.
          </p>
        </div>

        {/* ── Testimonial placeholder cards ── */}
        <div>
          <h3 className="mb-8 text-center text-2xl font-bold text-white">
            What customers are saying
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-dashed border-[#3d5474]/60 bg-[#0e1626]/40 p-6"
              >
                <p className="italic text-[#bab2b5]/70">"{t.quote}"</p>
                <p className="mt-4 text-sm font-semibold text-[#3d5474]">
                  — {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust badges ── */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 rounded-xl border border-[#3d5474]/30 bg-[#0e1626]/40 px-4 py-2 text-sm text-[#bab2b5]"
            >
              <span className="text-[#bab2b5]/60">{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
