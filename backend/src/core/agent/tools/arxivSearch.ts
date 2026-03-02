/**
 * ArXiv Search — ArXiv public API (Atom XML, no key needed).
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const ARXIV_API = "https://export.arxiv.org/api/query";

/** Minimal XML tag extractor — avoids adding an XML parser dependency */
function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

function extractAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) matches.push(m[1].trim());
  return matches;
}

export const arxivSearchTool: ToolDefinition = {
  key:  "arxiv",
  name: "ArXiv Search",
  patterns: [
    /arxiv/i,
    /research\s*paper/i,
    /preprint/i,
    /academic\s*paper/i,
    /scientific\s*paper/i,
  ],
  async execute(ctx) {
    try {
      const searchTerms = ctx.query
        .replace(/(?:search|find|look\s*up|check)\s+(?:on\s+)?(?:arxiv)\s*(?:for|about)?\s*/i, "")
        .trim() || ctx.query;

      const url = `${ARXIV_API}?search_query=all:${encodeURIComponent(searchTerms)}&start=0&max_results=5&sortBy=relevance`;
      const res = await fetch(url);
      if (!res.ok) return makeResult("arxiv_search", `ArXiv API returned ${res.status}`);

      const xml = await res.text();
      const entries = xml.split("<entry>").slice(1);

      if (!entries.length) return makeResult("arxiv_search", `No ArXiv papers found for: ${searchTerms}`);

      const lines = entries.map((entry, i) => {
        const title   = extractTag(entry, "title").replace(/\s+/g, " ");
        const summary = extractTag(entry, "summary").replace(/\s+/g, " ").slice(0, 200);
        const authors = extractAll(entry, "name").slice(0, 3).join(", ");
        const published = extractTag(entry, "published").slice(0, 10);
        const idTag   = extractTag(entry, "id");
        const arxivId = idTag.replace("http://arxiv.org/abs/", "").replace(/v\d+$/, "");

        return `${i + 1}. ${title}\n   Authors: ${authors}${entries.length > 3 ? "" : `\n   Abstract: ${summary}...`}\n   Published: ${published} | ID: ${arxivId}\n   https://arxiv.org/abs/${arxivId}`;
      });

      return makeResult("arxiv_search", `ArXiv results for "${searchTerms}":\n${lines.join("\n\n")}`);
    } catch (err) {
      return makeError("arxiv_search", err);
    }
  },
};
