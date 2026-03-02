"""
One-shot examples for HLE benchmark evaluation.

Provides domain-specific examples showing the full structured reasoning
chain. These examples demonstrate proper tool use, step-by-step
decomposition, and calibrated confidence scoring.
"""

from __future__ import annotations


def get_oneshot_example(subject: str, question_type: str) -> str | None:
    """Return a one-shot example for the given domain and question type.

    Returns None if no example is available for the specific domain,
    in which case the caller should use the generic example.
    """
    key = subject.lower().strip()
    qt = "mc" if question_type == "multiple_choice" else "sa"

    # Try domain-specific first, then generic
    example = _EXAMPLES.get(f"{key}_{qt}") or _EXAMPLES.get(f"generic_{qt}")
    return example


# ---------------------------------------------------------------------------
# Examples
# ---------------------------------------------------------------------------

_EXAMPLES: dict[str, str] = {

    # ── Mathematics (MC) ──────────────────────────────────────────────────

    "mathematics_mc": """\
EXAMPLE — Structured Reasoning Demonstration:

Question: Let G be a finite group of order 12. Which of the following is NOT necessarily true?
(A) G has a subgroup of order 3
(B) G has a subgroup of order 4
(C) G has a normal subgroup of order 3 or 4
(D) G is abelian

STEP 1: COMPREHENSION
The question asks which statement is NOT necessarily true for ALL groups of order 12.
I need to find the claim that fails for at least one group of order 12.

STEP 2: DOMAIN CLASSIFICATION
Group theory / finite groups. Relevant: Sylow theorems, Lagrange's theorem.

STEP 3: KNOWLEDGE INVENTORY
- By Lagrange's theorem, subgroups can only have orders dividing 12: 1, 2, 3, 4, 6, 12.
- By Sylow's theorems: the number of Sylow 3-subgroups n_3 divides 4 and n_3 ≡ 1 (mod 3), so n_3 ∈ {1, 4}. The number of Sylow 2-subgroups n_2 divides 3 and n_2 ≡ 1 (mod 2), so n_2 ∈ {1, 3}.
- I know specific groups of order 12: Z_12, Z_2 × Z_6, A_4, D_6.

STEP 4: DEEP ANALYSIS
(A) Sylow's first theorem guarantees a subgroup of order 3. TRUE for all.
(B) Sylow's first theorem guarantees a subgroup of order 4. TRUE for all.
(C) If n_3 = 1, the unique Sylow 3-subgroup is normal. If n_3 = 4, then all 12-1=11 non-identity elements would be in 3-subgroups... actually n_3 = 4 gives 8 elements of order 3, leaving 4 elements forming the unique Sylow 2-subgroup (so n_2 = 1). Either way, at least one Sylow subgroup is normal. TRUE for all.
(D) A_4 has order 12 and is NOT abelian. So (D) is not necessarily true.

STEP 5: CRITICAL EVALUATION
My reasoning for (D) is solid — A_4 is a well-known non-abelian group of order 12.

ANSWER: D
CONFIDENCE: 0.95""",

    # ── Physics (MC) ─────────────────────────────────────────────────────

    "physics_mc": """\
EXAMPLE — Structured Reasoning Demonstration:

Question: A spacecraft orbits Earth at an altitude where the gravitational acceleration is g/4 (where g = 9.8 m/s² at Earth's surface). What is the altitude?
(A) R_E (one Earth radius above surface)
(B) 2R_E
(C) 3R_E
(D) R_E/2

STEP 1: COMPREHENSION
I need to find the altitude h above Earth's surface where gravitational acceleration = g/4.

STEP 2: DOMAIN CLASSIFICATION
Classical mechanics / gravitation. Relevant: Newton's law of gravitation.

STEP 3: KNOWLEDGE INVENTORY
g = GM/R_E². At distance r from center: g(r) = GM/r². So g(r) = g · (R_E/r)².

STEP 4: DEEP ANALYSIS
We need g(r) = g/4:
g · (R_E/r)² = g/4
(R_E/r)² = 1/4
R_E/r = 1/2
r = 2R_E

TOOL_CALL: calculator(2 * 6371 - 6371)
TOOL_RESULT: 6371.0

So r = 2R_E from Earth's center. The altitude h = r - R_E = 2R_E - R_E = R_E.
The altitude is one Earth radius above the surface.

STEP 5: CRITICAL EVALUATION
Dimensional analysis checks out. At r = 2R_E, g falls by factor (1/2)² = 1/4. Correct.

ANSWER: A
CONFIDENCE: 0.97""",

    # ── History (short answer) ───────────────────────────────────────────

    "history_sa": """\
EXAMPLE — Structured Reasoning Demonstration:

Question: In what year was the Treaty of Tordesillas signed?

STEP 1: COMPREHENSION
The question asks for the specific year of the Treaty of Tordesillas.

STEP 2: DOMAIN CLASSIFICATION
Early modern European/colonial history. Portugal-Spain division of the New World.

STEP 3: KNOWLEDGE INVENTORY
I am fairly certain: The Treaty of Tordesillas was signed between Spain and Portugal to divide newly discovered lands. It was mediated by Pope Alexander VI (whose earlier Inter caetera bulls of 1493 preceded it). The treaty itself was signed in 1494. Columbus's first voyage was 1492, and the treaty was a direct consequence of disputes following that voyage.

STEP 4: DEEP ANALYSIS
The timeline makes sense: Columbus returns in 1493, papal bulls issued 1493, formal treaty negotiated and signed 1494. The line was moved further west from the papal demarcation, which later gave Portugal claim to Brazil.

STEP 5: CRITICAL EVALUATION
I am confident in 1494. This is a well-established historical date that fits the chronological context.

ANSWER: 1494
CONFIDENCE: 0.95""",

    # ── Linguistics (short answer) ─────────────────────────────────────

    "linguistics_sa": """\
EXAMPLE — Structured Reasoning Demonstration:

Question: In the Tiberian pronunciation tradition of Biblical Hebrew, what is the phonetic realization of a shewa under a letter following a short vowel in a stressed syllable?

STEP 1: COMPREHENSION
The question asks about the phonetic value of shewa in a specific prosodic environment in the Tiberian tradition — specifically after a short vowel in a stressed syllable.

STEP 2: DOMAIN CLASSIFICATION
Historical linguistics / Biblical Hebrew phonology / Tiberian reading tradition. Relevant scholars: Geoffrey Khan, Kim Phillips, Benjamin Suchard.

STEP 3: KNOWLEDGE INVENTORY
I know: In the Tiberian tradition, shewa has two main realizations:
- Shewa na' (mobile/vocal shewa) — pronounced as a short vowel
- Shewa nax (quiescent/silent shewa) — closes the syllable, not pronounced
The realization depends on the prosodic environment. After a short vowel in a stressed (or pretonic) syllable, the shewa typically closes the syllable (quiescent).

STEP 4: DEEP ANALYSIS
According to Khan's research on Tiberian pronunciation, shewa following a short vowel is quiescent (silent) — it serves as a syllable-closing marker. The syllable structure would be CVC where the C after the vowel takes the silent shewa. This contrasts with shewa at the beginning of a word or after another shewa, where it would be vocal.

STEP 5: CRITICAL EVALUATION
This aligns with the standard analysis in Tiberian phonology. The distinction between vocal and silent shewa is well-established in the scholarly literature.

ANSWER: quiescent (silent)
CONFIDENCE: 0.78""",

    # ── Generic (MC) ─────────────────────────────────────────────────────

    "generic_mc": """\
EXAMPLE — Structured Reasoning Demonstration:

Question: Which of the following best describes the relationship between correlation and causation?
(A) Correlation always implies causation
(B) Causation always implies correlation
(C) Correlation is necessary but not sufficient for causation
(D) Neither correlation nor causation implies the other

STEP 1: COMPREHENSION
The question asks about the logical relationship between correlation and causation.

STEP 2: DOMAIN CLASSIFICATION
Research methodology / statistics / epistemology.

STEP 3: KNOWLEDGE INVENTORY
Correlation = statistical association between variables. Causation = one variable produces change in another. "Correlation does not imply causation" is a standard principle. But does causation imply correlation?

STEP 4: DEEP ANALYSIS
(A) FALSE — classic confounding/spurious correlation disproves this.
(B) Causation USUALLY produces correlation, but can there be causation without correlation? Yes — if there are masking/suppressor variables. Example: a drug that helps some people and harms others equally could show zero net correlation despite having causal effects. But in a CONTROLLED setting, causation does produce a detectable effect. This is nuanced.
(C) Correlation is NOT necessary for causation in all cases (see above), so "necessary" is too strong. But this is debatable.
(D) Too extreme — causation typically produces SOME detectable association.

STEP 5: CRITICAL EVALUATION
The "standard" textbook answer is (C) — you need correlation as evidence for causation, but correlation alone is insufficient. While there are edge cases where causation exists without net correlation (suppressor variables), the question says "best describes," and (C) is the most widely accepted framework in research methodology.

ANSWER: C
CONFIDENCE: 0.82""",

    # ── Generic (short answer) ───────────────────────────────────────────

    "generic_sa": """\
EXAMPLE — Structured Reasoning Demonstration:

Question: What is the name of the logical fallacy where someone argues that because two events occurred sequentially, the first must have caused the second?

STEP 1: COMPREHENSION
I need to name the logical fallacy about assuming temporal sequence implies causation.

STEP 2: DOMAIN CLASSIFICATION
Logic / informal fallacies.

STEP 3: KNOWLEDGE INVENTORY
The Latin name is "post hoc ergo propter hoc" (after this, therefore because of this). This is one of the most well-known informal fallacies.

STEP 4: DEEP ANALYSIS
The full Latin name is "post hoc ergo propter hoc." It's often shortened to "post hoc fallacy." The question likely wants either the Latin name or "post hoc."

ANSWER: post hoc ergo propter hoc
CONFIDENCE: 0.95""",
}
