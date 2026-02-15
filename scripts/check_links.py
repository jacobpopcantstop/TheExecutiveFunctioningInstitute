#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import sys
import argparse
import urllib.request
import urllib.error

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

parser = argparse.ArgumentParser()
parser.add_argument('--external', action='store_true', help='Also validate external HTTP/HTTPS links.')
args = parser.parse_args()

bad = []
external = set()
for html in ROOT.glob('*.html'):
    p = Parser()
    p.feed(html.read_text(encoding='utf-8', errors='ignore'))
    for link in p.links:
        if link.startswith(('http://', 'https://')):
            external.add(link)
            continue
        if link.startswith(('mailto:', 'tel:', 'data:', '#', 'javascript:')):
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

if args.external:
    blocked = [
        'fonts.googleapis.com',
        'fonts.gstatic.com'
    ]
    failed_external = []
    for url in sorted(external):
        if any(host in url for host in blocked):
            continue
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'EFI-LinkCheck/1.0'})
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                status = getattr(resp, 'status', 200)
                if status >= 400:
                    failed_external.append((url, status))
        except Exception:
            req = urllib.request.Request(url, method='GET', headers={'User-Agent': 'EFI-LinkCheck/1.0'})
            try:
                with urllib.request.urlopen(req, timeout=8) as resp:
                    status = getattr(resp, 'status', 200)
                    if status >= 400:
                        failed_external.append((url, status))
            except urllib.error.HTTPError as e:
                failed_external.append((url, e.code))
            except Exception:
                failed_external.append((url, 'unreachable'))
    if failed_external:
        print('Broken external links found:')
        for url, status in failed_external:
            print(f'- {url} ({status})')
        sys.exit(1)
    print('External links OK')

print('Local links OK')
