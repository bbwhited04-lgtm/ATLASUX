/**
 * LLM Provider Quality Evaluation Benchmark
 *
 * Measures four RAGAS-style metrics across all providers:
 *   1. Faithfulness (Groundedness)  — Does the answer stay grounded in provided context?
 *   2. Context Relevance            — Is the context relevant to the question?
 *   3. Answer Relevance             — Does the answer address the actual question?
 *   4. Answer Correctness           — Is the answer factually correct vs reference?
 *
 * Uses GPT-4o-mini as the judge LLM.
 *
 * Usage:  cd backend && npx tsx src/scripts/llmEvalBenchmark.ts
 */
import "dotenv/config";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type EvalCase = {
  id: string;
  question: string;
  context: string;        // ground truth context to test faithfulness
  referenceAnswer: string; // gold-standard answer for correctness
};

type ProviderConfig = {
  name: string;
  enabled: boolean;
  call: (systemPrompt: string, userPrompt: string) => Promise<string>;
};

type EvalScores = {
  faithfulness: number;     // 0-1
  contextRelevance: number; // 0-1
  answerRelevance: number;  // 0-1
  answerCorrectness: number;// 0-1
};

type EvalResult = {
  provider: string;
  caseId: string;
  question: string;
  answer: string;
  scores: EvalScores;
  latencyMs: number;
};

/* ------------------------------------------------------------------ */
/*  Evaluation test cases (with context + reference answers)           */
/* ------------------------------------------------------------------ */
const EVAL_CASES: EvalCase[] = [
  {
    id: "rag-1",
    question: "What is the maximum daily spending limit for autonomous agent actions in Atlas UX?",
    context: `Atlas UX enforces hard safety guardrails for all autonomous agent actions.
The AUTO_SPEND_LIMIT_USD environment variable controls the maximum amount (in USD)
that agents can spend per day without requiring human approval. The default is $0
(meaning all spend requires approval). When set to a positive value like $50, agents
can autonomously execute purchases up to that daily cap. Any spend above the limit
triggers a decision_memo approval workflow. The MAX_ACTIONS_PER_DAY variable separately
caps the total number of autonomous actions regardless of cost.`,
    referenceAnswer: "The maximum daily spending limit is controlled by the AUTO_SPEND_LIMIT_USD environment variable. The default is $0 (all spend requires approval). When configured with a positive value, agents can spend up to that amount per day autonomously. Any amount above the limit requires a decision_memo approval.",
  },
  {
    id: "rag-2",
    question: "How does the Atlas UX engine loop work and what is its default tick interval?",
    context: `The Atlas UX engine loop runs as a separate Node.js process defined in
workers/engineLoop.ts. It uses a polling mechanism that ticks every ENGINE_TICK_INTERVAL_MS
milliseconds (default: 5000ms / 5 seconds). On each tick, the engine checks for pending
jobs in the jobs database table, processes queued agent actions, evaluates confidence
scores against CONFIDENCE_AUTO_THRESHOLD, and routes high-risk actions to the approval
workflow. The engine is enabled/disabled via the ENGINE_ENABLED environment variable.
Job statuses progress through: queued → running → completed/failed.`,
    referenceAnswer: "The engine loop is a separate Node.js process (workers/engineLoop.ts) that polls every 5 seconds by default (ENGINE_TICK_INTERVAL_MS=5000). Each tick it processes pending jobs from the database, evaluates confidence scores, and routes risky actions to the approval workflow. Jobs progress through queued → running → completed/failed statuses.",
  },
  {
    id: "rag-3",
    question: "What authentication method does the Atlas UX backend use?",
    context: `Atlas UX uses JWT-based authentication implemented in the authPlugin.ts
Fastify plugin. The frontend sends a JSON Web Token in the Authorization header with
each request. The authPlugin verifies the token signature, extracts the user identity,
and attaches it to the request context. For multi-tenancy, a separate tenantPlugin
extracts the tenant_id from the x-tenant-id request header. Every database table
includes a tenant_id foreign key for data isolation. All mutations are logged to the
audit_log table via the auditPlugin for compliance.`,
    referenceAnswer: "Atlas UX uses JWT-based authentication via the authPlugin.ts Fastify plugin. The frontend sends a JWT in the Authorization header, which the plugin verifies and extracts user identity from. Multi-tenancy is handled separately by tenantPlugin using the x-tenant-id header.",
  },
  {
    id: "factual-1",
    question: "What are the three states of matter and their key properties?",
    context: `Matter exists in three classical states: solid, liquid, and gas. Solids
have a fixed shape and volume because their particles are tightly packed in a regular
arrangement. Liquids have a fixed volume but take the shape of their container because
particles can flow past each other. Gases have neither fixed shape nor fixed volume —
they expand to fill any container because particles move freely with high kinetic energy.
Transitions between states occur through heating (melting, evaporation) or cooling
(condensation, freezing).`,
    referenceAnswer: "The three states of matter are solid (fixed shape and volume, tightly packed particles), liquid (fixed volume but takes container shape, flowing particles), and gas (no fixed shape or volume, freely moving particles). State transitions occur through heating or cooling.",
  },
  {
    id: "factual-2",
    question: "Explain how photosynthesis works in plants.",
    context: `Photosynthesis is the process by which plants convert light energy into
chemical energy stored in glucose. It occurs primarily in chloroplasts, specifically
using the green pigment chlorophyll. The overall equation is: 6CO2 + 6H2O + light
energy → C6H12O6 + 6O2. The process has two stages: the light-dependent reactions
(in thylakoid membranes) which capture light energy and produce ATP and NADPH, and
the Calvin cycle (in the stroma) which uses ATP and NADPH to fix carbon dioxide into
glucose. Plants absorb CO2 through stomata and water through roots.`,
    referenceAnswer: "Photosynthesis converts light energy into glucose in chloroplasts using chlorophyll. The equation is 6CO2 + 6H2O + light → C6H12O6 + 6O2. It has two stages: light-dependent reactions (thylakoid membranes, produce ATP/NADPH) and the Calvin cycle (stroma, fixes CO2 into glucose). Plants absorb CO2 through stomata and water through roots.",
  },
];

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
/*  Judge LLM — GPT-4o-mini scores each metric 0-1                    */
/* ------------------------------------------------------------------ */
async function judgeAnswer(
  question: string,
  context: string,
  answer: string,
  referenceAnswer: string,
): Promise<EvalScores> {
  const judgeKey = env("OPENAI_API_KEY");
  if (!judgeKey) throw new Error("OPENAI_API_KEY required for judge LLM");

  const judgePrompt = `You are an AI evaluation judge. Score the following answer on four metrics, each from 0.0 to 1.0.

QUESTION: ${question}

CONTEXT (ground truth information provided):
${context}

REFERENCE ANSWER (gold standard):
${referenceAnswer}

CANDIDATE ANSWER (to evaluate):
${answer}

Score these four metrics:

1. **Faithfulness (Groundedness)**: Does the candidate answer ONLY contain claims supported by the CONTEXT? 1.0 = every claim is grounded in context, 0.0 = completely hallucinated.

2. **Context Relevance**: Is the provided CONTEXT relevant and useful for answering the QUESTION? 1.0 = perfectly relevant, 0.0 = completely irrelevant.

3. **Answer Relevance**: Does the candidate answer directly address the QUESTION asked? 1.0 = perfectly addresses the question, 0.0 = completely off-topic.

4. **Answer Correctness**: Is the candidate answer factually correct compared to the REFERENCE ANSWER? 1.0 = fully correct and complete, 0.0 = completely wrong.

Respond ONLY with valid JSON, no other text:
{"faithfulness": 0.0, "contextRelevance": 0.0, "answerRelevance": 0.0, "answerCorrectness": 0.0}`;

  const data = await fetchJson("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${judgeKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: judgePrompt }],
      temperature: 0.0,
      max_tokens: 200,
      response_format: { type: "json_object" },
    }),
  });

  const raw = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const scores = JSON.parse(raw);
    return {
      faithfulness: clamp(scores.faithfulness ?? 0, 0, 1),
      contextRelevance: clamp(scores.contextRelevance ?? 0, 0, 1),
      answerRelevance: clamp(scores.answerRelevance ?? 0, 0, 1),
      answerCorrectness: clamp(scores.answerCorrectness ?? 0, 0, 1),
    };
  } catch {
    console.error("  Judge returned invalid JSON:", raw);
    return { faithfulness: 0, contextRelevance: 0, answerRelevance: 0, answerCorrectness: 0 };
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/* ------------------------------------------------------------------ */
/*  Provider definitions                                               */
/* ------------------------------------------------------------------ */
function makeOpenAICompatProvider(
  name: string, url: string, keyEnv: string, model: string, headerFn?: (key: string) => Record<string, string>
): ProviderConfig {
  return {
    name,
    enabled: !!env(keyEnv),
    call: async (systemPrompt, userPrompt) => {
      const key = env(keyEnv);
      const headers = headerFn ? headerFn(key) : { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
      if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
      const data = await fetchJson(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          temperature: 0.1,
          max_tokens: 512,
        }),
      });
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}

const providers: ProviderConfig[] = [
  makeOpenAICompatProvider("OpenAI (gpt-4o-mini)", "https://api.openai.com/v1/chat/completions", "OPENAI_API_KEY", "gpt-4o-mini"),

  makeOpenAICompatProvider("Cerebras (llama3.1-8b)", "https://api.cerebras.ai/v1/chat/completions", "CEREBRAS_API_KEY", "llama3.1-8b"),

  makeOpenAICompatProvider("Cerebras (gpt-oss-120b)", "https://api.cerebras.ai/v1/chat/completions", "CEREBRAS_API_KEY", "gpt-oss-120b"),

  makeOpenAICompatProvider("NVIDIA NIM (kimi-k2)", "https://integrate.api.nvidia.com/v1/chat/completions", "NVIDIA_API_KEY", "moonshotai/kimi-k2-instruct"),

  makeOpenAICompatProvider("OpenRouter (auto)", "https://openrouter.ai/api/v1/chat/completions", "OPENROUTER_API_KEY", "openrouter/auto",
    (key) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://atlasux.cloud", "X-Title": "Atlas UX Eval" })),

  // Anthropic (different API format)
  {
    name: "Anthropic (claude-3-5-haiku)",
    enabled: !!env("ANTHROPIC_API_KEY"),
    call: async (systemPrompt, userPrompt) => {
      const data = await fetchJson("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 512,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      return data.content?.[0]?.text ?? "";
    },
  },

  // Gemini (different API format)
  {
    name: "Gemini (2.5-flash)",
    enabled: !!env("GL_GOOGLE_API_KEY"),
    call: async (systemPrompt, userPrompt) => {
      const key = env("GL_GOOGLE_API_KEY");
      const data = await fetchJson(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
            ],
            generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
          }),
        }
      );
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    },
  },

  // Swarms (different API format)
  {
    name: "Swarms (gpt-4o)",
    enabled: !!env("SWARMS_API_KEY"),
    call: async (systemPrompt, userPrompt) => {
      const data = await fetchJson("https://api.swarms.world/v1/agent/completions", {
        method: "POST",
        headers: { "x-api-key": env("SWARMS_API_KEY"), "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_config: { agent_name: "eval", system_prompt: systemPrompt, model_name: "gpt-4o", role: "worker", max_loops: 1, max_tokens: 512, temperature: 0.1 },
          task: userPrompt,
        }),
      }, 60_000);
      return data?.output ?? data?.response ?? data?.result ?? "";
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Runner                                                             */
/* ------------------------------------------------------------------ */
async function runEval() {
  const active = providers.filter(p => p.enabled);
  const skipped = providers.filter(p => !p.enabled);

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║       Atlas UX — LLM Quality Evaluation Benchmark          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\nProviders: ${active.length} active, ${skipped.length} skipped`);
  if (skipped.length) console.log(`Skipped: ${skipped.map(s => s.name).join(", ")}`);
  console.log(`Test cases: ${EVAL_CASES.length}`);
  console.log(`Total evaluations: ${active.length * EVAL_CASES.length}`);
  console.log(`Judge: GPT-4o-mini (temperature 0.0)\n`);

  const allResults: EvalResult[] = [];

  for (const provider of active) {
    console.log(`\n── ${provider.name} ${"─".repeat(Math.max(0, 50 - provider.name.length))}`);

    for (const testCase of EVAL_CASES) {
      const systemPrompt = `You are a helpful assistant. Answer the question using ONLY the provided context. Do not add information beyond what the context contains. Be concise and accurate.

CONTEXT:
${testCase.context}`;

      const start = Date.now();
      try {
        const answer = await provider.call(systemPrompt, testCase.question);
        const latencyMs = Date.now() - start;

        if (!answer || answer.trim().length === 0) {
          console.log(`  ✗ ${testCase.id}: Empty response (${latencyMs}ms)`);
          allResults.push({
            provider: provider.name, caseId: testCase.id, question: testCase.question,
            answer: "", latencyMs,
            scores: { faithfulness: 0, contextRelevance: 0, answerRelevance: 0, answerCorrectness: 0 },
          });
          continue;
        }

        // Judge the answer
        const scores = await judgeAnswer(testCase.question, testCase.context, answer, testCase.referenceAnswer);
        const avg = ((scores.faithfulness + scores.contextRelevance + scores.answerRelevance + scores.answerCorrectness) / 4).toFixed(2);

        console.log(`  ✓ ${testCase.id}: F=${scores.faithfulness.toFixed(2)} CR=${scores.contextRelevance.toFixed(2)} AR=${scores.answerRelevance.toFixed(2)} AC=${scores.answerCorrectness.toFixed(2)} avg=${avg} (${latencyMs}ms)`);

        allResults.push({ provider: provider.name, caseId: testCase.id, question: testCase.question, answer, latencyMs, scores });
      } catch (err: any) {
        const latencyMs = Date.now() - start;
        console.log(`  ✗ ${testCase.id}: FAILED (${latencyMs}ms) — ${err.message?.slice(0, 100)}`);
        allResults.push({
          provider: provider.name, caseId: testCase.id, question: testCase.question,
          answer: "", latencyMs,
          scores: { faithfulness: 0, contextRelevance: 0, answerRelevance: 0, answerCorrectness: 0 },
        });
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Summary tables                                                   */
  /* ---------------------------------------------------------------- */
  console.log("\n\n╔════════════════════════════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                              QUALITY EVALUATION RESULTS                                          ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════════════════════════════╝\n");

  // Aggregate per provider
  type Agg = { results: EvalResult[]; avgF: number; avgCR: number; avgAR: number; avgAC: number; avgAll: number; avgLatency: number; errors: number };
  const agg = new Map<string, Agg>();

  for (const r of allResults) {
    let a = agg.get(r.provider);
    if (!a) a = { results: [], avgF: 0, avgCR: 0, avgAR: 0, avgAC: 0, avgAll: 0, avgLatency: 0, errors: 0 };
    a.results.push(r);
    agg.set(r.provider, a);
  }

  for (const [, a] of agg) {
    const valid = a.results.filter(r => r.answer.length > 0);
    a.errors = a.results.length - valid.length;
    if (valid.length > 0) {
      a.avgF = valid.reduce((s, r) => s + r.scores.faithfulness, 0) / valid.length;
      a.avgCR = valid.reduce((s, r) => s + r.scores.contextRelevance, 0) / valid.length;
      a.avgAR = valid.reduce((s, r) => s + r.scores.answerRelevance, 0) / valid.length;
      a.avgAC = valid.reduce((s, r) => s + r.scores.answerCorrectness, 0) / valid.length;
      a.avgAll = (a.avgF + a.avgCR + a.avgAR + a.avgAC) / 4;
      a.avgLatency = valid.reduce((s, r) => s + r.latencyMs, 0) / valid.length;
    }
  }

  const pad = (s: string, n: number) => s.padEnd(n).slice(0, n);
  const rpad = (s: string, n: number) => s.padStart(n).slice(-n);

  // Sort by overall average score (highest first)
  const sorted = [...agg.entries()].sort((a, b) => b[1].avgAll - a[1].avgAll);

  console.log(`${pad("Provider", 30)} ${rpad("Faith", 7)} ${rpad("CtxRel", 7)} ${rpad("AnsRel", 7)} ${rpad("AnsCor", 7)} ${rpad("AVG", 7)} ${rpad("Lat ms", 8)} ${rpad("Err", 4)}`);
  console.log("─".repeat(77));

  for (const [name, a] of sorted) {
    console.log(
      `${pad(name, 30)} ${rpad(a.avgF.toFixed(2), 7)} ${rpad(a.avgCR.toFixed(2), 7)} ${rpad(a.avgAR.toFixed(2), 7)} ${rpad(a.avgAC.toFixed(2), 7)} ${rpad(a.avgAll.toFixed(2), 7)} ${rpad(String(Math.round(a.avgLatency)), 8)} ${rpad(String(a.errors), 4)}`
    );
  }

  console.log("\n── Legend ───────────────────────────────────────────────────────");
  console.log("  Faith  = Faithfulness (groundedness in provided context)");
  console.log("  CtxRel = Context Relevance (is context useful for the question)");
  console.log("  AnsRel = Answer Relevance (does answer address the question)");
  console.log("  AnsCor = Answer Correctness (factual accuracy vs reference)");
  console.log("  AVG    = Average of all four metrics");
  console.log("  Lat ms = Average latency per call");
  console.log("  Err    = Number of failed/empty responses\n");

  // Per-case breakdown for top 3 providers
  console.log("── Per-Case Breakdown (top 3) ───────────────────────────────────\n");
  const top3 = sorted.slice(0, 3);
  for (const [name, a] of top3) {
    console.log(`  ${name}:`);
    for (const r of a.results) {
      if (r.answer.length === 0) {
        console.log(`    ${r.caseId}: FAILED`);
      } else {
        const s = r.scores;
        console.log(`    ${r.caseId}: F=${s.faithfulness.toFixed(2)} CR=${s.contextRelevance.toFixed(2)} AR=${s.answerRelevance.toFixed(2)} AC=${s.answerCorrectness.toFixed(2)} (${r.latencyMs}ms)`);
      }
    }
    console.log();
  }
}

runEval().catch(err => {
  console.error("Eval benchmark failed:", err);
  process.exit(1);
});
