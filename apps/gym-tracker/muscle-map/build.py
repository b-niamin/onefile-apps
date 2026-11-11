"""Build gym-tracker-muscle-map.html from src/.

Run from this folder:  python3 build.py
The sources are split only to keep them editable; the built single HTML file
is what ships. Never edit the built file by hand.
"""
import base64
import json
import pathlib

HERE = pathlib.Path(__file__).parent
OUT = HERE / 'gym-tracker-muscle-map.html'


def read(name):
    return (HERE / 'src' / name).read_text(encoding='utf-8')


body = json.dumps(json.loads(read('body.json')), separators=(',', ':'))

# exercise photos/drawings (src/img/<id>_0.webp, <id>_1.webp) inlined as data URIs
imgs = {}
for f in sorted((HERE / 'src' / 'img').glob('*_[01].webp')):
    ex_id, frame = f.stem.rsplit('_', 1)
    uri = 'data:image/webp;base64,' + base64.b64encode(f.read_bytes()).decode()
    imgs.setdefault(ex_id, ['', ''])[int(frame)] = uri
img_js = json.dumps(imgs, separators=(',', ':'))
js = (read('app.js')
      .replace('/*@LIB@*/', read('lib.js'))
      .replace('/*@I18N@*/', read('i18n.js'))
      .replace('/*@BODY@*/null', body)
      .replace('/*@IMG@*/null', img_js))
html = (read('shell.html')
        .replace('/*@FONTS@*/', read('fonts.css'))
        .replace('/*@CSS@*/', read('style.css'))
        .replace('/*@JS@*/', js))

page = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        + html.replace('<div class="wrap">', '</head>\n<body>\n<div class="wrap">', 1)
        + '\n</body>\n</html>\n')
OUT.write_text(page, encoding='utf-8')
print(f'{OUT.name}: {len(page):,} bytes')
