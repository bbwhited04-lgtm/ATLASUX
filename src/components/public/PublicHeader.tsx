import React from "react";
import { Link, useLocation } from "react-router-dom";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-cyan-500/20 text-cyan-400" : "text-slate-300 hover:bg-slate-800"
      }`}
    >
      {children}
    </Link>
  );
}

export default function PublicHeader({
  rightSlot,
}: {
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-cyan-500/20 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/icon.svg"
              alt="Atlas UX"
              className="h-8 w-8"
            />
            <span className="text-base font-bold text-white">Atlas UX</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/store">Pricing</NavLink>
            <NavLink to="/blog">Blog</NavLink>
            <a
              href="#/app"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              App
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rightSlot}
          {/* Desktop: phone number + icon */}
          <a
            href="tel:+15737422028"
            className="hidden items-center gap-1.5 rounded-xl border border-[#3d5474]/40 px-3 py-2 text-sm font-semibold text-cyan-400 transition hover:border-cyan-500/40 hover:text-cyan-300 md:inline-flex"
            aria-label="Call Lucy"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                clipRule="evenodd"
              />
            </svg>
            (573) 742-2028
          </a>
          {/* Mobile: icon only */}
          <a
            href="tel:+15737422028"
            className="inline-flex items-center justify-center rounded-xl border border-[#3d5474]/40 p-2 text-cyan-400 transition hover:border-cyan-500/40 hover:text-cyan-300 md:hidden"
            aria-label="Call Lucy at (573) 742-2028"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <a
            href="#/app"
            className="hidden rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600 md:inline-flex"
          >
            Open App
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-3 md:hidden">
        <div className="flex flex-wrap gap-2">
          <NavLink to="/store">Pricing</NavLink>
          <NavLink to="/blog">Blog</NavLink>
          <a
            href="#/app"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            App
          </a>
        </div>
      </div>
    </header>
  );
}
