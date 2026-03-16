/**
 * ElevenLabs Conversational AI routes.
 *
 * Two categories:
 *   1. Webhook endpoints (called BY ElevenLabs during/after calls) — no auth required
 *   2. Management API (called by our frontend) — requires auth + tenant
 *
 * Mounts at /v1/elevenlabs
 */

import type { FastifyPluginAsync } from "fastify";
import { timingSafeEqual } from "crypto";
import {
  createAgent,
  updateAgent,
  getAgent,
  listAgents,
  importTwilioNumber,
  assignAgentToNumber,
  initiateOutboundCall,
} from "../services/elevenlabs.js";
import { resolveCredential } from "../services/credentialResolver.js";
import { prisma } from "../db/prisma.js";

const OWNER_TENANT_ID = process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";
const ELEVENLABS_WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET ?? "";

/** Helper — write an audit row using the actual schema fields. */
async function audit(
  tenantId: string,
  action: string,
  message: string,
  meta: any = {},
  opts: { actorExternalId?: string; entityType?: string } = {},
) {
  await prisma.auditLog.create({
    data: {
      tenantId,
      actorExternalId: opts.actorExternalId ?? "lucy:elevenlabs",
      actorType: "agent",
      action,
      entityType: opts.entityType ?? "elevenlabs",
      message,
      meta,
    },
  });
}

/**
 * Validate ElevenLabs webhook requests via shared secret.
 * Returns false if the secret is configured and the request doesn't match.
 */
function validateWebhookSecret(req: any): boolean {
  if (!ELEVENLABS_WEBHOOK_SECRET) return true; // not configured = allow (dev mode)
  const provided = String(req.headers["x-webhook-secret"] ?? req.headers["x-elevenlabs-secret"] ?? "").trim();
  if (!provided) return false;
  const expectedBuf = Buffer.from(ELEVENLABS_WEBHOOK_SECRET);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

const elevenlabsRoutes: FastifyPluginAsync = async (app) => {

  // ── Webhook auth guard — all tool/webhook endpoints ─────────────────────
  app.addHook("preHandler", async (req, reply) => {
    // Only guard webhook endpoints, not management API
    if (req.url.includes("/tool/") || req.url.includes("/webhook/")) {
      if (!validateWebhookSecret(req)) {
        return reply.status(401).send({ ok: false, error: "invalid_webhook_secret" });
      }
    }
  });

  // ── Mid-Call Webhook: Book Appointment ───────────────────────────────────

  app.post("/tool/book-appointment", async (req, reply) => {
    const tenantId = (req.headers["x-tenant-id"] as string) || OWNER_TENANT_ID;
    const body = req.body as any;

    app.log.info({ tenantId, body }, "ElevenLabs tool: book_appointment");

    try {
      // Create CRM contact if new
      const existingContact = body.caller_phone
        ? await prisma.crmContact.findFirst({
            where: { tenantId, phone: { contains: body.caller_phone.slice(-10) } },
          })
        : null;

      let contactId = existingContact?.id;

      if (!contactId && body.caller_name) {
        const nameParts = (body.caller_name as string).split(" ");
        const contact = await prisma.crmContact.create({
          data: {
            tenantId,
            firstName: nameParts[0] ?? "",
            lastName: nameParts.slice(1).join(" ") || null,
            phone: body.caller_phone || null,
            source: "elevenlabs_voice",
            tags: ["inbound-call", "appointment-request"],
          },
        });
        contactId = contact.id;
      }

      await audit(tenantId, "elevenlabs.appointment.booked",
        `Appointment request: ${body.caller_name} — ${body.service_type} — ${body.preferred_date ?? "TBD"}`,
        body, { entityType: "appointment" },
      );

      // Notify via Slack if configured
      const slackToken = await resolveCredential(tenantId, "slack");
      const slackChannel = process.env.SLACK_LEADS_CHANNEL_ID;
      if (slackToken && slackChannel) {
        await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${slackToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: slackChannel,
            text: `:phone: *New Appointment Request via Lucy*\n*Caller:* ${body.caller_name}\n*Service:* ${body.service_type}\n*Preferred:* ${body.preferred_date ?? "TBD"}\n*Phone:* ${body.caller_phone ?? "N/A"}\n*Notes:* ${body.notes ?? "—"}`,
          }),
        }).catch(() => {});
      }

      return reply.send({
        success: true,
        message: `Appointment request logged for ${body.caller_name}. The team will confirm shortly.`,
      });
    } catch (err: any) {
      app.log.error({ err }, "ElevenLabs book-appointment webhook failed");
      return reply.status(500).send({ success: false, message: "Booking failed" });
    }
  });

  // ── Mid-Call Webhook: Send SMS ───────────────────────────────────────────

  app.post("/tool/send-sms", async (req, reply) => {
    const tenantId = (req.headers["x-tenant-id"] as string) || OWNER_TENANT_ID;
    const body = req.body as any;

    app.log.info({ tenantId, body }, "ElevenLabs tool: send_sms");

    try {
      const twilioSid = await resolveCredential(tenantId, "twilio_sid");
      const twilioToken = await resolveCredential(tenantId, "twilio_token");
      const twilioFrom = await resolveCredential(tenantId, "twilio_from");

      if (!twilioSid || !twilioToken || !twilioFrom) {
        return reply.send({ success: false, message: "SMS not configured for this account" });
      }

      const smsRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: body.to_number,
            From: twilioFrom,
            Body: body.message,
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (!smsRes.ok) {
        const errText = await smsRes.text().catch(() => "");
        app.log.error({ status: smsRes.status, errText }, "Twilio SMS send failed");
        return reply.send({ success: false, message: "SMS send failed" });
      }

      await audit(tenantId, "elevenlabs.sms.sent",
        `SMS to ${body.to_number}: ${body.message.slice(0, 100)}`,
        { to: body.to_number, body: body.message }, { entityType: "sms" },
      );

      return reply.send({ success: true, message: "SMS sent successfully" });
    } catch (err: any) {
      app.log.error({ err }, "ElevenLabs send-sms webhook failed");
      return reply.status(500).send({ success: false, message: "SMS failed" });
    }
  });

  // ── Mid-Call Webhook: Take Message ───────────────────────────────────────

  app.post("/tool/take-message", async (req, reply) => {
    const tenantId = (req.headers["x-tenant-id"] as string) || OWNER_TENANT_ID;
    const body = req.body as any;

    app.log.info({ tenantId, body }, "ElevenLabs tool: take_message");

    try {
      await audit(tenantId, "elevenlabs.message.taken",
        `Message from ${body.caller_name}: ${body.message}`,
        body, { entityType: "message" },
      );

      // Slack notification
      const slackToken = await resolveCredential(tenantId, "slack");
      const slackChannel = process.env.SLACK_LEADS_CHANNEL_ID;
      if (slackToken && slackChannel) {
        const urgencyEmoji = body.urgency === "urgent" ? ":rotating_light:" : ":memo:";
        await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${slackToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: slackChannel,
            text: `${urgencyEmoji} *Message via Lucy*\n*From:* ${body.caller_name}\n*For:* ${body.for_person ?? "Anyone"}\n*Message:* ${body.message}\n*Callback:* ${body.caller_phone ?? "N/A"}\n*Urgency:* ${body.urgency ?? "normal"}`,
          }),
        }).catch(() => {});
      }

      return reply.send({
        success: true,
        message: `Message taken. I'll make sure ${body.for_person ?? "the team"} gets it.`,
      });
    } catch (err: any) {
      app.log.error({ err }, "ElevenLabs take-message webhook failed");
      return reply.status(500).send({ success: false, message: "Message capture failed" });
    }
  });

  // ── Post-Call Webhook ────────────────────────────────────────────────────

  app.post("/webhook/post-call", async (req, reply) => {
    const tenantId = (req.headers["x-tenant-id"] as string) || OWNER_TENANT_ID;
    const body = req.body as any;
    const data = body?.data ?? body;

    app.log.info({ tenantId, conversationId: data?.conversation_id }, "ElevenLabs post-call webhook");

    try {
      const transcript = data?.transcript ?? "";
      const summary = data?.analysis?.transcript_summary ?? "";
      const conversationId = data?.conversation_id ?? data?.dynamic_variables?.["system__conversation_id"] ?? "unknown";
      const startTime = data?.metadata?.start_time_unix_secs
        ? new Date(data.metadata.start_time_unix_secs * 1000).toISOString()
        : new Date().toISOString();

      await audit(tenantId, "elevenlabs.call.completed",
        summary || "Call completed (no summary available)",
        {
          conversationId,
          startTime,
          transcript: typeof transcript === "string" ? transcript.slice(0, 5000) : JSON.stringify(transcript).slice(0, 5000),
          summary,
          dynamicVars: data?.dynamic_variables ?? {},
        },
        { entityType: "call" },
      );

      return reply.send({ ok: true });
    } catch (err: any) {
      app.log.error({ err }, "ElevenLabs post-call webhook failed");
      return reply.status(500).send({ ok: false });
    }
  });

  // ── Twilio Personalization Webhook ───────────────────────────────────────
  // ElevenLabs calls this when a call arrives to get per-caller context

  app.post("/webhook/personalize", async (req, reply) => {
    const tenantId = (req.headers["x-tenant-id"] as string) || OWNER_TENANT_ID;
    const body = req.body as any;
    const callerNumber = body?.from ?? body?.caller_number ?? "";

    app.log.info({ tenantId, callerNumber }, "ElevenLabs personalization webhook");

    try {
      // Look up caller in CRM
      let callerName = "";
      let callerCompany = "";

      if (callerNumber) {
        const contact = await prisma.crmContact.findFirst({
          where: { tenantId, phone: { contains: callerNumber.slice(-10) } },
          select: { firstName: true, lastName: true, company: true },
        });

        if (contact) {
          callerName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
          callerCompany = contact.company ?? "";
        }
      }

      // Look up tenant business info
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });

      return reply.send({
        conversation_initiation_client_data: {
          dynamic_variables: {
            business_name: tenant?.name ?? "our office",
            caller_name: callerName || "there",
            caller_company: callerCompany,
            tenant_id: tenantId,
          },
        },
      });
    } catch (err: any) {
      app.log.error({ err }, "ElevenLabs personalization webhook failed");
      // Return defaults so the call still goes through
      return reply.send({
        conversation_initiation_client_data: {
          dynamic_variables: {
            business_name: "our office",
            caller_name: "there",
          },
        },
      });
    }
  });

  // ── Management API (authenticated) ──────────────────────────────────────

  // Create a new ElevenLabs voice agent for this tenant
  app.post("/agents", async (req, reply) => {
    const tenantId = (req as any).tenantId ?? OWNER_TENANT_ID;
    const body = req.body as any;

    const result = await createAgent(tenantId, {
      businessName: body.businessName,
      businessType: body.businessType ?? "general",
      greeting: body.greeting,
      persona: body.persona ?? "lucy",
      customPrompt: body.customPrompt,
      voiceId: body.voiceId,
      language: body.language,
      escalationPhone: body.escalationPhone,
      services: body.services,
      hoursOfOperation: body.hoursOfOperation,
    });

    if (!result.ok) {
      return reply.status(400).send(result);
    }

    await audit(tenantId, "elevenlabs.agent.created",
      `Created ElevenLabs agent: ${body.businessName}`,
      { agentId: result.agentId, persona: body.persona ?? "lucy" },
      { actorExternalId: (req as any).userId ?? "system", entityType: "elevenlabs_agent" },
    );

    return reply.send(result);
  });

  // Update an existing agent
  app.patch("/agents/:agentId", async (req, reply) => {
    const tenantId = (req as any).tenantId ?? OWNER_TENANT_ID;
    const { agentId } = req.params as any;
    const body = req.body as any;

    const result = await updateAgent(tenantId, agentId, body);
    return reply.status(result.ok ? 200 : 400).send(result);
  });

  // Get agent details
  app.get("/agents/:agentId", async (req, reply) => {
    const tenantId = (req as any).tenantId ?? OWNER_TENANT_ID;
    const { agentId } = req.params as any;

    const result = await getAgent(tenantId, agentId);
    return reply.status(result.ok ? 200 : 400).send(result);
  });

  // List all agents
  app.get("/agents", async (req, reply) => {
    const tenantId = (req as any).tenantId ?? OWNER_TENANT_ID;

    const result = await listAgents(tenantId);
    return reply.status(result.ok ? 200 : 400).send(result);
  });

  // Import a Twilio number and assign to an agent
  app.post("/phone-numbers", async (req, reply) => {
    const tenantId = (req as any).tenantId ?? OWNER_TENANT_ID;
    const body = req.body as any;

    // Step 1: Import the number
    const importResult = await importTwilioNumber(
      tenantId,
      body.phoneNumber,
      body.label ?? "Lucy Line",
    );

    if (!importResult.ok) {
      return reply.status(400).send(importResult);
    }

    // Step 2: Assign agent if provided
    if (body.agentId && importResult.phoneNumberId) {
      const assignResult = await assignAgentToNumber(tenantId, importResult.phoneNumberId, body.agentId);
      if (!assignResult.ok) {
        return reply.status(400).send({ ...importResult, assignError: assignResult.error });
      }
    }

    await audit(tenantId, "elevenlabs.phone.imported",
      `Imported phone ${body.phoneNumber} to ElevenLabs${body.agentId ? ` → agent ${body.agentId}` : ""}`,
      { phoneNumber: body.phoneNumber, phoneNumberId: importResult.phoneNumberId, agentId: body.agentId },
      { actorExternalId: (req as any).userId ?? "system", entityType: "phone_number" },
    );

    return reply.send(importResult);
  });

  // Initiate an outbound call
  app.post("/outbound-call", async (req, reply) => {
    const tenantId = (req as any).tenantId ?? OWNER_TENANT_ID;
    const body = req.body as any;

    const result = await initiateOutboundCall(
      tenantId,
      body.agentId,
      body.phoneNumberId,
      body.toNumber,
      body.dynamicVars,
    );

    if (result.ok) {
      await audit(tenantId, "elevenlabs.call.outbound",
        `Outbound call to ${body.toNumber}`,
        { toNumber: body.toNumber, agentId: body.agentId, conversationId: result.conversationId },
        { actorExternalId: (req as any).userId ?? "system", entityType: "call" },
      );
    }

    return reply.status(result.ok ? 200 : 400).send(result);
  });
};

export default elevenlabsRoutes;
