/**
 * outlookRoutes.ts — M365 Outlook Inbox API
 *
 * Reads agent mailboxes via Microsoft Graph (app-only credentials).
 * Now that Mail.Read application permission is granted in Azure AD,
 * this can read any user mailbox in the tenant.
 *
 * GET  /v1/outlook/inbox       — read inbox messages
 * GET  /v1/outlook/message/:id — read single message body
 * PATCH /v1/outlook/message/:id — mark read/unread
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

const tenantId = process.env.MS_TENANT_ID ?? "";
const clientId = process.env.MS_CLIENT_ID ?? "";
const clientSecret = process.env.MS_CLIENT_SECRET ?? "";
const defaultMailbox = (process.env.AGENT_EMAIL_ATLAS ?? "atlas.ceo@deadapp.info").trim();

// ── Token cache (app-only tokens last ~60 min) ──────────────────────────────

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
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
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

// ── Routes ───────────────────────────────────────────────────────────────────

export const outlookRoutes: FastifyPluginAsync = async (app) => {

  // ── Read inbox ──────────────────────────────────────────────────────────────

  app.get("/inbox", async (req, reply) => {
    const tenantCheck = (req as any).tenantId;
    if (!tenantCheck) return reply.code(401).send({ ok: false, error: "unauthorized" });

    if (!tenantId || !clientId || !clientSecret) {
      return reply.code(503).send({ ok: false, error: "M365 credentials not configured" });
    }

    const qs = req.query as {
      email?: string;
      top?: string;
      folder?: string;
      filter?: string;
      skip?: string;
    };
    const email = qs.email || defaultMailbox;
    const top = Math.min(Number(qs.top ?? 50), 100);
    const skip = Number(qs.skip ?? 0);
    const folder = qs.folder ?? "inbox";
    const filterUnread = qs.filter === "unread";

    try {
      const token = await getAppToken();

      // Build Graph URL
      const folderPath = folder === "inbox" ? "inbox" : `mailFolders/${folder}`;
      let url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/${folderPath}/messages`;
      url += `?$top=${top}&$skip=${skip}`;
      url += `&$orderby=receivedDateTime desc`;
      url += `&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,hasAttachments,importance,flag,toRecipients`;

      if (filterUnread) {
        url += `&$filter=isRead eq false`;
      }

      const mailRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!mailRes.ok) {
        const err = (await mailRes.json().catch(() => ({}))) as any;
        return reply.code(mailRes.status).send({
          ok: false,
          error: err.error?.message ?? `Graph API ${mailRes.status}`,
        });
      }

      const mailData = (await mailRes.json()) as any;
      const messages = (mailData.value ?? []).map((m: any) => ({
        id: m.id,
        from: m.from?.emailAddress?.name || m.from?.emailAddress?.address || "Unknown",
        fromEmail: m.from?.emailAddress?.address || "",
        subject: m.subject || "(no subject)",
        preview: m.bodyPreview || "",
        timestamp: m.receivedDateTime,
        unread: !m.isRead,
        hasAttachments: m.hasAttachments ?? false,
        importance: m.importance ?? "normal",
        flagged: m.flag?.flagStatus === "flagged",
        to: (m.toRecipients ?? []).map((r: any) => r.emailAddress?.address).filter(Boolean),
      }));

      // Get unread count
      const countUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/mailFolders/inbox?$select=unreadItemCount,totalItemCount`;
      const countRes = await fetch(countUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let unreadCount = 0;
      let totalCount = 0;
      if (countRes.ok) {
        const countData = (await countRes.json()) as any;
        unreadCount = countData.unreadItemCount ?? 0;
        totalCount = countData.totalItemCount ?? 0;
      }

      return reply.send({
        ok: true,
        email,
        messages,
        unreadCount,
        totalCount,
        hasMore: mailData["@odata.nextLink"] != null,
      });
    } catch (err: any) {
      req.log.error({ err }, "Outlook inbox read failed");
      return reply.code(500).send({ ok: false, error: err.message ?? "Failed to read inbox" });
    }
  });

  // ── Read single message body ────────────────────────────────────────────────

  app.get("/message/:messageId", async (req, reply) => {
    const tenantCheck = (req as any).tenantId;
    if (!tenantCheck) return reply.code(401).send({ ok: false, error: "unauthorized" });

    const { messageId } = req.params as { messageId: string };
    const qs = req.query as { email?: string };
    const email = qs.email || defaultMailbox;

    try {
      const token = await getAppToken();
      const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/messages/${messageId}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any;
        return reply.code(res.status).send({
          ok: false,
          error: err.error?.message ?? `Graph API ${res.status}`,
        });
      }

      const m = (await res.json()) as any;

      return reply.send({
        ok: true,
        message: {
          id: m.id,
          subject: m.subject,
          from: m.from?.emailAddress?.name || m.from?.emailAddress?.address || "Unknown",
          fromEmail: m.from?.emailAddress?.address || "",
          to: (m.toRecipients ?? []).map((r: any) => ({
            name: r.emailAddress?.name,
            email: r.emailAddress?.address,
          })),
          cc: (m.ccRecipients ?? []).map((r: any) => ({
            name: r.emailAddress?.name,
            email: r.emailAddress?.address,
          })),
          bodyHtml: m.body?.contentType === "html" ? m.body.content : null,
          bodyText: m.body?.contentType === "text" ? m.body.content : null,
          bodyPreview: m.bodyPreview,
          timestamp: m.receivedDateTime,
          sentAt: m.sentDateTime,
          unread: !m.isRead,
          hasAttachments: m.hasAttachments ?? false,
          importance: m.importance ?? "normal",
          flagged: m.flag?.flagStatus === "flagged",
        },
      });
    } catch (err: any) {
      req.log.error({ err }, "Outlook message read failed");
      return reply.code(500).send({ ok: false, error: err.message ?? "Failed to read message" });
    }
  });

  // ── Mark read/unread ────────────────────────────────────────────────────────

  app.patch("/message/:messageId", async (req, reply) => {
    const tenantCheck = (req as any).tenantId;
    if (!tenantCheck) return reply.code(401).send({ ok: false, error: "unauthorized" });

    const { messageId } = req.params as { messageId: string };
    const body = req.body as { email?: string; isRead?: boolean };
    const email = body.email || defaultMailbox;

    if (body.isRead === undefined) {
      return reply.code(400).send({ ok: false, error: "isRead field required" });
    }

    try {
      const token = await getAppToken();
      const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/messages/${messageId}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead: body.isRead }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any;
        return reply.code(res.status).send({
          ok: false,
          error: err.error?.message ?? `Graph API ${res.status}`,
        });
      }

      return reply.send({ ok: true, messageId, isRead: body.isRead });
    } catch (err: any) {
      req.log.error({ err }, "Outlook message update failed");
      return reply.code(500).send({ ok: false, error: err.message ?? "Failed to update message" });
    }
  });

  // ── Mail folders ────────────────────────────────────────────────────────────

  app.get("/folders", async (req, reply) => {
    const tenantCheck = (req as any).tenantId;
    if (!tenantCheck) return reply.code(401).send({ ok: false, error: "unauthorized" });

    const qs = req.query as { email?: string };
    const email = qs.email || defaultMailbox;

    try {
      const token = await getAppToken();
      const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/mailFolders?$select=id,displayName,totalItemCount,unreadItemCount&$top=50`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any;
        return reply.code(res.status).send({
          ok: false,
          error: err.error?.message ?? `Graph API ${res.status}`,
        });
      }

      const data = (await res.json()) as any;
      const folders = (data.value ?? []).map((f: any) => ({
        id: f.id,
        name: f.displayName,
        totalCount: f.totalItemCount ?? 0,
        unreadCount: f.unreadItemCount ?? 0,
      }));

      return reply.send({ ok: true, email, folders });
    } catch (err: any) {
      req.log.error({ err }, "Outlook folders read failed");
      return reply.code(500).send({ ok: false, error: err.message ?? "Failed to read folders" });
    }
  });

  // ── Connection status check ─────────────────────────────────────────────────

  app.get("/status", async (req, reply) => {
    if (!tenantId || !clientId || !clientSecret) {
      return reply.send({ ok: true, connected: false, reason: "M365 credentials not configured" });
    }

    try {
      const token = await getAppToken();
      // Quick check: try to read inbox folder metadata
      const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(defaultMailbox)}/mailFolders/inbox?$select=totalItemCount`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        return reply.send({ ok: true, connected: true, email: defaultMailbox });
      }
      const err = (await res.json().catch(() => ({}))) as any;
      return reply.send({
        ok: true,
        connected: false,
        reason: err.error?.message ?? `Graph API ${res.status}`,
      });
    } catch (err: any) {
      return reply.send({ ok: true, connected: false, reason: err.message });
    }
  });
};
