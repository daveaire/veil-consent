import crypto from 'node:crypto';
import { pureCircuits } from '../managed/contract/index.js';

const bytes = (hex) => new Uint8Array(Buffer.from(hex, 'hex'));
const hex = (value) => Buffer.from(value).toString('hex');
const random = () => new Uint8Array(crypto.randomBytes(32));
const digest = (value) => new Uint8Array(crypto.createHash('sha256').update(value).digest());

export function createPrivateState({ document, purpose, threshold, participants }) {
  const approvalSecrets = participants.map(() => new Uint8Array(32));
  const revocationHandles = participants.map((participant) => bytes(participant.revocation_handle));
  return {
    contentHash: digest(document),
    purposeHash: digest(JSON.stringify(purpose)),
    policySalt: random(),
    threshold: BigInt(threshold),
    organizerSecret: random(),
    requestNonce: random(),
    credentialA: bytes(participants[0].credential), credentialB: bytes(participants[1].credential), credentialC: bytes(participants[2].credential),
    approvalSecretA: approvalSecrets[0], approvalSecretB: approvalSecrets[1], approvalSecretC: approvalSecrets[2],
    decisionA: 0n, decisionB: 0n, decisionC: 0n,
    capabilitySecret: random(),
    revocationHandleA: revocationHandles[0], revocationHandleB: revocationHandles[1], revocationHandleC: revocationHandles[2],
    participantRevocationSecret: new Uint8Array(32),
  };
}

const BYTE_FIELDS = [
  'contentHash', 'purposeHash', 'policySalt', 'organizerSecret', 'requestNonce',
  'credentialA', 'credentialB', 'credentialC', 'approvalSecretA', 'approvalSecretB',
  'approvalSecretC', 'capabilitySecret', 'revocationHandleA', 'revocationHandleB',
  'revocationHandleC', 'participantRevocationSecret',
];
const BIGINT_FIELDS = ['threshold', 'decisionA', 'decisionB', 'decisionC'];

export function serializePrivateState(value) {
  return Object.fromEntries([
    ...BYTE_FIELDS.map((field) => [field, hex(value[field])]),
    ...BIGINT_FIELDS.map((field) => [field, value[field].toString()]),
  ]);
}

export function deserializePrivateState(value) {
  return Object.fromEntries([
    ...BYTE_FIELDS.map((field) => [field, bytes(value[field])]),
    ...BIGINT_FIELDS.map((field) => [field, BigInt(value[field])]),
  ]);
}

export function applyDecisions(state, participants, decryptApproval) {
  const next = { ...state };
  for (const [index, participant] of participants.entries()) {
    const suffix = ['A', 'B', 'C'][index];
    next[`decision${suffix}`] = participant.decision ? 1n : 0n;
    next[`approvalSecret${suffix}`] = participant.decision
      ? bytes(decryptApproval(participant.approval_secret_ciphertext).approvalSecret)
      : new Uint8Array(32);
    if (participant.decision) {
      const derived = hex(pureCircuits.participantCredential(next[`approvalSecret${suffix}`]));
      if (derived !== participant.credential) throw new Error(`Participant ${suffix} approval witness is invalid`);
    }
  }
  return next;
}

