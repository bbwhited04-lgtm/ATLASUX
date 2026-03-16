/**
 * Call Cost Tracker — per-call cost telemetry for voice pipeline.
 *
 * Tracks costs per provider call (STT, LLM, TTS, telephony) and writes
 * a summary row to call_costs at end of each call.
 *
 * Rate estimates:
 *   STT:       $0.006  / minute
 *   LLM:       $0.003  / 1k tokens
 *   TTS:       $0.015  / 1k characters
 *   Telephony: $0.0085 / minute
 */

import { prisma } from "../db/prisma.js";

// ── Cost rates ───────────────────────────────────────────────────────────────

const RATES = {
  /** STT cost per minute */
  STT_PER_MIN: 0.006,
  /** LLM cost per 1k tokens */
  LLM_PER_1K_TOKENS: 0.003,
  /** TTS cost per 1k characters */
  TTS_PER_1K_CHARS: 0.015,
  /** Telephony (Twilio carrier) cost per minute */
  TELEPHONY_PER_MIN: 0.0085,
} as const;

// ── Per-call accumulator ─────────────────────────────────────────────────────

interface CallCostAccumulator {
  tenantId: string;
  callSid: string;
  direction: "inbound" | "outbound";
  startedAt: number;
  sttMinutes: number;
  llmTokens: number;
  ttsChars: number;
  telephonyMinutes: number;
}

const activeAccumulators = new Map<string, CallCostAccumulator>();

/**
 * Start tracking costs for a call.
 */
export function startCostTracking(
  callSid: string,
  tenantId: string,
  direction: "inbound" | "outbound",
): void {
  activeAccumulators.set(callSid, {
    tenantId,
    callSid,
    direction,
    startedAt: Date.now(),
    sttMinutes: 0,
    llmTokens: 0,
    ttsChars: 0,
    telephonyMinutes: 0,
  });
}

/**
 * Record STT usage for a call (in seconds of audio processed).
 */
export function recordSTTUsage(callSid: string, durationSec: number): void {
  const acc = activeAccumulators.get(callSid);
  if (acc) acc.sttMinutes += durationSec / 60;
}

/**
 * Record LLM usage for a call (in tokens).
 */
export function recordLLMUsage(callSid: string, tokens: number): void {
  const acc = activeAccumulators.get(callSid);
  if (acc) acc.llmTokens += tokens;
}

/**
 * Record TTS usage for a call (in characters synthesized).
 */
export function recordTTSUsage(callSid: string, chars: number): void {
  const acc = activeAccumulators.get(callSid);
  if (acc) acc.ttsChars += chars;
}

/**
 * Finalize and persist the cost record for a completed call.
 * Telephony duration is derived from wall-clock elapsed time.
 */
export async function finalizeCostRecord(callSid: string): Promise<void> {
  const acc = activeAccumulators.get(callSid);
  if (!acc) return;

  activeAccumulators.delete(callSid);

  const elapsedSec = Math.round((Date.now() - acc.startedAt) / 1000);
  const elapsedMin = elapsedSec / 60;

  // If no STT minutes were explicitly recorded, estimate from call duration
  const sttMin = acc.sttMinutes > 0 ? acc.sttMinutes : elapsedMin;
  const telephonyMin = elapsedMin;

  const sttCost = sttMin * RATES.STT_PER_MIN;
  const llmCost = (acc.llmTokens / 1000) * RATES.LLM_PER_1K_TOKENS;
  const ttsCost = (acc.ttsChars / 1000) * RATES.TTS_PER_1K_CHARS;
  const telephonyCost = telephonyMin * RATES.TELEPHONY_PER_MIN;
  const totalCost = sttCost + llmCost + ttsCost + telephonyCost;

  try {
    await prisma.callCost.create({
      data: {
        tenantId: acc.tenantId,
        callSid: acc.callSid,
        direction: acc.direction,
        durationSec: elapsedSec,
        sttCost: parseFloat(sttCost.toFixed(6)),
        llmCost: parseFloat(llmCost.toFixed(6)),
        ttsCost: parseFloat(ttsCost.toFixed(6)),
        telephonyCost: parseFloat(telephonyCost.toFixed(6)),
        totalCost: parseFloat(totalCost.toFixed(6)),
      },
    });
  } catch (err: any) {
    console.error("[call-cost-tracker] Failed to persist cost record:", err?.message);
  }
}

// ── Query helpers ────────────────────────────────────────────────────────────

export interface MonthlyCostSummary {
  totalCalls: number;
  totalCost: number;
  avgCostPerCall: number;
  sttCost: number;
  llmCost: number;
  ttsCost: number;
  telephonyCost: number;
  projectedMonthlyCost: number;
}

/**
 * Get aggregated call costs for a tenant in the current calendar month.
 */
export async function getMonthlyCallCosts(tenantId: string): Promise<MonthlyCostSummary> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await prisma.callCost.findMany({
    where: {
      tenantId,
      createdAt: { gte: monthStart },
    },
    select: {
      totalCost: true,
      sttCost: true,
      llmCost: true,
      ttsCost: true,
      telephonyCost: true,
    },
  });

  const totalCalls = rows.length;
  const sttCost = rows.reduce((s, r) => s + Number(r.sttCost), 0);
  const llmCost = rows.reduce((s, r) => s + Number(r.llmCost), 0);
  const ttsCost = rows.reduce((s, r) => s + Number(r.ttsCost), 0);
  const telephonyCost = rows.reduce((s, r) => s + Number(r.telephonyCost), 0);
  const totalCost = rows.reduce((s, r) => s + Number(r.totalCost), 0);
  const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

  // Project monthly cost based on days elapsed
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedMonthlyCost = dayOfMonth > 0
    ? (totalCost / dayOfMonth) * daysInMonth
    : 0;

  return {
    totalCalls,
    totalCost,
    avgCostPerCall,
    sttCost,
    llmCost,
    ttsCost,
    telephonyCost,
    projectedMonthlyCost,
  };
}

// ── Circuit breaker ──────────────────────────────────────────────────────────

/** Monthly revenue by subscription tier */
const TIER_REVENUE: Record<string, number> = {
  standard: 39,
  team: 99,
  enterprise: 149,
};

/**
 * Check if a tenant has exceeded the cost safety threshold.
 * Returns true if calls should proceed, false if voicemail-only mode
 * should be activated (projected cost > 1.2x monthly revenue).
 */
export async function checkCircuitBreaker(
  tenantId: string,
  subscriptionTier?: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const tier = (subscriptionTier ?? "standard").toLowerCase();
  const monthlyRevenue = TIER_REVENUE[tier] ?? TIER_REVENUE.standard;
  const costThreshold = monthlyRevenue * 1.2;

  const costs = await getMonthlyCallCosts(tenantId);

  if (costs.projectedMonthlyCost > costThreshold) {
    const reason = `Projected monthly call cost $${costs.projectedMonthlyCost.toFixed(2)} exceeds 1.2x revenue threshold $${costThreshold.toFixed(2)} (tier: ${tier})`;

    console.warn(`[circuit-breaker] ${reason}`);

    // Create audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorType: "system",
          actorExternalId: "circuit-breaker",
          level: "warn",
          action: "voice.circuit_breaker.tripped",
          entityType: "tenant",
          message: reason,
          meta: {
            projectedCost: costs.projectedMonthlyCost,
            costThreshold,
            monthlyRevenue,
            tier,
            totalCalls: costs.totalCalls,
            totalCostSoFar: costs.totalCost,
          },
          timestamp: new Date(),
        },
      });
    } catch { /* audit is best-effort */ }

    return { allowed: false, reason };
  }

  return { allowed: true };
}
