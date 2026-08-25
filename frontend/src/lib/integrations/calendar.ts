type IntegrationEnvironment = Pick<
  CloudflareEnv,
  "DB" | "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "GOOGLE_REFRESH_TOKEN" | "GOOGLE_CALENDAR_ID"
>

type PendingJob = {
  job_id: string
  kind: "CALENDAR_UPSERT" | "CALENDAR_CANCEL"
  attempts: number
  appointment_id: string
  starts_at: number
  ends_at: number
  event_id: string | null
}

function assertSecret(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing required ${name} secret`)
  return value
}

async function googleEventId(appointmentId: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(appointmentId))
  // Google Calendar event IDs use base32hex (0-9 and a-v). The generated ID
  // is deterministic, opaque and contains no patient/user data.
  return Array.from(new Uint8Array(digest))
    .map((byte) => (byte & 31).toString(32))
    .join("")
    .slice(0, 26)
}

async function accessToken(env: IntegrationEnvironment) {
  const body = new URLSearchParams({
    client_id: assertSecret(env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID"),
    client_secret: assertSecret(env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET"),
    refresh_token: assertSecret(env.GOOGLE_REFRESH_TOKEN, "GOOGLE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  })
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!response.ok) throw new Error("Google OAuth refresh failed")
  const json = (await response.json()) as { access_token?: string }
  return assertSecret(json.access_token, "Google access token")
}

async function updateGoogleEvent(env: IntegrationEnvironment, job: PendingJob, eventId: string) {
  const calendarId = encodeURIComponent(assertSecret(env.GOOGLE_CALENDAR_ID, "GOOGLE_CALENDAR_ID"))
  const token = await accessToken(env)
  const payload = job.kind === "CALENDAR_CANCEL"
    ? { id: eventId, status: "cancelled" }
    : {
        id: eventId,
        summary: "Reserved time",
        start: { dateTime: new Date(job.starts_at).toISOString(), timeZone: "UTC" },
        end: { dateTime: new Date(job.ends_at).toISOString(), timeZone: "UTC" },
      }
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
    {
      method: "PUT",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  )
  if (!response.ok) throw new Error("Google Calendar update failed")
}

export async function processPendingIntegrationJobs(env: IntegrationEnvironment, limit = 10) {
  const now = Date.now()
  const result = await env.DB.prepare(
    `SELECT j.id AS job_id, j.kind, j.attempts, a.id AS appointment_id, a.starts_at, a.ends_at, r.event_id
     FROM integration_job j
     JOIN appointment a ON a.id = j.appointment_id
     LEFT JOIN calendar_event_reference r ON r.appointment_id = a.id
     WHERE j.processed_at IS NULL AND j.not_before_at <= ?
     ORDER BY j.created_at ASC LIMIT ?`,
  )
    .bind(now, limit)
    .all<PendingJob>()

  for (const job of result.results) {
    try {
      const eventId = job.event_id ?? await googleEventId(job.appointment_id)
      await updateGoogleEvent(env, job, eventId)
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO calendar_event_reference
           (id, appointment_id, provider, event_id, sync_status, last_synced_at, created_at, updated_at)
           VALUES (?, ?, 'GOOGLE', ?, ?, ?, ?, ?)
           ON CONFLICT(appointment_id) DO UPDATE SET event_id=excluded.event_id, sync_status=excluded.sync_status, last_synced_at=excluded.last_synced_at, updated_at=excluded.updated_at`,
        ).bind(crypto.randomUUID(), job.appointment_id, eventId, job.kind === "CALENDAR_CANCEL" ? "CANCELLED" : "SYNCED", now, now, now),
        env.DB.prepare("UPDATE integration_job SET processed_at = ? WHERE id = ?").bind(now, job.job_id),
      ])
    } catch {
      // Retry without recording the underlying error: external responses can
      // include personal data and must never be written to Worker/D1 logs.
      const retryAt = now + 60_000 * 2 ** Math.min(6, job.attempts + 1)
      await env.DB.prepare(
        "UPDATE integration_job SET attempts = attempts + 1, not_before_at = ? WHERE id = ?",
      ).bind(retryAt, job.job_id).run()
    }
  }
}
