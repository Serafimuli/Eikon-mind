"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { getAuth } from "@/lib/auth"
import { createAvailabilitySlot, enqueueCalendarJob } from "@/lib/appointments"
import { getDb } from "@/lib/db"
import {
  accountDeletionRequests,
  accounts,
  appointments,
  availabilitySlots,
  sessions,
  twoFactor,
  users,
  verifications,
} from "@/lib/db/schema"
import { appointmentEmail, sendOperationsEmail, sendTransactionalEmail } from "@/lib/integrations/email"
import { processPendingIntegrationJobs } from "@/lib/integrations/calendar"
import { defer, getRuntimeEnv } from "@/lib/platform-env"
import { isStaff, type Role } from "@/lib/roles"
import { requireAdmin, requireStaff, requireUser } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

type AppointmentStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED"

function formDate(value: FormDataEntryValue | null) {
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date and time")
  return date
}

function refreshAppointmentViews(locale: Locale) {
  revalidatePath(`/${locale}/client`)
  revalidatePath(`/${locale}/client/appointments`)
  revalidatePath(`/${locale}/client/book`)
  revalidatePath(`/${locale}/admin`)
  revalidatePath(`/${locale}/admin/appointments`)
}

export async function createAvailability(locale: Locale, formData: FormData) {
  const actor = await requireStaff(locale)
  const requestedTherapistId = String(formData.get("therapistId") ?? "")
  if (actor.role === "ADMIN" && !requestedTherapistId) throw new Error("Select a therapist")
  const therapistId = actor.role === "ADMIN" && requestedTherapistId ? requestedTherapistId : actor.id
  if (therapistId !== actor.id) {
    const therapist = await getDb().query.users.findFirst({ where: eq(users.id, therapistId) })
    if (therapist?.role !== "THERAPIST" || !therapist.twoFactorEnabled) throw new Error("Availability can only be assigned to an enrolled therapist")
  }
  await createAvailabilitySlot(therapistId, formDate(formData.get("startsAt")), formDate(formData.get("endsAt")))
  refreshAppointmentViews(locale)
}

export async function blockAvailability(locale: Locale, slotId: string) {
  const actor = await requireStaff(locale)
  const db = getDb()
  const slot = await db.query.availabilitySlots.findFirst({ where: eq(availabilitySlots.id, slotId) })
  if (!slot || (actor.role !== "ADMIN" && slot.therapistId !== actor.id)) throw new Error("Unauthorized")
  if (slot.state !== "OPEN") throw new Error("Only open availability can be blocked")
  await db.update(availabilitySlots).set({ state: "BLOCKED", updatedAt: new Date() }).where(eq(availabilitySlots.id, slotId))
  refreshAppointmentViews(locale)
}

export async function updateAppointmentStatus(locale: Locale, id: string, status: AppointmentStatus) {
  if (!["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) throw new Error("Invalid appointment status")
  const actor = await requireStaff(locale)
  const db = getDb()
  const appointment = await db.query.appointments.findFirst({ where: eq(appointments.id, id) })
  if (!appointment) throw new Error("Appointment not found")
  if (actor.role !== "ADMIN" && appointment.therapistId !== actor.id) throw new Error("Unauthorized")
  if (["COMPLETED", "CANCELLED"].includes(appointment.status) && status !== appointment.status) {
    throw new Error("Closed appointments cannot be changed")
  }

  const now = new Date()
  await db.update(appointments).set({
    status,
    cancelledAt: status === "CANCELLED" ? now : null,
    updatedAt: now,
  }).where(eq(appointments.id, id))

  if (status === "CONFIRMED" || status === "CANCELLED") {
    await enqueueCalendarJob(id, status === "CONFIRMED" ? "CALENDAR_UPSERT" : "CALENDAR_CANCEL")
    defer(processPendingIntegrationJobs(getRuntimeEnv(), 1))
    if (appointment.clientId) {
      const client = await db.query.users.findFirst({ where: eq(users.id, appointment.clientId) })
      if (client?.emailVerified) {
        const message = appointmentEmail(status === "CONFIRMED" ? "confirmed" : "cancelled")
        defer(sendTransactionalEmail(getRuntimeEnv(), client.email, message.subject, message.body))
      }
    }
  }
  refreshAppointmentViews(locale)
}

export async function cancelOwnAppointment(locale: Locale, id: string) {
  const user = await requireUser(locale)
  const db = getDb()
  const appointment = await db.query.appointments.findFirst({
    where: and(eq(appointments.id, id), eq(appointments.clientId, user.id)),
  })
  if (!appointment || ["COMPLETED", "CANCELLED"].includes(appointment.status)) throw new Error("Appointment cannot be cancelled")
  const now = new Date()
  await db.update(appointments).set({ status: "CANCELLED", cancelledAt: now, updatedAt: now }).where(eq(appointments.id, id))
  await enqueueCalendarJob(id, "CALENDAR_CANCEL")
  defer(processPendingIntegrationJobs(getRuntimeEnv(), 1))
  if (user.emailVerified) {
    const message = appointmentEmail("cancelled")
    defer(sendTransactionalEmail(getRuntimeEnv(), user.email, message.subject, message.body))
  }
  refreshAppointmentViews(locale)
}

export async function changeStaffRole(locale: Locale, targetUserId: string, nextRole: Role) {
  const actor = await requireAdmin(locale)
  if (targetUserId === actor.id) throw new Error("Use a second administrator for role changes")
  if (!["USER", "THERAPIST", "ADMIN"].includes(nextRole)) throw new Error("Invalid role")
  const db = getDb()
  const target = await db.query.users.findFirst({ where: eq(users.id, targetUserId) })
  if (!target) throw new Error("User not found")
  if (isStaff(nextRole) && (!target.emailVerified || !target.twoFactorEnabled)) {
    throw new Error("Staff must have a verified email address and enrolled TOTP before promotion")
  }
  if (target.role === "ADMIN" && nextRole !== "ADMIN") {
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "ADMIN"))
    if (admins.length < 2) throw new Error("A second administrator is required before demoting the last administrator")
  }
  await db.update(users).set({ role: nextRole, updatedAt: new Date() }).where(eq(users.id, targetUserId))
  defer(sendOperationsEmail(getRuntimeEnv(), "Eikon Mind staff role updated", "A staff role was changed. Review the administration audit and access procedure."))
  revalidatePath(`/${locale}/admin`)
}

export async function requestAccountDeletion(locale: Locale) {
  const user = await requireUser(locale)
  if (isStaff(user.role)) throw new Error("Staff account deletion requires the designated administrator process")
  const db = getDb()
  const now = new Date()
  const anonymizedEmail = `deleted-${user.id}@invalid.local`

  // Authentication access is revoked immediately. Appointment records lose the
  // user link so only de-identified legal-retention data can remain.
  await db.batch([
    db.delete(sessions).where(eq(sessions.userId, user.id)),
    db.delete(accounts).where(eq(accounts.userId, user.id)),
    db.delete(twoFactor).where(eq(twoFactor.userId, user.id)),
    db.delete(verifications).where(eq(verifications.identifier, user.email)),
    db.update(appointments).set({ clientId: null, updatedAt: now }).where(eq(appointments.clientId, user.id)),
    db.update(users).set({
      name: "Deleted account",
      firstName: "Deleted",
      lastName: "Account",
      email: anonymizedEmail,
      emailVerified: false,
      image: null,
      role: "USER",
      twoFactorEnabled: false,
      updatedAt: now,
    }).where(eq(users.id, user.id)),
    db.insert(accountDeletionRequests).values({ id: crypto.randomUUID(), userId: user.id, requestedAt: now }),
  ])
  await getAuth().api.signOut({ headers: await import("next/headers").then((module) => module.headers()) })
  redirect(`/${locale}`)
}

export async function logout(locale: Locale) {
  await getAuth().api.signOut({ headers: await import("next/headers").then((module) => module.headers()) })
  redirect(`/${locale}`)
}
