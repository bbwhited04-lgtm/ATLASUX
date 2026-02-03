import { Link, Outlet, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Plug, 
  FolderOpen, 
  Radio,
  Cpu,
  Bell,
  Settings as SettingsIcon,
  Zap,
  Crown,
  Briefcase,
  Gauge
} from "lucide-react";
import { AtlasAvatar } from "./AtlasAvatar";
import { PlutoGlobe } from "./PlutoGlobe";
import { NeptuneControl } from "./NeptuneControl";
import heroImage from "figma:asset/1d98c9a466c5c875d2a239310c5622d83e56444f.png";
import atlasLogo from "figma:asset/35d30f28f8b129622d68cf23f3324a107934c4ee.png";

export function RootLayout() {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/jobs", icon: Cpu, label: "Pluto Jobs" },
    { path: "/chat", icon: MessageSquare, label: "AI Chat" },
    { path: "/automation", icon: Zap, label: "Automation" },
    { path: "/monitoring", icon: Radio, label: "Monitoring" },
    { path: "/crm", icon: Users, label: "CRM" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/integrations", icon: Plug, label: "Integrations" },
    { path: "/business-assets", icon: Briefcase, label: "Business Assets" },
    { path: "/files", icon: FolderOpen, label: "Files" },
    { path: "/processing-settings", icon: Gauge, label: "Processing" },
  ];
  
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-20 bg-slate-950/50 backdrop-blur-xl border-r border-cyan-500/20 flex flex-col items-center py-6 gap-6">
        {/* Logo */}
        <div className="mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <img src={atlasLogo} alt="Atlas Logo" className="w-6 h-6" />
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
                  active 
                    ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20" 
                    : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-5 h-5" />
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
        <div className="flex flex-col gap-3">
          <Link
            to="/premium"
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
              isActive("/premium")
                ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20"
                : "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            }`}
          >
            <Crown className="w-5 h-5" />
            {isActive("/premium") && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r" />
            )}
            <div className="absolute left-16 bg-slate-800 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-cyan-500/20">
              All Features
            </div>
          </Link>
          <Link
            to="/settings"
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
              isActive("/settings")
                ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50"
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            {isActive("/settings") && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r" />
            )}
            <div className="absolute left-16 bg-slate-800 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-cyan-500/20">
              Settings
            </div>
          </Link>
          <button className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all relative group">
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
          </div>
          
          <div className="flex items-center gap-4">
            {/* System Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-cyan-500/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-300">Neptune Online</span>
            </div>
            
            {/* Mobile Sync Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-cyan-500/20">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs text-slate-300">Mobile Synced</span>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Animated Assistants */}
      <AtlasAvatar />
      <PlutoGlobe />
      <NeptuneControl />
    </div>
  );
}