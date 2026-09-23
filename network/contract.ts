import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import * as VeilConsent from '../contract/src/managed/contract/index.js';

const hash = (value: string): Uint8Array => new Uint8Array(createHash('sha256').update(value).digest());

export interface ConsentPrivateState {
  contentHash: Uint8Array;
  purposeHash: Uint8Array;
  policySalt: Uint8Array;
  threshold: bigint;
  organizerSecret: Uint8Array;
  requestNonce: Uint8Array;
  credentialA: Uint8Array;
  credentialB: Uint8Array;
  credentialC: Uint8Array;
  decisionA: bigint;
  decisionB: bigint;
  decisionC: bigint;
  capabilitySecret: Uint8Array;
}

export const PRIVATE_STATE_ID = 'veilConsentPrivateState';

export const INITIAL_PRIVATE_STATE: ConsentPrivateState = {
  contentHash: hash('VeilConsent encrypted Preprod sample'),
  purposeHash: hash('summarize|model:veil-demo-v1|recipients:project-members|retention:24-hours'),
  policySalt: hash('preprod-policy-salt'),
  threshold: 2n,
  organizerSecret: hash('preprod-organizer-secret'),
  requestNonce: hash('preprod-request-nonce'),
  credentialA: hash('preprod-participant-a'),
  credentialB: hash('preprod-participant-b'),
  credentialC: hash('preprod-participant-c'),
  decisionA: 1n,
  decisionB: 1n,
  decisionC: 0n,
  capabilitySecret: hash('preprod-one-use-capability'),
};

export const consentWitnesses: VeilConsent.Witnesses<ConsentPrivateState> = {
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

const dirname = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(dirname, '..', 'contract', 'src', 'managed');

export const compiledContract = CompiledContract.make('VeilConsent', VeilConsent.Contract).pipe(
  CompiledContract.withWitnesses(consentWitnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

export { VeilConsent };

