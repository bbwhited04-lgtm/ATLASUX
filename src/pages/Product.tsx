import PublicHeader from "../components/public/PublicHeader";

export default function Product() {
  return (
    <div className="min-h-screen text-white relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a3a] via-[#041127] to-black" />
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="absolute top-40 right-[-140px] h-[440px] w-[440px] rounded-full bg-cyan-400/12 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[-140px] h-[440px] w-[440px] rounded-full bg-indigo-500/12 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>

      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 relative z-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Atlas UX
            </h1>
            <p className="text-base text-slate-400">
              A governed AI coworker system built for real workflows: auditability, cost control,
              and repeatable execution. Designed to be simple, safe, and business-friendly.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="rounded-xl border border-cyan-500/20 px-4 py-2 text-base font-bold text-white hover:bg-slate-900/50"
                href="#/blog"
              >
                Read the Blog
              </a>
              <a
                className="rounded-xl border border-cyan-500/20 px-4 py-2 text-base font-bold text-white hover:bg-slate-900/50"
                href="#/store"
              >
                Store
              </a>
              <a
                className="rounded-xl bg-cyan-500 px-4 py-2 text-base font-bold text-slate-950 hover:bg-cyan-400"
                href="#/app"
              >
                Open App
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 p-6">
            <div className="space-y-3">
              <div className="text-base font-bold text-white">What makes it different</div>
              <ul className="list-disc pl-5 text-base text-slate-400 space-y-2">
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
