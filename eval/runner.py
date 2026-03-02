#!/usr/bin/env python3
"""
Atlas UX Benchmark Evaluation Runner

Usage:
  python runner.py --benchmark hle --mode single --provider openai --model gpt-4o --budget 15.00
  python runner.py --benchmark hle --mode agentic --provider anthropic --model claude-opus-4-5 --budget 50.00
  python runner.py --benchmark hle --mode agentic --provider openai --model gpt-5.2 --no-tools
  python runner.py --benchmark gpqa --mode ensemble --models openai/gpt-4o,deepseek/deepseek-chat,google/gemini-2.0-flash
  python runner.py --benchmark aime --resume <run_id>

Modes:
  single   - One model, one-shot per question
  ensemble - N models, majority vote
  agentic  - Multi-turn with tool use, deep reasoning, and self-verification
  routed   - (experimental) Route to model based on question type
"""

import asyncio
import click
import json
import os
import sys
from datetime import datetime, timezone
from dataclasses import asdict
from tqdm import tqdm

# Add parent dir to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from client import AtlasClient
from checkpoint import CheckpointManager
from config import RESULTS_DIR, CHECKPOINTS_DIR

# ---------------------------------------------------------------------------
# Benchmark registry (lazy-loaded)
# ---------------------------------------------------------------------------

BENCHMARKS = {}


def get_benchmark(name):
    """Lazy-load and cache benchmark instances."""
    if not BENCHMARKS:
        from benchmarks.hle import HLEBenchmark
        from benchmarks.aime import AIMEBenchmark
        from benchmarks.gpqa import GPQABenchmark
        BENCHMARKS["hle"] = HLEBenchmark()
        BENCHMARKS["aime"] = AIMEBenchmark()
        BENCHMARKS["gpqa"] = GPQABenchmark()
    return BENCHMARKS[name]


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

@click.command()
@click.option("--benchmark", required=True, type=click.Choice(["hle", "aime", "gpqa"]), help="Benchmark to run")
@click.option("--mode", required=True, type=click.Choice(["single", "ensemble", "routed", "agentic"]), help="Assessment mode")
@click.option("--provider", default=None, help="Provider for single mode (e.g. openai)")
@click.option("--model", default=None, help="Model for single mode (e.g. gpt-4o-mini)")
@click.option("--models", default=None, help="Comma-separated provider/model pairs for ensemble (e.g. openai/gpt-4o,deepseek/deepseek-chat)")
@click.option("--budget", default=None, type=float, help="Max spend in USD")
@click.option("--resume", default=None, help="Run ID to resume from")
@click.option("--text-only", is_flag=True, help="Skip questions that require images")
@click.option("--limit", default=None, type=int, help="Limit number of questions (for testing)")
@click.option("--no-tools", is_flag=True, help="Disable tool use in agentic mode")
@click.option("--no-verify", is_flag=True, help="Disable verification step in agentic mode")
def main(benchmark, mode, provider, model, models, budget, resume, text_only, limit, no_tools, no_verify):
    """Run benchmark assessment through Atlas UX."""
    asyncio.run(run_assessment(benchmark, mode, provider, model, models, budget, resume, text_only, limit, no_tools, no_verify))


# ---------------------------------------------------------------------------
# Core assessment loop
# ---------------------------------------------------------------------------

async def run_assessment(benchmark_name, mode, provider, model, models_str, budget, resume, text_only, limit, no_tools=False, no_verify=False):
    # Validate mode-specific arguments
    if mode in ("single", "agentic") and (not provider or not model):
        click.echo(f"Error: --provider and --model required for {mode} mode")
        return
    if mode == "ensemble" and not models_str:
        click.echo("Error: --models required for ensemble mode")
        return

    # Generate or resume run ID
    if resume:
        run_id = resume
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_tag = model or "ensemble" or "routed"
        run_id = f"{benchmark_name}_{mode}_{model_tag}_{timestamp}"

    run_dir = os.path.join(RESULTS_DIR, run_id)
    checkpoint = CheckpointManager(run_dir)
    completed_ids = checkpoint.get_completed_ids()

    # Load benchmark
    click.echo(f"Loading benchmark: {benchmark_name}")
    bench = get_benchmark(benchmark_name)
    questions = bench.load()

    # Apply filters
    if text_only:
        questions = [q for q in questions if not bench.requires_vision(q)]
    if limit:
        questions = questions[:limit]

    # Filter out already-completed questions
    remaining = [q for q in questions if q.id not in completed_ids]

    click.echo(f"Total questions: {len(questions)}")
    click.echo(f"Already completed: {len(completed_ids)}")
    click.echo(f"Remaining: {len(remaining)}")
    click.echo(f"Run ID: {run_id}")
    click.echo(f"Results: {run_dir}")

    if not remaining:
        click.echo("All questions already completed!")
        _print_summary(checkpoint)
        return

    # Build strategy
    client = AtlasClient()

    if mode == "single":
        from strategies.single import SingleModelStrategy
        strategy = SingleModelStrategy(client, provider, model)
    elif mode == "ensemble":
        from strategies.ensemble import EnsembleStrategy
        model_list = []
        for m in models_str.split(","):
            parts = m.strip().split("/")
            if len(parts) == 2:
                model_list.append({"provider": parts[0], "model": parts[1]})
            else:
                click.echo(f"Error: invalid model format '{m}', expected 'provider/model'")
                return
        strategy = EnsembleStrategy(client, model_list)
    elif mode == "agentic":
        from strategies.agentic import AgenticStrategy
        strategy = AgenticStrategy(
            client, provider, model,
            enable_tools=not no_tools,
            enable_verification=not no_verify,
        )
    elif mode == "routed":
        from strategies.single import SingleModelStrategy
        strategy = SingleModelStrategy(client, provider=None, model=None)

    # Calculate cumulative cost from any prior results
    total_cost = sum(r.get("cost_usd", 0) for r in checkpoint.load_all_results())

    click.echo(f"\nStarting assessment...")
    pbar = tqdm(remaining, desc=f"{benchmark_name}/{mode}", unit="q")

    for question in pbar:
        # Budget check
        if budget and total_cost >= budget:
            click.echo(f"\nBudget cap reached: ${total_cost:.2f} >= ${budget:.2f}")
            break

        try:
            result = await strategy.evaluate(bench, question)
            result_dict = asdict(result)
            checkpoint.save_result(result_dict)
            total_cost += result.cost_usd

            # Update progress bar with rolling accuracy
            all_results = checkpoint.load_all_results()
            correct_count = sum(1 for r in all_results if r.get("correct"))
            accuracy = correct_count / len(all_results) if all_results else 0
            pbar.set_postfix({
                "acc": f"{accuracy:.1%}",
                "cost": f"${total_cost:.2f}",
                "last": "Y" if result.correct else "N",
            })

            # Rate limiting: stay under 25 req/min (2.4s between requests)
            if mode == "agentic":
                await asyncio.sleep(1.0)  # agentic already has internal delays from multi-turn
            elif mode == "ensemble":
                await asyncio.sleep(5.0)  # ensemble sends N requests at once
            else:
                await asyncio.sleep(2.5)

        except Exception as e:
            click.echo(f"\nError on {question.id}: {e}")
            continue

    await client.close()

    # Print summary
    _print_summary(checkpoint)

    # Save run metadata
    meta = {
        "run_id": run_id,
        "benchmark": benchmark_name,
        "mode": mode,
        "provider": provider,
        "model": model,
        "models": models_str,
        "budget": budget,
        "text_only": text_only,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(os.path.join(run_dir, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)


# ---------------------------------------------------------------------------
# Summary printer
# ---------------------------------------------------------------------------

def _print_summary(checkpoint):
    """Print a final results summary table."""
    results = checkpoint.load_all_results()
    if not results:
        click.echo("No results yet.")
        return

    correct = sum(1 for r in results if r.get("correct"))
    total = len(results)
    total_cost = sum(r.get("cost_usd", 0) for r in results)
    avg_latency = sum(r.get("latency_ms", 0) for r in results) / total

    click.echo(f"\n{'='*50}")
    click.echo(f"RESULTS SUMMARY")
    click.echo(f"{'='*50}")
    click.echo(f"Questions: {total}")
    click.echo(f"Correct:   {correct}")
    click.echo(f"Accuracy:  {correct/total:.1%}")
    click.echo(f"Cost:      ${total_cost:.2f}")
    click.echo(f"Avg Latency: {avg_latency:.0f}ms")
    click.echo(f"Cost/Correct: ${total_cost/correct:.2f}" if correct > 0 else "Cost/Correct: N/A")
    click.echo(f"{'='*50}")


if __name__ == "__main__":
    main()
