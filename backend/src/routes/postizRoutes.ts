import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { sanitizeError } from "../lib/sanitizeError.js";

const POSTIZ_API = "https://api.postiz.com/public/v1";

type PostizIntegration = {
  id: string;
  name: string;
  providerIdentifier?: string;
  identifier?: string;
  picture?: string;
};
type PostizMetric = {
  label: string;
  data?: Array<{ total: string; date: string }>;
};

async function postizGet(endpoint: string): Promise<unknown> {
  const key = process.env.POSTIZ_API_KEY;
  if (!key) throw new Error("POSTIZ_API_KEY not configured");
  const res = await fetch(`${POSTIZ_API}${endpoint}`, {
    headers: { Authorization: key },
  });
  if (!res.ok)
    throw new Error(
      `Postiz API ${res.status}: ${await res.text().catch(() => "")}`,
    );
  return res.json();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const postizRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/postiz/channels
   * Returns all connected Postiz integrations + optional asset follower counts.
   */
  app.get("/channels", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;

    let integrations: PostizIntegration[];
    try {
      integrations = (await postizGet("/integrations")) as PostizIntegration[];
    } catch (e: any) {
      app.log.error({ err: e }, "Postiz channels fetch failed");
      return reply.code(502).send({ ok: false, error: sanitizeError(e) });
    }

    // Merge follower data from assets if tenant context is available
    let assetFollowers: Record<string, number> = {};
    if (tenantId) {
      try {
        const assets = await prisma.asset.findMany({
          where: { tenantId, type: "social" },
          select: { name: true, platform: true, metrics: true },
        });
        for (const a of assets) {
          const m = a.metrics as any;
          if (m?.followers && typeof m.followers === "number") {
            const key = (a.platform ?? a.name ?? "").toLowerCase();
            assetFollowers[key] = m.followers;
          }
        }
      } catch {
        /* assets merge is optional */
      }
    }

    const channels = integrations.map((i) => {
      const platform = (i.providerIdentifier ?? "").toLowerCase();
      const name = i.name ?? i.identifier ?? "Unknown";
      const followers =
        assetFollowers[platform] ??
        assetFollowers[name.toLowerCase()] ??
        undefined;
      return {
        id: i.id,
        name,
        platform,
        identifier: i.identifier ?? null,
        picture: i.picture ?? null,
        followers,
      };
    });

    return { ok: true, channels };
  });

  /**
   * GET /v1/postiz/analytics/:integrationId?date=7|30
   * Returns metrics for a single integration.
   */
  app.get("/analytics/aggregate", async (req, reply) => {
    const q = req.query as any;
    const date = String(q.date ?? "7");

    let integrations: PostizIntegration[];
    try {
      integrations = (await postizGet("/integrations")) as PostizIntegration[];
    } catch (e: any) {
      app.log.error({ err: e }, "Postiz analytics aggregate fetch failed");
      return reply.code(502).send({ ok: false, error: sanitizeError(e) });
    }

    // Collect per-channel metrics
    const allChannelMetrics: Array<{
      channel: { name: string; platform: string; id: string };
      metrics: PostizMetric[];
    }> = [];

    for (const integ of integrations) {
      try {
        const stats = (await postizGet(
          `/analytics/${integ.id}?date=${date}`,
        )) as PostizMetric[];
        if (Array.isArray(stats)) {
          allChannelMetrics.push({
            channel: {
              name: integ.name ?? integ.identifier ?? "Unknown",
              platform: (integ.providerIdentifier ?? "").toLowerCase(),
              id: integ.id,
            },
            metrics: stats,
          });
        }
      } catch {
        /* skip failed channels */
      }
      await sleep(200); // rate-limit spacing
    }

    // Aggregate: sum metrics with matching labels across all channels
    const aggregated: Record<
      string,
      { label: string; dataByDate: Record<string, number> }
    > = {};
    const rankMap: Record<
      string,
      Array<{ name: string; platform: string; total: number }>
    > = {};

    for (const cm of allChannelMetrics) {
      for (const metric of cm.metrics) {
        const label = metric.label;
        if (!aggregated[label]) {
          aggregated[label] = { label, dataByDate: {} };
        }
        if (!rankMap[label]) {
          rankMap[label] = [];
        }

        let channelTotal = 0;
        if (metric.data) {
          for (const dp of metric.data) {
            const val = parseInt(dp.total, 10) || 0;
            aggregated[label].dataByDate[dp.date] =
              (aggregated[label].dataByDate[dp.date] ?? 0) + val;
            channelTotal += val;
          }
        }

        rankMap[label].push({
          name: cm.channel.name,
          platform: cm.channel.platform,
          total: channelTotal,
        });
      }
    }

    // Build final metric array + rankings
    const metrics: PostizMetric[] = Object.values(aggregated).map((agg) => ({
      label: agg.label,
      data: Object.entries(agg.dataByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({ date, total: String(total) })),
    }));

    const rankings = Object.entries(rankMap).map(([label, channels]) => ({
      label,
      channels: channels.sort((a, b) => b.total - a.total),
    }));

    return { ok: true, metrics, rankings };
  });

  /**
   * GET /v1/postiz/posts?startDate=...&endDate=...
   * Returns scheduled/published posts with content, images, and channel info.
   */
  app.get("/posts", async (req, reply) => {
    const q = req.query as any;
    const endDate = q.endDate ?? new Date().toISOString();
    const startDate =
      q.startDate ?? new Date(Date.now() - 30 * 86_400_000).toISOString();

    try {
      const data = (await postizGet(
        `/posts?startDate=${startDate}&endDate=${endDate}`,
      )) as any;

      const posts = Array.isArray(data?.posts)
        ? data.posts
        : Array.isArray(data)
          ? data
          : [];

      // Normalize into a clean shape
      const normalized = posts.map((p: any) => ({
        id: p.id ?? p.postId ?? "",
        content: p.content ?? "",
        publishDate: p.publishDate ?? p.releaseURL ?? null,
        image: Array.isArray(p.image) ? p.image : p.image ? [p.image] : [],
        platform:
          (
            p.integration?.providerIdentifier ??
            p.providerIdentifier ??
            ""
          ).toLowerCase(),
        channelName: p.integration?.name ?? p.channelName ?? "",
        channelPicture: p.integration?.picture ?? null,
        state: p.state ?? p.status ?? "unknown",
      }));

      return { ok: true, posts: normalized };
    } catch (e: any) {
      app.log.error({ err: e }, "Postiz posts fetch failed");
      return reply.code(502).send({ ok: false, error: sanitizeError(e) });
    }
  });

  app.get<{ Params: { integrationId: string } }>(
    "/analytics/:integrationId",
    async (req, reply) => {
      const { integrationId } = req.params;
      const q = req.query as any;
      const date = String(q.date ?? "7");

      try {
        const stats = (await postizGet(
          `/analytics/${integrationId}?date=${date}`,
        )) as PostizMetric[];
        return { ok: true, metrics: Array.isArray(stats) ? stats : [] };
      } catch (e: any) {
        app.log.error({ err: e }, "Postiz analytics per-integration fetch failed");
        return reply.code(502).send({ ok: false, error: sanitizeError(e) });
      }
    },
  );
};
