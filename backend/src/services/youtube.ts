/**
 * YouTube Data API v3 service for Venny's scraping and Victor's upload workflows.
 *
 * Auth modes:
 *   1. OAuth 2.0 User Context — for searching, uploading (requires Google token)
 *   2. Public endpoint — for transcript extraction (no auth needed)
 *
 * Tokens come from token_vault (per-tenant Google OAuth tokens).
 */

const YT_API = "https://www.googleapis.com/youtube/v3";

// ── Types ────────────────────────────────────────────────────────────────────

export type YTVideoMeta = {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  tags: string[];
  thumbnails: {
    default?: string;
    medium?: string;
    high?: string;
    maxres?: string;
  };
  stats: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
  url: string;
  duration?: string;
  categoryId?: string;
};

export type YTSearchResult = {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
};

export type YTUploadResult = {
  ok: boolean;
  videoId?: string;
  url?: string;
  error?: string;
};

// ── Auth helper ──────────────────────────────────────────────────────────────

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

// ── Search videos by keyword ─────────────────────────────────────────────────

export async function searchVideos(
  accessToken: string,
  query: string,
  maxResults = 10,
): Promise<YTSearchResult[]> {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    q: query,
    maxResults: String(Math.min(maxResults, 50)),
    order: "relevance",
  });

  const res = await fetch(`${YT_API}/search?${params}`, {
    headers: authHeaders(accessToken),
  });

  if (!res.ok) return [];
  const json = (await res.json()) as any;
  return ((json?.items ?? []) as any[]).map(mapSearchItem);
}

// ── Get channel's recent videos ──────────────────────────────────────────────

export async function getChannelVideos(
  accessToken: string,
  channelId: string,
  maxResults = 10,
): Promise<YTSearchResult[]> {
  const params = new URLSearchParams({
    part: "snippet",
    channelId,
    type: "video",
    maxResults: String(Math.min(maxResults, 50)),
    order: "date",
  });

  const res = await fetch(`${YT_API}/search?${params}`, {
    headers: authHeaders(accessToken),
  });

  if (!res.ok) return [];
  const json = (await res.json()) as any;
  return ((json?.items ?? []) as any[]).map(mapSearchItem);
}

// ── Get full video metadata ──────────────────────────────────────────────────

export async function getVideoDetails(
  accessToken: string,
  videoId: string,
): Promise<YTVideoMeta | null> {
  const params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    id: videoId,
  });

  const res = await fetch(`${YT_API}/videos?${params}`, {
    headers: authHeaders(accessToken),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as any;
  const item = json?.items?.[0];
  if (!item) return null;

  const snippet = item.snippet ?? {};
  const stats = item.statistics ?? {};
  const thumbs = snippet.thumbnails ?? {};

  return {
    videoId: item.id,
    title: snippet.title ?? "",
    description: snippet.description ?? "",
    channelId: snippet.channelId ?? "",
    channelTitle: snippet.channelTitle ?? "",
    publishedAt: snippet.publishedAt ?? "",
    tags: snippet.tags ?? [],
    thumbnails: {
      default: thumbs.default?.url,
      medium: thumbs.medium?.url,
      high: thumbs.high?.url,
      maxres: thumbs.maxres?.url,
    },
    stats: {
      viewCount: Number(stats.viewCount ?? 0),
      likeCount: Number(stats.likeCount ?? 0),
      commentCount: Number(stats.commentCount ?? 0),
    },
    url: `https://www.youtube.com/watch?v=${item.id}`,
    duration: item.contentDetails?.duration ?? undefined,
    categoryId: snippet.categoryId ?? undefined,
  };
}

// ── Get video transcript (auto-captions, no OAuth needed) ────────────────────

export async function getVideoTranscript(videoId: string): Promise<string> {
  try {
    // Fetch the watch page to extract caption track URLs from player response
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AtlasUX/2.0)" },
    });
    if (!pageRes.ok) return "";

    const html = await pageRes.text();

    // Extract the player response JSON which contains caption data
    const match = html.match(/"captions":\s*(\{.*?"playerCaptionsTracklistRenderer".*?\})\s*,\s*"/s);
    if (!match) return "";

    let captionsData: any;
    try {
      // The match might be part of a larger JSON — extract the captions block carefully
      const rawJson = match[1];
      captionsData = JSON.parse(rawJson);
    } catch {
      // Fallback: try a different extraction pattern
      const altMatch = html.match(/playerCaptionsTracklistRenderer":\s*\{[^}]*"captionTracks":\s*(\[[^\]]+\])/s);
      if (!altMatch) return "";
      try {
        captionsData = { playerCaptionsTracklistRenderer: { captionTracks: JSON.parse(altMatch[1]) } };
      } catch { return ""; }
    }

    const tracks = captionsData?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!Array.isArray(tracks) || tracks.length === 0) return "";

    // Prefer English auto-generated, then any English, then first available
    const track =
      tracks.find((t: any) => t.languageCode === "en" && t.kind === "asr") ??
      tracks.find((t: any) => t.languageCode === "en") ??
      tracks[0];

    if (!track?.baseUrl) return "";

    // Fetch the caption track (XML format)
    const trackRes = await fetch(track.baseUrl);
    if (!trackRes.ok) return "";

    const xml = await trackRes.text();

    // Parse XML text segments: <text start="0.0" dur="1.5">Hello world</text>
    const segments: string[] = [];
    const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
    let m: RegExpExecArray | null;
    while ((m = textRegex.exec(xml)) !== null) {
      const decoded = m[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, " ")
        .trim();
      if (decoded) segments.push(decoded);
    }

    return segments.join(" ");
  } catch {
    return "";
  }
}

// ── Upload video to YouTube (resumable upload) ───────────────────────────────

export async function uploadVideo(
  accessToken: string,
  videoBuffer: Buffer,
  metadata: {
    title: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
    privacyStatus?: "public" | "unlisted" | "private";
    madeForKids?: boolean;
  },
): Promise<YTUploadResult> {
  const snippet: any = {
    title: metadata.title.slice(0, 100),
    description: (metadata.description ?? "").slice(0, 5000),
    categoryId: metadata.categoryId ?? "28", // Science & Technology
  };
  if (metadata.tags?.length) {
    snippet.tags = metadata.tags.slice(0, 30);
  }

  const status = {
    privacyStatus: metadata.privacyStatus ?? "private",
    selfDeclaredMadeForKids: metadata.madeForKids ?? false,
  };

  // Step 1: Initiate resumable upload
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(videoBuffer.length),
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify({ snippet, status }),
    },
  );

  if (!initRes.ok) {
    const err = await initRes.text().catch(() => "");
    return { ok: false, error: `Upload init failed ${initRes.status}: ${err.slice(0, 200)}` };
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    return { ok: false, error: "No upload URL returned" };
  }

  // Step 2: Upload the video bytes
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(videoBuffer.length),
    },
    body: new Uint8Array(videoBuffer),
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text().catch(() => "");
    return { ok: false, error: `Upload failed ${uploadRes.status}: ${err.slice(0, 200)}` };
  }

  const json = (await uploadRes.json()) as any;
  const videoId = json?.id;

  return {
    ok: true,
    videoId,
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
  };
}

// ── Set custom thumbnail ─────────────────────────────────────────────────────

export async function setThumbnail(
  accessToken: string,
  videoId: string,
  thumbnailBuffer: Buffer,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/jpeg",
        "Content-Length": String(thumbnailBuffer.length),
      },
      body: new Uint8Array(thumbnailBuffer),
    },
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { ok: false, error: `Thumbnail set failed ${res.status}: ${err.slice(0, 200)}` };
  }

  return { ok: true };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapSearchItem(item: any): YTSearchResult {
  const snippet = item.snippet ?? {};
  return {
    videoId: item.id?.videoId ?? item.id ?? "",
    title: snippet.title ?? "",
    description: snippet.description ?? "",
    channelTitle: snippet.channelTitle ?? "",
    publishedAt: snippet.publishedAt ?? "",
    thumbnail: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.medium?.url ?? "",
  };
}

/**
 * Build a structured KB document body from video metadata + transcript.
 */
export function buildYouTubeKbBody(meta: YTVideoMeta, transcript: string): string {
  const lines: string[] = [
    `# ${meta.title}`,
    "",
    `**Video URL:** ${meta.url}`,
    `**Channel:** ${meta.channelTitle} | **Published:** ${meta.publishedAt}`,
    `**Views:** ${meta.stats.viewCount.toLocaleString()} | **Likes:** ${meta.stats.likeCount.toLocaleString()} | **Comments:** ${meta.stats.commentCount.toLocaleString()}`,
  ];

  if (meta.duration) lines.push(`**Duration:** ${meta.duration}`);
  if (meta.tags.length) lines.push(`**Tags:** ${meta.tags.join(", ")}`);
  if (meta.thumbnails.high) lines.push(`**Thumbnail:** ${meta.thumbnails.high}`);

  lines.push("", "## Description", "", meta.description || "_No description_");

  if (transcript) {
    lines.push("", "## Transcript", "", transcript);
  } else {
    lines.push("", "## Transcript", "", "_No transcript available_");
  }

  return lines.join("\n");
}
