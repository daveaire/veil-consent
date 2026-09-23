/** Generate or restore the selected network wallet and print only its public address. */
import { WebSocket } from 'ws';

import { getOrCreateWallet, resolveNetwork } from './network';
import { createWallet, persistWalletState, unshieldedToken } from './wallet';

// @ts-expect-error wallet sync requires a global WebSocket implementation
globalThis.WebSocket = WebSocket;

const { network, config: networkConfig } = resolveNetwork();
const walletRecord = getOrCreateWallet(network);

async function main(): Promise<void> {
  const walletCtx = await createWallet({ network, networkConfig, seed: walletRecord.seed });
  try {
    const address = walletCtx.unshieldedKeystore.getBech32Address().toString();
    console.log(`Network: ${network}`);
    console.log(`Address: ${address}`);
    console.log(`Syncing ${network} wallet...`);
    const rawTimeout = Number(process.env.MIDNIGHT_SYNC_TIMEOUT_MS);
    const timeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 180_000;
    const state = await Promise.race([
      walletCtx.wallet.waitForSyncedState(),
      new Promise<never>((_, reject) => setTimeout(
        () => reject(new Error(`Wallet sync did not complete within ${Math.round(timeoutMs / 1000)} seconds. The address above is still valid and can be funded before retrying.`)),
        timeoutMs,
      )),
    ]);
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    const registeredUtxos = state.unshielded.availableCoins.filter(
      (coin: any) => coin.meta?.registeredForDustGeneration,
    ).length;
    const dustBalance = state.dust.balance(new Date());

    console.log(`tNIGHT:  ${balance}`);
    console.log(`DUST:    ${dustBalance}`);
    console.log(`DUST-registered UTXOs: ${registeredUtxos}/${state.unshielded.availableCoins.length}`);
    if (networkConfig.faucet) console.log(`Faucet:  ${networkConfig.faucet}`);
    if (walletRecord.created) {
      console.log('Recovery material was created in the owner-only, gitignored .midnight-state.json file.');
    }
  } finally {
    // Persist even when a bounded sync times out. Public networks can require
    // replaying a large encrypted history, and throwing away partial progress
    // would force every retry to restart from genesis.
    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
