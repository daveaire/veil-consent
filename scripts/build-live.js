import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('live/public');
const output = path.resolve('live/dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  cp(path.join(source, 'index.html'), path.join(output, 'index.html')),
  cp(path.join(source, 'styles.css'), path.join(output, 'styles.css')),
  cp(path.join(source, 'app.js'), path.join(output, 'app.js')),
  build({
    entryPoints: [path.join(source, 'participant.js')],
    outfile: path.join(output, 'participant.bundle.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    minify: true,
    loader: { '.wasm': 'file' },
    assetNames: 'assets/[name]-[hash]',
  }),
]);
console.log(`Built live pilot in ${output}`);

