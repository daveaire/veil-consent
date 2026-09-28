import test from 'node:test';
import assert from 'node:assert/strict';
import { consentProgress } from '../frontend/consent-progress.js';

test('a threshold policy becomes ready without waiting for every participant', () => {
  assert.deepEqual(consentProgress([{ approved: true }, null, null], 1), {
    approved: 1,
    received: 1,
    remaining: 2,
    required: 1,
    ready: true,
    impossible: false,
  });

  assert.equal(consentProgress([{ approved: true }, { approved: true }, null], 2).ready, true);
  assert.equal(consentProgress([{ approved: true }, null, null], 2).ready, false);
});

test('a policy reports when remaining responses cannot meet its threshold', () => {
  const pending = consentProgress([{ approved: false }, { approved: true }, null], 2);
  assert.equal(pending.ready, false);
  assert.equal(pending.impossible, false);

  const rejected = consentProgress([{ approved: false }, { approved: true }, { approved: false }], 2);
  assert.equal(rejected.ready, false);
  assert.equal(rejected.impossible, true);
});

test('invalid policy dimensions are rejected', () => {
  assert.throws(() => consentProgress([], 0), /Threshold/);
  assert.throws(() => consentProgress([], 4), /Threshold/);
  assert.throws(() => consentProgress({}, 1), /Responses/);
});
