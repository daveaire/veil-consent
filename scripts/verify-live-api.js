import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

import pg from 'pg';

import { decryptJson, encryptJson, randomToken, tokenHash } from '../live/crypto.js';
import { maintainExpiredData } from '../live/maintenance.js';

const required = ['DATABASE_URL', 'VEIL_MASTER_KEY', 'VEIL_ADMIN_TOKEN'];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required for the live API smoke test`);
}

const port = Number(process.env.LIVE_SMOKE_PORT || 4321);
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['live/api.js'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: ['ignore', 'inherit', 'inherit'],
});
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const requestId = crypto.randomUUID();
const expiredRequestId = crypto.randomUUID();
const evidenceToken = randomToken();

async function waitForApi() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Live API exited with code ${child.exitCode}`);
    try {
      const response = await fetch(`${base}/healthz`);
      if (response.ok) return;
    } catch { /* the process is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Live API did not become healthy');
}

try {
  await waitForApi();
  const resultEnvelope = encryptJson({ output: 'Authorized private result', responseId: 'resp_smoke' });
  await pool.query(
    `INSERT INTO consent_requests
      (id, title, purpose, threshold, expires_at, status, encrypted_document, result,
       result_expires_at, evidence_token_hash, network, contract_address, create_tx)
     VALUES ($1, 'Private smoke title', $2, 2, now() + interval '1 hour', 'completed',
       $3, $4, now() + interval '1 hour', $5, 'preprod', 'mn_contract_smoke', 'tx_smoke')`,
    [requestId,
      JSON.stringify({ version: 1, task: 'summarize', model: 'gpt-5-mini', recipients: 'private', retentionSeconds: 3600 }),
      JSON.stringify(encryptJson({ document: 'private smoke document' })),
      JSON.stringify(resultEnvelope), tokenHash(evidenceToken)],
  );

  let response = await fetch(`${base}/api/requests/${requestId}`);
  assert.equal(response.status, 401, 'organizer status must require administrator authentication');

  response = await fetch(`${base}/api/requests/${requestId}`, {
    headers: { authorization: `Bearer ${process.env.VEIL_ADMIN_TOKEN}` },
  });
  assert.equal(response.status, 200);
  const organizer = await response.json();
  assert.equal(organizer.title, 'Private smoke title');
  assert.equal(organizer.result.output, 'Authorized private result');

  response = await fetch(`${base}/evidence/${evidenceToken}`);
  assert.equal(response.status, 200);
  const evidence = await response.json();
  for (const privateField of ['title', 'purpose', 'result', 'participants', 'error']) {
    assert.equal(privateField in evidence, false, `evidence must omit ${privateField}`);
  }
  assert.equal(evidence.contractAddress, 'mn_contract_smoke');
  assert.equal(evidence.transactions.create, 'tx_smoke');

  await pool.query('UPDATE consent_requests SET result_expires_at = now() - interval \'1 second\' WHERE id = $1', [requestId]);
  response = await fetch(`${base}/api/requests/${requestId}`, {
    headers: { authorization: `Bearer ${process.env.VEIL_ADMIN_TOKEN}` },
  });
  assert.equal((await response.json()).result, null, 'expired results must not be disclosed');

  await pool.query(
    `INSERT INTO consent_requests
      (id, title, purpose, threshold, expires_at, status, encrypted_document)
     VALUES ($1, 'Expired request', $2, 2, now() - interval '1 second', 'enrolling', $3)`,
    [expiredRequestId,
      JSON.stringify({ version: 1, task: 'summarize', model: 'gpt-5-mini', recipients: 'private', retentionSeconds: 86400 }),
      JSON.stringify(encryptJson({ document: 'must be deleted' }))],
  );
  const maintenance = await maintainExpiredData();
  assert.equal(maintenance.purgedResults, 1);
  assert.equal(maintenance.expiredRequests, 1);
  const cleaned = await pool.query(
    'SELECT status, result, encrypted_document FROM consent_requests WHERE id = $1',
    [expiredRequestId],
  );
  assert.equal(cleaned.rows[0].status, 'failed');
  assert.equal(cleaned.rows[0].result, null);
  assert.deepEqual(decryptJson(cleaned.rows[0].encrypted_document), { deleted: true });

  console.log('Live API smoke test passed: auth, encrypted result, retention cleanup, and public evidence');
} finally {
  await pool.query('DELETE FROM consent_requests WHERE id = ANY($1::uuid[])', [[requestId, expiredRequestId]]).catch(() => {});
  await pool.end();
  if (child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
}
