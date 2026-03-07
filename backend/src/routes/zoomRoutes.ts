/**
 * zoomRoutes.ts — Zoom Webhook + Meeting Event Processing
 *
 * POST /v1/zoom/webhook — receive event notifications + endpoint validation
 *
 * Handles:
 *   - endpoint.url_validation  — Zoom challenge/response
 *   - meeting.started          — create/update MeetingNote → "in_progress"
 *   - meeting.ended            — update MeetingNote → "completed"
 *   - meeting.created          — create MeetingNote → "scheduled"
 *   - meeting.updated          — update MeetingNote details
 *   - recording.completed      — fetch transcript, summarize, ingest to KB
 *   - recording.transcript_completed — secondary transcript trigger
 */

import type { FastifyPluginAsync } from "fastify";
import crypto from "crypto";
import { prisma } from "../db/prisma.js";
import { downloadTranscriptFromWebhook, summarizeTranscript } from "../services/zoom.js";
import { dispatchOrgBrainHook } from "../core/orgBrain/hooks.js";
import { startMeetingSession, addMeetingTranscript, endMeetingSession } from "../voice/zoomBot.js";
import { startRTMS, stopRTMS } from "../voice/rtmsClient.js";

const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET ?? "";
const TENANT_ID = process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";
const SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000001";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export const zoomRoutes: FastifyPluginAsync = async (app) => {
  app.post("/webhook", async (req, reply) => {
    const body = req.body as any;

    // ── Endpoint URL validation challenge ────────────────────────────────
    if (body?.event === "endpoint.url_validation") {
      const plainToken = body.payload?.plainToken;
      if (!plainToken || !webhookSecret) {
        app.log.warn("Zoom validation challenge received but ZOOM_WEBHOOK_SECRET not set");
        return reply.status(400).send({ error: "Missing plainToken or webhook secret" });
      }

      const encryptedToken = crypto
        .createHmac("sha256", webhookSecret)
        .update(plainToken)
        .digest("hex");

      app.log.info("Zoom webhook endpoint validation responded");
      return reply.send({ plainToken, encryptedToken });
    }

    // ── Verify x-zm-signature for all non-validation events ──────────────
    if (!webhookSecret) {
      app.log.warn("ZOOM_WEBHOOK_SECRET not configured — rejecting event");
      return reply.status(401).send({ error: "Webhook secret not configured" });
    }

    const timestamp = req.headers["x-zm-request-timestamp"] as string | undefined;
    const signature = req.headers["x-zm-signature"] as string | undefined;

    if (!timestamp || !signature) {
      app.log.warn("Zoom webhook missing x-zm-request-timestamp or x-zm-signature headers");
      return reply.status(401).send({ error: "Missing Zoom signature headers" });
    }

    const message = `v0:${timestamp}:${JSON.stringify(body)}`;
    const expectedSig = "v0=" + crypto.createHmac("sha256", webhookSecret).update(message).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      app.log.warn("Zoom webhook signature mismatch — rejecting");
      return reply.status(401).send({ error: "Invalid Zoom webhook signature" });
    }

    // ── Normal event notifications ───────────────────────────────────────
    const eventType: string = body?.event ?? "unknown";
    const payload = body?.payload?.object;
    app.log.info({ eventType }, "Zoom webhook event received");

    // Audit log every event
    try {
      await prisma.auditLog.create({
        data: {
          actorExternalId: "zoom-webhook",
          actorType: "system",
          action: `zoom.${eventType}`,
          entityType: "zoom_event",
          message: `Zoom ${eventType} event received`,
          meta: body ?? {},
        },
      });
    } catch (err) {
      app.log.error({ err }, "Failed to log Zoom webhook event");
    }

    // ── Meeting lifecycle events ─────────────────────────────────────────
    if (eventType === "meeting.created" || eventType === "meeting.updated") {
      await handleMeetingScheduled(app, payload);
    } else if (eventType === "meeting.started") {
      await handleMeetingStarted(app, payload);
    } else if (eventType === "meeting.ended") {
      await handleMeetingEnded(app, payload);
    } else if (
      eventType === "recording.completed" ||
      eventType === "recording.transcript_completed"
    ) {
      await handleRecordingCompleted(app, body);
    } else if (eventType === "meeting.rtms_started") {
      handleRTMSStarted(app, body);
    } else if (eventType === "meeting.rtms_stopped" || eventType === "meeting.rtms_interrupted") {
      handleRTMSStopped(app, body);
    }

    return reply.status(200).send({ ok: true });
  });

  // ── OAuth callback — exchange authorization code for tokens ────────────
  app.get("/oauth/callback", async (req, reply) => {
    const { code } = req.query as { code?: string };
    if (!code) {
      return reply.status(400).send({ error: "Missing authorization code" });
    }

    const clientId = process.env.ZOOM_CLIENT_ID ?? "";
    const clientSecret = process.env.ZOOM_CLIENT_SECRET ?? "";
    const redirectUri = process.env.ZOOM_REDIRECT_URI ?? "";

    if (!clientId || !clientSecret) {
      app.log.error("Zoom OAuth: missing ZOOM_CLIENT_ID or ZOOM_CLIENT_SECRET");
      return reply.status(500).send({ error: "OAuth not configured" });
    }

    try {
      const tokenRes = await fetch("https://zoom.us/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenRes.json() as any;

      if (!tokenRes.ok) {
        app.log.error({ status: tokenRes.status, body: tokenData }, "Zoom OAuth token exchange failed");
        return reply.status(400).send({ error: "Token exchange failed", details: tokenData });
      }

      // Store tokens in the database for later API calls
      await prisma.auditLog.create({
        data: {
          actorExternalId: "zoom-oauth",
          actorType: "system",
          action: "zoom.oauth_authorized",
          entityType: "zoom_oauth",
          message: "Zoom OAuth tokens received and stored",
          meta: {
            scope: tokenData.scope,
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
          },
        },
      });

      // Store tokens in TokenVault
      await prisma.tokenVault.upsert({
        where: {
          orgId_userId_provider: {
            orgId: TENANT_ID,
            userId: SYSTEM_ACTOR,
            provider: "zoom",
          },
        },
        create: {
          orgId: TENANT_ID,
          userId: SYSTEM_ACTOR,
          provider: "zoom",
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? null,
          expiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          scope: tokenData.scope ?? null,
        },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? undefined,
          expiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : undefined,
          scope: tokenData.scope ?? undefined,
        },
      });

      app.log.info("Zoom OAuth authorized successfully");
      return reply.send({
        ok: true,
        message: "Zoom OAuth authorized. Tokens stored.",
        scope: tokenData.scope,
      });
    } catch (err: any) {
      app.log.error({ err }, "Zoom OAuth callback error");
      return reply.status(500).send({ error: "OAuth callback failed" });
    }
  });
};

// ── Event Handlers ───────────────────────────────────────────────────────────

async function handleMeetingScheduled(app: any, payload: any) {
  if (!payload?.id) return;
  const meetingId = String(payload.id);

  try {
    await prisma.meetingNote.upsert({
      where: { tenantId_externalMeetingId: { tenantId: TENANT_ID, externalMeetingId: meetingId } },
      create: {
        tenantId: TENANT_ID,
        externalMeetingId: meetingId,
        platform: "zoom",
        title: payload.topic ?? "(No topic)",
        meetingUrl: payload.join_url ?? null,
        scheduledAt: payload.start_time ? new Date(payload.start_time) : new Date(),
        durationMinutes: payload.duration ?? null,
        attendees: [],
        status: "scheduled",
      },
      update: {
        title: payload.topic ?? undefined,
        meetingUrl: payload.join_url ?? undefined,
        scheduledAt: payload.start_time ? new Date(payload.start_time) : undefined,
        durationMinutes: payload.duration ?? undefined,
      },
    });
    app.log.info({ meetingId }, "Zoom meeting scheduled/updated in MeetingNote");
  } catch (err) {
    app.log.error({ err, meetingId }, "Failed to upsert scheduled MeetingNote");
  }
}

async function handleMeetingStarted(app: any, payload: any) {
  if (!payload?.id) return;
  const meetingId = String(payload.id);

  try {
    // Try to update existing, otherwise create
    const existing = await prisma.meetingNote.findFirst({
      where: { tenantId: TENANT_ID, externalMeetingId: meetingId },
    });

    if (existing) {
      await prisma.meetingNote.update({
        where: { id: existing.id },
        data: { status: "in_progress" },
      });
    } else {
      await prisma.meetingNote.create({
        data: {
          tenantId: TENANT_ID,
          externalMeetingId: meetingId,
          platform: "zoom",
          title: payload.topic ?? "(No topic)",
          meetingUrl: payload.join_url ?? null,
          scheduledAt: payload.start_time ? new Date(payload.start_time) : new Date(),
          durationMinutes: payload.duration ?? null,
          attendees: [],
          status: "in_progress",
        },
      });
    }
    app.log.info({ meetingId }, "Zoom meeting started");

    // Feed into Lucy's ContextRing for real-time meeting awareness
    try {
      startMeetingSession(meetingId, payload.topic ?? "(No topic)");
    } catch { /* best-effort — don't break webhook */ }
  } catch (err) {
    app.log.error({ err, meetingId }, "Failed to update MeetingNote for meeting.started");
  }
}

async function handleMeetingEnded(app: any, payload: any) {
  if (!payload?.id) return;
  const meetingId = String(payload.id);

  try {
    const existing = await prisma.meetingNote.findFirst({
      where: { tenantId: TENANT_ID, externalMeetingId: meetingId },
    });
    if (existing) {
      await prisma.meetingNote.update({
        where: { id: existing.id },
        data: { status: "completed" },
      });
      app.log.info({ meetingId }, "Zoom meeting ended");

      // End Lucy's ContextRing session + trigger post-meeting processing
      try {
        endMeetingSession(meetingId);
      } catch { /* best-effort */ }
    }
  } catch (err) {
    app.log.error({ err, meetingId }, "Failed to update MeetingNote for meeting.ended");
  }
}

function handleRTMSStarted(app: any, body: any): void {
  const payload = body?.payload?.object;
  const meetingUuid = payload?.meeting_uuid ?? payload?.id;
  const streamId = payload?.rtms_stream_id;
  const serverUrl = payload?.server_urls ?? payload?.server_url;
  const topic = payload?.topic;

  if (!meetingUuid || !streamId || !serverUrl) {
    app.log.warn({ payload }, "RTMS started event missing required fields");
    return;
  }

  app.log.info({ meetingUuid, streamId }, "RTMS stream started — connecting");
  startRTMS(meetingUuid, streamId, serverUrl, topic);
}

function handleRTMSStopped(app: any, body: any): void {
  const payload = body?.payload?.object;
  const streamId = payload?.rtms_stream_id;

  if (!streamId) {
    app.log.warn("RTMS stopped event missing stream ID");
    return;
  }

  app.log.info({ streamId }, "RTMS stream stopped");
  stopRTMS(streamId);
}

async function handleRecordingCompleted(app: any, body: any) {
  const payload = body?.payload?.object;
  if (!payload?.id) return;

  const meetingId = String(payload.id);
  const recordingFiles: any[] = payload.recording_files ?? [];
  const downloadToken: string = body?.download_token ?? "";

  // Find the TRANSCRIPT file in recording_files
  const transcriptFile = recordingFiles.find(
    (f: any) => f.file_type === "TRANSCRIPT" && f.download_url,
  );

  if (!transcriptFile) {
    app.log.info({ meetingId }, "No transcript file in recording.completed — skipping");
    return;
  }

  try {
    // Download and parse the VTT transcript
    const transcript = await downloadTranscriptFromWebhook(
      transcriptFile.download_url,
      downloadToken,
    );

    if (!transcript) {
      app.log.warn({ meetingId }, "Failed to download Zoom transcript");
      return;
    }

    // Feed transcript lines into Lucy's ContextRing
    try {
      const lines = transcript.split("\n").filter((l: string) => l.includes(":"));
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        const speaker = line.slice(0, colonIdx).trim();
        const text = line.slice(colonIdx + 1).trim();
        if (speaker && text) {
          addMeetingTranscript(meetingId, speaker, text);
        }
      }
    } catch { /* best-effort — don't break transcript processing */ }

    // Summarize with AI
    const { summary, actionItems, keyPoints } = await summarizeTranscript(transcript);

    // Upsert MeetingNote with transcript + summary
    const existing = await prisma.meetingNote.findFirst({
      where: { tenantId: TENANT_ID, externalMeetingId: meetingId },
    });

    const topic = payload.topic ?? "(No topic)";
    const meetingDate = payload.start_time
      ? new Date(payload.start_time).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    let meetingNoteId: string;
    if (existing) {
      await prisma.meetingNote.update({
        where: { id: existing.id },
        data: {
          transcript,
          summary,
          actionItems,
          keyPoints,
          status: "processed",
          processedAt: new Date(),
        },
      });
      meetingNoteId = existing.id;
    } else {
      const created = await prisma.meetingNote.create({
        data: {
          tenantId: TENANT_ID,
          externalMeetingId: meetingId,
          platform: "zoom",
          title: topic,
          scheduledAt: payload.start_time ? new Date(payload.start_time) : new Date(),
          durationMinutes: payload.duration ?? null,
          attendees: [],
          transcript,
          summary,
          actionItems,
          keyPoints,
          status: "processed",
          processedAt: new Date(),
        },
      });
      meetingNoteId = created.id;
    }

    // Ingest into KB so agents can reference meeting content
    const slug = `zoom-meeting/${meetingDate}/${slugify(topic)}`;
    const kbBody = [
      transcript,
      "",
      "## Summary",
      summary,
      "",
      "## Action Items",
      ...((actionItems as any[]).map((a: any) => `- ${a.text}${a.assignee ? ` (${a.assignee})` : ""}`)),
      "",
      "## Key Points",
      ...((keyPoints as any[]).map((k: any) => `- ${k}`)),
    ].join("\n");

    await prisma.kbDocument.upsert({
      where: { tenantId_slug: { tenantId: TENANT_ID, slug } },
      create: {
        tenantId: TENANT_ID,
        title: `Zoom: ${topic} (${meetingDate})`,
        slug,
        body: kbBody,
        status: "published",
        createdBy: SYSTEM_ACTOR,
      },
      update: {
        body: kbBody,
        title: `Zoom: ${topic} (${meetingDate})`,
        status: "published",
      },
    });

    app.log.info(
      { meetingId, topic, chars: transcript.length },
      "Zoom recording processed — transcript summarized and ingested to KB",
    );

    // Fire org brain hook to extract organizational insights
    dispatchOrgBrainHook({
      tenantId: TENANT_ID,
      event: "meeting_processed",
      entityId: meetingNoteId,
    }).catch(() => {});
  } catch (err) {
    app.log.error({ err, meetingId }, "Failed to process Zoom recording");
  }
}
