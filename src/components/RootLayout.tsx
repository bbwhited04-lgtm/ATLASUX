import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router';
import { AtlasAvatar } from './AtlasAvatar';
import { PlutoGlobe } from './PlutoGlobe';
import { NeptuneControl } from './NeptuneControl';
import { MobilePairingIndicator } from './MobilePairingIndicator';
import { MobileCompanionSetup } from './MobileCompanionSetup';
import { 
  Smartphone, 
  LayoutDashboard, 
  Cpu, 
  MessageSquare, 
  Zap, 
  Radio, 
  Users, 
  BarChart3, 
  Plug, 
  Briefcase, 
  FolderOpen, 
  Gauge,
  Crown,
  CreditCard,
  Settings as SettingsIcon,
  Bell,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileCompanion, setShowMobileCompanion] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const atlasLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z'/%3E%3C/svg%3E";
  
  const navItems = [
    { path: "/app", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/app/jobs", icon: Cpu, label: "Pluto Jobs" },
    { path: "/app/chat", icon: MessageSquare, label: "AI Chat" },
    { path: "/app/automation", icon: Zap, label: "Automation" },
    { path: "/app/monitoring", icon: Radio, label: "Monitoring" },
    { path: "/app/crm", icon: Users, label: "CRM" },
    { path: "/app/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/app/integrations", icon: Plug, label: "Integrations" },
    { path: "/app/business-assets", icon: Briefcase, label: "Business Assets" },
    { path: "/app/files", icon: FolderOpen, label: "Files" },
    { path: "/app/processing-settings", icon: Gauge, label: "Processing" },
    { path: "/app/subscription", icon: CreditCard, label: "Subscription" },
  ];
  
  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
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
            to="/app/premium"
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
              isActive("/app/premium")
                ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20"
                : "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            }`}
          >
            <Crown className="w-5 h-5" />
            {isActive("/app/premium") && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r" />
            )}
            <div className="absolute left-16 bg-slate-800 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-cyan-500/20">
              All Features
            </div>
          </Link>
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
            
            {/* Mobile Companion - Clickable */}
            <button
              onClick={() => setShowMobileCompanion(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-cyan-500/20 hover:bg-slate-800 hover:border-cyan-400/40 transition-all group"
            >
              <Smartphone className="w-3 h-3 text-blue-400 group-hover:text-cyan-400 transition-colors" />
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors">Mobile Companion</span>
            </button>
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
      
      {/* Mobile Pairing Indicator - Bottom Right */}
      <MobilePairingIndicator />
      
      {/* Mobile Companion Setup Modal */}
      <MobileCompanionSetup 
        isOpen={showMobileCompanion} 
        onClose={() => setShowMobileCompanion(false)} 
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