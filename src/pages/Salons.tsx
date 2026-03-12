import React from "react";
import SEO from "../components/SEO";
import HeroSection from "../components/landing/HeroSection";
import PricingSection from "../components/landing/PricingSection";
import TrustSection from "../components/landing/TrustSection";
import EarlyAccessForm from "../components/landing/EarlyAccessForm";

const SALON_FEATURES = [
  { title: "Appointment Booking", desc: "Lucy checks your calendar and books clients into open slots — no double-bookings." },
  { title: "Service Menu Awareness", desc: "She knows your cuts, colors, and treatments. Quotes prices and duration accurately." },
  { title: "Walk-In Availability", desc: "Lucy tells callers if you can take a walk-in right now, or offers the next open slot." },
  { title: "Confirmation Texts", desc: "After booking, Lucy texts the client a confirmation with date, time, and address." },
  { title: "No-Show Follow-Up", desc: "Missed appointments get an automatic follow-up text to reschedule." },
  { title: "After-Hours Coverage", desc: "Lucy answers at 11pm the same way she answers at 11am. Never miss a late-night booker." },
];

export default function Salons() {
  return (
    <div className="min-h-screen text-white">
      <SEO
        title="Lucy for Salons & Barbers — AI Receptionist That Books Appointments"
        description="Never lose a booking to voicemail again. Lucy answers your salon phone 24/7, books appointments, and sends confirmations — while you focus on your clients."
        keywords="salon receptionist ai, barber phone answering, salon appointment booking ai, ai receptionist for salons"
      />

      {/* Hero — reuse but with salon overlay messaging */}
      <section className="bg-[#0a0f1e] py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium tracking-wider text-emerald-400 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
            For Salons & Barbers
          </span>
          <h1 className="mt-8 text-5xl font-bold tracking-tight leading-[1.1] sm:text-6xl">
            <span className="gradient-text text-glow">Never Lose</span>
            <br />a Booking Again
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-[#bab2b5]">
            Lucy answers your salon phone, books appointments, and sends confirmations — while you focus on your clients.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="tel:+15737422028"
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#3e70a5] to-[#69b2cd] px-8 py-5 text-lg font-bold text-white shadow-lg glow-blue hover:opacity-90 transition"
            >
              Call Lucy Now: (573) 742-2028
            </a>
            <a
              href="#/app"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3d5474]/50 bg-[#0e1626]/70 px-6 py-4 text-sm font-semibold text-[#69b2cd] hover:border-[#69b2cd]/50 transition"
            >
              Start 14-Day Free Trial
            </a>
          </div>
        </div>
      </section>

      {/* Salon-specific features */}
      <section className="bg-[#080c18] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Built for <span className="gradient-text">Salon Workflows</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SALON_FEATURES.map((f) => (
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
