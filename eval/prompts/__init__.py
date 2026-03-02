"""
Prompt library for Atlas UX benchmark evaluation.

Provides role-based expert prompts, structured Chain-of-Thought templates,
one-shot examples, and anti-hallucination instructions tuned for PhD-level
multi-domain reasoning (HLE benchmark).
"""

from .roles import get_expert_role, DOMAIN_ROLES
from .cot import get_cot_template, get_verification_prompt
from .oneshot import get_oneshot_example
from .anti_hallucination import get_anti_hallucination_prompt
from .reflection import get_reflection_prompt

__all__ = [
    "get_expert_role",
    "DOMAIN_ROLES",
    "get_cot_template",
    "get_verification_prompt",
    "get_oneshot_example",
    "get_anti_hallucination_prompt",
    "get_reflection_prompt",
]
