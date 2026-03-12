import React from "react";
import SEO from "../components/SEO";
import PricingSection from "../components/landing/PricingSection";
import TrustSection from "../components/landing/TrustSection";
import EarlyAccessForm from "../components/landing/EarlyAccessForm";

const PLUMBER_FEATURES = [
  { title: "Emergency Triage", desc: "Lucy asks the right questions — burst pipe vs dripping faucet — and prioritizes accordingly." },
  { title: "Job Detail Capture", desc: "She captures address, issue description, access instructions, and preferred time window." },
  { title: "Callback Scheduling", desc: "If you're on a job, Lucy schedules a callback window and texts you the details." },
  { title: "After-Hours Coverage", desc: "Pipes burst at 2am. Lucy answers at 2am. No voicemail, no lost emergency calls." },
  { title: "SMS Job Summaries", desc: "Every call becomes a text with the customer's name, address, issue, and urgency level." },
  { title: "Quote Requests", desc: "Lucy can collect job details for quote requests and forward them to you in a structured format." },
];

export default function Plumbers() {
  return (
    <div className="min-h-screen text-white">
      <SEO
        title="Lucy for Plumbers & HVAC — AI Receptionist That Captures Every Job"
        description="Never lose a $300 service call to voicemail. Lucy answers your phone on the job site, captures details, and texts you the summary."
        keywords="plumber receptionist ai, hvac phone answering, plumber appointment booking ai, ai receptionist for plumbers"
      />

      {/* Hero */}
      <section className="bg-[#0a0f1e] py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium tracking-wider text-emerald-400 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
            For Plumbers & HVAC
          </span>
          <h1 className="mt-8 text-5xl font-bold tracking-tight leading-[1.1] sm:text-6xl">
            <span className="gradient-text text-glow">Never Lose a $300 Job</span>
            <br />to Voicemail
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-[#bab2b5]">
            Lucy answers your phone on the job site, captures the details, and texts you the summary.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="tel:+15737422028"
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#3e70a5] to-[#69b2cd] px-8 py-5 text-lg font-bold text-white shadow-lg glow-blue hover:opacity-90 transition"
            >
              Call Lucy Now: (573) 742-2028
            </a>
            <a
              href="#early-access"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3d5474]/50 bg-[#0e1626]/70 px-6 py-4 text-sm font-semibold text-[#69b2cd] hover:border-[#69b2cd]/50 transition"
            >
              Start 14-Day Free Trial
            </a>
          </div>
        </div>
      </section>

      {/* Plumber-specific features */}
      <section className="bg-[#080c18] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Built for <span className="gradient-text">Service Professionals</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLUMBER_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-[#3d5474]/30 bg-[#0e1626]/60 p-5">
                <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-[#bab2b5] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />
      <TrustSection />
      <EarlyAccessForm />
    </div>
  );
}
