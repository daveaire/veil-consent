import '@midnight-ntwrk/wallet-sdk-node-client/effect';
import { WebSocket } from 'ws';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';

import { compiledContract, PRIVATE_STATE_ID, VeilConsent, zkConfigPath, type ConsentPrivateState } from './contract';
import { getDeployment, getOrCreateWallet, resolveNetwork } from './network';
import { createWallet, persistWalletState, waitForCoreWalletState, type WalletContext } from './wallet';
import { submitTransactionOnce } from './submit';
import { getPrivateStatePassword } from './private-state-password';

// @ts-expect-error Midnight wallet sync requires a global WebSocket implementation.
globalThis.WebSocket = WebSocket;

type CircuitName = 'createRequest' | 'issueCapability' | 'consumeCapability' | 'revokeRequest' | 'withdrawConsent';

export class LiveContractClient {
  private constructor(
    private readonly network: ReturnType<typeof resolveNetwork>['network'],
    private readonly walletCtx: WalletContext,
    private readonly providers: any,
    private readonly contract: any,
    private readonly address: string,
  ) {}

  static async connect(): Promise<LiveContractClient> {
    const { network, config } = resolveNetwork();
    if (network !== 'preprod') throw new Error('The live pilot requires the preprod network');
    const deployment = getDeployment(network);
    if (!deployment) throw new Error('No Preprod contract deployment is configured');
    const walletRecord = getOrCreateWallet(network);
    console.log('Midnight worker: restoring Preprod wallet');
    const walletCtx = await createWallet({ network, networkConfig: config, seed: walletRecord.seed });
    console.log('Midnight worker: synchronizing wallet with Preprod');
    await waitForCoreWalletState(walletCtx.wallet);
    await persistWalletState(network, walletCtx);
    console.log('Midnight worker: wallet synchronized');
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
      submitTx: (tx: any) => submitTransactionOnce(config.node, tx),
    };
    const zkConfigProvider = new NodeZkConfigProvider<CircuitName>(zkConfigPath);
    const providers = {
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName: 'veil-consent-live-private-state',
        accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
        privateStoragePasswordProvider: () => getPrivateStatePassword(),
      }),
      publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
      zkConfigProvider,
      proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
      walletProvider,
      midnightProvider: walletProvider,
    };
    const contract = await findDeployedContract(providers, {
      compiledContract,
      contractAddress: deployment.address,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: emptyPrivateState(),
    });
    console.log(`Midnight worker: contract ${deployment.address} ready`);
    return new LiveContractClient(network, walletCtx, providers, contract, deployment.address);
  }

  private async state(value: ConsentPrivateState) {
    await this.providers.privateStateProvider.set(PRIVATE_STATE_ID, value);
  }

  async create(value: ConsentPrivateState, expiry: bigint) {
    await this.state(value);
    const result = await this.contract.callTx.createRequest(
      expiry,
      value.credentialA, value.credentialB, value.credentialC,
      value.revocationHandleA, value.revocationHandleB, value.revocationHandleC,
    );
    await persistWalletState(this.network, this.walletCtx);
    const state = await this.publicState();
    return { txId: result.public.txId, blockHeight: Number(result.public.blockHeight), requestCommitment: state.requestCommitment };
  }

  async issue(value: ConsentPrivateState) {
    await this.state(value);
    const result = await this.contract.callTx.issueCapability();
    await persistWalletState(this.network, this.walletCtx);
    const state = await this.publicState();
    return { txId: result.public.txId, blockHeight: Number(result.public.blockHeight), capabilityCommitment: state.capabilityCommitment };
  }

  async consume(value: ConsentPrivateState) {
    await this.state(value);
    const result = await this.contract.callTx.consumeCapability();
    await persistWalletState(this.network, this.walletCtx);
    return { txId: result.public.txId, blockHeight: Number(result.public.blockHeight) };
  }

  async close() {
    await persistWalletState(this.network, this.walletCtx);
    await this.walletCtx.wallet.stop();
  }

  private async publicState() {
    const state = await this.providers.publicDataProvider.queryContractState(this.address);
    if (!state) throw new Error('Midnight indexer did not return finalized contract state');
    const publicLedger = VeilConsent.ledger(state.data);
    return {
      requestCommitment: Buffer.from(publicLedger.activeRequest).toString('hex'),
      capabilityCommitment: Buffer.from(publicLedger.activeCapability).toString('hex'),
      status: Number(publicLedger.requestStatus),
    };
  }
}

function emptyPrivateState(): ConsentPrivateState {
  const empty = new Uint8Array(32);
  return {
    contentHash: empty, purposeHash: empty, policySalt: empty, threshold: 1n,
    organizerSecret: empty, requestNonce: empty,
    credentialA: empty, credentialB: new Uint8Array(32).fill(1), credentialC: new Uint8Array(32).fill(2),
    approvalSecretA: empty, approvalSecretB: empty, approvalSecretC: empty,
    decisionA: 0n, decisionB: 0n, decisionC: 0n,
    capabilitySecret: empty,
    revocationHandleA: empty, revocationHandleB: new Uint8Array(32).fill(1), revocationHandleC: new Uint8Array(32).fill(2),
    participantRevocationSecret: empty,
  };
}
