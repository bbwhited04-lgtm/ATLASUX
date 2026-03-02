"""
Humanity's Last Exam (HLE) benchmark.

Dataset : cais/hle on HuggingFace
Size    : ~2,500 questions (multiple-choice + short-answer)
Vision  : ~14 % of questions include an image
Scoring : binary exact match + confidence calibration
"""

from __future__ import annotations

import io
import re

from datasets import load_dataset

from .base import Benchmark, BenchmarkQuestion


class HLEBenchmark(Benchmark):
    """
    Loads and evaluates the Humanity's Last Exam dataset.

    The dataset contains expert-level questions spanning dozens of
    academic disciplines.  Questions are either multiple-choice
    (answer is a single letter) or short-answer (free-form text).
    About 14 % of questions include a companion image.
    """

    # ------------------------------------------------------------------
    # Identity
    # ------------------------------------------------------------------

    def name(self) -> str:
        return "hle"

    def dataset_id(self) -> str:
        return "cais/hle"

    # NOTE: requires_vision() is inherited from the base class, which
    # returns ``q.image is not None``.  That is correct for HLE — about
    # 14 % of questions carry an image.

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def load(self, cache_dir: str = "./data") -> list[BenchmarkQuestion]:
        """
        Pull the dataset from HuggingFace and normalise it into
        ``BenchmarkQuestion`` instances.

        HuggingFace fields used:
            question        – str
            answer          – str
            image           – PIL.Image or None
            subject         – str  (e.g. "mathematics", "physics")
            question_type   – str  ("multiple_choice" | "short_answer")

        For multiple-choice questions the answer choices are typically
        embedded in the question text itself.  We attempt to parse them
        out so the runner can present them cleanly.
        """
        ds = load_dataset("cais/hle", split="test", cache_dir=cache_dir)
        questions: list[BenchmarkQuestion] = []

        for i, row in enumerate(ds):
            # --- image ---------------------------------------------------
            image_bytes: bytes | None = None
            if row.get("image") is not None:
                buf = io.BytesIO()
                row["image"].save(buf, format="PNG")
                image_bytes = buf.getvalue()

            # --- answer type ---------------------------------------------
            answer_type = (
                "mc_letter"
                if row.get("question_type") == "multiple_choice"
                else "text"
            )

            # --- extract MC choices from question text -------------------
            choices: list[str] | None = None
            if answer_type == "mc_letter":
                # Pattern 1:  (A) … (B) … (C) …
                choice_matches = re.findall(
                    r"\(([A-E])\)\s*(.+?)(?=\([A-E]\)|$)",
                    row["question"],
                    re.DOTALL,
                )
                # Pattern 2:  A. … B. … C. …
                if not choice_matches:
                    choice_matches = re.findall(
                        r"^([A-E])\.\s*(.+?)$",
                        row["question"],
                        re.MULTILINE,
                    )
                if choice_matches:
                    choices = [m[1].strip() for m in choice_matches]

            questions.append(
                BenchmarkQuestion(
                    id=f"hle_{i}",
                    question=row["question"],
                    choices=choices,
                    answer=str(row["answer"]).strip(),
                    answer_type=answer_type,
                    image=image_bytes,
                    metadata={
                        "subject": row.get("subject", "unknown"),
                        "question_type": row.get("question_type", "unknown"),
                    },
                )
            )

        return questions

    # ------------------------------------------------------------------
    # Prompt formatting
    # ------------------------------------------------------------------

    def format_prompt(self, q: BenchmarkQuestion) -> list[dict]:
        """
        Build a single-turn user message requesting an answer and a
        self-reported confidence score.

        NOTE: The agentic strategy bypasses this method and constructs
        its own multi-turn prompt with role casting, CoT, and tool
        instructions. This method is still used by single/ensemble modes.

        Even for single mode, we now include a stronger reasoning prompt
        with domain awareness and structured output format.
        """
        subject = q.metadata.get("subject", "unknown")
        q_type = q.metadata.get("question_type", "short_answer")

        # Enhanced prompt with domain awareness and structured reasoning
        domain_hint = f"[Domain: {subject}] " if subject != "unknown" else ""

        if q_type == "multiple_choice":
            answer_fmt = (
                "This is a MULTIPLE CHOICE question. After your analysis, "
                "respond with ONLY the letter of the correct answer."
            )
        else:
            answer_fmt = (
                "This is a SHORT ANSWER question. After your analysis, "
                "respond with ONLY the answer value."
            )

        prompt = (
            f"{domain_hint}{answer_fmt}\n\n"
            "Approach this systematically:\n"
            "1. Identify what is being asked and the relevant domain knowledge.\n"
            "2. Consider multiple approaches before committing to one.\n"
            "3. Work through the problem step by step — do NOT jump to conclusions.\n"
            "4. Verify your answer satisfies all constraints in the question.\n"
            "5. If this is numerical, double-check your arithmetic.\n\n"
            "Format your final response EXACTLY as:\n"
            "ANSWER: <your answer>\n"
            "CONFIDENCE: <0.0 to 1.0>\n\n"
            f"Question: {q.question}"
        )
        return [{"role": "user", "content": prompt}]

    # ------------------------------------------------------------------
    # Answer extraction
    # ------------------------------------------------------------------

    def extract_answer(self, response: str, q: BenchmarkQuestion) -> str:
        """Parse ``ANSWER: <value>`` from the model's response."""
        match = re.search(
            r"ANSWER:\s*(.+?)(?:\n|CONFIDENCE:|$)", response, re.IGNORECASE
        )
        if match:
            return match.group(1).strip()
        # Fallback: return the last non-empty line.
        lines = [line.strip() for line in response.strip().split("\n") if line.strip()]
        return lines[-1] if lines else ""

    def extract_confidence(self, response: str) -> float | None:
        """Parse ``CONFIDENCE: <value>`` from the model's response."""
        match = re.search(r"CONFIDENCE:\s*([0-9.]+)", response, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None
        return None

    # ------------------------------------------------------------------
    # Scoring
    # ------------------------------------------------------------------

    def score(self, extracted: str, q: BenchmarkQuestion) -> bool:
        """Case-insensitive exact match after stripping whitespace."""
        return extracted.lower().strip() == q.answer.lower().strip()
