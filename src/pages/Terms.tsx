import React from "react";
import { Link } from "react-router-dom";

export default function Terms() {
  const effectiveDate = "February 12, 2026";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-4xl px-6 pt-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-300 hover:text-white">
            ← Back to Home
          </Link>
          <Link to="/privacy" className="text-sm text-slate-300 hover:text-white">
            Privacy
          </Link>
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Effective: {effectiveDate}</p>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <Section title="1. Agreement">
          <p className="text-slate-200">
            By accessing or using Atlas UX, you agree to these Terms. If you do not agree, do not use the Services.
          </p>
        </Section>

        <Section title="2. Accounts">
          <ul className="list-disc space-y-2 pl-6 text-slate-200">
            <li>You’re responsible for maintaining account security and credentials.</li>
            <li>You must provide accurate information and keep it updated.</li>
            <li>You’re responsible for activity under your account.</li>
          </ul>
        </Section>

        <Section title="3. Acceptable Use">
          <p className="text-slate-200">
            You agree to comply with our Acceptable Use Policy and all applicable laws.
          </p>
          <div className="mt-3">
            <Link to="/acceptable-use" className="text-cyan-300 hover:text-cyan-200">
              Read Acceptable Use →
            </Link>
          </div>
        </Section>

        <Section title="4. Integrations & Connected Accounts">
          <p className="text-slate-200">
            If you connect third-party services, you authorize Atlas UX to access and process data as needed to
            provide the integration. You may revoke access by disconnecting the integration.
          </p>
        </Section>

        <Section title="5. Subscriptions & Billing">
          <p className="text-slate-200">
            Paid features may require a subscription or payment. Billing terms may be described on the Payment page.
          </p>
          <div className="mt-3">
            <Link to="/payment" className="text-cyan-300 hover:text-cyan-200">
              Payment & Billing →
            </Link>
          </div>
        </Section>

        <Section title="6. Intellectual Property">
          <p className="text-slate-200">
            The Services and related content are owned by Atlas UX or licensors and protected by applicable laws.
            You receive a limited, non-exclusive license to use the Services in accordance with these Terms.
          </p>
        </Section>

        <Section title="7. Disclaimers">
          <p className="text-slate-200">
            The Services are provided “as is” and “as available.” We disclaim warranties to the maximum extent
            permitted by law.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p className="text-slate-200">
            To the maximum extent permitted by law, Atlas UX is not liable for indirect, incidental, or consequential
            damages, or loss of profits/data.
          </p>
        </Section>

        <Section title="9. Termination">
          <p className="text-slate-200">
            We may suspend or terminate access if you violate these Terms or for security/operational reasons.
          </p>
        </Section>

        <Section title="10. Contact">
          <p className="text-slate-200">Questions? Contact support through the app.</p>
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
        <Link to="/acceptable-use" className="hover:text-white">
          Acceptable Use
        </Link>
        <Link to="/store" className="hover:text-white">
          Store
        </Link>
      </div>
      <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} Atlas UX</p>
    </div>
  );
}
