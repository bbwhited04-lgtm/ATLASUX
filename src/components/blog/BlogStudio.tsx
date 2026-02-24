import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { loadAllBlogPosts } from "../../lib/blog/loadPosts";

function slugify(v: string) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mdTemplate(args: { title: string; category: string; excerpt: string }) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const date = `${yyyy}-${mm}-${dd}`;
  const slug = slugify(args.title) || "new-post";
  return {
    filename: `${date}-${slug}.md`,
    markdown: `---\n` +
      `title: "${args.title || "Untitled"}"\n` +
      `date: "${date}"\n` +
      `category: "${args.category || "Updates"}"\n` +
      `excerpt: "${(args.excerpt || "").replace(/\n/g, " ").trim()}"\n` +
      `featured: false\n` +
      `---\n\n` +
      `# ${args.title || "Untitled"}\n\n` +
      `Write the post here. Keep it practical, safe, and useful.\n`,
  };
}

export function BlogStudio() {
  const nav = useNavigate();
  const posts = React.useMemo(() => loadAllBlogPosts(), []);

  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Governance");
  const [excerpt, setExcerpt] = React.useState("");

  const template = React.useMemo(() => mdTemplate({ title, category, excerpt }), [title, category, excerpt]);

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(template.markdown);
      toast.success("Markdown copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  function downloadTemplate() {
    const blob = new Blob([template.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = template.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Blog Studio</h1>
          <div className="mt-1 text-sm text-slate-300/80 max-w-2xl">
            In alpha, posts are static markdown files (so bots can read them without logging into /#/app).
            Use this page to generate a new post file, then commit it under <span className="font-mono">src/content/blog/</span>.
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => nav("/blog")}>
            View public blog
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-slate-900/50 border-cyan-500/20 p-5">
          <div className="text-sm font-semibold text-slate-100">Create a new post</div>
          <div className="mt-3 grid gap-3">
            <div>
              <div className="text-xs text-slate-400 mb-1">Title</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Governed Autonomy: Fast Without Drift" />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Category</div>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Governance" />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Excerpt</div>
              <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} placeholder="1–2 sentence summary…" />
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-slate-950/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">File name</div>
                  <div className="mt-0.5 font-mono text-sm text-slate-100">{template.filename}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={copyTemplate}>Copy</Button>
                  <Button onClick={downloadTemplate}>Download .md</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-500/20 p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-100">Existing posts</div>
            <div className="text-xs text-slate-400">{posts.length} total</div>
          </div>
          <div className="mt-3 space-y-2 max-h-[520px] overflow-auto pr-1">
            {posts.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => nav(`/blog/${p.slug}`)}
                className="w-full text-left rounded-xl border border-cyan-500/10 bg-slate-950/30 hover:bg-slate-950/50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-100 truncate">{p.frontmatter.title}</div>
                  <Badge className="bg-slate-800/60 border border-cyan-500/10 text-slate-200">{p.frontmatter.category}</Badge>
                </div>
                <div className="mt-1 text-xs text-slate-400 truncate">{p.frontmatter.excerpt}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-slate-900/50 border-cyan-500/20 p-5">
        <div className="text-sm font-semibold text-slate-100">How to publish</div>
        <ol className="mt-2 list-decimal pl-5 text-sm text-slate-300/80 space-y-1">
          <li>Create a post above (copy or download the markdown).</li>
          <li>Save it under <span className="font-mono">src/content/blog/</span>.</li>
          <li>Commit + push. The public blog will auto-index it on next deploy.</li>
        </ol>
      </Card>
    </div>
  );
}
