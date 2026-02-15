#!/usr/bin/env python3
"""Fail when console.log/debugger statements are present in production JS."""
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
JS_DIR = ROOT / "js"

LOG_RE = re.compile(r"\bconsole\.log\s*\(")
DBG_RE = re.compile(r"\bdebugger\b")


def main() -> int:
    failures: list[str] = []
    for path in sorted(JS_DIR.glob("*.js")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for idx, line in enumerate(text.splitlines(), start=1):
            if LOG_RE.search(line) or DBG_RE.search(line):
                failures.append(f"{path.relative_to(ROOT)}:{idx}: {line.strip()}")

    if failures:
        print("Console/debug statements found:")
        for item in failures:
            print(f" - {item}")
        return 1

    print("No console.log/debugger statements found in js/*.js")
    return 0


if __name__ == "__main__":
    sys.exit(main())
