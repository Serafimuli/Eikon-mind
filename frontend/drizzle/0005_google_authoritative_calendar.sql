-- Google Calendar is the availability authority.  These rows contain only
-- opaque event references and synchronization metadata, never event content.
CREATE TABLE IF NOT EXISTS calendar_managed_item (
  id text PRIMARY KEY NOT NULL,
  appointment_id text REFERENCES appointment(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('APPOINTMENT', 'BLOCK')),
  etag text,
  starts_at integer NOT NULL,
  ends_at integer NOT NULL,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  UNIQUE (appointment_id),
  UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS calendar_managed_item_window_idx
  ON calendar_managed_item(starts_at, ends_at);

INSERT OR IGNORE INTO calendar_managed_item
  (id, appointment_id, event_id, kind, etag, starts_at, ends_at, created_at, updated_at)
SELECT
  'legacy-' || r.appointment_id,
  r.appointment_id,
  r.event_id,
  'APPOINTMENT',
  NULL,
  a.starts_at,
  a.ends_at,
  r.created_at,
  r.updated_at
FROM calendar_event_reference r
JOIN appointment a ON a.id = r.appointment_id
WHERE r.sync_status = 'SYNCED';

CREATE TABLE IF NOT EXISTS calendar_sync_state (
  id integer PRIMARY KEY NOT NULL CHECK (id = 1),
  sync_token text,
  channel_id text,
  channel_resource_id text,
  channel_token text,
  channel_expires_at integer,
  sync_requested_at integer,
  updated_at integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS appointment_active_therapist_start_unique
  ON appointment(therapist_id, starts_at)
  WHERE status IN ('REQUESTED', 'CONFIRMED');
