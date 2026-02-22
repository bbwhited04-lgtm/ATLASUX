/**
 * backend/src/core/engine/brain.guardrails.ts
 *
 * Hard guardrails for LLM usage.
 *
 * Reads your existing .env knobs:
 * - AUTO_SPEND_LIMIT (USD/day)
 * - MAX_ACTIONS_PER_DAY (calls/day)
 *
 * Optional:
 * - CONFIDENCE_AUTO_THRESHOLD
 * - AUDIT_BUCKET
 */

import type { LlmRoute, LlmProvider } from "./brain.registry";

export type DenyReasonCode =
  | "DAILY_BUDGET_EXCEEDED"
  | "DAILY_CALLS_EXCEEDED"
  | "RUN_CALLS_EXCEEDED"
  | "RUN_FAILURES_EXCEEDED"
  | "UNKNOWN_PROVIDER"
  | "UNKNOWN_MODEL"
  | "MODEL_NOT_ALLOWLISTED"
  | "PROVIDER_NOT_ALLOWLISTED"
  | "ROUTE_CAP_EXCEEDED"
  | "RATE_LIMIT_EXCEEDED"
  | "MISSING_COST_ESTIMATE";

export interface RouteCaps {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxCallsPerRun: number;
  temperatureMax: number;
}

export interface GuardrailsConfig {
  enabled: boolean;

  // Global caps
  maxUsdPerDay: number;      // AUTO_SPEND_LIMIT
  maxCallsPerDay: number;    // MAX_ACTIONS_PER_DAY

  // Run caps
  maxRequestsPerRun: number;
  maxFailuresPerRun: number;

  // Runtime
  timeoutMs: number;

  // Deny behavior
  denyIfUnknownProvider: boolean;
  denyIfUnknownModel: boolean;
  denyIfMissingCostEstimate: boolean;
}

/**
 * Route caps (token/call bounds) — keep these conservative.
 */
export const ROUTE_CAPS: Record<LlmRoute, RouteCaps> = {
  ORCHESTRATION_REASONING: {
    maxInputTokens: 12_000,
    maxOutputTokens: 1_400,
    maxCallsPerRun: 40,
    temperatureMax: 0.4,
  },
  LONG_CONTEXT_SUMMARY: {
    maxInputTokens: 40_000,
    maxOutputTokens: 1_800,
    maxCallsPerRun: 12,
    temperatureMax: 0.5,
  },
  DRAFT_GENERATION_FAST: {
    maxInputTokens: 8_000,
    maxOutputTokens: 900,
    maxCallsPerRun: 60,
    temperatureMax: 0.9,
  },
  CLASSIFY_EXTRACT_VALIDATE: {
    maxInputTokens: 6_000,
    maxOutputTokens: 600,
    maxCallsPerRun: 80,
    temperatureMax: 0.1,
  },
  EMERGENCY_FALLBACK_MINIMAL: {
    maxInputTokens: 3_000,
    maxOutputTokens: 400,
    maxCallsPerRun: 15,
    temperatureMax: 0.1,
  },
};

/**
 * Loads guardrails from ENV with safe defaults.
 * NOTE: If AUTO_SPEND_LIMIT/MAX_ACTIONS_PER_DAY are 0 or unset, that means HARD STOP.
 */
export function loadGuardrailsFromEnv(): GuardrailsConfig {
  const maxUsdPerDay = parseFloat(process.env.AUTO_SPEND_LIMIT || "0") || 0;
  const maxCallsPerDay = parseInt(process.env.MAX_ACTIONS_PER_DAY || "0", 10) || 0;

  return {
    enabled: true,
    maxUsdPerDay,
    maxCallsPerDay,
    maxRequestsPerRun: 120,
    maxFailuresPerRun: 25,
    timeoutMs: 30_000,
    denyIfUnknownProvider: true,
    denyIfUnknownModel: true,
    denyIfMissingCostEstimate: false,
  };
}

export interface MeterSnapshot {
  dayKeyUtc: string; // YYYY-MM-DD
  usdSpent: number;
  calls: number;
  runCalls: number;
  runFailures: number;
}

export interface PrecheckArgs {
  route: LlmRoute;
  provider: LlmProvider;
  model: string;
  estInputTokens: number;
  maxOutputTokens: number;
  temperature: number;
  requireCostEstimate: boolean;
  costEstimateUsd: number | null;
  allowProviders: Set<LlmProvider>;
  allowModels: Set<string>;
  caps: Record<LlmRoute, RouteCaps>;
  guard: GuardrailsConfig;
  meters: MeterSnapshot;
}

export interface DenyResult {
  ok: false;
  code: DenyReasonCode;
  message: string;
  details?: Record<string, any>;
}

export interface OkResult {
  ok: true;
}

export type PrecheckResult = OkResult | DenyResult;

/**
 * Pure function: decides whether a call is allowed.
 * (So you can unit-test it easily.)
 */
export function precheckCall(args: PrecheckArgs): PrecheckResult {
  const {
    route,
    provider,
    model,
    estInputTokens,
    maxOutputTokens,
    temperature,
    requireCostEstimate,
    costEstimateUsd,
    allowProviders,
    allowModels,
    caps,
    guard,
    meters,
  } = args;

  if (!guard.enabled) return { ok: true };

  if (guard.denyIfUnknownProvider && !allowProviders.has(provider)) {
    return { ok: false, code: "PROVIDER_NOT_ALLOWLISTED", message: `Provider not allowlisted: ${provider}` };
  }

  if (guard.denyIfUnknownModel && !allowModels.has(model)) {
    return { ok: false, code: "MODEL_NOT_ALLOWLISTED", message: `Model not allowlisted: ${model}` };
  }

  const rc = caps[route];
  if (!rc) {
    return { ok: false, code: "ROUTE_CAP_EXCEEDED", message: `No caps configured for route: ${route}` };
  }

  if (estInputTokens > rc.maxInputTokens) {
    return {
      ok: false,
      code: "ROUTE_CAP_EXCEEDED",
      message: `Input token estimate exceeds cap for ${route}`,
      details: { estInputTokens, cap: rc.maxInputTokens },
    };
  }

  if (maxOutputTokens > rc.maxOutputTokens) {
    return {
      ok: false,
      code: "ROUTE_CAP_EXCEEDED",
      message: `maxOutputTokens exceeds cap for ${route}`,
      details: { maxOutputTokens, cap: rc.maxOutputTokens },
    };
  }

  if (temperature > rc.temperatureMax) {
    return {
      ok: false,
      code: "ROUTE_CAP_EXCEEDED",
      message: `temperature exceeds cap for ${route}`,
      details: { temperature, cap: rc.temperatureMax },
    };
  }

  // Calls/day cap (0 means HARD STOP)
  if (guard.maxCallsPerDay === 0) {
    return {
      ok: false,
      code: "DAILY_CALLS_EXCEEDED",
      message: "MAX_ACTIONS_PER_DAY is 0 (hard stop).",
    };
  }

  if (meters.calls + 1 > guard.maxCallsPerDay) {
    return {
      ok: false,
      code: "DAILY_CALLS_EXCEEDED",
      message: "Daily calls cap exceeded.",
      details: { calls: meters.calls, maxCallsPerDay: guard.maxCallsPerDay },
    };
  }

  // Spend/day cap (0 means HARD STOP)
  if (guard.maxUsdPerDay === 0) {
    return {
      ok: false,
      code: "DAILY_BUDGET_EXCEEDED",
      message: "AUTO_SPEND_LIMIT is 0 (hard stop).",
    };
  }

  if (requireCostEstimate || guard.denyIfMissingCostEstimate) {
    if (costEstimateUsd == null) {
      return {
        ok: false,
        code: "MISSING_COST_ESTIMATE",
        message: "Cost estimate missing and policy requires it.",
      };
    }
  }

  if (costEstimateUsd != null && meters.usdSpent + costEstimateUsd > guard.maxUsdPerDay) {
    return {
      ok: false,
      code: "DAILY_BUDGET_EXCEEDED",
      message: "Daily spend cap would be exceeded.",
      details: { usdSpent: meters.usdSpent, costEstimateUsd, maxUsdPerDay: guard.maxUsdPerDay },
    };
  }

  // Per-run caps
  if (meters.runCalls + 1 > guard.maxRequestsPerRun) {
    return {
      ok: false,
      code: "RUN_CALLS_EXCEEDED",
      message: "Run calls cap exceeded.",
      details: { runCalls: meters.runCalls, maxRequestsPerRun: guard.maxRequestsPerRun },
    };
  }

  if (meters.runCalls + 1 > rc.maxCallsPerRun) {
    return {
      ok: false,
      code: "RUN_CALLS_EXCEEDED",
      message: `Route run calls cap exceeded for ${route}.`,
      details: { runCalls: meters.runCalls, maxCallsPerRun: rc.maxCallsPerRun },
    };
  }

  if (meters.runFailures > guard.maxFailuresPerRun) {
    return {
      ok: false,
      code: "RUN_FAILURES_EXCEEDED",
      message: "Run failures cap exceeded.",
      details: { runFailures: meters.runFailures, maxFailuresPerRun: guard.maxFailuresPerRun },
    };
  }

  return { ok: true };
}
