interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  APP_ENV: "dev" | "production" | "local";
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRETS: string;
  TURNSTILE_SECRET: string;
  TURNSTILE_SITEKEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  GOOGLE_CALENDAR_ID: string;
  EMAIL_FROM_ADDRESS: string;
  OPERATIONS_MAILBOX: string;
  RETENTION_APPOINTMENT_DAYS: string;
  RETENTION_CANCELLED_APPOINTMENT_DAYS: string;
  RETENTION_DEIDENTIFIED_RECORD_DAYS: string;
  RETENTION_AUDIT_EVENT_DAYS: string;
  TRANSACTIONAL_EMAIL: SendEmail;
  OPERATIONS_EMAIL: SendEmail;
}

interface SendEmail {
  send(message: {
    from: string | { email: string; name?: string };
    to: string | string[];
    subject: string;
    text: string;
  }): Promise<unknown>;
}
