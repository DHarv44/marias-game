// Serves the built game (one HTML file) with compression, caching and a strict Content Security Policy.
// No dependencies. Env: PORT (default 3000), HOST (default: every interface, IPv6 when the host has it), GAME_FILE (default dist/index.html).
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { brotliCompressSync, gzipSync, constants as zlib } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

// Every script is inline, so the policy allows exactly those scripts by hash and nothing else.
export function contentSecurityPolicy(html) {
  const hashes = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  return [
    "default-src 'none'",
    `script-src ${hashes.join(' ')}`,
    "style-src 'unsafe-inline'",
    'img-src data: blob:',
    'font-src data:',
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function createGameServer(html) {
  const body = Buffer.from(html);
  const encoded = {
    br: brotliCompressSync(body, { params: { [zlib.BROTLI_PARAM_QUALITY]: 11, [zlib.BROTLI_PARAM_SIZE_HINT]: body.length } }),
    gzip: gzipSync(body, { level: 9 }),
  };
  const etag = `"${createHash('sha256').update(body).digest('base64url').slice(0, 27)}"`;
  const security = {
    'Content-Security-Policy': contentSecurityPolicy(html),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  };

  return createServer((req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    const send = (status, headers, payload) => { res.writeHead(status, headers); res.end(req.method === 'HEAD' ? undefined : payload); };

    if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain' }, 'Method Not Allowed');
    if (path === '/healthz') return send(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }, 'ok');
    if (path !== '/' && path !== '/index.html') return send(404, { 'Content-Type': 'text/plain', ...security }, 'Not Found');

    // Revalidate every load so a new deploy shows up at once; unchanged pages cost a 304.
    const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', ETag: etag, Vary: 'Accept-Encoding', ...security };
    if (req.headers['if-none-match'] === etag) return send(304, headers);
    const accept = String(req.headers['accept-encoding'] || '');
    const enc = /\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null;
    const payload = enc ? encoded[enc] : body;
    if (enc) headers['Content-Encoding'] = enc;
    headers['Content-Length'] = payload.length;
    send(200, headers, payload);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = resolve(process.env.GAME_FILE || join(ROOT, 'dist', 'index.html'));
  let html;
  try { html = readFileSync(file, 'utf8'); } catch {
    console.error(`Cannot read ${file}. Run "npm run build" first.`);
    process.exit(1);
  }
  const server = createGameServer(html);
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || undefined;
  server.listen(port, host, () => console.log(`Maria's Game listening on port ${port}`));
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
