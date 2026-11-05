#!/usr/bin/env python3
"""Create a starter README.md for an app variant from its manifest.

    python3 tools/variant_readme.py apps/<appType>/<variant> [--force]

Writes the standard parts (title, description, screenshots, how to use, data,
credits). Edit the "Features" list by hand afterwards; keep it short.
"""
import json
import sys
from pathlib import Path

FEATURES_PLACEHOLDER = '- (3-6 short bullets: what it does)'


def render(d: Path, features=None) -> str:
    m = json.loads((d / 'manifest.json').read_text(encoding='utf-8'))
    shots = '\n'.join(
        f'  <img src="{s["file"]}" width="240" alt="{s.get("caption", {}).get("en", s["file"])}">'
        for s in m['screenshots'])
    feats = '\n'.join(f'- {f}' for f in features) if features else FEATURES_PLACEHOLDER
    storage = ', '.join(f'`{k}`' for k in m['storage'].get('localStorage', []))
    fmt = m.get('dataFormats', {})
    exp = ', '.join(x.upper() for x in fmt.get('export', [])) or 'none'
    imp = ', '.join(x.upper() for x in fmt.get('import', [])) or 'none'
    sample = ''.join(f'\n- Sample data (CC0, free to reuse): [{Path(s["file"]).name}]({s["file"]}) ({s["description"]["en"]})' for s in m.get('sampleData', []))
    credits = ''.join(f'\n- {t["name"]} ({t["license"]}): {t["usage"]}. <{t["url"]}>' for t in m.get('thirdParty', []))
    authors = ', '.join(f'[@{a["github"]}](https://github.com/{a["github"]})' for a in m['authors'])
    return f"""# {m['name']['en']} · {m['variantName']['en']}

{m['description']['en']}

**PL:** **{m['name'].get('pl', '')}** · {m['description'].get('pl', '')}

<p>
{shots}
</p>

## Features

{feats}

## Use it

Download [`{m['entry']}`]({m['entry']}) and open it in any browser, or give the
file to an AI chat and ask it to show it as an artifact. English and Polish,
light and dark, works offline.

## Your data

- Stays in this browser only (local storage: {storage}). Nothing is sent anywhere.
- Export: {exp} · Import: {imp}. Back up now and then.{sample}

## Credits

- Authors: {authors}
- Version {m['version']} · {m['license']} license · [Changelog](CHANGELOG.md){credits}
"""


if __name__ == '__main__':
    d = Path(sys.argv[1]).resolve()
    out = d / 'README.md'
    if out.exists() and '--force' not in sys.argv:
        sys.exit(f'{out} exists; use --force to overwrite')
    out.write_text(render(d), encoding='utf-8')
    print(f'wrote {out}')
