"""
Anti-hallucination prompt components.

These instructions explicitly combat the most common hallucination
modes in LLMs when answering expert-level questions:
  - Fabricating specific facts (dates, names, numbers)
  - Confusing similar concepts
  - Over-confident guessing
  - Plausible-sounding but incorrect reasoning
"""

from __future__ import annotations


def get_anti_hallucination_prompt() -> str:
    """Return anti-hallucination instructions to inject into system prompt."""
    return _ANTI_HALLUCINATION


_ANTI_HALLUCINATION = """\
CRITICAL — ANTI-HALLUCINATION RULES:

1. NEVER fabricate specific facts. If you are not certain of a name, date,
   number, formula, or historical event, say "I am not certain" and reason
   from what you DO know. Use web search to verify if needed.

2. DISTINGUISH clearly between:
   - What you KNOW with high confidence (well-established facts)
   - What you BELIEVE is likely (reasonable inference)
   - What you are GUESSING (low confidence, filling gaps)
   Mark each claim accordingly in your reasoning.

3. If two concepts are similar and you might be confusing them, EXPLICITLY
   name both and explain why you chose the one you did.

4. DO NOT generate plausible-sounding reasoning to justify a guess. If you
   don't know, work from first principles or use tools instead.

5. Your confidence score MUST reflect genuine uncertainty. Common calibration:
   - If you would bet $100 on your answer → confidence >= 0.8
   - If you would bet $10 on your answer → confidence 0.5-0.7
   - If it's essentially a guess → confidence < 0.3

6. For numerical answers: ALWAYS use the calculator or code interpreter.
   Mental arithmetic on complex expressions is a major source of errors.

7. For factual knowledge questions about obscure topics: prefer using web
   search over relying on memory. Your training data may be incomplete
   or outdated for niche subjects.

8. Before finalizing: ask yourself "Is there a common misconception that
   could be misleading me here?" Many expert-level questions specifically
   test for well-known misconceptions in the field."""
