ALTER TABLE appointment ADD COLUMN client_hidden_at integer;

CREATE INDEX IF NOT EXISTS appointment_client_visible_idx
  ON appointment(client_id, client_hidden_at, starts_at);
