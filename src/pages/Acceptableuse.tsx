import React from "react";
import { Link } from "react-router-dom";

export default function AcceptableUse() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-4xl px-6 pt-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-300 hover:text-white">
            ← Back to Home
          </Link>
          <Link to="/terms" className="text-sm text-slate-300 hover:text-white">
            Terms
          </Link>
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">Acceptable Use Policy</h1>
        <p className="mt-2 text-sm text-slate-400">
          Use Atlas UX responsibly. Don’t use it to harm people, systems, or businesses.
        </p>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <Section title="You agree not to:">
          <ul className="list-disc space-y-2 pl-6 text-slate-200">
            <li>Break laws or encourage illegal activity.</li>
            <li>Attempt to hack, disrupt, or overload systems.</li>
            <li>Phish, scam, impersonate, or misrepresent identity/authority.</li>
            <li>Upload malware or attempt unauthorized access to accounts/services.</li>
            <li>Use the Services to harass, threaten, or exploit others.</li>
            <li>Use automations in ways that violate third-party terms or user consent.</li>
            <li>Bypass security, rate limits, or usage restrictions.</li>
          </ul>
        </Section>

        <Section title="Automation & Integrations">
          <p className="text-slate-200">
            If you connect third-party services (email, calendar, storage, etc.), you are responsible for ensuring
            you have permission and that your use complies with those services’ policies.
          </p>
        </Section>

        <Section title="Enforcement">
          <p className="text-slate-200">
            Violations may result in restriction, suspension, or termination of access, and may be reported where
            legally required.
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
        <Link to="/payment" className="hover:text-white">
          Payment
        </Link>
      </div>
      <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} Atlas UX</p>
    </div>
  );
}
