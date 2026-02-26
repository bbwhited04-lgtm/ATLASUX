import { useEffect, useState } from "react";
import {
  Plus,
  ExternalLink,
  Send,
  RefreshCw,
  FileText,
  Trash2,
  Globe,
  PenLine,
  Image,
  Upload,
  X as XIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { API_BASE } from "@/lib/api";
import { useActiveTenant } from "@/lib/activeTenant";

type BlogPost = {
  id?: string;
  slug?: string;
  title?: string;
  featuredImageUrl?: string | null;
  category?: string;
  excerpt?: string;
  date?: string;
  status?: string;
};

const CATEGORIES = [
  "Updates",
  "Announcements",
  "Case Studies",
  "Governance",
  "Tech",
  "Marketing",
  "Business",
  "Other",
];

const inputCls =
  "w-full bg-slate-950/60 border border-cyan-500/20 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors";

export function BlogManager() {
  const { tenantId: activeTenantId } = useActiveTenant();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: "Updates",
    excerpt: "",
    body: "",
    featuredImageUrl: "",
    publish: true,
  });

  function getHeaders() {
    return { "Content-Type": "application/json", "x-tenant-id": activeTenantId ?? "" };
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const tenantId = activeTenantId ?? "";
      const res = await fetch(
        `${API_BASE}/v1/blog/posts?org_id=${encodeURIComponent(tenantId)}`,
        { headers: { "x-tenant-id": tenantId } }
      );
      const json = await res.json().catch(() => null);
      const items = (json?.items ?? json?.posts ?? []) as BlogPost[];
      setPosts(Array.isArray(items) ? items : []);
    } catch (e: any) {
      setPosts([]);
      setErr(e?.message || "blog_load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  function resetForm() {
    setForm({ title: "", category: "Updates", excerpt: "", body: "", featuredImageUrl: "", publish: true });
    setErr(null);
    setSuccess(null);
    setSelectedPost(null);
  }

  async function loadPostIntoEditor(post: BlogPost) {
    setSelectedPost(post);
    setForm({
      title: post.title ?? "",
      category: post.category ?? "Updates",
      excerpt: post.excerpt ?? "",
      body: "",
      featuredImageUrl: post.featuredImageUrl ?? "",
      publish: post.status === "published",
    });
    setErr(null);
    setSuccess(null);

    // Fetch full post body by slug
    if (post.slug) {
      try {
        const res = await fetch(`${API_BASE}/v1/blog/posts/${post.slug}`, {
          headers: { "x-tenant-id": activeTenantId ?? "" },
        });
        const json = await res.json();
        if (json.ok && json.post?.body) {
          setForm((f) => ({ ...f, body: json.post.body }));
        }
      } catch { /* non-fatal */ }
    }
  }

  async function handlePublish() {
    if (!form.title.trim()) { setErr("Title is required."); return; }
    if (!form.body.trim()) { setErr("Body is required."); return; }
    if (!activeTenantId) { setErr("Select a business first."); return; }

    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/v1/blog/posts`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          excerpt: form.excerpt,
          body: form.body,
          featuredImageUrl: form.featuredImageUrl || undefined,
          publish: form.publish,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "publish_failed");

      setSuccess(form.publish ? "Post published!" : "Draft saved!");
      resetForm();
      void load();
    } catch (e: any) {
      setErr(e?.message || "publish_failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!selectedPost?.id || !activeTenantId) return;
    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/v1/blog/posts/${selectedPost.id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          excerpt: form.excerpt,
          body: form.body || undefined,
          featuredImageUrl: form.featuredImageUrl || undefined,
          publish: form.publish,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "update_failed");
      setSuccess("Post updated!");
      resetForm();
      void load();
    } catch (e: any) {
      setErr(e?.message || "update_failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(postId: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!activeTenantId) return;
    try {
      const res = await fetch(`${API_BASE}/v1/blog/posts/${postId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "delete_failed");
      }
      if (selectedPost?.id === postId) resetForm();
      void load();
    } catch (e: any) {
      setErr(e?.message || "delete_failed");
    }
  }

  const charCount = form.body.length;
  const wordCount = form.body.trim() ? form.body.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Blog Studio
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Write and publish posts directly — stored in your Atlas KB</p>
        </div>
        <div className="flex items-center gap-2">
          {!activeTenantId && (
            <span className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-1">
              Select a business to publish
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="border-cyan-500/20"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open("/#/blog", "_blank", "noopener,noreferrer")}
            className="border-cyan-500/20"
          >
            <Globe className="w-3 h-3 mr-1.5" />
            View Blog
          </Button>
          <Button
            size="sm"
            onClick={resetForm}
            className="bg-cyan-500 hover:bg-cyan-400"
          >
            <Plus className="w-3 h-3 mr-1.5" />
            New Post
          </Button>
        </div>
      </div>

      {/* Main two-pane layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Compose ───────────────────────────────── */}
        <div className="flex flex-col w-[55%] border-r border-cyan-500/20 overflow-auto p-6 space-y-4">
          {/* Banners */}
          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
              <span>✓</span> {success}
            </div>
          )}
          {err && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
              {err}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Title *</label>
            <input
              className={`${inputCls} text-base font-semibold`}
              placeholder="Post title…"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* Category + Publish row */}
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-slate-400">Category</label>
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-slate-400">Excerpt (optional)</label>
              <input
                className={inputCls}
                placeholder="1–2 sentence summary…"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />
            </div>
          </div>

          {/* Featured Image */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">
              <Image className="w-3 h-3 inline mr-1" />
              Featured Image (optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="Paste image URL or click Upload…"
                value={form.featuredImageUrl}
                onChange={(e) => setForm((f) => ({ ...f, featuredImageUrl: e.target.value }))}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="blog-featured-upload"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !activeTenantId) return;
                  const fd = new FormData();
                  fd.append("file", file);
                  try {
                    // Upload to Supabase via /v1/files/upload
                    const res = await fetch(`${API_BASE}/v1/files/upload`, {
                      method: "POST",
                      headers: { "x-tenant-id": activeTenantId },
                      body: fd,
                    });
                    const json = await res.json();
                    if (!json.ok || !json.file?.path) return;

                    // Get a signed URL for the uploaded file
                    const urlRes = await fetch(
                      `${API_BASE}/v1/files/url?path=${encodeURIComponent(json.file.path)}`,
                      { headers: { "x-tenant-id": activeTenantId } }
                    );
                    const urlJson = await urlRes.json();
                    if (urlJson.url) setForm((f) => ({ ...f, featuredImageUrl: urlJson.url }));
                  } catch { /* non-fatal */ }
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById("blog-featured-upload")?.click()}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors border border-cyan-500/20"
                title="Upload image"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              {form.featuredImageUrl && (
                <button
                  onClick={() => setForm((f) => ({ ...f, featuredImageUrl: "" }))}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Remove image"
                >
                  <XIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
            {form.featuredImageUrl && (
              <div className="mt-2 rounded-lg border border-cyan-500/20 overflow-hidden bg-slate-950/40">
                <img
                  src={form.featuredImageUrl}
                  alt="Featured preview"
                  className="max-h-40 w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-400">Body (Markdown) *</label>
            <textarea
              className={`${inputCls} min-h-[300px] resize-y font-mono text-xs leading-relaxed`}
              placeholder={`# ${form.title || "Post Title"}\n\nWrite your post here in Markdown...\n\n## Section\n\nParagraph text.`}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
            <div className="text-xs text-slate-600 text-right">
              {wordCount} words · {charCount} chars
            </div>
          </div>

          {/* Publish toggle + buttons */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => setForm((f) => ({ ...f, publish: e.target.checked }))}
                className="accent-cyan-500 w-4 h-4"
              />
              Publish immediately
            </label>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={resetForm}
              className="border-cyan-500/20"
              disabled={saving}
            >
              Clear
            </Button>
            {selectedPost?.id ? (
              <Button
                onClick={handleUpdate}
                disabled={saving || !form.title.trim()}
                className="bg-cyan-500 hover:bg-cyan-400 min-w-[120px]"
              >
                <PenLine className="w-4 h-4 mr-2" />
                {saving ? "Saving…" : "Update Post"}
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={saving || !form.title.trim() || !form.body.trim()}
                className="bg-cyan-500 hover:bg-cyan-400 min-w-[120px]"
              >
                <Send className="w-4 h-4 mr-2" />
                {saving
                  ? "Publishing…"
                  : form.publish
                  ? "Publish Post"
                  : "Save Draft"}
              </Button>
            )}
          </div>
        </div>

        {/* ── Right: Posts list ────────────────────────────── */}
        <div className="flex flex-col w-[45%] overflow-hidden">
          <div className="px-5 py-4 border-b border-cyan-500/10 flex items-center justify-between flex-shrink-0">
            <span className="text-sm font-semibold text-white">
              Published Posts
              {posts.length > 0 && (
                <span className="ml-2 text-xs text-slate-500 font-normal">({posts.length})</span>
              )}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Loading posts…
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <FileText className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No posts yet.</p>
                <p className="text-xs mt-1">Write and publish your first post on the left.</p>
              </div>
            ) : (
              posts.map((p, idx) => (
                <div
                  key={p.id ?? idx}
                  onClick={() => loadPostIntoEditor(p)}
                  className={`group flex items-start justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedPost?.id === p.id
                      ? "border-cyan-500/40 bg-cyan-500/10"
                      : "border-cyan-500/10 bg-slate-950/40 hover:border-cyan-500/20 hover:bg-slate-900/60"
                  }`}
                >
                  {p.featuredImageUrl && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-cyan-500/10">
                      <img src={p.featuredImageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <PenLine className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <span className="font-semibold text-sm text-slate-200 truncate">
                        {p.title || p.slug || "Untitled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.category && (
                        <Badge className="text-[10px] bg-slate-800 text-slate-400 border-0 px-2 py-0">
                          {p.category}
                        </Badge>
                      )}
                      {p.status && (
                        <Badge
                          className={`text-[10px] border-0 px-2 py-0 ${
                            p.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {p.status}
                        </Badge>
                      )}
                      {p.date && (
                        <span className="text-[10px] text-slate-600">{p.date}</span>
                      )}
                    </div>
                    {p.excerpt && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.excerpt}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); loadPostIntoEditor(p); }}
                      className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Edit post"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                    {p.slug && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/#/blog/${p.slug}`, "_blank", "noopener,noreferrer");
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Open post"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {p.id && (
                      <button
                        onClick={(e) => handleDelete(p.id!, e)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
