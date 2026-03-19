/**
 * Support KB Routes — serves help center articles from kb/support/.
 *
 * Public (no auth required) — this is customer-facing documentation.
 *
 * GET /v1/support/categories        — list all categories with article counts
 * GET /v1/support/articles           — list all articles (optional ?q= search, ?category= filter)
 * GET /v1/support/articles/:category/:slug — get single article content
 */

import type { FastifyPluginAsync } from "fastify";
import { readdir, readFile } from "fs/promises";
import path from "path";

const KB_ROOT = path.join(process.cwd(), "src", "kb", "support");

// ── Types ────────────────────────────────────────────────────────────────────

type ArticleMeta = {
  slug: string;
  category: string;
  title: string;
  tags: string[];
  related: string[];
};

type ArticleFull = ArticleMeta & {
  content: string;
};

// ── Frontmatter parser ──────────────────────────────────────────────────────

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    // Parse arrays: ["a", "b"]
    if (val.startsWith("[")) {
      try { meta[key] = JSON.parse(val); } catch { meta[key] = val; }
    } else {
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    }
  }
  return { meta, content: match[2].trim() };
}

// ── Index builder ────────────────────────────────────────────────────────────

let _indexCache: { ts: number; articles: ArticleMeta[] } | null = null;
const CACHE_TTL = 60_000; // 1 minute

async function buildIndex(): Promise<ArticleMeta[]> {
  if (_indexCache && Date.now() - _indexCache.ts < CACHE_TTL) return _indexCache.articles;

  const articles: ArticleMeta[] = [];
  let categories: string[];
  try {
    categories = await readdir(KB_ROOT);
  } catch {
    return [];
  }

  for (const cat of categories) {
    const catPath = path.join(KB_ROOT, cat);
    let files: string[];
    try {
      files = (await readdir(catPath)).filter(f => f.endsWith(".md"));
    } catch { continue; }

    for (const file of files) {
      try {
        const raw = await readFile(path.join(catPath, file), "utf-8");
        const { meta } = parseFrontmatter(raw);
        articles.push({
          slug: file.replace(/\.md$/, ""),
          category: cat,
          title: String(meta.title ?? file.replace(/\.md$/, "").replace(/-/g, " ")),
          tags: Array.isArray(meta.tags) ? meta.tags as string[] : [],
          related: Array.isArray(meta.related) ? meta.related as string[] : [],
        });
      } catch { /* skip unreadable files */ }
    }
  }

  _indexCache = { ts: Date.now(), articles };
  return articles;
}

// ── Routes ──────────────────────────────────────────────────────────────────

const supportKbRoutes: FastifyPluginAsync = async (app) => {

  // List categories with article counts
  app.get("/categories", async () => {
    const articles = await buildIndex();
    const cats = new Map<string, number>();
    for (const a of articles) {
      cats.set(a.category, (cats.get(a.category) ?? 0) + 1);
    }
    return Array.from(cats.entries())
      .map(([name, count]) => ({
        name,
        label: name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  // List / search articles
  app.get<{ Querystring: { q?: string; category?: string } }>("/articles", async (req) => {
    let articles = await buildIndex();
    const { q, category } = req.query;

    if (category) {
      articles = articles.filter(a => a.category === category);
    }

    if (q) {
      const terms = q.toLowerCase().split(/\s+/);
      articles = articles.filter(a => {
        const haystack = `${a.title} ${a.tags.join(" ")} ${a.category}`.toLowerCase();
        return terms.every(t => haystack.includes(t));
      });
    }

    return articles;
  });

  // Get single article with full content
  app.get<{ Params: { category: string; slug: string } }>("/articles/:category/:slug", async (req, reply) => {
    const { category, slug } = req.params;

    // Sanitize path components
    if (/[^a-zA-Z0-9_-]/.test(category) || /[^a-zA-Z0-9_-]/.test(slug)) {
      return reply.status(400).send({ error: "Invalid category or slug" });
    }

    const filePath = path.join(KB_ROOT, category, `${slug}.md`);
    let raw: string;
    try {
      raw = await readFile(filePath, "utf-8");
    } catch {
      return reply.status(404).send({ error: "Article not found" });
    }

    const { meta, content } = parseFrontmatter(raw);
    const article: ArticleFull = {
      slug,
      category,
      title: String(meta.title ?? slug.replace(/-/g, " ")),
      tags: Array.isArray(meta.tags) ? meta.tags as string[] : [],
      related: Array.isArray(meta.related) ? meta.related as string[] : [],
      content,
    };

    return article;
  });

  // Full-text search across article content (deeper search)
  app.get<{ Querystring: { q: string } }>("/search", async (req) => {
    const { q } = req.query;
    if (!q || q.length < 2) return [];

    const articles = await buildIndex();
    const terms = q.toLowerCase().split(/\s+/);
    const results: (ArticleMeta & { snippet: string })[] = [];

    for (const a of articles) {
      const filePath = path.join(KB_ROOT, a.category, `${a.slug}.md`);
      let raw: string;
      try { raw = await readFile(filePath, "utf-8"); } catch { continue; }

      const { content } = parseFrontmatter(raw);
      const lower = `${a.title} ${content}`.toLowerCase();

      if (terms.every(t => lower.includes(t))) {
        // Extract snippet around first match
        const idx = lower.indexOf(terms[0]);
        const start = Math.max(0, idx - 60);
        const end = Math.min(content.length, idx + 120);
        const snippet = (start > 0 ? "..." : "") + content.slice(start, end).replace(/\n/g, " ") + (end < content.length ? "..." : "");

        results.push({ ...a, snippet });
      }
    }

    return results;
  });
};

export default supportKbRoutes;
