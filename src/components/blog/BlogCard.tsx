import React from "react";
import { Link } from "react-router-dom";
import type { BlogPost } from "../../lib/blog/types";
import { isDefaultCover, categoryGradient, categoryInitial } from "../../lib/blog/categoryGradient";

export default function BlogCard({
  post,
  variant = "grid",
}: {
  post: BlogPost;
  variant?: "grid" | "list";
}) {
  const fm = post.frontmatter;

  const base =
    "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md";

  if (variant === "list") {
    return (
      <Link to={`/blog/${post.slug}`} className={base}>
        <div className="flex gap-4 p-4">
          <div className="h-20 w-28 flex-none overflow-hidden rounded-xl bg-slate-100">
            {isDefaultCover(fm.coverImage) ? (
              <div
                className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/80"
                style={{ background: categoryGradient(fm.category) }}
              >
                {categoryInitial(fm.category)}
              </div>
            ) : (
              <img
                src={fm.coverImage}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold text-slate-800">{fm.category}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">{new Date(fm.date).toLocaleDateString()}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{post.readingMinutes} min</span>
            </div>
            <div className="mt-1 line-clamp-2 text-base font-bold text-slate-800">
              {fm.title}
            </div>
            {fm.excerpt ? (
              <div className="mt-1 line-clamp-2 text-base text-slate-700">
                {fm.excerpt}
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/blog/${post.slug}`} className={base}>
      <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {isDefaultCover(fm.coverImage) ? (
          <div
            className="flex h-full w-full items-center justify-center text-5xl font-bold text-white/80"
            style={{ background: categoryGradient(fm.category) }}
          >
            {categoryInitial(fm.category)}
          </div>
        ) : (
          <img
            src={fm.coverImage}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold text-slate-800">{fm.category}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">{new Date(fm.date).toLocaleDateString()}</span>
        </div>
        <div className="mt-2 line-clamp-2 text-base font-bold text-slate-800">
          {fm.title}
        </div>
        {fm.excerpt ? (
          <div className="mt-2 line-clamp-2 text-base text-slate-700">
            {fm.excerpt}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
