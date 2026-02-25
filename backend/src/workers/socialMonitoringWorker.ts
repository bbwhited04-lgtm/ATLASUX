/**
 * Social Monitoring Worker — processes LISTENING_START jobs.
 * Polls connected social APIs for mentions, hashtags, and brand signals.
 * Stores results as DistributionEvents with eventType="MENTION".
 */
import { prisma } from "../db/prisma.js";

const POLL_MS = Number(process.env.SOCIAL_WORKER_INTERVAL_MS ?? 30_000);

interface Mention {
  platform: string;
  externalId: string;
  text: string;
  author: string;
  url?: string;
  timestamp: Date;
}

// ── Platform-specific mention fetchers ────────────────────────────────────────

async function fetchTwitterMentions(accessToken: string, keywords: string[]): Promise<Mention[]> {
  if (!keywords.length) return [];
  const query = encodeURIComponent(keywords.map(k => `(${k})`).join(" OR ") + " -is:retweet");
  const r = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10&tweet.fields=created_at,author_id,text`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!r.ok) return [];
  const data = await r.json() as any;
  return (data?.data ?? []).map((t: any) => ({
    platform: "twitter",
    externalId: t.id,
    text: t.text,
    author: t.author_id,
    url: `https://twitter.com/i/web/status/${t.id}`,
    timestamp: new Date(t.created_at),
  }));
}

async function fetchRedditMentions(keywords: string[]): Promise<Mention[]> {
  if (!keywords.length) return [];
  // Reddit search — public, no auth required for search
  const q = encodeURIComponent(keywords.join(" OR "));
  const r = await fetch(
    `https://www.reddit.com/search.json?q=${q}&sort=new&limit=10&t=day`,
    { headers: { "User-Agent": "AtlasUX/1.0" } }
  );
  if (!r.ok) return [];
  const data = await r.json() as any;
  return (data?.data?.children ?? []).map((c: any) => ({
    platform: "reddit",
    externalId: c.data.id,
    text: c.data.title,
    author: c.data.author,
    url: `https://reddit.com${c.data.permalink}`,
    timestamp: new Date(c.data.created_utc * 1000),
  }));
}

// ── Job processor ─────────────────────────────────────────────────────────────

async function processListeningJobs() {
  const jobs = await prisma.job.findMany({
    where: { jobType: "LISTENING_START", status: "queued" },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  for (const job of jobs) {
    await prisma.job.update({ where: { id: job.id }, data: { status: "running", startedAt: new Date() } });

    const input = job.input as any;
    const plan: any[] = Array.isArray(input?.plan) ? input.plan : [];
    const tenantId = job.tenantId;

    // Get listening keywords from assets
    const assets = await prisma.asset.findMany({
      where: { tenantId },
      select: { name: true, platform: true },
      take: 20,
    });
    const keywords = [...new Set(assets.map(a => a.name).filter(Boolean))].slice(0, 5);

    let totalMentions = 0;
    const errors: string[] = [];

    for (const planItem of plan) {
      const platform = String(planItem?.platform ?? "").toLowerCase();
      if (!planItem?.connected) continue;

      try {
        const integration = await prisma.integration.findFirst({
          where: { tenantId, provider: platform as any, connected: true },
        });
        if (!integration?.access_token) continue;

        let mentions: Mention[] = [];

        if (platform === "twitter" || platform === "x") {
          mentions = await fetchTwitterMentions(integration.access_token, keywords);
        } else if (platform === "reddit") {
          mentions = await fetchRedditMentions(keywords);
        }
        // Add more platforms as OAuth flows are completed

        for (const m of mentions) {
          // Deduplicate: skip if we already stored this mention
          const existingCount = await prisma.distributionEvent.count({
            where: {
              tenantId,
              channel: m.platform,
              eventType: "MENTION",
              meta: { path: ["externalId"], equals: m.externalId },
            },
          });
          if (existingCount > 0) continue;

          await prisma.distributionEvent.create({
            data: {
              tenantId,
              agent: "atlas",
              channel: m.platform,
              eventType: "MENTION",
              url: m.url ?? null,
              meta: { externalId: m.externalId, text: m.text, author: m.author },
              occurredAt: m.timestamp,
            },
          });
          totalMentions++;
        }
      } catch (err: any) {
        errors.push(`${platform}: ${err?.message}`);
      }
    }

    // Also check Reddit mentions without auth (public)
    if (keywords.length > 0) {
      try {
        const redditMentions = await fetchRedditMentions(keywords);
        for (const m of redditMentions) {
          const existingCount = await prisma.distributionEvent.count({
            where: {
              tenantId,
              channel: "reddit",
              eventType: "MENTION",
              meta: { path: ["externalId"], equals: m.externalId },
            },
          });
          if (existingCount > 0) continue;

          await prisma.distributionEvent.create({
            data: {
              tenantId,
              agent: "atlas",
              channel: "reddit",
              eventType: "MENTION",
              url: m.url ?? null,
              meta: { externalId: m.externalId, text: m.text, author: m.author },
              occurredAt: m.timestamp,
            },
          });
          totalMentions++;
        }
      } catch {
        // non-fatal
      }
    }

    const status = errors.length && !totalMentions ? "failed" : "succeeded";
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status,
        finishedAt: new Date(),
        output: { totalMentions, errors, keywords },
        ...(status === "failed" ? { error: { message: errors.join("; ") } } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: null,
        level: "info",
        action: "LISTENING_COMPLETED",
        entityType: "job",
        entityId: job.id,
        message: `Listening scan complete. ${totalMentions} new mentions found.`,
        meta: { totalMentions, keywords, errors },
        timestamp: new Date(),
      },
    }).catch(() => null);

    console.log(`[socialMonitor] Job ${job.id}: ${totalMentions} mentions found`);
  }
}

// ── GET /v1/listening/mentions endpoint support (data is in DistributionEvent) ─

console.log(`[socialMonitor] Starting. Polling every ${POLL_MS}ms`);

async function tick() {
  try { await processListeningJobs(); } catch (err) { console.error("[socialMonitor] tick error:", err); }
}

tick();
setInterval(tick, POLL_MS);
