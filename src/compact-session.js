import {
  Contract,
  ledger,
} from '../contract/src/managed/contract/index.js';
import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import { hex } from './crypto.js';
import { STATUS } from './consent.js';

const empty = new Uint8Array(32);

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

const initialPrivateState = {
  contentHash: empty,
  purposeHash: empty,
  policySalt: empty,
  threshold: 1n,
  organizerSecret: empty,
  requestNonce: empty,
  credentialA: empty,
  credentialB: new Uint8Array(32).fill(1),
  credentialC: new Uint8Array(32).fill(2),
  decisionA: 0n,
  decisionB: 0n,
  decisionC: 0n,
  capabilitySecret: empty,
};

export class ConsentSession {
  static async create() {
    const session = new ConsentSession();
    session.contract = new Contract(witnesses);
    session.address = sampleContractAddress();
    const initial = await session.contract.initialState(createConstructorContext(initialPrivateState, '00'.repeat(32)));
    session.contractState = initial.currentContractState;
    session.zswapState = initial.currentZswapLocalState;
    session.privateState = initial.currentPrivateState;
    return session;
  }

  context(privateState) {
    return createCircuitContext(this.address, this.zswapState, this.contractState, privateState);
  }

  apply(result) {
    this.contractState = result.context.currentQueryContext.state;
    this.zswapState = result.context.currentZswapLocalState;
    this.privateState = result.context.currentPrivateState;
    return this.publicState(result.result);
  }

  createRequest(input) {
    return this.apply(this.contract.impureCircuits.createRequest(this.context(input), input.expiry));
  }

  issueCapability(input, observedAt) {
    return this.apply(this.contract.impureCircuits.issueCapability(this.context(input), BigInt(observedAt)));
  }

  consumeCapability(input, observedAt) {
    return this.apply(this.contract.impureCircuits.consumeCapability(this.context(input), BigInt(observedAt)));
  }

  revoke(input) {
    return this.apply(this.contract.impureCircuits.revokeRequest(this.context(input)));
  }

  publicState(result) {
    const state = ledger(this.contractState);
    return {
      requestCommitment: hex(state.activeRequest),
      capabilityCommitment: state.requestStatus >= BigInt(STATUS.ISSUED) ? hex(state.activeCapability) : null,
      result: result ? hex(result) : null,
      expiry: Number(state.activeExpiry),
      status: Number(state.requestStatus),
      counters: {
        requests: Number(state.requestsCreated),
        issued: Number(state.capabilitiesIssued),
        consumed: Number(state.capabilitiesConsumed),
        revoked: Number(state.revocations),
      },
      disclosed: ['request commitment', 'expiry', 'status', 'lifecycle counters'],
      hidden: ['document', 'purpose', 'recipients', 'retention', 'participant identities', 'individual decisions', 'policy threshold'],
    };
  }
}

