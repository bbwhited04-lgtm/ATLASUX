import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import {
  Settings as SettingsIcon,
  Shield,
  HardDrive,
  Bell,
  Palette,
  Globe,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Info,
  FolderOpen,
  Mic,
  Camera,
  MapPin,
  Clipboard,
  MessageSquare,
  Crown,
  Mail,
  Loader2,
  Plug,
  Gauge,
  Smartphone
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import * as adminAuth from "../utils/admin-auth";

// Import existing feature components
import Integrations from './Integrations';
import { FileManagement } from './FileManagement';
import { ProcessingSettings } from './ProcessingSettings';
import { EmailClient } from './premium/EmailClient';
import { MobileIntegration } from './premium/MobileIntegration';

// Icon mapping for permissions
const iconMap: Record<string, any> = {
  filesystem: FolderOpen,
  network: Globe,
  microphone: Mic,
  camera: Camera,
  location: MapPin,
  clipboard: Clipboard,
  notifications: Bell
};

const defaultPermissions = [
  {
    id: "filesystem",
    name: "File System Access",
    description: "Access to read and write files on selected drives",
    enabled: true,
    required: true
  },
  {
    id: "network",
    name: "Network Access",
    description: "Required for API calls, integrations, and cloud sync",
    enabled: true,
    required: true
  },
  {
    id: "microphone",
    name: "Microphone Access",
    description: "Voice recording for AI chat interface",
    enabled: true,
    required: false
  },
  {
    id: "camera",
    name: "Camera Access",
    description: "Video recording and image capture for content creation",
    enabled: false,
    required: false
  },
  {
    id: "location",
    name: "Location Services",
    description: "Location-based features and analytics",
    enabled: false,
    required: false
  },
  {
    id: "clipboard",
    name: "Clipboard Access",
    description: "Read and write clipboard for copy/paste operations",
    enabled: true,
    required: false
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Display system notifications for events and updates",
    enabled: true,
    required: false
  }
];

const defaultDriveAccess = [
  {
    drive: "C:",
    label: "System Drive",
    type: "system",
    size: "476 GB",
    enabled: true,
    restricted: true,
    excludedFolders: ["Windows", "Program Files", "Program Files (x86)", "ProgramData"]
  },
  {
    drive: "D:",
    label: "Data Drive",
    type: "data",
    size: "931 GB",
    enabled: true,
    restricted: false,
    excludedFolders: []
  },
  {
    drive: "E:",
    label: "External Drive",
    type: "removable",
    size: "2 TB",
    enabled: false,
    restricted: false,
    excludedFolders: []
  }
];

export function Settings() {
  const [permissions, setPermissions] = useState<any[]>(defaultPermissions);
  const [driveAccess, setDriveAccess] = useState<any[]>(defaultDriveAccess);
  
  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [adminStep, setAdminStep] = useState<'email' | 'code'>('email');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminSession, setAdminSession] = useState<any>(null);
  
  useEffect(() => {
    // Load saved settings
    const savedPermissions = localStorage.getItem('atlas-permissions');
    const savedDriveAccess = localStorage.getItem('atlas-drive-access');
    
    if (savedPermissions) {
      setPermissions(JSON.parse(savedPermissions));
    } else {
      localStorage.setItem('atlas-permissions', JSON.stringify(defaultPermissions));
    }
    
    if (savedDriveAccess) {
      setDriveAccess(JSON.parse(savedDriveAccess));
    } else {
      localStorage.setItem('atlas-drive-access', JSON.stringify(defaultDriveAccess));
    }
    
    // Check admin authentication status
    const authStatus = adminAuth.isAdminAuthenticated();
    setIsAdminAuthenticated(authStatus);
    if (authStatus) {
      setAdminSession(adminAuth.getAdminSession());
    }
  }, []);
  
  const togglePermission = (id: string) => {
    const updated = permissions.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    setPermissions(updated);
    localStorage.setItem('atlas-permissions', JSON.stringify(updated));
  };
  
  const toggleDrive = (drive: string) => {
    const updated = driveAccess.map(d =>
      d.drive === drive ? { ...d, enabled: !d.enabled } : d
    );
    setDriveAccess(updated);
    localStorage.setItem('atlas-drive-access', JSON.stringify(updated));
  };
  
  const resetToDefaults = () => {
    if (confirm('Reset all settings to default values? This cannot be undone.')) {
      localStorage.removeItem('atlas-first-run-complete');
      localStorage.removeItem('atlas-onboarding-complete');
      localStorage.removeItem('atlas-onboarding-skipped');
      localStorage.removeItem('atlas-permissions');
      localStorage.removeItem('atlas-drive-access');
      window.location.reload();
    }
  };
  
  const restartOnboarding = () => {
    if (confirm('This will restart the setup wizard. Continue?')) {
      localStorage.removeItem('atlas-onboarding-complete');
      localStorage.removeItem('atlas-onboarding-skipped');
      window.location.reload();
    }
  };
  
  // Admin login handlers
  const handleRequestAdminCode = async () => {
    if (!adminEmail || !adminEmail.includes('@')) {
      setAdminError('Please enter a valid email address');
      return;
    }
    
    setAdminLoading(true);
    setAdminError('');
    setAdminSuccess('');
    
    const result = await adminAuth.requestAdminCode(adminEmail);
    
    setAdminLoading(false);
    
    if (result.success) {
      setAdminStep('code');
      setAdminSuccess(result.message + ' Check the server console for the code in development mode.');
    } else {
      setAdminError(result.message);
    }
  };
  
  const handleVerifyAdminCode = async () => {
    if (!adminCode || adminCode.length !== 6) {
      setAdminError('Please enter a valid 6-digit code');
      return;
    }
    
    setAdminLoading(true);
    setAdminError('');
    setAdminSuccess('');
    
    const result = await adminAuth.verifyAdminCode(adminEmail, adminCode);
    
    setAdminLoading(false);
    
    if (result.success) {
      setIsAdminAuthenticated(true);
      setAdminSession(adminAuth.getAdminSession());
      setAdminSuccess(result.message);
      setAdminStep('email');
      setAdminEmail('');
      setAdminCode('');
    } else {
      setAdminError(result.message);
    }
  };
  
  const handleAdminLogout = () => {
    adminAuth.logoutAdmin();
    setIsAdminAuthenticated(false);
    setAdminSession(null);
    setAdminStep('email');
    setAdminEmail('');
    setAdminCode('');
    setAdminError('');
    setAdminSuccess('Logged out successfully');
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
          Settings & Configuration
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Manage system settings, integrations, and preferences
        </p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-cyan-500/20 flex-wrap h-auto">
          <TabsTrigger value="general" className="text-slate-300 data-[state=active]:text-cyan-400">
            <SettingsIcon className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="permissions" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Shield className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="drives" className="text-slate-300 data-[state=active]:text-cyan-400">
            <HardDrive className="w-4 h-4 mr-2" />
            Drive Access
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Plug className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Gauge className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="files" className="text-slate-300 data-[state=active]:text-cyan-400">
            <FolderOpen className="w-4 h-4 mr-2" />
            Files
          </TabsTrigger>
          <TabsTrigger value="email" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="mobile" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Smartphone className="w-4 h-4 mr-2" />
            Mobile
          </TabsTrigger>
          <TabsTrigger value="security" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>
        
        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-cyan-400" />
              General Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-cyan-500/10">
                <div>
                  <p className="text-white font-medium">Dark Mode</p>
                  <p className="text-sm text-slate-400">Atlas UX dark theme</p>
                </div>
                <Switch defaultChecked disabled />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-cyan-500/10">
                <div>
                  <p className="text-white font-medium">Auto-Start</p>
                  <p className="text-sm text-slate-400">Launch Atlas on system startup</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-cyan-500/10">
                <div>
                  <p className="text-white font-medium">Minimize to Tray</p>
                  <p className="text-sm text-slate-400">Keep Atlas running in background</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="pt-4 border-t border-cyan-500/10 space-y-3">
                <Button 
                  onClick={restartOnboarding}
                  variant="outline" 
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart Setup Wizard
                </Button>
                
                <Button 
                  onClick={resetToDefaults}
                  variant="destructive" 
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              System Permissions
            </h3>
            
            <div className="space-y-3">
              {permissions.map((permission) => {
                const Icon = iconMap[permission.id] || Shield;
                return (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-cyan-500/10"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{permission.name}</p>
                          {permission.required && (
                            <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{permission.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={permission.enabled}
                      onCheckedChange={() => togglePermission(permission.id)}
                      disabled={permission.required}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
        
        {/* Drive Access Tab */}
        <TabsContent value="drives" className="space-y-4">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-cyan-400" />
              Drive Access
            </h3>
            
            <div className="space-y-3">
              {driveAccess.map((drive) => (
                <div
                  key={drive.drive}
                  className="p-4 bg-slate-800/30 rounded-lg border border-cyan-500/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <HardDrive className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{drive.drive} {drive.label}</p>
                        <p className="text-sm text-slate-400">{drive.size} • {drive.type}</p>
                      </div>
                    </div>
                    <Switch
                      checked={drive.enabled}
                      onCheckedChange={() => toggleDrive(drive.drive)}
                    />
                  </div>
                  
                  {drive.restricted && drive.excludedFolders.length > 0 && (
                    <div className="ml-13 pt-3 border-t border-cyan-500/10">
                      <p className="text-xs text-slate-500 mb-2">Excluded Folders:</p>
                      <div className="flex flex-wrap gap-2">
                        {drive.excludedFolders.map((folder: string) => (
                          <Badge key={folder} variant="secondary" className="text-xs">
                            {folder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Integrations />
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance">
          <ProcessingSettings />
        </TabsContent>
        
        {/* Files Tab */}
        <TabsContent value="files">
          <FileManagement />
        </TabsContent>
        
        {/* Email Tab */}
        <TabsContent value="email">
          <EmailClient />
        </TabsContent>
        
        {/* Mobile Tab */}
        <TabsContent value="mobile">
          <MobileIntegration />
        </TabsContent>
        
        {/* Security Tab - Admin Authentication */}
        <TabsContent value="security" className="space-y-4">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              Admin Authentication
            </h3>
            
            {!isAdminAuthenticated ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-medium mb-1">Admin Access Required</p>
                      <p className="text-sm text-yellow-400/80">
                        Advanced settings require admin authentication for security.
                      </p>
                    </div>
                  </div>
                </div>
                
                {adminStep === 'email' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@company.com"
                        className="bg-slate-800/50 border-cyan-500/20"
                      />
                    </div>
                    
                    <Button
                      onClick={handleRequestAdminCode}
                      disabled={adminLoading}
                      className="w-full"
                    >
                      {adminLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Request Admin Code
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Verification Code
                      </label>
                      <Input
                        type="text"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="bg-slate-800/50 border-cyan-500/20 text-center text-2xl tracking-widest"
                      />
                    </div>
                    
                    <Button
                      onClick={handleVerifyAdminCode}
                      disabled={adminLoading}
                      className="w-full"
                    >
                      {adminLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4 mr-2" />
                          Verify Code
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => setAdminStep('email')}
                      variant="outline"
                      className="w-full"
                    >
                      Back
                    </Button>
                  </div>
                )}
                
                {adminError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {adminError}
                  </div>
                )}
                
                {adminSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                    {adminSuccess}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-400 font-medium mb-1">Admin Authenticated</p>
                      <p className="text-sm text-green-400/80">
                        Logged in as: {adminSession?.email}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleAdminLogout}
                  variant="outline"
                  className="w-full"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
