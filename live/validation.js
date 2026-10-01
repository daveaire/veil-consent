const ALLOWED_TASKS = new Set(['summarize']);
const ALLOWED_MODELS = new Set(['gpt-5-mini']);
const ALLOWED_RETENTION = new Set([0, 86400, 604800]);

function text(value, name, max = 200) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required`);
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${name} is too long`);
  return normalized;
}

export function validateCreateRequest(body) {
  if (!body || typeof body !== 'object') throw new Error('Request body is required');
  const document = text(body.document, 'Document', 20_000);
  const title = text(body.title, 'Title', 120);
  const task = text(body.task, 'Task', 40);
  const model = text(body.model, 'Model', 80);
  const recipients = text(body.recipients, 'Recipients', 200);
  const retentionSeconds = Number(body.retentionSeconds);
  const threshold = Number(body.threshold);
  const expirySeconds = Number(body.expirySeconds);
  if (!ALLOWED_TASKS.has(task)) throw new Error('Unsupported task');
  if (!ALLOWED_MODELS.has(model)) throw new Error('Unsupported model');
  if (!ALLOWED_RETENTION.has(retentionSeconds)) throw new Error('Unsupported retention period');
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 3) throw new Error('Threshold must be between 1 and 3');
  if (!Number.isInteger(expirySeconds) || expirySeconds < 900 || expirySeconds > 604800) throw new Error('Expiry must be between 15 minutes and 7 days');
  return { document, title, purpose: { version: 1, task, model, recipients, retentionSeconds }, threshold, expirySeconds };
}

export function validateEnrollment(body, expectedSlot) {
  if (!body || body.slot !== expectedSlot) throw new Error('Participant slot does not match invitation');
  for (const field of ['credential', 'revocationHandle']) {
    if (typeof body[field] !== 'string' || !/^[0-9a-f]{64}$/iu.test(body[field])) throw new Error(`${field} must be 32-byte hexadecimal data`);
  }
  return { credential: body.credential.toLowerCase(), revocationHandle: body.revocationHandle.toLowerCase() };
}

export function validateDecision(body) {
  if (!body || typeof body.approved !== 'boolean') throw new Error('A consent decision is required');
  if (body.approved && (typeof body.approvalSecret !== 'string' || !/^[0-9a-f]{64}$/iu.test(body.approvalSecret))) {
    throw new Error('Approved responses require a valid private approval witness');
  }
  return { approved: body.approved, approvalSecret: body.approved ? body.approvalSecret.toLowerCase() : null };
}

