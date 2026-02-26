/**
 * Usage metering — increment counters per user/tenant/period.
 *
 * All methods are fire-and-forget (non-blocking).
 * Period format: "2026-02" (YYYY-MM).
 */

import { prisma } from "../db/prisma.js";

function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Upsert usage meter row and increment the specified field.
 */
async function increment(
  userId: string,
  tenantId: string,
  field: "tokensUsed" | "apiCalls" | "jobsCreated" | "storageBytes",
  amount: number,
): Promise<void> {
  const period = currentPeriod();
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO usage_meters (id, user_id, tenant_id, period, ${snakeCase(field)}, updated_at)
       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, now())
       ON CONFLICT (user_id, tenant_id, period)
       DO UPDATE SET ${snakeCase(field)} = usage_meters.${snakeCase(field)} + $4,
                     updated_at = now()`,
      userId,
      tenantId,
      period,
      amount,
    );
  } catch {
    // Non-fatal — metering should never block requests
  }
}

function snakeCase(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Track token consumption (LLM calls) */
export function meterTokens(userId: string, tenantId: string, tokens: number) {
  increment(userId, tenantId, "tokensUsed", tokens).catch(() => null);
}

/** Track API call */
export function meterApiCall(userId: string, tenantId: string) {
  increment(userId, tenantId, "apiCalls", 1).catch(() => null);
}

/** Track job creation */
export function meterJobCreated(userId: string, tenantId: string) {
  increment(userId, tenantId, "jobsCreated", 1).catch(() => null);
}

/** Track storage usage change (delta in bytes, can be negative for deletes) */
export function meterStorage(userId: string, tenantId: string, bytes: number) {
  increment(userId, tenantId, "storageBytes", bytes).catch(() => null);
}

/** Get current period usage for a user in a tenant */
export async function getUsage(userId: string, tenantId: string) {
  const period = currentPeriod();
  try {
    const meter = await prisma.usageMeter.findUnique({
      where: { userId_tenantId_period: { userId, tenantId, period } },
    });
    return {
      period,
      tokensUsed: Number(meter?.tokensUsed ?? 0),
      apiCalls: meter?.apiCalls ?? 0,
      jobsCreated: meter?.jobsCreated ?? 0,
      storageBytes: Number(meter?.storageBytes ?? 0),
    };
  } catch {
    return { period, tokensUsed: 0, apiCalls: 0, jobsCreated: 0, storageBytes: 0 };
  }
}

/** Get usage history for a user (last N months) */
export async function getUsageHistory(userId: string, tenantId: string, months = 6) {
  try {
    const meters = await prisma.usageMeter.findMany({
      where: { userId, tenantId },
      orderBy: { period: "desc" },
      take: months,
    });
    return meters.map((m) => ({
      period: m.period,
      tokensUsed: Number(m.tokensUsed),
      apiCalls: m.apiCalls,
      jobsCreated: m.jobsCreated,
      storageBytes: Number(m.storageBytes),
    }));
  } catch {
    return [];
  }
}
