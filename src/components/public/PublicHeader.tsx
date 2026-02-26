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
              alt="ATLAS UX"
              className="h-8 w-8"
            />
            <span className="text-base font-bold text-white">ATLAS UX</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/store">Store</NavLink>
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
          <NavLink to="/store">Store</NavLink>
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
