import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { makeSupabase } from "../supabase.js";
import { loadEnv } from "../env.js";
import { submitComment, submitPost } from "../services/reddit.js";

function resolveTenant(req: any): string | null {
  const q = (req.query ?? {}) as any;
  return (req as any).tenantId ?? q.tenantId ?? q.tenant_id ?? null;
}

async function getRedditToken(tenantId: string): Promise<string | null> {
  const env = loadEnv(process.env);
  const supabase = makeSupabase(env);
  const { data } = await supabase
    .from("token_vault")
    .select("access_token")
    .eq("org_id", tenantId)
    .eq("provider", "reddit")
    .maybeSingle();
  return data?.access_token ?? null;
}

export const redditRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/reddit/pending
   * Returns all PROPOSED DecisionMemos for Donna's Reddit actions.
   * Used by the UI to show the approval queue.
   */
  app.get("/pending", async (req) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const memos = await prisma.decisionMemo.findMany({
      where: {
        tenantId,
        agent: "donna",
        status: "PROPOSED",
        requiresApproval: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { ok: true, pending: memos };
  });

  /**
   * POST /v1/reddit/post
   * Manually queue a new Reddit post (owned subs) for approval.
   * Body: { subreddit, title, text }
   */
  app.post("/post", async (req) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const body = req.body as any;
    const { subreddit, title, text } = body ?? {};
    if (!subreddit || !title || !text) return { ok: false, error: "subreddit, title, text required" };

    const memo = await prisma.decisionMemo.create({
      data: {
        tenantId,
        agent: "donna",
        title: `Post to r/${subreddit}: "${title.slice(0, 60)}"`,
        rationale: "Manually queued Reddit post — requires human approval before publishing.",
        estimatedCostUsd: 0,
        billingType: "none",
        riskTier: 1,
        confidence: 1.0,
        requiresApproval: true,
        status: "PROPOSED",
        payload: { action: "reddit_post", subreddit, title, text },
      },
    });

    return { ok: true, memo };
  });

  /**
   * POST /v1/reddit/approve/:memoId
   * Approve a pending reddit memo and immediately execute it.
   */
  app.post("/approve/:memoId", async (req) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const { memoId } = req.params as any;
    const memo = await prisma.decisionMemo.findFirst({
      where: { id: memoId, tenantId, agent: "donna", status: "PROPOSED" },
    });
    if (!memo) return { ok: false, error: "Memo not found or already processed" };

    const token = await getRedditToken(tenantId);
    if (!token) return { ok: false, error: "No Reddit token — connect Reddit in Integrations first" };

    const p = memo.payload as any;
    try {
      let posted: any;
      if (p.action === "reddit_reply") {
        posted = await submitComment(token, p.post_name, p.draft_reply);
      } else if (p.action === "reddit_post") {
        posted = await submitPost(token, p.subreddit, p.title, p.text);
      } else {
        return { ok: false, error: `Unknown action: ${p.action}` };
      }

      await prisma.decisionMemo.update({
        where: { id: memoId },
        data: { status: "EXECUTED", payload: { ...p, posted } },
      });

      return { ok: true, posted };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  });

  /**
   * POST /v1/reddit/reject/:memoId
   * Reject a pending memo.
   */
  app.post("/reject/:memoId", async (req) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const { memoId } = req.params as any;
    const body = req.body as any;

    const memo = await prisma.decisionMemo.findFirst({
      where: { id: memoId, tenantId, agent: "donna", status: "PROPOSED" },
    });
    if (!memo) return { ok: false, error: "Memo not found or already processed" };

    await prisma.decisionMemo.update({
      where: { id: memoId },
      data: {
        status: "REJECTED",
        payload: { ...(memo.payload as any), rejectionReason: body?.reason ?? "Rejected by human" },
      },
    });

    return { ok: true };
  });
};
