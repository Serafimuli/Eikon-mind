type MaintenanceEnv = Pick<
  CloudflareEnv,
  | "DB"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "GOOGLE_REFRESH_TOKEN"
  | "GOOGLE_CALENDAR_ID"
  | "RESEND_API_KEY"
  | "EMAIL_FROM_ADDRESS"
  | "FREE_TIER_ONLY"
  | "OPERATIONS_MAILBOX"
  | "APP_ENV"
  | "BETTER_AUTH_URL"
  | "RETENTION_APPOINTMENT_DAYS"
  | "RETENTION_CANCELLED_APPOINTMENT_DAYS"
  | "RETENTION_DEIDENTIFIED_RECORD_DAYS"
  | "RETENTION_AUDIT_EVENT_DAYS"
>;

function days(value: string, name: string) {
  const result = Number(value);
  if (!Number.isInteger(result) || result <= 0)
    throw new Error(`${name} must be a positive whole number`);
  return result;
}

export async function runRetention(env: MaintenanceEnv) {
  const appointmentDays = days(env.RETENTION_APPOINTMENT_DAYS, "RETENTION_APPOINTMENT_DAYS");
  const cancelledDays = days(
    env.RETENTION_CANCELLED_APPOINTMENT_DAYS,
    "RETENTION_CANCELLED_APPOINTMENT_DAYS",
  );
  const deidentifiedDays = days(
    env.RETENTION_DEIDENTIFIED_RECORD_DAYS,
    "RETENTION_DEIDENTIFIED_RECORD_DAYS",
  );
  const auditDays = days(env.RETENTION_AUDIT_EVENT_DAYS, "RETENTION_AUDIT_EVENT_DAYS");

  const now = Date.now();
  const normalCutoff = now - appointmentDays * 86_400_000;
  const cancelledCutoff = now - cancelledDays * 86_400_000;
  const deidentifiedCutoff = now - deidentifiedDays * 86_400_000;
  const auditCutoff = now - auditDays * 86_400_000;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM verification WHERE expires_at < ?").bind(now),
    env.DB.prepare("DELETE FROM session WHERE expires_at < ?").bind(now),
    env.DB.prepare("DELETE FROM appointment WHERE status = 'CANCELLED' AND updated_at < ?").bind(
      cancelledCutoff,
    ),
    env.DB.prepare(
      "DELETE FROM appointment WHERE status IN ('REQUESTED', 'CONFIRMED', 'COMPLETED') AND starts_at < ?",
    ).bind(normalCutoff),
    env.DB.prepare(
      `DELETE FROM availability_slot
       WHERE ends_at < ?
       AND NOT EXISTS (
         SELECT 1 FROM appointment
         WHERE appointment.availability_slot_id = availability_slot.id
       )`,
    ).bind(normalCutoff),
    env.DB.prepare(
      "DELETE FROM calendar_event_reference WHERE appointment_id NOT IN (SELECT id FROM appointment)",
    ),
    env.DB.prepare(
      "DELETE FROM calendar_managed_item WHERE appointment_id IS NOT NULL AND appointment_id NOT IN (SELECT id FROM appointment)",
    ),
    env.DB.prepare("DELETE FROM security_event WHERE created_at < ?").bind(auditCutoff),
    env.DB.prepare('DELETE FROM "rateLimit" WHERE lastRequest < ?').bind(now - 86_400_000),
    env.DB.prepare(
      "DELETE FROM user WHERE id IN (SELECT user_id FROM account_deletion_request WHERE requested_at < ?)",
    ).bind(deidentifiedCutoff),
  ]);
}

async function runMaintenance(env: MaintenanceEnv) {
  // Keep the privileged Calendar module behind the scheduled execution path.
  // This also lets retention-only tests run without emulating Next's
  // server-only module marker.
  const { processCalendarMaintenance } = await import("../src/lib/integrations/calendar-google");
  await processCalendarMaintenance(env);
  await runRetention(env);
}

const worker = {
  async scheduled(
    _event: unknown,
    env: MaintenanceEnv,
    ctx: { waitUntil(task: Promise<unknown>): void },
  ) {
    ctx.waitUntil(
      runMaintenance(env).catch(() => {
        console.error("scheduled maintenance failed");
      }),
    );
  },
};

export default worker;
