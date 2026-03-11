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

import { resolveCredential } from "../services/credentialResolver.js";

const OWNER_TENANT_ID = process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

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
  tenantId?: string,
): Promise<SearchResponse> {
  // Resolve keys per-tenant when tenantId is provided, otherwise fall back to env
  const [youKey, tavilyKey, serpKey] =
    await Promise.all([
        resolveCredential(tenantId || OWNER_TENANT_ID, "you_com"),
        resolveCredential(tenantId || OWNER_TENANT_ID, "tavily"),
        resolveCredential(tenantId || OWNER_TENANT_ID, "serp"),
      ]);

  const providers: Array<{
    name:   string;
    key:    string | undefined;
    search: (q: string, n: number, k: string) => Promise<WebSearchResult[]>;
  }> = [
    { name: "you.com",  key: youKey ?? undefined,    search: searchYouCom  },
    { name: "tavily",   key: tavilyKey ?? undefined,  search: searchTavily  },
    { name: "serpapi",   key: serpKey ?? undefined,    search: searchSerpApi },
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
  tenantId?: string,
): Promise<NewsDataResponse> {
  const apiKey = await resolveCredential(tenantId || OWNER_TENANT_ID, "newsdata");
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

// ── New York Times API — premium verified journalism ─────────────────────────

export type NYTArticle = {
  id:           string;
  headline:     string;
  snippet:      string;
  leadParagraph: string;
  abstract:     string;
  webUrl:       string;
  source:       string;
  section:      string;
  pubDate:      string;
  byline:       string;
  keywords:     string[];
  wordCount:    number;
};

export type NYTSearchResponse = {
  ok:       boolean;
  articles: NYTArticle[];
  total:    number;
  error?:   string;
};

/**
 * Search NYT Article Search API v2 for articles matching a query.
 * Returns up to 10 articles per call (NYT API limit).
 */
export async function searchNYT(
  query: string,
  opts: {
    beginDate?: string; // YYYYMMDD
    endDate?: string;   // YYYYMMDD
    sort?: "newest" | "oldest" | "relevance";
    section?: string;   // e.g. "Technology", "Business"
    page?: number;
  } = {},
  tenantId?: string,
): Promise<NYTSearchResponse> {
  const apiKey = await resolveCredential(tenantId || OWNER_TENANT_ID, "nyt");
  if (!apiKey) return { ok: false, articles: [], total: 0, error: "NYT_API_KEY not configured" };

  try {
    const params = new URLSearchParams({
      "api-key": apiKey,
      q: query,
      sort: opts.sort ?? "newest",
    });
    if (opts.beginDate) params.set("begin_date", opts.beginDate);
    if (opts.endDate) params.set("end_date", opts.endDate);
    if (opts.page !== undefined) params.set("page", String(opts.page));
    if (opts.section) params.set("fq", `section_name:("${opts.section}")`);

    const res = await fetch(`https://api.nytimes.com/svc/search/v2/articlesearch.json?${params}`, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, articles: [], total: 0, error: `NYT ${res.status}: ${text.slice(0, 200)}` };
    }

    const json = (await res.json()) as any;
    const docs = json?.response?.docs ?? [];
    const total = json?.response?.meta?.hits ?? 0;

    const articles: NYTArticle[] = docs.map((d: any) => ({
      id:            d._id ?? "",
      headline:      d.headline?.main ?? "",
      snippet:       d.snippet ?? "",
      leadParagraph: d.lead_paragraph ?? "",
      abstract:      d.abstract ?? "",
      webUrl:        d.web_url ?? "",
      source:        d.source ?? "The New York Times",
      section:       d.section_name ?? "",
      pubDate:       d.pub_date ?? "",
      byline:        d.byline?.original ?? "",
      keywords:      (d.keywords ?? []).map((k: any) => k.value).filter(Boolean),
      wordCount:     d.word_count ?? 0,
    }));

    return { ok: true, articles, total };
  } catch (err: any) {
    return { ok: false, articles: [], total: 0, error: err?.message ?? String(err) };
  }
}

/**
 * Fetch NYT Top Stories for a given section.
 * Sections: home, arts, automobiles, books/review, business, fashion,
 * food, health, insider, magazine, movies, nyregion, obituaries, opinion,
 * politics, realestate, science, sports, sundayreview, technology,
 * theater, t-magazine, travel, upshot, us, world
 */
export async function fetchNYTTopStories(
  section = "technology",
  tenantId?: string,
): Promise<{ ok: boolean; articles: Array<{ title: string; abstract: string; url: string; section: string; byline: string; publishedDate: string }>; error?: string }> {
  const apiKey = await resolveCredential(tenantId || OWNER_TENANT_ID, "nyt");
  if (!apiKey) return { ok: false, articles: [], error: "NYT_API_KEY not configured" };

  try {
    const res = await fetch(
      `https://api.nytimes.com/svc/topstories/v2/${encodeURIComponent(section)}.json?api-key=${apiKey}`,
      { signal: AbortSignal.timeout(15_000) },
    );

    if (!res.ok) {
      return { ok: false, articles: [], error: `NYT Top Stories ${res.status}` };
    }

    const json = (await res.json()) as any;
    const results = (json?.results ?? []).map((r: any) => ({
      title:         r.title ?? "",
      abstract:      r.abstract ?? "",
      url:           r.url ?? "",
      section:       r.section ?? section,
      byline:        r.byline ?? "",
      publishedDate: r.published_date ?? "",
    }));

    return { ok: true, articles: results };
  } catch (err: any) {
    return { ok: false, articles: [], error: err?.message ?? String(err) };
  }
}

// ── MediaStack API — global news aggregator ──────────────────────────────────

export type MediaStackArticle = {
  title:       string;
  description: string;
  url:         string;
  source:      string;
  author:      string;
  image:       string | null;
  category:    string;
  language:    string;
  country:     string;
  publishedAt: string;
};

export type MediaStackResponse = {
  ok:       boolean;
  articles: MediaStackArticle[];
  total:    number;
  error?:   string;
};

/**
 * Search MediaStack for live news articles.
 */
export async function searchMediaStack(
  keywords: string,
  opts: {
    categories?: string; // e.g. "technology,business"
    countries?: string;  // e.g. "us,gb"
    languages?: string;  // e.g. "en"
    sort?: "published_desc" | "published_asc" | "popularity";
    limit?: number;
  } = {},
  tenantId?: string,
): Promise<MediaStackResponse> {
  const apiKey = await resolveCredential(tenantId || OWNER_TENANT_ID, "mediastack");
  if (!apiKey) return { ok: false, articles: [], total: 0, error: "MEDIASTACK_API_KEY not configured" };

  try {
    const params = new URLSearchParams({
      access_key: apiKey,
      keywords,
      languages: opts.languages ?? "en",
      sort: opts.sort ?? "published_desc",
      limit: String(opts.limit ?? 10),
    });
    if (opts.categories) params.set("categories", opts.categories);
    if (opts.countries) params.set("countries", opts.countries);

    // MediaStack free tier requires http (not https)
    const res = await fetch(`http://api.mediastack.com/v1/news?${params}`, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { ok: false, articles: [], total: 0, error: `MediaStack ${res.status}` };
    }

    const json = (await res.json()) as any;
    if (json?.error) {
      return { ok: false, articles: [], total: 0, error: `MediaStack: ${json.error.message ?? json.error.code}` };
    }

    const total = json?.pagination?.total ?? 0;
    const articles: MediaStackArticle[] = (json?.data ?? []).map((a: any) => ({
      title:       a.title ?? "",
      description: a.description ?? "",
      url:         a.url ?? "",
      source:      a.source ?? "",
      author:      a.author ?? "",
      image:       a.image ?? null,
      category:    a.category ?? "",
      language:    a.language ?? "",
      country:     a.country ?? "",
      publishedAt: a.published_at ?? "",
    }));

    return { ok: true, articles, total };
  } catch (err: any) {
    return { ok: false, articles: [], total: 0, error: err?.message ?? String(err) };
  }
}
