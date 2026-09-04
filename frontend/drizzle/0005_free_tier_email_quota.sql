CREATE TABLE email_quota_usage (
  id text PRIMARY KEY NOT NULL,
  day_key text NOT NULL,
  day_count integer NOT NULL,
  month_key text NOT NULL,
  month_count integer NOT NULL,
  updated_at integer NOT NULL
);
