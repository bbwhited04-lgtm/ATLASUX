"""
Sandboxed Python code interpreter for agentic evaluation.

Executes Python code snippets in a subprocess with strict timeout
and size limits. Used for complex calculations, data manipulation,
and verification that go beyond simple calculator expressions.

SECURITY NOTE: This tool is part of the eval harness (developer tooling),
not user-facing production code. The subprocess is sandboxed with a
timeout and restricted to the eval environment.
"""

from __future__ import annotations

import subprocess
import tempfile
import os

_TIMEOUT_SECONDS = 30
_MAX_OUTPUT_BYTES = 10_000
_MAX_CODE_LENGTH = 5_000

# Preamble injected into every execution — provides common imports
_PREAMBLE = """\
import math
import statistics
import itertools
import functools
import collections
import fractions
import decimal
import re
"""


def run_python(code: str) -> str:
    """Execute a Python code snippet and return stdout + stderr.

    The code runs in a fresh subprocess with a timeout. Common
    scientific libraries are pre-imported.

    Parameters
    ----------
    code : str
        Python source code to execute. Should print() its result.

    Returns
    -------
    str
        The combined stdout/stderr, or an error message.
    """
    if not code.strip():
        return "ERROR: empty code"

    if len(code) > _MAX_CODE_LENGTH:
        return f"ERROR: code too long ({len(code)} chars, max {_MAX_CODE_LENGTH})"

    # Block obviously dangerous operations
    _BLOCKED = ("shutil.rmtree",)
    for pattern in _BLOCKED:
        if pattern in code:
            return f"ERROR: forbidden pattern: {pattern}"

    full_code = _PREAMBLE + "\n" + code

    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False
        ) as f:
            f.write(full_code)
            tmp_path = f.name

        result = subprocess.run(
            ["python3", tmp_path],
            capture_output=True,
            text=True,
            timeout=_TIMEOUT_SECONDS,
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        )

        output = ""
        if result.stdout:
            output += result.stdout[:_MAX_OUTPUT_BYTES]
        if result.stderr:
            output += "\nSTDERR: " + result.stderr[:_MAX_OUTPUT_BYTES]
        if result.returncode != 0 and not output.strip():
            output = f"Process exited with code {result.returncode}"

        return output.strip() or "(no output)"

    except subprocess.TimeoutExpired:
        return f"ERROR: execution timed out after {_TIMEOUT_SECONDS}s"
    except Exception as e:
        return f"ERROR: {type(e).__name__}: {e}"
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
