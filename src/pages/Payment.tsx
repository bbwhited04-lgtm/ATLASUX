import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { webPageSchema } from "../lib/seo/schemas";

export default function Payment() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SEO
        title="Billing & Payment"
        description="Atlas UX billing and payment information — checkout instructions, Stripe integration, refund policy, and subscription management."
        path="payment"
        schema={[webPageSchema("Billing & Payment", "Atlas UX billing information and checkout instructions.")]}
      />
      <header className="mx-auto max-w-4xl px-6 pt-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-300 hover:text-white">
            ← Back to Home
          </Link>
          <Link to="/store" className="text-sm text-slate-300 hover:text-white">
            Store
          </Link>
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">Payment & Billing</h1>
        <p className="mt-2 text-sm text-slate-400">
          Billing information and checkout instructions live here.
        </p>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <Section title="Billing Overview">
          <ul className="list-disc space-y-2 pl-6 text-slate-200">
            <li>Subscriptions and add-ons may be billed monthly or annually.</li>
            <li>Taxes may apply depending on location and account type.</li>
            <li>Payment processing is handled by third-party processors.</li>
          </ul>
        </Section>

        <Section title="Refunds & Cancellations">
          <p className="text-slate-200">
            All subscription payments are non-refundable. You may cancel your subscription at any time, and your access will continue through the end of the current billing period. No partial refunds are issued for unused time. Contact support@deadapp.info for billing questions.
          </p>
        </Section>

        <Section title="Need help?">
          <p className="text-slate-200">
            Contact support through the app for billing questions or invoice requests.
          </p>
        </Section>

        <Footer />
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
        {children}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <div className="mt-14 border-t border-slate-800 pt-8 text-sm text-slate-400">
      <div className="flex flex-wrap gap-4">
        <Link to="/privacy" className="hover:text-white">
          Privacy
        </Link>
        <Link to="/terms" className="hover:text-white">
          Terms
        </Link>
        <Link to="/acceptable-use" className="hover:text-white">
          Acceptable Use
        </Link>
      </div>
      <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} Atlas UX</p>
    </div>
  );
}
