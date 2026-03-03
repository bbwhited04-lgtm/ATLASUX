#!/usr/bin/env python3
"""
Direct AIME 2025 benchmark runner using the Anthropic SDK.

30 problems (15 AIME I + 15 AIME II), integer answers 0-999.

Usage:
  python run_aime_direct.py
"""

import asyncio
import json
import os
import sys
import time
from datetime import datetime, timezone
from dataclasses import asdict

import anthropic
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(__file__))

from benchmarks.aime import AIMEBenchmark
from benchmarks.base import BenchmarkResult

MODEL = "claude-sonnet-4-6"
PROVIDER = "anthropic"
RESULTS_DIR = "./results"


def load_api_key():
    key = os.environ.get("ANTHROPIC_API_KEY")
    if key:
        return key
    env_path = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("ANTHROPIC_API_KEY="):
                    return line.split("=", 1)[1].strip()
    raise RuntimeError("ANTHROPIC_API_KEY not found in environment or backend/.env")


async def run_aime():
    api_key = load_api_key()
    client = anthropic.Anthropic(api_key=api_key)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_id = f"aime_direct_{MODEL}_{timestamp}"
    run_dir = os.path.join(RESULTS_DIR, run_id)
    os.makedirs(run_dir, exist_ok=True)

    print("Loading AIME 2025 benchmark from HuggingFace...")
    bench = AIMEBenchmark()
    questions = bench.load()

    print(f"Model: {MODEL}")
    print(f"Questions: {len(questions)}")
    print(f"Run ID: {run_id}")
    print(f"Results: {run_dir}")

    results = []
    correct_count = 0
    total_cost = 0.0

    pbar = tqdm(questions, desc="AIME", unit="q")

    for q in pbar:
        try:
            messages = bench.format_prompt(q)
            user_content = messages[0]["content"]

            start = time.perf_counter()
            response = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                messages=[{"role": "user", "content": user_content}],
            )
            elapsed_ms = (time.perf_counter() - start) * 1000

            raw_response = response.content[0].text if response.content else ""
            extracted = bench.extract_answer(raw_response, q)
            is_correct = bench.score(extracted, q)

            tokens_in = response.usage.input_tokens
            tokens_out = response.usage.output_tokens
            cost = (tokens_in / 1_000_000) * 3.00 + (tokens_out / 1_000_000) * 15.00

            if is_correct:
                correct_count += 1
            total_cost += cost

            result = BenchmarkResult(
                question_id=q.id,
                model_used=MODEL,
                provider_used=PROVIDER,
                raw_response=raw_response,
                extracted_answer=extracted,
                correct=is_correct,
                latency_ms=round(elapsed_ms, 2),
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                cost_usd=round(cost, 6),
                confidence=None,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            results.append(asdict(result))

            result_file = os.path.join(run_dir, f"{q.id}.json")
            with open(result_file, "w") as f:
                json.dump(asdict(result), f, indent=2)

            accuracy = correct_count / len(results) if results else 0
            pbar.set_postfix({
                "acc": f"{accuracy:.1%}",
                "cost": f"${total_cost:.2f}",
                "last": "Y" if is_correct else "N",
            })

            await asyncio.sleep(3.0)

        except Exception as e:
            print(f"\nError on {q.id}: {e}")
            await asyncio.sleep(5.0)
            continue

    total = len(results)
    accuracy = correct_count / total if total else 0
    avg_latency = sum(r["latency_ms"] for r in results) / total if total else 0

    summary = {
        "run_id": run_id,
        "benchmark": "aime",
        "model": MODEL,
        "provider": PROVIDER,
        "total_questions": total,
        "correct": correct_count,
        "accuracy": round(accuracy, 4),
        "accuracy_pct": f"{accuracy:.1%}",
        "total_cost_usd": round(total_cost, 4),
        "avg_latency_ms": round(avg_latency, 1),
        "cost_per_correct": round(total_cost / correct_count, 4) if correct_count else None,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }

    with open(os.path.join(run_dir, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)

    with open(os.path.join(run_dir, "all_results.json"), "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n{'='*50}")
    print(f"AIME 2025 RESULTS — {MODEL}")
    print(f"{'='*50}")
    print(f"Questions:     {total}")
    print(f"Correct:       {correct_count}")
    print(f"Accuracy:      {accuracy:.1%}")
    print(f"Total Cost:    ${total_cost:.2f}")
    print(f"Avg Latency:   {avg_latency:.0f}ms")
    if correct_count:
        print(f"Cost/Correct:  ${total_cost/correct_count:.4f}")
    print(f"{'='*50}")
    print(f"\nResults saved to: {run_dir}")


if __name__ == "__main__":
    asyncio.run(run_aime())
