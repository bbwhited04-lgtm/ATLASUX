import React from "react";
import { Link } from "react-router-dom";

export default function Privacy() {
  const effectiveDate = "February 12, 2026"; // update any time

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto max-w-4xl px-6 pt-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-300 hover:text-white">
            ← Back to Home
          </Link>
          <Link to="/store" className="text-sm text-slate-300 hover:text-white">
            Store
          </Link>
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-400">Effective: {effectiveDate}</p>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
          <p className="text-slate-200">
            This Privacy Policy explains how Atlas UX (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
            collects, uses, and protects information when you use our website, applications, and services
            (collectively, the &quot;Services&quot;).
          </p>
        </div>

        <section className="mt-10 space-y-8">
          <PolicySection title="1. Information We Collect">
            <ul className="list-disc space-y-2 pl-6 text-slate-200">
              <li>
                <span className="font-semibold">Account Information:</span> name, email address, organization,
                and basic profile details.
              </li>
              <li>
                <span className="font-semibold">Usage Data:</span> feature usage, logs, device info, and performance
                diagnostics.
              </li>
              <li>
                <span className="font-semibold">Content You Provide:</span> prompts, messages, uploaded files, and
                configuration settings you submit to the Services.
              </li>
              <li>
                <span className="font-semibold">Integration Data:</span> if you connect third-party services (email,
                calendar, storage, etc.), we may process metadata and limited content needed to provide the integration.
              </li>
              <li>
                <span className="font-semibold">Payment Data:</span> payments are processed by third-party processors.
                We typically receive only payment confirmation and limited billing metadata.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="2. How We Use Information">
            <ul className="list-disc space-y-2 pl-6 text-slate-200">
              <li>Provide, operate, and improve the Services.</li>
              <li>Authenticate users, prevent fraud, and secure accounts.</li>
              <li>Enable automations, workflows, and connected integrations you configure.</li>
              <li>Maintain audit logs and system integrity for responsible operation.</li>
              <li>Communicate product updates, security notices, and account-related messages.</li>
            </ul>
          </PolicySection>

          <PolicySection title="3. Sharing of Information">
            <p className="text-slate-200">
              We do not sell your personal information. We may share information with:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-200">
              <li>Service providers who help us run the Services (hosting, analytics, support).</li>
              <li>Payment processors to complete transactions.</li>
              <li>Third-party integrations you explicitly connect and authorize.</li>
              <li>Legal or safety obligations (to comply with law or protect rights and safety).</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. Data Retention">
            <p className="text-slate-200">
              We retain information for as long as necessary to provide the Services, comply with legal obligations,
              resolve disputes, and enforce agreements. You may request deletion where applicable.
            </p>
          </PolicySection>

          <PolicySection title="5. Security">
            <p className="text-slate-200">
              We use reasonable administrative, technical, and physical safeguards designed to protect information.
              No system is 100% secure; you are responsible for keeping credentials confidential.
            </p>
          </PolicySection>

          <PolicySection title="6. Your Choices">
            <ul className="list-disc space-y-2 pl-6 text-slate-200">
              <li>Access/update your account information in Settings.</li>
              <li>Disconnect integrations at any time.</li>
              <li>Request deletion or export of data where supported.</li>
              <li>Opt out of non-essential communications.</li>
            </ul>
          </PolicySection>

          <PolicySection title="7. Contact">
            <p className="text-slate-200">
              Questions? Contact support through the app or your account channels.
            </p>
          </PolicySection>
        </section>

        <FooterLinks />
      </main>
    </div>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
        {children}
      </div>
    </section>
  );
}

function FooterLinks() {
  return (
    <div className="mt-14 border-t border-slate-800 pt-8 text-sm text-slate-400">
      <div className="flex flex-wrap gap-4">
        <Link to="/terms" className="hover:text-white">
          Terms
        </Link>
        <Link to="/acceptable-use" className="hover:text-white">
          Acceptable Use
        </Link>
        <Link to="/payment" className="hover:text-white">
          Payment
        </Link>
        <Link to="/store" className="hover:text-white">
          Store
        </Link>
      </div>
      <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} Atlas UX</p>
    </div>
  );
}
