/**
 * Scheduler Worker — fully autonomous Atlas agent cadence.
 *
 * Every agent fires on a real daily or weekly schedule without manual triggers.
 * Atlas is never "just waiting" — the workforce runs itself.
 *
 * Schedule overview (all times UTC):
 *
 *   PHASE 1 — Platform Intel Sweep (05:00–05:36 UTC, agents collect hot takes):
 *   05:00  Kelly   X Hot Topics            WF-093  daily
 *   05:03  Fran    Facebook Trends         WF-094  daily
 *   05:06  Dwight  Threads Trends          WF-095  daily
 *   05:09  Timmy   TikTok Trends           WF-096  daily
 *   05:12  Terry   Tumblr Trends           WF-097  daily
 *   05:15  Cornwall Pinterest Trends       WF-098  daily
 *   05:18  Link    LinkedIn Trends         WF-099  daily
 *   05:21  Emma    Alignable Trends        WF-100  daily
 *   05:24  Donna   Reddit Trends           WF-101  daily
 *   05:27  Reynolds Blog SEO Trends        WF-102  daily
 *   05:30  Penny   FB Ads Intel            WF-103  daily
 *   05:33  Archy   Instagram Intel         WF-104  daily
 *   05:36  Venny   YouTube Intel           WF-105  daily
 *
 *   PHASE 2 — Aggregation (05:45 UTC, Atlas reads all reports → assigns tasks):
 *   05:45  Atlas   Aggregation & Task Assign WF-106  daily
 *
 *   PHASE 3 — Research & Intelligence:
 *   06:00  Binky Research Digest          WF-031  daily
 *   07:00  Daily-Intel Morning Brief       WF-033  daily
 *   07:30  Archy Research Deep-Dive        WF-034  daily
 *   08:00  Claire Calendar Prep            WF-088  daily
 *   08:30  Daily Executive Brief (Atlas)   WF-010  daily
 *   09:00  Timmy TikTok Content Draft      WF-054  daily
 *   09:15  Fran Facebook Page Post         WF-057  daily
 *   09:30  Dwight Threads Post             WF-055  daily
 *   10:00  Terry Tumblr Post               WF-049  daily
 *   10:30  Kelly X Auto-DM check           WF-042  daily
 *   11:00  Link LinkedIn Scheduled Post    WF-045  daily
 *   11:30  Cornwall Pinterest Pins         WF-048  daily
 *   12:00  Donna Reddit Monitor            WF-051  daily
 *   14:00  Donna Reddit Engagement Scan    WF-052  daily
 *   15:00  Venny Image Asset Pipeline      WF-059  daily
 *   13:00  Reynolds Blog Write & Publish   WF-108  Wednesday only
 *   16:00  Reynolds Blog → LinkedIn & X    WF-041  daily
 *   17:00  Penny Multi-Platform Content    WF-040  daily
 *   18:00  Sunday Technical Brief Writer   WF-058  daily
 *   19:00  Victor Video Production Check   WF-089  daily
 *
 *   Monday 07:00  Mercer Acquisition Intel WF-063  weekly
 *   Monday 07:30  Petra Sprint Planning    WF-084  weekly
 *   Monday 08:00  Emma Alignable Update    WF-056  weekly
 *   Monday 08:30  Sandy CRM Sync check     WF-085  weekly
 *   Monday 09:00  Porter SharePoint Sync   WF-087  weekly
 *
 *   Friday 15:00  Larry Audit Gate         WF-072  weekly
 *   Friday 15:30  Tina Finance Risk Gate   WF-073  weekly
 *   Friday 16:00  Frank Form Aggregator    WF-086  weekly
 *
 * De-duplication: last-fired date stored in system_state "scheduler:{id}".
 * Weekly jobs use "scheduler:{id}:{YYYY-Www}" as the key to de-dup per ISO week.
 * Intel sweep staggered 3 min apart; tick window is ±1 min so all fire cleanly.
 *
 * Env:
 *   SCHEDULER_ENABLED   set to "false" to pause all jobs
 *   SCHEDULER_POLL_MS   polling interval (default 60 000)
 */

import { prisma } from "../db/prisma.js";
import { getSystemState, setSystemState } from "../services/systemState.js";

const POLL_MS = Math.max(15_000, Number(process.env.SCHEDULER_POLL_MS ?? 60_000));
const TENANT_ID = process.env.TENANT_ID ?? "";
if (!TENANT_ID) {
  console.warn("[scheduler] TENANT_ID not set — using fallback. Set TENANT_ID env var for production.");
}
const RESOLVED_TENANT_ID = TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

type ScheduledJob = {
  id: string;
  label: string;
  agentId: string;
  workflowId: string;
  payload: Record<string, unknown>;
  hourUTC: number;
  minuteUTC: number;
  /** 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat — omit for daily */
  dayOfWeek?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/** ISO week string for weekly de-duplication e.g. "2026-W08" */
function isoWeekUTC(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function dedupeKey(job: ScheduledJob): string {
  return job.dayOfWeek !== undefined
    ? `scheduler:${job.id}:${isoWeekUTC()}`
    : `scheduler:${job.id}`;
}

async function getLastFiredToken(key: string): Promise<string | null> {
  try {
    const row = await getSystemState(key);
    const v = row?.value;
    if (v && typeof v === "object" && !Array.isArray(v)) return (v as any).token ?? null;
    return null;
  } catch { return null; }
}

async function markFired(key: string, token: string) {
  await setSystemState(key, { token });
}

async function fireJob(job: ScheduledJob) {
  const intent = await prisma.intent.create({
    data: {
      tenantId: RESOLVED_TENANT_ID,
      agentId: null,
      intentType: "ENGINE_RUN",
      payload: JSON.parse(JSON.stringify({
        agentId: job.agentId,
        workflowId: job.workflowId,
        input: job.payload,
        traceId: `scheduler-${job.id}-${todayUTC()}`,
        requestedBy: RESOLVED_TENANT_ID,
      })),
      status: "DRAFT",
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: RESOLVED_TENANT_ID,
      actorType: "system",
      actorUserId: null,
      actorExternalId: "scheduler",
      level: "info",
      action: "SCHEDULER_JOB_FIRED",
      entityType: "intent",
      entityId: intent.id,
      message: `Scheduler fired ${job.label}`,
      meta: { jobId: job.id, workflowId: job.workflowId, agentId: job.agentId, intentId: intent.id },
      timestamp: new Date(),
    },
  }).catch(() => null);

  console.log(`[scheduler] ✓ ${job.label} → intent ${intent.id}`);
}

// ── Full Job Catalog ──────────────────────────────────────────────────────────

function buildJobs(): ScheduledJob[] {
  return [

    // ── PHASE 1: Morning Platform Intel Sweep (05:00–05:36 UTC) ──────────────
    {
      id: "kelly-x-intel",
      label: "Kelly X (Twitter) Hot Topics Intel (WF-093)",
      agentId: "kelly", workflowId: "WF-093",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 0,
    },
    {
      id: "fran-facebook-intel",
      label: "Fran Facebook Trending Topics Intel (WF-094)",
      agentId: "fran", workflowId: "WF-094",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 3,
    },
    {
      id: "dwight-threads-intel",
      label: "Dwight Threads Trending Topics Intel (WF-095)",
      agentId: "dwight", workflowId: "WF-095",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 6,
    },
    {
      id: "timmy-tiktok-intel",
      label: "Timmy TikTok Trending Sounds & Topics Intel (WF-096)",
      agentId: "timmy", workflowId: "WF-096",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 9,
    },
    {
      id: "terry-tumblr-intel",
      label: "Terry Tumblr Trending Tags Intel (WF-097)",
      agentId: "terry", workflowId: "WF-097",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 12,
    },
    {
      id: "cornwall-pinterest-intel",
      label: "Cornwall Pinterest Trending Pins Intel (WF-098)",
      agentId: "cornwall", workflowId: "WF-098",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 15,
    },
    {
      id: "link-linkedin-intel",
      label: "Link LinkedIn Professional Trends Intel (WF-099)",
      agentId: "link", workflowId: "WF-099",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 18,
    },
    {
      id: "emma-alignable-intel",
      label: "Emma Alignable Local Business Topics Intel (WF-100)",
      agentId: "emma", workflowId: "WF-100",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 21,
    },
    {
      id: "donna-reddit-intel",
      label: "Donna Reddit Hot Threads & Subreddit Intel (WF-101)",
      agentId: "donna", workflowId: "WF-101",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 24,
    },
    {
      id: "reynolds-blog-intel",
      label: "Reynolds Blog SEO Trending Topics Intel (WF-102)",
      agentId: "reynolds", workflowId: "WF-102",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 27,
    },
    {
      id: "penny-ads-intel",
      label: "Penny Facebook Ads Trending Formats Intel (WF-103)",
      agentId: "penny", workflowId: "WF-103",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 30,
    },
    {
      id: "archy-instagram-intel",
      label: "Archy Instagram & Visual Trends Intel (WF-104)",
      agentId: "archy", workflowId: "WF-104",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 33,
    },
    {
      id: "venny-youtube-intel",
      label: "Venny YouTube & Visual Media Trending Topics Intel (WF-105)",
      agentId: "venny", workflowId: "WF-105",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 5, minuteUTC: 36,
    },

    // ── PHASE 2: Atlas Aggregation & Task Assignment (05:45 UTC) ─────────────
    {
      id: "atlas-aggregation",
      label: "Atlas Daily Aggregation & Agent Task Assignment (WF-106)",
      agentId: "atlas", workflowId: "WF-106",
      payload: { triggeredBy: "scheduler", topic: "aggregate platform intel and assign daily tasks" },
      hourUTC: 5, minuteUTC: 45,
    },

    // ── Daily: Research & Intelligence ───────────────────────────────────────
    {
      id: "binky-research",
      label: "Binky Daily Research Digest (WF-031)",
      agentId: "binky", workflowId: "WF-031",
      payload: { triggeredBy: "scheduler" },
      hourUTC: Number(process.env.BINKY_RESEARCH_HOUR_UTC ?? 6), minuteUTC: 0,
    },
    {
      id: "daily-intel-brief",
      label: "Daily-Intel Morning Brief Aggregator (WF-033)",
      agentId: "daily-intel", workflowId: "WF-033",
      payload: { triggeredBy: "scheduler", topic: "daily intelligence briefing" },
      hourUTC: 7, minuteUTC: 0,
    },
    {
      id: "archy-research",
      label: "Archy Research Deep-Dive (WF-034)",
      agentId: "archy", workflowId: "WF-034",
      payload: { triggeredBy: "scheduler", topic: "competitor and industry deep-dive" },
      hourUTC: 7, minuteUTC: 30,
    },

    // ── Daily: Calendar & Operations ─────────────────────────────────────────
    {
      id: "claire-calendar",
      label: "Claire Calendar Prep & Agenda Builder (WF-088)",
      agentId: "claire", workflowId: "WF-088",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 8, minuteUTC: 0,
    },

    // ── Daily: Executive Brief ────────────────────────────────────────────────
    {
      id: "daily-brief",
      label: "Daily Executive Brief (WF-010)",
      agentId: "binky", workflowId: "WF-010",
      payload: { triggeredBy: "scheduler" },
      hourUTC: Number(process.env.DAILY_BRIEF_HOUR_UTC ?? 8),
      minuteUTC: Number(process.env.DAILY_BRIEF_MINUTE_UTC ?? 30),
    },

    // ── Daily: Social Media Publishers ───────────────────────────────────────
    {
      id: "timmy-tiktok",
      label: "Timmy TikTok Content Draft (WF-054)",
      agentId: "timmy", workflowId: "WF-054",
      payload: { triggeredBy: "scheduler", topic: "Atlas UX TikTok content for today" },
      hourUTC: 9, minuteUTC: 0,
    },
    {
      id: "fran-facebook",
      label: "Fran Facebook Page Publisher (WF-057)",
      agentId: "fran", workflowId: "WF-057",
      payload: { triggeredBy: "scheduler", topic: "Atlas UX Facebook page post for today" },
      hourUTC: 9, minuteUTC: 15,
    },
    {
      id: "dwight-threads",
      label: "Dwight Threads Post Publisher (WF-055)",
      agentId: "dwight", workflowId: "WF-055",
      payload: { triggeredBy: "scheduler", topic: "Atlas UX Threads post for today" },
      hourUTC: 9, minuteUTC: 30,
    },
    {
      id: "terry-tumblr",
      label: "Terry Tumblr Post Publisher (WF-049)",
      agentId: "terry", workflowId: "WF-049",
      payload: { triggeredBy: "scheduler", topic: "Atlas UX Tumblr post for today" },
      hourUTC: 10, minuteUTC: 0,
    },
    {
      id: "kelly-x",
      label: "Kelly X (Twitter) Auto-DM & Post (WF-042)",
      agentId: "kelly", workflowId: "WF-042",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 10, minuteUTC: 30,
    },
    {
      id: "link-linkedin",
      label: "Link LinkedIn Scheduled Post (WF-045)",
      agentId: "link", workflowId: "WF-045",
      payload: { triggeredBy: "scheduler", topic: "Atlas UX LinkedIn content for today" },
      hourUTC: 11, minuteUTC: 0,
    },
    {
      id: "cornwall-pinterest",
      label: "Cornwall Pinterest Asset Publisher (WF-048)",
      agentId: "cornwall", workflowId: "WF-048",
      payload: { triggeredBy: "scheduler", topic: "Atlas UX Pinterest pins for today" },
      hourUTC: 11, minuteUTC: 30,
    },
    {
      id: "donna-reddit-monitor",
      label: "Donna Reddit Subreddit Monitor (WF-051)",
      agentId: "donna", workflowId: "WF-051",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 12, minuteUTC: 0,
    },
    {
      id: "donna-reddit-engage",
      label: "Donna Reddit Engagement Scanner (WF-052)",
      agentId: "donna", workflowId: "WF-052",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 14, minuteUTC: 0,
    },
    {
      id: "venny-images",
      label: "Venny Image Asset Production Pipeline (WF-059)",
      agentId: "venny", workflowId: "WF-059",
      payload: { triggeredBy: "scheduler", topic: "daily social image assets" },
      hourUTC: 15, minuteUTC: 0,
    },
    {
      id: "reynolds-blog",
      label: "Reynolds Blog → LinkedIn & X Auto-Post (WF-041)",
      agentId: "reynolds", workflowId: "WF-041",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 16, minuteUTC: 0,
    },
    {
      id: "penny-multiplatform",
      label: "Penny Multi-Platform Social Content Creator (WF-040)",
      agentId: "penny", workflowId: "WF-040",
      payload: { triggeredBy: "scheduler", topic: "Atlas UX daily content run" },
      hourUTC: 17, minuteUTC: 0,
    },
    {
      id: "sunday-brief",
      label: "Sunday Technical Brief & Comms Writer (WF-058)",
      agentId: "sunday", workflowId: "WF-058",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 18, minuteUTC: 0,
    },
    {
      id: "victor-video",
      label: "Victor Video Production Pipeline (WF-089)",
      agentId: "victor", workflowId: "WF-089",
      payload: { triggeredBy: "scheduler", topic: "daily video production check" },
      hourUTC: 19, minuteUTC: 0,
    },

    // ── Weekly (Monday): Strategy & Planning ─────────────────────────────────
    {
      id: "mercer-acquisition",
      label: "Mercer Acquisition Intelligence Report (WF-063)",
      agentId: "mercer", workflowId: "WF-063",
      payload: { triggeredBy: "scheduler", topic: "weekly acquisition intelligence" },
      hourUTC: 7, minuteUTC: 0, dayOfWeek: 1,
    },
    {
      id: "petra-sprint",
      label: "Petra Sprint Planning & Task Assignment (WF-084)",
      agentId: "petra", workflowId: "WF-084",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 7, minuteUTC: 30, dayOfWeek: 1,
    },
    {
      id: "emma-alignable",
      label: "Emma Alignable Business Updater (WF-056)",
      agentId: "emma", workflowId: "WF-056",
      payload: { triggeredBy: "scheduler", topic: "Atlas UX weekly Alignable update" },
      hourUTC: 8, minuteUTC: 0, dayOfWeek: 1,
    },
    {
      id: "sandy-crm",
      label: "Sandy Appointment Confirmation & CRM Sync (WF-085)",
      agentId: "sandy", workflowId: "WF-085",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 8, minuteUTC: 30, dayOfWeek: 1,
    },
    {
      id: "porter-sharepoint",
      label: "Porter SharePoint Intranet Updater (WF-087)",
      agentId: "porter", workflowId: "WF-087",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 9, minuteUTC: 0, dayOfWeek: 1,
    },
    {
      id: "atlas-tool-discovery",
      label: "Atlas Tool Discovery & Proposal (WF-107)",
      agentId: "atlas", workflowId: "WF-107",
      payload: { triggeredBy: "scheduler", topic: "discover and propose new tools for all agents" },
      hourUTC: 6, minuteUTC: 0, dayOfWeek: 1, // Monday 06:00 UTC — before the workday starts
    },
    {
      id: "reynolds-blog-publish",
      label: "Reynolds Blog Writer & Publisher (WF-108)",
      agentId: "reynolds", workflowId: "WF-108",
      payload: { triggeredBy: "scheduler", category: "AI Automation" },
      hourUTC: 13, minuteUTC: 0, dayOfWeek: 3, // Wednesday 13:00 UTC — peak blog engagement
    },

    // ── Weekly (Friday): Compliance & Finance ────────────────────────────────
    {
      id: "larry-audit",
      label: "Larry Audit Intake & Compliance Gate (WF-072)",
      agentId: "larry", workflowId: "WF-072",
      payload: { triggeredBy: "scheduler", subject: "Weekly compliance audit review" },
      hourUTC: 15, minuteUTC: 0, dayOfWeek: 5,
    },
    {
      id: "tina-finance",
      label: "Tina Finance Intake & Risk Gate (WF-073)",
      agentId: "tina", workflowId: "WF-073",
      payload: { triggeredBy: "scheduler", subject: "Weekly financial risk review" },
      hourUTC: 15, minuteUTC: 30, dayOfWeek: 5,
    },
    {
      id: "frank-forms",
      label: "Frank Form Response Aggregator (WF-086)",
      agentId: "frank", workflowId: "WF-086",
      payload: { triggeredBy: "scheduler" },
      hourUTC: 16, minuteUTC: 0, dayOfWeek: 5,
    },
  ];
}

// ── Tick ─────────────────────────────────────────────────────────────────────

async function tick() {
  if (process.env.SCHEDULER_ENABLED === "false") return;

  const now = new Date();
  const hourNow    = now.getUTCHours();
  const minuteNow  = now.getUTCMinutes();
  const dayNow     = now.getUTCDay();
  const dateNow    = todayUTC();
  const weekNow    = isoWeekUTC();

  for (const job of buildJobs()) {
    // Day-of-week gate (weekly jobs)
    if (job.dayOfWeek !== undefined && dayNow !== job.dayOfWeek) continue;

    // Time window gate (fire within ±1 min of target)
    if (hourNow !== job.hourUTC) continue;
    if (Math.abs(minuteNow - job.minuteUTC) > 1) continue;

    // De-duplication
    const key   = dedupeKey(job);
    const token = job.dayOfWeek !== undefined ? weekNow : dateNow;
    const last  = await getLastFiredToken(key);
    if (last === token) continue;

    try {
      await fireJob(job);
      await markFired(key, token);
    } catch (err: any) {
      console.error(`[scheduler] ✗ ${job.label}: ${err?.message ?? err}`);
    }
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────

const DAILY_COUNT  = buildJobs().filter(j => j.dayOfWeek === undefined).length;
const WEEKLY_COUNT = buildJobs().filter(j => j.dayOfWeek !== undefined).length;

console.log(`[scheduler] Starting — ${DAILY_COUNT} daily jobs, ${WEEKLY_COUNT} weekly jobs. Poll: ${POLL_MS / 1000}s`);

async function run() {
  try { await tick(); } catch (err) { console.error("[scheduler] tick error:", err); }
}

run();
setInterval(run, POLL_MS);
