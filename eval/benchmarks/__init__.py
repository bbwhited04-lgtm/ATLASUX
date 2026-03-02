"""
Atlas UX Eval Harness — Benchmark definitions.

Each benchmark wraps a HuggingFace dataset and provides:
  - load()           → list[BenchmarkQuestion]
  - format_prompt()  → chat-style message list
  - extract_answer() → parsed answer string
  - score()          → bool
"""

from .base import Benchmark, BenchmarkQuestion, BenchmarkResult
from .hle import HLEBenchmark
from .aime import AIMEBenchmark
from .gpqa import GPQABenchmark

BENCHMARKS: dict[str, type[Benchmark]] = {
    "hle": HLEBenchmark,
    "aime": AIMEBenchmark,
    "gpqa": GPQABenchmark,
}

__all__ = [
    "Benchmark",
    "BenchmarkQuestion",
    "BenchmarkResult",
    "HLEBenchmark",
    "AIMEBenchmark",
    "GPQABenchmark",
    "BENCHMARKS",
]
