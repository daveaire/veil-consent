import test from 'node:test';
import assert from 'node:assert/strict';
import { ConsentSession } from '../src/compact-session.js';
import { createConsentInput } from '../src/consent.js';
import { ConsentGatedAiGateway, prepareProtectedDocument } from '../src/gateway.js';

test('AI adapter cannot read the document before issue and can process it exactly once', async () => {
  const now = 1_800_000_000;
  const document = 'The group approved Project Aurora. The launch remains confidential. A third sentence is omitted.';
  const input = createConsentInput({
    document,
    purpose: 'Summarize decisions',
    threshold: 2,
    decisions: [true, true, false],
    expiry: now + 600,
  });
  const session = await ConsentSession.create();
  session.createRequest(input);
  const encryptedDocument = prepareProtectedDocument(document, input.capabilitySecret);
  const gateway = new ConsentGatedAiGateway(session);

  assert.throws(() => gateway.process({ input, encryptedDocument, observedAt: now }), /unavailable/);
  session.issueCapability(input, now);
  const result = gateway.process({ input, encryptedDocument, observedAt: now + 1 });
  assert.equal(result.output.summary, 'The group approved Project Aurora. The launch remains confidential.');
  assert.equal(result.capabilityReusable, false);
  assert.throws(() => gateway.process({ input, encryptedDocument, observedAt: now + 2 }), /already consumed/);
});

