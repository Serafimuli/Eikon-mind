import { and, asc, eq, gt } from "drizzle-orm"
import { blockAvailability, createAvailability } from "@/app/[locale]/actions"
import { getDb } from "@/lib/db"
import { availabilitySlots, users } from "@/lib/db/schema"
import { requireStaff } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

export default async function NewAvailability({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const actor = await requireStaff(locale)
  const db = getDb()
  const therapists = actor.role === "ADMIN" ? await db.select().from(users).where(eq(users.role, "THERAPIST")).orderBy(asc(users.lastName)) : []
  const openSlots = await db.select().from(availabilitySlots).where(actor.role === "ADMIN" ? and(eq(availabilitySlots.state, "OPEN"), gt(availabilitySlots.startsAt, new Date())) : and(eq(availabilitySlots.therapistId, actor.id), eq(availabilitySlots.state, "OPEN"), gt(availabilitySlots.startsAt, new Date()))).orderBy(asc(availabilitySlots.startsAt))
  return <main className="private-shell"><form action={createAvailability.bind(null, locale)} className="form-card"><p className="eyebrow">Eikon Mind</p><h1>Add availability</h1>{actor.role === "ADMIN" && <label>Therapist<select name="therapistId" defaultValue="" required><option value="">Select therapist</option>{therapists.map((therapist)=><option value={therapist.id} key={therapist.id}>{therapist.firstName} {therapist.lastName}</option>)}</select></label>}<label>Starts at<input name="startsAt" type="datetime-local" required/></label><label>Ends at<input name="endsAt" type="datetime-local" required/></label><p className="muted">Create only availability times. This form does not collect client or clinical information.</p><button className="button">Publish available time</button></form><section className="section"><h2>{actor.role === "ADMIN" ? "Open availability" : "My open availability"}</h2>{openSlots.map((slot)=><div className="appointment" key={slot.id}>{slot.startsAt.toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}<form action={blockAvailability.bind(null, locale, slot.id)}><button className="icon-button">Block</button></form></div>)}</section></main>
}
