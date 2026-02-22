/**
 * backend/src/core/engine/brain.registry.ts
 *
 * Static (versionable) registry describing:
 * - Allowed providers/models
 * - Route -> ordered provider/model plans
 *
 * This file is intentionally DATA-ONLY so you can diff/lock it.
 */

export type LlmRoute =
  | "ORCHESTRATION_REASONING"
  | "LONG_CONTEXT_SUMMARY"
  | "DRAFT_GENERATION_FAST"
  | "CLASSIFY_EXTRACT_VALIDATE"
  | "EMERGENCY_FALLBACK_MINIMAL";

export type LlmProvider =
  | "vercel_ai_gateway"
  | "google_gemini"
  | "openai"
  | "deepseek"
  | "openrouter"
  | "cerebras"
  | "cloudflare_workers_ai";

export interface RoutePlanItem {
  provider: LlmProvider;
  /**
   * Model identifier.
   *
   * Notes:
   * - For OpenAI-compatible endpoints, this is passed as `model`.
   * - For Gemini direct, this is passed in the URL as `models/<model>:generateContent`.
   * - For Cloudflare Workers AI, this is the `model` segment in `/ai/run/<model>`.
   */
  model: string;
  params: {
    temperature: number;
    maxOutputTokens: number;
  };
  notes?: string;
}

/**
 * Tight allowlist to prevent surprise model usage.
 * Add deliberately as you enable new providers/models.
 */
export const ALLOWLIST: {
  providers: ReadonlyArray<LlmProvider>;
  models: ReadonlyArray<string>;
} = {
  providers: [
    "vercel_ai_gateway",
    "google_gemini",
    "openai",
    "deepseek",
    "openrouter",
    "cerebras",
    "cloudflare_workers_ai",
  ],
  models: [
    // Gemini
    "google/gemini-2.0-flash",
    "google/gemini-1.5-pro",

    // OpenAI (examples; keep only what you actually use)
    "gpt-4o-mini",
    "gpt-4.1-mini",

    // DeepSeek (OpenAI-compatible)
    "deepseek-chat",
    "deepseek-reasoner",

    // OpenRouter
    "openrouter/auto",
    "openrouter/free",

    // Cerebras (OpenAI-compatible naming varies; keep stable alias you use)
    "cerebras/llama",

    // Cloudflare Workers AI (placeholder; set to your chosen model)
    "cf/meta/llama",
  ],
};

/**
 * Route plans (priority order).
 *
 * Your orchestrator should always choose from these plans.
 * If a provider fails, move to the next one.
 */
export const ROUTES: Record<LlmRoute, ReadonlyArray<RoutePlanItem>> = {
  ORCHESTRATION_REASONING: [
    {
      provider: "vercel_ai_gateway",
      model: "google/gemini-2.0-flash",
      params: { temperature: 0.2, maxOutputTokens: 1200 },
      notes: "Default orchestrator brain: fast + stable."
    },
    {
      provider: "vercel_ai_gateway",
      model: "google/gemini-1.5-pro",
      params: { temperature: 0.25, maxOutputTokens: 1600 },
      notes: "Higher quality fallback for harder reasoning."
    },
    {
      provider: "openrouter",
      model: "openrouter/auto",
      params: { temperature: 0.25, maxOutputTokens: 1400 },
      notes: "Insurance router if Google is down/limited."
    },
    {
      provider: "cerebras",
      model: "cerebras/llama",
      params: { temperature: 0.25, maxOutputTokens: 1200 },
      notes: "Fast backup lane (once enabled)."
    }
  ],

  LONG_CONTEXT_SUMMARY: [
    {
      provider: "vercel_ai_gateway",
      model: "google/gemini-1.5-pro",
      params: { temperature: 0.3, maxOutputTokens: 1600 },
      notes: "Long-thread summaries + packaging."
    },
    {
      provider: "openrouter",
      model: "openrouter/auto",
      params: { temperature: 0.3, maxOutputTokens: 1600 }
    }
  ],

  DRAFT_GENERATION_FAST: [
    {
      provider: "cerebras",
      model: "cerebras/llama",
      params: { temperature: 0.7, maxOutputTokens: 900 },
      notes: "Speed lane for content drafts."
    },
    {
      provider: "vercel_ai_gateway",
      model: "google/gemini-2.0-flash",
      params: { temperature: 0.7, maxOutputTokens: 900 }
    },
    {
      provider: "openrouter",
      model: "openrouter/auto",
      params: { temperature: 0.7, maxOutputTokens: 900 }
    }
  ],

  CLASSIFY_EXTRACT_VALIDATE: [
    {
      provider: "vercel_ai_gateway",
      model: "google/gemini-2.0-flash",
      params: { temperature: 0.0, maxOutputTokens: 600 },
      notes: "Extraction, schema validation, routing."
    },
    {
      provider: "cloudflare_workers_ai",
      model: "cf/meta/llama",
      params: { temperature: 0.0, maxOutputTokens: 600 }
    }
  ],

  EMERGENCY_FALLBACK_MINIMAL: [
    {
      provider: "cloudflare_workers_ai",
      model: "cf/meta/llama",
      params: { temperature: 0.0, maxOutputTokens: 400 },
      notes: "Minimal safe fallback."
    },
    {
      provider: "openrouter",
      model: "openrouter/free",
      params: { temperature: 0.0, maxOutputTokens: 400 }
    }
  ]
};

/** Convenience helpers */
export const ALLOWLIST_SETS = {
  providers: new Set<LlmProvider>(ALLOWLIST.providers),
  models: new Set<string>(ALLOWLIST.models),
} as const;
