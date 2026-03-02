"""
Checkpoint manager for resumable evaluation runs.

Each run gets its own directory containing:
  - results.jsonl   -- one JSON object per completed question (append-only)
  - progress.json   -- rolling accuracy / count summary

On restart the harness calls ``get_completed_ids()`` and skips any question
IDs that are already recorded, making every run safely resumable.
"""

from __future__ import annotations

import datetime
import json
import os


class CheckpointManager:
    """Manages per-run checkpointing via JSONL + a progress summary file."""

    def __init__(self, run_dir: str) -> None:
        self.run_dir = run_dir
        self.results_path = os.path.join(run_dir, "results.jsonl")
        self.progress_path = os.path.join(run_dir, "progress.json")
        os.makedirs(run_dir, exist_ok=True)

    # -- reading ----------------------------------------------------------

    def get_completed_ids(self) -> set[str]:
        """Return the set of ``question_id`` values already recorded."""
        if not os.path.exists(self.results_path):
            return set()

        ids: set[str] = set()
        with open(self.results_path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    ids.add(data["question_id"])
                except (json.JSONDecodeError, KeyError):
                    # Skip malformed lines so a partial write doesn't break
                    # the entire checkpoint file.
                    continue
        return ids

    def load_all_results(self) -> list[dict]:
        """Load every result row from the JSONL file."""
        if not os.path.exists(self.results_path):
            return []

        results: list[dict] = []
        with open(self.results_path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    results.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        return results

    # -- writing ----------------------------------------------------------

    def save_result(self, result: dict) -> None:
        """Append a single result dict to the JSONL file and refresh progress."""
        with open(self.results_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(result, default=str) + "\n")
        self._update_progress()

    # -- progress summary -------------------------------------------------

    def _update_progress(self) -> None:
        """Recompute and persist the rolling progress summary."""
        completed_ids = self.get_completed_ids()
        results = self.load_all_results()
        correct = sum(1 for r in results if r.get("correct"))

        progress = {
            "completed": len(completed_ids),
            "correct": correct,
            "accuracy": correct / len(completed_ids) if completed_ids else 0.0,
            "last_update": datetime.datetime.now().isoformat(),
        }

        with open(self.progress_path, "w", encoding="utf-8") as fh:
            json.dump(progress, fh, indent=2)
