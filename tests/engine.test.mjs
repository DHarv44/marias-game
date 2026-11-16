// Plays every story leaf and every bonus round once, headless, and fails on any engine error.
// Win rates are a balance question, not a pass/fail one: see "npm run balance".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { play, STORY_TOTAL, BONUS } = createRequire(import.meta.url)('./sim.js');

test('every story leaf plays without errors', async () => {
  for (let n = 1; n <= STORY_TOTAL; n++) {
    const r = await play(n, 0);
    assert.ok(!r.err, `leaf ${n}: ${r.err}`);
  }
});

test('every bonus round plays without errors', async () => {
  for (const b of BONUS) {
    const r = await play(b.after, 0, true);
    assert.ok(!r.err, `bonus after leaf ${b.after}: ${r.err}`);
  }
});
