// src/app/page.tsx
export const dynamic = "force-static";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
            <span className="font-semibold">ATLAS UX</span>
            <span className="text-gray-500">Desktop-first • Local-first • Privacy-first</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            The local-first AI automation control center
          </h1>

          <p className="max-w-2xl text-lg text-gray-600">
            ATLAS UX is a standalone, cross-platform desktop app that connects accounts, orchestrates agents,
            and executes real workflows — not just chats.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="#waitlist"
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm"
            >
              Get updates
            </a>
            <a
              href="#builders"
              className="rounded-xl border px-5 py-3 text-sm font-semibold text-gray-900"
            >
              Build with us
            </a>
            <a
              href="/dashboard"
              className="rounded-xl border px-5 py-3 text-sm font-semibold text-gray-900"
            >
              Open the app
            </a>
          </div>

          {/* YouTube embed (responsive) */}
          <section className="mt-8">
            <div className="relative w-full overflow-hidden rounded-2xl border shadow-sm" style={{ paddingTop: "56.25%" }}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/VIDEO_ID_HERE"
                title="ATLAS UX Pitch"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="mt-3 text-sm text-gray-500">
              60-second overview + current build status.
            </p>
          </section>

          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              ["Desktop-native", "Built for real work where it happens."],
              ["Local-first", "Keep control of your data and workflows."],
              ["Modular integrations", "Connect accounts/apps as needed."],
              ["Execution-focused", "Agents that do tasks, not just talk."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border p-5 shadow-sm">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </section>

          <section className="mt-10 rounded-2xl border p-6" id="updates">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold">Dev updates</h2>
              <span className="text-sm text-gray-500">Last updated: Feb 6, 2026</span>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-700">
              <li>Published 60s pitch video + cross-platform posts.</li>
              <li>Integration UX wiring in progress (connect → verify → import).</li>
              <li>Stabilizing desktop builds and routing across pages.</li>
            </ul>
          </section>

          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-6" id="waitlist">
              <h2 className="text-xl font-semibold">Get updates</h2>
              <p className="mt-2 text-sm text-gray-600">
                Drop your email and I’ll send product updates + early access info.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  className="h-11 w-full rounded-xl border px-4 text-sm"
                  placeholder="you@domain.com"
                />
                <button className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white">
                  Join
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                (Hook this to your preferred form provider when ready.)
              </p>
            </div>

            <div className="rounded-2xl border p-6" id="builders">
              <h2 className="text-xl font-semibold">Builders / co-founders</h2>
              <p className="mt-2 text-sm text-gray-600">
                If you’re a senior builder who likes local-first systems and shipping, let’s talk.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white" href="#">
                  Contact
                </a>
                <a className="rounded-xl border px-5 py-3 text-sm font-semibold text-gray-900" href="https://github.com/">
                  GitHub
                </a>
                <a className="rounded-xl border px-5 py-3 text-sm font-semibold text-gray-900" href="https://www.linkedin.com/">
                  LinkedIn
                </a>
              </div>
            </div>
          </section>

          <footer className="mt-12 text-xs text-gray-500">
            © {new Date().getFullYear()} ATLAS UX • Local-first automation
          </footer>
        </div>
      </div>
    </main>
  );
}
