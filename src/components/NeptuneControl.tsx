import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertTriangle,
  Lock,
  Play,
  Pause,
  Settings,
  Eye,
  Ban,
  Zap
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

interface PendingTask {
  id: number;
  task: string;
  type: "file_access" | "content_creation" | "social_post" | "email" | "browser_automation";
  requestedBy: string;
  timestamp: string;
  expiresIn: number; // seconds
  priority: "high" | "medium" | "low";
  requiresApproval: boolean;
}

interface SafetyCheck {
  contentFilter: boolean;
  scrapingPrevention: boolean;
  vulgarityFilter: boolean;
  privacyMode: boolean;
}

export function NeptuneControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([
    {
      id: 1,
      task: "Access Documents folder to analyze quarterly reports",
      type: "file_access",
      requestedBy: "Atlas AI",
      timestamp: "2m ago",
      expiresIn: 280,
      priority: "high",
      requiresApproval: true
    },
    {
      id: 2,
      task: "Create and schedule Instagram post for product launch",
      type: "social_post",
      requestedBy: "Pluto Jobs",
      timestamp: "5m ago",
      expiresIn: 540,
      priority: "medium",
      requiresApproval: true
    },
    {
      id: 3,
      task: "Send follow-up emails to 15 contacts from CRM",
      type: "email",
      requestedBy: "Atlas AI",
      timestamp: "8m ago",
      expiresIn: 420,
      priority: "low",
      requiresApproval: true
    },
  ]);
  
  const [safetyStatus, setSafetyStatus] = useState<SafetyCheck>({
    contentFilter: true,
    scrapingPrevention: true,
    vulgarityFilter: true,
    privacyMode: true
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    autoApproveFileAccess: false,
    autoApproveSocialPosts: false,
    requireApprovalForBrowser: true,
    expirationTime: 300 // 5 minutes default
  });
  
  // Timer countdown for pending tasks
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingTasks(prev => 
        prev.map(task => ({
          ...task,
          expiresIn: Math.max(0, task.expiresIn - 1)
        })).filter(task => task.expiresIn > 0) // Remove expired tasks
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const approveTask = (taskId: number) => {
    const task = pendingTasks.find(t => t.id === taskId);
    setPendingTasks(prev => prev.filter(t => t.id !== taskId));
    
    // Trigger task execution
    if ((window as any).plutoStartTask) {
      (window as any).plutoStartTask();
    }
    
    // Show notification
    if ((window as any).atlasTaskComplete) {
      setTimeout(() => {
        (window as any).atlasTaskComplete();
      }, 3000);
    }
  };
  
  const denyTask = (taskId: number) => {
    setPendingTasks(prev => prev.filter(t => t.id !== taskId));
  };
  
  const getTaskIcon = (type: string) => {
    switch (type) {
      case "file_access": return Lock;
      case "social_post": return Zap;
      case "email": return Settings;
      case "browser_automation": return Eye;
      default: return Shield;
    }
  };
  
  const getTaskColor = (type: string) => {
    switch (type) {
      case "file_access": return "yellow";
      case "social_post": return "blue";
      case "email": return "purple";
      case "browser_automation": return "orange";
      default: return "cyan";
    }
  };
  
  return (
    <>
      {/* Neptune Avatar - Lower Right Corner */}
      <motion.div
        className="fixed bottom-8 right-8 z-50 cursor-pointer"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pending notifications badge */}
        {pendingTasks.length > 0 && (
          <motion.div
            className="absolute -top-2 -right-2 z-10"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge className="bg-red-500 text-white border-red-400 px-2">
              {pendingTasks.length}
            </Badge>
          </motion.div>
        )}
        
        {/* Neptune Shield */}
        <motion.div
          className="relative"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 -m-8 border-2 border-cyan-500/30 rounded-full"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />
          
          {/* Shield Icon */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/40 backdrop-blur-xl flex items-center justify-center relative">
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-2xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            
            <Shield className="w-12 h-12 text-cyan-400 relative z-10" />
            
            {/* Status indicator */}
            <motion.div
              className="absolute bottom-2 right-2 w-3 h-3 bg-green-400 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </div>
        </motion.div>
        
        {/* Label */}
        <div className="text-center mt-2">
          <div className="text-xs font-semibold text-cyan-400">NEPTUNE</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Control Center</div>
        </div>
      </motion.div>
      
      {/* Neptune Control Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Control Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] max-h-[90vh] z-50"
            >
              <Card className="bg-slate-900/95 border-cyan-500/40 backdrop-blur-xl shadow-2xl shadow-cyan-500/20">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Neptune Control Center
                      </h2>
                      <p className="text-xs text-slate-400">
                        "Atlas UX works where you work" - Directly on your PC
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Security Status Bar */}
                <div className="px-6 py-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-b border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="border-green-500/40 text-green-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Content Filter Active
                      </Badge>
                      <Badge variant="outline" className="border-green-500/40 text-green-400">
                        <Ban className="w-3 h-3 mr-1" />
                        Scraping Prevention ON
                      </Badge>
                      <Badge variant="outline" className="border-green-500/40 text-green-400">
                        <Shield className="w-3 h-3 mr-1" />
                        Vulgarity Filter ON
                      </Badge>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-400">
                      <Lock className="w-3 h-3 mr-1" />
                      Privacy Mode
                    </Badge>
                  </div>
                </div>
                
                <Tabs defaultValue="pending" className="p-6">
                  <TabsList className="bg-slate-800/50 border border-cyan-500/20 mb-4">
                    <TabsTrigger value="pending" className="relative">
                      Pending Approvals
                      {pendingTasks.length > 0 && (
                        <Badge className="ml-2 bg-red-500 text-white px-1.5 py-0 text-xs">
                          {pendingTasks.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
                    <TabsTrigger value="security">Security Status</TabsTrigger>
                  </TabsList>
                  
                  {/* Pending Approvals Tab */}
                  <TabsContent value="pending">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {pendingTasks.length === 0 ? (
                          <Card className="bg-slate-800/50 border-cyan-500/20 p-8 text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                            <h4 className="font-medium text-slate-300 mb-1">All Clear!</h4>
                            <p className="text-sm text-slate-400">No pending tasks require approval</p>
                          </Card>
                        ) : (
                          pendingTasks.map((task) => {
                            const TaskIcon = getTaskIcon(task.type);
                            const color = getTaskColor(task.type);
                            const isExpiringSoon = task.expiresIn < 60;
                            
                            return (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                              >
                                <Card className={`bg-slate-800/50 border-${color}-500/30 p-4`}>
                                  <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                                      <TaskIcon className={`w-6 h-6 text-${color}-400`} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h4 className="font-medium text-slate-200 mb-1">{task.task}</h4>
                                          <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span>Requested by {task.requestedBy}</span>
                                            <span>•</span>
                                            <span>{task.timestamp}</span>
                                          </div>
                                        </div>
                                        
                                        <Badge 
                                          variant="outline"
                                          className={`text-xs ${
                                            task.priority === "high" ? "border-red-500/40 text-red-400" :
                                            task.priority === "medium" ? "border-yellow-500/40 text-yellow-400" :
                                            "border-slate-500/40 text-slate-400"
                                          }`}
                                        >
                                          {task.priority}
                                        </Badge>
                                      </div>
                                      
                                      {/* Timer */}
                                      <div className="mb-3">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                          <span className={`flex items-center gap-1 ${isExpiringSoon ? "text-red-400" : "text-slate-400"}`}>
                                            <Clock className="w-3 h-3" />
                                            Expires in {formatTime(task.expiresIn)}
                                          </span>
                                          <span className="text-slate-500">
                                            {Math.round((task.expiresIn / privacySettings.expirationTime) * 100)}%
                                          </span>
                                        </div>
                                        <Progress 
                                          value={(task.expiresIn / privacySettings.expirationTime) * 100} 
                                          className={`h-1 ${isExpiringSoon ? "bg-red-500/20" : ""}`}
                                        />
                                      </div>
                                      
                                      {/* Actions */}
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => approveTask(task.id)}
                                          className="flex-1 bg-green-500 hover:bg-green-400 text-white"
                                        >
                                          <CheckCircle2 className="w-4 h-4 mr-1" />
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => denyTask(task.id)}
                                          className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10"
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Deny
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  {/* Privacy Settings Tab */}
                  <TabsContent value="settings">
                    <div className="space-y-4">
                      <Card className="bg-slate-800/50 border-cyan-500/20 p-4">
                        <h4 className="font-medium mb-4">Auto-Approval Settings</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                            <div>
                              <div className="font-medium text-sm">Auto-approve file access</div>
                              <div className="text-xs text-slate-400">Automatically grant file system access</div>
                            </div>
                            <button
                              onClick={() => setPrivacySettings(prev => ({
                                ...prev,
                                autoApproveFileAccess: !prev.autoApproveFileAccess
                              }))}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                privacySettings.autoApproveFileAccess ? "bg-cyan-500" : "bg-slate-600"
                              }`}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow"
                                animate={{
                                  x: privacySettings.autoApproveFileAccess ? 26 : 2
                                }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                            <div>
                              <div className="font-medium text-sm">Auto-approve social posts</div>
                              <div className="text-xs text-slate-400">Post to social media without approval</div>
                            </div>
                            <button
                              onClick={() => setPrivacySettings(prev => ({
                                ...prev,
                                autoApproveSocialPosts: !prev.autoApproveSocialPosts
                              }))}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                privacySettings.autoApproveSocialPosts ? "bg-cyan-500" : "bg-slate-600"
                              }`}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow"
                                animate={{
                                  x: privacySettings.autoApproveSocialPosts ? 26 : 2
                                }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                            <div>
                              <div className="font-medium text-sm">Require browser approval</div>
                              <div className="text-xs text-slate-400">Always ask before browser automation</div>
                            </div>
                            <button
                              onClick={() => setPrivacySettings(prev => ({
                                ...prev,
                                requireApprovalForBrowser: !prev.requireApprovalForBrowser
                              }))}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                privacySettings.requireApprovalForBrowser ? "bg-cyan-500" : "bg-slate-600"
                              }`}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow"
                                animate={{
                                  x: privacySettings.requireApprovalForBrowser ? 26 : 2
                                }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </button>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="bg-slate-800/50 border-cyan-500/20 p-4">
                        <h4 className="font-medium mb-4">Task Expiration Timer</h4>
                        
                        <div className="space-y-3">
                          <div className="text-sm text-slate-400 mb-2">
                            Tasks will auto-expire if not approved within:
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: "1 min", value: 60 },
                              { label: "5 min", value: 300 },
                              { label: "10 min", value: 600 },
                              { label: "30 min", value: 1800 },
                              { label: "1 hour", value: 3600 },
                              { label: "Never", value: 999999 },
                            ].map(option => (
                              <Button
                                key={option.value}
                                variant={privacySettings.expirationTime === option.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPrivacySettings(prev => ({
                                  ...prev,
                                  expirationTime: option.value
                                }))}
                                className={privacySettings.expirationTime === option.value ? "bg-cyan-500" : "border-cyan-500/20"}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  {/* Security Status Tab */}
                  <TabsContent value="security">
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-green-500/10 to-cyan-500/10 border-green-500/30 p-6">
                        <div className="flex items-start gap-4">
                          <Shield className="w-12 h-12 text-green-400 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-lg mb-2">All Security Systems Active</h4>
                            <p className="text-sm text-slate-300 mb-4">
                              Atlas UX is running with maximum security on your local PC. All filters and protections are operational.
                            </p>
                          </div>
                        </div>
                      </Card>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-slate-800/50 border-green-500/20 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Content Filter</div>
                              <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs mt-1">
                                Active
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400">
                            Blocks inappropriate, vulgar, and explicit content from all AI operations
                          </p>
                        </Card>
                        
                        <Card className="bg-slate-800/50 border-green-500/20 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                              <Ban className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Scraping Prevention</div>
                              <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs mt-1">
                                Active
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400">
                            Prevents unauthorized data extraction and protects user privacy
                          </p>
                        </Card>
                        
                        <Card className="bg-slate-800/50 border-green-500/20 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                              <Shield className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Vulgarity Filter</div>
                              <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs mt-1">
                                Active
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400">
                            Filters profanity, hate speech, and inappropriate language
                          </p>
                        </Card>
                        
                        <Card className="bg-slate-800/50 border-green-500/20 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                              <Lock className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Privacy Mode</div>
                              <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs mt-1">
                                Active
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400">
                            All data stays on your PC. No cloud uploads without permission
                          </p>
                        </Card>
                      </div>
                      
                      <Card className="bg-slate-800/50 border-cyan-500/20 p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-sm mb-2">Local PC Operation</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              <strong className="text-cyan-400">"Atlas UX works where you work"</strong> - Your AI employee operates 
                              directly on your PC. All processing, file access, and task execution happens locally. 
                              Neptune ensures no unauthorized external access, scraping, or inappropriate content can be used.
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
