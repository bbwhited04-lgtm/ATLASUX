import { useEffect, useMemo, useState } from "react";
import { Plus, ExternalLink, Send, RefreshCw, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { API_BASE } from "@/lib/api";
import { getOrgUser } from "@/lib/org";

type BlogPost = {
  id?: string;
  slug?: string;
  title?: string;
  category?: string;
  excerpt?: string;
  date?: string;
  status?: string;
};

export function BlogManager() {
  const { org_id } = useMemo(() => getOrgUser(), []);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "Updates",
    body: "",
    publish: true,
  });

  function getHeaders() {
    const tenantId = localStorage.getItem("atlasux_tenant_id") || org_id;
    return { "Content-Type": "application/json", "x-tenant-id": tenantId };
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const tenantId = localStorage.getItem("atlasux_tenant_id") || org_id;
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
  }, []);

  async function handlePublish() {
    if (!form.title.trim()) { setErr("Title is required"); return; }
    if (!form.body.trim()) { setErr("Body is required"); return; }

    setSaving(true);
    setErr(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/v1/blog/posts`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "publish_failed");

      setSuccess(`Post published (ID: ${data.id})`);
      setForm({ title: "", category: "Updates", body: "", publish: true });
      setShowEditor(false);
      void load();
    } catch (e: any) {
      setErr(e?.message || "publish_failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog Publisher</h1>
          <div className="text-sm text-slate-400 mt-1">
            Write and publish posts directly — they are stored in your Atlas KB.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="border-cyan-500/20">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowEditor(!showEditor)} className="bg-cyan-500 hover:bg-cyan-400">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Success / Error banners */}
      {success && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          {success}
        </div>
      )}
      {err && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          {err}
        </div>
      )}

      {/* Inline Editor */}
      {showEditor && (
        <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">New Blog Post</h2>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Title *</label>
            <input
              className="w-full bg-slate-950/60 border border-cyan-500/20 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Post title..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Category</label>
            <input
              className="w-full bg-slate-950/60 border border-cyan-500/20 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="e.g. Updates, Announcements, Tech..."
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">Body (Markdown) *</label>
            <textarea
              className="w-full min-h-[200px] bg-slate-950/60 border border-cyan-500/20 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-y font-mono"
              placeholder="# My Post Title&#10;&#10;Write your post here in Markdown..."
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => setForm((f) => ({ ...f, publish: e.target.checked }))}
                className="accent-cyan-500"
              />
              Publish immediately
            </label>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setShowEditor(false)} className="border-cyan-500/20">
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={saving || !form.title.trim() || !form.body.trim()}
              className="bg-cyan-500 hover:bg-cyan-400"
            >
              <Send className="w-4 h-4 mr-2" />
              {saving ? "Publishing..." : form.publish ? "Publish Post" : "Save Draft"}
            </Button>
          </div>
        </Card>
      )}

      {/* Posts List */}
      <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5">
        <div className="text-sm font-semibold mb-4">
          Published Posts {posts.length > 0 && <span className="text-slate-400 font-normal">({posts.length})</span>}
        </div>
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <FileText className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No posts yet. Create your first post above.</p>
            </div>
          ) : (
            posts.map((p, idx) => (
              <div
                key={p.id ?? idx}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-950/40 border border-cyan-500/10"
              >
                <div>
                  <div className="font-semibold text-sm">{p.title || p.slug || "Untitled"}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {p.category || ""}
                    {p.date ? ` • ${p.date}` : ""}
                    {p.status ? ` • ${p.status}` : ""}
                  </div>
                  {p.excerpt && (
                    <div className="text-xs text-slate-500 mt-1 line-clamp-1">{p.excerpt}</div>
                  )}
                </div>
                {p.slug && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/#/blog/${p.slug}`, "_blank", "noopener,noreferrer")}
                    className="border-cyan-500/20 flex-shrink-0"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
