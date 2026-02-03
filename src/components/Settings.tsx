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
  Info
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";

export function Settings() {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [driveAccess, setDriveAccess] = useState<any[]>([]);
  
  useEffect(() => {
    // Load saved settings
    const savedPermissions = localStorage.getItem('atlas-permissions');
    const savedDriveAccess = localStorage.getItem('atlas-drive-access');
    
    if (savedPermissions) {
      setPermissions(JSON.parse(savedPermissions));
    }
    
    if (savedDriveAccess) {
      setDriveAccess(JSON.parse(savedDriveAccess));
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
      localStorage.removeItem('atlas-permissions');
      localStorage.removeItem('atlas-drive-access');
      window.location.reload();
    }
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
          <TabsTrigger value="permissions">
            <Shield className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="drives">
            <HardDrive className="w-4 h-4 mr-2" />
            Drive Access
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="general">
            <SettingsIcon className="w-4 h-4 mr-2" />
            General
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
                const Icon = permission.icon;
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
                        <Icon className={`w-6 h-6 ${
                          permission.enabled ? "text-cyan-400" : "text-slate-400"
                        }`} />
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
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Uninstall Atlas UX
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
