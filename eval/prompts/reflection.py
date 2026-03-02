"""
Guided reflection prompts for deep reasoning.

Implements structured reflection loops where the model:
  1. Generates an initial answer
  2. Critiques its own reasoning
  3. Identifies potential errors or alternative interpretations
  4. Either confirms or revises its answer

Research shows guided reflection significantly improves accuracy
on hard reasoning tasks, especially in mathematics and physics.
"""

from __future__ import annotations


def get_reflection_prompt(subject: str) -> str:
    """Return a guided reflection prompt for the given domain."""
    domain_specific = _DOMAIN_REFLECTIONS.get(
        subject.lower().strip(),
        _DEFAULT_REFLECTION,
    )
    return _REFLECTION_FRAME.format(domain_specific=domain_specific)


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

_REFLECTION_FRAME = """\
GUIDED REFLECTION — Challenge your own reasoning before finalizing.

Take a step back and critically examine your work:

1. RESTATE your current answer and the key reasoning that led to it.

2. PLAY DEVIL'S ADVOCATE — argue AGAINST your own answer:
   - What is the strongest counterargument?
   - Is there an alternative interpretation of the question?
   - Did you make any assumptions that might not hold?

3. CHECK YOUR REASONING CHAIN:
   - Is each step logically valid?
   - Are there any gaps where you skipped steps?
   - Did you use any rules, formulas, or facts incorrectly?

{domain_specific}

4. DECISION:
   - If your original answer survives this scrutiny → CONFIRM it.
   - If you found an error → CORRECT it and explain what went wrong.
   - If there is genuine ambiguity → note it and state your best judgment.

5. CALIBRATE your confidence based on this reflection.
   Lower your confidence if you found concerning issues.
   Raise it if your answer survived all challenges.

Provide your final answer:
ANSWER: <your answer>
CONFIDENCE: <0.0 to 1.0>"""


_DEFAULT_REFLECTION = """\
   DOMAIN CHECK:
   - Are you applying concepts from the correct field?
   - Would a specialist in this area agree with your approach?"""


_DOMAIN_REFLECTIONS: dict[str, str] = {

    "mathematics": """\
   MATH-SPECIFIC CHECKS:
   - Verify: do the units/dimensions of your answer make sense?
   - Run a sanity check with a simple case (n=1, n=2).
   - If you did algebra, substitute your answer back to verify.
   - If combinatorics: does your count exceed obvious upper/lower bounds?
   - If you used a theorem: did you verify all preconditions hold?""",

    "physics": """\
   PHYSICS-SPECIFIC CHECKS:
   - Dimensional analysis: do the units of your answer match what's expected?
   - Limiting cases: does your answer reduce correctly in extreme limits?
   - Order of magnitude: is your numerical answer physically reasonable?
   - Conservation laws: are energy, momentum, charge conserved?
   - Sign: is the direction/sign of your answer physically sensible?""",

    "chemistry": """\
   CHEMISTRY-SPECIFIC CHECKS:
   - Stoichiometry: do atoms balance? Are charges balanced?
   - Thermodynamics: is the sign of delta-G/delta-H correct?
   - Mechanism: does each step preserve charge and electron count?
   - Units: did you convert correctly between mol, g, L, etc.?""",

    "biology": """\
   BIOLOGY-SPECIFIC CHECKS:
   - Is your answer consistent with evolutionary principles?
   - For genetics: do ratios match expected Mendelian/non-Mendelian patterns?
   - For molecular biology: is the direction (5'→3', N→C) correct?
   - Could you be confusing this with a similar but distinct concept?""",

    "computer science": """\
   CS-SPECIFIC CHECKS:
   - Trace through your algorithm with a small example.
   - Check boundary conditions (empty input, single element, max size).
   - Verify your complexity analysis accounts for all nested operations.
   - For proofs: is your reduction correct in both directions?""",

    "history": """\
   HISTORY-SPECIFIC CHECKS:
   - Are you confident in the specific dates/names, or could you be
     confusing similar events?
   - Does the claimed event fit the known political context of the period?
   - Are you relying on popular narrative or scholarly consensus?
   - Could the question be testing a common misconception?""",

    "economics": """\
   ECONOMICS-SPECIFIC CHECKS:
   - Are you in partial or general equilibrium?
   - Did you account for all relevant constraints (budget, production)?
   - Is your answer consistent with basic supply/demand logic?
   - For game theory: did you check all possible deviations?""",

    "medicine": """\
   MEDICINE-SPECIFIC CHECKS:
   - Does your diagnosis fit ALL the presented symptoms?
   - Did you consider the most dangerous diagnosis, not just the most likely?
   - Are there drug interactions or contraindications you missed?
   - Is this a common exam question testing a specific misconception?""",

    "linguistics": """\
   LINGUISTICS-SPECIFIC CHECKS:
   - Did you identify the correct subfield (syntax, phonology, semantics, etc.)?
   - Are you applying the right theoretical framework for this tradition?
   - Could you be confusing prescriptive and descriptive perspectives?
   - For phonology: did you correctly identify syllable boundaries and features?
   - For historical linguistics: is the sound change you cited actually attested?
   - Are you over-generalizing from English to other languages?""",

    "philosophy": """\
   PHILOSOPHY-SPECIFIC CHECKS:
   - Did you correctly reconstruct the argument in standard form?
   - Are you confusing validity with soundness?
   - Did you consider the strongest objections to the position?
   - Could you be strawmanning a philosophical position?
   - Are you applying anachronistic interpretations to historical texts?""",

    "engineering": """\
   ENGINEERING-SPECIFIC CHECKS:
   - Did you check unit conversions (SI vs imperial)?
   - Are boundary conditions correctly applied?
   - Does your answer make physical sense (order of magnitude)?
   - Did you account for safety factors and practical constraints?""",

    "astronomy": """\
   ASTRONOMY-SPECIFIC CHECKS:
   - Are you confusing apparent vs absolute magnitude?
   - Did you account for redshift corrections?
   - Is Newtonian gravity sufficient or do you need GR?
   - Are distance calculations using the correct method for the scale?""",
}
