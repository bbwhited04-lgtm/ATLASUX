import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { providerForPlatform } from "../lib/providerMapping.js";

const ImportBody = z.object({
  rawText: z.string().min(1, "rawText is required").max(50_000),
});

const MentionsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  platform: z.string().max(50).optional(),
});


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

    const parsed = ImportBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: "RAW_TEXT_REQUIRED", details: parsed.error.errors });
    const rawText = parsed.data.rawText;

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
   * Returns assets that look like social profile sources AND keyword assets.
   */
  app.get("/sources", async (req, reply) => {
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

    const sources = await prisma.asset.findMany({
      where: { tenantId, type: { in: ["social", "social_profile", "app", "keyword"] as any } },
      select: { id: true, name: true, url: true, platform: true, type: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return reply.send({ ok: true, tenantId, sources });
  });

  /**
   * POST /v1/listening/keywords?tenantId=...
   * Body: { keywords: string } — comma-separated keywords
   * Stores each keyword as an Asset with type="keyword".
   */
  app.post("/keywords", async (req, reply) => {
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

    const body = req.body as any;
    const raw = String(body?.keywords ?? "").trim();
    if (!raw) return reply.code(400).send({ ok: false, error: "KEYWORDS_REQUIRED" });

    const terms = raw.split(",").map(s => s.trim()).filter(s => s.length > 0 && s.length < 100);
    if (!terms.length) return reply.code(400).send({ ok: false, error: "NO_VALID_KEYWORDS" });

    let created = 0;
    for (const term of terms) {
      try {
        await prisma.asset.create({
          data: {
            tenantId,
            name: term,
            url: "",
            platform: "keyword",
            type: "keyword" as any,
          } as any,
        });
        created++;
      } catch (err: any) {
        const msg = String(err?.message ?? "");
        if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) continue;
      }
    }

    return reply.send({ ok: true, tenantId, created, total: terms.length });
  });

  /**
   * DELETE /v1/listening/sources/:id?tenantId=...
   * Deletes an asset by ID (with tenant ownership check).
   */
  app.delete("/sources/:id", async (req, reply) => {
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = req.params as any;
    if (!id) return reply.code(400).send({ ok: false, error: "ID_REQUIRED" });

    const asset = await prisma.asset.findFirst({ where: { id, tenantId } });
    if (!asset) return reply.code(404).send({ ok: false, error: "NOT_FOUND" });

    await prisma.asset.delete({ where: { id } });
    return reply.send({ ok: true, tenantId, deleted: id });
  });

  /**
   * GET /v1/listening/status?tenantId=...
   * Returns whether listening is active for the tenant.
   */
  app.get("/status", async (req, reply) => {
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

    // Find the most recent LISTENING_START or LISTENING_STOP job
    const lastJob = await prisma.job.findFirst({
      where: {
        tenantId,
        jobType: { in: ["LISTENING_START", "LISTENING_STOP"] },
        status: { in: ["queued", "running", "succeeded"] as any },
      },
      orderBy: { createdAt: "desc" },
      select: { jobType: true, status: true, createdAt: true },
    });

    const active = lastJob?.jobType === "LISTENING_START";
    return reply.send({ ok: true, tenantId, active });
  });

  /**
   * POST /v1/listening/stop?tenantId=...
   * Creates a LISTENING_STOP job so the worker knows to skip this tenant.
   */
  app.post("/stop", async (req, reply) => {
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

    const job = await prisma.job.create({
      data: {
        tenantId,
        jobType: "LISTENING_STOP",
        status: "succeeded" as any,
        priority: 0,
      },
      select: { id: true, status: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        level: "info" as any,
        action: "LISTENING_STOPPED",
        entityType: "job",
        entityId: job.id,
        message: "Listening stopped by user.",
        metadata: {},
        status: "SUCCESS" as any,
      } as any,
    }).catch(() => null);

    return reply.send({ ok: true, tenantId, job });
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

    const mq = MentionsQuery.safeParse(req.query);
    if (!mq.success) return reply.code(400).send({ ok: false, error: "Invalid query params", details: mq.error.errors });
    const limit = mq.data.limit;
    const platform = mq.data.platform;

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
