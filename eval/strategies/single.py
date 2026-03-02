"""
Single-model evaluation strategy.

Sends every benchmark question to one specific provider/model pair,
scores the response, and returns a ``BenchmarkResult``.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from benchmarks.base import Benchmark, BenchmarkQuestion, BenchmarkResult
from client import AtlasClient, ChatResponse


class SingleModelStrategy:
    """Run every question through one specific model."""

    def __init__(self, client: AtlasClient, provider: str, model: str):
        self.client = client
        self.provider = provider
        self.model = model

    async def evaluate(self, benchmark: Benchmark, question: BenchmarkQuestion) -> BenchmarkResult:
        """Send question to the specified model and score the response."""
        messages = benchmark.format_prompt(question)

        response = await self.client.chat(
            messages=messages,
            provider=self.provider,
            model=self.model,
        )

        extracted = benchmark.extract_answer(response.content, question)
        correct = benchmark.score(extracted, question)

        # Extract confidence if the benchmark supports it (e.g. HLE)
        confidence = None
        if hasattr(benchmark, "extract_confidence"):
            confidence = benchmark.extract_confidence(response.content)

        return BenchmarkResult(
            question_id=question.id,
            model_used=response.model,
            provider_used=response.provider,
            raw_response=response.content,
            extracted_answer=extracted,
            correct=correct,
            latency_ms=response.latency_ms,
            tokens_in=response.tokens_in,
            tokens_out=response.tokens_out,
            cost_usd=response.cost_usd,
            confidence=confidence,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
