/**
 * TikTok Analytics — platform + per-post metrics via Postiz API.
 *
 * Pulls analytics from Postiz REST API (SDK doesn't cover analytics endpoints),
 * applies the 4-quadrant diagnostic framework:
 *   High views + High conversions → SCALE
 *   High views + Low conversions  → FIX CTA
 *   Low views  + High conversions → FIX HOOKS
 *   Low views  + Low conversions  → FULL RESET
 *
 * Requires: POSTIZ_API_KEY env var + a TikTok integration connected in Postiz.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const POSTIZ_API = "https://api.postiz.com/public/v1";

async function postizGet(endpoint: string): Promise<unknown> {
  const key = process.env.POSTIZ_API_KEY;
  if (!key) throw new Error("POSTIZ_API_KEY not configured");
  const res = await fetch(`${POSTIZ_API}${endpoint}`, {
    headers: { Authorization: key },
  });
  if (!res.ok) throw new Error(`Postiz API ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

type PostizIntegration = { id: string; name: string; providerIdentifier?: string; identifier?: string };
type PostizPost = { id: string; content?: string; publishDate?: string; integration?: { providerIdentifier?: string; name?: string }; releaseId?: string };
type PostizMetric = { label: string; data?: Array<{ total: string; date: string }> };

/** Find TikTok integration ID. */
async function findTikTokIntegrationId(): Promise<{ id: string; name: string } | null> {
  const integrations = (await postizGet("/integrations")) as PostizIntegration[];
  const tiktok = integrations.find(
    (i) => i.providerIdentifier === "tiktok" || i.identifier === "tiktok" || (i.name ?? "").toLowerCase().includes("tiktok"),
  );
  return tiktok ? { id: tiktok.id, name: tiktok.name } : null;
}

/** Classify a post into the 4-quadrant diagnostic. */
function diagnose(views: number, likes: number, avgViews: number): string {
  const highViews = views > avgViews && views > 5_000;
  const highEngagement = likes > 0 && views > 0 && (likes / views) > 0.03; // >3% like rate

  if (highViews && highEngagement) return "SCALE — hook + engagement working, make variations";
  if (highViews && !highEngagement) return "FIX CTA — views good but engagement low, change call-to-action";
  if (!highViews && highEngagement) return "FIX HOOKS — content engages but needs more reach, try stronger hooks";
  return "NEEDS WORK — try different approach or hook format";
}

export const tiktokAnalyticsTool: ToolDefinition = {
  key:  "tiktokAnalytics",
  name: "TikTok Analytics via Postiz",
  patterns: [
    /tik\s*tok\s+(?:analytics|stats|metrics|performance|report|numbers)/i,
    /(?:analytics|stats|metrics|performance|report)\s+(?:for|on|from)\s+tik\s*tok/i,
    /how\s+(?:are|is)\s+(?:my|our|the)\s+tik\s*tok/i,
    /tik\s*tok\s+(?:view|like|comment|share|follower|engagement)/i,
    /tik\s*tok\s+daily\s*report/i,
    /tik\s*tok\s+diagnos/i,
  ],

  async execute(ctx) {
    try {
      if (!process.env.POSTIZ_API_KEY) {
        return makeResult("tiktok_analytics", "POSTIZ_API_KEY is not configured. Set it in backend/.env to enable TikTok analytics.");
      }

      const integration = await findTikTokIntegrationId();
      if (!integration) {
        return makeResult("tiktok_analytics", "No TikTok integration found in Postiz. Connect a TikTok account first.");
      }

      // ── 1. Platform-level stats ──────────────────────────────────────
      let platformSection = "";
      try {
        const platformStats = (await postizGet(`/analytics/${integration.id}?date=30`)) as PostizMetric[];
        if (Array.isArray(platformStats) && platformStats.length > 0) {
          const lines = platformStats.map((m) => {
            const latest = m.data?.[m.data.length - 1];
            const val = latest ? parseInt(latest.total, 10) || 0 : 0;
            // Calculate trend from first to last data point
            const first = m.data?.[0];
            const delta = first && latest ? (parseInt(latest.total, 10) || 0) - (parseInt(first.total, 10) || 0) : 0;
            const trend = delta > 0 ? `+${delta.toLocaleString()}` : delta < 0 ? `${delta.toLocaleString()}` : "flat";
            return `  ${m.label}: ${val.toLocaleString()} (30d trend: ${trend})`;
          });
          platformSection = `Platform Stats (${integration.name}, last 30 days):\n${lines.join("\n")}`;
        }
      } catch {
        platformSection = "Platform stats unavailable.";
      }

      // ── 2. Recent posts + per-post analytics ─────────────────────────
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 86_400_000); // last 7 days
      let postsSection = "";
      let diagnosticSection = "";

      try {
        const postsData = (await postizGet(
          `/posts?startDate=${start.toISOString()}&endDate=${now.toISOString()}`,
        )) as { posts?: PostizPost[] };

        const tiktokPosts = (postsData.posts ?? []).filter(
          (p) => p.integration?.providerIdentifier === "tiktok",
        );

        if (tiktokPosts.length > 0) {
          // Fetch per-post metrics (rate-limited)
          const postMetrics: Array<{
            id: string; hook: string; date: string;
            views: number; likes: number; comments: number; shares: number;
          }> = [];

          for (const post of tiktokPosts.slice(0, 10)) {
            try {
              const analytics = (await postizGet(`/analytics/post/${post.id}?date=7`)) as PostizMetric[];
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
                views: metrics.views ?? 0,
                likes: metrics.likes ?? 0,
                comments: metrics.comments ?? 0,
                shares: metrics.shares ?? 0,
              });
            } catch {
              // skip failed individual post analytics
            }
            // Small delay to respect rate limits
            await new Promise((r) => setTimeout(r, 200));
          }

          if (postMetrics.length > 0) {
            // Sort by views descending
            postMetrics.sort((a, b) => b.views - a.views);

            const totalViews = postMetrics.reduce((s, p) => s + p.views, 0);
            const avgViews = Math.round(totalViews / postMetrics.length);

            const table = postMetrics.map((p) => {
              const viewStr = p.views > 1000 ? `${(p.views / 1000).toFixed(1)}K` : `${p.views}`;
              return `  ${p.date} | ${viewStr} views | ${p.likes} likes | ${p.comments} comments | "${p.hook.substring(0, 45)}..."`;
            });

            postsSection = [
              `Recent Posts (last 7 days, ${postMetrics.length} posts):`,
              ...table,
              ``,
              `Total views: ${totalViews.toLocaleString()} | Avg per post: ${avgViews.toLocaleString()}`,
            ].join("\n");

            // ── 3. Diagnostic framework ────────────────────────────────
            const diagnostics = postMetrics.map((p) => {
              const dx = diagnose(p.views, p.likes, avgViews);
              return `  "${p.hook.substring(0, 50)}..." (${p.views.toLocaleString()} views) → ${dx}`;
            });

            // Overall diagnosis
            const overallHighViews = avgViews > 10_000;
            const overallHighEngagement = postMetrics.some((p) => p.views > 0 && p.likes / p.views > 0.03);

            let overallDx: string;
            if (overallHighViews && overallHighEngagement) {
              overallDx = "SCALE — content is performing well. Make variations of winning hooks. Test posting times.";
            } else if (overallHighViews && !overallHighEngagement) {
              overallDx = "FIX CTA — people are watching but not engaging. Change call-to-action, try different caption styles.";
            } else if (!overallHighViews && overallHighEngagement) {
              overallDx = "FIX HOOKS — content engages viewers but reach is low. Try stronger hook formats (POV, person+conflict, listicle).";
            } else {
              overallDx = "NEEDS WORK — try radically different format. Research trending hooks in the niche.";
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
          postsSection = "No TikTok posts found in the last 7 days.";
        }
      } catch (err: unknown) {
        postsSection = `Could not fetch recent posts: ${err instanceof Error ? err.message : String(err)}`;
      }

      // ── Assemble report ──────────────────────────────────────────────
      const sections = [platformSection, postsSection, diagnosticSection].filter(Boolean);
      if (!sections.length) {
        return makeResult("tiktok_analytics", "No TikTok analytics data available. Make sure posts have been published via Postiz.");
      }

      return makeResult("tiktok_analytics", sections.join("\n\n---\n\n"));
    } catch (err) {
      return makeError("tiktok_analytics", err);
    }
  },
};
