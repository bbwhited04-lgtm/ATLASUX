"""
Safe calculator tool for agentic evaluation.

Evaluates mathematical expressions using Python's math + sympy.
Sandboxed to prevent arbitrary code execution.
"""

from __future__ import annotations

import math
import re


# Allowed names in the evaluation namespace
_SAFE_NAMES: dict[str, object] = {
    # math constants
    "pi": math.pi,
    "e": math.e,
    "inf": math.inf,
    "nan": math.nan,
    "tau": math.tau,
    # math functions
    "abs": abs,
    "round": round,
    "min": min,
    "max": max,
    "sum": sum,
    "pow": pow,
    "int": int,
    "float": float,
    "sqrt": math.sqrt,
    "log": math.log,
    "log2": math.log2,
    "log10": math.log10,
    "exp": math.exp,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "asin": math.asin,
    "acos": math.acos,
    "atan": math.atan,
    "atan2": math.atan2,
    "sinh": math.sinh,
    "cosh": math.cosh,
    "tanh": math.tanh,
    "ceil": math.ceil,
    "floor": math.floor,
    "factorial": math.factorial,
    "gcd": math.gcd,
    "comb": math.comb,
    "perm": math.perm,
    "isqrt": math.isqrt,
    "degrees": math.degrees,
    "radians": math.radians,
    "hypot": math.hypot,
}


def safe_calculate(expression: str) -> str:
    """Evaluate a mathematical expression safely.

    Parameters
    ----------
    expression : str
        A mathematical expression like "2**64 - 1" or "sqrt(2) * pi".

    Returns
    -------
    str
        The result as a string, or an error message prefixed with "ERROR:".
    """
    # Basic sanitization
    expr = expression.strip()
    if not expr:
        return "ERROR: empty expression"

    # Block dangerous patterns
    if any(kw in expr for kw in ("import", "__", "exec", "eval", "open", "os.", "sys.")):
        return f"ERROR: forbidden pattern in expression: {expr}"

    # Replace common notation
    expr = expr.replace("^", "**")  # caret to power
    expr = re.sub(r"(\d)([a-zA-Z])", r"\1*\2", expr)  # 2pi → 2*pi

    try:
        # SECURITY NOTE: This eval() is intentionally sandboxed — __builtins__
        # is set to empty dict and only math functions are exposed. This is a
        # calculator tool for the eval harness, not user-facing code.
        result = eval(expr, {"__builtins__": {}}, _SAFE_NAMES)  # noqa: S307
        return str(result)
    except Exception as e:
        return f"ERROR: {type(e).__name__}: {e}"
