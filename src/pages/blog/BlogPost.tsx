import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import Markdown from "../../components/blog/Markdown";

import PublicHeader from "../../components/public/PublicHeader";
import BlogSidebar from "../../components/blog/BlogSidebar";
import RelatedPosts from "../../components/blog/RelatedPosts";
import SEO from "../../components/SEO";
import { blogPostSchema, breadcrumbSchema } from "../../lib/seo/schemas";
import { getCategories, getPostBySlug, getApiPostBySlug, loadAllBlogPosts, loadApiPosts } from "../../lib/blog/loadPosts";
import type { BlogPost as BlogPostType } from "../../lib/blog/types";
import { isDefaultCover, categoryGradient, categoryInitial } from "../../lib/blog/categoryGradient";

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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <PublicHeader />
      <div className="text-slate-500 text-sm">Loading post...</div>
    </div>
  );
  if (!post) return <Navigate to="/blog" replace />;

  const fm = post.frontmatter;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <SEO
        title={fm.title}
        description={fm.excerpt}
        path={`blog/${post.slug}`}
        image={fm.coverImage.startsWith("http") ? fm.coverImage : undefined}
        type="article"
        schema={[
          blogPostSchema({ title: fm.title, slug: post.slug, date: fm.date, excerpt: fm.excerpt, coverImage: fm.coverImage, author: fm.author }),
          breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: fm.category, path: `/blog/category/${encodeURIComponent(fm.category)}` }, { name: fm.title, path: `/blog/${post.slug}` }]),
        ]}
      />
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-sm text-slate-400">
          <Link to="/blog" className="font-semibold text-slate-300 hover:underline">
            Blog
          </Link>
          <span className="mx-2 text-slate-600">/</span>
          <Link
            to={`/blog/category/${encodeURIComponent(fm.category)}`}
            className="font-semibold text-slate-300 hover:underline"
          >
            {fm.category}
          </Link>
        </div>

        <section className="mt-4 overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-900/50 shadow-sm">
          <div className="aspect-[21/9] w-full bg-slate-800">
            {isDefaultCover(fm.coverImage) ? (
              <div
                className="flex h-full w-full items-center justify-center text-8xl font-bold text-white/60"
                style={{ background: categoryGradient(fm.category) }}
              >
                {categoryInitial(fm.category)}
              </div>
            ) : (
              <img src={fm.coverImage} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 font-semibold text-cyan-400">
                {fm.category}
              </span>
              <span className="text-slate-500">{new Date(fm.date).toLocaleDateString()}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-500">{post.readingMinutes} min read</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white md:text-3xl">
              {fm.title}
            </h1>
            {fm.excerpt ? (
              <p className="mt-3 max-w-3xl text-base text-slate-400">{fm.excerpt}</p>
            ) : null}
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2">
            <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/50 p-6 shadow-sm md:p-8">
              <Markdown markdown={post.body} />

              <RelatedPosts current={post} allPosts={allPosts} />

              <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-slate-800/50 p-4 text-base text-slate-400">
                <div className="font-bold text-white">Need help?</div>
                <div className="mt-1">
                  Open the app and ask Atlas to turn this into a workflow.
                </div>
                <div className="mt-3">
                  <a
                    href="#/app"
                    className="inline-flex rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
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

      <footer className="border-t border-cyan-500/20 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} ATLAS UX &bull; Simple, safe, business-friendly
        </div>
      </footer>
    </div>
  );
}
