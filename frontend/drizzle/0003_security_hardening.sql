-- Better Auth 1.7 separates local and OAuth account namespaces with an issuer.
-- Existing installations used only credential accounts; the fallback keeps any
-- legacy OAuth rows addressable without conflating them with local credentials.
ALTER TABLE account ADD COLUMN issuer text NOT NULL DEFAULT '';
UPDATE account
SET issuer = CASE
  WHEN provider_id = 'credential' THEN 'local:credential'
  ELSE 'local:oauth:' || provider_id
END
WHERE issuer = '';
CREATE UNIQUE INDEX IF NOT EXISTS account_issuer_id_unique ON account(issuer, account_id);

CREATE TABLE IF NOT EXISTS "rateLimit" (
  id text PRIMARY KEY NOT NULL,
  key text NOT NULL,
  count integer NOT NULL,
  lastRequest integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS rate_limit_key_unique ON "rateLimit"(key);

CREATE TRIGGER IF NOT EXISTS user_role_insert_check
BEFORE INSERT ON user
WHEN NEW.role NOT IN ('USER', 'THERAPIST', 'ADMIN')
BEGIN
  SELECT RAISE(ABORT, 'invalid user role');
END;

CREATE TRIGGER IF NOT EXISTS user_role_update_check
BEFORE UPDATE OF role ON user
WHEN NEW.role NOT IN ('USER', 'THERAPIST', 'ADMIN')
BEGIN
  SELECT RAISE(ABORT, 'invalid user role');
END;

ALTER TABLE integration_job ADD COLUMN state text NOT NULL DEFAULT 'PENDING'
  CHECK (state IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'));
ALTER TABLE integration_job ADD COLUMN lease_expires_at integer;
ALTER TABLE integration_job ADD COLUMN alerted_at integer;
UPDATE integration_job SET state = 'COMPLETED' WHERE processed_at IS NOT NULL;
DELETE FROM integration_job
WHERE id NOT IN (
  SELECT MIN(id) FROM integration_job GROUP BY appointment_id, kind
);
CREATE UNIQUE INDEX IF NOT EXISTS integration_job_appointment_kind_unique
  ON integration_job(appointment_id, kind);
CREATE INDEX IF NOT EXISTS integration_jobs_state_due_idx
  ON integration_job(state, not_before_at);

CREATE TABLE security_event (
  id text PRIMARY KEY NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'AUTHENTICATION_FAILURE',
    'AUTHENTICATION_LOCKOUT',
    'ACCESS_DENIED',
    'INVALID_STATE_TRANSITION',
    'ROLE_CHANGED',
    'ACCOUNT_DELETED',
    'INTEGRATION_FAILED'
  )),
  severity text NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  outcome text NOT NULL CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILED')),
  actor_user_id text,
  subject_user_id text,
  resource_id text,
  correlation_id text NOT NULL,
  created_at integer NOT NULL
);
CREATE INDEX security_event_created_idx ON security_event(created_at);
CREATE INDEX security_event_type_created_idx ON security_event(event_type, created_at);
