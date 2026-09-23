import { decryptDocument, encryptDocument } from './crypto.js';

export function prepareProtectedDocument(document, capabilitySecret) {
  return encryptDocument(document, capabilitySecret);
}

export class ConsentGatedAiGateway {
  constructor(session, adapter = deterministicSummary) {
    this.session = session;
    this.adapter = adapter;
  }

  process({ input, encryptedDocument, observedAt }) {
    const authorization = this.session.consumeCapability(input, observedAt);
    const document = decryptDocument(encryptedDocument, input.capabilitySecret);
    return {
      authorization,
      output: this.adapter(document),
      documentDisclosedOnChain: false,
      capabilityReusable: false,
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

