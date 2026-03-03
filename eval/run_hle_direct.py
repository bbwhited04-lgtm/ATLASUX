#!/usr/bin/env python3
"""
Direct HLE benchmark runner using the Anthropic SDK.

Bypasses the Atlas UX API layer to call Claude directly for benchmark scoring.

Usage:
  python run_hle_direct.py --limit 50
  python run_hle_direct.py --limit 50 --text-only
  python run_hle_direct.py  # full benchmark (~2500 questions)
"""

import asyncio
import json
import os
import sys
import time
import base64
from datetime import datetime, timezone
from dataclasses import asdict

import anthropic
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(__file__))

from benchmarks.hle import HLEBenchmark
from benchmarks.base import BenchmarkResult

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL = "claude-sonnet-4-6"
PROVIDER = "anthropic"
RESULTS_DIR = "./results"

# Load API key from backend .env or environment
def load_api_key():
    key = os.environ.get("ANTHROPIC_API_KEY")
    if key:
        return key
    # Try loading from backend .env
    env_path = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("ANTHROPIC_API_KEY="):
                    return line.split("=", 1)[1].strip()
    raise RuntimeError("ANTHROPIC_API_KEY not found in environment or backend/.env")


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------

async def run_hle(limit: int | None = None, text_only: bool = False):
    api_key = load_api_key()
    client = anthropic.Anthropic(api_key=api_key)

    # Generate run ID
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_id = f"hle_direct_{MODEL}_{timestamp}"
    run_dir = os.path.join(RESULTS_DIR, run_id)
    os.makedirs(run_dir, exist_ok=True)

    # Load benchmark
    print(f"Loading HLE benchmark from HuggingFace...")
    bench = HLEBenchmark()
    questions = bench.load()

    if text_only:
        questions = [q for q in questions if not bench.requires_vision(q)]
        print(f"Text-only mode: {len(questions)} questions (images skipped)")

    if limit:
        questions = questions[:limit]

    print(f"Model: {MODEL}")
    print(f"Questions: {len(questions)}")
    print(f"Run ID: {run_id}")
    print(f"Results: {run_dir}")

    results = []
    correct_count = 0
    total_cost = 0.0

    pbar = tqdm(questions, desc="HLE", unit="q")

    for q in pbar:
        try:
            # Build prompt
            messages = bench.format_prompt(q)
            user_content = messages[0]["content"]

            # Build Anthropic message content
            content_blocks = []

            # Add image if present
            if q.image is not None:
                img_b64 = base64.b64encode(q.image).decode("utf-8")
                content_blocks.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": img_b64,
                    },
                })

            content_blocks.append({"type": "text", "text": user_content})

            # Call Anthropic
            start = time.perf_counter()
            response = client.messages.create(
                model=MODEL,
                max_tokens=2048,
                messages=[{"role": "user", "content": content_blocks}],
            )
            elapsed_ms = (time.perf_counter() - start) * 1000

            # Extract response text
            raw_response = response.content[0].text if response.content else ""

            # Extract answer and score
            extracted = bench.extract_answer(raw_response, q)
            is_correct = bench.score(extracted, q)
            confidence = bench.extract_confidence(raw_response)

            # Cost calculation
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
                confidence=confidence,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
            results.append(asdict(result))

            # Save each result incrementally
            result_file = os.path.join(run_dir, f"{q.id}.json")
            with open(result_file, "w") as f:
                json.dump(asdict(result), f, indent=2)

            # Update progress bar
            accuracy = correct_count / len(results) if results else 0
            pbar.set_postfix({
                "acc": f"{accuracy:.1%}",
                "cost": f"${total_cost:.2f}",
                "last": "Y" if is_correct else "N",
            })

            # Rate limit: ~20 req/min
            await asyncio.sleep(3.0)

        except Exception as e:
            print(f"\nError on {q.id}: {e}")
            await asyncio.sleep(5.0)
            continue

    # ---------------------------------------------------------------------------
    # Summary
    # ---------------------------------------------------------------------------

    total = len(results)
    accuracy = correct_count / total if total else 0
    avg_latency = sum(r["latency_ms"] for r in results) / total if total else 0

    summary = {
        "run_id": run_id,
        "benchmark": "hle",
        "model": MODEL,
        "provider": PROVIDER,
        "total_questions": total,
        "correct": correct_count,
        "accuracy": round(accuracy, 4),
        "accuracy_pct": f"{accuracy:.1%}",
        "total_cost_usd": round(total_cost, 4),
        "avg_latency_ms": round(avg_latency, 1),
        "cost_per_correct": round(total_cost / correct_count, 4) if correct_count else None,
        "text_only": text_only,
        "limit": limit,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }

    # Save summary
    with open(os.path.join(run_dir, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)

    # Save all results
    with open(os.path.join(run_dir, "all_results.json"), "w") as f:
        json.dump(results, f, indent=2)

    # Print summary
    print(f"\n{'='*50}")
    print(f"HLE RESULTS — {MODEL}")
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

    return summary


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run HLE benchmark directly via Anthropic")
    parser.add_argument("--limit", type=int, default=None, help="Limit questions")
    parser.add_argument("--text-only", action="store_true", help="Skip image questions")
    args = parser.parse_args()

    asyncio.run(run_hle(limit=args.limit, text_only=args.text_only))
