import test from 'node:test';
import assert from 'node:assert/strict';

import { BrowserConsentSession, browserConsentInput } from '../frontend/proof-client.js';

test('hosted browser adapter executes the generated one-use contract lifecycle', async () => {
  const now = 1_800_000_000;
  const input = await browserConsentInput({
    document: 'Private launch plan',
    purpose: 'Summarize decisions|model:veil-demo-v1|recipients:Project team|retention:24 hours',
    threshold: 2,
    decisions: [true, true, false],
    expiry: now + 600,
  });
  const session = await BrowserConsentSession.create();

  const created = session.createRequest(input);
  assert.equal(created.status, 1);
  assert.match(created.request, /^[0-9a-f]{64}$/);

  const issued = session.issueCapability(input, now);
  assert.equal(issued.status, 2);
  assert.match(issued.capability, /^[0-9a-f]{64}$/);

  const consumed = session.consumeCapability(input, now + 1);
  assert.equal(consumed.status, 4);
  assert.equal(consumed.counters.consumed, 1);
  assert.throws(() => session.consumeCapability(input, now + 2), /unavailable or already consumed/);
});
