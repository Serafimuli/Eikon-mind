import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { canStaffTransitionAppointment, type AppointmentStatus } from "@/lib/appointment-types";
import { processPendingIntegrationJobs } from "@/lib/integrations/calendar";
import { appointmentEmail, sendTransactionalEmail } from "@/lib/integrations/email";
import { getD1, getDb } from "@/lib/db";
import { appointments, availabilitySlots, users } from "@/lib/db/schema";
import { DomainError } from "@/lib/errors";
import { defer, getRuntimeEnv } from "@/lib/platform-env";
import type { Role } from "@/lib/roles";
import { recordSecurityEvent } from "@/lib/security/events";

type Actor = { id: string; role: Role };

async function recordDenied(
  actorUserId: string,
  resourceId: string,
  eventType: "ACCESS_DENIED" | "INVALID_STATE_TRANSITION",
) {
  await recordSecurityEvent({
    eventType,
    severity: "WARNING",
    outcome: "DENIED",
    actorUserId,
    resourceId,
  });
}

async function notifyClient(clientId: string | null, status: "CONFIRMED" | "CANCELLED") {
  if (!clientId) return;

  const client = await getDb().query.users.findFirst({
    columns: { email: true, emailVerified: true },
    where: eq(users.id, clientId),
  });
  if (!client?.emailVerified) return;

  const message = appointmentEmail(status === "CONFIRMED" ? "confirmed" : "cancelled");
  defer(
    sendTransactionalEmail(getRuntimeEnv(), client.email, message.subject, message.body),
    "appointment email",
  );
}

async function notifyTherapist(therapistId: string | null) {
  if (!therapistId) return;

  const therapist = await getDb().query.users.findFirst({
    columns: { email: true, emailVerified: true, role: true, twoFactorEnabled: true },
    where: eq(users.id, therapistId),
  });
  if (!therapist?.emailVerified || !therapist.twoFactorEnabled || therapist.role !== "THERAPIST") {
    return;
  }

  const message = appointmentEmail("requested");
  defer(
    sendTransactionalEmail(getRuntimeEnv(), therapist.email, message.subject, message.body),
    "appointment request email",
  );
}

function calendarJobSql(appointmentId: string, status: AppointmentStatus, now: number) {
  if (status !== "CONFIRMED" && status !== "CANCELLED") return null;

  const kind = status === "CONFIRMED" ? "CALENDAR_UPSERT" : "CALENDAR_CANCEL";
  return getD1()
    .prepare(
      `INSERT INTO integration_job
       (id, appointment_id, kind, attempts, state, not_before_at, created_at)
       SELECT ?, ?, ?, 0, 'PENDING', ?, ?
       FROM appointment
       WHERE id = ? AND status = ? AND updated_at = ?
       ON CONFLICT(appointment_id, kind) DO NOTHING`,
    )
    .bind(crypto.randomUUID(), appointmentId, kind, now, now, appointmentId, status, now);
}

function releaseFutureSlotSql(appointmentId: string, now: number) {
  return getD1()
    .prepare(
      `UPDATE availability_slot
       SET state = 'OPEN', updated_at = ?
       WHERE id = (
         SELECT availability_slot_id FROM appointment
         WHERE id = ? AND status = 'CANCELLED' AND updated_at = ?
       )
       AND state = 'RESERVED' AND starts_at > ?`,
    )
    .bind(now, appointmentId, now, now);
}

function detachReleasedSlotSql(appointmentId: string, now: number) {
  return getD1()
    .prepare(
      `UPDATE appointment
       SET availability_slot_id = NULL
       WHERE id = ? AND status = 'CANCELLED' AND updated_at = ?
       AND availability_slot_id IN (
         SELECT id FROM availability_slot
         WHERE state = 'OPEN' AND updated_at = ? AND starts_at > ?
       )`,
    )
    .bind(appointmentId, now, now, now);
}

export async function blockOpenAvailability(actor: Actor, slotId: string) {
  const result = await getD1()
    .prepare(
      `UPDATE availability_slot
       SET state = 'BLOCKED', updated_at = ?
       WHERE id = ? AND state = 'OPEN'
       AND (? = 'ADMIN' OR therapist_id = ?)`,
    )
    .bind(Date.now(), slotId, actor.role, actor.id)
    .run();

  if (result.meta.changes === 0) {
    const slot = await getDb().query.availabilitySlots.findFirst({
      columns: { therapistId: true, state: true },
      where: eq(availabilitySlots.id, slotId),
    });
    const denied = slot && actor.role !== "ADMIN" && slot.therapistId !== actor.id;
    await recordDenied(actor.id, slotId, denied ? "ACCESS_DENIED" : "INVALID_STATE_TRANSITION");
    throw new DomainError("Availability cannot be blocked", denied ? "ACCESS_DENIED" : "CONFLICT");
  }
}

export async function transitionAppointmentForStaff(
  actor: Actor,
  appointmentId: string,
  nextStatus: AppointmentStatus,
) {
  const appointment = await getDb().query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
  });
  if (!appointment) throw new DomainError("Appointment not found", "NOT_FOUND");

  if (actor.role !== "ADMIN" && appointment.therapistId !== actor.id) {
    await recordDenied(actor.id, appointmentId, "ACCESS_DENIED");
    throw new DomainError("Appointment not found", "NOT_FOUND");
  }

  if (appointment.status === nextStatus) return;
  if (!canStaffTransitionAppointment(appointment.status, nextStatus)) {
    await recordDenied(actor.id, appointmentId, "INVALID_STATE_TRANSITION");
    throw new DomainError("Appointment status conflict", "CONFLICT");
  }

  const now = Date.now();
  const db = getD1();
  const update = db
    .prepare(
      `UPDATE appointment
       SET status = ?, cancelled_at = ?, updated_at = ?
       WHERE id = ? AND status = ?
       AND (? = 'ADMIN' OR therapist_id = ?)`,
    )
    .bind(
      nextStatus,
      nextStatus === "CANCELLED" ? now : null,
      now,
      appointmentId,
      appointment.status,
      actor.role,
      actor.id,
    );
  const job = calendarJobSql(appointmentId, nextStatus, now);
  const release = nextStatus === "CANCELLED" ? releaseFutureSlotSql(appointmentId, now) : null;
  const detach = nextStatus === "CANCELLED" ? detachReleasedSlotSql(appointmentId, now) : null;
  const results = await db.batch([
    update,
    ...(job ? [job] : []),
    ...(release ? [release] : []),
    ...(detach ? [detach] : []),
  ]);

  if (results[0].meta.changes === 0) {
    await recordDenied(actor.id, appointmentId, "INVALID_STATE_TRANSITION");
    throw new DomainError("Appointment status conflict", "CONFLICT");
  }

  if (job) {
    defer(processPendingIntegrationJobs(getRuntimeEnv(), 1), "calendar integration");
  }
  if (nextStatus === "CONFIRMED" || nextStatus === "CANCELLED") {
    await notifyClient(appointment.clientId, nextStatus);
  }
}

export async function cancelAppointmentForClient(clientId: string, appointmentId: string) {
  const appointment = await getDb().query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.clientId, clientId),
      isNull(appointments.clientHiddenAt),
    ),
  });
  if (!appointment) {
    await recordDenied(clientId, appointmentId, "ACCESS_DENIED");
    throw new DomainError("Appointment not found", "NOT_FOUND");
  }
  if (appointment.status !== "REQUESTED" && appointment.status !== "CONFIRMED") {
    await recordDenied(clientId, appointmentId, "INVALID_STATE_TRANSITION");
    throw new DomainError("Appointment cannot be cancelled", "CONFLICT");
  }

  const now = Date.now();
  const db = getD1();
  const update = db
    .prepare(
      `UPDATE appointment
       SET status = 'CANCELLED', cancelled_at = ?, updated_at = ?
       WHERE id = ? AND client_id = ? AND client_hidden_at IS NULL
       AND status IN ('REQUESTED', 'CONFIRMED')`,
    )
    .bind(now, now, appointmentId, clientId);
  const job = calendarJobSql(appointmentId, "CANCELLED", now);
  const release = releaseFutureSlotSql(appointmentId, now);
  const detach = detachReleasedSlotSql(appointmentId, now);
  const results = await db.batch([update, job!, release, detach]);

  if (results[0].meta.changes === 0) {
    await recordDenied(clientId, appointmentId, "INVALID_STATE_TRANSITION");
    throw new DomainError("Appointment status conflict", "CONFLICT");
  }

  defer(processPendingIntegrationJobs(getRuntimeEnv(), 1), "calendar integration");
  await notifyClient(clientId, "CANCELLED");
}

export async function hideAppointmentForClient(clientId: string, appointmentId: string) {
  const appointment = await getDb().query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.clientId, clientId),
      isNull(appointments.clientHiddenAt),
    ),
  });
  if (!appointment) {
    await recordDenied(clientId, appointmentId, "ACCESS_DENIED");
    throw new DomainError("Appointment not found", "NOT_FOUND");
  }

  const active = appointment.status === "REQUESTED" || appointment.status === "CONFIRMED";
  const now = Date.now();
  const update = getD1()
    .prepare(
      active
        ? `UPDATE appointment
           SET status = 'CANCELLED', cancelled_at = ?, client_hidden_at = ?, updated_at = ?
           WHERE id = ? AND client_id = ? AND client_hidden_at IS NULL AND status = ?`
        : `UPDATE appointment
           SET client_hidden_at = ?, updated_at = ?
           WHERE id = ? AND client_id = ? AND client_hidden_at IS NULL AND status = ?`,
    )
    .bind(
      ...(active
        ? [now, now, now, appointmentId, clientId, appointment.status]
        : [now, now, appointmentId, clientId, appointment.status]),
    );
  const job = active ? calendarJobSql(appointmentId, "CANCELLED", now) : null;
  const release =
    active || appointment.status === "CANCELLED" ? releaseFutureSlotSql(appointmentId, now) : null;
  const detach = release ? detachReleasedSlotSql(appointmentId, now) : null;
  const results = await getD1().batch([
    update,
    ...(job ? [job] : []),
    ...(release ? [release] : []),
    ...(detach ? [detach] : []),
  ]);

  if (results[0].meta.changes === 0) {
    await recordDenied(clientId, appointmentId, "INVALID_STATE_TRANSITION");
    throw new DomainError("Appointment could not be deleted", "CONFLICT");
  }

  if (active) {
    defer(processPendingIntegrationJobs(getRuntimeEnv(), 1), "calendar integration");
    await notifyClient(clientId, "CANCELLED");
  }
}

export type RescheduleAppointmentResult =
  | { appointmentId: string; originalAppointmentCancelled: false }
  | { appointmentId: null; originalAppointmentCancelled: true };

export async function rescheduleAppointmentForClient(
  clientId: string,
  appointmentId: string,
  slotId: string,
): Promise<RescheduleAppointmentResult> {
  const appointment = await getDb().query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.clientId, clientId),
      isNull(appointments.clientHiddenAt),
    ),
  });
  if (!appointment) {
    await recordDenied(clientId, appointmentId, "ACCESS_DENIED");
    throw new DomainError("Appointment not found", "NOT_FOUND");
  }
  if (
    (appointment.status !== "REQUESTED" && appointment.status !== "CONFIRMED") ||
    appointment.startsAt.getTime() <= Date.now() ||
    appointment.availabilitySlotId === slotId
  ) {
    await recordDenied(clientId, appointmentId, "INVALID_STATE_TRANSITION");
    throw new DomainError("Appointment cannot be rescheduled", "CONFLICT");
  }

  const now = Date.now();
  const newAppointmentId = crypto.randomUUID();
  const db = getD1();
  const cancel = db
    .prepare(
      `UPDATE appointment
       SET status = 'CANCELLED', cancelled_at = ?, updated_at = ?
       WHERE id = ? AND client_id = ? AND client_hidden_at IS NULL
       AND status = ? AND starts_at > ?`,
    )
    .bind(now, now, appointmentId, clientId, appointment.status, now);
  const cancelJob = calendarJobSql(appointmentId, "CANCELLED", now)!;
  const release = releaseFutureSlotSql(appointmentId, now);
  const detach = detachReleasedSlotSql(appointmentId, now);
  const reserve = db
    .prepare(
      `UPDATE availability_slot
       SET state = 'RESERVED', updated_at = ?
       WHERE id = ? AND state = 'OPEN' AND starts_at > ?
       AND EXISTS (
         SELECT 1 FROM user
         WHERE user.id = availability_slot.therapist_id
         AND user.role = 'THERAPIST' AND user.email_verified = 1
         AND user.two_factor_enabled = 1
       )
       AND EXISTS (
         SELECT 1 FROM appointment
         WHERE id = ? AND client_id = ? AND status = 'CANCELLED'
         AND updated_at = ? AND client_hidden_at IS NULL
       )`,
    )
    .bind(now, slotId, now, appointmentId, clientId, now);
  const insert = db
    .prepare(
      `INSERT INTO appointment
       (id, client_id, therapist_id, availability_slot_id, service_code,
        starts_at, ends_at, status, created_at, updated_at)
       SELECT ?, ?, therapist_id, id, 'STANDARD', starts_at, ends_at, 'REQUESTED', ?, ?
       FROM availability_slot
       WHERE id = ? AND state = 'RESERVED' AND changes() = 1`,
    )
    .bind(newAppointmentId, clientId, now, now, slotId);

  const results = await db.batch([cancel, cancelJob, release, detach, reserve, insert]);
  if (results[0].meta.changes === 0) {
    await recordDenied(clientId, appointmentId, "INVALID_STATE_TRANSITION");
    throw new DomainError("Appointment cannot be rescheduled", "CONFLICT");
  }

  defer(processPendingIntegrationJobs(getRuntimeEnv(), 1), "calendar integration");
  await notifyClient(clientId, "CANCELLED");

  const replacement = await getDb().query.appointments.findFirst({
    where: eq(appointments.id, newAppointmentId),
  });
  if (!replacement) {
    return { appointmentId: null, originalAppointmentCancelled: true };
  }

  await notifyTherapist(replacement.therapistId);
  return { appointmentId: replacement.id, originalAppointmentCancelled: false };
}
