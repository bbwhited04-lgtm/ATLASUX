"""
Central configuration for the Atlas UX eval harness.

Loads environment variables from .env and defines model pricing,
available models, and directory paths used across all eval runs.
"""

import os
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

load_dotenv()

API_BASE_URL: str = os.getenv("ATLAS_API_BASE_URL", "http://localhost:8787")
BEARER_TOKEN: str = os.getenv("ATLAS_BEARER_TOKEN", "")
TENANT_ID: str = os.getenv("ATLAS_TENANT_ID", "")

# ---------------------------------------------------------------------------
# Model pricing  (USD per 1 M tokens)
# ---------------------------------------------------------------------------

MODEL_PRICING: dict[str, tuple[float, float]] = {
    # model_name: (input_per_1M, output_per_1M)
    "gpt-4o-mini":        (0.15,  0.60),
    "gpt-4o":             (2.50,  10.00),
    "gpt-5.2":            (3.00,  15.00),
    "deepseek-chat":      (0.07,  0.28),
    "deepseek-reasoner":  (0.55,  2.19),
    "claude-3-5-haiku":   (0.80,  4.00),
    "claude-opus-4-5":    (5.00,  25.00),
    "claude-sonnet-4-6":  (3.00,  15.00),
    "gemini-2.0-flash":   (0.075, 0.30),
    "gemini-1.5-pro":     (1.25,  5.00),
    "kimi-k2.5":          (0.60,  2.40),
}

# ---------------------------------------------------------------------------
# Available models
# ---------------------------------------------------------------------------

AVAILABLE_MODELS: list[dict] = [
    {"provider": "openai",    "model": "gpt-4o-mini",       "vision_capable": True},
    {"provider": "openai",    "model": "gpt-4o",            "vision_capable": True},
    {"provider": "openai",    "model": "gpt-5.2",           "vision_capable": True},
    {"provider": "deepseek",  "model": "deepseek-chat",     "vision_capable": False},
    {"provider": "deepseek",  "model": "deepseek-reasoner", "vision_capable": False},
    {"provider": "anthropic", "model": "claude-3-5-haiku",  "vision_capable": True},
    {"provider": "anthropic", "model": "claude-opus-4-5",   "vision_capable": True},
    {"provider": "anthropic", "model": "claude-sonnet-4-6", "vision_capable": True},
    {"provider": "google",    "model": "gemini-2.0-flash",  "vision_capable": True},
    {"provider": "google",    "model": "gemini-1.5-pro",    "vision_capable": True},
    {"provider": "moonshot",  "model": "kimi-k2.5",         "vision_capable": True},
]

# ---------------------------------------------------------------------------
# Directory paths (relative to the eval/ directory)
# ---------------------------------------------------------------------------

DATA_DIR: str = "./data"
RESULTS_DIR: str = "./results"
CHECKPOINTS_DIR: str = "./checkpoints"
