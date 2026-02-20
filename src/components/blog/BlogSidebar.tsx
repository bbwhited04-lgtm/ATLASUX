import React from "react";
import { Link } from "react-router-dom";
import type { BlogPost } from "../../lib/blog/types";

function SidebarItem({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md"
    >
      <div className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-slate-100">
        <img
          src={post.frontmatter.coverImage}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-800 line-clamp-2">
          {post.frontmatter.title}
        </div>
        <div className="mt-1 text-sm text-slate-500">
          {new Date(post.frontmatter.date).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}

export default function BlogSidebar({
  editorsChoice,
  latest,
  categories,
}: {
  editorsChoice: BlogPost[];
  latest: BlogPost[];
  categories: string[];
}) {
  return (
    <aside className="space-y-6">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-slate-900" />
          <h3 className="text-base font-bold text-slate-800">Editor’s choice</h3>
        </div>
        <div className="space-y-3">
          {editorsChoice.slice(0, 4).map((p) => (
            <SidebarItem key={p.slug} post={p} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-slate-900" />
          <h3 className="text-base font-bold text-slate-800">Latest</h3>
        </div>
        <div className="space-y-3">
          {latest.slice(0, 4).map((p) => (
            <SidebarItem key={p.slug} post={p} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-slate-900" />
          <h3 className="text-base font-bold text-slate-800">Categories</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c}
              to={`/blog/category/${encodeURIComponent(c)}`}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
}
