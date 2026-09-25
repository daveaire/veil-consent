import { decryptDocument, encryptDocument } from './crypto.js';
import { assertExecutionAllowed } from './purpose-policy.js';

export function prepareProtectedDocument(document, capabilitySecret) {
  return encryptDocument(document, capabilitySecret);
}

export class ConsentGatedAiGateway {
  constructor(session, adapter = deterministicSummary) {
    this.session = session;
    this.adapter = adapter;
  }

  process({ input, encryptedDocument, observedAt, execution }) {
    const policy = assertExecutionAllowed(input.purposeStatement, execution);
    const authorization = this.session.consumeCapability(input, observedAt);
    const document = decryptDocument(encryptedDocument, input.capabilitySecret);
    return {
      authorization,
      output: this.adapter(document),
      documentDisclosedOnChain: false,
      capabilityReusable: false,
      enforcedPurpose: policy,
    };
  }
}

export function deterministicSummary(document) {
  const sentences = document.split(/(?<=[.!?])\s+/).filter(Boolean);
  return {
    type: 'local-demo-summary',
    summary: sentences.slice(0, 2).join(' '),
    inputCharacters: document.length,
  };
}
