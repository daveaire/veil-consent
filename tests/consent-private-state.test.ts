import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  CONSENT_STATE_FILE,
  createAndSaveConsentPrivateState,
  loadConsentPrivateState,
} from '../network/consent-private-state';

test('deployment witnesses are random, owner-only, and recoverable for lifecycle proving', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'veil-consent-state-'));
  try {
    const first = createAndSaveConsentPrivateState('preprod', cwd);
    const restored = loadConsentPrivateState('preprod', cwd);
    assert.deepEqual(restored, first);
    assert.equal(fs.statSync(path.join(cwd, CONSENT_STATE_FILE)).mode & 0o777, 0o600);

    const rotated = createAndSaveConsentPrivateState('preprod', cwd);
    assert.notDeepEqual(rotated.organizerSecret, first.organizerSecret);
    assert.notDeepEqual(rotated.approvalSecretA, first.approvalSecretA);
    assert.deepEqual(loadConsentPrivateState('preprod', cwd), rotated);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
