#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [ROOT / 'data' / 'references.json', ROOT / 'tableConvert.com_stidj2.json']

def ensure_url_field(path: Path):
    if not path.exists():
        print(f"Skipping missing: {path}")
        return
    backup = path.with_suffix(path.suffix + '.bak')
    if not backup.exists():
        path.replace(backup)
        path = backup
    else:
        # read from original
        pass

    # ensure we read from the original now (backup exists)
    with backup.open('r', encoding='utf-8') as f:
        data = json.load(f)

    changed = False
    for item in data:
        if 'URL' not in item:
            item['URL'] = ''
            changed = True

    if changed:
        out = path.parent / path.name
        with out.open('w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Wrote updated {out}")
    else:
        print(f"No changes needed for {path}")

def main():
    for p in FILES:
        ensure_url_field(p)

if __name__ == '__main__':
    main()
