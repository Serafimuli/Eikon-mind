"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import {
  approveTherapistAppointment,
  cancelClientAppointment,
  cancelTherapistCalendarItem,
  createTherapistAppointment,
  createTherapistBusyBlock,
  moveTherapistCalendarItem,
} from "@/lib/calendar-appointments";
import { getAuth } from "@/lib/auth";
import { getD1, getDb } from "@/lib/db";
import { findUserById } from "@/lib/db/repositories";
import {
  accountDeletionRequests,
  accounts,
  appointments,
  securityEvents,
  sessions,
  twoFactor,
  users,
  verifications,
} from "@/lib/db/schema";
import { DomainError } from "@/lib/errors";
import { isStaff } from "@/lib/roles";
import { alertCriticalSecurityEvent, securityEventValues } from "@/lib/security/events";
import { requireAdmin, requireClient, requireStaff, requireUser } from "@/lib/session";
import {
  appointmentStatusSchema,
  betterAuthUserIdSchema,
  parseLocale,
  parseBucharestLocalDateTime,
  resourceIdSchema,
  roleSchema,
} from "@/lib/validation";

function refreshAppointmentViews(locale: "ro" | "en") {
  revalidatePath(`/${locale}/client`);
  revalidatePath(`/${locale}/client/appointments`);
  revalidatePath(`/${locale}/client/book`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/appointments`);
}

function calendarTime(value: FormDataEntryValue | null) {
  const parsed = parseBucharestLocalDateTime(String(value ?? ""));
  if (!parsed) throw new DomainError("Choose a valid Bucharest date and time", "INVALID_INPUT");
  return parsed;
}

async function requireCalendarTherapist(locale: "ro" | "en") {
  const actor = await requireStaff(locale);
  if (actor.role !== "THERAPIST") {
    throw new DomainError(
      "Only the configured therapist can manage this calendar",
      "ACCESS_DENIED",
    );
  }
  const therapists = await getD1()
    .prepare(
      "SELECT id FROM user WHERE role = 'THERAPIST' AND email_verified = 1 AND two_factor_enabled = 1 ORDER BY id LIMIT 2",
    )
    .all<{ id: string }>();
  if (therapists.results.length !== 1 || therapists.results[0].id !== actor.id) {
    throw new DomainError("The single therapist calendar is not configured", "CONFLICT");
  }
  return actor;
}

export async function approveCalendarAppointment(localeInput: string, appointmentIdInput: string) {
  const locale = parseLocale(localeInput);
  await requireCalendarTherapist(locale);
  await approveTherapistAppointment(resourceIdSchema.parse(appointmentIdInput), locale);
  refreshAppointmentViews(locale);
}

export async function moveCalendarItem(
  localeInput: string,
  itemIdInput: string,
  formData: FormData,
) {
  const locale = parseLocale(localeInput);
  await requireCalendarTherapist(locale);
  await moveTherapistCalendarItem(
    resourceIdSchema.parse(itemIdInput),
    calendarTime(formData.get("startsAt")),
    calendarTime(formData.get("endsAt")),
    locale,
  );
  refreshAppointmentViews(locale);
}

export async function cancelCalendarItem(localeInput: string, itemIdInput: string) {
  const locale = parseLocale(localeInput);
  await requireCalendarTherapist(locale);
  await cancelTherapistCalendarItem(resourceIdSchema.parse(itemIdInput), locale);
  refreshAppointmentViews(locale);
}

export async function createCalendarAppointment(localeInput: string, formData: FormData) {
  const locale = parseLocale(localeInput);
  await requireCalendarTherapist(locale);
  await createTherapistAppointment(
    betterAuthUserIdSchema.parse(String(formData.get("clientId") ?? "")),
    calendarTime(formData.get("startsAt")),
    calendarTime(formData.get("endsAt")),
    locale,
  );
  refreshAppointmentViews(locale);
}

export async function createCalendarBusyBlock(localeInput: string, formData: FormData) {
  const locale = parseLocale(localeInput);
  await requireCalendarTherapist(locale);
  await createTherapistBusyBlock(
    calendarTime(formData.get("startsAt")),
    calendarTime(formData.get("endsAt")),
  );
  refreshAppointmentViews(locale);
}

export async function updateAppointmentStatus(
  localeInput: string,
  appointmentIdInput: string,
  statusInput: string,
) {
  const locale = parseLocale(localeInput);
  const appointmentId = resourceIdSchema.parse(appointmentIdInput);
  const status = appointmentStatusSchema.parse(statusInput);
  await requireCalendarTherapist(locale);
  if (status === "CONFIRMED") {
    await approveTherapistAppointment(appointmentId, locale);
  } else if (status === "CANCELLED") {
    const item = await getD1()
      .prepare("SELECT id FROM calendar_managed_item WHERE appointment_id = ?")
      .bind(appointmentId)
      .first<{ id: string }>();
    if (!item) throw new DomainError("Appointment calendar reference not found", "NOT_FOUND");
    await cancelTherapistCalendarItem(item.id, locale);
  } else {
    throw new DomainError(
      "Complete appointments are inferred from their calendar time",
      "INVALID_INPUT",
    );
  }
  refreshAppointmentViews(locale);
}

export async function cancelOwnAppointment(localeInput: string, appointmentIdInput: string) {
  const locale = parseLocale(localeInput);
  const appointmentId = resourceIdSchema.parse(appointmentIdInput);
  const user = await requireClient(locale);
  await cancelClientAppointment(user.id, appointmentId, locale);
  refreshAppointmentViews(locale);
}

export async function deleteOwnAppointment(
  localeInput: string,
  appointmentIdInput: string,
  formData: FormData,
) {
  const locale = parseLocale(localeInput);
  const appointmentId = resourceIdSchema.parse(appointmentIdInput);
  if (formData.get("confirmation") !== "DELETE") {
    throw new DomainError("Appointment deletion was not confirmed", "INVALID_INPUT");
  }

  const user = await requireClient(locale);
  const appointment = await getDb().query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
  });
  if (!appointment || appointment.clientId !== user.id || appointment.clientHiddenAt) {
    throw new DomainError("Appointment not found", "NOT_FOUND");
  }
  if (
    (appointment.status === "REQUESTED" || appointment.status === "CONFIRMED") &&
    appointment.startsAt.getTime() >= Date.now() + 24 * 60 * 60 * 1000
  ) {
    await cancelClientAppointment(user.id, appointmentId, locale);
  }
  await getDb()
    .update(appointments)
    .set({ clientHiddenAt: new Date(), updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));
  refreshAppointmentViews(locale);
  redirect(`/${locale}/client/appointments`);
}

export async function changeStaffRole(
  localeInput: string,
  targetUserIdInput: string,
  nextRoleInput: string,
) {
  const locale = parseLocale(localeInput);
  const targetUserId = betterAuthUserIdSchema.parse(targetUserIdInput);
  const nextRole = roleSchema.parse(nextRoleInput);
  const actor = await requireAdmin(locale);

  if (targetUserId === actor.id) {
    throw new DomainError("Use a second administrator for role changes", "INVALID_INPUT");
  }

  const target = await findUserById(targetUserId);
  if (!target) throw new DomainError("User not found", "NOT_FOUND");
  if (isStaff(nextRole) && (!target.emailVerified || !target.twoFactorEnabled)) {
    throw new DomainError(
      "Staff must have a verified email address and enrolled TOTP before promotion",
      "INVALID_INPUT",
    );
  }
  if (target.role === nextRole) return;

  if (nextRole === "THERAPIST") {
    const existing = await getD1()
      .prepare("SELECT COUNT(*) AS count FROM user WHERE role = 'THERAPIST' AND id <> ?")
      .bind(targetUserId)
      .first<{ count: number }>();
    if ((existing?.count ?? 0) > 0) {
      throw new DomainError("This application supports one therapist calendar", "CONFLICT");
    }
  }

  const now = Date.now();
  const event = securityEventValues({
    eventType: "ROLE_CHANGED",
    severity: "CRITICAL",
    outcome: "SUCCESS",
    actorUserId: actor.id,
    subjectUserId: targetUserId,
  });
  const d1 = getD1();
  const results = await d1.batch([
    d1
      .prepare(
        `UPDATE user SET role = ?, updated_at = ?
         WHERE id = ? AND role <> ? AND (
           role <> 'ADMIN' OR ? = 'ADMIN'
           OR (SELECT COUNT(*) FROM user WHERE role = 'ADMIN') > 1
         )`,
      )
      .bind(nextRole, now, targetUserId, nextRole, nextRole),
    d1
      .prepare(
        `DELETE FROM session WHERE user_id = ?
         AND EXISTS (
           SELECT 1 FROM user WHERE id = ? AND role = ? AND updated_at = ?
         )`,
      )
      .bind(targetUserId, targetUserId, nextRole, now),
    d1
      .prepare(
        `INSERT INTO security_event
         (id, event_type, severity, outcome, actor_user_id, subject_user_id,
          correlation_id, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?
         WHERE EXISTS (
           SELECT 1 FROM user WHERE id = ? AND role = ? AND updated_at = ?
         )`,
      )
      .bind(
        event.id,
        event.eventType,
        event.severity,
        event.outcome,
        event.actorUserId,
        event.subjectUserId,
        event.correlationId,
        event.createdAt.getTime(),
        targetUserId,
        nextRole,
        now,
      ),
  ]);
  if (results[0].meta.changes === 0) {
    throw new DomainError(
      "A second administrator is required before demoting the last administrator",
      "CONFLICT",
    );
  }
  alertCriticalSecurityEvent("ROLE_CHANGED");
  revalidatePath(`/${locale}/admin`);
}

export async function requestAccountDeletion(localeInput: string, formData: FormData) {
  const locale = parseLocale(localeInput);
  const password = String(formData.get("password") ?? "");
  const acknowledgement = String(formData.get("acknowledgement") ?? "");
  if (password.length < 12 || password.length > 128 || acknowledgement !== "DELETE") {
    throw new DomainError("Account deletion confirmation is invalid", "INVALID_INPUT");
  }

  const user = await requireUser(locale);
  if (isStaff(user.role)) {
    throw new DomainError(
      "Staff account deletion requires the designated administrator process",
      "ACCESS_DENIED",
    );
  }

  const requestHeaders = await headers();
  const auth = await getAuth();
  const verification = await auth.api
    .verifyPassword({ headers: requestHeaders, body: { password } })
    .catch(() => ({ status: false }));
  if (!verification.status) {
    throw new DomainError("Account deletion confirmation is invalid", "ACCESS_DENIED");
  }

  const db = getDb();
  const now = new Date();
  const anonymizedEmail = `deleted-${user.id}@invalid.local`;
  await db.batch([
    db.delete(sessions).where(eq(sessions.userId, user.id)),
    db.delete(accounts).where(eq(accounts.userId, user.id)),
    db.delete(twoFactor).where(eq(twoFactor.userId, user.id)),
    db
      .delete(verifications)
      .where(or(eq(verifications.identifier, user.email), eq(verifications.value, user.id))),
    db
      .update(appointments)
      .set({ clientId: null, updatedAt: now })
      .where(eq(appointments.clientId, user.id)),
    db
      .update(users)
      .set({
        name: "Deleted account",
        firstName: "Deleted",
        lastName: "Account",
        email: anonymizedEmail,
        emailVerified: false,
        role: "USER",
        twoFactorEnabled: false,
        updatedAt: now,
      })
      .where(eq(users.id, user.id)),
    db.insert(accountDeletionRequests).values({
      id: crypto.randomUUID(),
      userId: user.id,
      requestedAt: now,
    }),
    db.insert(securityEvents).values(
      securityEventValues({
        eventType: "ACCOUNT_DELETED",
        severity: "INFO",
        outcome: "SUCCESS",
        actorUserId: user.id,
        subjectUserId: user.id,
      }),
    ),
  ]);

  await auth.api.signOut({ headers: requestHeaders });
  redirect(`/${locale}`);
}
