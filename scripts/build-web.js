import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';

await esbuild.build({
  entryPoints: {
    'organizer.bundle': 'frontend/organizer.js',
    'participant.bundle': 'frontend/participant.js',
  },
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  outdir: 'frontend',
  assetNames: 'midnight-runtime',
  plugins: [wasmLoader({ mode: 'deferred' })],
});
