import React from "react";
import { Link, useLocation } from "react-router-dom";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
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
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/icon.svg"
              alt="ATLAS UX"
              className="h-8 w-8"
            />
            <span className="text-base font-bold text-slate-800">ATLAS UX</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/store">Store</NavLink>
            <NavLink to="/blog">Blog</NavLink>
            <a
              href="#/app"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              App
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rightSlot}
          <a
            href="#/app"
            className="hidden rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 md:inline-flex"
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
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            App
          </a>
        </div>
      </div>
    </header>
  );
}
