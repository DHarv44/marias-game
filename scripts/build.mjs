// Builds Maria's Game into one self-contained HTML file: fonts, art and code inlined.
// Usage: node scripts/build.mjs [output]   (default: dist/index.html)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const FONTS = join(ROOT, 'assets', 'fonts');
const FACES = [['Rozha One', 400, 'rozha-one-latin-400-normal.woff2'],
  ...[500, 700, 800].map(w => ['Mulish', w, `mulish-latin-${w}-normal.woff2`])];

const read = name => readFileSync(join(SRC, name), 'utf8');

function fill(text, marker, value) {
  if (!text.includes(marker)) throw new Error(`build: placeholder ${marker} not found`);
  return text.split(marker).join(value);
}

function fontCss() {
  const rules = FACES.map(([family, weight, file]) =>
    `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;` +
    `src:url(data:font/woff2;base64,${readFileSync(join(FONTS, file)).toString('base64')}) format('woff2')}`);
  rules.push('/* Rozha One: Copyright (c) 2014 Indian Type Foundry. Mulish: Copyright 2016 The Mulish Project Authors. Both SIL Open Font License 1.1. */');
  return rules.join('\n');
}

export function build() {
  const pieces = fill(read('pieces.js'), '/*__ART__*/', read('art.js') + read('artlib.js'));
  const ui = fill(read('ui.js'), '/*__PIECES__*/', pieces);
  const levels = fill(read('levels.js'), '/*__FESTIVALS__*/', read('festivals.js'));
  let html = read('shell.html');
  for (const [marker, value] of [['/*__FONTS__*/', fontCss()], ['/*__ENGINE__*/', read('engine.js')],
    ['/*__LEVELS__*/', levels], ['/*__UI__*/', ui]]) html = fill(html, marker, value);
  return html;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = resolve(process.argv[2] || join(ROOT, 'dist', 'index.html'));
  const html = build();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`${out} ${Buffer.byteLength(html).toLocaleString()} bytes`);
}
