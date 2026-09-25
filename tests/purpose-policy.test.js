import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertExecutionAllowed,
  canonicalPurpose,
  createPurposePolicy,
  parsePurposePolicy,
} from '../src/purpose-policy.js';

const policy = createPurposePolicy({
  task: 'Summarize decisions',
  model: 'veil-demo-v1',
  recipients: 'Project Aurora members',
  retention: '24 hours',
});

test('purpose policies have one canonical representation', () => {
  const encoded = canonicalPurpose(policy);
  assert.deepEqual(parsePurposePolicy(encoded), policy);
  assert.match(encoded, /^\{"version":1,/u);
});

test('execution must remain within task, model, recipient, and retention consent', () => {
  assert.doesNotThrow(() => assertExecutionAllowed(policy, {
    task: 'Summarize decisions', model: 'veil-demo-v1', recipient: 'Project Aurora members', retentionSeconds: 3600,
  }));
  assert.throws(() => assertExecutionAllowed(policy, {
    task: 'Extract personal data', model: 'veil-demo-v1', recipient: 'Project Aurora members', retentionSeconds: 3600,
  }), /task is outside/);
  assert.throws(() => assertExecutionAllowed(policy, {
    task: 'Summarize decisions', model: 'other-model', recipient: 'Project Aurora members', retentionSeconds: 3600,
  }), /model is outside/);
  assert.throws(() => assertExecutionAllowed(policy, {
    task: 'Summarize decisions', model: 'veil-demo-v1', recipient: 'Another team', retentionSeconds: 3600,
  }), /recipient is outside/);
  assert.throws(() => assertExecutionAllowed(policy, {
    task: 'Summarize decisions', model: 'veil-demo-v1', recipient: 'Project Aurora members', retentionSeconds: 604800,
  }), /retention exceeds/);
});
