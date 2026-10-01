import { Buffer } from 'node:buffer';
import * as Rx from 'rxjs';

import { getOrCreateWallet, resolveNetwork } from './network';
import { coreWalletReady, createWallet, persistWalletState, waitForCoreWalletState } from './wallet';
import { submitTransactionOnce } from './submit';

const { network, config } = resolveNetwork();
if (network !== 'preprod') throw new Error('Live wallet setup requires the Preprod network');
const walletRecord = getOrCreateWallet(network);
const timeoutMs = Number(process.env.MIDNIGHT_DUST_TIMEOUT_MS || 15 * 60 * 1000);

async function main() {
  const walletCtx = await createWallet({ network, networkConfig: config, seed: walletRecord.seed });
  try {
    const address = walletCtx.unshieldedKeystore.getBech32Address().toString();
    console.log(`Address: ${address}`);
    console.log('Synchronizing the Preprod operations wallet...');
    const state = await waitForCoreWalletState(walletCtx.wallet);
    const unregistered = state.unshielded.availableCoins.filter(
      (coin: any) => !coin.meta?.registeredForDustGeneration,
    );
    const registered = state.unshielded.availableCoins.length - unregistered.length;
    if (!state.unshielded.availableCoins.length) {
      throw new Error(`No tNIGHT is available. Fund ${address} from the Preprod faucet, then retry.`);
    }

    if (unregistered.length) {
      const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
        unregistered,
        walletCtx.unshieldedKeystore.getPublicKey(),
        (payload) => walletCtx.unshieldedKeystore.signData(payload),
      );
      const transaction = await walletCtx.wallet.finalizeRecipe(recipe);
      let identifier;
      try {
        identifier = await submitTransactionOnce(config.node, transaction);
      } catch (error) {
        await Promise.allSettled([
          walletCtx.wallet.shielded.revertTransaction(transaction),
          walletCtx.wallet.unshielded.revertTransaction(transaction),
          walletCtx.wallet.dust.revertTransaction(transaction),
        ]);
        throw error;
      }
      console.log(`DUST registration transaction: ${Buffer.from(identifier).toString('hex')}`);
    } else {
      console.log(`${registered} tNIGHT source(s) already registered for DUST generation.`);
    }

    const ready = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(
      Rx.filter((next) => coreWalletReady(next)
        && next.unshielded.availableCoins.some((coin: any) => coin.meta?.registeredForDustGeneration)
        && next.dust.balance(new Date()) > 0n),
      Rx.timeout({ first: timeoutMs }),
    ));
    console.log(`DUST ready: ${ready.dust.balance(new Date())}`);
  } finally {
    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
