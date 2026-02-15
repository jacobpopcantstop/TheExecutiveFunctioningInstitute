#!/usr/bin/env python3
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
        if tag in ('a', 'link') and 'href' in d:
            self.links.append(d['href'])
        if tag == 'script' and 'src' in d:
            self.links.append(d['src'])

bad = []
for html in ROOT.glob('*.html'):
    p = Parser()
    p.feed(html.read_text(encoding='utf-8', errors='ignore'))
    for link in p.links:
        if link.startswith(('http://', 'https://', 'mailto:', 'tel:', 'data:', '#', 'javascript:')):
            continue
        target = link.split('#')[0].split('?')[0]
        if not target:
            continue
        if not (html.parent / target).exists():
            bad.append((html.name, link))

if bad:
    print('Broken local links found:')
    for page, link in bad:
        print(f'- {page}: {link}')
    sys.exit(1)

print('Local links OK')
