#!/usr/bin/env python3
"""Lightweight static accessibility checks for HTML pages."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


class A11yParser(HTMLParser):
    def __init__(self, path: Path):
        super().__init__()
        self.path = path
        self.issues: list[str] = []
        self.has_main = False
        self.button_stack: list[dict] = []

    def handle_starttag(self, tag: str, attrs):
        attr = dict(attrs)
        if tag == 'html' and not attr.get('lang'):
            self.issues.append('Missing lang attribute on <html>.')
        if tag == 'img' and not attr.get('alt'):
            self.issues.append('Image missing alt text.')
        if tag == 'a' and not (attr.get('href') or '').strip():
            self.issues.append('Anchor missing href.')
        if tag == 'button':
            self.button_stack.append({
                'has_label_attr': bool((attr.get('aria-label') or '').strip() or (attr.get('title') or '').strip()),
                'text': ''
            })
        if tag == 'main':
            self.has_main = True

    def handle_data(self, data: str):
        if self.button_stack:
            self.button_stack[-1]['text'] += data.strip()

    def handle_endtag(self, tag: str):
        if tag == 'button' and self.button_stack:
            btn = self.button_stack.pop()
            if not btn['has_label_attr'] and not btn['text']:
                self.issues.append('Button missing accessible label (aria-label/title/text).')

    def close(self):
        super().close()
        if not self.has_main:
            self.issues.append('Missing <main> landmark.')


def main() -> int:
    files = sorted(ROOT.glob('*.html'))
    failures = []
    for f in files:
        parser = A11yParser(f)
        parser.feed(f.read_text(encoding='utf-8', errors='ignore'))
        parser.close()
        if parser.issues:
            failures.append((f, parser.issues))

    if failures:
        print('Accessibility check failed:')
        for f, issues in failures:
            for issue in issues:
                print(f' - {f.name}: {issue}')
        return 1

    print(f'Accessibility checks OK across {len(files)} HTML files.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
