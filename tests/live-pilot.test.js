import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import { decryptJson, encryptJson, tokenHash } from '../live/crypto.js';
import { applyDecisions, createPrivateState, serializePrivateState, deserializePrivateState } from '../live/private-state.js';
import { validateCreateRequest, validateDecision, validateEnrollment } from '../live/validation.js';
import { pureCircuits } from '../managed/contract/index.js';

process.env.VEIL_MASTER_KEY = '11'.repeat(32);
const hex = (value) => Buffer.from(value).toString('hex');

test('live pilot encrypts durable secrets with authenticated encryption', () => {
  const envelope = encryptJson({ document: 'private test material' });
  assert.equal(envelope.algorithm, 'aes-256-gcm');
  assert.equal(JSON.stringify(envelope).includes('private test material'), false);
  assert.deepEqual(decryptJson(envelope), { document: 'private test material' });
  assert.equal(tokenHash('one-time-link').length, 64);
});

test('live request validation permits only bounded execution policies', () => {
  const input = {
    title: 'Review', document: 'Test content', task: 'summarize', model: 'gpt-5-mini',
    recipients: 'Review team', retentionSeconds: 0, threshold: 2, expirySeconds: 3600,
  };
  const value = validateCreateRequest(input);
  assert.equal(value.threshold, 2);
  assert.throws(() => validateCreateRequest({ ...input, task: 'arbitrary-code' }), /Unsupported task/);
  assert.throws(() => validateDecision({ approved: true }), /approval witness/);
});

test('participant witnesses survive encrypted persistence and match enrolled credentials', () => {
  const secrets = [crypto.randomBytes(32), crypto.randomBytes(32), crypto.randomBytes(32)];
  const revocations = [crypto.randomBytes(32), crypto.randomBytes(32), crypto.randomBytes(32)];
  const participants = secrets.map((secret, index) => ({
    slot: ['A', 'B', 'C'][index],
    credential: hex(pureCircuits.participantCredential(secret)),
    revocation_handle: hex(pureCircuits.participantRevocationHandle(revocations[index])),
    decision: index < 2,
    approval_secret_ciphertext: index < 2 ? encryptJson({ approvalSecret: hex(secret) }) : null,
  }));
  for (const participant of participants) {
    validateEnrollment({ slot: participant.slot, credential: participant.credential, revocationHandle: participant.revocation_handle }, participant.slot);
  }
  const initial = createPrivateState({ document: 'private', purpose: { task: 'summarize' }, threshold: 2, participants });
  const restored = deserializePrivateState(decryptJson(encryptJson(serializePrivateState(initial))));
  const decided = applyDecisions(restored, participants, decryptJson);
  assert.equal(decided.decisionA, 1n);
  assert.equal(decided.decisionB, 1n);
  assert.equal(decided.decisionC, 0n);
  assert.equal(hex(pureCircuits.participantCredential(decided.approvalSecretA)), participants[0].credential);
});
