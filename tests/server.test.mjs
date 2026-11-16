import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync, brotliDecompressSync } from 'node:zlib';
import { build } from '../scripts/build.mjs';
import { createGameServer } from '../server.mjs';

const html = build();
let server, base;
before(async () => {
  server = createGameServer(html);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(r => server.close(r)));

const get = (path, headers = {}, method = 'GET') => fetch(base + path, { headers, method, decompress: false });

test('serves the game with security headers', async () => {
  const res = await get('/', { 'Accept-Encoding': 'identity' });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(await res.text(), html);
});

test('the CSP allows exactly the inline scripts by hash', async () => {
  const csp = (await get('/')).headers.get('content-security-policy');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert.equal(scripts.length, 3);
  for (const s of scripts) assert.ok(csp.includes(`'sha256-${createHash('sha256').update(s).digest('base64')}'`));
  assert.match(csp, /default-src 'none'/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
});

test('compresses with brotli or gzip', async () => {
  const { request } = await import('node:http');
  const raw = enc => new Promise((ok, fail) => request(base + '/', { headers: { 'Accept-Encoding': enc } }, res => {
    const parts = []; res.on('data', d => parts.push(d)); res.on('end', () => ok({ enc: res.headers['content-encoding'], body: Buffer.concat(parts) }));
  }).on('error', fail).end());
  const br = await raw('br, gzip');
  assert.equal(br.enc, 'br');
  assert.equal(brotliDecompressSync(br.body).toString(), html);
  const gz = await raw('gzip');
  assert.equal(gz.enc, 'gzip');
  assert.equal(gunzipSync(gz.body).toString(), html);
});

test('answers 304 when the ETag matches', async () => {
  const etag = (await get('/')).headers.get('etag');
  assert.equal((await get('/', { 'If-None-Match': etag })).status, 304);
});

test('health check, unknown paths and methods', async () => {
  const health = await get('/healthz');
  assert.equal(health.status, 200);
  assert.equal(await health.text(), 'ok');
  assert.equal((await get('/nope')).status, 404);
  assert.equal((await get('/', {}, 'POST')).status, 405);
  assert.equal((await get('/', {}, 'HEAD')).status, 200);
});
