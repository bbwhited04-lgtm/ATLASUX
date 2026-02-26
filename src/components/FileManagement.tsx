import { useState, useRef, useCallback, useEffect } from "react";
import {
  FolderOpen, File, FileText, FileImage, FileVideo, FileCode,
  Download, Upload, Trash2, Search, Filter,
  Grid3x3, List, Star, Clock, HardDrive, Smartphone,
  CheckCircle2, AlertCircle, Settings as SettingsIcon,
  Loader2,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

interface FileItem {
  name: string;
  path: string;
  size: number | null;
  contentType: string | null;
  updatedAt: string | null;
  starred?: boolean;
}

type ViewMode = "grid" | "list";

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getFileType(contentType: string | null, name: string): "folder" | "document" | "image" | "video" | "code" {
  const ct = (contentType ?? "").toLowerCase();
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ct.startsWith("image/")) return "image";
  if (ct.startsWith("video/")) return "video";
  if (["js", "ts", "py", "json", "yaml", "yml", "sh", "md", "html", "css", "sql"].includes(ext)) return "code";
  return "document";
}

function getIcon(type: string) {
  switch (type) {
    case "folder": return FolderOpen;
    case "image": return FileImage;
    case "video": return FileVideo;
    case "code": return FileCode;
    default: return FileText;
  }
}

const TYPE_COLOR: Record<string, string> = {
  folder: "blue", document: "green", image: "purple", video: "pink", code: "orange",
};

export function FileManagement() {
  const { tenantId } = useActiveTenant();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("files");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [starredPaths, setStarredPaths] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    autoSync: true, mobileAccess: true, autoBackup: true,
    notifications: true, lowPowerMode: false, cloudStorage: true,
  });

  const fetchFiles = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/v1/files?tenantId=${encodeURIComponent(tenantId)}`, {
        credentials: "include",
        headers: { "x-tenant-id": tenantId },
      });
      const data = await r.json() as any;
      if (data?.ok) setFiles(data.files ?? []);
      else toast.error(data?.error ?? "Failed to load files");
    } catch {
      toast.error("Could not reach file storage");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await fetch(`${API_BASE}/v1/files/upload?tenantId=${encodeURIComponent(tenantId)}`, {
        method: "POST",
        credentials: "include",
        headers: { "x-tenant-id": tenantId },
        body: form,
      });
      const data = await r.json() as any;
      if (data?.ok) {
        toast.success(`Uploaded: ${file.name}`);
        fetchFiles();
      } else {
        toast.error(data?.error ?? "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (file: FileItem) => {
    if (!tenantId) return;
    try {
      const r = await fetch(
        `${API_BASE}/v1/files/url?tenantId=${encodeURIComponent(tenantId)}&path=${encodeURIComponent(file.path)}`,
        { credentials: "include", headers: { "x-tenant-id": tenantId } },
      );
      const data = await r.json() as any;
      if (data?.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = file.name;
        a.click();
      } else {
        toast.error(data?.error ?? "Could not get download URL");
      }
    } catch {
      toast.error("Download failed");
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!tenantId || !confirm(`Delete "${file.name}"?`)) return;
    setDeletingPath(file.path);
    try {
      const r = await fetch(
        `${API_BASE}/v1/files?tenantId=${encodeURIComponent(tenantId)}&path=${encodeURIComponent(file.path)}`,
        { method: "DELETE", credentials: "include", headers: { "x-tenant-id": tenantId } },
      );
      const data = await r.json() as any;
      if (data?.ok) {
        toast.success(`Deleted: ${file.name}`);
        fetchFiles();
      } else {
        toast.error(data?.error ?? "Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingPath(null);
    }
  };

  const toggleStar = (path: string) => {
    setStarredPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const starredFiles = files.filter((f) => starredPaths.has(f.path));

  const totalSize = files.reduce((acc, f) => acc + (f.size ?? 0), 0);

  const renderCard = (file: FileItem, listMode = false) => {
    const type = getFileType(file.contentType, file.name);
    const Icon = getIcon(type);
    const color = TYPE_COLOR[type] ?? "slate";
    const starred = starredPaths.has(file.path);
    const deleting = deletingPath === file.path;

    if (listMode) {
      return (
        <Card key={file.path} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-3 hover:bg-slate-900/70 transition-all group">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-slate-200 truncate">{file.name}</div>
              <div className="text-xs text-slate-400">{timeAgo(file.updatedAt)}</div>
            </div>
            {file.size !== null && <div className="text-sm text-slate-400">{formatBytes(file.size)}</div>}
            <div className="flex items-center gap-2">
              <button onClick={() => toggleStar(file.path)} className="p-1 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <Star className={`w-4 h-4 ${starred ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`} />
              </button>
              <button onClick={() => handleDownload(file)} className="p-1 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => handleDelete(file)} disabled={deleting} className="p-1 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40">
                {deleting ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Trash2 className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card key={file.path} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => toggleStar(file.path)} className="p-1 hover:bg-slate-800 rounded">
              <Star className={`w-4 h-4 ${starred ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`} />
            </button>
            <button onClick={() => handleDownload(file)} className="p-1 hover:bg-slate-800 rounded">
              <Download className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => handleDelete(file)} disabled={deleting} className="p-1 hover:bg-slate-800 rounded disabled:opacity-40">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
        <div>
          <div className="font-medium text-sm text-slate-200 truncate mb-1">{file.name}</div>
          <div className="text-xs text-slate-400">{file.size !== null ? formatBytes(file.size) : timeAgo(file.updatedAt)}</div>
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />

      <div className="p-6 space-y-6 flex-1 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              File Management
            </h2>
            <p className="text-slate-400 text-sm mt-1">Upload and manage files in your knowledge store</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-cyan-500/20"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-400" onClick={fetchFiles} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FolderOpen className="w-4 h-4 mr-2" />}
              {loading ? "Loading…" : "Refresh"}
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
                <div className="text-xl font-bold">{formatBytes(totalSize)}</div>
              </div>
            </div>
            <Progress value={Math.min(100, (totalSize / (64 * 1024 * 1024)) * 100)} className="h-1.5" />
            <div className="text-xs text-slate-400 mt-2">{Math.min(100, Math.round((totalSize / (64 * 1024 * 1024)) * 100))}% of 64 MB free tier</div>
          </Card>
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <File className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Files</div>
                <div className="text-xl font-bold">{files.length}</div>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Starred</div>
                <div className="text-xl font-bold">{starredPaths.size}</div>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Status</div>
                <div className="text-xl font-bold text-green-400">Live</div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-900/50 border border-cyan-500/20">
            <TabsTrigger value="files">Files {files.length > 0 && `(${files.length})`}</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="starred">Starred {starredPaths.size > 0 && `(${starredPaths.size})`}</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files…"
                  className="pl-10 bg-slate-900/50 border-cyan-500/20"
                />
              </div>
              <Button variant="outline" size="icon" className="border-cyan-500/20" onClick={() => setSearchQuery("")}>
                <Filter className="w-4 h-4" />
              </Button>
              <div className="flex border border-cyan-500/20 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:bg-slate-800"}`}>
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:bg-slate-800"}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            )}

            {!loading && filteredFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-slate-400 text-sm">No files yet. Click Upload to add your first file.</p>
              </div>
            )}

            {!loading && filteredFiles.length > 0 && (
              viewMode === "grid" ? (
                <div className="grid grid-cols-4 gap-4">
                  {filteredFiles.map((f) => renderCard(f, false))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((f) => renderCard(f, true))}
                </div>
              )
            )}
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-3">
            {[...files].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")).slice(0, 10).map((file) => {
              const type = getFileType(file.contentType, file.name);
              const Icon = getIcon(type);
              const color = TYPE_COLOR[type] ?? "slate";
              return (
                <Card key={file.path} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${color}-400`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-200">{file.name}</div>
                      <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(file.updatedAt)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-cyan-500/20" onClick={() => handleDownload(file)}>
                      Open
                    </Button>
                  </div>
                </Card>
              );
            })}
            {files.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No files yet.</p>}
          </TabsContent>

          {/* Starred Tab */}
          <TabsContent value="starred" className="space-y-3">
            {starredFiles.map((file) => {
              const type = getFileType(file.contentType, file.name);
              const Icon = getIcon(type);
              const color = TYPE_COLOR[type] ?? "slate";
              return (
                <Card key={file.path} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4 hover:bg-slate-900/70 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 text-${color}-400`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-200 flex items-center gap-2">
                        {file.name}
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="text-sm text-slate-400 mt-1">{timeAgo(file.updatedAt)}</div>
                    </div>
                    {file.size !== null && <div className="text-sm text-slate-400">{formatBytes(file.size)}</div>}
                  </div>
                </Card>
              );
            })}
            {starredFiles.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No starred files yet. Star files from the Files tab.</p>}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">File & Sync Settings</h3>
              <div className="space-y-4">
                {[
                  { key: "autoSync" as const, label: "Auto-Sync", desc: "Automatically sync files across devices", icon: CheckCircle2, color: "cyan" },
                  { key: "mobileAccess" as const, label: "Mobile Access", desc: "Allow mobile app to access files", icon: Smartphone, color: "purple" },
                  { key: "autoBackup" as const, label: "Auto Backup", desc: "Backup files every 24 hours", icon: HardDrive, color: "blue" },
                  { key: "notifications" as const, label: "Notifications", desc: "Notify when files are synced or changed", icon: AlertCircle, color: "yellow" },
                  { key: "lowPowerMode" as const, label: "Low Power Mode", desc: "Reduce sync frequency to save battery", icon: SettingsIcon, color: "green" },
                  { key: "cloudStorage" as const, label: "Cloud Storage", desc: "Store files in cloud for access anywhere", icon: Upload, color: "pink" },
                ].map(({ key, label, desc, icon: Icon, color }) => (
                  <Card key={key} className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${color}-400`} />
                        </div>
                        <div>
                          <div className="font-medium">{label}</div>
                          <div className="text-xs text-slate-400">{desc}</div>
                        </div>
                      </div>
                      <Switch checked={settings[key]} onCheckedChange={() => toggleSetting(key)} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 backdrop-blur-xl p-6">
              <div className="flex items-start gap-4">
                <Smartphone className="w-12 h-12 text-cyan-400" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Storage Bucket</h4>
                  <p className="text-sm text-slate-300 mb-4">
                    Files are stored in Supabase Storage bucket <code className="bg-slate-800 px-1 rounded text-cyan-300">{(import.meta.env.VITE_KB_UPLOAD_BUCKET as string) ?? "kb_uploads"}</code>.
                    Max file size: 50 MB.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm text-green-400">Connected</span>
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
