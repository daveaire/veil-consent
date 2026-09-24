import * as path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import * as VeilConsent from '../managed/contract/index.js';

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
  approvalSecretA: Uint8Array;
  approvalSecretB: Uint8Array;
  approvalSecretC: Uint8Array;
  decisionA: bigint;
  decisionB: bigint;
  decisionC: bigint;
  capabilitySecret: Uint8Array;
}

export const PRIVATE_STATE_ID = 'veilConsentPrivateState';

export function createConsentPrivateState(): ConsentPrivateState {
  const approvalSecretA = new Uint8Array(randomBytes(32));
  const approvalSecretB = new Uint8Array(randomBytes(32));
  const approvalSecretC = new Uint8Array(randomBytes(32));
  return {
    contentHash: hash('VeilConsent encrypted Preprod sample'),
    purposeHash: hash('summarize|model:veil-demo-v1|recipients:project-members|retention:24-hours'),
    policySalt: new Uint8Array(randomBytes(32)),
    threshold: 2n,
    organizerSecret: new Uint8Array(randomBytes(32)),
    requestNonce: new Uint8Array(randomBytes(32)),
    credentialA: VeilConsent.pureCircuits.participantCredential(approvalSecretA),
    credentialB: VeilConsent.pureCircuits.participantCredential(approvalSecretB),
    credentialC: VeilConsent.pureCircuits.participantCredential(approvalSecretC),
    approvalSecretA,
    approvalSecretB,
    approvalSecretC,
    decisionA: 1n,
    decisionB: 1n,
    decisionC: 0n,
    capabilitySecret: new Uint8Array(randomBytes(32)),
  };
}

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
  privateApprovalSecretA: ({ privateState }) => [privateState, privateState.approvalSecretA],
  privateApprovalSecretB: ({ privateState }) => [privateState, privateState.approvalSecretB],
  privateApprovalSecretC: ({ privateState }) => [privateState, privateState.approvalSecretC],
  privateDecisionA: ({ privateState }) => [privateState, privateState.decisionA],
  privateDecisionB: ({ privateState }) => [privateState, privateState.decisionB],
  privateDecisionC: ({ privateState }) => [privateState, privateState.decisionC],
  privateCapabilitySecret: ({ privateState }) => [privateState, privateState.capabilitySecret],
};

const dirname = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(dirname, '..', 'managed');

export const compiledContract = CompiledContract.make('VeilConsent', VeilConsent.Contract).pipe(
  CompiledContract.withWitnesses(consentWitnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

export { VeilConsent };
