import pg from 'pg';

const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function audit(client, requestId, event, details = {}) {
  await client.query(
    'INSERT INTO audit_events (request_id, event, details) VALUES ($1, $2, $3)',
    [requestId, event, JSON.stringify(details)],
  );
}

export async function migrate() {
  const { readFile } = await import('node:fs/promises');
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
}

