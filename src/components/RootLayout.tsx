import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Plug,
  BarChart3,
  Video,
  Settings,
  Crown,
} from "lucide-react";

export default function RootLayout() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname.startsWith(path);

  const navItem = (
    to: string,
    Icon: any,
    activePath: string
  ) => (
    <Link
      to={to}
      className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
        isActive(activePath)
          ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20"
          : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50"
      )}
    >
      <Icon className="w-5 h-5" />
    </Link>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-20 border-r border-slate-800 flex flex-col items-center py-4 gap-4">
        {navItem("/app", Home, "/app")}
        {navItem("/app/integrations", Plug, "/app/integrations")}
        {navItem("/app/analytics", BarChart3, "/app/analytics")}
        {navItem("/app/video-conferencing", Video, "/app/video-conferencing")}

        <div className="flex-1" />

        {navItem("/app/premium", Crown, "/app/premium")}
        {navItem("/app/settings", Settings, "/app/settings")}

        {/* Enable later when route exists */}
        {/*
        {navItem("/app/help", HelpCircle, "/app/help")}
        */}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
