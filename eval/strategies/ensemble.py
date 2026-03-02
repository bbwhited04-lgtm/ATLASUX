"""
Ensemble (majority-vote) evaluation strategy.

Sends each benchmark question to N models concurrently, collects their
extracted answers, and picks the majority-voted answer as the final result.
"""

from __future__ import annotations

import asyncio
from collections import Counter
from datetime import datetime, timezone

from benchmarks.base import Benchmark, BenchmarkQuestion, BenchmarkResult
from client import AtlasClient


class EnsembleStrategy:
    """Run each question through N models and majority-vote the answer."""

    def __init__(self, client: AtlasClient, models: list[dict]):
        """
        Parameters
        ----------
        client : AtlasClient
            The async API client to use for chat requests.
        models : list[dict]
            List of ``{"provider": str, "model": str}`` dicts describing
            the models to query for each question.
        """
        self.client = client
        self.models = models

    async def evaluate(self, benchmark: Benchmark, question: BenchmarkQuestion) -> BenchmarkResult:
        """Send question to all models concurrently, majority vote."""
        messages = benchmark.format_prompt(question)

        # Send to all models concurrently
        tasks = [
            self.client.chat(
                messages=messages,
                provider=m["provider"],
                model=m["model"],
            )
            for m in self.models
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect answers from successful responses
        answers: list[str] = []
        total_cost = 0.0
        total_latency = 0.0
        all_models: list[str] = []
        all_providers: list[str] = []

        for resp in responses:
            if isinstance(resp, Exception):
                continue
            extracted = benchmark.extract_answer(resp.content, question)
            answers.append(extracted)
            total_cost += resp.cost_usd
            total_latency = max(total_latency, resp.latency_ms)  # parallel = max latency
            all_models.append(resp.model)
            all_providers.append(resp.provider)

        if not answers:
            return BenchmarkResult(
                question_id=question.id,
                model_used="ensemble_failed",
                provider_used="none",
                raw_response="All models failed",
                extracted_answer="",
                correct=False,
                latency_ms=0,
                tokens_in=None,
                tokens_out=None,
                cost_usd=total_cost,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )

        # Majority vote: normalize to uppercase/stripped for comparison
        counter = Counter(a.upper().strip() for a in answers if a)
        if counter:
            ensemble_answer = counter.most_common(1)[0][0]
        else:
            ensemble_answer = answers[0] if answers else ""

        correct = benchmark.score(ensemble_answer, question)

        return BenchmarkResult(
            question_id=question.id,
            model_used=f"ensemble({','.join(all_models)})",
            provider_used=f"ensemble({','.join(all_providers)})",
            raw_response=f"Votes: {dict(counter)} | Models: {list(zip(all_models, answers))}",
            extracted_answer=ensemble_answer,
            correct=correct,
            latency_ms=total_latency,
            tokens_in=None,
            tokens_out=None,
            cost_usd=total_cost,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
