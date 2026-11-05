"""Build gym-tracker-muscle-map.html from src/.

Run from this folder:  python3 build.py
The sources are split only to keep them editable; the built single HTML file
is what ships. Never edit the built file by hand.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
OUT = HERE / 'gym-tracker-muscle-map.html'


def read(name):
    return (HERE / 'src' / name).read_text(encoding='utf-8')


body = json.dumps(json.loads(read('body.json')), separators=(',', ':'))
js = (read('app.js')
      .replace('/*@LIB@*/', read('lib.js'))
      .replace('/*@I18N@*/', read('i18n.js'))
      .replace('/*@BODY@*/null', body))
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
