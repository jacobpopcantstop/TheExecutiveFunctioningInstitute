#!/usr/bin/env python3
"""Validate local PDF links resolve to real PDF files."""
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag in ("a", "iframe", "embed") and "href" in d:
            self.links.append(d["href"])
        if tag in ("iframe", "embed") and "src" in d:
            self.links.append(d["src"])


def is_local_pdf(link: str) -> bool:
    l = link.strip().lower()
    if not l.endswith(".pdf"):
        return False
    if l.startswith(("http://", "https://", "mailto:", "tel:", "data:", "javascript:", "#")):
        return False
    return True


def main() -> int:
    failures = []
    seen = set()

    for html in ROOT.glob("*.html"):
        p = Parser()
        p.feed(html.read_text(encoding="utf-8", errors="ignore"))
        for link in p.links:
            target = link.split("#")[0].split("?")[0]
            if not target or not is_local_pdf(target):
                continue
            abs_path = (ROOT / target).resolve()
            if abs_path in seen:
                continue
            seen.add(abs_path)
            if not abs_path.exists():
                failures.append(f"Missing PDF: {target}")
                continue
            try:
                with abs_path.open("rb") as f:
                    sig = f.read(5)
                if sig != b"%PDF-":
                    failures.append(f"Invalid PDF signature: {target}")
            except Exception as err:
                failures.append(f"Unreadable PDF: {target} ({err})")

    if failures:
        print("PDF checks failed:")
        for f in failures:
            print(f" - {f}")
        return 1

    print(f"PDF checks OK across {len(seen)} local PDF assets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
