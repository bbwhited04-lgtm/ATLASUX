"""
Atlas UX API client with async HTTP, retry logic, and cost tracking.

Usage:
    async with AtlasClient() as client:
        resp = await client.chat(
            messages=[{"role": "user", "content": "Hello"}],
            provider="openai",
            model="gpt-4o-mini",
        )
        print(resp.content, resp.cost_usd)
"""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass

import httpx

from config import API_BASE_URL, BEARER_TOKEN, TENANT_ID, MODEL_PRICING

# ---------------------------------------------------------------------------
# Response dataclass
# ---------------------------------------------------------------------------

@dataclass
class ChatResponse:
    """Structured response from a single Atlas UX /v1/chat call."""

    provider: str
    model: str
    content: str
    request_id: str
    tokens_in: int | None
    tokens_out: int | None
    latency_ms: float
    cost_usd: float


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------

_MAX_RETRIES = 3
_BACKOFF_SECONDS = (2, 4, 8)
_REQUEST_TIMEOUT = 120.0


class AtlasClient:
    """Async HTTP client for the Atlas UX chat endpoint."""

    def __init__(
        self,
        base_url: str | None = None,
        token: str | None = None,
        tenant_id: str | None = None,
    ) -> None:
        self.base_url = (base_url or API_BASE_URL).rstrip("/")
        self.token = token or BEARER_TOKEN
        self.tenant_id = tenant_id or TENANT_ID
        self.client = httpx.AsyncClient(timeout=_REQUEST_TIMEOUT)

    # -- context-manager support ------------------------------------------

    async def __aenter__(self) -> "AtlasClient":
        return self

    async def __aexit__(self, *exc) -> None:
        await self.close()

    # -- public API -------------------------------------------------------

    async def chat(
        self,
        messages: list[dict],
        provider: str | None = None,
        model: str | None = None,
        agent_id: str | None = None,
    ) -> ChatResponse:
        """Send a chat request to Atlas UX and return a ``ChatResponse``.

        Implements retry with exponential back-off on HTTP 429 (rate limit).
        The caller should keep its own concurrency at or below 25 req/min to
        stay safely under the 30 req/min server cap.
        """
        url = f"{self.base_url}/v1/chat"

        headers = {
            "Authorization": f"Bearer {self.token}",
            "x-tenant-id": self.tenant_id,
            "Content-Type": "application/json",
        }

        body: dict = {"messages": messages}
        if provider is not None:
            body["provider"] = provider
        if model is not None:
            body["model"] = model
        if agent_id is not None:
            body["agentId"] = agent_id

        request_id = uuid.uuid4().hex

        last_exc: Exception | None = None

        for attempt in range(_MAX_RETRIES):
            start = time.perf_counter()
            try:
                response = await self.client.post(url, headers=headers, json=body)

                if response.status_code == 429:
                    wait = _BACKOFF_SECONDS[min(attempt, len(_BACKOFF_SECONDS) - 1)]
                    await asyncio.sleep(wait)
                    continue

                response.raise_for_status()

                elapsed_ms = (time.perf_counter() - start) * 1000
                data = response.json()

                return self._parse_response(data, request_id, elapsed_ms)

            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 429:
                    wait = _BACKOFF_SECONDS[min(attempt, len(_BACKOFF_SECONDS) - 1)]
                    await asyncio.sleep(wait)
                    last_exc = exc
                    continue
                raise
            except httpx.TimeoutException as exc:
                last_exc = exc
                if attempt < _MAX_RETRIES - 1:
                    wait = _BACKOFF_SECONDS[min(attempt, len(_BACKOFF_SECONDS) - 1)]
                    await asyncio.sleep(wait)
                    continue
                raise

        # All retries exhausted
        raise RuntimeError(
            f"Request {request_id} failed after {_MAX_RETRIES} retries"
        ) from last_exc

    async def close(self) -> None:
        """Gracefully close the underlying HTTP client."""
        await self.client.aclose()

    # -- internals --------------------------------------------------------

    @staticmethod
    def _parse_response(
        data: dict,
        request_id: str,
        elapsed_ms: float,
    ) -> ChatResponse:
        """Extract fields from the API JSON and compute cost."""

        # The Atlas UX API may nest the assistant message in different shapes
        # depending on the provider.  We handle the common structures here.
        content: str = ""
        if "content" in data:
            content = data["content"]
        elif "choices" in data and data["choices"]:
            choice = data["choices"][0]
            message = choice.get("message") or choice.get("delta") or {}
            content = message.get("content", "")
        elif "message" in data:
            msg = data["message"]
            content = msg.get("content", "") if isinstance(msg, dict) else str(msg)

        provider = data.get("provider", "unknown")
        model = data.get("model", "unknown")

        # Token usage
        usage = data.get("usage") or {}
        tokens_in = usage.get("prompt_tokens") or usage.get("input_tokens")
        tokens_out = usage.get("completion_tokens") or usage.get("output_tokens")

        # Cost calculation
        cost_usd = _compute_cost(model, tokens_in, tokens_out)

        return ChatResponse(
            provider=provider,
            model=model,
            content=content,
            request_id=request_id,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            latency_ms=round(elapsed_ms, 2),
            cost_usd=round(cost_usd, 8),
        )


def _compute_cost(
    model: str,
    tokens_in: int | None,
    tokens_out: int | None,
) -> float:
    """Return estimated cost in USD using ``MODEL_PRICING``.

    Falls back to zero if the model is not in the pricing table or token
    counts are unavailable.
    """
    pricing = MODEL_PRICING.get(model)
    if pricing is None or tokens_in is None or tokens_out is None:
        return 0.0

    input_per_1m, output_per_1m = pricing
    cost = (tokens_in / 1_000_000) * input_per_1m + (tokens_out / 1_000_000) * output_per_1m
    return cost
