/**
 * Postiz Analytics — platform + per-post metrics for any connected social channel.
 *
 * Pulls analytics from Postiz REST API, applies the 4-quadrant diagnostic:
 *   High views + High engagement → SCALE
 *   High views + Low engagement  → FIX CTA
 *   Low views  + High engagement → FIX HOOKS
 *   Low views  + Low engagement  → FULL RESET
 *
 * Works for all 31 platforms Postiz supports. Auto-detects the target
 * platform from the agent ID.
 *
 * Requires: POSTIZ_API_KEY env var + the relevant integration connected in Postiz.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";
import { resolveCredential } from "../../../services/credentialResolver.js";

const POSTIZ_API = "https://api.postiz.com/public/v1";

// Same agent→platform mapping as postizPublish
const AGENT_PLATFORM: Record<string, string> = {
  timmy:    "tiktok",
  fran:     "facebook",
  dwight:   "threads",
  kelly:    "x",
  terry:    "tumblr",
  cornwall: "pinterest",
  link:     "linkedin",
  donna:    "reddit",
  emma:     "mastodon",
  venny:    "youtube",
  victor:   "youtube",
  sunday:   "x",
  archy:    "medium",
};

async function postizGet(endpoint: string, tenantId: string): Promise<unknown> {
  const key = await resolveCredential(tenantId, "postiz");
  if (!key) throw new Error("Postiz API key not configured. Add your Postiz API key in Settings > Integrations.");
  const res = await fetch(`${POSTIZ_API}${endpoint}`, {
    headers: { Authorization: key },
  });
  if (!res.ok) throw new Error(`Postiz API ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

type PostizIntegration = { id: string; name: string; providerIdentifier?: string; identifier?: string };
type PostizPost = { id: string; content?: string; publishDate?: string; integration?: { providerIdentifier?: string; name?: string }; releaseId?: string };
type PostizMetric = { label: string; data?: Array<{ total: string; date: string }> };

/** Find integration by platform identifier. */
async function findIntegration(platform: string, tenantId: string): Promise<PostizIntegration | null> {
  const integrations = (await postizGet("/integrations", tenantId)) as PostizIntegration[];
  return integrations.find(
    (i) => i.providerIdentifier === platform || i.identifier === platform || (i.name ?? "").toLowerCase().includes(platform),
  ) ?? null;
}

/** Classify a post into the 4-quadrant diagnostic. */
function diagnose(views: number, likes: number, avgViews: number): string {
  const highViews = views > avgViews && views > 5_000;
  const highEngagement = likes > 0 && views > 0 && (likes / views) > 0.03;

  if (highViews && highEngagement) return "SCALE — hook + engagement working, make variations";
  if (highViews && !highEngagement) return "FIX CTA — views good but engagement low, change call-to-action";
  if (!highViews && highEngagement) return "FIX HOOKS — content engages but needs more reach, try stronger hooks";
  return "NEEDS WORK — try different approach or hook format";
}

export const postizAnalyticsTool: ToolDefinition = {
  key:  "postizAnalytics",
  name: "Postiz Social Analytics",
  patterns: [
    /(?:analytics|stats|metrics|performance|report|numbers|insights)\s+(?:for|on|from)\s+\w+/i,
    /how\s+(?:are|is)\s+(?:my|our|the)\s+(?:tiktok|facebook|instagram|twitter|threads|tumblr|pinterest|linkedin|reddit|youtube|posts?|social)/i,
    /(?:tiktok|facebook|instagram|twitter|threads|tumblr|pinterest|linkedin|reddit|youtube)\s+(?:analytics|stats|metrics|performance|report|numbers)/i,
    /\b(?:engagement|follower|view|like|impression)\s+(?:count|rate|stats|data)/i,
    /daily\s*report/i,
    /content\s+diagnos/i,
    /post\s+performance/i,
  ],

  async execute(ctx) {
    try {
      const postizKey = await resolveCredential(ctx.tenantId, "postiz");
      if (!postizKey) {
        return makeResult("postiz_analytics", "Postiz API key is not configured. Add your Postiz API key in Settings > Integrations.");
      }

      // Determine target platform
      const platform = AGENT_PLATFORM[ctx.agentId] ?? detectPlatformFromQuery(ctx.query);

      if (!platform) {
        // Show analytics across all integrations
        const integrations = (await postizGet("/integrations", ctx.tenantId)) as PostizIntegration[];
        const summaries: string[] = [];
        for (const int of integrations.slice(0, 8)) {
          try {
            const stats = (await postizGet(`/analytics/${int.id}?date=7`, ctx.tenantId)) as PostizMetric[];
            if (Array.isArray(stats) && stats.length > 0) {
              const line = stats.map((m) => {
                const latest = m.data?.[m.data.length - 1];
                return `${m.label}: ${latest ? parseInt(latest.total, 10).toLocaleString() : "0"}`;
              }).join(", ");
              summaries.push(`  ${int.name} (${int.providerIdentifier ?? "?"}): ${line}`);
            }
          } catch { /* skip */ }
          await new Promise((r) => setTimeout(r, 200));
        }
        return makeResult("postiz_analytics", summaries.length
          ? `Cross-platform analytics (last 7 days):\n${summaries.join("\n")}`
          : "No analytics data available. Ensure integrations are connected in Postiz.");
      }

      const integration = await findIntegration(platform, ctx.tenantId);
      if (!integration) {
        return makeResult("postiz_analytics", `No ${platform} integration found in Postiz.`);
      }

      // ── 1. Platform-level stats ────────────────────────────────────
      let platformSection = "";
      try {
        const platformStats = (await postizGet(`/analytics/${integration.id}?date=30`, ctx.tenantId)) as PostizMetric[];
        if (Array.isArray(platformStats) && platformStats.length > 0) {
          const lines = platformStats.map((m) => {
            const latest = m.data?.[m.data.length - 1];
            const val = latest ? parseInt(latest.total, 10) || 0 : 0;
            const first = m.data?.[0];
            const delta = first && latest ? (parseInt(latest.total, 10) || 0) - (parseInt(first.total, 10) || 0) : 0;
            const trend = delta > 0 ? `+${delta.toLocaleString()}` : delta < 0 ? `${delta.toLocaleString()}` : "flat";
            return `  ${m.label}: ${val.toLocaleString()} (30d trend: ${trend})`;
          });
          platformSection = `Platform Stats — ${integration.name} (last 30 days):\n${lines.join("\n")}`;
        }
      } catch {
        platformSection = "Platform stats unavailable.";
      }

      // ── 2. Recent posts + per-post analytics ───────────────────────
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 86_400_000);
      let postsSection = "";
      let diagnosticSection = "";

      try {
        const postsData = (await postizGet(
          `/posts?startDate=${start.toISOString()}&endDate=${now.toISOString()}`, ctx.tenantId,
        )) as { posts?: PostizPost[] };

        const platformPosts = (postsData.posts ?? []).filter(
          (p) => p.integration?.providerIdentifier === platform || (p.integration?.name ?? "").toLowerCase().includes(platform),
        );

        if (platformPosts.length > 0) {
          const postMetrics: Array<{
            id: string; hook: string; date: string;
            views: number; likes: number; comments: number; shares: number;
          }> = [];

          for (const post of platformPosts.slice(0, 10)) {
            try {
              const analytics = (await postizGet(`/analytics/post/${post.id}?date=7`, ctx.tenantId)) as PostizMetric[];
              const metrics: Record<string, number> = {};
              if (Array.isArray(analytics)) {
                for (const m of analytics) {
                  const latest = m.data?.[m.data.length - 1];
                  if (latest) metrics[m.label.toLowerCase()] = parseInt(latest.total, 10) || 0;
                }
              }
              postMetrics.push({
                id: post.id,
                hook: (post.content ?? "").substring(0, 70),
                date: (post.publishDate ?? "").slice(0, 10),
                views: metrics.views ?? metrics.impressions ?? 0,
                likes: metrics.likes ?? metrics.reactions ?? 0,
                comments: metrics.comments ?? metrics.replies ?? 0,
                shares: metrics.shares ?? metrics.reposts ?? metrics.retweets ?? 0,
              });
            } catch { /* skip */ }
            await new Promise((r) => setTimeout(r, 200));
          }

          if (postMetrics.length > 0) {
            postMetrics.sort((a, b) => b.views - a.views);
            const totalViews = postMetrics.reduce((s, p) => s + p.views, 0);
            const avgViews = Math.round(totalViews / postMetrics.length);

            const table = postMetrics.map((p) => {
              const viewStr = p.views > 1000 ? `${(p.views / 1000).toFixed(1)}K` : `${p.views}`;
              return `  ${p.date} | ${viewStr} views | ${p.likes} likes | ${p.comments} comments | "${p.hook.substring(0, 45)}..."`;
            });

            postsSection = [
              `Recent Posts — ${platform} (last 7 days, ${postMetrics.length} posts):`,
              ...table,
              ``,
              `Total views: ${totalViews.toLocaleString()} | Avg per post: ${avgViews.toLocaleString()}`,
            ].join("\n");

            // ── 3. Diagnostic framework ──────────────────────────────
            const diagnostics = postMetrics.map((p) => {
              const dx = diagnose(p.views, p.likes, avgViews);
              return `  "${p.hook.substring(0, 50)}..." (${p.views.toLocaleString()} views) → ${dx}`;
            });

            const overallHighViews = avgViews > 10_000;
            const overallHighEngagement = postMetrics.some((p) => p.views > 0 && p.likes / p.views > 0.03);

            let overallDx: string;
            if (overallHighViews && overallHighEngagement) {
              overallDx = "SCALE — content performing well. Make variations of winning hooks.";
            } else if (overallHighViews && !overallHighEngagement) {
              overallDx = "FIX CTA — people watching but not engaging. Change call-to-action.";
            } else if (!overallHighViews && overallHighEngagement) {
              overallDx = "FIX HOOKS — engaged viewers but low reach. Try stronger hooks.";
            } else {
              overallDx = "NEEDS WORK — try radically different format. Research trending content.";
            }

            diagnosticSection = [
              `Diagnostic (4-quadrant framework):`,
              ``,
              `Overall: ${overallDx}`,
              ``,
              `Per-post:`,
              ...diagnostics,
            ].join("\n");
          }
        } else {
          postsSection = `No ${platform} posts found in the last 7 days.`;
        }
      } catch (err: unknown) {
        postsSection = `Could not fetch recent posts: ${err instanceof Error ? err.message : String(err)}`;
      }

      const sections = [platformSection, postsSection, diagnosticSection].filter(Boolean);
      if (!sections.length) {
        return makeResult("postiz_analytics", `No ${platform} analytics data available.`);
      }

      return makeResult("postiz_analytics", sections.join("\n\n---\n\n"));
    } catch (err) {
      return makeError("postiz_analytics", err);
    }
  },
};

function detectPlatformFromQuery(query: string): string | null {
  const platforms: [RegExp, string][] = [
    [/\btiktok\b/i, "tiktok"],
    [/\bfacebook\b/i, "facebook"],
    [/\binstagram\b/i, "instagram"],
    [/\bthreads\b/i, "threads"],
    [/\btwitter\b|\btweet\b|\bx\s+(?:analytics|stats)/i, "x"],
    [/\btumblr\b/i, "tumblr"],
    [/\bpinterest\b/i, "pinterest"],
    [/\blinkedin\b/i, "linkedin"],
    [/\breddit\b/i, "reddit"],
    [/\byoutube\b/i, "youtube"],
    [/\bmastodon\b/i, "mastodon"],
    [/\bbluesky\b/i, "bluesky"],
  ];
  for (const [rx, name] of platforms) {
    if (rx.test(query)) return name;
  }
  return null;
}
