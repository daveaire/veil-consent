import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';

await esbuild.build({
  entryPoints: ['web/proof-client.js'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  outfile: 'web/proof-client.bundle.js',
  assetNames: 'midnight-runtime',
  plugins: [wasmLoader({ mode: 'deferred' })],
});

