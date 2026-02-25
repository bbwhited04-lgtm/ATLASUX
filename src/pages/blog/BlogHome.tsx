import React, { useEffect, useMemo, useState } from "react";
import PublicHeader from "../../components/public/PublicHeader";
import BlogCard from "../../components/blog/BlogCard";
import BlogSidebar from "../../components/blog/BlogSidebar";
import { getCategories, loadAllBlogPosts, loadApiPosts } from "../../lib/blog/loadPosts";
import type { BlogPost } from "../../lib/blog/types";

export default function BlogHome() {
  const staticPosts = useMemo(() => loadAllBlogPosts(), []);
  const [apiPosts, setApiPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    loadApiPosts().then((fetched) => {
      // Deduplicate: API posts take precedence; skip slugs already in static
      const staticSlugs = new Set(staticPosts.map((p) => p.slug));
      setApiPosts(fetched.filter((p) => !staticSlugs.has(p.slug)));
    });
  }, [staticPosts]);

  const posts = useMemo(() => {
    const merged = [...apiPosts, ...staticPosts];
    merged.sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
    return merged;
  }, [apiPosts, staticPosts]);

  const categories = useMemo(() => getCategories(posts), [posts]);
  const featured = posts.filter((p) => p.frontmatter.featured).slice(0, 4);
  const hero = featured.length > 0 ? featured : posts.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Blog</h1>
            <p className="mt-1 max-w-2xl text-base text-slate-700">
              Practical updates, workflow playbooks, and real build logs — written to be
              simple, safe, and useful.
            </p>
          </div>
        </div>

        {/* Hero grid */}
        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {hero.map((p) => (
            <div key={p.slug} className="md:col-span-1">
              <BlogCard post={p} />
            </div>
          ))}
        </section>

        {/* Feed + sidebar */}
        <section className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Latest posts</h2>
              <div className="text-sm text-slate-500">{posts.length} total</div>
            </div>

            <div className="space-y-4">
              {posts.map((p) => (
                <BlogCard key={p.slug} post={p} variant="list" />
              ))}
            </div>

            {/* Guardrails note */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-base text-slate-700">
              <div className="font-bold text-slate-800">Safety & clarity</div>
              <div className="mt-1">
                Posts are written for everyday people. No dark patterns, no bait, and no
                hidden subscriptions.
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <BlogSidebar
              editorsChoice={hero}
              latest={posts}
              categories={categories}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
          © {new Date().getFullYear()} ATLAS UX • Built for governed automation
        </div>
      </footer>
    </div>
  );
}
