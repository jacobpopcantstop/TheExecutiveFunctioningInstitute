#!/usr/bin/env python3
"""Validate video library/caption pipeline metadata."""
from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "data" / "video-library.json"
ALLOWED_TRANSCRIPT_STATUS = {"youtube_transcript", "publisher_transcript", "local_transcript", "none"}


def main() -> int:
  if not LIB.exists():
    print(f"Missing video library manifest: {LIB}")
    return 1

  try:
    payload = json.loads(LIB.read_text(encoding="utf-8"))
  except json.JSONDecodeError as err:
    print(f"Invalid JSON in {LIB}: {err}")
    return 1

  items = payload.get("items")
  if not isinstance(items, list) or not items:
    print("video-library.json must include a non-empty 'items' array.")
    return 1

  failures: list[str] = []
  seen_ids: set[str] = set()
  for i, item in enumerate(items):
    prefix = f"items[{i}]"
    if not isinstance(item, dict):
      failures.append(f"{prefix}: item must be an object")
      continue
    vid = str(item.get("id", "")).strip()
    if not vid:
      failures.append(f"{prefix}: missing id")
    elif vid in seen_ids:
      failures.append(f"{prefix}: duplicate id '{vid}'")
    else:
      seen_ids.add(vid)

    for field in ("title", "module", "url", "fallback_reading"):
      if not str(item.get(field, "")).strip():
        failures.append(f"{prefix}: missing {field}")

    url = str(item.get("url", "")).strip()
    if url and not (url.startswith("https://") or url.startswith("http://")):
      failures.append(f"{prefix}: url must be absolute")

    fallback = str(item.get("fallback_reading", "")).strip()
    if fallback and not (fallback.startswith("https://") or fallback.startswith("http://") or Path(fallback).suffix.lower() in {".pdf", ".html"}):
      failures.append(f"{prefix}: fallback_reading should be an absolute URL or known local asset")

    if item.get("captions_checked") is not True:
      failures.append(f"{prefix}: captions_checked must be true")

    transcript_status = str(item.get("transcript_status", "")).strip().lower()
    if transcript_status not in ALLOWED_TRANSCRIPT_STATUS:
      failures.append(f"{prefix}: invalid transcript_status '{transcript_status}'")

    transcript_url = str(item.get("transcript_url", "")).strip()
    if transcript_status != "none" and not transcript_url:
      failures.append(f"{prefix}: transcript_url required when transcript_status is not 'none'")

  if failures:
    print("Video pipeline checks failed:")
    for f in failures:
      print(f" - {f}")
    return 1

  print("Video pipeline checks OK.")
  return 0


if __name__ == "__main__":
  sys.exit(main())
