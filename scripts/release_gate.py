#!/usr/bin/env python3
"""Run deployment release gates in one command."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_DOMAIN = "https://executivefunctioninginstitute.com/"
REQUIRED_HEADERS = [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Strict-Transport-Security",
    "Content-Security-Policy",
]
IGNORED_HTML = {"404.html"}


class CanonicalParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical: str | None = None

    def handle_starttag(self, tag: str, attrs):
        if tag != "link":
            return
        attr = dict(attrs)
        if attr.get("rel") == "canonical" and "href" in attr:
            self.canonical = attr["href"].strip()


def run_command(cmd: list[str], label: str) -> None:
    print(f"[gate] {label}")
    result = subprocess.run(cmd, cwd=ROOT)
    if result.returncode != 0:
        raise RuntimeError(f"Failed: {label}")


def check_canonical_tags() -> None:
    print("[gate] canonical tag consistency")
    failures: list[str] = []
    for html in sorted(ROOT.glob("*.html")):
        if html.name in IGNORED_HTML:
            continue
        parser = CanonicalParser()
        parser.feed(html.read_text(encoding="utf-8", errors="ignore"))
        expected = CANONICAL_DOMAIN + html.name
        if parser.canonical != expected:
            failures.append(
                f"{html.name}: expected canonical '{expected}', found '{parser.canonical}'"
            )
    if failures:
        for failure in failures:
            print(f" - {failure}")
        raise RuntimeError("Canonical checks failed")


def check_sitemap() -> None:
    print("[gate] sitemap coverage + absolute URLs")
    sitemap_path = ROOT / "sitemap.xml"
    tree = ET.parse(sitemap_path)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    loc_nodes = tree.findall(".//sm:url/sm:loc", ns)
    locs = [node.text.strip() for node in loc_nodes if node.text and node.text.strip()]
    bad = [loc for loc in locs if not loc.startswith(CANONICAL_DOMAIN)]
    if bad:
        for loc in bad:
            print(f" - Non-absolute or wrong-domain sitemap URL: {loc}")
        raise RuntimeError("Sitemap URL format check failed")

    expected = {
        CANONICAL_DOMAIN + html.name
        for html in ROOT.glob("*.html")
        if html.name not in IGNORED_HTML
    }
    actual = set(locs)
    missing = sorted(expected - actual)
    if missing:
        for loc in missing:
            print(f" - Missing sitemap URL: {loc}")
        raise RuntimeError("Sitemap coverage check failed")


def check_netlify_headers() -> None:
    print("[gate] netlify security headers")
    body = (ROOT / "netlify.toml").read_text(encoding="utf-8", errors="ignore")
    missing = [header for header in REQUIRED_HEADERS if f'{header} = "' not in body]
    if missing:
        for header in missing:
            print(f" - Missing required header in netlify.toml: {header}")
        raise RuntimeError("Netlify header check failed")


def main() -> int:
    try:
        run_command(["node", "--check", "js/main.js", "js/auth.js", "js/esqr.js"], "js syntax")
        run_command(["python3", "scripts/check_links.py"], "local link check")
        run_command(["python3", "scripts/check_accessibility.py"], "accessibility check")
        run_command(["python3", "scripts/check_pdfs.py"], "pdf integrity check")
        run_command(["python3", "scripts/check_source_hub.py"], "further sources integration check")
        check_canonical_tags()
        check_sitemap()
        check_netlify_headers()
    except RuntimeError as err:
        print(f"[gate] release gate failed: {err}")
        return 1

    print("[gate] release gate passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
