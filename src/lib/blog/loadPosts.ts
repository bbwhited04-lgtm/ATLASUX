import type { BlogFrontmatter, BlogPost } from "./types";

function safeParseYamlLike(frontmatterRaw: string): Partial<BlogFrontmatter> {
  // Minimal YAML-ish parser for key: value and tags: [a, b]
  const out: any = {};
  const lines = frontmatterRaw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key === "tags") {
      // tags: ["a", "b"] OR tags: [a, b]
      const m = value.match(/^\[(.*)\]$/);
      if (m) {
        const inside = m[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s.replace(/^['\"]|['\"]$/g, ""));
        out.tags = inside;
      } else {
        out.tags = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      continue;
    }

    if (key === "featured") {
      out.featured = value === "true";
      continue;
    }

    out[key] = value;
  }

  return out;
}

function parseMarkdownWithFrontmatter(raw: string): {
  fm: Partial<BlogFrontmatter>;
  body: string;
} {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    return { fm: {}, body: raw };
  }

  const parts = trimmed.split(/\r?\n---\r?\n/);
  // parts[0] begins with ---
  const first = parts[0].replace(/^---\r?\n/, "");
  const body = parts.slice(1).join("\n---\n");
  return { fm: safeParseYamlLike(first), body: body.trim() };
}

function estimateReadingMinutes(text: string): number {
  const words = text
    .replace(/`[\s\S]*?`/g, " ")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function slugFromPath(path: string): string {
  const file = path.split("/").pop() || path;
  return file.replace(/\.mdx?$/i, "");
}

function normalizeFrontmatter(slug: string, fm: Partial<BlogFrontmatter>): BlogFrontmatter {
  const title = fm.title || slug.replace(/[-_]/g, " ");
  const date = fm.date || new Date().toISOString().slice(0, 10);
  const category = fm.category || "Updates";
  const tags = Array.isArray(fm.tags) ? fm.tags : [];
  const excerpt = fm.excerpt || "";
  const coverImage = fm.coverImage || "/blog/covers/default.png";
  const featured = !!fm.featured;
  const author = fm.author || "ATLAS";

  return { title, date, category, tags, excerpt, coverImage, featured, author };
}

export function loadAllBlogPosts(): BlogPost[] {
  // Vite raw import
  const modules = import.meta.glob("../../content/blog/*.md", {
    as: "raw",
    eager: true,
  }) as Record<string, string>;

  const posts: BlogPost[] = Object.entries(modules).map(([path, raw]) => {
    const slug = slugFromPath(path);
    const { fm, body } = parseMarkdownWithFrontmatter(raw);
    const frontmatter = normalizeFrontmatter(slug, fm);
    return {
      slug,
      frontmatter,
      body,
      readingMinutes: estimateReadingMinutes(body),
    };
  });

  // Newest first by date (fallback to slug)
  posts.sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return loadAllBlogPosts().find((p) => p.slug === slug);
}

export function getCategories(posts: BlogPost[]): string[] {
  return Array.from(new Set(posts.map((p) => p.frontmatter.category))).sort();
}
