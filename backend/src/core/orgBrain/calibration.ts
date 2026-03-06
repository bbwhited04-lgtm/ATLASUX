/**
 * Agent Confidence Calibration — auto-adjusts agent confidence from outcome data.
 *
 * Uses DecisionOutcome history to calculate how often an agent's decisions
 * lead to positive results, then stores a calibration score in system_state.
 * When an agent creates a new decision memo, its confidence is adjusted
 * based on its track record.
 *
 * Zero LLM cost — pure math on existing DB data.
 */

import { prisma } from "../../db/prisma.js";
import { getSystemState, setSystemState } from "../../services/systemState.js";

const LOOKBACK_DAYS = 90;
const MIN_OUTCOMES = 3; // Need at least 3 outcomes to calibrate
const STATE_KEY_PREFIX = "org-brain:calibration:";

export type CalibrationScore = {
  agentId: string;
  positiveRate: number;     // 0.0–1.0
  totalOutcomes: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  mixedCount: number;
  calibratedAt: string;     // ISO timestamp
  /** Multiplier applied to agent's self-reported confidence. */
  modifier: number;
};

/**
 * Calculate and store calibration for an agent based on their decision outcomes.
 */
export async function calibrateAgentConfidence(params: {
  tenantId: string;
  agentId: string;
}): Promise<CalibrationScore> {
  const { tenantId, agentId } = params;
  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);

  // Query all outcomes for decisions made by this agent
  const outcomes = await prisma.decisionOutcome.findMany({
    where: {
      tenantId,
      detectedAt: { gte: cutoff },
      decision: { agent: agentId },
    },
    select: { outcome: true },
  });

  const positiveCount = outcomes.filter(o => o.outcome === "positive").length;
  const negativeCount = outcomes.filter(o => o.outcome === "negative").length;
  const neutralCount = outcomes.filter(o => o.outcome === "neutral").length;
  const mixedCount = outcomes.filter(o => o.outcome === "mixed").length;
  const totalOutcomes = outcomes.length;

  // Calculate positive rate (positive + half of mixed, out of non-neutral total)
  const scoreable = positiveCount + negativeCount + mixedCount;
  const positiveRate = scoreable > 0
    ? (positiveCount + mixedCount * 0.5) / scoreable
    : 0.5; // default to neutral when no scoreable outcomes

  // Calculate confidence modifier:
  // - 1.0 = no adjustment (baseline or insufficient data)
  // - >1.0 = agent tends to be under-confident (boost)
  // - <1.0 = agent tends to be over-confident (dampen)
  let modifier = 1.0;
  if (totalOutcomes >= MIN_OUTCOMES) {
    // Map positiveRate to a modifier range of 0.7–1.3
    // 50% positive → 1.0, 100% → 1.3, 0% → 0.7
    modifier = 0.7 + (positiveRate * 0.6);
    // Clamp to [0.7, 1.3]
    modifier = Math.min(1.3, Math.max(0.7, modifier));
  }

  const score: CalibrationScore = {
    agentId,
    positiveRate: Math.round(positiveRate * 1000) / 1000,
    totalOutcomes,
    positiveCount,
    negativeCount,
    neutralCount,
    mixedCount,
    calibratedAt: new Date().toISOString(),
    modifier: Math.round(modifier * 1000) / 1000,
  };

  // Persist to system_state
  await setSystemState(`${STATE_KEY_PREFIX}${agentId}`, score);

  return score;
}

/**
 * Look up an agent's current calibration score (from system_state cache).
 * Returns null if not yet calibrated or insufficient data.
 */
export async function getAgentCalibration(agentId: string): Promise<CalibrationScore | null> {
  try {
    const state = await getSystemState(`${STATE_KEY_PREFIX}${agentId}`);
    const val = state?.value as any;
    if (!val || typeof val !== "object" || !val.agentId) return null;
    if (val.totalOutcomes < MIN_OUTCOMES) return null;
    return val as CalibrationScore;
  } catch {
    return null;
  }
}

/**
 * Apply calibration to an agent's self-reported confidence.
 * Returns the adjusted confidence value (clamped to 0.0–1.0).
 */
export function applyCalibration(rawConfidence: number, calibration: CalibrationScore | null): number {
  if (!calibration) return rawConfidence;
  const adjusted = rawConfidence * calibration.modifier;
  return Math.min(1.0, Math.max(0.0, Math.round(adjusted * 1000) / 1000));
}

/**
 * Calibrate all agents that have outcomes in the last 90 days.
 * Intended to be called periodically (e.g., weekly via scheduler).
 */
export async function calibrateAllAgents(tenantId: string): Promise<CalibrationScore[]> {
  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);

  // Find all agents that have decision outcomes
  const agents = await prisma.decisionOutcome.findMany({
    where: { tenantId, detectedAt: { gte: cutoff } },
    select: { decision: { select: { agent: true } } },
    distinct: ["decisionId"],
  });

  const agentIds = [...new Set(agents.map(a => a.decision.agent))];
  const scores: CalibrationScore[] = [];

  for (const agentId of agentIds) {
    const score = await calibrateAgentConfidence({ tenantId, agentId });
    scores.push(score);
  }

  return scores;
}
