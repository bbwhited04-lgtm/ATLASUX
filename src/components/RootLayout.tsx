import { Outlet, useLocation, Link } from "react-router-dom";
import { CreditCard, HelpCircle } from "lucide-react";
import { useState } from 'react';
import * as React from 'react';
import { MobileConnectionModal } from './MobileConnectionModal';
import { MobileInstallModal } from './MobileInstallModal';
import { MobileCompanionSetup } from "./MobileCompanionSetup";
import { MobileConnectionProvider, useMobileConnection } from './mobile/MobileConnectionContext';
import {
  LayoutDashboard,
  Bell,
  Cpu,
  MessageSquare,
  Radio,
  Users,
  UserCog,
  BarChart3,
  Briefcase,
  Settings as SettingsIcon,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  ClipboardCheck,
  Newspaper,
  Power,
  Activity,
  Send,
} from 'lucide-react';

import { API_BASE } from "../lib/api";
import { useActiveTenant } from "../lib/activeTenant";

function RootLayoutInner() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNeptunePanelOpen, setIsNeptunePanelOpen] = useState(false);
  const [showMobileInstall, setShowMobileInstall] = useState(false);
  const { openModal } = useMobileConnection();
  const { tenantId } = useActiveTenant();

  // Global Atlas online/offline state (visible everywhere in the header)
  const [atlasOnline, setAtlasOnline] = React.useState<boolean | null>(null);
  const [atlasStateLoading, setAtlasStateLoading] = React.useState(false);
  const [atlasStateErr, setAtlasStateErr] = React.useState<string | null>(null);

  const atlasStyles = {
    online: "bg-emerald-600 text-white",
    offline: "bg-slate-700 text-white",
    unknown: "bg-slate-900/40 text-slate-200",
    error: "bg-red-600 text-white animate-pulse",
  } as const;

  async function fetchAtlasState() {
    setAtlasStateLoading(true);
    setAtlasStateErr(null);
    try {
      const res = await fetch(`${API_BASE}/v1/api/system/state/atlas_online`);
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Failed to read atlas state");
      // Backend has evolved across revisions. Accept multiple shapes:
      //   { state: { online: boolean } }
      //   { state: { value: boolean } }
      //   { state: { value: { online: boolean } } }
      const s = data?.state ?? null;
      const direct = typeof s?.online === "boolean" ? s.online : null;
      const v1 = typeof s?.value === "boolean" ? s.value : null;
      const v2 = typeof s?.value === "object" && s?.value && typeof s.value.online === "boolean" ? s.value.online : null;
      const parsed = direct ?? v2 ?? v1;
      setAtlasOnline(typeof parsed === "boolean" ? parsed : null);
    } catch (e: any) {
      setAtlasStateErr(e?.message ?? String(e));
      setAtlasOnline(null);
    } finally {
      setAtlasStateLoading(false);
    }
  }

  async function setAtlasOnlineState(next: boolean) {
    setAtlasStateLoading(true);
    setAtlasStateErr(null);
    try {
      const url = next ? `${API_BASE}/v1/api/system/atlas/online` : `${API_BASE}/v1/api/system/atlas/offline`;
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Failed to set atlas state");
      const s = data?.state ?? null;
      const direct = typeof s?.online === "boolean" ? s.online : null;
      const v1 = typeof s?.value === "boolean" ? s.value : null;
      const v2 = typeof s?.value === "object" && s?.value && typeof s.value.online === "boolean" ? s.value.online : null;
      const parsed = direct ?? v2 ?? v1;
      // If backend didn't return a parseable state, fall back to optimistic UI.
      setAtlasOnline(typeof parsed === "boolean" ? parsed : next);
    } catch (e: any) {
      setAtlasStateErr(e?.message ?? String(e));
    } finally {
      setAtlasStateLoading(false);
    }
  }

  React.useEffect(() => {
    fetchAtlasState();
    // 60 s is frequent enough for a status badge and avoids hammering the DB.
    const t = window.setInterval(fetchAtlasState, 60000);
    // Re-fetch immediately when the tab becomes visible again.
    const onVis = () => { if (document.visibilityState === "visible") void fetchAtlasState(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pendingDecisionsCount, setPendingDecisionsCount] = React.useState<number>(0);
  React.useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      if (!tenantId) {
        if (!cancelled) setPendingDecisionsCount(0);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/v1/decisions?tenantId=${encodeURIComponent(tenantId)}&status=AWAITING_HUMAN&take=200`);
        const json = await res.json();
        const count = Array.isArray(json?.memos) ? json.memos.length : 0;
        if (!cancelled) setPendingDecisionsCount(count);
      } catch {
        if (!cancelled) setPendingDecisionsCount(0);
      }
    };

    fetchCount();
    // 60 s polling — decisions don't need sub-minute freshness.
    const t = window.setInterval(fetchCount, 60000);
    // Refresh badge as soon as the user returns to the tab.
    const onVis = () => { if (document.visibilityState === "visible") void fetchCount(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [tenantId]);
  
  const atlasLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z'/%3E%3C/svg%3E";
  
  const navItems: Array<{ path: string; icon: any; label: string; badge?: number }> = [
    { path: "/app", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/app/jobs", icon: Cpu, label: "Pluto Jobs" },
    { path: "/app/chat", icon: MessageSquare, label: "AI Chat" },
    { path: "/app/agents", icon: UserCog, label: "Agents" },
    { path: "/app/monitoring", icon: Radio, label: "Monitoring" },
    { path: "/app/crm", icon: Users, label: "CRM" },
    { path: "/app/analytics", icon: BarChart3, label: "Analytics" },
    // Consolidated business tooling lives under Business Manager now.
    { path: "/app/business-manager", icon: Briefcase, label: "Business Manager" },
    { path: "/app/kb", icon: BookOpen, label: "Knowledge Base" },
    { path: "/app/blog", icon: Newspaper, label: "Blog" },
    { path: "/app/decisions", icon: ClipboardCheck, label: "Decisions", badge: pendingDecisionsCount },
    { path: "/app/messaging", icon: Send, label: "Messaging" },
    ];

  // (Kept for future “setup wizard” flows; currently the modal is opened via context.)
  const [currentStatus, setCurrentStatus] = useState<"online" | "pairing" | "busy" | "error" | "offline">("online");
  const statusStyles = {
    online: "bg-emerald-600 text-white",
    pairing: "bg-amber-500 text-black",
    busy: "bg-yellow-400 text-black",
    error: "bg-red-600 text-white animate-pulse",
    offline: "bg-slate-700 text-white",
  };
  const [isMobileCompanionOpen, setIsMobileCompanionOpen] = useState(false);
  const hideMobileCompanion = () => setIsMobileCompanionOpen(false);
  const isActive = (path: string) => {
    const base = path.split("?")[0];
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(base);
  };
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`relative bg-slate-950/50 backdrop-blur-xl border-r border-cyan-500/20 flex flex-col items-center py-6 gap-6 transition-all duration-300 ease-in-out overflow-hidden ${
        sidebarCollapsed ? '-ml-20 w-20' : 'ml-0 w-20'
      }`}>
        {/* Logo */}
        <div className="mb-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <img src={atlasLogo} alt="Atlas Logo" className="w-6 h-6" />
          </div>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 flex flex-col gap-3 overflow-y-auto overflow-x-visible scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent hover:scrollbar-thumb-cyan-500/40 pr-2">
          {navItems.map((item) => {
  const Icon = item.icon;
  const active = isActive(item.path);

  return (
    <Link
      key={item.path}
      to={item.path}
      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group flex-shrink-0 ${
        active
          ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20"
          : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50"
      }`}
    >
      <Icon className="w-5 h-5" />
      {!!item.badge && item.badge > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border border-slate-900">
          {item.badge > 99 ? "99+" : item.badge}
        </div>
      )}
      {active && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r" />
      )}
      {/* Tooltip */}
      <div className="absolute left-16 bg-slate-800 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-cyan-500/20">
        {item.label}
      </div>
    </Link>
  );
})}

        </nav>
        
        {/* Bottom Actions */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          <Link
            to="/app/settings"
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
              isActive("/app/settings")
                ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50"
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            {isActive("/app/settings") && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r" />
            )}
            <div className="absolute left-16 bg-slate-800 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-cyan-500/20">
              Settings
            </div>
          </Link>
          <Link
  to="/app/help"
  className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50 transition-all relative group"
>
  <HelpCircle className="w-5 h-5" />
  <div className="absolute left-16 bg-slate-800 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-cyan-500/20">
    Help
  </div>
</Link>

          <button onClick={() => window.location.hash = "#/app/decisions"} className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all relative group">
            <Bell className="w-5 h-5" />
            <div className="absolute left-16 bg-slate-800 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-cyan-500/20">
              Notifications
            </div>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900/30 backdrop-blur-xl border-b border-cyan-500/20 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              ATLAS UX
            </h1>
            <p className="text-xs text-slate-400">The AI Worker who works Where You Work</p>
          </div>          <div className="flex items-center gap-4">
            {/* Atlas State Pill */}
            <button
              onClick={() => {
                if (atlasStateLoading) return;
                // null = never initialised — bring online on first click
                if (atlasOnline === null) setAtlasOnlineState(true);
                else setAtlasOnlineState(!atlasOnline);
              }}
              className={`px-5 py-2 rounded-lg font-bold tracking-wide uppercase shadow-lg transition-all duration-200 ${atlasStateErr ? atlasStyles.error : atlasOnline === true ? atlasStyles.online : atlasOnline === false ? atlasStyles.offline : atlasStyles.unknown}`}
              title={atlasStateErr ? `Atlas state error: ${atlasStateErr}` : "Toggle Atlas online/offline (or click when unknown to refresh)"}
            >
              <span className="inline-flex items-center gap-2">
                <Power className="w-4 h-4" />
                ATLAS · {atlasOnline === null ? "unknown" : atlasOnline ? "online" : "offline"}
              </span>
            </button>

            {/* Neptune Status Pill */}
            <button
              onClick={() => setIsNeptunePanelOpen(true)}
              className={`px-5 py-2 rounded-lg font-bold tracking-wide uppercase shadow-lg transition-all duration-200 ${statusStyles[currentStatus]}`}
              >
              NEPTUNE · {currentStatus}
            </button>

          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      {/* Mobile Connection Modal (shared) */}
      <MobileConnectionModal />
      
      {/* Mobile Companion Setup Modal */}
      <MobileCompanionSetup 
        isOpen={isMobileCompanionOpen} 
        onClose={hideMobileCompanion}
      />
      
      
      {/* Neptune Status Panel */}
      {isNeptunePanelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950/90 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/10">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <div>
                  <div className="text-sm font-semibold text-white">Neptune Status</div>
                  <div className="text-xs text-slate-400">System + Companion connectivity</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNeptunePanelOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs border border-cyan-500/10"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* System status */}
              <div className="rounded-xl bg-slate-900/40 border border-cyan-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Neptune</div>
                    <div className="text-sm text-white">Online</div>
                  </div>
                  <div className="text-xs text-slate-400">Mode: <span className="text-slate-200">Operational</span></div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-950/40 border border-cyan-500/10 px-3 py-2">
                    <div className="text-slate-400">Agent</div>
                    <div className="text-slate-200">Atlas UX</div>
                  </div>
                  <div className="rounded-lg bg-slate-950/40 border border-cyan-500/10 px-3 py-2">
                    <div className="text-slate-400">Audit</div>
                    <div className="text-slate-200">Enabled</div>
                  </div>
                </div>
              </div>

              {/* Mobile companion actions */}
              <div className="rounded-xl bg-slate-900/40 border border-cyan-500/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-400">Mobile Companion</div>
                    <div className="text-sm text-white">Pairing & Access</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNeptunePanelOpen(false);
                        openModal();
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs border border-cyan-500/10"
                    >
                      Pair / Status
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNeptunePanelOpen(false);
                        setShowMobileInstall(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs border border-cyan-500/10"
                    >
                      Install
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Tip: keep companion access behind approvals + audit for every action.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Install Modal (centralized) */}
      <MobileInstallModal
        isOpen={showMobileInstall}
        onClose={() => setShowMobileInstall(false)}
      />

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 w-8 h-16 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400/50 rounded-r-lg flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 ${
          sidebarCollapsed ? 'left-0' : 'left-20'
        }`}
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function RootLayout() {
  return (
    <MobileConnectionProvider>
      <RootLayoutInner />
    </MobileConnectionProvider>
  );
}