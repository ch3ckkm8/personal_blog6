#!/usr/bin/env python3
import json
import re
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / 'posts'
OUT = POSTS / 'index.json'


def display_title_from_filename(path):
    """Build a readable title without requiring metadata/frontmatter."""
    stem = re.sub(r'^ch3ckm8_', '', path.stem, flags=re.I)
    parts = [part for part in re.split(r'[_-]+', stem) if part]
    return ' '.join(part.upper() if part.lower() in {'htb', 'ctf'} else part for part in parts)


def extract_tags(body):
    """Extract #tags only from explicit `Tags:` lines in the Markdown."""
    tags = []
    seen = set()
    for match in re.finditer(r'^\s*Tags\s*:\s*(.+)$', body, flags=re.I | re.M):
        for tag in re.findall(r'(?<!\w)#([A-Za-z0-9][A-Za-z0-9_-]*)', match.group(1)):
            key = tag.casefold()
            if key not in seen:
                seen.add(key)
                tags.append(tag)
    return tags


def excerpt(body):
    body = re.sub(r'```.*?```', '', body, flags=re.S)
    body = re.sub(r'!\[[^]]*\]\([^)]*\)', '', body)
    body = re.sub(r'\[([^]]+)\]\([^)]*\)', r'\1', body)
    body = re.sub(r'^\s*Tags\s*:.*$', '', body, flags=re.I | re.M)
    body = re.sub(r'[#>*_`~-]', ' ', body)
    paras = [re.sub(r'\s+', ' ', p).strip() for p in re.split(r'\n\s*\n', body)]
    paras = [p for p in paras if p and not p.startswith('|') and p.lower() != 'intro']
    value = next((p for p in paras if len(p) > 20), 'Read the full writeup.')
    return value[:217] + '...' if len(value) > 220 else value


items = []
POSTS.mkdir(exist_ok=True)
for path in sorted(POSTS.glob('*.md')):
    body = path.read_text(encoding='utf-8')
    items.append({
        'title': display_title_from_filename(path),
        'file': 'posts/' + path.name,
        'category': 'Other',
        'tags': extract_tags(body),
        'date': date.fromtimestamp(path.stat().st_mtime).isoformat(),
        'difficulty': 'N/A',
        'excerpt': excerpt(body),
        'featured': False,
        'content': body,
    })

OUT.write_text(json.dumps(items, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Generated {OUT.relative_to(ROOT)} with {len(items)} post(s).')
