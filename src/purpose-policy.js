const RETENTION_SECONDS = Object.freeze({
  'No retention': 0,
  '24 hours': 86_400,
  '7 days': 604_800,
});

function text(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > 240 || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new Error(`${field} contains unsupported content`);
  }
  return normalized;
}

export function createPurposePolicy({ task, model, recipients, retention }) {
  const normalizedRetention = text(retention, 'Retention');
  if (!(normalizedRetention in RETENTION_SECONDS)) throw new Error('Retention is not supported');
  return Object.freeze({
    version: 1,
    task: text(task, 'AI task'),
    model: text(model, 'Model'),
    recipients: text(recipients, 'Allowed recipients'),
    retention: normalizedRetention,
    retentionSeconds: RETENTION_SECONDS[normalizedRetention],
  });
}

export function canonicalPurpose(policy) {
  const value = createPurposePolicy(policy);
  // Fixed key order is part of the v1 protocol and avoids delimiter ambiguity.
  return JSON.stringify({
    version: value.version,
    task: value.task,
    model: value.model,
    recipients: value.recipients,
    retention: value.retention,
    retentionSeconds: value.retentionSeconds,
  });
}

export function parsePurposePolicy(value) {
  let parsed;
  try { parsed = JSON.parse(value); }
  catch { throw new Error('Purpose policy is not valid JSON'); }
  const normalized = createPurposePolicy(parsed);
  if (canonicalPurpose(normalized) !== value) throw new Error('Purpose policy is not canonical');
  return normalized;
}

export function assertExecutionAllowed(policy, execution) {
  const expected = typeof policy === 'string' ? parsePurposePolicy(policy) : createPurposePolicy(policy);
  if (!execution || typeof execution !== 'object') throw new Error('Execution metadata is required');
  if (execution.task !== expected.task) throw new Error('Configured task is outside the consented purpose');
  if (execution.model !== expected.model) throw new Error('Configured model is outside the consented purpose');
  if (execution.recipient !== expected.recipients) throw new Error('Configured recipient is outside the consented purpose');
  if (!Number.isInteger(execution.retentionSeconds) || execution.retentionSeconds < 0
    || execution.retentionSeconds > expected.retentionSeconds) {
    throw new Error('Configured retention exceeds the consented purpose');
  }
  return expected;
}

export { RETENTION_SECONDS };
