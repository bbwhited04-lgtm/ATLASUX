"""
Atlas UX Eval Harness -- Evaluation strategies.

Each strategy defines how benchmark questions are sent to model(s)
and how the final answer is determined.
"""

from .single import SingleModelStrategy
from .ensemble import EnsembleStrategy
from .agentic import AgenticStrategy

__all__ = [
    "SingleModelStrategy",
    "EnsembleStrategy",
    "AgenticStrategy",
]
