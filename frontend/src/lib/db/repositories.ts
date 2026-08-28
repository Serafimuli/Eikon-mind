import "server-only";

import { and, asc, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appointments, availabilitySlots, users } from "@/lib/db/schema";

const publicUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  emailVerified: users.emailVerified,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
  twoFactorEnabled: users.twoFactorEnabled,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export async function findUserById(id: string) {
  const [user] = await getDb()
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}

export async function findTherapistById(id: string) {
  const [user] = await getDb()
    .select(publicUserColumns)
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "THERAPIST")))
    .limit(1);
  return user ?? null;
}

export async function listStaffCandidates() {
  return getDb().select(publicUserColumns).from(users).orderBy(asc(users.email));
}

export async function listEnrolledTherapists() {
  return getDb()
    .select(publicUserColumns)
    .from(users)
    .where(
      and(
        eq(users.role, "THERAPIST"),
        eq(users.emailVerified, true),
        eq(users.twoFactorEnabled, true),
      ),
    )
    .orderBy(asc(users.lastName), asc(users.firstName));
}

export async function listOpenAvailability() {
  return getDb()
    .select({
      id: availabilitySlots.id,
      therapistId: availabilitySlots.therapistId,
      startsAt: availabilitySlots.startsAt,
      endsAt: availabilitySlots.endsAt,
      state: availabilitySlots.state,
      createdAt: availabilitySlots.createdAt,
      updatedAt: availabilitySlots.updatedAt,
    })
    .from(availabilitySlots)
    .innerJoin(users, eq(availabilitySlots.therapistId, users.id))
    .where(
      and(
        eq(availabilitySlots.state, "OPEN"),
        gt(availabilitySlots.startsAt, new Date()),
        eq(users.role, "THERAPIST"),
        eq(users.emailVerified, true),
        eq(users.twoFactorEnabled, true),
      ),
    )
    .orderBy(asc(availabilitySlots.startsAt));
}

export async function listUserAppointments(userId: string) {
  return getDb()
    .select()
    .from(appointments)
    .where(and(eq(appointments.clientId, userId), isNull(appointments.clientHiddenAt)))
    .orderBy(desc(appointments.startsAt));
}

export async function findAppointmentForClient(id: string, clientId: string) {
  const [appointment] = await getDb()
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.clientId, clientId),
        isNull(appointments.clientHiddenAt),
      ),
    )
    .limit(1);
  return appointment ?? null;
}
