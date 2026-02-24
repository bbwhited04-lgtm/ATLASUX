import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma.js";

export const distributionRoutes: FastifyPluginAsync = async (app) => {
  // Record a distribution event (post/publish/etc)
  app.post("/events", async (req, reply) => {
    const body = (req.body as any) ?? {};
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const row = await prisma.distributionEvent.create({
      data: {
        tenantId,
        agent: String(body.agent ?? "unknown"),
        channel: String(body.channel ?? "other"),
        eventType: String(body.eventType ?? "update"),
        url: body.url ? String(body.url) : null,
        meta: body.meta ?? undefined,
        impressions: body.impressions ?? undefined,
        clicks: body.clicks ?? undefined,
        conversions: body.conversions ?? undefined,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
      },
    });
    return reply.send({ ok: true, event: row });
  });

  // Lightweight summary for the last N days
  app.get("/summary", async (req, reply) => {
    const q = (req.query as any) ?? {};
    const tenantId = ((req as any).tenantId as string | undefined) || String(q.tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const days = Number(q.days ?? 7);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await prisma.distributionEvent.findMany({
      where: { tenantId, occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
      take: 500,
    });

    // Aggregate by channel
    const byChannel: Record<string, any> = {};
    for (const e of events) {
      const key = e.channel;
      byChannel[key] ??= { channel: key, events: 0, impressions: 0, clicks: 0, conversions: 0 };
      byChannel[key].events += 1;
      byChannel[key].impressions += Number(e.impressions ?? 0);
      byChannel[key].clicks += Number(e.clicks ?? 0);
      byChannel[key].conversions += Number(e.conversions ?? 0);
    }

    return reply.send({ ok: true, since, total: events.length, byChannel: Object.values(byChannel) });
  });
};
