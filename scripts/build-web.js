import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';

await esbuild.build({
  entryPoints: {
    'proof-client.bundle': 'frontend/proof-client.js',
    'participant-exchange.bundle': 'frontend/participant-exchange.js',
  },
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  outdir: 'frontend',
  assetNames: 'midnight-runtime',
  plugins: [wasmLoader({ mode: 'deferred' })],
});
