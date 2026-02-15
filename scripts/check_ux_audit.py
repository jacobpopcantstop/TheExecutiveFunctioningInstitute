#!/usr/bin/env python3
"""Lightweight sitewide UX audit with actionable checks."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


class UXParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.has_skip_link = False
        self.has_main = False
        self.has_nav_toggle = False
        self.has_nav = False
        self.inputs = []
        self.labels_for = set()
        self._label_depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a" and a.get("class", "").find("skip-link") >= 0:
            self.has_skip_link = True
        if tag == "main":
            self.has_main = True
        if tag == "nav":
            self.has_nav = True
        if tag == "button" and a.get("class", "").find("nav__toggle") >= 0:
            self.has_nav_toggle = True
        if tag == "label" and "for" in a:
            self.labels_for.add(a["for"])
        if tag == "label":
            self._label_depth += 1
        if tag in {"input", "select", "textarea"}:
            typ = a.get("type", "")
            if typ in {"hidden", "submit", "button"}:
                return
            self.inputs.append((a.get("id"), a.get("type", "text"), self._label_depth > 0))

    def handle_endtag(self, tag):
        if tag == "label" and self._label_depth > 0:
            self._label_depth -= 1


def main() -> int:
    files = sorted(ROOT.glob("*.html"))
    warnings = []
    passes = 0
    checks = 0

    for f in files:
        text = f.read_text(encoding="utf-8", errors="ignore")
        p = UXParser()
        p.feed(text)

        checks += 2
        if p.has_skip_link:
            passes += 1
        else:
            warnings.append(f"{f.name}: missing skip link")

        if p.has_main:
            passes += 1
        else:
            warnings.append(f"{f.name}: missing <main> landmark")

        if p.has_nav:
            checks += 1
            if p.has_nav_toggle:
                passes += 1
            else:
                warnings.append(f"{f.name}: missing mobile nav toggle")

        for input_id, input_type, wrapped in p.inputs:
            if wrapped:
                continue
            if not input_id:
                warnings.append(f"{f.name}: {input_type} input missing id")
                continue
            if input_id not in p.labels_for:
                warnings.append(f"{f.name}: input #{input_id} missing explicit <label for>")

    score = (passes / checks * 100.0) if checks else 100.0
    print(f"UX audit baseline score: {score:.1f}% ({passes}/{checks} structural checks passed)")
    if warnings:
        print("UX audit warnings:")
        for w in warnings[:120]:
            print(f" - {w}")
    else:
        print("UX audit warnings: none")
    return 0


if __name__ == "__main__":
    sys.exit(main())
