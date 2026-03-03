/**
 * Multi-provider web search router with automatic fallback.
 *
 * Provider priority: You.com → Tavily → SerpAPI
 * If provider 1 fails (HTTP error, no key, empty results), tries provider 2, then 3.
 *
 * Also includes:
 *   fetchUrlContent() — fetch a URL, strip HTML, return readable text
 *   searchReddit()    — Reddit public JSON API (no auth needed)
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type WebSearchResult = {
  title:   string;
  snippet: string;
  url:     string;
  source:  string;
};

export type SearchResponse = {
  ok:       boolean;
  query:    string;
  results:  WebSearchResult[];
  provider: string;
  error?:   string;
};

export type RedditPost = {
  title:     string;
  subreddit: string;
  score:     number;
  permalink: string;
  selftext:  string;
  author:    string;
  created:   number;
};

// ── Provider: You.com ────────────────────────────────────────────────────────

async function searchYouCom(
  query: string,
  count: number,
  apiKey: string,
): Promise<WebSearchResult[]> {
  const url = `https://api.ydc-index.io/search?query=${encodeURIComponent(query)}&count=${count}`;
  const res = await fetch(url, {
    headers: { "X-API-Key": apiKey },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`You.com ${res.status}: ${res.statusText}`);
  const json = (await res.json()) as any;
  const hits = json?.hits ?? [];
  return hits.slice(0, count).map((h: any) => ({
    title:   h.title ?? "",
    snippet: h.description ?? (h.snippets?.[0] ?? ""),
    url:     h.url ?? "",
    source:  "you.com",
  }));
}

// ── Provider: Tavily ─────────────────────────────────────────────────────────

async function searchTavily(
  query: string,
  maxResults: number,
  apiKey: string,
): Promise<WebSearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: "basic",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}: ${res.statusText}`);
  const json = (await res.json()) as any;
  const results = json?.results ?? [];
  return results.slice(0, maxResults).map((r: any) => ({
    title:   r.title ?? "",
    snippet: r.content ?? "",
    url:     r.url ?? "",
    source:  "tavily",
  }));
}

// ── Provider: SerpAPI ────────────────────────────────────────────────────────

async function searchSerpApi(
  query: string,
  num: number,
  apiKey: string,
): Promise<WebSearchResult[]> {
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=${num}&hl=en&gl=us`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`SerpAPI ${res.status}: ${res.statusText}`);
  const json = (await res.json()) as any;
  const results = json?.organic_results ?? [];
  return results.slice(0, num).map((r: any) => ({
    title:   r.title ?? "",
    snippet: r.snippet ?? "",
    url:     r.link ?? "",
    source:  "serpapi",
  }));
}

// ── Main search router ───────────────────────────────────────────────────────

/**
 * Search the web using multi-provider fallback: You.com → Tavily → SerpAPI.
 * Returns whichever provider succeeds first. If all fail, returns { ok: false }.
 */
export async function searchWeb(
  query: string,
  maxResults = 8,
): Promise<SearchResponse> {
  const providers: Array<{
    name:   string;
    key:    string | undefined;
    search: (q: string, n: number, k: string) => Promise<WebSearchResult[]>;
  }> = [
    { name: "you.com",  key: process.env.YOU_COM_API_KEY?.trim(),  search: searchYouCom  },
    { name: "tavily",   key: process.env.TAVILY_API_KEY?.trim(),   search: searchTavily  },
    { name: "serpapi",   key: process.env.SERP_API_KEY?.trim(),     search: searchSerpApi },
  ];

  const errors: string[] = [];

  for (const p of providers) {
    if (!p.key) {
      errors.push(`${p.name}: no API key`);
      continue;
    }
    try {
      const results = await p.search(query, maxResults, p.key);
      if (results.length === 0) {
        errors.push(`${p.name}: empty results`);
        continue;
      }
      return { ok: true, query, results, provider: p.name };
    } catch (err: any) {
      errors.push(`${p.name}: ${err?.message ?? String(err)}`);
    }
  }

  return {
    ok:       false,
    query,
    results:  [],
    provider: "none",
    error:    `All providers failed: ${errors.join("; ")}`,
  };
}

// ── URL content fetcher ──────────────────────────────────────────────────────

/**
 * Fetch a URL, strip HTML, return readable plain text (max 4,000 chars).
 */
export async function fetchUrlContent(
  url: string,
): Promise<{ ok: boolean; text: string; url: string; error?: string }> {
  try {
    const res = await fetch(url, {
      signal:  AbortSignal.timeout(10_000),
      headers: { "User-Agent": "AtlasUX/1.0" },
    });
    if (!res.ok) {
      return { ok: false, text: "", url, error: `HTTP ${res.status}` };
    }
    let html = await res.text();

    // Strip scripts, styles, all tags, decode entities
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
    html = html.replace(/<[^>]+>/g, " ");
    html = html.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    html = html.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ");
    html = html.replace(/\s+/g, " ").trim();

    return { ok: true, text: html.slice(0, 4000), url };
  } catch (err: any) {
    return { ok: false, text: "", url, error: err?.message ?? String(err) };
  }
}

// ── Reddit search ────────────────────────────────────────────────────────────

// ── NewsData.io — structured breaking news API ──────────────────────────────

export type NewsDataArticle = {
  article_id:  string;
  title:       string;
  description: string;
  content:     string;
  link:        string;
  source_id:   string;
  source_name: string;
  pubDate:     string;
  category:    string[];
  country:     string[];
  language:    string;
  image_url:   string | null;
  sentiment:   string | null;
};

export type NewsDataResponse = {
  ok:       boolean;
  articles: NewsDataArticle[];
  error?:   string;
};

/**
 * Search NewsData.io for breaking news articles.
 * Supports keyword search, category filtering, and timeframe limiting.
 */
export async function searchNewsData(
  query: string,
  opts: {
    category?: string;
    timeframe?: number; // hours (1-48)
    language?: string;
    size?: number;
    removeDuplicates?: boolean;
    priorityDomain?: "top" | "medium" | "low";
  } = {},
): Promise<NewsDataResponse> {
  const apiKey = process.env.NEWSDATA_API_KEY?.trim();
  if (!apiKey) return { ok: false, articles: [], error: "NEWSDATA_API_KEY not configured" };

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      q: query,
      language: opts.language ?? "en",
      removeduplicate: opts.removeDuplicates !== false ? "1" : "0",
    });
    if (opts.category) params.set("category", opts.category);
    if (opts.timeframe) params.set("timeframe", String(opts.timeframe));
    if (opts.size) params.set("size", String(Math.min(opts.size, 50)));
    if (opts.priorityDomain) params.set("prioritydomain", opts.priorityDomain);

    const res = await fetch(`https://newsdata.io/api/1/latest?${params}`, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, articles: [], error: `NewsData ${res.status}: ${text.slice(0, 200)}` };
    }

    const json = (await res.json()) as any;
    if (json?.status !== "success") {
      return { ok: false, articles: [], error: json?.results?.message ?? "Unknown NewsData error" };
    }

    const articles: NewsDataArticle[] = (json.results ?? []).map((a: any) => ({
      article_id:  a.article_id ?? "",
      title:       a.title ?? "",
      description: a.description ?? "",
      content:     (a.content ?? "").slice(0, 1000),
      link:        a.link ?? "",
      source_id:   a.source_id ?? "",
      source_name: a.source_name ?? "",
      pubDate:     a.pubDate ?? "",
      category:    Array.isArray(a.category) ? a.category : [],
      country:     Array.isArray(a.country) ? a.country : [],
      language:    a.language ?? "",
      image_url:   a.image_url ?? null,
      sentiment:   a.sentiment ?? null,
    }));

    return { ok: true, articles };
  } catch (err: any) {
    return { ok: false, articles: [], error: err?.message ?? String(err) };
  }
}

/**
 * Search Reddit's public JSON API (no auth needed).
 */
export async function searchReddit(
  query: string,
  limit = 10,
): Promise<{ ok: boolean; posts: RedditPost[]; error?: string }> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=${limit}&t=week`;
    const res = await fetch(url, {
      signal:  AbortSignal.timeout(10_000),
      headers: { "User-Agent": "AtlasUX/1.0" },
    });
    if (!res.ok) {
      return { ok: false, posts: [], error: `Reddit ${res.status}` };
    }
    const json = (await res.json()) as any;
    const children = json?.data?.children ?? [];
    const posts: RedditPost[] = children.map((c: any) => ({
      title:     c.data?.title ?? "",
      subreddit: c.data?.subreddit_name_prefixed ?? "",
      score:     c.data?.score ?? 0,
      permalink: `https://www.reddit.com${c.data?.permalink ?? ""}`,
      selftext:  (c.data?.selftext ?? "").slice(0, 300),
      author:    c.data?.author ?? "",
      created:   c.data?.created_utc ?? 0,
    }));
    return { ok: true, posts };
  } catch (err: any) {
    return { ok: false, posts: [], error: err?.message ?? String(err) };
  }
}
