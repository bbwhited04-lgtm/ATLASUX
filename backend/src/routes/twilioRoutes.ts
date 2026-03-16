/**
 * twilioRoutes.ts — Twilio Voice + SMS Webhooks & API
 *
 * Webhook endpoints (form-urlencoded, no auth, CSRF-skipped):
 *   POST /v1/twilio/sms/inbound       — receive inbound SMS
 *   POST /v1/twilio/voice/inbound     — receive inbound calls (TwiML greeting + voicemail)
 *   POST /v1/twilio/voice/status      — call status callbacks
 *   POST /v1/twilio/voice/recording   — recording URL callback
 *
 * API endpoints (JSON, auth required):
 *   POST /v1/twilio/call              — place outbound call
 *   GET  /v1/twilio/calls             — call log from audit trail
 *   GET  /v1/twilio/messages          — SMS log from audit trail
 */

import type { FastifyPluginAsync } from "fastify";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "../db/prisma.js";
import { handleTwilioMediaStream } from "../voice/twilioStream.js";
import { handleMercerMediaStream } from "../voice/mercerStream.js";
import { startDialingSession, dialSingle, getDialerStatus, stopDialingSession } from "../voice/outboundDialer.js";
import { queueFollowUpSms } from "../voice/mercerPostCall.js";
import { resolveCredential } from "../services/credentialResolver.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const TENANT_ID = "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

async function twilioConfig(tenantId: string) {
  const accountSid  = await resolveCredential(tenantId, "twilio_sid") ?? "";
  const authToken   = await resolveCredential(tenantId, "twilio_token") ?? "";
  const fromNumber  = await resolveCredential(tenantId, "twilio_from") ?? "";
  return { accountSid, authToken, fromNumber };
}

function twiml(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`;
}

/** Strip non-digits from a phone number for comparison */
function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
}

/** Look up CRM contact by phone number */
async function findContactByPhone(phone: string) {
  const digits = normalizePhone(phone);
  if (digits.length < 7) return null;

  // Try CrmContact first
  const contact = await prisma.crmContact.findFirst({
    where: { tenantId: TENANT_ID, phone: { contains: digits.slice(-7) } },
  });
  if (contact) return { type: "contact" as const, id: contact.id, name: `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() };

  // Try CrmCompany
  const company = await prisma.crmCompany.findFirst({
    where: { tenantId: TENANT_ID, phone: { contains: digits.slice(-7) } },
  });
  if (company) return { type: "company" as const, id: company.id, name: company.name };

  return null;
}

// ── Twilio signature validation ──────────────────────────────────────────────

function validateTwilioSignature(
  authToken: string,
  signature: string | undefined,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!signature || !authToken) return false;
  const keys = Object.keys(params).sort();
  let data = url;
  for (const key of keys) data += key + params[key];
  const expected = createHmac("sha1", authToken).update(data).digest("base64");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

// ── Route plugin ─────────────────────────────────────────────────────────────

export const twilioRoutes: FastifyPluginAsync = async (app) => {

  // ── Scoped form-urlencoded parser for webhook sub-plugin ────────────────
  app.register(async (webhooks) => {
    webhooks.addContentTypeParser(
      "application/x-www-form-urlencoded",
      { parseAs: "string" },
      (_req: any, body: any, done: any) => {
        try {
          done(null, Object.fromEntries(new URLSearchParams(body as string)));
        } catch (err) {
          done(err, undefined);
        }
      },
    );

    // Twilio signature check as preHandler on all webhook routes
    webhooks.addHook("preHandler", async (req, reply) => {
      const tenantId = (req as any).tenantId ?? TENANT_ID;
      const authToken = await resolveCredential(tenantId, "twilio_token") ?? "";
      if (!authToken) {
        app.log.warn("Twilio auth token not configured for tenant — rejecting webhook");
        return reply.code(503).send("");
      }
      const sig = (req.headers as any)["x-twilio-signature"] as string | undefined;
      const proto = (req.headers as any)["x-forwarded-proto"] ?? "https";
      const host = (req.headers as any)["host"] ?? "api.atlasux.cloud";
      const url = `${proto}://${host}${req.url}`;
      const params = (req.body as Record<string, string>) ?? {};

      if (!validateTwilioSignature(authToken, sig, url, params)) {
        // Also try with the canonical base URL (proxy may alter the host/proto)
        const baseUrl = (process.env.TWILIO_WEBHOOK_BASE_URL ?? "").trim();
        const altUrl = baseUrl ? `${baseUrl}${req.url}` : "";
        if (!altUrl || !validateTwilioSignature(authToken, sig, altUrl, params)) {
          app.log.warn({ url, altUrl, sig }, "Twilio signature mismatch — rejecting");
          return reply.code(403).send("");
        }
      }
    });

    // ── POST /sms/inbound ──────────────────────────────────────────────────
    webhooks.post("/sms/inbound", async (req, reply) => {
      const body = req.body as Record<string, string>;
      const from = body.From ?? "";
      const to = body.To ?? "";
      const text = body.Body ?? "";
      const messageSid = body.MessageSid ?? "";

      app.log.info({ from, to, messageSid }, "Inbound SMS received");

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId: TENANT_ID,
          actorExternalId: from,
          actorType: "external",
          action: "twilio.sms.inbound",
          entityType: "sms",
          message: `SMS from ${from}: ${text.slice(0, 200)}`,
          meta: { from, to, messageSid, body: text },
        },
      }).catch((err) => app.log.error({ err }, "Failed to audit inbound SMS"));

      // CRM contact lookup + activity
      const match = await findContactByPhone(from).catch(() => null);
      if (match && match.type === "contact") {
        await prisma.contactActivity.create({
          data: {
            tenantId: TENANT_ID,
            contactId: match.id,
            type: "sms",
            subject: `Inbound SMS from ${from}`,
            body: text,
            meta: { direction: "inbound", messageSid, from, to },
          },
        }).catch(() => null);
      }

      reply.header("Content-Type", "text/xml");
      return twiml(
        `<Message>Thanks for your message! An Atlas team member will respond shortly.</Message>`,
      );
    });

    // ── POST /voice/inbound ────────────────────────────────────────────────
    webhooks.post("/voice/inbound", async (req, reply) => {
      const body = req.body as Record<string, string>;
      const from = body.From ?? "";
      const to = body.To ?? "";
      const callSid = body.CallSid ?? "";
      const callStatus = body.CallStatus ?? "";

      app.log.info({ from, to, callSid, callStatus }, "Inbound voice call");

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId: TENANT_ID,
          actorExternalId: from,
          actorType: "external",
          action: "twilio.voice.inbound",
          entityType: "call",
          message: `Inbound call from ${from}`,
          meta: { from, to, callSid, callStatus },
        },
      }).catch((err) => app.log.error({ err }, "Failed to audit inbound call"));

      // CRM contact lookup + activity
      const match = await findContactByPhone(from).catch(() => null);
      if (match && match.type === "contact") {
        await prisma.contactActivity.create({
          data: {
            tenantId: TENANT_ID,
            contactId: match.id,
            type: "call",
            subject: `Inbound call from ${from}`,
            meta: { direction: "inbound", callSid, from, to },
          },
        }).catch(() => null);
      }

      reply.header("Content-Type", "text/xml");

      // Route to Lucy Voice Engine if enabled, otherwise voicemail
      const voiceEnabled = (process.env.LUCY_VOICE_ENABLED ?? "").toLowerCase() === "true";
      if (voiceEnabled) {
        // Build WebSocket URL for Twilio <Connect><Stream>
        const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
        const host = req.headers.host ?? "localhost:8787";
        const wsProto = proto === "https" ? "wss" : "ws";
        const streamUrl = `${wsProto}://${host}/v1/twilio/voice/stream`;

        return twiml(
          `<Connect><Stream url="${streamUrl}">` +
          `<Parameter name="from" value="${from}" />` +
          `</Stream></Connect>`,
        );
      }

      // Fallback: voicemail
      return twiml(
        `<Say voice="Polly.Joanna">Thank you for calling Atlas UX. Please leave a message after the beep and we'll get back to you shortly.</Say>` +
        `<Record maxLength="120" action="/v1/twilio/voice/recording" transcribe="false" />` +
        `<Say voice="Polly.Joanna">We didn't receive a recording. Goodbye.</Say>`,
      );
    });

    // ── POST /voice/status ─────────────────────────────────────────────────
    webhooks.post("/voice/status", async (req, reply) => {
      const body = req.body as Record<string, string>;
      const callSid = body.CallSid ?? "";
      const callStatus = body.CallStatus ?? "";
      const callDuration = body.CallDuration ?? "";
      const from = body.From ?? "";
      const to = body.To ?? "";

      app.log.info({ callSid, callStatus, callDuration }, "Voice status callback");

      await prisma.auditLog.create({
        data: {
          tenantId: TENANT_ID,
          actorExternalId: "twilio-status",
          actorType: "system",
          action: `twilio.voice.status.${callStatus}`,
          entityType: "call",
          message: `Call ${callSid} status: ${callStatus} (${callDuration}s)`,
          meta: { callSid, callStatus, callDuration, from, to },
        },
      }).catch((err) => app.log.error({ err }, "Failed to audit voice status"));

      // SMS follow-up for outbound calls that didn't connect
      const noConnectStatuses = ["no-answer", "busy", "failed", "canceled"];
      if (noConnectStatuses.includes(callStatus) && to) {
        queueFollowUpSms(to).catch((err) =>
          app.log.error({ err }, "Failed to queue SMS follow-up from status callback")
        );
      }

      return reply.status(200).send("");
    });

    // ── POST /voice/recording ──────────────────────────────────────────────
    webhooks.post("/voice/recording", async (req, reply) => {
      const body = req.body as Record<string, string>;
      const recordingUrl = body.RecordingUrl ?? "";
      const recordingSid = body.RecordingSid ?? "";
      const callSid = body.CallSid ?? "";
      const recordingDuration = body.RecordingDuration ?? "";

      app.log.info({ recordingSid, callSid, recordingDuration }, "Voice recording callback");

      await prisma.auditLog.create({
        data: {
          tenantId: TENANT_ID,
          actorExternalId: "twilio-recording",
          actorType: "system",
          action: "twilio.voice.recording",
          entityType: "call",
          message: `Voicemail recorded (${recordingDuration}s) for call ${callSid}`,
          meta: { recordingUrl, recordingSid, callSid, recordingDuration },
        },
      }).catch((err) => app.log.error({ err }, "Failed to audit recording"));

      // Queue transcription job for future processing
      await prisma.job.create({
        data: {
          tenantId: TENANT_ID,
          jobType: "VOICEMAIL_TRANSCRIBE",
          status: "queued",
          priority: 40,
          input: { recordingUrl, recordingSid, callSid, recordingDuration },
        },
      }).catch((err) => app.log.error({ err }, "Failed to queue transcription job"));

      reply.header("Content-Type", "text/xml");
      return twiml(
        `<Say voice="Polly.Joanna">Thank you. Goodbye.</Say><Hangup/>`,
      );
    });
  });

  // ── WebSocket: Lucy Voice Stream ──────────────────────────────────────────
  app.get("/voice/stream", { websocket: true }, (socket) => {
    handleTwilioMediaStream(socket);
  });

  // ── WebSocket: Mercer Outbound Voice Stream ────────────────────────────────
  app.get("/voice/mercer-stream", { websocket: true }, (socket, req) => {
    // Contact info is passed via Twilio Stream parameters
    const params = (req.query as any) ?? {};
    const contactInfo = {
      phone: String(params.contactPhone ?? "unknown"),
      name: String(params.contactName ?? "Unknown"),
      contactId: params.contactId ? String(params.contactId) : undefined,
      company: params.contactCompany ? String(params.contactCompany) : undefined,
      industry: params.contactIndustry ? String(params.contactIndustry) : undefined,
    };
    handleMercerMediaStream(socket, contactInfo);
  });

  // ── API endpoints (JSON, auth required) ──────────────────────────────────

  // ── Mercer Outbound Dialer ──────────────────────────────────────────────

  // POST /outbound/start — start a batch dialing session
  app.post("/outbound/start", async (req) => {
    const body = req.body as any;
    return startDialingSession({
      tags: body?.tags,
      limit: body?.limit,
      source: body?.source,
    });
  });

  // POST /outbound/single — dial a single CRM contact
  app.post("/outbound/single", async (req) => {
    const body = req.body as any;
    const contactId = String(body?.contactId ?? "").trim();
    if (!contactId) return { ok: false, error: "contactId is required" };
    return dialSingle(contactId);
  });

  // GET /outbound/status — check dialer status
  app.get("/outbound/status", async () => {
    return getDialerStatus();
  });

  // POST /outbound/stop — stop current dialing session
  app.post("/outbound/stop", async () => {
    return stopDialingSession();
  });

  // POST /call — place outbound call
  app.post("/call", async (req) => {
    const tenantId = (req as any).tenantId ?? TENANT_ID;
    const { accountSid, authToken, fromNumber } = await twilioConfig(tenantId);
    if (!accountSid || !authToken || !fromNumber) {
      return { ok: false, error: "Twilio not configured for this tenant" };
    }

    const body = req.body as any;
    const to = String(body?.to ?? "").trim();
    if (!to) return { ok: false, error: "to (phone number) is required" };

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const creds = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    // Simple TwiML for outbound — just connect the call
    const twimlUrl = `https://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient`;

    const params = new URLSearchParams({
      To: to,
      From: `+1${fromNumber}`,
      Url: twimlUrl,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json() as any;
    if (!res.ok) {
      app.log.error({ status: res.status, data }, "Outbound call failed");
      return { ok: false, error: data?.message ?? `Twilio error ${res.status}` };
    }

    const callSid = data.sid;

    // Audit
    await prisma.auditLog.create({
      data: {
        tenantId: TENANT_ID,
        actorExternalId: "twilio-api",
        actorType: "system",
        action: "twilio.voice.outbound",
        entityType: "call",
        message: `Outbound call to ${to} (${callSid})`,
        meta: { to, from: fromNumber, callSid },
      },
    }).catch(() => null);

    // CRM contact activity
    const match = await findContactByPhone(to).catch(() => null);
    if (match && match.type === "contact") {
      await prisma.contactActivity.create({
        data: {
          tenantId: TENANT_ID,
          contactId: match.id,
          type: "call",
          subject: `Outbound call to ${to}`,
          meta: { direction: "outbound", callSid, to, from: fromNumber },
        },
      }).catch(() => null);
    }

    return { ok: true, callSid };
  });

  // GET /calls — call log from audit trail
  app.get("/calls", async (req) => {
    const q = req.query as any;
    const take = Math.min(Number(q?.limit ?? 50), 200);
    const skip = Number(q?.offset ?? 0);

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: TENANT_ID,
        action: { startsWith: "twilio.voice" },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    return { ok: true, calls: logs };
  });

  // GET /messages — SMS log from audit trail
  app.get("/messages", async (req) => {
    const q = req.query as any;
    const take = Math.min(Number(q?.limit ?? 50), 200);
    const skip = Number(q?.offset ?? 0);

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: TENANT_ID,
        action: { startsWith: "twilio.sms" },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    return { ok: true, messages: logs };
  });
};
