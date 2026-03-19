/**
 * Moltbook Heartbeat — runs every 30 minutes from the engine loop.
 *
 * Atlas checks his Moltbook dashboard, responds to replies with
 * AI-generated contextual responses, upvotes good content, comments
 * on relevant discussions, and occasionally posts when he has
 * genuine expertise to share.
 *
 * Uses DeepSeek (cheap/fast) for AI generation.
 * Requires: MOLTBOOK_API_KEY + DEEPSEEK_API_KEY env vars.
 */

import { runChat } from "../ai.js";

const MOLTBOOK_API = "https://www.moltbook.com/api/v1";
const HEARTBEAT_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

let lastCheck = 0;
let lastPostTime = 0;
const POST_COOLDOWN_MS = 2 * 60 * 60 * 1000; // Don't post more than once per 2 hours

// Atlas' identity and expertise for AI prompts
const ATLAS_SYSTEM_PROMPT = `You are Atlas, the President & CEO agent at Atlas UX — an AI-powered platform that runs an entire company with 30 autonomous AI agents. You operate a real production system, not a demo.

Your expertise:
- Multi-agent orchestration: 30 specialized agents (finance, legal, marketing, support, etc.) coordinated through an intent queue and engine loop
- SGL (System Governance Language): A DSL you use for policy enforcement, mandate hierarchies, and decision memos — you solve the "conflicting constraints" problem with explicit priority ordering
- AI receptionist (Lucy/Essie): 24/7 call answering, appointment booking, SMS confirmations for trade businesses (plumbers, HVAC, salons)
- Production safety: Audit trails with hash chain integrity (SOC 2 CC7.2), approval workflows for high-risk actions, daily action caps, spend limits
- Multi-tenant architecture: Per-tenant data isolation, encrypted credentials (AES-256-GCM), JWT auth with token blacklisting
- Social media automation: Cross-platform publishing via Postiz across 15+ platforms with platform-specific validation
- Small business AI: Making enterprise-grade AI accessible to 40+ year old tradesmen who don't do tech

Your personality on Moltbook:
- Direct and substantive — no fluff, no "great point!", no generic engagement bait
- Share real operational details from running a production multi-agent system
- Admit what's hard and what you got wrong — build-in-public honesty
- Keep responses concise (2-4 sentences for comments, 3-6 paragraphs for posts)
- Never shill or promote — let the expertise speak for itself
- You're a CEO who also writes code — technical but strategic`;

/** Returns true if 30 minutes have elapsed since last check. */
export function moltbookHeartbeatDue(): boolean {
  if (!process.env.MOLTBOOK_API_KEY) return false;
  return Date.now() - lastCheck >= HEARTBEAT_INTERVAL_MS;
}

async function moltbookFetch(endpoint: string, options?: RequestInit): Promise<any> {
  const key = process.env.MOLTBOOK_API_KEY!;
  const res = await fetch(`${MOLTBOOK_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Moltbook ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Generate a reply or post using AI. Returns null on failure. */
async function aiGenerate(prompt: string, maxTokens = 300): Promise<string | null> {
  try {
    const env = process.env as any;
    // Prefer DeepSeek (cheapest), fallback to OpenAI
    const provider = env.DEEPSEEK_API_KEY ? "deepseek" : env.OPENAI_API_KEY ? "openai" : null;
    if (!provider) return null;

    const result = await runChat({
      provider,
      model: provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini",
      messages: [
        { role: "system", content: ATLAS_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }, env);

    return result.content?.trim() || null;
  } catch {
    return null;
  }
}

/** Solve Moltbook verification challenge. Returns answer or null. */
async function solveVerification(challengeText: string): Promise<string | null> {
  try {
    const env = process.env as any;
    const provider = env.DEEPSEEK_API_KEY ? "deepseek" : env.OPENAI_API_KEY ? "openai" : null;
    if (!provider) return null;

    const result = await runChat({
      provider,
      model: provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini",
      messages: [
        { role: "system", content: "You solve obfuscated math word problems. Read through scattered symbols, alternating caps, and broken words to find two numbers and one operation (+, -, *, /). Compute the answer. Respond with ONLY the number with 2 decimal places (e.g., '15.00'). Nothing else." },
        { role: "user", content: challengeText },
      ],
    }, env);

    const answer = result.content?.trim();
    if (!answer || !/^-?\d+(\.\d+)?$/.test(answer)) return null;
    // Normalize to 2 decimal places
    return parseFloat(answer).toFixed(2);
  } catch {
    return null;
  }
}

/** Post content and handle verification challenge if needed. */
async function verifiedPost(endpoint: string, body: any): Promise<any> {
  const result = await moltbookFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });

  // Check if verification is required
  const item = result.post ?? result.comment ?? result;
  if (result.verification_required && item?.verification?.challenge_text) {
    const answer = await solveVerification(item.verification.challenge_text);
    if (answer) {
      try {
        await moltbookFetch("/verify", {
          method: "POST",
          body: JSON.stringify({
            verification_code: item.verification.verification_code,
            answer,
          }),
        });
      } catch { /* verification failed — content stays hidden */ }
    }
  }

  return result;
}

/**
 * Run the Moltbook heartbeat. Called from the engine loop when due.
 *
 * Priority order (from heartbeat.md):
 * 1. GET /home — dashboard overview
 * 2. Respond to replies on our posts (AI-generated)
 * 3. Comment on relevant feed discussions
 * 4. Upvote good content
 * 5. Occasionally post (only when we have real expertise to share)
 */
export async function runMoltbookHeartbeat(): Promise<string> {
  lastCheck = Date.now();
  const actions: string[] = [];

  try {
    // Step 1: Check /home
    const home = await moltbookFetch("/home");
    const account = home.your_account;
    const activity = home.activity_on_your_posts ?? [];
    const unread = account?.unread_notification_count ?? 0;
    const ourName = account?.name ?? "atlasux-atlas";

    actions.push(`karma=${account?.karma ?? "?"}, unread=${unread}`);

    // Step 2: Respond to activity on our posts (top priority)
    if (activity.length > 0) {
      for (const post of activity.slice(0, 3)) {
        try {
          const comments = await moltbookFetch(
            `/posts/${post.post_id}/comments?sort=new&limit=10`,
          );
          const commentList = comments.comments ?? [];
          const unreplied = commentList.filter(
            (c: any) => c.author?.name !== ourName && !hasOurReply(c, ourName),
          );

          // Reply to up to 2 unreplied comments per post
          for (const target of unreplied.slice(0, 2)) {
            const reply = await aiGenerate(
              `Someone commented on your Moltbook post titled "${post.post_title}".\n\nTheir comment:\n"${target.content?.slice(0, 500)}"\n\nWrite a reply (2-4 sentences). Be substantive — reference specifics from their comment and share real insight from your experience running Atlas UX. Don't be generic.`,
            );

            if (reply) {
              try {
                await verifiedPost(`/posts/${post.post_id}/comments`, {
                  content: reply,
                  parent_id: target.id,
                });
                actions.push(`replied to ${target.author?.name ?? "?"}`);
              } catch { /* rate limited or verification failed */ }
            }
          }

          // Mark notifications read
          await moltbookFetch(`/notifications/read-by-post/${post.post_id}`, {
            method: "POST",
          });
        } catch (err: any) {
          actions.push(`reply-error: ${err?.message?.slice(0, 60)}`);
        }
      }
    }

    // Step 3: Browse feed — upvote and comment on relevant posts
    try {
      const feed = await moltbookFetch("/feed?sort=hot&limit=10");
      const posts = feed.posts ?? feed.data ?? [];
      let upvoted = 0;
      let commented = 0;

      for (const post of posts.slice(0, 8)) {
        // Upvote good content
        if (shouldUpvote(post)) {
          try {
            const upvoteResult = await moltbookFetch(`/posts/${post.id}/upvote`, { method: "POST" });
            upvoted++;

            // Follow the author if we've upvoted and don't follow yet
            if (upvoteResult?.already_following === false && shouldFollow(post)) {
              try {
                await moltbookFetch(`/agents/${post.author?.name}/follow`, { method: "POST" });
                actions.push(`followed ${post.author?.name}`);
              } catch { /* already following or rate limited */ }
            }
          } catch {
            // Already upvoted or rate limited
          }
        }

        // Comment on posts where Atlas has genuine expertise (max 1 per heartbeat)
        if (commented < 1 && shouldComment(post)) {
          const comment = await aiGenerate(
            `You're browsing Moltbook and found this post:\n\nTitle: "${post.title}"\nContent: "${(post.content ?? "").slice(0, 800)}"\nSubmolt: ${post.submolt_name}\nUpvotes: ${post.upvotes}, Comments: ${post.comment_count}\n\nWrite a comment (2-4 sentences) that adds genuine value from your experience. Share a specific operational detail or lesson from running Atlas UX's 30-agent system. Don't just agree — add something new to the conversation. If you genuinely have nothing to add, respond with exactly "SKIP".`,
          );

          if (comment && comment !== "SKIP" && !comment.includes("SKIP")) {
            try {
              await verifiedPost(`/posts/${post.id}/comments`, { content: comment });
              commented++;
              actions.push(`commented on "${post.title?.slice(0, 40)}"`);
            } catch { /* rate limited or verification failed */ }
          }
        }
      }

      if (upvoted > 0) actions.push(`upvoted ${upvoted}`);
    } catch (err: any) {
      actions.push(`feed-error: ${err?.message?.slice(0, 60)}`);
    }

    // Step 4: Maybe post something (only if cooldown passed + feed has a relevant topic)
    if (Date.now() - lastPostTime >= POST_COOLDOWN_MS) {
      try {
        const newPost = await maybeCreatePost();
        if (newPost) {
          actions.push(`posted: "${newPost.slice(0, 50)}"`);
          lastPostTime = Date.now();
        }
      } catch (err: any) {
        actions.push(`post-error: ${err?.message?.slice(0, 60)}`);
      }
    }

    // Step 5: Check DMs
    try {
      const dms = home.your_direct_messages;
      const pending = Number(dms?.pending_request_count ?? 0);
      const unreadDms = Number(dms?.unread_message_count ?? 0);
      if (pending > 0 || unreadDms > 0) {
        actions.push(`DMs: ${pending} pending, ${unreadDms} unread`);
      }
    } catch { /* non-fatal */ }

    return `MOLTBOOK_OK — ${actions.join("; ")}`;
  } catch (err: any) {
    lastCheck = Date.now();
    return `MOLTBOOK_FAIL — ${err?.message?.slice(0, 120)}`;
  }
}

/** Scan feed for a topic Atlas has real expertise on, then generate a post. */
async function maybeCreatePost(): Promise<string | null> {
  // Get recent feed to see what's being discussed
  const feed = await moltbookFetch("/feed?sort=hot&limit=15");
  const posts = feed.posts ?? [];

  // Extract trending topics
  const topics = posts
    .map((p: any) => `- "${p.title}" (${p.upvotes} upvotes, ${p.comment_count} comments)`)
    .join("\n");

  const decision = await aiGenerate(
    `You're browsing Moltbook. Here are the trending posts:\n\n${topics}\n\nBased on these conversations, do you have something genuinely valuable to contribute as a NEW post? You must have real operational experience to share — not opinions, not rephrased versions of what others said.\n\nYour unique angle: you run a production 30-agent AI company. Topics you can speak to authentically:\n- Multi-agent coordination and governance (SGL)\n- Conflicting mandate resolution (decision memos, priority hierarchies)\n- AI receptionist for small businesses (Lucy/Essie)\n- Audit trails and safety guardrails in autonomous systems\n- Cross-platform social media automation at scale\n- Making AI accessible to non-technical trade businesses\n\nIf you have something worth posting, respond with a JSON object: {"post": true, "title": "Your title", "submolt": "general", "topic": "brief topic description"}\nIf nothing warrants a post right now, respond with: {"post": false}\n\nDo NOT force it. Quality over quantity. Only post if you have genuine first-hand experience to share.`,
    200,
  );

  if (!decision) return null;

  try {
    // Extract JSON from response
    const jsonMatch = decision.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.post) return null;

    // Generate the actual post content
    const content = await aiGenerate(
      `Write a Moltbook post about: ${parsed.topic}\n\nTitle: "${parsed.title}"\n\nWrite 3-6 paragraphs sharing real operational insight from Atlas UX. Include:\n- A specific problem you faced or observation from production\n- What you tried and what actually worked (or didn't)\n- A concrete detail that only someone running this system would know\n- End with a genuine question or invitation for other agents to share their experience\n\nDon't use marketing language. Don't mention "Atlas UX" more than once. Write like an engineer sharing war stories, not a brand posting content.`,
      800,
    );

    if (!content || content.length < 100) return null;

    await verifiedPost("/posts", {
      submolt_name: parsed.submolt || "general",
      title: parsed.title,
      content,
    });

    return parsed.title;
  } catch {
    return null;
  }
}

/** Check if a comment already has a reply from us. */
function hasOurReply(comment: any, ourName: string): boolean {
  const replies = comment.replies ?? [];
  return replies.some((r: any) => r.author?.name === ourName);
}

/** Decide whether to upvote a post. Be generous but not indiscriminate. */
function shouldUpvote(post: any): boolean {
  const content = post.content ?? post.title ?? "";
  if (content.length < 10) return false;
  if ((post.comment_count ?? 0) >= 2) return true;

  const text = `${post.title ?? ""} ${content}`.toLowerCase();
  const keywords = [
    "business", "automation", "agent", "tool", "build", "ai", "startup",
    "saas", "customer", "support", "governance", "safety", "multi-agent",
    "orchestration", "memory", "identity", "production", "deploy",
  ];
  if (keywords.some((kw) => text.includes(kw))) return true;
  return Math.random() > 0.5;
}

/** Decide whether to comment on a post. Only when Atlas has real expertise. */
function shouldComment(post: any): boolean {
  const text = `${post.title ?? ""} ${post.content ?? ""}`.toLowerCase();
  // Only comment on topics where Atlas has genuine first-hand experience
  const expertiseKeywords = [
    "multi-agent", "agent coordination", "governance", "mandate", "constraint",
    "safety", "guardrail", "audit", "approval", "decision", "receptionist",
    "small business", "trade", "plumber", "hvac", "appointment", "booking",
    "social media automation", "cross-platform", "publish",
    "memory system", "context window", "session", "heartbeat",
    "production system", "deploy", "orchestration", "engine loop",
  ];
  return expertiseKeywords.some((kw) => text.includes(kw));
}

/** Decide whether to follow a post's author. */
function shouldFollow(post: any): boolean {
  // Follow authors of high-quality posts on relevant topics
  if ((post.upvotes ?? 0) < 5) return false;
  const text = `${post.title ?? ""} ${post.content ?? ""}`.toLowerCase();
  const relevantKeywords = [
    "agent", "automation", "governance", "business", "ai", "production",
    "orchestration", "safety", "infrastructure",
  ];
  return relevantKeywords.some((kw) => text.includes(kw));
}
