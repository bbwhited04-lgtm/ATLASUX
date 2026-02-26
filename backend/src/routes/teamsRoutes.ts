/**
 * teamsRoutes.ts
 *
 * Microsoft Teams integration.
 *
 * READ operations use Graph API (client-credentials / app-only):
 *   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET
 *   Permissions: Team.ReadBasic.All, Channel.ReadBasic.All, ChannelMessage.Read.All
 *
 * SEND operations use Incoming Webhooks (no Graph permissions needed):
 *   Create an Incoming Webhook connector in your Teams channel,
 *   then save the webhook URL via POST /v1/teams/webhook-url.
 *   Messages are sent as Adaptive Cards via the webhook.
 *
 * Endpoints:
 *   GET  /v1/teams/teams                                    list all Teams in tenant
 *   GET  /v1/teams/:teamId/channels                        list channels for a team
 *   GET  /v1/teams/:teamId/channels/:channelId/messages    recent messages
 *   POST /v1/teams/send        { channelId, text }          send via Incoming Webhook
 *   POST /v1/teams/cross-agent { channelId, ... }           cross-agent via Incoming Webhook
 *   POST /v1/teams/webhook-url { channelId, webhookUrl }    save a channel's webhook URL
 *   GET  /v1/teams/webhook-url/:channelId                   get saved webhook URL
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

const GRAPH = "https://graph.microsoft.com/v1.0";

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getMsToken(): Promise<string> {
  const tenant = String(process.env.MS_TENANT_ID ?? "").trim();
  const clientId = String(process.env.MS_CLIENT_ID ?? "").trim();
  const clientSecret = String(process.env.MS_CLIENT_SECRET ?? "").trim();
  if (!tenant || !clientId || !clientSecret) {
    throw new Error("MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET not configured");
  }
  const res = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );
  const data = (await res.json()) as any;
  if (!res.ok || !data.access_token) {
    throw new Error(`ms_token_failed: ${data.error_description ?? res.status}`);
  }
  return data.access_token as string;
}

async function graphGet(token: string, path: string): Promise<any> {
  const url = path.startsWith("http") ? path : `${GRAPH}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      ConsistencyLevel: "eventual",
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    const msg = err?.error?.message ?? JSON.stringify(err);
    if (res.status === 403) {
      throw new Error(
        "Graph API returned 403 Forbidden. " +
        "Ensure admin consent is granted for all permissions: " +
        "Azure Portal → App registrations → your app → API permissions → " +
        "click 'Grant admin consent for [your org]'. " +
        `Graph error: ${msg}`
      );
    }
    throw new Error(`Graph GET ${path} → ${res.status}: ${msg}`);
  }
  return res.json();
}

// ── Incoming Webhook sender ───────────────────────────────────────────────
// Sends an Adaptive Card (or simple text) to a Teams channel via its webhook URL.
async function sendViaWebhook(webhookUrl: string, text: string, title?: string | null): Promise<void> {
  const card: any = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            ...(title
              ? [{ type: "TextBlock", text: title, weight: "Bolder", size: "Medium" }]
              : []),
            { type: "TextBlock", text, wrap: true },
          ],
        },
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Teams webhook failed (${res.status}): ${body.slice(0, 300)}`);
  }
}

// ── Resolve webhook URL for a channel ─────────────────────────────────────
async function getWebhookUrl(tenantId: string, channelId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { tenantId_provider: { tenantId, provider: "teams" } },
    select: { config: true },
  });
  const cfg = (integration?.config ?? {}) as Record<string, any>;
  const webhooks = cfg.webhooks ?? {};
  return webhooks[channelId] ?? cfg.defaultWebhookUrl ?? null;
}

// ── Routes ────────────────────────────────────────────────────────────────────

export const teamsRoutes: FastifyPluginAsync = async (app) => {

  // GET /v1/teams/teams — list all Teams (groups provisioned as Teams)
  app.get("/teams", async (_req, reply) => {
    try {
      const token = await getMsToken();
      // Use groups filter to find Teams-provisioned groups
      // GET /teams requires Team.ReadBasic.All (app permission — no Group.Read.All needed)
      const data = await graphGet(token, `/teams?$select=id,displayName,description&$top=50`);
      const teams = (data.value ?? []).map((g: any) => ({
        id: g.id,
        displayName: g.displayName,
        description: g.description ?? null,
      }));
      return reply.send({ ok: true, teams });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // GET /v1/teams/:teamId/channels — list channels for a team
  app.get("/:teamId/channels", async (req, reply) => {
    const { teamId } = req.params as any;
    try {
      const token = await getMsToken();
      const data = await graphGet(
        token,
        `/teams/${encodeURIComponent(teamId)}/channels`
      );
      const channels = (data.value ?? []).map((c: any) => ({
        id: c.id,
        displayName: c.displayName,
        description: c.description ?? null,
        membershipType: c.membershipType ?? "standard",
      }));
      return reply.send({ ok: true, teamId, channels });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // GET /v1/teams/:teamId/channels/:channelId/messages?limit=20
  app.get("/:teamId/channels/:channelId/messages", async (req, reply) => {
    const { teamId, channelId } = req.params as any;
    const q = (req.query as any) ?? {};
    const limit = Math.min(Number(q.limit ?? 20), 50);
    try {
      const token = await getMsToken();
      const data = await graphGet(
        token,
        `/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/messages?$top=${limit}&$orderby=createdDateTime desc`
      );
      const messages = (data.value ?? []).map((m: any) => ({
        id: m.id,
        body: m.body?.content ?? "",
        contentType: m.body?.contentType ?? "text",
        from: m.from?.user?.displayName ?? m.from?.application?.displayName ?? "Unknown",
        createdAt: m.createdDateTime,
        importance: m.importance ?? "normal",
      }));
      return reply.send({ ok: true, teamId, channelId, messages });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // POST /v1/teams/webhook-url — save a channel's Incoming Webhook URL
  // Body: { channelId, webhookUrl, channelName? }
  app.post("/webhook-url", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as any;
    const channelId = String(body.channelId ?? "").trim();
    const webhookUrl = String(body.webhookUrl ?? "").trim();
    const channelName = body.channelName ? String(body.channelName).trim() : null;

    if (!channelId || !webhookUrl) {
      return reply.code(400).send({ ok: false, error: "channelId and webhookUrl are required" });
    }

    if (!webhookUrl.includes("webhook.office.com") && !webhookUrl.includes("microsoft.com")) {
      return reply.code(400).send({ ok: false, error: "webhookUrl must be a valid Teams webhook URL" });
    }

    try {
      // Upsert the integration record with the webhook URL in config.webhooks
      const existing = await prisma.integration.findUnique({
        where: { tenantId_provider: { tenantId, provider: "teams" } },
      });

      const cfg = (existing?.config ?? {}) as Record<string, any>;
      const webhooks = cfg.webhooks ?? {};
      webhooks[channelId] = webhookUrl;
      const channelNames = cfg.channelNames ?? {};
      if (channelName) channelNames[channelId] = channelName;

      await prisma.integration.upsert({
        where: { tenantId_provider: { tenantId, provider: "teams" } },
        update: {
          config: { ...cfg, webhooks, channelNames, defaultWebhookUrl: cfg.defaultWebhookUrl ?? webhookUrl },
          connected: true,
        },
        create: {
          tenantId,
          provider: "teams",
          connected: true,
          config: { webhooks, channelNames, defaultWebhookUrl: webhookUrl },
        },
      });

      return reply.send({ ok: true, channelId, saved: true });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // GET /v1/teams/webhook-url/:channelId — get saved webhook URL for a channel
  app.get("/webhook-url/:channelId", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });
    const { channelId } = req.params as any;

    try {
      const url = await getWebhookUrl(tenantId, channelId);
      return reply.send({ ok: true, channelId, webhookUrl: url });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // GET /v1/teams/webhooks — list all saved webhook channels
  app.get("/webhooks", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(401).send({ ok: false, error: "tenantId required" });

    try {
      const integration = await prisma.integration.findUnique({
        where: { tenantId_provider: { tenantId, provider: "teams" } },
        select: { config: true, connected: true },
      });
      const cfg = (integration?.config ?? {}) as Record<string, any>;
      const webhooks = cfg.webhooks ?? {};
      const channelNames = cfg.channelNames ?? {};
      const channels = Object.keys(webhooks).map((id) => ({
        channelId: id,
        channelName: channelNames[id] ?? null,
        hasWebhook: true,
      }));
      return reply.send({ ok: true, channels, defaultWebhookUrl: cfg.defaultWebhookUrl ?? null });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // POST /v1/teams/send — send a channel message via Incoming Webhook
  // Body: { channelId, text, fromAgent?, title?, webhookUrl? }
  app.post("/send", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const body = (req.body ?? {}) as any;
    const channelId = String(body.channelId ?? "").trim();
    const text = String(body.text ?? "").trim();
    const fromAgent = String(body.fromAgent ?? "atlas").trim();
    const title = body.title ? String(body.title).trim() : null;

    if (!text) {
      return reply.code(400).send({ ok: false, error: "text is required" });
    }

    // Resolve webhook URL: explicit > saved per-channel > default
    let webhookUrl = body.webhookUrl ? String(body.webhookUrl).trim() : "";
    if (!webhookUrl && tenantId && channelId) {
      webhookUrl = (await getWebhookUrl(tenantId, channelId)) ?? "";
    }
    if (!webhookUrl) {
      return reply.code(400).send({
        ok: false,
        error: "No webhook URL found. Save one first via POST /v1/teams/webhook-url or pass webhookUrl in the request body.",
      });
    }

    const fullText = `${text}\n\n_Sent by ${fromAgent} via Atlas UX_`;
    const fullTitle = title ?? `Message from ${fromAgent}`;

    try {
      await sendViaWebhook(webhookUrl, fullText, fullTitle);

      if (tenantId) {
        await prisma.auditLog.create({
          data: {
            tenantId,
            actorType: "system",
            actorUserId: null,
            actorExternalId: fromAgent,
            level: "info",
            action: "TEAMS_MESSAGE_SENT",
            entityType: "teams_channel",
            entityId: channelId.slice(0, 80) || "default",
            message: `Teams message sent by ${fromAgent}`,
            meta: { fromAgent, title, channelId, preview: text.slice(0, 200) },
            timestamp: new Date(),
          },
        } as any).catch(() => null);
      }

      return reply.send({ ok: true });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // POST /v1/teams/cross-agent — cross-agent notification via Incoming Webhook
  // Body: { channelId, fromAgent, toAgent, message, context?, webhookUrl? }
  app.post("/cross-agent", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const body = (req.body ?? {}) as any;
    const channelId = String(body.channelId ?? "").trim();
    const fromAgent = String(body.fromAgent ?? "").trim();
    const toAgent = String(body.toAgent ?? "").trim();
    const message = String(body.message ?? "").trim();
    const context = body.context ? String(body.context).trim() : null;

    if (!fromAgent || !toAgent || !message) {
      return reply.code(400).send({
        ok: false,
        error: "fromAgent, toAgent, and message are required",
      });
    }

    let webhookUrl = body.webhookUrl ? String(body.webhookUrl).trim() : "";
    if (!webhookUrl && tenantId && channelId) {
      webhookUrl = (await getWebhookUrl(tenantId, channelId)) ?? "";
    }
    if (!webhookUrl) {
      return reply.code(400).send({ ok: false, error: "No webhook URL found for this channel." });
    }

    const title = `${fromAgent.toUpperCase()} → ${toAgent.toUpperCase()}`;
    const fullText = message + (context ? `\n\n_Context: ${context}_` : "") + "\n\n_Cross-agent via Atlas UX_";

    try {
      await sendViaWebhook(webhookUrl, fullText, title);

      if (tenantId) {
        await prisma.auditLog.create({
          data: {
            tenantId,
            actorType: "system",
            actorUserId: null,
            actorExternalId: fromAgent,
            level: "info",
            action: "TEAMS_CROSS_AGENT_NOTIFY",
            entityType: "teams_channel",
            entityId: channelId.slice(0, 80) || "default",
            message: `Cross-agent Teams: ${fromAgent} → ${toAgent}`,
            meta: { fromAgent, toAgent, channelId, preview: message.slice(0, 200) },
            timestamp: new Date(),
          },
        } as any).catch(() => null);
      }

      return reply.send({ ok: true, fromAgent, toAgent });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // GET /v1/teams/status — check if Teams credentials are configured
  app.get("/status", async (_req, reply) => {
    const configured =
      !!process.env.MS_TENANT_ID &&
      !!process.env.MS_CLIENT_ID &&
      !!process.env.MS_CLIENT_SECRET;

    if (!configured) {
      return reply.send({ ok: true, connected: false, reason: "MS credentials not configured" });
    }

    try {
      await getMsToken();
      return reply.send({ ok: true, connected: true });
    } catch (e: any) {
      return reply.send({ ok: true, connected: false, reason: e.message });
    }
  });
};
