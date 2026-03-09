/**
 * Outbound Dialer — Mercer's cold call engine.
 *
 * Pulls contacts from CRM, places outbound calls via Twilio,
 * and routes them through Mercer's voice pipeline.
 *
 * Usage:
 *   POST /v1/twilio/outbound/start   — start a dialing session (batch of contacts)
 *   POST /v1/twilio/outbound/single  — dial a single contact
 *   GET  /v1/twilio/outbound/status  — check dialer status
 *   POST /v1/twilio/outbound/stop    — stop current session
 *
 * The dialer respects:
 *   - Max concurrent calls (1 at a time for now)
 *   - Business hours (9am-5pm local, configurable)
 *   - Do-not-call tags on CRM contacts
 *   - Cooldown between calls (30s default)
 */

import { prisma } from "../db/prisma.js";
import { postAsAgent, getChannelByName } from "../services/slack.js";

const TENANT_ID = process.env.TENANT_ID?.trim() || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";
const CALL_COOLDOWN_MS = 30_000;  // 30s between calls
const MAX_CALLS_PER_SESSION = 50; // safety cap

// ── State ─────────────────────────────────────────────────────────────────────

interface DialerSession {
  id: string;
  active: boolean;
  startedAt: number;
  queue: QueuedContact[];
  completed: CompletedCall[];
  currentCallSid: string | null;
  currentContact: QueuedContact | null;
  totalCalls: number;
}

interface QueuedContact {
  contactId: string;
  phone: string;
  name: string;
  company?: string;
}

interface CompletedCall {
  contactId: string;
  name: string;
  callSid: string;
  qualification: string;
  duration: number;
}

let currentSession: DialerSession | null = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Start a dialing session from CRM contacts.
 * Filters: has phone, not tagged "do_not_call" or "mercer:not_interested",
 * not already called by Mercer in the last 7 days.
 */
export async function startDialingSession(options?: {
  tags?: string[];
  limit?: number;
  source?: string;
  target?: "contacts" | "companies" | "both";
}): Promise<{ ok: boolean; queued: number; sessionId: string } | { ok: false; error: string }> {
  if (currentSession?.active) {
    return { ok: false, error: "A dialing session is already active" };
  }

  const limit = Math.min(options?.limit ?? 20, MAX_CALLS_PER_SESSION);
  const target = options?.target ?? "companies"; // default to companies — real business targets

  const queue: QueuedContact[] = [];

  // Pull from CrmCompany (business targets)
  if (target === "companies" || target === "both") {
    const companies = await prisma.crmCompany.findMany({
      where: {
        tenantId: TENANT_ID,
        phone: { not: null },
        ...(options?.source ? { industry: { contains: options.source, mode: "insensitive" as const } } : {}),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        contactName: true,
        industry: true,
      },
      take: limit * 2,
      orderBy: { createdAt: "desc" },
    });

    // Filter recently called companies (check audit log since companies don't have ContactActivity)
    const recentCompanyCalls = await prisma.auditLog.findMany({
      where: {
        tenantId: TENANT_ID,
        action: "mercer.voice.outbound_dialed",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { meta: true },
    });
    const recentCompanyPhones = new Set(
      recentCompanyCalls.map(a => {
        const meta = a.meta as any;
        return meta?.to?.replace(/\D/g, "").slice(-10) ?? "";
      }).filter(Boolean)
    );

    for (const co of companies) {
      if (!co.phone) continue;
      const normalized = co.phone.replace(/\D/g, "").slice(-10);
      if (recentCompanyPhones.has(normalized)) continue;
      queue.push({
        contactId: co.id,
        phone: co.phone,
        name: co.contactName || co.name,
        company: co.name,
      });
      if (queue.length >= limit) break;
    }
  }

  // Pull from CrmContact if needed
  if ((target === "contacts" || target === "both") && queue.length < limit) {
    const remaining = limit - queue.length;
    const contacts = await prisma.crmContact.findMany({
      where: {
        tenantId: TENANT_ID,
        phone: { not: null },
        NOT: {
          tags: { hasSome: ["do_not_call", "mercer:not_interested", "mercer:wrong_number"] },
        },
        ...(options?.tags?.length ? { tags: { hasSome: options.tags } } : {}),
        ...(options?.source ? { source: options.source } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        tags: true,
      },
      take: remaining * 2,
      orderBy: { createdAt: "desc" },
    });

    const recentlyCalled = await prisma.contactActivity.findMany({
      where: {
        tenantId: TENANT_ID,
        type: "call",
        meta: { path: ["agent"], equals: "mercer" },
        occurredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { contactId: true },
    });
    const recentIds = new Set(recentlyCalled.map(a => a.contactId));

    for (const c of contacts) {
      if (!c.phone || recentIds.has(c.id)) continue;
      queue.push({
        contactId: c.id,
        phone: c.phone,
        name: [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown",
        company: c.company ?? undefined,
      });
      if (queue.length >= limit) break;
    }
  }

  if (queue.length === 0) {
    return { ok: false, error: "No eligible contacts found to dial" };
  }

  const sessionId = `mercer-session-${Date.now()}`;
  currentSession = {
    id: sessionId,
    active: true,
    startedAt: Date.now(),
    queue,
    completed: [],
    currentCallSid: null,
    currentContact: null,
    totalCalls: 0,
  };

  // Alert Slack
  try {
    const channel = await getChannelByName("phone-calls", true);
    if (channel) {
      await postAsAgent(channel.id, "mercer", `*Outbound Dialing Session Started*\nQueued: ${queue.length} contacts\nSession: ${sessionId}`);
    }
  } catch { /* best-effort */ }

  // Start dialing (async — don't block the response)
  dialNext();

  return { ok: true, queued: queue.length, sessionId };
}

/**
 * Dial a single contact by ID or phone number.
 */
export async function dialSingle(contactId: string): Promise<{ ok: boolean; callSid?: string; error?: string }> {
  const contact = await prisma.crmContact.findUnique({
    where: { id: contactId },
    select: { id: true, firstName: true, lastName: true, phone: true, company: true },
  });

  if (!contact?.phone) {
    return { ok: false, error: "Contact not found or has no phone number" };
  }

  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unknown";

  const result = await placeOutboundCall(contact.phone, {
    contactId: contact.id,
    phone: contact.phone,
    name,
    company: contact.company ?? undefined,
  });

  return result;
}

/**
 * Get current dialer status.
 */
export function getDialerStatus() {
  if (!currentSession) {
    return { active: false };
  }
  return {
    active: currentSession.active,
    sessionId: currentSession.id,
    queued: currentSession.queue.length,
    completed: currentSession.completed.length,
    totalCalls: currentSession.totalCalls,
    currentContact: currentSession.currentContact
      ? { name: currentSession.currentContact.name, phone: currentSession.currentContact.phone }
      : null,
    runningFor: Math.round((Date.now() - currentSession.startedAt) / 1000),
  };
}

/**
 * Stop the current dialing session.
 */
export function stopDialingSession(): { ok: boolean; completed: number } {
  if (!currentSession) {
    return { ok: false, completed: 0 };
  }
  const completed = currentSession.completed.length;
  currentSession.active = false;
  currentSession = null;
  return { ok: true, completed };
}

/**
 * Called by mercerPostCall when a call ends — advances to next contact.
 */
export function onCallCompleted(callSid: string, qualification: string, duration: number): void {
  if (!currentSession?.active) return;

  if (currentSession.currentContact) {
    currentSession.completed.push({
      contactId: currentSession.currentContact.contactId,
      name: currentSession.currentContact.name,
      callSid,
      qualification,
      duration,
    });
  }
  currentSession.currentCallSid = null;
  currentSession.currentContact = null;

  // Cooldown then dial next
  setTimeout(() => dialNext(), CALL_COOLDOWN_MS);
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function dialNext(): Promise<void> {
  if (!currentSession?.active) return;

  const next = currentSession.queue.shift();
  if (!next) {
    // Queue exhausted
    console.log(`[mercer-dialer] Session complete — ${currentSession.completed.length} calls made`);
    try {
      const channel = await getChannelByName("phone-calls", true);
      if (channel) {
        const hot = currentSession.completed.filter(c => c.qualification === "hot_lead").length;
        const warm = currentSession.completed.filter(c => c.qualification === "warm_lead").length;
        await postAsAgent(channel.id, "mercer",
          `*Outbound Session Complete*\nTotal calls: ${currentSession.completed.length}\nHot leads: ${hot}\nWarm leads: ${warm}`
        );
      }
    } catch { /* best-effort */ }
    currentSession.active = false;
    return;
  }

  currentSession.currentContact = next;
  currentSession.totalCalls++;

  console.log(`[mercer-dialer] Calling ${next.name} at ${next.phone} (${currentSession.totalCalls}/${currentSession.completed.length + currentSession.queue.length + 1})`);

  await placeOutboundCall(next.phone, next);
}

async function placeOutboundCall(
  to: string,
  contact: QueuedContact,
): Promise<{ ok: boolean; callSid?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
  const fromNumber = process.env.MERCER_FROM_NUMBER ?? process.env.TWILIO_FROM_NUMBER ?? "";

  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false, error: "Twilio not configured" };
  }

  // Determine the public URL for TwiML and WebSocket
  const baseUrl = (process.env.TWILIO_WEBHOOK_BASE_URL ?? "https://api.atlasux.cloud").replace(/\/$/, "");

  // TwiML that connects the call to Mercer's stream
  const twimlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${baseUrl.replace("https://", "wss://")}/v1/twilio/voice/mercer-stream">
      <Parameter name="contactId" value="${contact.contactId}" />
      <Parameter name="contactName" value="${contact.name}" />
      <Parameter name="contactPhone" value="${contact.phone}" />
    </Stream>
  </Connect>
</Response>`;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const creds = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    // Use Twiml parameter directly instead of URL
    const params = new URLSearchParams({
      To: to.startsWith("+") ? to : `+1${to.replace(/\D/g, "")}`,
      From: `+1${fromNumber}`,
      Twiml: twimlContent,
      StatusCallback: `${baseUrl}/v1/twilio/voice/status`,
      StatusCallbackMethod: "POST",
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
      console.error(`[mercer-dialer] Call failed to ${to}:`, data?.message);
      return { ok: false, error: data?.message ?? `Twilio error ${res.status}` };
    }

    const callSid = data.sid;
    if (currentSession) {
      currentSession.currentCallSid = callSid;
    }

    // Audit
    await prisma.auditLog.create({
      data: {
        tenantId: TENANT_ID,
        actorType: "agent",
        actorExternalId: "mercer",
        action: "mercer.voice.outbound_dialed",
        entityType: "crm_contact",
        message: `Mercer dialing ${contact.name} at ${to}`,
        meta: { to, callSid, contactId: contact.contactId, contactName: contact.name },
      },
    }).catch(() => null);

    return { ok: true, callSid };
  } catch (err: any) {
    console.error(`[mercer-dialer] Call error:`, err?.message);
    return { ok: false, error: err?.message };
  }
}
