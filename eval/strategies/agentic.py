"""
Agentic multi-turn evaluation strategy.

Implements a full reasoning pipeline for PhD-level questions:
  1. Domain expert role casting
  2. Structured Chain-of-Thought decomposition
  3. Multi-turn tool use (calculator, code interpreter, web search)
  4. Self-verification before final answer
  5. Multi-modal analysis for image questions
  6. Anti-hallucination safeguards

This strategy sends multiple API calls per question (typically 2-4)
and is significantly more expensive than single-shot, but achieves
much higher accuracy on hard benchmarks like HLE.
"""

from __future__ import annotations

import re
import logging
from datetime import datetime, timezone

from benchmarks.base import Benchmark, BenchmarkQuestion, BenchmarkResult
from client import AtlasClient

from prompts import (
    get_expert_role,
    get_cot_template,
    get_verification_prompt,
    get_oneshot_example,
    get_anti_hallucination_prompt,
    get_reflection_prompt,
)
from tools import safe_calculate, run_python, web_search

logger = logging.getLogger(__name__)

# Max tool-use turns before forcing a final answer
_MAX_TOOL_TURNS = 5

# Regex patterns for tool call detection in model responses
_TOOL_CALL_RE = re.compile(
    r"TOOL_CALL:\s*(calculator|python|web_search)\((.+?)\)",
    re.DOTALL,
)

# Alternative format: ```tool\n...\n```
_TOOL_BLOCK_RE = re.compile(
    r"```(calculator|python|web_search)\n(.*?)```",
    re.DOTALL,
)


class AgenticStrategy:
    """Multi-turn agentic evaluation with tool use and deep reasoning."""

    def __init__(
        self,
        client: AtlasClient,
        provider: str,
        model: str,
        enable_tools: bool = True,
        enable_verification: bool = True,
        enable_multimodal: bool = True,
    ):
        self.client = client
        self.provider = provider
        self.model = model
        self.enable_tools = enable_tools
        self.enable_verification = enable_verification
        self.enable_multimodal = enable_multimodal

    async def evaluate(
        self,
        benchmark: Benchmark,
        question: BenchmarkQuestion,
    ) -> BenchmarkResult:
        """Run the full agentic pipeline on a single question."""
        total_cost = 0.0
        total_tokens_in = 0
        total_tokens_out = 0
        max_latency = 0.0
        all_responses: list[str] = []

        subject = question.metadata.get("subject", "unknown")
        q_type = question.metadata.get("question_type", "short_answer")

        # ── Build system prompt ──────────────────────────────────────
        system_prompt = self._build_system_prompt(subject, q_type)

        # ── Build user message ───────────────────────────────────────
        user_content = self._build_user_message(question, subject, q_type)

        messages: list[dict] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        # ── Main reasoning turn ──────────────────────────────────────
        response = await self.client.chat(
            messages=messages,
            provider=self.provider,
            model=self.model,
        )
        total_cost += response.cost_usd
        total_tokens_in += response.tokens_in or 0
        total_tokens_out += response.tokens_out or 0
        max_latency = max(max_latency, response.latency_ms)
        all_responses.append(response.content)

        # ── Tool use loop ────────────────────────────────────────────
        if self.enable_tools:
            assistant_text = response.content
            messages.append({"role": "assistant", "content": assistant_text})

            for turn in range(_MAX_TOOL_TURNS):
                tool_calls = self._extract_tool_calls(assistant_text)
                if not tool_calls:
                    break

                # Execute tools and build result message
                tool_results = self._execute_tools(tool_calls)
                tool_msg = "TOOL RESULTS:\n" + "\n".join(
                    f"- {name}({args[:80]}): {result}"
                    for name, args, result in tool_results
                )

                messages.append({"role": "user", "content": tool_msg + "\n\nContinue your reasoning with these results."})

                response = await self.client.chat(
                    messages=messages,
                    provider=self.provider,
                    model=self.model,
                )
                total_cost += response.cost_usd
                total_tokens_in += response.tokens_in or 0
                total_tokens_out += response.tokens_out or 0
                max_latency = max(max_latency, response.latency_ms)
                all_responses.append(response.content)
                assistant_text = response.content
                messages.append({"role": "assistant", "content": assistant_text})

        # ── Guided reflection turn ───────────────────────────────────
        if self.enable_verification:
            # Add the last assistant message if not already there
            if not messages or messages[-1].get("role") != "assistant":
                messages.append({"role": "assistant", "content": all_responses[-1]})

            reflection = get_reflection_prompt(subject)
            messages.append({"role": "user", "content": reflection})

            response = await self.client.chat(
                messages=messages,
                provider=self.provider,
                model=self.model,
            )
            total_cost += response.cost_usd
            total_tokens_in += response.tokens_in or 0
            total_tokens_out += response.tokens_out or 0
            max_latency = max(max_latency, response.latency_ms)
            all_responses.append(response.content)

        # ── Extract final answer ─────────────────────────────────────
        # Use the LAST response that contains ANSWER:
        final_text = ""
        for resp_text in reversed(all_responses):
            if "ANSWER:" in resp_text.upper():
                final_text = resp_text
                break
        if not final_text:
            final_text = all_responses[-1]

        extracted = benchmark.extract_answer(final_text, question)
        correct = benchmark.score(extracted, question)

        confidence = None
        if hasattr(benchmark, "extract_confidence"):
            confidence = benchmark.extract_confidence(final_text)

        return BenchmarkResult(
            question_id=question.id,
            model_used=self.model,
            provider_used=self.provider,
            raw_response="\n---TURN---\n".join(all_responses),
            extracted_answer=extracted,
            correct=correct,
            latency_ms=max_latency,
            tokens_in=total_tokens_in,
            tokens_out=total_tokens_out,
            cost_usd=total_cost,
            confidence=confidence,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    # ------------------------------------------------------------------
    # System prompt construction
    # ------------------------------------------------------------------

    def _build_system_prompt(self, subject: str, question_type: str) -> str:
        """Assemble the full system prompt from components."""
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
        ]

        if self.enable_tools:
            parts.extend([
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
            ])

        parts.extend(["", cot])

        return "\n".join(parts)

    # ------------------------------------------------------------------
    # User message construction
    # ------------------------------------------------------------------

    def _build_user_message(
        self,
        question: BenchmarkQuestion,
        subject: str,
        question_type: str,
    ) -> str:
        """Build the user message with optional one-shot example and image."""
        parts: list[str] = []

        # One-shot example
        oneshot = get_oneshot_example(subject, question_type)
        if oneshot:
            parts.append(oneshot)
            parts.append("\n---\n")
            parts.append("Now answer the following question using the same structured reasoning approach:\n")

        # Image description prompt (if applicable)
        if question.image is not None and self.enable_multimodal:
            parts.append(
                "[An image is attached to this question. Analyze it carefully "
                "as part of your reasoning. Describe what you observe before "
                "proceeding with your analysis.]\n"
            )

        # Question
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

        parts.append(f"Question: {question.question}")

        parts.append(
            "\n\nRemember: Follow the reasoning protocol exactly. "
            "Use tools if you need to calculate or look up information. "
            "Do NOT jump to conclusions. "
            "End with:\nANSWER: <your answer>\nCONFIDENCE: <0.0 to 1.0>"
        )

        return "\n".join(parts)

    # ------------------------------------------------------------------
    # Tool call extraction and execution
    # ------------------------------------------------------------------

    def _extract_tool_calls(self, text: str) -> list[tuple[str, str]]:
        """Extract tool calls from model response text.

        Returns list of (tool_name, arguments) tuples.
        """
        calls: list[tuple[str, str]] = []

        # Pattern 1: TOOL_CALL: tool_name(args)
        for match in _TOOL_CALL_RE.finditer(text):
            calls.append((match.group(1).strip(), match.group(2).strip()))

        # Pattern 2: ```tool_name\ncode\n```
        for match in _TOOL_BLOCK_RE.finditer(text):
            calls.append((match.group(1).strip(), match.group(2).strip()))

        return calls

    def _execute_tools(
        self,
        calls: list[tuple[str, str]],
    ) -> list[tuple[str, str, str]]:
        """Execute tool calls and return results.

        Returns list of (tool_name, args, result) tuples.
        """
        results: list[tuple[str, str, str]] = []

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
            logger.debug("Tool %s(%s) → %s", name, args[:50], result[:100])

        return results
