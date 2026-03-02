"""
Web search tool for agentic evaluation.

Provides factual information retrieval for knowledge-intensive
questions. Uses DuckDuckGo instant answers (no API key required)
with fallback to the Atlas UX backend search if configured.
"""

from __future__ import annotations

import json
import urllib.parse
import urllib.request

_TIMEOUT_SECONDS = 10
_MAX_RESULTS = 5
_USER_AGENT = "AtlasUX-Eval/1.0"


def web_search(query: str) -> str:
    """Search the web and return a summary of results.

    Parameters
    ----------
    query : str
        The search query.

    Returns
    -------
    str
        A formatted string of search results, or an error message.
    """
    if not query.strip():
        return "ERROR: empty query"

    # Try DuckDuckGo instant answer API first
    result = _ddg_instant_answer(query)
    if result and result != "No results found.":
        return result

    # Fallback to DuckDuckGo HTML search
    result = _ddg_html_search(query)
    if result:
        return result

    return "No results found. Consider rephrasing the query."


def _ddg_instant_answer(query: str) -> str | None:
    """Query DuckDuckGo instant answer API."""
    try:
        encoded = urllib.parse.urlencode({
            "q": query,
            "format": "json",
            "no_redirect": "1",
            "no_html": "1",
            "skip_disambig": "1",
        })
        url = f"https://api.duckduckgo.com/?{encoded}"

        req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
        with urllib.request.urlopen(req, timeout=_TIMEOUT_SECONDS) as resp:
            data = json.loads(resp.read().decode())

        results: list[str] = []

        # Abstract (main answer)
        if data.get("Abstract"):
            results.append(f"Summary: {data['Abstract']}")
            if data.get("AbstractSource"):
                results.append(f"Source: {data['AbstractSource']}")

        # Answer (direct factual answer)
        if data.get("Answer"):
            results.append(f"Answer: {data['Answer']}")

        # Related topics (for disambiguation/additional context)
        for topic in (data.get("RelatedTopics") or [])[:3]:
            if isinstance(topic, dict) and topic.get("Text"):
                results.append(f"Related: {topic['Text'][:200]}")

        # Infobox
        if data.get("Infobox") and data["Infobox"].get("content"):
            for item in data["Infobox"]["content"][:5]:
                if item.get("label") and item.get("value"):
                    results.append(f"{item['label']}: {item['value']}")

        return "\n".join(results) if results else None

    except Exception:
        return None


def _ddg_html_search(query: str) -> str | None:
    """Fallback: scrape DuckDuckGo lite for text results."""
    try:
        encoded = urllib.parse.urlencode({"q": query})
        url = f"https://lite.duckduckgo.com/lite/?{encoded}"

        req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
        with urllib.request.urlopen(req, timeout=_TIMEOUT_SECONDS) as resp:
            html = resp.read().decode("utf-8", errors="replace")

        # Extract result snippets from the lite HTML
        import re
        snippets = re.findall(
            r'class="result-snippet">(.*?)</td>',
            html,
            re.DOTALL,
        )

        if not snippets:
            # Try alternative pattern
            snippets = re.findall(
                r'<a[^>]*class="result-link"[^>]*>(.*?)</a>',
                html,
                re.DOTALL,
            )

        results = []
        for s in snippets[:_MAX_RESULTS]:
            text = re.sub(r"<[^>]+>", "", s).strip()
            if text:
                results.append(text[:300])

        return "\n\n".join(results) if results else None

    except Exception:
        return None
