#!/usr/bin/env python3
"""Static checks for every app variant. Run before every commit and in CI.

    python3 tools/check.py                 # all apps
    python3 tools/check.py apps/gym-tracker/muscle-map
    python3 tools/check.py --base origin/main   # also check version bumps against main (CI)

Exit code 1 when any error is found. Needs: pip install jsonschema
"""
import json
import re
import subprocess
import sys
import tempfile
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = json.loads((ROOT / 'schemas' / 'manifest.schema.json').read_text())
MAX_BYTES = 2 * 1024 * 1024     # hard limit for one HTML file
WARN_BYTES = 600 * 1024         # nudge to subset fonts / drop images

REQUIRED_CSP = ["default-src 'none'", "connect-src 'none'", "base-uri 'none'", "form-action 'none'"]
FORBIDDEN = [
    (r'<script[^>]+\bsrc\s*=', 'external <script src>'),
    (r'<link[^>]+rel\s*=\s*["\']?(stylesheet|preload|prefetch|preconnect|dns-prefetch|modulepreload)', 'external <link>'),
    (r'<iframe\b', '<iframe>'),
    (r'<(object|embed)\b', '<object>/<embed>'),
    (r'<base\b', '<base>'),
    (r'@import\b', 'CSS @import'),
    (r'\bfetch\s*\(', 'fetch()'),
    (r'\bXMLHttpRequest\b', 'XMLHttpRequest'),
    (r'\bWebSocket\b', 'WebSocket'),
    (r'\bEventSource\b', 'EventSource'),
    (r'\bsendBeacon\b', 'navigator.sendBeacon'),
    (r'\bimportScripts\b', 'importScripts'),
    (r'(?<![\w.])eval\s*\(', 'eval()'),
    (r'\bnew\s+Function\s*\(', 'new Function()'),
    (r'\bdocument\.write\s*\(', 'document.write()'),
    (r'\bnew\s+Worker\s*\(', 'Web Worker'),
    (r'\bserviceWorker\b', 'service worker'),
    (r'\bdocument\.cookie\b', 'cookies'),
]
# URLs are allowed only as XML namespaces and in comments/credits; anything that
# a browser would load is caught by FORBIDDEN + the CSP + tools/smoke-test.mjs.
URL_ALLOW = re.compile(r'^https?://www\.w3\.org/')
URL_IN_ATTR = re.compile(r'''\b(?:src|href|action|poster|data|srcset|formaction)\s*=\s*["']?\s*(https?:)?//''', re.I)
CSS_URL = re.compile(r'url\(\s*["\']?\s*(?:https?:)?//', re.I)


def variant_dirs(args):
    if args:
        return [Path(a).resolve() for a in args]
    return sorted(p.parent for p in (ROOT / 'apps').glob('*/*/manifest.json'))


def check_variant(d, errors, warnings, storage_owner):
    rel = d.relative_to(ROOT).as_posix()
    err = lambda m: errors.append(f'{rel}: {m}')
    warn = lambda m: warnings.append(f'{rel}: {m}')
    try:
        m = json.loads((d / 'manifest.json').read_text(encoding='utf-8'))
    except Exception as e:  # noqa: BLE001
        return err(f'manifest.json is not valid JSON ({e})')

    try:
        import jsonschema
        v = jsonschema.Draft202012Validator(SCHEMA)
        for e in sorted(v.iter_errors(m), key=lambda e: list(e.path)):
            err(f'manifest: {"/".join(map(str, e.path)) or "(root)"}: {e.message}')
    except ImportError:
        warn('jsonschema not installed, schema not validated (pip install jsonschema)')

    t, var = d.parent.name, d.name
    if m.get('id') != f'{t}/{var}' or m.get('appType') != t or m.get('variant') != var:
        err(f'id/appType/variant must match the folder: expected id "{t}/{var}"')
    if m.get('entry') != f'{t}-{var}.html':
        err(f'entry must be "{t}-{var}.html"')
    if re.fullmatch(r'v\d+|version-?\d+|new|old|final|latest|\d+', var):
        err(f'variant "{var}" looks like a version; name what makes the variant different (e.g. muscle-map)')

    changelog = d / 'CHANGELOG.md'
    if not changelog.is_file():
        err('missing CHANGELOG.md')
    elif m.get('version') and not re.search(rf'^## \[?{re.escape(m["version"])}\]?\b', changelog.read_text(encoding='utf-8'), re.M):
        err(f'CHANGELOG.md has no "## {m.get("version")}" entry')
    for lang in m.get('languages', []):
        for field in ('name', 'variantName', 'description'):
            if lang not in m.get(field, {}):
                err(f'{field} is missing language "{lang}"')

    for f in [s['file'] for s in m.get('screenshots', [])] + [s['file'] for s in m.get('sampleData', [])]:
        if not (d / f).is_file():
            err(f'missing file {f}')
    for s in m.get('sampleData', []):
        p = d / s['file']
        if p.is_file() and p.suffix == '.json':
            try:
                json.loads(p.read_text(encoding='utf-8'))
            except Exception as e:  # noqa: BLE001
                err(f'{s["file"]} is not valid JSON ({e})')

    for kind, keys in m.get('storage', {}).items():
        for k in keys:
            owner = storage_owner.setdefault((kind, k), rel)
            if owner != rel:
                err(f'{kind} key "{k}" is already used by {owner}')

    readme = d / 'README.md'
    if not readme.is_file():
        err('missing README.md (short description + screenshots, see ARTIFACTS-DEVELOPMENT.md)')
    else:
        text = readme.read_text(encoding='utf-8')
        shown = set(re.findall(r'(?:src="|\]\()\.?/?(screenshots/[^")\s]+)', text))
        if not shown:
            err('README.md must show the app screenshots (e.g. <img src="screenshots/phone-light.png">)')
        for f in shown:
            if not (d / f).is_file():
                err(f'README.md shows missing file {f}')

    allowed = {'manifest.json', m.get('entry'), 'README.md', 'CHANGELOG.md', 'build.py', 'screenshots', 'sample-data', 'src', 'assets'}
    for p in d.iterdir():
        if p.name not in allowed:
            err(f'unexpected file or folder "{p.name}" (see ARTIFACTS-DEVELOPMENT.md, "Folder layout")')

    html_path = d / (m.get('entry') or '')
    if not html_path.is_file():
        return err(f'entry file {m.get("entry")} not found')
    html = html_path.read_text(encoding='utf-8')
    size = len(html.encode())
    if size > MAX_BYTES:
        err(f'{html_path.name} is {size:,} bytes (limit {MAX_BYTES:,})')
    elif size > WARN_BYTES:
        warn(f'{html_path.name} is {size:,} bytes; consider subsetting fonts or dropping images')

    if not html.lstrip().lower().startswith('<!doctype html>'):
        err('HTML must start with <!doctype html>')
    if not re.search(r'<html[^>]+lang=', html, re.I):
        err('<html> needs a lang attribute')
    if 'name="viewport"' not in html:
        err('missing viewport meta')
    csp = re.search(r'<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"', html, re.I)
    if not csp:
        err('missing Content-Security-Policy meta')
    else:
        for rule in REQUIRED_CSP:
            if rule not in csp.group(1):
                err(f'CSP must contain {rule}')
        if re.search(r'https?:|\*', csp.group(1)):
            err('CSP must not allow any remote origin')
    for pattern, label in FORBIDDEN:
        hit = re.search(pattern, html, re.I)
        if hit:
            line = html.count('\n', 0, hit.start()) + 1
            err(f'forbidden: {label} (line {line})')
    for rx in (URL_IN_ATTR, CSS_URL):
        for hit in rx.finditer(html):
            line = html.count('\n', 0, hit.start()) + 1
            err(f'remote URL in an attribute or CSS url() (line {line})')
    for url in set(re.findall(r'https?://[^\s"\'<>)]+', html)):
        if not URL_ALLOW.match(url):
            warn(f'URL in source: {url} (fine in a comment or credit line, never as a resource)')

    if re.search(r'<footer\b', html, re.I):
        err('<footer> found: apps have no footer (ARTIFACTS-DEVELOPMENT.md, Design and UX)')
    if re.search(r'\blogo\b', html, re.I):
        warn('the word "logo" appears: apps show no logo; check it is not one')

    build = m.get('build')
    if build:
        with tempfile.TemporaryDirectory() as tmp:
            copy = Path(tmp) / d.name
            shutil.copytree(d, copy)
            r = subprocess.run(build['command'], shell=True, cwd=copy, capture_output=True, text=True)
            if r.returncode != 0:
                err(f'build failed: {r.stderr.strip()[:300]}')
            elif (copy / m['entry']).read_bytes() != html_path.read_bytes():
                err(f'{m["entry"]} is out of date: run "{build["command"]}" in {rel}')


def semver(v):
    return tuple(int(x) for x in v.split('.'))


def check_versions(d, base, errors):
    """Compare a variant with the base ref: changed app => version bump, data change => major."""
    rel = d.relative_to(ROOT).as_posix()
    old = subprocess.run(['git', 'show', f'{base}:{rel}/manifest.json'], cwd=ROOT, capture_output=True, text=True)
    if old.returncode != 0:
        return  # new variant
    o = json.loads(old.stdout)
    n = json.loads((d / 'manifest.json').read_text(encoding='utf-8'))
    changed = subprocess.run(['git', 'diff', '--name-only', base, '--', rel], cwd=ROOT, capture_output=True, text=True).stdout.split()
    code_changed = [f for f in changed if not re.search(r'/(README\.md|CHANGELOG\.md|screenshots/.*)$', f)
                    and not f.endswith('/manifest.json')]
    try:
        ov, nv = semver(o['version']), semver(n['version'])
    except (KeyError, ValueError):
        return
    if code_changed and nv <= ov:
        errors.append(f'{rel}: app files changed but version {n["version"]} was not increased (was {o["version"]})')
    if nv < ov:
        errors.append(f'{rel}: version went down from {o["version"]} to {n["version"]}')
    if n.get('dataVersion', 1) < o.get('dataVersion', 1):
        errors.append(f'{rel}: dataVersion went down')
    if n.get('dataVersion', 1) > o.get('dataVersion', 1) and nv[0] <= ov[0]:
        errors.append(f'{rel}: dataVersion changed, so the MAJOR version must increase (was {o["version"]}, now {n["version"]})')
    if n.get('storage') != o.get('storage') and nv[0] <= ov[0]:
        errors.append(f'{rel}: storage keys changed; existing data would be lost, so this needs a MAJOR version and a migration')


def main():
    args = sys.argv[1:]
    base = None
    if '--base' in args:
        i = args.index('--base'); base = args[i + 1]; del args[i:i + 2]
    errors, warnings, storage_owner = [], [], {}
    dirs = variant_dirs(args)
    for d in dirs:
        check_variant(d, errors, warnings, storage_owner)
        if base:
            check_versions(d, base, errors)
    for w in warnings:
        print(f'warning: {w}')
    for e in errors:
        print(f'ERROR:   {e}')
    print(f'\n{len(dirs)} app variant(s), {len(errors)} error(s), {len(warnings)} warning(s)')
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
