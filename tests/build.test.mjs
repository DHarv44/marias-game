import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from '../scripts/build.mjs';

const html = build();

test('every placeholder is filled', () => {
  assert.doesNotMatch(html, /\/\*__[A-Z]+__\*\//);
});

test('the page is self-contained: no external scripts, styles or fetches', () => {
  assert.doesNotMatch(html, /<(script|link)[^>]+(src|href)=["']https?:/i);
  assert.doesNotMatch(html, /\bfetch\(|XMLHttpRequest/);
});

test('fonts and illustrated pieces are inlined', () => {
  assert.equal((html.match(/@font-face/g) || []).length, 4);
  assert.match(html, /const ART=\{/);
});

test('no test-only switches ship', () => {
  assert.doesNotMatch(html, /TEST_UNLOCK|console\.log/);
});
