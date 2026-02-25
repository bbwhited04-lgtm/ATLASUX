import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { providerForPlatform } from "../lib/providerMapping.js";

export const listeningRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/listening/plan?tenantId=...
   * Returns candidate assets + whether their provider is connected.
   */
  app.get("/plan", async (req) => {
    const q = (req.query ?? {}) as any;
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const assets = await prisma.asset.findMany({
      where: { tenantId },
      select: { id: true, name: true, url: true, platform: true, type: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const providers = new Set<string>();
    const candidates = assets
      .map(a => {
        const provider = providerForPlatform(a.platform);
        if (provider) providers.add(provider);
        return { ...a, provider };
      })
      .filter(a => !!a.provider);

    const rows = await prisma.integration.findMany({
      where: { tenantId, provider: { in: Array.from(providers) as any } },
      select: { provider: true, connected: true },
    });
    const connectedByProvider: Record<string, boolean> = {};
    for (const r of rows) connectedByProvider[String(r.provider)] = !!r.connected;

    const plan = candidates.map(a => ({
      id: a.id,
      name: a.name,
      url: a.url,
      platform: a.platform,
      provider: a.provider,
      connected: !!connectedByProvider[String(a.provider)],
      type: a.type,
    }));

    return { ok: true, tenantId, plan };
  });

  /**
   * POST /v1/listening/start?tenantId=...
   * Creates a queued job and writes an audit_log entry.
   */
  app.post("/start", async (req) => {
    const q = (req.query ?? {}) as any;
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const planRes = await (app as any).inject({ method: "GET", url: `/v1/listening/plan?tenantId=${encodeURIComponent(tenantId)}` });
    const planJson = planRes.json() as any;
    const plan = planJson?.plan ?? [];
    const disconnected = plan.filter((p: any) => !p.connected);

    const job = await prisma.job.create({
      data: {
        tenantId,
        jobType: "LISTENING_START",
        status: "queued" as any,
        input: { plan },
        priority: 1,
      },
      select: { id: true, status: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: null,
        level: "info" as any,
        action: "LISTENING_START_REQUESTED",
        entityType: "job",
        entityId: job.id,
        message: disconnected.length
          ? `Listening requested; ${disconnected.length} providers not connected yet.`
          : "Listening requested.",
        meta: { disconnectedProviders: Array.from(new Set(disconnected.map((d: any) => d.provider))) },
        timestamp: new Date(),
      } as any,
    }).catch(() => null);

    return { ok: true, tenantId, job, disconnectedProviders: Array.from(new Set(disconnected.map((d: any) => d.provider))) };
  });

  /**
   * GET /v1/listening/mentions?tenantId=...&limit=50&platform=twitter
   * Returns mentions stored by the social monitoring worker.
   */
  app.get("/mentions", async (req) => {
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const q = (req.query ?? {}) as any;
    const limit = Math.min(Number(q.limit ?? 50), 200);
    const platform = typeof q.platform === "string" && q.platform ? q.platform : undefined;

    const where: any = { tenantId, eventType: "MENTION" };
    if (platform) where.channel = platform;

    const mentions = await prisma.distributionEvent.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: limit,
      select: { id: true, channel: true, url: true, meta: true, occurredAt: true },
    });

    const total = await prisma.distributionEvent.count({ where });

    return { ok: true, tenantId, mentions, total };
  });
};
