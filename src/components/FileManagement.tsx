import { useState } from "react";
import { 
  FolderOpen,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileCode,
  Download,
  Upload,
  Trash2,
  Search,
  Filter,
  Grid3x3,
  List,
  Star,
  Clock,
  HardDrive,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";

interface FileItem {
  id: number;
  name: string;
  type: "folder" | "document" | "image" | "video" | "code";
  size?: string;
  modified: string;
  starred: boolean;
  synced: boolean;
}

export function FileManagement() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("files");
  
  const [files, setFiles] = useState<FileItem[]>([
    { id: 1, name: "Project Documents", type: "folder", modified: "2 hours ago", starred: true, synced: true },
    { id: 2, name: "Social Media Assets", type: "folder", modified: "5 hours ago", starred: false, synced: true },
    { id: 3, name: "Q1-2026-Report.pdf", type: "document", size: "2.4 MB", modified: "1 day ago", starred: true, synced: true },
    { id: 4, name: "product-demo.mp4", type: "video", size: "156 MB", modified: "2 days ago", starred: false, synced: false },
    { id: 5, name: "logo-animation.gif", type: "image", size: "4.2 MB", modified: "3 days ago", starred: false, synced: true },
    { id: 6, name: "automation-script.py", type: "code", size: "12 KB", modified: "1 week ago", starred: true, synced: true },
    { id: 7, name: "Marketing Campaign", type: "folder", modified: "1 week ago", starred: false, synced: true },
    { id: 8, name: "presentation.pptx", type: "document", size: "8.7 MB", modified: "2 weeks ago", starred: false, synced: true },
  ]);
  
  const [settings, setSettings] = useState({
    autoSync: true,
    mobileAccess: true,
    autoBackup: true,
    notifications: true,
    lowPowerMode: false,
    cloudStorage: true
  });
  
  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder": return FolderOpen;
      case "document": return FileText;
      case "image": return FileImage;
      case "video": return FileVideo;
      case "code": return FileCode;
      default: return File;
    }
  };
  
  const getFileColor = (type: string) => {
    switch (type) {
      case "folder": return "blue";
      case "document": return "green";
      case "image": return "purple";
      case "video": return "pink";
      case "code": return "orange";
      default: return "slate";
    }
  };
  
  const toggleStar = (fileId: number) => {
    setFiles(files.map(file => 
      file.id === fileId ? { ...file, starred: !file.starred } : file
    ));
  };
  
  const toggleSetting = (setting: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };
  
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              File Management
            </h2>
            <p className="text-slate-400 text-sm mt-1">Access and manage your files with AI assistance</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="border-cyan-500/20">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-400">
              <FolderOpen className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>
        
        {/* Storage Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Storage Used</div>
                <div className="text-xl font-bold">42.8 GB</div>
              </div>
            </div>
            <Progress value={68} className="h-1.5" />
            <div className="text-xs text-slate-400 mt-2">68% of 64 GB</div>
          </Card>
          
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <File className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Files</div>
                <div className="text-xl font-bold">1,247</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Synced</div>
                <div className="text-xl font-bold">1,189</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Mobile Ready</div>
                <div className="text-xl font-bold">892</div>
              </div>
            </div>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-900/50 border border-cyan-500/20">
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files and folders..."
                  className="pl-10 bg-slate-900/50 border-cyan-500/20"
                />
              </div>
              
              <Button variant="outline" size="icon" className="border-cyan-500/20">
                <Filter className="w-4 h-4" />
              </Button>
              
              <div className="flex border border-cyan-500/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:bg-slate-800"}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:bg-slate-800"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* File Grid/List */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-4 gap-4">
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file.type);
                  const color = getFileColor(file.type);
                  
                  return (
                    <Card 
                      key={file.id}
                      className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 text-${color}-400`} />
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleStar(file.id)}
                            className="p-1 hover:bg-slate-800 rounded"
                          >
                            <Star className={`w-4 h-4 ${file.starred ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`} />
                          </button>
                          {file.synced ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-medium text-sm text-slate-200 truncate mb-1">
                          {file.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {file.size || file.modified}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file.type);
                  const color = getFileColor(file.type);
                  
                  return (
                    <Card 
                      key={file.id}
                      className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-3 hover:bg-slate-900/70 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 text-${color}-400`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-200 truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-slate-400">{file.modified}</div>
                        </div>
                        
                        {file.size && (
                          <div className="text-sm text-slate-400">{file.size}</div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {file.synced ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                          )}
                          
                          <button
                            onClick={() => toggleStar(file.id)}
                            className="p-1 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star className={`w-4 h-4 ${file.starred ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`} />
                          </button>
                          
                          <button className="p-1 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <Download className="w-4 h-4 text-slate-400" />
                          </button>
                          
                          <button className="p-1 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-3">
            {files.slice(0, 6).map((file) => {
              const Icon = getFileIcon(file.type);
              const color = getFileColor(file.type);
              
              return (
                <Card 
                  key={file.id}
                  className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${color}-400`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-slate-200">{file.name}</div>
                      <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" />
                        {file.modified}
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="border-cyan-500/20">
                      Open
                    </Button>
                  </div>
                </Card>
              );
            })}
          </TabsContent>
          
          {/* Starred Tab */}
          <TabsContent value="starred" className="space-y-3">
            {files.filter(f => f.starred).map((file) => {
              const Icon = getFileIcon(file.type);
              const color = getFileColor(file.type);
              
              return (
                <Card 
                  key={file.id}
                  className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${color}-400`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-slate-200 flex items-center gap-2">
                        {file.name}
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="text-sm text-slate-400 mt-1">{file.modified}</div>
                    </div>
                    
                    {file.size && (
                      <div className="text-sm text-slate-400">{file.size}</div>
                    )}
                  </div>
                </Card>
              );
            })}
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">File & Sync Settings</h3>
              
              <div className="space-y-4">
                <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="font-medium">Auto-Sync</div>
                        <div className="text-xs text-slate-400">Automatically sync files across devices</div>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.autoSync} 
                      onCheckedChange={() => toggleSetting("autoSync")}
                    />
                  </div>
                </Card>
                
                <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-medium">Mobile Access</div>
                        <div className="text-xs text-slate-400">Allow mobile app to access files</div>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.mobileAccess} 
                      onCheckedChange={() => toggleSetting("mobileAccess")}
                    />
                  </div>
                </Card>
                
                <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <HardDrive className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium">Auto Backup</div>
                        <div className="text-xs text-slate-400">Backup files every 24 hours</div>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.autoBackup} 
                      onCheckedChange={() => toggleSetting("autoBackup")}
                    />
                  </div>
                </Card>
                
                <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="font-medium">Notifications</div>
                        <div className="text-xs text-slate-400">Notify when files are synced or changed</div>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.notifications} 
                      onCheckedChange={() => toggleSetting("notifications")}
                    />
                  </div>
                </Card>
                
                <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <SettingsIcon className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="font-medium">Low Power Mode</div>
                        <div className="text-xs text-slate-400">Reduce sync frequency to save battery</div>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.lowPowerMode} 
                      onCheckedChange={() => toggleSetting("lowPowerMode")}
                    />
                  </div>
                </Card>
                
                <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <div className="font-medium">Cloud Storage</div>
                        <div className="text-xs text-slate-400">Store files in cloud for access anywhere</div>
                      </div>
                    </div>
                    <Switch 
                      checked={settings.cloudStorage} 
                      onCheckedChange={() => toggleSetting("cloudStorage")}
                    />
                  </div>
                </Card>
              </div>
            </div>
            
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 backdrop-blur-xl p-6">
              <div className="flex items-start gap-4">
                <Smartphone className="w-12 h-12 text-cyan-400" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Mobile App Sync</h4>
                  <p className="text-sm text-slate-300 mb-4">
                    Your mobile app is connected and syncing in real-time. Last sync was 2 minutes ago.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm text-green-400">Connected & Syncing</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
