import crypto from 'node:crypto';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { audit, migrate, pool, withTransaction } from './db.js';
import { encryptJson, randomToken, tokenHash } from './crypto.js';
import { validateCreateRequest, validateDecision, validateEnrollment } from './validation.js';

const port = Number(process.env.PORT || 4210);
const host = process.env.HOST || '0.0.0.0';
const adminToken = process.env.VEIL_ADMIN_TOKEN;
if (!adminToken || adminToken.length < 24) throw new Error('VEIL_ADMIN_TOKEN must contain at least 24 characters');

const publicRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/participant.bundle.js', ['participant.bundle.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);

function json(response, status, value) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 128 * 1024) throw new Error('Request body exceeds 128 KiB');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Request body must be valid JSON'); }
}

function requireAdmin(request) {
  const supplied = request.headers.authorization?.replace(/^Bearer\s+/iu, '') || '';
  const left = Buffer.from(supplied);
  const right = Buffer.from(adminToken);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    const error = new Error('Administrator authorization required');
    error.status = 401;
    throw error;
  }
}

function publicRequest(row, participants = []) {
  return {
    id: row.id,
    title: row.title,
    purpose: row.purpose,
    threshold: row.threshold,
    expiresAt: row.expires_at,
    status: row.status,
    requestCommitment: row.request_commitment,
    capabilityCommitment: row.capability_commitment,
    transactions: { create: row.create_tx, issue: row.issue_tx, consume: row.consume_tx },
    result: row.result,
    error: row.error,
    participants: participants.map((participant) => ({
      slot: participant.slot,
      enrolled: Boolean(participant.enrolled_at),
      responded: Boolean(participant.responded_at),
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function requestRecord(id) {
  const requestResult = await pool.query('SELECT * FROM consent_requests WHERE id = $1', [id]);
  if (!requestResult.rowCount) return null;
  const participants = await pool.query(
    'SELECT slot, enrolled_at, responded_at FROM participants WHERE request_id = $1 ORDER BY slot', [id],
  );
  return publicRequest(requestResult.rows[0], participants.rows);
}

async function createRequest(request, response) {
  requireAdmin(request);
  const input = validateCreateRequest(await body(request));
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + input.expirySeconds * 1000);
  const invitations = [];
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO consent_requests
       (id, title, purpose, threshold, expires_at, status, encrypted_document)
       VALUES ($1, $2, $3, $4, $5, 'enrolling', $6)`,
      [id, input.title, JSON.stringify(input.purpose), input.threshold, expiresAt, JSON.stringify(encryptJson({ document: input.document }))],
    );
    for (const slot of ['A', 'B', 'C']) {
      const token = randomToken();
      invitations.push({ slot, token, path: `/respond/${token}` });
      await client.query(
        'INSERT INTO participants (request_id, slot, invite_token_hash) VALUES ($1, $2, $3)',
        [id, slot, tokenHash(token)],
      );
    }
    await audit(client, id, 'request.created', { threshold: input.threshold, expiresAt });
  });
  json(response, 201, { request: await requestRecord(id), invitations });
}

async function invitation(token) {
  const result = await pool.query(
    `SELECT p.request_id, p.slot, p.enrolled_at, p.responded_at, r.title, r.purpose,
            r.threshold, r.expires_at, r.status, r.request_commitment
       FROM participants p JOIN consent_requests r ON r.id = p.request_id
      WHERE p.invite_token_hash = $1`,
    [tokenHash(token)],
  );
  return result.rows[0] || null;
}

async function enrollParticipant(request, response, token) {
  const invite = await invitation(token);
  if (!invite) return json(response, 404, { error: 'Invitation not found' });
  if (new Date(invite.expires_at).getTime() <= Date.now()) return json(response, 410, { error: 'Invitation expired' });
  const enrollment = validateEnrollment(await body(request), invite.slot);
  await withTransaction(async (client) => {
    const duplicate = await client.query(
      `SELECT 1 FROM participants WHERE request_id = $1 AND
       (credential = $2 OR revocation_handle = $3) AND slot <> $4`,
      [invite.request_id, enrollment.credential, enrollment.revocationHandle, invite.slot],
    );
    if (duplicate.rowCount) throw new Error('Every participant must use a distinct credential');
    await client.query(
      `UPDATE participants SET credential = $1, revocation_handle = $2, enrolled_at = now()
       WHERE request_id = $3 AND slot = $4 AND responded_at IS NULL`,
      [enrollment.credential, enrollment.revocationHandle, invite.request_id, invite.slot],
    );
    const count = await client.query(
      'SELECT count(*)::int AS count FROM participants WHERE request_id = $1 AND enrolled_at IS NOT NULL',
      [invite.request_id],
    );
    if (count.rows[0].count === 3) {
      await client.query("UPDATE consent_requests SET status = 'ready_to_commit', updated_at = now() WHERE id = $1 AND status = 'enrolling'", [invite.request_id]);
      await client.query("INSERT INTO jobs (request_id, kind) VALUES ($1, 'commit') ON CONFLICT DO NOTHING", [invite.request_id]);
    }
    await audit(client, invite.request_id, 'participant.enrolled', { slot: invite.slot });
  });
  json(response, 200, { ok: true, slot: invite.slot, request: await requestRecord(invite.request_id) });
}

async function decide(request, response, token) {
  const invite = await invitation(token);
  if (!invite) return json(response, 404, { error: 'Invitation not found' });
  if (!invite.enrolled_at) return json(response, 409, { error: 'Create a participant credential first' });
  if (invite.status !== 'awaiting_consent') {
    return json(response, 409, { error: `This request cannot accept responses while ${invite.status}` });
  }
  const decision = validateDecision(await body(request));
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE participants SET decision = $1, approval_secret_ciphertext = $2, responded_at = now()
       WHERE request_id = $3 AND slot = $4`,
      [decision.approved, decision.approvalSecret ? JSON.stringify(encryptJson({ approvalSecret: decision.approvalSecret })) : null, invite.request_id, invite.slot],
    );
    const progress = await client.query(
      `SELECT count(*) FILTER (WHERE decision = true)::int AS approvals,
              count(*) FILTER (WHERE responded_at IS NOT NULL)::int AS responses
         FROM participants WHERE request_id = $1`, [invite.request_id],
    );
    const { approvals, responses } = progress.rows[0];
    if (approvals >= invite.threshold) {
      await client.query("INSERT INTO jobs (request_id, kind) VALUES ($1, 'authorize') ON CONFLICT DO NOTHING", [invite.request_id]);
    } else if (responses === 3) {
      await client.query("UPDATE consent_requests SET status = 'declined', updated_at = now() WHERE id = $1", [invite.request_id]);
    }
    await audit(client, invite.request_id, 'participant.responded', { slot: invite.slot, approved: decision.approved });
  });
  json(response, 200, { ok: true, slot: invite.slot, request: await requestRecord(invite.request_id) });
}

async function serveAsset(response, pathname) {
  const generatedAsset = /^\/assets\/[A-Za-z0-9_.-]+\.(?:js|wasm)$/u.test(pathname)
    ? [pathname.slice(1), pathname.endsWith('.wasm') ? 'application/wasm' : 'text/javascript; charset=utf-8']
    : null;
  const asset = pathname.startsWith('/respond/') ? assets.get('/index.html') : (assets.get(pathname) || generatedAsset);
  if (!asset) return false;
  const [name, contentType] = asset;
  const content = await readFile(path.join(publicRoot, name));
  response.writeHead(200, {
    'content-type': contentType,
    'cache-control': name === 'index.html' ? 'no-cache' : 'public, max-age=300',
    'content-security-policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  });
  response.end(content);
  return true;
}

await migrate();
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (request.method === 'GET' && url.pathname === '/healthz') return json(response, 200, { status: 'ok' });
    if (request.method === 'POST' && url.pathname === '/api/requests') return await createRequest(request, response);
    const statusMatch = url.pathname.match(/^\/api\/requests\/([0-9a-f-]+)$/iu);
    if (request.method === 'GET' && statusMatch) {
      const record = await requestRecord(statusMatch[1]);
      return record ? json(response, 200, record) : json(response, 404, { error: 'Request not found' });
    }
    const inviteMatch = url.pathname.match(/^\/api\/invitations\/([A-Za-z0-9_-]+)$/u);
    if (request.method === 'GET' && inviteMatch) {
      const record = await invitation(inviteMatch[1]);
      return record ? json(response, 200, record) : json(response, 404, { error: 'Invitation not found' });
    }
    const enrollMatch = url.pathname.match(/^\/api\/invitations\/([A-Za-z0-9_-]+)\/enroll$/u);
    if (request.method === 'POST' && enrollMatch) return await enrollParticipant(request, response, enrollMatch[1]);
    const decideMatch = url.pathname.match(/^\/api\/invitations\/([A-Za-z0-9_-]+)\/decision$/u);
    if (request.method === 'POST' && decideMatch) return await decide(request, response, decideMatch[1]);
    if (request.method === 'GET' && await serveAsset(response, url.pathname)) return;
    json(response, 404, { error: 'Not found' });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    json(response, error.status || 400, { error: error instanceof Error ? error.message : 'Unexpected error' });
  }
});

server.listen(port, host, () => console.log(`VeilConsent API listening on http://${host}:${port}`));

async function shutdown() {
  server.close();
  await pool.end();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
