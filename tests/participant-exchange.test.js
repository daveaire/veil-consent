import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEnrollment,
  createInvitation,
  createOrganizerEncryptionKey,
  createResponse,
  decodePacket,
  hexToBytes,
  openResponse,
} from '../frontend/participant-exchange.js';
import { BrowserConsentSession, browserConsentInput } from '../frontend/proof-client.js';

const request = 'ab'.repeat(32);
const purpose = { task: 'Summarize', model: 'model-1', recipients: 'Project team', retention: '24 hours' };

test('participant enrollment exposes a commitment and keeps its preimage local', () => {
  const enrollment = createEnrollment('A');
  const packet = decodePacket(enrollment.packet, 'enrollment');
  assert.equal(packet.slot, 'A');
  assert.equal(packet.credential, enrollment.credential);
  assert.equal('secret' in packet, false);
  assert.match(enrollment.secret, /^[0-9a-f]{64}$/);
});

test('participant response is encrypted, request-bound, and credential-authenticated', async () => {
  const enrollment = createEnrollment('B');
  const organizer = await createOrganizerEncryptionKey();
  const invitation = createInvitation({
    slot: 'B', credential: enrollment.credential, request, purpose,
    expiry: Math.floor(Date.now() / 1000) + 60, organizerPublicKey: organizer.publicKey,
  });
  const responsePacket = await createResponse(invitation, enrollment.secret, true);
  assert.equal(responsePacket.includes(enrollment.secret), false);

  const opened = await openResponse(
    responsePacket,
    organizer.keyPair.privateKey,
    request,
    ['00'.repeat(32), enrollment.credential, '11'.repeat(32)],
    purpose,
  );
  assert.deepEqual({ slot: opened.slot, approved: opened.approved }, { slot: 'B', approved: true });
  assert.equal(opened.approvalSecret, enrollment.secret);

  await assert.rejects(
    openResponse(responsePacket, organizer.keyPair.privateKey, 'cd'.repeat(32), ['00'.repeat(32), enrollment.credential, '11'.repeat(32)], purpose),
    /different consent request/,
  );
  await assert.rejects(
    openResponse(
      responsePacket,
      organizer.keyPair.privateKey,
      request,
      ['00'.repeat(32), enrollment.credential, '11'.repeat(32)],
      { ...purpose, retention: '7 days' },
    ),
    /purpose does not match/,
  );
});

test('a declined response cannot be converted into an approval witness', async () => {
  const enrollments = ['A', 'B', 'C'].map(createEnrollment);
  const organizer = await createOrganizerEncryptionKey();
  const privateInput = await browserConsentInput({
    document: 'Private launch plan',
    purpose: JSON.stringify(purpose),
    threshold: 1,
    decisions: [false, false, false],
    expiry: Math.floor(Date.now() / 1000) + 60,
    credentials: enrollments.map((entry) => hexToBytes(entry.credential)),
  });
  const session = await BrowserConsentSession.create();
  const created = session.createRequest(privateInput);
  const invitation = createInvitation({
    slot: 'B', credential: enrollments[1].credential, request: created.request, purpose,
    expiry: Number(privateInput.expiry), organizerPublicKey: organizer.publicKey,
  });
  const declinedPacket = await createResponse(invitation, enrollments[1].secret, false);
  const declined = await openResponse(
    declinedPacket,
    organizer.keyPair.privateKey,
    created.request,
    enrollments.map((entry) => entry.credential),
    purpose,
  );
  assert.equal(declined.approved, false);
  assert.equal('approvalSecret' in declined, false);
  assert.equal('secret' in declined, false);

  // A hostile organizer can change the decision bit, but it has no matching
  // witness. The circuit must reject the attempted forged approval.
  privateInput.decisionB = 1n;
  assert.throws(
    () => session.issueCapability(privateInput, Math.floor(Date.now() / 1000)),
    /Participant B approval is not authentic/,
  );
});

test('wrong credentials and modified response packets are rejected', async () => {
  const enrollment = createEnrollment('C');
  const other = createEnrollment('C');
  const organizer = await createOrganizerEncryptionKey();
  const invitation = createInvitation({
    slot: 'C', credential: enrollment.credential, request, purpose,
    expiry: Math.floor(Date.now() / 1000) + 60, organizerPublicKey: organizer.publicKey,
  });
  await assert.rejects(createResponse(invitation, other.secret, false), /does not match/);

  const response = await createResponse(invitation, enrollment.secret, false);
  const last = response.at(-1);
  const tampered = response.slice(0, -1) + (last === 'A' ? 'B' : 'A');
  await assert.rejects(
    openResponse(tampered, organizer.keyPair.privateKey, request, ['00'.repeat(32), '11'.repeat(32), enrollment.credential], purpose),
    /(authentication failed|malformed)/,
  );
});
