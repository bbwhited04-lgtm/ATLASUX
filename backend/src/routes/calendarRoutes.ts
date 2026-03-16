/**
 * calendarRoutes.ts — M365 Calendar API + Booking (advisory-lock guarded)
 *
 * Reads calendar events via Microsoft Graph (app-only credentials).
 * Calendars.Read application permission is granted in Azure AD.
 *
 * GET  /v1/calendar/events           — list events for a date range
 * GET  /v1/calendar/event/:id        — single event detail
 * GET  /v1/calendar/calendars        — list all calendars for the user
 * GET  /v1/calendar/status           — connection health check
 * POST /v1/calendar/book             — create a booking (advisory-lock guarded)
 * GET  /v1/calendar/slots            — available slots for a date
 * POST /v1/calendar/book/:id/cancel  — cancel a booking
 * GET  /v1/calendar/circuit-breaker  — external calendar API health
 */

import type { FastifyPluginAsync } from "fastify";
import { enforceFeatureAccess } from "../lib/seatEnforcement.js";
import { agentEmails } from "../config/agentEmails.js";
import { sanitizeError } from "../lib/sanitizeError.js";
import { resolveAgentEmail } from "../services/agentEmailResolver.js";
import {
  createBooking,
  getAvailableSlots,
  cancelBooking,
  getCircuitBreakerStatus,
} from "../services/calendarBooking.js";

const tenantId = process.env.MS_TENANT_ID ?? "";
const clientId = process.env.MS_CLIENT_ID ?? "";
const clientSecret = process.env.MS_CLIENT_SECRET ?? "";
const defaultMailboxFallback = "atlas.ceo@deadapp.info";

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
  // ── Seat tier gate — calendar is pro/enterprise only ────────────────────
  app.addHook("preHandler", async (req, reply) => {
    const userId = (req as any).auth?.userId as string | undefined;
    const userTenantId = (req as any).tenantId as string | undefined;
    if (userId && userTenantId) {
      const check = await enforceFeatureAccess(userId, userTenantId, "Calendar");
      if (!check.allowed) {
        return reply.code(403).send({ ok: false, error: check.reason });
      }
    }
  });

  // ── GET /status ──────────────────────────────────────────────────────────
  app.get("/status", async (req, reply) => {
    if (!tenantId || !clientId || !clientSecret) {
      return reply.send({ ok: true, connected: false, reason: "M365 credentials not configured" });
    }
    try {
      const reqTenantId = (req as any).tenantId as string | undefined;
      const mailbox = (reqTenantId ? await resolveAgentEmail(reqTenantId, "atlas") : null) ?? defaultMailboxFallback;
      const token = await getAppToken();
      // Test calendar access
      await graphGet(`/users/${mailbox}/calendars?$top=1`, token);
      return reply.send({ ok: true, connected: true, email: mailbox });
    } catch (err: any) {
      app.log.error({ err }, "Calendar status check failed");
      return reply.send({ ok: true, connected: false, reason: sanitizeError(err) });
    }
  });

  // ── GET /calendars ───────────────────────────────────────────────────────
  app.get("/calendars", async (req, reply) => {
    try {
      const token = await getAppToken();
      const reqTenantId = (req as any).tenantId as string | undefined;
      const defaultMailbox = (reqTenantId ? await resolveAgentEmail(reqTenantId, "atlas") : null) ?? defaultMailboxFallback;
      const _requestedMailbox = (req.query as any).mailbox || defaultMailbox;
      // Validate mailbox is a known agent email — prevent reading arbitrary M365 calendars
      const _allowedMailboxes = new Set(Object.values(agentEmails));
      if (!_allowedMailboxes.has(_requestedMailbox)) {
        return reply.code(403).send({ ok: false, error: "MAILBOX_NOT_ALLOWED" });
      }
      const mailbox = _requestedMailbox;

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
      return reply.status(500).send({ ok: false, error: sanitizeError(err) });
    }
  });

  // ── GET /events ──────────────────────────────────────────────────────────
  app.get("/events", async (req, reply) => {
    try {
      const token = await getAppToken();
      const q = req.query as Record<string, string>;
      const reqTenantId = (req as any).tenantId as string | undefined;
      const defaultMailbox = (reqTenantId ? await resolveAgentEmail(reqTenantId, "atlas") : null) ?? defaultMailboxFallback;
      const _requestedMailbox = q.mailbox || defaultMailbox;
      // Validate mailbox is a known agent email — prevent reading arbitrary M365 calendars
      const _allowedMailboxes = new Set(Object.values(agentEmails));
      if (!_allowedMailboxes.has(_requestedMailbox)) {
        return reply.code(403).send({ ok: false, error: "MAILBOX_NOT_ALLOWED" });
      }
      const mailbox = _requestedMailbox;
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
      return reply.status(500).send({ ok: false, error: sanitizeError(err) });
    }
  });

  // ── GET /event/:eventId ──────────────────────────────────────────────────
  app.get("/event/:eventId", async (req, reply) => {
    try {
      const token = await getAppToken();
      const { eventId } = req.params as { eventId: string };
      const reqTenantId = (req as any).tenantId as string | undefined;
      const defaultMailbox = (reqTenantId ? await resolveAgentEmail(reqTenantId, "atlas") : null) ?? defaultMailboxFallback;
      const _requestedMailbox = (req.query as any).mailbox || defaultMailbox;
      // Validate mailbox is a known agent email — prevent reading arbitrary M365 calendars
      const _allowedMailboxes = new Set(Object.values(agentEmails));
      if (!_allowedMailboxes.has(_requestedMailbox)) {
        return reply.code(403).send({ ok: false, error: "MAILBOX_NOT_ALLOWED" });
      }
      const mailbox = _requestedMailbox;

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
      return reply.status(500).send({ ok: false, error: sanitizeError(err) });
    }
  });

  // ── POST /book — create a booking (advisory-lock guarded) ─────────────
  app.post("/book", async (req, reply) => {
    try {
      const body = req.body as any;
      const reqTenantId = (req as any).tenantId as string | undefined;
      if (!reqTenantId) {
        return reply.code(400).send({ ok: false, error: "tenant_id required" });
      }

      const businessId = String(body?.businessId ?? "").trim();
      const scheduledAtRaw = body?.scheduledAt;
      if (!businessId || !scheduledAtRaw) {
        return reply.code(400).send({ ok: false, error: "businessId and scheduledAt are required" });
      }

      const scheduledAt = new Date(scheduledAtRaw);
      if (isNaN(scheduledAt.getTime())) {
        return reply.code(400).send({ ok: false, error: "Invalid scheduledAt date" });
      }

      const result = await createBooking({
        tenantId: reqTenantId,
        businessId,
        scheduledAt,
        durationMin: body?.durationMin,
        customerName: body?.customerName,
        customerPhone: body?.customerPhone,
        customerEmail: body?.customerEmail,
        service: body?.service,
        notes: body?.notes,
        source: body?.source,
      });

      if (!result.ok) {
        const statusCode = result.error === "SLOT_TAKEN" ? 409 : 500;
        return reply.code(statusCode).send(result);
      }

      return reply.code(201).send(result);
    } catch (err: any) {
      app.log.error({ err }, "Booking creation failed");
      return reply.status(500).send({ ok: false, error: sanitizeError(err) });
    }
  });

  // ── GET /slots — available slots for a date ───────────────────────────
  app.get("/slots", async (req, reply) => {
    try {
      const q = req.query as Record<string, string>;
      const reqTenantId = (req as any).tenantId as string | undefined;
      if (!reqTenantId) {
        return reply.code(400).send({ ok: false, error: "tenant_id required" });
      }

      const businessId = q.businessId;
      const dateRaw = q.date;
      if (!businessId || !dateRaw) {
        return reply.code(400).send({ ok: false, error: "businessId and date are required" });
      }

      const date = new Date(dateRaw);
      if (isNaN(date.getTime())) {
        return reply.code(400).send({ ok: false, error: "Invalid date" });
      }

      const startHour = q.startHour ? parseInt(q.startHour, 10) : 9;
      const endHour = q.endHour ? parseInt(q.endHour, 10) : 17;

      const slots = await getAvailableSlots(reqTenantId, businessId, date, startHour, endHour);

      return reply.send({
        ok: true,
        slots: slots.map(s => s.toISOString()),
        count: slots.length,
        date: dateRaw,
        businessId,
      });
    } catch (err: any) {
      app.log.error({ err }, "Available slots fetch failed");
      return reply.status(500).send({ ok: false, error: sanitizeError(err) });
    }
  });

  // ── POST /book/:id/cancel — cancel a booking ─────────────────────────
  app.post("/book/:id/cancel", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const reqTenantId = (req as any).tenantId as string | undefined;
      if (!reqTenantId) {
        return reply.code(400).send({ ok: false, error: "tenant_id required" });
      }

      const result = await cancelBooking(id, reqTenantId);
      if (!result.ok) {
        return reply.code(404).send(result);
      }
      return reply.send(result);
    } catch (err: any) {
      app.log.error({ err }, "Booking cancellation failed");
      return reply.status(500).send({ ok: false, error: sanitizeError(err) });
    }
  });

  // ── GET /circuit-breaker — external calendar API health ───────────────
  app.get("/circuit-breaker", async (_req, reply) => {
    const status = getCircuitBreakerStatus();
    return reply.send({
      ok: true,
      calendarApi: {
        healthy: !status.isOpen,
        consecutiveFailures: status.failures,
        circuitOpen: status.isOpen,
      },
    });
  });
};
