import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";

const DistributionEventSchema = z.object({
  agent:       z.string().min(1).max(100).default("unknown"),
  channel:     z.string().min(1).max(100).default("other"),
  eventType:   z.string().min(1).max(100).default("update"),
  url:         z.string().url().optional().nullable(),
  meta:        z.record(z.unknown()).optional(),
  impressions: z.number().int().nonnegative().optional(),
  clicks:      z.number().int().nonnegative().optional(),
  conversions: z.number().int().nonnegative().optional(),
  occurredAt:  z.string().datetime({ offset: true }).optional(),
});

export const distributionRoutes: FastifyPluginAsync = async (app) => {
  // Record a distribution event (post/publish/etc)
  app.post("/events", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    let body: z.infer<typeof DistributionEventSchema>;
    try { body = DistributionEventSchema.parse(req.body ?? {}); }
    catch (e: any) { return reply.code(400).send({ ok: false, error: "INVALID_BODY", details: e.errors }); }

    const row = await prisma.distributionEvent.create({
      data: {
        tenantId,
        agent:       body.agent,
        channel:     body.channel,
        eventType:   body.eventType,
        url:         body.url ?? null,
        meta:        (body.meta as any) ?? undefined,
        impressions: body.impressions ?? undefined,
        clicks:      body.clicks ?? undefined,
        conversions: body.conversions ?? undefined,
        occurredAt:  body.occurredAt ? new Date(body.occurredAt) : undefined,
      },
    });

    // Semantic audit — every distribution event is a write worth tracing
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: (req as any).auth?.userId ?? null,
        actorExternalId: body.agent,
        level: "info",
        action: "DISTRIBUTION_EVENT_RECORDED",
        entityType: "distribution_event",
        entityId: row.id,
        message: `Distribution event recorded: ${body.eventType} via ${body.channel} by ${body.agent}`,
        meta: { channel: body.channel, eventType: body.eventType, agent: body.agent, url: body.url ?? null },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

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
