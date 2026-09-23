import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
const port = Number(process.env.PORT || 4210);
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/proof-client.bundle.js', ['proof-client.bundle.js', 'text/javascript; charset=utf-8']],
  ['/midnight-runtime.wasm', ['midnight-runtime.wasm', 'application/wasm']],
]);

http.createServer((request, response) => {
  const asset = assets.get(request.url);
  if (!asset) return response.writeHead(404).end('Not found');
  const [file, contentType] = asset;
  response.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://indexer.preprod.midnight.network wss://indexer.preprod.midnight.network",
  });
  response.end(fs.readFileSync(path.join(root, file)));
}).listen(port, '127.0.0.1', () => {
  console.log(`VeilConsent dashboard: http://127.0.0.1:${port}`);
});
