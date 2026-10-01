CREATE TABLE IF NOT EXISTS consent_requests (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  purpose jsonb NOT NULL,
  threshold smallint NOT NULL CHECK (threshold BETWEEN 1 AND 3),
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN (
    'enrolling', 'ready_to_commit', 'committing', 'awaiting_consent',
    'authorizing', 'authorized', 'processing', 'completed', 'declined', 'failed'
  )),
  encrypted_document jsonb NOT NULL,
  private_state jsonb,
  request_commitment text,
  capability_commitment text,
  create_tx text,
  issue_tx text,
  consume_tx text,
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  request_id uuid NOT NULL REFERENCES consent_requests(id) ON DELETE CASCADE,
  slot char(1) NOT NULL CHECK (slot IN ('A', 'B', 'C')),
  invite_token_hash text NOT NULL UNIQUE,
  credential text,
  revocation_handle text,
  decision boolean,
  approval_secret_ciphertext jsonb,
  enrolled_at timestamptz,
  responded_at timestamptz,
  PRIMARY KEY (request_id, slot)
);

CREATE TABLE IF NOT EXISTS jobs (
  id bigserial PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES consent_requests(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('commit', 'authorize', 'process')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  UNIQUE (request_id, kind)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  request_id uuid REFERENCES consent_requests(id) ON DELETE CASCADE,
  event text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_queue_idx ON jobs(status, id);
CREATE INDEX IF NOT EXISTS participants_request_idx ON participants(request_id);

