const $ = (id) => document.getElementById(id);
const token = location.pathname.match(/^\/respond\/([A-Za-z0-9_-]+)$/u)?.[1];

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || `Request failed (${response.status})`);
  return value;
}

function setMessage(id, value, error = false) {
  $(id).textContent = value;
  $(id).classList.toggle('error', error);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/gu, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]);
}

function renderStatus(record) {
  $('requestStatus').hidden = false;
  $('requestStatus').innerHTML = `<h3>Live status</h3><dl>
    <dt>State</dt><dd>${escapeHtml(record.status.replaceAll('_', ' '))}</dd>
    <dt>Request</dt><dd>${escapeHtml(record.requestCommitment || 'Waiting for participant enrollment')}</dd>
    <dt>Create transaction</dt><dd>${escapeHtml(record.transactions.create || 'Pending')}</dd>
    <dt>Issue transaction</dt><dd>${escapeHtml(record.transactions.issue || 'Pending')}</dd>
    <dt>Consume transaction</dt><dd>${escapeHtml(record.transactions.consume || 'Pending')}</dd>
  </dl>${record.result ? `<div class="result"><strong>Authorized result</strong><p>${escapeHtml(record.result.output)}</p></div>` : ''}`;
}

async function organizer() {
  const createButton = $('create');
  createButton.disabled = true;
  try {
    const response = await fetch('/readyz');
    const readiness = await response.json();
    if (!response.ok || !readiness.ready) throw new Error('Live execution is being activated. New requests are temporarily paused.');
    $('liveStatus').textContent = 'Live execution ready';
    $('liveStatus').classList.remove('pending');
    createButton.disabled = false;
  } catch (error) {
    $('liveStatus').textContent = 'Activation pending';
    setMessage('message', error.message, true);
  }
  $('create').onclick = async () => {
    $('create').disabled = true;
    setMessage('message', 'Creating encrypted request…');
    try {
      const value = await api('/api/requests', {
        method: 'POST',
        headers: { authorization: `Bearer ${$('adminToken').value}` },
        body: JSON.stringify({
          title: $('title').value, document: $('document').value, task: $('task').value,
          model: $('model').value, recipients: $('recipients').value,
          threshold: Number($('threshold').value), retentionSeconds: Number($('retention').value),
          expirySeconds: Number($('expiry').value),
        }),
      });
      $('document').value = '';
      $('document').placeholder = 'Encrypted and removed from this form';
      $('invitations').hidden = false;
      const evidenceUrl = new URL(value.evidence.path, location.origin).toString();
      $('evidenceUrl').value = evidenceUrl;
      $('copyEvidence').onclick = () => navigator.clipboard.writeText(evidenceUrl);
      $('evidence').hidden = false;
      $('inviteList').replaceChildren(...value.invitations.map((invitation) => {
        const row = document.createElement('div'); row.className = 'invite';
        const label = document.createElement('strong'); label.textContent = `Participant ${invitation.slot}`;
        const input = document.createElement('input'); input.readOnly = true; input.value = new URL(invitation.path, location.origin);
        const button = document.createElement('button'); button.className = 'secondary'; button.textContent = 'Copy';
        button.onclick = () => navigator.clipboard.writeText(input.value);
        row.append(label, input, button); return row;
      }));
      renderStatus(value.request);
      setMessage('message', 'Request created. Enrollment begins when participants open their links.');
      const timer = setInterval(async () => {
        try {
          const record = await api(`/api/requests/${value.request.id}`, {
            headers: { authorization: `Bearer ${$('adminToken').value}` },
          });
          renderStatus(record);
          if (['completed', 'declined', 'failed'].includes(record.status)) clearInterval(timer);
        }
        catch { /* retain the last verified status during a transient refresh error */ }
      }, 5000);
    } catch (error) { $('create').disabled = false; setMessage('message', error.message, true); }
  };
}

async function participant() {
  $('organizer').hidden = true; $('participant').hidden = false;
  try {
    const invite = await api(`/api/invitations/${token}`);
    $('participantTitle').textContent = invite.title;
    $('participantTerms').innerHTML = `<dl><dt>Operation</dt><dd>${escapeHtml(invite.purpose.task)}</dd><dt>Model</dt><dd>${escapeHtml(invite.purpose.model)}</dd><dt>Recipients</dt><dd>${escapeHtml(invite.purpose.recipients)}</dd><dt>Retention</dt><dd>${escapeHtml(invite.purpose.retentionSeconds / 3600)} hours</dd><dt>Policy</dt><dd>${escapeHtml(invite.threshold)} of 3 approvals</dd><dt>Expires</dt><dd>${escapeHtml(new Date(invite.expires_at).toLocaleString())}</dd></dl>`;
    const storageKey = `veilconsent:${token}`;
    let secret = localStorage.getItem(storageKey);
    async function waitForCommit() {
      $('decisionStep').hidden = true;
      setMessage('participantMessage', 'Credential enrolled. Waiting for the request commitment to finalize on Midnight Preprod…');
      for (;;) {
        const current = await api(`/api/invitations/${token}`);
        if (current.status === 'awaiting_consent') {
          $('decisionStep').hidden = Boolean(current.responded_at);
          setMessage('participantMessage', current.responded_at ? 'Your response has already been recorded.' : 'The request is finalized on Preprod. You can now decide.');
          return;
        }
        if (['failed', 'declined', 'completed'].includes(current.status)) throw new Error(`Request is ${current.status}`);
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
    }
    if (invite.enrolled_at && secret) { $('enrollmentStep').hidden = true; await waitForCommit(); }
    $('enroll').onclick = async () => {
      const module = await import('/participant.bundle.js');
      const enrollment = await module.createEnrollment();
      await api(`/api/invitations/${token}/enroll`, { method: 'POST', body: JSON.stringify({ slot: invite.slot, credential: enrollment.credential, revocationHandle: enrollment.revocationHandle }) });
      secret = enrollment.approvalSecret; localStorage.setItem(storageKey, secret);
      $('enrollmentStep').hidden = true;
      await waitForCommit();
    };
    async function decide(approved) {
      if (approved && !secret) throw new Error('Private approval credential is unavailable in this browser');
      await api(`/api/invitations/${token}/decision`, { method: 'POST', body: JSON.stringify({ approved, approvalSecret: approved ? secret : undefined }) });
      localStorage.removeItem(storageKey); $('decisionStep').hidden = true;
      setMessage('participantMessage', approved ? 'Approval encrypted and recorded for authorization.' : 'Decline recorded. No approval witness was released.');
    }
    $('approve').onclick = () => decide(true).catch((error) => setMessage('participantMessage', error.message, true));
    $('decline').onclick = () => decide(false).catch((error) => setMessage('participantMessage', error.message, true));
  } catch (error) { setMessage('participantMessage', error.message, true); }
}

token ? participant() : organizer();
