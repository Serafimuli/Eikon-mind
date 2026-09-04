interface SecretsStoreSecret {
  get(): Promise<string>;
}

interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  APP_ENV: "dev" | "production" | "local";
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRETS: string | SecretsStoreSecret;
  TURNSTILE_SECRET: string | SecretsStoreSecret;
  TURNSTILE_SITEKEY: string;
  GOOGLE_CLIENT_ID: string | SecretsStoreSecret;
  GOOGLE_CLIENT_SECRET: string | SecretsStoreSecret;
  GOOGLE_REFRESH_TOKEN: string | SecretsStoreSecret;
  GOOGLE_CALENDAR_ID: string | SecretsStoreSecret;
  RESEND_API_KEY: string | SecretsStoreSecret;
  EMAIL_FROM_ADDRESS: string;
  FREE_TIER_ONLY: "true";
  OPERATIONS_MAILBOX: string;
  RETENTION_APPOINTMENT_DAYS: string;
  RETENTION_CANCELLED_APPOINTMENT_DAYS: string;
  RETENTION_DEIDENTIFIED_RECORD_DAYS: string;
  RETENTION_AUDIT_EVENT_DAYS: string;
}
