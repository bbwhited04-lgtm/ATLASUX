/**
 * Apify Scraper — routes to 100+ Apify actors for web scraping,
 * social media extraction, lead gen, and data collection.
 *
 * Agents request scraping via natural language. The tool detects
 * the right Apify actor, runs it, waits for results, and returns
 * the extracted data.
 *
 * API: https://api.apify.com/v2
 * Auth: APIFY_API_KEY env var
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const APIFY_BASE = "https://api.apify.com/v2";

// ── Actor routing — maps query patterns to Apify actor IDs ──────────────────

type ActorRoute = {
  actor: string;
  patterns: RegExp[];
  /** Build actor input from the query */
  buildInput: (query: string) => Record<string, unknown>;
};

/** Extract URLs from query text */
function extractUrls(query: string): string[] {
  return (query.match(/https?:\/\/\S+/gi) ?? []).map(u => u.replace(/[.,;)]+$/, ""));
}

/** Extract a search term from common query patterns */
function extractSearchTerm(query: string): string {
  const m = query.match(/(?:search|scrape|find|get|extract|look up|lookup)\s+(?:for\s+)?["""]?(.+?)["""]?\s*(?:on|from|in|$)/i);
  return m?.[1]?.trim() ?? query.replace(/\b(?:scrape|search|find|get|extract|look up|lookup)\b/gi, "").trim();
}

const ACTOR_ROUTES: ActorRoute[] = [
  // ── Instagram ──
  {
    actor: "apify/instagram-scraper",
    patterns: [/instagram\s*(?:profile|account|user|page)/i, /\bIG\s*profile/i],
    buildInput: (q) => {
      const urls = extractUrls(q);
      const usernames = q.match(/@([\w.]+)/g)?.map(u => u.slice(1)) ?? [];
      return { directUrls: urls, search: usernames[0] ?? extractSearchTerm(q), resultsType: "posts", resultsLimit: 20 };
    },
  },
  {
    actor: "apify/instagram-post-scraper",
    patterns: [/instagram\s*posts?/i, /\bIG\s*posts?/i],
    buildInput: (q) => ({ directUrls: extractUrls(q), resultsLimit: 20 }),
  },
  {
    actor: "apify/instagram-reel-scraper",
    patterns: [/instagram\s*reels?/i, /\bIG\s*reels?/i],
    buildInput: (q) => ({ directUrls: extractUrls(q), resultsLimit: 20 }),
  },
  {
    actor: "apify/instagram-comment-scraper",
    patterns: [/instagram\s*comments?/i, /\bIG\s*comments?/i],
    buildInput: (q) => ({ directUrls: extractUrls(q), resultsLimit: 50 }),
  },
  {
    actor: "apify/instagram-hashtag-scraper",
    patterns: [/instagram\s*hashtag/i, /\bIG\s*hashtag/i],
    buildInput: (q) => {
      const tag = q.match(/#(\w+)/)?.[1] ?? extractSearchTerm(q);
      return { hashtags: [tag], resultsLimit: 30 };
    },
  },

  // ── Facebook ──
  {
    actor: "apify/facebook-posts-scraper",
    patterns: [/facebook\s*posts?/i, /\bFB\s*posts?/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), resultsLimit: 20 }),
  },
  {
    actor: "apify/facebook-pages-scraper",
    patterns: [/facebook\s*pages?/i, /\bFB\s*pages?/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), resultsLimit: 10 }),
  },
  {
    actor: "apify/facebook-groups-scraper",
    patterns: [/facebook\s*groups?/i, /\bFB\s*groups?/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), resultsLimit: 20 }),
  },
  {
    actor: "apify/facebook-ads-scraper",
    patterns: [/facebook\s*ads?\b/i, /\bFB\s*ads?\b/i, /\bad\s*library/i],
    buildInput: (q) => ({ searchQuery: extractSearchTerm(q), resultsLimit: 20 }),
  },
  {
    actor: "apify/facebook-comments-scraper",
    patterns: [/facebook\s*comments?/i, /\bFB\s*comments?/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), resultsLimit: 50 }),
  },
  {
    actor: "curious_coder/facebook-marketplace",
    patterns: [/facebook\s*marketplace/i, /\bFB\s*marketplace/i],
    buildInput: (q) => ({ searchQuery: extractSearchTerm(q), maxItems: 20 }),
  },

  // ── Twitter/X ──
  {
    actor: "apidojo/tweet-scraper",
    patterns: [/(?:twitter|tweet|x\.com)\s*(?:scrape|search|find|get)/i, /scrape\s*tweets?/i],
    buildInput: (q) => {
      const urls = extractUrls(q);
      return urls.length ? { startUrls: urls.map(url => ({ url })), maxItems: 30 }
        : { searchTerms: [extractSearchTerm(q)], maxItems: 30 };
    },
  },
  {
    actor: "apidojo/twitter-user-scraper",
    patterns: [/(?:twitter|x)\s*(?:user|profile|account)/i],
    buildInput: (q) => {
      const handles = q.match(/@([\w]+)/g)?.map(h => h.slice(1)) ?? [];
      return { handles: handles.length ? handles : [extractSearchTerm(q)], maxItems: 10 };
    },
  },

  // ── TikTok ──
  {
    actor: "clockworks/tiktok-scraper",
    patterns: [/tiktok\s*(?:scrape|search|videos?)/i, /scrape\s*tiktok/i],
    buildInput: (q) => {
      const urls = extractUrls(q);
      return urls.length ? { startUrls: urls.map(url => ({ url })), maxItems: 20 }
        : { searchQueries: [extractSearchTerm(q)], maxItems: 20 };
    },
  },
  {
    actor: "clockworks/tiktok-profile-scraper",
    patterns: [/tiktok\s*(?:profile|account|user)/i],
    buildInput: (q) => ({ profiles: [extractSearchTerm(q)], maxItems: 10 }),
  },
  {
    actor: "clockworks/tiktok-comments-scraper",
    patterns: [/tiktok\s*comments?/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), maxItems: 50 }),
  },

  // ── LinkedIn ──
  {
    actor: "dev_fusion/Linkedin-Profile-Scraper",
    patterns: [/linkedin\s*profile/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })) }),
  },
  {
    actor: "dev_fusion/Linkedin-Company-Scraper",
    patterns: [/linkedin\s*company/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })) }),
  },
  {
    actor: "curious_coder/linkedin-jobs-scraper",
    patterns: [/linkedin\s*jobs?/i],
    buildInput: (q) => ({ searchUrl: extractUrls(q)[0] ?? `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(extractSearchTerm(q))}` }),
  },

  // ── YouTube ──
  {
    actor: "streamers/youtube-scraper",
    patterns: [/youtube\s*(?:video|scrape|search)/i, /scrape\s*youtube/i, /\bYT\s*video/i],
    buildInput: (q) => {
      const urls = extractUrls(q);
      return urls.length ? { startUrls: urls.map(url => ({ url })), maxItems: 10 }
        : { searchKeywords: extractSearchTerm(q), maxItems: 10 };
    },
  },
  {
    actor: "streamers/youtube-channel-scraper",
    patterns: [/youtube\s*channel/i, /\bYT\s*channel/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), maxItems: 10 }),
  },
  {
    actor: "streamers/youtube-comments-scraper",
    patterns: [/youtube\s*comments?/i, /\bYT\s*comments?/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), maxItems: 50 }),
  },
  {
    actor: "pintostudio/youtube-transcript-scraper",
    patterns: [/youtube\s*transcript/i, /\bYT\s*transcript/i],
    buildInput: (q) => ({ urls: extractUrls(q) }),
  },

  // ── Reddit ──
  {
    actor: "trudax/reddit-scraper-lite",
    patterns: [/reddit\s*(?:scrape|search|posts?)/i, /scrape\s*reddit/i, /subreddit/i],
    buildInput: (q) => {
      const urls = extractUrls(q);
      return urls.length ? { startUrls: urls.map(url => ({ url })), maxItems: 30 }
        : { searches: [{ term: extractSearchTerm(q) }], maxItems: 30 };
    },
  },

  // ── Google ──
  {
    actor: "apify/google-search-scraper",
    patterns: [/google\s*search/i, /\bserp\b/i, /search\s*results/i],
    buildInput: (q) => ({ queries: extractSearchTerm(q), maxPagesPerQuery: 1, resultsPerPage: 10 }),
  },
  {
    actor: "compass/crawler-google-places",
    patterns: [/google\s*(?:places?|maps?)\s*(?:search|find|scrape)/i, /(?:places?|businesses?)\s*near/i],
    buildInput: (q) => ({ searchStringsArray: [extractSearchTerm(q)], maxCrawledPlacesPerSearch: 20 }),
  },
  {
    actor: "compass/Google-Maps-Reviews-Scraper",
    patterns: [/google\s*(?:maps?\s*)?reviews?/i, /\bGMB\s*reviews?/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), maxReviews: 30 }),
  },
  {
    actor: "apify/google-trends-scraper",
    patterns: [/google\s*trends?/i, /trending\s*(?:search|topic)/i],
    buildInput: (q) => ({ searchTerms: [extractSearchTerm(q)] }),
  },

  // ── Lead Gen ──
  {
    actor: "code_crafter/leads-finder",
    patterns: [/leads?\s*(?:find|search|scrape|gen)/i, /find\s*leads/i, /prospect/i],
    buildInput: (q) => ({ searchQuery: extractSearchTerm(q), maxItems: 20 }),
  },
  {
    actor: "vdrmota/contact-info-scraper",
    patterns: [/contact\s*info/i, /find\s*(?:email|phone|contact)/i, /extract\s*contacts?/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })) }),
  },

  // ── Reviews ──
  {
    actor: "nikita-sviridenko/trustpilot-reviews-scraper",
    patterns: [/trustpilot/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), maxItems: 30 }),
  },
  {
    actor: "maxcopell/tripadvisor",
    patterns: [/tripadvisor/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), maxItems: 20 }),
  },

  // ── E-commerce ──
  {
    actor: "junglee/free-amazon-product-scraper",
    patterns: [/amazon\s*(?:product|search|scrape)/i],
    buildInput: (q) => ({ searchQuery: extractSearchTerm(q), maxItems: 20 }),
  },
  {
    actor: "maxcopell/zillow-scraper",
    patterns: [/zillow/i, /real\s*estate\s*(?:listing|search)/i],
    buildInput: (q) => ({ searchQuery: extractSearchTerm(q), maxItems: 20 }),
  },

  // ── General Web ──
  {
    actor: "apify/web-scraper",
    patterns: [/(?:web|website|page)\s*scrap/i, /scrape\s*(?:this|that|the)\s*(?:page|site|url)/i],
    buildInput: (q) => ({ startUrls: extractUrls(q).map(url => ({ url })), maxPagesPerCrawl: 5 }),
  },
  {
    actor: "apify/rag-web-browser",
    patterns: [/\bRAG\b.*browser/i, /browse\s*and\s*extract/i, /web\s*(?:read|browse|fetch)\s*for\s*RAG/i],
    buildInput: (q) => ({ query: extractSearchTerm(q), maxResults: 5 }),
  },
  {
    actor: "apify/screenshot-url",
    patterns: [/screenshot/i, /capture\s*(?:page|site|url)/i],
    buildInput: (q) => ({ urls: extractUrls(q) }),
  },
];

// ── Apify API helpers ───────────────────────────────────────────────────────

async function apifyFetch(endpoint: string, options?: RequestInit): Promise<any> {
  const key = process.env.APIFY_API_KEY;
  if (!key) throw new Error("APIFY_API_KEY not configured. Add it in Settings > Integrations.");

  const res = await fetch(`${APIFY_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Run an actor and wait for results (sync mode, up to 120s). */
async function runActor(actorId: string, input: Record<string, unknown>): Promise<any[]> {
  // Run actor synchronously (waits for completion, up to 120s)
  const key = process.env.APIFY_API_KEY;
  if (!key) throw new Error("APIFY_API_KEY not configured.");

  const res = await fetch(
    `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify actor ${actorId} failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return res.json();
}

/** Pick the best actor for a query. */
function pickActor(query: string): ActorRoute | null {
  for (const route of ACTOR_ROUTES) {
    if (route.patterns.some(p => p.test(query))) return route;
  }
  return null;
}

// ── Dynamic Apify Store search ──────────────────────────────────────────────

type StoreActor = {
  id: string;
  name: string;
  username: string;
  title: string;
  description: string;
  stats: { totalRuns?: number; totalUsers?: number };
  currentPricingInfo?: {
    pricingModel?: string;
    pricePerUnitUsd?: number;
    costOfUsageUsd?: number;
    trialMinutes?: number;
  };
  categories?: string[];
};

/** Search the Apify Store for actors matching a keyword. Returns top results with pricing. */
async function searchApifyStore(keyword: string, limit = 10): Promise<StoreActor[]> {
  const key = process.env.APIFY_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    search: keyword,
    limit: String(limit),
    sortBy: "popularity",
  });

  const res = await fetch(`${APIFY_BASE}/store?${params}`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return (data?.data?.items ?? data?.items ?? data ?? []) as StoreActor[];
}

/** Format store results for agent decision-making. */
function formatStoreResults(actors: StoreActor[]): string {
  if (!actors.length) return "No actors found in the Apify Store for this query.";

  const lines = actors.map((a, i) => {
    const pricing = a.currentPricingInfo;
    const cost = pricing?.pricePerUnitUsd
      ? `$${pricing.pricePerUnitUsd}/unit`
      : pricing?.costOfUsageUsd
        ? `~$${pricing.costOfUsageUsd}/run`
        : pricing?.pricingModel === "FREE"
          ? "FREE"
          : pricing?.trialMinutes
            ? `${pricing.trialMinutes}min free trial`
            : "pay-per-use";
    const runs = a.stats?.totalRuns ? `${(a.stats.totalRuns / 1000).toFixed(0)}k runs` : "";
    const users = a.stats?.totalUsers ? `${a.stats.totalUsers} users` : "";
    const statsStr = [runs, users].filter(Boolean).join(", ");

    return [
      `[${i + 1}] ${a.username}/${a.name}`,
      `    ${a.title}`,
      `    Cost: ${cost}${statsStr ? ` | ${statsStr}` : ""}`,
      a.description ? `    ${a.description.slice(0, 120)}` : "",
    ].filter(Boolean).join("\n");
  });

  return lines.join("\n\n");
}

/** Extract a dynamic actor ID from the query. Supports both formats:
 *  - Slug: "run actor username/actor-name"
 *  - Raw ID: "run actor 8WEn9FvZnhE7IM3oA" or "run ID 8WEn9FvZnhE7IM3oA"
 */
function extractActorId(query: string): string | null {
  // Slug format: username/actor-name
  const slug = query.match(/(?:run|use|execute)\s+(?:apify\s+)?(?:actor\s+)?([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/i);
  if (slug) return slug[1];
  // Raw Apify ID format (alphanumeric, typically 17 chars)
  const rawId = query.match(/(?:run|use|execute)\s+(?:apify\s+)?(?:actor|id|scraper|tool)?\s*([a-zA-Z0-9]{10,25})/i);
  if (rawId) return rawId[1];
  // Just an ID mentioned with "apify" context
  const standalone = query.match(/\b(?:apify|actor|scraper)\b.*?\b([a-zA-Z0-9]{14,25})\b/i);
  if (standalone) return standalone[1];
  return null;
}

/** Extract JSON input from the query for dynamic actor runs. */
function extractJsonInput(query: string): Record<string, unknown> {
  // Try to find JSON block in query
  const jsonMatch = query.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
  }

  // Fall back to extracting URLs and search terms
  const urls = extractUrls(query);
  const term = extractSearchTerm(query);
  if (urls.length) return { startUrls: urls.map(url => ({ url })), maxItems: 20 };
  if (term) return { searchQuery: term, maxItems: 20 };
  return {};
}

// ── Tool definition ─────────────────────────────────────────────────────────

export const apifyScraperTool: ToolDefinition = {
  key: "apifyScraper",
  name: "Apify Web Scraper",
  patterns: [
    /\bscrape\b/i,
    /\bextract\s+(?:data|info|contacts?|leads?|reviews?|posts?|comments?|profile)/i,
    /\binstagram\b/i,
    /\bfacebook\b/i,
    /\btiktok\b/i,
    /\blinkedin\b/i,
    /\byoutube\s+(?:transcript|comments?|channel)/i,
    /\breddit\s+(?:scrape|search|posts?)/i,
    /\bgoogle\s+(?:search|places?|maps?|trends?|reviews?)\b/i,
    /\btrustpilot\b/i,
    /\btripadvisor\b/i,
    /\bzillow\b/i,
    /\bamazon\s+(?:product|search)/i,
    /\blead\s*(?:find|gen|scrape)/i,
    /\bcontact\s*info/i,
    /\bscreenshot\s+(?:url|page|site)/i,
    /\bapify\b/i,
    /\b(?:competitor|market)\s*(?:research|analysis|intel)/i,
    /\bfind\s+(?:a\s+)?(?:scraper|tool|actor)\s+(?:for|to)/i,
    /\bsearch\s+apify/i,
    /\brun\s+(?:apify\s+)?actor/i,
    /\bcheapest\s+(?:scraper|tool|way\s+to\s+scrape)/i,
  ],

  async execute(ctx) {
    try {
      if (!process.env.APIFY_API_KEY) {
        return makeResult("apify_scraper", "Apify API key not configured. Add APIFY_API_KEY in Settings > Integrations.");
      }

      // Mode 1: Direct actor run — "run actor username/actor-name { input }"
      const directActorId = extractActorId(ctx.query);
      if (directActorId) {
        const input = extractJsonInput(ctx.query);
        const items = await runActor(directActorId, input);
        if (!items || items.length === 0) {
          return makeResult("apify_scraper", `${directActorId} returned no results.`);
        }
        const truncated = items.slice(0, 15);
        const summary = truncated.map((item, i) => `[${i + 1}] ${extractUsefulFields(item)}`).join("\n\n");
        const footer = items.length > 15 ? `\n\n... and ${items.length - 15} more results (${items.length} total)` : "";
        return makeResult("apify_scraper", `${directActorId} — ${items.length} result(s):\n\n${summary}${footer}`);
      }

      // Mode 2: Search Apify Store — "find a scraper for ...", "search apify for ..."
      const storeSearchMatch = ctx.query.match(
        /(?:find|search|discover|browse|list|show)\s+(?:(?:a|an|the|apify|me)\s+)*(?:scraper|tool|actor|crawler)s?\s+(?:for|to|that)\s+(.+)/i,
      );
      const cheapestMatch = ctx.query.match(
        /cheapest\s+(?:scraper|tool|way)\s+(?:for|to)\s+(.+)/i,
      );
      const searchKeyword = storeSearchMatch?.[1]?.trim() ?? cheapestMatch?.[1]?.trim();

      if (searchKeyword) {
        const actors = await searchApifyStore(searchKeyword, 8);
        if (!actors.length) {
          return makeResult("apify_scraper", `No Apify actors found for "${searchKeyword}". Try different keywords.`);
        }
        return makeResult("apify_scraper", [
          `Apify Store — ${actors.length} actors for "${searchKeyword}":`,
          "",
          formatStoreResults(actors),
          "",
          `To run one: "run actor username/actor-name with URL https://..."`,
          `Or: "run actor username/actor-name { \"searchQuery\": \"...\", \"maxItems\": 20 }"`,
        ].join("\n"));
      }

      // Mode 3: Known actor route (fast path — 30+ hardcoded routes)
      const route = pickActor(ctx.query);
      if (!route) {
        // No known route AND no explicit store search — try dynamic store search as fallback
        const fallbackKeyword = extractSearchTerm(ctx.query);
        if (fallbackKeyword && fallbackKeyword.length > 2) {
          const actors = await searchApifyStore(fallbackKeyword, 8);
          if (actors.length) {
            return makeResult("apify_scraper", [
              `No built-in scraper matched. Found ${actors.length} actors in the Apify Store:`,
              "",
              formatStoreResults(actors),
              "",
              `To run one: "run actor username/actor-name with URL https://..."`,
            ].join("\n"));
          }
        }

        return makeResult("apify_scraper", [
          "Apify scraper ready. 19,000+ actors available.",
          "",
          "BUILT-IN (instant, no lookup):",
          "  Instagram, Facebook, Twitter/X, TikTok, LinkedIn, YouTube,",
          "  Reddit, Google (search/places/maps/reviews/trends),",
          "  Lead gen, Trustpilot, TripAdvisor, Amazon, Zillow, Web scraper",
          "",
          "DYNAMIC (searches Apify Store for the best tool):",
          '  "find a scraper for Yelp reviews"',
          '  "cheapest tool for email extraction"',
          '  "search apify for real estate leads"',
          "",
          "DIRECT RUN (any actor by ID):",
          '  "run actor username/actor-name with URL https://..."',
          "",
          'Example: "scrape instagram posts from @atlasux"',
        ].join("\n"));
      }

      const input = route.buildInput(ctx.query);
      const items = await runActor(route.actor, input);

      if (!items || items.length === 0) {
        return makeResult("apify_scraper", `${route.actor} returned no results.`);
      }

      // Truncate results to avoid blowing context
      const maxItems = 15;
      const truncated = items.slice(0, maxItems);
      const summary = truncated.map((item, i) => {
        // Extract the most useful fields from each item
        const useful = extractUsefulFields(item);
        return `[${i + 1}] ${useful}`;
      }).join("\n\n");

      const footer = items.length > maxItems
        ? `\n\n... and ${items.length - maxItems} more results (${items.length} total)`
        : "";

      return makeResult("apify_scraper", `${route.actor} — ${items.length} result(s):\n\n${summary}${footer}`);
    } catch (err) {
      return makeError("apify_scraper", err);
    }
  },
};

/** Extract the most useful fields from an Apify result item. */
function extractUsefulFields(item: Record<string, any>): string {
  const fields: string[] = [];

  // Common social media fields
  if (item.title) fields.push(`Title: ${String(item.title).slice(0, 120)}`);
  if (item.text) fields.push(`Text: ${String(item.text).slice(0, 300)}`);
  if (item.caption) fields.push(`Caption: ${String(item.caption).slice(0, 300)}`);
  if (item.content) fields.push(`Content: ${String(item.content).slice(0, 300)}`);
  if (item.description) fields.push(`Desc: ${String(item.description).slice(0, 200)}`);
  if (item.fullName || item.name) fields.push(`Name: ${item.fullName ?? item.name}`);
  if (item.username || item.handle) fields.push(`User: ${item.username ?? item.handle}`);
  if (item.url || item.link) fields.push(`URL: ${item.url ?? item.link}`);
  if (item.likesCount != null) fields.push(`Likes: ${item.likesCount}`);
  if (item.commentsCount != null) fields.push(`Comments: ${item.commentsCount}`);
  if (item.viewsCount != null || item.views != null) fields.push(`Views: ${item.viewsCount ?? item.views}`);
  if (item.followersCount != null) fields.push(`Followers: ${item.followersCount}`);
  if (item.email) fields.push(`Email: ${item.email}`);
  if (item.phone || item.phoneNumber) fields.push(`Phone: ${item.phone ?? item.phoneNumber}`);
  if (item.address) fields.push(`Address: ${typeof item.address === "string" ? item.address : JSON.stringify(item.address)}`);
  if (item.rating != null || item.totalScore != null) fields.push(`Rating: ${item.rating ?? item.totalScore}`);
  if (item.reviewsCount != null) fields.push(`Reviews: ${item.reviewsCount}`);
  if (item.price) fields.push(`Price: ${item.price}`);
  if (item.timestamp || item.publishedAt || item.date) fields.push(`Date: ${item.timestamp ?? item.publishedAt ?? item.date}`);

  // Fallback: stringify first few keys if nothing matched
  if (fields.length === 0) {
    const keys = Object.keys(item).slice(0, 8);
    for (const k of keys) {
      const v = item[k];
      if (v != null && typeof v !== "object") {
        fields.push(`${k}: ${String(v).slice(0, 150)}`);
      }
    }
  }

  return fields.join(" | ");
}
