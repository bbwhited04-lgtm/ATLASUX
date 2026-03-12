import React from "react";

/* ── Inline SVG icons ── */
function PhoneArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 9.8 19.79 19.79 0 0 1 1 1.18 2 2 0 0 1 2.98 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      <polyline points="16 3 22 3 22 9" />
      <line x1="15" y1="9" x2="22" y2="3" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/* ── Steps data ── */
const STEPS = [
  {
    number: "1",
    title: "Forward Your Number",
    icon: <PhoneArrowIcon />,
    description:
      "Point your business phone to Lucy. Takes 2 minutes — we'll walk you through it.",
  },
  {
    number: "2",
    title: "Lucy Answers",
    icon: <ChatBubbleIcon />,
    description:
      "She greets callers by your business name, books appointments, takes messages, and handles FAQs.",
  },
  {
    number: "3",
    title: "You Get Notified",
    icon: <BellIcon />,
    description:
      "Instant text and email with every call summary. New bookings land on your calendar automatically.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#080c18] py-24 px-4">
      <div className="mx-auto max-w-5xl">

        {/* ── Heading ── */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            How It{" "}
            <span className="gradient-text">Works</span>
          </h2>
          <p className="mx-auto max-w-xl text-lg text-[#bab2b5]">
            Lucy is answering calls for businesses right now. Here's how it
            works:
          </p>
        </div>

        {/* ── Steps grid ── */}
        <div className="relative grid gap-6 lg:grid-cols-3">
          {/* Connector line — desktop only */}
          <div
            className="absolute top-[3.5rem] left-1/3 right-1/3 hidden h-px bg-[#3d5474]/40 lg:block"
            aria-hidden="true"
          />

          {STEPS.map((step) => (
            <div
              key={step.number}
              className="relative rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-6"
            >
              {/* Number badge */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#69b2cd]/20 ring-2 ring-[#69b2cd]/50">
                  <span className="text-sm font-bold text-[#69b2cd]">
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Icon */}
              <div className="mb-4 text-[#69b2cd]">{step.icon}</div>

              {/* Text */}
              <h3 className="mb-2 text-lg font-bold text-white">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#bab2b5]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* ── Try-it CTA ── */}
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-[#bab2b5]">
            Hear it for yourself — call right now:
          </p>
          <a
            href="tel:+15737422028"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#69b2cd]/50 bg-[#69b2cd]/10 px-8 py-4 text-xl font-bold text-[#69b2cd] transition-colors hover:bg-[#69b2cd]/20 hover:border-[#69b2cd]"
          >
            (573) 742-2028
          </a>
          <p className="text-xs text-[#bab2b5]/60">
            Live demo line — Lucy will answer
          </p>
        </div>

      </div>
    </section>
  );
}
