#!/usr/bin/env python3
import json, re
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / 'posts'
OUT = POSTS / 'index.json'


def parse_frontmatter(text):
    meta = {}
    body = text
    if text.startswith('---\n'):
        end = text.find('\n---\n', 4)
        if end != -1:
            raw = text[4:end]
            body = text[end + 5:]
            for line in raw.splitlines():
                if ':' not in line:
                    continue
                k, v = line.split(':', 1)
                k, v = k.strip(), v.strip().strip('"\'')
                if k == 'tags':
                    v = [x.strip().strip('"\'') for x in v.strip('[]').split(',') if x.strip()]
                elif k == 'featured':
                    v = v.lower() in ('true', 'yes', '1')
                meta[k] = v
    return meta, body


def first_heading(body, fallback):
    m = re.search(r'^#\s+(.+?)\s*$', body, re.M)
    return m.group(1).strip() if m else fallback


def excerpt(body):
    body = re.sub(r'```.*?```', '', body, flags=re.S)
    body = re.sub(r'!\[[^]]*\]\([^)]*\)', '', body)
    body = re.sub(r'\[([^]]+)\]\([^)]*\)', r'\1', body)
    body = re.sub(r'[#>*_`~-]', ' ', body)
    paras = [re.sub(r'\s+', ' ', p).strip() for p in re.split(r'\n\s*\n', body)]
    paras = [p for p in paras if p and not p.startswith('|')]
    value = next((p for p in paras if len(p) > 20), 'Read the full writeup.')
    return value[:217] + '...' if len(value) > 220 else value

items = []
POSTS.mkdir(exist_ok=True)
for path in sorted(POSTS.glob('*.md')):
    text = path.read_text(encoding='utf-8')
    meta, body = parse_frontmatter(text)
    title = meta.get('title') or first_heading(body, path.stem.replace('-', ' ').replace('_', ' ').title())
    items.append({
        'title': title,
        'file': 'posts/' + path.name,
        'category': meta.get('category', 'Other'),
        'tags': meta.get('tags', []),
        'date': meta.get('date', date.fromtimestamp(path.stat().st_mtime).isoformat()),
        'difficulty': meta.get('difficulty', 'N/A'),
        'excerpt': meta.get('excerpt') or excerpt(body),
        'featured': bool(meta.get('featured', False)),
        'content': body,
    })

OUT.write_text(json.dumps(items, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'Generated {OUT.relative_to(ROOT)} with {len(items)} post(s).')
