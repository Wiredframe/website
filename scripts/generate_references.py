#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'tableConvert.com_stidj2.json'
OUT = ROOT / 'data' / 'references.json'

def slugify(title: str) -> str:
    if not title:
        return ''
    s = title.strip().lower()
    # basic german transliteration
    s = s.replace('ä','ae').replace('ö','oe').replace('ü','ue').replace('ß','ss')
    # replace ampersand and slashes with hyphen
    s = s.replace('&','and')
    s = re.sub(r"[\s\/\\]+","-", s)
    # remove characters not a-z0-9-_
    s = re.sub(r"[^a-z0-9\-]", '', s)
    s = re.sub(r"-+", '-', s)
    s = s.strip('-')
    return s

def main():
    if not SRC.exists():
        print(f"Source JSON not found: {SRC}")
        return
    with SRC.open('r', encoding='utf-8') as f:
        data = json.load(f)

    out = []
    seen = {}
    for i, item in enumerate(data):
        obj = dict(item)
        title = (obj.get('Projekttitel') or '').strip()
        base = slugify(title) or f'project-{i+1}'
        # ensure unique filename
        count = seen.get(base, 0)
        seen[base] = count + 1
        filename = base + (f"-{count+1}" if count else '') + '.png'
        obj['Image'] = filename
        out.append(obj)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open('w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Wrote {OUT} ({len(out)} entries)")

if __name__ == '__main__':
    main()
