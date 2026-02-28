/**
 * Donna's Reddit Worker (WF-051 / WF-052 / WF-053)
 *
 * Two-phase loop:
 *
 * Phase 1 — SCAN (every REDDIT_SCAN_INTERVAL_MS, default 30min)
 *   - Fetch new posts from monitored subreddits
 *   - Use AI to determine relevance and draft a helpful reply
 *   - Create a DecisionMemo (status=PROPOSED, requiresApproval=true)
 *   - Human reviews in the Decisions tab and approves/rejects
 *
 * Phase 2 — EXECUTE (every REDDIT_EXEC_INTERVAL_MS, default 60s)
 *   - Poll for APPROVED DecisionMemos with agent="donna" and
 *     payload.action="reddit_reply" or "reddit_post"
 *   - Post the approved content via Reddit API
 *   - Update memo status to "EXECUTED"
 *
 * Subreddits:
 *   OWNED  (can post freely, still logs for audit): atlas_ux_dev, atlasux
 *   ENGAGE (human-in-loop required):  AiForSmallBusiness, AskProgramming,
 *                                     ChatGPTCoding, SaaS, startups,
 *                                     smallbusiness, Entrepreneur
 */

import { prisma } from "../db/prisma.js";
import { loadEnv } from "../env.js";
import { refreshTokenIfNeeded } from "../lib/tokenLifecycle.js";
import {
  fetchNewPosts, fetchHotPosts, submitComment, submitPost,
  hasAlreadyCommented, RedditPost,
} from "../services/reddit.js";

const env = loadEnv(process.env);

const OWNED_SUBS = ["atlas_ux_dev", "atlasux"];
const ENGAGE_SUBS = [
  "AiForSmallBusiness", "AskProgramming", "ChatGPTCoding",
  "SaaS", "startups", "smallbusiness", "Entrepreneur",
];

// Keywords that signal a post is relevant to AtlasUX
const RELEVANCE_KEYWORDS = [
  "ai agent", "social media automation", "content scheduling",
  "small business ai", "ai workflow", "ai tool", "chatgpt automation",
  "ai assistant", "marketing automation", "ai startup",
];

const DONNA_TENANT_ID = process.env.TENANT_ID ?? "";
const SCAN_INTERVAL_MS = Number(process.env.REDDIT_SCAN_INTERVAL_MS ?? 30 * 60 * 1000);
const EXEC_INTERVAL_MS = Number(process.env.REDDIT_EXEC_INTERVAL_MS ?? 60 * 1000);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Token vault helpers ───────────────────────────────────────────────────────

async function getRedditToken(tenantId: string): Promise<string | null> {
  return refreshTokenIfNeeded(env, tenantId, "reddit");
}

// ── AI relevance + reply draft ────────────────────────────────────────────────

function isRelevant(post: RedditPost): boolean {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some(kw => text.includes(kw));
}

async function draftReply(post: RedditPost): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;
  const apiKey = openaiKey || orKey;
  if (!apiKey) return null;

  const baseUrl = openaiKey
    ? "https://api.openai.com/v1"
    : "https://openrouter.ai/api/v1";
  const model = openaiKey ? "gpt-4o-mini" : "openai/gpt-4o-mini";

  const prompt = `You are Donna, a helpful and knowledgeable community member on Reddit. You represent AtlasUX, an AI-powered business automation platform for small businesses.

A Reddit user posted the following in r/${post.subreddit}:

Title: ${post.title}
Body: ${post.selftext?.slice(0, 800) || "(no body)"}

Write a helpful, genuine, concise Reddit reply (2-4 sentences max).
- Focus on actually helping the person, not selling AtlasUX
- Only mention AtlasUX if it directly solves their specific problem
- Sound like a real, knowledgeable human — not a bot
- Never be negative about competitors
- If you can't genuinely help, reply with: SKIP`;

  try {
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });
    const data = await r.json() as any;
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? null;
    if (!reply || reply === "SKIP") return null;
    return reply;
  } catch {
    return null;
  }
}

// ── Phase 1: Scan subreddits and create DecisionMemos ────────────────────────

async function scanAndQueue(accessToken: string) {
  process.stdout.write("[redditWorker] Scanning subreddits...\n");

  // Get posts from all engagement subs
  for (const sub of ENGAGE_SUBS) {
    let posts: RedditPost[] = [];
    try {
      posts = await fetchNewPosts(accessToken, sub, 15);
    } catch (e: any) {
      process.stderr.write(`[redditWorker] Failed to fetch r/${sub}: ${e.message}\n`);
      continue;
    }

    // Only look at posts from the last 6 hours
    const cutoff = Date.now() / 1000 - 6 * 60 * 60;
    const fresh = posts.filter(p => p.created_utc > cutoff && isRelevant(p));

    for (const post of fresh.slice(0, 3)) {
      // Don't queue if we already have a pending memo for this post
      const existing = await prisma.decisionMemo.findFirst({
        where: {
          tenantId: DONNA_TENANT_ID,
          agent: "donna",
          status: { in: ["PROPOSED", "APPROVED"] },
          payload: { path: ["post_id"], equals: post.id },
        },
      });
      if (existing) continue;

      // Check if Donna already commented
      const alreadyReplied = await hasAlreadyCommented(accessToken, post.name);
      if (alreadyReplied) continue;

      const draft = await draftReply(post);
      if (!draft) continue;

      await prisma.decisionMemo.create({
        data: {
          tenantId: DONNA_TENANT_ID,
          agent: "donna",
          title: `Reply to r/${post.subreddit}: "${post.title.slice(0, 60)}${post.title.length > 60 ? "…" : ""}"`,
          rationale: `Post has ${post.score} upvotes and ${post.num_comments} comments. Donna drafted a reply to build karma and brand presence.`,
          estimatedCostUsd: 0,
          billingType: "none",
          riskTier: 1,
          confidence: 0.75,
          expectedBenefit: "Community karma + brand awareness in relevant subreddit",
          requiresApproval: true,
          status: "PROPOSED",
          payload: {
            action: "reddit_reply",
            subreddit: post.subreddit,
            post_id: post.id,
            post_name: post.name,     // fullname for API call
            post_title: post.title,
            post_url: `https://www.reddit.com${post.permalink}`,
            draft_reply: draft,
          },
        },
      });

      process.stdout.write(`[redditWorker] Queued reply for r/${post.subreddit} post "${post.title.slice(0, 40)}"\n`);
    }
  }

  // Also check owned subs for unanswered comments on Donna's posts
  for (const sub of OWNED_SUBS) {
    try {
      const posts = await fetchHotPosts(accessToken, sub, 5);
      process.stdout.write(`[redditWorker] r/${sub}: ${posts.length} hot posts checked\n`);
    } catch (e: any) {
      process.stderr.write(`[redditWorker] Failed to check r/${sub}: ${e.message}\n`);
    }
  }
}

// ── Phase 2: Execute approved memos ──────────────────────────────────────────

async function executeApproved(accessToken: string) {
  const memos = await prisma.decisionMemo.findMany({
    where: {
      tenantId: DONNA_TENANT_ID,
      agent: "donna",
      status: "APPROVED",
      payload: { path: ["action"], string_starts_with: "reddit_" },
    },
    take: 5,
    orderBy: { createdAt: "asc" },
  });

  for (const memo of memos) {
    const p = memo.payload as any;
    try {
      if (p.action === "reddit_reply") {
        const result = await submitComment(accessToken, p.post_name, p.draft_reply);
        await prisma.decisionMemo.update({
          where: { id: memo.id },
          data: {
            status: "EXECUTED",
            payload: { ...(memo.payload as any), posted_comment: result },
          },
        });
        await prisma.auditLog.create({
          data: {
            tenantId: DONNA_TENANT_ID,
            actorType: "system",
            actorUserId: null,
            actorExternalId: "donna",
            level: "info",
            action: "REDDIT_REPLY_POSTED",
            entityType: "decision_memo",
            entityId: memo.id,
            message: `Donna posted Reddit reply to ${p.post_url}`,
            meta: { memoId: memo.id, subreddit: p.subreddit, postId: p.post_id, postUrl: p.post_url },
            timestamp: new Date(),
          },
        } as any).catch(() => null);
        process.stdout.write(`[redditWorker] Posted reply to ${p.post_url}\n`);
      } else if (p.action === "reddit_post") {
        const result = await submitPost(accessToken, p.subreddit, p.title, p.text);
        await prisma.decisionMemo.update({
          where: { id: memo.id },
          data: {
            status: "EXECUTED",
            payload: { ...(memo.payload as any), posted: result },
          },
        });
        await prisma.auditLog.create({
          data: {
            tenantId: DONNA_TENANT_ID,
            actorType: "system",
            actorUserId: null,
            actorExternalId: "donna",
            level: "info",
            action: "REDDIT_POST_PUBLISHED",
            entityType: "decision_memo",
            entityId: memo.id,
            message: `Donna published post to r/${p.subreddit}: "${p.title?.slice(0, 60)}"`,
            meta: { memoId: memo.id, subreddit: p.subreddit, title: p.title, url: result?.url ?? null },
            timestamp: new Date(),
          },
        } as any).catch(() => null);
        process.stdout.write(`[redditWorker] Posted to r/${p.subreddit}: ${result.url}\n`);
      }
    } catch (e: any) {
      process.stderr.write(`[redditWorker] Execute failed for memo ${memo.id}: ${e.message}\n`);
      await prisma.decisionMemo.update({
        where: { id: memo.id },
        data: {
          status: "PROPOSED", // send back for retry
          payload: { ...(memo.payload as any), last_error: e.message },
        },
      });
      await prisma.auditLog.create({
        data: {
          tenantId: DONNA_TENANT_ID,
          actorType: "system",
          actorUserId: null,
          actorExternalId: "donna",
          level: "error",
          action: "REDDIT_EXECUTE_FAILED",
          entityType: "decision_memo",
          entityId: memo.id,
          message: `Reddit execute failed for memo ${memo.id}: ${e.message}`,
          meta: { memoId: memo.id, action: p.action, error: e.message },
          timestamp: new Date(),
        },
      } as any).catch(() => null);
    }
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────────

async function main() {
  process.stdout.write("[redditWorker] Starting Donna Reddit worker\n");

  if (!process.env.REDDIT_CLIENT_ID) {
    process.stdout.write("[redditWorker] REDDIT_CLIENT_ID not set — worker idle until credentials added\n");
    // Stay alive but do nothing — Reddit credentials will be added later
    while (true) await sleep(60_000);
  }

  if (!DONNA_TENANT_ID) {
    process.stderr.write("[redditWorker] TENANT_ID not set — exiting\n");
    process.exit(1);
  }

  let stopping = false;
  process.on("SIGINT", () => { stopping = true; });
  process.on("SIGTERM", () => { stopping = true; });

  let lastScan = 0;

  while (!stopping) {
    const token = await getRedditToken(DONNA_TENANT_ID).catch(() => null);

    if (token) {
      // Execute any approved memos first (fast loop)
      await executeApproved(token).catch(e =>
        process.stderr.write(`[redditWorker] executeApproved error: ${e.message}\n`)
      );

      // Scan subreddits on the slower interval
      if (Date.now() - lastScan > SCAN_INTERVAL_MS) {
        await scanAndQueue(token).catch(e =>
          process.stderr.write(`[redditWorker] scanAndQueue error: ${e.message}\n`)
        );
        lastScan = Date.now();
      }
    } else {
      process.stdout.write("[redditWorker] No Reddit token found — waiting for OAuth connection\n");
    }

    await sleep(stopping ? 0 : EXEC_INTERVAL_MS);
  }

  process.stdout.write("[redditWorker] Stopping\n");
  process.exit(0);
}

main().catch(e => {
  process.stderr.write(`[redditWorker] fatal: ${e?.message ?? e}\n`);
  process.exit(1);
});
