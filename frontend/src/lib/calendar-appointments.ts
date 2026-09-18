import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { getD1, getDb } from "@/lib/db";
import { appointments, users } from "@/lib/db/schema";
import { DomainError } from "@/lib/errors";
import { appointmentEmail, sendTransactionalEmail } from "@/lib/integrations/email";
import {
  CalendarConflictError,
  assertGoogleCalendarFree,
  createManagedGoogleEvent,
  deleteManagedGoogleEvent,
  insertManagedItem,
  updateManagedGoogleEvent,
  type ManagedItemKind,
} from "@/lib/integrations/calendar-google";
import { defer, getRuntimeEnv } from "@/lib/platform-env";
import { CLIENT_SLOT_MINUTES, isClientSlot } from "@/lib/calendar-scheduling";

type ActiveAppointmentStatus = "REQUESTED" | "CONFIRMED";
type CalendarItemRow = {
  id: string;
  appointment_id: string | null;
  event_id: string;
  kind: ManagedItemKind;
  etag: string | null;
  starts_at: number;
  ends_at: number;
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | null;
  client_id: string | null;
  therapist_id: string | null;
};

function isActiveAppointmentStatus(
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED",
): status is ActiveAppointmentStatus {
  return status === "REQUESTED" || status === "CONFIRMED";
}

function canClientChange(startsAt: Date) {
  return startsAt.getTime() >= Date.now() + 24 * 60 * 60 * 1000;
}

function calendarFailure(error: unknown): never {
  if (error instanceof CalendarConflictError) {
    throw new DomainError("The calendar changed. Refresh and try again.", "CONFLICT");
  }
  if (error instanceof DomainError) throw error;
  throw new DomainError("The Google Calendar is unavailable. Try again shortly.", "CONFLICT");
}

async function configuredTherapistId() {
  const result = await getD1()
    .prepare(
      "SELECT id FROM user WHERE role = 'THERAPIST' AND email_verified = 1 AND two_factor_enabled = 1 ORDER BY id LIMIT 2",
    )
    .all<{ id: string }>();
  if (result.results.length !== 1) {
    throw new DomainError("The single therapist calendar is not configured", "CONFLICT");
  }
  return result.results[0].id;
}

async function notifyClient(appointmentId: string, kind: "confirmed" | "cancelled" | "updated") {
  const [recipient] = await getDb()
    .select({ email: users.email, emailVerified: users.emailVerified })
    .from(appointments)
    .innerJoin(users, eq(appointments.clientId, users.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);
  if (recipient?.emailVerified) {
    defer(
      sendTransactionalEmail(getRuntimeEnv(), recipient.email, appointmentEmail(kind)),
      "appointment email",
    );
  }
}

async function insertAppointment(input: {
  id: string;
  clientId: string;
  therapistId: string;
  startsAt: Date;
  endsAt: Date;
  status: ActiveAppointmentStatus;
}) {
  const now = Date.now();
  try {
    await getD1()
      .prepare(
        `INSERT INTO appointment
         (id, client_id, therapist_id, availability_slot_id, service_code, starts_at, ends_at, status, created_at, updated_at)
         VALUES (?, ?, ?, NULL, 'STANDARD', ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.clientId,
        input.therapistId,
        input.startsAt.getTime(),
        input.endsAt.getTime(),
        input.status,
        now,
        now,
      )
      .run();
  } catch {
    throw new DomainError("That time is no longer available", "CONFLICT");
  }
}

async function removeUnpublishedAppointment(appointmentId: string) {
  await getD1().prepare("DELETE FROM appointment WHERE id = ?").bind(appointmentId).run();
}

async function createManagedAppointment(input: {
  clientId: string;
  startsAt: Date;
  endsAt: Date;
  status: ActiveAppointmentStatus;
  enforceClientSlot: boolean;
}) {
  const now = new Date();
  if (input.enforceClientSlot && !isClientSlot(input.startsAt, now)) {
    throw new DomainError(
      "Choose a weekday whole-hour appointment at least 24 hours ahead",
      "INVALID_INPUT",
    );
  }
  if (input.endsAt <= input.startsAt)
    throw new DomainError("Appointment end must follow its start", "INVALID_INPUT");
  if (
    input.enforceClientSlot &&
    input.endsAt.getTime() - input.startsAt.getTime() !== CLIENT_SLOT_MINUTES * 60_000
  ) {
    throw new DomainError("Client appointments last one hour", "INVALID_INPUT");
  }
  try {
    await assertGoogleCalendarFree(getRuntimeEnv(), input.startsAt, input.endsAt);
  } catch (error) {
    calendarFailure(error);
  }
  const therapistId = await configuredTherapistId();
  const appointmentId = crypto.randomUUID();
  await insertAppointment({ ...input, id: appointmentId, therapistId });
  let createdEventId: string | undefined;
  try {
    const event = await createManagedGoogleEvent(getRuntimeEnv(), {
      kind: "APPOINTMENT",
      appointmentId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: input.status,
    });
    createdEventId = event.id;
    await insertManagedItem({
      id: crypto.randomUUID(),
      appointmentId,
      eventId: event.id,
      kind: "APPOINTMENT",
      etag: event.etag,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    });
  } catch (error) {
    if (createdEventId) {
      await deleteManagedGoogleEvent(getRuntimeEnv(), createdEventId).catch(() => undefined);
    }
    await removeUnpublishedAppointment(appointmentId);
    calendarFailure(error);
  }
  const appointment = await getDb().query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
  });
  if (!appointment) throw new DomainError("Appointment could not be created", "CONFLICT");
  return appointment;
}

export async function createClientAppointmentRequest(clientId: string, startsAt: Date) {
  return createManagedAppointment({
    clientId,
    startsAt,
    endsAt: new Date(startsAt.getTime() + CLIENT_SLOT_MINUTES * 60_000),
    status: "REQUESTED",
    enforceClientSlot: true,
  });
}

export async function createTherapistAppointment(clientId: string, startsAt: Date, endsAt: Date) {
  const client = await getDb().query.users.findFirst({
    columns: { id: true, role: true, emailVerified: true },
    where: eq(users.id, clientId),
  });
  if (!client || client.role !== "USER" || !client.emailVerified) {
    throw new DomainError("Choose a verified client account", "INVALID_INPUT");
  }
  const appointment = await createManagedAppointment({
    clientId,
    startsAt,
    endsAt,
    status: "CONFIRMED",
    enforceClientSlot: false,
  });
  await notifyClient(appointment.id, "confirmed");
  return appointment;
}

export async function createTherapistBusyBlock(startsAt: Date, endsAt: Date) {
  if (startsAt <= new Date() || endsAt <= startsAt) {
    throw new DomainError("Choose a valid future busy period", "INVALID_INPUT");
  }
  try {
    const event = await createManagedGoogleEvent(getRuntimeEnv(), {
      kind: "BLOCK",
      startsAt,
      endsAt,
      status: "CONFIRMED",
    });
    const id = crypto.randomUUID();
    await insertManagedItem({
      id,
      eventId: event.id,
      kind: "BLOCK",
      etag: event.etag,
      startsAt,
      endsAt,
    });
    return id;
  } catch (error) {
    calendarFailure(error);
  }
}

async function findManagedItem(itemId: string) {
  const row = await getD1()
    .prepare(
      `SELECT i.id, i.appointment_id, i.event_id, i.kind, i.etag, i.starts_at, i.ends_at,
              a.status, a.client_id, a.therapist_id
       FROM calendar_managed_item i
       LEFT JOIN appointment a ON a.id = i.appointment_id
       WHERE i.id = ?`,
    )
    .bind(itemId)
    .first<CalendarItemRow>();
  if (!row) throw new DomainError("Calendar item not found", "NOT_FOUND");
  return row;
}

export async function approveTherapistAppointment(appointmentId: string) {
  const item = await getD1()
    .prepare(
      `SELECT i.id, i.appointment_id, i.event_id, i.kind, i.etag, i.starts_at, i.ends_at,
              a.status, a.client_id, a.therapist_id
       FROM calendar_managed_item i JOIN appointment a ON a.id = i.appointment_id
       WHERE i.appointment_id = ?`,
    )
    .bind(appointmentId)
    .first<CalendarItemRow>();
  if (!item || item.status !== "REQUESTED")
    throw new DomainError("Appointment cannot be approved", "CONFLICT");
  try {
    const event = await updateManagedGoogleEvent(
      getRuntimeEnv(),
      item.event_id,
      { status: "CONFIRMED" },
      item.etag,
    );
    const now = Date.now();
    await getD1().batch([
      getD1()
        .prepare(
          "UPDATE appointment SET status = 'CONFIRMED', updated_at = ? WHERE id = ? AND status = 'REQUESTED'",
        )
        .bind(now, appointmentId),
      getD1()
        .prepare("UPDATE calendar_managed_item SET etag = ?, updated_at = ? WHERE id = ?")
        .bind(event.etag ?? null, now, item.id),
    ]);
  } catch (error) {
    calendarFailure(error);
  }
  await notifyClient(appointmentId, "confirmed");
}

export async function moveTherapistCalendarItem(itemId: string, startsAt: Date, endsAt: Date) {
  if (startsAt <= new Date() || endsAt <= startsAt)
    throw new DomainError("Choose a valid future period", "INVALID_INPUT");
  const item = await findManagedItem(itemId);
  try {
    const event = await updateManagedGoogleEvent(
      getRuntimeEnv(),
      item.event_id,
      { startsAt, endsAt },
      item.etag,
    );
    const now = Date.now();
    const statements = [
      getD1()
        .prepare(
          "UPDATE calendar_managed_item SET etag = ?, starts_at = ?, ends_at = ?, updated_at = ? WHERE id = ?",
        )
        .bind(event.etag ?? null, startsAt.getTime(), endsAt.getTime(), now, itemId),
    ];
    if (item.appointment_id) {
      statements.push(
        getD1()
          .prepare("UPDATE appointment SET starts_at = ?, ends_at = ?, updated_at = ? WHERE id = ?")
          .bind(startsAt.getTime(), endsAt.getTime(), now, item.appointment_id),
      );
    }
    await getD1().batch(statements);
  } catch (error) {
    calendarFailure(error);
  }
  if (item.appointment_id) await notifyClient(item.appointment_id, "updated");
}

export async function cancelTherapistCalendarItem(itemId: string) {
  const item = await findManagedItem(itemId);
  try {
    await deleteManagedGoogleEvent(getRuntimeEnv(), item.event_id, item.etag);
  } catch (error) {
    calendarFailure(error);
  }
  const now = Date.now();
  if (item.appointment_id) {
    await getD1().batch([
      getD1()
        .prepare(
          "UPDATE appointment SET status = 'CANCELLED', cancelled_at = ?, updated_at = ? WHERE id = ? AND status IN ('REQUESTED', 'CONFIRMED')",
        )
        .bind(now, now, item.appointment_id),
      getD1().prepare("DELETE FROM calendar_managed_item WHERE id = ?").bind(itemId),
    ]);
    await notifyClient(item.appointment_id, "cancelled");
  } else {
    await getD1().prepare("DELETE FROM calendar_managed_item WHERE id = ?").bind(itemId).run();
  }
}

export async function cancelClientAppointment(clientId: string, appointmentId: string) {
  const appointment = await getDb().query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.clientId, clientId),
      isNull(appointments.clientHiddenAt),
    ),
  });
  if (!appointment) throw new DomainError("Appointment not found", "NOT_FOUND");
  if (!isActiveAppointmentStatus(appointment.status) || !canClientChange(appointment.startsAt)) {
    throw new DomainError("This appointment can no longer be cancelled online", "CONFLICT");
  }
  const item = await getD1()
    .prepare("SELECT id FROM calendar_managed_item WHERE appointment_id = ?")
    .bind(appointmentId)
    .first<{ id: string }>();
  if (!item) throw new DomainError("Appointment calendar reference not found", "CONFLICT");
  await cancelTherapistCalendarItem(item.id);
}

export async function rescheduleClientAppointment(
  clientId: string,
  appointmentId: string,
  startsAt: Date,
) {
  const existing = await getDb().query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.clientId, clientId),
      isNull(appointments.clientHiddenAt),
    ),
  });
  if (!existing) throw new DomainError("Appointment not found", "NOT_FOUND");
  if (!isActiveAppointmentStatus(existing.status) || !canClientChange(existing.startsAt)) {
    throw new DomainError("This appointment can no longer be rescheduled online", "CONFLICT");
  }
  const replacement = await createClientAppointmentRequest(clientId, startsAt);
  const oldItem = await getD1()
    .prepare("SELECT id FROM calendar_managed_item WHERE appointment_id = ?")
    .bind(appointmentId)
    .first<{ id: string }>();
  if (!oldItem) throw new DomainError("Appointment calendar reference not found", "CONFLICT");
  try {
    await cancelTherapistCalendarItem(oldItem.id);
  } catch (error) {
    const replacementItem = await getD1()
      .prepare("SELECT id FROM calendar_managed_item WHERE appointment_id = ?")
      .bind(replacement.id)
      .first<{ id: string }>();
    if (replacementItem)
      await cancelTherapistCalendarItem(replacementItem.id).catch(() => undefined);
    throw error;
  }
  return replacement;
}
