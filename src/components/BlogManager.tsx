import { useEffect, useMemo, useState } from "react";
import { Plus, Copy, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { API_BASE } from "@/lib/api";
import { getOrgUser } from "@/lib/org";

// Lightweight in-app blog publisher for alpha.
// For now we treat posts as a backend-owned surface and provide a draft creator.

type BlogPost = {
  slug?: string;
  title?: string;
  category?: string;
  excerpt?: string;
  date?: string;
};

const DRAFT_TEMPLATE = `---\ntitle: "New Post"\ncategory: "Updates"\ndate: "${new Date().toISOString().slice(0, 10)}"\nexcerpt: ""\n---\n\n# New Post\n\nWrite your post here.\n\n## What changed\n- \n\n## Why it matters\n- \n\n## Next\n- \n`;

export function BlogManager() {
  const { org_id, user_id } = useMemo(() => getOrgUser(), []);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // If the backend doesn't have a posts API yet, fall back to empty.
      const res = await fetch(`${API_BASE}/v1/blog/posts?org_id=${encodeURIComponent(org_id)}&user_id=${encodeURIComponent(user_id)}`);
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

  async function copyDraft() {
    await navigator.clipboard.writeText(DRAFT_TEMPLATE);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog Publisher</h1>
          <div className="text-sm text-slate-400 mt-1">
            Create a draft, paste it into your repo under <span className="font-mono">src/content/blog/</span>, then push.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={copyDraft}>
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied" : "Copy Draft Template"}
          </Button>
          <Button onClick={() => window.open("/#/blog", "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Public Blog
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Existing posts</div>
          <Button variant="ghost" onClick={load} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        {err && <div className="mt-2 text-xs text-amber-300">{err}</div>}
        <div className="mt-4 space-y-3">
          {posts.length === 0 ? (
            <div className="text-sm text-slate-400">No posts returned by API yet (alpha). Use the draft template above.</div>
          ) : (
            posts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-950/40 border border-cyan-500/10">
                <div>
                  <div className="font-semibold">{p.title || p.slug || "Untitled"}</div>
                  <div className="text-xs text-slate-400">{p.category || ""} {p.date ? `• ${p.date}` : ""}</div>
                </div>
                {p.slug && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/#/blog/${p.slug}`, "_blank", "noopener,noreferrer")}
                  >
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
