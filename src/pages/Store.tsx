import React from "react";
import { Link } from "react-router-dom";

export default function Store() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-5xl px-6 pt-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-300 hover:text-white">
            ← Back to Home
          </Link>
          <Link to="/payment" className="text-sm text-slate-300 hover:text-white">
            Payment
          </Link>
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">Store</h1>
        <p className="mt-2 text-sm text-slate-400">
          Products, plans, add-ons. (Wire this into Stripe later.)
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <div className="grid gap-6 md:grid-cols-3">
          <PlanCard
            title="Starter"
            price="$0"
            bullets={[
              "Core dashboard",
              "Basic workflows",
              "Limited automations",
            ]}
            cta="Get Started"
            to="/#/app"
          />
          <PlanCard
            title="Pro"
            price="$29/mo"
            bullets={[
              "Operations Suite",
              "Integrations portal",
              "Audit logs + accounting",
            ]}
            cta="Choose Pro"
            to="/payment"
          />
          <PlanCard
            title="Enterprise"
            price="Let’s talk"
            bullets={[
              "Custom deployment",
              "Security & compliance",
              "Dedicated onboarding",
            ]}
            cta="Contact Sales"
            to="/payment"
          />
        </div>

        <Footer />
      </main>
    </div>
  );
}

function PlanCard({
  title,
  price,
  bullets,
  cta,
  to,
}: {
  title: string;
  price: string;
  bullets: string[];
  cta: string;
  to: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-sm text-slate-300">{price}</div>
      </div>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-200">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <Link
        to={to}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
      >
        {cta}
      </Link>
    </div>
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
        <Link to="/payment" className="hover:text-white">
          Payment
        </Link>
      </div>
      <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} Atlas UX</p>
    </div>
  );
}
