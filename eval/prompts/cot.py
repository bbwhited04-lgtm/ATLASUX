"""
Structured Chain-of-Thought (CoT) templates for deep reasoning.

These templates enforce multi-step decomposition with explicit
verification and anti-hallucination checkpoints. They replace the
naive "think step by step" approach with structured reasoning
protocols tuned for PhD-level questions.
"""

from __future__ import annotations


def get_cot_template(question_type: str, subject: str) -> str:
    """Return a structured CoT instruction block.

    Parameters
    ----------
    question_type : str
        "multiple_choice" or "short_answer"
    subject : str
        The domain subject (used to select domain-specific reasoning).
    """
    base = _BASE_COT

    if question_type == "multiple_choice":
        return base + "\n\n" + _MC_COT
    else:
        return base + "\n\n" + _SHORT_ANSWER_COT


def get_verification_prompt() -> str:
    """Return the self-verification prompt used after initial reasoning."""
    return _VERIFICATION_PROMPT


# ---------------------------------------------------------------------------
# Template components
# ---------------------------------------------------------------------------

_BASE_COT = """\
REASONING PROTOCOL — Follow these steps exactly:

STEP 1: COMPREHENSION
- Restate the question in your own words.
- Identify exactly what is being asked. What type of answer is expected?
- Note any constraints, conditions, or implicit assumptions.
- If an image is provided, describe what you observe in detail.

STEP 2: DOMAIN CLASSIFICATION
- What field(s) does this question belong to?
- What specific concepts, theorems, or principles are relevant?
- What level of precision is required?

STEP 3: KNOWLEDGE INVENTORY
- What do you KNOW with certainty that is relevant?
- What are you UNCERTAIN about? Flag these explicitly.
- Are there specific facts, formulas, or data you need to look up?
  If so, use the available tools (calculator, code interpreter, web search).

STEP 4: DEEP ANALYSIS — DO NOT JUMP TO CONCLUSIONS
- Work through the problem methodically.
- Show each logical step explicitly.
- If you need to calculate, use the calculator or code interpreter.
- If you need factual information you're unsure about, use web search.
- Consider AT LEAST two possible approaches or interpretations.
- For each approach, trace it through to see where it leads.

STEP 5: CRITICAL EVALUATION
- Review your reasoning for errors, gaps, or unsupported leaps.
- Check: does your answer satisfy ALL constraints in the question?
- Check: are there edge cases or special conditions you missed?
- Check: if your answer seems surprising, is there a reason, or did you err?

STEP 6: CONFIDENCE CALIBRATION
- How certain are you? Be honest.
- If you had to bet your career on this answer, would you?
- 0.0-0.3: guessing or very uncertain
- 0.3-0.5: some reasoning but significant doubt
- 0.5-0.7: reasonable confidence, could be wrong
- 0.7-0.9: high confidence with solid reasoning
- 0.9-1.0: near certain, multiple independent confirmations"""


_MC_COT = """\
MULTIPLE CHOICE SPECIFIC:
- Before looking at the answer choices, try to solve the problem independently.
- Then evaluate EACH choice against your independent solution.
- Eliminate clearly wrong choices with explicit reasoning.
- If two choices seem plausible, identify the precise distinction between them.
- The correct answer is the one that is MOST precisely correct, not just
  approximately right.
- Watch for distractor choices that are close but subtly wrong.
- After selecting your answer, re-read the question to make sure you answered
  what was actually asked (not what you assumed was asked)."""


_SHORT_ANSWER_COT = """\
SHORT ANSWER SPECIFIC:
- Determine the expected format: number, word, phrase, name, date, etc.
- If the answer is numerical, compute it precisely using tools.
- Express your answer in the simplest, most standard form.
- Do not include units unless the question asks for them.
- Do not over-explain in your final answer — just the value."""


_VERIFICATION_PROMPT = """\
VERIFICATION CHECKPOINT — Before giving your final answer:

1. RE-READ the original question one more time.
2. CHECK that your answer directly addresses what was asked.
3. VERIFY any calculations by running them again or using a different method.
4. ASK YOURSELF: "Am I confusing this with a similar but different concept?"
5. ASK YOURSELF: "Would an expert in this field agree with my reasoning?"
6. CHECK: If this is multiple choice, did I accidentally pick a distractor?
7. FINAL GUT CHECK: Does this answer "feel" right given everything I know
   about this domain?

If anything fails these checks, revise your answer before submitting.

Now provide your final answer in EXACTLY this format:
ANSWER: <your answer>
CONFIDENCE: <0.0 to 1.0>"""
