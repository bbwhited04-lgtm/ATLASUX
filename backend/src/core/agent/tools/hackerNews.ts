/**
 * HackerNews Search — Algolia HN Search API (public, no key needed).
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const HN_API = "https://hn.algolia.com/api/v1/search";

export const hackerNewsTool: ToolDefinition = {
  key:  "hackerNews",
  name: "HackerNews Search",
  patterns: [
    /hacker\s*news/i,
    /\bhn\b/i,
    /tech\s*news/i,
    /startup\s*news/i,
  ],
  async execute(ctx) {
    try {
      const searchTerms = ctx.query
        .replace(/(?:search|find|look\s*up|check)\s+(?:on\s+)?(?:hacker\s*news|hn)\s*(?:for|about)?\s*/i, "")
        .trim() || ctx.query;

      const url = `${HN_API}?query=${encodeURIComponent(searchTerms)}&tags=story&hitsPerPage=8`;
      const res = await fetch(url);
      if (!res.ok) return makeResult("hacker_news_search", `HN API returned ${res.status}`);

      const json = await res.json() as { hits: Array<{ title: string; points: number; author: string; created_at: string; url: string; objectID: string }> };
      const hits = json.hits ?? [];
      if (!hits.length) return makeResult("hacker_news_search", `No HackerNews stories found for: ${searchTerms}`);

      const lines = hits.map((h, i) => {
        const date = new Date(h.created_at).toLocaleDateString();
        const link = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
        return `${i + 1}. ${h.title} (${h.points} pts, ${h.author}, ${date})\n   ${link}`;
      });

      return makeResult("hacker_news_search", `HackerNews results for "${searchTerms}":\n${lines.join("\n")}`);
    } catch (err) {
      return makeError("hacker_news_search", err);
    }
  },
};
