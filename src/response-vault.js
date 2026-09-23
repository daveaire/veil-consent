import crypto from 'node:crypto';
import { hashText } from './crypto.js';

export class ResponseVault {
  constructor(key = crypto.randomBytes(32)) {
    this.key = Buffer.from(key);
    this.responses = new Map();
  }

  seal({ participant, credential, approved }) {
    if (typeof approved !== 'boolean') throw new TypeError('approved must be boolean');
    const participantKey = Buffer.from(hashText(participant)).toString('hex');
    if (this.responses.has(participantKey)) throw new Error('Participant has already responded');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const payload = Buffer.from(JSON.stringify({ credential, approved }), 'utf8');
    const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
    this.responses.set(participantKey, {
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    });
    return { receipt: participantKey, stored: true };
  }

  decisions(participants) {
    return participants.map((participant) => {
      const key = Buffer.from(hashText(participant)).toString('hex');
      const envelope = this.responses.get(key);
      if (!envelope) throw new Error('A required participant has not responded');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, Buffer.from(envelope.iv, 'base64'));
      decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
      return JSON.parse(Buffer.concat([
        decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8'));
    });
  }

  publicSummary() {
    return { responsesReceived: this.responses.size, identitiesDisclosed: 0, decisionsDisclosed: 0 };
  }
}

