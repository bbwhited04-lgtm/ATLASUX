"""
Atlas UX — RAGAS + DeepEval LLM Quality Evaluation

Measures four core RAG metrics across all configured providers:
  1. Faithfulness (Groundedness)
  2. Context Relevance (Context Precision)
  3. Answer Relevance
  4. Answer Correctness

Usage:
  cd eval
  source .venv/bin/activate
  OPENAI_API_KEY=<key> python ragas_eval.py

Requires: ragas, deepeval, openai, langchain-openai
"""

import asyncio
import json
import os
import time
from dataclasses import dataclass, field
from dotenv import load_dotenv

import httpx
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    answer_correctness,
    context_precision,
)
from ragas.dataset_schema import SingleTurnSample, EvaluationDataset
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

load_dotenv(dotenv_path="../backend/.env")

OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY", "")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GOOGLE_KEY = os.getenv("GL_GOOGLE_API_KEY", "")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
CEREBRAS_KEY = os.getenv("CEREBRAS_API_KEY", "")
GROQ_KEY = os.getenv("GROQ_API_KEY", "")
NVIDIA_KEY = os.getenv("NVIDIA_API_KEY", "")
SWARMS_KEY = os.getenv("SWARMS_API_KEY", "")
WATSONX_KEY = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

TIMEOUT = 60.0

# ---------------------------------------------------------------------------
# Test dataset — RAG-style questions with context + reference answers
# ---------------------------------------------------------------------------

EVAL_DATASET = [
    {
        "id": "rag-safety",
        "question": "What is the maximum daily spending limit for autonomous agent actions in Atlas UX?",
        "contexts": [
            "Atlas UX enforces hard safety guardrails for all autonomous agent actions. "
            "The AUTO_SPEND_LIMIT_USD environment variable controls the maximum amount (in USD) "
            "that agents can spend per day without requiring human approval. The default is $0 "
            "(meaning all spend requires approval). When set to a positive value like $50, agents "
            "can autonomously execute purchases up to that daily cap. Any spend above the limit "
            "triggers a decision_memo approval workflow. The MAX_ACTIONS_PER_DAY variable separately "
            "caps the total number of autonomous actions regardless of cost."
        ],
        "reference": "The maximum daily spending limit is controlled by the AUTO_SPEND_LIMIT_USD environment variable. The default is $0 (all spend requires approval). When configured with a positive value, agents can spend up to that amount per day autonomously. Any amount above the limit requires a decision_memo approval.",
    },
    {
        "id": "rag-engine",
        "question": "How does the Atlas UX engine loop work and what is its default tick interval?",
        "contexts": [
            "The Atlas UX engine loop runs as a separate Node.js process defined in "
            "workers/engineLoop.ts. It uses a polling mechanism that ticks every ENGINE_TICK_INTERVAL_MS "
            "milliseconds (default: 5000ms / 5 seconds). On each tick, the engine checks for pending "
            "jobs in the jobs database table, processes queued agent actions, evaluates confidence "
            "scores against CONFIDENCE_AUTO_THRESHOLD, and routes high-risk actions to the approval "
            "workflow. The engine is enabled/disabled via the ENGINE_ENABLED environment variable. "
            "Job statuses progress through: queued → running → completed/failed."
        ],
        "reference": "The engine loop is a separate Node.js process (workers/engineLoop.ts) that polls every 5 seconds by default (ENGINE_TICK_INTERVAL_MS=5000). Each tick it processes pending jobs from the database, evaluates confidence scores, and routes risky actions to the approval workflow. Jobs progress through queued → running → completed/failed statuses.",
    },
    {
        "id": "rag-auth",
        "question": "What authentication method does the Atlas UX backend use?",
        "contexts": [
            "Atlas UX uses JWT-based authentication implemented in the authPlugin.ts "
            "Fastify plugin. The frontend sends a JSON Web Token in the Authorization header with "
            "each request. The authPlugin verifies the token signature, extracts the user identity, "
            "and attaches it to the request context. For multi-tenancy, a separate tenantPlugin "
            "extracts the tenant_id from the x-tenant-id request header. Every database table "
            "includes a tenant_id foreign key for data isolation. All mutations are logged to the "
            "audit_log table via the auditPlugin for compliance."
        ],
        "reference": "Atlas UX uses JWT-based authentication via the authPlugin.ts Fastify plugin. The frontend sends a JWT in the Authorization header, which the plugin verifies and extracts user identity from. Multi-tenancy is handled separately by tenantPlugin using the x-tenant-id header.",
    },
    {
        "id": "science-photo",
        "question": "Explain how photosynthesis works in plants.",
        "contexts": [
            "Photosynthesis is the process by which plants convert light energy into "
            "chemical energy stored in glucose. It occurs primarily in chloroplasts, specifically "
            "using the green pigment chlorophyll. The overall equation is: 6CO2 + 6H2O + light "
            "energy → C6H12O6 + 6O2. The process has two stages: the light-dependent reactions "
            "(in thylakoid membranes) which capture light energy and produce ATP and NADPH, and "
            "the Calvin cycle (in the stroma) which uses ATP and NADPH to fix carbon dioxide into "
            "glucose. Plants absorb CO2 through stomata and water through roots."
        ],
        "reference": "Photosynthesis converts light energy into glucose in chloroplasts using chlorophyll. The equation is 6CO2 + 6H2O + light → C6H12O6 + 6O2. It has two stages: light-dependent reactions (thylakoid membranes, produce ATP/NADPH) and the Calvin cycle (stroma, fixes CO2 into glucose).",
    },
    {
        "id": "science-matter",
        "question": "What are the three states of matter and their key properties?",
        "contexts": [
            "Matter exists in three classical states: solid, liquid, and gas. Solids "
            "have a fixed shape and volume because their particles are tightly packed in a regular "
            "arrangement. Liquids have a fixed volume but take the shape of their container because "
            "particles can flow past each other. Gases have neither fixed shape nor fixed volume — "
            "they expand to fill any container because particles move freely with high kinetic energy. "
            "Transitions between states occur through heating (melting, evaporation) or cooling "
            "(condensation, freezing)."
        ],
        "reference": "The three states of matter are solid (fixed shape and volume, tightly packed particles), liquid (fixed volume but takes container shape, flowing particles), and gas (no fixed shape or volume, freely moving particles). State transitions occur through heating or cooling.",
    },
]

# ---------------------------------------------------------------------------
# Provider call functions
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = (
    "You are a helpful assistant. Answer the question using ONLY the provided context. "
    "Do not add information beyond what the context contains. Be concise and accurate.\n\n"
    "CONTEXT:\n{context}"
)


async def call_openai_compat(
    client: httpx.AsyncClient,
    url: str,
    key: str,
    model: str,
    question: str,
    context: str,
    extra_headers: dict | None = None,
) -> tuple[str, float]:
    """Call an OpenAI-compatible endpoint. Returns (answer, latency_ms)."""
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if extra_headers:
        headers.update(extra_headers)

    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
            {"role": "user", "content": question},
        ],
        "temperature": 0.1,
        "max_tokens": 512,
    }
    t0 = time.time()
    resp = await client.post(url, json=body, headers=headers, timeout=TIMEOUT)
    latency = (time.time() - t0) * 1000
    resp.raise_for_status()
    data = resp.json()
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    return text, latency


async def call_anthropic(
    client: httpx.AsyncClient, question: str, context: str
) -> tuple[str, float]:
    headers = {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    body = {
        "model": "claude-3-5-haiku-20241022",
        "max_tokens": 512,
        "system": SYSTEM_PROMPT.format(context=context),
        "messages": [{"role": "user", "content": question}],
    }
    t0 = time.time()
    resp = await client.post(
        "https://api.anthropic.com/v1/messages", json=body, headers=headers, timeout=TIMEOUT
    )
    latency = (time.time() - t0) * 1000
    resp.raise_for_status()
    data = resp.json()
    text = data.get("content", [{}])[0].get("text", "")
    return text, latency


async def call_gemini(
    client: httpx.AsyncClient, question: str, context: str
) -> tuple[str, float]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GOOGLE_KEY}"
    body = {
        "contents": [
            {"role": "user", "parts": [{"text": SYSTEM_PROMPT.format(context=context) + "\n\n" + question}]}
        ],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 512},
    }
    t0 = time.time()
    resp = await client.post(url, json=body, headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
    latency = (time.time() - t0) * 1000
    resp.raise_for_status()
    data = resp.json()
    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    return text, latency


async def call_swarms(
    client: httpx.AsyncClient, question: str, context: str
) -> tuple[str, float]:
    headers = {"x-api-key": SWARMS_KEY, "Content-Type": "application/json"}
    body = {
        "agent_config": {
            "agent_name": "eval",
            "system_prompt": SYSTEM_PROMPT.format(context=context),
            "model_name": "gpt-4o",
            "role": "worker",
            "max_loops": 1,
            "max_tokens": 512,
            "temperature": 0.1,
        },
        "task": question,
    }
    t0 = time.time()
    resp = await client.post(
        "https://api.swarms.world/v1/agent/completions",
        json=body,
        headers=headers,
        timeout=TIMEOUT,
    )
    latency = (time.time() - t0) * 1000
    resp.raise_for_status()
    data = resp.json()
    text = data.get("output", "") or data.get("response", "") or data.get("result", "")
    return text, latency


# ---------------------------------------------------------------------------
# Build provider list
# ---------------------------------------------------------------------------

@dataclass
class Provider:
    name: str
    enabled: bool
    call: object  # async callable(client, question, context) -> (str, float)


def build_providers() -> list[Provider]:
    providers: list[Provider] = []

    # OpenAI
    if OPENAI_KEY:
        async def _openai(c, q, ctx):
            return await call_openai_compat(c, "https://api.openai.com/v1/chat/completions", OPENAI_KEY, "gpt-4o-mini", q, ctx)
        providers.append(Provider("OpenAI (gpt-4o-mini)", True, _openai))

    # Cerebras llama3.1-8b (speed king)
    if CEREBRAS_KEY:
        async def _cerebras_8b(c, q, ctx):
            return await call_openai_compat(c, "https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "llama3.1-8b", q, ctx)
        providers.append(Provider("Cerebras (llama3.1-8b)", True, _cerebras_8b))

    # Cerebras gpt-oss-120b (quality + speed)
    if CEREBRAS_KEY:
        async def _cerebras_120b(c, q, ctx):
            return await call_openai_compat(c, "https://api.cerebras.ai/v1/chat/completions", CEREBRAS_KEY, "gpt-oss-120b", q, ctx)
        providers.append(Provider("Cerebras (gpt-oss-120b)", True, _cerebras_120b))

    # NVIDIA NIM (Kimi K2)
    if NVIDIA_KEY:
        async def _nvidia(c, q, ctx):
            return await call_openai_compat(c, "https://integrate.api.nvidia.com/v1/chat/completions", NVIDIA_KEY, "moonshotai/kimi-k2-instruct", q, ctx)
        providers.append(Provider("NVIDIA NIM (kimi-k2)", True, _nvidia))

    # Gemini
    if GOOGLE_KEY:
        providers.append(Provider("Gemini (2.5-flash)", True, call_gemini))

    # OpenRouter
    if OPENROUTER_KEY:
        async def _or(c, q, ctx):
            return await call_openai_compat(
                c, "https://openrouter.ai/api/v1/chat/completions", OPENROUTER_KEY,
                "openrouter/auto", q, ctx,
                extra_headers={"HTTP-Referer": "https://atlasux.cloud", "X-Title": "Atlas UX Eval"},
            )
        providers.append(Provider("OpenRouter (auto)", True, _or))

    # Anthropic
    if ANTHROPIC_KEY:
        providers.append(Provider("Anthropic (haiku)", True, call_anthropic))

    # Swarms
    if SWARMS_KEY:
        providers.append(Provider("Swarms (gpt-4o)", True, call_swarms))

    return providers


# ---------------------------------------------------------------------------
# Main evaluation
# ---------------------------------------------------------------------------

async def main():
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║    Atlas UX — RAGAS Quality Evaluation Benchmark           ║")
    print("╚══════════════════════════════════════════════════════════════╝")

    providers = build_providers()
    print(f"\nProviders: {len(providers)}")
    print(f"Test cases: {len(EVAL_DATASET)}")
    print(f"Total evaluations: {len(providers) * len(EVAL_DATASET)}")
    print(f"Judge: RAGAS (OpenAI GPT-4o-mini evaluator)\n")

    # Set up RAGAS evaluator LLM + embeddings
    evaluator_llm = LangchainLLMWrapper(ChatOpenAI(model="gpt-4o-mini", temperature=0.0))
    evaluator_embeddings = LangchainEmbeddingsWrapper(OpenAIEmbeddings(model="text-embedding-3-small"))

    metrics = [faithfulness, answer_relevancy, answer_correctness, context_precision]

    # Collect results per provider
    all_results: dict[str, dict] = {}

    async with httpx.AsyncClient() as client:
        for provider in providers:
            print(f"\n── {provider.name} {'─' * max(0, 50 - len(provider.name))}")
            samples = []
            latencies = []
            errors = 0

            for case in EVAL_DATASET:
                context_str = " ".join(case["contexts"])
                try:
                    answer, latency_ms = await provider.call(client, case["question"], context_str)
                    latencies.append(latency_ms)

                    if not answer or not answer.strip():
                        print(f"  ✗ {case['id']}: Empty response ({latency_ms:.0f}ms)")
                        errors += 1
                        continue

                    sample = SingleTurnSample(
                        user_input=case["question"],
                        response=answer,
                        reference=case["reference"],
                        retrieved_contexts=case["contexts"],
                    )
                    samples.append(sample)
                    print(f"  ✓ {case['id']}: Got response ({latency_ms:.0f}ms, {len(answer)} chars)")

                except Exception as e:
                    errors += 1
                    err_msg = str(e)[:100]
                    print(f"  ✗ {case['id']}: FAILED — {err_msg}")

            if not samples:
                print(f"  ⚠ No valid responses — skipping RAGAS evaluation")
                all_results[provider.name] = {
                    "faithfulness": 0, "context_precision": 0,
                    "answer_relevancy": 0, "answer_correctness": 0,
                    "avg_latency": 0, "errors": errors, "total": len(EVAL_DATASET),
                }
                continue

            # Run RAGAS evaluation
            print(f"  ⏳ Running RAGAS evaluation on {len(samples)} samples...")
            try:
                dataset = EvaluationDataset(samples=samples)
                result = evaluate(
                    dataset=dataset,
                    metrics=metrics,
                    llm=evaluator_llm,
                    embeddings=evaluator_embeddings,
                )

                scores = {
                    "faithfulness": result.get("faithfulness", 0) or 0,
                    "context_precision": result.get("context_precision", 0) or 0,
                    "answer_relevancy": result.get("answer_relevancy", 0) or 0,
                    "answer_correctness": result.get("answer_correctness", 0) or 0,
                    "avg_latency": sum(latencies) / len(latencies) if latencies else 0,
                    "errors": errors,
                    "total": len(EVAL_DATASET),
                }
                all_results[provider.name] = scores

                avg = (scores["faithfulness"] + scores["context_precision"] + scores["answer_relevancy"] + scores["answer_correctness"]) / 4
                print(f"  ✅ F={scores['faithfulness']:.2f} CP={scores['context_precision']:.2f} AR={scores['answer_relevancy']:.2f} AC={scores['answer_correctness']:.2f} AVG={avg:.2f}")

            except Exception as e:
                print(f"  ⚠ RAGAS eval failed: {e}")
                all_results[provider.name] = {
                    "faithfulness": 0, "context_precision": 0,
                    "answer_relevancy": 0, "answer_correctness": 0,
                    "avg_latency": sum(latencies) / len(latencies) if latencies else 0,
                    "errors": errors, "total": len(EVAL_DATASET),
                }

    # ----------------------------------------------------------------
    # Summary table
    # ----------------------------------------------------------------
    print("\n\n╔══════════════════════════════════════════════════════════════════════════════════════════╗")
    print("║                         RAGAS QUALITY EVALUATION RESULTS                               ║")
    print("╚══════════════════════════════════════════════════════════════════════════════════════════╝\n")

    # Sort by average score
    sorted_results = sorted(
        all_results.items(),
        key=lambda x: (x[1]["faithfulness"] + x[1]["context_precision"] + x[1]["answer_relevancy"] + x[1]["answer_correctness"]) / 4,
        reverse=True,
    )

    header = f"{'Provider':<32} {'Faith':>7} {'CtxPrc':>7} {'AnsRel':>7} {'AnsCor':>7} {'AVG':>7} {'Lat ms':>8} {'Err':>4}"
    print(header)
    print("─" * len(header))

    for name, s in sorted_results:
        avg = (s["faithfulness"] + s["context_precision"] + s["answer_relevancy"] + s["answer_correctness"]) / 4
        print(
            f"{name:<32} {s['faithfulness']:>7.2f} {s['context_precision']:>7.2f} "
            f"{s['answer_relevancy']:>7.2f} {s['answer_correctness']:>7.2f} "
            f"{avg:>7.2f} {s['avg_latency']:>8.0f} {s['errors']:>4}"
        )

    print("\n── Legend ───────────────────────────────────────────────────────")
    print("  Faith  = Faithfulness — are claims grounded in provided context?")
    print("  CtxPrc = Context Precision — is the context relevant to the question?")
    print("  AnsRel = Answer Relevancy — does the answer address the question?")
    print("  AnsCor = Answer Correctness — factual accuracy vs reference answer")
    print("  AVG    = Average of all four RAGAS metrics (0.0–1.0)")
    print("  Lat ms = Average latency per call")
    print("  Err    = Failed/empty responses\n")

    # Save results to JSON
    output_path = os.path.join("results", "ragas_eval_results.json")
    os.makedirs("results", exist_ok=True)
    with open(output_path, "w") as f:
        json.dump({"timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"), "results": all_results}, f, indent=2)
    print(f"Results saved to {output_path}")


if __name__ == "__main__":
    asyncio.run(main())
