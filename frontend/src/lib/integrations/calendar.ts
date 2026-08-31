import { createTextEmail } from "@/lib/integrations/email-message";
import { resolveSecret } from "@/lib/runtime-secret";

type IntegrationEnvironment = Pick<
  CloudflareEnv,
  | "DB"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "GOOGLE_REFRESH_TOKEN"
  | "GOOGLE_CALENDAR_ID"
  | "OPERATIONS_EMAIL"
  | "EMAIL_FROM_ADDRESS"
  | "OPERATIONS_MAILBOX"
>;

type PendingJob = {
  job_id: string;
  kind: "CALENDAR_UPSERT" | "CALENDAR_CANCEL";
  attempts: number;
  appointment_id: string;
  starts_at: number;
  ends_at: number;
  event_id: string | null;
};

type GoogleCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
};

const MAX_ATTEMPTS = 8;
const LEASE_MILLISECONDS = 5 * 60_000;
const MAX_RETRY_DELAY_MILLISECONDS = 60 * 60_000;

function assertSecret(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing required ${name} secret`);
  return value;
}

async function resolveGoogleCredentials(env: IntegrationEnvironment): Promise<GoogleCredentials> {
  const [clientId, clientSecret, refreshToken, calendarId] = await Promise.all([
    resolveSecret(env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID"),
    resolveSecret(env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET"),
    resolveSecret(env.GOOGLE_REFRESH_TOKEN, "GOOGLE_REFRESH_TOKEN"),
    resolveSecret(env.GOOGLE_CALENDAR_ID, "GOOGLE_CALENDAR_ID"),
  ]);
  return { clientId, clientSecret, refreshToken, calendarId };
}

async function googleEventId(appointmentId: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(appointmentId));
  // Google Calendar event IDs use base32hex (0-9 and a-v). The generated ID
  // is deterministic, opaque and contains no patient/user data.
  return Array.from(new Uint8Array(digest))
    .map((byte) => (byte & 31).toString(32))
    .join("")
    .slice(0, 26);
}

async function accessToken(credentials: GoogleCredentials) {
  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: credentials.refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("Google OAuth refresh failed");
  const json = (await response.json()) as { access_token?: string };
  return assertSecret(json.access_token, "Google access token");
}

function googleEventPayload(job: PendingJob, eventId: string) {
  return {
    id: eventId,
    summary: "Reserved time",
    start: {
      dateTime: new Date(job.starts_at).toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: new Date(job.ends_at).toISOString(),
      timeZone: "UTC",
    },
  };
}

async function updateGoogleEvent(
  eventUrl: string,
  token: string,
  payload: ReturnType<typeof googleEventPayload>,
) {
  const response = await fetch(eventUrl, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Google Calendar update failed");
}

async function syncGoogleEvent(credentials: GoogleCredentials, job: PendingJob, eventId: string) {
  const calendarId = encodeURIComponent(credentials.calendarId);
  const token = await accessToken(credentials);
  const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
  const eventUrl = `${eventsUrl}/${encodeURIComponent(eventId)}`;

  if (job.kind === "CALENDAR_CANCEL") {
    const response = await fetch(eventUrl, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok && response.status !== 404 && response.status !== 410) {
      throw new Error("Google Calendar delete failed");
    }
    return;
  }

  const payload = googleEventPayload(job, eventId);
  if (job.event_id) {
    await updateGoogleEvent(eventUrl, token, payload);
    return;
  }

  const response = await fetch(eventsUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (response.status === 409) {
    await updateGoogleEvent(eventUrl, token, payload);
    return;
  }
  if (!response.ok) throw new Error("Google Calendar insert failed");
}

async function alertFailedJobs(env: IntegrationEnvironment) {
  const failed = await env.DB.prepare(
    "SELECT id FROM integration_job WHERE state = 'FAILED' AND alerted_at IS NULL LIMIT 25",
  ).all<{ id: string }>();
  if (failed.results.length === 0) return;

  const message = createTextEmail(
    env.EMAIL_FROM_ADDRESS,
    env.OPERATIONS_MAILBOX,
    "Eikon Mind calendar integration needs attention",
    `${failed.results.length} calendar integration job(s) reached the retry limit. Review the privacy-minimized security audit and integration status.`,
  );
  await env.OPERATIONS_EMAIL.send(message);

  const alertedAt = Date.now();
  await env.DB.batch(
    failed.results.map(({ id }: { id: string }) =>
      env.DB.prepare(
        "UPDATE integration_job SET alerted_at = ? WHERE id = ? AND alerted_at IS NULL",
      ).bind(alertedAt, id),
    ),
  );
}

export async function processPendingIntegrationJobs(env: IntegrationEnvironment, limit = 10) {
  const now = Date.now();
  const result = await env.DB.prepare(
    `SELECT j.id AS job_id, j.kind, j.attempts, a.id AS appointment_id,
            a.starts_at, a.ends_at, r.event_id
     FROM integration_job j
     JOIN appointment a ON a.id = j.appointment_id
     LEFT JOIN calendar_event_reference r ON r.appointment_id = a.id
     WHERE (j.state = 'PENDING' AND j.not_before_at <= ?)
        OR (j.state = 'PROCESSING' AND j.lease_expires_at <= ?)
     ORDER BY j.created_at ASC LIMIT ?`,
  )
    .bind(now, now, limit)
    .all<PendingJob>();

  let googleCredentials: Promise<GoogleCredentials> | undefined;

  for (const job of result.results) {
    const claimed = await env.DB.prepare(
      `UPDATE integration_job
       SET state = 'PROCESSING', lease_expires_at = ?
       WHERE id = ? AND (
         (state = 'PENDING' AND not_before_at <= ?)
         OR (state = 'PROCESSING' AND lease_expires_at <= ?)
       )`,
    )
      .bind(now + LEASE_MILLISECONDS, job.job_id, now, now)
      .run();
    if (claimed.meta.changes === 0) continue;

    try {
      const eventId = job.event_id ?? (await googleEventId(job.appointment_id));
      googleCredentials ??= resolveGoogleCredentials(env);
      await syncGoogleEvent(await googleCredentials, job, eventId);
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO calendar_event_reference
           (id, appointment_id, provider, event_id, sync_status, last_synced_at, created_at, updated_at)
           VALUES (?, ?, 'GOOGLE', ?, ?, ?, ?, ?)
           ON CONFLICT(appointment_id) DO UPDATE SET
             event_id = excluded.event_id,
             sync_status = excluded.sync_status,
             last_synced_at = excluded.last_synced_at,
             updated_at = excluded.updated_at`,
        ).bind(
          crypto.randomUUID(),
          job.appointment_id,
          eventId,
          job.kind === "CALENDAR_CANCEL" ? "CANCELLED" : "SYNCED",
          now,
          now,
          now,
        ),
        env.DB.prepare(
          `UPDATE integration_job
           SET state = 'COMPLETED', processed_at = ?, lease_expires_at = NULL
           WHERE id = ? AND state = 'PROCESSING'`,
        ).bind(now, job.job_id),
      ]);
    } catch {
      // External error bodies are deliberately discarded because they can
      // contain personal data. Only a bounded state/code is persisted.
      const attempts = job.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await env.DB.batch([
          env.DB.prepare(
            `UPDATE integration_job
             SET attempts = ?, state = 'FAILED', lease_expires_at = NULL
             WHERE id = ? AND state = 'PROCESSING'`,
          ).bind(attempts, job.job_id),
          env.DB.prepare(
            `INSERT INTO security_event
             (id, event_type, severity, outcome, resource_id, correlation_id, created_at)
             VALUES (?, 'INTEGRATION_FAILED', 'CRITICAL', 'FAILED', ?, ?, ?)`,
          ).bind(crypto.randomUUID(), job.appointment_id, crypto.randomUUID(), now),
          env.DB.prepare(
            `UPDATE calendar_event_reference
             SET sync_status = 'FAILED', updated_at = ?
             WHERE appointment_id = ?`,
          ).bind(now, job.appointment_id),
        ]);
      } else {
        const retryDelay = Math.min(MAX_RETRY_DELAY_MILLISECONDS, 60_000 * 2 ** (attempts - 1));
        await env.DB.prepare(
          `UPDATE integration_job
           SET attempts = ?, state = 'PENDING', not_before_at = ?, lease_expires_at = NULL
           WHERE id = ? AND state = 'PROCESSING'`,
        )
          .bind(attempts, now + retryDelay, job.job_id)
          .run();
      }
    }
  }

  await alertFailedJobs(env).catch(() => {
    console.error("calendar integration alert failed");
  });
}
