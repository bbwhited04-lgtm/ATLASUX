import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { providerForPlatform } from "../lib/providerMapping.js";


function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("reddit.com")) return "reddit";
  if (u.includes("facebook.com")) return "facebook";
  if (u.includes("whatsapp.com")) return "whatsapp";
  if (u.includes("x.com") || u.includes("twitter.com")) return "x";
  if (u.includes("pinterest.com")) return "pinterest";
  if (u.includes("alignable.com")) return "alignable";
  if (u.includes("tumblr.com")) return "tumblr";
  if (u.includes("threads.com")) return "threads";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("discord.com")) return "discord";
  if (u.includes("t.me") || u.includes("telegram.me")) return "telegram";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("twitch.tv")) return "twitch";
  return "web";
}

function extractUrls(raw: string): string[] {
  const matches = raw.match(/https?:\/\/[^\s)]+/g) ?? [];
  const cleaned = matches
    .map((s) => s.replace(/[),.;]+$/g, "").trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

function defaultNameForUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const parts = u.pathname.split("/").filter(Boolean);
    const tail = parts[parts.length - 1] ?? host;
    return `${host}:${tail}`.slice(0, 80);
  } catch {
    return url.slice(0, 80);
  }
}


export const listeningRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/listening/plan?tenantId=...
   * Returns candidate assets + whether their provider is connected.
   */
  app.get("/plan", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

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

    return reply.send({ ok: true, tenantId, plan });
  });

  /**
   * POST /v1/listening/sources/import?tenantId=...
   * Body: { rawText: string }
   * Extracts http(s) URLs and stores them as Assets (fallback) so /plan can see them.
   *
   * NOTE: This is intentionally tolerant: if your Asset model differs, this endpoint will
   * return a clear error and include the parsed URLs so you can adjust mapping.
   */
  app.post("/sources/import", async (req, reply) => {
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

    const body = (req.body ?? {}) as any;
    const rawText = String(body.rawText ?? "");
    if (!rawText.trim()) return reply.code(400).send({ ok: false, error: "RAW_TEXT_REQUIRED" });

    const urls = extractUrls(rawText);
    if (!urls.length) return reply.code(400).send({ ok: false, error: "NO_URLS_FOUND" });

    const rows = urls.map((url) => ({
      tenantId,
      name: defaultNameForUrl(url),
      url,
      platform: detectPlatform(url),
      type: "social_profile" as any,
    }));

    let created = 0;
    let failed: Array<{ url: string; error: string }> = [];

    // Try fast bulk insert first
    try {
      const res = await prisma.asset.createMany({
        data: rows as any,
        skipDuplicates: true as any,
      } as any);
      created = Number((res as any)?.count ?? 0);
    } catch (e: any) {
      // Fallback to per-row create with best-effort dedupe (ignore duplicates)
      for (const r of rows) {
        try {
          await prisma.asset.create({ data: r as any } as any);
          created += 1;
        } catch (err: any) {
          const msg = String(err?.message ?? err);
          // Ignore typical duplicate errors
          if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) continue;
          failed.push({ url: r.url, error: msg });
        }
      }
    }

    return reply.send({ ok: failed.length === 0, tenantId, found: urls.length, created, failed, urls });
  });

  /**
   * GET /v1/listening/sources?tenantId=...
   * Returns assets that look like social profile sources (from the import endpoint)
   */
  app.get("/sources", async (req, reply) => {
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

    const sources = await prisma.asset.findMany({
      where: { tenantId, type: "social_profile" as any },
      select: { id: true, name: true, url: true, platform: true, type: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return reply.send({ ok: true, tenantId, sources });
  });


  /**
   * POST /v1/listening/start?tenantId=...
   * Creates a queued job and writes an audit_log entry.
   */
  app.post("/start", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

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
        level: "info" as any,
        action: "LISTENING_START_REQUESTED",
        entityType: "job",
        entityId: job.id,
        message: disconnected.length
          ? `Listening requested; ${disconnected.length} providers not connected yet.`
          : "Listening requested.",
        metadata: { disconnectedProviders: Array.from(new Set(disconnected.map((d: any) => d.provider))) },
        status: "SUCCESS" as any,
      } as any,
    }).catch(() => null);

    return reply.send({ ok: true, tenantId, job, disconnectedProviders: Array.from(new Set(disconnected.map((d: any) => d.provider))) });
  });

  /**
   * GET /v1/listening/mentions?tenantId=...&limit=50&platform=twitter
   * Returns mentions stored by the social monitoring worker.
   */
  app.get("/mentions", async (req, reply) => {
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

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

    return reply.send({ ok: true, tenantId, mentions, total });
  });
};
