import fs from 'node:fs';
import path from 'node:path';

import { createConsentPrivateState, type ConsentPrivateState } from './contract';
import type { NetworkId } from './network';

export const CONSENT_STATE_FILE = '.veil-consent-private.json';
const BYTE_FIELDS = [
  'contentHash', 'purposeHash', 'policySalt', 'organizerSecret', 'requestNonce',
  'credentialA', 'credentialB', 'credentialC', 'approvalSecretA', 'approvalSecretB',
  'approvalSecretC', 'capabilitySecret',
] as const satisfies readonly (keyof ConsentPrivateState)[];
const BIGINT_FIELDS = ['threshold', 'decisionA', 'decisionB', 'decisionC'] as const satisfies readonly (keyof ConsentPrivateState)[];

interface StoredState {
  version: 1;
  networks: Partial<Record<NetworkId, Record<string, string>>>;
}

function filePath(cwd = process.cwd()): string {
  return path.join(cwd, CONSENT_STATE_FILE);
}

function serialize(value: ConsentPrivateState): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of BYTE_FIELDS) result[field] = Buffer.from(value[field] as Uint8Array).toString('hex');
  for (const field of BIGINT_FIELDS) result[field] = (value[field] as bigint).toString();
  return result;
}

function deserialize(value: Record<string, string>): ConsentPrivateState {
  const result: Partial<ConsentPrivateState> = {};
  for (const field of BYTE_FIELDS) {
    if (!/^[0-9a-f]{64}$/u.test(value[field] ?? '')) throw new Error(`Invalid ${field} in ${CONSENT_STATE_FILE}`);
    (result as Record<string, unknown>)[field] = new Uint8Array(Buffer.from(value[field], 'hex'));
  }
  for (const field of BIGINT_FIELDS) {
    if (!/^\d+$/u.test(value[field] ?? '')) throw new Error(`Invalid ${field} in ${CONSENT_STATE_FILE}`);
    (result as Record<string, unknown>)[field] = BigInt(value[field]);
  }
  return result as ConsentPrivateState;
}

function read(cwd = process.cwd()): StoredState {
  const target = filePath(cwd);
  if (!fs.existsSync(target)) return { version: 1, networks: {} };
  const parsed = JSON.parse(fs.readFileSync(target, 'utf8')) as StoredState;
  if (parsed.version !== 1 || !parsed.networks || typeof parsed.networks !== 'object') {
    throw new Error(`Unsupported private-state format in ${target}`);
  }
  return parsed;
}

function write(value: StoredState, cwd = process.cwd()): void {
  const target = filePath(cwd);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, target);
}

export function createAndSaveConsentPrivateState(network: NetworkId, cwd = process.cwd()): ConsentPrivateState {
  const value = createConsentPrivateState();
  const stored = read(cwd);
  stored.networks[network] = serialize(value);
  write(stored, cwd);
  return value;
}

export function loadConsentPrivateState(network: NetworkId, cwd = process.cwd()): ConsentPrivateState {
  const value = read(cwd).networks[network];
  if (!value) throw new Error(`No private consent state for ${network}. Deploy the contract before proving its lifecycle.`);
  return deserialize(value);
}
