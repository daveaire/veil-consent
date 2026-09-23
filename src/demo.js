import { createConsentInput } from './consent.js';
import { ConsentSession } from './compact-session.js';
import { ConsentGatedAiGateway, prepareProtectedDocument } from './gateway.js';

const now = Math.floor(Date.now() / 1000);
const document = 'Project Aurora will launch next Tuesday. Keep the customer list private. Follow up with legal tomorrow.';
const input = createConsentInput({
  document,
  purpose: 'Summarize action items with veil-demo-v1',
  recipients: 'project members',
  retention: '24 hours',
  threshold: 2,
  decisions: [true, true, false],
  expiry: now + 3600,
});

const session = await ConsentSession.create();
const encryptedDocument = prepareProtectedDocument(document, input.capabilitySecret);
const created = session.createRequest(input);
const issued = session.issueCapability(input, now);
const processed = new ConsentGatedAiGateway(session).process({ input, encryptedDocument, observedAt: now + 1 });

console.log(JSON.stringify({
  product: 'VeilConsent',
  created,
  issued,
  processed,
  plaintextPublished: false,
  participantIdentitiesPublished: false,
  individualDecisionsPublished: false,
  thresholdPublished: false,
}, null, 2));
