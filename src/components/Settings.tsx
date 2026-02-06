import { useState, useEffect } from "react";
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
  Loader2
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import * as adminAuth from "../utils/admin-auth";

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
      // Save defaults on first load
      localStorage.setItem('atlas-permissions', JSON.stringify(defaultPermissions));
    }
    
    if (savedDriveAccess) {
      setDriveAccess(JSON.parse(savedDriveAccess));
    } else {
      // Save defaults on first load
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
          Settings & Permissions
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Manage system permissions, drive access, and security settings
        </p>
      </div>
      
      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-cyan-500/20">
          <TabsTrigger value="permissions" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Shield className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="drives" className="text-slate-300 data-[state=active]:text-cyan-400">
            <HardDrive className="w-4 h-4 mr-2" />
            Drive Access
          </TabsTrigger>
          <TabsTrigger value="security" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="general" className="text-slate-300 data-[state=active]:text-cyan-400">
            <SettingsIcon className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="admin" className="text-slate-300 data-[state=active]:text-cyan-400">
            <Crown className="w-4 h-4 mr-2" />
            Admin Login
          </TabsTrigger>
        </TabsList>
        
        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Modifying Permissions</h4>
                <p className="text-xs text-slate-300">
                  Disabling required permissions may cause Atlas UX to malfunction. Neptune will validate all changes before applying them.
                </p>
              </div>
            </div>
          </Card>
          
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-4">
              {permissions.map((permission) => {
                const Icon = iconMap[permission.id] || Shield; // Fallback to Shield icon
                return (
                  <Card
                    key={permission.id}
                    className={`p-4 ${
                      permission.enabled
                        ? "bg-cyan-500/10 border-cyan-500/30"
                        : "bg-slate-800/50 border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${
                        permission.enabled ? "bg-cyan-500/20" : "bg-slate-700"
                      } flex items-center justify-center flex-shrink-0`}>
                        {Icon && (
                          <Icon className={`w-6 h-6 ${
                            permission.enabled ? "text-cyan-400" : "text-slate-400"
                          }`} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              {permission.name}
                              {permission.required && (
                                <Badge variant="outline" className="text-xs border-red-500/40 text-red-400">
                                  Required
                                </Badge>
                              )}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {permission.description}
                            </p>
                          </div>
                          
                          <Switch
                            checked={permission.enabled}
                            onCheckedChange={() => togglePermission(permission.id)}
                            disabled={permission.required && permission.enabled}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Drive Access Tab */}
        <TabsContent value="drives" className="space-y-4">
          <Card className="bg-cyan-500/10 border-cyan-500/30 p-4">
            <div className="flex items-start gap-3">
              <HardDrive className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Drive Access Control</h4>
                <p className="text-xs text-slate-300">
                  Control which drives Atlas UX can access. System folders are automatically protected to prevent accidental damage.
                </p>
              </div>
            </div>
          </Card>
          
          <div className="space-y-3">
            {driveAccess.map((drive) => (
              <Card
                key={drive.drive}
                className={`p-4 ${
                  drive.enabled
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-slate-800/50 border-slate-700"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${
                    drive.enabled ? "bg-green-500/20" : "bg-slate-700"
                  } flex items-center justify-center flex-shrink-0`}>
                    <HardDrive className={`w-6 h-6 ${
                      drive.enabled ? "text-green-400" : "text-slate-400"
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          {drive.drive} - {drive.label}
                          {drive.type === "system" && (
                            <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-400">
                              System
                            </Badge>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {drive.size} • {drive.type === "system" ? "OS & Programs" : drive.type === "data" ? "User Data" : "Removable Storage"}
                        </p>
                      </div>
                      
                      <Switch
                        checked={drive.enabled}
                        onCheckedChange={() => toggleDrive(drive.drive)}
                      />
                    </div>
                    
                    {drive.enabled && drive.restricted && drive.excludedFolders.length > 0 && (
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="text-xs font-medium mb-2 text-slate-300 flex items-center gap-2">
                          <Lock className="w-3 h-3 text-yellow-400" />
                          Protected Folders:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {drive.excludedFolders.map((folder: string) => (
                            <Badge
                              key={folder}
                              variant="outline"
                              className="text-xs border-yellow-500/20 text-yellow-400"
                            >
                              <EyeOff className="w-3 h-3 mr-1" />
                              {folder}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Neptune Security Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Two-Factor Authentication</div>
                  <div className="text-xs text-slate-400">Require mobile approval for sensitive operations</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Audit Logging</div>
                  <div className="text-xs text-slate-400">Track all file access and system operations</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Auto-Lock on Idle</div>
                  <div className="text-xs text-slate-400">Lock Atlas after 15 minutes of inactivity</div>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Encrypted Backups</div>
                  <div className="text-xs text-slate-400">Automatically backup configuration with AES-256</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
          
          <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              Credential Management
            </h3>
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-between border-cyan-500/20">
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Encrypted Credentials
                </span>
                <Badge variant="outline" className="text-xs border-green-500/40 text-green-400">
                  AES-256
                </Badge>
              </Button>
              
              <Button variant="outline" className="w-full justify-between border-cyan-500/20">
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import Credentials
                </span>
              </Button>
              
              <Button variant="outline" className="w-full justify-between border-red-500/20 text-red-400 hover:bg-red-500/10">
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All Stored Credentials
                </span>
                <Badge variant="outline" className="text-xs border-red-500/40 text-red-400">
                  Danger
                </Badge>
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-cyan-400" />
              Application Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Run on Startup</div>
                  <div className="text-xs text-slate-400">Launch Atlas UX when Windows starts</div>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Minimize to Tray</div>
                  <div className="text-xs text-slate-400">Keep Atlas running in system tray when closed</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Auto-Update</div>
                  <div className="text-xs text-slate-400">Automatically download and install updates</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Desktop Notifications</div>
                  <div className="text-xs text-slate-400">Show system notifications for events</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
          
          <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-cyan-400" />
              System Information
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Version:</span>
                <span className="font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Build:</span>
                <span className="font-mono">2026.02.02</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform:</span>
                <span>Windows 11</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Installation:</span>
                <span>C:\Program Files\Atlas UX</span>
              </div>
            </div>
          </Card>
          
          <Card className="bg-red-500/10 border-red-500/30 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h3>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                onClick={resetToDefaults}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All Settings to Default
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start border-red-500/20 text-red-400 hover:bg-red-500/10"
                onClick={restartOnboarding}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restart Setup Wizard
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Uninstall Atlas UX
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        {/* Admin Login Tab */}
        <TabsContent value="admin" className="space-y-4">
          <Card className="bg-slate-800/50 border-cyan-500/20 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-cyan-400" />
              Admin Authentication
            </h3>
            
            <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-yellow-400">Restricted Access</h4>
                  <p className="text-xs text-slate-400">
                    Admin access is restricted to authorized email addresses only. 
                    A verification code will be sent to your email if authorized.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Authorized: b******@i*****.***
                  </p>
                </div>
              </div>
            </div>
            
            {!isAdminAuthenticated ? (
              <div className="space-y-4">
                {adminStep === 'email' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-slate-300">
                        Admin Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your authorized email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRequestAdminCode();
                          }
                        }}
                        className="bg-slate-900/50 border-cyan-500/20 focus:border-cyan-500/50"
                        disabled={adminLoading}
                      />
                    </div>
                    
                    <Button
                      onClick={handleRequestAdminCode}
                      disabled={adminLoading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                    >
                      {adminLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Verification Code
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {adminStep === 'code' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-green-400 font-medium mb-1">
                            Verification Code Sent
                          </p>
                          <p className="text-xs text-slate-400">
                            Check your email for a 6-digit code. Code expires in 10 minutes.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block text-slate-300">
                        Verification Code
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={adminCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setAdminCode(value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && adminCode.length === 6) {
                            handleVerifyAdminCode();
                          }
                        }}
                        className="bg-slate-900/50 border-cyan-500/20 focus:border-cyan-500/50 text-center text-2xl tracking-widest font-mono"
                        maxLength={6}
                        disabled={adminLoading}
                        autoFocus
                      />
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        Enter the 6-digit code from your email
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setAdminStep('email');
                          setAdminCode('');
                          setAdminError('');
                        }}
                        variant="outline"
                        className="flex-1 border-slate-700"
                        disabled={adminLoading}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleVerifyAdminCode}
                        disabled={adminLoading || adminCode.length !== 6}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                      >
                        {adminLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 mr-2" />
                            Verify & Login
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {adminError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400 mb-1">
                          Authentication Failed
                        </p>
                        <p className="text-xs text-red-300">
                          {adminError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {adminSuccess && !isAdminAuthenticated && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-400 mb-1">
                          Success
                        </p>
                        <p className="text-xs text-green-300">
                          {adminSuccess}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-xl">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Crown className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-400 mb-1 flex items-center gap-2">
                        Admin Access Granted
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Enterprise
                        </Badge>
                      </h4>
                      <p className="text-xs text-slate-300 mb-3">
                        You have full administrative privileges with unlimited seat access
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-slate-400 mb-1">Email</div>
                          <div className="font-mono text-green-400">{adminSession?.email}</div>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-slate-400 mb-1">Plan</div>
                          <div className="font-semibold text-cyan-400">Enterprise</div>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-slate-400 mb-1">Seats</div>
                          <div className="font-semibold text-blue-400">Unlimited</div>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-slate-400 mb-1">Session</div>
                          <div className="font-semibold text-purple-400">
                            {adminSession?.timeRemaining 
                              ? `${Math.floor(adminSession.timeRemaining / (1000 * 60 * 60))}h remaining`
                              : '24h'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleAdminLogout}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Logout Admin Session
                  </Button>
                </div>
                
                <Card className="bg-slate-900/50 border-slate-700 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Admin Capabilities</h4>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li>• Access all premium features without subscription</li>
                        <li>• Unlimited integrations and API calls</li>
                        <li>• Maximum GPU/CPU processing allocation</li>
                        <li>• Full system configuration access</li>
                        <li>• Advanced debugging and monitoring tools</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}