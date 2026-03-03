#!/usr/bin/env python3
"""
Agentic HLE benchmark runner using the Anthropic SDK directly.

Implements the full multi-turn reasoning pipeline:
  1. Domain expert role casting (20+ expert personas)
  2. Structured Chain-of-Thought with 6-step protocol
  3. Multi-turn tool use (calculator, Python interpreter, web search)
  4. Guided reflection with domain-specific verification
  5. Anti-hallucination safeguards

Usage:
  python3 run_hle_agentic.py --limit 1500
  python3 run_hle_agentic.py --limit 1500 --text-only
  python3 run_hle_agentic.py --limit 50 --resume <run_id>
"""

import asyncio
import json
import os
import sys
import time
import re
import base64
from datetime import datetime, timezone
from dataclasses import asdict

import anthropic
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(__file__))

from benchmarks.hle import HLEBenchmark
from benchmarks.base import BenchmarkResult

from prompts import (
    get_expert_role,
    get_cot_template,
    get_verification_prompt,
    get_oneshot_example,
    get_anti_hallucination_prompt,
    get_reflection_prompt,
)
from tools import safe_calculate, run_python, web_search

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL = "claude-sonnet-4-6"
PROVIDER = "anthropic"
RESULTS_DIR = "./results"

# Agentic-specific config
MAX_TOOL_TURNS = 5
MAX_TOKENS_PER_TURN = 4096

# Cost per million tokens for Sonnet 4.6
COST_PER_M_INPUT = 3.00
COST_PER_M_OUTPUT = 15.00

# Tool call regex patterns (same as agentic.py)
_TOOL_CALL_RE = re.compile(
    r"TOOL_CALL:\s*(calculator|python|web_search)\((.+?)\)",
    re.DOTALL,
)
_TOOL_BLOCK_RE = re.compile(
    r"```(calculator|python|web_search)\n(.*?)```",
    re.DOTALL,
)


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


# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------

def extract_tool_calls(text: str) -> list[tuple[str, str]]:
    """Extract tool calls from model response text."""
    calls = []
    for match in _TOOL_CALL_RE.finditer(text):
        calls.append((match.group(1).strip(), match.group(2).strip()))
    for match in _TOOL_BLOCK_RE.finditer(text):
        calls.append((match.group(1).strip(), match.group(2).strip()))
    return calls


def execute_tools(calls: list[tuple[str, str]]) -> list[tuple[str, str, str]]:
    """Execute tool calls and return results."""
    results = []
    for name, args in calls:
        try:
            if name == "calculator":
                result = safe_calculate(args)
            elif name == "python":
                result = run_python(args)
            elif name == "web_search":
                result = web_search(args)
            else:
                result = f"ERROR: unknown tool '{name}'"
        except Exception as e:
            result = f"ERROR: {type(e).__name__}: {e}"
        results.append((name, args, result))
    return results


# ---------------------------------------------------------------------------
# System prompt builder
# ---------------------------------------------------------------------------

def build_system_prompt(subject: str, question_type: str) -> str:
    """Assemble the full system prompt from expert role + CoT + tools + anti-hallucination."""
    role = get_expert_role(subject)
    anti_hallucination = get_anti_hallucination_prompt()
    cot = get_cot_template(question_type, subject)

    parts = [
        role["identity"],
        "",
        "DOMAIN-SPECIFIC REASONING GUIDELINES:",
        role["heuristics"],
        "",
        "COMMON PITFALLS TO AVOID:",
        role["pitfalls"],
        "",
        anti_hallucination,
        "",
        "AVAILABLE TOOLS — You may invoke these during your reasoning:",
        "",
        "1. CALCULATOR: For mathematical computations.",
        "   Usage: TOOL_CALL: calculator(<expression>)",
        "   Example: TOOL_CALL: calculator(sqrt(2) * pi)",
        "",
        "2. PYTHON CODE INTERPRETER: For complex calculations or data manipulation.",
        "   Usage: TOOL_CALL: python(<code>)",
        "   Example: TOOL_CALL: python(print(sum(1/n**2 for n in range(1, 1001))))",
        "",
        "3. WEB SEARCH: For factual information retrieval on obscure topics.",
        "   Usage: TOOL_CALL: web_search(<query>)",
        "   Example: TOOL_CALL: web_search(Treaty of Tordesillas year signed)",
        "",
        "Use tools proactively — especially calculator/python for ANY numerical",
        "computation and web_search for factual claims you're uncertain about.",
        "Do NOT try to do complex arithmetic in your head.",
        "",
        cot,
    ]

    return "\n".join(parts)


def build_user_message(q, subject: str, question_type: str) -> str:
    """Build the user message with one-shot example and question."""
    parts = []

    # One-shot example
    oneshot = get_oneshot_example(subject, question_type)
    if oneshot:
        parts.append(oneshot)
        parts.append("\n---\n")
        parts.append("Now answer the following question using the same structured reasoning approach:\n")

    # Image description prompt
    if q.image is not None:
        parts.append(
            "[An image is attached to this question. Analyze it carefully "
            "as part of your reasoning. Describe what you observe before "
            "proceeding with your analysis.]\n"
        )

    # Question type instructions
    if question_type == "multiple_choice":
        parts.append(
            "This is a MULTIPLE CHOICE question. After your reasoning, "
            "respond with ONLY the letter of the correct answer.\n"
        )
    else:
        parts.append(
            "This is a SHORT ANSWER question. After your reasoning, "
            "respond with ONLY the answer value (number, word, name, etc.).\n"
        )

    parts.append(f"Question: {q.question}")
    parts.append(
        "\n\nRemember: Follow the reasoning protocol exactly. "
        "Use tools if you need to calculate or look up information. "
        "Do NOT jump to conclusions. "
        "End with:\nANSWER: <your answer>\nCONFIDENCE: <0.0 to 1.0>"
    )

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Single question evaluation
# ---------------------------------------------------------------------------

def calc_cost(tokens_in: int, tokens_out: int) -> float:
    return (tokens_in / 1_000_000) * COST_PER_M_INPUT + (tokens_out / 1_000_000) * COST_PER_M_OUTPUT


async def evaluate_question(client, bench: HLEBenchmark, q, pbar_desc: str = "") -> dict:
    """Run the full agentic pipeline on a single question."""
    total_cost = 0.0
    total_tokens_in = 0
    total_tokens_out = 0
    all_responses = []
    api_calls = 0
    tools_used = []

    subject = q.metadata.get("subject", "unknown")
    q_type = q.metadata.get("question_type", "short_answer")

    # Build system prompt
    system_prompt = build_system_prompt(subject, q_type)

    # Build user message content blocks
    user_text = build_user_message(q, subject, q_type)
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

    content_blocks.append({"type": "text", "text": user_text})

    # Conversation messages (Anthropic format: no system role in messages)
    messages = [{"role": "user", "content": content_blocks}]

    # ── Turn 1: Main reasoning ──────────────────────────────────────
    start = time.perf_counter()
    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS_PER_TURN,
        system=system_prompt,
        messages=messages,
    )
    elapsed = time.perf_counter() - start
    api_calls += 1

    assistant_text = response.content[0].text if response.content else ""
    total_tokens_in += response.usage.input_tokens
    total_tokens_out += response.usage.output_tokens
    total_cost += calc_cost(response.usage.input_tokens, response.usage.output_tokens)
    all_responses.append(assistant_text)

    # ── Tool use loop ───────────────────────────────────────────────
    messages.append({"role": "assistant", "content": assistant_text})

    for turn in range(MAX_TOOL_TURNS):
        tool_calls = extract_tool_calls(assistant_text)
        if not tool_calls:
            break

        # Execute tools
        tool_results = execute_tools(tool_calls)
        for name, args, result in tool_results:
            tools_used.append(name)

        tool_msg = "TOOL RESULTS:\n" + "\n".join(
            f"- {name}({args[:80]}): {result}"
            for name, args, result in tool_results
        )

        messages.append({
            "role": "user",
            "content": tool_msg + "\n\nContinue your reasoning with these results."
        })

        # Rate limit between tool turns
        await asyncio.sleep(1.0)

        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS_PER_TURN,
            system=system_prompt,
            messages=messages,
        )
        api_calls += 1

        assistant_text = response.content[0].text if response.content else ""
        total_tokens_in += response.usage.input_tokens
        total_tokens_out += response.usage.output_tokens
        total_cost += calc_cost(response.usage.input_tokens, response.usage.output_tokens)
        all_responses.append(assistant_text)
        messages.append({"role": "assistant", "content": assistant_text})

    # ── Guided reflection turn ──────────────────────────────────────
    reflection = get_reflection_prompt(subject)
    messages.append({"role": "user", "content": reflection})

    await asyncio.sleep(1.0)

    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS_PER_TURN,
        system=system_prompt,
        messages=messages,
    )
    api_calls += 1

    reflection_text = response.content[0].text if response.content else ""
    total_tokens_in += response.usage.input_tokens
    total_tokens_out += response.usage.output_tokens
    total_cost += calc_cost(response.usage.input_tokens, response.usage.output_tokens)
    all_responses.append(reflection_text)

    total_elapsed_ms = (time.perf_counter() - start) * 1000

    # ── Extract final answer ────────────────────────────────────────
    # Use the LAST response that contains ANSWER:
    final_text = ""
    for resp_text in reversed(all_responses):
        if "ANSWER:" in resp_text.upper():
            final_text = resp_text
            break
    if not final_text:
        final_text = all_responses[-1]

    extracted = bench.extract_answer(final_text, q)
    is_correct = bench.score(extracted, q)
    confidence = bench.extract_confidence(final_text)

    result = BenchmarkResult(
        question_id=q.id,
        model_used=MODEL,
        provider_used=PROVIDER,
        raw_response="\n---TURN---\n".join(all_responses),
        extracted_answer=extracted,
        correct=is_correct,
        latency_ms=round(total_elapsed_ms, 2),
        tokens_in=total_tokens_in,
        tokens_out=total_tokens_out,
        cost_usd=round(total_cost, 6),
        confidence=confidence,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    result_dict = asdict(result)
    result_dict["api_calls"] = api_calls
    result_dict["tools_used"] = tools_used
    result_dict["subject"] = subject
    result_dict["strategy"] = "agentic"

    return result_dict


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------

async def run_hle_agentic(limit: int | None = None, text_only: bool = False, resume_id: str | None = None):
    api_key = load_api_key()
    client = anthropic.Anthropic(api_key=api_key)

    # Generate run ID
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_id = resume_id or f"hle_agentic_{MODEL}_{timestamp}"
    run_dir = os.path.join(RESULTS_DIR, run_id)
    os.makedirs(run_dir, exist_ok=True)

    # Check for already-completed questions (for resume)
    completed_ids = set()
    if resume_id:
        for fname in os.listdir(run_dir):
            if fname.startswith("hle_") and fname.endswith(".json"):
                completed_ids.add(fname.replace(".json", ""))
        print(f"Resuming run {run_id} — {len(completed_ids)} questions already done")

    # Load benchmark
    print(f"Loading HLE benchmark from HuggingFace...")
    bench = HLEBenchmark()
    questions = bench.load()

    if text_only:
        questions = [q for q in questions if not bench.requires_vision(q)]
        print(f"Text-only mode: {len(questions)} questions (images skipped)")

    if limit:
        questions = questions[:limit]

    # Filter out already completed
    if completed_ids:
        questions = [q for q in questions if q.id not in completed_ids]

    total_questions = limit or len(questions) + len(completed_ids)

    print(f"\n{'='*60}")
    print(f"  AGENTIC HLE BENCHMARK — {MODEL}")
    print(f"{'='*60}")
    print(f"  Strategy:    Orchestrator (multi-turn agentic)")
    print(f"  Pipeline:    Expert Role → CoT → Tools → Reflection")
    print(f"  Questions:   {len(questions)} remaining / {total_questions} total")
    print(f"  Run ID:      {run_id}")
    print(f"  Results:     {run_dir}")
    print(f"  Est. cost:   ~${len(questions) * 0.05:.2f} ({len(questions)} × ~$0.05/q)")
    print(f"{'='*60}\n")

    results = []
    correct_count = 0
    total_cost = 0.0
    total_api_calls = 0
    error_count = 0

    # Load existing results for running totals
    if completed_ids:
        for fname in os.listdir(run_dir):
            if fname.startswith("hle_") and fname.endswith(".json"):
                with open(os.path.join(run_dir, fname)) as f:
                    r = json.load(f)
                    results.append(r)
                    if r.get("correct"):
                        correct_count += 1
                    total_cost += r.get("cost_usd", 0)
                    total_api_calls += r.get("api_calls", 0)

    pbar = tqdm(questions, desc="HLE-Agentic", unit="q")

    for q in pbar:
        try:
            result = await evaluate_question(client, bench, q)
            results.append(result)

            if result["correct"]:
                correct_count += 1
            total_cost += result["cost_usd"]
            total_api_calls += result["api_calls"]

            # Save incrementally
            result_file = os.path.join(run_dir, f"{q.id}.json")
            with open(result_file, "w") as f:
                json.dump(result, f, indent=2)

            # Update progress
            accuracy = correct_count / len(results) if results else 0
            pbar.set_postfix({
                "acc": f"{accuracy:.1%}",
                "cost": f"${total_cost:.2f}",
                "calls": total_api_calls,
                "last": "Y" if result["correct"] else "N",
                "tools": len(result.get("tools_used", [])),
            })

            # Rate limit between questions (agentic uses multiple calls per q)
            await asyncio.sleep(2.0)

        except anthropic.RateLimitError:
            print(f"\nRate limited on {q.id} — waiting 60s...")
            await asyncio.sleep(60.0)
            # Retry once
            try:
                result = await evaluate_question(client, bench, q)
                results.append(result)
                if result["correct"]:
                    correct_count += 1
                total_cost += result["cost_usd"]
                total_api_calls += result["api_calls"]
                result_file = os.path.join(run_dir, f"{q.id}.json")
                with open(result_file, "w") as f:
                    json.dump(result, f, indent=2)
            except Exception as e2:
                print(f"\nRetry also failed on {q.id}: {e2}")
                error_count += 1
                continue

        except Exception as e:
            print(f"\nError on {q.id}: {e}")
            error_count += 1
            await asyncio.sleep(5.0)
            continue

    # ---------------------------------------------------------------------------
    # Summary
    # ---------------------------------------------------------------------------

    total = len(results)
    accuracy = correct_count / total if total else 0
    avg_latency = sum(r["latency_ms"] for r in results) / total if total else 0
    avg_api_calls = total_api_calls / total if total else 0
    avg_cost_per_q = total_cost / total if total else 0

    # Tool usage stats
    all_tools = []
    for r in results:
        all_tools.extend(r.get("tools_used", []))
    tool_counts = {}
    for t in all_tools:
        tool_counts[t] = tool_counts.get(t, 0) + 1

    # Subject breakdown
    subject_stats = {}
    for r in results:
        subj = r.get("subject", "unknown")
        if subj not in subject_stats:
            subject_stats[subj] = {"total": 0, "correct": 0}
        subject_stats[subj]["total"] += 1
        if r.get("correct"):
            subject_stats[subj]["correct"] += 1

    summary = {
        "run_id": run_id,
        "benchmark": "hle",
        "strategy": "agentic",
        "model": MODEL,
        "provider": PROVIDER,
        "total_questions": total,
        "correct": correct_count,
        "accuracy": round(accuracy, 4),
        "accuracy_pct": f"{accuracy:.1%}",
        "total_cost_usd": round(total_cost, 4),
        "avg_cost_per_question": round(avg_cost_per_q, 4),
        "avg_latency_ms": round(avg_latency, 1),
        "avg_api_calls_per_question": round(avg_api_calls, 2),
        "total_api_calls": total_api_calls,
        "cost_per_correct": round(total_cost / correct_count, 4) if correct_count else None,
        "errors": error_count,
        "tool_usage": tool_counts,
        "subject_breakdown": {
            k: {**v, "accuracy": round(v["correct"] / v["total"], 4) if v["total"] else 0}
            for k, v in sorted(subject_stats.items(), key=lambda x: x[1]["total"], reverse=True)
        },
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
    print(f"\n{'='*60}")
    print(f"  HLE AGENTIC RESULTS — {MODEL}")
    print(f"{'='*60}")
    print(f"  Strategy:      Orchestrator (multi-turn)")
    print(f"  Questions:     {total}")
    print(f"  Correct:       {correct_count}")
    print(f"  Accuracy:      {accuracy:.1%}")
    print(f"  Total Cost:    ${total_cost:.2f}")
    print(f"  Avg Cost/Q:    ${avg_cost_per_q:.4f}")
    print(f"  Avg Latency:   {avg_latency:.0f}ms")
    print(f"  Avg API Calls: {avg_api_calls:.1f} per question")
    print(f"  Total Calls:   {total_api_calls}")
    print(f"  Errors:        {error_count}")
    if correct_count:
        print(f"  Cost/Correct:  ${total_cost/correct_count:.4f}")
    print(f"{'='*60}")

    if tool_counts:
        print(f"\n  Tool Usage:")
        for tool, count in sorted(tool_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"    {tool}: {count} calls")

    print(f"\n  Top Subjects:")
    for subj, stats in sorted(subject_stats.items(), key=lambda x: x[1]["total"], reverse=True)[:10]:
        subj_acc = stats["correct"] / stats["total"] if stats["total"] else 0
        print(f"    {subj}: {stats['correct']}/{stats['total']} ({subj_acc:.0%})")

    print(f"\n  Results saved to: {run_dir}")

    return summary


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run HLE benchmark — Agentic mode via Anthropic")
    parser.add_argument("--limit", type=int, default=None, help="Limit questions")
    parser.add_argument("--text-only", action="store_true", help="Skip image questions")
    parser.add_argument("--resume", type=str, default=None, help="Resume a previous run by ID")
    args = parser.parse_args()

    asyncio.run(run_hle_agentic(limit=args.limit, text_only=args.text_only, resume_id=args.resume))
