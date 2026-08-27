"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import {
  blockOpenAvailability,
  cancelAppointmentForClient,
  transitionAppointmentForStaff,
} from "@/lib/appointment-transitions";
import { createAvailabilitySlot } from "@/lib/appointments";
import { getAuth } from "@/lib/auth";
import { getD1, getDb } from "@/lib/db";
import { findTherapistById, findUserById } from "@/lib/db/repositories";
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
  availabilityFormSchema,
  idSchema,
  parseLocale,
  roleSchema,
} from "@/lib/validation";

function refreshAppointmentViews(locale: "ro" | "en") {
  revalidatePath(`/${locale}/client`);
  revalidatePath(`/${locale}/client/appointments`);
  revalidatePath(`/${locale}/client/book`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/appointments`);
}

export async function createAvailability(localeInput: string, formData: FormData) {
  const locale = parseLocale(localeInput);
  const actor = await requireStaff(locale);
  const input = availabilityFormSchema.parse({
    therapistId: formData.get("therapistId") ?? "",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  if (actor.role === "ADMIN" && !input.therapistId) {
    throw new DomainError("Select a therapist", "INVALID_INPUT");
  }

  const therapistId = actor.role === "ADMIN" ? idSchema.parse(input.therapistId) : actor.id;
  if (therapistId !== actor.id) {
    const therapist = await findTherapistById(therapistId);
    if (!therapist?.emailVerified || !therapist.twoFactorEnabled) {
      throw new DomainError(
        "Availability can only be assigned to an enrolled therapist",
        "INVALID_INPUT",
      );
    }
  }

  await createAvailabilitySlot(therapistId, input.startsAt, input.endsAt);
  refreshAppointmentViews(locale);
}

export async function blockAvailability(localeInput: string, slotIdInput: string) {
  const locale = parseLocale(localeInput);
  const slotId = idSchema.parse(slotIdInput);
  const actor = await requireStaff(locale);
  await blockOpenAvailability(actor, slotId);
  refreshAppointmentViews(locale);
}

export async function updateAppointmentStatus(
  localeInput: string,
  appointmentIdInput: string,
  statusInput: string,
) {
  const locale = parseLocale(localeInput);
  const appointmentId = idSchema.parse(appointmentIdInput);
  const status = appointmentStatusSchema.parse(statusInput);
  const actor = await requireStaff(locale);
  await transitionAppointmentForStaff(actor, appointmentId, status);
  refreshAppointmentViews(locale);
}

export async function cancelOwnAppointment(localeInput: string, appointmentIdInput: string) {
  const locale = parseLocale(localeInput);
  const appointmentId = idSchema.parse(appointmentIdInput);
  const user = await requireClient(locale);
  await cancelAppointmentForClient(user.id, appointmentId);
  refreshAppointmentViews(locale);
}

export async function changeStaffRole(
  localeInput: string,
  targetUserIdInput: string,
  nextRoleInput: string,
) {
  const locale = parseLocale(localeInput);
  const targetUserId = idSchema.parse(targetUserIdInput);
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
  const verification = await getAuth()
    .api.verifyPassword({ headers: requestHeaders, body: { password } })
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
        image: null,
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

  await getAuth().api.signOut({ headers: requestHeaders });
  redirect(`/${locale}`);
}
