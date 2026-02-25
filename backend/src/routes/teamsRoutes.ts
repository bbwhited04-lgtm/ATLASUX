/**
 * teamsRoutes.ts
 *
 * Microsoft Teams integration via Graph API (client-credentials / app-only).
 *
 * Requires these env vars (same app registration as emailSender):
 *   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET
 *
 * Application permissions needed (admin consent in Azure portal):
 *   Team.ReadBasic.All   — list teams
 *   Channel.ReadBasic.All — list channels
 *   ChannelMessage.Read.All — read messages
 *   ChannelMessage.Send  — send messages
 *
 * Endpoints:
 *   GET  /v1/teams/teams                                    list all Teams in tenant
 *   GET  /v1/teams/:teamId/channels                        list channels for a team
 *   GET  /v1/teams/:teamId/channels/:channelId/messages    recent messages
 *   POST /v1/teams/send                                     send channel message
 *   POST /v1/teams/cross-agent                              cross-agent notification
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma.js";

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
    throw new Error(
      `Graph GET ${path} → ${res.status}: ${err?.error?.message ?? JSON.stringify(err)}`
    );
  }
  return res.json();
}

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
    throw new Error(
      `Graph POST ${path} → ${res.status}: ${err?.error?.message ?? JSON.stringify(err)}`
    );
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

  // POST /v1/teams/send — send a message via Incoming Webhook
  // Body: { webhookUrl, text, fromAgent?, title? }
  // webhookUrl: the Incoming Webhook URL configured per-channel in Teams
  app.post("/send", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const body = (req.body ?? {}) as any;
    const webhookUrl = String(body.webhookUrl ?? process.env.TEAMS_WORKFLOW_URL ?? "").trim();
    const text = String(body.text ?? "").trim();
    const fromAgent = String(body.fromAgent ?? "atlas").trim();
    const title = body.title ? String(body.title).trim() : null;

    if (!webhookUrl || !text) {
      return reply.code(400).send({ ok: false, error: "webhookUrl and text are required (or set TEAMS_WORKFLOW_URL in env)" });
    }
    if (!webhookUrl.startsWith("https://")) {
      return reply.code(400).send({ ok: false, error: "webhookUrl must be an https URL" });
    }

    // Power Automate Workflow trigger payload (replacement for retired Incoming Webhooks)
    const payload: any = {
      text: title ? `**${title}**\n\n${text}\n\n_Sent by ${fromAgent} via Atlas UX_` : `${text}\n\n_Sent by ${fromAgent} via Atlas UX_`,
    };

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        // Detect Power Automate Direct API auth error — requires OAuth, not a plain webhook
        if (
          res.status === 401 &&
          (errText.includes("DirectApiAuthorizationRequired") || errText.includes("OAuth authorization scheme"))
        ) {
          throw new Error(
            "Your webhook URL is a Power Automate Direct API endpoint which requires Azure AD OAuth. " +
            "To fix: open Power Automate → create a new flow → choose 'When an HTTP request is received' as the trigger → " +
            "save it → copy the HTTP POST URL (starts with https://prod-...logic.azure.com/...) → " +
            "paste that URL here or set it as TEAMS_WORKFLOW_URL in your environment. " +
            "Do NOT use the 'Direct API' flow URL."
          );
        }
        throw new Error(`webhook_failed (${res.status}): ${errText.slice(0, 300)}`);
      }

      if (tenantId) {
        await prisma.auditLog.create({
          data: {
            tenantId,
            actorType: "system",
            actorUserId: null,
            actorExternalId: fromAgent,
            level: "info",
            action: "TEAMS_MESSAGE_SENT",
            entityType: "teams_webhook",
            entityId: webhookUrl.slice(0, 80),
            message: `Teams message sent by ${fromAgent} via webhook`,
            meta: { fromAgent, title, preview: text.slice(0, 200) },
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
  // Body: { webhookUrl, fromAgent, toAgent, message, context? }
  app.post("/cross-agent", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const body = (req.body ?? {}) as any;
    const webhookUrl = String(body.webhookUrl ?? process.env.TEAMS_WORKFLOW_URL ?? "").trim();
    const fromAgent = String(body.fromAgent ?? "").trim();
    const toAgent = String(body.toAgent ?? "").trim();
    const message = String(body.message ?? "").trim();
    const context = body.context ? String(body.context).trim() : null;

    if (!webhookUrl || !fromAgent || !toAgent || !message) {
      return reply.code(400).send({
        ok: false,
        error: "webhookUrl, fromAgent, toAgent, and message are required",
      });
    }

    const payload = {
      text: `📨 **${fromAgent.toUpperCase()} → ${toAgent.toUpperCase()}**\n\n${message}` +
        (context ? `\n\n_Context: ${context}_` : "") +
        `\n\n_Cross-agent via Atlas UX_`,
    };

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`webhook_failed (${res.status}): ${errText.slice(0, 300)}`);
      }

      if (tenantId) {
        await prisma.auditLog.create({
          data: {
            tenantId,
            actorType: "system",
            actorUserId: null,
            actorExternalId: fromAgent,
            level: "info",
            action: "TEAMS_CROSS_AGENT_NOTIFY",
            entityType: "teams_webhook",
            entityId: webhookUrl.slice(0, 80),
            message: `Cross-agent Teams: ${fromAgent} → ${toAgent}`,
            meta: { fromAgent, toAgent, preview: message.slice(0, 200) },
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

    const workflowUrl = process.env.TEAMS_WORKFLOW_URL ?? null;

    if (!configured) {
      return reply.send({ ok: true, connected: false, reason: "MS credentials not configured", workflowUrl });
    }

    try {
      await getMsToken();
      return reply.send({ ok: true, connected: true, workflowUrl });
    } catch (e: any) {
      return reply.send({ ok: true, connected: false, reason: e.message, workflowUrl });
    }
  });
};
