export function consentProgress(responses, threshold, participantCount = 3) {
  if (!Array.isArray(responses)) throw new TypeError('Responses must be an array');
  if (!Number.isInteger(participantCount) || participantCount < 1) throw new RangeError('Participant count must be a positive integer');
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > participantCount) throw new RangeError('Threshold must be within the participant count');

  const slots = Array.from({ length: participantCount }, (_, index) => responses[index] ?? null);
  const received = slots.filter(Boolean).length;
  const approved = slots.filter(response => response?.approved === true).length;
  const remaining = participantCount - received;

  return Object.freeze({
    approved,
    received,
    remaining,
    required: threshold,
    ready: approved >= threshold,
    impossible: approved + remaining < threshold,
  });
}
