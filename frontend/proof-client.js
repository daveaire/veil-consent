import { Contract, ledger } from '../managed/contract/index.js';
import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';

const encoder = new TextEncoder();
const empty = new Uint8Array(32);
const random32 = () => crypto.getRandomValues(new Uint8Array(32));
const toHex = (bytes) => [...bytes].map((x) => x.toString(16).padStart(2, '0')).join('');

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

export async function browserConsentInput({ document, purpose, threshold, decisions, expiry }) {
  return {
    contentHash: await digest(document),
    purposeHash: await digest(purpose),
    policySalt: random32(),
    threshold: BigInt(threshold),
    organizerSecret: random32(),
    requestNonce: random32(),
    credentialA: random32(),
    credentialB: random32(),
    credentialC: random32(),
    decisionA: decisions[0] ? 1n : 0n,
    decisionB: decisions[1] ? 1n : 0n,
    decisionC: decisions[2] ? 1n : 0n,
    capabilitySecret: random32(),
    expiry: BigInt(expiry),
  };
}

const witnesses = {
  privateContentHash: ({ privateState }) => [privateState, privateState.contentHash],
  privatePurposeHash: ({ privateState }) => [privateState, privateState.purposeHash],
  privatePolicySalt: ({ privateState }) => [privateState, privateState.policySalt],
  privateThreshold: ({ privateState }) => [privateState, privateState.threshold],
  privateOrganizerSecret: ({ privateState }) => [privateState, privateState.organizerSecret],
  privateRequestNonce: ({ privateState }) => [privateState, privateState.requestNonce],
  privateCredentialA: ({ privateState }) => [privateState, privateState.credentialA],
  privateCredentialB: ({ privateState }) => [privateState, privateState.credentialB],
  privateCredentialC: ({ privateState }) => [privateState, privateState.credentialC],
  privateDecisionA: ({ privateState }) => [privateState, privateState.decisionA],
  privateDecisionB: ({ privateState }) => [privateState, privateState.decisionB],
  privateDecisionC: ({ privateState }) => [privateState, privateState.decisionC],
  privateCapabilitySecret: ({ privateState }) => [privateState, privateState.capabilitySecret],
};

export class BrowserConsentSession {
  static async create() {
    const session = new BrowserConsentSession();
    session.contract = new Contract(witnesses);
    session.address = sampleContractAddress();
    const base = {
      contentHash: empty, purposeHash: empty, policySalt: empty, threshold: 1n,
      organizerSecret: empty, requestNonce: empty, credentialA: empty,
      credentialB: new Uint8Array(32).fill(1), credentialC: new Uint8Array(32).fill(2),
      decisionA: 0n, decisionB: 0n, decisionC: 0n, capabilitySecret: empty,
    };
    const initial = await session.contract.initialState(createConstructorContext(base, '00'.repeat(32)));
    session.contractState = initial.currentContractState;
    session.zswapState = initial.currentZswapLocalState;
    return session;
  }

  call(name, input, argument) {
    const context = createCircuitContext(this.address, this.zswapState, this.contractState, input);
    const result = argument === undefined
      ? this.contract.impureCircuits[name](context)
      : this.contract.impureCircuits[name](context, BigInt(argument));
    this.contractState = result.context.currentQueryContext.state;
    this.zswapState = result.context.currentZswapLocalState;
    const state = ledger(this.contractState);
    return {
      status: Number(state.requestStatus),
      request: toHex(state.activeRequest),
      capability: Number(state.requestStatus) >= 2 ? toHex(state.activeCapability) : null,
      counters: {
        requests: Number(state.requestsCreated), issued: Number(state.capabilitiesIssued),
        consumed: Number(state.capabilitiesConsumed), revoked: Number(state.revocations),
      },
    };
  }

  createRequest(input) { return this.call('createRequest', input, input.expiry); }
  issueCapability(input, observedAt) { return this.call('issueCapability', input, observedAt); }
  consumeCapability(input, observedAt) { return this.call('consumeCapability', input, observedAt); }
  revoke(input) { return this.call('revokeRequest', input); }
}
