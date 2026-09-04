import { createTextEmail } from "@/lib/integrations/email-message";
import { resolveSecret } from "@/lib/runtime-secret";

type EmailEnvironment = Pick<
  CloudflareEnv,
  | "APP_ENV"
  | "DB"
  | "EMAIL_FROM_ADDRESS"
  | "FREE_TIER_ONLY"
  | "OPERATIONS_MAILBOX"
  | "RESEND_API_KEY"
>;

const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";
export const FREE_EMAIL_DAILY_LIMIT = 100;
export const FREE_EMAIL_MONTHLY_LIMIT = 3_000;

function quotaKeys(now: Date) {
  const iso = now.toISOString();
  return { day: iso.slice(0, 10), month: iso.slice(0, 7) };
}

export async function reserveFreeEmailQuota(env: Pick<EmailEnvironment, "DB">, now = new Date()) {
  const period = quotaKeys(now);
  const result = await env.DB.prepare(
    `INSERT INTO email_quota_usage
       (id, day_key, day_count, month_key, month_count, updated_at)
     VALUES ('resend-free', ?, 1, ?, 1, ?)
     ON CONFLICT(id) DO UPDATE SET
       day_key = excluded.day_key,
       day_count = CASE
         WHEN email_quota_usage.day_key = excluded.day_key
           THEN email_quota_usage.day_count + 1
         ELSE 1
       END,
       month_key = excluded.month_key,
       month_count = CASE
         WHEN email_quota_usage.month_key = excluded.month_key
           THEN email_quota_usage.month_count + 1
         ELSE 1
       END,
       updated_at = excluded.updated_at
     WHERE
       (CASE
         WHEN email_quota_usage.day_key = excluded.day_key
           THEN email_quota_usage.day_count
         ELSE 0
       END) < ?
       AND
       (CASE
         WHEN email_quota_usage.month_key = excluded.month_key
           THEN email_quota_usage.month_count
         ELSE 0
       END) < ?`,
  )
    .bind(period.day, period.month, now.getTime(), FREE_EMAIL_DAILY_LIMIT, FREE_EMAIL_MONTHLY_LIMIT)
    .run();

  if (result.meta.changes !== 1) {
    throw new Error("Free email quota exhausted");
  }
}

async function sendEmail(env: EmailEnvironment, to: string, subject: string, body: string) {
  const message = createTextEmail(env.EMAIL_FROM_ADDRESS, to, subject, body);
  if (env.FREE_TIER_ONLY !== "true") {
    throw new Error("Email delivery requires FREE_TIER_ONLY=true");
  }
  if (env.APP_ENV === "local") return;

  const apiKey = await resolveSecret(env.RESEND_API_KEY, "RESEND_API_KEY");
  await reserveFreeEmailQuota(env);
  const response = await fetch(RESEND_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: `${message.from.name} <${message.from.email}>`,
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
  });
  if (!response.ok) {
    // Provider response bodies can contain recipient data. Do not log or persist them.
    throw new Error(`Transactional email delivery failed with HTTP ${response.status}`);
  }
}

export function sendTransactionalEmail(
  env: EmailEnvironment,
  recipient: string,
  subject: string,
  body: string,
) {
  return sendEmail(env, recipient, subject, body);
}

export function sendOperationsEmail(env: EmailEnvironment, subject: string, body: string) {
  return sendEmail(env, env.OPERATIONS_MAILBOX, subject, body);
}
