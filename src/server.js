import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend');
const port = Number(process.env.PORT || 4210);
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/participant.html', ['participant.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']],
  ['/organizer.bundle.js', ['organizer.bundle.js', 'text/javascript; charset=utf-8']],
  ['/participant.bundle.js', ['participant.bundle.js', 'text/javascript; charset=utf-8']],
  ['/veil-consent-mvp.mp4', ['veil-consent-mvp.mp4', 'video/mp4']],
]);

http.createServer((request, response) => {
  const requestedPath = new URL(request.url, 'http://127.0.0.1').pathname;
  const pathname = requestedPath.startsWith('/veil-consent/')
    ? requestedPath.slice('/veil-consent'.length)
    : requestedPath;
  const chunk = /^\/chunks\/[A-Za-z0-9_-]+\.(?:js|wasm)$/.test(pathname)
    ? [pathname.slice(1), pathname.endsWith('.wasm') ? 'application/wasm' : 'text/javascript; charset=utf-8']
    : undefined;
  const asset = assets.get(pathname) || chunk;
  if (!asset) return response.writeHead(404).end('Not found');
  const [file, contentType] = asset;
  const body = fs.readFileSync(path.join(root, file));
  const acceptsGzip = /\bgzip\b/.test(request.headers['accept-encoding'] || '');
  const compressible = /^(text\/|application\/(javascript|wasm)|image\/svg\+xml)/.test(contentType);
  const encoded = acceptsGzip && compressible ? zlib.gzipSync(body, { level: 9 }) : body;
  response.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; connect-src 'self' https://indexer.preprod.midnight.network wss://indexer.preprod.midnight.network; object-src 'none'; base-uri 'none'",
    'Vary': 'Accept-Encoding',
    ...(encoded === body ? {} : { 'Content-Encoding': 'gzip' }),
  });
  response.end(encoded);
}).listen(port, '127.0.0.1', () => {
  console.log(`VeilConsent dashboard: http://127.0.0.1:${port}`);
});
