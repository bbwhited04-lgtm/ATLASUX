/**
 * X Analytics — tweet performance metrics and account analytics.
 *
 * Extends existing X API v2 integration (services/x.ts).
 * Uses X_BEARER_TOKEN env var for app-only auth.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const X_API = "https://api.twitter.com/2";

export const xAnalyticsTool: ToolDefinition = {
  key:  "xAnalytics",
  name: "X Analytics",
  patterns: [
    /x\s*analytics/i,
    /tweet\s*(?:performance|metrics|stats)/i,
    /engagement\s*(?:metrics|rate|stats)/i,
    /twitter\s*analytics/i,
    /post\s*performance/i,
  ],
  async execute(ctx) {
    try {
      const bearer = process.env.X_BEARER_TOKEN;
      if (!bearer) return makeResult("x_analytics", "X Analytics not available — X_BEARER_TOKEN not configured.");

      const headers = { Authorization: `Bearer ${bearer}` };

      // Check if asking about a specific tweet
      const tweetIdMatch = ctx.query.match(/(?:tweet|post)\s*(?:id\s*)?(\d{10,})/i)
        || ctx.query.match(/status\/(\d+)/i);

      if (tweetIdMatch) {
        const tweetId = tweetIdMatch[1];
        const res = await fetch(
          `${X_API}/tweets/${tweetId}?tweet.fields=public_metrics,created_at,text`,
          { headers },
        );
        if (!res.ok) return makeResult("x_analytics", `X API returned ${res.status} for tweet ${tweetId}`);

        const json = await res.json() as { data?: { text?: string; created_at?: string; public_metrics?: { like_count: number; retweet_count: number; reply_count: number; impression_count: number; quote_count: number } } };
        const tweet = json.data;
        if (!tweet) return makeResult("x_analytics", `Tweet ${tweetId} not found.`);

        const m = tweet.public_metrics;
        const metrics = m ? [
          `Impressions: ${m.impression_count?.toLocaleString() ?? "N/A"}`,
          `Likes: ${m.like_count}`,
          `Retweets: ${m.retweet_count}`,
          `Replies: ${m.reply_count}`,
          `Quotes: ${m.quote_count}`,
        ].join(" | ") : "Metrics unavailable";

        return makeResult("x_analytics", `Tweet ${tweetId}:\n"${tweet.text?.slice(0, 200)}"\nPosted: ${tweet.created_at}\n${metrics}`);
      }

      // Default: get recent tweets with metrics for the authenticated user
      // (requires user context token, fall back to search if app-only)
      const userToken = process.env.X_USER_BEARER_TOKEN || process.env.X_ACCESS_TOKEN;
      if (!userToken) {
        return makeResult("x_analytics", "X Analytics requires a user-level access token. Set X_ACCESS_TOKEN in env vars, or provide a specific tweet ID to check metrics.");
      }

      const res = await fetch(
        `${X_API}/users/me/tweets?max_results=10&tweet.fields=public_metrics,created_at`,
        { headers: { Authorization: `Bearer ${userToken}` } },
      );
      if (!res.ok) return makeResult("x_analytics", `X API returned ${res.status}`);

      const json = await res.json() as { data?: Array<{ id: string; text: string; created_at?: string; public_metrics?: { like_count: number; retweet_count: number; impression_count: number } }> };
      const tweets = json.data ?? [];
      if (!tweets.length) return makeResult("x_analytics", "No recent tweets found.");

      const lines = tweets.map((t, i) => {
        const m = t.public_metrics;
        const stats = m ? `${m.impression_count ?? 0} views, ${m.like_count} likes, ${m.retweet_count} RTs` : "—";
        return `${i + 1}. "${t.text.slice(0, 80)}..." (${t.created_at?.slice(0, 10) ?? "—"})\n   ${stats}`;
      });

      return makeResult("x_analytics", `Recent tweet performance:\n${lines.join("\n")}`);
    } catch (err) {
      return makeError("x_analytics", err);
    }
  },
};
