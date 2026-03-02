/**
 * LLM Provider Benchmark — Full stress test
 *
 * Tests all configured providers with multiple prompts,
 * measures latency, throughput, and error rates.
 *
 * Usage:  cd backend && npx tsx src/scripts/llmBenchmark.ts
 */
import "dotenv/config";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type ProviderConfig = {
  name: string;
  call: (prompt: string) => Promise<{ text: string; model: string }>;
  enabled: boolean;
};

type RunResult = {
  provider: string;
  model: string;
  prompt: string;
  latencyMs: number;
  charCount: number;
  estimatedTokens: number;
  success: boolean;
  error?: string;
};

/* ------------------------------------------------------------------ */
/*  Test prompts (simple → medium → complex)                           */
/* ------------------------------------------------------------------ */
const PROMPTS = [
  { label: "simple", text: "What is 2+2? Reply with just the number." },
  { label: "medium", text: "Explain the difference between TCP and UDP in exactly 3 sentences." },
  { label: "complex", text: "Write a Python function that implements binary search on a sorted list. Include a brief docstring." },
];

const RUNS_PER_PROMPT = 2; // 2 runs × 3 prompts = 6 calls per provider

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function env(key: string): string {
  return process.env[key] || "";
}

async function fetchJson(url: string, opts: RequestInit, timeoutMs = 30_000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    const body = await res.text();
    const json = body ? JSON.parse(body) : {};
    if (!res.ok) throw new Error(json?.error?.message || json?.errorMessage || json?.detail || `HTTP ${res.status}`);
    return json;
  } finally {
    clearTimeout(t);
  }
}

/* ------------------------------------------------------------------ */
/*  Provider definitions                                               */
/* ------------------------------------------------------------------ */
const providers: ProviderConfig[] = [
  // 1. OpenAI
  {
    name: "OpenAI (gpt-4o-mini)",
    enabled: !!env("OPENAI_API_KEY"),
    call: async (prompt) => {
      const data = await fetchJson("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 512 }),
      });
      return { text: data.choices?.[0]?.message?.content ?? "", model: data.model || "gpt-4o-mini" };
    },
  },

  // 2. DeepSeek
  {
    name: "DeepSeek (deepseek-chat)",
    enabled: !!env("DEEPSEEK_API_KEY"),
    call: async (prompt) => {
      const data = await fetchJson("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env("DEEPSEEK_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 512 }),
      });
      return { text: data.choices?.[0]?.message?.content ?? "", model: data.model || "deepseek-chat" };
    },
  },

  // 3. Anthropic (Claude)
  {
    name: "Anthropic (claude-3-5-haiku)",
    enabled: !!env("ANTHROPIC_API_KEY"),
    call: async (prompt) => {
      const data = await fetchJson("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-3-5-haiku-20241022", max_tokens: 512, messages: [{ role: "user", content: prompt }] }),
      });
      return { text: data.content?.[0]?.text ?? "", model: data.model || "claude-3-5-haiku" };
    },
  },

  // 4. Gemini (direct Google API)
  {
    name: "Gemini (2.0-flash)",
    enabled: !!env("GL_GOOGLE_API_KEY"),
    call: async (prompt) => {
      const key = env("GL_GOOGLE_API_KEY");
      const data = await fetchJson(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 512 } }),
        }
      );
      return { text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "", model: "gemini-2.0-flash" };
    },
  },

  // 5. OpenRouter
  {
    name: "OpenRouter (auto)",
    enabled: !!env("OPENROUTER_API_KEY"),
    call: async (prompt) => {
      const data = await fetchJson("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("OPENROUTER_API_KEY")}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://atlasux.cloud",
          "X-Title": "Atlas UX Benchmark",
        },
        body: JSON.stringify({ model: "openrouter/auto", messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 512 }),
      });
      return { text: data.choices?.[0]?.message?.content ?? "", model: data.model || "openrouter/auto" };
    },
  },

  // 6. Cerebras
  {
    name: "Cerebras (llama-4-scout)",
    enabled: !!env("CEREBRAS_API_KEY"),
    call: async (prompt) => {
      const data = await fetchJson("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env("CEREBRAS_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-4-scout-17b-16e-instruct", messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 512 }),
      });
      return { text: data.choices?.[0]?.message?.content ?? "", model: data.model || "llama-4-scout" };
    },
  },

  // 7. NVIDIA NIM (Kimi 2.5)
  {
    name: "NVIDIA NIM (kimi-k2)",
    enabled: !!env("NVIDIA_API_KEY"),
    call: async (prompt) => {
      const data = await fetchJson("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env("NVIDIA_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "moonshotai/kimi-k2-instruct", messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 512 }),
      });
      return { text: data.choices?.[0]?.message?.content ?? "", model: data.model || "kimi-k2-instruct" };
    },
  },

  // 8. Swarms.ai
  {
    name: "Swarms (gpt-4o)",
    enabled: !!env("SWARMS_API_KEY"),
    call: async (prompt) => {
      const data = await fetchJson("https://api.swarms.world/v1/agent/completions", {
        method: "POST",
        headers: { "x-api-key": env("SWARMS_API_KEY"), "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_config: { agent_name: "benchmark", system_prompt: "You are a helpful assistant.", model_name: "gpt-4o", role: "worker", max_loops: 1, max_tokens: 512, temperature: 0.3 },
          task: prompt,
        }),
      }, 60_000);
      const text = data?.output ?? data?.response ?? data?.result ?? "";
      return { text, model: "swarms/gpt-4o" };
    },
  },

  // 9. IBM watsonx.ai
  {
    name: "watsonx (granite-3-3-8b)",
    enabled: !!env("WATSONX_API_KEY") && !!env("WATSONX_PROJECT_ID"),
    call: async (prompt) => {
      // IAM token exchange
      const iamRes = await fetch("https://iam.cloud.ibm.com/identity/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(env("WATSONX_API_KEY"))}`,
      });
      const iamData = await iamRes.json() as any;
      if (!iamRes.ok) throw new Error(iamData?.errorMessage || "IAM token failed");

      const baseUrl = env("WATSONX_URL") || "https://us-south.ml.cloud.ibm.com";
      const data = await fetchJson(`${baseUrl}/ml/v1/text/chat?version=2024-10-08`, {
        method: "POST",
        headers: { Authorization: `Bearer ${iamData.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: "ibm/granite-3-3-8b-instruct",
          project_id: env("WATSONX_PROJECT_ID"),
          messages: [{ role: "user", content: prompt }],
          max_tokens: 512,
          temperature: 0.3,
        }),
      });
      return { text: data.choices?.[0]?.message?.content ?? "", model: "ibm/granite-3-3-8b-instruct" };
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Runner                                                             */
/* ------------------------------------------------------------------ */
async function runBenchmark() {
  const active = providers.filter(p => p.enabled);
  const skipped = providers.filter(p => !p.enabled);

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           Atlas UX — LLM Provider Benchmark                ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\nProviders: ${active.length} active, ${skipped.length} skipped`);
  if (skipped.length) console.log(`Skipped: ${skipped.map(s => s.name).join(", ")}`);
  console.log(`Prompts: ${PROMPTS.length} × ${RUNS_PER_PROMPT} runs = ${PROMPTS.length * RUNS_PER_PROMPT} calls/provider`);
  console.log(`Total calls: ${active.length * PROMPTS.length * RUNS_PER_PROMPT}\n`);

  const allResults: RunResult[] = [];

  for (const provider of active) {
    console.log(`\n── ${provider.name} ${"─".repeat(Math.max(0, 50 - provider.name.length))}`);

    for (const prompt of PROMPTS) {
      for (let run = 0; run < RUNS_PER_PROMPT; run++) {
        const start = Date.now();
        let result: RunResult;

        try {
          const resp = await provider.call(prompt.text);
          const latencyMs = Date.now() - start;
          const charCount = resp.text.length;

          result = {
            provider: provider.name,
            model: resp.model,
            prompt: prompt.label,
            latencyMs,
            charCount,
            estimatedTokens: Math.ceil(charCount / 4),
            success: true,
          };

          const tokPerSec = result.estimatedTokens / (latencyMs / 1000);
          console.log(`  ✓ ${prompt.label} #${run + 1}: ${latencyMs}ms | ~${result.estimatedTokens} tok | ~${tokPerSec.toFixed(1)} tok/s`);
        } catch (err: any) {
          const latencyMs = Date.now() - start;
          result = {
            provider: provider.name,
            model: "n/a",
            prompt: prompt.label,
            latencyMs,
            charCount: 0,
            estimatedTokens: 0,
            success: false,
            error: err.message?.slice(0, 120) || String(err),
          };
          console.log(`  ✗ ${prompt.label} #${run + 1}: FAILED (${latencyMs}ms) — ${result.error}`);
        }

        allResults.push(result);
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Summary table                                                    */
  /* ---------------------------------------------------------------- */
  console.log("\n\n╔══════════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                              BENCHMARK RESULTS                                     ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════════════╝\n");

  // Aggregate per provider
  type Agg = { calls: number; successes: number; failures: number; totalMs: number; minMs: number; maxMs: number; totalTokens: number; errors: string[] };
  const agg = new Map<string, Agg>();

  for (const r of allResults) {
    let a = agg.get(r.provider);
    if (!a) {
      a = { calls: 0, successes: 0, failures: 0, totalMs: 0, minMs: Infinity, maxMs: 0, totalTokens: 0, errors: [] };
      agg.set(r.provider, a);
    }
    a.calls++;
    if (r.success) {
      a.successes++;
      a.totalMs += r.latencyMs;
      a.minMs = Math.min(a.minMs, r.latencyMs);
      a.maxMs = Math.max(a.maxMs, r.latencyMs);
      a.totalTokens += r.estimatedTokens;
    } else {
      a.failures++;
      if (r.error) a.errors.push(r.error);
    }
  }

  // Table header
  const pad = (s: string, n: number) => s.padEnd(n).slice(0, n);
  const rpad = (s: string, n: number) => s.padStart(n).slice(-n);

  console.log(`${pad("Provider", 30)} ${rpad("Calls", 6)} ${rpad("OK", 4)} ${rpad("Fail", 5)} ${rpad("Avg ms", 8)} ${rpad("Min ms", 8)} ${rpad("Max ms", 8)} ${rpad("~Tok/s", 8)} ${rpad("Err%", 6)}`);
  console.log("─".repeat(93));

  // Sort by avg latency (fastest first), failures last
  const sorted = [...agg.entries()].sort((a, b) => {
    if (a[1].failures === a[1].calls && b[1].failures !== b[1].calls) return 1;
    if (b[1].failures === b[1].calls && a[1].failures !== a[1].calls) return -1;
    const avgA = a[1].successes > 0 ? a[1].totalMs / a[1].successes : Infinity;
    const avgB = b[1].successes > 0 ? b[1].totalMs / b[1].successes : Infinity;
    return avgA - avgB;
  });

  for (const [name, a] of sorted) {
    const avgMs = a.successes > 0 ? Math.round(a.totalMs / a.successes) : 0;
    const tokPerSec = a.successes > 0 ? (a.totalTokens / (a.totalMs / 1000)).toFixed(1) : "0";
    const errPct = ((a.failures / a.calls) * 100).toFixed(1);
    const minMs = a.minMs === Infinity ? "-" : String(a.minMs);
    const maxMs = a.maxMs === 0 && a.successes === 0 ? "-" : String(a.maxMs);

    console.log(`${pad(name, 30)} ${rpad(String(a.calls), 6)} ${rpad(String(a.successes), 4)} ${rpad(String(a.failures), 5)} ${rpad(String(avgMs), 8)} ${rpad(minMs, 8)} ${rpad(maxMs, 8)} ${rpad(tokPerSec, 8)} ${rpad(errPct, 6)}`);
  }

  // Error details
  const withErrors = sorted.filter(([, a]) => a.errors.length > 0);
  if (withErrors.length) {
    console.log("\n── Errors ──────────────────────────────────────────────────────");
    for (const [name, a] of withErrors) {
      const unique = [...new Set(a.errors)];
      for (const e of unique) {
        console.log(`  ${name}: ${e}`);
      }
    }
  }

  console.log("\n── Legend ───────────────────────────────────────────────────────");
  console.log("  Avg ms  = average latency (successful calls only)");
  console.log("  ~Tok/s  = estimated tokens/second (chars÷4÷seconds)");
  console.log("  Err%    = failure rate\n");
}

runBenchmark().catch(err => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
