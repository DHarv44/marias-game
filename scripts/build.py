#!/usr/bin/env python3
"""Build Maria's Game into one self-contained HTML file (fonts, art and code inlined).

Usage: python3 scripts/build.py [output]   (default: dist/index.html)
"""
import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
FONTS = ROOT / 'assets' / 'fonts'

FACES = [('Rozha One', 400, 'rozha-one-latin-400-normal.woff2')] + \
        [('Mulish', w, f'mulish-latin-{w}-normal.woff2') for w in (500, 700, 800)]


def read(name):
    return (SRC / name).read_text(encoding='utf-8')


def font_css():
    rules = []
    for family, weight, file in FACES:
        data = base64.b64encode((FONTS / file).read_bytes()).decode()
        rules.append(f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};font-display:swap;"
                     f"src:url(data:font/woff2;base64,{data}) format('woff2')}}")
    rules.append('/* Rozha One: Copyright (c) 2014 Indian Type Foundry. Mulish: Copyright 2016 The Mulish Project Authors. '
                 'Both SIL Open Font License 1.1. */')
    return '\n'.join(rules)


def fill(text, marker, value):
    if marker not in text:
        sys.exit(f'build: placeholder {marker} not found')
    return text.replace(marker, value)


def main():
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist' / 'index.html'
    pieces = fill(read('pieces.js'), '/*__ART__*/', read('art.js') + read('artlib.js'))
    ui = fill(read('ui.js'), '/*__PIECES__*/', pieces)
    levels = fill(read('levels.js'), '/*__FESTIVALS__*/', read('festivals.js'))
    html = read('shell.html')
    for marker, value in (('/*__FONTS__*/', font_css()), ('/*__ENGINE__*/', read('engine.js')),
                          ('/*__LEVELS__*/', levels), ('/*__UI__*/', ui)):
        html = fill(html, marker, value)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'{out} {len(html):,} bytes')


if __name__ == '__main__':
    main()
