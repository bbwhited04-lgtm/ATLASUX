import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { HelpCircle, X } from "lucide-react";
import { useState } from 'react';
import { MobileConnectionProvider } from './mobile/MobileConnectionContext';
import { 
  LayoutDashboard, 
  Cpu, 
  MessageSquare, 
  Zap, 
  Radio, 
  Users, 
  BarChart3, 
  Briefcase, 
  Settings as SettingsIcon,
  Bell,
  ChevronRight,
  ChevronLeft,
  Shield,
  Smartphone,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';

// Neptune Control Panel Component
function NeptuneControlPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Control Panel */}
      <div className="fixed top-20 right-6 w-96 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Neptune Control</h3>
              <p className="text-xs text-slate-400">System Status & Operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* Pending Approvals */}
          <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-500/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">Pending Approvals</span>
              </div>
              <span className="text-xs px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded-full border border-yellow-400/30">
                2 Items
              </span>
            </div>
            <p className="text-xs text-slate-400">Review and approve pending actions</p>
          </div>
          
          {/* Companion Status */}
          <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-500/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Mobile Companion</span>
              </div>
              <span className="text-xs px-2 py-1 bg-green-400/20 text-green-400 rounded-full border border-green-400/30">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400">iPhone 15 Pro - Last sync 2m ago</p>
          </div>
          
          {/* Security Status */}
          <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-500/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">Security Status</span>
              </div>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-xs text-slate-400">All security checks passed</p>
          </div>
          
          {/* Device Status */}
          <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-500/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">Device Status</span>
              </div>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-xs text-slate-400">CPU: 23% • RAM: 4.2GB • Disk: 340GB free</p>
          </div>
          
          {/* Escalations */}
          <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-500/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-white">Escalations</span>
              </div>
              <span className="text-xs px-2 py-1 bg-red-400/20 text-red-400 rounded-full border border-red-400/30">
                1 Active
              </span>
            </div>
            <p className="text-xs text-slate-400">API rate limit exceeded - requires attention</p>
          </div>
          
          {/* Logs Shortcut */}
          <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-500/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-white">Activity Logs</span>
              </div>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-400">View recent system activity and logs</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-cyan-500/20 p-3 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Last updated: Just now</span>
            <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Refresh
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Neptune Status Button Component
function NeptuneStatusButton({ onClick }: { onClick: () => void }) {
  const [status, setStatus] = useState<'idle' | 'online' | 'busy' | 'error'>('online');
  
  const statusConfig = {
    idle: {
      color: 'bg-blue-400',
      borderColor: 'border-blue-400/50',
      ringColor: 'ring-blue-400/30',
      label: 'Neptune',
      emoji: '🔵'
    },
    online: {
      color: 'bg-green-400',
      borderColor: 'border-green-400/50',
      ringColor: 'ring-green-400/30',
      label: 'Neptune',
      emoji: '🟢'
    },
    busy: {
      color: 'bg-yellow-400',
      borderColor: 'border-yellow-400/50',
      ringColor: 'ring-yellow-400/30',
      label: 'Neptune',
      emoji: '🟡'
    },
    error: {
      color: 'bg-red-400',
      borderColor: 'border-red-400/50',
      ringColor: 'ring-red-400/30',
      label: 'Neptune',
      emoji: '🔴'
    }
  };
  
  const current = statusConfig[status];
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border ${current.borderColor} hover:bg-slate-800 hover:border-cyan-400/50 transition-all group`}
    >
      <div className={`relative w-2.5 h-2.5 rounded-full ${current.color} ${status === 'busy' || status === 'error' ? 'animate-pulse' : ''}`}>
        <div className={`absolute inset-0 rounded-full ${current.color} ring-4 ${current.ringColor}`} />
      </div>
      <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{current.label}</span>
    </button>
  );
}

function RootLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [neptuneControlOpen, setNeptuneControlOpen] = useState(false);
  
  const atlasLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z'/%3E%3C/svg%3E";
  
  // Lean navigation - only essentials
  const navItems = [
    { path: "/app", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/app/jobs", icon: Cpu, label: "Pluto Jobs" },
    { path: "/app/chat", icon: MessageSquare, label: "AI Chat" },
    { path: "/app/automation", icon: Zap, label: "Automation" },
    { path: "/app/monitoring", icon: Radio, label: "Monitoring" },
    { path: "/app/crm", icon: Users, label: "CRM" },
    { path: "/app/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/app/business-manager", icon: Briefcase, label: "Business Manager" },
  ];
  
  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
      {/* Lean Sidebar */}
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
            {/* Neptune Status Button - Fixed Top Right - Opens Control Panel */}
            <NeptuneStatusButton onClick={() => setNeptuneControlOpen(true)} />
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Neptune Control Panel */}
      <NeptuneControlPanel 
        isOpen={neptuneControlOpen} 
        onClose={() => setNeptuneControlOpen(false)} 
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
