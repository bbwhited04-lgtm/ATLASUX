/**
 * Composio Search — routes to 23 sub-tool endpoints via a single integration.
 *
 * API: POST https://api.composio.dev/api/v3/tools/execute/{slug}
 * Auth: COMPOSIO_API_KEY env var
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const COMPOSIO_BASE = "https://api.composio.dev/api/v3/tools/execute";

type SubTool = {
  slug:     string;
  patterns: RegExp[];
};

const SUB_TOOLS: SubTool[] = [
  { slug: "AMAZON_PRODUCT_SEARCH",    patterns: [/amazon/i, /product\s*search/i] },
  { slug: "DUCKDUCKGO_SEARCH",        patterns: [/duckduckgo/i, /ddg/i] },
  { slug: "GOOGLE_EVENTS_SEARCH",     patterns: [/google\s*events?/i, /event\s*search/i, /events?\s*near/i] },
  { slug: "EXA_ANSWER_SEARCH",        patterns: [/exa\s*answer/i, /exa\s*search/i] },
  { slug: "SIMILAR_LINKS_SEARCH",     patterns: [/similar\s*(?:links?|pages?|sites?)/i] },
  { slug: "FINANCE_SEARCH",           patterns: [/stock/i, /market/i, /ticker/i, /finance/i, /financial/i] },
  { slug: "GOOGLE_MAPS_SEARCH",       patterns: [/(?:google\s*)?maps?/i, /location/i, /directions?/i, /places?\s*near/i] },
  { slug: "HOTEL_SEARCH",             patterns: [/hotel/i, /resort/i, /accommodation/i, /lodging/i] },
  { slug: "NEWS_SEARCH",              patterns: [/\bnews\b/i, /headline/i, /current\s*events?/i] },
  { slug: "NPI_REGISTRY_LOOKUP",      patterns: [/npi/i, /national\s*provider/i, /doctor\s*(?:lookup|search|find)/i] },
  { slug: "SCHOLAR_SEARCH",           patterns: [/scholar/i, /academic\s*search/i, /citation/i] },
  { slug: "EDGAR_FILINGS_SEARCH",     patterns: [/edgar/i, /sec\s*filing/i, /10-?k/i, /10-?q/i, /annual\s*report/i] },
  { slug: "LLM_SEARCH",              patterns: [/llm\s*search/i, /ai\s*search/i] },
  { slug: "SHOPPING_SEARCH",          patterns: [/shopping/i, /buy\s/i, /price\s*compare/i, /deal/i] },
  { slug: "TRENDS_SEARCH",            patterns: [/trend/i, /trending/i, /popular/i] },
  { slug: "TRIPADVISOR_SEARCH",       patterns: [/tripadvisor/i, /trip\s*advisor/i, /travel\s*review/i] },
  { slug: "WALMART_PRODUCT_SEARCH",   patterns: [/walmart/i] },
  { slug: "WEB_SEARCH",              patterns: [/web\s*search/i, /search\s*(?:the\s*)?web/i] },
];

function pickSubTool(query: string): string {
  for (const st of SUB_TOOLS) {
    if (st.patterns.some(p => p.test(query))) return st.slug;
  }
  return "WEB_SEARCH"; // fallback
}

async function callComposio(slug: string, query: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) return { ok: false, error: "COMPOSIO_API_KEY not configured" };

  const res = await fetch(`${COMPOSIO_BASE}/${slug}`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "x-api-key":     apiKey,
    },
    body: JSON.stringify({ input: { query } }),
  });

  if (!res.ok) return { ok: false, error: `Composio API returned ${res.status}` };

  const json = await res.json();
  return { ok: true, data: json };
}

export const composioSearchTool: ToolDefinition = {
  key:  "composio",
  name: "Composio Search",
  patterns: [
    /composio/i,
    /search\s+for\b/i,
    /find\s+(?:product|hotel|stock|news|paper|map|flight|deal|doctor)/i,
    /look\s*up\s+(?:stock|ticker|edgar|npi|doctor|hotel)/i,
  ],
  async execute(ctx) {
    try {
      const slug = pickSubTool(ctx.query);
      const searchTerms = ctx.query
        .replace(/(?:search|find|look\s*up)\s+(?:on\s+)?composio\s*(?:for|about)?\s*/i, "")
        .trim() || ctx.query;

      const result = await callComposio(slug, searchTerms);

      if (!result.ok) {
        return makeResult("composio_search", `Composio ${slug}: ${result.error}`);
      }

      // Composio returns varied formats — serialize top-level data
      const dataStr = typeof result.data === "string"
        ? result.data
        : JSON.stringify(result.data, null, 2).slice(0, 3000);

      return makeResult(
        "composio_search",
        `Composio ${slug.toLowerCase().replace(/_/g, " ")} results:\n${dataStr}`,
      );
    } catch (err) {
      return makeError("composio_search", err);
    }
  },
};
