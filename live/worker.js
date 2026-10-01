import { audit, migrate, pool, withTransaction } from './db.js';
import { rm, writeFile } from 'node:fs/promises';
import { decryptJson, encryptJson } from './crypto.js';
import { applyDecisions, createPrivateState, deserializePrivateState, serializePrivateState } from './private-state.js';
import { runAuthorizedTask } from './ai.js';
import { maintainExpiredData } from './maintenance.js';
import { LiveContractClient } from '../network/live-contract.ts';

const pollMs = Number(process.env.WORKER_POLL_MS || 2000);
const readyFile = '/state/worker-ready';
let stopping = false;
let chain;
let lastHeartbeat = 0;

async function serviceStatus(status, details = {}) {
  await pool.query(
    `INSERT INTO service_status (service, status, details, updated_at)
     VALUES ('worker', $1, $2, now())
     ON CONFLICT (service) DO UPDATE SET status = excluded.status,
       details = excluded.details, updated_at = excluded.updated_at`,
    [status, JSON.stringify(details)],
  );
}

async function nextJob() {
  return withTransaction(async (client) => {
    const result = await client.query(
      `SELECT * FROM jobs WHERE status = 'queued' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1`,
    );
    if (!result.rowCount) return null;
    const job = result.rows[0];
    await client.query("UPDATE jobs SET status = 'running', attempts = attempts + 1, started_at = now() WHERE id = $1", [job.id]);
    return job;
  });
}

async function loadRequest(id) {
  const request = await pool.query('SELECT * FROM consent_requests WHERE id = $1', [id]);
  const participants = await pool.query('SELECT * FROM participants WHERE request_id = $1 ORDER BY slot', [id]);
  if (!request.rowCount || participants.rowCount !== 3) throw new Error('Request state is incomplete');
  return { request: request.rows[0], participants: participants.rows };
}

async function commit(request, participants) {
  if (participants.some((participant) => !participant.credential || !participant.revocation_handle)) throw new Error('All participants must enroll before commitment');
  const document = decryptJson(request.encrypted_document).document;
  const state = createPrivateState({ document, purpose: request.purpose, threshold: request.threshold, participants });
  await pool.query("UPDATE consent_requests SET status = 'committing', updated_at = now() WHERE id = $1", [request.id]);
  const transaction = await chain.create(state, BigInt(Math.floor(new Date(request.expires_at).getTime() / 1000)));
  const { network, contractAddress } = chain.evidence;
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE consent_requests SET status = 'awaiting_consent', private_state = $1,
       request_commitment = $2, create_tx = $3, network = $4, contract_address = $5,
       updated_at = now() WHERE id = $6`,
      [JSON.stringify(encryptJson(serializePrivateState(state))), transaction.requestCommitment,
        transaction.txId, network, contractAddress, request.id],
    );
    await audit(client, request.id, 'midnight.request_finalized', transaction);
  });
}

async function authorize(request, participants) {
  if (!request.private_state) throw new Error('Request is not committed on Preprod');
  const approvals = participants.filter((participant) => participant.decision).length;
  if (approvals < request.threshold) throw new Error('Approval threshold is not satisfied');
  const stored = deserializePrivateState(decryptJson(request.private_state));
  const state = applyDecisions(stored, participants, decryptJson);
  await pool.query("UPDATE consent_requests SET status = 'authorizing', updated_at = now() WHERE id = $1", [request.id]);
  const transaction = await chain.issue(state);
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE consent_requests SET status = 'authorized', private_state = $1,
       capability_commitment = $2, issue_tx = $3, updated_at = now() WHERE id = $4`,
      [JSON.stringify(encryptJson(serializePrivateState(state))), transaction.capabilityCommitment, transaction.txId, request.id],
    );
    await client.query("INSERT INTO jobs (request_id, kind) VALUES ($1, 'process') ON CONFLICT DO NOTHING", [request.id]);
    await audit(client, request.id, 'midnight.capability_finalized', transaction);
  });
}

async function processAuthorized(request) {
  if (!request.private_state || !request.issue_tx) throw new Error('Capability is not finalized');
  const state = deserializePrivateState(decryptJson(request.private_state));
  await pool.query("UPDATE consent_requests SET status = 'processing', updated_at = now() WHERE id = $1", [request.id]);
  // Consumption is finalized before plaintext is released to the model.
  const transaction = await chain.consume(state);
  const document = decryptJson(request.encrypted_document).document;
  const result = await runAuthorizedTask({ document, purpose: request.purpose });
  const retentionSeconds = Number(request.purpose.retentionSeconds || 0);
  const resultExpiresAt = retentionSeconds > 0 ? new Date(Date.now() + retentionSeconds * 1000) : new Date();
  const encryptedResult = retentionSeconds > 0 ? encryptJson(result) : null;
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE consent_requests SET status = 'completed', consume_tx = $1, result = $2,
       result_expires_at = $3, encrypted_document = $4, private_state = NULL,
       updated_at = now() WHERE id = $5`,
      [transaction.txId, encryptedResult ? JSON.stringify(encryptedResult) : null, resultExpiresAt,
        JSON.stringify(encryptJson({ deleted: true })), request.id],
    );
    await client.query(
      'UPDATE participants SET approval_secret_ciphertext = NULL WHERE request_id = $1',
      [request.id],
    );
    await audit(client, request.id, 'midnight.capability_consumed', transaction);
    await audit(client, request.id, 'ai.completed', { provider: result.provider, model: result.model, responseId: result.responseId });
  });
}

async function recoverInterruptedJobs() {
  await withTransaction(async (client) => {
    const interrupted = await client.query("SELECT id, request_id, kind FROM jobs WHERE status = 'running' FOR UPDATE");
    for (const job of interrupted.rows) {
      const message = 'Worker stopped while this chain operation was in progress; manual reconciliation is required';
      await client.query(
        "UPDATE jobs SET status = 'failed', error = $1, finished_at = now() WHERE id = $2",
        [message, job.id],
      );
      await client.query(
        `UPDATE consent_requests SET status = 'failed', error = $1, encrypted_document = $2,
         private_state = NULL, updated_at = now() WHERE id = $3`,
        [message, JSON.stringify(encryptJson({ deleted: true })), job.request_id],
      );
      await client.query(
        'UPDATE participants SET approval_secret_ciphertext = NULL WHERE request_id = $1',
        [job.request_id],
      );
      await audit(client, job.request_id, 'job.interrupted', { kind: job.kind });
    }
  });
}

async function execute(job) {
  const { request, participants } = await loadRequest(job.request_id);
  if (job.kind === 'commit') await commit(request, participants);
  else if (job.kind === 'authorize') await authorize(request, participants);
  else if (job.kind === 'process') await processAuthorized(request);
  else throw new Error(`Unsupported job kind: ${job.kind}`);
  await pool.query("UPDATE jobs SET status = 'completed', finished_at = now() WHERE id = $1", [job.id]);
}

async function fail(job, error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Job ${job.id} (${job.kind}) failed: ${message}`);
  await withTransaction(async (client) => {
    await client.query("UPDATE jobs SET status = 'failed', error = $1, finished_at = now() WHERE id = $2", [message, job.id]);
    await client.query(
      `UPDATE consent_requests SET status = 'failed', error = $1, encrypted_document = $2,
       private_state = NULL, updated_at = now() WHERE id = $3`,
      [message, JSON.stringify(encryptJson({ deleted: true })), job.request_id],
    );
    await client.query(
      'UPDATE participants SET approval_secret_ciphertext = NULL WHERE request_id = $1',
      [job.request_id],
    );
    await audit(client, job.request_id, 'job.failed', { kind: job.kind, error: message });
  });
}

async function main() {
  await rm(readyFile, { force: true });
  await migrate();
  await serviceStatus('starting');
  chain = await LiveContractClient.connect();
  await recoverInterruptedJobs();
  await maintainExpiredData();
  await writeFile(readyFile, `${new Date().toISOString()}\n`, { mode: 0o600 });
  await serviceStatus('ready', { network: 'preprod' });
  lastHeartbeat = Date.now();
  console.log('VeilConsent worker connected to Midnight Preprod');
  while (!stopping) {
    if (Date.now() - lastHeartbeat >= 15_000) {
      await serviceStatus('ready', { network: 'preprod' });
      await maintainExpiredData();
      lastHeartbeat = Date.now();
    }
    const job = await nextJob();
    if (job) {
      try { await execute(job); } catch (error) { await fail(job, error); }
    } else {
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  }
}

async function shutdown() {
  stopping = true;
  await rm(readyFile, { force: true });
  try { await serviceStatus('stopped'); } catch { /* the database may already be unavailable */ }
  if (chain) await chain.close();
  await pool.end();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
main().catch(async (error) => { console.error(error); await shutdown(); process.exit(1); });
