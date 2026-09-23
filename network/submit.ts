import '@midnight-ntwrk/wallet-sdk-node-client/effect';

import { SerializedTransaction } from '@midnight-ntwrk/wallet-sdk-abstractions';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';

/**
 * Submit through `author_submitExtrinsic` and return the Midnight transaction
 * identifier. Preview currently closes `author_submitAndWatchExtrinsic`
 * subscriptions normally (WS 1000) before the wallet SDK receives a status.
 * Midnight.js already confirms inclusion through the indexer, so a one-shot
 * relay submission is sufficient and avoids depending on that subscription.
 */
export async function submitTransactionOnce(relayUrl: string, transaction: any): Promise<any> {
  const identifier = transaction.identifiers().at(-1);
  if (identifier === undefined) {
    throw new Error('Cannot submit a transaction without a Midnight transaction identifier.');
  }

  const api = await ApiPromise.create({
    provider: new WsProvider(relayUrl.replace(/^http/, 'ws')),
    throwOnConnect: true,
    noInitWarn: true,
  });

  try {
    const serialized = SerializedTransaction.from(transaction);
    await api.tx.midnight.sendMnTransaction(u8aToHex(serialized)).send();
    return identifier;
  } finally {
    await api.disconnect();
  }
}
