#!/usr/bin/env python3
"""Check launch blockers that can be validated from repository state."""
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
  "netlify/functions/auth.js",
  "netlify/functions/verify.js",
  "netlify/functions/stripe-webhook.js",
  "netlify/functions/sync-progress.js",
  "netlify/functions/submissions.js",
  "netlify/functions/coach-directory.js",
  "netlify/functions/ops-config.js",
  "netlify/functions/community-question.js",
  "data/video-library.json",
  "docs/roadmap-to-perfection.md",
  "docs/video-pipeline.md",
]

REQUIRED_ENV_KEYS = [
  "EFI_CRM_WEBHOOK_URL",
  "EFI_ESP_WEBHOOK_URL",
  "EFI_DOWNLOAD_SIGNING_SECRET",
  "EFI_PURCHASE_SIGNING_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "EFI_SUBMISSIONS_CRON_SECRET",
]


def require_file(path: str, failures: list[str]) -> None:
  p = ROOT / path
  if not p.exists():
    failures.append(f"Missing required file: {path}")


def require_text(path: str, needle: str, failures: list[str]) -> None:
  p = ROOT / path
  if not p.exists():
    failures.append(f"Missing required file for text check: {path}")
    return
  text = p.read_text(encoding="utf-8", errors="ignore")
  if needle not in text:
    failures.append(f"Missing required config/text in {path}: {needle}")


def main() -> int:
  failures: list[str] = []

  for rel in REQUIRED_FILES:
    require_file(rel, failures)

  env_example = ROOT / ".env.example"
  if not env_example.exists():
    failures.append("Missing .env.example")
  else:
    env_text = env_example.read_text(encoding="utf-8", errors="ignore")
    for key in REQUIRED_ENV_KEYS:
      if re.search(rf"^{re.escape(key)}=", env_text, flags=re.MULTILINE) is None:
        failures.append(f"Missing env key in .env.example: {key}")

  require_text("netlify.toml", "from = \"/api/*\"", failures)
  require_text("netlify.toml", "to = \"/.netlify/functions/:splat\"", failures)
  require_text("docs/release-checklist.md", "python3 scripts/release_gate.py", failures)
  require_text("docs/roadmap-to-perfection.md", "Requires Deployment/Operator Input", failures)

  if failures:
    print("Launch blocker checks failed:")
    for failure in failures:
      print(f" - {failure}")
    return 1

  print("Launch blocker checks OK.")
  return 0


if __name__ == "__main__":
  sys.exit(main())
