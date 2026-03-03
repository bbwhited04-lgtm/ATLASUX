"""
AIME 2025 benchmark.

Dataset : opencompass/AIME2025 on HuggingFace
Size    : 30 problems (15 AIME I + 15 AIME II)
Answers : integers in the range 000-999
Scoring : exact integer match
"""

from __future__ import annotations

import re

from datasets import load_dataset

from .base import Benchmark, BenchmarkQuestion


class AIMEBenchmark(Benchmark):
    """
    Loads and evaluates the AIME 2025 math competition problems.

    Every answer is an integer between 0 and 999 (inclusive).  The model
    is prompted to show its work and then emit a strictly formatted
    ``ANSWER: <integer>`` line.  Scoring is exact integer equality.
    """

    # ------------------------------------------------------------------
    # Identity
    # ------------------------------------------------------------------

    def name(self) -> str:
        return "aime"

    def dataset_id(self) -> str:
        return "opencompass/AIME2025"

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def load(self, cache_dir: str = "./data") -> list[BenchmarkQuestion]:
        """
        Pull the dataset from HuggingFace and normalise it.

        The dataset may use different field names across revisions, so we
        fall back through ``problem`` / ``question`` / ``input`` for the
        problem statement and always coerce the answer to a string.
        """
        questions: list[BenchmarkQuestion] = []
        idx = 0

        for config in ("AIME2025-I", "AIME2025-II"):
            ds = load_dataset(
                "opencompass/AIME2025", config, split="test", cache_dir=cache_dir
            )
            for row in ds:
                problem = (
                    row.get("problem")
                    or row.get("question")
                    or row.get("input", "")
                )
                answer = str(row.get("answer", "")).strip()

                questions.append(
                    BenchmarkQuestion(
                        id=f"aime_{idx}",
                        question=problem,
                        choices=None,
                        answer=answer,
                        answer_type="integer",
                        metadata={
                            "config": config,
                            "problem_type": row.get("problem_type", "unknown"),
                            "problem_idx": row.get("problem_idx", idx),
                        },
                    )
                )
                idx += 1

        return questions

    # ------------------------------------------------------------------
    # Prompt formatting
    # ------------------------------------------------------------------

    def format_prompt(self, q: BenchmarkQuestion) -> list[dict]:
        prompt = (
            "Solve this math competition problem step by step.\n\n"
            "Your answer MUST be an integer between 0 and 999.\n\n"
            "Show your complete work, then give your final answer in "
            "EXACTLY this format:\n"
            "ANSWER: <integer>\n\n"
            f"Problem: {q.question}"
        )
        return [{"role": "user", "content": prompt}]

    # ------------------------------------------------------------------
    # Answer extraction
    # ------------------------------------------------------------------

    def extract_answer(self, response: str, q: BenchmarkQuestion) -> str:
        """
        Parse the integer answer from the model's response.

        Primary strategy: look for ``ANSWER: <digits>``.
        Fallback: grab the last 1-3 digit number in the response.
        """
        match = re.search(r"ANSWER:\s*(\d+)", response, re.IGNORECASE)
        if match:
            return match.group(1)
        # Fallback — last standalone 1-3 digit number.
        numbers = re.findall(r"\b(\d{1,3})\b", response)
        return numbers[-1] if numbers else ""

    # ------------------------------------------------------------------
    # Scoring
    # ------------------------------------------------------------------

    def score(self, extracted: str, q: BenchmarkQuestion) -> bool:
        """Exact integer equality."""
        try:
            return int(extracted) == int(q.answer)
        except (ValueError, TypeError):
            return False
