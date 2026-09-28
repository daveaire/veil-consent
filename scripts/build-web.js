import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { rm } from 'node:fs/promises';

await rm('frontend/chunks', { recursive: true, force: true });

await esbuild.build({
  entryPoints: {
    'organizer.bundle': 'frontend/organizer.js',
    'participant.bundle': 'frontend/participant.js',
  },
  bundle: true,
  format: 'esm',
  splitting: true,
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  outdir: 'frontend',
  assetNames: 'midnight-runtime',
  chunkNames: 'chunks/[name]-[hash]',
  plugins: [wasmLoader({ mode: 'deferred' })],
});
