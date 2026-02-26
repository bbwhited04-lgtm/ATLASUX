import { useEffect, useRef, useState } from 'react';
import { useActiveTenant } from '@/lib/activeTenant';
import { API_BASE } from '@/lib/api';
import { toast } from 'sonner';
import {
  Film,
  Image,
  FileText,
  Type,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Layers,
  Scissors,
  Sparkles,
  Wand2,
} from "lucide-react";

type FileEntry = {
  name: string;
  path: string;
  size: number | null;
  contentType: string | null;
  updatedAt: string | null;
};

function categorizeFile(ct: string | null): "video" | "image" | "pdf" | "document" | "other" {
  if (!ct) return "other";
  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("image/")) return "image";
  if (ct === "application/pdf") return "pdf";
  if (ct.includes("document") || ct.includes("text/")) return "document";
  return "other";
}

export function MediaProcessing() {
  const { tenantId } = useActiveTenant();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"all" | "video" | "image" | "pdf" | "document">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hdr = tenantId ? { "x-tenant-id": tenantId } : {};

  async function loadFiles() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/files`, { headers: hdr });
      const json = await res.json().catch(() => ({}));
      if (json?.ok) setFiles(json.files ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(file: File) {
    if (!tenantId) {
      toast.error("Select a business first.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/v1/files/upload`, {
        method: "POST",
        headers: hdr,
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? "Upload failed");
        return;
      }
      toast.success(`Uploaded: ${file.name}`);
      await loadFiles();
    } finally {
      setUploading(false);
    }
  }

  async function getSignedUrl(path: string) {
    const res = await fetch(`${API_BASE}/v1/files/url?path=${encodeURIComponent(path)}`, { headers: hdr });
    const json = await res.json().catch(() => ({}));
    if (json?.ok && json.url) {
      window.open(json.url, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Failed to get download URL");
    }
  }

  async function deleteFile(path: string) {
    const res = await fetch(`${API_BASE}/v1/files?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
      headers: hdr,
    });
    const json = await res.json().catch(() => ({}));
    if (json?.ok) {
      toast.success("File deleted");
      await loadFiles();
    } else {
      toast.error("Delete failed");
    }
  }

  useEffect(() => { loadFiles(); }, [tenantId]);

  const filtered = filter === "all"
    ? files
    : files.filter(f => categorizeFile(f.contentType) === filter);

  const stats = {
    videos: files.filter(f => categorizeFile(f.contentType) === "video").length,
    images: files.filter(f => categorizeFile(f.contentType) === "image").length,
    pdfs: files.filter(f => categorizeFile(f.contentType) === "pdf").length,
    documents: files.filter(f => categorizeFile(f.contentType) === "document").length,
  };

  const totalSizeMB = files.reduce((acc, f) => acc + (f.size ?? 0), 0) / (1024 * 1024);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Film className="w-8 h-8 text-cyan-400" />
              <h2 className="text-3xl font-bold text-white">Media Processing</h2>
            </div>
            <p className="text-slate-400">
              Upload, manage, and organize media files across your workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadFiles}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !tenantId}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 rounded-lg text-sm font-semibold text-white transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading…" : "Upload Files"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={async (e) => {
                const flist = e.target.files;
                if (!flist) return;
                for (const f of Array.from(flist)) {
                  await uploadFile(f);
                }
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>

      {/* Processing Stats */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Film className="w-8 h-8 text-red-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.videos}</div>
          <div className="text-sm text-slate-400">Videos</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Image className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.images}</div>
          <div className="text-sm text-slate-400">Images</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <FileText className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.pdfs}</div>
          <div className="text-sm text-slate-400">PDFs</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Type className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.documents}</div>
          <div className="text-sm text-slate-400">Documents</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Layers className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{totalSizeMB.toFixed(1)}</div>
          <div className="text-sm text-slate-400">Total MB</div>
        </div>
      </div>

      {/* File Browser */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">File Browser</h3>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
            {([
              { key: "all", label: "All" },
              { key: "image", label: "Images" },
              { key: "video", label: "Videos" },
              { key: "pdf", label: "PDFs" },
              { key: "document", label: "Docs" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filter === key
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden max-h-[600px] overflow-y-auto">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700 text-xs text-slate-400 sticky top-0 bg-slate-900">
              <div className="col-span-1">Type</div>
              <div className="col-span-4">Filename</div>
              <div className="col-span-2">Format</div>
              <div className="col-span-2 text-right">Size</div>
              <div className="col-span-2">Updated</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            {filtered.map((f) => {
              const cat = categorizeFile(f.contentType);
              const TypeIcon = cat === "video" ? Film : cat === "image" ? Image : cat === "pdf" ? FileText : Type;
              const iconColor = cat === "video" ? "text-red-400" : cat === "image" ? "text-blue-400" : cat === "pdf" ? "text-purple-400" : "text-green-400";

              return (
                <div key={f.path} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700/50 text-sm items-center hover:bg-slate-800/30 transition-colors">
                  <div className="col-span-1">
                    <TypeIcon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="col-span-4 text-white truncate" title={f.name}>{f.name}</div>
                  <div className="col-span-2 text-slate-400 text-xs">{f.contentType ?? "—"}</div>
                  <div className="col-span-2 text-right text-slate-300 text-xs">
                    {f.size != null ? (f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${(f.size / 1024).toFixed(1)} KB`) : "—"}
                  </div>
                  <div className="col-span-2 text-slate-500 text-xs">
                    {f.updatedAt ? new Date(f.updatedAt).toLocaleDateString() : "—"}
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => getSignedUrl(f.path)}
                      className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => deleteFile(f.path)}
                      className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Layers className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <div className="text-slate-400 mb-2">
              {files.length === 0 ? "No files uploaded yet." : `No ${filter} files found.`}
            </div>
            <div className="text-xs text-slate-500">Upload files using the button above. Supports images, videos, PDFs, and documents.</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-pink-400" />
          <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-slate-950/50 border border-slate-700/50 hover:border-cyan-500/30 rounded-lg text-sm text-slate-300 transition-colors text-center"
          >
            <Upload className="w-5 h-5 mx-auto mb-2 text-cyan-400" />
            Upload Media
          </button>
          <button
            onClick={() => { setFilter("image"); toast.message("Filtered to images"); }}
            className="p-4 bg-slate-950/50 border border-slate-700/50 hover:border-blue-500/30 rounded-lg text-sm text-slate-300 transition-colors text-center"
          >
            <Image className="w-5 h-5 mx-auto mb-2 text-blue-400" />
            Browse Images
          </button>
          <button
            onClick={() => { setFilter("video"); toast.message("Filtered to videos"); }}
            className="p-4 bg-slate-950/50 border border-slate-700/50 hover:border-red-500/30 rounded-lg text-sm text-slate-300 transition-colors text-center"
          >
            <Film className="w-5 h-5 mx-auto mb-2 text-red-400" />
            Browse Videos
          </button>
          <button
            onClick={() => { setFilter("pdf"); toast.message("Filtered to PDFs"); }}
            className="p-4 bg-slate-950/50 border border-slate-700/50 hover:border-purple-500/30 rounded-lg text-sm text-slate-300 transition-colors text-center"
          >
            <FileText className="w-5 h-5 mx-auto mb-2 text-purple-400" />
            Browse PDFs
          </button>
        </div>
      </div>

      {/* Upcoming Features */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 opacity-60">
          <Scissors className="w-6 h-6 text-red-400 mb-3" />
          <div className="text-white font-semibold mb-1">AI Video Auto-Editor</div>
          <div className="text-xs text-slate-400">Auto-cut dead air, add transitions, balance audio. Requires external processing API.</div>
          <div className="mt-3 px-2 py-1 bg-slate-800 rounded text-xs text-slate-500 inline-block">Coming Soon</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 opacity-60">
          <Wand2 className="w-6 h-6 text-blue-400 mb-3" />
          <div className="text-white font-semibold mb-1">Background Removal</div>
          <div className="text-xs text-slate-400">Batch remove backgrounds, resize, crop, and watermark images.</div>
          <div className="mt-3 px-2 py-1 bg-slate-800 rounded text-xs text-slate-500 inline-block">Coming Soon</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-6 opacity-60">
          <Type className="w-6 h-6 text-green-400 mb-3" />
          <div className="text-white font-semibold mb-1">OCR & Subtitles</div>
          <div className="text-xs text-slate-400">Extract text from images/PDFs and auto-generate video subtitles.</div>
          <div className="mt-3 px-2 py-1 bg-slate-800 rounded text-xs text-slate-500 inline-block">Coming Soon</div>
        </div>
      </div>
    </div>
  );
}
