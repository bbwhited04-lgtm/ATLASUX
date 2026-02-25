/**
 * backend/src/core/engine/brainllm.ts
 *
 * Single choke-point for ALL LLM calls in Atlas.
 * - Provider/model routing
 * - Hard guardrails (spend/requests/tokens)
 * - Normalized response
 * - Audit events (hookable)
 *
 * ENV keys (as provided by Billy):
 *   - VERCEL_AI_API_KEY
 *   - GL_GOOGLE_API_KEY
 *   - OPENAI_API_KEY
 *   - DEEPSEEK_API_KEY
 *   - OPENROUTER_API_KEY
 *   - CEREBRAS_API_KEY
 *   - WORKERS_API_KEY   (Cloudflare Workers AI)
 *
 * Optional guardrail ENVs seen in your .env:
 *   - AUTO_SPEND_LIMIT          (number, USD/day)
 *   - MAX_ACTIONS_PER_DAY       (number, calls/day)
 *   - CONFIDENCE_AUTO_THRESHOLD (number 0..1, used by callers)
 *   - AUDIT_BUCKET              (string, your audit bucket name)
 *
 * Notes:
 * - This file intentionally avoids importing any provider SDKs.
 * - Uses fetch() (Node 18+). If your runtime is older, add a fetch polyfill.
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

export interface LlmMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface LlmRequest {
  runId: string;              // your workflow run_id
  agent: string;              // ATLAS / BINKY / etc
  purpose: string;            // e.g. "route_decision", "draft_caption"
  route: LlmRoute;

  // Prefer messages; prompt is convenience.
  messages?: LlmMessage[];
  prompt?: string;

  // Optional knobs
  temperature?: number;
  maxOutputTokens?: number;

  // Hard override (only if you want). Still subject to allowlist/guardrails.
  preferredProvider?: LlmProvider;
  preferredModel?: string;

  // If true, we will DENY calls when we can't estimate cost.
  // Set true in production if you want zero surprises.
  requireCostEstimate?: boolean;

  // Arbitrary metadata included in audits
  meta?: Record<string, any>;
}

export interface LlmUsage {
  provider: LlmProvider;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  costUsd: number; // best-effort estimate, can be 0 if unknown and requireCostEstimate=false
}

export interface LlmResponse {
  text: string;
  raw: any;
  usage: LlmUsage;
}

export interface AuditEvent {
  event:
    | "LLM_CALL_START"
    | "LLM_CALL_END"
    | "LLM_CALL_DENIED"
    | "LLM_CALL_FAIL";
  ts: string;
  runId: string;
  agent: string;
  purpose: string;
  route: LlmRoute;
  provider?: LlmProvider;
  model?: string;
  details?: Record<string, any>;
}

/**
 * If you have an internal audit logger (DB, bucket, email, etc),
 * pass it here (recommended). Otherwise defaults to console.
 */
export type AuditHook = (evt: AuditEvent) => Promise<void> | void;

type RoutePlanItem = {
  provider: LlmProvider;
  model: string;
  params: {
    temperature: number;
    maxOutputTokens: number;
  };
};

type RouteCaps = {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxCallsPerRun: number;
  temperatureMax: number;
  /** Override global timeoutMs for this route (ms). Optional. */
  timeoutMs?: number;
};

type GuardrailsConfig = {
  enabled: boolean;
  maxUsdPerDay: number;
  maxCallsPerDay: number;
  maxRequestsPerRun: number;
  maxFailuresPerRun: number;
  timeoutMs: number;
  denyIfUnknownProvider: boolean;
  denyIfUnknownModel: boolean;
  denyIfMissingCostEstimate: boolean;
};

const DEFAULT_GUARDRAILS: GuardrailsConfig = {
  enabled: true,
  maxUsdPerDay: parseFloat(process.env.AUTO_SPEND_LIMIT || "0") || 0,
  maxCallsPerDay: parseInt(process.env.MAX_ACTIONS_PER_DAY || "0", 10) || 0,
  maxRequestsPerRun: 120,
  maxFailuresPerRun: 25,
  timeoutMs: 30_000,
  denyIfUnknownProvider: true,
  denyIfUnknownModel: true,
  denyIfMissingCostEstimate: false, // can be overridden per request
};

const ROUTE_CAPS: Record<LlmRoute, RouteCaps> = {
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
    timeoutMs: 90_000, // large context needs more time
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
 * ALLOWLIST (tight by default).
 * Add models here deliberately to avoid surprise usage.
 */
const ALLOWLIST: { providers: Set<LlmProvider>; models: Set<string> } = {
  providers: new Set<LlmProvider>([
    "vercel_ai_gateway",
    "google_gemini",
    "openai",
    "deepseek",
    "openrouter",
    "cerebras",
    "cloudflare_workers_ai",
  ]),
  models: new Set<string>([
    // Gemini via Vercel or direct
    "google/gemini-2.0-flash",
    "google/gemini-1.5-pro",
    // OpenAI
    "gpt-4o-mini",
    "gpt-4.1-mini",
    // DeepSeek (OpenAI-compatible)
    "deepseek-chat",
    "deepseek-reasoner",
    // OpenRouter
    "openrouter/auto",
    "openrouter/free",
    // Cerebras (OpenAI-compatible naming varies; use a stable placeholder)
    "cerebras/llama",
    // Cloudflare Workers AI model placeholders
    "cf/meta/llama",
  ]),
};

/**
 * Route plans (priority order).
 * You can change models later, but keep them allowlisted.
 */
const ROUTES: Record<LlmRoute, RoutePlanItem[]> = {
  ORCHESTRATION_REASONING: [
    { provider: "vercel_ai_gateway", model: "google/gemini-2.0-flash", params: { temperature: 0.2, maxOutputTokens: 1200 } },
    { provider: "vercel_ai_gateway", model: "google/gemini-1.5-pro", params: { temperature: 0.25, maxOutputTokens: 1600 } },
    { provider: "openrouter", model: "openrouter/auto", params: { temperature: 0.25, maxOutputTokens: 1400 } },
    { provider: "cerebras", model: "cerebras/llama", params: { temperature: 0.25, maxOutputTokens: 1200 } },
  ],
  LONG_CONTEXT_SUMMARY: [
    { provider: "vercel_ai_gateway", model: "google/gemini-1.5-pro", params: { temperature: 0.3, maxOutputTokens: 1600 } },
    { provider: "vercel_ai_gateway", model: "google/gemini-2.0-flash", params: { temperature: 0.3, maxOutputTokens: 1600 } },
    { provider: "openrouter", model: "openrouter/auto", params: { temperature: 0.3, maxOutputTokens: 1600 } },
    { provider: "cerebras", model: "cerebras/llama", params: { temperature: 0.3, maxOutputTokens: 1600 } },
  ],
  DRAFT_GENERATION_FAST: [
    // If you add GROQ later, add it here.
    { provider: "cerebras", model: "cerebras/llama", params: { temperature: 0.7, maxOutputTokens: 900 } },
    { provider: "vercel_ai_gateway", model: "google/gemini-2.0-flash", params: { temperature: 0.7, maxOutputTokens: 900 } },
    { provider: "openrouter", model: "openrouter/auto", params: { temperature: 0.7, maxOutputTokens: 900 } },
  ],
  CLASSIFY_EXTRACT_VALIDATE: [
    { provider: "vercel_ai_gateway", model: "google/gemini-2.0-flash", params: { temperature: 0.0, maxOutputTokens: 600 } },
    { provider: "cloudflare_workers_ai", model: "cf/meta/llama", params: { temperature: 0.0, maxOutputTokens: 600 } },
  ],
  EMERGENCY_FALLBACK_MINIMAL: [
    { provider: "cloudflare_workers_ai", model: "cf/meta/llama", params: { temperature: 0.0, maxOutputTokens: 400 } },
    { provider: "openrouter", model: "openrouter/free", params: { temperature: 0.0, maxOutputTokens: 400 } },
  ],
};

/**
 * Minimal in-memory meters.
 * If you want persistence, back these with your DB/ledger.
 */
type DayKey = string; // YYYY-MM-DD
type Meters = {
  day: DayKey;
  usdSpent: number;
  calls: number;
  byRun: Map<string, { calls: number; failures: number }>;
};

const meters: Meters = {
  day: currentDayKey(),
  usdSpent: 0,
  calls: 0,
  byRun: new Map(),
};

function currentDayKey(): DayKey {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function resetMetersIfNeeded() {
  const dk = currentDayKey();
  if (meters.day !== dk) {
    meters.day = dk;
    meters.usdSpent = 0;
    meters.calls = 0;
    meters.byRun.clear();
  }
}

function estimateTokensRough(messages: LlmMessage[] | undefined, prompt?: string): number {
  // Rough heuristic: ~4 chars/token (varies). Good enough for guardrails.
  const text = messages?.map((m) => m.content).join("\n") ?? prompt ?? "";
  const chars = text.length;
  return Math.ceil(chars / 4);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function nowIso(): string {
  return new Date().toISOString();
}

function getEnvOrThrow(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
}

function hasEnv(key: string): boolean {
  const v = process.env[key];
  return !!v && v.trim().length > 0;
}

/**
 * Best-effort cost estimator.
 * You can tighten this later with real per-model pricing.
 * If requireCostEstimate=true and we can't estimate, we DENY.
 */
function estimateCostUsd(_provider: LlmProvider, _model: string, _tokensIn: number, _tokensOut: number): number | null {
  // Conservative: treat as unknown to avoid false confidence.
  // If you want to allow when unknown, set requireCostEstimate=false.
  return null;
}

/**
 * Provider endpoints
 * - Vercel AI Gateway: supports OpenAI-compatible APIs for many providers.
 *   You must set VERCEL_AI_GATEWAY_BASE_URL if different; otherwise defaults.
 * - OpenAI / DeepSeek / OpenRouter / Cerebras: OpenAI-compatible chat completions.
 * - Gemini: Google Generative Language API (generateContent).
 * - Cloudflare Workers AI: REST endpoint.
 */
const ENDPOINTS = {
  vercelOpenAICompat: process.env.VERCEL_AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1/chat/completions",
  openai: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
  deepseek: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1/chat/completions",
  openrouter: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1/chat/completions",
  cerebras: process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai/v1/chat/completions",
  geminiGenerate: (model: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
  cloudflareWorkers: (accountId: string, model: string) =>
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(model)}`,
};

async function auditDefault(evt: AuditEvent) {
  // Replace with your internal audit sink if desired.
  // This is intentionally minimal to avoid circular deps.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(evt));
}

function ensureRunState(runId: string) {
  const existing = meters.byRun.get(runId);
  if (existing) return existing;
  const obj = { calls: 0, failures: 0 };
  meters.byRun.set(runId, obj);
  return obj;
}

function deny(reason: string, extra?: Record<string, any>): never {
  const err: any = new Error(reason);
  err.code = "LLM_DENIED";
  err.details = extra || {};
  throw err;
}

function pickPlan(req: LlmRequest): RoutePlanItem[] {
  const base = ROUTES[req.route] || [];
  if (req.preferredProvider && req.preferredModel) {
    return [
      {
        provider: req.preferredProvider,
        model: req.preferredModel,
        params: {
          temperature: req.temperature ?? base[0]?.params.temperature ?? 0.3,
          maxOutputTokens: req.maxOutputTokens ?? base[0]?.params.maxOutputTokens ?? 900,
        },
      },
      ...base,
    ];
  }
  return base;
}

function normalizeMessages(req: LlmRequest): LlmMessage[] {
  if (req.messages && req.messages.length) return req.messages;
  const p = req.prompt ?? "";
  return [{ role: "user", content: p }];
}

function enforceGuardrailsPre(req: LlmRequest, provider: LlmProvider, model: string, tokensInEst: number, maxOut: number, guard: GuardrailsConfig) {
  resetMetersIfNeeded();

  const routeCaps = ROUTE_CAPS[req.route];
  if (!routeCaps) deny(`No caps configured for route: ${req.route}`);

  const runState = ensureRunState(req.runId);

  // Allowlist
  if (guard.denyIfUnknownProvider && !ALLOWLIST.providers.has(provider)) {
    deny(`Provider not allowlisted: ${provider}`, { provider });
  }
  if (guard.denyIfUnknownModel && !ALLOWLIST.models.has(model)) {
    deny(`Model not allowlisted: ${model}`, { model });
  }

  // Token caps
  if (tokensInEst > routeCaps.maxInputTokens) {
    deny(`Input tokens exceed route cap (${tokensInEst} > ${routeCaps.maxInputTokens})`, { tokensInEst, cap: routeCaps.maxInputTokens });
  }
  if (maxOut > routeCaps.maxOutputTokens) {
    deny(`Max output tokens exceed route cap (${maxOut} > ${routeCaps.maxOutputTokens})`, { maxOut, cap: routeCaps.maxOutputTokens });
  }

  // Per-run call caps
  if (runState.calls >= routeCaps.maxCallsPerRun) {
    deny(`Route call cap exceeded for run (${runState.calls} >= ${routeCaps.maxCallsPerRun})`, { runCalls: runState.calls, cap: routeCaps.maxCallsPerRun });
  }
  if (runState.calls >= guard.maxRequestsPerRun) {
    deny(`Max requests per run exceeded (${runState.calls} >= ${guard.maxRequestsPerRun})`, { runCalls: runState.calls, cap: guard.maxRequestsPerRun });
  }
  if (runState.failures >= guard.maxFailuresPerRun) {
    deny(`Max failures per run exceeded (${runState.failures} >= ${guard.maxFailuresPerRun})`, { runFailures: runState.failures, cap: guard.maxFailuresPerRun });
  }

  // Daily caps (if configured)
  if (guard.maxCallsPerDay > 0 && meters.calls >= guard.maxCallsPerDay) {
    deny(`Daily call cap exceeded (${meters.calls} >= ${guard.maxCallsPerDay})`, { dayCalls: meters.calls, cap: guard.maxCallsPerDay });
  }
  if (guard.maxUsdPerDay > 0 && meters.usdSpent >= guard.maxUsdPerDay) {
    deny(`Daily spend cap exceeded (${meters.usdSpent} >= ${guard.maxUsdPerDay})`, { usdSpent: meters.usdSpent, cap: guard.maxUsdPerDay });
  }
}

function enforceGuardrailsPost(runId: string, usage: LlmUsage) {
  const runState = ensureRunState(runId);
  runState.calls += 1;
  meters.calls += 1;
  meters.usdSpent += usage.costUsd;
}

function markFailure(runId: string) {
  const runState = ensureRunState(runId);
  runState.failures += 1;
}

/**
 * Public API — single entry point.
 */
export async function runLLM(req: LlmRequest, auditHook: AuditHook = auditDefault): Promise<LlmResponse> {
  const guard: GuardrailsConfig = {
    ...DEFAULT_GUARDRAILS,
    denyIfMissingCostEstimate: req.requireCostEstimate ?? DEFAULT_GUARDRAILS.denyIfMissingCostEstimate,
  };

  const messages = normalizeMessages(req);
  const tokensInEst = estimateTokensRough(messages, req.prompt);

  const plan = pickPlan(req);
  if (!plan.length) deny(`No route plan configured for ${req.route}`);

  let lastErr: any = null;

  for (const item of plan) {
    const provider = item.provider;
    const model = item.model;

    const temp = clamp(req.temperature ?? item.params.temperature, 0, ROUTE_CAPS[req.route].temperatureMax);
    const maxOut = clamp(req.maxOutputTokens ?? item.params.maxOutputTokens, 1, ROUTE_CAPS[req.route].maxOutputTokens);

    try {
      // Pre-checks (deny before calling any provider)
      enforceGuardrailsPre(req, provider, model, tokensInEst, maxOut, guard);

      // Cost estimate (best-effort)
      const costEst = estimateCostUsd(provider, model, tokensInEst, maxOut);
      if (guard.denyIfMissingCostEstimate && (costEst === null || Number.isNaN(costEst))) {
        deny("Missing cost estimate (policy)", { provider, model });
      }

      await auditHook({
        event: "LLM_CALL_START",
        ts: nowIso(),
        runId: req.runId,
        agent: req.agent,
        purpose: req.purpose,
        route: req.route,
        provider,
        model,
        details: { tokensInEst, temperature: temp, maxOut, meta: req.meta || {} },
      });

      const started = Date.now();
      const resp = await callProvider({
        provider,
        model,
        messages,
        temperature: temp,
        maxOutputTokens: maxOut,
        timeoutMs: ROUTE_CAPS[req.route]?.timeoutMs ?? guard.timeoutMs,
      });
      const latencyMs = Date.now() - started;

      const usage: LlmUsage = {
        provider,
        model,
        tokensIn: resp.tokensIn ?? tokensInEst,
        tokensOut: resp.tokensOut ?? 0,
        latencyMs,
        costUsd: costEst ?? 0,
      };

      enforceGuardrailsPost(req.runId, usage);

      await auditHook({
        event: "LLM_CALL_END",
        ts: nowIso(),
        runId: req.runId,
        agent: req.agent,
        purpose: req.purpose,
        route: req.route,
        provider,
        model,
        details: { usage, meta: req.meta || {} },
      });

      return {
        text: resp.text,
        raw: resp.raw,
        usage,
      };
    } catch (err: any) {
      lastErr = err;
      const isDenied = err?.code === "LLM_DENIED";

      if (isDenied) {
        await auditHook({
          event: "LLM_CALL_DENIED",
          ts: nowIso(),
          runId: req.runId,
          agent: req.agent,
          purpose: req.purpose,
          route: req.route,
          provider,
          model,
          details: { reason: err.message, ...err.details, meta: req.meta || {} },
        });
        // Deny is a hard stop (do not fallback to other providers unless you choose otherwise).
        throw err;
      }

      markFailure(req.runId);

      await auditHook({
        event: "LLM_CALL_FAIL",
        ts: nowIso(),
        runId: req.runId,
        agent: req.agent,
        purpose: req.purpose,
        route: req.route,
        provider,
        model,
        details: { error: safeErr(err), meta: req.meta || {} },
      });

      // Try next provider/model in plan
      continue;
    }
  }

  // All providers failed
  throw new Error(`All LLM fallbacks failed for route ${req.route}. Last error: ${lastErr?.message || String(lastErr)}`);
}

function safeErr(err: any) {
  return {
    message: err?.message || String(err),
    code: err?.code,
    status: err?.status,
    name: err?.name,
  };
}

/** Internal call wrapper results */
type ProviderCallResult = {
  text: string;
  raw: any;
  tokensIn?: number;
  tokensOut?: number;
};

async function callProvider(args: {
  provider: LlmProvider;
  model: string;
  messages: LlmMessage[];
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
}): Promise<ProviderCallResult> {
  switch (args.provider) {
    case "google_gemini":
      return callGemini(args.model, args.messages, args.temperature, args.maxOutputTokens, args.timeoutMs);
    case "cloudflare_workers_ai":
      return callCloudflareWorkers(args.model, args.messages, args.temperature, args.maxOutputTokens, args.timeoutMs);
    case "vercel_ai_gateway":
      return callOpenAICompat("vercel", args.model, args.messages, args.temperature, args.maxOutputTokens, args.timeoutMs);
    case "openai":
      return callOpenAICompat("openai", args.model, args.messages, args.temperature, args.maxOutputTokens, args.timeoutMs);
    case "deepseek":
      return callOpenAICompat("deepseek", args.model, args.messages, args.temperature, args.maxOutputTokens, args.timeoutMs);
    case "openrouter":
      return callOpenAICompat("openrouter", args.model, args.messages, args.temperature, args.maxOutputTokens, args.timeoutMs);
    case "cerebras":
      return callOpenAICompat("cerebras", args.model, args.messages, args.temperature, args.maxOutputTokens, args.timeoutMs);
    default:
      throw new Error(`Unsupported provider: ${args.provider}`);
  }
}

/**
 * OpenAI-compatible chat completions.
 * This covers: Vercel AI Gateway (OpenAI compat), OpenAI, DeepSeek, OpenRouter, Cerebras (if configured compat).
 */
async function callOpenAICompat(
  which: "vercel" | "openai" | "deepseek" | "openrouter" | "cerebras",
  model: string,
  messages: LlmMessage[],
  temperature: number,
  maxOutputTokens: number,
  timeoutMs: number
): Promise<ProviderCallResult> {
  const { url, headers } = buildOpenAICompat(which);

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxOutputTokens,
  };

  const raw = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    timeoutMs,
  });

  const text =
    raw?.choices?.[0]?.message?.content ??
    raw?.choices?.[0]?.text ??
    "";

  const usage = raw?.usage || {};
  return {
    text,
    raw,
    tokensIn: usage.prompt_tokens,
    tokensOut: usage.completion_tokens,
  };
}

function buildOpenAICompat(which: "vercel" | "openai" | "deepseek" | "openrouter" | "cerebras"): { url: string; headers: Record<string, string> } {
  if (which === "vercel") {
    const apiKey = getEnvOrThrow("VERCEL_AI_API_KEY");
    return {
      url: ENDPOINTS.vercelOpenAICompat,
      headers: { Authorization: `Bearer ${apiKey}` },
    };
  }

  if (which === "openai") {
    const apiKey = getEnvOrThrow("OPENAI_API_KEY");
    return { url: ENDPOINTS.openai, headers: { Authorization: `Bearer ${apiKey}` } };
  }

  if (which === "deepseek") {
    const apiKey = getEnvOrThrow("DEEPSEEK_API_KEY");
    return { url: ENDPOINTS.deepseek, headers: { Authorization: `Bearer ${apiKey}` } };
  }

  if (which === "openrouter") {
    const apiKey = getEnvOrThrow("OPENROUTER_API_KEY");
    // OpenRouter recommends optional headers; safe to include if you want.
    const extra: Record<string, string> = {};
    if (process.env.OPENROUTER_SITE_URL) extra["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
    if (process.env.OPENROUTER_APP_NAME) extra["X-Title"] = process.env.OPENROUTER_APP_NAME;

    return { url: ENDPOINTS.openrouter, headers: { Authorization: `Bearer ${apiKey}`, ...extra } };
  }

  // cerebras
  const apiKey = getEnvOrThrow("CEREBRAS_API_KEY");
  return { url: ENDPOINTS.cerebras, headers: { Authorization: `Bearer ${apiKey}` } };
}

/**
 * Google Gemini (Generative Language API).
 * Uses GL_GOOGLE_API_KEY.
 *
 * Model name mapping:
 * - If caller passes "google/gemini-2.0-flash" we translate to "gemini-2.0-flash"
 * - If caller passes "google/gemini-1.5-pro" we translate to "gemini-1.5-pro"
 * - If caller passes already "gemini-*" we keep as-is.
 */
async function callGemini(
  model: string,
  messages: LlmMessage[],
  temperature: number,
  maxOutputTokens: number,
  timeoutMs: number
): Promise<ProviderCallResult> {
  const apiKey = getEnvOrThrow("GL_GOOGLE_API_KEY");

  const geminiModel = model.startsWith("google/") ? model.replace("google/", "") : model;
  const url = `${ENDPOINTS.geminiGenerate(geminiModel)}?key=${encodeURIComponent(apiKey)}`;

  // Gemini expects "contents" with parts
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  const raw = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs,
  });

  const text =
    raw?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ??
    "";

  // Gemini usage isn't always returned the same way; leave tokens as undefined.
  return { text, raw };
}

/**
 * Cloudflare Workers AI.
 * Needs:
 * - WORKERS_API_KEY
 * - CLOUDFLARE_ACCOUNT_ID
 *
 * Model in route plan is "cf/meta/llama" placeholder; you can replace with actual Workers AI model name.
 */
async function callCloudflareWorkers(
  model: string,
  messages: LlmMessage[],
  temperature: number,
  maxOutputTokens: number,
  timeoutMs: number
): Promise<ProviderCallResult> {
  if (!hasEnv("CLOUDFLARE_ACCOUNT_ID")) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID env for Workers AI");
  }
  const apiToken = getEnvOrThrow("WORKERS_API_KEY");
  const accountId = getEnvOrThrow("CLOUDFLARE_ACCOUNT_ID");

  // Use a simple chat-style payload. Workers AI models vary; adjust as needed.
  const url = ENDPOINTS.cloudflareWorkers(accountId, model);

  const body = {
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature,
    max_tokens: maxOutputTokens,
  };

  const raw = await fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(body),
    timeoutMs,
  });

  const text =
    raw?.result?.response ??
    raw?.result?.text ??
    raw?.response ??
    "";

  return { text, raw };
}

/**
 * Fetch JSON with timeout
 */
async function fetchJson(
  url: string,
  opts: { method: string; headers: Record<string, string>; body?: string; timeoutMs: number }
): Promise<any> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const res = await fetch(url, {
      method: opts.method,
      headers: opts.headers,
      body: opts.body,
      signal: controller.signal,
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { _nonJson: true, text };
    }

    if (!res.ok) {
      const err: any = new Error(`HTTP ${res.status} calling ${url}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }

    return json;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Helper: quick route selection for callers.
 * Example:
 *   const r = await runLLM(simpleCall("ATLAS", runId, "route_decision", "ORCHESTRATION_REASONING", "..."));
 */
export function simpleCall(agent: string, runId: string, purpose: string, route: LlmRoute, prompt: string): LlmRequest {
  return { agent, runId, purpose, route, prompt };
}
