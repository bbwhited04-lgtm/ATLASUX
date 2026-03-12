import { useState } from "react";

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-green-400 mt-0.5 shrink-0"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const standardFeatures = [
  "Lucy answers calls 24/7",
  "200 calls/month included",
  "Appointment booking",
  "SMS confirmations to callers",
  "Call summaries via text/email",
  "1 business location",
];

const teamFeatures = [
  "Everything in Standard",
  "5 team member seats",
  "Priority support",
  "Mercer outbound calling (coming soon)",
  "Advanced analytics dashboard",
  "Custom greeting scripts",
];

const enterpriseFeatures = [
  "Everything in Team",
  "Unlimited locations",
  "Dedicated onboarding manager",
  "Custom SLA",
  "API access",
  "White-label option",
];

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="bg-[#080c18] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Less Than One{" "}
            <span className="gradient-text text-glow">Missed Appointment</span>
          </h2>
          <p className="text-[#bab2b5] text-lg max-w-xl mx-auto">
            Lucy pays for herself after catching a single $150 service call you
            would have missed.
          </p>

          {/* Annual / Monthly Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span
              className={`text-sm font-medium transition-colors ${
                !isAnnual ? "text-white" : "text-[#bab2b5]"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual((prev) => !prev)}
              className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#69b2cd] ${
                isAnnual ? "bg-[#3e70a5]" : "bg-[#3d5474]"
              }`}
              aria-label="Toggle billing period"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${
                isAnnual ? "text-white" : "text-[#bab2b5]"
              }`}
            >
              Annual
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* ── Tier 1: Standard (highlighted) ── */}
          <div className="relative rounded-2xl border border-cyan-500/40 bg-[#0e1626]/60 p-8 flex flex-col glow-sky">
            {/* Most Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-[#3e70a5] to-[#69b2cd] text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Standard</h3>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-4xl font-bold text-white">
                  ${isAnnual ? "990" : "99"}
                </span>
                <span className="text-[#bab2b5] mb-1">
                  /{isAnnual ? "yr" : "mo"}
                </span>
                {isAnnual && (
                  <span className="ml-2 mb-1 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    save $198
                  </span>
                )}
              </div>
              {isAnnual && (
                <p className="text-[#bab2b5] text-sm mt-1">$82.50/mo billed annually</p>
              )}
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {standardFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <CheckIcon />
                  <span className="text-[#bab2b5] text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="#early-access"
              className="block text-center bg-gradient-to-r from-[#3e70a5] to-[#69b2cd] text-white font-semibold py-3 rounded-xl transition-opacity hover:opacity-90"
            >
              Start 14-Day Free Trial
            </a>
          </div>

          {/* ── Tier 2: Team ── */}
          <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Team</h3>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-4xl font-bold text-white">
                  ${isAnnual ? "1,490" : "149"}
                </span>
                <span className="text-[#bab2b5] mb-1">
                  /{isAnnual ? "yr" : "mo"}
                </span>
                {isAnnual && (
                  <span className="ml-2 mb-1 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    save $298
                  </span>
                )}
              </div>
              {isAnnual && (
                <p className="text-[#bab2b5] text-sm mt-1">$124.17/mo billed annually</p>
              )}
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {teamFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <CheckIcon />
                  <span className="text-[#bab2b5] text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="#early-access"
              className="block text-center border border-[#3d5474] text-[#69b2cd] font-semibold py-3 rounded-xl transition-colors hover:border-[#69b2cd]/60 hover:bg-[#69b2cd]/5"
            >
              Start 14-Day Free Trial
            </a>
          </div>

          {/* ── Tier 3: Enterprise ── */}
          <div className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Enterprise</h3>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-4xl font-bold text-white">$40</span>
                <span className="text-[#bab2b5] mb-1">/seat/mo</span>
              </div>
              <p className="text-[#bab2b5] text-sm mt-1">Volume pricing available</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {enterpriseFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <CheckIcon />
                  <span className="text-[#bab2b5] text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="mailto:billy@deadapp.info"
              className="block text-center border border-[#3d5474] text-[#69b2cd] font-semibold py-3 rounded-xl transition-colors hover:border-[#69b2cd]/60 hover:bg-[#69b2cd]/5"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
