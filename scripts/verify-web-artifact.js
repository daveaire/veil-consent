import { access, readFile, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const frontend = resolve(root, 'frontend');
const pages = ['index.html', 'participant.html'];
const assets = ['organizer.bundle.js', 'participant.bundle.js', 'styles.css'];

function requireText(source, expected, file) {
  if (!source.includes(expected)) {
    throw new Error(`${file} is missing required release marker: ${expected}`);
  }
}

for (const page of pages) {
  const source = await readFile(resolve(frontend, page), 'utf8');
  requireText(source, 'Content-Security-Policy', page);
  requireText(source, 'class="skip-link"', page);
  requireText(source, 'aria-live="polite"', page);
  if (/<script(?![^>]+src=)/i.test(source)) {
    throw new Error(`${page} contains an inline script that violates the deployment CSP`);
  }
}

const organizer = await readFile(resolve(frontend, 'index.html'), 'utf8');
requireText(organizer, 'preprod.midnightexplorer.com/contracts/', 'index.html');
requireText(organizer, 'veil-consent-mvp.mp4', 'index.html');
requireText(organizer, 'participant.html', 'index.html');

for (const asset of assets) {
  const file = resolve(frontend, asset);
  await access(file, constants.R_OK);
  const { size } = await stat(file);
  if (size < 256) throw new Error(`${asset} is unexpectedly small (${size} bytes)`);
}

console.log(`Verified ${pages.length} pages and ${assets.length} release assets.`);
