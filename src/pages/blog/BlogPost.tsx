import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import Markdown from "../../components/blog/Markdown";

import PublicHeader from "../../components/public/PublicHeader";
import BlogSidebar from "../../components/blog/BlogSidebar";
import RelatedPosts from "../../components/blog/RelatedPosts";
import { getCategories, getPostBySlug, getApiPostBySlug, loadAllBlogPosts, loadApiPosts } from "../../lib/blog/loadPosts";
import type { BlogPost as BlogPostType } from "../../lib/blog/types";

export default function BlogPost() {
  const { slug } = useParams();
  const staticPosts = useMemo(() => loadAllBlogPosts(), []);
  const staticPost = useMemo(() => (slug ? getPostBySlug(slug) : undefined), [slug]);
  const [post, setPost] = useState<BlogPostType | undefined>(staticPost);
  const [apiPosts, setApiPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(!staticPost);

  useEffect(() => {
    setPost(staticPost);
    if (!staticPost && slug) {
      setLoading(true);
      getApiPostBySlug(slug).then((p) => {
        setPost(p);
        setLoading(false);
      });
    }
    loadApiPosts().then((fetched) => {
      const staticSlugs = new Set(staticPosts.map((p) => p.slug));
      setApiPosts(fetched.filter((p) => !staticSlugs.has(p.slug)));
    });
  }, [slug, staticPost, staticPosts]);

  const allPosts = useMemo(() => {
    const merged = [...apiPosts, ...staticPosts];
    merged.sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
    return merged;
  }, [apiPosts, staticPosts]);

  const categories = useMemo(() => getCategories(allPosts), [allPosts]);
  const editorsChoice = allPosts.filter((p) => p.frontmatter.featured).slice(0, 4);

  if (!slug) return <Navigate to="/blog" replace />;
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <PublicHeader />
      <div className="text-slate-500 text-sm">Loading post…</div>
    </div>
  );
  if (!post) return <Navigate to="/blog" replace />;

  const fm = post.frontmatter;

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-sm text-slate-600">
          <Link to="/blog" className="font-semibold text-slate-700 hover:underline">
            Blog
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <Link
            to={`/blog/category/${encodeURIComponent(fm.category)}`}
            className="font-semibold text-slate-700 hover:underline"
          >
            {fm.category}
          </Link>
        </div>

        <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="aspect-[21/9] w-full bg-slate-100">
            <img src={fm.coverImage} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
                {fm.category}
              </span>
              <span className="text-slate-500">{new Date(fm.date).toLocaleDateString()}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{post.readingMinutes} min read</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-800 md:text-3xl">
              {fm.title}
            </h1>
            {fm.excerpt ? (
              <p className="mt-3 max-w-3xl text-base text-slate-700">{fm.excerpt}</p>
            ) : null}
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <Markdown markdown={post.body} />

              <RelatedPosts current={post} allPosts={allPosts} />

              <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-700">
                <div className="font-bold text-slate-800">Need help?</div>
                <div className="mt-1">
                  Open the app and ask Atlas to turn this into a workflow.
                </div>
                <div className="mt-3">
                  <a
                    href="#/app"
                    className="inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Open ATLAS UX
                  </a>
                </div>
              </div>
            </div>
          </article>

          <div className="lg:col-span-1">
            <BlogSidebar
              editorsChoice={editorsChoice.length ? editorsChoice : allPosts.slice(0, 4)}
              latest={allPosts}
              categories={categories}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
          © {new Date().getFullYear()} ATLAS UX • Simple, safe, business-friendly
        </div>
      </footer>
    </div>
  );
}
