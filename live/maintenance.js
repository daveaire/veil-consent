import { audit, pool, withTransaction } from './db.js';
import { encryptJson } from './crypto.js';

export async function maintainExpiredData() {
  const purged = await pool.query(
    'UPDATE consent_requests SET result = NULL WHERE result IS NOT NULL AND result_expires_at <= now()',
  );

  let expiredCount = 0;
  await withTransaction(async (client) => {
    const expired = await client.query(
      `UPDATE consent_requests SET status = 'failed', error = 'Consent request expired',
       encrypted_document = $1, private_state = NULL, updated_at = now()
       WHERE expires_at <= now() AND status NOT IN ('completed', 'declined', 'failed')
       RETURNING id`,
      [JSON.stringify(encryptJson({ deleted: true }))],
    );
    expiredCount = expired.rowCount;
    for (const row of expired.rows) {
      await client.query(
        `UPDATE jobs SET status = 'failed', error = 'Consent request expired', finished_at = now()
         WHERE request_id = $1 AND status = 'queued'`,
        [row.id],
      );
      await client.query(
        'UPDATE participants SET approval_secret_ciphertext = NULL WHERE request_id = $1',
        [row.id],
      );
      await audit(client, row.id, 'request.expired');
    }
  });

  return { purgedResults: purged.rowCount, expiredRequests: expiredCount };
}
