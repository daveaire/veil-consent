import test from 'node:test';
import assert from 'node:assert/strict';
import { ConsentSession } from '../src/compact-session.js';
import { createConsentInput, STATUS } from '../src/consent.js';

const now = 1_800_000_000;

function input(overrides = {}) {
  return createConsentInput({
    document: 'Private meeting notes for Project Aurora',
    purpose: 'Summarize decisions with model veil-demo-v1',
    recipients: 'project members',
    retention: '24 hours',
    threshold: 2,
    decisions: [true, true, false],
    expiry: now + 3600,
    ...overrides,
  });
}

test('generated Compact contract creates, issues, and consumes one-use capability', async () => {
  const session = await ConsentSession.create();
  const privateInput = input();
  const created = session.createRequest(privateInput);
  assert.equal(created.status, STATUS.AWAITING);
  assert.equal(created.counters.requests, 1);

  const issued = session.issueCapability(privateInput, now);
  assert.equal(issued.status, STATUS.ISSUED);
  assert.match(issued.capabilityCommitment, /^[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(issued).includes('Project Aurora'), false);

  const consumed = session.consumeCapability(privateInput, now + 1);
  assert.equal(consumed.status, STATUS.CONSUMED);
  assert.equal(consumed.counters.consumed, 1);
  assert.throws(() => session.consumeCapability(privateInput, now + 2), /unavailable or already consumed/);
});

test('private policy rejects insufficient consent without changing public state', async () => {
  const session = await ConsentSession.create();
  const privateInput = input({ threshold: 3, decisions: [true, true, false] });
  session.createRequest(privateInput);
  assert.throws(() => session.issueCapability(privateInput, now), /policy is not satisfied/);
  assert.equal(session.publicState().status, STATUS.AWAITING);
  assert.equal(session.publicState().counters.issued, 0);
});

test('unanimous policy, expiry, revocation, and replay rules are enforced', async () => {
  const unanimous = input({ threshold: 3, decisions: [true, true, true] });
  const session = await ConsentSession.create();
  session.createRequest(unanimous);
  assert.throws(() => session.issueCapability(unanimous, now + 3601), /expired/);
  const revoked = session.revoke(unanimous);
  assert.equal(revoked.status, STATUS.REVOKED);
  assert.throws(() => session.issueCapability(unanimous, now), /not awaiting consent/);
});

test('content, purpose, organizer secret, credentials, and capability secret are bound', async () => {
  const session = await ConsentSession.create();
  const original = input();
  session.createRequest(original);
  for (const field of ['contentHash', 'purposeHash', 'organizerSecret', 'credentialA']) {
    const changed = { ...original, [field]: new Uint8Array(32).fill(9) };
    assert.throws(() => session.issueCapability(changed, now), /does not match/);
  }
  session.issueCapability(original, now);
  assert.throws(
    () => session.consumeCapability({ ...original, capabilitySecret: new Uint8Array(32).fill(8) }, now),
    /does not match/,
  );
});
