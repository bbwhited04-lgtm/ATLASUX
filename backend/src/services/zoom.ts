/**
 * Zoom API service — token retrieval, recording transcript fetch, meeting list.
 *
 * Uses token_vault for OAuth token storage (same pattern as other providers).
 * VTT parser is exported so both Teams and Zoom transcript flows can reuse it.
 */
import type { Env } from "../env.js";
import { readTokenVault } from "../lib/tokenStore.js";
import { refreshTokenIfNeeded } from "../lib/tokenLifecycle.js";
import { resolveCredential } from "./credentialResolver.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ZoomMeeting {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  join_url: string;
  status: string;
}

export interface ZoomRecordingFile {
  id: string;
  file_type: string; // "MP4" | "TRANSCRIPT" | "TIMELINE" | "CHAT" | etc.
  download_url: string;
  status: string;
  recording_start: string;
  recording_end: string;
}

export interface ZoomRecording {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  recording_files: ZoomRecordingFile[];
  download_token?: string;
}

// ── Token ────────────────────────────────────────────────────────────────────

export async function getZoomToken(env: Env, tenantId: string): Promise<string | null> {
  // Try refresh first (handles near-expiry tokens)
  const refreshed = await refreshTokenIfNeeded(env, tenantId, "zoom");
  if (refreshed) return refreshed;

  // Fallback to raw read
  const vault = await readTokenVault(env, tenantId, "zoom");
  return vault?.access_token ?? null;
}

// ── VTT Parser (shared utility) ──────────────────────────────────────────────

/**
 * Parse WebVTT transcript content to plain text.
 * Strips timestamps, WEBVTT header, NOTE blocks, and empty lines.
 * Used by both Zoom and Teams transcript flows.
 */
export function parseVTT(vttContent: string): string {
  return vttContent
    .split("\n")
    .filter(line =>
      !line.match(/^\d{2}:\d{2}/) &&
      !line.match(/^WEBVTT/) &&
      !line.match(/^NOTE/) &&
      line.trim(),
    )
    .join("\n")
    .trim();
}

// ── Zoom API calls ───────────────────────────────────────────────────────────

async function zoomApi(path: string, token: string): Promise<any> {
  const res = await fetch(`https://api.zoom.us/v2${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom API ${res.status}: ${body}`);
  }
  return res.json();
}

/**
 * Fetch the VTT transcript from a Zoom cloud recording.
 * Returns parsed plain text or null if no transcript file is available.
 */
export async function fetchRecordingTranscript(
  meetingId: string,
  token: string,
): Promise<string | null> {
  try {
    const data = await zoomApi(`/meetings/${meetingId}/recordings`, token);
    const files: ZoomRecordingFile[] = data.recording_files ?? [];
    const transcriptFile = files.find(f => f.file_type === "TRANSCRIPT");
    if (!transcriptFile) return null;

    // Download the VTT content
    const downloadUrl = `${transcriptFile.download_url}?access_token=${token}`;
    const res = await fetch(downloadUrl);
    if (!res.ok) return null;

    const vttContent = await res.text();
    return parseVTT(vttContent);
  } catch (err) {
    console.error("[zoom] Transcript fetch failed:", err);
    return null;
  }
}

/**
 * Download a Zoom recording transcript using the download_token from webhook payload.
 * This is used when processing recording.completed webhook events.
 */
export async function downloadTranscriptFromWebhook(
  downloadUrl: string,
  downloadToken: string,
): Promise<string | null> {
  try {
    const url = `${downloadUrl}?access_token=${downloadToken}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const vttContent = await res.text();
    return parseVTT(vttContent);
  } catch (err) {
    console.error("[zoom] Webhook transcript download failed:", err);
    return null;
  }
}

/**
 * List upcoming Zoom meetings for the authenticated user.
 */
export async function listUpcomingMeetings(token: string): Promise<ZoomMeeting[]> {
  try {
    const data = await zoomApi("/users/me/meetings?type=upcoming&page_size=30", token);
    return (data.meetings ?? []).map((m: any) => ({
      id: String(m.id),
      topic: m.topic ?? "(No topic)",
      start_time: m.start_time ?? "",
      duration: m.duration ?? 0,
      join_url: m.join_url ?? "",
      status: m.status ?? "waiting",
    }));
  } catch (err) {
    console.error("[zoom] List meetings failed:", err);
    return [];
  }
}

// ── AI Summarization ─────────────────────────────────────────────────────────

/**
 * Summarize a meeting transcript using OpenAI GPT-4o-mini.
 * Same logic as meetingRoutes.ts summarizeTranscript() but exported for reuse.
 */
export async function summarizeTranscript(tenantId: string, transcript: string): Promise<{
  summary: string;
  actionItems: Array<{ text: string; assignee?: string; done: boolean }>;
  keyPoints: string[];
}> {
  const openaiKey = await resolveCredential(tenantId, "openai");
  if (!openaiKey) {
    return {
      summary: "AI summarization unavailable — no OpenAI credential configured for this tenant.",
      actionItems: [],
      keyPoints: [],
    };
  }

  const prompt = `You are a meeting assistant. Analyze this meeting transcript and produce:

1. A concise summary (2-4 paragraphs)
2. A list of action items (each with text and optional assignee name)
3. A list of key points discussed

Respond ONLY with valid JSON in this exact format:
{
  "summary": "...",
  "actionItems": [{"text": "...", "assignee": "...", "done": false}],
  "keyPoints": ["...", "..."]
}

TRANSCRIPT:
${transcript.slice(0, 30_000)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(data?.error?.message || "OpenAI summarization failed");

  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || "",
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems.map((a: any) => ({
            text: String(a.text || ""),
            assignee: a.assignee || undefined,
            done: false,
          }))
        : [],
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.map(String)
        : [],
    };
  } catch {
    return { summary: content, actionItems: [], keyPoints: [] };
  }
}
