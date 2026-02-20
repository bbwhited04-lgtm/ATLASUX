import PublicHeader from "../components/public/PublicHeader";

export default function Product() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              Atlas UX
            </h1>
            <p className="text-base text-slate-700">
              A governed AI coworker system built for real workflows: auditability, cost control,
              and repeatable execution. Designed to be simple, safe, and business-friendly.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="rounded-xl border border-slate-300 px-4 py-2 text-base font-bold text-slate-800 hover:bg-slate-50"
                href="#/blog"
              >
                Read the Blog
              </a>
              <a
                className="rounded-xl border border-slate-300 px-4 py-2 text-base font-bold text-slate-800 hover:bg-slate-50"
                href="#/store"
              >
                Store
              </a>
              <a
                className="rounded-xl bg-slate-800 px-4 py-2 text-base font-bold text-white hover:bg-slate-700"
                href="#/app"
              >
                Open App
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="space-y-3">
              <div className="text-base font-bold text-slate-800">What makes it different</div>
              <ul className="list-disc pl-5 text-base text-slate-700 space-y-2">
                <li>Decision memos + approvals for any risky or paid action.</li>
                <li>Daily growth loop with one action per day.</li>
                <li>Abuse guardrails: spend caps, post caps, recurring purchase blocks.</li>
                <li>Metrics snapshots so every agent shares the same truth.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
