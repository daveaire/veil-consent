import { pureCircuits } from '../../frontend/proof-client.js';

const hex = (bytes) => [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');

export async function createEnrollment() {
  const approvalSecret = crypto.getRandomValues(new Uint8Array(32));
  const revocationSecret = crypto.getRandomValues(new Uint8Array(32));
  return {
    approvalSecret: hex(approvalSecret),
    revocationSecret: hex(revocationSecret),
    credential: hex(pureCircuits.participantCredential(approvalSecret)),
    revocationHandle: hex(pureCircuits.participantRevocationHandle(revocationSecret)),
  };
}

