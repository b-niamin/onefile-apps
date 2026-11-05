#!/usr/bin/env python3
"""Regenerate catalog.json and the app table in README.md from the manifests.

    python3 tools/catalog.py          # write files
    python3 tools/catalog.py --check  # fail if they are out of date (CI)
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
START, END = '<!-- catalog:start -->', '<!-- catalog:end -->'


def load():
    out = []
    for p in sorted((ROOT / 'apps').glob('*/*/manifest.json')):
        m = json.loads(p.read_text(encoding='utf-8'))
        if m.get('status') == 'draft':
            continue
        base = p.parent.relative_to(ROOT).as_posix()
        out.append({
            'id': m['id'], 'appType': m['appType'], 'variant': m['variant'],
            'name': m['name'], 'variantName': m['variantName'], 'description': m['description'],
            'version': m['version'], 'status': m['status'], 'category': m['category'], 'tags': m['tags'],
            'languages': m['languages'], 'path': base, 'file': f'{base}/{m["entry"]}',
            'screenshot': f'{base}/{m["screenshots"][0]["file"]}',
        })
    return out


def table(apps):
    rows = ['| | App | |', '|---|---|---|']
    for a in apps:
        name = f'{a["name"]["en"]} · {a["variantName"]["en"]}'
        rows.append(f'| <img src="{a["screenshot"]}" width="96" alt="{name}"> | '
                    f'**{name}**<br>{a["description"]["en"]} | [more]({a["path"]}/README.md) |')
    return '\n'.join(rows)


def main():
    check = '--check' in sys.argv
    apps = load()
    catalog = json.dumps({'schemaVersion': 1, 'apps': apps}, ensure_ascii=False, indent=2) + '\n'
    readme_path = ROOT / 'README.md'
    readme = readme_path.read_text(encoding='utf-8')
    a, b = readme.index(START) + len(START), readme.index(END)
    new_readme = readme[:a] + '\n' + table(apps) + '\n' + readme[b:]
    cat_path = ROOT / 'catalog.json'
    old_cat = cat_path.read_text(encoding='utf-8') if cat_path.exists() else ''
    if check:
        if old_cat != catalog or readme != new_readme:
            sys.exit('catalog.json or README.md is out of date: run python3 tools/catalog.py')
        print('catalog up to date')
        return
    cat_path.write_text(catalog, encoding='utf-8')
    readme_path.write_text(new_readme, encoding='utf-8')
    print(f'{len(apps)} apps written to catalog.json and README.md')


if __name__ == '__main__':
    main()
