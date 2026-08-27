import "server-only";

import { and, eq } from "drizzle-orm";
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

function calendarJobSql(appointmentId: string, status: AppointmentStatus, now: number) {
  if (status !== "CONFIRMED" && status !== "CANCELLED") return null;

  const kind = status === "CONFIRMED" ? "CALENDAR_UPSERT" : "CALENDAR_CANCEL";
  return getD1()
    .prepare(
      `INSERT INTO integration_job
       (id, appointment_id, kind, attempts, state, not_before_at, created_at)
       SELECT ?, ?, ?, 0, 'PENDING', ?, ? WHERE changes() = 1
       ON CONFLICT(appointment_id, kind) DO NOTHING`,
    )
    .bind(crypto.randomUUID(), appointmentId, kind, now, now);
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
  const results = await db.batch(job ? [update, job] : [update]);

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
    where: and(eq(appointments.id, appointmentId), eq(appointments.clientId, clientId)),
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
       WHERE id = ? AND client_id = ? AND status IN ('REQUESTED', 'CONFIRMED')`,
    )
    .bind(now, now, appointmentId, clientId);
  const job = calendarJobSql(appointmentId, "CANCELLED", now);
  const results = await db.batch([update, job!]);

  if (results[0].meta.changes === 0) {
    await recordDenied(clientId, appointmentId, "INVALID_STATE_TRANSITION");
    throw new DomainError("Appointment status conflict", "CONFLICT");
  }

  defer(processPendingIntegrationJobs(getRuntimeEnv(), 1), "calendar integration");
  await notifyClient(clientId, "CANCELLED");
}
