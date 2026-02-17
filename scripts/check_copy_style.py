#!/usr/bin/env python3
"""Block known AI-isms and vague cliche copy in HTML content."""
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

RULES = [
    (re.compile(r"\btransform lives?\b", re.IGNORECASE), "Use a concrete outcome instead of 'transform lives'."),
    (re.compile(r"\bbegin your journey\b", re.IGNORECASE), "Use 'start the program' phrasing."),
    (re.compile(r"\bready to transform\b", re.IGNORECASE), "Avoid hype CTA phrasing."),
    (re.compile(r"\bworld[- ]class\b", re.IGNORECASE), "Avoid unsupported superlatives."),
    (re.compile(r"\bgame[- ]changer\b", re.IGNORECASE), "Use specific impact language."),
    (re.compile(r"\bcutting[- ]edge\b", re.IGNORECASE), "Use specific and testable wording."),
    (re.compile(r"\bholistic approach\b", re.IGNORECASE), "Use concrete model language."),
    (re.compile(r"\bseamless experience\b", re.IGNORECASE), "Use concrete UX language."),
    (re.compile(r"\bnext level\b", re.IGNORECASE), "Avoid generic hype phrasing."),
    (re.compile(r"\bunlock the paid track\b", re.IGNORECASE), "Prefer 'includes' or 'provides access'."),
    (re.compile(r"\bunlock graded assignments\b", re.IGNORECASE), "Prefer 'includes graded assignments'."),
]


def line_number_for_offset(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def main() -> int:
    failures: list[str] = []
    for html_file in sorted(ROOT.glob("*.html")):
        text = html_file.read_text(encoding="utf-8", errors="ignore")
        for pattern, message in RULES:
            for match in pattern.finditer(text):
                line = line_number_for_offset(text, match.start())
                failures.append(
                    f"{html_file.name}:{line}: '{match.group(0)}' -> {message}"
                )

    if failures:
        print("Copy style violations found:")
        for failure in failures:
            print(f" - {failure}")
        return 1

    print("Copy style checks OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
