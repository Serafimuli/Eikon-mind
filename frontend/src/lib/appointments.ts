import "server-only"

import { and, eq, gt } from "drizzle-orm"
import { getD1, getDb } from "@/lib/db"
import { appointments, availabilitySlots, integrationJobs } from "@/lib/db/schema"

const SLOT_MINUTES_MIN = 15
const SLOT_MINUTES_MAX = 180

function validSlotWindow(startsAt: Date, endsAt: Date) {
  const minutes = (endsAt.getTime() - startsAt.getTime()) / 60_000
  return startsAt.getTime() > Date.now() && minutes >= SLOT_MINUTES_MIN && minutes <= SLOT_MINUTES_MAX
}

export async function listOpenSlots() {
  return getDb()
    .select()
    .from(availabilitySlots)
    .where(and(eq(availabilitySlots.state, "OPEN"), gt(availabilitySlots.startsAt, new Date())))
    .orderBy(availabilitySlots.startsAt)
}

export async function createAvailabilitySlot(therapistId: string, startsAt: Date, endsAt: Date) {
  if (!validSlotWindow(startsAt, endsAt)) throw new Error("Choose a future slot lasting 15 to 180 minutes")
  const now = new Date()
  await getDb().insert(availabilitySlots).values({
    id: crypto.randomUUID(),
    therapistId,
    startsAt,
    endsAt,
    state: "OPEN",
    createdAt: now,
    updatedAt: now,
  })
}

export async function claimAvailabilitySlot(clientId: string, slotId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(slotId)) throw new Error("Invalid availability slot")
  const appointmentId = crypto.randomUUID()
  const now = Date.now()
  const db = getD1()

  // D1 batch is atomic. INSERT is conditional on the preceding UPDATE's
  // changes(), so exactly one concurrent booking can reserve an OPEN slot.
  await db.batch([
    db.prepare("UPDATE availability_slot SET state = 'RESERVED', updated_at = ? WHERE id = ? AND state = 'OPEN' AND starts_at > ?")
      .bind(now, slotId, now),
    db.prepare(
      `INSERT INTO appointment
       (id, client_id, therapist_id, availability_slot_id, service_code, starts_at, ends_at, status, created_at, updated_at)
       SELECT ?, ?, therapist_id, id, 'STANDARD', starts_at, ends_at, 'REQUESTED', ?, ?
       FROM availability_slot WHERE id = ? AND state = 'RESERVED' AND changes() = 1`,
    ).bind(appointmentId, clientId, now, now, slotId),
  ])

  const appointment = await getDb().query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
  })
  if (!appointment) throw new Error("That slot is no longer available")
  return appointment
}

export async function enqueueCalendarJob(appointmentId: string, kind: "CALENDAR_UPSERT" | "CALENDAR_CANCEL") {
  const now = new Date()
  await getDb().insert(integrationJobs).values({
    id: crypto.randomUUID(),
    appointmentId,
    kind,
    attempts: 0,
    notBeforeAt: now,
    createdAt: now,
  })
}
