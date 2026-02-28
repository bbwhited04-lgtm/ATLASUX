/**
 * calendarRoutes.ts — M365 Calendar API
 *
 * Reads calendar events via Microsoft Graph (app-only credentials).
 * Calendars.Read application permission is granted in Azure AD.
 *
 * GET  /v1/calendar/events       — list events for a date range
 * GET  /v1/calendar/event/:id    — single event detail
 * GET  /v1/calendar/calendars    — list all calendars for the user
 * GET  /v1/calendar/status       — connection health check
 */

import type { FastifyPluginAsync } from "fastify";

const tenantId = process.env.MS_TENANT_ID ?? "";
const clientId = process.env.MS_CLIENT_ID ?? "";
const clientSecret = process.env.MS_CLIENT_SECRET ?? "";
const defaultMailbox = (process.env.AGENT_EMAIL_ATLAS ?? "atlas.ceo@deadapp.info").trim();

// ── Token cache (shared pattern with outlookRoutes) ──────────────────────────

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

// ── Graph API helper ─────────────────────────────────────────────────────────

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

// ── Routes ───────────────────────────────────────────────────────────────────

export const calendarRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /status ──────────────────────────────────────────────────────────
  app.get("/status", async (_req, reply) => {
    if (!tenantId || !clientId || !clientSecret) {
      return reply.send({ ok: true, connected: false, reason: "M365 credentials not configured" });
    }
    try {
      const token = await getAppToken();
      // Test calendar access
      await graphGet(`/users/${defaultMailbox}/calendars?$top=1`, token);
      return reply.send({ ok: true, connected: true, email: defaultMailbox });
    } catch (err: any) {
      return reply.send({ ok: true, connected: false, reason: err.message });
    }
  });

  // ── GET /calendars ───────────────────────────────────────────────────────
  app.get("/calendars", async (req, reply) => {
    try {
      const token = await getAppToken();
      const mailbox = (req.query as any).mailbox || defaultMailbox;

      const data = await graphGet(
        `/users/${mailbox}/calendars?$select=id,name,color,isDefaultCalendar,canEdit,owner`,
        token,
      );

      const calendars = (data.value ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        isDefault: c.isDefaultCalendar ?? false,
        canEdit: c.canEdit ?? false,
        owner: c.owner?.name ?? c.owner?.address ?? mailbox,
      }));

      return reply.send({ ok: true, calendars });
    } catch (err: any) {
      app.log.error({ err }, "Calendar list failed");
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

  // ── GET /events ──────────────────────────────────────────────────────────
  app.get("/events", async (req, reply) => {
    try {
      const token = await getAppToken();
      const q = req.query as Record<string, string>;
      const mailbox = q.mailbox || defaultMailbox;
      const top = Math.min(parseInt(q.top ?? "50", 10), 100);

      // Default to this week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfRange = new Date(startOfWeek);
      endOfRange.setDate(startOfWeek.getDate() + 30); // next 30 days by default

      const startDateTime = q.start || startOfWeek.toISOString();
      const endDateTime = q.end || endOfRange.toISOString();

      const data = await graphGet(
        `/users/${mailbox}/calendarView` +
          `?startDateTime=${startDateTime}` +
          `&endDateTime=${endDateTime}` +
          `&$top=${top}` +
          `&$orderby=start/dateTime` +
          `&$select=id,subject,start,end,location,organizer,attendees,isAllDay,isCancelled,showAs,importance,bodyPreview,onlineMeeting,onlineMeetingUrl,webLink,categories,recurrence`,
        token,
      );

      const events = (data.value ?? []).map((e: any) => ({
        id: e.id,
        subject: e.subject ?? "(No subject)",
        start: e.start?.dateTime ?? null,
        startTz: e.start?.timeZone ?? "UTC",
        end: e.end?.dateTime ?? null,
        endTz: e.end?.timeZone ?? "UTC",
        location: e.location?.displayName ?? null,
        isAllDay: e.isAllDay ?? false,
        isCancelled: e.isCancelled ?? false,
        showAs: e.showAs ?? "busy",
        importance: e.importance ?? "normal",
        preview: e.bodyPreview ?? "",
        organizer: e.organizer?.emailAddress?.name ?? e.organizer?.emailAddress?.address ?? null,
        organizerEmail: e.organizer?.emailAddress?.address ?? null,
        attendees: (e.attendees ?? []).map((a: any) => ({
          name: a.emailAddress?.name ?? null,
          email: a.emailAddress?.address ?? null,
          status: a.status?.response ?? "none",
          type: a.type ?? "required",
        })),
        meetingUrl: e.onlineMeetingUrl ?? e.onlineMeeting?.joinUrl ?? null,
        webLink: e.webLink ?? null,
        categories: e.categories ?? [],
        isRecurring: !!e.recurrence,
      }));

      return reply.send({
        ok: true,
        events,
        count: events.length,
        range: { start: startDateTime, end: endDateTime },
      });
    } catch (err: any) {
      app.log.error({ err }, "Calendar events fetch failed");
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });

  // ── GET /event/:eventId ──────────────────────────────────────────────────
  app.get("/event/:eventId", async (req, reply) => {
    try {
      const token = await getAppToken();
      const { eventId } = req.params as { eventId: string };
      const mailbox = (req.query as any).mailbox || defaultMailbox;

      const e = await graphGet(
        `/users/${mailbox}/events/${eventId}` +
          `?$select=id,subject,body,start,end,location,organizer,attendees,isAllDay,isCancelled,showAs,importance,onlineMeeting,onlineMeetingUrl,webLink,categories,recurrence,createdDateTime`,
        token,
      );

      return reply.send({
        ok: true,
        event: {
          id: e.id,
          subject: e.subject ?? "(No subject)",
          bodyHtml: e.body?.contentType === "html" ? e.body.content : null,
          bodyText: e.body?.contentType === "text" ? e.body.content : null,
          start: e.start?.dateTime ?? null,
          startTz: e.start?.timeZone ?? "UTC",
          end: e.end?.dateTime ?? null,
          endTz: e.end?.timeZone ?? "UTC",
          location: e.location?.displayName ?? null,
          isAllDay: e.isAllDay ?? false,
          isCancelled: e.isCancelled ?? false,
          showAs: e.showAs ?? "busy",
          importance: e.importance ?? "normal",
          organizer: e.organizer?.emailAddress?.name ?? null,
          organizerEmail: e.organizer?.emailAddress?.address ?? null,
          attendees: (e.attendees ?? []).map((a: any) => ({
            name: a.emailAddress?.name ?? null,
            email: a.emailAddress?.address ?? null,
            status: a.status?.response ?? "none",
            type: a.type ?? "required",
          })),
          meetingUrl: e.onlineMeetingUrl ?? e.onlineMeeting?.joinUrl ?? null,
          webLink: e.webLink ?? null,
          categories: e.categories ?? [],
          isRecurring: !!e.recurrence,
          created: e.createdDateTime ?? null,
        },
      });
    } catch (err: any) {
      app.log.error({ err }, "Calendar event detail failed");
      return reply.status(500).send({ ok: false, error: err.message });
    }
  });
};
