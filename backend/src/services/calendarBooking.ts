/**
 * calendarBooking.ts — Advisory-lock-guarded booking service.
 *
 * Prevents double-booking via PostgreSQL advisory locks:
 *   1. Hash business_id + time-slot into a bigint lock key
 *   2. Acquire pg_advisory_xact_lock inside a transaction
 *   3. Check for existing booking at that slot
 *   4. Create only if free
 *   5. Lock releases automatically when the transaction ends
 *
 * Also provides a circuit-breaker for external calendar API (Google/Outlook)
 * sync — if the API is down, the booking is still created locally and flagged
 * for deferred sync.
 */

import { prisma } from "../db/prisma.js";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";

// ── Types ────────────────────────────────────────────────────────────────────

export interface BookingRequest {
  tenantId: string;
  businessId: string;
  scheduledAt: Date;
  durationMin?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  service?: string;
  notes?: string;
  source?: string;
}

export interface BookingResult {
  ok: boolean;
  booking?: {
    id: string;
    scheduledAt: Date;
    durationMin: number;
    status: string;
    calendarSynced: boolean;
  };
  error?: string;
  /** When calendar sync fails, Lucy should say this instead of stalling */
  calendarFallbackMessage?: string;
}

// ── Slot granularity (15-min slots) ──────────────────────────────────────────

const SLOT_GRANULARITY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Truncate a timestamp to the nearest 15-minute slot boundary.
 * e.g., 10:07 -> 10:00, 10:16 -> 10:15
 */
function truncateToSlot(dt: Date): Date {
  const ms = dt.getTime();
  return new Date(ms - (ms % SLOT_GRANULARITY_MS));
}

/**
 * Generate a stable bigint lock key from business_id + slot time.
 * Uses first 8 bytes of SHA-256 hash, interpreted as a signed int64.
 */
function advisoryLockKey(businessId: string, slotTime: Date): bigint {
  const input = `${businessId}:${slotTime.toISOString()}`;
  const hash = createHash("sha256").update(input).digest();
  // Read first 8 bytes as a signed BigInt64 (PostgreSQL advisory lock takes bigint)
  const buf = Buffer.from(hash.subarray(0, 8));
  return buf.readBigInt64BE(0);
}

// ── Circuit Breaker for external calendar API ────────────────────────────────

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const CIRCUIT_BREAKER_THRESHOLD = 3;      // Open after 3 consecutive failures
const CIRCUIT_BREAKER_RESET_MS = 60_000;  // Try again after 60 seconds

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

function isCircuitOpen(): boolean {
  if (!circuitBreaker.isOpen) return false;
  // Check if enough time has passed for a retry (half-open)
  if (Date.now() - circuitBreaker.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
    return false; // Allow a probe request
  }
  return true;
}

function recordCalendarSuccess(): void {
  circuitBreaker.failures = 0;
  circuitBreaker.isOpen = false;
}

function recordCalendarFailure(): void {
  circuitBreaker.failures += 1;
  circuitBreaker.lastFailure = Date.now();
  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true;
  }
}

export function getCircuitBreakerStatus(): { isOpen: boolean; failures: number } {
  return {
    isOpen: isCircuitOpen(),
    failures: circuitBreaker.failures,
  };
}

// ── External Calendar Sync (Google/Outlook) ──────────────────────────────────

/**
 * Attempt to create a calendar event on the external provider.
 * Returns the external event ID on success, or null on failure.
 * Respects the circuit breaker — returns null immediately if circuit is open.
 */
async function syncToExternalCalendar(
  tenantId: string,
  booking: { scheduledAt: Date; durationMin: number; customerName?: string; service?: string },
): Promise<string | null> {
  if (isCircuitOpen()) {
    return null; // Circuit open — skip external API call
  }

  try {
    // Attempt M365 Graph API calendar event creation
    const msClientId = process.env.MS_CLIENT_ID ?? "";
    const msClientSecret = process.env.MS_CLIENT_SECRET ?? "";
    const msTenantId = process.env.MS_TENANT_ID ?? "";

    if (!msClientId || !msClientSecret || !msTenantId) {
      return null; // M365 not configured — local-only booking
    }

    // Get an app token
    const tokenParams = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: msClientId,
      client_secret: msClientSecret,
      scope: "https://graph.microsoft.com/.default",
    });

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${msTenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
        signal: AbortSignal.timeout(5000), // 5s timeout to avoid stalling
      },
    );

    if (!tokenRes.ok) {
      recordCalendarFailure();
      return null;
    }

    const tokenData = (await tokenRes.json()) as any;
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      recordCalendarFailure();
      return null;
    }

    // Resolve the calendar mailbox for this tenant
    const mailbox = process.env.CALENDAR_MAILBOX ?? "atlas.ceo@deadapp.info";

    const endTime = new Date(booking.scheduledAt.getTime() + booking.durationMin * 60_000);
    const eventBody = {
      subject: `${booking.service ?? "Appointment"} — ${booking.customerName ?? "Customer"}`,
      start: { dateTime: booking.scheduledAt.toISOString(), timeZone: "UTC" },
      end: { dateTime: endTime.toISOString(), timeZone: "UTC" },
      isReminderOn: true,
      reminderMinutesBeforeStart: 15,
    };

    const eventRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${mailbox}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
        signal: AbortSignal.timeout(8000), // 8s timeout
      },
    );

    if (!eventRes.ok) {
      recordCalendarFailure();
      return null;
    }

    const eventData = (await eventRes.json()) as any;
    recordCalendarSuccess();
    return eventData.id ?? null;
  } catch {
    recordCalendarFailure();
    return null;
  }
}

// ── Core Booking Function ────────────────────────────────────────────────────

/**
 * Book an appointment slot using PostgreSQL advisory locks to prevent
 * double-booking under concurrency.
 *
 * The advisory lock is scoped to (business_id, slot_time) and held for
 * the duration of the transaction only — no persistent lock table needed.
 */
export async function createBooking(req: BookingRequest): Promise<BookingResult> {
  const slotTime = truncateToSlot(req.scheduledAt);
  const lockKey = advisoryLockKey(req.businessId, slotTime);
  const durationMin = req.durationMin ?? 30;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Acquire advisory lock — blocks concurrent bookings for same slot
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

      // 2. Check for existing booking at this slot
      const existing = await tx.calendarBooking.findFirst({
        where: {
          businessId: req.businessId,
          scheduledAt: slotTime,
          status: { in: ["confirmed", "completed"] },
        },
      });

      if (existing) {
        return {
          ok: false as const,
          error: "SLOT_TAKEN",
        };
      }

      // 3. Create the booking
      const booking = await tx.calendarBooking.create({
        data: {
          tenantId: req.tenantId,
          businessId: req.businessId,
          scheduledAt: slotTime,
          durationMin,
          customerName: req.customerName ?? null,
          customerPhone: req.customerPhone ?? null,
          customerEmail: req.customerEmail ?? null,
          service: req.service ?? null,
          notes: req.notes ?? null,
          source: req.source ?? "lucy_voice",
          status: "confirmed",
          calendarSynced: false,
        },
      });

      return {
        ok: true as const,
        booking,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10_000,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const booking = result.booking;

    // 4. External calendar sync (outside the transaction — non-blocking)
    let calendarSynced = false;
    let externalEventId: string | null = null;
    let calendarFallbackMessage: string | undefined;

    try {
      externalEventId = await syncToExternalCalendar(req.tenantId, {
        scheduledAt: slotTime,
        durationMin,
        customerName: req.customerName,
        service: req.service,
      });

      if (externalEventId) {
        calendarSynced = true;
        await prisma.calendarBooking.update({
          where: { id: booking.id },
          data: { calendarSynced: true, externalEventId },
        });
      } else {
        calendarFallbackMessage =
          "I've got you booked in our system. Our team will send you a calendar confirmation shortly — " +
          "I'll have someone call you back to confirm the time if needed.";
      }
    } catch {
      calendarFallbackMessage =
        "I've got you booked in our system. Our team will send you a calendar confirmation shortly — " +
        "I'll have someone call you back to confirm the time if needed.";
    }

    // 5. Audit trail
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenantId,
        actorType: "agent",
        actorExternalId: "lucy",
        level: "info",
        action: "calendar.booking.created",
        entityType: "calendar_booking",
        entityId: booking.id,
        message: `Booking created: ${req.customerName ?? "Customer"} at ${slotTime.toISOString()} (${durationMin}min)`,
        meta: {
          bookingId: booking.id,
          businessId: req.businessId,
          scheduledAt: slotTime.toISOString(),
          durationMin,
          service: req.service,
          source: req.source,
          calendarSynced,
          externalEventId,
        },
        timestamp: new Date(),
      },
    }).catch(() => null); // Audit is best-effort

    return {
      ok: true,
      booking: {
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        durationMin: booking.durationMin,
        status: booking.status,
        calendarSynced,
      },
      calendarFallbackMessage,
    };
  } catch (err: any) {
    // Handle unique constraint violation (belt-and-suspenders with the advisory lock)
    if (err?.code === "P2002") {
      return { ok: false, error: "SLOT_TAKEN" };
    }
    throw err;
  }
}

// ── Slot Availability Check ──────────────────────────────────────────────────

/**
 * Check available slots for a business on a given date.
 * Returns open 15-minute slots within the business hours window.
 */
export async function getAvailableSlots(
  tenantId: string,
  businessId: string,
  date: Date,
  startHour = 9,
  endHour = 17,
): Promise<Date[]> {
  const dayStart = new Date(date);
  dayStart.setHours(startHour, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, 0, 0, 0);

  // Get existing bookings for the day
  const booked = await prisma.calendarBooking.findMany({
    where: {
      tenantId,
      businessId,
      scheduledAt: { gte: dayStart, lt: dayEnd },
      status: { in: ["confirmed", "completed"] },
    },
    select: { scheduledAt: true, durationMin: true },
  });

  // Build set of occupied slot times
  const occupiedSlots = new Set<number>();
  for (const b of booked) {
    const start = b.scheduledAt.getTime();
    const slotsOccupied = Math.ceil(b.durationMin / 15);
    for (let i = 0; i < slotsOccupied; i++) {
      occupiedSlots.add(start + i * SLOT_GRANULARITY_MS);
    }
  }

  // Generate all possible slots and filter out occupied ones
  const available: Date[] = [];
  let cursor = dayStart.getTime();
  while (cursor < dayEnd.getTime()) {
    if (!occupiedSlots.has(cursor)) {
      available.push(new Date(cursor));
    }
    cursor += SLOT_GRANULARITY_MS;
  }

  return available;
}

// ── Cancel Booking ───────────────────────────────────────────────────────────

export async function cancelBooking(
  bookingId: string,
  tenantId: string,
): Promise<{ ok: boolean; error?: string }> {
  const booking = await prisma.calendarBooking.findFirst({
    where: { id: bookingId, tenantId },
  });

  if (!booking) return { ok: false, error: "BOOKING_NOT_FOUND" };
  if (booking.status === "cancelled") return { ok: false, error: "ALREADY_CANCELLED" };

  await prisma.calendarBooking.update({
    where: { id: bookingId },
    data: { status: "cancelled" },
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      actorType: "agent",
      actorExternalId: "lucy",
      level: "info",
      action: "calendar.booking.cancelled",
      entityType: "calendar_booking",
      entityId: bookingId,
      message: `Booking cancelled: ${booking.customerName ?? "Customer"} at ${booking.scheduledAt.toISOString()}`,
      meta: { bookingId, businessId: booking.businessId },
      timestamp: new Date(),
    },
  }).catch(() => null);

  return { ok: true };
}
