import { pureCircuits } from './proof-client.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const VERSION = 1;
const PREFIX = 'veilconsent:';

export const bytesToHex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
export const hexToBytes = (value) => {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error('Expected a 32-byte hexadecimal value');
  return Uint8Array.from(value.match(/../g), (byte) => Number.parseInt(byte, 16));
};

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function unbase64url(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodePacket(packet) {
  return PREFIX + base64url(encoder.encode(JSON.stringify(packet)));
}

export function decodePacket(value, expectedType) {
  const trimmed = value.trim();
  if (!trimmed.startsWith(PREFIX)) throw new Error('This is not a VeilConsent packet');
  let packet;
  try { packet = JSON.parse(decoder.decode(unbase64url(trimmed.slice(PREFIX.length)))); }
  catch { throw new Error('The VeilConsent packet is malformed'); }
  if (packet.version !== VERSION || packet.type !== expectedType) throw new Error(`Expected a VeilConsent ${expectedType} packet`);
  return packet;
}

export function createEnrollment(slot) {
  if (!['A', 'B', 'C'].includes(slot)) throw new Error('Participant slot must be A, B, or C');
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const credential = pureCircuits.participantCredential(secret);
  return {
    secret: bytesToHex(secret),
    credential: bytesToHex(credential),
    packet: encodePacket({ version: VERSION, type: 'enrollment', slot, credential: bytesToHex(credential) }),
  };
}

export function readEnrollment(value) {
  const packet = decodePacket(value, 'enrollment');
  if (!['A', 'B', 'C'].includes(packet.slot)) throw new Error('Enrollment has an invalid participant slot');
  hexToBytes(packet.credential);
  return packet;
}

export async function createOrganizerEncryptionKey() {
  const keyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const exported = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return { keyPair, publicKey: exported };
}

export function createInvitation({ slot, credential, request, purpose, expiry, organizerPublicKey }) {
  return encodePacket({ version: VERSION, type: 'invitation', slot, credential, request, purpose, expiry, organizerPublicKey });
}

async function responseKey(privateKey, publicKey, request) {
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256));
  const requestBytes = encoder.encode(request);
  const material = new Uint8Array(shared.length + requestBytes.length);
  material.set(shared); material.set(requestBytes, shared.length);
  const digest = await crypto.subtle.digest('SHA-256', material);
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function createResponse(invitationValue, secretHex, approved) {
  const invitation = decodePacket(invitationValue, 'invitation');
  const secret = hexToBytes(secretHex);
  const credential = bytesToHex(pureCircuits.participantCredential(secret));
  if (credential !== invitation.credential) throw new Error('This participant credential does not match the invitation');
  if (Date.now() >= Number(invitation.expiry) * 1000) throw new Error('This consent request has expired');
  const organizerKey = await crypto.subtle.importKey('jwk', invitation.organizerPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ephemeral = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const key = await responseKey(ephemeral.privateKey, organizerKey, invitation.request);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = encoder.encode(JSON.stringify({ slot: invitation.slot, request: invitation.request, purpose: invitation.purpose, credential, secret: secretHex, approved: Boolean(approved) }));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(invitation.request) }, key, payload);
  return encodePacket({
    version: VERSION, type: 'response', request: invitation.request,
    ephemeralPublicKey: await crypto.subtle.exportKey('jwk', ephemeral.publicKey),
    iv: base64url(iv), ciphertext: base64url(new Uint8Array(ciphertext)),
  });
}

export async function openResponse(value, organizerPrivateKey, expectedRequest, credentials, expectedPurpose) {
  const packet = decodePacket(value, 'response');
  if (packet.request !== expectedRequest) throw new Error('Response belongs to a different consent request');
  const ephemeralKey = await crypto.subtle.importKey('jwk', packet.ephemeralPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const key = await responseKey(organizerPrivateKey, ephemeralKey, packet.request);
  let response;
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64url(packet.iv), additionalData: encoder.encode(packet.request) }, key, unbase64url(packet.ciphertext));
    response = JSON.parse(decoder.decode(plaintext));
  } catch { throw new Error('Response authentication failed'); }
  const index = ['A', 'B', 'C'].indexOf(response.slot);
  if (index < 0 || response.request !== expectedRequest) throw new Error('Response binding is invalid');
  if (JSON.stringify(response.purpose) !== JSON.stringify(expectedPurpose)) throw new Error('Response purpose does not match the consent request');
  const derivedCredential = bytesToHex(pureCircuits.participantCredential(hexToBytes(response.secret)));
  if (derivedCredential !== response.credential || credentials[index] !== response.credential) throw new Error('Response does not satisfy the enrolled credential');
  return response;
}
