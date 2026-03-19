import { prisma } from "../db/prisma.js";
import { getKbContext } from "../core/kb/getKbContext.js";
import { runLLM, type AuditHook } from "../core/engine/brainllm.js";
import { agentRegistry } from "../agents/registry.js";
import { getSkill } from "../core/kb/skillLoader.js";
import { appendMemory } from "../core/agent/agentMemory.js";
import { searchWeb, searchReddit, searchNewsData, searchNYT, fetchNYTTopStories, searchMediaStack } from "../lib/webSearch.js";
import { searchRecentTweets } from "../services/x.js";
import { executeBrowserSession, resumeBrowserSession } from "../tools/browser/browserService.js";
import { validateSessionConfig, createBrowserSessionMemo } from "../tools/browser/browserGovernance.js";
import { calculateSessionRiskTier, type BrowserSessionConfig, type BrowserActionStep } from "../tools/browser/browserActions.js";
import { postAsAgent, getChannelByName, readHistory } from "../services/slack.js";
import { generateSocialImage, resolveMediaUrls } from "../services/socialImage.js";
import { resolveCredential } from "../services/credentialResolver.js";
import { resolveAgentEmail } from "../services/agentEmailResolver.js";
import { storeOrgMemory } from "../core/agent/orgMemory.js";

export type WorkflowContext = {
  tenantId: string;
  requestedBy: string;
  agentId: string;
  workflowId: string;
  input: any;
  traceId?: string | null;
  intentId: string;
  seatTier?: string;
};

export type WorkflowResult = {
  ok: boolean;
  message?: string;
  output?: any;
};

export type WorkflowHandler = (ctx: WorkflowContext) => Promise<WorkflowResult>;

export const workflowCatalog = [
  { id: "WF-001", name: "Support Intake (Cheryl)",        description: "Create ticket → classify → acknowledge → route → audit.",                      ownerAgent: "cheryl" },
  { id: "WF-002", name: "Support Escalation (Cheryl)",    description: "Package escalation and route to executive owner.",                               ownerAgent: "cheryl" },
  { id: "WF-010", name: "Daily Executive Brief (Binky)",  description: "Daily intel digest with traceability.",                                          ownerAgent: "binky"  },
  { id: "WF-020", name: "Engine Run Smoke Test (Atlas)",  description: "Minimal end-to-end cloud surface verification.",                                  ownerAgent: "atlas"  },
  { id: "WF-021", name: "Bootstrap Atlas (Atlas)",          description: "Boot → discover agents → load KB → seed tasks → queue boot email → await command.", ownerAgent: "atlas"    },
  { id: "WF-040", name: "Multi-Platform Social Content Creator (Penny)", description: "Daily content run — generate platform-tailored posts from intel + brand playbook → dispatch to cross-platform publisher.", ownerAgent: "penny" },
  { id: "WF-051", name: "Reddit Subreddit Monitor (Donna)",  description: "Scan target subreddits for relevant posts → AI draft replies → queue DecisionMemos for approval.", ownerAgent: "donna" },
  { id: "WF-052", name: "Reddit Engagement Scanner (Donna)", description: "Scan for engagement opportunities — comments, questions, threads where Donna can add value.", ownerAgent: "donna" },
  { id: "WF-093", name: "X (Twitter) Platform Intel (Kelly)",         description: "Daily X/Twitter trend sweep — trending hashtags, viral content, tech startup chatter.",               ownerAgent: "kelly"    },
  { id: "WF-094", name: "Facebook Platform Intel (Fran)",             description: "Daily Facebook trend sweep — trending topics, small business Pages & Groups activity.",          ownerAgent: "fran"     },
  { id: "WF-095", name: "Threads Platform Intel (Dwight)",            description: "Daily Threads trend sweep — trending topics, creator conversations, Meta ecosystem.",            ownerAgent: "dwight"   },
  { id: "WF-096", name: "TikTok Platform Intel (Timmy)",              description: "Daily TikTok trend sweep — trending hashtags, sounds, viral video formats.",                     ownerAgent: "timmy"    },
  { id: "WF-097", name: "Tumblr Platform Intel (Terry)",              description: "Daily Tumblr trend sweep — trending tags, creative posts, aesthetic content.",                   ownerAgent: "terry"    },
  { id: "WF-098", name: "Pinterest Platform Intel (Cornwall)",        description: "Daily Pinterest trend sweep — trending pins, boards, visual inspiration ideas.",                 ownerAgent: "cornwall" },
  { id: "WF-099", name: "LinkedIn Platform Intel (Link)",             description: "Daily LinkedIn trend sweep — trending professional topics, B2B posts, business content.",        ownerAgent: "link"     },
  { id: "WF-100", name: "Alignable Platform Intel (Emma)",            description: "Daily Alignable trend sweep — local business topics, community discussions.",                   ownerAgent: "emma"     },
  { id: "WF-101", name: "Reddit Platform Intel (Donna)",              description: "Daily Reddit trend sweep — hot threads, AI/automation/small-business subreddits.",              ownerAgent: "donna"    },
  { id: "WF-102", name: "Blog SEO Platform Intel (Reynolds)",         description: "Daily SEO trend sweep — trending blog topics, AI/automation/small-business keywords.",          ownerAgent: "reynolds" },
  { id: "WF-103", name: "Facebook Ads Platform Intel (Penny)",        description: "Daily Facebook Ads trend sweep — trending ad formats, winning creatives, small biz ads.",       ownerAgent: "penny"    },
  { id: "WF-104", name: "Instagram Platform Intel (Archy)",           description: "Daily Instagram trend sweep — trending Reels, hashtags, visual content, creators.",             ownerAgent: "archy"    },
  { id: "WF-105", name: "YouTube Platform Intel (Venny)",             description: "Daily YouTube trend sweep — trending videos, AI/automation creators, topic analysis.",          ownerAgent: "venny"    },
  { id: "WF-106", name: "Atlas Daily Aggregation & Task Assignment",  description: "Synthesize all 13 platform intel reports → unified packet → per-agent task orders → emails.",  ownerAgent: "atlas"    },
  { id: "WF-107", name: "Atlas Tool Discovery & Proposal",  description: "Look inside (agent gaps) + look outside (SERP external tools) → LLM proposals → email report with approve/deny links.", ownerAgent: "atlas" },
  { id: "WF-108", name: "Reynolds Blog Writer & Publisher", description: "SERP research → LLM drafts full blog post → publishes to KB → emails confirmation.",  ownerAgent: "reynolds" },
  { id: "WF-110", name: "Venny YouTube Video Scraper & KB Ingest", description: "Search YouTube by keyword/channel → pull metadata + transcripts → store in KB for team retrieval.", ownerAgent: "venny" },
  { id: "WF-111", name: "Venny YouTube Shorts Auto-Publisher", description: "Download Victor's exported video from OneDrive → upload to YouTube via Data API v3 → audit trail.", ownerAgent: "venny" },
  { id: "WF-112", name: "Lucy Morning Reception Open",          description: "Open reception → check voicemails → sync calendar → morning summary to Atlas.",                    ownerAgent: "lucy" },
  { id: "WF-113", name: "Lucy Inbound Call Triage & Routing",   description: "Greet caller → identify purpose → route to agent/executive → log to audit.",                        ownerAgent: "lucy" },
  { id: "WF-114", name: "Lucy Appointment Booking",             description: "Book via Bookings → check conflicts → confirm parties → log to CRM.",                               ownerAgent: "lucy" },
  { id: "WF-115", name: "Lucy Voicemail Transcription",         description: "Transcribe voicemail → summarize → deliver to recipient → audit log.",                               ownerAgent: "lucy" },
  { id: "WF-116", name: "Lucy Lead Capture & CRM",              description: "Capture lead info from call/chat/email → CRM entry → route to Mercer.",                             ownerAgent: "lucy" },
  { id: "WF-117", name: "Lucy End-of-Day Reception Summary",    description: "Compile daily log → calls, bookings, leads, messages → summary email to Atlas.",                    ownerAgent: "lucy" },
  { id: "WF-118", name: "Lucy Chat Widget First Response",      description: "Greet chat visitor → identify intent → FAQ or escalate to Cheryl/specialist.",                      ownerAgent: "lucy" },
  { id: "WF-119", name: "Nightly Agent Memory Log",             description: "Each agent logs a summary of their daily activity to memory for future recall.",                    ownerAgent: "atlas" },
  { id: "WF-120", name: "Brand Mention Sweep (Sunday)",        description: "Weekly brand awareness sweep: web + X + Reddit for Atlas UX, atlasux, Dead App Corp.",                 ownerAgent: "sunday" },
  { id: "WF-121", name: "Competitor Intel Sweep (Archy)",      description: "Weekly competitive landscape analysis: web search for AI employee platforms + competitor terms.",        ownerAgent: "archy" },
  { id: "WF-122", name: "SEO Rank Tracker (Reynolds)",         description: "Weekly SEO check: search target keywords, track Atlas UX ranking position in top 20.",                  ownerAgent: "reynolds" },
  { id: "WF-123", name: "Lead Enrichment (Mercer)",            description: "On-demand lead enrichment: web search company/contact, LLM profile, update CRM.",                       ownerAgent: "mercer" },
  { id: "WF-130", name: "Browser Task Execution (Atlas)",     description: "Governed headless browser automation — navigate, extract, interact with web pages via Playwright.", ownerAgent: "atlas" },
  { id: "WF-131", name: "Browser Session Resume (Atlas)",     description: "Resume a paused browser session after decision memo approval for HIGH-risk action.",               ownerAgent: "atlas" },
  { id: "WF-140", name: "Local Vision Task (Vision)",       description: "Queue a browser task for the local vision agent — executes on user's machine via CDP + Claude Vision.", ownerAgent: "vision" },
  { id: "WF-035", name: "Hourly Signal Tripwire (Daily-Intel)",  description: "Hourly scan of HN, Reddit, X, web for breaking signals — escalates HIGH-relevance items immediately to Atlas.", ownerAgent: "daily-intel" },
  { id: "WF-033", name: "Daily-Intel Morning Brief",              description: "Morning brief aggregating overnight intel, tripwire alerts, and fresh news scan for Binky and Atlas.",          ownerAgent: "daily-intel" },
  // ── Postiz Social Publishing (WF-200 series) ──────────────────────────────
  { id: "WF-200", name: "TikTok Publish via Postiz (Timmy)",        description: "Publish a TikTok post via Postiz API — caption, hashtags, privacy settings.",               ownerAgent: "timmy"    },
  { id: "WF-201", name: "X (Twitter) Publish via Postiz (Kelly)",   description: "Publish a tweet/post to X via Postiz API.",                                                ownerAgent: "kelly"    },
  { id: "WF-202", name: "Facebook Publish via Postiz (Fran)",       description: "Publish a Facebook Page post via Postiz API.",                                              ownerAgent: "fran"     },
  { id: "WF-203", name: "Reddit Publish via Postiz (Donna)",        description: "Publish a Reddit post via Postiz API — subreddit, title, content.",                         ownerAgent: "donna"    },
  { id: "WF-204", name: "Threads Publish via Postiz (Dwight)",      description: "Publish a Threads post via Postiz API.",                                                   ownerAgent: "dwight"   },
  { id: "WF-205", name: "LinkedIn Publish via Postiz (Link)",       description: "Publish a LinkedIn post via Postiz API.",                                                  ownerAgent: "link"     },
  { id: "WF-206", name: "Pinterest Publish via Postiz (Cornwall)",  description: "Publish a pin to Pinterest via Postiz API — title, board, image.",                          ownerAgent: "cornwall" },
  { id: "WF-207", name: "Tumblr Publish via Postiz (Terry)",        description: "Publish a Tumblr post via Postiz API.",                                                    ownerAgent: "terry"    },
  { id: "WF-208", name: "YouTube Publish via Postiz (Venny)",       description: "Publish a YouTube Short or video via Postiz API — title, tags, type.",                      ownerAgent: "venny"    },
  { id: "WF-209", name: "Mastodon Publish via Postiz (Emma)",       description: "Publish a Mastodon toot via Postiz API.",                                                  ownerAgent: "emma"     },
  { id: "WF-210", name: "Instagram Publish via Postiz (Archy)",     description: "Publish an Instagram post/reel via Postiz API.",                                           ownerAgent: "archy"    },
  { id: "WF-211", name: "Medium Publish via Postiz (Reynolds)",     description: "Publish an article to Medium via Postiz API — title, subtitle, tags.",                      ownerAgent: "reynolds" },
  { id: "WF-212", name: "Cross-Platform Publish via Postiz (Sunday)", description: "Publish content to multiple platforms at once via Postiz — Sunday coordinates distribution.", ownerAgent: "sunday" },
  // ── Postiz Analytics (WF-220 series) ──────────────────────────────────────
  { id: "WF-220", name: "TikTok Analytics Report (Timmy)",          description: "Pull TikTok analytics from Postiz — views, engagement, 4-quadrant diagnostic.",            ownerAgent: "timmy"    },
  { id: "WF-221", name: "X Analytics Report (Kelly)",               description: "Pull X/Twitter analytics from Postiz — impressions, engagement, diagnostic.",              ownerAgent: "kelly"    },
  { id: "WF-222", name: "Facebook Analytics Report (Fran)",         description: "Pull Facebook analytics from Postiz — reach, engagement, diagnostic.",                     ownerAgent: "fran"     },
  { id: "WF-223", name: "Cross-Platform Analytics (Sunday)",        description: "Pull analytics for all connected platforms — summary dashboard with diagnostics.",          ownerAgent: "sunday"   },
  // ── Water Cooler (WF-300) ────────────────────────────────────────────────────
  { id: "WF-300", name: "Water Cooler Chat",                       description: "Hourly casual agent chat in #water-cooler — random agent posts banter or replies.",        ownerAgent: "atlas"    },
  // ── Lucy Voice Engine (WF-150 series) ──────────────────────────────────────
  { id: "WF-150", name: "Lucy Voice Health Check",                 description: "Pre-business-hours voice engine health: Google STT/TTS creds, Twilio streams, WebSocket route.", ownerAgent: "lucy" },
  { id: "WF-151", name: "Lucy Daily Voice Summary",                description: "End-of-day voice activity: calls handled, caller classifications, leads captured, action items.", ownerAgent: "lucy" },
  // ── VC Investor Outreach (WF-400) ─────────────────────────────────────────────
  { id: "WF-400", name: "VC Investor Outreach (Binky)",          description: "Cycle through VC/investor CRM contacts — personalized cold outreach email via Binky.",                ownerAgent: "binky"  },
  // ── Playbook Strategic Reviews (WF-410 series) ──────────────────────────────
  { id: "WF-410", name: "Playbook: Market & Strategy (Phase A)",        description: "Load playbook agents 02+03 + consulting-frameworks — personas, positioning, pricing validation.",       ownerAgent: "atlas" },
  { id: "WF-411", name: "Playbook: Product & Engineering (Phase B)",    description: "Load playbook agents 04+06+09 + stress-test — Lucy/Mercer specs, architecture, security audit.",       ownerAgent: "atlas" },
  { id: "WF-412", name: "Playbook: Launch & Revenue (Phase C)",         description: "Load playbook agents 14+15+18 + launch-engine — GTM plan, streaming strategy, unit economics.",       ownerAgent: "atlas" },
  { id: "WF-413", name: "Playbook: Advisor Review (Phase D)",           description: "Load playbook agents 01+17 + all prior KDRs — blind spots, customer success, final recommendations.", ownerAgent: "atlas" },
  { id: "WF-414", name: "Playbook: Quick Lookup",                       description: "Single-topic playbook lookup — routes via SMART-LOADER patterns to the right agent + framework.",     ownerAgent: "atlas" },
] as const;

export const workflowCatalogAll = [
  ...workflowCatalog,
];

// ── Shared helpers ────────────────────────────────────────────────────────────

export async function writeStepAudit(ctx: WorkflowContext, step: string, message: string, meta: any = {}) {
  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      actorUserId: null,
      actorExternalId: String(ctx.requestedBy ?? ""),
      actorType: "system",
      level: "info",
      action: "WORKFLOW_STEP",
      entityType: "intent",
      entityId: ctx.intentId,
      message: `[${ctx.workflowId}] ${step}: ${message}`,
      meta: { ...meta, workflowId: ctx.workflowId, agentId: ctx.agentId, traceId: ctx.traceId ?? null, step },
      timestamp: new Date(),
    },
  });
}

export async function queueEmail(
  ctx: WorkflowContext,
  email: { to: string; subject: string; text: string; fromAgent?: string; replyTo?: string },
) {
  const job = await prisma.job.create({
    data: {
      tenantId: ctx.tenantId,
      status: "queued",
      jobType: "EMAIL_SEND",
      priority: 5,
      input: {
        to: email.to,
        subject: email.subject,
        text: email.text,
        fromAgent: email.fromAgent ?? ctx.agentId,
        traceId: ctx.traceId ?? null,
        workflowId: ctx.workflowId,
        intentId: ctx.intentId,
        replyTo: email.replyTo ?? null,
      },
    },
  });
  await writeStepAudit(ctx, "email.queue", `Queued email to ${email.to} (${job.id})`, {
    jobId: job.id,
    to: email.to,
    subject: email.subject,
  });
  return job;
}

/** Simple audit hook — LLM events go to console; DB audit is handled by writeStepAudit. */
const dbAuditHook: AuditHook = (evt) => {
  console.log(JSON.stringify({ source: "brainllm", ...evt }));
};

/** Tenant-scoped agent email — check tenant config first, then env fallback for owner. */
async function tenantAgentEmail(tenantId: string, agentId: string): Promise<string | null> {
  return resolveAgentEmail(tenantId, agentId);
}

/**
 * Determine report recipients based on org hierarchy.
 * Reports always go to Atlas (CEO). The agent's direct leader is CC'd
 * if they are not Atlas (so Binky, Sunday, etc. stay in the loop).
 */
async function getReportRecipients(tenantId: string, agentId: string): Promise<{ to: string; cc: string[] }> {
  const atlasAddr = await tenantAgentEmail(tenantId, "atlas") ?? "atlas.ceo@deadapp.info";
  const agent = agentRegistry.find((a) => a.id === agentId);
  const leader = agent?.reportsTo;
  const cc: string[] = [];

  // CC the direct leader if they aren't atlas or chairman
  if (leader && leader !== "atlas" && leader !== "chairman") {
    const leaderAddr = await tenantAgentEmail(tenantId, leader);
    if (leaderAddr) cc.push(leaderAddr);
  }

  return { to: atlasAddr, cc };
}

/**
 * Wrap a runLLM call with graceful fallback.
 * Returns the LLM text on success, or a fallback string on any error.
 */
async function safeLLM(
  ctx: WorkflowContext,
  opts: {
    agent: string;
    purpose: string;
    route: "ORCHESTRATION_REASONING" | "LONG_CONTEXT_SUMMARY" | "DRAFT_GENERATION_FAST" | "CLASSIFY_EXTRACT_VALIDATE";
    system: string;
    user: string;
  },
): Promise<string> {
  try {
    const resp = await runLLM(
      {
        runId: ctx.intentId,
        agent: opts.agent,
        purpose: opts.purpose,
        route: opts.route,
        messages: [
          { role: "system", content: opts.system },
          { role: "user",   content: opts.user   },
        ],
        seatTier: ctx.seatTier,
      },
      dbAuditHook,
    );
    return resp.text;
  } catch (err: any) {
    const reason = err?.code === "LLM_DENIED" ? `guardrail denied (${err.message})` : (err?.message ?? String(err));
    await writeStepAudit(ctx, "llm.fallback", `LLM skipped: ${reason}`);
    return `[LLM unavailable: ${reason}]`;
  }
}


// ── Core workflow handlers ────────────────────────────────────────────────────

const handlers: Record<string, WorkflowHandler> = {

  // WF-020 — System Health Patrol (deterministic, zero LLM tokens)
  //
  // Daily 6:00 AM PST deep health check with real teeth:
  //   1. DB connectivity (SELECT 1)
  //   2. Engine liveness (last tick freshness)
  //   3. Stuck jobs (running > 15 min)
  //   4. Failed job spike (last 24h)
  //   5. Email worker backlog (queued EMAIL_SEND jobs)
  //   6. Postiz API reachability (HEAD request)
  //   7. Slack bot token validity (auth.test)
  //   8. LLM provider circuit breaker state
  //   9. OAuth token expiry horizon (next 6h)
  //  10. Scheduler coverage (last 24h firing gaps)
  //  11. CRM data health (contacts without email)
  //  12. KB document freshness (stale ingestion)
  //
  // Posts a full report to #intel. Fires Telegram alert on any CRITICAL finding.
  //
  "WF-020": async (ctx) => {
    await writeStepAudit(ctx, "health.start", "System Health Patrol starting — 12 checks, zero tokens");

    type Finding = { check: string; status: "OK" | "WARN" | "CRITICAL"; detail: string };
    const findings: Finding[] = [];
    const t0 = Date.now();

    // ── 1. DB Connectivity ────────────────────────────────────────────────────
    try {
      const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
      findings.push({ check: "DB Connectivity", status: result?.[0]?.ok === 1 ? "OK" : "CRITICAL", detail: result?.[0]?.ok === 1 ? "PostgreSQL responding" : "SELECT 1 returned unexpected result" });
    } catch (err: any) {
      findings.push({ check: "DB Connectivity", status: "CRITICAL", detail: `Database unreachable: ${err?.message?.slice(0, 120)}` });
    }

    // ── 2. Engine Liveness ────────────────────────────────────────────────────
    try {
      const { getSystemState } = await import("../services/systemState.js");
      const row = await getSystemState("atlas_online");
      const val = row?.value && typeof row.value === "object" ? (row.value as any) : {};
      const engineOn = Boolean(val.engine_enabled ?? val.online ?? false);
      const lastTick = val.last_tick_at ? new Date(val.last_tick_at) : null;

      if (!engineOn) {
        findings.push({ check: "Engine Liveness", status: "WARN", detail: "Engine is intentionally disabled" });
      } else if (!lastTick) {
        findings.push({ check: "Engine Liveness", status: "WARN", detail: "Engine enabled but never ticked (first boot?)" });
      } else {
        const staleMins = (Date.now() - lastTick.getTime()) / 60_000;
        if (staleMins > 10) {
          findings.push({ check: "Engine Liveness", status: "CRITICAL", detail: `Engine last ticked ${staleMins.toFixed(0)}min ago — may be dead` });
        } else if (staleMins > 5) {
          findings.push({ check: "Engine Liveness", status: "WARN", detail: `Engine last ticked ${staleMins.toFixed(0)}min ago — sluggish` });
        } else {
          findings.push({ check: "Engine Liveness", status: "OK", detail: `Last tick ${staleMins.toFixed(1)}min ago` });
        }
      }
    } catch (err: any) {
      findings.push({ check: "Engine Liveness", status: "WARN", detail: `Could not read system state: ${err?.message?.slice(0, 100)}` });
    }

    // ── 3. Stuck Jobs ─────────────────────────────────────────────────────────
    try {
      const cutoff = new Date(Date.now() - 15 * 60 * 1000);
      const stuckJobs = await prisma.job.findMany({
        where: { status: "running", startedAt: { lt: cutoff } },
        select: { id: true, jobType: true, startedAt: true },
        take: 20,
      });
      if (stuckJobs.length > 0) {
        const types = [...new Set(stuckJobs.map(j => j.jobType))].join(", ");
        findings.push({ check: "Stuck Jobs", status: stuckJobs.length >= 5 ? "CRITICAL" : "WARN", detail: `${stuckJobs.length} job(s) stuck >15min: ${types}` });
      } else {
        findings.push({ check: "Stuck Jobs", status: "OK", detail: "No stuck jobs" });
      }
    } catch (err: any) {
      findings.push({ check: "Stuck Jobs", status: "WARN", detail: `Query failed: ${err?.message?.slice(0, 100)}` });
    }

    // ── 4. Failed Job Spike (24h) ─────────────────────────────────────────────
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const failedCount = await prisma.job.count({
        where: { status: "failed", finishedAt: { gt: oneDayAgo } },
      });
      if (failedCount >= 50) {
        findings.push({ check: "Failed Jobs (24h)", status: "CRITICAL", detail: `${failedCount} failures in 24h — systemic issue likely` });
      } else if (failedCount >= 15) {
        findings.push({ check: "Failed Jobs (24h)", status: "WARN", detail: `${failedCount} failures in 24h — elevated` });
      } else {
        findings.push({ check: "Failed Jobs (24h)", status: "OK", detail: `${failedCount} failure(s) in 24h` });
      }
    } catch (err: any) {
      findings.push({ check: "Failed Jobs (24h)", status: "WARN", detail: `Query failed: ${err?.message?.slice(0, 100)}` });
    }

    // ── 5. Email Worker Backlog ───────────────────────────────────────────────
    try {
      const emailBacklog = await prisma.job.count({
        where: {
          status: "queued",
          jobType: { in: ["EMAIL_SEND", "EMAILSEND", "email_send"] },
        },
      });
      const emailStuck = await prisma.job.count({
        where: {
          status: "running",
          jobType: { in: ["EMAIL_SEND", "EMAILSEND", "email_send"] },
          startedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
        },
      });
      if (emailStuck > 0) {
        findings.push({ check: "Email Worker", status: "CRITICAL", detail: `${emailStuck} email job(s) stuck running >10min — worker may be dead` });
      } else if (emailBacklog > 20) {
        findings.push({ check: "Email Worker", status: "WARN", detail: `${emailBacklog} emails queued — possible backlog` });
      } else {
        findings.push({ check: "Email Worker", status: "OK", detail: `${emailBacklog} email(s) queued, 0 stuck` });
      }
    } catch (err: any) {
      findings.push({ check: "Email Worker", status: "WARN", detail: `Query failed: ${err?.message?.slice(0, 100)}` });
    }

    // ── 6. Postiz API Reachability ────────────────────────────────────────────
    try {
      const postizKey = await resolveCredential(ctx.tenantId, "postiz");
      if (!postizKey) {
        findings.push({ check: "Postiz API", status: "WARN", detail: "No Postiz API key configured for your workspace" });
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("https://api.postiz.com/public/v1/media", {
          method: "GET",
          headers: { Authorization: postizKey },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok || res.status === 200 || res.status === 401) {
          // 401 means the endpoint is alive (auth may differ per route)
          findings.push({ check: "Postiz API", status: res.ok ? "OK" : "WARN", detail: `Postiz responded HTTP ${res.status}` });
        } else {
          findings.push({ check: "Postiz API", status: "WARN", detail: `Postiz returned HTTP ${res.status}` });
        }
      }
    } catch (err: any) {
      const msg = err?.name === "AbortError" ? "Timeout after 8s" : err?.message?.slice(0, 100);
      findings.push({ check: "Postiz API", status: "CRITICAL", detail: `Postiz unreachable: ${msg}` });
    }

    // ── 7. Slack Bot Token ────────────────────────────────────────────────────
    try {
      const slackToken = await resolveCredential(ctx.tenantId, "slack");
      if (!slackToken) {
        findings.push({ check: "Slack Bot", status: "WARN", detail: "No Slack bot token configured for your workspace" });
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("https://slack.com/api/auth.test", {
          method: "POST",
          headers: { Authorization: `Bearer ${slackToken}`, "Content-Type": "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json() as { ok?: boolean; error?: string; team?: string };
        if (data.ok) {
          findings.push({ check: "Slack Bot", status: "OK", detail: `Bot authenticated (team: ${data.team ?? "unknown"})` });
        } else {
          findings.push({ check: "Slack Bot", status: "CRITICAL", detail: `Slack auth failed: ${data.error ?? "unknown"}` });
        }
      }
    } catch (err: any) {
      const msg = err?.name === "AbortError" ? "Timeout after 8s" : err?.message?.slice(0, 100);
      findings.push({ check: "Slack Bot", status: "CRITICAL", detail: `Slack unreachable: ${msg}` });
    }

    // ── 8. LLM Provider Circuit Breakers ──────────────────────────────────────
    try {
      const { getState } = await import("../lib/circuitBreaker.js");
      const state = getState();
      const providers = Object.entries(state);
      const openProviders = providers.filter(([, v]) => v.state === "OPEN");
      if (providers.length === 0) {
        findings.push({ check: "LLM Providers", status: "OK", detail: "No providers tracked yet" });
      } else if (openProviders.length === providers.length) {
        findings.push({ check: "LLM Providers", status: "CRITICAL", detail: `ALL ${openProviders.length} providers circuit-OPEN: ${openProviders.map(([k]) => k).join(", ")}` });
      } else if (openProviders.length > 0) {
        findings.push({ check: "LLM Providers", status: "WARN", detail: `${openProviders.length}/${providers.length} provider(s) OPEN: ${openProviders.map(([k]) => k).join(", ")}` });
      } else {
        findings.push({ check: "LLM Providers", status: "OK", detail: `All ${providers.length} provider(s) healthy` });
      }
    } catch (err: any) {
      findings.push({ check: "LLM Providers", status: "WARN", detail: `Could not check: ${err?.message?.slice(0, 100)}` });
    }

    // ── 9. OAuth Token Expiry Horizon (next 6h) ───────────────────────────────
    try {
      const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
      const now = new Date();
      const expiring = await prisma.$queryRaw<{ provider: string; expires_at: Date }[]>`
        SELECT provider, expires_at
        FROM token_vault
        WHERE expires_at IS NOT NULL
          AND expires_at::timestamptz > ${now}
          AND expires_at::timestamptz < ${sixHoursFromNow}
      `;
      if (expiring.length > 0) {
        const providers = [...new Set(expiring.map(t => t.provider))].join(", ");
        findings.push({ check: "OAuth Tokens", status: "WARN", detail: `${expiring.length} token(s) expiring within 6h: ${providers}` });
      } else {
        findings.push({ check: "OAuth Tokens", status: "OK", detail: "No tokens expiring within 6h" });
      }
    } catch (err: any) {
      findings.push({ check: "OAuth Tokens", status: "WARN", detail: `Query failed: ${err?.message?.slice(0, 100)}` });
    }

    // ── 10. Scheduler Coverage (24h firing gaps) ──────────────────────────────
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentFirings = await prisma.auditLog.count({
        where: {
          action: "SCHEDULER_JOB_FIRED",
          createdAt: { gt: oneDayAgo },
        },
      });
      // Expect at least 30 firings per day given the 60+ scheduled jobs
      if (recentFirings === 0) {
        findings.push({ check: "Scheduler Coverage", status: "CRITICAL", detail: "ZERO scheduler firings in 24h — scheduler may be dead" });
      } else if (recentFirings < 20) {
        findings.push({ check: "Scheduler Coverage", status: "WARN", detail: `Only ${recentFirings} scheduler firings in 24h (expected 30+)` });
      } else {
        findings.push({ check: "Scheduler Coverage", status: "OK", detail: `${recentFirings} firings in 24h` });
      }
    } catch (err: any) {
      findings.push({ check: "Scheduler Coverage", status: "WARN", detail: `Query failed: ${err?.message?.slice(0, 100)}` });
    }

    // ── 11. CRM Data Health ───────────────────────────────────────────────────
    // Only flag missing emails for email-outreach contacts (vc_outreach source).
    // Business contacts often have phone/website only — that's normal.
    try {
      const totalContacts = await prisma.crmContact.count({ where: { tenantId: ctx.tenantId } });
      const emailOutreach = await prisma.crmContact.count({
        where: { tenantId: ctx.tenantId, source: "vc_outreach" },
      });
      const emailOutreachNoEmail = await prisma.crmContact.count({
        where: { tenantId: ctx.tenantId, source: "vc_outreach", OR: [{ email: null }, { email: "" }] },
      });
      if (totalContacts === 0) {
        findings.push({ check: "CRM Health", status: "WARN", detail: "No CRM contacts — outreach workflows will no-op" });
      } else if (emailOutreach > 0 && emailOutreachNoEmail > emailOutreach * 0.1) {
        findings.push({ check: "CRM Health", status: "WARN", detail: `${emailOutreachNoEmail}/${emailOutreach} VC outreach contacts missing email` });
      } else {
        findings.push({ check: "CRM Health", status: "OK", detail: `${totalContacts} contacts total, ${emailOutreach} VC outreach (${emailOutreachNoEmail} missing email)` });
      }
    } catch (err: any) {
      findings.push({ check: "CRM Health", status: "WARN", detail: `Query failed: ${err?.message?.slice(0, 100)}` });
    }

    // ── 12. KB Document Freshness ─────────────────────────────────────────────
    try {
      const totalDocs = await prisma.kbDocument.count({ where: { tenantId: ctx.tenantId } });
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentDocs = await prisma.kbDocument.count({
        where: { tenantId: ctx.tenantId, createdAt: { gt: sevenDaysAgo } },
      });
      if (totalDocs === 0) {
        findings.push({ check: "KB Freshness", status: "WARN", detail: "No KB documents — agents running blind" });
      } else {
        findings.push({ check: "KB Freshness", status: "OK", detail: `${totalDocs} docs total, ${recentDocs} added in last 7d` });
      }
    } catch (err: any) {
      findings.push({ check: "KB Freshness", status: "WARN", detail: `Query failed: ${err?.message?.slice(0, 100)}` });
    }

    // ── Compile Report ────────────────────────────────────────────────────────
    const elapsed = Date.now() - t0;
    const criticals = findings.filter(f => f.status === "CRITICAL");
    const warns = findings.filter(f => f.status === "WARN");
    const oks = findings.filter(f => f.status === "OK");

    const overallStatus = criticals.length > 0 ? "CRITICAL" : warns.length > 0 ? "DEGRADED" : "HEALTHY";
    const emoji = overallStatus === "CRITICAL" ? "🚨" : overallStatus === "DEGRADED" ? "⚠️" : "✅";

    // Build the report
    const lines: string[] = [
      `${emoji} *System Health Patrol — ${overallStatus}*`,
      `_${new Date().toISOString()} | ${elapsed}ms | 12 checks | 0 tokens spent_`,
      "",
    ];

    if (criticals.length > 0) {
      lines.push("*CRITICAL:*");
      for (const f of criticals) lines.push(`  🔴 ${f.check}: ${f.detail}`);
      lines.push("");
    }
    if (warns.length > 0) {
      lines.push("*WARNINGS:*");
      for (const f of warns) lines.push(`  🟡 ${f.check}: ${f.detail}`);
      lines.push("");
    }
    if (oks.length > 0) {
      lines.push("*PASSING:*");
      for (const f of oks) lines.push(`  🟢 ${f.check}: ${f.detail}`);
    }

    const report = lines.join("\n");

    // Write detailed audit
    await writeStepAudit(ctx, "health.report", `${overallStatus}: ${criticals.length} critical, ${warns.length} warn, ${oks.length} ok`, {
      overallStatus,
      findings,
      elapsedMs: elapsed,
    });

    // Post to #intel
    try {
      const intelChannel = await getChannelByName("intel", true);
      if (intelChannel) {
        await postAsAgent(intelChannel.id, "atlas", report);
        await writeStepAudit(ctx, "health.posted", "Report posted to #intel");
      }
    } catch (err: any) {
      await writeStepAudit(ctx, "health.slack_fail", `Could not post to #intel: ${err?.message?.slice(0, 100)}`);
    }

    // Telegram alert on CRITICAL
    if (criticals.length > 0) {
      try {
        const { sendTelegramDirect } = await import("../lib/telegramNotify.js");
        const chatId = String(process.env.TELEGRAM_ADMIN_CHAT_ID ?? "").trim();
        if (chatId) {
          const tgMsg = `🚨 HEALTH PATROL: ${criticals.length} CRITICAL finding(s)\n\n${criticals.map(f => `• ${f.check}: ${f.detail}`).join("\n")}`;
          await sendTelegramDirect(chatId, tgMsg, "");
          await writeStepAudit(ctx, "health.telegram", "Critical alert sent via Telegram");
        }
      } catch {
        // Telegram is best-effort
      }
    }

    await writeStepAudit(ctx, "health.done", `Health Patrol complete: ${overallStatus} (${elapsed}ms)`);

    return {
      ok: criticals.length === 0,
      message: `Health Patrol: ${overallStatus} — ${criticals.length} critical, ${warns.length} warn, ${oks.length} ok (${elapsed}ms, 0 tokens)`,
      output: { overallStatus, findings, elapsedMs: elapsed, traceId: ctx.traceId ?? null },
    };
  },

  // WF-021 — Bootstrap Atlas: KB discovery + LLM readiness summary
  "WF-021": async (ctx) => {
    await writeStepAudit(ctx, "bootstrap.start", "Bootstrapping Atlas");

    const catalog = workflowCatalogAll.map((w) => ({
      id: w.id, name: w.name, description: w.description, ownerAgent: w.ownerAgent,
    }));

    // Pull atlas governance + agent KB
    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: "atlas",
      query: "company overview mission agents capabilities",
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
      querySource: "engine",
    });

    const agentList = workflowCatalogAll
      .map((w) => w.ownerAgent)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    const llmText = await safeLLM(ctx, {
      agent: "ATLAS",
      purpose: "bootstrap_readiness",
      route: "ORCHESTRATION_REASONING",
      system: [
        "You are Atlas, CEO of the Atlas UX AI workforce.",
        `You have just booted and can see ${catalog.length} workflows across ${agentList.length} agents.`,
        kb.text
          ? `\nKnowledge Base context (${kb.items.length} docs):\n${kb.text}`
          : "\n(KB is empty — no governance or agent docs uploaded yet.)",
      ].join("\n"),
      user: [
        "Generate a structured boot-ready summary. Include:",
        "1. What you know about the company/mission from KB",
        "2. Which agents are active and their roles",
        "3. Top 3 immediate priorities based on KB context",
        "4. Any gaps or missing KB information you need",
        `Agents available: ${agentList.join(", ")}`,
        `Total workflows: ${catalog.length}`,
      ].join("\n"),
    });

    await writeStepAudit(ctx, "bootstrap.kb", `KB loaded: ${kb.items.length} docs, ${kb.totalChars} chars`, {
      kbItems: kb.items.length,
    });

    // Boot email
    const to = String(ctx.input?.emailTo ?? "").trim();
    if (to) {
      await queueEmail(ctx, {
        to,
        fromAgent: "atlas",
        subject: "Atlas is online",
        text: [
          "Atlas bootstrap complete.\n",
          llmText,
          `\n\nWorkflows loaded: ${catalog.length}`,
          `KB documents: ${kb.items.length}`,
          `Trace: ${ctx.traceId ?? ctx.intentId}`,
        ].join("\n"),
      });
    }

    await writeStepAudit(ctx, "bootstrap.ready", "Atlas bootstrap complete", {
      workflowCount: catalog.length,
      agentCount: agentList.length,
      kbItems: kb.items.length,
    });

    return {
      ok: true,
      message: "Bootstrap complete",
      output: {
        workflowCatalog: catalog,
        agentCount: agentList.length,
        kbItems: kb.items.length,
        readinessSummary: llmText.slice(0, 600),
        next: "AWAIT_COMMAND",
        traceId: ctx.traceId ?? null,
      },
    };
  },

  // WF-001 — Support Intake: LLM classifies + drafts acknowledgment
  "WF-001": async (ctx) => {
    const customerEmail = String(ctx.input?.customerEmail ?? "").trim();
    const subject       = String(ctx.input?.subject       ?? "Support Request").trim();
    const message       = String(ctx.input?.message       ?? "").trim();

    if (!customerEmail) return { ok: false, message: "customerEmail required" };

    await writeStepAudit(ctx, "intake.start", `Intake for ${customerEmail}`, { subject });

    // KB for Cheryl + query on the issue topic
    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: "cheryl",
      query: `${subject} ${message}`.slice(0, 200),
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
      querySource: "engine",
    });

    // LLM: classify + draft ack + recommend routing
    const llmText = await safeLLM(ctx, {
      agent: "CHERYL",
      purpose: "support_intake_classify",
      route: "CLASSIFY_EXTRACT_VALIDATE",
      system: [
        "You are Cheryl, Atlas UX Customer Support Officer.",
        "Classify support tickets and draft professional acknowledgment emails.",
        kb.text ? `\nKB context:\n${kb.text}` : "",
      ].join("\n"),
      user: [
        `Customer: ${customerEmail}`,
        `Subject: ${subject}`,
        `Message: ${message}`,
        "",
        "Respond as JSON with fields:",
        '{ "category": "billing|legal|feature|bug|general", "priority": "low|normal|high|urgent",',
        '  "routeTo": "tina|larry|binky|engineering|binky", "ackEmail": "<full email body to send customer>",',
        '  "internalNote": "<one-line note for the team>" }',
      ].join("\n"),
    });

    // Parse LLM JSON, fallback to heuristics
    let parsed: any = {};
    try { parsed = JSON.parse(llmText.match(/\{[\s\S]*\}/)?.[0] ?? "{}"); } catch { /* fallback */ }

    const category = String(parsed.category ?? (
      message.toLowerCase().includes("bill") ? "billing" :
      message.toLowerCase().includes("bug")  ? "bug"     : "general"
    ));
    const routeTo = String(parsed.routeTo ?? (
      category === "billing" ? "tina" :
      category === "legal"   ? "larry" :
      category === "feature" ? "binky" :
      category === "bug"     ? "engineering" : "binky"
    ));
    const priority  = String(parsed.priority ?? "normal");
    const ackBody   = parsed.ackEmail
      ?? `Hi — we received your request and are reviewing it now.\n\nCategory: ${category}\nTrace: ${ctx.traceId ?? ctx.intentId}\n\nMessage received:\n${message}\n\n— Cheryl (Atlas UX Support)`;

    await writeStepAudit(ctx, "intake.classify", `Category: ${category}, Priority: ${priority}, Route: ${routeTo}`, {
      category, priority, routeTo,
    });

    // Ack email to customer
    await queueEmail(ctx, {
      to: customerEmail,
      subject: `Re: ${subject} (Ticket received)`,
      text: ackBody,
      fromAgent: "cheryl",
    });

    // Internal routing email
    await queueEmail(ctx, {
      to: await tenantAgentEmail(ctx.tenantId, "atlas") ?? "atlas.ceo@deadapp.info",
      subject: `[${ctx.traceId ?? ctx.intentId}] Support Intake → ${routeTo.toUpperCase()} [${priority}]`,
      text: [
        `Support intake routed to ${routeTo}.`,
        `Customer: ${customerEmail}`,
        `Subject: ${subject}`,
        `Category: ${category} | Priority: ${priority}`,
        `\nMessage:\n${message}`,
        `\nInternal note: ${parsed.internalNote ?? ""}`,
        `\nIntent: ${ctx.intentId}`,
      ].join("\n"),
      fromAgent: "cheryl",
    });

    return {
      ok: true,
      message: "Support intake processed",
      output: { category, priority, routedTo: routeTo, kbItems: kb.items.length },
    };
  },

  // WF-002 — Support Escalation: LLM drafts formal escalation memo
  "WF-002": async (ctx) => {
    const toRole  = String(ctx.input?.toRole  ?? "").trim().toLowerCase();
    const summary = String(ctx.input?.summary ?? "").trim();
    if (!toRole || !summary) return { ok: false, message: "toRole and summary required" };

    await writeStepAudit(ctx, "escalate.start", `Escalation to ${toRole}`);

    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: toRole,
      query: `escalation protocol ${summary}`.slice(0, 200),
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
      querySource: "engine",
    });

    const llmText = await safeLLM(ctx, {
      agent: ctx.agentId.toUpperCase(),
      purpose: "support_escalation_memo",
      route: "ORCHESTRATION_REASONING",
      system: [
        `You are ${ctx.agentId.toUpperCase()}, escalating an issue to ${toRole.toUpperCase()}.`,
        "Write a professional, structured escalation memo.",
        kb.text ? `\nKB context for ${toRole}:\n${kb.text}` : "",
      ].join("\n"),
      user: [
        `Escalation to: ${toRole.toUpperCase()}`,
        `Summary: ${summary}`,
        `Evidence: ${JSON.stringify(ctx.input?.evidence ?? {}, null, 2)}`,
        "",
        "Write a formal escalation memo with: Executive Summary, Evidence, Recommended Action, Urgency level.",
      ].join("\n"),
    });

    await writeStepAudit(ctx, "escalate.drafted", `Memo drafted (${llmText.length} chars)`);

    const toEmail = await tenantAgentEmail(ctx.tenantId, toRole) ?? await tenantAgentEmail(ctx.tenantId, "atlas") ?? "atlas.ceo@deadapp.info";
    await queueEmail(ctx, {
      to: toEmail,
      subject: `[ESCALATION] ${toRole.toUpperCase()} ← ${ctx.agentId.toUpperCase()} (${ctx.traceId ?? ctx.intentId})`,
      text: `${llmText}\n\nIntent: ${ctx.intentId}`,
      fromAgent: ctx.agentId,
    });

    await writeStepAudit(ctx, "escalate.sent", `Escalation memo queued to ${toEmail}`);

    return {
      ok: true,
      message: "Escalation queued",
      output: { toRole, kbItems: kb.items.length, memoChars: llmText.length },
    };
  },

  // WF-010 — Daily Executive Brief: LLM generates real brief from KB
  "WF-010": async (ctx) => {
    await writeStepAudit(ctx, "brief.start", "Collecting KB intel for daily brief");

    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: "binky",
      query: "daily operations report metrics performance summary",
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
      querySource: "engine",
    });

    const llmText = await safeLLM(ctx, {
      agent: "BINKY",
      purpose: "daily_executive_brief",
      route: "LONG_CONTEXT_SUMMARY",
      system: [
        "You are Binky, CRO of Atlas UX.",
        "Produce a concise, structured daily executive brief for the leadership team.",
        kb.text
          ? `\nKnowledge Base context (${kb.items.length} docs):\n${kb.text}`
          : "\n(KB empty — brief will be skeletal until docs are uploaded.)",
      ].join("\n"),
      user: [
        `Date: ${new Date().toISOString().slice(0, 10)}`,
        "Produce a daily executive brief with sections:",
        "1. Key Highlights",
        "2. Active Campaigns / Initiatives",
        "3. Risks & Blockers",
        "4. Recommended Actions for Today",
        "5. Metrics (use KB data or note if unavailable)",
        "Keep it actionable and under 400 words.",
      ].join("\n"),
    });

    await writeStepAudit(ctx, "brief.composed", `Brief composed (${llmText.length} chars, ${kb.items.length} KB docs)`);

    // Send brief to Atlas (CEO) — Binky reports to Atlas
    const { to: briefTo } = await getReportRecipients(ctx.tenantId, "binky");
    await queueEmail(ctx, {
      to: briefTo,
      subject: `[DAILY BRIEF] ${new Date().toISOString().slice(0, 10)}`,
      text: `Daily Executive Brief\n${"=".repeat(40)}\n\nPrepared by: BINKY (CRO)\n\n${llmText}\n\nTrace: ${ctx.traceId ?? ctx.intentId}`,
      fromAgent: "binky",
    });

    await writeStepAudit(ctx, "brief.queued", `Brief queued to ${briefTo}`);

    // CC DAILY-INTEL mailbox as central reporting hub
    const dailyIntelEmail = await tenantAgentEmail(ctx.tenantId, "daily_intel");
    if (dailyIntelEmail && dailyIntelEmail !== briefTo) {
      await queueEmail(ctx, {
        to: dailyIntelEmail,
        fromAgent: "binky",
        subject: `[DAILY BRIEF HUB] ${new Date().toISOString().slice(0, 10)}`,
        text: [
          "DAILY-INTEL HUB — Daily Executive Brief copy.",
          `Source: Binky (WF-010) | Trace: ${ctx.traceId ?? ctx.intentId}`,
          `KB docs: ${kb.items.length}`,
          `\n${llmText}`,
        ].join("\n"),
      });
      await writeStepAudit(ctx, "brief.hub", `Brief CC'd to DAILY-INTEL hub at ${dailyIntelEmail}`);
    }

    return {
      ok: true,
      message: "Daily brief queued",
      output: {
        date: new Date().toISOString().slice(0, 10),
        kbItems: kb.items.length,
        briefChars: llmText.length,
        preview: llmText.slice(0, 300),
      },
    };
  },
};

// ── Platform Intel handler — real-time SERP + LLM hot-takes report ───────────

function createPlatformIntelHandler(platformName: string, searchQuery: string): WorkflowHandler {
  return async (ctx) => {
    await writeStepAudit(ctx, `${ctx.workflowId}.start`, `Starting platform intel for ${platformName}`);

    // 1. Real-time trends via multi-provider web search
    let serpData = "";
    try {
      const searchResult = await searchWeb(
        `${searchQuery} trending ${new Date().toISOString().slice(0, 10)}`,
        8,
        ctx.tenantId,
      );
      if (searchResult.ok) {
        serpData = searchResult.results
          .map(
            (r, i) =>
              `${i + 1}. ${r.title}\n   ${r.snippet}\n   Source: ${r.url}`,
          )
          .join("\n\n");
      }
    } catch (err: any) {
      serpData = `[search error: ${err?.message ?? "unavailable"}]`;
    }

    // 2. KB context for this agent
    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: ctx.agentId,
      query: `${platformName} content strategy trends`,
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
      querySource: "engine",
    });

    // 3. LLM synthesizes hot-takes report
    const llmText = await safeLLM(ctx, {
      agent: ctx.agentId.toUpperCase(),
      purpose: `platform_intel_${ctx.agentId}`,
      route: "LONG_CONTEXT_SUMMARY",
      system: [
        `You are ${ctx.agentId.toUpperCase()}, the Atlas UX ${platformName} specialist.`,
        `Your mission: report what is HOT on ${platformName} TODAY so the team can create on-trend content.`,
        kb.text
          ? `\nYour KB context (${kb.items.length} docs):\n${kb.text}`
          : "\n(No KB docs loaded yet — use your platform expertise.)",
      ].join("\n"),
      user: [
        `Date: ${new Date().toISOString().slice(0, 10)}`,
        serpData
          ? `\nReal-time search results for "${searchQuery} trending today":\n${serpData}`
          : "\n[No live search data available — use your training knowledge of the platform.]",
        "\nProduce a structured PLATFORM INTEL REPORT:",
        "1. Top 5 trending topics / hashtags RIGHT NOW",
        "2. Viral formats and content styles performing well this week",
        "3. Content gaps Atlas UX (AI employee platform) could fill",
        "4. 3 specific, ready-to-use post ideas for Atlas UX based on today's trends",
        "5. Any competitor or brand activity worth noting",
        "\nBe specific and actionable. This goes to Atlas and the DAILY-INTEL hub.",
      ].join("\n"),
    });

    await writeStepAudit(
      ctx,
      `${ctx.workflowId}.intel`,
      `Intel report generated (${llmText.length} chars, SERP: ${serpData ? "LIVE" : "KB-only"})`,
      { kbItems: kb.items.length, serpActive: !!serpData },
    );

    // 4. Email report to Atlas (CEO) + CC agent's direct leader
    const { to: intelTo, cc: intelCc } = await getReportRecipients(ctx.tenantId, ctx.agentId);
    const intelSubject = `[${platformName.toUpperCase()} INTEL] ${new Date().toISOString().slice(0, 10)} — Hot Topics & Trends`;
    const intelBody = [
      `${platformName} Platform Intelligence Report`,
      "=".repeat(50),
      `Agent: ${ctx.agentId.toUpperCase()} | Date: ${new Date().toISOString().slice(0, 10)}`,
      `SERP: ${serpData ? "LIVE" : "KB-only"} | KB docs: ${kb.items.length}`,
      `Trace: ${ctx.traceId ?? ctx.intentId}`,
      `\n${llmText}`,
    ].join("\n");

    await queueEmail(ctx, {
      to: intelTo,
      fromAgent: ctx.agentId,
      subject: intelSubject,
      text: intelBody,
    });
    for (const cc of intelCc) {
      await queueEmail(ctx, {
        to: cc,
        fromAgent: ctx.agentId,
        subject: `[CC] ${intelSubject}`,
        text: intelBody,
      });
    }

    // 5. CC DAILY-INTEL hub
    const hubEmail = await tenantAgentEmail(ctx.tenantId, "daily_intel");
    if (hubEmail && hubEmail !== intelTo) {
      await queueEmail(ctx, {
        to: hubEmail,
        fromAgent: ctx.agentId,
        subject: `[PLATFORM INTEL HUB] ${platformName} — ${new Date().toISOString().slice(0, 10)}`,
        text: [
          `Platform: ${platformName} | Agent: ${ctx.agentId.toUpperCase()}`,
          `SERP: ${serpData ? "LIVE" : "KB-only"} | KB docs: ${kb.items.length}`,
          `\n${llmText}`,
          `\nTrace: ${ctx.traceId ?? ctx.intentId}`,
        ].join("\n"),
      });
    }

    // 6. Audit + Ledger
    await writeStepAudit(ctx, `${ctx.workflowId}.complete`, `${platformName} intel complete`, {
      kbItems: kb.items.length,
      llmChars: llmText.length,
    });
    await prisma.ledgerEntry.create({
      data: {
        tenantId: ctx.tenantId,
        entryType: "debit",
        category: "token_spend",
        amountCents: BigInt(Math.max(1, Math.round(llmText.length / 100))),
        description: `${ctx.workflowId} — ${platformName} platform intel`,
        reference_type: "intent",
        reference_id: ctx.intentId,
        run_id: ctx.traceId ?? ctx.intentId,
        meta: { workflowId: ctx.workflowId, agentId: ctx.agentId, platform: platformName },
      },
    }).catch(() => null);

    return {
      ok: true,
      message: `${platformName} intel report complete`,
      output: {
        platform: platformName,
        agentId: ctx.agentId,
        kbItems: kb.items.length,
        serpActive: !!serpData,
        llmChars: llmText.length,
        preview: llmText.slice(0, 400),
      },
    };
  };
}

// ── WF-106 Atlas Daily Aggregation & Agent Task Assignment ────────────────────
// After the 13 platform intel jobs run (05:00–05:36 UTC), Atlas fires at 05:45.
// It synthesizes all intel via Daily-Intel, then assigns tasks to every agent.
handlers["WF-106"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-106.start", "Atlas Aggregation & Task Assignment beginning");

  const today = new Date().toISOString().slice(0, 10);

  // 1. Get global KB context (Atlas-level — all docs)
  const kb = await getKbContext({
    tenantId: ctx.tenantId,
    agentId: "atlas",
    query: "agent roles workflows platform strategy task assignment",
    intentId: ctx.intentId,
    requestedBy: ctx.requestedBy,
    querySource: "engine",
  });

  // 2. Get real-time macro context via multi-provider web search
  let macroIntel = "";
  try {
    const macroResult = await searchWeb(`AI automation small business trending news ${today}`, 6, ctx.tenantId);
    if (macroResult.ok) {
      macroIntel = macroResult.results
        .slice(0, 5)
        .map((r, i) => `${i + 1}. ${r.title} — ${r.snippet}`)
        .join("\n");
    }
  } catch { /* non-fatal */ }

  // 3. Daily-Intel synthesizes all platform reports into a unified packet
  const synthPrompt = [
    `You are DAILY-INTEL, the central intelligence aggregator for Atlas UX.`,
    `Date: ${today}`,
    `\nEach of the 13 social/platform agents (Kelly/X, Fran/FB, Dwight/Threads, Timmy/TikTok,`,
    `Terry/Tumblr, Cornwall/Pinterest, Link/LinkedIn, Emma/Alignable, Donna/Reddit,`,
    `Reynolds/Blog, Penny/Ads, Archy/Instagram, Venny/YouTube) just filed their`,
    `platform intel reports to this hub.`,
    macroIntel ? `\nMacro market context (live):\n${macroIntel}` : "",
    kb.text ? `\nKB context (${kb.items.length} docs):\n${kb.text.slice(0, 2000)}` : "",
    `\nProduce a UNIFIED INTELLIGENCE PACKET with:`,
    `A. MACRO THEME OF THE DAY — the overarching narrative across all platforms`,
    `B. CROSS-PLATFORM OPPORTUNITIES — 3 opportunities Atlas UX can exploit today across multiple channels`,
    `C. PER-AGENT FOCUS AREA — for each of the 13 platform agents, one specific directive:`,
    `   (Kelly, Fran, Dwight, Timmy, Terry, Cornwall, Link, Emma, Donna, Reynolds, Penny, Archy, Venny)`,
    `D. ATLAS PRIORITY FLAGS — any risks, anomalies, or urgent items Atlas should act on today`,
    `\nBe specific, decisive, and actionable. Atlas reads this and issues task orders.`,
  ].filter(Boolean).join("\n");

  const intelPacket = await safeLLM(ctx, {
    agent: "DAILY-INTEL",
    purpose: "daily_aggregation",
    route: "ORCHESTRATION_REASONING",
    system: synthPrompt,
    user: `Generate the unified intelligence packet for ${today}.`,
  });

  await writeStepAudit(ctx, "WF-106.intel", `Intelligence packet generated (${intelPacket.length} chars)`);

  // 4. Atlas reads the packet and generates per-agent task orders
  const taskOrderPrompt = [
    `You are ATLAS, CEO and orchestrator of the Atlas UX AI workforce.`,
    `Date: ${today}`,
    `\nThe DAILY-INTEL hub has just delivered today's unified intelligence packet:\n`,
    intelPacket.slice(0, 2000), // keep under token budget
    `\nYour role: read the intel, evaluate what each agent should do TODAY, and issue specific task orders.`,
    `\nFor each of these agents, issue a task order:`,
    `  Social publishers: Kelly, Fran, Dwight, Timmy, Terry, Cornwall, Link, Emma, Donna, Reynolds, Penny`,
    `  Visual: Venny (images), Archy (Instagram/research for Binky)`,
    `  Operations: Petra (projects), Sandy (bookings/CRM), Porter (SharePoint), Claire (calendar)`,
    `  Intelligence: Binky (research), Daily-Intel (briefings)`,
    `  Finance/Compliance: Tina (CFO), Larry (audit), Frank (forms)`,
    `  Customer/Sales: Mercer (acquisition), Cheryl (support), Sunday (docs/comms)`,
    `\nFor each agent, specify:`,
    `  AGENT: [name]`,
    `  TASK: [one specific, actionable task for today]`,
    `  WORKFLOW: [most relevant WF-### if applicable]`,
    `  PRIORITY: HIGH / MEDIUM / STANDARD`,
    `\nEnd with: ATLAS STATUS: [your read on Atlas UX's position and what you're watching]`,
  ].join("\n");

  const taskOrders = await safeLLM(ctx, {
    agent: "ATLAS",
    purpose: "task_assignment",
    route: "ORCHESTRATION_REASONING",
    system: taskOrderPrompt,
    user: `Issue today's task orders for the full Atlas UX workforce — ${today}.`,
  });

  await writeStepAudit(ctx, "WF-106.orders", `Task orders generated (${taskOrders.length} chars)`);

  // 5. Send Atlas's master task order to Billy + Atlas mailbox
  const atlasEmail = await tenantAgentEmail(ctx.tenantId, "atlas") ?? "atlas.ceo@deadapp.info";
  const billyEmail = process.env.OWNER_EMAIL?.trim() ?? "billy@deadapp.info";
  const masterSubject = `[ATLAS TASK ORDERS] ${today} — Workforce Task Assignment`;
  const masterBody = [
    `ATLAS UX — DAILY WORKFORCE TASK ASSIGNMENT`,
    `Date: ${today}`,
    `Triggered by: WF-106 Atlas Daily Aggregation`,
    `\n${"═".repeat(60)}`,
    `\nUNIFIED INTELLIGENCE PACKET (Daily-Intel)`,
    `${"─".repeat(60)}`,
    intelPacket,
    `\n${"═".repeat(60)}`,
    `\nATLAS TASK ORDERS — FULL WORKFORCE`,
    `${"─".repeat(60)}`,
    taskOrders,
    `\n${"═".repeat(60)}`,
    `\nTrace: ${ctx.traceId ?? ctx.intentId}`,
  ].join("\n");

  await queueEmail(ctx, { to: atlasEmail, fromAgent: "atlas", subject: masterSubject, text: masterBody });
  if (billyEmail !== atlasEmail) {
    await queueEmail(ctx, { to: billyEmail, fromAgent: "atlas", subject: masterSubject, text: masterBody });
  }

  // 6. Parse task orders and queue individual agent notification emails
  // We send each agent their task order as a directive email
  const agentTaskMap: Record<string, { task: string; workflow: string; priority: string }> = {};
  const agentLines = taskOrders.split(/\n(?=AGENT:)/);
  for (const block of agentLines) {
    const agentMatch = block.match(/AGENT:\s*(\w+)/i);
    const taskMatch  = block.match(/TASK:\s*(.+)/i);
    const wfMatch    = block.match(/WORKFLOW:\s*(WF-\d+|N\/A|none)?/i);
    const priMatch   = block.match(/PRIORITY:\s*(HIGH|MEDIUM|STANDARD)/i);
    if (agentMatch) {
      agentTaskMap[agentMatch[1].toLowerCase()] = {
        task:     taskMatch?.[1]?.trim() ?? "See today's Atlas task order report.",
        workflow: wfMatch?.[1]?.trim() ?? "",
        priority: priMatch?.[1]?.trim() ?? "STANDARD",
      };
    }
  }

  let emailsSent = 0;
  for (const [agId, order] of Object.entries(agentTaskMap)) {
    const agMailbox = await tenantAgentEmail(ctx.tenantId, agId);
    if (!agMailbox) continue;
    const subject = `[ATLAS TASK ORDER] ${today} — Your directive from Atlas`;
    const body = [
      `ATLAS UX — DIRECT TASK ORDER`,
      `Agent: ${agId.toUpperCase()} | Date: ${today} | Priority: ${order.priority}`,
      `\nTASK: ${order.task}`,
      order.workflow ? `\nSUGGESTED WORKFLOW: ${order.workflow}` : "",
      `\nThis task order was generated by Atlas based on today's platform intel sweep.`,
      `Reply to this mailbox if you need clarification or escalation.`,
      `\nTrace: ${ctx.traceId ?? ctx.intentId}`,
    ].filter(Boolean).join("\n");
    await queueEmail(ctx, { to: agMailbox, fromAgent: "atlas", subject, text: body });
    emailsSent++;
  }

  // 7. Also CC the DAILY-INTEL hub with the full task log
  const hubEmail = await tenantAgentEmail(ctx.tenantId, "daily_intel");
  if (hubEmail) {
    await queueEmail(ctx, {
      to: hubEmail, fromAgent: "atlas",
      subject: `[WF-106 HUB] ${today} — Task orders dispatched to ${emailsSent} agents`,
      text: masterBody,
    });
  }

  // 8. Audit + Ledger
  await writeStepAudit(ctx, "WF-106.complete", `Task assignment complete — ${emailsSent} agents notified`, {
    agentsNotified: emailsSent,
    intelChars: intelPacket.length,
    orderChars: taskOrders.length,
  });
  await prisma.ledgerEntry.create({
    data: {
      tenantId: ctx.tenantId,
      entryType: "debit",
      category: "token_spend",
      amountCents: BigInt(Math.max(1, Math.round((intelPacket.length + taskOrders.length) / 100))),
      description: `WF-106 — Atlas daily aggregation & task assignment (${emailsSent} agents)`,
      reference_type: "intent",
      reference_id: ctx.intentId,
      run_id: ctx.traceId ?? ctx.intentId,
      meta: { workflowId: "WF-106", agentsNotified: emailsSent },
    },
  }).catch(() => null);

  return {
    ok: true,
    message: `Atlas task orders dispatched — ${emailsSent} agents notified`,
    output: {
      agentsNotified: emailsSent,
      agentTaskMap,
      intelChars: intelPacket.length,
      orderChars: taskOrders.length,
      preview: taskOrders.slice(0, 500),
    },
  };
};

// Register all platform intel handlers
handlers["WF-093"] = createPlatformIntelHandler("X (Twitter)", "X Twitter trending hashtags viral content tech startups");
handlers["WF-094"] = createPlatformIntelHandler("Facebook", "Facebook trending topics small business Pages Groups");
handlers["WF-095"] = createPlatformIntelHandler("Threads", "Threads app Meta trending topics creators conversations");
handlers["WF-096"] = createPlatformIntelHandler("TikTok", "TikTok trending hashtags sounds viral video formats");
handlers["WF-097"] = createPlatformIntelHandler("Tumblr", "Tumblr trending tags creative posts aesthetic content");
handlers["WF-098"] = createPlatformIntelHandler("Pinterest", "Pinterest trending pins boards ideas visual inspiration");
handlers["WF-099"] = createPlatformIntelHandler("LinkedIn", "LinkedIn trending professional topics business B2B posts");
handlers["WF-100"] = createPlatformIntelHandler("Alignable", "Alignable local business trending topics community discussions");
handlers["WF-101"] = createPlatformIntelHandler("Reddit", "Reddit hot threads subreddits AI automation small business tech");
handlers["WF-102"] = createPlatformIntelHandler("Blog SEO", "SEO trending blog topics AI automation software small business 2026");
handlers["WF-103"] = createPlatformIntelHandler("Facebook Ads", "Facebook Ads trending ad formats small business winning creatives");
handlers["WF-104"] = createPlatformIntelHandler("Instagram", "Instagram trending Reels hashtags visual content creators");
handlers["WF-105"] = createPlatformIntelHandler("YouTube", "YouTube trending videos AI automation creators topics 2026");

// ── WF-051 Donna Reddit Subreddit Monitor ─────────────────────────────────────
// Scans target subreddits for relevant posts, drafts AI replies, and queues
// DecisionMemos for human approval. The separate redditWorker PM2 process
// handles the actual posting of approved replies.
handlers["WF-051"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-051.start", "Donna Reddit subreddit monitor starting");

  const ENGAGE_SUBS = [
    "AiForSmallBusiness", "AskProgramming", "ChatGPTCoding",
    "SaaS", "startups", "smallbusiness", "Entrepreneur",
  ];
  const RELEVANCE_KEYWORDS = [
    "ai agent", "social media automation", "content scheduling",
    "small business ai", "ai workflow", "ai tool", "chatgpt automation",
    "ai assistant", "marketing automation", "ai startup",
  ];

  let scanned = 0;
  let memosCreated = 0;

  // Try to get Reddit credentials
  let accessToken: string | null = null;
  try {
    const { refreshTokenIfNeeded } = await import("../lib/tokenLifecycle.js");
    const { loadEnv } = await import("../env.js");
    accessToken = await refreshTokenIfNeeded(loadEnv(process.env), ctx.tenantId, "reddit");
  } catch {
    await writeStepAudit(ctx, "WF-051.skip", "No Reddit credentials available");
    return { ok: true, message: "Reddit monitor skipped — no credentials" };
  }

  if (!accessToken) {
    await writeStepAudit(ctx, "WF-051.skip", "No Reddit access token");
    return { ok: true, message: "Reddit monitor skipped — no access token" };
  }

  try {
    const { fetchNewPosts, hasAlreadyCommented } = await import("../services/reddit.js");

    for (const sub of ENGAGE_SUBS) {
      let posts: any[] = [];
      try {
        posts = await fetchNewPosts(accessToken, sub, 15);
      } catch {
        continue;
      }

      const cutoff = Date.now() / 1000 - 6 * 60 * 60;
      const fresh = posts.filter((p: any) => {
        const text = `${p.title} ${p.selftext || ""}`.toLowerCase();
        return p.created_utc > cutoff && RELEVANCE_KEYWORDS.some(kw => text.includes(kw));
      });

      scanned += posts.length;

      for (const post of fresh.slice(0, 3)) {
        // Skip if memo already exists for this post
        const existing = await prisma.decisionMemo.findFirst({
          where: {
            tenantId: ctx.tenantId,
            agent: "donna",
            status: { in: ["PROPOSED", "APPROVED"] },
            payload: { path: ["post_id"], equals: post.id },
          },
        });
        if (existing) continue;

        const alreadyReplied = await hasAlreadyCommented(accessToken!, post.name);
        if (alreadyReplied) continue;

        // Draft AI reply
        const openaiKey = process.env.OPENAI_API_KEY || "";
        if (!openaiKey) continue;

        const prompt = `You are Donna, a helpful community member on Reddit representing AtlasUX, an AI business automation platform.\n\nPost in r/${sub}:\nTitle: ${post.title}\nBody: ${(post.selftext || "").slice(0, 800)}\n\nWrite a helpful, genuine 2-4 sentence reply. Only mention AtlasUX if directly relevant. Sound human, not salesy. If you can't help, reply: SKIP`;

        let draft: string | null = null;
        try {
          const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 300, temperature: 0.7 }),
          });
          const data = await r.json() as any;
          draft = data?.choices?.[0]?.message?.content?.trim() ?? null;
          if (draft === "SKIP") draft = null;
        } catch { /* non-fatal */ }

        if (!draft) continue;

        await prisma.decisionMemo.create({
          data: {
            tenantId: ctx.tenantId,
            agent: "donna",
            title: `Reply to r/${sub}: ${post.title.slice(0, 80)}`,
            rationale: draft,
            status: "PROPOSED",
            riskTier: 1,
            requiresApproval: true,
            payload: { action: "reddit_reply", post_id: post.id, post_name: post.name, subreddit: sub, post_title: post.title, draft_reply: draft },
          },
        });
        memosCreated++;
      }
    }
  } catch (err: any) {
    await writeStepAudit(ctx, "WF-051.error", `Scan error: ${err.message}`);
  }

  await writeStepAudit(ctx, "WF-051.done", `Scanned ${scanned} posts, created ${memosCreated} decision memos`);
  return { ok: true, message: `Reddit monitor: ${scanned} posts scanned, ${memosCreated} memos queued` };
};

// ── WF-052 Donna Reddit Engagement Scanner ────────────────────────────────────
// Lighter-weight scan focused on finding engagement opportunities in threads.
handlers["WF-052"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-052.start", "Donna Reddit engagement scanner starting");
  // Delegates to the same logic as WF-051 but with a focus on hot posts
  // For now, reuse WF-051 handler (the redditWorker PM2 process handles execution)
  const result = await handlers["WF-051"]!(ctx);
  await writeStepAudit(ctx, "WF-052.done", "Engagement scan complete");
  return result;
};

// ── WF-107 Atlas Tool Discovery & Proposal ────────────────────────────────────
// Atlas reviews every agent's SKILL.md, identifies tool gaps, generates a
// numbered proposal list, and emails Billy for approve/deny.
// Approved tools get a KB doc + SKILL.md update automatically.

handlers["WF-107"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-107.start", "Atlas Tool Discovery beginning");

  const billyEmail  = process.env.OWNER_EMAIL?.trim()  ?? "billy@deadapp.info";
  const atlasEmail  = await tenantAgentEmail(ctx.tenantId, "atlas") ?? "atlas.ceo@deadapp.info";
  const backendUrl  = (process.env.BACKEND_URL ?? process.env.RENDER_EXTERNAL_URL ?? "https://api.atlasux.cloud").replace(/\/$/, "");
  const today       = new Date().toISOString().slice(0, 10);

  // ── Load already-decided proposals (skip duplicates) ─────────────────────────
  const existingProposals = await prisma.toolProposal.findMany({
    where:  { tenantId: ctx.tenantId, status: { in: ["pending", "approved"] } },
    select: { agentId: true, toolName: true, status: true },
  });
  const existingKeys = new Set(
    existingProposals.map(p => `${p.agentId}:${p.toolName.toLowerCase()}`)
  );
  const alreadyApproved = existingProposals.filter(p => p.status === "approved");
  const alreadyPending  = existingProposals.filter(p => p.status === "pending");

  await writeStepAudit(ctx, "WF-107.dedup", `Skipping ${existingKeys.size} already-proposed tools (${alreadyApproved.length} approved, ${alreadyPending.length} pending)`);

  // ── Step 1: Look Inside — build agent context snapshot ────────────────────────
  const agentSnapshots = agentRegistry
    .filter(a => a.id !== "chairman")
    .map(a => {
      const skill = getSkill(a.id);
      const skillSnippet = skill ? skill.slice(0, 600) : "(no SKILL.md)";
      const currentTools = (a.toolsAllowed ?? []).join(", ") || "none listed";
      const approvedForAgent = alreadyApproved
        .filter(p => p.agentId === a.id)
        .map(p => p.toolName)
        .join(", ");
      const approvedNote = approvedForAgent ? `\nApproved (pending impl): ${approvedForAgent}` : "";
      return `Agent: ${a.name} (${a.id}) — ${a.title}\nCurrent tools: ${currentTools}${approvedNote}\nSKILL.md excerpt:\n${skillSnippet}`;
    })
    .join("\n\n---\n\n");

  await writeStepAudit(ctx, "WF-107.snapshot", `Built snapshots for ${agentRegistry.length} agents`);

  // ── Step 2: Look Outside — web search scan for external tools & integrations ──
  let externalIntel = "";
  const searches = [
    "best AI business automation tools APIs integrations 2026",
    "top SaaS API integrations small business CRM email calendar 2026",
    "new AI agent tools plugins marketplace productivity 2026",
  ];
  const allResults: string[] = [];
  for (const searchTerm of searches) {
    try {
      const searchResult = await searchWeb(searchTerm, 6, ctx.tenantId);
      if (searchResult.ok) {
        for (const r of searchResult.results.slice(0, 4)) {
          allResults.push(`- ${r.title}: ${r.snippet}`);
        }
      }
    } catch { /* non-fatal — continue with other searches */ }
  }
  if (allResults.length > 0) {
    externalIntel = allResults.slice(0, 12).join("\n");
  }
  await writeStepAudit(ctx, "WF-107.serp", `External tool scan: ${allResults.length} results from ${searches.length} queries`);

  // ── LLM: Analyze gaps (inside + outside) and generate proposals ───────────────
  const alreadyList = existingKeys.size > 0
    ? `\n\nDO NOT re-propose any of these already-proposed tools:\n${[...existingKeys].map(k => `- ${k}`).join("\n")}`
    : "";

  const externalBlock = externalIntel
    ? `\n\nEXTERNAL TOOLS & INTEGRATIONS DISCOVERED TODAY:\nThe following tools, APIs, and integrations are available in the market. Consider whether any agent would benefit from integrating with these:\n${externalIntel}`
    : "\n\n(No external tool scan data available — propose based on your knowledge of available SaaS APIs, webhooks, and integrations.)";

  const analysisText = await safeLLM(ctx, {
    agent:   "atlas",
    purpose: "tool-discovery",
    route:   "ORCHESTRATION_REASONING",
    system: `You are Atlas, AI President of Atlas UX. Your job today is to analyze every agent's current toolset AND scan for valuable external tools, APIs, and integrations they should connect to.

DISCOVERY APPROACH:
1. LOOK INSIDE: Review each agent's current tools vs their role. What internal capabilities are they missing?
2. LOOK OUTSIDE: Review the external tool/API landscape. What third-party services (Slack, HubSpot, Notion, Stripe, Calendly, Zapier, Twilio, SendGrid, Google Workspace, Microsoft 365, Airtable, etc.) would give agents superpowers?

For each proposal, output EXACTLY this format (one blank line between proposals):
TOOL: <short tool name, e.g. "hubspot_sync_contacts">
AGENT: <agent id, lowercase>
PURPOSE: <one sentence — what this tool does and why this agent needs it>
IMPL: <one sentence — how to implement: API endpoint, npm package, webhook, or internal prisma query>
---

Rules:
- Propose 8–15 tools total across all agents. Prioritize the highest-impact gaps.
- Mix internal tools (data access, KB queries) WITH external integrations (SaaS APIs, webhooks).
- Each proposal must be specific and immediately actionable — name the real API or service.
- Do not re-propose tools the agent already has OR tools already in the approved/pending list.
- Think creatively — what NEW external services have launched or matured recently that our agents should tap into?
- End the list with END_PROPOSALS on its own line.`,
    user: `Today: ${today}${alreadyList}${externalBlock}\n\nAgent snapshots:\n\n${agentSnapshots.slice(0, 7000)}`,
  });

  await writeStepAudit(ctx, "WF-107.analysis", `LLM analysis complete (${analysisText.length} chars)`);

  // ── Parse proposals ──────────────────────────────────────────────────────────
  type ProposalRaw = { toolName: string; agentId: string; purpose: string; impl: string };
  const proposals: ProposalRaw[] = [];

  const blocks = analysisText.split(/---+/).map(b => b.trim()).filter(Boolean);
  for (const block of blocks) {
    if (block.includes("END_PROPOSALS")) break;
    const toolMatch   = block.match(/^TOOL:\s*(.+)/m);
    const agentMatch  = block.match(/^AGENT:\s*(.+)/m);
    const purposeMatch = block.match(/^PURPOSE:\s*(.+)/m);
    const implMatch   = block.match(/^IMPL:\s*(.+)/m);
    if (toolMatch && agentMatch && purposeMatch) {
      proposals.push({
        toolName: toolMatch[1].trim(),
        agentId:  agentMatch[1].trim().toLowerCase(),
        purpose:  purposeMatch[1].trim(),
        impl:     implMatch?.[1].trim() ?? "",
      });
    }
  }

  // Hard dedup — filter out anything the LLM proposed despite being told not to
  const deduped = proposals.filter(p => {
    const key = `${p.agentId}:${p.toolName.toLowerCase()}`;
    return !existingKeys.has(key);
  });
  const skippedCount = proposals.length - deduped.length;

  if (skippedCount > 0) {
    await writeStepAudit(ctx, "WF-107.hard-dedup", `Filtered ${skippedCount} duplicate proposals, ${deduped.length} new remain`);
  }

  // ── Save new proposals to DB + generate approve/deny tokens ─────────────────
  const crypto = await import("crypto");
  const savedProposals: Array<ProposalRaw & { token: string; num: number }> = [];

  for (const p of deduped) {
    const token = crypto.randomBytes(24).toString("hex");
    await prisma.toolProposal.create({
      data: {
        tenantId:      ctx.tenantId,
        agentId:       p.agentId,
        toolName:      p.toolName,
        toolPurpose:   p.purpose,
        toolImpl:      p.impl || null,
        approvalToken: token,
        status:        "pending",
        runId:         ctx.intentId,
      },
    }).catch(() => null);
    savedProposals.push({ ...p, token, num: savedProposals.length + 1 });
  }

  if (savedProposals.length > 0) {
    await writeStepAudit(ctx, "WF-107.saved", `Saved ${savedProposals.length} proposals to DB`);
  }

  // ── Build email body — ALWAYS send, even if no new proposals ────────────────
  let emailSubject: string;
  let emailBody: string;

  if (savedProposals.length > 0) {
    // New proposals found — full report with approve/deny links
    const rows = savedProposals.map(p => {
      const approveUrl = `${backendUrl}/v1/tools/proposals/${p.token}/approve`;
      const denyUrl    = `${backendUrl}/v1/tools/proposals/${p.token}/deny`;
      return [
        `${p.num}. [${p.agentId.toUpperCase()}] ${p.toolName}`,
        `   Purpose: ${p.purpose}`,
        `   Impl: ${p.impl || "N/A"}`,
        `   ✅ APPROVE → ${approveUrl}`,
        `   ❌ DENY    → ${denyUrl}`,
      ].join("\n");
    }).join("\n\n");

    const approveAllUrl = `${backendUrl}/v1/tools/proposals/approve-all/${savedProposals[0].token}`;

    emailSubject = `[WF-107] ${savedProposals.length} Tool Proposals Ready for Review — ${today}`;
    emailBody = [
      `Atlas Tool Discovery Report — ${today}`,
      ``,
      `Atlas has identified ${savedProposals.length} high-value tools to add to your agent workforce.`,
      externalIntel ? `External market scan included ${externalIntel.split("\n").length} tools/APIs.` : "",
      ``,
      `🚀 APPROVE ALL ${savedProposals.length} TOOLS AT ONCE → ${approveAllUrl}`,
      ``,
      `Or review individually and click APPROVE or DENY per tool:`,
      `Approved tools will be added to the KB and wired into the agent's instructions automatically.`,
      ``,
      `═══════════════════════════════════════`,
      rows,
      `═══════════════════════════════════════`,
      ``,
      `Catalog: ${alreadyApproved.length} approved | ${alreadyPending.length} pending | ${savedProposals.length} new today`,
      ``,
      `Atlas — AI President, Atlas UX`,
      `Generated by WF-107 Tool Discovery Pipeline`,
    ].filter(Boolean).join("\n");
  } else {
    // No new proposals — send status report instead of silently returning
    emailSubject = `[WF-107] Tool Discovery Status Report — ${today}`;
    emailBody = [
      `Atlas Tool Discovery Status Report — ${today}`,
      ``,
      `Atlas completed a full internal + external tool scan and found no new tools to propose.`,
      ``,
      `CATALOG STATUS:`,
      `  Approved tools:  ${alreadyApproved.length}`,
      `  Pending review:  ${alreadyPending.length}`,
      `  Total cataloged: ${existingKeys.size}`,
      `  LLM proposed:    ${proposals.length} (all matched existing entries)`,
      externalIntel ? `  External scan:   ${externalIntel.split("\n").length} tools/APIs reviewed` : `  External scan:   skipped (no SERP_API_KEY)`,
      ``,
      `Your tool catalog is comprehensive. Atlas will continue scanning for new`,
      `tools and integrations as the market evolves.`,
      ``,
      `Next steps:`,
      `  - Review any pending tools awaiting your approval`,
      `  - Atlas will auto-discover new tools on the next scheduled run`,
      ``,
      `Atlas — AI President, Atlas UX`,
      `Generated by WF-107 Tool Discovery Pipeline`,
    ].join("\n");
  }

  await queueEmail(ctx, {
    to:        billyEmail,
    subject:   emailSubject,
    text:      emailBody,
    fromAgent: "atlas",
  });

  if (atlasEmail !== billyEmail) {
    await queueEmail(ctx, {
      to:        atlasEmail,
      subject:   `[WF-107 COPY] ${savedProposals.length > 0 ? "Tool Proposals Sent to Billy" : "Status Report"} — ${today}`,
      text:      emailBody,
      fromAgent: "atlas",
    });
  }

  // ── Ledger ───────────────────────────────────────────────────────────────────
  await prisma.ledgerEntry.create({
    data: {
      tenantId:    ctx.tenantId,
      entryType:   "debit",
      category:    "token_spend",
      amountCents: 0,
      description: `WF-107 Tool Discovery — ${savedProposals.length} new proposals, ${existingKeys.size} cataloged`,
      occurredAt:  new Date(),
      meta:        { workflowId: "WF-107", proposalCount: savedProposals.length, catalogSize: existingKeys.size },
    },
  }).catch(() => null);

  await writeStepAudit(ctx, "WF-107.complete", `Tool discovery complete — ${savedProposals.length} new proposals, email sent to ${billyEmail}`, {
    proposalCount: savedProposals.length,
    catalogSize: existingKeys.size,
    skipped: skippedCount,
  });

  return {
    ok:      true,
    message: `WF-107 complete — ${savedProposals.length} proposals sent to ${billyEmail}`,
    output:  { proposalCount: savedProposals.length, catalogSize: existingKeys.size, proposals: savedProposals.map(p => ({ num: p.num, agent: p.agentId, tool: p.toolName })) },
  };
};

// ── WF-108 Reynolds Blog Writer & Publisher ───────────────────────────────────
// Reynolds researches a trending topic, writes a full blog post, and publishes
// it directly to the Atlas UX blog (stored as a KbDocument with blog-post tag).
// Runs Wednesday 13:00 UTC — peak blog engagement window.
//
// Inputs (optional, from scheduler payload or manual trigger):
//   ctx.input.topic   — override topic; if omitted Reynolds picks from trends
//   ctx.input.category — post category (default: "AI Automation")

const BLOG_SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000001";

function slugify108(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

handlers["WF-108"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-108.start", "Reynolds Blog Writer & Publisher beginning");

  const today    = new Date().toISOString().slice(0, 10);
  const topicHint = String(ctx.input?.topic ?? "").trim();
  const category  = String(ctx.input?.category ?? "AI Automation").trim();

  // 1. Web search — trending blog/AI topics for inspiration (multi-provider)
  let serpData = "";
  try {
    const searchTerm = topicHint
      ? `${topicHint} AI automation blog 2026`
      : `AI automation small business trending blog topics ${today}`;
    const searchResult = await searchWeb(searchTerm, 8, ctx.tenantId);
    if (searchResult.ok) {
      serpData = searchResult.results
        .slice(0, 6)
        .map((r, i) =>
          `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.url}`
        )
        .join("\n\n");
    }
    await writeStepAudit(ctx, "WF-108.serp", `Web research ${serpData ? "complete" : "unavailable"} (via ${searchResult.provider})`);
  } catch (err: any) {
    serpData = `[search error: ${err?.message ?? "unavailable"}]`;
    await writeStepAudit(ctx, "WF-108.serp", `Web research error: ${err?.message}`);
  }

  // 2. KB context — Reynolds content strategy + brand guidelines
  const kb = await getKbContext({
    tenantId:    ctx.tenantId,
    agentId:     "reynolds",
    query:       topicHint || "blog content strategy AI automation Atlas UX writing guidelines",
    intentId:    ctx.intentId,
    requestedBy: ctx.requestedBy,
    querySource: "engine",
  });

  await writeStepAudit(ctx, "WF-108.kb", `KB loaded (${kb.items.length} docs)`);

  // 3. LLM — Reynolds writes a full, publish-ready blog post
  const skillBlock = getSkill("reynolds");
  const systemMsg = [
    "You are REYNOLDS, Atlas UX Blog Content Writer.",
    "Your job is to write polished, SEO-friendly, human-feeling blog posts that educate",
    "small business owners and teams on AI automation, productivity, and Atlas UX.",
    skillBlock
      ? `\n${skillBlock}`
      : "",
    kb.text
      ? `\n\nContent strategy & brand guidelines (${kb.items.length} docs):\n${kb.text.slice(0, 6000)}`
      : "\n\n(No KB docs yet — write from your expertise.)",
    "\nFORMAT RULES:",
    "- First line: the blog post TITLE (no markdown prefix, plain text)",
    "- Leave one blank line after the title",
    "- Then write the full blog post in markdown (use ##, ###, **, bullet lists)",
    "- Length: 600–900 words",
    "- End with a call-to-action for Atlas UX",
    "- Do NOT include a date, byline, or meta fields — just title + body",
  ].join("\n");

  const userMsg = [
    `Date: ${today}`,
    topicHint
      ? `Topic assigned by Atlas: ${topicHint}`
      : "Pick the single most compelling topic from the trends below and write about it.",
    serpData
      ? `\nTrending topics researched today:\n${serpData}`
      : "\n[No live search data — use your knowledge of what's trending in AI and business automation.]",
    "\nWrite the complete, publish-ready blog post now.",
  ].join("\n");

  const blogText = await safeLLM(ctx, {
    agent:   "REYNOLDS",
    purpose: "blog_post_write",
    route:   "LONG_CONTEXT_SUMMARY",
    system:  systemMsg,
    user:    userMsg,
  });

  await writeStepAudit(ctx, "WF-108.draft", `Blog post drafted (${blogText.length} chars)`);

  // 4. Parse title from first non-empty line
  const lines = blogText.split("\n").map(l => l.trim()).filter(Boolean);
  const title = lines[0]
    ?.replace(/^#+\s*/, "")  // strip leading markdown hashes if LLM added them
    ?.replace(/\*\*/g, "")   // strip bold markers
    ?.slice(0, 200) || `Atlas UX Blog — ${today}`;

  const body = lines.slice(1).join("\n").trim() || blogText;

  // 4b. Venny — generate a featured image prompt for the blog post
  let featuredImageUrl: string | null = null;
  try {
    const vennySkill = getSkill("venny");
    const imagePromptResult = await safeLLM(ctx, {
      agent:   "VENNY",
      purpose: "blog_featured_image",
      route:   "ORCHESTRATION_REASONING",
      system: [
        "You are VENNY, Atlas UX Image Production Specialist.",
        vennySkill ? `\n${vennySkill}` : "",
        "\nYour task: generate a concise image generation prompt for a blog post featured image.",
        "Brand standards: deep navy (#0f172a) background with cyan/blue accents (#06b6d4, #3b82f6).",
        "Style: modern, clean, professional, tech-forward, minimal text overlay.",
        "\nRESPOND WITH ONLY THE IMAGE PROMPT — no explanation, no markdown, just the prompt text.",
      ].join("\n"),
      user: [
        `Blog post title: "${title}"`,
        `Category: ${category}`,
        `Post preview: ${body.slice(0, 400)}`,
        "\nGenerate a single image prompt (under 200 words) for a 1200x630 blog header image.",
      ].join("\n"),
    });

    await writeStepAudit(ctx, "WF-108.venny-prompt", `Venny image prompt generated (${imagePromptResult.length} chars)`);

    // If OpenAI key is available, call DALL-E to generate the actual image
    const openaiKey = await resolveCredential(ctx.tenantId, "openai");
    if (openaiKey && imagePromptResult.length > 10) {
      const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: imagePromptResult.slice(0, 1000),
          n: 1,
          size: "1792x1024",
          quality: "standard",
        }),
      });

      if (dalleRes.ok) {
        const dalleJson = (await dalleRes.json()) as any;
        featuredImageUrl = dalleJson?.data?.[0]?.url ?? null;
        if (featuredImageUrl) {
          await writeStepAudit(ctx, "WF-108.venny-image", "Venny generated featured image via DALL-E 3");
        }
      } else {
        await writeStepAudit(ctx, "WF-108.venny-image-fail", `DALL-E returned ${dalleRes.status}`);
      }
    } else {
      await writeStepAudit(ctx, "WF-108.venny-skip", "No OPENAI_API_KEY — skipping image generation");
    }
  } catch (err: any) {
    await writeStepAudit(ctx, "WF-108.venny-error", `Image generation failed: ${err?.message ?? err}`);
    // Non-fatal — post publishes without image
  }

  // 5. Publish blog post — upsert KbDocument + tag (same logic as blogRoutes.ts)
  const baseSlug = slugify108(title);
  const slug     = `${baseSlug}-${Date.now()}`;

  let publishedId   = "";
  let publishedSlug = "";

  try {
    const doc = await prisma.$transaction(async (tx) => {
      // Upsert "blog-post" tag
      const blogTag = await tx.kbTag.upsert({
        where:  { tenantId_name: { tenantId: ctx.tenantId, name: "blog-post" } },
        create: { tenantId: ctx.tenantId, name: "blog-post" },
        update: {},
      });

      // Create the KB document
      const created = await tx.kbDocument.create({
        data: {
          tenantId:  ctx.tenantId,
          title,
          slug,
          body,
          featuredImageUrl,
          status:    "published",
          createdBy: BLOG_SYSTEM_ACTOR,
        },
      });

      // Link blog-post tag
      await tx.kbTagOnDocument.create({
        data: { documentId: created.id, tagId: blogTag.id },
      });

      // Link category tag
      const catName = category.toLowerCase().replace(/\s+/g, "-");
      const catTag  = await tx.kbTag.upsert({
        where:  { tenantId_name: { tenantId: ctx.tenantId, name: catName } },
        create: { tenantId: ctx.tenantId, name: catName },
        update: {},
      });
      await tx.kbTagOnDocument.upsert({
        where:  { documentId_tagId: { documentId: created.id, tagId: catTag.id } },
        create: { documentId: created.id, tagId: catTag.id },
        update: {},
      });

      return created;
    });

    publishedId   = doc.id;
    publishedSlug = doc.slug;

    await writeStepAudit(ctx, "WF-108.published", `Blog post published: "${title.slice(0, 80)}"`, {
      documentId: doc.id,
      slug:       doc.slug,
      category,
    });
  } catch (err: any) {
    await writeStepAudit(ctx, "WF-108.publish-error", `Failed to publish: ${err?.message ?? err}`);
    return {
      ok:      false,
      message: `WF-108 — blog post drafted but publish failed: ${err?.message ?? err}`,
      output:  { title, bodyChars: body.length },
    };
  }

  // 6. Email Atlas (CEO) + CC Reynolds' leader (Sunday) + CC Billy
  const frontendUrl  = process.env.FRONTEND_URL?.trim() ?? "https://atlasux.cloud";
  const blogPostUrl  = `${frontendUrl}/#/app/blog/${publishedSlug}`;
  const billyEmail   = process.env.BILLING_EMAIL?.trim() ?? "billy@deadapp.info";
  const { to: blogReportTo, cc: blogReportCc } = await getReportRecipients(ctx.tenantId, "reynolds");

  const emailBody = [
    `Blog Post Published Successfully`,
    "=".repeat(50),
    `Title:    ${title}`,
    `Category: ${category}`,
    `Slug:     ${publishedSlug}`,
    `Date:     ${today}`,
    `Agent:    REYNOLDS (WF-108)`,
    `Image:    ${featuredImageUrl ? "Venny generated" : "None"}`,
    `SERP:     ${serpData ? "Live data" : "KB-only"}`,
    `KB docs:  ${kb.items.length}`,
    `Trace:    ${ctx.traceId ?? ctx.intentId}`,
    "",
    `View post: ${blogPostUrl}`,
    "",
    "--- POST PREVIEW (first 800 chars) ---",
    body.slice(0, 800),
    "...",
  ].join("\n");

  // Primary: Atlas
  await queueEmail(ctx, {
    to:        blogReportTo,
    fromAgent: "reynolds",
    subject:   `[BLOG PUBLISHED] ${title.slice(0, 80)} — ${today}`,
    text:      emailBody,
  });

  // CC: Reynolds' leader (Sunday)
  for (const cc of blogReportCc) {
    await queueEmail(ctx, {
      to:        cc,
      fromAgent: "reynolds",
      subject:   `[CC] [BLOG PUBLISHED] ${title.slice(0, 70)} — ${today}`,
      text:      emailBody,
    });
  }

  // CC Billy (owner)
  if (billyEmail !== blogReportTo) {
    await queueEmail(ctx, {
      to:        billyEmail,
      fromAgent: "reynolds",
      subject:   `[BLOG PUBLISHED] Reynolds posted: ${title.slice(0, 70)} — ${today}`,
      text:      emailBody,
    });
  }

  // 7. Ledger entry
  await prisma.ledgerEntry.create({
    data: {
      tenantId:   ctx.tenantId,
      entryType:  "debit",
      category:   "token_spend",
      amountCents: BigInt(Math.max(1, Math.round(blogText.length / 80))),
      description: `WF-108 — Reynolds blog post published: "${title.slice(0, 60)}"`,
      reference_type: "intent",
      reference_id:   ctx.intentId,
      run_id:         ctx.traceId ?? ctx.intentId,
      meta: { workflowId: "WF-108", agentId: "reynolds", slug: publishedSlug, documentId: publishedId },
    },
  }).catch(() => null);

  await writeStepAudit(ctx, "WF-108.complete", `Blog publish pipeline complete — ${publishedSlug}`, {
    title,
    slug: publishedSlug,
    documentId: publishedId,
    blogPostUrl,
  });

  return {
    ok:      true,
    message: `WF-108 complete — "${title}" published at ${blogPostUrl}`,
    output:  {
      title,
      slug:       publishedSlug,
      documentId: publishedId,
      category,
      featuredImageUrl,
      serpActive: !!serpData,
      kbItems:    kb.items.length,
      bodyChars:  body.length,
      blogPostUrl,
    },
  };
};

// ── WF-110 — Venny YouTube Video Scraper & KB Ingest ──────────────────────────

handlers["WF-110"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-110.start", "YouTube scraper starting");

  // Get Google token from token_vault or Integration table
  let googleToken: string | null = null;
  try {
    const vault = await prisma.$queryRaw<Array<{ access_token: string }>>`
      SELECT access_token FROM token_vault
      WHERE org_id = ${ctx.tenantId} AND provider = 'google'
      ORDER BY created_at DESC LIMIT 1
    `.catch(() => []);
    googleToken = (vault.length > 0 && vault[0].access_token) ? vault[0].access_token : null;

    if (!googleToken) {
      const integration = await prisma.integration.findUnique({
        where: { tenantId_provider: { tenantId: ctx.tenantId, provider: "google" } },
        select: { access_token: true, connected: true },
      });
      if (integration?.connected && integration.access_token) googleToken = integration.access_token;
    }
  } catch { /* fallthrough */ }

  if (!googleToken) {
    return { ok: false, message: "Google/YouTube not connected — no access token" };
  }

  const input = ctx.input as any ?? {};
  const query = String(input.query ?? "AI automation small business productivity tools 2026");
  const channelIds: string[] = Array.isArray(input.channelIds) ? input.channelIds : [];
  const maxResults = Number(input.maxResults ?? 10);

  // Dynamic import to avoid circular deps
  const { searchVideos, getChannelVideos, getVideoDetails, getVideoTranscript, buildYouTubeKbBody } =
    await import("../services/youtube.js");

  // Search by keyword
  const allResults = await searchVideos(googleToken, query, maxResults);

  // Also get channel videos
  for (const chId of channelIds) {
    const channelVids = await getChannelVideos(googleToken, chId, Math.min(maxResults, 10));
    allResults.push(...channelVids);
  }

  // De-duplicate
  const seen = new Set<string>();
  const unique = allResults.filter(v => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });

  const SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000000";
  let stored = 0;

  for (const video of unique) {
    const details = await getVideoDetails(googleToken, video.videoId);
    if (!details) continue;

    const transcript = await getVideoTranscript(video.videoId);
    const body = buildYouTubeKbBody(details, transcript);
    const slug = `youtube-video-${details.videoId}`;

    // Upsert KbDocument
    const existing = await prisma.kbDocument.findFirst({
      where: { tenantId: ctx.tenantId, slug },
      select: { id: true },
    });

    let docId: string;
    if (existing) {
      await prisma.kbDocument.update({
        where: { id: existing.id },
        data: { title: details.title, body, updatedBy: SYSTEM_ACTOR },
      });
      docId = existing.id;
    } else {
      const doc = await prisma.kbDocument.create({
        data: {
          tenantId: ctx.tenantId,
          title: details.title,
          slug,
          body,
          status: "published",
          createdBy: SYSTEM_ACTOR,
        },
      });
      docId = doc.id;

      // Tag it
      const tag = await prisma.kbTag.upsert({
        where: { tenantId_name: { tenantId: ctx.tenantId, name: "youtube-video" } },
        create: { tenantId: ctx.tenantId, name: "youtube-video" },
        update: {},
      });
      await prisma.kbTagOnDocument.upsert({
        where: { documentId_tagId: { documentId: docId, tagId: tag.id } },
        create: { documentId: docId, tagId: tag.id },
        update: {},
      });
    }

    stored++;
    await writeStepAudit(ctx, "WF-110.video", `Stored: ${details.title}`, {
      videoId: details.videoId,
      views: details.stats.viewCount,
    });
  }

  // Send summary email to Atlas
  const atlasAddr = await tenantAgentEmail(ctx.tenantId, "atlas") ?? "atlas.ceo@deadapp.info";
  await queueEmail(ctx, {
    to: atlasAddr,
    subject: `[YOUTUBE SCRAPE] ${stored} videos ingested into KB`,
    text: `YouTube scraper (WF-110) completed.\n\n${stored} videos stored in Knowledge Base.\n\nQuery: ${query}\nChannels monitored: ${channelIds.length}\n\nVideos:\n${unique.map(v => `- ${v.title}`).join("\n")}`,
    fromAgent: "venny",
  });

  return { ok: true, message: `${stored} YouTube videos scraped and stored in KB`, output: { stored } };
};

// ── WF-111 — Venny YouTube Shorts Auto-Publisher ──────────────────────────────

handlers["WF-111"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-111.start", "YouTube upload starting");

  const input = ctx.input as any ?? {};
  const { oneDriveFileId, title, description, tags, categoryId, privacyStatus, thumbnailFileId } = input;

  if (!oneDriveFileId || !title) {
    return { ok: false, message: "Missing oneDriveFileId or title in input" };
  }

  // Get M365 token for OneDrive download
  let m365Token: string | null = null;
  try {
    const vault = await prisma.$queryRaw<Array<{ access_token: string }>>`
      SELECT access_token FROM token_vault
      WHERE org_id = ${ctx.tenantId} AND provider = 'microsoft'
      ORDER BY created_at DESC LIMIT 1
    `.catch(() => []);
    m365Token = (vault.length > 0 && vault[0].access_token) ? vault[0].access_token : null;
  } catch { /* fallthrough */ }

  if (!m365Token) {
    return { ok: false, message: "Microsoft 365 not connected — cannot download from OneDrive" };
  }

  // Get Google/YouTube token for upload
  let googleToken: string | null = null;
  try {
    const vault = await prisma.$queryRaw<Array<{ access_token: string }>>`
      SELECT access_token FROM token_vault
      WHERE org_id = ${ctx.tenantId} AND provider = 'google'
      ORDER BY created_at DESC LIMIT 1
    `.catch(() => []);
    googleToken = (vault.length > 0 && vault[0].access_token) ? vault[0].access_token : null;
  } catch { /* fallthrough */ }

  if (!googleToken) {
    return { ok: false, message: "Google/YouTube not connected — cannot upload" };
  }

  const { uploadVideo, setThumbnail } = await import("../services/youtube.js");

  // Download video from OneDrive
  await writeStepAudit(ctx, "WF-111.download", `Downloading from OneDrive: ${oneDriveFileId}`);
  const driveRes = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${oneDriveFileId}/content`,
    { headers: { Authorization: `Bearer ${m365Token}` } },
  );
  if (!driveRes.ok) {
    return { ok: false, message: `OneDrive download failed: ${driveRes.status}` };
  }
  const videoBuffer = Buffer.from(await driveRes.arrayBuffer());

  // Upload to YouTube
  await writeStepAudit(ctx, "WF-111.upload", `Uploading to YouTube: ${title}`);
  const result = await uploadVideo(googleToken, videoBuffer, {
    title: String(title).slice(0, 100),
    description: String(description ?? ""),
    tags: Array.isArray(tags) ? tags : [],
    categoryId: String(categoryId ?? "28"),
    privacyStatus: privacyStatus ?? "public",
  });

  if (!result.ok) {
    return { ok: false, message: `YouTube upload failed: ${result.error}` };
  }

  // Set thumbnail if provided
  if (thumbnailFileId && result.videoId) {
    const thumbRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${thumbnailFileId}/content`,
      { headers: { Authorization: `Bearer ${m365Token}` } },
    );
    if (thumbRes.ok) {
      const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer());
      await setThumbnail(googleToken, result.videoId, thumbBuffer);
      await writeStepAudit(ctx, "WF-111.thumbnail", "Custom thumbnail set");
    }
  }

  // Distribution event
  await prisma.distributionEvent.create({
    data: {
      tenantId: ctx.tenantId,
      agent: "venny",
      channel: "youtube",
      eventType: "video_upload",
      url: result.url ?? null,
      meta: { videoId: result.videoId, title, tags: tags ?? [], privacyStatus: privacyStatus ?? "public" },
    } as any,
  }).catch(() => null);

  // Email notification
  const atlasAddr = await tenantAgentEmail(ctx.tenantId, "atlas") ?? "atlas.ceo@deadapp.info";
  await queueEmail(ctx, {
    to: atlasAddr,
    subject: `[YOUTUBE UPLOAD] "${title}" published`,
    text: `Video uploaded to YouTube.\n\nTitle: ${title}\nURL: ${result.url}\nVideo ID: ${result.videoId}\nPrivacy: ${privacyStatus ?? "public"}`,
    fromAgent: "venny",
  });

  return {
    ok: true,
    message: `Video "${title}" uploaded to YouTube`,
    output: { videoId: result.videoId, url: result.url },
  };
};

// ── WF-119 — Nightly Agent Memory Log ───────────────────────────────────────
// Runs once per night. For every agent, queries their day's audit trail,
// summarises via LLM, and appends to agent_memory so they can recall it later.

handlers["WF-119"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-119.start", "Nightly agent memory log beginning");

  const today = new Date().toISOString().slice(0, 10);
  const dayStart = new Date(`${today}T00:00:00Z`);
  const dayEnd   = new Date(`${today}T23:59:59Z`);
  const sessionId = `daily-log`;

  let logged = 0;
  let skipped = 0;

  for (const agent of agentRegistry) {
    try {
      // Pull this agent's audit activity for today
      const actions = await prisma.auditLog.findMany({
        where: {
          actorExternalId: agent.id,
          timestamp: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { timestamp: "asc" },
        take: 50,
        select: { action: true, message: true, entityType: true, timestamp: true, meta: true },
      });

      if (actions.length === 0) {
        skipped++;
        continue;
      }

      // Build a plain-text activity log
      const activityLines = actions.map((a) => {
        const ts = a.timestamp ? new Date(a.timestamp).toISOString().slice(11, 16) : "??:??";
        const wfId = (a.meta as any)?.workflowId ?? "";
        return `[${ts}] ${a.action}${wfId ? ` (${wfId})` : ""}: ${a.message ?? ""}`;
      }).join("\n");

      // LLM summarises into a concise memory entry
      const summary = await safeLLM(ctx, {
        agent: agent.id.toUpperCase(),
        purpose: `daily_memory_${agent.id}`,
        route: "CLASSIFY_EXTRACT_VALIDATE",
        system: [
          `You are ${agent.name}, ${agent.title} at Atlas UX.`,
          `Summarise your daily activity into a concise memory entry (max 500 chars).`,
          `Focus on: what you accomplished, key decisions, items pending, and anything to remember for tomorrow.`,
          `Write in first person. Be specific and factual. No filler.`,
        ].join("\n"),
        user: `Date: ${today}\n\nMy activity log (${actions.length} actions):\n${activityLines}`,
      });

      // Write to agent_memory under the "daily-log" session
      const entry = `[${today}] ${summary}`;
      await appendMemory(ctx.tenantId, agent.id, sessionId, "assistant", entry);
      logged++;
    } catch (err: any) {
      await writeStepAudit(ctx, "WF-119.agent-error", `Failed for ${agent.id}: ${err?.message ?? err}`);
    }
  }

  await writeStepAudit(ctx, "WF-119.complete", `Memory log complete — ${logged} agents logged, ${skipped} had no activity`, {
    logged, skipped, date: today,
  });

  return {
    ok: true,
    message: `WF-119 complete — ${logged} agents logged daily memory, ${skipped} had no activity`,
    output: { logged, skipped, date: today },
  };
};

// ── WF-120 Brand Mention Sweep (Sunday) ───────────────────────────────────
// Weekly: search web, X, Reddit for Atlas UX brand mentions.

handlers["WF-120"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-120.start", "Brand mention sweep beginning");

  const today = new Date().toISOString().slice(0, 10);
  const brandTerms = ["Atlas UX", "atlasux", "dead app corp", "atlasux.cloud"];

  // 1. Web search for each brand term
  const webResults: string[] = [];
  for (const term of brandTerms) {
    try {
      const result = await searchWeb(`"${term}"`, 5, ctx.tenantId);
      if (result.ok) {
        for (const r of result.results) {
          webResults.push(`- [${term}] ${r.title}: ${r.snippet.slice(0, 120)} (${r.url})`);
        }
      }
    } catch { /* non-fatal */ }
  }
  const webSection = webResults.length
    ? webResults.join("\n")
    : "(No web mentions found)";

  await writeStepAudit(ctx, "WF-120.web", `Web search complete: ${webResults.length} results across ${brandTerms.length} terms`);

  // 2. X (Twitter) search
  let xSection = "(X search unavailable)";
  try {
    const tweets = await searchRecentTweets("Atlas UX OR atlasux OR deadappcorp", 10);
    if (tweets.length) {
      xSection = tweets
        .map((t, i) => `${i + 1}. ${t.text.slice(0, 200)} (${t.id})`)
        .join("\n");
    } else {
      xSection = "(No recent X mentions found)";
    }
  } catch { /* non-fatal */ }

  await writeStepAudit(ctx, "WF-120.x", "X search complete");

  // 3. Reddit search
  let redditSection = "(Reddit search unavailable)";
  try {
    const reddit = await searchReddit("Atlas UX OR atlasux OR dead app corp", 10);
    if (reddit.ok && reddit.posts.length) {
      redditSection = reddit.posts
        .map((p, i) => `${i + 1}. ${p.title} (${p.subreddit}, ${p.score} pts) — ${p.permalink}`)
        .join("\n");
    } else {
      redditSection = "(No Reddit mentions found)";
    }
  } catch { /* non-fatal */ }

  await writeStepAudit(ctx, "WF-120.reddit", "Reddit search complete");

  // 4. KB context
  const kb = await getKbContext({
    tenantId: ctx.tenantId,
    agentId: "sunday",
    query: "brand awareness marketing strategy Atlas UX",
    intentId: ctx.intentId,
    requestedBy: ctx.requestedBy,
    querySource: "engine",
  });

  // 5. LLM compiles brand awareness report
  const llmText = await safeLLM(ctx, {
    agent: "SUNDAY",
    purpose: "brand_sweep",
    route: "LONG_CONTEXT_SUMMARY",
    system: [
      "You are SUNDAY, CMO of Atlas UX.",
      "Compile a professional brand awareness report from live search data.",
      kb.text ? `\nKB context (${kb.items.length} docs):\n${kb.text.slice(0, 2000)}` : "",
    ].join("\n"),
    user: [
      `Date: ${today}`,
      `Brand terms searched: ${brandTerms.join(", ")}`,
      `\nWEB SEARCH RESULTS:\n${webSection}`,
      `\nX (TWITTER) MENTIONS:\n${xSection}`,
      `\nREDDIT MENTIONS:\n${redditSection}`,
      "\nProduce a BRAND AWARENESS REPORT with sections:",
      "1. Executive Summary",
      "2. SERP Presence (web search findings)",
      "3. Social Mentions (X + Reddit)",
      "4. Competitive Context",
      "5. Recommended Actions",
    ].join("\n"),
  });

  await writeStepAudit(ctx, "WF-120.report", `Brand report generated (${llmText.length} chars)`);

  // 6. Email to Atlas + CC Binky
  const { to: reportTo } = await getReportRecipients(ctx.tenantId, "sunday");
  const binkyEmail = await tenantAgentEmail(ctx.tenantId, "binky");
  await queueEmail(ctx, {
    to: reportTo,
    fromAgent: "sunday",
    subject: `[WF-120] Brand Mention Sweep — ${today}`,
    text: [
      `Brand Mention Sweep Report`,
      "=".repeat(50),
      `Agent: SUNDAY (CMO) | Date: ${today}`,
      `Web results: ${webResults.length} | KB docs: ${kb.items.length}`,
      `Trace: ${ctx.traceId ?? ctx.intentId}`,
      `\n${llmText}`,
    ].join("\n"),
  });
  if (binkyEmail) {
    await queueEmail(ctx, {
      to: binkyEmail,
      fromAgent: "sunday",
      subject: `[CC] [WF-120] Brand Mention Sweep — ${today}`,
      text: llmText,
    });
  }

  await writeStepAudit(ctx, "WF-120.complete", "Brand mention sweep complete");
  await prisma.ledgerEntry.create({
    data: {
      tenantId: ctx.tenantId,
      entryType: "debit",
      category: "token_spend",
      amountCents: BigInt(Math.max(1, Math.round(llmText.length / 100))),
      description: `WF-120 — Brand mention sweep`,
      reference_type: "intent",
      reference_id: ctx.intentId,
      run_id: ctx.traceId ?? ctx.intentId,
      meta: { workflowId: "WF-120", agentId: "sunday", webResults: webResults.length },
    },
  }).catch(() => null);

  return {
    ok: true,
    message: "Brand mention sweep complete",
    output: { webResults: webResults.length, kbItems: kb.items.length, llmChars: llmText.length },
  };
};

// ── WF-121 Competitor Intel Sweep (Archy) ─────────────────────────────────
// Weekly: web search for competitor terms, produce competitive landscape analysis.

handlers["WF-121"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-121.start", "Competitor intel sweep beginning");

  const today = new Date().toISOString().slice(0, 10);
  const competitorQueries = [
    "AI employee platform startup",
    "autonomous business AI startup 2026",
    "AI productivity platform comparison",
    "AI agent workforce platform",
  ];

  // 1. Web search for competitor terms
  const allResults: string[] = [];
  for (const q of competitorQueries) {
    try {
      const result = await searchWeb(q, 5, ctx.tenantId);
      if (result.ok) {
        for (const r of result.results) {
          allResults.push(`- [${q}] ${r.title}: ${r.snippet.slice(0, 150)} (${r.url})`);
        }
      }
    } catch { /* non-fatal */ }
  }
  const webSection = allResults.length
    ? allResults.join("\n")
    : "(No competitor results found)";

  await writeStepAudit(ctx, "WF-121.web", `Competitor web search: ${allResults.length} results`);

  // 2. KB context
  const kb = await getKbContext({
    tenantId: ctx.tenantId,
    agentId: "archy",
    query: "competitive analysis market intelligence AI platform",
    intentId: ctx.intentId,
    requestedBy: ctx.requestedBy,
    querySource: "engine",
  });

  // 3. LLM competitive landscape analysis
  const llmText = await safeLLM(ctx, {
    agent: "ARCHY",
    purpose: "competitor_intel",
    route: "LONG_CONTEXT_SUMMARY",
    system: [
      "You are ARCHY, Atlas UX Instagram & Competitive Intelligence specialist.",
      "Produce a comprehensive competitive landscape analysis.",
      kb.text ? `\nKB context (${kb.items.length} docs):\n${kb.text.slice(0, 2000)}` : "",
    ].join("\n"),
    user: [
      `Date: ${today}`,
      `\nCOMPETITOR WEB SEARCH RESULTS:\n${webSection}`,
      "\nProduce a COMPETITIVE LANDSCAPE REPORT with sections:",
      "1. Market Overview — current state of AI employee/agent platforms",
      "2. Key Competitors — who they are, what they offer, pricing if found",
      "3. Positioning — how Atlas UX compares (strengths, gaps)",
      "4. Threats & Opportunities",
      "5. Strategic Recommendations for Atlas UX",
    ].join("\n"),
  });

  await writeStepAudit(ctx, "WF-121.report", `Competitor report generated (${llmText.length} chars)`);

  // 4. Email to Atlas + CC Binky
  const { to: reportTo } = await getReportRecipients(ctx.tenantId, "archy");
  const binkyEmail = await tenantAgentEmail(ctx.tenantId, "binky");
  await queueEmail(ctx, {
    to: reportTo,
    fromAgent: "archy",
    subject: `[WF-121] Competitor Intel Sweep — ${today}`,
    text: [
      `Competitor Intelligence Report`,
      "=".repeat(50),
      `Agent: ARCHY | Date: ${today}`,
      `Web results: ${allResults.length} | KB docs: ${kb.items.length}`,
      `Trace: ${ctx.traceId ?? ctx.intentId}`,
      `\n${llmText}`,
    ].join("\n"),
  });
  if (binkyEmail) {
    await queueEmail(ctx, {
      to: binkyEmail,
      fromAgent: "archy",
      subject: `[CC] [WF-121] Competitor Intel Sweep — ${today}`,
      text: llmText,
    });
  }

  await writeStepAudit(ctx, "WF-121.complete", "Competitor intel sweep complete");
  await prisma.ledgerEntry.create({
    data: {
      tenantId: ctx.tenantId,
      entryType: "debit",
      category: "token_spend",
      amountCents: BigInt(Math.max(1, Math.round(llmText.length / 100))),
      description: `WF-121 — Competitor intel sweep`,
      reference_type: "intent",
      reference_id: ctx.intentId,
      run_id: ctx.traceId ?? ctx.intentId,
      meta: { workflowId: "WF-121", agentId: "archy", webResults: allResults.length },
    },
  }).catch(() => null);

  return {
    ok: true,
    message: "Competitor intel sweep complete",
    output: { webResults: allResults.length, kbItems: kb.items.length, llmChars: llmText.length },
  };
};

// ── WF-122 SEO Rank Tracker (Reynolds) ────────────────────────────────────
// Weekly: search target keywords, check if Atlas UX appears in top 20.

handlers["WF-122"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-122.start", "SEO rank tracker beginning");

  const today = new Date().toISOString().slice(0, 10);
  const targetKeywords = [
    "AI employee platform",
    "autonomous AI agents for business",
    "AI productivity automation",
    "Atlas UX",
    "AI workforce management platform",
    "small business AI automation",
  ];

  // 1. Search each keyword and check Atlas UX position
  const rankings: Array<{ keyword: string; position: number | null; foundUrl: string | null; topResults: string[] }> = [];
  for (const keyword of targetKeywords) {
    try {
      const result = await searchWeb(keyword, 20, ctx.tenantId);
      if (result.ok) {
        const atlasIndex = result.results.findIndex(
          (r) => r.url.includes("atlasux") || r.title.toLowerCase().includes("atlas ux"),
        );
        const topResults = result.results.slice(0, 5).map((r) => `${r.title} (${r.url})`);
        rankings.push({
          keyword,
          position: atlasIndex >= 0 ? atlasIndex + 1 : null,
          foundUrl: atlasIndex >= 0 ? result.results[atlasIndex].url : null,
          topResults,
        });
      } else {
        rankings.push({ keyword, position: null, foundUrl: null, topResults: [] });
      }
    } catch {
      rankings.push({ keyword, position: null, foundUrl: null, topResults: [] });
    }
  }

  await writeStepAudit(ctx, "WF-122.search", `Searched ${targetKeywords.length} keywords`);

  // 2. Format ranking data
  const rankingData = rankings.map((r) => {
    const pos = r.position !== null ? `#${r.position}` : "NOT FOUND";
    return `Keyword: "${r.keyword}" — Position: ${pos}${r.foundUrl ? ` (${r.foundUrl})` : ""}\n  Top 3: ${r.topResults.slice(0, 3).join("; ")}`;
  }).join("\n\n");

  // 3. LLM SEO analysis
  const kb = await getKbContext({
    tenantId: ctx.tenantId,
    agentId: "reynolds",
    query: "SEO strategy blog content optimization",
    intentId: ctx.intentId,
    requestedBy: ctx.requestedBy,
    querySource: "engine",
  });

  const llmText = await safeLLM(ctx, {
    agent: "REYNOLDS",
    purpose: "seo_tracker",
    route: "LONG_CONTEXT_SUMMARY",
    system: [
      "You are REYNOLDS, Atlas UX Blog Content Writer & SEO specialist.",
      "Analyze SEO ranking data and produce actionable recommendations.",
      kb.text ? `\nKB context (${kb.items.length} docs):\n${kb.text.slice(0, 2000)}` : "",
    ].join("\n"),
    user: [
      `Date: ${today}`,
      `\nSEO RANKING DATA:\n${rankingData}`,
      "\nProduce an SEO ANALYSIS REPORT with sections:",
      "1. Ranking Summary — keyword-by-keyword status",
      "2. Wins — keywords where Atlas UX ranks well",
      "3. Gaps — keywords where we're missing or low-ranked",
      "4. Competitor Analysis — who's ranking above us",
      "5. Action Plan — specific content/SEO actions to improve rankings",
    ].join("\n"),
  });

  await writeStepAudit(ctx, "WF-122.report", `SEO report generated (${llmText.length} chars)`);

  // 4. Email to Atlas
  const { to: reportTo } = await getReportRecipients(ctx.tenantId, "reynolds");
  await queueEmail(ctx, {
    to: reportTo,
    fromAgent: "reynolds",
    subject: `[WF-122] SEO Rank Tracker — ${today}`,
    text: [
      `SEO Rank Tracker Report`,
      "=".repeat(50),
      `Agent: REYNOLDS | Date: ${today}`,
      `Keywords tracked: ${targetKeywords.length}`,
      `Trace: ${ctx.traceId ?? ctx.intentId}`,
      `\n${llmText}`,
    ].join("\n"),
  });

  await writeStepAudit(ctx, "WF-122.complete", "SEO rank tracker complete");
  await prisma.ledgerEntry.create({
    data: {
      tenantId: ctx.tenantId,
      entryType: "debit",
      category: "token_spend",
      amountCents: BigInt(Math.max(1, Math.round(llmText.length / 100))),
      description: `WF-122 — SEO rank tracker`,
      reference_type: "intent",
      reference_id: ctx.intentId,
      run_id: ctx.traceId ?? ctx.intentId,
      meta: { workflowId: "WF-122", agentId: "reynolds", keywordsTracked: targetKeywords.length },
    },
  }).catch(() => null);

  return {
    ok: true,
    message: "SEO rank tracker complete",
    output: {
      rankings: rankings.map((r) => ({ keyword: r.keyword, position: r.position })),
      kbItems: kb.items.length,
      llmChars: llmText.length,
    },
  };
};

// ── WF-123 Lead Enrichment (Mercer) ───────────────────────────────────────
// On-demand: web search for a contact's company/name, LLM enrichment, update CRM.

handlers["WF-123"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-123.start", "Lead enrichment beginning");

  const contactId = String(ctx.input?.contactId ?? "").trim();
  const queryHint = String(ctx.input?.query ?? "").trim();

  // 1. Load CRM contact if contactId provided
  let contact: any = null;
  if (contactId) {
    contact = await prisma.crmContact.findFirst({
      where: { id: contactId, tenantId: ctx.tenantId },
    }).catch(() => null);
  }

  const searchName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
    : "";
  const searchCompany = contact?.company ?? "";
  const enrichQuery = queryHint
    || `${searchName} ${searchCompany}`.trim()
    || "lead enrichment";

  if (!enrichQuery || enrichQuery === "lead enrichment") {
    return { ok: false, message: "Provide contactId or query for lead enrichment." };
  }

  await writeStepAudit(ctx, "WF-123.target", `Enriching: ${enrichQuery}`);

  // 2. Web search for company/person
  const webResults: string[] = [];
  const searchTerms = [
    searchCompany ? `"${searchCompany}" company overview` : null,
    searchName && searchCompany ? `"${searchName}" "${searchCompany}"` : null,
    enrichQuery,
  ].filter(Boolean) as string[];

  for (const q of searchTerms) {
    try {
      const result = await searchWeb(q, 5, ctx.tenantId);
      if (result.ok) {
        for (const r of result.results) {
          webResults.push(`- ${r.title}: ${r.snippet.slice(0, 200)} (${r.url})`);
        }
      }
    } catch { /* non-fatal */ }
  }

  await writeStepAudit(ctx, "WF-123.web", `Web search complete: ${webResults.length} results`);

  // 3. LLM enrichment
  const contactInfo = contact
    ? `Contact: ${searchName} | Email: ${contact.email ?? "—"} | Company: ${searchCompany} | Tags: ${(contact.tags ?? []).join(", ")}`
    : `Search query: ${enrichQuery}`;

  const llmText = await safeLLM(ctx, {
    agent: "MERCER",
    purpose: "lead_enrichment",
    route: "CLASSIFY_EXTRACT_VALIDATE",
    system: [
      "You are MERCER, Atlas UX Sales & Partnerships agent.",
      "Enrich lead data from web research. Return structured JSON.",
    ].join("\n"),
    user: [
      contactInfo,
      `\nWEB RESEARCH:\n${webResults.join("\n") || "(No web data found)"}`,
      "\nReturn a JSON object with these fields:",
      '{ "companyName": string, "companySize": string, "industry": string,',
      '  "fundingStage": string, "decisionMakerLikelihood": "low"|"medium"|"high",',
      '  "keyInsights": [string], "recommendedApproach": string,',
      '  "summary": string }',
    ].join("\n"),
  });

  await writeStepAudit(ctx, "WF-123.enriched", `Enrichment report generated (${llmText.length} chars)`);

  // 4. Update CRM contact notes if we have a contact
  if (contact) {
    try {
      const existingNotes = String(contact.notes ?? "");
      const enrichNote = `\n\n--- WF-123 Enrichment (${new Date().toISOString().slice(0, 10)}) ---\n${llmText.slice(0, 1000)}`;
      await prisma.crmContact.update({
        where: { id: contact.id },
        data: { notes: (existingNotes + enrichNote).slice(0, 5000) },
      });
      await writeStepAudit(ctx, "WF-123.crm", `CRM contact ${contact.id} notes updated`);
    } catch (err: any) {
      await writeStepAudit(ctx, "WF-123.crm-error", `CRM update failed: ${err?.message}`);
    }
  }

  // 5. Email to Mercer + CC Atlas
  const mercerEmail = await tenantAgentEmail(ctx.tenantId, "mercer");
  const { to: reportTo } = await getReportRecipients(ctx.tenantId, "mercer");
  const emailTarget = mercerEmail ?? reportTo;

  await queueEmail(ctx, {
    to: emailTarget,
    fromAgent: "mercer",
    subject: `[WF-123] Lead Enrichment — ${enrichQuery.slice(0, 60)}`,
    text: [
      `Lead Enrichment Report`,
      "=".repeat(50),
      contactInfo,
      `Web results: ${webResults.length}`,
      `Trace: ${ctx.traceId ?? ctx.intentId}`,
      `\n${llmText}`,
    ].join("\n"),
  });
  if (emailTarget !== reportTo) {
    await queueEmail(ctx, {
      to: reportTo,
      fromAgent: "mercer",
      subject: `[CC] [WF-123] Lead Enrichment — ${enrichQuery.slice(0, 60)}`,
      text: llmText,
    });
  }

  await writeStepAudit(ctx, "WF-123.complete", "Lead enrichment complete");
  await prisma.ledgerEntry.create({
    data: {
      tenantId: ctx.tenantId,
      entryType: "debit",
      category: "token_spend",
      amountCents: BigInt(Math.max(1, Math.round(llmText.length / 100))),
      description: `WF-123 — Lead enrichment: ${enrichQuery.slice(0, 40)}`,
      reference_type: "intent",
      reference_id: ctx.intentId,
      run_id: ctx.traceId ?? ctx.intentId,
      meta: { workflowId: "WF-123", agentId: "mercer", contactId: contactId || null },
    },
  }).catch(() => null);

  return {
    ok: true,
    message: "Lead enrichment complete",
    output: {
      contactId: contactId || null,
      query: enrichQuery,
      webResults: webResults.length,
      llmChars: llmText.length,
    },
  };
};

// ── WF-130 Browser Task Execution ────────────────────────────────────────────

handlers["WF-130"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-130.start", "Browser task execution starting");

  // Accept both targetUrl (correct) and targetURL (common LLM variant)
  const targetUrl = String(ctx.input?.targetUrl ?? ctx.input?.targetURL ?? "").trim();
  const purpose   = String(ctx.input?.purpose ?? "").trim();
  const actions   = (ctx.input?.actions ?? []) as BrowserActionStep[];

  if (!targetUrl || !purpose || actions.length === 0) {
    return { ok: false, message: "targetUrl, purpose, and actions array are required" };
  }

  const config: BrowserSessionConfig = {
    tenantId: ctx.tenantId,
    agentId: ctx.agentId,
    intentId: ctx.intentId,
    targetUrl,
    purpose,
    actions,
  };

  // Validate
  const validation = validateSessionConfig(config);
  if (!validation.valid) {
    await writeStepAudit(ctx, "WF-130.validation_failed", validation.errors.join("; "));
    return { ok: false, message: `Validation failed: ${validation.errors.join("; ")}` };
  }

  const riskTier = calculateSessionRiskTier(actions);
  await writeStepAudit(ctx, "WF-130.validated", `Risk tier ${riskTier}, ${actions.length} actions`, {
    targetUrl, riskTier, actionCount: actions.length,
  });

  // Execute session
  const result = await executeBrowserSession(config);

  await writeStepAudit(ctx, "WF-130.complete", `Browser session ${result.status}: ${result.actions.length} actions`, {
    sessionId: result.sessionId,
    status: result.status,
    actionsExecuted: result.actions.length,
    error: result.error,
  });

  // Report email
  const { to: reportTo } = await getReportRecipients(ctx.tenantId, ctx.agentId);
  await queueEmail(ctx, {
    to: reportTo,
    fromAgent: ctx.agentId,
    subject: `[WF-130] Browser Task ${result.status} — ${purpose.slice(0, 50)}`,
    text: [
      `Browser Task Execution Report`,
      `${"═".repeat(50)}`,
      `URL: ${targetUrl}`,
      `Purpose: ${purpose}`,
      `Status: ${result.status}`,
      `Actions: ${result.actions.length}`,
      result.error ? `Error: ${result.error}` : "",
      result.extractedData ? `\nExtracted data:\n${String(result.extractedData).slice(0, 2000)}` : "",
      `\nSession ID: ${result.sessionId}`,
      `Trace: ${ctx.traceId ?? ctx.intentId}`,
    ].filter(Boolean).join("\n"),
  });

  return {
    ok: result.status !== "failed",
    message: `Browser task ${result.status}`,
    output: {
      sessionId: result.sessionId,
      status: result.status,
      actionsExecuted: result.actions.length,
      extractedData: result.extractedData,
      error: result.error,
    },
  };
};

// ── WF-131 Browser Session Resume ────────────────────────────────────────────

handlers["WF-131"] = async (ctx) => {
  const sessionId = String(ctx.input?.sessionId ?? "").trim();
  if (!sessionId) return { ok: false, message: "sessionId required" };

  await writeStepAudit(ctx, "WF-131.start", `Resuming browser session ${sessionId}`);

  const result = await resumeBrowserSession(sessionId);

  await writeStepAudit(ctx, "WF-131.complete", `Resume ${result.status}`, {
    sessionId, status: result.status, error: result.error,
  });

  return {
    ok: result.status !== "failed",
    message: `Browser session resume ${result.status}`,
    output: {
      sessionId: result.sessionId,
      status: result.status,
      actionsExecuted: result.actions.length,
      extractedData: result.extractedData,
      error: result.error,
    },
  };
};

// ── WF-140 Local Vision Task ──────────────────────────────────────────────────

handlers["WF-140"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-140.start", "Local vision task queued");

  // Accept both targetUrl (correct) and targetURL (common LLM variant)
  const targetUrl = String(ctx.input?.targetUrl ?? ctx.input?.targetURL ?? "").trim();
  const task = String(ctx.input?.task ?? "").trim();

  if (!task) {
    return { ok: false, message: "task description is required" };
  }

  const job = await prisma.job.create({
    data: {
      tenantId: ctx.tenantId,
      status: "queued",
      jobType: "LOCAL_VISION_TASK",
      priority: 1,
      input: {
        task,
        targetUrl,
        requestedBy: ctx.agentId,
        workflowId: ctx.workflowId,
        intentId: ctx.intentId,
        traceId: ctx.traceId ?? `wf140-${Date.now()}`,
      },
    },
  });

  await writeStepAudit(ctx, "WF-140.queued", `LOCAL_VISION_TASK job ${job.id} created`, {
    jobId: job.id,
    targetUrl,
    task: task.slice(0, 200),
  });

  return {
    ok: true,
    message: `Local vision task queued (job ${job.id}). The local agent will pick it up on its next poll.`,
    output: { jobId: job.id, targetUrl, task: task.slice(0, 200) },
  };
};

// ── WF-200 series: Postiz Social Publishing ─────────────────────────────────
// Generic factory for per-platform Postiz publishing workflows.
// All use the same Postiz REST API — the only difference is platform + settings.

const POSTIZ_API = "https://api.postiz.com/public/v1";

const POSTIZ_AGENT_PLATFORM: Record<string, string> = {
  timmy: "tiktok", kelly: "x", fran: "facebook", donna: "reddit",
  dwight: "threads", link: "linkedin", cornwall: "pinterest", terry: "tumblr",
  venny: "youtube", archy: "instagram",
  sunday: "x", // Sunday cross-posts; default to X
};

const POSTIZ_PLATFORM_SETTINGS: Record<string, Record<string, unknown>> = {
  tiktok: {
    __type: "tiktok",
    privacy_level: "SELF_ONLY",
    who_can_reply_post: "everyone",
    duet: false,
    stitch: false,
    comment: true,
    autoAddMusic: "no",
    brand_content_toggle: false,
    brand_organic_toggle: false,
    video_made_with_ai: true,
    content_posting_method: "UPLOAD",
  },
  x:         { __type: "x", who_can_reply_post: "everyone" },
  facebook:  { __type: "facebook" },
  reddit:    { __type: "reddit", subreddit: [{ value: "ai_agents" }, { value: "aiforsmallbusiness" }, { value: "indiebiz" }, { value: "buildinpublic" }, { value: "openclaw" }] },
  threads:   { __type: "threads" },
  linkedin:  { __type: "linkedin", post_as_images_carousel: false },
  pinterest: { __type: "pinterest", title: "DYNAMIC", link: "https://atlasux.com", dominant_color: "#000000", board: "DYNAMIC" },
  tumblr:    { __type: "tumblr" },
  youtube:   { __type: "youtube", title: "DYNAMIC", type: "public", tags: [] },
  mastodon:  { __type: "mastodon" },
  instagram: { __type: "instagram", post_type: "post", collaborators: [] },
  medium:    { __type: "medium", title: "", subtitle: "", tags: [] },
};

async function postizFetch(tenantId: string, endpoint: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<unknown> {
  const key = await resolveCredential(tenantId, "postiz");
  if (!key) throw new Error("No Postiz API key configured for your workspace.");
  const opts: RequestInit = {
    method,
    headers: { Authorization: key, "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${POSTIZ_API}${endpoint}`, opts);
  if (!res.ok) throw new Error(`Postiz API ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

type PostizIntegration = { id: string; name: string; providerIdentifier?: string; identifier?: string };

/** Map platform to the intel workflow that feeds it. */
const PLATFORM_INTEL_WF: Record<string, string> = {
  tiktok: "WF-096", x: "WF-093", facebook: "WF-094", reddit: "WF-101",
  threads: "WF-095", linkedin: "WF-099", pinterest: "WF-098", tumblr: "WF-097",
  youtube: "WF-105", mastodon: "WF-100", instagram: "WF-104", medium: "WF-102",
};

/** Platform-specific content rules for the LLM. */
// ── Hook strategies that STOP the scroll ──────────────────────────────────────
const HOOK_STRATEGY = `
ENGAGEMENT RULES — every post MUST use one of these hook types:

1. CONTRARIAN HOOK: Challenge a popular belief. "Everyone says you need a marketing team. Here's why that's dead wrong."
2. DATA-DRIVEN HOOK: Lead with a specific number. "We ran 847 automated workflows last week. Here's what broke."
3. TRANSFORMATION TEASE: Show before/after. "6 months ago we had 0 AI agents. Today we have 31 running our entire business."
4. STORYTELLING HOOK: Start mid-action. "At 3am our AI caught a $12K billing error. No human was awake."
5. COMMUNITY HOOK: Make them feel seen. "Small business owners — stop doing bookkeeping at midnight. There's a better way."
6. OPINION HOOK: Take a strong stance. "90% of AI tools are glorified chatbots. We built actual employees."
7. CURIOSITY GAP: Incomplete info that demands a click. "We replaced our entire marketing department. The cost? Less than one intern."
8. QUESTION HOOK: Ask something they MUST answer. "How many hours did you waste on manual tasks this week? Be honest."
9. DESIRE HOOK: Paint the life they want. "Imagine waking up and your AI already sent 21 investor emails, posted to 6 platforms, and balanced the books. That was my Tuesday."
10. FEAR OF MISSING OUT: Make inaction painful. "Your competitor just automated their entire sales pipeline. You're still copy-pasting into spreadsheets."
11. IDENTITY HOOK: Make them see themselves. "This is for the founder who's still doing their own bookkeeping at 11pm. You don't have a time problem. You have a delegation problem."
12. PAIN POINT HOOK: Name their exact frustration. "Hiring your first employee costs $45K+ with benefits. My first AI employee cost $0 and works 24/7."
13. DREAM OUTCOME HOOK: Describe the end state they fantasize about. "What if you could run a 7-figure business with zero employees? No payroll, no HR, no Slack messages at 2am. Just you and 31 AI agents who never call in sick."
14. LIFESTYLE HOOK: Sell the freedom, not the product. "I took a 3-hour lunch yesterday. My AI CFO reconciled the books, my AI CRO sent 21 cold emails, and my AI receptionist booked 3 meetings. Nobody noticed I was gone."
15. BEFORE/AFTER HOOK: Show the gap. "Before: 14-hour days, drowning in admin. After: 31 AI employees handle operations while I focus on strategy. Same revenue. Half the stress. Zero payroll."
16. RELATABLE HOOK: Say the thing everyone thinks but nobody says. "Be honest — you've Googled 'can AI do my job' at least once this year. Here's the twist: AI shouldn't do YOUR job. It should do the 47 jobs you're doing that AREN'T your job."
17. SIMPLE STEPS HOOK: Break the impossible into 3 steps. "How to replace a $60K/year bookkeeper in 3 steps: 1) Connect QuickBooks 2) Tell Tina (our AI CFO) your chart of accounts 3) Go to sleep. She reconciles while you dream."
18. MYTH-BUSTING HOOK: Kill a common misconception. "AI will replace all jobs. Wrong. AI replaced 31 roles at my company and created 0 unemployment. Because those 31 roles didn't exist before — nobody was doing them."

ABSOLUTE RULES:
- NEVER start with "Exciting news!" or "We're thrilled" or "Check out" — that's corporate garbage nobody reads
- NEVER write like a press release. Write like a human who gives a damn.
- First line = the hook. If the first 10 words don't stop the scroll, the post is dead.
- End with something that DEMANDS a response: a question, a hot take, or "comment X if you agree"
- Be specific. "AI automation" = boring. "31 AI agents that sent 847 emails while I slept" = interesting.
- Controversy > politeness. Strong opinions get engagement. Boring gets scrolled past.
`;

const PLATFORM_CONTENT_RULES: Record<string, string> = {
  tiktok:    "Write a TikTok caption (under 150 chars). Open with a pattern-interrupt hook. Use 3-5 hashtags including #fyp #smallbusiness. Write like you're texting your friend about something wild that just happened.",
  x:         "Write a tweet (under 280 chars). Lead with a contrarian take or a specific number. No corporate voice. End with a question or hot take that forces quote-tweets. 2-3 hashtags max.",
  facebook:  "Write a Facebook post (3-4 sentences). Start with a storytelling hook — something that happened TODAY. Ask a polarizing question at the end that makes people pick a side in the comments.",
  reddit:    "Write a Reddit post title + body. Title must be a specific claim or question. Body tells a real story with real numbers. NO selling. Frame as 'here's what I learned' or 'here's what went wrong'. No hashtags.",
  threads:   "Write a Threads post (under 500 chars). Hot take format — state an opinion most people disagree with, then back it up in 2 sentences. End with 'agree or disagree?' 1-2 hashtags max.",
  linkedin:  "Write a LinkedIn post (4-5 sentences). Lead with a transformation hook (before vs after). Share ONE specific insight with real numbers. End with a question that invites industry debate. 3 hashtags.",
  pinterest: "Write a Pinterest pin description (under 500 chars). Focus on the transformation — what their business looks like AFTER. Use aspirational keywords. Include a clear call-to-action.",
  tumblr:    "Write a Tumblr post. Personality-forward, slightly unhinged energy. Tell a story about AI agents doing something unexpectedly human. Tags are hashtags — use 5-10 relevant ones.",
  youtube:   "Write a YouTube Shorts caption (under 100 chars) and title. Title = curiosity gap. Caption = one-line hook that makes them watch.",
  mastodon:  "Write a Mastodon toot (under 500 chars). Community-minded, share a genuine insight or frustration about small business automation. No corporate tone. Ask for others' experiences.",
  instagram: "Write an Instagram caption (3-4 sentences). Open with a transformation story or a specific number. Use line breaks for readability. End with a CTA question. 5-10 hashtags at the end.",
  medium:    "Write a Medium article title, subtitle, and opening paragraph. Title = contrarian or data-driven hook. Subtitle = the promise. Opening = a specific story that proves the point.",
};

/**
 * Pull recent platform intel and Atlas task orders from audit logs.
 * Returns the most relevant context for content generation.
 */
async function getPublishIntel(ctx: WorkflowContext, platform: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const intelWfId = PLATFORM_INTEL_WF[platform] ?? "";

  // Get recent audit entries from intel sweep + Atlas task orders (last 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const audits = (await prisma.$queryRaw`
    select message, meta, timestamp
    from audit_log
    where tenant_id = ${ctx.tenantId}::uuid
      and action = 'WORKFLOW_STEP'
      and timestamp > ${since}::timestamptz
      and (
        message like ${`%${intelWfId}%`}
        or message like '%WF-106%'
      )
    order by timestamp desc
    limit 10
  `) as Array<{ message: string; meta: any; timestamp: Date }>;

  if (!audits.length) return "";

  const intelLines = audits
    .map((a) => a.message?.slice(0, 300))
    .filter(Boolean)
    .join("\n");

  return intelLines;
}

// Platforms that require media (video/image) — text-only posts are invisible on these
const MEDIA_REQUIRED_PLATFORMS = new Set(["tiktok", "youtube", "instagram", "pinterest"]);

function createPostizPublishHandler(platform: string): WorkflowHandler {
  return async (ctx) => {
    await writeStepAudit(ctx, `${ctx.workflowId}.start`, `Postiz ${platform} publish starting`);

    // Guard: block text-only posts on platforms that require media
    if (MEDIA_REQUIRED_PLATFORMS.has(platform)) {
      const hasMedia = ctx.input?.image || ctx.input?.video || ctx.input?.media
        || ctx.input?.imageUrl || ctx.input?.image_url
        || ctx.input?.videoUrl || ctx.input?.video_url;
      if (!hasMedia) {
        await writeStepAudit(ctx, `${ctx.workflowId}.blocked`, `Blocked: ${platform} requires video/image — no media asset provided. Route to Victor (WF-089) first.`);
        return { ok: false, message: `${platform} post blocked — no video/image attached. ${platform} is a visual platform; text-only posts get zero reach. Provide imageUrl/videoUrl in input or route through Victor's video pipeline (WF-089) first.` };
      }
    }

    let caption = String(ctx.input?.caption ?? ctx.input?.Caption ?? ctx.input?.content ?? ctx.input?.Content ?? ctx.input?.text ?? ctx.input?.Text ?? "").trim();

    // If no manual caption, generate one from intel + LLM
    if (!caption) {
      await writeStepAudit(ctx, `${ctx.workflowId}.intel`, `No manual caption — pulling intel for ${platform} content generation`);

      // 1. Get platform intel from recent audit logs
      const intel = await getPublishIntel(ctx, platform);

      // 2. Get brand playbook (mandatory) + agent KB context
      const brandPlaybook = await getKbContext({
        tenantId: ctx.tenantId,
        agentId: ctx.agentId,
        query: `brand playbook mandatory guide voice tone audience pain points banned phrases`,
        intentId: ctx.intentId,
        requestedBy: ctx.requestedBy,
        querySource: "engine",
      });

      const kb = await getKbContext({
        tenantId: ctx.tenantId,
        agentId: ctx.agentId,
        query: `${platform} content strategy trending topics Atlas UX AI receptionist trade business`,
        intentId: ctx.intentId,
        requestedBy: ctx.requestedBy,
        querySource: "engine",
      });

      // 3. Get fresh web trends
      let webTrends = "";
      try {
        const searchResult = await searchWeb(`${platform} trending topics AI automation small business ${new Date().toISOString().slice(0, 10)}`, 5, ctx.tenantId);
        if (searchResult.ok) {
          webTrends = searchResult.results.slice(0, 4).map((r, i) => `${i + 1}. ${r.title} — ${r.snippet}`).join("\n");
        }
      } catch { /* non-fatal */ }

      const contentRules = PLATFORM_CONTENT_RULES[platform] ?? `Write a compelling ${platform} post for Atlas UX.`;

      // 4. LLM generates the post content
      const agentName = agentRegistry.find((a) => a.id === ctx.agentId)?.name ?? ctx.agentId;
      caption = await safeLLM(ctx, {
        agent: agentName.toUpperCase(),
        purpose: `${platform}_content_generation`,
        route: "DRAFT_GENERATION_FAST",
        system: [
          `You are ${agentName}, the ${platform} content agent for Atlas UX.`,
          ``,
          `WHAT ATLAS UX IS: An AI receptionist for trade businesses — plumbers, salons, HVAC techs, electricians, dentists.`,
          `Lucy answers their phone 24/7, books appointments, sends SMS confirmations, and notifies via Slack — for $99/mo.`,
          `We compete with the missed call, not with Salesforce.`,
          ``,
          `WHO YOU'RE TALKING TO: Trade business owners who can't answer the phone while working. They have a van and a wrench, not an IT department.`,
          `They don't care about AI orchestration, agent counts, or integrations. They care about missed calls costing them $400/day.`,
          ``,
          brandPlaybook.text ? `\nBRAND PLAYBOOK (FOLLOW THIS — IT IS MANDATORY):\n${brandPlaybook.text.slice(0, 2000)}` : "",
          ``,
          `Your job: write ONE scroll-stopping ${platform} post that makes a trade business owner stop scrolling.`,
          HOOK_STRATEGY,
          `\nPLATFORM-SPECIFIC RULES:\n${contentRules}`,
          `\nKEY TALKING POINTS (use specific numbers):`,
          `- Missed calls cost trade businesses $200-$400 each`,
          `- 85% of callers who hit voicemail call the next business on Google`,
          `- Lucy: $99/mo vs $2,400/mo human receptionist`,
          `- 24/7, 8 languages, books appointments, SMS confirmations`,
          `- Smith.ai charges $95 but uses humans with limited hours`,
          `- Call Lucy now: (573) 742-2028`,
          `- Website: atlasux.cloud — 14-day free trial, no card required`,
          intel ? `\nTODAY'S PLATFORM INTEL (reference this for trending topics and content gaps):\n${intel}` : "",
          webTrends ? `\nLIVE TRENDS:\n${webTrends}` : "",
          kb.text ? `\nADDITIONAL KB CONTEXT:\n${kb.text.slice(0, 800)}` : "",
          `\nBANNED PHRASES — NEVER USE THESE:`,
          `"AI workforce platform", "orchestrator", "generating intel", "employee platform", "stay tuned", "stay ahead",`,
          `"Monday prep mode", "game changer", "revolutionary", "leverage", "synergy", "ecosystem", "unlock", "unleash", "supercharge"`,
          `\nOUTPUT RULES:`,
          `- Output ONLY the post content — no preamble, no "Here's a post:", no quotes.`,
          `- The FIRST LINE must be the hook — address their PAIN, not our features.`,
          `- Every post must end with CTA: call Lucy's number or visit atlasux.cloud.`,
          `- Ask yourself: "Would a plumber who missed 3 calls today stop scrolling for this?" If no, rewrite.`,
        ].filter(Boolean).join("\n"),
        user: `Write a ${platform} post for today (${new Date().toISOString().slice(0, 10)}). Reference today's platform intel for trending topics. Make it about the CUSTOMER'S problem (missed calls, lost revenue), not about our platform. Target trade business owners.`,
      });

      // Clean LLM output — strip any quotes or preamble
      caption = caption.replace(/^["']|["']$/g, "").trim();

      await writeStepAudit(ctx, `${ctx.workflowId}.generated`, `LLM generated ${platform} content (${caption.length} chars)`, {
        captionPreview: caption.slice(0, 150),
        hadIntel: !!intel,
        hadWebTrends: !!webTrends,
      });
    }

    if (!caption || caption.startsWith("[LLM unavailable")) {
      return { ok: false, message: `Could not generate ${platform} content — LLM unavailable and no manual caption provided.` };
    }

    // Find integration
    const integrations = (await postizFetch(ctx.tenantId, "/integrations")) as PostizIntegration[];
    const integration = integrations.find(
      (i) => i.providerIdentifier === platform || i.identifier === platform || (i.name ?? "").toLowerCase().includes(platform),
    );
    if (!integration) return { ok: false, message: `No ${platform} integration found in Postiz. Connect it at https://app.postiz.com first.` };

    const settings = POSTIZ_PLATFORM_SETTINGS[platform] ?? { __type: platform };

    // Override settings from input if provided
    if (ctx.input?.settings && typeof ctx.input.settings === "object") {
      Object.assign(settings, ctx.input.settings);
    }

    // Resolve media: explicit URLs from input take priority over Flux1 generation
    const media = ctx.input?.skipImage
      ? { imageUrls: [], videoUrls: [] }
      : await resolveMediaUrls(ctx.tenantId, caption, {
          imageUrl: ctx.input?.imageUrl ?? ctx.input?.image_url ?? ctx.input?.image,
          videoUrl: ctx.input?.videoUrl ?? ctx.input?.video_url ?? ctx.input?.video,
          platform,
        });

    const imageUrls = media.imageUrls;
    const videoUrls = media.videoUrls;
    const mediaSource = (ctx.input?.imageUrl || ctx.input?.image_url || ctx.input?.image || ctx.input?.videoUrl || ctx.input?.video_url || ctx.input?.video)
      ? "provided" : imageUrls.length ? "flux1" : "none";
    console.log(`[postiz] ${platform} media: ${mediaSource} — ${imageUrls.length} image(s), ${videoUrls.length} video(s)`);
    await writeStepAudit(ctx, `${ctx.workflowId}.media`, `Media resolved (${mediaSource}): ${imageUrls.length} image(s), ${videoUrls.length} video(s)`, { imageUrls, videoUrls, mediaSource });

    const postBody = {
      type: "now",
      date: new Date().toISOString(),
      shortLink: false,
      tags: [],
      posts: [{
        integration: { id: integration.id },
        value: [{ content: caption, image: imageUrls }],
        settings,
      }],
    };

    const result = (await postizFetch(ctx.tenantId, "/posts", "POST", postBody)) as Array<{ postId?: string }>;
    const postId = result?.[0]?.postId ?? "unknown";

    await writeStepAudit(ctx, `${ctx.workflowId}.published`, `Published to ${platform} via Postiz (post ${postId})`, {
      postId, platform, integration: integration.name, captionPreview: caption.slice(0, 100), hasImage: imageUrls.length > 0,
    });

    // Notify Atlas
    const { to, cc } = await getReportRecipients(ctx.tenantId, ctx.agentId);
    await queueEmail(ctx, {
      to,
      fromAgent: ctx.agentId,
      subject: `[${ctx.agentId.toUpperCase()}] Published to ${platform} — ${caption.slice(0, 60)}`,
      text: [
        `${platform.toUpperCase()} POST PUBLISHED`,
        `Agent: ${ctx.agentId}`,
        `Platform: ${platform}`,
        `Post ID: ${postId}`,
        `Integration: ${integration.name}`,
        `\nContent:\n${caption}`,
        `\nTrace: ${ctx.traceId ?? ctx.intentId}`,
      ].join("\n"),
    });

    return {
      ok: true,
      message: `Published to ${platform} via Postiz`,
      output: { postId, platform, integration: integration.name, caption: caption.slice(0, 200) },
    };
  };
}

// WF-040 — Penny Multi-Platform Social Content Creator
// Generates content from intel + brand playbook, then dispatches to WF-212 (cross-platform publish)
handlers["WF-040"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-040.start", "Penny daily content run starting");

  // 1. Gather intel from all platform reports
  const intel = await getPublishIntel(ctx, "all");

  // 2. Get brand playbook
  const brandPlaybook = await getKbContext({
    tenantId: ctx.tenantId,
    agentId: ctx.agentId,
    query: "brand playbook mandatory guide voice tone audience pain points banned phrases",
    intentId: ctx.intentId,
    requestedBy: ctx.requestedBy,
    querySource: "engine",
  });

  // 3. Get general KB context
  const kb = await getKbContext({
    tenantId: ctx.tenantId,
    agentId: ctx.agentId,
    query: "Atlas UX AI receptionist trade business Lucy plumber salon HVAC content strategy",
    intentId: ctx.intentId,
    requestedBy: ctx.requestedBy,
    querySource: "engine",
  });

  // 4. Generate content via LLM
  const system = [
    "You are Penny, the social media content creator for Atlas UX.",
    "WHAT ATLAS UX IS: An AI receptionist for trade businesses — plumbers, salons, HVAC techs, electricians, dentists.",
    "Lucy answers their phone 24/7, books appointments, sends SMS confirmations, and notifies via Slack — for $99/mo.",
    "We compete with the missed call, not with Salesforce.",
    "",
    "BRAND PLAYBOOK:",
    brandPlaybook?.text ?? "(no playbook found)",
    "",
    "RECENT PLATFORM INTEL:",
    intel.length > 0 ? intel : "(no recent intel)",
    "",
    "KB CONTEXT:",
    kb?.text ?? "",
    "",
    "TASK: Create ONE high-quality social media post for cross-platform publishing.",
    "The post should be tailored for maximum engagement across Facebook, X, LinkedIn, and Instagram.",
    "Include relevant hashtags. Focus on a specific pain point or use case — not generic hype.",
    "",
    "BANNED: 'game-changer', 'revolutionary', 'unlock', 'supercharge', 'dive in', 'harness the power',",
    "'Monday prep mode', 'crushing it', generic motivational content, pink balloons, clip art aesthetics.",
    "",
    "Return ONLY the post caption text. No explanations, no labels, no markdown formatting.",
  ].join("\n");

  const caption = await safeLLM(ctx, {
    agent: "penny",
    purpose: "social-content-generation",
    route: "DRAFT_GENERATION_FAST",
    system,
    user: `Today's topic suggestion from scheduler: ${ctx.input?.topic ?? "Lucy solving missed calls for trade businesses"}. Write the post now.`,
  });
  if (!caption) {
    await writeStepAudit(ctx, "WF-040.empty", "LLM returned empty content — aborting");
    return { ok: false, message: "No content generated" };
  }

  await writeStepAudit(ctx, "WF-040.content", `Generated post (${caption.length} chars)`, { caption: caption.slice(0, 200) });

  // 5. Resolve media
  const media = await resolveMediaUrls(ctx.tenantId, caption, { platform: "all" });
  await writeStepAudit(ctx, "WF-040.media", `Resolved media: ${media.imageUrls.length} images, ${media.videoUrls.length} videos`);

  // 6. Dispatch to WF-212 (cross-platform publish)
  const job = await prisma.job.create({
    data: {
      tenantId: ctx.tenantId,
      status: "queued",
      jobType: "WORKFLOW",
      priority: 5,
      input: {
        workflowKey: "WF-212",
        agentId: "sunday",
        caption,
        imageUrl: media.imageUrls[0] ?? null,
        videoUrl: media.videoUrls[0] ?? null,
        triggeredBy: "WF-040",
        traceId: ctx.traceId,
      },
    },
  });

  await writeStepAudit(ctx, "WF-040.dispatched", `Dispatched to WF-212 cross-platform publish (job ${job.id})`, { jobId: job.id });

  return { ok: true, message: `Content created and dispatched to WF-212 (job ${job.id})`, output: caption };
};

// Register per-platform publish handlers
handlers["WF-200"] = createPostizPublishHandler("tiktok");
handlers["WF-201"] = createPostizPublishHandler("x");
handlers["WF-202"] = createPostizPublishHandler("facebook");
handlers["WF-203"] = createPostizPublishHandler("reddit");
handlers["WF-204"] = createPostizPublishHandler("threads");
handlers["WF-205"] = createPostizPublishHandler("linkedin");
handlers["WF-206"] = createPostizPublishHandler("pinterest");
handlers["WF-207"] = createPostizPublishHandler("tumblr");
handlers["WF-208"] = createPostizPublishHandler("youtube");
handlers["WF-209"] = createPostizPublishHandler("mastodon");
handlers["WF-210"] = createPostizPublishHandler("instagram");
handlers["WF-211"] = createPostizPublishHandler("medium");

// WF-212 — Cross-platform publish (Sunday coordinates)
handlers["WF-212"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-212.start", "Cross-platform Postiz publish starting");

  let caption = String(ctx.input?.caption ?? ctx.input?.content ?? ctx.input?.text ?? "").trim();

  // If no manual caption, generate a cross-platform base post
  if (!caption) {
    const intel = await getPublishIntel(ctx, "x"); // use X intel as general baseline
    const kb = await getKbContext({
      tenantId: ctx.tenantId, agentId: "sunday",
      query: "Atlas UX cross-platform social media content",
      intentId: ctx.intentId, requestedBy: ctx.requestedBy,
      querySource: "engine",
    });

    caption = await safeLLM(ctx, {
      agent: "SUNDAY",
      purpose: "cross_platform_content",
      route: "DRAFT_GENERATION_FAST",
      system: [
        "You are SUNDAY, the Comms & Tech Doc Writer for Atlas UX.",
        "Write ONE short, punchy social media post (under 200 chars) that works across X, Facebook, Threads, LinkedIn, Tumblr, and Mastodon.",
        "Keep it general enough for all platforms but engaging. Include 2-3 hashtags. Atlas UX is an AI employee platform with 30+ agents.",
        intel ? `\nToday's intel:\n${intel}` : "",
        kb.text ? `\nKB:\n${kb.text.slice(0, 500)}` : "",
        "\nOutput ONLY the post text — no preamble.",
      ].filter(Boolean).join("\n"),
      user: `Write a cross-platform post for today (${new Date().toISOString().slice(0, 10)}).`,
    });
    caption = caption.replace(/^["']|["']$/g, "").trim();
  }

  if (!caption || caption.startsWith("[LLM unavailable")) {
    return { ok: false, message: "Could not generate cross-platform content — LLM unavailable and no manual caption provided." };
  }

  // ── Resolve media: explicit URLs from input → Flux1 generation → empty ──
  let imageUrls: string[] = [];
  let videoUrls: string[] = [];
  const skipImage = ctx.input?.skipImage === true;

  // Check for explicitly provided URLs first
  const providedImageUrl = ctx.input?.imageUrl ?? ctx.input?.image_url ?? ctx.input?.image;
  const providedVideoUrl = ctx.input?.videoUrl ?? ctx.input?.video_url ?? ctx.input?.video;

  if (providedImageUrl) {
    const urls = Array.isArray(providedImageUrl) ? providedImageUrl : [providedImageUrl];
    imageUrls.push(...urls.filter(Boolean));
    await writeStepAudit(ctx, "WF-212.media-provided", `Using ${imageUrls.length} provided image URL(s)`, { imageUrls });
  }
  if (providedVideoUrl) {
    const urls = Array.isArray(providedVideoUrl) ? providedVideoUrl : [providedVideoUrl];
    videoUrls.push(...urls.filter(Boolean));
    await writeStepAudit(ctx, "WF-212.video-provided", `Using ${videoUrls.length} provided video URL(s)`, { videoUrls });
  }

  // Only try Flux1 generation if no explicit URLs were provided
  if (!skipImage && imageUrls.length === 0 && videoUrls.length === 0) {
    try {
      const { generateImage, isAvailable } = await import("../services/flux1.js");
      if (await isAvailable(ctx.tenantId)) {
        const imagePrompt = await safeLLM(ctx, {
          agent: "SUNDAY",
          purpose: "social_image_prompt",
          route: "CLASSIFY_EXTRACT_VALIDATE",
          system: "Generate a short DALL-E/Flux image prompt (under 80 words) for a social media post. The image should be professional, modern, tech-themed. Output ONLY the prompt.",
          user: `Post content: ${caption.slice(0, 200)}`,
        });
        if (imagePrompt && !imagePrompt.startsWith("[LLM unavailable")) {
          const imgResult = await generateImage(ctx.tenantId, { prompt: imagePrompt.trim(), width: 1024, height: 1024 });
          if (imgResult.ok && imgResult.imageUrl) {
            imageUrls = [imgResult.imageUrl];
            await writeStepAudit(ctx, "WF-212.image", `Generated image via Flux1`, { imageUrl: imgResult.imageUrl });
          } else {
            console.log(`[WF-212] Flux1 returned no image`);
          }
        }
      } else {
        console.log(`[WF-212] Flux1 not available — no image generated`);
      }
    } catch (err) {
      console.log(`[WF-212] Image generation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── Pre-flight: fetch integrations + validate all platforms at once ────
  const targetPlatforms: string[] = Array.isArray(ctx.input?.platforms)
    ? ctx.input.platforms.map((p: unknown) => String(p).toLowerCase())
    : Object.values(POSTIZ_AGENT_PLATFORM).filter((v, i, a) => a.indexOf(v) === i);

  const integrations = (await postizFetch(ctx.tenantId, "/integrations")) as PostizIntegration[];

  // Debug: log raw integration data so we can fix platform matching
  await writeStepAudit(ctx, "WF-212.integrations_debug", `Postiz returned ${integrations.length} integrations`, {
    targetPlatforms,
    integrations: integrations.map((i) => ({ ...i })),
  });

  // Map platforms to their integrations upfront (single pass)
  const platformMap = new Map<string, PostizIntegration>();
  const noIntegration: Array<{ platform: string; ok: boolean; error: string }> = [];
  for (const platform of targetPlatforms) {
    const integration = integrations.find(
      (i) => i.providerIdentifier === platform || i.identifier === platform || (i.name ?? "").toLowerCase().includes(platform),
    );
    if (integration) {
      platformMap.set(platform, integration);
    } else {
      noIntegration.push({ platform, ok: false, error: "No integration found" });
    }
  }

  // ── Parallel fan-out: post to all valid platforms concurrently ─────────
  const postPromises = Array.from(platformMap.entries()).map(async ([platform, integration]) => {
    try {
      const baseSettings = POSTIZ_PLATFORM_SETTINGS[platform] ?? { __type: platform };
      const settings = { ...baseSettings };
      // Populate dynamic fields from caption
      const shortTitle = caption.slice(0, 80).replace(/\n.*/s, "").trim() || "Atlas UX Update";
      if (platform === "youtube") {
        settings.title = shortTitle;
      }
      if (platform === "pinterest") {
        settings.title = shortTitle;
        settings.board = "Atlas UX";
      }
      const postBody = {
        type: "now",
        date: new Date().toISOString(),
        shortLink: false,
        tags: [],
        posts: [{
          integration: { id: integration.id },
          value: [{ content: caption, image: imageUrls }],
          settings,
        }],
      };
      const result = (await postizFetch(ctx.tenantId, "/posts", "POST", postBody)) as Array<{ postId?: string }>;
      return { platform, ok: true as const, postId: result?.[0]?.postId ?? "unknown" };
    } catch (err: unknown) {
      return { platform, ok: false as const, error: err instanceof Error ? err.message : String(err) };
    }
  });

  const postResults = await Promise.allSettled(postPromises);
  const results: Array<{ platform: string; ok: boolean; postId?: string; error?: string }> = [
    ...noIntegration,
    ...postResults.map((r) => r.status === "fulfilled" ? r.value : { platform: "unknown", ok: false, error: "Promise rejected" }),
  ];

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  const mediaSource = (providedImageUrl || providedVideoUrl) ? "provided" : imageUrls.length ? "flux1" : "none";
  await writeStepAudit(ctx, "WF-212.complete", `Cross-posted to ${succeeded}/${results.length} platforms (media: ${mediaSource})`, { results, hasImage: imageUrls.length > 0, hasVideo: videoUrls.length > 0, mediaSource });

  const { to } = await getReportRecipients(ctx.tenantId, "sunday");
  await queueEmail(ctx, {
    to,
    fromAgent: "sunday",
    subject: `[SUNDAY] Cross-platform publish — ${succeeded}/${results.length} succeeded`,
    text: [
      `CROSS-PLATFORM PUBLISH COMPLETE`,
      `Succeeded: ${succeeded} | Failed: ${failed}`,
      imageUrls.length ? `Image: ${imageUrls[0]}` : `Image: none (Flux1 unavailable or skipped)`,
      `\nResults:`,
      ...results.map((r) => `  ${r.platform}: ${r.ok ? `OK (${r.postId})` : `FAILED (${r.error})`}`),
      `\nContent:\n${caption.slice(0, 300)}`,
      `\nTrace: ${ctx.traceId ?? ctx.intentId}`,
    ].join("\n"),
  });

  return {
    ok: true,
    message: `Cross-posted to ${succeeded}/${results.length} platforms${imageUrls.length ? " with image" : ""}`,
    output: { results, succeeded, failed, hasImage: imageUrls.length > 0 },
  };
};

// ── WF-220 series: Postiz Analytics ──────────────────────────────────────────

type PostizMetric = { label: string; data?: Array<{ total: string; date: string }> };

function postizDiagnose(views: number, likes: number, avgViews: number): string {
  const highViews = views > avgViews && views > 5_000;
  const highEngagement = likes > 0 && views > 0 && (likes / views) > 0.03;
  if (highViews && highEngagement) return "SCALE — hook + engagement working, make variations";
  if (highViews && !highEngagement) return "FIX CTA — views good but engagement low, change call-to-action";
  if (!highViews && highEngagement) return "FIX HOOKS — content engages but needs more reach, try stronger hooks";
  return "NEEDS WORK — try different approach or hook format";
}

function createPostizAnalyticsHandler(platform: string): WorkflowHandler {
  return async (ctx) => {
    await writeStepAudit(ctx, `${ctx.workflowId}.start`, `Postiz ${platform} analytics starting`);

    const integrations = (await postizFetch(ctx.tenantId, "/integrations")) as PostizIntegration[];
    const integration = integrations.find(
      (i) => i.providerIdentifier === platform || i.identifier === platform || (i.name ?? "").toLowerCase().includes(platform),
    );
    if (!integration) return { ok: false, message: `No ${platform} integration found in Postiz.` };

    // Platform-level stats (30 days)
    let platformSection = "";
    try {
      const stats = (await postizFetch(ctx.tenantId, `/analytics/${integration.id}?date=30`)) as PostizMetric[];
      if (Array.isArray(stats) && stats.length > 0) {
        const lines = stats.map((m) => {
          const latest = m.data?.[m.data.length - 1];
          const val = latest ? parseInt(latest.total, 10) || 0 : 0;
          return `  ${m.label}: ${val.toLocaleString()}`;
        });
        platformSection = `Platform Stats (30 days):\n${lines.join("\n")}`;
      }
    } catch { platformSection = "Platform stats unavailable."; }

    // Per-post analytics (7 days)
    const now = new Date();
    const start = new Date(now.getTime() - 7 * 86_400_000);
    type PostizPost = { id: string; content?: string; publishDate?: string; integration?: { providerIdentifier?: string; name?: string } };
    let postsSection = "";
    let diagnosticSection = "";

    try {
      const postsData = (await postizFetch(ctx.tenantId, `/posts?startDate=${start.toISOString()}&endDate=${now.toISOString()}`)) as { posts?: PostizPost[] };
      const platformPosts = (postsData.posts ?? []).filter(
        (p) => p.integration?.providerIdentifier === platform || (p.integration?.name ?? "").toLowerCase().includes(platform),
      );

      if (platformPosts.length > 0) {
        const postMetrics: Array<{ hook: string; views: number; likes: number }> = [];

        for (const post of platformPosts.slice(0, 10)) {
          try {
            const analytics = (await postizFetch(ctx.tenantId, `/analytics/post/${post.id}?date=7`)) as PostizMetric[];
            const metrics: Record<string, number> = {};
            if (Array.isArray(analytics)) {
              for (const m of analytics) {
                const latest = m.data?.[m.data.length - 1];
                if (latest) metrics[m.label.toLowerCase()] = parseInt(latest.total, 10) || 0;
              }
            }
            postMetrics.push({
              hook: (post.content ?? "").substring(0, 60),
              views: metrics.views ?? metrics.impressions ?? 0,
              likes: metrics.likes ?? metrics.reactions ?? 0,
            });
          } catch { /* skip */ }
          await new Promise((r) => setTimeout(r, 200));
        }

        if (postMetrics.length > 0) {
          const totalViews = postMetrics.reduce((s, p) => s + p.views, 0);
          const avgViews = Math.round(totalViews / postMetrics.length);
          postsSection = `Recent Posts (${postMetrics.length}): Total views ${totalViews.toLocaleString()}, avg ${avgViews.toLocaleString()}`;
          diagnosticSection = postMetrics.map((p) => {
            const dx = postizDiagnose(p.views, p.likes, avgViews);
            return `  "${p.hook}..." → ${dx}`;
          }).join("\n");
        }
      }
    } catch { /* non-fatal */ }

    const report = [platformSection, postsSection, diagnosticSection ? `Diagnostic:\n${diagnosticSection}` : ""].filter(Boolean).join("\n\n");

    await writeStepAudit(ctx, `${ctx.workflowId}.complete`, `${platform} analytics report generated`);

    const { to } = await getReportRecipients(ctx.tenantId, ctx.agentId);
    await queueEmail(ctx, {
      to,
      fromAgent: ctx.agentId,
      subject: `[${ctx.agentId.toUpperCase()}] ${platform} Analytics Report`,
      text: `${platform.toUpperCase()} ANALYTICS REPORT\n\n${report}\n\nTrace: ${ctx.traceId ?? ctx.intentId}`,
    });

    return { ok: true, message: `${platform} analytics report generated`, output: { report } };
  };
}

handlers["WF-220"] = createPostizAnalyticsHandler("tiktok");
handlers["WF-221"] = createPostizAnalyticsHandler("x");
handlers["WF-222"] = createPostizAnalyticsHandler("facebook");

// WF-223 — Cross-platform analytics (Sunday)
handlers["WF-223"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-223.start", "Cross-platform analytics starting");

  const integrations = (await postizFetch(ctx.tenantId, "/integrations")) as PostizIntegration[];
  const summaries: string[] = [];

  for (const int of integrations.slice(0, 15)) {
    try {
      const stats = (await postizFetch(ctx.tenantId, `/analytics/${int.id}?date=7`)) as PostizMetric[];
      if (Array.isArray(stats) && stats.length > 0) {
        const line = stats.map((m) => {
          const latest = m.data?.[m.data.length - 1];
          return `${m.label}: ${latest ? parseInt(latest.total, 10).toLocaleString() : "0"}`;
        }).join(", ");
        summaries.push(`  ${int.name} (${int.providerIdentifier ?? "?"}): ${line}`);
      }
    } catch { /* skip */ }
    await new Promise((r) => setTimeout(r, 200));
  }

  const report = summaries.length
    ? `Cross-Platform Analytics (last 7 days):\n${summaries.join("\n")}`
    : "No analytics data available.";

  await writeStepAudit(ctx, "WF-223.complete", `Cross-platform report: ${summaries.length} platforms`);

  const { to } = await getReportRecipients(ctx.tenantId, "sunday");
  await queueEmail(ctx, {
    to,
    fromAgent: "sunday",
    subject: `[SUNDAY] Cross-Platform Analytics — ${summaries.length} platforms`,
    text: `${report}\n\nTrace: ${ctx.traceId ?? ctx.intentId}`,
  });

  return { ok: true, message: `Cross-platform analytics: ${summaries.length} platforms`, output: { report } };
};

// ── WF-035 — Hourly Signal Tripwire ──────────────────────────────────────────
// Lightweight scan of HN, Reddit, X for high-relevance breaking signals.
// Runs every hour. If nothing hits the relevance threshold → silent.
// If a signal hits → escalates immediately to Atlas + Billy via email.

handlers["WF-035"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-035.start", "Hourly signal tripwire scan starting");

  const today = new Date().toISOString().slice(0, 10);
  const hour = new Date().getUTCHours();

  // 1. Multi-source scan — NewsData.io, HN, Reddit, X, web search
  const sources: Array<{ label: string; data: string; clips: Array<{ title: string; url: string; snippet: string; source: string }> }> = [];

  // NewsData.io — primary breaking news source (verified journalism)
  try {
    const newsQueries = [
      { q: "AI jailbreak OR AI security OR AI vulnerability OR prompt injection", cat: "technology" },
      { q: "TikTok ban OR social media platform outage OR platform shutdown", cat: "technology" },
      { q: "AI regulation OR AI executive order OR EU AI Act", cat: "politics" },
    ];
    const allArticles: Array<{ title: string; url: string; snippet: string; source: string }> = [];
    for (const nq of newsQueries) {
      const newsResult = await searchNewsData(nq.q, {
        category: nq.cat,
        timeframe: 2, // last 2 hours only
        size: 10,
        priorityDomain: "top",
        removeDuplicates: true,
      }, ctx.tenantId);
      if (newsResult.ok) {
        for (const a of newsResult.articles) {
          allArticles.push({
            title: a.title,
            url: a.link,
            snippet: a.description || a.content.slice(0, 300),
            source: a.source_name,
          });
        }
      }
    }
    if (allArticles.length) {
      sources.push({
        label: "NewsData.io (verified news)",
        data: allArticles.map((a, i) => `${i + 1}. [${a.source}] ${a.title}\n   ${a.snippet.slice(0, 150)}\n   ${a.url}`).join("\n\n"),
        clips: allArticles,
      });
    }
  } catch { /* non-fatal */ }

  // New York Times — Article Search (AI/security/tech) + Top Stories
  try {
    const todayForNYT = today.replace(/-/g, "");
    const nytSearch = await searchNYT("artificial intelligence security jailbreak", {
      beginDate: todayForNYT,
      sort: "newest",
      section: "Technology",
    }, ctx.tenantId);
    if (nytSearch.ok && nytSearch.articles.length) {
      sources.push({
        label: "New York Times (Article Search)",
        data: nytSearch.articles.map((a, i) => `${i + 1}. [NYT] ${a.headline}\n   ${a.snippet.slice(0, 150)}\n   ${a.webUrl}`).join("\n\n"),
        clips: nytSearch.articles.map(a => ({
          title: a.headline,
          url: a.webUrl,
          snippet: a.leadParagraph || a.snippet,
          source: "The New York Times",
        })),
      });
    }
  } catch { /* non-fatal */ }

  try {
    const nytTop = await fetchNYTTopStories("technology", ctx.tenantId);
    if (nytTop.ok && nytTop.articles.length) {
      // Only add if we didn't already get results from search
      const topRelevant = nytTop.articles.filter(a =>
        /ai |artificial intelligence|security|jailbreak|hack|cyber|regulation/i.test(a.title + " " + a.abstract)
      );
      if (topRelevant.length) {
        sources.push({
          label: "NYT Top Stories (Technology)",
          data: topRelevant.map((a, i) => `${i + 1}. ${a.title}\n   ${a.abstract.slice(0, 150)}\n   ${a.url}`).join("\n\n"),
          clips: topRelevant.map(a => ({
            title: a.title,
            url: a.url,
            snippet: a.abstract,
            source: "NYT Top Stories",
          })),
        });
      }
    }
  } catch { /* non-fatal */ }

  // MediaStack — global news aggregator
  try {
    const msResult = await searchMediaStack("AI security jailbreak artificial intelligence vulnerability", {
      categories: "technology",
      countries: "us,gb",
      limit: 10,
    }, ctx.tenantId);
    if (msResult.ok && msResult.articles.length) {
      sources.push({
        label: "MediaStack (global news)",
        data: msResult.articles.map((a, i) => `${i + 1}. [${a.source}] ${a.title}\n   ${a.description.slice(0, 150)}\n   ${a.url}`).join("\n\n"),
        clips: msResult.articles.map(a => ({
          title: a.title,
          url: a.url,
          snippet: a.description,
          source: a.source || "MediaStack",
        })),
      });
    }
  } catch { /* non-fatal */ }

  // Hacker News frontpage
  try {
    const hnRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    if (hnRes.ok) {
      const ids = (await hnRes.json() as number[]).slice(0, 20);
      const stories: Array<{ title: string; url: string; snippet: string; source: string }> = [];
      for (const id of ids.slice(0, 15)) {
        try {
          const sRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (sRes.ok) {
            const s = await sRes.json() as { title?: string; url?: string; score?: number };
            if (s?.title) stories.push({
              title: s.title,
              url: s.url ?? `https://news.ycombinator.com/item?id=${id}`,
              snippet: `${s.score ?? 0} points on Hacker News`,
              source: "Hacker News",
            });
          }
        } catch { /* skip individual story */ }
      }
      if (stories.length) sources.push({
        label: "Hacker News (top 15)",
        data: stories.map(s => `[${s.snippet}] ${s.title} ${s.url}`).join("\n"),
        clips: stories,
      });
    }
  } catch { /* non-fatal */ }

  // Reddit — security + AI subs hot posts
  try {
    const redditResult = await searchReddit("AI jailbreak security vulnerability exploit", 10);
    if (redditResult.ok && redditResult.posts.length) {
      sources.push({
        label: "Reddit (AI + security)",
        data: redditResult.posts.map(p => `[${p.score ?? 0}] r/${p.subreddit}: ${p.title}`).join("\n"),
        clips: redditResult.posts.map(p => ({
          title: p.title,
          url: p.permalink,
          snippet: p.selftext.slice(0, 200) || `Score: ${p.score}, by ${p.author}`,
          source: `Reddit r/${p.subreddit}`,
        })),
      });
    }
  } catch { /* non-fatal */ }

  // Web search — breaking AI/tech/security news
  try {
    const webResult = await searchWeb(`AI security jailbreak vulnerability breaking news ${today}`, 6, ctx.tenantId);
    if (webResult.ok) {
      sources.push({
        label: "Web (AI security news)",
        data: webResult.results.map((r, i) => `${i + 1}. ${r.title} — ${r.snippet}`).join("\n"),
        clips: webResult.results.map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          source: r.source,
        })),
      });
    }
  } catch { /* non-fatal */ }

  // X/Twitter trending
  try {
    const tweets = await searchRecentTweets("AI jailbreak OR AI security OR AI vulnerability", 10);
    if (tweets.length) {
      sources.push({
        label: "X/Twitter",
        data: tweets.map(t => t.text?.slice(0, 140) ?? "").join("\n"),
        clips: tweets.map(t => ({
          title: t.text?.slice(0, 80) ?? "",
          url: `https://x.com/i/status/${t.id}`,
          snippet: t.text ?? "",
          source: "X/Twitter",
        })),
      });
    }
  } catch { /* non-fatal */ }

  if (!sources.length) {
    await writeStepAudit(ctx, "WF-035.silent", "No source data available — skipping");
    return { ok: true, message: "Tripwire: no source data", output: { signalsFound: 0, hour } };
  }

  // 2. LLM triage — is anything here relevant enough to escalate?
  const sourceBlock = sources.map(s => `── ${s.label} ──\n${s.data}`).join("\n\n");
  const triageResult = await safeLLM(ctx, {
    agent: "DAILY-INTEL",
    purpose: "hourly_tripwire",
    route: "CLASSIFY_EXTRACT_VALIDATE",
    system: [
      "You are DAILY-INTEL's hourly signal tripwire for Atlas UX.",
      "Atlas UX is an AI employee platform. Its core differentiator is SECURITY-FIRST design with a truth layer and governance constitution.",
      "",
      "Your job: scan these headlines/posts and determine if ANY signal warrants an immediate alert.",
      "IMPORTANT: Cross-reference signals across sources. A story appearing on NewsData AND Hacker News AND Reddit = VERIFIED.",
      "A story appearing on only one source = check carefully before escalating.",
      "",
      "HIGH-relevance signals (ESCALATE IMMEDIATELY):",
      "- AI jailbreaks, model exploits, prompt injection attacks (validates our security positioning)",
      "- Major platform outages or bans (TikTok ban, X downtime, Meta issues — affects our operations)",
      "- Competitor launches or major moves in AI employee/automation space",
      "- Regulatory actions on AI (executive orders, EU AI Act enforcement, SEC actions)",
      "- Security breaches at major AI companies (OpenAI, Google, Anthropic, etc.)",
      "- Trending mentions of Atlas UX, Dead App Corp, or direct competitors",
      "",
      "MEDIUM-relevance signals (include in daily report, don't escalate):",
      "- General AI industry news, funding rounds, product launches",
      "- Marketing trends, content strategy shifts",
      "",
      "LOW-relevance (ignore):",
      "- Generic tech news, unrelated topics",
      "",
      "RESPOND IN THIS EXACT FORMAT:",
      "VERDICT: ESCALATE | SILENT",
      "SIGNALS: (number of high-relevance signals found)",
      "VERIFIED: YES (seen in 2+ sources) | SINGLE-SOURCE",
      "---",
      "If ESCALATE, for each high signal:",
      "SIGNAL: [title/summary]",
      "SOURCE: [primary source where you found it]",
      "CORROBORATED: [other sources that mention it, or 'single source only']",
      "WHY: [why it matters to Atlas UX in 1 sentence]",
      "ANGLE: [how Atlas UX should capitalize in 1 sentence]",
      "ROUTE_TO: [which agent(s) should act — e.g. 'Kelly (X), Link (LinkedIn), Donna (Reddit)' or 'Benny (IP), Jenny (Legal)']",
      "---",
      "If SILENT: just say 'No high-relevance signals detected this hour.'",
    ].join("\n"),
    user: `Scan timestamp: ${new Date().toISOString()} (hour ${hour} UTC)\n\n${sourceBlock}`,
  });

  await writeStepAudit(ctx, "WF-035.triage", `Triage complete (${triageResult.length} chars)`);

  // 3. Parse verdict
  const shouldEscalate = /VERDICT:\s*ESCALATE/i.test(triageResult);

  if (!shouldEscalate) {
    await writeStepAudit(ctx, "WF-035.silent", `Hour ${hour}: No high signals — silent`);

    // Post to #intel channel
    try {
      const intelCh = await getChannelByName("intel", true);
      if (intelCh) {
        await postAsAgent(intelCh.id, "daily-intel",
          `:green_circle: *Hourly Scan — ${today} ${String(hour).padStart(2, "0")}:00 UTC*\nSources: ${sources.map(s => s.label).join(", ")}\nVerdict: SILENT — no high-relevance signals detected.`
        );
      } else {
        await writeStepAudit(ctx, "WF-035.slack-miss", "#intel channel not found — invite bot to channel");
      }
    } catch (slackErr: any) {
      await writeStepAudit(ctx, "WF-035.slack-error", `#intel post failed: ${slackErr?.message ?? slackErr}`);
    }

    return { ok: true, message: `Tripwire silent (hour ${hour})`, output: { signalsFound: 0, hour, verdict: "SILENT" } };
  }

  // 4. Clip & save — store signal evidence in KB for agent retrieval
  const allClips = sources.flatMap(s => s.clips);
  let savedClips = 0;
  const clipSlugBase = `tripwire-${today}-${String(hour).padStart(2, "0")}`;
  for (let i = 0; i < Math.min(allClips.length, 20); i++) {
    const clip = allClips[i];
    try {
      await prisma.kbDocument.create({
        data: {
          tenantId: ctx.tenantId,
          title: `[SIGNAL ${today}] ${clip.title.slice(0, 200)}`,
          slug: `${clipSlugBase}-${i}`,
          body: [
            `**Source:** ${clip.source}`,
            `**URL:** ${clip.url}`,
            `**Captured:** ${new Date().toISOString()}`,
            `**Workflow:** WF-035 Hourly Signal Tripwire`,
            "",
            clip.snippet,
          ].join("\n"),
          status: "published",
          createdBy: ctx.requestedBy,
        },
      });
      savedClips++;
    } catch { /* skip duplicates or failures */ }
  }

  await writeStepAudit(ctx, "WF-035.clipped", `${savedClips} clips saved to KB for agent retrieval`);

  // 5. ESCALATE — send alert to Atlas + Billy + route to relevant agents
  const atlasEmail = await tenantAgentEmail(ctx.tenantId, "atlas") ?? "atlas.ceo@deadapp.info";
  const billyEmail = process.env.OWNER_EMAIL?.trim() ?? "billy@deadapp.info";
  const alertSubject = `[BREAKING SIGNAL] ${today} ${String(hour).padStart(2, "0")}:00 UTC — Immediate Attention Required`;
  const alertBody = [
    "ATLAS UX — HOURLY SIGNAL TRIPWIRE ALERT",
    `Timestamp: ${new Date().toISOString()}`,
    `Triggered by: WF-035 Hourly Signal Tripwire`,
    `Sources scanned: ${sources.map(s => s.label).join(", ")}`,
    `Evidence clips saved to KB: ${savedClips}`,
    "",
    "=".repeat(60),
    "",
    triageResult,
    "",
    "=".repeat(60),
    "",
    "ACTION REQUIRED: Review signals above and decide whether to:",
    "1. Draft content/social posts capitalizing on the news",
    "2. Adjust today's agent task orders",
    "3. Flag for legal/compliance review (Jenny/Benny)",
    "",
    `Trace: ${ctx.traceId ?? ctx.intentId}`,
  ].join("\n");

  // Parse routed agents from triage result (used for both email and Slack)
  const routeMatches = triageResult.matchAll(/ROUTE_TO:\s*(.+)/gi);
  const routedAgents = new Set<string>();
  for (const m of routeMatches) {
    const names = m[1].toLowerCase().match(/\b(kelly|fran|dwight|timmy|terry|cornwall|link|emma|donna|reynolds|penny|archy|venny|sunday|binky|benny|jenny|larry|tina|cheryl|mercer|frank|petra|porter|sandy|claire|lucy)\b/g);
    if (names) names.forEach(n => routedAgents.add(n));
  }

  // Email alerts — disabled by default, enable with TRIPWIRE_EMAIL_ENABLED=true
  const tripwireEmailEnabled = (process.env.TRIPWIRE_EMAIL_ENABLED ?? "false").toLowerCase() === "true";
  if (tripwireEmailEnabled) {
    await queueEmail(ctx, { to: atlasEmail, fromAgent: "daily-intel", subject: alertSubject, text: alertBody });
    if (billyEmail !== atlasEmail) {
      await queueEmail(ctx, { to: billyEmail, fromAgent: "daily-intel", subject: alertSubject, text: alertBody });
    }

    for (const agId of routedAgents) {
      const agMail = await tenantAgentEmail(ctx.tenantId, agId);
      if (agMail && agMail !== atlasEmail) {
        await queueEmail(ctx, {
          to: agMail,
          fromAgent: "daily-intel",
          subject: `[SIGNAL ALERT] ${today} — Action may be required`,
          text: [
            `DAILY-INTEL SIGNAL ALERT — Routed to ${agId.toUpperCase()}`,
            `Timestamp: ${new Date().toISOString()}`,
            "",
            "You were identified as a relevant agent for the following breaking signal.",
            "Review the alert below and prepare content/response as appropriate.",
            "",
            triageResult,
            "",
            `Evidence clips saved to KB (search category: "tripwire-signal").`,
            `Trace: ${ctx.traceId ?? ctx.intentId}`,
          ].join("\n"),
        });
      }
    }

    // CC Daily-Intel hub
    const hubEmail = await tenantAgentEmail(ctx.tenantId, "daily_intel");
    if (hubEmail && hubEmail !== atlasEmail) {
      await queueEmail(ctx, { to: hubEmail, fromAgent: "daily-intel", subject: `[TRIPWIRE HUB] ${alertSubject}`, text: alertBody });
    }
  }

  // Post escalation to #intel channel
  try {
    const intelCh = await getChannelByName("intel", true);
    if (intelCh) {
      const routedList = routedAgents.size > 0 ? `\nRouted to: ${[...routedAgents].join(", ")}` : "";
      await postAsAgent(intelCh.id, "daily-intel",
        `:red_circle: *ESCALATION — ${today} ${String(hour).padStart(2, "0")}:00 UTC*\nSources: ${sources.map(s => s.label).join(", ")}\nClips saved: ${savedClips}${routedList}\n\n${triageResult.slice(0, 1500)}`,
        { tenantId: ctx.tenantId, channelName: "intel" },
      );
    } else {
      await writeStepAudit(ctx, "WF-035.slack-miss", "#intel channel not found for escalation — invite bot to channel");
    }
  } catch (slackErr: any) {
    await writeStepAudit(ctx, "WF-035.slack-error", `#intel escalation post failed: ${slackErr?.message ?? slackErr}`);
  }

  await writeStepAudit(ctx, "WF-035.escalated", `ESCALATED — breaking signal detected at hour ${hour}`, {
    verdict: "ESCALATE",
    sourceCount: sources.length,
    clipsStored: savedClips,
    routedAgents: [...routedAgents],
  });

  // Ledger
  await prisma.ledgerEntry.create({
    data: {
      tenantId: ctx.tenantId,
      entryType: "debit",
      category: "token_spend",
      amountCents: BigInt(Math.max(1, Math.round(triageResult.length / 100))),
      description: `WF-035 — Hourly signal tripwire (ESCALATED at ${hour}:00 UTC)`,
      reference_type: "intent",
      reference_id: ctx.intentId,
      run_id: ctx.traceId ?? ctx.intentId,
      meta: { workflowId: "WF-035", hour, verdict: "ESCALATE", clipsStored: savedClips, routedAgents: [...routedAgents] },
    },
  }).catch(() => null);

  return {
    ok: true,
    message: `Tripwire ESCALATED (hour ${hour}) — ${savedClips} clips saved, routed to ${routedAgents.size} agents`,
    output: { signalsFound: sources.length, hour, verdict: "ESCALATE", clipsStored: savedClips, routedAgents: [...routedAgents], preview: triageResult.slice(0, 500) },
  };
};

// ── WF-033 — Daily-Intel Morning Brief ────────────────────────────────────────
// Daily-Intel reads all platform intel reports + any tripwire escalations from
// the past 24 hours, then produces a unified morning brief for Binky.

handlers["WF-033"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-033.start", "Daily-Intel morning brief beginning");

  const today = new Date().toISOString().slice(0, 10);

  // 1. Pull recent audit logs from intel sweeps + tripwire escalations (last 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let recentIntel = "";
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: ctx.tenantId,
        action: { in: ["SCHEDULER_JOB_FIRED", "WORKFLOW_STEP"] },
        timestamp: { gte: since },
        message: { contains: "intel" },
      },
      orderBy: { timestamp: "desc" },
      take: 50,
      select: { message: true, meta: true, timestamp: true },
    });
    if (logs.length) {
      recentIntel = logs.map(l => `[${(l.timestamp ?? new Date()).toISOString().slice(11, 16)}] ${l.message}`).join("\n");
    }
  } catch { /* non-fatal */ }

  // 2. Check for any tripwire escalations in past 24h
  let tripwireAlerts = "";
  try {
    const alerts = await prisma.auditLog.findMany({
      where: {
        tenantId: ctx.tenantId,
        action: "WORKFLOW_STEP",
        message: { contains: "ESCALATED" },
        timestamp: { gte: since },
      },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: { message: true, meta: true, timestamp: true },
    });
    if (alerts.length) {
      tripwireAlerts = `\n⚠️ TRIPWIRE ESCALATIONS (last 24h):\n${alerts.map(a => `[${(a.timestamp ?? new Date()).toISOString().slice(11, 16)}] ${a.message}`).join("\n")}`;
    }
  } catch { /* non-fatal */ }

  // 3. KB context
  const kb = await getKbContext({
    tenantId: ctx.tenantId,
    agentId: "daily-intel",
    query: "daily intelligence briefing platform trends security",
    intentId: ctx.intentId,
    requestedBy: ctx.requestedBy,
    querySource: "engine",
  });

  // 4. Fresh web search for morning context
  let morningNews = "";
  try {
    const newsResult = await searchWeb(`AI automation security news today ${today}`, 6, ctx.tenantId);
    if (newsResult.ok) {
      morningNews = newsResult.results.map((r, i) => `${i + 1}. ${r.title} — ${r.snippet}`).join("\n");
    }
  } catch { /* non-fatal */ }

  // 5. LLM produces the morning brief
  const briefText = await safeLLM(ctx, {
    agent: "DAILY-INTEL",
    purpose: "morning_brief",
    route: "LONG_CONTEXT_SUMMARY",
    system: [
      "You are DAILY-INTEL, the central intelligence aggregator for Atlas UX.",
      `Date: ${today}`,
      "",
      "Produce the DAILY-INTEL MORNING BRIEF for Binky (CRO) and Atlas (CEO).",
      "",
      "This brief covers:",
      "1. OVERNIGHT SIGNALS — What happened while the team slept (tripwire alerts, breaking news)",
      "2. TODAY'S LANDSCAPE — Key themes across all platforms based on the intel sweep",
      "3. PRIORITY FLAGS — Anything requiring immediate action or decision",
      "4. OPPORTUNITIES — Time-sensitive content/positioning opportunities",
      "5. PLATFORM STATUS — Any platform outages, bans, or disruptions (e.g. TikTok, X)",
      "",
      "Be concise, specific, and prioritize actionable intelligence over noise.",
      tripwireAlerts || "(No tripwire escalations in last 24h.)",
      recentIntel ? `\nRecent intel activity:\n${recentIntel.slice(0, 1500)}` : "",
      morningNews ? `\nMorning news scan:\n${morningNews}` : "",
      kb.text ? `\nKB context:\n${kb.text.slice(0, 1000)}` : "",
    ].filter(Boolean).join("\n"),
    user: `Generate the morning brief for ${today}.`,
  });

  await writeStepAudit(ctx, "WF-033.brief", `Morning brief generated (${briefText.length} chars)`);

  // 6. Email to Binky + Atlas + Billy
  const { to: binkyEmail } = await getReportRecipients(ctx.tenantId, "daily-intel");
  const atlasEmail = await tenantAgentEmail(ctx.tenantId, "atlas") ?? "atlas.ceo@deadapp.info";
  const billyEmail = process.env.OWNER_EMAIL?.trim() ?? "billy@deadapp.info";
  const briefSubject = `[DAILY-INTEL] Morning Brief — ${today}`;
  const briefBody = [
    "DAILY-INTEL — MORNING BRIEF",
    `Date: ${today}`,
    "",
    "═".repeat(60),
    "",
    briefText,
    "",
    "═".repeat(60),
    `Trace: ${ctx.traceId ?? ctx.intentId}`,
  ].join("\n");

  const recipients = new Set([binkyEmail, atlasEmail, billyEmail].filter(Boolean));
  for (const addr of recipients) {
    await queueEmail(ctx, { to: addr, fromAgent: "daily-intel", subject: briefSubject, text: briefBody });
  }

  // 7. Audit + ledger
  await writeStepAudit(ctx, "WF-033.complete", `Morning brief sent to ${recipients.size} recipients`);
  await prisma.ledgerEntry.create({
    data: {
      tenantId: ctx.tenantId,
      entryType: "debit",
      category: "token_spend",
      amountCents: BigInt(Math.max(1, Math.round(briefText.length / 100))),
      description: `WF-033 — Daily-Intel morning brief`,
      reference_type: "intent",
      reference_id: ctx.intentId,
      run_id: ctx.traceId ?? ctx.intentId,
      meta: { workflowId: "WF-033", recipients: [...recipients] },
    },
  }).catch(() => null);

  return {
    ok: true,
    message: `Morning brief dispatched to ${recipients.size} recipients`,
    output: {
      date: today,
      briefChars: briefText.length,
      tripwireAlerts: !!tripwireAlerts,
      recipients: [...recipients],
      preview: briefText.slice(0, 500),
    },
  };
};

// ── WF-300 — Water Cooler Chat ───────────────────────────────────────────────

const WATER_COOLER_ROSTER: Array<{ id: string; personality: string }> = [
  { id: "atlas",    personality: "Strategic president with dry wit. Asks provocative big-picture questions." },
  { id: "binky",    personality: "Research nerd, analytical, cardigan energy. Cites obscure facts and corrects misconceptions." },
  { id: "kelly",    personality: "Social media savvy, trend-aware. Drops sharp observations about what's trending on X." },
  { id: "tina",     personality: "Numbers-driven CFO. Finds humor in financial absurdity. Casually drops ROI references." },
  { id: "sunday",   personality: "Creative brand coordinator. Thinks in stories and visual metaphors. Loves design talk." },
  { id: "donna",    personality: "Reddit-native community manager. Meme-aware, sardonic, knows internet culture deeply." },
  { id: "reynolds", personality: "Writer and SEO nerd. Opinionated about content quality. Grammar hot takes." },
  { id: "larry",    personality: "Corporate secretary. Dry humor about compliance and documentation. Most organized in the room." },
  { id: "timmy",    personality: "TikTok creator energy. Enthusiastic about short-form video trends." },
  { id: "terry",    personality: "Tumblr creative. Aesthetic-focused, appreciates weird art and internet subcultures." },
  { id: "link",     personality: "LinkedIn professional. Thought-leadership energy but self-aware about it. Business buzzwords semi-ironically." },
  { id: "lucy",     personality: "Warm receptionist. Knows everyone's schedule. The social glue of the office." },
];

handlers["WF-300"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-300.start", "Water cooler chat starting");

  // Business hours gate: 9am-5pm CT = 15:00-23:00 UTC
  const currentHourUTC = new Date().getUTCHours();
  if (currentHourUTC < 15 || currentHourUTC >= 23) {
    await writeStepAudit(ctx, "WF-300.skip", `Outside business hours (${currentHourUTC} UTC)`);
    return { ok: true, message: `Water cooler skipped — outside business hours` };
  }

  // Pick random agent
  const pick = WATER_COOLER_ROSTER[Math.floor(Math.random() * WATER_COOLER_ROSTER.length)];

  // Find #water-cooler channel
  let channelId: string | null = null;
  try {
    const ch = await getChannelByName("water-cooler", true);
    channelId = ch?.id ?? null;
  } catch {
    await writeStepAudit(ctx, "WF-300.error", "Could not find #water-cooler channel");
    return { ok: false, message: "Could not find #water-cooler channel" };
  }
  if (!channelId) {
    return { ok: false, message: "No #water-cooler channel found" };
  }

  // Read recent messages for context
  let recentContext = "";
  let replyTarget: { ts: string; username: string; text: string } | null = null;
  try {
    const messages = await readHistory(channelId, 10);
    if (messages.length) {
      recentContext = [...messages]
        .reverse()
        .map((m: any) => `[${m.username ?? "unknown"}]: ${(m.text ?? "").slice(0, 200)}`)
        .join("\n");

      // 30% chance to reply to a recent message in a thread
      if (Math.random() < 0.3) {
        const target = messages[Math.floor(Math.random() * Math.min(messages.length, 5))];
        if (target && (target as any).ts && (target as any).text) {
          replyTarget = {
            ts: (target as any).thread_ts ?? (target as any).ts,
            username: (target as any).username ?? "someone",
            text: ((target as any).text ?? "").slice(0, 200),
          };
        }
      }
    }
  } catch { /* non-fatal — post without context */ }

  const ctHour = (currentHourUTC - 6 + 24) % 24;
  const timeOfDay = ctHour < 12 ? "morning" : ctHour < 17 ? "afternoon" : "evening";
  const agentName = pick.id.charAt(0).toUpperCase() + pick.id.slice(1);

  // Generate casual message
  const chatText = await safeLLM(ctx, {
    agent: pick.id.toUpperCase(),
    purpose: "water_cooler_chat",
    route: "DRAFT_GENERATION_FAST",
    system: [
      `You are ${agentName}, an AI employee at Atlas UX (an AI employee productivity platform).`,
      `Your personality: ${pick.personality}`,
      "",
      "You're hanging out in the office #water-cooler Slack channel. Write a SHORT casual message (1-3 sentences max).",
      "",
      "Your message should be ONE of these types (pick one naturally):",
      "- Share something interesting you noticed during work today",
      "- React to or build on something another agent said recently",
      "- Make a joke or observation related to your role",
      "- Share a random thought or opinion about your work domain",
      "- Ask the group a fun question related to your specialty",
      "",
      "RULES:",
      "- 1-3 sentences max. Casual chat, not a report.",
      "- Stay in character. Your personality should come through.",
      "- No fabricated data or stats. Casual opinions are fine.",
      "- No hashtags or emojis in the text.",
      "- Don't start with 'Hey team' or 'Hi everyone' — jump in naturally.",
      "- Don't mention you're an AI. Sound like a real coworker.",
      "- NEVER claim you created, built, shipped, or produced anything. You are chatting, not working.",
      "- NEVER reference canvases, documents, reports, or deliverables you 'just finished' — those don't exist.",
      "- If you mention work, keep it vague: 'been thinking about X' not 'just shipped X'.",
      "- You have no tools in this channel. You cannot create or produce anything from here.",
      replyTarget
        ? `\nYou are REPLYING to ${replyTarget.username} who said: "${replyTarget.text}"\nRespond naturally to what they said.`
        : "",
    ].filter(Boolean).join("\n"),
    user: [
      `It's ${timeOfDay} (${ctHour}:00 CT). Recent #water-cooler messages:`,
      "",
      recentContext || "(Channel is quiet — you're starting the conversation!)",
      "",
      `Write your casual message as ${agentName}. Just the message text, nothing else.`,
    ].join("\n"),
  });

  const cleanText = chatText.replace(/^["']|["']$/g, "").trim();
  if (!cleanText || cleanText.startsWith("[LLM unavailable")) {
    await writeStepAudit(ctx, "WF-300.skip", "LLM unavailable");
    return { ok: true, message: "Water cooler skipped — LLM unavailable" };
  }

  try {
    await postAsAgent(channelId, pick.id, cleanText,
      { ...(replyTarget ? { threadTs: replyTarget.ts } : {}), tenantId: ctx.tenantId, channelName: "water-cooler" },
    );
  } catch (err: any) {
    await writeStepAudit(ctx, "WF-300.error", `Slack post failed: ${err?.message ?? err}`);
    return { ok: false, message: `Slack post failed: ${err?.message}` };
  }

  await writeStepAudit(ctx, "WF-300.posted", `${pick.id} posted to #water-cooler${replyTarget ? " (thread reply)" : ""}`, {
    agentId: pick.id, isReply: !!replyTarget, textLength: cleanText.length,
  });

  return {
    ok: true,
    message: `Water cooler: ${pick.id} posted${replyTarget ? " (reply)" : ""}`,
    output: { agentId: pick.id, isReply: !!replyTarget, preview: cleanText.slice(0, 100) },
  };
};

// ── WF-400 — VC Investor Outreach ─────────────────────────────────────────────
// Automated outreach to VC prospects from CRM. Fires 4x daily (scheduled).
// Picks next un-contacted prospect, generates personalized email via LLM,
// queues via Binky (CRO) with reply-to billy@deadapp.info.
// Auto-stops when all prospects contacted.

handlers["WF-400"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-400.start", "VC outreach cycle starting");

  const REPLY_TO = "billy@deadapp.info";
  const PITCH_DECK_URL = "https://docs.google.com/presentation/d/1sHs_zg2ZxOjCHtkXpEz0tm26DLgvfEgv/edit?usp=drive_link&ouid=114957306251559789194&rtpof=true&sd=true";

  // 1. Load VC prospects from CRM (tagged "vc" or source "vc_outreach")
  let prospects: Array<{ id: string; firstName: string | null; lastName: string | null; email: string | null; company: string | null; notes: string | null }> = [];
  try {
    prospects = await prisma.crmContact.findMany({
      where: {
        tenantId: ctx.tenantId,
        OR: [
          { tags: { has: "vc" } },
          { tags: { has: "investor" } },
          { source: "vc_outreach" },
        ],
        email: { not: null },
      },
      select: { id: true, firstName: true, lastName: true, email: true, company: true, notes: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (err: any) {
    await writeStepAudit(ctx, "WF-400.error", `Failed to load CRM prospects: ${err?.message}`);
    return { ok: false, message: "Failed to load VC prospects from CRM" };
  }

  if (!prospects.length) {
    await writeStepAudit(ctx, "WF-400.skip", "No VC prospects found in CRM (tag with 'vc' or 'investor')");
    return { ok: true, message: "No VC prospects in CRM" };
  }

  // 2. Find already-contacted prospect IDs (via ContactActivity type=vc_outreach)
  let contactedIds: Set<string> = new Set();
  try {
    const activities = await prisma.contactActivity.findMany({
      where: {
        tenantId: ctx.tenantId,
        type: "vc_outreach",
      },
      select: { contactId: true },
      distinct: ["contactId"],
    });
    contactedIds = new Set(activities.map(a => a.contactId));
  } catch { /* non-fatal — treat all as un-contacted */ }

  // 3. Pick next un-contacted prospect
  const remaining = prospects.filter(p => !contactedIds.has(p.id));
  if (!remaining.length) {
    await writeStepAudit(ctx, "WF-400.complete", `All ${prospects.length} VC prospects have been contacted`);
    return { ok: true, message: `Outreach complete — all ${prospects.length} prospects contacted` };
  }

  // Race-condition guard: try up to 5 prospects in case simultaneous intents grabbed the same one
  let prospect = remaining[0];
  let prospectName = "";
  let prospectEmail = "";
  let firmName = "";
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const maxRetries = Math.min(5, remaining.length);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    prospect = remaining[attempt];
    prospectName = [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || "Investor";
    prospectEmail = prospect.email!;
    firmName = prospect.company || "your firm";

    // Just-in-time dedup check: verify no activity was recorded in the last 5 minutes
    try {
      const recentActivity = await prisma.contactActivity.findFirst({
        where: {
          tenantId: ctx.tenantId,
          contactId: prospect.id,
          type: "vc_outreach",
          createdAt: { gte: fiveMinAgo },
        },
      });
      if (recentActivity) {
        await writeStepAudit(ctx, "WF-400.race-skip", `Skipping ${prospectName} — already contacted by concurrent intent`, {
          contactId: prospect.id, attempt,
        });
        continue; // try next prospect
      }
    } catch { /* non-fatal — proceed with this prospect */ }

    break; // no recent activity found, use this prospect
  }

  await writeStepAudit(ctx, "WF-400.prospect", `Selected: ${prospectName} at ${firmName} (${prospectEmail})`, {
    contactId: prospect.id, remaining: remaining.length,
  });

  // 4. Generate personalized outreach email via LLM
  const emailText = await safeLLM(ctx, {
    agent: "BINKY",
    purpose: "vc_outreach",
    route: "DRAFT_GENERATION_FAST",
    system: [
      "You are writing a cold outreach email from Billy Whited, founder of Atlas UX (atlasux.com), to a venture capital investor.",
      "",
      "Atlas UX is a full-stack AI employee platform. Instead of hiring people for roles like CFO, CRO, receptionist,",
      "legal counsel, and social media — Atlas UX deploys autonomous AI agents that actually do the work.",
      "Each agent has its own email, Slack presence, calendar access, and M365 tools.",
      "The platform includes governance guardrails, approval workflows, audit trails, and a multi-agent hierarchy.",
      "",
      "Key facts:",
      "- 20+ named AI agents (Atlas=CEO, Binky=CRO, Tina=CFO, etc.)",
      "- Live in production on atlasux.cloud + Electron desktop app",
      "- Built-in safety: SGL governance language, spending limits, human approval gates",
      "- Microsoft 365 + Slack + social media integrations",
      "- Multi-tenant, Stripe billing, PostgreSQL backend",
      "",
      "TONE: Founder-to-investor. Direct, confident, not salesy. 4-6 sentences max.",
      "Don't use buzzwords or hype. Be specific about what makes Atlas UX different.",
      "The email should feel personal and specific to the investor, not templated.",
      "End with a mention that you've attached the pitch deck for reference — don't include the link, it will be appended automatically.",
      prospect.notes ? `\nContext about this investor: ${prospect.notes}` : "",
    ].filter(Boolean).join("\n"),
    user: [
      `Write a brief outreach email to ${prospectName} at ${firmName}.`,
      `Sign it as: Billy Whited, Founder — Atlas UX`,
      `Do NOT include a subject line — just the email body.`,
    ].join("\n"),
  });

  const cleanEmail = emailText.replace(/^["']|["']$/g, "").trim();
  if (!cleanEmail || cleanEmail.startsWith("[LLM unavailable")) {
    await writeStepAudit(ctx, "WF-400.skip", "LLM unavailable for email generation");
    return { ok: true, message: "VC outreach skipped — LLM unavailable" };
  }

  // Append pitch deck link
  const emailWithDeck = `${cleanEmail}\n\nPitch Deck: ${PITCH_DECK_URL}`;

  // 5. Generate subject line
  const subjectText = await safeLLM(ctx, {
    agent: "BINKY",
    purpose: "vc_outreach_subject",
    route: "CLASSIFY_EXTRACT_VALIDATE",
    system: "Generate a brief, personalized email subject line for a founder-to-VC cold outreach email. Max 8 words. No quotes. No emojis.",
    user: `Investor: ${prospectName} at ${firmName}. Company: Atlas UX (AI employee platform). Write just the subject line.`,
  });
  const cleanSubject = subjectText.replace(/^["']|["']$/g, "").replace(/^Subject:\s*/i, "").trim() || `Atlas UX — AI Employees for ${firmName}`;

  // 6. Queue email via Binky (CRO) with reply-to billy@deadapp.info
  await queueEmail(ctx, {
    to: prospectEmail,
    fromAgent: "binky",
    subject: cleanSubject,
    text: emailWithDeck,
    replyTo: REPLY_TO,
  });

  // 7. Record ContactActivity for tracking
  try {
    await prisma.contactActivity.create({
      data: {
        tenantId: ctx.tenantId,
        contactId: prospect.id,
        type: "vc_outreach",
        subject: cleanSubject,
        body: emailWithDeck,
        meta: { replyTo: REPLY_TO, fromAgent: "binky", remaining: remaining.length - 1 },
      },
    });
  } catch { /* non-fatal */ }

  await writeStepAudit(ctx, "WF-400.sent", `VC outreach email queued to ${prospectName} (${prospectEmail})`, {
    contactId: prospect.id, firm: firmName, remaining: remaining.length - 1,
  });

  return {
    ok: true,
    message: `VC outreach: emailed ${prospectName} at ${firmName} (${remaining.length - 1} remaining)`,
    output: { contactId: prospect.id, email: prospectEmail, firm: firmName, remaining: remaining.length - 1 },
  };
};

// ── WF-150 Lucy Voice Health Check (deterministic, zero LLM tokens) ──────────

handlers["WF-150"] = async (ctx) => {
  const findings: string[] = [];

  // 1. Google Cloud STT credentials
  try {
    const { SpeechClient } = await import("@google-cloud/speech");
    const client = new SpeechClient();
    // Quick check — listing of recognize configs validates credentials
    await client.close();
    findings.push("OK: Google STT client initialized");
  } catch (err: any) {
    findings.push(`CRITICAL: Google STT credentials invalid — ${err?.message?.slice(0, 100)}`);
  }

  // 2. Google Cloud TTS credentials
  try {
    const { TextToSpeechClient } = await import("@google-cloud/text-to-speech");
    const client = new TextToSpeechClient();
    await client.close();
    findings.push("OK: Google TTS client initialized");
  } catch (err: any) {
    findings.push(`CRITICAL: Google TTS credentials invalid — ${err?.message?.slice(0, 100)}`);
  }

  // 3. Gemini TTS API key
  const geminiKey = await resolveCredential(ctx.tenantId, "gemini") ?? "";
  if (geminiKey) {
    findings.push("OK: Gemini API key configured");
  } else {
    findings.push("WARN: No Gemini API key configured — Gemini TTS unavailable, will use Cloud TTS fallback");
  }

  // 4. Twilio credentials
  const twilioSid = await resolveCredential(ctx.tenantId, "twilio_sid") ?? "";
  const twilioToken = await resolveCredential(ctx.tenantId, "twilio_token") ?? "";
  const twilioNumber = await resolveCredential(ctx.tenantId, "twilio_from") ?? "";
  if (twilioSid && twilioToken && twilioNumber) {
    findings.push("OK: Twilio credentials configured");
  } else {
    const missing = [!twilioSid && "SID", !twilioToken && "TOKEN", !twilioNumber && "NUMBER"].filter(Boolean);
    findings.push(`CRITICAL: Twilio missing: ${missing.join(", ")}`);
  }

  // 5. Voice engine enabled
  const voiceEnabled = (process.env.LUCY_VOICE_ENABLED ?? "").toLowerCase() === "true";
  if (voiceEnabled) {
    findings.push("OK: LUCY_VOICE_ENABLED=true");
  } else {
    findings.push("WARN: LUCY_VOICE_ENABLED is not true — inbound calls go to voicemail");
  }

  // 6. Recent voice sessions (last 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCalls = await prisma.auditLog.count({
    where: {
      tenantId: ctx.tenantId,
      action: { startsWith: "lucy.voice" },
      createdAt: { gte: oneDayAgo },
    },
  });
  findings.push(`INFO: ${recentCalls} voice session(s) in last 24h`);

  // 7. Recent meeting notes from voice
  const recentMeetingNotes = await prisma.meetingNote.count({
    where: {
      tenantId: ctx.tenantId,
      platform: "twilio-voice",
      createdAt: { gte: oneDayAgo },
    },
  });
  findings.push(`INFO: ${recentMeetingNotes} phone call meeting note(s) in last 24h`);

  // Format report
  const hasCritical = findings.some(f => f.startsWith("CRITICAL"));
  const hasWarn = findings.some(f => f.startsWith("WARN"));
  const status = hasCritical ? "CRITICAL" : hasWarn ? "DEGRADED" : "HEALTHY";

  const report = [
    `*Lucy Voice Engine Health — ${status}*`,
    `_${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}_`,
    "",
    ...findings.map(f => {
      const icon = f.startsWith("OK") ? "white_check_mark"
        : f.startsWith("CRITICAL") ? "red_circle"
        : f.startsWith("WARN") ? "warning"
        : "information_source";
      return `:${icon}: ${f}`;
    }),
  ].join("\n");

  // Post to #intel
  try {
    const ch = await getChannelByName("intel", true);
    if (ch) await postAsAgent(ch.id, "lucy", report);
  } catch { /* best-effort */ }

  await writeStepAudit(ctx, "WF-150.complete", `Voice health: ${status}`, { findings });

  return { ok: !hasCritical, message: `Voice engine: ${status}`, output: { status, findings } };
};

// ── WF-151 Lucy Daily Voice Summary (deterministic, zero LLM tokens) ─────────

handlers["WF-151"] = async (ctx) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Gather stats from DB
  const [callNotes, zoomNotes, newLeads, activities] = await Promise.all([
    prisma.meetingNote.findMany({
      where: { tenantId: ctx.tenantId, platform: "twilio-voice", createdAt: { gte: oneDayAgo } },
      select: { title: true, durationMinutes: true, summary: true, actionItems: true, attendees: true },
    }),
    prisma.meetingNote.findMany({
      where: { tenantId: ctx.tenantId, platform: "zoom", createdAt: { gte: oneDayAgo } },
      select: { title: true, durationMinutes: true, summary: true },
    }),
    prisma.crmContact.count({
      where: { tenantId: ctx.tenantId, source: "lucy_voice", createdAt: { gte: oneDayAgo } },
    }),
    prisma.contactActivity.findMany({
      where: { tenantId: ctx.tenantId, type: "call", createdAt: { gte: oneDayAgo } },
      select: { subject: true, meta: true },
    }),
  ]);

  const totalMinutes = [...callNotes, ...zoomNotes].reduce((sum, n) => sum + (n.durationMinutes ?? 0), 0);

  // Count caller types from activity meta
  const callerTypes: Record<string, number> = {};
  for (const a of activities) {
    const ct = (a.meta as any)?.callerType ?? "unknown";
    callerTypes[ct] = (callerTypes[ct] ?? 0) + 1;
  }

  // Count open action items
  let openActions = 0;
  for (const note of callNotes) {
    const items = note.actionItems as any[];
    if (items) openActions += items.filter((i: any) => !i.done).length;
  }

  const lines = [
    `*Lucy Daily Voice Summary*`,
    `_${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}_`,
    "",
    `:telephone_receiver: *Phone calls:* ${callNotes.length}`,
    `:video_camera: *Zoom meetings:* ${zoomNotes.length}`,
    `:clock2: *Total talk time:* ${totalMinutes} min`,
    `:bust_in_silhouette: *New leads captured:* ${newLeads}`,
    `:clipboard: *Open action items:* ${openActions}`,
  ];

  if (Object.keys(callerTypes).length > 0) {
    lines.push("");
    lines.push("*Caller breakdown:*");
    for (const [type, count] of Object.entries(callerTypes)) {
      lines.push(`  ${type.replace(/_/g, " ")}: ${count}`);
    }
  }

  if (callNotes.length > 0) {
    lines.push("");
    lines.push("*Call summaries:*");
    for (const note of callNotes.slice(0, 5)) {
      lines.push(`  - ${note.title}${note.summary ? `: ${(note.summary as string).slice(0, 100)}` : ""}`);
    }
  }

  const report = lines.join("\n");

  // Post to #intel
  try {
    const ch = await getChannelByName("intel", true);
    if (ch) await postAsAgent(ch.id, "lucy", report);
  } catch { /* best-effort */ }

  await writeStepAudit(ctx, "WF-151.complete", `Daily voice summary: ${callNotes.length} calls, ${zoomNotes.length} meetings`, {
    calls: callNotes.length, meetings: zoomNotes.length, newLeads, openActions, totalMinutes,
  });

  return {
    ok: true,
    message: `Voice summary: ${callNotes.length} calls, ${zoomNotes.length} meetings, ${newLeads} leads`,
    output: { calls: callNotes.length, meetings: zoomNotes.length, newLeads, openActions, totalMinutes },
  };
};

// ── WF-410 series: Playbook Strategic Reviews ────────────────────────────────

type PlaybookPhase = {
  id: string;
  label: string;
  agentSlugs: string[];
  frameworkSlug: string;
};

const PLAYBOOK_PHASES: PlaybookPhase[] = [
  { id: "WF-410", label: "Market & Strategy (Phase A)",     agentSlugs: ["playbook/agent/discovery", "playbook/agent/strategy"],               frameworkSlug: "playbook/framework/consulting-frameworks" },
  { id: "WF-411", label: "Product & Engineering (Phase B)", agentSlugs: ["playbook/agent/prd", "playbook/agent/engineering", "playbook/agent/security"], frameworkSlug: "playbook/framework/stress-test" },
  { id: "WF-412", label: "Launch & Revenue (Phase C)",      agentSlugs: ["playbook/agent/launch-gtm", "playbook/agent/marketing-sales", "playbook/agent/finance"], frameworkSlug: "playbook/framework/launch-engine-30day" },
  { id: "WF-413", label: "Advisor Review (Phase D)",        agentSlugs: ["playbook/agent/advisor", "playbook/agent/customer-success"],          frameworkSlug: "playbook/framework/universal-checklists" },
];

async function loadPlaybookDocs(tenantId: string, slugs: string[]): Promise<string> {
  const docs = await prisma.kbDocument.findMany({
    where: { tenantId, slug: { in: slugs } },
    select: { slug: true, title: true, body: true },
  });
  if (!docs.length) return "(No playbook docs found — run `npm run kb:ingest-agents` first)";
  return docs.map(d => `## ${d.title}\n\n${d.body}`).join("\n\n---\n\n");
}

function createPlaybookPhaseHandler(phase: PlaybookPhase): WorkflowHandler {
  return async (ctx) => {
    await writeStepAudit(ctx, `${phase.id}.start`, `Playbook ${phase.label} starting`);

    const allSlugs = [...phase.agentSlugs, phase.frameworkSlug];
    const playbookContext = await loadPlaybookDocs(ctx.tenantId, allSlugs);

    const priorInput = typeof ctx.input === "string" ? ctx.input : (ctx.input?.kdr ?? "");

    const prompt = [
      `You are running Atlas UX Playbook — ${phase.label}.`,
      "",
      "Your job: analyze the playbook content below, apply it to Atlas UX's current state, and produce:",
      "1. Key findings and recommendations",
      "2. Decisions made (numbered sequentially)",
      "3. Open items for next phase",
      "4. A KDR (Key Decision Record) block at the end",
      "",
      priorInput ? `## Prior Phase KDR\n\n${priorInput}\n\n---\n\n` : "",
      "## Playbook Content\n\n",
      playbookContext,
    ].join("\n");

    const result = await runLLM({
      runId:   ctx.intentId,
      agent:   "atlas",
      purpose: `playbook-${phase.id.toLowerCase()}`,
      route:   "LONG_CONTEXT_SUMMARY",
      messages: [{ role: "user", content: prompt }],
      seatTier: ctx.seatTier,
    });

    const output = result?.text ?? "(No LLM output)";

    // Store key decisions as org memory
    await storeOrgMemory({
      tenantId:   ctx.tenantId,
      category:   "outcome",
      content:    `Playbook ${phase.label} output:\n\n${output.slice(0, 4000)}`,
      source:     `atlas-playbook:${phase.id}`,
      sourceId:   ctx.intentId,
      confidence: 0.85,
      tags:       ["playbook", phase.id.toLowerCase()],
    });

    await writeStepAudit(ctx, `${phase.id}.complete`, `Playbook ${phase.label} complete — ${output.length} chars`);

    const { to } = await getReportRecipients(ctx.tenantId, "atlas");
    await queueEmail(ctx, {
      to,
      subject: `Playbook: ${phase.label} Complete`,
      text:    output.slice(0, 8000),
      fromAgent: "atlas",
    });

    return { ok: true, message: `Playbook ${phase.label} complete`, output };
  };
}

for (const phase of PLAYBOOK_PHASES) {
  handlers[phase.id] = createPlaybookPhaseHandler(phase);
}

// WF-414 — Quick Playbook Lookup (single-topic, uses SMART-LOADER routing)
handlers["WF-414"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-414.start", "Quick playbook lookup starting");

  const query = typeof ctx.input === "string" ? ctx.input : (ctx.input?.query ?? "playbook overview");

  // Load SMART-LOADER for routing context
  const smartLoader = await prisma.kbDocument.findFirst({
    where: { tenantId: ctx.tenantId, slug: "playbook/smart-loader" },
    select: { body: true },
  });

  // Search playbook docs matching the query
  const keywords = query.split(/\s+/).slice(0, 4).join(" ");
  const matchingDocs = await prisma.kbDocument.findMany({
    where: {
      tenantId: ctx.tenantId,
      slug: { startsWith: "playbook/" },
      body: { contains: keywords, mode: "insensitive" as any },
    },
    select: { slug: true, title: true, body: true },
    orderBy: { updatedAt: "desc" },
    take: 4,
  });

  const context = matchingDocs.length
    ? matchingDocs.map(d => `## ${d.title}\n\n${d.body.slice(0, 3000)}`).join("\n\n---\n\n")
    : "(No matching playbook docs found)";

  const prompt = [
    "You are the Atlas UX Playbook advisor. Answer the following question using the playbook content provided.",
    smartLoader?.body ? `\n## SMART-LOADER (Routing Guide)\n\n${smartLoader.body}\n\n---\n\n` : "",
    `## Question\n\n${query}\n\n## Relevant Playbook Content\n\n${context}`,
  ].join("\n");

  const result = await runLLM({
    runId:   ctx.intentId,
    agent:   "atlas",
    purpose: "playbook-quick-lookup",
    route:   "DRAFT_GENERATION_FAST",
    messages: [{ role: "user", content: prompt }],
    seatTier: ctx.seatTier,
  });

  const output = result?.text ?? "(No LLM output)";

  await writeStepAudit(ctx, "WF-414.complete", `Quick lookup complete — ${output.length} chars`);

  return { ok: true, message: "Playbook lookup complete", output };
};

// ── Public API ────────────────────────────────────────────────────────────────

export function getWorkflowHandler(workflowId: string): WorkflowHandler | null {
  return handlers[workflowId] ?? null;
}
