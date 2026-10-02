import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { NEVER } from 'rxjs';

import { persistWalletState, waitForCoreWalletState } from '../network/wallet';

test('wallet synchronization fails within its configured bound', async () => {
  const wallet = { state: () => NEVER };
  await assert.rejects(
    waitForCoreWalletState(wallet as never, 10),
    /Wallet synchronization did not complete within 10 milliseconds/,
  );
});

test('wallet persistence skips an unresponsive child instead of hanging shutdown', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'veil-wallet-timeout-'));
  const responsive = { serializeState: async () => 'saved' };
  const unresponsive = { serializeState: async () => new Promise(() => undefined) };
  const context = { wallet: {
    shielded: responsive,
    unshielded: unresponsive,
    dust: responsive,
  } };

  try {
    await persistWalletState('preprod', context as never, cwd, 10);
    const base = join(cwd, '.midnight-wallet-state', 'preprod');
    const shielded = JSON.parse(await readFile(join(base, 'shielded.json'), 'utf8'));
    const dust = JSON.parse(await readFile(join(base, 'dust.json'), 'utf8'));
    assert.equal(shielded.state, 'saved');
    await assert.rejects(readFile(join(base, 'unshielded.json'), 'utf8'), { code: 'ENOENT' });
    assert.equal(dust.state, 'saved');
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
