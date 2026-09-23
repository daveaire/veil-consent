import crypto from 'node:crypto';

export function hashText(value) {
  if (typeof value !== 'string' || value.length === 0) throw new TypeError('A non-empty string is required');
  return new Uint8Array(crypto.createHash('sha256').update(value, 'utf8').digest());
}

export function randomSecret() {
  return new Uint8Array(crypto.randomBytes(32));
}

export function hex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

export function encryptDocument(plaintext, secret) {
  const key = Buffer.from(secret);
  if (key.length !== 32) throw new TypeError('Encryption key must be 32 bytes');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    algorithm: 'AES-256-GCM',
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

export function decryptDocument(envelope, secret) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secret), Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

