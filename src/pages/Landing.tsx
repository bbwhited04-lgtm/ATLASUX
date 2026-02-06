import React from "react";

export default function Landing() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold">ATLAS UX</h1>
        <p className="text-lg opacity-80">
          The AI Worker who works where you work.
        </p>

        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {/* Replace VIDEO_ID */}
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/VIDEO_ID"
            title="ATLAS UX"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="#/app"
            className="px-5 py-3 rounded-xl bg-white text-black font-semibold"
          >
            Open the app
          </a>

          <a
            href="mailto:you@domain.com"
            className="px-5 py-3 rounded-xl border border-white/20 font-semibold"
          >
            Build with us
          </a>
        </div>

        <p className="text-xs opacity-50">
          © Atlas UX, a DEAD APP CORP company
        </p>
      </div>
    </main>
  );
}
