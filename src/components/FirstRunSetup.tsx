import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  HardDrive,
  Folder,
  Check,
  ChevronRight,
  AlertTriangle,
  Lock,
  Unlock,
  Monitor,
  Globe,
  FileText,
  Image,
  Video,
  Music,
  Settings,
  CheckCircle2,
  XCircle,
  Info,
  Zap,
  Eye,
  EyeOff
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Progress } from "./ui/progress";
import atlasLogo from "figma:asset/35d30f28f8b129622d68cf23f3324a107934c4ee.png";

interface DriveAccess {
  drive: string;
  label: string;
  size: string;
  type: "system" | "data" | "external";
  enabled: boolean;
  restricted: boolean;
  excludedFolders: string[];
}

interface SystemPermission {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  icon: any;
  riskLevel: "low" | "medium" | "high";
}

export function FirstRunSetup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"welcome" | "permissions" | "drives" | "restrictions" | "confirm" | "installing">("welcome");
  const [progress, setProgress] = useState(0);

  const [systemPermissions, setSystemPermissions] = useState<SystemPermission[]>([
    {
      id: "file-system",
      name: "File System Access",
      description: "Read, write, create, and delete files across your PC",
      required: true,
      enabled: false,
      icon: Folder,
      riskLevel: "high"
    },
    {
      id: "network",
      name: "Network Access",
      description: "Connect to internet services and APIs",
      required: true,
      enabled: false,
      icon: Globe,
      riskLevel: "medium"
    },
    {
      id: "system-info",
      name: "System Information",
      description: "Read hardware specs, OS version, and system status",
      required: true,
      enabled: false,
      icon: Monitor,
      riskLevel: "low"
    },
    {
      id: "background-tasks",
      name: "Background Tasks",
      description: "Run tasks when app is minimized or in background",
      required: true,
      enabled: false,
      icon: Zap,
      riskLevel: "low"
    },
    {
      id: "clipboard",
      name: "Clipboard Access",
      description: "Read and write to system clipboard",
      required: false,
      enabled: false,
      icon: FileText,
      riskLevel: "medium"
    },
    {
      id: "notifications",
      name: "System Notifications",
      description: "Display notifications and alerts",
      required: false,
      enabled: false,
      icon: AlertTriangle,
      riskLevel: "low"
    },
    {
      id: "startup",
      name: "Run on Startup",
      description: "Launch Atlas UX when Windows starts",
      required: false,
      enabled: false,
      icon: Settings,
      riskLevel: "low"
    }
  ]);

  const [driveAccess, setDriveAccess] = useState<DriveAccess[]>([
    {
      drive: "C:\\",
      label: "System Drive (Windows)",
      size: "476 GB",
      type: "system",
      enabled: false,
      restricted: true,
      excludedFolders: ["Windows", "Program Files", "Program Files (x86)"]
    },
    {
      drive: "D:\\",
      label: "Data Drive",
      size: "931 GB",
      type: "data",
      enabled: false,
      restricted: false,
      excludedFolders: []
    },
    {
      drive: "E:\\",
      label: "External Drive",
      size: "1.82 TB",
      type: "external",
      enabled: false,
      restricted: false,
      excludedFolders: []
    }
  ]);

  const [restrictedFolders, setRestrictedFolders] = useState({
    "C:\\": ["Windows", "Program Files", "Program Files (x86)", "ProgramData"],
    "D:\\": [] as string[],
    "E:\\": [] as string[]
  });

  const togglePermission = (id: string) => {
    setSystemPermissions(systemPermissions.map(perm =>
      perm.id === id ? { ...perm, enabled: !perm.enabled } : perm
    ));
  };

  const toggleDrive = (drive: string) => {
    setDriveAccess(driveAccess.map(d =>
      d.drive === drive ? { ...d, enabled: !d.enabled } : d
    ));
  };

  const toggleDriveRestriction = (drive: string) => {
    setDriveAccess(driveAccess.map(d =>
      d.drive === drive ? { ...d, restricted: !d.restricted } : d
    ));
  };

  const enableAllRequired = () => {
    setSystemPermissions(systemPermissions.map(perm =>
      perm.required ? { ...perm, enabled: true } : perm
    ));
  };

  const enableAllDrives = () => {
    setDriveAccess(driveAccess.map(d => ({ ...d, enabled: true })));
  };

  const handleComplete = () => {
    setStep("installing");
    
    // Simulate installation process
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          localStorage.setItem("atlas-first-run-complete", "true");
          localStorage.setItem("atlas-permissions", JSON.stringify(systemPermissions));
          localStorage.setItem("atlas-drive-access", JSON.stringify(driveAccess));
          onComplete();
        }, 500);
      }
    }, 300);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "medium": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "low": return "text-green-400 bg-green-500/10 border-green-500/30";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  const canProceed = () => {
    if (step === "permissions") {
      return systemPermissions.filter(p => p.required).every(p => p.enabled);
    }
    if (step === "drives") {
      return driveAccess.some(d => d.enabled);
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-4xl w-full mx-4"
      >
        <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur-2xl p-8">
          {/* Welcome Step */}
          {step === "welcome" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center">
                <motion.div
                  className="w-32 h-32"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img src={atlasLogo} alt="Atlas UX" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
                </motion.div>
              </div>
              
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3">
                  Welcome to Atlas UX
                </h1>
                <p className="text-lg text-slate-300">
                  Your Standalone AI Employee for Windows 11
                </p>
              </div>
              
              <Card className="bg-slate-800/50 border-cyan-500/20 p-6 text-left">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                  First-Time Setup
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                  Atlas UX requires certain permissions to function as your AI employee. This setup will guide you through:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">System Permissions</div>
                      <div className="text-xs text-slate-400">Grant Atlas access to your PC's features</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Drive Access Configuration</div>
                      <div className="text-xs text-slate-400">Choose which drives Atlas can access</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Folder Restrictions</div>
                      <div className="text-xs text-slate-400">Protect sensitive system folders</div>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h4 className="font-semibold text-sm mb-1">Security & Privacy</h4>
                    <p className="text-xs text-slate-300">
                      All permissions can be modified later in Settings. Atlas UX uses AES-256 encryption for all sensitive data and Atlas validates every operation before execution.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                onClick={() => setStep("permissions")}
              >
                Begin Setup
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* System Permissions Step */}
          {step === "permissions" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-2">System Permissions</h2>
                <p className="text-sm text-slate-400">
                  Grant Atlas UX the permissions it needs to operate as your AI employee
                </p>
              </div>
              
              <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Required Permissions</h4>
                    <p className="text-xs text-slate-300 mb-3">
                      Permissions marked as "Required" are necessary for Atlas UX to function. Optional permissions enhance capabilities but aren't mandatory.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={enableAllRequired}
                      className="text-xs border-yellow-500/20"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Enable All Required
                    </Button>
                  </div>
                </div>
              </Card>
              
              <ScrollArea className="h-96">
                <div className="space-y-3 pr-4">
                  {systemPermissions.map((permission) => {
                    const Icon = permission.icon;
                    return (
                      <Card
                        key={permission.id}
                        className={`p-4 transition-all ${
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
                          
                          <div className="flex-1 min-w-0">
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
                                className="ml-3"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${getRiskColor(permission.riskLevel)}`}>
                                {permission.riskLevel.toUpperCase()} RISK
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700"
                  onClick={() => setStep("welcome")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400"
                  onClick={() => setStep("drives")}
                  disabled={!canProceed()}
                >
                  Continue to Drive Access
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Drive Access Step */}
          {step === "drives" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-2">Drive Access Configuration</h2>
                <p className="text-sm text-slate-400">
                  Choose which drives Atlas UX can access and manage files on
                </p>
              </div>
              
              <Card className="bg-cyan-500/10 border-cyan-500/30 p-4">
                <div className="flex items-start gap-3">
                  <HardDrive className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Recommended Setup</h4>
                    <p className="text-xs text-slate-300 mb-3">
                      Enable at least one drive for Atlas to operate. The System Drive (C:\) is recommended with restrictions to protect Windows files.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={enableAllDrives}
                      className="text-xs border-cyan-500/20"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Enable All Drives
                    </Button>
                  </div>
                </div>
              </Card>
              
              <div className="space-y-3">
                {driveAccess.map((drive) => (
                  <Card
                    key={drive.drive}
                    className={`p-4 transition-all ${
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
                      
                      <div className="flex-1 min-w-0">
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
                            className="ml-3"
                          />
                        </div>
                        
                        {drive.enabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                {drive.restricted ? (
                                  <Lock className="w-4 h-4 text-yellow-400" />
                                ) : (
                                  <Unlock className="w-4 h-4 text-green-400" />
                                )}
                                <div>
                                  <div className="text-xs font-medium">
                                    {drive.restricted ? "Restricted Access" : "Full Access"}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {drive.restricted
                                      ? `${drive.excludedFolders.length} folders protected`
                                      : "No restrictions applied"}
                                  </div>
                                </div>
                              </div>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleDriveRestriction(drive.drive)}
                                className="text-xs border-cyan-500/20"
                              >
                                {drive.restricted ? "Remove Restrictions" : "Add Restrictions"}
                              </Button>
                            </div>
                            
                            {drive.restricted && drive.excludedFolders.length > 0 && (
                              <div className="p-3 bg-slate-800/50 rounded-lg">
                                <div className="text-xs font-medium mb-2 text-slate-300">Protected Folders:</div>
                                <div className="flex flex-wrap gap-1">
                                  {drive.excludedFolders.map((folder) => (
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
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700"
                  onClick={() => setStep("permissions")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400"
                  onClick={() => setStep("confirm")}
                  disabled={!canProceed()}
                >
                  Continue to Review
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Confirmation Step */}
          {step === "confirm" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-2">Review & Confirm</h2>
                <p className="text-sm text-slate-400">
                  Review your settings before completing setup
                </p>
              </div>
              
              <Card className="bg-slate-800/50 border-cyan-500/20 p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  System Permissions
                </h3>
                <div className="space-y-2">
                  {systemPermissions.filter(p => p.enabled).map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm">{perm.name}</span>
                      {perm.required && (
                        <Badge variant="outline" className="text-xs border-red-500/40 text-red-400">
                          Required
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card className="bg-slate-800/50 border-cyan-500/20 p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-green-400" />
                  Drive Access
                </h3>
                <div className="space-y-3">
                  {driveAccess.filter(d => d.enabled).map((drive) => (
                    <div key={drive.drive} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">{drive.drive} - {drive.label}</span>
                      </div>
                      {drive.restricted && (
                        <div className="ml-6 text-xs text-slate-400">
                          Protected folders: {drive.excludedFolders.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">You can change these settings later</h4>
                    <p className="text-xs text-slate-300">
                      All permissions and drive access can be modified in Settings → Security & Permissions at any time.
                    </p>
                  </div>
                </div>
              </Card>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700"
                  onClick={() => setStep("drives")}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                  onClick={handleComplete}
                >
                  Complete Setup
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Installing Step */}
          {step === "installing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="flex justify-center">
                <motion.div
                  className="w-32 h-32"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img src={atlasLogo} alt="Atlas UX" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
                </motion.div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Completing Setup...</h2>
                <p className="text-sm text-slate-400">
                  Initializing Atlas security system and configuring drive access
                </p>
              </div>
              
              <div className="max-w-md mx-auto space-y-3">
                <Progress value={progress} className="h-2" />
                <div className="text-sm text-slate-400">{progress}%</div>
              </div>
              
              <div className="space-y-2 text-xs text-slate-500">
                <div className={progress >= 20 ? "text-cyan-400" : ""}>
                  {progress >= 20 ? "✓" : "•"} Validating permissions...
                </div>
                <div className={progress >= 40 ? "text-cyan-400" : ""}>
                  {progress >= 40 ? "✓" : "•"} Configuring drive access...
                </div>
                <div className={progress >= 60 ? "text-cyan-400" : ""}>
                  {progress >= 60 ? "✓" : "•"} Initializing Atlas AI...
                </div>
                <div className={progress >= 80 ? "text-cyan-400" : ""}>
                  {progress >= 80 ? "✓" : "•"} Setting up encryption...
                </div>
                <div className={progress >= 100 ? "text-cyan-400" : ""}>
                  {progress >= 100 ? "✓" : "•"} Finalizing setup...
                </div>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}