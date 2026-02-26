import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import PublicHeader from "../../components/public/PublicHeader";
import BlogCard from "../../components/blog/BlogCard";
import BlogSidebar from "../../components/blog/BlogSidebar";
import { getCategories, loadAllBlogPosts, loadApiPosts } from "../../lib/blog/loadPosts";
import type { BlogPost } from "../../lib/blog/types";

export default function BlogCategory() {
  const { category } = useParams();
  const staticPosts = useMemo(() => loadAllBlogPosts(), []);
  const [apiPosts, setApiPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    loadApiPosts().then((fetched) => {
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

  if (!category) return <Navigate to="/blog" replace />;
  const decoded = decodeURIComponent(category);

  const filtered = posts.filter((p) => p.frontmatter.category === decoded);
  if (filtered.length === 0) return <Navigate to="/blog" replace />;

  const editorsChoice = posts.filter((p) => p.frontmatter.featured).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-sm text-slate-400">
          <Link to="/blog" className="font-semibold text-slate-300 hover:underline">
            Blog
          </Link>
          <span className="mx-2 text-slate-600">/</span>
          <span className="font-semibold text-slate-300">{decoded}</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{decoded}</h1>
            <p className="mt-1 text-base text-slate-400">
              {filtered.length} post{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <BlogSidebar
              editorsChoice={editorsChoice.length ? editorsChoice : posts.slice(0, 4)}
              latest={posts}
              categories={categories}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-cyan-500/20 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} ATLAS UX
        </div>
      </footer>
    </div>
  );
}
