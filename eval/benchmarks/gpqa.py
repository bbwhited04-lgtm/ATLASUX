"""
GPQA Diamond benchmark.

Dataset : Idavidrein/gpqa on HuggingFace (diamond subset)
Size    : 198 graduate-level science questions
Format  : 4-way multiple choice (A / B / C / D)
Scoring : exact letter match
"""

from __future__ import annotations

import random
import re

from datasets import load_dataset

from .base import Benchmark, BenchmarkQuestion


class GPQABenchmark(Benchmark):
    """
    Loads and evaluates the GPQA Diamond subset.

    Questions are graduate-level science problems with four answer
    choices.  The dataset provides the correct answer text and three
    distractors separately; we shuffle them deterministically per
    question and record the correct letter.
    """

    # ------------------------------------------------------------------
    # Identity
    # ------------------------------------------------------------------

    def name(self) -> str:
        return "gpqa"

    def dataset_id(self) -> str:
        return "Idavidrein/gpqa"

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def load(self, cache_dir: str = "./data") -> list[BenchmarkQuestion]:
        """
        Pull the GPQA Diamond subset from HuggingFace.

        HuggingFace fields used:
            Question            – str
            Correct Answer      – str  (full text of the correct choice)
            Incorrect Answer 1  – str
            Incorrect Answer 2  – str
            Incorrect Answer 3  – str
            Subdomain           – str  (e.g. "Molecular Biology")

        The four choices are shuffled with a per-question deterministic
        seed so that results are reproducible across runs.
        """
        ds = load_dataset(
            "Idavidrein/gpqa",
            "gpqa_diamond",
            split="train",
            cache_dir=cache_dir,
        )
        questions: list[BenchmarkQuestion] = []

        for i, row in enumerate(ds):
            question_text = row.get("Question", "")
            correct = row.get("Correct Answer", "")
            incorrects = [
                row.get("Incorrect Answer 1", ""),
                row.get("Incorrect Answer 2", ""),
                row.get("Incorrect Answer 3", ""),
            ]

            # Deterministic shuffle so the correct-answer position is
            # consistent across runs but not always "A".
            all_choices = [correct] + incorrects
            rng = random.Random(i)
            rng.shuffle(all_choices)

            correct_idx = all_choices.index(correct)
            correct_letter = chr(65 + correct_idx)  # A, B, C, or D

            # Append formatted choice block to the question text.
            formatted_choices = ""
            for j, choice in enumerate(all_choices):
                formatted_choices += f"\n{chr(65 + j)}. {choice}"

            questions.append(
                BenchmarkQuestion(
                    id=f"gpqa_{i}",
                    question=question_text + formatted_choices,
                    choices=all_choices,
                    answer=correct_letter,
                    answer_type="mc_letter",
                    metadata={
                        "subject": row.get("Subdomain", "unknown"),
                        "correct_text": correct,
                    },
                )
            )

        return questions

    # ------------------------------------------------------------------
    # Prompt formatting
    # ------------------------------------------------------------------

    def format_prompt(self, q: BenchmarkQuestion) -> list[dict]:
        prompt = (
            "Answer this graduate-level science question.\n\n"
            "Think through it carefully, then provide your answer.\n\n"
            "Your FINAL line MUST be exactly: ANSWER: X\n"
            "where X is A, B, C, or D.\n\n"
            f"{q.question}"
        )
        return [{"role": "user", "content": prompt}]

    # ------------------------------------------------------------------
    # Answer extraction
    # ------------------------------------------------------------------

    def extract_answer(self, response: str, q: BenchmarkQuestion) -> str:
        """
        Parse the answer letter from the model's response.

        Primary strategy: look for ``ANSWER: <letter>``.
        Fallback: grab the last standalone A-D letter at the end of the
        response.
        """
        # Strict pattern first.
        match = re.search(r"ANSWER:\s*([A-Da-d])", response, re.IGNORECASE)
        if match:
            return match.group(1).upper()
        # Fallback — last standalone letter at end of text.
        match = re.search(r"\b([A-D])\b\s*$", response.strip())
        if match:
            return match.group(1).upper()
        return ""

    # ------------------------------------------------------------------
    # Scoring
    # ------------------------------------------------------------------

    def score(self, extracted: str, q: BenchmarkQuestion) -> bool:
        """Exact letter match (case-insensitive)."""
        return extracted.upper() == q.answer.upper()
