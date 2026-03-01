/**
 * meetingRoutes.ts — Meeting Notes API
 *
 * CRUD for meeting notes + transcript fetch + AI summarization.
 * Uses Microsoft Graph API for Teams transcript retrieval,
 * OpenAI for summarization and action-item extraction.
 *
 * GET    /v1/meetings              — list meeting notes (tenant-scoped)
 * GET    /v1/meetings/:id          — single meeting note detail
 * POST   /v1/meetings              — create a meeting note (manual add)
 * POST   /v1/meetings/:id/process  — fetch transcript + summarize via AI
 * DELETE /v1/meetings/:id          — delete a meeting note
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { enforceFeatureAccess } from "../lib/seatEnforcement.js";

const tenantIdEnv = process.env.MS_TENANT_ID ?? "";
const clientId = process.env.MS_CLIENT_ID ?? "";
const clientSecret = process.env.MS_CLIENT_SECRET ?? "";
const defaultMailbox = (process.env.AGENT_EMAIL_ATLAS ?? "atlas.ceo@deadapp.info").trim();

// ── M365 token cache (same pattern as calendarRoutes) ─────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantIdEnv}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    },
  );

  const data = (await res.json()) as any;
  if (!res.ok || !data.access_token) {
    throw new Error(`M365 token failed: ${data.error_description ?? data.error ?? "unknown"}`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.token;
}

async function graphGet(path: string, token: string): Promise<any> {
  const url = `https://graph.microsoft.com/v1.0${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph ${res.status}: ${body}`);
  }
  return res.json();
}

// ── Validation schemas ────────────────────────────────────────────────────────

const CreateMeetingBody = z.object({
  platform: z.string().max(100),
  title: z.string().max(500),
  meetingUrl: z.string().max(2000).optional(),
  scheduledAt: z.string(), // ISO 8601
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  attendees: z.array(z.object({
    name: z.string().max(200).optional(),
    email: z.string().max(500).optional(),
  })).max(500).optional(),
});

// ── AI summarization ─────────────────────────────────────────────────────────

async function summarizeTranscript(transcript: string): Promise<{
  summary: string;
  actionItems: Array<{ text: string; assignee?: string; done: boolean }>;
  keyPoints: string[];
}> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return {
      summary: "AI summarization unavailable — OPENAI_API_KEY not configured.",
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

// ── Transcript fetching ──────────────────────────────────────────────────────

async function fetchTeamsTranscript(meetingUrl: string): Promise<string | null> {
  if (!tenantIdEnv || !clientId || !clientSecret) return null;
  if (!meetingUrl.includes("teams") && !meetingUrl.includes("microsoft")) return null;

  try {
    const token = await getAppToken();

    // Try to find the online meeting by join URL
    const meetings = await graphGet(
      `/users/${defaultMailbox}/onlineMeetings?$filter=joinWebUrl eq '${encodeURIComponent(meetingUrl)}'`,
      token,
    );

    const meeting = meetings?.value?.[0];
    if (!meeting?.id) return null;

    // Fetch transcripts for this meeting
    const transcripts = await graphGet(
      `/users/${defaultMailbox}/onlineMeetings/${meeting.id}/transcripts`,
      token,
    );

    const transcriptEntry = transcripts?.value?.[0];
    if (!transcriptEntry?.id) return null;

    // Fetch the actual transcript content
    const transcriptUrl = `/users/${defaultMailbox}/onlineMeetings/${meeting.id}/transcripts/${transcriptEntry.id}/content?$format=text/vtt`;
    const contentRes = await fetch(
      `https://graph.microsoft.com/v1.0${transcriptUrl}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!contentRes.ok) return null;

    const vttContent = await contentRes.text();

    // Parse VTT to plain text (strip timestamps and formatting)
    return vttContent
      .split("\n")
      .filter(line => !line.match(/^\d{2}:\d{2}/) && !line.match(/^WEBVTT/) && !line.match(/^NOTE/) && line.trim())
      .join("\n")
      .trim();
  } catch (err) {
    console.error("[meetings] Teams transcript fetch failed:", err);
    return null;
  }
}

async function fetchCalendarMeetings(tenantId: string): Promise<any[]> {
  if (!tenantIdEnv || !clientId || !clientSecret) return [];

  try {
    const token = await getAppToken();

    const now = new Date();
    const futureEnd = new Date(now);
    futureEnd.setDate(now.getDate() + 14); // next 2 weeks

    const data = await graphGet(
      `/users/${defaultMailbox}/calendarView` +
        `?startDateTime=${now.toISOString()}` +
        `&endDateTime=${futureEnd.toISOString()}` +
        `&$top=50` +
        `&$orderby=start/dateTime` +
        `&$select=id,subject,start,end,onlineMeetingUrl,onlineMeeting,attendees,isAllDay,isCancelled,organizer`,
      token,
    );

    return (data.value ?? [])
      .filter((e: any) => !e.isCancelled && !e.isAllDay && (e.onlineMeetingUrl || e.onlineMeeting?.joinUrl))
      .map((e: any) => ({
        externalId: e.id,
        subject: e.subject ?? "(No subject)",
        start: e.start?.dateTime ?? null,
        end: e.end?.dateTime ?? null,
        meetingUrl: e.onlineMeetingUrl ?? e.onlineMeeting?.joinUrl ?? null,
        platform: (e.onlineMeetingUrl ?? "").includes("zoom") ? "zoom"
          : (e.onlineMeetingUrl ?? "").includes("meet.google") ? "google-meet"
          : "microsoft-teams",
        attendees: (e.attendees ?? []).map((a: any) => ({
          name: a.emailAddress?.name ?? null,
          email: a.emailAddress?.address ?? null,
        })),
        organizer: e.organizer?.emailAddress?.name ?? null,
      }));
  } catch (err) {
    console.error("[meetings] Calendar fetch failed:", err);
    return [];
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

export const meetingRoutes: FastifyPluginAsync = async (app) => {
  // Seat tier gate — meetings is a pro/enterprise feature
  app.addHook("preHandler", async (req, reply) => {
    const userId = (req as any).auth?.userId as string | undefined;
    const userTenantId = (req as any).tenantId as string | undefined;
    if (userId && userTenantId) {
      const check = await enforceFeatureAccess(userId, userTenantId, "Meetings");
      if (!check.allowed) {
        return reply.code(403).send({ ok: false, error: check.reason });
      }
    }
  });

  // ── GET / — list meeting notes ─────────────────────────────────────────────
  app.get("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const q = req.query as Record<string, string>;
    const status = q.status || undefined;
    const limit = Math.min(parseInt(q.limit ?? "50", 10), 100);

    const meetings = await prisma.meetingNote.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { scheduledAt: "desc" },
      take: limit,
    });

    return reply.send({ ok: true, meetings, count: meetings.length });
  });

  // ── GET /upcoming — calendar-sourced upcoming meetings ─────────────────────
  app.get("/upcoming", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;

    // Merge calendar events with manually created meeting notes
    const [calendarMeetings, manualMeetings] = await Promise.all([
      fetchCalendarMeetings(tenantId),
      prisma.meetingNote.findMany({
        where: {
          tenantId,
          status: "scheduled",
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: "asc" },
        take: 20,
      }),
    ]);

    return reply.send({
      ok: true,
      calendar: calendarMeetings,
      manual: manualMeetings,
    });
  });

  // ── GET /:id — single meeting note ─────────────────────────────────────────
  app.get("/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const { id } = req.params as { id: string };

    const meeting = await prisma.meetingNote.findFirst({
      where: { id, tenantId },
    });

    if (!meeting) {
      return reply.code(404).send({ ok: false, error: "Meeting note not found" });
    }

    return reply.send({ ok: true, meeting });
  });

  // ── POST / — create meeting note ───────────────────────────────────────────
  app.post("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;

    let body: z.infer<typeof CreateMeetingBody>;
    try {
      body = CreateMeetingBody.parse(req.body);
    } catch (e: any) {
      return reply.code(400).send({ ok: false, error: "Invalid request body", details: e.errors });
    }

    const meeting = await prisma.meetingNote.create({
      data: {
        tenantId,
        platform: body.platform,
        title: body.title,
        meetingUrl: body.meetingUrl ?? null,
        scheduledAt: new Date(body.scheduledAt),
        durationMinutes: body.durationMinutes ?? null,
        attendees: body.attendees ?? [],
        status: "scheduled",
      },
    });

    return reply.code(201).send({ ok: true, meeting });
  });

  // ── POST /:id/process — fetch transcript + AI summarize ────────────────────
  app.post("/:id/process", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const { id } = req.params as { id: string };

    const meeting = await prisma.meetingNote.findFirst({
      where: { id, tenantId },
    });

    if (!meeting) {
      return reply.code(404).send({ ok: false, error: "Meeting note not found" });
    }

    // Step 1: Try to fetch transcript from Teams (if applicable)
    let transcript = meeting.transcript;
    if (!transcript && meeting.meetingUrl) {
      transcript = await fetchTeamsTranscript(meeting.meetingUrl);
    }

    if (!transcript) {
      // Mark as completed without transcript — user can paste manually later
      await prisma.meetingNote.update({
        where: { id },
        data: { status: "completed" },
      });
      return reply.send({
        ok: true,
        message: "No transcript available. Meeting marked as completed.",
        meeting: { ...meeting, status: "completed" },
      });
    }

    // Step 2: Summarize with AI
    try {
      const { summary, actionItems, keyPoints } = await summarizeTranscript(transcript);

      const updated = await prisma.meetingNote.update({
        where: { id },
        data: {
          transcript,
          summary,
          actionItems,
          keyPoints,
          status: "processed",
          processedAt: new Date(),
        },
      });

      return reply.send({ ok: true, meeting: updated });
    } catch (err: any) {
      app.log.error({ err }, "Meeting processing failed");

      await prisma.meetingNote.update({
        where: { id },
        data: { transcript, status: "failed" },
      });

      return reply.code(500).send({ ok: false, error: "Processing failed: " + err.message });
    }
  });

  // ── DELETE /:id ────────────────────────────────────────────────────────────
  app.delete("/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const { id } = req.params as { id: string };

    const meeting = await prisma.meetingNote.findFirst({
      where: { id, tenantId },
    });

    if (!meeting) {
      return reply.code(404).send({ ok: false, error: "Meeting note not found" });
    }

    await prisma.meetingNote.delete({ where: { id } });

    return reply.send({ ok: true, deleted: id });
  });
};
