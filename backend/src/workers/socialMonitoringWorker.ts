/**
 * Social Monitoring Worker — continuous polling per-tenant.
 *
 * On each tick:
 *   1. Find all tenants that have listening active (most recent LISTENING_START/STOP job
 *      is a LISTENING_START with status succeeded/running/queued).
 *   2. For each active tenant, fetch their assets (social profiles + keywords).
 *   3. Extract meaningful keywords: parse URLs for usernames/handles, use keyword assets directly.
 *   4. Run Reddit public search (always — no OAuth needed).
 *   5. Run Twitter search IF tenant has a connected X integration with access_token.
 *   6. Store results as DistributionEvent records with eventType="MENTION".
 */
import { prisma } from "../db/prisma.js";

const POLL_MS = Number(process.env.SOCIAL_WORKER_INTERVAL_MS ?? 300_000);

interface Mention {
  platform: string;
  externalId: string;
  text: string;
  author: string;
  url?: string;
  timestamp: Date;
}

// ── Keyword extraction ─────────────────────────────────────────────────────────

function extractKeywords(assets: Array<{ name: string; url: string; type: string }>): string[] {
  const kw = new Set<string>();
  for (const a of assets) {
    if (a.type === "keyword") {
      // Direct keyword asset — use name as-is
      const term = a.name.trim();
      if (term) kw.add(term);
    } else {
      // Extract username/handle from URL
      try {
        const u = new URL(a.url);
        const parts = u.pathname.split("/").filter(Boolean);
        const handle = parts[0]?.replace(/^@/, "");
        if (handle && handle.length > 1 && handle.length < 50) kw.add(handle);
      } catch { /* skip bad URLs */ }
    }
  }
  return [...kw].slice(0, 10);
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

// ── Deduplication helper ───────────────────────────────────────────────────────

async function storeMention(tenantId: string, m: Mention): Promise<boolean> {
  const existingCount = await prisma.distributionEvent.count({
    where: {
      tenantId,
      channel: m.platform,
      eventType: "MENTION",
      meta: { path: ["externalId"], equals: m.externalId },
    },
  });
  if (existingCount > 0) return false;

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
  return true;
}

// ── Find active tenants ────────────────────────────────────────────────────────

async function getActiveListeningTenants(): Promise<string[]> {
  // Get all tenants that have any LISTENING_START or LISTENING_STOP jobs
  const recentJobs = await prisma.job.findMany({
    where: {
      jobType: { in: ["LISTENING_START", "LISTENING_STOP"] },
      status: { in: ["queued", "running", "succeeded"] as any },
    },
    orderBy: { createdAt: "desc" },
    select: { tenantId: true, jobType: true, createdAt: true },
  });

  // Group by tenant, keeping only the most recent job per tenant
  const latestByTenant = new Map<string, string>();
  for (const j of recentJobs) {
    if (!latestByTenant.has(j.tenantId)) {
      latestByTenant.set(j.tenantId, j.jobType);
    }
  }

  // Return tenants whose most recent job is LISTENING_START
  const active: string[] = [];
  for (const [tenantId, jobType] of latestByTenant) {
    if (jobType === "LISTENING_START") active.push(tenantId);
  }
  return active;
}

// ── Process one tenant ─────────────────────────────────────────────────────────

async function processOneTenant(tenantId: string): Promise<number> {
  // Fetch assets (social profiles + keywords)
  const assets = await prisma.asset.findMany({
    where: { tenantId, type: { in: ["social", "social_profile", "app", "keyword"] as any } },
    select: { name: true, url: true, type: true, platform: true },
    take: 100,
  });

  const keywords = extractKeywords(assets);
  if (!keywords.length) return 0;

  let totalNew = 0;

  // Always run Reddit search (public, no auth needed)
  try {
    const redditMentions = await fetchRedditMentions(keywords);
    for (const m of redditMentions) {
      if (await storeMention(tenantId, m)) totalNew++;
    }
  } catch (err) {
    console.error(`[socialMonitor] Reddit error for tenant ${tenantId}:`, err);
  }

  // Run Twitter search if tenant has a connected X integration
  try {
    const xIntegration = await prisma.integration.findFirst({
      where: { tenantId, provider: "x" as any, connected: true },
    });
    if (xIntegration?.access_token) {
      const twitterMentions = await fetchTwitterMentions(xIntegration.access_token, keywords);
      for (const m of twitterMentions) {
        if (await storeMention(tenantId, m)) totalNew++;
      }
    }
  } catch (err) {
    console.error(`[socialMonitor] Twitter error for tenant ${tenantId}:`, err);
  }

  return totalNew;
}

// ── Also process any remaining queued LISTENING_START jobs ──────────────────────

async function claimQueuedJobs() {
  const jobs = await prisma.job.findMany({
    where: { jobType: "LISTENING_START", status: "queued" },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  for (const job of jobs) {
    const claimed = await prisma.job.updateMany({
      where: { id: job.id, status: "queued" },
      data: { status: "succeeded", startedAt: new Date(), finishedAt: new Date() },
    });
    if (claimed.count !== 1) continue;
    console.log(`[socialMonitor] Claimed job ${job.id} for tenant ${job.tenantId}`);
  }
}

// ── Main tick ──────────────────────────────────────────────────────────────────

async function tick() {
  try {
    // Claim any queued jobs so they count as "active" for the tenant
    await claimQueuedJobs();

    const tenants = await getActiveListeningTenants();
    if (!tenants.length) return;

    for (const tenantId of tenants) {
      try {
        const found = await processOneTenant(tenantId);
        if (found > 0) {
          console.log(`[socialMonitor] Tenant ${tenantId}: ${found} new mentions`);
        }
      } catch (err) {
        console.error(`[socialMonitor] Error processing tenant ${tenantId}:`, err);
      }
    }
  } catch (err) {
    console.error("[socialMonitor] tick error:", err);
  }
}

console.log(`[socialMonitor] Starting. Polling every ${POLL_MS}ms (${Math.round(POLL_MS / 1000)}s)`);
tick();
setInterval(tick, POLL_MS);
