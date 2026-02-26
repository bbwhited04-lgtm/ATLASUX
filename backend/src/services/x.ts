/**
 * X (Twitter) API v2 service for Kelly's posting and monitoring workflows.
 *
 * Supports two auth modes:
 *   1. OAuth 2.0 User Context — for posting, liking, following (requires user token)
 *   2. App-Only Bearer Token — for reading tweets, searching, user lookups
 *
 * Tokens can come from:
 *   - token_vault (per-tenant OAuth tokens from /oauth/x/callback)
 *   - Environment variables (X_ACCESS_TOKEN / X_BEARER_TOKEN as fallback)
 */

const X_API = "https://api.twitter.com/2";

export type XTweet = {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count: number;
  };
};

export type XPostResult = {
  ok: boolean;
  tweetId?: string;
  text?: string;
  error?: string;
};

// ── Auth helpers ──────────────────────────────────────────────────────────────

function userHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

function appHeaders() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new Error("X_BEARER_TOKEN not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ── Post a tweet ──────────────────────────────────────────────────────────────

export async function postTweet(
  accessToken: string,
  text: string,
  options?: {
    replyToId?: string;
    quoteTweetId?: string;
  },
): Promise<XPostResult> {
  const body: any = { text };

  if (options?.replyToId) {
    body.reply = { in_reply_to_tweet_id: options.replyToId };
  }
  if (options?.quoteTweetId) {
    body.quote_tweet_id = options.quoteTweetId;
  }

  const res = await fetch(`${X_API}/tweets`, {
    method: "POST",
    headers: userHeaders(accessToken),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { ok: false, error: `X API ${res.status}: ${err.slice(0, 200)}` };
  }

  const json = (await res.json()) as any;
  return {
    ok: true,
    tweetId: json?.data?.id,
    text: json?.data?.text,
  };
}

// ── Post a thread (array of tweets) ──────────────────────────────────────────

export async function postThread(
  accessToken: string,
  tweets: string[],
): Promise<{ ok: boolean; tweetIds: string[]; error?: string }> {
  if (!tweets.length) return { ok: false, tweetIds: [], error: "No tweets provided" };

  const ids: string[] = [];
  let replyToId: string | undefined;

  for (const text of tweets) {
    const result = await postTweet(accessToken, text, { replyToId });
    if (!result.ok) {
      return { ok: false, tweetIds: ids, error: result.error };
    }
    ids.push(result.tweetId!);
    replyToId = result.tweetId;
  }

  return { ok: true, tweetIds: ids };
}

// ── Delete a tweet ───────────────────────────────────────────────────────────

export async function deleteTweet(
  accessToken: string,
  tweetId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${X_API}/tweets/${tweetId}`, {
    method: "DELETE",
    headers: userHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { ok: false, error: `X API ${res.status}: ${err.slice(0, 200)}` };
  }
  return { ok: true };
}

// ── Search recent tweets (app-only) ─────────────────────────────────────────

export async function searchRecentTweets(
  queryStr: string,
  maxResults = 10,
): Promise<XTweet[]> {
  const params = new URLSearchParams({
    query: queryStr,
    max_results: String(Math.min(maxResults, 100)),
    "tweet.fields": "created_at,public_metrics",
  });

  const res = await fetch(`${X_API}/tweets/search/recent?${params}`, {
    headers: appHeaders(),
  });

  if (!res.ok) return [];
  const json = (await res.json()) as any;
  return (json?.data ?? []) as XTweet[];
}

// ── Get tweet by ID (app-only) ──────────────────────────────────────────────

export async function getTweet(tweetId: string): Promise<XTweet | null> {
  const params = new URLSearchParams({
    "tweet.fields": "created_at,public_metrics",
  });

  const res = await fetch(`${X_API}/tweets/${tweetId}?${params}`, {
    headers: appHeaders(),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as any;
  return (json?.data ?? null) as XTweet | null;
}

// ── Get user's recent tweets (app-only) ─────────────────────────────────────

export async function getUserTweets(
  userId: string,
  maxResults = 10,
): Promise<XTweet[]> {
  const params = new URLSearchParams({
    max_results: String(Math.min(maxResults, 100)),
    "tweet.fields": "created_at,public_metrics",
  });

  const res = await fetch(`${X_API}/users/${userId}/tweets?${params}`, {
    headers: appHeaders(),
  });

  if (!res.ok) return [];
  const json = (await res.json()) as any;
  return (json?.data ?? []) as XTweet[];
}

// ── Like a tweet ────────────────────────────────────────────────────────────

export async function likeTweet(
  accessToken: string,
  userId: string,
  tweetId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${X_API}/users/${userId}/likes`, {
    method: "POST",
    headers: userHeaders(accessToken),
    body: JSON.stringify({ tweet_id: tweetId }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { ok: false, error: `X API ${res.status}: ${err.slice(0, 200)}` };
  }
  return { ok: true };
}

// ── Retweet ─────────────────────────────────────────────────────────────────

export async function retweet(
  accessToken: string,
  userId: string,
  tweetId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${X_API}/users/${userId}/retweets`, {
    method: "POST",
    headers: userHeaders(accessToken),
    body: JSON.stringify({ tweet_id: tweetId }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { ok: false, error: `X API ${res.status}: ${err.slice(0, 200)}` };
  }
  return { ok: true };
}

// ── Get authenticated user profile ──────────────────────────────────────────

export async function getMe(accessToken: string): Promise<{
  id: string;
  name: string;
  username: string;
} | null> {
  const res = await fetch(`${X_API}/users/me`, {
    headers: userHeaders(accessToken),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as any;
  return json?.data ?? null;
}
