/**
 * TikTok Content Posting API v2 service.
 *
 * Two-step upload flow:
 *   1. POST /v2/post/publish/inbox/video/init/ — initializes an upload, returns publish_id
 *   2. TikTok processes asynchronously — use publish_id to check status
 *
 * For Direct Post (video.publish scope):
 *   POST /v2/post/publish/video/init/ — publishes directly to user's profile
 *
 * Auth: Bearer token from token_vault (OAuth user token with video.upload + video.publish scopes)
 */

const TIKTOK_API = "https://open.tiktokapis.com/v2";

export type TikTokPostResult = {
  ok: boolean;
  publishId?: string;
  error?: string;
};

// ── Auth helper ──────────────────────────────────────────────────────────────

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json; charset=UTF-8",
  };
}

// ── Direct Post (video.publish) ──────────────────────────────────────────────

/**
 * Publish a video directly to user's TikTok profile.
 * Requires video.publish scope (Direct Post enabled in dev portal).
 *
 * @param accessToken  OAuth access token from token_vault
 * @param videoUrl     Public URL of the video file to post
 * @param options      Post metadata (title, privacy, etc.)
 */
export async function publishVideo(
  accessToken: string,
  videoUrl: string,
  options?: {
    title?: string;
    privacyLevel?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
    disableComment?: boolean;
    disableDuet?: boolean;
    disableStitch?: boolean;
    brandContentToggle?: boolean;
    brandOrganicToggle?: boolean;
  },
): Promise<TikTokPostResult> {
  const body = {
    post_info: {
      title: options?.title ?? "",
      privacy_level: options?.privacyLevel ?? "PUBLIC_TO_EVERYONE",
      disable_comment: options?.disableComment ?? false,
      disable_duet: options?.disableDuet ?? false,
      disable_stitch: options?.disableStitch ?? false,
      brand_content_toggle: options?.brandContentToggle ?? false,
      brand_organic_toggle: options?.brandOrganicToggle ?? false,
    },
    source_info: {
      source: "PULL_FROM_URL",
      video_url: videoUrl,
    },
  };

  const res = await fetch(`${TIKTOK_API}/post/publish/video/init/`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok || data.error?.code) {
    const errMsg = data.error?.message ?? data.error?.code ?? `HTTP ${res.status}`;
    return { ok: false, error: `TikTok publish failed: ${errMsg}` };
  }

  return {
    ok: true,
    publishId: data.data?.publish_id,
  };
}

// ── Upload as Draft (video.upload — inbox mode) ──────────────────────────────

/**
 * Upload a video as a draft to user's TikTok inbox for further editing.
 * Requires video.upload scope.
 */
export async function uploadVideoDraft(
  accessToken: string,
  videoUrl: string,
): Promise<TikTokPostResult> {
  const body = {
    source_info: {
      source: "PULL_FROM_URL",
      video_url: videoUrl,
    },
  };

  const res = await fetch(`${TIKTOK_API}/post/publish/inbox/video/init/`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok || data.error?.code) {
    const errMsg = data.error?.message ?? data.error?.code ?? `HTTP ${res.status}`;
    return { ok: false, error: `TikTok draft upload failed: ${errMsg}` };
  }

  return {
    ok: true,
    publishId: data.data?.publish_id,
  };
}

// ── Check publish status ─────────────────────────────────────────────────────

export type PublishStatus = {
  ok: boolean;
  status?: "PROCESSING_UPLOAD" | "PROCESSING_DOWNLOAD" | "SEND_TO_USER_INBOX" | "PUBLISH_COMPLETE" | "FAILED";
  publishId?: string;
  error?: string;
};

export async function checkPublishStatus(
  accessToken: string,
  publishId: string,
): Promise<PublishStatus> {
  const res = await fetch(`${TIKTOK_API}/post/publish/status/fetch/`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ publish_id: publishId }),
  });

  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok || data.error?.code) {
    return { ok: false, error: data.error?.message ?? `HTTP ${res.status}` };
  }

  return {
    ok: true,
    status: data.data?.status,
    publishId,
  };
}

// ── Fetch user info (convenience re-export for routes) ──────────────────────

export async function getUserInfo(accessToken: string) {
  const res = await fetch(
    `${TIKTOK_API}/user/info/?fields=open_id,display_name,avatar_url,profile_deep_link,bio_description,is_verified,follower_count,following_count,likes_count,video_count`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || data.error?.code) {
    return { ok: false as const, error: data.error?.message ?? `HTTP ${res.status}` };
  }
  return { ok: true as const, user: data.data?.user ?? {} };
}
