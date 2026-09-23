import test from 'node:test';
import assert from 'node:assert/strict';
import { ResponseVault } from '../src/response-vault.js';

test('participant responses are encrypted, one-time, and privately aggregated', () => {
  const vault = new ResponseVault(Buffer.alloc(32, 7));
  vault.seal({ participant: 'alice@example.test', credential: 'credential-a', approved: true });
  vault.seal({ participant: 'bob@example.test', credential: 'credential-b', approved: false });
  assert.throws(
    () => vault.seal({ participant: 'alice@example.test', credential: 'credential-a', approved: false }),
    /already responded/,
  );
  assert.deepEqual(vault.publicSummary(), { responsesReceived: 2, identitiesDisclosed: 0, decisionsDisclosed: 0 });
  assert.deepEqual(vault.decisions(['alice@example.test', 'bob@example.test']).map((x) => x.approved), [true, false]);
  assert.equal(JSON.stringify([...vault.responses.values()]).includes('credential-a'), false);
});

