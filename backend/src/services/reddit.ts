/**
 * Reddit API service for Donna's monitoring and engagement workflows.
 * Uses OAuth2 bearer tokens stored in the token vault.
 */

const REDDIT_API = "https://oauth.reddit.com";
const REDDIT_UA = "AtlasUX/1.0 (by u/AtlasUXBot)";

function headers(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": REDDIT_UA,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

export type RedditPost = {
  id: string;
  name: string;        // fullname e.g. t3_abc123
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
};

export type RedditComment = {
  id: string;
  name: string;        // fullname e.g. t1_abc123
  body: string;
  author: string;
  subreddit: string;
  link_id: string;     // parent post fullname
  permalink: string;
  created_utc: number;
};

/** Fetch new posts from a subreddit (last N by new) */
export async function fetchNewPosts(
  accessToken: string,
  subreddit: string,
  limit = 25,
): Promise<RedditPost[]> {
  const url = `${REDDIT_API}/r/${subreddit}/new.json?limit=${limit}&raw_json=1`;
  const r = await fetch(url, { headers: headers(accessToken) });
  if (!r.ok) throw new Error(`Reddit /r/${subreddit}/new failed: ${r.status}`);
  const data = await r.json() as any;
  return (data?.data?.children ?? []).map((c: any) => c.data as RedditPost);
}

/** Fetch hot posts from a subreddit */
export async function fetchHotPosts(
  accessToken: string,
  subreddit: string,
  limit = 10,
): Promise<RedditPost[]> {
  const url = `${REDDIT_API}/r/${subreddit}/hot.json?limit=${limit}&raw_json=1`;
  const r = await fetch(url, { headers: headers(accessToken) });
  if (!r.ok) throw new Error(`Reddit /r/${subreddit}/hot failed: ${r.status}`);
  const data = await r.json() as any;
  return (data?.data?.children ?? []).map((c: any) => c.data as RedditPost);
}

/** Fetch comments on a specific post */
export async function fetchPostComments(
  accessToken: string,
  subreddit: string,
  postId: string,
  limit = 20,
): Promise<RedditComment[]> {
  const url = `${REDDIT_API}/r/${subreddit}/comments/${postId}.json?limit=${limit}&raw_json=1`;
  const r = await fetch(url, { headers: headers(accessToken) });
  if (!r.ok) throw new Error(`Reddit comments fetch failed: ${r.status}`);
  const data = await r.json() as any;
  const commentListing = data?.[1]?.data?.children ?? [];
  return commentListing
    .filter((c: any) => c.kind === "t1")
    .map((c: any) => c.data as RedditComment);
}

/** Post a top-level comment reply to a post or comment */
export async function submitComment(
  accessToken: string,
  parentFullname: string, // e.g. "t3_abc123" (post) or "t1_abc123" (comment)
  text: string,
): Promise<{ id: string; name: string; permalink: string }> {
  const body = new URLSearchParams({ api_type: "json", thing_id: parentFullname, text });
  const r = await fetch(`${REDDIT_API}/api/comment`, {
    method: "POST",
    headers: headers(accessToken),
    body,
  });
  if (!r.ok) throw new Error(`Reddit submit comment failed: ${r.status}`);
  const data = await r.json() as any;
  const errors = data?.json?.errors ?? [];
  if (errors.length > 0) throw new Error(`Reddit comment error: ${JSON.stringify(errors)}`);
  const comment = data?.json?.data?.things?.[0]?.data;
  return { id: comment?.id, name: comment?.name, permalink: comment?.permalink };
}

/** Submit a new post to a subreddit */
export async function submitPost(
  accessToken: string,
  subreddit: string,
  title: string,
  text: string,
): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    api_type: "json",
    sr: subreddit,
    kind: "self",
    title,
    text,
    resubmit: "true",
  });
  const r = await fetch(`${REDDIT_API}/api/submit`, {
    method: "POST",
    headers: headers(accessToken),
    body,
  });
  if (!r.ok) throw new Error(`Reddit submit post failed: ${r.status}`);
  const data = await r.json() as any;
  const errors = data?.json?.errors ?? [];
  if (errors.length > 0) throw new Error(`Reddit post error: ${JSON.stringify(errors)}`);
  return {
    id: data?.json?.data?.id,
    url: data?.json?.data?.url,
  };
}

/** Get Donna's identity (who she's logged in as) */
export async function getRedditIdentity(accessToken: string): Promise<{ name: string; id: string }> {
  const r = await fetch(`${REDDIT_API}/api/v1/me`, { headers: headers(accessToken) });
  if (!r.ok) throw new Error(`Reddit identity fetch failed: ${r.status}`);
  return r.json() as any;
}

/** Check if Donna has already commented on a post (avoid duplicate replies) */
export async function hasAlreadyCommented(
  accessToken: string,
  postFullname: string,
): Promise<boolean> {
  try {
    const me = await getRedditIdentity(accessToken);
    const url = `${REDDIT_API}/user/${me.name}/comments.json?limit=100&raw_json=1`;
    const r = await fetch(url, { headers: headers(accessToken) });
    if (!r.ok) return false;
    const data = await r.json() as any;
    const comments: RedditComment[] = (data?.data?.children ?? []).map((c: any) => c.data);
    return comments.some(c => c.link_id === postFullname);
  } catch {
    return false;
  }
}
