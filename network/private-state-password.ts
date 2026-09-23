import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PASSWORD_FILE = '.midnight-private-state-password';

/**
 * Return the explicit password or create a local owner-only credential.
 * The generated value protects the private-state database and is never logged.
 */
export function getPrivateStatePassword(cwd = process.cwd()): string {
  const configured = process.env.PRIVATE_STATE_PASSWORD?.trim();
  if (configured) return configured;

  const path = join(cwd, PASSWORD_FILE);
  if (!existsSync(path)) {
    writeFileSync(path, `${randomBytes(32).toString('base64url')}\n`, { mode: 0o600 });
  }
  chmodSync(path, 0o600);
  const password = readFileSync(path, 'utf8').trim();
  if (password.length < 16) throw new Error(`${PASSWORD_FILE} must contain at least 16 characters.`);
  return password;
}
