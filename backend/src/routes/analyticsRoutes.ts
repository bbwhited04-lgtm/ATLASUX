import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/analytics/summary?tenantId=...&range=7d
   * Aggregates from DistributionEvent, LedgerEntry, GrowthLoopRun.
   */
  app.get("/summary", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const q = (req.query as any);
    const range = String(q.range ?? "7d");
    const days = range === "24h" ? 1 : range === "30d" ? 30 : range === "90d" ? 90 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [events, ledger, growthRuns] = await Promise.all([
      prisma.distributionEvent.findMany({
        where: { tenantId, occurredAt: { gte: since } },
        select: { channel: true, eventType: true, impressions: true, clicks: true, conversions: true, occurredAt: true },
        orderBy: { occurredAt: "asc" },
      }),
      prisma.ledgerEntry.findMany({
        where: { tenantId, occurredAt: { gte: since } },
        select: { category: true, amountCents: true, entryType: true, occurredAt: true },
      }),
      prisma.growthLoopRun.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: { runDate: true, status: true, summary: true },
        orderBy: { runDate: "desc" },
        take: 10,
      }),
    ]);

    // Aggregate totals
    const totalImpressions = events.reduce((s, e) => s + (e.impressions ?? 0), 0);
    const totalClicks = events.reduce((s, e) => s + (e.clicks ?? 0), 0);
    const totalConversions = events.reduce((s, e) => s + (e.conversions ?? 0), 0);
    const clickRate = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) + "%" : "0%";

    // Total spend in cents
    const totalSpendCents = ledger
      .filter(l => l.entryType === "debit")
      .reduce((s, l) => s + Number(l.amountCents), 0);

    // Events by channel
    const byChannel: Record<string, { impressions: number; clicks: number; conversions: number; posts: number }> = {};
    for (const e of events) {
      if (!byChannel[e.channel]) byChannel[e.channel] = { impressions: 0, clicks: 0, conversions: 0, posts: 0 };
      byChannel[e.channel].impressions  += e.impressions ?? 0;
      byChannel[e.channel].clicks       += e.clicks ?? 0;
      byChannel[e.channel].conversions  += e.conversions ?? 0;
      byChannel[e.channel].posts        += 1;
    }

    // Timeline: group by day
    const timelineMap: Record<string, { date: string; impressions: number; clicks: number; posts: number }> = {};
    for (const e of events) {
      const date = e.occurredAt.toISOString().slice(0, 10);
      if (!timelineMap[date]) timelineMap[date] = { date, impressions: 0, clicks: 0, posts: 0 };
      timelineMap[date].impressions += e.impressions ?? 0;
      timelineMap[date].clicks      += e.clicks ?? 0;
      timelineMap[date].posts       += 1;
    }
    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Spend by category
    const spendByCategory: Record<string, number> = {};
    for (const l of ledger.filter(l => l.entryType === "debit")) {
      const cat = String(l.category);
      spendByCategory[cat] = (spendByCategory[cat] ?? 0) + Number(l.amountCents);
    }

    return reply.send({
      ok: true,
      range,
      summary: {
        totalImpressions,
        totalClicks,
        totalConversions,
        clickRate,
        totalPosts: events.length,
        totalSpendCents,
        totalSpendUsd: (totalSpendCents / 100).toFixed(2),
      },
      byChannel,
      timeline,
      spendByCategory,
      growthRuns,
    });
  });

  /**
   * GET /v1/analytics/metrics?tenantId=...&range=7d
   * Returns MetricsSnapshot data (stored JSON from external sources).
   */
  app.get("/metrics", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const q = (req.query as any);
    const range = String(q.range ?? "7d");
    const days = range === "24h" ? 1 : range === "30d" ? 30 : range === "90d" ? 90 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const snapshots = await prisma.metricsSnapshot.findMany({
      where: { tenantId, date: { gte: since } },
      orderBy: { date: "desc" },
      take: 90,
    });

    return reply.send({ ok: true, snapshots });
  });

  /**
   * GET /v1/analytics/compare?range=7d
   * Period-over-period comparison: current window vs prior window of same length.
   */
  app.get("/compare", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const q = (req.query as any);
    const range = String(q.range ?? "7d");
    const days = range === "24h" ? 1 : range === "30d" ? 30 : range === "90d" ? 90 : 7;
    const now = new Date();
    const since     = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);       // current window start
    const priorEnd  = since;                                                        // prior window end
    const priorStart = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);    // prior window start

    const [currentEvents, currentLedger, priorEvents, priorLedger] = await Promise.all([
      prisma.distributionEvent.findMany({
        where: { tenantId, occurredAt: { gte: since, lte: now } },
        select: { impressions: true, clicks: true, conversions: true },
      }),
      prisma.ledgerEntry.findMany({
        where: { tenantId, entryType: "debit", occurredAt: { gte: since, lte: now } },
        select: { amountCents: true },
      }),
      prisma.distributionEvent.findMany({
        where: { tenantId, occurredAt: { gte: priorStart, lt: priorEnd } },
        select: { impressions: true, clicks: true, conversions: true },
      }),
      prisma.ledgerEntry.findMany({
        where: { tenantId, entryType: "debit", occurredAt: { gte: priorStart, lt: priorEnd } },
        select: { amountCents: true },
      }),
    ]);

    function aggregate(events: typeof currentEvents, ledger: typeof currentLedger) {
      return {
        impressions:  events.reduce((s, e) => s + (e.impressions  ?? 0), 0),
        clicks:       events.reduce((s, e) => s + (e.clicks       ?? 0), 0),
        conversions:  events.reduce((s, e) => s + (e.conversions  ?? 0), 0),
        spendCents:   ledger.reduce((s, l) => s + Number(l.amountCents), 0),
        posts:        events.length,
      };
    }

    function pctDelta(cur: number, prior: number): string {
      if (prior === 0) return cur === 0 ? "0%" : "+100%";
      const pct = ((cur - prior) / prior) * 100;
      const sign = pct >= 0 ? "+" : "";
      return `${sign}${pct.toFixed(1)}%`;
    }

    const current = aggregate(currentEvents, currentLedger);
    const prior   = aggregate(priorEvents,   priorLedger);

    const delta = {
      impressions:  pctDelta(current.impressions,  prior.impressions),
      clicks:       pctDelta(current.clicks,        prior.clicks),
      conversions:  pctDelta(current.conversions,   prior.conversions),
      spendCents:   pctDelta(current.spendCents,    prior.spendCents),
      posts:        pctDelta(current.posts,          prior.posts),
    };

    return reply.send({ ok: true, range, current, prior, delta });
  });

  /**
   * GET /v1/analytics/roi?range=7d
   * ROI breakdown per channel from DistributionEvent.
   */
  app.get("/roi", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const q = (req.query as any);
    const range = String(q.range ?? "7d");
    const days = range === "24h" ? 1 : range === "30d" ? 30 : range === "90d" ? 90 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await prisma.distributionEvent.findMany({
      where: { tenantId, occurredAt: { gte: since } },
      select: { channel: true, impressions: true, clicks: true, conversions: true },
    });

    const channelMap: Record<string, { impressions: number; clicks: number; conversions: number; posts: number }> = {};
    for (const e of events) {
      if (!channelMap[e.channel]) channelMap[e.channel] = { impressions: 0, clicks: 0, conversions: 0, posts: 0 };
      channelMap[e.channel].impressions  += e.impressions  ?? 0;
      channelMap[e.channel].clicks       += e.clicks       ?? 0;
      channelMap[e.channel].conversions  += e.conversions  ?? 0;
      channelMap[e.channel].posts        += 1;
    }

    const channels = Object.entries(channelMap).map(([channel, agg]) => {
      const ctr      = agg.impressions > 0 ? ((agg.clicks      / agg.impressions) * 100).toFixed(1) + "%" : "0%";
      const convRate = agg.clicks      > 0 ? ((agg.conversions / agg.clicks)      * 100).toFixed(1) + "%" : "0%";
      return { channel, ...agg, ctr, convRate };
    });

    return reply.send({ ok: true, range, channels });
  });

  /**
   * POST /v1/analytics/metrics
   * Upsert a daily metrics snapshot (call this from integrations/webhooks).
   * Body: { date: "YYYY-MM-DD", data: { visitors, pageViews, ... } }
   */
  app.post("/metrics", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as any;
    const dateStr = String(body.date ?? new Date().toISOString().slice(0, 10));
    const date = new Date(dateStr);
    const data = typeof body.data === "object" && body.data ? body.data : {};

    const snapshot = await prisma.metricsSnapshot.upsert({
      where: { tenantId_date: { tenantId, date } } as any,
      update: { data, updatedAt: new Date() },
      create: { tenantId, date, data },
    });

    return reply.send({ ok: true, snapshot });
  });
};
