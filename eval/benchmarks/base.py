"""
Abstract base class for all Atlas UX benchmarks.

Every concrete benchmark (MMLU, GPQA, MathVista, etc.) inherits from
``Benchmark`` and implements the six required methods.  The eval runner
treats all benchmarks uniformly through this interface.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# Data containers
# ---------------------------------------------------------------------------

@dataclass
class BenchmarkQuestion:
    """A single question from a benchmark dataset."""

    id: str
    question: str
    choices: list[str] | None  # Multiple-choice options, or None for free-form
    answer: str                # Ground-truth answer
    answer_type: str           # "mc_letter", "integer", "float", "text"
    image: bytes | None = None # Raw image bytes when vision is required
    metadata: dict = field(default_factory=dict)


@dataclass
class BenchmarkResult:
    """The outcome of running a single question through a model."""

    question_id: str
    model_used: str
    provider_used: str
    raw_response: str
    extracted_answer: str
    correct: bool
    latency_ms: float
    tokens_in: int | None
    tokens_out: int | None
    cost_usd: float
    confidence: float | None = None
    timestamp: str = ""


# ---------------------------------------------------------------------------
# Abstract benchmark
# ---------------------------------------------------------------------------

class Benchmark(ABC):
    """Interface that every benchmark implementation must satisfy."""

    @abstractmethod
    def name(self) -> str:
        """Human-readable benchmark name (e.g. ``'MMLU'``)."""
        ...

    @abstractmethod
    def dataset_id(self) -> str:
        """HuggingFace dataset identifier (e.g. ``'cais/mmlu'``)."""
        ...

    @abstractmethod
    def load(self, cache_dir: str = "./data") -> list[BenchmarkQuestion]:
        """Download / cache the dataset and return a list of questions."""
        ...

    @abstractmethod
    def format_prompt(self, q: BenchmarkQuestion) -> list[dict]:
        """Convert a question into an OpenAI-style messages list.

        For vision questions the list should include an image_url content
        block alongside the text.
        """
        ...

    @abstractmethod
    def extract_answer(self, response: str, q: BenchmarkQuestion) -> str:
        """Parse the model's free-text response into a normalised answer string.

        For multiple-choice this would be a single uppercase letter; for
        numeric benchmarks a cleaned number string; etc.
        """
        ...

    @abstractmethod
    def score(self, extracted: str, q: BenchmarkQuestion) -> bool:
        """Return ``True`` if ``extracted`` matches the ground truth."""
        ...

    # -- optional helpers -------------------------------------------------

    def requires_vision(self, q: BenchmarkQuestion) -> bool:
        """Return ``True`` when the question includes an image."""
        return q.image is not None
