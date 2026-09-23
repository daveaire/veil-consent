import { hashText, randomSecret } from './crypto.js';

export const STATUS = Object.freeze({ EMPTY: 0, AWAITING: 1, ISSUED: 2, REVOKED: 3, CONSUMED: 4 });

function asDecision(value) {
  if (value !== true && value !== false && value !== 1 && value !== 0) {
    throw new TypeError('Decision must be approve or decline');
  }
  return value === true || value === 1 ? 1n : 0n;
}

export function createConsentInput({
  document,
  purpose,
  recipients = 'the configured AI processor',
  retention = '24 hours',
  threshold = 3,
  decisions = [false, false, false],
  expiry,
  secrets = {},
} = {}) {
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 3) {
    throw new RangeError('threshold must be an integer between one and three');
  }
  if (!Array.isArray(decisions) || decisions.length !== 3) {
    throw new TypeError('exactly three participant decisions are required by the MVP circuit');
  }
  const expiresAt = BigInt(expiry ?? Math.floor(Date.now() / 1000) + 3600);
  const purposeStatement = `${purpose}|recipients:${recipients}|retention:${retention}`;
  return {
    contentHash: hashText(document),
    purposeHash: hashText(purposeStatement),
    policySalt: secrets.policySalt ?? randomSecret(),
    threshold: BigInt(threshold),
    organizerSecret: secrets.organizerSecret ?? randomSecret(),
    requestNonce: secrets.requestNonce ?? randomSecret(),
    credentialA: secrets.credentialA ?? randomSecret(),
    credentialB: secrets.credentialB ?? randomSecret(),
    credentialC: secrets.credentialC ?? randomSecret(),
    decisionA: asDecision(decisions[0]),
    decisionB: asDecision(decisions[1]),
    decisionC: asDecision(decisions[2]),
    capabilitySecret: secrets.capabilitySecret ?? randomSecret(),
    expiry: expiresAt,
    purposeStatement,
  };
}

