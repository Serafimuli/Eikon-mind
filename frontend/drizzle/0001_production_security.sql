-- Production data-minimisation and booking model migration.
-- This deliberately drops free-text appointment notes. Do not add clinical,
-- diagnostic, medical-history, or other sensitive-health fields to this schema.
PRAGMA foreign_keys = OFF;

UPDATE "user"
SET role = CASE
  WHEN lower(role) = 'admin' THEN 'ADMIN'
  WHEN upper(role) = 'THERAPIST' THEN 'THERAPIST'
  ELSE 'USER'
END;

ALTER TABLE "user" ADD COLUMN two_factor_enabled integer NOT NULL DEFAULT 0;

CREATE TABLE availability_slot (
  id text PRIMARY KEY NOT NULL,
  therapist_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  starts_at integer NOT NULL,
  ends_at integer NOT NULL,
  state text NOT NULL DEFAULT 'OPEN' CHECK (state IN ('OPEN', 'RESERVED', 'BLOCKED')),
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  CHECK (ends_at > starts_at),
  UNIQUE (therapist_id, starts_at, ends_at)
);
CREATE INDEX availability_open_starts_idx ON availability_slot(state, starts_at);

CREATE TABLE appointment_new (
  id text PRIMARY KEY NOT NULL,
  client_id text REFERENCES "user"(id) ON DELETE SET NULL,
  therapist_id text REFERENCES "user"(id) ON DELETE SET NULL,
  availability_slot_id text UNIQUE REFERENCES availability_slot(id) ON DELETE RESTRICT,
  service_code text NOT NULL DEFAULT 'STANDARD',
  starts_at integer NOT NULL,
  ends_at integer NOT NULL,
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  cancelled_at integer,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  CHECK (ends_at > starts_at)
);

INSERT INTO appointment_new (id, client_id, therapist_id, availability_slot_id, service_code, starts_at, ends_at, status, cancelled_at, created_at, updated_at)
SELECT
  id,
  client_id,
  NULL,
  NULL,
  'STANDARD',
  starts_at,
  starts_at + 3000000,
  CASE status
    WHEN 'confirmed' THEN 'CONFIRMED'
    WHEN 'completed' THEN 'COMPLETED'
    WHEN 'cancelled' THEN 'CANCELLED'
    ELSE 'REQUESTED'
  END,
  CASE WHEN status = 'cancelled' THEN updated_at ELSE NULL END,
  created_at,
  updated_at
FROM appointment;

DROP TABLE appointment;
ALTER TABLE appointment_new RENAME TO appointment;
CREATE UNIQUE INDEX appointment_availability_slot_unique ON appointment(availability_slot_id);
CREATE INDEX appointment_client_starts_idx ON appointment(client_id, starts_at);
CREATE INDEX appointment_therapist_starts_idx ON appointment(therapist_id, starts_at);
CREATE INDEX appointment_status_starts_idx ON appointment(status, starts_at);

CREATE TABLE "twoFactor" (
  id text PRIMARY KEY NOT NULL,
  userId text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  secret text NOT NULL,
  backupCodes text NOT NULL,
  verified integer NOT NULL DEFAULT 1,
  failedVerificationCount integer NOT NULL DEFAULT 0,
  lockedUntil integer
);
CREATE INDEX two_factor_user_idx ON "twoFactor"(userId);

CREATE TABLE calendar_event_reference (
  id text PRIMARY KEY NOT NULL,
  appointment_id text NOT NULL REFERENCES appointment(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'GOOGLE' CHECK (provider = 'GOOGLE'),
  event_id text NOT NULL,
  sync_status text NOT NULL DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED', 'CANCELLED')),
  last_synced_at integer,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  UNIQUE (appointment_id),
  UNIQUE (provider, event_id)
);

CREATE TABLE integration_job (
  id text PRIMARY KEY NOT NULL,
  appointment_id text NOT NULL REFERENCES appointment(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('CALENDAR_UPSERT', 'CALENDAR_CANCEL')),
  attempts integer NOT NULL DEFAULT 0,
  not_before_at integer NOT NULL,
  processed_at integer,
  created_at integer NOT NULL
);
CREATE INDEX integration_jobs_pending_idx ON integration_job(processed_at, not_before_at);

CREATE TABLE account_deletion_request (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  requested_at integer NOT NULL,
  completed_at integer,
  UNIQUE (user_id)
);

PRAGMA foreign_keys = ON;
