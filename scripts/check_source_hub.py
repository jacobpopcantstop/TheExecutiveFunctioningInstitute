#!/usr/bin/env python3
"""Validate Further Sources integration across key pages."""
from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    ROOT / "Further Sources",
    ROOT / "further-sources.html",
]

REQUIRED_SOURCE_LINK_FRAGMENTS = [
    "youtube.com/watch?v=wg6cfsnmqyg",
    "youtube.com/watch?v=wmV8HQUuPEk",
    "pubmed.ncbi.nlm.nih.gov/9000892",
    "russellbarkley.org/factsheets/ADHD_EF_and_SR.pdf",
    "brownadhdclinic.com/brown-ef-model-adhd",
    "smartbutscatteredkids.com/resources/esq-r-self-report-assessment-tool",
    "efpractice.com/getreadydodone",
    "nbefc.org/executive-functioning-coach-certification",
]

REQUIRED_PAGE_MARKERS = {
    "module-a-neuroscience.html": "Further Sources: Module A Citations",
    "module-c-interventions.html": "Further Sources: Module C Citations",
    "teacher-to-coach.html": "Further Sources: Business/Certification Citations",
    "barkley-model-guide.html": "Further Sources: Barkley Citations",
    "brown-clusters-tool.html": "Further Sources: Brown Citations",
    "resources.html": "further-sources.html",
}


def main() -> int:
    failures: list[str] = []

    for req in REQUIRED_FILES:
        if not req.exists():
            failures.append(f"Missing required source file: {req.name}")

    further_html = (ROOT / "further-sources.html")
    if further_html.exists():
        html = further_html.read_text(encoding="utf-8", errors="ignore")
        for frag in REQUIRED_SOURCE_LINK_FRAGMENTS:
            if frag not in html:
                failures.append(f"Missing expected citation/link in further-sources.html: {frag}")

    for page, marker in REQUIRED_PAGE_MARKERS.items():
        body = (ROOT / page).read_text(encoding="utf-8", errors="ignore")
        if marker not in body:
            failures.append(f"Missing marker '{marker}' in {page}")

    if failures:
        print("Further Sources checks failed:")
        for failure in failures:
            print(f" - {failure}")
        return 1

    print("Further Sources integration checks OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
