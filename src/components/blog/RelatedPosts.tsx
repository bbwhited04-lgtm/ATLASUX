import React, { useMemo } from "react";
import type { BlogPost } from "../../lib/blog/types";
import BlogCard from "./BlogCard";

export default function RelatedPosts({
  current,
  allPosts,
}: {
  current: BlogPost;
  allPosts: BlogPost[];
}) {
  const related = useMemo(() => {
    const tags = new Set(current.frontmatter.tags || []);
    const category = current.frontmatter.category;

    const scored = allPosts
      .filter((p) => p.slug !== current.slug)
      .map((p) => {
        let score = 0;
        if (p.frontmatter.category === category) score += 3;
        for (const t of p.frontmatter.tags || []) if (tags.has(t)) score += 1;
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.p);

    return scored;
  }, [current, allPosts]);

  if (related.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-base font-bold text-slate-800">Related</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {related.map((p) => (
          <BlogCard key={p.slug} post={p} />
        ))}
      </div>
    </section>
  );
}
