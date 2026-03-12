import React from "react";
import SEO from "../components/SEO";
import { organizationSchema, productSchema, faqSchema } from "../lib/seo/schemas";
import HeroSection from "../components/landing/HeroSection";
import HowItWorks from "../components/landing/HowItWorks";
import VerticalSection from "../components/landing/VerticalSection";
import PricingSection from "../components/landing/PricingSection";
import TrustSection from "../components/landing/TrustSection";
import AgentRoster from "../components/landing/AgentRoster";
import IntegrationsSection from "../components/landing/IntegrationsSection";
import EarlyAccessForm from "../components/landing/EarlyAccessForm";

export default function Landing() {
  return (
    <div className="min-h-screen text-white relative">
      <SEO
        title="Atlas UX — AI Receptionist for Trade Businesses | Never Miss Another Call"
        description="Lucy answers your business phone 24/7 — books appointments, takes messages, sounds human. Starting at $99/mo. Call now: (573) 742-2028."
        keywords="ai receptionist, ai phone answering, virtual receptionist for small business, ai appointment booking, never miss a call, lucy ai receptionist, trade business phone answering, salon receptionist ai, plumber answering service, hvac phone answering"
        schema={[
          organizationSchema(),
          productSchema(),
          faqSchema([
            { question: "What is Lucy?", answer: "Lucy is an AI receptionist that answers your business phone 24/7. She books appointments, takes messages, sends SMS confirmations, and sounds human — starting at $99/month." },
            { question: "How does Lucy work?", answer: "Forward your business phone to Lucy. She answers calls with your business name, books appointments into your calendar, takes messages, and texts you a summary of every call instantly." },
            { question: "What types of businesses use Lucy?", answer: "Lucy is built for trade businesses — salons, barbers, plumbers, HVAC technicians, dentists, electricians, and other service professionals who can't afford to miss calls while working." },
            { question: "How much does Lucy cost?", answer: "Lucy starts at $99/month for the Standard plan (200 calls/month, appointment booking, SMS confirmations). Team plan is $149/month. All plans include a 14-day free trial with no credit card required." },
            { question: "Can I try Lucy before signing up?", answer: "Yes! Call (573) 742-2028 right now and hear Lucy answer. You can also start a 14-day free trial with no credit card required." },
          ]),
        ]}
      />

      {/* Background Layer */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0f1e]" />
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-cyan-400/12 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-140px] h-[440px] w-[440px] rounded-full bg-indigo-500/12 blur-[130px]" />
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/80 via-transparent to-[#0a0f1e]/40" />
      </div>

      <main className="relative z-10">
        <HeroSection />
        <HowItWorks />
        <VerticalSection />
        <PricingSection />
        <TrustSection />
        <AgentRoster />
        <IntegrationsSection />
        <EarlyAccessForm />
      </main>
    </div>
  );
}
