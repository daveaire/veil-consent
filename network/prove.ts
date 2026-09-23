import { WebSocket } from 'ws';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';

import { compiledContract, INITIAL_PRIVATE_STATE, PRIVATE_STATE_ID, VeilConsent, zkConfigPath, type ConsentPrivateState } from './contract';
import { getDeployment, getOrCreateWallet, resolveNetwork } from './network';
import { createWallet, persistWalletState, type WalletContext } from './wallet';
import { submitTransactionOnce } from './submit';
import { getPrivateStatePassword } from './private-state-password';

// @ts-expect-error wallet sync requires a global WebSocket implementation
globalThis.WebSocket = WebSocket;

async function createProviders(walletCtx: WalletContext) {
  const privateStatePassword = getPrivateStatePassword();
  const zkConfigProvider = new NodeZkConfigProvider<'createRequest' | 'issueCapability' | 'consumeCapability' | 'revokeRequest'>(zkConfigPath);
  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => submitTransactionOnce(networkConfig.node, tx),
  };
  return {
    privateStateProvider: levelPrivateStateProvider<typeof PRIVATE_STATE_ID, ConsentPrivateState>({
      privateStateStoreName: 'veil-consent-private-state',
      accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

const { network, config: networkConfig } = resolveNetwork();
const walletRecord = getOrCreateWallet(network);

async function main(): Promise<void> {
  const deployment = getDeployment(network);
  if (!deployment) throw new Error(`No ${network} deployment found. Run npm run network:deploy first.`);
  const walletCtx = await createWallet({ network, networkConfig, seed: walletRecord.seed });
  try {
    await walletCtx.wallet.waitForSyncedState();
    await persistWalletState(network, walletCtx);
    const providers = await createProviders(walletCtx);
    const deployed = await findDeployedContract(providers, {
      compiledContract,
      contractAddress: deployment.address,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: INITIAL_PRIVATE_STATE,
    });
    await providers.privateStateProvider.set(PRIVATE_STATE_ID, INITIAL_PRIVATE_STATE);
    const now = BigInt(Math.floor(Date.now() / 1000));
    const expiry = now + 3600n;

    console.log(`VeilConsent · ${network}`);
    console.log(`Contract: ${deployment.address}`);
    const created = await deployed.callTx.createRequest(expiry);
    const issued = await deployed.callTx.issueCapability(now);
    const consumed = await deployed.callTx.consumeCapability(now + 1n);
    const state = await providers.publicDataProvider.queryContractState(deployment.address);
    if (!state) throw new Error('Finalized contract state was not returned by the indexer.');
    const publicLedger = VeilConsent.ledger(state.data);
    console.log(`Create tx:  ${created.public.txId}`);
    console.log(`Issue tx:   ${issued.public.txId}`);
    console.log(`Consume tx: ${consumed.public.txId}`);
    console.log(`Block:      ${consumed.public.blockHeight}`);
    console.log(`Status:     ${publicLedger.requestStatus}`);
    console.log(`Request:    ${Buffer.from(publicLedger.activeRequest).toString('hex')}`);
    console.log(`Capability: ${Buffer.from(publicLedger.activeCapability).toString('hex')}`);
    console.log('No participant identity, individual decision, threshold, purpose, or document was published.');
  } finally {
    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
