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
        <section className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
          <h2 className="text-xl font-semibold">You agree not to:</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-200">
            <li>Break laws or encourage illegal activity.</li>
            <li>Attempt to hack, disrupt, or overload systems.</li>
            <li>Phish, scam, impersonate, or misrepresent identity/authority.</li>
            <li>Upload malware or attempt unauthorized access to accounts/services.</li>
            <li>Use the Services to harass, threaten, or exploit others.</li>
            <li>Use automations without consent or against third-party terms.</li>
            <li>Bypass security, rate limits, or usage restrictions.</li>
          </ul>
        </section>

        <div className="mt-14 border-t border-slate-800 pt-8 text-sm text-slate-400">
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/payment" className="hover:text-white">Payment</Link>
            <Link to="/store" className="hover:text-white">Store</Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} Atlas UX</p>
        </div>
      </main>
    </div>
  );
}
