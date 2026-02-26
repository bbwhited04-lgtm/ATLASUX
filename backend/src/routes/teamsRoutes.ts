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

// ── Graph API POST (for sending messages) ─────────────────────────────────
// Requires Group.ReadWrite.All (Application) with admin consent.
async function graphPost(token: string, path: string, body: unknown): Promise<any> {
  const url = path.startsWith("http") ? path : `${GRAPH}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    const msg = err?.error?.message ?? JSON.stringify(err);
    if (res.status === 403) {
      throw new Error(
        "Graph API 403: Ensure Group.ReadWrite.All (Application) is granted with admin consent. " +
        `Graph error: ${msg}`
      );
    }
    throw new Error(`Graph POST ${path} → ${res.status}: ${msg}`);
  }
  return res.status === 204 ? null : res.json();
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

  // POST /v1/teams/send — send a channel message via Graph API
  // Body: { teamId, channelId, text, fromAgent?, title? }
  // Requires Group.ReadWrite.All (Application) with admin consent.
  app.post("/send", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const body = (req.body ?? {}) as any;
    const teamId = String(body.teamId ?? "").trim();
    const channelId = String(body.channelId ?? "").trim();
    const text = String(body.text ?? "").trim();
    const fromAgent = String(body.fromAgent ?? "atlas").trim();
    const title = body.title ? String(body.title).trim() : null;

    if (!teamId || !channelId || !text) {
      return reply.code(400).send({ ok: false, error: "teamId, channelId, and text are required" });
    }

    const content = title
      ? `<strong>${title}</strong><br><br>${text}<br><br><em>Sent by ${fromAgent} via Atlas UX</em>`
      : `${text}<br><br><em>Sent by ${fromAgent} via Atlas UX</em>`;

    try {
      const token = await getMsToken();
      await graphPost(
        token,
        `/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/messages`,
        { body: { content, contentType: "html" } }
      );

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
            entityId: `${teamId}/${channelId}`.slice(0, 80),
            message: `Teams message sent by ${fromAgent} to channel ${channelId}`,
            meta: { fromAgent, title, teamId, channelId, preview: text.slice(0, 200) },
            timestamp: new Date(),
          },
        } as any).catch(() => null);
      }

      return reply.send({ ok: true });
    } catch (e: any) {
      return reply.code(502).send({ ok: false, error: e.message });
    }
  });

  // POST /v1/teams/cross-agent — cross-agent notification via Graph API
  // Body: { teamId, channelId, fromAgent, toAgent, message, context? }
  app.post("/cross-agent", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const body = (req.body ?? {}) as any;
    const teamId = String(body.teamId ?? "").trim();
    const channelId = String(body.channelId ?? "").trim();
    const fromAgent = String(body.fromAgent ?? "").trim();
    const toAgent = String(body.toAgent ?? "").trim();
    const message = String(body.message ?? "").trim();
    const context = body.context ? String(body.context).trim() : null;

    if (!teamId || !channelId || !fromAgent || !toAgent || !message) {
      return reply.code(400).send({
        ok: false,
        error: "teamId, channelId, fromAgent, toAgent, and message are required",
      });
    }

    const content =
      `<strong>${fromAgent.toUpperCase()} → ${toAgent.toUpperCase()}</strong><br><br>${message}` +
      (context ? `<br><br><em>Context: ${context}</em>` : "") +
      `<br><br><em>Cross-agent via Atlas UX</em>`;

    try {
      const token = await getMsToken();
      await graphPost(
        token,
        `/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/messages`,
        { body: { content, contentType: "html" } }
      );

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
            entityId: `${teamId}/${channelId}`.slice(0, 80),
            message: `Cross-agent Teams: ${fromAgent} → ${toAgent}`,
            meta: { fromAgent, toAgent, teamId, channelId, preview: message.slice(0, 200) },
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
